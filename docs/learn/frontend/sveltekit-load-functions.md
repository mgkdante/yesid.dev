---
title: "SvelteKit Load Functions"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[sveltekit-routing]]"
  - "[[typescript-interfaces]]"
date: 2026-04-08
---

# SvelteKit Load Functions


## The Analogy

A load function is a stored procedure that runs before the page renders. You define inputs (URL parameters), write the query logic (data fetching), handle errors (404 not found), and return a result set. The page component receives this result set as props and renders it -- no data fetching logic in the UI layer. Clean separation, just like separating your business logic stored procedures from your reporting views.

## What It Is

A **load function** is an exported `load()` function in a `+page.ts` file. SvelteKit calls it automatically before rendering the corresponding `+page.svelte` component. The load function receives context (URL parameters, fetch function) and returns an object that becomes the page's `data` prop.

```typescript
// +page.ts — the "stored procedure"
export function load({ params }) {
  const item = getItemById(params.id);
  return { item };  // This becomes data.item in the page component
}
```

```svelte
<!-- +page.svelte — the "view" -->
<script lang="ts">
  let { data } = $props();
  // data.item is now available
</script>
```

Load functions can be synchronous or async. They can call `error(404)` to trigger error pages. They can access URL parameters, query strings, and a special `fetch` function that works on both server and client.

The key benefit: data loading is **separate from rendering**. The page component never needs to manage loading states, fetch calls, or error handling -- the load function handles all of that before the component even mounts.

## Why It Matters

Load functions are how SvelteKit eliminates the "loading spinner" problem that plagues many web apps. Because data loads BEFORE the page renders, users see complete pages instead of empty shells with spinners. This pattern also enables server-side rendering (SSR), preloading on hover, and clean error handling. Understanding load functions is essential for any SvelteKit role.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/blog/+page.ts` | The synchronous `load()` returning posts, tags, languages | Simple load: no params, no async, just fetch all posts |
| `src/routes/services/[id]/+page.ts` | Full `load({ params, fetch })` with error handling | Complex load: param extraction, 404 guard, multiple data sources |
| `src/routes/blog/[slug]/+page.ts` | `load({ params })` with post lookup and HTML processing | Load with data transformation: processes markdown after fetching |
| `src/routes/+page.ts` | `export const ssr = false` | Not a load function but a route config -- disables SSR for the home page |
| `src/routes/services/+page.ts` | `load({ fetch })` using the framework's fetch | Async load that fetches SVG files at build time |

## The Mental Model

```
Traditional web app (no load functions):

    User visits /services/sql-dev
         |
         v
    Page renders EMPTY shell
         |
         v
    JavaScript fetches data (loading spinner...)
         |
         v
    Data arrives, page re-renders with content


SvelteKit with load functions:

    User visits /services/sql-dev
         |
         v
    SvelteKit runs +page.ts load()     <-- data loads FIRST
         |
         |  load() returns { service, prev, next, ... }
         v
    SvelteKit renders +page.svelte     <-- page renders with data
         |
         v
    User sees complete page            <-- no spinner, no flash

    If load() calls error(404):
         |
         v
    SvelteKit renders the error page   <-- clean error handling


SQL parallel:

    -- The load function is like:
    CREATE PROCEDURE LoadServicePage
        @id VARCHAR(50)           -- params.id
    AS BEGIN
        -- Step 1: Look up the record
        SELECT * FROM Services WHERE id = @id;

        -- Step 2: Handle not found
        IF @@ROWCOUNT = 0
            THROW 40400, 'Service not found', 1;

        -- Step 3: Get related data (additional queries)
        SELECT * FROM Services WHERE visible = 1;
        SELECT * FROM Projects WHERE service_id = @id;

        -- Step 4: Return all result sets → becomes the data prop
    END
```

## Worked Example

```typescript
// From: src/routes/services/[id]/+page.ts
// This load function powers the /services/[id] detail page

import { error } from '@sveltejs/kit';
import {
  getServiceById,
  getVisibleServices,
  getAdjacentServices,
  getProjectsByService,
  fetchServiceSvgContents
} from '$lib/data';

// Step 1: SvelteKit calls this with URL params and a fetch function
// For /services/sql-development → params.id = 'sql-development'
export async function load({ params, fetch }) {
  // Step 2: Primary lookup — SELECT * FROM services WHERE id = @id
  const service = getServiceById(params.id);

  // Step 3: Error guard — IF @@ROWCOUNT = 0 THROW 404
  // This immediately stops execution and shows the error page
  if (!service || service.visible === false) {
    error(404, { message: 'Service not found' });
  }

  // Step 4: Additional queries — like JOINing related tables
  const services = getVisibleServices();      // all services for navigation
  const { prev, next } = getAdjacentServices(params.id);  // prev/next for pagination
  const relatedProjects = getProjectsByService(params.id); // projects using this service
  const serviceSvgContents = await fetchServiceSvgContents(fetch);  // SVG illustrations

  // Step 5: Return the result set — becomes data.service, data.prev, etc.
  return { service, services, prev, next, relatedProjects, serviceSvgContents };
}
```

**Contrast with a simpler load function:**

```typescript
// From: src/routes/blog/+page.ts
// No params needed — just load all professional blog posts

