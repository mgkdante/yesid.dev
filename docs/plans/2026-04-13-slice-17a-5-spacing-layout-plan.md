# Slice 17a-5: Spacing, Layout & Constitution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the edge-to-edge layout model, define spacing tokens + canonical breakpoints, write the Constitution governance document, and migrate all pages to the new system.

**Architecture:** Full-bleed layout for every page (remove layout-level `max-w-5xl` constraint). Sections manage their own content width using 3 container tokens. 5 semantic spacing tokens replace ~230 hardcoded values. 5 canonical breakpoints replace Tailwind defaults. Constitution document (`docs/reference/CONSTITUTION.md`) governs all future development.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind CSS v4, Bun

**Estimated sessions:** 2-3
**Branch:** `feature/slice-17a-5-spacing-layout`

**Design spec:** `docs/specs/2026-04-13-constitution-design.md`
**Wireframes:** `.superpowers/brainstorm/919-1776054861/content/constitution-edge-to-edge.html`

---

## Forward Compatibility: How 17a-5 Enables Everything After It

17a-5 is not a standalone slice. It's the foundation that 17a-6, 17d, 17e, and 17a-4 are engineered to build on. Every decision here is made with the full pipeline in mind.

### 17a-5 → 17a-6 (Bits UI Integration)

- **Spacing tokens** define the padding/gap inside Bits UI wrappers (`BrandDialog`, `BrandCollapsible`, `BrandTabs`). Without tokens, each wrapper would invent its own spacing.
- **Container tokens** tell Bits UI content panels how wide to be. A `BrandDialog` uses `--container-content`; a `BrandTooltip` uses `--space-cluster` for internal padding.
- **The constitution's Component Standards section** (written in Task 12) defines the exact wrapping pattern that 17a-6 implements. The pattern exists before the code.
- **Breakpoints** determine when Bits UI `BrandDialog` renders as a bottom sheet (mobile) vs centered dialog (desktop).

### 17a-5 → 17d (Component API)

- **Edge-to-edge layout** means every component refactored in 17d knows whether it's full-bleed or contained. No ambiguity — the constitution says which pattern each section uses.
- **The `class` + `...rest` prop standard** (in the constitution) is the spec 17d follows when upgrading all 40+ components.
- **Spacing tokens** are what 17d wires into components that currently hardcode `padding: 64px 16px`. The tokens exist; 17d applies them.
- **Canonical breakpoints** are the target when 17d fixes the 56 CSS `@media` queries that use non-canonical values.
- **Semantic HTML rules** in the constitution give 17d the exact fix for every heading hierarchy gap, missing `<figure>`, and `<div onclick>` violation.
- **Large file breakups** (Manifesto 1006→split, tech-stack 909→split) use the section pattern and spacing tokens from 17a-5 for the extracted sub-components.

### 17a-5 → 17e (Motion Re-Engineering)

- **Motion convention** (in the constitution) defines when to use GSAP vs CSS, what tokens to use, and the reduced-motion standard. 17e builds the preset system to these rules.
- **Spacing tokens** inform animation offsets. A `slideUp` preset uses `--space-stack` as the slide distance, not a hardcoded `20px`.
- **Breakpoints** determine when animations switch behavior (e.g., `gsap.matchMedia()` uses the canonical 768px, not an ad-hoc value).
- **The "ground-up re-engineering" rule** is written in the constitution. 17e doesn't patch — it rebuilds because the constitution says so.

### 17a-5 → 17a-4 (Dead Code Cleanup)

- **The constitution's anti-patterns list** defines what "dead" means: unused tokens, `svelte-ignore` comments, non-canonical breakpoints, `vh` units. 17a-4 deletes everything that violates the constitution.
- **The full-bleed migration** may orphan layout-specific utilities that only existed for the constrained model. 17a-4 catches those.
- **17d's component refactoring** will orphan old implementations. 17a-4 runs last precisely because it cleans up everything the other slices leave behind.

### The Thread That Ties Them

```
CONSTITUTION.md (written in 17a-5)
    ↓ defines rules for
tokens.css + @theme (built in 17a-5)
    ↓ consumed by
Bits UI wrappers (built in 17a-6)
    ↓ used inside
Refactored components (17d applies constitution rules)
    ↓ animated by
Motion presets (17e follows constitution's motion convention)
    ↓ cleaned up by
Dead code pass (17a-4 deletes everything that violates the constitution)
```

