# Handoff: Slice 09c-1 — Foundation: DRY Extraction + Quick Wins

## Summary
Extracted duplicated CollapsibleSection and FilterGroup patterns into reusable components, standardized card hover CSS across all card types, applied existing motion actions (tilt, magnetic, ripple) to cards and filters, added reading time to blog posts, made tech tags clickable, and removed all hardcoded English strings from touched components. Net result: 88+ lines of duplicated code eliminated, consistent visual behavior across blog/work/services.

## What Was Built
- `src/lib/components/CollapsibleSection.svelte`: Reusable collapsible card with icon/numbered badge variants, `$bindable()` open state, collapsible/non-collapsible modes
- `src/lib/components/CollapsibleSection.test.ts`: 5 tests
- `src/lib/components/FilterGroup.svelte`: Reusable filter button group with ripple, deselect, accent color
- `src/lib/components/FilterGroup.test.ts`: 5 tests

## Files Modified
- `WorkDetailPage.svelte`: Replaced 3 inline section-card patterns with CollapsibleSection, removed ~100 lines of duplicated styles
- `ServiceDetailPage.svelte`: Replaced 3 inline section-card patterns with CollapsibleSection, removed ~60 lines of duplicated styles
- `BlogContent.svelte`: Wrapped in CollapsibleSection (collapsible=false) with contentTitle prop
- `BlogFilterSidebar.svelte`: Refactored to compose FilterGroup, localized date range labels
- `WorkFilterSidebar.svelte`: Refactored to compose FilterGroup
- `WorkCard.svelte`: Added use:tilt (on article, not FLIP target), use:magnetic on tags, standardized hover
- `BlogRow.svelte`: Added use:magnetic on tags, verified hover consistency
- `ProjectMiniCard.svelte`: Standardized hover to 300ms, added radial-gradient glow overlay
- `BlogDetailHeader.svelte`: Added readingTime prop + badge, localized back link strings
- `WorkDetailSidebar.svelte`: Made tech tags clickable links to /work?tag=X, localized section headers
- `WorkListingPage.svelte`: Fixed FLIP animation (removed absolute:true, kill competing reveal tweens)
- `src/routes/blog/[slug]/+page.ts`: Calculate reading time from HTML word count

## How It Works

**CollapsibleSection** is the shared visual pattern for all detail pages: `border-l-[3px] bg-[#141414]` card with optional toggle. Props: `title`, `open` (bindable), `index` (numbered badge), `accentColor`, `collapsible`. When `collapsible=false`, renders as a static card (blog). When `collapsible=true`, renders button header with chevron animation (work/services). Uses Svelte 5 snippets for icon and children slots.

**FilterGroup** is the shared filter button pattern: monospace label + "All" button + filter buttons with active/tag-active styles. Includes `use:ripple` for click feedback. Props: `label`, `items`, `activeKey`, `allowDeselect`, `onSelect`, `accentColor`.

**FLIP fix**: The work listing FLIP animation had two bugs: (1) `absolute:true` pulled cards out of grid flow and left them stuck at `position:absolute`, (2) `use:reveal` re-initialized on re-render setting `opacity:0` which FLIP animated toward instead of away from. Fix: removed `absolute:true`, added `gsap.killTweensOf(cards)` + `gsap.set(cards, { opacity: 1 })` before FLIP runs.

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| `$bindable()` for CollapsibleSection.open | Desktop ToC needs to sync with README open state | Callback prop — more verbose, same result |
| use:tilt on `<article>` not `<a>` | `<a>` has `data-flip-id` — tilt's inline transition conflicts with GSAP FLIP | Tilt on `<a>` — broke FLIP animation |
| Remove `absolute:true` from FLIP | Cards were stuck at position:absolute after animation | Keep absolute + clearProps — fragile |
| Kill reveal tweens before FLIP | use:reveal sets opacity:0 on re-render, FLIP animated toward it | Delay FLIP — timing-dependent |
| FilterGroup includes use:ripple | QW-3 from spec: ripple on filter buttons | Separate step — more changes |

## What Yesid Should Know
- **CollapsibleSection** is reusable anywhere you need a titled card. `collapsible={false}` for static cards, `bind:open` when you need to read the state from a parent.
- **FilterGroup** handles the "label + All + buttons" pattern. Use `allowDeselect={true}` for toggle behavior (work) or `false` for select-only (blog).
- **FLIP animation** now works by killing competing reveal tweens first. If you add more GSAP animations to WorkCard in the future, keep them off the `<a>` tag (the FLIP target) to avoid conflicts.
- **Reading time** is calculated at 200 words/minute from the HTML content. Appears as "X min read" badge in the blog detail header.
- **Clickable tech tags** link to `/work?tag=X` which the existing filter system already supports via URL params.

## What Comes Next
**Slice 09c-2 — Polish Enhancements + Layout Rethink** (`docs/slices/slice-09c2-polish-enhancements.md`):
- Layout audit of blog + work pages against award-winning sites (using /web-designer)
- cursorGlow action, reading progress bar, animated gradient border
- ScrollTrigger.batch() for listing entrances
- Code copy button, heading anchor links
- Metro line connectors, station badges, next/prev stop nav

## How to Verify
1. `/work` — click filters, cards animate and stay visible (FLIP fixed)
2. `/work` — hover cards: tilt on body, magnetic pull on tag pills
3. `/work/transit-data-pipeline` — collapsible sections toggle, ToC syncs with README, tech tags are clickable links
4. `/services/sql-development` — collapsible sections toggle, same look
5. `/blog` — any article has CollapsibleSection card styling (non-collapsible), reading time badge, filter ripple
6. Mobile — all pages degrade gracefully
7. `bun run test` — 314 pass
8. `bun run check` — 0 errors

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | FLIP animation broken — cards stuck on right, invisible | Moved use:tilt off FLIP target, removed absolute:true, kill competing reveal tweens | WorkCard, WorkListingPage |
| 2 | ToC doesn't collapse with README section | Made CollapsibleSection.open $bindable(), restored syncOpen | CollapsibleSection, WorkDetailPage |
| Final | Approved | — | — |
