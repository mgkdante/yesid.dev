---
title: "Action Pattern"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[svelte-actions]]"
date: 2026-04-08
---

# Action Pattern


## The Analogy

A Svelte action is like a database trigger. In SQL, you write `CREATE TRIGGER after_insert ON orders` and the database attaches behavior to a table automatically -- firing on insert, updating on change, cleaning up when the row is deleted. A Svelte action attaches behavior to a DOM element: it runs setup when the element mounts, can update when parameters change, and runs cleanup when the element is destroyed. You write `use:boop={{ scale: 1.05 }}` on an element, and the action handles the rest -- including removing event listeners when the element leaves the page.

## What It Is

An action is a function that takes a DOM element and optional parameters, then returns an object with `update()` and `destroy()` methods. Svelte calls your function when the element is created, calls `update()` when the parameters change, and calls `destroy()` when the element is removed from the DOM. This lifecycle mirrors SQL trigger events: INSERT (create), UPDATE (change), DELETE (destroy).

Actions are the standard Svelte pattern for attaching imperative behavior -- things like animations, intersection observers, scroll listeners, or drag handlers -- to elements declaratively. Instead of scattering `addEventListener` calls in `onMount` and remembering to clean up in the return function, you encapsulate the full lifecycle in one reusable function.

## Why It Matters

Every frontend framework has a version of this problem: how do you reuse imperative DOM behavior across components? React uses custom hooks. Angular uses directives. Svelte uses actions. In interviews, being able to explain "I encapsulated the behavior in a reusable action with proper cleanup" shows you understand lifecycle management, memory leak prevention, and separation of concerns.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/boop.ts` | Full action implementation (57 lines) | The simplest action -- shows the complete lifecycle pattern |
| `src/lib/motion/actions/reveal.ts` | ScrollTrigger integration in an action | Shows how actions wrap complex library setup with automatic cleanup |
| `src/lib/components/ServiceStation.svelte` | Lines 87-88, 95: `use:reveal`, `use:tilt`, `use:boop` | Three actions on one page, each handling its own lifecycle |
| `src/lib/components/FilterGroup.svelte` | Line 79, 89: `use:ripple` | Actions work on any element type, including buttons |

## The Mental Model

```
SQL Trigger Lifecycle             Svelte Action Lifecycle
---------------------             -----------------------

CREATE TRIGGER                    export function boop(node, params) {
  ON orders                         // runs when element is created
  AFTER INSERT                      node.addEventListener('mouseenter', ...)
                                    
  -- fires on each update           return {
  FOR EACH ROW                        update(newParams) {
    UPDATE inventory ...                // runs when params change
                                      },

  -- cleanup on delete                destroy() {
  ON DELETE CASCADE                     node.removeEventListener(...)
                                        clearTimeout(...)
                                      }
                                    }
                                  }

-- Usage:                         <!-- Usage: -->
-- Trigger is automatic           <button use:boop={{ scale: 1.05 }}>
-- after table attachment           Click me
                                  </button>
```

The key insight: you never call `boop()` manually. Svelte calls it when the element mounts. You never call `destroy()` manually. Svelte calls it when the element is removed. Just like you never manually fire a trigger -- the database does it for you.

## Worked Example

```typescript
// From: src/lib/motion/actions/boop.ts
// A "boop" is a brief hover animation that resets itself.

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

// Step 1: Define the parameter type (like trigger parameters)
export interface BoopParams {
  scale?: number;    // How much to grow. Default: 1.05
  rotation?: number; // Degrees to rotate. Default: 0
  timing?: number;   // How long before reset, in ms. Default: 300
}

