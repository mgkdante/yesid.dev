---
title: "Entrance Animation Guard"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[gsap-fundamentals]]"
  - "[[svelte-actions]]"
date: 2026-04-08
---

# Entrance Animation Guard


## The Analogy

In SQL Server, you can place a lock on a row during an update: `SELECT * FROM orders WITH (UPDLOCK) WHERE id = 42`. While that lock is held, no other transaction can modify the row. The entrance animation guard works the same way: while the entrance animation is playing (the "transaction"), all interaction handlers (hover, tap, click) are blocked. Once the animation completes (the "transaction commits"), the lock releases and interactions are allowed. This prevents a user from hovering mid-animation and causing a visual glitch -- like preventing a dirty read during a transaction.

## What It Is

The entrance animation guard is a boolean flag called `entranceDone` that starts as `false` and flips to `true` in the animation timeline's `onComplete` callback. Every interaction handler (mouseenter, mouseleave, click/tap) checks this flag at the top of the function and returns early if the entrance is still running.

This pattern exists because SVG illustration components in this project have two animation phases: an entrance animation (draw, morph, stagger) that plays once when the element first appears, and an interactive animation (morph to geometric shapes on hover/tap). If the user hovers during the entrance, the hover animation interrupts the entrance -- paths get stuck mid-draw, fills disappear, or morph targets get confused. The guard prevents this entirely.

## Why It Matters

Animation state management is a real production concern. "How do you handle user interaction during an animation?" is a question that separates junior from mid-level developers. The guard pattern is simple, effective, and composable -- it works with any animation library, not just GSAP.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/BlogSvgIcon.svelte` | Line 42: `let entranceDone = false` | The guard flag declaration |
| `src/lib/components/BlogSvgIcon.svelte` | Line 58: `if (!entranceDone) return` | Guard in mouseenter handler |
| `src/lib/components/BlogSvgIcon.svelte` | Line 210: `const onDone = () => { entranceDone = true; }` | Flag set in timeline onComplete |
| `src/lib/components/WorkSvgIcon.svelte` | Lines 37, 53, 70: same pattern | Identical guard in a different component |
| `src/lib/components/WorkSvgIcon.svelte` | Line 140: `onComplete: () => { entranceDone = true; }` | Timeline completion flips the flag |

## The Mental Model

```
Timeline:

t=0ms                 t=1200ms              t=1800ms
  │                      │                     │
  ▼                      ▼                     ▼
  ┌─ ENTRANCE ──────────┐┌─ FILL ────────────┐
  │ Draw SVG paths       ││ Fill with opacity  │
  │ entranceDone = false ││                    │
  │ ┌─ USER HOVERS ─┐   ││                    │
  │ │ if(!done)      │   ││                    │
  │ │   return; ✓    │   ││                    │
  │ └────────────────┘   ││                    │
  └──────────────────────┘└────────┬───────────┘
                                   │
                          onComplete fires
                          entranceDone = true
                                   │
  t=1800ms+                        ▼
  ┌─ INTERACTIVE ─────────────────────────────┐
  │ User hovers → morph to triangle           │
  │ User leaves → morph back to original      │
  │ User taps  → toggle morph state           │
  │ entranceDone = true, all handlers active   │
  └───────────────────────────────────────────┘


Without the guard:

  t=0ms        t=600ms (user hovers)
  │               │
  ▼               ▼
  ┌─ ENTRANCE ───┐┌─ HOVER MORPH ──────────┐
  │ Drawing...    ││ INTERRUPTS draw!       │
  │               ││ Paths half-drawn       │
  │               ││ → morph target wrong   │
  │               ││ → visual glitch ✗      │
  └───────────────┘└────────────────────────┘
```

## Worked Example

```typescript
// From: src/lib/components/BlogSvgIcon.svelte
// The full guard pattern in context:

// Step 1: Declare the guard flag
let entranceDone = false;

// Step 2: Guard EVERY interaction handler
function handleMouseEnter() {
  // Guard check -- first line of every handler
  if (isPrefersReducedMotion() || svgPaths.length === 0 || isHovered || !entranceDone) return;
  //                                                                    ^^^^^^^^^^^^^^
  //                                                        This is the guard in action

  isHovered = true;
  const shape = pickRandomShape();
  gsap.to(svgPaths, {
    morphSVG: SHAPES[shape],
    duration: 0.4,
    stagger: 0.03,
    ease: 'power2.inOut',
    overwrite: true
  });
}

function handleTap() {
  // Same guard
  if (isPrefersReducedMotion() || svgPaths.length === 0 || !entranceDone) return;
  // ... tap toggle logic
}

function handleMouseLeave() {
  // Same guard
  if (isPrefersReducedMotion() || svgPaths.length === 0 || !isHovered || !entranceDone) return;
  // ... morph back to original
}

