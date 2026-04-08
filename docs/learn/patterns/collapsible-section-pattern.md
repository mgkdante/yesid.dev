---
title: "Collapsible Section Pattern"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[css-grid-layout]]"
date: 2026-04-08
---

# Collapsible Section Pattern


## The Analogy

Think of an expandable SQL result set in a management tool like SSMS or pgAdmin. You run a query and see the summary row. Click the expand arrow and the full detail rows appear with a smooth expansion. Click again and they collapse. The parent query window can also control expansion -- "Expand All" or "Collapse All" toggles every result set at once. The collapsible section pattern works the same way: a component that expands and collapses with smooth animation, and a parent that can control the open/close state from the outside using two-way binding.

## What It Is

The collapsible section pattern solves two problems at once:

1. **Smooth height animation.** CSS cannot animate `height: auto` -- it needs a concrete start and end value. The trick is to use CSS Grid: `grid-template-rows: 0fr` (collapsed) transitions smoothly to `grid-template-rows: 1fr` (expanded). The inner element has `overflow: hidden; min-height: 0` so content clips cleanly during the transition.

2. **Two-way open state.** The `open` prop uses Svelte 5's `$bindable()`, which means the parent can read and write the open state. The child can toggle itself (clicking the header), and the parent can force open/close from outside (a "Collapse All" button). Both stay in sync automatically.

In SQL terms, `$bindable` is like a bidirectional foreign key -- changes propagate in both directions. The child updates `open` when the user clicks; the parent updates `open` when it needs to sync multiple sections.

## Why It Matters

"How do you animate height in CSS?" is a deceptively tricky interview question. The naive answer (`transition: height`) does not work with `auto`. The real answer -- CSS Grid `grid-template-rows` -- shows you understand CSS layout at a deeper level. Combined with the `$bindable` two-way binding pattern, this demonstrates both CSS mastery and framework-level state management.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/CollapsibleSection.svelte` | Lines 129-139: CSS grid animation | The core height animation technique |
| `src/lib/components/CollapsibleSection.svelte` | Line 10: `open = $bindable(true)` | Two-way binding declaration |
| `src/lib/components/WorkDetailPage.svelte` | Line 31: `let readmeOpen = $state(true)` | Parent owns the state |
| `src/lib/components/WorkDetailPage.svelte` | Line 130: `bind:open={readmeOpen}` | Parent binds to child's open state |
| `src/lib/components/FilterGroup.svelte` | Lines 63-71: collapsible filter groups | Same expand/collapse pattern reused in a different context |

## The Mental Model

```
The CSS Grid height animation trick:

COLLAPSED (grid-template-rows: 0fr)
┌──────────────────────────────────┐
│ Header: "Repository README"  [>] │
├──────────────────────────────────┤
│ Grid row = 0fr                   │  ← row has zero height
│ ┌──────────────────────────────┐ │
│ │ Content (overflow: hidden)   │ │  ← content exists but is clipped
│ │ min-height: 0                │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

        ↕ transition: grid-template-rows 0.3s ease

EXPANDED (grid-template-rows: 1fr)
┌──────────────────────────────────┐
│ Header: "Repository README"  [v] │
├──────────────────────────────────┤
│ Grid row = 1fr                   │  ← row takes natural height
│ ┌──────────────────────────────┐ │
│ │ Content (overflow: hidden)   │ │  ← content fully visible
│ │ Full README text here...     │ │
│ │ With all the paragraphs...   │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘


Two-way binding flow:

WorkDetailPage                    CollapsibleSection
┌─────────────────┐               ┌─────────────────┐
│ readmeOpen       │◄─────────────►│ open ($bindable) │
│ = $state(true)  │  bind:open     │                 │
└────────┬────────┘               └────────┬────────┘
         │                                 │
    Parent can                        Child can
    set readmeOpen                    toggle open
    to sync ToC                       via click
```

## Worked Example

```svelte
<!-- From: src/lib/components/CollapsibleSection.svelte -->
<!-- The complete expand/collapse mechanism: -->

<script lang="ts">
  let {
    title,
    // Step 1: $bindable makes this prop two-way.
    // Parent can bind:open={parentState} to read AND write.
    // Default is true (open on mount).
    open = $bindable(true),
    collapsible = true,
    children
  }: {
    title: string;
    open?: boolean;
    collapsible?: boolean;
    children?: Snippet;
  } = $props();

  // Step 2: Toggle function -- mutates open directly.
  // Because open is $bindable, this change propagates to the parent.
  function toggle() {
    if (collapsible) open = !open;
  }
</script>

<!-- Step 3: Button with aria-expanded for accessibility -->
<button aria-expanded={open} onclick={toggle}>
  {title}
  <svg class:rotated={open}><!-- chevron --></svg>
</button>

<!-- Step 4: The grid animation container -->
<div class="section-body" class:expanded={open}>
  <div class="min-h-0 overflow-hidden">
    <div class="px-6 pb-6 pt-3">
      {@render children()}
    </div>
  </div>
</div>

