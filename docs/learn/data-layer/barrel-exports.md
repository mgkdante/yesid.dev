---
title: "Barrel Exports"
domain: data-layer
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - data-layer
  - beginner
prerequisites:
  - "[[typescript-interfaces]]"
date: 2026-04-08
---

# Barrel Exports


## The Analogy

A barrel file is like a SQL view that combines multiple tables. Instead of writing `SELECT * FROM services`, `SELECT * FROM projects`, `SELECT * FROM blog_posts` in three separate queries, you create a view: `CREATE VIEW all_data AS SELECT ... FROM services JOIN projects JOIN blog_posts`. Now consumers query one view instead of knowing about three tables. A barrel file does the same thing: instead of importing from `$lib/data/services.ts`, `$lib/data/projects.ts`, and `$lib/data/blog.ts` separately, you import everything from `$lib/data` -- one path, one import statement.

## What It Is

A **barrel file** is a TypeScript file (usually named `index.ts`) that re-exports items from other files in the same directory. It does not contain logic or data itself -- it is purely a routing layer that gathers exports from multiple internal files and presents them through a single entry point.

When a directory has an `index.ts` file, TypeScript and Vite allow you to import from the directory path directly. Instead of:

```typescript
import { services } from '$lib/data/services.js';
import { projects } from '$lib/data/projects.js';
import type { Service } from '$lib/data/types.js';
```

You write:

```typescript
import { services, projects, type Service } from '$lib/data';
```

The three-letter savings per import is not the point. The point is **encapsulation**: the barrel file hides internal file structure. If you later rename `services.ts` to `offerings.ts`, you update one line in `index.ts` and every downstream import continues working unchanged. Without a barrel, you would update every file that imports from the renamed file.

## Why It Matters

**Interview value:** "How do you organize exports in a TypeScript project?" is an architecture question that tests whether you understand module boundaries. Barrel files show that you think about public APIs vs. internal implementation -- the same mindset as designing database views over raw tables.

**Refactoring safety:** When internal files are imported directly, renaming or splitting a file breaks every importer. With a barrel, the barrel is the contract -- internals can change freely as long as the barrel re-exports the same names.

**Clean imports:** Components have one import line for data instead of five. Code reviews focus on what is imported, not on remembering which file contains which export.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/index.ts` | Every `export` and `export type` line | The single entry point for all data-layer exports |
| `src/lib/data/index.ts` | Line 6: type re-exports from `types.js` | Shows how interfaces are re-exported so components never import from `types.ts` directly |
| `src/lib/data/index.ts` | Lines 12-13: project data + helpers | Re-exports both the data array and helper functions from `projects.ts` |
| `src/lib/data/index.ts` | Lines 21-22: blog data + helpers | Re-exports the blog API -- `getLatestPosts`, `getPostBySlug`, etc. |
| `src/lib/data/index.ts` | Lines 24-25: metro line + type | Re-exports both the data and the MetroStop type from `metro.ts` |

## The Mental Model

```
Without barrel (direct imports):

  Component A ──────► services.ts
  Component B ──────► services.ts
  Component C ──────► projects.ts
  Component D ──────► types.ts
  Component E ──────► blog.ts
  Component F ──────► metro.ts

  Problem: Rename services.ts → offerings.ts
  Fix: Update components A, B, and every other importer. 💥


With barrel (index.ts):

  Component A ──┐
  Component B ──┤
  Component C ──┼──► index.ts ──┬──► services.ts
  Component D ──┤              ├──► projects.ts
  Component E ──┤              ├──► types.ts
  Component F ──┘              ├──► blog.ts
                               └──► metro.ts

  Problem: Rename services.ts → offerings.ts
  Fix: Update ONE line in index.ts. Components unchanged. ✓


