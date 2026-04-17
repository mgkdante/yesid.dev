# Slice 17e-2 Snappy Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the Snappy Doctrine across the site. Delete every on-load and on-scroll-into-view entrance animation, remove orphaned motion code, and relocate FLIP filter logic into its own utility. After this sub-slice, `motion/svg/` collapses to `MetroNetwork.svelte` + test only; `use:reveal` / `use:ripple` / `use:tilt` are gone from the codebase; listing pages render cards at final state on load.

**Architecture:** Verb-first task decomposition (D1 from the 17e-2..6 planning brainstorm). Each task groups work by the action performed (delete dead code, kill `use:reveal`, strip entrance tweens, extract FLIP, scrub seed CSS, verify). Each task has a single verification pattern (grep returns 0, tests still green, bundle stable). No task intentionally breaks the build — `bun run test` and `bun run check` must pass at every STOP.

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript strict, Bun, Vitest (happy-dom for motion/), GSAP + Lenis, Tailwind v4.

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§2 Snappy Doctrine, §4.4 deletions, §4.5 entrance-animation removals, §9.1 sub-slice scope)

**Branch:** `feature/slice-17e-2-snappy-sweep` (branched from `main` after 17e-1 merge)

**Depends on:** 17e-1 Foundation (merged via PR #12)

**Blocks:** 17e-3 (Scrub Factories — crescendo replaces the Manifesto char-stagger we leave in place after 17e-2), 17e-5 (consumer migration off eager GSAP plugins partially lands here via MotionPathPlugin removal)

**Estimated sessions:** 1

---

## File Structure

### Created

- `src/lib/motion/utils/flip.ts` — FLIP filter-change animation primitives (extracted from `listingAnimations.ts`)
- `src/lib/motion/utils/flip.test.ts` — unit tests for FLIP primitives
- `docs/slices/slice-17e-2-snappy-sweep.md` — narrow slice spec

### Deleted

| File | Reason |
|---|---|
| `src/lib/motion/actions/reveal.ts` + `reveal.test.ts` | Snappy Doctrine — entrance action forbidden (design spec §2) |
| `src/lib/motion/actions/ripple.ts` + `ripple.test.ts` | Not in the 9-signature vocabulary (design spec §3) |
| `src/lib/motion/actions/tilt.ts` + `tilt.test.ts` | Behavior absorbed into `magnetic` or cut (design spec §4.4) |
| `src/lib/motion/svg/Train.svelte` + `Train.test.ts` | Orphaned — imported only by its own test (design spec §4.4) |
| `src/lib/motion/svg/TrainJourney.svelte` + `TrainJourney.test.ts` | Orphaned |
| `src/lib/motion/svg/TrainTop.svelte` | Orphaned |
| `src/lib/motion/svg/train-path.ts` + `train-path.test.ts` | Orphaned |
| `src/lib/motion/svg/train-targets.ts` | Orphaned |
| `src/lib/motion/components/ScrollRail.svelte` + `ScrollRail.test.ts` | Progress rail not on site (design spec §4.4) |
| `src/lib/motion/utils/listingAnimations.ts` | Split: entrance function deleted, FLIP logic moves to `utils/flip.ts` |

### Modified — motion layer

| File | Change |
|---|---|
| `src/lib/motion/actions/index.ts` | Drop re-exports of `reveal`, `ripple`, `tilt` |
| `src/lib/motion/utils/gsap.ts` | Remove `MotionPathPlugin` eager import + re-export (train tree gone). SplitText stays — `wordmarkHover` still uses it |
| `src/lib/motion/utils/gsap.test.ts` | Drop `MotionPathPlugin` assertions; keep SplitText assertions |
| `src/lib/motion/utils/index.ts` | Re-export FLIP primitives from new `flip.ts`; drop `listingAnimations` barrel entry |
| `src/lib/motion/index.ts` | Drop any re-exports of deleted symbols |

### Modified — `use:reveal` call sites (14 files, 23 call sites)

All `import { reveal } from '$lib/motion/actions/reveal.js'` lines deleted; all `use:reveal` attributes removed.

| File | Reveal sites |
|---|---|
| `src/lib/components/about/AboutLogos.svelte` | 1 |
| `src/lib/components/about/AboutInterests.svelte` | 1 |
| `src/lib/components/about/AboutWeather.svelte` | 1 |
| `src/lib/components/about/AboutIdentity.svelte` | 1 |
| `src/lib/components/about/AboutTestimonials.svelte` | 1 |
| `src/lib/components/about/AboutCta.svelte` | 1 |
| `src/lib/components/about/AboutPolaroids.svelte` | 1 |
| `src/lib/components/about/AboutMetrics.svelte` | 2 |
| `src/lib/components/about/AboutMethod.svelte` | 2 |
| `src/lib/components/about/AboutPage.svelte` | 2 |
| `src/lib/components/services/ServiceDetailPage.svelte` | 10 |
| `src/lib/components/contact/ContactPage.svelte` | 2 |
| `src/lib/components/shared/TagList.svelte` | 1 |
| `src/lib/components/projects/ProjectMiniCard.svelte` | 1 |

Deletion count per grep at plan-time: **27 `use:reveal` attributes across 14 files** (this differs from the design spec's "27+ call sites" by rounding — the spec's estimate was pre-audit).

### Modified — `use:ripple` call sites (1 file, 2 attributes)

| File | Ripple sites |
|---|---|
| `src/lib/components/shared/FilterGroup.svelte` | 2 (filter pill + clear button) |

### Modified — `use:tilt` call sites (4 files)

| File | Tilt sites |
|---|---|
| `src/lib/components/about/AboutIdentity.svelte` | 1 |
| `src/lib/components/about/AboutPage.svelte` | 1 |
| `src/lib/components/about/AboutTestimonials.svelte` | 1 |
| `src/lib/components/projects/ProjectCard.svelte` | 1 |

### Modified — entrance timelines stripped

| File | Mechanism |
|---|---|
| `src/lib/components/blog/BlogDetailHeader.svelte` | Entire `onMount` GSAP timeline (title SplitText char-stagger + tag slide-in) removed |
| `src/lib/components/projects/ProjectDetailHeader.svelte` | Same pattern — SplitText title entrance + meta slide-in |
| `src/lib/components/projects/ProjectDetailSidebar.svelte` | `gsap.from(tags, ...)` entrance on mount removed |
| `src/lib/components/home/FeaturedProjects.svelte` | `ScrollTrigger.create` with `onEnter` timeline that fades cards in (lines ~40–70) removed; cards render at final state |
| `src/lib/components/home/HomeServices.svelte` | `ScrollTrigger.create` with `onEnter` card-fade timeline (lines ~140–159) removed |
| `src/lib/components/blog/BlogListingPage.svelte` | `useListingEntrance(...)` call removed; FLIP imports rewired to new `utils/flip.ts` |
| `src/lib/components/projects/ProjectListingPage.svelte` | Same pattern |

**Not touched in 17e-2 (owned by other sub-slices):**

- `Manifesto.svelte` — SplitText char-stagger entrance stays; replaced by crescendo in 17e-3. SplitText is a gsap.ts re-export consumed here AND by `wordmarkHover`; cannot be removed until 17e-3 swap lands.
- `HomeCloser.svelte` — doctrine exception per design spec §3.4; graffiti on-enter timeline preserved; rebuild as `createCloserTimeline` happens alongside hero work in 17e-4.
- `heroTimeline.ts` — hero timeline rewrite is 17e-4.
- `HomeServices.svelte` path animations (lines 40–96) — SVG hover morph; interaction, not entrance; stays.
- `DataFlowDiagram.svelte` GSAP tweens — scroll-scrub, not entrance; stays (may revisit in 17e-3 if DrawSVG scrub replaces).
- `StackConnections.svelte` / `StackScenarioCard.svelte` tweens — interaction / scroll-scrub, not entrance; stays.

### Modified — seed `opacity: 0` CSS removed

`opacity: 0` removals in `<style>` blocks that seed entrance animations. Each site audited individually at Task 6:

| File | Lines (pre-task audit) |
|---|---|
| `src/lib/components/blog/BlogContent.svelte` | 84, 107 |
| `src/lib/components/blog/BlogDetailHeader.svelte` | 215, 248, 276, 397 |

**Not touched:**

- `src/app.css` pulse/ripple keyframes — keyframe percentages, not seed CSS.
- `src/lib/components/blog/BlogBlueprint.svelte` inline style `opacity:0.x` — decorative fractional opacity, not seed.
- `src/routes/tech-stack/+page.svelte:204` `.hero-hidden { opacity: 0 }` — state class applied during hero load choreography; revisit in 17e-4 when hero rewrite assesses scope.
- `src/routes/+layout.svelte:63` fade-in keyframe — global route-transition animation; revisit in 17e-4 or 17e-5 if doctrine-violating.
- `about/AboutWeather.svelte` keyframes — ambient weather particles; not entrance; stays.

---

## Task 1: Write slice spec for 17e-2

**Files:**
- Create: `docs/slices/slice-17e-2-snappy-sweep.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-2-snappy-sweep.md`:

```markdown
# Slice 17e-2 — Snappy Sweep

**Status:** In progress
**Branch:** `feature/slice-17e-2-snappy-sweep`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-2-snappy-sweep.md`
**Depends on:** 17e-1 (merged)
**Blocks:** 17e-3 (crescendo factory replaces the Manifesto SplitText entrance that stays in place here)

## What

Snappy Doctrine enforcement — delete every on-load and on-scroll-into-view entrance animation across the site, remove orphaned motion code, and split FLIP filter logic into its own utility.

## Outcomes

1. `src/lib/motion/actions/reveal.ts` + test deleted; all 27 `use:reveal` attributes across 14 component files removed; `reveal` re-export dropped from `actions/index.ts`.
2. `src/lib/motion/actions/ripple.ts` + test deleted; both `use:ripple` attributes in `FilterGroup.svelte` removed; `ripple` re-export dropped.
3. `src/lib/motion/actions/tilt.ts` + test deleted; all 4 `use:tilt` attributes removed across About and Projects components; `tilt` re-export dropped.
4. Entire `src/lib/motion/svg/Train*` tree deleted (Train, TrainJourney, TrainTop, train-path, train-targets + their tests). `motion/svg/` contains only `MetroNetwork.svelte` + test.
5. `src/lib/motion/components/ScrollRail.svelte` + test deleted.
6. GSAP `ScrollTrigger`-driven entrance timelines stripped from: `BlogDetailHeader`, `ProjectDetailHeader`, `ProjectDetailSidebar`, `FeaturedProjects`, `HomeServices`, `BlogRow`, `ProjectMiniCard`. Cards + headers render at final state on load.
7. `useListingEntrance()` deleted from `listingAnimations.ts`. FLIP filter primitives (`captureFlipState`, `animateFlipTransition`) moved into new `src/lib/motion/utils/flip.ts` with preserved behavior; consumers in `BlogListingPage` + `ProjectListingPage` rewired; `listingAnimations.ts` deleted.
8. `opacity: 0` seed CSS removed from `<style>` blocks of affected component files (site-wide grep audit).
9. `MotionPathPlugin` eager import + re-export deleted from `motion/utils/gsap.ts` (train gone, no consumers remain). `gsap.test.ts` updated.
10. `bun run test` and `bun run check` pass with zero visual regression on the running site.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] `grep -r "use:reveal\|use:ripple\|use:tilt" src/` returns 0 matches
- [ ] `grep -r "ScrollRail\|train-path\|train-targets\|TrainJourney\|TrainTop" src/` returns 0 matches (except in archived CHANGELOG or generated files)
- [ ] `grep -r "useListingEntrance\|listingAnimations" src/` returns 0 matches
- [ ] `grep -r "MotionPathPlugin" src/` returns 0 matches
- [ ] Listing pages (`/blog`, `/projects`) render cards at final state on load — no fade-up, no stagger entrance
- [ ] Service detail pages, About page sections render at final state on load
- [ ] FLIP filter transitions on listings still animate smoothly when changing filters
- [ ] Bundle-size delta against 17e-1 baseline recorded in this slice spec

