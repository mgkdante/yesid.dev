# Slice 09c — Blog + Work + Services Polish & DRY Pass

**Status:** planned
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 09, 08, 07

## Objective

Enhance the visual polish and micro-interactions across blog, work, and services pages. Componentize shared patterns. DRY audit across all three sections. NO new pages or routes — only enhancement of existing components.

## Rules

1. **Keep all existing components** — enhance styling only, never replace
2. **Existing tests must stay green** — add new tests for new interactions
3. **All motion respects `prefers-reduced-motion`**
4. **All content stays data-driven** — no hardcoded text

## Quick Wins (< 30 min each)

### QW-1: Add `use:tilt` to WorkCard
- File: `src/lib/components/WorkCard.svelte`
- Add `use:tilt={{ maxDeg: 1.5 }}` to the `<a>` wrapper
- `tilt.ts` already exists and is unused on cards

### QW-2: Add `use:magnetic` to tag pills
- Files: `BlogRow.svelte`, `WorkCard.svelte`, filter pills
- Import and apply `use:magnetic` from existing action

### QW-3: Add `use:ripple` to filter buttons
- Files: `BlogFilterSidebar.svelte`, `WorkFilterSidebar.svelte`
- Import and apply `use:ripple` from existing action

### QW-4: Reading time in BlogDetailHeader
- File: `src/lib/components/BlogDetailHeader.svelte`
- Calculate word count in load function, display as "X min read" next to date
- JetBrains Mono, same style as existing meta badges

### QW-5: Clickable tech tags in WorkDetailSidebar
- File: `src/lib/components/WorkDetailSidebar.svelte`
- Wrap tag `<span>` in `<a href="/work?tag={tag}">` — filter system already supports URL params

## Medium Enhancements (1-2 hours each)

### ME-1: Cursor-following glow (`use:cursorGlow` action)
- Create: `src/lib/motion/actions/cursorGlow.ts`
- Pattern: same as `tilt.ts` — tracks `pointermove`, updates CSS custom properties `--glow-x`, `--glow-y`
- Apply to: BlogRow, WorkCard
- BlogRow already has static radial-gradient glow — make it follow the pointer

### ME-2: Reading progress bar on blog detail
- Add fixed `<div>` at top of viewport, `scaleX()` driven by scroll position
- Orange-to-yellow gradient matching brand
- Track only `.blog-content` scroll progress
- Use existing `scrollY` store or IntersectionObserver

### ME-3: Animated gradient border on WorkCard hover
- Pure CSS: `@property --angle` + `conic-gradient(from var(--angle), #E07800, #FFB627, transparent, #E07800)`
- Animation paused by default, plays on hover
- Replaces current static border-color transition

### ME-4: ScrollTrigger.batch() for listing entrances
- Files: `BlogListingPage.svelte`, `WorkListingPage.svelte`
- Replace individual `use:reveal` with parent-level `ScrollTrigger.batch()`
- Cards cascade in waves rather than individual triggers

### ME-5: Code block copy button
- File: `src/lib/components/BlogContent.svelte`
- Overlay copy icon top-right of `<pre>` blocks
- Click → copy to clipboard → show checkmark for 2s
- CSS overlay + minimal JS

### ME-6: Heading anchor links
- File: `src/lib/components/BlogContent.svelte`
- `h2`, `h3` show `#` link on hover (slides in from left)
- CSS `::before` pseudo-element

## Metro/Transit Brand Enhancements

### MT-1: Metro line in blog listing
- Thin vertical `#E07800` line with circle nodes between BlogRows
- Adapts StationDivider/metro line pattern from services page

### MT-2: Station number badges on listings
- BlogCard already has `padStart(2, '0')` — extend to BlogRow and WorkCard
- Small circular badge with monospace number

### MT-3: "Next/Previous Stop" nav on work detail
- Reuse `ServiceNav.svelte` pattern (or extract shared `StopNav.svelte`)
- Add to bottom of WorkDetailPage

### MT-4: Animated dashed separators
- DrawSVGPlugin dashed line between sections
- Draws in on scroll enter

## DRY Consolidation

### DRY-1: Extract CollapsibleSection component
- Used in: WorkDetailPage, ServiceDetailPage
- Pattern: border-l-[3px], bg-[#141414], chevron toggle, grid expand
- Extract into reusable `CollapsibleSection.svelte`

### DRY-2: Shared filter sidebar pattern
- BlogFilterSidebar + WorkFilterSidebar have similar structure
- Extract common filter rendering logic

### DRY-3: Standardize card hover patterns
- WorkCard, BlogRow, ProjectMiniCard all have hover effects
- Ensure consistent timing, easing, glow intensity

### DRY-4: Audit hardcoded content
- Scan for any hardcoded English strings in component templates
- Move to data layer as LocalizedString

## Acceptance Criteria

- [ ] All existing tests pass (304+)
- [ ] No regressions in existing visual behavior
- [ ] New micro-interactions respect `prefers-reduced-motion`
- [ ] DRY: no duplicated patterns across blog/work/services sections
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Verify

1. Blog listing — cursor glow on rows, station numbers, metro line
2. Blog detail — reading progress bar, reading time, code copy, anchor links
3. Work listing — tilt on cards, gradient border, batch entrance
4. Work detail — clickable tags, next/prev stop, shared section component
5. Services — existing behavior unchanged
6. Mobile — all enhancements degrade gracefully
