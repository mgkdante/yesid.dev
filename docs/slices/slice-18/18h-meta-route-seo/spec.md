# Slice 18h — Meta + route_seo

> Sub-slice of [Slice 18 — Cloud content layer (Directus)](../plan.md). See whole-slice plan for context + dependency graph.

## Purpose

Migrate the **site-identity record + editor-facing SEO surface** of yesid.dev from static TS modules to Directus. Two new collections:

- `site_meta` (singleton) — combined brand identity (name, tagline, links, owner address + jobTitle + knowsAbout) **AND** site-wide SEO defaults (default OG image, theme color, fallback description). One CMS singleton row, one source of truth for "who is yesid.dev" + "what should every page's SEO fall back to". (Q2 amendment 2026-04-27.)
- `route_seo` — per-route overrides for static routes (title, description, og_image)

**Two adapter methods read from the same singleton row** (Q9 amendment — 2026-04-27):

- `meta.site()` — flips from static const to CMS-backed; returns brand `SiteMeta` shape (TS unchanged from today). Consumed by jsonLd factories + Footer + About page.
- `meta.siteSeoDefaults()` — NEW; returns SEO defaults shape (`defaultOgImage`, `themeColor`, `defaultDescription`). Consumed by `<SeoHead>` (via `+layout.ts`) + composer.

Both share one CMS round-trip per request via internal `fetchSingletonRow()` helper + WeakMap memo on the raw row — clean port-level separation between brand-identity consumers and SEO consumers, no double-fetch.

`meta.forRoute()` becomes a **composer**: fetches `meta.site()` + `meta.siteSeoDefaults()` + `meta.routeSeo.byPath()`, merges with code-side technical fields (canonical, ogType, noIndex, jsonLd factories), returns the existing `PageSeo` shape so `<SeoHead>` consumes the same shape as today.

This is the smallest sub-slice of Slice 18 (~0.75 session post-Q2 expansion) — every primitive (M2O asset, translations, ai-editor permissions, parsePort gate, scaffold-port template) is already in place from 18a–18g. The only new shapes are the **singleton collection** in directus-sync (first in this repo) and the **two-port-from-one-row** pattern.

## Scope

### In scope

- New `site_meta` singleton (`meta.singleton: true`) with translations junction — combines **brand identity** (name, links, owner.*, tagline, description, jobTitle, knowsAbout) + **SEO defaults** (default_og_image, theme_color, default_description)
- New `route_seo` collection + translations junction (per-route overrides for static routes)
- Permissions matrix: ai-editor + human-editor + Public read for `site_meta` (always exposed) and `route_seo` (filtered by `status: published`)
- Seed scripts: `seed-site-meta.ts` (upsert singleton) + `seed-route-seo.ts` (multi-row collection seed)
- Adapter port `meta.site()`: flip from static const to CMS-backed; returns brand `SiteMeta` shape (TS UNCHANGED from today)
- Adapter port `meta.siteSeoDefaults()`: NEW; returns `SiteSeoDefaults` shape (`defaultOgImage`, `themeColor`, `defaultDescription`) from same singleton row (shared internal fetch via `fetchSingletonRow()` + WeakMap memo on raw row)
- Adapter port `meta.routeSeo.byPath(path)`: NEW; returns per-route overrides
- Adapter port `meta.forRoute()`: refactor to composer (CMS site + siteSeoDefaults + routeSeo + code-side technical defaults)
- `<SeoHead>` consumer: minimal change — accepts new optional `themeColor` prop sourced from `+layout.ts` data
- Type system: `apps/web/src/lib/types § SiteMeta` TS interface UNCHANGED (Q9). New `SiteSeoDefaults` TS interface in `packages/shared/src/types/content.ts`. New `RouteSeoOverride` TS interface in same. New Zod schemas: `apps/web/src/lib/schemas/site-seo-defaults.ts` + `apps/web/src/lib/schemas/route-seo.ts`. Existing `SiteMetaSchema` drift detector unchanged.
- Cleanup: brand `siteMeta` const **extracted** from `apps/web/src/lib/content/meta.ts` to new `apps/web/src/lib/content/site-meta.ts` (static-adapter test fixture); STATIC `routeSeoEntries` entries DELETED; `FALLBACK_DESCRIPTION` const DELETED; DYNAMIC factories EXTRACTED to `apps/web/src/lib/adapters/route-seo-factories.ts`

