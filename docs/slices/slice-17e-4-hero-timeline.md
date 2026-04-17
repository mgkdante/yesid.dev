# Slice 17e-4 — Hero Timeline Rewrite

**Status:** In progress
**Branch:** `feature/slice-17e-4-hero-timeline`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-4-hero-timeline.md`
**Depends on:** 17e-1, 17e-2, 17e-3 (via PR #15 merge)
**Blocks:** 17e-5 (typewriter RAF consolidation), 17e-6 (Lighthouse baseline)

## What

Rewrite the hero's scroll-scrubbed MetroNetwork timeline as a self-contained factory, inline the SVG at build, branch the pin length on mobile, delete `heroScrollLock.ts`, and replace the typewriter's setInterval blink with CSS.

## Outcomes

1. `src/lib/motion/scrubs/createHeroTimeline.ts` is a sync factory matching the 17e-3 convention — caller preloads `loadDrawSVG()` + `loadCustomEase()` at route setup; factory composes ScrollTrigger + pin + DrawSVG stroke-scrub + label fades + Phase 5 Berri-UQAM zoom.
2. `MetroNetwork.svelte` inlines the SVG via Vite `?raw` import + `{@html}`; runtime `fetch('/images/montreal-metro.svg')` is gone. SSR HTML contains the SVG.
3. `static/images/montreal-metro.svg` has been optimized once with `svgo` CLI (round coordinates, collapse groups, drop metadata). Raw size ~21.2 KB → expected < 12 KB.
4. Mobile pin length ≈ 300vh (vs 800vh desktop). Full network + Phase 5 zoom preserved on both. Branch via `window.matchMedia('(max-width: 1023px)')` at factory construction.
5. `src/lib/motion/utils/heroScrollLock.ts` deleted. `HeroBanner.svelte` no longer calls `createScrollLock`. Typewriter becomes pure ambient (D264).
6. `src/lib/motion/utils/heroTypewriter.ts` cursor blink uses a CSS keyframe class (`.typewriter-cursor`). Type-sequence logic preserved.
7. `src/lib/motion/utils/heroTimeline.ts` deleted. Consumers of its exported symbols migrated to `scrubs/createHeroTimeline.ts`.
8. `bun run test` + `bun run check` pass. Hero scroll experience on desktop is visually identical to the pre-refactor behavior (pinned 800vh, lines draw, labels fade, Phase 5 zooms to Berri-UQAM). Mobile hero works — shorter pin, same network.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] View-source on `/` contains the MetroNetwork SVG inline — no network request to `.svg` on initial load
- [ ] Desktop hero: scroll through 800vh triggers stroke-draw + label fades + Phase 5 zoom; same visual as pre-refactor
- [ ] Mobile hero: shorter pin (~300vh), same visual content, full network visible
- [ ] Reduced-motion: hero renders final state statically (lines drawn, labels visible, zoomed to Phase 5); no ScrollTrigger registered
- [ ] No `heroScrollLock` references anywhere (`grep -r "heroScrollLock\|createScrollLock" src/` returns 0)
- [ ] No `heroTimeline` references outside the new scrubs factory (`grep -r "heroTimeline" src/ | grep -v scrubs/` returns 0)
- [ ] Typewriter cursor blinks via CSS (no `setInterval` in the blink path); type-sequence still correct
- [ ] Bundle-size delta recorded against 17e-3 end: shared-layout node expected to shrink by DrawSVG + CustomEase being lazy + heroTimeline.ts gone; home route initial JS expected shrink ~5–10 KB gzipped; initial HTML grows by inlined SVG (~4 KB post-SVGO gzip).
- [ ] `bun run test` passes
- [ ] `bun run check` passes (0 errors)

## Non-goals

- `morphHelpers.ts` → `actions/morphHover.ts` rename (17e-5)
- RAF / ambient loop consolidation for `ManifestoCanvas`, `ReadingProgressBar`, typewriter type-sequence (17e-5)
- `CloserGraffiti` rebuild as `createCloserTimeline` (optional polish, 17e-5 or later)
- SplitText lazy migration (17e-5 or later)
- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits on all routes (17e-6 — this slice establishes the hero's target numbers only)

## Iteration log

(Fill in per task as the session progresses.)
