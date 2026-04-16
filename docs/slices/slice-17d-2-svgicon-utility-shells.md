# Slice 17d-2 — SvgIcon + Utility Extractions + Shells

**Status:** ready
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 17d-1 complete (Constitution + Card + Brand Atoms)
**Branch:** `feature/slice-17d-component-api` (continue)
**Design spec:** `docs/specs/2026-04-13-slice-17d-atomic-design-system.md`
**Implementation plan:** `docs/plans/2026-04-13-slice-17d-atomic-design-system.md` (Tasks 5-15)

## Objective

Extract duplicated utilities (isTouchDevice, SHAPES, morphHelpers), merge BlogSvgIcon + WorkSvgIcon into a unified SvgIcon brand atom, create SvgMorphBox, and build all Tier 3 shell components (SectionWrapper, EdgeRail, AsidePanel, DetailHero, CardGrid, BentoGrid, ListingShell).

## Context

17d-1 established governance (Constitution Section 13) and foundational atoms (Card, SectionHeading, MetroStation). 17d-2 completes the atom layer (SvgIcon, SvgMorphBox) and builds the entire shell layer that all pages will compose in 17d-7 (edge-to-edge pass). The utility extractions eliminate 3x duplicated functions and prepare clean imports for SvgIcon.

## Architecture

- **Utility extractions:** 3 functions duplicated across motion actions and SVG components get centralized into dedicated modules
- **SvgIcon:** Merges two 70%-identical components (BlogSvgIcon, WorkSvgIcon) into one brand atom. Imports from centralized SHAPES and morphHelpers
- **SvgMorphBox:** Extracts identical SVG morph container from ServiceCard + ServiceDetailPage
- **Shells:** 7 new Tier 3 components that encode layout patterns from Constitution Section 4. Pages will compose these in 17d-7 — this sub-slice builds and tests them standalone

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, CSS Grid, shadcn-svelte, GSAP (MorphSVGPlugin), Vitest + @testing-library/svelte

## File Structure

### New Files

```
src/lib/motion/utils/device.ts                  — CREATE: isTouchDevice() centralized
src/lib/motion/utils/device.test.ts             — CREATE: tests
src/lib/data/shapes.ts                           — CREATE: SHAPES, SHAPE_KEYS, pickRandomShape()
src/lib/data/shapes.test.ts                      — CREATE: tests
src/lib/motion/utils/morphHelpers.ts             — CREATE: convertSvgToMorphPaths(), morphToOriginal(), morphToShape()
src/lib/motion/utils/morphHelpers.test.ts        — CREATE: tests
src/lib/components/brand/SvgIcon.svelte          — CREATE: merged BlogSvgIcon + WorkSvgIcon
src/lib/components/brand/SvgIcon.test.ts         — CREATE: tests
src/lib/components/brand/SvgMorphBox.svelte      — CREATE: SVG morph square→circle container
src/lib/components/brand/SvgMorphBox.test.ts     — CREATE: tests
src/lib/components/shells/SectionWrapper.svelte  — CREATE: CSS Grid section with 3 layers
src/lib/components/shells/SectionWrapper.test.ts — CREATE: tests
src/lib/components/shells/EdgeRail.svelte        — CREATE: page-level edge decorations
src/lib/components/shells/EdgeRail.test.ts       — CREATE: tests
src/lib/components/shells/AsidePanel.svelte      — CREATE: sidebar wrapper
src/lib/components/shells/AsidePanel.test.ts     — CREATE: tests
src/lib/components/shells/DetailHero.svelte      — CREATE: shared detail page header
src/lib/components/shells/DetailHero.test.ts     — CREATE: tests
src/lib/components/shells/CardGrid.svelte        — CREATE: responsive card grid
src/lib/components/shells/CardGrid.test.ts       — CREATE: tests
src/lib/components/shells/BentoGrid.svelte       — CREATE: About page bento layout
src/lib/components/shells/BentoGrid.test.ts      — CREATE: tests
src/lib/components/shells/ListingShell.svelte    — CREATE: shared listing page scaffold
src/lib/components/shells/ListingShell.test.ts   — CREATE: tests
src/lib/components/shells/index.ts               — CREATE: barrel export
```

