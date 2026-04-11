# Testing Pipeline Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut test suite from ~60-110s to under 30s by switching to happy-dom, splitting into 2 Vitest projects, and switching to threads pool.

**Architecture:** Replace monolithic jsdom setup with 2 Vitest projects: `data` (node env, minimal setup, 9 files) and `dom` (happy-dom, full mock suite, 42 files). Switch pool from `forks` to `threads`.

**Tech Stack:** Vitest 4.1.0, happy-dom, @testing-library/svelte 5.3.1, Bun

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Keep (read-only reference) | `src/tests/setup.ts` | Current monolithic setup — delete after new files verified |
| Create | `src/tests/setup.data.ts` | Minimal setup for data project — jest-dom matchers only |
| Create | `src/tests/setup.dom.ts` | Full mock suite for dom project — happy-dom stubs + all library mocks |
| Modify | `vite.config.ts` | Replace flat `test` with `test.projects` array, happy-dom, threads pool |
| Modify | `package.json` | happy-dom added to devDependencies (via bun add) |
| Delete | `src/tests/setup.ts` | Old monolithic setup — removed after migration verified |
| Modify | `docs/TESTS.md` | Document new project structure and setup files |
| Modify | `docs/test_helper.md` | Update setup file references |
| Create | `docs/devlog/2026-04-08-testing-optimization.md` | Benchmark results and decisions |

---

### Task 1: Benchmark Baseline

**Files:** None modified — measurement only

- [ ] **Step 1: Run full test suite and record time**

Run: `bun run test`

Record in a scratch note:
- Total wall-clock time
- Number of tests / test files
- Any failures or timeouts (especially `AboutPage.test.ts`)

- [ ] **Step 2: Run a second time for warm-cache comparison**

Run: `bun run test`

Record second run time. The delta shows Vite transform cache effect.

---

### Task 2: Install happy-dom

**Files:**
- Modify: `package.json` (via bun add)

- [ ] **Step 1: Install happy-dom as dev dependency**

Run: `bun add -d happy-dom`

- [ ] **Step 2: Verify installation**

Run: `bun pm ls | grep happy-dom`

Expected: `happy-dom@<version>` appears in output.

---

### Task 3: Create setup.data.ts

**Files:**
- Create: `src/tests/setup.data.ts`

- [ ] **Step 1: Create the minimal data setup file**

```typescript
// src/tests/setup.data.ts
//
// Minimal setup for the "data" Vitest project.
// Data-layer tests run in Node environment (no DOM) and only need
// jest-dom matchers for assertion compatibility.

import '@testing-library/jest-dom/vitest';
```

That's it — 5 lines including comments. No DOM stubs, no library mocks, no svelte/vitest import (no DOM to flush).

---

### Task 4: Create setup.dom.ts

**Files:**
- Create: `src/tests/setup.dom.ts`
- Reference: `src/tests/setup.ts` (copy and modify)

- [ ] **Step 1: Create the full DOM setup file**

Copy all contents from `src/tests/setup.ts` into `src/tests/setup.dom.ts` with these changes:

1. Update the file header comment to say "dom" project
2. **Remove** the `matchMedia` stub (lines 48-56 of old setup.ts) — happy-dom implements it natively since v9.19.0
3. **Keep everything else** — canvas stub, IntersectionObserver, ResizeObserver, all GSAP mocks, Threlte mocks, postprocessing mock, lottie-web mock, fetch mock

The file should look like this (showing the diff from old `setup.ts`):

