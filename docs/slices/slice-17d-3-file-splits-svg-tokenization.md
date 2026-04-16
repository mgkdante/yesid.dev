# Slice 17d-3 — File Splits + SVG Tokenization

**Status:** ready
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 17d-2 complete (SvgIcon + Utilities + Shells)
**Branch:** `feature/slice-17d-component-api` (continue)
**Design spec:** `docs/specs/2026-04-13-slice-17d-atomic-design-system.md`
**Implementation plan:** `docs/plans/2026-04-13-slice-17d-atomic-design-system.md` (Tasks 16-23)

## Objective

Reorganize `src/lib/components/` from a flat 90-file directory into domain-based folders. Then split 6 oversized files (Manifesto 1006, tech-stack 909, HomeCloser 749, HeroBanner 734, HomeServices 478, StackPanel 453) into focused sub-components — landing in the correct domain folders. Tokenize all 18 SVG files: 12 blueprint SVGs become Svelte components with `var(--primary)`, 6 services SVGs get tokenized in-place, 9 orphan SVGs get deleted.

## Context

After 17d-2 established all atoms and shells, 17d-3 first reorganizes the flat components directory into domain folders, then reduces the largest files to <400 lines each, and completes SVG tokenization. This is pure structural housekeeping — no new components, no API changes to consumers. Every page must look and animate identically after reorganization and splitting. The SVG tokenization makes all brand SVGs theme-aware (ready for light theme).

## Architecture

- **File splits:** Extract visual sub-sections into child components. Parent orchestrates layout + GSAP timelines. Children own their markup + scoped CSS. Data flows via props.
- **GSAP strategy:** Animations that coordinate across sub-components stay in the parent (bind:this on child elements). Self-contained animations move into children.
- **SVG tokenization:** Blueprint SVGs convert from `<img>` tags (can't use CSS vars) to inline Svelte components (can). Services SVGs are already fetch-injected (CSS vars work at runtime). Orphans have zero references — safe delete.

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger, DrawSVGPlugin, MorphSVGPlugin), Vitest + @testing-library/svelte

## File Structure

### Domain Folder Reorganization

```
src/lib/components/
├── ui/              ← KEEP (shadcn primitives, already exists)
├── brand/           ← KEEP (brand atoms, already exists)
├── shells/          ← KEEP (from 17d-2)
├── svg/             ← CREATE (blueprint SVGs, Task 7)
├── layout/          ← CREATE: Nav, Footer, MenuOverlay, ControlRoom, ReadingProgressBar
├── home/            ← CREATE: HeroBanner, HeroSqlPanel, HeroMetrics, HomeServices, HomeCloser,
│                      Manifesto, ManifestoCanvas, FeaturedProjects, RelatedProjects,
│                      DataFlowDiagram, ErrorIllustration, SkillsJourney,
│                      + all file-split children
├── about/           ← CREATE: AboutPage, AboutCta, AboutIdentity, AboutInterests, AboutLogos,
│                      AboutMetrics, AboutMethod, AboutPolaroids, AboutTestimonials, AboutTrain,
│                      AboutWeather
├── blog/            ← CREATE: BlogListingPage, BlogRow, BlogContent, BlogDetailHeader, BlogFeed,
│                      BlogFilterMobile, BlogFilterSidebar
├── projects/        ← CREATE: ProjectListingPage, ProjectCard, ProjectDetailPage,
│                      ProjectDetailSidebar, ProjectFilterMobile, ProjectFilterSidebar,
│                      ProjectMiniCard, ServiceBadge
├── services/        ← CREATE: ServiceCard, ServiceDetailPage, ServiceListingPage, ServiceNav
├── stack/           ← CREATE: StackBottomSheet, StackConfigurator, StackConnections, StackDiagram,
│                      StackFilters, StackNode, StackPanel, StackScenarioCard
├── contact/         ← CREATE: ContactPage
└── shared/          ← CREATE: CollapsibleSection, FilterGroup, TagList, TableOfContents,
                       TerminalCursor, StationTabs
```

