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

(Fill in per task as the session progresses.)
