---
title: "Bun Runtime"
domain: project-setup
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - project-setup
  - beginner
date: 2026-04-08
---

# Bun Runtime


## The Analogy

Bun is like switching from MySQL Workbench to DataGrip -- same SQL, faster tool. You still write the same queries (JavaScript/TypeScript), but the program that executes them starts up faster, installs packages faster, and runs your test suite faster. The language didn't change. The runtime did.

## What It Is

A **runtime** is the program that reads and executes your code. In web development, the original runtime is **Node.js** -- it has been the standard since 2009. Bun is a newer runtime (released 2022) that runs the same JavaScript and TypeScript code, but is built from scratch in a lower-level language (Zig) for speed.

Bun is also a **package manager** (like `npm` or `yarn`) and a **test runner** -- it bundles tools that Node.js requires separate installs for. When you type `bun install`, Bun reads `package.json` (the same file npm uses), downloads the same packages from the same registry, but does it significantly faster because of its native architecture.

In this project, Bun replaces Node.js for **all local development**: installing packages, running the dev server, running tests, running type checks. However, when the site deploys to Vercel (the hosting platform), the production server runs on **Node.js 22** -- Bun is a development-only tool here. This is configured explicitly in `svelte.config.js` with the line `adapter: adapter({ runtime: 'nodejs22.x' })`.

## Why It Matters

Understanding your runtime answers the interview question: "What tools does your team use and why?" More practically, if you use the wrong command (`npm install` instead of `bun install`), you create a second lockfile (`package-lock.json`) alongside the Bun lockfile (`bun.lockb`), and suddenly your teammates get different dependency versions. In a team setting, everyone must use the same package manager -- mixing them is like having two DBAs running different SQL Server versions against the same database.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `package.json` | The `"scripts"` block listing `dev`, `build`, `test`, etc. | Defines every command available via `bun run <name>` -- this is the project's command reference |
| `bun.lockb` | The binary lockfile (do not open -- it is not human-readable) | Pins exact dependency versions so every developer gets identical packages; Bun generates this, npm cannot read it |
| `svelte.config.js` | The `adapter({ runtime: 'nodejs22.x' })` line | Proves Bun is dev-only; production runs Node.js 22 on Vercel |
| `.npmrc` | The `engine-strict=true` setting | Prevents accidental use of incompatible Node.js versions when tools fall back to npm behavior |

## The Mental Model

```
YOUR MACHINE (development)              VERCEL (production)
+----------------------------------+    +-------------------------+
|                                  |    |                         |
|  bun install                     |    |  npm install            |
|    reads: package.json           |    |    reads: package.json  |
|    writes: bun.lockb             |    |    (Bun lockfile not    |
|    downloads: node_modules/      |    |     used in prod)       |
|                                  |    |                         |
|  bun run dev                     |    |  Node.js 22.x           |
|    starts: Vite dev server       |    |    runs: built app      |
|    watches: file changes         |    |    serves: HTTP          |
|    URL: localhost:5173           |    |    URL: yesid.dev       |
|                                  |    |                         |
|  bun run test                    |    |  (no tests in prod)     |
|    runs: Vitest test suite       |    |                         |
|                                  |    |                         |
|  bun run check                   |    |  (no type checks        |
|    runs: svelte-check + tsc      |    |   in prod)              |
+----------------------------------+    +-------------------------+

Key: Bun = your dev-time engine. Node.js = the production engine.
     Same JavaScript. Different executor.
```

The four commands you will use daily:

1. `bun install` -- download all dependencies listed in `package.json` into `node_modules/`
2. `bun run dev` -- start the local development server at `http://localhost:5173`
3. `bun run test` -- execute all unit tests once and report pass/fail
4. `bun run check` -- run the TypeScript compiler to catch type errors

## Worked Example

**What happens when you clone this project and set it up for the first time:**

```bash
# Step 1: Install dependencies
bun install
```

Bun reads `package.json`, sees the `dependencies` and `devDependencies` blocks (about 20 packages like `svelte`, `tailwindcss`, `gsap`, `three`, `vitest`), downloads them all, and writes the `bun.lockb` lockfile. The packages land in a `node_modules/` folder. This is equivalent to restoring a database backup -- you are getting the exact environment the project was built with.

```bash
# Step 2: Start the dev server
bun run dev
```

Bun reads the `"dev"` script from `package.json`:

```json
// From: package.json
{
  "scripts": {
    "dev": "vite dev"
  }
}
```

Bun executes `vite dev`, which starts the Vite development server. Vite compiles your Svelte components, processes your CSS through Tailwind, and serves the result at `http://localhost:5173`. When you edit a file and save, Vite detects the change and updates the browser instantly (this is called Hot Module Replacement, or HMR).

```bash
# Step 3: Verify everything works
bun run test
bun run check
```

