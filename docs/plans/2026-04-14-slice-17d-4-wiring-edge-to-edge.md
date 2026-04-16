# Slice 17d-4: Wiring + Edge-to-Edge Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire every brand primitive into all remaining consumers, then give every page a full creative pass — SectionWrapper, EdgeRail, Card unification, rotated labels, icons, info enrichment, and content gaps filled.

**Architecture:** Pre-pass resolves all infra debt (atom wiring, semantic HTML, scroll, props) in one clean sweep. Then each page gets a research → mini-brainstorm → wire → enrich → verify cycle. No design decisions are made upfront — all per-page design happens at implementation time during the mini-brainstorm step.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind v4, Bits UI, GSAP, shadcn-svelte

**Spec:** `docs/slices/slice-17d-4-wiring-edge-to-edge.md`

---

## Pre-Pass File Map

Files modified in the pre-pass (P1–P9). Page-pass files are listed per-session.

| Task | Files Modified |
|------|---------------|
| P1 SectionHeading | BlogListingPage, ProjectListingPage, ServiceCard, tech-stack/+page, AboutPage, ContactPage |
| P2 SectionLabel | ContactPage, tech-stack/+page, FeaturedProjects, ServiceCard, +error, ServiceNav, BlogListingPage, ProjectListingPage |
| P3 MetroStation | BlogRow (CSS cleanup), +error |
| P4 MetricDisplay | tech-stack/+page |
| P5 StatusDot | HeroSqlPanel, ManifestoEdgeBottom, ControlRoom, Footer, +error |
| P6 TerminalChrome | TerminalChrome.svelte (overflow), ControlRoom.svelte (compose) |
| P7 Semantic HTML | HeroBanner, AboutIdentity, ServiceCard, BlogRow, ProjectCard, BlogDetailHeader |
| P8 Scroll fixes | StationTabs, StackBottomSheet (verify) |
| P9 Props | BlogRow, ProjectCard, ServiceCard, FeaturedProjects, HomeServices, ContactPage, all shells |

---

## SESSION 0: Pre-Pass

### Task P1: Wire SectionHeading into remaining consumers

**Files:**
- Modify: `src/lib/components/blog/BlogListingPage.svelte`
- Modify: `src/lib/components/projects/ProjectListingPage.svelte`
- Modify: `src/lib/components/services/ServiceCard.svelte`
- Modify: `src/routes/tech-stack/+page.svelte`
- Modify: `src/lib/components/about/AboutPage.svelte`
- Modify: `src/lib/components/contact/ContactPage.svelte`

- [ ] In each file, grep for hand-rolled heading + dot + subheading patterns:
  ```bash
  grep -n "section-heading\|section-subheading\|\.dot\|orange.*dot\|heading.*dot" <file> | head -20
  ```
- [ ] Add import where missing:
  ```svelte
  import { SectionHeading } from '$lib/components/brand';
  ```
- [ ] Replace hand-rolled markup with `<SectionHeading heading="..." subheading="..." />`
- [ ] Delete the replaced CSS classes from `<style>` blocks (`.section-heading`, `.section-subheading`, `.heading-dot`, etc.)
- [ ] `bun run test && bun run check`
- [ ] **STOP. Check each affected page visually — headings must look identical.**

### Task P2: Wire SectionLabel into remaining consumers

**Files:**
- Modify: `src/lib/components/contact/ContactPage.svelte`
- Modify: `src/routes/tech-stack/+page.svelte`
- Modify: `src/lib/components/home/FeaturedProjects.svelte`
- Modify: `src/lib/components/services/ServiceCard.svelte`
- Modify: `src/routes/+error.svelte`
- Modify: `src/lib/components/services/ServiceNav.svelte`
- Modify: `src/lib/components/blog/BlogListingPage.svelte`
- Modify: `src/lib/components/projects/ProjectListingPage.svelte`

- [ ] In each file, grep for hand-rolled mono uppercase label patterns:
  ```bash
  grep -n "hero-overline\|section-subheading\|nav-label\|station-counter\|text-.*uppercase.*mono\|font-mono.*uppercase" <file>
  ```
- [ ] Add import where missing:
  ```svelte
  import { SectionLabel } from '$lib/components/brand';
  ```
