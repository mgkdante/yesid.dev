# Slice 09 — Services Pages Design Spec

**Date:** 2026-04-06
**Status:** approved
**Author:** Yesid + Claude (brainstorming session)
**Depends on:** Slices 02, 08

---

## Overview

Build `/services` (index) and `/services/[id]` (detail) pages. Services are the heart of the site — they connect projects, skills, and client value into a comprehensive view of what yesid. offers.

**Design direction:** "The Kinetic Scroll" — full-viewport service reveals with station tab navigation, vertical metro line, DrawSVGPlugin animations, and proof strips. Inspired by Lusion, Linear, and David Langarica portfolio patterns.

**Principles:** Data-driven, i18n-ready (LocalizedString), cloud-ready, DRY, componentized, scalable.

---

## Data Model Extension

The `Service` interface in `src/lib/data/types.ts` gains new optional fields (backward compatible):

```typescript
interface Service {
  // --- existing fields (unchanged) ---
  id: string;
  title: LocalizedString;
  description: LocalizedString;        // short — used in listings and index cards
  station: number;
  icon?: string;
  svg?: string;
  visible?: boolean;
  relatedProjects: string[];

  // --- NEW fields for detail pages ---
  subtitle?: LocalizedString;          // optional qualifier shown below title (e.g., "& Optimization")
  longDescription?: LocalizedString;   // 2-3 paragraph deep dive
  valueProposition?: LocalizedString;  // "How this helps you" — client-facing
  deliverables?: LocalizedString[];    // typical deliverables list
  stack?: string[];                    // tools/technologies used (not localized)
  sections?: ServiceSection[];         // custom collapsible content blocks
}

interface ServiceSection {
  title: LocalizedString;
  content: LocalizedString;
}
```

All new fields are optional — existing service data continues to work. Content populated in `services.ts` as English-only for now; French/Spanish added later via LocalizedString.

---

## /services — Index Page

### Layout: Full-Viewport Service Reveals

Each service occupies 100vh. Vertical scroll with `ScrollTrigger` snap locks each service into the viewport. Three persistent layers:

#### 1. Station Tabs (top, sticky)

- Horizontal tab bar, one tab per service
- Each tab: station number (JetBrains Mono) + short label
- Active tab: orange bottom border (3px `#E07800`), full opacity
- Inactive tabs: fade by distance from active (opacity 0.6 → 0.35)
- Click any tab → `scrollTo` that service's viewport
- ScrollTrigger `onUpdate` keeps the active tab in sync with scroll position
- **Mobile:** Tabs become horizontally scrollable with right-edge fade gradient. Active tab auto-scrolls into view. Same visual treatment.
- **Component:** `StationTabs.svelte` — reused on both index and detail pages (DRY)

#### 2. Metro Line (left, fixed — desktop only)

- Thin 2px vertical line from top to bottom of the scroll container
- Station dots at each service's viewport position
- Active station: filled circle, `#E07800`, glow (`box-shadow`)
- Visited stations: filled `#E07800`, no glow
- Future stations: hollow, `#333` border
- Line gradient: orange up to current position, `#333` below
- **Mobile:** Hidden — station tabs handle navigation

#### 3. Service Content (main area, per viewport)

Each viewport contains:

- **Station counter:** "Service 01 / 06" (JetBrains Mono, uppercase, `#E07800`)
- **Title:** Large kinetic text (SplitText reveal on scroll enter). Service title split across lines. Orange dot at end.
- **Subtitle:** Optional qualifier extracted from the title (e.g., "& Optimization"). Stored as `service.subtitle?: LocalizedString` — a new optional field. Only renders if present.
- **Description:** Short description from `service.description` (1-2 sentences, `#999`)
- **Stack pills:** Technology chips in JetBrains Mono, border `#282828`
- **CTA:** "Deep dive →" link to `/services/[id]`, orange underline
- **SVG illustration:** Right side on desktop. Draws itself in via `DrawSVGPlugin` when viewport enters. Replays on re-entry.

#### 4. Proof Strip (bottom, fixed)

