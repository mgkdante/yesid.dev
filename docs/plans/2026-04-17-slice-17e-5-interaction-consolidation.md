# Slice 17e-5 Interaction Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize interaction and ambient motion. Promote `morphHelpers.ts` into a proper `use:morphHover` Svelte action (per D267 E2 — first-class action alongside `boop` / `cursorGlow` / `magnetic`). Consolidate 4× LED-pulse keyframes into one global `.led-pulse` utility. Migrate all ambient JS loops (typewriter type-sequence, `ManifestoCanvas`, `ReadingProgressBar`, Manifesto countdown) off independent `setInterval` / `requestAnimationFrame` onto the shared `ticker.ts` from 17e-1 with `IntersectionObserver`-gated offscreen pause. Clean up the two remaining post-D266 reveal violations flagged in 17e-3 Task 8 (`SvgIcon.animateStagger`, `StackScenarioCard.svelte:43`). After 17e-5, the site has one RAF loop (the shared ticker), one `.led-pulse` keyframe, one `use:morphHover` API, and every ambient loop pauses when offscreen.

**Architecture:** Actions + scrubs + one shared ambient loop. All interaction signatures are Svelte actions with a uniform destroy-returning shape. `ticker.ts` (from 17e-1) becomes the single `gsap.ticker.add` callback that fans out to subscribers; each consumer registers/unregisters via `subscribe(id, fn)` and wraps its subscription in an IntersectionObserver so it pauses when the owner element is off-screen. Decisions: D266 (drawing motion OK on enter), D267 (E2 morphHover action, F delete fade-ups, G2 no ripple restore).

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom), GSAP + MorphSVG (lazy per 17e-1), shared `gsap.ticker` (from 17e-1), IntersectionObserver (native browser).

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§3.1 signature 4 — SVG morph hover; §3.3 signature 9 — typewriter idle; §4.2 shared ticker contract; §4.4 `morphHelpers.ts` absorbed; §4.6 ambient duplication consolidation; §6.4 animation runtime rules — max 1 RAF loop site-wide; §9.1 sub-slice scope)

**Branch:** `feature/slice-17e-5-interaction-consolidation` (branched from `main` after 17e-4 merges)

**Depends on:** 17e-1 (shared `ticker.ts`, lazy `loadMorphSVG`), 17e-4 (typewriter cursor blink already CSS). Hard dep on 17e-4 PR merge.

**Blocks:** 17e-6 (MOTION.md v2.0 documents the action contract established here; Lighthouse audit baseline benefits from consolidated ambient loops).

**Estimated sessions:** 1

---

## File Structure

### Created

| File | Purpose |
|---|---|
| `src/lib/motion/actions/morphHover.ts` | Svelte action `use:morphHover={{ shapes, lastShapeIdx?, enabled? }}` — promoted from `morphHelpers.ts` |
| `src/lib/motion/actions/morphHover.test.ts` | Unit tests (shape cycling, reduced-motion, mobile-gate, destroy) |
| `docs/slices/slice-17e-5-interaction-consolidation.md` | Narrow slice spec |

### Deleted

| File | Reason |
|---|---|
| `src/lib/motion/utils/morphHelpers.ts` | Absorbed into `actions/morphHover.ts` (design spec §4.4). If the `convertSvgToMorphPaths` helper is still needed at the action, it moves into morphHover.ts as a private helper (not re-exported). |
| `src/lib/motion/utils/morphHelpers.test.ts` (if exists) | Replaced by `morphHover.test.ts` |

### Modified

