# Slice 17e-3 Scrub Factories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two sync scroll-scrub factories (`createCrescendoScrub`, `createDrawScrub`), apply them to their designated targets across the site, strip the Manifesto's entire on-enter GSAP timeline (including SplitText char-stagger), move SplitText from eager to lazy in `gsap.ts`, and enforce the Motion × SEO DOM-default-state rule. After this sub-slice, the Manifesto's signature 3-line statement scales with scroll through its section, three rotated edge titles (Projects / Services / Terminus) scale the same way, Blueprint SVGs draw themselves as the user scrolls through listings, and every scrub target's initial CSS renders identically to its final state.

**Architecture:** Sync factories (Decision 2 from the planning brainstorm). Caller preloads `loadDrawSVG()` at route boundary before constructing scrubs. `createDrawScrub(svgRoot, opts)` variant — factory queries paths internally from the SVG root. All factories honor `prefersReducedMotion` by rendering the target's final state and returning a no-op destroy. All factories target the `section: HTMLElement` as scroll-trigger ancestor. Decisions logged: D2 (factory signatures), D263 (Terminus is a crescendo target).

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom for motion/), GSAP + DrawSVGPlugin (lazy), Tailwind v4.

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§3.2 scrub signatures, §4.1 file layout, §4.3 canonical factory signature, §8 Motion × SEO contract, §9.1 sub-slice scope)

**Branch:** `feature/slice-17e-3-scrub-factories` (branched from `main` after 17e-2 merge)

**Depends on:** 17e-1 (motion tokens, shared ticker, lazy GSAP loaders), 17e-2 (Snappy Sweep — clears all entrance code except Manifesto)

**Blocks:** 17e-4 (`createHeroTimeline` is a self-contained factory but re-uses patterns established here), 17e-6 (MOTION.md v2.0 documents these factories)

**Estimated sessions:** 1

---

## File Structure

### Created

| File | Purpose |
|---|---|
| `src/lib/motion/scrubs/createCrescendoScrub.ts` | Sync factory — `transform: scale()` scrubs with scroll position through a section |
| `src/lib/motion/scrubs/createCrescendoScrub.test.ts` | Unit tests (reduced-motion branch, section-trigger wiring, destroy) |
| `src/lib/motion/scrubs/createDrawScrub.ts` | Sync factory — `stroke-dashoffset` scrubs on all paths inside an SVG root, through the section |
| `src/lib/motion/scrubs/createDrawScrub.test.ts` | Unit tests (path-query, reduced-motion, destroy) |
| `src/lib/motion/scrubs/index.ts` | Barrel — re-exports both factories + their types |
| `docs/slices/slice-17e-3-scrub-factories.md` | Narrow slice spec |

### Modified

| File | Change |
|---|---|
| `src/lib/motion/index.ts` | Re-export `./scrubs/index.js` |
| `src/lib/motion/utils/gsap.ts` | Move `SplitText` from eager batch to lazy-only; add `loadSplitText()` async loader. Rationale: after 17e-3, only `wordmarkHover` uses SplitText; loading on first hover is cheap and shaves initial-bundle cost. |
| `src/lib/motion/utils/gsap.test.ts` | Add `loadSplitText` test; remove eager `SplitText` registration assertion |
| `src/lib/motion/actions/wordmarkHover.ts` | Add `await loadSplitText()` before `new SplitText(...)` |
| `src/lib/motion/actions/wordmarkHover.test.ts` | Update mock setup for async load |
| `src/lib/components/home/Manifesto.svelte` | Delete entire `onMount` entrance timeline (lines ~120–172); delete `SplitText` usage; apply `createCrescendoScrub` to `.manifesto__statement` container; flip `opacity: 0` seed CSS on formerly faded-in elements to final state |
| `src/lib/components/home/HomePage.svelte` | Apply `createCrescendoScrub` to each of 3 `.rotated-title` divs (Projects / Services / Terminus sections) |
| `src/lib/components/blog/BlogListingPage.svelte` | Apply `createDrawScrub` to `BlogBlueprint` SVG root; `await loadDrawSVG()` at route setup |
| `src/lib/components/projects/ProjectListingPage.svelte` | Apply `createDrawScrub` to `ProjectsBlueprint` SVG root; `await loadDrawSVG()` at route setup |
| `src/lib/components/home/HomePage.svelte` (again) | Apply `createDrawScrub` to `ServicesBlueprint` SVG root if visually warranted (evaluate at Task 6) |
| `src/lib/components/brand/BlueprintShell.svelte` | Expose the inner SVG root via `bind:this` (or a forwarded ref) so callers can reach the SVG element for draw-scrub; no behavior change |
| Any file with `opacity: 0` or `stroke-dashoffset: 100%` as **initial** CSS on a scrub target | Delete the initial-state declaration or gate it behind `@media (prefers-reduced-motion: no-preference)` per SEO rule 1 |

### Not touched (correctly deferred)

- **HomeCloser graffiti** (`CloserGraffiti.svelte`) — doctrine exception. Stays on-enter. 17e-4 considers rebuild as `createCloserTimeline`.
- **Hero timeline** (`motion/utils/heroTimeline.ts`) — 17e-4 rewrite.
- **`SvgIcon.svelte` / `DataFlowDiagram.svelte` / `StackConnections.svelte`** — existing DrawSVG on-enter entrances; audit-flag for 17e-3 Task 8. If the audit confirms they're on-enter (doctrine violation), they become 17e-3 scope creep candidates or get their own tickets. Decision deferred to Task 8 inspection.
- **`morphHelpers.ts` → `actions/morphHover.ts`** — 17e-5.

---

## Task 1: Write slice spec for 17e-3

**Files:**
- Create: `docs/slices/slice-17e-3-scrub-factories.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-3-scrub-factories.md`:

```markdown
# Slice 17e-3 — Scrub Factories

**Status:** In progress
**Branch:** `feature/slice-17e-3-scrub-factories`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-3-scrub-factories.md`
**Depends on:** 17e-1 (tokens, ticker, lazy loaders), 17e-2 (Snappy Sweep)
**Blocks:** 17e-4 (reuses factory patterns)

## What

Build two sync scroll-scrub factories and apply them to the designated targets, strip the Manifesto's entire entrance timeline, move SplitText to lazy loading, and enforce SEO DOM-default-state.

## Outcomes

1. `src/lib/motion/scrubs/createCrescendoScrub.ts` implements the §4.3 canonical signature. Reduced-motion renders target at `maxScale`. Destroy is returned synchronously.
2. `src/lib/motion/scrubs/createDrawScrub.ts` implements `(svgRoot, { section, pathSelector = 'path', reverse? }) => () => void`. Caller must `await loadDrawSVG()` first. Reduced-motion renders all paths at full stroke. Destroy is returned synchronously.
3. `.manifesto__statement` container scales with scroll through the Manifesto section via crescendo. The Manifesto section's background layers (circuit grid, stripes, beck lines, roundels, edges, transit elements, prompt, pills, flow lines) render at final state on load — entire entrance timeline deleted.
4. Three `.rotated-title` divs (Projects / Services / Terminus) each get a crescendo scrub. All three are `<h2>` primary headings per D263 — no `aria-hidden`, no tag change, only `transform: scale()`.
5. `BlogBlueprint` SVG + `ProjectsBlueprint` SVG draw themselves as the user scrolls through the listing page's scroll section. `loadDrawSVG()` awaited at route setup. `ServicesBlueprint` scrub applied if visually warranted (evaluated at task time).
6. `SplitText` moves from eager to lazy in `motion/utils/gsap.ts`. `loadSplitText()` async loader exported. `wordmarkHover.ts` awaits the loader before constructing a SplitText instance. `MorphSVG` stays lazy (untouched here; was already lazy via 17e-1).
7. Zero `opacity: 0` or `stroke-dashoffset: 100%` remains as default CSS on any scrub target — SSR renders final visible state.
8. `bun run test` and `bun run check` pass. No visual regression on non-scrub surfaces.

## Acceptance criteria

- [ ] All outcomes above verified
- [ ] Manifesto section on `/` scrolls with 3-line statement scaling; background + pills + edges are statically visible from scroll entry
- [ ] Projects / Services / Terminus rotated titles each scale with scroll through their respective home sections
- [ ] `/blog` and `/projects` listing pages: scrolling through them progressively draws the Blueprint SVG strokes
- [ ] View-source on `/` — Manifesto statement text is present in SSR HTML at final size
- [ ] View-source on `/blog` — Blueprint SVG paths present at final stroke
- [ ] `bun run test` passes
- [ ] `bun run check` passes (0 errors)
- [ ] Bundle-size delta against 17e-2 end recorded

