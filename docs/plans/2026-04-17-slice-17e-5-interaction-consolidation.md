# Slice 17e-5 Interaction Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize interaction and ambient motion. Promote `morphHelpers.ts` into a proper `use:morphHover` Svelte action (per D267 E2 — first-class action alongside `boop` / `cursorGlow` / `magnetic`). Consolidate 4× LED-pulse keyframes into one global `.led-pulse` utility. Migrate all ambient JS loops (typewriter type-sequence, `ManifestoCanvas`, `ReadingProgressBar`, Manifesto countdown) off independent `setInterval` / `requestAnimationFrame` onto the shared `ticker.ts` from 17e-1 with `IntersectionObserver`-gated offscreen pause. Clean up the two remaining post-D266 reveal violations flagged in 17e-3 Task 8 (`SvgIcon.animateStagger`, `StackScenarioCard.svelte:43`). After 17e-5, the site has one RAF loop (the shared ticker), one `.led-pulse` keyframe, one `use:morphHover` API, and every ambient loop pauses when offscreen.

**Architecture:** Actions + scrubs + one shared ambient loop. All interaction signatures are Svelte actions with a uniform destroy-returning shape. `ticker.ts` (from 17e-1) becomes the single `gsap.ticker.add` callback that fans out to subscribers; each consumer registers/unregisters via `subscribe(id, fn)` and wraps its subscription in an IntersectionObserver so it pauses when the owner element is off-screen. Decisions: D266 (drawing motion OK on enter), D267 (E2 morphHover action, F delete fade-ups, G2 no ripple restore).

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom), GSAP + MorphSVG (lazy per 17e-1), shared `gsap.ticker` (from 17e-1), IntersectionObserver (native browser).

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§3.1 signature 4 — SVG morph hover; §3.3 signature 9 — typewriter idle; §4.2 shared ticker contract; §4.4 `morphHelpers.ts` absorbed; §4.6 ambient duplication consolidation; §6.4 animation runtime rules — max 1 RAF loop site-wide; §9.1 sub-slice scope)

**Branch:** `feature/slice-17e-56-close-motion` (combined 17e-5 + 17e-6; branched from `main` at `6d9ca3e`). 17e-5 and 17e-6 ship in ONE PR per the 2026-04-17 workflow rule — the bundle-shrink claim from 17e-5 stream 3 is verifiable only by the 17e-6 Lighthouse audit, so splitting them adds no value.

**Depends on:** 17e-1 (shared `ticker.ts`, lazy `loadMorphSVG`), 17e-4 (typewriter cursor blink already CSS). Hard dep on 17e-4 PR merge (done, `b6e3a57`).

**Blocks:** Nothing independently — this sub-slice's close-out is 17e-6, which ships in the same PR.

**Estimated sessions:** 1 (17e-5) + 0.5–1 (17e-6) = one multi-block session, 1 PR.

---

## 🔀 Combined-PR workflow (2026-04-17 rule)

17e-5 and 17e-6 share branch `feature/slice-17e-56-close-motion`. Task 10 (verification) does NOT push — it stays on the branch and continues directly into 17e-6. The single PR opens after 17e-6 Task 8. The closing `handoff-slice-17e.md` covers both sub-slices + full-slice retrospective (no separate 17e-5 handoff). Design spec amendments, checkpoint bump, tree.txt regen, and learning docs all ride in this one PR.

---

## File Structure

### Created

| File | Purpose |
|---|---|
| `src/lib/motion/actions/morphHover.ts` | Svelte action `use:morphHover={{ shapes, lastShapeIdx?, enabled? }}` — new, imports `convertSvgToMorphPaths` from `motion/utils/morphHelpers` |
| `src/lib/motion/actions/morphHover.test.ts` | Unit tests (shape cycling, reduced-motion, mobile-gate, destroy) |
| `docs/slices/slice-17e-5-interaction-consolidation.md` | Narrow slice spec |

### Deleted

_(Plan-audit correction 2026-04-17): `morphHelpers.ts` is NOT deleted — `SvgIcon.svelte` also consumes `convertSvgToMorphPaths` for its D266-compatible `animateMorph` entrance. The helper stays in `motion/utils/morphHelpers.ts` and both the new `morphHover` action and SvgIcon import from it._

_(Plan-audit correction): No `SvgIcon.animateStagger` caller in the codebase (searched), so Task 8 deletion of `animateStagger` is a clean cut — no consumer needs updating._

### Modified

| File | Change |
|---|---|
| `src/lib/motion/actions/index.ts` | Re-export `morphHover` + `MorphHoverParams` type |
| `src/lib/components/home/HomeServices.svelte` | Replace manual `cardPaths[]` / `cardOriginals[]` state + `handleCardEnter/Leave/Tap` + manual `gsap.to(..., { morphSVG })` calls with `use:morphHover={{ shapes: SHAPES, enabled: cardReady }}` on each SVG panel. Keep the SVG-fetch logic (inline injection after mount). Remove eager `registerGsapPlugins()` call at `onMount` — `morphHover` lazy-loads MorphSVG on first hover. |
| `src/lib/components/brand/SvgIcon.svelte` | **Delete `animateStagger` function + switch case** (D267 F — fade-up reveal violation). Keep `animateDraw`, `animateDrawFill`, `animateMorph`. Also migrate eager `registerGsapPlugins()` to `await loadDrawSVG()` + `await loadMorphSVG()` (Task 9). |
| `src/lib/components/stack/StackScenarioCard.svelte` | Delete lines 39–47 (`onMount` `gsap.fromTo(cardEl, { y: 30, opacity: 0 }, ...)`) and the `cardEl` binding + `gsap` + `isPrefersReducedMotion` imports if unused after removal (D267 F). |
| `src/lib/components/home/Manifesto.svelte` | Gate the `countdownInterval` `setInterval` on Manifesto-section visibility via IntersectionObserver |
| `src/lib/components/home/ManifestoCanvas.svelte` | Migrate always-on `requestAnimationFrame` to shared `subscribe(id, fn)`; add IntersectionObserver offscreen pause |
| `src/lib/components/layout/ReadingProgressBar.svelte` | Migrate from `requestAnimationFrame` to shared `subscribe(id, fn)`; no IO gate (always relevant while on article route) |
| `src/lib/components/about/AboutTrain.svelte` | Migrate always-on `requestAnimationFrame` (audited, line 85) to shared `subscribe(id, fn)`; add IntersectionObserver offscreen pause |
| `src/lib/components/about/AboutTestimonials.svelte` | Gate the testimonial carousel `setInterval` (line 32) on section visibility via IntersectionObserver |
| `src/lib/motion/utils/heroTypewriter.ts` | Migrate type-sequence `setInterval` → shared ticker `subscribe(id, fn)` with time-based progression. (Cursor blink is already CSS from 17e-4.) |
| `src/lib/components/home/ManifestoEdgeBottom.svelte` | Delete scoped `@keyframes pulse` (lines 116–120) and point `.manifesto__status-dot` at the existing global `pulse-glow` keyframe in `app.css:240`. One consumer, one file. |
| `src/lib/motion/utils/gsap.ts` | Add `loadMotionPathPlugin()` + `loadSplitText()` lazy loaders. Remove eager plugin imports (DrawSVG, MorphSVG, CustomEase, Flip, MotionPath) after consumer migration. Rename `registerGsapPlugins()` → `initScrollTriggerConfig()` — keeps only the `ScrollTrigger.config({ignoreMobileResize:true})` side-effect; no plugin calls. `ScrollTrigger` stays eager (site-wide). `SplitText` may stay eager if `wordmarkHover` sync-coupling can't be untangled — documented at Task 9. |
| Consumers of `registerGsapPlugins()` | Migrate to `await loadX()` at mount for each plugin actually used. Remove `registerGsapPlugins()` plugin-registration calls. See Task 9 for the full consumer list. |
| `+layout.svelte` | Replace `registerGsapPlugins()` with `initScrollTriggerConfig()`. Remove stale "Desktop: Lenis smooth scroll / Mobile: normalizeScroll" comment at line 24 (normalizeScroll was removed in 17e-1). |
| `src/lib/components/home/HeroBanner.svelte` | Remove stale "Mobile: normalizeScroll + scrub:0.5" comment at line 16. Migrate `registerGsapPlugins()` → `initScrollTriggerConfig()`. |

