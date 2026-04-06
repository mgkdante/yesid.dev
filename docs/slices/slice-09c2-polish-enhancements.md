# Slice 09c-2 — Polish Enhancements + Layout Rethink

**Status:** planned (blocked by 09c-1)
**Priority:** 2
**Estimated effort:** 2-3 sessions
**Depends on:** 09c-1

## Objective

Add advanced micro-interactions, metro/transit brand enhancements, and critically evaluate whether blog and work page layouts need a redesign. This slice uses `/web-designer` skill and web research to benchmark against award-winning portfolio sites before making layout decisions.

## Rules

1. **Keep all existing components** — enhance styling only, never replace (unless layout rethink justifies it)
2. **Existing tests must stay green** — add new tests for new interactions
3. **All motion respects `prefers-reduced-motion`**
4. **All content stays data-driven** — no hardcoded text

---

## LAYOUT-1: Blog + Work Layout Audit & Rethink

**This is the first task in the slice — before adding any enhancements.**

### Process

1. Use `/web-designer` skill to activate the design decision framework (mood, palette, type, layout, motion, signature)
2. Web research: find 10+ award-winning portfolio/blog/work layouts (Awwwards, SiteInspire, Httpster, Minimal Gallery)
3. Screenshot + analyze what makes each layout special
4. Compare against current yesid.dev blog listing, blog detail, work listing, work detail
5. Present findings: what's strong, what's weak, what could be elevated
6. Propose layout changes (or confirm current layouts are solid) with visual mockups
7. Get Yesid's approval before any layout changes

### Pages in scope

- `/blog` — professional listing
- `/blog/personal` — personal corner listing
- `/blog/[slug]` — post detail
- `/work` — project listing
- `/work/[slug]` — project detail

### Decision outcomes

- **Keep current layout** — document why it holds up, proceed to enhancements
- **Adjust layout** — spec the changes, implement, then add enhancements on top

---

## Medium Enhancements

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
- Click -> copy to clipboard -> show checkmark for 2s
- CSS overlay + minimal JS

### ME-6: Heading anchor links
- File: `src/lib/components/BlogContent.svelte`
- `h2`, `h3` show `#` link on hover (slides in from left)
- CSS `::before` pseudo-element

---

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

---

## Acceptance Criteria

- [ ] Layout audit complete with documented findings
- [ ] Layout changes implemented (if any) with Yesid's approval
- [ ] `cursorGlow` action created with tests
- [ ] Reading progress bar on blog detail
- [ ] Animated gradient border on WorkCard
- [ ] ScrollTrigger.batch() on listing pages
- [ ] Code block copy button
- [ ] Heading anchor links
- [ ] Metro line in blog listing
- [ ] Station number badges on listings
- [ ] Next/prev stop nav on work detail
- [ ] Animated dashed separators
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Verify

1. Blog listing — cursor glow on rows, station numbers, metro line, batch entrance
2. Blog detail — reading progress bar, code copy button, anchor links on headings
3. Work listing — gradient border on hover, batch entrance, station numbers
4. Work detail — next/prev stop nav, clickable tags
5. Services — existing behavior unchanged
6. Mobile — all enhancements degrade gracefully
7. Layout — compare before/after if rethink was applied