`bun run test` executes `vitest run` (the test runner), which finds every `*.test.ts` file in `src/` and runs it. `bun run check` runs `svelte-check`, which validates that all TypeScript types are correct across the entire codebase -- like running a schema validation against every stored procedure.

## Common Mistakes

1. **Using `npm install` instead of `bun install`:**
   - **What happens:** npm creates its own lockfile (`package-lock.json`) alongside the existing `bun.lockb`. Now you have two competing lockfiles. The next developer who runs `bun install` gets one set of versions; someone running `npm install` gets a different set. Dependencies drift apart.
   - **Fix:** Always use `bun install`. If you see a `package-lock.json` appear, delete it -- it should not exist in this project.
   - **Why:** A project must have exactly one lockfile from one package manager. Two lockfiles is like having two conflicting schema definitions for the same table.

2. **Using `npx` instead of `bunx`:**
   - **What happens:** `npx` is npm's tool for running one-off commands. It works, but it downloads its own copy of the package instead of using Bun's cache, making it slower and potentially pulling a different version.
   - **Fix:** Use `bunx` for any one-off command execution. Example: `bunx playwright test` instead of `npx playwright test`.
   - **Why:** `bunx` uses Bun's resolution and cache. Mixing `npx` introduces a second tool with its own behavior -- unnecessary complexity.

3. **Editing `bun.lockb` manually:**
   - **What happens:** `bun.lockb` is a binary file, not human-readable text. Opening it in a text editor shows garbage characters. Editing it corrupts the lockfile and breaks `bun install` for everyone.
   - **Fix:** Never touch `bun.lockb` directly. To update a dependency, edit `package.json` and run `bun install` -- Bun regenerates the lockfile automatically.
   - **Why:** The lockfile is an output, not an input. It is generated from `package.json`, the same way an execution plan is generated from a SQL query -- you change the query, not the plan.

4. **Running `node` directly to execute scripts:**
   - **What happens:** `node src/lib/data/blog.ts` fails because Node.js cannot run TypeScript files without a separate compilation step. Bun handles TypeScript natively.
   - **Fix:** Use `bun run` for scripts. Bun compiles TypeScript on the fly.
   - **Why:** Bun includes a TypeScript transpiler. Node.js does not -- it requires an extra build step (tsc, ts-node, etc.).

## Break It to Learn It

### Exercise 1: Create the wrong lockfile

1. Open a terminal in the project root
2. Run `npm install` (yes, the wrong command on purpose)
3. **Predict:** What new file appears in the project root?
4. **Verify:** Check with `ls *.lock*` or look in your file explorer -- you should see both `bun.lockb` and `package-lock.json`
5. **What you learned:** Different package managers create different lockfiles; having both causes version drift between developers
6. **Undo your change:** Delete `package-lock.json` and run `bun install` to confirm the project still works

### Exercise 2: Compare install speed

1. Delete the `node_modules/` folder: `rm -rf node_modules`
2. Time a Bun install: `time bun install`
3. Delete `node_modules/` again
4. Time an npm install: `time npm install`
5. **Predict:** Which one is faster, and by roughly how much?
6. **Verify:** Compare the real times -- Bun is typically 5-10x faster
7. **What you learned:** Bun's speed advantage comes from its native architecture (written in Zig) and parallel downloads
8. **Undo your change:** Delete `package-lock.json` if npm created one

### Exercise 3: Run TypeScript directly

1. Create a temporary file: `echo 'const x: number = 42; console.log(x);' > /tmp/test.ts`
2. Try running it with Node: `node /tmp/test.ts`
3. **Predict:** Will Node.js execute the TypeScript file?
4. **Verify:** Node throws a syntax error on the `: number` type annotation
5. Now try: `bun /tmp/test.ts`
6. **What you learned:** Bun handles TypeScript natively -- no compilation step needed; Node.js requires extra tooling for TypeScript
7. **Undo your change:** Delete the temporary file

## Connections

- **Enables:** [[package-json-scripts]] because every script in `package.json` is executed via `bun run <name>`
- **Enables:** [[environment-and-tooling]] because the dev server, test runner, and type checker all run through Bun
- **Related:** [[sveltekit-project-structure]] because `bun install` populates the `node_modules/` directory that SvelteKit's imports resolve against

## Knowledge Check

1. What command installs all project dependencies? --> See [Worked Example](#worked-example)
2. Why does this project have `bun.lockb` but not `package-lock.json`? --> See [Common Mistakes](#common-mistakes)
3. Does Bun run in production on Vercel, or only in development? --> See [What It Is](#what-it-is)
4. What is the difference between `bun run dev` and `bun run test`? --> See [The Mental Model](#the-mental-model)
5. Why can Bun execute `.ts` files directly but Node.js cannot? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Bun Official Documentation](https://bun.sh/docs)
- [Bun vs Node.js -- Bun Blog](https://bun.sh/blog)
- [Bun Package Manager Docs](https://bun.sh/docs/install)
