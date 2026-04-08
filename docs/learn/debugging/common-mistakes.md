---
title: "Common Mistakes"
domain: debugging
difficulty: 1
difficulty_label: beginner
reading_time: 18
tags:
  - learn
  - debugging
  - beginner
date: 2026-04-08
---

# Common Mistakes


## The Analogy

Every SQL developer has a personal "wall of shame" -- queries that failed because of a missing JOIN condition, a typo in a column name, or forgetting to add `WHERE` to a DELETE statement. You hit each mistake exactly once, learn the hard way, and never do it again. This doc is the frontend equivalent: the top 10 mistakes specific to this project that every new contributor will hit. Each one is predictable, each one has a clear fix, and knowing them in advance saves hours of debugging.

## What It Is

This is a catalog of the most common mistakes made in this specific codebase. These are not theoretical -- every one has happened during development and caused real debugging sessions. They are ordered from most fundamental (wrong tools) to most subtle (browser rendering quirks). Each entry explains what you did wrong, what error or behavior you will see, and the correct approach.

## Why It Matters

In interviews, "tell me about a mistake you made and how you fixed it" is a standard question. These mistakes teach you not just the fix but the principle behind it -- why Bun exists, how SSR works, why immutability matters. Understanding these patterns shows architectural awareness, not just syntax knowledge. For day-to-day work, this list prevents the exact debugging sessions that waste the most time: the ones where the fix is trivial but finding the cause is not.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | The single-source GSAP import module | Mistake #2 (wrong import path) -- this file exists specifically to prevent it |
| `src/lib/motion/stores/reducedMotion.ts` | The `typeof window === 'undefined'` guard | Mistake #3 (SSR window access) -- this pattern protects against server-side crashes |
| `src/lib/data/types.ts` | The `LocalizedString` interface | Mistake #4 (hardcoded text) -- every user-facing string must use this type |
| `src/lib/motion/actions/reveal.ts` | The `isPrefersReducedMotion()` check at line 43 | Mistake #8 (missing reduced motion check) -- every animation action must have this guard |
| `src/lib/motion/svg/Train.svelte` | The `<defs>` block with gradient IDs | Mistake #7 (SVG paint server) -- these IDs break on SPA navigation |

## The Mental Model

```
THE 10 COMMON MISTAKES — QUICK REFERENCE
==========================================

  #  | Mistake                          | Error / Symptom
  ---|----------------------------------|----------------------------------------
  1  | Using npm instead of bun         | Wrong lockfile, slow installs
  2  | Importing gsap from 'gsap'       | Plugins not registered, silent failure
  3  | Accessing window at top level    | "window is not defined" on server
  4  | Hardcoding text strings          | TypeScript error, i18n breaks
  5  | Mutating $derived values         | Value reverts, reactivity breaks
  6  | Missing use:reveal               | Element stuck at opacity:0 forever
  7  | SVG paint server SPA navigation  | Gradients disappear on route change
  8  | Forgetting isPrefersReducedMotion | Accessibility violation, a11y audit fail
  9  | Not co-locating test files       | Test not found, wrong import paths
  10 | Editing bun.lockb manually       | Corrupted lockfile, install failures

SQL Equivalents:
  #1  = Using MySQL client to connect to PostgreSQL
  #2  = Forgetting to set the default schema (USE database)
  #3  = Running a query that references a temp table from a different session
  #4  = Hardcoding 'Active' instead of using an ENUM/lookup table
  #5  = Trying to UPDATE a computed column
  #6  = Forgetting a NOT NULL constraint (data exists but is invisible)
  #7  = A view that breaks when renamed because it uses hardcoded schema refs
  #8  = Not handling NULL values in a query
  #9  = Putting stored procedures in the wrong schema
  #10 = Editing a binary .bak file in a text editor
```

## Worked Example

Here is mistake #3 in action -- accessing `window` at the top level of a module, which crashes during SSR:

```typescript
// BROKEN CODE — hypothetical component script
// From: a new file that doesn't follow the project patterns

// This line runs IMMEDIATELY when the module is imported.
// During SSR (server-side rendering), there is no browser window.
const screenWidth = window.innerWidth;  // ReferenceError: window is not defined

export function getLayout() {
    return screenWidth > 768 ? 'desktop' : 'mobile';
}
```

**What happens:** SvelteKit pre-renders pages on the server during build. The server has no `window` object (it is a Node/Bun process, not a browser). This code crashes the build with `ReferenceError: window is not defined`.

**The fix -- guard with `typeof window`:**

```typescript
// CORRECT — how this project handles it
// From: src/lib/motion/stores/reducedMotion.ts (line 13)

function getInitialValue(): boolean {
    // window is not available during SSR — default to false (allow animation).
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
}
```

**The principle:** Any code that accesses browser-only APIs (`window`, `document`, `navigator`, `localStorage`) must either:
1. Guard with `typeof window === 'undefined'`
2. Run inside `onMount()` (which only runs in the browser)
3. Run inside a Svelte action (which only attaches in the browser)

This is like checking `IF @variable IS NOT NULL` before using it in a SQL query -- defensive programming against an environment where the value does not exist.

## Common Mistakes

### 1. Using npm instead of bun

- **What you did:** Ran `npm install` or `npx some-tool` out of habit.
- **What happens:** npm creates a `package-lock.json` alongside the project's `bun.lockb`. Now you have two lockfiles that disagree about dependency versions. Builds become unpredictable. CI uses `bun.lockb` but your local machine resolved different versions via npm.
- **Fix:** Always use `bun install`, `bun run dev`, `bun run test`, `bun run check`, and `bunx` for executing CLI tools. Delete any `package-lock.json` if it appears.
- **Why:** This project uses Bun as its runtime and package manager. Bun is faster and uses a binary lockfile (`bun.lockb`). Mixing package managers causes version conflicts -- like connecting to PostgreSQL with the MySQL client.
- **SQL analogy:** Using the wrong client tool for your database engine. The commands look similar but the behavior differs in subtle, breaking ways.

### 2. Importing from 'gsap' instead of '$lib/motion/utils/gsap'

- **What you did:** Wrote `import { gsap } from 'gsap'` in a component.
- **What happens:** Your code gets a fresh GSAP instance without ScrollTrigger, DrawSVGPlugin, MorphSVGPlugin, or any other plugin registered. Animations silently fail. No error message -- ScrollTrigger configs are just ignored.
- **Fix:** Always import from `$lib/motion/utils/gsap.js`:
  ```typescript
  import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
  ```
  This file (`src/lib/motion/utils/gsap.ts`) registers all plugins once and re-exports them.
- **Why:** GSAP plugins must be registered globally with `gsap.registerPlugin()`. The project centralizes this in one file so every consumer shares the same registered state. Importing from `'gsap'` directly bypasses this registration.
- **SQL analogy:** Like forgetting `USE database_name` before running queries. Your SQL is syntactically valid but runs against the wrong database -- no error, just wrong results.

### 3. Forgetting SSR: accessing window/document at top level

- **What you did:** Used `window.innerWidth`, `document.querySelector()`, or `localStorage.getItem()` at the top level of a `.ts` or `.svelte` file (outside `onMount`).
- **What happens:** `ReferenceError: window is not defined` during server-side rendering. The dev server crashes or the page fails to build.
- **Fix:** Guard with `typeof window === 'undefined'`, or move the code into `onMount()`:
  ```typescript
  import { onMount } from 'svelte';
  
  onMount(() => {
      // This only runs in the browser, never on the server
      const width = window.innerWidth;
  });
  ```
  See `src/lib/motion/stores/reducedMotion.ts` line 13 for the guard pattern used throughout this project.
