# Slice 17e-1 Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the motion infrastructure all subsequent 17e sub-slices depend on: timing tokens (CSS + TS), shared `gsap.ticker`, lazy GSAP plugin loaders, `normalizeScroll` removed from Lenis bridge, bundle-size tooling.

**Architecture:** Hybrid from design spec — `motion/tokens.ts` mirrors `tokens.css` CSS custom properties (CSS is source of truth); `motion/utils/ticker.ts` exposes a single shared callback atop `gsap.ticker`; `motion/utils/gsap.ts` refactors to register only ScrollTrigger eagerly + async loaders for heavier plugins; `motion/utils/lenis.ts` drops the `normalizeScroll` call (fixes tap-vs-click on mobile). `rollup-plugin-visualizer` added for per-PR bundle-budget verification.

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom for motion/), GSAP + Lenis, Tailwind v4.

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (Sections 4.1–4.2, 4.4, 9.1)

**Branch:** `feature/slice-17e-1-foundation` (branched from `main`)

**Estimated sessions:** 1

---

## File Structure

### Created

- `src/lib/motion/tokens.ts` — TypeScript `duration` + `ease` constants, mirror of CSS custom properties
- `src/lib/motion/tokens.test.ts` — parity test that parses `tokens.css` and asserts matching values
- `src/lib/motion/utils/ticker.ts` — shared `gsap.ticker` wrapper with subscribe/unsubscribe
- `src/lib/motion/utils/ticker.test.ts` — ticker subscribe/unsubscribe + single-callback-per-frame test
- `docs/slices/slice-17e-1-foundation.md` — narrow slice spec

### Modified

- `src/lib/styles/tokens.css` — add missing `--duration-instant`, `--ease-out`, `--ease-in-out` tokens (keep existing `--duration-fast`, `--duration-normal`, `--duration-slow`, `--duration-slower`, `--ease-default`, `--ease-bounce`)
- `src/lib/motion/utils/gsap.ts` — keep ScrollTrigger eager; add async loaders `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase`; remove `MotionPathPlugin` and `SplitText` imports (unused after 17e-2)
- `src/lib/motion/utils/gsap.test.ts` — test lazy loaders register plugins idempotently
- `src/lib/motion/utils/lenis.ts` — remove `ScrollTrigger.normalizeScroll` block (touch devices use native scroll)
- `src/lib/motion/utils/lenis.test.ts` — update touch-device branch assertion
- `src/lib/motion/index.ts` — add re-exports for tokens + ticker + lazy loaders
- `vite.config.ts` — add `rollup-plugin-visualizer` plugin (emits `dist/stats.html`)
- `package.json` — add `rollup-plugin-visualizer` to devDependencies, add `bundle-size` script

---

## Task 1: Write slice spec for 17e-1

**Files:**
- Create: `docs/slices/slice-17e-1-foundation.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-1-foundation.md`:

```markdown
# Slice 17e-1 — Motion Foundation

**Status:** In progress
**Branch:** `feature/slice-17e-1-foundation`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-1-foundation.md`
**Depends on:** nothing (first 17e sub-slice)
**Blocks:** 17e-2 (Snappy Sweep), 17e-3 (Scrub Factories), 17e-4 (Hero Timeline), 17e-5 (Interaction Consolidation)

## What

Motion infrastructure the other 17e sub-slices depend on.

## Outcomes

1. `src/lib/motion/tokens.ts` exports `duration` and `ease` constants that mirror `tokens.css` CSS custom properties, with a unit test asserting parity.
2. `src/lib/styles/tokens.css` has the complete motion token set (`--duration-instant`, `--duration-fast`, `--duration-normal`, `--duration-slow`, `--duration-slower`, `--ease-default`, `--ease-out`, `--ease-in-out`, `--ease-bounce`).
3. `src/lib/motion/utils/ticker.ts` exposes `subscribe(id, fn)` + `unsubscribe(id)` on a single `gsap.ticker` callback. One frame → one DOM pass for all subscribers.
4. `src/lib/motion/utils/gsap.ts` registers only `ScrollTrigger` eagerly. `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` are async loaders that register-on-demand + are idempotent.
5. `src/lib/motion/utils/lenis.ts` does not call `ScrollTrigger.normalizeScroll`. Touch devices use native browser scroll (no scroll-jacking on mobile).
6. `rollup-plugin-visualizer` produces `dist/stats.html` on production build. `bun run bundle-size` is a working script.
7. `bun run test` and `bun run check` pass. Zero visual regression on the running site.

## Acceptance criteria

- [ ] All outcomes above are verified
- [ ] Tap-vs-click bug on mobile is resolved on a real iPhone + Android device (TocPill opens only on tap, ProjectsStrip links fire only on tap)
- [ ] Home route initial JS bundle size is reported by `bun run bundle-size` (baseline number recorded for future 17e sub-slices to compare against)
- [ ] No hardcoded timing values introduced by this sub-slice (all reads go through `tokens.ts` or CSS `var(--duration-*)` / `var(--ease-*)`)

## Non-goals

