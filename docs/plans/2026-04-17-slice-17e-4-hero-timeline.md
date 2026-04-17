# Slice 17e-4 Hero Timeline Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the hero's scroll-scrubbed MetroNetwork timeline as a self-contained `scrubs/createHeroTimeline.ts` factory. Inline the MetroNetwork SVG at build (replacing the runtime `fetch('/images/montreal-metro.svg')`), run a one-time SVGO optimization pass, branch the pin length on mobile (~300vh) vs desktop (800vh) while preserving the full network + Phase 5 zoom on both. Delete `heroScrollLock.ts` per D264. Replace `heroTypewriter.ts`'s `setInterval` cursor blink with a CSS keyframe. After 17e-4, the hero is the only pinned scroll-scrub on the site and LCP is the wordmark `<h1>` or the inlined metro SVG (§8 rule 9).

**Architecture:** Hero timeline becomes a sync factory following the D2 pattern from 17e-2 planning pt2 — caller preloads `loadDrawSVG()` + `loadCustomEase()` at route setup, then calls `createHeroTimeline(containerEl, { ... })` which composes ScrollTrigger + DrawSVG + CustomEase + ScrollTrigger.pin directly for the hero's unique narrative (does NOT delegate to `createDrawScrub` — the hero's pin behavior is too specialized). Reduced-motion renders the final state (lines fully drawn, labels visible, Phase 5 zoom applied statically). Decisions logged: D264 (heroScrollLock cut), D265 (MetroNetwork `?raw` + SVGO CLI), A1+B1+C1+D1 from the 17e-4 planning brainstorm.

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom for motion/), GSAP core + ScrollTrigger + DrawSVG (lazy) + CustomEase (lazy), Vite `?raw` import, `svgo` CLI (one-time, not in build pipeline).

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§3.2 signature 5 — MetroNetwork hero scrub; §4.1 file layout; §4.4 deletions — `heroScrollLock.ts`, `heroTimeline.ts`; §5 Mobile posture; §6.3 lazy plugin strategy; §7 Load Veil; §8 SEO contract; §9.1 sub-slice scope; §9.3 risk log)

