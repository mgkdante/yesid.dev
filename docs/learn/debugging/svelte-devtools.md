---
title: "Svelte DevTools"
domain: debugging
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - debugging
  - beginner
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Svelte DevTools


## The Analogy

Svelte DevTools is like a database admin tool (SQL Server Management Studio's Object Explorer or pgAdmin's tree view) that shows you the live contents of every table. Instead of tables, you see **components**. Instead of rows, you see **props** (input data) and **state** (internal variables). You can expand any component in the tree to see its current values, just like expanding a table to see its columns and data. If a value looks wrong, you know exactly which component owns it and what data it received.

## What It Is

**Svelte DevTools** refers to two separate tools that serve different purposes:

1. **Svelte Inspector** (built into SvelteKit) -- press **Ctrl+Shift+I** while the dev server is running to activate it. When active, hovering over any element on the page shows which Svelte component rendered it, and clicking opens that component's source file in your editor. This is the fastest way to answer "which file renders this part of the page?"

2. **Svelte DevTools browser extension** -- a Chrome/Firefox extension that adds a "Svelte" tab inside browser DevTools (F12). This tab shows the full component tree, the current prop values for each component, and the current state (`$state`) values. You can inspect, search, and even modify values live.

In Svelte 5 (which this project uses), **props** are declared with `$props()` and **state** with `$state()`. The DevTools extension shows both, letting you trace data flow from parent to child -- like tracing a foreign key relationship from one table to another.

## Why It Matters

