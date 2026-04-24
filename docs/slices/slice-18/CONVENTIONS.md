# Slice 18 — Conventions

> Canonical conventions for the Directus CMS migration. Written in 18c Task 52 (per design spec [§ 8](../../superpowers/specs/2026-04-24-slice-18-replan.md#8-cross-cutting-conventions-conventionsmd)). Every sub-slice from 18d onward MUST follow these — deviations require a D-entry amendment in [`plan.md`](plan.md) § D-entries.

## 0 · App independence (convention + code review)

`apps/web` and `apps/cms` are separate concerns inside the monorepo. The ONLY permitted cross-app coupling is:

1. `ContentAdapter` TS interface at `apps/web/src/lib/adapters/types.ts`
2. directus-sync schema at `apps/cms/directus/**.json`
3. Shared types + Zod schemas via `@repo/shared` workspace package

**Enforcement is by convention, not dedicated CI.** Apps are NOT workspace packages (`packages/*` is the only workspace glob); cross-app imports require relative paths (`../../cms/...`) that are ugly and catch in code review. Amended 2026-04-24 from "strict boundary + CI check" → "convention + code review" per owner directive (YAGNI).

**Workflow:** Work in one app at a time. Cross-app refactors (e.g., schema change → adapter change) land in a single PR with clearly scoped commits — CMS commit first, web commit second.

## 1 · Field naming

| Side | Convention | Example |
|---|---|---|
| Directus collection fields | `snake_case` | `related_projects`, `long_description`, `impact_metric_value` |
| TS domain types | `camelCase` | `relatedProjects`, `longDescription`, `impactMetric.value` |
| Mapping | Adapter's `to<Collection>(row)` function | `toService(row)` — see `apps/web/src/lib/adapters/directus.ts` |

**Standard interfaces** (Data Studio UI):

- **Slug** interface derived from `title` (for routes)
- **Tags** interface for tag arrays
- **File/Image M2O** for images (never raw URL strings)
- **Dropdown** for `status` — values: `draft`, `published`, `archived`
- **Integer (hidden)** for `sort` — populated by drag-and-drop

## 2 · Per-collection 18-item checklist

Every user collection (services, projects, blog, tech-stack, meta, M2A blocks) MUST satisfy every item. Checked by `tests/snapshot-shape.test.ts` (scope placeholder — lands in 18d).

1. `meta.display_template` — no raw IDs in list views
2. `meta.icon` — at-a-glance collection identification
3. `meta.note` — human + AI (MCP `schema` tool reads this)
4. `meta.sort_field` — for ordered collections (services, deliverables, sections)
5. `meta.archive_field: "status"` + `archive_value: "archived"` + `unarchive_value: "draft"` — services uses `visible` as a legacy exception; all new collections use `status`
6. `meta.item_duplication_fields` — explicit list; exclude `status`, `date_published`, `date_created`, `date_updated`, `user_created`, `user_updated`
7. `meta.preview_url` — template locked post-18 routes; e.g. `https://yesid.dev/services/{{id}}?share={{$CURRENT_SHARE.token}}`
8. `meta.versioning: true` — Global Draft enabled (D5)
9. `meta.accountability: "all"` — row-level audit trail
10. Translations junction — every localized field on `<collection>_translations` (D14 + § 8 below)
11. Field grouping — native Tabs interface for forms > 6 fields
12. Field widths — use half/full pairs to avoid ragged columns (e.g., `icon` + `sort` half-width, `description` full)
13. `meta.note` on every business field — AI-editor context + human onboarding
14. `meta.required: true` on publish-required fields — Directus blocks `status: published` writes if missing
15. `meta.conditions` — contextual visibility (e.g., `deliverables` tab visible only when `status != draft`)
16. `directus/presets.json` entry — default list view layout (columns + filters) per collection
17. `directus/permissions.json` ai-editor row — `read: all`, `create/update: filter status _neq "published"`, `delete: false`. For 18c services exception: no publish-block filter (too few rows); rule applies from 18e onward.
18. `directus/permissions.json` comments row — ai-editor + human-editor `read+create` on `directus_comments` scoped to the collection

## 3 · Permission patterns

9 capability policies compose onto 3 roles + Public:

- **Roles:** Administrator · Human Editor · AI Editor · Public
- **Policies:** 9 capability-scoped (read, create, update, delete, share, comment, versioning, flow-trigger, preview) × collection families (system, services, projects, blog, tech-stack, meta, pages, files)

`scripts/scaffold-port.ts` (Task 54) auto-emits 4 permission rows per new collection (ai-editor × read/create/update + human-editor update-scope).

## 4 · Seed-script shape

Every CMS seed script follows this skeleton:

```ts
#!/usr/bin/env bun
import { createClient, getAdminToken } from './lib/sdk';         // CMS-local auth helper
import { loadFixture } from './lib/read-fixture';                // Zod-validated fixture loader
import { ServiceSchema, type Service } from '@repo/shared';      // shared Zod + TS type
import { loadSkeletonRecords, loadFullData } from './lib/loaders'; // upsert-by-id + circular-FK pattern
import { parseErrors, DirectusError } from './lib/catch-error';
import { logger } from './lib/logger';

// Pure transform helpers — exported for unit tests.
export function toServiceRow(item: Service): ServiceRow { /* ... */ }

export async function seedServices(items: Service[], opts: SeedOptions) {
  if (opts.reset) await deleteAll(client, 'services');
  await loadSkeletonRecords(client, 'services', items.map(toServiceRow));
  await loadFullData(client, 'services', items.map(toServiceRow));
}

if (import.meta.main) {
  main().catch((err) => { logger.error(parseErrors(err)); process.exit(1); });
}
```

### Rules

- **`@repo/shared` imports are types + Zod schemas ONLY** (D14). Runtime helpers (SDK client, auth, pagination, rate-limit) live app-local: `apps/cms/scripts/lib/` for CMS scripts, `apps/web/src/lib/` for adapters.
- **Contract:** upsert-by-id (not nuke) · `--dry-run` flag · `--reset` flag for explicit delete+recreate · skeleton-records-then-full-data for M2M circular FKs · idempotent reruns · fixture Zod-validated at load · pure helpers exported for testing.

## 5 · Test-boundary taxonomy

### CMS app (`apps/cms/tests/`)

- `snapshot-shape.test.ts` — enforces the 18-item checklist across all user collections (lands in 18d pattern work)
- `fixture-<collection>.test.ts` — Zod-validates fixture JSON against shared schema
- `seed-<collection>-dry-run.test.ts` — exercises pure transform helpers (no network)
- `mcp-policy-shape.test.ts` — ai-editor permission audit for privilege-creep detection
- `fixture-drift.test.ts` — services fixture vs static module (TRANSITIONAL — retires in 18k when static modules delete)

### Web app (`apps/web/src/lib/adapters/`)

- `directus.contract.test.ts` — structural port presence + pure-mapping per collection (`toService`, `toLocalizedString`, etc.)
- `directus.mocked.test.ts` — mocked-fetch contract per port (URL + query shape assertions; 18c template covers services.all/byId/visible, pattern for future ports)
- `directus.integration.test.ts` — env-gated live round-trip (CI label `[integration]` + nightly cron)

### Intra-repo

- `.github/workflows/contract-test.yml` — opt-in PR label + nightly cron; runs both apps' test suites against a shared ephemeral Directus instance

## 6 · Adapter port template

Every collection port in `apps/web/src/lib/adapters/directus.ts` (or future split per-collection files) MUST export:

1. **Typed row interface** — mirrors Directus schema (snake_case fields): `DirectusService`, `DirectusProject`, etc.
2. **Pure mapping function** — `to<Collection>(row): <Collection>`; no network, no env, no async.
3. **Fetch function** — `fetch<Collection>s(filter?, ctx?)` wrapping `createDirectus().request(readItems(...))` with:
   - p-queue + retry via `createQueuedFetch()` (F13 — see `directus-queue.ts`)
   - `parsePort('<collection>.<method>', Schema, data)` Zod gate at the return boundary (F3)
   - Optional `ctx?: PreviewContext` threaded through (F5 + D6)
4. **Port interface satisfaction** — `const <collection>Port: <Collection>Port` at bottom of file; satisfies the interface in `types.ts`.

## 7 · Rich-content field rule

| Field type | Rule | Examples |
|---|---|---|
| **Input** | Single-line, ≤100 chars | `title`, `slug`, `category`, `tag`, `status` |
| **Textarea** | Single paragraph ≤500 chars, no rich formatting | `excerpt`, `tagline`, `short_description`, `alt` |
| **Block Editor** | Rich, multi-paragraph; may contain headings, code blocks, images, lists, embeds | `blog.body`, `tech_stack.body`, `sections.content`, `block_manifesto.body` |

**Hard rule: no Markdown interface anywhere.** No `marked.parse` in the consumer bundle after 18i closes (D15). Every rich field is Block Editor JSON rendered via `BlockRenderer.svelte` (18f deliverable).

## 8 · Translation conventions

- Every localized field on `<collection>_translations` junction, **never on the parent collection**.
- Junction columns: `languages_code` (M2O to `languages` collection) + per-field columns (`title`, `description`, etc.).
- Adapter fetches with `fields: ['*', { translations: ['*'] }]`; flattens via `toLocalizedString(translations, field)` at the boundary.
- Fallback order: `en` → requested locale (if populated) → empty string `''`.
- Data Studio: use the Translation Generator wizard to scaffold new fields across all locales.

Example:

```ts
// Directus row
{ id: 'sql-development', station: 1, translations: [
    { languages_code: 'en', title: 'SQL Development', description: '...' },
    { languages_code: 'fr', title: 'Développement SQL', description: '...' },
]}

// Adapter output
{ id: 'sql-development', station: 1,
  title: { en: 'SQL Development', fr: 'Développement SQL' },
  description: { en: '...', fr: '...' } }
```

## 9 · File + asset conventions

### Folders (in Directus Files module)

`services` · `projects` · `blog` · `brand` · `about` · `og`

### Asset lifecycle

- **Legacy filenames preserved at migration** (e.g., `station-sql.json` stays as the filename) — Directus additionally assigns a UUID as the primary key. Adapters reference by UUID, not filename.
- **Alt text via `directus_files.description`** — field marked required (validation rule) to force accessibility.
- **Focal points** — default-center on upload; MCP system prompt nudges the ai-editor to set focal_point explicitly for hero images (Q8).

### Preset convention (D9)

`STORAGE_ASSET_TRANSFORM=presets` locked on Railway (18c Task 37). Ad-hoc `?width=X&height=Y` returns 403.

| Preset | Width | Use case |
|---|---:|---|
| `hero-1200` | 1200 | Hero images (service detail, project detail, blog header) |
| `card-600` | 600 | Listing cards (service grid, project grid, blog list) |
| `thumb-300` | 300 | Navigation thumbnails, related-items lists |
| `hero-og` | fixed 1200×630 | OG share images |

AVIF variants added post-P8 probe (18d).

**Never compose transform URLs manually in Svelte components** — always use `asset(id, preset?)` + `buildSrcSet(id, presets[])` from `apps/web/src/lib/directus/assets.ts` (18c Task 47).

## 10 · Flow conventions

- **Event Hook → Action** — non-blocking side-effects (revalidation, notifications, publish webhooks). Default choice.
- **Event Hook → Filter** — pre-commit payload mutation; use rarely, only when the mutation MUST happen before DB write.
- **Manual trigger** — editor-invoked quick actions surfaced in the item view sidebar.
- **Schedule** — content integrity checks + housekeeping (e.g., nightly orphan-file sweep).
- **Webhook op body** — minimum `{ collection, keys, event }`; add payload diffs if downstream consumer needs them.
- **Failure path** — append a `Throw Error` op with logged context so failed Flow runs surface in `directus_activity` with diagnostic info, not silent swallows.
- **Flow logs ON in production** — overhead minimal; diagnosis gain enormous.

## 11 · Rollback procedures

See [`docs/ops/rollback.md`](../../ops/rollback.md) (18c Task 53). Covers:

- Schema revert (directus-sync rollback to prior commit)
- Seed revert (re-run seed with `--reset` + prior fixture)
- Data loss recovery (Neon PITR — BYO branch + 7-day retention)
- Port flip revert (single-line `adapter` index swap)

---

**Appendix A — references**

- Design spec: [`docs/superpowers/specs/2026-04-24-slice-18-replan.md`](../../superpowers/specs/2026-04-24-slice-18-replan.md) § 8
- Slice plan: [`plan.md`](plan.md)
- 18c amendments: [`18c-foundations/decisions.md`](18c-foundations/decisions.md)