### Modified Files

```
src/lib/motion/actions/tilt.ts                   — MODIFY: import isTouchDevice from device.ts, delete inline copy
src/lib/motion/actions/magnetic.ts               — MODIFY: import isTouchDevice from device.ts, delete inline copy
src/lib/motion/actions/cursorGlow.ts             — MODIFY: import isTouchDevice from device.ts, delete inline copy
src/lib/motion/utils/index.ts                    — MODIFY: export device, morphHelpers
src/lib/data/index.ts                            — MODIFY: export shapes
src/lib/components/HomeServices.svelte           — MODIFY: import SHAPES + pickRandomShape from $lib/data/shapes, import morphHelpers
src/lib/components/brand/index.ts                — MODIFY: export SvgIcon, SvgMorphBox
src/lib/components/BlogRow.svelte                — MODIFY: import SvgIcon from brand/
src/lib/components/BlogDetailHeader.svelte       — MODIFY: import SvgIcon from brand/
src/lib/components/WorkCard.svelte               — MODIFY: import SvgIcon from brand/
src/lib/components/WorkServiceBadge.svelte       — MODIFY: import SvgIcon from brand/
src/lib/components/ServiceCard.svelte            — MODIFY: wire SvgMorphBox (replace inline morph container)
src/lib/components/ServiceDetailPage.svelte      — MODIFY: wire SvgMorphBox (replace inline morph container)
```

### Deleted Files

```
src/lib/components/BlogSvgIcon.svelte            — DELETE: replaced by brand/SvgIcon
src/lib/components/BlogSvgIcon.test.ts           — DELETE: replaced by brand/SvgIcon.test.ts
src/lib/components/WorkSvgIcon.svelte            — DELETE: replaced by brand/SvgIcon
src/lib/components/WorkSvgIcon.test.ts           — DELETE: replaced by brand/SvgIcon.test.ts
```

### Reused (no changes needed)

```
src/lib/components/brand/StatusDot.svelte        — Used inside SvgMorphBox context
src/lib/components/ui/badge/                     — Used by shells
src/lib/components/ui/separator/                 — GradientSeparator in DetailHero
src/lib/components/ui/card/                      — Used by shells (CardGrid, BentoGrid)
```

---

## Task 1: Extract isTouchDevice()

**Files:**
- Create: `src/lib/motion/utils/device.ts`
- Create: `src/lib/motion/utils/device.test.ts`
- Modify: `src/lib/motion/actions/tilt.ts`
- Modify: `src/lib/motion/actions/magnetic.ts`
- Modify: `src/lib/motion/actions/cursorGlow.ts`
- Modify: `src/lib/motion/utils/index.ts`

- [ ] **Step 1:** Write test for `isTouchDevice()`:
  - Returns boolean
  - Checks `navigator.maxTouchPoints > 0` or `'ontouchstart' in window`

- [ ] **Step 2:** Create `device.ts` with exported `isTouchDevice()` function. Read the existing implementation from any of the 3 action files (tilt.ts:22, magnetic.ts:21, cursorGlow.ts:26) — they're identical.

- [ ] **Step 3:** In tilt.ts, magnetic.ts, cursorGlow.ts:
  - Add `import { isTouchDevice } from '$lib/motion/utils/device';`
  - Delete the inline `function isTouchDevice()` block from each file

- [ ] **Step 4:** Add export to `src/lib/motion/utils/index.ts`

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Tilt still works on bento cards (About page)
- Cursor glow still works on cards
- Neither fires on touch devices

---

## Task 2: Extract SHAPES + pickRandomShape()

**Files:**
- Create: `src/lib/data/shapes.ts`
- Create: `src/lib/data/shapes.test.ts`
- Modify: `src/lib/data/index.ts`
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1:** Write test for shapes module:
  - `SHAPES` is a record with known keys (circle, square, triangle, diamond, hexagon, star, etc.)
  - `SHAPE_KEYS` is an array of SHAPES keys
  - `pickRandomShape()` returns a valid SVG path string from SHAPES

