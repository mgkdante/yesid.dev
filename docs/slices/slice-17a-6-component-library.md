# Slice 17a-6: Component Library Foundation

**Status:** PLANNED
**Sessions:** 4 (may compress to 3)
**Branch:** `feature/slice-17a-6-component-library` (from main after PR #8)
**Design spec:** `docs/specs/2026-04-13-slice-17a-6-component-library-design.md`
**Implementation plan:** `docs/plans/2026-04-13-slice-17a-6-component-library-plan.md`
**Depends on:** 17a-5 complete (PR #8 merged)

---

## Overview

Refactor the component architecture to use shadcn-svelte + Bits UI. Adopt ecosystem token naming. Delete dead code. Eliminate all a11y suppressions. Visual output stays identical — this is a code refactor, not a redesign.

## Session Splits

### Session 1: Clean House + Token Rename

**Type:** Implementation
**Branch:** `feature/slice-17a-6-component-library` (create from main)
**Tasks:** 1-8

| Task | Description |
|------|------------|
| 1 | Create branch + verify clean state |
| 2 | Delete dead components (AboutBento, BlogCard, ProjectCard, SectionHeader) |
| 3 | Delete dead Three.js/Threlte files + preview routes |
| 4 | Delete scrapped metro line + unused tokens |
| 5 | Token rename — tokens.css (source of truth) |
| 6 | Token rename — app.css @theme inline |
| 7 | Token rename — ~80 consumer files (batch find-and-replace) |
| 8 | Verify visual parity after token rename |

**Start prompt:**
```
Implementation session — Slice 17a-6: Component Library Foundation (Session 1 of 4)
Type: Implementation
Branch: feature/slice-17a-6-component-library (create from main)

Context: 17a-5 complete (PR #8 merged). This is a code refactor — visual output stays identical.

Session 1 scope: Dead code deletion + token rename to ecosystem convention.

Read first:
- Design spec: docs/specs/2026-04-13-slice-17a-6-component-library-design.md
- Plan: docs/plans/2026-04-13-slice-17a-6-component-library-plan.md (Tasks 1-8)
- Constitution: docs/reference/CONSTITUTION.md
- Checkpoint: docs/slices/slice-17-checkpoint.md
- CSS reference: docs/reference/CSS.md

Tasks 1-8. One task at a time, iterate with Yesid between each. STOP after each task.
```

**Done when:**
- Dead code deleted (~30 files)
- All semantic tokens renamed to ecosystem convention (676 refs across 83 files)
- `bun run check` + `bun run test` pass
- Visual parity confirmed on all pages

---

### Session 2: shadcn-svelte Init + Customize ui/ Components

**Type:** Implementation
**Branch:** continue `feature/slice-17a-6-component-library`
**Tasks:** 9-14

| Task | Description |
|------|------------|
| 9 | Initialize shadcn-svelte (full install — all ~58 components) |
| 10 | Customize ui/dialog with brand styling + GSAP |
| 11 | Customize ui/drawer with brand styling |
| 12 | Customize ui/sheet for metro overlay |
| 13 | Customize collapsible, accordion, tabs, toggle, toggle-group |
| 14 | Customize button, badge, separator, tooltip, progress, carousel, scroll-area |

**Start prompt:**
```
Implementation session — Slice 17a-6: Component Library Foundation (Session 2 of 4)
Type: Implementation
Branch: feature/slice-17a-6-component-library (continue)

Context: Session 1 complete — dead code deleted, tokens renamed to ecosystem convention.

Session 2 scope: shadcn-svelte init (full install) + customize 15 ui/ components with brand styling.

Read first:
- Plan: docs/plans/2026-04-13-slice-17a-6-component-library-plan.md (Tasks 9-14)
- Design spec: docs/specs/2026-04-13-slice-17a-6-component-library-design.md (Section 5)
- tokens.css and app.css (already renamed)

Tasks 9-14. One task at a time, iterate with Yesid between each. STOP after each task.
```

**Done when:**
- shadcn-svelte initialized, all components scaffolded
- 15 ui/ components customized with brand styling
- `bun run check` passes
- Components render with brand tokens

---

### Session 3: Migrate Brand Primitives + Wire Page Components

**Type:** Implementation
**Branch:** continue `feature/slice-17a-6-component-library`
**Tasks:** 15-21

| Task | Description |
|------|------------|
| 15 | Migrate BrandButton → ui/button |
| 16 | Migrate CardBase → ui/card |
| 17 | Migrate Tag → ui/badge + ui/toggle, NumberBadge → ui/badge, HazardStripe + GradientSeparator → ui/separator |
| 18 | Wire MenuOverlay → ui/sheet |
| 19 | Wire StackBottomSheet → ui/drawer |
| 20 | Wire CollapsibleSection → ui/collapsible + FilterGroup → ui/toggle-group |
| 21 | Wire StationTabs, AboutTestimonials, filters, ToC, ReadingProgressBar |

**Start prompt:**
```
Implementation session — Slice 17a-6: Component Library Foundation (Session 3 of 4)
Type: Implementation
Branch: feature/slice-17a-6-component-library (continue)

Context: Session 2 complete — shadcn-svelte initialized, 15 ui/ components customized.

Session 3 scope: Migrate 7 brand primitives to ui/ + wire 12 page components to ui/ wrappers.

Read first:
- Plan: docs/plans/2026-04-13-slice-17a-6-component-library-plan.md (Tasks 15-21)
- Current brand/ barrel: src/lib/components/brand/index.ts
- Design spec Section 5 (wiring table + brand migrations table)

Tasks 15-21. One task at a time, iterate with Yesid between each. STOP after each task.
```

**Done when:**
- 7 brand primitives migrated and deleted from brand/
- 12 page components wired to ui/ wrappers
- `bun run check` + `bun run test` pass
- Visual parity confirmed

---

### Session 4: a11y Fixes + End-of-17a Sweep + Docs

**Type:** Implementation + Closing
**Branch:** continue `feature/slice-17a-6-component-library`
**Tasks:** 22-26

| Task | Description |
|------|------------|
| 22 | Fix all remaining svelte-ignore a11y (onclick → button) — 6 components, 12 suppressions |
| 23 | Update brand/ barrel exports + brand primitive conventions |
| 24 | End-of-17a sweep (zero hardcoded colors, zero old tokens, zero arbitrary Tailwind) |
| 25 | Update docs — CONSTITUTION.md + CSS.md + checkpoint + roadmap |
| 26 | Final verification + visual parity check |

**Start prompt:**
```
Implementation session — Slice 17a-6: Component Library Foundation (Session 4 of 4)
Type: Implementation + Closing
Branch: feature/slice-17a-6-component-library (continue)

Context: Session 3 complete — brand primitives migrated, page components wired.

Session 4 scope: Fix all svelte-ignore a11y (onclick → button), end-of-17a sweep, update docs, final verification.

Read first:
- Plan: docs/plans/2026-04-13-slice-17a-6-component-library-plan.md (Tasks 22-26)
- Current svelte-ignore count: grep -r "svelte-ignore a11y" src/ --include="*.svelte"
- Design spec Section 6 (end-of-17a sweep checks)

Tasks 22-26. One task at a time, iterate with Yesid between each. STOP after each task.

After Task 26: create PR to main, update checkpoint, prepare handoff.
```

**Done when:**
- 0 svelte-ignore a11y comments in codebase
- End-of-17a sweep: zero violations across all categories
- CONSTITUTION.md + CSS.md updated
- Checkpoint + roadmap updated
- `bun run check` + `bun run test` pass
- All pages visually identical
- PR created

---

## Acceptance Criteria

1. Dead code: 0 dead components, 0 dead routes, 0 unused tokens
2. Tokens: all semantic tokens follow ecosystem convention
3. Dependencies: shadcn-svelte initialized (full install)
4. ui/ library: 15 components customized
5. Brand migrations: 7 primitives moved to ui/
6. Wiring: 12 page components refactored
7. a11y: 0 svelte-ignore a11y comments
8. Brand primitives: 8 remain in brand/
9. CONSTITUTION.md + CSS.md updated
10. Tests pass, visual parity confirmed
