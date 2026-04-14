# Slice 17d: Atomic Design System + Edge-to-Edge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform yesid.dev from 22 slices of iterative building into a 4-tier atomic design system with edge-to-edge visual design on every page.

**Architecture:** CSS Grid-based section architecture with 3 independent layers (background, sides, content). Unified Card atom for 18 card instances. 7 composable shells. All page components become pure composition — zero custom patterns.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind v4, CSS Grid, shadcn-svelte, Bits UI, GSAP

**Design spec:** `docs/specs/2026-04-13-slice-17d-atomic-design-system.md`

**Multi-session:** 7 sub-slices, 7-11 sessions total. Each sub-slice gets its own branch or continues on `feature/slice-17d-component-api`.

---

## File Structure

### Files to Create

**Brand tier (new atoms):**
- `src/lib/components/brand/SectionHeading.svelte` — heading + orange dot + mono subheading
- `src/lib/components/brand/SectionHeading.test.ts` — tests
- `src/lib/components/brand/MetroStation.svelte` — badge + pulse + SVG line
- `src/lib/components/brand/MetroStation.test.ts` — tests
- `src/lib/components/brand/SvgIcon.svelte` — merged BlogSvgIcon + WorkSvgIcon
- `src/lib/components/brand/SvgIcon.test.ts` — tests
- `src/lib/components/brand/SvgMorphBox.svelte` — SVG morph square→circle container
- `src/lib/components/brand/SvgMorphBox.test.ts` — tests

**Shells tier (all new):**
- `src/lib/components/shells/SectionWrapper.svelte` — CSS Grid section with 3 layers
- `src/lib/components/shells/SectionWrapper.test.ts` — tests
- `src/lib/components/shells/EdgeRail.svelte` — page-level edge decorations
- `src/lib/components/shells/EdgeRail.test.ts` — tests
- `src/lib/components/shells/ListingShell.svelte` — shared listing page scaffold
- `src/lib/components/shells/ListingShell.test.ts` — tests
- `src/lib/components/shells/DetailHero.svelte` — shared detail page header
- `src/lib/components/shells/DetailHero.test.ts` — tests
- `src/lib/components/shells/CardGrid.svelte` — responsive card grid
- `src/lib/components/shells/CardGrid.test.ts` — tests
- `src/lib/components/shells/BentoGrid.svelte` — About page bento layout
- `src/lib/components/shells/BentoGrid.test.ts` — tests
- `src/lib/components/shells/AsidePanel.svelte` — sidebar wrapper
- `src/lib/components/shells/AsidePanel.test.ts` — tests
- `src/lib/components/shells/index.ts` — barrel export

**Utility extractions:**
- `src/lib/motion/utils/device.ts` — `isTouchDevice()` centralized
- `src/lib/motion/utils/device.test.ts` — tests
- `src/lib/motion/utils/morphHelpers.ts` — `convertSvgToMorphPaths()`, `morphToOriginal()`, `morphToShape()`
- `src/lib/motion/utils/morphHelpers.test.ts` — tests
- `src/lib/data/shapes.ts` — `SHAPES`, `SHAPE_KEYS`, `pickRandomShape()`
- `src/lib/data/shapes.test.ts` — tests

**File split extractions (Manifesto):**
- `src/lib/components/ManifestoEdgeLeft.svelte`
- `src/lib/components/ManifestoEdgeRight.svelte`
- `src/lib/components/ManifestoEdgeTop.svelte`
- `src/lib/components/ManifestoEdgeBottom.svelte`
- `src/lib/components/ManifestoTransit.svelte`
- `src/lib/components/ManifestoBeckLines.svelte`
- `src/lib/components/ManifestoRoundels.svelte`
- `src/lib/components/ManifestoFlowLines.svelte`
- `src/lib/components/ManifestoStripes.svelte`

**File split extractions (tech-stack):**
- `src/lib/components/TechStackHero.svelte`
- `src/lib/components/TechStackCta.svelte`
- `src/lib/components/TechStackBuildSection.svelte`
- `src/lib/components/TechStackDivider.svelte`