// Step 3: Set the flag in onComplete
onMount(() => {
  // ... setup code ...

  // The callback that releases the lock
  const onDone = () => { entranceDone = true; };

  // WHY: timeline wraps staggered animations so onComplete fires ONCE
  // after ALL children finish, not per-element
  const tl = gsap.timeline({ onComplete: onDone });
  tl.to(svgPaths, {
    drawSVG: '100%',
    duration: 1,
    stagger: 0.12,
    ease: 'power2.inOut'
  });
});
```

Note the important GSAP detail: `onComplete` on a `gsap.to()` with `stagger` fires per-element, not once for the whole batch. Wrapping in `gsap.timeline()` gives a single `onComplete` that fires after all staggered children finish. This was discovered during Slice 09c-2b (see PATTERNS.md "GSAP onComplete with Stagger").

## Common Mistakes

1. **Setting the flag on `gsap.to()` instead of `gsap.timeline()`:** Using `onComplete` directly on a staggered tween.
   - **What happens:** `onComplete` fires after the FIRST element finishes, not after all elements finish. Interactions are allowed while later elements are still animating.
   - **Fix:** Wrap the staggered animation in `gsap.timeline()` and put `onComplete` on the timeline.
   - **Why:** A timeline's `onComplete` fires once after all its children complete. A tween's `onComplete` with `stagger` fires N times (once per element).

2. **Guarding only one handler:** Adding the guard to `mouseenter` but forgetting `mouseleave` or `click`.
   - **What happens:** If the user hovers before the entrance finishes, nothing happens (guard works). But if they tap, the tap handler fires and interrupts the animation.
   - **Fix:** Add `if (!entranceDone) return` as the first line of EVERY interaction handler.
   - **Why:** Users interact unpredictably -- hover, tap, click can all happen at any time.

3. **Using a timeout instead of `onComplete`:** Setting `entranceDone = true` after a fixed delay (e.g., `setTimeout(() => entranceDone = true, 1500)`).
   - **What happens:** If the animation duration changes, the timeout gets out of sync. The guard releases too early or too late.
   - **Fix:** Always use the animation library's completion callback, not a manual timer.
   - **Why:** The animation system knows exactly when it finishes. A timeout is a guess that drifts.

## Break It to Learn It

### Exercise 1: Remove the guard and hover mid-animation
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. In `handleMouseEnter()`, remove `|| !entranceDone` from the guard check (line 58)
3. **Predict:** What will happen if you hover over a blog post SVG while it's drawing in?
4. **Verify:** Run `bun run dev`, go to `/blog`, scroll to trigger a blog card entrance, and hover immediately while the SVG is still drawing
5. **What you learned:** Without the guard, the hover morph interrupts the draw animation -- paths get stuck in half-drawn states
6. **Undo your change**

### Exercise 2: Move onComplete to the wrong place
1. Open `src/lib/components/WorkSvgIcon.svelte`
2. Move the `entranceDone = true` from the timeline's `onComplete` to after the `gsap.timeline()` call (i.e., set it synchronously)
3. **Predict:** Will the guard still work?
4. **Verify:** Run `bun run dev`, go to `/work`, hover over a project card SVG immediately on page load
5. **What you learned:** Setting the flag synchronously means the guard is released immediately -- before the animation even starts playing. The flag must be set in the async completion callback.
6. **Undo your change**

### Exercise 3: Count the guard occurrences
1. Open `src/lib/components/BlogSvgIcon.svelte`
2. Search for `entranceDone` in the file
3. Count how many handler functions check it
4. **Predict:** Are there any interaction handlers that do NOT check `entranceDone`? Should there be?
5. **What you learned:** Every handler that could fire during the entrance must check the guard -- no exceptions

## Connections

- **Depends on:** [[gsap-fundamentals]] because the guard is set in GSAP's `onComplete` callback
- **Depends on:** [[svelte-actions]] because the pattern often appears inside action-based components
- **Related:** [[action-pattern]] because both manage lifecycle state for DOM behavior
- **Related:** [[filter-reset-pattern]] because both use boolean flags to coordinate between animation and interaction state

## Knowledge Check

1. Why does `entranceDone` start as `false` instead of `true`? -> See [The Mental Model](#the-mental-model)
2. Why must you wrap staggered animations in a timeline to use `onComplete`? -> See [Common Mistakes](#common-mistakes)
3. What visual glitch does the guard prevent? -> See [What It Is](#what-it-is)
4. How is this pattern like a SQL row lock? -> See [The Analogy](#the-analogy)

## Go Deeper

- [GSAP Timeline onComplete](https://gsap.com/docs/v3/GSAP/Timeline/)
- [GSAP Stagger Documentation](https://gsap.com/docs/v3/Staggers/)