### Out of scope (deferred or dropped)

| Item | Disposition |
|---|---|
| Per-route `canonical` URL override | DROPPED — computed from `path + SITE_HOST`; making editors enter URLs is error-prone |
| Per-route `ogType` enum (website / article / profile) | DROPPED — code-side constant per route registry; technical, not editorial |
| Per-route `noIndex` boolean | DROPPED — code-side constant; only `/__error` is `noIndex: true` today |
| Per-route `jsonLd` (Person / WebSite / BreadcrumbList / etc.) | DROPPED — typed factories from `$lib/adapters/jsonld.ts` consume `meta.site()` brand fields + collection adapters; not editor-authorable |
| `og_title` + `og_description` override fields on `route_seo_translations` | DROPPED (Q5 locked) — `<SeoHead>` derives `og:title` from `title` and `og:description` from `description`. Adding override fields requires SeoHead changes too. YAGNI. |
| `twitter_handle` field on `site_meta` | DROPPED (Q6 locked) — no Twitter account exists; `<SeoHead>` doesn't currently emit `twitter:site` / `twitter:creator` |
| Per-item OG image for dynamic routes (`/blog/[slug]`, `/projects/[slug]`) | KEPT in collection schema — `blog_posts.cover_image` + `projects.image` already serve as per-item OG. Dynamic factories continue to pull from collection adapters (Q4 locked default) |
| Robots.txt CMS-driven | DROPPED — stays static |
| Sitemap CMS-driven | DROPPED — stays generated from build-time route walking |
| Static adapter retirement | DEFERRED to 18k — extracted `site-meta.ts` survives until full static-adapter retirement |

## Schema

### `site_meta` (singleton — `meta.singleton: true`)

Per CONVENTIONS § 2 + § 8 + § 9. **First Directus singleton in this repo.** Combines brand identity + SEO defaults per Q2 amendment.

#### Parent (international flat)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | int PK | ✓ | Singleton row uses `id: 1`; auto-set on first upsert (hidden in Data Studio) |
| `name` | string, ≤30 | ✓ | Brand name + `<title>` suffix. Currently `'yesid.'` — international (no translation needed) |
| `email` | string (email format) | ✓ | Contact email. Currently `'contact@yesid.dev'` |
| `github_url` | string (URL) | ✓ | Currently `'https://github.com/mgkdante'` |
| `linkedin_url` | string (URL), optional | – | Currently `'https://www.linkedin.com/in/otaloray/'` |
| `upwork_url` | string (URL), optional | – | Currently `'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82'` |
| `owner_name` | string, ≤80 | ✓ | Person name (jsonLd Person.name). Currently `'Yesid O.'` |
| `owner_locality` | string, ≤80 | ✓ | Address.locality (jsonLd Person.address.addressLocality). Currently `'Montreal'` |
| `owner_region` | string, ≤4 | ✓ | Address.region (ISO 3166-2 subdivision code). Currently `'QC'` |
| `owner_country` | string, length=2 | ✓ | Address.country (ISO 3166-1 alpha-2 code). Currently `'CA'` |
| `owner_knows_about` | CSV (tag-input UI) | ✓ | Person.knowsAbout array. Currently 9 entries — PostgreSQL, dbt, Power BI, Python, Digital Infrastructure, ETL, Data Warehousing, SvelteKit, TypeScript |
| `default_og_image` | M2O directus_files | – | Site-wide fallback OG image. Resolved via `asset(uuid, 'og-1200')` in consumer (1200×630 JPG preset per CONVENTIONS § 9) |
| `theme_color` | string (hex regex), default `'#141414'` | ✓ | Replaces hardcoded `<meta name="theme-color">` in SeoHead.svelte:60 (decision Q7) |
| `translations` | alias (M2O via translations junction) | – | i18n for `tagline` + `description` + `default_description` + `owner_job_title` |

