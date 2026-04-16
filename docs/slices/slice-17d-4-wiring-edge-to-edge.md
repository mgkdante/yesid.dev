# Slice 17d-4: Wiring + Edge-to-Edge Pass

**Combines:** old 17d-6 (Tasks 24-27) + old 17d-7 (Tasks 28-32)
**Branch:** `feature/slice-17d-component-api` (continue)
**Status:** PLANNED
**Estimated sessions:** ~8.5

---

## Context

This is the visual payoff of 17d. Every atom, shell, and primitive built in 17d-1/2/3 now gets wired into the site. Then every page gets a full creative pass — edge-to-edge, enriched with rotated labels, icons, info elements, and real content. The goal is a site that's cool to visit, not just structurally sound.

**What 17d-1/2/3 built (confirmed in codebase):**
- `brand/`: Card (via ui/card), SectionHeading, SectionLabel, MetroStation, MetricDisplay, StatusDot, TerminalChrome, CornerMarks, StopLabel, ChevronToggle, GlowOverlay, SvgIcon, StickyPanel
- `shells/`: SectionWrapper, EdgeRail, AsidePanel, DetailHero, CardGrid, BentoGrid, ListingShell
- `svg/`: 12 Blueprint* Svelte components, 6 tokenized services SVGs
- File splits: Manifesto, HomeCloser, HeroBanner, HomeServices, StackPanel all split into sub-components
- Route: `/work/` → `/projects/` complete

**What is NOT done (verified against codebase):**
- SectionWrapper: built but wired into ZERO routes or page components
- EdgeRail: built but wired into ZERO routes or page components
- SectionHeading: wired in FeaturedProjects + HomeServices only — all other pages hand-rolled
- SectionLabel: wired in StackPanel only — 7+ instances remaining
- MetroStation: wired in ProjectListingPage — BlogRow imported but hand-rolled CSS remains; +error untouched
- MetricDisplay: wired in AboutLogos, AboutMetrics, HeroMetrics — tech-stack hero stats still hand-rolled
- StatusDot: wired in tech-stack (1 instance) — HeroSqlPanel, ManifestoEdgeBottom, ControlRoom, Footer, +error untouched
- TerminalChrome: wired in ContactPage + CloserTerminalBoard — ControlRoom not composed
- Card unification: partial — most pages still hand-roll card surfaces
- Semantic HTML: dual h1, missing h1s, heading hierarchy, `<time>` tags — all unfixed
- Scroll fixes: drawer scroll, tab swipe, TerminalChrome overflow — all unfixed
- Props standardization: most consumer-facing components missing exported Props + class + ...rest

**Stale references from original plan (no longer applicable):**
- InfraFrame → now ControlRoom (`src/lib/components/layout/ControlRoom.svelte`)
- ProofReel → now FeaturedProjects
- Work* → Project* (route + components renamed in 17d-3)
- Tech-stack engine (ControlRoom + StackDiagram + Build Your Stack) → stripped in 17d-3; only Hero + CTA remain
- SvgMorphBox → deprecated, skip entirely

---

## Structure

```
SESSION 0 — Pre-pass (1 session)
  Complete atom wiring across the site + semantic HTML + scroll + props

SESSION 1 — Home (1 session)
SESSION 2 — About (1 session)
SESSION 3 — Blog (1 session)
SESSION 4 — Projects (1 session)
SESSION 5 — Services (1 session)
SESSION 6 — Contact + 404 (1 session)
SESSION 7 — Tech-stack (1 session)
SESSION 8 — Post-sweep (0.5 session)
```

---

## SESSION 0: Pre-Pass — Complete Wiring

Goal: zero unwired brand primitives. Run this before any visual page work so that infra issues don't interrupt creative sessions.

### P1: Wire SectionHeading into remaining consumers

Replace all hand-rolled `heading + orange dot + mono subheading` patterns with `<SectionHeading>`.

**Files to update:**
- `src/lib/components/blog/BlogListingPage.svelte`
- `src/lib/components/projects/ProjectListingPage.svelte` (if hand-rolled)
- `src/lib/components/services/ServiceCard.svelte` (if applicable)
- `src/routes/tech-stack/+page.svelte`
- `src/lib/components/about/AboutPage.svelte` (section headings within bento)
- `src/lib/components/contact/ContactPage.svelte`

**Checklist:**
- [ ] Audit each file for hand-rolled heading + dot + subheading patterns
- [ ] Replace with `import { SectionHeading } from '$lib/components/brand'`
- [ ] Remove duplicate CSS for those patterns
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify headings look identical across affected pages.**

