# Slice 18h-ii — Icons — Implementation Plan

> Read [spec.md](spec.md) + [decisions.md](decisions.md) first. Most patterns reused from 18a-g without re-derivation.

## Phase map

| Phase | Tasks | Scope |
|---|---|---|
| 0 | Extension install | Install Simple Iconify Picker community extension in `apps/cms` per D-AMEND-1; verify Directus discovers it on boot; document field-config syntax for binding it to `icons.iconify_id` |
| 1 | Probes + audit | P1: 34 tech_stack.icon → iconify_id mapping table; P2: directus_files Public read sanity; P3 was originally "extension search" but is RESOLVED (Q5); P4: rename mechanics dry-run |
| 2 | Schema | `icons` collection + 7 fields + permissions (~10 rows) + 18-item checklist; bind picker interface on `iconify_id` field |
| 3 | Seed | `seed-icons.ts` (mirrors seed-projects shape) + run live |
| 4 | tech_stack migration | Add `icon_id` M2O FK on tech_stack, backfill from existing string field, drop string field, rename to `icon` |
| 5 | Adapter + types + IconRenderer | TechStackItem.icon shape change; `directus.techStack` nested expansion; generalize TechIcon → IconRenderer; tests |
| 6 | Close | Acceptance run + 2 GH issues (admin page + namespace audit) + memory + PR |

Estimated effort: **0.5-1 session** (most patterns reuse 18g; the migration step is the ~30 min unknown).

## Phase 0 — Extension install (3 tasks)

**Exit gate:** Simple Iconify Picker extension is installed in `apps/cms`, committed to git, deployed to Railway, and visible as an interface option in Data Studio's field-edit screen. D-AMEND-1 honored.

### Task 0.1: Add extension to Dockerfile

> **Correction (verified pre-implementation):** The original plan said `bun add <package>`. That is
> wrong. `apps/cms/package.json` is `@repo/cms` — a workspace package for scripts (sync, seed,
> migrate), NOT the Directus runtime. The Directus runtime is the `directus/directus:11.17.3` Docker
> image that Railway builds from `apps/cms/Dockerfile`. Adding the extension to the workspace package
> via `bun add` would not install it into the Directus container and Directus would never discover it.
> The correct mechanism is a Dockerfile `RUN npm install` line — mirroring the existing
> `directus-extension-sync@3.0.6` pattern — so the extension lands in `/directus/node_modules` AND
> is listed in `/directus/package.json`'s `dependencies` key (both required for Directus 11
> auto-discovery; see Dockerfile comment block lines 20-24 for the empirical context).

Verified package name (npm registry, Dec 2025): `simple-iconify-picker@1.0.1`
- GitHub: https://github.com/Sedatb23/directus-simple-iconify-picker
- npm: `simple-iconify-picker` (NOT `directus-extension-iconify-picker` — that name returns 404)
- Extension type: bundle (interface `iconify-picker` + endpoint `iconify-proxy`)
- Host constraint: `^10.10.0` — see Task 0.3 and research.md § P3 for risk note

Add a second `RUN npm install` line to `apps/cms/Dockerfile` after the existing sync install:

```dockerfile
# Install Simple Iconify Picker (slice 18h-ii) — typeahead UX for icons.iconify_id field.
# Extension declares host ^10.10.0; runtime is 11.17.3. Compatibility unverified at install
# time — empirical Railway boot is the gate. If Directus rejects it, decisions.md Q-AMEND
# captures fork-or-replace options.
RUN npm install --no-audit --no-fund simple-iconify-picker@1.0.1
```

Pin to exact `1.0.1` — never use a floating version range (Directus extensions can break on minor bumps).

### Task 0.2: Commit + Railway deploy

Commit only `apps/cms/Dockerfile` (no workspace package.json or bun.lock change — extension lives in the Docker image, not the monorepo workspace). Push. Railway auto-rebuilds the `apps/cms` image.

After deploy, verify Directus boots cleanly + the new interface appears in admin → Settings → Data Model → any field's interface dropdown:

```bash
gh run list --workflow railway-deploy --limit 1
# Then in Data Studio: Settings → Data Model → Pick any collection → Add Field → Interface dropdown
# expect "Simple Iconify Picker" (or similar — name from extension package) listed
```

### Task 0.3: Document binding syntax in this slice's docs

The picker is bound to a field via the field's `meta.interface` value (the extension's interface ID). Find that ID by:
- Extension's README on dirextensions.com / GitHub
- Or by adding a test field in Data Studio, picking the picker, then `cd apps/cms && bun run sync:pull --collections-only` to see the resulting JSON

The verified binding for `icons.iconify_id` (from the extension's `package.json`
`directus:extension.entries[0].name`):

```json
{
  "meta": {
    "interface": "iconify-picker",
    "options": {
      "defaultCollection": "logos",
      "collections": ["logos", "skill-icons", "devicon", "vscode-icons", "mdi"],
      "iconSize": 24
    }
  }
}
```