## Non-goals

- Removing Manifesto SplitText entrance (17e-3 — crescendo replacement)
- Rewriting hero timeline (17e-4)
- Removing `heroScrollLock.ts` (17e-4 — D264)
- Consolidating LED pulse / cursor blink / RAF loops (17e-5)
- Writing MOTION.md v2.0 (17e-6)

## Iteration log

(Fill in per task as the session progresses.)

## Bundle-size delta (17e-2 end vs 17e-1 baseline)

Recorded from `bun run bundle-size` at the end of Task 7. Baseline from `docs/slices/slice-17e-1-foundation.md`.

| Route | 17e-1 baseline (gzip) | 17e-2 end (gzip) | Delta |
|---|---|---|---|
| Home `/` | 32.39 KB | — | — |
| Blog listing `/blog` | 0.53 KB | — | — |
| Projects listing `/projects` | 17.17 KB | — | — |
| Services listing `/services` | 2.85 KB | — | — |
| Blog detail `/blog/[slug]` | 14.39 KB | — | — |
| Projects detail `/projects/[slug]` | 7.95 KB | — | — |
| Services detail `/services/[id]` | 3.71 KB | — | — |
| About `/about` | 8.47 KB | — | — |
| Contact `/contact` | 14.67 KB | — | — |
| Tech stack `/tech-stack` | 2.08 KB | — | — |
| Shared layout (node 0) | 13.18 KB | — | — |

