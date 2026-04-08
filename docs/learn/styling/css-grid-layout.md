---
title: "CSS Grid Layout"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[tailwind-utility-first]]"
date: 2026-04-08
---

# CSS Grid Layout


## The Analogy

CSS Grid is like a SQL `PIVOT` table. A PIVOT defines rows and columns, then places data into specific cells. CSS Grid does the same for visual elements: you define a grid of rows and columns, then place HTML elements into cells. Just as `PIVOT` turns row-based data into a structured table, CSS Grid turns a flat list of HTML elements into a structured two-dimensional layout.

## What It Is

CSS Grid is a layout system built into every modern browser. It lets you define a two-dimensional grid (rows and columns) on a container, then place child elements into that grid. The key concepts:

- **Grid container:** The parent element with `display: grid`. You define the grid structure here.
- **Grid items:** The direct children of the container. They automatically flow into grid cells.
- **`grid-template-columns`:** Defines how many columns and how wide each one is.
- **`grid-template-rows`:** Defines how many rows and how tall each one is.
- **`gap`:** The spacing between cells (gutter).
- **`span`:** Makes an item stretch across multiple columns or rows.

Grid differs from Flexbox in one important way: Flexbox is one-dimensional (a single row OR a single column). Grid is two-dimensional (rows AND columns simultaneously). Use Flexbox for toolbars, nav links, and inline layouts. Use Grid for card grids, dashboards, and bento layouts.

In this project, most grids are created using Tailwind utility classes like `grid grid-cols-2 gap-4`, but some complex layouts use scoped `<style>` blocks for more control.

## Why It Matters

CSS Grid is the modern standard for page layout. Every frontend interview includes questions about grid vs flexbox, responsive grid patterns, and complex layouts. Job postings for frontend roles assume Grid knowledge. Without it, you cannot build card grids, dashboard layouts, bento boxes, or any two-dimensional layout without hacky workarounds.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/AboutBento.svelte` | `grid grid-cols-1 md:grid-cols-3 md:grid-rows-2` | Bento dashboard: 1 column on mobile, 3-column 2-row grid on desktop |
| `src/lib/components/ProjectGrid.svelte` | `grid grid-cols-1 gap-6 md:grid-cols-2` | Simple responsive card grid: single column on mobile, 2 columns on desktop |
| `src/lib/components/AboutBento.svelte` | `md:row-span-2` on the intro card | One card spanning 2 rows while other cards fill the remaining cells |
| `src/lib/components/AboutBento.svelte` | `md:col-span-2` on the interests card | One card stretching across 2 columns in the bottom row |

## The Mental Model

```
SQL PIVOT                              CSS Grid
──────────                             ────────

SELECT category,                       .container {
  [Q1], [Q2], [Q3]                       display: grid;
FROM sales                               grid-template-columns: 1fr 1fr 1fr;
PIVOT (SUM(amount)                        gap: 1rem;
  FOR quarter                           }
  IN ([Q1], [Q2], [Q3]))

Result:                                Result:
┌──────────┬──────┬──────┬──────┐     ┌──────────┬──────────┬──────────┐
│ Category │  Q1  │  Q2  │  Q3  │     │  Card 1  │  Card 2  │  Card 3  │
├──────────┼──────┼──────┼──────┤     ├──────────┼──────────┼──────────┤
│ Widgets  │ 100  │ 200  │ 150  │     │  Card 4  │  Card 5  │  Card 6  │
│ Gadgets  │ 300  │ 250  │ 400  │     └──────────┴──────────┴──────────┘
└──────────┴──────┴──────┴──────┘

Spanning (like a merged cell):

PIVOT gives you the table.             grid-template:
You can't merge cells.                   "intro  stack     location"
                                         "intro  interests interests"
CSS Grid CAN merge cells:
                                       ┌──────────┬──────────┬──────────┐
                                       │          │  Stack   │ Location │
                                       │  Intro   ├──────────┴──────────┤
                                       │          │     Interests       │
                                       └──────────┴─────────────────────┘
```

The `1fr` unit means "one fraction of the available space." Three columns of `1fr` each get one-third of the container width. Think of it like a proportional split: `1fr 2fr` makes two columns where the second is twice as wide as the first.

## Worked Example

```svelte
<!-- From: src/lib/components/AboutBento.svelte -->
<!-- This is a bento dashboard: 4 cards arranged in a 3-column, 2-row grid. -->

<div class="grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-2">

  <!-- Card 1: Photo + intro. Spans 2 rows on desktop. -->
  <div class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 md:row-span-2">
    <!-- This card is tall — it occupies both rows of column 1 -->
  </div>

  <!-- Card 2: Tech stack. Normal 1x1 cell. -->
  <div class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
    <!-- Fills one cell in the top-right area -->
  </div>

  <!-- Card 3: Location. Normal 1x1 cell. -->
  <div class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
    <!-- Fills one cell next to tech stack -->
  </div>

  <!-- Card 4: Interests. Spans 2 columns on desktop. -->
  <div class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 md:col-span-2">
    <!-- Stretches across the bottom-right two cells -->
  </div>
