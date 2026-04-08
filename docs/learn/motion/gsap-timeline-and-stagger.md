---
title: "GSAP Timeline and Stagger"
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

# GSAP Timeline and Stagger


## The Analogy

A GSAP timeline is like a SQL transaction with multiple statements -- it groups several operations into a single, coordinated sequence. Each statement runs in order, and you can control the exact timing between them. Stagger is like `LIMIT ... OFFSET` applied to animation timing: instead of all rows appearing at once, each one appears after a small delay. Together, timelines and stagger turn a group of identical animations into an organic, choreographed sequence.

## What It Is

A **timeline** (`gsap.timeline()`) is a container that sequences multiple tweens. Without a timeline, each `gsap.to()` is independent -- they all start at the same time. A timeline gives you control over ordering and overlap.

Key timeline concepts:

- **Position parameter:** The third argument to `tl.to()` that controls WHEN the tween starts relative to the timeline. `0` means "at time zero." `"-=0.3"` means "0.3 seconds before the previous tween ends" (overlap). `"+=0.5"` means "0.5 seconds after the previous tween ends" (gap).
- **Labels:** Named positions in the timeline for readability: `tl.addLabel('phase2', 0.5)` then `tl.to(el, vars, 'phase2')`.

**Stagger** spaces out identical animations across a group of elements. Instead of all cards fading in simultaneously, each one starts a fixed interval after the previous:

- **Built-in stagger:** `gsap.to('.card', { opacity: 1, stagger: 0.1 })` -- each card starts 0.1s after the previous.
- **Custom stagger:** The `stagger()` utility in this project adds controlled randomization so the timing feels organic rather than robotic.

## Why It Matters

Without timelines, complex animations require manual `delay` calculations that break every time you add or remove a step. Timelines compose like SQL transactions -- each step is relative to the previous, so reordering is trivial. Stagger is the single biggest factor in whether a group animation looks "designed" or "happened by accident." Both are standard interview topics for frontend motion roles.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/stagger.ts` | `stagger()` function with randomization | Custom timing calculator that adds +/-15% variance per element |
| `src/lib/components/BlogSvgIcon.svelte` | `gsap.timeline()` with sequential `.to()` calls | Draw-then-fill sequence using position parameter `'-=0.3'` |
| `src/lib/components/HeroBanner.svelte` | `gsap.timeline()` with precise position values like `0.17` | Multi-phase hero animation with overlapping tweens |
| `src/lib/components/Nav.svelte` | `gsap.timeline().to(chars, { stagger: { each: 0.05 } })` | Wave effect on "yesid." text using per-character stagger |
| `src/lib/components/WorkListingPage.svelte` | `Flip.from(flipState, { stagger: 0.05 })` | Staggered FLIP animation on filter change |

## The Mental Model

```
Timeline without position parameter (sequential):

tl.to(A, { opacity: 1 })         ████████
tl.to(B, { y: 0 })                        ████████
tl.to(C, { scale: 1 })                             ████████
                                  ─────────────────────────────► time


Timeline WITH position parameter (overlapping):

tl.to(A, { opacity: 1 }, 0)      ████████                     ← starts at 0s
tl.to(B, { y: 0 }, 0.2)            ████████                   ← starts at 0.2s
tl.to(C, { scale: 1 }, '-=0.3')       ████████                ← starts 0.3s before B ends
                                  ─────────────────► time      (overlap makes it feel connected)


Stagger across 5 elements (stagger: 0.1):

Element 0: ████████
Element 1:   ████████
Element 2:     ████████
Element 3:       ████████
Element 4:         ████████
             ─────────────────► time

With randomization (±15%):

Element 0: ████████
Element 1:    ████████          ← 0.115s (slightly late)
Element 2:     ████████         ← 0.19s  (slightly early)
Element 3:        ████████      ← 0.32s  (slightly late)
Element 4:          ████████    ← 0.39s  (slightly early)
             ─────────────────► time
             Feels organic, like data arriving rather than marching.
```

## Worked Example

```typescript
// From: src/lib/motion/utils/stagger.ts
// This function calculates the delay for element N in a staggered group.

export function stagger(index: number, baseDelay: number, options?: StaggerOptions): number {
  const { randomize = true, randomRange = 0.15 } = options ?? {};

  // Base delay: element 0 = 0ms, element 1 = baseDelay, element 2 = 2*baseDelay, etc.
  // Like OFFSET in SQL: each row gets a later slot.
  const base = index * baseDelay;

  if (!randomize || baseDelay === 0) return base;

  // Add ±15% variance to break the robotic feel.
  // maxVariance = baseDelay * 0.15
  // offset = random number between -maxVariance and +maxVariance
  const maxVariance = baseDelay * randomRange;
  const offset = (Math.random() * 2 - 1) * maxVariance;

  // Never return negative -- element 0 should never animate before it exists.
  return Math.max(0, Math.round(base + offset));
}