**File split extractions (HomeCloser):**
- `src/lib/components/CloserGraffiti.svelte`
- `src/lib/components/CloserFloodlight.svelte`
- `src/lib/components/CloserProps.svelte`
- `src/lib/components/CloserTerminalBoard.svelte`

**File split extractions (HeroBanner):**
- `src/lib/motion/utils/heroTimeline.ts` — buildHeroTimeline + measurement utilities
- `src/lib/motion/utils/heroScrollLock.ts` — scroll lock/unlock logic
- `src/lib/motion/utils/heroTypewriter.ts` — typewriter + blink logic
- `src/lib/components/HeroTextContent.svelte`
- `src/lib/components/HeroMobileSql.svelte`

**File split extractions (HomeServices):**
- `src/lib/components/ServicesBlueprint.svelte`

**File split extractions (StackPanel):**
- `src/lib/components/StackPanelOrientation.svelte`

**Blueprint SVG components (12):**
- `src/lib/components/svg/BlueprintAzurSide.svelte`
- `src/lib/components/svg/BlueprintAzurFront.svelte`
- `src/lib/components/svg/BlueprintAzurTop.svelte`
- `src/lib/components/svg/BlueprintAzurBogie.svelte`
- `src/lib/components/svg/BlueprintAzurCross.svelte`
- `src/lib/components/svg/BlueprintMr73Side.svelte`
- `src/lib/components/svg/BlueprintDetailBogie.svelte`
- `src/lib/components/svg/BlueprintDetailDoor.svelte`
- `src/lib/components/svg/BlueprintDetailInterior.svelte`
- `src/lib/components/svg/BlueprintDetailHandrails.svelte`
- `src/lib/components/svg/BlueprintDetailWindow.svelte`
- `src/lib/components/svg/BlueprintDetailSeat.svelte`

### Files to Modify

**Constitution:**
- `docs/reference/CONSTITUTION.md` — Add Section 13: Atomic Design

**Card unification (ui/card customization):**
- `src/lib/components/ui/card/card.svelte` — Unified ProofReel surface
- `src/app.css` — Update/remove `.bento-card` class, add `station-ping` keyframes, grid-rows-collapse utility

**Brand barrel:**
- `src/lib/components/brand/index.ts` — Add new exports (SectionHeading, MetroStation, SvgIcon, SvgMorphBox)

**Utility barrels:**
- `src/lib/motion/utils/index.ts` — Add device, morphHelpers exports
- `src/lib/data/index.ts` — Add shapes export

**SectionLabel wiring (8 files):**
- `src/lib/components/ContactPage.svelte`
- `src/routes/tech-stack/+page.svelte`
- `src/lib/components/ProofReel.svelte`
- `src/lib/components/HomeServices.svelte`
- `src/lib/components/ServiceCard.svelte`
- `src/routes/+error.svelte`
- `src/lib/components/ServiceNav.svelte`

**MetricDisplay wiring:**
- `src/routes/tech-stack/+page.svelte`
- `src/lib/components/ProofReel.svelte`

**TerminalChrome wiring:**
- `src/lib/components/InfraFrame.svelte` — Compose on TerminalChrome

**StatusDot wiring:**
- `src/lib/components/Manifesto.svelte`
- `src/routes/+error.svelte`

**Semantic HTML fixes:**
- `src/lib/components/HeroBanner.svelte` — Consolidate dual h1
- `src/lib/components/AboutIdentity.svelte` — Promote h2 to h1
- `src/lib/components/ServiceCard.svelte` — Add page-level h1
- `src/lib/components/BlogRow.svelte` — Fix heading hierarchy + add `<time>`
- `src/lib/components/WorkCard.svelte` — Fix heading hierarchy
- `src/lib/components/WorkDetailSidebar.svelte` — Fix heading hierarchy
- `src/lib/components/BlogDetailHeader.svelte` — Add `<time>`
- `src/lib/components/brand/TerminalChrome.svelte` — Add overflow-y: auto

**Dedup consumers (update imports):**
- `src/lib/motion/actions/tilt.ts` — Import isTouchDevice
- `src/lib/motion/actions/magnetic.ts` — Import isTouchDevice
- `src/lib/motion/actions/cursorGlow.ts` — Import isTouchDevice
- `src/lib/components/HomeServices.svelte` — Import SHAPES
- `src/lib/components/BlogRow.svelte` — Remove station-ping CSS
- `src/lib/components/WorkListingPage.svelte` — Remove station-ping CSS