#### `site_meta_translations` (per-locale fields)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | int PK | ✓ | Auto |
| `site_meta_id` | int FK → site_meta.id | ✓ | M2O |
| `languages_code` | string FK → languages.code | ✓ | en/fr/es |
| `tagline` | string, ≤100 | ✓ | Brand tagline. Currently `'Digital infrastructure that moves.'` (EN only — FR/ES populated later via Data Studio) |
| `description` | string, ≤300 | ✓ | Brand description (used by jsonLd Person.description). Currently `'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.'` |
| `default_description` | string, 50–200 | ✓ | SEO fallback `<meta name="description">` for routes where data-layer description is empty or outside the 50–200 SEO band (replaces hardcoded `FALLBACK_DESCRIPTION` in `apps/web/src/lib/content/meta.ts:67`) |
| `owner_job_title` | string, ≤80 | ✓ | Person.jobTitle. Currently `'Digital Infrastructure Consultant'` (EN), `'Consultant en infrastructure numérique'` (FR), `'Consultor de infraestructura digital'` (ES) — only collection field with all three locales populated today |

### `route_seo` (per-route override collection)

| Field | Type | Notes |
|---|---|---|
| `id` | int PK | Auto (decision Q3) |
| `path` | string, unique, required | SvelteKit route id pattern, e.g., `/`, `/about`, `/services`, `/blog`, `/tech-stack`, `/blog/personal`. Static routes only (decision Q4) |
| `og_image` | M2O directus_files, optional | Per-route OG override; falls back to `site_meta.default_og_image` if null |
| `status` | enum `draft`/`published`/`archived` | Standard 18c global-draft pattern |
| `sort` | int, default 0 | Manual ordering (Data Studio list view) |
| `translations` | alias | i18n for `title` + `description` |

### `route_seo_translations`

| Field | Type | Notes |
|---|---|---|
| `id` | int PK | Auto |
| `route_seo_id` | int FK → route_seo.id | M2O |
| `languages_code` | string FK → languages.code | en/fr/es |
| `title` | string, ≤70 chars, optional | Per-route title body (composed as `'{title} | {site_meta.name}'` if non-empty); empty → fall back to a route-specific code-side default. **Page title body only — site-name suffix is auto-appended in adapter.** |
| `description` | string, 50–200 chars, optional | Per-route description override; empty → fall back to `siteSeoDefaults.defaultDescription` |

## Migration mapping

### `site_meta` singleton seed (brand fields → parent + i18n; SEO defaults → parent)

| Source | → | Destination |
|---|---|---|
| `apps/web/src/lib/content/meta.ts § siteMeta.name` (`'yesid.'`) | → | parent `name` |
| `siteMeta.tagline.en` (`'Digital infrastructure that moves.'`) | → | translation `tagline` (en) |
| `siteMeta.description.en` | → | translation `description` (en) |
| `siteMeta.links.email` | → | parent `email` |
| `siteMeta.links.github` | → | parent `github_url` |
| `siteMeta.links.linkedin` | → | parent `linkedin_url` |
| `siteMeta.links.upwork` | → | parent `upwork_url` |
| `siteMeta.owner.name` (`'Yesid O.'`) | → | parent `owner_name` |
| `siteMeta.owner.jobTitle.{en,fr,es}` | → | translation `owner_job_title` (all 3 locales) |
| `siteMeta.owner.address.{locality,region,country}` | → | parent `owner_locality`, `owner_region`, `owner_country` |
| `siteMeta.owner.knowsAbout` (string[]) | → | parent `owner_knows_about` (CSV) |
| `apps/web/src/lib/content/meta.ts § FALLBACK_DESCRIPTION.en` | → | translation `default_description` (en) |
| `apps/web/src/lib/utils/seo-defaults.ts § defaultOgImageFor` | → | parent `default_og_image` (M2O UUID — Phase 1 P2 probe identifies existing UUID; null fallback if missing) |
| `apps/web/src/lib/components/seo/SeoHead.svelte:60` hardcoded `'#141414'` | → | parent `theme_color` |

### `route_seo` collection seed (8 static routes)

