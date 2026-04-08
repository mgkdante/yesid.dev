---
title: "Reduced Motion Accessibility"
domain: motion
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - motion
  - beginner
date: 2026-04-08
---

# Reduced Motion Accessibility


## The Analogy

Respecting `prefers-reduced-motion` is like using a SQL `READ UNCOMMITTED` isolation hint -- it respects the user's preference for how data is delivered. Just as a DBA might set a lower isolation level for a user who values speed over consistency, the browser exposes a setting where users say "I prefer less motion." Every animation in the project checks this preference before running, and if the user has opted out, content appears instantly without motion.

## What It Is

**`prefers-reduced-motion`** is an operating system setting that users can enable to reduce or eliminate animations across all applications. It exists because:

- Some users experience motion sickness, dizziness, or seizures from animated content
- Some users have vestibular disorders where screen motion causes physical discomfort
- Some users simply find animations distracting or prefer a calmer interface

The browser exposes this OS setting via a CSS media query: `@media (prefers-reduced-motion: reduce)`. JavaScript can check it with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

This project provides two ways to check the preference:

1. **`prefersReducedMotion` store** (reactive): A Svelte readable store that updates automatically when the user changes their OS setting mid-session. Used in Svelte components that need reactive subscriptions.

2. **`isPrefersReducedMotion()` function** (synchronous): A one-time boolean check. Used in Svelte actions (plain TypeScript functions) that need a quick yes/no at creation time.

The critical principle: **reduced motion means "show content without animation," NOT "hide content."** If an element starts at `opacity: 0` for an entrance animation, reduced motion must set it to `opacity: 1` immediately. Otherwise, the user sees a blank page.

## Why It Matters

Accessibility is a legal requirement in many jurisdictions (ADA in the US, EAA in the EU). Beyond compliance, it is a quality signal: if a developer handles reduced motion correctly, it shows attention to user experience. In interviews, "How do you handle users who prefer reduced motion?" is a common accessibility question. The answer should be: "Check the media query before running any animation, and ensure content is visible regardless."

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/stores/reducedMotion.ts` | `prefersReducedMotion` store and `isPrefersReducedMotion()` function | Central source of truth for the preference, used by every motion file |
| `src/lib/motion/actions/reveal.ts` | Lines 43-46: early return with `opacity: '1'` | Shows the "make content visible" pattern for entrance animations |
| `src/lib/motion/actions/boop.ts` | Line 23: early return with no-op handlers | Shows the simplest guard: do nothing if reduced motion is on |
| `src/lib/motion/actions/tilt.ts` | Line 27: combined check with `isTouchDevice()` | Shows combining accessibility with device capability checks |
| `src/lib/motion/components/LottiePlayer.svelte` | Lines 57-59: `goToAndStop(0, true)` | Shows showing first frame as static image for Lottie |
| `src/lib/components/SkillsJourney.svelte` | Reduced motion fallback: vertical stack, no SplitText | Shows a complete layout fallback when motion is disabled |

## The Mental Model

```
User's OS Setting:
  Windows: Settings → Accessibility → Visual effects → Animation effects: OFF
  macOS:   System Settings → Accessibility → Display → Reduce motion: ON
  Linux:   gtk-enable-animations=false or browser setting
      │
      ▼
Browser exposes:
  window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
      │
      ├───────────────────────────────────────┐
      │                                       │
      ▼                                       ▼
  Svelte store (reactive):              Function (one-time):
  prefersReducedMotion                  isPrefersReducedMotion()
  Updates if user toggles               Returns boolean at call time
  setting mid-session                   Used in Svelte actions
      │                                       │
      ▼                                       ▼
  Components subscribe:                 Actions check at creation:
  {#if $prefersReducedMotion}           if (isPrefersReducedMotion()) {
    <static layout>                       node.style.opacity = '1';
  {:else}                                  return { update(){}, destroy(){} };
    <animated layout>                    }
  {/if}


CRITICAL RULE:
  Animation disabled ≠ Content hidden

  WRONG:                           RIGHT:
  if (reducedMotion) return;       if (reducedMotion) {
  // Element stays at opacity:0      node.style.opacity = '1';
  // User sees blank page             node.style.transform = '';
                                      return noopHandlers;
                                   }
                                   // User sees content immediately
```

## Worked Example

```typescript
// From: src/lib/motion/stores/reducedMotion.ts
// Two interfaces: a reactive store and a synchronous function.

import { readable } from 'svelte/store';

const QUERY = '(prefers-reduced-motion: reduce)';

function getInitialValue(): boolean {
  // SSR safety: window does not exist on the server
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

// REACTIVE STORE: subscribes to OS setting changes
export const prefersReducedMotion = readable<boolean>(getInitialValue(), (set) => {
  if (typeof window === 'undefined') return;

  const mql = window.matchMedia(QUERY);

  // Listen for changes: user toggles setting while page is open
  const handler = (e: MediaQueryListEvent) => set(e.matches);
  mql.addEventListener('change', handler);

  // Cleanup: remove listener when last subscriber unsubscribes
  return () => mql.removeEventListener('change', handler);
});

// SYNCHRONOUS FUNCTION: one-time check for Svelte actions
export function isPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}
```

The two exports serve different purposes:

- **Store (`prefersReducedMotion`):** Used in `.svelte` files with `$prefersReducedMotion`. If the user toggles their OS setting mid-session, the store updates and all subscribed components re-render. This is like a live query that re-executes when the underlying data changes.

- **Function (`isPrefersReducedMotion()`):** Used in Svelte actions (`boop.ts`, `reveal.ts`, etc.) which are plain TypeScript -- they cannot subscribe to stores. The function reads the current value once. This is like a `SELECT` that returns a snapshot.

```typescript
// From: src/lib/motion/actions/reveal.ts (lines 42-47)
// The most important pattern: ensure content is visible when animation is skipped.