**Files to Delete:**
- `src/lib/components/BlogSvgIcon.svelte` — Replaced by SvgIcon
- `src/lib/components/BlogSvgIcon.test.ts`
- `src/lib/components/WorkSvgIcon.svelte` — Replaced by SvgIcon
- `src/lib/components/WorkSvgIcon.test.ts`
- `static/svg/data.svg` — Orphan (unused)
- `static/svg/logic.svg` — Orphan
- `static/svg/motion.svg` — Orphan
- `static/svg/pixels.svg` — Orphan
- `static/svg/stop-sign.svg` — Orphan
- `static/svg/train-station.svg` — Orphan
- `static/svg/understand.svg` — Orphan
- `static/svg/unforgettable.svg` — Orphan
- `static/svg/foundation.svg` — Orphan

---

## Sub-slice 17d-1: Constitution + Card + Brand Atoms (1 session)

### Task 1: Constitution Section 13 — Atomic Design

**Files:**
- Modify: `docs/reference/CONSTITUTION.md`

- [ ] Add Section 13: Atomic Design covering:
  - 4-tier hierarchy (ui/ → brand/ → shells/ → page) with composition rules
  - Card as universal surface (unified spec from design spec Section 3)
  - SectionWrapper as CSS Grid layout engine (3 layers, 4 patterns)
  - EdgeRail as page-level edge decoration
  - When to create a new atom vs compose existing ones
  - Slot conventions per tier
  - Anti-patterns list
- [ ] Upgrade Section 9: Responsive with mathematical guarantees:
  - Device coverage matrix (280px → 3840px+, 6 device classes)
  - Two-pronged system: breakpoints for layout, clamp() for values
  - Touch target enforcement (44x44px min below 1024px)
  - Container overflow prevention formula: `min(container, 100vw - page-x * 2)`
  - Safe area expansion to ALL fixed/sticky elements
  - Edge decorations only at xl:+ (1024px)
  - **No Overflow Guarantee** — 7-layer CSS enforcement chain:
    1. `html { overflow-x: clip }` — viewport boundary
    2. `body { overflow-wrap: anywhere }` — text breaks at boundaries
    3. `img, svg, video { max-width: 100% }` — media scales down
    4. Flex/grid children get `min-width: 0` — can shrink past content size
    5. Containers use `min(token, 100vw - gutters)` — viewport-capped
    6. SectionWrapper sides use `minmax(0, var(--edge-width))` — collapse before overflow
    7. Pre/code/table get `overflow-x: auto` — scroll internally, not externally
