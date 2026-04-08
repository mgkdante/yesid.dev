---
title: "GSAP Debugging"
domain: debugging
difficulty: 2
difficulty_label: intermediate
reading_time: 14
tags:
  - learn
  - debugging
  - intermediate
prerequisites:
  - "[[gsap-fundamentals]]"
  - "[[gsap-scrolltrigger]]"
date: 2026-04-08
---

# GSAP Debugging


## The Analogy

Debugging GSAP animations is like debugging a SQL execution plan. When a query runs slowly, you do not stare at the SQL text -- you open the execution plan, find the operator with the highest cost, and work backward. GSAP has the same tool: **ScrollTrigger markers** are like adding `SET STATISTICS IO ON` -- they make the invisible visible. Instead of guessing "when does this animation fire?", markers draw start/end lines directly on the viewport so you can see exactly what GSAP thinks should happen at each scroll position. `GSDevTools` is the full execution plan viewer -- a visual timeline you can scrub, pause, and step through.

## What It Is

GSAP animations are invisible state machines. A `gsap.from()` call sets an element to a starting state (e.g., `opacity: 0, y: 20`) and animates it to the element's natural CSS state. A `ScrollTrigger` watches the scroll position and decides when to start, pause, or reverse that animation. When something goes wrong -- an element stays invisible, an animation fires too early, a scroll-linked effect stutters -- you need to see what GSAP is thinking.

GSAP provides several debugging tools:

1. **ScrollTrigger markers** (`markers: true`) -- adds colored lines to the viewport showing where the trigger starts and ends, and where the scroll position currently falls relative to those boundaries.

2. **`timeline.progress()`** -- returns a number from 0 to 1 showing how far through an animation timeline has progressed. You can log this in the console to verify timing.

3. **`onUpdate` callback** -- a function that fires on every animation frame. You can use `console.log` inside it to see values changing in real time.

4. **`timeline.pause()` / `timeline.resume()`** -- freeze and unfreeze an animation so you can inspect the DOM at a specific point in time.

5. **`GSDevTools`** -- a GSAP premium plugin that adds a visual scrubber bar to the page for any timeline. You can drag the playhead to any point in the animation.

## Why It Matters

Animation bugs are uniquely difficult because they are time-dependent. A static layout bug is visible as soon as you load the page. An animation bug might only appear for 200ms during a scroll, or only on certain viewport sizes, or only when two ScrollTriggers overlap. Without debugging tools, you are reduced to adding random delays and guessing. With markers and timeline inspection, you can diagnose animation issues in seconds. Interviewers testing animation skills will ask how you debug scroll-linked effects -- knowing these tools is the answer.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/reveal.ts` | The `scrollTrigger` config inside `gsap.from()` at line 52 | Every `use:reveal` element gets a ScrollTrigger. Adding `markers: true` here shows reveal boundaries for ALL reveal animations site-wide. |
| `src/lib/motion/utils/gsap.ts` | The `registerGsapPlugins()` function | If you forget to call this first, ScrollTrigger is not registered and markers silently fail. This is the #1 reason markers do not appear. |
| `src/lib/motion/stores/reducedMotion.ts` | The `isPrefersReducedMotion()` function | If reduced motion is enabled, animations skip entirely (return early in reveal.ts line 43). Your "broken animation" might not be broken -- it might be respecting the OS setting. |
| `src/routes/+page.svelte` | The home page with multiple ScrollTrigger instances | Adding markers to ALL ScrollTriggers on this page shows how they overlap and interact with each other. |
| `src/lib/components/WorkListingPage.svelte` | The FLIP animation in `updateFilter()` | FLIP animations are one-shot and fast. Use `timeline.pause()` to freeze mid-transition and inspect the layout state. |

## The Mental Model

```
SCROLLTRIGGER MARKERS
======================

When you add markers: true to a ScrollTrigger config:

    scrollTrigger: {
        trigger: node,
        start: 'top 80%',      // <-- animation starts when element top hits 80% viewport
        end: 'bottom 20%',     // <-- animation ends when element bottom hits 20% viewport
        markers: true           // <-- ADD THIS LINE
    }

Two pairs of colored lines appear on the viewport:

    ┌──────────────────────────────┐
    │                              │
    │                              │
    │   ── scroller-start ──       │  <-- green line: where scroll position triggers start
    │                              │
    │                              │
    │   ── scroller-end ──         │  <-- red line: where scroll position triggers end
    │                              │
    │                              │
    │  ┌─── trigger ───┐           │
    │  │  start ►      │           │  <-- green arrow: trigger element's start point
    │  │               │           │
    │  │  end ►        │           │  <-- red arrow: trigger element's end point
    │  └───────────────┘           │
    │                              │
    └──────────────────────────────┘

