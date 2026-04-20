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

### Task 15b-9: Legacy cleanup — delete `utils/json-ld.ts` + drop `getPersonSchema` + update docs

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-sonnet-4-6, subagent-driven-development)
**Session:** 2026-04-20

**Files deleted:**
- `src/lib/utils/json-ld.ts`
- `src/lib/utils/json-ld.test.ts`

**Files modified:**
- `src/lib/repositories/meta.ts` — removed `getPersonSchema` + `buildPersonSchema` import; rewritten to clean 2-function module
- `src/lib/utils/index.ts` — removed `export * from './json-ld'` from barrel (discovered during test run; not in spec but required for clean deletion)
- `src/routes/+layout.svelte` — flipped comment from future-tense "returns in Slice 15b" to past-tense "is gone"
- `docs/reference/ARCHITECTURE.md` — replaced Slice 12 `buildPersonSchema` paragraph with Slice 15b JSON-LD pipeline paragraph
- `docs/reference/TESTS.md` — removed 11-row `buildPersonSchema` block; added Slice 15b section covering 4 test files (jsonld.test.ts, seo.test.ts jsonLd extension, adapters/jsonld.test.ts, JsonLd.test.ts + SeoHead integration + meta.test.ts integration)
- `docs/slices/slice-15/slice-15b/handoff.md` (this file — appended Task 15b-9 section)

**What landed:**
Deleted the Slice 12 legacy `src/lib/utils/json-ld.ts` (which built a raw JSON-LD string for the Person schema) and its 11-test file. Removed the `getPersonSchema` repository wrapper in `meta.ts` and the barrel re-export in `utils/index.ts`. The `+layout.svelte` comment now reads in past tense confirming the Slice 12 block is gone. `ARCHITECTURE.md` now describes the Slice 15b pipeline (Zod factories + `<JsonLd>` component) as the authoritative JSON-LD mechanism. `TESTS.md` drops the 11 legacy rows and gains a multi-file Slice 15b section accurately reflecting the real `describe`/`it` names from all 4 test files.

**Decisions:** None beyond spec. One extra file (`utils/index.ts`) was modified beyond the 4 listed in the plan — the barrel re-export was missed in the spec but was a straightforward unblock.

**Tests:**
- Full suite: 954/954 PASS across 94 test files (964 - 11 legacy json-ld tests + 1 test file merged = net 94 files)
- `bun run check`: 0 errors, 19 pre-existing warnings (unchanged)
- `bun run build`: end-to-end success including sitemap gate (1/1 PASS)

---

### Task 15b-10: Manual validation sweep — Lighthouse SEO 100 + JSON-LD structure on 5 canonical URLs

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, inline via Chrome DevTools MCP)
**Session:** 2026-04-20

**Files:**
- `docs/slices/slice-15/slice-15b/preview-validation.md` (new) — full validation log with per-URL structure + Lighthouse tables

**What landed:**
Ran `bun run build` + `bun run preview` (preview landed on port 4174 — port 4173 was occupied by a stale earlier vite instance). Navigated Chrome DevTools MCP sequentially through 5 canonical URLs — `/`, `/about`, `/blog/building-a-transit-pipeline`, `/projects/yesid-dev`, `/services/sql-development`. For each: extracted the rendered `<script type="application/ld+json">` from `document.head` via `evaluate_script`, verified `@graph` node types match the per-route schema map, verified `@id` cross-references resolve correctly (Person anchor on `/` + `/about`; `@id`-referenced everywhere else), ran a desktop navigation-mode Lighthouse audit. Captured results in `preview-validation.md`.

**Decisions:** None beyond spec.

**Validation results:**

| URL | Lighthouse SEO | A11y | Best Practices | JSON-LD `@graph` |
|---|---:|---:|---:|---|
| `/` | **100** | 100 | 100 | Person + WebSite + ProfilePage |
| `/about` | **100** | 96 (pre-existing from 15a) | 100 | Person + ProfilePage + BreadcrumbList |
| `/blog/building-a-transit-pipeline` | **100** | 100 | 100 | BlogPosting + BreadcrumbList |
| `/projects/yesid-dev` | **100** | 100 | 100 | CreativeWork + BreadcrumbList |
| `/services/sql-development` | **100** | 100 | 100 | Service + BreadcrumbList |

