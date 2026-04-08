---
title: "GitHub Actions CI"
domain: devops
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - devops
  - intermediate
prerequisites:
  - "[[git-workflow]]"
date: 2026-04-08
---

# GitHub Actions CI


## The Analogy

GitHub Actions CI is like a scheduled SQL job that runs your test suite on every code change. In SQL Server, you might create a SQL Agent Job that runs `EXEC sp_validate_data` every night and sends an email if it fails. GitHub Actions does the same thing for code: every time someone pushes code or opens a pull request, it automatically runs type checking, unit tests, and builds the project. If anything fails, the team knows immediately -- no manual checking required.

## What It Is

**CI (Continuous Integration)** is the practice of automatically verifying every code change. Instead of hoping that your code works, you prove it works by running automated checks every time code is pushed.

**GitHub Actions** is GitHub's built-in CI/CD platform. You define workflows in YAML files inside `.github/workflows/`. A workflow specifies:
- **When to run** (`on:`) -- triggers like `push` to `main`, `pull_request` to `main`
- **Where to run** (`runs-on:`) -- a virtual machine (e.g., `ubuntu-latest`)
- **What to do** (`steps:`) -- a sequence of commands

Each step is either:
- A pre-built **action** (e.g., `actions/checkout@v4` checks out your code, `oven-sh/setup-bun@v2` installs Bun)
- A **run** command (e.g., `run: bun run test`)

When a workflow fails, GitHub shows a red X on the commit or PR. When it passes, a green check. This visual signal is the "automated gatekeeper" that prevents broken code from being merged.

## Why It Matters

Every professional team uses CI. The interview question "Does your team have CI?" is really asking "Does your team have quality gates?" The answer should be "Yes -- type checking, unit tests, and build verification run automatically on every push." For clients, CI means code quality is verified by automation, not by hoping developers remembered to run tests. It catches:
- Type errors that would crash the site
- Test failures that indicate regressions
- Build errors that would prevent deployment

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `.github/workflows/ci.yml` | The entire file (35 lines) | The complete CI pipeline for this project |
| `.github/workflows/ci.yml` | `on: push: branches: [main]` | CI runs on every push to main and every PR targeting main |
| `.github/workflows/ci.yml` | `uses: oven-sh/setup-bun@v2` | Installs Bun in the CI environment (not npm, not Node) |
| `.github/workflows/ci.yml` | The 5 steps: install, sync, check, test, build | The quality gate sequence -- each step must pass for the workflow to succeed |

## The Mental Model

```
SQL Agent Job analogy:

  SQL Server:
  Job: "Nightly Data Validation"
  Schedule: Every night at 2 AM
  Step 1: EXEC sp_check_constraints → fail = send alert
  Step 2: EXEC sp_check_foreign_keys → fail = send alert
  Step 3: EXEC sp_generate_reports → fail = send alert

  GitHub Actions:
  Workflow: "CI"
  Trigger: Every push to main / every PR
  Step 1: bun install              → fail = red X
  Step 2: bunx svelte-kit sync     → fail = red X
  Step 3: bunx svelte-check        → fail = red X (type errors)
  Step 4: bun run test             → fail = red X (test failures)
  Step 5: bun run build            → fail = red X (build errors)


Pipeline visualization:

  Developer pushes code
       ↓
  GitHub detects push event
       ↓
  Workflow triggers on ubuntu-latest VM
       ↓
  ┌─────────────────────────────────────────┐
  │ Step 1: checkout code                   │ ← actions/checkout@v4
  │ Step 2: install Bun                     │ ← oven-sh/setup-bun@v2
  │ Step 3: bun install                     │ ← install dependencies
  │ Step 4: bunx svelte-kit sync            │ ← generate SvelteKit types
  │ Step 5: bunx svelte-check               │ ← type-check all .svelte/.ts
  │ Step 6: bun run test                    │ ← run all unit tests
  │ Step 7: bun run build                   │ ← build production bundle
  └─────────────────────────────────────────┘
       ↓                    ↓
  All pass → ✓ green     Any fail → ✗ red
```

## Worked Example

