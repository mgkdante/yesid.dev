---
title: "Entrance Animations"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[gsap-scrolltrigger]]"
  - "[[svelte-actions]]"
date: 2026-04-08
---

# Entrance Animations


## The Analogy

Entrance animations are like query results that materialize as you scroll through a paginated result set. Instead of all 1000 rows appearing instantly, each page of results loads as you reach it. Content earns its appearance by waiting until the user scrolls to it. The alternative -- everything appearing at page load -- is like dumping an entire table on screen at once: overwhelming, undifferentiated, and wasteful.

## What It Is

An entrance animation is a one-time visual transition that makes an element appear on screen. In this project, the primary entrance animation is `use:reveal` -- a Svelte action that combines GSAP tweening with ScrollTrigger to fade and slide elements into view as the user scrolls.

The core principle, documented in the project's MOTION.md, is **"earned, not free"**: content should appear to materialize through the user's scroll action, not pop in randomly. This means:

- Animations fire on scroll intersection, not on page load
- Each element animates once (`once: true`) -- no replay on re-scroll
- Direction (up, down, left, right) creates a sense of flow
- Delay and stagger create a cascade effect within groups
- Duration stays in the 600-800ms range for a "weighty" feel

The `reveal` action supports four directions:
- **up** (default): Element slides up 20px from below. Most natural for vertically scrolled content.
- **down**: Element slides down 20px from above. Used for headers or elements that "drop in."
- **left/right**: Element slides horizontally 30px. Used for side-by-side layouts.

## Why It Matters

Entrance animations are the most visible motion pattern on any website. They are the first thing a design reviewer notices and the first thing that breaks accessibility if done wrong. In interviews, "How do you handle scroll-based element reveals?" tests knowledge of intersection mechanics, performance, and accessibility. Getting this wrong -- animations that replay, fire too late, or ignore reduced motion -- is a quality signal.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/reveal.ts` | The complete `reveal` action (75 lines) | Central entrance animation for the entire project |
| `src/lib/components/AboutPage.svelte` | Multiple `use:reveal` with different directions and delays | Shows how reveal creates a cascading layout |
| `src/lib/components/BlogFeed.svelte` | `use:reveal` on feed items with staggered delays | Cards materialize sequentially as user scrolls |
| `src/lib/components/ServiceStation.svelte` | `use:reveal` on station sections | Each station earns its appearance through scroll |
| `src/lib/components/ContactPage.svelte` | `use:reveal` on form sections | Even functional elements get entrance treatment |

## The Mental Model

```
User scrolls DOWN:
                                      Viewport
                                   ┌──────────────┐
                                   │              │  ← top
                                   │   visible    │
                                   │   content    │
                                   │              │
                                   │ ─ ─ ─ ─ ─ ─ │  ← start: 'top 80%'
                                   │              │
                                   └──────────────┘  ← bottom


BEFORE trigger:                    AFTER trigger (once):
  ┌──────────────┐                   ┌──────────────┐
  │              │                   │              │
  │              │                   │              │
  │ ─ ─ ─ ─ ─ ─ │ trigger line      │ ─ ─ ─ ─ ─ ─ │ trigger line
  │              │                   │  ┌────────┐  │
  └──────────────┘                   │  │ CARD   │  │  ← opacity:1, y:0
                                     └──┴────────┴──┘
     ┌────────┐   ← opacity:0
     │ CARD   │      y:20px            Animation: 0.7s
     └────────┘      (below)           ease: back.out(1.4)
                                       Direction: 'up'


The 'once: true' flag means this will NEVER replay.
Like a processed flag on an INSERT trigger: fire once, mark done.
```

## Worked Example

```typescript
// From: src/lib/motion/actions/reveal.ts (complete file)

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';
import { registerGsapPlugins, gsap } from '../utils/gsap.js';

export interface RevealParams {
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;      // ms
  duration?: number;    // seconds
}

const OFFSET = 20;     // px for up/down
const OFFSET_X = 30;   // px for left/right

// Helper: maps direction to GSAP "from" values
function getFromVars(direction) {
  switch (direction) {
    case 'up':    return { y: OFFSET };     // Start 20px below
    case 'down':  return { y: -OFFSET };    // Start 20px above
    case 'left':  return { x: -OFFSET_X };  // Start 30px left
    case 'right': return { x: OFFSET_X };   // Start 30px right
  }
}

