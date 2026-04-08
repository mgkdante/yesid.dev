---
title: "Slots and Composition"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[props-and-events]]"
date: 2026-04-08
---

# Slots and Composition


## The Analogy

Slots are like template stored procedures -- you define the structure (header, body, footer), and the caller fills in the content. Imagine a stored procedure that accepts a table-valued parameter: you define the columns (the structure), and the caller provides the rows (the content). In Svelte 5, this pattern uses `{@render children()}` and snippets.

## What It Is

**Composition** is the pattern of building complex UIs by nesting components inside other components. Instead of passing every piece of content as a prop (like passing 50 parameters to a procedure), you let the parent pass **blocks of content** that the child renders in designated spots.

In Svelte 5, this works through two mechanisms:

1. **`children` prop with `{@render children()}`** -- the child component renders whatever the parent puts between its opening and closing tags
2. **Named snippets** -- the parent defines named content blocks, and the child renders them in specific locations

This replaced Svelte 4's `<slot>` and `<slot name="...">` syntax entirely. If you see `<slot>` in documentation or tutorials, that is the old way.

**The Svelte 5 syntax:**

```svelte
<!-- Parent: passes content between tags -->
<Layout>
  <h1>My Page Title</h1>
  <p>My page content goes here</p>
</Layout>

<!-- Layout.svelte: renders the passed content -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="layout-wrapper">
  {@render children()}
</div>
```

## Why It Matters

Composition is how you build reusable layout components -- things like page shells, card containers, modals, and tab panels. Without composition, every layout variation would require a separate component with dozens of props. With composition, you build one layout structure and let consumers fill in whatever content they need. This is a core pattern in every component framework, and interviewers expect you to understand it.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | Line 9: `let { children } = $props()` and line 29: `{@render children()}` | The root layout wraps every page with Nav + Footer |
| `src/routes/+layout.svelte` | Lines 22-38: the full structure | Shows how children are rendered between Nav and Footer |
| `src/routes/blog/[slug]/+page.svelte` | The entire file structure | A page that is itself rendered as `children` inside the layout |

## The Mental Model

```
SQL analogy — a "template" stored procedure:

    CREATE PROCEDURE PageLayout
        @header_content  NVARCHAR(MAX),   -- named snippet
        @body_content    NVARCHAR(MAX),   -- children
        @footer_content  NVARCHAR(MAX)    -- named snippet
    AS BEGIN
        PRINT '<div class="page">'
        PRINT @header_content
        PRINT @body_content
        PRINT @footer_content
        PRINT '</div>'
    END

Svelte equivalent — +layout.svelte:

    <Nav />                     <!-- always present -->
    <main>
        {@render children()}    <!-- whatever the page puts here -->
    </main>
    <Footer />                  <!-- always present -->


What the browser sees:

    +----------------------------------+
    |  Nav (always present)            |
    +----------------------------------+
    |                                  |
    |  children (changes per route)    |
    |  /blog -> BlogListingPage        |
    |  /services -> ServiceListingPage |
    |  /work -> WorkListingPage        |
    |                                  |
    +----------------------------------+
    |  Footer (always present)         |
    +----------------------------------+
```

**The key insight:** The layout is a frame. The `children` prop is the picture inside the frame. Different pages provide different pictures, but the frame (Nav + Footer + styling) stays the same.

## Worked Example

```svelte
<!-- From: src/routes/+layout.svelte -->
<!-- The root layout: wraps every page with Nav, Footer, and shared styling -->

<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';

  // Step 1: Accept children — whatever the route's +page.svelte renders
  // This is like a stored proc accepting @body_content NVARCHAR(MAX)
  let { children } = $props();

  // Step 2: Derive layout decisions from the current URL
  let isHome = $derived($page.url.pathname === '/');
  let isFullWidth = $derived(
    isHome || $page.url.pathname.startsWith('/services')
  );
  let hideFooter = $derived($page.url.pathname === '/services');
</script>

<!-- Step 3: The persistent frame -->
<div class="flex min-h-screen flex-col bg-[var(--bg-primary)]">
  <!-- Nav always renders -->
  <Nav pathname={$page.url.pathname} />

  <!-- Step 4: Render the page content inside <main> -->
  <!-- {#key} forces re-render on route change for the fade animation -->
  {#key $page.url.pathname}
    <main class="{isFullWidth ? 'flex-1 pt-16' : 'mx-auto w-full max-w-5xl flex-1 px-6 pt-20'}">
      {@render children()}
    </main>
  {/key}

  <!-- Footer conditionally renders -->
  {#if !hideFooter}
    <Footer />
  {/if}
</div>
```

