---
title: "GSAP ScrollTrigger"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[gsap-fundamentals]]"
date: 2026-04-08
---

# GSAP ScrollTrigger


## The Analogy

ScrollTrigger is like a SQL trigger that fires when a row enters a view. In a database, you might write `CREATE TRIGGER on_insert AFTER INSERT ON orders` -- the trigger fires when data arrives. ScrollTrigger works the same way: you define an animation, and it fires exactly when the element scrolls into the viewport. No manual scroll event listeners, no calculating positions yourself. You declare WHAT triggers and WHEN, the plugin handles the rest.

## What It Is

ScrollTrigger is a GSAP plugin that connects animations to the user's scroll position. Instead of an animation playing immediately on page load, it plays when the user scrolls an element into view.

Key concepts:

- **trigger:** The DOM element that ScrollTrigger watches. When this element enters the viewport region you define, the animation fires.
- **start:** Where in the viewport the trigger must reach before the animation begins. `'top 80%'` means "when the top of the trigger element reaches 80% down from the viewport top." Think of it as a horizontal line across your screen -- when the element crosses it, the animation starts.
- **end:** Where the trigger must reach for the animation to complete. Only used when scrubbing.
- **once:** If `true`, the animation plays once and the ScrollTrigger is destroyed. No replay on re-scroll. This is the most common pattern for entrance animations.
- **scrub:** Links animation progress directly to scroll position. `scrub: true` means "as I scroll forward, the animation advances; as I scroll back, it reverses." The scroll bar becomes the animation's playhead.
- **onUpdate:** A callback that fires on every scroll frame. Receives the ScrollTrigger instance, including `self.progress` (a 0-to-1 value representing how far through the trigger zone you've scrolled).
- **pin:** Sticks the trigger element in place while the user scrolls past it. Used for horizontal scroll sections.

## Why It Matters

Scroll-triggered animation is the defining pattern of modern web design. Every portfolio, product page, and marketing site uses it. "How do you animate elements on scroll?" is a common interview question. Understanding ScrollTrigger means understanding how viewport intersection drives UI state -- a concept that applies to lazy loading, infinite scroll, analytics tracking, and more.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/reveal.ts` | `scrollTrigger: { trigger: node, start: 'top 80%', once: true }` on line 58 | The simplest ScrollTrigger pattern: fire-once entrance animation |
| `src/lib/components/BlogSvgIcon.svelte` | ScrollTrigger config passed to `animateDraw()` | Scroll-triggered SVG drawing with `once: true` |
| `src/lib/components/HeroBanner.svelte` | `ScrollTrigger.create()` with `scrub: true` | The hero timeline is scrub-linked to scroll position |
| `src/lib/components/SkillsJourney.svelte` | `ScrollTrigger` with `pin: true` and `containerAnimation` | Horizontal pinned scroll section with nested triggers |
| `src/lib/components/ServiceStation.svelte` | `ScrollTrigger` for Lottie scrubbing | Drives Lottie animation frame from scroll position |

## The Mental Model

```
Viewport (what the user sees):
┌─────────────────────────┐
│                         │  ← top: 0%
│                         │
│                         │
│                         │
│                         │
│                         │
│  - - - - - - - - - - -  │  ← start: 'top 80%'  (trigger line)
│                         │
│                         │
└─────────────────────────┘  ← bottom: 100%

As user scrolls DOWN, elements rise UP through the viewport.
When an element's TOP edge crosses the trigger line at 80%:

  once: true     → Animation plays once. Done forever.
                   Like INSERT trigger with a "processed" flag.

  scrub: true    → Animation progress = scroll progress.
                   Like a cursor moving through a result set.
                   Scroll forward = animate forward.
                   Scroll back = animate backward.

  scrub: false   → Animation plays at normal speed when triggered.
  (default)        Like a trigger that fires once per crossing.
```

## Worked Example

```typescript
// From: src/lib/motion/actions/reveal.ts (lines 49-63)
// This is the complete ScrollTrigger usage in the reveal action.

registerGsapPlugins(); // Must be called before using ScrollTrigger

const tween = gsap.from(node, {
  y: 20,             // Start 20px below natural position
  opacity: 0,        // Start invisible
  duration: 0.7,     // 700ms animation
  delay: delay / 1000,
  ease: 'back.out(1.4)',

  // ScrollTrigger config -- this is what makes it scroll-linked:
  scrollTrigger: {
    trigger: node,     // Watch THIS element (the one being animated)
    start: 'top 80%',  // Fire when element's top reaches 80% of viewport
    once: true          // Play once, then destroy the trigger (no replay)
  }
});

// In the destroy callback:
tween.kill(); // Kills both the tween AND its associated ScrollTrigger
```

The `start: 'top 80%'` value means: "when the TOP edge of the trigger element reaches 80% from the top of the viewport." That is roughly 4/5 of the way down the screen. This ensures the element starts animating before it is fully in view -- the user sees it materialize as they scroll, not pop in after it is already visible.

Setting `once: true` is critical for entrance animations. Without it, scrolling back up and then down again would replay the animation, making the page feel like a toy rather than a professional site.

## Common Mistakes

1. **Not calling `registerGsapPlugins()` before using ScrollTrigger:** The plugin is imported but not registered on the GSAP instance.
   - **What happens:** The `scrollTrigger` config object is silently ignored. The animation plays immediately on mount instead of on scroll.
   - **Fix:** Call `registerGsapPlugins()` before any `gsap.to/from/fromTo` that uses `scrollTrigger`.
   - **Why:** GSAP plugins are opt-in. The core library does not know about ScrollTrigger until you register it.

2. **Using `once: true` with `scrub: true`:** These are contradictory. `once` means "play and destroy." `scrub` means "continuously link to scroll position."
   - **What happens:** The animation plays once, the ScrollTrigger is destroyed, and scroll-linking stops working.
   - **Fix:** For scrub animations, omit `once`. For entrance animations, omit `scrub`.
   - **Why:** They solve different problems. Entrance = fire-and-forget. Scrub = continuous control.

3. **Setting `start` too high (e.g., `'top top'`):** The animation fires when the element reaches the very top of the viewport.
   - **What happens:** The element is already fully visible before the animation starts. Users see a static element suddenly animate, which looks broken.
   - **Fix:** Use `'top 80%'` or `'top 85%'` so the animation fires while the element is entering the viewport.
   - **Why:** Animation should create the illusion of content materializing, not moving after it has been seen.

## Break It to Learn It

### Exercise 1: Change the trigger line
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 60, change `start: 'top 80%'` to `start: 'top 20%'`
3. **Predict:** Elements will only start animating when they are near the top of the screen -- most of the element will be visible before it reveals
4. **Verify:** Run `bun run dev`, scroll slowly through the page, notice how late the animations fire
5. **What you learned:** The `start` value controls perceived responsiveness -- too high and content appears to lag
6. **Undo your change**

### Exercise 2: Remove the once flag
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 61, remove `once: true` (or change to `once: false`)
3. **Predict:** Scrolling back up and down will replay every reveal animation every time
4. **Verify:** Run `bun run dev`, scroll down past some elements, scroll back up, then scroll down again
5. **What you learned:** `once: true` is what makes entrance animations feel permanent rather than repeatable
6. **Undo your change**

### Exercise 3: Observe ScrollTrigger markers
1. Open `src/lib/motion/actions/reveal.ts`
2. Add `markers: true` to the scrollTrigger config: `scrollTrigger: { trigger: node, start: 'top 80%', once: true, markers: true }`
3. **Predict:** Green and red lines will appear on the page showing exactly where each trigger starts and ends
4. **Verify:** Run `bun run dev`, look for colored lines on the right side of the viewport
5. **What you learned:** `markers: true` is the debugging tool for ScrollTrigger -- it makes the invisible trigger zones visible
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-fundamentals]] because ScrollTrigger modifies how GSAP tweens start and progress
- **Enables:** [[entrance-animations]] because reveal uses ScrollTrigger with `once: true`
- **Enables:** [[scroll-linked-video]] because scrub mode links media playback to scroll
- **Related:** [[reduced-motion-accessibility]] because scroll-triggered animations must be skipped when reduced motion is on
- **Related:** [[gsap-timeline-and-stagger]] because timelines can use ScrollTrigger to control entire sequences

## Knowledge Check

1. What does `start: 'top 80%'` mean in human terms? → See [Worked Example](#worked-example)
2. What is the difference between `once: true` and `scrub: true`? → See [The Mental Model](#the-mental-model)
3. Why should you not set `start: 'top top'` for entrance animations? → See [Common Mistakes](#common-mistakes)
4. How do you debug where a ScrollTrigger fires? → See [Break It to Learn It](#exercise-3-observe-scrolltrigger-markers)

## Go Deeper

- [ScrollTrigger official docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [ScrollTrigger demos collection](https://gsap.com/scroll/)
- [Understanding start/end strings](https://gsap.com/docs/v3/Plugins/ScrollTrigger/#:~:text=start)
