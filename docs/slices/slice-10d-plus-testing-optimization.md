# Slice 10d+ — Testing Pipeline Optimization (URGENT)

**Status:** ready
**Priority:** 0 (urgent — blocks development velocity)
**Estimated effort:** 1 session
**Depends on:** 10d (approved)
**Blocks:** 10e and all future slices (slow tests = slow iteration)
**Inserted between:** 10d and 10e

## Problem

Testing has become a development bottleneck. Current test suite:
- **51 test files**, **480 tests**
- **Total wall-clock time:** 55–110 seconds
- **Breakdown:**
  - Environment setup: ~200–400s cumulative (jsdom spins up per file)
  - Svelte compilation/transform: ~60–170s cumulative
  - Actual test execution: ~33–112s
- **Impact:** Every iteration requires waiting 1–2 minutes for feedback. With the iteration protocol requiring multiple stop/check/fix cycles per task, slow tests compound into 10–20 minutes of dead time per task.

## Root Causes

1. **jsdom is slow on Windows.** jsdom is the heaviest DOM implementation. Each test file creates a fresh jsdom environment with full DOM API simulation. On Windows (non-WSL), this is significantly slower than Linux.

2. **226-line setup file stubs everything.** `src/tests/setup.ts` patches GSAP, Threlte, lottie-web, canvas, matchMedia, IntersectionObserver, ResizeObserver, and more. This runs for every test file even if that file doesn't need those stubs.

3. **Svelte component compilation per file.** Every `.svelte` import triggers the Svelte compiler through Vite's transform pipeline. The same component may be compiled multiple times across different test files.

4. **No test parallelization tuning.** Vitest's default thread pool settings may not be optimal for the current file count and Windows I/O characteristics.

## Objectives

1. Reduce total test wall-clock time from ~60–110s to **under 30 seconds**
2. Maintain 100% test compatibility — no test should be removed or weakened
3. Research and document best practices for SvelteKit testing at this project's scale

## Research Phase (Start of Session)

Before implementing changes, research these topics:

### 1. WSL Performance
- **Question:** Does running `bun run test` inside WSL2 (same filesystem) significantly reduce jsdom/Vitest overhead?
- **Test:** Run the existing suite in WSL2 and compare times
- **Consideration:** If WSL is dramatically faster, it may be worth running tests there even while developing on Windows. Document the workflow.

### 2. happy-dom vs jsdom
- **Question:** How much faster is happy-dom for Svelte component tests with @testing-library/svelte?
- **Benchmark:** Switch `environment: 'jsdom'` → `environment: 'happy-dom'` in vite.config.ts and run full suite
- **Known trade-offs:** happy-dom has fewer DOM APIs. Some stubs in setup.ts may become unnecessary. Some edge-case tests may need adjustment.
- **Reference:** https://github.com/nicknisi/happy-dom — actively maintained, designed for fast testing

### 3. Per-file Environment Override
- **Question:** Do all 51 test files need a DOM environment?
- **Optimization:** Data layer tests (`tech-stack.test.ts`, etc.) can use `environment: 'node'` — no DOM needed
- **Implementation:** Add `// @vitest-environment node` comment to pure data tests

### 4. Vitest Pool Configuration
- **Options:**
  - `pool: 'threads'` (default) vs `pool: 'forks'` vs `pool: 'vmThreads'`
  - `poolOptions.threads.minThreads` / `maxThreads` tuning
  - `poolOptions.threads.isolate: false` for shared module cache (risky but fast)
- **Benchmark each option** against the baseline

### 5. Setup File Optimization
- **Current:** 226-line monolithic setup stubs everything for every file
- **Optimization:** Split into targeted setup files:
  - `setup-base.ts` — jest-dom matchers + testing-library/svelte (always)
  - `setup-motion.ts` — GSAP, ScrollTrigger, DrawSVG stubs (only motion-heavy components)
  - `setup-3d.ts` — Threlte, Three.js stubs (only 3D components)
  - `setup-canvas.ts` — canvas, lottie stubs (only animation components)
- **Per-file config:** Use `vitest.workspace.ts` to assign different setup files to different test groups

### 6. Svelte Compilation Cache
- **Question:** Is Vite caching Svelte transforms between test files?
- **Check:** Look for `.vitest-cache` or Vite cache config
- **Optimization:** Ensure `deps.optimizer.web.enabled` and transform caching are on

## Implementation Tasks

After research, implement the winning combination:

- [ ] **Task 1: Benchmark baseline**
  Record current times: native Windows, WSL2 (if available), and key metrics (setup, transform, tests)

- [ ] **Task 2: Switch to happy-dom**
  Change `environment: 'jsdom'` → `environment: 'happy-dom'`. Fix any compatibility issues in setup.ts or individual tests.

- [ ] **Task 3: Per-file environment overrides**
  Add `// @vitest-environment node` to pure data/logic test files that don't need DOM.

- [ ] **Task 4: Optimize setup file**
  Split monolithic setup into targeted files. Assign via vitest workspace config.

- [ ] **Task 5: Tune pool settings**
  Test different pool/thread configurations. Apply the fastest.

- [ ] **Task 6: WSL workflow (if beneficial)**
  If WSL is significantly faster, document the testing workflow and add a convenience script.

- [ ] **Task 7: Verify no regressions**
  All 480+ tests pass with identical results. Update docs/TESTS.md and docs/test_helper.md.

## Acceptance Criteria

- [ ] Full test suite runs under 30 seconds on the development machine
- [ ] All existing tests pass without modification (or with documented, justified changes)
- [ ] Vitest config is documented with comments explaining each optimization
- [ ] `docs/TESTS.md` updated with new setup/config details
- [ ] Benchmark results logged in devlog (before/after per optimization)

## Out of Scope

- Writing new tests
- Changing test coverage targets
- E2E (Playwright) optimization — separate concern
- CI/CD test pipeline — this is local developer experience only
