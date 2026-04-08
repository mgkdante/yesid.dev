---
title: "Svelte Actions"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Svelte Actions


## The Analogy

Svelte actions are like database triggers attached to a table. A trigger fires automatically when rows are inserted, updated, or deleted -- you define the behavior once, then attach it to any table. A Svelte action fires automatically when a DOM element is created, its parameters change, or it is removed. You define the behavior once in a function, then attach it to any element with `use:actionName`. Like how a trigger encapsulates side-effect logic outside the table definition, an action encapsulates DOM behavior outside the component template.

## What It Is

A Svelte action is a plain TypeScript function that receives a DOM element and optional parameters, sets up some behavior (event listeners, GSAP tweens, CSS changes), and returns an object with `update()` and `destroy()` methods for lifecycle management.

The function signature:

```typescript
function myAction(node: HTMLElement, params: MyParams) {
  // Setup: runs when the element is created and mounted in the DOM

  return {
    update(newParams: MyParams) {
      // Runs when the params change (reactive Svelte values)
    },
    destroy() {
      // Cleanup: runs when the element is removed from the DOM
    }
  };
}
```

You attach it in markup with the `use:` directive:

```svelte
<div use:myAction={{ speed: 5, color: 'red' }}>content</div>
```

The lifecycle mirrors a SQL trigger's lifecycle:
- **Creation** = `AFTER INSERT` -- runs when the element appears in the DOM
- **Update** = `AFTER UPDATE` -- runs when parameters change
- **Destroy** = `AFTER DELETE` -- runs when the element is removed

## Why It Matters

Actions solve the #1 problem of reusable DOM behavior: how do you add the same interactive effect (hover, scroll, click animation) to many different elements without copying code? Components wrap UI structure; actions wrap DOM behavior. This separation is a core Svelte pattern. In interviews, "How do you share behavior across components?" is answered with actions. Understanding actions also prepares you for React's custom hooks and Vue's directives -- same concept, different syntax.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/actions/boop.ts` | Full action with `mouseenter` listener, `update`, `destroy` | The clearest, simplest action in the project -- pure DOM, no GSAP dependency |
| `src/lib/motion/actions/reveal.ts` | Action with GSAP ScrollTrigger setup and `tween.kill()` cleanup | Shows how actions compose with external libraries |
| `src/lib/motion/actions/tilt.ts` | Action with `mousemove` + `mouseleave` listeners | Shows continuous tracking (not just fire-once) |
| `src/lib/motion/actions/magnetic.ts` | Action with distance-based activation | Shows math-driven behavior gated by a radius |
| `src/lib/motion/actions/ripple.ts` | Action that creates and removes DOM elements | Shows dynamic element creation inside an action |

## The Mental Model

```
SQL Trigger                          Svelte Action
─────────────────────────────────    ─────────────────────────────────
CREATE TRIGGER track_order           export function boop(node, params)
  AFTER INSERT ON orders             {
  FOR EACH ROW                         // Setup: add event listener
  BEGIN                                node.addEventListener('mouseenter',
    INSERT INTO audit_log ...            applyBoop);
  END;
                                       return {
                                         update(newParams) {
ALTER TRIGGER track_order ...            // Params changed at runtime
                                         },
                                         destroy() {
DROP TRIGGER track_order;                  // Remove listener, free memory
                                           node.removeEventListener(
                                             'mouseenter', applyBoop);
                                         }
                                       };
                                     }

Attach to any table:                 Attach to any element:
  orders → track_order                 <button use:boop={{ scale: 1.1 }}>
  inventory → track_order              <div use:boop={{ rotation: 5 }}>
```

**Key insight:** Actions do not own the element. They add behavior to it. The element's structure (classes, children, content) is defined in the component template. The action only manages its side effects (listeners, styles, timers). When the element is removed, `destroy()` cleans up.

## Worked Example

