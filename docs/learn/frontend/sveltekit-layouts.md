---
title: "SvelteKit Layouts"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[sveltekit-routing]]"
date: 2026-04-08
---

# SvelteKit Layouts


## The Analogy

A layout is a database view that wraps every query result with a header and footer. When you create a view, the underlying query changes per request, but the view's structure (column aliases, formatting, JOIN logic) stays the same. A SvelteKit layout works the same way: every page gets the same Nav, Footer, and styling -- only the content in the middle changes per route.

## What It Is

A **layout** is a `+layout.svelte` file that wraps child routes. It is a Svelte component that receives `children` (the page content) and renders it inside a persistent structure. When a user navigates between pages, the layout stays mounted -- only the children swap out.

The root layout at `src/routes/+layout.svelte` wraps the entire application. It is the top-level frame that every page inherits. You can also create nested layouts for sections of the site (e.g., `src/routes/blog/+layout.svelte` would wrap only blog pages).

Layouts solve the "do not repeat yourself" problem: instead of importing Nav and Footer in every page, you import them once in the layout and every page automatically gets them.

Key behaviors:
- **Persistent:** The layout does not unmount during navigation. Only children change
- **Nested:** Layouts stack. A page at `/blog/my-post` inherits the root layout AND any `blog/+layout.svelte`
- **Data-aware:** Layouts can have their own `+layout.ts` load functions
- **Reactive:** Layouts can derive behavior from the current URL path

## Why It Matters

Layouts eliminate code duplication across pages and create a consistent user experience. Without them, every page would need its own Nav import, Footer import, and wrapper styling -- leading to inconsistency and maintenance overhead. Layouts also enable features like persistent navigation state, page transition animations, and conditional page wrappers. This is a fundamental SvelteKit concept.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | The entire file | Root layout wrapping ALL pages with Nav, Footer, and conditional styling |
| `src/routes/+layout.svelte` | Line 9: `let { children } = $props()` | How the layout receives page content |
| `src/routes/+layout.svelte` | Lines 13-17: `$derived` booleans | Layout adapts its behavior based on the current URL |
| `src/routes/+layout.svelte` | Lines 26-30: `{#key}` and `{@render children()}` | Page transition animation using the key block |
| `src/routes/+layout.svelte` | Lines 33-36: `{#if !hideFooter}` | Conditional footer: hidden on the services listing but shown everywhere else |

## The Mental Model

```
Without layouts (every page repeats the wrapper):

    /blog                    /services                /work
    +--Nav-----------+       +--Nav-----------+       +--Nav-----------+
    |                |       |                |       |                |
    | Blog content   |       | Services list  |       | Work content   |
    |                |       |                |       |                |
    +--Footer--------+       +--Footer--------+       +--Footer--------+

    ^^^ Nav and Footer imported separately in EACH page.
    Change the Footer? Edit EVERY page.


With a layout (wrapper defined ONCE):

    +layout.svelte (defined ONCE)
    +--Nav-----------+
    |                |
    | {@render        |   <-- this swaps per route
    |   children()}   |       /blog → BlogListingPage
    |                |       /services → ServiceListingPage
    |                |       /work → WorkListingPage
    +--Footer--------+

    ^^^ Nav and Footer defined in ONE file.
    Change the Footer? Edit ONE file.


Nested layout example (this project does not use nested layouts yet):

    src/routes/+layout.svelte         (root: Nav + Footer)
    └── src/routes/blog/+layout.svelte  (blog: sidebar + breadcrumbs)
        └── src/routes/blog/[slug]/+page.svelte  (post content)

    Result: post content wrapped in blog sidebar, wrapped in Nav + Footer
```

**Conditional layout behavior in this project:**

```
URL                    isHome   isFullWidth   hideFooter   CSS class
/                      true     true          false        'flex-1 pt-16'
/services              false    true          true         'flex-1 pt-16'     (no footer)
/services/sql-dev      false    true          false        'flex-1 pt-16'
/blog                  false    false         false        'mx-auto max-w-5xl ...'
/work/yesid-dev        false    false         false        'mx-auto max-w-5xl ...'
```

The layout adapts to the current route using `$derived` values. Full-width pages (home, services, about, contact) get no max-width constraint. Other pages get centered content at `max-w-5xl`. The services listing page hides the footer because it has its own scroll container.

## Worked Example

```svelte
<!-- From: src/routes/+layout.svelte -->
<!-- Root layout: every page on the site is rendered inside this wrapper -->

<script lang="ts">
  import '../app.css';                        // Global styles — loaded once
  import favicon from '$lib/assets/favicon.svg';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';         // Reactive current URL info
  import { prefersReducedMotion } from '$lib/motion/stores';

  // Step 1: Accept children — the current page's content
  let { children } = $props();

  // Step 2: Derive layout decisions from the URL
  // These recalculate automatically when the user navigates
  let isHome = $derived($page.url.pathname === '/');
  let isFullWidth = $derived(
    isHome
    || $page.url.pathname.startsWith('/services')
    || $page.url.pathname.startsWith('/about')
    || $page.url.pathname.startsWith('/contact')
  );
  let hideFooter = $derived($page.url.pathname === '/services');
</script>

<!-- Step 3: Set the favicon for all pages -->
<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Step 4: The persistent frame -->
<div class="flex min-h-screen flex-col bg-[var(--bg-primary)] font-body text-[var(--text-primary)]">

  <!-- Nav is ALWAYS present — it never unmounts -->
  <Nav pathname={$page.url.pathname} />

  <!-- Step 5: Page content with transition animation -->
  <!-- {#key} destroys and recreates children on route change → triggers fade animation -->
  {#key $page.url.pathname}
    <main class="{isFullWidth ? 'flex-1 pt-16' : 'mx-auto w-full max-w-5xl flex-1 px-6 pt-20'}
                  {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
      {@render children()}
    </main>
  {/key}

  <!-- Step 6: Footer is conditional — hidden on /services listing -->
  {#if !hideFooter}
    <div class="relative z-[45]">
      <Footer />
    </div>
  {/if}
</div>
```