Expected delta: minimal per-route (tree-shaking already elides the small `reveal.ts` surface on routes that didn't import it); shared-layout modest shrink when `MotionPathPlugin` + listingAnimations exit. Real wins land 17e-3 (SplitText exit), 17e-4 (hero inline + DrawSVG scope), 17e-5 (ambient consolidation).
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-2-snappy-sweep.md
git commit -m "docs(slice-17e-2): slice spec for snappy sweep"
```

STOP. Tell Yesid:
> "Wrote the 17e-2 slice spec at `docs/slices/slice-17e-2-snappy-sweep.md`. Check it and approve before I start touching code."

---

## Task 2: Delete orphaned dead code

**Files deleted:**
- `src/lib/motion/actions/ripple.ts` + `ripple.test.ts`
- `src/lib/motion/actions/tilt.ts` + `tilt.test.ts`
- `src/lib/motion/svg/Train.svelte` + `Train.test.ts`
- `src/lib/motion/svg/TrainJourney.svelte` + `TrainJourney.test.ts`
- `src/lib/motion/svg/TrainTop.svelte`
- `src/lib/motion/svg/train-path.ts` + `train-path.test.ts`
- `src/lib/motion/svg/train-targets.ts`
- `src/lib/motion/components/ScrollRail.svelte` + `ScrollRail.test.ts`

**Rationale:** The Train tree (5 files + 3 tests) is imported nowhere in production code — only its own tests. `ScrollRail.svelte` is imported nowhere. `ripple.ts` and `tilt.ts` have production consumers (2× `FilterGroup` ripple; 4× tilt sites across About + Projects) which are removed as part of this task — the actions themselves are deleted and call sites swept in one pass to keep the build green after commit.

**Important:** This task does NOT delete `reveal.ts` — that's Task 3 (separate because the reveal sweep is much larger — 27 sites — and deserves its own approval gate).

- [ ] **Step 1: Delete the Train tree + ScrollRail (pure orphans, no consumers)**

Run:
```bash
rm src/lib/motion/svg/Train.svelte
rm src/lib/motion/svg/Train.test.ts
rm src/lib/motion/svg/TrainJourney.svelte
rm src/lib/motion/svg/TrainJourney.test.ts
rm src/lib/motion/svg/TrainTop.svelte
rm src/lib/motion/svg/train-path.ts
rm src/lib/motion/svg/train-path.test.ts
rm src/lib/motion/svg/train-targets.ts
rm src/lib/motion/components/ScrollRail.svelte
rm src/lib/motion/components/ScrollRail.test.ts
```

Verify:
```bash
ls src/lib/motion/svg/
# Expected: MetroNetwork.svelte  MetroNetwork.test.ts
ls src/lib/motion/components/ 2>/dev/null || echo "components/ deleted or was empty"
```

If `motion/components/` is now empty after deleting ScrollRail, remove the directory:
```bash
rmdir src/lib/motion/components 2>/dev/null || true
```

- [ ] **Step 2: Verify grep returns zero matches for deleted symbols**

Run:
```bash
grep -rn "Train\.svelte\|TrainJourney\|TrainTop\|train-path\|train-targets\|TRAIN_TARGETS\|getTrainMotionPath\|ScrollRail" src/
```

Expected: zero matches. If anything appears, investigate — should be outside `src/` (e.g., `docs/`, `CHANGELOG`) or inside `node_modules` (excluded by default).

- [ ] **Step 3: Delete `ripple.ts` + test and sweep the 2 FilterGroup call sites**

Delete files:
```bash
rm src/lib/motion/actions/ripple.ts
rm src/lib/motion/actions/ripple.test.ts
```

Edit `src/lib/components/shared/FilterGroup.svelte`:

1. Delete the import line (around line 13):
```typescript
// DELETE:
import { ripple } from '$lib/motion/actions/ripple.js';
```

2. Remove the `use:ripple={{ color: accentColor }}` attributes at lines ~92 and ~107. Preserve everything else on those elements.

3. Check the comment block at top of the file (around line 10) that references `use:ripple`:
```svelte
<!--
  ...
  Includes use:ripple for click feedback (QW-3 from the slice 09c spec).
-->
```

Remove the `use:ripple` mention — or rewrite the comment as "Click feedback via CSS `:active` state (use:ripple removed in 17e-2 — Snappy Doctrine)."

4. If `accentColor` was declared only to feed `use:ripple` (grep for other usages inside the file), remove its declaration too. If it's used elsewhere (e.g., cursor glow), keep.

Verify:
```bash
grep -rn "use:ripple\|from.*ripple\.js\|import.*ripple" src/
```

Expected: zero matches.

- [ ] **Step 4: Delete `tilt.ts` + test and sweep the 4 call sites**

Delete files:
```bash
rm src/lib/motion/actions/tilt.ts
rm src/lib/motion/actions/tilt.test.ts
```

Edit each consumer to remove the `tilt` import and the `use:tilt={{ ... }}` attribute. Preserve other attributes on the same element (`use:cursorGlow`, `use:reveal` — the latter gets removed in Task 3).

Files:

1. `src/lib/components/about/AboutIdentity.svelte` — line ~11 import, line ~26 attribute.
2. `src/lib/components/about/AboutPage.svelte` — line ~13 import, line ~69 attribute (note: `use:reveal use:tilt use:cursorGlow` — strip only `use:tilt={...}` here; `use:reveal` comes out in Task 3).
3. `src/lib/components/about/AboutTestimonials.svelte` — line ~13 import, line ~59 attribute.
4. `src/lib/components/projects/ProjectCard.svelte` — line ~12 import, line ~89 attribute.

Verify:
```bash
grep -rn "use:tilt\|from.*tilt\.js\|import.*tilt" src/
```

Expected: zero matches.

- [ ] **Step 5: Update `src/lib/motion/actions/index.ts`**

Read the current file:
```bash
cat src/lib/motion/actions/index.ts
```

Remove the export lines for `reveal`, `ripple`, and `tilt`. Since Task 3 deletes `reveal.ts`, remove all three in this edit so the barrel stays consistent before Task 3 runs.

After edit (expected shape):
```typescript
// Motion actions — Svelte actions for interaction signatures.
// The Snappy Doctrine limits this surface to the 9-signature vocabulary
// (boop, cursorGlow, magnetic, wordmarkHover, morphHover) + supporting types.

export { boop, type BoopParams } from './boop.js';
export { cursorGlow, type CursorGlowParams } from './cursorGlow.js';
export { magnetic, type MagneticParams } from './magnetic.js';
export { wordmarkHover, type WordmarkHoverParams } from './wordmarkHover.js';
// morphHover absorbed from morphHelpers.ts in 17e-5
```

(Exact existing exports may include others — keep whatever is there other than the three being removed. Use your grep of the file to confirm the final shape before saving.)

- [ ] **Step 6: Run `bun run check` — expect red if any consumer still imports deleted symbols**

Run:
```bash
bun run check 2>&1 | tail -20
```

If errors appear, trace them — most likely a missed `use:tilt` / `use:ripple` attribute or import line. Fix, then re-run.

Expected: 0 errors (21 pre-existing warnings acceptable).

- [ ] **Step 7: Run full test suite — expect all pre-existing tests to still pass**

Run:
```bash
bun run test 2>&1 | tail -10
```

Expected: 802 − (deleted test count) = **802 − 33 ≈ 769 tests pass**. Breakdown:

- `ripple.test.ts` deleted: removes 6 tests (best-effort count from reveal.test.ts mirror)
- `tilt.test.ts` deleted: removes 5 tests (best-effort)
- `Train.test.ts` deleted: removes 7 tests
- `TrainJourney.test.ts` deleted: removes 3 tests
- `train-path.test.ts` deleted: removes 8 tests
- `ScrollRail.test.ts` deleted: removes 4 tests
- Total removed: ~33 tests → new count ~769

**If the post-delete count differs from expected,** it means a test file retained tests that reference deleted symbols (compile error) or a consumer component is still importing something deleted. Investigate the red output rather than adjusting the expected number.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-2): delete orphaned motion code (ripple, tilt, Train tree, ScrollRail)"
```

`git add -A` is intentional here — deletions of multiple directories need it. After committing, review the commit diff:

```bash
git show --stat HEAD
```

Expected: ~15 files deleted, 4 files modified (`actions/index.ts`, `FilterGroup.svelte`, `AboutIdentity.svelte`, `AboutPage.svelte`, `AboutTestimonials.svelte`, `ProjectCard.svelte`). Net line change: significantly negative.

STOP. Tell Yesid:
> "Task 2 done: deleted ripple/tilt/Train-tree/ScrollRail + tests, swept their 6 call sites, updated actions barrel. Tests: 802 → ~769 (the deleted ones). `bun run check` = 0 errors. Listing pages still render; About, Projects, FilterGroup pages rendered via preview — no visual regression. Approve to move to Task 3 (the big `use:reveal` sweep: 27 sites)."

---

## Task 3: Delete `reveal.ts` and sweep all `use:reveal` call sites

**Files:**
- Delete: `src/lib/motion/actions/reveal.ts` + `reveal.test.ts`
- Edit: 14 component files listed below (23–27 call sites depending on count method)

**Rationale:** `use:reveal` is the centerpiece Snappy Doctrine violation — scroll-triggered fade-up on content that should render at final state. This task deletes the action and every consumer. The 14-file edit surface is large but each edit is trivially mechanical (remove import line, remove `use:reveal={{ ... }}` attribute).

- [ ] **Step 1: Verify the reveal sweep scope before editing**

Run:
```bash
grep -rn "use:reveal" src/ | wc -l
grep -rn "from.*reveal\.js\|import.*reveal" src/ | grep -v "reveal\.test\.ts" | grep -v "actions/reveal\.ts" | wc -l
```

Expected: **27 `use:reveal` attributes** (may be slightly off if the design spec's "27+" rounded); **14 distinct import lines**.

List the consumer files:
```bash
grep -rln "use:reveal" src/
```

Save this list — you'll edit each one.

- [ ] **Step 2: Edit each consumer — delete import + all `use:reveal` attributes**

For each file in the list from Step 1:

1. Remove the `import { reveal } from '$lib/motion/actions/reveal.js';` line.
2. Remove every `use:reveal` attribute. The attribute may appear bare (`use:reveal`) or with params (`use:reveal={{ direction: 'up', delay: 200 }}`). Remove the entire attribute and any surrounding whitespace so the remaining attribute list is clean.
3. If `use:reveal` was the only use-directive on an element and it shared a line with other content, re-flow the element cleanly.
4. If `stagger` was imported only to feed `use:reveal={{ delay: stagger(i, 50) }}`, remove its import too (grep the file for other `stagger(` usages to confirm).

Files to edit (list from the File Structure section):

1. `src/lib/components/about/AboutLogos.svelte`
2. `src/lib/components/about/AboutInterests.svelte`
3. `src/lib/components/about/AboutWeather.svelte`
4. `src/lib/components/about/AboutIdentity.svelte`
5. `src/lib/components/about/AboutTestimonials.svelte`
6. `src/lib/components/about/AboutCta.svelte`
7. `src/lib/components/about/AboutPolaroids.svelte`
8. `src/lib/components/about/AboutMetrics.svelte` (2 attributes)
9. `src/lib/components/about/AboutMethod.svelte` (2 attributes)
10. `src/lib/components/about/AboutPage.svelte` (2 attributes)
11. `src/lib/components/services/ServiceDetailPage.svelte` (10 attributes — biggest single file)
12. `src/lib/components/contact/ContactPage.svelte` (2 attributes)
13. `src/lib/components/shared/TagList.svelte` (1 attribute inside `{#each}` — keep `stagger` if used elsewhere)
14. `src/lib/components/projects/ProjectMiniCard.svelte`

**Order tip:** Edit `ServiceDetailPage.svelte` last — it's the largest single file (10 attributes). Get into a rhythm on the smaller files first.

- [ ] **Step 3: Delete `reveal.ts` and `reveal.test.ts`**

Run:
```bash
rm src/lib/motion/actions/reveal.ts
rm src/lib/motion/actions/reveal.test.ts
```

- [ ] **Step 4: Verify grep zero**

Run:
```bash
grep -rn "use:reveal\|from.*reveal\.js\|import.*reveal" src/
```

Expected: zero matches.

- [ ] **Step 5: Run type check**

Run:
```bash
bun run check 2>&1 | tail -20
```

Expected: 0 errors. If errors appear, they're most likely a missed `use:reveal` attribute or an unused `stagger` import that svelte-check flags. Fix and re-run.

- [ ] **Step 6: Run full test suite**

Run:
```bash
bun run test 2>&1 | tail -10
```

Expected: **~769 − 10 ≈ 759 tests pass** (roughly — `reveal.test.ts` removes ~10 tests). If any consumer test fails, investigate — it's likely asserting on reveal behavior that no longer exists.

- [ ] **Step 7: Start the dev server and spot-check affected pages**

Run (in a separate terminal, or in background):
```bash
bun run dev
```

Preview these pages via Claude Preview MCP or a browser:

- `http://localhost:5173/about` — all sections render at final state on load, no fade-up
- `http://localhost:5173/services/data-engineering` (or any slug) — hero, impact column, projects panel all render at final state
- `http://localhost:5173/contact` — both terminal blocks render at final state
- `http://localhost:5173/blog/[any-slug]` then scroll down to related projects — ProjectMiniCards render at final state
- `http://localhost:5173/projects/[any-slug]` — TagList renders at final state

Any page that used to fade-up should now appear instantly on load. No regression elsewhere expected.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-2): delete use:reveal and sweep 27 call sites (Snappy Doctrine)"
```

STOP. Tell Yesid:
> "Task 3 done: deleted `reveal.ts` + test and all 27 `use:reveal` attributes across 14 component files. `grep use:reveal src/` returns 0. Tests: ~759 passing. `bun run check` = 0 errors. Please verify visually: About, Services detail, Contact, Blog detail, Projects detail all render at final state on load — no fade-up. Approve to move to Task 4 (strip entrance timelines from header / sidebar / home components)."

---

## Task 4: Strip GSAP entrance timelines from component files

**Files modified:**
- `src/lib/components/blog/BlogDetailHeader.svelte`
- `src/lib/components/projects/ProjectDetailHeader.svelte`
- `src/lib/components/projects/ProjectDetailSidebar.svelte`
- `src/lib/components/home/FeaturedProjects.svelte`
- `src/lib/components/home/HomeServices.svelte`

**Rationale:** These files don't use `use:reveal` — they hand-roll GSAP entrance timelines in `onMount`. Same doctrine violation; different pattern. Each file gets its entrance block surgically removed while preserving any interaction / scrub / hover code that coexists in the same `onMount`.

**Out of scope:**

- `Manifesto.svelte` char-stagger entrance — stays; 17e-3 replaces it with crescendo
- `HomeCloser.svelte` master timeline — doctrine exception (graffiti on-enter)
- `HomeServices.svelte` SVG hover-morph animations (lines ~40–96) — interaction, stays
- `heroTimeline.ts` — 17e-4

- [ ] **Step 1: `BlogDetailHeader.svelte`**

Read lines 70–110 to locate the `onMount` entrance block:
```bash
# Read the file — use your Read tool
```

Expected shape (approximate):
```svelte
onMount(() => {
  if (!browser || $prefersReducedMotion) return;
  registerGsapPlugins();

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  if (titleEl && SplitText) {
    const split = new SplitText(titleEl, { type: 'chars' });
    tl.from(
      split.chars,
      { opacity: 0, y: 20, stagger: 0.02, duration: 0.4, ease: 'power2.out' },
      0
    );
  }
  // ... other entrance tweens (tag pills, meta row) ...
});
```

Remove:
- The entire `gsap.timeline(...)` + `tl.from(...)` / `tl.to(...)` entrance block
- The `SplitText` usage for the title
- Any `onDestroy` cleanup that was specific to those tweens

Keep:
- Any non-entrance `onMount` logic (e.g., intersection observers, event listeners) — none expected here, but double-check
- The `<script>` imports for things still used elsewhere in the file (e.g., `registerGsapPlugins` if a hover interaction survives)
- If the ONLY purpose of the `onMount` was the entrance, remove the entire `onMount(...)` block. Remove associated unused imports (`registerGsapPlugins`, `gsap`, `SplitText`, `onMount`, `browser`, `$prefersReducedMotion`) only if grep confirms no other reference in the file.

- [ ] **Step 2: `ProjectDetailHeader.svelte`**

Same pattern as Step 1. Read the `onMount` block (around lines 50–70), remove the `gsap.timeline` + `SplitText` char-stagger + any meta-slide entrance tweens. Keep any non-entrance work.

- [ ] **Step 3: `ProjectDetailSidebar.svelte`**

Around line 50, a bare `gsap.from(tags, ...)` animates tag pills into view. Remove the entire `onMount` (or the entrance portion) that performs this. The `tagsContainer` / `tags` reference might have been declared only for this animation — remove if unused elsewhere.

- [ ] **Step 4: `FeaturedProjects.svelte`**

Around lines 40–70, there's a `ScrollTrigger.create` block that fades cards in on scroll. Remove:

```svelte
gsap.set(cards, { opacity: 0, y: 30 });
gsap.set(viewall, { opacity: 0 });

ScrollTrigger.create({
  trigger: sectionEl,
  start: 'top bottom-=50',
  once: true,
  onEnter: () => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 });
    tl.to(viewall, { opacity: 1, duration: 0.3 }, '-=0.2');
  },
});

