---
title: "GSAP Fundamentals"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# GSAP Fundamentals


## The Analogy

GSAP is like a SQL query optimizer for animation. You describe WHAT you want to happen ("move this element 20 pixels up over 0.7 seconds"), and GSAP figures out HOW to make it smooth -- calculating every intermediate frame, handling browser rendering quirks, and ensuring 60fps performance. Just as you write `SELECT` and the database chooses the execution plan, you write `gsap.to()` and GSAP handles the timing math.

## What It Is

GSAP (GreenSock Animation Platform) is a JavaScript animation library. It animates any numeric CSS property -- `opacity`, `x`, `y`, `scale`, `rotation`, `width`, `color` -- by interpolating between values across a specified duration.

The core concept is a **tween**: a single animation from one state to another. There are three types:

- **`gsap.to(target, vars)`** -- animate FROM the current state TO the values you specify. Like `UPDATE table SET opacity = 1` -- you say the destination, the engine gets there.
- **`gsap.from(target, vars)`** -- animate FROM the values you specify TO the current state. The element starts at the specified values and returns to its natural CSS state.
- **`gsap.fromTo(target, fromVars, toVars)`** -- specify both start and end. Full control, like writing both the initial and final state explicitly.

Every tween takes a **duration** (seconds), an **ease** (the acceleration curve), and optional **delay**.

**Ease functions** control the acceleration curve of the animation. `"power2.out"` starts fast and decelerates (like a ball rolling to a stop). `"back.out(1.4)"` overshoots slightly then settles (like a spring). `"linear"` means constant speed (rarely what you want -- looks robotic).

**Plugins** extend GSAP with specialized capabilities. This project uses ScrollTrigger (viewport-linked animations), DrawSVGPlugin (SVG path drawing), MorphSVGPlugin (shape morphing), Flip (layout transitions), SplitText (character-level text animation), and MotionPathPlugin. All plugins must be registered once before use via `registerGsapPlugins()`.

## Why It Matters

Every modern web portfolio, product page, and SaaS marketing site uses scroll-linked motion. Understanding GSAP is the difference between a static page and one that feels alive. In interviews, "How would you animate a filter transition?" or "How do you handle scroll-based reveals?" are common. GSAP is the industry standard -- used by Apple, Nike, Google, and most agencies.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | `registerGsapPlugins()` and re-exports | Central registration point -- every file imports GSAP from here, not from `'gsap'` directly |
| `src/lib/motion/actions/reveal.ts` | `gsap.from(node, { ... })` on line 52 | Shows a `gsap.from()` tween with ScrollTrigger, ease, and duration |
| `src/lib/components/BlogSvgIcon.svelte` | `gsap.set()`, `gsap.to()`, `gsap.timeline()` | Uses all three tween types plus timelines for SVG entrance animations |
| `src/lib/components/HeroBanner.svelte` | `gsap.timeline()` with position parameter | Complex multi-phase timeline driving the hero scroll experience |
| `src/lib/components/DataFlowDiagram.svelte` | `gsap.set()` initial states, staggered `gsap.to()` | Node-by-node pipeline entrance with DrawSVG |

## The Mental Model

```
What you write:                    What GSAP does (60x per second):
                                   
gsap.to(box, {                     Frame 1:  opacity: 0.00, y: 20.0
  opacity: 1,                      Frame 2:  opacity: 0.03, y: 19.4
  y: 0,                            Frame 3:  opacity: 0.08, y: 18.2
  duration: 0.7,         ──────►   Frame 4:  opacity: 0.15, y: 16.6
  ease: 'power2.out'               ...
});                                 Frame 40: opacity: 0.97, y: 0.5
                                   Frame 42: opacity: 1.00, y: 0.0

You say "WHERE", GSAP calculates every step to get there.
Like: UPDATE element SET opacity=1, y=0  -- the DB plans the execution.
```

**Plugin registration flow:**

```
1. Import from our central file:  import { gsap, registerGsapPlugins } from '$lib/motion/utils/gsap.js'
2. Call registerGsapPlugins()      (idempotent -- safe to call multiple times)
3. Now use any plugin feature:     gsap.to(el, { drawSVG: '100%' })

WHY centralize? Same reason you use a connection pool, not raw connections.
One registration, many consumers, no double-init bugs.
```

## Worked Example

```typescript
// From: src/lib/motion/actions/reveal.ts
// This action animates an element from "invisible + offset" to "visible + in place"

import { registerGsapPlugins, gsap } from '../utils/gsap.js';

// Step 1: Register all GSAP plugins (idempotent guard inside)
registerGsapPlugins();

// Step 2: Build the "from" values -- where the element STARTS
const fromVars = { y: 20 }; // 20px below its natural position

// Step 3: Create the tween
const tween = gsap.from(node, {
  ...fromVars,            // Start 20px down
  opacity: 0,             // Start invisible
  duration: 0.7,          // 700ms total animation time
  delay: 0.2,             // Wait 200ms before starting (converted from ms)
  ease: 'back.out(1.4)',  // Slight overshoot then settle -- feels organic
  scrollTrigger: {        // Plugin config: only fire when element enters viewport
    trigger: node,
    start: 'top 80%',     // Fires when element top crosses 80% of viewport height
    once: true            // Only animate once, don't replay on re-scroll
  }
});
```