> Field names verified against `Sedatb23/directus-simple-iconify-picker/src/interface/index.ts`
> 2026-04-27 — README's `allowedCollections`/`previewSize` are wrong; actual fields are
> `collections` (type: json, interface: tags → JSON array) and `iconSize` (type: integer).

Notes on option values:
- `defaultCollection`: overriding the extension default (`mdi`) to `logos` — first-choice set for
  tech-stack icons given its broad coverage of dev tooling logos
- `collections`: JSON array of allowed icon sets; `logos + skill-icons + devicon + vscode-icons`
  cover the tech-stack universe; `mdi` included as fallback for any generic icons
- `iconSize`: 24px (extension default; fine for the admin UX)

This will be hardcoded in `apps/cms/directus/snapshot/fields/icons/iconify_id.json` in Phase 2.

```bash
git add apps/cms/Dockerfile docs/slices/slice-18/18h-ii-icons/plan.md docs/slices/slice-18/18h-ii-icons/research.md
git commit -m "feat(slice-18 18h-ii Phase 0): install simple-iconify-picker community extension (per D-AMEND-1)"
git push
```

## Phase 1 — Probes + audit (4 tasks)

**Exit gate:** P1 mapping table complete (34 entries, each with chosen iconify_id or flagged for svg_override); P2 + P3 + P4 documented.

### Task 1: P1 audit — generate iconify_id mapping table

```bash
curl -s 'https://cms.yesid.dev/items/tech_stack?fields=id,icon&limit=-1' \
  | bun -e "JSON.parse(require('fs').readFileSync(0,'utf-8')).data.forEach(t=>console.log(t.id,t.icon))" \
  | sort > /tmp/18h-ii/tech-icons.txt
```

For each, populate the mapping table in `research.md § P1`. For misses, flag for `svg_override` or note in editorial follow-up.

### Task 2: P2 — directus_files Public read sanity