### Component Renames (applied during move)

| Old Name | New Name | Reason |
|---|---|---|
| `InfraFrame` | **`ControlRoom`** | Future interactive engine for skills/infrastructure — not just a chrome wrapper |
| `ProofReel` | **`FeaturedProjects`** | Standard name, consistent with "projects" terminology |
| `ProofStrip` | **`RelatedProjects`** | Describes what it shows |
| `ConstructionScene` | **`ErrorIllustration`** | Tied to 404 page, not a reusable construction concept |
| `WorkCard` | **`ProjectCard`** | Consistent "projects" terminology |
| `WorkListingPage` | **`ProjectListingPage`** | Consistent "projects" terminology |
| `WorkDetailPage` | **`ProjectDetailPage`** | Consistent "projects" terminology |
| `WorkDetailSidebar` | **`ProjectDetailSidebar`** | Consistent "projects" terminology |
| `WorkFilterMobile` | **`ProjectFilterMobile`** | Consistent "projects" terminology |
| `WorkFilterSidebar` | **`ProjectFilterSidebar`** | Consistent "projects" terminology |
| `WorkServiceBadge` | **`ServiceBadge`** | Not project-specific, drop prefix |
| `ProjectMiniCard` | **`ProjectMiniCard`** | Already consistent |
| `BlogSvgIcon` / `WorkSvgIcon` | **`SvgIcon`** | Already merged in 17d-2 |

### Route Rename

| Old Route | New Route |
|---|---|
| `src/routes/work/` | `src/routes/projects/` |
| `src/routes/work/[slug]/` | `src/routes/projects/[slug]/` |

All internal links (`href="/work/..."`) updated to `href="/projects/..."`. Data layer already uses `Project` type — now fully cohesive.

**Note:** After Task 0 reorganization, all subsequent tasks' file paths are relative to the new domain structure (e.g., `ManifestoEdgeLeft.svelte` lands in `home/`, not root).

### New Files

```
# Manifesto splits (1006 → ~320 lines)
src/lib/components/ManifestoEdgeLeft.svelte      — CREATE: left edge decorations (beck-lines, roundels)
src/lib/components/ManifestoEdgeRight.svelte     — CREATE: right edge decorations (flow-lines, stripes)
src/lib/components/ManifestoEdgeTop.svelte       — CREATE: top edge decorations
src/lib/components/ManifestoEdgeBottom.svelte    — CREATE: bottom edge decorations
src/lib/components/ManifestoTransit.svelte       — CREATE: transit easter egg elements

# tech-stack splits (919 → ~380 lines)
src/lib/components/TechStackHero.svelte          — CREATE: terminal animation + stats + overline
src/lib/components/TechStackCta.svelte           — CREATE: heading + subtext + buttons
src/lib/components/TechStackBuildSection.svelte  — CREATE: de-duplicated build section (was 3x copies)
src/lib/components/TechStackDivider.svelte       — CREATE: label + separator

# HomeCloser splits (749 → ~280 lines)
src/lib/components/CloserGraffiti.svelte         — CREATE: DrawSVG graffiti animation subsystem
src/lib/components/CloserFloodlight.svelte       — CREATE: inline floodlight SVG + beam
src/lib/components/CloserProps.svelte            — CREATE: construction prop SVG fetch/inject
src/lib/components/CloserTerminalBoard.svelte    — CREATE: departure board rows + cursor

# HeroBanner splits (734 → ~330 lines)
src/lib/motion/utils/heroTimeline.ts             — CREATE: buildHeroTimeline + measurement utilities
src/lib/motion/utils/heroScrollLock.ts           — CREATE: scroll lock/unlock logic
src/lib/motion/utils/heroTypewriter.ts           — CREATE: typewriter + blink functions
src/lib/components/HeroTextContent.svelte        — CREATE: headline, HeroMetrics, subheadline, CTAs
src/lib/components/HeroMobileSql.svelte          — CREATE: mobile SQL section

# HomeServices + StackPanel splits
src/lib/components/ServicesBlueprint.svelte      — CREATE: blueprint background SVG grid
src/lib/components/StackPanelOrientation.svelte  — CREATE: hint/orientation card

# Blueprint SVG components (12)
src/lib/components/svg/BlueprintAzurSide.svelte      — CREATE: Azur side view
src/lib/components/svg/BlueprintAzurFront.svelte     — CREATE: Azur front view
src/lib/components/svg/BlueprintAzurTop.svelte       — CREATE: Azur top view
src/lib/components/svg/BlueprintAzurBogie.svelte     — CREATE: Azur bogie detail
src/lib/components/svg/BlueprintAzurCross.svelte     — CREATE: Azur cross section
src/lib/components/svg/BlueprintMr73Side.svelte      — CREATE: MR-73 side view
src/lib/components/svg/BlueprintDetailBogie.svelte   — CREATE: bogie detail
src/lib/components/svg/BlueprintDetailDoor.svelte    — CREATE: door detail
src/lib/components/svg/BlueprintDetailInterior.svelte — CREATE: interior detail
src/lib/components/svg/BlueprintDetailHandrails.svelte — CREATE: handrails detail
src/lib/components/svg/BlueprintDetailWindow.svelte  — CREATE: window detail
src/lib/components/svg/BlueprintDetailSeat.svelte    — CREATE: seat detail
```