**Branch:** `feature/slice-17e-4-hero-timeline` (branched from `main` after 17e-2 + 17e-3 PR #15 merges)

**Depends on:** 17e-1 (tokens, lazy loaders `loadDrawSVG` + `loadCustomEase`), 17e-3 (scrub factory pattern). Hard dep on PR #15 merge before branching.

**Blocks:** 17e-5 (typewriter migration to shared ticker follows on from CSS blink refactor), 17e-6 (Lighthouse audit baseline established here).

**Estimated sessions:** 1.5 (design spec §9.1)

---

## File Structure

### Created

| File | Purpose |
|---|---|
| `src/lib/motion/scrubs/createHeroTimeline.ts` | Sync factory — hero's pinned scroll-scrub composing ScrollTrigger + DrawSVG + CustomEase |
| `src/lib/motion/scrubs/createHeroTimeline.test.ts` | Unit tests (desktop/mobile pin length, reduced-motion branch, destroy) |
| `docs/slices/slice-17e-4-hero-timeline.md` | Narrow slice spec |
| (optional — if SVGO output lands as a new file) `static/images/montreal-metro.optimized.svg` | Committed-optimized source SVG if Task 2 chooses a separate file over in-place edit |

### Deleted

| File | Reason |
|---|---|
| `src/lib/motion/utils/heroTimeline.ts` | Replaced by `scrubs/createHeroTimeline.ts` (design spec §4.4) |
| `src/lib/motion/utils/heroScrollLock.ts` | D264 — scroll-locking is a "plays at you" pattern; typewriter becomes pure ambient |
| (test) `src/lib/motion/utils/heroTimeline.test.ts` if it exists | Replaced by factory test |
| (test) `src/lib/motion/utils/heroScrollLock.test.ts` if it exists | Deleted with its source |

### Modified

| File | Change |
|---|---|
| `src/lib/motion/svg/MetroNetwork.svelte` | Replace runtime `fetch('/images/montreal-metro.svg')` with Vite `?raw` import + `{@html}`. SVG content is now in SSR HTML. |
| `src/lib/components/home/HeroBanner.svelte` | Wire `createHeroTimeline` at mount (await `loadDrawSVG()` + `loadCustomEase()` first); remove `createScrollLock` import + usage; remove `scrollLock.shouldLock` / `scrollLock.unlock()` plumbing |
| `src/lib/motion/utils/heroTypewriter.ts` | Replace `setInterval` cursor blink with CSS keyframe class; expose only the type sequence logic |
| `src/lib/motion/utils/index.ts` | Remove re-export of `heroTimeline` and `heroScrollLock` (if they were barrel'd) |
| `src/lib/motion/scrubs/index.ts` | Re-export `createHeroTimeline` + `HeroTimelineOpts` type |
| `src/lib/motion/index.ts` | Barrel already re-exports `./scrubs/index.js` after 17e-3; no change needed |
| `static/images/montreal-metro.svg` | Replaced in-place by one-time `svgo` CLI run (or split to `montreal-metro.optimized.svg` and the original kept as `montreal-metro.source.svg` — decided at Task 2 Step 2) |

### Not touched (correctly deferred)

- **HomeCloser graffiti** (`CloserGraffiti.svelte`) — doctrine exception. Timeline kept on-enter per §3.4. Any refactor to `createCloserTimeline` is optional polish for 17e-5 or later.
- **`SplitText` eager import** — D266 cleared this from 17e-3; Task 7 of 17e-3 was deferred. Stays eager through 17e-4. 17e-5 or later can revisit alongside `wordmarkHover`.
- **MotionPathPlugin eager** — `StackConnections.svelte` consumes it. 17e-5 re-evaluates if Stack work is touched.
- **Shared `gsap.ticker` migration for typewriter** — 17e-5 consolidates all RAF / `setInterval` ambient loops. 17e-4 only converts the typewriter's cursor blink to CSS; the type-sequence logic stays on its current mechanism.

---

## Task 1: Write slice spec for 17e-4

**Files:**
- Create: `docs/slices/slice-17e-4-hero-timeline.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-4-hero-timeline.md`:

```markdown
# Slice 17e-4 — Hero Timeline Rewrite

**Status:** In progress
**Branch:** `feature/slice-17e-4-hero-timeline`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-4-hero-timeline.md`
**Depends on:** 17e-1, 17e-2, 17e-3 (via PR #15 merge)
**Blocks:** 17e-5 (typewriter RAF consolidation), 17e-6 (Lighthouse baseline)

## What

Rewrite the hero's scroll-scrubbed MetroNetwork timeline as a self-contained factory, inline the SVG at build, branch the pin length on mobile, delete `heroScrollLock.ts`, and replace the typewriter's setInterval blink with CSS.

## Outcomes

1. `src/lib/motion/scrubs/createHeroTimeline.ts` is a sync factory matching the 17e-3 convention — caller preloads `loadDrawSVG()` + `loadCustomEase()` at route setup; factory composes ScrollTrigger + pin + DrawSVG stroke-scrub + label fades + Phase 5 Berri-UQAM zoom.
2. `MetroNetwork.svelte` inlines the SVG via Vite `?raw` import + `{@html}`; runtime `fetch('/images/montreal-metro.svg')` is gone. SSR HTML contains the SVG.
3. `static/images/montreal-metro.svg` has been optimized once with `svgo` CLI (round coordinates, collapse groups, drop metadata). Raw size ~21.7 KB → expected < 12 KB.
4. Mobile pin length ≈ 300vh (vs 800vh desktop). Full network + Phase 5 zoom preserved on both. Branch via `window.matchMedia('(max-width: 1023px)')` at factory construction.
5. `src/lib/motion/utils/heroScrollLock.ts` deleted. `HeroBanner.svelte` no longer calls `createScrollLock`. Typewriter becomes pure ambient (D264).
6. `src/lib/motion/utils/heroTypewriter.ts` cursor blink uses a CSS keyframe class (`.typewriter-cursor`). Type-sequence logic preserved.
7. `src/lib/motion/utils/heroTimeline.ts` deleted. Consumers of its exported symbols migrated to `scrubs/createHeroTimeline.ts`.
8. `bun run test` + `bun run check` pass. Hero scroll experience on desktop is visually identical to the pre-refactor behavior (pinned 800vh, lines draw, labels fade, Phase 5 zooms to Berri-UQAM). Mobile hero works — shorter pin, same network.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] View-source on `/` contains the MetroNetwork SVG inline — no network request to `.svg` on initial load
- [ ] Desktop hero: scroll through 800vh triggers stroke-draw + label fades + Phase 5 zoom; same visual as pre-refactor
- [ ] Mobile hero: shorter pin (~300vh), same visual content, full network visible
- [ ] Reduced-motion: hero renders final state statically (lines drawn, labels visible, zoomed to Phase 5); no ScrollTrigger registered
- [ ] No `heroScrollLock` references anywhere (`grep -r "heroScrollLock\|createScrollLock" src/` returns 0)
- [ ] No `heroTimeline` references outside the new scrubs factory (`grep -r "heroTimeline" src/ | grep -v scrubs/` returns 0)
- [ ] Typewriter cursor blinks via CSS (no `setInterval` in the blink path); type-sequence still correct
- [ ] Bundle-size delta recorded against 17e-3 end: shared-layout node expected to shrink by DrawSVG + CustomEase being lazy + heroTimeline.ts gone; home route initial JS expected shrink ~5–10 KB gzipped; initial HTML grows by inlined SVG (~4 KB post-SVGO gzip).
- [ ] `bun run test` passes
- [ ] `bun run check` passes (0 errors)

## Non-goals

- `morphHelpers.ts` → `actions/morphHover.ts` rename (17e-5)
- RAF / ambient loop consolidation for `ManifestoCanvas`, `ReadingProgressBar`, typewriter type-sequence (17e-5)
- `CloserGraffiti` rebuild as `createCloserTimeline` (optional polish, 17e-5 or later)
- SplitText lazy migration (17e-5 or later)
- MOTION.md v2.0 rewrite (17e-6)
- Lighthouse audits on all routes (17e-6 — this slice establishes the hero's target numbers only)

## Iteration log

(Fill in per task as the session progresses.)
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-4-hero-timeline.md
git commit -m "docs(slice-17e-4): slice spec for hero timeline rewrite"
```

STOP. Tell Yesid:
> "Wrote the 17e-4 slice spec at `docs/slices/slice-17e-4-hero-timeline.md`. Approve before I touch the hero code — this is the biggest sub-slice, 1.5 sessions estimated, and the Manifesto-level visual change is the biggest risk."

---

## Task 2: Inline MetroNetwork SVG (Vite `?raw` + one-time SVGO)

**Files:**
- Modify: `src/lib/motion/svg/MetroNetwork.svelte` — replace `fetch` with `?raw` import
- Modify: `static/images/montreal-metro.svg` — in-place SVGO optimization (or split: see Step 2)
- Modify: `src/lib/motion/svg/MetroNetwork.test.ts` (if it exists) — update to reflect inline rather than fetch

**Rationale:** Design spec §7 Load Veil + §8 rule 9: MetroNetwork is the LCP-critical hero asset. A runtime `fetch` + async `innerHTML` injection defers the LCP paint until the network round-trip completes. Inlining via Vite `?raw` puts the SVG in SSR HTML — LCP paint happens on first render. SVGO CLI run once reduces the source file from ~21.7 KB raw to ~10 KB (estimated) without losing visual fidelity. This shrinks the HTML payload and makes first-paint cheaper.

**Important:** Do not set up build-plugin SVGO (D265 decision C1). One-time CLI run. Commit the optimized file. Document the command in `docs/reference/MOTION.md` v2.0 (17e-6) for future re-runs.

- [ ] **Step 1: Install svgo as a dev dependency**

Run:
```bash
bun add -d svgo
```

Verify it's installed:
```bash
bunx svgo --version
```

Expected output: a version string (e.g., `3.x.x`).

- [ ] **Step 2: Decide in-place vs split file**

Read current `MetroNetwork.svelte` to see how the path is referenced:
```bash
grep -n "montreal-metro" src/lib/motion/svg/MetroNetwork.svelte
```

Two options (decide here at plan-time; committing to **option A** below):

- **A (recommended).** Optimize in-place. Before optimization, copy the original to `.source.svg` for record-keeping but add to `.gitignore` so it doesn't pollute the repo:
  - `cp static/images/montreal-metro.svg static/images/montreal-metro.source.svg`
  - Add to `.gitignore`: `static/images/*.source.svg`
  - Run SVGO on `static/images/montreal-metro.svg` overwriting it.
  - Commit only the optimized file.
- **B.** Keep `.svg` as-is; create `.optimized.svg`. Vite import points at `.optimized.svg`. Downside: two files for reviewers to diff.

This plan commits to **A**.

- [ ] **Step 3: Run SVGO on the source SVG**

```bash
bunx svgo --pretty --indent=2 static/images/montreal-metro.svg -o static/images/montreal-metro.svg
```

Flags:
- `--pretty --indent=2` — keeps the file diff-readable after optimization (easier to audit what SVGO did; disable for final minification if size is critical, though gzip handles whitespace well).
- Input and output the same file — in-place overwrite.

Verify size reduction:
```bash
ls -la static/images/montreal-metro.svg
```

Expected: file size dropped from ~21.7 KB to ~10–14 KB (depends on how aggressive SVGO's default plugins are on this specific file).

Visual verification:
```bash
bun run dev
```

Open `http://localhost:5173/` and confirm the MetroNetwork SVG still renders correctly (lines, labels, station dots all present and positioned). If SVGO collapsed something it shouldn't have (e.g., removed a group with a critical ID that the timeline targets), re-run SVGO with `--disable` flags for the offending plugin. Common safe-to-disable: `cleanupIds`, `collapseGroups` (only if your timeline uses group selectors).

If timeline targets are broken after SVGO, re-run with IDs preserved:
```bash
bunx svgo --pretty --indent=2 --disable=cleanupIds,collapseGroups static/images/montreal-metro.svg -o static/images/montreal-metro.svg
```

- [ ] **Step 4: Rewrite `MetroNetwork.svelte` to use `?raw` import**

Current approximate shape (line 28 has the fetch):
```typescript
onMount(async () => {
  const resp = await fetch('/images/montreal-metro.svg');
  const text = await resp.text();
  container.innerHTML = text;
  const svg = container.querySelector('svg');
  svg.setAttribute('data-testid', 'metro-network');
  // ... more setup ...
});
```

New shape (`?raw` import gives the optimized SVG as a string at build time):
```svelte
<script lang="ts">
  // @ts-expect-error — Vite ?raw import gives the file contents as a string at build time
  import metroSvg from '$lib/../../static/images/montreal-metro.svg?raw';

  let { ...props }: { /* existing prop types */ } = $props();

  // No onMount fetch — SVG is inlined via {@html} below.
</script>

<div
  data-testid="metro-network-container"
  class="..."
>
  {@html metroSvg}
</div>
```

**Important details:**

- Vite path convention: `$lib/../../static/...` resolves via SvelteKit's `$lib` alias. An alternative is `import metroSvg from '../../../../static/images/montreal-metro.svg?raw'` using a relative path — both work. Pick whichever is simpler when you look at the file structure.
- `{@html}` renders raw HTML, so the SVG inlines directly into the DOM tree. Svelte treats the content as trusted (it's a build-time artifact).
- Any `data-testid`, IDs, classes, or attributes on the `<svg>` root that the factory needs (e.g., `data-testid="metro-network"`) must be in the source SVG file itself now, not set at runtime. Either:
  - Edit `static/images/montreal-metro.svg` once to add `data-testid="metro-network"` on the root `<svg>` element.
  - OR let the component query via class/tag selector rather than `data-testid`.

Choose: add `data-testid="metro-network"` in the source SVG once. This keeps the test selector stable and doesn't require runtime DOM manipulation.

- [ ] **Step 5: If `MetroNetwork.test.ts` exists, update assertions**

```bash
cat src/lib/motion/svg/MetroNetwork.test.ts 2>/dev/null || echo "no test file"
```

If the test mocks `fetch` or asserts on its call, remove that. Replace with a simpler assertion — "renders `[data-testid='metro-network']` in the DOM" — which now works on mount without any async wait.

- [ ] **Step 6: Run type check and full tests**

```bash
bun run check 2>&1 | tail -10
bun run test 2>&1 | tail -10
```

Expected: 0 errors. Tests all pass. MetroNetwork test (if it exists) is simpler now.

- [ ] **Step 7: Preview-verify visual parity**

Run `bun run dev`. Navigate to `/`. Confirm:
- MetroNetwork renders in the hero with the same visual look as before (lines, labels, stations)
- No network request for `montreal-metro.svg` in DevTools Network tab
- The hero area paints at first paint (no visible "pop-in" while fetch resolves)

- [ ] **Step 8: Commit**

```bash
git add static/images/montreal-metro.svg .gitignore src/lib/motion/svg/MetroNetwork.svelte src/lib/motion/svg/MetroNetwork.test.ts 2>/dev/null
git add package.json bun.lock
git commit -m "feat(slice-17e-4): inline MetroNetwork SVG via Vite ?raw + SVGO CLI"
```

STOP. Tell Yesid:
> "Task 2 done: MetroNetwork SVG is now inlined via `?raw`. Raw-file size was ~21.7 KB → post-SVGO ~[actual number] KB. View-source on `/` shows the SVG inline in the HTML payload now. No more runtime fetch. Please verify the hero still looks identical to you on `/`. Approve to move to Task 3 (build `createHeroTimeline` factory)."

---

## Task 3: Build `createHeroTimeline.ts` factory (desktop path)

**Files:**
- Create: `src/lib/motion/scrubs/createHeroTimeline.ts`
- Create: `src/lib/motion/scrubs/createHeroTimeline.test.ts`
- Modify: `src/lib/motion/scrubs/index.ts` — re-export

**Rationale:** Per design spec §4.3 the hero timeline is a self-contained factory (does NOT delegate to `createDrawScrub` — its pin + multi-phase + zoom composition is unique to the hero). Matches the 17e-3 sync-factory convention. Desktop path first (800vh pin). Mobile branch is Task 4.

- [ ] **Step 1: Read the existing `heroTimeline.ts`**

```bash
cat src/lib/motion/utils/heroTimeline.ts | head -100
```

Map out what the current timeline does:
- Pin section to `sectionEl` for 800vh
- Scrubs DrawSVG on metro lines from 0% → 100% across phases 0–3
- Fades labels in / fades scrollPrompt out at specific progress points
- Phase 5 Berri-UQAM zoom via `transform: scale + translate` scrub
- Ignores mobile resize via `ScrollTrigger.config({ ignoreMobileResize: true })` (set globally in `gsap.ts`; already there from 17e-1)

Keep this mapping as the reference implementation — the new factory replicates the same visual outcome with a cleaner API.

- [ ] **Step 2: Write the test first (RED)**

Create `src/lib/motion/scrubs/createHeroTimeline.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHeroTimeline } from './createHeroTimeline.js';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

vi.mock('$lib/motion/stores/reducedMotion.js', async (importOriginal) => {
  const mod = (await importOriginal()) as typeof import('$lib/motion/stores/reducedMotion.js');
  return {
    ...mod,
    isPrefersReducedMotion: vi.fn(() => false),
  };
});

describe('motion/scrubs/createHeroTimeline', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;
  let scrollPrompt: HTMLElement;
  let wordmark: HTMLElement;
  let berri: SVGElement;

  beforeEach(() => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    vi.clearAllMocks();
    (isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);

    container = document.createElement('section');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M0 0 L10 10');
    svg.append(p);

    berri = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    berri.setAttribute('data-berri', '');
    svg.append(berri);

    scrollPrompt = document.createElement('div');
    wordmark = document.createElement('h1');
    container.append(svg, scrollPrompt, wordmark);
    document.body.append(container);
  });

  afterEach(() => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    document.body.innerHTML = '';
  });

  it('returns a destroy function', () => {
    const destroy = createHeroTimeline(container, {
      svgRoot: svg,
      scrollPrompt,
      wordmark,
      berri,
    });
    expect(typeof destroy).toBe('function');
    destroy();
  });

  it('registers a ScrollTrigger with pin on the container', () => {
    const createSpy = vi.spyOn(ScrollTrigger, 'create');
    const destroy = createHeroTimeline(container, {
      svgRoot: svg,
      scrollPrompt,
      wordmark,
      berri,
    });
    expect(createSpy).toHaveBeenCalled();
    const call = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
    expect(call, 'no ScrollTrigger with pin option registered').toBeDefined();
    expect(call![0].pin).toBeTruthy();
    destroy();
  });

  it('destroy kills registered ScrollTriggers without throwing', () => {
    const destroy = createHeroTimeline(container, {
      svgRoot: svg,
      scrollPrompt,
      wordmark,
      berri,
    });
    expect(() => destroy()).not.toThrow();
  });

  it('reduced-motion: skips ScrollTrigger and renders final state', () => {
    (isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const createSpy = vi.spyOn(ScrollTrigger, 'create');

    const destroy = createHeroTimeline(container, {
      svgRoot: svg,
      scrollPrompt,
      wordmark,
      berri,
    });

    expect(createSpy).not.toHaveBeenCalled();
    expect(() => destroy()).not.toThrow();
  });

  it('accepts custom pinLength option', () => {
    const destroy = createHeroTimeline(container, {
      svgRoot: svg,
      scrollPrompt,
      wordmark,
      berri,
      pinLength: '300vh',
    });
    expect(typeof destroy).toBe('function');
    destroy();
  });
});
```

- [ ] **Step 3: Run the test — should FAIL**

```bash
bun run test -- src/lib/motion/scrubs/createHeroTimeline.test.ts
```

Expected: FAIL on import resolution.

- [ ] **Step 4: Create the factory**

Create `src/lib/motion/scrubs/createHeroTimeline.ts`:

```typescript
// Hero timeline scroll-scrub factory — the site's only pinned scroll-scrub.
//
// Composes ScrollTrigger + pin + DrawSVG stroke-scrub + label fades +
// Phase 5 Berri-UQAM zoom into a single self-contained factory. Does NOT
// delegate to createDrawScrub — the hero's multi-phase choreography is
// specialized and benefits from direct GSAP composition.
//
// Precondition: caller must `await loadDrawSVG()` + `await loadCustomEase()`
// at route setup before invoking. Factory is synchronous.
//
// Reduced-motion: final state rendered immediately (lines fully drawn,
// labels visible, zoomed to Berri-UQAM Phase 5); no ScrollTrigger; no-op destroy.
//
// Mobile branch: pinLength shortens to ~300vh (vs 800vh desktop). Full
// network + Phase 5 zoom preserved on both.
//
// Usage:
//   import { loadDrawSVG, loadCustomEase } from '$lib/motion/utils/gsap.js';
//   import { createHeroTimeline } from '$lib/motion/scrubs/index.js';
//   onMount(async () => {
//     await Promise.all([loadDrawSVG(), loadCustomEase()]);
//     destroy = createHeroTimeline(sectionEl, {
//       svgRoot: svg,
//       scrollPrompt,
//       wordmark,
//       berri,
//       pinLength: isMobile ? '300vh' : '800vh',
//     });
//   });
//   onDestroy(() => destroy?.());