// Usage: stagger(3, 100) might return 285, 300, or 315
// (300 ± 15% of 100 = 300 ± 15 = 285..315)
```

The `index * baseDelay` gives each element its slot in the sequence, like `OFFSET index * pageSize`. The randomization adds organic variance so the result looks like data arriving over a network -- slightly unpredictable, slightly alive -- rather than a synchronized march.

```typescript
// From: src/lib/components/BlogSvgIcon.svelte (lines 154-169)
// Timeline with position parameter: draw strokes first, THEN fill them.

function animateDrawFill(paths: SVGElement[], scrollTriggerConfig?, onDone?) {
  // Set initial state: invisible strokes, no fill
  gsap.set(paths, { drawSVG: '0%', fillOpacity: 0 });

  const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });

  // Phase 1: Draw the strokes (each path staggers by 0.12s)
  tl.to(paths, {
    drawSVG: '100%',
    duration: 1,
    stagger: 0.12,
    ease: 'power2.inOut'
  });

  // Phase 2: Fade in the fill -- starts 0.3s BEFORE phase 1 ends (overlap)
  tl.to(paths, {
    fillOpacity: 0.15,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power1.out'
  }, '-=0.3');  // ← Position parameter: overlap with previous tween
}
```

The `'-=0.3'` position parameter creates a seamless transition: the fill starts fading in while the last stroke is still drawing. Without it, there would be a visible gap between "strokes done" and "fill starts."

## Common Mistakes

1. **Adding stagger to a single element:** `gsap.to(oneElement, { stagger: 0.1 })` does nothing because there is only one target.
   - **What happens:** The animation works but `stagger` is silently ignored.
   - **Fix:** Stagger requires an array or NodeList of multiple elements: `gsap.to('.card', { stagger: 0.1 })`.
   - **Why:** Stagger spaces elements apart. One element has nothing to space against.

2. **Forgetting that position parameter is the THIRD argument:** Writing `tl.to(el, { x: 100 }, { x: 200 })` thinking the third argument is "to vars."
   - **What happens:** GSAP interprets `{ x: 200 }` as a position value, which fails silently or throws.
   - **Fix:** The position parameter is a number or string: `tl.to(el, { x: 100 }, 0.5)` or `tl.to(el, { x: 100 }, '-=0.2')`.
   - **Why:** GSAP 3 uses a two-argument tween format (`target, vars`). The position is timeline-specific, not a tween property.

3. **Using stagger without randomization for grids:** Uniform stagger on a grid of cards creates a visible diagonal wave pattern.
   - **What happens:** Cards animate in a perfect left-to-right, top-to-bottom wave that looks mechanical.
   - **Fix:** Use the project's `stagger()` utility with `randomize: true` (the default) for organic timing.
   - **Why:** Real-world things do not arrive in perfect sequence. Slight randomness breaks the pattern and makes it feel natural.

## Break It to Learn It

### Exercise 1: Remove randomization from stagger
1. Open `src/lib/motion/utils/stagger.ts`
2. On line 18, change `const { randomize = true` to `const { randomize = false`
3. **Predict:** All staggered animations in the project will feel more mechanical and synchronized
4. **Verify:** Run `bun run dev`, navigate to a page with staggered card entrances, observe the rhythm
5. **What you learned:** Randomization is what makes the difference between "animated" and "alive"
6. **Undo your change**

### Exercise 2: Change stagger direction
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In the `animateDrawFill` function (around line 158), change `stagger: 0.12` to `stagger: -0.12` (negative)
3. **Predict:** The SVG paths will draw in reverse order -- last path draws first
4. **Verify:** Run `bun run dev`, scroll to a blog post with the draw-fill animation
5. **What you learned:** Negative stagger reverses the sequence, which can be useful for exit animations
6. **Undo your change**

### Exercise 3: Remove overlap from draw-fill timeline
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In the `animateDrawFill` function (around line 168), remove `'-=0.3'` from the second `tl.to()` call
3. **Predict:** There will be a visible pause between the strokes finishing and the fill starting
4. **Verify:** Run `bun run dev`, scroll to trigger a draw-fill SVG animation, notice the gap
5. **What you learned:** Position parameter overlap creates seamless phase transitions
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-fundamentals]] because timelines compose individual GSAP tweens
- **Enables:** [[entrance-animations]] because stagger is used in reveal delay calculations
- **Enables:** [[svg-animation-drawsvg]] because DrawSVG uses timelines with stagger
- **Related:** [[gsap-scrolltrigger]] because timelines can be scrub-linked to ScrollTrigger
- **Related:** [[flip-animation]] because FLIP uses stagger to animate filter transitions

## Knowledge Check

1. What does the position parameter `'-=0.3'` mean? → See [The Mental Model](#the-mental-model)
2. Why does this project add randomization to stagger timing? → See [Worked Example](#worked-example)
3. When would you use a timeline vs individual tweens? → See [What It Is](#what-it-is)
4. What happens if you use stagger on a single element? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [GSAP Timeline docs](https://gsap.com/docs/v3/GSAP/Timeline/)
- [Position parameter guide](https://gsap.com/resources/position-parameter/)
- [Stagger documentation](https://gsap.com/docs/v3/Staggers/)
