# Slice 17 — Checkpoint

**Last updated:** 2026-04-12 | Implementation Session
**Branch:** `feature/slice-17a-2a-build-primitives` (PR pending)
**Next branch:** `feature/slice-17a-2b-wire-primitives`

## Current Position
- **Sub-slice:** 17a-2a (Build Primitives) — COMPLETE, PR pending
- **Task:** 16 of 16 (Phase A) — all done
- **Phase B:** 0 of 17 (Wire) — next
- **Status:** Phase A complete, ready for PR + merge, then Phase B

## Execution Sequence

```
Phase 1 — Foundation
  17a-1: Token Foundation .............. COMPLETE (PR #2 merged)
  17a-2a: Build Primitives ............. COMPLETE (PR pending)
  17a-2b: Wire Primitives .............. ~2 sessions (NEXT)
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
| 17a-1 Token Foundation | `feature/slice-17a-1-token-foundation` | #2 | yes |

## Planning Artifacts
- Design spec: `docs/specs/2026-04-11-slice-17-standardization-design.md`
- Audit findings: `docs/reference/AUDIT-SLICE-17.md`
- 17a-1 plan: `docs/plans/2026-04-11-slice-17a-1-token-foundation.md`
- **17a-2 research audit: `docs/research/2026-04-11-slice-17a-2-brand-primitives-audit.md`**
- **17a-2 slice spec: `docs/slices/slice-17a-2-brand-primitives.md`**

## Key Decisions
- D1: Keep Tailwind v4, enforce strict token discipline
- D2: Split 17a into 3 sub-slices (17a-1, 17a-2, 17a-3)
- D3: GSAP $effect() cleanup moves from 17a to 17e
- D6: Use color-mix() for shadow alpha values
- D9: Home page's bold typography + full-bleed = standard for ALL pages
- D10: Keep Tailwind default breakpoints
- D11: Tailwind v4 @theme uses --text-* namespace; type scale in @theme only
- D12: Hero wordmark tokenized as --text-hero (clamp 64-130px)
- **D13: Split 17a-2 into 17a-2a (build) and 17a-2b (wire)**
- **D14: Add 3 new primitives: MetricDisplay, StopLabel, ChevronToggle**
- **D15: Add CornerMarks primitive for blueprint aesthetic**
- **D16: Add 3 new utilities: .prose-dark, .led-pulse, .bento-card**
- **D17: Add --brand-primary-rgb and --brand-accent-rgb channel tokens**
- **D18: Add --text-micro (10px) to type scale**
- **D19: Remove 8 dead components (1,354 lines)**
- **D20: BrandButton uses 3 sizes (sm/md/lg)**
- **D21: Primary button text always `text-[var(--bg-primary)]` (dark on orange)**

## Open Decisions
(none)

## Blockers
(none)
