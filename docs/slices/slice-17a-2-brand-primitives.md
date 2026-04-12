# Slice 17a-2 — Brand Primitives

**Status:** ready
**Priority:** 1
**Estimated effort:** 4 sessions (2 build + 2 wire)
**Depends on:** 17a-1 (Token Foundation) — merged PR #2

## Objective

Build 15 brand primitive components, 12 utility classes, enhance the cursorGlow action, and consolidate global keyframes — then wire them into all consuming components across the codebase.

## Context

17a-1 established the token foundation (type scale, shadows, z-index, transitions, opacity, containers, radius). 17a-2 builds the **component layer** on top of those tokens — reusable primitives that replace 100+ instances of duplicated brand patterns. This is the largest DRY effort in the standardization arc.

Research audit: `docs/research/2026-04-11-slice-17a-2-brand-primitives-audit.md`
Design spec: `docs/specs/2026-04-11-slice-17-standardization-design.md` (Section 7.2)
Audit reference: `docs/reference/AUDIT-SLICE-17.md` (Sections 2, 3)

## Architecture

### Two-phase approach

- **Phase A (17a-2a):** Build all primitives, utility classes, action enhancement, keyframes. Creation only — no existing components modified beyond token fixes.
- **Phase B (17a-2b):** Wire primitives into all consuming components. Search-and-replace refactoring, one pattern at a time.

### Component location

Brand primitives → `src/lib/components/brand/`
Each primitive exports its Props interface.

## Tech Stack

SvelteKit 2 + Svelte 5 (runes), TypeScript, Tailwind CSS v4, Vitest + @testing-library/svelte

## File Structure

### New Files (Phase A)

```
src/lib/components/brand/                     — CREATE: directory
src/lib/components/brand/StatusDot.svelte     — CREATE: pulsing status indicator
src/lib/components/brand/SectionLabel.svelte  — CREATE: mono uppercase label (3 variants)
src/lib/components/brand/StopLabel.svelte     — CREATE: metro stop marker with LED
src/lib/components/brand/Tag.svelte           — CREATE: tech tag pill
src/lib/components/brand/NumberBadge.svelte   — CREATE: numbered circle
src/lib/components/brand/ChevronToggle.svelte — CREATE: rotatable expand/collapse arrow
src/lib/components/brand/HazardStripe.svelte  — CREATE: repeating diagonal stripe
src/lib/components/brand/GlowOverlay.svelte   — CREATE: cursor-following radial gradient
src/lib/components/brand/MetricDisplay.svelte — CREATE: big number + label stat combo
src/lib/components/brand/BrandButton.svelte   — CREATE: primary/ghost CTA (3 sizes)
src/lib/components/brand/CardBase.svelte      — CREATE: card with hover/glow foundation
src/lib/components/brand/CornerMarks.svelte   — CREATE: blueprint corner tick marks
src/lib/components/brand/TerminalChrome.svelte— CREATE: terminal window with title bar
src/lib/components/brand/StickyPanel.svelte   — CREATE: sidebar with scroll and border
src/lib/components/brand/index.ts             — CREATE: barrel export
src/lib/components/brand/__tests__/           — CREATE: test directory
```

### Modified Files (Phase A)

```
src/lib/styles/tokens.css                     — MODIFY: add --brand-primary-rgb, --brand-accent-rgb, --text-micro
src/app.css                                   — MODIFY: add --text-micro to @theme, 12 utility classes, 2 global keyframes
src/lib/motion/actions/cursorGlow.ts          — MODIFY: auto-inject overlay DOM element
src/lib/components/GradientSeparator.svelte   — MODIFY: hex → token references
src/lib/components/TerminalCursor.svelte      — MODIFY: minor (remove scoped blink if present)
```

### Deleted Files (pre-work)

```
src/lib/components/BlogFeed.svelte            — DELETE: unused (34 lines)
src/lib/components/FeaturedWork.svelte        — DELETE: unused (34 lines)
src/lib/components/Hero.svelte                — DELETE: unused (48 lines)
src/lib/components/ProjectGrid.svelte         — DELETE: unused (29 lines)
src/lib/components/ScrollPrompt.svelte        — DELETE: unused (33 lines)
src/lib/components/ServiceStation.svelte      — DELETE: unused (163 lines)
src/lib/components/SkillsJourney.svelte       — DELETE: unused (983 lines)
src/lib/components/StationDivider.svelte      — DELETE: unused (30 lines)
```

### Modified Files (Phase B — wiring)

All files that currently contain duplicated brand patterns. Key targets:

