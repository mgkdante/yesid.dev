# Slice 18h-ii — Icons — Implementation Plan

> Read [spec.md](spec.md) + [decisions.md](decisions.md) first. Most patterns reused from 18a-g without re-derivation.

> **Pivot note (2026-04-27 evening):** Phase 0 (community extension install) was attempted (commits 03eaea2 + 55e6da5) and reverted after empirical install failure on Directus 11.17.3. The slice now uses an in-stack solution: built-in M2O typeahead via `tech_stack.icon → icons` for picking, and a new Svelte 5 page at `apps/web/src/routes/admin/icons` for visual discovery. See [decisions.md § Q5 + Q-AMEND-1](decisions.md) and [research.md § P3](research.md) for the full pivot rationale.

## Phase map

| Phase | Tasks | Scope |
|---|---|---|
| 1 | Probes + audit | P1: 34 tech_stack.icon → iconify_id mapping table; P2: directus_files Public read sanity; P4: rename mechanics dry-run (P3 RESOLVED + REJECTED — see research.md) |
| 2 | Schema | `icons` collection + 7 fields + permissions (~10 rows) + 18-item checklist; `iconify_id` field uses built-in `input` interface with placeholder + note (no extension binding per Q5 pivot) |
| 3 | Seed | `seed-icons.ts` (mirrors seed-projects shape) + run live |
| 4 | tech_stack migration | Add `icon_id` M2O FK on tech_stack, backfill from existing string field, drop string field, rename to `icon` |
| 5 | Adapter + types + IconRenderer | TechStackItem.icon shape change; `directus.techStack` nested expansion; generalize TechIcon → IconRenderer; iconify_id format regex validation; tests |
| 6 | apps/web /admin/icons page | New Svelte 5 route showing curated icons grid + Iconify search via public API + click-to-copy iconify_id (replaces deferred Q-OPEN-3; visual discovery surface for the rare new-icon flow) |
| 7 | Close | Acceptance run + 1 GH issue (namespace audit) + memory + PR |

Estimated effort: **0.5–1 session** for Phases 1-5 + 7; **5-7 hours** added by Phase 6 admin page (MVP+ tier). Net total ~1-1.5 sessions — same envelope as original plan since the dropped Phase 0 + 2 GH-issue items absorbs the new Phase 6 work.

## Phase 1 — Probes + audit (3 tasks)

**Exit gate:** P1 mapping table complete (34 entries, each with chosen iconify_id or flagged for svg_override); P2 + P4 documented.

### Task 1: P1 audit — generate iconify_id mapping table

```bash
curl -s 'https://cms.yesid.dev/items/tech_stack?fields=id,icon&limit=-1' \
  | bun -e "JSON.parse(require('fs').readFileSync(0,'utf-8')).data.forEach(t=>console.log(t.id,t.icon))" \
  | sort > /tmp/18h-ii/tech-icons.txt
```

For each, populate the mapping table in `research.md § P1`. For misses, flag for `svg_override` or note in editorial follow-up.

### Task 2: P2 — directus_files Public read sanity

