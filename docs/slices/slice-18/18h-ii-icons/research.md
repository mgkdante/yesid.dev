# 18h-ii — Research

> Probes that need to run before implementation, and findings as they're collected.

## Inherited patterns from 18a-g (no re-research needed)

- **Schema layout** — per-resource JSON files at `apps/cms/directus/snapshot/{collections,fields,relations}/`. Permissions in single `apps/cms/directus/collections/permissions.json`
- **AM4 (18g) permissions uniqueness key** — `(collection, action, policy)` is unique; the `permissions` filter is ignored for dedup. If touching `directus_comments` for the new collection, merge into the existing `_or` filter
- **Adapter port template** (CONVENTIONS § 6) — typed row + pure `to<Collection>(row)` + `parsePort('<collection>.<method>', Schema, data)` + optional `ctx?: PreviewContext`
- **Seed-script shape** (CONVENTIONS § 4) — `seed-projects.ts` archetype: lib helpers + Zod fixture + dry-run + reset + pure helpers + parseFlags + main + import.meta.main guard
- **M2O alias on parent** + `one_field` on the relation file — both required for bidirectional UI (PR #68 lesson)

## P1 — Audit current `tech_stack.icon` strings + map to Iconify (RESOLVED)

**Question:** for each of the 34 unique `tech_stack.icon` strings, what's the canonical iconify_id?

**Why it matters:** seed data quality. Bad mappings = broken icons in honeycomb consumer.

**Method:** Iconify public search API (`https://api.iconify.design/search?query=<q>&limit=8`) probed for all
ambiguous/special cases. Obvious `logos:<slug>` mappings verified by confirming the slug appears in API results;
emoji-only matches (e.g. `alembic`) and zero-result queries flagged as `svg_override: NEEDED`.

**Summary:** 20 icons resolve cleanly to `logos:` namespace, 7 need explicit slug transformations (still `logos:` or
`devicon:`), 7 flagged for `svg_override` (no usable Iconify logo match).

### Full 34-row mapping table

| `tech_stack.id` | current `icon` | proposed `iconify_id` | confidence | notes |
|---|---|---|---|---|
| `airflow` | `airflow` | `logos:airflow` | verified | API returns `logos:airflow` as first result |
| `alembic` | `alembic` | — | svg_override: NEEDED | API returns only emoji sets (openmoji, twemoji, noto). No tech logo exists in Iconify. Needs custom SVG upload. |
| `bun` | `bun` | `logos:bun` | verified | API confirms `logos:bun` |
| `cpp` | `cpp` | `logos:c-plusplus` | verified | `logos:cpp` does not exist; API confirms `logos:c-plusplus` |
| `csharp` | `csharp` | `logos:c-sharp` | verified | API confirms `logos:c-sharp` as top result |
| `dax` | `dax` | — | svg_override: NEEDED | Zero results for `dax microsoft` query. No Iconify logo. Microsoft Power BI DAX — niche; needs custom SVG. |
| `docker` | `docker` | `logos:docker` | verified | API confirms `logos:docker` as first result |
| `flutter` | `flutter` | `logos:flutter` | verified | API confirms `logos:flutter` |
| `github-actions` | `github-actions` | `logos:github-actions` | verified | API confirms `logos:github-actions` |
| `gsap` | `gsap` | `simple-icons:gsap` | verified | No `logos:gsap` or `logos:greensock` exists. API confirms `simple-icons:gsap` + `bxl:gsap`. `simple-icons:gsap` preferred (monochrome, consistent with brand). Note: no full-color logo available. |
| `java` | `java` | `logos:java` | verified | API confirms `logos:java` as first `logos:` result |
| `jetpack-compose` | `jetpack-compose` | `devicon:jetpackcompose` | verified | No `logos:jetpack-compose`. API confirms `devicon:jetpackcompose` (colored). `logos:` namespace has no entry. |
| `kotlin` | `kotlin` | `logos:kotlin` | verified | API confirms `logos:kotlin` |
| `mysql` | `mysql` | `logos:mysql` | verified | API confirms `logos:mysql` |
| `nextjs` | `nextjs` | `logos:nextjs` | verified | API confirms `logos:nextjs` (note: black wordmark; `logos:nextjs-icon` is the standalone icon) |
| `node-js` | `node-js` | `logos:nodejs-icon` | verified | `logos:node-js` does not exist. API returns `logos:nodejs` (wordmark) and `logos:nodejs-icon` (icon-only). Use `logos:nodejs-icon` for consistency with other icon-only entries. |
| `playwright` | `playwright` | `logos:playwright` | verified | API confirms `logos:playwright` as first `logos:` result |
| `postgresql` | `postgresql` | `logos:postgresql` | verified | API confirms `logos:postgresql` |
| `power-bi` | `power-bi` | `logos:microsoft-power-bi` | verified | API confirms `logos:microsoft-power-bi` as sole `logos:` result |
| `python` | `python` | `logos:python` | verified | API confirms `logos:python` |
| `react` | `react` | `logos:react` | verified | API confirms `logos:react` |
| `rest-api` | `rest-api` | — | svg_override: NEEDED | Only `dashicons:rest-api` (WordPress archive set). No tech logo in Iconify. Generic REST concept — needs custom SVG or a generic HTTP icon. |
| `rust` | `rust` | `mdi:language-rust` | editorial-pick (2026-04-27) | User picked `mdi:language-rust` fallback over Ferris crab SVG upload. Monochrome gear-shaped R; consistent with brand. |
| `sql-server` | `sql-server` | `devicon:microsoftsqlserver` | verified | No `logos:microsoft-sql-server`. API confirms `devicon:microsoftsqlserver` (colored) as best available. |
| `ssis` | `ssis` | — | svg_override: NEEDED | Zero results across all queries (`ssis microsoft`, `ssis integration services`). No Iconify logo. SQL Server Integration Services — niche; needs custom SVG. |
| `ssrs` | `ssrs` | — | svg_override: NEEDED | Zero results. SQL Server Reporting Services — niche; needs custom SVG. |
| `svelte-5` | `svelte` | `logos:svelte` | verified | tech_stack.id is `svelte-5`, icon string is `svelte`. API confirms `logos:svelte`. |
| `sveltekit` | `sveltekit` | `logos:svelte-kit` | verified | No `logos:sveltekit`. API confirms `logos:svelte-kit` (note: hyphen). |
| `t-sql` | `t-sql` | `devicon:microsoftsqlserver` | editorial-pick (2026-04-27) | User picked `devicon:microsoftsqlserver` stand-in (same icon as `sql-server` row). T-SQL is the SQL Server dialect, so visual reuse is acceptable. |
| `tailwind` | `tailwind` | `logos:tailwindcss` | verified | No `logos:tailwind`. API confirms `logos:tailwindcss` (note: full name). |
| `threejs-threlte` | `threejs` | `logos:threejs` | verified | tech_stack.id is `threejs-threlte`, icon is `threejs`. API confirms `logos:threejs`. Threlte has no dedicated icon; `logos:threejs` is correct. |
| `typescript` | `typescript` | `logos:typescript` | verified | API confirms `logos:typescript` (note: `logos:typescript-icon` is the icon-only variant) |
| `vercel` | `vercel` | `logos:vercel` | verified | API confirms `logos:vercel` |
| `vitest` | `vitest` | `logos:vitest` | verified | API confirms `logos:vitest` |

### Slug transformation summary

Icons requiring slug changes from the bare `tech_stack.icon` string:

| category | count | examples |
|---|---|---|
| Clean `logos:<slug>` (bare slug works directly) | 16 | `react`, `python`, `docker`, `flutter`, `kotlin`, `mysql`, `postgresql`, `typescript`, `vercel`, `vitest`, `playwright`, `bun`, `java`, `airflow`, `svelte` (from `svelte-5`), `logos:threejs` (from `threejs`) |
| Slug transformation needed (still in `logos:` or `devicon:`) | 11 | `cpp→logos:c-plusplus`, `csharp→logos:c-sharp`, `node-js→logos:nodejs-icon`, `power-bi→logos:microsoft-power-bi`, `github-actions→logos:github-actions` (bare works), `nextjs→logos:nextjs` (bare works), `sveltekit→logos:svelte-kit`, `tailwind→logos:tailwindcss`, `gsap→simple-icons:gsap`, `jetpack-compose→devicon:jetpackcompose`, `sql-server→devicon:microsoftsqlserver` |
| Editorial pick (2026-04-27) | 2 | `rust`→`mdi:language-rust` (mdi fallback), `t-sql`→`devicon:microsoftsqlserver` (stand-in matches sql-server) |
| `svg_override: NEEDED` — DEFERRED | 5 | `alembic`, `dax`, `rest-api`, `ssis`, `ssrs` — no usable Iconify match; Phase 3 seed inserts these rows with `iconify_id: null` AND `svg_override: null`; `<IconRenderer>` shows placeholder; SVG sourcing is post-slice editorial follow-up (file as GH issue at close) |

**Editorial decisions made 2026-04-27:**
- `rust` → use `mdi:language-rust` (resolved; gate-eligible)
- `t-sql` → use `devicon:microsoftsqlserver` stand-in (resolved; gate-eligible)
- 5 truly-missing icons (`alembic`, `dax`, `rest-api`, `ssis`, `ssrs`) → seed with `iconify_id: null`, `svg_override: null`, `notes: "SVG sourcing deferred — see slice 18h-ii close GH issue"`. Renderer placeholder is acceptable until the editorial follow-up resolves.

**Acceptance gate adjustment:** the original gate "each icon row has `iconify_id` OR `svg_override` populated" is loosened to "≥29/34 rows populated; the 5 deferred (alembic/dax/rest-api/ssis/ssrs) are documented in this research.md as known editorial follow-ups; render gracefully via placeholder in the meantime." See spec.md acceptance gate 4.

## P2 — Verify `directus_files` permissions allow Public read of svg_override files (RESOLVED)

**Question:** when an icon's `svg_override` references a directus_files row, can the Public role read that file via `/assets/<uuid>.svg`?

**Why it matters:** if not, public consumers fail to load uploaded SVGs.

**Resolution:** Option 1 — add a new `icons` folder and extend the existing `_in` permission list.

### Current state

The `directus_files` Public read permission is folder-scoped. From `apps/cms/directus/collections/permissions.json`:

```json
{
  "collection": "directus_files",
  "action": "read",
  "permissions": {
    "_and": [{ "folder": { "id": { "_in": [<7 folder UUIDs>] } } }]
  },
  "policy": "_sync_default_public_policy",
  "_syncId": "_sync_perm_public_files_read_folder_scoped"
}
```

The 7 currently-allowed folders (from `apps/cms/directus/collections/folders.json`):
- `blog` — `02c30511-8c14-46aa-b6f1-cf2d8999290e`
- `og` — `1868fd73-d094-45eb-9d0c-802e2b49cf23`
- `illustrations` — `3b0880d2-9e19-4812-9b35-d16fba7c2e46`
- `services` — `5699c47c-c016-484d-ad42-ea35d75ed918`
- `brand` — `82238060-72ab-414b-8f72-a7f83b15dc59`
- `projects` — `da9ff878-3124-43d6-9cf9-11524fc0edd9`
- `about` — `e4764c31-b8b4-4045-b066-76653bc3c884`

### Recommendation: Option 1 — add new `icons` folder

**Rationale:** the existing per-content-type folder pattern is the correct abstraction. Adding `icons` as an 8th
folder maintains consistent semantics — each folder maps to one editorial domain. Reusing `brand` or `illustrations`
would conflate svg_override files with unrelated editorial assets and create confusion for future maintainers.

The folder-scoped `_in` list is already proven by 7 live folders. Adding an 8th entry is a one-line JSON change.
No test SVG upload needed — the pattern is validated.

### Phase 2 work required

1. **Add `icons` folder entry** to `apps/cms/directus/collections/folders.json`:

```json
{
  "name": "icons",
  "parent": null,
  "_syncId": "<new-uuid-to-be-generated>"
}
```

2. **Extend permissions `_in` list** in `apps/cms/directus/collections/permissions.json` — add the new folder's
   `_syncId` UUID to the `folder.id._in` array.

3. **`directus-sync push`** — directus-sync will create the folder on Directus (generates a live UUID), resolve the
   `_syncId` reference in the permission filter, and apply the updated permission in a single push. No manual step needed
   beyond adding the JSON entries.

The `_syncId` for the new `icons` folder will be chosen at Phase 2 authoring time (generate a UUID v4, follow the
`<descriptive-sync-id>` naming convention used by existing folders).

## P3 — Community Directus extension search for Iconify picker (RESOLVED — REJECTED)

**Resolution:** evaluated `simple-iconify-picker@1.0.1` (Sedatb23/directus-simple-iconify-picker), installed empirically (commits 03eaea2 + 55e6da5), and **rejected**. Pivoted to in-stack solution per decisions.md Q5.

### What we evaluated

| Attribute | Value |
|---|---|
| npm package | `simple-iconify-picker` |
| Version pinned | `1.0.1` (Dec 2025) |
| GitHub | https://github.com/Sedatb23/directus-simple-iconify-picker |
| Extension type | bundle (interface `iconify-picker` + endpoint `iconify-proxy`) |
| License | MIT |
| Listed on | dirextensions.com (Directus marketplace) |
| Stars | 0 |
| Age | 4 months (initial commit 2025-12-28) |
| Total commits | 4 |
| Maintainers | 1 (sedatb23) |
| Host constraint | `^10.10.0` (does NOT satisfy our `directus/directus:11.17.3` runtime under strict semver) |
| README accuracy | Wrong package name (claimed `directus-extension-iconify-picker`) + wrong field names (claimed `allowedCollections`/`previewSize`; actual `collections`/`iconSize`) |

### Why rejected

1. **Empirical install failure.** Pushed Dockerfile install + Railway auto-rebuilt. Extension did NOT appear in Data Studio's Settings → Extensions list — Directus 11 silently rejects extensions whose `host` field doesn't satisfy the runtime version. The marketplace listing on dirextensions.com is misleading: it lists extensions without enforcing host-compat against the latest Directus.

2. **Maintenance bus factor.** 0 stars + 4 months old + single maintainer + zero patch history = catastrophic bus factor for a dependency we'd carry indefinitely.

3. **Cost-value mismatch.** Editor saves ~30 seconds per new icon (rare flow, ~once a month). Estimated annual time saved: ~6 minutes. Cost: indefinite fork maintenance + Directus upgrade gating + boot-time risk.

4. **Better alternative exists in our stack.** Built-in M2O picker on `tech_stack.icon → icons` already provides typeahead-by-name (the surface editors use 95% of the time). A Svelte 5 page in apps/web can serve the rare visual-discovery flow with zero Directus dependency.

### Pivot

Path D — in-stack solution (decisions.md Q5):
- `icons.iconify_id` → plain string field with `meta.options.placeholder` + `meta.options.note` + adapter regex validation
- `tech_stack.icon → icons` → built-in M2O picker (typeahead by `icons.name`)
- `apps/web/src/routes/admin/icons/+page.svelte` → Svelte 5 browse page (curated grid + Iconify search via public API + click-to-copy iconify_id)

### D-AMEND-1 fallout

The amended D-AMEND-1 (slice 18 plan.md, locked 2026-04-27 evening) tightens the bar to ≥50 stars OR ≥1 year maintenance OR org-backed. Sedatb23 picker would have failed all three — would have been rejected upfront under amended bar. See decisions.md Q-AMEND-1 for the lesson + amended-rule rationale.

## P4 — Schema migration mechanics for tech_stack.icon (RESOLVED — Option B recommended)

**Question:** what's the safest sequence for changing `tech_stack.icon` from string field to M2O FK without losing data or breaking adapter consumers? Specifically: will `directus-sync push` interpret a field rename (`icon_id` → `icon`) as drop-then-create (losing FK references) or as a safe rename?

**Why it matters:** mid-flight broken state = blocked deploys.

**Recommendation: Option B — skip the rename, leave field as `icon_id`.**

### Research findings

**directus-sync behavior on field rename:**
- The directus-sync README and official docs make no mention of a field rename operation. The tool operates by diffing
  local JSON snapshot files against the live Directus schema and applying additions/deletions. There is no `rename`
  primitive.
- When a field's JSON file is deleted (old name) and a new file is created (new name), directus-sync interprets this
  as: **drop the old field, create a new field**. The `field` key in snapshot JSON files is the identity key — changing
  the filename/field value = new identity = drop + create cycle.
- This has a concrete bug vector: **Issue #116** (`Extension deletes field if alias has the same name`) confirmed that
  directus-sync uses the field key/filename as the uniqueness identity for snapshot tracking. A rename is not atomic —
  it leaves a gap between drop and create where FK references (in relations files) point to a nonexistent field.
- The config (`apps/cms/directus-sync.config.cjs`) has no rename-related config options and no hooks system that
  would allow intercepting a rename. The config is connection/path/feature flags only.
- **No closed issue or PR in tractr/directus-sync demonstrates a working rename flow.** Searched issues for `rename`,
  `field rename`, `migration`, `schema`, `column` — no relevant resolution found.

**Conclusion:** `directus-sync push` will treat a field rename as drop-then-create. The FK relation (`tech_stack.icon_id
→ icons`) would be left dangling or deleted during the drop phase. This is a data-integrity risk with no safe
mitigation available within the current directus-sync tooling.

### Recommendation: Option B

**Leave the field as `icon_id`.** No rename step in Phase 4.

- The adapter reads from `tech_stack.icon_id` — field name is an internal API detail, not a consumer-visible label.
- The M2O alias field in Directus Data Studio can be labeled `"Icon"` in the field metadata (`meta.field_label`) regardless of the actual field name — editors will never see `icon_id`.
- The Directus REST API URL segment (`/items/tech_stack?fields[]=icon_id.name`) is used only in the adapter layer, which we control.
- **Zero migration risk.** The M2O FK integrity is preserved throughout the entire migration sequence.

### Safe migration sequence (no rename)

1. Add `icons` collection + fields. Push.
2. Seed `icons` rows (one per distinct `tech_stack.icon` value). Verify counts.
3. Add `tech_stack.icon_id` (M2O → icons, nullable). Push.
4. Backfill: update `tech_stack.icon_id` for all 34 rows based on `icons.name` match. Verify all non-null.
5. Switch adapter reads from `tech_stack.icon` (string) to `tech_stack.icon_id` (M2O). Deploy.
6. Drop `tech_stack.icon` string field. Push. (Field label on `icon_id` already says "Icon" — no editor UX impact.)

Step 6 is safe because at that point no adapter or UI depends on `tech_stack.icon`.

## Open questions (none yet)

To be populated during execution if plan assumptions break.
