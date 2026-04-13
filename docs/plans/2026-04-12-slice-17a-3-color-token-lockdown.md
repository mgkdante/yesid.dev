# Slice 17a-3: Color & Token Lockdown — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 371 hardcoded color values with semantic tokens, wire 22 unused token categories, establish `@theme inline` as single source of truth, and complete the light theme block.

**Architecture:** Two sub-slices. 17a-3a (Color Lockdown) replaces hardcoded hex/rgba across ~55 files using a deterministic mapping table. 17a-3b (Token Wiring) connects unused z-index, shadow, transition, opacity, radius, and font-stack tokens to consumers. Both are mechanical replacements — no logic changes, no API changes.

**Tech Stack:** SvelteKit 2 + Svelte 5, Tailwind CSS v4 (`@theme inline`), CSS custom properties, Vitest

---

## Pre-Implementation Checklist

- [ ] Branch: `feature/slice-17a-3-color-lockdown` (already created from main)
- [ ] Read mapping table in `docs/specs/slice-17a-3-color-token-lockdown-design.md` — this is the reference for every replacement
- [ ] Read task details in `docs/slices/slice-17a-3a-color-lockdown.md`
- [ ] Confirm `bun run test` and `bun run check` pass on clean branch before starting

---

## Sub-Slice 17a-3a: Color Lockdown (2 sessions, 20 tasks)

### How to Read the Mapping Table

For every hardcoded value you encounter, the replacement depends on **where** it appears:

| Location | Replacement Form | Example |
|----------|-----------------|---------|
| CSS `<style>` block — `color:`, `background:`, `border-color:`, `fill:`, `stroke:` | `var(--token)` | `color: var(--brand-primary)` |
| CSS `<style>` block — `rgba(224,120,0, 0.3)` | `color-mix()` | `color-mix(in srgb, var(--brand-primary) 30%, transparent)` |
| Tailwind class — `text-[#E07800]` | brand utility | `text-brand-primary` |
| Tailwind class — `bg-[#1a1a1a]` | token utility | `bg-bg-card` |
| Tailwind class — `border-[#333]` | token utility | `border-border-subtle` |
| SVG attribute — `fill="#E07800"` | `var()` in attribute | `fill="var(--brand-primary)"` |
| Svelte prop default — `accentColor = '#E07800'` | token reference | `accentColor = 'var(--brand-primary)'` |
| Inline `style=` with static color | Move to `<style>` block with `var()` | Refactor to class/token |
| Inline `style=` with dynamic JS color | Keep as-is if computed at runtime | Document in devlog |

### rgba → color-mix() Conversion

The opacity percentage in `rgba()` maps to `color-mix()` percentage:

```
rgba(224, 120, 0, 0.03) → color-mix(in srgb, var(--brand-primary)  3%, transparent)
rgba(224, 120, 0, 0.05) → color-mix(in srgb, var(--brand-primary)  5%, transparent)
rgba(224, 120, 0, 0.06) → color-mix(in srgb, var(--brand-primary)  6%, transparent)
rgba(224, 120, 0, 0.08) → color-mix(in srgb, var(--brand-primary)  8%, transparent)
rgba(224, 120, 0, 0.1)  → color-mix(in srgb, var(--brand-primary) 10%, transparent)
rgba(224, 120, 0, 0.15) → color-mix(in srgb, var(--brand-primary) 15%, transparent)
rgba(224, 120, 0, 0.2)  → color-mix(in srgb, var(--brand-primary) 20%, transparent)
rgba(224, 120, 0, 0.3)  → color-mix(in srgb, var(--brand-primary) 30%, transparent)
rgba(224, 120, 0, 0.4)  → color-mix(in srgb, var(--brand-primary) 40%, transparent)
rgba(224, 120, 0, 0.5)  → color-mix(in srgb, var(--brand-primary) 50%, transparent)
rgba(224, 120, 0, 0.6)  → color-mix(in srgb, var(--brand-primary) 60%, transparent)
rgba(224, 120, 0, 0.8)  → color-mix(in srgb, var(--brand-primary) 80%, transparent)
```

The alpha value (0.0–1.0) maps directly to the percentage (0%–100%).

---

### Task C1: Foundation — New tokens + @theme inline

**Files:**
- Modify: `src/lib/styles/tokens.css`
- Modify: `src/app.css`

- [ ] **Step 1: Add 3 new tokens to tokens.css `:root` block**
  Add after the existing `--status-success` line:
  ```css
  --text-light: #cccccc;
  --status-warning: #ffbd2e;
  --brand-primary-border: color-mix(in srgb, var(--brand-primary) 12%, transparent);
  ```