```
# GlowOverlay wiring (12 files)
src/lib/components/About*.svelte (9 files)    — MODIFY: remove manual overlay divs
src/lib/components/BlogRow.svelte             — MODIFY: remove manual overlay div
src/lib/components/WorkCard.svelte            — MODIFY: remove manual overlay div
src/lib/components/ProjectMiniCard.svelte     — MODIFY: remove manual overlay div

# HazardStripe wiring (8 files)
src/lib/components/InfraFrame.svelte          — MODIFY: use HazardStripe
src/lib/components/HeroBanner.svelte          — MODIFY: use HazardStripe
src/lib/components/HomeCloser.svelte          — MODIFY: use HazardStripe
src/lib/components/Manifesto.svelte           — MODIFY: use HazardStripe
src/lib/components/ProofStrip.svelte          — MODIFY: use HazardStripe
src/routes/+page.svelte                       — MODIFY: use HazardStripe
src/routes/+error.svelte                      — MODIFY: use HazardStripe
src/routes/tech-stack/+page.svelte            — MODIFY: use HazardStripe

# StatusDot wiring (8+ files)
# SectionLabel wiring (25+ files)
# Tag wiring (8+ files)
# TerminalChrome wiring (4 files)
# CardBase wiring (12+ files)
# BrandButton wiring (7+ files)
# Blink keyframe consolidation (3 files)
# Pulse-glow keyframe consolidation (6 files)
```

---

## Phase A Tasks (Build)

### Task 0: Foundation pre-work

**Files:**
- Modify: `src/lib/styles/tokens.css`, `src/app.css`
- Delete: 8 dead components + their test files

- [ ] Add `--brand-primary-rgb: 224 120 0` and `--brand-accent-rgb: 255 182 39` to tokens.css `:root`
- [ ] Add `--text-micro: 0.625rem` (10px) to both tokens.css and app.css @theme
- [ ] Add 2 global `@keyframes` to app.css: `blink` and `pulse-glow`
- [ ] Add 12 utility classes to app.css (see Section 10 of research audit)
- [ ] Delete 8 unused components and their test files
- [ ] Create `src/lib/components/brand/` directory
- [ ] Run `bun run test` and `bun run check`

**STOP. Ask Yesid to verify.**

---

### Task 1: StatusDot

**Files:**
- Create: `src/lib/components/brand/StatusDot.svelte`
- Test: `src/lib/components/brand/__tests__/StatusDot.test.ts`

- [ ] Build component: `color: 'orange' | 'green'`, `pulse?: boolean`, `size?: 'sm' | 'md'`
- [ ] Uses `var(--brand-primary)` / `var(--status-success)` and `.led-pulse` global keyframe
- [ ] Write tests
- [ ] Run `bun run test` and `bun run check`

**STOP.**

---

### Task 2: SectionLabel

**Files:**
- Create: `src/lib/components/brand/SectionLabel.svelte`
- Test: `src/lib/components/brand/__tests__/SectionLabel.test.ts`

- [ ] Build component: `text`, `variant: 'section' | 'station' | 'metric'`, `align?: 'left' | 'center'`
- [ ] Each variant maps to the corresponding `.label-*` utility class
- [ ] Write tests
- [ ] Run `bun run test` and `bun run check`

**STOP.**

---

### Task 3: StopLabel

**Files:**
- Create: `src/lib/components/brand/StopLabel.svelte`
- Test: `src/lib/components/brand/__tests__/StopLabel.test.ts`

- [ ] Build component: `stop: string`, `label: string`
- [ ] Renders `STOP {stop} — {label}` with pulsing LED dot via `::before`
- [ ] Uses `.led-pulse` keyframe and `--brand-primary` token
- [ ] Write tests

**STOP.**

---

### Task 4: Tag

**Files:**
- Create: `src/lib/components/brand/Tag.svelte`
- Test: `src/lib/components/brand/__tests__/Tag.test.ts`

- [ ] Build component: `text`, `size?: 'xs' | 'sm'`, `active?`, `accentColor?`, `interactive?`
- [ ] Pill shape with mono font, border, optional active state with brand tint
- [ ] Write tests

**STOP.**

---

### Task 5: NumberBadge

**Files:**
- Create: `src/lib/components/brand/NumberBadge.svelte`
- Test: `src/lib/components/brand/__tests__/NumberBadge.test.ts`

- [ ] Build component: `value: number`, `color?`, `sonar?: boolean`
- [ ] Zero-padded number in colored circle, optional sonar ping animation
- [ ] Write tests

**STOP.**

---

### Task 6: ChevronToggle

**Files:**
- Create: `src/lib/components/brand/ChevronToggle.svelte`
- Test: `src/lib/components/brand/__tests__/ChevronToggle.test.ts`

- [ ] Build component: `open: boolean`, `size?: 'sm' | 'md'`, `direction?: 'right' | 'down'`
- [ ] SVG arrow with CSS rotation transition
- [ ] Write tests

**STOP.**

---

### Task 7: HazardStripe

**Files:**
- Create: `src/lib/components/brand/HazardStripe.svelte`
- Test: `src/lib/components/brand/__tests__/HazardStripe.test.ts`