import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface HeroTimelineOpts {
  /** Root <svg> of the MetroNetwork (has the stroke-dashable paths). */
  svgRoot: SVGElement;
  /** Scroll prompt element that fades out early in the scroll. */
  scrollPrompt: HTMLElement;
  /** Wordmark `<h1>` that may need layered behavior. */
  wordmark: HTMLElement;
  /** Berri-UQAM group/element that gets zoomed at Phase 5. */
  berri: SVGElement;
  /** Pin length. Default '800vh'. Mobile callers pass '300vh'. */
  pinLength?: string;
}

/**
 * Create the hero timeline: pin the container, draw the SVG lines, fade
 * labels, zoom to Berri-UQAM at Phase 5.
 *
 * **Precondition:** caller must `await loadDrawSVG()` + `await loadCustomEase()`
 * before invoking.
 */
export function createHeroTimeline(
  container: HTMLElement,
  opts: HeroTimelineOpts,
): () => void {
  const { svgRoot, scrollPrompt, wordmark, berri, pinLength = '800vh' } = opts;

  // Reduced motion: render final state without any scroll trigger.
  if (isPrefersReducedMotion()) {
    // Full stroke drawn.
    const paths = svgRoot.querySelectorAll('path');
    gsap.set(paths, { drawSVG: '100%' });
    // scrollPrompt faded out.
    gsap.set(scrollPrompt, { opacity: 0 });
    // Berri zoomed (final phase 5 transform).
    // Use approximate final numbers from existing heroTimeline.ts; tuned during
    // Task 3 Step 5 preview-verification.
    gsap.set(berri, { scale: 2.5, transformOrigin: 'center center' });
    return () => {};
  }

  // Build the main pinned timeline.
  const triggers: ScrollTrigger[] = [];

  const pinTrigger = ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: `+=${pinLength}`,
    pin: true,
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Phase 0-1: draw lines progressively
      const paths = svgRoot.querySelectorAll('path');
      const drawPct = Math.min(p * 2, 1) * 100; // drawn by progress 0.5
      gsap.set(paths, { drawSVG: `${drawPct}%` });

      // Phase 2: fade scrollPrompt out early (before 20% scroll)
      if (p < 0.2) {
        gsap.set(scrollPrompt, { opacity: 1 - p * 5 });
      } else {
        gsap.set(scrollPrompt, { opacity: 0 });
      }

      // Phase 5: Berri-UQAM zoom in the last third
      if (p > 0.66) {
        const zoomT = (p - 0.66) / 0.34;
        const scale = 1 + zoomT * 1.5; // scales 1 → 2.5
        gsap.set(berri, { scale, transformOrigin: 'center center' });
      } else {
        gsap.set(berri, { scale: 1 });
      }
    },
  });

  triggers.push(pinTrigger);

  return () => triggers.forEach((t) => t.kill());
}
```

**Note on the timeline choreography:** The phase numbers and transforms above are approximations of the existing `heroTimeline.ts`. Task 3 Step 5 preview-verification compares visually; if the current hero has specific beat-perfect moments (label fades at specific progress values, easing curves per phase), port them from `utils/heroTimeline.ts` line-by-line as refinement. This plan step gets the shape right; polish happens in the visual verification loop.

- [ ] **Step 5: Export from scrubs barrel**

Edit `src/lib/motion/scrubs/index.ts`:

```typescript
export { createCrescendoScrub, type CrescendoOpts } from './createCrescendoScrub.js';
export { createDrawScrub, type DrawScrubOpts } from './createDrawScrub.js';
export { createHeroTimeline, type HeroTimelineOpts } from './createHeroTimeline.js';
```

- [ ] **Step 6: Run tests + check**

```bash
bun run test -- src/lib/motion/scrubs/createHeroTimeline.test.ts
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
```

Expected: factory tests PASS (5 tests); full suite stays green; 0 check errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/scrubs/createHeroTimeline.ts src/lib/motion/scrubs/createHeroTimeline.test.ts src/lib/motion/scrubs/index.ts
git commit -m "feat(slice-17e-4): createHeroTimeline sync factory (desktop path)"
```