// Step 2: The action function -- receives the DOM element and params
export function boop(node: HTMLElement, params: BoopParams = {}) {
  // Step 3: Early return for accessibility (like a trigger WHEN clause)
  if (isPrefersReducedMotion()) return { update() {}, destroy() {} };

  // Step 4: Destructure with defaults
  let { scale = 1.05, rotation = 0, timing = 300 } = params;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Step 5: The behavior function
  function applyBoop() {
    if (timeoutId !== null) clearTimeout(timeoutId);
    node.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    timeoutId = setTimeout(() => {
      node.style.transform = '';  // Reset after timing ms
      timeoutId = null;
    }, timing);
  }

  // Step 6: Attach the listener (like enabling the trigger)
  node.addEventListener('mouseenter', applyBoop);

  // Step 7: Return lifecycle methods
  return {
    update(newParams: BoopParams) {
      // Like ALTER TRIGGER -- change behavior without re-creating
      scale = newParams.scale ?? 1.05;
      rotation = newParams.rotation ?? 0;
      timing = newParams.timing ?? 300;
    },
    destroy() {
      // Like DROP TRIGGER -- clean up everything
      node.removeEventListener('mouseenter', applyBoop);
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  };
}
```

The entire lifecycle is self-contained: setup, update, teardown. No component needs to know about `addEventListener` or `clearTimeout`. It just writes `use:boop={{ scale: 1.05 }}` and the action handles everything.

## Common Mistakes

1. **Forgetting to return `destroy()`:** Omitting the cleanup method.
   - **What happens:** Event listeners pile up as elements are created and destroyed during navigation. Memory leaks. Animations fire on ghost elements.
   - **Fix:** Always return `{ update() {}, destroy() {} }`. In `destroy()`, remove every listener and clear every timer.
   - **Why:** In a single-page app, elements are created and destroyed constantly. Without cleanup, every navigation leaks listeners.

2. **Returning nothing for reduced motion:** Doing `if (isPrefersReducedMotion()) return;` without a return object.
   - **What happens:** Svelte expects an object with `update` and `destroy`. Returning `undefined` crashes the app.
   - **Fix:** Return `{ update() {}, destroy() {} }` -- a no-op lifecycle object.
   - **Why:** The action contract requires a return value regardless of whether the action does anything. Like a trigger that has a WHEN clause -- it still needs valid syntax even when the condition is false.

3. **Mutating params directly:** Changing `params.scale = 2` inside the action.
   - **What happens:** The original object passed from the component is mutated, causing unpredictable behavior in other components sharing that object.
   - **Fix:** Destructure params into local variables (`let { scale } = params`). Update locals in `update()`.
   - **Why:** Immutability -- the action receives a copy, not a reference to shared state.

## Break It to Learn It

### Exercise 1: Break the cleanup
1. Open `src/lib/motion/actions/boop.ts`
2. Comment out the `node.removeEventListener('mouseenter', applyBoop);` line in `destroy()`
3. **Predict:** What will happen if you navigate away from a page with boop elements and then navigate back?
4. **Verify:** Run `bun run dev`, hover over a boop element, navigate away, navigate back, hover again. Open DevTools console and look for errors.
5. **What you learned:** Without cleanup, the old listener fires on a detached element. Proper `destroy()` prevents memory leaks.
6. **Undo your change**

### Exercise 2: Break the reduced motion guard
1. Open `src/lib/motion/actions/boop.ts`
2. Change the reduced motion return to just `return;` (remove the object)
3. **Predict:** What error will you see?
4. **Verify:** Enable "prefers reduced motion" in your OS settings, then run `bun run dev` and visit a page with boop elements
5. **What you learned:** Svelte requires the return object even when the action does nothing
6. **Undo your change**

### Exercise 3: Compare boop vs reveal lifecycle
1. Open both `src/lib/motion/actions/boop.ts` and `src/lib/motion/actions/reveal.ts` side by side
2. Compare: What does each action set up in its main body? What does each clean up in `destroy()`?
3. **Predict:** Why does `reveal` call `tween.kill()` in destroy while `boop` calls `removeEventListener`?
4. **What you learned:** Different actions clean up different resources, but the lifecycle pattern is identical

## Connections

- **Depends on:** [[svelte-actions]] because that doc covers the `use:` directive syntax
- **Enables:** [[entrance-animation-guard]] because the guard pattern extends the action lifecycle
- **Related:** [[data-driven-components]] because actions add reusable behavior to data-driven components
- **Related:** [[scroll-linked-content]] because the `reveal` action uses ScrollTrigger internally

## Knowledge Check

1. What three lifecycle methods does a Svelte action return? -> See [The Mental Model](#the-mental-model)
2. What happens if you skip `destroy()` in an action? -> See [Common Mistakes](#common-mistakes)
3. Why must you return `{ update() {}, destroy() {} }` even when reduced motion is on? -> See [Common Mistakes](#common-mistakes)
4. How is a Svelte action like a database trigger? -> See [The Analogy](#the-analogy)

## Go Deeper

- [Svelte Actions Documentation](https://svelte.dev/docs/svelte/use)
- [Josh W Comeau: Boop Animation](https://www.joshwcomeau.com/react/boop/)
