---
title: "Data-Driven Components"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[typescript-interfaces]]"
  - "[[data-driven-architecture]]"
date: 2026-04-08
---

# Data-Driven Components


## The Analogy

Think of a parameterized report in SSRS or Power BI. The report template defines the layout -- headers, columns, formatting rules -- but the actual data comes from a SQL query. You change the query parameters and the report renders different content without touching the template. Data-driven components work the same way: the component is the template, and a typed data object is the query result. Adding new content means adding a row to the data, not editing the template.

## What It Is

A data-driven component is a Svelte component that receives all its content through typed props and never hardcodes user-facing text, labels, or values. The component defines the visual structure (layout, styling, interactions), while a separate TypeScript data file provides the content. The component renders whatever data it receives, and the data file is the single source of truth.

This separation means you can add a seventh service to the site by adding one object to `services.ts`. The component that renders service cards does not need a single line changed -- it already knows how to render any `Service` object.

## Why It Matters

In frontend interviews, "How do you scale a UI without creating tech debt?" comes up constantly. The answer is data-driven components. Without this pattern, adding content means editing markup, which means risk of breaking layouts, duplicating styles, and creating merge conflicts. With it, content changes are isolated to data files -- the same safety you get from separating DDL (schema) from DML (inserts) in SQL.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/types.ts` | The `Service` interface (lines 66-105) | Defines the "schema" every service must satisfy |
| `src/lib/data/services.ts` | The `services` array (lines 10-203) | The "INSERT" statements -- pure data, no UI logic |
| `src/lib/components/ServiceCard.svelte` | Props destructuring (lines 10-20) and template (lines 30-82) | The template that renders ANY Service object |
| `src/lib/data/locale.ts` | The `resolveLocale()` function | Like `COALESCE(fr_text, en_text)` -- extracts the right language |
| `src/lib/components/ServiceListingPage.svelte` | The `{#each sorted as service}` loop (lines 109-116) | Iterates the data array -- adding a service adds a card automatically |

## The Mental Model

```
SQL World                         Frontend World
-----------                       ---------------
CREATE TABLE services (           interface Service {
  id VARCHAR PRIMARY KEY,           id: string;
  title TEXT NOT NULL,              title: LocalizedString;
  station INT NOT NULL,             station: number;
  ...                               ...
);                                }

INSERT INTO services              export const services: Service[] = [
  VALUES ('sql-dev', ...);          { id: 'sql-dev', title: { en: '...' }, ... },
                                    { id: 'pipeline', title: { en: '...' }, ... },
                                  ];

SELECT * FROM services            {#each services as service}
  ORDER BY station;                 <ServiceCard {service} />
                                  {/each}
```

The component is the SELECT + presentation layer. The data file is the table. The interface is the CREATE TABLE. You never embed data in the SELECT statement; you never embed content in the component.

## Worked Example

```svelte
<!-- From: src/lib/components/ServiceCard.svelte -->
<!-- This component renders one service. Here's the data flow: -->

<script lang="ts">
  // Step 1: Import the type (like importing the table schema)
  import type { Service } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';

  // Step 2: Declare typed props (like function parameters with type constraints)
  let {
    service,    // The data row
    svgContent, // Pre-fetched SVG string
    index,      // Position in the list (0-based)
    total       // Total count for "Service 01 / 06" display
  }: {
    service: Service;
    svgContent: string;
    index: number;
    total: number;
  } = $props();

  // Step 3: Derive display values from data (like computed columns)
  let stationNum = $derived(String(service.station).padStart(2, '0'));
  let title = $derived(resolveLocale(service.title, 'en'));
  let description = $derived(resolveLocale(service.description, 'en'));
</script>

<!-- Step 4: The template uses ONLY derived values -- no hardcoded text -->
<h2>{title}<span class="title-dot">.</span></h2>
<p>{description}</p>

<!-- Step 5: Conditional rendering for optional data (like LEFT JOIN) -->
{#if service.stack && service.stack.length > 0}
  {#each service.stack as tech}
    <span class="stack-pill">{tech}</span>
  {/each}
{/if}
```

The component never says `"SQL Development"` anywhere. It says `{title}`, which comes from `resolveLocale(service.title, 'en')`, which reads from the data object. If you add a seventh service to the `services` array in `services.ts`, this component renders it without any changes.

## Common Mistakes

1. **Hardcoding content in the template:** Writing `<h2>SQL Development</h2>` directly in the component.
   - **What happens:** Adding a new service means editing the component, duplicating markup, and risking layout bugs.
   - **Fix:** Always use `{resolveLocale(service.title, 'en')}` or equivalent derived values.
   - **Why:** The component should be a reusable template, not a one-off page.

2. **Skipping the type contract:** Passing raw objects without an interface.
   - **What happens:** Typos in field names (`titl` instead of `title`) slip through. You discover the bug at runtime, not compile time.
   - **Fix:** Define an `interface Service` in `types.ts` and type your props explicitly.
   - **Why:** TypeScript catches shape mismatches at build time, just like a `NOT NULL` constraint catches missing data at insert time.

3. **Deriving counts from magic numbers:** Writing `total={6}` instead of `total={services.length}`.
   - **What happens:** You add a seventh service but the counter still says "/ 06". Station badges, navigation, and scroll positions all break.
   - **Fix:** Derive everything from the data array: `total={sorted.length}`, station dots from `{#each sorted as service, i}`.
   - **Why:** This is the "Data-Driven Station System" pattern from PATTERNS.md -- the array length IS the truth.

## Break It to Learn It

### Exercise 1: Remove a service and watch the UI adapt
1. Open `src/lib/data/services.ts`
2. Comment out the last service object (the `web-development` entry, lines ~172-202)
3. **Predict:** What will happen to the services listing page? How many stations will show? Will the counter break?
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/services`, observe
5. **What you learned:** The entire page adapts because every count, loop, and station number derives from the array
6. **Undo your change**

### Exercise 2: Add a field and see TypeScript enforce it
1. Open `src/lib/data/types.ts`
2. Add `difficulty: 'beginner' | 'advanced';` to the `Service` interface (after `station`)
3. **Predict:** What will happen when you run `bun run check`?
4. **Verify:** Run `bun run check` and read the errors
5. **What you learned:** TypeScript forces every service in `services.ts` to include the new field -- just like adding a NOT NULL column forces you to provide values for existing rows
6. **Undo your change**

### Exercise 3: Trace the data flow end to end
1. Open `src/lib/data/services.ts` and change the title of `sql-development` to `{ en: 'My Custom Title' }`
2. **Predict:** Where will this change appear on the site? (Hint: listing page, detail page, tabs, filters)
3. **Verify:** Run `bun run dev`, navigate to `/services` and `/services/sql-development`, check all locations
4. **What you learned:** One data change propagates everywhere because all components read from the same source -- no manual updates needed
5. **Undo your change**

## Connections

- **Depends on:** [[typescript-interfaces]] because the type contract is what makes the pattern safe
- **Depends on:** [[svelte-components]] because props are how data enters the component
- **Depends on:** [[data-driven-architecture]] because this pattern is the component-level application of that architecture
- **Enables:** [[filter-reset-pattern]] because filters operate on the same data array
- **Related:** [[action-pattern]] because actions are the behavior equivalent -- reusable behavior attached to data-driven components

## Knowledge Check

1. If you need to add a new service to the site, which files do you edit? -> See [The Mental Model](#the-mental-model)
2. What happens if you hardcode "6" as the total service count instead of using `services.length`? -> See [Common Mistakes](#common-mistakes)
3. How is a TypeScript interface like a CREATE TABLE statement? -> See [The Analogy](#the-analogy)
4. Why does ServiceCard use `resolveLocale()` instead of reading `.en` directly? -> See [Worked Example](#worked-example)

## Go Deeper

- [Svelte 5 Props Documentation](https://svelte.dev/docs/svelte/$props)
- [TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