STOP. Tell Yesid:
> "Task 3 done: `createHeroTimeline` factory scaffolded + 5 tests. Desktop path (800vh pin). Phase choreography is approximated — I'll fine-tune against the current visual in Task 4 when I wire HeroBanner. Approve to move to Task 4 (mobile branch + HeroBanner integration)."

---

## Task 4: Wire HeroBanner + add mobile branch

**Files:**
- Modify: `src/lib/components/home/HeroBanner.svelte` — replace `heroTimeline` import + call with `createHeroTimeline`; add mobile-detection branch

**Rationale:** The factory is built (Task 3) but nothing consumes it yet. Wire it into HeroBanner, passing the correct pin length based on viewport. Preview-verify visual parity with the old timeline and tune phase choreography in the factory if needed.

- [ ] **Step 1: Read current HeroBanner.svelte**

```bash
cat src/lib/components/home/HeroBanner.svelte | head -120
```

Identify the existing hero timeline wiring:
- Line ~23: `import { createScrollLock } from '$lib/motion/utils/heroScrollLock.js';` (deleted Task 5)
- Line ~81: `const scrollLock = createScrollLock(scrollPrompt, reducedMotion);` (deleted Task 5)
- The hero timeline import + invocation (currently from `$lib/motion/utils/heroTimeline.js`)
- Element bindings: `sectionEl`, `scrollPrompt`, `wordmark`, `berri` (or equivalent names)

