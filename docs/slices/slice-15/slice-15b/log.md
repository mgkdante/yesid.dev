# Sub-Slice 15b — Session Log

Per AGENTS.md §7, each session prepends an entry with tool attribution.

---

## Session 2026-04-20 — kickoff + plan

**Model:** Claude Code (claude-opus-4-7[1m])
**Skills used:** superpowers:brainstorming, superpowers:writing-plans
**Scope:** Rewrote `spec.md` from stub; authored `plan.md` for 10 TDD tasks with STOP gates; branch `feature/slice-15b-jsonld` cut; spec committed.

**Decisions locked:**
- D032: Delete legacy `src/lib/utils/json-ld.ts` + `getPersonSchema()` (Q1-A)
- D033: `@graph` wrapper + `@id` cross-references; single `<script>` per page (Q2-C)
- D034: `/blog/personal` nested breadcrumb (Home → Blog → Personal) + CollectionPage (Q3-B)
- D035: Zod-at-factory-boundary + manual external validation (validator.schema.org + Lighthouse) (Q4-C)
- D036: No date fields on Project CreativeWork — project type has none (Q5-A)
- D037: Person-as-publisher on BlogPosting (personal-blog pattern) (Q6-A)

**Files touched:** `docs/slices/slice-15/slice-15b/spec.md` (rewritten from stub to full Level 2 spec).

---

## Session 2026-04-20 — Task 15b-1: Zod schemas for 8 Schema.org node types

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Skills used:** superpowers:test-driven-development, superpowers:subagent-driven-development
**Scope:** Created `src/lib/schemas/jsonld.ts` + `jsonld.test.ts` (8 Zod schemas for Schema.org node types + `SchemaOrgNodeSchema` discriminated union). TDD: tests first, RED confirmed, implementation landed, GREEN with 21/21 passing. `bun run check` clean (0 errors).

**Files touched:**
- `src/lib/schemas/jsonld.ts` (new) — 8 schemas + discriminated union + 10 type exports
- `src/lib/schemas/jsonld.test.ts` (new) — 21 tests across 9 describe blocks
- `docs/slices/slice-15/slice-15b/log.md` + `handoff.md` (scaffolds created this session)