- Persists at bottom of every viewport
- Updates per-service: shows that service's related projects
- Left label: "Built with this" (JetBrains Mono, uppercase)
- Project mini-cards: orange dot + title + one-liner, linking to `/work/[slug]`
- Right: project count in `#E07800`
- **Mobile:** Stacked at bottom. Cards horizontally scrollable, title only (no one-liner)

### Motion

| Element | Plugin | Trigger |
|---------|--------|---------|
| Scroll snap | ScrollTrigger | `snap: 1 / serviceCount` |
| SVG draw | DrawSVGPlugin | Per-viewport enter, `scrub: true` |
| Title reveal | SplitText | Per-viewport enter |
| Stack pills | stagger | `use:reveal` with index delay |
| Station tabs | ScrollTrigger onUpdate | Scroll position |
| Metro line fill | ScrollTrigger onUpdate | Scroll progress |

### Mobile Adaptations

- Station tabs: horizontally scrollable, right-edge fade
- Metro line: hidden
- SVG: centered above title, 140px
- Layout: single column stacked (SVG → title → desc → stack → CTA)
- Proof strip: cards horizontally scrollable, title only
- Scroll snap: still active (swipe between services)

---

## /services/[id] — Detail Page

### Layout: Consultative Deep Dive

Answers four questions: What is it? How does it help? What does it look like in practice? What to expect?

#### Top: Station Tabs (same component as index)

- Reuses `StationTabs.svelte`
- Active tab matches current service ID
- Click any tab → navigates to `/services/[other-id]`
- Same visual treatment as index page

#### Hero Section

- **Back link:** "← All Services" in orange, `use:boop`
- **SVG:** Large illustration (180px desktop, 120px mobile), `DrawSVGPlugin` animation on mount
- **Station counter:** "Service 01 / 06"
- **Title:** Large text, SplitText entrance, orange dot
- **Subtitle:** From `service.subtitle` (optional, renders only if present)
- **Description:** `service.description` (short)
- **Stack pills:** From `service.stack[]`
- Desktop: SVG left, text right. Mobile: SVG centered above, text below.

#### Divider

- Gradient line: `#E07800` → `#333` → `#1a1a1a`

#### Collapsible Sections (reuses WorkDetailPage pattern)

Same chevron toggle, same spacing, same `use:reveal` animations:

1. **"How This Helps You"** — from `service.valueProposition`. Open by default.
2. **"Typical Deliverables"** — from `service.deliverables[]`. 2-column grid of bullet items (desktop), single column (mobile). Open by default.
3. **Custom sections** — from `service.sections[]` (ServiceSection). Collapsed by default. Same pattern as project sections in WorkDetailPage.

All sections are optional. If a field is undefined, the section doesn't render.

#### Related Projects Band

- Full-width darker background (`#0f0f0f`)
- Header: "Built with [Service Name]" + "See all work →"
- 3-column grid of project cards (desktop), stacked list (mobile)
- Each card: thumbnail placeholder, title, one-liner, stack chips
- All link to `/work/[slug]`
- Uses existing `getProjectsByService()` from `projects.ts`
- Cards: `use:reveal` with stagger

#### Prev/Next Service Nav

- Bottom of page, full width
- Previous service (left) and next service (right)
- Ordered by `station` number
- First service: no previous. Last service: no next.
- Links to `/services/[id]`

### Motion

| Element | Plugin | Trigger |
|---------|--------|---------|
| SVG draw | DrawSVGPlugin | On mount |
| Title | SplitText | On mount |
| Sections | use:reveal | Scroll enter |
| Deliverables | stagger | Scroll enter |
| Project cards | use:reveal + stagger | Scroll enter |
| Back link | use:boop | Hover |

### Mobile Adaptations

- Station tabs: horizontally scrollable (same as index)
- SVG: centered above title, 120px
- Layout: single column stacked
- Collapsible sections: full width
- Deliverables: single column
- Related projects: stacked list (title + one-liner + arrow)
- Prev/next: simplified (just arrows + short name)

---

## Components

### New Components

