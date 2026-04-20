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

### Task 15b-2: Extend `PageSeoSchema` with optional `jsonLd` + re-export `SchemaOrgNode`

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/schemas/seo.ts` (modified — added `SchemaOrgNodeSchema` import, `jsonLd` field, `SchemaOrgNode` re-export)
- `src/lib/schemas/seo.test.ts` (modified — added `SchemaOrgNodeSchema` import, appended `PageSeoSchema.jsonLd extension (Slice 15b)` describe block with 4 tests)
- `src/lib/types.ts` (modified — replaced single `PageSeo` re-export with `PageSeo, SchemaOrgNode` re-export)

**What landed:**
`PageSeoSchema` now accepts an optional `jsonLd: SchemaOrgNode[]` field as its last property. The field is validated via `z.array(SchemaOrgNodeSchema).optional()`, meaning any existing route entry without `jsonLd` continues to parse cleanly (fully additive, non-breaking). `SchemaOrgNode` is re-exported through `seo.ts` and surfaced via `types.ts`, keeping `types.ts` as the single import surface for consumer code. The `static.ts` adapter's existing `PageSeoSchema.parse(raw)` call at the factory boundary automatically validates the new field at no further code cost.

**Decisions:** None beyond spec.

**Tests:** 20/20 passing in `seo.test.ts` (16 original 15a tests + 4 new 15b tests); 21/21 in `jsonld.test.ts`; 8/8 in `meta.test.ts`. `bun run check`: 0 errors, 19 pre-existing warnings unchanged.

### Task 15b-3: Reference-anchor factories — `buildPersonNode` + `buildWebSiteNode` + constants

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/adapters/jsonld.ts` (new, 63 lines)
- `src/lib/adapters/jsonld.test.ts` (new, 68 lines)

**What landed:**
`src/lib/adapters/jsonld.ts` is the factory module for Schema.org JSON-LD nodes. It exports the two global anchor constants (`PERSON_ID = https://yesid.dev/#person`, `WEBSITE_ID = https://yesid.dev/#website`) and two pure factory functions: `buildPersonNode(meta: SiteMeta): Person` and `buildWebSiteNode(meta: SiteMeta): WebSite`. Both factories construct their node from `SiteMeta`, validate at the boundary via `SchemaOrgNodeSchema.parse(built)`, and cast the result back to the narrower type (safe because the literal `@type` discriminates the union). No I/O, no adapter imports, no side effects. The `PERSON_ID`/`WEBSITE_ID` constants are exported at module top-level for cross-reference by Tasks 4-5.

**Decisions:** None beyond spec.

**Tests:** 10/10 PASS — 2 constant tests + 5 Person tests + 3 WebSite tests.
- Prior suite regression: 49/49 PASS (`meta.test.ts` + `schemas/jsonld.test.ts` + `schemas/seo.test.ts`)
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged)

### Task 15b-4: Page-type factories — `buildProfilePageNode` + `buildBreadcrumbListNode` + `buildCollectionPageNode`

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/adapters/jsonld.ts` (modified — merged `import type` block + appended `BreadcrumbInput` interface and 3 factories)
- `src/lib/adapters/jsonld.test.ts` (modified — added 3 new factory names to import, appended 3 new describe blocks with 6 tests)

**What landed:**
Three page-type factory functions appended to `src/lib/adapters/jsonld.ts`. `buildProfilePageNode(canonicalUrl)` constructs a `ProfilePage` node with `@id` at `${canonicalUrl}#profilepage` and `mainEntity` referencing `PERSON_ID`. `buildBreadcrumbListNode(items, canonicalUrl)` accepts a `readonly BreadcrumbInput[]` (the newly exported `BreadcrumbInput` interface), maps them to `ListItem` entries with sequential 1-based `position` values, and assigns `@id` at `${canonicalUrl}#breadcrumb`; item count validation is delegated to Zod's `.min(2)` rule. `buildCollectionPageNode({ name, description, url })` constructs a `CollectionPage` node with `@id` at `${url}#collectionpage`. All three factories end with `SchemaOrgNodeSchema.parse(built)` at the boundary. The existing `import type { Person, WebSite }` block was merged with the new types into a single `import type { BreadcrumbList, BreadcrumbListItem, CollectionPage, Person, ProfilePage, WebSite }` block, avoiding duplication.

**Decisions:** None beyond spec. `buildProfilePageNode` signature is `(canonicalUrl: string)` with no `locale` parameter — locale would be unused since `ProfilePage` has no locale-dependent fields.

**Tests:** 16/16 PASS in `src/lib/adapters/jsonld.test.ts` (10 prior + 6 new).
- Full suite regression: 930/930 PASS across 94 test files.
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged).