- [ ] Replace hand-rolled label spans with `<SectionLabel>label text</SectionLabel>`
- [ ] Delete the replaced CSS classes from `<style>` blocks
- [ ] `bun run test && bun run check`
- [ ] **STOP. Check labels look identical across Contact, tech-stack, error page, ServiceNav.**

### Task P3: Clean up MetroStation in BlogRow + wire +error

**Files:**
- Modify: `src/lib/components/blog/BlogRow.svelte`
- Modify: `src/routes/+error.svelte`

- [ ] BlogRow: MetroStation is already imported. Find and delete hand-rolled duplicates:
  ```bash
  grep -n "station-badge\|station-pulse\|station-ping\|@keyframes station" src/lib/components/blog/BlogRow.svelte
  ```
- [ ] Delete those CSS class definitions from BlogRow's `<style>` block — MetroStation owns them now
- [ ] +error: check if metro dot elements exist:
  ```bash
  grep -n "metro\|station\|filled.*dot\|dot.*filled" src/routes/+error.svelte
  ```
- [ ] Wire `<MetroStation>` into +error for any metro-style indicators:
  ```svelte
  import { MetroStation } from '$lib/components/brand';
  ```
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify BlogRow station markers + error page dots look correct.**

### Task P4: Wire MetricDisplay into tech-stack hero stats

**Files:**
- Modify: `src/routes/tech-stack/+page.svelte`

- [ ] Find the hand-rolled stat markup:
  ```bash
  grep -n "hero-stat\|stat-value\|stat-label" src/routes/tech-stack/+page.svelte
  ```
- [ ] Add import:
  ```svelte
  import { MetricDisplay } from '$lib/components/brand';
  ```
- [ ] Replace hand-rolled stats with:
  ```svelte
  <MetricDisplay value={itemCount} label="tools" />
  ```
- [ ] If MetricDisplay needs a `before` prop for prefix text, add it to the component:
  ```svelte
  <!-- In MetricDisplay.svelte props -->
  let { value, label, before = '', labelBelow = false, class: className = '', ...rest } = $props();
  ```
  ```svelte
  <!-- In MetricDisplay template -->
  {#if before}<span class="metric-before">{before}</span>{/if}
  ```
- [ ] Delete hand-rolled `.hero-stat-value`, `.hero-stat-label` CSS from tech-stack
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify tech-stack hero stats look identical.**

### Task P5: Wire StatusDot into remaining consumers

**Files:**
- Modify: `src/lib/components/home/HeroSqlPanel.svelte`
- Modify: `src/lib/components/home/ManifestoEdgeBottom.svelte`
- Modify: `src/lib/components/layout/ControlRoom.svelte`
- Modify: `src/lib/components/layout/Footer.svelte`
- Modify: `src/routes/+error.svelte`

- [ ] In each file, find hand-rolled pulse/status dot patterns:
  ```bash
  grep -n "pulse\|status.*dot\|dot.*status\|metro-dot\|filled.*circle" <file>
  ```
- [ ] Add import where missing:
  ```svelte
  import { StatusDot } from '$lib/components/brand';
  ```
- [ ] Replace hand-rolled dots with `<StatusDot color="orange" pulse />` or `<StatusDot color="green" />` as appropriate
- [ ] Where StatusDot API doesn't cover the pattern (e.g. hollow dots), leave manual + add comment:
  ```svelte
  <!-- Hollow dot: StatusDot doesn't support hollow variant, left manual -->
  ```
- [ ] Delete replaced CSS from `<style>` blocks
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify status/pulse dots look correct in Hero SQL panel, Manifesto, Footer, error.**

### Task P6: TerminalChrome overflow fix + compose into ControlRoom

**Files:**
- Modify: `src/lib/components/brand/TerminalChrome.svelte`
- Modify: `src/lib/components/layout/ControlRoom.svelte`

- [ ] TerminalChrome: find `.terminal-body` in the `<style>` block and add overflow:
  ```css
  .terminal-body {
    overflow-y: auto;
    /* existing styles... */
  }
  ```
- [ ] ControlRoom: read the current implementation, understand its structure:
  ```bash
  head -60 src/lib/components/layout/ControlRoom.svelte
  ```
