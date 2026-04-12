# Slice 10 — Tech Stack Page: "The Control Room"

**Date:** 2026-04-08
**Route:** `/tech-stack`
**Status:** Design approved
**Depends on:** 09b (About + Contact)

---

## Vision

A dedicated `/tech-stack` route with an interactive diagram showing how 34 technologies connect — not badges, but an educational map of how digital infrastructure gets built. Visitors learn what each technology does, why it was chosen, and how it fits in the bigger picture. CTOs configure their needs and see exactly what Yesid would build for them.

### Three goals

1. **Sell more** — education builds trust. A CTO who understands your stack trusts you to build with it. "Build Your Stack" mode converts exploration into contact.
2. **Exposure/marketing** — each tech item is SEO-targetable educational content ("what is a data pipeline"). The interactive diagram is shareable on Twitter/HN/Reddit.
3. **Help people learn** — anyone can use this page as a reference to understand how tech stacks work. The Odin Project standard: genuinely educational, not marketing dressed as education.

### Design principles (from research)

- **One concept per viewport** — cognitive load theory. Don't overwhelm.
- **Dual coding** — every abstract concept gets a visual AND a text explanation.
- **Decompose then compose** — layers build one at a time, then show the whole.
- **Scrubbing > watching** — user-driven interaction, not passive content.
- **Education that converts** — deep content = trust signal. Embedded CTAs feel natural.

---

## Data Model

### Types

```typescript
type InfraLayer =
  | 'data'        // PostgreSQL, SQL Server, MySQL
  | 'backend'     // Python, Java, C#, Node.js, Kotlin, C++, Rust
  | 'api'         // REST API
  | 'frontend'    // SvelteKit, React, Next.js, Tailwind, GSAP, Threlte
  | 'mobile'      // Flutter, Jetpack Compose
  | 'analytics'   // Power BI, SSRS, DAX, SSIS, T-SQL, Airflow, Alembic
  | 'devops'      // Docker, Vercel, GitHub Actions, Bun
  | 'testing'     // Vitest, Playwright
  | 'systems'     // C++, Rust

type DomainCluster =
  | 'data-engineering'     // pipelines, ETL, schema design
  | 'web-development'      // frontend + backend web apps
  | 'mobile-development'   // native + cross-platform mobile
  | 'analytics-bi'         // dashboards, reporting, BI
  | 'systems-programming'  // low-level, performance-critical
  | 'devops-infra'         // CI/CD, containers, deployment
  | 'internal-tooling'     // admin panels, automation

type Proficiency = 'expert' | 'proficient' | 'familiar'

interface TechStackItem {
  id: string                    // 'postgresql', 'sveltekit'
  name: string                  // 'PostgreSQL'
  layer: InfraLayer             // where it sits vertically in the diagram
  domains: DomainCluster[]      // which problem clusters it belongs to (1+)
  connectsTo: string[]          // IDs of techs it feeds/receives from (directional)
  relatedServices: string[]     // service IDs (cascade-ready)
  relatedProjects: string[]     // project slugs that use this tech
  icon: string                  // SVG icon path or identifier
  proficiency: Proficiency      // expertise level
  // Educational content lives in markdown (Keystatic-managed)
  // /content/stack/[id].md — parsed at build time
}

interface StackScenario {
  id: string                    // 'data-plus-analytics'
  domains: DomainCluster[]      // which combo triggers this scenario
  recommended: string[]         // tech IDs in recommended order
  summary: LocalizedString      // narrative description
  relatedProjects: string[]     // project slugs to showcase
}
```

### Markdown content per item (Keystatic-managed)

Each tech gets a markdown file in `/content/stack/[id].md`:

```markdown
---
id: postgresql
name: PostgreSQL
layer: data
domains: [data-engineering, web-development, internal-tooling]
connectsTo: [python, sveltekit, node-js]
relatedServices: [sql-development, database-engineering]
relatedProjects: [yesid-dev, transit-pipeline, fleet-admin]
icon: postgresql
proficiency: expert
---

## What it is
An open-source relational database known for reliability, SQL compliance,
and extensibility. If your data has relationships, PostgreSQL handles them.

## Why I use it
...

## In Practice
I've deployed PostgreSQL for transit authorities processing 2M daily
events and e-commerce platforms with 500K+ product SKUs.
```