- [ ] Run `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 2: Unify Card Surface

**Files:**
- Modify: `src/lib/components/ui/card/card.svelte` — ProofReel surface
- Modify: `src/app.css` — Update `.bento-card` to use Card tokens, move `station-ping` to global

- [ ] Customize ui/card with unified surface:
  - Background: `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur(6px)`
  - Border: `1px solid color-mix(in srgb, var(--primary) 15%, transparent)`
  - Radius: `var(--radius-lg)`
  - Hover: border glow to `primary 60%` + `var(--shadow-section)`
- [ ] Update `.bento-card` class in app.css to reference Card's token values (so existing bento cards get the unified look)
- [ ] Move `@keyframes station-ping` from BlogRow/WorkListingPage to global app.css
- [ ] Add `.grid-rows-collapse` utility class to app.css
- [ ] Add brand `::selection` highlight: `::selection { background: color-mix(in srgb, var(--primary) 30%, transparent); color: var(--foreground); }`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify visually — all card surfaces should look unified.**

### Task 3: SectionHeading Brand Atom

**Files:**
- Create: `src/lib/components/brand/SectionHeading.svelte`
- Create: `src/lib/components/brand/SectionHeading.test.ts`
- Modify: `src/lib/components/brand/index.ts` — Add export

- [ ] Write test for SectionHeading (renders heading + dot + mono subheading)
- [ ] Build SectionHeading component with props: `heading`, `subheading`, `class`, `...rest`
- [ ] Wire into ProofReel and HomeServices (replacing hand-rolled CSS)
- [ ] Delete duplicate `.section-heading` / `.section-subheading` CSS from both files
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 4: MetroStation Brand Atom

**Files:**
- Create: `src/lib/components/brand/MetroStation.svelte`
- Create: `src/lib/components/brand/MetroStation.test.ts`
- Modify: `src/lib/components/brand/index.ts`

- [ ] Write test for MetroStation (renders badge + pulse + optional SVG line)
- [ ] Build MetroStation with props: `index`, `showLine`, `lineHeight`, `class`, `...rest`
- [ ] Wire into BlogRow and WorkListingPage (replacing copy-pasted station badge + pulse CSS)
- [ ] Remove duplicated `.station-badge-wrapper`, `.station-pulse`, `@keyframes station-ping` from both files (now global)
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

---

## Sub-slice 17d-2: SvgIcon + Utility Extractions + Dedup (1-2 sessions)

### Task 5: Extract isTouchDevice()

**Files:**
- Create: `src/lib/motion/utils/device.ts`
- Create: `src/lib/motion/utils/device.test.ts`
- Modify: `src/lib/motion/actions/tilt.ts`
- Modify: `src/lib/motion/actions/magnetic.ts`
- Modify: `src/lib/motion/actions/cursorGlow.ts`
- Modify: `src/lib/motion/utils/index.ts`

- [ ] Write test for `isTouchDevice()`
- [ ] Create `device.ts` with exported `isTouchDevice()` function
- [ ] Replace inline `isTouchDevice()` in tilt.ts, magnetic.ts, cursorGlow.ts with import
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 6: Extract SHAPES + pickRandomShape()

**Files:**
- Create: `src/lib/data/shapes.ts`
- Create: `src/lib/data/shapes.test.ts`
- Modify: `src/lib/data/index.ts`

- [ ] Write test for SHAPES constant and pickRandomShape()
- [ ] Create `shapes.ts` with exported `SHAPES`, `SHAPE_KEYS`, `pickRandomShape()`
- [ ] Update HomeServices.svelte to import from `$lib/data/shapes`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 7: Extract morphHelpers

**Files:**
- Create: `src/lib/motion/utils/morphHelpers.ts`
- Create: `src/lib/motion/utils/morphHelpers.test.ts`
- Modify: `src/lib/motion/utils/index.ts`

- [ ] Write tests for `convertSvgToMorphPaths()`, `morphToOriginal()`, `morphToShape()`
- [ ] Create `morphHelpers.ts` with all three functions
- [ ] Update HomeServices.svelte to import helpers
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 8: Merge SvgIcon

**Files:**
- Create: `src/lib/components/brand/SvgIcon.svelte`
- Create: `src/lib/components/brand/SvgIcon.test.ts`
- Delete: `src/lib/components/BlogSvgIcon.svelte` + test
- Delete: `src/lib/components/WorkSvgIcon.svelte` + test
- Modify: `src/lib/components/brand/index.ts`
- Modify: All BlogSvgIcon/WorkSvgIcon consumers

- [ ] Write test for SvgIcon (supports animation modes: draw, morph, draw-fill, stagger; trigger modes: load, scroll)
- [ ] Build SvgIcon merging both components. Import SHAPES from `$lib/data/shapes`, morphHelpers from `$lib/motion/utils`
- [ ] Update all consumers: BlogRow, BlogDetailHeader, blog listing pages → `import { SvgIcon } from '$lib/components/brand'`
- [ ] Update: WorkCard, work listing pages → same import
- [ ] Delete BlogSvgIcon.svelte, WorkSvgIcon.svelte + their tests
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify — blog and work SVG icons should look identical to before.**

### Task 9: SvgMorphBox Brand Atom

**Files:**
- Create: `src/lib/components/brand/SvgMorphBox.svelte`
- Create: `src/lib/components/brand/SvgMorphBox.test.ts`
- Modify: `src/lib/components/brand/index.ts`
- Modify: `src/lib/components/ServiceCard.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`

- [ ] Write test for SvgMorphBox (square container, morphs to circle on hover)
- [ ] Build SvgMorphBox extracting identical CSS from ServiceCard + ServiceDetailPage
- [ ] Wire into both consumers
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

---

## Sub-slice 17d-3: Shells (1-2 sessions)

### Task 10: SectionWrapper

**Files:**
- Create: `src/lib/components/shells/SectionWrapper.svelte`
- Create: `src/lib/components/shells/SectionWrapper.test.ts`
- Create: `src/lib/components/shells/index.ts`

- [ ] Write test for SectionWrapper (renders CSS Grid with 3 layers, supports 4 layout patterns)
- [ ] Build SectionWrapper with CSS Grid:
  - `grid-template-columns: var(--edge-left, 0) 1fr var(--edge-right, 0)`
  - Slots: `background`, `sideLeft`, `sideRight`, `children`
  - Props: `layout`, `container`, `fullHeight`, `centerContent`, `class`, `...rest`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 11: EdgeRail

**Files:**
- Create: `src/lib/components/shells/EdgeRail.svelte`
- Create: `src/lib/components/shells/EdgeRail.test.ts`

- [ ] Write test for EdgeRail (renders sticky edge decorations, hidden below xl:)
- [ ] Build EdgeRail with props: `position`, `label`, `sections`, `class`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 12: AsidePanel

**Files:**
- Create: `src/lib/components/shells/AsidePanel.svelte`
- Create: `src/lib/components/shells/AsidePanel.test.ts`

- [ ] Write test for AsidePanel (semantic `<aside>`, sticky, responsive show/hide)
- [ ] Build AsidePanel with props: `position`, `sticky`, `class`, `...rest`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 13: DetailHero

**Files:**
- Create: `src/lib/components/shells/DetailHero.svelte`
- Create: `src/lib/components/shells/DetailHero.test.ts`

- [ ] Write test for DetailHero (renders back-link + h1 + description + gradient separator)
- [ ] Build DetailHero with props: `backLink`, `title`, `subtitle`, `class`. Slot: `extras`
- [ ] Wire into WorkDetailPage, blog/[slug], ServiceDetailPage
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify across all 3 detail pages.**

### Task 14: CardGrid + BentoGrid

**Files:**
- Create: `src/lib/components/shells/CardGrid.svelte`
- Create: `src/lib/components/shells/CardGrid.test.ts`
- Create: `src/lib/components/shells/BentoGrid.svelte`
- Create: `src/lib/components/shells/BentoGrid.test.ts`

- [ ] Write tests for both grids
- [ ] Build CardGrid (responsive 1-2-3 col) with props: `columns`, `gap`, `class`
- [ ] Build BentoGrid (extract About page named-area grid)
- [ ] Wire CardGrid into ProofReel, HomeServices, ServiceDetailPage
- [ ] Wire BentoGrid into AboutPage
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify grid layouts look identical.**

### Task 15: ListingShell

**Files:**
- Create: `src/lib/components/shells/ListingShell.svelte`
- Create: `src/lib/components/shells/ListingShell.test.ts`

- [ ] Write test for ListingShell (renders container + header + filter dual-render + sidebar + content layout)
- [ ] Build ListingShell extracting 60% shared structure from WorkListingPage + BlogListingPage
- [ ] Slots: `filters`, `sidebar`, `children`, `emptyState`
- [ ] Props: `title`, `subtitle`, `class`
- [ ] Wire into WorkListingPage and BlogListingPage
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify both listing pages look identical.**

---

## Sub-slice 17d-4: File Splits (1-2 sessions)

### Task 16: Split Manifesto (1006 → ~320 lines)

**Files:**
- Create: 9 sub-components (ManifestoEdgeLeft/Right/Top/Bottom, ManifestoTransit, ManifestoBeckLines, ManifestoRoundels, ManifestoFlowLines, ManifestoStripes)
- Modify: `src/lib/components/Manifesto.svelte`

- [ ] Extract each sub-component with its markup + corresponding scoped CSS
- [ ] Parent Manifesto imports and renders sub-components
- [ ] Data flows via props from parent (resolveLocale results passed down)
- [ ] GSAP animations stay in parent (orchestrates child elements via bind:this)
- [ ] Run `bun run test` + `bun run check`
- [ ] Verify Manifesto line count < 400
- [ ] **STOP. Ask Yesid to verify Manifesto looks and animates identically.**

### Task 17: Split tech-stack/+page (919 → ~380 lines)

**Files:**
- Create: TechStackHero, TechStackCta, TechStackBuildSection, TechStackDivider
- Modify: `src/routes/tech-stack/+page.svelte`

- [ ] Extract TechStackHero (terminal animation + stats + overline)
- [ ] Extract TechStackBuildSection — DE-DUPLICATE from 3 copies (desktop/tablet/mobile) into 1 component used 3 times
- [ ] Extract TechStackCta (heading + subtext + buttons)
- [ ] Extract TechStackDivider (label + separator)
- [ ] Run `bun run test` + `bun run check`
- [ ] Verify page line count < 400
- [ ] **STOP. Ask Yesid to verify tech-stack page looks identical at all breakpoints.**

### Task 18: Split HomeCloser (749 → ~280 lines)

**Files:**
- Create: CloserGraffiti, CloserFloodlight, CloserProps, CloserTerminalBoard
- Modify: `src/lib/components/HomeCloser.svelte`

- [ ] Extract CloserGraffiti (loadGraffiti + resetGraffiti + animateGraffiti + SVG fetch/parse + graffiti wrapper + styles)
- [ ] Extract CloserFloodlight (inline floodlight SVG + beam div + styles)
- [ ] Extract CloserProps (construction prop SVG fetch/inject + styles)
- [ ] Extract CloserTerminalBoard (TerminalChrome wrapper + row rendering + cursor + styles)
- [ ] Run `bun run test` + `bun run check`
- [ ] Verify HomeCloser line count < 400
- [ ] **STOP. Ask Yesid to verify HomeCloser looks and animates identically.**

### Task 19: Split HeroBanner (734 → ~330 lines)

**Files:**
- Create: heroTimeline.ts, heroScrollLock.ts, heroTypewriter.ts (TS modules)
- Create: HeroTextContent.svelte, HeroMobileSql.svelte
- Modify: `src/lib/components/HeroBanner.svelte`

- [ ] Extract heroTimeline.ts (buildHeroTimeline + all measurement utilities — pure functions taking DOM refs)
- [ ] Extract heroScrollLock.ts (scroll lock/unlock logic)
- [ ] Extract heroTypewriter.ts (typewriter + blink functions)
- [ ] Extract HeroTextContent (headline, HeroMetrics, subheadline, CTAs)
- [ ] Extract HeroMobileSql (mobile SQL section)
- [ ] Run `bun run test` + `bun run check`
- [ ] Verify HeroBanner line count < 400
- [ ] **STOP. Ask Yesid to verify hero scroll animation works identically.**

### Task 20: Split HomeServices + StackPanel

**Files:**
- Create: ServicesBlueprint.svelte
- Create: StackPanelOrientation.svelte
- Modify: HomeServices.svelte, StackPanel.svelte

- [ ] Extract ServicesBlueprint (blueprint background SVG grid)
- [ ] Extract StackPanelOrientation (hint/orientation card)
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

---

## Sub-slice 17d-5: SVG Tokenization (1 session)

### Task 21: Blueprint SVGs → Svelte Components

**Files:**
- Create: 12 Blueprint*.svelte components in `src/lib/components/svg/`
- Modify: `src/lib/components/HomeServices.svelte` — Replace `<img>` tags with component imports
- Delete: (keep originals in static/svg/blueprint/ for reference, add to .gitignore later)

- [ ] For each of 12 blueprint SVGs: create Svelte component replacing all `#E07800` with `var(--primary)` (743 replacements total)
- [ ] Follow Train.svelte pattern — inline SVG in Svelte component with CSS var references
- [ ] Update HomeServices to import Blueprint* components instead of `<img src="/svg/blueprint/...">`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify blueprint SVGs look identical (orange color from token, not hardcoded).**