| Source | → | Destination |
|---|---|---|
| `routeSeoEntries['/'].title.en` | → | `route_seo` row `path: '/'` + translation `title` (page-body only — `' \| yesid.'` suffix stripped → `'Digital Infrastructure that Moves.'`) |
| `routeSeoEntries['/'].description.en` | → | translation `description` |
| `routeSeoEntries['/'].canonical` | → | DROPPED (computed in adapter as `SITE_HOST + path`) |
| `routeSeoEntries['/'].ogType` | → | DROPPED (code-side `route-seo-defaults.ts` constant) |
| `routeSeoEntries['/'].noIndex` | → | DROPPED (code-side `route-seo-defaults.ts` constant) |
| `routeSeoEntries['/'].jsonLd` | → | DROPPED (code-side `route-seo-defaults.ts` factory) |
| `routeSeoEntries['/about'..'/tech-stack']` | → | analogous rows (8 total: `/`, `/about`, `/contact`, `/services`, `/projects`, `/blog`, `/blog/personal`, `/tech-stack`) |
| `routeSeoEntries['/services/[id]']` factory | → | EXTRACTED to `apps/web/src/lib/adapters/route-seo-factories.ts § servicesIdSeoFactory`; refactored to use `siteMeta` + `siteSeoDefaults` defaults |
| `routeSeoEntries['/projects/[slug]']` factory | → | EXTRACTED to `route-seo-factories.ts § projectsSlugSeoFactory` |
| `routeSeoEntries['/blog/[slug]']` factory | → | EXTRACTED to `route-seo-factories.ts § blogSlugSeoFactory` |
| `routeSeoEntries['/__error']` static entry | → | EXTRACTED to `route-seo-factories.ts § errorSeoFallback` (always last-resort fallback; `noIndex: true`) |

All 8 route_seo rows seeded with `status: 'published'`, `lang: en` translation row only. FR/ES added later via Data Studio.

## Consumer wiring

### Adapter port refactor

In `apps/web/src/lib/adapters/directus.ts § meta` (Q9 amendment 2026-04-27 — two methods sharing one fetch):

```ts
// Per-request WeakMap memo on the RAW singleton row.
// Both meta.site() and meta.siteSeoDefaults() call fetchSingletonRow() —
// shared cache means one CMS round-trip per request, two output shapes.
const siteRowMemo = new WeakMap<object, DirectusSiteMetaRow>();
const defaultCtx = {};

async function fetchSingletonRow(ctx?: PreviewContext): Promise<DirectusSiteMetaRow> {
  const memoKey = (ctx as object | undefined) ?? defaultCtx;
  const cached = siteRowMemo.get(memoKey);
  if (cached) return cached;
  const fetch = queuedFetch(ctx);
  const row = (await fetch(readSingleton('site_meta', { fields: SITE_META_FIELDS as unknown as string[] }))) as unknown as DirectusSiteMetaRow;
  siteRowMemo.set(memoKey, row);
  return row;
}

meta: {
  // Brand SiteMeta — TS shape unchanged from today (Q9).
  site: async (ctx) => {
    const row = await fetchSingletonRow(ctx);
    return parsePort('meta.site', SiteMetaSchema, toSiteMeta(row));
  },

  // NEW (Q9): SEO defaults from same singleton.
  siteSeoDefaults: async (ctx) => {
    const row = await fetchSingletonRow(ctx);
    return parsePort('meta.siteSeoDefaults', SiteSeoDefaultsSchema, toSiteSeoDefaults(row));
  },

  // NEW: per-route override lookup.
  routeSeo: {
    byPath: async (path, ctx) => {
      const fetch = queuedFetch(ctx);
      const rows = (await fetch(readItems('route_seo', {
        filter: { _and: [{ path: { _eq: path } }, { status: { _eq: 'published' } }] },
        fields: ROUTE_SEO_FIELDS as unknown as string[],
        limit: 1,
      }))) as unknown as DirectusRouteSeoRow[];
      const item = rows[0] ? toRouteSeoOverride(rows[0]) : undefined;
      return parsePort('meta.routeSeo.byPath', RouteSeoOverrideSchema.optional(), item);
    },
  },

  // Composer: fetches site + siteSeoDefaults + routeSeo, merges with code-side defaults.
  forRoute: async (routeId, locale, params, ctx) => {
    // Dynamic factory dispatch (factories pull both shapes for jsonLd + fallback copy)
    const dynamicFactory = routeSeoFactories[routeId];
    if (dynamicFactory) {
      const [siteMeta, siteSeoDefaults] = await Promise.all([
        adapter.meta.site(ctx),
        adapter.meta.siteSeoDefaults(ctx),
      ]);
      return dynamicFactory({ params: params!, locale, ctx, adapter, siteMeta, siteSeoDefaults });
    }

    // Static-route compose
    const codeDefaults = codeRouteSeoDefaults[routeId];
    if (!codeDefaults) throw new Error(`[meta.forRoute] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts or seed a route_seo row.`);

    const [siteMeta, siteSeoDefaults, routeOverride] = await Promise.all([
      adapter.meta.site(ctx),
      adapter.meta.siteSeoDefaults(ctx),
      adapter.meta.routeSeo.byPath(routeId, ctx),
    ]);
    return composePageSeo({ routeId, locale, siteMeta, siteSeoDefaults, routeOverride, codeDefaults });
  },
},
```