### Connection semantics

`connectsTo` is directional: `postgresql.connectsTo = ['python']` means "PostgreSQL feeds data to Python." The diagram draws an animated arrow from PostgreSQL → Python.

Adding a new tech with `connectsTo: ['postgresql', 'power-bi']` automatically draws two new connections. Zero layout code changes.

### Domain bridging

When multiple domains are active in filters or Build mode, items belonging to MORE THAN ONE active domain get a "bridge" treatment — visually distinct to show they're the glue between domains. Example: Python belongs to `data-engineering` AND `analytics-bi`. Selecting both domains highlights Python as the bridge.

### Scalability guarantee

Adding a new technology:
1. Create a markdown file in Keystatic (frontmatter + prose)
2. The diagram positions the node in its `layer` row automatically
3. `connectsTo` edges draw automatically
4. Domain filters include it automatically
5. Build Your Stack scenarios that match its domains include it automatically
6. Zero component or layout code changes required

---

## Page Layout

### Zone 1: Hero (one viewport)

- Terminal-style header matching site brand pattern (About/Contact precedent)
- Title: `$ yesid --stack` or editorial headline
- Subtitle: one line — "Not just a list — an interactive map of how digital infrastructure gets built."
- Two action buttons: **"Explore Diagram"** (scroll to Zone 2) + **"Build Your Stack"** (scroll to Zone 2, activate configurator)
- Quick stats strip: `34+ technologies | 7 domains | 10+ projects`

### Zone 2: The Diagram (centerpiece)

- **Top bar:** domain filter pills — `All | Data Engineering | Web Dev | Mobile | Analytics | Systems | DevOps | Internal Tooling`. Toggle behavior (multiple active). "Build Your Stack" toggle on the right.
- **Main area:** CSS Grid positions tech nodes in horizontal tiers by `layer`. Each tier has a subtle JetBrains Mono label on the left ("DATA", "BACKEND", "API", etc.). Nodes are small cards (icon + name). SVG connection lines flow between them with GSAP-animated dashes.
- **Sidebar (right, desktop):** collapsed by default. Click a node → sidebar slides in with mini-essay content from markdown. Shows: icon, name, proficiency badge, "What it is", "Why I use it", "In Practice" + CTA, project badges ("Used in: yesid.dev, Transit Pipeline").
- Diagram fills ~70% width when sidebar open, 100% when closed.

### Zone 3: Build Your Stack (inline, below diagram when active)

When Build mode is activated:
- Top bar transforms: filter pills become configurator checkboxes: "What do you need?" with domain options
- Diagram highlights recommended stack for selected combo
- Summary card slides in below diagram: assembled stack as mini flow, one-paragraph description, project links, CTA button
- Scenarios are data-driven (`StackScenario` objects). Unknown combos auto-generate from `connectsTo` graph with template summary.

### Zone 4: CTA (bottom)

- Terminal-style CTA block (reuse AboutCta pattern): "Found your stack? Let's build it."
- Contact link + availability status

### Visual language

- Dark theme, orange (`#E07800`) / yellow (`#FFB627`) brand accents
- Nodes: `var(--bg-secondary)` + `var(--border-subtle)`, highlight = `var(--brand-primary)` border + glow
- Connection lines: `var(--text-muted)` default, `var(--brand-primary)` highlighted, `var(--brand-accent)` for data packet dots
- Tier labels: JetBrains Mono, muted color
- Sidebar/cards: same chrome as bento/terminal cards from About page

---

## Interaction Model

### Node interactions (desktop)

- **Hover:** scale 1.05x, border glows orange, connected lines brighten + pulse. Tooltip: name + one-liner. Connected nodes also subtly highlight.
- **Click:** sidebar slides in with full mini-essay. Clicked node gets solid orange border. All connections fully bright. Everything else dims to ~30% opacity. Click another node → sidebar updates. Click same node or empty space → close.
- **Keyboard:** Tab navigates nodes. Enter opens sidebar. Escape closes. Arrow keys move within a layer.

