# Slice 18g — Tech Stack — Implementation Plan

> Read [spec.md](spec.md) + [decisions.md](decisions.md) first. Many patterns reused from 18f without re-derivation.

## Phase map

| Phase | Tasks | Scope |
|---|---|---|
| 1 | Probes + fixtures | P1 + P2 live probes; author fixture JSON for 34 tech items |
| 2 | Schema | Directus collections + fields + relations + permissions via directus-sync |
| 3 | Seed | `seed-tech-stack.ts` (mirrors seed-projects shape) + run live |
| 4 | Adapter | `directus.techStack.all` + `byId` + Zod schema + contract test + mocked test |
| 5 | Consumer blanking | `/tech-stack` route hides Control Room visualization area + drops layer/domain stats |
| 6 | Close | Acceptance + GH issues + memory updates + PR |

Estimated effort: **0.5 session** (the 18f migration script + BlockRenderer + adapter patterns do most of the work).

## Phase 1 — Probes + fixtures (3 tasks)

**Exit gate:** P1 + P2 documented in research.md; `apps/cms/fixtures/collections/tech-stack.json` authored with 34 entries; FK references verified.

### Task 1: P1 markdown section consistency probe

```bash
for f in apps/web/src/content/stack/*.md; do
  printf "=== %s ===\n" "$(basename "$f")"
  grep '^## ' "$f" || echo "(no H2 headings!)"
done > /tmp/p1-sections.txt
cat /tmp/p1-sections.txt
```

Document findings in `research.md § P1`. Expected: every file uses `## What it is` + `## Why I use it` + `## In Practice`. Note any deviations + plan their handling (manual rewrite, script special-case, or accept empty translation field).

### Task 2: P2 FK reference probe

Pull all `relatedServices` + `relatedProjects` slugs from markdown frontmatter; cross-check against live Directus. Document orphans in `research.md § P2`.

```bash
# Markdown side
mkdir -p /tmp/18g
for f in apps/web/src/content/stack/*.md; do
  awk '/^relatedServices:/{flag=1;next} /^[a-z_]+:/{flag=0} flag{print}' "$f"
done | grep -oE '[a-z0-9-]+' | sort -u > /tmp/18g/md-services.txt
for f in apps/web/src/content/stack/*.md; do
  awk '/^relatedProjects:/{flag=1;next} /^[a-z_]+:/{flag=0} flag{print}' "$f"
done | grep -oE '[a-z0-9-]+' | sort -u > /tmp/18g/md-projects.txt

# Directus side
curl -s 'https://cms.yesid.dev/items/services?fields=id&limit=-1' \
  | bun -e "JSON.parse(require('fs').readFileSync(0,'utf-8')).data.forEach(s => console.log(s.id))" \
  | sort > /tmp/18g/cms-services.txt
curl -s 'https://cms.yesid.dev/items/projects?fields=id&limit=-1' \
  | bun -e "JSON.parse(require('fs').readFileSync(0,'utf-8')).data.forEach(p => console.log(p.id))" \
  | sort > /tmp/18g/cms-projects.txt

# Diff
echo "=== md-services not in cms-services ===" && comm -23 /tmp/18g/md-services.txt /tmp/18g/cms-services.txt
echo "=== md-projects not in cms-projects ===" && comm -23 /tmp/18g/md-projects.txt /tmp/18g/cms-projects.txt
```

Orphans → fix in fixture authoring (Task 3) by dropping the offending references.

### Task 3: Hand-author `apps/cms/fixtures/collections/tech-stack.json`

Use `migrate-markdown-to-blocks` from 18f as the body conversion engine, but author the parent + translations rows directly in the fixture file (no separate `migrate-tech-stack.ts` — fixture IS the source of truth post-migration).

Fixture row shape (per item):