```typescript
// src/tests/setup.dom.ts
//
// Full setup for the "dom" Vitest project.
// Provides happy-dom stubs and library mocks for component + motion tests.
// happy-dom provides matchMedia natively — that stub is no longer needed.

import '@testing-library/jest-dom/vitest';
import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// happy-dom does not implement HTMLCanvasElement.getContext.
// lottie-web's CJS module code accesses canvas context at import time.
// Provide a minimal stub to prevent the "Cannot set properties of null" error.
HTMLCanvasElement.prototype.getContext = (() => {
	const noop = () => {};
	return function () {
		return {
			fillStyle: '',
			fillRect: noop,
			clearRect: noop,
			getImageData: () => ({ data: new Uint8Array(0) }),
			putImageData: noop,
			createImageData: () => ([]),
			setTransform: noop,
			drawImage: noop,
			save: noop,
			restore: noop,
			beginPath: noop,
			moveTo: noop,
			lineTo: noop,
			closePath: noop,
			stroke: noop,
			translate: noop,
			scale: noop,
			rotate: noop,
			arc: noop,
			fill: noop,
			measureText: () => ({ width: 0 }),
			transform: noop,
			rect: noop,
			clip: noop,
			canvas: { width: 0, height: 0 }
		};
	};
})() as unknown as typeof HTMLCanvasElement.prototype.getContext;

// NOTE: matchMedia stub REMOVED — happy-dom implements it natively (v9.19.0+).
// If individual tests need to override matchMedia values, they can use
// vi.stubGlobal or Object.defineProperty as before.

// Stub IntersectionObserver for test controllability.
// happy-dom has a basic implementation, but without real layout it can't fire
// callbacks meaningfully. Our stub is simpler and predictable.
vi.stubGlobal(
	'IntersectionObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// Stub ResizeObserver for test controllability.
vi.stubGlobal(
	'ResizeObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// --- GSAP and plugins ---
// GSAP relies on DOM measurement APIs that happy-dom does not fully support.
// Actions and components that use GSAP are tested for correct invocation,
// not for visual animation output — that belongs to Playwright E2E tests.

vi.mock('gsap', () => {
	const mockTimeline = {
		to: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		fromTo: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		call: vi.fn().mockReturnThis(),
		progress: vi.fn().mockReturnThis(),
		kill: vi.fn(),
		pause: vi.fn().mockReturnThis(),
		duration: vi.fn(() => 0),
		then: vi.fn((cb: () => void) => { cb(); return mockTimeline; })
	};
	return {
		gsap: {
			registerPlugin: vi.fn(),
			from: vi.fn(() => ({ kill: vi.fn() })),
			to: vi.fn(() => ({ kill: vi.fn() })),
			fromTo: vi.fn(() => ({ kill: vi.fn() })),
			set: vi.fn(),
			killTweensOf: vi.fn(),
			matchMedia: vi.fn(),
			timeline: vi.fn(() => mockTimeline)
		}
	};
});

vi.mock('gsap/ScrollTrigger', () => ({
	ScrollTrigger: {
		create: vi.fn(() => ({ kill: vi.fn() })),
		refresh: vi.fn(),
		getAll: vi.fn(() => []),
		killAll: vi.fn()
	}
}));

vi.mock('gsap/MotionPathPlugin', () => ({
	MotionPathPlugin: {}
}));

vi.mock('gsap/DrawSVGPlugin', () => ({
	DrawSVGPlugin: {}
}));

vi.mock('gsap/CustomEase', () => ({
	CustomEase: {
		create: vi.fn(() => 'custom')
	}
}));

vi.mock('gsap/MorphSVGPlugin', () => ({
	MorphSVGPlugin: {
		convertToPath: vi.fn(() => []),
	}
}));

vi.mock('gsap/SplitText', () => ({
	SplitText: class {
		chars: Element[] = [];
		words: Element[] = [];
		lines: Element[] = [];
		revert = vi.fn();
	}
}));

// --- Threlte (Three.js) ---
vi.mock('@threlte/core', () => ({
	Canvas: vi.fn(),
	T: vi.fn(),
	useTask: vi.fn(() => vi.fn()),
	useThrelte: vi.fn(() => ({
		scene: { background: null },
		renderer: {},
		camera: { current: {} },
		size: { width: 800, height: 600 },
		renderStage: {},
		autoRender: { current: true, set: vi.fn() }
	}))
}));

vi.mock('@threlte/extras', () => ({
	useGltf: vi.fn(() => ({ subscribe: vi.fn(), set: vi.fn() }))
}));

// --- postprocessing ---
vi.mock('postprocessing', () => ({
	EffectComposer: vi.fn(() => ({
		addPass: vi.fn(),
		removeAllPasses: vi.fn(),
		setSize: vi.fn(),
		render: vi.fn()
	})),
	EffectPass: vi.fn(),
	RenderPass: vi.fn(),
	BloomEffect: vi.fn(),
	KernelSize: { MEDIUM: 1 }
}));

// --- lottie-web ---
vi.mock('lottie-web', () => ({
	default: {
		loadAnimation: vi.fn(() => ({
			setSpeed: vi.fn(),
			play: vi.fn(),
			stop: vi.fn(),
			goToAndStop: vi.fn(),
			destroy: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			totalFrames: 60
		}))
	}
}));

// --- fetch (Web3Forms) ---
const originalFetch = globalThis.fetch;
vi.stubGlobal('fetch', async (url: string | URL | Request, init?: RequestInit) => {
	const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
	if (urlStr.includes('web3forms.com')) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return originalFetch(url, init);
});
```