### Modified Files

```
src/lib/components/Manifesto.svelte              — MODIFY: import sub-components, reduce to orchestrator
src/routes/tech-stack/+page.svelte               — MODIFY: import sub-components, reduce to orchestrator
src/lib/components/HomeCloser.svelte             — MODIFY: import sub-components, reduce to orchestrator
src/lib/components/HeroBanner.svelte             — MODIFY: import TS modules + sub-components
src/lib/components/HomeServices.svelte           — MODIFY: import ServicesBlueprint, import Blueprint* SVG components
src/lib/components/StackPanel.svelte             — MODIFY: import StackPanelOrientation
static/svg/services/*.svg (6 files)              — MODIFY: replace #E07800 → var(--primary), #FFB627 → var(--accent)
```

### Deleted Files

```
# Orphan SVGs (zero references in codebase)
static/svg/data.svg                              — DELETE
static/svg/logic.svg                             — DELETE
static/svg/motion.svg                            — DELETE
static/svg/pixels.svg                            — DELETE
static/svg/stop-sign.svg                         — DELETE
static/svg/train-station.svg                     — DELETE
static/svg/understand.svg                        — DELETE
static/svg/unforgettable.svg                     — DELETE
static/svg/foundation.svg                        — DELETE
```

---

## Task 0: Repo Restructuring — Domain Folders + Renames + Route Change

**Files:**
- Create: 9 new directories (`layout/`, `home/`, `about/`, `blog/`, `projects/`, `services/`, `stack/`, `contact/`, `shared/`)
- Move + rename: ~90 component files + co-located test files from `src/lib/components/` root into domain folders
- Rename route: `src/routes/work/` → `src/routes/projects/`
- Modify: all route files, cross-component imports, internal `href="/work/..."` links

- [ ] **Step 1:** Create all 9 domain directories under `src/lib/components/`.

- [ ] **Step 2:** Move layout components → `layout/`:
  - Nav, Footer, MenuOverlay, ReadingProgressBar + test files
  - **Rename:** `InfraFrame` → `ControlRoom` (move + rename)

- [ ] **Step 3:** Move + rename home page components → `home/`:
  - HeroBanner, HeroSqlPanel, HeroMetrics, HomeServices, HomeCloser, Manifesto, ManifestoCanvas, DataFlowDiagram, SkillsJourney + test files
  - **Rename:** `ProofReel` → `FeaturedProjects`
  - **Rename:** `ProofStrip` → `RelatedProjects`
  - **Rename:** `ConstructionScene` → `ErrorIllustration`

