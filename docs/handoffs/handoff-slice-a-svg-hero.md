# Handoff: Slice A — SVG Metro Network Hero Animation

## Summary
A scroll-driven SVG metro network animation replaces the hero section. Yesid's hand-built Montreal metro map SVG draws line-by-line from the Berri-UQAM origin node, then zooms into that node until the screen fills orange — handing off to Slice C.

## What Was Built
- `src/lib/data/metro-network.ts`: Data layer with node/connection types and ORIGIN_NODE_ID constant
- `src/lib/data/metro-network.test.ts`: Data integrity tests
- `src/lib/data/content.ts`: Added `heroAnimContent` with `scrollDown` LocalizedString
- `src/lib/motion/svg/MetroNetwork.svelte`: Loads montreal-metro.svg inline, classifies elements for GSAP
- `src/lib/motion/svg/MetroNetwork.test.ts`: Container render test
- `static/images/montreal-metro.svg`: Yesid's hand-built Montreal metro map SVG

## Files Modified
- `src/lib/components/HeroBanner.svelte`: Complete rewrite — scroll-pinned GSAP timeline with 6 phases
- `src/lib/motion/utils/gsap.ts`: Added DrawSVGPlugin + CustomEase
- `src/lib/motion/utils/gsap.test.ts`: Tests for new plugins
- `src/tests/setup.ts`: Added mocks for DrawSVGPlugin, CustomEase, timeline.set()
- `src/routes/+page.svelte`: Removed scrollProgress prop and video preload
- `src/routes/home.test.ts`: Updated for new hero structure
- `src/lib/data/index.ts`: Export heroAnimContent

## How It Works
1. **Page load**: Berri-UQAM dot + "SCROLL DOWN" text visible immediately
2. **Scroll 0-15%**: Dot pulses (light on/off opacity flicker, 3 beats)
3. **Scroll 17-45%**: "SCROLL DOWN" fades out, metro lines draw via DrawSVGPlugin
4. **Scroll 47-58%**: Station nodes fade in after lines complete
5. **Scroll 58-65%**: Zone labels appear
6. **Scroll 65-95%**: Zoom into Berri-UQAM — dynamic scale calculated from screen/node ratio, transform-origin recalculated on resize via getBoundingClientRect
7. **Scroll 95-100%**: Screen fully orange from the node itself (no overlay)
8. **Unpin**: Rest of page scrolls normally

**Key technical details:**
- SVG loaded via fetch + innerHTML injection for DOM access
- GSAP DrawSVGPlugin animates stroke-based paths
- Zoom scale = `ceil((screenSize / nodeSize) * 2)` — recalculated on resize
- Transform-origin uses actual rendered pixel position via getBoundingClientRect
- 800% scroll distance (pinned for 8 viewport heights)
- Reduced motion: static network at 20% opacity, no animation

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Use Yesid's SVG directly | He designed it in Figma with the exact look he wanted | Data-driven generated SVG (rejected — looked too sparse) |
| Fetch SVG inline | Need DOM access for GSAP targeting | Embed in component (too large), img tag (no DOM access) |
| Dynamic zoom scale | Must fill screen on any device | Fixed scale (breaks on mobile/desktop mismatch) |
| getBoundingClientRect for origin | Accounts for preserveAspectRatio letterboxing | viewBox math (doesn't account for CSS layout) |
| No orange overlay | Orange must come from the SVG node itself | Overlay div (felt disconnected) |
| 800% scroll distance | Cinematic, lets each phase breathe | 200% (too fast), 400% (still rushed) |

## Files Deleted
- `src/lib/components/HeroVideoCard.svelte`
- `src/lib/components/HeroVideoCard.test.ts`
- `static/video/hero-train.mp4`
- `static/video/hero-train.webm`
- `static/video/hero-train-poster.webp`

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Network looks terrible, nodes too big/empty, no zoom | Rebuilt with 45+ nodes, tiny filled dots, fixed zoom | metro-network.ts, MetroNetwork.svelte, HeroBanner.svelte |
| 2 | Use my custom SVG instead | Switched to Yesid's montreal_map.svg loaded inline | MetroNetwork.svelte, HeroBanner.svelte, static/ |
| 3 | Center it, make it bigger | Adjusted container sizing and viewBox | HeroBanner.svelte, MetroNetwork.svelte |
| 4 | Updated SVG file, center properly | Copied new SVG, removed viewBox override | montreal-metro.svg, MetroNetwork.svelte |
| 5 | Add dot pulse before network | Added 3-beat opacity pulse | HeroBanner.svelte |
| 6 | Add "SCROLL DOWN" that pulses | Added data-driven scroll prompt | HeroBanner.svelte, content.ts |
| 7 | Pulse should be light on/off not scale | Changed to opacity-only pulse | HeroBanner.svelte |
| 8 | Remove yesid text, slow scroll, remove orange overlay | Removed brand text, 800% scroll, no overlay | HeroBanner.svelte |
| 9 | Zoom more on desktop, recalc on resize | Dynamic zoom scale + resize handler | HeroBanner.svelte |
| Final | Approved | — | — |

## What Comes Next
**Slice C — Zoom Transition**: The fully orange screen (end of Slice A) becomes the "." dot in "Data Infra." — then zooms out to reveal the full hero text and page. Slice B (GSAP text effects) deferred to after C.

## How to Verify
1. `bun run test` — 252 tests pass
2. `bun run check` — 0 errors
3. `bun run dev` → scroll through hero on localhost:5173
4. Test on mobile viewport — zoom should fill screen with orange
5. Test resize during animation — zoom should re-target correctly
