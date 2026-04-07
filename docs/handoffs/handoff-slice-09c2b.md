# Handoff: Slice 09c-2b — Polish Enhancements (Final Iteration Fixes)

## 1. Objective Completed

**Implemented:**
- Fixed invisible metro lines on `/work` listing page (SVG gradient `url(#id)` paint-server broken in SPA context)
- Added hover/tap lock during SVG entrance animations in BlogSvgIcon and WorkSvgIcon
- Removed excess top padding on `/work` route
- Fixed "clear filters" button not resetting card visibility on `/work`
- Added tech stack filter (third filter dimension) to `/work` page
- Matched `/work` side padding to `/blog` (removed redundant `<main>` wrapper)
- Made desktop filter sidebars and mobile filter panels scrollable when content overflows
- Made all filter sections (Services, Tech Stack, Tags, Language, Date Range) collapsible on desktop

**Intentionally not implemented:**
- SVG gradient on metro lines (dropped in favor of direct color; gradient was imperceptible on 2px line and `url(#id)` is unreliable in SvelteKit SPA routing)

## 2. High-Level Summary

This session resolved bugs, added features, and polished the work/blog listing UX across two sub-sessions. Metro line SVGs fixed (gradient `url(#id)` → direct color). SVG icon hover locked during entrance animations. "Clear filters" fixed with `batchFired` + `$effect` pattern. Tech stack added as a third filter dimension with `getAllStackItems()` helper. Work route padding matched to blog by removing redundant `<main>` wrapper. Filter sidebars made scrollable with `max-h` + `overflow-y-auto`. All FilterGroup sections made collapsible with `collapsible`/`startOpen` props; blog date range section collapsible inline.

## 3. Files Created

| File | Purpose |
|------|---------|
| `docs/handoffs/handoff-slice-09c2b.md` | This handoff |
| `docs/devlog/2026-04-06-slice-09c2b.md` | Session devlog |

## 4. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/lib/components/WorkListingPage.svelte` | Replaced SVG gradient metro lines with direct color; added `batchFired` + `$effect` for filter visibility; added `activeStack` filter; added `stack` prop pass-through | Metro line fix, clear filters fix, tech stack filter |
| `src/lib/components/WorkSvgIcon.svelte` | Added `entranceDone` flag; guarded all hover/tap handlers; added `onComplete` to entrance timeline | Prevent hover morph from interrupting draw-fill entrance animation |
| `src/lib/components/BlogSvgIcon.svelte` | Added `entranceDone` flag; guarded all hover/tap handlers; threaded `onDone` callback through all 4 animation functions | Same hover-during-entrance protection for all animation types |
| `src/routes/work/+page.svelte` | Removed redundant `<main class="mx-auto max-w-5xl px-4 md:px-8">` wrapper | Root layout already provides padding; double wrapper caused narrower content |
| `src/routes/work/+page.ts` | Added `getAllStackItems()` import and `stackItems` to load data | Provide tech stack items for filter UI |
| `src/lib/data/projects.ts` | Added `getAllStackItems()` function | Extract deduplicated sorted tech stack from public projects |
| `src/lib/data/index.ts` | Added `getAllStackItems` to barrel export | Make new helper accessible via `$lib/data` |
| `src/lib/components/FilterGroup.svelte` | Added `collapsible` and `startOpen` props; toggle label with chevron | Collapsible filter sections on desktop |
| `src/lib/components/WorkFilterSidebar.svelte` | Added stack section; enabled `collapsible` on all FilterGroups; added `max-h` + `overflow-y-auto` | Tech stack filter, collapsible sections, scrollable |
| `src/lib/components/WorkFilterMobile.svelte` | Added stack section; added `max-h-[60vh] overflow-y-auto` | Tech stack filter on mobile, scrollable panel |
| `src/lib/components/BlogFilterSidebar.svelte` | Enabled `collapsible` on FilterGroups; made date range collapsible inline; added `max-h` + `overflow-y-auto` | Collapsible sections, scrollable |
| `src/lib/components/BlogFilterMobile.svelte` | Added `max-h-[60vh] overflow-y-auto` | Scrollable mobile filter panel |

## 5. Data Model Changes

- Added `getAllStackItems()` to `projects.ts` — extracts deduplicated, sorted tech stack strings from all public projects. Same pattern as `getAllTags()`.
- No type/interface changes.

## 6. Commands Executed

```bash
bun run dev
bun run test (bunx vitest run)
bun run check
```

## 7. Validation Results

```
bun run test: PASS (329 tests across 42 files, 0 failures)
bun run check: PASS (0 errors, 10 pre-existing warnings)
```

## 8. Errors Encountered

No errors encountered.

## 9. Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Metro lines invisible on /work | Replaced gradient `url(#id)` with direct color | `WorkListingPage.svelte` |
| 2 | Hover during entrance breaks animation | Added `entranceDone` flag to both icon components | `BlogSvgIcon.svelte`, `WorkSvgIcon.svelte` |
| 3 | Too much top padding on /work | Removed `pt-12` from route wrapper | `+page.svelte` |
| 4 | Clear filters broken + add tech stack filter | `batchFired` effect + `getAllStackItems()` + stack filter UI | `WorkListingPage`, `projects.ts`, filter components |
| 5 | Work padding doesn't match blog | Removed redundant `<main>` wrapper (root layout already provides) | `+page.svelte` |
| 6 | Filter sidebars should scroll when needed | Added `max-h` + `overflow-y-auto` to all 4 filter components | Sidebar + mobile filter components |
| 7 | Filter sections should be collapsible | Added `collapsible`/`startOpen` to FilterGroup; inline collapse for date range | `FilterGroup.svelte`, both sidebars |
| Final | Approved | -- | -- |

## 10. Assumptions Made

- Gradient on 2px metro line was imperceptible — direct color is visually equivalent
- `onComplete` on GSAP timeline fires after all staggered children complete (verified via GSAP docs)
- Scroll-triggered animations in BlogSvgIcon: `entranceDone` stays `false` until the scroll-triggered animation actually plays AND completes, not just when ScrollTrigger initializes

## 11. Known Gaps / Deferred Work

- SVG metro line gradient could be restored using CSS `background: linear-gradient()` on a `<div>` instead of SVG paint-server, if the visual distinction matters in future
- The `entranceDone` flag does not handle the edge case where reduced-motion users hover (they get `entranceDone = false` permanently, but hover is also gated by `isPrefersReducedMotion()` so this is a non-issue)

## 12. What Yesid Should Know

**SVG `url(#id)` in SPAs:** This is a known cross-browser issue. SVG paint servers (gradients, patterns, clip-paths) referenced via `url(#local-id)` can break when the document's base URI changes during SPA navigation. The browser resolves the fragment relative to the current URL, which may not match where the SVG `<defs>` lives. BlogRow worked because it used a direct color string. The fix is always: use direct values or CSS alternatives when possible.

**GSAP `onComplete` with stagger:** When using `gsap.to()` with `stagger`, `onComplete` fires per-element, not once for the whole batch. That's why all animation functions were refactored to use `gsap.timeline()` wrappers — the timeline's `onComplete` fires once after all children finish.

## 13. Next Recommended Slice

Slice 09b — About + Contact Pages. Per PLAN.md: bio section with fade entrance, focus areas, skills with stagger tags, contact links from SiteMeta with boop hover. Depends on slices 02, 03, 07. Estimated 1 session.

## 14. Final Status

**COMPLETE** — all acceptance criteria met, all tests pass, Yesid approved all three fixes.