## Non-goals

- Hero timeline rewrite (17e-4)
- MetroNetwork SVG inlining (17e-4)
- `heroScrollLock.ts` deletion (17e-4)
- `morphHelpers.ts` relocation (17e-5)
- Ambient RAF consolidation (17e-5)
- Existing DrawSVG on-enter entrances in `SvgIcon`, `DataFlowDiagram`, `StackConnections` (audit at Task 8 may promote one or more to 17e-3 scope, or defer to a later ticket)

## Iteration log

(Fill in per task as the session progresses.)

## Bundle-size delta (17e-3 end vs 17e-2 end)

Recorded from `bun run bundle-size` at Task 9. Baseline from 17e-2's handoff.

| Route | 17e-2 end (gzip) | 17e-3 end (gzip) | Delta |
|---|---|---|---|
| Home `/` | — | — | — |
| Blog listing `/blog` | — | — | — |
| Projects listing `/projects` | — | — | — |
| Services listing `/services` | — | — | — |
| Blog detail `/blog/[slug]` | — | — | — |
| Projects detail `/projects/[slug]` | — | — | — |
| Services detail `/services/[id]` | — | — | — |
| About `/about` | — | — | — |
| Contact `/contact` | — | — | — |
| Tech stack `/tech-stack` | — | — | — |
| Shared layout (node 0) | — | — | — |

Expected deltas:

- **Shared layout (node 0):** modest shrink — `SplitText` moves out of eager bundle (~8 KB gzipped). `scrubs/` adds ~1 KB for the factory code.
- **Home `/`:** small shrink — Manifesto's entrance timeline code gone (~1–2 KB); gain small surface from crescendo wiring.
- **Listings (blog / projects):** small growth — `createDrawScrub` + `loadDrawSVG` call at route setup adds a few hundred bytes before DrawSVG plugin lazy-loads on scroll entry.
- **About, contact, services detail, tech stack:** near-flat — no direct consumer of the new scrubs; benefit from SplitText exiting the shared bundle.
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-3-scrub-factories.md
git commit -m "docs(slice-17e-3): slice spec for scrub factories"
```

STOP. Tell Yesid:
> "Wrote the 17e-3 slice spec at `docs/slices/slice-17e-3-scrub-factories.md`. Approve before I start building factories."

---

## Task 2: Build `createCrescendoScrub.ts` (TDD)

**Files:**
- Create: `src/lib/motion/scrubs/createCrescendoScrub.ts`
- Create: `src/lib/motion/scrubs/createCrescendoScrub.test.ts`

**Rationale:** The simplest of the two factories — no plugins required, only `transform: scale()` on a single target driven by `ScrollTrigger.onUpdate`. Design spec §4.3 gives the canonical signature. Build this first so the pattern is established for `createDrawScrub` next.

- [ ] **Step 1: Create the scrubs folder**

```bash
mkdir -p src/lib/motion/scrubs
```

- [ ] **Step 2: Write the test first (RED)**

Create `src/lib/motion/scrubs/createCrescendoScrub.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCrescendoScrub } from './createCrescendoScrub.js';
import * as reducedMotionStore from '$lib/motion/stores/reducedMotion.js';

