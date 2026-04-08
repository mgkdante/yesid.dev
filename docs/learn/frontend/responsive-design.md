---
title: "Responsive Design"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[tailwind-configuration]]"
date: 2026-04-08
---

# Responsive Design


## The Analogy

Like queries that work for 10 rows or 10 million -- the system adapts to the data volume without rewriting the query. Responsive design works the same way: one codebase adapts to any screen size without creating separate pages for mobile, tablet, and desktop. Just as a good query plan handles different data scales, responsive CSS handles different viewport widths.

## What It Is

**Responsive design** means building a UI that adapts to the user's screen size. Instead of creating separate mobile and desktop versions, you write one set of HTML/CSS that rearranges itself based on the viewport width.

The approach in this project is **mobile-first**: you write the base styles for the smallest screens (375px phones), then add complexity for larger screens using Tailwind breakpoint prefixes.

Tailwind breakpoints used in this project:

| Prefix | Min width | Target device | SQL analogy |
|--------|-----------|---------------|-------------|
| (none) | 0px | Mobile phones (375px+) | Base case: `SELECT TOP 5` |
| `sm:` | 640px | Large phones, small tablets | `SELECT TOP 10` -- more room |
| `md:` | 768px | Tablets, small laptops | `SELECT TOP 20` -- more columns |
| `lg:` | 1024px | Laptops, desktops | `SELECT *` -- full result set |
| `xl:` | 1280px | Large desktops | Add computed columns |
| `2xl:` | 1536px | Ultra-wide monitors | Add sidebar panels |

**Mobile-first** means: the unprefixed class is the mobile style. Prefixed classes ADD rules at larger sizes. You never write desktop-first and override downward.

```html
<!-- Mobile: single column. md and up: two columns -->
<div class="flex flex-col md:flex-row">
```

## Why It Matters

Over 50% of web traffic comes from mobile devices. If your site does not work on phones, you lose half your audience. Responsive design is a non-negotiable requirement for every modern web project. Understanding breakpoints and mobile-first CSS is tested in every frontend interview and expected in every client project.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | Line 27: conditional padding and max-width classes | Layout adapts between full-width and centered based on route |
| `src/lib/components/Footer.svelte` | Line 11: `flex-col ... sm:flex-row` | Footer stacks vertically on mobile, horizontal on desktop |
| `src/lib/components/ServiceCard.svelte` | Lines 224-243: `@media (max-width: 767px)` | Mobile breakpoint reverses flex direction, shrinks SVG |
| `src/lib/components/ServiceCard.svelte` | Lines 246-260: `@media (min-width: 1024px)` | Desktop breakpoint increases padding and SVG size |
| `src/routes/blog/[slug]/+page.svelte` | Lines 41-42: `2xl:hidden` and `hidden 2xl:block` | Table of contents: mobile toggle vs desktop sticky sidebar |

## The Mental Model

```
Mobile-first thinking:

    Start with the simplest layout (phone):
    +-------------------+
    |     Nav            |   <- full width, hamburger menu
    +-------------------+
    |     Content        |   <- single column
    |     stacked        |
    |     vertically     |
    +-------------------+
    |     Footer         |
    +-------------------+

    At md: (768px+), add complexity:
    +-------------------+
    |     Nav            |   <- full width, horizontal links
    +-------------------+
    | Content  | Sidebar |   <- two columns
    |          |         |
    +-------------------+
    |     Footer         |
    +-------------------+

    At lg: (1024px+), add more:
    +-------------------+
    |     Nav            |
    +-------------------+
    | Sidebar | Content  | Sidebar |   <- three columns
    +-------------------+
    |     Footer         |
    +-------------------+


CSS class interpretation:

    class="flex flex-col   md:flex-row   lg:gap-8"
            |               |              |
            v               v              v
          Mobile:         768px+:        1024px+:
          stack            side by         add gap
          vertically       side            between items


SQL parallel:

    -- Mobile query (limited columns, simpler layout)
    SELECT title, excerpt FROM posts;

    -- Desktop query (all columns, full layout)
    SELECT title, excerpt, author, date, tags, reading_time FROM posts;

    -- Responsive design: SAME query, different display based on context
    -- The data does not change. The PRESENTATION adapts.
```

## Worked Example

```svelte
<!-- From: src/lib/components/Footer.svelte (line 11, simplified) -->

<div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
  <p>copyright info</p>
  <div>social links</div>
</div>
```

Breaking down each class:

```
mx-auto           → center horizontally (all screen sizes)
flex               → use flexbox layout (all sizes)
max-w-5xl          → cap width at 1024px (all sizes)
flex-col           → MOBILE DEFAULT: stack children vertically
items-center       → center items on cross-axis (all sizes)
justify-between    → push items to opposite ends (all sizes)
gap-4              → 1rem gap between items (all sizes)
sm:flex-row        → AT 640px+: switch to horizontal layout
```

**What the user sees:**

On a 375px phone:
```
+-------------------+
|   copyright info   |   <- centered, stacked
|    social links    |
+-------------------+
```

On a 1024px desktop:
```
+-----------------------------------------------+
| copyright info                  social links   |   <- side by side
+-----------------------------------------------+
```

**ServiceCard's scoped responsive styles:**

