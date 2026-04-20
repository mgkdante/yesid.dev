# Sub-Slice 15a — SEO Foundation (Payload-ready, localized)

**Level 2 design spec.** Purpose: describe outcomes + architectural decisions + acceptance criteria. Implementation plan lives in `plan.md`.

**Status:** draft
**Parent slice:** Slice 15 (`../README.md`)
**Depends on:** 17b (hexagonal data layer + `LocalizedString`) ✓ shipped
**Est. Sessions:** 2

## Objective

Ship every public route with localized, Payload-ready meta + Open Graph + Twitter Card metadata, a locale-aware sitemap, a robots.txt, and type-level enforcement so adding a new page without SEO is impossible — all flowing through the Slice 17b hexagonal data layer so the Slice 18 Payload CMS swap requires zero page-code changes.

## Context

yesid.dev's discoverability is currently uneven. Some pages share correctly on LinkedIn; many do not. Recruiters and clients find portfolios by Googling "data engineer Montreal" / "SQL transit pipeline" — if the site isn't individually discoverable per blog post, project, and service page, it's invisible to the exact people Yesid is trying to reach.

Two downstream commitments shape this sub-slice's architecture more than the feature list itself:

1. **Slice 18 — Payload CMS.** Blog posts, projects, and page-level copy will migrate from TypeScript files into Payload (separate repo `yesid.dev-cms`, Neon Postgres). SEO must flow through the same hexagonal port pattern as every other content type (17b) so the adapter swap is a one-file change.
2. **Future French + Spanish locales.** Every meta field is localized; every public route is emitted in the sitemap once per published locale; `og:locale:alternate` + `hreflang` tags are wired from day one even when only `en` is published. Translations slot in without structural change.

A third commitment — Zod validation — is brought forward from the planned Slice 17c into 15a, narrowly scoped to the `PageSeo` contract. The schema IS the contract Payload must honor, so defining it now avoids retrofitting later; 17c later rolls the same pattern across the rest of the data layer.

## Design principles

1. **Port-first, adapter-second.** `PageSeo` is defined by a Zod schema and exposed through a repository port. The TypeScript adapter (this sub-slice) and the future Payload adapter (Slice 18) are interchangeable. Pages never know which adapter is in use.
2. **Localization is structural, not a feature.** Every text field is `LocalizedString`. Every meta tag, sitemap entry, and link resolves per-locale. English-only today; FR/ES drop in by adding keys, not by refactoring.
3. **Missing SEO must be impossible.** Type-level enforcement (`PageData.seo` required) + build-time gate (sitemap coverage check) + dev-mode runtime warning. Three layers so no single oversight leaks to production.
4. **Default + override.** Site-level defaults (default OG image, site name, canonical host, published-locales list) live in one file. Every route overrides what it needs and inherits the rest. Pages stay minimal.
5. **Zod defines the contract, not the UI.** `PageSeoSchema` validates once at the adapter boundary. Components trust parsed data. Validation stays at the seam, not in rendering code.

## Architecture

### Port contract (`src/lib/schemas/seo.ts`)

```ts
const LocalizedStringSchema = z.object({ en: z.string(), fr: z.string().optional(), es: z.string().optional() });

export const PageSeoSchema = z.object({
  title: LocalizedStringSchema,              // optimum ≤ 60 chars (warn > 60), Zod hard-fail > 70
  description: LocalizedStringSchema,        // optimum 150–160 chars; warn outside; Zod hard-fail outside 50–200
  canonical: z.string().url(),               // absolute URL including host
  ogImage: z.object({
    url: z.string(),
    alt: LocalizedStringSchema,
    width: z.number().default(1200),
    height: z.number().default(630),
  }).optional(),                             // falls back to default branded image
  ogType: z.enum(['website', 'article', 'profile']).default('website'),
  noIndex: z.boolean().default(false),       // /preview, draft routes, 404
});

export type PageSeo = z.infer<typeof PageSeoSchema>;

// NOTE: 15b will extend PageSeoSchema via `.extend({ jsonLd: z.array(SchemaOrgNodeSchema).optional(), breadcrumbs: z.array(CrumbSchema).optional() })`.
// 15a does not define or consume those fields. Schema files stay separate so the extension is a clean additive diff.
```

### Data flow