### Domain filters

- Click pill → toggle active (filled orange). Nodes in that domain highlight, others dim. Connections between highlighted nodes stay bright.
- **Multiple active:** nodes in ANY active domain highlight. Nodes in MULTIPLE active domains get "bridge" treatment (double border or gradient).
- "All" resets.
- Node click still works while filters are active — they compose.

### Build Your Stack mode

1. Toggle activates: filter bar morphs into configurator
2. User picks 1-3 domains via checkboxes
3. Diagram highlights recommended stack
4. Summary card fades in below diagram: mini flow + description + project links + CTA
5. Recommendations from `StackScenario` data. Unknown combos auto-generate via `connectsTo` graph.

### Mobile

- **No hover** — tap is primary. Tap node → bottom sheet slides up with mini-essay.
- **Filters:** horizontal scroll pill bar. Same toggle behavior.
- **Build mode:** full-width. Summary card inline below diagram.
- **Diagram:** vertical accordion — one layer per expandable section. Nodes within each layer as a horizontal scroll or wrapped flex.
- **Swipe:** dismiss bottom sheet. Prev/next arrows within sheet.

---

## Motion & Animation

### Diagram entrance (ScrollTrigger)

Layers build bottom-to-top with stagger:
1. Data layer fades in + slides up (0.4s)
2. Backend layer follows (0.15s stagger per layer)
3. API → Frontend → Mobile → Analytics → DevOps continue upward
4. After all nodes land, SVG connection lines draw in via DrawSVG (0.6s per line, staggered by path length — short connections first)
5. After lines drawn, data packet dots begin flowing along paths via MotionPath (continuous loop, yellow dots)

Total entrance: ~2.5s. Feels like infrastructure booting up.

### Connection animations (continuous)

- Default: slow dashed line flow (`stroke-dashoffset`, 8s loop). Data at rest.
- Highlighted: speed up (2s loop), stroke brightens, dot travels path via MotionPath. Data flowing actively.
- Unhighlighted: slow down and dim.

### Node state transitions

- Idle → Hover: `scale: 1.05, borderColor: var(--brand-primary)`, 0.2s. Others dim to 0.3 opacity (0.3s).
- Hover → Click: glow shadow, sidebar slides in from right (`x: 100% → 0`, 0.35s, `power2.out`).
- Click → Close: sidebar slides out, all nodes return to full opacity (0.3s).

### Filter transitions

- Activate domain: highlighted nodes pulse once (1.0 → 1.08 → 1.0, 0.3s). Dimmed nodes fade to 30% (0.4s). Bridge nodes get subtle continuous pulse (1.0 ↔ 1.03, 2s loop).
- Switch filters: crossfade (0.3s).

### Build Your Stack mode

- Toggle on: filter bar morphs into configurator (height + content crossfade, 0.4s).
- Select domains: same highlight as filters. Summary card slides up (`y: 30px → 0, opacity: 0 → 1`, 0.4s).
- Summary mini flow diagram draws its own connections with DrawSVG.

### Reduced motion (`prefers-reduced-motion`)

- Entrance: instant opacity, no slides/staggers
- Connections: static dashed lines, no flowing dots
- Hover/click: instant state changes
- Sidebar: instant show/hide

---

## Content Inventory (34 items)

### Data Layer (3)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| postgresql | PostgreSQL | data-eng, web-dev, internal-tooling | python, sveltekit, node-js |
| sql-server | SQL Server | data-eng, analytics-bi | python, ssis, ssrs, t-sql |
| mysql | MySQL | data-eng, web-dev | python, node-js |

