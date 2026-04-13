# Design Spec: Slice 17a-3 — Color & Token Lockdown

**Date:** 2026-04-12
**Status:** Approved
**Branch:** `feature/slice-17a-3-color-lockdown`
**Depends on:** 17a-2b (Wire Primitives) — PR #4 merged

---

## Problem

The codebase has 371 hardcoded color values across ~55 .svelte files. Every `#E07800`, `rgba(224,120,0,...)`, `#1a1a1a`, and `#666` is a lock that prevents:

1. **Brand portability** — changing the brand orange to blue requires editing 55+ files
2. **Light theme** — `[data-theme="light"]` exists in tokens.css but hardcoded dark backgrounds render on top
3. **Consistency** — same logical color (e.g. "card background") has 3+ different hex values across components

**Dual source-of-truth in app.css:** The `@theme` block duplicates 12 color values from tokens.css with raw hex (`#E07800`, `#141414`, `#0a0a0a`, etc.) instead of referencing `var()`. Changing tokens.css alone doesn't cascade into Tailwind utility classes. Tailwind v4 supports `@theme inline` which resolves this — see "Single Source of Truth Fix" section below.

Additionally, 22 token categories defined in tokens.css have zero consumers. Components use raw z-index integers, inline box-shadows, hardcoded transition durations, raw opacity values, and literal font stacks — all bypassing the token system.

## Goal

After this slice:
- **Zero hardcoded hex/rgba** in .svelte files (except tokens.css, brand/ primitives)
- **app.css @theme uses `@theme inline`** — references tokens.css via `var()`, zero duplicated hex values
- **All 22 unused token categories wired** into consumers
- **One token change = site-wide cascade** for every visual property
- **Light theme is one toggle away** — `[data-theme="light"]` block complete, zero component changes needed
- **Brand color change cascades everywhere** — including SVG illustrations (Train, MetroNetwork, etc.)

## Audit (verified against merged main)

### Hardcoded Colors — 371 total