| Component | Purpose | Reuse |
|-----------|---------|-------|
| `StationTabs.svelte` | Station tab navigation bar | Index page + detail page |
| `ServiceListingPage.svelte` | Full-viewport scroll layout for /services | Index route |
| `ServiceDetailPage.svelte` | Detail page layout | Detail route |
| `ServiceCard.svelte` | Per-viewport service content block | Used by ServiceListingPage |
| `ProofStrip.svelte` | Bottom strip showing related projects | Index page (+ reusable) |
| `ServiceNav.svelte` | Prev/next service navigation | Detail page |

### Reused Components

| Component | Where |
|-----------|-------|
| `DataFlowDiagram.svelte` | Stack visualization in detail page |
| `WorkCard.svelte` (or mini variant) | Related projects in detail page |
| `reveal` action | All scroll-reveal entrances |
| `boop` action | Hover interactions (back link, CTAs) |
| `stagger` utility | Timed entrance delays |

### Shared State

`StationTabs.svelte` needs to know which service is active:
- On index page: derived from ScrollTrigger progress (scroll position → active index)
- On detail page: derived from route param (`$page.params.id`)

---

## Routes

```
/services              → src/routes/services/+page.svelte
                          src/routes/services/+page.ts (load: all visible services)

/services/[id]         → src/routes/services/[id]/+page.svelte
                          src/routes/services/[id]/+page.ts (load: service by id, related projects, SVG content)
```

### Load Functions

**`/services/+page.ts`:**
- Load all visible services via `getVisibleServices()`
- Load SVG file contents for all service SVGs (same pattern as work pages)
- No external fetches

**`/services/[id]/+page.ts`:**
- Load service by ID via `getServiceById(params.id)`
- If not found → throw 404
- Load related projects via `getProjectsByService(params.id)`
- Load SVG file content for this service
- Load all services (for StationTabs and prev/next nav)

---

## Data Population

Each of the 6 services gets populated with new fields in `services.ts`:

1. **SQL Development & Optimization** — valueProposition, deliverables (query audit, stored procs, index strategy, schema refactoring, migration scripts, documentation), stack (PostgreSQL, SQL Server, T-SQL, PL/pgSQL)
2. **Data Pipeline Architecture** — valueProposition, deliverables, stack (Python, dbt, Apache Airflow, PostgreSQL)
3. **Analytics & Reporting Systems** — valueProposition, deliverables, stack (Power BI, Retool, DAX, SQL)
4. **Database Engineering** — valueProposition, deliverables, stack (PostgreSQL, SQL Server, Alembic, Python)
5. **Internal Tooling** — valueProposition, deliverables, stack (Retool, PostgreSQL, REST API, Node.js)
6. **Web Development** — valueProposition, deliverables, stack (SvelteKit, TypeScript, Tailwind CSS, Vercel)

Content is consultative, not transactional. Written for the client, not the developer.

---

## Tests

### Data Layer
- [ ] New Service fields are optional (backward compat)
- [ ] ServiceSection interface validates correctly
- [ ] `getServiceById()` returns correct service
- [ ] `getProjectsByService()` returns correct projects
- [ ] All services have valid `stack` arrays (no empty)

### Components
- [ ] StationTabs renders all visible services
- [ ] StationTabs highlights correct active tab
- [ ] ServiceCard renders title, description, stack, CTA
- [ ] ServiceDetailPage renders all sections when data present
- [ ] ServiceDetailPage omits sections when data absent
- [ ] ProofStrip renders project mini-cards with correct links
- [ ] ServiceNav shows prev/next correctly (first/last edge cases)

### Routes
- [ ] `/services` renders all 6 services
- [ ] `/services/sql-development` renders detail page
- [ ] `/services/invalid-id` returns 404
- [ ] Service badges on work pages link correctly to `/services/[id]`

### Accessibility
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Station tabs are keyboard navigable
- [ ] Collapsible sections use proper ARIA attributes

---

## What This Unlocks

- Service badges on work pages (already linking to `/services/[id]`) stop being 404s
- Services ↔ Projects bidirectional navigation (services show related projects, projects show related services)
- Foundation for services in the cloud content layer (Slice 13)
- SEO for service-specific landing pages (Slice 10)
