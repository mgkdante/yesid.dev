# Sub-Slice 15b — JSON-LD & Rich Results

**Level 2 design spec.** Describes outcomes, architectural decisions, and acceptance criteria. Implementation plan lives in `plan.md`.

**Status:** approved, awaiting `plan.md`
**Parent slice:** Slice 15 (`../README.md`)
**Depends on:** 15a (SEO foundation — `PageSeoSchema`, `SeoHead`, `MetaPort.forRoute`, `routeSeoEntries`, layout-authoritative wiring)
**Est. sessions:** 1

## Objective

Add Schema.org JSON-LD structured data to every public route so Google rich cards, validator.schema.org, and Lighthouse SEO 100 all pass — feeding through the same hexagonal port pattern 15a established so the Slice 18 Payload CMS swap remains a one-file change.

## Context

Most portfolio sites skip structured data entirely. Adding it is the differentiator that turns a generic blue link into a rich Google result with author photo, breadcrumb trail, and site links. It also scaffolds the site for the AI-crawled future where LLMs prefer schema-described content.

15b deliberately splits from 15a because:
- 15a shipped the visible social-preview win (LinkedIn / Twitter cards render correctly) without waiting for schema design.
- 15b's schemas benefit from having real content wired through 15a first — catching any adapter gaps before schema factories depend on them.
- Two smaller PRs are more reviewable than one giant one.

## Design principles

1. **Schemas feed from the same port.** 15b extends `PageSeoSchema` with an optional `jsonLd: SchemaOrgNode[]` field — additive, non-breaking for any 15a entry that doesn't yet specify structured data.
2. **Typed factories, not string templates.** Every JSON-LD node comes from a Zod-validated factory (`buildPersonNode`, `buildBlogPostingNode`, etc.) that takes domain data in and emits a validated `SchemaOrgNode`. The last line of every factory is `SchemaOrgNodeSchema.parse(built)` — malformed output never leaves the module.
3. **Breadcrumbs on every subpage, always.** The structured navigation path is what Google uses to render site hierarchy in SERPs. Home is the only route without a BreadcrumbList.
4. **One script per page via `@graph`.** Instead of N `<script type="application/ld+json">` tags per page, all nodes go into a single `{ "@context": "https://schema.org", "@graph": [...] }` block. Same validator result, cleaner DOM.
5. **`@id` cross-references anchor the graph.** Person and WebSite have stable global IDs (`https://yesid.dev/#person`, `https://yesid.dev/#website`). Every BlogPosting.author, Service.provider, CreativeWork.creator, ProfilePage.mainEntity references them by `@id` instead of re-embedding. Google's crawler resolves the reference once.
6. **Locale-aware where schema allows.** `inLanguage` on BlogPosting sources from `post.lang`. `availableLanguage` on Service sources from `PUBLISHED_LOCALES`. Text fields use `resolveLocale()` with the locale prop.
7. **Honest publisher.** BlogPosting.publisher references the same Person as author (personal-blog pattern). No fictional Organization node is minted just to satisfy validators.

## Architecture

### Data flow (additive to 15a)

```
Domain data          Schema layer              Adapter layer              Route layer
(Project/Service/  → Zod schemas in       →    Factories in          →    routeSeoEntries
 BlogPost,           src/lib/schemas/           src/lib/adapters/          (static + dynamic)
 siteMeta)           jsonld.ts                  jsonld.ts
                                                   │
                                                   ▼
                                           PageSeo.jsonLd
                                           (SchemaOrgNode[])
                                                   │
+layout.ts ──→ getPageSeo ──→ adapter.meta.forRoute (parses with extended PageSeoSchema)
                                                   │
+layout.svelte ──→ <SeoHead seo={data.seo} locale={...}>
                                                   │
                                 ┌─────────────────┴─────────────────┐
                                 ▼                                   ▼
                    existing <head> tags                  <JsonLd nodes={seo.jsonLd} />
                    (title/OG/Twitter/hreflang)                      │
                                                                     ▼
                                                 one <script type="application/ld+json">
                                                 wrapping all nodes in @graph
```

### Files

**Create:**

