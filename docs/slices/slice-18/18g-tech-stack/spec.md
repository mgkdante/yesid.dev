# Slice 18g — Tech Stack (data-only, Control Room dark)

> Sub-slice of [Slice 18 — Cloud content layer (Directus)](../plan.md). See whole-slice plan for context + dependency graph.

## Purpose

Migrate 34 tech-stack items from `apps/web/src/content/stack/*.md` to Directus collections, with a sharply reduced field set that drops the layer/domain/proficiency/connectsTo/scenarios bloat from the original Slice 10 "Control Room" data model. Ship the migration **data-only** — the consumer `/tech-stack` page goes blank for now (visualization area renders nothing) until a future slice designs the honeycomb dashboard described in § Future consumer.

This is the smallest sub-slice of Slice 18 (~0.5 session) because the heavy lifting (BlockRenderer, migrate-markdown-to-blocks, BlockEditorDoc types, parsePort patterns) all shipped in 18f.

## Scope

### In scope

- New collection `tech_stack` (parent, international fields)
- New collection `tech_stack_translations` (per-locale Block Editor body fields)
- Two M2M junctions: `tech_stack_services` + `tech_stack_projects`
- Permissions matrix: ai-editor + human-editor + Public read for published rows
- Migrate 34 markdown items to Directus (mono-locale `en` to start)
- Adapter port (`directus.techStack.all` + `byId` + minimal contract tests)
- `/tech-stack` route: keep page chrome (hero, meta, header, footer); blank the Control Room visualization area; hide stats counters that referenced layer/domain/scenarios

### Out of scope (deferred or dropped)

| Item | Disposition |
|---|---|
| `layer` field (presentation/business/analytics/data) | DROPPED |
| `domains` field (data-engineering/web-platform tags) | DROPPED |
| `proficiency` field (expert/proficient/familiar) | DROPPED |
| `connectsTo` field (self-M2M graph) | DROPPED |
| `connectionNotes` field | DROPPED |
| `tech_relations` collection | DROPPED |
| `stack_scenarios` collection | DROPPED |
| Body section "What it is" | KEPT (was first up for cut, restored — see decisions Q3) |
| Honeycomb dashboard consumer redesign | DEFERRED — see § Future consumer |
| FR/ES translations on body | DEFERRED — Directus fields support it; populate via Data Studio when needed |
| Static `apps/web/src/content/stack/*.md` deletion | DEFERRED to 18k cleanup pass |

## Schema

### `tech_stack` (parent)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | kebab-slug, e.g. `airflow`, `postgresql` |
| `name` | string, required | International (no translation needed — tech names are universal). E.g. "Apache Airflow" |
| `icon` | string, optional | Icon identifier (matches existing icon name in `apps/web/src/lib/components/brand/`) |
| `status` | enum (`draft`/`published`/`archived`) | Standard 18c global-draft pattern |
| `sort` | int, default 0 | Manual ordering |
| `translations` | alias (M2O via translations) | Standard 18c i18n pattern |

### `tech_stack_translations` (Per-locale Block Editor body)

| Field | Type | Notes |
|---|---|---|
| `id` | int PK | Auto |
| `tech_stack_id` | string FK → tech_stack.id | M2O |
| `languages_code` | enum FK → languages | en/fr/es |
| `what_it_is` | Block Editor (json) | Factual description of the tech |
| `what_i_use_it_for` | Block Editor (json) | Concrete usage / case study (replaces "In Practice" section) |
| `why_i_use_it_instead` | Block Editor (json) | Comparison angle vs. alternatives (replaces "Why I use it" section) |

### Junctions

#### `tech_stack_services`

| Field | Type |
|---|---|
| `id` | int PK auto |
| `tech_stack_id` | string FK → tech_stack.id |
| `services_id` | string FK → services.id |

#### `tech_stack_projects`

| Field | Type |
|---|---|
| `id` | int PK auto |
| `tech_stack_id` | string FK → tech_stack.id |
| `projects_id` | string FK → projects.id |

## Migration mapping

For each `apps/web/src/content/stack/<slug>.md`:

