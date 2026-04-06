# Handoff: Slice 08 — Work Pages

## Summary
Built the `/work` listing page with service/tag filtering and `/work/[slug]` detail pages with collapsible sections, ToC in the page margin, README integration, and branded scrollbars. The work section is now a fully functional portfolio showcase.

## What Was Built
- `src/lib/components/WorkListingPage.svelte`: Card grid with FLIP-animated service/tag filtering
- `src/lib/components/WorkCard.svelte`: Project card with image/gradient hero, service badges, tech stack diagram, tag pills
- `src/lib/components/WorkDetailPage.svelte`: Detail page with collapsible sections, README rendering, ToC in left margin
- `src/lib/components/WorkDetailSidebar.svelte`: Sticky sidebar with tech stack, services, links
- `src/lib/components/WorkServiceBadge.svelte`: Clickable service badge with MorphSVG
- `src/lib/components/DataFlowDiagram.svelte`: Auto-generated DrawSVG pipeline diagram from stack array
- `src/lib/components/TableOfContents.svelte`: Reusable ToC with collapsible sections, embedded mode, syncOpen
- `src/routes/work/+page.svelte`: Work listing route
- `src/routes/work/[slug]/+page.svelte`: Work detail route
- `src/routes/work/[slug]/+page.ts`: Loader with README fetching + GitHub URL auto-conversion

## Files Modified
- `src/app.css`: Brand scrollbar (orange), overflow-x hidden
- `src/lib/data/projects.ts`: 6 seed projects with readmeUrl, services, tags
- `src/lib/data/types.ts`: Project type with readmeUrl, image, relatedServices
- `src/routes/blog/[slug]/+page.svelte`: ToC in left margin (same pattern as work)

## How It Works

### Layout Architecture
- **Hero section**: Centered at `max-w-6xl` with title, one-liner, DrawSVG diagram
- **Content body**: `max-w-6xl` centered, flex layout with content column + sticky sidebar
- **ToC**: Absolutely positioned in the left page margin via `right: 100%` on a `relative` wrapper around the README section. Only visible at 2xl+ (1536px). Below that, ToC is embedded inside the README card.
- **ToC sync**: `syncOpen` prop syncs ToC open/close with README collapse state

### Collapsible Sections
All section cards use the same pattern:
1. Full-width `<button>` title row (whole row clickable)
2. Body div with CSS grid animation (`grid-template-rows: 0fr/1fr`)
3. SVG chevron rotates 90° when expanded

### README Integration
- `readmeUrl` on Project → loader fetches raw markdown → `marked` converts to HTML
- Auto-converts GitHub blob URLs to raw.githubusercontent.com URLs
- TableOfContents parses headings from HTML, injects IDs for scroll-to links

### TableOfContents Component
- `embedded` prop: Parent controls layout (no built-in sticky/responsive wrappers)
- `startOpen` prop: Controls initial state (mobile starts closed)
- `syncOpen` prop: Reactive sync with parent state (README collapse)
- Collapsible header, collapsible section groups (h1/h2 toggle h3/h4 children)
- Smooth grid-template-rows animation

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Absolute positioning for ToC margin | Content stays full width, ToC doesn't squish text | Flex sibling (squished content), CSS Grid (complex) |
| 2xl breakpoint for desktop ToC | Needs ~192px margin space, available at 1536px+ | xl (too narrow), custom breakpoint |
| syncOpen via $effect | Clean reactive sync without overriding user manual toggles | Two-way binding (complex), hide/show (no animation) |
| Full-width button for section titles | Better UX — whole row is clickable | Separate chevron button (harder to click) |
| GitHub URL auto-conversion | Users can paste either blob or raw URL | Require raw URL only (error-prone) |

## What Yesid Should Know
- **ToC only shows at 2xl+ (1536px)** because the margin needs enough space. Below that, the ToC is inside the README card.
- **readmeUrl** must point to a GitHub README. Both `github.com/.../blob/...` and `raw.githubusercontent.com/...` formats work.
- **Brand scrollbar** in `app.css` applies site-wide. Orange thumb, transparent track.
- The `TableOfContents` component is reused on both blog and work detail pages.

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | ToC should be left card, single-column grid | Moved ToC to separate left card | WorkDetailPage, blog page |
| 2 | Cards taller, services label, bigger SVGs, bigger labels | Increased heights/sizes, added labels | WorkCard |
| 3 | ToC squishing content, needs page margin | Absolute positioning in left margin | WorkDetailPage, blog page |
| 4 | Collapsible ToC, sections, bigger chevrons | Added collapse logic, SVG chevrons, smooth animation | TableOfContents, WorkDetailPage |
| 5 | ToC should collapse with README, branded scrollbar, no h-scroll | syncOpen prop, global scrollbar CSS, overflow-x hidden | TableOfContents, WorkDetailPage, app.css |
| Final | Approved | — | — |

## What Comes Next
- **Slice 09**: Services pages (`/services`, `/services/[id]`) — service badges already link there (404 until built)
- **Home page rework**: Integrate work/blog sections into the metro journey

## How to Verify
1. `bun run test` — 290 tests pass
2. `bun run check` — 0 errors
3. Visit `/work` — card grid with service/tag filters, tall cards with images
4. Click a card → `/work/[slug]` detail with collapsible sections
5. On transit project: README loads, ToC in left margin (2xl+), collapses with README
6. Resize to mobile: ToC inside README card (starts collapsed), sidebar above content
7. Visit `/blog/why-i-left-orm-for-raw-sql` — ToC in left margin same pattern
8. Scrollbar is orange brand color everywhere
