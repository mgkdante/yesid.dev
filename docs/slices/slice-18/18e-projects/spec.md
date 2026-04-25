# Slice 18e — Projects · Design Spec

> **Brainstorming output, 2026-04-24.** First canonical content-type migration after foundations + asset pipeline. Establishes the reference pattern that 18f (blog), 18g (tech-stack), and 18h (meta) replay. Replaces the static `apps/web/src/lib/content/projects.ts` module with a Directus-backed pipeline (schema → fixture → seed → adapter port → hybrid flip), and drops `services.related_projects` CSV in favor of an M2M junction `projects_services`.
>
> **Inherits:** all 18c foundations (lib/* helpers · directus-sync · parsePort · queuedFetch · PreviewContext · WeakMap memo · `asset()` helper) + 18d asset pipeline (`assetIdFor()` from `@repo/shared` + folder-scoped Public read on `directus_files`).
>
> **Format:** the slice plan + task breakdown will be written in a follow-on planning pass; this doc is the design-locked input.

## 1 · Locked decisions (brainstorming)

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Rich-content interface for `description` + `sections.content` | **Plain textarea throughout 18e** (text columns on `*_translations`, ≤2000 / ≤5000 chars) | Current data is single-paragraph; mirrors services precedent; defers Block Editor adoption to a follow-on after 18f's `BlockRenderer.svelte` ships. CONVENTIONS.md § 7 aspiration of Block Editor for `sections.content` is acknowledged but deferred. |
| Q2 | `status` field semantics | **3-value `draft \| published \| archived`** | Matches CONVENTIONS § 2 item 5 exactly. archive_field=status; archive_value=archived; unarchive_value=draft. Public policy filter `status _eq "published"`. Static enum `'public' \| 'private' \| 'wip'` had zero `private` / `wip` data, so YAGNI on the extra states; if a private project ever surfaces, it lives as `draft` (editor-accessible, Public-excluded). |
| Q3 | M2M migration ordering | **Two directus-sync pushes, phased CSV drop** | Add junction → seed projects + junction → adapter switches services port to M2M reads → drop `services.related_projects` field. Mirrors 18d Task 3 (pre-zero) + Task 7 (column drop) pattern. Zero-downtime on `/services/[slug]`. |
| Q4 | `hero_image` M2O resolution strategy | **`assetIdFor()` at seed time** | Fixture stores legacy paths; `@repo/shared.assetIdFor()` resolves to UUID inside the pure transform helper before the Directus write. Fail-loud on map drift. |
| Q5 | Primary key strategy | **Slug as Directus `id`** (kebab-case PK; no separate slug field) | Mirrors services precedent. Junction references project by id (= slug). Adapter `bySlug` is a `byId` over the same column. Slug renames are rare and a coordinated content event. |
| Q6 | `impactMetric` (singular) + `impactMetrics` (plural) modeling | **Single O2M `projects_impact_metrics`** with own translations sub-junction; adapter computes `impactMetric = impactMetrics[0]` | Mirrors `services_deliverables` precedent (O2M + own translations junction). No data duplication. Editorial UX: editor reorders; first row is featured. |
| Q7 | `scaffold-port.ts` utility | **Skip; hand-write using services as reference** | Scaffold output covers ~5% of M2M-heavy projects schema. Defer scaffold extension to 18k once 18f/18g/18h teach the right shape. |

## 2 · Schema (7 collections + 1 services field drop)

### 2.1 `projects` (parent collection)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | Kebab-case slug, e.g., `yesid-dev`, `transit-data-pipeline`. Matches services PK pattern. |
| `status` | dropdown | `draft \| published \| archived`. Default `draft`. |
| `date_published` | datetime, nullable | Initial seed leaves NULL; editor populates over time. |
| `sort` | integer, hidden | Initial seed sets `0`; editor reorders via drag-and-drop. |
| `featured` | boolean | Default `false`. Drives home-page Proof Reel surfacing. |
| `hero_image` | M2O → `directus_files`, nullable | Only `yesid-dev` populates initially; the other 5 use gradient placeholder consumer-side. |
| `repo_url`, `live_url`, `readme_url` | string, nullable | Locale-universal URLs. |
| `location`, `environment`, `version` | string, nullable | Hero-edge metadata fields. |
| `stack` | JSON array of strings, default `[]` | Mirrors `services.stack`. |
| `tags` | JSON array of strings, default `[]` | |
| `translations` | alias → `projects_translations` | Standard Translations interface. |

**Collection meta** (CONVENTIONS § 2 — 18-item checklist):
- `display_template`: `{{translations.title}}` (with EN fallback)
- `icon`: e.g., `folder_special`
- `note`: human + AI-editor onboarding line (MCP `schema` tool reads this)
- `sort_field`: `sort`
- `archive_field`: `status` · `archive_value`: `archived` · `unarchive_value`: `draft`
- `item_duplication_fields`: explicit list excluding `status`, `date_published`, `date_created`, `date_updated`, `user_created`, `user_updated`
- `preview_url`: post-18 placeholder template (e.g., `https://yesid.dev/projects/{{id}}?share={{$CURRENT_SHARE.token}}`)
- `versioning`: `true` · `accountability`: `"all"`
- Field grouping: native Tabs interface for >6 fields

### 2.2 `projects_translations`

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `projects_id` | FK → projects | Parent. |
| `languages_code` | M2O → `languages` | |
| `title` | string, required | ≤100 chars (Input interface). |
| `one_liner` | text | ≤500 chars (Textarea). |
| `description` | text | ≤2000 chars (Textarea — single paragraph; **NOT** Block Editor in 18e per Q1). |

### 2.3 `projects_sections` (O2M from projects, mirrors `services_sections`)

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `projects_id` | FK → projects | Parent. |
| `sort` | integer | Order within parent. |
| `translations` | alias → `projects_sections_translations` | |

### 2.4 `projects_sections_translations`

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `projects_sections_id` | FK → projects_sections | Parent. |
| `languages_code` | M2O → `languages` | |
| `title` | string, required | |
| `content` | text | ≤5000 chars (Textarea — single paragraph; **NOT** Block Editor in 18e per Q1). |

### 2.5 `projects_impact_metrics` (O2M from projects, mirrors `services_deliverables`)

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `projects_id` | FK → projects | Parent. |
| `sort` | integer | First row (`sort=0`) is the featured metric in adapter output. |
| `value` | string, required | Locale-universal display, e.g., `"30s"`, `"99.9%"`. |
| `before` | string, nullable | Locale-universal, e.g., `"2 days"`. |
| `translations` | alias → `projects_impact_metrics_translations` | |

### 2.6 `projects_impact_metrics_translations`

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `projects_impact_metrics_id` | FK → projects_impact_metrics | Parent. |
| `languages_code` | M2O → `languages` | |
| `label` | string, required | Localized context phrase, e.g., "Real-time refresh cycles". |

### 2.7 `projects_services` (M2M junction)

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `project_id` | FK → projects | |
| `service_id` | FK → services | |

Replaces `services.related_projects` CSV. Adapter reads it from both directions:
- `projects.byService(serviceId)` — junction filtered by `service_id`
- `services` port's `relatedProjects` — junction filtered by `service_id`, per-request memoized via PreviewContext WeakMap

### 2.8 Services schema mutation (second push)

DROP `services.related_projects` field after the adapter has switched to junction reads. Pre-zero NOT required (the field's data is migrated into the junction during seed; after that, the field is unread).

## 3 · Permissions (~18 rows in `directus/collections/permissions.json`)

### ai-editor (`read+create+update`, no delete; publish-blocked filter `status _neq "published"` per CONVENTIONS § 2 item 17)

7 rows on the projects family: `projects` · `projects_translations` · `projects_sections` · `projects_sections_translations` · `projects_impact_metrics` · `projects_impact_metrics_translations` · `projects_services`.

+ 1 row on `directus_comments` `read+create` scoped to projects family via `collection _starts_with "projects"`.

### human-editor (`read+create+update+delete`, no filter)

Same 7 collections.

### Public (`read` only)

- `projects` with filter `status _eq "published"` (CONVENTIONS § 2 item 17).
- `projects_translations` with filter `projects_id.status _eq "published"` (FK-cascade filter — keeps draft project translations invisible).
- `projects_sections` with filter `projects_id.status _eq "published"`.
- `projects_sections_translations` with filter `projects_sections_id.projects_id.status _eq "published"`.
- `projects_impact_metrics` with filter `projects_id.status _eq "published"`.
- `projects_impact_metrics_translations` with filter `projects_impact_metrics_id.projects_id.status _eq "published"`.
- `projects_services` with filter `project_id.status _eq "published"`.

`directus_files` Public read is already folder-scoped per 18d Task 42 — covers hero images. No change needed.

## 4 · Fixture (`apps/cms/fixtures/collections/projects.json`)

Hand-written export of [`apps/web/src/lib/content/projects.ts`](../../../../apps/web/src/lib/content/projects.ts). Six projects:

1. `yesid-dev` — featured, has hero_image (`images/work/yesid-dev.png`), 1 section, no impact metrics
2. `transit-data-pipeline` — public, no hero, 0 sections, 2 impact metrics, related to `data-pipeline` + `sql-development`
3. `lorem-analytics-dashboard` — public, no hero, 2 sections, 2 impact metrics with `before`, related to `analytics-reporting`
4. `lorem-database-migration` — public, no hero, 2 sections, 1 impact metric, related to `database-engineering` + `sql-development`
5. `lorem-query-optimizer` — public, no hero, 1 section, no metrics, related to `sql-development` + `database-engineering`
6. `lorem-retool-admin` — public, no hero, 1 section, no metrics, related to `internal-tooling` + `analytics-reporting`

**Fixture entry shape (illustrative):**
```jsonc
{
  "id": "yesid-dev",
  "status": "published",
  "featured": true,
  "sort": 0,
  "hero_image_legacy_path": "images/work/yesid-dev.png",
  "repo_url": "https://github.com/mgkdante/yesid.dev",
  "live_url": "https://yesid.dev",
  "stack": ["SvelteKit", "Svelte 5", "TypeScript", "Tailwind CSS", "Vercel"],
  "tags": ["portfolio", "web", "svelte"],
  "translations": [
    { "languages_code": "en", "title": "yesid.dev — Portfolio Site", "one_liner": "...", "description": "..." }
  ],
  "sections": [
    { "sort": 0, "translations": [{ "languages_code": "en", "title": "Why SvelteKit?", "content": "..." }] }
  ],
  "impact_metrics": [],
  "related_services": ["web-development"]
}
```

`hero_image_legacy_path` is the manifest reference; the seed's pure transform calls `assetIdFor(legacyPath)` to resolve to the Directus file UUID before the row is written. Null on the 5 hero-less projects.

`related_services` carries the static `Project.relatedServices` array; the seed translates it into `projects_services` junction inserts after project rows exist (skeleton-then-full-data per CONVENTIONS § 4).

**Zod validation:** `ProjectsFixtureSchema` Zod schema (app-local in `apps/cms/scripts/seed-projects.ts` — matches services seed pattern; D14 keeps `@repo/shared` type-only).

## 5 · Seed script (`apps/cms/scripts/seed-projects.ts`)

Mirrors [`seed-services.ts`](../../../../apps/cms/scripts/seed-services.ts) shape exactly. Imports from 18c lib:

- `lib/sdk` (createClient + defaultDirectusUrl)
- `lib/auth` (getAdminToken with token / email+password fallback)
- `lib/logger` (createLogger scope)
- `lib/catch-error` (DirectusError + parseErrors)
- `lib/loaders` (loadSkeletonRecords + loadFullData for M2M circular FKs)
- `lib/read-fixture` (Zod-validated fixture load)
- `@repo/shared.assetIdFor` (legacyPath → UUID)

### Pure helpers (exported for unit tests)

- `toProjectRow(project)` — flat row + nested children skeleton; resolves `hero_image` via `assetIdFor` (or `null`).
- `toProjectTranslationRows(project)` — locale enumeration (en + optional fr/es), one row per locale.
- `toSectionRows(project)` — sort indices + nested translations.
- `toImpactMetricRows(project)` — sort indices + value/before + nested translations (label).
- `toJunctionRows(project)` — `{ project_id, service_id }[]` from `Project.relatedServices`.

### CLI flow

```
1. Validate fixture (Zod) → array of Project
2. Auth via getAdminToken(directusUrl)
3. If --reset: delete all projects (FK CASCADE clears translations + sections + impact_metrics + projects_services junction rows)
4. loadSkeletonRecords('projects', toProjectRow) — creates project rows + nested translations + sections (with translations) + impact_metrics (with translations) in one nested write per project
5. loadFullData('projects_services', flatten(toJunctionRows)) — junction rows now that project ids exist
6. Read back + assert: project count + section count + impact_metric count + junction row count
```

### CLI flags

- `--dry-run` — no writes; pure helpers exercised + summary log; no auth fetch.
- `--reset` — delete-then-recreate. Initial 18e seed runs with `--reset`. Idempotent re-runs are deferred (upsert pattern is a 18k follow-up; matches services seed-services.ts current behavior).

### Entry-point guard

`if (import.meta.main)` — pure helpers importable in tests without triggering main.

## 6 · Adapter port (`apps/web/src/lib/adapters/directus.ts`)

### Phase 6a — Projects port (first commit, before flip)

**Typed row interfaces:**
- `DirectusProject` (parent)
- `DirectusProjectTranslation`
- `DirectusProjectSection` + `DirectusProjectSectionTranslation`
- `DirectusProjectImpactMetric` + `DirectusProjectImpactMetricTranslation`
- `DirectusProjectsServicesRow` (junction)

**Pure mappers:**
- `toProject(row): Project` — parallel to `toService`. Hero image extracted as the M2O id (string). Adapter contract change for `Project.image`: returns the Directus file UUID instead of a static filename. Consumer uses `asset(uuid, preset)` helper from `apps/web/src/lib/directus/assets.ts` to build URLs (single call site; the static adapter MUST also map filename → UUID via `assetIdForOrUndefined` so the consumer is uniform across both adapters).
- `toLocalizedString` reused (already at `directus.ts:100`).

**Fetch fn:** `fetchProjects(filter?, ctx?)` with nested fields:
```
['*',
  { translations: ['*'] },
  { sections: ['id', 'sort', { translations: ['*'] }] },
  { impact_metrics: ['id', 'sort', 'value', 'before', { translations: ['*'] }] },
]
```
Routed through `createQueuedFetch()` + `parsePort('projects.*', ProjectSchema, ...)` Zod gate. Optional `ctx?: PreviewContext` threaded through.

**8 port methods** (matching the existing static port interface in [`apps/web/src/lib/adapters/types.ts`](../../../../apps/web/src/lib/adapters/types.ts)):

| Method | Implementation |
|---|---|
| `all(ctx?)` | `fetchProjects(undefined, ctx)` — Public policy filters to `published`; editors see all |
| `bySlug(slug, ctx?)` | `fetchProjects({ id: { _eq: slug } }, ctx)[0]` |
| `featured(ctx?)` | `fetchProjects({ featured: { _eq: true } }, ctx)` |
| `public(ctx?)` | `fetchProjects({ status: { _eq: 'published' } }, ctx)` |
| `byService(serviceId, ctx?)` | Two-stage: `readItems('projects_services', { filter: { service_id: { _eq: serviceId } }, fields: ['project_id'] })` → `fetchProjects({ id: { _in: ids } }, ctx)` |
| `allTags(ctx?)` | Minimal-fields fetch (`fields: ['tags']`) → flatten + dedupe + sort |
| `allStackItems(ctx?)` | Minimal-fields fetch (`fields: ['stack']`) → flatten + dedupe + sort |
| `serviceIdsForProjects(ctx?)` | Minimal-fields fetch on junction → flatten + dedupe + sort |

### Phase 6b — Services adapter mutation (between pushes)

Switches `services.relatedProjects` from CSV-on-row to junction read.

- New helper: `fetchRelatedProjectsViaJunction(serviceId, ctx?)` — `readItems('projects_services', { filter: { service_id: { _eq: serviceId } }, fields: ['project_id'] })`, returns `string[]`.
- Per-request memoized via PreviewContext WeakMap (mirrors `adjacencyMemo` at [directus.ts:273](../../../../apps/web/src/lib/adapters/directus.ts:273)).
- `toService(row)` no longer reads `row.related_projects`; the populated value comes from the per-ctx memoized junction lookup, threaded into `Service.relatedProjects` at the outer composition.

### Phase 6c — Hybrid flip (`apps/web/src/lib/adapters/index.ts`)

One-line change moving `projects` from static adapter → directus adapter. Lands at the end of phase 6a. Static adapter remains for blog/meta/techStack/content/proofReel until those slices land.

### Phase 6d — Second push cleanup

After `services.related_projects` field is dropped, remove `related_projects` from `DirectusService` row interface. Confirm `toService` has no reference to the field.

## 7 · Tests (4 boundaries per CONVENTIONS § 5)

### CMS app — `apps/cms/tests/`

**`fixture-projects.test.ts`** — Zod-validates `fixtures/collections/projects.json` against `ProjectsFixtureSchema`. Asserts:
- 6 projects, all required fields present
- `hero_image_legacy_path` (when set) exists in `assets-id-map.json` (cross-check)
- `related_services` ids reference services that exist in `fixtures/collections/services.json`

**`seed-projects-dry-run.test.ts`** — exercises pure transform helpers without network:
- `toProjectRow` shape (id, status default, hero_image resolution via `assetIdFor`)
- `toProjectTranslationRows` (locale enumeration, English required)
- `toSectionRows` + section translation flattening
- `toImpactMetricRows` + label translations + before nullable
- `toJunctionRows` (M2M rows from `Project.relatedServices`)
- Snapshot test on full transformation for representative projects: `yesid-dev` (hero_image present), `transit-data-pipeline` (2 metrics), `lorem-database-migration` (1 metric)

### Web app — `apps/web/src/lib/adapters/`

**`directus.contract.test.ts`** — extend with projects pure-mapping:
- `toProject` from `DirectusProject` row → expected `Project`
- Locale fallback (en-only vs en+fr+es)
- Hero image M2O → UUID extraction
- Sections + impact_metrics sort + translation flattening
- Adapter contract: `impactMetric === impactMetrics[0]` when present

**`directus.mocked.test.ts`** — extend with mocked-fetch contract for all 8 port methods + URL/query shape assertions:
- `projects.all` → `/items/projects` + nested fields shape
- `projects.bySlug('yesid-dev')` → filter `id._eq`
- `projects.public` → filter `status._eq=published`
- `projects.featured` → filter `featured._eq=true`
- `projects.byService('sql-development')` → two-stage (junction first, projects second)
- `projects.allTags` / `allStackItems` / `serviceIdsForProjects` → minimal-fields semantics
- **Services-adapter regression block:** `services.byId('sql-development')` related_projects resolution comes from junction (not CSV); per-ctx memoized

### Integration tests

`directus.integration.test.ts` projects block — out of 18e scope; lands with 18j integration-test workflow polish.

## 8 · Migration sequencing (the 2-push pattern)

```
[commit 1] feat(18e Phase 1): add projects schema + permissions + fixture
  → directus-sync push #1 (feature branch CMS):
     · creates projects + translations + sections (+ translations)
       + impact_metrics (+ translations) + projects_services junction
     · adds ai-editor + human-editor + Public permission rows (~18 rows)
     · services.related_projects field UNTOUCHED
  → fixture committed; tests pass against unflipped adapter

[commit 2] feat(18e Phase 2): seed projects + populate junction
  → bun run seed:projects --reset
  → assets-id-map verified (hero_image resolves)
  → projects_services rows created from Project.relatedServices arrays
  → adapter not yet flipped

[commit 3] feat(18e Phase 3): directus adapter — projects port + services junction read
  → directus.ts: projects port implemented (8 methods)
  → directus.ts: services port reads relatedProjects via M2M (per-ctx memo)
  → contract + mocked tests for all 8 methods green
  → services-adapter regression test green (junction-backed reads)

[commit 4] feat(18e Phase 4): hybrid flip — projects port to Directus
  → adapters/index.ts: projects port = directusAdapter.projects
  → live smoke: /projects renders 6 projects from Directus
  → live smoke: /projects/yesid-dev renders detail page (hero from R2, sections, impact_metrics)
  → live smoke: /services/[slug] related-projects strip via junction

[commit 5] feat(18e Phase 5): drop services.related_projects CSV field
  → directus-sync push #2: removes services.related_projects field
  → DirectusService row interface: remove related_projects
  → tests + smoke re-verified
  → directus-sync diff empty after push
```

Five commits, single PR. Each commit is independently buildable + passes tests.

## 9 · Live smoke acceptance (close gates)

- [ ] `/projects` lists all 6 published projects from Directus (no static fallback).
- [ ] `/projects/yesid-dev` renders detail page: hero_image from R2, 1 section, no impact metrics.
- [ ] `/projects/transit-data-pipeline` renders: no hero (gradient), 0 sections, 2 impact metrics.
- [ ] `/projects/lorem-database-migration` renders: no hero, 2 sections, 1 impact metric.
- [ ] `/services/sql-development` "Related projects" strip resolves via M2M junction (transit-data-pipeline + lorem-query-optimizer + lorem-database-migration).
- [ ] Network tab on `/services/[slug]`: junction lookup is one round-trip per service (per-ctx memoized).
- [ ] `bun run check` 0 errors on apps/web · `bun run test` full suite green both apps.
- [ ] `apps/cms` 114+ existing tests green + new fixture/seed tests green.
- [ ] `directus-sync diff` empty after each of the two pushes.
- [ ] `services.related_projects` field gone from production schema.
- [ ] Hybrid flip lands at `apps/web/src/lib/adapters/index.ts` (single-line change).
- [ ] All deferred work filed as GitHub issues before close commit (per AGENTS.md `## Never` workflow rule, e17c4b3).

## 10 · Out of scope / deferred

- **Block Editor for projects** (Q1 deferral) — follow-on after 18f's `BlockRenderer.svelte` ships. Schema migration: `projects_translations.description` text → block editor JSON; `projects_sections_translations.content` text → block editor JSON. Static fixture data converts via 18f's `migrate-markdown-to-blocks.ts` (or text-to-paragraph trivial conversion).
- **`directus.integration.test.ts` projects block** — 18j scope (integration-test workflow polish).
- **`scaffold-port.ts` extension to handle M2M-heavy schemas** — 18k scope (after 18f/18g/18h teach the right shape).
- **Sharp transform fix on Railway** ([#37](https://github.com/mgkdante/yesid.dev/issues/37)) — `hero_image` served via `?key=hero-1200` returns original bytes, not 1200-wide WebP, until that ticket lands. Acceptable for 18e because `yesid-dev.png` is 2482×1326 PNG (passthrough fine for now).
- **R2 bucket versioning** ([#38](https://github.com/mgkdante/yesid.dev/issues/38)) — 18j.
- **`assets-id-map.json` sync between `apps/cms` and `packages/shared`** ([#40](https://github.com/mgkdante/yesid.dev/issues/40)) — post-slice-18 polish.
- **Upsert seed pattern** — 18k. Current `--reset` flow is the established convention for 18a/18c services.

## 11 · Constraints + risk notes

- **directus-sync `_syncId` for folders/policies must be UUIDs** (18d Task 7 finding; `preserveIds=true` rejects strings). For permissions, regular string `_syncId` works; for the 7 collection definitions of projects family, follow the directus-sync `pull` output and don't hand-author `_syncId`s.
- **`@repo/shared` types + Zod only** (D14). Runtime helpers (assetIdFor is fine — pure data lookup) stay app-local where they need to be (seed scripts in `apps/cms/scripts/lib/`; adapters in `apps/web/src/lib/`).
- **No new custom Directus extensions** (D11). Only directus-sync.
- **`Project.image` adapter contract change** — value semantics shift from filename to UUID at the adapter boundary. The static adapter MUST map filename → UUID via `assetIdForOrUndefined` so consumer components are uniform across both adapter paths (`asset(image, preset)` everywhere). Without this, the consumer would need a branchy "static-mode vs directus-mode" check — unacceptable. Implementation note: if any project has `image` set to a filename whose legacy path isn't in the id-map, the static adapter returns `undefined` (consumer falls back to gradient placeholder).
- **Permission cascade filters** depend on Directus permission filter syntax supporting FK traversal (`projects_id.status _eq "published"`). This is documented Directus 11 behavior; if a particular cascade doesn't resolve, fall back to a Flow-based hide filter (out of 18e scope).
- **M2M chicken-and-egg** is solved within the seed via `loadSkeletonRecords` (parents first) → `loadFullData` (junction). Services already exist at seed time. Projects are created in step 4. Junction populates in step 5.
- **Integration test gap** — `directus.integration.test.ts` doesn't cover projects in 18e. Live smoke is the verification surface. Mocked-fetch tests cover the fetch shape; live-smoke covers the round-trip.

## 12 · Files map (what changes)

### New files (CMS app)

- `apps/cms/directus/collections/projects.json` (collection definition)
- `apps/cms/directus/collections/projects_translations.json`
- `apps/cms/directus/collections/projects_sections.json`
- `apps/cms/directus/collections/projects_sections_translations.json`
- `apps/cms/directus/collections/projects_impact_metrics.json`
- `apps/cms/directus/collections/projects_impact_metrics_translations.json`
- `apps/cms/directus/collections/projects_services.json`
- `apps/cms/directus/fields/projects/*.json` (one per field)
- `apps/cms/directus/fields/projects_translations/*.json`
- `apps/cms/directus/fields/projects_sections/*.json`
- `apps/cms/directus/fields/projects_sections_translations/*.json`
- `apps/cms/directus/fields/projects_impact_metrics/*.json`
- `apps/cms/directus/fields/projects_impact_metrics_translations/*.json`
- `apps/cms/directus/fields/projects_services/*.json`
- `apps/cms/directus/relations/*.json` (FK relations)
- `apps/cms/fixtures/collections/projects.json`
- `apps/cms/scripts/seed-projects.ts`
- `apps/cms/tests/fixture-projects.test.ts`
- `apps/cms/tests/seed-projects-dry-run.test.ts`

### Modified files (CMS app)

- `apps/cms/directus/collections/permissions.json` — adds ~18 rows
- `apps/cms/directus/collections/services.json` — second push: removes `related_projects` field reference
- `apps/cms/directus/fields/services/related_projects.json` — second push: deleted
- `apps/cms/package.json` — adds `seed:projects` script

### New files (Web app)

- `apps/web/src/lib/schemas/project.ts` — Zod schema for `parsePort` gate (matches services schema pattern)

### Modified files (Web app)

- `apps/web/src/lib/adapters/directus.ts` — adds projects port (8 methods); replaces 8 `todo()` stubs at directus.ts:391–399; adds services-adapter junction read
- `apps/web/src/lib/adapters/index.ts` — flips projects port from static → directus (single line)
- `apps/web/src/lib/adapters/directus.contract.test.ts` — extends with projects mapping tests
- `apps/web/src/lib/adapters/directus.mocked.test.ts` — extends with projects fetch-shape tests + services regression
- `apps/web/src/lib/adapters/static.ts` — `Project.image` resolves via `assetIdForOrUndefined` so consumer is uniform across paths

### Modified consumer components (Web app)

Components that render `project.image` use `asset(project.image, preset)` from `apps/web/src/lib/directus/assets.ts`:
- `ProjectCard.svelte`, `ProjectMiniCard.svelte`
- `ProjectDetailHeader.svelte`, `ProjectDetailPage.svelte`
- Any `+page.svelte` consuming `Project` and rendering its image

(Final list resolved via codebase grep during execution.)

### Documentation

- `docs/slices/slice-18/18e-projects/research.md` — populated as work progresses (probe findings, open follow-ups, resolved questions).
- `docs/slices/slice-18/18e-projects/decisions.md` — rolling log of decisions + amendments per workflow.
- `docs/slices/slice-18/plan.md` — append 18e task breakdown via writing-plans skill (next step after this spec).
- `docs/slices/slice-18/CONVENTIONS.md` — no changes expected; 18e validates the existing conventions.

## 13 · References

- Slice plan: [`docs/slices/slice-18/plan.md`](../plan.md) § 18e
- Slice conventions: [`docs/slices/slice-18/CONVENTIONS.md`](../CONVENTIONS.md)
- 18d decisions (load-bearing): [`docs/slices/slice-18/18d-asset-pipeline/decisions.md`](../18d-asset-pipeline/decisions.md)
- 18d research (Sharp + Public folder-scope findings): [`docs/slices/slice-18/18d-asset-pipeline/research.md`](../18d-asset-pipeline/research.md)
- Slice replan (D-entries, scope sketch § 7.2): [`docs/superpowers/specs/2026-04-24-slice-18-replan.md`](../../../superpowers/specs/2026-04-24-slice-18-replan.md)
- Static module to migrate: [`apps/web/src/lib/content/projects.ts`](../../../../apps/web/src/lib/content/projects.ts)
- Reference seed script: [`apps/cms/scripts/seed-services.ts`](../../../../apps/cms/scripts/seed-services.ts)
- Reference adapter port: [`apps/web/src/lib/adapters/directus.ts`](../../../../apps/web/src/lib/adapters/directus.ts)
- Asset helper: [`apps/web/src/lib/directus/assets.ts`](../../../../apps/web/src/lib/directus/assets.ts) + `@repo/shared.assetIdFor`
- Migrate-assets reference: [`apps/cms/scripts/migrate-assets.ts`](../../../../apps/cms/scripts/migrate-assets.ts)

---

**Next step:** invoke `superpowers:writing-plans` to convert this spec into the 18e task breakdown (appended to `docs/slices/slice-18/plan.md` per 18c/18d structure).
