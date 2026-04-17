# Slice 17e-2 — Snappy Sweep

**Status:** In progress
**Branch:** `feature/slice-17e-2-snappy-sweep`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-2-snappy-sweep.md`
**Depends on:** 17e-1 (merged)
**Blocks:** 17e-3 (crescendo factory replaces the Manifesto SplitText entrance that stays in place here)

## What

Snappy Doctrine enforcement — delete every on-load and on-scroll-into-view entrance animation across the site, remove orphaned motion code, and split FLIP filter logic into its own utility.

## Outcomes

1. `src/lib/motion/actions/reveal.ts` + test deleted; all 27 `use:reveal` attributes across 14 component files removed; `reveal` re-export dropped from `actions/index.ts`.
2. `src/lib/motion/actions/ripple.ts` + test deleted; both `use:ripple` attributes in `FilterGroup.svelte` removed; `ripple` re-export dropped.
3. `src/lib/motion/actions/tilt.ts` + test deleted; all 4 `use:tilt` attributes removed across About and Projects components; `tilt` re-export dropped.
4. Entire `src/lib/motion/svg/Train*` tree deleted (Train, TrainJourney, TrainTop, train-path, train-targets + their tests). `motion/svg/` contains only `MetroNetwork.svelte` + test.
5. `src/lib/motion/components/ScrollRail.svelte` + test deleted.
6. GSAP `ScrollTrigger`-driven entrance timelines stripped from: `BlogDetailHeader`, `ProjectDetailHeader`, `ProjectDetailSidebar`, `FeaturedProjects`, `HomeServices`, `BlogRow`, `ProjectMiniCard`. Cards + headers render at final state on load.
7. `useListingEntrance()` deleted from `listingAnimations.ts`. FLIP filter primitives (`captureFlipState`, `animateFlipTransition`) moved into new `src/lib/motion/utils/flip.ts` with preserved behavior; consumers in `BlogListingPage` + `ProjectListingPage` rewired; `listingAnimations.ts` deleted.
8. `opacity: 0` seed CSS removed from `<style>` blocks of affected component files (site-wide grep audit).
9. `MotionPathPlugin` eager import + re-export deleted from `motion/utils/gsap.ts` (train gone, no consumers remain). `gsap.test.ts` updated.
10. `bun run test` and `bun run check` pass with zero visual regression on the running site.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] `grep -r "use:reveal\|use:ripple\|use:tilt" src/` returns 0 matches
- [ ] `grep -r "ScrollRail\|train-path\|train-targets\|TrainJourney\|TrainTop" src/` returns 0 matches (except in archived CHANGELOG or generated files)
- [ ] `grep -r "useListingEntrance\|listingAnimations" src/` returns 0 matches
- [ ] `grep -r "MotionPathPlugin" src/` returns 0 matches
- [ ] Listing pages (`/blog`, `/projects`) render cards at final state on load — no fade-up, no stagger entrance
- [ ] Service detail pages, About page sections render at final state on load
- [ ] FLIP filter transitions on listings still animate smoothly when changing filters
- [ ] Bundle-size delta against 17e-1 baseline recorded in this slice spec

## Non-goals

- Removing Manifesto SplitText entrance (17e-3 — crescendo replacement)
- Rewriting hero timeline (17e-4)
- Removing `heroScrollLock.ts` (17e-4 — D264)
- Consolidating LED pulse / cursor blink / RAF loops (17e-5)
- Writing MOTION.md v2.0 (17e-6)

## Iteration log

(Fill in per task as the session progresses.)

## Bundle-size delta (17e-2 end vs 17e-1 baseline)

Recorded from `bun run bundle-size` at the end of Task 7. Baseline from `docs/slices/slice-17e-1-foundation.md`.

| Route | 17e-1 baseline (gzip) | 17e-2 end (gzip) | Delta |
|---|---|---|---|
| Home `/` | 32.39 KB | — | — |
| Blog listing `/blog` | 0.53 KB | — | — |
| Projects listing `/projects` | 17.17 KB | — | — |
| Services listing `/services` | 2.85 KB | — | — |
| Blog detail `/blog/[slug]` | 14.39 KB | — | — |
| Projects detail `/projects/[slug]` | 7.95 KB | — | — |
| Services detail `/services/[id]` | 3.71 KB | — | — |
| About `/about` | 8.47 KB | — | — |
| Contact `/contact` | 14.67 KB | — | — |
| Tech stack `/tech-stack` | 2.08 KB | — | — |
| Shared layout (node 0) | 13.18 KB | — | — |

Expected delta: minimal per-route (tree-shaking already elides the small `reveal.ts` surface on routes that didn't import it); shared-layout modest shrink when `MotionPathPlugin` + listingAnimations exit. Real wins land 17e-3 (SplitText exit), 17e-4 (hero inline + DrawSVG scope), 17e-5 (ambient consolidation).
