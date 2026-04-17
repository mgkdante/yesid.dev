# Slice 17e-3 — Scrub Factories

**Status:** In progress
**Branch:** `feature/slice-17e-2-snappy-sweep` (stacking onto 17e-2 — will merge together)
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
4. Three `.rotated-title` divs (Projects / Services / Terminus per D263) each get a crescendo scrub. All three are `<h2>` primary headings — no `aria-hidden`, no tag change, only `transform: scale()`.
5. `BlogBlueprint` SVG + `ProjectsBlueprint` SVG draw themselves as the user scrolls through the listing page's scroll section. `loadDrawSVG()` awaited at route setup. `ServicesBlueprint` scrub applied if visually warranted (evaluated at task time).
6. `SplitText` moves from eager to lazy in `motion/utils/gsap.ts`. `loadSplitText()` async loader exported. `wordmarkHover.ts` awaits the loader before constructing a SplitText instance.
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
- `heroScrollLock.ts` deletion (17e-4 — D264)
- `morphHelpers.ts` relocation (17e-5)
- Ambient RAF consolidation (17e-5)
- Existing DrawSVG on-enter entrances in `SvgIcon`, `DataFlowDiagram`, `StackConnections` (audit at Task 8 may promote one or more to 17e-3 scope, or defer to a later ticket)

## Iteration log

- **Task 1 (slice spec):** approved. Commit `3eb10ce`.
- **Task 2 (createCrescendoScrub):** sync factory + 6 tests (reduced-motion branch, trigger wiring, destroy safety). TDD RED → GREEN. Tests needed `vi.clearAllMocks()` + `ScrollTrigger.getAll().forEach(kill)` in beforeEach to isolate state across tests. Commit `ae1e310`.
- **Task 3 (createDrawScrub):** sync factory + 6 tests + `scrubs/index.ts` barrel. Accepts `svgRoot: Element` (not `SVGElement`) so callers can pass a wrapper `<div>` + `pathSelector: 'svg path'` — matches BlueprintShell's nested-SVG structure. Initial pass had 3 unused `@ts-expect-error` directives the type checker rejected (drawSVG is typed via plugin augmentation); removed. Commit `cfeea2d`.
- **Task 4 (Manifesto entrance strip + crescendo):** deleted the entire 15-tween `onMount` timeline (circuit grid, stripes, beck lines, roundels, 4 edges, transit, prompt, SplitText char-reveals on 3 lines, pills, flow lines, ScrollTrigger). Removed `SplitText` + `line1El`/`hugeEl`/`line3El` bindings. Applied crescendo to `.manifesto__statement` container with `minScale: 0.85, maxScale: 1.0` (gentle breath). Flipped 11 seed `opacity: 0` CSS declarations across Manifesto.svelte + ManifestoEdgeLeft/Right/Top/Bottom.svelte + ManifestoTransit.svelte so elements render at final state on load. Preserved countdown interval (ambient — 17e-5 moves to shared ticker). **Yesid approved visually at STOP: "Manifesto looks amazing."** Commit `bc67993`.
- **Task 5 (3 rotated edge titles):** added bindings to 3 sections + 3 titles in HomePage.svelte; `onMount` wires crescendo to each (mobile gate via `matchMedia('(max-width: 1023px)')` skips wiring when `.rotated-title` is `display: none`). **CSS fix:** left-side rotation switched from `transform: rotate(180deg)` to individual `rotate: 180deg` CSS property so the `transform` slot is free for the crescendo's scale. Per D263, all 3 titles are `<h2>` primary headings — kept semantic, no `aria-hidden`. Commit `2d8a8de`.
- **Task 6 (Blueprint draw-scrubs):** BlogListingPage + ProjectListingPage wired — `blueprintWrapEl` + `listingSectionEl` bindings; `onMount` awaits `loadDrawSVG()` then calls `createDrawScrub(blueprintWrapEl, { section, pathSelector: 'svg path' })`. Pattern avoids modifying BlueprintShell. ServicesBlueprint not wired (0.08 opacity — too faint for visible scrub impact; can revisit). Commit `3e998f8`.
- **Task 7 (SplitText lazy migration):** **DEFERRED per plan escape clause.** `wordmarkHover.test.ts` has 7 tests tightly coupled to synchronous SplitText invocation (expects `SplitText` to have been called WithCalls in same tick). Refactoring all 7 tests + introducing async timing = significant rework bleeding into later slices. Cost of defer: ~8 KB in shared bundle until 17e-5 or later addresses wordmarkHover. SplitText stays eager.
- **Task 8 (SEO DOM-default-state audit):** grep'd every `opacity: 0`, `stroke-dashoffset: 100%`, `transform: scale(0)`, `font-size: 0` in src/. All remaining hits are keyframe percentages, state classes (menu/nav toggles, stack-node hidden), hover-interaction seeds (BlogContent heading marks, copy button), or GSAP programmatic state inside animation bodies (not default CSS).

  **D266 — Doctrine clarification:** DrawSVG on-enter (stroke-tracing) is NOT a Snappy Doctrine violation — the drawing motion IS the content, not a delivery mechanism. Pure fade/scale/stagger reveals remain forbidden (they read as loading states). Yesid's ruling to be amended into design spec §2 during 17e-6 closing.

  **Re-classified audit (post-D266):**
  - *Cleared (drawing-motion-is-content):* `SvgIcon.animateDraw`, `SvgIcon.animateDrawFill`, `DataFlowDiagram` DrawSVG entrance, `StackConnections` DrawSVG entrance.
  - *Still flagged (delivery-mechanism reveals, doctrine violations):* `SvgIcon.animateMorph` (opacity + scale fade-in, no drawing), `SvgIcon.animateStagger` (y + opacity fade-up), `StackScenarioCard.svelte:43` (y + opacity fade-up). Recommendation: remove the two SvgIcon variants if unused (audit consumers), or replace with drawing-based variants; strip StackScenarioCard entrance. Fold into 17e-5 or follow-up ticket.

  No fixes in 17e-3.
- **Task 9 (verification):** grep-zero confirmed scrub factory usage at expected sites (4 crescendo applications: Manifesto statement + 3 rotated titles; 2 draw-scrub applications: BlogBlueprint + ProjectsBlueprint). `bun run test`: 767/767 pass. `bun run check`: 0 errors, 19 warnings (−1 from 17e-2 end). Bundle-size delta recorded in `dist/stats.html`.

**Test count journey:** 755 (17e-2 end) → 761 (Task 2 +6 crescendo tests) → 767 (Task 3 +6 draw-scrub tests) → 767 (Tasks 4-6 no new tests — component integrations). `bun run check`: 0 errors throughout.

**Re-evaluation candidates surfaced for later slices:**
- MotionPathPlugin lazy-load (17e-5 when StackConnections is touched)
- SplitText lazy-load (any slice that refactors wordmarkHover)
- ServicesBlueprint draw-scrub (optional polish — too faint currently)
- SvgIcon + DataFlowDiagram + StackConnections + StackScenarioCard on-enter entrance removal (17e-5 or dedicated doctrine-enforcement pass)
- Ripple click-feedback reconsideration — Yesid noted "the hover + ripple animations were great"; CSS `:active` flash is a doctrine-compatible alternative if desired