return () => {
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger === sectionEl) st.kill();
  });
  gsap.set([...cards, viewall], { clearProps: 'all' });
};
```

After removal, if the `onMount` is now empty, remove the whole `onMount(...)` block. The cards will render at final state via their default CSS (make sure no `opacity: 0` seed CSS is in the component's `<style>` — Task 6 handles cross-cutting CSS audit but spot-check this file).

- [ ] **Step 5: `HomeServices.svelte`**

Around lines 140–159, there's the same `ScrollTrigger` entrance pattern (cards + viewall fade in on section entry). Remove it — identical to Step 4.

**Preserve** the SVG hover-morph animations at lines 40–96 — those are interaction, not entrance.

- [ ] **Step 6: Run `bun run check`**

Run:
```bash
bun run check 2>&1 | tail -20
```

Expected: 0 errors. Likely svelte-check complaints if imports are now unused — clean those up.

- [ ] **Step 7: Run full test suite**

Run:
```bash
bun run test 2>&1 | tail -10
```

Expected: test count unchanged from Task 3's end (~759). Component tests for these files assert on rendering, not on the entrance animation — should pass.

- [ ] **Step 8: Preview-verify**

Run `bun run dev` and load:

- `/blog/[any-slug]` — title + tag pills render at final state on load (no char reveal, no slide-up)
- `/projects/[any-slug]` — header + sidebar tags render at final state
- `/` (home) — scroll down to Featured Projects section + HomeServices section. Cards should be visible at final state the moment they enter viewport. No fade-up on scroll.

Manifesto still char-staggers in on its existing scroll (17e-3 replaces this).
Closer graffiti still draws on enter (doctrine exception).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-2): strip GSAP entrance timelines from header/sidebar/home components"
```

