---
title: "Props and Events"
domain: frontend
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - frontend
  - beginner
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Props and Events


## The Analogy

Props are like function parameters: `EXEC GetUser @userId = 5`. When you call a stored procedure, you pass in values that control what it does. When you use a component, you pass in props that control what it shows. The parent decides what data flows in; the child decides how to display it.

## What It Is

**Props** (short for "properties") are the inputs a component declares and receives from its parent. In Svelte 5, you declare props using the `$props()` rune inside the `<script>` block. This replaced the old Svelte 4 syntax (`export let propName`) entirely.

The syntax looks like this:

```typescript
let { service, index, total }: { service: Service; index: number; total: number } = $props();
```

This is destructuring with TypeScript types -- you declare what inputs this component expects, and the compiler enforces that every parent provides them. If a parent forgets a required prop, TypeScript flags it at build time, just like a stored procedure that requires `@userId` will fail if you call it without that parameter.

Props flow in one direction: **parent to child**. A child component never modifies its props directly. If the child needs to communicate back to the parent, it uses callback props (functions passed as props) or events.

## Why It Matters

Props are the contract between components. When you see a component's props, you immediately know what data it needs -- just like reading a procedure's parameter list tells you what it requires. Getting props right means your components are reusable, testable, and self-documenting. This is the #1 concept interviewers test when they ask "how do components communicate?"

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/ServiceCard.svelte` | Lines 7-20: the `$props()` destructuring with full types | Real-world typed props with multiple parameters |
| `src/lib/components/TagList.svelte` | Line 7: `let { tags = [] }: { tags: string[] } = $props()` | Shows a default value for an optional prop |
| `src/routes/services/[id]/+page.svelte` | Lines 6, 14-21: receiving `data` and passing it to `ServiceDetailPage` | Shows the prop chain: load function -> page -> component |
| `src/routes/+layout.svelte` | Line 9: `let { children } = $props()` | The special `children` prop for rendering nested content |
| `src/lib/components/Nav.svelte` | Line 11: `let { pathname = '/' }: { pathname?: string } = $props()` | Optional prop with a default value |

## The Mental Model

```
SQL analogy:

    EXEC GetServiceCard
        @service  = <Service object>,    -- required, no default
        @index    = 3,                    -- required, no default
        @total    = 6                     -- required, no default

Svelte equivalent:

    <ServiceCard
        service={theService}
        index={3}
        total={6}
    />

Inside ServiceCard.svelte:

    let { service, index, total }: {
        service: Service;    -- typed parameter
        index: number;       -- typed parameter
        total: number;       -- typed parameter
    } = $props();

Data flow:

    Parent Component
        |
        |  passes props down (like passing @parameters)
        v
    Child Component
        |
        |  renders output (like SELECT result)
        v
    HTML on screen
```

**Key rule:** Data flows DOWN through props. Never UP. A child never modifies a prop it received. This is like how a stored procedure should not modify its input parameters -- it reads them and produces output.

## Worked Example

```svelte
<!-- From: src/lib/components/TagList.svelte -->
<!-- This component renders a horizontal list of tag pills. -->

<script lang="ts">
  import { reveal } from '$lib/motion/actions/reveal.js';
  import { stagger } from '$lib/motion/utils/stagger.js';

  // Step 1: Declare props with $props() — this is the parameter list
  // `tags` has a default value of [] — it's optional
  // In SQL terms: @tags VARCHAR(MAX) = ''
  let { tags = [] }: { tags: string[] } = $props();
</script>