### Backend Layer (9)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| python | Python | data-eng, analytics-bi, web-dev, devops | postgresql, sql-server, airflow, power-bi |
| typescript | TypeScript | web-dev, mobile-dev, internal-tooling | sveltekit, react, nextjs, node-js, vitest |
| java | Java | web-dev, mobile-dev, systems | kotlin |
| csharp | C# | web-dev, systems, data-eng | sql-server |
| node-js | Node.js | web-dev, internal-tooling | postgresql, mysql, rest-api |
| kotlin | Kotlin | mobile-dev | jetpack-compose, java |
| cpp | C++ | systems | rust |
| rust | Rust | systems | cpp |
| alembic | Alembic | data-eng | python, postgresql |

**Note:** C++ and Rust use `layer: 'systems'` (not `'backend'`). Listed here for table compactness. They render in their own "SYSTEMS" tier in the diagram.

### API Layer (1)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| rest-api | REST API | web-dev, internal-tooling, mobile-dev | node-js, sveltekit, python |

### Frontend Layer (7)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| sveltekit | SvelteKit | web-dev | svelte-5, typescript, tailwind, vercel |
| svelte-5 | Svelte 5 | web-dev | sveltekit, gsap, threlte |
| react | React | web-dev, mobile-dev | nextjs, typescript |
| nextjs | Next.js | web-dev | react, typescript, vercel |
| tailwind | Tailwind CSS | web-dev, mobile-dev | sveltekit, nextjs |
| gsap | GSAP | web-dev | svelte-5, threejs-threlte |
| threejs-threlte | Three.js / Threlte | web-dev | svelte-5, gsap |

### Mobile Layer (2)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| flutter | Flutter | mobile-dev | rest-api |
| jetpack-compose | Jetpack Compose | mobile-dev | kotlin |

### Analytics Layer (6)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| power-bi | Power BI | analytics-bi | python, sql-server, dax |
| ssrs | SSRS | analytics-bi | sql-server |
| dax | DAX | analytics-bi | power-bi |
| ssis | SSIS | data-eng | sql-server, python |
| t-sql | T-SQL | data-eng, analytics-bi | sql-server |
| airflow | Apache Airflow | data-eng, devops | python, postgresql |

### DevOps Layer (4)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| docker | Docker | devops, data-eng | python, postgresql, node-js |
| vercel | Vercel | devops, web-dev | sveltekit, nextjs, github-actions |
| github-actions | GitHub Actions | devops | vercel, docker, vitest, playwright |
| bun | Bun | devops, web-dev | sveltekit, typescript, vitest |

### Testing Layer (2)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| vitest | Vitest | devops, web-dev | typescript, bun |
| playwright | Playwright | devops, web-dev | github-actions |

### Other (1 — reclassify if needed)
| ID | Name | Domains | Connects To |
|----|------|---------|-------------|
| lottie | Lottie | web-dev | gsap, svelte-5 |

**Lottie** is placed in Frontend layer for diagram positioning. Its `layer` = `frontend`.

---

## Build Your Stack Scenarios (initial set)

| ID | Domains | Recommended Stack | Summary |
|----|---------|-------------------|---------|
| data-pipeline | data-eng | PostgreSQL → Python → Airflow → Docker | "End-to-end data pipeline: ingest, transform, orchestrate, containerize." |
| analytics-dashboard | analytics-bi | SQL Server → T-SQL → Python → Power BI + DAX | "From raw data to executive dashboards with scheduled refreshes." |
| fullstack-web | web-dev | PostgreSQL → Node.js → SvelteKit → Tailwind → Vercel | "Full-stack web application with SSR, typed data, and auto-deploy." |
| mobile-app | mobile-dev | REST API → Kotlin → Jetpack Compose / Flutter | "Native or cross-platform mobile with typed API integration." |
| data-plus-analytics | data-eng, analytics-bi | PostgreSQL → Python → Airflow → Power BI + DAX | "Pipeline feeding directly into business intelligence dashboards." |
| web-plus-data | web-dev, data-eng | PostgreSQL → Python → Node.js → SvelteKit → Vercel | "Data-backed web applications with real-time pipelines." |
| internal-tools | internal-tooling | PostgreSQL → Node.js → REST API → React/SvelteKit | "Admin panels and internal dashboards for operations teams." |