The `gsap.from()` call says: "Start this element at `{y: 20, opacity: 0}` and animate it back to its natural CSS state." The `ease: 'back.out(1.4)'` makes it overshoot slightly past 0 then settle -- giving a subtle spring feeling. The `scrollTrigger` config ensures this only happens when the user scrolls the element into view.

## Common Mistakes

1. **Importing GSAP directly from `'gsap'`:** Importing `import { gsap } from 'gsap'` instead of from `$lib/motion/utils/gsap.js`.
   - **What happens:** Plugins are not registered for that instance. `drawSVG`, `morphSVG`, and other plugin properties silently do nothing.
   - **Fix:** Always import from `$lib/motion/utils/gsap.js` which re-exports everything with plugins registered.
   - **Why:** GSAP plugins must be registered on the same `gsap` instance that uses them. Two different imports can create two instances.

2. **Using seconds vs milliseconds:** GSAP uses seconds for `duration` and `delay`, but CSS and `setTimeout` use milliseconds.
   - **What happens:** `gsap.to(el, { opacity: 1, duration: 700 })` creates a 700-second animation (11 minutes).
   - **Fix:** Use seconds: `duration: 0.7`. If you have milliseconds, divide by 1000: `delay: ms / 1000`.
   - **Why:** GSAP chose seconds because most animations are under 2 seconds, so `0.5` is cleaner than `500`.

3. **Forgetting to kill tweens on cleanup:** Creating a tween inside `onMount` or a Svelte action but never calling `tween.kill()` in the destroy callback.
   - **What happens:** If the component unmounts mid-animation, GSAP keeps trying to update a DOM element that no longer exists. Can cause console errors or memory leaks.
   - **Fix:** Store the tween reference and call `tween.kill()` in `destroy()`.
   - **Why:** Same as closing a database cursor -- cleanup prevents resource leaks.

## Break It to Learn It

### Exercise 1: Change the ease
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 57, change `'back.out(1.4)'` to `'linear'`
3. **Predict:** The reveal animation will feel robotic and mechanical instead of springy
4. **Verify:** Run `bun run dev`, scroll to any revealed element, observe the difference
5. **What you learned:** Ease functions are the difference between "moved" and "felt alive"
6. **Undo your change**

### Exercise 2: Double the duration
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 39, change `duration = 0.7` to `duration = 2.0`
3. **Predict:** All reveal animations will take 2 seconds -- elements will float in slowly
4. **Verify:** Run `bun run dev`, scroll through the page, notice how sluggish it feels
5. **What you learned:** Duration directly impacts perceived responsiveness. 0.3-0.8s is the sweet spot for UI animation
6. **Undo your change**

### Exercise 3: Switch from to fromTo
1. Open `src/lib/motion/actions/reveal.ts`
2. Change `gsap.from(node, { ...fromVars, opacity: 0, ... })` to `gsap.fromTo(node, { ...fromVars, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration, delay: delay / 1000, ease: 'back.out(1.4)' })`
3. Remove the `scrollTrigger` from the from-vars and add it to the to-vars object
4. **Predict:** The animation should look identical -- `from()` is shorthand for `fromTo(specified, natural)`
5. **Verify:** Run `bun run dev`, scroll and compare behavior
6. **What you learned:** `gsap.from()` is syntactic sugar -- it infers the "to" state from the element's current CSS
7. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because GSAP targets DOM elements created by Svelte components
- **Enables:** [[gsap-scrolltrigger]] because ScrollTrigger builds on top of GSAP tweens
- **Enables:** [[gsap-timeline-and-stagger]] because timelines sequence multiple tweens
- **Enables:** [[svg-animation-drawsvg]] because DrawSVG is a GSAP plugin
- **Enables:** [[svg-morph-animation]] because MorphSVG is a GSAP plugin
- **Enables:** [[flip-animation]] because Flip is a GSAP plugin
- **Related:** [[reduced-motion-accessibility]] because every GSAP animation should check reduced motion preferences

## Knowledge Check

1. What is the difference between `gsap.to()` and `gsap.from()`? → See [The Mental Model](#the-mental-model)
2. Why do we import GSAP from `$lib/motion/utils/gsap.js` instead of from `'gsap'`? → See [Common Mistakes](#common-mistakes)
3. What units does GSAP use for duration -- seconds or milliseconds? → See [Common Mistakes](#common-mistakes)
4. Why must you call `tween.kill()` when a component unmounts? → See [Common Mistakes](#common-mistakes)
5. What does an ease function control? → See [What It Is](#what-it-is)

## Go Deeper

- [GSAP official documentation](https://gsap.com/docs/v3/)
- [GSAP ease visualizer](https://gsap.com/docs/v3/Eases/)
- [GSAP getting started guide](https://gsap.com/resources/get-started/)