| Source | → | Destination |
|---|---|---|
| frontmatter `id` | → | `tech_stack.id` |
| frontmatter `name` | → | `tech_stack.name` |
| frontmatter `icon` | → | `tech_stack.icon` |
| frontmatter `relatedServices: [...]` | → | `tech_stack_services` rows (one per service) |
| frontmatter `relatedProjects: [...]` | → | `tech_stack_projects` rows (one per project) |
| markdown body section `## What it is` | → | translation row `what_it_is` (Block Editor — via `migrate-markdown-to-blocks.ts` from 18f) |
| markdown body section `## In Practice` | → | translation row `what_i_use_it_for` |
| markdown body section `## Why I use it` | → | translation row `why_i_use_it_instead` |
| frontmatter `layer`, `domains`, `connectsTo`, `proficiency`, `connectionNotes` | → | DROPPED |

All 34 items seeded with `status: 'published'` and `lang: 'en'` translation row only. FR/ES added later via Data Studio.

## Consumer wiring

`/tech-stack` route — minimum-viable change:
- Hero + meta + page chrome unchanged (it's branded copy that survives)
- Stats counters (`{itemCount} technologies across {layerCount} layers, {domainCount} domains`) — drop the layer + domain counts; keep just `{itemCount} technologies` or hide stats entirely
- Visualization area (the Control Room grid) — render nothing (replace with empty `<div>` or hide section)
- Footer CTA — keep ("Found your stack? Let's build it")

Adapter has `directus.techStack.all` + `byId` available. No consumer rendering of the data yet — the data is in Directus, ready for future consumption.

Static `apps/web/src/content/stack/*.md` files stay in the repo for now (avoids cascading deletes during 18g; cleanup lands in 18k).

## Future consumer (breadcrumb for whoever picks up the redesign)

User vision (captured 2026-04-27):

> "Honeycomb stack dashboard presentation on desktop with click and dialog box with the extra info, and on mobile perhaps cards you can scroll and tap for a dialog/sheet to also open with extra info. In any case the schema is the same!"

Translation:

- **Desktop**: tessellated honeycomb grid of cells, one per tech. Each cell shows the icon + name. Click → dialog modal renders the 3 Block Editor body fields (`what_it_is`, `what_i_use_it_for`, `why_i_use_it_instead`) + "Used in" service + project chips.
- **Mobile**: vertical scrollable card list (one card per tech). Tap → bottom sheet (or full-screen dialog) with same body fields + chip lists.

Schema confirmed sufficient for this vision: cell content (`name`, `icon`) + dialog content (3 Block Editor fields + 2 M2M chip arrays) all map cleanly.

The redesign is not scoped here. File a GH issue at 18g close: "Redesign /tech-stack as honeycomb dashboard with click-to-dialog (desktop) + scrollable cards with sheet (mobile). Reuse `<BlockRenderer>` for body fields. ~1-1.5 sessions."

## Acceptance gates

1. Schema live: `tech_stack` + `tech_stack_translations` + `tech_stack_services` + `tech_stack_projects` collections in Directus, sync:diff clean
2. Migration: all 34 items + their translations seeded; M2M counts match (services + projects FK references resolve to existing rows)
3. Permissions: ai-editor + human-editor + Public matrix correct (mirror blog_posts permissions shape from 18f)
4. Adapter: `directus.techStack.all()` + `byId(slug)` work via live Public reads, parsePort guards in place
5. Consumer: `/tech-stack` returns 200, hero renders, no broken refs to layer/domain/scenarios
6. Tests: apps/cms test suite green; apps/web `bun run check` 0 errors; apps/web `bun run test` no regressions
7. GH issue filed for honeycomb consumer redesign (see § Future consumer)

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| 34 markdown bodies have inconsistent section headings (not all use exactly "What it is" / "Why I use it" / "In Practice") | Migration script logs items where any of the 3 sections is empty + flags for manual review post-seed |
| `relatedServices` / `relatedProjects` references in frontmatter point to slugs that don't exist in current services/projects collections | Migration script validates FK references, fails fast on missing referent, logs slug list for cleanup |
| The existing `/tech-stack` route uses `getAllTechItems()` etc. from `apps/web/src/lib/content/tech-stack.ts` — blanking the route requires updating consumers without breaking other callers | Inspect static path consumers before stripping; static helpers can stay (they just return empty data) until 18k deletes them |
| Block Editor migration script (from 18f) might map markdown sections with whitespace or H3-instead-of-H2 headings incorrectly | Add unit test fixture covering 3-4 representative tech-stack markdown bodies before running live seed |

## Effort

~0.5 session. Migration script reused from 18f (just point at new directory + new field mapping). Consumer change is mostly deletions.
