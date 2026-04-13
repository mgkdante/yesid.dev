# Slice 17a-3b — Token Wiring + Normalization

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session (~8 tasks)
**Depends on:** 17a-3a (Color Lockdown)
**Branch:** `feature/slice-17a-3b-token-wiring`
**Design spec:** `docs/specs/slice-17a-3-color-token-lockdown-design.md`

## Objective

Wire all 22 unused token categories (z-index, shadows, transitions, opacity, etc.) into their consumers and normalize inconsistencies (pill radius, font stacks, unadopted utilities).

## Context

Slice 17a-1 defined 22 token categories in tokens.css. Slice 17a-3a locked down all color values. But components still bypass the token system for z-index (43 raw integers), box-shadows (30 inline values), transitions (46 hardcoded durations/easings), opacity (45 raw values), font stacks (23 literal strings), and pill radii (10 inconsistent values). Wiring these completes the design system foundation — every visual property flows through tokens.

## Architecture

- **Category-first sweep** — one task per token category across all files
- **tokens.css** already defines all tokens — this slice only wires consumers
- **No new tokens** — all 22 categories exist, just unused
- **Mapping is mechanical** — raw value → closest token match

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, CSS custom properties

## File Structure

### Modified Files

```
~40 .svelte files across src/lib/components/ and src/routes/
```

### No New Files

All tokens already exist. This slice wires consumers.

---

## Task T1: Z-index → --z-* tokens (43 values / 14 files)

**Files:**
- Modify: Manifesto, HomeCloser, tech-stack/+page, ServiceListingPage, MenuOverlay, Nav, InfraFrame, ManifestoCanvas, HomeServices, StackBottomSheet, StackConnections, StackDiagram, brand/NumberBadge, brand/CornerMarks

- [ ] **Step 1: Replace all raw `z-index: N` with `z-index: var(--z-*)`**
  Mapping:
  - `z-index: 0` → `var(--z-base)`
  - `z-index: 1-2` → `var(--z-content)`
  - `z-index: 10-30` → `var(--z-rail)` (scroll-linked elements)
  - `z-index: 40` → `var(--z-footer)`
  - `z-index: 50` → `var(--z-sheet)` (overlays, bottom sheets)
  - `z-index: 60` → `var(--z-menu)` (menu overlay)
  - `z-index: 70+` → `var(--z-nav)` (always on top)
  
  Context matters — check what the element IS, not just its number. A nav at `z-index: 50` should use `--z-nav`, not `--z-sheet`.

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify overlapping elements render in correct stacking order.**

---

## Task T2: Box-shadow → --shadow-* tokens (30 values / 23 files)

**Files:**
- Modify: All files with `box-shadow:` declarations (see audit)

- [ ] **Step 1: Replace inline box-shadow values with token references**
  Mapping:
  - Small brand glow → `var(--shadow-glow-sm)`
  - Medium brand glow → `var(--shadow-glow-md)`
  - Large brand glow → `var(--shadow-glow-lg)`
  - Card hover shadow → `var(--shadow-card)`
  - Section shadow → `var(--shadow-section)`
  - Nav shadow → `var(--shadow-nav)`
  - Status indicator glow → `var(--shadow-status)`
  
  Some box-shadows are unique to their component (e.g., Manifesto glass effects). If no token fits, leave as-is and document.

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify shadow effects on cards, nav, and glow elements.**

---

## Task T3: Transitions → --duration-* + --ease-* tokens (46 values / 20 files)

**Files:**
- Modify: All files with hardcoded `transition:` durations and easings

- [ ] **Step 1: Replace hardcoded transition durations**
  Mapping:
  - `0.15s` / `150ms` → `var(--duration-fast)`
  - `0.2s` / `200ms` → `var(--duration-normal)`
  - `0.25s` / `250ms` → `var(--duration-normal)` (close enough, no --duration-snappy needed yet)
  - `0.3s` / `300ms` → `var(--duration-slow)`
  - `0.5s` / `500ms` → `var(--duration-slower)`

- [ ] **Step 2: Replace hardcoded easing functions**
  Mapping:
  - `ease` → `var(--ease-default)`
  - `ease-out` → `var(--ease-default)` (functionally similar for UI transitions)
  - `ease-in-out` → `var(--ease-default)` (normalize to one default)
  - Bouncy/springy → `var(--ease-bounce)`
  - Decelerate → `var(--ease-decel)`

- [ ] **Step 3: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify hover/transition animations feel identical.**

---

## Task T4: Opacity → --opacity-* tokens (45 values / 19 files)

**Files:**
- Modify: All files with `opacity: 0.X` declarations