```
src/lib/schemas/jsonld.ts                    — Zod schemas for 8 node types; discriminated union on @type
src/lib/schemas/jsonld.test.ts               — per-schema valid/invalid/edge-case tests
src/lib/adapters/jsonld.ts                   — 8 factory functions; PERSON_ID + WEBSITE_ID constants
src/lib/adapters/jsonld.test.ts              — per-factory tests with real fixtures from content/
src/lib/components/seo/JsonLd.svelte         — renders one <script> per page, @graph-wrapped
src/lib/components/seo/JsonLd.test.ts        — emit count, escape safety, round-trip parse
docs/slices/slice-15/slice-15b/preview-validation.md — manual validation log (Layer 3)
```

**Modify:**

```
src/lib/schemas/seo.ts                       — .extend() PageSeoSchema with optional jsonLd
src/lib/schemas/seo.test.ts                  — tests for the extended shape
src/lib/content/meta.ts                      — attach jsonLd to all 11 route entries
src/lib/adapters/meta.test.ts                — integration tests for jsonLd through forRoute
src/lib/components/seo/SeoHead.svelte        — mount <JsonLd> as child when seo.jsonLd present
src/lib/components/seo/SeoHead.test.ts       — JsonLd mounting assertions
src/routes/+layout.svelte                    — flip Slice 12 legacy comment to past tense
docs/reference/ARCHITECTURE.md               — replace Slice 12 JSON-LD paragraph with 15b paragraph
docs/reference/TESTS.md                      — drop 11 legacy test rows; add ~50 new rows
```

**Delete:**

```
src/lib/utils/json-ld.ts                     — Slice 12 buildPersonSchema (stringified, no Zod)
src/lib/utils/json-ld.test.ts                — 11 legacy tests, subsumed by new factory tests
```

Also drop `getPersonSchema()` + its `buildPersonSchema` import from `src/lib/repositories/meta.ts`. The repository retains `getSiteMeta` and `getPageSeo` unchanged.

### Schema module — `src/lib/schemas/jsonld.ts`

Discriminated union on `@type`:

```ts
export const SchemaOrgNodeSchema = z.discriminatedUnion('@type', [
  PersonSchemaZ,       // @id, name, jobTitle, url, email?, sameAs[], knowsAbout[], address
  WebSiteSchemaZ,      // @id, name, url, description, publisher (IdRef → Person)
  BlogPostingSchemaZ,  // @id, headline, description, inLanguage, datePublished,
                       //   author (IdRef → Person), publisher (IdRef → Person),
                       //   mainEntityOfPage, image?
  ServiceSchemaZ,      // @id, name, description, provider (IdRef → Person),
                       //   availableLanguage[], areaServed?
  CreativeWorkSchemaZ, // @id, name, description, url, author (IdRef → Person),
                       //   creator (IdRef → Person), keywords[], about[]
  BreadcrumbListZ,     // @id, itemListElement[] (≥2 items)
  ProfilePageZ,        // @id, mainEntity (IdRef → Person), dateCreated?, dateModified?
  CollectionPageZ,     // @id, name, description, url
]);

export type SchemaOrgNode = z.infer<typeof SchemaOrgNodeSchema>;
```

A shared `IdRefZ = z.object({ '@id': z.string().url() })` encodes the cross-reference primitive.

### Adapter module — `src/lib/adapters/jsonld.ts`

Pure functions, no I/O, no adapter imports:

```ts
export const PERSON_ID  = `${SITE_HOST}/#person`;
export const WEBSITE_ID = `${SITE_HOST}/#website`;

