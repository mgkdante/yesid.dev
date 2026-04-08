---
title: "Mobile-First Responsive Design"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[tailwind-utility-first]]"
date: 2026-04-08
---

# Mobile-First Responsive Design


## The Analogy

Think of writing a SQL query for the smallest result set first, then adding JOINs to expand it. You start with `SELECT id, name FROM users` (the simplest case). Then you add `JOIN orders ON ...` when you need more data. You never start with a 12-table JOIN and then try to strip tables away -- that is fragile and error-prone. Mobile-first responsive design follows the same principle: write styles for the smallest screen first (the base query), then add complexity for larger screens (the JOINs). Start simple, enhance up. Never start complex and strip down.

## What It Is

Mobile-first responsive design means your base CSS rules target mobile screens (the smallest viewport). You then use **breakpoint prefixes** to add or override styles at larger screen sizes. In Tailwind CSS:

- **No prefix** = applies at all screen sizes (mobile and up)
- `sm:` = applies at 640px and wider
- `md:` = applies at 768px and wider
- `lg:` = applies at 1024px and wider
- `xl:` = applies at 1280px and wider

Under the hood, these generate `@media (min-width: ...)` rules. The key word is **min-width** -- "at this size and above." This is the opposite of desktop-first, which uses `max-width` ("at this size and below").

Why mobile-first? Mobile layouts are simpler: single column, stacked elements, full width. Desktop layouts are more complex: multi-column grids, sidebars, hover effects. Starting with the simple layout and adding complexity is more maintainable than starting complex and trying to undo it.

## Why It Matters

Responsive design is non-negotiable in modern web development. Over 50% of web traffic comes from mobile devices. Google uses mobile-first indexing for search rankings. Every frontend interview includes responsive design questions. Mobile-first is the industry standard because it produces cleaner, more maintainable CSS -- the base styles are simple and readable, and breakpoint overrides are explicit additions rather than undos.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Hero.svelte` | `text-4xl md:text-5xl` on the `<h1>` | Mobile: 4xl text. Desktop: 5xl. Base is mobile. |
| `src/routes/+layout.svelte` | `flex flex-col` on the root container | Mobile base is a vertical stack. Desktop layouts come from child components. |
| `src/lib/components/AboutBento.svelte` | `grid-cols-1 md:grid-cols-3 md:grid-rows-2` | Mobile: single column stack. Desktop: 3-column bento grid. |
| `src/lib/components/Nav.svelte` | `hidden md:flex` on the desktop links, `md:hidden` on hamburger | Mobile: hamburger visible, links hidden. Desktop: links visible, hamburger hidden. |
| `src/lib/components/Footer.svelte` | `flex-col sm:flex-row` on the footer content | Mobile: stacked. Small+ screens: side by side. |
| `src/lib/components/ServiceCard.svelte` | `@media (max-width: 767px)` in scoped styles | One of the few cases using scoped CSS for complex responsive layout instead of Tailwind |

## The Mental Model

```
Desktop-First (WRONG for this project)      Mobile-First (CORRECT)
───────────────────────────────────          ──────────────────────

Base = desktop (complex)                    Base = mobile (simple)
.grid { columns: 3; gap: 2rem; }           .grid { columns: 1; }

Then UNDO for smaller screens:              Then ADD for larger screens:
@media (max-width: 768px) {                 @media (min-width: 768px) {
  .grid { columns: 1; gap: 0; }              .grid { columns: 3; gap: 2rem; }
}                                           }

Problem: You start complex                  Advantage: You start simple
and strip things away.                      and add things on.
Easy to miss edge cases.                    Clean, additive approach.

Tailwind mobile-first:
  class="grid-cols-1 md:grid-cols-3 gap-3"

  At 0-767px:   grid-cols-1  (1 column)
  At 768px+:    grid-cols-3  (3 columns)
  At all sizes: gap-3        (consistent gutters)

SQL analogy:
  Base query (mobile):  SELECT id, name FROM users
  md: JOIN (tablet):    ... JOIN orders ON users.id = orders.user_id
  lg: JOIN (desktop):   ... JOIN payments ON orders.id = payments.order_id

  You ADD data as the screen grows, just like you ADD JOINs as the query grows.
```

## Worked Example

```svelte
<!-- From: src/lib/components/Nav.svelte -->
<!-- The navigation uses mobile-first to swap between hamburger and link bar. -->

