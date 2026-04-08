---
title: "SvelteKit Routing"
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

# SvelteKit Routing


## The Analogy

File-based routing -- the folder structure IS the URL structure. Think of it like a database schema: each folder is a table, the folder name is the table name, and `[brackets]` are parameterized columns. Visiting `/services/sql-development` is like running `SELECT * FROM services WHERE id = 'sql-development'` -- the URL path maps directly to a data lookup.

## What It Is

In SvelteKit, you do not write a routing configuration file. Instead, the file system defines your routes:

| File path | URL | SQL parallel |
|-----------|-----|-------------|
| `src/routes/+page.svelte` | `/` | `SELECT * FROM homepage` |
| `src/routes/blog/+page.svelte` | `/blog` | `SELECT * FROM blog_listing` |
| `src/routes/services/+page.svelte` | `/services` | `SELECT * FROM services_listing` |
| `src/routes/services/[id]/+page.svelte` | `/services/sql-development` | `SELECT * FROM services WHERE id = @id` |
| `src/routes/blog/[slug]/+page.svelte` | `/blog/why-i-left-orm` | `SELECT * FROM blog WHERE slug = @slug` |

The conventions:
- **`+page.svelte`** -- the component that renders for this route (the "view")
- **`+page.ts`** -- the load function that fetches data for this route (the "query")
- **`+layout.svelte`** -- a wrapper that persists across child routes (the "report template")
- **`[brackets]`** -- a dynamic segment, like a parameterized query. The value is extracted from the URL

When a user navigates to `/services/sql-development`, SvelteKit:
1. Matches the URL to `src/routes/services/[id]/`
2. Extracts `id = 'sql-development'` from the URL
3. Runs the `load()` function in `+page.ts`, passing `params.id`
4. Passes the loaded data to `+page.svelte` as props
5. Renders the page inside any `+layout.svelte` wrappers

## Why It Matters

Routing is the backbone of any multi-page application. Understanding file-based routing means you can add new pages, create dynamic detail views, and organize your application without touching any configuration. When a client asks "can we add a /pricing page?", you know exactly what to do: create `src/routes/pricing/+page.svelte`. This is also a top interview question for SvelteKit positions.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+page.svelte` | The home page component | Root route: renders at `/` |
| `src/routes/services/[id]/+page.ts` | The `load()` function with `params.id` | Dynamic route: extracts the service ID from the URL |
| `src/routes/services/[id]/+page.svelte` | How `data` is received and used | The page component consuming loaded data |
| `src/routes/blog/[slug]/+page.ts` | `params.slug` usage | Another dynamic route with different parameter name |
| `src/routes/blog/+page.svelte` | The blog listing page | Static route: renders at `/blog` |

## The Mental Model

```
File system:                           URL:                    SQL equivalent:

src/routes/
  +page.svelte                         /                       SELECT * FROM home
  +layout.svelte                       (wraps all pages)       report template

  blog/
    +page.svelte                       /blog                   SELECT * FROM posts
    +page.ts                           (loads data for /blog)  the stored procedure

    [slug]/
      +page.svelte                     /blog/my-post           SELECT * FROM posts WHERE slug = @slug
      +page.ts                         (loads one post)        EXEC GetPostBySlug @slug = 'my-post'

  services/
    +page.svelte                       /services               SELECT * FROM services
    +page.ts                           (loads data)

    [id]/
      +page.svelte                     /services/sql-dev       SELECT * FROM services WHERE id = @id
      +page.ts                         (loads one service)     EXEC GetServiceById @id = 'sql-dev'


What happens when you visit /services/sql-development:

  1. SvelteKit matches:    src/routes/services/[id]/
  2. Extracts parameter:   params.id = 'sql-development'
  3. Runs load function:   +page.ts → load({ params })
  4. Returns data:         { service, prev, next, relatedProjects }
  5. Renders component:    +page.svelte receives data as props
  6. Wraps in layout:      +layout.svelte adds Nav + Footer
```

## Worked Example

```typescript
// From: src/routes/services/[id]/+page.ts
// This is the "stored procedure" that runs when someone visits /services/[id]

import { error } from '@sveltejs/kit';
import {
  getServiceById,
  getVisibleServices,
  getAdjacentServices,
  getProjectsByService,
  fetchServiceSvgContents
} from '$lib/data';

// Step 1: SvelteKit calls this function automatically, passing the URL params
// params.id = 'sql-development' when visiting /services/sql-development
export async function load({ params, fetch }) {
  // Step 2: Look up the service — like SELECT * FROM services WHERE id = @id
  const service = getServiceById(params.id);

  // Step 3: Handle "not found" — like IF @@ROWCOUNT = 0 THROW 404
  if (!service || service.visible === false) {
    error(404, { message: 'Service not found' });
  }

  // Step 4: Fetch related data — like additional JOINs
  const services = getVisibleServices();
  const { prev, next } = getAdjacentServices(params.id);
  const relatedProjects = getProjectsByService(params.id);
  const serviceSvgContents = await fetchServiceSvgContents(fetch);

  // Step 5: Return the "result set" — this becomes props in +page.svelte
  return { service, services, prev, next, relatedProjects, serviceSvgContents };
}
```

```svelte
<!-- From: src/routes/services/[id]/+page.svelte -->
<!-- This component receives the loaded data and renders the page -->