**Verified per route:**
- Exactly one `<script type="application/ld+json">` per page (not N separate scripts)
- `@graph` wrapper with `@context: "https://schema.org"` (Q2-C encoded)
- Person `@id = https://yesid.dev/#person` appears fully only on `/` + `/about`, `@id`-referenced elsewhere
- BlogPosting `inLanguage` propagates from `post.lang`; `datePublished` from `post.date`; `author` === `publisher` same `@id` (Q6-A encoded)
- CreativeWork emits no `datePublished` / `dateModified` (Q5-A encoded); `keywords` from `project.tags`, `about` from `project.stack`
- Service `availableLanguage: ["en"]` from `PUBLISHED_LOCALES`; `provider` → Person `@id`
- BreadcrumbList present on every subpage with correct trail (including the `/blog/personal` nested trail `Home → Blog → Personal` from Q3-B — verified via `meta.test.ts` integration tests)
- XSS safe-embed: raw `</script>` never present in script body (verified on `/blog/<slug>`); `<` escaped to `\u003c` by `serializeJsonLd`

**False positive during audit (resolved in-session):** First Lighthouse run on `/` reported SEO 92 with `robots-txt is not valid`. Root cause: Chrome was pointing at stale port 4173 while the fresh preview bound to 4174. Second audit against the correct port returned 100. No code change needed.

**External validator sweep (validator.schema.org + Google Rich Results Test):** Deferred to the PR preview URL per the 15a precedent (Google Rich Results Test requires public URL; checklist in `preview-validation.md` to be run against the Vercel preview URL that `gh pr create` produces).

**Verification:**
- 5/5 URLs at Lighthouse SEO 100 ✓
- 5/5 URLs emit one `<script>` with correct `@graph` shape ✓
- Full suite 954/954 ✓ | `bun run check` 0 errors ✓ | `bun run build` end-to-end ✓

## Follow-ups flagged (accumulates)

Decisions needed from Yesid, or items deferred to future slices:

1. _(none yet)_

## Iterations (if any)

| # | Reported by | Fix | Files |
|---|---|-----|-------|
| 1 | Codex review (gpt-5.4 xhigh) — 2 Important + 1 Minor issue | ARCHITECTURE.md, slice-17/README.md stale `getPersonSchema`/`buildPersonSchema` refs updated; TESTS.md heading corrected ("4 files" → "6 files"); preview-validation.md's flawed "Zod is enough" argument dropped + 5 JSON blobs embedded for manual paste + validator.schema.org sweep actually run via Chrome DevTools MCP (CDP click + CodeMirror `setValue` API). | `docs/reference/ARCHITECTURE.md`, `docs/reference/TESTS.md`, `docs/slices/slice-17/README.md`, `docs/slices/slice-15/slice-15b/preview-validation.md` |
| 2 | validator.schema.org — 1 warning on `/services/sql-development` | Dropped `availableLanguage` from `ServiceSchema` + `buildServiceNode` (Schema.org defines it on ContactPoint / Place / ServiceChannel, not directly on Service). `PUBLISHED_LOCALES` is en-only today; when fr/es ship, locale info re-enters via a nested `ServiceChannel` under `Service.availableChannel`. Post-fix validator sweep: all 5 URLs pass with 0 errors + 0 warnings. | `src/lib/schemas/jsonld.ts`, `src/lib/adapters/jsonld.ts`, `src/lib/schemas/jsonld.test.ts`, `src/lib/adapters/jsonld.test.ts`, `docs/slices/slice-15/slice-15b/spec.md`, `docs/reference/TESTS.md`, `docs/slices/slice-15/slice-15b/preview-validation.md` |

## Summary

Slice 15b ships Schema.org JSON-LD structured data across every public route of yesid.dev, as an additive extension of 15a's `PageSeoSchema`. One `<script type="application/ld+json">` per page wraps all nodes in `@graph` with `@id` cross-references anchored at `https://yesid.dev/#person` + `/#website`; every other node references those anchors instead of re-embedding. 8 Zod-validated factories (Person, WebSite, BlogPosting, Service, CreativeWork, BreadcrumbList, ProfilePage, CollectionPage) in `src/lib/adapters/jsonld.ts` map domain data to `SchemaOrgNode`s; each factory ends with `SchemaOrgNodeSchema.parse(built)` so malformed nodes never leave the module. The new `<JsonLd>` Svelte 5 component (with extracted `serializeJsonLd` helper to sidestep a Svelte parser constraint on literal `<` in script blocks) renders the `@graph` into `<svelte:head>` via `{@html}` with `<` → `\u003c` safe-embed escaping. Slice 12's legacy `src/lib/utils/json-ld.ts` + `getPersonSchema` wrapper were deleted; `ARCHITECTURE.md`, `TESTS.md`, `slice-17/README.md`, and `+layout.svelte` all updated. 65 new tests; 954/954 full suite passing; Lighthouse SEO 100 + validator.schema.org (0 errors + 0 warnings) × 5 canonical URLs. Two iterations of Codex review were applied before PR to resolve stale doc refs + drop an `availableLanguage` field that Schema.org doesn't recognize on `Service`.

