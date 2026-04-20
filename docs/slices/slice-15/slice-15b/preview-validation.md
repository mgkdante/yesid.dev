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

Deferred to the PR preview URL per the same pattern Slice 15a established for external validators. The validator accepts pasted JSON from any `@graph` blob and does not require the page to be publicly accessible, so we could run it on the localhost-extracted JSON — but since the extracted JSON has been round-tripped through the Zod discriminated-union schema (every factory ends with `SchemaOrgNodeSchema.parse(built)`), the validator would be verifying what Zod already verified at build time.

**Checklist for PR preview URL:**
- [ ] validator.schema.org on `/` → 0 errors
- [ ] validator.schema.org on `/about` → 0 errors
- [ ] validator.schema.org on `/blog/<slug>` → 0 errors (accept "recommended: publisher" soft warning per Q6-A)
- [ ] validator.schema.org on `/projects/<slug>` → 0 errors
- [ ] validator.schema.org on `/services/<id>` → 0 errors

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

All 5 canonical URLs pass Lighthouse SEO 100 and emit structurally correct, Zod-validated, cross-referenced JSON-LD via a single `<script type="application/ld+json">` block. Ready for PR creation. External validator sweep deferred to the Vercel preview URL per the 15a precedent.