Upload a test SVG, GET via `/assets/<uuid>`, verify 200 OK. Document the folder-scope path if needed (mirror 18d's pattern).

### Task 3: P4 — rename dry-run

Test on a throwaway field whether `directus-sync` handles a field rename safely. Document.

## Phase 2 — Schema (1 task)

**Exit gate:** `icons` collection live; `sync:diff` clean; permissions matrix correct; 18-item checklist green.

### Task 4: Author Directus schema via directus-sync

Files to create:
- `apps/cms/directus/snapshot/collections/icons.json` (parent)
- `apps/cms/directus/snapshot/fields/icons/{id,name,iconify_id,svg_override,category,notes,status,sort}.json` (8 files)
- `apps/cms/directus/snapshot/relations/icons/svg_override.json` (M2O → directus_files)
- ~10 permission rows added to `apps/cms/directus/collections/permissions.json` (8 standard CRUD + 2 directus_comments-scope addition via `_or` extending the existing tech_stack/projects coverage)

Mirror the `tech_stack` parent shape from PR #65 + alias-fix patterns from PR #68 (already merged main when this slice runs).

**`iconify_id` field meta** (no extension binding — per Q5 pivot):

```json
{
  "field": "iconify_id",
  "type": "string",
  "meta": {
    "interface": "input",
    "options": {
      "placeholder": "e.g. logos:react, mdi:home, skill-icons:python",
      "note": "Browse [icon-sets.iconify.design](https://icon-sets.iconify.design/) — click any icon, copy the ID shown under it. Or use our [icons admin page](/admin/icons) to search and copy."
    }
  }
}
```

After authoring:
```bash
cd apps/cms
bun run sync:push  # PowerShell with auth
bun run sync:diff  # bash; expect 0/0/0
```

## Phase 3 — Seed (2 tasks)

**Exit gate:** ≥34 icon rows live; counts verified via Public read.

### Task 5: `apps/cms/scripts/seed-icons.ts`

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

### Task 6: Run live + verify

```bash
bun run apps/cms/scripts/seed-icons.ts --dry-run | head -40
bun run apps/cms/scripts/seed-icons.ts
curl -s 'https://cms.yesid.dev/items/icons?fields=id&limit=-1' | jq '.data | length'   # ≥34
```

## Phase 4 — tech_stack migration (3 tasks)

**Exit gate:** `tech_stack.icon` is now a M2O FK to `icons.id`; old string field deleted; data integrity verified.

### Task 7: Add `tech_stack.icon_id` field (M2O → icons.id)

New field JSON: `apps/cms/directus/snapshot/fields/tech_stack/icon_id.json` + relation `apps/cms/directus/snapshot/relations/tech_stack/icon_id.json`.

Push. Existing rows have `icon_id = NULL`.

### Task 8: Backfill `tech_stack.icon_id`

Backfill helper script (e.g., `apps/cms/scripts/migrate-tech-stack-icon.ts`):
- Read all `tech_stack` rows
- For each, find the matching `icons.id` row (by exact slug match against current `tech_stack.icon` string)
- PATCH each row with `icon_id` set
- Verify: zero rows with `icon_id = NULL` post-backfill

### Task 9: Drop legacy `tech_stack.icon` string field (no rename — keep `icon_id`)

Per Q6 staged approach + P4 finding:
1. Update consumer code first to read from `icon_id` (Phase 5 — TechStackItem type change). This must land before the drop so consumers don't break.
2. Drop `tech_stack.icon` string field. Push.

**No rename.** P4 (research.md) found directus-sync uses field key as identity → any rename = drop+create cycle, would lose FK references. Keep the field as `icon_id` permanently. Adapter layer can still display "Icon" in UI regardless of the field key (set Directus's `meta.note`/`meta.display_options.label` to "Icon" if needed for editor clarity).

Type field name in TechStackItem: `icon` (the type field can be named whatever we want, decoupled from the Directus field key — adapter maps `row.icon_id` → `item.icon`).

## Phase 5 — Adapter + types + IconRenderer (3 tasks)

**Exit gate:** all consumers compile; `bun run check` 0 errors; tests green.

### Task 10: Update `TechStackItem` type + Zod schema

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

**Iconify ID format validation** (added per Q5 pivot — replaces what the picker would have prevented):

In `IconRecordSchema`, validate `iconify_id` matches `^[a-z][a-z0-9-]*:[a-z0-9-]+$` (lowercase, kebab, single colon). Log warning + render placeholder on mismatch; do NOT throw — degraded path.

### Task 11: Update `directus.techStack` adapter

In `apps/web/src/lib/adapters/directus.ts`:

```ts
const fields = [
  'id', 'name', 'icon.id', 'icon.name', 'icon.iconify_id', 'icon.svg_override',
  // existing translations + services + projects expansions
];
```

`toTechStackItem(row)` reads `row.icon` as the nested record (or null).

Static adapter `getAllTechItems()` continues returning legacy string `null` for icon (degraded path until 18k cleanup).

### Task 12: Generalize `TechIcon.svelte` → `IconRenderer.svelte`

In `apps/web/src/lib/components/cms/`:
- Rename `TechIcon.svelte` → `IconRenderer.svelte`
- Prop becomes `icon: IconRecord | null` (not bare string)
- Logic: if `icon.svg_override` present, render `<img src={asset(icon.svg_override)} />`. Else if `icon.iconify_id`, render `<Icon icon={icon.iconify_id} />`. Else render placeholder.
- Keep `tech-icon-utils.ts` for the legacy bare-slug fallback during transition (drop in 18k once all consumers migrate)

Update unit tests. Add tests for the svg_override branch (mock asset() helper).

## Phase 6 — apps/web /admin/icons Svelte browse page (4 tasks)

**Exit gate:** `apps/web/src/routes/admin/icons/+page.svelte` ships; renders curated grid + Iconify search; manual smoke test passes; not gated behind auth at MVP.

This phase replaces what Q-OPEN-3 originally deferred. It IS the editor's visual discovery surface (the role we'd have given the dropped Directus extension).

### Task 13: Route scaffolding + curated icons grid

Create `apps/web/src/routes/admin/icons/+page.svelte` + `+page.server.ts` (or +page.ts; check apps/web load convention).

Server load: fetch `/items/icons?fields=id,name,iconify_id,svg_override&filter[status][_eq]=published&limit=-1` from Directus. Returns shape `{ icons: IconRecord[] }`.

Client grid: render the icons via `<IconRenderer icon={...} />` (the component shipped in Phase 5). Each cell shows the icon visually + the `name` + the `iconify_id` (or "[svg_override]" badge for those). Click a cell → copies `iconify_id` to clipboard via `navigator.clipboard.writeText`.

Layout: CSS grid, ~80px square per icon, 6-8 columns desktop / 3-4 tablet / 2 mobile. No filtering UI at MVP — visual scan only.

### Task 14: Iconify public-API search component

New component `apps/web/src/lib/components/admin/IconifySearch.svelte`:
- Search input (debounced, 250ms)
- Calls `https://api.iconify.design/search?query=<q>&limit=64` (CORS-friendly public endpoint; no auth required)
- Renders results in a grid using `<Icon icon={result.id} />` from `@iconify/svelte` (already in apps/web for `<TechIcon>`)
- Click a result → copies `result.id` to clipboard, toast "Copied {id}"

Default search: empty input shows a "type to search" hint. Below the search results, render the curated grid from Task 13.

### Task 15: Page polish (no auth at MVP)

- Page title: "Icons — yesid.dev admin" (set via `<svelte:head>`)
- Subtitle: "Curated icons we use across the site, plus Iconify search for adding new ones"
- Visible note: "Copy an iconify_id, then paste it into Data Studio: icons → new row → iconify_id field"
- No nav, no breadcrumbs at MVP — accessed by typing the URL or bookmark

Defer to follow-up (file as GH issue if needed): auth gate (admin-only access), POST "Add directly to icons collection" button (requires Directus token plumbing), search analytics, recent-picks list.

### Task 16: Manual smoke test + screenshot

- Start dev server (`bun run --filter web dev`)
- Navigate to `/admin/icons`
- Verify curated grid renders all icons
- Search "react" → verify `logos:react` appears and click-to-copy works
- Take screenshot for the PR description
- Browser console: zero warnings about Iconify resolution failures

## Phase 7 — Close (3 tasks)

### Task 17: Acceptance run

```bash
cd apps/web && bun run check 2>&1 | tail -10
cd apps/web && bun run test 2>&1 | tail -10
cd apps/cms && bun test 2>&1 | tail -10
```

### Task 18: File GH issues (per decisions.md § GH issues to file at close)

- Audit + standardize iconify_id namespaces (Q-OPEN-2 follow-up)
- **Source SVGs for 5 deferred icons** (alembic, dax, rest-api, ssis, ssrs) — research.md § P1 documents the deferral; current state is `<IconRenderer>` placeholder; once SVGs sourced, upload to `icons` folder + PATCH the icons rows to set `svg_override`. ~0.25 session
- (Removed) ~~Icon library admin page~~ — built in Phase 6
- (Removed) ~~Watch Simple Iconify Picker maintenance~~ — picker dropped per Q5 pivot
- (Optional, file only if needed) Polish for admin/icons page: auth gate, "Add to collection" button, etc.

### Task 19: Memory + plan + close

- Update `~/.claude/projects/.../memory/project_completed_slices.md`: add 18h-ii row (note pivot — picker attempted, in-stack solution shipped)
- Update `project_slice_18.md`: mark 18h-ii closed; if it's part of a unified slice flow, advance the next-up
- Update `docs/slices/slice-18/plan.md`: 18h-ii status flipped to ✅ closed (the row was added at start of this slice; flipping its status now)
- Push branch, open PR (mention pivot in description), merge

## Acceptance gates summary

- [ ] `icons` collection live in Directus; `sync:diff` clean
- [ ] `icons.iconify_id` is plain string field with placeholder + note (no Directus extension binding)
- [ ] ≥34 icon rows seeded (one per `tech_stack.icon`); ≥29/34 have `iconify_id` OR `svg_override` populated; the 5 deferred (alembic/dax/rest-api/ssis/ssrs) seeded with both null + notes; placeholder render verified
- [ ] `tech_stack.icon_id` is M2O FK to `icons.id`; old `tech_stack.icon` string field deleted; field stays as `icon_id` (NOT renamed per P4 — adapter maps `row.icon_id` → `item.icon` so the type still presents the field as `icon`)
- [ ] `directus.techStack.{all,byId}` returns nested icon record via `parsePort` guard
- [ ] `<IconRenderer>` renders both Iconify and svg_override paths; iconify_id format regex flagged at parse; unit tests pass
- [ ] `apps/web/src/routes/admin/icons/+page.svelte` ships; curated grid + Iconify search both work; manual smoke test passes
- [ ] `bun run check` 0 errors; apps/web vitest green; apps/cms tests green
- [ ] 1 GH issue filed (namespace audit); admin-page + extension-watch issues NOT filed (admin page built; picker dropped)
- [ ] Memory + plan + slice 18 plan.md (18h-ii row) all updated; D-AMEND-1 amendment landed in slice 18 plan.md
- [ ] PR merged (mentions pivot in body)
