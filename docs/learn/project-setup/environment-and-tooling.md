---
title: "Environment and Tooling"
domain: project-setup
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - project-setup
  - beginner
prerequisites:
  - "[[bun-runtime]]"
date: 2026-04-08
---

# Environment and Tooling


## The Analogy

Your dev environment is like your DBA workstation -- the IDE is SSMS (SQL Server Management Studio), the dev server is your local SQL Server instance, and the plugins are like SSMS extensions that add IntelliSense, syntax highlighting, and schema validation. Just as you wouldn't write stored procedures in Notepad, you wouldn't build this project without the right editor configuration and dev server running.

## What It Is

A **development environment** is the collection of tools that let you write, preview, and verify code on your machine before it goes to production. In this project, three layers work together:

1. **Vite** -- the development server and build tool. Vite (French for "fast") serves your project locally, watches for file changes, and instantly updates the browser without a full page reload. This instant feedback loop is called **Hot Module Replacement (HMR)**. Think of it as a live query window: you edit the stored procedure, and the results refresh immediately without re-executing the entire batch.

2. **VS Code extensions** -- editor plugins that add language-aware features. The project recommends two extensions (defined in `.vscode/extensions.json`) that give you autocomplete, error highlighting, and documentation tooltips as you type -- like IntelliSense in SSMS, but for Svelte components and Tailwind CSS classes.

3. **Vite plugins** -- processing steps that run inside the dev server. The project's `vite.config.ts` chains three plugins together, each transforming your source code in sequence: Tailwind CSS processing, SvelteKit compilation, and Svelte testing support. This plugin chain is like a SQL Server data flow pipeline -- data (your source files) enters one end and comes out transformed at the other.

## Why It Matters

A misconfigured environment wastes hours. If you don't have the Svelte extension, your editor shows false errors on every `.svelte` file. If you don't have the Tailwind extension, you lose autocomplete for 500+ utility classes and have to look them up manually. If the Vite plugin order is wrong, your styles don't process or your tests can't find components. Understanding your toolchain is the difference between productive development and fighting your tools.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `vite.config.ts` | The `plugins` array: `[tailwindcss(), sveltekit(), svelteTesting()]` | Defines the three-stage processing pipeline that transforms source files into a running app |
| `vite.config.ts` | The `test` block: `environment: 'jsdom'`, `setupFiles`, `globals` | Configures Vitest to simulate a browser environment so component tests work without a real browser |
| `.vscode/extensions.json` | The `recommendations` array | Lists the two VS Code extensions the project depends on for editor intelligence |
| `.vscode/settings.json` | The `files.associations` setting | Tells VS Code to treat `.css` files as Tailwind CSS for proper syntax highlighting and autocomplete |
| `src/tests/setup.ts` | The mock stubs for GSAP, Threlte, lottie-web, canvas, matchMedia | Shows how the test environment bridges the gap between jsdom (a simulated browser) and real browser APIs |
| `svelte.config.js` | The `preprocess` array and `compilerOptions` | SvelteKit's own config: enables markdown processing (mdsvex) and Svelte 5 runes mode |

## The Mental Model

```
SOURCE FILES                     VITE PLUGIN CHAIN                    BROWSER
=============                    =================                    =======

  app.css          -->  [1] tailwindcss()     -->  Processes @tailwind
  tokens.css                                        directives, scans HTML
  *.svelte                                          for class names, outputs
                                                    compiled CSS

  +page.svelte     -->  [2] sveltekit()       -->  Compiles .svelte files
  +layout.svelte                                    into JavaScript, sets up
  +page.ts                                          filesystem routing, handles
                                                    SSR/client hydration

  *.test.ts        -->  [3] svelteTesting()   -->  Adds 'browser' resolve
                                                    condition so Svelte uses
                                                    client-side code in tests.
                                                    Only activates when
                                                    VITEST=true (test mode)

                              |
                              v
                         localhost:5173       -->  Your browser shows the
                                                   rendered page. Edit a file,
                                                   save it, and HMR updates
                                                   the browser in <100ms.


VS CODE (your editor)
======================
  [svelte.svelte-vscode]       -->  Syntax highlighting for .svelte files
                                     Autocomplete for Svelte 5 runes ($state, $derived, $props)
                                     Inline type errors and hover documentation
                                     Go-to-definition across .svelte and .ts files

  [bradlc.vscode-tailwindcss]  -->  Autocomplete for Tailwind utility classes
                                     Color swatches next to color classes
                                     Hover preview showing generated CSS
                                     Lint warnings for invalid or conflicting classes
```