- [ ] **Step 4:** Move about components → `about/`:
  - AboutPage, AboutCta, AboutIdentity, AboutInterests, AboutLogos, AboutMetrics, AboutMethod, AboutPolaroids, AboutTestimonials, AboutTrain, AboutWeather + test files

- [ ] **Step 5:** Move blog components → `blog/`:
  - BlogListingPage, BlogRow, BlogContent, BlogDetailHeader, BlogFeed, BlogFilterMobile, BlogFilterSidebar + test files

- [ ] **Step 6:** Move + rename project components → `projects/`:
  - **Rename:** `WorkCard` → `ProjectCard`
  - **Rename:** `WorkListingPage` → `ProjectListingPage`
  - **Rename:** `WorkDetailPage` → `ProjectDetailPage`
  - **Rename:** `WorkDetailSidebar` → `ProjectDetailSidebar`
  - **Rename:** `WorkFilterMobile` → `ProjectFilterMobile`
  - **Rename:** `WorkFilterSidebar` → `ProjectFilterSidebar`
  - **Rename:** `WorkServiceBadge` → `ServiceBadge`
  - Move: `ProjectMiniCard` (name already correct)
  - + all test files (renamed to match)

- [ ] **Step 7:** Move services components → `services/`:
  - ServiceCard, ServiceDetailPage, ServiceListingPage, ServiceNav + test files

- [ ] **Step 8:** Move stack components → `stack/`:
  - StackBottomSheet, StackConfigurator, StackConnections, StackDiagram, StackFilters, StackNode, StackPanel, StackScenarioCard + test files

- [ ] **Step 9:** Move contact + shared:
  - ContactPage → `contact/`
  - CollapsibleSection, FilterGroup, TagList, TableOfContents, TerminalCursor, StationTabs → `shared/`
  - + all test files

- [ ] **Step 10:** Rename route: `src/routes/work/` → `src/routes/projects/` (directory + all files inside). Update all `href="/work/..."` links across the entire codebase to `href="/projects/..."`.

- [ ] **Step 11:** Update all imports across `src/routes/` and cross-component references:
  - Bulk find-replace per domain folder path
  - Update all renamed component references (Work* → Project*, InfraFrame → ControlRoom, ProofReel → FeaturedProjects, etc.)
  - Update data-testid attributes to match new names
  - Verify no broken imports remain

- [ ] **Step 12:** Run `bun run test` + `bun run check`. All 717+ tests must pass. Zero import errors.

**STOP. Ask Yesid to verify:**
- All pages load correctly (home, blog, `/projects/`, services, tech-stack, contact)
- `/projects/` route works (old `/work/` no longer needed)
- No broken imports or missing components
- Zero visual regression — purely structural + naming

---

## Task 1: Split Manifesto (1006 → ~320 lines)

**Files:**
- Create: `ManifestoEdgeLeft.svelte`, `ManifestoEdgeRight.svelte`, `ManifestoEdgeTop.svelte`, `ManifestoEdgeBottom.svelte`, `ManifestoTransit.svelte`
- Modify: `src/lib/components/Manifesto.svelte`

- [ ] **Step 1:** Read Manifesto.svelte fully. Map each visual section to a sub-component:
  - ManifestoEdgeLeft: beck-lines SVG, roundels, left-side decorations
  - ManifestoEdgeRight: flow-lines, stripes, right-side decorations
  - ManifestoEdgeTop: top edge elements
  - ManifestoEdgeBottom: bottom edge elements
  - ManifestoTransit: transit easter egg (train, station, route map)

- [ ] **Step 2:** Extract each sub-component with its markup + corresponding scoped CSS. Each sub-component receives data via props from parent.

- [ ] **Step 3:** GSAP animations that coordinate across sub-components stay in parent Manifesto. Self-contained animations (e.g., a single pulse loop) move into children. Use `bind:this` in parent to reference child DOM elements.