### Task 22: Services SVG Tokenization

**Files:**
- Modify: `static/svg/services/*.svg` (6 files)

- [ ] In each services SVG file, replace `#E07800` → `var(--primary)` and `#FFB627` → `var(--accent)`
- [ ] These are already fetch-injected at runtime, so CSS vars work after injection
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify service SVGs look correct.**

### Task 23: Delete Orphan SVGs

**Files:**
- Delete: 9 files in `static/svg/` (data.svg, logic.svg, motion.svg, pixels.svg, stop-sign.svg, train-station.svg, understand.svg, unforgettable.svg, foundation.svg)

- [ ] Verify zero references in codebase (confirmed by research)
- [ ] Delete all 9 files
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

---

## Sub-slice 17d-6: Wiring + Semantic HTML + Props (1-2 sessions)

### Task 24: Wire SectionLabel (8 instances)

**Files:**
- Modify: ContactPage, tech-stack/+page, ProofReel, HomeServices, ServiceCard, +error, ServiceNav

- [ ] Replace each hand-rolled mono/uppercase label with `<SectionLabel>` import
- [ ] Remove corresponding CSS classes (`.hero-overline`, `.hero-stat-label`, `.section-subheading`, `.station-counter`, `.nav-label`, inline spans)
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify labels look identical across all pages.**