export function reveal(node: HTMLElement, params: RevealParams = {}) {
  if (isPrefersReducedMotion()) {
    // DO NOT just return. The GSAP from() below would set opacity:0.
    // Without this explicit reset, the element stays invisible.
    node.style.opacity = '1';
    node.style.transform = '';
    return { update() {}, destroy() {} };
  }
  // ... animation code runs only when motion is allowed
}
```

## Common Mistakes

1. **Returning early without making content visible:** Writing `if (reducedMotion) return { ... }` without resetting opacity or transforms.
   - **What happens:** The GSAP `from()` that follows would have set `opacity: 0`. By returning early, the element stays at whatever CSS default it has -- which might be `opacity: 0` from a parent animation, leaving content invisible.
   - **Fix:** Before returning, set `node.style.opacity = '1'` and `node.style.transform = ''` to ensure the element is fully visible.
   - **Why:** The user opted out of motion, not out of content. A blank page is an accessibility failure, not an accessibility feature.

2. **Only checking once at page load:** Reading the preference once and caching it, never updating.
   - **What happens:** If the user toggles their OS setting while the page is open, the page does not respond. Animations continue (or remain disabled) based on the stale value.
   - **Fix:** Use the `prefersReducedMotion` store for components, which subscribes to `matchMedia` change events. The function `isPrefersReducedMotion()` is for actions that only run once at creation time, which is acceptable because actions are re-created on re-mount.
   - **Why:** The OS setting is dynamic. Respecting it means listening for changes, not just reading once.

3. **Checking reduced motion too late:** Setting up GSAP plugins, ScrollTriggers, and event listeners before checking the preference.
   - **What happens:** Wasted CPU and memory on setup that will never be used. GSAP plugins are registered, ScrollTrigger instances are created, DOM listeners are attached -- all for an animation that will not run.
   - **Fix:** Check `isPrefersReducedMotion()` as the FIRST line of the action, before any setup. Return no-op handlers immediately.
   - **Why:** Reduced motion should avoid unnecessary work, not just hide the visual result. Every action in this project checks at the very top.

## Break It to Learn It

### Exercise 1: Enable reduced motion and browse the site
1. Enable reduced motion in your OS: Windows: Settings > Accessibility > Visual effects > Animation effects: OFF
2. **Predict:** All scroll reveals, boops, tilts, ripples, and Lottie animations will be disabled. Content will be immediately visible.
3. **Verify:** Run `bun run dev`, scroll through the entire site. No motion should occur, but all content should be visible.
4. **What you learned:** The site is fully usable without any animation -- motion enhances but does not gatekeep content
5. **Restore your OS setting**

### Exercise 2: Remove the reduced motion check from reveal
1. Open `src/lib/motion/actions/reveal.ts`
2. Comment out lines 43-47 (the `isPrefersReducedMotion()` block)
3. Enable reduced motion in your OS settings
4. **Predict:** Elements will still animate despite the user's preference being set
5. **Verify:** Run `bun run dev`, scroll through the page -- reveals will still fire
6. **What you learned:** Without the guard, the action ignores the user's explicit preference
7. **Undo your change and restore OS setting**

### Exercise 3: Test the store reactivity
1. Open `src/lib/motion/components/ScrollRail.svelte`
2. Notice how it uses `$prefersReducedMotion` to conditionally apply transitions
3. Run `bun run dev` with reduced motion OFF, observe the scroll rail animating
4. While the page is open, toggle reduced motion ON in your OS settings
5. **Predict:** The scroll rail will stop animating immediately without a page reload
6. **Verify:** Observe the transition class being removed in real time
7. **What you learned:** The store is reactive to OS changes -- subscribers update immediately

## Connections

- **Depends on:** none -- this is a foundational concept with no prerequisites
- **Enables:** [[entrance-animations]] because reveal checks reduced motion before animating
- **Enables:** [[tilt-magnetic-ripple]] because all three actions check reduced motion
- **Enables:** [[lottie-animations]] because LottiePlayer shows static frame when reduced motion is on
- **Enables:** [[flip-animation]] because FLIP is skipped when reduced motion is on
- **Related:** [[svelte-actions]] because actions use the synchronous `isPrefersReducedMotion()` function
- **Related:** [[gsap-fundamentals]] because GSAP animations should not run when reduced motion is on

## Knowledge Check

1. What is the difference between the `prefersReducedMotion` store and the `isPrefersReducedMotion()` function? → See [Worked Example](#worked-example)
2. Why must you set `opacity: '1'` when skipping a reveal animation? → See [Common Mistakes](#common-mistakes)
3. Where do users enable reduced motion in their OS? → See [The Mental Model](#the-mental-model)
4. Why should the reduced motion check be the FIRST thing in an action? → See [Common Mistakes](#common-mistakes)
5. What is the SSR safety guard and why does it exist? → See [Worked Example](#worked-example)

## Go Deeper

- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [web.dev: prefers-reduced-motion guide](https://web.dev/prefers-reduced-motion/)
- [WCAG 2.1 Success Criterion 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