`composePageSeo` builds:

| PageSeo field | Source |
|---|---|
| `title` | `routeOverride.title \|\| codeDefaults.fallbackTitle`; if `codeDefaults.composedTitleStrategy === 'verbatim'` use as-is, else append ` \| ${siteMeta.name}`. (P3 finding 2026-04-27 — preserves home `/` em-dash brand-first format; all other routes get uniform pipe-brand suffix.) |
| `description` | `routeOverride.description || siteSeoDefaults.defaultDescription` |
| `canonical` | `SITE_HOST + routeId` (computed) |
| `ogImage.url` | `routeOverride.ogImage ? asset(routeOverride.ogImage, 'og-1200') : siteSeoDefaults.defaultOgImage ? asset(siteSeoDefaults.defaultOgImage, 'og-1200') : SITE_HOST + '/og/default.png'` |
| `ogImage.alt` | code-side constant per route (e.g., `'yesid. — Digital Infrastructure'`); falls back to `siteMeta.name` |
| `ogImage.width` / `height` | hardcoded 1200 / 630 (matches `og-1200` preset) |
| `ogType` | `codeDefaults.ogType` (per-route constant) |
| `noIndex` | `codeDefaults.noIndex` (per-route constant) |
| `jsonLd` | `codeDefaults.jsonLdFactory(siteMeta, locale)` — typed factory consuming **brand** SiteMeta only (Person.address, links, etc.). Does NOT need siteSeoDefaults — those are SEO-only concerns, not jsonLd shape. |

### Type system

```ts
// apps/web/src/lib/types  — UNCHANGED
export interface SiteMeta {
  name: string;
  tagline: LocalizedString;
  description: LocalizedString;
  links: SiteLinks;
  owner: SiteOwner;
}

// packages/shared/src/types/content.ts  — NEW (Q9)
export interface SiteSeoDefaults {
  defaultOgImage: string | null;        // UUID or null
  themeColor: string;                    // hex color, e.g. '#141414'
  defaultDescription: LocalizedString;   // SEO fallback meta description
}

export interface RouteSeoOverride {
  path: string;
  ogImage: string | null;
  title: LocalizedString | null;
  description: LocalizedString | null;
}

// apps/web/src/lib/schemas/site-seo-defaults.ts  — NEW (Q9)
export const SiteSeoDefaultsSchema = z.object({
  defaultOgImage: z.string().uuid().nullable(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  defaultDescription: LocalizedStringSchema,
});

// apps/web/src/lib/schemas/route-seo.ts  — NEW
export const RouteSeoOverrideSchema = z.object({
  path: z.string().regex(/^\//),
  ogImage: z.string().uuid().nullable(),
  title: LocalizedStringSchema.nullable(),
  description: LocalizedStringSchema.nullable(),
});
```

`SiteMetaSchema` in `apps/web/src/lib/schemas/meta.ts` UNCHANGED. Existing drift detector unchanged.