---

### Task 5: Configure Vitest Projects + Pool

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace vite.config.ts test config with projects**

Replace the entire `vite.config.ts` with:

```typescript
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

// svelteTesting() is a Vite plugin from @testing-library/svelte that:
//   - adds 'browser' to resolve.conditions (makes Svelte use index-client.js)
//   - adds @testing-library/svelte* to ssr.noExternal (forces Vite transform)
// It only activates when process.env.VITEST is set, so it's safe to include always.
export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	test: {
		// Two projects: "data" for pure logic tests (node, fast),
		// "dom" for component/motion tests (happy-dom, full mocks).
		// See docs/superpowers/specs/2026-04-08-testing-optimization-design.md
		projects: [
			{
				extends: true,
				test: {
					name: 'data',
					include: ['src/lib/data/**/*.test.ts'],
					environment: 'node',
					globals: true,
					pool: 'threads',
					setupFiles: ['./src/tests/setup.data.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'dom',
					include: [
						'src/lib/components/**/*.test.ts',
						'src/lib/motion/**/*.test.ts',
						'src/routes/**/*.test.ts',
					],
					environment: 'happy-dom',
					globals: true,
					pool: 'threads',
					setupFiles: ['./src/tests/setup.dom.ts'],
				},
			},
		],
	},
});
```

Key changes from original:
- `environment: 'jsdom'` → split into `'node'` (data) and `'happy-dom'` (dom)
- `pool: 'threads'` added to both projects (was default `forks`)
- `setupFiles` split into targeted files per project
- `include` patterns scoped to each project's test files
- `extends: true` on both projects to inherit root plugins (sveltekit, tailwindcss, svelteTesting)

---

### Task 6: Run Tests and Fix Failures

**Files:** Various — depends on what breaks

- [ ] **Step 1: Run full test suite**

Run: `bun run test`

Expected: Most tests pass. Note any failures — they will be happy-dom compatibility issues.

- [ ] **Step 2: Fix happy-dom compatibility issues**

