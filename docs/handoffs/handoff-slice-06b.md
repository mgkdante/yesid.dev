# Handoff: Slice 06b — Home Page Redesign

## Summary
Redesigned the home page to replace the Threlte 3D background with a CSS gradient, moved the train rail to the right edge (vertical), restyled station sections as transit station-sign cards with 400x400 scroll-linked Lotties, and added interactive polish (card tilt, velocity glow, indicator lights, train click easter egg). All existing tests pass; 12 new tests added (219 total).

## What Was Built
- `src/lib/motion/actions/tilt.ts`: New Svelte action for cursor-following card tilt (perspective + rotateX/rotateY). Respects reduced motion and touch devices.
- `src/lib/motion/actions/tilt.test.ts`: 7 tests for tilt action behavior.

## Files Modified
- `src/lib/motion/actions/index.ts`: Added `tilt` export to barrel.
- `src/lib/motion/components/LottiePlayer.svelte`: Added `scrub` and `progress` props for scroll-linked frame control. When `scrub=true`, Lottie frame is driven by `progress * totalFrames` via `goToAndStop()`. Existing non-scrub behavior unchanged.
- `src/tests/setup.ts`: Added `totalFrames: 60` to lottie-web mock.
- `src/lib/motion/svg/train-path.ts`: Rewrote path generation from horizontal (left-to-right) to vertical (top-to-bottom). Path runs along right edge at `width - 28px`. Station waypoints have zero wobble for clean rail alignment.
- `src/lib/motion/svg/train-path.test.ts`: Updated assertions for vertical orientation (Y-axis start/end checks, X near right edge).
- `src/lib/motion/svg/TrainJourney.svelte`: Train now oriented nose-down via inner CSS `rotate(90deg)` wrapper. Added `velocity` prop for glow modulation via `--train-glow` CSS property and `drop-shadow` filter. Added click easter egg (bounce animation).
- `src/routes/+page.svelte`: Major layout rewrite. Removed Threlte 3D scene import. Universal CSS gradient background with scroll-reactive warm glow. Right-rail visual overlay (crossties, station nodes, dashed connectors) rendered inline. `use:magnetic` on CTA buttons. Right gutter (`md:pr-20`) for rail clearance.
- `src/lib/components/ServiceStation.svelte`: Restyled as transit station-sign card. Added: station number (`01`, `02`...), indicator light (IntersectionObserver-driven), 400x400 scroll-linked Lottie, `use:tilt` on card, `use:reveal` for entrance. Per-station ScrollTrigger for Lottie scrub progress.
- `src/lib/components/ServiceStation.test.ts`: Added 4 tests: station number rendering, indicator light presence, Lottie scrub container.

## How It Works

**Layout layers (back to front):**
1. Fixed CSS gradient (#141414 dark, warmer with scroll via orange radial overlay)
2. Fixed right-rail overlay (desktop only): vertical rail line with CSS crossties pattern, station node circles (glow orange when active), dashed connector lines
3. Fixed SVG train (desktop only): TrainJourney moves Train.svelte along vertical GSAP MotionPathPlugin path
4. Scrollable HTML content: hero, station-sign cards, CTA section

**Station sign cards:**
Each `ServiceStation` is self-contained. It creates its own GSAP ScrollTrigger (start: section enters viewport, end: section exits) and drives `lottieProgress` (0-1). The LottiePlayer receives `scrub=true progress={lottieProgress}` and calls `goToAndStop(frame)` to seek. An IntersectionObserver with `-30% 0px` rootMargin toggles the indicator light. Station number is `String(index + 1).padStart(2, '0')`.

**Train behavior:**
The train path is vertical (`getTrainMotionPath` generates top-to-bottom SVG path). The Train SVG is rotated 90° via CSS on an inner wrapper. Scroll velocity from `ScrollTrigger.getVelocity()` is normalized to 0-1 and passed as `velocity` prop to TrainJourney, which sets `--train-glow` CSS property. A `drop-shadow` filter on the wrapper uses this for dynamic glow intensity. Clicking the train triggers a GSAP bounce animation.

**What stays unchanged:**
- `ScrollRail.svelte` and its tests (independent sidebar)
- `Train.svelte` and its 8 tests (pure SVG markup, unmodified)
- `TrainJourney.test.ts` (4 tests check structure, not CSS)
- `home.test.ts` (9 tests check testids/text, not layout)
- All files in `src/lib/motion/three/` (kept for future use, tree-shaken from home page)

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| CSS rotate(90deg) on inner wrapper for train orientation | Preserves all Train.svelte markup and GSAP target selectors. Zero risk of breaking existing tests | Modify Train.svelte SVG to be vertical (would break 8 tests, require updating viewBox and all coordinates) |
| Per-station ScrollTrigger in ServiceStation | Keeps stations self-contained. Adding a 5th service just works | Centralized triggers in +page.svelte (more wiring, less encapsulated) |
| Rail overlay in +page.svelte, not ScrollRail | ScrollRail is independent per spec. The new rail visual is home-page-specific | Enhance ScrollRail home mode (tighter coupling, harder to maintain two very different modes) |
| LottiePlayer scrub props with defaults | Zero breaking changes to existing usage. scrub=false preserves all original behavior | New ScrubLottiePlayer component (code duplication, parallel maintenance) |
| IntersectionObserver for indicator light | Native API, no GSAP dependency for a simple visibility check. rootMargin `-30%` targets center zone | GSAP ScrollTrigger (overkill for a boolean toggle) |

## What Yesid Should Know
**Scroll-linked Lottie**: The animation frame is tied to your scroll position — like a seek bar on a video player. `progress=0` shows frame 0, `progress=1` shows the last frame. Scrolling back reverses it. This is powered by `LottiePlayer.svelte`'s new `scrub` mode.

**CSS perspective transforms**: The `use:tilt` action creates a 3D space with `perspective(800px)` and tilts the card with `rotateX`/`rotateY`. The math is the same as computing distance from a center point — cursor offset → rotation angle.

**Velocity glow**: `ScrollTrigger.getVelocity()` returns pixels/second. Divided by 3000 and clamped to 0-1, this drives the train's nose glow via a CSS custom property. Fast scrolling = bright glow.

## What Comes Next
- Slice 07: Work pages (index + FLIP filter + detail)
- Slice 08: About + Contact pages

## How to Verify
1. `bun run test` — 219 tests pass
2. `bun run check` — 0 errors
3. `bun run dev` → `http://localhost:5173/`
4. Desktop: dark gradient, vertical rail on right with crossties, train nose-down
5. Scroll: train moves down, station nodes glow, Lotties scrub forward/backward, indicator lights toggle
6. Hover station cards: subtle tilt follows cursor
7. Click train: bounce animation
8. Scroll fast: train glow intensifies
9. Mobile (<768px): no rail/train, cards stack, Lotties visible
10. `prefers-reduced-motion`: static, Lotties at frame 0