- [ ] Refactor ControlRoom to compose TerminalChrome internally:
  ```svelte
  import { TerminalChrome, CornerMarks } from '$lib/components/brand';
  ```
  ```svelte
  <TerminalChrome title="// infrastructure.control">
    <!-- existing ControlRoom body content -->
    {#snippet body()}
      <!-- grid overlay, data viz, etc. -->
    {/snippet}
  </TerminalChrome>
  ```
- [ ] Remove any hand-rolled terminal chrome CSS from ControlRoom's `<style>` that TerminalChrome now owns
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify ControlRoom looks identical. Open About page, scroll to terminal section — body must be scrollable.**

### Task P7: Semantic HTML fixes

**Files:**
- Modify: `src/lib/components/home/HeroBanner.svelte`
- Modify: `src/lib/components/about/AboutIdentity.svelte`
- Modify: `src/lib/components/services/ServiceCard.svelte`
- Modify: `src/lib/components/blog/BlogRow.svelte`
- Modify: `src/lib/components/projects/ProjectCard.svelte`
- Modify: `src/lib/components/blog/BlogDetailHeader.svelte`

- [ ] HeroBanner: find both `<h1>` elements (around lines 485, 499 per original plan):
  ```bash
  grep -n "<h1\|</h1" src/lib/components/home/HeroBanner.svelte
  ```
  Consolidate into one `<h1>` with `<span>` children for each visual line. The `aria-label` on the `<h1>` should contain the full readable text.
- [ ] AboutIdentity: find `<h2>` at top of component, promote to `<h1>`:
  ```bash
  grep -n "<h2\|</h2" src/lib/components/about/AboutIdentity.svelte | head -5
  ```
  Change `<h2>` → `<h1>` for the page title only. Section subheadings stay as `<h2>`.
- [ ] ServiceCard: verify it has a page-level `<h1>` for the service name:
  ```bash
  grep -n "<h1\|<h2\|<h3" src/lib/components/services/ServiceCard.svelte | head -10
  ```
  Add `<h1>` wrapping the service title if missing.
- [ ] BlogRow: fix heading hierarchy — post titles should be `<h2>` not `<h3>`:
  ```bash
  grep -n "<h2\|<h3\|<h4" src/lib/components/blog/BlogRow.svelte
  ```
- [ ] BlogRow: wrap date in `<time>`:
  ```svelte
  <!-- Before -->
  <span>{post.date}</span>
  <!-- After -->
  <time datetime={post.date}>{formatDate(post.date)}</time>
  ```
- [ ] ProjectCard: same heading hierarchy fix as BlogRow
- [ ] BlogDetailHeader: wrap date in `<time datetime={post.date}>`
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify headings look identical visually. Run: `grep -rn "<h1" src/routes src/lib/components --include="*.svelte" | grep -v "node_modules"` — confirm one h1 per page.**

### Task P8: Scroll fixes

**Files:**
- Modify: `src/lib/components/shared/StationTabs.svelte`
- Verify: `src/lib/components/stack/StackBottomSheet.svelte` (vaul-svelte should handle)

- [ ] StationTabs: find the tab list container:
  ```bash
  grep -n "tab.*list\|tabs-list\|tablist\|overflow" src/lib/components/shared/StationTabs.svelte | head -10
  ```
- [ ] Add horizontal scroll support to the tab list:
  ```css
  .tabs-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* hide scrollbar on tabs */
  }
  .tabs-list::-webkit-scrollbar {
    display: none;
  }
  ```
- [ ] StackBottomSheet: verify vaul-svelte handles drawer body scroll by opening it in browser at mobile viewport — no code change expected, just confirm
- [ ] `bun run test && bun run check`
- [ ] **STOP. Resize browser to 375px. Verify StationTabs scrolls horizontally. Open StackBottomSheet — body must scroll vertically.**

### Task P9: Props standardization

**Files (priority — consumed by shells):**
- Modify: `src/lib/components/blog/BlogRow.svelte`
- Modify: `src/lib/components/projects/ProjectCard.svelte`
- Modify: `src/lib/components/services/ServiceCard.svelte`
- Modify: `src/lib/components/home/FeaturedProjects.svelte`
- Modify: `src/lib/components/home/HomeServices.svelte`
- Modify: `src/lib/components/contact/ContactPage.svelte`
- Modify: `src/lib/components/shells/SectionWrapper.svelte`
- Modify: `src/lib/components/shells/EdgeRail.svelte`
- Modify: `src/lib/components/shells/ListingShell.svelte`
- Modify: `src/lib/components/shells/DetailHero.svelte`
- Modify: `src/lib/components/shells/CardGrid.svelte`
- Modify: `src/lib/components/shells/BentoGrid.svelte`
- Modify: `src/lib/components/shells/AsidePanel.svelte`

