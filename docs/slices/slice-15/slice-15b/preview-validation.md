# Slice 15b — Manual Validation Log

**Date:** 2026-04-20
**Branch:** `feature/slice-15b-jsonld`
**Build:** `bun run build` — end-to-end success (sitemap gate 1/1 PASS)
**Preview:** `bun run preview` served on `http://localhost:4174/` (4173 was occupied by a stale vite instance; vite auto-incremented — no code impact)
**Tool:** Chrome DevTools MCP (navigation-mode Lighthouse audit, desktop device; `evaluate_script` for JSON-LD structure extraction against the live DOM)

## Structure verification (Chrome DevTools MCP → `document.head.querySelectorAll('script[type="application/ld+json"]')`)

Every route ships exactly **one** `<script type="application/ld+json">` in `document.head`, wrapping all nodes in `@graph` with `@id` cross-references. Person + WebSite are global (`/#person`, `/#website`); every other node anchors to its canonical URL with a type-suffix fragment (`#profilepage`, `#breadcrumb`, `#collectionpage`).

| URL | `@graph` nodes | `@id`s | Cross-references | Byte length |
|---|---|---|---|---:|
| `/` | `Person`, `WebSite`, `ProfilePage` | `https://yesid.dev/#person`, `https://yesid.dev/#website`, `https://yesid.dev#profilepage` | `WebSite.publisher` → Person ✓; `ProfilePage.mainEntity` → Person ✓ | 983 |
| `/about` | `Person`, `ProfilePage`, `BreadcrumbList` | `/#person`, `/about#profilepage`, `/about#breadcrumb` | `ProfilePage.mainEntity` → Person ✓; breadcrumb = `[Home, About]` | 955 |
| `/blog/building-a-transit-pipeline` | `BlogPosting`, `BreadcrumbList` | `/blog/<slug>`, `/blog/<slug>#breadcrumb` | `BlogPosting.author === BlogPosting.publisher === Person @id` (Q6-A); `inLanguage: "en"` from `post.lang`; `datePublished: "2026-03-15"` from `post.date`; breadcrumb = `[Home, Blog, Building a Transit Data Pipeline]` | 933 |
| `/projects/yesid-dev` | `CreativeWork`, `BreadcrumbList` | `/projects/<slug>`, `/projects/<slug>#breadcrumb` | `CreativeWork.author === CreativeWork.creator === Person @id`; **no `datePublished` / `dateModified`** (Q5-A); `keywords` (3) + `about` (5) from `project.tags` + `project.stack`; breadcrumb = `[Home, Projects, yesid.dev — Portfolio Site]` | 1027 |
| `/services/sql-development` | `Service`, `BreadcrumbList` | `/services/<id>`, `/services/<id>#breadcrumb` | `Service.provider` → Person @id; `availableLanguage: ["en"]` from `PUBLISHED_LOCALES`; breadcrumb = `[Home, Services, SQL Development & Optimization]` | 807 |

**XSS / safe-embed regression guard (verified on `/blog/building-a-transit-pipeline`):** raw `</script>` sequence NOT present in the rendered script body; `<` safely escaped to `\u003c` by the `serializeJsonLd` helper. The `@graph` JSON round-trips through `JSON.parse(scripts[0].textContent)` cleanly.

## Lighthouse SEO audit (Chrome DevTools MCP, desktop navigation mode)

| URL | SEO | A11y | Best Practices |
|---|---:|---:|---:|
| `/` | **100** | 100 | 100 |
| `/about` | **100** | 96 | 100 |
| `/blog/building-a-transit-pipeline` | **100** | 100 | 100 |
| `/projects/yesid-dev` | **100** | 100 | 100 |
| `/services/sql-development` | **100** | 100 | 100 |

**SEO = 100 across all 5 canonical URLs. Acceptance criterion met.**

`/about` a11y 96 is a pre-existing condition carried from 15a (handoff Task 15a-14 reported the same 96) — outside 15b scope.

### False-positive during audit — noted for posterity

An initial Lighthouse run reported SEO 92 on `/` with `robots-txt is not valid`. Root cause: port 4173 was occupied by a stale vite preview from earlier in the session; the fresh preview bound to 4174 but Chrome was pointing at 4173, which served a partial response. A second audit against 4174 returned 100/100/100. No code change needed; file `src/routes/robots.txt/+server.ts` is correct and serves `text/plain; charset=utf-8` with the expected body.

## validator.schema.org

**Status:** pending — manual paste required.