- Deleting existing `use:reveal` / entrance animations (that is 17e-2)
- Building scrub factories (17e-3, 17e-4)
- Consolidating LED pulse / cursor blink / RAF loops (17e-5)
- Rewriting MOTION.md (17e-6)

## Iteration log

(Fill in per task as the session progresses.)
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-1-foundation.md
git commit -m "docs(slice-17e-1): slice spec for motion foundation"
```

STOP. Tell Yesid:
> "Wrote the 17e-1 slice spec at `docs/slices/slice-17e-1-foundation.md`. Check it and approve before I start touching code."

---

## Task 2: Audit + extend CSS motion tokens

**Files:**
- Modify: `src/lib/styles/tokens.css`
- Test: (none this step — CSS-only; covered by Task 3 parity test)

**Rationale:** `tokens.css` already has partial motion tokens (from 17a-3b). This task fills the gaps before `tokens.ts` mirrors it.

- [ ] **Step 1: Read current motion token block in `tokens.css`**

Run:
```bash
grep -n "duration\|ease" src/lib/styles/tokens.css
```

Expected (approximate — lines may differ):
```
43:  --duration-fast: 150ms;
44:  --duration-normal: 200ms;
45:  --duration-slow: 300ms;
46:  --duration-slower: 500ms;
47:  --ease-default: ease;
48:  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

- [ ] **Step 2: Extend the motion token block**

Find the block above. Replace it with:

```css
  /* Motion — durations (source of truth; motion/tokens.ts mirrors these) */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Motion — easings (source of truth; motion/tokens.ts mirrors these) */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1); /* was "ease" — replaced with explicit curve for consistency */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

Why these specific values:
- `--duration-instant: 100ms` — fastest perceptible transition (used for feedback flashes)
- `--duration-fast..slower` — unchanged from 17a-3b
- `--ease-default` — upgraded from string `ease` to explicit cubic-bezier matching Material Design "standard" curve
- `--ease-out` — default for enter/hover-in motion
- `--ease-in-out` — default for scroll-scrub
- `--ease-bounce` — spring feel, used by boop

- [ ] **Step 3: Run type check to ensure no CSS consumer broke**

Run:
```bash
bun run check
```

Expected: 0 errors (may have 21 pre-existing warnings — unchanged from before).

- [ ] **Step 4: Run full test suite**

Run:
```bash
bun run test
```

Expected: 769/769 pass (or current baseline — see checkpoint).

- [ ] **Step 5: Commit**

```bash
git add src/lib/styles/tokens.css
git commit -m "feat(slice-17e-1): extend motion tokens (instant, out, in-out, bounce)"
```

STOP. Tell Yesid:
> "Added `--duration-instant`, `--ease-out`, `--ease-in-out` to `tokens.css`, and upgraded `--ease-default` to an explicit cubic-bezier. No visual regression expected (these are new tokens, not yet consumed). Verify `bun run check` + `bun run test` on your end. Then approve to move to Task 3."

---

## Task 3: Create tokens.ts + parity test

**Files:**
- Create: `src/lib/motion/tokens.ts`
- Create: `src/lib/motion/tokens.test.ts`

**Rationale:** JS consumers (GSAP, Svelte actions) cannot read CSS custom properties at compute time without `getComputedStyle` plumbing on every call. A TypeScript mirror + parity test keeps them in sync without runtime overhead.

- [ ] **Step 1: Write the parity test FIRST (RED)**

Create `src/lib/motion/tokens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { duration, ease } from './tokens.js';

// Vitest runs tests from the project root; process.cwd() is reliable.
// Avoid __dirname (not defined under ESM/Vitest without extra plumbing).
const tokensCss = readFileSync(
  resolve(process.cwd(), 'src/lib/styles/tokens.css'),
  'utf-8',
);

function extractCssValue(cssText: string, name: string): string | null {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const match = cssText.match(re);
  return match ? match[1].trim() : null;
}