**The flow in plain language:**

1. A user navigates to `/blog`. SvelteKit loads `src/routes/blog/+page.svelte`
2. That page component becomes the `children` of `+layout.svelte`
3. The layout renders Nav at the top, the blog page in the middle (via `{@render children()}`), and Footer at the bottom
4. If the user navigates to `/services`, the `{#key}` block detects the URL change, destroys the old children, and renders the services page as the new children
5. The Nav and Footer persist -- they are not part of `children`, they are part of the frame

## Common Mistakes

1. **Confusing `children` with a regular prop:**
   - **What happens:** You try to pass `children` as a named prop: `<Layout children={someContent}>` -- this does not work as expected
   - **Fix:** Put content between the component's tags: `<Layout><p>content</p></Layout>`. Svelte automatically collects this as the `children` snippet
   - **Why:** `children` is a special implicit prop. Content between tags becomes the children snippet automatically

2. **Using old `<slot>` syntax:**
   - **What happens:** You write `<slot />` in a component -- this still works in Svelte 5 but is deprecated
   - **Fix:** Use `let { children } = $props()` and `{@render children()}` instead
   - **Why:** Svelte 5 replaced slots with the snippet/render system. The new system is more explicit and composable

3. **Forgetting to render children:**
   - **What happens:** You accept `children` in props but never call `{@render children()}` -- the passed content simply disappears
   - **Fix:** Add `{@render children()}` wherever you want the child content to appear in your markup
   - **Why:** Unlike some frameworks, Svelte does not auto-insert children. You must explicitly render them

## Break It to Learn It

### Exercise 1: Remove the Children Render
1. Open `src/routes/+layout.svelte`
2. Comment out `{@render children()}` on line 29
3. **Predict:** What will you see when you navigate to any page?
4. **Verify:** Run `bun run dev`, navigate to `/blog` -- you should see Nav and Footer but no page content
5. **What you learned:** `{@render children()}` is the insertion point. Without it, child content is accepted but never displayed
6. **Undo your change**

### Exercise 2: Move Children Outside Main
1. Open `src/routes/+layout.svelte`
2. Move `{@render children()}` from inside `<main>` to after the closing `</main>` tag
3. **Predict:** Will the page content lose its max-width and padding?
4. **Verify:** Run `bun run dev`, navigate to `/blog`, inspect the layout
5. **What you learned:** Where you place `{@render children()}` determines the styling context. The parent controls the frame; moving the insertion point changes the layout
6. **Undo your change**

### Exercise 3: Understand the Key Block
1. Open `src/routes/+layout.svelte`
2. Remove the `{#key $page.url.pathname}` wrapper and its closing `{/key}` (keep the `<main>` and children render)
3. **Predict:** Will the page transition animation still work?
4. **Verify:** Run `bun run dev`, navigate between pages and watch for the fade animation
5. **What you learned:** `{#key}` forces Svelte to destroy and recreate children when the key changes. Without it, Svelte tries to reuse existing DOM nodes, which prevents the re-mount animation
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because composition builds on the concept of nesting components
- **Depends on:** [[props-and-events]] because `children` is received through `$props()`
- **Enables:** [[sveltekit-layouts]] because layouts are the primary use case for the children pattern
- **Related:** [[conditional-rendering]] because `{#if}` often controls which parts of a layout render
- **Related:** [[component-architecture]] because composition is a core architectural pattern

## Knowledge Check

1. What replaced `<slot>` in Svelte 5? --> See [What It Is](#what-it-is)
2. How does content between a component's tags become available inside the component? --> See [Worked Example](#worked-example)
3. What happens if you accept `children` but never call `{@render children()}`? --> See [Common Mistakes](#common-mistakes)
4. What SQL concept is most similar to the children pattern? --> See [The Analogy](#the-analogy)

## Go Deeper

- [Svelte docs -- {@render}](https://svelte.dev/docs/svelte/render)
- [Svelte docs -- Snippets](https://svelte.dev/docs/svelte/snippet)
- [Svelte tutorial -- Component composition](https://svelte.dev/tutorial/svelte/component-composition)
