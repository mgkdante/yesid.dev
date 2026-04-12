# Slice 17 — Checkpoint

**Last updated:** 2026-04-11 | Planning Session
**Branch:** (not started — first branch: `feature/slice-17a-1-token-foundation`)
**PR:** pending

## Current Position
- **Sub-slice:** 17a-1 (Token Foundation) — planned, not started
- **Task:** 0 of 12
- **Status:** planning complete, ready for implementation

## Execution Sequence

```
Phase 1 — Foundation
  17a-1: Token Foundation .............. 3 sessions (NEXT)
  17a-2: Brand Primitives .............. 3 sessions
  17a-3: Color Lockdown ................ 3 sessions
  17b:   Service Layer ................. 2 sessions
    → 15: SEO + Metadata
Phase 2 — Standardization
  17c: Zod Schemas ..................... 0.5 sessions
  17d: Component API ................... 4 sessions
  17e: Motion Consolidation ............ 2-3 sessions
  17f: Test Architecture ............... 1-2 sessions
  17g: Learning Docs ................... 2 sessions
```

## What's Merged Into Main
| Sub-slice | Branch | PR | Merged |
|-----------|--------|-----|--------|
| (none yet) | — | — | — |

## Planning Artifacts
- Design spec: `docs/specs/2026-04-11-slice-17-standardization-design.md`
- Audit findings: `docs/reference/AUDIT-SLICE-17.md`
- 17a-1 plan: `docs/plans/2026-04-11-slice-17a-1-token-foundation.md`

## Key Decisions
- D1: Keep Tailwind v4, enforce strict token discipline
- D2: Split 17a into 3 sub-slices (17a-1, 17a-2, 17a-3)
- D3: GSAP $effect() cleanup moves from 17a to 17e
- D6: Use color-mix() for shadow alpha values
- D9: Home page's bold typography + full-bleed = standard for ALL pages

## Open Decisions
- Breakpoint system: keep Tailwind defaults or override with custom (360/520/768/1024/1440)? Research needed in Task 5 of 17a-1 plan.

## Blockers
- Slice 00 PR needs to merge to main before branching 17a-1