- **Why:** SvelteKit renders pages on the server first (SSR), then hydrates them in the browser. Server-side code runs in Bun where browser APIs do not exist.
- **SQL analogy:** Like referencing a temporary table from session A inside session B. The temp table exists in one context but not the other.

### 4. Hardcoding text instead of using LocalizedString

- **What you did:** Wrote `title: 'My Service'` instead of `title: { en: 'My Service' }`.
- **What happens:** TypeScript error: `Type 'string' is not assignable to type 'LocalizedString'`. If you bypass TypeScript, the `resolveLocale()` function crashes at runtime because it expects an object with an `en` property.
- **Fix:** Every user-facing string uses the `LocalizedString` type from `src/lib/data/types.ts`:
  ```typescript
  title: { en: 'Data Engineering' }  // Correct: LocalizedString
  // NOT: title: 'Data Engineering'  // Wrong: plain string
  ```
- **Why:** The data layer is cloud-ready for i18n (internationalization). Even though only English is used today, the `LocalizedString` contract ensures every string can be translated later with zero component changes.
- **SQL analogy:** Like hardcoding `'Active'` across fifty queries instead of using an ENUM or lookup table. When you need to support Spanish (`'Activo'`), you have to find and update every instance.

### 5. Mutating $derived values

- **What you did:** Tried to assign a new value to a `$derived` variable:
  ```svelte
  let activeService = $derived($page.url.searchParams.get('service'));
  activeService = 'data-engineering'; // ERROR
  ```
- **What happens:** Svelte throws a runtime error or the value immediately reverts to the derived computation. The assignment has no lasting effect.
- **Fix:** `$derived` values are computed from their source. To change the result, change the source. In `WorkListingPage.svelte`, `activeService` is derived from URL params -- to change it, navigate to a new URL with `goto()`:
  ```typescript
  // From: src/lib/components/WorkListingPage.svelte
  // Don't: activeService = 'data-engineering'
  // Do: change the URL, which changes the derived value
  await goto('?service=data-engineering');
  ```
- **Why:** `$derived` is reactive and read-only, like a computed column (`quantity * price AS total`). You cannot UPDATE a computed column -- you update the underlying columns and the computed value recalculates.
- **SQL analogy:** `ALTER TABLE orders ADD total AS (quantity * price)` -- you cannot `UPDATE orders SET total = 500`. You update `quantity` or `price` and `total` recalculates.

### 6. Missing use:reveal on elements (they stay invisible)

- **What you did:** Created a new component or section but forgot to add `use:reveal` to the container element.
- **What happens:** The element renders at `opacity: 1` if you are lucky. But if another animation (GSAP or CSS) sets initial opacity to 0 expecting `use:reveal` to animate it in, the element stays invisible forever. No error, no console warning -- just a blank space.
- **Fix:** Add `use:reveal` to elements that should animate in on scroll:
  ```svelte
  <div use:reveal={{ direction: 'up', delay: 100 }}>
      Content that animates in on scroll
  </div>
  ```
  Check existing components like `src/lib/components/AboutIdentity.svelte` (line 24) for the pattern.
- **Why:** The reveal action uses GSAP's `gsap.from()` which sets the element to `opacity: 0` first, then animates to `opacity: 1` when the ScrollTrigger fires. Without `use:reveal`, the initial state is never set and the animation never plays.
- **SQL analogy:** Like creating a foreign key column but forgetting to add the constraint. The column exists but the relationship (reveal trigger) is missing.

### 7. SVG paint server breaks on SPA navigation