<style>
  /* Step 5: The CSS that makes it work */
  .section-body {
    display: grid;
    grid-template-rows: 0fr;           /* Collapsed: zero height */
    transition: grid-template-rows 0.3s ease;
  }
  .section-body.expanded {
    grid-template-rows: 1fr;           /* Expanded: natural height */
  }
  .section-body > div {
    overflow: hidden;                  /* Clips content during transition */
  }
</style>
```

The magic is in three CSS properties working together: `grid-template-rows` animates between `0fr` and `1fr`, `overflow: hidden` on the inner div clips the content as the row shrinks, and `min-height: 0` on the inner div allows it to shrink below its content height (without this, grid items have an implicit min-height of their content).

## Common Mistakes

1. **Trying to animate `height: auto`:** Using `transition: height 0.3s` and toggling between `height: 0` and `height: auto`.
   - **What happens:** The transition does not work. CSS cannot interpolate between a number (0) and a keyword (auto). The element jumps instantly.
   - **Fix:** Use `grid-template-rows: 0fr` / `1fr` with `transition: grid-template-rows`.
   - **Why:** `0fr` and `1fr` are both numeric grid track sizes, so CSS can interpolate between them smoothly.

2. **Forgetting `overflow: hidden` on the inner wrapper:** Skipping the `overflow: hidden` on the child of the grid row.
   - **What happens:** Content spills out below the collapsing container during the transition, overlapping other elements.
   - **Fix:** Add `overflow: hidden` to the direct child of the grid container.
   - **Why:** As `grid-template-rows` shrinks from `1fr` to `0fr`, the row gets shorter but the content inside does not shrink. `overflow: hidden` clips the excess.

3. **Forgetting `min-height: 0` on the inner wrapper:** Grid items default to `min-height: auto` (their content height).
   - **What happens:** The row cannot shrink below the content height. The collapse animation stops partway and the section never fully closes.
   - **Fix:** Add `min-height: 0` to the inner wrapper.
   - **Why:** CSS Grid spec says items have `min-height: auto` by default, which prevents them from being smaller than their content. `min-height: 0` overrides this.

4. **Using a regular prop instead of `$bindable`:** Declaring `open` as a normal prop.
   - **What happens:** The parent cannot read the current open state. Features like "sync ToC visibility with README section" break because the parent's state goes out of sync with the child's.
   - **Fix:** Use `open = $bindable(true)` and `bind:open={parentState}` in the parent.
   - **Why:** Two-way binding keeps parent and child in lockstep, like a foreign key constraint that enforces referential integrity in both directions.

## Break It to Learn It

### Exercise 1: Remove the grid animation
1. Open `src/lib/components/CollapsibleSection.svelte`
2. In the `<style>` block, change `.section-body { display: grid; ... }` to `display: block;` and remove the `grid-template-rows` and transition rules
3. **Predict:** Will the section still expand/collapse? Will it animate?
4. **Verify:** Run `bun run dev`, open a work detail page, click a section header
5. **What you learned:** Without CSS Grid, the content appears/disappears instantly (no smooth animation)
6. **Undo your change**

### Exercise 2: Break the two-way binding
1. Open `src/lib/components/CollapsibleSection.svelte`
2. Change `open = $bindable(true)` to just `open = true` (remove `$bindable`)
3. **Predict:** What will happen on the work detail page when you collapse the README section? Will the ToC in the left margin know about it?
4. **Verify:** Run `bun run dev`, open a work detail page with a README, collapse the README section, check if the desktop ToC sidebar changes
5. **What you learned:** Without `$bindable`, the parent's `readmeOpen` state stays `true` even when the child toggles to closed -- the parent and child are out of sync
6. **Undo your change**

### Exercise 3: Remove min-height: 0
1. Open `src/lib/components/CollapsibleSection.svelte`
2. In the `<style>` block, remove `overflow: hidden` from `.section-body > div`
3. **Predict:** What will happen during the collapse animation?
4. **Verify:** Run `bun run dev`, toggle a collapsible section and watch the content during the animation
5. **What you learned:** Without `overflow: hidden`, content spills out of the collapsing container and overlaps elements below
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because the CollapsibleSection is a Svelte component with props
- **Depends on:** [[css-grid-layout]] because the animation technique uses CSS Grid track sizing
- **Related:** [[data-driven-components]] because the section content is passed via typed props, not hardcoded
- **Related:** [[filter-reset-pattern]] because FilterGroup uses the same collapsible pattern for filter categories

## Knowledge Check

1. Why can't you animate `height: auto` with CSS transitions? -> See [Common Mistakes](#common-mistakes)
2. What three CSS properties make the grid height animation work? -> See [Worked Example](#worked-example)
3. What does `$bindable()` give you that a regular prop does not? -> See [The Mental Model](#the-mental-model)
4. What happens if you forget `overflow: hidden` on the inner wrapper? -> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Svelte $bindable Documentation](https://svelte.dev/docs/svelte/$bindable)
- [CSS Tricks: Animating CSS Grid](https://css-tricks.com/animating-css-grid-how-to-examples/)
