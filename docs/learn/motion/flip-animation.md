---
title: "FLIP Animation"
domain: motion
difficulty: 3
difficulty_label: advanced
reading_time: 10
tags:
  - learn
  - motion
  - advanced
prerequisites:
  - "[[gsap-fundamentals]]"
date: 2026-04-08
---

# FLIP Animation


## The Analogy

FLIP is like a database MERGE statement. A MERGE captures the state of a target table, compares it with a source, and smoothly transitions rows -- inserting new ones, removing missing ones, and updating changed ones. FLIP captures the visual state of elements before a change, lets the DOM update to its new state, calculates the difference, and animates the transition. It is the answer to "how do I smoothly animate elements when a filter changes the layout?"

## What It Is

**FLIP** stands for **F**irst, **L**ast, **I**nvert, **P**lay -- a four-step technique for animating layout changes:

1. **First:** Capture the current position and size of every element (`Flip.getState()`). This is the "before" snapshot.
2. **Last:** Make the DOM change (filter, sort, add, remove elements). Let the browser calculate new positions. This is the "after" state.
3. **Invert:** Calculate the difference between "before" and "after" positions. Apply CSS transforms to make elements appear at their old positions even though the DOM is already in the new state.
4. **Play:** Animate the transforms from the inverted (old) position to zero (new position). Elements visually slide from where they were to where they belong.

**GSAP's Flip plugin** handles steps 3 and 4 automatically. You do step 1 (capture state), step 2 (update DOM), then call `Flip.from(savedState)` and it animates the transition.

The Flip plugin also handles three special cases:
- **Entering elements** (`onEnter`): New elements that did not exist in the "before" state. These animate in (fade, scale up).
- **Leaving elements** (`onLeave`): Elements that existed "before" but are gone "after." These animate out (fade, scale down).
- **Repositioned elements:** Elements that exist in both states but moved to a different position. These slide smoothly to their new location.

## Why It Matters

Layout transition animation is one of the hardest problems in frontend development. Without FLIP, filtering a grid of cards causes jarring instant repositioning -- elements teleport instead of flowing. Every major product (Pinterest, Airbnb, Apple Music) uses FLIP-style animations for filter/sort transitions. In interviews, "How would you animate a filter change on a card grid?" is a senior-level question. FLIP is the accepted answer.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | `Flip` import and registration | Plugin must be registered before use |
| `src/lib/components/WorkListingPage.svelte` | Complete FLIP flow in `updateFilter()` (lines 72-122) | The only FLIP usage in the project -- shows the full pattern with enter/leave/reposition |

## The Mental Model

```
STEP 1: FIRST — Capture current layout
┌─────────────────────────────┐
│  [A]  [B]  [C]  [D]  [E]  │  ← Flip.getState(cards)
│  [F]  [G]  [H]             │     Saves x, y, width, height
└─────────────────────────────┘     for each [data-flip-id] element


STEP 2: LAST — Apply filter, DOM updates instantly
Filter: "only show B, D, F, H"

┌─────────────────────────────┐
│  [B]  [D]  [F]  [H]        │  ← DOM is already in final state
│                             │     A, C, E, G are gone
└─────────────────────────────┘


STEP 3 + 4: INVERT + PLAY — Flip.from(savedState)

At t=0 (inverted):                    At t=0.5s (playing):
┌─────────────────────────────┐       ┌─────────────────────────────┐
│  [A→]←[B] [C→]←[D]  [E→]  │       │  [B]  [D]  [F]  [H]        │
│ [F←]  [G→]  [H←]           │       │                             │
└─────────────────────────────┘       └─────────────────────────────┘
B appears at A's old position          B slides to its final position
D appears at C's old position          D slides to its final position
A fades out (onLeave)                  A is gone (opacity 0)
C fades out (onLeave)                  Transition complete


Like: SQL MERGE that shows you the diff animation
  - INSERT (onEnter): new elements fade in
  - DELETE (onLeave): removed elements fade out
  - UPDATE (reposition): moved elements slide
```

## Worked Example

```typescript
// From: src/lib/components/WorkListingPage.svelte (lines 72-122)
// FLIP animation on filter change for work project grid.

async function updateFilter(type: 'service' | 'tag' | 'stack', value: string | null) {
  // STEP 1: FIRST — Capture current layout
  let flipState = null;
  if (!isPrefersReducedMotion()) {
    registerGsapPlugins();
    const cards = document.querySelectorAll('[data-flip-id]');
    if (cards.length > 0) {
      flipState = Flip.getState(cards);  // Snapshot: position, size, opacity
    }
  }

  // STEP 2: LAST — Update the DOM (filter change via URL params)
  const url = new URL($page.url);
  if (value) {
    url.searchParams.set(type, value);
  } else {
    url.searchParams.delete(type);
  }
  await goto(url.toString(), { replaceState: true, noScroll: true });

  // Wait for Svelte to re-render the filtered list
  await tick();

  // STEPS 3+4: INVERT + PLAY
  if (flipState && !isPrefersReducedMotion()) {
    const cards = document.querySelectorAll('[data-flip-id]');
    const batchItems = document.querySelectorAll('[data-batch="work-item"]');

    // Clear any in-progress animations to prevent conflicts
    gsap.killTweensOf(cards);
    gsap.killTweensOf(batchItems);
    gsap.set(batchItems, { opacity: 1, y: 0 });
    gsap.set(cards, { opacity: 1, y: 0, x: 0, scale: 1 });

    Flip.from(flipState, {
      targets: cards,               // Elements to animate
      duration: 0.5,                // 500ms transition
      ease: 'power2.inOut',         // Smooth acceleration
      stagger: 0.05,                // 50ms between each card

      // New elements that weren't in the "before" state
      onEnter: (els) =>
        gsap.fromTo(els,
          { opacity: 0, scale: 0.8 },     // Start small and invisible
          { opacity: 1, scale: 1, duration: 0.5 }  // Grow and fade in
        ),

      // Elements that existed "before" but are gone "after"
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 })  // Shrink and fade out
    });
  }
}
```