Reading the markers:
  - When the GREEN trigger arrow crosses the GREEN scroller line → animation STARTS
  - When the RED trigger arrow crosses the RED scroller line → animation ENDS
  - If the green arrow has not reached the green line → animation has NOT fired yet

SQL equivalent:
  Like SET STATISTICS IO ON — it does not change the query results,
  it just shows you the internal execution decisions.


DEBUGGING DECISION TREE
========================

  Animation not playing?
  │
  ├── Is reduced motion enabled?
  │   └── Check: isPrefersReducedMotion() → returns true
  │       Fix: Disable "Reduce motion" in OS settings for testing
  │
  ├── Is GSAP registered?
  │   └── Check: registerGsapPlugins() called before animation code
  │       Fix: Import from '$lib/motion/utils/gsap.js', not from 'gsap'
  │
  ├── Is the element visible in the DOM?
  │   └── Check: Elements panel → is the element at opacity:0 or display:none?
  │       Fix: If opacity:0, the animation set it. If display:none, CSS is hiding it.
  │
  ├── Is ScrollTrigger firing?
  │   └── Check: Add markers:true → do the green lines overlap?
  │       Fix: Adjust start/end values ('top 80%' vs 'top 50%')
  │
  └── Is the animation running but invisible?
      └── Check: console.log in onUpdate → is progress advancing?
          Fix: Check the from/to values. Maybe y:20 is too small to see.
```

## Worked Example

**Adding markers to debug why a reveal animation is not firing on the home page:**

The `reveal` action in this project creates a ScrollTrigger for every element that uses `use:reveal`. Here is how to temporarily add markers to diagnose a problem.

```typescript
// From: src/lib/motion/actions/reveal.ts (lines 52-63)
// ORIGINAL CODE:
const tween = gsap.from(node, {
    ...fromVars,
    opacity: 0,
    duration,
    delay: delay / 1000,
    ease: 'back.out(1.4)',
    scrollTrigger: {
        trigger: node,
        start: 'top 80%',
        once: true
    }
});

// DEBUGGING VERSION — add markers: true:
const tween = gsap.from(node, {
    ...fromVars,
    opacity: 0,
    duration,
    delay: delay / 1000,
    ease: 'back.out(1.4)',
    scrollTrigger: {
        trigger: node,
        start: 'top 80%',
        once: true,
        markers: true        // <-- ADD THIS
    }
});
```

After adding `markers: true`, reload the page. You will see green and red lines for every `use:reveal` element on the page. Now:

1. **If the green trigger arrow is BELOW the green scroller line** -- the element has not scrolled into view yet. The animation is waiting correctly.
2. **If the green trigger arrow is ABOVE the green scroller line but opacity is still 0** -- the ScrollTrigger fired but the tween is broken. Check the `fromVars` and `ease`.
3. **If no markers appear at all** -- GSAP plugins were not registered. Check that `registerGsapPlugins()` runs before the `gsap.from()` call.

**Using console.log in onUpdate to trace animation progress:**

```typescript
// Temporary debugging — add onUpdate to see progress:
const tween = gsap.from(node, {
    ...fromVars,
    opacity: 0,
    duration,
    delay: delay / 1000,
    ease: 'back.out(1.4)',
    onUpdate: function() {
        console.log('reveal progress:', this.progress(), 'opacity:', node.style.opacity);
    },
    scrollTrigger: {
        trigger: node,
        start: 'top 80%',
        once: true,
        markers: true
    }
});
```

Open the browser Console (F12) and scroll. You will see:
```
reveal progress: 0 opacity: 0
reveal progress: 0.1 opacity: 0.1
reveal progress: 0.3 opacity: 0.3
...
reveal progress: 1 opacity: 1
```

This confirms the animation is running and opacity is advancing. If progress stays at 0, the ScrollTrigger never fired. If progress reaches 1 but the element is still invisible, something else (CSS) is overriding the opacity.

**Remember to remove `markers: true` and `onUpdate` before committing.** These are debugging tools only.

## Common Mistakes

1. **Leaving `markers: true` in production code**
   - **What happens:** Colored lines appear on the live site for every ScrollTrigger. Users see ugly debug lines over the content.
   - **Fix:** Always remove `markers: true` before committing. Search the codebase for `markers:` before every commit.
   - **Why:** Markers are for development only. They add DOM elements that interfere with layout and are not styled for production.

2. **Debugging with reduced motion enabled and not realizing it**
   - **What happens:** You add markers, reload the page, and see nothing. No markers, no animation, no errors. You spend 30 minutes debugging GSAP code that is actually working correctly.
   - **Fix:** Check `isPrefersReducedMotion()` first. In `src/lib/motion/actions/reveal.ts`, the function returns early at line 43 when reduced motion is on -- no GSAP code runs at all, so no markers appear.
   - **Why:** The reveal action checks `isPrefersReducedMotion()` before calling `registerGsapPlugins()` or creating any tween. If reduced motion is true, the function sets `opacity: 1` and returns immediately.

3. **Importing `gsap` from 'gsap' instead of from '$lib/motion/utils/gsap.js'**
   - **What happens:** Your animation code uses a different GSAP instance than the rest of the project. Plugins are not registered on your instance. ScrollTrigger does not work. No error message -- it just silently fails.
   - **Fix:** Always import from `$lib/motion/utils/gsap.js`. This file registers all plugins once and re-exports them. Every consumer shares the same registered state.
   - **Why:** GSAP uses a global plugin registry. If you import from a different entry point, you get a separate instance without the registered plugins.

## Break It to Learn It

### Exercise 1: Add ScrollTrigger markers

1. Open `src/lib/motion/actions/reveal.ts`
2. Inside the `scrollTrigger` config object (line 59), add `markers: true` after `once: true`
3. **Predict:** How many pairs of marker lines will appear on the home page?
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/`, and scroll slowly. Count the marker pairs. Each `use:reveal` element gets its own pair.
5. **What you learned:** ScrollTrigger markers make the invisible trigger boundaries visible -- like adding `SET SHOWPLAN_TEXT ON` to see query execution boundaries
6. **Undo your change** (remove `markers: true`)