### P2: Wire SectionLabel into remaining consumers

Replace all hand-rolled mono/uppercase inline labels with `<SectionLabel>`.

**Files to update:**
- `src/lib/components/contact/ContactPage.svelte` — overline labels
- `src/routes/tech-stack/+page.svelte` — stat labels, section markers
- `src/lib/components/home/FeaturedProjects.svelte` — section overline
- `src/lib/components/services/ServiceCard.svelte` — category label
- `src/routes/+error.svelte` — "ERROR" / status labels
- `src/lib/components/services/ServiceNav.svelte` — nav labels
- `src/lib/components/blog/BlogListingPage.svelte` — if present
- `src/lib/components/projects/ProjectListingPage.svelte` — if present

**Checklist:**
- [ ] Audit each file for hand-rolled mono uppercase label spans
- [ ] Replace with `<SectionLabel>`
- [ ] Remove duplicate CSS (`.hero-overline`, `.section-subheading`, `.nav-label`, `.station-counter`)
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify labels look identical.**

### P3: Wire MetroStation + clean up BlogRow

**Files to update:**
- `src/lib/components/blog/BlogRow.svelte` — remove hand-rolled station CSS, MetroStation already imported
- `src/routes/+error.svelte` — wire MetroStation for metro dots

**Checklist:**
- [ ] BlogRow: remove `.station-badge-wrapper`, `.station-pulse`, `@keyframes station-ping` from scoped CSS (MetroStation handles these)
- [ ] +error: wire MetroStation for filled metro dots (hollow dots may remain manual per prior decision)
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify BlogRow + error page metro elements look correct.**

### P4: Wire MetricDisplay into remaining consumers

**Files to update:**
- `src/routes/tech-stack/+page.svelte` — hero stat values (`.hero-stat-value` + `.hero-stat-label` pattern)

**Checklist:**
- [ ] Replace hand-rolled stat markup with `<MetricDisplay>`
- [ ] Check if MetricDisplay needs API extension (e.g. `before` prop for prefix text)
- [ ] Remove duplicate CSS
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify tech-stack hero stats look correct.**

### P5: Wire StatusDot into remaining consumers