- [ ] **Step 1: Replace raw opacity values with token references**
  Mapping:
  - `opacity: 0.5-0.7` → `var(--opacity-muted)` (0.6)
  - `opacity: 0.2-0.4` → `var(--opacity-dim)` (0.3)
  - `opacity: 0.1-0.2` → `var(--opacity-subtle)` (0.15)
  - `opacity: 0.03-0.08` → `var(--opacity-faint)` (0.05)
  
  Exact match not required — use closest token. If opacity is part of a GSAP animation (dynamic), leave as-is.

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify opacity effects (fades, overlays, muted elements).**

---

## Task T5: Pill radius → --radius-pill (10 values / 8 files)

**Files:**
- Modify: GradientSeparator, Manifesto, Nav, ProjectMiniCard, ServiceCard, StackBottomSheet, StackFilters, brand/NumberBadge

- [ ] **Step 1: Replace all `999px`, `9999px`, `99999px` with `var(--radius-pill)`**
  Already defined in tokens.css as `--radius-pill: 9999px`.

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify pill-shaped elements (tags, badges, buttons).**

---

## Task T6: Font stacks → var(--font-*) (23 values / 12 files)

**Files:**
- Modify: All files with literal `'JetBrains Mono', monospace` or `'Inter', sans-serif`

- [ ] **Step 1: Replace hardcoded font-family declarations**
  Mapping:
  - `'JetBrains Mono', 'Fira Code', ...` → `var(--font-mono)`
  - `'JetBrains Mono', monospace` → `var(--font-mono)`
  - `'Inter', sans-serif` → `var(--font-heading)` or `var(--font-body)`
  
  In Tailwind classes: `font-[JetBrains_Mono]` → `font-mono`

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify mono and heading fonts render correctly.**

---

## Task T7: Wire unadopted utilities (9+ values / 4+ files)

**Files:**
- Modify: `src/lib/components/BlogFilterMobile.svelte`
- Modify: `src/lib/components/BlogFilterSidebar.svelte`
- Modify: `src/lib/components/WorkFilterSidebar.svelte`
- Modify: `src/lib/components/WorkFilterMobile.svelte`
- Modify: `src/lib/components/Footer.svelte` (if .brand-fade-line applicable)
- Modify: `src/lib/components/WorkDetailSidebar.svelte` (if .brand-fade-line applicable)

- [ ] **Step 1: Replace `border-dashed border-[#333]` with `.divider-dashed` utility class**
  9 occurrences across 4 filter files.

- [ ] **Step 2: Check if Footer/WorkDetailSidebar can use `.brand-fade-line`**
  If they rebuild `linear-gradient(90deg, var(--brand-primary), transparent)` inline, replace with the utility.

- [ ] **Step 3: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify filter dividers and fade lines.**

---

## Task T8: Container/radius-xl + final sweep

**Files:**
- Modify: Any remaining files with raw `max-width` or `border-radius: 16px`
- Modify: Any files missed in T1-T7

- [ ] **Step 1: Wire --container-wide/prose where raw max-width values exist**
- [ ] **Step 2: Wire --radius-xl (16px) where applicable**
- [ ] **Step 3: Final grep sweep for remaining raw values**
  Check for: raw z-index, inline box-shadow, hardcoded `0.3s`, raw `opacity: 0.X`, literal font stacks, `999px`.
- [ ] **Step 4: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid for final verification.**

---

## Execution Order

Sequential: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T8 is the sweep/cleanup pass — must be last.

## Out of Scope

- Color migration (done in 17a-3a)
- Component API changes (17d)
- Dead code removal (17a-4)
- New token definitions (all tokens already exist)
- Light theme toggle UI

## Acceptance Criteria

- [ ] All 7 z-index tokens have consumer references (zero raw z-index integers outside GSAP)
- [ ] All 7 shadow tokens have consumer references (zero inline box-shadow for standard patterns)
- [ ] All 4 transition/duration tokens have consumer references (zero hardcoded `0.3s`)
- [ ] All 4 opacity tokens have consumer references (zero raw `opacity: 0.X` outside GSAP)
- [ ] All pill radii use --radius-pill (zero `999px` / `9999px`)
- [ ] All font-family declarations use var(--font-*) (zero literal font stacks)
- [ ] .divider-dashed utility adopted (zero `border-dashed border-[#333]`)
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Learn

### Design Token Layering
**What it is:** A system where raw design values (colors, spacing, shadows) are defined once in tokens, then consumed everywhere via `var()` references. No component knows the actual value — only the token name.
**Why it matters:** Change `--duration-normal: 200ms` to `--duration-normal: 150ms` in tokens.css → every transition in the site speeds up. One change, global effect.
**Try this:** Change `--z-nav: 70` to `--z-nav: 0` and watch the nav disappear behind content. Then restore it.
**Go deeper:** https://css-tricks.com/what-are-design-tokens/

## Verify

1. `bun run test` — all tests pass
2. `bun run check` — zero errors
3. Grep sweep: no raw z-index, box-shadow, opacity, font-family, transition duration outside tokens/GSAP
4. Visual comparison: site looks and animates identically before and after
5. All 22 token categories show consumer references in a codebase search
