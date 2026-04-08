---
title: "Conditional Rendering"
domain: frontend
difficulty: 1
difficulty_label: beginner
reading_time: 7
tags:
  - learn
  - frontend
  - beginner
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Conditional Rendering


## The Analogy

Like `CASE WHEN` in SQL -- different conditions show different content. `{#if}` is `CASE WHEN condition THEN ...`, `{:else}` is `ELSE ...`, and `{#each}` is a cursor that loops over a result set, rendering one row at a time.

## What It Is

Svelte provides template blocks that control what HTML renders based on data. These are not JavaScript -- they are Svelte template syntax that the compiler transforms into efficient DOM operations.

The three core blocks:

| Block | SQL Equivalent | What it does |
|-------|---------------|--------------|
| `{#if condition}...{/if}` | `CASE WHEN x THEN ... END` | Render content only when condition is true |
| `{:else if condition}` | `WHEN y THEN ...` | Additional branch in an if chain |
| `{:else}` | `ELSE ...` | Fallback when no condition matches |
| `{#each array as item}...{/each}` | `SELECT ... FROM @table` or cursor | Render content once per item in an array |
| `{:else}` on `{#each}` | `IF @@ROWCOUNT = 0` | Render fallback when the array is empty |

These blocks live in the **markup** section of a `.svelte` file (not in the `<script>` block). They mix HTML and logic in a way that looks strange if you come from SQL, but the pattern is consistent: `{#` opens a block, `{:` adds a branch, `{/` closes it.

## Why It Matters