### Not touched (correctly deferred)

- **Ripple click feedback** — G2 decision, stays cut. Doctrine vocabulary stays at 9 signatures.
- **CloserGraffiti factory rebuild** — optional polish, not required by design spec §9.1 for 17e-5.
- **Cursor-blink stream 2 per handoff §13**: Plan-audit 2026-04-17 found only 2 cursor blinks in codebase total — typewriter (already CSS in 17e-4) and `TerminalCursor.svelte` (already uses global `@keyframes blink` in `app.css:235`). Design spec §4.6's "3 cursor-blink implementations" count appears stale. Stream 2 is effectively null — documented in handoff.
- **`motion/stores/scroll.ts` RAF** (line 25) — infrastructure, tied to scroll-position store backing scroll-linked UI. Not a per-component ambient loop; leaving as-is unless Task 9 bundle delta surfaces a reason to migrate.
- **MOTION.md v2.0 rewrite** — 17e-6.
- **Lighthouse audits** — 17e-6.

---

## Task 1: Write slice spec for 17e-5

**Files:**
- Create: `docs/slices/slice-17e-5-interaction-consolidation.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-5-interaction-consolidation.md`:

```markdown
# Slice 17e-5 — Interaction Consolidation

**Status:** In progress
**Branch:** `feature/slice-17e-56-close-motion` (combined 17e-5 + 17e-6 PR)
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-5-interaction-consolidation.md`
**Depends on:** 17e-1 (shared ticker, lazy loaders), 17e-4 (typewriter cursor blink CSS)
**Blocks:** 17e-6 ships on the same branch; together they close Slice 17e.

## What

Introduce a first-class `use:morphHover` action (signature 4). Consolidate one scoped pulse keyframe into canonical global `pulse-glow`. Migrate all ambient JS loops onto the shared `ticker.ts` with IntersectionObserver offscreen pause. Delete two remaining post-D266 reveal violations. Finish D269 lazy plugin migration and delete eager GSAP imports.

## Outcomes

1. `src/lib/motion/actions/morphHover.ts` exports a Svelte action with uniform shape: `(node, params) => { destroy }`. `MorphSVG` plugin lazy-loaded on first hover via `loadMorphSVG()`. Mobile tap toggle. Reduced-motion no-op.
2. `HomeServices.svelte` uses `use:morphHover={{ shapes: SHAPES, ... }}` on each SVG panel. `cardPaths[]` / `cardOriginals[]` / `handleCardEnter/Leave/Tap` manual wiring is gone.
3. `src/lib/motion/utils/morphHelpers.ts` KEPT (SvgIcon is a second consumer). Barrel re-export retained.
4. `ManifestoEdgeBottom.svelte` scoped `@keyframes pulse` deleted; `.manifesto__status-dot` now uses canonical global `pulse-glow`.
5. Typewriter type-sequence `setInterval` migrates to shared `ticker.subscribe()` — time-based progression via `deltaTime`.
6. `ManifestoCanvas`, `ReadingProgressBar`, `AboutTrain` always-on RAFs migrate to shared `ticker.subscribe()`. ManifestoCanvas + AboutTrain add IntersectionObserver offscreen pause; ReadingProgressBar runs always on article routes (no gate).
7. Manifesto countdown + AboutTestimonials carousel IntersectionObserver-gated — start on section enter, stop on exit.
8. `SvgIcon.animateStagger` function + switch case deleted (D267 F). `StackScenarioCard`'s `onMount` `gsap.fromTo({ y: 30, opacity: 0 }, ...)` deleted (D267 F).
9. `registerGsapPlugins()` renamed → `initScrollTriggerConfig()`. Only `ScrollTrigger.config({ignoreMobileResize:true})` as the side-effect. Eager plugin imports for MotionPath, DrawSVG, CustomEase, MorphSVG, Flip deleted from `gsap.ts`. New `loadMotionPathPlugin()` + `loadSplitText()` loaders added. All 9 consumer sites migrated (SplitText remains eager, documented, blocked by wordmarkHover sync-coupling).
10. Stale `normalizeScroll` comments at `+layout.svelte:24` and `HeroBanner.svelte:16` removed.
11. `bun run test` + `bun run check` pass. One RAF loop site-wide (shared ticker). Bundle: home `/` gzipped shrinks 3–8 KB vs 17e-4 end.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] `grep -rn "registerGsapPlugins" src/` returns 0 matches outside tests
- [ ] `grep -rn "@keyframes pulse\b\|@keyframes led-pulse\b" src/` — 0 matches outside `app.css`
- [ ] `grep -rn "animateStagger" src/` — 0 matches
- [ ] `grep -n "gsap\.fromTo.*opacity" src/lib/components/stack/StackScenarioCard.svelte` — 0 matches
- [ ] `grep -rn "use:morphHover" src/` — at least HomeServices
- [ ] `grep -rn "requestAnimationFrame" src/lib/` — only `ticker.ts`, `motion/stores/scroll.ts` (infra), and the one-shot call in `createHeroTimeline.ts:309`
- [ ] `grep -rn "normalizeScroll" src/` — 0 matches outside `.test.` files
- [ ] HomeServices SVG-panel hover-morph works (desktop hover + mobile tap); reduced-motion static
- [ ] Manifesto countdown + AboutTestimonials pause when their sections are offscreen
- [ ] Bundle-size delta recorded vs 17e-4 end (target: home `/` -3 to -8 KB gzipped)

## Non-goals

- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits (17e-6)
- Ripple restore (G2 — stays cut)
- CloserGraffiti factory rebuild (optional, out of scope)
- `SplitText` async migration (blocked by wordmarkHover sync-coupling; future slice)
- `motion/stores/scroll.ts` RAF migration (infrastructure; revisit if bundle audit flags it)
- Cursor-blink stream 2 (plan-audit confirmed nothing to migrate; already canonical)

## Iteration log

(Fill in per task as the session progresses.)
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-5-interaction-consolidation.md
git commit -m "docs(slice-17e-5): slice spec for interaction consolidation"
```

STOP. Tell Yesid:
> "Wrote the 17e-5 slice spec. Approve before I start building the morphHover action."

---

## Task 2: Build `actions/morphHover.ts` (promote from morphHelpers) — TDD

**Files:**
- Create: `src/lib/motion/actions/morphHover.ts`
- Create: `src/lib/motion/actions/morphHover.test.ts`
- Modify: `src/lib/motion/actions/index.ts` — add export

**Rationale:** D267 E2. morphHover is signature 4 of the 9-signature vocabulary. Should be a Svelte action with the uniform `(node, params) => { destroy }` shape, not a utility + manual wiring. Caller passes shape set + optional initial index + optional enabled flag (to defer until SVG content is ready).

- [ ] **Step 1: Read current `morphHelpers.ts`**

```bash
cat src/lib/motion/utils/morphHelpers.ts
```

Confirmed shape (plan-audit 2026-04-17):
- `convertSvgToMorphPaths(container: SVGElement)` — returns `{ paths: SVGPathElement[], originals: string[] }`. Uses `MorphSVGPlugin.convertToPath(el)[0]` to coerce non-path shape elements (circle/rect/ellipse/line/polyline/polygon) into real `<path>` elements. Originals are the `d` attribute strings post-conversion.

**Plan-audit correction:** keep `morphHelpers.ts` in place. `SvgIcon.svelte:14` also consumes this helper for its D266-compatible `animateMorph` (kept after 17e-5 Task 8). Not deleted — `morphHover` action imports from it.

- [ ] **Step 2: Audit HomeServices' current morph API**

Read `HomeServices.svelte` lines 30–104 to understand what the component currently does:
- Tracks `cardPaths[]`, `cardOriginals[]`, `cardReady[]`, `activeMorphIndex`, `lastShapeIdx`.
- `handleCardEnter(i)` / `handleCardLeave(i)` / `handleSvgTap(e, i)` — handle hover, leave, mobile tap.
- Calls `gsap.to(paths, { morphSVG: SHAPES[shape], ... })`.

The new `use:morphHover` action must cover:
- Hover (desktop) → cycle to a new random shape
- Leave (desktop) → return to original
- Tap (mobile) → toggle morph / unmorph
- Reduced-motion → no-op (renders primary shape only per §5.3 row)
- Deferred-enablement — SVG content loads asynchronously (HomeServices fetches + injects), so the action shouldn't try to morph before paths are ready

- [ ] **Step 3: Write test first (RED)**

Create `src/lib/motion/actions/morphHover.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { morphHover } from './morphHover.js';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