export function reveal(node: HTMLElement, params: RevealParams = {}) {
  const { direction = 'up', delay = 0, duration = 0.7 } = params;

  // ACCESSIBILITY: When reduced motion is on, show content immediately.
  // Never leave elements invisible -- that's worse than no animation.
  if (isPrefersReducedMotion()) {
    node.style.opacity = '1';
    node.style.transform = '';
    return { update() {}, destroy() {} };
  }

  registerGsapPlugins();

  // gsap.from() = "start at these values, animate TO the element's natural state"
  const tween = gsap.from(node, {
    ...getFromVars(direction),  // Starting position offset
    opacity: 0,                  // Start invisible
    duration,                    // 0.7s default
    delay: delay / 1000,         // Convert ms to GSAP seconds
    ease: 'back.out(1.4)',       // Slight overshoot for spring feel
    scrollTrigger: {
      trigger: node,             // Watch this element
      start: 'top 80%',          // Fire at 80% viewport line
      once: true                 // Never replay
    }
  });

  return {
    update() {},   // Params applied at creation -- no live updates
    destroy() {
      tween.kill(); // Kill tween AND its ScrollTrigger
    }
  };
}
```

The flow is: check accessibility, register plugins, create a `gsap.from()` tween with a ScrollTrigger. The `from()` sets the element to an invisible, offset state, then animates it back to its natural CSS. The `back.out(1.4)` ease makes it overshoot slightly past the final position then settle -- this tiny spring effect is what makes the entrance feel physical rather than mechanical.

## Common Mistakes

1. **Not handling reduced motion in the reveal:** Skipping the `isPrefersReducedMotion()` check and leaving elements at `opacity: 0` when ScrollTrigger never fires.
   - **What happens:** Users with reduced motion enabled see a blank page -- elements stay invisible because the GSAP `from()` sets them to `opacity: 0` and the animation never runs.
   - **Fix:** When reduced motion is on, explicitly set `opacity: 1` and clear any transforms. The `reveal` action does this on lines 43-46.
   - **Why:** Reduced motion means "show content without animation," not "hide content." Accessibility failures are worse than no animation.

2. **Using page-load animations instead of scroll-triggered:** Putting entrance animations in `onMount` without ScrollTrigger.
   - **What happens:** All elements on the page animate simultaneously on load. Below-the-fold elements animate invisibly, wasting resources. Above-the-fold elements all compete for attention.
   - **Fix:** Use ScrollTrigger with `once: true` so each element animates when the user reaches it.
   - **Why:** The "earned, not free" principle: animation tied to scroll creates a sense of discovery. All-at-once animation creates noise.

3. **Making entrance direction inconsistent:** Mixing `direction: 'left'` and `direction: 'right'` randomly across elements.
   - **What happens:** Elements appear to fly in from random directions, creating visual chaos instead of flow.
   - **Fix:** Use `'up'` for most content (the natural scroll direction). Use `'left'`/`'right'` only for side-by-side layouts where horizontal motion matches the layout.
   - **Why:** Direction should reinforce the spatial relationship, not contradict it.

## Break It to Learn It

### Exercise 1: Make reveals replay on re-scroll
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 61, change `once: true` to `once: false`
3. **Predict:** Scrolling down reveals elements, scrolling up hides them, scrolling down reveals them again
4. **Verify:** Run `bun run dev`, scroll up and down through the page repeatedly
5. **What you learned:** `once: true` is what makes reveals feel like permanent appearances rather than toggle effects
6. **Undo your change**

### Exercise 2: Break reduced motion handling
1. Open `src/lib/motion/actions/reveal.ts`
2. Comment out lines 43-46 (the `isPrefersReducedMotion()` block)
3. Enable reduced motion in your OS settings (Windows: Settings > Accessibility > Visual effects > Animation effects OFF)
4. **Predict:** Elements will stay invisible because GSAP sets `opacity: 0` but the ScrollTrigger animation never fires
5. **Verify:** Run `bun run dev`, scroll through the page -- content sections will be blank
6. **What you learned:** Reduced motion handling is not optional -- without it, you break the site for users who need it
7. **Undo your change and restore OS settings**

### Exercise 3: Change the reveal direction
1. Open `src/lib/motion/actions/reveal.ts`
2. On line 22, change `const OFFSET = 20` to `const OFFSET = 80`
3. **Predict:** Elements will slide up from 80px below instead of 20px -- a much more dramatic entrance
4. **Verify:** Run `bun run dev`, scroll through revealed elements
5. **What you learned:** Small offsets (15-30px) feel subtle and professional; large offsets feel like PowerPoint transitions
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-scrolltrigger]] because reveal uses ScrollTrigger to detect viewport entry
- **Depends on:** [[svelte-actions]] because `reveal` is a Svelte action attached with `use:reveal`
- **Related:** [[gsap-fundamentals]] because reveal uses `gsap.from()` and ease functions
- **Related:** [[reduced-motion-accessibility]] because reveal must handle reduced motion to avoid hiding content
- **Related:** [[gsap-timeline-and-stagger]] because groups of revealed elements use staggered delays

## Knowledge Check

1. What does "earned, not free" mean for entrance animations? → See [What It Is](#what-it-is)
2. Why does `use:reveal` use `gsap.from()` instead of `gsap.to()`? → See [Worked Example](#worked-example)
3. What happens to reduced-motion users if you skip the accessibility check? → See [Common Mistakes](#common-mistakes)
4. Why is `once: true` critical for entrance animations? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [GSAP ScrollTrigger demos](https://gsap.com/scroll/)
- [web.dev: prefers-reduced-motion](https://web.dev/prefers-reduced-motion/)
- [Intersection Observer API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) -- the browser API ScrollTrigger builds on
