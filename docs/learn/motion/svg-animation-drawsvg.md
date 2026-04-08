---
title: "SVG Animation (DrawSVG)"
domain: motion
difficulty: 3
difficulty_label: advanced
reading_time: 11
tags:
  - learn
  - motion
  - advanced
prerequisites:
  - "[[gsap-fundamentals]]"
date: 2026-04-08
---

# SVG Animation (DrawSVG)


## The Analogy

DrawSVG is like watching a SQL query execution plan draw itself on a whiteboard. Imagine a DBA tracing the execution path of a complex query: the pen starts at one end of the path, draws each connection between operations, and arrives at the result. DrawSVGPlugin does exactly this with SVG paths -- it reveals or hides the stroke of a path progressively, creating the illusion that a line is being drawn in real time.

## What It Is

**SVG (Scalable Vector Graphics)** is a format for drawing shapes using math -- points, lines, curves -- instead of pixels. Every SVG shape is defined by a `<path>` element with a `d` attribute that describes the shape as a series of move/line/curve commands.

**DrawSVGPlugin** is a GSAP plugin that animates the visible portion of an SVG path's stroke. Under the hood, it manipulates two CSS properties:

- **`stroke-dasharray`**: Defines a pattern of dashes and gaps along the path. By setting the dash length to the total path length, you create one long dash that covers the entire path.
- **`stroke-dashoffset`**: Shifts where the dash pattern starts. By offsetting the dash by the full path length, the visible dash moves off-screen, making the path appear undrawn. Animating the offset from full to zero progressively reveals the stroke.

GSAP wraps this complexity into a simple syntax: `drawSVG: '0%'` (fully hidden) to `drawSVG: '100%'` (fully visible). You can also animate partial ranges: `drawSVG: '20% 80%'` shows only the middle 60% of the path.

This project uses DrawSVG in two patterns:
1. **Draw entrance:** SVG icons draw themselves when scrolled into view (blog post icons, work project icons)
2. **Draw-then-fill:** Strokes draw first, then the fill fades in -- creating a "blueprint becoming real" effect

## Why It Matters

SVG animation is a premium visual technique used on high-end portfolios, product pages, and brand sites. It communicates technical sophistication. In interviews, "How would you animate an SVG logo drawing itself?" is a common creative coding question. Understanding `stroke-dasharray` and `stroke-dashoffset` also demonstrates deep CSS knowledge beyond layout and color.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | `DrawSVGPlugin` import and registration | Plugin must be registered before `drawSVG` property works |
| `src/lib/components/BlogSvgIcon.svelte` | `animateDraw()` and `animateDrawFill()` functions | Two DrawSVG patterns: simple draw and draw-then-fill |
| `src/lib/components/WorkSvgIcon.svelte` | DrawSVG with fill phase | Work project icons use the draw-fill pattern |
| `src/lib/components/DataFlowDiagram.svelte` | DrawSVG on connecting lines between nodes | Pipeline lines draw left-to-right after nodes appear |
| `src/lib/components/HeroBanner.svelte` | `drawSVG: '0%'` to `drawSVG: '100%'` in timeline | Metro network lines draw during the hero scroll sequence |

## The Mental Model

```
SVG path: a mathematical line from point A to point B.

Before animation (drawSVG: '0%'):
  stroke-dasharray: [total length]     ← one dash covers the whole path
  stroke-dashoffset: [total length]    ← but shifted completely off-screen

  Path: ........................        (invisible -- dash is offscreen)


During animation (drawSVG: '50%'):
  stroke-dashoffset: [half length]     ← dash is halfway back on-screen

  Path: ════════════............        (half visible)


After animation (drawSVG: '100%'):
  stroke-dashoffset: 0                 ← dash fully on-screen

  Path: ════════════════════════        (fully drawn)


The trick: it's not "drawing" -- it's revealing a pre-existing dash
by sliding it into position. Like pulling a curtain off a painting.
```

**Draw-then-fill sequence:**

```
Phase 1 (draw):        Phase 2 (fill):
┌───────────────┐      ┌───────────────┐
│  ╱ ─ ─ ╲     │      │  ╱▓▓▓▓▓╲     │
│ │       │    │      │ │▓▓▓▓▓▓▓│    │
│  ╲ ─ ─ ╱     │      │  ╲▓▓▓▓▓╱     │
└───────────────┘      └───────────────┘
  Stroke draws          Fill fades in
  from 0% to 100%       (fillOpacity: 0 → 0.15)
  Duration: 1s          Duration: 0.6s
                        Starts 0.3s before draw ends ('-=0.3')
```

## Worked Example

```typescript
// From: src/lib/components/BlogSvgIcon.svelte (lines 131-140)
// Simple draw animation: strokes draw from invisible to visible.

function animateDraw(paths: SVGElement[], scrollTriggerConfig?, onDone?) {
  // Step 1: Set initial state -- all paths invisible
  gsap.set(paths, { drawSVG: '0%' });

  // Step 2: Create a timeline (optionally scroll-triggered)
  const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });

  // Step 3: Animate all paths to fully drawn
  tl.to(paths, {
    drawSVG: '100%',   // Reveal the full stroke
    duration: 1.2,      // 1.2 seconds per path
    stagger: 0.15,      // Each path starts 0.15s after the previous
    ease: 'power2.inOut' // Smooth acceleration/deceleration
  });
}
```