<!-- Desktop links: hidden by default, shown at md (768px+) -->
<ul class="hidden items-center gap-8 md:flex">
  {#each links as link}
    <li>
      <a href={link.href} class="text-sm font-medium">
        {link.label}
      </a>
    </li>
  {/each}
</ul>

<!-- Hamburger: shown by default, hidden at md (768px+) -->
<button class="flex flex-col gap-1.5 md:hidden">
  <span class="block h-0.5 w-5 bg-[var(--text-primary)]"></span>
  <span class="block h-0.5 w-5 bg-[var(--text-primary)]"></span>
  <span class="block h-0.5 w-5 bg-[var(--text-primary)]"></span>
</button>
```

Reading this mobile-first:

**Step 1 -- Read the base (no prefix):**
- Desktop links: `hidden` -- they are hidden on mobile
- Hamburger: `flex flex-col gap-1.5` -- it is visible on mobile (3 horizontal lines)

**Step 2 -- Read the `md:` additions (768px+):**
- Desktop links: `md:flex` -- they become visible
- Hamburger: `md:hidden` -- it disappears

The result: mobile users see a hamburger menu. Desktop users see horizontal nav links. One set of elements, two layouts, zero duplication.

## Common Mistakes

1. **Reading breakpoint classes backwards:** Thinking `md:flex` means "flex on mobile, something else on desktop."
   - **What happens:** You write the wrong classes and the layout breaks at the wrong screen size.
   - **Fix:** Remember: `md:flex` means "at 768px AND ABOVE, apply `display: flex`." It says nothing about smaller screens. The base (no prefix) controls mobile.
   - **Why:** Mobile-first means breakpoints add rules going up, never down.

2. **Writing desktop-first then overriding down:** Starting with `grid-cols-3` and then adding `sm:grid-cols-1`.
   - **What happens:** Three columns on mobile (too cramped), one column on small+ screens. The opposite of what you want.
   - **Fix:** Start with `grid-cols-1` (mobile base), then `md:grid-cols-3` (desktop enhancement).
   - **Why:** The smallest screen is the default. Larger screens are enhancements.

3. **Forgetting that base styles apply everywhere:** Writing `p-4 md:p-4` (redundant).
   - **What happens:** It works, but `md:p-4` is pointless because `p-4` already applies at all sizes.
   - **Fix:** Only use a breakpoint prefix when the value CHANGES at that breakpoint. `p-4 md:p-8` makes sense: 16px on mobile, 32px on desktop.
   - **Why:** Unprefixed classes are the universal base. You only need prefixed classes to override.

## Break It to Learn It

### Exercise 1: Reverse the nav visibility
1. Open `src/lib/components/Nav.svelte`
2. On the `<ul>` element, change `hidden md:flex` to `flex md:hidden`
3. **Predict:** What will mobile users see? What will desktop users see?
4. **Verify:** Run `bun run dev`. Mobile shows the link bar. Desktop hides it. The hamburger is now backwards too.
5. **What you learned:** The order matters. The base (`flex`) applies on mobile. The prefix (`md:hidden`) overrides at 768px+.
6. **Undo your change**

### Exercise 2: Break the bento grid
1. Open `src/lib/components/AboutBento.svelte`
2. Change `grid-cols-1 md:grid-cols-3` to `grid-cols-3` (remove the `md:` prefix)
3. **Predict:** What will the bento grid look like on a 375px-wide mobile screen?
4. **Verify:** Run `bun run dev`, open DevTools, set viewport to 375px. The cards are crushed into 3 tiny columns with unreadable text.
5. **What you learned:** Without the mobile-first pattern, the 3-column grid applies at every size, including mobile where there is not enough room.
6. **Undo your change**

### Exercise 3: Test with browser DevTools responsive mode
1. Open `http://localhost:5173/` in your browser
2. Open DevTools (F12) and toggle the responsive/device toolbar
3. Set the viewport width to 375px (iPhone). Observe the layout: single-column, hamburger menu, stacked sections
4. Gradually increase the width to 768px. Watch for the `md:` breakpoint kicking in: nav links appear, grids expand, layouts change
5. Continue to 1024px for `lg:` changes
6. **What you learned:** You can see mobile-first in real time. Every breakpoint adds complexity as the viewport grows.

## Connections

- **Depends on:** [[tailwind-utility-first]] because responsive prefixes (`md:`, `lg:`) are Tailwind syntax
- **Related:** [[css-grid-layout]] because grids are the most common responsive pattern (`grid-cols-1 md:grid-cols-3`)
- **Related:** [[scoped-styles-in-svelte]] because complex responsive layouts sometimes use scoped `@media` queries
- **Related:** [[dark-theme-architecture]] because both responsive design and theming use contextual CSS to adapt the same elements

## Knowledge Check

1. What does "mobile-first" mean in practice? → See [What It Is](#what-it-is)
2. If you write `hidden md:flex`, is the element visible on mobile? → See [Worked Example](#worked-example)
3. Why not start with the desktop layout and strip it down for mobile? → See [The Mental Model](#the-mental-model)
4. What is the difference between `min-width` and `max-width` media queries? → See [What It Is](#what-it-is)
5. What is the SQL analogy for mobile-first? → See [The Analogy](#the-analogy)

## Go Deeper

- [Tailwind CSS: Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN: Using Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
