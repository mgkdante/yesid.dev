# 18h — Research

> 18h reuses 18a–g primitives. P1–P5 probes resolved 2026-04-27. **Two findings invalidate plan assumptions** (preset name + home title format) — addressed below.

## Inherited patterns from 18a–g (no re-research needed)

- **Translations junction shape** = parent + `<collection>_translations` with `<collection>_id` FK + `languages_code` FK + per-locale fields. Locked across 18c (services) / 18e (projects) / 18f (blog_posts) / 18g (tech_stack).
- **M2O asset wiring** = `<column>` is `directus_files.id` UUID; consumer uses `asset(uuid, preset)` from `apps/web/src/lib/directus/assets.ts` (18c Task 47).
- **ai-editor permissions row shape** = `(collection, action, policy=_sync_ai_editor_policy, permissions filter, validation filter)` with publish-block via `_neq: 'published'` on update. Mirror blog_posts shape (18f).
- **Singleton-permissions variant** — first use in this repo. Pattern: ai-editor R+U only, human-editor R+U only, Public R unconditional.
- **directus-sync permissions dedup quirk (18g AM4)** — `(collection, action, policy)` is the unique key; `permissions` filter is IGNORED for dedup. Don't add multiple rows for the same triple — merge filters with `_or`.
- **Adapter port template (CONVENTIONS § 6)** — typed row + pure `to<Collection>(row)` + `parsePort('<port>.<method>', Schema, data)` + optional `ctx?: PreviewContext` + queuedFetch wrapper.
- **Seed-script shape (CONVENTIONS § 4)** — Zod fixture schema + pure helpers + `--dry-run` + `--reset` flags + `lib/*` imports + `import.meta.main` guard.
- **Per-request WeakMap memo (18c F2)** — applied to `fetchSingletonRow()` per Q9.
- **PowerShell auth setup for live ops** — `OP_SERVICE_ACCOUNT_TOKEN` + 1Password CLI for admin password.
- **Test runner split** — apps/web vitest via `bun run test`; apps/cms Bun native via `bun test`.

## P1 — Storage transform preset name (RESOLVED 2026-04-27)

**Question:** does CONVENTIONS § 9's named `hero-og` preset actually exist? Or is the user-prompt's `og-1200x630` correct? Or something else?

**Findings:**