```json
{
  "id": "airflow",
  "name": "Apache Airflow",
  "icon": "airflow",
  "status": "published",
  "sort": 1,
  "lang": "en",
  "translation": {
    "languages_code": "en",
    "what_it_is": { "time": 0, "version": "2.31.2", "blocks": [...] },
    "what_i_use_it_for": { "time": 0, "version": "2.31.2", "blocks": [...] },
    "why_i_use_it_instead": { "time": 0, "version": "2.31.2", "blocks": [...] }
  },
  "related_services": ["data-pipeline"],
  "related_projects": ["transit-data-pipeline"]
}
```

Generation strategy: write a one-off node script `apps/cms/scripts/generate-tech-stack-fixture.ts` that:

1. Reads each `apps/web/src/content/stack/*.md`
2. Parses frontmatter (gray-matter or similar)
3. Splits body on `## What it is` / `## In Practice` / `## Why I use it` H2 markers
4. Calls `migrateMarkdownToBlocks(sectionMarkdown)` from 18f for each section
5. Filters orphan FK references per P2 findings
6. Emits `apps/cms/fixtures/collections/tech-stack.json` with 34 entries

This script is committed but not part of the seed runtime (one-off generation). Re-run on demand if markdown bodies change before the static path is deleted.

Acceptance: fixture JSON parses through Zod (`TechStackFixtureSchema` to be added in Phase 4); no orphan FK refs.

```bash
git add apps/cms/scripts/generate-tech-stack-fixture.ts apps/cms/fixtures/collections/tech-stack.json
git commit -m "feat(slice-18 18g Phase 1): generate tech-stack fixture from 34 markdown files"
```

## Phase 2 — Schema (1 task)

**Exit gate:** `tech_stack` + `tech_stack_translations` + `tech_stack_services` + `tech_stack_projects` collections live; `bun run sync:diff` clean; permissions matrix matches 18f blog_posts shape.

### Task 4: Author Directus schema via directus-sync

Mirror the 18f `blog_posts_translations` + 18e `projects_services` patterns. Files to create under `apps/cms/directus/snapshot/`:

- `collections/tech_stack.json` (parent collection)
- `collections/tech_stack_translations.json`
- `collections/tech_stack_services.json` (junction)
- `collections/tech_stack_projects.json` (junction)
- `fields/tech_stack/{id,name,icon,status,sort}.json` (5 files)
- `fields/tech_stack_translations/{id,tech_stack_id,languages_code,what_it_is,what_i_use_it_for,why_i_use_it_instead}.json` (6 files)
- `fields/tech_stack_services/{id,tech_stack_id,services_id}.json` (3 files)
- `fields/tech_stack_projects/{id,tech_stack_id,projects_id}.json` (3 files)
- `relations/tech_stack_translations/{tech_stack_id,languages_code}.json` (2 files)
- `relations/tech_stack_services/{tech_stack_id,services_id}.json` (2 files)
- `relations/tech_stack_projects/{tech_stack_id,projects_id}.json` (2 files)
- `permissions/_sync_perm_tech_stack_*.json` (~15 rows: ai-editor + human-editor + Public × CRUD × 4 collections)

Use `apps/cms/scripts/scaffold-port.ts --collection tech_stack --has-translations --m2m services,projects` if it supports M2M flag, OR copy from blog_posts + projects_services as templates and edit.

After authoring:

```bash
cd apps/cms
bun run sync:push
bun run sync:diff   # must be silent
```

Commit:

```bash
git add apps/cms/directus/snapshot/
git commit -m "feat(slice-18 18g Phase 2): tech_stack schema (parent + translations + 2 M2M junctions + permissions)"
```

## Phase 3 — Seed (2 tasks)

**Exit gate:** all 34 tech items live in Directus with translations + junction rows; verifiable via Public reads.

### Task 5: `apps/cms/scripts/seed-tech-stack.ts`