When a component displays wrong data, you need to know whether the problem is in the component itself or in the data it received from its parent. Svelte DevTools answers this instantly: select the component, check its props. If the props are correct but the output is wrong, the bug is in the component. If the props are wrong, the bug is upstream -- in the parent component or the data layer. This is the frontend equivalent of checking whether bad query results come from the data (wrong WHERE clause) or the presentation (wrong SELECT formatting).

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/AboutIdentity.svelte` | The `identity` prop passed from `AboutPage.svelte` | Inspector shows the full `AboutIdentity` object with `name`, `title`, `valueProp` -- verify the data layer is passing correct values |
| `src/lib/components/WorkListingPage.svelte` | The `$derived` values: `activeService`, `activeTag`, `filteredProjects` | DevTools shows reactive derived state updating as you click filters -- watch `filteredProjects.length` change in real time |
| `src/lib/components/ServiceStation.svelte` | The `service` prop with `station`, `title`, `description` fields | Verify each station receives the correct service data from the home page's `{#each}` loop |
| `src/routes/+layout.svelte` | The root layout wrapping all child pages | The component tree starts here -- every page component is a child of this layout |
| `src/lib/components/AboutPolaroids.svelte` | The `polaroids` prop (array of `AboutPolaroid` objects) | See `rotate`, `src`, `caption` values for each polaroid -- useful when debugging visual positioning |

## The Mental Model

```
SVELTE INSPECTOR (Ctrl+Shift+I in dev mode)
=============================================

  What it does:
    1. Hover over any element on the page
    2. A tooltip appears showing:
       - Component name (e.g., "AboutIdentity")
       - File path (e.g., "src/lib/components/AboutIdentity.svelte")
    3. Click the element
    4. Your editor opens that file at the exact line

  SQL equivalent:
    Like right-clicking a table in SSMS and selecting "Script Table as..."
    — it takes you directly to the definition.

  When to use:
    "I see a card on the page. Which .svelte file renders it?"
    Press Ctrl+Shift+I, hover over the card, click. Done.


SVELTE DEVTOOLS EXTENSION (F12 > Svelte tab)
=============================================

  Component Tree (left pane):
    +layout.svelte
    └── +page.svelte
        ├── HeroBanner
        ├── ServiceStation (station=1)
        │   ├── LottiePlayer
        │   └── ProjectMiniCard
        ├── ServiceStation (station=2)
        ├── FeaturedWork
        │   ├── WorkCard (slug="transit")
        │   └── WorkCard (slug="dashboard")
        ├── AboutBento
        ├── BlogFeed
        └── CtaSection

  Selected Component Details (right pane):
    ┌──────────────────────────────────────┐
    │  ServiceStation                      │
    │                                      │
    │  Props:                              │
    │    service: {                        │
    │      id: "data-engineering"          │
    │      title: { en: "Data Eng..." }    │
    │      station: 1                      │
    │      icon: "data-pipeline.json"      │
    │    }                                 │
    │    stop: "01"                        │
    │                                      │
    │  State ($state):                     │
    │    (none in this component)          │
    │                                      │
    │  Derived ($derived):                 │
    │    resolvedTitle: "Data Engineering"  │
    └──────────────────────────────────────┘

  SQL equivalent:
    Like running SELECT * FROM ServiceStation WHERE station = 1
    — you see all column values for one specific row (component instance).
```

### Data flow debugging with the tree

```
QUESTION: "Why does the identity card show the wrong name?"

Step 1: Open Svelte DevTools, find AboutIdentity in the tree
Step 2: Check its props:
          identity.name = { en: "Yesid O" }     <-- Is this correct?

  If YES → the bug is in AboutIdentity.svelte (wrong rendering)
  If NO  → go up the tree to AboutPage.svelte, check where it gets the data

Step 3: In AboutPage, check its props:
          aboutContent.identity.name = { en: "Yesid O" }

  If wrong HERE → the bug is in the data file (about-page.ts)
  If correct HERE but wrong in child → the bug is in how AboutPage passes props

This is exactly like debugging a SQL view:
  Is the underlying table data correct? → Data layer problem
  Is the JOIN correct? → Component composition problem
  Is the SELECT correct? → Rendering problem
```

## Worked Example

**Using Svelte Inspector to find which file renders the work filter sidebar:**

```
Step 1: Run `bun run dev` and open http://localhost:5173/work

Step 2: Press Ctrl+Shift+I to activate Svelte Inspector
        A blue outline follows your cursor across elements.

Step 3: Hover over the filter sidebar on the left side of the page
        The tooltip shows:
          WorkFilterSidebar
          src/lib/components/WorkFilterSidebar.svelte

Step 4: Click the sidebar
        Your editor opens WorkFilterSidebar.svelte

Step 5: Now you know exactly where to make changes to the filter UI.
        No searching, no guessing, no reading import statements.
```

**Using the DevTools extension to debug filters on the Work page:**

```
Step 1: Open http://localhost:5173/work with DevTools open (F12 > Svelte tab)

Step 2: Find WorkListingPage in the component tree

Step 3: Look at its derived state:
          activeService: null          (no filter active)
          activeTag: null
          filteredProjects: [6 items]  (all projects shown)

Step 4: Click a service filter (e.g., "Data Engineering")

Step 5: Watch the Svelte DevTools update:
          activeService: "data-engineering"
          filteredProjects: [2 items]  (only matching projects)

Step 6: The data is correct — if the display is wrong, the bug is
        in WorkCard.svelte rendering, not in the filter logic.
```

## Common Mistakes

1. **Confusing Svelte Inspector with browser DevTools Inspector**
   - **What happens:** You press Ctrl+Shift+I expecting the Svelte Inspector overlay, but it opens the browser's default DevTools instead.
   - **Fix:** The Svelte Inspector only works when `bun run dev` is running (not in production builds). Press Ctrl+Shift+I while the page is focused, not while DevTools is focused. If it does not activate, check that the dev server is running.
   - **Why:** Svelte Inspector is injected by the Vite dev server plugin. It does not exist in production builds.

2. **Searching for a component by its HTML output instead of its name**
   - **What happens:** You see a `<div class="group bento-card">` in the Elements panel and try to find it in the Svelte DevTools by searching for "bento-card". It does not match.
   - **Fix:** Svelte DevTools searches by component name, not CSS classes. Search for "AboutIdentity" (the Svelte component name), not "bento-card" (the CSS class).
   - **Why:** CSS classes are applied in the template; component names are how Svelte organizes the render tree. They are different namespaces.

3. **Expecting $derived values to be editable in DevTools**
   - **What happens:** You try to change a `$derived` value in the Svelte DevTools panel. It does not work or reverts immediately.
   - **Fix:** `$derived` values are computed from other state -- they are read-only, like a computed column in SQL (`AS quantity * price`). To change a derived value, change the source state it depends on.
   - **Why:** `$derived` is reactive: it automatically recalculates when its dependencies change. Editing it directly would violate the reactivity contract.

## Break It to Learn It

### Exercise 1: Find a component with Inspector

1. Run `bun run dev` and open `http://localhost:5173/`
2. Press Ctrl+Shift+I to activate Svelte Inspector
3. Hover over the orange gradient line between sections on the home page
4. **Predict:** What component name will the tooltip show?
5. **Verify:** The tooltip should show `GradientSeparator` pointing to `src/lib/components/GradientSeparator.svelte`
6. **What you learned:** Svelte Inspector maps any visible element back to its source component -- no grepping required

### Exercise 2: Trace props through the tree (manual)

1. Open `src/lib/components/AboutIdentity.svelte`
2. Note the props it receives: `identity` (type `AboutIdentity`)
3. Now use Ctrl+Shift+F in your editor to search for `<AboutIdentity` across the codebase
4. **Predict:** Which parent component passes the `identity` prop?
5. **Verify:** `src/lib/components/AboutPage.svelte` passes it. Open that file and trace where `identity` comes from.
6. **What you learned:** Component props form a chain, like foreign keys -- data flows from parent to child, and you debug by tracing upstream

### Exercise 3: Watch derived state update

1. Open `http://localhost:5173/work` with DevTools open (F12)
2. Open the Console tab and type: `document.querySelectorAll('[data-flip-id]').length`
3. Note the number of visible project cards
4. **Predict:** If you click a service filter, will this number go up or down?
5. **Verify:** Click a service filter, then run the same Console query again. The count should decrease because `filteredProjects` (a `$derived` value in `WorkListingPage.svelte`) now has fewer items.
6. **What you learned:** `$derived` state reacts to filter changes, and the DOM updates to match -- like a SQL view that updates when its underlying WHERE clause changes

## Connections

- **Depends on:** [[svelte-components]] because understanding component structure is required to navigate the component tree
- **Enables:** [[gsap-debugging]] because identifying which component owns an animation helps you find the right GSAP code
- **Related:** [[browser-devtools]] because the Svelte extension lives inside browser DevTools as an additional tab

## Knowledge Check

1. What keyboard shortcut activates Svelte Inspector in development mode? --> See [What It Is](#what-it-is)
2. You see wrong data on the page. How do you determine whether the bug is in the component or in the data it received? --> See [The Mental Model](#the-mental-model)
3. Can you edit a `$derived` value in the Svelte DevTools panel? Why or why not? --> See [Common Mistakes](#common-mistakes)
4. What is the difference between Svelte Inspector and the Svelte DevTools browser extension? --> See [What It Is](#what-it-is)

## Go Deeper

- [Svelte Inspector -- Official Docs](https://svelte.dev/docs/kit/configuration#compilerOptions)
- [Svelte DevTools Browser Extension (Chrome)](https://chrome.google.com/webstore/detail/svelte-devtools)