| File | Change |
|---|---|
| `src/lib/motion/actions/index.ts` | Re-export `morphHover` + `MorphHoverParams` type |
| `src/lib/motion/utils/index.ts` | Drop `convertSvgToMorphPaths` re-export |
| `src/lib/components/home/HomeServices.svelte` | Replace manual `cardPaths[]` / `cardOriginals[]` state + `handleCardEnter/Leave/Tap` + manual `gsap.to(..., { morphSVG })` calls with `use:morphHover={{ shapes: SHAPES, enabled: cardReady }}` on each SVG panel. Keep the SVG-fetch logic (inline injection after mount). |
| `src/lib/components/projects/ProjectCard.svelte` | Apply `use:morphHover` on the inline tech-stack diagram's paths if it uses morphSVG, OR leave unchanged if it's using DrawSVG hover which is a different signature. Audit at task time. |
| `src/lib/components/brand/SvgIcon.svelte` | **Delete `animateStagger` function + its call sites** (D267 F — fade-up reveal violation). Keep `animateDraw`, `animateDrawFill`, `animateMorph`. |
| `src/lib/components/stack/StackScenarioCard.svelte` | Delete lines ~39–47 (`onMount` `gsap.fromTo(cardEl, { y: 30, opacity: 0 }, ...)`) and the `cardEl` binding if it's unused elsewhere (D267 F). |
| `src/lib/components/home/Manifesto.svelte` | Gate the `countdownInterval` `setInterval` on Manifesto-section visibility via IntersectionObserver |
| `src/lib/components/home/ManifestoCanvas.svelte` | Migrate always-on `requestAnimationFrame` to shared `subscribe(id, fn)`; add IntersectionObserver offscreen pause |
| `src/lib/components/layout/ReadingProgressBar.svelte` | Same pattern — migrate from `requestAnimationFrame` (or scroll listener) to shared `subscribe`; IntersectionObserver gate if applicable |
| `src/lib/motion/utils/heroTypewriter.ts` | Migrate type-sequence `setInterval` → shared ticker `subscribe(id, fn)` with time-based progression. (Cursor blink is already CSS from 17e-4.) |
| `src/app.css` | Add one global `.led-pulse` keyframe + utility class. Delete 4 duplicate keyframe copies from consumers: `InfraFrame.svelte`, `tech-stack +page.svelte`, `AboutPage.svelte` children, `Manifesto.svelte` `.manifesto__status-dot` rule |
| Consumers of the 4 old pulse keyframes | Apply `.led-pulse` class instead of scoped `@keyframes pulse` rules. Audit at task time — exact class names are `pulse`, `led-pulse`, `pulse-glow` (per design spec §4.6). |

### Not touched (correctly deferred)