The `stagger: 0.15` means if an SVG has 4 paths, they draw sequentially: path 0 starts at 0s, path 1 at 0.15s, path 2 at 0.30s, path 3 at 0.45s. This creates the effect of the illustration being "drawn" rather than appearing all at once.

```typescript
// From: src/lib/components/BlogSvgIcon.svelte (lines 154-169)
// Draw-then-fill: two-phase timeline.

function animateDrawFill(paths: SVGElement[], scrollTriggerConfig?, onDone?) {
  // Set initial state: no stroke visible, no fill visible
  gsap.set(paths, { drawSVG: '0%', fillOpacity: 0 });

  const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });

  // Phase 1: Draw strokes
  tl.to(paths, {
    drawSVG: '100%',
    duration: 1,
    stagger: 0.12,
    ease: 'power2.inOut'
  });

  // Phase 2: Fade in fills (overlaps with end of phase 1 by 0.3s)
  tl.to(paths, {
    fillOpacity: 0.15,        // Subtle fill, not solid -- keeps the "blueprint" aesthetic
    duration: 0.6,
    stagger: 0.08,
    ease: 'power1.out'
  }, '-=0.3');                // Start 0.3s before phase 1 ends
}
```

## Common Mistakes

1. **Using DrawSVG on non-path elements:** Trying to animate `drawSVG` on `<rect>`, `<circle>`, or `<text>` elements.
   - **What happens:** DrawSVG only works on `<path>`, `<line>`, `<polyline>`, `<polygon>`, `<circle>`, `<rect>`, and `<ellipse>` elements. Other elements are silently ignored.
   - **Fix:** Ensure SVG elements have strokes. For complex shapes, convert to `<path>` using `MorphSVGPlugin.convertToPath()`.
   - **Why:** DrawSVG manipulates `stroke-dasharray` and `stroke-dashoffset`, which only apply to elements with strokes.

2. **Forgetting to set initial state with `gsap.set()`:** Animating to `drawSVG: '100%'` without first setting `drawSVG: '0%'`.
   - **What happens:** The path is already fully visible when the animation starts, so nothing appears to change.
   - **Fix:** Always call `gsap.set(paths, { drawSVG: '0%' })` before the timeline runs.
   - **Why:** `gsap.to()` animates FROM the current state. If the current state is already `100%`, there is nothing to animate.

3. **Not registering DrawSVGPlugin:** Importing the plugin but forgetting to call `registerGsapPlugins()`.
   - **What happens:** The `drawSVG` property is silently ignored. The SVG appears instantly with no drawing animation.
   - **Fix:** Call `registerGsapPlugins()` before any DrawSVG usage.
   - **Why:** GSAP plugins are opt-in. The core library does not know about `drawSVG` until the plugin is registered.

## Break It to Learn It

### Exercise 1: Animate a partial draw
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `animateDraw()` (line 135), change `drawSVG: '100%'` to `drawSVG: '20% 80%'`
3. **Predict:** Only the middle 60% of each path will be visible -- both ends will remain hidden
4. **Verify:** Run `bun run dev`, scroll to a blog post with a draw-animated SVG icon
5. **What you learned:** DrawSVG supports partial ranges -- useful for "progress bar" or "incomplete" effects
6. **Undo your change**

### Exercise 2: Remove the stagger from draw
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `animateDraw()` (line 137), remove `stagger: 0.15`
3. **Predict:** All paths will draw simultaneously instead of sequentially
4. **Verify:** Run `bun run dev`, scroll to trigger a draw animation, notice all strokes draw at once
5. **What you learned:** Stagger is what creates the "being drawn" illusion -- without it, the effect looks like a reveal, not a drawing
6. **Undo your change**

### Exercise 3: Make fill solid instead of subtle
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `animateDrawFill()` (line 164), change `fillOpacity: 0.15` to `fillOpacity: 1.0`
3. **Predict:** After strokes draw, the fill will be fully opaque -- losing the "blueprint" aesthetic
4. **Verify:** Run `bun run dev`, trigger a draw-fill animation
5. **What you learned:** Subtle fill (0.15 opacity) maintains the hand-drawn quality; full fill makes it look like a regular icon
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-fundamentals]] because DrawSVG is a GSAP plugin using tweens and timelines
- **Related:** [[gsap-timeline-and-stagger]] because draw animations use timelines with stagger for sequential path drawing
- **Related:** [[gsap-scrolltrigger]] because draw animations are typically scroll-triggered
- **Related:** [[svg-morph-animation]] because both are SVG-specific GSAP plugins that operate on paths
- **Related:** [[reduced-motion-accessibility]] because draw animations check reduced motion before running

## Knowledge Check

1. What two CSS properties does DrawSVG manipulate under the hood? → See [What It Is](#what-it-is)
2. Why must you call `gsap.set(paths, { drawSVG: '0%' })` before animating? → See [Common Mistakes](#common-mistakes)
3. What does `drawSVG: '20% 80%'` do? → See [Break It to Learn It](#exercise-1-animate-a-partial-draw)
4. How does the draw-then-fill pattern overlap its two phases? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [DrawSVGPlugin official docs](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/)
- [SVG stroke-dasharray explained (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray)
- [SVG path commands tutorial (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