- [ ] **Step 4:** Update parent to import and render sub-components. Parent becomes the orchestrator: data prep, GSAP timeline, layout grid.

- [ ] **Step 5:** Verify Manifesto.svelte line count < 400.

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Manifesto looks and animates identically (beck-lines draw, roundels pulse, transit elements appear)
- All edge decorations render at xl:+ breakpoint

---

## Task 2: Split tech-stack/+page (919 → ~380 lines)

**Files:**
- Create: `TechStackHero.svelte`, `TechStackCta.svelte`, `TechStackBuildSection.svelte`, `TechStackDivider.svelte`
- Modify: `src/routes/tech-stack/+page.svelte`

- [ ] **Step 1:** Read tech-stack/+page.svelte fully. Map sections to sub-components.

- [ ] **Step 2:** Extract TechStackHero — terminal animation + typewriter + stats + overline. This is the top section with the hero terminal and 4 stat counters.

- [ ] **Step 3:** Extract TechStackBuildSection — **DE-DUPLICATE** from 3 copies (desktop/tablet/mobile) into 1 component used 3 times with responsive props. This is the biggest win — 3 near-identical blocks become 1.

- [ ] **Step 4:** Extract TechStackCta — heading + subtext + CTA buttons.

- [ ] **Step 5:** Extract TechStackDivider — section label + separator pattern.

- [ ] **Step 6:** Update parent page to import and compose sub-components.

- [ ] **Step 7:** Verify page line count < 400.

- [ ] **Step 8:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Tech-stack page looks identical at all breakpoints (desktop, tablet, mobile)
- Terminal typewriter animation plays correctly
- Hero stats render correctly
- "Build Your Stack" section renders at all 3 breakpoints (now 1 component, was 3 copies)

---

## Task 3: Split HomeCloser (749 → ~280 lines)

**Files:**
- Create: `CloserGraffiti.svelte`, `CloserFloodlight.svelte`, `CloserProps.svelte`, `CloserTerminalBoard.svelte`
- Modify: `src/lib/components/HomeCloser.svelte`

- [ ] **Step 1:** Read HomeCloser.svelte fully. Map sections to sub-components:
  - CloserGraffiti: loadGraffiti/resetGraffiti/animateGraffiti functions + SVG fetch/parse + graffiti wrapper + DrawSVG styles
  - CloserFloodlight: inline floodlight SVG + beam div + glow styles
  - CloserProps: construction prop SVG fetch/inject + absolute-positioned props
  - CloserTerminalBoard: TerminalChrome wrapper + departure row rendering + cursor + styles

- [ ] **Step 2:** Extract each sub-component. CloserGraffiti is the most complex — it owns the DrawSVG animation lifecycle (fetch SVG → parse paths → animate draw).

- [ ] **Step 3:** GSAP ScrollTrigger timeline stays in parent HomeCloser (coordinates all children). Sub-components expose DOM refs via bind:this for parent timeline integration.

- [ ] **Step 4:** Update parent to compose sub-components.

- [ ] **Step 5:** Verify HomeCloser line count < 400.

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- HomeCloser looks and animates identically
- Graffiti DrawSVG animation plays on scroll
- Floodlight beam renders with 3D perspective
- Construction props appear at bottom edges
- Departure board rows animate in terminal

---

## Task 4: Split HeroBanner (734 → ~330 lines)

**Files:**
- Create: `src/lib/motion/utils/heroTimeline.ts`, `heroScrollLock.ts`, `heroTypewriter.ts`
- Create: `src/lib/components/HeroTextContent.svelte`, `HeroMobileSql.svelte`
- Modify: `src/lib/components/HeroBanner.svelte`

- [ ] **Step 1:** Read HeroBanner.svelte fully. Identify extractable TS logic and sub-components.