- **Ripple click feedback** — G2 decision, stays cut. Doctrine vocabulary stays at 9 signatures.
- **SplitText lazy migration** — still blocked by `wordmarkHover.test.ts` sync-coupling; out of scope unless `wordmarkHover` is also refactored (which would be a separate decision).
- **CloserGraffiti factory rebuild** — optional polish, not required by design spec §9.1 for 17e-5.
- **AboutTrain component** — design spec §4.6 mentions "3× cursor blink implementations" and "AboutTrain RAF". The 3 cursor blinks are: typewriter (Task 5), 2× others — locate at Task 2 Step 1. AboutTrain's always-on RAF migrates at Task 6 if it exists and if time permits; otherwise flag for follow-up.
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
**Branch:** `feature/slice-17e-5-interaction-consolidation`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-5-interaction-consolidation.md`
**Depends on:** 17e-1 (shared ticker, lazy loaders), 17e-4 (typewriter cursor blink CSS)
**Blocks:** 17e-6 (MOTION.md v2.0 action contract, Lighthouse audit baseline)

## What

Promote `morphHelpers.ts` into a first-class `use:morphHover` action. Consolidate 4× LED-pulse keyframes into one global class. Migrate all ambient JS loops onto the shared `ticker.ts` with IntersectionObserver offscreen pause. Delete two remaining post-D266 reveal violations.

## Outcomes

1. `src/lib/motion/actions/morphHover.ts` exports a Svelte action with uniform shape: `(node, params) => { destroy }`. `MorphSVG` plugin lazy-loaded on first hover via `loadMorphSVG()`. Mobile gated (no hover on touch).
2. `HomeServices.svelte` uses `use:morphHover={{ shapes: SHAPES, ... }}` on each SVG panel. `cardPaths[]` / `cardOriginals[]` / `handleCardEnter/Leave/Tap` manual wiring is gone.
3. `ProjectCard.svelte` updated if it consumes morphSVG hover (audit at task time).
4. `src/lib/motion/utils/morphHelpers.ts` deleted. `convertSvgToMorphPaths` either absorbed into `morphHover.ts` as a private helper or inlined at call-sites if only used once.
5. `src/app.css` has one global `.led-pulse` keyframe + utility class. The 4 duplicate `@keyframes pulse` / `led-pulse` / `pulse-glow` rules across `InfraFrame`, `tech-stack`, `AboutPage` children, `Manifesto` `.manifesto__status-dot` are deleted; consumers apply `.led-pulse` class instead.
6. Typewriter type-sequence `setInterval` migrates to shared `ticker.subscribe()`. Time-based progression uses `deltaTime`. No residual `setInterval` in `heroTypewriter.ts`.
7. `ManifestoCanvas` always-on `requestAnimationFrame` migrates to shared `ticker.subscribe()` with IntersectionObserver offscreen pause (`rootMargin: "50px"`).
8. `ReadingProgressBar` RAF/scroll listener migrates to shared `ticker.subscribe()` (or stays on scroll listener if that's what it uses — audit at task time).
9. Manifesto countdown `setInterval(..., 1000)` is IntersectionObserver-gated — starts on section enter, stops on exit.
10. `SvgIcon.animateStagger` function + call sites deleted (D267 F — fade-up reveal).
11. `StackScenarioCard.svelte`'s `onMount` `gsap.fromTo({ y: 30, opacity: 0 }, ...)` deleted (D267 F).
12. `bun run test` + `bun run check` pass. Site has one RAF loop site-wide (via `gsap.ticker`), one `.led-pulse` keyframe, one `use:morphHover` API.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] `grep -r "requestAnimationFrame" src/lib/` returns only `motion/utils/ticker.ts` (the shared subscription site)
- [ ] `grep -r "setInterval" src/lib/` — only acceptable hits are event-driven (the gated Manifesto countdown) or confirmed intentional (contact page local-time clock updates every 60s is interaction-adjacent, fine)
- [ ] `grep -rn "@keyframes pulse\|@keyframes led-pulse\|@keyframes pulse-glow" src/` returns only the one `.led-pulse` definition in `app.css`
- [ ] `grep -r "convertSvgToMorphPaths\|utils/morphHelpers" src/` returns 0 matches
- [ ] `grep -r "use:morphHover" src/` returns at least HomeServices (and ProjectCard if applicable)
- [ ] `grep -rn "animateStagger" src/` returns 0 matches
- [ ] `grep -n "gsap\.fromTo.*opacity" src/lib/components/stack/StackScenarioCard.svelte` returns 0 matches
- [ ] HomeServices SVG-panel hover-morph still works visually on desktop; reduced-motion shows primary shape static; mobile tap toggles shape
- [ ] Manifesto section: countdown counts down only when section is in viewport; stops when scrolled away; resumes when scrolled back
- [ ] ManifestoCanvas: canvas paints only when section is in viewport; no CPU churn when offscreen (verify via DevTools Performance)
- [ ] Typewriter: plays on page load; characters appear at consistent pace; cursor blinks via CSS (17e-4)
- [ ] Bundle-size delta recorded against 17e-4 end

## Non-goals

- SplitText lazy migration (blocked by wordmarkHover)
- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits (17e-6)
- Ripple restore (G2 — stays cut)
- CloserGraffiti factory rebuild (optional, out of scope)

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

Identify:
- `convertSvgToMorphPaths(svg)` — returns `{ paths, originals }` where `paths` are clone-replaced `<path>` elements (MorphSVG requires real path elements) and `originals` are the d-attribute strings for reversing.
- Any other helpers.

These absorb into `morphHover.ts` as private helpers (not exported from the new file).

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
      // Find all path children at time of first interaction — SVG may have
      // been injected after mount.
      const svg = node.querySelector('svg') ?? node;
      const { paths: p, originals: o } = convertSvgToMorphPaths(svg as SVGElement);
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

// ── Private helper (absorbed from utils/morphHelpers.ts) ──────────────

/**
 * Convert an SVG's shape elements into MorphSVG-compatible path elements.
 * Returns the new path array + their original d-attribute strings for restoration.
 */
function convertSvgToMorphPaths(svg: SVGElement): {
  paths: SVGPathElement[];
  originals: string[];
} {
  const paths: SVGPathElement[] = [];
  const originals: string[] = [];
  const pathEls = svg.querySelectorAll('path');
  pathEls.forEach((p) => {
    const d = p.getAttribute('d') ?? '';
    if (d) {
      paths.push(p as SVGPathElement);
      originals.push(d);
    }
  });
  return { paths, originals };
}
```

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

