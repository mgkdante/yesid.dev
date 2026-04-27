# 18h — Decisions

> **Status legend:** `proposed` = recommendation pending user lock-in; `locked` = confirmed; `amended` = changed mid-slice from original recommendation.

## Decisions table

| ID | Decision | Recommendation | Status | Source |
|---|---|---|---|---|
| Q1 | **Scope split: which `PageSeo` fields go to CMS vs. stay in code?** Existing PageSeo has 7 fields: `title`, `description`, `canonical`, `ogImage`, `ogType`, `noIndex`, `jsonLd`. | CMS owns `title` (page body only) + `description` + `og_image` (and site-wide defaults for those + `theme_color`). Code retains `canonical` (computed from path + SITE_HOST), `ogType` (per-route enum constant), `noIndex` (per-route boolean constant), `jsonLd` (factories from `$lib/adapters/jsonld.ts`). `meta.forRoute()` becomes a composer. | **locked** | User 2026-04-27 |
| Q2 | **Brand `siteMeta` const (name, tagline, description, links, owner) — migrate in 18h or defer?** This const is used by jsonLd factories + Footer + About page. | **AMENDED — MIGRATE in 18h.** The brand identity moves into the same `site_meta` singleton as the SEO defaults. Single source of site identity. `meta.site()` flips from static const to CMS-backed in Phase 4. **Schema impact:** 13 parent fields + 7 translation fields (vs. earlier 3 + 2). **Cleanup impact:** brand const extracted to `apps/web/src/lib/content/site-meta.ts` (static-adapter test fallback only); deleted from `apps/web/src/lib/content/meta.ts`; `FALLBACK_DESCRIPTION` const deleted (replaced by `site_meta.default_description`). | **locked** (amended from proposed defer) | User 2026-04-27 |
| Q3 | **`route_seo` PK shape: kebab-slug PK vs. auto int + unique `path` field?** | **auto int PK + unique `path` field** (`/services`, `/about`, etc.). Simpler consumer (`byPath(currentPath)`); avoids slug ↔ path mapping logic. | **locked** | User 2026-04-27 |
| Q4 | **Dynamic routes (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`) — author per-item SEO in `route_seo` or via collection adapters?** | Dynamic routes pull from existing collection adapters: `projects.image`, `blog_posts.cover_image` already serve as per-item OG images. Code factories stay in `apps/web/src/lib/adapters/route-seo-factories.ts` (extracted from `meta.ts`). `route_seo` is for STATIC routes only. | **locked** (default — user didn't push back) | Auto-locked 2026-04-27 |
| Q5 | **Drop `og_title` + `og_description` override fields from `route_seo_translations`?** User's original prompt listed both. `<SeoHead>` currently derives `og:title` from `title` and `og:description` from `description` (single source of truth). | DROP. Adding override fields requires SeoHead refactor too; YAGNI — no current case where OG copy diverges from page copy. File a GH follow-up to add later if a campaign-specific case emerges. | **locked** | User 2026-04-27 |
| Q6 | **Drop `twitter_handle` field from `site_meta`?** User's original prompt listed it. No Twitter account exists today; SeoHead doesn't currently emit `twitter:site` / `twitter:creator`. | DROP. Defer to whenever a Twitter account materializes. File a GH follow-up. | **locked** | User 2026-04-27 |
| Q7 | **Keep `theme_color` field on `site_meta`?** Today SeoHead hardcodes `#141414` at line 60. | **locked** — KEEP, default `'#141414'`. Low cost; site-wide; allows future light-mode toggle without touching consumer code. SeoHead change is one-line prop pass-through. | **locked** (default) | Auto-locked unless user pushes back |
| Q8 | **i18n on both collections per CONVENTIONS § 8?** | **locked** — KEEP i18n junction pattern. Schema correctness independent of FR/ES population timing; matches 18c/18e/18f/18g shape. EN-only seed at 18h close; FR/ES added via Data Studio when copy is signed off. | **locked** (default) | Auto-locked unless user pushes back |
| Q9 | **`meta.site()` and `meta.siteSeoDefaults()` — one method or two?** | **AMENDED — TWO METHODS.** `meta.site()` returns brand `SiteMeta` (TS shape unchanged from today — backed by CMS singleton per Q2). `meta.siteSeoDefaults()` is a new method returning the `SiteSeoDefaults` shape (`defaultOgImage`, `themeColor`, `defaultDescription`). Both backed by the same singleton row internally — shared via `fetchSingletonRow()` helper + per-request WeakMap memo (one CMS round-trip per request). Clean port-level separation between brand-identity consumers (jsonLd / Footer / About) and SEO consumers (SeoHead / composer). | **locked** (amended from auto-resolved) | User 2026-04-27 |

## Side decisions folded into design (no separate Q)

| Decision | Rationale |
|---|---|
| First Directus singleton in this repo lands here (`site_meta`) — pattern reference for future singletons | `meta.singleton: true` is standard Directus, well-documented. Singleton SEED pattern (upsert vs. delete-then-create) is the only novelty — captured in plan.md Phase 3. |
| Use existing `hero-og` preset for OG images (1200×630 JPG q=85) — NOT a new `og-1200x630` preset | Per CONVENTIONS § 9 — `hero-og` already matches OG spec. User's prompt named the preset speculatively; existing one suffices. |
| OG image UUID seeded in `site_meta.default_og_image` references an asset already uploaded by 18d (`og/` folder) | Phase 1 P2 probe surfaces existing UUID in `assets-id-map.json`. If missing, seed `default_og_image: null` and accept code-side fallback (`SITE_HOST + '/og/default.png'`); file GH issue for designer-supplied 1200×630 brand asset. |
| Permissions matrix mirrors `blog_posts` shape from 18f (ai-editor + human-editor + Public) for `route_seo` | Same access model: ai-editor read+create+update with publish-block validation, human-editor full, Public read where status=published |
| Singleton permissions variant for `site_meta`: ai-editor read+update only (no create — singleton already exists, no delete); human-editor read+update only; Public read unconditional (no status filter — singleton always exposed) | Singleton row.id is fixed; create/delete are nonsensical |
| `route_seo` translations field schema: `title` and `description` are OPTIONAL (nullable in DB) — empty means "fall back to default" | Lets editors quickly override one field without filling all three. Composer sees null → uses fallback chain. |
| Code-side per-route constant table lives at `apps/web/src/lib/adapters/route-seo-defaults.ts` (new file) — holds `ogType`, `noIndex`, `jsonLdFactory` per SvelteKit route id | Code-side authoritative for technical fields; CMS-side authoritative for editorial copy. Single file, easy to audit. |
| Dynamic-route SEO factories extracted from `apps/web/src/lib/content/meta.ts` to `apps/web/src/lib/adapters/route-seo-factories.ts` (new file) | Both directus + static adapters consume them. Keeps `apps/web/src/lib/content/meta.ts` cleanup scope clean. |
| Brand `siteMeta` const **deleted** from `apps/web/src/lib/content/meta.ts`; **extracted** to `apps/web/src/lib/content/site-meta.ts` (test-fallback file for static adapter) | Per Q2 amendment — CMS owns runtime data. Static const survives ONLY as a test fixture / static-adapter-mode fallback (used in `apps/web/src/tests/setup.data.ts` mocks). 18k cleanup decides if static adapter retires entirely. |
| `FALLBACK_DESCRIPTION` const **deleted** from `apps/web/src/lib/content/meta.ts` | Replaced by `site_meta.default_description` from CMS (exposed via `meta.siteSeoDefaults().defaultDescription`). Dynamic factories receive `siteSeoDefaults` alongside `siteMeta` in their factory args. |
| `apps/web/src/lib/types § SiteMeta` TS interface **stays unchanged** (Q9 amendment — two-method API keeps brand vs. SEO defaults separate at type level). New `SiteSeoDefaults` TS interface added in `packages/shared/src/types/content.ts` (`defaultOgImage`, `themeColor`, `defaultDescription`). Existing `SiteMetaSchema` Zod stays untouched; new `SiteSeoDefaultsSchema` Zod added in `apps/web/src/lib/schemas/site-seo-defaults.ts`. | Two clean ports for two concerns. SiteMeta drift detector unchanged. |
| `meta.forRoute()` Phase 4 contract test asserts composer output equals existing `routeSeoEntries` static entries for all 8 paths (structural diff) | Captures the migration as a property test — if composer drifts, test catches it before merge |
| Test runner reminder: apps/web uses **`bun run test`** (vitest), apps/cms uses **`bun test`** (Bun native) | Mixing them up makes failures look catastrophic when they're tool-mismatch. Plan commands are explicit. |

## Open follow-ups (filed as GitHub issues at close)

- **`apps/web/src/lib/content/site-meta.ts` (extracted brand const) cleanup → 18k** — file is test/static-fallback only; can be deleted when static adapter fully retires. Deferred behind 18k's static-modules-deletion sweep.
- **`og_title` + `og_description` per-route overrides** — defer until a real case exists (campaign landing page, A/B SEO test). (Per locked Q5.)
- **`twitter_handle` site-wide** — defer to whenever a Twitter / X account is created. Then add field + emit `twitter:site` + `twitter:creator` in SeoHead. (Per locked Q6.)
- **Light-mode toggle leveraging `site_meta.theme_color`** — currently fixed `#141414`. If light-mode lands, theme_color becomes a per-mode pair or moves to a `themes` collection. (Per Q7 — already infrastructure-ready.)
- **Brand asset `og-default.jpg` upload** (if probe finds no existing `og-default` in 18d's `assets-id-map.json`) — needs designer-supplied 1200×630 social preview image. Until then, `default_og_image: null` + code-side `SITE_HOST + '/og/default.png'` fallback.
- **Sitemap CMS-driven** — defer indefinitely; build-time route walking from 15a is sufficient.
- **Robots.txt CMS-driven** — defer indefinitely; static is sufficient.

## Close

| Item | Value |
|---|---|
| PR | TBD |
| Branch | `feature/slice-18-18h` |
| Worktree | `C:/Users/otalo/Yesito/Projects/yesid.dev-18h` |
| Closed date | TBD |
| Merge SHA | TBD |
| Commits | TBD |
| GH follow-ups | TBD (per Open follow-ups above) |