SQL equivalent:

  -- Without view: every report queries raw tables
  SELECT * FROM services;   -- Report A
  SELECT * FROM services;   -- Report B
  SELECT * FROM projects;   -- Report C

  -- With view: one abstraction layer
  CREATE VIEW data_api AS
    SELECT 'service' AS type, id, title FROM services
    UNION ALL
    SELECT 'project', slug, title FROM projects;

  -- Rename the table? Update the view. Reports unchanged.
```

## Worked Example

Let's walk through `src/lib/data/index.ts` section by section:

```typescript
// From: src/lib/data/index.ts

// --- Section 1: Type re-exports ---
// "export type" re-exports interfaces and type aliases.
// The "type" keyword tells the bundler these are types only --
// they produce no runtime code and get stripped during compilation.
// This is like a view that exposes column definitions without data.
export type {
  Locale, LocalizedString, ServiceSection, ProjectSection,
  ProjectStatus, Project, Service, SiteLinks, SiteMeta,
  BlogPost, BlogCategory, BlogAnimation,
  // ... many more types
} from './types.js';

// --- Section 2: Locale utilities ---
// Re-exports the COALESCE function and locale constants.
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from './locale.js';

// --- Section 3: Data + helpers ---
// Re-exports both the data arrays AND the helper functions.
// Components get everything from one import:
//   import { services, getServiceById, type Service } from '$lib/data';
export {
  projects, getProjectBySlug, getFeaturedProjects, getPublicProjects,
  getAllTags, getAllStackItems, getProjectsByService, getServiceIdsForProjects
} from './projects.js';

export {
  services, getServiceById, getVisibleServices, getAdjacentServices
} from './services.js';

// --- Section 4: Site metadata ---
export { siteMeta } from './meta.js';

// --- Section 5: Blog data ---
export {
  blogPosts, getLatestPosts, getPostBySlug, getPostHtml,
  getPostsByCategory, getTagsForCategory, getPostsByTag,
  getLanguagesForCategory, getSvgContent, getSvgContentsForPosts,
  resolveAnimation, resolveSvgFallbackName
} from './blog.js';

// --- Section 6: Metro line ---
export {
  metroStops, TOTAL_STOPS, formatStopLabel, formatServicesLabel, getStopByType
} from './metro.js';
export type { MetroStop } from './metro.js';

// --- Section 7: UI content ---
export {
  heroAnimContent, heroContent, aboutContent, ctaContent,
  skillsJourneyPanels, skillsJourneyCta
} from './content.js';

