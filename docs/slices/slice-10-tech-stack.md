# Slice 10 — Tech Stack Page: "The Control Room" (/tech-stack)

**Status:** ready
**Priority:** 1
**Estimated effort:** 6-8 sessions (one per task)
**Depends on:** 09b

## Objective

Build a `/tech-stack` route with an interactive "Control Room" diagram showing how 34 technologies connect across 9 infrastructure layers and 7 domain clusters. Educational-grade content with a "Build Your Stack" configurator that converts exploration into contact.

## Design Direction

**"The Control Room"** — interactive dashboard with layered diagram, sidebar detail panels, composable domain filters, and a Build Your Stack configurator. Approved during brainstorming session on 2026-04-08.

**Design spec:** `docs/superpowers/specs/2026-04-08-tech-stack-page-design.md`

**Principles:** Data-driven, Keystatic-ready (markdown + frontmatter), i18n-ready (LocalizedString), scalable (adding a tech = one markdown file, zero code changes), educational (The Odin Project standard).

## Context

The existing About page has 8 `TechStackItem` entries with `name`, `category`, `relatedServices`. This slice expands to 34 items with a richer data model: dual categorization (infrastructure layer + domain clusters), directional `connectsTo` edges, proficiency levels, and per-item educational markdown content.

Keystatic is not yet installed (Slice 17). Content is structured as Keystatic-ready markdown from day one — `import.meta.glob` parsing at build time, zero migration when CMS arrives.

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, GSAP (ScrollTrigger, DrawSVGPlugin, MotionPathPlugin), Tailwind CSS, SVG (hand-rolled connections), Vitest + @testing-library/svelte

## Data Model

### New types

```typescript
type InfraLayer =
  | 'data'       | 'backend'    | 'api'
  | 'frontend'   | 'mobile'     | 'analytics'
  | 'devops'     | 'testing'    | 'systems'

type DomainCluster =
  | 'data-engineering'     | 'web-development'
  | 'mobile-development'   | 'analytics-bi'
  | 'systems-programming'  | 'devops-infra'
  | 'internal-tooling'

type Proficiency = 'expert' | 'proficient' | 'familiar'

interface TechStackItem {
  id: string
  name: string
  layer: InfraLayer
  domains: DomainCluster[]
  connectsTo: string[]          // directional edges
  relatedServices: string[]
  relatedProjects: string[]
  icon: string
  proficiency: Proficiency
}

interface StackScenario {
  id: string
  domains: DomainCluster[]
  recommended: string[]         // tech IDs in order
  summary: LocalizedString
  relatedProjects: string[]
}
```

### Markdown content per item

```
src/content/stack/[id].md
```

Frontmatter carries structural data. Body carries educational prose:
- `## What it is` — one paragraph, zero prior knowledge needed
- `## Why I use it` — opinionated, shows expertise
- `## In Practice` — real project context, embedded CTA

## File Structure

### New Files

```
src/content/stack/                     — CREATE: 34 markdown files (one per tech)
src/content/scenarios/                 — CREATE: 7 scenario markdown files
src/lib/data/tech-stack.ts             — CREATE: parser, validators, helpers
src/lib/data/tech-stack.test.ts        — CREATE: data layer tests
src/lib/components/TechStackPage.svelte       — CREATE: page shell (4 zones)
src/lib/components/TechStackPage.test.ts      — CREATE: page tests
src/lib/components/StackDiagram.svelte        — CREATE: CSS Grid + SVG overlay
src/lib/components/StackDiagram.test.ts       — CREATE: diagram tests
src/lib/components/StackNode.svelte           — CREATE: tech node card
src/lib/components/StackNode.test.ts          — CREATE: node tests
src/lib/components/StackConnections.svelte    — CREATE: SVG paths + GSAP animation
src/lib/components/StackSidebar.svelte        — CREATE: detail panel (desktop)
src/lib/components/StackBottomSheet.svelte    — CREATE: detail panel (mobile)
src/lib/components/StackFilters.svelte        — CREATE: domain filter pills
src/lib/components/StackFilters.test.ts       — CREATE: filter tests
src/lib/components/StackConfigurator.svelte   — CREATE: Build Your Stack selector
src/lib/components/StackScenarioCard.svelte   — CREATE: scenario summary card
src/routes/tech-stack/+page.svelte            — CREATE: route page
src/routes/tech-stack/+page.ts                — CREATE: data loader
```