- [ ] **Step 2:** Extract heroTimeline.ts — `buildHeroTimeline()` function that takes DOM refs and returns a GSAP timeline. All measurement utilities (calculating positions, scales) go here. Pure functions, no Svelte state.

- [ ] **Step 3:** Extract heroScrollLock.ts — scroll lock/unlock logic (prevents scroll during hero animation, releases after).

- [ ] **Step 4:** Extract heroTypewriter.ts — typewriter text effect + cursor blink functions.

- [ ] **Step 5:** Extract HeroTextContent.svelte — headline, HeroMetrics sub-component, subheadline, CTA buttons. The text column of the hero.

- [ ] **Step 6:** Extract HeroMobileSql.svelte — mobile SQL panel section.

- [ ] **Step 7:** Update parent HeroBanner to import TS modules and sub-components.

- [ ] **Step 8:** Verify HeroBanner line count < 400.

- [ ] **Step 9:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Hero scroll-lock animation plays correctly (scroll locked during animation, released after)
- Typewriter effect types out correctly
- Hero text + metrics render at desktop and mobile
- Mobile SQL panel renders correctly on small viewports
- No visual regression at any breakpoint

---

## Task 5: Split HomeServices + StackPanel

**Files:**
- Create: `src/lib/components/ServicesBlueprint.svelte`
- Create: `src/lib/components/StackPanelOrientation.svelte`
- Modify: `src/lib/components/HomeServices.svelte`
- Modify: `src/lib/components/StackPanel.svelte`

- [ ] **Step 1:** Extract ServicesBlueprint from HomeServices — the background SVG grid with blueprint train images. This is the decorative layer that sits behind the service cards.

- [ ] **Step 2:** Extract StackPanelOrientation from StackPanel — the hint/orientation card that appears when no stack item is selected.

- [ ] **Step 3:** Update parents to import and render sub-components.

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- HomeServices blueprint grid renders behind service cards
- StackPanel orientation hint appears when no item selected

---

## Task 6: Blueprint SVGs → Svelte Components (12 files)

**Files:**
- Create: 12 `src/lib/components/svg/Blueprint*.svelte` components
- Modify: `src/lib/components/HomeServices.svelte` (or `ServicesBlueprint.svelte` after Task 5)

- [ ] **Step 1:** List all 12 SVG files in `static/svg/blueprint/`. Read each to understand structure.

- [ ] **Step 2:** For each blueprint SVG, create a Svelte component:
  - Inline the SVG markup directly in the component
  - Replace all `#E07800` (brand orange) with `currentColor` or `var(--primary)`
  - Replace any `#FFB627` (brand yellow) with `var(--accent)` if present
  - Follow the Train.svelte pattern if one exists
  - Accept `class` prop for consumer styling

- [ ] **Step 3:** Update HomeServices (or ServicesBlueprint) to import Blueprint* components instead of `<img src="/svg/blueprint/...">`. This enables CSS vars to work (inline SVG, not `<img>`).

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- HomeServices blueprint grid renders identically (SVGs are orange via token, not hardcoded)
- SVGs respond to theme changes if light theme is toggled

---

## Task 7: Services SVG Tokenization (6 files)

**Files:**
- Modify: `static/svg/services/*.svg` (6 files)

- [ ] **Step 1:** Read each services SVG file. These are already fetch-injected at runtime, so CSS vars work after injection.

- [ ] **Step 2:** In each file:
  - Replace `#E07800` → `var(--primary)`
  - Replace `#FFB627` → `var(--accent)`
  - Replace any other hardcoded brand colors with appropriate tokens

- [ ] **Step 3:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Service card SVGs still render correctly (color comes from CSS var, not hardcoded)
- Service detail page SVGs render correctly

---

## Task 8: Delete Orphan SVGs (9 files)

**Files:**
- Delete: 9 files in `static/svg/` (data, logic, motion, pixels, stop-sign, train-station, understand, unforgettable, foundation)