import { getPostsByCategory, getTagsForCategory, getLanguagesForCategory, getSvgContentsForPosts } from '$lib/data';

export function load() {
  // No params — this is a listing page, not a detail page
  // Like: SELECT * FROM posts WHERE category = 'professional'
  const posts = getPostsByCategory('professional');
  const tags = getTagsForCategory('professional');
  const languages = getLanguagesForCategory('professional');
  const svgContents = getSvgContentsForPosts(posts);

  return { posts, tags, languages, svgContents };
}
```

**The difference:** The blog listing has no dynamic URL parameters -- it always loads the same data. The service detail page extracts an `id` from the URL and uses it to look up a specific record. Both patterns return objects that become the page's `data` prop.

## Common Mistakes

1. **Fetching data in the component instead of the load function:**
   - **What happens:** You use `onMount(() => fetch(...))` in `+page.svelte` -- the page renders empty first, then fills in after the fetch completes
   - **Fix:** Move data fetching to `+page.ts`. The load function runs before the component mounts, so data is ready on first render
   - **Why:** Load functions enable SSR and prevent loading spinners. Component-level fetching bypasses both and creates a worse user experience

2. **Forgetting to handle the error case:**
   - **What happens:** A user visits `/services/nonexistent` and gets an unhandled error or a blank page instead of a 404
   - **Fix:** Check if the lookup returned null and call `error(404, { message: '...' })` to trigger a proper error page
   - **Why:** Without explicit error handling, invalid URLs either crash the page or show broken content. The `error()` function is like `THROW` in T-SQL

3. **Returning data that is not serializable:**
   - **What happens:** You return a class instance, a function, or a circular reference -- SvelteKit cannot pass it to the page component
   - **Fix:** Return plain objects, arrays, strings, numbers, and booleans. No functions, no class instances
   - **Why:** Load function data may be serialized to JSON during SSR and sent to the client. Only JSON-compatible values survive serialization

## Break It to Learn It

### Exercise 1: Break the Error Guard
1. Open `src/routes/services/[id]/+page.ts`
2. Comment out the `if (!service || service.visible === false)` block (lines 16-18)
3. **Predict:** What happens when you visit `/services/nonexistent`?
4. **Verify:** Run `bun run dev`, navigate to `/services/nonexistent` -- the page will crash or show undefined values
5. **What you learned:** The error guard is essential for dynamic routes. Without it, invalid URLs pass `undefined` to the page component
6. **Undo your change**

### Exercise 2: Add a Field to the Return
1. Open `src/routes/blog/+page.ts`
2. Add `const pageTitle = 'Blog Posts';` before the return statement
3. Add `pageTitle` to the return object: `return { posts, tags, languages, svgContents, pageTitle }`
4. **Predict:** How would you access this in `src/routes/blog/+page.svelte`?
5. **Verify:** The answer is `data.pageTitle` -- every key in the return object becomes a property on `data`
6. **Undo your change**

### Exercise 3: Trace the Data Flow
1. Open `src/routes/blog/[slug]/+page.ts`
2. Read the load function and identify: what does it return?
3. Now open `src/routes/blog/[slug]/+page.svelte`
4. **Predict:** Where is `data.post` used? Where is `data.html` used? Where is `data.readingTime` used?
5. **Verify:** `data.post` goes to `BlogDetailHeader`, `data.html` goes to `TableOfContents` and `BlogContent`, `data.readingTime` goes to `BlogDetailHeader`
6. **What you learned:** The load function assembles all the data a page needs, and the page component distributes it to child components via props

## Connections

- **Depends on:** [[sveltekit-routing]] because load functions are paired with route files
- **Depends on:** [[typescript-interfaces]] because the data returned by load functions follows typed interfaces
- **Enables:** [[component-architecture]] because the data flow from load -> page -> child components is a core architectural pattern
- **Related:** [[props-and-events]] because load function return values become the `data` prop
- **Related:** [[sveltekit-layouts]] because layouts can also have load functions (`+layout.ts`)

## Knowledge Check

1. When does a load function execute relative to the page rendering? --> See [The Mental Model](#the-mental-model)
2. How do you trigger a 404 error from a load function? --> See [Worked Example](#worked-example)
3. What happens if you fetch data in `onMount()` instead of a load function? --> See [Common Mistakes](#common-mistakes)
4. How does the page component access data returned by the load function? --> See [What It Is](#what-it-is)
5. What is the difference between a listing page load and a detail page load? --> See [Worked Example](#worked-example)

## Go Deeper

- [SvelteKit docs -- Loading data](https://svelte.dev/docs/kit/load)
- [SvelteKit tutorial -- Page data](https://svelte.dev/tutorial/kit/page-data)
