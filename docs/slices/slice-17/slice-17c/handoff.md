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

### Task 17c-2 — Project + Service schemas (commit `54da6d5`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/project.ts` (4 schemas + 4 drift detectors), `src/lib/schemas/service.ts` (2 schemas + 1 inline helper + 2 drift detectors)
**Decisions:**
- Applied `.min(1)` on `Project.slug` and `Service.id` — matches the `PageSeoSchema` precedent for required short strings; doesn't violate D3 strictness budget (TS already encodes non-empty via required `string`, this is a lower bound not a new constraint).
- Service's home-grid `impactMetric` field has a different shape from `ImpactMetric` (both fields are `LocalizedString` here vs `value: string` on Project). Kept the schema inline (unexported) since no other module references it.
**Deviations from plan:** None — pattern followed exactly. Skipped the optional scratch-repl seed sanity per plan note ("Skip formal test file; Task 17c-7 covers seed-parses-clean assertions in `integrity.test.ts`").
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors (same 19 pre-existing warnings — drift detectors compile in both directions).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~50% — Comfortable.
**Next:** Task 17c-2b — TechStackPage schema + adapter port + repository delegator (audit-driven scope expansion).

---

### Task 17c-2b — TechStackPage schema + adapter port + repository (commit `c1097ba`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/tech-stack-page.ts` (schema + 1 one-direction drift detector)
**Files modified:** `src/lib/adapters/types.ts` (ContentPort extended), `src/lib/adapters/static.ts` (port method + import), `src/lib/repositories/content.ts` (delegator + type import)
**Decisions:**
- Drift detector is one-direction only (`typeof techStackPageContent extends TechStackPageContent`). The literal is `as const` so string values narrow (e.g. `'Tech Stack — yesid.'` instead of `string`); the schema uses open `string`. Reverse direction (`TechStackPageContent extends typeof techStackPageContent`) wouldn't hold and isn't needed — we only care that the runtime literal satisfies the schema.
- Port added unwrapped (no `parsePort`). Task 17c-6 wraps all content-returning ports in one pass.
**Deviations from plan:** None — executed exactly as revised post-audit.
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors. Adapter contract test still passes (port added to both the interface and the implementation, so `: ContentAdapter` annotation is satisfied).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~52% — Comfortable.
**Next:** Task 17c-3 — Blog + SiteMeta + TechStack schemas.

---

### Task 17c-3 — Blog + SiteMeta + TechStack schemas (commit `4a49fe5`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/blog.ts` (3 schemas + 3 detectors), `src/lib/schemas/meta.ts` (4 schemas + 4 detectors), `src/lib/schemas/tech-stack.ts` (6 schemas + 6 detectors)
**Files modified:** `src/lib/schemas/shared.ts` (added `LocaleSchema` as cross-cutting primitive)
**Decisions:**
- `LocaleSchema` placed in `shared.ts` rather than `blog.ts` (plan showed it in blog context, but cross-cutting placement is cleaner — no blog-specific coupling for a Locale enum).
- `SiteOwner.knowsAbout` uses `z.array(z.string()).readonly()`. Verified Zod 4.3.6 supports `.readonly()` on arrays before going bidirectional — otherwise would have fallen to one-direction detector.
- `TechStackItem.connectionNotes` uses `z.record(z.string(), z.string()).optional()` (Zod 4 record signature takes key + value schemas).
- All 13 drift detectors bidirectional. `date` stays `z.string()` per D3 — no `z.iso.date()` tightening.
**Deviations from plan:** `LocaleSchema` location (see decisions). No other deviations.
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors.
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~55% — Healthy, avoiding major new directions per AGENTS.md § Session token budget.
**Next:** Task 17c-4 — About + Contact + Nav + Journey + HeroData schemas (biggest task: `about-page.ts` alone has 14 nested schemas).

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