</div>
```

How it renders:

**Mobile (grid-cols-1):** All 4 cards stack vertically, full width.

**Desktop (md:grid-cols-3 md:grid-rows-2):**
```
┌──────────┬──────────┬──────────┐
│          │  Stack   │ Location │
│  Intro   ├──────────┴──────────┤
│ (span 2) │  Interests (span 2) │
└──────────┴─────────────────────┘
```

The Tailwind classes translate to:
- `grid` → `display: grid`
- `grid-cols-1` → `grid-template-columns: repeat(1, minmax(0, 1fr))` (mobile)
- `md:grid-cols-3` → at 768px+: `grid-template-columns: repeat(3, minmax(0, 1fr))`
- `md:grid-rows-2` → at 768px+: `grid-template-rows: repeat(2, minmax(0, 1fr))`
- `gap-3` → `gap: 0.75rem`
- `md:row-span-2` → at 768px+: `grid-row: span 2`
- `md:col-span-2` → at 768px+: `grid-column: span 2`

## Common Mistakes

1. **Using Grid when Flexbox is simpler:** A navigation bar with 5 links does not need Grid. `flex gap-8` is simpler and more appropriate.
   - **What happens:** The code is more complex than necessary. Grid adds two-dimensional logic when you only need one dimension.
   - **Fix:** Ask yourself: "Is this layout one-dimensional (row OR column) or two-dimensional (rows AND columns)?" One dimension = Flexbox. Two dimensions = Grid.
   - **Why:** Grid and Flexbox solve different problems. Using the wrong tool creates unnecessary complexity.

2. **Forgetting that `grid-cols-*` is mobile-first:** Writing `grid-cols-3 md:grid-cols-1` expecting 3 columns on desktop.
   - **What happens:** You get 3 columns on mobile (too cramped) and 1 column on desktop (too simple).
   - **Fix:** Start with the mobile layout: `grid-cols-1 md:grid-cols-3`. One column on mobile, three on desktop.
   - **Why:** Tailwind is mobile-first. Unprefixed classes are the base.

3. **Not using `gap` for spacing:** Adding margin to grid items instead of `gap` on the container.
   - **What happens:** Inconsistent spacing. First and last items have different spacing from middle items. Responsive changes require updating margins on every item.
   - **Fix:** Use `gap-4` (or whatever spacing) on the grid container. Remove margins from grid items.
   - **Why:** `gap` creates consistent gutters between all items without affecting the outer edges.

## Break It to Learn It

### Exercise 1: Remove a span and see the grid reflow
1. Open `src/lib/components/AboutBento.svelte`
2. On the intro card (first `<div>`), remove `md:row-span-2`
3. **Predict:** How will the bento grid rearrange on desktop?
4. **Verify:** Run `bun run dev`, open `/` and scroll to the about section. The intro card now occupies only one row, and the remaining cards shift to fill the grid differently.
5. **What you learned:** `row-span-2` is what makes the intro card tall. Without it, all cards are the same height and the grid reflows.
6. **Undo your change**

### Exercise 2: Change the column count
1. Open `src/lib/components/ProjectGrid.svelte`
2. Change `md:grid-cols-2` to `md:grid-cols-3`
3. **Predict:** How many cards will appear per row on desktop?
4. **Verify:** Run `bun run dev`, open `/work` (if available) or `/preview`. Cards now appear in rows of 3 instead of 2.
5. **What you learned:** `grid-cols-N` directly controls the column count. The items automatically reflow.
6. **Undo your change**

### Exercise 3: Remove the gap
1. Open `src/lib/components/AboutBento.svelte`
2. Remove `gap-3` from the grid container
3. **Predict:** What happens to the spacing between bento cards?
4. **Verify:** Run `bun run dev`. The cards are now touching each other with zero space between them.
5. **What you learned:** `gap` is the single source of gutter spacing. Without it, grid items pack together with no breathing room.
6. **Undo your change**

## Connections

- **Depends on:** [[tailwind-utility-first]] because most grids in this project use Tailwind grid utilities
- **Enables:** [[css-scroll-snap]] because scroll snap often works with grid-like section layouts
- **Related:** [[mobile-first-responsive]] because grids change column counts at responsive breakpoints
- **Related:** [[scoped-styles-in-svelte]] because complex grid layouts often use scoped `<style>` blocks

## Knowledge Check

1. When should you use Grid vs Flexbox? → See [What It Is](#what-it-is)
2. What does `1fr` mean? → See [The Mental Model](#the-mental-model)
3. How does `md:row-span-2` affect layout? → See [Worked Example](#worked-example)
4. Why use `gap` instead of margins on grid items? → See [Common Mistakes](#common-mistakes)
5. What is the SQL analogy for CSS Grid? → See [The Analogy](#the-analogy)

## Go Deeper

- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