```typescript
// From: src/lib/motion/actions/boop.ts
// A boop is a brief transform burst on hover -- like tapping a physical button.

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

export interface BoopParams {
  scale?: number;    // Scale multiplier. Default: 1.05
  rotation?: number; // Rotation in degrees. Default: 0
  timing?: number;   // Duration in ms. Default: 300
}

export function boop(node: HTMLElement, params: BoopParams = {}) {
  // Step 1: Check accessibility preference FIRST
  if (isPrefersReducedMotion()) return { update() {}, destroy() {} };

  // Step 2: Destructure params with defaults
  let { scale = 1.05, rotation = 0, timing = 300 } = params;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Step 3: Define the behavior
  function applyBoop() {
    if (timeoutId !== null) clearTimeout(timeoutId);

    // Build CSS transform string from params
    const parts: string[] = [];
    if (scale !== 1) parts.push(`scale(${scale})`);
    if (rotation !== 0) parts.push(`rotate(${rotation}deg)`);

    // Apply transform with a spring-like ease
    node.style.transition = `transform ${timing}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    node.style.transform = parts.join(' ') || 'none';

    // Reset after timing ms -- the boop is brief, not persistent
    timeoutId = setTimeout(() => {
      node.style.transform = '';
      timeoutId = null;
    }, timing);
  }

  // Step 4: Attach to the element
  node.addEventListener('mouseenter', applyBoop);

  // Step 5: Return lifecycle handlers
  return {
    update(newParams: BoopParams) {
      // When parent component changes props, update local config
      scale = newParams.scale ?? 1.05;
      rotation = newParams.rotation ?? 0;
      timing = newParams.timing ?? 300;
    },
    destroy() {
      // Element is leaving the DOM -- clean up everything
      node.removeEventListener('mouseenter', applyBoop);
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  };
}
```

The pattern is always the same: check accessibility, set up behavior, attach listeners, return `update` and `destroy`. The `destroy` cleanup is the most critical part -- without it, event listeners accumulate every time a component mounts/unmounts (like unclosed database connections).

## Common Mistakes

1. **Forgetting to return `update` and `destroy`:** Returning nothing from the action function.
   - **What happens:** Svelte cannot clean up when the element is removed. Event listeners, timers, and GSAP tweens leak.
   - **Fix:** Always return `{ update() {}, destroy() {} }` even if empty.
   - **Why:** The return object is the action's contract with Svelte. Without it, the framework cannot manage the action's lifecycle.

2. **Adding listeners without removing them in `destroy`:** Calling `addEventListener` but forgetting the matching `removeEventListener`.
   - **What happens:** Each mount adds a new listener. After navigating back and forth 10 times, the element has 10 duplicate listeners firing on every event.
   - **Fix:** Store a reference to the handler function and remove it in `destroy()`.
   - **Why:** Same as closing connections in a connection pool -- each unclosed handle is a resource leak.

3. **Running expensive setup when reduced motion is on:** Registering GSAP plugins, creating ScrollTriggers, or adding listeners for animations that will never run.
   - **What happens:** Wasted CPU and memory on motion that the user explicitly opted out of.
   - **Fix:** Check `isPrefersReducedMotion()` at the top of the action and return early with no-op handlers.
   - **Why:** Accessibility is not just about the visible result -- it's also about not doing unnecessary work.

## Break It to Learn It

### Exercise 1: Break the destroy cleanup
1. Open `src/lib/motion/actions/boop.ts`
2. In the `destroy()` method (line 53), comment out `node.removeEventListener('mouseenter', applyBoop)`
3. **Predict:** The boop effect will persist even after the element should have cleaned up
4. **Verify:** Run `bun run dev`, navigate to a page with booped elements, navigate away and back, hover and check if the effect fires multiple times
5. **What you learned:** Without cleanup, actions accumulate side effects across component lifecycles
6. **Undo your change**

### Exercise 2: Modify boop params at runtime
1. Open any component that uses `use:boop` (e.g., `src/lib/components/ServiceStation.svelte`)
2. Change the boop params to extreme values: `use:boop={{ scale: 2.0, rotation: 45, timing: 1000 }}`
3. **Predict:** The element will grow to 2x size and rotate 45 degrees, holding for a full second
4. **Verify:** Run `bun run dev`, hover over the element, observe the exaggerated effect
5. **What you learned:** Action params flow from the template -- you control behavior without touching the action code
6. **Undo your change**

### Exercise 3: Add a new action feature
1. Open `src/lib/motion/actions/boop.ts`
2. Add a `translateY` option: in `BoopParams`, add `translateY?: number` (default 0)
3. In `applyBoop`, add: `if (translateY !== 0) parts.push(\`translateY(${translateY}px)\`)`
4. **Predict:** Elements with `use:boop={{ translateY: -5 }}` will hop upward on hover
5. **Verify:** Test on any booped element by adding the new param
6. **What you learned:** Actions are extensible -- adding behavior means adding params, not rewriting
7. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because actions attach to elements created by Svelte components
- **Enables:** [[entrance-animations]] because `use:reveal` is a Svelte action
- **Enables:** [[tilt-magnetic-ripple]] because all three are Svelte actions
- **Related:** [[reduced-motion-accessibility]] because every action checks reduced motion preference
- **Related:** [[gsap-fundamentals]] because some actions use GSAP internally (reveal) while others use pure CSS (boop)

## Knowledge Check

1. What are the three lifecycle stages of a Svelte action? → See [What It Is](#what-it-is)
2. Why must every `addEventListener` have a matching `removeEventListener` in `destroy`? → See [Common Mistakes](#common-mistakes)
3. What is the `use:` directive? → See [What It Is](#what-it-is)
4. Why check `isPrefersReducedMotion()` at the top of every action? → See [Common Mistakes](#common-mistakes)
5. How do you pass parameters to an action? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [Svelte actions documentation](https://svelte.dev/docs/svelte/use)
- [Svelte tutorial: actions](https://learn.svelte.dev/tutorial/actions)
- [Josh Comeau's boop tutorial](https://www.joshwcomeau.com/react/boop/) (React version, same concept)