| Category | Count | Files | Replacement |
|----------|-------|-------|-------------|
| `#E07800` (brand primary hex) | 116 | 44 | `var(--brand-primary)` / `text-brand-primary` |
| `rgba(224,120,0,...)` (brand primary rgba) | 117 | 27 | `color-mix(in srgb, var(--brand-primary) X%, transparent)` |
| `#FFB627` (brand accent hex) | 36 | 17 | `var(--brand-accent)` / `text-brand-accent` |
| Dark backgrounds (#1a1a1a, #2a2a2a, #141414, #1E1E1E, #0a0a0a) | 52 | 26 | `var(--bg-card/surface/primary)` |
| Grays (#999, #888, #666, #ccc, #555, #aaa, #ddd, #eee) | 41 | 15 | `var(--text-secondary/muted/light)` |
| Traffic light colors (#ff5f57, #ffbd2e, #28c840, #27c93f) | 9 | 2 | `var(--status-error/warning/success)` |

### Unused Tokens — 22 defined, 0 references

| Category | Tokens | Raw Values to Replace |
|----------|--------|-----------------------|
| Z-index (all 7) | `--z-base/content/rail/footer/sheet/menu/nav` | 43 raw z-index values / 14 files |
| Shadows (5 of 7) | `--shadow-glow-md/lg`, `--shadow-card/section/nav/status` | 30 raw box-shadow values / 23 files |
| Transitions | `--duration-slow/slower`, `--ease-bounce/decel` | 46 raw transition values / 20 files |
| Opacity (all 4) | `--opacity-muted/dim/subtle/faint` | 45 raw opacity values / 19 files |
| Containers (2) | `--container-wide/prose` | TBD |
| Radius | `--radius-xl` | 10 pill radius values / 8 files |
| Hover colors (2) | `--brand-primary-hover/accent-hover` | 3 refs only (BrandButton + HeroBanner) |

### Inconsistencies

| Issue | Count | Files |
|-------|-------|-------|
| `accentColor = '#E07800'` prop defaults | 11 | 11 blog/filter components |
| Hardcoded font stacks (`'JetBrains Mono'`, `'Inter'`) | 23 | 12 |
| Pill radius (`999px` vs `9999px`) | 10 | 8 |
| Hardcoded transition durations | 46 | 20 |
| `border-dashed border-[#333]` (unadopted `.divider-dashed`) | 9 | 4 filter files |
| `.brand-fade-line` unadopted | 0 consumers | — |

---

## Token Migration Rules

Every hardcoded value maps to exactly one token form. No ambiguity.

### Color Mapping

| Hardcoded Pattern | CSS `<style>` Replacement | Tailwind Class Replacement | SVG Attribute Replacement |
|---|---|---|---|
| `#E07800` | `var(--brand-primary)` | `text-brand-primary` / `bg-brand-primary` | `fill="var(--brand-primary)"` |
| `rgba(224,120,0, X)` | `color-mix(in srgb, var(--brand-primary) X%, transparent)` | — | — |
| `#FFB627` | `var(--brand-accent)` | `text-brand-accent` / `bg-brand-accent` | `fill="var(--brand-accent)"` |
| `#1a1a1a` | `var(--bg-card)` | `bg-bg-card` | — |
| `#141414` / `#0a0a0a` | `var(--bg-primary)` | `bg-bg-primary` | — |
| `#2a2a2a` / `#1E1E1E` | `var(--bg-surface)` or `var(--border-subtle)` | context-dependent | — |
| `#333` | `var(--border-subtle)` | `border-border-subtle` | — |
| `#999` / `#888` / `#aaa` | `var(--text-secondary)` | `text-text-secondary` | — |
| `#666` / `#555` | `var(--text-muted)` | `text-text-muted` | — |
| `#ccc` / `#ddd` / `#eee` | `var(--text-light)` (**new**) | `text-text-light` | — |
| `#fff` / `#ffffff` | `var(--text-primary)` | `text-text-primary` | — |
| `#111` | `var(--bg-surface)` | `bg-bg-surface` | — |
| `#222` | `var(--bg-card)` | `bg-bg-card` | — |
| `#ff5f57` | `var(--status-error)` | — | — |
| `#ffbd2e` | `var(--status-warning)` (**new**) | — | — |
| `#28c840` / `#27c93f` | `var(--status-success)` | — | — |
| `accentColor = '#E07800'` | `accentColor = 'var(--brand-primary)'` | — | — |

### New Tokens (added to tokens.css)

| Token | Dark Value | Purpose |
|-------|-----------|---------|
| `--text-light` | `#ccc` | Lighter body text (between secondary and primary) |
| `--status-warning` | `#ffbd2e` | Terminal yellow dot, warning states |
| `--brand-primary-border` | `color-mix(in srgb, var(--brand-primary) 12%, transparent)` | Bento card default border tint |

### SVG Strategy

All SVG components (Train, TrainTop, MetroNetwork, TrainJourney, StationNodes, DataPaths, WagonInner) use inline Svelte SVG — CSS custom properties work directly in `fill` and `stroke` attributes. Brand colors in SVGs get tokenized so a brand color change cascades into illustrations.

---

## Single Source of Truth Fix — `@theme inline`

**Problem:** app.css `@theme` block has 12 hardcoded hex values that duplicate tokens.css:

```css
/* CURRENT — two sources of truth */
@theme {
  --color-brand-primary: #E07800;       /* duplicates tokens.css --brand-primary */
  --color-brand-accent: #FFB627;        /* duplicates tokens.css --brand-accent */
  --color-dark-bg: #141414;             /* duplicates tokens.css --bg-primary */
  --color-terminal-bg: #0a0a0a;         /* duplicates tokens.css --bg-terminal */
  /* ...8 more duplicates */
}
```

**Solution:** Tailwind v4 `@theme inline` lets theme values reference external CSS variables. Confirmed via official docs (tailwindcss.com/docs/theme — "Referencing other variables").

```css
/* AFTER — tokens.css is the single source of truth */

/* Static values — raw literals Tailwind needs at build time */
@theme {
  --text-hero: clamp(4rem, min(9vw, 11vh), 8.125rem);
  --text-display: clamp(2.5rem, 5vw, 4rem);
  /* ... type scale, radii, etc. stay as raw values */
}

/* Dynamic references — pull from tokens.css */
@theme inline {
  /* Brand */
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
  --color-light-bg: var(--bg-primary);        /* resolves per theme */
  --color-light-surface: var(--bg-surface);
  --color-light-elevated: var(--bg-elevated);
  --color-light-border: var(--border);

  /* Terminal */
  --color-terminal-bg: var(--bg-terminal);
  --color-terminal-border: var(--border-subtle);
  --color-dim: var(--text-dim);
  --color-live: var(--status-live);

  /* Shadows, z-index, containers already use var() — no change needed */
}
```

**Result:**
- `tokens.css` = **the** single source of truth for all color values
- `@theme inline` = Tailwind bridge that generates utility classes from tokens
- Change `--brand-primary` in tokens.css → `bg-brand-primary`, `text-brand-primary`, AND all `var(--brand-primary)` cascade automatically
- Dark/light palette utilities now theme-switch too — `bg-dark-bg` resolves to `var(--bg-primary)` which changes per `[data-theme]`

**Note on dark/light palette:** After this change, the separate `--color-dark-*` and `--color-light-*` theme variables become redundant since they both point to the same semantic tokens which switch via `[data-theme]`. We can evaluate removing them in a later task if no component uses `bg-dark-bg` directly.

---

## Light Theme Completion

Task C20 fills the `[data-theme="light"]` block in tokens.css with all semantic tokens.

| Token | Dark | Light |
|-------|------|-------|
| `--bg-primary` | `#0a0a0a` | `#fafafa` |
| `--bg-surface` | `#111111` | `#ffffff` |
| `--bg-card` | `#1a1a1a` | `#f5f5f5` |
| `--bg-terminal` | `#0d0d0d` | `#f0f0f0` |
| `--text-primary` | `#f5f5f5` | `#1a1a1a` |
| `--text-secondary` | `#999` | `#666` |
| `--text-muted` | `#666` | `#888` |
| `--text-light` | `#ccc` | `#555` |
| `--text-dim` | `#444` | `#aaa` |
| `--border-subtle` | `#2a2a2a` | `#e5e5e5` |
| `--brand-primary` | `#E07800` | `#E07800` (unchanged) |
| `--brand-accent` | `#FFB627` | `#FFB627` (unchanged) |
| `--brand-primary-rgb` | `224, 120, 0` | `224, 120, 0` (unchanged) |
| `--brand-primary-border` | `color-mix(...12%)` | `color-mix(...15%)` |
| `--status-error` | `#ff5f57` | `#dc3545` |
| `--status-warning` | `#ffbd2e` | `#f0ad4e` |
| `--status-success` | `#28c840` | `#28a745` |
| `--shadow-*` tokens | dark glow values | lighter, subtler shadows |

**Principle:** Brand colors stay the same in both themes. Only backgrounds, text, and borders invert.

**Not shipped** — no toggle UI in this slice. But one toggle away: zero component changes needed after lockdown.

---

## Sub-slice Split

### 17a-3a — Color Lockdown (2 sessions, ~20 tasks)

Replace all 371 hardcoded hex/rgba values with semantic tokens. File-by-file, sorted by severity.

**Session 1 — Heavy hitters + SVGs:**

| Task | File(s) | Values | Notes |
|------|---------|--------|-------|
| C1 | tokens.css: add new tokens + app.css: split @theme into @theme (static) + @theme inline (var refs from tokens) | 3 new tokens + 12 hex→var() in @theme | --text-light, --status-warning, --brand-primary-border; @theme inline for all colors |
| C2 | Manifesto.svelte | 53 | Heaviest file. 38 rgba + 5 hex + 10 others |
| C3 | ServiceCard + ServiceDetailPage | 23 | Same domain |
| C4 | HomeServices.svelte | 16 | rgba-heavy |
| C5 | MenuOverlay.svelte | 15 | rgba-heavy |
| C6 | Train + TrainTop + TrainJourney | 22 | SVG fills → var() |
| C7 | MetroNetwork + StationNodes + DataPaths | 8 | SVG/motion files |
| C8 | WorkCard + WorkDetailSidebar + WorkDetailPage + WorkListingPage + WorkFilterMobile + WorkServiceBadge | 22 | Work domain |
| C9 | ProofReel + ProofStrip + ProjectMiniCard | 20 | Proof/project domain |
| C10 | ConstructionScene + DataFlowDiagram + ManifestoCanvas | 13 | Decorative components |

**Session 2 — Blog + Nav + remaining:**

| Task | File(s) | Values | Notes |
|------|---------|--------|-------|
| C11 | BlogRow + BlogContent + BlogDetailHeader + BlogListingPage | 5 | Blog content |
| C12 | BlogFilterMobile + BlogFilterSidebar + FilterGroup + CollapsibleSection | 12 | Blog filters + accentColor |
| C13 | Nav + ServiceNav | 11 | Navigation |
| C14 | HomeCloser + Footer | 10 | Footer area |
| C15 | StationTabs + ServiceListingPage + TableOfContents | 14 | Station/listing pages |
| C16 | HeroBanner + InfraFrame + HeroSqlPanel | 8 | Hero area |
| C17 | accentColor prop defaults → var(--brand-primary) | 11 files | All remaining '#E07800' defaults |
| C18 | +error.svelte + route pages | 10 | Route files |
| C19 | ContactPage + ReadingProgressBar + AboutCta + remaining About* | ~8 | Stragglers |
| C20 | Light theme — complete [data-theme="light"] block | — | All semantic tokens get light values |

**Acceptance criteria per task:** `bun run test` + `bun run check` pass, zero hardcoded hex/rgba in modified files.

**Slice acceptance:** grep for hardcoded hex across src/**/*.svelte returns only tokens.css, app.css, and brand/ primitives.

### 17a-3b — Token Wiring + Normalization (1 session, ~8 tasks)

Wire all 22 unused token categories into consumers and normalize inconsistencies.

| Task | Category | Raw Values | Files |
|------|----------|------------|-------|
| T1 | Z-index → --z-* tokens | 43 | 14 |
| T2 | Box-shadow → --shadow-* tokens | 30 | 23 |
| T3 | Transitions → --duration-* + --ease-* tokens | 46 | 20 |
| T4 | Opacity → --opacity-* tokens | 45 | 19 |
| T5 | Pill radius → --radius-pill | 10 | 8 |
| T6 | Font stacks → var(--font-mono/heading) | 23 | 12 |
| T7 | Wire .divider-dashed + .brand-fade-line utilities | 9+ | 4+ |
| T8 | Container tokens (--container-wide/prose) + --radius-xl wiring + remaining gaps | ~2 | 1-2 |

**Acceptance criteria per task:** `bun run test` + `bun run check` pass, zero raw values for the migrated category.

**Slice acceptance:** all 22 token categories have consumer references. No raw z-index integers, no inline box-shadows outside tokens, no hardcoded `0.3s` transitions.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| rgba → color-mix() browser support | color-mix() is baseline 2023. All modern browsers support it. |
| SVG fill with var() | Works for inline SVG (Svelte components). Would NOT work for external SVG via `<img>`. All our SVGs are inline. |
| Manifesto.svelte (53 values, 1006 lines) | Dedicate a full task. Test thoroughly. Many rgba values are for layered glass/glow effects. |
| Breaking GSAP animations | GSAP reads computed styles. As long as CSS vars resolve to valid colors, GSAP works. Verify per file. |
| Missing a hardcoded value | Final grep sweep as acceptance gate catches stragglers. |

## Non-goals

- No component API changes (that's 17d)
- No dead code removal (that's 17a-4)
- No new primitives or utility classes beyond what's mapped above
- No light theme toggle UI (future slice)
- No type scale changes (already done in 17a-1)
