# Devlog — 2026-04-08 — Testing Pipeline Optimization (Slice 10d+)

## Summary

Optimized test suite from ~56s to ~29s real wall-clock time (48% improvement). All 480 tests pass. AboutPage.test.ts timeout fixed.

## Changes

1. **Switched DOM environment:** jsdom -> happy-dom (2-4x faster DOM operations)
2. **Split into 2 Vitest projects:** data (node) + dom (happy-dom)
3. **Split setup file:** `setup.ts` -> `setup.data.ts` + `setup.dom.ts`
4. **Switched pool:** forks (default) -> threads (faster IPC via shared memory)
5. **Removed matchMedia stub:** happy-dom implements it natively (v9.19.0+)
6. **Installed happy-dom v20.8.9** as dev dependency

## Benchmark Results

| Metric | Before (jsdom/forks) | After (happy-dom/threads) | Delta |
|--------|---------------------|--------------------------|-------|
| Real wall-clock (cold) | ~56s | ~29s | **-48%** |
| Real wall-clock (warm) | ~56s | ~29s | **-48%** |
| Vitest duration | 52.99s | 28.30s | -47% |
| Environment (cumulative) | 532.79s | 160.94s | **-70%** |
| Setup (cumulative) | 199.24s | 169.39s | -15% |
| Tests (cumulative) | 35.03s | 23.10s | -34% |
| AboutPage.test.ts | Intermittent timeout | 2.2s | Fixed |

The biggest win was the environment line — happy-dom boots ~3x faster than jsdom per worker. The threads pool and project split contributed additional gains.

## Decisions

- **2 projects instead of 3:** Originally planned data/components/motion split, but 26 component .svelte files use GSAP-based Svelte actions (`use:tilt`, `use:boop`, etc.) which transitively import GSAP. So components need GSAP mocks too. Simplified to data + dom.
- **Kept IntersectionObserver/ResizeObserver stubs:** happy-dom has them, but without real layout the callbacks don't fire meaningfully. Our simple stubs are more predictable for tests.
- **Removed matchMedia stub:** happy-dom provides a native implementation. Tests that override matchMedia still work via `Object.defineProperty`.
- **WSL2 migration deferred:** Session 2 task. Need to research Claude Code Desktop compatibility first. Expected additional 2-4x improvement from ext4 filesystem.

## Research

4 parallel research agents investigated:
1. happy-dom vs jsdom (Svelte 5 compat, API gaps, benchmarks)
2. Vitest pool/threading options (threads vs forks vs vmThreads, isolate settings)
3. WSL2 vs Windows performance (filesystem I/O, /mnt/c penalty, Bun on WSL2)
4. Setup file splitting (vitest projects, per-file environments, conditional mocking)

Full research findings in spec: `docs/superpowers/specs/2026-04-08-testing-optimization-design.md`

## Files Changed

- Created: `src/tests/setup.data.ts`, `src/tests/setup.dom.ts`
- Modified: `vite.config.ts`, `package.json`
- Deleted: `src/tests/setup.ts`
- Modified: `docs/TESTS.md`, `docs/test_helper.md`
- Created: `docs/superpowers/specs/2026-04-08-testing-optimization-design.md`
- Created: `docs/superpowers/plans/2026-04-08-testing-optimization.md`