Plugin order matters. Tailwind must run first because it generates the CSS that SvelteKit components reference. SvelteKit runs second because it compiles `.svelte` files into JavaScript. `svelteTesting` runs last because it only modifies behavior during test runs (when `process.env.VITEST` is set). Changing this order breaks the pipeline, the same way reordering data flow transformations in SSIS would produce wrong output.

## Worked Example

**Reading `vite.config.ts` line by line:**

```typescript
// From: vite.config.ts

// Step 1: Import the config helper from Vitest (extends Vite's config with test options)
import { defineConfig } from 'vitest/config';

// Step 2: Import the three plugins
import tailwindcss from '@tailwindcss/vite';       // CSS processing
import { sveltekit } from '@sveltejs/kit/vite';     // Svelte + SvelteKit compilation
import { svelteTesting } from '@testing-library/svelte/vite'; // Test environment setup
```

The imports load three Vite plugins. Each plugin is a function that, when called, returns an object Vite knows how to use. Think of each as a middleware step in a data pipeline.

```typescript
// Step 3: Define the configuration
export default defineConfig({
  // The plugin chain -- ORDER MATTERS
  plugins: [tailwindcss(), sveltekit(), svelteTesting()],
```

The `plugins` array sets the processing order. Every file that Vite handles passes through these plugins in sequence. `tailwindcss()` processes CSS, `sveltekit()` compiles Svelte components, and `svelteTesting()` configures the testing environment (but only when tests are running -- it checks for `process.env.VITEST`).

```typescript
  // Step 4: Test configuration (only applies during `bun run test`)
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],  // Which files are tests
    environment: 'jsdom',                        // Simulate a browser with jsdom
    globals: true,                               // Make describe/it/expect global
    setupFiles: ['./src/tests/setup.ts']         // Run this file before all tests
  }
});
```

The `test` block configures Vitest (the test runner). `include` tells Vitest where to find test files -- any file matching `*.test.ts` or `*.spec.ts` inside `src/`. `environment: 'jsdom'` creates a simulated browser so tests can query the DOM (document) without opening a real Chrome window. `setupFiles` points to `src/tests/setup.ts`, which mocks browser APIs that jsdom doesn't implement (canvas, matchMedia, IntersectionObserver) and stubs libraries that need WebGL (GSAP, Three.js, lottie-web).

This is like setting up a test database with fixtures -- before any test runs, the setup file creates the environment they expect.

## Common Mistakes

1. **Not installing the recommended VS Code extensions:**
   - **What happens:** VS Code treats `.svelte` files as plain HTML -- no Svelte-specific syntax highlighting, no autocomplete for `$state()` or `$derived()`, no inline type errors. Every `.svelte` file looks broken with red squiggles on valid Svelte syntax.
   - **Fix:** Open the command palette (Ctrl+Shift+P), type "Extensions: Show Recommended Extensions", and install both `svelte.svelte-vscode` and `bradlc.vscode-tailwindcss`.
   - **Why:** VS Code does not understand `.svelte` files natively. The Svelte extension teaches it the language. Without it, you lose the same level of assistance as writing SQL without IntelliSense.

2. **Reordering plugins in `vite.config.ts`:**
   - **What happens:** If `sveltekit()` runs before `tailwindcss()`, Tailwind classes in your Svelte components may not compile correctly. If `svelteTesting()` runs before `sveltekit()`, the test resolver configuration may not apply properly.
   - **Fix:** Keep the order as `[tailwindcss(), sveltekit(), svelteTesting()]`. This is the order the project was designed for.
   - **Why:** Each plugin transforms files for the next one. Tailwind produces CSS that SvelteKit bundles. SvelteKit produces JavaScript that the testing plugin adjusts. Reversing the order means a plugin receives input it was not designed for.