- [ ] For each file, check if a named Props interface is exported:
  ```bash
  grep -n "export interface\|export type.*Props" <file>
  ```
- [ ] For any file missing the Props interface, add it following the Constitution pattern:
  ```svelte
  <script lang="ts">
    export interface BlogRowProps {
      /** The blog post data to display */
      post: BlogPost;
      /** Optional additional CSS classes */
      class?: string;
      [key: string]: unknown;
    }

    let { post, class: className = '', ...rest }: BlogRowProps = $props();
  </script>
  ```
- [ ] Ensure every component has `class?: string` in its props and passes it via `cn()`:
  ```svelte
  <article class={cn('blog-row', className)} {...rest}>
  ```
- [ ] `bun run test && bun run check`
- [ ] **STOP. Verify no visual regressions. Run `bun run check` — zero type errors on Props.**

---

## Page Pass Framework

Every page session (1–7) runs these 9 steps. Steps 1–3 happen before any code is written. Steps 4–9 are one approval cycle. Design decisions made during step 3 are logged as D-numbers in the devlog.

```
STEP 1 — AUDIT
  Read the page component(s). List what's hand-rolled vs wired.
  List any sparse/empty sections that need content.
  Commands:
    wc -l <page-component-files>
    grep -n "SectionWrapper\|EdgeRail\|Card\|SectionHeading" <file>

STEP 2 — RESEARCH
  Run competitive scan at desktop + mobile:
    Chrome DevTools MCP → lighthouse_audit + take_snapshot at 1440px and 375px
    frontend-design-pro:trend-researcher → current patterns for this page type
    frontend-design-pro:analyze-site → 2-3 reference sites for this page type

STEP 3 — MINI BRAINSTORM
  Use visual companion or terminal to decide:
    - Which SectionWrapper layout pattern (A/B/C/D) per section?
    - What goes on the left EdgeRail? Right EdgeRail?
    - What enrichment? (rotated labels, icons, annotations, info elements)
    - What content fills sparse sections?
  Log every decision as a D-number in the devlog.

STEP 4 — SECTION WRAP
  Wrap each major section in SectionWrapper:
    import { SectionWrapper } from '$lib/components/shells';
    <SectionWrapper layout="centered" container="content">
      {#snippet background()}<!-- decorative bg SVGs -->{/snippet}
      {#snippet sideLeft()}<!-- edge content -->{/snippet}
      {#snippet sideRight()}<!-- edge content -->{/snippet}
      <!-- page content -->
    </SectionWrapper>
  Move background decorations into `background` slot.
  Move edge content into `sideLeft` / `sideRight` slots.

STEP 5 — EDGE RAIL
  Wire EdgeRail based on step 3 decisions:
    import { EdgeRail } from '$lib/components/shells';
    <EdgeRail position="left" label="// page-name" sections={[...]} />
    <EdgeRail position="right" label="// 2026" />
  Wire into the route's +page.svelte, not individual section components.

STEP 6 — CARDS
  Replace remaining hand-rolled card surfaces with Card atom:
    import { Card } from '$lib/components/ui/card';
  Add motion actions per card type:
    use:tilt → bento cards (About)
    use:cursorGlow → any card wanting cursor glow
    use:boop → BlogRow, ProjectCard
  Remove duplicate card CSS.

STEP 7 — ENRICH
  Apply step 3 decisions:
    Rotated labels, icons, info elements, annotations.
    Fill content gaps with real content.
    Reference the design pattern research from step 2.

STEP 8 — SEMANTIC
  Page-specific semantic HTML fixes not covered in pre-pass.
  Verify: one <h1>, all dates in <time>, sections have headings.

STEP 9 — VERIFY
  bun run test && bun run check
  Claude Preview → screenshot at 1440px + 375px
  STOP. Share screenshot proof. Wait for Yesid approval.
```

---

## SESSION 1: Home

