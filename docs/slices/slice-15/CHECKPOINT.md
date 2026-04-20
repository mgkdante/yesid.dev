# Slice 15 — Checkpoint

**Last updated:** 2026-04-20 | **15a SHIPPED (PR #26 merged, slice closed via `slice:close 15a`). Next: 15b JSON-LD & Rich Results.**
**Branch:** `main` (feature branches close via `bun run slice:close`)
**Status:** between sub-slices — no active bundle in repo. Slice 15 remains active (15b next, 15c deferred to post-Slice 18).

## Just shipped — 15a SEO Foundation (Payload-ready, localized)

**PR:** [#26](https://github.com/mgkdante/yesid.dev/pull/26) squash-merged 2026-04-20.
**Closed via:** `bun run slice:close 15a --name "SEO Foundation (Payload-ready, localized)" --pr 26`.
**Bundle archived at:** `<cloud>/yesid.dev/docs/archive/slices/slice-15/slice-15a/` (spec + plan + log + handoff).
**Tasks shipped:** 15a-1 (Zod + PageSeoSchema), 15a-2 (seo-defaults + canonicalFor), 15a-3 (MetaPort.forRoute contract), 15a-4 (routeSeoEntries), 15a-5 (static adapter forRoute), 15a-6 (getPageSeo repo), 15a-7 (SeoHead component), 15a-8 (layout wiring + home SSR re-enable), 15a-9 (/sitemap.xml), 15a-10 (/robots.txt), 15a-11 (build-time coverage gate), 15a-12 (locale-aware OG image), 15a-13 (404 verification), 15a-14 (Lighthouse 100 × 4 routes).
**Review-driven post-ship fixes:** DEFAULT_LOCALE re-export (drop duplicate), SITE_HOST template literals across content/meta.ts (12 hardcoded URLs replaced), /__error canonical trailing slash normalised.
**Outcome:** Layout-authoritative SEO. Every route SSRs complete meta (home SSR re-enabled — social crawlers see cards). Payload-ready: `adapter.meta.forRoute(route.id, locale, params)` is the one swap point for Slice 18. Zod brought forward narrowly (full rollout = Slice 17c). Locale-aware OG image via `siteMeta.tagline`-driven generator. 43 new tests (889/889 passing). Lighthouse SEO 100 × 4 page types.

## Next — 15b JSON-LD & Rich Results

**Status:** planned. Stub spec at [`slice-15b/spec.md`](./slice-15b/spec.md).
**Depends on:** 15a ✓ shipped.
**Est. sessions:** 1.
**Scope:** `.extend()` `PageSeoSchema` with `jsonLd` + `breadcrumbs`; add Schema.org factories (Person, WebSite, BlogPosting, Service, CreativeWork, BreadcrumbList, ProfilePage, CollectionPage); mount `<JsonLd>` inside `SeoHead`; validate via Google Rich Results Test + Schema.org validator; Lighthouse SEO stays at 100.
**Planning session start:** read [`./README.md`](./README.md) + [`slice-15b/spec.md`](./slice-15b/spec.md), brainstorm, write plan into `slice-15b/plan.md`.

## Upcoming

| Sub-slice | Status | Note |
|-----------|--------|------|
| ~~15a SEO Foundation~~ | ✅ SHIPPED 2026-04-20 (#26) | Meta + OG + Twitter + canonical + sitemap + robots + build gate + locale-aware OG image |
| **15b JSON-LD** | **planned — next** | Schema.org structured data via `.extend()` of PageSeoSchema |
| 15c Satori OG | deferred (post-18) | Per-post / per-project auto-generated OG images |

After Slice 15 fully closes (15b shipped): **17c Zod Schemas** → **18 Payload CMS** (separate `yesid.dev-cms` repo) → the rest (17f test architecture, 16 E2E/perf/brand QA, 19 mobile, 19b a11y, 20 scroll polish, 21 cleanup, 22 deploy).

## Tooling available (inherited from earlier slices)

**yesid.dev workflow:**
- `bun run slice:close <letter> --name "..." --pr <n>` — archive bundle + update index
- `bun run docs:mirror` / `bun run brand:mirror` — cloud mirror
- `bun run og:default` — regenerate locale-aware OG images from `siteMeta.tagline`
- `bun run check:sitemap` — sitemap coverage gate (runs as part of `bun run build`)