- [ ] **Step 1:** Verify zero references in codebase — run grep for each filename across src/ and static/.

- [ ] **Step 2:** Delete all 9 files.

- [ ] **Step 3:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- No broken images on any page
- Build passes clean

---

## Execution Order

```
Session 1 — Repo Restructuring + First File Splits
  Task 0 (Repo restructure) → MUST be first, all subsequent tasks depend on it
  Task 1 (Manifesto) → independent, largest file
  Task 2 (tech-stack) → independent

Session 2 — Remaining Splits + SVG Prep
  Task 3 (HomeCloser) → independent
  Task 4 (HeroBanner) → independent
  Task 5 (HomeServices + StackPanel) → independent, smallest

Session 3 — SVG Tokenization
  Task 6 (Blueprint SVGs → Svelte) → depends on Task 5 (ServicesBlueprint exists)
  Task 7 (Services SVG tokenization) → independent
  Task 8 (Delete orphans) → independent, last
```

Task 0 must complete first — it establishes the folder structure all file splits land in. Tasks 1-5 are then fully independent. Task 6 depends on Task 5 (imports go into ServicesBlueprint, not HomeServices). Tasks 7-8 are independent.

Sessions 2 and 3 can likely be combined if session 1 is efficient — Tasks 3-5 are smaller splits, and Tasks 7-8 are trivial.

## Out of Scope

- Wiring SectionLabel, MetricDisplay, TerminalChrome, StatusDot (17d-4)
- Semantic HTML fixes (17d-4)
- Scroll behavior fixes (17d-4)
- Props standardization (17d-4)
- Edge-to-edge pass (17d-5)
- Motion preset system (17e)

## Acceptance Criteria

- [ ] `src/lib/components/` root has zero `.svelte` files — all moved into domain folders
- [ ] 9 domain folders created: `layout/`, `home/`, `about/`, `blog/`, `projects/`, `services/`, `stack/`, `contact/`, `shared/`
- [ ] All component renames applied: ControlRoom, FeaturedProjects, RelatedProjects, ErrorIllustration, ProjectCard, ProjectListingPage, ProjectDetailPage, ProjectDetailSidebar, ProjectFilterMobile, ProjectFilterSidebar, ServiceBadge
- [ ] Route renamed: `/work/` → `/projects/` — all internal links updated
- [ ] Zero references to old names (InfraFrame, ProofReel, ProofStrip, ConstructionScene, Work*) in code
- [ ] All imports updated — zero broken references across routes and components
- [ ] Manifesto.svelte < 400 lines — 5 sub-components extracted
- [ ] tech-stack/+page.svelte < 400 lines — 4 sub-components, TechStackBuildSection de-duped from 3→1
- [ ] HomeCloser.svelte < 400 lines — 4 sub-components extracted
- [ ] HeroBanner.svelte < 400 lines — 3 TS modules + 2 sub-components extracted
- [ ] HomeServices + StackPanel each reduced — 1 sub-component each
- [ ] Zero files > 600 lines in entire codebase
- [ ] 12 blueprint SVGs converted to Svelte components with `var(--primary)` — zero hardcoded `#E07800`
- [ ] 6 services SVGs tokenized — `#E07800` → `var(--primary)`, `#FFB627` → `var(--accent)`
- [ ] 9 orphan SVGs deleted — zero unreferenced SVGs in static/svg/
- [ ] All GSAP animations work identically after splits (parent orchestrates, children provide DOM refs)
- [ ] TechStackBuildSection is 1 component rendered 3x (was 3 copy-pasted blocks)
- [ ] `bun run test` + `bun run check` pass

## Learn

### Domain-Based Component Organization
**What it is:** Reorganizing a flat component directory into domain folders (home/, blog/, work/, etc.) where each folder contains all components for that feature area, co-located with their tests.
**Why it matters:** A flat directory with 90+ files makes feature discovery painful — "which components belong to the blog?" requires scanning every filename. Domain folders make imports self-documenting (`$lib/components/blog/BlogRow.svelte`) and reduce cognitive load when working on a specific page.
**Try this:** Open `src/lib/components/` after restructuring. Navigate to `home/` — every component for the home page is right there. Compare to the old flat structure in git history.
**Go deeper:** Feature-based folder structure, Atomic Design methodology