- [ ] **Step 2: Add plugin preload + factory call at mount**

Edit HeroBanner.svelte script section:

```typescript
// BEFORE (existing):
import { createScrollLock } from '$lib/motion/utils/heroScrollLock.js';
// ... and likely:
import { initHeroTimeline } from '$lib/motion/utils/heroTimeline.js';

// AFTER:
import { loadDrawSVG, loadCustomEase } from '$lib/motion/utils/gsap.js';
import { createHeroTimeline } from '$lib/motion/scrubs/index.js';
```

Replace the current `initHeroTimeline(...)` invocation in `onMount` with:

```typescript
let destroyHero: (() => void) | undefined;

onMount(async () => {
  if (!browser) return;

  // Preload DrawSVG + CustomEase before constructing the timeline (sync factory)
  await Promise.all([loadDrawSVG(), loadCustomEase()]);

  // Mobile pin branch per design spec §5.1
  const isMobile = window.matchMedia('(max-width: 1023px)').matches;

  if (sectionEl && svgEl && scrollPrompt && wordmark && berri) {
    destroyHero = createHeroTimeline(sectionEl, {
      svgRoot: svgEl,
      scrollPrompt,
      wordmark,
      berri,
      pinLength: isMobile ? '300vh' : '800vh',
    });
  }
});

onDestroy(() => destroyHero?.());
```