3. **Ignoring the test setup file:**
   - **What happens:** You create a new test file and it crashes with errors like "matchMedia is not a function" or "Cannot read properties of null (getContext)". You think the test is broken, but the real issue is that the mock from `src/tests/setup.ts` is not running.
   - **Fix:** Ensure your test file is inside `src/` and matches the pattern `*.test.ts` or `*.spec.ts`. The `setupFiles` config in `vite.config.ts` automatically runs `src/tests/setup.ts` before every test file that matches.
   - **Why:** jsdom simulates a browser but does not implement every API. The setup file fills in the gaps (canvas, matchMedia, IntersectionObserver, GSAP, Three.js). If a test runs without these mocks, it hits real browser API calls that jsdom cannot handle.

4. **Running `vite dev` directly instead of `bun run dev`:**
   - **What happens:** If `vite` is not in your system PATH, the command fails with "command not found". Even if it works, you bypass any environment setup that `bun run` provides (like resolving `node_modules/.bin/` executables).
   - **Fix:** Always use `bun run dev`. Bun automatically finds the `vite` executable in `node_modules/.bin/`.
   - **Why:** `bun run` sets up the correct PATH and environment before executing the script. Running tools directly skips this setup.

## Break It to Learn It

### Exercise 1: See HMR in action

1. Run `bun run dev` to start the dev server
2. Open `http://localhost:5173` in your browser
3. Open `src/routes/+page.svelte` in VS Code
4. Find a visible text string (a heading or label) and change it to something different
5. **Predict:** Will you need to refresh the browser to see the change?
6. **Verify:** Look at the browser -- the change appears instantly without a page reload. Check the terminal: Vite logs `[vite] hot updated: /src/routes/+page.svelte`
7. **What you learned:** HMR means the dev server pushes changes to the browser in real time -- you never need to manually refresh during development
8. **Undo your change**

### Exercise 2: Break the plugin chain

1. Open `vite.config.ts`
2. Remove `tailwindcss()` from the plugins array, making it: `plugins: [sveltekit(), svelteTesting()]`
3. **Predict:** What will happen to the styling on `localhost:5173`?
4. **Verify:** Run `bun run dev` and open the browser -- Tailwind utility classes like `flex`, `text-lg`, `bg-brand-primary` will have no effect. The page renders as unstyled HTML.
5. **What you learned:** Each plugin in the chain is essential. Removing the Tailwind plugin removes all utility-class-based styling from the entire project.
6. **Undo your change** (restore `tailwindcss()` to the plugins array)

### Exercise 3: Explore extension features

1. Ensure both recommended extensions are installed
2. Open any `.svelte` file (e.g., `src/lib/components/Nav.svelte`)
3. In the `<style>` block or a class attribute, start typing `bg-` and pause
4. **Predict:** Will you get autocomplete suggestions for Tailwind classes?
5. **Verify:** The Tailwind extension shows a dropdown with classes like `bg-red-500`, `bg-brand-primary`, etc., with color swatches
6. **What you learned:** The Tailwind extension reads the project's CSS configuration and provides context-aware autocomplete -- it knows which custom classes (like `bg-brand-primary`) exist in this specific project

## Connections

- **Depends on:** [[bun-runtime]] because `bun run dev` is how you start the Vite dev server
- **Depends on:** [[package-json-scripts]] because the `dev`, `test`, and `check` scripts invoke the tools configured here
- **Related:** [[sveltekit-project-structure]] because the `sveltekit()` plugin processes the filesystem routing defined in `src/routes/`
- **Related:** [[tailwind-configuration]] because the `tailwindcss()` plugin processes the CSS layer configured in `app.css` and `tokens.css`
- **Related:** [[typescript-strict-mode]] because `svelte-check` (run via `bun run check`) enforces the strict TypeScript settings from `tsconfig.json`

## Knowledge Check

1. What are the three Vite plugins in this project, and why does their order matter? --> See [The Mental Model](#the-mental-model)
2. What does `environment: 'jsdom'` do in the test configuration? --> See [Worked Example](#worked-example)
3. Which two VS Code extensions does this project recommend, and what does each one provide? --> See [The Mental Model](#the-mental-model)
4. What is HMR, and why does it matter during development? --> See [What It Is](#what-it-is)
5. Why does the test setup file (`src/tests/setup.ts`) mock GSAP and Three.js? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Vite Official Documentation](https://vite.dev/guide/)
- [Vite Plugin API](https://vite.dev/guide/api-plugin.html)
- [Vitest Configuration](https://vitest.dev/config/)
- [Svelte for VS Code Extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Tailwind CSS IntelliSense Extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