### Task 15b-5: Domain-content factories — `buildBlogPostingNode` + `buildServiceNode` + `buildCreativeWorkNode`

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/adapters/jsonld.ts` (modified — merged `import type` block to add `BlogPosting`, `CreativeWork`, `Service as ServiceNode`; added new `$lib/types` import for `BlogPost`, `Locale`, `Project`, `Service as ServiceDomain`; added `resolveLocale` + `PUBLISHED_LOCALES` imports; appended 3 factory functions)
- `src/lib/adapters/jsonld.test.ts` (modified — added `adapter` import from `./index`; added 3 new factory names to existing `./jsonld` import; appended 4 `describe` blocks with 11 tests)
- `docs/slices/slice-15/slice-15b/handoff.md` (this file — appended Task 15b-5 section)

**What landed:**
Three domain-content factories appended to `src/lib/adapters/jsonld.ts`. `buildBlogPostingNode(post, locale)` constructs a `BlogPosting` node with canonical `@id` at `${SITE_HOST}/blog/${post.slug}`, resolving `headline` and `description` through `resolveLocale`, and wiring `author` and `publisher` to `PERSON_ID` (Q6-A: publisher = Person, same `@id` as author). `buildServiceNode(service, locale)` constructs a `Service` node at `${SITE_HOST}/services/${service.id}`, references `PERSON_ID` as `provider`, and populates `availableLanguage` from the immutable spread of `PUBLISHED_LOCALES`. `buildCreativeWorkNode(project, locale)` constructs a `CreativeWork` node at `${SITE_HOST}/projects/${project.slug}`, references `PERSON_ID` as both `author` and `creator`, copies `project.tags` into `keywords` and `project.stack` into `about`, and deliberately omits `datePublished`/`dateModified` per Q5-A (no date fields on `CreativeWorkSchema`). The `Service` name collision between `$lib/types` and `$lib/schemas/jsonld` is resolved via `Service as ServiceDomain` (domain) and `Service as ServiceNode` (schema) aliases. All three factories end with `SchemaOrgNodeSchema.parse(built)` at the boundary.

**Decisions:** None beyond spec. Q5-A (no dates on CreativeWork) and Q6-A (BlogPosting.publisher = Person) are encoded directly in the factory bodies as specified.

**Tests:** 27/27 PASS in `src/lib/adapters/jsonld.test.ts` (16 prior + 11 new: 4 BlogPosting + 3 Service + 4 CreativeWork).
- Full suite regression: 941/941 PASS across 94 test files.
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged).

### Task 15b-6: `JsonLd.svelte` component

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/components/seo/JsonLd.svelte` (new, 13 lines)
- `src/lib/components/seo/JsonLd.test.ts` (new, 72 lines)
- `src/lib/utils/json-ld-serialize.ts` (new, 16 lines — serialization helper extracted from component)

**What landed:**
`JsonLd.svelte` is the rendering layer for JSON-LD: it accepts a `readonly SchemaOrgNode[]` prop, delegates serialization to `serializeJsonLd()` via `$derived`, and emits exactly one `<script type="application/ld+json">` element into `<svelte:head>` via `{@html}` when `nodes.length > 0`. Default text interpolation in Svelte escapes `<` to `&lt;` which corrupts valid JSON, making `{@html}` the correct choice for embedding literal script tags. The `<` character is escaped to `\u003c` in `serializeJsonLd()` (in `src/lib/utils/json-ld-serialize.ts`) so that any raw `</script>` sequence in a data field cannot prematurely terminate the browser's script element — the same safe-embed pattern used by Next.js, Nuxt, and Astro. The serialization helper was extracted to a separate `.ts` file because Svelte 5's compiler rejects literal `<` characters even inside `<script>` block comments and regex literals, treating them as HTML tag openers; `\x3c` in the regex matches the same byte safely.

**Decisions:** None beyond spec. The `serializeJsonLd` helper is an unplanned addition forced by Svelte 5 parser constraints — the serialization logic is identical to the inline spec.

**Tests:** 5/5 PASS across the `JsonLd.svelte` describe block.
- `emits zero <script> tags when nodes is empty`
- `emits exactly one <script type="application/ld+json"> when nodes non-empty`
- `wraps nodes in @graph with @context`
- `round-trip parses every node unchanged`
- `escapes < inside field values (XSS regression guard)` — specifically verifies `\u003c` appears and `</script>` does not
- Full suite regression: 946/946 PASS across 95 test files.
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged).

