# Handoff: Slice 09 — Services Pages

## Summary
Built the `/services` index page (full-viewport kinetic scroll with station tabs, metro line, SVG morph boxes, and proof strip) and `/services/[id]` detail pages (consultative deep dive with DataFlowDiagram, collapsible sections, related projects, and prev/next navigation). Service badges on work pages now link correctly — no more 404s.

## What Was Built
- `src/lib/data/types.ts`: Extended Service interface with ServiceSection + 6 optional detail fields
- `src/lib/data/services.ts`: Populated all 6 services with detail data + getAdjacentServices helper
- `src/lib/data/index.ts`: Re-exported new types and helpers
- `src/lib/components/StationTabs.svelte`: Reusable station tab navigation (scroll + navigate modes)
- `src/lib/components/StationTabs.test.ts`: 4 tests
- `src/lib/components/ServiceCard.svelte`: Per-viewport content block with SVG morph box
- `src/lib/components/ServiceCard.test.ts`: 6 tests
- `src/lib/components/ProofStrip.svelte`: Bottom proof strip with project names + count + hazard stripe
- `src/lib/components/ProofStrip.test.ts`: 4 tests
- `src/lib/components/ServiceNav.svelte`: Prev/next service navigation
- `src/lib/components/ServiceNav.test.ts`: 5 tests
- `src/lib/components/ServiceListingPage.svelte`: Full-viewport scroll layout with CSS snap + metro line
- `src/lib/components/ServiceDetailPage.svelte`: Consultative deep dive with collapsible sections
- `src/lib/components/ProjectMiniCard.svelte`: Reusable project card for outside /work
- `src/routes/services/+page.ts`: Index load function
- `src/routes/services/+page.svelte`: Index route wrapper
- `src/routes/services/[id]/+page.ts`: Detail load function with 404
- `src/routes/services/[id]/+page.svelte`: Detail route wrapper

## Files Modified
- `src/lib/components/Nav.svelte`: Added "Services" to navbar links
- `src/routes/+layout.svelte`: Full-width layout for /services, footer hidden on listing
- `src/lib/components/WorkDetailPage.svelte`: Added syncOpen to desktop ToC

## How It Works
The services system has two routes:
1. **`/services`** — Full-viewport scroll. Each of 6 services occupies 100vh with CSS scroll-snap. StationTabs at top syncs with scroll position. Metro line with dots on left (desktop). ProofStrip at bottom shows related projects per service. Hazard stripes (yellow/black) above tabs and below proof strip for metro station feel. Footer appears after scrolling past the last station.
2. **`/services/[id]`** — Detail page. StationTabs in navigate mode for switching between services. Hero with SVG morph box + DataFlowDiagram stack viz. Collapsible sections (all open by default) matching WorkDetailPage pattern. ProjectMiniCard grid for related projects. ServiceNav prev/next at bottom.

Data model extended with backward-compatible optional fields: subtitle, valueProposition, deliverables, stack, sections. All content through LocalizedString.

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| CSS scroll-snap instead of GSAP snap | More reliable, no JS dependency for core scroll | GSAP ScrollTrigger snap — works but adds complexity |
| StationTabs shared between index + detail | DRY — two modes (scroll/navigate) in one component | Separate components per page |
| SVG morph via CSS :hover + JS onclick | CSS handles desktop hover, JS handles mobile tap | Pure GSAP MorphSVGPlugin — too heavy for container morph |
| ProjectMiniCard as separate component | Reusable for any page referencing projects | Inline cards in each page |
| Footer inside scroll container on listing | Appears naturally when scrolling past last station | Hide footer entirely on listing |
| All sections open by default on detail | Consultative content should be visible immediately | Collapsed by default |

## What Yesid Should Know
- **StationTabs** is reusable — it can be adapted for any page with tabs (mode='scroll' for in-page, mode='navigate' for cross-page)
- **ProjectMiniCard** can be used anywhere projects need to be referenced outside of /work pages
- **ServiceNav** pattern (prev/next) could be reused for blog and work detail pages in a future slice
- The collapsible section HTML pattern is identical across WorkDetailPage and ServiceDetailPage — a future DRY pass should extract a shared `CollapsibleSection.svelte`

## What Comes Next
**Slice 09c — Blog + Work + Services Polish & DRY Pass** (`docs/slices/slice-09c-polish.md`):
- Enhance existing components with micro-interactions (tilt, magnetic, cursor glow)
- Add reading progress bar, code copy, heading anchors to blog
- Metro line connectors and station badges across listings
- DRY: extract CollapsibleSection, shared filter patterns, standardize hover effects

## How to Verify
1. `/services` — scroll through all 6 services, click tabs, hover SVGs (morph to circle), check proof strip updates, metro line dots, hazard stripes
2. `/services/sql-development` — hero + DataFlowDiagram, all sections open, related projects grid, "Next" nav
3. `/services/web-development` — last service, "Previous" nav only, no "Next"
4. `/services/nonexistent` — should show 404
5. `/work/transit-data-pipeline` — service badges link to `/services/[id]` (no 404)
6. Mobile: tabs left-aligned, SVG above text, tap to morph
7. `bun run test` — 304 pass
8. `bun run check` — 0 errors

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Content constrained to center, two SVGs, footer pops in | Full-width layout, removed mobile SVG duplicate, hidden footer on listing | +layout.svelte, ServiceCard, ServiceListingPage |
| 2 | SVG not morphing on hover, tabs don't stay active | CSS :hover + JS onclick morph, immediate activeId update on tab click | ServiceCard, ServiceListingPage |
| 3 | Needs more station feel, mobile first tab hidden | Hazard stripes, left-align tabs on mobile | StationTabs, ProofStrip |
| 4 | DataFlowDiagram removed (shouldn't have been!) | Restored DataFlowDiagram immediately | ServiceDetailPage |
| 5 | Footer shows when clicking tabs, sections should be open, dark project band | Footer inside scroll container, all sections open, removed dark band | +layout.svelte, ServiceDetailPage, ServiceListingPage |
| 6 | Dead space on desktop | Bigger SVG box (320px→360px on large screens) | ServiceCard |
| Final | "I can call this slice done! I like it a lot!" | — | — |