## PR Body

```
## Summary

Slice 15b adds Schema.org JSON-LD structured data to every public route as an additive extension of 15a's `PageSeoSchema`. One `<script type="application/ld+json">` per page, `@graph`-wrapped, `@id`-cross-referenced. 8 Zod-validated pure factories map domain data → SchemaOrgNode; `<JsonLd>` component renders into `<svelte:head>` with XSS-safe `\u003c` escaping. Person anchored at `https://yesid.dev/#person`, WebSite at `/#website`; every other node references them by `@id`. Slice 12's legacy `buildPersonSchema` + `getPersonSchema` are gone.

## Changes

- **Schemas** (`src/lib/schemas/jsonld.ts` + test, `src/lib/schemas/seo.ts` + test) — 8 Zod schemas as a discriminated union on `@type`; `PageSeoSchema` extended with optional `jsonLd: SchemaOrgNode[]`; `SchemaOrgNode` re-exported through `types.ts`.
- **Factories** (`src/lib/adapters/jsonld.ts` + test) — `buildPersonNode`, `buildWebSiteNode`, `buildBlogPostingNode`, `buildServiceNode`, `buildCreativeWorkNode`, `buildBreadcrumbListNode`, `buildProfilePageNode`, `buildCollectionPageNode` + `PERSON_ID`/`WEBSITE_ID` constants.
- **Component** (`src/lib/components/seo/JsonLd.svelte` + test, `src/lib/utils/json-ld-serialize.ts`) — Svelte 5 runes; emits one script per page; `<` escaped to `\u003c` (XSS guard). Serializer extracted to a `.ts` helper to sidestep Svelte compiler's parsing of `<` inside script blocks.
- **Wiring** (`src/lib/components/seo/SeoHead.svelte`, `src/lib/content/meta.ts`) — `<SeoHead>` mounts `<JsonLd>` as a child when `seo.jsonLd` is populated; all 11 `routeSeoEntries` entries populated.
- **Legacy cleanup** — deleted `src/lib/utils/json-ld.ts` + test; dropped `getPersonSchema` from `src/lib/repositories/meta.ts`; flipped `+layout.svelte` comment; updated `docs/reference/ARCHITECTURE.md`, `docs/reference/TESTS.md`, `docs/slices/slice-17/README.md`, `src/lib/utils/index.ts` (dead barrel export).
- **Amendment** (Codex-review iteration) — dropped `availableLanguage` from `ServiceSchema` + `buildServiceNode` (Schema.org defines it on ContactPoint / Place / ServiceChannel, not `Service`); locale info will re-enter via a nested `ServiceChannel` when fr/es content ships.

## Tests

- **954/954** passing across 94 test files (+65 new 15b tests net, after -11 legacy `buildPersonSchema` tests deleted + 1 extra test file merged)
- `bun run check`: 0 errors (19 pre-existing warnings unchanged)
- `bun run build`: end-to-end success including sitemap coverage gate (1/1 PASS)
- **Lighthouse SEO 100** × 5 canonical URLs (home, about, one blog, one project, one service)
- **validator.schema.org: 0 errors + 0 warnings** × 5 canonical URLs (driven via Chrome DevTools MCP — CDP click + CodeMirror `setValue` API)

## Test plan (for reviewer)

Before merge, please run against this PR's Vercel preview URL:

- [ ] Google Rich Results Test on `/`, `/about`, one blog post, one project, one service → each URL eligible for the rich-result type of its primary node
  - Expected soft warning "recommended: publisher" on BlogPosting is **accepted** per Q6-A (Person-as-publisher is the personal-blog pattern — no fictional Organization minted)
- [ ] LinkedIn Post Inspector on the same 5 URLs → OG card renders (this is a 15a regression check)
- [ ] Spot-check `view-source:` on any route → confirm one `<script type="application/ld+json">` in head, JSON parses cleanly

## Follow-ups

- Slice 15c (post-Payload / Slice 18): per-post + per-project auto-generated OG images via Satori
- Slice 17c: full Zod rollout across content/projects/blog/services types (15b narrowly scoped Zod to JSON-LD + PageSeo)
- When fr/es content ships: re-introduce locale metadata on Service via a nested ServiceChannel (`Service.availableChannel → ServiceChannel.availableLanguage`)
- No unscoped follow-ups from this slice
```

## Final Status

**COMPLETE** — all 10 planned tasks shipped, Codex review iterations (2) applied, every acceptance criterion in `spec.md` met, ready for merge. Google Rich Results Test deferred to the PR preview URL per the 15a precedent (requires public URL).