// --- Section 8: Page-specific content ---
export { aboutPageContent } from './about-page.js';
export { contactContent } from './contact-page.js';
```

**Notice three patterns:**

1. **`export type` vs. `export`:** Types are re-exported with the `type` keyword. Data and functions use plain `export`. The distinction matters for bundlers -- types are stripped out of the final JavaScript, reducing bundle size.

2. **Every export is named, never default.** Named exports (`export { services }`) are grep-friendly -- you can search the codebase for `services` and find every usage. Default exports (`export default services`) are renamed at the import site, making them harder to trace.

3. **The file imports nothing.** A barrel file only re-exports. It contains no logic, no data, no side effects. It is purely a routing layer, like a view definition.

## Common Mistakes

1. **Importing from internal files instead of the barrel:**
   - **What happens:** A component does `import { services } from '$lib/data/services.js'` instead of `from '$lib/data'`. It works, but it bypasses the barrel. If `services.ts` is renamed, this import breaks while barrel-based imports survive.
   - **Fix:** Always import from the directory: `import { services } from '$lib/data'`. Let the barrel route to the right file.
   - **Why:** The barrel is the public API. Internal file paths are implementation details. This is the same principle as querying a view instead of a raw table -- the view shields you from schema changes.

2. **Putting logic in the barrel file:**
   - **What happens:** You add a helper function directly in `index.ts`. Now the barrel is no longer a pure routing layer -- it has behavior, and it is harder to reason about what comes from where.
   - **Fix:** Keep the barrel file as re-exports only. Put logic in the appropriate source file (`services.ts`, `blog.ts`, etc.) and re-export from the barrel.
   - **Why:** A view that also contains stored procedure logic is confusing. Keep routing and logic separate.

3. **Forgetting to add new exports to the barrel:**
   - **What happens:** You create a new data file (`tech-stack.ts`) with `export const techStack = [...]`. Components try `import { techStack } from '$lib/data'` and get an error: `techStack is not exported from '$lib/data'`.
   - **Fix:** Add `export { techStack } from './tech-stack.js'` to `index.ts`. The barrel must explicitly list every public export.
   - **Why:** Unlike `SELECT *` in SQL, barrel files do not auto-discover exports. Each export is an explicit declaration -- this is intentional, as it forces you to think about your public API.

## Break It to Learn It

### Exercise 1: Import from the barrel vs. direct file

1. Open any component that imports from `$lib/data` (e.g., a route file in `src/routes/`)
2. Find an import like `import { services } from '$lib/data'`
3. Change it to `import { services } from '$lib/data/services.js'`
4. **Predict:** Will the import still work?
5. **Verify:** Run `bun run check`. It should still compile -- both paths resolve to the same `services` array. But you have now coupled the component to the internal file name.
6. **What you learned:** The barrel provides indirection. Both paths work today, but only the barrel path survives a file rename.
7. **Undo your change** -- restore the barrel import.

### Exercise 2: Remove an export from the barrel

1. Open `src/lib/data/index.ts`
2. Find the line that exports `getServiceById` from `services.js`. Delete `getServiceById` from the export list.
3. **Predict:** Will any component that uses `getServiceById` break?
4. **Verify:** Run `bun run check`. Any file that imports `getServiceById` from `$lib/data` will show an error: `'getServiceById' is not exported from '$lib/data'`.
5. **What you learned:** The barrel controls the public API. Removing an export from the barrel is like revoking `SELECT` permission on a view column -- consumers can no longer access it.
6. **Undo your change** -- restore `getServiceById` to the export list.

### Exercise 3: Trace where an export originates

1. Open `src/lib/data/index.ts`
2. Find `formatStopLabel` in the exports. Note that it comes from `./metro.js`.
3. Open `src/lib/data/metro.ts` and find the `formatStopLabel` function definition.
4. **Predict:** If you renamed `formatStopLabel` to `formatMetroLabel` in `metro.ts`, what else would you need to update?
5. **Verify:** You would need to update the barrel (`index.ts`) re-export and every component that imports `formatStopLabel` from `$lib/data`. With the barrel, that is two places: the barrel and the component. Without the barrel, it would be one per component.
6. **What you learned:** The barrel reduces the blast radius of renames but does not eliminate it -- the barrel itself must be updated. The real savings is that internal file names can change without affecting consumers.
7. **No changes needed** -- this was a thought exercise.

## Connections

- **Depends on:** [[typescript-interfaces]] because the barrel re-exports interfaces defined in `types.ts`
- **Related:** [[typed-data-files]] because every typed data file's exports flow through the barrel
- **Related:** [[data-driven-architecture]] because data-driven components import through the barrel to access data and helpers
- **Related:** [[import-meta-glob]] because blog data loaded via `import.meta.glob` is also re-exported through the barrel

## Knowledge Check

1. What is the SQL equivalent of a barrel file? --> See [The Analogy](#the-analogy)
2. Why import from `$lib/data` instead of `$lib/data/services.js`? --> See [Common Mistakes](#common-mistakes)
3. What is the difference between `export type` and `export` in the barrel? --> See [Worked Example](#worked-example)
4. What happens if you add a new data file but forget to add it to the barrel? --> See [Common Mistakes](#common-mistakes)
5. Should barrel files contain logic or only re-exports? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [TypeScript Handbook: Modules (re-exports)](https://www.typescriptlang.org/docs/handbook/2/modules.html#re-exports)
- [SvelteKit: $lib alias (official docs)](https://svelte.dev/docs/kit/$lib)