Every sub-slice reads the constitution, follows its rules, and builds on the tokens/layout/patterns that 17a-5 establishes. No sub-slice invents its own approach.

---

## File Map

### Created
- `docs/reference/CONSTITUTION.md` — the governance document (all 12 sections)

### Modified (foundation)
- `src/lib/styles/tokens.css` — add spacing tokens, breakpoint comment reference
- `src/app.css` — add spacing to `@theme`, override breakpoints in `@theme`
- `src/routes/+layout.svelte` — remove constrained layout, everything full-bleed
- `docs/reference/CSS.md` — add spacing tokens, update breakpoints section

### Modified (page migrations)
- `src/lib/components/BlogListingPage.svelte` — full-bleed wrapper + spacing tokens
- `src/routes/blog/[slug]/+page.svelte` — full-bleed wrapper + prose container
- `src/lib/components/WorkListingPage.svelte` — full-bleed wrapper + spacing tokens
- `src/lib/components/WorkDetailPage.svelte` — full-bleed + container-wide
- `src/lib/components/ProofReel.svelte` — spacing tokens
- `src/lib/components/HomeServices.svelte` — spacing tokens
- `src/lib/components/HomeCloser.svelte` — spacing tokens
- `src/lib/components/Manifesto.svelte` — spacing tokens
- `src/lib/components/HeroBanner.svelte` — spacing tokens
- `src/lib/components/ServiceListingPage.svelte` — spacing tokens
- `src/lib/components/ServiceDetailPage.svelte` — full-bleed + spacing tokens
- `src/lib/components/AboutPage.svelte` — remove max-w-[1920px], spacing tokens
- `src/lib/components/ContactPage.svelte` — full-bleed + spacing tokens
- `src/routes/tech-stack/+page.svelte` — spacing tokens
- `src/routes/+error.svelte` — full-bleed + dvh
- `src/lib/components/Footer.svelte` — safe-area-inset, spacing tokens
- `src/lib/components/Nav.svelte` — safe-area-inset

### Modified (docs)
- `CLAUDE.md` — add constitution reference, update CSS Architecture
- `docs/roadmap/standardization.md` — update progress
- `docs/slices/slice-17-checkpoint.md` — update current position

---

## Session 1: Foundation

### Task 1: Define Spacing Tokens

**Files:**
- Modify: `src/lib/styles/tokens.css:60-71`
- Modify: `src/app.css:17-65` (`@theme` block)

- [ ] **Step 1: Add spacing tokens to tokens.css**

Add after the container widths block (line 63), before the radius block:

```css
  /* Spacing — semantic tokens for recurring layout patterns */
  --space-page-x: clamp(1.5rem, 4vw, 5rem);     /* Horizontal page gutters */
  --space-section-y: clamp(3rem, 8vw, 6rem);     /* Vertical section padding */
  --space-card-gap: clamp(1rem, 2vw, 1.5rem);    /* Gap between cards/grid items */
  --space-stack: 1.5rem;                           /* Vertical stack within sections */
  --space-cluster: 0.75rem;                        /* Tight groupings (label + value) */
```

- [ ] **Step 2: Add spacing tokens to @theme in app.css**

Add after the container width block in `@theme` (after line 64):

```css
  /* Spacing tokens — generates Tailwind utilities */
  --spacing-page-x: var(--space-page-x);
  --spacing-section-y: var(--space-section-y);
  --spacing-card-gap: var(--space-card-gap);
  --spacing-stack: var(--space-stack);
  --spacing-cluster: var(--space-cluster);
```

- [ ] **Step 3: Run check**

Run: `bun run check`
Expected: PASS — no type errors, no new warnings

- [ ] **Step 4: Commit**

```bash
git add src/lib/styles/tokens.css src/app.css
git commit -m "feat(slice-17a-5): add semantic spacing tokens to tokens.css and @theme"
```

---

### Task 2: Define Canonical Breakpoints

**Files:**
- Modify: `src/app.css:17-65` (`@theme` block)

- [ ] **Step 1: Override Tailwind default breakpoints in @theme**

Add to the `@theme` block (after the spacing tokens):