- [ ] Build component: `size?: 'sm' | 'md' | 'lg'` (6/8/12px), `angle?: number`, `label?: string`
- [ ] Uses `var(--brand-accent)` and `var(--bg-primary)` for stripe colors
- [ ] Write tests

**STOP.**

---

### Task 8: GlowOverlay + cursorGlow enhancement

**Files:**
- Create: `src/lib/components/brand/GlowOverlay.svelte`
- Modify: `src/lib/motion/actions/cursorGlow.ts`
- Test: `src/lib/components/brand/__tests__/GlowOverlay.test.ts`

- [ ] Build GlowOverlay component (standalone usage)
- [ ] Enhance cursorGlow action to auto-inject overlay DOM element
- [ ] Action sets `position: relative; overflow: hidden` on node if needed
- [ ] Action creates overlay div with radial-gradient using `--glow-x`/`--glow-y` and `--brand-primary-rgb`
- [ ] Cleanup in `destroy()` removes injected element
- [ ] Write tests

**STOP.**

---

### Task 9: MetricDisplay

**Files:**
- Create: `src/lib/components/brand/MetricDisplay.svelte`
- Test: `src/lib/components/brand/__tests__/MetricDisplay.test.ts`

- [ ] Build component: `value: string`, `label: string`, `sublabel?: string`, `size?: 'sm' | 'md' | 'lg'`
- [ ] Mono heading number in brand color, small label below, optional sublabel
- [ ] Write tests

**STOP.**

---

### Task 10: BrandButton

**Files:**
- Create: `src/lib/components/brand/BrandButton.svelte`
- Test: `src/lib/components/brand/__tests__/BrandButton.test.ts`

- [ ] Build component: `variant: 'primary' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, `href?: string`
- [ ] Renders `<a>` if href, `<button>` if not
- [ ] Primary: `bg-brand-primary text-[var(--bg-primary)]` with hover lift
- [ ] Ghost: `border border-[var(--border)] hover:border-brand-primary hover:text-brand-primary`
- [ ] Consistent radius (`rounded-lg`), transition, focus ring
- [ ] `children` snippet for content
- [ ] Write tests

**STOP.**

---

### Task 11: CardBase

**Files:**
- Create: `src/lib/components/brand/CardBase.svelte`
- Test: `src/lib/components/brand/__tests__/CardBase.test.ts`

- [ ] Build component: `hover?: boolean`, `glow?: boolean`, `interactive?: boolean`, `padding?: 'sm' | 'md' | 'lg'`
- [ ] Base: `rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]`
- [ ] Hover: `.brand-glow-hover` effect
- [ ] Glow: when `glow={true}`, applies `use:cursorGlow` (with auto-injected overlay). Opt-in, not default.
- [ ] Interactive: renders as `<a>` or adds cursor-pointer
- [ ] `children` snippet
- [ ] Write tests

**STOP.**

---

### Task 12: CornerMarks

**Files:**
- Create: `src/lib/components/brand/CornerMarks.svelte`
- Test: `src/lib/components/brand/__tests__/CornerMarks.test.ts`

- [ ] Build component: `size?: 'sm' | 'md'` (12px / 32px arms), `opacity?: number`
- [ ] Four absolute-positioned pseudo-elements at corners using `var(--brand-primary)`
- [ ] Write tests

**STOP.**

---

### Task 13: TerminalChrome

**Files:**
- Create: `src/lib/components/brand/TerminalChrome.svelte`
- Test: `src/lib/components/brand/__tests__/TerminalChrome.test.ts`

- [ ] Build component: `title: string`, `tag?: string`, `status?: string`, `footer?: Array<{label, value}>`, `children` snippet
- [ ] Title bar with StatusDot LED + HazardStripe accent
- [ ] Body slot for content
- [ ] Optional footer with metric values
- [ ] Uses existing TerminalCursor for cursor display
- [ ] All colors via tokens — zero hardcoded hex
- [ ] Write tests

**STOP.**

---

### Task 14: StickyPanel

**Files:**
- Create: `src/lib/components/brand/StickyPanel.svelte`
- Test: `src/lib/components/brand/__tests__/StickyPanel.test.ts`

- [ ] Build component: `top?: string`, `children` snippet
- [ ] Sticky positioning, border, scrollbar-hidden, brand-consistent styling
- [ ] Write tests

**STOP.**

---

### Task 15: GradientSeparator token fix

**Files:**
- Modify: `src/lib/components/GradientSeparator.svelte`

- [ ] Replace `#E07800` → `var(--brand-primary)`, `#FFB627` → `var(--brand-accent)`
- [ ] Replace label `text-[#E07800]` → `text-brand-primary`
- [ ] Replace `maxWidth` default → `var(--container-content)`
- [ ] Run tests

