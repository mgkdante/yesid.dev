# Slice 17 — Browser Adaptation & Service Cohesion (ARCHIVED)

> **Superseded by:** Slice 17 — Standardization (design spec: `docs/specs/2026-04-11-slice-17-standardization-design.md`). Browser viewport work absorbed into standardization scope. Service consolidation deferred.

**Status:** archived
**Priority:** 3
**Estimated effort:** 2-3 sessions
**Depends on:** 13 (home page redesign)

## Sub-slices

### 17a — Full-Site Viewport & Browser Adaptation

Extend the 13b hero viewport fix site-wide. Audit and replace every `100vh`/`h-screen` with modern units. Key techniques:

- `svh` (small viewport height) — stable, accounts for visible browser chrome
- `lvh` (large viewport height) — full viewport with chrome hidden
- `dvh` (dynamic viewport height) — updates live as chrome toggles
- `env(safe-area-inset-*)` — notches, rounded corners, home indicators
- Visual Viewport API — JS fallback for virtual keyboards, orientation changes

Scope: all pages, all full-viewport sections, pill nav, footer, fixed/sticky elements. Responsive QA at 375px, 768px, 1440px.

### 17b — Consolidate SQL Under Databases

Merge `sql-development` service into `database-engineering` to present a cleaner 5-service offering. SQL is a subset of database work — separate entries split the perception. Update services.ts, grid layouts, related projects, tests, and any references.