### File Splitting Strategy
**What it is:** Breaking a 1000-line component into a parent orchestrator (~300 lines) + focused child components (~100-200 lines each). Parent owns layout + coordination. Children own their markup + scoped CSS.
**Why it matters:** Smaller files are easier to debug, review, and modify. Each child component has a single responsibility — change the graffiti animation without touching the departure board.
**Try this:** Open the split Manifesto parent. Notice how it imports 5 children and coordinates them with a GSAP timeline. Each child is self-contained for its visual section.
**Go deeper:** Single Responsibility Principle

### GSAP Animation Ownership
**What it is:** When splitting animated components, coordinated timelines stay in the parent. Self-contained animations move into children.
**Why it matters:** A departure board row animation doesn't depend on the floodlight — it can live in CloserTerminalBoard. But the ScrollTrigger that sequences graffiti→board→props must stay in HomeCloser to coordinate timing.
**Try this:** Look at how CloserGraffiti exposes DOM refs via bind:this so the parent's ScrollTrigger can target them.
**Go deeper:** GSAP nested timelines pattern

### SVG Tokenization
**What it is:** Replacing hardcoded hex colors (`#E07800`) with CSS custom properties (`var(--primary)`) in SVG files. For `<img>` loaded SVGs, this requires converting to inline Svelte components (CSS vars don't penetrate `<img>`).
**Why it matters:** All brand SVGs become theme-aware. Toggle to light theme → SVGs adapt. Change brand orange → all 743 SVG instances update automatically.
**Try this:** Open a Blueprint*.svelte component. All colors reference `var(--primary)` instead of `#E07800`. If you change `--primary` in tokens.css, every blueprint SVG changes.
**Go deeper:** SVG and CSS custom properties

### Build Section De-duplication
**What it is:** Three copy-pasted versions of the "Build Your Stack" section (desktop/tablet/mobile) become one component rendered 3 times with responsive props.
**Why it matters:** Bug in the build section? Fix once. New feature? Add once. Three identical blocks = 3x the maintenance burden.
**Try this:** Compare the old tech-stack page (git diff) — three nearly identical blocks become `<TechStackBuildSection />` rendered 3 times. Count the lines saved.
**Go deeper:** Component-driven responsive design

## Verify

1. **Restructure:** All pages load — home, blog, `/projects/`, `/projects/[slug]`, services, tech-stack, contact, 404
2. **Restructure:** Zero references to old names (InfraFrame, ProofReel, ProofStrip, ConstructionScene, Work*) in codebase
3. **Restructure:** `/projects/` route works, old `/work/` gone
4. Home page — hero scroll animation works (HeroBanner split)
5. Home page — FeaturedProjects section renders project cards with impact metrics
6. Home page — manifesto animates correctly (beck-lines, roundels, transit)
7. Home page — HomeCloser graffiti draws, floodlight renders, departure board animates
8. Home page — HomeServices blueprint grid renders behind cards
9. Tech-stack page — ControlRoom wraps StackDiagram correctly
10. Tech-stack page — hero terminal typewriter plays, stats render
11. Tech-stack page — "Build Your Stack" section renders at desktop/tablet/mobile (de-duped)
12. Tech-stack page — StackPanel orientation hint appears
13. HomeServices — blueprint SVGs are orange via `var(--primary)`, not hardcoded hex
14. Services index — service card SVGs render correctly (tokenized)
15. 404 page — ErrorIllustration renders construction scene
16. No broken images on any page (orphan SVGs deleted)
17. All pages scroll correctly
18. Run `bun run test` — all tests pass
19. Run `bun run check` — zero errors