```css
  /* Canonical breakpoints — 5 tiers: mobile, foldable, tablet, laptop, desktop */
  --breakpoint-sm: 22.5rem;   /* 360px — phones */
  --breakpoint-md: 32.5rem;   /* 520px — foldables, large phone landscape */
  --breakpoint-lg: 48rem;     /* 768px — tablets */
  --breakpoint-xl: 64rem;     /* 1024px — laptops */
  --breakpoint-2xl: 90rem;    /* 1440px — desktop */
```

- [ ] **Step 2: Run check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 3: Run dev server and spot-check responsive behavior**

Run: `bun run dev`
Check: Open DevTools responsive mode at 360px, 520px, 768px, 1024px, 1440px. Note any obvious layout breaks from the breakpoint change. Document anything that needs attention in later tasks.

Note: The existing `md:` classes (69 occurrences) will now trigger at 520px instead of 768px. The existing `lg:` classes (18 occurrences) will now trigger at 768px instead of 1024px. This is intentional — we're shifting responsive behaviors to smaller viewports. Some components may need adjustment.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "feat(slice-17a-5): define 5 canonical breakpoints (360/520/768/1024/1440)"
```

---

### Task 3: Full-Bleed Layout Migration

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Remove the constrained layout path**

Replace the current `<main>` element (line 48):

```svelte
		<main class="{isFullWidth ? 'flex-1' : 'mx-auto w-full max-w-5xl flex-1 px-6'} {isHome ? '' : 'pt-20'} {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
```

With the full-bleed model:

```svelte
		<main class="flex-1 {isHome ? '' : 'pt-20'} {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
