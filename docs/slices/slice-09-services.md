# Slice 09 — Services Pages (/services + /services/[id])

**Status:** ready
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 02, 08

## Objective

Build the `/services` index page and `/services/[id]` detail pages. Services are the heart of the site — they connect projects, skills, and client value into a comprehensive view of what yesid. offers.

## Design Direction

**"The Kinetic Scroll"** — full-viewport service reveals with station tab navigation, vertical metro line, DrawSVGPlugin animations, and proof strips. Approved during brainstorming session on 2026-04-06.

**Design spec:** `docs/specs/2026-04-06-slice-09-services-design.md`
**Implementation plan:** `docs/plans/2026-04-06-slice-09-services.md`
**Visual mockups:** `docs/archive/mockups/slice-09-services-index.html` (index) and `slice-09-services-detail.html` (detail)

**Principles:** Data-driven, i18n-ready (LocalizedString), cloud-ready, DRY, componentized, scalable.

## Context

Services already exist in the data layer (`src/lib/data/services.ts`) with 6 entries:
- SQL Development & Optimization
- Data Pipeline Architecture
- Analytics & Reporting Systems
- Database Engineering
- Internal Tooling
- Web Development

Each has `id`, `title`, `description`, `svg`, and `relatedProjects`. Work detail pages already link to `/services/[id]` via service badges (currently 404). This slice makes those links work.

## Data Model Extension

The Service interface gains new optional fields (backward compatible):

```typescript
interface ServiceSection {
  title: LocalizedString;
  content: LocalizedString;
}

// New fields on Service:
subtitle?: LocalizedString;          // e.g., "& Optimization"
longDescription?: LocalizedString;   // 2-3 paragraph deep dive
valueProposition?: LocalizedString;  // "How this helps you"
deliverables?: LocalizedString[];    // typical deliverables list
stack?: string[];                    // tools/tech (not localized)
sections?: ServiceSection[];         // custom collapsible content blocks
```

## /services — Index Page

### Layout: Full-Viewport Kinetic Scroll

Each service occupies 100vh with ScrollTrigger snap.

**Four persistent layers:**

1. **Station Tabs (top, sticky)** — tab per service with station number + short label. Active tab: orange underline. Click → scrollTo. ScrollTrigger onUpdate syncs active state. Mobile: horizontally scrollable with fade hint. Component: `StationTabs.svelte` (reused on detail page).

2. **Metro Line (left, desktop only)** — thin 2px vertical line. Station dots: active = filled orange glow, visited = filled, future = hollow. Line gradient tracks scroll progress.

3. **Service Content (per viewport)** — station counter, kinetic title (SplitText), subtitle, description, stack pills, "Deep dive →" CTA, SVG illustration (DrawSVGPlugin draws on scroll enter). Component: `ServiceCard.svelte`.

4. **Proof Strip (bottom, fixed)** — updates per-service. Shows related projects as mini-cards → `/work/[slug]`. Project count. Mobile: horizontally scrollable. Component: `ProofStrip.svelte`.

### Motion
- ScrollTrigger snap: `1 / serviceCount`
- DrawSVGPlugin: SVG draws on viewport enter, scrub
- SplitText: title reveal per viewport
- stagger: stack pills entrance
- ScrollTrigger onUpdate: tabs + metro line sync

## /services/[id] — Detail Page

### Layout: Consultative Deep Dive

**Station Tabs (top)** — same `StationTabs.svelte`, mode='navigate'. Click tab → `/services/[other-id]`.

**Hero** — back link (← All Services), large SVG (DrawSVGPlugin on mount), station counter, title (SplitText), subtitle, description, stack pills. Desktop: SVG left, text right. Mobile: SVG above.

**Gradient divider** — `#E07800` → `#333` → `#1a1a1a`

**Collapsible sections** (same pattern as WorkDetailPage):
1. "How This Helps You" — `valueProposition` (open by default)
2. "Typical Deliverables" — `deliverables[]` (open, 2-col grid desktop)
3. Custom sections from `sections[]` (collapsed by default)
All optional — skip if undefined.

**Related Projects Band** — dark background, 3-col project cards (desktop), stacked list (mobile). Links to `/work/[slug]`. Uses `getProjectsByService()`.

**Prev/Next Nav** — navigate between services by station order. `ServiceNav.svelte`.

## Components

| New Component | Purpose | Reuse |
|--------------|---------|-------|
| `StationTabs.svelte` | Station tab navigation | Index + detail |
| `ServiceListingPage.svelte` | Full-viewport scroll layout | Index route |
| `ServiceDetailPage.svelte` | Detail page layout | Detail route |
| `ServiceCard.svelte` | Per-viewport content block | Index |
| `ProofStrip.svelte` | Bottom project proof strip | Index |
| `ServiceNav.svelte` | Prev/next navigation | Detail |

## Routes

```
/services          → +page.ts (load all visible services, SVGs, project maps)
                     +page.svelte → ServiceListingPage
/services/[id]     → +page.ts (load service, all services, adjacent, projects, SVGs)
                     +page.svelte → ServiceDetailPage
```

## Acceptance Criteria

### /services (index page)
- [ ] Each service occupies 100vh with scroll snap
- [ ] Station tabs at top — click navigates to service viewport
- [ ] Metro line on left (desktop) tracks scroll progress
- [ ] Service SVGs draw in via DrawSVGPlugin on viewport enter
- [ ] Titles animate with SplitText
- [ ] Proof strip at bottom shows related projects per service
- [ ] "Deep dive" links to `/services/[id]`
- [ ] Mobile: tabs scrollable, no metro line, SVG above title, proof strip scrollable

### /services/[id] (detail page)
- [ ] Station tabs at top — navigate between services
- [ ] Hero with SVG, title, description, stack
- [ ] Collapsible "How This Helps You" section (open by default)
- [ ] Collapsible "Typical Deliverables" section (open, 2-col)
- [ ] Custom collapsible sections (collapsed by default)
- [ ] Related projects band with links to `/work/[slug]`
- [ ] Prev/next service navigation
- [ ] 404 for invalid service IDs
- [ ] Mobile responsive

### Data & Architecture
- [ ] All text through LocalizedString
- [ ] Service type extended with optional fields (backward compatible)
- [ ] No hardcoded content — everything from data layer
- [ ] Service badges on work pages link correctly (no more 404)

### Tests
- [ ] Data layer tests for new Service fields
- [ ] StationTabs renders + highlights active
- [ ] ProofStrip renders project links
- [ ] ServiceNav prev/next edge cases
- [ ] 404 for invalid service ID
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Verify

1. Navigate to `/services` — see all 6 services in viewport scroll
2. Click station tab — snaps to that service
3. Scroll through — SVGs draw in, titles animate, metro line tracks
4. Click "Deep dive" → lands on `/services/sql-development`
5. Station tabs at top — click another → navigates to that service
6. Collapsible sections work (open/close)
7. Related projects → click → goes to `/work/[slug]`
8. From `/work/[slug]`, click service badge → goes to `/services/[id]` (no 404!)
9. Prev/next nav works at bottom of detail page
10. Mobile: responsive layout, scrollable tabs, no metro line
11. `bun run test` passes
12. `bun run check` passes