- [ ] **Step 2: Add light theme values to `[data-theme="light"]` block**
  Add after existing `--text-code` line:
  ```css
  --text-light: #555555;
  --status-warning: #f0ad4e;
  --brand-primary-border: color-mix(in srgb, var(--brand-primary) 15%, transparent);
  ```

- [ ] **Step 3: Add same values to `@media (prefers-color-scheme: dark)` block**
  Add the dark values (`#cccccc`, `#ffbd2e`, `color-mix(...12%)`) to the media query block that mirrors `[data-theme="dark"]`.

- [ ] **Step 4: Split app.css @theme into @theme (static) + @theme inline (dynamic)**
  
  Keep in `@theme` (static — raw values Tailwind needs at build time):
  ```css
  @theme {
    /* Font families */
    --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
    --font-body: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

    /* Type scale */
    --text-hero: clamp(4rem, min(9vw, 11vh), 8.125rem);
    --text-display: clamp(2.5rem, 5vw, 4rem);
    --text-title: clamp(1.75rem, 4vw, 2.5rem);
    --text-heading: clamp(1.25rem, 3vw, 1.5rem);
    --text-subheading: 1.125rem;
    --text-body: 1rem;
    --text-body-lg: 1.125rem;
    --text-small: 0.875rem;
    --text-caption: 0.75rem;
    --text-mono: 0.8125rem;
    --text-micro: 0.625rem;

    /* Border radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-pill: 9999px;

    /* Shadows — already use var() refs, keep here */
    --shadow-glow-sm: var(--shadow-glow-sm);
    --shadow-glow-md: var(--shadow-glow-md);
    --shadow-glow-lg: var(--shadow-glow-lg);
    --shadow-card: var(--shadow-card);
    --shadow-section: var(--shadow-section);
    --shadow-nav: var(--shadow-nav);
    --shadow-status: var(--shadow-status);

    /* Z-index — already use var() refs, keep here */
    --z-index-base: var(--z-base);
    --z-index-content: var(--z-content);
    --z-index-rail: var(--z-rail);
    --z-index-footer: var(--z-footer);
    --z-index-sheet: var(--z-sheet);
    --z-index-menu: var(--z-menu);
    --z-index-nav: var(--z-nav);

    /* Container widths — already use var() refs, keep here */
    --width-content: var(--container-content);
    --width-wide: var(--container-wide);
    --width-prose: var(--container-prose);
  }
  ```

  Move to `@theme inline` (dynamic — references tokens.css):
  ```css
  @theme inline {
    /* Brand colors — single source: tokens.css */
    --color-brand-primary: var(--brand-primary);
    --color-brand-accent: var(--brand-accent);
    --color-brand-primary-hover: var(--brand-primary-hover);
    --color-brand-accent-hover: var(--brand-accent-hover);

    /* Dark palette → semantic tokens */
    --color-dark-bg: var(--bg-primary);
    --color-dark-surface: var(--bg-surface);
    --color-dark-elevated: var(--bg-elevated);
    --color-dark-border: var(--border);

    /* Light palette → semantic tokens */
    --color-light-bg: var(--bg-primary);
    --color-light-surface: var(--bg-surface);
    --color-light-elevated: var(--bg-elevated);
    --color-light-border: var(--border);

    /* Terminal */
    --color-terminal-bg: var(--bg-terminal);
    --color-terminal-border: var(--border-subtle);
    --color-dim: var(--text-dim);
    --color-live: var(--status-live);
  }
  ```

- [ ] **Step 5: Run `bun run test` and `bun run check`**
  Expected: PASS — changes are additive, no visual difference.

- [ ] **Step 6: Run `bun run dev` and verify visually**
  Check: homepage, about, blog, services, tech-stack at 1440px width. All colors must render identically to before — we only changed the source path, not the values.

- [ ] **Step 7: Commit**
  ```bash
  git add src/lib/styles/tokens.css src/app.css
  git commit -m "feat(slice-17a-3a): add new tokens + @theme inline single source of truth"
  ```

**STOP. Ask Yesid to verify on localhost. This is the foundation — everything else depends on it.**

---

### Tasks C2–C19: Color Migration (per-file)

Each task follows the same pattern. Full task details with file lists are in `docs/slices/slice-17a-3a-color-lockdown.md`.

**Per-task workflow:**