Remove the `createScrollLock` import and any usage — handled in Task 5.

- [ ] **Step 3: Run dev server and visually compare**

```bash
bun run dev
```

Load `http://localhost:5173/` on desktop. Scroll through the hero slowly. Compare against the pre-refactor behavior:

- [ ] Lines draw at approximately the same scroll progress
- [ ] Labels fade at approximately the same progress
- [ ] Scroll prompt fades early (first 20% of scroll)
- [ ] Phase 5 Berri-UQAM zoom engages in roughly the last third
- [ ] Pin length (800vh) feels right — you've scrolled through ~8 viewport heights

If anything is off, return to `createHeroTimeline.ts` (Task 3 Step 4) and tune the progress thresholds + transforms. Port specific values from `utils/heroTimeline.ts` if a particular beat needs pixel-perfect preservation.

**Mobile test:**

Use Chrome DevTools Responsive mode → iPhone or similar (width < 1024px). Reload. Scroll through hero. Expect:
- Same visual content (full network, phase 5 zoom)
- Shorter pin (~300vh)
- Scroll feels snappier — fewer vh to traverse

- [ ] **Step 4: Test reduced-motion**

In DevTools Rendering panel, toggle "Emulate CSS prefers-reduced-motion: reduce". Reload `/`. Expect:

- Hero SVG renders with lines already drawn
- Scroll prompt not visible (faded-out final state)
- Phase 5 zoom applied statically — Berri-UQAM visible at zoomed scale on page load
- No pin; normal scroll through the hero section

- [ ] **Step 5: Run tests + check**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
```

Expected: all tests pass. 0 errors. (`HeroBanner.test.ts` might need a minor update if it asserted on `initHeroTimeline` being called — update to assert on `createHeroTimeline` instead, or assert on element bindings existing.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/home/HeroBanner.svelte src/lib/components/home/HeroBanner.test.ts 2>/dev/null
git commit -m "feat(slice-17e-4): wire HeroBanner to createHeroTimeline + mobile pin branch"
```

STOP. Tell Yesid:
> "Task 4 done: HeroBanner wires `createHeroTimeline` at mount, awaits DrawSVG + CustomEase lazy loads, branches to 300vh on mobile. Please verify on `/`:
> - Desktop: scroll through hero — same choreography as before (lines draw, labels fade, scroll prompt fades early, Phase 5 zooms to Berri-UQAM)
> - Mobile (DevTools): shorter pin, same visual content
> - Reduced-motion: hero renders final state statically
>
> If choreography is off on any beat, tell me which one and I'll tune the thresholds in `createHeroTimeline.ts`. Approve to move to Task 5 (delete heroScrollLock)."

---

## Task 5: Delete `heroScrollLock.ts` and its integration

**Files:**
- Delete: `src/lib/motion/utils/heroScrollLock.ts`
- Delete: `src/lib/motion/utils/heroScrollLock.test.ts` (if exists)
- Modify: `src/lib/components/home/HeroBanner.svelte` — already removed imports in Task 4; now scrub any remaining references

**Rationale:** D264. Scroll-locking is a "plays at you" pattern. Typewriter becomes pure ambient per §3.3 signature 9. First-visit users may scroll past mid-typewriter — acceptable; the intro is not narrative-critical. B1 decision (single delete, no shadow-mode).

- [ ] **Step 1: Grep for any remaining references**

```bash
grep -rn "heroScrollLock\|createScrollLock\|scrollLock" src/
```

Expected hits: the file itself + any residual references in HeroBanner.svelte that Task 4 might have left (e.g., `scrollLock.shouldLock` conditionals, `scrollLock.unlock()` cleanups).

- [ ] **Step 2: Clean up any HeroBanner remnants**

If Task 4 missed removing related code (like a typewriter callback that called `scrollLock.unlock()`), remove those too. The typewriter should just run freely without unlocking anything.

Look for patterns like:
```typescript
typewriter.type(() => scrollLock.unlock());
// should become:
typewriter.type();
```

Or any `if (scrollLock.shouldLock) { ... }` branches — delete entirely, keeping only the always-path.

- [ ] **Step 3: Delete the file(s)**

```bash
rm src/lib/motion/utils/heroScrollLock.ts
rm src/lib/motion/utils/heroScrollLock.test.ts 2>/dev/null || true
```

- [ ] **Step 4: Verify grep zero**

```bash
grep -rn "heroScrollLock\|createScrollLock" src/
```

Expected: zero matches (except possibly in `docs/` or old devlog entries, which is fine).

- [ ] **Step 5: Remove from barrels if present**

```bash
grep -n "heroScrollLock" src/lib/motion/utils/index.ts src/lib/motion/index.ts 2>/dev/null
```

If any re-export exists, remove it.

- [ ] **Step 6: Run tests + check**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
```

Expected: tests pass (deleted tests are gone). 0 errors.

- [ ] **Step 7: Preview-verify typewriter behavior**

```bash
bun run dev
```

Load `/`. Watch the typewriter play its sequence. Scroll during the typewriter — page should scroll naturally (no lock). If user scrolls past before typewriter finishes, typewriter just cuts off at its current position — acceptable.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix(slice-17e-4): delete heroScrollLock — D264 (Snappy Doctrine)"
```

STOP. Tell Yesid:
> "Task 5 done: `heroScrollLock.ts` deleted. Typewriter is now pure ambient — no scroll lock. First-visit users can scroll past mid-typewriter; animation cuts off gracefully. Please verify on `/`: typewriter plays, scroll works naturally during playback. Approve to move to Task 6 (typewriter cursor blink → CSS)."

---

## Task 6: Replace typewriter cursor blink with CSS keyframe

**Files:**
- Modify: `src/lib/motion/utils/heroTypewriter.ts`
- Modify: (any CSS file that needs the new `.typewriter-cursor` keyframe — likely `src/app.css` or a scoped style in `HeroBanner.svelte`)