STOP. Tell Yesid:
> "Task 4 done: entrance GSAP timelines removed from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar, FeaturedProjects, HomeServices. Interaction / scrub / doctrine-exception motion preserved. All tests pass. Please verify: blog detail page + project detail page render cleanly on load; home page Featured Projects + Services cards are visible without fade-up when scrolled to. Manifesto char-stagger still there (17e-3 replaces). Approve to move to Task 5 (FLIP extraction)."

---

## Task 5: Extract FLIP filter logic into `utils/flip.ts`

**Files:**
- Create: `src/lib/motion/utils/flip.ts` — `captureFlipState` + `animateFlipTransition`
- Create: `src/lib/motion/utils/flip.test.ts`
- Delete: `src/lib/motion/utils/listingAnimations.ts` (after consumers migrate)
- Edit: `src/lib/components/blog/BlogListingPage.svelte`
- Edit: `src/lib/components/projects/ProjectListingPage.svelte`
- Edit: `src/lib/motion/utils/index.ts`

**Rationale:** `listingAnimations.ts` bundles three concerns: `useListingEntrance()` (Snappy violation — delete), `captureFlipState()` + `animateFlipTransition()` (FLIP filter primitives — keep, relocate). Split cleanly so FLIP stays without dragging a doctrine-violating function with it.

- [ ] **Step 1: Read current `listingAnimations.ts` + its test**

```bash
cat src/lib/motion/utils/listingAnimations.ts
ls src/lib/motion/utils/listingAnimations.test.ts 2>/dev/null && cat src/lib/motion/utils/listingAnimations.test.ts || echo "no test file"
```

Note the exact signatures of `captureFlipState` and `animateFlipTransition`. Preserve them verbatim in the new file — consumers expect these signatures.

- [ ] **Step 2: Write `flip.test.ts` first (RED)**

Create `src/lib/motion/utils/flip.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureFlipState, animateFlipTransition } from './flip.js';

describe('motion/utils/flip', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('captureFlipState', () => {
    it('returns null when no [data-flip-id] elements exist', () => {
      expect(captureFlipState()).toBeNull();
    });

    it('returns a FLIP state object when elements exist', () => {
      const el = document.createElement('div');
      el.setAttribute('data-flip-id', 'a');
      document.body.appendChild(el);

      const state = captureFlipState();
      // Flip.getState returns a truthy object in happy-dom (stub), not null
      expect(state).not.toBeNull();
    });
  });

  describe('animateFlipTransition', () => {
    it('is a no-op when batchFired is false', () => {
      const onDone = vi.fn();
      animateFlipTransition('[data-batch="test"]', null, false, onDone);
      // No synchronous error; tick() may or may not have fired yet — no-op before tick
      expect(onDone).not.toHaveBeenCalled();
    });

    it('accepts a null flipState and does not throw', () => {
      const onDone = vi.fn();
      expect(() =>
        animateFlipTransition('[data-batch="test"]', null, true, onDone)
      ).not.toThrow();
    });
  });
});
```

Run:
```bash
bun run test -- src/lib/motion/utils/flip.test.ts
```

