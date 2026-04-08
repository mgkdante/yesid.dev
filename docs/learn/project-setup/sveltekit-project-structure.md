---
title: "SvelteKit Project Structure"
domain: project-setup
difficulty: 1
difficulty_label: beginner
reading_time: 15
tags:
  - learn
  - project-setup
  - beginner
date: 2026-04-08
---

# SvelteKit Project Structure


## The Analogy

Think of a SvelteKit project like a database server. The `src/routes/` directory is your schema -- each folder is a table, each file is a view that determines what users see when they query a URL. The `src/lib/` directory is your stored-procedures library -- reusable logic, components, and data that your views call into. And `static/` is like a flat-file dump: images, SVGs, and models served exactly as-is, no processing.

## What It Is

SvelteKit is a full-stack web framework. "Full-stack" means it handles both the server side (deciding what data to load, what HTTP status to return) and the client side (rendering the page in the browser, handling clicks and animations). A SvelteKit project has a specific directory layout that the framework relies on -- put a file in the wrong folder and the framework ignores it.

The core convention is **filesystem-based routing**. Instead of writing a configuration file that maps URLs to code (like defining routes in a router), you create folders and files inside `src/routes/`. The folder path becomes the URL path. A folder named `blog` becomes the `/blog` URL. A folder named `[slug]` (with square brackets) becomes a dynamic segment -- like a parameterized query where `slug` could be any value.

Every route can have up to two files that matter:
- **`+page.svelte`** -- the visual template (what the user sees). This is like the SELECT clause of a query.
- **`+page.ts`** -- the data loader (what data to fetch before rendering). This is like the FROM and WHERE clauses.

There is also a **layout** system. A `+layout.svelte` file wraps every page beneath it in the directory tree -- it provides shared structure like the navigation bar and footer, the same way a database view can layer on top of a base table.

## Why It Matters

Understanding project structure is the first question in any frontend interview: "Walk me through how a request becomes a page." If you can trace a URL through the filesystem to the data loader to the rendered component, you demonstrate that you understand how modern web apps work -- not just the syntax, but the architecture. For clients, this knowledge means you can onboard to any SvelteKit project quickly and know immediately where to find or add features.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | The `Nav` and `Footer` wrapping `{@render children()}` | Shows how every page in the site inherits shared chrome (navbar, footer) from one file |
| `src/routes/+page.svelte` | The home page with metro-journey sections | Demonstrates a complex page importing components from `$lib/components/` and data from `$lib/data` |
| `src/routes/blog/[slug]/+page.ts` | The `load()` function calling `getPostBySlug(params.slug)` | Shows how a dynamic URL parameter feeds into a data loader -- the framework equivalent of a parameterized query |
| `src/lib/data/index.ts` | Barrel exports for types, services, projects, blog | The single entry point for all data -- downstream code imports from `$lib/data` instead of individual files |
| `svelte.config.js` | The `extensions` and `adapter` settings | The project-level config that tells SvelteKit how to process files (markdown via mdsvex) and where to deploy (Vercel) |

## The Mental Model

```
src/
|
+-- app.html              <-- The HTML shell (like a database server's listener socket)
|                              Every page gets injected into this shell.
|
+-- app.css                <-- Global styles (Tailwind + theme tokens)
|
+-- routes/                <-- THE ROUTING TABLE (URL -> Page mapping)
|   |
|   +-- +layout.svelte     <-- Wraps ALL pages (Nav + Footer)
|   +-- +page.svelte       <-- / (home page)
|   +-- +page.ts            <-- Data loader for home (exports ssr = false)
|   |
|   +-- blog/
|   |   +-- +page.svelte   <-- /blog (listing page)
|   |   +-- +page.ts       <-- Loads posts, tags, languages
|   |   +-- [slug]/
|   |       +-- +page.svelte  <-- /blog/my-post (detail page)
|   |       +-- +page.ts      <-- Loads one post by slug
|   |
|   +-- services/
|   |   +-- +page.svelte   <-- /services (listing)
|   |   +-- [id]/
|   |       +-- +page.svelte  <-- /services/data-engineering (detail)
|   |
|   +-- work/
|       +-- +page.svelte   <-- /work (listing)
|       +-- [slug]/
|           +-- +page.svelte  <-- /work/my-project (detail)
|
+-- lib/                   <-- SHARED LIBRARY (importable via $lib/)
|   |
|   +-- components/        <-- UI building blocks (Nav, Footer, BlogCard, etc.)
|   +-- data/              <-- Types, data files, helper functions
|   |   +-- index.ts       <-- Barrel file: single import point
|   |   +-- types.ts       <-- TypeScript type definitions
|   |   +-- blog.ts        <-- Blog post data + helpers
|   |   +-- projects.ts    <-- Project data + helpers
|   |   +-- services.ts    <-- Service data + helpers
|   +-- motion/            <-- Animations (GSAP, Threlte, Lottie)
|   +-- styles/            <-- CSS tokens (theme variables)
|   +-- assets/            <-- SVGs, Lottie JSONs bundled by Vite
|
+-- content/               <-- RAW CONTENT (markdown blog posts)
    +-- blog/
        +-- professional/  <-- Professional category posts
        +-- personal/      <-- Personal category posts

static/                    <-- SERVED AS-IS (no processing by Vite)
|   +-- images/            <-- PNGs, JPGs, WebPs
|   +-- models/            <-- 3D models (.glb)
|   +-- svg/               <-- SVG illustrations
|   +-- lottie/            <-- Lottie animation JSONs
```