### Task 15b-7: `SeoHead` wiring + meta adapter integration tests (RED)

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/components/seo/SeoHead.svelte` (modified — added `JsonLd` import + conditional mount after `</svelte:head>`)
- `src/lib/components/seo/SeoHead.test.ts` (modified — appended `JsonLd integration (Slice 15b)` describe block with 3 tests)
- `src/lib/adapters/meta.test.ts` (modified — appended `adapter.meta.forRoute + jsonLd (Slice 15b)` describe block with 3 RED tests)

**What landed:**
`SeoHead.svelte` now imports `JsonLd` from `./JsonLd.svelte` and conditionally mounts it as a sibling element after its `</svelte:head>` closing tag, guarded by `{#if seo.jsonLd && seo.jsonLd.length > 0}`. This is the correct placement — `<JsonLd>` is not inside `<svelte:head>` (which is unreliable for child components), but as a top-level sibling that contributes its own `<svelte:head>` block to `document.head` through Svelte's head composition. Three SeoHead tests confirm the wiring: `jsonLd: undefined` emits no script, `jsonLd: []` emits no script, and `jsonLd: [BreadcrumbList]` emits exactly one `<script type="application/ld+json">` with a parseable `@graph`. Three integration tests in `meta.test.ts` are committed intentionally RED — they assert that `forRoute` returns a `jsonLd` field for `/about`, `/blog`, and dynamic blog routes, but route entries don't populate `jsonLd` yet; Task 8 flips these assertions to GREEN.

**Decisions:**
- RED-in-commit is intentional (TDD across task boundaries): the 3 `meta.test.ts` tests are committed failing because Task 8's route-entry work is what provides the `jsonLd` data. These are not bugs — they are the concrete failing assertions Task 8 must satisfy. Committing them RED here means Task 8 has a precise, verifiable target rather than needing to reverse-engineer the expected contract.
- `<JsonLd>` placed AFTER `</svelte:head>` at component top level, NOT inside the head block. Svelte composes child head contributions automatically; nesting a component inside `<svelte:head>` is not a supported pattern.
- The `afterEach` cleanup in the new SeoHead describe block (`querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove())`) is necessary because `<svelte:head>` persistence across renders within the same jsdom environment would otherwise cause false positives in the "no script" assertions.

**Tests:**
- `SeoHead.test.ts`: 18/18 PASS (15 prior + 3 new)
- `meta.test.ts`: 8/11 PASS (8 prior + 3 intentional RED); RED tests are: `returns jsonLd as part of PageSeo for a static route`, `parses jsonLd through PageSeoSchema at the adapter boundary`, `returns jsonLd for a dynamic blog route`
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged)

### Task 15b-8: Populate `jsonLd` on all 11 routes in `routeSeoEntries`

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files:**
- `src/lib/content/meta.ts` (modified — added 8 factory imports; added `jsonLd` field to all 11 indexable routes; added no-jsonLd comment to `/__error`)
- `src/lib/adapters/meta.test.ts` (modified — appended `adapter.meta.forRoute + jsonLd — per-route coverage` describe block with 12 new integration tests)
- `docs/slices/slice-15/slice-15b/handoff.md` (this file — appended Task 15b-8 section)

**What landed:**
All 11 public routes in `routeSeoEntries` now emit JSON-LD nodes via the factories shipped in Tasks 3-5. `/` gets `Person + WebSite + ProfilePage` (global anchors + identity page). `/about` gets `Person + ProfilePage + BreadcrumbList` (2-level Home → About). `/contact` and `/tech-stack` get a single `BreadcrumbList` (no rich type needed). `/services` and `/projects` and `/blog` each get `CollectionPage + BreadcrumbList`. `/blog/personal` gets `CollectionPage` plus a **3-level nested breadcrumb** (Home → Blog → Personal, per Q3-B). Dynamic routes `/services/[id]`, `/projects/[slug]`, and `/blog/[slug]` each get their domain-content node (`Service`, `CreativeWork`, `BlogPosting` respectively) plus a `BreadcrumbList` with the item-specific leaf crumb; the `locale` parameter is now passed through to each domain factory. The `/__error` route intentionally carries no `jsonLd` (noIndex page, no structured data benefit) and is documented with an inline comment. The 3 intentionally-RED tests from Task 7 (`returns jsonLd as part of PageSeo for a static route`, `parses jsonLd through PageSeoSchema at the adapter boundary`, `returns jsonLd for a dynamic blog route`) are now GREEN as a direct result of the route-entry population.

**Decisions:** None beyond spec.

**Tests:**
- `meta.test.ts`: 23/23 PASS (8 original 15a + 3 Task 7 RED → GREEN + 12 new per-route coverage)
- Full suite: 964/964 PASS across 95 test files
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged)
- `bun run build`: end-to-end success including sitemap gate (1/1 PASS)

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