Every UI needs to show or hide content based on conditions and loop over data collections. Conditional rendering is how you build filtered views, loading states, error messages, and data-driven lists. Without it, you would have to render everything and hide it with CSS -- which is wasteful and insecure (hidden content is still in the DOM and visible to anyone who inspects the page).

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/ServiceCard.svelte` | Lines 46-48: `{#if subtitle}` | Conditional rendering: only show subtitle if data exists |
| `src/lib/components/ServiceCard.svelte` | Lines 52-58: `{#if service.stack}` + `{#each}` | Combined: conditional check THEN loop over stack items |
| `src/lib/components/TagList.svelte` | Lines 10-22: `{#if}` wrapping `{#each}` | Guard pattern: render nothing if the array is empty |
| `src/lib/components/Footer.svelte` | Lines 18-39: `{#if siteMeta.links.github}` | Only render links that exist in the data |
| `src/routes/+layout.svelte` | Lines 33-36: `{#if !hideFooter}` | Conditionally rendering the entire footer component |

## The Mental Model

```
SQL:
    SELECT
        title,
        CASE WHEN subtitle IS NOT NULL THEN subtitle ELSE '' END AS subtitle,
        stack
    FROM Services
    WHERE visible = 1

Svelte template equivalent:

    <h2>{title}</h2>

    {#if subtitle}          <!-- WHERE subtitle IS NOT NULL -->
        <p>{subtitle}</p>
    {/if}

    {#if stack.length > 0}  <!-- WHERE stack count > 0 -->
        {#each stack as tech}   <!-- cursor over stack rows -->
            <span>{tech}</span>
        {/each}
    {:else}                  <!-- IF @@ROWCOUNT = 0 -->
        <p>No technologies listed</p>
    {/if}


Block syntax pattern:
    {#keyword}   <-- opens (if, each)
    {:keyword}   <-- branches (else, else if)
    {/keyword}   <-- closes (if, each)
```

**Key insight:** When a condition changes from `true` to `false`, Svelte removes those DOM elements entirely -- they are not hidden with `display: none`, they are deleted from the page. When the condition becomes `true` again, Svelte creates them fresh. This is efficient and keeps the DOM clean.

## Worked Example

```svelte
<!-- From: src/lib/components/ServiceCard.svelte (lines 42-62, simplified) -->

<!-- Always shown: the title -->
<h2 class="service-title">
  {title}<span class="title-dot">.</span>
</h2>

<!-- Conditional: subtitle only appears if data exists -->
<!-- SQL equivalent: WHERE subtitle IS NOT NULL -->
{#if subtitle}
  <p class="service-subtitle">{subtitle}</p>
{/if}

<!-- Always shown: the description -->
<p class="service-description">{description}</p>

<!-- Conditional + loop: only if stack has items, then loop over them -->
<!-- SQL equivalent:
     IF EXISTS (SELECT 1 FROM @stack)
       SELECT tech FROM @stack
-->
{#if service.stack && service.stack.length > 0}
  <div class="stack-pills">
    {#each service.stack as tech}
      <span class="stack-pill">{tech}</span>
    {/each}
  </div>
{/if}
```

**The flow in plain language:**

1. The title always renders -- no condition
2. If `subtitle` is a non-null/non-undefined value, the subtitle paragraph appears. Otherwise, Svelte skips it entirely
3. The description always renders
4. If `service.stack` exists AND has at least one item, Svelte enters the `{#each}` block and creates one `<span>` per technology. If the stack is empty or undefined, the entire pills section is absent from the page

## Common Mistakes

1. **Checking for `undefined` instead of truthiness:**
   - **What happens:** You write `{#if value !== undefined}` when the value could also be `null`, `''`, or `0`
   - **Fix:** Use `{#if value}` for general truthiness, or be explicit: `{#if value !== null && value !== undefined}`
   - **Why:** JavaScript truthiness differs from SQL NULL checks. In JS, empty string `''`, `0`, `null`, `undefined`, and `false` are all falsy. In SQL, only `NULL` fails an `IS NOT NULL` check

2. **Forgetting to close a block:**
   - **What happens:** You write `{#if condition}` and forget `{/if}` -- the compiler throws a parse error
   - **Fix:** Always write the opening and closing tags together, then fill in the content
   - **Why:** Svelte blocks must be balanced, like XML tags. The compiler cannot guess where a block ends

3. **Using `{#each}` without a guard for empty arrays:**
   - **What happens:** The `{#each}` block renders zero items (no error), but the surrounding container (like a `<ul>` or `<div>` with border) still appears empty on the page
   - **Fix:** Wrap `{#each}` in `{#if array.length > 0}` or use `{:else}` on the `{#each}` block to show a fallback
   - **Why:** An empty `<ul>` is valid HTML but looks like a bug to users -- an empty box with a border and no content

## Break It to Learn It

### Exercise 1: Remove the Guard
1. Open `src/lib/components/TagList.svelte`
2. Remove the `{#if tags.length > 0}` wrapper and its closing `{/if}` (lines 10 and 22), keeping the `<ul>` and `{#each}` block
3. **Predict:** What renders when `tags` is an empty array? Will you see an empty `<ul>` element?
4. **Verify:** Run `bun run dev`, inspect the DOM in browser dev tools on a page that uses TagList
5. **What you learned:** The `{#each}` produces zero `<li>` elements for an empty array, but the `<ul>` container still renders -- the guard prevents an empty container from appearing
6. **Undo your change**

### Exercise 2: Add an {:else} Branch
1. Open `src/lib/components/ServiceCard.svelte`
2. After `{#if subtitle}` (line 46) and its `<p>` (line 47), before `{/if}` (line 48), add: `{:else}<p class="service-subtitle" style="opacity:0.3">No subtitle</p>`
3. **Predict:** Will every service without a subtitle now show "No subtitle" in gray?
4. **Verify:** Run `bun run dev`, navigate to `/services`, check services that lack subtitles
5. **What you learned:** `{:else}` provides a fallback branch, just like `ELSE` in a SQL `CASE` statement
6. **Undo your change**

### Exercise 3: Use {:else} on {#each}
1. Open `src/lib/components/TagList.svelte`
2. Replace the `{#if tags.length > 0}` guard with nothing (remove lines 10 and 22)
3. Change the `{#each}` block to include an empty-state fallback:
   ```
   {#each tags as tag, i}
     <li>...</li>
   {:else}
     <p>No tags</p>
   {/each}
   ```
4. **Predict:** What renders when tags is `[]`?
5. **Verify:** Run `bun run dev` and check
6. **What you learned:** `{:else}` on `{#each}` is the Svelte equivalent of `IF @@ROWCOUNT = 0` -- it runs when the array is empty
7. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because conditional blocks live in the component's markup section
- **Enables:** [[slots-and-composition]] because understanding template syntax is required before learning snippet/render patterns
- **Related:** [[svelte-5-runes]] because `$derived` values often drive the conditions in `{#if}` blocks
- **Related:** [[props-and-events]] because props provide the data that conditions check

## Knowledge Check

1. What is the difference between `{#if}`, `{:else if}`, and `{:else}`? --> See [What It Is](#what-it-is)
2. What happens to DOM elements when an `{#if}` condition becomes false? --> See [The Mental Model](#the-mental-model)
3. How do you handle an empty array in an `{#each}` block? --> See [Common Mistakes](#common-mistakes)
4. What is the Svelte block syntax pattern for opening, branching, and closing? --> See [The Mental Model](#the-mental-model)

## Go Deeper

- [Svelte docs -- {#if}](https://svelte.dev/docs/svelte/if)
- [Svelte docs -- {#each}](https://svelte.dev/docs/svelte/each)
- [Svelte tutorial -- If blocks](https://svelte.dev/tutorial/svelte/if-blocks)