```

- [ ] **Step 2: Remove the isFullWidth derived**

Delete lines 31-32 (the `isFullWidth` derived variable) — it's no longer used:

```typescript
let isFullWidth = $derived(isHome || $page.url.pathname.startsWith('/services') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/tech-stack') || $page.error !== null);
```

Keep `isHome` — it's still used for `pt-20` logic.

- [ ] **Step 3: Run check**

Run: `bun run check`
Expected: PASS — `isFullWidth` was only used in the template

- [ ] **Step 4: Visual check — previously constrained pages**

Run: `bun run dev`
Check these pages that WERE constrained and are NOW full-bleed:
- `/blog` — content will stretch full width (needs container in component — Task 5)
- `/blog/[slug]` — will stretch (needs container — Task 5)
- `/work` — will stretch (needs container — Task 6)
- `/work/[slug]` — will stretch (needs container — Task 6)

These pages will look broken until their components get container wrappers. This is expected. Screenshot the current state for before/after comparison.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(slice-17a-5): full-bleed layout — remove max-w-5xl constraint from main"
```

---

### Task 4: Migrate Blog Pages to Full-Bleed

**Files:**
- Modify: `src/lib/components/BlogListingPage.svelte`
- Modify: `src/routes/blog/[slug]/+page.svelte`

- [ ] **Step 1: Add edge-to-edge container to BlogListingPage**

Read `BlogListingPage.svelte` fully. Find the outermost wrapper element. Wrap the content in the edge-to-edge pattern:

The outer wrapper should be full viewport width. The inner content area should use `--container-content` for the listing grid and `--space-page-x` for horizontal gutters.

Pattern to apply:
```svelte
<!-- Outer: full bleed -->
<div class="w-full">
  <!-- Inner: content container with spacing tokens -->
  <div class="mx-auto px-[var(--space-page-x)]" style="max-width: var(--container-content)">
    <!-- existing listing content -->
  </div>
</div>
```

Replace any existing `px-6`, `px-4`, `max-w-*` on the wrapper with the token-based pattern.

- [ ] **Step 2: Add edge-to-edge container to blog detail page**

Read `src/routes/blog/[slug]/+page.svelte` fully. This page renders `BlogDetailHeader` + content + sidebar. Apply the full-bleed pattern:

- Blog header section: full-bleed hero area
- Content + sidebar: `--container-wide` for the grid, `--container-prose` for the text column
- Replace any existing `px-6`, `max-w-*` constraints

- [ ] **Step 3: Run check + dev server**

Run: `bun run check && bun run dev`
Check `/blog` and `/blog/[slug]` at 360px, 768px, 1440px. Content should be centered with appropriate widths. No horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/BlogListingPage.svelte src/routes/blog/[slug]/+page.svelte
git commit -m "feat(slice-17a-5): migrate blog pages to full-bleed with container tokens"
```

---

### Task 5: Migrate Work Pages to Full-Bleed

**Files:**
- Modify: `src/lib/components/WorkListingPage.svelte`
- Modify: `src/lib/components/WorkDetailPage.svelte`

- [ ] **Step 1: WorkListingPage full-bleed container**

Read `WorkListingPage.svelte` fully. Apply the same pattern as BlogListingPage:
- Outer wrapper: full viewport width
- Inner content: `--container-content` + `--space-page-x`
- Replace existing `px-6`, `max-w-*` constraints

- [ ] **Step 2: WorkDetailPage full-bleed with container-wide**

Read `WorkDetailPage.svelte` fully. Apply:
- Project header: full-bleed hero area
- Content + sidebar grid: `--container-wide` + `--space-page-x`
- Replace existing `max-w-6xl`, `px-*` constraints

- [ ] **Step 3: Run check + visual verification**

Run: `bun run check && bun run dev`
Check `/work` and `/work/[slug]` at 360px, 768px, 1440px. No horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/WorkListingPage.svelte src/lib/components/WorkDetailPage.svelte
git commit -m "feat(slice-17a-5): migrate work pages to full-bleed with container tokens"
```

---

### Task 6: Migrate Remaining Constrained Pages

**Files:**
- Modify: `src/lib/components/AboutPage.svelte`
- Modify: `src/lib/components/ContactPage.svelte`
- Modify: `src/routes/+error.svelte`

- [ ] **Step 1: AboutPage — remove max-w-[1920px]**

Read `AboutPage.svelte`. Remove the `max-w-[1920px]` constraint. Apply `--space-page-x` for horizontal gutters and `--space-section-y` for vertical rhythm where hardcoded values exist.

- [ ] **Step 2: ContactPage — spacing tokens**

Read `ContactPage.svelte`. Replace hardcoded padding/margin values with spacing tokens where they match the semantic intent (page-x, section-y, card-gap).

- [ ] **Step 3: Error page — full-bleed + dvh**

Read `src/routes/+error.svelte`. Replace `100dvh` with consistent pattern. Apply `--space-page-x` gutters. Ensure the error page works at all 5 breakpoints.

- [ ] **Step 4: Run check + visual verification**

Run: `bun run check && bun run dev`
Check `/about`, `/contact`, and trigger a 404 at all breakpoints.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/AboutPage.svelte src/lib/components/ContactPage.svelte src/routes/+error.svelte
git commit -m "feat(slice-17a-5): migrate about, contact, error pages to spacing tokens"
```

---

## Session 2: Home Page + Remaining Components

### Task 7: Migrate Home Page Sections to Spacing Tokens

**Files:**
- Modify: `src/lib/components/ProofReel.svelte`
- Modify: `src/lib/components/HomeServices.svelte`
- Modify: `src/lib/components/HomeCloser.svelte`
- Modify: `src/lib/components/Manifesto.svelte`
- Modify: `src/lib/components/HeroBanner.svelte`

Home page is already full-bleed. The migration here is replacing hardcoded spacing values with tokens.

- [ ] **Step 1: ProofReel spacing migration**

Read `ProofReel.svelte` fully. Replace:
- Hardcoded `py-16 px-6 md:py-24 md:px-12 lg:px-16` → `py-[var(--space-section-y)] px-[var(--space-page-x)]`
- Hardcoded card gap values → `gap-[var(--space-card-gap)]`
- Inner content container → `max-w-[var(--container-content)]`

- [ ] **Step 2: HomeServices spacing migration**

Read `HomeServices.svelte` fully. Replace hardcoded section padding, card gaps, and scoped CSS spacing with tokens. This file has ~12 hardcoded spacing rules in scoped `<style>`.

- [ ] **Step 3: HomeCloser spacing migration**

Read `HomeCloser.svelte` fully. Replace ~18 hardcoded spacing rules with tokens where they map to semantic intent.

- [ ] **Step 4: Manifesto spacing migration**

Read `Manifesto.svelte` fully. Replace ~22 hardcoded spacing rules. This is the largest file (1006 lines) — focus on section padding and inner container widths, not internal animation layout.

- [ ] **Step 5: HeroBanner spacing migration**

Read `HeroBanner.svelte` fully. Replace section padding and container values with tokens. Hero wordmark sizing stays custom (intentional exception).

- [ ] **Step 6: Run check + visual verification**

Run: `bun run check && bun run dev`
Check home page at 360px, 520px, 768px, 1024px, 1440px. All sections should maintain their visual design with consistent spacing rhythm.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ProofReel.svelte src/lib/components/HomeServices.svelte src/lib/components/HomeCloser.svelte src/lib/components/Manifesto.svelte src/lib/components/HeroBanner.svelte
git commit -m "feat(slice-17a-5): migrate home page sections to spacing tokens"
```

---

### Task 8: Migrate Services + Tech Stack to Spacing Tokens

**Files:**
- Modify: `src/lib/components/ServiceListingPage.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`
- Modify: `src/lib/components/ServiceCard.svelte`
- Modify: `src/routes/tech-stack/+page.svelte`

- [ ] **Step 1: ServiceListingPage + ServiceCard spacing**

Read both files. ServiceCard has `padding: 0 3rem/5rem/8rem` per breakpoint in scoped CSS — replace with `--space-page-x` (fluid, one declaration). ServiceListingPage gets `--space-section-y` and `--container-content`.

- [ ] **Step 2: ServiceDetailPage full-bleed + spacing**

Read file. Apply full-bleed pattern with `--container-wide` for content + sidebar layout. Replace hardcoded ~16 spacing rules.

- [ ] **Step 3: Tech-stack page spacing**

Read `src/routes/tech-stack/+page.svelte`. This has ~35 hardcoded spacing rules (highest in the codebase). Replace section padding, gaps, and container widths with tokens. Complex internal layout (tier rows, panels) keeps its scoped values.

- [ ] **Step 4: Run check + visual verification**

Run: `bun run check && bun run dev`
Check `/services`, `/services/[id]`, `/tech-stack` at all breakpoints.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ServiceListingPage.svelte src/lib/components/ServiceDetailPage.svelte src/lib/components/ServiceCard.svelte src/routes/tech-stack/+page.svelte
git commit -m "feat(slice-17a-5): migrate services + tech-stack to spacing tokens"
```

---

### Task 9: Fix Arbitrary Tailwind Values

**Files:** Multiple (~16 files with 28 instances)

- [ ] **Step 1: Audit and replace arbitrary spacing values**

Replace each arbitrary Tailwind spacing value with standard scale or token:

| File | Arbitrary | Replacement |
|------|-----------|-------------|
| `WorkFilterSidebar` | `w-[220px]` | `w-56` (224px, close enough) |
| `WorkDetailSidebar` | `w-[240px]` | `w-60` (240px exact) |
| `WorkDetailPage` | `w-[180px]` | `w-44` (176px) or `w-48` (192px) |
| `WorkCard` | `h-[200px]` | `h-48` (192px) or `h-52` (208px) |
| `WorkFilterMobile` | `max-h-[60vh]` | Keep — viewport relative, not spacing |
| `ReadingProgressBar` | `h-[3px]` | `h-px` or keep (functional, not spacing) |
| `HeroSqlPanel` | `p-[22px_24px]` | `p-5 lg:p-6` |
| `HeroSqlPanel` | `rounded-[12px]` | `rounded-lg` (12px matches --radius-lg) |
| `BlogFilterSidebar` | `max-h-[calc(100vh-6rem)]` | `max-h-[calc(100dvh-6rem)]` (keep calc, fix vh→dvh) |
| `BlogFilterMobile` | `max-h-[60vh]` | `max-h-[60dvh]` |
| `AboutPage` | `max-w-[1920px]` | Remove (full-bleed) — already done in Task 6 |
| `AboutMethod` | `h-[2px]`, `max-w-[100px]` | Keep — decorative, specific values |
| `AboutInterests` | `min-h-[140px]` | `min-h-36` (144px) |
| `AboutIdentity` | `p-[2px]` | Keep — border trick, exact value needed |
| `ConstructionScene` | `max-w-[400px]` | `max-w-sm` (384px) or `max-w-md` (448px) |
| `AboutPolaroids` | `lg:max-h-[280px]`, `lg:min-h-[160px]` | `lg:max-h-72`, `lg:min-h-40` |
| `AboutTestimonials` | `min-h-[80px]` | `min-h-20` (80px exact) |
| `TableOfContents` | `w-[18px]` | `w-4.5` or keep (specific) |
| `TrainJourney` | `w-[26px]`, `md:w-[30px]` | `w-6.5` or keep (SVG sizing) |
| `MetroNetwork` | `max-h-[80vh]` | `max-h-[80dvh]` |
| `HomeServices` | `inset-x-[2%]` etc. | Keep — percentage positioning |

Note: Some arbitrary values are intentional (decorative, functional, SVG sizing). Mark those with a `/* constitution: intentional */` comment.

- [ ] **Step 2: Run check + visual verification**

Run: `bun run check && bun run dev`
Spot-check affected pages. No visual regressions.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(slice-17a-5): replace arbitrary Tailwind spacing with standard scale"
```

---

## Session 3: Viewport Units, Safe Areas, Constitution & Docs

### Task 10: Viewport Unit Migration (vh → dvh/svh/lvh)

**Files:** Multiple (~20 files with `vh` references)

- [ ] **Step 1: Find all vh usage**

Search for `vh` in class attributes and scoped styles (excluding `dvh`, `svh`, `lvh`). Replace according to:

| Context | Replace `vh` with |
|---------|-------------------|
| Full-height sections (hero, closer) | `dvh` — updates with browser chrome |
| Scroll calculations, stable heights | `svh` — stable reference |
| Background sizing | `lvh` — maximum viewport |
| Max-height on panels/sheets | `dvh` |

- [ ] **Step 2: Run check + test on mobile viewport simulation**

Run: `bun run check && bun run dev`
Test with Chrome DevTools device toolbar — check that full-height sections don't jump when mobile browser chrome shows/hides.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(slice-17a-5): migrate vh units to dvh/svh/lvh"
```

---

### Task 11: Safe-Area-Inset Expansion

**Files:**
- Modify: `src/lib/components/Nav.svelte`
- Modify: `src/lib/components/Footer.svelte`
- Modify: `src/lib/components/StackBottomSheet.svelte`
- Modify: `src/lib/components/MenuOverlay.svelte`
- Modify: `src/lib/components/BlogFilterMobile.svelte`
- Modify: `src/lib/components/WorkFilterMobile.svelte`

- [ ] **Step 1: Add safe-area-inset to Nav**

Read `Nav.svelte`. Add `padding-top: env(safe-area-inset-top)` to the nav element (for devices with notches/status bars). Use additive padding so it doesn't override existing padding:

```css
padding-top: calc(existing-value + env(safe-area-inset-top, 0px));
```

- [ ] **Step 2: Add safe-area-inset to Footer**

Read `Footer.svelte`. Add `padding-bottom: env(safe-area-inset-bottom)` to the footer element.

- [ ] **Step 3: Add safe-area-inset to bottom sheets and overlays**

Read StackBottomSheet, MenuOverlay, BlogFilterMobile, WorkFilterMobile. Add `padding-bottom: env(safe-area-inset-bottom)` to any fixed/sticky bottom-anchored elements.

- [ ] **Step 4: Add viewport-fit=cover meta tag**

In `src/app.html`, ensure the viewport meta tag includes `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

This is required for `env(safe-area-inset-*)` to work.

- [ ] **Step 5: Run check + verification**

Run: `bun run check && bun run dev`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(slice-17a-5): expand safe-area-inset to nav, footer, sheets, overlays"
```

---

### Task 12: Write CONSTITUTION.md

**Files:**
- Create: `docs/reference/CONSTITUTION.md`

- [ ] **Step 1: Write the full constitution document**

Create `docs/reference/CONSTITUTION.md` with all 12 sections from the design spec. This is a governance document, not a spec — it uses imperative language ("always," "never," "must") and includes code examples.

Source content from `docs/specs/2026-04-13-constitution-design.md` sections 1-11, adapted to governance format. Include:

1. Philosophy (5 principles)
2. Layout Model (edge-to-edge, 4 patterns, container tokens)
3. Spacing (5 semantic tokens, rules)
4. Typography (type scale, hierarchy, type-as-design)
5. Semantic HTML (element rules, heading hierarchy)
6. Component Standards (prop pattern, class/rest, interfaces)
7. Accessibility (keyboard, focus, ARIA, reduced motion)
8. Bits UI Integration (wrapping pattern, when to use)
9. Motion (GSAP vs CSS, tokens, 17e preset plan)
10. Responsive (5 breakpoints, viewport units, safe areas)
11. File Organization (size limits, naming, co-location)
12. Anti-Patterns (explicit "never" list)

- [ ] **Step 2: Commit**

```bash
git add docs/reference/CONSTITUTION.md
git commit -m "docs(slice-17a-5): write CONSTITUTION.md — governance document for all future development"
```

---

### Task 13: Update Reference Documentation

**Files:**
- Modify: `docs/reference/CSS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/roadmap/standardization.md`
- Modify: `docs/slices/slice-17-checkpoint.md`

- [ ] **Step 1: Update CSS.md**

Add spacing tokens section (after Container Widths). Update breakpoints section to show the 5 canonical values replacing Tailwind defaults. Add viewport unit rules. Update container section to note that containers are for text readability, not section wrappers.

- [ ] **Step 2: Update CLAUDE.md**

Add to the CSS Architecture section:
- Reference to `docs/reference/CONSTITUTION.md`
- Note about edge-to-edge layout model
- Add `bits-ui` to Plugins & Tools section (for upcoming 17a-6)
- Update brand primitives count

Add to the Slice System section:
- Note that CONSTITUTION.md governs all future development

- [ ] **Step 3: Update standardization.md**

Mark 17a-3b as COMPLETE. Mark 17a-5 as IN PROGRESS. Update the progress table.

- [ ] **Step 4: Update slice-17-checkpoint.md**

Update current position to 17a-5. Document what's merged (17a-3b PR #6). Note the full-bleed migration and breakpoint changes.

- [ ] **Step 5: Commit**

```bash
git add docs/reference/CSS.md CLAUDE.md docs/roadmap/standardization.md docs/slices/slice-17-checkpoint.md
git commit -m "docs(slice-17a-5): update CSS.md, CLAUDE.md, roadmap, checkpoint"
```

---

### Task 14: Final Sweep + Verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Print results table per CLAUDE.md requirements. Fix any failures.

- [ ] **Step 2: Run check**

Run: `bun run check`
Expected: PASS with zero errors.

- [ ] **Step 3: Full-site responsive verification**

Check every page at all 5 canonical breakpoints (360px, 520px, 768px, 1024px, 1440px):
- `/` — home
- `/blog` and `/blog/[slug]`
- `/work` and `/work/[slug]`
- `/services` and `/services/[id]`
- `/about`
- `/contact`
- `/tech-stack`
- 404 page

Verify at each:
- No horizontal scroll
- Spacing tokens applied consistently
- Container widths correct
- No visual regressions

- [ ] **Step 4: Search for remaining violations**

Search for:
- `max-w-5xl` — should be 0 occurrences (removed from layout)
- `px-6` in layout contexts — should use `--space-page-x` instead
- `vh` without `d`/`s`/`l` prefix — should be 0 (migrated)

Document any remaining items that need attention in 17d.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(slice-17a-5): final sweep — all pages verified at 5 breakpoints"
```

---

## Acceptance Criteria

- [ ] 5 semantic spacing tokens defined and wired through `tokens.css` + `@theme`
- [ ] 5 canonical breakpoints replace Tailwind defaults (360/520/768/1024/1440)
- [ ] All pages full-bleed — zero layout-level `max-w-*` constraint
- [ ] Blog and work pages migrated to edge-to-edge with appropriate containers
- [ ] Zero arbitrary Tailwind spacing values (or documented intentional exceptions)
- [ ] All `vh` units migrated to `dvh`/`svh`/`lvh`
- [ ] `env(safe-area-inset-*)` on nav, footer, bottom sheets, overlays
- [ ] `CONSTITUTION.md` exists with all 12 sections
- [ ] `CSS.md` updated with new tokens and breakpoints
- [ ] `CLAUDE.md` references the constitution
- [ ] No horizontal scroll at any breakpoint on any page
- [ ] `bun run test` and `bun run check` both pass