### Exercise 2: Pause an animation mid-flight

1. Open `http://localhost:5173/` with the browser Console open (F12)
2. Type into the Console: `gsap.globalTimeline.pause()`
3. **Predict:** Will in-progress animations freeze, or will they complete?
4. **Verify:** Scroll to trigger some animations, then run the command. All GSAP animations should freeze at their current state. Run `gsap.globalTimeline.resume()` to unfreeze.
5. **What you learned:** `gsap.globalTimeline` controls all GSAP animations on the page. Pausing it freezes everything, letting you inspect the DOM at any animation frame -- like hitting a breakpoint in a debugger.
6. **No undo needed** -- refreshing the page resets everything.

### Exercise 3: Simulate reduced motion

1. Open Chrome DevTools (F12) > press Ctrl+Shift+P to open the Command Palette
2. Type "reduced motion" and select "Emulate CSS prefers-reduced-motion: reduce"
3. **Predict:** What will happen to the home page animations when you reload?
4. **Verify:** Reload `http://localhost:5173/`. All reveal animations should be skipped -- elements appear immediately at full opacity. The gradient separator line should stop flowing.
5. **What you learned:** This project respects `prefers-reduced-motion` at two levels: GSAP animations check `isPrefersReducedMotion()` in `src/lib/motion/stores/reducedMotion.ts`, and CSS animations use `@media (prefers-reduced-motion: reduce)` in `src/lib/components/GradientSeparator.svelte`
6. **Undo:** Open Command Palette again and select "Do not emulate CSS prefers-reduced-motion"

## Connections

- **Depends on:** [[gsap-fundamentals]] because you need to understand tweens and timelines before debugging them
- **Depends on:** [[gsap-scrolltrigger]] because markers are a ScrollTrigger-specific feature
- **Depends on:** [[browser-devtools]] because GSAP debugging uses the Console and Elements panels
- **Related:** [[reduced-motion-accessibility]] because reduced motion bypasses GSAP entirely and must be checked first

## Knowledge Check

1. You add `markers: true` but no markers appear on the page. What are the two most likely causes? --> See [Common Mistakes](#common-mistakes)
2. An element stays at `opacity: 0` even though you can see the ScrollTrigger markers are in the right position. What do you check next? --> See [The Mental Model](#the-mental-model)
3. How do you freeze all GSAP animations on a page to inspect the DOM? --> See [Break It to Learn It](#exercise-2-pause-an-animation-mid-flight)
4. Why must you import GSAP from `$lib/motion/utils/gsap.js` instead of from `'gsap'`? --> See [Common Mistakes](#common-mistakes)
5. How do you test what the page looks like with reduced motion enabled? --> See [Break It to Learn It](#exercise-3-simulate-reduced-motion)

## Go Deeper

- [GSAP ScrollTrigger Debugging -- Official Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSDevTools -- GSAP Premium Plugin](https://gsap.com/docs/v3/Plugins/GSDevTools/)
