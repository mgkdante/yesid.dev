# Dev Log — 2026-04-11

## Slice: 13 — Home Page Redesign (Closing Session)

### Session Start
- **Time:** 20:30
- **Slice spec:** `docs/slices/slice-13-home-redesign.md`
- **Goal:** Close slice 13 — update metro SVG with REM line, mobile scaling, then generate all closing artifacts (handoff, devlog, learning docs, tree.txt)

### Work Done

- [x] Task 1: Update metro network SVG with REM line
  - **Files modified:** `static/images/montreal-metro.svg`, `C:\Users\otalo\Downloads\Map.svg`
  - **Decision:** Made REM line orange with same stroke attributes as other metro lines. Smoothed corners with quadratic bezier curves.
  - **Learning note:** SVG path commands — `Q` (quadratic bezier) creates smooth corners at direction changes. `L`/`H`/`V` create sharp corners.

- [x] Task 2: Fix REM station animation order
  - **Files modified:** `static/images/montreal-metro.svg`
  - **Decision:** Moved REM station paths and line paths from end of SVG to middle of their respective sections so GSAP stagger animates them simultaneously with other nodes.
  - **Learning note:** SVG DOM order determines GSAP stagger animation order when using `querySelectorAll`.

- [x] Task 3: Mobile SVG scaling (1.5x)
  - **Files modified:** `src/lib/motion/svg/MetroNetwork.svelte`
  - **Decision:** Used viewBox crop (`972 300 600 600`) on mobile instead of CSS transforms to avoid GSAP interaction issues. Keeps Berri-UQAM at same 80% horizontal position.
  - **Learning note:** Changing SVG viewBox dimensions while keeping aspect ratio scales the content proportionally. Smaller viewBox = bigger elements.

- [x] Task 4: Fix right-side padding (mobile-only edge-to-edge)
  - **Files modified:** `src/lib/components/HeroBanner.svelte`
  - **Decision:** Removed `px-4 pr-12` on mobile, kept `md:px-4 md:pr-20` for desktop visual balance.

- [x] Task 5: Write closing artifacts
  - **Files created:** `docs/handoffs/slice-13-home-redesign.md`, `docs/devlog/slice-13-closing.md`, `docs/learn/motion/svg-viewbox-mobile-scaling.md`, `docs/learn/motion/gsap-matchmedia-responsive.md`

### Commands Executed

```bash
bun run check
git add ... && git commit ...
```

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run check` | PASS | 0 errors, 23 warnings (pre-existing) |

### Packages Added

| Package | Why |
|---------|-----|
| none | |

### Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| none | | | |

### Blockers / Questions
- None

### Session End
- **Time:** ~21:30
- **Files created:** handoff, devlog, 2 learning docs
- **Files modified:** HeroBanner.svelte, MetroNetwork.svelte, montreal-metro.svg
- **Tests passing:** yes
- **Ready for handoff:** yes