- **What you did:** Used SVG gradients with `url(#gradient-id)` in a component rendered on multiple pages.
- **What happens:** The gradient works on initial page load. When you navigate to another page via SvelteKit's client-side routing (clicking a link), the SVG gradient disappears -- elements go black or transparent. Refreshing the page fixes it.
- **What's happening internally:** SVG `url(#id)` references are resolved relative to the document's base URL. When SvelteKit navigates client-side, the URL changes but the SVG `<defs>` block might be removed from the DOM and the `url(#id)` reference becomes dangling.
- **Fix:** Use unique, stable IDs for SVG gradients and ensure the `<defs>` block is part of the same SVG element (not a shared external file). See `src/lib/motion/svg/Train.svelte` for the pattern -- all gradient IDs (`train-ng`, `train-wg`, `train-lg`) are defined inside the same SVG that uses them.
- **Why:** In a traditional multi-page site, each page load creates a fresh DOM. In a SPA (single-page application), navigation reuses the DOM. SVG paint servers (gradients, patterns, filters) referenced by ID can break when the DOM structure changes without a full reload.
- **SQL analogy:** Like a view that references `dbo.MyTable` by name. If you rename the table or move it to a different schema, the view breaks. The reference is fragile.

### 8. Forgetting to check isPrefersReducedMotion()

- **What you did:** Added a new animation (GSAP tween, CSS animation, or Svelte action) without checking `isPrefersReducedMotion()` first.
- **What happens:** Users who have enabled "Reduce motion" in their OS settings (Windows: Settings > Accessibility > Visual effects > Animation effects OFF) still see the animation. This is an accessibility violation.
- **Fix:** Every animation in this project checks reduced motion before running. Follow the pattern in `src/lib/motion/actions/reveal.ts` (line 43):
  ```typescript
  if (isPrefersReducedMotion()) {
      node.style.opacity = '1';
      node.style.transform = '';
      return { update() {}, destroy() {} };
  }
  ```
  For CSS animations, use the `@media (prefers-reduced-motion: reduce)` query, as in `src/lib/components/GradientSeparator.svelte` (line 51).
- **Why:** Motion sensitivity affects ~5% of users. Ignoring this preference causes vestibular discomfort (dizziness, nausea) for affected users and fails WCAG 2.1 accessibility guidelines.
- **SQL analogy:** Like not handling NULL values in a query. `WHERE age > 18` silently excludes NULL ages. `WHERE age > 18 OR age IS NULL` handles all cases. Reduced motion is the NULL case of animation.

### 9. Not co-locating test files

- **What you did:** Created a test file in a top-level `tests/` directory or in a different folder from the source file.
- **What happens:** The test runs, but imports use long relative paths (`../../../src/lib/components/Nav.svelte`). When you move the source file, the test import breaks. Other developers cannot find the test because it is not next to the code it tests.
- **Fix:** Place test files directly next to the source file they test:
  ```
  src/lib/components/
  ├── Nav.svelte          <-- source
  ├── Nav.test.ts         <-- test (same directory)
  ├── Footer.svelte
  └── Footer.test.ts
  ```
  Every test file in this project follows this pattern. Check `src/lib/motion/actions/reveal.test.ts` next to `reveal.ts`, or `src/lib/components/Nav.test.ts` next to `Nav.svelte`.
- **Why:** Co-location makes tests discoverable. When you open a component file, the test is right there. The `vitest.config.ts` pattern `src/**/*.{test,spec}.{js,ts}` picks up tests from anywhere inside `src/`, so co-location works automatically.
- **SQL analogy:** Like keeping stored procedures in the same schema as their tables. `dbo.Users` and `dbo.sp_GetUsers` are in the same namespace. Putting the procedure in a different schema adds indirection for no benefit.

### 10. Editing bun.lockb manually

- **What you did:** Opened `bun.lockb` in a text editor to resolve a merge conflict or "fix" a dependency.
- **What happens:** The file is a binary format. Editing it in a text editor corrupts it. The next `bun install` fails with cryptic errors or silently installs wrong versions.
- **Fix:** Never open `bun.lockb` in an editor. If you need to update dependencies:
  ```bash
  bun install           # Regenerates lockfile from package.json
  bun add gsap@latest   # Updates a specific package
  bun remove some-pkg   # Removes a package
  ```
  If the lockfile has a merge conflict, delete it and run `bun install` to regenerate it from `package.json`.
