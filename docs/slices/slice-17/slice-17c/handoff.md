# Sub-Slice 17c — Zod Schema Validation · Handoff

**Spec:** [./spec.md](./spec.md)
**Plan:** [./plan.md](./plan.md)
**Parent slice:** [../README.md](../README.md)
**Branch:** `feature/slice-17c-zod-schemas`
**Base:** `main` @ `7c19040` (post slice-15b close)
**Planned by:** Claude Code (Opus 4.7, planning session 2026-04-20)
**Pre-implementation audit:** Claude Explore + Codex (2026-04-20) — findings folded into spec D8 + Task 17c-2b

## Summary

*Finalized at slice close. Will cover: files created/modified (numbers from `git diff main --stat`), seed-data fixes discovered (if any), open questions resolved, delta vs. original 1-session estimate.*

## Task-by-task log

### Task 17c-1 — Shared primitives + parse helper (commit `9f1b79a`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/parse.ts`, `src/lib/schemas/parse.test.ts`, `src/lib/schemas/shared.ts`
**Files modified:** `src/lib/schemas/seo.ts` (replaced inline `LocalizedStringSchema` with import + re-export from `./shared`)
**Decisions:** None — followed plan canonical pattern exactly.
**Deviations from plan:** None.
**Tests:** 6 new tests in `parse.test.ts` covering pass-through, error tagging, Zod error context, array schemas, optional schemas with undefined, and narrow-type preservation at runtime. Full suite `bun run test` → 95 files / 960 tests / all green. `bun run check` → 0 errors, 19 pre-existing warnings (none touching schema files).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~45% — Comfortable.
**Next:** Task 17c-2 — Project + Service schemas with drift detectors.

---

## Audit snapshot (2026-04-20, pre-implementation)

Parallel audits by Claude Explore and Codex agreed on:
- **Q2** port matrix drift: 55/55 ports match the plan — zero drift
- **Q3** existing Zod usage: only at 15a (`PageSeoSchema`) and 15b (`SchemaOrgNodeSchema`) — no ad-hoc validation to preserve or consolidate
- **Q4** seed data: clean — all enum fields match TS unions, no whitespace-only `LocalizedString.en`

Audits diverged on Q1 (seam isolation). Reconciliation: the 40 component-level chrome imports + type-only imports in `repositories/content.ts` are by-design per spec D2 non-goal. Two **real pre-existing 17b seam leaks** surfaced and were folded into 17c scope via spec D8:

1. `src/lib/utils/service-svg.ts:11` runtime-imports `{ services }` from `$lib/content/services` (fix: param injection — Task 17c-6 Step 5)
2. `src/routes/tech-stack/+page.svelte:6` runtime-imports `{ techStackPageContent }` (fix: new `content.techStackPage()` port — Task 17c-2b; route consumes via load function — Task 17c-6 Step 6)

## Out-of-scope discoveries (defer)

*Populated during implementation if audit-style findings surface that don't belong in 17c scope.*

## PR body

*Extracted at slice close from the Summary + Task log sections.*