<script lang="ts">
  import ServiceDetailPage from '$lib/components/ServiceDetailPage.svelte';
  import { resolveLocale } from '$lib/data/locale.js';

  // Step 6: Receive the data from the load function as props
  // 'data' contains everything returned by load()
  let { data } = $props();
</script>

<!-- Step 7: Use the data to set the page title -->
<svelte:head>
  <title>{resolveLocale(data.service.title, 'en')} -- yesid.</title>
</svelte:head>

<!-- Step 8: Pass the data down to the detail component -->
<ServiceDetailPage
  service={data.service}
  services={data.services}
  prev={data.prev}
  next={data.next}
/>
```

**The full flow in plain language:** A user clicks a link to `/services/sql-development`. SvelteKit extracts `sql-development` from the URL, runs the load function which looks up the service from the data layer, and passes the result to the page component. The page component sets the HTML title and delegates rendering to `ServiceDetailPage`. All of this happens before the page is shown to the user.

## Common Mistakes

1. **Creating a file without the `+` prefix:**
   - **What happens:** You create `page.svelte` instead of `+page.svelte` -- SvelteKit ignores it completely
   - **Fix:** Always use the `+` prefix: `+page.svelte`, `+page.ts`, `+layout.svelte`
   - **Why:** The `+` prefix is how SvelteKit distinguishes route files from regular components. Files without `+` are invisible to the router

2. **Hardcoding data in the page instead of using a load function:**
   - **What happens:** You import data directly in `+page.svelte` instead of using `+page.ts` -- this bypasses SvelteKit's data loading system
   - **Fix:** Put data fetching in `+page.ts` and access it via `let { data } = $props()`
   - **Why:** Load functions run before the page renders, handle errors properly (404s), and integrate with SvelteKit's preloading and SSR

3. **Confusing `[id]` folder naming with the parameter name:**
   - **What happens:** You name the folder `[serviceId]` but access `params.id` in the load function -- it is `undefined`
   - **Fix:** The parameter name matches the bracket name. `[serviceId]` means `params.serviceId`, `[slug]` means `params.slug`
   - **Why:** SvelteKit uses the folder name as the parameter key. Think of it as declaring `@serviceId` vs `@id` in a stored procedure

## Break It to Learn It

### Exercise 1: Trace a Route
1. Open your browser to `http://localhost:5173/blog`
2. Find the corresponding files: `src/routes/blog/+page.ts` and `src/routes/blog/+page.svelte`
3. **Predict:** What data does the load function return?
4. **Verify:** Read `src/routes/blog/+page.ts` -- it returns `{ posts, tags, languages, svgContents }`
5. **What you learned:** The URL path maps directly to the file system path, and the load function is the data source

### Exercise 2: Break the Dynamic Route
1. Open `src/routes/services/[id]/+page.ts`
2. Change `params.id` to `params.slug` on line 14
3. **Predict:** What happens when you visit `/services/sql-development`?
4. **Verify:** Run `bun run dev`, navigate to `/services/sql-development` -- the service lookup returns undefined, and you get a 404
5. **What you learned:** The parameter name in the load function must match the folder name in brackets. `[id]` means `params.id`, not `params.slug`
6. **Undo your change**

### Exercise 3: Add a New Static Route
1. Create a new file: `src/routes/test/+page.svelte`
2. Add minimal content: `<h1>Test Page</h1>`
3. **Predict:** Will navigating to `/test` show this page without any other configuration?
4. **Verify:** Run `bun run dev`, navigate to `http://localhost:5173/test`
5. **What you learned:** Creating a folder with `+page.svelte` automatically creates a route. No router config needed
6. **Delete the test folder**

## Connections

- **Depends on:** [[svelte-components]] because `+page.svelte` files are Svelte components
- **Enables:** [[sveltekit-load-functions]] because load functions power the data layer for each route
- **Enables:** [[sveltekit-layouts]] because layouts wrap route pages
- **Related:** [[props-and-events]] because the `data` prop connects load functions to page components

## Knowledge Check

1. What naming convention makes a file a route in SvelteKit? --> See [What It Is](#what-it-is)
2. How do you create a dynamic route parameter? --> See [The Mental Model](#the-mental-model)
3. What happens when a load function calls `error(404)`? --> See [Worked Example](#worked-example)
4. How does the parameter name in `params.id` relate to the folder name? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [SvelteKit docs -- Routing](https://svelte.dev/docs/kit/routing)
- [SvelteKit tutorial -- Pages](https://svelte.dev/tutorial/kit/pages)