### Modified Files

```
src/lib/data/types.ts                  — MODIFY: add InfraLayer, DomainCluster, expanded TechStackItem, StackScenario
src/lib/data/index.ts                  — MODIFY: export tech-stack data
src/routes/+layout.svelte              — MODIFY: add /tech-stack to nav (if needed)
```

### Reused (no changes needed)

```
src/lib/motion/actions/reveal.ts       — use:reveal for entrance animations
src/lib/styles/tokens.css              — existing brand tokens
src/lib/components/AboutCta.svelte     — reference for terminal CTA pattern (may extract shared component)
```

---

## Task 10a: Data Layer + Types + Markdown Structure

**Session:** 1 of 8
**Files:**
- Create: `src/lib/data/tech-stack.ts`, `src/lib/data/tech-stack.test.ts`
- Modify: `src/lib/data/types.ts`, `src/lib/data/index.ts`
- Create: `src/content/stack/` folder with 34 markdown files (frontmatter only, prose placeholder)
- Create: `src/content/scenarios/` folder with 7 scenario files

- [ ] **Step 1: Add types to `types.ts`**
  Add `InfraLayer`, `DomainCluster`, `Proficiency`, expanded `TechStackItem`, `StackScenario` interfaces. Keep existing `TechCategory` and old `TechStackItem` for About page backward compat (alias or extend).

