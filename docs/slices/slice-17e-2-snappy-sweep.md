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

- **Task 1 (slice spec):** approved. Commit `a02400d`.
- **Task 2 (orphan deletions):** deleted ripple/tilt/Train-tree/ScrollRail + tests (15 files); swept 2× `use:ripple` in FilterGroup, 4× `use:tilt` across AboutIdentity/AboutPage/AboutTestimonials/ProjectCard; barrel drops reveal/ripple/tilt exports. Tests: 802 → 762. `accentColor` prop on FilterGroup kept unused (upstream sidebar callers still thread it — 17a-4 cleanup candidate). Commit `bbd0049`.
- **Task 3 (reveal sweep):** deleted reveal.ts + test; swept all **27 `use:reveal` attributes across 14 files**; removed now-unused `stagger` imports from AboutMetrics/AboutMethod/AboutPage/TagList. Tests: 762 → 752. Side finding: **ProjectMiniCard has zero production consumers** — flagged for 17a-4 dead-code cleanup. Commit `a296f14`.
- **Task 4 (entrance strips):** removed GSAP entrance timelines from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar, FeaturedProjects, HomeServices. Also flipped seed `opacity: 0` CSS to visible on the formerly-faded elements in the two detail headers (4 rules each). Preserved HomeServices SVG hover-morph logic (doctrine-compatible interaction). Tests: 752 unchanged. Commit `780a6c5`.
- **Task 5 (FLIP extraction):** created `motion/utils/flip.ts` + parity test (3 tests — "with elements" case deferred to Playwright since happy-dom can't exercise real layout); migrated BlogListingPage + ProjectListingPage; deleted `listingAnimations.ts`; removed `[data-batch="..."] { opacity: 0 }` seed CSS in both listings (cards render at final state); updated barrel. Tests: 752 → 755. Commit `015b973`.
- **Task 6 (opacity + MotionPathPlugin):** caught an unplanned doctrine violation — `ProjectDetailPage.svelte` `.section-animate` + `@keyframes section-fade-up` applied a CSS fade-up on load to every section block + README. Class + keyframe + reduced-motion rule all removed. **MotionPathPlugin eager import kept** — `StackConnections.svelte:162` consumes `motionPath` for tech-stack dot animations; plan's "train was only consumer" assumption was wrong. Flag for 17e-5 re-evaluation (could become lazy `loadMotionPath` when StackConnections is touched). BlogContent `opacity: 0` at lines 84/107 confirmed as hover-interaction seeds (not entrance) — keep. Tests: 755 unchanged. Commit `e193b35`.
- **Task 7 (verification):** grep-zero confirmed for `use:reveal` / `use:ripple` / `use:tilt` / Train tree / ScrollRail / listingAnimations / reveal-ripple-tilt imports. Only remaining references are intentional history comments. `bun run bundle-size` ran; `dist/stats.html` generated. Full delta per-route in `dist/stats.html` treemap — headline: listings shrink modestly (opacity-0 seed + listingAnimations surface exit), detail pages trim (SplitText entrance code removed), about route has the biggest shrink (was heaviest reveal/tilt consumer). Real wins land 17e-3 (SplitText lazy), 17e-4 (hero), 17e-5 (ambient).

**Test count journey:** 802 (17e-1 baseline) → 762 (Task 2 deletions) → 752 (Task 3 reveal deletion) → 755 (Task 5 FLIP tests added). `bun run check`: 0 errors throughout, 20 warnings (dropped 1 from baseline during Task 4 cleanup).

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
