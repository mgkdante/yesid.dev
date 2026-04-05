# Slice 05 — Layout Shell + Scroll Progress Rail

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 03 (complete), 04 (complete)

## Objective

Build the root layout that wraps every page: navigation, footer, and a scroll progress rail that shows station markers on the home page. After this slice, the site has a consistent shell and scroll-linked UI ready for the train journey.

## Context

Slices 01-04 built the foundation: scaffold, data, components, and motion. This slice creates the frame that holds everything together. The Nav and Footer appear on every page. The ScrollRail is the vertical progress indicator that ties into the train journey on the home page: it shows station dots that correspond to services (data-driven, not hardcoded).

Read `docs/MOTION.md` for scroll rail behavior and page transition specs.

## Acceptance Criteria

- [ ] Root layout (`src/routes/+layout.svelte`) renders Nav, page content, and Footer on every route
- [ ] Nav component: wordmark "yesid." (Inter 700, period in #E07800) on the left, navigation links on the right
- [ ] Nav links: Work, About, Contact (at minimum)
- [ ] Responsive: hamburger/mobile menu on small screens, full links on desktop
- [ ] Footer component: minimal, brand-consistent (name, year, maybe a link or two)
- [ ] ScrollRail component: vertical progress indicator fixed to the viewport edge
- [ ] ScrollRail on home page: station marker dots derived from `services` array (count = `services.length`, not hardcoded)
- [ ] ScrollRail on other pages: simple progress bar (no station markers)
- [ ] ScrollRail uses the `scrollProgress` store from `src/lib/motion/stores/`
- [ ] Station markers highlight/fill as scroll passes each station's position
- [ ] Page content has max-width ~1200px, centered, with appropriate padding
- [ ] Page transition animation between routes (subtle, not flashy)
- [ ] `prefers-reduced-motion` respected: transitions and scroll rail animations skip when enabled
- [ ] Nav, Footer, and ScrollRail tested
- [ ] All tests pass with `bun run test`
- [ ] tree.txt updated
- [ ] Dev log written
- [ ] Handoff report with "What Was Built", "Files Modified", and "Learn" sections
- [ ] Localhost preview working

## Technical Spec

### Nav Component

Location: `src/lib/components/Nav.svelte`

The wordmark is text, not an image: "yesid." rendered in Inter 700 with the period in `var(--brand-primary)` (#E07800). It links to `/`.

Desktop: wordmark left, links right, all visible.
Mobile: wordmark left, hamburger button right, links in a slide-out or dropdown menu.

Links use SvelteKit's `$page.url.pathname` to highlight the active route.

### Footer Component

Location: `src/lib/components/Footer.svelte`

Minimal. Brand name, current year, maybe GitHub/LinkedIn links from `siteMeta.links`. Nothing heavy. The footer should feel like a quiet signature, not a second nav.

### ScrollRail Component

Location: `src/lib/motion/components/ScrollRail.svelte`

A thin vertical indicator fixed to the right (or left) edge of the viewport.

**Home page behavior:** Shows station marker dots. The number of dots equals `services.length`. Dots are evenly spaced along the rail. As the user scrolls, dots fill/highlight when the scroll position passes each station's threshold. Clicking a dot could scroll to that station (optional but nice).

**Other pages behavior:** Simple progress line that fills based on `scrollProgress` store value (0 to 1). No station markers.

**How it knows which page it's on:** Use SvelteKit's `$page.url.pathname`. Home = `/`. Everything else = progress bar mode.

**Data-driven rule applies:** The ScrollRail reads from the services array to determine station count. Adding a 5th service automatically adds a 5th dot. No hardcoded station count.

### Root Layout

Location: `src/routes/+layout.svelte`

Composes Nav + ScrollRail + page content + Footer. Imports `app.css` (already done from slice 01). Wraps the page slot in a max-width container.

Page transitions: use Svelte's built-in transitions or GSAP for a subtle fade/slide between routes. Keep it fast (200-300ms). Respect reduced motion.

### Tests

- Nav: renders wordmark with correct structure (text + orange period span), renders all links, links have correct hrefs
- Nav mobile: hamburger button exists at mobile viewport (test via prop or class, not actual resize)
- Footer: renders, shows current year
- ScrollRail: renders, reads from services array for station count on home page, station count matches `services.length`
- Layout: Nav and Footer both render when layout is mounted

## Out of Scope

- No actual page content (slices 06-08 build the pages)
- No 3D scene in the hero (slice 06)
- No SVG train on the scroll rail (slice 06)
- No ServiceStation component (slice 06)
- No SEO meta tags (slice 09)
- ScrollRail click-to-scroll is optional, not required

## Learn

### SvelteKit Layouts (`+layout.svelte`)
**What it is:** A special file that wraps every page in a route group. Think of it as a template: Nav and Footer render once, and the page content swaps in the middle. Like a SQL view that joins a header table to every query result automatically.
**Why it matters:** Without layouts, you'd copy-paste Nav and Footer into every page file. With layouts, you define the shell once. Add a new page and it automatically gets the Nav and Footer.
**Try this:** After the slice is built, create a temporary `src/routes/test/+page.svelte` with just `<h1>Test</h1>`. Run `bun run dev` and visit `/test`. You'll see your Nav and Footer wrapping it without writing any layout code in that file.
**Go deeper:** https://svelte.dev/docs/kit/routing#layout

### Reactive Stores in Svelte
**What it is:** The `scrollProgress` store from slice 04 is a reactive value. The ScrollRail subscribes to it with `$scrollProgress`. When the user scrolls, the value updates, and the ScrollRail re-renders automatically. No manual event wiring.
**Why it matters:** It's like a live database view. The store is the table, components are views. When the underlying data changes, every view updates. You don't refresh manually.
**Try this:** Open the ScrollRail component. Add `console.log($scrollProgress)` somewhere inside. Open browser dev tools console. Scroll the page. Watch the values stream.
**Go deeper:** https://svelte.dev/docs/svelte/stores

### Active Route Detection (`$page`)
**What it is:** `$page.url.pathname` tells you which route is active. The Nav uses it to highlight the current link. The ScrollRail uses it to switch between home mode (station dots) and other mode (progress bar).
**Why it matters:** Instead of each page telling the Nav "I'm active," the Nav reads the URL itself. Decoupled. Like a WHERE clause that filters on the current context rather than being told what to filter.
**Try this:** In the Nav component, find where it checks the active route. Change the highlight color to something bright temporarily. Navigate between pages. See it track.
**Go deeper:** https://svelte.dev/docs/kit/$app-stores

## Verify

1. `bun run test` passes all new + existing tests
2. `bun run check` passes (TypeScript)
3. `bun run dev`: Nav shows on every page with wordmark and links
4. Mobile viewport: hamburger menu works
5. Footer shows on every page
6. Home page (`/`): ScrollRail shows station dots matching `services.length`
7. Other page (manually navigate to `/work` or any route): ScrollRail shows progress bar, no station dots
8. Scroll on home page: station dots fill progressively
9. Reduced motion off: transitions animate. Reduced motion on: transitions skip.
10. tree.txt reflects new files
