# Slice 17e-5 — Interaction Consolidation

**Status:** In progress
**Branch:** `feature/slice-17e-56-close-motion` (combined 17e-5 + 17e-6 PR)
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-5-interaction-consolidation.md`
**Depends on:** 17e-1 (shared ticker, lazy loaders), 17e-4 (typewriter cursor blink CSS)
**Blocks:** 17e-6 ships on the same branch; together they close Slice 17e.

## What

Introduce a first-class `use:morphHover` action (signature 4). Consolidate one scoped pulse keyframe into canonical global `pulse-glow`. Migrate all ambient JS loops onto the shared `ticker.ts` with IntersectionObserver offscreen pause. Delete two remaining post-D266 reveal violations. Finish D269 lazy plugin migration and delete eager GSAP imports so the home-route bundle-shrink win finally lands.

## Outcomes

1. `src/lib/motion/actions/morphHover.ts` exports a Svelte action with uniform shape: `(node, params) => { destroy }`. `MorphSVG` plugin lazy-loaded on first hover via `loadMorphSVG()`. Mobile tap toggle. Reduced-motion no-op.
2. `HomeServices.svelte` uses `use:morphHover={{ shapes: SHAPES, ... }}` on each SVG panel. `cardPaths[]` / `cardOriginals[]` / `handleCardEnter/Leave/Tap` manual wiring is gone.
3. `src/lib/motion/utils/morphHelpers.ts` KEPT (SvgIcon is a second consumer). Barrel re-export retained.
4. `ManifestoEdgeBottom.svelte` scoped `@keyframes pulse` deleted; `.manifesto__status-dot` now uses canonical global `pulse-glow`.
5. Typewriter type-sequence `setInterval` migrates to shared `ticker.subscribe()` — time-based progression via `deltaTime`.
6. `ManifestoCanvas`, `ReadingProgressBar`, `AboutTrain` always-on RAFs migrate to shared `ticker.subscribe()`. ManifestoCanvas + AboutTrain add IntersectionObserver offscreen pause; ReadingProgressBar runs always on article routes (no gate).
7. Manifesto countdown + AboutTestimonials carousel IntersectionObserver-gated — start on section enter, stop on exit.
8. `SvgIcon.animateStagger` function + switch case deleted (D267 F). `StackScenarioCard`'s `onMount` `gsap.fromTo({ y: 30, opacity: 0 }, ...)` deleted (D267 F).
9. `registerGsapPlugins()` renamed → `initScrollTriggerConfig()`. Only `ScrollTrigger.config({ignoreMobileResize:true})` as the side-effect. Eager plugin imports for MotionPath, DrawSVG, CustomEase, MorphSVG, Flip deleted from `gsap.ts`. New `loadMotionPathPlugin()` + `loadSplitText()` loaders added. All 9 consumer sites migrated (SplitText remains eager, documented, blocked by wordmarkHover sync-coupling).
10. Stale `normalizeScroll` comments at `+layout.svelte:24` and `HeroBanner.svelte:16` removed.
11. `bun run test` + `bun run check` pass. One RAF loop site-wide (shared ticker). Bundle: home `/` gzipped shrinks 3–8 KB vs 17e-4 end.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] `grep -rn "registerGsapPlugins" src/` returns 0 matches outside tests
- [ ] `grep -rn "@keyframes pulse\b\|@keyframes led-pulse\b" src/` — 0 matches outside `app.css`
- [ ] `grep -rn "animateStagger" src/` — 0 matches
- [ ] `grep -n "gsap\.fromTo.*opacity" src/lib/components/stack/StackScenarioCard.svelte` — 0 matches
- [ ] `grep -rn "use:morphHover" src/` — at least HomeServices
- [ ] `grep -rn "requestAnimationFrame" src/lib/` — only `ticker.ts`, `motion/stores/scroll.ts` (infra), and the one-shot call in `createHeroTimeline.ts:309`
- [ ] `grep -rn "normalizeScroll" src/` — 0 matches outside `.test.` files
- [ ] HomeServices SVG-panel hover-morph works (desktop hover + mobile tap); reduced-motion static
- [ ] Manifesto countdown + AboutTestimonials pause when their sections are offscreen
- [ ] Bundle-size delta recorded vs 17e-4 end (target: home `/` -3 to -8 KB gzipped)

## Non-goals

- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits (17e-6)
- Ripple restore (G2 — stays cut)
- CloserGraffiti factory rebuild (optional, out of scope)
- `SplitText` async migration (blocked by wordmarkHover sync-coupling; future slice)
- `motion/stores/scroll.ts` RAF migration (infrastructure; revisit if bundle audit flags it)
- Cursor-blink stream 2 (plan-audit confirmed nothing to migrate; already canonical)

## Iteration log

(Fill in per task as the session progresses.)
