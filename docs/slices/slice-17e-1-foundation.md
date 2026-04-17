# Slice 17e-1 — Motion Foundation

**Status:** In progress
**Branch:** `feature/slice-17e-1-foundation`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-1-foundation.md`
**Depends on:** nothing (first 17e sub-slice)
**Blocks:** 17e-2 (Snappy Sweep), 17e-3 (Scrub Factories), 17e-4 (Hero Timeline), 17e-5 (Interaction Consolidation)

## What

Motion infrastructure the other 17e sub-slices depend on.

## Outcomes

1. `src/lib/motion/tokens.ts` exports `duration` and `ease` constants that mirror `tokens.css` CSS custom properties, with a unit test asserting parity.
2. `src/lib/styles/tokens.css` has the complete motion token set (`--duration-instant`, `--duration-fast`, `--duration-normal`, `--duration-slow`, `--duration-slower`, `--ease-default`, `--ease-out`, `--ease-in-out`, `--ease-bounce`).
3. `src/lib/motion/utils/ticker.ts` exposes `subscribe(id, fn)` + `unsubscribe(id)` on a single `gsap.ticker` callback. One frame → one DOM pass for all subscribers.
4. `src/lib/motion/utils/gsap.ts` registers only `ScrollTrigger` eagerly. `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` are async loaders that register-on-demand + are idempotent.
5. `src/lib/motion/utils/lenis.ts` does not call `ScrollTrigger.normalizeScroll`. Touch devices use native browser scroll (no scroll-jacking on mobile).
6. `rollup-plugin-visualizer` produces `dist/stats.html` on production build. `bun run bundle-size` is a working script.
7. `bun run test` and `bun run check` pass. Zero visual regression on the running site.

## Acceptance criteria

- [ ] All outcomes above are verified
- [ ] Tap-vs-click bug on mobile is resolved on a real iPhone + Android device (TocPill opens only on tap, ProjectsStrip links fire only on tap)
- [ ] Home route initial JS bundle size is reported by `bun run bundle-size` (baseline number recorded for future 17e sub-slices to compare against)
- [ ] No hardcoded timing values introduced by this sub-slice (all reads go through `tokens.ts` or CSS `var(--duration-*)` / `var(--ease-*)`)

## Non-goals

- Deleting existing `use:reveal` / entrance animations (that is 17e-2)
- Building scrub factories (17e-3, 17e-4)
- Consolidating LED pulse / cursor blink / RAF loops (17e-5)
- Rewriting MOTION.md (17e-6)

## Iteration log

(Fill in per task as the session progresses.)
