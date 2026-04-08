---
title: "Filter Reset Pattern"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[svelte-5-runes]]"
date: 2026-04-08
---

# Filter Reset Pattern


## The Analogy

Imagine a dashboard with dropdown filters -- filter by region, filter by product, filter by date. Each filter narrows the results. There is a "Clear All Filters" button that resets every dropdown to "All." In SQL, this is trivial: you just re-run the base query without WHERE clauses. But in a reactive UI, clearing filters sets all values back to `null` -- and the system thinks "nothing changed, the values were already the defaults before the user ever touched them." The UI does not refresh. The filter-reset pattern is the solution: a counter that you increment on reset, forcing the reactive system to re-evaluate even when the filter values look the same as the defaults.

## What It Is

The filter-reset pattern uses a `batchFired` counter variable that is read inside a `$effect`. When the "clear all" button is clicked, the filter values reset to `null` AND `batchFired` increments. The `$effect` depends on both the filtered results and the `batchFired` counter. Even if the filtered results look identical to the default state, the changed counter forces the effect to re-run, which resets DOM elements (like opacity and transforms) that were set by animations.

This pattern exists because of a specific interaction between GSAP batch animations and Svelte reactivity. GSAP `ScrollTrigger.batch()` with `once: true` animates elements into view exactly once on page load. After that, the batch will never fire again. When filters change and Svelte re-renders the list, the new DOM elements inherit the CSS default `opacity: 0` (set for the batch to animate from), but the batch has already fired and will not animate them in. The `$effect` with `batchFired` catches this and manually resets the elements to visible.

## Why It Matters

"How do you handle filter state in a reactive framework?" is a common interview question. The naive answer is "just set the values back to null." The real answer requires understanding that reactive systems optimize by skipping updates when values have not changed. Knowing how to force re-evaluation -- without hacks like random state or timeouts -- shows you understand reactivity at a deeper level.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/WorkListingPage.svelte` | Lines 146-158: `batchFired` variable and `$effect` | The core pattern implementation |
| `src/lib/components/WorkListingPage.svelte` | Lines 174-184: `ScrollTrigger.batch()` with `once: true` | The initial batch animation that only fires once |
| `src/lib/components/WorkListingPage.svelte` | Lines 243-249: "clear filters" button | The trigger that resets filter state |
| `src/lib/components/WorkListingPage.svelte` | Lines 310-313: CSS `opacity: 0` on batch items | The CSS that causes elements to be invisible until animated |

## The Mental Model

```
Timeline of events:

1. Page loads
   ┌──────────────────────────────────────────┐
   │ ScrollTrigger.batch() fires              │
   │ → Elements animate from opacity:0 to 1   │
   │ → batchFired = true                      │
   │ → once:true means batch never fires again │
   └──────────────────────────────────────────┘

2. User selects filter "SQL"
   ┌──────────────────────────────────────────┐
   │ filteredProjects changes (3 of 6 shown)  │
   │ → $effect runs (filteredProjects changed) │
   │ → batchFired is true                     │
   │ → New DOM elements get opacity:1 manually │
   └──────────────────────────────────────────┘

3. User clicks "Clear All Filters"
   ┌──────────────────────────────────────────┐
   │ Filters reset to null                    │
   │ filteredProjects = all 6 projects again  │
   │ → $effect runs (filteredProjects changed) │
   │ → batchFired is true                     │
   │ → All DOM elements get opacity:1 manually │
   └──────────────────────────────────────────┘

   Without batchFired:
   ┌──────────────────────────────────────────┐
   │ New elements stuck at opacity:0           │
   │ Batch already fired (once:true)          │
   │ No mechanism to make them visible        │
   │ → INVISIBLE CARDS                        │
   └──────────────────────────────────────────┘
```

The `batchFired` flag acts as a state machine: `false` means "let the batch handle visibility" and `true` means "the $effect must handle visibility for any new elements."

## Worked Example

```typescript
// From: src/lib/components/WorkListingPage.svelte
// The batch + reset pattern in context:

// Step 1: Track whether the initial batch animation has fired
let batchFired = false;

// Step 2: Effect that runs on EVERY filter change
$effect(() => {
  // Reading filteredProjects makes this effect depend on filter changes
  filteredProjects;

  // Only act after the initial batch has fired
  if (batchFired && typeof document !== 'undefined') {
    // Step 3: On next frame, make all batch items visible
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('[data-batch="work-item"]').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }
});