vi.mock('$lib/motion/stores/reducedMotion.js', async (importOriginal) => {
  const mod = (await importOriginal()) as typeof import('$lib/motion/stores/reducedMotion.js');
  return {
    ...mod,
    isPrefersReducedMotion: vi.fn(() => false),
  };
});

describe('motion/actions/morphHover', () => {
  let node: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    (isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);
    node = document.createElement('div');
    document.body.append(node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an action object with destroy', () => {
    const result = morphHover(node, { shapes: { a: 'M0 0 L10 10' } });
    expect(typeof result.destroy).toBe('function');
    result.destroy();
  });

  it('reduced-motion: returns a no-op destroy, does not attach listeners', () => {
    (isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const addSpy = vi.spyOn(node, 'addEventListener');
    const result = morphHover(node, { shapes: { a: 'M0 0' } });
    expect(addSpy).not.toHaveBeenCalled();
    expect(() => result.destroy()).not.toThrow();
  });

  it('attaches mouseenter + mouseleave listeners by default', () => {
    const addSpy = vi.spyOn(node, 'addEventListener');
    const result = morphHover(node, { shapes: { a: 'M0 0' } });
    const events = addSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('mouseenter');
    expect(events).toContain('mouseleave');
    result.destroy();
  });

  it('destroy removes listeners', () => {
    const removeSpy = vi.spyOn(node, 'removeEventListener');
    const result = morphHover(node, { shapes: { a: 'M0 0' } });
    result.destroy();
    const events = removeSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('mouseenter');
    expect(events).toContain('mouseleave');
  });

  it('update() accepts new shape set without throwing', () => {
    const result = morphHover(node, { shapes: { a: 'M0 0' } });
    if (result.update) {
      expect(() => result.update({ shapes: { b: 'M5 5' } })).not.toThrow();
    }
    result.destroy();
  });
});
```

- [ ] **Step 4: Run test — should FAIL**

```bash
bun run test -- src/lib/motion/actions/morphHover.test.ts
```

Expected: FAIL on import.

- [ ] **Step 5: Create `morphHover.ts`**

```typescript
// use:morphHover — SVG path morphing on hover/tap.
// Signature 4 in the design spec's 9-signature vocabulary.
//
// On desktop hover: paths morph to a random shape from `shapes`.
// On mouseleave: paths morph back to the original `d` attribute values.
// On mobile tap: paths toggle between morphed and original.
// Reduced-motion: no-op (paths stay at their primary shape).
//
// MorphSVG plugin is lazy-loaded on first hover via loadMorphSVG().
// The node passed to the action should be the SVG root or a clickable parent
// that contains <path> elements to morph.

import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap, loadMorphSVG } from '$lib/motion/utils/gsap.js';
import { convertSvgToMorphPaths } from '$lib/motion/utils/morphHelpers.js';

export interface MorphHoverParams {
  /** Record of shape-name → SVG path `d` string. Used as the morph target pool. */
  shapes: Record<string, string>;
  /** If false, listeners are attached but morphs are no-ops (use when SVG content isn't ready yet). Default: true */
  enabled?: boolean;
  /** Optional — supply a deterministic starting shape index rather than random. */
  lastShapeIdx?: number;
}

export function morphHover(node: HTMLElement, params: MorphHoverParams) {
  if (isPrefersReducedMotion()) {
    return { destroy() {} };
  }

  let currentParams = params;
  let morphed = false;
  let paths: SVGPathElement[] = [];
  let originals: string[] = [];
  let lastIdx = params.lastShapeIdx ?? -1;
  let pluginLoaded = false;

  async function ensurePluginAndPaths() {
    if (!pluginLoaded) {
      await loadMorphSVG();
      pluginLoaded = true;
    }
    if (paths.length === 0) {
      // Find SVG root (may be the node itself or a child — SVG may have been
      // injected post-mount for async-fetched content like HomeServices).
      const svg = node.querySelector('svg') ?? (node as unknown as SVGElement);
      if (!(svg instanceof SVGElement)) return;
      const { paths: p, originals: o } = convertSvgToMorphPaths(svg);
      paths = p;
      originals = o;
    }
  }

  function pickRandomShape(): { key: string; idx: number } {
    const keys = Object.keys(currentParams.shapes);
    if (keys.length === 0) return { key: '', idx: -1 };
    let idx: number;
    do {
      idx = Math.floor(Math.random() * keys.length);
    } while (idx === lastIdx && keys.length > 1);
    lastIdx = idx;
    return { key: keys[idx], idx };
  }

  async function handleEnter() {
    if (currentParams.enabled === false) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

    await ensurePluginAndPaths();
    if (paths.length === 0) return;

    const { key } = pickRandomShape();
    if (!key) return;
    paths.forEach((p) => gsap.killTweensOf(p));
    gsap.to(paths, {
      morphSVG: currentParams.shapes[key],
      duration: 0.4,
      stagger: 0.03,
      ease: 'power2.inOut',
      overwrite: true,
    });
    morphed = true;
  }

  function handleLeave() {
    if (currentParams.enabled === false) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;
    if (paths.length === 0 || originals.length === 0) return;
    paths.forEach((path, i) => {
      gsap.killTweensOf(path);
      gsap.to(path, {
        morphSVG: originals[i],
        duration: 0.4,
        delay: i * 0.03,
        ease: 'power2.inOut',
        overwrite: true,
      });
    });
    morphed = false;
  }

  async function handleTap(e: Event) {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) return;
    if (currentParams.enabled === false) return;
    e.preventDefault();
    e.stopPropagation();

    await ensurePluginAndPaths();
    if (paths.length === 0) return;

    if (morphed) {
      handleLeave();
    } else {
      handleEnter();
    }
  }

  node.addEventListener('mouseenter', handleEnter);
  node.addEventListener('mouseleave', handleLeave);
  node.addEventListener('click', handleTap);

  return {
    update(newParams: MorphHoverParams) {
      currentParams = newParams;
    },
    destroy() {
      node.removeEventListener('mouseenter', handleEnter);
      node.removeEventListener('mouseleave', handleLeave);
      node.removeEventListener('click', handleTap);
    },
  };
}
```

Note: `convertSvgToMorphPaths` imported from `motion/utils/morphHelpers.ts` (not duplicated — SvgIcon also consumes it).

- [ ] **Step 6: Run test — expect GREEN**

```bash
bun run test -- src/lib/motion/actions/morphHover.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 7: Add to actions barrel**

Edit `src/lib/motion/actions/index.ts`:

```typescript
export { morphHover, type MorphHoverParams } from './morphHover.js';
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/motion/actions/morphHover.ts src/lib/motion/actions/morphHover.test.ts src/lib/motion/actions/index.ts
git commit -m "feat(slice-17e-5): add use:morphHover action (signature 4)"
```

STOP. Tell Yesid:
> "Task 2 done: `use:morphHover` action built with 5 tests. Lazy-loads MorphSVG plugin on first hover. Mobile-gated (tap toggles instead). Reduced-motion no-op. `convertSvgToMorphPaths` helper absorbed. Approve to move to Task 3 (migrate HomeServices + delete morphHelpers.ts)."

---

## Task 3: Migrate HomeServices to `use:morphHover` (morphHelpers stays)

**Files:**
- Modify: `src/lib/components/home/HomeServices.svelte`

_(Plan-audit 2026-04-17: `morphHelpers.ts` + its test stay in place — SvgIcon is a second consumer. Barrel re-export also stays. Only HomeServices migrates in this task.)_