<!-- Step 2: Use the prop in markup -->
<!-- Guard: only render if tags exist — like WHERE tags IS NOT NULL -->
{#if tags.length > 0}
  <ul class="flex flex-wrap gap-2" data-testid="tag-list">
    <!-- Step 3: Loop over the prop value — like a cursor over a result set -->
    {#each tags as tag, i}
      <li class="inline-flex items-center rounded-full border ...">
        {tag}
      </li>
    {/each}
  </ul>
{/if}
```

The flow: a parent component passes an array of strings as the `tags` prop. TagList receives it, checks if it is non-empty, and renders each tag as a styled pill. If the parent passes nothing, `tags` defaults to an empty array and the component renders nothing.

**How the parent calls it:**
```svelte
<!-- In some parent component -->
<TagList tags={['PostgreSQL', 'ETL', 'dbt']} />
```

This is equivalent to `EXEC RenderTagList @tags = 'PostgreSQL,ETL,dbt'` -- you pass the data in, and the procedure handles the presentation.

## Common Mistakes

1. **Trying to mutate a prop inside the child:**
   - **What happens:** You write `tags.push('new')` inside TagList and the parent's data gets corrupted or changes do not reflect properly
   - **Fix:** Never mutate props. If you need a modified version, create a new derived value: `let sorted = $derived([...tags].sort())`
   - **Why:** Props flow one way. Mutating them breaks the data contract between parent and child, just like modifying an INPUT parameter inside a stored procedure is a code smell

2. **Forgetting to type the props:**
   - **What happens:** You write `let { tags } = $props()` without the type annotation and get no compile-time safety
   - **Fix:** Always add the type: `let { tags }: { tags: string[] } = $props()`
   - **Why:** TypeScript cannot infer prop types from usage alone. The type annotation is the contract -- like defining parameter types in `CREATE PROCEDURE`

3. **Using the old Svelte 4 syntax (`export let`):**
   - **What happens:** The code still compiles in some cases but does not use the Svelte 5 reactivity system correctly
   - **Fix:** Always use `$props()` in this project. Search for `export let` -- if you find any, it is legacy code
   - **Why:** Svelte 5 runes replaced the old reactivity model entirely. `$props()` integrates with `$state`, `$derived`, and `$effect`

## Break It to Learn It

### Exercise 1: Remove a Required Prop
1. Open `src/routes/services/[id]/+page.svelte`
2. Remove the `service={data.service}` prop from the `<ServiceDetailPage>` tag (line 15)
3. **Predict:** Will this cause a runtime error, a build error, or silently render nothing?
4. **Verify:** Run `bun run check` and observe the TypeScript error
5. **What you learned:** TypeScript catches missing required props at build time, not runtime
6. **Undo your change**

### Exercise 2: Add a Default Value
1. Open `src/lib/components/TagList.svelte`
2. Change `let { tags = [] }` to `let { tags }` (remove the default)
3. **Predict:** What happens if a parent uses `<TagList />` without passing `tags`?
4. **Verify:** Run `bun run check` to see if TypeScript flags the missing prop
5. **What you learned:** Default values make props optional -- without a default, the prop is required
6. **Undo your change**

### Exercise 3: Pass an Extra Prop
1. Open `src/routes/+layout.svelte`
2. Change `<Nav pathname={$page.url.pathname} />` to `<Nav pathname={$page.url.pathname} color="red" />`
3. **Predict:** Will Nav ignore the extra prop, throw an error, or use it somehow?
4. **Verify:** Run `bun run check` and observe
5. **What you learned:** Components only receive props they declare in `$props()` -- extra props are flagged by TypeScript, like passing an undeclared parameter to a stored procedure
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because props live inside the component's script block
- **Enables:** [[svelte-5-runes]] because `$props()` is itself a rune and integrates with `$state` and `$derived`
- **Enables:** [[component-architecture]] because well-defined props create clean component interfaces
- **Related:** [[sveltekit-load-functions]] because load functions produce the data that becomes props

## Knowledge Check

1. What is the Svelte 5 syntax for declaring props? --> See [What It Is](#what-it-is)
2. In which direction does data flow through props? --> See [The Mental Model](#the-mental-model)
3. How do you make a prop optional? --> See [Worked Example](#worked-example)
4. Why should you never use `export let` in this project? --> See [Common Mistakes](#common-mistakes)
5. What happens if a parent forgets a required prop? --> See [Break It to Learn It](#break-it-to-learn-it)

## Go Deeper

- [Svelte docs -- $props](https://svelte.dev/docs/svelte/$props)
- [Svelte tutorial -- Declaring props](https://svelte.dev/tutorial/svelte/declaring-props)
