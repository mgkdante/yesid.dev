---
title: "SVG Morph Animation"
domain: motion
difficulty: 3
difficulty_label: advanced
reading_time: 10
tags:
  - learn
  - motion
  - advanced
prerequisites:
  - "[[gsap-fundamentals]]"
date: 2026-04-08
---

# SVG Morph Animation


## The Analogy

MorphSVGPlugin is like a SQL PIVOT transforming rows into columns -- one data shape transforms smoothly into a completely different data shape. Imagine a table of monthly sales pivoting into a crosstab: same underlying data, radically different structure, with each cell sliding into its new position. MorphSVG does the same with SVG paths: an illustration of a database icon smoothly transforms into a triangle, circle, or hexagon. Every point on the original path finds a corresponding point on the target and interpolates between them.

## What It Is

**MorphSVGPlugin** is a GSAP plugin that morphs one SVG `<path>` shape into another by interpolating between their path data (`d` attribute). It handles the complex math of matching points between shapes with different numbers of vertices, curves vs lines, and open vs closed paths.

Key concepts:

- **Path-to-path morphing:** The plugin takes a source path element and a target path string, then creates intermediate frames that smoothly transition between them. `gsap.to(pathEl, { morphSVG: targetPathString })` is all you need.
- **`convertToPath()`:** A utility that converts `<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, and `<polyline>` elements into `<path>` elements in-place. Required because MorphSVG only works on `<path>` elements.
- **Point matching:** The plugin automatically distributes points along both shapes so they have the same count. Without this, a 3-point triangle morphing into a 20-point star would collapse instead of expanding.

In this project, morph is used for:
1. **Hover morph on blog icons:** Each blog post has an SVG illustration. On hover, all paths morph into a random geometric shape (triangle, circle, square, hexagon). On mouse leave, they morph back to the original illustration.
2. **Tap toggle on mobile:** Since mobile has no hover, a tap toggles between the original and a morphed shape.
3. **Entrance morph on work icons:** Work project SVG icons morph into view during entrance animations.

## Why It Matters

Shape morphing is one of the most visually impressive web animation techniques. It appears in brand animations, loading states, and interactive illustrations. In creative coding interviews, "How would you morph between two SVG shapes?" tests understanding of SVG path data, animation interpolation, and plugin architecture. It is also a premium skill that separates generic frontend work from creative frontend work.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | `MorphSVGPlugin` import and registration | Plugin must be registered before `morphSVG` property works |
| `src/lib/components/BlogSvgIcon.svelte` | `handleMouseEnter()` morph to random shape, `handleMouseLeave()` morph back | Complete hover morph cycle with original path preservation |
| `src/lib/components/WorkSvgIcon.svelte` | MorphSVGPlugin usage with work project icons | Similar pattern for work page illustrations |
| `src/lib/components/WorkCard.svelte` | `MorphSVGPlugin.convertToPath()` on SVG content | Converts non-path SVG elements before morphing |
| `src/lib/data/journey-shapes.ts` | Shape target path strings | Data-driven morph targets defined in the data layer |

## The Mental Model

```
Original illustration (BlogSvgIcon):

  ┌──────────────┐          Hover →          ┌──────────────┐
  │  ╱──╲  ╱──╲  │                           │              │
  │ │ DB │─│ DB │ │          morph            │    ╱╲        │
  │  ╲──╱  ╲──╱  │  ────────────────►        │   ╱  ╲       │
  │    │    │     │    0.4s per path           │  ╱    ╲      │
  │   ═══════    │    stagger: 0.03           │ ╱──────╲     │
  └──────────────┘                           └──────────────┘
  
  Original paths               Random shape: triangle
  (stored in originalPaths[])   (from SHAPES constant)


Mouse leave →

  ┌──────────────┐          Each path morphs back to its
  │  ╱──╲  ╱──╲  │          original d attribute stored
  │ │ DB │─│ DB │ │          in originalPaths[i].
  │  ╲──╱  ╲──╱  │          Same 0.4s, same stagger.
  │    │    │     │
  │   ═══════    │
  └──────────────┘


WHY store originals?
  MorphSVG changes the path's d attribute in-place.
  Without storing the original, you cannot morph back.
  Like saving a backup before running UPDATE.
```

## Worked Example

```typescript
// From: src/lib/components/BlogSvgIcon.svelte (lines 29-36, 57-70, 104-118)
// Complete hover morph cycle.

// Step 1: Define geometric target shapes (centered in 48x48 viewBox)
const SHAPES = {
  triangle: 'M24 8 L40 38 L8 38 Z',
  circle:   'M24 8 A16 16 0 1 1 23.99 8 Z',
  square:   'M10 10 L38 10 L38 38 L10 38 Z',
  hexagon:  'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z'
};

// Step 2: On mount, store original paths (backup before modification)
// originalPaths[i] = svgPaths[i].getAttribute('d')
let originalPaths: string[] = [];
let svgPaths: SVGPathElement[] = [];