- **Why:** `bun.lockb` is a binary file (unlike npm's JSON `package-lock.json`). It is designed to be read by Bun, not by humans. The binary format is what makes `bun install` fast.
- **SQL analogy:** Like opening a `.mdf` database file in Notepad. The data is there, but the format is not human-readable, and editing it corrupts the file.

## Break It to Learn It

### Exercise 1: Trigger the SSR crash (Mistake #3)

1. Open `src/lib/motion/stores/reducedMotion.ts`
2. On line 13, remove the `if (typeof window === 'undefined') return false;` guard
3. **Predict:** Will the error appear in the browser or the terminal running `bun run dev`?
4. **Verify:** Stop and restart `bun run dev`. Check the terminal for `ReferenceError: window is not defined`.
5. **What you learned:** SSR runs your code in Bun (server), not in a browser. Browser APIs must be guarded. This is the most common crash in SvelteKit projects.
6. **Undo your change** (restore the guard line)

### Exercise 2: See the $derived read-only behavior (Mistake #5)

1. Open `src/lib/components/WorkListingPage.svelte`
2. Find line 48: `let activeService = $derived($page.url.searchParams.get('service'));`
3. Add the following line directly below it: `activeService = 'test';`
4. **Predict:** Will this cause a TypeScript error, a runtime error, or silently do nothing?
5. **Verify:** Run `bun run check` to see the TypeScript error. Then remove the line and check the runtime behavior.
6. **What you learned:** `$derived` values are read-only computed properties -- assigning to them is like trying to UPDATE a computed column in SQL
7. **Undo your change**

### Exercise 3: Test with the wrong package manager (Mistake #1)

1. Run `npm --version` to confirm npm is available on your system
2. **Do NOT run `npm install`** -- just check: does a `package-lock.json` file exist in the project root?
3. **Predict:** If you ran `npm install`, what new file would appear? Would `bun.lockb` be affected?
4. **Verify:** Check that only `bun.lockb` exists (no `package-lock.json`). This is correct. The project only uses Bun.
5. **What you learned:** Package manager lockfiles are not interchangeable. This project uses `bun.lockb` exclusively. Having two lockfiles causes dependency version conflicts.
6. **No undo needed** -- you did not change anything

## Connections

- **Depends on:** [[reading-error-messages]] because each mistake produces a specific error type you need to recognize
- **Related:** [[browser-devtools]] because many of these mistakes are diagnosed in the Console or Elements panel
- **Related:** [[gsap-debugging]] because mistakes #2, #6, and #8 are animation-specific

## Knowledge Check

1. You ran `npm install` by accident. What file did it create, and what should you do about it? --> See [Mistake #1](#1-using-npm-instead-of-bun)
2. Your GSAP animation silently does nothing -- no errors, no animation. What are the two most likely causes? --> See [Mistake #2](#2-importing-from-gsap-instead-of-libmotionutilsgsap) and [Mistake #8](#8-forgetting-to-check-isprefersreducedmotion)
3. You get `ReferenceError: window is not defined`. Is this a browser error or a server error? --> See [Mistake #3](#3-forgetting-ssr-accessing-windowdocument-at-top-level)
4. You try to assign a value to a `$derived` variable. What happens? --> See [Mistake #5](#5-mutating-derived-values)
5. An element is invisible but has no error in the Console. What should you check? --> See [Mistake #6](#6-missing-usereveal-on-elements-they-stay-invisible)

## Go Deeper

- [SvelteKit FAQ: Server-Side Rendering](https://svelte.dev/docs/kit/faq#how-do-i-use-x-with-sveltekit)
- [GSAP Installation Guide](https://gsap.com/docs/v3/Installation/)
- [Bun Package Manager](https://bun.sh/docs/cli/install)