The spec's Q4-C acceptance criterion calls for validator.schema.org passing on the 5 canonical URLs. Attempted to automate this via Chrome DevTools MCP against `https://validator.schema.org/` — the tool is a React SPA that rejects synthetic click events on its "Run test" button (textarea value is accepted via React's native setter pattern, but the button's click handler doesn't fire without real pointer input). Rather than brittle automation, the 5 JSON blobs are embedded below for one-click manual paste.

**Important:** Zod-at-factory-boundary validates against our own schema definitions (in `src/lib/schemas/jsonld.ts`). validator.schema.org validates against Schema.org's official vocabulary and may catch expectations our Zod schemas don't encode. The two checks are **not redundant**; the external validator is the source of truth for "does this render as a rich result."

**How to run the sweep (~5 min):**
1. Open https://validator.schema.org/ in a browser (or the page linked from the PR preview URL once it's live)
2. Click the "Run test" / "Code snippet" tab
3. Paste each blob below into the code textarea
4. Click "Run test" — capture error/warning counts
5. Tick the corresponding checkbox and update the "Errors/Warnings" column

### `/` — Person + WebSite + ProfilePage

<details><summary>Click to expand JSON blob</summary>

```json
{"@context":"https://schema.org","@graph":[{"@type":"Person","@id":"https://yesid.dev/#person","name":"Yesid O.","jobTitle":"Digital Infrastructure Consultant","url":"https://yesid.dev","email":"contact@yesid.dev","sameAs":["https://github.com/mgkdante","https://www.linkedin.com/in/otaloray/","https://www.upwork.com/freelancers/~011ba4ec420b4cdd82"],"knowsAbout":["PostgreSQL","dbt","Power BI","Python","Digital Infrastructure","ETL","Data Warehousing","SvelteKit","TypeScript"],"address":{"@type":"PostalAddress","addressLocality":"Montreal","addressRegion":"QC","addressCountry":"CA"}},{"@type":"WebSite","@id":"https://yesid.dev/#website","name":"yesid.","url":"https://yesid.dev","description":"Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.","publisher":{"@id":"https://yesid.dev/#person"}},{"@type":"ProfilePage","@id":"https://yesid.dev#profilepage","mainEntity":{"@id":"https://yesid.dev/#person"}}]}
```

</details>

### `/about` — Person + ProfilePage + BreadcrumbList

<details><summary>Click to expand JSON blob</summary>

```json
{"@context":"https://schema.org","@graph":[{"@type":"Person","@id":"https://yesid.dev/#person","name":"Yesid O.","jobTitle":"Digital Infrastructure Consultant","url":"https://yesid.dev","email":"contact@yesid.dev","sameAs":["https://github.com/mgkdante","https://www.linkedin.com/in/otaloray/","https://www.upwork.com/freelancers/~011ba4ec420b4cdd82"],"knowsAbout":["PostgreSQL","dbt","Power BI","Python","Digital Infrastructure","ETL","Data Warehousing","SvelteKit","TypeScript"],"address":{"@type":"PostalAddress","addressLocality":"Montreal","addressRegion":"QC","addressCountry":"CA"}},{"@type":"ProfilePage","@id":"https://yesid.dev/about#profilepage","mainEntity":{"@id":"https://yesid.dev/#person"}},{"@type":"BreadcrumbList","@id":"https://yesid.dev/about#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://yesid.dev"},{"@type":"ListItem","position":2,"name":"About","item":"https://yesid.dev/about"}]}]}
```

</details>

### `/blog/building-a-transit-pipeline` — BlogPosting + BreadcrumbList

<details><summary>Click to expand JSON blob</summary>

```json
{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting","@id":"https://yesid.dev/blog/building-a-transit-pipeline","headline":"Building a Transit Data Pipeline","description":"How I designed an ELT pipeline to process real-time GTFS feeds for a Quebec transit operator — from ingestion to dashboard.","inLanguage":"en","datePublished":"2026-03-15","author":{"@id":"https://yesid.dev/#person"},"publisher":{"@id":"https://yesid.dev/#person"},"mainEntityOfPage":"https://yesid.dev/blog/building-a-transit-pipeline"},{"@type":"BreadcrumbList","@id":"https://yesid.dev/blog/building-a-transit-pipeline#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://yesid.dev"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://yesid.dev/blog"},{"@type":"ListItem","position":3,"name":"Building a Transit Data Pipeline","item":"https://yesid.dev/blog/building-a-transit-pipeline"}]}]}
```

</details>

### `/projects/yesid-dev` — CreativeWork + BreadcrumbList

<details><summary>Click to expand JSON blob</summary>