**Files to update:**
- `src/lib/components/home/HeroSqlPanel.svelte` — status/pulse indicator
- `src/lib/components/home/ManifestoEdgeBottom.svelte` — dot indicators
- `src/lib/components/layout/ControlRoom.svelte` — status indicators
- `src/lib/components/layout/Footer.svelte` — status dots
- `src/routes/+error.svelte` — filled dots (hollow dots remain manual if API doesn't cover)

**Checklist:**
- [ ] Audit each file for hand-rolled pulse/status dot patterns
- [ ] Replace with `<StatusDot>` where API covers
- [ ] Document any patterns StatusDot doesn't cover (leave manual, add comment)
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify status indicators look correct across affected components.**

### P6: Compose TerminalChrome into ControlRoom + fix overflow

**Files to update:**
- `src/lib/components/layout/ControlRoom.svelte` — compose TerminalChrome internally
- `src/lib/components/brand/TerminalChrome.svelte` — add `overflow-y: auto` to `.terminal-body`

**Checklist:**
- [ ] TerminalChrome: add `overflow-y: auto` to `.terminal-body` (fixes About/Services terminal scroll)
- [ ] ControlRoom: import TerminalChrome, refactor to compose it (ControlRoom = TerminalChrome + CornerMarks + grid overlay)
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify ControlRoom looks identical. Verify terminal body scrolls on About + Services.**

### P7: Semantic HTML fixes

**Files to update:**
- `src/lib/components/home/HeroBanner.svelte` — dual `<h1>` at lines 485+499 → single `<h1>` with `<span>` children
- `src/lib/components/about/AboutIdentity.svelte` — promote `<h2>` → `<h1>`
- `src/lib/components/services/ServiceCard.svelte` — add page-level `<h1>`
- `src/lib/components/blog/BlogRow.svelte` — fix heading hierarchy, wrap date in `<time datetime>`
- `src/lib/components/projects/ProjectCard.svelte` — fix heading hierarchy
- `src/lib/components/blog/BlogDetailHeader.svelte` — wrap date in `<time datetime>`

**Checklist:**
- [ ] Fix all dual/missing h1 issues
- [ ] Fix heading hierarchy (h3 where h2 expected, etc.)
- [ ] Wrap all dates in `<time datetime="YYYY-MM-DD">`
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify headings and dates look correct. Run accessibility check.**

### P8: Scroll fixes

**Files to update:**
- `src/lib/components/brand/TerminalChrome.svelte` — already covered in P6
- `src/lib/components/shared/StationTabs.svelte` — horizontal swipe on mobile
- Layout/drawer: StackBottomSheet drawer content scroll (may already be fixed by vaul-svelte in 17a-6)

**Checklist:**
- [ ] StationTabs: add `overflow-x: auto; -webkit-overflow-scrolling: touch` to tab list
- [ ] StackBottomSheet: verify drawer content scrolls vertically (vaul-svelte should handle — confirm)
- [ ] Verify page-level vertical scroll unblocked on all pages
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify: drawer scrolls, tabs swipe on mobile, all pages scroll.**

### P9: Props standardization

Every consumer-facing component must export a named Props interface + accept `class` + `...rest`.

**Priority files (consumed by shells or other pages):**
- `src/lib/components/blog/BlogRow.svelte`
- `src/lib/components/projects/ProjectCard.svelte`
- `src/lib/components/services/ServiceCard.svelte`
- `src/lib/components/home/FeaturedProjects.svelte`
- `src/lib/components/home/HomeServices.svelte`
- `src/lib/components/contact/ContactPage.svelte`
- All shells: SectionWrapper, EdgeRail, ListingShell, DetailHero, CardGrid, BentoGrid, AsidePanel

**Checklist:**
- [ ] Audit each file for missing Props interface
- [ ] Add `export interface ComponentNameProps { ... }` with JSDoc on non-obvious props
- [ ] Add `class?: string` + `...rest` to each
- [ ] `bun run test` + `bun run check`
- [ ] **STOP. Verify no regressions.**

---

## Page Block Framework

Every page runs these 9 steps. Steps 1-3 happen before any code is touched. Steps 4-9 are one approval cycle.

```
[ ] 1. AUDIT       — inventory what's hand-rolled vs wired, what's missing content
[ ] 2. RESEARCH    — competitive scan (Chrome DevTools MCP), trend check
                     (frontend-design-pro:trend-researcher, frontend-design-pro:analyze-site)
[ ] 3. BRAINSTORM  — mini design session: SectionWrapper layout patterns per section,
                     EdgeRail content, enrichment ideas (labels, icons, info, annotations).
                     Log all decisions as D-numbers in devlog.
[ ] 4. SECTION WRAP — apply SectionWrapper to each major section (layout pattern A/B/C/D)
                      Move background decorations into `background` slot
                      Move edge content into `sideLeft` / `sideRight` slots
[ ] 5. EDGE RAIL   — wire EdgeRail (left + right) with page-specific content
                     Rotated page label, section markers, annotations, metrics
[ ] 6. CARDS       — replace remaining hand-rolled card surfaces with Card atom
                     Add appropriate motion actions (tilt, cursorGlow, boop) per card type
[ ] 7. ENRICH      — add rotated labels, icons, info elements, annotations
                     Fill content gaps (sparse sections get real content)
                     Research-driven: use design patterns found in steps 2-3
[ ] 8. SEMANTIC    — any remaining semantic HTML fixes specific to this page
[ ] 9. VERIFY      — bun run test + bun run check → screenshot proof → STOP → Yesid approves
```

**Tools to use during steps 2-3 (as appropriate per page):**
- Chrome DevTools MCP — competitive scan at multiple breakpoints
- `frontend-design-pro:trend-researcher` — current UI/UX patterns
- `frontend-design-pro:analyze-site` — structured analysis of reference sites
- `frontend-design-pro:design-wizard` — interactive design decisions
- Figma MCP — if design references exist
- GSAP Master MCP — if enrichment involves motion

---

## SESSION 1: Home

**Sections:** HeroBanner, Manifesto, FeaturedProjects, HomeServices, HomeCloser

**Known gaps:**
- No SectionWrapper on any section (all render directly in +page.svelte)
- No EdgeRail wired
- HeroBanner: dual h1 (fixed in P7), no edge decoration
- Manifesto: no SectionWrapper — complex GSAP animation, approach carefully
- FeaturedProjects: SectionHeading wired, cards may need Card atom
- HomeServices: SectionHeading wired, BlueprintSVGs now components
- HomeCloser: construction site metaphor, STOP labels present

**Key constraint:** HeroBanner has scroll-locked GSAP timeline. SectionWrapper must not break the animation. Use `layout="bleed"` or `layout="split"` as appropriate.

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 2: About

**Sections:** AboutPage bento dashboard — AboutIdentity, AboutInterests, AboutMethod, AboutMetrics, AboutLogos, AboutPolaroids, AboutTestimonials, AboutWeather, AboutCta, AboutTrain

**Known gaps:**
- No SectionWrapper wrapping About sections
- No EdgeRail
- AboutPage has the bento grid — SectionWrapper applies at the page level, BentoGrid shell handles internal layout
- StopLabel already wired (all 10 bento cards)
- CornerMarks, tilt, cursorGlow already wired
- AboutIdentity: h2→h1 fix (done in P7)
- Sparse sections: AboutWeather, AboutPolaroids — may need content enrichment

**Key constraint:** Bento grid uses named CSS grid areas. SectionWrapper wraps the outer page, BentoGrid handles the internal grid. Don't break the tilt/cursorGlow actions.

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 3: Blog

**Sections:** BlogListingPage (listing + filters + sidebar), blog/[slug] (detail: header + content + TOC + sticky panel)

**Known gaps:**
- No SectionWrapper on listing or detail
- No EdgeRail
- BlogListingPage: ListingShell shell built but not wired
- BlogRow: SvgIcon + MetroStation wired, hand-rolled CSS cleaned in P3, heading + time fixed in P7
- BlogDetailHeader: time fixed in P7, may need enrichment
- BlogContent: prose-dark wired
- StickyPanel: wired in blog/[slug] detail
- Sparse: detail header feels minimal — enrichment opportunity

**Key constraint:** ListingShell wiring may change DOM structure. Verify filter sidebar + mobile filter still work after wiring.

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 4: Projects

**Sections:** ProjectListingPage (listing + filters), projects/[slug] (detail: header + content + sidebar)

**Known gaps:**
- No SectionWrapper
- No EdgeRail
- ProjectListingPage: MetroStation wired, ListingShell not wired
- ProjectCard: heading hierarchy fixed in P7, hand-rolled card surface
- ProjectDetailPage: SvgIcon wired, DetailHero shell not wired
- AsidePanel shell: built but not wired

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 5: Services

**Sections:** ServiceListingPage (service grid), services/[id] (detail: header + content + nav), ServiceNav, ServiceCard

**Known gaps:**
- No SectionWrapper on any services page
- No EdgeRail
- ServiceCard: SectionLabel wired in P2, h1 added in P7, hand-rolled card surface, SvgMorphBox deprecated (remove if present)
- ServiceDetailPage: SvgIcon wired, DetailHero shell not wired
- ServiceNav: SectionLabel wired in P2
- Sparse: ServiceListingPage header area, service detail sidebar

**Key constraint:** ServiceCard has the SVG morph animation (square→circle on hover). This is NOT SvgMorphBox — it's direct CSS/GSAP on the SVG. Keep it, just remove the SvgMorphBox wrapper if it exists.

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 6: Contact + 404

### Contact

**Component:** `src/lib/components/contact/ContactPage.svelte`

**Known gaps:**
- No SectionWrapper
- No EdgeRail
- TerminalChrome already wired (×2)
- SectionLabel wired in P2
- SectionHeading wired in P1
- Terminal aesthetic — edge content should feel like network diagnostics

**Run steps 1-9 per page framework above.**
**STOP after Contact. Yesid approves before 404.**

### 404

**Component:** `src/routes/+error.svelte`

**Known gaps:**
- No SectionWrapper
- No EdgeRail
- MetroStation wired in P3
- StatusDot wired in P5
- SectionLabel wired in P2
- Sparse page — needs enrichment

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 7: Tech-stack

**Route:** `src/routes/tech-stack/+page.svelte`

**Context:** Engine stripped in 17d-3 (D90). Only Hero + CTA remain (357 lines → needs content). This is the biggest creative gap in the site. Saved for last when visual language is fully established.

**Known gaps:**
- No SectionWrapper, no EdgeRail
- SectionLabel wired in P2, MetricDisplay wired in P4, StatusDot wired in P5, SectionHeading wired in P1
- Hero + CTA only — no tech content below the hero
- The stripped ControlRoom + StackDiagram will be re-engineered in Phase 2 (D90)
- For this slice: add meaningful content sections between Hero and CTA that work WITHOUT the engine
- Research-driven: what does a compelling tech stack page look like without interactive configurator?

**Key design question (for mini brainstorm):** What fills the space between Hero and CTA?  
Options to explore: tech philosophy section, methodology breakdown, key technologies grid, annotated diagram, timeline of tools.

**Run steps 1-9 per page framework above.**
**STOP after step 9. Yesid approves before continuing.**

---

## SESSION 8: Post-Sweep

**Goal:** Verify the site holds together as a system. Catch anything the page sessions missed.

**Checklist:**
- [ ] Zero files > 600 lines (`find src -name "*.svelte" | xargs wc -l | sort -rn | head -20`)
- [ ] Zero hand-rolled card surfaces (grep for `.card {`, `background.*card`, `border.*primary` in scoped styles)
- [ ] Zero hand-rolled section patterns (grep for `.section-heading`, `.section-label`, `.hero-overline` in scoped styles)
- [ ] All brand primitives verify in barrel export (`src/lib/components/brand/index.ts`)
- [ ] All shells verify in barrel export (`src/lib/components/shells/index.ts`)
- [ ] One `<h1>` per page (grep `<h1` in all routes)
- [ ] All dates in `<time>` (grep `date` in BlogRow, ProjectCard, BlogDetailHeader)
- [ ] EdgeRail wired on every route
- [ ] SectionWrapper wired on every route's major sections
- [ ] `bun run test` — 774/774 pass
- [ ] `bun run check` — 0 errors
- [ ] Update: `docs/reference/CONSTITUTION.md`, `docs/reference/CSS.md`, `docs/reference/TESTS.md`, `docs/reference/ARCHITECTURE.md`
- [ ] Add learning doc: `docs/learn/design-systems/atomic-wiring-patterns.md`
- [ ] Regenerate `tree.txt`
- [ ] **STOP. Final Yesid approval.**

---

## Acceptance Criteria

### Structural
- [ ] Zero hand-rolled section patterns — every major section uses SectionWrapper
- [ ] Zero hand-rolled card surfaces — every card surface uses Card atom
- [ ] Zero unwired brand primitives — every atom in all intended consumers
- [ ] Zero missing exported Props interfaces on consumer-facing components
- [ ] Zero files > 600 lines

### Visual
- [ ] Every page is edge-to-edge at every breakpoint (280px → 1440px+)
- [ ] Every page has a wired EdgeRail with page-specific content (rotated labels, markers, annotations)
- [ ] Every page has enrichment: rotated labels, icons, info elements, or annotations beyond just wiring
- [ ] Tech-stack page has real content sections between Hero and CTA
- [ ] No page feels sparse or unfinished

### Technical
- [ ] 774/774 tests pass (no regressions allowed)
- [ ] `bun run check` — 0 errors, warnings stable or reduced vs current 12
- [ ] Scroll law holds: TerminalChrome body scrolls, StationTabs swipes on mobile, no page scroll blocked
- [ ] One `<h1>` per page, no skipped heading levels
- [ ] All dates wrapped in `<time datetime="YYYY-MM-DD">`

### Documentation
- [ ] CONSTITUTION.md, CSS.md, TESTS.md, ARCHITECTURE.md updated
- [ ] `docs/learn/` entry added for atomic wiring patterns

---

## Out of Scope

- Motion preset system — 17e
- Dead code final sweep — 17a-4
- Light theme testing — future
- Tech-stack engine re-engineering (ControlRoom + StackDiagram) — Phase 2 (D90)
- SvgMorphBox — deprecated, no replacement needed

---

## Original Plan Cross-Reference

| Original Task | Status | Disposition |
|---|---|---|
| T24: Wire SectionLabel (8 instances) | Not done | → P2 (pre-pass) |
| T25: Wire MetricDisplay + TerminalChrome + StatusDot | Partial | → P4, P5, P6 (pre-pass) |
| T26: Scroll behavior fixes | Not done | → P8 (pre-pass) |
| T27a: Semantic HTML fixes | Not done | → P7 (pre-pass) |
| T27b: Props standardization | Not done | → P9 (pre-pass) |
| T28: SectionWrapper → home | Not done | → Session 1 |
| T29: SectionWrapper → subsites | Not done | → Sessions 2-7 |
| T30: Design + wire EdgeRail per page | Not done | → Sessions 1-7 (step 5) |
| T31: Card unification (18 instances) | Partial | → Sessions 1-7 (step 6) |
| T32: End-of-17d sweep | Not done | → Session 8 |
| SvgMorphBox (T9) | Deprecated | → Dropped |
| MetroStation/SectionHeading wiring gaps | Partial | → P1, P3 (pre-pass) |
