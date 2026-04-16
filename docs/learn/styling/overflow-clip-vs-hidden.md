---
title: "overflow-x: clip vs hidden"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 5
tags:
  - learn
  - styling
  - intermediate
  - css
  - layout
prerequisites:
  - "[[css-grid-layout]]"
  - "[[responsive-design]]"
date: 2026-04-15
---

# overflow-x: clip vs hidden

## The Analogy

Think of `overflow: hidden` as putting content inside a locked room with a one-way mirror — you can't see outside, but the room itself is now a "container" that the browser tracks for scrolling purposes. `overflow: clip` is like simply painting over the excess — the content is visually gone, but the room itself hasn't changed its nature. This distinction matters when you have children that need to "stick" to the viewport.

## What It Is

Both `overflow-x: hidden` and `overflow-x: clip` prevent content from visually overflowing a container horizontally. The critical difference:

- **`overflow-x: hidden`** creates a new **scroll container** on that axis. Even though there's no scrollbar, the browser treats the element as scrollable. This changes how `position: sticky` works for descendants — sticky elements can only stick within their nearest scroll container.

- **`overflow-x: clip`** clips content visually but does **not** create a scroll container. The element remains a normal block, and `position: sticky` children can still reference the viewport or a parent scroll container as expected.

## Why It Matters

This is the kind of CSS bug that can cost hours to diagnose. You add `overflow-x: hidden` to prevent horizontal scroll, and suddenly a sticky sidebar or TOC stops working. The connection isn't obvious because the overflow and the sticky element might be in completely different parts of the DOM. Understanding this distinction lets you make the right choice immediately.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/blog/BlogDetailPage.svelte` | `.body-grid { overflow-x: clip; }` | Prevents horizontal overflow from edge labels without breaking the sticky TOC and sticky edge columns |
| `src/lib/components/blog/BlogContent.svelte` | `overflow-x-hidden` on the card wrapper | Establishes width constraint for code blocks — sticky behavior not needed inside this element |

## The Mental Model

```
Parent with overflow-x: hidden
├── Child A (position: sticky) ← BROKEN: sticks to parent scroll container, not viewport
└── Child B (normal flow)

Parent with overflow-x: clip
├── Child A (position: sticky) ← WORKS: no scroll container created, sticks to viewport
└── Child B (normal flow)
```

The rule: if any descendant uses `position: sticky`, use `clip` not `hidden` on ancestors.

## Worked Example

```css
/* From: src/lib/components/blog/BlogDetailPage.svelte */
/* The body grid contains edge labels that could cause horizontal overflow,
   plus a sticky TOC panel and sticky edge columns. */

.body-grid {
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
  overflow-x: clip;  /* Clips edge label overflow without creating a scroll container */
}

/* The edge columns use position: sticky to stay in view while scrolling */
.body-edge {
  position: sticky;
  top: 0;
  height: 100dvh;
}
```

If we used `overflow-x: hidden` instead of `clip`, the edge columns would scroll with the content instead of sticking to the viewport.

## Common Mistakes

1. **Using `overflow: hidden` to "fix" horizontal scroll:**
   - **What happens:** Sticky elements inside the container stop working
   - **Fix:** Use `overflow-x: clip` instead
   - **Why:** `hidden` creates a scroll container; `clip` does not

2. **Using `overflow: clip` everywhere:**
   - **What happens:** You can't programmatically scroll to clipped content
   - **Fix:** Use `hidden` when you actually need scroll containment (e.g., a code block that should scroll horizontally)
   - **Why:** `clip` doesn't create a scroll container, so `scrollTo()` and `overflow: auto` on children won't work as expected within it

3. **Adding `overflow: hidden` to `<body>` or high-level wrappers:**
   - **What happens:** Every sticky element in the page breaks
   - **Fix:** Apply overflow only where needed, as close to the overflowing content as possible
   - **Why:** The higher up the overflow container, the more sticky elements it affects

## Connections

- **Depends on:** [[css-grid-layout]] because the body grid uses CSS Grid with edge columns
- **Related:** [[responsive-design]] because the edge labels only appear at desktop breakpoints

## Knowledge Check

1. Why does `overflow-x: hidden` break `position: sticky`? -> See [What It Is](#what-it-is)
2. When should you prefer `hidden` over `clip`? -> See [Common Mistakes](#common-mistakes)
3. What's the rule for choosing between clip and hidden? -> See [The Mental Model](#the-mental-model)

## Go Deeper

- [MDN: overflow-x](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-x) — includes `clip` value documentation
- [CSS Tricks: Position Sticky and Overflow](https://css-tricks.com/position-sticky-and-table-headers/) — sticky + overflow interactions