**What happens when a user navigates from `/blog` to `/services/sql-development`:**

1. The layout stays mounted -- Nav and the outer `<div>` do not re-render
2. `$page.url.pathname` changes from `/blog` to `/services/sql-development`
3. `$derived` values recompute: `isFullWidth` becomes `true`, `hideFooter` becomes `false`
4. The `{#key}` block detects the pathname changed, destroys the old `<main>` + blog content
5. SvelteKit loads `+page.ts` for the service detail route
6. A new `<main>` is created with the service page content, triggering the fade-in animation
7. The `<main>` class switches from `'mx-auto w-full max-w-5xl...'` to `'flex-1 pt-16'`

## Common Mistakes

1. **Importing Nav/Footer in individual pages instead of the layout:**
   - **What happens:** You get duplicate navbars, inconsistent styling, and unnecessary re-renders on navigation
   - **Fix:** Shared UI goes in `+layout.svelte`. Individual pages only contain page-specific content
   - **Why:** Layouts persist across navigation. Importing shared components per-page means they unmount and remount on every navigation, losing state and causing flicker

2. **Misunderstanding when the layout re-renders:**
   - **What happens:** You expect the entire layout to refresh on navigation, but only children swap
   - **Fix:** Understand that layouts are persistent. Use `$derived` with `$page.url.pathname` to react to URL changes
   - **Why:** Persistence is the whole point of layouts. The Nav does not re-mount when you navigate -- it stays alive and updates reactively

3. **Not accounting for layout inheritance:**
   - **What happens:** You create a nested layout that accidentally hides the parent layout's Nav/Footer
   - **Fix:** Nested layouts must also render `{@render children()}`. They ADD to the parent layout; they do not replace it
   - **Why:** Layouts stack. A child layout wraps its content and is itself wrapped by the parent layout

## Break It to Learn It

### Exercise 1: Remove the Key Block
1. Open `src/routes/+layout.svelte`
2. Remove the `{#key $page.url.pathname}` and `{/key}` lines (keep `<main>` and its contents)
3. **Predict:** Will pages still change when you navigate? Will the fade animation still play?
4. **Verify:** Run `bun run dev`, navigate between pages. Content changes, but the fade-in animation no longer plays
5. **What you learned:** `{#key}` forces Svelte to destroy and recreate children on key change. Without it, Svelte reuses DOM nodes and no animation triggers
6. **Undo your change**

### Exercise 2: See Layout Persistence
1. Open `src/lib/components/Nav.svelte`
2. Add a `console.log('Nav mounted')` inside an `onMount()` callback (or in the existing one)
3. **Predict:** How many times will "Nav mounted" appear if you navigate through 5 different pages?
4. **Verify:** Run `bun run dev`, open the browser console, navigate between pages. You should see "Nav mounted" only ONCE
5. **What you learned:** The layout (and its Nav component) mounts once and persists. Only children swap on navigation
6. **Undo your change**

### Exercise 3: Break the Conditional Footer
1. Open `src/routes/+layout.svelte`
2. Change `let hideFooter = $derived($page.url.pathname === '/services')` to `let hideFooter = $derived(false)`
3. **Predict:** Will the footer now appear on the `/services` page?
4. **Verify:** Run `bun run dev`, navigate to `/services`, scroll to the bottom
5. **What you learned:** `$derived` values drive conditional rendering. The layout dynamically adapts its structure based on the current route
6. **Undo your change**

## Connections

- **Depends on:** [[sveltekit-routing]] because layouts wrap routes and react to URL changes
- **Depends on:** [[slots-and-composition]] because layouts use `{@render children()}` to insert page content
- **Related:** [[svelte-5-runes]] because `$derived` drives conditional layout behavior
- **Related:** [[sveltekit-load-functions]] because layouts can have their own `+layout.ts` load functions
- **Related:** [[conditional-rendering]] because `{#if}` and `{#key}` are used for conditional and keyed rendering in layouts

## Knowledge Check

1. What is the difference between a layout and a regular page component? --> See [What It Is](#what-it-is)
2. Does the layout unmount when a user navigates to a new page? --> See [The Mental Model](#the-mental-model)
3. How does the layout know which CSS class to apply based on the current URL? --> See [Worked Example](#worked-example)
4. What does `{#key}` do in the layout, and what happens without it? --> See [Break It to Learn It](#break-it-to-learn-it)

## Go Deeper

- [SvelteKit docs -- Layouts](https://svelte.dev/docs/kit/routing#layout)
- [SvelteKit tutorial -- Layouts](https://svelte.dev/tutorial/kit/layouts)