Common issues to look for:
1. **matchMedia tests** — If any test manually stubs matchMedia and then expects the old stub shape, it may need adjustment since happy-dom provides a real implementation
2. **URL handling** — happy-dom initializes with `about:blank`; relative URL tests might need a base URL
3. **HTMLElement property differences** — Subtle DOM API differences between jsdom and happy-dom
4. **Data tests crashing on DOM APIs** — If any data test accidentally uses a DOM API (it shouldn't), it will fail under `node` environment

For each failure: read the error, fix the minimal code needed, re-run just that file:

Run: `bunx vitest run --project data` (for data test failures)
Run: `bunx vitest run --project dom` (for dom test failures)
Run: `bunx vitest run src/lib/components/AboutPage.test.ts` (for specific file)

- [ ] **Step 3: Verify all tests pass**

Run: `bun run test`

Expected: All 480+ tests pass with zero failures.

- [ ] **Step 4: Verify AboutPage.test.ts specifically**

Run: `bunx vitest run src/lib/components/AboutPage.test.ts`

Expected: Completes without timeout. Record the time.

---

### Task 7: Delete Old Setup File

**Files:**
- Delete: `src/tests/setup.ts`

- [ ] **Step 1: Delete the monolithic setup file**

Only do this AFTER all tests pass in Task 6.

Run: `rm src/tests/setup.ts`

- [ ] **Step 2: Verify nothing references the old file**

Run: `grep -r "setup.ts" vite.config.ts src/tests/ --include="*.ts"`

Expected: Only references to `setup.data.ts` and `setup.dom.ts`, none to plain `setup.ts`.

- [ ] **Step 3: Run tests one more time**

Run: `bun run test`

Expected: All tests still pass.

---

### Task 8: Benchmark Final Result

**Files:** None modified — measurement only

- [ ] **Step 1: Run full suite 3 times, record each**

Run `bun run test` three times. Record:
- Cold run (delete `node_modules/.vite` first): `rm -rf node_modules/.vite && bun run test`
- Warm run 1: `bun run test`
- Warm run 2: `bun run test`

- [ ] **Step 2: Run type check**

Run: `bun run check`

Expected: No type errors.

- [ ] **Step 3: Calculate improvement**

Compare baseline (Task 1) vs final (this task):
- Absolute time saved
- Percentage improvement
- Per-project breakdown (if visible in output)

---

### Task 9: Update Documentation

**Files:**
- Modify: `docs/TESTS.md`
- Modify: `docs/test_helper.md`
- Create: `docs/devlog/2026-04-08-testing-optimization.md`

- [ ] **Step 1: Update docs/TESTS.md**

Add a new section at the top (after any existing header) explaining the project structure:

```markdown
## Test Architecture

Tests are split into two Vitest projects for performance:

| Project | Environment | Setup File | Scope |
|---------|-------------|------------|-------|
| **data** | `node` | `src/tests/setup.data.ts` | Pure data/logic tests — no DOM |
| **dom** | `happy-dom` | `src/tests/setup.dom.ts` | Component, motion, and route tests |

### Running tests

- `bun run test` — run all projects
- `bunx vitest run --project data` — run only data tests
- `bunx vitest run --project dom` — run only DOM tests
- `bunx vitest run src/path/to/file.test.ts` — run specific file

### Config

- `vite.config.ts` — `test.projects` array defines both projects
- Pool: `threads` (faster IPC than default `forks`, safe since all native deps are mocked)
- DOM environment: `happy-dom` (2-4x faster than jsdom, Svelte 5 compatible)
```

Also update any existing references to `src/tests/setup.ts` → the appropriate new file.

- [ ] **Step 2: Update docs/test_helper.md**

Replace references to `src/tests/setup.ts` with the new two-file structure. Explain which setup file is for which project and when to add mocks to each.

- [ ] **Step 3: Create devlog entry**

Create `docs/devlog/2026-04-08-testing-optimization.md` with:

```markdown
# Devlog — 2026-04-08 — Testing Pipeline Optimization (Slice 10d+)

## Summary
Optimized test suite from ~Xs to ~Ys (Z% improvement).

## Changes
1. Switched DOM environment: jsdom → happy-dom (2-4x faster)
2. Split into 2 Vitest projects: data (node) + dom (happy-dom)
3. Split setup.ts into setup.data.ts + setup.dom.ts
4. Switched pool: forks → threads
5. Removed matchMedia stub (happy-dom provides it natively)

## Benchmark Results

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Cold run | Xs | Ys | -Z% |
| Warm run | Xs | Ys | -Z% |
| AboutPage.test.ts | Xs (timeout risk) | Ys | Fixed |

## Decisions
- Kept IntersectionObserver/ResizeObserver stubs despite happy-dom having them — our stubs are simpler and more predictable for testing
- 2 projects instead of 3 — components need GSAP mocks transitively via Svelte actions
- WSL2 migration deferred to Session 2 (Claude Code Desktop compatibility TBD)

## Files Changed
- Created: src/tests/setup.data.ts, src/tests/setup.dom.ts
- Modified: vite.config.ts
- Deleted: src/tests/setup.ts
- Modified: docs/TESTS.md, docs/test_helper.md
```

Fill in actual numbers from benchmarks.

---

## Self-Review Checklist

- [x] **Spec coverage:** All 8 session tasks mapped to plan tasks. Acceptance criteria covered.
- [x] **Placeholder scan:** No TBD/TODO. Benchmark numbers are "fill in" by design (measurement tasks).
- [x] **Type consistency:** File paths, project names, and config keys are consistent across all tasks.
- [x] **Delete safety:** Old `setup.ts` deleted only after full verification in Task 7.
- [x] **Ordering:** Dependencies respected — install before config, config before test, verify before delete.