**Components:**
- `src/routes/+page.svelte` (33 lines — mounts all sections)
- `src/lib/components/home/HeroBanner.svelte` (353 lines)
- `src/lib/components/home/Manifesto.svelte` (395 lines)
- `src/lib/components/home/FeaturedProjects.svelte` (213 lines)
- `src/lib/components/home/HomeServices.svelte` (343 lines)
- `src/lib/components/home/HomeCloser.svelte` (253 lines)

**Known gaps:**
- No SectionWrapper on any section — all render directly in +page.svelte
- No EdgeRail wired anywhere
- HeroBanner: dual h1 fixed in P7, no edge decoration, scroll-locked GSAP animation
- Manifesto: complex GSAP timeline targeting child elements by class — SectionWrapper must not move/rename any target elements
- FeaturedProjects: SectionHeading wired, cards likely need Card atom
- HomeServices: SectionHeading wired, BlueprintSVGs now components, morph animation active
- HomeCloser: construction site metaphor, StopLabel on bento cards already wired

**Critical constraint:** HeroBanner uses `buildHeroTimeline()` targeting DOM elements by class selector. When wrapping in SectionWrapper, ensure target class names remain reachable. Prefer `layout="bleed"` for HeroBanner since it is already full-viewport.

**Critical constraint:** Manifesto GSAP orchestrates child sub-components via global class selectors (D92). SectionWrapper `background` slot is fine — it spans `grid-column: 1 / -1` so selectors still reach children.

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 2.**

---

## SESSION 2: About

**Components:**
- `src/routes/about/+page.svelte` (13 lines — mounts AboutPage)
- `src/lib/components/about/AboutPage.svelte` (229 lines — bento grid orchestrator)
- `src/lib/components/about/AboutIdentity.svelte`
- `src/lib/components/about/AboutInterests.svelte`
- `src/lib/components/about/AboutMethod.svelte`
- `src/lib/components/about/AboutMetrics.svelte`
- `src/lib/components/about/AboutLogos.svelte`
- `src/lib/components/about/AboutPolaroids.svelte`
- `src/lib/components/about/AboutTestimonials.svelte`
- `src/lib/components/about/AboutWeather.svelte`
- `src/lib/components/about/AboutCta.svelte`
- `src/lib/components/about/AboutTrain.svelte`

**Known gaps:**
- No SectionWrapper at page level (AboutPage is the top-level composer)
- No EdgeRail
- Bento grid uses named CSS grid areas — SectionWrapper wraps the OUTER page, BentoGrid shell manages the internal grid
- StopLabel already wired on all 10 bento cards ✅
- CornerMarks, tilt, cursorGlow already wired ✅
- AboutIdentity: h2→h1 done in P7
- AboutWeather: potentially sparse — research weather widget design patterns
- AboutPolaroids: visual interest section — research polaroid layout patterns