## Task 3: Migrate HomeServices + ProjectCard; delete morphHelpers.ts

**Files:**
- Modify: `src/lib/components/home/HomeServices.svelte`
- Modify: `src/lib/components/projects/ProjectCard.svelte` (if applicable)
- Delete: `src/lib/motion/utils/morphHelpers.ts` + test
- Modify: `src/lib/motion/utils/index.ts` — drop re-export

- [ ] **Step 1: Audit ProjectCard for morphSVG hover**

```bash
grep -n "morphSVG\|morphHelpers" src/lib/components/projects/ProjectCard.svelte
```

If ProjectCard uses morphSVG for its hover (likely via SvgIcon or DataFlowDiagram — those have their own hover animations), it does NOT need morphHover. The hover in ProjectCard.svelte at lines 108–115 is gradient-image color on card-hover, not a path morph. Skip.

- [ ] **Step 2: Rewrite HomeServices.svelte to use `use:morphHover`**

Read current state:
```bash
cat src/lib/components/home/HomeServices.svelte | head -200
```

The refactor:
- Delete `cardPaths[]`, `cardOriginals[]`, `cardReady[]`, `activeMorphIndex`, `lastShapeIdx` state
- Delete `handleCardEnter`, `handleCardLeave`, `handleSvgTap` functions
- Delete the manual `gsap.to(paths, { morphSVG: ... })` calls inside them
- Delete `convertSvgToMorphPaths` import
- Keep the SVG fetch-and-inject logic in `onMount` (SVG content still loads asynchronously)
- Track a simple `svgReady[]: boolean[]` (or refactor each card into a child component with its own state)
- On each SVG panel element: `use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}`

**Simpler path:** consider extracting each service card into its own `ServiceCardMorph.svelte` child component that owns the fetch + the `use:morphHover` attribute. Keeps HomeServices.svelte's main `onMount` simpler. Decide at task time based on code size.

New shape for each panel in the template:
```svelte
<button
  data-testid="services-svg-panel"
  class="svg-panel ..."
  use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}
>
  <div class="svg-inline-wrapper" style="width:56px;height:56px;">
    <img src="/svg/services/{service.svg}" alt="" width="56" height="56" />
  </div>
</button>
```

(If extracting into a child component, the use:morphHover lives on the child.)

**Note:** `onmouseenter={() => handleCardEnter(i)}` etc. on the `<a>` wrapper can stay if the hover should also affect visuals outside the SVG panel (e.g., card border glow). If those visuals are CSS-driven by `group-hover` already, delete the onmouseenter/onmouseleave too. Audit at task time.

- [ ] **Step 3: Delete `morphHelpers.ts`**

