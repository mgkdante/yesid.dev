---
title: "Lottie Animations"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Lottie Animations


## The Analogy

A Lottie animation is like a pre-compiled stored procedure. The designer creates complex animation logic in After Effects -- keyframes, easing curves, layer compositions -- and exports it as a single JSON file. At runtime, the `lottie-web` library reads that JSON and plays the animation, just as a database engine reads a compiled stored procedure and executes it. You do not write the animation frame-by-frame in code. You call `.play()` and the pre-built logic runs.

## What It Is

**Lottie** is a format for vector animations. A designer creates an animation in Adobe After Effects, exports it to JSON using the Bodymovin plugin, and the `lottie-web` JavaScript library renders it in the browser as SVG, Canvas, or HTML.

Key concepts:

- **JSON animation file:** The exported file contains keyframe data, layer definitions, path coordinates, and timing curves. It is typically stored in `static/lottie/` and loaded by URL.
- **lottie-web:** The runtime library that parses the JSON and renders the animation. It supports play, pause, stop, seek to frame, and speed control.
- **Trigger modes:** This project's `LottiePlayer` component supports three trigger modes:
  - `mount`: Plays on component mount (page load)
  - `hover`: Plays on mouseenter, stops on mouseleave
  - `scroll`: Plays when the element enters the viewport (via IntersectionObserver)
- **Scrub mode:** When `scrub=true`, the animation does not play freely. Instead, a `progress` prop (0 to 1) controls which frame is displayed. Scroll position drives the progress value, making the animation advance frame-by-frame as the user scrolls.
- **Reverse:** When `reverse=true` in scrub mode, frame 0 maps to progress=1 (the animation builds up as you scroll down).

## Why It Matters

Lottie bridges the gap between design and development. Designers can create complex animations without writing code, and developers can integrate them without understanding After Effects. This workflow scales -- adding a new animated illustration means dropping a JSON file into the project, not writing 200 lines of GSAP. In interviews, "How do you handle complex animations at scale?" is answered with Lottie. It is used by Airbnb (who created it), Google, Uber, and most mobile-first companies.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/components/LottiePlayer.svelte` | Complete Lottie wrapper component | Handles all trigger modes, scrub, reverse, reduced motion, and cleanup |
| `src/lib/components/ServiceStation.svelte` | `<LottiePlayer>` with scrub mode | Lottie animations tied to scroll position for service station icons |
| `src/lib/motion/components/LottiePlayer.test.ts` | Test file for LottiePlayer | Shows how the component is tested with mocked lottie-web |

## The Mental Model

```
Designer's Workflow:                     Developer's Workflow:
┌──────────────┐                         ┌──────────────────────────┐
│ After Effects │                         │ <LottiePlayer             │
│              │                         │   src="/lottie/icon.json" │
│ Keyframes ───┤  ─── Bodymovin ───►     │   trigger="scroll"       │
│ Layers    ───┤       export            │   scrub={true}            │
│ Easing    ───┤                         │   progress={scrollPos}    │
└──────────────┘                         │ />                        │
                                         └──────────────────────────┘
  ↓                                        ↓
  Complex motion logic                     One component, one prop (progress)
  is pre-compiled into JSON                drives the entire animation.

  Like: stored procedure                 Like: EXEC sp_animate @progress=0.5
  is compiled once                       called with one parameter


SCRUB MODE:
  scrollProgress: 0.0    0.25    0.5    0.75    1.0
  frame:          0       15      30     45      60
                  │       │       │       │       │
                  ▼       ▼       ▼       ▼       ▼
                  ░░░░░  ▓▓░░░  ▓▓▓▓░  ▓▓▓▓▓  ▓▓▓▓▓▓
                  start   ...    mid     ...    complete

  The scroll bar IS the animation's playhead.
  Scroll forward = advance. Scroll back = reverse.
```

## Worked Example

```svelte
<!-- From: src/lib/motion/components/LottiePlayer.svelte -->
<!-- This component wraps lottie-web with Svelte reactivity. -->

<script lang="ts">
  import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

  let {
    src,                    // Path to Lottie JSON file
    trigger = 'mount',      // When to start: 'mount' | 'hover' | 'scroll'
    loop = false,           // Repeat after finishing?
    speed = 1,              // Playback speed multiplier
    scrub = false,          // Drive from external progress prop?
    progress = 0,           // 0-1 scroll position (only when scrub=true)
    reverse = false         // Invert progress mapping (0→last frame, 1→first frame)
  } = $props();

  let container: HTMLDivElement;
  let animation = null;
  let loaded = $state(false);   // $state so scrub $effect re-runs when data arrives

  $effect(() => {
    async function init() {
      // Dynamic import: lottie-web is only loaded when a LottiePlayer exists
      const lottie = (await import('lottie-web')).default;
      const reducedMotion = isPrefersReducedMotion();

      animation = lottie.loadAnimation({
        container,            // The div element to render into
        path: src,            // URL to the JSON file
        renderer: 'svg',      // Render as SVG (best quality)
        loop: scrub ? false : loop,
        autoplay: !scrub && trigger === 'mount' && !reducedMotion
      });

      // Reduced motion: show first frame only, no playback
      if (reducedMotion) {
        animation.goToAndStop(0, true);
        return;
      }

      // Signal that animation data is ready for scrubbing
      animation.addEventListener('data_ready', () => { loaded = true; });
    }

    init();

    return () => {
      animation?.destroy();   // Clean up on unmount
      animation = null;
      loaded = false;
    };
  });

  // Scrub $effect: reads `progress` and `loaded` as dependencies.
  // When either changes, this $effect recalculates the frame.
  $effect(() => {
    if (scrub && loaded && animation) {
      const frames = animation.totalFrames;
      if (frames > 0) {
        const p = reverse ? (1 - progress) : progress;
        const frame = Math.round(p * frames);
        animation.goToAndStop(frame, true);  // Jump to exact frame
      }
    }
  });
