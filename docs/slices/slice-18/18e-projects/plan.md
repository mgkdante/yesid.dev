# Slice 18e — Projects · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `apps/web/src/lib/content/projects.ts` static content module to Directus 11 (cms.yesid.dev) — first canonical content-type migration after foundations + asset pipeline. Replace `services.related_projects` CSV with M2M junction `projects_services`. Establish the reference pattern that 18f (blog), 18g (tech-stack), 18h (meta) replay.

**Architecture:** 7 new collections (`projects` + `projects_translations` + `projects_sections` + `projects_sections_translations` + `projects_impact_metrics` + `projects_impact_metrics_translations` + `projects_services` junction). Plain textarea for `description` + `sections.content` (Block Editor deferred to post-18f follow-on). 3-value `status` enum (`draft|published|archived`); archive_field=status. Slug as Directus PK (mirrors services). M2O `hero_image` resolved at seed time via `assetIdFor()` from `@repo/shared`. O2M `projects_impact_metrics` with own translations sub-junction; adapter computes `impactMetric = impactMetrics[0]`. Two directus-sync pushes (phased CSV drop, zero-downtime on `/services/[slug]`).

**Tech Stack:** Directus 11.17.3 · directus-sync · `@directus/sdk@^20` · Zod · Bun 1.3 runtime · vitest · `@repo/shared` (types + Zod + assetIdFor) · SvelteKit 2 + Svelte 5 (consumer) · Cloudflare R2 (asset storage) · Neon Postgres (PITR).

**Spec:** [docs/slices/slice-18/18e-projects/spec.md](spec.md)

**Inherits:** all 18c lib helpers (`apps/cms/scripts/lib/{sdk,auth,logger,catch-error,bottleneck,read-fixture,loaders}.ts`) · 18c web foundations (`createQueuedFetch` · `parsePort` · `PreviewContext` · WeakMap memo · `asset()` helper) · 18d asset pipeline (`assetIdFor()` + `directus_files` Public folder-scope read).

---

## Phase 1 — Sub-slice setup + cascade-filter probe (3 tasks)

**Exit gate:** sub-slice bundle exists at `docs/slices/slice-18/18e-projects/`; whole-slice plan.md flagged 18e in flight; cascade FK filter syntax confirmed against live Directus.

### Task 1: Sub-slice bundle skeleton

**Files:**
- Create: `docs/slices/slice-18/18e-projects/research.md`
- Create: `docs/slices/slice-18/18e-projects/decisions.md`

- [ ] **Step 1: Create research.md skeleton**

```markdown
# 18e — Research

> Probe findings + live-state observations during execution. Populated as work progresses; finalized at close.

## P-cascade — Directus 11 cascade FK filter syntax

**Status:** TBD — Phase 1 Task 3.

**Question:** Does Directus 11 permission filter syntax support FK traversal in `read` filters (e.g., `projects_id.status _eq "published"` on a junction collection)?

**Method:** TBD.

**Result:** TBD.

**Decision:** TBD.

---

## Open follow-ups

(Empty — populate as work progresses.)
```

- [ ] **Step 2: Create decisions.md skeleton**

```markdown
# 18e — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| Q1 | Plain textarea throughout 18e for `description` + `sections.content` | Brainstorm 2026-04-24 | locked |
| Q2 | 3-value status `draft \| published \| archived`; archive_field=status | Brainstorm 2026-04-24 | locked |
| Q3 | Two directus-sync pushes, phased CSV drop | Brainstorm 2026-04-24 | locked |
| Q4 | `assetIdFor()` at seed time for hero_image | Brainstorm 2026-04-24 | locked |
| Q5 | Slug as Directus `id` (kebab-case PK) | Brainstorm 2026-04-24 | locked |
| Q6 | O2M `projects_impact_metrics` + own translations sub-junction; adapter computes `impactMetric = impactMetrics[0]` | Brainstorm 2026-04-24 | locked |
| Q7 | Skip `scaffold-port.ts`; hand-write using services as reference | Brainstorm 2026-04-24 | locked |

## Amendments

(Empty — populate during execution as live findings supersede plan assumptions.)
```

- [ ] **Step 3: Commit (includes pre-existing spec.md + plan.md from brainstorm/writing-plans)**

```bash
# spec.md and plan.md already exist from the brainstorming + writing-plans sessions
# this commit captures the full sub-slice bundle: spec + plan + research skeleton + decisions skeleton
git add docs/slices/slice-18/18e-projects/
git commit -m "docs(slice-18 18e): sub-slice bundle (spec + plan + research + decisions)"
```

---

### Task 2: Flag 18e in flight in whole-slice plan.md

**Files:**
- Modify: `docs/slices/slice-18/plan.md` (status table row + § 18e section)

- [ ] **Step 1: Update status table row for 18e**

Find:
```markdown
| **18e** | Projects (+ M2M to services replacing CSV) | ⏸ planned | 1–1.5 sessions | — |
```

Replace with:
```markdown
| **18e** | Projects (+ M2M to services replacing CSV) | 🟡 in flight | 1–1.5 sessions | [18e-projects/](18e-projects/) |
```

- [ ] **Step 2: Update § 18e section to point at sub-slice plan**

Find the existing § "## 18e — Projects (⏸ planned)" section and replace with:
```markdown
## 18e — Projects (🟡 in flight)

**Scope:** First canonical content-type migration (reference for 18f, 18g, 18h).

**Schema:** `projects` (id · status · date_published · sort · featured · hero_image M2O · repo_url · live_url · readme_url · location · environment · version · stack · tags) + `projects_translations` (languages_code · title · one_liner · description) + `projects_sections` + translations + `projects_impact_metrics` + translations + `projects_services` M2M junction (replaces services.related_projects CSV).

**Artifacts:** spec at [18e-projects/spec.md](18e-projects/spec.md) · plan at [18e-projects/plan.md](18e-projects/plan.md) · fixture at `apps/cms/fixtures/collections/projects.json` · seed at `apps/cms/scripts/seed-projects.ts` · adapter port in `apps/web/src/lib/adapters/directus.ts` · 4 test boundaries · one-line hybrid flip in `apps/web/src/lib/adapters/index.ts`.

**Acceptance:** `/projects` + `/projects/[slug]` from Directus; `/services/[slug]` related-projects strip via M2M; all 4 test boundaries green; `services.related_projects` field DROPPED.
```

- [ ] **Step 3: Commit**

```bash
git add docs/slices/slice-18/plan.md
git commit -m "docs(slice-18 18e): flag in flight + link sub-slice bundle"
```

---

### Task 3: Cascade FK filter probe

**Goal:** confirm Directus 11 permission filter syntax accepts FK traversal (`<fk_field>.<remote_field> _eq <value>`) before authoring Public policy rows that depend on it.

**Files:**
- Modify: `docs/slices/slice-18/18e-projects/research.md` (fill in P-cascade findings)

- [ ] **Step 1: Auth env**

```bash
export DIRECTUS_ADMIN_TOKEN=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export DIRECTUS_ADMIN_EMAIL='mgkdante@gmail.com'
export DIRECTUS_ADMIN_PASSWORD=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export PUBLIC_DIRECTUS_URL='https://cms.yesid.dev'
```

- [ ] **Step 2: Probe via SDK against an existing junction**

Use `services_translations.services_id.visible _eq true` as a proxy probe (services + services_translations exist live):

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "$PUBLIC_DIRECTUS_URL/items/services_translations?fields=id,services_id&filter[services_id][visible][_eq]=true&limit=3" \
  | head -50
```

Expected: HTTP 200 + array of rows (proves FK traversal in filter syntax). If HTTP 4xx with parsing error, syntax is unsupported.

- [ ] **Step 3: Document finding in research.md**

Replace the P-cascade section:
```markdown
## P-cascade — Directus 11 cascade FK filter syntax

**Status:** Resolved — Phase 1 Task 3 (DATE).

**Method:** Probe `/items/services_translations` with `filter[services_id][visible][_eq]=true`.

**Result:** [PASTE: HTTP status + 1-line summary of returned shape].

**Decision:** [PASTE: PASS — Public policy can use cascade filters · OR · FAIL — fall back to non-cascading filters with explicit per-row policies].
```

- [ ] **Step 4: Commit**

```bash
git add docs/slices/slice-18/18e-projects/research.md
git commit -m "docs(slice-18 18e): cascade FK filter probe finding"
```

---

## Phase 2 — Schema design + directus-sync pull (5 tasks)

**Exit gate:** all 7 collections (parent + 4 sub + 1 junction + projects_services) designed in Data Studio; directus-sync pull captures definitions into `apps/cms/directus/`; full 18-item checklist (CONVENTIONS § 2) passes for `projects` parent.

### Task 4: Design `projects` parent collection in Data Studio

**Files:**
- (No git changes yet — schema authoring in Data Studio UI; pull happens in Task 9.)

- [ ] **Step 1: Open Data Studio**

`https://cms.yesid.dev` → Settings → Data Model → Create Collection.

- [ ] **Step 2: Configure collection**

Name: `projects`
Primary Key Type: **Manual String Entry** (matches services PK pattern; slug as id).
Status field: enable (Directus auto-creates a `status` field).

- [ ] **Step 3: Configure fields**

