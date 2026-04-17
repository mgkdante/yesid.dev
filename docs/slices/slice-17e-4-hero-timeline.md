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

- [ ] All outcomes verified (Yesid-owned)
- [x] View-source on `/` contains the MetroNetwork SVG inline — no network request to `.svg` on initial load (Task 2, `?raw` + `{@html}`)
- [ ] Desktop hero: scroll through 800vh triggers stroke-draw + label fades + Phase 5 zoom; same visual as pre-refactor (Yesid to verify)
- [ ] Mobile hero: shorter pin (~300vh), same visual content, full network visible (Yesid to verify)
- [ ] Reduced-motion: hero renders final state statically (lines drawn, labels visible, zoomed to Phase 5); no ScrollTrigger registered (Yesid to verify)
- [x] No `heroScrollLock` references anywhere (`grep -r "heroScrollLock\|createScrollLock" src/` returns 0)
- [x] No `heroTimeline` references outside the new scrubs factory (`grep -r "utils/heroTimeline\|initHeroTimeline\|buildHeroTimeline" src/` returns 0)
- [x] Typewriter cursor blinks via CSS (no `setInterval` in the blink path); type-sequence still correct
- [x] Bundle-size delta recorded — see table below. Plan expected home shrink 3–8 KB from lazy DrawSVG/CustomEase; actual home **+2.18 KB** because `registerGsapPlugins()` is still called for its `ScrollTrigger.config` side-effect and for non-migrated plugins. Lazy-plugin savings require a consumer-wide migration deferred to 17e-5/17e-6.
- [x] `bun run test` passes — 774/774
- [x] `bun run check` passes (0 errors, 19 warnings baseline)

## Non-goals

