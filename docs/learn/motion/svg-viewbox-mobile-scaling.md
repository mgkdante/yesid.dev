---
title: "SVG ViewBox Mobile Scaling"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 5
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[svg-animation-drawsvg]]"
date: 2026-04-11
---

# SVG ViewBox Mobile Scaling

## The Analogy

Think of a viewBox as a camera's viewport. The SVG is a large map on a wall, and the viewBox is the rectangle your camera shows. By narrowing the viewBox, you zoom in — the elements look bigger without changing the actual SVG data. On a phone screen, you point the camera at the interesting part of the map.

## What It Is

The `viewBox` attribute on an SVG defines which portion of the SVG coordinate space is visible. It takes four values: `min-x min-y width height`. Combined with `preserveAspectRatio`, it controls how the visible portion scales to fit the container.

Shrinking the viewBox dimensions (e.g., from `0 0 1821 1260` to `972 300 600 600`) makes the visible area smaller, which makes everything inside appear proportionally larger — a 1.5x reduction in viewBox dimensions = 1.5x bigger elements.

## Why It Matters

Mobile screens are narrow. A wide SVG (landscape ratio) scales down dramatically on portrait screens, making details invisible. ViewBox cropping lets you show a larger, focused portion of the SVG on mobile without duplicating the SVG or using CSS transforms that interfere with JavaScript animation libraries.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/svg/MetroNetwork.svelte` | The `isMobile` viewBox override | Shows runtime viewBox switching for responsive SVG |
| `src/lib/components/HeroBanner.svelte` | The GSAP zoom animation | Shows how viewBox interacts with GSAP transforms |
| `static/images/montreal-metro.svg` | The default viewBox (`0 0 1821 1260`) | The full map that gets cropped on mobile |

## The Mental Model

```
Desktop (full viewBox: 0 0 1821 1260):
┌──────────────────────────────────────────┐
│                                    ●     │  ← Berri at 80%
│               Full map visible           │
└──────────────────────────────────────────┘

Mobile (cropped viewBox: 972 300 600 600):
              ┌──────────────┐
              │        ●     │  ← Berri still at 80%
              │  Zoomed in   │
              └──────────────┘
```

The key: Berri-UQAM is at SVG coordinate (1452, 591). To keep it at 80% from left in the cropped view: `viewBoxX = 1452 - 0.8 × 600 = 972`.

## Worked Example

```typescript
// From: src/lib/motion/svg/MetroNetwork.svelte
// After injecting the SVG, detect viewport and crop for mobile:

const isMobile = window.innerWidth < 768;
if (isMobile) {
  // Crop to 600×600 area centered on the network's right side
  // This makes elements ~1.5x bigger (1821/600 ≈ 3x zoom from original,
  // but relative to the previous 900×900 crop it's 900/600 = 1.5x)
  svg.setAttribute('viewBox', '972 300 600 600');
}
```

The formula to keep a focal point at a specific percentage:
`viewBoxX = focalPointX - (desiredPercent × viewBoxWidth)`

## Common Mistakes

1. **Forgetting preserveAspectRatio:** Without it, the SVG stretches to fill the container, distorting everything.
   - **Fix:** Always set `preserveAspectRatio="xMidYMid meet"` for proportional scaling.
   - **Why:** `meet` fits the entire viewBox inside the container; `slice` covers the container and clips.

2. **Cropping the focal point off-screen:** Centering the viewBox on the SVG center pushes off-center elements out of view.
   - **Fix:** Calculate viewBox origin from the focal point's position and desired percentage.
   - **Why:** The viewBox origin determines what's visible, not the SVG's center.

## Connections

- **Depends on:** [[svg-animation-drawsvg]] because the metro animation uses DrawSVGPlugin on the same SVG
- **Related:** [[gsap-matchmedia-responsive]] because both handle responsive animation behavior

## Knowledge Check

1. What does shrinking a viewBox do to the visible elements? → See [What It Is](#what-it-is)
2. How do you keep a specific point at 80% from the left edge after cropping? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [MDN: SVG viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)
- [MDN: preserveAspectRatio](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio)