The `data-flip-id` attribute is critical. It tells GSAP which element in the "after" state corresponds to which element in the "before" state. Without it, GSAP cannot match elements across the DOM change. It is like a primary key -- the `data-flip-id` value must be unique per element and consistent across re-renders.

The `await tick()` call between the DOM change and `Flip.from()` is essential. Svelte batches DOM updates, and `tick()` ensures the new layout is rendered before GSAP reads the "after" positions. Without it, GSAP would read stale positions and animate to the wrong places.

## Common Mistakes

1. **Forgetting `data-flip-id` on elements:** Elements without `data-flip-id` cannot be tracked across DOM changes.
   - **What happens:** GSAP treats every element after the change as "new" (onEnter). No smooth repositioning -- everything fades in from scratch.
   - **Fix:** Add a unique `data-flip-id` attribute to each element. Use a stable identifier (slug, ID) not an array index.
   - **Why:** FLIP needs to match "before" and "after" elements. Without an ID, it cannot determine that card B at position 2 was previously card B at position 4.

2. **Not waiting for DOM update with `await tick()`:** Calling `Flip.from()` immediately after the state change.
   - **What happens:** The DOM has not re-rendered yet. GSAP reads the old positions as "after" positions, and the animation does nothing or glitches.
   - **Fix:** `await tick()` after the state change, before calling `Flip.from()`.
   - **Why:** Svelte batches DOM updates. `tick()` returns a promise that resolves after the next DOM update cycle.

3. **Not handling reduced motion:** Running FLIP animations when the user prefers reduced motion.
   - **What happens:** Cards slide and scale for users who explicitly opted out of motion.
   - **Fix:** Check `isPrefersReducedMotion()` before capturing state and before animating. If reduced motion is on, let the DOM update instantly.
   - **Why:** FLIP is decorative motion -- it enhances the UX but is not required. Respecting the user's preference is mandatory.

## Break It to Learn It

### Exercise 1: Remove the stagger from FLIP
1. Open `src/lib/components/WorkListingPage.svelte`
2. In the `Flip.from()` call (around line 111), remove `stagger: 0.05`
3. **Predict:** All cards will animate simultaneously instead of cascading one after another
4. **Verify:** Run `bun run dev`, navigate to `/work`, change a filter, observe how all cards move at once
5. **What you learned:** Stagger creates a cascade that helps the eye track what is happening in a complex layout transition
6. **Undo your change**

### Exercise 2: Change the enter animation
1. Open `src/lib/components/WorkListingPage.svelte`
2. In the `onEnter` callback (around line 113), change `scale: 0.8` to `scale: 1.5`
3. **Predict:** New cards will start oversized and shrink to normal size instead of starting small and growing
4. **Verify:** Run `bun run dev`, apply a filter that reveals new cards, observe the reversed scaling
5. **What you learned:** `onEnter` controls how new elements appear -- the starting state defines the visual metaphor (growing in = arriving, shrinking in = condensing)
6. **Undo your change**

### Exercise 3: Remove the FLIP animation entirely
1. Open `src/lib/components/WorkListingPage.svelte`
2. Comment out the entire `if (flipState && !isPrefersReducedMotion())` block (lines 96-121)
3. **Predict:** Filter changes will cause instant, jarring layout shifts -- cards will teleport to new positions
4. **Verify:** Run `bun run dev`, navigate to `/work`, toggle filters rapidly
5. **What you learned:** Without FLIP, layout changes are disorienting -- the user cannot track which cards moved where
6. **Undo your change**

## Connections

- **Depends on:** [[gsap-fundamentals]] because Flip is a GSAP plugin that uses `gsap.fromTo()` and `gsap.to()` internally
- **Related:** [[gsap-timeline-and-stagger]] because FLIP uses stagger to cascade animations across cards
- **Related:** [[reduced-motion-accessibility]] because FLIP must be skipped for reduced motion users
- **Related:** [[entrance-animations]] because FLIP's `onEnter` is an entrance animation for newly visible elements

## Knowledge Check

1. What do the four letters in FLIP stand for? → See [What It Is](#what-it-is)
2. Why is `await tick()` necessary between the DOM change and `Flip.from()`? → See [Common Mistakes](#common-mistakes)
3. What role does `data-flip-id` play? → See [Worked Example](#worked-example)
4. What is the difference between `onEnter` and `onLeave` in FLIP? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [GSAP Flip plugin docs](https://gsap.com/docs/v3/Plugins/Flip/)
- [FLIP technique explained (Paul Lewis)](https://aerotwist.com/blog/flip-your-animations/)
- [GSAP Flip demos](https://gsap.com/docs/v3/Plugins/Flip/#demos)