</script>

<div bind:this={container} role="img" aria-label="Animated illustration"></div>
```

The two `$effect` blocks work together: the first one loads the animation and sets `loaded = true` when ready. The second one watches both `loaded` and `progress` -- when scroll position changes, it calculates the corresponding frame and jumps to it. This is reactive composition: the scrub effect cannot run until the load effect signals readiness.

## Common Mistakes

1. **Using autoplay with scrub mode:** Setting `autoplay: true` and `scrub: true` together.
   - **What happens:** The animation plays freely AND tries to seek to scroll-driven frames, creating a jittery fight between two control systems.
   - **Fix:** When `scrub=true`, set `autoplay: false` and `loop: false`. Let the `progress` prop be the sole control.
   - **Why:** Two animation controllers fighting for the same playhead is like two transactions writing to the same row simultaneously.

2. **Not handling reduced motion:** Playing Lottie animations without checking `isPrefersReducedMotion()`.
   - **What happens:** Users who opted out of motion still see complex animations playing.
   - **Fix:** When reduced motion is on, call `animation.goToAndStop(0, true)` to show the first frame as a static image.
   - **Why:** Lottie animations can be complex and visually intense. Respecting the user's preference is mandatory.

3. **Forgetting to destroy the animation on unmount:** Not calling `animation.destroy()` when the component is removed.
   - **What happens:** The lottie-web renderer keeps running in the background, updating an SVG that no longer exists in the DOM. Memory leaks and console errors.
   - **Fix:** Return a cleanup function from `$effect` that calls `animation?.destroy()`.
   - **Why:** Same as closing a database connection -- every resource allocation needs a matching deallocation.

## Break It to Learn It

### Exercise 1: Disable scrub mode
1. Open `src/lib/components/ServiceStation.svelte`
2. Find the `<LottiePlayer>` usage and change `scrub={true}` to `scrub={false}` (or remove the scrub prop)
3. **Predict:** The Lottie animation will play once on mount instead of being tied to scroll position
4. **Verify:** Run `bun run dev`, navigate to the services section, observe the animation playing immediately
5. **What you learned:** Scrub is what links animation to scroll -- without it, the animation is fire-and-forget
6. **Undo your change**

### Exercise 2: Reverse the scrub direction
1. Open `src/lib/components/ServiceStation.svelte`
2. Add `reverse={true}` to the `<LottiePlayer>` props (or toggle an existing `reverse` prop)
3. **Predict:** The animation will play in reverse as you scroll down -- starting at the last frame and ending at the first
4. **Verify:** Run `bun run dev`, scroll through the service stations
5. **What you learned:** The `reverse` prop inverts the progress mapping without needing a different JSON file
6. **Undo your change**

### Exercise 3: Change playback speed
1. Open `src/lib/motion/components/LottiePlayer.svelte`
2. On line 22 in the props, change the default `speed = 1` to `speed = 0.3`
3. **Predict:** All non-scrub Lottie animations will play at 30% speed -- much slower
4. **Verify:** Run `bun run dev`, find a hover-triggered or mount-triggered Lottie animation
5. **What you learned:** Speed is a multiplier on the original animation timing -- useful for adjusting designer animations without re-exporting
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because LottiePlayer is a Svelte component with props and $effect
- **Related:** [[scroll-linked-video]] because Lottie scrub mode is the same concept as scroll-linked video (scroll drives playback position)
- **Related:** [[reduced-motion-accessibility]] because LottiePlayer checks reduced motion and shows first frame only
- **Related:** [[gsap-scrolltrigger]] because the scroll progress that drives scrub mode often comes from a ScrollTrigger instance

## Knowledge Check

1. What is the difference between trigger modes `mount`, `hover`, and `scroll`? → See [What It Is](#what-it-is)
2. What does scrub mode do and how is it controlled? → See [The Mental Model](#the-mental-model)
3. What happens to a Lottie animation when reduced motion is enabled? → See [Worked Example](#worked-example)
4. Why must `autoplay` be false when using scrub mode? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [lottie-web GitHub](https://github.com/airbnb/lottie-web)
- [LottieFiles (free animations)](https://lottiefiles.com/)
- [Lottie documentation](https://airbnb.io/lottie/)
