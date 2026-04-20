# Sub-Slice 15b — JSON-LD & Rich Results

**Level 2 design spec.** Purpose: describe outcomes + architectural decisions + acceptance criteria. Implementation plan lives in `plan.md` (written after 15a ships).

**Status:** draft (awaiting 15a ship)
**Parent slice:** Slice 15 (`../README.md`)
**Depends on:** 15a (SEO foundation — `PageSeoSchema`, `SeoHead`, adapter, port)
**Est. Sessions:** 1

## Objective

Add Schema.org JSON-LD structured data to every page type so Google rich cards, Schema.org validator checks, and Lighthouse SEO 100 all pass — feeding the same hexagonal port pattern 15a established so Payload's migration (Slice 18) remains zero-page-code.

## Context

Most portfolio sites skip structured data entirely. Adding it is the differentiator that turns a generic link into a rich Google result with author photo, breadcrumbs, and site links. It also scaffolds the site for the AI-crawled future where LLMs prefer schema-described content.

15b deliberately splits from 15a because:
- 15a ships the visible social-preview win (LinkedIn / Twitter cards render correctly) without waiting for schema design.
- 15b's schemas benefit from having real content wired through 15a first — catching any adapter gaps before schema factories depend on them.
- Two smaller PRs are more reviewable than one giant one.

## Design principles

1. **Schemas feed from the same port.** 15b extends `PageSeoSchema` with `.extend({ jsonLd: z.array(SchemaOrgNodeSchema).optional(), breadcrumbs: z.array(CrumbSchema).optional() })` — additive, non-breaking for 15a entries that don't yet specify structured data.
2. **Typed factories, not string templates.** Every JSON-LD node comes from a Zod-validated factory (`buildPersonSchema`, `buildBlogPostingSchema`, etc.) that takes domain data in and emits validated output.
3. **Breadcrumbs on every subpage, always.** The structured nav path is what Google uses to render site hierarchy in SERPs.
4. **Locale-aware where schema allows.** `inLanguage` on BlogPosting; `availableLanguage` on Service; `description` fields use `resolveLocale()`.

## Architecture

### Per-route schema attachment

| Route                                   | Schemas attached                                       |
| --------------------------------------- | ------------------------------------------------------ |
| `/`                                     | `Person` (Yesid) + `WebSite` + `ProfilePage`           |
| `/about`                                | `Person` + `ProfilePage`                               |
| `/contact`                              | `BreadcrumbList`                                       |
| `/services`                             | `BreadcrumbList` + `CollectionPage`                    |
| `/services/[id]`                        | `Service` + `BreadcrumbList`                           |
| `/projects`                             | `BreadcrumbList` + `CollectionPage`                    |
| `/projects/[id]`                        | `CreativeWork` (custom profile) + `BreadcrumbList`     |
| `/blog`                                 | `BreadcrumbList` + `CollectionPage`                    |
| `/blog/[slug]`                          | `BlogPosting` + `BreadcrumbList`                       |
| `/tech-stack`                           | `BreadcrumbList`                                       |

### Files

**Create:**
```
src/lib/schemas/jsonld.ts                    — Zod schemas for Person, WebSite, BlogPosting, Service, BreadcrumbList, ProfilePage, CreativeWork, CollectionPage
src/lib/schemas/jsonld.test.ts               — schema validation
src/lib/adapters/jsonld.ts                   — factories: buildPersonSchema, buildWebSiteSchema, buildBlogPostingSchema, buildServiceSchema, buildBreadcrumbList, buildProfilePage, buildCreativeWorkSchema, buildCollectionPage
src/lib/adapters/jsonld.test.ts              — factories with real project/service/blog data fixtures
src/lib/components/seo/JsonLd.svelte         — renders <script type="application/ld+json"> per SchemaOrgNode
src/lib/components/seo/JsonLd.test.ts        — emits one script tag per node, JSON.stringify round-trip clean
./preview-validation.md                      — manual validation log (Google Rich Results, Schema.org validator, Lighthouse per page)
```

**Modify:**
```
src/lib/schemas/seo.ts                       — extend PageSeoSchema with jsonLd + breadcrumbs (additive; 15a left them out deliberately)
src/lib/components/seo/SeoHead.svelte        — mount <JsonLd seo={...} />
src/routes/+page.ts                          — attach Person + WebSite + ProfilePage
src/routes/about/+page.ts                    — attach Person + ProfilePage
src/routes/blog/[slug]/+page.ts              — attach BlogPosting + BreadcrumbList
src/routes/projects/[id]/+page.ts            — attach CreativeWork + BreadcrumbList
src/routes/services/[id]/+page.ts            — attach Service + BreadcrumbList
src/routes/contact/+page.ts                  — attach BreadcrumbList
src/routes/services/+page.ts                 — attach BreadcrumbList + CollectionPage
src/routes/projects/+page.ts                 — attach BreadcrumbList + CollectionPage
src/routes/blog/+page.ts                     — attach BreadcrumbList + CollectionPage
src/routes/tech-stack/+page.ts               — attach BreadcrumbList
```

## Scope

**In scope:**
- Zod schemas for every node type listed above
- Typed factories mapping domain data (Project / Service / BlogPost / site config) to Schema.org nodes
- `<JsonLd>` component rendering
- Per-route attachment for all page types
- Google Rich Results Test validation per schema type
- Schema.org validator validation per page type
- Lighthouse SEO = 100 on every page type
- Validation log committed to `preview-validation.md`

**Out of scope:**
- New meta / OG / Twitter tag additions (15a territory)
- Per-post OG image generation (15c)
- Sitemap / robots changes (15a shipped them; no changes needed)

## Acceptance criteria

- [ ] Every schema listed above has a Zod definition with field-level validation
- [ ] Every factory has a unit test proving it produces a validator-clean node from a realistic domain fixture
- [ ] Every public route has the schemas listed in the table above, consumable via `$page.data.seo.jsonLd`
- [ ] `<JsonLd>` component renders one `<script type="application/ld+json">` per node; JSON output parses clean
- [ ] Google Rich Results Test returns zero errors and zero warnings for one blog post, one project, one service, home, about
- [ ] Schema.org validator returns zero errors for same 5 URLs
- [ ] Lighthouse SEO = 100 on home, about, one blog, one project, one service
- [ ] `bun run build` succeeds; `bun run test` passes; `bun run check` returns 0 errors
- [ ] `preview-validation.md` captures screenshots or pass markers for every test tool × URL combination

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-19 | Initial stub | Planned alongside 15a; implementation awaits 15a ship |
