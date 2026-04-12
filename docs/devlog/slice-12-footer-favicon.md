# Dev Log — 2026-04-09

## Slice: 12 — Footer Redesign + Favicon + SEO

### Session Start
- **Time:** 12:54
- **Slice spec:** `docs/specs/2026-04-09-slice-12-footer-favicon-design.md`
- **Plan:** `docs/plans/2026-04-09-slice-12-footer-favicon.md`
- **Goal:** Implement all 9 tasks from the plan: favicon, data layer, schema builder, wordmarkHover action, Nav refactor, Footer rebuild, tests, JSON-LD in layout, final verification + docs.

### Work Done

- [x] Task 1: Favicon — orange dot
  - **Files modified:** `static/favicon.svg`, `src/lib/assets/favicon.svg`
  - **Decision:** Simple circle SVG, r=12 on 32x32 viewBox

- [x] Task 2: Extend data layer
  - **Files modified:** `src/lib/data/types.ts`, `src/lib/data/meta.ts`, `src/lib/data/index.ts`
  - **Decision:** Included fr/es translations for jobTitle

- [x] Task 3: JSON-LD schema builder (TDD)
  - **Files created:** `src/lib/data/schema.ts`, `src/lib/data/schema.test.ts`
  - **Decision:** Schema hardcodes `url: 'https://yesid.dev'` — could be made dynamic later

- [x] Task 4: Extract wordmarkHover action (TDD)
  - **Files created:** `src/lib/motion/actions/wordmarkHover.ts`, `src/lib/motion/actions/wordmarkHover.test.ts`
  - **Files modified:** `src/lib/motion/actions/index.ts`
  - **Decision:** Added `autoPlay` and `autoPlayDelay` params for Nav's page-load animation

- [x] Task 5: Refactor Nav to shared action
  - **Files modified:** `src/lib/components/Nav.svelte`
  - **Decision:** Removed `onclick` handler — `mouseenter` via action is sufficient

- [x] Task 6: Rebuild Footer
  - **Files modified:** `src/lib/components/Footer.svelte`
  - **Iteration:** Yesid asked to remove bottom accent stripe — removed

- [x] Task 7: Update Footer tests
  - **Files modified:** `src/lib/components/Footer.test.ts`
  - **Decision:** Scoped nav link assertions to `<nav>` element to avoid Work/Upwork collision

- [x] Task 8: JSON-LD schema in layout
  - **Files modified:** `src/routes/+layout.svelte`

- [x] Task 9: Final verification + docs + brand rename
  - **Files modified:** 16+ source files, README, brand/README, docs/MOTION, ARCHITECTURE, TESTS
  - **Decision:** "data infrastructure" → "digital infrastructure" per Yesid's direction

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run test` | PASS | 59 files, 549 tests |
| `bun run check` | PASS | 0 errors, 23 pre-existing warnings |

### Packages Added

None.

### Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| SplitText mock not constructable | Arrow fn can't be used with `new` | Used `vi.fn(function() {...})` | Yes |
| `/work/i` matched "Work" + "Upwork" | Regex too broad | Scoped to `<nav>` element | Yes |

### Blockers / Questions
None.

### Session End
- **Time:** 13:45
- **Files created:** 4 (schema.ts, schema.test.ts, wordmarkHover.ts, wordmarkHover.test.ts)
- **Files modified:** 26+ (see handoff for full list)
- **Tests passing:** yes (549/549)
- **Ready for handoff:** yes