// Step 3: On hover, morph all paths to a random shape
function handleMouseEnter() {
  if (isPrefersReducedMotion() || !entranceDone) return;

  const shape = pickRandomShape(); // Never same shape twice in a row

  gsap.to(svgPaths, {
    morphSVG: SHAPES[shape],    // Target: one of the 4 geometric shapes
    duration: 0.4,               // 400ms morph
    stagger: 0.03,               // Slight stagger between paths
    ease: 'power2.inOut',        // Smooth acceleration
    overwrite: true              // Cancel any in-progress morph
  });
}

// Step 4: On mouse leave, morph back to originals
function handleMouseLeave() {
  if (isPrefersReducedMotion() || !entranceDone) return;

  svgPaths.forEach((path, i) => {
    gsap.to(path, {
      morphSVG: originalPaths[i],  // Restore from backup
      duration: 0.4,
      delay: i * 0.03,             // Manual stagger (per-element)
      ease: 'power2.inOut',
      overwrite: true
    });
  });
}
```

The key insight is the `originalPaths` array. When the component mounts, it reads each path's `d` attribute and stores it. This is the "backup before UPDATE" pattern. Without it, morphing to a triangle would permanently lose the original illustration data -- you could never morph back.

The `overwrite: true` parameter is critical for rapid hover/unhover: if the user hovers in and out quickly, the new morph cancels the in-progress one instead of queueing. Without it, rapid hover/unhover creates a chain of conflicting animations.

## Common Mistakes

1. **Morphing non-path elements:** Trying `gsap.to(rect, { morphSVG: targetPath })` on a `<rect>` or `<circle>`.
   - **What happens:** MorphSVG silently does nothing -- the shape stays static.
   - **Fix:** Call `MorphSVGPlugin.convertToPath(containerElement)` first to convert all basic shapes to `<path>` elements.
   - **Why:** MorphSVG interpolates between `d` attribute strings. Only `<path>` elements have a `d` attribute.

2. **Not storing original paths before morphing:** Morphing to a target without first saving the original `d` values.
   - **What happens:** After the first morph, the path's `d` attribute is the intermediate or target value. You cannot morph "back" because the original data is lost.
   - **Fix:** On mount, iterate through all paths and store `path.getAttribute('d')` in an array.
   - **Why:** Like running `UPDATE` without a `WHERE` snapshot -- you lose the original state.

3. **Not using `overwrite: true` on interactive morphs:** Allowing multiple morphs to queue up during rapid hover/unhover.
   - **What happens:** The shape glitches through multiple intermediate states as queued morphs fight each other.
   - **Fix:** Add `overwrite: true` to kill any in-progress morph before starting a new one.
   - **Why:** Only the latest user intent matters. Previous morphs should be cancelled, not completed.

## Break It to Learn It

### Exercise 1: Add a new morph target shape
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In the `SHAPES` constant (around line 31), add a star: `star: 'M24 4 L29 18 L44 18 L32 27 L36 42 L24 33 L12 42 L16 27 L4 18 L19 18 Z'`
3. **Predict:** Blog icon hovers will now occasionally morph into a 5-pointed star
4. **Verify:** Run `bun run dev`, hover over blog post icons multiple times until you see the star
5. **What you learned:** Morph targets are just path strings -- adding shapes is a data change, not a code change
6. **Undo your change**

### Exercise 2: Remove overwrite
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `handleMouseEnter()` (around line 68), remove `overwrite: true`
3. **Predict:** Rapidly hovering in and out will cause the SVG to glitch as multiple morphs compete
4. **Verify:** Run `bun run dev`, rapidly hover in and out of a blog SVG icon multiple times
5. **What you learned:** `overwrite: true` is essential for user-driven interactive animations
6. **Undo your change**

### Exercise 3: Slow down the morph
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `handleMouseEnter()`, change `duration: 0.4` to `duration: 2.0`
3. **Predict:** The morph will take 2 seconds -- you can watch each path slowly reshape
4. **Verify:** Run `bun run dev`, hover over a blog SVG icon and watch the slow transformation
5. **What you learned:** Slowing animations down is the best way to understand what is happening at each frame
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-fundamentals]] because MorphSVG is a GSAP plugin that uses `gsap.to()`
- **Related:** [[svg-animation-drawsvg]] because both are SVG-specific GSAP plugins, often used together (draw first, then enable morph on hover)
- **Related:** [[gsap-timeline-and-stagger]] because morph animations use stagger to offset multiple paths
- **Related:** [[reduced-motion-accessibility]] because morph animations check reduced motion before running

## Knowledge Check

1. Why must you store original path data before morphing? → See [Common Mistakes](#common-mistakes)
2. What does `convertToPath()` do and when do you need it? → See [What It Is](#what-it-is)
3. Why is `overwrite: true` important for hover-triggered morphs? → See [Common Mistakes](#common-mistakes)
4. What SVG attribute does MorphSVG interpolate? → See [What It Is](#what-it-is)

## Go Deeper

- [MorphSVGPlugin official docs](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/)
- [SVG path data specification (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d)
- [GSAP morph demos](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/#demos)
