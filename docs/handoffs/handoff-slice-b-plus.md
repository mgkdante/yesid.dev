# Handoff: Slice B+ — Geometric Shape Morphs → Icon Morphs

## Summary
Added scroll-linked SVG morph animations to SkillsJourney skill icons using GSAP MorphSVGPlugin. Icons start as simple circles and morph into their final icon shapes as each panel scrolls into view. Also improved the horizontal scroll UX with panel snapping, per-device scroll speed tuning, and panel 1 vertical scroll activation.

## What Was Built
- `src/lib/motion/utils/gsap.ts`: Added MorphSVGPlugin to the GSAP plugin registry
- `src/lib/data/journey-shapes.ts`: Shape path data module (created then deprecated — kept as reference but no longer imported)
- `src/tests/setup.ts`: Added MorphSVGPlugin mock for jsdom tests

## Files Modified
- `src/lib/components/SkillsJourney.svelte`: Icon morph animations, panel 1 vertical scroll triggers, scroll snapping, mobile scroll multiplier, motion `transformOrigin: center center`
- `src/lib/motion/utils/gsap.ts`: Added `MorphSVGPlugin` import and registration
- `src/lib/motion/utils/gsap.test.ts`: Updated plugin registration test to include MorphSVGPlugin + re-export test
- `src/tests/setup.ts`: Added `gsap/MorphSVGPlugin` mock with `convertToPath` stub

## How It Works
1. **Icon morph**: When a panel scrolls into view, `MorphSVGPlugin.convertToPath()` converts each icon's `<rect>`, `<circle>`, `<line>` elements to `<path>` elements. Then `gsap.to(path, { morphSVG: finalD })` morphs from a circle path to the final icon path, scrubbed to scroll.
2. **Panel 1**: Uses standard vertical `ScrollTrigger` (no `containerAnimation`) since it's already visible when the section pins. Triggers fire as the section scrolls into view (`top 35%` → `top -5%`).
3. **Panels 2–4**: Use `containerAnimation: tween` for horizontal scroll-linked triggers.
4. **Text in icons**: `<text>` elements (e.g., "TS" in TypeScript) can't morph — they fade in separately with a slightly delayed trigger.
5. **Hover effects**: Still work after morph because they target the SVG container element, not individual paths.
6. **Snap**: `ScrollTrigger.snap` with equal panel positions gives a natural "land on each panel" feel.
7. **Scroll speed**: Mobile gets 1.8× multiplier (vs 1.4× desktop) for section height, slowing the horizontal travel per swipe.

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Morph icons instead of keyword shapes | Yesid feedback — keyword shapes were too much visual noise | Kept shapes near keywords (rejected) |
| Panel 1 uses vertical scroll triggers | Panel 1 is already on-screen when section pins — horizontal triggers don't fire correctly | containerAnimation with early trigger points (glitchy) |
| `scrub: 1` with snap | Smooth but decisive panel stops | `scrub: 1.5` (felt laggy with snap), hold-zone timeline (felt throttled) |
| Mobile 1.8× scroll multiplier | Touch swipes cover more distance per gesture | Same multiplier for all devices (too fast on mobile) |
| `transformOrigin: center center` for "motion" | Word should spin in place, not orbit from left edge | Default left-bottom origin (looked wrong) |

## What Yesid Should Know
- **MorphSVGPlugin** is now free with GSAP and converts between any two SVG `<path>` shapes. It needs `<path>` elements specifically — `convertToPath()` handles converting `<rect>`, `<circle>`, etc.
- **ScrollTrigger snap** is the right way to "stick" at panels — not empty timeline tweens. `snapTo` takes an array of progress values (0 to 1).
- **containerAnimation** only works for elements that scroll INTO view horizontally. Panel 1 (already visible) needs regular vertical triggers.

## What Comes Next
Future optimization slice for scroll smoothness (Yesid acknowledged this needs refinement but is satisfied for now). Potential areas:
- Fine-tune snap durations per device
- Add touch velocity detection for more natural mobile scrolling
- Consider `ScrollSmoother` plugin for overall page smoothness

## How to Verify
1. `bun run test` — 272/272 passing
2. `bun run check` — 0 errors
3. Desktop: Scroll to SkillsJourney. Panel 1 icons morph from circles on vertical scroll. Panels 2–4 icons morph on horizontal scroll. Scrolling snaps to each panel.
4. Mobile: Same behavior but scrolling is slower (1.8× multiplier). Snapping prevents swipe-past.
5. Hover any icon after morph — unique hover effect still works.
6. "motion" word rotates from its center, not left edge.

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Keyword shapes too far right at panel edge | Repositioned to anchor right after text | `SkillsJourney.svelte` |
| 2 | "Too much stuff" — ditch keyword shapes, morph icons instead | Removed shape system, added icon morph | `SkillsJourney.svelte`, `gsap.ts` |
| 3 | Panel 1 should animate on scroll down, not horizontal | Changed to vertical scroll triggers | `SkillsJourney.svelte` |
| 4 | Panel 1 animations start too early | Shifted trigger start later (top 35%) | `SkillsJourney.svelte` |
| 5 | Panel 1 and CTA feel throttled with hold zones | Replaced with ScrollTrigger snap | `SkillsJourney.svelte` |
| 6 | "motion" should rotate from word center | Added `transformOrigin: center center` | `SkillsJourney.svelte` |
| 7 | "stop" shape too close to text | Added extra gap (moot — shapes removed) | `SkillsJourney.svelte` |
| 8 | Mobile scrolls too fast | Added 1.8× mobile scroll multiplier | `SkillsJourney.svelte` |
| Final | Approved | — | — |
