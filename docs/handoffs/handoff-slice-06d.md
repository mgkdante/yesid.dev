# Handoff: Slice 06d — Home Page Redesign: Metro System Evolved

## Summary

Transformed the home page from a sparse 4-section layout into a full 8-stop metro journey with bold typography, 3D hero, featured projects, about bento grid, blog feed, fullscreen mobile menu, and a fully data-driven architecture where adding a service auto-extends all stop numbers.

## What Was Built

- `src/lib/data/metro.ts`: Data-driven metro line — computes all stop numbers, labels, and dividers from services array. Adding a service = all stops auto-renumber.
- `src/lib/data/content.ts`: Centralized i18n content — all UI strings as LocalizedString objects (hero, about, CTA).
- `src/lib/motion/svg/TrainTop.svelte`: Bird's-eye 2-wagon train SVG that sits on the rail track.
- `src/lib/data/metro.test.ts`: Tests for metro line computation and auto-numbering.
- `src/lib/data/content.test.ts`: Tests for all i18n content fields.

## Files Modified

- `src/lib/motion/three/WagonInner.svelte`: Fixed Draco loader (was `useDraco: true`, now uses `useDraco()` from @threlte/extras which returns a proper DRACOLoader instance). Camera repositioned to front 3/4 angle.
- `src/lib/components/HeroBanner.svelte`: Removed opaque bg (transparent for gradient show-through), restructured to flex layout with contained 3D card (rounded corners, overflow for pop-out effect), mobile-visible 3D card, all text from content.ts.
- `src/lib/components/FeaturedWork.svelte`: Removed duplicate station header (StationDivider handles it).
- `src/lib/components/AboutBento.svelte`: Removed duplicate station header, all text from content.ts via resolveLocale().
- `src/lib/components/BlogFeed.svelte`: Removed duplicate station header.
- `src/lib/components/Nav.svelte`: Fullscreen metro-themed mobile menu (hazard stripes, numbered links, staggered animation, escape key, scroll lock). Desktop + mobile links glow on hover.
- `src/lib/components/Footer.svelte`: z-50 so it paints over the fixed rail.
- `src/lib/components/ScrollPrompt.svelte`: Changed from decorative div to clickable button that smooth-scrolls down.
- `src/lib/components/StationDivider.svelte`: Larger text (xs → sm on desktop).
- `src/lib/motion/svg/TrainJourney.svelte`: Uses TrainTop (2-wagon bird's-eye SVG), removed side-view train import, removed trailing glow line, absolute positioning inside rail container.
- `src/routes/+page.svelte`: Rail scoped (top-16, bottom-20, overflow-hidden), train inside rail container (paints on top), metro.ts for stop labels/numbers, content.ts for CTA text, fixed serviceActiveIndex formula (normalized to service scroll range).
- `src/routes/+layout.svelte`: Skip fade-in animation on home (prevents stacking context trapping fixed elements), footer wrapper at z-[45].
- `src/routes/preview/train/+page.svelte`: Fixed pre-existing type error (async onMount cleanup pattern).
- `src/lib/data/index.ts`: Added exports for metro.ts and content.ts.
- `src/app.css`: Hidden browser scrollbar (scrollbar-width: none + ::-webkit-scrollbar).

## How It Works

The metro system is fully data-driven via `metro.ts`:
1. `buildMetroLine()` generates stops from the services array + fixed sections (hero, featured, about, blog, terminal)
2. Stop numbers auto-increment — adding a 5th service makes it stops 01-05, and featured becomes stop 06
3. `formatStopLabel()` generates "STOP 05 — FEATURED WORK" from stop data
4. `+page.svelte` imports `TOTAL_STOPS` and `metroStops` — no hardcoded numbers
5. Station divider labels, rail nodes, and active indices all derive from this single source

Content is centralized in `content.ts`:
- `heroContent`: badge text, headline lines, subtitle, CTA labels, SQL decoration
- `aboutContent`: name, title, bio, stack items, location, interests
- `ctaContent`: terminal heading, subtitle, button labels
- Components call `resolveLocale()` — ready for French/Spanish translations

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| `useDraco()` from @threlte/extras | The API requires a DRACOLoader instance, not `useDraco: true` | Direct DRACOLoader import (fails in Vite HMR) |
| Bird's-eye 2-wagon SVG | Yesid wanted top-down view sitting on the rail like a real train | Keep side-view rotated 90deg |
| Train inside rail container | DOM painting order (last child = on top) guarantees train covers the progress line | Separate z-index layers (failed due to stacking contexts) |
| Skip fade-in on home page | The `animate-page-fade-in` CSS animation creates a stacking context that traps fixed elements, preventing footer from covering rail | Move rail out of main (too disruptive) |
| Footer z-50 + wrapper z-[45] | Footer must paint over the fixed rail (z-40) | Clip-path (also creates stacking context) |
| serviceActiveIndex normalized | Old formula mapped full scroll to 4 indices — services only occupy stops 1-4 of 9 | Per-section IntersectionObserver |
| Scrollbar hidden via CSS | Rail + train are the scroll indicator — native scrollbar is redundant | Overlay scrollbar styling |

## What Yesid Should Know

### Stacking contexts are tricky with `position: fixed`
Fixed elements create their own stacking context. If a parent has an animation, opacity < 1, or transform, it captures fixed children and their z-index becomes relative to that parent, not the viewport. This is why the footer couldn't cover the rail until we removed the fade-in animation from `<main>` on the home page.

### The metro line auto-extends
Try adding a 5th service to `services.ts`. The rail gets a 10th node, stop numbers shift, and station divider labels update. Zero component changes.

### Three.js Draco loading
The GLB model uses Draco compression. The decoder is fetched from Google CDN (gstatic.com). `useDraco()` from `@threlte/extras` handles this — do NOT pass `useDraco: true` to `useGltf()`, that option doesn't exist.

## What Comes Next

**Slice 06f — Scroll-Linked Video Hero**: Replace the 3D ThreeJS wagon scene with a Google Flow video that plays forward on scroll-down and rewinds on scroll-up. This will remove the Threlte/Three.js dependency from the hero while keeping the contained card layout.

## How to Verify

1. `bun run test` — 243 tests pass
2. `bun run check` — 0 errors
3. Open `http://localhost:5173/` — scroll through all stops
4. Hero: "AVAILABLE FOR HIRE" badge visible on mobile, text content from data layer
5. Services: all 4 stations light up progressively as you scroll through them
6. Rail: starts below nav, ends above footer, train on top of progress line
7. Train: 2-wagon bird's-eye SVG, draggable
8. No duplicate station titles (StationDivider only)
9. Mobile hamburger: fullscreen overlay with numbered links, glow on hover, hazard stripes
10. Desktop nav: links glow on hover
11. Footer: no rail/train overlap
12. Scrollbar: hidden (rail is the scroll indicator)

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | 14 issues (rail, spacing, dividers, blog data, drag, footer) | All addressed | +page.svelte, TrainJourney, ServiceStation, StationDivider, blog.ts, Footer |
| 2 | 10 issues (ThreeJS, double titles, rail scope, train orient, hero layout, i18n, compartment, hamburger) | All addressed | WagonInner, FeaturedWork, AboutBento, BlogFeed, +page.svelte, TrainJourney, HeroBanner, Nav, metro.ts, content.ts |
| 3 | 6 issues (3D POV, train on rail, 2 wagons, services lighting, hero box size, nav glow) | All addressed | WagonInner, +page.svelte, TrainTop.svelte, TrainJourney, HeroBanner, Nav |
| 4 | Rail overlap footer, orange line on train, scrollbar, SQL text size, scroll arrow, stop label sizes | All addressed | +page.svelte, TrainJourney, Footer, +layout.svelte, app.css, HeroBanner, ScrollPrompt, StationDivider |
| 5 | Available for hire hidden on mobile, stop title text too small everywhere | Fixed | HeroBanner (pt-24 mobile), StationDivider, +page.svelte |
| Final | Approved — 3D fab to be replaced with video in new slice | — | — |