### Task 25: Wire MetricDisplay + TerminalChrome + StatusDot

**Files:**
- Modify: tech-stack/+page (MetricDisplay for hero stats)
- Modify: ProofReel (MetricDisplay — may need `before` prop extension)
- Modify: InfraFrame (compose on TerminalChrome)
- Modify: Manifesto (StatusDot for pulse dot)
- Modify: +error (StatusDot for metro dots)

- [ ] Wire MetricDisplay into tech-stack hero stats
- [ ] Evaluate ProofReel MetricDisplay — extend API with `before` prop if needed
- [ ] Refactor InfraFrame to compose TerminalChrome internally (InfraFrame = TerminalChrome + CornerMarks + grid overlay)
- [ ] Wire StatusDot into Manifesto pulse dot
- [ ] Wire StatusDot into +error filled dots (hollow dots remain manual — API doesn't cover)
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 26: Scroll Behavior Fixes

**Files:**
- Investigate: `src/lib/components/StackBottomSheet.svelte` (drawer scroll)
- Investigate: `src/lib/components/StationTabs.svelte` (horizontal tab scroll)
- Investigate: `src/routes/work/+page.svelte` and `src/lib/components/WorkListingPage.svelte` (page scroll)
- Investigate: `src/lib/motion/utils/gsap.ts` (normalizeScroll)
- Investigate: `src/routes/+layout.svelte` (global scroll lock)
- Modify: `src/lib/components/brand/TerminalChrome.svelte` (overflow-y: auto)

- [ ] Investigate drawer scroll: open StackBottomSheet, check if content scrolls. Check vaul-svelte scroll lock config, check parent overflow properties.
- [ ] Investigate tab scroll: check StationTabs for horizontal overflow handling on mobile. Likely needs `overflow-x: auto` + `-webkit-overflow-scrolling: touch` on tab list.
- [ ] Investigate work page scroll: check for `overflow: hidden` on ancestors, GSAP normalizeScroll interference, scroll lock not released after dialog/drawer close.
- [ ] Fix all three issues. Ensure:
  - Drawer body scrolls vertically
  - Tabs swipe horizontally on touch
  - All pages scroll vertically at all viewports
  - Scroll lock releases on dialog/drawer close
- [ ] Fix TerminalChrome: add `overflow-y: auto` to `.terminal-body`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify scroll works on drawer, tabs, and work page.**

### Task 27: Semantic HTML Fixes

**Files:**
- Modify: HeroBanner (dual h1), AboutIdentity (missing h1), ServiceCard (missing h1)
- Modify: BlogRow, WorkCard, WorkDetailSidebar (heading hierarchy)
- Modify: BlogDetailHeader, BlogRow (`<time>` tags)
- Modify: brand/TerminalChrome (overflow-y)

- [ ] HeroBanner: consolidate lines 485+499 into single `<h1>` with `<span>` children
- [ ] AboutIdentity: promote `<h2>` at line 57 to `<h1>`
- [ ] Services listing: add page-level `<h1>` (may need ServiceListingPage modification)
- [ ] BlogRow, WorkCard: change `<h3>` to `<h2>` or add intermediate heading
- [ ] WorkDetailSidebar: fix h3 hierarchy
- [ ] BlogDetailHeader, BlogRow: wrap dates in `<time datetime="{post.date}">`
- [ ] TerminalChrome: add `overflow-y: auto` to `.terminal-body`
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

### Task 27: Props Standardization

**Files:**
- Modify: All page components consumed by shells or other pages

- [ ] Add exported `Props` interface to each consumer-facing component
- [ ] Add `class` + `...rest` props to each
- [ ] Priority: components consumed by ListingShell (BlogRow, WorkCard), DetailHero consumers, CardGrid consumers
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify.**

---

## Sub-slice 17d-7: Edge-to-Edge Pass (1-2 sessions)

### Task 28: Apply SectionWrapper to Home Page Sections

**Files:**
- Modify: `src/routes/+page.svelte` and home page section components

- [ ] Wrap each home section (HeroBanner, SkillsJourney, HomeServices, FeaturedWork, ProofReel, BlogFeed, Manifesto, HomeCloser) in SectionWrapper
- [ ] Choose layout pattern per section (A/B/C/D)
- [ ] Move existing background decorations (circuit grids, blueprint SVGs) into `background` slots
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify home page looks correct with SectionWrapper.**

### Task 29: Apply SectionWrapper to Subsite Pages

**Files:**
- Modify: About, Blog, Work, Services, Contact, tech-stack pages

- [ ] Wrap major sections in SectionWrapper
- [ ] Apply appropriate layout pattern per section
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify each page.**

### Task 30: Design + Wire EdgeRail Per Page

**Files:**
- Modify: Route pages to add EdgeRail

- [ ] Design edge content per page (rotated labels, section dots, annotations)
- [ ] Wire EdgeRail into each page layout
- [ ] Design SectionWrapper side content per section
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify edge decorations on each page.**

### Task 31: Card Unification Wiring

**Files:**
- Modify: All 18 card instances across Bento, Content, Grid clusters

- [ ] Replace hand-rolled card styling with unified Card component
- [ ] Bento cards: Card + `use:tilt` + `use:cursorGlow` + StopLabel
- [ ] Content cards (WorkCard, BlogRow, CollapsibleSection): Card with content-appropriate content
- [ ] Grid cards (HomeServices, ProofReel, ProjectMiniCard): Card with grid-appropriate content
- [ ] Remove duplicate card CSS from all consumer files
- [ ] Run `bun run test` + `bun run check`
- [ ] **STOP. Ask Yesid to verify all cards look unified and bold.**

### Task 32: End-of-17d Sweep

**Files:**
- Modify: Various (sweep across all files)

- [ ] Zero files > 600 lines
- [ ] Zero hand-rolled card surfaces (all use Card atom)
- [ ] Zero hand-rolled section patterns (all use SectionWrapper)
- [ ] All consumer-facing components export Props interfaces
- [ ] `bun run test` + `bun run check` pass
- [ ] Update docs: CONSTITUTION.md, CSS.md, TESTS.md, ARCHITECTURE.md
- [ ] **STOP. Ask Yesid to verify.**

---

## Execution Order & Dependencies

```
17d-1 (Constitution + Card + Brand Atoms)
  ↓
17d-2 (SvgIcon + Utilities + Dedup)     ← needs SHAPES, morphHelpers for SvgIcon
  ↓
17d-3 (Shells)                           ← needs Card, SectionHeading, MetroStation
  ↓
17d-4 (File Splits)                      ← independent, but benefits from shells
  ↓
17d-5 (SVG Tokenization)                ← independent
  ↓
17d-6 (Wiring + HTML + Props)           ← needs all atoms and shells built
  ↓
17d-7 (Edge-to-Edge Pass)               ← needs SectionWrapper + EdgeRail + Card
```

17d-4 and 17d-5 are independent of each other and could run in parallel sessions if desired.

---

## Out of Scope

- Motion preset system (17e)
- Reduced-motion audit (17e)
- Dead code cleanup final sweep (17a-4)
- Light theme testing (future)
- Container queries (future)
- Pretext typography engine (future — evaluate in 17e or later)