export function buildPersonNode(meta: SiteMeta): Person { ... }
export function buildWebSiteNode(meta: SiteMeta): WebSite { ... }
export function buildProfilePageNode(canonicalUrl: string, locale: Locale): ProfilePage { ... }
export function buildBreadcrumbListNode(items: BreadcrumbItem[], canonicalUrl: string): BreadcrumbList { ... }
export function buildCollectionPageNode(args: {
  name: string; description: string; url: string;
}): CollectionPage { ... }
export function buildBlogPostingNode(post: BlogPost, locale: Locale): BlogPosting { ... }
export function buildServiceNode(service: Service, locale: Locale): Service { ... }
export function buildCreativeWorkNode(project: Project, locale: Locale): CreativeWork { ... }
```

Each factory ends with `return SchemaOrgNodeSchema.parse(built);`. Zod is the contract.

### PageSeoSchema extension — `src/lib/schemas/seo.ts`

```ts
export const PageSeoSchema = z.object({
  // ... existing 15a fields (title, description, canonical, ogImage, ogType, noIndex) unchanged ...
  jsonLd: z.array(SchemaOrgNodeSchema).optional(),
});
```

`optional()` keeps every 15a `routeSeoEntries` entry valid until we populate it.

### Component — `src/lib/components/seo/JsonLd.svelte`

Svelte 5 runes. Takes `nodes: readonly SchemaOrgNode[]`, emits exactly one `<script type="application/ld+json">` inside `<svelte:head>` wrapping the nodes in `@graph`. `<` is escaped to `\u003c` to prevent premature `</script>` termination. The `{@html}` directive is required because Svelte escapes `<` in text interpolation and that corrupts valid JSON.

Guards:
- `nodes.length === 0` → emits nothing
- `<` in any field → escaped to `\u003c` before serialization

### SeoHead change — one-line

```svelte
{#if seo.jsonLd && seo.jsonLd.length > 0}
  <JsonLd nodes={seo.jsonLd} />
{/if}
```

Child components that write to `<svelte:head>` compose correctly — each component's head contribution lands in the document head. No layout change needed.

## Per-route schema map

| Route | Nodes in `@graph` | Cross-references |
|---|---|---|
| `/` | Person, WebSite, ProfilePage | WebSite.publisher → Person; ProfilePage.mainEntity → Person |
| `/about` | Person, ProfilePage, BreadcrumbList | ProfilePage.mainEntity → Person |
| `/contact` | BreadcrumbList | — |
| `/services` | CollectionPage, BreadcrumbList | — |
| `/services/[id]` | Service, BreadcrumbList | Service.provider → Person |
| `/projects` | CollectionPage, BreadcrumbList | — |
| `/projects/[slug]` | CreativeWork, BreadcrumbList | CreativeWork.author → Person; CreativeWork.creator → Person |
| `/blog` | CollectionPage, BreadcrumbList | — |
| `/blog/personal` | CollectionPage, BreadcrumbList | Breadcrumb: Home → Blog → Personal |
| `/blog/[slug]` | BlogPosting, BreadcrumbList | BlogPosting.author → Person; BlogPosting.publisher → Person |
| `/tech-stack` | BreadcrumbList | — |

`/__error` (the noIndex 404 fallback) stays jsonLd-free — Google doesn't index it, no point spending crawler budget on structured data.

Person is emitted fully only on `/` and `/about`. Every other route references it by `@id`. Google's crawler resolves the reference once per indexing pass; payload stays small.

### Breadcrumb trails

| Route | Trail |
|---|---|
| `/about` | Home → About |
| `/contact` | Home → Contact |
| `/services` | Home → Services |
| `/services/[id]` | Home → Services → `{service.title.en}` |
| `/projects` | Home → Projects |
| `/projects/[slug]` | Home → Projects → `{project.title.en}` |
| `/blog` | Home → Blog |
| `/blog/personal` | Home → Blog → Personal |
| `/blog/[slug]` | Home → Blog → `{post.title.en}` |
| `/tech-stack` | Home → Tech Stack |

### Wiring into `routeSeoEntries`

Each entry in `src/lib/content/meta.ts::routeSeoEntries` gains a `jsonLd: SchemaOrgNode[]` field alongside existing title/description/canonical/ogType/noIndex. Static entries compose inline via factory calls. Dynamic factories build `jsonLd` the same way they build title/description.

Example — dynamic `/blog/[slug]`:

```ts
'/blog/[slug]': async (params, locale) => {
  const { adapter } = await import('$lib/adapters');
  const post = await adapter.blog.bySlug(params.slug);
  if (!post) throw new Error(`Unknown blog slug: ${params.slug}`);
  return {
    title: { en: `${post.title.en} | yesid.` },
    description: fitDescriptionForSeo(post.excerpt),
    canonical: `${SITE_HOST}/blog/${post.slug}`,
    ogType: 'article',
    noIndex: false,
    jsonLd: [
      buildBlogPostingNode(post, locale),
      buildBreadcrumbListNode(
        [
          { name: 'Home', url: SITE_HOST },
          { name: 'Blog', url: `${SITE_HOST}/blog` },
          { name: post.title.en, url: `${SITE_HOST}/blog/${post.slug}` },
        ],
        `${SITE_HOST}/blog/${post.slug}`,
      ),
    ],
  };
},
```

Zod parses the entire returned object through the extended `PageSeoSchema` at the static adapter boundary (`forRoute`). A malformed node fails fast with a legible error.

## Testing strategy

Four layers, scaled from cheapest to most expensive:

### Layer 1 — Zod at factory boundary (automatic)

Every factory ends with `SchemaOrgNodeSchema.parse(built)`. Free validation; no per-field test assertions required.

### Layer 2 — Unit tests (~50 new)

| File | Tests | Purpose |
|---|---|---|
| `src/lib/schemas/jsonld.test.ts` | ~20-25 | Valid/invalid/edge-case per schema (8 schemas × 2-4 tests) |
| `src/lib/adapters/jsonld.test.ts` | ~20 | Factory produces Zod-parseable node; correct `@id`; domain-specific assertions |
| `src/lib/components/seo/JsonLd.test.ts` | ~5 | Emit count, round-trip parse, `<` escape regression guard |
| `src/lib/adapters/meta.test.ts` (extended) | ~5 | Integration: static + dynamic route entries include jsonLd through `forRoute` |

All 889 existing 15a tests stay green — the extension is additive.

### Layer 3 — Manual external validation (per Q4 decision)

After implementation, run against `bun run preview` at `http://localhost:4173`. Log results to `docs/slices/slice-15/slice-15b/preview-validation.md`:

| Route | Tool | Pass criteria |
|---|---|---|
| `/` | validator.schema.org (paste JSON) | 0 errors |
| `/about` | validator.schema.org | 0 errors |
| `/blog/{real-post}` | validator.schema.org | 0 errors |
| `/projects/{real-project}` | validator.schema.org | 0 errors |
| `/services/{real-service}` | validator.schema.org | 0 errors |
| same 5 | Chrome DevTools MCP → Lighthouse SEO | **100** on every route |
| same 5 | Google Rich Results Test | Deferred to PR preview URL (needs public URL) — same pattern as 15a |

### Layer 4 — Build-time gate (no new code)

Existing `bun run check:sitemap` runs on `bun run build`. No new build-time check needed for 15b — Zod-at-boundary + Layer 2 test suite cover the contract.

## Acceptance criteria

**Code:**
- [ ] `PageSeoSchema` extended with optional `jsonLd: SchemaOrgNode[]`; all 15a tests stay green
- [ ] `src/lib/schemas/jsonld.ts` defines 8 Zod schemas as a discriminated union on `@type`
- [ ] `src/lib/adapters/jsonld.ts` exports 8 factory functions + `PERSON_ID` / `WEBSITE_ID` constants; every factory ends with `SchemaOrgNodeSchema.parse(...)`
- [ ] `src/lib/components/seo/JsonLd.svelte` emits one `<script type="application/ld+json">` wrapping nodes in `@graph` when `nodes.length > 0`; zero tags otherwise; `<` escape guards against premature termination
- [ ] `SeoHead.svelte` mounts `<JsonLd>` as a child when `seo.jsonLd` is non-empty
- [ ] All 11 routes in the per-route map have correct `jsonLd` populated via `routeSeoEntries`
- [ ] Legacy `src/lib/utils/json-ld.ts` + `src/lib/utils/json-ld.test.ts` deleted
- [ ] `getPersonSchema()` + legacy import removed from `src/lib/repositories/meta.ts`
- [ ] `ARCHITECTURE.md` + `TESTS.md` updated; `+layout.svelte` comment flipped to past tense

**Tests:**
- [ ] ~50 new tests across schemas, factories, component, integration
- [ ] `bun run test` — all 889 existing + ~50 new pass; zero regressions
- [ ] `bun run check` — 0 errors
- [ ] `bun run build` — passes end-to-end (sitemap gate included)

**Validation:**
- [ ] validator.schema.org — 0 errors on 5 canonical URLs
- [ ] Lighthouse SEO — 100 on 5 canonical URLs (home, about, one blog, one project, one service)
- [ ] Google Rich Results Test — deferred to PR preview URL with checklist embedded in PR body
- [ ] `preview-validation.md` committed with pass markers + relevant screenshots

## Scope

**In scope:** Everything described above.

**Out of scope:**
- Per-post / per-project auto-generated OG images (Slice 15c, post-Payload)
- Rest of Zod rollout across content/projects/blog/services types (Slice 17c)
- Adding `datePublished` or any date field to the `Project` type (17c or 18)
- Minting a fictional `Organization` node (decision: Person-as-publisher is the shipping pattern)
- French / Spanish locale content — `PUBLISHED_LOCALES` stays `['en']`; `availableLanguage` reflects that
- Any 15a follow-up / bug fix — 15a is shipped; new bugs become their own follow-up

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `@graph` pattern less common than separate scripts; validator lags | Low | validator.schema.org and Google's own docs fully support `@graph`; smoke-test in Layer 3 |
| `{@html}` + `<` escape oversight → XSS via a data field | Low | Domain data is Zod-parsed (all strings); escape `<` → `\u003c` is the belt-and-braces guard; regression test in Layer 2 |
| BlogPosting `publisher: Person` triggers Google soft warning | Medium | Documented in preview-validation.md; not a blocker — page still eligible for rich cards |
| Legacy deletion breaks a caller we didn't find | Low | `getPersonSchema` has one caller (itself via repository export); grep-verified in Task 9 |
| Test count drifts past ~50 | Low | Layer 1's free Zod validation covers most field-level checks; trim redundant Layer 2 if approaching 80 |
| Dynamic route factories fail under Payload later | Low | Factories depend on domain types (Project/Service/BlogPost), not adapter internals; Payload populates same types |

## Task preview

`plan.md` will flesh these out with TDD + STOP gates (implementer → spec reviewer → code quality reviewer → Yesid approves → next task).

1. **15b-1** — Zod schemas (`schemas/jsonld.ts` + tests for all 8 types)
2. **15b-2** — Extend `PageSeoSchema` with `jsonLd` (additive; 15a tests stay green)
3. **15b-3** — Factories for reference-anchor nodes: `buildPersonNode`, `buildWebSiteNode` + `PERSON_ID` / `WEBSITE_ID` constants
4. **15b-4** — Factories for page-type nodes: `buildProfilePageNode`, `buildCollectionPageNode`, `buildBreadcrumbListNode`
5. **15b-5** — Factories for domain-content nodes: `buildBlogPostingNode`, `buildServiceNode`, `buildCreativeWorkNode`
6. **15b-6** — `JsonLd.svelte` component + tests
7. **15b-7** — `SeoHead.svelte` wiring + integration tests in `meta.test.ts`
8. **15b-8** — Populate `jsonLd` on all 11 routes in `routeSeoEntries`
9. **15b-9** — Legacy cleanup: delete `utils/json-ld.*`, drop `getPersonSchema`, update `ARCHITECTURE.md` + `TESTS.md`, flip `+layout.svelte` comment
10. **15b-10** — Manual validation sweep: 5 URLs × {validator.schema.org, Lighthouse} → `preview-validation.md`

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-19 | Initial stub | Planned alongside 15a; implementation awaits 15a ship |
| 2026-04-20 | Full rewrite from stub | 15a shipped; brainstormed 6 decisions (legacy delete, @graph + @id, /blog/personal nested, Zod-at-boundary + manual validation, no project dates, Person-as-publisher); added full architecture, per-route map, testing strategy, acceptance criteria, risks, task preview |
| 2026-04-20 | Dropped `availableLanguage` from `ServiceSchema` + `buildServiceNode` (design principle 6 amended) | Codex review flagged a validator.schema.org warning: Schema.org defines `availableLanguage` on `ContactPoint` / `Place` / `ServiceChannel`, **not** on `Service` directly. `PUBLISHED_LOCALES` is en-only today so nothing material is lost. When fr/es content ships, locale info will re-enter via a nested `ServiceChannel` under `Service.availableChannel`. All 5 canonical URLs now pass validator.schema.org with 0 errors + 0 warnings. |