describe('motion/scrubs/createCrescendoScrub', () => {
	let target: HTMLElement;
	let section: HTMLElement;

	beforeEach(() => {
		target = document.createElement('div');
		section = document.createElement('section');
		document.body.append(section, target);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('returns a destroy function', () => {
		const destroy = createCrescendoScrub(target, { section });
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('registers a ScrollTrigger with the given section as trigger', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createCrescendoScrub(target, { section });
		expect(createSpy).toHaveBeenCalledTimes(1);
		const call = createSpy.mock.calls[0][0];
		expect(call.trigger).toBe(section);
		expect(call.scrub).toBe(true);
		destroy();
	});

	it('destroy kills the registered ScrollTrigger', () => {
		const destroy = createCrescendoScrub(target, { section });
		const before = ScrollTrigger.getAll().length;
		destroy();
		const after = ScrollTrigger.getAll().length;
		expect(after).toBeLessThan(before);
	});

	it('reduced-motion: sets target to maxScale and skips ScrollTrigger', () => {
		vi.spyOn(reducedMotionStore, 'isPrefersReducedMotion').mockReturnValue(true);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');

		const destroy = createCrescendoScrub(target, { section, maxScale: 1.4 });

		expect(createSpy).not.toHaveBeenCalled();
		expect(target.style.transform).toContain('scale(1.4)');
		destroy(); // no-op
	});

	it('reduced-motion: destroy is a no-op that does not throw', () => {
		vi.spyOn(reducedMotionStore, 'isPrefersReducedMotion').mockReturnValue(true);
		const destroy = createCrescendoScrub(target, { section });
		expect(() => destroy()).not.toThrow();
	});

	it('accepts custom minScale, maxScale, ease', () => {
		const destroy = createCrescendoScrub(target, {
			section,
			minScale: 0.5,
			maxScale: 1.5,
			ease: 'out',
		});
		destroy();
		// Structural assertion — values are passed through without throwing
	});
});
```

- [ ] **Step 3: Run the test — should FAIL (module missing)**

```bash
bun run test -- src/lib/motion/scrubs/createCrescendoScrub.test.ts
```

Expected: FAIL with "Failed to resolve import './createCrescendoScrub.js'".

- [ ] **Step 4: Create the factory**

Create `src/lib/motion/scrubs/createCrescendoScrub.ts`:

```typescript
// Crescendo scroll-scrub factory.
//
// Scales a target element with scroll position through its section:
// minScale at section edges, maxScale mid-scroll. Pure transform — no DOM
// reorder, no tag change, no opacity. Heading hierarchy is preserved.
//
// Usage:
//   await <nothing — sync factory, no plugins required>;
//   const destroy = createCrescendoScrub(statementEl, { section: sectionEl });
//   onDestroy(destroy);
//
// Reduced-motion: target is set to maxScale immediately; ScrollTrigger is NOT
// registered; destroy is a no-op.

import { get } from 'svelte/store';
import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { ScrollTrigger } from '$lib/motion/utils/gsap.js';
import { ease as easeTokens, type EaseKey } from '$lib/motion/tokens.js';

export interface CrescendoOpts {
	/** Scroll-trigger ancestor — usually the containing <section>. */
	section: HTMLElement;
	/** Scale applied at the section edges (start and end of scroll). Default: 0.6 */
	minScale?: number;
	/** Scale applied mid-scroll. Default: 1.4 */
	maxScale?: number;
	/** Ease curve key from motion/tokens.ts. Default: 'inOut'. */
	ease?: EaseKey;
}

/**
 * Create a scroll-driven scale scrub on `target`, triggered by scroll position
 * through `opts.section`.
 */
export function createCrescendoScrub(
	target: HTMLElement,
	opts: CrescendoOpts,
): () => void {
	const { section, minScale = 0.6, maxScale = 1.4 } = opts;

	// Reduced motion: render final state, skip ScrollTrigger, no-op destroy.
	if (get(prefersReducedMotion)) {
		target.style.transform = `scale(${maxScale})`;
		return () => {};
	}

	const st = ScrollTrigger.create({
		trigger: section,
		start: 'top bottom',
		end: 'bottom top',
		scrub: true,
		onUpdate: (self) => {
			// t ∈ [0, 1, 0] via sin(π·progress) — 0 at edges, 1 at mid-scroll.
			const t = Math.sin(self.progress * Math.PI);
			const scale = minScale + t * (maxScale - minScale);
			target.style.transform = `scale(${scale})`;
		},
	});

	return () => st.kill();
}

// Re-export for convenience — callers can access the ease token keys.
export { easeTokens as ease };
```

- [ ] **Step 5: Run the test — should PASS**

```bash
bun run test -- src/lib/motion/scrubs/createCrescendoScrub.test.ts
```

Expected: PASS — 7 tests green.

- [ ] **Step 6: Run full suite to verify no regression**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: test count up by 7 from 17e-2's end. 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/scrubs/createCrescendoScrub.ts src/lib/motion/scrubs/createCrescendoScrub.test.ts
git commit -m "feat(slice-17e-3): createCrescendoScrub sync factory with reduced-motion branch"
```

STOP. Tell Yesid:
> "Task 2 done: `createCrescendoScrub` factory built with 7 tests. Sync, single-target, sin-curve scaling from minScale (edges) to maxScale (mid-scroll). Reduced-motion renders `maxScale` statically and skips ScrollTrigger. Approve to move to Task 3 (createDrawScrub)."

---

## Task 3: Build `createDrawScrub.ts` (TDD)

**Files:**
- Create: `src/lib/motion/scrubs/createDrawScrub.ts`
- Create: `src/lib/motion/scrubs/createDrawScrub.test.ts`
- Create: `src/lib/motion/scrubs/index.ts`

**Rationale:** DrawScrub progressively draws SVG stroke from 0% to 100% as the user scrolls through the section. Caller preloads the DrawSVG plugin (Decision 2A — sync factory, caller owns plugin loading).

- [ ] **Step 1: Write the test first (RED)**

Create `src/lib/motion/scrubs/createDrawScrub.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createDrawScrub } from './createDrawScrub.js';
import * as reducedMotionStore from '$lib/motion/stores/reducedMotion.js';

describe('motion/scrubs/createDrawScrub', () => {
	let svg: SVGSVGElement;
	let section: HTMLElement;

	beforeEach(() => {
		svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p1.setAttribute('d', 'M0 0 L10 10');
		const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p2.setAttribute('d', 'M10 10 L20 20');
		svg.append(p1, p2);

		section = document.createElement('section');
		document.body.append(section, svg);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('returns a destroy function', () => {
		const destroy = createDrawScrub(svg, { section });
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('registers a ScrollTrigger on the given section with scrub: true', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createDrawScrub(svg, { section });
		expect(createSpy).toHaveBeenCalledTimes(1);
		const call = createSpy.mock.calls[0][0];
		expect(call.trigger).toBe(section);
		expect(call.scrub).toBe(true);
		destroy();
	});

	it('queries all path elements under the svg root', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		createDrawScrub(svg, { section });
		const onUpdate = createSpy.mock.calls[0][0].onUpdate;
		expect(typeof onUpdate).toBe('function');
		// Structural — the factory must have captured the 2 paths.
		// Invoking onUpdate doesn't throw:
		expect(() => onUpdate?.({ progress: 0.5 } as any)).not.toThrow();
	});

	it('respects a custom pathSelector', () => {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('data-draw', '');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M0 0 L5 5');
		g.append(path);
		svg.append(g);

		const destroy = createDrawScrub(svg, {
			section,
			pathSelector: '[data-draw] path',
		});
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('reduced-motion: sets all paths to full stroke and skips ScrollTrigger', () => {
		vi.spyOn(reducedMotionStore, 'isPrefersReducedMotion').mockReturnValue(true);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createDrawScrub(svg, { section });
		expect(createSpy).not.toHaveBeenCalled();
		const paths = svg.querySelectorAll('path');
		paths.forEach((p) => {
			// Implementation MAY use DrawSVG "100%" via gsap.set OR set the style directly;
			// assert end state is not "0%" or negative.
			const value = (p as SVGPathElement).style.strokeDashoffset;
			expect(value === '' || value === '0' || value === '0px').toBe(true);
		});
		destroy();
	});

	it('reduced-motion: destroy is a no-op that does not throw', () => {
		vi.spyOn(reducedMotionStore, 'isPrefersReducedMotion').mockReturnValue(true);
		const destroy = createDrawScrub(svg, { section });
		expect(() => destroy()).not.toThrow();
	});

	it('destroy kills the registered ScrollTrigger', () => {
		const destroy = createDrawScrub(svg, { section });
		const before = ScrollTrigger.getAll().length;
		destroy();
		const after = ScrollTrigger.getAll().length;
		expect(after).toBeLessThan(before);
	});
});
```

- [ ] **Step 2: Run the test — should FAIL**

```bash
bun run test -- src/lib/motion/scrubs/createDrawScrub.test.ts
```

Expected: FAIL on import.

- [ ] **Step 3: Create the factory**

Create `src/lib/motion/scrubs/createDrawScrub.ts`:

```typescript
// DrawSVG scroll-scrub factory.
//
// Queries all path elements under `svgRoot` (or a custom selector), then
// scrubs `stroke-dashoffset` (via gsap DrawSVGPlugin) from 0% → 100% as the
// user scrolls through `opts.section`.
//
// Plugin loading is the caller's responsibility: `await loadDrawSVG()` at
// route setup BEFORE calling this factory. The factory is synchronous.
//
// Usage:
//   import { loadDrawSVG } from '$lib/motion/utils/gsap.js';
//   onMount(async () => {
//     await loadDrawSVG();
//     destroy = createDrawScrub(blueprintSvg, { section: listingSection });
//   });
//   onDestroy(() => destroy?.());
//
// Reduced-motion: paths rendered at full stroke (drawSVG 100%); ScrollTrigger
// NOT registered; destroy is a no-op.

import { get } from 'svelte/store';
import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface DrawScrubOpts {
	/** Scroll-trigger ancestor — usually the containing section. */
	section: HTMLElement;
	/** CSS selector scoped to the svgRoot. Default: 'path'. */
	pathSelector?: string;
	/** If true, stroke draws from 100% → 0% as user scrolls forward (reverse mode). Default: false. */
	reverse?: boolean;
}

/**
 * Create a scroll-driven DrawSVG scrub on every path element under `svgRoot`,
 * triggered by scroll position through `opts.section`.
 *
 * **Precondition:** caller must `await loadDrawSVG()` before invoking.
 */
export function createDrawScrub(
	svgRoot: SVGElement,
	opts: DrawScrubOpts,
): () => void {
	const { section, pathSelector = 'path', reverse = false } = opts;
	const paths = svgRoot.querySelectorAll(pathSelector);

	if (paths.length === 0) {
		// No-op — the factory was misapplied to an empty SVG. Return a no-op destroy.
		return () => {};
	}

	// Reduced motion: full stroke, no ScrollTrigger.
	if (get(prefersReducedMotion)) {
		// @ts-expect-error drawSVG is a plugin property on gsap
		gsap.set(paths, { drawSVG: '100%' });
		return () => {};
	}

	const from = reverse ? '100%' : '0%';
	const to = reverse ? '0%' : '100%';

	// @ts-expect-error drawSVG is a plugin property on gsap
	gsap.set(paths, { drawSVG: from });

	const st = ScrollTrigger.create({
		trigger: section,
		start: 'top bottom',
		end: 'bottom top',
		scrub: true,
		onUpdate: (self) => {
			const pct = self.progress * 100;
			// @ts-expect-error drawSVG is a plugin property on gsap
			gsap.set(paths, { drawSVG: reverse ? `${100 - pct}%` : `${pct}%` });
		},
	});

	return () => st.kill();
}
```

- [ ] **Step 4: Create the scrubs barrel**

Create `src/lib/motion/scrubs/index.ts`:

```typescript
// Scrub factories — scroll-driven motion tied to section scroll progress.
//
// All factories:
//   - Are synchronous. Callers preload any required GSAP plugin before invoking.
//   - Return a destroy function. Components wire `onDestroy(() => destroy?.())`.
//   - Honor prefers-reduced-motion by rendering the target's final state and
//     returning a no-op destroy.

export { createCrescendoScrub, type CrescendoOpts } from './createCrescendoScrub.js';
export { createDrawScrub, type DrawScrubOpts } from './createDrawScrub.js';
```

- [ ] **Step 5: Run the test — should PASS**

```bash
bun run test -- src/lib/motion/scrubs/createDrawScrub.test.ts
```

Expected: PASS — 7 tests green. If any fail on DrawSVG plugin behavior, check that the mock in `src/tests/setup.dom.ts` stubs `gsap.plugins.DrawSVGPlugin` adequately. Extend the mock if needed.

- [ ] **Step 6: Update `src/lib/motion/index.ts` barrel**

Read current, then add:

```typescript
export * from './scrubs/index.js';
```

- [ ] **Step 7: Run full suite**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: all pass, 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/motion/scrubs/ src/lib/motion/index.ts
git commit -m "feat(slice-17e-3): createDrawScrub sync factory + scrubs barrel"
```

STOP. Tell Yesid:
> "Task 3 done: `createDrawScrub` built with 7 tests; `scrubs/index.ts` barrel added; `motion/index.ts` re-exports. Factory is sync (caller preloads DrawSVG), queries paths from an SVG root, scrubs `stroke-dashoffset` with scroll progress, reduced-motion renders full stroke. Approve to move to Task 4 (Manifesto entrance deletion + crescendo application)."

---

## Task 4: Strip Manifesto entrance timeline + apply crescendo to statement

**Files:**
- Modify: `src/lib/components/home/Manifesto.svelte`

**Rationale:** The Manifesto's `onMount` currently runs a 15-tween GSAP entrance timeline that fades in background layers, edges, prompt, SplitText char-reveals the 3 lines, pills, and flow lines — all on ScrollTrigger enter. Snappy Doctrine kills all of it except the SplitText-replacement: `createCrescendoScrub` on the statement container. Background layers and everything else must render at final state from CSS defaults.

This is the most invasive component edit in 17e-3. Approach: surgical timeline deletion, then crescendo wiring, then CSS sweep to flip any formerly-faded element's default from `opacity: 0` to `opacity: 1`.

- [ ] **Step 1: Read current Manifesto.svelte and identify the entrance timeline boundaries**

```bash
cat src/lib/components/home/Manifesto.svelte | head -200
```

Key locations (approximate line numbers — read before editing):

- Imports: `SplitText`, `gsap`, `ScrollTrigger`, `registerGsapPlugins` — lines ~15–20 (some go, some stay)
- Element bindings: `sectionEl`, `line1El`, `hugeEl`, `line3El` — keep only the ones crescendo needs (`sectionEl` for trigger, and a new statement-container binding)
- `onMount` entrance block: lines ~107–172 — mostly DELETE, preserve countdownInterval logic if it's wanted (it's ambient state, not entrance)
- Template section: line ~175 starts the section; `.manifesto__statement` div at line ~199

- [ ] **Step 2: Add a bind for the statement container**

In the template, find:

```svelte
<div data-testid="manifesto-text" class="manifesto__statement">
```

Change to:

```svelte
<div data-testid="manifesto-text" bind:this={statementEl} class="manifesto__statement">
```

In the script, add:

```typescript
let statementEl = $state<HTMLElement>(undefined!);
```

Alongside the existing `sectionEl` binding.

- [ ] **Step 3: Delete the SplitText-related element bindings and imports**

If `line1El`, `hugeEl`, `line3El` were declared only for the SplitText entrance (check the file), delete their declarations. The statement container is scaled as a whole; individual lines don't need refs.

Remove `SplitText` from the `import` statement that pulls from `$lib/motion/utils/gsap.js`. The remaining imports should look like (exact shape depends on current file):

```typescript
import { registerGsapPlugins, ScrollTrigger } from '$lib/motion/utils/gsap.js';
```

(You may also drop `registerGsapPlugins` if nothing else in the file uses it after the deletion — grep the file.)

- [ ] **Step 4: Replace the `onMount` body — delete entrance timeline, add crescendo**

Before (approximate current structure, lines 107–172):

```typescript
onMount(() => {
  let countdownInterval: ReturnType<typeof setInterval> | undefined;
  if (!isPrefersReducedMotion()) {
    countdownInterval = setInterval(() => { ... }, 1000);
  }
  if (!browser || isPrefersReducedMotion()) {
    return () => { if (countdownInterval) clearInterval(countdownInterval); };
  }
  registerGsapPlugins();
  const splitLine1 = new SplitText(line1El, ...);
  const splitHuge  = new SplitText(hugeEl,  ...);
  const splitLine3 = new SplitText(line3El, ...);
  const tl = gsap.timeline({ paused: true });
  tl.to('.manifesto__circuit-grid', ...);
  tl.to('[class*="manifesto__stripe"]', ...);
  tl.to('.manifesto__beck-line, .manifesto__roundel', ...);
  tl.to('.manifesto__edge-left', ...);
  // ... 10+ more tweens ...
  ScrollTrigger.create({ trigger: sectionEl, ..., onEnter: () => tl.play(), onLeaveBack: () => tl.reverse() });
  return () => {
    if (countdownInterval) clearInterval(countdownInterval);
    splitLine1.revert(); splitHuge.revert(); splitLine3.revert();
    tl.kill();
    ScrollTrigger.getAll().forEach(st => { if (st.trigger === sectionEl) st.kill(); });
  };
});
```

After:

```typescript
import { createCrescendoScrub } from '$lib/motion/scrubs/index.js';

// (keep the countdown logic — ambient, not entrance; but 17e-5 will move it
// to the shared ticker + IntersectionObserver. For 17e-3, leave as-is.)

onMount(() => {
  let countdownInterval: ReturnType<typeof setInterval> | undefined;
  if (!isPrefersReducedMotion()) {
    countdownInterval = setInterval(() => {
      countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
    }, 1000);
  }

  let destroyCrescendo: (() => void) | undefined;
  if (browser && sectionEl && statementEl) {
    destroyCrescendo = createCrescendoScrub(statementEl, {
      section: sectionEl,
      minScale: 0.85,
      maxScale: 1.0,
    });
  }

  return () => {
    if (countdownInterval) clearInterval(countdownInterval);
    destroyCrescendo?.();
  };
});
```

Note on scale range: the Manifesto statement is already visually huge. `minScale: 0.85, maxScale: 1.0` gives a modest breathing-scrub — the 3-line grows slightly as the user scrolls into the middle of the section, then settles back. If visual tuning shows this is too subtle or too strong, adjust at Task 9 preview verification.

- [ ] **Step 5: CSS sweep — flip seed `opacity: 0` to `opacity: 1` on all formerly-faded elements**

Grep the Manifesto's scoped `<style>` block:

```bash
grep -n "opacity:\s*0[^.0-9]" src/lib/components/home/Manifesto.svelte
```

Also grep the related ManifestoEdge* files:

```bash
grep -rn "opacity:\s*0[^.0-9]" src/lib/components/home/ManifestoEdge*
```

For each `opacity: 0` in a default state (not a keyframe percentage):

- If the element was faded in by the deleted timeline (circuit grid, stripes, beck lines, edges, transit elements, prompt, pills, flow lines): **change to `opacity: 1`** (or delete the `opacity: 0` declaration so the default inherit / 1 applies).
- If it's inside `@keyframes` percentage: keep.
- If it's a state class (`.is-hidden { opacity: 0 }`): assess whether it was toggled by the deleted timeline. If yes, delete. If no, keep.

Related class selectors from the deleted timeline (for reference):

- `.manifesto__circuit-grid`
- `[class*="manifesto__stripe"]`
- `.manifesto__beck-line`
- `.manifesto__roundel`
- `.manifesto__edge-left` / `.edge-right` / `.edge-top` / `.edge-bottom`
- `.manifesto__arrival` / `.manifesto__chevrons` / `.manifesto__badge`
- `.manifesto__prompt`
- `.manifesto__pill`
- `.manifesto__flow-line` / `.manifesto__flow-line-v`

The ManifestoEdge* sub-components may hold the seed CSS for their own elements; touch each file.

- [ ] **Step 6: Run dev server + inspect Manifesto section**

```bash
bun run dev
```

Load `http://localhost:5173/`, scroll to the Manifesto section. Verify:

- All background layers (circuit grid, stripes, beck lines, edges) visible from the moment the section enters viewport — no fade-in
- The 3-line statement visible at natural size when arriving at the section edge
- As you scroll through the section, the statement scales slightly larger (maxScale) at mid-scroll, smaller (minScale) at edges
- Capability pills and flow lines visible at final state
- Countdown ticker still running (ambient), no regression

If anything is still invisible on scroll entry, Step 5 missed a seed CSS declaration — return and fix.

- [ ] **Step 7: Check Manifesto test file**

Check if `Manifesto.test.ts` asserts on SplitText / entrance timeline behavior:

```bash
cat src/lib/components/home/Manifesto.test.ts
```

Likely assertions that might now fail:

- Tests that check `SplitText` is imported / constructed
- Tests that assert on initial `opacity: 0` state of background layers
- Tests that simulate onEnter and check timeline behavior

Update or delete these. The test file should now assert:

- Section renders without throwing
- Statement container has `bind:this` (can be reached)
- Countdown logic still works
- Crescendo factory is invoked with section + statementEl on mount (mock the factory if desired)

- [ ] **Step 8: Run tests + check**

```bash
bun run test -- src/lib/components/home/Manifesto.test.ts 2>&1 | tail -15
bun run check 2>&1 | tail -10
bun run test 2>&1 | tail -10
```

Expected: Manifesto tests pass (may have deleted some, added new). Full suite green. 0 errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-3): strip Manifesto entrance timeline, apply crescendo to statement"
```

STOP. Tell Yesid:
> "Task 4 done: Manifesto's entire entrance timeline deleted (including SplitText char-stagger); `createCrescendoScrub` applied to `.manifesto__statement` container; seed `opacity: 0` CSS flipped on all formerly-faded Manifesto background/edge elements. Countdown ambient preserved (17e-5 rewires to shared ticker). Please verify on `/`: Manifesto section's backgrounds + edges + pills + statement all visible from scroll entry; statement scales gently as you scroll through the section. Approve to move to Task 5 (3 rotated-title crescendos)."

---

## Task 5: Apply crescendo to rotated edge titles (Projects / Services / Terminus)

**Files:**
- Modify: `src/lib/components/home/HomePage.svelte`

**Rationale:** Three `.rotated-title` divs in HomePage.svelte wrap `<SectionHeading>` h2 elements (Projects, Services, Terminus). Per D263, all three are crescendo targets; all three stay semantic h2 with no `aria-hidden`. Apply `createCrescendoScrub` to each, using the enclosing `<section class="home-section ...">` as the trigger.

- [ ] **Step 1: Read HomePage.svelte current state**

```bash
cat src/lib/components/home/HomePage.svelte
```

Current structure (reminder from planning brainstorm): each section is:

```svelte
<section class="home-section home-section--left">
  <div class="rotated-title rotated-title--left">
    <SectionHeading heading="Projects" />
  </div>
  <div class="home-section-content">
    <FeaturedProjects />
  </div>
</section>
```

- [ ] **Step 2: Add element bindings to HomePage.svelte**

Add `bind:this` to each `<section>` and each `.rotated-title`:

```svelte
<section bind:this={projectsSectionEl} class="home-section home-section--left">
  <div bind:this={projectsTitleEl} class="rotated-title rotated-title--left">
    <SectionHeading heading="Projects" />
  </div>
  <div class="home-section-content">
    <FeaturedProjects />
  </div>
</section>
```

Repeat for Services section (new vars: `servicesSectionEl`, `servicesTitleEl`) and Terminus/Closer section (`closerSectionEl`, `closerTitleEl`).

- [ ] **Step 3: Declare state and add `onMount` block to HomePage.svelte**

At the top of the existing `<script>`, import and declare:

```typescript
import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { createCrescendoScrub } from '$lib/motion/scrubs/index.js';

// Section + title bindings
let projectsSectionEl = $state<HTMLElement>(undefined!);
let projectsTitleEl = $state<HTMLElement>(undefined!);
let servicesSectionEl = $state<HTMLElement>(undefined!);
let servicesTitleEl = $state<HTMLElement>(undefined!);
let closerSectionEl = $state<HTMLElement>(undefined!);
let closerTitleEl = $state<HTMLElement>(undefined!);

let destroyFns: Array<() => void> = [];

onMount(() => {
  if (!browser) return;

  // On mobile (<1024px), rotated titles are display:none. Skip crescendo wiring;
  // ScrollTrigger would measure the invisible element.
  if (window.matchMedia('(max-width: 1023px)').matches) return;

  if (projectsTitleEl && projectsSectionEl) {
    destroyFns.push(
      createCrescendoScrub(projectsTitleEl, { section: projectsSectionEl }),
    );
  }
  if (servicesTitleEl && servicesSectionEl) {
    destroyFns.push(
      createCrescendoScrub(servicesTitleEl, { section: servicesSectionEl }),
    );
  }
  if (closerTitleEl && closerSectionEl) {
    destroyFns.push(
      createCrescendoScrub(closerTitleEl, { section: closerSectionEl }),
    );
  }
});

onDestroy(() => {
  destroyFns.forEach((fn) => fn());
  destroyFns = [];
});
```

**Note on mobile gate:** The rotated titles are `display: none` below 1024px (see existing CSS at line ~124 in HomePage.svelte). Creating a ScrollTrigger for a hidden element is wasteful; skip wiring on mobile. If the viewport is resized across the breakpoint during a session, the trigger won't re-attach until a page reload — acceptable limitation for 17e; can be tuned in a follow-up.

- [ ] **Step 4: Run dev server + inspect 3 sections**

```bash
bun run dev
```

Load `/`. Scroll slowly through:

- Projects section — rotated "Projects" label should scale slightly larger mid-scroll, smaller at edges
- Services section — same behavior on "Services" (right-side)
- Closer section — same behavior on "Terminus" (left-side)

All three labels stay as `<h2>` semantic headings; no `aria-hidden`. View-source should show the heading text at natural size in HTML.

- [ ] **Step 5: Verify mobile rendering**

Use Chrome DevTools to simulate iPhone. Rotated titles should be hidden (display: none). No ScrollTrigger errors in console. Pages scroll normally.

- [ ] **Step 6: Check HomePage.test.ts (if it exists)**

```bash
ls src/lib/components/home/HomePage.test.ts 2>/dev/null && cat src/lib/components/home/HomePage.test.ts || echo "no test"
```

If present, update or add assertions that the 3 section and 3 title bindings exist. If not present, skip.

- [ ] **Step 7: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: all pass, 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/home/HomePage.svelte src/lib/components/home/HomePage.test.ts
git commit -m "feat(slice-17e-3): apply crescendo to 3 rotated edge titles (Projects/Services/Terminus)"
```

STOP. Tell Yesid:
> "Task 5 done: crescendo applied to Projects, Services, Terminus rotated labels. Mobile gate skips wiring when labels are display:none. All 3 labels remain semantic `<h2>` per D263. Please verify on `/`: scroll through each section, observe label scales subtly with scroll position. Approve to move to Task 6 (Blueprint draw-scrubs)."

---

## Task 6: Apply `createDrawScrub` to Blueprint SVGs

**Files:**
- Modify: `src/lib/components/brand/BlueprintShell.svelte` — expose SVG root for binding (if not already)
- Modify: `src/lib/components/blog/BlogListingPage.svelte` — preload DrawSVG + construct scrub
- Modify: `src/lib/components/projects/ProjectListingPage.svelte` — same pattern

**Rationale:** `BlogBlueprint` and `ProjectsBlueprint` are the two design-spec-named draw-scrub targets (§3.2 signature 6). Both are decorative backgrounds composed of multiple sub-SVGs via `BlueprintShell`. Applying `createDrawScrub` at the listing-page level (where the Blueprint is a background to a scrollable section) means the stroke draws progressively as the user scrolls the listing.

`ServicesBlueprint` on the home page is analogous but not explicitly named in the design spec; evaluate at Step 4 of this task.

- [ ] **Step 1: Check BlueprintShell for SVG root access**

```bash
cat src/lib/components/brand/BlueprintShell.svelte | head -60
```

If BlueprintShell already accepts a `bind:this` or forwards a ref to its outermost element, proceed. If not, add a prop / binding mechanism — e.g., expose the inner SVG or outermost `<div>` via `bind:this` on the shell itself. Svelte 5 `$bindable` may be appropriate here.

**Minimum change:** expose a `{#snippet svgRoot()}` slot OR accept a callback prop that receives the SVG root element on mount. Pick whichever is least invasive to BlueprintShell's existing API.

Alternative: call `createDrawScrub` with the BlueprintShell's containing wrapper div (the Blueprint background container), and pass `pathSelector: 'svg path'` so the factory queries all `<path>` elements under the wrapper regardless of which nested SVG they live in. This is the simpler approach — no BlueprintShell changes required.

Recommendation: use the **wrapper + pathSelector** approach. Blueprint backgrounds are wrapped by a `<div>` with a known class (e.g., `.blueprint-bg`); bind that wrapper, pass it as `svgRoot` casting as SVGElement (type gymnastics needed but avoids BlueprintShell modification):

```svelte
<script>
  let blueprintWrapEl = $state<HTMLDivElement>(undefined!);
  // later:
  createDrawScrub(blueprintWrapEl as unknown as SVGElement, {
    section: listingSectionEl,
    pathSelector: 'svg path',
  });
</script>

<div bind:this={blueprintWrapEl} class="blueprint-bg">
  <BlogBlueprint />
</div>
```

The factory queries `svg path` from the wrapper div — picks up all paths across all nested SVGs.

**If this doesn't work** (because the factory's type is `SVGElement`), a cleaner fix is to narrow the factory type or add a permissive overload. Decide during implementation; don't over-engineer up front.

- [ ] **Step 2: Wire BlogListingPage.svelte**

Edit `src/lib/components/blog/BlogListingPage.svelte`:

1. Import:
```typescript
import { createDrawScrub } from '$lib/motion/scrubs/index.js';
import { loadDrawSVG } from '$lib/motion/utils/gsap.js';
```

2. Add bindings (replace whatever currently wraps BlogBlueprint):
```svelte
<div bind:this={blueprintWrapEl} class="...existing classes...">
  <BlogBlueprint />
</div>
```

And a `sectionEl` binding on the scrollable container that triggers the scrub:
```svelte
<section bind:this={listingSectionEl} class="...">
  <!-- listing content -->
</section>
```

3. `onMount` addition:
```typescript
let destroyDrawScrub: (() => void) | undefined;

onMount(async () => {
  if (!browser) return;
  if (isPrefersReducedMotion()) return;

  await loadDrawSVG();

  if (blueprintWrapEl && listingSectionEl) {
    destroyDrawScrub = createDrawScrub(
      blueprintWrapEl as unknown as SVGElement,
      { section: listingSectionEl, pathSelector: 'svg path' },
    );
  }
});

onDestroy(() => destroyDrawScrub?.());
```

Preserve any existing `onMount` logic (e.g., FLIP filter setup from 17e-2 Task 5) alongside this new block.

- [ ] **Step 3: Wire ProjectListingPage.svelte — same pattern**

Edit `src/lib/components/projects/ProjectListingPage.svelte`. Same import, binding, and `onMount` wiring as Step 2, targeting `ProjectsBlueprint`.

- [ ] **Step 4: Evaluate ServicesBlueprint (HomePage section 4)**

Run `bun run dev`, load `/`, scroll to the Services section. Watch the `ServicesBlueprint` background behavior.

- If the Blueprint is visibly decorative and prominent, applying `createDrawScrub` enhances the section as user scrolls. Wire it using the same pattern as Tasks 2/3, with Services section as trigger.
- If the Blueprint is very faint (0.08 opacity per `ServicesBlueprint.svelte:23`) and a scrub would be imperceptible, SKIP. Log the decision in the slice spec's iteration log.

Default recommendation: **skip** `ServicesBlueprint` draw-scrub. Design spec names only `blog + projects`. Narrower scope is safer; a future slice can expand if desired.

- [ ] **Step 5: Run dev server + verify**

```bash
bun run dev
```

Visit `/blog` — scroll from top to bottom. BlogBlueprint paths should progressively draw from 0 to 100% stroke as you scroll. Reload from `/` and jump to bottom of `/blog` — strokes at 100% (scroll end).

Visit `/projects` — same behavior with ProjectsBlueprint.

Reduced-motion: enable macOS / Windows / DevTools reduced-motion; reload. Blueprints render at full stroke immediately, no scroll animation.

- [ ] **Step 6: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: all pass, 0 errors.

If BlueprintShell or Blueprint sub-components' tests break on new `bind:this` usage (svelte-testing-library may not `render` correctly), update the test minimal-mock pattern.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-3): apply createDrawScrub to BlogBlueprint + ProjectsBlueprint"
```

STOP. Tell Yesid:
> "Task 6 done: BlogBlueprint and ProjectsBlueprint now draw progressively as user scrolls their listing pages. DrawSVG plugin lazy-loaded at route setup (first listing visit). ServicesBlueprint left untouched (0.08 opacity — scrub imperceptible). Please verify on `/blog` and `/projects`: scroll from top → Blueprint strokes draw smoothly. Reduced-motion renders full stroke immediately. Approve to move to Task 7 (SplitText lazy migration)."

---

## Task 7: Move `SplitText` from eager to lazy in `gsap.ts`

**Files:**
- Modify: `src/lib/motion/utils/gsap.ts`
- Modify: `src/lib/motion/utils/gsap.test.ts`
- Modify: `src/lib/motion/actions/wordmarkHover.ts`
- Modify: `src/lib/motion/actions/wordmarkHover.test.ts`

**Rationale:** After Task 4 deletes the Manifesto's SplitText entrance and 17e-2 deleted the BlogDetailHeader + ProjectDetailHeader SplitText entrances, the only remaining SplitText consumer is `wordmarkHover.ts` — used on first hover of the brand wordmark in Nav and Footer. Moving SplitText to lazy saves ~8 KB gzipped from the initial shared bundle. The cost is a tiny first-hover latency (plugin downloads on first wordmark hover), acceptable for a hover-only effect.

- [ ] **Step 1: Add `loadSplitText()` loader to gsap.ts**

Edit `src/lib/motion/utils/gsap.ts`:

1. Remove the eager SplitText import line (after Manifesto's deletion, there are zero remaining eager consumers):

```typescript
// REMOVE:
import { SplitText } from 'gsap/SplitText';
```

2. Remove `SplitText` from the `registerPlugin(...)` call and from the `export { ... }` re-export block.

3. Add a `loadSplitText` async loader mirroring the other lazy loaders:

```typescript
export async function loadSplitText(): Promise<typeof import('gsap/SplitText').SplitText> {
	if (loadedPlugins.has('SplitText')) {
		// Already loaded — retrieve from the registered plugin surface.
		// @ts-expect-error gsap plugin registration runtime shape
		return gsap.plugins.SplitText ?? (await import('gsap/SplitText')).SplitText;
	}
	const mod = await import('gsap/SplitText');
	gsap.registerPlugin(mod.SplitText);
	loadedPlugins.add('SplitText');
	return mod.SplitText;
}
```

Unlike the other `loadXxx()` loaders (which return `Promise<void>` because consumers call `gsap.foo(...)` where plugins are auto-registered on gsap), `loadSplitText` is a constructor that callers instantiate with `new SplitText(...)`. Return the class so callers can destructure:

```typescript
const SplitText = await loadSplitText();
const split = new SplitText(node, { type: 'chars' });
```

If the existing loader signatures return `Promise<void>`, keep this one returning `Promise<typeof SplitText>` as a deliberate departure — document the difference in a block comment.

- [ ] **Step 2: Update `wordmarkHover.ts` to await the loader**

Edit `src/lib/motion/actions/wordmarkHover.ts`:

Before (line ~10):

```typescript
import { registerGsapPlugins, gsap, SplitText } from '../utils/gsap.js';
```

After:

```typescript
import { registerGsapPlugins, gsap, loadSplitText } from '../utils/gsap.js';
```

The function signature is an action — synchronous entry. SplitText needs to load before `new SplitText(...)`. Pattern:

```typescript
export function wordmarkHover(node: HTMLElement, params: WordmarkHoverParams) {
	if (isPrefersReducedMotion() || typeof window === 'undefined') {
		return { destroy() {} };
	}
	registerGsapPlugins();

	let splitInstance: InstanceType<typeof import('gsap/SplitText').SplitText> | null = null;
	let pendingLoad: Promise<void> | null = null;

	pendingLoad = loadSplitText().then((SplitTextClass) => {
		splitInstance = new SplitTextClass(node, { type: 'chars' });
	});

	// Existing effect functions — keep as-is. They reference splitInstance at call time.
	// ... (effectBounce, effectWiggle, etc.) ...

	async function playEffect() {
		if (pendingLoad) await pendingLoad; // await first-time plugin load
		if (isAnimating || !splitInstance) return;
		isAnimating = true;
		// ... existing body ...
	}

	node.addEventListener('mouseenter', playEffect);

	if (params.autoPlay) {
		setTimeout(playEffect, params.autoPlayDelay ?? 500);
	}

	return {
		destroy() {
			node.removeEventListener('mouseenter', playEffect);
			splitInstance?.revert();
		},
	};
}
```

**Important:** First hover will await the plugin module fetch (~50–100ms on good networks). Subsequent hovers are instant (splitInstance is cached). Acceptable trade for shared-bundle shrink.

- [ ] **Step 3: Update `gsap.test.ts`**

Remove any `it('re-exports SplitText', ...)` block, and any `gsap.plugins.SplitText` assertion inside the eager-registration describe. Add:

```typescript
describe('motion/utils/gsap — lazy loaders', () => {
	// ... existing loadDrawSVG, loadMorphSVG, loadFlip, loadCustomEase tests ...

	it('loadSplitText registers SplitText, returns the class, and is idempotent', async () => {
		const SplitTextA = await loadSplitText();
		const SplitTextB = await loadSplitText();
		expect(SplitTextA).toBeDefined();
		expect(typeof SplitTextA).toBe('function');
		expect(SplitTextA).toBe(SplitTextB); // same reference on re-load
	});
});
```

- [ ] **Step 4: Update `wordmarkHover.test.ts`**

The existing tests stub SplitText via `vi.mock('gsap/SplitText', ...)`. The stub likely still works — the module path is unchanged. What changes: the action is now async-internal. Tests that call `playEffect()` or rely on `splitInstance` being synchronously available need to `await` the load.

Update tests:

- Add `await` before simulating mouseenter or `autoPlay` firing
- Where the existing test does `const splitInstance = (gsapMod.SplitText as ...).mock.instances[0]`, may need to `await vi.waitFor(() => expect(...).mock.instances.length > 0)` to allow the dynamic import to resolve

If test pattern is tricky, consider leaving the eager import in place ONLY for `SplitText` (so `wordmarkHover` stays synchronous) and skipping Task 7. Trade-off: ~8 KB in shared bundle. Keep if the async refactor proves too invasive.

**Decision point:** Attempt the async migration first. If `wordmarkHover.test.ts` resists and Yesid's time is better spent elsewhere, defer Task 7 entirely. Document the deferral and move on.

- [ ] **Step 5: Verify `wordmarkHover` behavior on the live site**

```bash
bun run dev
```

Hover over the wordmark "yesid." in the Nav. First hover: minor latency (plugin load), then the first effect plays. Second hover onwards: snappy, no latency. Rotate through all 4 effects (bounce, wiggle, wave, spin) across multiple hovers.

If first-hover latency is unacceptable (> 200ms felt), revert to eager SplitText and defer Task 7.

- [ ] **Step 6: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-3): move SplitText to lazy loading via loadSplitText"
```

Or, if deferred:

```bash
# No commit — Task 7 deferred to a follow-up.
```

STOP. Tell Yesid:
> "Task 7 [done / deferred]: SplitText is now lazy-loaded via `loadSplitText()`; `wordmarkHover` awaits the loader before constructing a SplitText instance. First wordmark hover has ~50ms plugin-fetch latency; subsequent hovers are instant. Initial shared bundle shrinks by ~8 KB gzipped. [If deferred:] Task 7 was too invasive for wordmarkHover's sync action shape; SplitText stays eager; 8 KB stays in the shared bundle; future slice can revisit. Approve to move to Task 8 (SEO DOM-default-state audit)."

---

## Task 8: SEO DOM-default-state audit

**Files:**
- Audit: all Svelte components under `src/lib/components/` and `src/routes/`
- Modify: any file whose scoped `<style>` has `opacity: 0` or `stroke-dashoffset` as an initial state on a scrub target
- Audit-flag (report only, no fix): `SvgIcon.svelte`, `DataFlowDiagram.svelte`, `StackConnections.svelte` existing DrawSVG on-enter entrances

**Rationale:** Design spec §8 rule 1 is absolute: "Every scrub target's initial CSS renders identically to what SSR (and a crawler) produces — full scale, full opacity, full stroke, final text content. JS only applies delta on scroll. Forbidden: `opacity: 0`, `transform: scale(0)`, `stroke-dashoffset: 100%` on scrub targets." After Tasks 4–6, the crescendo and draw-scrub targets must satisfy this rule. Audit and sweep remnants.

- [ ] **Step 1: Grep all scrub-target-relevant seed-CSS patterns**

Run each and classify results:

```bash
echo "=== opacity: 0 in scoped style + CSS files ==="
grep -rn "opacity:\s*0[^.0-9]" src/lib/ src/routes/ src/app.css | grep -v "\.test\.ts" | grep -v "blog-fallbacks"

echo "=== stroke-dashoffset: 100% ==="
grep -rn "stroke-dashoffset:\s*100%\|stroke-dashoffset:\s*[0-9]\{3,\}" src/

echo "=== transform: scale(0) ==="
grep -rn "transform:\s*scale(0[^.0-9)]" src/

echo "=== font-size: 0 (hiding text via sizing) ==="
grep -rn "font-size:\s*0[^.0-9]" src/
```

Classify each hit:

- **On a scrub target** (Manifesto statement, rotated titles, Blueprint paths) → **delete or flip**
- **On a non-scrub decorative / ambient element** (keyframes, particles, state classes) → **keep**
- **On a formerly-entrance element** that now renders statically → **delete the 0 declaration** so the default (1, natural size, dashoffset 0) applies

Common expected hits:

- `src/app.css` pulse/ripple `@keyframes 50% { opacity: 0 }` — keyframe percentage; keep
- `about/AboutWeather.svelte` particle keyframes — ambient; keep
- `routes/+layout.svelte:63` route-transition keyframe `from { opacity: 0 }` — route-level, not scrub; keep (re-audit in 17e-4 or 17e-5 if doctrine-related)
- `routes/tech-stack/+page.svelte:204` `.hero-hidden` — state class for hero load; keep (17e-4 hero scope)
- `blog/BlogDetailHeader.svelte` — most `opacity: 0` should have been swept in 17e-2 Task 6; any remaining seed for the now-deleted entrance gets deleted now

- [ ] **Step 2: Specifically verify Manifesto sub-components**

The ManifestoEdgeTop / Bottom / Left / Right components may hold seed CSS independently of Manifesto.svelte. Check:

```bash
grep -n "opacity:\s*0[^.0-9]" src/lib/components/home/ManifestoEdge*
```

For each hit, determine whether the timeline (deleted in Task 4) was the thing setting the element to opacity 1. If yes, delete the `opacity: 0`.

- [ ] **Step 3: Verify Blueprint paths**

BlogBlueprint and ProjectsBlueprint sub-components (`BlueprintBridge`, `BlueprintTBM`, etc.) — do their paths have a CSS rule like `path { stroke-dashoffset: 100%; }` that acts as a seed? If yes, delete. Default state must be visible stroke (`stroke-dashoffset: 0` or unset).

```bash
grep -rn "stroke-dashoffset\|stroke-dasharray" src/lib/components/svg/transit/ src/lib/components/svg/tunneling/ src/lib/components/svg/azur/ src/lib/components/svg/detail/
```

Should be zero non-zero initial states.

- [ ] **Step 4: Audit-flag existing DrawSVG on-enter entrances (no fix)**

Inspect:

- `src/lib/components/brand/SvgIcon.svelte` — uses `gsap.set(paths, { drawSVG: '0%' })` then `drawSVG: '100%'` on entry
- `src/lib/components/home/DataFlowDiagram.svelte` — same pattern for lines
- `src/lib/components/stack/StackConnections.svelte` — same pattern

These animate on scroll-enter (not scrub). Classification:

- If triggered by `ScrollTrigger` with `onEnter: () => tl.play()`, they violate Snappy Doctrine (entrance on scroll-into-view).
- If triggered by hover or interaction, they're signature 4 (morph hover) and doctrine-compliant.

For 17e-3 Task 8: **audit only**. Read each file, note whether it's on-enter. If yes, add a note to the slice spec's iteration log:

> "Audit finding: `SvgIcon.svelte`, `DataFlowDiagram.svelte`, `StackConnections.svelte` use DrawSVG `onEnter` timelines — doctrine violations. Scope expansion candidate for 17e-3 or a follow-up slice. Not fixed in 17e-3."

Proposing to delay the fix to avoid blowing up scope. Yesid decides whether to promote into 17e-3 or spin a later ticket.

- [ ] **Step 5: View-source SEO verification**

```bash
bun run dev
```

In a new terminal / browser:

```bash
curl -s http://localhost:5173/ | grep -oE 'class="[^"]*rotated-title[^"]*"' | head -3
curl -s http://localhost:5173/ | grep -oE 'class="[^"]*manifesto__statement[^"]*"' | head -3
curl -s http://localhost:5173/blog | grep -oE '<svg[^>]*>' | head -3
```

Expected: every scrub-target element is present in SSR HTML with its content. No `style="opacity:0"` or `stroke-dashoffset:100%` on the rendered HTML.

- [ ] **Step 6: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(slice-17e-3): SEO DOM-default-state audit — remove seed opacity/stroke from scrub targets"
```

STOP. Tell Yesid:
> "Task 8 done: audited every `opacity: 0`, `stroke-dashoffset`, `transform: scale(0)` in the codebase; removed seed CSS on scrub targets (Manifesto sub-components, Blueprint paths). Audit-flagged 3 existing on-enter DrawSVG entrances (SvgIcon, DataFlowDiagram, StackConnections) — recommend addressing in a follow-up. View-source confirms scrub targets render at final state in SSR HTML. Approve to move to Task 9 (verification + bundle-size + push)."

---

## Task 9: Verification sweep, bundle-size delta, push

**Files:**
- Modify: `docs/slices/slice-17e-3-scrub-factories.md` — fill in bundle-size delta + iteration log

- [ ] **Step 1: Grep-zero sweep on deleted patterns**

```bash
echo "=== SplitText eager registration path ==="
grep -rn "gsap/SplitText" src/ | grep -v "loadSplitText\|\.test\.ts"
# Expected: zero — only loadSplitText and test mocks reference gsap/SplitText

echo "=== entrance-timeline patterns in Manifesto ==="
grep -n "tl\.to\|tl\.from\|SplitText" src/lib/components/home/Manifesto.svelte
# Expected: zero

echo "=== use:reveal still zero ==="
grep -rn "use:reveal" src/
# Expected: zero (17e-2 invariant preserved)

echo "=== scrub factory usage appears at expected sites ==="
grep -rn "createCrescendoScrub\|createDrawScrub" src/
# Expected: each factory imported at least in 1 consumer + factory file + test

echo "=== loadDrawSVG usage ==="
grep -rn "loadDrawSVG" src/ | grep -v "gsap\.ts\|gsap\.test\.ts"
# Expected: at least BlogListingPage + ProjectListingPage (+ any ServicesBlueprint consumer if wired)
```

- [ ] **Step 2: Full test suite + type check**

```bash
bun run test 2>&1 | tail -15
bun run check 2>&1 | tail -10
```

Expected: all pass. Approximate test delta from 17e-2 end:

- + 7 createCrescendoScrub tests
- + 7 createDrawScrub tests
- +/- Manifesto.test.ts adjustments
- +/- wordmarkHover.test.ts adjustments (if Task 7 landed)
- +/- gsap.test.ts adjustments (SplitText eager → lazy test swap)

Record the final number. `bun run check` = 0 errors.

- [ ] **Step 3: Bundle-size delta**

```bash
bun run bundle-size
```

Open `dist/stats.html`, record per-route gzipped sizes, fill the delta table in the slice spec.

Expected:

- Shared layout node: **~−8 KB** if SplitText lazy landed (Task 7 shipped); else flat
- Home `/`: **~−1 to −2 KB** — Manifesto entrance code gone, crescendo code added
- Blog + Projects listings: **~+0.3 to +0.5 KB** — DrawSVG loader + scrub call overhead (before DrawSVG plugin lazy-loads on viewport entry; plugin size is off-budget until hit)
- Detail + other routes: near-flat, modest shrink from shared bundle trim

- [ ] **Step 4: Preview full site sanity check**

```bash
bun run dev
```

Walk every route:

- `/` — Manifesto statement + 3 rotated titles scale with scroll; Hero still works; Closer graffiti still animates
- `/blog` — Blueprint draws; filter click triggers FLIP
- `/projects` — Blueprint draws; filter click triggers FLIP
- `/services` — listing renders statically; service detail renders statically
- `/about`, `/contact`, `/tech-stack` — all render statically

No console errors. No regressions elsewhere.

- [ ] **Step 5: Reduced-motion end-to-end check**

Enable reduced-motion via DevTools or OS setting. Reload `/`:

- Manifesto statement visible at final scale, no scrub
- Rotated titles static at final scale
- Blueprint paths fully drawn, no scrub
- Hero scroll pin still works (hero reduced-motion handling is 17e-4 scope; for now, it may still scroll-scrub — that's fine)

- [ ] **Step 6: Update slice spec iteration log**

Edit `docs/slices/slice-17e-3-scrub-factories.md` — add per-task summary like 17e-2's:

```markdown
## Iteration log

- **Task 1 (slice spec):** approved.
- **Task 2 (createCrescendoScrub):** factory + 7 tests. Approved.
- **Task 3 (createDrawScrub):** factory + 7 tests + scrubs barrel. Approved.
- **Task 4 (Manifesto entrance strip + crescendo):** deleted 15-tween timeline, applied crescendo to statement. Approved.
- **Task 5 (rotated label crescendos):** Projects, Services, Terminus. Approved.
- **Task 6 (Blueprint draw-scrubs):** BlogBlueprint + ProjectsBlueprint. ServicesBlueprint deferred (too faint to perceive). Approved.
- **Task 7 (SplitText lazy):** [done / deferred — pick one].
- **Task 8 (SEO DOM-default audit):** seed CSS removed on scrub targets; flagged 3 existing DrawSVG on-enter violations for follow-up.
- **Task 9 (verification):** grep-zero passes; bundle-size delta recorded.
```

- [ ] **Step 7: Commit spec updates**

```bash
git add docs/slices/slice-17e-3-scrub-factories.md
git commit -m "docs(slice-17e-3): iteration log + bundle-size delta"
```

- [ ] **Step 8: Push branch**

```bash
git push -u origin feature/slice-17e-3-scrub-factories
```

STOP. Tell Yesid:
> "17e-3 Scrub Factories tasks complete. Branch `feature/slice-17e-3-scrub-factories` pushed. What was delivered:
>
> 1. `createCrescendoScrub` + `createDrawScrub` sync factories with 14 combined tests.
> 2. Manifesto entire entrance timeline stripped (15 tweens gone); crescendo applied to statement container.
> 3. Crescendo applied to 3 rotated edge titles (Projects / Services / Terminus) — all stay `<h2>`.
> 4. BlogBlueprint + ProjectsBlueprint draw-scrub applied; DrawSVG plugin lazy-loaded at route setup.
> 5. SplitText [lazy / deferred] — [impact on shared bundle].
> 6. SEO DOM-default-state audit — seed CSS removed on scrub targets; 3 unrelated DrawSVG on-enter entrances flagged for follow-up.
>
> Bundle-size delta recorded in slice spec. `bun run test` passes; `bun run check` = 0 errors. Preview-verified desktop + reduced-motion.
>
> Want me to open a PR now, or continue to 17e-4 Hero Timeline next?"

---

## Spec coverage self-check

Every §3.2 / §4.3 / §9.1 item in the design spec maps to a task:

- ✅ Build `createCrescendoScrub` (§4.3 canonical signature) — Task 2
- ✅ Build `createDrawScrub` (§3.2 signature 6) — Task 3
- ✅ Apply crescendo to Manifesto 3-line — Task 4 (via statement container)
- ✅ Apply crescendo to rotated edge titles — Task 5 (all three; D263 included Terminus)
- ✅ Apply draw-scrub to Blueprint SVGs — Task 6 (blog + projects)
- ✅ Enforce SEO DOM-default-state rule — Task 8
- ✅ MorphSVG + SplitText lazy — Task 7 (SplitText; MorphSVG was already lazy via 17e-1 + 17e-2 paths)
- ✅ Bundle-size delta reported — Task 9

**Deferred (correctly):**

- `createCloserTimeline` — doctrine exception, 17e-4 bundles with hero work
- Hero timeline rewrite, MetroNetwork inline — 17e-4
- `heroScrollLock.ts` deletion — 17e-4 (D264)
- `morphHelpers.ts` → `actions/morphHover.ts` — 17e-5
- LED pulse consolidation, RAF consolidation — 17e-5
- MOTION.md v2.0 + CONSTITUTION.md Snappy Doctrine section + learning docs — 17e-6
- Circuit-grid draw-scrub — reinterpreted (CSS pattern, not SVG); the static-visible state is now enforced by the audit in Task 8
- Audit-flagged DrawSVG on-enter violations (SvgIcon, DataFlowDiagram, StackConnections) — recommend follow-up; not in 17e-3 scope

---

## Definition of done (17e-3)

- All 9 tasks approved by Yesid
- `bun run test` — all pass (factory tests + preserved baseline)
- `bun run check` — 0 errors
- Manifesto + 3 rotated titles + both Blueprints visibly scrub with scroll
- View-source confirms SSR renders scrub targets at final state
- Reduced-motion end-to-end: targets render at final state, no scroll animation
- Bundle-size delta recorded
- Branch pushed
- Ready for PR, or session continues to 17e-4