**STOP.**

---

### Task 16: Barrel export + integration test

**Files:**
- Create: `src/lib/components/brand/index.ts`
- Create: `src/lib/components/brand/__tests__/barrel.test.ts`

- [ ] Export all 15 primitives from barrel
- [ ] Write integration test verifying all exports exist
- [ ] Run full test suite: `bun run test` and `bun run check`
- [ ] Update `docs/reference/CSS.md` with all new utility classes, keyframes, and token additions

**STOP.**

---

## Phase B Tasks (Wire)

Each task wires ONE primitive into ALL its consuming files. One task = one pattern replacement = one approval cycle.

### Task W1: Wire StatusDot (8+ files)
### Task W2: Wire SectionLabel utility classes (25+ files)
### Task W3: Wire StopLabel into About bento (10 files)
### Task W4: Wire Tag into consumers (8+ files)
### Task W5: Wire ChevronToggle into CollapsibleSection, FilterGroup, TableOfContents (4 files)
### Task W6: Wire HazardStripe into consumers (8 files)
### Task W7: Wire cursorGlow auto-inject — remove manual overlay divs (12 files)
### Task W8: Wire BrandButton into CTA locations (7+ files)
### Task W9: Wire CardBase into card components (12+ files)
### Task W10: Wire TerminalChrome into ContactPage, AboutCta, HomeCloser (4 files)
### Task W11: Wire CornerMarks into InfraFrame, HomeServices (2 files)
### Task W12: Wire MetricDisplay into stat locations (6 files)
### Task W13: Wire .bento-card utility into About cards (12 files)
### Task W14: Wire .prose-dark into BlogContent + WorkDetailPage (2 files)
### Task W15: Consolidate blink + pulse-glow keyframes — remove component-level duplicates (9 files)
### Task W16: Wire StickyPanel into sidebar components (4 files)
### Task W17: Wire NumberBadge into consumers (3 files)

---

## Execution Order

**Phase A (build):** Sequential, Task 0 → 1 → 2 → ... → 16. Simple primitives first, complex last (TerminalChrome composes StatusDot + HazardStripe so must come after).

**Phase B (wire):** Sequential per task, but tasks are independent. Start with highest-impact (StatusDot, SectionLabel, cursorGlow overlay removal).

## Out of Scope

- Replacing hardcoded hex colors in consuming components (17a-3)
- Service layer extraction / $lib/data imports (17b)
- Shared UI shells like ListingShell, FilterMobile (17d)
- GSAP $effect() cleanup (17e)
- Splitting large monolith components (17d)
- A11y warning fixes (17d)

## Acceptance Criteria

- [ ] `src/lib/components/brand/` exists with 15 primitives + barrel export
- [ ] All primitives use tokens — zero hardcoded hex
- [ ] All primitives export their Props interface
- [ ] `cursorGlow` action auto-injects overlay (12 manual divs eliminated)
- [ ] Global `@keyframes blink` and `pulse-glow` in app.css (no component-level duplicates)
- [ ] 12 utility classes defined in app.css
- [ ] `--brand-primary-rgb` and `--text-micro` tokens added
- [ ] 8 dead components removed
- [ ] All consuming components use primitives (zero brand pattern duplication)
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Site looks identical before and after
- [ ] CSS.md updated with all additions

## Learn

### Brand Primitives
**What it is:** Small, focused components that encapsulate a single brand pattern (a button style, a label format, a decorative element).
**Why it matters:** When the same visual pattern is copy-pasted across 12 files, changing the brand means editing 12 files. With a primitive, it's one file.
**Try this:** After 17a-2a, search the codebase for `repeating-linear-gradient.*FFB627` — it should only appear in `HazardStripe.svelte` and `app.css`.
**Go deeper:** https://bradfrost.com/blog/post/atomic-web-design/

### Svelte Actions as DOM Injectors
**What it is:** A Svelte `use:` action can create and manage DOM elements, not just set CSS properties.
**Why it matters:** The cursorGlow action enhancement eliminates 12 identical `<div>` overlay blocks by having the action inject the overlay automatically.
**Try this:** After Task 8, add `use:cursorGlow` to any element and inspect — you'll see the overlay div was auto-created.
**Go deeper:** https://svelte.dev/docs/svelte/svelte-action

## Verify

1. `bun run test` — all tests pass
2. `bun run check` — no TypeScript errors
3. Open `http://localhost:5173/` — home page looks identical
4. Navigate to About, Blog, Work, Services, Tech Stack — all pages look identical
5. Hover over cards — cursor glow still works
6. Check mobile (375px) — no layout regressions
7. Search codebase for `repeating-linear-gradient.*FFB627` — only in HazardStripe + app.css
8. Search for `pointer-events-none absolute inset-0.*glow` — only in GlowOverlay + cursorGlow action