- [ ] **Step 2:** Read the SHAPES constant from any of the 3 source files (BlogSvgIcon, WorkSvgIcon, HomeServices). Create `shapes.ts` exporting `SHAPES`, `SHAPE_KEYS`, `pickRandomShape()`.

- [ ] **Step 3:** Update HomeServices.svelte to import from `$lib/data/shapes` instead of inline definition. (BlogSvgIcon/WorkSvgIcon will be deleted in Task 4 — no need to update them now.)

- [ ] **Step 4:** Add export to `src/lib/data/index.ts`

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- HomeServices blueprint SVG shapes still morph correctly on hover

---

## Task 3: Extract morphHelpers

**Files:**
- Create: `src/lib/motion/utils/morphHelpers.ts`
- Create: `src/lib/motion/utils/morphHelpers.test.ts`
- Modify: `src/lib/motion/utils/index.ts`
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1:** Write tests for morph helpers:
  - `convertSvgToMorphPaths(svgString)` — converts raw SVG to MorphSVG-compatible paths
  - `morphToOriginal(target, originalPath, options)` — morphs element back to its original SVG path
  - `morphToShape(target, shapePath, options)` — morphs element to a target shape path

- [ ] **Step 2:** Read the morph boilerplate from BlogSvgIcon, WorkSvgIcon, and HomeServices. Extract common patterns into `morphHelpers.ts`. Functions should wrap MorphSVGPlugin calls with sensible defaults.

- [ ] **Step 3:** Update HomeServices.svelte to import from `$lib/motion/utils/morphHelpers`.

- [ ] **Step 4:** Add export to `src/lib/motion/utils/index.ts`

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- HomeServices service cards still morph on hover (square→circle→back)

---

## Task 4: Merge BlogSvgIcon + WorkSvgIcon → brand/SvgIcon