Key insight: `src/lib/` is imported into routes using the `$lib` alias. When you see `import Nav from '$lib/components/Nav.svelte'`, that resolves to `src/lib/components/Nav.svelte`. This alias is built into SvelteKit -- you never write relative paths like `../../lib/components/Nav.svelte`.

## Worked Example

**What happens when someone visits `/blog/building-a-transit-pipeline`:**

**Step 1 -- URL matching.** SvelteKit looks at the URL path `/blog/building-a-transit-pipeline` and walks the `src/routes/` directory tree. It finds `src/routes/blog/[slug]/`, where `[slug]` is a dynamic parameter. The framework sets `params.slug = 'building-a-transit-pipeline'`.

**Step 2 -- Layout loading.** Before rendering the page, SvelteKit loads the root layout at `src/routes/+layout.svelte`. This file imports the `Nav` and `Footer` components and wraps all child pages in a consistent shell.

**Step 3 -- Data loading.** SvelteKit runs the `load()` function from `src/routes/blog/[slug]/+page.ts`:

```typescript
// From: src/routes/blog/[slug]/+page.ts

import { error } from '@sveltejs/kit';
import { getPostBySlug, getPostHtml, getSvgContent } from '$lib/data';

export function load({ params }: { params: { slug: string } }) {
    // Step 3a: Look up the post by slug (like SELECT * FROM posts WHERE slug = ?)
    const post = getPostBySlug(params.slug);
    if (!post) error(404, 'Post not found');

    // Step 3b: Get the rendered HTML from the markdown file
    const rawHtml = getPostHtml(params.slug);
    const html = rawHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');

    // Step 3c: Load the decorative SVG icon for this post
    const svgContent = getSvgContent(post);

    // Step 3d: Calculate reading time (like a computed column)
    const plainText = html.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Step 3e: Return the data object -- SvelteKit passes this to the page component
    return { post, html, svgContent, readingTime };
}
```

The `load()` function is like a stored procedure that runs before the page renders. It receives the URL parameters, queries the data layer, and returns a result set. If the post doesn't exist, it throws a 404 error -- SvelteKit handles this automatically.

**Step 4 -- Rendering.** SvelteKit passes the returned data to `src/routes/blog/[slug]/+page.svelte` as `data`. The component destructures it and renders the blog detail layout:

```svelte
<!-- From: src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
    let { data } = $props();
    // data.post, data.html, data.svgContent, data.readingTime
    // are all available here -- populated by the load() function
</script>
```

**Step 5 -- Composition.** The page component is wrapped inside the layout's `{@render children()}` slot, so the final output is: Nav + page content + Footer, all in one HTML document.

The raw blog content itself lives in `src/content/blog/professional/building-a-transit-pipeline/index.md` -- a markdown file that `getPostHtml()` reads and converts to HTML at build time.

## Common Mistakes