- [ ] **Step 1: ProjectCard audit — confirm no morphSVG consumer**

```bash
grep -n "morphSVG\|morphHelpers" src/lib/components/projects/ProjectCard.svelte
```

Expected: 0 matches. The hover effect in ProjectCard is a gradient-image color transition driven by CSS, not a path morph. Nothing to migrate here. Skip.

- [ ] **Step 2: Rewrite HomeServices.svelte to use `use:morphHover`**

Read current state:
```bash
cat src/lib/components/home/HomeServices.svelte | head -200
```

The refactor:
- Delete `cardPaths[]`, `cardOriginals[]`, `cardReady[]`, `activeMorphIndex`, `lastShapeIdx` state.
- Delete `handleCardEnter`, `handleCardLeave`, `handleSvgTap` functions.
- Delete the manual `gsap.to(paths, { morphSVG: ... })` calls inside them.
- Delete the `convertSvgToMorphPaths` + `pickRandomShape` imports (neither needed in the parent after migration — `morphHover` handles both).
- Delete the eager `registerGsapPlugins()` call in `onMount` — `morphHover` lazy-loads MorphSVG on first hover.
- Keep the SVG fetch-and-inject logic in `onMount` (SVG content still loads asynchronously).
- Introduce a simple `svgReady[]: boolean[]` reactive state (one flag per service) flipped to `true` after each fetch+inject completes.
- On each SVG panel element: `use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}` — the action's `enabled` gate defers path conversion until SVG is injected.
- Remove `onmouseenter`/`onmouseleave` handlers on the `<a>` wrapper — the `use:morphHover` on the panel handles morph; card border glow (if any) is CSS-driven via `:hover` / `group-hover`.

New shape for each panel in the template (the `<button data-testid="services-svg-panel">` already has `use:morphHover` wired):
```svelte
<button
  data-testid="services-svg-panel"
  class="svg-panel ..."
  use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}
>
  <div class="svg-inline-wrapper" style="width:56px;height:56px;">
    <!-- SVG injected by onMount fetch -->
  </div>
</button>
```

- [ ] **Step 3: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: all tests pass. HomeServices tests (if any) may need updating if they asserted on `handleCardEnter`/`cardPaths`.

- [ ] **Step 4: Preview-verify HomeServices hover**

Yesid verifies on `http://localhost:5173/` Services grid: hover each card's SVG panel → expect morph; leave → expect unmorph. Mobile (DevTools): tap the panel → expect morph/unmorph toggle. Reduced-motion: no morph, primary shape static.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-5): migrate HomeServices to use:morphHover action"
```

STOP. Tell Yesid:
> "Task 3 done: HomeServices uses `use:morphHover`. `morphHelpers.ts` kept (SvgIcon also consumes it). Please verify on `/` Services grid: hover cards → shapes morph; leave → unmorph; mobile tap → toggle. Approve to move to Task 4 (pulse consolidation)."

---

## Task 4: Consolidate ManifestoEdgeBottom pulse into global `pulse-glow`

**Files:**
- Modify: `src/lib/components/home/ManifestoEdgeBottom.svelte`

**Rationale (plan-audit correction 2026-04-17):** Design spec §4.6 claimed 4 duplicate pulse keyframes. Actual audit found **one** scoped duplicate (`ManifestoEdgeBottom.svelte:116 @keyframes pulse`). `app.css:240 @keyframes pulse-glow` is already the global canonical (consumed by `StopLabel`, `MetricDisplay`). `station-ping` (app.css:251) and `bridge-pulse` (StackNode.svelte:140) are different mechanisms (scale ping, scale pulse — not opacity duplicates). No `InfraFrame` / `tech-stack +page.svelte` / `AboutPage` children pulse consumers exist. No `.led-pulse` utility needed — `pulse-glow` is the canonical name.

- [ ] **Step 1: Audit confirmed**

```bash
grep -rn "@keyframes pulse\|@keyframes led-pulse\|@keyframes pulse-glow" src/
```

Expected (confirmed 2026-04-17):
- `src/app.css:240 @keyframes pulse-glow` — canonical, keep.
- `src/lib/components/home/ManifestoEdgeBottom.svelte:116 @keyframes pulse` — DELETE.

- [ ] **Step 2: Update `.manifesto__status-dot` to use global `pulse-glow`**

In `src/lib/components/home/ManifestoEdgeBottom.svelte`:
- Delete lines 116–120 (the scoped `@keyframes pulse { ... }` block).
- Change line 113's `animation: pulse 2s ease-in-out infinite;` → `animation: pulse-glow 2s ease-in-out infinite;`.
- Visual delta: `pulse-glow` curves `opacity 1 → 0.7` + animates `box-shadow`; scoped `pulse` was `opacity 0.3 → 1` + simpler box-shadow. The dot will feel slightly brighter at its dim state (0.7 vs 0.3) and slightly more orange-glow at its peak. Yesid to judge at STOP.

Reduced-motion guard already present (line 132): `.manifesto__status-dot { animation: none; opacity: 1; }` — stays.

- [ ] **Step 3: Verify grep-zero**

```bash
grep -rn "@keyframes pulse\b\|@keyframes led-pulse\b" src/ | grep -v "src/app.css"
```

Expected: 0 matches. (`bridge-pulse` and `station-ping` intentionally excluded from this consolidation — different mechanisms.)

- [ ] **Step 4: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: 0 errors. ManifestoEdgeBottom tests (if any) unaffected — the change is CSS-only.

- [ ] **Step 5: Preview-verify**

Yesid verifies on `http://localhost:5173/`: Manifesto section's status dot still pulses (now using the canonical `pulse-glow` curve — slightly brighter at the dim state). If the look drifts too far, we can tune `pulse-glow` itself or add `.manifesto-pulse` as a variant. But prefer using the canonical as-is.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/home/ManifestoEdgeBottom.svelte
git commit -m "refactor(slice-17e-5): consolidate ManifestoEdgeBottom pulse into global pulse-glow"
```

STOP. Tell Yesid:
> "Task 4 done: scoped `@keyframes pulse` in ManifestoEdgeBottom deleted; `.manifesto__status-dot` now uses global `pulse-glow`. Audit found only 1 duplicate to consolidate (not 4 as spec claimed). Please verify status dot still pulses correctly on `/` Manifesto. Approve to move to Task 5 (typewriter type-sequence → shared ticker)."

---

## Task 5: Migrate typewriter type-sequence to shared ticker

**Files:**
- Modify: `src/lib/motion/utils/heroTypewriter.ts`

**Rationale:** Design spec §4.2 + §6.4 rule 7: shared `gsap.ticker` — no component may start its own RAF/setInterval. 17e-4 migrated the cursor blink to CSS. This task migrates the character-by-character type-sequence from `setInterval` to `subscribe(id, fn)` on the shared ticker with time-based progression.

- [ ] **Step 1: Read `heroTypewriter.ts` current shape**

```bash
cat src/lib/motion/utils/heroTypewriter.ts
```

Identify the type-sequence mechanism (likely something like `setInterval(() => appendNextChar(), 50)`).

- [ ] **Step 2: Refactor to use `subscribe`**

Replace `setInterval` with a subscription that tracks elapsed time and advances only when enough time has passed:

```typescript
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';

