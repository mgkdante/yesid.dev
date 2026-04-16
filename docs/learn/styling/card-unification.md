---
title: "Card Unification: Wrapper Pattern for Svelte Actions"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - styling
  - intermediate
  - svelte
  - components
  - design-system
prerequisites:
  - "[[svelte-actions]]"
  - "[[brand-primitives]]"
  - "[[svelte-components]]"
date: 2026-04-16
---

# Card Unification: Wrapper Pattern for Svelte Actions

## The Analogy

Imagine you have a standardized shipping container (the Card component) and a label printer that can only attach labels to physical surfaces (Svelte `use:` actions). You cannot attach a label to a blueprint of a container — only to the real thing. So when you need both a standard container and a label, you place the container inside a dock cradle (a wrapper `<div>`), attach the label to the cradle, and the container sits inside it. The cradle is invisible to the end user, but it gives the label printer a surface to work with.

## What It Is

In Svelte, `use:` directives (actions) can only be applied to native HTML elements — not to components. This is a fundamental limitation: `<Card use:boop>` does not compile. When a component needs both the standardized Card surface and an interactive action (hover tilt, glow overlay, magnetic pull), you wrap the Card in a plain `<div>` that carries the action.

```svelte
<!-- This does NOT work -->
<Card use:boop>
  <p>Content</p>
</Card>

<!-- This works -->
<div use:boop>
  <Card>
    <p>Content</p>
  </Card>
</div>
```

## Why It Matters

Before card unification, the yesid.dev codebase had 21 different card-like surfaces: some used a `.bento-card` utility class, some used `CardBase` (an old brand primitive), some rolled their own border/background/radius. This meant 21 places to update when the card design changed. Unifying to a single `ui/card` component required solving the action compatibility problem, because many cards used `use:boop`, `use:tilt`, or `use:cursorGlow`.

Understanding this pattern prevents you from:
- Trying to put actions on components (compile error)
- Creating one-off card implementations to avoid the wrapper
- Breaking hover effects when refactoring to shared components

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/blog/BlogRow.svelte` | `<div use:boop>` wrapping `<Card>` | BlogRow needs hover bounce + Card surface |
| `src/lib/components/projects/ProjectListingPage.svelte` | `<div use:boop use:tilt>` wrapping `<Card>` | Project cards need both tilt and bounce |
| `src/lib/components/shared/CollapsibleSection.svelte` | Card rendered internally | No action needed — CollapsibleSection owns the Card |
| 9 About* bento cards | `<div use:cursorGlow use:boop>` wrapping `<Card>` | Bento cards need glow overlay + hover effect |

## The Mental Model

```
When to use wrapper <div>:
  Component needs use:action + Card surface
  ├── Wrap Card in <div use:action>
  ├── Card handles visual surface (bg, border, radius, padding)
  └── Wrapper <div> handles interaction (boop, tilt, cursorGlow)

When Card alone is sufficient:
  Component only needs visual surface, no actions
  ├── Use <Card> directly
  └── No wrapper needed
```

## Worked Example

### Pattern 1: Wrapper with group-hover

The `group-hover/card:` pattern lets child elements react to hover on the wrapper. This is the preferred approach over `:global([data-slot])` selectors.

```svelte
<!-- BlogRow.svelte -->
<div
  use:boop={{ scale: 1.01 }}
  class="group/card"
>
  <Card class="flex-row gap-4">
    <h3 class="group-hover/card:text-[var(--primary)] transition-colors">
      {title}
    </h3>
    <p class="text-muted-foreground">{excerpt}</p>
  </Card>
</div>
```

Key details:
- `class="group/card"` on the wrapper enables `group-hover/card:` on descendants
- `Card class="flex-row"` overrides Card's default `flex flex-col` direction
- Hover color transition targets the heading text, triggered by hovering anywhere on the wrapper

### Pattern 2: rounded-[inherit] for overlays

When an overlay (glow, gradient, loading state) sits inside a Card, it must match the Card's border radius. Instead of hardcoding the radius value, use `rounded-[inherit]`:

```svelte
<Card class="relative overflow-hidden">
  <div class="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-transparent to-primary/10">
    <!-- Overlay matches Card's border radius automatically -->
  </div>
  <div class="relative z-10">
    <p>Content above the overlay</p>
  </div>
</Card>
```

### Pattern 3: Card flex direction

Card defaults to `flex flex-col`. If your layout is horizontal, you must explicitly override:

```svelte
<!-- Vertical (default) — no override needed -->
<Card>
  <h3>Title</h3>
  <p>Description below title</p>
</Card>

<!-- Horizontal — explicit flex-row required -->
<Card class="flex-row items-center gap-4">
  <img src={thumbnail} alt="" class="w-16 h-16" />
  <div>
    <h3>Title</h3>
    <p>Description beside image</p>
  </div>
</Card>
```

Forgetting `flex-row` causes content to stack vertically even when the design calls for side-by-side layout.

## Common Mistakes

1. **Trying to put `use:` on a component:**
   - **What happens:** Svelte compiler error — actions only work on DOM elements
   - **Fix:** Wrap the component in a `<div use:action>`
   - **Why:** Svelte actions need a real DOM node to attach lifecycle hooks to

2. **Forgetting `group/card` on the wrapper:**
   - **What happens:** `group-hover/card:` classes on children have no effect
   - **Fix:** Add `class="group/card"` to the wrapper `<div>`
   - **Why:** Tailwind's group-hover requires a parent with the matching group name

3. **Hardcoding border-radius on overlays:**
   - **What happens:** Overlay corners don't match the Card when Card's radius changes
   - **Fix:** Use `rounded-[inherit]` on the overlay
   - **Why:** `inherit` pulls the computed border-radius from the parent, staying in sync automatically

4. **Assuming Card is flex-row:**
   - **What happens:** Content stacks vertically instead of side-by-side
   - **Fix:** Add explicit `class="flex-row"` when horizontal layout is needed
   - **Why:** Card defaults to `flex flex-col` for the most common use case (title above content)

5. **Using `:global([data-slot])` for hover effects:**
   - **What happens:** Works, but creates fragile coupling to Card's internal structure
   - **Fix:** Use `group-hover/card:` classes instead
   - **Why:** Tailwind's group-hover is explicit, doesn't depend on internal implementation details

## Connections

- **Depends on:** [[svelte-actions]] because the whole pattern exists to work around the action-on-component limitation
- **Depends on:** [[brand-primitives]] because Card inherits the design token architecture
- **Related:** [[component-architecture]] for understanding the ui/brand/domain tier system
- **Related:** [[collapsible-section-pattern]] for an example of Card used internally (no wrapper needed)

## Knowledge Check

1. Why can't you put `use:boop` directly on a `<Card>` component? -> See [What It Is](#what-it-is)
2. When do you need the wrapper `<div>` and when is bare `<Card>` sufficient? -> See [The Mental Model](#the-mental-model)
3. How do you make child elements respond to hover on the wrapper? -> See [Pattern 1](#pattern-1-wrapper-with-group-hover)
4. Why use `rounded-[inherit]` instead of `rounded-lg`? -> See [Pattern 2](#pattern-2-rounded-inherit-for-overlays)

## Go Deeper

- [Svelte Tutorial: Actions](https://svelte.dev/tutorial/actions) — official tutorial on `use:` directives
- [Tailwind CSS: Group Hover](https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state) — `group-hover` documentation
- [MDN: border-radius inherit](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) — CSS inheritance for border-radius