```bash
rm src/lib/motion/utils/morphHelpers.ts
rm src/lib/motion/utils/morphHelpers.test.ts 2>/dev/null || true
```

- [ ] **Step 4: Remove barrel re-export**

Edit `src/lib/motion/utils/index.ts` — remove the line:
```typescript
export { convertSvgToMorphPaths } from './morphHelpers.js';
```

- [ ] **Step 5: Verify grep zero**

```bash
grep -rn "utils/morphHelpers\|convertSvgToMorphPaths" src/
```

Expected: zero matches (the function was absorbed into morphHover.ts as a private helper — no import path references remain).

- [ ] **Step 6: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: all tests pass (HomeServices tests might need a minor update if they asserted on `cardPaths` or `handleCardEnter`). 0 errors.

- [ ] **Step 7: Preview-verify HomeServices hover**

```bash
bun run dev
```

Load `/`, scroll to Services grid. Hover each card's SVG panel — expect morph on hover, unmorph on leave. Mobile (DevTools): tap the panel — expect morph/unmorph toggle. Reduced-motion: no morph, primary shape visible.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-5): migrate HomeServices to use:morphHover; delete morphHelpers.ts"
```

STOP. Tell Yesid:
> "Task 3 done: HomeServices uses `use:morphHover`. `morphHelpers.ts` deleted. Please verify on `/` Services grid: hover cards → shapes morph; leave → unmorph; mobile tap → toggle. Approve to move to Task 4 (LED pulse consolidation)."

---

## Task 4: Consolidate 4× LED pulse keyframes into one global `.led-pulse`

**Files:**
- Modify: `src/app.css` — add canonical `.led-pulse` utility class + keyframe
- Modify: consumers (audit at Step 1) — delete their scoped `@keyframes pulse` / `led-pulse` / `pulse-glow` + apply `.led-pulse` class instead

**Rationale:** Design spec §4.6 calls out 4 duplicate pulse keyframes across `InfraFrame`, `tech-stack`, `AboutPage` children, and `Manifesto`'s `.manifesto__status-dot`. One global class replaces all four.

- [ ] **Step 1: Audit**

```bash
grep -rn "@keyframes pulse\|@keyframes led-pulse\|@keyframes pulse-glow" src/
```

Expected: 4 keyframe declarations (plus possibly an app.css one if it existed pre-17e). List the files.

For each, note:
- Keyframe name (`pulse`, `led-pulse`, `pulse-glow`)
- Keyframe content (duration, opacity curve, box-shadow — they should all be visually equivalent)
- Selectors that consume the keyframe (e.g., `.manifesto__status-dot { animation: pulse 2s ... }`)

- [ ] **Step 2: Pick the canonical keyframe**

Most of the 4 are likely nearly identical (orange glow pulsing `opacity: 0.3 ↔ 1` with optional `box-shadow` glow). Write the canonical one in `src/app.css`:

```css
/* ═══ LED PULSE ═══
   Single global keyframe + utility class replacing 4 duplicate @keyframes
   rules across InfraFrame, tech-stack, AboutPage, Manifesto (17e-5).
   Applied to any "live" status dot that should pulse orange.
   Respects prefers-reduced-motion. */
.led-pulse {
  animation: led-pulse 2s ease-in-out infinite;
}

