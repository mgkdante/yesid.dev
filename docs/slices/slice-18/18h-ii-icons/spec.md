# Slice 18h-ii — Icons (centralized icon collection)

> Sub-slice of [Slice 18 — Cloud content layer (Directus)](../plan.md). Parallel to 18h (Meta + route_seo). See whole-slice plan for context + dependency graph.

## Purpose

Stand up a single CMS-managed icon library that any content type can reference. Replaces the per-collection ad-hoc pattern (`tech_stack.icon` as bare string) with an M2O FK to a curated `icons` collection. Future surfaces (services, blog, pages) adopt the same pattern — one editor experience, one source of truth.

Each icon entry can resolve to:
- An [Iconify](https://icon-sets.iconify.design/) reference (preferred — 200K+ icons, no asset storage)
- An uploaded SVG file (override — for cases where a custom mark is needed)

The renderer prefers `svg_override` when present, falls back to `iconify_id`.

## Scope

### In scope

- New `icons` collection (parent — flat, kebab-slug PK)
- Permissions matrix: ai-editor + human-editor + Public read
- Migrate `tech_stack.icon` from string field → M2O FK to `icons.id`
- Generalize `TechIcon.svelte` (shipped in PR #68) → `IconRenderer.svelte` consuming an icon record
- Seed icons collection with one row per unique icon string in current 34 `tech_stack` items (after audit + Iconify mapping per P1)
- **Editor UX surfaces** (per Q5 pivot — no Directus extension, in-stack solution):
  - Built-in M2O picker on `tech_stack.icon → icons` provides typeahead by `icons.name` (the surface editors use 95% of the time)
  - `icons.iconify_id` is a plain string field with placeholder + note pointing to `icon-sets.iconify.design` (the rare new-icon flow)
  - New `apps/web/src/routes/admin/icons/+page.svelte` — Svelte 5 browse page that shows the curated icons collection grid + Iconify search → click-to-copy iconify_id (visual discovery surface; replaces Q-OPEN-3 from earlier draft)

### Out of scope (deferred or dropped)

| Item | Disposition |
|---|---|
| Consolidate `morph_shapes` + `illustrations` collections into `icons` | DEFERRED — different schemas + use cases. Re-evaluate if/when their consumers converge. |
| `services.icon` / `blog_posts.icon` / `pages.icon` adoption | NOT THIS SLICE — pattern shipped here; new collections adopt as they're touched (18h, 18i, etc.) |
| Per-locale icon variants | DROPPED — icons are visual identifiers; localization not meaningful |
| Icon usage analytics ("which icons are most-referenced") | DROPPED — over-engineering for current scale |

## Schema

### `icons` (parent)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | kebab-slug — `airflow`, `postgresql`, `python`, `brand-monogram` |
| `name` | string, required | display name in admin — "Apache Airflow", "PostgreSQL", "Python" |
| `iconify_id` | string, optional | full Iconify reference — `logos:apache-airflow`, `skill-icons:python`. Required UNLESS `svg_override` is set (validated at adapter or seed level — Directus alone can't enforce "one of two") |
| `svg_override` | M2O → `directus_files`, optional | uploaded SVG that takes precedence over `iconify_id` (e.g. for brand marks where Iconify doesn't have an exact match) |
| `category` | tags | filtering — `tech-stack`, `service`, `brand`, `generic`. Free-form |
| `notes` | text, optional | admin-only context — "Use for tooling X", "Override of logos:react because brand orange tint" |
| `status` | enum | standard 18c global-draft pattern (`draft` / `published` / `archived`) |
| `sort` | int, default 0 | manual ordering |

### Renderer resolution rules

```
function resolveIcon(icon: IconRecord): { kind: 'svg'; id: string } | { kind: 'iconify'; id: string } | null {
  if (icon.svg_override) return { kind: 'svg', id: icon.svg_override };  // Directus file UUID
  if (icon.iconify_id) return { kind: 'iconify', id: icon.iconify_id };  // logos:xyz
  return null;  // editorial gap; renderer shows placeholder
}
```

## Migration mapping (tech_stack.icon)

Current state: `tech_stack.icon` is a string (kebab-slug — `airflow`, `postgresql`, etc.). PR #68 added `<TechIcon name={item.icon} />` that resolves to `logos:{item.icon}` via Iconify.

After 18h-ii: `tech_stack.icon` is an M2O FK to `icons.id`. The icon's `iconify_id` field holds the full reference (e.g., `logos:apache-airflow` — note that `apache-airflow` is the actual Iconify slug, NOT the bare `airflow` we currently store).

Migration steps (Phase 3):

1. Add new field `icon_id` (M2O → icons.id, optional) on `tech_stack`
2. Run backfill script: for each `tech_stack` row, find or create the matching `icons` row + set `icon_id`
3. Drop the legacy `icon` string field on `tech_stack`
4. Rename `icon_id` → `icon` for ergonomic API URLs

## Consumer wiring

- `<TechIcon>` (PR #68) generalizes to `<IconRenderer icon={iconRecord} />`:
  - prop is the full icon record (from `tech_stack.icon` nested expansion), not a bare string
  - branches on `svg_override` first, falls back to `iconify_id`, else placeholder
- Adapter `directus.techStack.{all,byId}` adds nested `icon` expansion in field selection: `{ icon: ['id', 'iconify_id', 'svg_override'] }`
- Static fallback `getAllTechItems()` returns icon records too (or `null` when degraded post-18k cleanup)

## Future consumer (breadcrumb)

Once 18h-ii closes, `services.icon` / `blog_posts.icon` / `pages.icon` (18i) all use the same M2O FK pattern. Editors pick from one curated dropdown; the renderer is one component.

When we eventually re-evaluate `morph_shapes` + `illustrations`, the question becomes: does that asset library converge with `icons`? At ~50 entries each, YES likely worth merging into a unified `assets` or `svg_library` collection. At <20 entries, probably not worth the migration cost.

## Acceptance gates

1. `icons` collection live in Directus; `sync:diff` clean
2. `icons.iconify_id` is a plain string field with `meta.options.placeholder` + `meta.options.note` (no Directus extension binding — built-in input interface)
3. Permissions matrix: ai-editor + human-editor + Public read for published rows
4. Icons collection seeded with ≥34 entries (one per current `tech_stack.icon` string); ≥29/34 rows have `iconify_id` OR `svg_override` populated; the 5 deferred (`alembic`, `dax`, `rest-api`, `ssis`, `ssrs`) are seeded with both null + a `notes` value documenting the deferral, and render via `<IconRenderer>` placeholder (per research.md § P1 editorial decisions). SVG sourcing for the 5 is filed as a close-of-slice GH issue
5. `tech_stack.icon` is now an M2O FK to `icons.id`; old string field deleted; new field stays as `icon_id` (NOT renamed — per P4 finding: directus-sync rename = drop+create cycle, unsafe; adapter layer presents "icon" in UI regardless of field key)
6. `directus.techStack.all()` adapter reads nested `icon` shape via `parsePort` guard
7. `<IconRenderer icon={item.icon} />` renders correctly for both Iconify and svg_override paths (unit tests)
8. `apps/web/src/routes/admin/icons/+page.svelte` ships; renders curated icons grid (read from `/items/icons`) + Iconify search input + click-to-copy iconify_id; manual smoke test passes
9. `bun run check` 0 errors; apps/web vitest green; apps/cms test suite green
10. 1 GH issue filed (namespace audit per decisions.md Q-OPEN-2; admin page + extension watch are no longer applicable)
11. Memory + plan updated; PR open

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Iconify CDN unreachable at runtime → broken icons | `<IconRenderer>` falls back to placeholder + console warns; consumers don't break |
| `iconify_id` value (e.g. `logos:apache-airflow`) doesn't match Iconify reality post-render | Phase 1 P1 audit verifies all 34 mapped IDs against `icon-sets.iconify.design` before seeding. Adapter-level regex validation flags malformed IDs at parse time. Editors browse via `apps/web/admin/icons` (always shows current Iconify catalog) so new entries also start from a real icon |
| Migration breaks existing `tech_stack.icon` consumers mid-flight | Stage migration: add `icon_id` first, backfill, verify, THEN drop old field. Single-commit drop after verification |

## Effort

~0.5–1 session. Schema + permissions trivial; the backfill script + adapter rewire is the bulk; renderer generalization is small.