export function initHeroTypewriter(target: HTMLElement, text: string, speedMs = 50): { type: () => Promise<void>, destroy: () => void } {
  let accum = 0;
  let charIdx = 0;
  const SUBSCRIPTION_ID = `typewriter:${Math.random().toString(36).slice(2)}`;
  let onDone: (() => void) | null = null;

  function tick(_time: number, deltaTime: number) {
    accum += deltaTime; // seconds in gsap.ticker (verify in ticker.ts docs)
    const neededSec = speedMs / 1000;
    while (accum >= neededSec && charIdx < text.length) {
      accum -= neededSec;
      target.textContent = (target.textContent ?? '') + text[charIdx];
      charIdx++;
    }
    if (charIdx >= text.length) {
      unsubscribe(SUBSCRIPTION_ID);
      onDone?.();
    }
  }

  return {
    type(): Promise<void> {
      return new Promise((resolve) => {
        onDone = resolve;
        subscribe(SUBSCRIPTION_ID, tick);
      });
    },
    destroy() {
      unsubscribe(SUBSCRIPTION_ID);
    },
  };
}
```

Preserve the existing export API shape so HeroBanner's wiring doesn't need changes.

**Note:** gsap.ticker's deltaTime is in seconds per the 17e-1 plan's ticker.ts — verify by re-reading `motion/utils/ticker.ts` + its comment. If it's milliseconds, adjust the `neededSec` math accordingly.

- [ ] **Step 3: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: 0 errors. `heroTypewriter` unit tests (if any) still pass — they assert on API shape + sequence completion, not on the underlying mechanism.

- [ ] **Step 4: Preview-verify**

```bash
bun run dev
```

Load `/`. Watch typewriter play — characters appear at consistent pace; cursor blinks via CSS (17e-4). If the type-sequence feels too fast/slow, tune `speedMs` at the consumer.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/utils/heroTypewriter.ts
git commit -m "refactor(slice-17e-5): typewriter type-sequence on shared gsap.ticker"
```

STOP. Tell Yesid:
> "Task 5 done: typewriter type-sequence uses shared ticker instead of `setInterval`. Cursor blink stays CSS (17e-4). Please verify typewriter plays at correct pace on `/`. Approve to move to Task 6 (ManifestoCanvas + ReadingProgressBar RAF → shared ticker + IntersectionObserver)."

---

## Task 6: Migrate ManifestoCanvas + ReadingProgressBar + AboutTrain to shared ticker + IntersectionObserver

**Files:**
- Modify: `src/lib/components/home/ManifestoCanvas.svelte`
- Modify: `src/lib/components/layout/ReadingProgressBar.svelte`
- Modify: `src/lib/components/about/AboutTrain.svelte` (plan-audit addition — always-on RAF at line 85)

**Rationale:** Design spec §4.6 + §6.4 rule 5: all idle RAF loops gated by IntersectionObserver; pause when offscreen. `ManifestoCanvas` does a canvas repaint every frame (heavy). `ReadingProgressBar` updates progress-bar width on scroll (cheap but still a RAF). `AboutTrain` animates a train crossing the /about page; its RAF should also IO-gate.

