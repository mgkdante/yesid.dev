# Dev Log — 2026-04-09

## Slice: 11c — 404 Page + Integration Polish

### Session Start
- **Time:** 11:30
- **Slice spec:** `docs/plans/2026-04-09-slice-11-nav-404.md` (Tasks 5-7)
- **Goal:** Build ConstructionScene SVG, branded 404 error page, and verify integration across all routes. Completing the final sub-slice of slice 11.

### Work Done

- [x] Task 5: ConstructionScene SVG component
  - **Files created:** `src/lib/components/ConstructionScene.svelte`
  - **Decision:** Pure inline SVG, no external assets. CSS `@keyframes` for blinking lights (not GSAP) — simpler, matches reduced-motion pattern from TerminalCursor.
  - **Learning note:** SVG `<pattern>` element used for hazard chevron fills on barriers.

- [x] Task 6: 404 Error Page + Tests
  - **Files created:** `src/routes/+error.svelte`, `src/routes/error.test.ts`
  - **Files modified:** `src/lib/data/nav.ts` (Home → Contact), `src/routes/+layout.svelte` (isFullWidth for error)
  - **Decision:** No GSAP animations — CSS-only approach. Lesson from 11b: GSAP in Svelte 5 reactive contexts is unreliable. All content from data layer via `resolveLocale`.
  - **Decision:** Used `100dvh` not `100vh` for accurate mobile viewport.
  - **Learning note:** `$page.error !== null` detects error pages in layout for full-width treatment.

- [x] Task 7: Integration Polish
  - **Decision:** Verified routes via preview tool (snapshot + inspect). Screenshot tool timed out on Windows but snapshot confirmed all elements.

### Iterations
1. User: center content, fill viewport, legible text → bumped fonts, flex centering, `height: calc(100dvh-5rem)`
2. User: swap Home→Contact, all links orange on hover → data change + hover styles
3. User: footer missing → reverted hideFooter, footer renders normally below viewport
4. User: approved

### Commands Executed

```bash
bun run check
bun run test -- --run src/routes/error.test.ts
bun run test -- --run src/routes/error.test.ts src/lib/data/nav.test.ts
bun run test -- --run
git commit (11b work: 512761c)
```

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run test` | PASS | 525 tests, 57 files, 0 failures |
| `bun run check` | PASS | 0 errors, 23 pre-existing warnings |

### Packages Added

| Package | Why |
|---------|-----|
| (none) | |

### Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| (none) | | | |

### Blockers / Questions
- Preview screenshot tool times out on Windows — snapshot/inspect still work for verification.

### Session End
- **Time:** 12:05
- **Files created:** `src/lib/components/ConstructionScene.svelte`, `src/routes/+error.svelte`, `src/routes/error.test.ts`, `docs/handoffs/slice-11c.md`, `docs/devlog/slice-11c.md`
- **Files modified:** `src/lib/data/nav.ts`, `src/routes/+layout.svelte`
- **Tests passing:** yes (525/525)
- **Ready for handoff:** yes