- [ ] **Step 1: Open the file(s) listed for this task**
- [ ] **Step 2: Find every hardcoded color value** — search for `#`, `rgba(`, `rgb(` in the file
- [ ] **Step 3: Apply the mapping table** — use the "Token Migration Rules" section of the design spec. For each value:
  - Identify the pattern (brand hex? rgba? dark bg? gray? traffic light?)
  - Look up the replacement in the mapping table
  - Choose the right form based on location (CSS block → var(), Tailwind class → utility, SVG attr → var())
- [ ] **Step 4: Handle rgba() specifically** — convert the alpha value to a percentage and use `color-mix()`
- [ ] **Step 5: Run `bun run test` and `bun run check`**
- [ ] **Step 6: Commit with descriptive message**
  ```bash
  git commit -m "feat(slice-17a-3a): tokenize colors in [ComponentName]"
  ```

**STOP after each task. Ask Yesid to verify the affected page(s).**

**Verification per task — what to check:**

| Task | Pages to check |
|------|---------------|
| C2 | Homepage → Manifesto section |
| C3 | /services, /services/[id] |
| C4 | Homepage → Services section |
| C5 | Mobile menu overlay |
| C6 | Homepage → Train animation |
| C7 | Homepage → 3D scene, metro network |
| C8 | /work, /work/[slug] |
| C9 | Homepage → Proof Reel, project mini cards |
| C10 | Homepage → construction scene, data flow |
| C11 | /blog, /blog/[slug] |
| C12 | Blog filter sidebar + mobile filter |
| C13 | Main nav + service sub-nav |
| C14 | Homepage → Closer section + footer |
| C15 | Station tabs, /services listing, table of contents |
| C16 | Hero section, tech-stack InfraFrame |
| C17 | Blog pages (accent colors) |
| C18 | Error page, blog routes, tech-stack |
| C19 | /contact, /about, tech-stack panels |

---

### Task C20: Light Theme Completion

**Files:**
- Modify: `src/lib/styles/tokens.css`

- [ ] **Step 1: Audit current `[data-theme="light"]` block**
  Compare every token in `[data-theme="dark"]` / `:root` with the light block. Find missing tokens.

- [ ] **Step 2: Add missing light theme values**
  Use the light theme table from the design spec. Every semantic token needs a light counterpart. Key additions:
  ```css
  [data-theme="light"], .theme-light {
    /* Existing tokens should already have values — verify and fix if needed */
    --bg-primary: #FAFAF8;
    --bg-surface: #F0EDE5;
    --bg-card: #FFFFFF;
    --bg-terminal: #F5F5F0;
    --bg-elevated: #FFFFFF;
    --bg-manifesto: #F0EDE5;
    --bg-deep: #F0EDE5;
    --text-primary: #111111;
    --text-secondary: #555555;
    --text-muted: #888888;
    --text-light: #555555;
    --text-dim: #AAAAAA;
    --text-code: #333333;
    --border: #D8D4CA;
    --border-subtle: #D8D4CA;
    --border-strong: #C0BDB5;
    --status-live: #16a34a;
    --status-error: #dc2626;
    --status-success: #16a34a;
    --status-warning: #f0ad4e;
    --brand-primary-border: color-mix(in srgb, var(--brand-primary) 15%, transparent);
  }
  ```

- [ ] **Step 3: Mirror in `@media (prefers-color-scheme: dark)` block**

- [ ] **Step 4: Run `bun run test` and `bun run check`**

- [ ] **Step 5: Smoke test — temporarily enable light theme**
  In `src/app.html`, add `data-theme="light"` to the `<html>` tag. Run `bun run dev` and check:
  - Homepage renders with light backgrounds
  - No dark backgrounds leak through
  - Brand orange/yellow still renders correctly
  - Text is readable (dark on light)
  
  **Remove the attribute after verification.** Light theme is not shipped in this slice.

- [ ] **Step 6: Commit**
  ```bash
  git add src/lib/styles/tokens.css
  git commit -m "feat(slice-17a-3a): complete light theme token block"
  ```

**STOP. Ask Yesid to verify. Show him the smoke test screenshot if possible.**

---

### Final Acceptance Gate (17a-3a)

After all 20 tasks are approved:

- [ ] **Grep sweep for stragglers**
  Search all .svelte files for any remaining hardcoded hex:
  ```bash
  # Brand colors
  grep -rn "#[Ee]07800\|#[Ff][Ff][Bb]627" src/ --include="*.svelte" | grep -v "brand/" | grep -v "tokens.css"
  
  # rgba brand
  grep -rn "rgba(224" src/ --include="*.svelte"
  
  # Dark backgrounds
  grep -rn "#1a1a1a\|#2a2a2a\|#141414\|#0a0a0a" src/ --include="*.svelte" | grep -v "tokens.css"
  
  # Grays
  grep -rn "#999\|#888\|#666\|#ccc\|#555" src/ --include="*.svelte" | grep -v "tokens.css"
  ```
  Expected: zero matches (or only tokens.css / brand/ files).

- [ ] **Run full test suite**: `bun run test`
- [ ] **Run type check**: `bun run check`
- [ ] **Visual comparison at 1440px and 375px** — site looks identical to before

---

## Sub-Slice 17a-3b: Token Wiring + Normalization (1 session, 8 tasks)

**Branch:** `feature/slice-17a-3b-token-wiring`
**Depends on:** 17a-3a merged

Full task details in `docs/slices/slice-17a-3b-token-wiring.md`.

**Per-task workflow is the same as 17a-3a** — find raw value, apply mapping, test, commit, STOP.

### Mapping References for 17a-3b

**Z-index mapping:**
```
z-index: 0      → z-index: var(--z-base)
z-index: 1-2    → z-index: var(--z-content)
z-index: 10-30  → z-index: var(--z-rail)
z-index: 40     → z-index: var(--z-footer)
z-index: 50     → z-index: var(--z-sheet)
z-index: 60     → z-index: var(--z-menu)
z-index: 70+    → z-index: var(--z-nav)
```
Use the semantic name for what the element IS, not just matching the number.

**Transition duration mapping:**
```
0.15s / 150ms  → var(--duration-fast)
0.2s  / 200ms  → var(--duration-normal)
0.25s / 250ms  → var(--duration-normal)
0.3s  / 300ms  → var(--duration-slow)
0.5s  / 500ms  → var(--duration-slower)
```

**Easing mapping:**
```
ease          → var(--ease-default)
ease-out      → var(--ease-default)
ease-in-out   → var(--ease-default)
cubic-bezier(0.34, 1.56, 0.64, 1) → var(--ease-bounce)
cubic-bezier(0, 0, 0.2, 1)        → var(--ease-decel)
```

**Opacity mapping:**
```
opacity: 0.5-0.7 → var(--opacity-muted)    (0.6)
opacity: 0.2-0.4 → var(--opacity-dim)      (0.3)
opacity: 0.1-0.2 → var(--opacity-subtle)   (0.15)
opacity: 0.03-0.08 → var(--opacity-faint)  (0.05)
```

**Font stack mapping:**
```
'JetBrains Mono', monospace                          → var(--font-mono)
'JetBrains Mono', 'Fira Code', 'Cascadia Code', ... → var(--font-mono)
'Inter', sans-serif                                  → var(--font-heading)
font-[JetBrains_Mono]  (Tailwind class)              → font-mono
```

**Pill radius:** All `999px`, `9999px`, `99999px` → `var(--radius-pill)`

**Exception: GSAP-animated values.** If opacity, transform, or other values are set by GSAP at runtime (e.g., `gsap.to(el, { opacity: 0.3 })`), leave as-is. GSAP needs literal values. Only replace values in CSS `<style>` blocks and Tailwind classes.

---

## Commit Strategy

- One commit per task (C1, C2, ..., C20, T1, ..., T8)
- Commit message format: `feat(slice-17a-3a): tokenize colors in [ComponentName]` or `feat(slice-17a-3b): wire z-index tokens`
- After all tasks: squash-merge to main via PR

## Session Planning

| Session | Sub-slice | Tasks | Est. Time |
|---------|-----------|-------|-----------|
| 1 | 17a-3a | C1–C10 (foundation + heavy files + SVGs) | Full session |
| 2 | 17a-3a | C11–C20 (blog + nav + remaining + light theme) | Full session |
| 3 | 17a-3b | T1–T8 (z-index, shadows, transitions, opacity, radius, fonts, utilities) | Full session |

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/specs/slice-17a-3-color-token-lockdown-design.md` | Design spec — mapping tables, architecture, light theme plan |
| `docs/slices/slice-17a-3a-color-lockdown.md` | Task details for color lockdown (files per task, acceptance criteria) |
| `docs/slices/slice-17a-3b-token-wiring.md` | Task details for token wiring (files per task, acceptance criteria) |
| `docs/reference/CSS.md` | CSS architecture reference |
| `src/lib/styles/tokens.css` | THE source of truth for all design tokens |
| `src/app.css` | Tailwind @theme bridge + utility classes |