### `<SeoHead>` consumer

Add one prop pass-through for `themeColor`:

```svelte
<!-- before -->
<meta name="theme-color" content="#141414" />

<!-- after -->
let { seo, locale, themeColor = '#141414', dev = runtimeDev } = $props();
<meta name="theme-color" content={themeColor} />
```

`themeColor` arrives via `data.themeColor` from `+layout.ts`.

### `+layout.ts`

Currently calls `getPageSeo(routeId, locale, params)` once per navigation. Update to also fetch SEO defaults for `themeColor`:

```ts
const [seo, siteSeoDefaults] = await Promise.all([
  getPageSeo(routeId, locale, params),
  getSiteSeoDefaults(),  // new repository wrapper around adapter.meta.siteSeoDefaults()
]);
return { seo, themeColor: siteSeoDefaults.themeColor };
```

Both calls share the per-request `fetchSingletonRow()` WeakMap memo — one CMS round-trip per navigation, not two. (`getPageSeo` internally also calls `meta.site()` + `meta.siteSeoDefaults()` for the composer; same memo serves all.)

### `+layout.svelte`

```svelte
<SeoHead seo={data.seo} locale={DEFAULT_LOCALE} themeColor={data.themeColor} />
```

## Acceptance gates

1. Schema live: `site_meta` (singleton) + `site_meta_translations` + `route_seo` + `route_seo_translations` collections in Directus; `bun run sync:diff` clean
2. Singleton seeded: 1 row in `site_meta` with all 13 parent fields populated; 1 EN translation row + (if available) FR/ES `owner_job_title` populated
3. Per-route seeded: 8 rows in `route_seo` (paths listed above) with EN translations populated; status `published`
4. Permissions: ai-editor + human-editor + Public matrix correct (mirror blog_posts shape from 18f for `route_seo`; singleton variant — no create/delete — for `site_meta`)
5. Adapter: `meta.site()` (brand) + `meta.siteSeoDefaults()` (SEO defaults) both return parseable shapes from CMS via Public read; both share singleton fetch via WeakMap memo (verifiable via single Network tab call per route navigation); `meta.routeSeo.byPath('/about')` works; composed `meta.forRoute('/about', 'en')` works with parsePort guards in place
6. Consumer: `<SeoHead>` renders identical `<head>` for all 8 static routes (visual diff vs. pre-flip = 0); 4 dynamic routes (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`, `/__error`) unchanged
7. Tests: `apps/cms` `bun test` green; `apps/web` `bun run check` 0 errors; `apps/web` `bun run test` no regressions; new mocked-fetch contract test for `meta.site` + `meta.siteSeoDefaults` + `meta.routeSeo.byPath`
8. `theme-color` meta tag now sourced from `siteSeoDefaults.themeColor` (no behavioral change yet — value still `'#141414'`)
9. `apps/web/src/lib/content/meta.ts` shrunk: brand `siteMeta` const moved to `site-meta.ts`; STATIC `routeSeoEntries` entries deleted; `FALLBACK_DESCRIPTION` deleted; DYNAMIC factories moved to `apps/web/src/lib/adapters/route-seo-factories.ts`
10. Type system: `SiteMeta` TS interface UNCHANGED; `SiteMetaSchema` Zod UNCHANGED; new `SiteSeoDefaults` + `RouteSeoOverride` TS + Zod added; new drift detector for `SiteSeoDefaults` mirrors the existing `SiteMeta` pattern
11. Footer + About page (consumers of `getSiteMeta()`) render unchanged — visual diff = 0
12. jsonLd factories (Person / WebSite / ProfilePage / etc.) emit identical structured data to pre-flip
13. GH issues filed per `decisions.md § Open follow-ups`

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Singleton seed pattern is novel — `--reset` flag must NOT delete the row, only upsert payload | Phase 1 P4 probe documents the upsert pattern explicitly (likely `updateSingleton('site_meta', payload)` from `@directus/sdk`); seed script tested against fresh-DB + existing-row cases via dry-run unit test |
| `og-1200x630` preset name in user prompt may not exist; CONVENTIONS § 9 names it `og-1200` | Phase 1 P1 probe verifies preset registry; use existing preset name (`og-1200`) per CONVENTIONS § 9 |
| OG image UUID for `default_og_image` requires asset already uploaded in 18d to a known folder (`og/`) | Phase 1 P2 probe checks `apps/cms/fixtures/assets-id-map.json` for an `og-default` entry; if missing, seed `default_og_image: null` + GH issue for designer-supplied 1200×630 brand asset |
| `meta.forRoute()` becomes a composer — risk of behavior drift across the 8 static routes | Phase 4 contract test asserts `composePageSeo` output equals the existing `routeSeoEntries` static entries for each of 8 paths (visual + structural diff via deep equal on rendered `<head>` shape) |
| `directus-sync` permissions dedup quirk (per 18g AM4: `(collection, action, policy)` is unique key — `permissions` filter ignored for dedup) | Use `_or` extension on existing `directus_comments` rows to add `site_meta` + `route_seo` to the filter set; do NOT add new comments rows for these collections |
| Two-method API + shared singleton fetch — risk that a consumer accidentally fetches twice (skipping the memo) | `fetchSingletonRow()` is the ONLY entry point — `meta.site()` + `meta.siteSeoDefaults()` both delegate to it; no other code path reads the singleton; mocked-fetch contract test asserts only one `readSingleton('site_meta')` call per `meta.forRoute()` invocation |
| `meta.site()` flips from synchronous-shape (static const wrapped in async) to actual-async (CMS round-trip + parsePort) — fail-fast on network error could break SSR for ALL pages | Wrap with retry via existing `queuedFetch()`; per-request WeakMap memo means failure is bounded to the in-flight request, not cached forever; SvelteKit `+layout.ts` already has try/catch fallback to `/__error` SEO entry |
| Brand `siteMeta` const extraction risks breaking jsonLd factories or static.ts adapter | Single-PR migration: same commit creates `apps/web/src/lib/content/site-meta.ts` (new), shrinks `apps/web/src/lib/content/meta.ts`, updates static.ts adapter import, implements directus.meta.site() flip. Existing `SiteMeta` drift detector + contract test catch shape mismatches. |
| `apps/web` test runner is **vitest** (`bun run test`) not `bun test` (per memory note) — mixing them up looks catastrophic | Plan.md commands explicitly say `bun run test` for apps/web; `bun test` for apps/cms |

## Effort

~0.75 session (bumped from 0.5 by Q2 expansion).

Reused without re-derivation:
- Singleton-style operations via Directus SDK (`readSingleton` / `updateSingleton` — standard pattern documented; first use in this repo)
- M2O asset wiring (18d/18e/18f/18g)
- Translations junction (18c/18e/18f/18g)
- ai-editor + human-editor + Public permissions (18e/18f/18g — mirror blog_posts shape)
- Seed-script template (CONVENTIONS § 4 + 18e/18f/18g lib helpers)
- Adapter port template (CONVENTIONS § 6 — typed row + pure mapper + parsePort + queuedFetch)
- Live ops auth flow (PowerShell + 1Password from 18a-g)
- Per-request WeakMap memo for adapter caching (18c F2)
- Drift detector pattern in `apps/web/src/lib/schemas/meta.ts` (already in place — pattern reused for new SiteSeoDefaults schema)

New shape introduced (small):
- `meta.singleton: true` collection (first in this repo via directus-sync)
- Singleton upsert seed pattern (`updateSingleton` SDK call)
- **Two-port-from-one-row pattern (Q9)**: `meta.site()` + `meta.siteSeoDefaults()` share `fetchSingletonRow()` + WeakMap memo on raw row; map to different output shapes
- `meta.forRoute()` composer (vs. flat lookup)
- `apps/web/src/lib/adapters/route-seo-defaults.ts` for code-side per-route ogType/noIndex/jsonLd factories (new file)
- `apps/web/src/lib/adapters/route-seo-factories.ts` for extracted dynamic-route factories (new file)
- `apps/web/src/lib/content/site-meta.ts` for static-adapter test fixture (new file)
- `meta.site()` flip from static const to CMS-backed (Q2 amendment cascade)
