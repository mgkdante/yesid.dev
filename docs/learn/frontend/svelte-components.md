---
title: "Svelte Components"
domain: frontend
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - frontend
  - beginner
prerequisites:
  - "[[sveltekit-project-structure]]"
date: 2026-04-08
---

# Svelte Components


## The Analogy

A Svelte component is like a stored procedure that also controls what the user sees. It takes parameters (props), runs logic, and outputs a result (HTML). But unlike a stored proc, it re-runs automatically when its inputs change -- there is no `EXEC` call; the framework handles re-execution for you.

## What It Is

A Svelte component is a single `.svelte` file that bundles three concerns into one unit:

1. **`<script>`** -- the logic (like the body of a stored procedure)
2. **Markup** -- the HTML template that defines what the user sees (like a formatted result set)
3. **`<style>`** -- scoped CSS that only affects this component (like column formatting rules that apply only to one report)

When you save a `.svelte` file, the Svelte compiler transforms it into optimized JavaScript. There is no virtual DOM diffing at runtime -- Svelte generates direct DOM update instructions at build time. Think of it as a precompiled query plan: the optimizer does the heavy lifting once, and execution is fast every time.

Components are the fundamental building block of a Svelte application. Every piece of UI -- a navigation bar, a tag list, a footer -- is a component. Components can contain other components, forming a tree structure much like how a master stored procedure might call several sub-procedures.

## Why It Matters