Expected: FAIL — module resolution error (`flip.ts` doesn't exist yet).

- [ ] **Step 3: Create `flip.ts` by copying the FLIP-only portions from `listingAnimations.ts`**

Create `src/lib/motion/utils/flip.ts`:

```typescript
// FLIP (First, Last, Invert, Play) animation primitives for listing filter transitions.
// Extracted from listingAnimations.ts in slice 17e-2 when the entrance function
// (useListingEntrance) was deleted to satisfy the Snappy Doctrine.
//
// FLIP animates cards smoothly when the filter value changes — the grid reflows
// and cards tween between their old and new positions. This is interaction-driven
// (filter click = user input), so it's doctrine-compatible.
//
// Usage:
//   import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
//   // before filter changes:
//   flipState = captureFlipState();
//   // after filter-derived list has rendered:
//   animateFlipTransition('[data-batch="blog-item"]', flipState, batchFired, () => { flipState = null; });

import { tick } from 'svelte';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { registerGsapPlugins, gsap, Flip } from '$lib/motion/utils/gsap.js';

/**
 * Capture current FLIP state for filter transitions.
 * Call BEFORE the filter value changes.
 *
 * @returns FLIP state object, or null if reduced motion / no elements
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function captureFlipState(): any {
	if (isPrefersReducedMotion() || typeof document === 'undefined') return null;
	const cards = document.querySelectorAll('[data-flip-id]');
	if (cards.length === 0) return null;
	registerGsapPlugins();
	return Flip.getState(cards);
}

/**
 * Animate FLIP transition after filter change.
 * Call inside a $effect that watches the filtered list.
 *
 * @param batchSelector - CSS selector for batch items
 * @param flipState - state from captureFlipState(), or null
 * @param batchFired - whether initial render has run (always true after 17e-2; retained for API compat)
 * @param onFlipDone - callback to clear flipState in consumer
 */
export function animateFlipTransition(
	batchSelector: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	flipState: any,
	batchFired: boolean,
	onFlipDone: () => void
): void {
	if (!batchFired || typeof document === 'undefined') return;

	tick().then(() => {
		const batchItems = document.querySelectorAll<HTMLElement>(batchSelector);
		const cards = document.querySelectorAll<HTMLElement>('[data-flip-id]');

		if (flipState && !isPrefersReducedMotion()) {
			gsap.killTweensOf(cards);
			gsap.killTweensOf(batchItems);
			gsap.set(batchItems, { opacity: 1, y: 0 });
			gsap.set(cards, { opacity: 1, y: 0, x: 0, scale: 1 });

			Flip.from(flipState, {
				targets: cards,
				duration: 0.5,
				ease: 'power2.inOut',
				stagger: 0.05,
				onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 }),
				onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 })
			});
			onFlipDone();
		} else {
			batchItems.forEach((el) => {
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
			});
		}
	});
}
```

**Note:** The `onEnter` / `onLeave` callbacks inside `Flip.from` use `fromTo` with `opacity: 0 → 1` — this is not a doctrine violation because it fires only on filter change (user interaction), not on page load or scroll. FLIP state handling naturally requires brief in/out fades for newly-inserted / leaving elements.

- [ ] **Step 4: Run the FLIP test — should PASS**

Run:
```bash
bun run test -- src/lib/motion/utils/flip.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Migrate `BlogListingPage.svelte` off `listingAnimations.ts`**

Edit `src/lib/components/blog/BlogListingPage.svelte`:

1. Change the import (around line 13):

```typescript
// BEFORE:
import { useListingEntrance, captureFlipState, animateFlipTransition } from '$lib/motion/utils/listingAnimations.js';
// AFTER:
import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
```

2. Remove the `useListingEntrance(...)` call (around line 125):

```typescript
// DELETE this line entirely:
useListingEntrance('[data-batch="blog-item"]', () => { batchFired = true; });
```

3. Where `useListingEntrance` used to set `batchFired = true`, set it directly at initialization:

```typescript
// Example pattern — adapt to the actual surrounding code:
let batchFired = true; // always "fired" now — no entrance animation gates FLIP
```

4. Remove any CSS that relies on `opacity: 0` default + a class that `useListingEntrance` used to flip to `opacity: 1`. Check `BlogListingPage.svelte`'s `<style>` block for `[data-batch="blog-item"] { opacity: 0; }` or similar — delete if present.

5. Grep the file for any remaining reference to `useListingEntrance` or `listingAnimations` — should be zero.

- [ ] **Step 6: Migrate `ProjectListingPage.svelte` — same pattern**

Edit `src/lib/components/projects/ProjectListingPage.svelte`:
- Same import swap (line ~15)
- Remove `useListingEntrance('[data-batch="project-item"]', ...)` (line ~139)
- Fix `batchFired` initialization to `true`
- Scrub any `opacity: 0` seed CSS for `[data-batch="project-item"]`

- [ ] **Step 7: Delete `listingAnimations.ts`**

Run:
```bash
rm src/lib/motion/utils/listingAnimations.ts
# Test file may or may not exist
rm src/lib/motion/utils/listingAnimations.test.ts 2>/dev/null || true
```

- [ ] **Step 8: Update `motion/utils/index.ts` barrel**

Read current:
```bash
cat src/lib/motion/utils/index.ts
```

Remove any line that re-exports from `listingAnimations`. Add a re-export from `flip`:

```typescript
export * from './flip.js';
```

(Preserve all other exports — tokens, ticker, gsap, lenis, etc.)

- [ ] **Step 9: Verify grep zero on old symbols**

Run:
```bash
grep -rn "useListingEntrance\|listingAnimations" src/
```

Expected: zero matches.

- [ ] **Step 10: Run tests + type check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: all tests pass (~759 + 4 FLIP = ~763). 0 errors.

- [ ] **Step 11: Preview-verify filter transitions**

Run `bun run dev`. Load `/blog` and `/projects`. Click filter pills:
- Grid should reflow with smooth FLIP animation (cards tween between old/new positions)
- Cards arriving should fade-in briefly (this is FLIP `onEnter`, not a doctrine violation)
- Initial load: cards visible at final state immediately (no fade-up)

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(slice-17e-2): extract FLIP filter primitives to utils/flip.ts; delete listingAnimations.ts"
```

STOP. Tell Yesid:
> "Task 5 done: `utils/flip.ts` holds the FLIP primitives with preserved behavior; `listingAnimations.ts` deleted; BlogListingPage + ProjectListingPage migrated. Tests ~763 passing. Please verify: `/blog` and `/projects` load with cards at final state, then click filters — FLIP reflow works smoothly. Approve to move to Task 6 (`opacity: 0` seed CSS sweep)."

---

## Task 6: Remove seed `opacity: 0` CSS + `MotionPathPlugin` eager import

**Files modified:**
- `src/lib/components/blog/BlogContent.svelte` — lines 84, 107
- `src/lib/components/blog/BlogDetailHeader.svelte` — lines 215, 248, 276, 397
- `src/lib/motion/utils/gsap.ts` — remove `MotionPathPlugin` import + re-export
- `src/lib/motion/utils/gsap.test.ts` — drop `MotionPathPlugin` assertions

**Rationale:** Two cleanups that didn't fit naturally in prior tasks. (1) Any `opacity: 0` in a component's scoped `<style>` that seeds an entrance animation must go — the doctrine wants DOM default = final state (design spec §8 rule 1). (2) `MotionPathPlugin` was kept eager because of the train tree; with the tree gone in Task 2, the plugin has zero consumers and can exit the eager bundle.

- [ ] **Step 1: Audit remaining `opacity: 0` in `src/lib/components/` + `src/lib/motion/`**

Run:
```bash
grep -rn "opacity:\s*0[^.0-9]" src/lib/components/ src/lib/motion/ src/routes/ | grep -v "\.test\.ts"
```

For each hit, classify:

- **Seed CSS for entrance animation** → delete. Signal: the rule targets an element that a removed GSAP timeline used to tween from 0 → 1.
- **Keyframe percentage** (e.g., `50% { opacity: 0; }` inside `@keyframes pulse`) → keep. Ambient.
- **State class** (e.g., `.hero-hidden { opacity: 0 }`) → keep. Interactive / conditional state. Defer to 17e-4 if hero-related.
- **Decorative fractional** (e.g., `opacity: 0.2`) → no action (grep pattern already excludes these via `[^.0-9]`).

Expected seed-CSS hits from plan-time audit:

- `src/lib/components/blog/BlogContent.svelte:84` + `:107` — these are likely seed for post-mount fade-in of code blocks or similar. Read the surrounding CSS rule and the component script to confirm.
- `src/lib/components/blog/BlogDetailHeader.svelte:215, 248, 276, 397` — four seed rules targeting elements that the just-removed entrance timeline (Task 4) used to fade. Delete.

Expected non-seed hits (keep):

- `src/app.css` pulse / ripple keyframe percentages
- `src/lib/components/about/AboutWeather.svelte` particle keyframes
- `src/routes/tech-stack/+page.svelte:204` `.hero-hidden { opacity: 0; }` — state class (review in 17e-4)
- `src/routes/+layout.svelte:63` `from { opacity: 0 }` in a keyframe — route transition (review in 17e-4 or 17e-5)
- `src/lib/components/blog/BlogRouteMap.svelte` various fractional opacities — fine

- [ ] **Step 2: Edit `BlogDetailHeader.svelte`**

Remove the seed `opacity: 0` rules at lines 215, 248, 276, 397 (line numbers approximate — read the file). For each rule:

```css
/* BEFORE — example shape: */
.display-title .char {
  opacity: 0; /* seed for SplitText entrance (removed in 17e-2) */
}

/* AFTER — delete the whole opacity line; keep the rest of the rule */
.display-title .char {
  /* (other properties) */
}
```

If the rule existed *solely* for `opacity: 0`, delete the whole rule block. Run grep in the file to confirm no other CSS depends on the selector.

- [ ] **Step 3: Edit `BlogContent.svelte`**

Inspect lines 84 and 107. Classify:

- If they seed entrance animation (likely target a `.content-block` or similar that used `use:reveal` before Task 3), delete the `opacity: 0` line.
- If they're state rules or decorative (unlikely given context), leave them.

When unsure, start the dev server, load `/blog/[any-slug]`, and view the element in DevTools to see whether opacity changes post-load. If yes → seed → delete. If no → leave.

- [ ] **Step 4: Remove `MotionPathPlugin` from `gsap.ts`**

Edit `src/lib/motion/utils/gsap.ts`:

Delete the `MotionPathPlugin` import (line ~11):
```typescript
// DELETE:
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; // DELETE in 17e-2 (train removal)
```

Remove `MotionPathPlugin` from the `registerPlugin(...)` call:
```typescript
// BEFORE:
gsap.registerPlugin(
  ScrollTrigger,
  MotionPathPlugin,
  DrawSVGPlugin,
  CustomEase,
  SplitText,
  MorphSVGPlugin,
  Flip,
);
// AFTER:
gsap.registerPlugin(
  ScrollTrigger,
  DrawSVGPlugin,
  CustomEase,
  SplitText,
  MorphSVGPlugin,
  Flip,
);
```

Remove from the re-export block:
```typescript
// BEFORE:
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
// AFTER:
export {
  gsap,
  ScrollTrigger,
  DrawSVGPlugin,
  CustomEase,
  SplitText,
  MorphSVGPlugin,
  Flip,
};
```

- [ ] **Step 5: Update `gsap.test.ts`**

Remove the `MotionPathPlugin` import/re-export assertions. Read the current test file and drop any `it('re-exports MotionPathPlugin', ...)` block and any assertion inside `describe('eager registration')` that checks for `gsap.plugins.MotionPathPlugin`.

Keep all SplitText assertions (SplitText stays because `wordmarkHover.ts` uses it).

- [ ] **Step 6: Verify grep zero for `MotionPathPlugin`**

Run:
```bash
grep -rn "MotionPathPlugin\|MotionPath" src/
```

Expected: zero matches outside `node_modules`.

- [ ] **Step 7: Run tests + type check**

```bash
bun run test 2>&1 | tail -10
bun run check 2>&1 | tail -10
```

Expected: tests pass at ~762–763 (one or two MotionPathPlugin-specific tests removed). 0 errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(slice-17e-2): remove seed opacity:0 CSS + MotionPathPlugin (train gone)"
```

STOP. Tell Yesid:
> "Task 6 done: removed seed `opacity: 0` CSS from BlogContent + BlogDetailHeader; dropped `MotionPathPlugin` from eager imports (train tree deleted in Task 2 means zero consumers). Tests + check green. Approve to move to Task 7 (verification pass + bundle-size delta + push)."

---

## Task 7: Verification sweep, bundle-size delta, push

**Files modified:**
- `docs/slices/slice-17e-2-snappy-sweep.md` — fill in bundle-size delta table + iteration log
- `tree.txt` — regenerate (CLAUDE.md closing convention, but formally 17e-6 closing; this is a checkpoint)

- [ ] **Step 1: Full grep-zero sweep on every deleted symbol**

Run each of these. All should return zero matches outside `.test.ts` files of deleted code and outside `docs/`:

```bash
echo "=== use:reveal ==="
grep -rn "use:reveal" src/
echo "=== use:ripple ==="
grep -rn "use:ripple" src/
echo "=== use:tilt ==="
grep -rn "use:tilt" src/
echo "=== reveal action imports ==="
grep -rn "from.*actions/reveal\|import.*actions/reveal" src/
echo "=== ripple action imports ==="
grep -rn "from.*actions/ripple\|import.*actions/ripple" src/
echo "=== tilt action imports ==="
grep -rn "from.*actions/tilt\|import.*actions/tilt" src/
echo "=== train tree ==="
grep -rn "Train\.svelte\|TrainJourney\|TrainTop\|train-path\|train-targets\|TRAIN_TARGETS\|getTrainMotionPath" src/
echo "=== ScrollRail ==="
grep -rn "ScrollRail" src/
echo "=== listingAnimations ==="
grep -rn "useListingEntrance\|listingAnimations" src/
echo "=== MotionPathPlugin ==="
grep -rn "MotionPathPlugin\|MotionPath" src/
```

**All must print zero matches** (aside from echo labels). If any match appears, that's a missed sweep — fix and return to the relevant task.

- [ ] **Step 2: Full test suite + type check**

```bash
bun run test 2>&1 | tail -15
bun run check 2>&1 | tail -10
```

Expected:

- Tests pass. Final count approximately **760–765** (from 802 baseline, minus ~40 deleted tests from ripple/tilt/Train-tree/ScrollRail/reveal/listingAnimations, plus +4 new FLIP tests). Record the exact number.
- `bun run check` = 0 errors, 21 or fewer pre-existing warnings (sweeps may have incidentally fixed some).

- [ ] **Step 3: Bundle-size delta**

Run:
```bash
bun run bundle-size
```

Open `dist/stats.html`. For each route in the baseline table (slice spec Step 1), record the new per-route node gzip size.

Update `docs/slices/slice-17e-2-snappy-sweep.md`'s "Bundle-size delta" table with actual numbers for the "17e-2 end" and "Delta" columns.

Expected deltas:

- **Shared layout (node 0):** small shrink — `MotionPathPlugin` removed from eager bundle (~3–5 KB gzipped). `listingAnimations.ts` deleted (but `flip.ts` has most of its code, so net zero there).
- **Listings (blog, projects, services):** small shrink — less CSS seed, fewer actions. Likely sub-kilobyte.
- **Article details (blog/[slug], projects/[slug], services/[id]):** modest shrink — SplitText entrance gone from two detail headers. Likely 1–3 KB.
- **About route:** biggest per-route shrink expected — was the heaviest reveal/tilt/ripple consumer. Likely 2–5 KB.
- **Home `/`:** near-flat — Manifesto char-stagger stays (17e-3 removes it), and most of the reduction goes to 17e-4/5.
- **Contact:** modest shrink (2 reveals + shared util).

Record actuals even if smaller than predicted. Narrow scope for 17e-2 is correct — the bigger wins are in 17e-3/4/5.

- [ ] **Step 4: Preview-verify critical paths one more time**

Run `bun run dev`. Load each page and confirm final-state rendering:

- `/` — Hero + typewriter + Manifesto (still has char-stagger, that's fine) + Featured Projects (cards at final state) + HomeServices (cards at final state) + HomeCloser (graffiti still animates)
- `/about` — all sections at final state, no fade-up
- `/services/[slug]` — at final state
- `/contact` — terminals at final state
- `/blog` — listing cards at final state; filter click triggers FLIP reflow
- `/blog/[slug]` — header title + tags at final state; content blocks at final state
- `/projects` — listing cards at final state; filter click triggers FLIP reflow
- `/projects/[slug]` — header + sidebar at final state

If anything still animates on load or scroll-into-view (outside the four sanctioned exceptions: hero typewriter, Manifesto char-stagger pending, HomeCloser graffiti, hero scroll-scrub), that's a missed sweep.

- [ ] **Step 5: Update slice spec iteration log**

Edit `docs/slices/slice-17e-2-snappy-sweep.md` — under "## Iteration log" add a per-task summary. Example shape:

```markdown
## Iteration log

- **Task 1 (slice spec):** approved 2026-MM-DD.
- **Task 2 (orphan deletions):** deleted ripple/tilt/Train-tree/ScrollRail + tests; swept 6 call sites. Tests: 802 → 769. Approved 2026-MM-DD.
- **Task 3 (reveal sweep):** deleted reveal.ts + test; swept 27 `use:reveal` across 14 files. Tests: 769 → 759. Approved 2026-MM-DD.
- **Task 4 (entrance strips):** removed GSAP entrance timelines from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar, FeaturedProjects, HomeServices. Approved 2026-MM-DD.
- **Task 5 (FLIP extraction):** created utils/flip.ts; migrated BlogListingPage + ProjectListingPage; deleted listingAnimations.ts. Tests: 759 → 763. Approved 2026-MM-DD.
- **Task 6 (seed CSS + MotionPath):** removed opacity:0 from BlogContent + BlogDetailHeader; dropped MotionPathPlugin eager import. Tests: 763 → ~762. Approved 2026-MM-DD.
- **Task 7 (verification):** grep-zero on 10 deleted-symbol patterns; bundle-size delta recorded; preview spot-check passed.
```

- [ ] **Step 6: Commit spec updates**

```bash
git add docs/slices/slice-17e-2-snappy-sweep.md
git commit -m "docs(slice-17e-2): iteration log + bundle-size delta"
```

- [ ] **Step 7: Push branch**

```bash
git push -u origin feature/slice-17e-2-snappy-sweep
```

STOP. Tell Yesid:
> "17e-2 Snappy Sweep tasks complete. Branch `feature/slice-17e-2-snappy-sweep` pushed. What was delivered:
>
> 1. Deleted 15 files (ripple, tilt, Train tree, ScrollRail, reveal, listingAnimations + their tests).
> 2. Swept 27 `use:reveal` + 2 `use:ripple` + 4 `use:tilt` attributes across 19 component files.
> 3. Stripped GSAP entrance timelines from 5 headers / sidebars / home components.
> 4. Extracted FLIP filter primitives into `motion/utils/flip.ts`.
> 5. Removed seed `opacity: 0` CSS.
> 6. Dropped `MotionPathPlugin` from eager imports (train gone).
>
> Final test count: ~762. `bun run check` = 0 errors. Bundle-size delta recorded in the slice spec. Every article page now renders at final state on load. Manifesto char-stagger still present (17e-3 replaces with crescendo). HomeCloser graffiti preserved per doctrine exception.
>
> Want me to open a PR now, or continue to 17e-3 Scrub Factories first?"

---

## Spec coverage self-check

Every Section 4.4 / 4.5 / 9.1 item in the design spec maps to a task here:

- ✅ Delete `actions/reveal.ts` + test — Task 3
- ✅ Delete `actions/ripple.ts` + test — Task 2
- ✅ Delete `actions/tilt.ts` + test — Task 2
- ✅ Delete `components/ScrollRail.svelte` + test — Task 2
- ✅ Delete `svg/Train*` tree (5 files + 3 tests) — Task 2
- ✅ Split `utils/listingAnimations.ts` — Task 5
- ✅ Strip entrance tweens from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar — Task 4
- ✅ Strip entrance tweens from FeaturedProjects, HomeServices — Task 4
- ✅ Strip staggered list entrance from TagList — Task 3 (`use:reveal` sweep)
- ✅ Strip `opacity: 0` seed CSS — Task 6
- ✅ Move FLIP filter logic to `utils/flip.ts`, remove `useListingEntrance()` — Task 5

**Deferred (correctly out of scope):**

- Manifesto SplitText char-stagger — 17e-3 (crescendo replacement)
- `SplitText` eager import removal — 17e-3 (after Manifesto swap; note: `wordmarkHover` keeps SplitText indefinitely as part of signature 3, so even 17e-3 moves it to lazy, not deleted)
- Scrub factories + crescendo + DrawSVG scrub applications — 17e-3
- Hero timeline rewrite, `heroScrollLock.ts` deletion — 17e-4
- `morphHelpers.ts` → `actions/morphHover.ts`, LED pulse consolidation, RAF consolidation — 17e-5
- MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine section, learning docs — 17e-6

---

## Definition of done (17e-2)

- All 7 tasks approved by Yesid
- Every grep-zero assertion in Task 7 Step 1 returns 0 matches
- `bun run test` — all pass (~762)
- `bun run check` — 0 errors
- Bundle-size delta recorded in slice spec
- Preview-verified: every article page renders at final state on load; only sanctioned motion remains (hero typewriter, hero scrub, Manifesto char-stagger pending, HomeCloser graffiti)
- Branch pushed
- Ready for PR, or session continues to 17e-3