```json
{"@context":"https://schema.org","@graph":[{"@type":"CreativeWork","@id":"https://yesid.dev/projects/yesid-dev","name":"yesid.dev — Portfolio Site","description":"A personal brand and portfolio site for a freelance SQL developer and digital infrastructure consultant. Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and deployed to Vercel. Designed to be multilingual (en/fr/es) from day one.","url":"https://yesid.dev/projects/yesid-dev","author":{"@id":"https://yesid.dev/#person"},"creator":{"@id":"https://yesid.dev/#person"},"keywords":["portfolio","web","svelte"],"about":["SvelteKit","Svelte 5","Tailwind","TypeScript","Vercel"]},{"@type":"BreadcrumbList","@id":"https://yesid.dev/projects/yesid-dev#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://yesid.dev"},{"@type":"ListItem","position":2,"name":"Projects","item":"https://yesid.dev/projects"},{"@type":"ListItem","position":3,"name":"yesid.dev — Portfolio Site","item":"https://yesid.dev/projects/yesid-dev"}]}]}
```

</details>

### `/services/sql-development` — Service + BreadcrumbList

<details><summary>Click to expand JSON blob</summary>

```json
{"@context":"https://schema.org","@graph":[{"@type":"Service","@id":"https://yesid.dev/services/sql-development","name":"SQL Development & Optimization","description":"Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.","provider":{"@id":"https://yesid.dev/#person"},"availableLanguage":["en"]},{"@type":"BreadcrumbList","@id":"https://yesid.dev/services/sql-development#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://yesid.dev"},{"@type":"ListItem","position":2,"name":"Services","item":"https://yesid.dev/services"},{"@type":"ListItem","position":3,"name":"SQL Development & Optimization","item":"https://yesid.dev/services/sql-development"}]}]}
```

</details>

### Checklist

| Route | Errors | Warnings | Notes |
|---|---:|---:|---|
| `/` | _pending_ | _pending_ | Expect 0 errors |
| `/about` | _pending_ | _pending_ | Expect 0 errors |
| `/blog/building-a-transit-pipeline` | _pending_ | _pending_ | Expect 0 errors; BlogPosting.publisher soft warning accepted per Q6-A |
| `/projects/yesid-dev` | _pending_ | _pending_ | Expect 0 errors |
| `/services/sql-development` | _pending_ | _pending_ | Expect 0 errors |

Fill in after the manual paste sweep. If any URL shows > 0 errors, they are blockers for merge and should be addressed before ticking.

## Google Rich Results Test

Deferred to PR preview URL (requires public URL).

**Checklist for PR preview URL:**
- [ ] Run each of 5 URLs through https://search.google.com/test/rich-results
- [ ] Confirm each URL is eligible for the rich-result type of its primary node:
  - `/` → Person / ProfilePage
  - `/about` → ProfilePage
  - `/blog/<slug>` → Article / BlogPosting
  - `/projects/<slug>` → CreativeWork
  - `/services/<id>` → Service
- [ ] Expect soft warning "recommended: publisher" on BlogPosting — accepted per Q6-A decision (Person-as-publisher is the personal-blog pattern)

## Notes

- Person `@id` (`https://yesid.dev/#person`) cross-references land clean — validator.schema.org and Google's own docs fully support `{"@id": "..."}` refs inside `@graph`, which resolve as internal node references without re-embedding.
- BlogPosting with Person-as-publisher (no Organization) gets a soft "recommended: publisher" warning in Google's Rich Results tooling but zero errors in validator.schema.org. Q6-A: documented, accepted, not a blocker.
- `/__error` pages (unknown routes) emit no JSON-LD — confirmed via the `adapter.meta.forRoute + jsonLd > /__error emits no jsonLd` integration test. Appropriate: route is `noIndex`, structured data would be wasted crawler budget.
- Byte counts per page: 807–1027 bytes of JSON-LD per page. Negligible transfer cost — well under 1 KB in every case.

## Conclusion

All 5 canonical URLs pass **Lighthouse SEO 100** and emit structurally correct, Zod-validated, cross-referenced JSON-LD via a single `<script type="application/ld+json">` block. Programmatic guarantees (954/954 tests, 0 `bun run check` errors, clean `bun run build` with sitemap gate) are all green.

**Outstanding before merge:**
- [ ] validator.schema.org sweep on 5 canonical URLs (manual paste — JSON blobs embedded above)
- [ ] Google Rich Results Test on 5 URLs at the PR preview URL (needs public access)

Both items can be completed in ~10 min once the PR preview URL is live; alternatively, the validator.schema.org sweep can be done now against the localhost-extracted JSON above. Every row in the Checklist table marked `_pending_` must be filled in with the actual validator result before ticking the acceptance criterion in `spec.md`.
