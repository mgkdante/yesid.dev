---
title: "Bun vs Node"
domain: devops
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - devops
  - beginner
prerequisites:
  - "[[bun-runtime]]"
date: 2026-04-08
---

# Bun vs Node


## The Analogy

Bun and Node.js are both JavaScript runtimes -- they execute JavaScript code outside a browser. Think of them as two different database engines that both understand SQL. PostgreSQL and SQL Server both run SQL queries, but they have different performance characteristics, different tooling, and different strengths. You might develop on PostgreSQL (faster for local dev) but deploy on SQL Server (better enterprise support). This project does exactly that: develop on Bun (fast), deploy on Node.js 22 (compatible with Vercel).

## What It Is

**Node.js** is the original JavaScript runtime. Released in 2009, it is the industry standard. Almost every JavaScript tool, library, and hosting platform supports Node.js. It comes with `npm` (package manager) and `npx` (package runner).

**Bun** is a newer JavaScript runtime (released 2023) built from scratch in Zig. It is designed to be a drop-in replacement for Node.js but significantly faster. Bun includes:
- A **runtime** (executes JavaScript/TypeScript files directly -- no separate compile step)
- A **package manager** (`bun install` -- 10-25x faster than `npm install`)
- A **bundler** (not used in this project -- Vite handles bundling)
- A **test runner** (`bun test` -- not used here; Vitest is used instead)

**Why both?** This project uses Bun for development because it is faster:
- `bun install` finishes in seconds vs npm's minutes
- `bun run dev` starts the dev server faster
- `bunx` replaces `npx` for running CLI tools

But Vercel's production runtime is Node.js 22 (configured via `adapter({ runtime: 'nodejs22.x' })` in `svelte.config.js`). Bun and Node.js are compatible enough that code written and tested on Bun runs on Node.js without changes.

## Why It Matters

Understanding runtime choices answers the interview question "Why did you choose this tool over alternatives?" The answer is: "Bun for development speed, Node.js for production stability. They are API-compatible, so the code does not change." For clients, Bun means faster development cycles (less time waiting for installs and builds) and Node.js in production means industry-standard reliability and hosting support.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `package.json` | Scripts like `"dev": "vite dev"`, `"test": "vitest run"` | All scripts are runtime-agnostic -- `bun run dev` executes `vite dev` |
| `svelte.config.js` | `adapter({ runtime: 'nodejs22.x' })` | Production runs on Node.js 22, not Bun |
| `.github/workflows/ci.yml` | `uses: oven-sh/setup-bun@v2` | CI uses Bun for install and build (speed) |
| `CLAUDE.md` | "Bun only. Never npm/npx/node." | Project convention: all commands use `bun` prefix |

## The Mental Model

```
Database engine analogy:

  Development:                Production:
  PostgreSQL (fast,           SQL Server (enterprise,
  great for local dev)        great for hosting)
       ↕                          ↕
  Bun (fast,                 Node.js 22 (stable,
  great for local dev)        Vercel-supported)

Both run the same SQL → Both run the same JavaScript


Command mapping:

  Node.js / npm              Bun equivalent
  ─────────────              ──────────────
  npm install                bun install          ← 10-25x faster
  npm run dev                bun run dev          ← same result
  npm run test               bun run test         ← same result
  npx svelte-check           bunx svelte-check    ← same result
  node script.js             bun script.ts        ← runs TS directly!

  Key difference: Bun runs .ts files natively.
  Node.js requires a compile step (tsc) or a loader (tsx).


Project lifecycle:

  Developer's machine:
    bun install        ← fast dependency install
    bun run dev        ← fast dev server start
    bun run test       ← fast test execution
    bun run build      ← fast production build
    bun run preview    ← test the build locally

  CI (GitHub Actions):
    oven-sh/setup-bun  ← install Bun on the CI VM
    bun install         ← fast install (same as local)
    bun run test        ← same tests, same results
    bun run build       ← same build output

  Production (Vercel):
    Node.js 22.x       ← runs the built output
    (Bun is not involved at runtime in production)
```

## Worked Example

```bash
# How Bun is used in this project's daily development:

# Install all dependencies (reads package.json, writes bun.lockb)
# npm equivalent: npm install
# Speed: typically 1-3 seconds vs npm's 15-30 seconds
bun install

# Start the development server
# Runs: vite dev (the actual command from package.json scripts)
bun run dev
# Output: Local server at http://localhost:5173/

# Run all unit tests
# Runs: vitest run
bun run test

# Type-check the entire project
# bunx = npx equivalent — runs a CLI tool without global install
bun run check
# Expands to: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

# Build for production
bun run build

# Preview the production build locally
bun run preview
# Output: Preview server at http://localhost:4173/
```