describe('motion/tokens — parity with tokens.css', () => {
  describe('durations', () => {
    it.each([
      ['instant', 100],
      ['fast', 150],
      ['normal', 200],
      ['slow', 300],
      ['slower', 500],
    ])('duration.%s === %ims (matches --duration-%s in tokens.css)', (key, expectedMs) => {
      const cssValue = extractCssValue(tokensCss, `duration-${key}`);
      expect(cssValue, `--duration-${key} missing from tokens.css`).not.toBeNull();
      expect(cssValue).toBe(`${expectedMs}ms`);
      expect(duration[key as keyof typeof duration]).toBe(expectedMs);
    });
  });

  describe('easings', () => {
    it.each([
      ['default', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['out', 'cubic-bezier(0.2, 0.8, 0.2, 1)'],
      ['in-out', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['bounce', 'cubic-bezier(0.34, 1.56, 0.64, 1)'],
    ])('ease.%s matches --ease-%s in tokens.css', (cssKey, expectedCurve) => {
      const cssValue = extractCssValue(tokensCss, `ease-${cssKey}`);
      expect(cssValue, `--ease-${cssKey} missing from tokens.css`).not.toBeNull();
      expect(cssValue).toBe(expectedCurve);

      // JS key uses camelCase for hyphenated CSS keys
      const jsKey = cssKey === 'in-out' ? 'inOut' : cssKey;
      expect(ease[jsKey as keyof typeof ease]).toBe(expectedCurve);
    });
  });

  it('duration has exactly the 5 expected keys', () => {
    expect(Object.keys(duration).sort()).toEqual(['fast', 'instant', 'normal', 'slow', 'slower']);
  });

  it('ease has exactly the 4 expected keys', () => {
    expect(Object.keys(ease).sort()).toEqual(['bounce', 'default', 'inOut', 'out']);
  });
});
```

- [ ] **Step 2: Run the parity test — should FAIL (tokens.ts does not exist)**

Run:
```bash
bun run test -- src/lib/motion/tokens.test.ts
```

Expected: FAIL — "Failed to resolve import './tokens.js'" or "tokens module not found".

- [ ] **Step 3: Create tokens.ts**

Create `src/lib/motion/tokens.ts`:

```typescript
// Motion timing tokens — mirror of tokens.css.
// tokens.css is the source of truth; this file exists because JS consumers
// (GSAP, Svelte actions) need these values at compute time without paying
// for `getComputedStyle` on every use. A parity test (tokens.test.ts) keeps
// both surfaces in sync.

export const duration = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export const ease = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type DurationKey = keyof typeof duration;
export type EaseKey = keyof typeof ease;

// Convenience: duration in seconds (GSAP uses seconds, not ms).
export function durationSec(key: DurationKey): number {
  return duration[key] / 1000;
}
```

- [ ] **Step 4: Run the parity test — should PASS**

Run:
```bash
bun run test -- src/lib/motion/tokens.test.ts
```

Expected: PASS — 11 assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/tokens.ts src/lib/motion/tokens.test.ts
git commit -m "feat(slice-17e-1): motion tokens.ts with parity test against tokens.css"
```

STOP. Tell Yesid:
> "Added `motion/tokens.ts` + parity test. It asserts every CSS custom property has a matching TypeScript constant and vice versa — so drift between the two is caught at test time. Verify `bun run test` passes on your end. Approve to move to Task 4."

---

## Task 4: Build shared ticker

**Files:**
- Create: `src/lib/motion/utils/ticker.ts`
- Create: `src/lib/motion/utils/ticker.test.ts`

**Rationale:** Three always-on `requestAnimationFrame` loops exist today (ManifestoCanvas, ReadingProgressBar, AboutTrain). One shared `gsap.ticker` callback that fans out to subscribers is cheaper and easier to audit.

- [ ] **Step 1: Write ticker test FIRST (RED)**

Create `src/lib/motion/utils/ticker.test.ts`.

**Testing strategy:** GSAP's ticker does not expose a public `.tick()` method, and forcing real `requestAnimationFrame` ticks in happy-dom is flaky. Instead, we spy on `gsap.ticker.add` to capture the internal callback the module registers, then invoke it manually to simulate a frame.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gsap } from 'gsap';
import { subscribe, unsubscribe, _resetForTests } from './ticker.js';

describe('motion/utils/ticker', () => {
  let internalCallback: ((time: number, deltaTime: number) => void) | null = null;

  beforeEach(() => {
    _resetForTests();
    internalCallback = null;
    // Intercept the single gsap.ticker.add call the module makes on first subscribe
    vi.spyOn(gsap.ticker, 'add').mockImplementation((cb: any) => {
      internalCallback = cb;
      return cb;
    });
    vi.spyOn(gsap.ticker, 'remove').mockImplementation(() => gsap.ticker as any);
  });

  it('subscribe invokes gsap.ticker.add exactly once even with many subscribers', () => {
    for (let i = 0; i < 10; i++) {
      subscribe(`many-${i}`, vi.fn());
    }
    expect(gsap.ticker.add).toHaveBeenCalledTimes(1);
  });

  it('internal callback fans out to all registered subscribers', () => {
    const a = vi.fn();
    const b = vi.fn();
    subscribe('a', a);
    subscribe('b', b);

    // Simulate one frame
    internalCallback?.(1.0, 16.67);

    expect(a).toHaveBeenCalledTimes(1);
    expect(a).toHaveBeenCalledWith(1.0, 16.67);
    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(1.0, 16.67);
  });

  it('unsubscribe removes callback from subsequent frames', () => {
    const callback = vi.fn();
    subscribe('one-shot', callback);
    unsubscribe('one-shot');

    internalCallback?.(1.0, 16.67);

    expect(callback).not.toHaveBeenCalled();
  });

  it('subscribing with existing id replaces the previous callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribe('id', first);
    subscribe('id', second);

    internalCallback?.(1.0, 16.67);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('subscribe returns an unsubscribe function', () => {
    const callback = vi.fn();
    const stop = subscribe('returned', callback);

    stop();
    internalCallback?.(1.0, 16.67);

    expect(callback).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — should FAIL (ticker.ts does not exist)**

Run:
```bash
bun run test -- src/lib/motion/utils/ticker.test.ts
```

Expected: FAIL — module resolution error.

- [ ] **Step 3: Create ticker.ts**

Create `src/lib/motion/utils/ticker.ts`:

```typescript
// Shared gsap.ticker wrapper.
// One gsap.ticker.add callback fans out to all subscribers — avoids multiple
// RAF loops from ManifestoCanvas, ReadingProgressBar, idle animations.
// Subscribers identified by string ID; subscribing with an existing ID
// replaces the previous callback (idempotent).

import { gsap } from 'gsap';

type Callback = (time: number, deltaTime: number) => void;

const subscribers = new Map<string, Callback>();
let internalSubscription: ((time: number, deltaTime: number) => void) | null = null;

function ensureTickerSubscription(): void {
  if (internalSubscription) return;
  internalSubscription = (time: number, deltaTime: number) => {
    subscribers.forEach((fn) => fn(time, deltaTime));
  };
  gsap.ticker.add(internalSubscription);
}

/**
 * Subscribe a callback to every frame tick.
 * @param id Unique identifier. Subscribing with an existing id replaces the previous callback.
 * @param fn Callback invoked per frame with `(time, deltaTime)` in seconds.
 * @returns Unsubscribe function.
 */
export function subscribe(id: string, fn: Callback): () => void {
  ensureTickerSubscription();
  subscribers.set(id, fn);
  return () => unsubscribe(id);
}

/**
 * Remove a subscribed callback by id. No-op if id is not subscribed.
 */
export function unsubscribe(id: string): void {
  subscribers.delete(id);
}

/**
 * Test-only helper — resets module state so each test starts fresh.
 * @internal
 */
export function _resetForTests(): void {
  if (internalSubscription) {
    gsap.ticker.remove(internalSubscription);
    internalSubscription = null;
  }
  subscribers.clear();
}
```

- [ ] **Step 4: Run tests — should PASS**

Run:
```bash
bun run test -- src/lib/motion/utils/ticker.test.ts
```

Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/utils/ticker.ts src/lib/motion/utils/ticker.test.ts
git commit -m "feat(slice-17e-1): shared gsap.ticker wrapper with subscribe/unsubscribe"
```

STOP. Tell Yesid:
> "Added `motion/utils/ticker.ts` — a single shared ticker callback that fans out to subscribers. Replaces three independent RAF loops in 17e-5. Six tests cover subscribe, unsubscribe, idempotent replace, single internal listener. Verify test run on your end. Approve to move to Task 5."

---

## Task 5: Refactor gsap.ts for lazy plugin loading

**Files:**
- Modify: `src/lib/motion/utils/gsap.ts`
- Modify: `src/lib/motion/utils/gsap.test.ts`

**Rationale:** Current `registerGsapPlugins()` eagerly registers seven plugins totaling ~80–120KB gzipped on every route. Home needs DrawSVG; listings need MorphSVG + Flip. Article pages need neither. Lazy per-need loading + removing unused plugins (MotionPathPlugin for deleted train, SplitText for deleted char-stagger) saves ~60KB on most routes.

**Scope note — Option B (chosen):** 17e-1 adds the lazy loaders *alongside* existing eager imports. No consumer migration happens in this sub-slice. The bundle-size win lands when subsequent sub-slices (17e-2 onward) delete consumers or switch them to lazy loaders. This keeps 17e-1 focused on infrastructure with zero behavioral change.

- [ ] **Step 1: Verify existing `src/lib/motion/utils/gsap.test.ts`**

Run:
```bash
cat src/lib/motion/utils/gsap.test.ts
```

It exists. Note existing tests — we'll add to them rather than replace. Keep any passing tests about `registerGsapPlugins`; we're adding new ones for the lazy loaders.

- [ ] **Step 2: Extend gsap.test.ts with lazy-loader tests (RED)**

Append to `src/lib/motion/utils/gsap.test.ts` — or wrap the whole file if simpler:

```typescript
import { describe, it, expect } from 'vitest';
import { gsap } from 'gsap';
import {
  registerGsapPlugins,
  loadDrawSVG,
  loadMorphSVG,
  loadFlip,
  loadCustomEase,
} from './gsap.js';

describe('motion/utils/gsap — eager registration', () => {
  it('registerGsapPlugins registers ScrollTrigger', () => {
    registerGsapPlugins();
    expect(gsap.plugins.ScrollTrigger).toBeDefined();
  });

  it('registerGsapPlugins is idempotent (safe to call twice)', () => {
    expect(() => {
      registerGsapPlugins();
      registerGsapPlugins();
    }).not.toThrow();
  });
});

describe('motion/utils/gsap — lazy loaders', () => {
  it('loadDrawSVG registers DrawSVGPlugin and is idempotent', async () => {
    await loadDrawSVG();
    await loadDrawSVG();
    expect(gsap.plugins.DrawSVGPlugin).toBeDefined();
  });

  it('loadMorphSVG registers MorphSVGPlugin and is idempotent', async () => {
    await loadMorphSVG();
    await loadMorphSVG();
    expect(gsap.plugins.MorphSVGPlugin).toBeDefined();
  });

  it('loadFlip registers Flip and is idempotent', async () => {
    await loadFlip();
    await loadFlip();
    // Flip exposes itself as gsap.Flip, not gsap.plugins.Flip
    expect((gsap as any).Flip ?? gsap.plugins.Flip).toBeDefined();
  });

  it('loadCustomEase registers CustomEase and is idempotent', async () => {
    await loadCustomEase();
    await loadCustomEase();
    expect(gsap.plugins.CustomEase).toBeDefined();
  });
});
```

- [ ] **Step 3: Run tests — should FAIL (loaders not defined yet)**

Run:
```bash
bun run test -- src/lib/motion/utils/gsap.test.ts
```

Expected: FAIL — missing exports (`loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase`).

- [ ] **Step 4: Update gsap.ts — hybrid eager + lazy**

Replace `src/lib/motion/utils/gsap.ts` in full:

```typescript
// GSAP plugin registration — hybrid eager + lazy.
//
// 17e-1 scope: all existing plugins remain eagerly registered via
// registerGsapPlugins() so no consumer breaks. Lazy loaders are added
// alongside as the migration path. Subsequent sub-slices migrate
// consumers, then 17e-6 closing removes the eager imports that are
// no longer referenced.
//
// Route expectations AFTER consumer migration (not this PR):
//   /                     -> loadDrawSVG() + loadCustomEase() at route setup
//   /blog, /projects,     -> loadMorphSVG() on first hover,
//   /services, /tech-stack   loadFlip() on first filter change
//   Other routes          -> nothing beyond ScrollTrigger

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; // DELETE in 17e-2 (train removal)
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText'; // DELETE in 17e-3 (crescendo replaces char-stagger)
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
import { Flip } from 'gsap/Flip';

let registered = false;
const loadedPlugins = new Set<string>();

export function registerGsapPlugins(): void {
	if (registered) return;
	gsap.registerPlugin(
		ScrollTrigger,
		MotionPathPlugin,
		DrawSVGPlugin,
		CustomEase,
		SplitText,
		MorphSVGPlugin,
		Flip,
	);
	// Ignore viewport height changes < 25% (mobile address bar show/hide).
	// Prevents ScrollTrigger from recalculating pin positions when browser
	// chrome appears/disappears.
	ScrollTrigger.config({ ignoreMobileResize: true });
	registered = true;
	// Mark all eagerly-registered plugins so lazy loaders no-op.
	['DrawSVG', 'MorphSVG', 'Flip', 'CustomEase'].forEach((p) => loadedPlugins.add(p));
}

// Lazy loaders — idempotent, safe to call even if registerGsapPlugins()
// already loaded the plugin eagerly (gsap.registerPlugin is itself idempotent).
// Subsequent sub-slices will remove the eager import above and rely solely on these.

export async function loadDrawSVG(): Promise<void> {
	if (loadedPlugins.has('DrawSVG')) return;
	const mod = await import('gsap/DrawSVGPlugin');
	gsap.registerPlugin(mod.DrawSVGPlugin);
	loadedPlugins.add('DrawSVG');
}

export async function loadMorphSVG(): Promise<void> {
	if (loadedPlugins.has('MorphSVG')) return;
	const mod = await import('gsap/MorphSVGPlugin');
	gsap.registerPlugin(mod.MorphSVGPlugin);
	loadedPlugins.add('MorphSVG');
}

export async function loadFlip(): Promise<void> {
	if (loadedPlugins.has('Flip')) return;
	// @ts-ignore — Windows casing conflict
	const mod = await import('gsap/Flip');
	gsap.registerPlugin(mod.Flip);
	loadedPlugins.add('Flip');
}

export async function loadCustomEase(): Promise<void> {
	if (loadedPlugins.has('CustomEase')) return;
	const mod = await import('gsap/CustomEase');
	gsap.registerPlugin(mod.CustomEase);
	loadedPlugins.add('CustomEase');
}

// Re-export so motion code only needs one import source.
export {
	gsap,
	ScrollTrigger,
	MotionPathPlugin,
	DrawSVGPlugin,
	CustomEase,
	SplitText,
	MorphSVGPlugin,
	Flip,
};
```

- [ ] **Step 5: Run the gsap tests — should PASS**

Run:
```bash
bun run test -- src/lib/motion/utils/gsap.test.ts
```

Expected: PASS — all eager + lazy loader assertions green.

- [ ] **Step 6: Run the FULL test suite — verify zero consumer breakage**

Run:
```bash
bun run test
```

Expected: All 769+ tests (current baseline) pass. Because all existing re-exports (MotionPathPlugin, SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase, Flip) are still available from `./gsap.js`, no consumer breaks.

If tests fail: investigate the specific failure. Do not proceed until all tests green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/utils/gsap.ts src/lib/motion/utils/gsap.test.ts
git commit -m "feat(slice-17e-1): add lazy GSAP plugin loaders alongside eager registration"
```

STOP. Tell Yesid:
> "Refactored `gsap.ts`: kept all eager imports for backward compatibility (legacy consumers keep working), added `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` as async idempotent loaders. Full test suite still green. The bundle-size win comes later when 17e-2 onward deletes the consumers and switches to lazy. Verify test run. Approve to move to Task 6."

---

## Task 6: Remove normalizeScroll from lenis.ts

**Files:**
- Modify: `src/lib/motion/utils/lenis.ts`
- Check: `src/lib/motion/utils/lenis.test.ts` (if exists) — may need update

**Rationale:** `ScrollTrigger.normalizeScroll({ allowNestedScroll: true })` sets `touch-action: pan-x pinch-zoom` on html/body, which alters iOS click-synthesis. This is the root cause of the tap-vs-click bug (TocPill opens on vertical scroll; ProjectsStrip links navigate on horizontal swipe). Removing it makes touch devices use native browser scroll — no scroll-jacking on mobile, clicks behave normally.

- [ ] **Step 1: Check if lenis.test.ts exists and what it asserts**

Run:
```bash
ls src/lib/motion/utils/lenis.test.ts 2>/dev/null && cat src/lib/motion/utils/lenis.test.ts || echo "no test file"
```

- [ ] **Step 2: Update lenis.ts**

Replace `src/lib/motion/utils/lenis.ts` in full:

```typescript
// Lenis smooth scroll initialization with GSAP ScrollTrigger bridge.
// Initialized once at layout level. All ScrollTrigger instances automatically
// use Lenis scroll position instead of native scroll.
//
// Strategy:
// - Desktop: Lenis provides buttery easing for wheel scroll.
// - Touch devices: native browser scroll. NO scroll-jacking.
//
// Previous versions called `ScrollTrigger.normalizeScroll({ allowNestedScroll: true })`
// on touch devices. That call applied `touch-action: pan-x pinch-zoom` to html/body,
// which altered iOS click synthesis — causing the tap-vs-click bug where TocPill
// opened on vertical scroll and ProjectsStrip links fired on horizontal swipe.
// Removing it is the right fix. Touch pin recalculations are handled by
// `ScrollTrigger.config({ ignoreMobileResize: true })` (set in gsap.ts).

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

let instance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;
let isTouchDevice = false;

export function initLenis(): void {
	if (instance) return;

	// ScrollTrigger.isTouch: 0 = no touch, 1 = touch only, 2 = touch + pointer
	isTouchDevice = ScrollTrigger.isTouch > 0;

	if (isTouchDevice) {
		// Touch: native browser scroll. Lenis disabled. No normalizeScroll.
		// ScrollTrigger still works with native scroll events.
		return;
	}

	// Desktop: Lenis for smooth wheel scroll
	instance = new Lenis({
		autoRaf: false, // We drive RAF via GSAP ticker — prevent double-update
		duration: 1.2,
		easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
	});

	// Bridge: Lenis scroll events update GSAP ScrollTrigger
	instance.on('scroll', ScrollTrigger.update);

	// Drive Lenis from GSAP's RAF ticker for frame-perfect sync
	tickerCallback = (time: number) => {
		instance?.raf(time * 1000);
	};
	gsap.ticker.add(tickerCallback);
	gsap.ticker.lagSmoothing(0);
}

export function destroyLenis(): void {
	if (isTouchDevice) {
		// Nothing to destroy — no normalizeScroll active, no Lenis instance.
		return;
	}
	if (!instance) return;
	if (tickerCallback) {
		gsap.ticker.remove(tickerCallback);
		tickerCallback = null;
	}
	instance.destroy();
	instance = null;
}

export function getLenis(): Lenis | null {
	return instance;
}
```

- [ ] **Step 3: Update or add lenis.test.ts**

If `lenis.test.ts` exists and has assertions about `normalizeScroll` being called on touch, update them. Otherwise, create `src/lib/motion/utils/lenis.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLenis, destroyLenis, getLenis } from './lenis.js';

describe('motion/utils/lenis', () => {
  beforeEach(() => {
    destroyLenis();
  });

  afterEach(() => {
    destroyLenis();
  });

  it('desktop: initLenis creates a Lenis instance', () => {
    // Force non-touch environment
    vi.spyOn(ScrollTrigger, 'isTouch', 'get').mockReturnValue(0);
    initLenis();
    expect(getLenis()).not.toBeNull();
  });

  it('touch: initLenis does NOT create a Lenis instance', () => {
    // Force touch environment
    vi.spyOn(ScrollTrigger, 'isTouch', 'get').mockReturnValue(1);
    initLenis();
    expect(getLenis()).toBeNull();
  });

  it('touch: initLenis does NOT call ScrollTrigger.normalizeScroll', () => {
    vi.spyOn(ScrollTrigger, 'isTouch', 'get').mockReturnValue(1);
    const normalizeSpy = vi.spyOn(ScrollTrigger, 'normalizeScroll');
    initLenis();
    expect(normalizeSpy).not.toHaveBeenCalled();
  });

  it('initLenis is idempotent (safe to call twice on desktop)', () => {
    vi.spyOn(ScrollTrigger, 'isTouch', 'get').mockReturnValue(0);
    initLenis();
    const first = getLenis();
    initLenis();
    expect(getLenis()).toBe(first);
  });

  it('destroyLenis clears the instance on desktop', () => {
    vi.spyOn(ScrollTrigger, 'isTouch', 'get').mockReturnValue(0);
    initLenis();
    expect(getLenis()).not.toBeNull();
    destroyLenis();
    expect(getLenis()).toBeNull();
  });
});
```

- [ ] **Step 4: Run lenis tests**

Run:
```bash
bun run test -- src/lib/motion/utils/lenis.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Run full test suite + check**

Run:
```bash
bun run test && bun run check
```

Expected: All pass. Check for 0 errors (pre-existing warnings OK).

- [ ] **Step 6: Verify on local dev server (manual)**

Run:
```bash
bun run dev
```

Open `http://localhost:5173/` on:
1. A desktop browser — verify hero scroll-scrub still works (Lenis active)
2. A real mobile device or Chrome DevTools mobile emulation — verify:
   - Hero scroll-scrub still works (native scroll drives ScrollTrigger)
   - `http://localhost:5173/blog/[any-slug]`: tapping TocPill opens it (not scroll)
   - `http://localhost:5173/services/[any-slug]`: ProjectsStrip links navigate only on tap (not on swipe)

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/utils/lenis.ts src/lib/motion/utils/lenis.test.ts
git commit -m "fix(slice-17e-1): remove normalizeScroll — fixes tap-vs-click bug on mobile"
```

STOP. Tell Yesid:
> "Removed `ScrollTrigger.normalizeScroll` from Lenis bridge. Touch devices now use native browser scroll; tap-vs-click bug should be resolved. Please test on a real iPhone + Android: (1) blog/[slug] — tap the TocPill, confirm it opens only on tap; (2) services/[slug] — tap a ProjectsStrip link, confirm it navigates only on tap, not on horizontal swipe. Also verify desktop hero scroll-scrub still works. Approve to move to Task 7."

---

## Task 7: Add bundle-size tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

**Rationale:** Per-PR bundle-size check enforces the Section 6.2 budgets. `rollup-plugin-visualizer` produces `dist/stats.html` showing per-module KB contribution.

- [ ] **Step 1: Install the plugin**

Run:
```bash
bun add -d rollup-plugin-visualizer
```

Expected: installs `rollup-plugin-visualizer` to `devDependencies`.

- [ ] **Step 2: Add plugin to vite.config.ts**

Edit `vite.config.ts` — add import + plugin.

Before:
```typescript
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
```

After:
```typescript
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { visualizer } from 'rollup-plugin-visualizer';
```

Before:
```typescript
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
```

After:
```typescript
	plugins: [
		tailwindcss(),
		sveltekit(),
		svelteTesting(),
		// Bundle size visualizer — emits dist/stats.html on production build.
		// Opened via `bun run bundle-size` (see package.json).
		// Only activates for production builds (dev and test unaffected).
		visualizer({
			filename: 'dist/stats.html',
			gzipSize: true,
			brotliSize: true,
			template: 'treemap',
			open: false,
		}),
	],
```

- [ ] **Step 3: Add bundle-size script to package.json**

Edit `package.json`. Find the `"scripts"` block. Add:

```json
"bundle-size": "bun run build && echo 'Bundle stats at dist/stats.html'"
```

(Keep existing scripts.)

- [ ] **Step 4: Run the bundle-size command**

Run:
```bash
bun run bundle-size
```

Expected:
- Production build succeeds
- File `dist/stats.html` exists
- Console prints "Bundle stats at dist/stats.html"

Verify:
```bash
ls -la dist/stats.html
```

- [ ] **Step 5: Manually open stats.html and record baseline**

Open `dist/stats.html` in a browser. Identify the gzipped size for each top-level route chunk.

Append a "Baseline bundle sizes" section to `docs/slices/slice-17e-1-foundation.md` (at the bottom, before the iteration log):

```markdown
## Baseline bundle sizes (17e start — after 17e-1 Foundation)

Recorded from `dist/stats.html` after `bun run bundle-size`.

| Route | Initial JS, gzipped |
|---|---|
| Home `/` | XXX KB |
| Blog listing `/blog` | XXX KB |
| Projects listing `/projects` | XXX KB |
| Services listing `/services` | XXX KB |
| Blog detail `/blog/[slug]` | XXX KB |
| Projects detail `/projects/[slug]` | XXX KB |
| Services detail `/services/[slug]` | XXX KB |
| About `/about` | XXX KB |
| Contact `/contact` | XXX KB |
| Tech stack `/tech-stack` | XXX KB |

These are the **baseline** numbers for 17e. Target budgets per design spec §6.2 are 60–120 KB depending on route. Subsequent 17e sub-slices compare against these baselines; the delta is reported in each sub-slice's handoff.
```

Replace `XXX KB` with actual values read from `dist/stats.html`.

- [ ] **Step 6: Add dist/stats.html to .gitignore if not already**

Run:
```bash
grep -q "dist/stats.html" .gitignore && echo "already ignored" || echo "NOT ignored — adding"
```

If not ignored, add to `.gitignore`:
```
dist/stats.html
```

- [ ] **Step 7: Run full test suite to verify vite config change didn't break anything**

Run:
```bash
bun run test && bun run check
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lockb vite.config.ts .gitignore docs/slices/slice-17e-1-foundation.md
git commit -m "chore(slice-17e-1): add rollup-plugin-visualizer + bun run bundle-size"
```

STOP. Tell Yesid:
> "Added `rollup-plugin-visualizer` + `bun run bundle-size` script. Generates `dist/stats.html` on prod build. I recorded the baseline bundle sizes in the slice spec under '17e-1 baseline' — these are the 'before' numbers that subsequent 17e sub-slices compare against. Open `dist/stats.html` to verify the treemap looks sensible. Approve to move to Task 8."

---

## Task 8: Update motion/index.ts + final verification

**Files:**
- Modify: `src/lib/motion/index.ts`

- [ ] **Step 1: Read current motion/index.ts**

```bash
cat src/lib/motion/index.ts
```

Expected:
```typescript
export * from './actions/index.js';
export * from './stores/index.js';
export * from './utils/index.js';
```

- [ ] **Step 2: Extend exports to include tokens**

Replace `src/lib/motion/index.ts`:

```typescript
// Public surface of the motion library.
// Import from '$lib/motion' or '$lib/motion/<subfolder>' as needed.

export * from './actions/index.js';
export * from './stores/index.js';
export * from './utils/index.js';
export * from './tokens.js';
```

- [ ] **Step 3: Check utils/index.ts re-exports the new additions**

```bash
cat src/lib/motion/utils/index.ts
```

If ticker is not exported, edit `src/lib/motion/utils/index.ts` to include:

```typescript
export * from './ticker.js';
```

(Add alongside existing exports — do not remove any.)

- [ ] **Step 4: Run type check and full test suite one final time**

Run:
```bash
bun run check
bun run test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 5: Smoke test the dev server**

Run:
```bash
bun run dev
```

Navigate through the site briefly — home → blog → projects → services → about → contact. Confirm:
- No console errors
- Hero scroll-scrub works (desktop)
- All pages render
- Interactions still work (boop, cursor glow, etc.)

No visual changes are expected in 17e-1 — this is pure infrastructure. If anything looks different visually, something broke; investigate before claiming done.

- [ ] **Step 6: Commit**

```bash
git add src/lib/motion/index.ts src/lib/motion/utils/index.ts
git commit -m "chore(slice-17e-1): export tokens + ticker from motion barrel"
```

- [ ] **Step 7: Push branch**

```bash
git push -u origin feature/slice-17e-1-foundation
```

STOP. Tell Yesid:
> "17e-1 Foundation tasks complete. Branch `feature/slice-17e-1-foundation` pushed. What was delivered:
>
> 1. `tokens.css` extended — added `--duration-instant`, `--ease-out`, `--ease-in-out`; upgraded `--ease-default` to explicit cubic-bezier.
> 2. `motion/tokens.ts` created + parity test.
> 3. `motion/utils/ticker.ts` created — shared `gsap.ticker` with subscribe/unsubscribe.
> 4. `motion/utils/gsap.ts` refactored — lazy loaders added alongside eager imports (consumer migration in 17e-2+).
> 5. `motion/utils/lenis.ts` — `normalizeScroll` removed, fixing tap-vs-click on mobile.
> 6. `rollup-plugin-visualizer` + `bun run bundle-size`. Baseline sizes recorded in slice spec.
> 7. `motion/index.ts` re-exports tokens + ticker.
>
> All tests pass. `bun run check` clean. No visual regression. Tap-vs-click fix verified on [iPhone/Android?].
>
> Want me to open a PR now, or continue to 17e-2 Snappy Sweep first?"

---

## Spec coverage self-check

Every Section 4.1 / 4.2 / 9.1 requirement from the design spec is implemented:

- ✅ `motion/tokens.ts` with parity to tokens.css — Task 3
- ✅ Motion token set complete in tokens.css — Task 2
- ✅ `motion/utils/ticker.ts` shared `gsap.ticker` — Task 4
- ✅ `motion/utils/gsap.ts` lazy plugin loaders (DrawSVG, MorphSVG, Flip, CustomEase) — Task 5
- ✅ `normalizeScroll` removed from `motion/utils/lenis.ts` — Task 6
- ✅ `rollup-plugin-visualizer` — Task 7
- ✅ Motion barrel exports — Task 8
- ✅ Slice spec + iteration log — Task 1 / continuous

Out of scope for 17e-1 (correctly deferred):
- Deletion of `motion/svg/Train*`, `actions/reveal.ts`, `actions/ripple.ts`, `actions/tilt.ts`, `components/ScrollRail.svelte` — 17e-2
- `SplitText` and `MotionPathPlugin` imports — still present in 17e-1 (Option B). Deleted by 17e-2 + 17e-3 when consumers move.

---

## Definition of done (17e-1)

- All 8 tasks approved by Yesid
- `bun run test` — all pass
- `bun run check` — 0 errors
- Tap-vs-click bug verified resolved on real mobile device
- `dist/stats.html` baseline bundle sizes recorded in slice spec
- Branch pushed
- Ready for PR (or sub-slice continues to 17e-2 on next session)