**Files:**
- Create: `src/lib/components/brand/SvgIcon.svelte`
- Create: `src/lib/components/brand/SvgIcon.test.ts`
- Delete: `src/lib/components/BlogSvgIcon.svelte`
- Delete: `src/lib/components/BlogSvgIcon.test.ts`
- Delete: `src/lib/components/WorkSvgIcon.svelte`
- Delete: `src/lib/components/WorkSvgIcon.test.ts`
- Modify: `src/lib/components/brand/index.ts`
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/BlogDetailHeader.svelte`
- Modify: `src/lib/components/WorkCard.svelte`
- Modify: `src/lib/components/WorkServiceBadge.svelte`

- [ ] **Step 1:** Write test for SvgIcon:
  - Renders SVG container with correct size
  - Accepts svgContent prop
  - Accepts animation prop: `'draw'`, `'morph'`, `'draw-fill'`, `'stagger'`
  - Accepts trigger prop: `'load'`, `'scroll'`
  - Defaults: `animation='draw-fill'`, `trigger='load'`
  - Accepts size prop (number, px)
  - Has data-slot="svg-icon"
  - Accepts class prop + rest

- [ ] **Step 2:** Read both BlogSvgIcon and WorkSvgIcon. Identify differences (likely: default animation mode, trigger mode, size, color handling). Build unified SvgIcon that handles both use cases via props. Import SHAPES from `$lib/data/shapes` and morphHelpers from `$lib/motion/utils/morphHelpers`.

- [ ] **Step 3:** Export from `src/lib/components/brand/index.ts`

- [ ] **Step 4:** Update consumers:
  - `BlogRow.svelte:14` → `import { SvgIcon } from '$lib/components/brand'`
  - `BlogDetailHeader.svelte:13` → same import
  - `WorkCard.svelte:15` → same import
  - `WorkServiceBadge.svelte:11` → same import
  - Map each consumer's existing props to SvgIcon's unified API

- [ ] **Step 5:** Delete BlogSvgIcon.svelte, BlogSvgIcon.test.ts, WorkSvgIcon.svelte, WorkSvgIcon.test.ts

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Blog listing page — SVG icons draw-animate on scroll (same as before)
- Blog detail page — header SVG icon renders correctly
- Work listing page — project SVG icons render correctly
- Work detail sidebar — service badge SVG icons render correctly

---

## Task 5: SvgMorphBox Brand Atom

**Files:**
- Create: `src/lib/components/brand/SvgMorphBox.svelte`
- Create: `src/lib/components/brand/SvgMorphBox.test.ts`
- Modify: `src/lib/components/brand/index.ts`
- Modify: `src/lib/components/ServiceCard.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`

- [ ] **Step 1:** Write test for SvgMorphBox:
  - Renders square container at given size
  - Accepts svgContent prop
  - Has data-slot="svg-morph-box"
  - Accepts size prop (number, px — default 240)
  - Accepts class prop + rest

- [ ] **Step 2:** Read the morph container code in ServiceCard and ServiceDetailPage. Extract the shared SVG morph pattern (square container that morphs to circle on hover/focus). Build SvgMorphBox using morphHelpers from Task 3.

- [ ] **Step 3:** Export from `src/lib/components/brand/index.ts`

- [ ] **Step 4:** Wire into ServiceCard.svelte — replace inline morph container with `<SvgMorphBox svgContent={...} size={...} />`

- [ ] **Step 5:** Wire into ServiceDetailPage.svelte — same replacement

- [ ] **Step 6:** Delete duplicate morph CSS from both files

- [ ] **Step 7:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Services index page — service card SVGs morph on hover (square→circle→back)
- Service detail page — hero SVG morphs on hover

---

## Task 6: SectionWrapper Shell

**Files:**
- Create: `src/lib/components/shells/SectionWrapper.svelte`
- Create: `src/lib/components/shells/SectionWrapper.test.ts`
- Create: `src/lib/components/shells/index.ts`

- [ ] **Step 1:** Write test for SectionWrapper:
  - Renders `<section>` with CSS Grid
  - Supports 4 layout patterns: `'split'`, `'centered'`, `'bleed'`, `'grid'`
  - Renders background slot (grid-column: 1/-1, z-index: 0)
  - Renders sideLeft slot (grid-column: 1, z-index: 1)
  - Renders sideRight slot (grid-column: 3, z-index: 1)
  - Renders default children slot (grid-column: 2, z-index: 1)
  - Empty slots collapse to 0 (no wrapper divs for empty slots)
  - Accepts container prop: `'content'`, `'wide'`, `'prose'`, `'none'`
  - Accepts fullHeight, centerContent boolean props
  - Has data-slot="section-wrapper"
  - Accepts class prop + rest

- [ ] **Step 2:** Build SectionWrapper with CSS Grid:
  ```css
  /* Pattern B — Centered + Edges (default) */
  grid-template-columns: minmax(0, var(--edge-left, 0)) 1fr minmax(0, var(--edge-right, 0));
  
  /* Pattern A — Asymmetric Split */
  grid-template-columns: minmax(0, var(--edge-left, 0)) 1fr 1fr minmax(0, var(--edge-right, 0));
  
  /* Pattern C — Full-Bleed */
  grid-template-columns: 1fr;
  
  /* Pattern D — Edge-Anchored Grid */
  grid-template-columns: minmax(0, var(--edge-left, 0)) 1fr minmax(0, var(--edge-right, 0));
  ```
  - Svelte 5 snippets for `background`, `sideLeft`, `sideRight` slots
  - Container wrapper inside content column using Constitution container tokens
  - Side columns hidden below xl: (1024px) via CSS custom properties

- [ ] **Step 3:** Create `src/lib/components/shells/index.ts` barrel export

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Component renders correctly in isolation (test output)
- No visual regression — SectionWrapper is not wired to pages yet (that's 17d-7)

---

## Task 7: EdgeRail Shell

**Files:**
- Create: `src/lib/components/shells/EdgeRail.svelte`
- Create: `src/lib/components/shells/EdgeRail.test.ts`
- Modify: `src/lib/components/shells/index.ts`

- [ ] **Step 1:** Write test for EdgeRail:
  - Renders sticky edge decoration
  - Accepts position: `'left'` | `'right'`
  - Renders rotated page label when label prop provided
  - Renders section markers when sections prop provided
  - Hidden below xl: breakpoint (1024px)
  - Has data-slot="edge-rail"
  - Accepts class prop + rest

- [ ] **Step 2:** Build EdgeRail:
  - Fixed/sticky positioning along viewport edge
  - Rotated label (90deg for left, -90deg for right)
  - Section progress dots (metro-style, using StatusDot)
  - `font-mono`, `text-muted-foreground`, small text
  - Visible only at xl:+ via Tailwind `hidden xl:flex`

- [ ] **Step 3:** Export from shells barrel

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Component renders correctly in isolation (test output)
- Not wired to pages yet (that's 17d-7)

---

## Task 8: AsidePanel Shell

**Files:**
- Create: `src/lib/components/shells/AsidePanel.svelte`
- Create: `src/lib/components/shells/AsidePanel.test.ts`
- Modify: `src/lib/components/shells/index.ts`

- [ ] **Step 1:** Write test for AsidePanel:
  - Renders semantic `<aside>`
  - Accepts position: `'left'` | `'right'`
  - Supports sticky positioning via sticky boolean prop
  - Responsive: hidden on mobile, shown at lg:+
  - Has data-slot="aside-panel"
  - Accepts class prop + rest

- [ ] **Step 2:** Build AsidePanel:
  - `<aside>` element with `role` appropriate for sidebar
  - `position: sticky; top: var(--space-section-y)` when sticky=true
  - `hidden lg:block` for responsive show/hide
  - Surface tokens matching card aesthetic (subtle border, rounded)

- [ ] **Step 3:** Export from shells barrel

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Component renders correctly in isolation (test output)
- Not wired to pages yet

---

## Task 9: DetailHero Shell

**Files:**
- Create: `src/lib/components/shells/DetailHero.svelte`
- Create: `src/lib/components/shells/DetailHero.test.ts`
- Modify: `src/lib/components/shells/index.ts`
- Modify: `src/lib/components/WorkDetailPage.svelte`
- Modify: `src/routes/blog/[slug]/+page.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`

- [ ] **Step 1:** Write test for DetailHero:
  - Renders back-link with href and label
  - Renders `<h1>` with title
  - Renders subtitle/description
  - Renders GradientSeparator at bottom
  - Renders extras snippet slot
  - Has data-slot="detail-hero"
  - Accepts class prop + rest

- [ ] **Step 2:** Read the detail page headers from WorkDetailPage, blog/[slug], ServiceDetailPage. Identify the shared pattern (back-link → h1 → description → separator). Build DetailHero extracting this shared structure.
  - Props: `backLink: { href: string; label: string }`, `title: string`, `subtitle?: string`, `class?: string`, `...rest`
  - Slot: `extras` (for DataFlowDiagram, tech badges, etc.)

- [ ] **Step 3:** Wire into all 3 detail pages:
  - WorkDetailPage: `<DetailHero backLink={{ href: '/work', label: 'All Projects' }} title={project.title} subtitle={project.oneLiner} />`
  - blog/[slug]: `<DetailHero backLink={{ href: '/blog', label: 'All Posts' }} title={post.title} subtitle={post.excerpt} />`
  - ServiceDetailPage: `<DetailHero backLink={{ href: '/services', label: 'All Services' }} title={service.title} subtitle={service.description} />`

- [ ] **Step 4:** Delete duplicate header CSS from all 3 files

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Work detail page header looks identical (back link, title, description, separator)
- Blog post page header looks identical
- Service detail page header looks identical

---

## Task 10: CardGrid + BentoGrid Shells

**Files:**
- Create: `src/lib/components/shells/CardGrid.svelte`
- Create: `src/lib/components/shells/CardGrid.test.ts`
- Create: `src/lib/components/shells/BentoGrid.svelte`
- Create: `src/lib/components/shells/BentoGrid.test.ts`
- Modify: `src/lib/components/shells/index.ts`

- [ ] **Step 1:** Write tests for CardGrid:
  - Renders responsive grid: 1 col (sm), 2 col (md), 3 col (lg)
  - Accepts columns prop: `{ sm?: number; md?: number; lg?: number }`
  - Accepts gap prop (defaults to `var(--space-card-gap)`)
  - Has data-slot="card-grid"
  - Accepts class prop + rest

- [ ] **Step 2:** Write tests for BentoGrid:
  - Renders CSS Grid with named areas
  - Has data-slot="bento-grid"
  - Accepts class prop + rest

- [ ] **Step 3:** Build CardGrid:
  - CSS Grid with responsive column count
  - `gap: var(--space-card-gap)` default
  - Tailwind responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (configurable via columns prop)

- [ ] **Step 4:** Build BentoGrid:
  - Extract the named-area CSS Grid from AboutPage
  - Encodes the bento layout pattern (identity, metrics, logos, interests, testimonials, values, cta)
  - Responsive: collapses to single column on mobile

- [ ] **Step 5:** Export both from shells barrel

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Components render correctly in isolation (test output)
- Not wired to pages yet (CardGrid wiring is in 17d-7; BentoGrid wiring replaces AboutPage inline grid in 17d-7)

---

## Task 11: ListingShell

**Files:**
- Create: `src/lib/components/shells/ListingShell.svelte`
- Create: `src/lib/components/shells/ListingShell.test.ts`
- Modify: `src/lib/components/shells/index.ts`

- [ ] **Step 1:** Write test for ListingShell:
  - Renders container wrapper
  - Renders h1 header with title
  - Renders subtitle via SectionLabel
  - Renders filters snippet (mobile filter, dual-render pattern)
  - Renders sidebar snippet
  - Renders children (main content area)
  - Renders emptyState snippet when no children
  - Has data-slot="listing-shell"
  - Accepts class prop + rest

- [ ] **Step 2:** Read WorkListingPage and BlogListingPage. Identify the 60% structural overlap:
  - Container wrapper + page-level h1
  - Mobile filter toggle + desktop filter sidebar dual-render
  - Sidebar + content flex layout
  - Batch animation setup hooks
  - Filter summary + clear all
  - Empty state

- [ ] **Step 3:** Build ListingShell extracting the shared structure:
  - Props: `title: string`, `subtitle?: string`, `class?: string`, `...rest`
  - Snippets: `filters`, `sidebar`, `children`, `emptyState`
  - Does NOT wire into pages yet — that's a complex migration best done in 17d-7 with full visual verification per page

- [ ] **Step 4:** Export from shells barrel

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Component renders correctly in isolation (test output)
- ListingShell is NOT wired to pages yet (wiring deferred to 17d-7 edge-to-edge pass)

---

## Execution Order

```
Session 1 — Utility Extractions + Brand Atoms
  Task 1 (isTouchDevice) → independent
  Task 2 (SHAPES) → independent, can follow Task 1
  Task 3 (morphHelpers) → independent, can follow Task 2
  Task 4 (SvgIcon) → depends on Task 2 + Task 3 (imports from shapes + morphHelpers)
  Task 5 (SvgMorphBox) → depends on Task 3 (imports morphHelpers)