More scenarios can be added via Keystatic without code changes.

---

## Technical Implementation Notes

### SVG connection rendering

- Nodes positioned via CSS Grid. Each node's center coordinates are calculated after layout via `getBoundingClientRect()`.
- SVG overlay sits on top of the grid at full width/height, `pointer-events: none` (except on connection hover).
- Paths are cubic bezier curves between node centers, calculated programmatically.
- On window resize: recalculate node positions, redraw paths (debounced).

### Keystatic integration

- Keystatic is not yet installed (planned for Slice 17). For Slice 10:
  - Content lives in markdown files at `src/content/stack/[id].md`
  - Parsed at build time via `import.meta.glob` (same pattern as blog, Slice 07)
  - Frontmatter provides structural data; body provides educational prose
  - When Keystatic arrives in Slice 17, it manages these files — zero migration needed
- Structural type validation happens in the data layer (TypeScript interfaces)

### Component architecture

- `TechStackPage.svelte` — page shell, zones 1-4
- `StackDiagram.svelte` — the CSS Grid + SVG overlay diagram
- `StackNode.svelte` — individual tech node card
- `StackSidebar.svelte` — detail panel (desktop)
- `StackBottomSheet.svelte` — detail panel (mobile)
- `StackFilters.svelte` — domain filter pills + Build mode toggle
- `StackConfigurator.svelte` — Build Your Stack domain selector
- `StackScenarioCard.svelte` — summary card for Build mode results
- `StackConnections.svelte` — SVG overlay with animated paths

### Route

- `/tech-stack` — `src/routes/tech-stack/+page.svelte`
- `+page.ts` loads all markdown content at build time
- Future: individual `/tech-stack/[id]` sub-routes for SEO (separate slice)

### Existing data integration

- The current `TechStackItem` in `types.ts` (used by About page) will be superseded by the expanded interface
- About page tech stack card will reference the same data source (backward compatible)
- `relatedProjects` links to existing `projects.ts` slugs
- `relatedServices` links to existing service IDs

---

## Testing Plan

### Unit tests
- Data layer: validate all 34 items have required fields, unique IDs, valid `connectsTo` references
- Connection graph: no orphan nodes, no self-references, all `connectsTo` targets exist
- Domain filters: correct node subsets per domain
- Scenario matching: correct recommendations per domain combo
- Auto-generation: fallback scenarios produce valid stacks from `connectsTo` graph

### Component tests
- StackNode renders with correct data
- StackSidebar shows content on node click
- StackFilters toggle highlights correctly
- StackConfigurator selects domains and shows scenario
- Reduced motion: no animation classes applied when preference active

### E2E tests (future — Playwright)
- Page loads, all nodes visible
- Click node → sidebar opens with content
- Filter by domain → correct nodes highlighted
- Build mode → select domains → scenario card appears
- Mobile: tap → bottom sheet, filters work

---

## SEO Potential (future enhancement)

Each tech item's markdown can become its own indexed page at `/tech-stack/[id]`. With proper schema markup, these pages target:
- "what is [technology]" queries (5K-15K monthly volume)
- "[technology] for [industry]" long-tail queries
- Featured snippet opportunities (the "What it is" section is structured for this)

This is NOT in Slice 10 scope. Flagged for a future slice.

---

## Acceptance Criteria

1. `/tech-stack` route loads with all 34 tech items in a layered diagram
2. SVG connections animate between connected nodes
3. Hovering a node highlights it and its connections
4. Clicking a node opens a sidebar/bottom sheet with educational content
5. Domain filter pills highlight subgraphs, multiple domains composable
6. "Bridge" nodes visually distinct when multiple domains active
7. Build Your Stack mode: select domains → recommended stack highlighted → scenario card with CTA
8. Adding a new tech item requires only: one markdown file + frontmatter (no component changes)
9. Mobile: vertical accordion layout, tap-to-expand, bottom sheet details
10. All animations respect `prefers-reduced-motion`
11. All content via `LocalizedString` (i18n-ready)
12. Tests pass for data validation, component rendering, interaction states