_(Plan-audit note: `motion/stores/scroll.ts:25` has a RAF but is a shared scroll-position store used across multiple components — not a per-component ambient loop. Leaving as-is. If Task 9's bundle measurement or DevTools-Performance shows it as a hot path, revisit. But the store gates itself on scroll events, not always-on.)_

- [ ] **Step 1: Audit current RAF use**

```bash
grep -n "requestAnimationFrame\|cancelAnimationFrame" src/lib/components/home/ManifestoCanvas.svelte src/lib/components/layout/ReadingProgressBar.svelte
```

Identify the existing loop's body: what does it do, what does it read, what does it write?

- [ ] **Step 2: ManifestoCanvas migration**

Replace `requestAnimationFrame` recursion with:

```typescript
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';
import { onMount, onDestroy } from 'svelte';

let observer: IntersectionObserver | null = null;
let isVisible = false;
const SUBSCRIPTION_ID = 'manifesto-canvas';

function paintFrame(_time: number, _dt: number) {
  if (!isVisible) return;
  // ... existing canvas-paint logic ...
}

onMount(() => {
  if (!sectionEl) return;
  observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
    },
    { rootMargin: '50px' }, // small margin so painting resumes slightly before section enters viewport
  );
  observer.observe(sectionEl);
  subscribe(SUBSCRIPTION_ID, paintFrame);
});

onDestroy(() => {
  unsubscribe(SUBSCRIPTION_ID);
  observer?.disconnect();
});
```

`sectionEl` is the containing `<section>` element (the component's root or a parent binding). Use whatever binding the component already has; add one if needed.

- [ ] **Step 3: ReadingProgressBar migration**

Confirmed via audit — `ReadingProgressBar.svelte:59` uses `requestAnimationFrame(updateProgress)` recursion. Migrate to shared ticker:

```typescript
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';

const SUBSCRIPTION_ID = 'reading-progress-bar';

function updateProgress() {
  // existing read-scroll-position + write-progress-bar-width body, no self-rAF
}

onMount(() => subscribe(SUBSCRIPTION_ID, updateProgress));
onDestroy(() => unsubscribe(SUBSCRIPTION_ID));
```

No IO gate — ReadingProgressBar is always visible on article routes while mounted.

- [ ] **Step 4: AboutTrain migration (plan-audit addition)**

`AboutTrain.svelte:85` uses `requestAnimationFrame(loop)` recursion. Migrate to shared ticker + IntersectionObserver gate:

```typescript
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';

let observer: IntersectionObserver | null = null;
let isVisible = false;
const SUBSCRIPTION_ID = 'about-train';

function tickTrain(_time: number, _dt: number) {
  if (!isVisible) return;
  // existing body of `loop()` — train position advance + canvas/DOM write
}

onMount(() => {
  if (!rootEl) return; // or whichever binding refers to the AboutTrain section
  observer = new IntersectionObserver(
    (entries) => { isVisible = entries[0].isIntersecting; },
    { rootMargin: '50px' },
  );
  observer.observe(rootEl);
  subscribe(SUBSCRIPTION_ID, tickTrain);
});

onDestroy(() => {
  unsubscribe(SUBSCRIPTION_ID);
  observer?.disconnect();
});
```

- [ ] **Step 5: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

- [ ] **Step 6: Preview-verify**

Yesid verifies on `http://localhost:5173/`:
- Manifesto: canvas paints when section is in viewport. Scroll away — canvas stops repainting. Scroll back — resumes.
- `/blog/[any slug]`: progress bar updates smoothly while scrolling the article.
- `/about`: train animates only while AboutTrain is in viewport; freezes when scrolled away.

DevTools Performance (optional): record while scrolling — CPU should drop when Manifesto / AboutTrain is offscreen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(slice-17e-5): ManifestoCanvas + ReadingProgressBar + AboutTrain on shared ticker"
```

STOP. Tell Yesid:
> "Task 6 done. Three ambient RAFs fan out through the shared ticker. ManifestoCanvas + AboutTrain IO-gated (pause when offscreen); ReadingProgressBar has no gate (always relevant on article routes). Please verify: Manifesto canvas freezes when scrolled away; AboutTrain freezes when /about section is offscreen. Approve to move to Task 7 (Manifesto countdown + AboutTestimonials IO-gate)."

---

## Task 7: Gate Manifesto countdown + AboutTestimonials carousel with IntersectionObserver

**Files:**
- Modify: `src/lib/components/home/Manifesto.svelte`
- Modify: `src/lib/components/about/AboutTestimonials.svelte` (plan-audit addition — rotating `setInterval` at line 32)

**Rationale:** Design spec §4.6 item "Manifesto countdown `setInterval(1000)` always on → Gate on section visibility". Audit also flagged `AboutTestimonials.svelte:32` — a testimonial-rotation `setInterval` always-on. Same pattern: IO-gate on section visibility.

_(Out of scope: `contact/ContactPage.svelte:42` 60-second clock tick — interaction-adjacent, accepted per plan.)_

- [ ] **Step 1: Read current countdown in Manifesto.svelte**

After 17e-3 deleted the Manifesto entrance timeline, the countdown remains — typically:

```typescript
let countdownInterval;
onMount(() => {
  if (!isPrefersReducedMotion()) {
    countdownInterval = setInterval(() => {
      countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
    }, 1000);
  }
  // ... other mount logic ...
});
onDestroy(() => clearInterval(countdownInterval));
```

- [ ] **Step 2: Gate with IntersectionObserver**

```typescript
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;

function startCountdown() {
  if (countdownInterval || isPrefersReducedMotion()) return;
  countdownInterval = setInterval(() => {
    countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

onMount(() => {
  if (!sectionEl) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) startCountdown();
      else stopCountdown();
    },
    { rootMargin: '100px' }, // start counting slightly before section enters view
  );
  observer.observe(sectionEl);
});

onDestroy(() => {
  stopCountdown();
  observer?.disconnect();
});
```

- [ ] **Step 3: AboutTestimonials — gate carousel rotation**

`AboutTestimonials.svelte` currently starts the `setInterval` at `onMount`. Apply the same IO pattern — hold a `sectionEl` binding, construct an IntersectionObserver that starts/stops the interval based on `isIntersecting`.

```typescript
let observer: IntersectionObserver | null = null;
let intervalId: ReturnType<typeof setInterval> | undefined;

function startRotation() {
  if (intervalId || isPrefersReducedMotion()) return;
  intervalId = setInterval(() => {
    // existing carousel-advance body
  }, ROTATION_MS);
}

function stopRotation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
}

onMount(() => {
  if (!sectionEl) return;
  observer = new IntersectionObserver(
    (entries) => { entries[0].isIntersecting ? startRotation() : stopRotation(); },
    { rootMargin: '100px' },
  );
  observer.observe(sectionEl);
});

onDestroy(() => {
  stopRotation();
  observer?.disconnect();
});
```

- [ ] **Step 4: Run tests + check + preview**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
```

Yesid verifies on `http://localhost:5173/`:
- Manifesto: scroll to section — countdown running. Scroll away, wait 10s, scroll back — countdown value should be close to what it was (not advanced by 10s). Scroll back → resumes.
- `/about` AboutTestimonials: testimonial rotation only ticks while section is in viewport.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/home/Manifesto.svelte src/lib/components/about/AboutTestimonials.svelte
git commit -m "refactor(slice-17e-5): IO-gate Manifesto countdown + AboutTestimonials carousel"
```

STOP. Tell Yesid:
> "Task 7 done: Manifesto countdown + AboutTestimonials carousel both pause when offscreen. Please verify (1) Manifesto countdown doesn't advance while section is offscreen; (2) AboutTestimonials freezes when `/about` section isn't visible. Approve to move to Task 8 (delete SvgIcon.animateStagger + StackScenarioCard fade-up)."

---

## Task 8: Delete `SvgIcon.animateStagger` + `StackScenarioCard` fade-up (D267 F)

**Files:**
- Modify: `src/lib/components/brand/SvgIcon.svelte`
- Modify: `src/lib/components/stack/StackScenarioCard.svelte`

**Rationale:** D267 F — keep `SvgIcon.animateMorph` (opacity+scale counts as drawing motion for SVG icons per Yesid's ruling); delete `animateStagger` (pure fade-up) and `StackScenarioCard`'s `fromTo({ y: 30, opacity: 0 }, ...)` entrance.

- [ ] **Step 1: SvgIcon — delete `animateStagger`**

Read SvgIcon.svelte. Find:
- The `animateStagger` function definition (lines ~154–164 per the 17e-3 audit)
- Any call site that invokes it (likely in an `onMount` or switch branch dispatching between `animateDraw` / `animateMorph` / `animateDrawFill` / `animateStagger`)

Delete the function + all its call sites. If the component has a prop/parameter selecting among variants (e.g., `variant: 'draw' | 'morph' | 'drawFill' | 'stagger'`), remove the `'stagger'` option.

Audit callers:
```bash
grep -rn "variant=\"stagger\"\|animateStagger" src/
```

If any consumer passes `variant="stagger"`, decide at that call site whether to switch to `animateDraw` or `animateMorph` or nothing.

- [ ] **Step 2: StackScenarioCard — delete fade-up onMount**

Edit `src/lib/components/stack/StackScenarioCard.svelte`:

Delete:
```typescript
onMount(() => {
  if (cardEl && !isPrefersReducedMotion()) {
    gsap.fromTo(
      cardEl,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
    );
  }
});
```

If `cardEl` binding is now unused (not referenced elsewhere), delete the `bind:this={cardEl}` and the `let cardEl: HTMLElement;` declaration.

If `onMount` is the only Svelte lifecycle the file uses, remove its import as well.

If `gsap` + `isPrefersReducedMotion` are no longer used after this removal, drop their imports.

- [ ] **Step 3: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: tests pass. 0 errors.

- [ ] **Step 4: Preview-verify**

```bash
bun run dev
```

Navigate to wherever `StackScenarioCard` is rendered (`/tech-stack` most likely). Cards should render at final state on load — no fade-up.

Navigate to wherever `SvgIcon variant="stagger"` was used (if any) — confirm no regression.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-5): delete SvgIcon.animateStagger + StackScenarioCard fade-up (D267 F)"
```

STOP. Tell Yesid:
> "Task 8 done: `SvgIcon.animateStagger` + its call sites deleted; `StackScenarioCard` fade-up entrance deleted. `SvgIcon.animateMorph` (opacity+scale) and `animateDraw` / `animateDrawFill` kept per D266+D267. Please verify on `/tech-stack`: cards render instantly, no fade-up. Approve to move to Task 9 (final verification + push)."

---

## Task 9: D269 — Lazy plugin migration + eager-import deletion + bundle measurement

**Files:**
- Modify: `src/lib/motion/utils/gsap.ts`
- Modify: `src/lib/motion/utils/gsap.test.ts`
- Modify: `src/lib/motion/utils/flip.ts`
- Modify: `src/lib/motion/actions/wordmarkHover.ts`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/components/home/HeroBanner.svelte`
- Modify: `src/lib/components/home/HomeCloser.svelte`
- Modify: `src/lib/components/home/DataFlowDiagram.svelte`
- Modify: `src/lib/components/brand/SvgIcon.svelte`
- Modify: `src/lib/components/stack/StackConnections.svelte`
- Modify: `src/lib/components/blog/BlogListingPage.svelte`
- Modify: `src/lib/components/projects/ProjectListingPage.svelte`

**Rationale (D269):** Home route grew +2.18 KB gzipped in 17e-4 instead of shrinking 3–8 KB because `registerGsapPlugins()` still eagerly imported every plugin. This task completes the lazy migration for every consumer, deletes the eager imports, and verifies the long-promised bundle win.

**Audited consumers still calling `registerGsapPlugins()` (9 sites):**
1. `src/routes/+layout.svelte:23` (root)
2. `src/lib/components/home/HeroBanner.svelte:112`
3. `src/lib/components/home/HomeServices.svelte:109` — removed in Task 3
4. `src/lib/components/home/HomeCloser.svelte:115`
5. `src/lib/components/home/DataFlowDiagram.svelte:56`
6. `src/lib/components/brand/SvgIcon.svelte:168`
7. `src/lib/components/stack/StackConnections.svelte:149, 186` (2x)
8. `src/lib/motion/actions/wordmarkHover.ts:28`
9. `src/lib/motion/utils/flip.ts:31`

BlogListingPage + ProjectListingPage already `await loadDrawSVG()` before `captureFlipState`, but `captureFlipState` / `flip.ts` internally calls `registerGsapPlugins()` for the `Flip` plugin — migrate that to `loadFlip()`.

### Plan

- [ ] **Step 1: Add `loadMotionPathPlugin` + `loadSplitText` lazy loaders to `gsap.ts`**

Add two new loaders following the existing pattern. Also update the inline route-expectation comments to reflect the post-migration reality.

```typescript
export async function loadMotionPathPlugin(): Promise<void> {
  if (loadedPlugins.has('MotionPath')) return;
  const mod = await import('gsap/MotionPathPlugin');
  gsap.registerPlugin(mod.MotionPathPlugin);
  loadedPlugins.add('MotionPath');
}

export async function loadSplitText(): Promise<void> {
  if (loadedPlugins.has('SplitText')) return;
  const mod = await import('gsap/SplitText');
  gsap.registerPlugin(mod.SplitText);
  loadedPlugins.add('SplitText');
}
```

- [ ] **Step 2: Rename `registerGsapPlugins()` → `initScrollTriggerConfig()`**

The function's only remaining purpose is the `ScrollTrigger.config({ ignoreMobileResize: true })` side-effect — plugins now come from lazy loaders. Rename for clarity:

```typescript
let initialized = false;

export function initScrollTriggerConfig(): void {
  if (initialized) return;
  ScrollTrigger.config({ ignoreMobileResize: true });
  initialized = true;
}
```

Kept a single ScrollTrigger eager import at the top — it's used site-wide and its overhead is unavoidable.

- [ ] **Step 3: Remove eager plugin imports from `gsap.ts`**

Delete the eager imports for `MotionPathPlugin`, `DrawSVGPlugin`, `CustomEase`, `MorphSVGPlugin`, `Flip`. **Keep `SplitText` eager for now** (see Step 6 — `wordmarkHover` sync-coupling). Also delete the re-exports for removed eager imports (consumers will pull plugins via lazy loaders or not at all).

Update the module header comment to reflect the new contract: ScrollTrigger eager; all other plugins lazy.

- [ ] **Step 4: Migrate flip.ts to use `loadFlip`**

`flip.ts` calls `registerGsapPlugins()` synchronously inside `captureFlipState`. Since `Flip.getState` is synchronous and needed at the exact hover/filter moment, we can't easily await inside `captureFlipState`. Two options:

- **(a)** Add `await loadFlip()` at consumer-mount (`BlogListingPage` + `ProjectListingPage` `onMount`) so Flip is registered before any `captureFlipState` runs. This is the cleanest path — both already `await loadDrawSVG()`, so adding one more line.
- **(b)** Use a module-level promise-guard inside `flip.ts` (track a boolean flag + fire-and-forget `loadFlip()`). Fragile.

Go with (a). `flip.ts`'s `registerGsapPlugins()` call is replaced with a runtime guard: if `Flip` hasn't been registered yet (detected via `gsap.core.PluginScope` or the `loadedPlugins` Set exposed from gsap.ts), warn + no-op. Consumers must preload `Flip`.

Actually simpler: `flip.ts` drops the `registerGsapPlugins()` call entirely and documents the precondition. Consumers already have the `await loadDrawSVG()` pattern; they add `await loadFlip()` alongside it.

- [ ] **Step 5: Migrate each eager consumer to `await loadX()`**

For each consumer, replace `registerGsapPlugins()` with the specific lazy loader(s) it needs, called from an async `onMount`:

- `+layout.svelte` — `registerGsapPlugins()` → `initScrollTriggerConfig()` (root-level ScrollTrigger config only). Delete stale "Mobile: normalizeScroll" comment at line 24.
- `HeroBanner.svelte` — already does `await Promise.all([loadDrawSVG(), loadCustomEase()])` — then swap final `registerGsapPlugins()` → `initScrollTriggerConfig()`. Delete stale comment at line 16.
- `HomeCloser.svelte` — audit what it uses. Likely DrawSVG (graffiti). `await loadDrawSVG()` + `initScrollTriggerConfig()`.
- `DataFlowDiagram.svelte` — uses DrawSVG. `await loadDrawSVG()` + `initScrollTriggerConfig()`.
- `SvgIcon.svelte` — uses DrawSVG (animateDraw/animateDrawFill) + MorphSVG (hover, via morphHelpers). `await Promise.all([loadDrawSVG(), loadMorphSVG()])` + `initScrollTriggerConfig()`.
- `StackConnections.svelte` (2 sites) — uses MotionPath. `await loadMotionPathPlugin()` + `initScrollTriggerConfig()`.
- `BlogListingPage.svelte` / `ProjectListingPage.svelte` — already have `await loadDrawSVG()`; add `await loadFlip()` alongside.

- [ ] **Step 6: Handle `wordmarkHover` SplitText coupling**

`wordmarkHover.ts:29` does `new SplitText(node, { type: 'chars' })` synchronously in the action body. Action contract is `(node, params) => { destroy }` — synchronous. Options:

- **(a)** Fire-and-forget `loadSplitText()` on module import; wordmarkHover assumes it's registered. Risk: race condition if `new SplitText(...)` fires before the dynamic import resolves. Mitigate by lazy-init pattern — have the module export a `splitTextReady: Promise<void>` that resolves when loadSplitText finishes; wordmarkHover awaits inside onMount before constructing. But that changes the action's sync shape.
- **(b)** Keep `SplitText` eager-imported for now. Document in handoff as blocked on a future `wordmarkHover` async-shape refactor. Lose a few KB of bundle.

Go with **(b)** — keep SplitText eager. Update the stale comment at `gsap.ts:20` (`// DELETE in 17e-3`) to reflect reality:
```typescript
import { SplitText } from 'gsap/SplitText'; // Still eager: wordmarkHover's sync new SplitText(...) coupling blocks async migration. Revisit when action contract supports async init.
```

Leave wordmarkHover.ts untouched except for one line — `registerGsapPlugins()` → `initScrollTriggerConfig()` (semantic rename; behavior identical).

- [ ] **Step 7: Update `gsap.test.ts`**

Replace the eager-imports tests with lazy-loader tests. Keep:
- `initScrollTriggerConfig` idempotency test.
- `ScrollTrigger` eager export test.
- `SplitText` eager export test (document why).
- All 6 lazy-loader idempotency tests (+ the 2 new ones for MotionPath + SplitText).
- Remove: per-plugin eager-export tests for MotionPath/DrawSVG/CustomEase/MorphSVG/Flip.
- Remove: the "one registerPlugin call" test that assumed the eager single-batch path.

- [ ] **Step 8: Run tests + check**

```bash
bun run test 2>&1 | tail -15
bun run check 2>&1 | tail -5
```

Expected: 0 errors. All tests pass (one-offs for gsap.test.ts adjusted; setup.dom.ts `vi.mock('gsap/MotionPathPlugin', ...)` stub still works for StackConnections tests).

- [ ] **Step 9: Bundle measurement**

```bash
bun run bundle-size
```

Open `dist/stats.html`. Compare home-route node gzipped size to the 17e-4 baseline (34.57 KB).

Target (design spec D269): **home `/` shrinks 3–8 KB** → post-17e-5 gzipped ≤ ~31.5 KB (mid-range of the predicted 3–8 KB window). If actual shrink is outside this window, investigate before continuing:
- Under 3 KB: some eager path may still be active. Re-audit imports in `dist/stats.html`.
- Over 8 KB: possibly a test regression or accidental code removal. Check rendered pages still work.

Record the actuals (5+ route sizes). If home falls short, flag in iteration log and continue — but note it as a known gap for 17e-6 closing to investigate.

- [ ] **Step 10: Preview-verify cross-route**

Yesid verifies on `http://localhost:5173/`:
- `/` — hero, services morph hover, Manifesto, closer all work
- `/blog`, `/projects` — filter sort still animates via Flip
- `/tech-stack` — StackConnections dots still travel motionPaths
- `/about`, `/contact` — no regressions
- Reduced-motion: no broken animations

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor(slice-17e-5): D269 — lazy-migrate GSAP plugins, delete eager imports, rename registerGsapPlugins -> initScrollTriggerConfig"
```

STOP. Tell Yesid:
> "Task 9 done (D269 stream 3):
> - `loadMotionPathPlugin` + `loadSplitText` lazy loaders added.
> - 8/9 consumers migrated off `registerGsapPlugins()`. Last one (wordmarkHover) keeps SplitText eager, documented in handoff.
> - `registerGsapPlugins()` renamed → `initScrollTriggerConfig()` — keeps only the `ScrollTrigger.config({ignoreMobileResize:true})` side-effect.
> - Eager imports deleted for MotionPath, DrawSVG, CustomEase, MorphSVG, Flip. ScrollTrigger + SplitText stay eager with documented reasons.
> - Stale `normalizeScroll` comments cleaned up.
> - **Bundle delta vs 17e-4 end (home `/`):** [FILL IN — target -3 to -8 KB].
>
> Please verify cross-route behaviour:
> - `/` hero + services morph + Closer
> - `/blog` + `/projects` filter sort (Flip)
> - `/tech-stack` StackConnections packets (MotionPath)
> Approve to move to Task 10 (verification sweep)."

---

## Task 10: Verification sweep + slice spec + continue to 17e-6

_(Plan-audit 2026-04-17 — this task does NOT push. Stays on the combined branch `feature/slice-17e-56-close-motion` and continues directly into 17e-6.)_

**Files:**
- Modify: `docs/slices/slice-17e-5-interaction-consolidation.md` — iteration log + bundle-size delta table

- [ ] **Step 1: Full grep-zero sweep**

```bash
echo "=== registerGsapPlugins call-sites (should be empty) ===" && grep -rn "registerGsapPlugins" src/ | grep -v "\.test\."
echo "=== initScrollTriggerConfig exports ===" && grep -rn "initScrollTriggerConfig" src/
echo "=== eager plugin imports in gsap.ts ===" && grep -n "^import.*from 'gsap/" src/lib/motion/utils/gsap.ts
echo "=== animateStagger ===" && grep -rn "animateStagger" src/
echo "=== StackScenarioCard fade-up ===" && grep -n "gsap\.fromTo" src/lib/components/stack/StackScenarioCard.svelte
echo "=== scoped pulse keyframes ===" && grep -rn "@keyframes pulse\b\|@keyframes led-pulse\b" src/ | grep -v "src/app.css"
echo "=== use:morphHover ===" && grep -rn "use:morphHover" src/ | grep -v "\.test\.ts"
echo "=== ambient RAF outside ticker.ts + one-shot in createHeroTimeline ===" && grep -rn "requestAnimationFrame" src/lib/ | grep -v "ticker\.ts\|createHeroTimeline\.ts"
echo "=== IO-gated sites ===" && grep -rn "IntersectionObserver" src/lib/components/home/Manifesto.svelte src/lib/components/home/ManifestoCanvas.svelte src/lib/components/about/AboutTrain.svelte src/lib/components/about/AboutTestimonials.svelte
echo "=== stale normalizeScroll comments ===" && grep -rn "normalizeScroll" src/ | grep -v "\.test\."
```

Expected:
- `registerGsapPlugins` in src/: 0 matches (all consumers migrated).
- `initScrollTriggerConfig` exports: gsap.ts + consumers.
- gsap.ts eager imports: only `ScrollTrigger` (and `SplitText` if Step 6 kept it).
- animateStagger: 0 matches.
- StackScenarioCard fromTo: 0 matches.
- scoped pulse keyframes outside app.css: 0 matches.
- use:morphHover: at least HomeServices.
- requestAnimationFrame in src/lib/: 0 matches outside `ticker.ts` + the one-shot initial-positioning call in `createHeroTimeline.ts:309` (acceptable — not a loop) + `motion/stores/scroll.ts` (documented infrastructure exception).
- IntersectionObserver: present in Manifesto + ManifestoCanvas + AboutTrain + AboutTestimonials.
- normalizeScroll: 0 matches (layout + HeroBanner comments removed).

- [ ] **Step 2: Full test suite + type check**

```bash
bun run test 2>&1 | tail -15
bun run check 2>&1 | tail -5
```

Expected: all pass; 0 errors. Delta from 17e-4 end (774):
- + 5 `morphHover` tests
- ± gsap.test.ts adjustments (− old eager-export tests, + new lazy-loader tests)

- [ ] **Step 3: Final cross-route preview**

Yesid verifies end-to-end on `http://localhost:5173/`:
- `/` — hero, Manifesto (IO-gated countdown), Services (morph hover), Closer; ambient loops pause when offscreen.
- `/blog`, `/blog/[slug]` — Flip filter sort works; ReadingProgressBar updates.
- `/projects`, `/projects/[slug]` — Flip filter sort works; no regression on detail.
- `/services/[slug]` — no regression.
- `/about` — AboutTrain IO-gated; AboutTestimonials IO-gated; pulsing dots canonical.
- `/tech-stack` — StackConnections dots travel; StackScenarioCards render at final state.
- `/contact` — clock ticks; no regression.
- Reduced-motion global: no morphs, no pulses, no fade-ups.

- [ ] **Step 4: Update slice spec iteration log**

Edit `docs/slices/slice-17e-5-interaction-consolidation.md` — per-task summary + bundle-size delta table + audit notes (including the drift corrections applied during plan-audit).

- [ ] **Step 5: Commit iteration log**

```bash
git add docs/slices/slice-17e-5-interaction-consolidation.md
git commit -m "docs(slice-17e-5): iteration log + bundle-size delta"
```

**DO NOT PUSH.** Stays on `feature/slice-17e-56-close-motion`; continues to 17e-6.

STOP. Tell Yesid:
> "17e-5 Interaction Consolidation complete. Branch held locally — continuing directly to 17e-6 closing per combined-PR workflow.
>
> Delivered:
> 1. `use:morphHover` action (signature 4) with 5 tests.
> 2. HomeServices migrated to `use:morphHover`.
> 3. ManifestoEdgeBottom scoped pulse consolidated into global `pulse-glow`.
> 4. Typewriter type-sequence on shared ticker.
> 5. ManifestoCanvas + ReadingProgressBar + AboutTrain on shared ticker (IO-gated where applicable).
> 6. Manifesto countdown + AboutTestimonials IO-gated.
> 7. `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted.
> 8. D269: `registerGsapPlugins` → `initScrollTriggerConfig`; eager plugin imports deleted (except ScrollTrigger + SplitText); consumer-wide lazy migration complete.
>
> Home-route bundle delta: [FILL IN].
> Tests + check: [FILL IN] / 0 errors.
>
> Ready to continue with 17e-6 Task 1 (closing slice spec)?"

---

## Spec coverage self-check

Every §3.1 / §3.3 / §4.2 / §4.4 / §4.6 / §6.4 item relevant to 17e-5:

- ✅ `actions/morphHover.ts` new (§4.4; helper stays in `utils/morphHelpers.ts`, both consumers use it) — Task 2
- ✅ Consumer migration (HomeServices) to `use:morphHover` — Task 3
- ✅ Pulse consolidation — scoped duplicate eliminated, global `pulse-glow` canonical (§4.6) — Task 4 (scope reduced from "4 → 1" per plan-audit; reality was 1 duplicate)
- ✅ Typewriter `setInterval` → shared ticker (§4.2 shared ticker contract) — Task 5
- ✅ ManifestoCanvas + ReadingProgressBar + AboutTrain RAF → shared ticker + IO gate where applicable (§4.6 + §6.4 rule 5) — Task 6
- ✅ Manifesto countdown + AboutTestimonials `setInterval` IO-gated (§4.6) — Task 7
- ✅ `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted (D266 + D267 F) — Task 8
- ✅ D269: lazy plugin migration + eager-import deletion (§4 consumer migration) — Task 9

**Deferred (documented in handoff):**

- **Cursor-blink stream 2:** nothing to do. Plan-audit confirmed the two remaining cursor blinks after 17e-4 are both already CSS-driven (typewriter-blink + global `@keyframes blink` consumed by TerminalCursor).
- **`SplitText` eager import retained** — blocked by `wordmarkHover` sync-coupling. Async-shape refactor is follow-up work.
- **CloserGraffiti factory rebuild** — optional polish.
- **`motion/stores/scroll.ts` RAF** — infrastructure; retained because it's a shared store, not a per-component loop.

---

## Definition of done (17e-5)

- All 10 tasks approved by Yesid
- Every grep-zero assertion in Task 10 Step 1 passes
- `bun run test` — all pass
- `bun run check` — 0 errors
- DevTools Performance (optional): ambient loops idle (near-zero CPU) when their owner section is offscreen
- HomeServices hover-morph works (desktop hover + mobile tap); reduced-motion no-op
- Manifesto countdown + AboutTestimonials pause when their sections are offscreen
- ManifestoEdgeBottom `.manifesto__status-dot` uses canonical `pulse-glow`
- SvgIcon + StackScenarioCard fade-ups gone
- `registerGsapPlugins()` renamed to `initScrollTriggerConfig()`; plugin registration now lazy per consumer
- Bundle-size delta recorded (target: home `/` gzipped shrinks 3–8 KB vs 17e-4 end)
- Branch `feature/slice-17e-56-close-motion` NOT pushed — continues to 17e-6 closing on the same branch
- Ready to begin 17e-6 Task 1 in the same session