1. **Putting components in `src/routes/` instead of `src/lib/components/`**
   - **What happens:** The file becomes a routable page instead of a reusable component. If you create `src/routes/BlogCard.svelte`, SvelteKit tries to serve it as a page at the URL `/BlogCard`, which is not what you want.
   - **Fix:** Reusable components always go in `src/lib/components/`. Only `+page.svelte`, `+layout.svelte`, and `+page.ts` files belong in `src/routes/`.
   - **Why:** SvelteKit treats `src/routes/` as the routing table. Every file there is public-facing. `src/lib/` is private -- only accessible via imports, never via URL.

2. **Forgetting the `+` prefix on route files**
   - **What happens:** A file named `page.svelte` (without the `+`) is completely ignored by SvelteKit. The route shows a blank page or 404. You stare at working code that just won't render.
   - **Fix:** Route files must be named `+page.svelte`, `+page.ts`, `+layout.svelte`, etc. The `+` prefix is how SvelteKit distinguishes route files from helper files you might co-locate in the same folder.
   - **Why:** The `+` convention lets you put test files, utilities, and other non-route files alongside your route files without SvelteKit treating them as pages.

3. **Using relative imports instead of `$lib`**
   - **What happens:** You write `import Nav from '../../../lib/components/Nav.svelte'` and it works -- until you move the file. Then every import breaks. It also makes the code harder to read because you're counting dots.
   - **Fix:** Always use `import Nav from '$lib/components/Nav.svelte'`. The `$lib` alias always resolves to `src/lib/`, regardless of where the importing file lives.
   - **Why:** SvelteKit configures this alias automatically. It keeps imports stable and readable, just like using schema-qualified names in SQL instead of relying on the search path.

## Break It to Learn It

### Exercise 1: Break the routing

1. Open `src/routes/blog/[slug]/+page.svelte`
2. Rename it to `src/routes/blog/[slug]/page.svelte` (remove the `+` prefix)
3. **Predict:** What will happen when you visit `http://localhost:5173/blog/building-a-transit-pipeline`?
4. **Verify:** Run `bun run dev`, navigate to that URL, observe the result (you should get a blank page or error)
5. **What you learned:** The `+` prefix is not decorative -- it is how SvelteKit identifies route files
6. **Undo your change** (rename back to `+page.svelte`)

### Exercise 2: Trace the data flow

1. Open `src/routes/blog/[slug]/+page.ts`
2. Add `console.log('Loading post:', params.slug);` as the first line inside the `load()` function
3. **Predict:** Where will this log appear -- in the browser console or the terminal running `bun run dev`?
4. **Verify:** Run `bun run dev`, visit a blog post, check both the browser console and the terminal
5. **What you learned:** `+page.ts` load functions can run on the server or client depending on the route configuration -- understanding where your code executes is fundamental to full-stack development
6. **Undo your change**

### Exercise 3: Follow the layout chain

1. Open `src/routes/+layout.svelte`
2. Comment out the `<Nav>` component (wrap the line in `<!-- -->`)
3. **Predict:** Which pages lose their navigation bar -- just the home page, or every page on the site?
4. **Verify:** Run `bun run dev`, check the home page, then navigate to `/blog` and `/work`
5. **What you learned:** A root layout wraps every page in the site -- it is the single source of shared structure, like a base view that all other views inherit from
6. **Undo your change**

## Connections

- **Enables:** [[svelte-components]] because understanding where components live (`src/lib/components/`) is required before you can build them
- **Enables:** [[data-layer]] because the `$lib/data/` barrel pattern only makes sense once you understand the `$lib` alias and directory conventions
- **Related:** [[css-architecture]] because the three CSS layers (tokens, app.css, scoped styles) map to specific files in this directory tree

## Knowledge Check

1. If you want to create a page at the URL `/contact`, what file do you create and where? --> See [The Mental Model](#the-mental-model)
2. What is the difference between `src/lib/` and `src/routes/`? --> See [What It Is](#what-it-is)
3. A file named `src/routes/work/[slug]/+page.ts` has a `load()` function. What does the `[slug]` part do? --> See [Worked Example](#worked-example)
4. You have a reusable button component. Should it go in `src/routes/` or `src/lib/components/`? Why? --> See [Common Mistakes](#common-mistakes)
5. What does the `$lib` import alias resolve to? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [SvelteKit Routing -- Official Docs](https://svelte.dev/docs/kit/routing)
- [SvelteKit Project Structure -- Official Docs](https://svelte.dev/docs/kit/project-structure)
- [SvelteKit Loading Data -- Official Docs](https://svelte.dev/docs/kit/load)
