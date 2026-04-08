---
title: "Scroll-Linked Video"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[gsap-scrolltrigger]]"
date: 2026-04-08
---

# Scroll-Linked Video


## The Analogy

Scroll-linked media is like cursor-based result paging in a database. With `FETCH NEXT FROM cursor`, you control exactly which row you see. Scroll-linked video works the same way: the scroll position controls which frame of the video (or animation) you see. Scroll forward to advance, scroll back to rewind. The scroll bar becomes a seek bar, and the user is the playback controller.

## What It Is

Scroll-linked media ties the playback position of a video or animation to the user's scroll position instead of playing at a fixed speed. The core mechanism is:

1. **Capture scroll progress** as a 0-to-1 value (top of page = 0, bottom = 1)
2. **Map progress to a frame** in the media: `frame = progress * totalFrames`
3. **Seek to that frame** on every scroll update: `video.currentTime = progress * video.duration` or `animation.goToAndStop(frame, true)`

This project implements scroll-linked media in two ways:

**Lottie scrub (primary pattern):** The `LottiePlayer` component in scrub mode takes a `progress` prop (0-1) and calls `animation.goToAndStop(frame, true)` to display the corresponding frame. The scroll progress value comes from GSAP ScrollTrigger's `onUpdate` callback or from the `scrollProgress` store.

**Scroll progress store:** `src/lib/motion/stores/scroll.ts` provides a reactive `scrollProgress` store (0-1) that tracks the user's global page scroll position. It uses `requestAnimationFrame`-gated scroll listeners to compute `window.scrollY / scrollableHeight` efficiently without layout thrashing.

In this project, the pattern is used for:
- Service station Lottie icons that build up as you scroll past them
- The train journey SVG that moves along the rail based on scroll position
- The scroll rail progress indicator that fills as you scroll

## Why It Matters

Scroll-linked media is a premium storytelling technique used by Apple (iPhone product pages), Google (Pixel launch), and every major editorial site (NY Times, Bloomberg). It transforms passive scrolling into active exploration. In interviews, "How would you build an Apple-style scroll-driven video experience?" is a high-value question. Understanding this pattern also teaches requestAnimationFrame optimization, scroll performance, and reactive data flow.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/stores/scroll.ts` | `scrollProgress` readable store with rAF-gated listener | Central scroll tracking: converts scroll position to 0-1 value |
| `src/lib/motion/components/LottiePlayer.svelte` | Scrub `$effect` on lines 104-113 | Maps `progress` prop to `animation.goToAndStop(frame)` |
| `src/lib/motion/svg/TrainJourney.svelte` | `trainTop = $derived(5 + scrollProgress * 77)` | SVG train position driven by scroll progress |
| `src/lib/motion/components/ScrollRail.svelte` | `style="height: {$scrollProgress * 100}%"` | Progress bar that fills based on scroll position |
| `src/lib/components/ServiceStation.svelte` | ScrollTrigger `onUpdate` feeding progress to LottiePlayer | Per-section scroll-to-Lottie mapping |

## The Mental Model

```
Scroll position to media frame pipeline:

  User scrolls
       │
       ▼
  window.scrollY = 500px                    Step 1: Read raw position
       │
       ▼
  scrollable = docHeight - viewportHeight   Step 2: Calculate total scrollable range
       │
       ▼
  progress = scrollY / scrollable = 0.35    Step 3: Normalize to 0-1
       │
       ├─► video.currentTime = 0.35 * duration   Step 4a: Video frame
       │
       ├─► lottie.goToAndStop(0.35 * totalFrames) Step 4b: Lottie frame
       │
       └─► trainTop = 5 + 0.35 * 77 = 32%         Step 4c: CSS position


  Performance optimization (rAF gating):

  Scroll event fires 60+ times per second.
  Without gating: 60 layout recalculations per second → jank.

  With rAF gating:
    scroll → schedule ONE rAF → compute progress → update store
    scroll → (already scheduled, skip)
    scroll → (already scheduled, skip)
    rAF fires → compute progress → update store
    scroll → schedule ONE rAF → ...

  Like batching SQL INSERTs: process many events in one pass.
```

## Worked Example

```typescript
// From: src/lib/motion/stores/scroll.ts
// This store tracks the user's scroll progress as a 0-1 value.

import { readable } from 'svelte/store';

function computeProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  // Guard: if content fits the viewport, progress is always 0
  if (scrollable <= 0) return 0;
  // Clamp to 0-1 range
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export const scrollProgress = readable<number>(0, (set) => {
  if (typeof window === 'undefined') return; // SSR-safe

  let rafId: number | null = null;

  function onScroll() {
    // rAF gate: only schedule ONE frame computation per animation frame
    if (rafId !== null) return; // Already scheduled, skip this event
    rafId = requestAnimationFrame(() => {
      set(computeProgress());  // Compute and publish the new value
      rafId = null;             // Ready for next schedule
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  set(computeProgress()); // Initial value (page may load mid-scroll)

  return () => {
    window.removeEventListener('scroll', onScroll);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
});
```

The `requestAnimationFrame` gate is the critical optimization. Scroll events can fire 60-100+ times per second, but the browser only renders at 60fps (or the monitor's refresh rate). Computing `scrollY / scrollable` once per frame instead of once per scroll event prevents layout thrashing -- the browser equivalent of reducing N+1 queries to a single batch.

The `{ passive: true }` option on the event listener tells the browser "this handler will never call `preventDefault()`," allowing the browser to start scrolling without waiting for the handler to complete. Like setting `NOLOCK` on a query -- you are promising not to block.

## Common Mistakes

1. **Computing scroll progress on every scroll event:** Not using requestAnimationFrame gating.
   - **What happens:** Layout thrashing -- the browser recalculates layout 60-100 times per second instead of once per frame. Visible janking on lower-end devices.
   - **Fix:** Use `requestAnimationFrame` to batch scroll computations to one per frame, as shown in the store.
   - **Why:** Reading `scrollY` or `scrollHeight` forces the browser to calculate layout. Doing this too often blocks the main thread.

2. **Forgetting SSR safety:** Accessing `window` or `document` in code that runs during server-side rendering.
   - **What happens:** `ReferenceError: window is not defined` during build or SSR.
   - **Fix:** Guard with `if (typeof window === 'undefined') return`. The scroll store defaults to 0 during SSR.
   - **Why:** SvelteKit renders pages on the server where browser APIs do not exist.

3. **Not clamping progress to 0-1:** Allowing scroll progress to go negative (overscroll at top) or above 1 (overscroll at bottom).
   - **What happens:** `video.currentTime = -0.5 * duration` is invalid. Lottie frame indices below 0 cause errors.
   - **Fix:** Clamp with `Math.min(1, Math.max(0, value))`.
   - **Why:** Edge cases at scroll boundaries (elastic overscroll on Mac, momentum on mobile) produce out-of-range values.

## Break It to Learn It

### Exercise 1: Remove rAF gating
1. Open `src/lib/motion/stores/scroll.ts`
2. In `onScroll()`, remove the `if (rafId !== null) return` guard and the `requestAnimationFrame` wrapper. Just call `set(computeProgress())` directly.
3. **Predict:** Scroll-linked animations will work but may feel slightly less smooth on fast scrolling, especially on slower machines
4. **Verify:** Run `bun run dev`, scroll rapidly through the page, watch for any janking or dropped frames
5. **What you learned:** rAF gating is a performance optimization that batches scroll computations to the browser's render cycle
6. **Undo your change**

### Exercise 2: Invert scroll direction
1. Open `src/lib/motion/stores/scroll.ts`
2. In `computeProgress()`, change the return to `return Math.min(1, Math.max(0, 1 - window.scrollY / scrollable))`
3. **Predict:** All scroll-linked media will play in reverse: scrolling down = rewinding, scrolling up = advancing
4. **Verify:** Run `bun run dev`, scroll down and observe the train, progress bar, and any scrub Lottie animations going backward
5. **What you learned:** The 0-1 mapping is the single point of control for all scroll-linked behavior in the project
6. **Undo your change**

### Exercise 3: Set a fixed progress value
1. Open `src/lib/motion/stores/scroll.ts`
2. Change `set(computeProgress())` in both locations to `set(0.5)` (hardcode midpoint)
3. **Predict:** All scroll-linked media will be frozen at the halfway point regardless of scroll position
4. **Verify:** Run `bun run dev`, scroll through the page -- the train, progress bar, and Lottie animations will stay at 50%
5. **What you learned:** The store is the single source of truth for scroll position -- all downstream consumers react to its value
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-scrolltrigger]] because per-section scroll-linked animations use ScrollTrigger's `onUpdate` for progress values
- **Related:** [[lottie-animations]] because Lottie scrub mode is the primary consumer of scroll progress
- **Related:** [[reduced-motion-accessibility]] because scroll-linked animations may need a static fallback
- **Related:** [[gsap-fundamentals]] because `gsap.to()` with `scrub: true` is an alternative to manual progress mapping

## Knowledge Check

1. What does rAF gating prevent and why is it important? → See [Worked Example](#worked-example)
2. Why must scroll progress be clamped to 0-1? → See [Common Mistakes](#common-mistakes)
3. What does `{ passive: true }` do on a scroll event listener? → See [Worked Example](#worked-example)
4. How does the LottiePlayer convert a 0-1 progress value to a frame number? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [requestAnimationFrame explained (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [Scroll-driven animations on the web (web.dev)](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [GSAP ScrollTrigger scrub mode](https://gsap.com/docs/v3/Plugins/ScrollTrigger/#:~:text=scrub)