@keyframes led-pulse {
  0%, 100% {
    opacity: 0.3;
    box-shadow: none;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .led-pulse {
    animation: none;
    opacity: 1;
  }
}
```

- [ ] **Step 3: Migrate each consumer**

For each of the 4 files identified at Step 1:

1. Delete the scoped `@keyframes pulse` / `@keyframes led-pulse` / `@keyframes pulse-glow` rule.
2. For the selector that had `animation: pulse 2s ...`: either:
   - Add `.led-pulse` class to the DOM element in the template + delete the `animation: ...` declaration in scoped CSS.
   - OR keep the scoped selector but change the animation name: `animation: led-pulse 2s ease-in-out infinite;` — this works if the keyframe is now global (in `app.css`). Risk: Svelte's `@keyframes` scoping may still prefix it; verify by checking compiled CSS.

The cleanest path is **the class application** — adds `.led-pulse` to the element template + deletes the scoped rule entirely.

- [ ] **Step 4: Verify grep zero on local keyframes**

```bash
grep -rn "@keyframes pulse\|@keyframes led-pulse\|@keyframes pulse-glow" src/ | grep -v "src/app.css"
```

Expected: zero matches outside `app.css`.

- [ ] **Step 5: Preview-verify each pulse location**

```bash
bun run dev
```

Load pages that contain these status dots:
- `InfraFrame` consumer (likely on `/blog` or `/` somewhere)
- `/tech-stack`
- `/about` section cards
- `/` Manifesto section status dot

Each orange dot should still pulse at the same rhythm. Reduced-motion: solid orange, no pulse.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(slice-17e-5): consolidate 4x LED pulse keyframes into global .led-pulse"
```

STOP. Tell Yesid:
> "Task 4 done: one global `.led-pulse` class replaces 4 scoped `@keyframes`. Please verify pulsing dots on `/`, `/about`, `/tech-stack`, `/blog` still pulse identically. Approve to move to Task 5 (typewriter type-sequence → shared ticker)."

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

## Task 6: Migrate ManifestoCanvas + ReadingProgressBar to shared ticker + IntersectionObserver

**Files:**
- Modify: `src/lib/components/home/ManifestoCanvas.svelte`
- Modify: `src/lib/components/layout/ReadingProgressBar.svelte`

**Rationale:** Design spec §4.6 + §6.4 rule 5: all idle RAF loops gated by IntersectionObserver; pause when offscreen. `ManifestoCanvas` does a canvas repaint every frame (heavy). `ReadingProgressBar` updates progress-bar width on scroll (cheap but still a RAF or scroll listener).

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

Likely similar pattern, but may actually be scroll-event-driven (not RAF). Audit at Step 1. If it's a scroll listener, the migration is optional — scroll listeners are passively throttled by the browser. Migrate if it uses RAF for scroll-read smoothing; keep as scroll listener if simple.

If migrating:

```typescript
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';

const SUBSCRIPTION_ID = 'reading-progress-bar';

function updateProgress() {
  // read scroll position, write progress-bar width
}

onMount(() => subscribe(SUBSCRIPTION_ID, updateProgress));
onDestroy(() => unsubscribe(SUBSCRIPTION_ID));
```

IntersectionObserver gate: ReadingProgressBar is typically on article pages (`/blog/[slug]`, `/projects/[slug]`). The bar is visible throughout the article, so it's always-on while user is on the route. Gating by its own visibility doesn't save much; skip the IO gate for ReadingProgressBar.

- [ ] **Step 4: Run tests + check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

- [ ] **Step 5: Preview-verify**

```bash
bun run dev
```

- `/` Manifesto: canvas paints when section is in viewport. Scroll away — canvas should freeze/stop repainting. Scroll back — resumes. Verify via DevTools Performance: CPU idle when section is offscreen.
- `/blog/[any slug]`: scroll through article — progress bar updates smoothly.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(slice-17e-5): ManifestoCanvas + ReadingProgressBar on shared ticker (IO-gated where applicable)"
```

STOP. Tell Yesid:
> "Task 6 done. ManifestoCanvas uses shared ticker, paused via IntersectionObserver when offscreen. ReadingProgressBar migrated to shared ticker (no IO gate — always visible while on article route). Please verify: Manifesto canvas freezes when scrolled away, resumes on scroll back. Approve to move to Task 7 (Manifesto countdown IO gate)."

---

## Task 7: Gate Manifesto countdown with IntersectionObserver

**Files:**
- Modify: `src/lib/components/home/Manifesto.svelte`

**Rationale:** Design spec §4.6 item "Manifesto countdown `setInterval(1000)` always on → Gate on section visibility". This is the last always-on timer that doesn't need to run when the user isn't looking.

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

- [ ] **Step 3: Run tests + check + preview**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
bun run dev
```

Load `/`. Scroll to Manifesto — countdown running. Scroll away — countdown pauses (not reset — use DevTools to verify by reading the countdown value, scrolling away, waiting, scrolling back; the number should be close to what it was). Scroll back — resumes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/home/Manifesto.svelte
git commit -m "refactor(slice-17e-5): gate Manifesto countdown with IntersectionObserver"
```

STOP. Tell Yesid:
> "Task 7 done: countdown pauses when Manifesto section is offscreen. Verify by scrolling past the Manifesto, waiting 10s, scrolling back — countdown value should be where it was (not advanced by 10). Approve to move to Task 8 (delete SvgIcon.animateStagger + StackScenarioCard fade-up)."

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

## Task 9: Verification sweep, bundle-size delta, push

**Files:**
- Modify: `docs/slices/slice-17e-5-interaction-consolidation.md` — iteration log + bundle-size delta table

- [ ] **Step 1: Full grep-zero sweep**

```bash
echo "=== morphHelpers ===" && grep -rn "utils/morphHelpers\|convertSvgToMorphPaths" src/
echo "=== animateStagger ===" && grep -rn "animateStagger" src/
echo "=== StackScenarioCard fade-up ===" && grep -n "gsap\.fromTo" src/lib/components/stack/StackScenarioCard.svelte
echo "=== scoped pulse keyframes ===" && grep -rn "@keyframes pulse\|@keyframes led-pulse\|@keyframes pulse-glow" src/ | grep -v "src/app.css"
echo "=== use:morphHover ===" && grep -rn "use:morphHover" src/ | grep -v "\.test\.ts"
echo "=== ambient RAF loops (should only be ticker.ts) ===" && grep -rn "requestAnimationFrame" src/lib/ | grep -v "ticker\.ts"
echo "=== Manifesto countdown gate ===" && grep -n "IntersectionObserver" src/lib/components/home/Manifesto.svelte
```

Expected:
- morphHelpers: 0 matches
- animateStagger: 0 matches
- StackScenarioCard fromTo: 0 matches
- scoped pulse keyframes outside app.css: 0 matches
- use:morphHover: at least HomeServices (SVG panels)
- requestAnimationFrame in src/lib/: only `motion/utils/ticker.ts` (the shared subscription hub); any other match needs investigation
- Manifesto IntersectionObserver: present

- [ ] **Step 2: Full test suite + type check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -5
```

Expected: all pass; 0 errors. Delta from 17e-4 end:
- + 5 `morphHover` tests
- − old morphHelpers test count (if any)
- − old StackScenarioCard test assertion for fade-up (if any)

- [ ] **Step 3: Bundle-size delta**

```bash
bun run bundle-size
```

Open `dist/stats.html`. Per-route gzipped sizes vs 17e-4 end.

Expected:
- **Home `/`:** near-flat. HomeServices loses some inline state code; gains `use:morphHover` import.
- **/tech-stack:** slight shrink — `StackScenarioCard` `onMount` gone.
- **Shared layout:** slight shrink — `morphHelpers.ts` gone from whichever bundle it was in.
- **Total site:** net minimal — this slice is about architecture cleanliness + offscreen pause, not bundle slimming.

- [ ] **Step 4: Preview-verify full site**

```bash
bun run dev
```

- `/` — hero + Manifesto (pulsing countdown is IO-gated) + Services (hover morph works) + Closer; all ambient loops pause when offscreen
- `/blog`, `/blog/[slug]` — ReadingProgressBar works; LED pulses match
- `/projects`, `/projects/[slug]` — no regression
- `/services/[slug]` — no regression
- `/about` — pulsing dots on cards match canonical rhythm
- `/tech-stack` — StackScenarioCards render at final state on load; LED pulses canonical
- `/contact` — no regression

Reduced-motion: no pulses, no morphs.

DevTools Performance on `/` — scroll through entire page. Look for CPU profile:
- When scrolling past Manifesto, ManifestoCanvas CPU should drop to ~0
- When on Hero, hero scroll-scrub work shows
- Idle on a non-motion section: near-zero CPU

This is the canonical "ambient loops pause when offscreen" gain that 17e-5 delivers.

- [ ] **Step 5: Update slice spec iteration log**

Edit `docs/slices/slice-17e-5-interaction-consolidation.md` — per-task summary + bundle-size delta table + any audit notes.

- [ ] **Step 6: Commit + push**

```bash
git add docs/slices/slice-17e-5-interaction-consolidation.md
git commit -m "docs(slice-17e-5): iteration log + bundle-size delta"
git push -u origin feature/slice-17e-5-interaction-consolidation
```

STOP. Tell Yesid:
> "17e-5 Interaction Consolidation complete. Branch pushed. What was delivered:
>
> 1. `use:morphHover` action promoted from `morphHelpers.ts` (D267 E2). 5 tests.
> 2. HomeServices migrated to `use:morphHover`; `morphHelpers.ts` deleted.
> 3. One global `.led-pulse` utility replaces 4 scoped keyframes.
> 4. Typewriter type-sequence on shared ticker (cursor blink was already CSS from 17e-4).
> 5. ManifestoCanvas + ReadingProgressBar on shared ticker; ManifestoCanvas pauses when offscreen.
> 6. Manifesto countdown IntersectionObserver-gated.
> 7. `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted (D267 F). `animateMorph` kept per D266+D267.
>
> Site has one RAF loop total (shared ticker). Ambient loops pause when offscreen — measurable CPU drop in DevTools Performance. Bundle delta minimal (this slice is about architecture, not bytes).
>
> Tests + check green.
>
> Ready to open PR, or continue to 17e-6 closing?"

---

## Spec coverage self-check

Every §3.1 / §3.3 / §4.2 / §4.4 / §4.6 / §6.4 item relevant to 17e-5:

- ✅ `actions/morphHover.ts` promoted from morphHelpers.ts (§4.4 absorbed) — Task 2
- ✅ Consumer migration (HomeServices) to `use:morphHover` — Task 3
- ✅ 4× LED pulse → one `.led-pulse` (§4.6) — Task 4
- ✅ Typewriter `setInterval` → shared ticker (§4.2 shared ticker contract) — Task 5
- ✅ ManifestoCanvas always-on RAF → shared ticker + IO gate (§4.6 + §6.4 rule 5) — Task 6
- ✅ ReadingProgressBar RAF → shared ticker (§4.6) — Task 6
- ✅ Manifesto countdown `setInterval` IO-gated (§4.6) — Task 7
- ✅ `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted (D266 + D267 F) — Task 8

**Deferred:**

- AboutTrain RAF (if present) — migrate if audited; otherwise flag in handoff
- SplitText lazy migration — blocked by wordmarkHover
- CloserGraffiti factory rebuild — optional
- MotionPathPlugin lazy migration (plan noted in 17e-2 handoff — StackConnections is still a consumer)

---

## Definition of done (17e-5)

- All 9 tasks approved by Yesid
- Every grep-zero assertion in Task 9 Step 1 passes
- `bun run test` — all pass
- `bun run check` — 0 errors
- DevTools Performance: ambient loops idle (near-zero CPU) when their owner section is offscreen
- HomeServices hover-morph works (desktop hover + mobile tap); reduced-motion no-op
- Manifesto countdown pauses when section offscreen
- Pulsing dots across all consumers use `.led-pulse` canonical
- SvgIcon + StackScenarioCard fade-ups gone
- Bundle-size delta recorded
- Branch pushed
- Ready for PR, or session continues to 17e-6