- `morphHelpers.ts` → `actions/morphHover.ts` rename (17e-5)
- RAF / ambient loop consolidation for `ManifestoCanvas`, `ReadingProgressBar`, typewriter type-sequence (17e-5)
- `CloserGraffiti` rebuild as `createCloserTimeline` (optional polish, 17e-5 or later)
- SplitText lazy migration (17e-5 or later)
- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits on all routes (17e-6 — this slice establishes the hero's target numbers only)

## Iteration log

- **Task 1 — Slice spec.** Outcomes / acceptance / non-goals captured; branched `feature/slice-17e-4-hero-timeline` from main at `28d821c`. Commit `91f5eae`.
- **Task 2 — Inline MetroNetwork SVG.** Replaced runtime `fetch('/images/montreal-metro.svg')` with Vite `?raw` import + `{@html}` in `MetroNetwork.svelte`; added `declare module '*.svg?raw'` ambient type. Ran `svgo@4.0.1` via new `svgo.config.mjs` at repo root: **21.175 KB → 15.083 KB (28.8% reduction).** `--disable` CLI flag was removed in SVGO 4, so the config file was required; had to `overrides: { convertColors: false, mergePaths: false, cleanupIds: false }` — the default preset lowercased `#E07800` (breaking the `===` match in classification) and merged 87 station paths into 1 (breaking per-station opacity animation). Kept `.source.svg` backup locally and added `static/images/*.source.svg` to `.gitignore`. Commit `e5d78ce`.
- **Task 3 — `createHeroTimeline` factory.** Ported the full 9-phase choreography (pin + DrawSVG line scrub + station/label fades + Phase 5 Berri-UQAM zoom + Phase 6 cross-fade + Phase 7 hero-text zoom-out + Phase 8 stagger + Phase 9 hold) from `utils/heroTimeline.ts` verbatim, with internal `CustomEase.create('networkDraw')` and reduced-motion branch. The plan's test template had an oversimplified 3-phase approximation and different opts (`svgRoot, wordmark, berri`); real HeroBanner uses `svgWrapper, heroTextContainer, heroDot, scrollPrompt`, so I wrote tests against the real surface. +6 tests. Commit `76a27c3`.
- **Task 4 — Wire HeroBanner + mobile branch.** Dropped `buildHeroTimeline` + `gsap.matchMedia` wrapper; added `await Promise.all([loadDrawSVG(), loadCustomEase()])` preload; single `window.matchMedia('(max-width: 1023px)')` mount-time check → `pinLength: isMobile ? '300%' : '800%'`. Kept `registerGsapPlugins()` for its `ScrollTrigger.config({ ignoreMobileResize: true })` side-effect (other home-page components still depend on the full eager-plugin path). Added a dedicated reduced-motion early branch so users who opted out don't run the typewriter. Commit `b5e998f`.
- **Task 5 — Delete `heroScrollLock`.** File deleted (74 lines); all HeroBanner plumbing removed. Typewriter now runs `typewriter.type(() => {})` on every visit. **Two follow-up bug fixes Yesid caught:**
  - `fix(slice-17e-4): snap-fade scrollPrompt on any scroll (Phase 1a)` — commit `b988b7f`. Pre-existing Phase 2 fade at progress `0.17` left the billboard visible for ~136vh of scroll. New Phase 1a: `tl.to(scrollPrompt, { opacity: 0, duration: 0.01 }, 0.005)`. Billboard fades within ~8vh of any scroll. Phase 1b pulse no longer targets scrollPrompt (prevents conflict with early fade).
  - `fix(slice-17e-4): typewriter no longer fights scrub for scrollPrompt opacity` — commit `65885af`. `startBlink()` had `scrollPrompt.style.opacity = '1'`. Once scrub was past Phase 1a, GSAP stopped ticking opacity — the inline `1` from startBlink stuck permanently. Removed the line; scrub now owns scrollPrompt opacity exclusively, typewriter owns text + cursor only.
- **Task 6 — Cursor blink via CSS keyframe.** `startBlink`/`stopBlink` now `classList.add/remove('typewriter-cursor')`. Added `@keyframes typewriter-blink { to { visibility: hidden; } }` to `app.css` — `visibility` (not opacity) so the blink doesn't multiply with the scrub-driven scrollPrompt fade. Moved `.scroll-block-cursor { opacity: 0; margin-left: 0.15em; }` out of HeroBanner's scoped style into `app.css` to resolve the Svelte scoped-style specificity fight against the global `.typewriter-cursor` class. Commit `6c373c9`.
- **Mobile typography + layout (follow-ups).** Yesid flagged mobile overflow + sizing issues during iterative review. Six commits:
  - `c9dbc09` — `.text-hero` mobile clamp width-capped (11vw); mobile `padding-inline: 1rem`; `MetricDisplay` sizes shifted one step down globally.
  - `3a8e392` — removed the `padding-inline: 1rem` (edge-to-edge on mobile); mobile-only `.metric-value.text-title → var(--text-heading)` override; `HeroMobileSql` top padding `py-10 → pt-4 pb-10`.
  - `f637543` — mobile `.hero-viewport-text` `padding-block: 1.5rem → 0.75rem`; width cap bumped `11vw → 12vw`.
  - `5d7cd37` — added `--text-hero-mobile: clamp(3rem, min(13vw, 8svh), 4rem)` token; `HeroTextContent` spans use `text-hero-mobile md:text-hero`; deleted hardcoded clamp in scoped style (token-only, "no hardcoded values" per Yesid); `HeroMetrics` `grid-cols-1 md:grid-cols-3`; `AboutMetrics` `flex-col md:flex-row`.
  - `91cade0` — 2-col grid with centered third card (later reverted on Yesid's next request).
  - `47508d8` — **final mobile metric layout: single Card with 3 metrics horizontally divided on mobile**, 3-card grid on desktop (unchanged). Saves ~150px of vertical space so the entire hero (headline + metrics + subhead + subtitle + CTAs) fits inside `calc(100svh - 5rem)` on short phones. Mobile wrapper uses `data-testid="metric-card-mobile"` to keep the "3 cards" desktop test exact. Text assertions switched to `getAllByText(...).length > 0` since each value now renders in both variants. +1 new test.
- **Task 7 — Delete `utils/heroTimeline.ts`.** −222 lines. No test file existed; no barrel re-export; grep-zero for `utils/heroTimeline | initHeroTimeline | buildHeroTimeline` confirmed. Dropped a stale "unchanged from utils/heroTimeline.ts port" comment in the factory. Commit `7d8693f`.
- **Task 8 — Verification + push.** Grep-zero sweep clean: no `heroScrollLock`, no old `heroTimeline`, no runtime `fetch(...montreal-metro)`, no typewriter `setInterval` blink (type-sequence `setInterval` intentionally remains — 17e-5 consolidates). `bun run test`: **774/774 pass**. `bun run check`: **0 errors, 19 warnings** (baseline unchanged).

## Bundle-size delta (17e-1 baseline → 17e-4 end)

Per-route SvelteKit node gzipped sizes, from `bun run bundle-size`. Baseline is `feature/slice-17e-1-foundation` pre-Task-7 (commit `e5d9ef5`), per `docs/slices/slice-17e-1-foundation.md`.

| Route | Node | 17e-1 gzip | 17e-4 gzip | Delta |
|---|---|---|---|---|
| **Home `/`** | 4 | 32.39 KB | **34.57 KB** | **+2.18 KB** |
| Blog listing `/blog` | 6 | 0.53 KB | 0.54 KB | +0.01 |
| Blog personal | 7 | 0.53 KB | 0.53 KB | flat |
| Blog detail `/blog/[slug]` | 8 | 14.39 KB | 14.15 KB | −0.24 |
| Projects listing | 10 | 17.17 KB | 17.24 KB | +0.07 |
| Projects detail | 11 | 7.95 KB | 7.61 KB | −0.34 |
| Services listing | 12 | 2.85 KB | 2.85 KB | flat |
| Services detail | 13 | 3.71 KB | 3.59 KB | −0.12 |
| About `/about` | 5 | 8.47 KB | 8.19 KB | −0.28 |
| Contact `/contact` | 9 | 14.67 KB | 14.61 KB | −0.06 |
| Tech stack `/tech-stack` | 14 | 2.08 KB | 2.08 KB | flat |
| Shared layout (node 0) | 0 | 13.18 KB | 13.18 KB | flat |
| Error page (node 1) | 1 | 2.30 KB | 2.30 KB | flat |

**Analysis.** Home grew +2.18 KB gzipped — opposite of the plan's 3–8 KB shrink target. The plan assumed `loadDrawSVG`/`loadCustomEase` migration would let us drop the eager GSAP path, but `registerGsapPlugins()` is still called in HeroBanner for the `ScrollTrigger.config({ ignoreMobileResize: true })` side effect and for other non-migrated plugins (MotionPath, SplitText, MorphSVG, Flip) that other home-page components depend on. Realizing the lazy-plugin savings requires a consumer-wide migration — scope properly belongs to 17e-5/17e-6.

The home route's **code additions** that account for the +2.18 KB: the `createHeroTimeline` factory is ~300 lines of self-contained GSAP composition (the old `utils/heroTimeline.ts` was 222 lines but shared registration + was leaner with no internal reduced-motion / no CustomEase.create / no pin-length branch). `HeroMetrics` now renders two variants (mobile card + desktop grid). `HeroTextContent` has an extra breakpoint-responsive class.

**Where the real 17e-4 wins land is outside this table:**
- MetroNetwork SVG is now in SSR HTML (~15 KB uncompressed inline, roughly 4 KB gzipped of the `/` response body). No runtime `fetch('/images/montreal-metro.svg')` — eliminates a request + defer hop that used to block LCP paint. LCP should fall measurably when the network isn't throttled to hide the old fetch cost. Formal Lighthouse-per-route audit lives in 17e-6.
- Typewriter `setInterval` blink deleted → one fewer JS timer per hero mount.
- Hero mobile layout now fits inside `calc(100svh - 5rem)` on short phones (iPhone SE), resolving the clipped "Let's talk" CTA Yesid caught in iterative review.

## Test-count journey

- Start (17e-3 end): 767 passing.
- Task 3 (+6 `createHeroTimeline` factory tests): 773.
- Task 6 follow-up (+1 `mobile metric card wrapper` test when HeroMetrics gained its mobile single-card variant): 774.
- Net: **+7 tests, 774/774 pass, `bun run check` 0 errors / 19 warnings.**