- [ ] **Step 2: Create markdown content structure**
  Create `src/content/stack/` with 34 `.md` files. Each file has full frontmatter (id, name, layer, domains, connectsTo, relatedServices, relatedProjects, icon, proficiency). Body has placeholder headings (## What it is, ## Why I use it, ## In Practice) with one-line placeholders.

- [ ] **Step 3: Create scenario content**
  Create `src/content/scenarios/` with 7 `.md` files. Frontmatter: id, domains, recommended, relatedProjects. Body: summary paragraph.

- [ ] **Step 4: Build parser in `tech-stack.ts`**
  Use `import.meta.glob` to load all markdown files. Parse frontmatter. Validate against TypeScript interfaces. Export: `getAllTechItems()`, `getTechItemById(id)`, `getTechItemsByLayer(layer)`, `getTechItemsByDomain(domain)`, `getConnections(id)`, `getAllScenarios()`, `getScenarioForDomains(domains)`.

- [ ] **Step 5: Write data validation tests**
  Test: all 34 items have unique IDs, valid layers, at least one domain, all `connectsTo` targets exist (no dangling refs), no self-references, all relatedServices match existing service IDs, all relatedProjects match existing project slugs.

- [ ] **Step 6: Run tests**
  Run: `bun run test -- --run src/lib/data/tech-stack.test.ts`
  Expected: all pass.

**STOP. Ask Yesid to verify data structure before moving to Task 10b.**

---

## Task 10b: Diagram Layout + Static Nodes

**Session:** 2 of 8
**Files:**
- Create: `StackDiagram.svelte`, `StackNode.svelte`, tests for both
- Create: `src/routes/tech-stack/+page.svelte`, `+page.ts`

- [ ] **Step 1: Route setup**
  Create `/tech-stack` route. `+page.ts` loads all tech items and scenarios via data layer. `+page.svelte` is minimal shell passing data to components.

- [ ] **Step 2: Build `StackNode.svelte`**
  Small card: icon + name. Props: `TechStackItem`. Uses brand tokens for styling. Hover state prep (no GSAP yet — CSS transition for now). `data-testid` for testing.

- [ ] **Step 3: Build `StackDiagram.svelte`**
  CSS Grid layout: one row per `InfraLayer`. Tier labels on the left (JetBrains Mono, muted). Nodes placed in their layer's row. Responsive: desktop = horizontal tiers, mobile = vertical accordion (one collapsible section per layer).

- [ ] **Step 4: Component tests**
  StackNode renders with correct name/icon. StackDiagram renders all 34 nodes in correct tiers. Mobile accordion expands/collapses.

- [ ] **Step 5: Run tests + check**
  Run: `bun run test` and `bun run check`

**STOP. Ask Yesid to verify layout on localhost before moving to Task 10c.**

---

## Task 10c: SVG Connections + GSAP Animation

**Session:** 3 of 8
**Files:**
- Create: `StackConnections.svelte`
- Modify: `StackDiagram.svelte` (integrate connections overlay)

- [ ] **Step 1: Build `StackConnections.svelte`**
  SVG overlay on top of CSS Grid. Calculate node center positions via `getBoundingClientRect()`. Draw cubic bezier `<path>` elements between connected nodes. `pointer-events: none` on SVG.

- [ ] **Step 2: GSAP entrance animation**
  ScrollTrigger: when diagram enters viewport, animate layers bottom-to-top (fade + slide, 0.15s stagger per layer). After nodes land, DrawSVG draws connections (0.6s per line, staggered by path length). Then MotionPath starts data packet dots (continuous loop, yellow).

- [ ] **Step 3: Resize handler**
  Debounced `ResizeObserver` recalculates node positions and redraws SVG paths.

- [ ] **Step 4: Reduced motion**
  `prefers-reduced-motion`: instant opacity, static dashed lines, no dots, no staggers.

- [ ] **Step 5: Run tests + check**

**STOP. Ask Yesid to verify animations on localhost before moving to Task 10d.**

---

## Task 10d: Node Interaction + Sidebar

**Session:** 4 of 8
**Files:**
- Create: `StackSidebar.svelte`, `StackBottomSheet.svelte`
- Modify: `StackNode.svelte` (hover/click states), `StackDiagram.svelte` (dimming logic)

- [ ] **Step 1: Hover states**
  GSAP: node scale 1.05x, border glow orange, connected nodes highlight, others dim to 30% opacity. Connected lines brighten + pulse.

- [ ] **Step 2: Click → sidebar (desktop)**
  `StackSidebar.svelte`: slides in from right (`x: 100% → 0`, 0.35s). Shows: icon, name, proficiency badge, markdown content (What it is, Why I use it, In Practice), project badges ("Used in: yesid.dev, Transit Pipeline"), CTA link. Diagram shrinks to ~70% width.

- [ ] **Step 3: Tap → bottom sheet (mobile)**
  `StackBottomSheet.svelte`: slides up from bottom. Same content as sidebar. Swipe down to dismiss. Prev/next arrows.

- [ ] **Step 4: Keyboard navigation**
  Tab between nodes. Enter opens sidebar. Escape closes. Arrow keys within a layer.

- [ ] **Step 5: Component tests + run**

**STOP. Ask Yesid to verify interactions on localhost before moving to Task 10e.**

---

## Task 10e: Domain Filters

**Session:** 5 of 8
**Files:**
- Create: `StackFilters.svelte`, `StackFilters.test.ts`
- Modify: `StackDiagram.svelte` (filter integration)

- [ ] **Step 1: Build `StackFilters.svelte`**
  Pill bar: `All | Data Engineering | Web Dev | Mobile | Analytics | Systems | DevOps | Internal Tooling`. Toggle behavior (multiple active). "Build Your Stack" toggle on the right. Mobile: horizontal scroll.

- [ ] **Step 2: Filter logic**
  Active domains → highlight matching nodes, dim others. Connections between highlighted nodes stay bright. Bridge treatment: nodes in MULTIPLE active domains get double border or gradient + subtle pulse (1.0 ↔ 1.03, 2s loop).

- [ ] **Step 3: Compose with node interaction**
  Filters and node click work together. Clicking a node while filtered still opens sidebar. Sidebar shows filtered context.

- [ ] **Step 4: Filter transition animation**
  Highlighted nodes pulse once (1.0 → 1.08 → 1.0, 0.3s). Dimmed nodes fade (0.4s). Crossfade between filter states.

- [ ] **Step 5: Tests + run**

**STOP. Ask Yesid to verify filters on localhost before moving to Task 10f.**

---

## Task 10f: Build Your Stack Configurator

**Session:** 6 of 8
**Files:**
- Create: `StackConfigurator.svelte`, `StackScenarioCard.svelte`
- Modify: `StackFilters.svelte` (Build mode toggle), `StackDiagram.svelte` (scenario highlighting)

- [ ] **Step 1: Build `StackConfigurator.svelte`**
  Replaces filter pills when Build mode active. "What do you need?" with domain checkboxes (1-3 selectable). Morphs from filter bar (height + content crossfade, 0.4s).

- [ ] **Step 2: Build `StackScenarioCard.svelte`**
  Summary card below diagram: mini flow diagram (DrawSVG), one-paragraph description, project links, CTA button ("Let's build this →"). Slides up (`y: 30px → 0, opacity: 0 → 1`, 0.4s).

- [ ] **Step 3: Scenario matching**
  Match selected domains against `StackScenario` data. If no exact match, auto-generate from `connectsTo` graph with template summary.

- [ ] **Step 4: Diagram integration**
  Build mode highlights recommended stack in diagram. Non-recommended nodes dim. Scenario mini flow draws its own connections.

- [ ] **Step 5: Tests + run**

**STOP. Ask Yesid to verify Build Your Stack on localhost before moving to Task 10g.**

---

## Task 10g: Hero + CTA + Page Shell

**Session:** 7 of 8
**Files:**
- Modify: `TechStackPage.svelte` (assemble all zones)
- Create/modify: hero section, CTA section
- Modify: `src/routes/+layout.svelte` (nav link if needed)

- [ ] **Step 1: Hero zone**
  Terminal-style header (match About/Contact pattern). Title, subtitle, two action buttons ("Explore Diagram" scroll, "Build Your Stack" scroll + activate), stats strip (34+ technologies | 7 domains | 10+ projects).

- [ ] **Step 2: CTA zone**
  Terminal-style CTA block at bottom: "Found your stack? Let's build it." Contact link + availability. Reuse AboutCta pattern or extract shared component.

- [ ] **Step 3: Page assembly**
  Wire all zones: Hero → Diagram (with filters, sidebar, connections) → Build Your Stack (inline) → CTA. Ensure scroll flow, anchors, and zone transitions work.

- [ ] **Step 4: Nav integration**
  Add `/tech-stack` to site navigation if needed.

- [ ] **Step 5: Full page tests + run**

**STOP. Ask Yesid to verify full page on localhost before moving to Task 10h.**

---

## Task 10h: Content Writing + Polish

**Session:** 8 of 8
**Files:**
- Modify: all 34 `src/content/stack/*.md` files (write real prose)
- Modify: all 7 `src/content/scenarios/*.md` files (write real summaries)

- [ ] **Step 1: Write educational content**
  For each of the 34 tech items, write: "What it is" (one paragraph, zero prior knowledge), "Why I use it" (opinionated, shows expertise), "In Practice" (real project context + embedded CTA).

- [ ] **Step 2: Write scenario summaries**
  For each of the 7 scenarios, write a compelling one-paragraph narrative.

- [ ] **Step 3: Animation polish**
  Fine-tune GSAP timing, easing, stagger values. Test data packet flow speed. Verify entrance sequence feels like "infrastructure booting up."

- [ ] **Step 4: Mobile UX polish**
  Test accordion, bottom sheet, filter scroll, Build mode on mobile viewports. Verify touch targets are adequate.

- [ ] **Step 5: Cross-browser + brand QA**
  Test on Chrome, Firefox, Safari. Verify brand compliance: colors, fonts, dark theme, orange dot. Run `bun run test` and `bun run check`.

**STOP. Ask Yesid for final review before slice close.**

---

## Execution Order

Strictly sequential — each task builds on the previous:
```
10a (data) → 10b (layout) → 10c (connections) → 10d (interactions) → 10e (filters) → 10f (configurator) → 10g (page shell) → 10h (content + polish)
```

No parallelization. Each task ends with STOP + Yesid approval.

## Out of Scope

- Individual `/tech-stack/[id]` sub-routes for SEO (future slice)
- Keystatic installation and CMS UI (Slice 17)
- About page tech stack card revision (post-slice assessment)
- Light theme support
- 3D/Threlte elements (hand-rolled SVG is the approach)
- Slice 09c polish items

## Acceptance Criteria

- [ ] `/tech-stack` route loads with all 34 tech items in a layered CSS Grid diagram
- [ ] SVG connections animate between connected nodes (DrawSVG + MotionPath)
- [ ] Hovering a node highlights it and its connections, dims others
- [ ] Clicking a node opens sidebar (desktop) or bottom sheet (mobile) with educational content
- [ ] Domain filter pills highlight subgraphs, multiple composable, bridge nodes distinct
- [ ] Build Your Stack mode: select domains → recommended stack highlighted → scenario card with CTA
- [ ] Adding a new tech requires only one markdown file (zero code changes)
- [ ] Mobile: vertical accordion, tap interaction, horizontal filter scroll
- [ ] All animations respect `prefers-reduced-motion`
- [ ] All content via `LocalizedString` (i18n-ready)
- [ ] `bun run test` and `bun run check` pass
- [ ] All 34 items have real educational prose (not placeholders)

## Learn

### SVG Connection Drawing
**What it is:** Using `getTotalLength()` and `stroke-dasharray`/`stroke-dashoffset` to animate SVG path drawing, combined with GSAP DrawSVGPlugin for declarative control.
**Why it matters:** This is the same technique used in data flow visualizations, network diagrams, and motion graphics. You'll use it anytime you need to show relationships.
**Try this:** Open StackConnections.svelte, change a `drawSVG` value from `"0% 100%"` to `"20% 80%"` and see how partial drawing works.
**Go deeper:** https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/

### CSS Grid as Diagram Layout
**What it is:** Using CSS Grid's explicit row/column placement to position nodes in a structured diagram, then overlaying SVG for connections.
**Why it matters:** Most diagram libraries fight the DOM. This approach uses the DOM as the layout engine and SVG purely for decoration — simpler, more accessible, more performant.
**Try this:** Inspect the diagram in DevTools. Change a node's `grid-row` and watch it jump to a different tier.

### Data-Driven Architecture
**What it is:** The diagram renders from data, not from hardcoded layout. Adding a tech = adding one markdown file. The grid, connections, filters, and scenarios all derive from the data.
**Why it matters:** This is the pattern for any scalable content system. The blog uses it. The services use it. Now the tech stack uses it. When Keystatic arrives, it manages the same files.
**Try this:** Duplicate a markdown file in `src/content/stack/`, change the `id` and `name`, and watch it appear in the diagram automatically.

## Verify

1. Navigate to `http://localhost:5173/tech-stack` — full diagram visible with animated connections
2. Hover a node — connected nodes highlight, others dim
3. Click a node — sidebar opens with educational content, project badges visible
4. Activate "Data Engineering" filter — only data-eng nodes highlighted, Python shows as bridge
5. Toggle "Build Your Stack" → select "Data Engineering" + "Analytics" → scenario card appears with recommended stack and CTA
6. Resize to mobile — accordion layout, tap opens bottom sheet, filters scroll horizontally
7. Create a test markdown file in `src/content/stack/` — it appears in the diagram without code changes
8. Toggle `prefers-reduced-motion` in DevTools — all animations disabled gracefully
