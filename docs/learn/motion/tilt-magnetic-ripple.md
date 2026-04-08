---
title: "Tilt, Magnetic, Ripple"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[svelte-actions]]"
date: 2026-04-08
---

# Tilt, Magnetic, Ripple


## The Analogy

These three interaction effects are like hover effects in a dashboard -- visual feedback that makes interactive elements feel responsive. Tilt is like a physical card you can angle. Magnetic is like a magnet pulling a button toward your finger. Ripple is like tapping a touchscreen and seeing a wave emanate from the contact point. Each transforms a flat, static interface into something that feels aware of the user's presence.

## What It Is

Three Svelte actions that add cursor-driven interaction effects to DOM elements. All three share the same architecture:

**Tilt** (`use:tilt`) -- A subtle 3D rotation that follows the cursor position across a card's surface. The card tilts away from the cursor like a thick metal sign being pushed. Maximum tilt is 1.5 degrees (intentionally subtle) with a 30% dead zone in the center to prevent jitter from small mouse movements.

**Magnetic** (`use:magnetic`) -- A small positional pull toward the cursor. When the cursor enters a configurable radius around an element, the element shifts 2-3 pixels toward the cursor. Creates a "the button knows I'm here" feeling. Strength decreases with distance -- stronger pull when closer.

**Ripple** (`use:ripple`) -- An expanding circle that emanates from the exact click point, then fades. Uses the brand orange (`#E07800`) by default. Provides tactile click confirmation. The ripple is a dynamically created `<span>` element that scales from 0 to full size, then removes itself.

All three share critical safety behaviors:
- **Disabled on touch devices:** Touch has no cursor to track (tilt, magnetic) or has its own haptic feedback (ripple).
- **Disabled when reduced motion is on:** Checked via `isPrefersReducedMotion()` at action creation.
- **Clean up on destroy:** All event listeners are removed and pending timers are cleared.

## Why It Matters

Micro-interactions are what separate amateur and professional UI. Every major design system (Material Design, Apple HIG) specifies interaction feedback. In frontend interviews, "How would you add a ripple effect to a button?" tests both DOM manipulation and animation knowledge. Understanding these patterns means understanding event coordinates, CSS transforms, requestAnimationFrame timing, and accessibility guards.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/tilt.ts` | Complete tilt action with dead zone math | Shows mousemove tracking, coordinate normalization, and CSS 3D transforms |
| `src/lib/motion/actions/magnetic.ts` | Distance-based pull calculation | Shows how to create radius-gated effects with Pythagorean distance |
| `src/lib/motion/actions/ripple.ts` | Dynamic `<span>` creation on click | Shows DOM element creation inside an action with self-cleanup |
| `src/lib/components/ServiceStation.svelte` | `use:tilt` and `use:boop` on station cards | Real usage combining multiple actions on one component |
| `src/lib/components/ProjectCard.svelte` | `use:magnetic` on links | Shows magnetic pull on interactive elements |
| `src/lib/components/FilterGroup.svelte` | `use:boop` and `use:ripple` on filter buttons | Click feedback + hover response on the same element |

## The Mental Model

```
TILT — 3D rotation following cursor:

   Cursor moves RIGHT →    Card tilts:
   ┌─────────────────┐     ┌─────────────────╲
   │                 │     │                  ╲
   │     CARD    ●→  │  →  │     CARD          ╲
   │                 │     │                  ╱
   └─────────────────┘     └─────────────────╱
                           rotateY: +1.5°

   Dead zone (center 30%):  cursor in here = NO tilt
   ┌───┬───────────┬───┐
   │   │ dead zone │   │
   │   │  (0 tilt) │   │
   └───┴───────────┴───┘


MAGNETIC — pull toward cursor:

   Cursor ●                     Cursor ●
   outside radius:              inside radius:
   ┌─────────┐                  ┌─────────┐
   │  BUTTON │  (no effect)     │  BUTTON─┼──→ (shifts toward cursor)
   └─────────┘                  └─────────┘
                                Pull = (1 - distance/radius) * strength


RIPPLE — expanding circle from click:

   Click at ●:
   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
   │         ●     │    │       (●)     │    │     ( ● )     │
   │    BUTTON     │ →  │    BUTTON     │ →  │    BUTTON     │
   └───────────────┘    └───────────────┘    └───────────────┘
   t=0ms (scale:0)      t=200ms (scale:0.5)  t=400ms (scale:1, opacity:0)
                                               → span.remove()
```

## Worked Example

```typescript
// From: src/lib/motion/actions/tilt.ts (lines 37-63)
// The core mousemove handler that calculates tilt angles.