Mirror `seed-projects.ts` shape (lib/* helpers + Zod fixture + dry-run + reset + pure helpers + parseFlags + main + import.meta.main guard).

Body validation: same Zod-embedding workaround discovered in 18f Phase 7 — use `z.unknown()` for Block Editor body fields in fixture row schema; validate per-translation via `BlockEditorDocSchema.safeParse()` after parent parse.

```bash
git add apps/cms/scripts/seed-tech-stack.ts apps/cms/tests/seed-tech-stack-dry-run.test.ts
git commit -m "feat(slice-18 18g Phase 3 Task 5): seed-tech-stack.ts (Editor.js bodies, M2M junction rows)"
```

### Task 6: Run seed live + verify

From repo root (per 18f Phase 8 lesson — relative paths in fixture resolve from cwd=repo-root):

```bash
bun run apps/cms/scripts/seed-tech-stack.ts --dry-run | head -40
bun run apps/cms/scripts/seed-tech-stack.ts
```

Expected log: 34 tech items created with M2M junction counts (e.g. `airflow services=1 projects=1`).

Verify counts:

```bash
echo -n "tech_stack: " && curl -s 'https://cms.yesid.dev/items/tech_stack?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data?.length ?? 'ERROR')"
echo -n "tech_stack_translations: " && curl -s 'https://cms.yesid.dev/items/tech_stack_translations?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data?.length ?? 'ERROR')"
echo -n "tech_stack_services: " && curl -s 'https://cms.yesid.dev/items/tech_stack_services?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data?.length ?? 'ERROR')"
echo -n "tech_stack_projects: " && curl -s 'https://cms.yesid.dev/items/tech_stack_projects?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data?.length ?? 'ERROR')"
```

Expected: 34, 34, ≈40-50 (services junction), ≈20-30 (projects junction). Exact counts depend on P2 orphan filtering.

No commit — operates on live state.

## Phase 4 — Adapter (3 tasks)

**Exit gate:** `directus.techStack.all` + `byId` work via live reads with `parsePort` guards; contract + mocked tests pass; `bun run check` 0 errors.

### Task 7: Add `TechStackItem` type + Zod schema

Update `packages/shared/src/types/content.ts`:

The existing `TechStackItem` interface has `layer`, `domains`, `connectsTo`, `connectionNotes`, `proficiency` fields. **Strip these.** New shape:

```ts
export interface TechStackItem {
  id: string;
  name: string;          // International — flat string
  icon: string;
  // 18g/AM: layer, domains, connectsTo, proficiency, connectionNotes ALL DROPPED
  what_it_is: LocalizedBlockEditorDoc;
  what_i_use_it_for: LocalizedBlockEditorDoc;
  why_i_use_it_instead: LocalizedBlockEditorDoc;
  relatedServices: string[];   // service ids — kept name unchanged
  relatedProjects: string[];   // project ids
}
```

Drop `TechRelation` and `StackScenario` interfaces (no longer used). Update `apps/web/src/lib/types` re-exports if needed.

Add Zod schema at `apps/web/src/lib/schemas/tech-stack.ts` mirroring `BlogPostSchema` shape — flat name + 3 `LocalizedBlockEditorDocSchema` body fields + 2 string[] fields.

```bash
git commit -am "feat(slice-18 18g Phase 4 Task 7): TechStackItem type — strip layer/domains/connectsTo/proficiency, add 3 Block Editor body fields"
```

### Task 8: Implement `directus.techStack.all` + `byId`

In `apps/web/src/lib/adapters/directus.ts`, add:

```ts
interface DirectusTechStackTranslation {
  languages_code: 'en' | 'fr' | 'es';
  what_it_is: BlockEditorDoc | null;
  what_i_use_it_for: BlockEditorDoc | null;
  why_i_use_it_instead: BlockEditorDoc | null;
}

interface DirectusTechStackRow {
  id: string;
  name: string;
  icon: string | null;
  status: 'draft' | 'published' | 'archived';
  sort: number;
  translations: readonly DirectusTechStackTranslation[];
  services?: ReadonlyArray<{ services_id: string }>;
  projects?: ReadonlyArray<{ projects_id: string }>;
}

function toTechStackItem(row: DirectusTechStackRow): TechStackItem {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? '',
    what_it_is: toLocalizedBlockEditorDoc(row.translations, 'what_it_is'),
    what_i_use_it_for: toLocalizedBlockEditorDoc(row.translations, 'what_i_use_it_for'),
    why_i_use_it_instead: toLocalizedBlockEditorDoc(row.translations, 'why_i_use_it_instead'),
    relatedServices: row.services?.map((s) => s.services_id) ?? [],
    relatedProjects: row.projects?.map((p) => p.projects_id) ?? [],
  };
}
```

Implement `techStack.all`:

```ts
all: async (ctx) => {
  const fetch = queuedFetch(ctx);
  const rows = (await fetch(
    readItems('tech_stack', {
      fields: [
        'id', 'name', 'icon', 'status', 'sort',
        { translations: ['languages_code', 'what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] } as unknown as keyof DirectusTechStackRow,
        { services: ['services_id'] } as unknown as keyof DirectusTechStackRow,
        { projects: ['projects_id'] } as unknown as keyof DirectusTechStackRow,
      ],
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
      limit: -1,
    }),
  )) as unknown as DirectusTechStackRow[];
  return parsePort('techStack.all', z.array(TechStackItemSchema), rows.map(toTechStackItem));
},

byId: async (id, ctx) => {
  const fetch = queuedFetch(ctx);
  const rows = (await fetch(
    readItems('tech_stack', {
      fields: [/* same as all */],
      filter: { _and: [{ id: { _eq: id } }, { status: { _eq: 'published' } }] },
      limit: 1,
    }),
  )) as unknown as DirectusTechStackRow[];
  const item = rows[0] ? toTechStackItem(rows[0]) : undefined;
  return parsePort('techStack.byId', TechStackItemSchema.optional(), item);
},
```

The other `techStack.*` methods on the existing port interface (`byLayer`, `byDomain`, `connections`, `incomingConnections`, `outgoingRelations`, `incomingRelations`, `content`, `allScenarios`, `scenarioForDomains`) — see Task 9.

```bash
git commit -am "feat(slice-18 18g Phase 4 Task 8): directus.techStack.all + byId (M2M expansion + parsePort)"
```

### Task 9: Strip dead methods from `TechStackPort` interface

The existing interface (`apps/web/src/lib/adapters/types.ts`) has 11 methods:
`all`, `byId`, `byLayer`, `byDomain`, `connections`, `incomingConnections`, `outgoingRelations`, `incomingRelations`, `content`, `allScenarios`, `scenarioForDomains`.

Per Q1+Q2+Q3, drop everything except `all`, `byId`, `content`. The remaining 8 methods correspond to data shapes that no longer exist (layer, domain, connections, scenarios).

Required edits:
- `apps/web/src/lib/adapters/types.ts`: shrink `TechStackPort` interface to `all`, `byId`, `content`
- `apps/web/src/lib/adapters/static.ts`: remove deleted method implementations from static port (their backing data in `tech-stack.ts` may stay until 18k consumer cleanup)
- `apps/web/src/lib/adapters/directus.ts`: same — only implement `all`, `byId`, `content`
- Any consumer that called the removed methods: stub or remove (likely zero callers after Phase 5 consumer blanking)

`content` method (returns markdown body for a single tech) — keep for now since it's a Block Editor body fetch by id; map to `byId` returning the 3 body fields.

Add contract tests + mocked tests in `apps/web/src/lib/adapters/directus.contract.test.ts` + `directus.mocked.test.ts` for the new shape.

```bash
git commit -am "feat(slice-18 18g Phase 4 Task 9): shrink TechStackPort to all/byId/content; drop layer/domain/connection/scenario methods"
```

## Phase 5 — Consumer blanking (2 tasks)

**Exit gate:** `/tech-stack` route returns 200; visualization area renders nothing or a placeholder; layer/domain stats hidden; `bun run check` 0 errors.

### Task 10: Update `/tech-stack` route components

Inspect the page components:

```bash
ls apps/web/src/routes/tech-stack/
ls apps/web/src/lib/components/stack/   # if it exists
```

Identify which components render the Control Room visualization (likely a `StackBoard.svelte` or `ControlRoom.svelte` component). For each:

- If it reads `getAllTechItems()` + groups by `layer` — replace render with empty `<div class="control-room-placeholder"></div>` or hide via `{#if false}`
- Stats counters — drop or default to `0`/hidden
- Connection lines — remove SVG path rendering (was driven by `connections()` method which is now gone)

Hero + meta + footer CTA stay.

If `tech-stack.ts` static path is still imported by these components, keep imports working but the data they return is now ignored (consumer renders nothing). Static path becomes orphan data temporarily.

```bash
git commit -am "feat(slice-18 18g Phase 5 Task 10): /tech-stack Control Room visualization area renders nothing"
```

### Task 11: Drop dead static helpers from `apps/web/src/lib/content/tech-stack.ts`

The file has many helpers (`getAllTechItems`, `getTechRelations`, `getStackScenarios`, etc.). Mark with `@deprecated` JSDoc but keep them callable so any incidentally-still-imported callers don't break.

DELETE the obviously-dead ones whose data shape no longer exists:
- `getTechRelations` (no `connectsTo` data)
- `getStackScenarios` (no scenarios collection)
- Any `connections`/`relations`/`scenarios` helpers

KEEP (with `@deprecated` tag pointing to the new adapter):
- `getAllTechItems` — degrades to returning items without layer/domain/connectsTo. Static markdown bodies stay temporarily.

```bash
git commit -am "feat(slice-18 18g Phase 5 Task 11): drop dead tech-stack static helpers; @deprecate the remaining"
```

## Phase 6 — Close (3 tasks)

**Exit gate:** PR open with summary; GH issues filed; memory updated.

### Task 12: Acceptance run

```bash
cd apps/web && bun run check 2>&1 | tail -10  # 0 errors expected
cd apps/web && bun run test 2>&1 | tail -10   # baseline + new contract tests
cd apps/cms && bun test 2>&1 | tail -10       # baseline + new seed dry-run tests
```

Live spot check via curl: `/tech-stack` returns 200, body has hero + meta + empty visualization area.

### Task 13: File GH issues

- **Honeycomb dashboard redesign** — per `decisions.md § Open follow-ups`. Reference user vision (2026-04-27 quote). ~1-1.5 sessions.
- **Static `apps/web/src/lib/content/tech-stack.ts` deletion** — depends on consumer redesign first; 18k.
- **Static markdown deletion** (`apps/web/src/content/stack/*.md` + `scenarios/*.md`) — 18k.

### Task 14: Memory + close ceremony

- Update `~/.claude/projects/.../memory/project_completed_slices.md`: add 18g row
- Update `project_slice_18.md`: mark 18g closed, advance 18h to next-up
- Update `docs/slices/slice-18/plan.md`: 18g status flipped to ✅ closed
- Push branch, open PR, merge

## Acceptance gates summary

- [ ] All 4 collections (`tech_stack` + 3 sub) live in Directus
- [ ] 34 items + ≈34 translations + ≈40-50 service junctions + ≈20-30 project junctions seeded
- [ ] `directus.techStack.all` + `byId` work via Public reads
- [ ] `bun run check` 0 errors
- [ ] apps/web tests + apps/cms tests pass with no regressions
- [ ] `/tech-stack` route 200 OK with empty visualization area
- [ ] 3 GH issues filed + memory + plan synced
- [ ] PR merged