Session 2 — Core Shells
  Task 6 (SectionWrapper) → independent, foundation for other shells
  Task 7 (EdgeRail) → after Task 6 (may compose inside SectionWrapper context)
  Task 8 (AsidePanel) → after Task 6

Session 3 — Composite Shells
  Task 9 (DetailHero) → independent (wires into 3 pages)
  Task 10 (CardGrid + BentoGrid) → independent
  Task 11 (ListingShell) → independent (build-only, no wiring)
```

Tasks 1-3 are independent of each other. Task 4 depends on 2+3. Task 5 depends on 3.
Tasks 6-11 are independent of each other but depend on Tasks 1-5 being done.
Sessions 2 and 3 can potentially be combined if session 1 is efficient.

## Out of Scope

- File splits — Manifesto, tech-stack, HomeCloser, HeroBanner (17d-3)
- SVG tokenization — blueprint SVGs → Svelte, services SVGs → var(), orphan deletion (17d-4)
- Wiring — SectionLabel x8, MetricDisplay, TerminalChrome, StatusDot (17d-5)
- Edge-to-edge pass — applying SectionWrapper + EdgeRail to all pages (17d-7)
- Motion preset system (17e)
- Scroll behavior fixes (17d-5)

## Acceptance Criteria

- [ ] `isTouchDevice()` defined once in `device.ts`, imported by tilt.ts, magnetic.ts, cursorGlow.ts — zero inline copies
- [ ] `SHAPES`, `SHAPE_KEYS`, `pickRandomShape()` defined once in `shapes.ts` — zero inline copies
- [ ] `convertSvgToMorphPaths()`, `morphToOriginal()`, `morphToShape()` defined once in `morphHelpers.ts`
- [ ] `BlogSvgIcon.svelte` and `WorkSvgIcon.svelte` deleted — replaced by `brand/SvgIcon.svelte`
- [ ] SvgIcon handles all 4 animation modes (draw, morph, draw-fill, stagger) and 2 trigger modes (load, scroll)
- [ ] All 4 SvgIcon consumers updated: BlogRow, BlogDetailHeader, WorkCard, WorkServiceBadge
- [ ] SvgMorphBox built, wired into ServiceCard + ServiceDetailPage — zero duplicate morph CSS
- [ ] SectionWrapper supports 4 layout patterns (split, centered, bleed, grid) with 3 optional layers
- [ ] EdgeRail renders sticky edge decorations, hidden below xl:
- [ ] AsidePanel renders semantic `<aside>` with sticky + responsive
- [ ] DetailHero wired into 3 detail pages — zero duplicate header CSS
- [ ] CardGrid supports responsive column configuration
- [ ] BentoGrid extracts About page named-area grid
- [ ] ListingShell extracts 60% shared listing structure (built, not wired)
- [ ] All new components have data-slot, cn(), class/rest conventions
- [ ] All new components have tests
- [ ] `bun run test` + `bun run check` pass

## Learn

### Utility Deduplication
**What it is:** Extracting duplicated functions into shared modules. Three copies of `isTouchDevice()` become one import.
**Why it matters:** Bug fixes apply once. API changes happen in one place. New consumers get the function for free.
**Try this:** Change the touch detection logic in `device.ts` — all 3 motion actions update automatically.
**Go deeper:** DRY principle (Don't Repeat Yourself)

### Component Merging
**What it is:** Two components with 70%+ identical code become one component with props controlling the differences.
**Why it matters:** BlogSvgIcon and WorkSvgIcon are nearly identical. Maintaining two means fixing bugs twice, adding features twice.
**Try this:** Compare the deleted BlogSvgIcon with SvgIcon. The differences are now just prop values.
**Go deeper:** Composition over inheritance

### Shell Components (Tier 3)
**What it is:** Composable page scaffolds that encode layout patterns from the Constitution. A page picks a shell + fills it with atoms.
**Why it matters:** Adding a new page = choosing SectionWrapper layout + DetailHero or ListingShell + filling with Tier 1-2 atoms. Zero CSS invention.
**Try this:** Look at how DetailHero extracts the same back-link → h1 → description → separator from 3 different pages.
**Go deeper:** Atomic Design by Brad Frost — Templates tier

### CSS Grid Section Architecture
**What it is:** SectionWrapper uses CSS Grid with 3 independent layers (background, sides, content). Empty columns collapse to 0 automatically.
**Why it matters:** Each section can have decorative backgrounds, side annotations, and centered content — all optional, all composable. CSS Grid handles responsive collapse without JS.
**Try this:** Render SectionWrapper with only a background slot filled. The side columns collapse to 0. Add a sideLeft slot — it expands. Pure CSS, no conditional rendering.
**Go deeper:** CSS Grid `minmax(0, var())` pattern

## Verify

1. About page — tilt still works on bento cards (isTouchDevice extraction didn't break)
2. Any page — cursor glow still follows mouse on cards
3. HomeServices — blueprint shapes still morph on hover
4. Blog listing — SVG icons draw-animate correctly (SvgIcon replacement)
5. Work listing — project SVG icons render (SvgIcon replacement)
6. Blog post detail — header SVG icon present (SvgIcon replacement)
7. Work detail sidebar — service badges have SVG icons (SvgIcon replacement)
8. Services index — service card SVGs morph on hover (SvgMorphBox wiring)
9. Service detail — hero SVG morphs on hover (SvgMorphBox wiring)
10. Work detail page — header has back link, title, separator (DetailHero wiring)
11. Blog post page — header matches (DetailHero wiring)
12. Service detail page — header matches (DetailHero wiring)
13. Run `bun run test` — all tests pass
14. Run `bun run check` — zero errors
