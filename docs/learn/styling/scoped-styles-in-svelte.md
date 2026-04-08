---
title: "Scoped Styles in Svelte"
domain: styling
difficulty: 1
difficulty_label: beginner
reading_time: 7
tags:
  - learn
  - styling
  - beginner
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Scoped Styles in Svelte


## The Analogy

Scoped styles are like table-level constraints in SQL. A `CHECK` constraint on the `orders` table only applies to `orders` -- it cannot accidentally enforce rules on the `customers` table, even if both tables have a column called `status`. Scoped styles work the same way: CSS rules inside a Svelte component's `<style>` block only apply to that component. A `.title` class in `Hero.svelte` cannot accidentally style a `.title` element in `Nav.svelte`, even though they share the same class name.

## What It Is

Every Svelte component can include a `<style>` block at the bottom of the file. CSS rules written inside this block are **scoped** -- they only affect HTML elements within that specific component. Svelte achieves this by adding a unique hash attribute (like `svelte-1abc2de`) to both the elements and the CSS selectors at compile time. The browser sees `.title.svelte-1abc2de`, which only matches elements in that one component.

This scoping is automatic. You do not need to do anything special -- just write CSS inside `<style>` and Svelte handles the isolation.

There is one escape hatch: the `:global()` modifier. Wrapping a selector in `:global()` removes the scoping hash, making the rule apply to the entire page. This is necessary when you need to style elements that Svelte did not create (like elements injected by a third-party library, or child components' internal elements).

## Why It Matters

CSS scoping solves one of the oldest problems in web development: style collisions. In traditional CSS, every rule is global. If two developers independently write `.card { padding: 1rem; }`, whichever loads last wins, and the other component breaks. Scoped styles eliminate this entirely. In interviews, you will be asked how Svelte handles CSS isolation and when you would use `:global()`. Understanding scoping is fundamental to working in any component-based framework.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | The `<style>` block with `@keyframes` and `:global()` | Defines a page transition animation and uses `:global()` to apply it to dynamic elements |
| `src/lib/components/ServiceCard.svelte` | The entire `<style>` block | Complex layout with `.service-viewport`, `.viewport-inner`, responsive overrides -- all scoped |
| `src/lib/components/ServiceListingPage.svelte` | `.scroll-area :global(.service-viewport)` | Scoped parent reaching into a child component to set `scroll-snap-align` |
| `src/lib/components/WorkListingPage.svelte` | `:global([data-batch="work-item"])` | Global selector targeting data attributes set by multiple components |
| `src/lib/components/WorkCard.svelte` | `.work-card:hover .work-card-article` | Hover state scoped to this component only -- no risk of affecting other cards elsewhere |

## The Mental Model

```
SQL Table Constraints                  Svelte Scoped Styles
─────────────────────                  ─────────────────────

CREATE TABLE orders (                  <!-- Hero.svelte -->
  status VARCHAR(20)                   <h1 class="title">Hello</h1>
  CHECK (status IN ('open','done'))    <style>
)                                        .title { color: orange; }
                                       </style>
-- This constraint ONLY affects
-- the orders table.                   → Compiled to:
                                         .title.svelte-x7k2m { color: orange; }
CREATE TABLE customers (
  status VARCHAR(20)                   <!-- Nav.svelte -->
  -- No constraint here!               <span class="title">Menu</span>
  -- orders' CHECK cannot leak here     <style>
)                                        .title { color: white; }
                                       </style>

                                       → Compiled to:
                                         .title.svelte-9p3f4 { color: white; }

                                       Result: Hero's .title is orange.
                                               Nav's .title is white.
                                               They never collide.

The :global() escape hatch:
────────────────────────────

Like sys.sp_configure — affects the entire server:

  :global(.animate-page-fade-in) {
    animation: page-fade-in 250ms;
  }

  → Compiled to (no hash!):
    .animate-page-fade-in { animation: page-fade-in 250ms; }

  This rule applies EVERYWHERE, not just in this component.
```

## Worked Example

```svelte
<!-- From: src/routes/+layout.svelte -->
<!-- This component defines a page transition animation. -->

<!-- Step 1: The template applies a class conditionally -->
<main class="{!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
  {@render children()}
</main>

<!-- Step 2: The <style> block defines the animation -->
<style>
  /* Step 2a: Define the keyframes — this is scoped by default,
     but keyframe names don't get hashed (they're global in CSS). */
  @keyframes page-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Step 2b: Use :global() because the class is applied dynamically
     and Svelte cannot see it at compile time. Without :global(),
     Svelte would add a hash that doesn't match the runtime class. */
  :global(.animate-page-fade-in) {
    animation: page-fade-in 250ms ease-out;
  }
</style>
```

Why `:global()` is needed here: Svelte scopes CSS by adding a hash to selectors at compile time. But the class `animate-page-fade-in` is applied via a dynamic expression (`{condition ? 'animate-page-fade-in' : ''}`). The compiled CSS would be `.animate-page-fade-in.svelte-abc123`, but the element gets the class without the hash. The hash mismatch means the style never applies. `:global()` removes the hash, making the selector match.

Another common pattern is scoped-parent-to-global-child:

```svelte
<!-- From: src/lib/components/ServiceListingPage.svelte -->
<style>
  /* The .scroll-area is in THIS component (gets the hash).
     But .service-viewport is in a CHILD component (ServiceCard).
     :global() lets us reach into the child. */
  .scroll-area :global(.service-viewport) {
    scroll-snap-align: start;
  }
</style>
```

This is the half-scoped pattern: `.scroll-area` is scoped (only matches in this component), but `.service-viewport` is global (matches the child component's element). The result is a rule that only applies to `.service-viewport` elements inside this specific `.scroll-area`.

## Common Mistakes

1. **Expecting scoped styles to affect child components:** Writing `.card-title { color: red }` in a parent component and expecting it to style a `<h3 class="card-title">` inside a child component.
   - **What happens:** Nothing. The scoped hash does not match the child's elements.
   - **Fix:** Use `:global(.card-title)` or the half-scoped pattern: `.parent :global(.card-title)`.
   - **Why:** Scoping is strict by design. A parent cannot accidentally break a child's styles.

2. **Overusing `:global()`:** Wrapping every selector in `:global()` because "it just works."
   - **What happens:** You lose scoping entirely. Styles leak across components, causing the exact collisions scoping prevents.
   - **Fix:** Use `:global()` only when you need to style elements outside your component. For everything else, let Svelte scope it.
   - **Why:** `:global()` is an escape hatch, not the default. Use it surgically.

3. **Mixing Tailwind and scoped styles for the same property:** Setting `padding` via both `p-4` in the class and `padding: 2rem` in `<style>`.
   - **What happens:** Specificity conflicts. The scoped style (with its hash) often wins because it has higher specificity.
   - **Fix:** Use one system per property. Tailwind for composition (spacing, typography, color). Scoped styles for structure (grid templates, complex positioning, animations).
   - **Why:** Two sources of truth for the same property creates unpredictable results.

## Break It to Learn It

### Exercise 1: See scoping in action
1. Open `src/lib/components/ServiceCard.svelte`
2. Find `.service-title` in the `<style>` block. Add `background: red;` to it
3. **Predict:** Will only the service page titles turn red, or all titles on the site?
4. **Verify:** Run `bun run dev`, navigate to `/services` and then `/blog`. Only the service titles are red.
5. **What you learned:** Scoped styles cannot leak. `.service-title` in ServiceCard.svelte only matches elements inside ServiceCard.
6. **Undo your change**

### Exercise 2: Break a :global() rule
1. Open `src/routes/+layout.svelte`
2. Change `:global(.animate-page-fade-in)` to `.animate-page-fade-in` (remove the `:global()` wrapper)
3. **Predict:** Will the page fade-in animation still work when navigating between pages?
4. **Verify:** Run `bun run dev`, navigate from `/` to `/blog`. The fade-in animation no longer plays.
5. **What you learned:** Without `:global()`, Svelte adds a hash to the selector that does not match the dynamically applied class. The animation rule exists but never matches.
6. **Undo your change**

### Exercise 3: Try scoping across components
1. Open `src/lib/components/ServiceListingPage.svelte`
2. Change `.scroll-area :global(.service-viewport)` to `.scroll-area .service-viewport` (remove `:global()`)
3. **Predict:** Will service sections still snap when scrolling?
4. **Verify:** Run `bun run dev`, open `/services`. Scroll between services -- they no longer snap to viewport boundaries.
5. **What you learned:** The half-scoped pattern (`:global()` on the child selector) is necessary to cross component boundaries. Without it, the hash mismatch prevents the rule from matching.
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because `<style>` blocks live inside Svelte component files
- **Related:** [[tailwind-utility-first]] because Tailwind handles composition while scoped styles handle structure
- **Related:** [[design-tokens]] because scoped styles consume design tokens via `var(--token)`
- **Related:** [[css-scroll-snap]] because scroll snap rules in ServiceListingPage use the half-scoped `:global()` pattern

## Knowledge Check

1. How does Svelte prevent `.title` in one component from affecting `.title` in another? → See [The Mental Model](#the-mental-model)
2. When would you use `:global()` instead of a normal scoped selector? → See [Worked Example](#worked-example)
3. What is the "half-scoped" pattern? → See [Worked Example](#worked-example)
4. Why should you avoid wrapping every selector in `:global()`? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Svelte Docs: Scoped Styles](https://svelte.dev/docs/svelte/styling)
- [MDN: CSS Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