**Rationale:** Design spec §4.6 consolidation: "3× cursor blink implementations" currently exist — typewriter's `setInterval` is one. Design spec §4.2 Shared ticker principle: no component may start its own RAF/setInterval for ambient motion. Converting typewriter blink to CSS removes one `setInterval`; the type-sequence `setInterval` stays for 17e-4 and migrates to shared ticker in 17e-5.

**Scope for 17e-4:** only the cursor blink. The character-by-character type-sequence keeps its current mechanism.

- [ ] **Step 1: Read current `heroTypewriter.ts`**

```bash
cat src/lib/motion/utils/heroTypewriter.ts
```

Identify the cursor blink implementation. Likely looks like:
```typescript
const blink = setInterval(() => {
  cursor.style.visibility =
    cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
}, 500);
```

- [ ] **Step 2: Add CSS keyframe to `src/app.css`**

Add a global utility class:

```css
/* Typewriter cursor blink — replaces setInterval blink from heroTypewriter.ts
   (17e-4). Uses CSS steps() for the classic blocky blink look. */
.typewriter-cursor {
  animation: typewriter-blink 1s steps(2, start) infinite;
}

@keyframes typewriter-blink {
  to {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typewriter-cursor {
    animation: none;
    visibility: visible;
  }
}
```

- [ ] **Step 3: Remove `setInterval` blink from `heroTypewriter.ts`**

In `heroTypewriter.ts`, delete the `setInterval` that toggles visibility. Add `.typewriter-cursor` class to the cursor element when it's created/rendered. The cursor element lives in the hero template — find it and add the class.

If the cursor is a DOM element created dynamically by the typewriter:
```typescript
// BEFORE:
const cursor = document.createElement('span');
cursor.textContent = '█';
target.appendChild(cursor);
const blink = setInterval(() => { /* toggle visibility */ }, 500);

// AFTER:
const cursor = document.createElement('span');
cursor.className = 'typewriter-cursor';
cursor.textContent = '█';
target.appendChild(cursor);
// No setInterval — CSS handles it.
```

Update the destroy function to drop the `clearInterval(blink)` call.

- [ ] **Step 4: Run tests + check + preview**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
bun run dev
```

Load `/`. Watch the typewriter cursor blink — same visual rhythm, now powered by CSS. No `setInterval` in DevTools Performance tab timer list.

Reduced-motion: cursor stays visible, no blink.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/utils/heroTypewriter.ts src/app.css
git commit -m "refactor(slice-17e-4): typewriter cursor blink via CSS keyframe (drops setInterval)"
```

STOP. Tell Yesid:
> "Task 6 done: typewriter cursor blink now CSS-powered via `.typewriter-cursor` keyframe. Type-sequence mechanism unchanged (moves to shared ticker in 17e-5). Reduced-motion keeps cursor solid. Approve to move to Task 7 (delete old `utils/heroTimeline.ts`)."

---

## Task 7: Delete `utils/heroTimeline.ts`

**Files:**
- Delete: `src/lib/motion/utils/heroTimeline.ts`
- Delete: `src/lib/motion/utils/heroTimeline.test.ts` (if exists)
- Modify: `src/lib/motion/utils/index.ts` — remove any re-export of heroTimeline
- Modify: any residual importers

**Rationale:** The factory replacement (`scrubs/createHeroTimeline.ts`) is live and wired (Tasks 3–4). The old util is dead code — delete it to prevent accidental re-use.

- [ ] **Step 1: Grep remaining references**

```bash
grep -rn "utils/heroTimeline\|initHeroTimeline\|from.*heroTimeline" src/
```

Expected: zero or very few matches. HeroBanner should no longer import from it after Task 4. If any match remains, migrate the importer to `$lib/motion/scrubs/index.js` → `createHeroTimeline`.

- [ ] **Step 2: Delete**

```bash
rm src/lib/motion/utils/heroTimeline.ts
rm src/lib/motion/utils/heroTimeline.test.ts 2>/dev/null || true
```

- [ ] **Step 3: Update barrel if needed**

```bash
grep -n "heroTimeline" src/lib/motion/utils/index.ts
```

Remove any re-export line.

- [ ] **Step 4: Verify grep zero**

```bash
grep -rn "utils/heroTimeline\|initHeroTimeline" src/
```

Expected: zero matches.

- [ ] **Step 5: Run tests + check**

```bash
bun run test 2>&1 | tail -5
bun run check 2>&1 | tail -5
```