Add the following fields per [spec § 2.1](spec.md#21-projects-parent-collection):
- `id` (string PK) — interface: Input
- `status` (dropdown) — values: `{label: 'Draft', value: 'draft'}`, `{label: 'Published', value: 'published'}`, `{label: 'Archived', value: 'archived'}`. Default: `draft`. Required: true.
- `date_published` (datetime) — nullable
- `sort` (integer) — interface: Input (hidden); default 0
- `featured` (boolean) — default false
- `hero_image` (M2O → directus_files) — nullable
- `repo_url`, `live_url`, `readme_url` (string) — nullable. Interface: Input.
- `location`, `environment`, `version` (string) — nullable. Interface: Input.
- `stack` (JSON) — interface: Tags
- `tags` (JSON) — interface: Tags

- [ ] **Step 4: Configure 18-item checklist meta** (CONVENTIONS § 2)

Settings → Data Model → projects → Configure:
- `display_template`: `{{translations.title}}`
- `icon`: `folder_special`
- `note`: `Portfolio projects with translated content (title, one-liner, description), sections, impact metrics, and M2M relations to services. AI-editor: cannot publish; cannot delete.`
- `sort_field`: `sort`
- `archive_field`: `status` · `archive_value`: `archived` · `unarchive_value`: `draft`
- `item_duplication_fields`: `["id","featured","sort","stack","tags","translations","sections","impact_metrics","services"]`
- `preview_url`: `https://yesid.dev/projects/{{id}}?share={{$CURRENT_SHARE.token}}`
- `versioning`: enable (toggle ON)
- `accountability`: `all`

- [ ] **Step 5: Commit**

(No git changes — schema lives in Directus until Task 9 pulls it.)

---

### Task 5: Design `projects_translations` + the Translations interface on `projects`

- [ ] **Step 1: Add Translations interface to `projects`**

In Data Studio, on `projects`: Add field → Translations → name: `translations`.

This auto-creates `projects_translations` junction with `id`, `projects_id`, `languages_code` columns.

- [ ] **Step 2: Add fields to `projects_translations`**

- `title` (string, required, ≤100 chars) — interface: Input
- `one_liner` (text, ≤500 chars) — interface: Textarea
- `description` (text, ≤2000 chars) — interface: Textarea (NOT Block Editor per Q1)

Make `title` required.

- [ ] **Step 3: Configure 18-item checklist meta** for `projects_translations`

- `note`: `Localized fields for projects (title, one_liner, description). One row per languages_code per project.`
- `accountability`: `all`

- [ ] **Step 4: Commit**

(No git changes yet.)

---

### Task 6: Design 4 sub-collections (sections + impact_metrics + their translations)

- [ ] **Step 1: Add `projects_sections` O2M from `projects`**

On `projects`, add field → One-to-Many → name: `sections`. Target: `projects_sections`.

Auto-created columns: `id` (auto), `projects_id` (FK), `sort` (integer; mark sortable).

Add Translations interface on `projects_sections`: name `translations` → creates `projects_sections_translations` with `projects_sections_id`, `languages_code`.

Add fields to `projects_sections_translations`:
- `title` (string, required) — interface: Input
- `content` (text, ≤5000 chars) — interface: Textarea (NOT Block Editor per Q1)

Meta on `projects_sections`: `sort_field: sort` · `accountability: all`.

- [ ] **Step 2: Add `projects_impact_metrics` O2M from `projects`**

On `projects`, add field → One-to-Many → name: `impact_metrics`. Target: `projects_impact_metrics`.

Auto-created: `id`, `projects_id`, `sort`.

Add fields to `projects_impact_metrics`:
- `value` (string, required) — interface: Input
- `before` (string, nullable) — interface: Input

Add Translations interface on `projects_impact_metrics`: creates `projects_impact_metrics_translations` with `projects_impact_metrics_id`, `languages_code`.

Add fields to `projects_impact_metrics_translations`:
- `label` (string, required) — interface: Input

Meta on `projects_impact_metrics`: `sort_field: sort` · `accountability: all`.

- [ ] **Step 3: Commit**

(No git changes yet.)

---

### Task 7: Design `projects_services` M2M junction

- [ ] **Step 1: Add M2M from `projects` to `services`**

On `projects`, add field → Many-to-Many → name: `services`. Target: `services` (existing collection).

Junction: `projects_services` (auto-created). Junction columns: `id`, `project_id` (FK to projects), `service_id` (FK to services).

Configure interface: List view with display template `{{service_id.translations.title}}`.

- [ ] **Step 2: Verify reverse alias on services side is NOT created**

Per Q5 + spec § 6b: services adapter reads `relatedProjects` via direct junction lookup, not via a reverse alias on `services`. Do NOT add a reverse Many-to-Many alias on `services` — that would create unnecessary indirection.

- [ ] **Step 3: Commit**

(No git changes yet.)

---

### Task 8: Verify 18-item checklist on all 7 collections

**Files:**
- (Verification only — no file changes.)

- [ ] **Step 1: For each of `projects`, `projects_translations`, `projects_sections`, `projects_sections_translations`, `projects_impact_metrics`, `projects_impact_metrics_translations`, `projects_services` — verify:**

1. `display_template` set (no raw IDs in list views)
2. `icon` set
3. `note` set
4. `sort_field` set (where applicable: parent + sub-collections with sort)
5. `archive_field/value/unarchive_value` set on `projects` only (sub-collections inherit FK CASCADE)
6. `item_duplication_fields` set on `projects`
7. `preview_url` template set on `projects`
8. `versioning: true` on `projects` (Global Draft per D5)
9. `accountability: all` on every user collection
10. Translations junction created where applicable (on parent + sections + impact_metrics)
11. Field grouping (Tabs interface) used if `projects` exceeds 6 fields in form view
12. Field widths configured (half/full pairs)
13. `note` on every business field
14. `required: true` on publish-required fields (title, value, label)
15. `meta.conditions` for contextual visibility (e.g., `version` field visible only if `status != draft`)
16. `directus/presets.json` entry — defer to Task 9 post-pull
17. `directus/permissions.json` ai-editor row — Phase 3
18. `directus/permissions.json` comments row — Phase 3

- [ ] **Step 2: Commit**

(No changes yet.)

---

### Task 9: Run `directus-sync pull` to capture schema

**Files:**
- Create: `apps/cms/directus/collections/projects.json`
- Create: `apps/cms/directus/collections/projects_translations.json`
- Create: `apps/cms/directus/collections/projects_sections.json`
- Create: `apps/cms/directus/collections/projects_sections_translations.json`
- Create: `apps/cms/directus/collections/projects_impact_metrics.json`
- Create: `apps/cms/directus/collections/projects_impact_metrics_translations.json`
- Create: `apps/cms/directus/collections/projects_services.json`
- Create: `apps/cms/directus/fields/projects/*.json` (one per field)
- Create: `apps/cms/directus/fields/projects_translations/*.json`
- Create: `apps/cms/directus/fields/projects_sections/*.json`
- Create: `apps/cms/directus/fields/projects_sections_translations/*.json`
- Create: `apps/cms/directus/fields/projects_impact_metrics/*.json`
- Create: `apps/cms/directus/fields/projects_impact_metrics_translations/*.json`
- Create: `apps/cms/directus/fields/projects_services/*.json`
- Create: `apps/cms/directus/relations/*.json` (FK relations for the 7 collections)

- [ ] **Step 1: Run pull**

```bash
cd apps/cms
DIRECTUS_URL="$PUBLIC_DIRECTUS_URL" \
DIRECTUS_TOKEN="$DIRECTUS_ADMIN_TOKEN" \
bun run sync:pull
```

Expected: directus-sync writes JSON files into `apps/cms/directus/{collections,fields,relations}/`.

- [ ] **Step 2: Inspect new files**

```bash
git status apps/cms/directus/
```

Expected: 7 new collection files, ~25 new field files, ~10 new relation files.

- [ ] **Step 3: Verify shape against spec § 2**

Spot-check `apps/cms/directus/collections/projects.json` matches the meta from Task 4 Step 4. Verify `_syncId` values are present (directus-sync auto-generates).

- [ ] **Step 4: Run sync diff**

```bash
bun run sync:diff
```

Expected: empty diff (everything in code matches Directus state).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/directus/
git commit -m "feat(slice-18 18e Phase 2 Task 9): schema pull — 7 projects-family collections"
```

---

## Phase 3 — Permissions (3 tasks)

**Exit gate:** ~18 permission rows added (`ai-editor` + `human-editor` + `Public`) covering all 7 projects-family collections + comments scoping; `directus-sync push` applies cleanly; curl probe verifies anon read filtered by `status=published`.

### Task 10: Splice ai-editor + human-editor permission rows

**Files:**
- Modify: `apps/cms/directus/collections/permissions.json`

- [ ] **Step 1: Locate permissions.json**

```bash
ls apps/cms/directus/collections/permissions.json
```

- [ ] **Step 2: Add 7 ai-editor rows (read+create+update; delete: false; publish-block filter on parent)**

Per CONVENTIONS § 2 item 17 — splice into permissions.json:

```jsonc
// 7 collections × 3 actions = 21 rows minus delete/4-row-shorthand simplification
// Each follows this shape for ai-editor:
{
  "collection": "projects",
  "action": "read",
  "permissions": {},
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_ai_editor_policy",
  "_syncId": "ae-projects-read-0001"
},
{
  "collection": "projects",
  "action": "create",
  "permissions": {},
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_ai_editor_policy",
  "_syncId": "ae-projects-create-0002"
},
{
  "collection": "projects",
  "action": "update",
  "permissions": { "status": { "_neq": "published" } },  // publish-block filter
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_ai_editor_policy",
  "_syncId": "ae-projects-update-0003"
},
// Repeat for: projects_translations, projects_sections, projects_sections_translations,
// projects_impact_metrics, projects_impact_metrics_translations, projects_services
// (sub-collections don't need publish-block filter — FK CASCADE through projects.status handles parent)
```

Repeat the 3-row pattern for the other 6 collections. Total: 21 ai-editor rows.

- [ ] **Step 3: Add 1 ai-editor comments row**

```jsonc
{
  "collection": "directus_comments",
  "action": "read",
  "permissions": { "collection": { "_starts_with": "projects" } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_ai_editor_policy",
  "_syncId": "ae-comments-projects-read-0022"
},
{
  "collection": "directus_comments",
  "action": "create",
  "permissions": { "collection": { "_starts_with": "projects" } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_ai_editor_policy",
  "_syncId": "ae-comments-projects-create-0023"
}
```

- [ ] **Step 4: Add 7 human-editor rows (read+create+update+delete; no filter)**

Repeat the pattern with `policy: "_sync_human_editor_policy"`, no permissions filter, all 4 actions. Total: 28 human-editor rows.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/directus/collections/permissions.json
git commit -m "feat(slice-18 18e Phase 3 Task 10): ai-editor + human-editor permissions for projects family"
```

---

### Task 11: Splice Public policy rows with cascade FK filters

**Files:**
- Modify: `apps/cms/directus/collections/permissions.json`

- [ ] **Step 1: Add 7 Public read rows**

Per spec § 3 + Task 3 cascade-filter probe outcome:

```jsonc
{
  "collection": "projects",
  "action": "read",
  "permissions": { "status": { "_eq": "published" } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-read-0030"
},
{
  "collection": "projects_translations",
  "action": "read",
  "permissions": { "projects_id": { "status": { "_eq": "published" } } },  // cascade FK filter
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-translations-read-0031"
},
{
  "collection": "projects_sections",
  "action": "read",
  "permissions": { "projects_id": { "status": { "_eq": "published" } } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-sections-read-0032"
},
{
  "collection": "projects_sections_translations",
  "action": "read",
  "permissions": { "projects_sections_id": { "projects_id": { "status": { "_eq": "published" } } } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-sections-translations-read-0033"
},
{
  "collection": "projects_impact_metrics",
  "action": "read",
  "permissions": { "projects_id": { "status": { "_eq": "published" } } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-impact-metrics-read-0034"
},
{
  "collection": "projects_impact_metrics_translations",
  "action": "read",
  "permissions": { "projects_impact_metrics_id": { "projects_id": { "status": { "_eq": "published" } } } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-impact-metrics-translations-read-0035"
},
{
  "collection": "projects_services",
  "action": "read",
  "permissions": { "project_id": { "status": { "_eq": "published" } } },
  "validation": null,
  "presets": null,
  "fields": ["*"],
  "policy": "_sync_public_policy",
  "_syncId": "public-projects-services-read-0036"
}
```

- [ ] **Step 2: If Task 3 cascade probe FAILED** (fallback)

Replace cascade filters with non-cascading filters that mirror parent state via Flow-managed denorm column (out of 18e scope; surface as a blocker in `decisions.md` amendment + escalate before continuing).

- [ ] **Step 3: Commit**

```bash
git add apps/cms/directus/collections/permissions.json
git commit -m "feat(slice-18 18e Phase 3 Task 11): public policy with cascade FK filters"
```

---

### Task 12: Push permissions + curl-verify Public read

**Files:**
- (Verification only — pushes via directus-sync)

- [ ] **Step 1: Run sync push**

```bash
cd apps/cms
bun run sync:push
```

Expected: directus-sync applies new permission rows. Diff goes empty.

- [ ] **Step 2: Curl-verify ai-editor publish-block on `projects`**

(Skip if no projects exist yet — re-verify after seed in Phase 6.)

- [ ] **Step 3: Curl-verify cascade filter on `projects_translations`**

```bash
# Anon read of an unpopulated table — expects empty array.
curl -s "$PUBLIC_DIRECTUS_URL/items/projects_translations?fields=id&limit=1" | head -10
```

Expected: `{"data":[]}` (no rows yet — but no permission errors).

- [ ] **Step 4: Run sync diff**

```bash
bun run sync:diff
```

Expected: empty diff.

- [ ] **Step 5: Commit**

(No file changes if Step 1 ran cleanly.)

---

## Phase 4 — Fixture authoring + Zod schema (4 tasks)

**Exit gate:** `apps/cms/fixtures/collections/projects.json` written + Zod-valid (`fixture-projects.test.ts` green); cross-references to services + assets-id-map verified.

### Task 13: Author fixture JSON from static module

**Files:**
- Create: `apps/cms/fixtures/collections/projects.json`

- [ ] **Step 1: Read source data**

Open `apps/web/src/lib/content/projects.ts` to extract all 6 projects' data.

- [ ] **Step 2: Write fixture**

Translate each `Project` to a fixture row per the shape in spec § 4. Example for `yesid-dev`:

```jsonc
[
  {
    "id": "yesid-dev",
    "status": "published",
    "date_published": null,
    "sort": 0,
    "featured": true,
    "hero_image_legacy_path": "images/work/yesid-dev.png",
    "repo_url": "https://github.com/mgkdante/yesid.dev",
    "live_url": "https://yesid.dev",
    "readme_url": null,
    "location": null,
    "environment": null,
    "version": null,
    "stack": ["SvelteKit", "Svelte 5", "TypeScript", "Tailwind CSS", "Vercel"],
    "tags": ["portfolio", "web", "svelte"],
    "translations": [
      {
        "languages_code": "en",
        "title": "yesid.dev — Portfolio Site",
        "one_liner": "The site you are looking at: a SvelteKit portfolio built slice by slice.",
        "description": "A personal brand and portfolio site for a freelance SQL developer and digital infrastructure consultant. Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and deployed to Vercel. Designed to be multilingual (en/fr/es) from day one."
      }
    ],
    "sections": [
      {
        "sort": 0,
        "translations": [
          {
            "languages_code": "en",
            "title": "Why SvelteKit?",
            "content": "SvelteKit compiles away the framework at build time, producing lean HTML and minimal JavaScript. For a portfolio site where first impression and load speed matter, that trade-off is worth making."
          }
        ]
      }
    ],
    "impact_metrics": [],
    "related_services": ["web-development"]
  },
  // ... repeat for: transit-data-pipeline, lorem-analytics-dashboard,
  //                 lorem-database-migration, lorem-query-optimizer, lorem-retool-admin
]
```

For `transit-data-pipeline` (2 impact metrics example):

```jsonc
{
  "id": "transit-data-pipeline",
  "status": "published",
  "featured": false,
  "sort": 1,
  "hero_image_legacy_path": null,
  "repo_url": "https://github.com/mgkdante/transit",
  "live_url": null,
  "readme_url": "https://raw.githubusercontent.com/mgkdante/transit/main/README.md",
  "location": "sherbrooke",
  "environment": "production",
  "version": "2.4.1",
  "stack": ["PostgreSQL", "Python", "dbt", "Power BI", "Apache Airflow"],
  "tags": ["etl", "transit", "postgresql", "dbt"],
  "translations": [
    {
      "languages_code": "en",
      "title": "Transit Operations Data Pipeline",
      "one_liner": "An end-to-end ELT pipeline processing real-time transit data for a regional operator.",
      "description": "A production data pipeline ingesting GTFS-RT feeds, transforming them with dbt, and surfacing KPIs in a Power BI dashboard. Built for a transit authority in Quebec."
    }
  ],
  "sections": [],
  "impact_metrics": [
    {
      "sort": 0,
      "value": "30s",
      "before": null,
      "translations": [
        { "languages_code": "en", "label": "Real-time refresh cycles" }
      ]
    },
    {
      "sort": 1,
      "value": "99.9%",
      "before": null,
      "translations": [
        { "languages_code": "en", "label": "Pipeline uptime" }
      ]
    }
  ],
  "related_services": ["data-pipeline", "sql-development"]
}
```

Continue for all 6 projects.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/fixtures/collections/projects.json
git commit -m "feat(slice-18 18e Phase 4 Task 13): projects fixture (6 projects)"
```

---

### Task 14: Define `ProjectsFixtureSchema` Zod schema (write the failing test FIRST per TDD)

**Files:**
- Create: `apps/cms/tests/fixture-projects.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/cms/tests/fixture-projects.test.ts
import { describe, it, expect } from 'bun:test';
import fixtureData from '../fixtures/collections/projects.json' with { type: 'json' };
import servicesFixtureData from '../fixtures/collections/services.json' with { type: 'json' };
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import { ProjectsFixtureSchema } from '../scripts/seed-projects';

describe('apps/cms/fixtures/collections/projects.json', () => {
	it('parses cleanly through ProjectsFixtureSchema (Zod)', () => {
		const result = ProjectsFixtureSchema.safeParse(fixtureData);
		if (!result.success) {
			console.error(result.error.issues);
		}
		expect(result.success).toBe(true);
	});

	it('contains exactly 6 projects', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		expect(projects.length).toBe(6);
	});

	it('every hero_image_legacy_path (when set) exists in assets-id-map.json', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		const map = idMap as Record<string, string>;
		for (const p of projects) {
			if (p.hero_image_legacy_path) {
				expect(map[p.hero_image_legacy_path]).toBeTruthy();
			}
		}
	});

	it('every related_services id exists in services fixture', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		const services = servicesFixtureData as Array<{ id: string }>;
		const serviceIds = new Set(services.map((s) => s.id));
		for (const p of projects) {
			for (const sid of p.related_services) {
				expect(serviceIds.has(sid)).toBe(true);
			}
		}
	});

	it('every project has at least one translation with English', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		for (const p of projects) {
			const en = p.translations.find((t) => t.languages_code === 'en');
			expect(en).toBeDefined();
			expect(en?.title.length).toBeGreaterThan(0);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/cms
bun test tests/fixture-projects.test.ts
```

Expected: FAIL — `ProjectsFixtureSchema` not yet exported from `scripts/seed-projects` (file doesn't exist yet).

- [ ] **Step 3: Commit (test only — RED phase)**

```bash
git add apps/cms/tests/fixture-projects.test.ts
git commit -m "test(slice-18 18e Phase 4 Task 14): RED — fixture-projects validation"
```

---

### Task 15: Create `seed-projects.ts` skeleton + Zod schema (make Task 14 test GREEN)

**Files:**
- Create: `apps/cms/scripts/seed-projects.ts`

- [ ] **Step 1: Write the seed script skeleton with Zod schema**

```typescript
#!/usr/bin/env bun
/**
 * Seed the Directus `projects` family from `fixtures/collections/projects.json`.
 *
 * Slice 18 18e Task 15+ — first canonical content-type migration after foundations.
 * Mirrors seed-services.ts shape (lib/* helpers + dry-run + reset + pure helpers).
 *
 * Strategy:
 *   1. Zod-validate the fixture.
 *   2. Auth to Directus (static token or email/password).
 *   3. If --reset: nuke existing projects (FK CASCADE clears translations,
 *      sections, impact_metrics, projects_services junction).
 *   4. loadSkeletonRecords('projects', ...) — create projects + nested
 *      translations + sections (with translations) + impact_metrics (with
 *      translations) in one nested write per project.
 *   5. loadFullData('projects_services', ...) — populate M2M junction now that
 *      project ids exist (services already exist).
 *   6. Read back + assert counts.
 *
 * Usage:
 *   bun run seed:projects
 *   bun run seed:projects -- --dry-run
 *   bun run seed:projects -- --reset
 *
 * Required env:
 *   DIRECTUS_ADMIN_TOKEN  — preferred
 *   OR
 *   DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD
 *   PUBLIC_DIRECTUS_URL   — optional, defaults to https://cms.yesid.dev
 *
 * Pure transformation helpers exported for tests/seed-projects-dry-run.test.ts.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/projects.json' with { type: 'json' };
import { assetIdForOrUndefined } from '@repo/shared';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Types (inlined per D14: app-local; @repo/shared stays type-only) -------

export type Locale = 'en' | 'fr' | 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type ProjectStatus = 'draft' | 'published' | 'archived';

// --- Zod schemas (validate fixture JSON at load-time) ------------------------

const TranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	one_liner: z.string(),
	description: z.string(),
});

const SectionTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	content: z.string(),
});

const SectionSchema = z.object({
	sort: z.number().int().min(0),
	translations: z.array(SectionTranslationSchema).min(1),
});

const ImpactMetricTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	label: z.string().min(1),
});

const ImpactMetricSchema = z.object({
	sort: z.number().int().min(0),
	value: z.string().min(1),
	before: z.string().nullable(),
	translations: z.array(ImpactMetricTranslationSchema).min(1),
});

const ProjectFixtureSchema = z.object({
	id: z.string().min(1),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	featured: z.boolean(),
	hero_image_legacy_path: z.string().nullable(),
	repo_url: z.string().nullable(),
	live_url: z.string().nullable(),
	readme_url: z.string().nullable(),
	location: z.string().nullable(),
	environment: z.string().nullable(),
	version: z.string().nullable(),
	stack: z.array(z.string()).readonly(),
	tags: z.array(z.string()).readonly(),
	translations: z.array(TranslationSchema).min(1),
	sections: z.array(SectionSchema),
	impact_metrics: z.array(ImpactMetricSchema),
	related_services: z.array(z.string()).readonly(),
});

export type ProjectFixture = z.infer<typeof ProjectFixtureSchema>;

export const ProjectsFixtureSchema = z.array(ProjectFixtureSchema).min(1).readonly();

// --- Pure transformation helpers (tested in tests/seed-projects-dry-run.test.ts) ---

// (Actual helpers added in Task 17 — RED phase first.)

// --- Directus I/O (only exercised by CLI entrypoint) -----------------------

// (Wired in Task 19+ — RED phase first.)

const log = createLogger('seed-projects');

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadProjectsFixture(): readonly ProjectFixture[] {
	return ProjectsFixtureSchema.parse(fixtureData);
}

if (import.meta.main) {
	console.error('seed-projects: not yet implemented (Task 19+).');
	process.exit(1);
}
```

- [ ] **Step 2: Run Task 14 test to verify it now passes**

```bash
cd apps/cms
bun test tests/fixture-projects.test.ts
```

Expected: PASS — all 5 cases green.

- [ ] **Step 3: Commit (GREEN phase)**

```bash
git add apps/cms/scripts/seed-projects.ts
git commit -m "feat(slice-18 18e Phase 4 Task 15): GREEN — ProjectsFixtureSchema + seed-projects skeleton"
```

---

### Task 16: Add Zod cross-validation against assetIdForOrUndefined

**Files:**
- Modify: `apps/cms/scripts/seed-projects.ts` (no — this is a fixture-test refinement)

This step is already covered by Task 14 Step 1's "every hero_image_legacy_path (when set) exists in assets-id-map.json" assertion. Skip; advance to Phase 5.

(Empty task — kept for plan numbering symmetry. Verify final test suite has the cross-ref assertion already.)

- [ ] **Step 1: Confirm assertion is present**

```bash
grep -n "hero_image_legacy_path" apps/cms/tests/fixture-projects.test.ts
```

Expected: shows the assertion from Task 14.

- [ ] **Step 2: Move on**

(No commit.)

---

## Phase 5 — Seed script: pure helpers + Directus I/O (6 tasks)

**Exit gate:** `seed-projects-dry-run.test.ts` green for all pure helpers; CLI flags work; `bun run seed:projects --dry-run` runs end-to-end without touching Directus.

### Task 17: Write tests for pure transform helpers (TDD RED)

**Files:**
- Create: `apps/cms/tests/seed-projects-dry-run.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/cms/tests/seed-projects-dry-run.test.ts
import { describe, it, expect } from 'bun:test';
import {
	toProjectRow,
	toTranslationRows,
	toSectionRows,
	toImpactMetricRows,
	toJunctionRows,
	loadProjectsFixture,
	type ProjectFixture,
} from '../scripts/seed-projects';

describe('seed-projects pure helpers', () => {
	const fixture = loadProjectsFixture();
	const yesidDev = fixture.find((p) => p.id === 'yesid-dev')!;
	const transit = fixture.find((p) => p.id === 'transit-data-pipeline')!;
	const dbMig = fixture.find((p) => p.id === 'lorem-database-migration')!;

	describe('toProjectRow', () => {
		it('preserves id + status + scalar fields', () => {
			const row = toProjectRow(yesidDev);
			expect(row.id).toBe('yesid-dev');
			expect(row.status).toBe('published');
			expect(row.featured).toBe(true);
			expect(row.repo_url).toBe('https://github.com/mgkdante/yesid.dev');
			expect(row.live_url).toBe('https://yesid.dev');
			expect(row.stack).toEqual(['SvelteKit', 'Svelte 5', 'TypeScript', 'Tailwind CSS', 'Vercel']);
			expect(row.tags).toEqual(['portfolio', 'web', 'svelte']);
		});

		it('resolves hero_image when legacy path is in assets-id-map', () => {
			const row = toProjectRow(yesidDev);
			expect(row.hero_image).toMatch(/^[0-9a-f-]{36}$/); // UUID
		});

		it('returns hero_image: null when legacy path is null', () => {
			const row = toProjectRow(transit);
			expect(row.hero_image).toBeNull();
		});

		it('flattens nested translations + sections + impact_metrics', () => {
			const row = toProjectRow(transit);
			expect(row.translations.length).toBe(1);
			expect(row.sections.length).toBe(0);
			expect(row.impact_metrics.length).toBe(2);
		});
	});

	describe('toTranslationRows', () => {
		it('emits one row per translation entry', () => {
			const rows = toTranslationRows(yesidDev);
			expect(rows.length).toBe(1);
			expect(rows[0].languages_code).toBe('en');
			expect(rows[0].title).toBe('yesid.dev — Portfolio Site');
		});
	});

	describe('toSectionRows', () => {
		it('emits one row per section with translations nested', () => {
			const rows = toSectionRows(yesidDev);
			expect(rows.length).toBe(1);
			expect(rows[0].sort).toBe(0);
			expect(rows[0].translations.length).toBe(1);
			expect(rows[0].translations[0].title).toBe('Why SvelteKit?');
		});

		it('preserves sort order', () => {
			const rows = toSectionRows(dbMig);
			expect(rows[0].sort).toBe(0);
			expect(rows[1].sort).toBe(1);
		});
	});

	describe('toImpactMetricRows', () => {
		it('emits one row per metric with translations nested', () => {
			const rows = toImpactMetricRows(transit);
			expect(rows.length).toBe(2);
			expect(rows[0].value).toBe('30s');
			expect(rows[0].before).toBeNull();
			expect(rows[0].translations[0].label).toBe('Real-time refresh cycles');
		});

		it('preserves before field when set', () => {
			const lorem = fixture.find((p) => p.id === 'lorem-analytics-dashboard')!;
			const rows = toImpactMetricRows(lorem);
			expect(rows[0].before).toBe('2 days');
		});
	});

	describe('toJunctionRows', () => {
		it('emits one row per relatedService', () => {
			const rows = toJunctionRows(transit);
			expect(rows.length).toBe(2);
			expect(rows.map((r) => r.service_id).sort()).toEqual(['data-pipeline', 'sql-development']);
		});

		it('uses project id as project_id', () => {
			const rows = toJunctionRows(yesidDev);
			expect(rows[0].project_id).toBe('yesid-dev');
		});

		it('emits empty array when no related services', () => {
			const empty: ProjectFixture = { ...yesidDev, related_services: [] };
			const rows = toJunctionRows(empty);
			expect(rows.length).toBe(0);
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/cms
bun test tests/seed-projects-dry-run.test.ts
```

Expected: FAIL — `toProjectRow` etc. not yet exported.

- [ ] **Step 3: Commit (RED phase)**

```bash
git add apps/cms/tests/seed-projects-dry-run.test.ts
git commit -m "test(slice-18 18e Phase 5 Task 17): RED — seed-projects pure helpers"
```

---

### Task 18: Implement pure transform helpers (Task 17 GREEN)

**Files:**
- Modify: `apps/cms/scripts/seed-projects.ts` — replace the "Actual helpers added in Task 17" stub with full implementations

- [ ] **Step 1: Add Directus row interface types**

After the Zod schema block, add:

```typescript
// --- Directus row shapes (flat — match the Directus collection layout) ------

export interface DirectusProjectTranslationRow {
	languages_code: Locale;
	title: string;
	one_liner: string;
	description: string;
}

export interface DirectusProjectSectionTranslationRow {
	languages_code: Locale;
	title: string;
	content: string;
}

export interface DirectusProjectSectionRow {
	sort: number;
	translations: readonly DirectusProjectSectionTranslationRow[];
}

export interface DirectusProjectImpactMetricTranslationRow {
	languages_code: Locale;
	label: string;
}

export interface DirectusProjectImpactMetricRow {
	sort: number;
	value: string;
	before: string | null;
	translations: readonly DirectusProjectImpactMetricTranslationRow[];
}

export interface DirectusProjectRow {
	id: string;
	status: ProjectStatus;
	date_published: string | null;
	sort: number;
	featured: boolean;
	hero_image: string | null;
	repo_url: string | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	stack: readonly string[];
	tags: readonly string[];
	translations: readonly DirectusProjectTranslationRow[];
	sections: readonly DirectusProjectSectionRow[];
	impact_metrics: readonly DirectusProjectImpactMetricRow[];
}

export interface DirectusProjectsServicesRow {
	project_id: string;
	service_id: string;
}
```

- [ ] **Step 2: Add pure helpers**

After the row interfaces, add:

```typescript
// --- Pure transformation helpers (tested in tests/seed-projects-dry-run.test.ts) ---

export function toTranslationRows(
	project: ProjectFixture,
): readonly DirectusProjectTranslationRow[] {
	return project.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		one_liner: t.one_liner,
		description: t.description,
	}));
}

export function toSectionRows(
	project: ProjectFixture,
): readonly DirectusProjectSectionRow[] {
	return project.sections.map((s) => ({
		sort: s.sort,
		translations: s.translations.map((t) => ({
			languages_code: t.languages_code,
			title: t.title,
			content: t.content,
		})),
	}));
}

export function toImpactMetricRows(
	project: ProjectFixture,
): readonly DirectusProjectImpactMetricRow[] {
	return project.impact_metrics.map((m) => ({
		sort: m.sort,
		value: m.value,
		before: m.before,
		translations: m.translations.map((t) => ({
			languages_code: t.languages_code,
			label: t.label,
		})),
	}));
}

export function toJunctionRows(
	project: ProjectFixture,
): readonly DirectusProjectsServicesRow[] {
	return project.related_services.map((sid) => ({
		project_id: project.id,
		service_id: sid,
	}));
}

export function toProjectRow(project: ProjectFixture): DirectusProjectRow {
	const heroImageUuid = project.hero_image_legacy_path
		? assetIdForOrUndefined(project.hero_image_legacy_path) ?? null
		: null;
	return {
		id: project.id,
		status: project.status,
		date_published: project.date_published,
		sort: project.sort,
		featured: project.featured,
		hero_image: heroImageUuid,
		repo_url: project.repo_url,
		live_url: project.live_url,
		readme_url: project.readme_url,
		location: project.location,
		environment: project.environment,
		version: project.version,
		stack: project.stack,
		tags: project.tags,
		translations: toTranslationRows(project),
		sections: toSectionRows(project),
		impact_metrics: toImpactMetricRows(project),
	};
}
```

- [ ] **Step 3: Run test to verify it passes**

```bash
cd apps/cms
bun test tests/seed-projects-dry-run.test.ts
```

Expected: PASS — all 11 cases green. If hero_image fails for `yesid-dev`, the legacy path `images/work/yesid-dev.png` isn't in `assets-id-map.json`; verify with `grep yesid-dev fixtures/assets-id-map.json` and re-run `migrate-assets` if needed.

- [ ] **Step 4: Commit (GREEN phase)**

```bash
git add apps/cms/scripts/seed-projects.ts
git commit -m "feat(slice-18 18e Phase 5 Task 18): GREEN — pure transform helpers"
```

---

### Task 19: Implement Directus I/O via lib/loaders + CLI flags

**Files:**
- Modify: `apps/cms/scripts/seed-projects.ts` — replace the `if (import.meta.main)` stub

- [ ] **Step 1: Add I/O implementation**

Replace the stub block at the bottom:

```typescript
// --- Directus I/O ---------------------------------------------------------

interface Schema {
	projects: DirectusProjectRow[];
	projects_services: DirectusProjectsServicesRow[];
}

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedProjects(
	projects: readonly ProjectFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would process ${projects.length} projects against ${opts.directusUrl}`);
		for (const project of projects) {
			const row = toProjectRow(project);
			log.info(
				`  ~ ${project.id.padEnd(28)}  status=${row.status}  ` +
					`featured=${row.featured}  hero=${row.hero_image ? 'yes' : 'no'}  ` +
					`translations=${row.translations.length}  sections=${row.sections.length}  ` +
					`metrics=${row.impact_metrics.length}  services=${project.related_services.length}`,
			);
		}
		log.info('dry-run complete (no writes).');
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(
			readItems('projects', { fields: ['id'], limit: -1 }),
		);
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing projects (FK CASCADE clears children)...`);
			for (const p of existing) {
				try {
					await client.request(deleteItem('projects', p.id));
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to delete existing project ${p.id}: ${msgs.join(' · ')}`,
					);
				}
			}
		}
	} else {
		const existing = await client.request(
			readItems('projects', { fields: ['id'], limit: -1 }),
		);
		if (existing.length > 0) {
			throw new Error(
				`[seed] found ${existing.length} existing projects. Re-run with --reset to clear + recreate.`,
			);
		}
	}

	log.info(`creating ${projects.length} projects (with nested children)...`);
	for (const project of projects) {
		const row = toProjectRow(project);
		try {
			await client.request(
				createItem('projects', row as unknown as DirectusProjectRow),
			);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to create project ${project.id}: ${msgs.join(' · ')}`,
			);
		}
		log.info(
			`  ✓ ${project.id.padEnd(28)}  status=${row.status}  ` +
				`hero=${row.hero_image ? 'yes' : 'no'}  ` +
				`metrics=${row.impact_metrics.length}  services=${project.related_services.length}`,
		);
	}

	// Phase 2: populate junction. Project ids exist now; services already existed.
	log.info(`creating projects_services junction rows...`);
	let junctionCount = 0;
	for (const project of projects) {
		const junctions = toJunctionRows(project);
		for (const j of junctions) {
			try {
				await client.request(
					createItem('projects_services', j as unknown as DirectusProjectsServicesRow),
				);
				junctionCount++;
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create junction ${j.project_id}↔${j.service_id}: ${msgs.join(' · ')}`,
				);
			}
		}
	}
	log.info(`  ✓ ${junctionCount} junction rows`);

	// Read-back assertions.
	const final = await client.request(
		readItems('projects', {
			fields: [
				'id',
				'status',
				{ translations: ['languages_code'] },
				{ sections: ['id'] },
				{ impact_metrics: ['id'] },
			],
			limit: -1,
			sort: ['sort'],
		}),
	);
	log.info(`verified: ${final.length} projects in Directus`);
	if (final.length !== projects.length) {
		throw new Error(`[seed] count mismatch: expected ${projects.length}, got ${final.length}`);
	}
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return {
		dryRun: argv.includes('--dry-run'),
		reset: argv.includes('--reset'),
	};
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const projects = loadProjectsFixture();
	log.info(`source: ${projects.length} projects from fixtures/collections/projects.json`);

	if (dryRun) {
		await seedProjects(projects, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedProjects(projects, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed] FAILED:', err);
		process.exit(1);
	});
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/cms
bun run --bun tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run dry-run**

```bash
cd apps/cms
bun run scripts/seed-projects.ts --dry-run
```

Expected: prints 6-project summary; no Directus calls.

- [ ] **Step 4: Run pure-helper tests**

```bash
bun test tests/seed-projects-dry-run.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/seed-projects.ts
git commit -m "feat(slice-18 18e Phase 5 Task 19): seed-projects Directus I/O + CLI flags"
```

---

### Task 20: Wire `seed:projects` into apps/cms/package.json

**Files:**
- Modify: `apps/cms/package.json`

- [ ] **Step 1: Add npm script**

Add to `scripts` block (mirror seed:services):
```jsonc
"seed:projects": "bun scripts/seed-projects.ts"
```

- [ ] **Step 2: Verify**

```bash
cd apps/cms
bun run seed:projects -- --dry-run
```

Expected: same dry-run output as Task 19.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/package.json
git commit -m "chore(slice-18 18e Phase 5 Task 20): seed:projects npm script"
```

---

### Task 21: Run full `apps/cms` test suite

**Files:**
- (Verification only)

- [ ] **Step 1: Run all CMS tests**

```bash
cd apps/cms
bun test
```

Expected: existing 114+ tests + 5 new fixture tests + 11 new dry-run helper tests, all green.

- [ ] **Step 2: If any fail, diagnose + fix**

(No commit unless changes needed.)

- [ ] **Step 3: Commit**

(Only if test fixes were needed.)

---

### Task 22: Run `bun run check` on apps/web for early type drift

**Files:**
- (Verification only)

- [ ] **Step 1: Type-check apps/web**

```bash
cd apps/web
bun run check
```

Expected: 0 errors. (We haven't touched apps/web yet — sanity check.)

- [ ] **Step 2: Commit**

(No changes.)

---

## Phase 6 — First push: schema + seed populate (3 tasks)

**Exit gate:** schema applied to live cms.yesid.dev (feature-branch CMS); 6 projects + 12 junction rows seeded; curl verifies data; `directus-sync diff` empty.

### Task 23: directus-sync push #1

**Files:**
- (Live Directus state changes — not a code commit; commit happens post-verification.)

- [ ] **Step 1: Auth env**

```bash
export DIRECTUS_ADMIN_TOKEN=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export PUBLIC_DIRECTUS_URL='https://cms.yesid.dev'
```

- [ ] **Step 2: Push**

```bash
cd apps/cms
bun run sync:push
```

Expected: 7 collections + 25 fields + 10 relations + 30+ permission rows applied. Diff goes empty.

- [ ] **Step 3: Verify diff empty**

```bash
bun run sync:diff
```

Expected: empty.

- [ ] **Step 4: Curl-verify collections exist**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "$PUBLIC_DIRECTUS_URL/collections/projects" | head -20
```

Expected: collection metadata returned.

- [ ] **Step 5: Commit**

(No code changes from this task; live state caught up to repo.)

---

### Task 24: Run `seed:projects --reset`

**Files:**
- (Live Directus data changes only.)

- [ ] **Step 1: Run seed**

```bash
cd apps/cms
bun run seed:projects -- --reset
```

Expected log:
```
[seed-projects] target: https://cms.yesid.dev
[seed-projects] source: 6 projects from fixtures/collections/projects.json
[seed-projects] creating 6 projects (with nested children)...
[seed-projects]   ✓ yesid-dev                   status=published  hero=yes  metrics=0  services=1
[seed-projects]   ✓ transit-data-pipeline       status=published  hero=no   metrics=2  services=2
[seed-projects]   ✓ lorem-analytics-dashboard   status=published  hero=no   metrics=2  services=1
[seed-projects]   ✓ lorem-database-migration    status=published  hero=no   metrics=1  services=2
[seed-projects]   ✓ lorem-query-optimizer       status=published  hero=no   metrics=0  services=2
[seed-projects]   ✓ lorem-retool-admin          status=published  hero=no   metrics=0  services=2
[seed-projects] creating projects_services junction rows...
[seed-projects]   ✓ 10 junction rows
[seed-projects] verified: 6 projects in Directus
[seed-projects] done.
```

- [ ] **Step 2: Curl-verify anon read of /items/projects**

```bash
curl -s "$PUBLIC_DIRECTUS_URL/items/projects?fields=id,status,featured&limit=10" | head -50
```

Expected: 6 projects returned with correct shape (Public policy `status _eq "published"` allows all 6 since all are seeded as published).

- [ ] **Step 3: Curl-verify junction**

```bash
curl -s "$PUBLIC_DIRECTUS_URL/items/projects_services?fields=project_id,service_id&limit=20" | head -50
```

Expected: 10 junction rows.

- [ ] **Step 4: Curl-verify nested fetch**

```bash
curl -s "$PUBLIC_DIRECTUS_URL/items/projects?fields=id,translations.title,sections.translations.title,impact_metrics.value&filter[id][_eq]=transit-data-pipeline" | jq
```

Expected: 1 project with 1 translation, 0 sections, 2 impact_metrics with values "30s" and "99.9%".

- [ ] **Step 5: Commit**

(No code changes — live data state caught up.)

---

### Task 25: Document live state in research.md

**Files:**
- Modify: `docs/slices/slice-18/18e-projects/research.md`

- [ ] **Step 1: Append findings section**

```markdown
## Live state after Phase 6 push + seed

**Status:** Resolved — Phase 6 (DATE).

- 7 collections live: projects + 4 sub-collections + 2 junctions (translations + projects_services).
- 6 projects seeded via `bun run seed:projects --reset`.
- 10 projects_services junction rows.
- Public anon read of `/items/projects` returns 6 rows (cascade FK filter working).
- hero_image M2O resolves for `yesid-dev` only; the other 5 are NULL (consumer falls back to gradient placeholder).
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-18/18e-projects/research.md
git commit -m "docs(slice-18 18e Phase 6 Task 25): live state after first push + seed"
```

---

## Phase 7 — Adapter port (web-side TDD) (6 tasks)

**Exit gate:** projects port (8 methods) implemented in `apps/web/src/lib/adapters/directus.ts`; services adapter switched to junction reads; contract tests + mocked-fetch tests green; `bun run check` 0 errors; `bun run test` full apps/web suite green.

### Task 26: Add Zod ProjectSchema for parsePort gate

**Files:**
- Create: `apps/web/src/lib/schemas/project.ts`

- [ ] **Step 1: Write the schema**

```typescript
// ProjectSchema — runtime mirror of the Project TS interface in @repo/shared.
// Every adapter port that returns project data parses through this schema
// before handing off to the consumer layer.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { Project, ProjectSection, ImpactMetric } from '$lib/types';

export const ProjectSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
});

export const ImpactMetricSchema = z.object({
	value: z.string(),
	label: LocalizedStringSchema,
	before: z.string().optional(),
});

export const ProjectSchema = z.object({
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	oneLiner: LocalizedStringSchema,
	description: LocalizedStringSchema,
	stack: z.array(z.string()),
	tags: z.array(z.string()),
	status: z.enum(['public', 'private', 'wip']),  // legacy 3-value type still in @repo/shared
	featured: z.boolean(),
	repoUrl: z.string().optional(),
	liveUrl: z.string().optional(),
	image: z.string().optional(),
	relatedServices: z.array(z.string()),
	readmeUrl: z.string().optional(),
	sections: z.array(ProjectSectionSchema),
	impactMetric: ImpactMetricSchema.optional(),
	impactMetrics: z.array(ImpactMetricSchema).optional(),
	location: z.string().optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

// Drift detector
type _ProjectCheck = z.infer<typeof ProjectSchema> extends Project
	? Project extends z.infer<typeof ProjectSchema>
		? true
		: false
	: false;
const _projectCheck: _ProjectCheck = true;
void _projectCheck;
```

**Note:** the `status` field in `@repo/shared.Project` still uses the 3-value type `'public' | 'private' | 'wip'`. The adapter `toProject` translates Directus `'published'` → consumer `'public'`, `'draft'` → `'wip'`, `'archived'` → `'private'` (or omit archived from public reads). This decouples the consumer type from Directus's enum until 18k closes.

- [ ] **Step 2: Verify type drift detector compiles**

```bash
cd apps/web
bun run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/schemas/project.ts
git commit -m "feat(slice-18 18e Phase 7 Task 26): ProjectSchema for parsePort gate"
```

---

### Task 27: Add Directus row interfaces in directus.ts (RED — write contract test first)

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.contract.test.ts` (extend with projects mapping tests — RED phase)

- [ ] **Step 1: Find existing contract test file**

```bash
ls apps/web/src/lib/adapters/directus.contract.test.ts
```

If it doesn't exist, the contract tests live in `directus.mocked.test.ts`; check there first.

- [ ] **Step 2: Add failing tests for `toProject`**

Append to `directus.contract.test.ts` (or create if missing):

```typescript
// directus.contract.test.ts — extend with projects mapping coverage.
import { describe, it, expect } from 'vitest';
import { toProject } from '$lib/adapters/directus';
import type { DirectusProject } from '$lib/adapters/directus';

describe('directus adapter — toProject', () => {
	const baseRow: DirectusProject = {
		id: 'yesid-dev',
		status: 'published',
		date_published: null,
		sort: 0,
		featured: true,
		hero_image: '66f6ddc8-c3f2-4bd7-97a5-978940757b77',
		repo_url: 'https://github.com/mgkdante/yesid.dev',
		live_url: 'https://yesid.dev',
		readme_url: null,
		location: null,
		environment: null,
		version: null,
		stack: ['SvelteKit', 'Svelte 5'],
		tags: ['portfolio'],
		translations: [
			{
				languages_code: 'en',
				title: 'yesid.dev — Portfolio',
				one_liner: 'Personal site',
				description: 'A personal brand site.',
			},
		],
		sections: [],
		impact_metrics: [],
		services: [],
	};

	it('maps id → slug', () => {
		const p = toProject(baseRow);
		expect(p.slug).toBe('yesid-dev');
	});

	it('maps status published → public', () => {
		const p = toProject(baseRow);
		expect(p.status).toBe('public');
	});

	it('maps status draft → wip', () => {
		const p = toProject({ ...baseRow, status: 'draft' });
		expect(p.status).toBe('wip');
	});

	it('flattens translations to LocalizedString', () => {
		const p = toProject(baseRow);
		expect(p.title).toEqual({ en: 'yesid.dev — Portfolio' });
		expect(p.oneLiner).toEqual({ en: 'Personal site' });
		expect(p.description).toEqual({ en: 'A personal brand site.' });
	});

	it('returns hero_image UUID as image field', () => {
		const p = toProject(baseRow);
		expect(p.image).toBe('66f6ddc8-c3f2-4bd7-97a5-978940757b77');
	});

	it('returns image undefined when hero_image is null', () => {
		const p = toProject({ ...baseRow, hero_image: null });
		expect(p.image).toBeUndefined();
	});

	it('preserves stack + tags arrays', () => {
		const p = toProject(baseRow);
		expect(p.stack).toEqual(['SvelteKit', 'Svelte 5']);
		expect(p.tags).toEqual(['portfolio']);
	});

	it('preserves repoUrl/liveUrl when set', () => {
		const p = toProject(baseRow);
		expect(p.repoUrl).toBe('https://github.com/mgkdante/yesid.dev');
		expect(p.liveUrl).toBe('https://yesid.dev');
	});

	it('flattens sections sorted by sort + with translation flattening', () => {
		const withSections = {
			...baseRow,
			sections: [
				{
					id: 1,
					sort: 1,
					translations: [{ languages_code: 'en', title: 'Second', content: 'Two' }],
				},
				{
					id: 2,
					sort: 0,
					translations: [{ languages_code: 'en', title: 'First', content: 'One' }],
				},
			],
		};
		const p = toProject(withSections);
		expect(p.sections.length).toBe(2);
		expect(p.sections[0].title).toEqual({ en: 'First' });
		expect(p.sections[1].title).toEqual({ en: 'Second' });
	});

	it('flattens impact_metrics; impactMetric === impactMetrics[0]', () => {
		const withMetrics = {
			...baseRow,
			impact_metrics: [
				{
					id: 1,
					sort: 0,
					value: '30s',
					before: null,
					translations: [{ languages_code: 'en', label: 'Real-time refresh' }],
				},
				{
					id: 2,
					sort: 1,
					value: '99.9%',
					before: null,
					translations: [{ languages_code: 'en', label: 'Uptime' }],
				},
			],
		};
		const p = toProject(withMetrics);
		expect(p.impactMetrics?.length).toBe(2);
		expect(p.impactMetric).toEqual(p.impactMetrics?.[0]);
		expect(p.impactMetric?.value).toBe('30s');
		expect(p.impactMetric?.label).toEqual({ en: 'Real-time refresh' });
	});

	it('preserves impact_metric.before when set', () => {
		const withBefore = {
			...baseRow,
			impact_metrics: [
				{
					id: 1,
					sort: 0,
					value: '15 min',
					before: '2 days',
					translations: [{ languages_code: 'en', label: 'Reporting' }],
				},
			],
		};
		const p = toProject(withBefore);
		expect(p.impactMetric?.before).toBe('2 days');
	});
});
```

- [ ] **Step 3: Run tests (expect RED — `toProject` not exported)**

```bash
cd apps/web
bun run test src/lib/adapters/directus.contract.test.ts
```

Expected: FAIL — `toProject` import errors.

- [ ] **Step 4: Commit (RED phase)**

```bash
git add apps/web/src/lib/adapters/directus.contract.test.ts
git commit -m "test(slice-18 18e Phase 7 Task 27): RED — toProject contract"
```

---

### Task 28: Implement Directus row interfaces + `toProject` (Task 27 GREEN)

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Add row interfaces after `DirectusServiceSectionRow`**

After line ~80 (after `DirectusService`), add:

```typescript
// ---------------------------------------------------------------------------
// Project row shapes — match the Directus collection layout authored in 18e.
// ---------------------------------------------------------------------------

export interface DirectusProjectTranslation {
	languages_code: string;
	title?: string | null;
	one_liner?: string | null;
	description?: string | null;
}

export interface DirectusProjectSectionTranslation {
	languages_code: string;
	title?: string | null;
	content?: string | null;
}

export interface DirectusProjectSectionRow {
	id: number;
	sort: number | null;
	translations?: DirectusProjectSectionTranslation[];
}

export interface DirectusProjectImpactMetricTranslation {
	languages_code: string;
	label?: string | null;
}

export interface DirectusProjectImpactMetricRow {
	id: number;
	sort: number | null;
	value: string;
	before: string | null;
	translations?: DirectusProjectImpactMetricTranslation[];
}

export interface DirectusProjectsServicesRow {
	id: number;
	project_id: string;
	service_id: string;
}

export interface DirectusProject {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number | null;
	featured: boolean;
	hero_image: string | null;
	repo_url: string | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	stack: string[];
	tags: string[];
	translations?: DirectusProjectTranslation[];
	sections?: DirectusProjectSectionRow[];
	impact_metrics?: DirectusProjectImpactMetricRow[];
	services?: DirectusProjectsServicesRow[]; // populated when fetched alongside parent
}
```

- [ ] **Step 2: Update Schema interface**

Find:
```typescript
interface Schema {
	services: DirectusService[];
}
```

Replace with:
```typescript
interface Schema {
	services: DirectusService[];
	projects: DirectusProject[];
	projects_services: DirectusProjectsServicesRow[];
}
```

- [ ] **Step 3: Add `toProject` mapper**

After `toService`, add:

```typescript
function statusFromDirectus(s: 'draft' | 'published' | 'archived'): 'public' | 'private' | 'wip' {
	switch (s) {
		case 'published':
			return 'public';
		case 'draft':
			return 'wip';
		case 'archived':
			return 'private';
	}
}

export function toProject(row: DirectusProject): Project {
	const translations = row.translations ?? [];

	const sections: ProjectSection[] = (row.sections ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((s) => ({
			title: toLocalizedString(s.translations ?? [], 'title'),
			content: toLocalizedString(s.translations ?? [], 'content'),
		}));

	const impactMetrics: ImpactMetric[] = (row.impact_metrics ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((m) => {
			const metric: ImpactMetric = {
				value: m.value,
				label: toLocalizedString(m.translations ?? [], 'label'),
			};
			if (m.before) metric.before = m.before;
			return metric;
		});

	const project: Project = {
		slug: row.id,
		title: toLocalizedString(translations, 'title'),
		oneLiner: toLocalizedString(translations, 'one_liner'),
		description: toLocalizedString(translations, 'description'),
		stack: row.stack ?? [],
		tags: row.tags ?? [],
		status: statusFromDirectus(row.status),
		featured: row.featured,
		relatedServices: (row.services ?? []).map((j) => j.service_id),
		sections,
	};

	if (row.repo_url) project.repoUrl = row.repo_url;
	if (row.live_url) project.liveUrl = row.live_url;
	if (row.readme_url) project.readmeUrl = row.readme_url;
	if (row.hero_image) project.image = row.hero_image;
	if (row.location) project.location = row.location;
	if (row.environment) project.environment = row.environment;
	if (row.version) project.version = row.version;

	if (impactMetrics.length > 0) {
		project.impactMetrics = impactMetrics;
		project.impactMetric = impactMetrics[0];
	}

	return project;
}
```

- [ ] **Step 4: Add type imports**

At the top of `directus.ts`, ensure these are imported from `$lib/types`:
```typescript
import type { Project, ProjectSection, ImpactMetric } from '$lib/types';
```

- [ ] **Step 5: Run contract tests**

```bash
cd apps/web
bun run test src/lib/adapters/directus.contract.test.ts
```

Expected: PASS — all `toProject` cases green.

- [ ] **Step 6: Commit (GREEN)**

```bash
git add apps/web/src/lib/adapters/directus.ts
git commit -m "feat(slice-18 18e Phase 7 Task 28): GREEN — toProject mapper + Directus row types"
```

---

### Task 29: Implement `fetchProjects` + 8 port methods (TDD via mocked-fetch tests)

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.mocked.test.ts` (RED — write tests for 8 methods)
- Modify: `apps/web/src/lib/adapters/directus.ts` (GREEN — implement methods)

- [ ] **Step 1: Write failing mocked-fetch tests for all 8 methods**

Append to `directus.mocked.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { directusAdapter } from '$lib/adapters/directus';

// Reuse the existing sharedMockFetch / parseCapturedUrl / jsonResponse helpers
// from the existing services-port test block.

describe('directusAdapter.projects — fetch contract', () => {
	it('projects.all hits /items/projects with nested fields', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.all();
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/projects');
		const fields = search.get('fields') ?? '';
		expect(fields).toContain('translations');
		expect(fields).toContain('sections');
		expect(fields).toContain('impact_metrics');
		expect(fields).toContain('services');
		expect(search.get('limit')).toBe('-1');
	});

	it('projects.bySlug filters by id._eq', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.bySlug('yesid-dev');
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('id');
		expect(filter).toContain('_eq');
		expect(filter).toContain('yesid-dev');
	});

	it('projects.featured filters by featured._eq=true', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.featured();
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('featured');
		expect(filter).toContain('_eq');
		expect(filter).toContain('true');
	});

	it('projects.public filters by status._eq=published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.public();
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('status');
		expect(filter).toContain('_eq');
		expect(filter).toContain('published');
	});

	it('projects.byService runs two-stage: junction + projects', async () => {
		// Stage 1: junction returns project ids
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([{ project_id: 'transit-data-pipeline' }]),
		);
		// Stage 2: full project fetch
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.byService('sql-development');
		expect(sharedMockFetch).toHaveBeenCalledTimes(2);
		const firstUrl = new URL(sharedMockFetch.mock.calls[0][0]);
		expect(firstUrl.pathname).toBe('/items/projects_services');
		const firstFilter = firstUrl.searchParams.get('filter') ?? '';
		expect(firstFilter).toContain('service_id');
		expect(firstFilter).toContain('sql-development');
	});

	it('projects.allTags returns unique sorted tags from minimal-fields fetch', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ tags: ['etl', 'transit'] },
				{ tags: ['portfolio', 'web', 'etl'] },
			]),
		);
		const tags = await directusAdapter.projects.allTags();
		expect(tags).toEqual(['etl', 'portfolio', 'transit', 'web']);
		const fields = parseCapturedUrl().search.get('fields') ?? '';
		expect(fields).toBe('tags');
	});

	it('projects.allStackItems returns unique sorted stack items', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([{ stack: ['SvelteKit', 'TS'] }, { stack: ['TS', 'Vercel'] }]),
		);
		const stack = await directusAdapter.projects.allStackItems();
		expect(stack).toEqual(['SvelteKit', 'TS', 'Vercel']);
	});

	it('projects.serviceIdsForProjects returns unique sorted service ids from junction', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ service_id: 'sql-development' },
				{ service_id: 'data-pipeline' },
				{ service_id: 'sql-development' },
			]),
		);
		const ids = await directusAdapter.projects.serviceIdsForProjects();
		expect(ids).toEqual(['data-pipeline', 'sql-development']);
		const url = new URL(sharedMockFetch.mock.calls[0][0]);
		expect(url.pathname).toBe('/items/projects_services');
	});
});
```

- [ ] **Step 2: Verify tests fail**

```bash
cd apps/web
bun run test src/lib/adapters/directus.mocked.test.ts
```

Expected: FAIL — projects port still has `todo()` stubs.

- [ ] **Step 3: Replace `todo()` stubs with implementations**

In `directus.ts`, replace the `projects: { ... todo() ... }` block:

```typescript
// ---- Project ports ----

const PROJECT_FIELDS = [
	'*',
	{ translations: ['*'] },
	{ sections: ['id', 'sort', { translations: ['*'] }] },
	{ impact_metrics: ['id', 'sort', 'value', 'before', { translations: ['*'] }] },
	{ services: ['id', 'service_id'] },
] as const;

async function fetchProjects(filter?: Record<string, unknown>): Promise<Project[]> {
	const rows = await client().request(
		readItems('projects', {
			fields: PROJECT_FIELDS as unknown as string[],
			limit: -1,
			...(filter ? { filter } : {}),
		}),
	);
	return (rows as unknown as DirectusProject[]).map(toProject);
}

async function fetchProjectIdsForService(serviceId: string): Promise<readonly string[]> {
	const rows = await client().request(
		readItems('projects_services', {
			fields: ['project_id'],
			filter: { service_id: { _eq: serviceId } },
			limit: -1,
		}),
	);
	return (rows as unknown as Array<{ project_id: string }>).map((r) => r.project_id);
}

// ... in directusAdapter:
projects: {
	all: async () =>
		parsePort('projects.all', z.array(ProjectSchema), await fetchProjects()),
	bySlug: async (slug) => {
		const rows = await fetchProjects({ id: { _eq: slug } });
		return parsePort('projects.bySlug', ProjectSchema.optional(), rows[0]);
	},
	featured: async () =>
		parsePort(
			'projects.featured',
			z.array(ProjectSchema),
			await fetchProjects({ featured: { _eq: true } }),
		),
	public: async () =>
		parsePort(
			'projects.public',
			z.array(ProjectSchema),
			await fetchProjects({ status: { _eq: 'published' } }),
		),
	byService: async (serviceId) => {
		const ids = await fetchProjectIdsForService(serviceId);
		if (ids.length === 0) {
			return parsePort('projects.byService', z.array(ProjectSchema), []);
		}
		const rows = await fetchProjects({ id: { _in: ids } });
		return parsePort('projects.byService', z.array(ProjectSchema), rows);
	},
	allTags: async () => {
		const rows = await client().request(
			readItems('projects', { fields: ['tags'], limit: -1 }),
		);
		const all = (rows as unknown as Array<{ tags: string[] }>).flatMap((r) => r.tags ?? []);
		return parsePort('projects.allTags', z.array(z.string()), [...new Set(all)].sort());
	},
	allStackItems: async () => {
		const rows = await client().request(
			readItems('projects', { fields: ['stack'], limit: -1 }),
		);
		const all = (rows as unknown as Array<{ stack: string[] }>).flatMap((r) => r.stack ?? []);
		return parsePort('projects.allStackItems', z.array(z.string()), [...new Set(all)].sort());
	},
	serviceIdsForProjects: async () => {
		const rows = await client().request(
			readItems('projects_services', { fields: ['service_id'], limit: -1 }),
		);
		const all = (rows as unknown as Array<{ service_id: string }>).map((r) => r.service_id);
		return parsePort(
			'projects.serviceIdsForProjects',
			z.array(z.string()),
			[...new Set(all)].sort(),
		);
	},
},
```

- [ ] **Step 4: Add ProjectSchema import**

At top of `directus.ts`:
```typescript
import { ProjectSchema } from '$lib/schemas/project';
```

- [ ] **Step 5: Run tests**

```bash
cd apps/web
bun run test src/lib/adapters/directus.mocked.test.ts
```

Expected: PASS — all 8 projects port tests + 3 contract `toProject` extension tests green.

- [ ] **Step 6: Commit (GREEN)**

```bash
git add apps/web/src/lib/adapters/directus.ts apps/web/src/lib/adapters/directus.mocked.test.ts
git commit -m "feat(slice-18 18e Phase 7 Task 29): GREEN — 8 projects port methods"
```

---

### Task 30: Switch services adapter `relatedProjects` to junction reads (with regression test)

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.mocked.test.ts` (RED — services regression)
- Modify: `apps/web/src/lib/adapters/directus.ts` (GREEN — junction read with per-ctx memo)

- [ ] **Step 1: Write failing regression test**

Append to `directus.mocked.test.ts`:

```typescript
describe('directusAdapter.services — regression after M2M switch', () => {
	it('services.byId resolves relatedProjects via projects_services junction', async () => {
		// Stage 1: services fetch returns row WITHOUT related_projects field
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{
					id: 'sql-development',
					station: 1,
					translations: [{ languages_code: 'en', title: 'SQL', description: 'desc' }],
					deliverables: [],
					sections: [],
					// related_projects NOT in row — has been replaced by junction
				},
			]),
		);
		// Stage 2: junction returns project ids
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ project_id: 'transit-data-pipeline' },
				{ project_id: 'lorem-query-optimizer' },
			]),
		);

		const service = await directusAdapter.services.byId('sql-development');
		expect(service?.relatedProjects).toEqual([
			'transit-data-pipeline',
			'lorem-query-optimizer',
		]);
		// Junction was called once for this service
		const junctionCall = sharedMockFetch.mock.calls.find(
			(c) => new URL(c[0]).pathname === '/items/projects_services',
		);
		expect(junctionCall).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test (expect RED — services adapter still reads from row.related_projects)**

```bash
bun run test src/lib/adapters/directus.mocked.test.ts -t "M2M switch"
```

Expected: FAIL or pass-spuriously (depends on existing mock behavior); inspect output.

- [ ] **Step 3: Update services adapter — switch to junction read**

In `directus.ts`, modify the services port:

```typescript
// Add a per-request memo for service → relatedProjects lookup
const relatedProjectsMemo = new WeakMap<object, Map<string, Promise<readonly string[]>>>();

async function fetchRelatedProjectsViaJunction(
	serviceId: string,
	ctx?: object,
): Promise<readonly string[]> {
	if (ctx) {
		let serviceMap = relatedProjectsMemo.get(ctx);
		if (!serviceMap) {
			serviceMap = new Map();
			relatedProjectsMemo.set(ctx, serviceMap);
		}
		const cached = serviceMap.get(serviceId);
		if (cached) return cached;
		const p = fetchRelatedProjectsViaJunctionRaw(serviceId);
		serviceMap.set(serviceId, p);
		return p;
	}
	return fetchRelatedProjectsViaJunctionRaw(serviceId);
}

async function fetchRelatedProjectsViaJunctionRaw(
	serviceId: string,
): Promise<readonly string[]> {
	const rows = await client().request(
		readItems('projects_services', {
			fields: ['project_id'],
			filter: { service_id: { _eq: serviceId } },
			limit: -1,
		}),
	);
	return (rows as unknown as Array<{ project_id: string }>).map((r) => r.project_id);
}
```

Update `fetchServices` to populate `relatedProjects` via junction:

```typescript
async function fetchServices(
	filter?: Record<string, unknown>,
	ctx?: object,
): Promise<Service[]> {
	const rows = await client().request(
		readItems('services', {
			fields: [
				'*',
				{ translations: ['*'] },
				{ deliverables: ['id', 'sort', { translations: ['*'] }] },
				{ sections: ['id', 'sort', { translations: ['*'] }] },
			],
			limit: -1,
			...(filter ? { filter } : {}),
		}),
	);
	const services = (rows as unknown as DirectusService[]).map(toService);
	// Populate relatedProjects via junction (per-ctx memoized)
	for (const service of services) {
		const ids = await fetchRelatedProjectsViaJunction(service.id, ctx);
		(service as { relatedProjects: string[] }).relatedProjects = [...ids];
	}
	return services;
}
```

Note: this introduces N+1 queries (one per service). For the small services count (~6), this is acceptable; for larger collections, batch via junction filter `service_id._in` and group client-side. Documented as a follow-up in `decisions.md` if performance regression observed.

Update `toService` to no longer set `relatedProjects` from `row.related_projects`:

```typescript
export function toService(row: DirectusService): Service {
	const translations = row.translations ?? [];
	const service: Service = {
		id: row.id,
		station: row.station,
		title: toLocalizedString(translations, 'title'),
		description: toLocalizedString(translations, 'description'),
		relatedProjects: [], // populated by fetchServices via junction
	};
	// ... rest unchanged
}
```

- [ ] **Step 4: Run tests — verify both regression test + existing services tests pass**

```bash
bun run test src/lib/adapters/directus.mocked.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full apps/web test suite**

```bash
bun run test
```

Expected: 1006+ tests green.

- [ ] **Step 6: Run check**

```bash
bun run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/adapters/directus.ts apps/web/src/lib/adapters/directus.mocked.test.ts
git commit -m "feat(slice-18 18e Phase 7 Task 30): services adapter — relatedProjects via M2M junction"
```

---

### Task 31: Update static adapter for Project.image filename → UUID mapping

**Files:**
- Modify: `apps/web/src/lib/adapters/static.ts`

- [ ] **Step 1: Find static adapter projects port**

```bash
grep -n "projects:" apps/web/src/lib/adapters/static.ts
```

- [ ] **Step 2: Update Project.image translation**

The static `Project.image` field carries a filename like `'yesid-dev.png'`. The Directus path returns the file UUID. To keep the consumer uniform, the static adapter must also return the UUID via `assetIdForOrUndefined`.

In the static adapter's projects port, modify the `bySlug`/`all`/etc. methods to map `Project.image` filename → UUID:

```typescript
import { assetIdForOrUndefined } from '@repo/shared';

function withImageUuid(project: Project): Project {
	if (!project.image) return project;
	const legacyPath = `images/work/${project.image}`;
	const uuid = assetIdForOrUndefined(legacyPath);
	if (!uuid) {
		// Fail-soft: leave the filename intact; consumer's gradient-placeholder
		// fallback handles missing-uuid case.
		return project;
	}
	return { ...project, image: uuid };
}

// In each method that returns Project[] / Project:
all: async () => projects.map(withImageUuid),
bySlug: async (slug) => {
	const p = projects.find((p) => p.slug === slug);
	return p ? withImageUuid(p) : undefined;
},
// ... and so on for featured, public, byService
```

- [ ] **Step 3: Run static-adapter tests**

```bash
cd apps/web
bun run test src/lib/adapters
```

Expected: PASS (the static adapter's existing tests + the new contract tests).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/adapters/static.ts
git commit -m "feat(slice-18 18e Phase 7 Task 31): static adapter — Project.image filename → UUID"
```

---

## Phase 8 — Hybrid flip + consumer touches (3 tasks)

**Exit gate:** consumer components use `asset(image, preset)` helper; projects port flipped from static → directus in `adapters/index.ts`; full test suite green; live dev server renders projects.

### Task 32: Update consumer components to use `asset()` helper

**Files:**
- Modify: `apps/web/src/lib/components/projects/ProjectCard.svelte`
- Modify: `apps/web/src/lib/components/projects/ProjectMiniCard.svelte`
- Modify: `apps/web/src/lib/components/projects/ProjectDetailHeader.svelte`
- Modify: `apps/web/src/lib/components/projects/ProjectDetailPage.svelte`
- Modify: any `+page.svelte` consuming `Project.image` directly

- [ ] **Step 1: Find all consumers of `project.image`**

```bash
grep -rn "project.image\|p\.image\|\.image" apps/web/src/lib/components/projects/ apps/web/src/routes/projects/
```

- [ ] **Step 2: For each consumer, replace bare `image` with `asset(image, preset)`**

Example transformation:

Before:
```svelte
<img src={`/images/work/${project.image}`} alt={project.title.en} />
```

After:
```svelte
<script lang="ts">
	import { asset } from '$lib/directus/assets';
</script>
<img src={asset(project.image, 'card-600')} alt={project.title.en} />
```

Choose preset per use case:
- ProjectCard / Project listing → `card-600`
- ProjectDetailHeader → `hero-1200`
- ProjectMiniCard / ProjectDetailSidebar → `thumb-240`

- [ ] **Step 3: Run dev server + visually verify**

```bash
cd apps/web
bun run dev
```

In browser, navigate to `/projects` (still served by static adapter at this point). Verify each card's image either renders correctly OR shows the gradient placeholder for projects without `image`.

- [ ] **Step 4: Run tests**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/components/projects/
git commit -m "feat(slice-18 18e Phase 8 Task 32): consumer components use asset() helper"
```

---

### Task 33: Hybrid flip — projects port to Directus

**Files:**
- Modify: `apps/web/src/lib/adapters/index.ts`

- [ ] **Step 1: Apply the one-line flip**

Find:
```typescript
projects: staticAdapter.projects,
```

Replace with:
```typescript
projects: directusAdapter.projects,
```

- [ ] **Step 2: Run full test suite**

```bash
cd apps/web
bun run check && bun run test
```

Expected: 0 type errors; all tests green.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/adapters/index.ts
git commit -m "feat(slice-18 18e Phase 8 Task 33): hybrid flip — projects port to Directus"
```

---

### Task 34: Update CLAUDE.md or AGENTS.md if needed

**Files:**
- (Verification only — usually no-op for sub-slice work)

- [ ] **Step 1: Confirm no doc updates needed**

The slice plan + sub-slice bundle cover the artifact tracking. No CLAUDE.md / AGENTS.md edits expected for this sub-slice.

- [ ] **Step 2: No commit**

(Skip task if no docs need updating.)

---

## Phase 9 — Live smoke + second push: drop CSV (5 tasks)

**Exit gate:** `/projects` + `/projects/[slug]` + `/services/[slug]` render from Directus; `services.related_projects` field dropped; final test sweep green; `directus-sync diff` empty.

### Task 35: Live smoke — projects routes

**Files:**
- (Verification only)

- [ ] **Step 1: Run dev server**

```bash
cd apps/web
bun run dev
```

- [ ] **Step 2: Verify `/projects`**

Browser → `http://localhost:5173/projects`. Expected: 6 projects listed with cards. Network tab: confirms data comes from `cms.yesid.dev/items/projects` (not static).

- [ ] **Step 3: Verify `/projects/yesid-dev`**

Browser → `/projects/yesid-dev`. Expected: detail page renders with hero_image (loaded from R2 via `cms.yesid.dev/assets/<uuid>?key=hero-1200`), 1 section ("Why SvelteKit?"), no impact metrics.

- [ ] **Step 4: Verify `/projects/transit-data-pipeline`**

Expected: no hero (gradient placeholder), 0 sections, 2 impact metrics ("30s real-time refresh", "99.9% uptime").

- [ ] **Step 5: Verify `/projects/lorem-database-migration`**

Expected: 2 sections ("Why Migrate?", "Migration Strategy"), 1 impact metric ("500 GB zero-downtime").

- [ ] **Step 6: Verify `/services/sql-development`**

Expected: "Related projects" strip resolves via M2M (transit-data-pipeline + lorem-query-optimizer + lorem-database-migration).

- [ ] **Step 7: Network tab inspection**

Confirm: junction lookup for `/items/projects_services` happens once per service (per-ctx memoized) — not per project card.

- [ ] **Step 8: No commit**

(Smoke verification step.)

---

### Task 36: directus-sync push #2 — drop `services.related_projects`

**Files:**
- Modify: `apps/cms/directus/collections/services.json` (remove `related_projects` field reference if listed)
- Delete: `apps/cms/directus/fields/services/related_projects.json`

- [ ] **Step 1: Find the field definition**

```bash
ls apps/cms/directus/fields/services/related_projects.json
```

- [ ] **Step 2: Delete the field JSON**

```bash
rm apps/cms/directus/fields/services/related_projects.json
```

- [ ] **Step 3: Check if collections/services.json references the field**

```bash
grep -n "related_projects" apps/cms/directus/collections/services.json
```

Remove any references.

- [ ] **Step 4: Run sync diff to preview**

```bash
cd apps/cms
bun run sync:diff
```

Expected: 1 deletion (`directus_fields/services/related_projects`).

- [ ] **Step 5: Run sync push**

```bash
bun run sync:push
```

Expected: field dropped from live schema.

- [ ] **Step 6: Verify diff empty**

```bash
bun run sync:diff
```

Expected: empty.

- [ ] **Step 7: Curl-verify field is gone**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "$PUBLIC_DIRECTUS_URL/items/services?fields=id,related_projects&limit=1"
```

Expected: HTTP 400 — "field related_projects does not exist". Or HTTP 200 with the field omitted depending on Directus error mode.

- [ ] **Step 8: Commit**

```bash
git add -A apps/cms/directus/
git commit -m "feat(slice-18 18e Phase 9 Task 36): drop services.related_projects field (push #2)"
```

---

### Task 37: Remove `related_projects` from `DirectusService` row interface

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Find the field**

```bash
grep -n "related_projects" apps/web/src/lib/adapters/directus.ts
```

- [ ] **Step 2: Remove from `DirectusService` interface**

Find:
```typescript
export interface DirectusService {
	id: string;
	station: number;
	icon?: string | null;
	svg?: string | null;
	visible?: boolean | null;
	related_projects?: string[] | null;  // <- REMOVE
	stack?: string[] | null;
	translations?: DirectusServiceTranslation[];
	deliverables?: DirectusServiceDeliverable[];
	sections?: DirectusServiceSectionRow[];
}
```

Delete the `related_projects` line.

- [ ] **Step 3: Verify `toService` doesn't reference the field**

```bash
grep -n "related_projects" apps/web/src/lib/adapters/directus.ts
```

Expected: no remaining references.

- [ ] **Step 4: Run check + tests**

```bash
cd apps/web
bun run check && bun run test
```

Expected: 0 errors; all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/adapters/directus.ts
git commit -m "chore(slice-18 18e Phase 9 Task 37): remove related_projects from DirectusService type"
```

---

### Task 38: Final live smoke after CSV drop

**Files:**
- (Verification only)

- [ ] **Step 1: Re-verify `/services/[slug]` related-projects strip**

Browser → `/services/sql-development`. Expected: same 3 related projects visible (transit-data-pipeline, lorem-query-optimizer, lorem-database-migration). Junction reads still working post-CSV-drop.

- [ ] **Step 2: Re-verify `/projects` + `/projects/[slug]`**

Same as Task 35.

- [ ] **Step 3: Run final test sweep**

```bash
cd apps/web && bun run check && bun run test
cd ../cms && bun test
```

Expected: 0 errors; all tests green.

- [ ] **Step 4: No commit**

(Smoke verification.)

---

### Task 39: Update research.md + decisions.md with final findings

**Files:**
- Modify: `docs/slices/slice-18/18e-projects/research.md`
- Modify: `docs/slices/slice-18/18e-projects/decisions.md`

- [ ] **Step 1: Append Phase 9 findings to research.md**

```markdown
## Live state after Phase 9 (final)

**Status:** Resolved — Phase 9 (DATE).

- /projects renders 6 projects from Directus (no static fallback).
- /projects/yesid-dev: hero_image from R2 served via /assets/<uuid>?key=hero-1200.
  Sharp transform issue (#37) means served bytes are original PNG (not 1200-wide WebP);
  acceptable for current image dimensions.
- /services/sql-development "Related projects" strip resolves via M2M junction;
  junction reads per-ctx memoized (one round-trip per service, not per project).
- services.related_projects field dropped; DirectusService row interface cleaned up.
- All 4 test boundaries green; bun run check 0 errors apps/web; bun run test full suite green
  both apps.
```

- [ ] **Step 2: Append amendments to decisions.md if any live findings supersede plan**

Document any of:
- Cascade FK filter syntax actual behavior vs probe expectation
- Sharp passthrough confirmation for hero images
- Any seed-time M2M issues or workarounds
- N+1 services-junction performance observation

- [ ] **Step 3: Commit**

```bash
git add docs/slices/slice-18/18e-projects/
git commit -m "docs(slice-18 18e Phase 9 Task 39): final findings + amendments"
```

---

## Phase 10 — Close (3 tasks)

**Exit gate:** deferred work filed as GitHub issues; whole-slice plan.md updated to `✅ closed`; PR opened, CI green, owner-reviewed, merged.

### Task 40: File deferred work as GitHub issues

Per AGENTS.md `## Never` workflow rule (commit `e17c4b3`): file ALL deferred work as GitHub issues BEFORE close.

Items to file (from spec § 10):

- [ ] **Step 1: File issue for Block Editor migration**

```bash
gh issue create \
  --title "slice-18 follow-on: migrate projects description + sections.content to Block Editor (post-18f)" \
  --body "After 18f ships BlockRenderer.svelte, upgrade projects_translations.description (text → Block Editor JSON) + projects_sections_translations.content. Use 18f's migrate-markdown-to-blocks.ts (or trivial text-to-paragraph conversion). Per CONVENTIONS.md § 7 aspiration. Spec: docs/slices/slice-18/18e-projects/spec.md § 10." \
  --label "tech-debt" --label "slice-18-followon"
```

- [ ] **Step 2: File issue for scaffold-port.ts extension**

```bash
gh issue create \
  --title "slice-18k: extend scaffold-port.ts for M2M-heavy schemas" \
  --body "Current scaffold-port.ts emits ~5% of what M2M-heavy collections need (projects, blog, tech-stack with relations). After 18f/18g/18h teach the right shape, extend to handle: (1) sub-collections with own translations, (2) M2M junctions, (3) richer permission row sets. Spec: docs/slices/slice-18/18e-projects/spec.md § 10." \
  --label "tech-debt" --label "slice-18k"
```

- [ ] **Step 3: File issue for projects integration tests**

```bash
gh issue create \
  --title "slice-18j: add projects block to directus.integration.test.ts" \
  --body "When 18j ships the integration-test workflow polish, add an env-gated nightly test block covering /items/projects + /items/projects_services round-trips against the live cms.yesid.dev. Currently mocked-fetch tests + live smoke cover the contract." \
  --label "test" --label "slice-18j"
```

- [ ] **Step 4: Optionally file issue for N+1 services-junction performance**

```bash
gh issue create \
  --title "slice-18 follow-on: batch services M2M junction reads to avoid N+1" \
  --body "Current implementation in apps/web/src/lib/adapters/directus.ts fetches projects_services junction once per service. For ~6 services, this is fine (per-ctx memoized). When tech-stack lands and junction lookups grow, batch via service_id._in single query + group client-side. Acceptable at 18e close." \
  --label "performance" --label "slice-18-followon"
```

- [ ] **Step 5: Commit issue references in decisions.md**

Append to `decisions.md`:
```markdown
## Open follow-ups (filed as GitHub issues at close)

- #XX — Block Editor migration for projects description + sections.content (post-18f)
- #YY — scaffold-port.ts extension for M2M (slice-18k)
- #ZZ — projects integration tests (slice-18j)
- #AA — N+1 batch optimization for services M2M (follow-on)
```

(Replace `XX/YY/ZZ/AA` with actual issue numbers from the gh CLI output.)

```bash
git add docs/slices/slice-18/18e-projects/decisions.md
git commit -m "docs(slice-18 18e Phase 10 Task 40): file deferred work as GH issues"
```

---

### Task 41: Update whole-slice plan.md → 18e closed

**Files:**
- Modify: `docs/slices/slice-18/plan.md`

- [ ] **Step 1: Update status table row**

Find:
```markdown
| **18e** | Projects (+ M2M to services replacing CSV) | 🟡 in flight | 1–1.5 sessions | [18e-projects/](18e-projects/) |
```

Replace with:
```markdown
| **18e** | Projects (+ M2M to services replacing CSV) | ✅ closed YYYY-MM-DD | shipped | [18e-projects/](18e-projects/) |
```

- [ ] **Step 2: Condense § 18e section to closed-summary form** (parallel 18d's closed-summary structure)

Replace the section body with:

```markdown
## 18e — Projects (✅ closed YYYY-MM-DD)

**Scope:** First canonical content-type migration after foundations + asset pipeline. Reference pattern for 18f/18g/18h.

**Shipped:** 7 collections (projects + 4 sub-collections + projects_services M2M junction) live at cms.yesid.dev with 30+ permission rows. 6 projects + 10 junction rows seeded via `seed-projects.ts`. Adapter port (8 methods) + services adapter switched to junction reads (per-ctx memoized). `services.related_projects` CSV field dropped. /projects + /projects/[slug] + /services/[slug] all from Directus.

**Details:** see [18e-projects/research.md](18e-projects/research.md) + [decisions.md](18e-projects/decisions.md) + [spec.md](18e-projects/spec.md) + [plan.md](18e-projects/plan.md).
```

- [ ] **Step 3: Append amendments-log row**

```markdown
| YYYY-MM-DD | **18e closed.** Projects migration shipped — 7 collections + M2M junction live · 6 projects + 10 junction rows seeded · adapter port (8 methods) + services-junction switch · services.related_projects CSV dropped · all live smoke green · 4 test boundaries green. Block Editor migration deferred (filed as #XX); scaffold-port.ts extension filed as #YY for 18k. | First canonical content-type migration shipped per spec; reference pattern locked for 18f/18g/18h. | Status table + Amendments log + § 18e |
```

- [ ] **Step 4: Commit**

```bash
git add docs/slices/slice-18/plan.md
git commit -m "docs(slice-18 18e Phase 10 Task 41): mark 18e closed in whole-slice plan"
```

---

### Task 42: Open PR + verify CI green + merge

**Files:**
- (PR workflow only)

- [ ] **Step 1: Push branch**

```bash
git push -u origin feature/slice-18-18e
```

(Or whatever branch name is in use; commit prefix used `feature/slice-18` historically — confirm with `git branch -vv`.)

- [ ] **Step 2: Open PR**

```bash
gh pr create \
  --title "feat(slice-18 18e): projects migration + M2M services junction" \
  --body "$(cat <<'EOF'
## Summary

- Migrates `apps/web/src/lib/content/projects.ts` (6 projects) to Directus 11 (cms.yesid.dev). First canonical content-type migration after foundations + asset pipeline.
- Replaces `services.related_projects` CSV field with M2M junction `projects_services`.
- 7 new Directus collections (projects + 4 sub-collections + projects_services junction).
- 8 adapter port methods. Services adapter switched to junction reads (per-ctx memoized).
- Two-push pattern: schema + seed → adapter switch → CSV drop. Zero-downtime.

## Test plan

- [ ] `bun test` green in apps/cms (114+ existing + 16 new fixture/seed tests)
- [ ] `bun run test` green in apps/web (1006+ tests including 11 new contract + 9 new mocked-fetch + 1 new services regression)
- [ ] `bun run check` 0 type errors in apps/web
- [ ] `directus-sync diff` empty after both pushes
- [ ] Live smoke: /projects renders 6 projects from Directus
- [ ] Live smoke: /projects/yesid-dev (hero from R2), /projects/transit-data-pipeline (2 metrics)
- [ ] Live smoke: /services/sql-development related-projects strip via M2M
- [ ] Network tab: junction lookup memoized per service per request

## Spec + plan

- Spec: [`docs/slices/slice-18/18e-projects/spec.md`](docs/slices/slice-18/18e-projects/spec.md)
- Plan: [`docs/slices/slice-18/18e-projects/plan.md`](docs/slices/slice-18/18e-projects/plan.md)

## Deferred work (filed as GitHub issues per AGENTS.md)

- Block Editor migration (post-18f)
- scaffold-port.ts extension (18k)
- Projects integration tests (18j)
- N+1 batch optimization (follow-on)
EOF
)"
```

- [ ] **Step 3: Wait for CI**

Babysit via `gh pr checks <pr-number> --watch`.

- [ ] **Step 4: Owner review + squash-merge**

After CI green + owner approval:
```bash
gh pr merge <pr-number> --squash --delete-branch
```

- [ ] **Step 5: Update decisions.md with merge SHA**

```bash
gh pr view <pr-number> --json mergeCommit -q '.mergeCommit.oid'
```

Append to `decisions.md`:
```markdown
## Close

| Item | Value |
|---|---|
| PR | #<pr-number> |
| Merge SHA | <sha> |
| Closed date | <YYYY-MM-DD> |
```

- [ ] **Step 6: Final commit (on main, post-merge)**

(Already on main after squash-merge. No further commit needed unless decisions.md was updated post-merge.)

---

## Final acceptance gates (all must green at close)

- [ ] 7 Directus collections live with full 18-item checklist (CONVENTIONS § 2) passing on `projects` parent
- [ ] `services.related_projects` field DROPPED; M2M junction `projects_services` in place + populated
- [ ] `apps/cms/fixtures/collections/projects.json` Zod-valid + 6 projects seeded
- [ ] `seed-projects.ts` follows seed-services shape (lib/* + dry-run + reset + pure helpers)
- [ ] `directus.projects.*` 8 methods implemented with parsePort + queuedFetch + per-ctx memo where appropriate
- [ ] services adapter reads `relatedProjects` via M2M junction (memoized)
- [ ] 4 test boundaries green per CONVENTIONS § 5 (fixture-projects + seed-projects-dry-run + directus.contract + directus.mocked)
- [ ] `apps/web` `bun run check` 0 errors · `bun run test` full suite green
- [ ] Hybrid flip lands at `apps/web/src/lib/adapters/index.ts` (one-line)
- [ ] Live smoke: `/projects` + `/projects/[slug]` render from Directus; `/services/[slug]` related-projects via M2M
- [ ] `directus-sync diff` empty after both pushes
- [ ] All deferred work filed as GitHub issues
- [ ] Whole-slice plan.md updated to mark 18e closed
- [ ] PR opened + CI green + squash-merged

## Constraints + notes

- **directus-sync `_syncId` for folders/policies must be UUIDs** (18d Task 7 finding); for permissions, regular string `_syncId` works. The 7 collection definitions of projects family come from directus-sync `pull` output — do NOT hand-author `_syncId`s for those.
- **Sharp transforms still passthrough on Railway** ([#37](https://github.com/mgkdante/yesid.dev/issues/37)) — hero_image served via `?key=hero-1200` returns original bytes. Acceptable for 18e.
- **N+1 in services junction reads** — current implementation does one junction read per service. Per-ctx memoized; acceptable for ~6 services. Filed as follow-on issue.
- **Status enum mapping** — Directus uses `draft|published|archived`; consumer Project type still has `'public'|'private'|'wip'`. Adapter `toProject` translates: `published`→`public`, `draft`→`wip`, `archived`→`private`. Decoupling is intentional (consumer type stable until 18k).
- **Project.image semantics** — adapter contract change at 18e: filename → UUID. Static adapter mirrors this via `assetIdForOrUndefined`. Single consumer path uses `asset(image, preset)` helper.