**Critical constraint:** `use:tilt` and `use:cursorGlow` are Svelte actions applied directly on bento card elements. Do NOT wrap bento cards in Card component (D30 — Svelte actions don't work on components). Token alignment only for bento cards.

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 3.**

---

## SESSION 3: Blog

**Components:**
- `src/routes/blog/+page.svelte` (listing route)
- `src/lib/components/blog/BlogListingPage.svelte`
- `src/lib/components/blog/BlogFilterMobile.svelte`
- `src/lib/components/blog/BlogFilterSidebar.svelte`
- `src/routes/blog/[slug]/+page.svelte` (detail route)
- `src/lib/components/blog/BlogDetailHeader.svelte`
- `src/lib/components/blog/BlogContent.svelte`
- `src/lib/components/blog/BlogRow.svelte`

**Known gaps:**
- No SectionWrapper on listing or detail
- No EdgeRail on either route
- BlogListingPage: ListingShell built but not wired
- BlogRow: SvgIcon + MetroStation wired, CSS cleaned in P3, heading + time fixed in P7
- BlogDetailHeader: time fixed in P7, potentially sparse header area
- BlogContent: prose-dark wired ✅, StickyPanel wired in detail ✅

**Critical constraint:** ListingShell wiring may change the DOM structure around the filter sidebar + mobile filter. After wiring ListingShell, verify: sidebar shows at `lg:+`, mobile filter button shows below `lg:`, active filters preserved.

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 4.**

---

## SESSION 4: Projects

**Components:**
- `src/routes/projects/+page.svelte` (listing route)
- `src/lib/components/projects/ProjectListingPage.svelte`
- `src/lib/components/projects/ProjectCard.svelte`
- `src/routes/projects/[slug]/+page.svelte` (detail route)
- `src/lib/components/projects/ProjectDetailPage.svelte`

**Known gaps:**
- No SectionWrapper on listing or detail
- No EdgeRail
- ProjectListingPage: MetroStation wired ✅, ListingShell not wired
- ProjectCard: heading hierarchy fixed in P7, hand-rolled card surface
- ProjectDetailPage: SvgIcon wired ✅, DetailHero shell not wired
- AsidePanel shell: built but not wired into ProjectDetailPage sidebar

**Critical constraint:** Same ListingShell constraint as Blog — verify filter behavior after wiring.

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 5.**

---

## SESSION 5: Services

**Components:**
- `src/routes/services/+page.svelte` (listing route)
- `src/lib/components/services/ServiceCard.svelte`
- `src/routes/services/[id]/+page.svelte` (detail route)
- `src/lib/components/services/ServiceDetailPage.svelte`
- `src/lib/components/services/ServiceNav.svelte`

**Known gaps:**
- No SectionWrapper on any services page
- No EdgeRail
- ServiceCard: SectionLabel wired in P2 ✅, h1 added in P7 ✅, hand-rolled card surface
- ServiceDetailPage: SvgIcon wired ✅, DetailHero shell not wired
- ServiceNav: SectionLabel wired in P2 ✅

**Critical constraint:** ServiceCard has SVG morph animation (square→circle on hover) — this is direct CSS/GSAP on the SVG, NOT SvgMorphBox. Preserve the animation. When applying Card atom to ServiceCard, ensure the morph SVG layer sits correctly within the Card surface.

**Note:** SvgMorphBox is deprecated (D in spec). Do not reference or create it.

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 6.**

---

## SESSION 6: Contact + 404

### Contact

**Components:**
- `src/routes/contact/+page.svelte`
- `src/lib/components/contact/ContactPage.svelte` (325 lines)

**Known gaps:**
- No SectionWrapper
- No EdgeRail
- TerminalChrome already wired (×2) ✅
- SectionLabel wired in P2 ✅, SectionHeading wired in P1 ✅
- Design hint: terminal aesthetic — EdgeRail content should feel like network diagnostics (connection status, uptime, latency annotations)

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves Contact before starting 404.**

### 404

**Components:**
- `src/routes/+error.svelte`

**Known gaps:**
- No SectionWrapper
- No EdgeRail
- MetroStation wired in P3 ✅, StatusDot wired in P5 ✅, SectionLabel wired in P2 ✅
- Sparse page — creative opportunity: error pages can be memorable

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 7.**

---

## SESSION 7: Tech-stack

**Components:**
- `src/routes/tech-stack/+page.svelte` (357 lines)
- `src/lib/components/layout/ControlRoom.svelte`
- `src/lib/components/stack/StackPanel.svelte`
- `src/lib/components/stack/StackConfigurator.svelte`
- `src/lib/components/stack/StackNode.svelte`
- `src/lib/components/stack/StackConnections.svelte`
- `src/lib/components/stack/StackFilters.svelte`

**Known gaps:**
- No SectionWrapper, no EdgeRail
- SectionLabel, MetricDisplay, StatusDot, SectionHeading wired in pre-pass ✅
- Hero + CTA only — no tech content between them (engine stripped D90)
- The interactive ControlRoom + StackDiagram is NOT rebuilt here — that is Phase 2
- This session: research + design new content sections between Hero and CTA that work WITHOUT the interactive engine

**Key design question for mini brainstorm (step 3):**
What fills the space between Hero and CTA? Explore during the research step:
- Tech philosophy / methodology section
- Key technology grid (static, curated)
- Annotated architecture diagram
- Tool timeline or layer breakdown

**Research focus:** Look for compelling static tech stack pages on award sites. What makes them work without an interactive configurator?

- [ ] Run steps 1–9 per page framework above
- [ ] **STOP. Yesid approves before Session 8.**

---

## SESSION 8: Post-Sweep

### Task S8-1: Structural audit

- [ ] Zero files over 600 lines:
  ```bash
  find src -name "*.svelte" | xargs wc -l | sort -rn | head -20
  ```
  Any file over 600: split before closing.

- [ ] Zero hand-rolled card surfaces (scoped styles with card-like patterns):
  ```bash
  grep -rn "background.*card\|border.*primary.*15\|backdrop.*blur" src/lib/components --include="*.svelte" | grep -v "ui/card\|brand/"
  ```

- [ ] Zero hand-rolled section headings:
  ```bash
  grep -rn "section-heading\|section-subheading\|\.heading-dot" src/lib/components --include="*.svelte" | grep -v "brand/"
  ```

- [ ] Zero hand-rolled section labels:
  ```bash
  grep -rn "hero-overline\|section-label\|nav-label" src/lib/components src/routes --include="*.svelte" | grep -v "brand/"
  ```

- [ ] One `<h1>` per page (flag any pages with 0 or 2+):
  ```bash
  for f in src/routes/+page.svelte src/routes/about/+page.svelte src/routes/blog/+page.svelte src/routes/projects/+page.svelte src/routes/services/+page.svelte src/routes/contact/+page.svelte src/routes/tech-stack/+page.svelte src/routes/+error.svelte; do echo "$f: $(grep -c '<h1' "$f" 2>/dev/null || echo 0) h1"; done
  ```

- [ ] All dates in `<time>`:
  ```bash
  grep -rn "post\.date\|project\.date\|\.date" src/lib/components/blog src/lib/components/projects --include="*.svelte" | grep -v "<time"
  ```
  Any match that isn't inside a `<time>` tag needs fixing.

- [ ] EdgeRail wired on every route:
  ```bash
  grep -rn "EdgeRail" src/routes --include="*.svelte" -l
  ```
  Should return all 7 main routes.

- [ ] SectionWrapper wired on every route's sections:
  ```bash
  grep -rn "SectionWrapper" src/lib/components --include="*.svelte" -l | grep -v "shells/"
  ```

### Task S8-2: Test + type check

- [ ] `bun run test`
  Expected: 774/774 pass (or higher if new tests added). Zero failures.

- [ ] `bun run check`
  Expected: 0 errors. Warnings should be ≤ 12 (current baseline).

### Task S8-3: Documentation update

- [ ] Update `docs/reference/CONSTITUTION.md` — confirm Section 13 (Atomic Design) matches what was actually built
- [ ] Update `docs/reference/CSS.md` — add any new tokens or utilities added during page passes
- [ ] Update `docs/reference/TESTS.md` — reflect any new/changed test files
- [ ] Update `docs/reference/ARCHITECTURE.md` — update component tier counts, wiring status

### Task S8-4: Learning doc

- [ ] Create `docs/learn/design-systems/atomic-wiring-patterns.md`:
  ```markdown
  ---
  title: Atomic Wiring Patterns
  tags: [learn, design-systems, intermediate]
  ---

  # Atomic Wiring Patterns

  Key lessons from wiring 17d: brand primitives into 8 pages.

  ## Pattern: Pre-pass before visual work
  ...

  ## Pattern: SectionWrapper slot architecture
  ...

  ## Pattern: Mini brainstorm per page
  ...
  ```

### Task S8-5: Regenerate tree.txt + commit

- [ ] Regenerate tree.txt:
  ```powershell
  cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
  ```
- [ ] Final commit:
  ```bash
  git add -A
  git commit -m "feat(slice-17d-4): complete wiring + edge-to-edge pass"
  ```
- [ ] **STOP. Final Yesid approval before PR.**

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
- [ ] Every page has a wired EdgeRail with page-specific content
- [ ] Every page has enrichment beyond structural wiring
- [ ] Tech-stack page has real content sections between Hero and CTA
- [ ] No page feels sparse or unfinished

### Technical
- [ ] 774/774 tests pass (zero regressions)
- [ ] `bun run check` — 0 errors, warnings ≤ 12
- [ ] TerminalChrome body scrolls vertically
- [ ] StationTabs scrolls horizontally on mobile
- [ ] One `<h1>` per page, no skipped heading levels
- [ ] All dates in `<time datetime="YYYY-MM-DD">`

### Documentation
- [ ] CONSTITUTION.md, CSS.md, TESTS.md, ARCHITECTURE.md updated
- [ ] `docs/learn/design-systems/atomic-wiring-patterns.md` created