// Step 4: In onMount, the batch fires once and flips the flag
onMount(() => {
  ScrollTrigger.batch('[data-batch="work-item"]', {
    start: 'top 85%',
    onEnter: (batch) => {
      batchFired = true;  // Flag flipped -- $effect now handles visibility
      gsap.fromTo(batch,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }
      );
    },
    once: true  // Never fires again
  });
});
```

The flow: batch fires once on load, sets `batchFired = true`. After that, every filter change triggers the `$effect`, which manually sets `opacity: 1` on all batch items. Without this, elements created after the batch (by filter changes) would stay invisible.

## Common Mistakes

1. **Relying on the batch to re-fire:** Assuming `ScrollTrigger.batch()` will re-animate elements after a filter change.
   - **What happens:** Elements appear invisible because the batch has `once: true` and already fired.
   - **Fix:** Use the `batchFired` flag pattern with a `$effect` that resets visibility manually.
   - **Why:** `once: true` is correct for entrance animations -- you do not want cards re-animating every time the user scrolls. The tradeoff is that new elements need manual visibility.

2. **Forgetting `requestAnimationFrame`:** Setting opacity directly in the `$effect` without waiting for the DOM update.
   - **What happens:** The effect runs before Svelte has finished rendering the new elements, so `querySelectorAll` finds zero elements.
   - **Fix:** Wrap the visibility reset in `requestAnimationFrame()` to run after the browser has painted.
   - **Why:** Svelte schedules DOM updates asynchronously. The `$effect` fires when the reactive state changes, but the DOM has not updated yet.

3. **Not guarding with `typeof document`:** Accessing `document` without checking for SSR.
   - **What happens:** Server-side rendering crashes because `document` does not exist on the server.
   - **Fix:** Guard with `typeof document !== 'undefined'`.
   - **Why:** SvelteKit renders pages on the server first. Any DOM access must be guarded.

## Break It to Learn It

### Exercise 1: See invisible cards
1. Open `src/lib/components/WorkListingPage.svelte`
2. Comment out the entire `$effect(() => { ... })` block (lines 148-158)
3. **Predict:** What will happen when you select a filter and then clear it?
4. **Verify:** Run `bun run dev`, go to `/work`, select a service filter, then click "clear filters"
5. **What you learned:** Without the effect, new DOM elements after filter changes stay at `opacity: 0` because the batch already fired
6. **Undo your change**

### Exercise 2: Remove the requestAnimationFrame
1. Open `src/lib/components/WorkListingPage.svelte`
2. In the `$effect`, remove the `requestAnimationFrame` wrapper -- just run the `forEach` directly
3. **Predict:** Will the cards still become visible? Will there be a timing issue?
4. **Verify:** Run `bun run dev`, apply and clear filters rapidly on `/work`
5. **What you learned:** The `requestAnimationFrame` ensures the DOM has updated before we query it
6. **Undo your change**

### Exercise 3: Trace the CSS that causes the problem
1. Open `src/lib/components/WorkListingPage.svelte`
2. Find the CSS rule `:global([data-batch="work-item"]) { opacity: 0; }` (line 312)
3. Comment it out
4. **Predict:** What will happen to the entrance animation on page load?
5. **Verify:** Run `bun run dev`, reload `/work` and watch the cards appear
6. **What you learned:** The `opacity: 0` CSS is what makes the batch animation possible (elements start invisible, batch animates them in), but it is also what causes the filter-reset problem
7. **Undo your change**

## Connections

- **Depends on:** [[svelte-5-runes]] because `$effect` and `$derived` are the reactive primitives that power this pattern
- **Related:** [[data-driven-components]] because the filtered list is a data-driven rendering of the projects array
- **Related:** [[entrance-animation-guard]] because both patterns manage the interaction between GSAP animations and component state

## Knowledge Check

1. Why does `ScrollTrigger.batch()` use `once: true`? -> See [The Mental Model](#the-mental-model)
2. What problem does `batchFired` solve that simply resetting filter values does not? -> See [What It Is](#what-it-is)
3. Why is `requestAnimationFrame` needed inside the `$effect`? -> See [Common Mistakes](#common-mistakes)
4. What CSS rule causes elements to start invisible? -> See [How We Use It in This Project](#how-we-use-it-in-this-project)

## Go Deeper

- [Svelte $effect Documentation](https://svelte.dev/docs/svelte/$effect)
- [GSAP ScrollTrigger.batch()](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch()/)
