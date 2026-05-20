# Mobile known issues — slice-19 audit (Phase 2)

This file is a repo-side INDEX of findings produced during the slice-19 Phase 2 audit.
Full categorized findings + per-item details live in the Notion `slice-19-plan` page.

Notion: https://www.notion.so/3503e863069081c082effd88891a16f0

## Phase 2 audit — categories

| Category | Findings | Tier 1 | Tier 2 | Tier 3 | Owner |
| --- | --- | --- | --- | --- | --- |
| Hover-only interactions | 31 GAP + 1 VERIFY | 14 | 14 | 3 | Phase 4 |
| Touch targets < 44×44 | 47 | 33 | 16 | 16 | Phase 4 |
| Layout / breakpoint integrity | 16 (10 T1 / 6 T2) | 10 | 6 | — | Phase 4 |
| Scroll / Lenis | 0 hard-dep | — | — | — | (Lenis already gated off touch — Phase 4 docs-only) |
| Viewport edge cases | 2 | 1 (Project TocPill) | 1 (Blog TocPill) | — | Phase 4 |
| Motion actions device-gate | 2 refactors (wordmarkHover, boop) | site-wide | — | — | Phase 4 |
| Lighthouse mobile perf | 6 routes < 60 | — | — | — | NOT in slice-19 — recommend perf-focused follow-on slice |

## Highlights

- **Major positive finding** (Task 7): Lenis is already gated off on touch via `ScrollTrigger.isTouch > 0` at `apps/web/src/lib/motion/utils/lenis.ts:27`. Phase 4 Lenis work shrinks to documentation.
- **Major perf concern** (Tasks 7 + 10): `/projects` shows 30.6 fps under Pixel 7 + 4x CPU emulation + Lighthouse perf 47 — style/layout cost during scroll, NOT Lenis. Phase 4 sub-investigation candidate.
- **Lowest Lighthouse mobile perf** (Task 10): `/blog/personal` (42), `/` (44). Both LCP-bound (7.5-7.7s) on Slow 4G. Mobile perf remediation is OUT OF SCOPE for slice-19 (per spec) — recommend a perf-focused follow-on slice.
- **A11y baseline strong** (Task 10): 100 everywhere except `/about` (96, target-size — already in slice-19 scope via Task 5).

## What's next

slice-19 Phase 2 is complete. The follow-up planning cycle (`writing-plans` on slice-19-spec § Phase 3+) reads these findings and produces the Phase 3/4/5 task plan.

## Phase 1 known issues (referenced for completeness)

None recorded during Phase 1. The 2 desktop-only gates in `pages.spec.ts` (lines 69, 76) are intentional selector-shape limitations, not mobile UX defects (see PR #132 description).
