---
title: "package.json Scripts"
domain: project-setup
difficulty: 1
difficulty_label: beginner
reading_time: 8
tags:
  - learn
  - project-setup
  - beginner
prerequisites:
  - "[[bun-runtime]]"
date: 2026-04-08
---

# package.json Scripts


## The Analogy

`package.json` is like a SQL job scheduler's config file -- it lists what commands are available, what each one does, and in what order steps run. Instead of scheduling stored procedure executions, it defines named shortcuts for development tasks. You type `bun run dev` the same way you would click "Execute Job" in SQL Server Agent -- the scheduler knows which steps to run because the config defines them.

## What It Is

`package.json` is a JSON file at the root of every JavaScript/TypeScript project. It serves three purposes:

1. **Manifest** -- declares the project name, version, and type (like a database's metadata catalog).
2. **Dependency list** -- declares what external packages the project needs (like listing which linked servers or external libraries a database depends on).
3. **Script registry** -- defines named commands you can run with `bun run <name>` (like SQL Agent job steps).

The `"scripts"` block is what you interact with daily. Each key is a command name, and its value is the shell command that actually executes. When you run `bun run dev`, Bun looks up the `"dev"` key in `"scripts"` and executes whatever command is mapped to it.

Scripts can call other tools installed in `node_modules/`. When `package.json` says `"test": "vitest run"`, Bun knows to look for the `vitest` executable inside `node_modules/.bin/` -- you don't need to type the full path.

## Why It Matters

Every JavaScript project has scripts. In an interview, "How do you build and test this project?" is answered entirely by reading `package.json`. For day-to-day work, these scripts are the buttons on your control panel -- you need to know which button does what, and in what order to press them. Running `bun run build` before `bun run check` means you might ship broken TypeScript to production. Running `bun run test` catches bugs before they reach the browser.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `package.json` | The `"scripts"` block (lines 6-17) | Every development command for this project is defined here -- this is the single source of truth for "what can I run?" |
| `package.json` | The `"devDependencies"` block (lines 18-38) | Lists tools used only during development: Vite, Vitest, Tailwind, svelte-check, Playwright |
| `package.json` | The `"dependencies"` block (lines 39-48) | Lists libraries that ship in the final build: GSAP, Three.js, Threlte, Lottie, marked |
| `vite.config.ts` | The `plugins` array and `test` block | The actual config consumed by several scripts -- `dev`, `build`, `test:unit` all read this file |

## The Mental Model

```
package.json "scripts" block
================================

  "dev"          -->  vite dev             (Start dev server at localhost:5173)
  "build"        -->  vite build           (Compile everything for production)
  "preview"      -->  vite preview         (Serve the production build locally)
  "prepare"      -->  svelte-kit sync      (Generate types for $lib aliases)
  "check"        -->  svelte-kit sync      (Generate types, then...)
                      && svelte-check      (...run TypeScript validation)
  "check:watch"  -->  same as check        (but re-runs on every file save)
  "test:unit"    -->  vitest               (Run tests in watch mode)
  "test"         -->  vitest run           (Run tests once, then exit)
  "test:watch"   -->  vitest               (Same as test:unit -- watch mode)
  "test:e2e"     -->  playwright test      (Run browser-based E2E tests)

DAILY WORKFLOW:
  1. bun run dev        <-- Start working (opens dev server)
  2. [write code]
  3. bun run test       <-- Did I break anything? (fast feedback)
  4. bun run check      <-- Are my types correct? (catches type mismatches)
  5. [commit if both pass]

BEFORE DEPLOY:
  6. bun run build      <-- Can the project compile for production?
  7. bun run preview    <-- Does the production build look correct?
```

Think of it as two groups:

- **Inner loop** (during development): `dev`, `test`, `check` -- you run these dozens of times a day
- **Outer loop** (before shipping): `build`, `preview`, `test:e2e` -- you run these before committing or deploying

## Worked Example

**Walking through `bun run check` step by step:**

```json
// From: package.json
{
  "scripts": {
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

When you type `bun run check`, here is exactly what happens:

**Step 1 -- Bun reads `package.json`.** It finds the `"check"` key and sees the value is two commands joined by `&&`. The `&&` operator means "run the second command only if the first one succeeds" -- like a SQL transaction where step 2 only executes if step 1 committed.

**Step 2 -- `svelte-kit sync` runs.** This command scans your project and generates TypeScript type definitions for SvelteKit's built-in features. For example, it creates types for the `$lib` import alias so that `import Nav from '$lib/components/Nav.svelte'` resolves correctly in your editor. Think of this as rebuilding the IntelliSense cache -- without it, the next step might report false errors.

**Step 3 -- `svelte-check --tsconfig ./tsconfig.json` runs.** This is the TypeScript validation step. It reads `tsconfig.json` (which extends SvelteKit's generated config), then walks through every `.svelte` and `.ts` file in the project. For each file, it checks:

- Are all types correct? (Does a function expecting a `string` actually receive a `string`?)
- Are all imports valid? (Does `$lib/data/types.ts` actually export what you are importing?)
- Are there unused variables or unreachable code?

If any check fails, `svelte-check` prints the file name, line number, and error message. If everything passes, it prints a success summary.

```
====================================
Loading svelte-check in workspace:
C:\Users\otalo\Yesito\Projects\yesid.dev
Getting Svelte diagnostics...

====================================
svelte-check found 0 errors and 0 warnings
```

**Step 4 -- You read the output.** Zero errors means your TypeScript is valid across the entire codebase. This is your pre-commit safety net -- always run `bun run check` before `git commit`.

## Common Mistakes

1. **Running `bun test` instead of `bun run test`:**
   - **What happens:** `bun test` invokes Bun's built-in test runner, which uses a different API than Vitest. Your tests either fail with confusing errors or don't run at all because they are written for Vitest's API.
   - **Fix:** Always use `bun run test`. The `run` keyword tells Bun to look up the command in `package.json` scripts, not to use its built-in test runner.
   - **Why:** Bun has its own test framework (`bun:test`), but this project uses Vitest. The `"test"` script in `package.json` maps to `vitest run`, which is the correct runner. Skipping `run` bypasses `package.json` entirely.

2. **Forgetting to run `check` before committing:**
   - **What happens:** You push code with a type error. The CI pipeline catches it and the build fails on Vercel. You have to make another commit just to fix the type, cluttering the git history.
   - **Fix:** Run `bun run test && bun run check` before every commit. If either fails, fix the issue first.
   - **Why:** `bun run test` verifies behavior (do things work?). `bun run check` verifies types (are contracts honored?). Both must pass. Skipping either is like deploying a stored procedure without testing it.

3. **Confusing `test`, `test:unit`, and `test:watch`:**
   - **What happens:** You run `bun run test:unit` expecting a one-time run, but it stays open and watches for file changes. You wait for it to "finish" but it never does.
   - **Fix:** Use `bun run test` for a single run (CI-style, exits when done). Use `bun run test:unit` or `bun run test:watch` when you want Vitest to stay open and re-run on every save.
   - **Why:** `vitest run` (the `test` script) runs once and exits. `vitest` without `run` (the `test:unit` and `test:watch` scripts) enters watch mode -- it stays alive and re-runs affected tests when you save a file.

4. **Running `build` without running `check` first:**
   - **What happens:** `vite build` compiles the project but does not perform full TypeScript validation. A build can succeed even with type errors because Vite strips types without checking them. You deploy code that passes build but has type bugs.
   - **Fix:** Always run `bun run check` before or alongside `bun run build`. The check step validates types; the build step compiles output.
   - **Why:** Vite uses esbuild to strip TypeScript types for speed -- it does not invoke the TypeScript compiler for validation. `svelte-check` fills that gap. They serve different purposes: check = correctness, build = output.

## Break It to Learn It

### Exercise 1: See what scripts exist

1. Open `package.json` in your editor
2. Read every key in the `"scripts"` block
3. **Predict:** What shell command runs when you type `bun run preview`?
4. **Verify:** It maps to `vite preview` -- run it after `bun run build` to see the production build locally
5. **What you learned:** `bun run <name>` is just a lookup table -- the real command is always the value string in `package.json`
6. **Undo your change:** Press Ctrl+C to stop the preview server

### Exercise 2: Break the check chain

1. Open `package.json`
2. Change the `"check"` script from `"svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"` to `"svelte-check --tsconfig ./tsconfig.json"` (remove the `svelte-kit sync &&` prefix)
3. **Predict:** Will `bun run check` still pass? What might go wrong?
4. **Verify:** Run `bun run check` -- it may report missing types for `$lib` aliases if the generated types are stale
5. **What you learned:** `svelte-kit sync` generates type definitions that `svelte-check` depends on -- the `&&` ordering ensures types are fresh before validation runs
6. **Undo your change** (restore the original script)

### Exercise 3: Watch mode vs single run

1. Run `bun run test:unit` in your terminal
2. **Predict:** Will the command exit after tests finish, or stay running?
3. **Verify:** Vitest enters watch mode -- it prints results and waits. Press `q` to quit.
4. Now run `bun run test`
5. **Verify:** Vitest runs once and exits back to your terminal prompt
6. **What you learned:** The difference between `vitest` (watch) and `vitest run` (single execution) -- same runner, different modes, controlled by the script definition

## Connections

- **Depends on:** [[bun-runtime]] because `bun run <name>` is the command that reads and executes these scripts
- **Enables:** [[environment-and-tooling]] because the Vite dev server, test runner, and type checker are all configured in tools that these scripts invoke
- **Related:** [[sveltekit-project-structure]] because the `prepare` and `check` scripts interact with SvelteKit's code generation (`svelte-kit sync`)

## Knowledge Check

1. What is the difference between `bun run test` and `bun run test:unit`? --> See [Common Mistakes](#common-mistakes)
2. Why does the `check` script run `svelte-kit sync` before `svelte-check`? --> See [Worked Example](#worked-example)
3. Which scripts would you run before every commit? --> See [The Mental Model](#the-mental-model)
4. What does the `&&` operator do between two commands? --> See [Worked Example](#worked-example)
5. Why might `bun test` (without `run`) produce unexpected results? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [npm package.json documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json) (the format is the same for Bun)
- [Bun Script Runner](https://bun.sh/docs/cli/run)
- [Vitest CLI Reference](https://vitest.dev/guide/cli.html)