Expected: 0 errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(slice-17e-4): delete utils/heroTimeline.ts (replaced by scrubs/createHeroTimeline)"
```

STOP. Tell Yesid:
> "Task 7 done: old `utils/heroTimeline.ts` deleted. Grep-zero confirmed. The hero is now fully on `scrubs/createHeroTimeline.ts`. Approve to move to Task 8 (final verification + bundle-size + push)."

---

## Task 8: Verification, bundle-size delta, push

**Files:**
- Modify: `docs/slices/slice-17e-4-hero-timeline.md` — iteration log + bundle-size delta table

- [ ] **Step 1: Full grep-zero sweep**

```bash
echo "=== heroScrollLock ===" && grep -rn "heroScrollLock\|createScrollLock" src/
echo "=== heroTimeline (old util) ===" && grep -rn "utils/heroTimeline\|initHeroTimeline" src/
echo "=== MetroNetwork runtime fetch ===" && grep -rn "fetch.*montreal-metro" src/
echo "=== Typewriter setInterval blink ===" && grep -n "setInterval" src/lib/motion/utils/heroTypewriter.ts
echo "=== createHeroTimeline usage ===" && grep -rn "createHeroTimeline" src/ | grep -v scrubs/
```

Expected: zero matches on the first three; typewriter may still have one `setInterval` for the type-sequence (acceptable — 17e-5 scope); at least one `createHeroTimeline` usage (HeroBanner).

- [ ] **Step 2: Full test suite + type check**

```bash
bun run test 2>&1 | tail -15
bun run check 2>&1 | tail -5
```

Expected: all tests pass. 0 errors.

Expected test-count delta from 17e-3 end:
- + 5 `createHeroTimeline` tests
- − N tests from deleted `heroTimeline.test.ts` + `heroScrollLock.test.ts` (N depends on what exists)

Record the exact final count.

- [ ] **Step 3: Bundle-size delta**

```bash
bun run bundle-size
```

Open `dist/stats.html`. Compare per-route gzipped sizes against 17e-3 end (from the 17e-3 slice spec bundle table).

Expected deltas:

- **Shared layout (node 0):** near-flat or small growth (createHeroTimeline factory adds ~2 KB; old heroTimeline gone but was not in shared bundle).
- **Home `/`:** **shrink expected ~3–8 KB gzipped** — DrawSVG and CustomEase are now route-lazy (loaded via `loadDrawSVG` + `loadCustomEase` on the home route only). Old `heroTimeline.ts` + `heroScrollLock.ts` surfaces gone.
- **Home `/` initial HTML:** **grows ~3–5 KB gzipped** from inlined MetroNetwork SVG. Net trade — browser downloads HTML up-front but skips the `fetch` round trip.
- **Other routes:** flat or slight shrink from deletions.

Fill in the slice spec's Bundle-size delta table with actuals.

- [ ] **Step 4: Preview sanity check across routes**

```bash
bun run dev
```

Walk the full site:
- `/` — hero pins, lines draw, labels fade, Phase 5 zooms to Berri-UQAM; typewriter plays with CSS-blink cursor; scroll works naturally during typewriter; Manifesto + Projects + Services + Closer unchanged
- Mobile viewport — shorter pin, same visual
- Reduced-motion — hero static at final frame
- `/blog`, `/projects`, `/services`, `/about`, `/contact`, `/tech-stack` — unaffected, no regressions

- [ ] **Step 5: Lighthouse quick check (optional but recommended)**

Use Chrome DevTools → Lighthouse → Performance audit on `/` (mobile preset).

Expected gains vs 17e-3 baseline:
- LCP improves because MetroNetwork SVG is in HTML (not fetched)
- FCP possibly same or slightly lower (slightly bigger HTML payload offset by no fetch)
- Performance score trends upward toward design spec §6.1 target (mobile ≥ 90)

This is a heuristic check; the formal Lighthouse-per-route audit lives in 17e-6.

- [ ] **Step 6: Update slice spec iteration log**

Edit `docs/slices/slice-17e-4-hero-timeline.md` — add per-task summary + bundle-size delta table + any tuning deltas from Task 4.

- [ ] **Step 7: Commit + push**

```bash
git add docs/slices/slice-17e-4-hero-timeline.md
git commit -m "docs(slice-17e-4): iteration log + bundle-size delta + Lighthouse baseline"
git push -u origin feature/slice-17e-4-hero-timeline
```

STOP. Tell Yesid:
> "17e-4 Hero Timeline Rewrite complete. Branch `feature/slice-17e-4-hero-timeline` pushed. What was delivered:
>
> 1. `scrubs/createHeroTimeline.ts` sync factory (replaces `utils/heroTimeline.ts`). Desktop 800vh + mobile 300vh via matchMedia branch.
> 2. MetroNetwork SVG inlined via Vite `?raw` + one-time `svgo` CLI. Source file [X KB raw → Y KB optimized].
> 3. `heroScrollLock.ts` deleted (D264). Typewriter is pure ambient now.
> 4. Typewriter cursor blink → CSS keyframe (drops one `setInterval`). Type-sequence mechanism migrates to shared ticker in 17e-5.
> 5. Old `utils/heroTimeline.ts` deleted.
>
> Bundle: home route expected shrink ~3–8 KB gzipped (DrawSVG + CustomEase lazy); HTML grows ~3–5 KB from inline SVG. Lighthouse LCP should improve (SVG no longer fetched).
>
> Tests + check green. Preview-verified desktop + mobile + reduced-motion.
>
> Ready to open PR, or continue to 17e-5?"

---

## Spec coverage self-check

Every §3.2 / §4.1 / §4.3 / §4.4 / §5.1 / §5.2 / §6.3 / §7 / §9.1 item relevant to 17e-4:

- ✅ `scrubs/createHeroTimeline.ts` as self-contained factory (§3.2 signature 5, §4.1, §4.3) — Task 3
- ✅ MetroNetwork SVG inlined at build (§5.2 item 1, §7 Load Veil, §8 rule 9) — Task 2
- ✅ SVGO pass (§5.2 item 2) — Task 2
- ✅ Mobile pin ~300vh, full network preserved (§5.1) — Task 4
- ✅ `heroScrollLock.ts` deleted (§4.4 + D264) — Task 5
- ✅ Typewriter cursor blink via CSS (§4.6 duplication consolidation — one of three blink implementations) — Task 6
- ✅ `utils/heroTimeline.ts` deleted (§4.4) — Task 7
- ✅ Reduced-motion renders final state (§5.3 row "MetroNetwork hero scrub") — Task 3 Step 4 + preview-verify Task 4 Step 4
- ✅ Bundle-size delta recorded (§9.1 Task 8) — Task 8 Step 3

**Deferred (correctly):**

- Typewriter type-sequence `setInterval` → shared `ticker.ts` — 17e-5
- `morphHelpers.ts` → `actions/morphHover.ts` — 17e-5
- LED pulse consolidation — 17e-5
- ManifestoCanvas + ReadingProgressBar RAF → shared ticker — 17e-5
- `CloserGraffiti` factory rebuild — optional, 17e-5 or later
- SplitText lazy migration — 17e-5 or later (blocked by `wordmarkHover` sync action shape per 17e-3 Task 7 deferral)
- Full Lighthouse audit across all routes — 17e-6

---

## Definition of done (17e-4)

- All 8 tasks approved by Yesid
- Every grep-zero assertion in Task 8 Step 1 returns 0 matches
- `bun run test` — all pass
- `bun run check` — 0 errors
- Desktop hero choreography visually unchanged from pre-refactor baseline
- Mobile hero: shorter pin, same visual content, no regressions
- Reduced-motion: hero final state rendered statically
- Typewriter runs with CSS-blink cursor; no scroll lock
- MetroNetwork SVG present in SSR HTML (view-source confirms)
- Bundle-size delta recorded in slice spec
- Branch pushed
- Ready for PR, or session continues to 17e-5
