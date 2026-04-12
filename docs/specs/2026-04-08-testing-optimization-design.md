# Testing Pipeline Optimization — Design Spec

**Date:** 2026-04-08
**Slice:** 10d+
**Status:** approved
**Sessions:** 1 (code-level), 2 (WSL2 migration — pending Claude Code Desktop compatibility research)

## Problem

51 test files, 480+ tests, 55-110 seconds wall-clock time on Windows. Every iteration cycle (mandatory per slice protocol) costs 1-2 minutes of dead time. `AboutPage.test.ts` intermittently times out due to 17 renders of a heavy component in jsdom.

## Research Findings

Four parallel research tracks were completed. Key findings:

### happy-dom vs jsdom
- happy-dom is **2-4x faster** than jsdom (benchmarked: 500 component tests in 8.2s vs 24.1s)
- Svelte 5 compatible since v14.7.1 (current: v20.8.9)
- `matchMedia` built-in (stub can be removed)
- `IntersectionObserver` and `ResizeObserver` built-in (keep stubs for test controllability)
- `canvas.getContext` still needs stub in both environments
- Better SVG element coverage than jsdom (since v15.8.0)
- @testing-library/svelte recommends happy-dom for requestAnimationFrame issues

### Vitest pool/threading
- `threads` pool is faster than `forks` (default) — uses shared memory IPC
- Safe for this project because all native deps (GSAP, Three.js, lottie) are mocked
- `maxWorkers` default (cores-1 = 13 on 14-core machine) is already optimal
- `isolate: false` can skip per-file env setup — big gain but needs audit for state leaks
- `vitest.workspace.ts` is deprecated since Vitest 3.2 — use `test.projects` array instead

### Setup file optimization
- Setup files run for EVERY test file regardless of whether mocks are needed
- `// @vitest-environment node` is NOT safe with DOM-dependent setup files (they crash)
- The correct approach is `test.projects` — each project gets its own setup files
- Data tests (9 files) can run in `node` environment with zero DOM overhead
- Splitting setup into 3 targeted files eliminates unnecessary mock loading

### WSL2 (deferred to Session 2)
- WSL2 native ext4 is 2-4x faster for Vitest's I/O pattern
- `/mnt/c/` is catastrophically slow (3-13% of native) — project must live on WSL filesystem
- Bun on WSL2 works for Vitest workloads
- **Open question:** Claude Code Desktop compatibility with WSL2 — must research before committing

## Architecture: 2 Vitest Projects

Originally planned 3 projects (data/components/motion), but self-review found that
26 component `.svelte` files use `use:tilt`, `use:boop`, `use:magnetic`, etc. These
Svelte actions transitively import GSAP, so component tests need GSAP mocks too.
The difference between component and motion setup is then only Threlte + postprocessing
(~20 lines), which isn't worth a separate project. Simplified to 2 projects:

| Project | Glob patterns | Environment | Setup file | Contents |
|---------|--------------|-------------|------------|----------|
| **data** | `src/lib/data/**/*.test.ts` | `node` | `setup.data.ts` | jest-dom matchers only (~5 lines) |
| **dom** | `src/lib/components/**/*.test.ts`, `src/lib/motion/**/*.test.ts`, `src/routes/**/*.test.ts` | `happy-dom` | `setup.dom.ts` | Full mock suite (~200 lines) |

### What changes per project

**data** (9 files — `about-page`, `contact-page`, `content`, `data-integrity`, `locale`, `metro`, `metro-network`, `projects`, `tech-stack`):
- No DOM environment — runs in Node.js
- No GSAP/Threlte/lottie/postprocessing/canvas/observer stubs
- Only jest-dom matchers for assertion compatibility
- Fastest possible execution — pure logic tests

**dom** (42 files — all component, motion, and route tests):
- happy-dom instead of jsdom (2-4x faster)
- Canvas stub (needed for lottie-web)
- IntersectionObserver + ResizeObserver stubs (kept for test controllability)
- GSAP + all 6 plugins mocked (needed transitively via `use:tilt`, `use:boop`, etc.)
- Threlte (@threlte/core, @threlte/extras) mocks
- postprocessing mock
- lottie-web mock
- fetch mock (ContactPage uses Web3Forms)
- NO matchMedia stub (happy-dom has it built-in since v9.19.0)

### Config changes

| Setting | Current | New |
|---------|---------|-----|
| `environment` | `jsdom` (all) | `happy-dom` (components/motion), `node` (data) |
| `pool` | `forks` (default) | `threads` |
| `setupFiles` | 1 monolithic file | 2 targeted files |
| `projects` | none | 2 named projects |
| `globals` | `true` | `true` (unchanged) |

### Stubs removed
- `matchMedia` — happy-dom implements it natively (since v9.19.0)

### Stubs kept
- `canvas.getContext` — neither jsdom nor happy-dom implements it
- `IntersectionObserver` — happy-dom has it but without real layout, our controllable stub is safer
- `ResizeObserver` — same reasoning as IntersectionObserver

## AboutPage.test.ts Timeout Fix

Root cause: rendering a heavy component 17 times in jsdom on Windows NTFS.
Fix: happy-dom (2-4x faster DOM) + targeted setup (skip GSAP/Threlte mock overhead).
No test code changes needed.

## Session 1 Tasks (implementation order)

1. **Benchmark baseline** — record current `bun run test` times on Windows
2. **Install happy-dom** — `bun add -d happy-dom`
3. **Create 2 setup files** — split `src/tests/setup.ts` into `setup.data.ts` and `setup.dom.ts`
4. **Configure 2 Vitest projects** — update `vite.config.ts` with `test.projects` array
5. **Switch pool to threads** — add `pool: 'threads'` to each project
6. **Fix any test failures** — adjust tests/stubs for happy-dom compatibility
7. **Benchmark final result** — record new times, compute improvement
8. **Update docs** — TESTS.md, test_helper.md, devlog

## Acceptance Criteria

- [ ] All 480+ tests pass
- [ ] Total wall-clock time under 30 seconds on Windows
- [ ] No test removed or weakened
- [ ] Each optimization's delta logged in devlog
- [ ] docs/reference/TESTS.md updated with new setup/config
- [ ] AboutPage.test.ts no longer times out

## Out of Scope

- Writing new tests
- WSL2 migration (Session 2)
- E2E / Playwright optimization
- CI/CD pipeline changes
- Vitest Browser Mode (future slice)