```css
/* From: src/lib/components/ServiceCard.svelte */

/* Mobile default: SVG above text, smaller */
@media (max-width: 767px) {
  .viewport-inner {
    flex-direction: column-reverse;  /* SVG on top */
    gap: 1.5rem;                      /* tighter spacing */
  }
  .service-svg-box {
    width: 140px;                     /* smaller SVG */
    height: 140px;
  }
}

/* Desktop (1024px+): more breathing room, bigger SVG */
@media (min-width: 1024px) {
  .service-viewport {
    padding: 0 5rem;                  /* more side padding */
  }
  .service-svg-box {
    width: 320px;                     /* much larger SVG */
    height: 320px;
  }
}
```

Note how ServiceCard uses scoped `<style>` with traditional `@media` queries instead of Tailwind. This is because the responsive changes are structural (changing flex direction, resizing complex elements) rather than simple utility swaps. The project's CSS architecture allows either approach where appropriate.

## Common Mistakes

1. **Writing desktop-first styles:**
   - **What happens:** You write `flex-row` as the default and `md:flex-col` to override for mobile. This means mobile styles are overrides instead of the base case
   - **Fix:** Always start with the mobile style (unprefixed), then add complexity with breakpoint prefixes: `flex-col md:flex-row`
   - **Why:** Mobile-first is the project's non-negotiable CSS rule (see CLAUDE.md). Base styles target the smallest screen; breakpoint prefixes ADD capability for larger screens

2. **Using pixel values instead of responsive units:**
   - **What happens:** You set `width: 500px` on a container, and it overflows on a 375px phone
   - **Fix:** Use relative units: `max-w-5xl` (capped), `w-full` (fluid), `clamp(2rem, 4vw, 3.5rem)` (fluid with bounds)
   - **Why:** Pixel values assume a fixed screen size. Responsive units adapt to any viewport. Like how `VARCHAR(MAX)` handles any string length instead of `VARCHAR(50)` truncating

3. **Hiding content with `display: none` instead of restructuring:**
   - **What happens:** You hide entire sections on mobile with `hidden md:block`. The content still loads, eats bandwidth, and may confuse screen readers
   - **Fix:** For significant content differences, consider if the mobile version needs different content entirely (not just hidden desktop content). For small differences like a sidebar vs toggle, `hidden md:block` is fine
   - **Why:** Hiding content is acceptable for progressive enhancement (showing MORE on desktop). But if mobile users need entirely different content, the component should adapt its rendering, not just its visibility

4. **Testing only at common breakpoints:**
   - **What happens:** The layout looks perfect at 375px and 1440px but breaks at 500px or 900px
   - **Fix:** Test at every breakpoint transition (640, 768, 1024, 1280, 1536) AND at odd sizes in between
   - **Why:** Responsive design must work at every width, not just the common ones. Resize the browser continuously and watch for overflow, wrapping, and squished content

## Break It to Learn It

### Exercise 1: See Mobile-First in Action
1. Open `src/lib/components/Footer.svelte`
2. Remove the `sm:flex-row` class from line 11 (keep `flex-col`)
3. **Predict:** Will the footer stay vertical on all screen sizes?
4. **Verify:** Run `bun run dev`, resize the browser from narrow to wide. The footer stays stacked vertically even on desktop
5. **What you learned:** Without the breakpoint prefix, only the mobile style applies. `sm:flex-row` is what ADDS the horizontal layout at 640px+
6. **Undo your change**

### Exercise 2: Break a Breakpoint
1. Open `src/lib/components/ServiceCard.svelte`
2. In the `@media (max-width: 767px)` block (line 224), change `flex-direction: column-reverse` to `flex-direction: row`
3. **Predict:** How will the mobile service card layout change?
4. **Verify:** Run `bun run dev`, resize to mobile width (375px), check the services page
5. **What you learned:** `column-reverse` puts the SVG above the text on mobile. Changing to `row` tries to fit both side by side in a narrow viewport, causing overflow
6. **Undo your change**

### Exercise 3: Add a Breakpoint Adaptation
1. Open `src/routes/+layout.svelte`
2. On the `<main>` tag (line 27), add `lg:border lg:border-[var(--border)]` to the class string
3. **Predict:** At what screen width will a border appear around the main content?
4. **Verify:** Run `bun run dev`, slowly resize the browser. The border appears at 1024px and wider
5. **What you learned:** Tailwind breakpoint prefixes let you add visual features at specific widths without writing `@media` queries
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because responsive styles live inside component files
- **Depends on:** [[tailwind-configuration]] because Tailwind provides the breakpoint system
- **Related:** [[component-architecture]] because responsive design influences how components are structured
- **Related:** [[slots-and-composition]] because layouts often need responsive adaptations for their children
- **Related:** [[sveltekit-layouts]] because the root layout applies responsive styling to all pages

## Knowledge Check

1. What does "mobile-first" mean in CSS? --> See [What It Is](#what-it-is)
2. At what width does the `md:` prefix activate? --> See [What It Is](#what-it-is)
3. Why does ServiceCard use `@media` queries instead of Tailwind prefixes? --> See [Worked Example](#worked-example)
4. What is wrong with `flex-row md:flex-col`? --> See [Common Mistakes](#common-mistakes)
5. How do you test responsive design properly? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Tailwind docs -- Responsive design](https://tailwindcss.com/docs/responsive-design)
- [MDN -- Responsive design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
