# Handoff — Sub-Slice 15b JSON-LD & Rich Results

**Self-appending.** Starts as a stub at sub-slice kickoff. Grows a `### Task 15b-N` section each time a Level 3 task lands. Finalized with `## Summary` and `## PR Body` at PR time.

**Status:** in progress
**PR:** pending
**Spec:** [`./spec.md`](./spec.md) | **Plan:** [`./plan.md`](./plan.md)

## Scope (from spec)

Ship Schema.org JSON-LD across every public route via an additive extension of 15a's `PageSeoSchema`. One `<script type="application/ld+json">` per page, `@graph`-wrapped, `@id`-cross-referenced. Zod-at-factory guarantees validity; validator.schema.org + Lighthouse confirm externally.

## Tasks completed

(Each Level 3 task appends a section here as it lands.)

### Task 15b-1: Zod schemas for 8 Schema.org node types

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/schemas/jsonld.ts` (new, 125 lines)
- `src/lib/schemas/jsonld.test.ts` (new, 219 lines)
- `docs/slices/slice-15/slice-15b/log.md` (new, scaffold)
- `docs/slices/slice-15/slice-15b/handoff.md` (new, scaffold — this file)

**What landed:**
- 8 Zod schemas: `PersonSchema`, `WebSiteSchema`, `BlogPostingSchema`, `ServiceSchema`, `CreativeWorkSchema`, `BreadcrumbListSchema`, `ProfilePageSchema`, `CollectionPageSchema`.
- Shared primitives (`IdRef`, `PostalAddress`, `ListItem`) defined locally in module — `IdRef` is the cross-reference primitive used everywhere a node points at another (author, publisher, provider, mainEntity, creator).
- `SchemaOrgNodeSchema` as a `z.discriminatedUnion('@type', [...])` — narrows cleanly on parse, rejects unknown `@type` values.
- 10 type exports via `z.infer`: `Person`, `WebSite`, `BlogPosting`, `Service`, `CreativeWork`, `BreadcrumbList`, `ProfilePage`, `CollectionPage`, `SchemaOrgNode`, `BreadcrumbListItem`.
- JSDoc-style comment at file top mirrors 15a's `seo.ts` — explains intent (factories call `SchemaOrgNodeSchema.parse` at boundary) and `@id` convention (Person/WebSite are global; every other node's `@id` derives from canonical URL + hash fragment).

**Decisions:** None beyond spec. Implementation followed plan exactly — D036 honored (no date fields on `CreativeWorkSchema`).

**Tests:** 21/21 passing across 9 describe blocks.
- `PersonSchema` (3): accepts minimal, rejects missing `name`, rejects non-URL `@id`.
- `WebSiteSchema` (2): accepts minimal, rejects missing `publisher` `@id` ref.
- `BlogPostingSchema` (3): accepts minimal, rejects missing `headline`, accepts optional `image`.
- `ServiceSchema` (2): accepts minimal, accepts optional `areaServed`.
- `CreativeWorkSchema` (2): accepts minimal (no dates, per Q5-A), rejects missing `author`.
- `BreadcrumbListSchema` (3): accepts 2 items, rejects 1 item, rejects 0 items (`.min(2)` boundary).
- `ProfilePageSchema` (2): accepts minimal, accepts optional `dateCreated`+`dateModified`.
- `CollectionPageSchema` (1): accepts minimal.
- `SchemaOrgNodeSchema` (3): narrows on `@type`, rejects unknown `@type`, accepts BreadcrumbList through union.

**Verification:**
- `bun run test src/lib/schemas/jsonld.test.ts` → 21 passed
- `bun run check` → 0 errors (pre-existing warnings only)

**Note:** Task spec said "~22 tests"; implementation yields exactly 21 `it(...)` blocks per the provided test fixture. Matches the spec's verbatim test body.

## Follow-ups flagged (accumulates)

Decisions needed from Yesid, or items deferred to future slices:

1. _(none yet)_

## Iterations (if any)

| # | Yesid reported | Fix | Files |
|---|----------------|-----|-------|
| _(none yet)_ | — | — | — |

## Summary

*(Added at PR time — one paragraph on what the sub-slice achieved end-to-end.)*

## PR Body

*(Added at PR time — extracted from above.)*

## Final Status

One of: COMPLETE / COMPLETE WITH GAPS / PARTIAL / BLOCKED.