Storage transform presets live in `apps/cms/fixtures/brand/presets.json` (NOT in directus-sync — they're seeded via `apps/cms/scripts/seed-presets.ts` into `directus_settings.storage_asset_presets`). 18d shipped 4 presets:

| key | fit | dims | format | quality |
|---|---|---|---|---|
| `hero-1200` | contain | 1200w | webp | 85 |
| `card-600` | contain | 600w | webp | 80 |
| `thumb-240` | cover | 240×240 | webp | 75 |
| **`og-1200`** | cover | 1200×630 | jpg | 85 |

**Actual OG preset key: `og-1200`.** CONVENTIONS § 9 is **stale** (says `hero-og`); user prompt was speculative (`og-1200x630`). File a doc fix at 18h close to update CONVENTIONS § 9.

**Plan/spec corrections needed:** all references to `hero-og` in `spec.md` + `plan.md` must change to `og-1200`. Patched in this same Phase 1 commit.

Live verify confirms preset routing works:

```bash
$ curl -I 'https://cms.yesid.dev/assets/74b62762-8d8d-4301-8635-f236bc23f739?key=card-600'
HTTP/1.1 200 OK
Content-Type: application/octet-stream
```

`STORAGE_ASSET_TRANSFORM=presets` is locked (per `apps/cms/.env.example`); ad-hoc `?width=` would 403. Use the named preset.

## P2 — `og-default` UUID in `assets-id-map.json` (RESOLVED 2026-04-27)

**Question:** does an OG default image (1200×630 social preview) UUID exist in `apps/cms/fixtures/assets-id-map.json` for seeding `site_meta.default_og_image`?

**Findings:**

`apps/cms/fixtures/assets-id-map.json` has 14 entries — all `images/about/*`, `images/montreal-metro.svg`, `images/work/yesid-dev.png`. **NO `og`-prefixed entry.** No 1200×630 brand OG image uploaded.

The web app today serves a static fallback at `apps/web/static/og/default.en.png` (per-locale convention — `defaultOgImageFor(locale)` in `apps/web/src/lib/utils/seo-defaults.ts:43`):

```ts
// apps/web/src/lib/utils/seo-defaults.ts
export const DEFAULT_OG_IMAGE = '/og/default.en.png';
export function defaultOgImageFor(locale: Locale): string {
  if (PUBLISHED_LOCALES.includes(locale)) return `/og/default.${locale}.png`;
  return DEFAULT_OG_IMAGE;
}
```

**Decision (locked at Phase 1 fixture authoring):**

- Seed `site_meta.default_og_image: null` in fixture
- Code-side composer falls back to `SITE_HOST + '/og/default.en.png'` when the M2O is null (preserves current behavior; per-locale fallback handled in code)
- File GH issue at 18h close: **"Upload designer-supplied 1200×630 brand OG image to Directus `og/` folder + update `site_meta.default_og_image`"** — once a brand asset exists, swap in the UUID and code-side fallback can retire

This means `og-1200` preset isn't actually exercised in 18h (no UUID routes through it yet). The wiring is ready for the day a UUID exists.

## P3 — Title-body extraction from existing `routeSeoEntries` (RESOLVED 2026-04-27)

**Question:** for each of 8 static routes, what is the page-title body **without** the ` | yesid.` suffix? Composer auto-appends; double-suffix would be a bug.

**Findings:**

| path | current title.en | extracted body | format |
|---|---|---|---|
| `/` | `yesid. — Digital Infrastructure that Moves.` | `Digital Infrastructure that Moves.` | **em-dash** (brand-first) |
| `/about` | `About Yesid \| yesid.` | `About Yesid` | pipe |
| `/contact` | `Contact \| yesid.` | `Contact` | pipe |
| `/services` | `Services \| yesid.` | `Services` | pipe |
| `/projects` | `Projects \| yesid.` | `Projects` | pipe |
| `/blog` | `Blog \| yesid.` | `Blog` | pipe |
| `/blog/personal` | `Personal Blog \| yesid.` | `Personal Blog` | pipe |
| `/tech-stack` | `Tech Stack \| yesid.` | `Tech Stack` | pipe |

### **🚨 Visual diff finding — home title format**

7 of 8 routes use the pipe pattern `'<page> | yesid.'`. **Home is special:** `'yesid. — <tagline>'` (em-dash, brand-first). The composer in spec.md auto-appends ` | {name}`, which means home becomes `'Digital Infrastructure that Moves. | yesid.'` — **a visual diff vs. pre-flip**.

Three options for owner:

| Option | Composer behavior | Home title becomes | Diff |
|---|---|---|---|
| **A. Accept unification** (recommended for editor ergonomics) | Always appends ` \| {name}` | `Digital Infrastructure that Moves. \| yesid.` | minor (home format changes) |
| **B. Per-route strategy flag** | `codeRouteSeoDefaults['/'].composedTitleStrategy: 'verbatim'` skips append | `yesid. — Digital Infrastructure that Moves.` (preserved) | **zero** |
| **C. Verbatim across the board** | Composer never appends; editors author full titles incl. suffix | preserved everywhere | zero, but editor ergonomic risk (forgetting suffix) |

**Surface to owner at Phase 1 review pause.** My recommendation: **B** — minimal surface change, preserves home aesthetic, single-line code addition. Fixture authoring proceeds with home title body = `'yesid. — Digital Infrastructure that Moves.'` (full em-dash format) + the `composedTitleStrategy: 'verbatim'` flag in `route-seo-defaults.ts`. If owner picks A or C, fixture amendments are trivial.

## P4 — Singleton SDK pattern (RESOLVED 2026-04-27)

**Question:** SDK call sequence for "singleton upsert" — set the row's payload without deleting the row?

**Findings:**

`@directus/sdk` exports both `readSingleton` and `updateSingleton` (verified in `apps/cms/node_modules/@directus/sdk/dist/index.d.ts`):

```ts
import { readSingleton, updateSingleton } from '@directus/sdk';

// Read
const row = await client.request(readSingleton('site_meta', { fields: [...] }));

// Upsert (creates if missing; overwrites payload otherwise)
await client.request(updateSingleton('site_meta', { name: 'yesid.', ...payload }));
```

No prior usage in `apps/cms/scripts/` — 18h is the first singleton in this repo. Closest precedent: `seed-presets.ts` uses `readSettings`/`updateSettings` (similar shape, different collection — `directus_settings`).

**Implications for `--reset` flag in `seed-site-meta.ts`:**

- Singleton has exactly one row by construction. `--reset` cannot mean "delete-then-create" (would orphan FKs from translations and break consumers mid-deploy).
- `--reset` semantics for `site_meta`: identical to no-flag run (always upsert via `updateSingleton`). The flag is accepted for CLI parity with collection seeds but is a no-op.

For `route_seo` (regular collection), `--reset` keeps standard semantics: delete all rows + recreate. Standard collection-seed pattern from `seed-services.ts`.

## P5 — `directus_comments` `_or` extension shape (RESOLVED 2026-04-27)

**Question:** the existing comments rows use `_or` with `_starts_with` filters — should 18h add `_eq` entries (precise) or `_starts_with` (catches collection + translations together)?

**Findings:**

Two existing rows in `apps/cms/directus/collections/permissions.json` (lines 62–111):

| `_syncId` | action | filter |
|---|---|---|
| `ae-comments-projects-create-0042-00000000029` | create | `_or: [{ _starts_with: 'projects' }, { _starts_with: 'tech_stack' }]` |
| `ae-comments-projects-read-0041-000000000028` | read | `_or: [{ _starts_with: 'projects' }, { _starts_with: 'tech_stack' }]` |

`_starts_with: 'projects'` covers `projects`, `projects_translations`, `projects_sections`, `projects_sections_translations`, `projects_impact_metrics`, `projects_impact_metrics_translations`, `projects_services` — 7 collections in one filter.

**Decision (Phase 2 schema authoring):** for 18h, extend each `_or` array with `_starts_with: 'site_meta'` + `_starts_with: 'route_seo'`. Two new entries per row (covers `site_meta`, `site_meta_translations`, `route_seo`, `route_seo_translations`).

Final shape per comments row:

```json
{
  "_or": [
    { "collection": { "_starts_with": "projects" } },
    { "collection": { "_starts_with": "tech_stack" } },
    { "collection": { "_starts_with": "site_meta" } },
    { "collection": { "_starts_with": "route_seo" } }
  ]
}
```

Per 18g AM4 dedup quirk: do NOT add new comment rows for site_meta/route_seo — extend the existing rows' `_or` arrays. The existing `_syncId` strings stay (they identify the `(collection, action, policy)` triple, not the filter shape).

## Open questions

1. **Home title format** (P3 finding) — owner picks A / B / C at Phase 1 review pause. Fixture defaults to **B** (verbatim home title with em-dash); composer gets a per-route strategy flag in `route-seo-defaults.ts`.

## Findings rolled into spec/plan amendments

| Finding | Where applied |
|---|---|
| Preset key `og-1200` (not `hero-og`) | spec.md § Consumer wiring + § Schema; plan.md Phase 4 Task 11 (composePageSeo) — patched in same Phase 1 commit |
| `default_og_image: null` (no UUID) + code-side fallback to `/og/default.en.png` | spec.md § Migration mapping + § Acceptance gates; fixture site-meta.json |
| Composer per-route strategy flag (`composedTitleStrategy: 'verbatim' \| 'append-brand'`) on `CodeRouteSeoDefaults` | spec.md § Consumer wiring code snippet; plan.md Phase 4 Task 11 — patched in same Phase 1 commit |
| Home fixture title body = `'yesid. — Digital Infrastructure that Moves.'` (full em-dash) instead of body-only | plan.md Phase 1 Task 3 fixture sample — superseded by actual fixture commit |
| Comments `_or` extension via 2 `_starts_with` entries (not 4 `_eq`) | plan.md Phase 2 Task 5 |
