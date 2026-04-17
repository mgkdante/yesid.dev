# Handoff: Slice 17e-1 — Motion Foundation

**PR:** [yesid.dev#12](https://github.com/mgkdante/yesid.dev/pull/12) (merged 2026-04-16)
**Branch:** `feature/slice-17e-1-foundation` (deleted after merge)
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-1-foundation.md`
**Slice spec:** `docs/slices/slice-17e-1-foundation.md`

## 1. Objective Completed

**Implemented:**

- Motion timing tokens in `src/lib/styles/tokens.css` (added `--duration-instant`, `--ease-out`, `--ease-in-out`; upgraded `--ease-default` from the CSS keyword `ease` to explicit `cubic-bezier(0.4, 0, 0.2, 1)` Material standard).
- `src/lib/motion/tokens.ts` — TypeScript mirror of the CSS tokens for JS consumers.
- Parity test (`tokens.test.ts`) that parses `tokens.css` at test time and asserts every `--duration-*` / `--ease-*` has a matching TS constant. Drift between CSS and TS is caught by `bun run test`.
- `src/lib/motion/utils/ticker.ts` — shared `gsap.ticker` wrapper with `subscribe(id, fn)` + `unsubscribe(id)`. One internal `gsap.ticker.add` call fans out to all subscribers.
- `src/lib/motion/utils/gsap.ts` — hybrid eager + lazy plugin loading. `registerGsapPlugins()` keeps its full eager batch (no consumer breaks); `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` added as async idempotent loaders for subsequent migration.
- `src/lib/motion/utils/lenis.ts` — `ScrollTrigger.normalizeScroll({ allowNestedScroll: true })` removed. Touch devices now use native browser scroll — this is the tap-vs-click bug fix.
- `rollup-plugin-visualizer@7.0.1` added; `bun run bundle-size` script builds prod and emits `dist/stats.html` (treemap). Baseline per-route node gzipped sizes recorded in the slice spec.
- Motion barrel exports (`src/lib/motion/index.ts`, `src/lib/motion/utils/index.ts`) extended to expose tokens, lazy loaders, and ticker API through `$lib/motion`.
- Supporting test infrastructure: `src/tests/setup.dom.ts` gained `gsap.ticker` + `gsap.plugins` + `ScrollTrigger.isTouch` + `ScrollTrigger.update` stubs so the new motion tests run cleanly.

**Intentionally not implemented:**

- Deletion of `use:reveal` and all entrance animations site-wide → 17e-2 (Snappy Sweep).
- Scrub factories (`createDrawScrub`, `createCrescendoScrub`, `createHeroTimeline`, `createCloserTimeline`) → 17e-3 / 17e-4.
- Consolidating the four `@keyframes pulse` copies, three cursor-blink implementations, and three RAF loops onto the shared ticker → 17e-5.
- Migrating consumers off the eager GSAP imports (so they go through the lazy loaders only) → 17e-2 onward. Eager path stays through 17e-1 to guarantee zero consumer breakage.
- Rewriting MOTION.md v2.0 and amending CONSTITUTION.md with the Snappy Doctrine → 17e-6 (full slice close).
- Learning docs under `docs/learn/motion/` → 17e-6 closing.

## 2. High-Level Summary

Pure infrastructure sub-slice. The motion layer now has a typed source of truth for durations + easings (backed by a parity test against the CSS tokens), a single shared RAF loop the rest of the site can subscribe to, lazy per-plugin GSAP loading ready to unlock bundle-size wins as consumers migrate, and mobile touch behavior restored to native — which resolves the tap-vs-click bug that made TocPill open on vertical scroll and ProjectsStrip links fire on horizontal swipe.

No visual changes to the site. No behavioral changes on desktop. One behavioral change on touch devices: native scroll replaces the jacked scroll driven by `ScrollTrigger.normalizeScroll`. The mobile real-device validation on real iPhone + Android was called out as owed verification in the PR test plan — Yesid confirmed the mobile behavior is correct before approving the merge.

## 3. Files Created

| File | Purpose |
|------|---------|
| `docs/slices/slice-17e-1-foundation.md` | Narrow slice spec + baseline bundle table |
| `src/lib/motion/tokens.ts` | TypeScript mirror of `tokens.css` motion tokens |
| `src/lib/motion/tokens.test.ts` | Parity test — CSS ↔ TS tokens |
| `src/lib/motion/utils/ticker.ts` | Shared `gsap.ticker` subscribe/unsubscribe |
| `src/lib/motion/utils/ticker.test.ts` | Ticker unit tests |
| `src/lib/motion/utils/lenis.test.ts` | Lenis init/destroy + `normalizeScroll` assertions |

## 4. Files Modified

| File | What Changed | Why |
|------|--------------|-----|
| `src/lib/styles/tokens.css` | +4 motion tokens; `--ease-default` upgraded | Complete motion token set for 17e vocabulary; explicit cubic-bezier replaces the CSS `ease` keyword for consistency |
| `src/lib/motion/utils/gsap.ts` | Added 4 lazy loaders + `loadedPlugins` set | Hybrid eager + lazy path so consumers keep working while migration lands in later sub-slices |
| `src/lib/motion/utils/gsap.test.ts` | +10 tests for lazy loaders | TDD RED → GREEN for new surface |
| `src/lib/motion/utils/lenis.ts` | Removed `ScrollTrigger.normalizeScroll(...)` calls | Fixes tap-vs-click bug on mobile |
| `src/lib/motion/index.ts` | Export `./tokens.js` | Barrel surface |
| `src/lib/motion/utils/index.ts` | Export lazy loaders + ticker API | Barrel surface |
| `src/tests/setup.dom.ts` | Added `gsap.ticker`, `gsap.plugins`, `ScrollTrigger.isTouch`, `ScrollTrigger.update` stubs | New motion tests need these spyable surfaces |
| `vite.config.ts` | Added `visualizer` plugin | Bundle-size tooling |
| `package.json` | Added `bundle-size` script + `rollup-plugin-visualizer` dev dep | Bundle-size tooling |
| `bun.lock` | Lockfile update | `rollup-plugin-visualizer@7.0.1` installed |

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Deferred to 17e-6 closing | `docs/learn/motion/*.md` | motion |

_Slice 17e-1 is the first of six sub-slices. Per the plan, the motion knowledge base lands in one batch at 17e-6 closing rather than per sub-slice._

## 5. Data Model Changes

None. No user data types touched. Only motion-layer TypeScript types were added (`DurationKey`, `EaseKey` exported from `motion/tokens.ts`), and they describe token keys, not user data.

## 6. Commands Executed

```bash
# Initial exploration
git status
git branch --show-current
git log --oneline -5
git log main..HEAD --oneline
git log main..HEAD --stat

# Handle uncommitted planning-session work
git diff docs/roadmap/PLAN.md
git add docs/roadmap/PLAN.md docs/specs/2026-04-16-cms-payload-design.md
git commit -m "docs(slice-18): CMS pivot to Payload in separate repo"
git push -u origin feature/slice-17e-planning
gh pr create --base main --head feature/slice-17e-planning ...  # PR #11

# After PR #11 merged
git checkout main
git pull origin main
git checkout -b feature/slice-17e-1-foundation

# Task 1 — slice spec
git add docs/slices/slice-17e-1-foundation.md
git commit -m "docs(slice-17e-1): slice spec for motion foundation"

# Task 2 — motion tokens
bun run check                                                     # 0 errors, 21 warnings
bun run test                                                      # 769/769
# edit src/lib/styles/tokens.css
git add src/lib/styles/tokens.css
git commit -m "feat(slice-17e-1): extend motion tokens (instant, out, in-out, bounce)"

# Task 3 — tokens.ts + parity test
# create tokens.test.ts
bun run test -- src/lib/motion/tokens.test.ts                    # RED — module not found
# create tokens.ts
bun run test -- src/lib/motion/tokens.test.ts                    # GREEN — 11/11
git add src/lib/motion/tokens.ts src/lib/motion/tokens.test.ts
git commit -m "feat(slice-17e-1): motion tokens.ts with parity test against tokens.css"

# Task 4 — shared ticker
# create ticker.test.ts
bun run test -- src/lib/motion/utils/ticker.test.ts              # RED — module not found
# create ticker.ts
bun run test -- src/lib/motion/utils/ticker.test.ts              # FAIL 5/5 — mock missing ticker
# edit src/tests/setup.dom.ts (add ticker, plugins stubs)
bun run test -- src/lib/motion/utils/ticker.test.ts              # GREEN — 5/5
bun run test                                                      # 785/785
git add src/lib/motion/utils/ticker.ts src/lib/motion/utils/ticker.test.ts src/tests/setup.dom.ts
git commit -m "feat(slice-17e-1): shared gsap.ticker wrapper with subscribe/unsubscribe"

# Task 5 — lazy GSAP loaders
# extend gsap.test.ts
bun run test -- src/lib/motion/utils/gsap.test.ts                # RED — loaders not defined (10 fail, 11 pass)
# rewrite gsap.ts with lazy loaders
bun run test -- src/lib/motion/utils/gsap.test.ts                # GREEN — 21/21
bun run test                                                      # 795/795
bun run check                                                     # 0 errors
git add src/lib/motion/utils/gsap.ts src/lib/motion/utils/gsap.test.ts
git commit -m "feat(slice-17e-1): add lazy GSAP plugin loaders alongside eager registration"

# Task 6 — remove normalizeScroll
# create lenis.test.ts
bun run test -- src/lib/motion/utils/lenis.test.ts               # RED — 2 fail on normalizeScroll
# rewrite lenis.ts (normalizeScroll removed)
bun run test -- src/lib/motion/utils/lenis.test.ts               # GREEN — 7/7
bun run test                                                      # 802/802
bun run check                                                     # 0 errors
git add src/lib/motion/utils/lenis.ts src/lib/motion/utils/lenis.test.ts src/tests/setup.dom.ts
git commit -m "fix(slice-17e-1): remove normalizeScroll — fixes tap-vs-click bug on mobile"

# Task 7 — bundle-size tooling
bun add -d rollup-plugin-visualizer                              # EPERM on first try, succeeded on retry
# edit vite.config.ts
# edit package.json (add bundle-size script)
bun run bundle-size                                              # builds; dist/stats.html created
bun run test                                                      # 802/802
bun run check                                                     # 0 errors
git add package.json bun.lock vite.config.ts docs/slices/slice-17e-1-foundation.md
git commit -m "chore(slice-17e-1): add rollup-plugin-visualizer + bun run bundle-size"

# Task 8 — barrel + push
# edit src/lib/motion/utils/index.ts, src/lib/motion/index.ts
bun run check                                                     # 0 errors
bun run test                                                      # 802/802
git commit -m "chore(slice-17e-1): export tokens + ticker + lazy loaders from motion barrel"
git push -u origin feature/slice-17e-1-foundation
gh pr create ...                                                  # PR #12

# Post-merge
git checkout main
git pull origin main
git branch -d feature/slice-17e-1-foundation feature/slice-17e-planning
```

## 7. Validation Results

```
bun run check: PASS — 0 errors, 21 pre-existing warnings (unchanged from baseline)
bun run test:  PASS — 802/802 tests passing
  Delta from baseline (769):
    + 11 tokens.test.ts (parity)
    +  5 ticker.test.ts
    + 10 gsap.test.ts (lazy-loader additions — 11 existing retained)
    +  7 lenis.test.ts (new)
    = +33 tests total
bun run bundle-size: PASS — dist/stats.html generated
  4 vite warnings about static+dynamic imports of DrawSVG/MorphSVG/Flip/CustomEase.
  Expected: this is the Option B hybrid state from Task 5; warnings resolve when
  17e-2+ deletes the eager imports.
```

Mobile real-device verification (TocPill tap + ProjectsStrip tap) was performed by Yesid on a physical iPhone + Android before approving the PR merge.

## 8. Errors Encountered

- **Error:** `Error: The vi.spyOn() function could not find an object to spy upon. The first argument must be defined.` on `vi.spyOn(gsap.ticker, 'add')`.
  - **Cause:** The global GSAP mock in `src/tests/setup.dom.ts` lacked a `ticker` property.
  - **Fix:** Added `ticker: { add, remove, lagSmoothing }` + empty `plugins: {}` to the mock.
  - **Resolved:** yes (bundled into the ticker commit).

- **Error:** `vi.spyOn(..., 'isTouch', 'get')` from the plan's suggested lenis test style failed because `ScrollTrigger.isTouch` is a value, not an accessor on the mock.
  - **Cause:** Plan assumed accessor form; mock exposes a plain property.
  - **Fix:** Wrote `setTouch(n)` helper that directly sets `(ScrollTrigger as { isTouch: number }).isTouch = n`.
  - **Resolved:** yes (lenis tests pass with the simpler approach).

- **Error:** `bun add -d rollup-plugin-visualizer` failed on first attempt with `EPERM moving source-map to cache dir`.
  - **Cause:** Windows file-lock race with a concurrent process (likely another Node process holding the module cache file).
  - **Fix:** Retried immediately; succeeded on second attempt.
  - **Resolved:** yes.

## 9. Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 0 | Branch was `feature/slice-17e-planning` with 2 docs-only commits ahead of main; plan required 17e-1 to branch from main. | Proposed three options; Yesid chose Option 2 (merge planning first via docs-only PR, then branch from updated main). Opened PR #11, merged, branched 17e-1 from updated main. | docs-only — design spec + plan + CMS pivot |
| Tasks 1–8 | — | Approved on first pass each. | — |

## 10. Assumptions Made

- **Option B hybrid (eager + lazy imports coexist)** is correct for 17e-1 scope. Consumer migration to lazy-only happens in 17e-2+. Design spec §9.1 + plan Task 5 Step 4 confirm this.
- **Baseline bundle sizes** recorded as per-route SvelteKit node gzipped sizes only (not full per-route initial JS including shared chunks). Rationale: consistent metric to diff against across sub-slices; `dist/stats.html` treemap is the authoritative source for the §6.2 per-route budgets. Documented this methodology choice in the baseline section of the slice spec.
- **Stale comments referencing `normalizeScroll`** in `+layout.svelte:24`, `heroTimeline.ts:197`, `HeroBanner.svelte:16` left untouched — out of Task 6 scope; will be cleaned up organically in 17e-4 hero rewrite.
- **The `--ease-default` curve upgrade (CSS `ease` → explicit `cubic-bezier(0.4, 0, 0.2, 1)`)** is intentional per the plan. 31 component files consume this token; the subjective feel of hover transitions shifts slightly (Material standard vs CSS default). Plan text called this "no regression expected," but the practical effect is a subtle curve feel change across those 31 files. Flagged at Task 2 STOP; Yesid approved.

## 11. Known Gaps / Deferred Work

- **MOTION.md v2.0** not written (17e-6 closing).
- **CONSTITUTION.md Snappy Doctrine** section not yet added (17e-6 closing).
- **CSS.md** not yet updated to reference the motion token set (17e-6 closing).
- **Learning docs** under `docs/learn/motion/` not written (17e-6 closing, per plan).
- **Consumer migration** from eager GSAP imports to lazy loaders (17e-2+).
- **Stale `normalizeScroll` comments** in hero files (17e-4).
- **`SplitText` + `MotionPathPlugin` eager imports** still present — deleted in 17e-3 (crescendo replaces char-stagger) and 17e-2 (train removal) respectively when their consumers vanish.

## 12. What Yesid Should Know

**Why the tap-vs-click fix is just a one-line deletion.** The root cause was `ScrollTrigger.normalizeScroll({ allowNestedScroll: true })` applying `touch-action: pan-x pinch-zoom` to `html` and `body`. That CSS declaration alters iOS's click-synthesis behavior — specifically, when a touch moves more than a pixel or two, iOS no longer fires a `click` event on the initial target, but it does fire `click` on the current target when the finger lifts. This produced the observed symptoms: TocPill got click-fired when a scroll gesture passed over it; ProjectsStrip links got click-fired when a horizontal swipe ended over them. Removing the `normalizeScroll` call reverts `touch-action` to browser default, and iOS's click heuristics behave as users expect again.

**Why we added `plugins: {}` to the mock even though no test uses it directly.** It's a future-proofing stub for 17e-3/4 when `createHeroTimeline` and `createDrawScrub` may assert on registered plugins. Cheaper to add it now with the ticker stub than to remember later.

**Why the plan's stated 6-test ticker count was 5 in practice.** The plan's STOP message text undercounted by one — the test file has 5 `it(...)` blocks. No scope change, just copy-text drift.

**Interpretation of "no visual regression" in this sub-slice.** The docs in the plan claimed "no visual regression expected" because the new tokens aren't consumed. That's true for the 3 new tokens (`instant`, `out`, `in-out`). It's NOT precisely true for `--ease-default`'s curve upgrade — that IS consumed by 31 component files, and the hover/transition feel shifts subtly. If anything looks wrong on hover or menu interactions, the culprit is the upgraded curve, and the fix is either reverting to `ease` or dialing a different cubic-bezier.

## 13. Next Recommended Slice

**17e-2 Snappy Sweep** — the big deletion pass:

- Delete `src/lib/motion/actions/reveal.ts` + all 27+ call sites across services, about, contact, blog, projects pages
- Delete `src/lib/motion/actions/ripple.ts`, `tilt.ts`
- Delete the orphaned `motion/svg/Train*` tree (imported nowhere outside its own tests)
- Delete `motion/components/ScrollRail.svelte`
- Strip entrance tweens from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar, FeaturedProjects, HomeServices, TagList, ProjectCard, BlogRow, ProjectMiniCard
- Remove `opacity: 0` seed CSS from listings
- Move FLIP filter logic to `motion/utils/flip.ts`, delete `useListingEntrance()`

Opening line for the 17e-2 slice spec:

> "Remove every on-load and on-scroll-into-view entrance animation site-wide. Content renders at its final state. Motion only triggers on interaction, scroll-scrub, or idle ambient — the Snappy Doctrine. One documented exception: HomeCloser graffiti."

Expected bundle-size delta against the baseline recorded in `slice-17e-1-foundation.md`: the deletions in 17e-2 don't shrink the bundle much on their own (tree-shaking already elides `actions/reveal.ts`'s small surface); the real gains come in 17e-3/4/5 when lazy loaders activate. Still report per-route deltas in the 17e-2 handoff for trend visibility.

## 14. Final Status

**COMPLETE** — all 8 tasks approved, PR #12 merged to main, all tests pass, mobile tap-vs-click fix validated on real iOS + Android devices.

Full-slice closing artifacts (MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine amendment, learning docs) are correctly deferred to 17e-6 per the design spec.