Upload a test SVG, GET via `/assets/<uuid>`, verify 200 OK. Document the folder-scope path if needed (mirror 18d's pattern).

### Task 3: P3 — community Iconify picker extension search

P3 RESOLVED in Phase 0 — see [research.md § P3](research.md). No action required.

### Task 4: P4 — rename dry-run

Test on a throwaway field whether `directus-sync` handles a field rename safely. Document.

## Phase 2 — Schema (1 task)

**Exit gate:** `icons` collection live; `sync:diff` clean; permissions matrix correct; 18-item checklist green.

### Task 5: Author Directus schema via directus-sync

Files to create:
- `apps/cms/directus/snapshot/collections/icons.json` (parent)
- `apps/cms/directus/snapshot/fields/icons/{id,name,iconify_id,svg_override,category,notes,status,sort}.json` (8 files)
- `apps/cms/directus/snapshot/relations/icons/svg_override.json` (M2O → directus_files)
- ~10 permission rows added to `apps/cms/directus/collections/permissions.json` (8 standard CRUD + 2 directus_comments-scope addition via `_or` extending the existing tech_stack/projects coverage)

Mirror the `tech_stack` parent shape from PR #65 + alias-fix patterns from PR #68 (already merged main when this slice runs).

After authoring:
```bash
cd apps/cms
bun run sync:push  # PowerShell with auth
bun run sync:diff  # bash; expect 0/0/0
```

## Phase 3 — Seed (2 tasks)

**Exit gate:** ≥34 icon rows live; counts verified via Public read.

### Task 6: `apps/cms/scripts/seed-icons.ts`

Mirror `seed-projects.ts` shape. Fixture at `apps/cms/fixtures/collections/icons.json`.

For initial seed, generate fixture from P1 mapping table. Each row:
```json
{
  "id": "airflow",
  "name": "Apache Airflow",
  "iconify_id": "logos:apache-airflow",
  "svg_override": null,
  "category": ["tech-stack"],
  "notes": null,
  "status": "published",
  "sort": 1
}
```

### Task 7: Run live + verify

```bash
bun run apps/cms/scripts/seed-icons.ts --dry-run | head -40
bun run apps/cms/scripts/seed-icons.ts
curl -s 'https://cms.yesid.dev/items/icons?fields=id&limit=-1' | jq '.data | length'   # ≥34
```

## Phase 4 — tech_stack migration (3 tasks)

**Exit gate:** `tech_stack.icon` is now a M2O FK to `icons.id`; old string field deleted; data integrity verified.

### Task 8: Add `tech_stack.icon_id` field (M2O → icons.id)

New field JSON: `apps/cms/directus/snapshot/fields/tech_stack/icon_id.json` + relation `apps/cms/directus/snapshot/relations/tech_stack/icon_id.json`.

Push. Existing rows have `icon_id = NULL`.

### Task 9: Backfill `tech_stack.icon_id`

Backfill helper script (e.g., `apps/cms/scripts/migrate-tech-stack-icon.ts`):
- Read all `tech_stack` rows
- For each, find the matching `icons.id` row (by exact slug match against current `tech_stack.icon` string)
- PATCH each row with `icon_id` set
- Verify: zero rows with `icon_id = NULL` post-backfill

### Task 10: Drop legacy `tech_stack.icon` string field + rename `icon_id` → `icon`

Per Q6 staged approach:
1. Update consumer code first to read from `icon_id` (Phase 5 — TechStackItem type change). This must land before the rename so consumers don't break.
2. Drop `tech_stack.icon` string field. Push.
3. Rename `icon_id` → `icon`. Push.

Rename mechanics: P4 audit determines whether directus-sync handles rename cleanly OR we keep the field as `icon_id` to avoid risk.

## Phase 5 — Adapter + types + IconRenderer (3 tasks)

**Exit gate:** all consumers compile; `bun run check` 0 errors; tests green.

### Task 11: Update `TechStackItem` type + Zod schema

In `packages/shared/src/types/content.ts`:

```ts
export interface IconRecord {
  id: string;
  name: string;
  iconify_id: string | null;
  svg_override: string | null;  // directus_files UUID
}

export interface TechStackItem {
  id: string;
  name: string;
  icon: IconRecord | null;          // CHANGED: was `string`
  what_it_is: LocalizedBlockEditorDoc;
  what_i_use_it_for: LocalizedBlockEditorDoc;
  why_i_use_it_instead: LocalizedBlockEditorDoc;
  relatedServices: string[];
  relatedProjects: string[];
}
```

Add `IconRecordSchema` Zod schema in `apps/web/src/lib/schemas/icon.ts`. Update `TechStackItemSchema` to embed it.

### Task 12: Update `directus.techStack` adapter

In `apps/web/src/lib/adapters/directus.ts`:

```ts
const fields = [
  'id', 'name', 'icon.id', 'icon.name', 'icon.iconify_id', 'icon.svg_override',
  // existing translations + services + projects expansions
];
```

`toTechStackItem(row)` reads `row.icon` as the nested record (or null).

Static adapter `getAllTechItems()` continues returning legacy string `null` for icon (degraded path until 18k cleanup).

### Task 13: Generalize `TechIcon.svelte` → `IconRenderer.svelte`

In `apps/web/src/lib/components/cms/`:
- Rename `TechIcon.svelte` → `IconRenderer.svelte`
- Prop becomes `icon: IconRecord | null` (not bare string)
- Logic: if `icon.svg_override` present, render `<img src={asset(icon.svg_override)} />`. Else if `icon.iconify_id`, render `<Icon icon={icon.iconify_id} />`. Else render placeholder.
- Keep `tech-icon-utils.ts` for the legacy bare-slug fallback during transition (drop in 18k once all consumers migrate)

Update unit tests. Add tests for the svg_override branch (mock asset() helper).

## Phase 6 — Close (3 tasks)

### Task 14: Acceptance run

```bash
cd apps/web && bun run check 2>&1 | tail -10
cd apps/web && bun run test 2>&1 | tail -10
cd apps/cms && bun test 2>&1 | tail -10
```

### Task 15: File GH issues (per decisions.md § GH issues to file at close)

- Icon library admin page in apps/web (Q-OPEN-3)
- Audit + standardize iconify_id namespaces (Q-OPEN-2 follow-up)
- (Optional) Quarterly maintenance check on Simple Iconify Picker extension

### Task 16: Memory + plan + close

- Update `~/.claude/projects/.../memory/project_completed_slices.md`: add 18h-ii row
- Update `project_slice_18.md`: mark 18h-ii closed; if it's part of a unified slice flow, advance the next-up
- Update `docs/slices/slice-18/plan.md`: 18h-ii status flipped to ✅ closed (note: this branch starts un-aware of 18h-ii in plan.md; first commit in this slice will ADD the 18h-ii row to plan.md)
- Push branch, open PR, merge

## Acceptance gates summary

- [ ] `icons` collection live in Directus; `sync:diff` clean
- [ ] ≥34 icon rows seeded (one per `tech_stack.icon`); each has `iconify_id` OR `svg_override`
- [ ] `tech_stack.icon` is M2O FK; old string field gone; renamed cleanly (or accepted as `icon_id`)
- [ ] `directus.techStack.{all,byId}` returns nested icon record via `parsePort` guard
- [ ] `<IconRenderer>` renders both Iconify and svg_override paths; unit tests pass
- [ ] `bun run check` 0 errors; apps/web vitest green; apps/cms tests green
- [ ] 3 GH issues filed (typeahead + admin page + namespace standardization)
- [ ] Plan.md row added (this slice doesn't exist yet in main's plan.md); memory + close ceremony
- [ ] PR merged