```javascript
// From: svelte.config.js
// The bridge between Bun (dev) and Node.js (prod):

adapter: adapter({ runtime: 'nodejs22.x' })

// This line says: "In production, run on Node.js 22."
// Why not Bun in production?
// 1. Vercel's serverless functions are optimized for Node.js
// 2. Node.js 22 LTS has years of production stability
// 3. Bun's production hosting story is still maturing
// 4. The code is compatible with both — no changes needed
```

The lockfile is `bun.lockb` (a binary file, faster to parse than npm's `package-lock.json`). This lockfile is committed to Git so every developer and CI gets the exact same dependency versions.

## Common Mistakes

1. **Using `npm` or `npx` instead of `bun`:**
   - **What happens:** You run `npm install` and it creates a `package-lock.json` alongside the existing `bun.lockb`. Now there are two lockfiles that can diverge.
   - **Fix:** Always use `bun install`, `bun run`, `bunx`. Delete `package-lock.json` if it appears. The project convention is Bun only.
   - **Why:** Mixed lockfiles cause "works on my machine" bugs. One lockfile = one source of truth for dependency versions.

2. **Assuming Bun and Node.js are 100% identical:**
   - **What happens:** You use a Bun-specific API (like `Bun.file()`) in your application code. It works locally but crashes on Vercel (Node.js does not have `Bun.file()`).
   - **Fix:** Use standard Node.js / Web APIs in application code. Bun supports them all. Bun-specific APIs should only be used in build scripts or dev tooling that never runs in production.
   - **Why:** Production runs on Node.js. If your code uses Bun-only APIs, it breaks in production.

3. **Worrying about Bun's "newness":**
   - **What happens:** You hesitate to use Bun because it is newer than Node.js. But the risk is minimal because Bun is only used during development and CI -- production runs on Node.js 22 LTS.
   - **Fix:** Use Bun confidently for dev. The output (built files) is platform-agnostic. The risk surface is zero in production.
   - **Why:** Bun is a development tool in this project, not a production runtime. The produced build is the same regardless of which runtime built it.

## Break It to Learn It

### Exercise 1: Compare Install Speed
1. Time `bun install` by running: `time bun install` (the deps are already cached, so this measures the overhead)
2. **Predict:** It will complete in under 1 second (deps are cached)
3. **Verify:** Run the command and observe the time
4. **What you learned:** Bun's install is fast enough that you can run it reflexively without waiting

### Exercise 2: Run TypeScript Directly
1. Create a temporary file: write `console.log("Hello from Bun!")` to a `.ts` file
2. Run it with `bun temp.ts`
3. **Predict:** Bun will execute the TypeScript file directly without a compile step
4. **Verify:** You should see "Hello from Bun!" in the output
5. **What you learned:** Bun runs TypeScript natively -- no `tsc` compile step needed
6. **Delete the temp file**

### Exercise 3: Check the Lockfile
1. Run `ls -la bun.lockb` in the project root
2. **Predict:** It is a binary file (not human-readable like `package-lock.json`)
3. **Verify:** Try `file bun.lockb` -- it should identify it as a binary/data file
4. **What you learned:** Bun uses a binary lockfile for faster parsing -- this is a tradeoff (speed vs readability)

## Connections

- **Depends on:** [[bun-runtime]] because that doc covers what Bun is; this doc explains the Bun vs Node decision
- **Related:** [[vercel-deployment]] because Vercel runs Node.js 22, not Bun
- **Related:** [[github-actions-ci]] because CI installs Bun via `oven-sh/setup-bun`
- **Related:** [[git-workflow]] because `bun.lockb` is committed to Git as the single lockfile

## Knowledge Check

1. Why does this project use Bun for development but Node.js for production? → See [What It Is](#what-it-is)
2. What is the `bun` equivalent of `npm install`? → See [The Mental Model](#the-mental-model)
3. Why should you never run `npm install` in this project? → See [Common Mistakes](#common-mistakes)
4. What is `bun.lockb` and why is it binary? → See [Worked Example](#worked-example)

## Go Deeper

- [Bun Official Documentation](https://bun.sh/docs)
- [Node.js Official Documentation](https://nodejs.org/docs/latest-v22.x/api/)