function onMouseMove(e: MouseEvent) {
  const rect = node.getBoundingClientRect();

  // Step 1: Find element center (like finding the pivot point)
  const centreX = rect.left + rect.width / 2;
  const centreY = rect.top + rect.height / 2;

  // Step 2: Normalize cursor offset to -1..1 range
  // nx = -1 means cursor is at left edge, +1 means right edge
  const nx = (e.clientX - centreX) / (rect.width / 2);
  const ny = (e.clientY - centreY) / (rect.height / 2);

  // Step 3: Clamp to prevent extreme angles at element edges
  const cx = Math.max(-1, Math.min(1, nx));
  const cy = Math.max(-1, Math.min(1, ny));

  // Step 4: Dead zone check -- no tilt when cursor is near center
  // Prevents jitter from small cursor movements
  if (Math.abs(cx) < DEAD_ZONE && Math.abs(cy) < DEAD_ZONE) {
    node.style.transition = 'transform 0.3s ease-out';
    node.style.transform = '';
    return;
  }

  // Step 5: Calculate rotation angles
  // rotateY follows horizontal (cursor right = card tilts right)
  // rotateX follows vertical but INVERTED (cursor down = card tilts forward)
  const rotateY = cx * maxDeg;   // maxDeg = 1.5 degrees
  const rotateX = -cy * maxDeg;

  // Step 6: Apply CSS 3D transform
  node.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}
```

The coordinate normalization (`-1..1`) is the same concept as normalizing database values to a scale -- it makes the math work regardless of element size. A 200px wide card and a 400px wide card both produce the same tilt angle when the cursor is at the same relative position.

## Common Mistakes

1. **Using tilt/magnetic on touch devices:** Touch events do not have a cursor to track, and `touchmove` coordinates behave differently.
   - **What happens:** The element jitters or sticks in a tilted position because `mousemove` does not fire on touch, but `mouseenter` can fire once on tap.
   - **Fix:** Check `navigator.maxTouchPoints > 0` and disable the action entirely. Both `tilt.ts` and `magnetic.ts` do this check.
   - **Why:** Touch and cursor are fundamentally different input models. Touch has its own interaction patterns (haptic feedback, long press).

2. **Forgetting to reset transform on mouseleave:** Applying a tilt or magnetic pull but not clearing it when the cursor leaves.
   - **What happens:** The element stays frozen in a tilted or displaced position forever.
   - **Fix:** Add a `mouseleave` handler that sets `node.style.transform = ''` with a smooth transition.
   - **Why:** The browser does not automatically reset inline styles. Every transform you apply must be explicitly removed.

3. **Making tilt angle too large:** Setting `maxDeg` to 10 or 15 degrees.
   - **What happens:** The card swings wildly with cursor movement, looking broken rather than subtle.
   - **Fix:** Keep `maxDeg` at 1-3 degrees. The project defaults to 1.5. If users notice the tilt consciously, it is too strong.
   - **Why:** Micro-interactions should be felt, not noticed. Subtlety is the entire point.

## Break It to Learn It

### Exercise 1: Remove the tilt dead zone
1. Open `src/lib/motion/actions/tilt.ts`
2. Comment out the dead zone check (lines 51-55 -- the `if (Math.abs(cx) < DEAD_ZONE ...)` block)
3. **Predict:** The card will tilt even with tiny cursor movements near the center, causing visible jitter
4. **Verify:** Run `bun run dev`, hover slowly over a tilted card (e.g., ServiceStation), watch for shaking
5. **What you learned:** Dead zones prevent jitter and make interaction feel intentional
6. **Undo your change**

### Exercise 2: Make ripple green
1. Open `src/lib/motion/actions/ripple.ts`
2. On line 22, change `color = '#E07800'` to `color = '#00FF00'`
3. **Predict:** Click ripples will be bright green instead of brand orange
4. **Verify:** Run `bun run dev`, click on any rippled button
5. **What you learned:** Ripple color is a parameter -- the action is data-driven, not hardcoded
6. **Undo your change**

### Exercise 3: Increase magnetic strength
1. Open `src/lib/motion/actions/magnetic.ts`
2. On line 32, change `strength = 3` to `strength = 20`
3. **Predict:** Elements will lunge 20px toward the cursor instead of subtly shifting 3px
4. **Verify:** Run `bun run dev`, move your cursor near a magnetic element, observe the exaggerated pull
5. **What you learned:** Strength controls displacement in pixels -- even small values create noticeable effects
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-actions]] because all three are Svelte actions with the same lifecycle pattern
- **Related:** [[reduced-motion-accessibility]] because all three check `isPrefersReducedMotion()` before running
- **Related:** [[entrance-animations]] because these are interaction effects, while reveal is an entrance effect -- different triggers, same action pattern
- **Related:** [[gsap-fundamentals]] because tilt and magnetic use pure CSS transitions, while boop uses CSS and ripple uses raw DOM -- showing that not every motion effect needs GSAP

## Knowledge Check

1. Why is tilt disabled on touch devices? → See [Common Mistakes](#common-mistakes)
2. What is the dead zone in the tilt action and why does it exist? → See [Worked Example](#worked-example)
3. How does magnetic strength decrease with distance? → See [The Mental Model](#the-mental-model)
4. What happens to the ripple `<span>` after the animation completes? → See [The Mental Model](#the-mental-model)
5. Which of the three actions creates new DOM elements? → See [What It Is](#what-it-is)

## Go Deeper

- [CSS perspective and 3D transforms (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/perspective)
- [Mouse event coordinates explained (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX)
- [Material Design ripple spec](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