```yaml
# From: .github/workflows/ci.yml
# The complete CI pipeline for yesid.dev.

name: CI                              # Workflow name (shown in GitHub UI)

on:
  push:
    branches: [main]                   # Run on every push to main
  pull_request:
    branches: [main]                   # Run on every PR targeting main

jobs:
  ci:                                  # Job name
    runs-on: ubuntu-latest             # Virtual machine (free tier)

    steps:
      # Step 1: Check out the code from the repository
      # SQL analogy: RESTORE DATABASE from backup
      - uses: actions/checkout@v4

      # Step 2: Install Bun (this project uses Bun, not npm/node)
      # SQL analogy: Install the SQL client before running queries
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      # Step 3: Install project dependencies
      # SQL analogy: CREATE SCHEMA — set up the data structures
      - name: Install dependencies
        run: bun install

      # Step 4: Generate SvelteKit type definitions
      # Required before type-checking — creates .svelte-kit/types/
      - name: Sync SvelteKit
        run: bunx svelte-kit sync

      # Step 5: Type check — catches type errors across all files
      # SQL analogy: DBCC CHECKDB — verify data integrity
      - name: Type check
        run: bunx svelte-check --tsconfig ./tsconfig.json

      # Step 6: Unit tests — run all *.test.ts files
      # SQL analogy: EXEC sp_validate_all_constraints
      - name: Unit tests
        run: bun run test

      # Step 7: Build — produce the production bundle
      # If this fails, the site cannot deploy
      # SQL analogy: generating the production report — the final output
      - name: Build
        run: bun run build
```

The steps are ordered intentionally:
1. **Install** -- you cannot check code without dependencies
2. **Sync** -- SvelteKit needs generated types before type-checking
3. **Type check** -- catches errors faster than test execution
4. **Test** -- verifies behavior is correct
5. **Build** -- confirms the production artifact compiles

If step 3 fails (type error), steps 4-5 never run. This saves time -- no point running tests if the code does not even compile.

## Common Mistakes

1. **Not checking CI before merging a PR:**
   - **What happens:** You merge a pull request with a red X. The broken code is now in `main`. The deployed site might break.
   - **Fix:** Configure GitHub branch protection: require CI to pass before merging. This prevents accidental merges of broken code.
   - **Why:** CI is only useful if you act on its results. A red X that gets ignored is the same as no CI.

2. **CI passes locally but fails in GitHub:**
   - **What happens:** `bun run test` passes on your machine but fails in the CI VM. Common causes: different Bun version, missing environment variable, OS-specific behavior.
   - **Fix:** Pin the Bun version in CI (`bun-version: latest` or a specific version). Ensure all environment variables are set in the workflow. Test on a clean state (`bun install` with no cache).
   - **Why:** Your machine has state (caches, global packages, env vars) that the CI VM does not. CI is a clean room -- it starts fresh every time.

3. **Skipping the build step:**
   - **What happens:** Type checking and tests pass, but the production build fails due to import errors, missing assets, or size limits. You do not find out until deployment.
   - **Fix:** Always include `bun run build` as the final CI step. It catches a class of errors that type checking and tests cannot.
   - **Why:** The build step does tree-shaking, code splitting, and asset processing. Errors in these steps only surface during the build.

## Break It to Learn It

### Exercise 1: Read the CI Results on GitHub
1. Go to the project's GitHub page and click the "Actions" tab
2. **Predict:** You will see a list of workflow runs, each triggered by a push or PR, with green checks or red X marks
3. **Verify:** Click on a recent run and expand the steps to see the output of each command
4. **What you learned:** The Actions tab is the audit trail of every CI run -- like a SQL Agent Job history

### Exercise 2: Trace a Failure
1. In the Actions tab, look for any run with a red X (if none exist, that is a good sign)
2. **Predict:** The failure details will show which step failed and the exact error message
3. **Verify:** Click the failed step and read the error -- it will be the same error you would see running the command locally
4. **What you learned:** CI failure messages are identical to local errors -- diagnosing CI failures uses the same skills as diagnosing local failures

### Exercise 3: Understand the Trigger
1. Open `.github/workflows/ci.yml`
2. Change `on: push: branches: [main]` mentally to `on: push: branches: [main, develop]`
3. **Predict:** CI would now also run when pushing to a `develop` branch
4. **Verify:** This is a thought exercise -- the `on:` block controls when the workflow triggers
5. **What you learned:** The `on:` block is the "schedule" of the CI job -- you control exactly which events trigger it

## Connections

- **Depends on:** [[git-workflow]] because CI triggers on Git events (push, pull_request)
- **Related:** [[vercel-deployment]] because Vercel also triggers on `git push` -- CI validates, Vercel deploys
- **Related:** [[bun-vs-node]] because the CI pipeline uses Bun (`oven-sh/setup-bun`), not Node
- **Related:** [[vitest-fundamentals]] because `bun run test` in CI runs the Vitest test suite

## Knowledge Check

1. What is CI and what problem does it solve? → See [What It Is](#what-it-is)
2. What are the 5 steps in this project's CI pipeline and why are they in that order? → See [Worked Example](#worked-example)
3. Why does CI use `ubuntu-latest` instead of your local machine? → See [Common Mistakes](#common-mistakes)
4. What happens if the type-check step fails? → See [Worked Example](#worked-example)
5. How does CI relate to a SQL Agent Job? → See [The Analogy](#the-analogy)

## Go Deeper

- [GitHub Actions Official Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Quickstart](https://docs.github.com/en/actions/quickstart)