Understanding components is the entry point to all frontend work. Every feature you build -- a form, a card, a page section -- is a component. If you understand how to read and write `.svelte` files, you can contribute to any part of the codebase. This is the concept that job postings mean when they say "component-based architecture."

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Footer.svelte` | Complete component: script, markup, style all in one file | Simplest real component in the project -- no props, minimal logic |
| `src/lib/components/TagList.svelte` | The `$props()` call and `{#each}` loop | Shows a component receiving data and rendering a list |
| `src/lib/components/Nav.svelte` | The imports and nested component usage | Shows how components compose together |
| `src/routes/+layout.svelte` | `<Nav>` and `<Footer>` used as HTML-like tags | Shows components being consumed by a parent |

## The Mental Model

```
                 +--------------------------+
                 |    Footer.svelte         |
                 +--------------------------+
                 |  <script lang="ts">      |   <-- Logic: imports, variables, functions
                 |    import { siteMeta }... |       (like the BEGIN...END of a stored proc)
                 |    const year = ...       |
                 |  </script>               |
                 +--------------------------+
                 |  <footer>                |   <-- Markup: what the user sees
                 |    &copy; {year}          |       (like SELECT output formatted as HTML)
                 |    {#if siteMeta.links}   |
                 |      <a href=...>        |
                 |    {/if}                 |
                 |  </footer>              |
                 +--------------------------+
                 |  <style>                 |   <-- Scoped styles: only affect THIS component
                 |    footer { ... }        |       (like column formatting for one report)
                 |  </style>               |
                 +--------------------------+

    Compiler turns this into optimized JS at build time.
    No runtime template parsing. No virtual DOM.
```

**What happens when you use a component:**

1. Parent file imports: `import Footer from '$lib/components/Footer.svelte'`
2. Parent uses it like an HTML tag: `<Footer />`
3. Svelte compiler wires everything up -- props flow in, HTML renders out
4. Styles stay scoped -- Footer's CSS cannot leak into other components

## Worked Example

```svelte
<!-- From: src/lib/components/Footer.svelte -->
<!-- This component renders the site footer with copyright and social links. -->

<script lang="ts">
  // Step 1: Import data (like declaring input parameters)
  import { siteMeta } from '$lib/data';

  // Step 2: Compute a value (like a local variable in T-SQL)
  const year = new Date().getFullYear();
</script>

<!-- Step 3: Markup — what the user sees (like a formatted result set) -->
<footer
  data-testid="footer"
  class="relative z-50 border-t border-[var(--border)] bg-[var(--bg-primary)] px-6 py-8"
>
  <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
    <!-- Step 4: Use the variable with curly braces — {year} outputs 2026 -->
    <p class="text-sm text-[var(--text-secondary)]">
      &copy; {year} <span class="font-heading font-semibold text-[var(--text-primary)]">yesid<span class="text-brand-primary">.</span></span>
    </p>

    <!-- Step 5: Conditional rendering — {#if ...} is like CASE WHEN in SQL -->
    <div class="flex items-center gap-4">
      {#if siteMeta.links.github}
        <a href={siteMeta.links.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      {/if}
    </div>
  </div>
</footer>
```

The flow in plain language: when this component renders, it imports the site metadata, computes the current year, and outputs a footer bar. The `{year}` expression injects the JavaScript value into the HTML. The `{#if}` block only renders the GitHub link if the URL exists in the data -- just like `WHERE github_url IS NOT NULL` filters rows.

## Common Mistakes

1. **Forgetting the `<script lang="ts">` tag:**
   - **What happens:** TypeScript types are ignored, and you get no type-checking in the logic section
   - **Fix:** Always include `lang="ts"` on the script tag for TypeScript projects
   - **Why:** Svelte supports both JS and TS, but `lang="ts"` tells the compiler to run the TypeScript checker

2. **Putting business logic in the markup:**
   - **What happens:** Complex expressions in `{#if}` blocks become unreadable, like writing a 20-line WHERE clause inline
   - **Fix:** Compute values in the `<script>` block, then reference simple variables in markup
   - **Why:** The script block is your logic layer; markup is your presentation layer. Keep them separated like you would separate a view definition from its underlying query.

3. **Writing styles that bleed across components:**
   - **What happens:** You style a generic HTML tag like `p { color: red }` and wonder why other pages change
   - **Fix:** Svelte scopes styles by default, but only for elements in THIS file. Use class names, not bare tag selectors
   - **Why:** Scoped styles add a unique attribute hash to your selectors. Bare tag selectors with `:global()` escape that scope

## Break It to Learn It

### Exercise 1: See the Three Sections
1. Open `src/lib/components/Footer.svelte`
2. Identify the three sections: `<script>`, markup, and note there is no `<style>` block (styles are in Tailwind classes)
3. **Predict:** If you delete the `<script>` block entirely, what happens to `{year}` in the markup?
4. **Verify:** Delete the script block, run `bun run dev`, check the browser console for errors
5. **What you learned:** The script block is required for any JavaScript expression used in markup -- without it, `year` is undefined
6. **Undo your change**

### Exercise 2: Add a New Element
1. Open `src/lib/components/Footer.svelte`
2. Add `<p class="text-xs text-[var(--text-secondary)]">Built with SvelteKit</p>` inside the flex container, below the social links div
3. **Predict:** Will this text appear centered or right-aligned on desktop?
4. **Verify:** Run `bun run dev`, navigate to any page, and check the footer
5. **What you learned:** New elements inherit the flex layout of their parent container
6. **Undo your change**

### Exercise 3: Break the Import
1. Open `src/lib/components/Footer.svelte`
2. Change `import { siteMeta } from '$lib/data'` to `import { siteMeta } from '$lib/nonexistent'`
3. **Predict:** Will the page crash at build time or at runtime?
4. **Verify:** Run `bun run dev` and observe the error
5. **What you learned:** Import errors are caught at build time by the compiler, not at runtime -- similar to how a stored procedure with a missing table reference fails at compile time, not execution time
6. **Undo your change**

## Connections

- **Depends on:** [[sveltekit-project-structure]] because you need to know where component files live in the folder hierarchy
- **Enables:** [[props-and-events]] because props are how components communicate
- **Enables:** [[svelte-5-runes]] because runes are the reactivity system inside components
- **Enables:** [[conditional-rendering]] because `{#if}` and `{#each}` are template syntax used in the markup section
- **Related:** [[component-architecture]] because it covers how to organize and compose components at scale

## Knowledge Check

1. What are the three sections of a `.svelte` file? --> See [The Mental Model](#the-mental-model)
2. When does the Svelte compiler do its optimization work -- at build time or runtime? --> See [What It Is](#what-it-is)
3. Can CSS from one component accidentally affect another component? --> See [Common Mistakes](#common-mistakes)
4. How do you use a component in another file? --> See [The Mental Model](#the-mental-model)
5. What does `{year}` do in the markup section? --> See [Worked Example](#worked-example)

## Go Deeper

- [Svelte official tutorial -- Your first component](https://svelte.dev/tutorial/svelte/welcome-to-svelte)
- [Svelte docs -- .svelte files](https://svelte.dev/docs/svelte/overview)
