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

**Plan-audit corrections (pre-code)**
- `morphHelpers.ts` kept (SvgIcon also consumes it) — plan originally said delete.
- Pulse consolidation reduced from "4 sites" to 1 actual duplicate (ManifestoEdgeBottom) — `pulse-glow` was already canonical in app.css.
- Cursor-blink stream 2 is empty — audit found only 2 cursor blinks exist and both are already CSS-driven (typewriter + TerminalCursor via global `@keyframes blink`).
- Added AboutTrain RAF + AboutTestimonials setInterval to the ambient-consolidation scope.
- New Task 9 (D269 lazy plugin migration) decomposed into 9a/9b/9c/9d/9e sub-steps.
- Combined-PR workflow adopted: 17e-5 + 17e-6 ship in one branch (`feature/slice-17e-56-close-motion`).

**Per-task commits**
1. `docs(slice-17e-5)`: slice spec
2. `feat(slice-17e-5)`: `use:morphHover` action + 5 tests
3. `feat(slice-17e-5)`: migrate HomeServices to `use:morphHover`
4. `refactor(slice-17e-5)`: consolidate ManifestoEdgeBottom pulse → global `pulse-glow`
5. `refactor(slice-17e-5)`: typewriter type-sequence on shared ticker
6. `refactor(slice-17e-5)`: ManifestoCanvas + ReadingProgressBar + AboutTrain on shared ticker (IO-gated where applicable)
7. `refactor(slice-17e-5)`: IO-gate Manifesto countdown + AboutTestimonials carousel
8. `chore(slice-17e-5)`: delete unused ReadingProgressBar (Yesid flag — never re-wired after scrap)
9. `feat(slice-17e-5)`: delete SvgIcon.animateStagger + StackScenarioCard fade-up (D267 F)
10. `fix(slice-17e-5)`: replace 2 dead 'stagger' frontmatter refs with valid animations
11. `feat(slice-17e-5)`: add initScrollTriggerConfig + loadMotionPathPlugin + loadSplitText (9a)
12. `refactor(slice-17e-5)`: migrate 9 GSAP consumers to lazy loaders + initScrollTriggerConfig (9c)
13. `refactor(slice-17e-5)`: D269 — delete registerGsapPlugins + 4 eager GSAP imports (9b+9d)

**Bundle-size delta (Task 9e — measured 2026-04-17)**

Gzipped home-route entry (node 4):
| Reference point | Size | Delta vs baseline |
|---|---|---|
| 17e-1 baseline | 32.39 KB | — |
| 17e-4 end (pre-17e-5) | 34.57 KB | +2.18 KB |
| **17e-5 end (post-D269)** | **35.00 KB** | **+2.61 KB total / +0.43 KB vs 17e-4** |

Target was -3 to -8 KB shrink vs 17e-4. Actual: flat (+0.43 KB).

**Why the shrink didn't land:**
- `ScrollTrigger` + `SplitText` + `MorphSVGPlugin` stay eager by necessity (site-wide ScrollTrigger config; `wordmarkHover`'s sync `new SplitText()` coupling; morphHelpers' static `MorphSVGPlugin.convertToPath()` call from SvgIcon which is on every major route). These three are the biggest plugins.
- The 4 lazy-split plugins (`DrawSVG`, `CustomEase`, `MotionPath`, `Flip`) DO end up in separate Vite chunks, but static imports in `flip.ts` (`from 'gsap/Flip'`) and `createHeroTimeline.ts` (`from 'gsap/CustomEase'`) bundle those plugins directly into route chunks, defeating the lazy split at runtime. The static imports are required because `captureFlipState()` and `CustomEase.create()` are synchronous.
- Real user-perceived load impact is better measured via Lighthouse TBT/LCP (17e-6 Task 2) than raw bundle bytes.

**Architectural wins (even without bundle shrink):**
- Single entry point (`initScrollTriggerConfig`) for ScrollTrigger setup — clear, documented, one idempotent call.
- Per-consumer plugin dependency is now explicit (consumer `await`s only what it needs).
- Future `captureFlipState` async refactor or `wordmarkHover` sync-shape refactor unlocks the remaining shrink without further infrastructure changes.

**Deferred:**
- `captureFlipState` async migration (breaking API change, needs consumer coordination)
- `wordmarkHover` async action shape (would allow `loadSplitText` lazy path)
- Both carried forward as post-17e slice opportunities.