```
+page.ts.load()
   └─ repositories/meta.ts → getPageSeo(routeId, locale)
        └─ adapters/meta.ts → PageSeoSchema.parse(rawEntry)
             └─ content/meta.ts (TS source today; Payload GraphQL in Slice 18)

+layout.svelte
   └─ <SeoHead seo={$page.data.seo} />
        └─ <svelte:head>: title, meta, OG, Twitter, canonical, hreflang, og:locale:alternate
```

Nested route SEO wins over parent (e.g., `/blog/[slug]` overrides `/blog`'s default). The `$page.data.seo` resolution is handled by SvelteKit's standard `load` chain — no custom merge logic required; the nearest `load` returning `seo` wins.

### Site-level defaults (`src/lib/utils/seo-defaults.ts`)

Single source of truth for fallbacks:

- `SITE_HOST` — `https://yesid.dev` (production canonical host; hook for env var later)
- `DEFAULT_OG_IMAGE` — `/og/default.png` (1200×630 branded)
- `SITE_NAME` — `yesid.`
- `PUBLISHED_LOCALES` — `['en']` today; append `'fr'`, `'es'` when translations ship. Used by sitemap generator and `og:locale:alternate` emission.
- `DEFAULT_LOCALE` — `'en'` (matches existing `resolveLocale()` contract)

### Enforcement — three layers

1. **Type-level.** `app.d.ts` extends `PageData` / `LayoutData` to require `seo: PageSeo`. Any `+page.ts` that doesn't return `seo` is a TS error caught by `bun run check`.
2. **Build-time.** `scripts/check-sitemap-coverage.ts` runs as a post-build step wired into `package.json`'s build script:
   - Enumerates **expected** routes: walks `src/routes/**/+page.svelte`, expands dynamic segments (`[id]`, `[slug]`) by calling the content adapter for every public Project / Service / BlogPost.
   - Enumerates **actual** routes: invokes the same sitemap-generation logic used by `/sitemap.xml/+server.ts` (imported as a pure function — no HTTP round-trip).
   - Subtracts an explicit exclusions list (`/preview`, `noIndex: true` routes).
   - Diffs. Missing entries on either side = non-zero exit and build failure. The diff is printed so the fix is obvious.
3. **Dev-mode runtime.** `SeoHead.svelte` emits `console.warn` when critical fields are missing/empty or when `description` falls outside the 50–200 char band. Warnings are silenced in production.

### Locale-aware output

Every `<SeoHead>` render emits:
- `<title>{resolveLocale(seo.title, currentLocale)}</title>`
- `<meta name="description" content={resolveLocale(seo.description, currentLocale)}>`
- `<link rel="canonical" href={seo.canonical}>` (host-prefixed; locale-agnostic for EN-only today)
- `<meta property="og:locale" content="{currentLocale}_CA">` (e.g., `en_CA`)
- `<meta property="og:locale:alternate" content="{other}_CA">` × each other published locale
- `<link rel="alternate" hreflang="{locale}" href="{canonical-per-locale}">` × each published locale + `x-default`
- Complete OG set: `og:title`, `og:description`, `og:image`, `og:image:alt`, `og:url`, `og:type`, `og:site_name`
- Complete Twitter set: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`
- Theme meta: `theme-color=#141414`, `color-scheme=dark`, viewport (already present in layout; kept consolidated here)

Locale URL strategy today: `https://yesid.dev/{route}` for EN (no prefix). When FR/ES ship, the hreflang and canonical outputs need per-locale URLs — 15a centralizes that resolution in one helper (`canonicalFor(routeId, locale)` in `utils/seo-defaults.ts`) so the future FR/ES slice changes one function, not every route. The URL scheme itself (subdomain vs. path prefix vs. accept-language negotiation) is deferred to the slice that introduces the second locale.

### Sitemap & robots

- `src/routes/sitemap.xml/+server.ts` — returns `application/xml` with one `<url>` per (public route × published locale). Each `<url>` includes `<xhtml:link rel="alternate" hreflang="...">` self-references for every published locale. `lastmod` from data where available (blog posts have `publishedAt`); falls back to build time for static routes. Excludes `noIndex: true` routes.
- `src/routes/robots.txt/+server.ts` — returns `text/plain` with `User-agent: *`, `Allow: /`, `Disallow: /preview`, `Sitemap: https://yesid.dev/sitemap.xml`.

Both server routes — not prerendered — so Payload-sourced routes (Slice 18) automatically appear without rebuild-and-deploy. For the current TS-only content, server routes still work; performance is non-issue at portfolio scale.

### Files

**Create:**
```
src/lib/schemas/seo.ts                       — PageSeoSchema, LocalizedStringSchema (re-export) in Zod; CrumbSchema is 15b territory
src/lib/schemas/seo.test.ts                  — schema validation happy/sad paths
src/lib/adapters/meta.ts                     — forRoute(routeId, locale) → PageSeo; Zod parse at boundary
src/lib/adapters/meta.test.ts                — adapter contract + locale fallback
src/lib/repositories/meta.ts                 — port: getPageSeo(routeId, locale)
src/lib/components/seo/SeoHead.svelte        — renders <svelte:head>: title/meta/OG/Twitter/canonical/hreflang
src/lib/components/seo/SeoHead.test.ts       — tag emission per locale, missing-field warnings
src/lib/utils/seo-defaults.ts                — SITE_HOST, DEFAULT_OG_IMAGE, SITE_NAME, PUBLISHED_LOCALES, DEFAULT_LOCALE
src/routes/sitemap.xml/+server.ts            — route × locale iteration
src/routes/sitemap.xml/+server.test.ts       — routes, hreflang, exclusions
src/routes/robots.txt/+server.ts             — references sitemap, blocks /preview
src/routes/robots.txt/+server.test.ts        — directives correctness
scripts/check-sitemap-coverage.ts            — build-time gate; fails on route/sitemap mismatch
static/og/default.png                        — 1200×630 branded default (wordmark + tagline on dark)
```

**Modify:**
```
src/lib/types.ts                             — re-export PageSeo from schemas/seo.ts (types.ts stays authoritative)
src/lib/content/meta.ts                      — extend with per-route PageSeo entries for every public route
src/routes/+layout.ts                        — load returns site-level default seo
src/routes/+layout.svelte                    — mount <SeoHead seo={$page.data.seo} />
src/routes/+page.ts                          — returns home seo
src/routes/about/+page.ts                    — returns about seo
src/routes/contact/+page.ts                  — returns contact seo
src/routes/services/+page.ts                 — returns services-index seo
src/routes/services/[id]/+page.ts            — returns per-service seo via adapter
src/routes/projects/+page.ts                 — returns projects-index seo
src/routes/projects/[id]/+page.ts            — returns per-project seo via adapter
src/routes/blog/+page.ts                     — returns blog-index seo
src/routes/blog/[slug]/+page.ts              — returns per-post seo via adapter
src/routes/tech-stack/+page.ts               — returns tech-stack seo
src/routes/+error.svelte                     — renders <SeoHead seo={errorSeo}> with noIndex: true; errorSeo lives in src/lib/content/meta.ts alongside other route entries
src/app.d.ts                                 — extend PageData/LayoutData to require seo
package.json                                 — add "zod"; add "check:sitemap" script; wire into build
```

**Delete:** none (scattered `<svelte:head>` blocks in existing pages are replaced by `<SeoHead>` consumption; the handful of existing `<title>` / `<meta>` lines are removed per file as `SeoHead` takes over).

## Reference sites / prior art

- **Internal:** Slice 12 shipped a basic JSON-LD Person schema + orange-dot favicon. That structure moves into `src/lib/adapters/jsonld.ts` in 15b; 15a leaves the existing tag untouched until the JSON-LD migration lands.
- **Internal:** Slice 17b established the `repositories/` + `adapters/` split + `LocalizedString` contract. 15a follows the exact same pattern.
- **External:** `svelte.dev` — per-page `<svelte:head>` with fallback defaults. `shadcn-svelte.com` — locale-aware meta via a head component + site config file. `nextra.site` — hreflang per locale per route.

## Scope

**In scope:**
- `PageSeoSchema` Zod contract + TS type derivation
- `meta` port + TS adapter reading from `src/lib/content/meta.ts`
- Per-route SEO entries for every existing public route (home, about, contact, services index + 3 detail, projects index + every public project, blog index + every public post, tech-stack, 404)
- `SeoHead` component rendering full meta + OG + Twitter + canonical + hreflang + `og:locale:alternate`
- Site-level defaults + default branded OG image (1200×630)
- `sitemap.xml` and `robots.txt` server routes; sitemap iterates route × published locale with self-referencing hreflang
- Build-time coverage gate wired into `bun run build`
- Type-level `PageData.seo` enforcement via `app.d.ts`
- Dev-mode warning for missing/out-of-range critical fields
- Unit tests (schemas, adapter, component, sitemap, robots)
- Manual share-validation pass on LinkedIn / Twitter / Slack / Discord / opengraph.xyz for 5 representative pages; Lighthouse SEO ≥ 95 on all page types; results logged in `handoff.md`

**Out of scope (deferred):**
- JSON-LD structured data (BlogPosting / Service / Person / WebSite / BreadcrumbList / ProfilePage) → **Slice 15b**
- Per-post / per-project auto-generated OG images via Satori → **Slice 15c** (after Payload lands, since Payload will supply cover images)
- Google Search Console setup → **Slice 22** (post-deploy)
- Analytics → separate concern, not in this slice
- Actual FR/ES translations → future; 15a wires the structure (add key to `PUBLISHED_LOCALES`, fill `LocalizedString` keys in `content/meta.ts`, extend `canonicalFor()` for the chosen URL scheme)
- Locale URL scheme decision (subdomain vs. path prefix vs. accept-language) → deferred to the slice that introduces the second locale
- Zod rollout across `content` / `projects` / `blog` / `services` repositories → **Slice 17c**; 15a narrowly Zod-validates only the `PageSeo` contract

## Acceptance criteria

- [ ] `PageSeoSchema` defined in `src/lib/schemas/seo.ts` with validation for title, description, canonical, ogImage, ogType, noIndex (no breadcrumbs / jsonLd in 15a — reserved for 15b extension)
- [ ] Adapter parses via Zod at the boundary; `adapters/meta.test.ts` covers valid/invalid/locale-fallback
- [ ] Every public route returns `seo: PageSeo` from its `+page.ts` or parent `+layout.ts`
- [ ] `SeoHead.svelte` emits: `<title>`, `<meta name="description">`, `<link rel="canonical">`, complete OG set (title, description, image, image:alt, url, type, site_name, locale, locale:alternate × other published locales), complete Twitter Card set (card, title, description, image, image:alt), `<link rel="alternate" hreflang>` per published locale + x-default, theme-color, color-scheme
- [ ] `src/lib/content/meta.ts` has entries for every public route: home, about, contact, services (index + every public service detail), projects (index + every public detail), blog (index + every public post), tech-stack, 404
- [ ] `/sitemap.xml` returns valid XML; one `<url>` per (public route × published locale); each has self-referencing `xhtml:link` hreflang entries; excludes `noIndex` routes and `/preview`
- [ ] `/robots.txt` returns valid text; references sitemap; allows `/`; disallows `/preview`
- [ ] `app.d.ts` requires `seo: PageSeo` on `PageData` / `LayoutData`; `bun run check` catches any route missing SEO
- [ ] `scripts/check-sitemap-coverage.ts` runs as a post-build step; build fails when declared public routes ≠ sitemap entries (excluding explicit exclusions)
- [ ] `SeoHead.svelte` logs a console warning in dev when `title` > 60 chars (warn) / > 70 (Zod already rejected), `description` outside 150–160 chars (warn), or when critical fields are empty; silent in production builds. Zod hard-fails are surfaced at adapter parse time, before the component renders.
- [ ] Default OG image shipped at `static/og/default.png` (1200×630, branded wordmark + tagline on dark bg); all routes without a custom `ogImage` fall back to it
- [ ] `bun run build` succeeds; `bun run test` passes; `bun run check` returns 0 errors
- [ ] Manual share validation logged in `handoff.md`: LinkedIn Post Inspector, Twitter Card Validator, opengraph.xyz, Slack unfurl, Discord unfurl — each tested on home + about + one blog + one project + one service (5 URLs × 5 tools = 25 screenshots or pass markers)
- [ ] Lighthouse SEO score ≥ 95 on home, about, one blog, one project, one service (100 target reached in 15b once JSON-LD lands)
- [ ] When `PUBLISHED_LOCALES` is edited to include `'fr'`, no template change is needed for hreflang and `og:locale:alternate` to start emitting correctly (verified via test: temporarily add `fr`, confirm output, revert)

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-19 | Initial draft | Brainstorming session — post-17k, pre-18 |
