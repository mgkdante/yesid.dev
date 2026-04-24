# Slice 18d — Asset Pipeline + Lottie Retirement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 14 in-use static images from `apps/web/static/images/` into Directus + R2; install 4 (or 7) saved presets; emit `assets-id-map.json` for 18e–18i consumption; flip the metro-SVG consumer to fetch from Directus; retire Lottie completely (1.1 MB dead JSON + LottiePlayer + dep + field plumbing).

**Architecture:** Schema-first (one directus-sync push lands `legacy_path` + 6 folders + presets + drops `lottie_reverse`); retrofit existing pre-18c migrate-assets.ts onto `scripts/lib/*` helpers + `legacy_path` idempotency; new `seed-presets.ts` patches `directus_settings.storage_asset_presets`; bootstrap-then-batch upload sequencing lets P8 AVIF probe run on a single 12 KB file before committing to the full batch; consumer flip replaces `?raw` build-inline with Directus fetch + `{@html svg}` (CSS-color-friendly preserved).

**Tech Stack:** Bun 1.3.11 · @directus/sdk@^20 · Zod · Bottleneck · directus-sync (Dockerfile-shipped) · Cloudflare R2 (s3 driver) · 1Password CLI · Vitest/bun:test · SvelteKit 2 + Svelte 5.

**Spec:** [docs/superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md](../../superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md)

---

## Prerequisites

- Working tree clean on `feature/slice-18` (or `main`); 18c merged
- `bun --version` ≥ 1.3.11
- `op --version` (1Password CLI installed)
- `bunx directus-sync --version` resolves
- Live `cms.yesid.dev` healthy (curl `/server/health` returns 200)

**Auth pattern (used by every live phase):**

```bash
export DIRECTUS_ADMIN_TOKEN=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export PUBLIC_DIRECTUS_URL='https://cms.yesid.dev'
```

---

## File Structure

### Create

| Path | Purpose |
|---|---|
| `docs/slices/slice-18/18d-asset-pipeline/research.md` | Probe P8 AVIF result, R2 layout finding, directus-sync settings-blob behavior |
| `docs/slices/slice-18/18d-asset-pipeline/decisions.md` | Decision log (one row per § 3 decision A–F from spec) |
| `apps/cms/directus/fields/directus_files/legacy_path.json` | Custom field schema (string, unique-on-non-null, indexed) |
| `apps/cms/scripts/seed-presets.ts` | Pushes `directus_settings.storage_asset_presets` from fixture |
| `apps/cms/scripts/lib/schemas/presets.ts` | Zod `PresetsSchema` |
| `apps/cms/fixtures/brand/presets.json` | 4 presets (5 if AVIF probe green: 4 + 3 AVIF variants = 7) |
| `apps/cms/fixtures/assets-id-map.json` | Emitted by migrate-assets; legacyPath → UUID map |
| `apps/cms/tests/migrate-assets.test.ts` | Unit tests for new pure helpers |
| `apps/cms/tests/seed-presets.test.ts` | Unit tests for `buildPresetPayload` + Zod gate |
| `apps/cms/tests/brand-presets-fixture.test.ts` | Round-trip fixture through Zod |
| `apps/cms/tests/assets-id-map.test.ts` | Schema validation + ordering + UUID format |
| `packages/shared/fixtures/assets-id-map.json` | Re-export of CMS fixture (sync-script writes; tracked) |
| `packages/shared/src/assets.ts` | Typed `assetIdFor(legacyPath)` helper |

### Modify

| Path | Change |
|---|---|
| `apps/cms/scripts/migrate-assets.ts` | Retrofit: `scripts/lib/*` wiring + `legacy_path` idempotency + `--reset` + monorepo source path + new pure helpers |
| `apps/cms/fixtures/assets-manifest.json` | Triage 19 → 14 entries; declare all 6 folders; prefix `legacyPath` values with `images/` |
| `apps/cms/tests/assets-manifest.test.ts` | Update count expectations; add `images/` prefix assertion |
| `apps/cms/directus/collections/folders.json` | Add 6 folders |
| `apps/cms/directus/collections/settings.json` | Add `storage_asset_presets` array |
| `apps/cms/directus/collections/permissions.json` | Public policy `directus_files.read` folder-scoped |
| `apps/cms/scripts/seed-services.ts` | Remove `lottie_reverse` from row type + builder |
| `apps/cms/fixtures/collections/services.json` | Remove `lottieReverse: true` from `sql-development` |
| `apps/cms/tests/seed-dry-run.test.ts` | Drop `lottie_reverse` expectations |
| `apps/cms/package.json` | Add `migrate:assets` + `seed:presets` scripts |
| `apps/web/package.json` | Remove `lottie-web` dep |
| `apps/web/src/lib/adapters/directus.ts` | Add `content.metroSvg(ctx?)`; remove `lottieReverse` row + mapping |
| `apps/web/src/lib/adapters/directus.contract.test.ts` | Remove `lottieReverse` block; existing structure preserved |
| `apps/web/src/lib/adapters/directus.mocked.test.ts` | Add `content.metroSvg` mocked-fetch assertion |
| `apps/web/src/lib/schemas/service.ts` | Remove `lottieReverse` field |
| `apps/web/src/lib/content/services.ts` | Remove `lottieReverse: true` line |
| `apps/web/src/lib/motion/svg/MetroNetwork.svelte` | Replace `?raw` import with `svg` prop |
| `apps/web/src/routes/+page.server.ts` (or whichever route renders MetroNetwork — confirmed in Task 28) | Add `metroSvg` to load |
| `apps/web/src/tests/setup.dom.ts:71` | Update comment (IntersectionObserver stub keeps if other consumers) |
| `apps/web/src/lib/components/home/HeroBanner.svelte:3` | Fix stale `montreal_map.svg` reference |
| `packages/shared/src/types/content.ts` | Remove `lottieReverse?: boolean` from `Service` |
| `packages/shared/src/index.ts` | Export `assetIdFor` |
| `docs/slices/slice-18/CONVENTIONS.md § 9` | `thumb-300` → `thumb-240`; AVIF status note |
| `docs/slices/slice-18/plan.md` | 18d shipped row + Amendments log entry |

### Delete

| Path | Notes |
|---|---|
| `apps/web/src/lib/motion/components/LottiePlayer.svelte` | Zero production consumers |
| `apps/web/src/lib/motion/components/LottiePlayer.test.ts` | Tests the dead component |
| `apps/web/static/lottie/station-{analytics,performance,pipeline,sql}.json` | 4 files, ~540 KB |
| `apps/web/src/lib/assets/lottie/station-{analytics,performance,pipeline,sql}.json` | 4 files, ~540 KB (byte-identical duplicate of static/) |
| `apps/web/src/content/stack/lottie.md` | Tech-stack article describing dead feature |
| `apps/web/static/images/hero-station-art.png` | 2.6 MB; not referenced |
| `apps/web/static/images/hero-station-art.webp` | 168 KB; not referenced |
| `apps/web/static/images/metro-network-ref.svg` | 320 KB; design reference, not referenced |
| `apps/web/static/images/montreal_map.jpg` | 1.3 MB; only in stale doc comment |
| `apps/web/static/images/montreal-metro.source.svg` | 24 KB; Figma export source |
| `apps/cms/directus/snapshot/fields/services/lottie_reverse.json` | Field schema for dropped column |

---

## Phase 1 — Pre-flight (Tasks 1–2)

### Task 1: Create sub-slice bundle scaffolds

**Files:**
- Create: `docs/slices/slice-18/18d-asset-pipeline/research.md`
- Create: `docs/slices/slice-18/18d-asset-pipeline/decisions.md`

- [ ] **Step 1: Write `research.md` scaffold**

```markdown
# 18d — Research

> Probe findings + live-state observations. Populated as work progresses; finalized at close.

## P8 — AVIF support

**Status:** Pending — runs in Task 21 (post first upload).

**Method:** `curl -I https://cms.yesid.dev/assets/<headshot-uuid>?format=avif`

**Result:** _TBD (Task 21)_

**Decision:** _TBD — green → add 3 AVIF variants in Task 22; red → defer to post-Directus-12._

---

## directus-sync `storage_asset_presets` diff behavior

**Status:** Pending — finalized in Task 7 + Task 19.

**Question:** Is the `storage_asset_presets` JSON in `directus/collections/settings.json` array-replace, array-merge, or per-entry diffable?

**Result:** _TBD_

**Decision:** _TBD — affects whether seed-presets.ts can co-exist with directus-sync, or whether one wins exclusively._

---

## R2 bucket layout (key naming)

**Status:** Pending — observed in Task 20 (first upload).

**Question:** Does Directus s3 driver write to flat UUID keys, or folder-prefixed keys?

**Result:** _TBD_

**Decision:** _Documentation-only — affects rollback runbook and future migrate-out scripts; no design change either way._
```

- [ ] **Step 2: Write `decisions.md` scaffold**

```markdown
# 18d — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| A1 | hero-station-art duplicate (PNG + WebP): both deleted | Brainstorm 2026-04-24 | locked |
| A2 | montreal-metro.source.svg: deleted | Brainstorm 2026-04-24 | locked |
| A3 | brand logo/favicon: deferred to 18l | Brainstorm 2026-04-24 | locked |
| A4 | folder map: 14 files across 3 populated (about=12, brand=1, projects=1) + 3 empty | Brainstorm 2026-04-24 | locked |
| A5 | upload as-is (no Sharp re-encode) | Brainstorm 2026-04-24 | locked |
| B1 | `legacy_path` shape: `images/<full-relative-path>` | Brainstorm 2026-04-24 | locked |
| B2 | alt text: derived default + editor override (not publish-blocking in 18d) | Brainstorm 2026-04-24 | locked |
| B5 | AVIF probe: bootstrap 1 file → probe → branch | Brainstorm 2026-04-24 | locked |
| C1 | migration: resumable, not atomic; --reset deletes by legacy_path | Brainstorm 2026-04-24 | locked |
| C4 | manifest is single source of truth for folder/alt overrides | Brainstorm 2026-04-24 | locked |
| D | montreal-metro.svg: migrate + flip consumer in 18d | Brainstorm 2026-04-24 | locked |
| E | Lottie: full retirement in 18d | Brainstorm 2026-04-24 | locked |
| F | Approach A (schema-first) with B-borrow (bootstrap probe before full batch) | Brainstorm 2026-04-24 | locked |

## Amendments

_None yet._
```

- [ ] **Step 3: Verify files created**

```bash
ls -la docs/slices/slice-18/18d-asset-pipeline/
```

Expected: `research.md` and `decisions.md` present.

**Acceptance check:** Both files exist with their § headings populated.

### Task 2: Verify tooling + auth

- [ ] **Step 1: Run version checks**

```bash
bun --version
op --version
bunx directus-sync --version
git status
```

Expected: bun ≥ 1.3.11 · op present · directus-sync resolves · working tree clean (or only the two new doc files staged).

- [ ] **Step 2: Verify 1Password admin token resolves**

```bash
op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password' | head -c 10
```

Expected: 10 characters of token printed (don't log the full token). If empty, abort and fix 1Password vault state.

- [ ] **Step 3: Verify CMS health**

```bash
curl -s https://cms.yesid.dev/server/health | head -c 100
```

Expected: JSON body starting with `{"status":"ok"...`.

- [ ] **Step 4: Commit pre-flight scaffolds**

```bash
git add docs/slices/slice-18/18d-asset-pipeline/
git commit -m "docs(slice-18 18d Task 1-2): pre-flight scaffolds for asset pipeline sub-slice"
```

**Acceptance check:** Commit lands; `git log --oneline -1` shows the new commit.

---

## Phase 2 — Schema push (Tasks 3–7)

### Task 3: Pre-zero `lottie_reverse` field on live data

**Why:** Phase 2 drops the column. Live `services.sql-development` row has `lottie_reverse: true`. Directus may refuse the drop with non-null data depending on directus-sync's destructive guards.

- [ ] **Step 1: Confirm which rows have non-null `lottie_reverse`**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/items/services?fields=id,lottie_reverse&filter[lottie_reverse][_nnull]=true&limit=-1"
```

Expected: JSON `{"data": [{"id": "sql-development", "lottie_reverse": true}]}` or similar singleton.

- [ ] **Step 2: Null the field for matching rows**

```bash
curl -s -X PATCH -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lottie_reverse": null}' \
  "https://cms.yesid.dev/items/services/sql-development"
```

Expected: 200 with the updated row.

- [ ] **Step 3: Verify field nulled**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/items/services?fields=id,lottie_reverse&filter[lottie_reverse][_nnull]=true&limit=-1"
```

Expected: `{"data": []}`.

**Acceptance check:** No service row has non-null `lottie_reverse`.

### Task 4: Author `legacy_path` field schema

**Files:**
- Create: `apps/cms/directus/fields/directus_files/legacy_path.json`

- [ ] **Step 1: Inspect existing directus_files field shape**

```bash
ls apps/cms/directus/fields/directus_files/ 2>/dev/null || echo "no existing files-folder"
```

If folder doesn't exist, `mkdir -p apps/cms/directus/fields/directus_files`.

- [ ] **Step 2: Author the field JSON**

Look at an existing field for shape reference: `cat apps/cms/directus/snapshot/fields/services/icon.json` (or similar). Then write:

```json
{
	"collection": "directus_files",
	"field": "legacy_path",
	"type": "string",
	"meta": {
		"interface": "input",
		"hidden": false,
		"readonly": true,
		"width": "full",
		"note": "Idempotency key for migrate-assets (slice-18d). Set by the migration script; do NOT edit post-migration. Format: `images/<relative-path-from-static>`.",
		"display": null,
		"display_options": null,
		"options": null,
		"sort": null,
		"required": false,
		"_syncId": "_sync_field_directus_files_legacy_path"
	},
	"schema": {
		"data_type": "varchar",
		"max_length": 512,
		"is_nullable": true,
		"is_unique": true,
		"is_indexed": true,
		"default_value": null
	}
}
```

Notes: `is_unique: true` paired with `is_nullable: true` → unique on non-null values (Postgres standard). Editor uploads leave NULL; migration writes value; collisions caught by index.

**Acceptance check:** File parses as JSON; `cat apps/cms/directus/fields/directus_files/legacy_path.json | bun -e 'JSON.parse(await Bun.stdin.text())' && echo OK` prints `OK`.

### Task 5: Update `folders.json` with 6 content folders

**Files:**
- Modify: `apps/cms/directus/collections/folders.json`

- [ ] **Step 1: Read current state**

```bash
cat apps/cms/directus/collections/folders.json
```

If file is `[]` (empty), prepare to overwrite. If folders already exist, append (don't replace).

- [ ] **Step 2: Author folder entries**

Replace file with:

```json
[
	{
		"name": "services",
		"parent": null,
		"_syncId": "_sync_folder_services"
	},
	{
		"name": "projects",
		"parent": null,
		"_syncId": "_sync_folder_projects"
	},
	{
		"name": "blog",
		"parent": null,
		"_syncId": "_sync_folder_blog"
	},
	{
		"name": "brand",
		"parent": null,
		"_syncId": "_sync_folder_brand"
	},
	{
		"name": "about",
		"parent": null,
		"_syncId": "_sync_folder_about"
	},
	{
		"name": "og",
		"parent": null,
		"_syncId": "_sync_folder_og"
	}
]
```

If pre-existing folders are present, MERGE rather than overwrite — append the missing names with `_syncId` prefixed `_sync_folder_<name>`.

**Acceptance check:** `bun -e "JSON.parse(await Bun.file('apps/cms/directus/collections/folders.json').text()).length"` returns ≥ 6.

### Task 6: Update `settings.json` with `storage_asset_presets`

**Files:**
- Modify: `apps/cms/directus/collections/settings.json`

- [ ] **Step 1: Read current settings**

```bash
cat apps/cms/directus/collections/settings.json | head -50
```

Expect a single object (Directus singleton). The `storage_asset_presets` field may be `null`, `[]`, or absent.

- [ ] **Step 2: Patch in the 4 presets**

Edit the JSON to set:

```json
"storage_asset_presets": [
	{ "key": "hero-1200", "fit": "contain", "width": 1200, "format": "webp", "quality": 85, "withoutEnlargement": true },
	{ "key": "card-600",  "fit": "contain", "width": 600,  "format": "webp", "quality": 80, "withoutEnlargement": true },
	{ "key": "thumb-240", "fit": "cover",   "width": 240,  "height": 240, "format": "webp", "quality": 75 },
	{ "key": "og-1200",   "fit": "cover",   "width": 1200, "height": 630, "format": "jpg",  "quality": 85 }
]
```

(AVIF variants append after Task 21 if probe green.)

- [ ] **Step 3: Verify JSON parses**

```bash
bun -e "JSON.parse(await Bun.file('apps/cms/directus/collections/settings.json').text()).storage_asset_presets.length"
```

Expected: `4`.

**Acceptance check:** Settings JSON parses; `storage_asset_presets` array has 4 entries with the expected `key` values.

### Task 7: Push schema + verify diff empty

- [ ] **Step 1: Delete the obsolete `lottie_reverse` field schema**

```bash
rm apps/cms/directus/snapshot/fields/services/lottie_reverse.json
```

- [ ] **Step 2: Dry-run directus-sync push to preview the diff**

```bash
cd apps/cms
bunx directus-sync diff --url https://cms.yesid.dev --token $DIRECTUS_ADMIN_TOKEN
```

Expected diff: ADD `legacy_path` field on `directus_files` · ADD 6 folders · UPDATE `directus_settings` with new presets · DELETE `services.lottie_reverse` field. No other changes.

- [ ] **Step 3: Push schema**

```bash
bunx directus-sync push --url https://cms.yesid.dev --token $DIRECTUS_ADMIN_TOKEN
```

Expected: success messages for each diff entry; non-zero exit if anything fails.

- [ ] **Step 4: Re-run diff to confirm empty**

```bash
bunx directus-sync diff --url https://cms.yesid.dev --token $DIRECTUS_ADMIN_TOKEN
```

Expected output: "No differences detected" or equivalent.

- [ ] **Step 5: Live spot-checks**

```bash
# Folders
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/folders?fields=name&limit=-1" | bun -e "console.log(JSON.parse(await Bun.stdin.text()).data.map(f=>f.name).sort())"

# Settings (preset count)
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/settings?fields=storage_asset_presets" | bun -e "console.log(JSON.parse(await Bun.stdin.text()).data.storage_asset_presets?.length ?? 0)"

# legacy_path field
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/fields/directus_files/legacy_path" | head -c 200
```

Expected: 6 folder names (alphabetical), preset count = 4, `legacy_path` field returns 200 with shape.

- [ ] **Step 6: Document directus-sync settings-blob behavior in research.md**

Open `docs/slices/slice-18/18d-asset-pipeline/research.md` § "directus-sync `storage_asset_presets` diff behavior" — fill in observed result (e.g., "Settings is one blob; presets array replaced wholesale; diff reads cleanly as one UPDATE entry. → use directus-sync; no SDK seed needed.").

- [ ] **Step 7: Commit phase 2**

```bash
git add apps/cms/directus/ docs/slices/slice-18/18d-asset-pipeline/research.md
git commit -m "feat(slice-18 18d Task 3-7): schema push — legacy_path field + 6 folders + 4 presets + drop lottie_reverse"
```

**Acceptance check:** `directus-sync diff` returns empty; live API confirms 6 folders, 4 presets, `legacy_path` field, no `lottie_reverse` column.

---

## Phase 3 — Manifest retrofit (Tasks 8–9)

### Task 8: Triage `assets-manifest.json` to 14 entries

**Files:**
- Modify: `apps/cms/fixtures/assets-manifest.json`

- [ ] **Step 1: Replace file contents**

Overwrite `apps/cms/fixtures/assets-manifest.json` with:

```json
{
	"description": "Asset migration manifest for Slice 18 18d. Each entry maps an apps/web/static/<path> to its target Directus folder + metadata. Consumed by scripts/migrate-assets.ts.",
	"sourceRoot": "apps/web/static",
	"folders": {
		"services": "Service-detail page assets — populated by 18e+.",
		"projects": "Project cover images + detail-page heroes.",
		"blog": "Blog post assets — populated by 18f.",
		"brand": "Site-chrome assets — hero art, metro illustrations, logo (18l).",
		"about": "About-page assets — headshot, interests, logos, polaroids.",
		"og": "OG-share images per route — populated by 18h."
	},
	"assets": [
		{
			"legacyPath": "images/montreal-metro.svg",
			"folder": "brand",
			"title": "Montreal metro map",
			"description": "Stylized Montreal metro map illustration; visual anchor for the services-as-stations metaphor."
		},
		{
			"legacyPath": "images/about/headshot.webp",
			"folder": "about",
			"title": "Headshot — Yesid",
			"description": "Portrait photograph of Yesid; used as the primary author image on the /about page."
		},
		{
			"legacyPath": "images/about/polaroid-1.webp",
			"folder": "about",
			"title": "Polaroid — Montreal 1",
			"description": "Decorative polaroid photograph used in the /about page polaroid strip."
		},
		{
			"legacyPath": "images/about/polaroid-2.webp",
			"folder": "about",
			"title": "Polaroid — Montreal 2",
			"description": "Decorative polaroid photograph used in the /about page polaroid strip."
		},
		{
			"legacyPath": "images/about/polaroid-3.webp",
			"folder": "about",
			"title": "Polaroid — Montreal 3",
			"description": "Decorative polaroid photograph used in the /about page polaroid strip."
		},
		{
			"legacyPath": "images/about/interests/anime.webp",
			"folder": "about",
			"title": "Interests — anime",
			"description": "Decorative illustration representing Yesid's interest in anime; used in the /about page interests grid."
		},
		{
			"legacyPath": "images/about/interests/dataviz.webp",
			"folder": "about",
			"title": "Interests — data visualization",
			"description": "Decorative illustration representing Yesid's interest in data visualization; used in the /about page interests grid."
		},
		{
			"legacyPath": "images/about/interests/food.webp",
			"folder": "about",
			"title": "Interests — food",
			"description": "Decorative illustration representing Yesid's interest in food; used in the /about page interests grid."
		},
		{
			"legacyPath": "images/about/interests/opensource.webp",
			"folder": "about",
			"title": "Interests — open source",
			"description": "Decorative illustration representing Yesid's interest in open-source contribution; used in the /about page interests grid."
		},
		{
			"legacyPath": "images/about/logo-1.svg",
			"folder": "about",
			"title": "Company logo 1 (anonymized)",
			"description": "Anonymized company logo placeholder in the /about page career-history strip."
		},
		{
			"legacyPath": "images/about/logo-2.svg",
			"folder": "about",
			"title": "Company logo 2 (anonymized)",
			"description": "Anonymized company logo placeholder in the /about page career-history strip."
		},
		{
			"legacyPath": "images/about/logo-3.svg",
			"folder": "about",
			"title": "Company logo 3 (anonymized)",
			"description": "Anonymized company logo placeholder in the /about page career-history strip."
		},
		{
			"legacyPath": "images/about/logo-4.svg",
			"folder": "about",
			"title": "Company logo 4 (anonymized)",
			"description": "Anonymized company logo placeholder in the /about page career-history strip."
		},
		{
			"legacyPath": "images/work/yesid-dev.png",
			"folder": "projects",
			"title": "yesid.dev — cover screenshot",
			"description": "Cover screenshot of the yesid.dev site; used on the /projects listing + project-detail page for the self-referential case study."
		}
	]
}
```

- [ ] **Step 2: Verify entry count + folder count**

```bash
bun -e "
const m = JSON.parse(await Bun.file('apps/cms/fixtures/assets-manifest.json').text());
console.log('assets:', m.assets.length, 'folders:', Object.keys(m.folders).length);
"
```

Expected: `assets: 14 folders: 6`.

**Acceptance check:** Manifest has 14 entries across 3 populated folders (about=12, brand=1, projects=1) + 3 declared-empty folders (services, blog, og); all `legacyPath` values prefixed `images/`.

### Task 9: Update `assets-manifest.test.ts` expectations

**Files:**
- Modify: `apps/cms/tests/assets-manifest.test.ts`

- [ ] **Step 1: Add new assertion blocks**

Open the file. Find the `describe('fixtures/assets-manifest.json', ...)` block. Add two new test cases inside it:

```ts
	it('declares exactly 14 assets after 18d triage', () => {
		const m = loadManifest();
		expect(m.assets.length).toBe(14);
	});

	it('declares all 6 content folders (services/projects/blog/brand/about/og)', () => {
		const m = loadManifest();
		const expected = ['services', 'projects', 'blog', 'brand', 'about', 'og'].sort();
		expect(Object.keys(m.folders).sort()).toEqual(expected);
	});

	it('every legacyPath starts with "images/" (full-path-from-static convention)', () => {
		const m = loadManifest();
		for (const entry of m.assets) {
			expect(entry.legacyPath.startsWith('images/')).toBe(true);
		}
	});
```

Also update `Task 8`'s test that previously asserted `m.sourceRoot === 'static/images'`:

```ts
	it('sourceRoot points at apps/web/static (monorepo-aware)', () => {
		const m = loadManifest();
		expect(m.sourceRoot).toBe('apps/web/static');
	});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/cms
bun test tests/assets-manifest.test.ts
```

Expected: all tests green; previous tests still pass; new assertions confirm 14 entries + 6 folders + `images/` prefix.

If pre-existing test `'returns empty string when the path is top-level'` exists with hard-coded `'hero-station-art.png'` value, update to a path that's still in the manifest or remove (not in manifest anymore).

- [ ] **Step 3: Commit phase 3**

```bash
git add apps/cms/fixtures/assets-manifest.json apps/cms/tests/assets-manifest.test.ts
git commit -m "feat(slice-18 18d Task 8-9): manifest triage to 14 entries + 6 folders + images/ prefix"
```

**Acceptance check:** `bun test tests/assets-manifest.test.ts` green; manifest has 14 entries.

---

## Phase 4 — Script retrofit: migrate-assets (Tasks 10–15)

### Task 10: Add new pure helpers to `migrate-assets.ts`

**Files:**
- Modify: `apps/cms/scripts/migrate-assets.ts`

- [ ] **Step 1: Append new helpers below `validateFolderReferences`**

Add these three exports to `apps/cms/scripts/migrate-assets.ts`, right above the `// --- Directus I/O ...` comment:

```ts
/**
 * Derive a sentence-case alt text from a filename.
 *   'headshot.webp'        → 'Headshot'
 *   'polaroid-1.webp'      → 'Polaroid 1'
 *   'logo-3.svg'           → 'Logo 3'
 *   'montreal-metro.svg'   → 'Montreal Metro'
 */
export function deriveAltText(filename: string): string {
	const base = filename.replace(/\.[^.]+$/, '');
	return base
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
}

/**
 * Partition manifest entries into { alreadyUploaded, toUpload } using a map of
 * existing files keyed by `legacy_path`. Replaces `mergeExistingFiles` (which
 * matched on description-tag); legacy_path is the new idempotency key.
 */
export function filterToUpload(
	manifest: AssetsManifest,
	existingByLegacyPath: ReadonlyMap<string, string>,
): { alreadyUploaded: Map<string, string>; toUpload: AssetEntry[] } {
	const alreadyUploaded = new Map<string, string>();
	const toUpload: AssetEntry[] = [];
	for (const entry of manifest.assets) {
		const existingId = existingByLegacyPath.get(entry.legacyPath);
		if (existingId) {
			alreadyUploaded.set(entry.legacyPath, existingId);
		} else {
			toUpload.push(entry);
		}
	}
	return { alreadyUploaded, toUpload };
}

/**
 * Build the legacyPath → uuid record for the emitted id-map fixture. Sorts
 * keys alphabetically for diff-friendliness.
 */
export function buildIdMap(
	entries: ReadonlyArray<{ legacyPath: string; id: string }>,
): Record<string, string> {
	const sorted = [...entries].sort((a, b) =>
		a.legacyPath.localeCompare(b.legacyPath),
	);
	const out: Record<string, string> = {};
	for (const e of sorted) out[e.legacyPath] = e.id;
	return out;
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd apps/cms
bun run check 2>&1 | head -20
```

If `bun run check` script is absent, run `bunx tsc --noEmit` instead. Expected: 0 errors.

**Acceptance check:** New helpers exported; type-check clean.

### Task 11: Write tests for new pure helpers

**Files:**
- Create: `apps/cms/tests/migrate-assets.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from 'bun:test';
import {
	deriveAltText,
	filterToUpload,
	buildIdMap,
	parseManifest,
} from '../scripts/migrate-assets';

describe('deriveAltText', () => {
	it('strips extension + sentence-cases single-word names', () => {
		expect(deriveAltText('headshot.webp')).toBe('Headshot');
	});

	it('splits on hyphens + sentence-cases each segment', () => {
		expect(deriveAltText('polaroid-1.webp')).toBe('Polaroid 1');
		expect(deriveAltText('montreal-metro.svg')).toBe('Montreal Metro');
		expect(deriveAltText('logo-3.svg')).toBe('Logo 3');
	});

	it('handles names without extensions', () => {
		expect(deriveAltText('plain-name')).toBe('Plain Name');
	});

	it('handles names with multiple dots', () => {
		expect(deriveAltText('archive.tar.gz')).toBe('Archive.tar');
	});
});

describe('filterToUpload', () => {
	const fakeManifest = parseManifest({
		description: 'x',
		sourceRoot: 'apps/web/static',
		folders: { about: 'x' },
		assets: [
			{ legacyPath: 'images/about/a.webp', folder: 'about', title: 'A', description: 'A long enough sentence here' },
			{ legacyPath: 'images/about/b.webp', folder: 'about', title: 'B', description: 'B long enough sentence here' },
			{ legacyPath: 'images/about/c.webp', folder: 'about', title: 'C', description: 'C long enough sentence here' },
		],
	});

	it('separates already-uploaded from to-upload by legacyPath', () => {
		const existing = new Map([
			['images/about/a.webp', 'uuid-a'],
			['images/about/c.webp', 'uuid-c'],
		]);
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, existing);
		expect(alreadyUploaded.size).toBe(2);
		expect(alreadyUploaded.get('images/about/a.webp')).toBe('uuid-a');
		expect(toUpload).toHaveLength(1);
		expect(toUpload[0]?.legacyPath).toBe('images/about/b.webp');
	});

	it('returns all-to-upload when existing map is empty', () => {
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, new Map());
		expect(alreadyUploaded.size).toBe(0);
		expect(toUpload).toHaveLength(3);
	});

	it('returns all-already-uploaded when every entry matches', () => {
		const existing = new Map(
			fakeManifest.assets.map((a, i) => [a.legacyPath, `uuid-${i}`] as const),
		);
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, existing);
		expect(alreadyUploaded.size).toBe(3);
		expect(toUpload).toHaveLength(0);
	});
});

describe('buildIdMap', () => {
	it('emits keys in alphabetical order', () => {
		const out = buildIdMap([
			{ legacyPath: 'images/z.webp', id: 'uz' },
			{ legacyPath: 'images/a.webp', id: 'ua' },
			{ legacyPath: 'images/m.webp', id: 'um' },
		]);
		expect(Object.keys(out)).toEqual(['images/a.webp', 'images/m.webp', 'images/z.webp']);
		expect(out['images/a.webp']).toBe('ua');
	});

	it('returns empty object on empty input', () => {
		expect(buildIdMap([])).toEqual({});
	});
});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/cms
bun test tests/migrate-assets.test.ts
```

Expected: all tests green; ~9-10 expect() assertions across 3 describes.

**Acceptance check:** All new tests pass.

### Task 12: Retrofit idempotency (description-tag → `legacy_path`)

**Files:**
- Modify: `apps/cms/scripts/migrate-assets.ts`

- [ ] **Step 1: Replace `mergeExistingFiles` callsite + remove its definition**

Find the existing `mergeExistingFiles` function and the block in `migrateAssets()` that calls `client.request(readFiles({ fields: ['id', 'description', 'folder'], limit: -1 }))`. Replace the entire block with:

```ts
	// Idempotency: query existing files by legacy_path (replaces description-tag
	// pattern from pre-18c version). Only files with a non-null legacy_path —
	// editor-uploaded files leave the field NULL.
	const wantedPaths = manifest.assets.map((a) => a.legacyPath);
	const existingFiles = (await client.request(
		readFiles({
			fields: ['id', 'legacy_path'],
			filter: { legacy_path: { _in: wantedPaths } },
			limit: -1,
		}),
	)) as Array<{ id: string; legacy_path: string | null }>;
	const existingByLegacyPath = new Map<string, string>();
	for (const f of existingFiles) {
		if (f.legacy_path) existingByLegacyPath.set(f.legacy_path, f.id);
	}
	const { alreadyUploaded, toUpload } = filterToUpload(manifest, existingByLegacyPath);
```

Delete the `mergeExistingFiles` function (and the `tagRe` regex, and the `buildFileDescription` helper) — `legacy_path` field replaces the description-tag pattern entirely.

- [ ] **Step 2: Update `uploadOne` to set `legacy_path` field**

Find the `uploadOne` function. Replace the `form.append('description', buildFileDescription(entry));` line with two lines that set both the editor-friendly description AND the legacy_path key:

```ts
	form.append('legacy_path', entry.legacyPath);
	form.append('description', entry.description);
	form.append('title', entry.title);
```

(Order doesn't matter; just ensure all three keys are written.)

- [ ] **Step 3: Update assets-manifest.test.ts to drop `mergeExistingFiles` references**

If `apps/cms/tests/assets-manifest.test.ts` referenced `mergeExistingFiles` or `buildFileDescription`, those imports and the corresponding `describe` blocks must be removed (the helpers no longer exist). Confirm with:

```bash
grep -nE "mergeExistingFiles|buildFileDescription" apps/cms/tests/assets-manifest.test.ts
```

Expected: no output.

If output found, edit the test file to remove those references.

- [ ] **Step 4: Type-check + run tests**

```bash
cd apps/cms
bun test tests/migrate-assets.test.ts tests/assets-manifest.test.ts
```

Expected: all green.

**Acceptance check:** `migrate-assets.ts` no longer references `description.match(tagRe)` or `buildFileDescription`; uses `filter: { legacy_path: { _in: ... } }` query.

### Task 13: Swap inline auth/client to `lib/` helpers

**Files:**
- Modify: `apps/cms/scripts/migrate-assets.ts`

- [ ] **Step 1: Add lib imports at top of file**

Replace the existing imports block (lines that currently import directly from `@directus/sdk`) with:

```ts
import {
	createDirectus,
	rest,
	staticToken,
	createFolder,
	readFolders,
	readFiles,
	uploadFiles,
} from '@directus/sdk';
import { z } from 'zod';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath, join as joinPath, relative } from 'node:path';
import { createClient as createSdkClient, defaultDirectusUrl, requireEnv } from './lib/sdk';
import { getAdminToken as getAdminTokenLib } from './lib/auth';
import { withRateLimit } from './lib/bottleneck';
import { DirectusError, parseErrors } from './lib/catch-error';
import { createLogger } from './lib/logger';
```

- [ ] **Step 2: Delete inline `getAdminToken` function**

Find the local `async function getAdminToken(directusUrl: string): Promise<string> { ... }` (~lines 179-200 in the existing file). Delete it entirely. The script will use `getAdminTokenLib` from the import.

- [ ] **Step 3: Delete inline `createClient` function**

Find the local `function createClient(directusUrl: string, token: string) { return createDirectus(directusUrl).with(staticToken(token)).with(rest()); }`. Delete it.

- [ ] **Step 4: Update `main()` calls**

In `main()`, replace `await getAdminToken(directusUrl)` with `await getAdminTokenLib(directusUrl)`. Replace `createClient(opts.directusUrl, opts.token)` (inside `migrateAssets`) with `createSdkClient<{ directus_files: DirectusFile[] }>(opts.directusUrl, opts.token)`.

Also: replace `process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev'` (inside `main()`) with `defaultDirectusUrl()`.

- [ ] **Step 5: Replace `console.log` with scoped logger**

Add at top of file (after imports):

```ts
const log = createLogger('migrate');
```

Replace every `console.log('[migrate] ...')` with `log.info('...')` (drop the `[migrate]` prefix — logger adds it). Example:

```ts
// before
console.log(`[migrate] manifest: ${manifest.assets.length} assets`);

// after
log.info(`manifest: ${manifest.assets.length} assets`);
```

`console.error` becomes `log.error`. The single non-prefixed `console.error('[migrate] FAILED:', ...)` in the catch handler at the bottom can stay as a top-level CLI error path.

- [ ] **Step 6: Wrap upload in error handler**

Find the `for (const entry of toUpload) { ... uploadOne(...) ... }` loop. Wrap the `uploadOne` call:

```ts
	for (const entry of toUpload) {
		const folderId = folderIds.get(entry.folder);
		if (!folderId) {
			throw new Error(
				`[migrate] folder "${entry.folder}" was not created — check ensureFolders().`,
			);
		}
		let fileId: string;
		try {
			fileId = await uploadOne(client, entry, folderId, opts.sourceRoot);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Upload failed for ${entry.legacyPath}: ${msgs.join(' · ')}`,
			);
		}
		idMap.set(entry.legacyPath, fileId);
		log.info(
			`  ✓ ${entry.legacyPath.padEnd(40)}  →  ${fileId}  (folder=${entry.folder})`,
		);
	}
```

- [ ] **Step 7: Type-check**

```bash
cd apps/cms
bun run check 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Run unit tests**

```bash
bun test tests/migrate-assets.test.ts tests/assets-manifest.test.ts
```

Expected: all green (pure helpers untouched; idempotency change is in I/O layer not unit-tested).

**Acceptance check:** `grep -E "function getAdminToken|function createClient" apps/cms/scripts/migrate-assets.ts` returns no matches; type-check + tests green.

### Task 14: Wire rate-limit + add `--reset` flag

**Files:**
- Modify: `apps/cms/scripts/migrate-assets.ts`

- [ ] **Step 1: Wrap `uploadOne` with `withRateLimit`**

Find the `uploadOne` function. Right after its definition, add:

```ts
const uploadOneRateLimited = withRateLimit(uploadOne, { maxConcurrent: 3, minTime: 100 });
```

Then replace the call site `fileId = await uploadOne(client, entry, folderId, opts.sourceRoot);` with `fileId = await uploadOneRateLimited(client, entry, folderId, opts.sourceRoot);`.

Note: the wrapper preserves signature; rate-limit applies to concurrent invocations across `Promise.all` patterns. For sequential `for` loops, behavior is identical to direct invocation but `bottleneck` provides reservoir semantics for future parallelization.

- [ ] **Step 2: Add `--reset` flag parsing**

Find `parseCliArgs`. Replace it with:

```ts
function parseCliArgs(argv: readonly string[]): {
	sourceRoot?: string;
	dryRun: boolean;
	reset: boolean;
} {
	let sourceRoot: string | undefined;
	let dryRun = false;
	let reset = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--dry-run') dryRun = true;
		else if (arg === '--reset') reset = true;
		else if (arg === '--source' && i + 1 < argv.length) {
			sourceRoot = argv[i + 1];
			i++;
		}
	}
	return { sourceRoot, dryRun, reset };
}
```

- [ ] **Step 3: Implement `--reset` semantics in `migrateAssets`**

Add a `reset` boolean to `MigrateOptions`:

```ts
interface MigrateOptions {
	directusUrl: string;
	token: string;
	sourceRoot: string;
	outputMapPath: string;
	dryRun: boolean;
	reset: boolean;
}
```

Then, in `migrateAssets`, after the `existingByLegacyPath` map is built and BEFORE the `filterToUpload` call, add:

```ts
	if (opts.reset && existingByLegacyPath.size > 0) {
		log.info(`reset: deleting ${existingByLegacyPath.size} previously-uploaded files...`);
		for (const [legacyPath, id] of existingByLegacyPath) {
			try {
				await client.request({
					method: 'DELETE',
					path: `/files/${id}`,
				} as never);
			} catch (err) {
				const msgs = parseErrors(err);
				log.warn(`  failed to delete ${legacyPath} (${id}): ${msgs.join(' · ')}`);
			}
		}
		existingByLegacyPath.clear();
	}
```

(Use `deleteFile` from `@directus/sdk` if available. If the SDK version doesn't export it, use `customEndpoint` or the raw REST call as above. Confirm SDK API at task time; adjust if needed.)

Update `main()` to pass `reset` through to `migrateAssets`:

```ts
	await migrateAssets(manifest, {
		directusUrl,
		token,
		sourceRoot,
		outputMapPath,
		dryRun,
		reset,
	});
```

- [ ] **Step 4: Type-check + tests**

```bash
cd apps/cms
bun run check 2>&1 | head -20
bun test tests/migrate-assets.test.ts tests/assets-manifest.test.ts
```

Expected: 0 type errors; all tests green.

**Acceptance check:** `--reset` flag parsed; `withRateLimit` wraps uploads; `migrateAssets({ ..., reset: true })` deletes by legacy_path.

### Task 15: Fix source-default path + add package.json scripts

**Files:**
- Modify: `apps/cms/scripts/migrate-assets.ts`
- Modify: `apps/cms/package.json`

- [ ] **Step 1: Fix the source default in `main()`**

Find the block computing `defaultSource` in `main()`. Replace:

```ts
	const defaultSource = resolvePath(
		import.meta.dir,
		'..',
		'..',
		'yesid.dev',
		'static',
		'images',
	);
```

with:

```ts
	// Monorepo-aware default: scripts/ lives at apps/cms/scripts/; the web app's
	// static dir is at apps/web/static/. Manifest sourceRoot is "apps/web/static"
	// so that joinPath(sourceRoot, legacyPath) → "apps/web/static/images/<rest>".
	const defaultSource = resolvePath(import.meta.dir, '..', '..', 'web', 'static');
```

Update the trailing fallback similarly. Remove the obsolete sibling-yesid.dev fallback.

- [ ] **Step 2: Verify resolvePath produces the expected absolute path**

```bash
cd apps/cms
bun -e "
const { resolve } = await import('node:path');
console.log(resolve('./scripts', '..', '..', 'web', 'static'));
"
```

Expected: an absolute path ending in `apps/web/static`.

- [ ] **Step 3: Add scripts to `apps/cms/package.json`**

Open `apps/cms/package.json`. In the `"scripts"` block, add (preserve other scripts):

```json
"migrate:assets": "bun run scripts/migrate-assets.ts",
"seed:presets": "bun run scripts/seed-presets.ts"
```

- [ ] **Step 4: Smoke-test dry-run resolution**

```bash
cd apps/cms
bun run migrate:assets -- --dry-run
```

Expected: log shows `manifest: 14 assets`; lists 14 expected uploads with folder + title; no Directus calls (dry-run doesn't auth or fetch).

If a "source directory not found" error fires, debug paths before proceeding.

- [ ] **Step 5: Commit phase 4**

```bash
git add apps/cms/scripts/migrate-assets.ts apps/cms/tests/migrate-assets.test.ts apps/cms/tests/assets-manifest.test.ts apps/cms/package.json
git commit -m "feat(slice-18 18d Task 10-15): migrate-assets retrofit — legacy_path idempotency, lib helpers, --reset, monorepo paths"
```

**Acceptance check:** `bun run migrate:assets -- --dry-run` lists 14 assets without errors; tests + type-check green.

---

## Phase 5 — Seed-presets script (Tasks 16–19)

### Task 16: Write `PresetsSchema` Zod schema

**Files:**
- Create: `apps/cms/scripts/lib/schemas/presets.ts`

- [ ] **Step 1: Create folder if missing**

```bash
mkdir -p apps/cms/scripts/lib/schemas
```

- [ ] **Step 2: Write schema file**

```ts
/**
 * Zod schema for storage_asset_presets — used by seed-presets.ts to validate
 * the brand fixture before pushing to Directus.
 *
 * Mirrors the shape Directus 11.17 accepts for `directus_settings.storage_asset_presets`.
 * See: https://docs.directus.io/configuration/storage.html#asset-presets
 */
import { z } from 'zod';

export const PresetEntrySchema = z.object({
	key: z.string().regex(/^[a-z0-9-]+$/, 'key must be kebab-case'),
	fit: z.enum(['cover', 'contain', 'inside', 'outside']),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	format: z.enum(['jpg', 'png', 'webp', 'avif', 'tiff']),
	quality: z.number().int().min(1).max(100),
	withoutEnlargement: z.boolean().optional(),
});

export const PresetsConfigSchema = z.object({
	presets: z.array(PresetEntrySchema).min(1),
});

export type PresetEntry = z.infer<typeof PresetEntrySchema>;
export type PresetsConfig = z.infer<typeof PresetsConfigSchema>;
```

**Acceptance check:** File parses; types export.

### Task 17: Write fixture `fixtures/brand/presets.json`

**Files:**
- Create: `apps/cms/fixtures/brand/presets.json`

- [ ] **Step 1: Create folder + file**

```bash
mkdir -p apps/cms/fixtures/brand
```

Write `apps/cms/fixtures/brand/presets.json`:

```json
{
	"presets": [
		{
			"key": "hero-1200",
			"fit": "contain",
			"width": 1200,
			"format": "webp",
			"quality": 85,
			"withoutEnlargement": true
		},
		{
			"key": "card-600",
			"fit": "contain",
			"width": 600,
			"format": "webp",
			"quality": 80,
			"withoutEnlargement": true
		},
		{
			"key": "thumb-240",
			"fit": "cover",
			"width": 240,
			"height": 240,
			"format": "webp",
			"quality": 75
		},
		{
			"key": "og-1200",
			"fit": "cover",
			"width": 1200,
			"height": 630,
			"format": "jpg",
			"quality": 85
		}
	]
}
```

- [ ] **Step 2: Write fixture round-trip test**

Create `apps/cms/tests/brand-presets-fixture.test.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { PresetsConfigSchema } from '../scripts/lib/schemas/presets';

describe('fixtures/brand/presets.json', () => {
	const path = joinPath(import.meta.dir, '..', 'fixtures', 'brand', 'presets.json');
	const raw = JSON.parse(readFileSync(path, 'utf8'));

	it('parses against PresetsConfigSchema', () => {
		expect(() => PresetsConfigSchema.parse(raw)).not.toThrow();
	});

	it('declares the 4 expected base presets in order', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const keys = parsed.presets.map((p) => p.key);
		expect(keys).toContain('hero-1200');
		expect(keys).toContain('card-600');
		expect(keys).toContain('thumb-240');
		expect(keys).toContain('og-1200');
	});

	it('every preset has a quality score (1–100)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		for (const p of parsed.presets) {
			expect(p.quality).toBeGreaterThanOrEqual(1);
			expect(p.quality).toBeLessThanOrEqual(100);
		}
	});

	it('thumb-240 is square (width = height)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const thumb = parsed.presets.find((p) => p.key === 'thumb-240');
		expect(thumb?.width).toBe(240);
		expect(thumb?.height).toBe(240);
	});

	it('og-1200 has the OG-card aspect (1200×630)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const og = parsed.presets.find((p) => p.key === 'og-1200');
		expect(og?.width).toBe(1200);
		expect(og?.height).toBe(630);
	});
});
```

- [ ] **Step 3: Run tests**

```bash
cd apps/cms
bun test tests/brand-presets-fixture.test.ts
```

Expected: all green.

**Acceptance check:** Fixture parses; 5 assertions all pass.

### Task 18: Write `seed-presets.ts` script + unit test

**Files:**
- Create: `apps/cms/scripts/seed-presets.ts`
- Create: `apps/cms/tests/seed-presets.test.ts`

- [ ] **Step 1: Write the script**

`apps/cms/scripts/seed-presets.ts`:

```ts
#!/usr/bin/env bun
/**
 * Seed Directus storage_asset_presets from fixtures/brand/presets.json.
 *
 * Slice 18 18d Task 18. Pushes the 4-preset config (or 7 with AVIF post-probe)
 * into directus_settings.storage_asset_presets. STORAGE_ASSET_TRANSFORM=presets
 * is locked on Railway (18c Task 37), so editor-uploaded files are served via
 * /assets/<id>?key=<preset>; ad-hoc transforms return 403.
 *
 * Strategy:
 *   1. Load fixtures/brand/presets.json + Zod-validate.
 *   2. Auth to Directus (lib/auth).
 *   3. PATCH /settings with { storage_asset_presets: [...] }.
 *   4. Read back + assert count.
 *
 * Pure helper `buildPresetPayload` exported for tests.
 */
import { readSettings, updateSettings } from '@directus/sdk';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { PresetsConfigSchema, type PresetsConfig } from './lib/schemas/presets';

const log = createLogger('seed-presets');

interface Schema {
	directus_settings: {
		storage_asset_presets: PresetsConfig['presets'];
	};
}

/** Build the PATCH payload for directus_settings. Pure; tested. */
export function buildPresetPayload(config: PresetsConfig): { storage_asset_presets: PresetsConfig['presets'] } {
	return { storage_asset_presets: config.presets };
}

interface SeedOptions {
	directusUrl: string;
	token: string;
	dryRun: boolean;
}

export async function seedPresets(config: PresetsConfig, opts: SeedOptions): Promise<void> {
	const payload = buildPresetPayload(config);
	if (opts.dryRun) {
		log.info(`dry-run: would patch directus_settings.storage_asset_presets with ${config.presets.length} presets`);
		for (const p of config.presets) {
			log.info(`  ~ ${p.key.padEnd(20)} fit=${p.fit} ${p.width ?? '?'}×${p.height ?? '?'} ${p.format} q=${p.quality}`);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);
	try {
		await client.request(updateSettings(payload));
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(500, `Failed to update settings: ${msgs.join(' · ')}`);
	}

	const fresh = await client.request(readSettings({ fields: ['storage_asset_presets'] }));
	const count = fresh?.storage_asset_presets?.length ?? 0;
	log.info(`verified: ${count} presets live in Directus`);
	if (count !== config.presets.length) {
		throw new Error(
			`[seed-presets] count mismatch: expected ${config.presets.length}, got ${count}`,
		);
	}
}

export function loadPresetsFixture(): PresetsConfig {
	const path = joinPath(import.meta.dir, '..', 'fixtures', 'brand', 'presets.json');
	const raw = JSON.parse(readFileSync(path, 'utf8'));
	return PresetsConfigSchema.parse(raw);
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return {
		dryRun: argv.includes('--dry-run'),
		reset: argv.includes('--reset'),
	};
}

async function main(): Promise<void> {
	const { dryRun } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : ''}`);

	const config = loadPresetsFixture();
	log.info(`source: ${config.presets.length} presets from fixtures/brand/presets.json`);

	if (dryRun) {
		await seedPresets(config, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedPresets(config, { directusUrl, token, dryRun: false });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-presets] FAILED:', err);
		process.exit(1);
	});
}
```

- [ ] **Step 2: Write the unit test**

`apps/cms/tests/seed-presets.test.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { buildPresetPayload, loadPresetsFixture } from '../scripts/seed-presets';
import { PresetsConfigSchema } from '../scripts/lib/schemas/presets';

describe('buildPresetPayload', () => {
	it('wraps presets array in { storage_asset_presets: [...] }', () => {
		const config = PresetsConfigSchema.parse({
			presets: [
				{ key: 'a', fit: 'contain', width: 100, format: 'webp', quality: 80 },
			],
		});
		const out = buildPresetPayload(config);
		expect(out).toHaveProperty('storage_asset_presets');
		expect(out.storage_asset_presets).toHaveLength(1);
		expect(out.storage_asset_presets[0]?.key).toBe('a');
	});

	it('preserves the order of presets from input', () => {
		const config = PresetsConfigSchema.parse({
			presets: [
				{ key: 'first', fit: 'contain', width: 100, format: 'webp', quality: 80 },
				{ key: 'second', fit: 'cover', width: 200, format: 'jpg', quality: 90 },
			],
		});
		const out = buildPresetPayload(config);
		expect(out.storage_asset_presets.map((p) => p.key)).toEqual(['first', 'second']);
	});
});

describe('loadPresetsFixture', () => {
	it('loads + validates fixtures/brand/presets.json', () => {
		const config = loadPresetsFixture();
		expect(config.presets.length).toBeGreaterThanOrEqual(4);
	});
});

describe('PresetsConfigSchema rejects malformed input', () => {
	it('rejects empty presets array', () => {
		expect(() => PresetsConfigSchema.parse({ presets: [] })).toThrow();
	});

	it('rejects non-kebab-case key', () => {
		expect(() =>
			PresetsConfigSchema.parse({
				presets: [
					{ key: 'BadKey', fit: 'contain', width: 100, format: 'webp', quality: 80 },
				],
			}),
		).toThrow();
	});

	it('rejects quality > 100', () => {
		expect(() =>
			PresetsConfigSchema.parse({
				presets: [
					{ key: 'k', fit: 'contain', width: 100, format: 'webp', quality: 150 },
				],
			}),
		).toThrow();
	});
});
```

- [ ] **Step 3: Run tests**

```bash
cd apps/cms
bun test tests/seed-presets.test.ts tests/brand-presets-fixture.test.ts
```

Expected: ~10+ assertions across both files; all green.

**Acceptance check:** Tests green; type-check 0 errors.

### Task 19: Dry-run + commit phase 5

- [ ] **Step 1: Dry-run seed-presets**

```bash
cd apps/cms
bun run seed:presets -- --dry-run
```

Expected: log shows 4 presets enumerated with their key/fit/dimensions/format/quality; no live writes.

- [ ] **Step 2: Commit phase 5**

```bash
git add apps/cms/scripts/seed-presets.ts apps/cms/scripts/lib/schemas/ apps/cms/fixtures/brand/ apps/cms/tests/seed-presets.test.ts apps/cms/tests/brand-presets-fixture.test.ts
git commit -m "feat(slice-18 18d Task 16-19): seed-presets script + brand/presets.json fixture + tests"
```

**Acceptance check:** Commit lands; tests + dry-run green.

---

## Phase 6 — Bootstrap upload + AVIF probe (Tasks 20–22)

### Task 20: Live: seed presets + bootstrap-upload first file

- [ ] **Step 1: Set auth**

```bash
export DIRECTUS_ADMIN_TOKEN=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export PUBLIC_DIRECTUS_URL='https://cms.yesid.dev'
```

- [ ] **Step 2: Run seed-presets live**

```bash
cd apps/cms
bun run seed:presets
```

Expected log: `verified: 4 presets live in Directus`. If schema-push from Task 7 already wrote presets via directus-sync, this is a no-op rewrite (idempotent).

- [ ] **Step 3: Verify 4 presets visible via API**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/settings?fields=storage_asset_presets" \
  | bun -e "const j = JSON.parse(await Bun.stdin.text()); console.log(j.data.storage_asset_presets.map(p => p.key));"
```

Expected output: `[ "hero-1200", "card-600", "thumb-240", "og-1200" ]`.

- [ ] **Step 4: Bootstrap-upload single file (`headshot.webp`)**

The script does NOT support a per-file `--limit` flag (would over-engineer for one bootstrap). Instead, temporarily edit the manifest to retain only `headshot.webp` for this phase, OR use the SDK directly. Choose the SDK direct approach to avoid a manifest commit churn:

```bash
cd apps/cms
bun -e "
import { uploadFiles } from '@directus/sdk';
import { readFileSync } from 'node:fs';
import { createClient, defaultDirectusUrl } from './scripts/lib/sdk';
import { getAdminToken } from './scripts/lib/auth';

const url = defaultDirectusUrl();
const token = await getAdminToken(url);
const client = createClient(url, token);

// Get folder id for 'about'
const folders = await client.request({
	method: 'GET',
	path: '/folders?filter[name][_eq]=about&fields=id'
});
const folderId = folders.data?.[0]?.id;
if (!folderId) throw new Error('about folder not found');

const bytes = readFileSync('../web/static/images/about/headshot.webp');
const form = new FormData();
form.append('folder', folderId);
form.append('title', 'Headshot — Yesid');
form.append('description', 'Bootstrap upload — Slice 18d AVIF probe');
form.append('legacy_path', 'images/about/headshot.webp');
form.append('file', new Blob([bytes]), 'headshot.webp');

const out = await client.request(uploadFiles(form));
console.log('uploaded id:', out.id);
"
```

Save the printed UUID — referenced as `\$BOOTSTRAP_ID` below.

```bash
export BOOTSTRAP_ID=<the-uuid>
```

- [ ] **Step 5: Verify via curl with each preset**

```bash
for key in hero-1200 card-600 thumb-240 og-1200; do
  echo "=== $key ==="
  curl -s -I "https://cms.yesid.dev/assets/$BOOTSTRAP_ID?key=$key" | grep -E "HTTP|Content-Type|Content-Length"
done
```

Expected for each: `HTTP/2 200`, `Content-Type: image/webp` (jpg for og-1200), `Content-Length: <small>`.

- [ ] **Step 6: Document R2 layout finding in research.md**

Optional but useful: peek R2 bucket via Cloudflare dashboard (or `wrangler r2 object list` if configured) to confirm key naming. Update `research.md § R2 bucket layout`. Even if you don't have console access, document "presumed flat UUID keys based on standard Directus s3 driver behavior."

**Acceptance check:** 4 presets live; bootstrap UUID returned; 4 curl-Is all return 200 with expected MIME types.

### Task 21: Run AVIF probe + document result

- [ ] **Step 1: Probe AVIF**

```bash
curl -I "https://cms.yesid.dev/assets/$BOOTSTRAP_ID?format=avif"
```

Expected outcome A: `HTTP/2 200` + `Content-Type: image/avif` → AVIF supported.
Expected outcome B: `HTTP/2 4xx` (likely 400 or 403 if `STORAGE_ASSET_TRANSFORM=presets` blocks ad-hoc params, OR 415 if format unsupported by the storage backend's image processor).

Note: Because `STORAGE_ASSET_TRANSFORM=presets` is locked, ad-hoc `?format=avif` may return 403 even if AVIF would work via a preset. To distinguish, retry with a temporarily-added preset:

```bash
# Add a temp avif preset via SDK
bun -e "
import { updateSettings, readSettings } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './scripts/lib/sdk';
import { getAdminToken } from './scripts/lib/auth';

const url = defaultDirectusUrl();
const token = await getAdminToken(url);
const client = createClient(url, token);
const cur = await client.request(readSettings({ fields: ['storage_asset_presets'] }));
const next = [...(cur.storage_asset_presets ?? []), {
	key: 'probe-avif', fit: 'contain', width: 1200, format: 'avif', quality: 75
}];
await client.request(updateSettings({ storage_asset_presets: next }));
console.log('probe-avif preset added; total presets:', next.length);
"

curl -sI "https://cms.yesid.dev/assets/$BOOTSTRAP_ID?key=probe-avif" | grep -E "HTTP|Content-Type|Content-Length"
```

Outcome A (green): `200` + `image/avif` + small Content-Length → AVIF works via preset; remove the probe preset and proceed to Task 22.
Outcome B (red): `4xx` or `image/webp` (downgrade) → AVIF unsupported; remove the probe preset and skip Task 22.

Cleanup the probe preset:

```bash
bun -e "
import { updateSettings, readSettings } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './scripts/lib/sdk';
import { getAdminToken } from './scripts/lib/auth';

const url = defaultDirectusUrl();
const token = await getAdminToken(url);
const client = createClient(url, token);
const cur = await client.request(readSettings({ fields: ['storage_asset_presets'] }));
const next = (cur.storage_asset_presets ?? []).filter(p => p.key !== 'probe-avif');
await client.request(updateSettings({ storage_asset_presets: next }));
console.log('probe-avif removed; total presets:', next.length);
"
```

- [ ] **Step 2: Update `research.md` § P8**

Open `docs/slices/slice-18/18d-asset-pipeline/research.md` § "P8 — AVIF support". Replace `Result: TBD` with the actual result (status code + Content-Type + size delta vs the baseline WebP). Replace `Decision: TBD` with either "GREEN — AVIF variants added in Task 22" or "RED — WebP-only stack for slice-18; revisit post-Directus-12."

- [ ] **Step 3: Commit probe outcome**

```bash
git add docs/slices/slice-18/18d-asset-pipeline/research.md
git commit -m "docs(slice-18 18d Task 21): P8 AVIF probe — <green|red> result documented"
```

(Edit commit message based on outcome.)

**Acceptance check:** `research.md § P8` populated with actual result + decision.

### Task 22 (CONDITIONAL): Add AVIF variants if probe green

**SKIP if Task 21 returned RED.**

**Files:**
- Modify: `apps/cms/fixtures/brand/presets.json`

- [ ] **Step 1: Append 3 AVIF entries**

Open `apps/cms/fixtures/brand/presets.json`. Add to the `presets` array:

```json
{
	"key": "hero-1200-avif",
	"fit": "contain",
	"width": 1200,
	"format": "avif",
	"quality": 75,
	"withoutEnlargement": true
},
{
	"key": "card-600-avif",
	"fit": "contain",
	"width": 600,
	"format": "avif",
	"quality": 70,
	"withoutEnlargement": true
},
{
	"key": "thumb-240-avif",
	"fit": "cover",
	"width": 240,
	"height": 240,
	"format": "avif",
	"quality": 65
}
```

- [ ] **Step 2: Update fixture test**

In `apps/cms/tests/brand-presets-fixture.test.ts`, change the count assertion to `≥ 7` if it counts presets:

```ts
	it('declares the 4 base + 3 AVIF presets when AVIF is enabled', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		expect(parsed.presets.length).toBeGreaterThanOrEqual(7);
	});
```

(Or leave the existing assertions as-is and just add this one.)

- [ ] **Step 3: Re-run seed-presets live**

```bash
bun run seed:presets
```

Expected: `verified: 7 presets live`.

- [ ] **Step 4: Smoke-curl one AVIF preset**

```bash
curl -sI "https://cms.yesid.dev/assets/$BOOTSTRAP_ID?key=hero-1200-avif" | grep -E "HTTP|Content-Type|Content-Length"
```

Expected: `200` + `image/avif`.

- [ ] **Step 5: Update CONVENTIONS.md to flag AVIF status**

Open `docs/slices/slice-18/CONVENTIONS.md § 9`, after the preset table. Replace the line `AVIF variants added post-P8 probe (18d).` with:

```markdown
**AVIF variants live (18d Task 22):** hero-1200-avif (q=75), card-600-avif (q=70), thumb-240-avif (q=65).
```

(Or, if Task 21 was RED, replace with: `AVIF deferred — P8 probe RED; revisit post-Directus-12.`)

- [ ] **Step 6: Commit phase 6 finalization**

```bash
git add apps/cms/fixtures/brand/presets.json apps/cms/tests/brand-presets-fixture.test.ts docs/slices/slice-18/CONVENTIONS.md
git commit -m "feat(slice-18 18d Task 22): AVIF variants live — 3 presets at q=65/70/75"
```

(Skip this commit if Task 21 was RED; instead a single docs commit at Task 21 covers the conventions update.)

**Acceptance check:** 7 presets visible via API; AVIF curl returns 200 + image/avif; conventions doc reflects status.

---

## Phase 7 — Full migrate + id-map (Tasks 23–27)

### Task 23: Run full `migrate-assets`

- [ ] **Step 1: Confirm bootstrap-uploaded file is recognized as already-uploaded**

The bootstrap upload from Task 20 set `legacy_path: 'images/about/headshot.webp'`. The full migrate should skip it via `filterToUpload`.

```bash
cd apps/cms
bun run migrate:assets -- --dry-run
```

Expected: log mentions `already-uploaded: 1` (or similar phrasing) and `to-upload: 13`.

If "already-uploaded: 0" → debug: confirm the bootstrap upload's `legacy_path` field was set correctly (curl `/files/$BOOTSTRAP_ID?fields=legacy_path`).

- [ ] **Step 2: Run live migrate**

```bash
bun run migrate:assets
```

Expected: 13 upload progress lines; final summary `verified: 14 entries in Directus`. Any failure → check `parseErrors` output; common causes: file size limits, R2 throttling (rate-limit handles), folder mismatch.

- [ ] **Step 3: Verify all 14 are in Directus with legacy_path**

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/files?fields=id,legacy_path&filter[legacy_path][_starts_with]=images/&limit=-1" \
  | bun -e "const d = JSON.parse(await Bun.stdin.text()).data; console.log('count:', d.length); console.log('paths:', d.map(f => f.legacy_path).sort());"
```

Expected: count = 14; all 14 manifest paths listed.

**Acceptance check:** 14 files live in Directus, all with `legacy_path` populated, paths match manifest.

### Task 24: Verify preset serving (9-curl sample)

- [ ] **Step 1: Pick 3 sample files**

Sample paths (one per folder + one per format type):
- `images/montreal-metro.svg` (brand · svg)
- `images/about/headshot.webp` (about · webp)
- `images/work/yesid-dev.png` (projects · png)

Get UUIDs:

```bash
curl -s -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  "https://cms.yesid.dev/files?fields=id,legacy_path&filter[legacy_path][_in]=images/montreal-metro.svg,images/about/headshot.webp,images/work/yesid-dev.png&limit=-1" \
  | bun -e "
const d = JSON.parse(await Bun.stdin.text()).data;
for (const f of d) console.log(f.legacy_path, '=', f.id);
"
```

- [ ] **Step 2: Curl each × 3 presets**

```bash
for id in <id-metro> <id-headshot> <id-yesiddev>; do
  for key in hero-1200 card-600 thumb-240; do
    echo "=== $id key=$key ==="
    curl -sI "https://cms.yesid.dev/assets/$id?key=$key" | grep -E "HTTP|Content-Type|Content-Length"
  done
done
```

Expected: 9 × `HTTP/2 200`. SVG + preset returns SVG passthrough OR an error (depends on Directus SVG-with-preset behavior — document if surprising); raster + preset returns `image/webp` with reasonable Content-Length.

If any SVG curl returns 4xx with preset, that's a known quirk (SVGs aren't raster-transformed) — note in `research.md` and treat as expected.

**Acceptance check:** Raster sample × 3 presets returns 200 + image/webp; SVG returns either 200+image/svg+xml or expected SVG-no-transform behavior.

### Task 25: Emit + commit `assets-id-map.json` + write its test

**Files:**
- Verify: `apps/cms/fixtures/assets-id-map.json` (auto-emitted by Task 23)
- Create: `apps/cms/tests/assets-id-map.test.ts`

- [ ] **Step 1: Confirm id-map exists + is well-formed**

```bash
cat apps/cms/fixtures/assets-id-map.json | head -30
bun -e "
const m = JSON.parse(await Bun.file('apps/cms/fixtures/assets-id-map.json').text());
console.log('entries:', Object.keys(m).length);
console.log('first key:', Object.keys(m)[0]);
"
```

Expected: 14 entries, first key alphabetically `images/about/headshot.webp` (it'll likely be `images/about/headshot.webp` — alphabetical order means the `about/` paths come before `montreal-metro.svg`).

- [ ] **Step 2: Write the shape test**

Create `apps/cms/tests/assets-id-map.test.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { z } from 'zod';

/**
 * Schema for fixtures/assets-id-map.json — emitted by migrate-assets.ts and
 * consumed by 18e–18i (and packages/shared via re-export).
 */
const AssetsIdMapSchema = z.record(
	z.string().regex(/^images\//),
	z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
);

function loadIdMap(): Record<string, string> {
	const path = joinPath(import.meta.dir, '..', 'fixtures', 'assets-id-map.json');
	return JSON.parse(readFileSync(path, 'utf8'));
}

describe('fixtures/assets-id-map.json', () => {
	it('parses against AssetsIdMapSchema (every key is "images/..." path; every value is UUID)', () => {
		expect(() => AssetsIdMapSchema.parse(loadIdMap())).not.toThrow();
	});

	it('contains exactly 14 entries (matches manifest cardinality)', () => {
		const m = loadIdMap();
		expect(Object.keys(m).length).toBe(14);
	});

	it('keys are sorted alphabetically (diff-friendly)', () => {
		const m = loadIdMap();
		const keys = Object.keys(m);
		const sorted = [...keys].sort();
		expect(keys).toEqual(sorted);
	});

	it('every value is a unique UUID (no duplicates)', () => {
		const m = loadIdMap();
		const ids = Object.values(m);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('contains the metro-svg + headshot + yesid-dev sentinel paths', () => {
		const m = loadIdMap();
		expect(m).toHaveProperty('images/montreal-metro.svg');
		expect(m).toHaveProperty('images/about/headshot.webp');
		expect(m).toHaveProperty('images/work/yesid-dev.png');
	});
});
```

- [ ] **Step 3: Run test**

```bash
cd apps/cms
bun test tests/assets-id-map.test.ts
```

Expected: 5 assertions green.

**Acceptance check:** `assets-id-map.json` exists with 14 alphabetically-ordered UUID-mapped entries; test green.

### Task 26: Re-export id-map to `packages/shared`

**Files:**
- Create: `packages/shared/fixtures/assets-id-map.json` (copy of CMS fixture)
- Create: `packages/shared/src/assets.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Copy id-map into shared package**

```bash
mkdir -p packages/shared/fixtures
cp apps/cms/fixtures/assets-id-map.json packages/shared/fixtures/assets-id-map.json
```

(Long-term: a sync script could automate this. For now, manual + docs-noted in research.md is fine.)

- [ ] **Step 2: Author the typed helper**

Create `packages/shared/src/assets.ts`:

```ts
/**
 * Typed accessor for the asset-id map emitted by 18d migrate-assets.
 *
 * 18e–18i + the metro-svg consumer in 18d phase 8 use this to resolve a
 * legacyPath to its Directus file UUID.
 *
 * Source of truth: apps/cms/fixtures/assets-id-map.json. This package
 * re-exports a copy at packages/shared/fixtures/assets-id-map.json. The two
 * MUST stay in sync — if you change one, change the other (slice-18d notes a
 * sync-script as a post-slice-18 follow-up).
 */
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };

export type AssetLegacyPath = keyof typeof idMap;

/**
 * Look up a Directus file UUID by its legacy path. Throws if the path isn't
 * in the map — fail loud so missing assets surface at boot, not at render.
 */
export function assetIdFor(legacyPath: AssetLegacyPath): string {
	const id = (idMap as Record<string, string>)[legacyPath];
	if (!id) {
		throw new Error(
			`[assets] no Directus file id for legacyPath "${legacyPath}" — did the manifest change without re-running migrate-assets?`,
		);
	}
	return id;
}

/**
 * Untyped variant for cases where the legacyPath is built dynamically and
 * type-narrowing isn't possible. Returns undefined on miss.
 */
export function assetIdForOrUndefined(legacyPath: string): string | undefined {
	return (idMap as Record<string, string>)[legacyPath];
}
```

- [ ] **Step 3: Re-export from package index**

Open `packages/shared/src/index.ts`. Add:

```ts
export { assetIdFor, assetIdForOrUndefined, type AssetLegacyPath } from './assets';
```

- [ ] **Step 4: Type-check from web app**

```bash
cd apps/web
bun run check 2>&1 | head -20
```

Expected: 0 errors. (If it fails on the JSON import, the `tsconfig.json`'s `resolveJsonModule` may need verification — likely already configured per existing JSON imports.)

**Acceptance check:** Shared package exports `assetIdFor`; consumers can `import { assetIdFor } from '@repo/shared'`.

### Task 27: Verify both apps' tests still green; commit phase 7

- [ ] **Step 1: apps/cms tests**

```bash
cd apps/cms
bun test
```

Expected: full suite green.

- [ ] **Step 2: apps/web tests + type-check**

```bash
cd apps/web
bun run check
bun run test
```

Expected: 0 type errors; full suite green.

(Note: at this point Lottie hasn't been removed yet — `lottieReverse` plumbing is still intact, so existing `directus.contract.test.ts` passes. Lottie removal is phase 9.)

- [ ] **Step 3: Commit phase 7**

```bash
git add apps/cms/fixtures/assets-id-map.json apps/cms/tests/assets-id-map.test.ts packages/shared/fixtures/ packages/shared/src/assets.ts packages/shared/src/index.ts
git commit -m "feat(slice-18 18d Task 23-27): full migrate (14 files) + assets-id-map.json + @repo/shared assetIdFor helper"
```

**Acceptance check:** All tests green in both apps; id-map committed; shared helper exported.

---

## Phase 8 — Consumer flip: montreal-metro SVG (Tasks 28–33)

### Task 28: Identify route rendering MetroNetwork

- [ ] **Step 1: Grep for MetroNetwork imports**

```bash
grep -rn "import.*MetroNetwork\|from.*MetroNetwork" apps/web/src
```

Expected: one or more `+page.svelte` or layout files that import `MetroNetwork.svelte`.

- [ ] **Step 2: Find the corresponding `+page.server.ts` (or load) file**

For each consumer found in Step 1, look for a sibling load file:

```bash
ls $(dirname <consumer-path>)/+page.server.ts $(dirname <consumer-path>)/+page.ts 2>/dev/null
```

Note which file you'll modify. Examples likely:
- `apps/web/src/routes/+page.svelte` → load at `apps/web/src/routes/+page.ts` (per `apps/web/src/routes/+page.ts` already grepped in Task earlier — see system reminder line)

If no `+page.server.ts` exists for the consumer route, you'll create one (universal `+page.ts` works for SSR-with-Directus too, but server-only is safer).

- [ ] **Step 3: Document the route in research.md (informal)**

Optional — append a one-line note to `research.md` § "Consumer flip" identifying which route owns MetroNetwork.

**Acceptance check:** Identified the consumer file path + the load file path.

### Task 29: Add `content.metroSvg` port method

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Read current `content` object structure**

```bash
grep -n "content:\|content\." apps/web/src/lib/adapters/directus.ts | head -20
```

Identify where the `content` adapter is defined (likely an object with methods like `manifesto()`, `proofReel()`, etc.) or whether `content` doesn't yet exist as a namespace (in 18c, the live port is `services.*`; `content.*` is the M2A blocks namespace planned for 18i).

For 18d, add a `metroSvg()` method to whichever namespace makes sense given current code shape:
- If a `content` namespace exists in the directusAdapter → add it there
- If only `services` exists → add a new top-level `metroSvg()` directly on the adapter (rename to fit existing pattern)
- If a more idiomatic location exists (e.g., a `brand` or `assets` namespace), use that

**Decide based on current code.** Document the decision in `research.md`.

- [ ] **Step 2: Add the method**

Example assuming `content` namespace pattern (adapt to actual code shape):

```ts
import { assetIdFor } from '@repo/shared';
// ... existing imports ...

// (inside directusAdapter.content or appropriate namespace)
metroSvg: async (): Promise<string> => {
	const id = assetIdFor('images/montreal-metro.svg');
	const url = `${PUBLIC_DIRECTUS_URL}/assets/${id}`;
	const res = await queuedFetch(url);
	if (!res.ok) {
		throw new Error(`metroSvg: ${res.status} ${res.statusText} fetching ${url}`);
	}
	return await res.text();
},
```

(`queuedFetch` is the p-queue + retry wrapper from 18c Task 40 at `apps/web/src/lib/adapters/directus-queue.ts`.)

If `content` namespace doesn't exist yet, define it as a stub that 18i fleshes out:

```ts
const content = {
	metroSvg: async (): Promise<string> => { /* ... as above ... */ },
};

export const directusAdapter: ContentAdapter = {
	services: directusServicesPort,
	content,  // new namespace; 18i extends with M2A block methods
};
```

- [ ] **Step 3: Update ContentAdapter / Port interface**

Find `apps/web/src/lib/adapters/types.ts` and add a `MetroSvgPort` interface or extend the existing `ContentPort`:

```ts
export interface ContentPort {
	// existing methods...
	metroSvg(ctx?: PreviewContext): Promise<string>;
}
```

If `ContentPort` doesn't exist yet, create a minimal one with just `metroSvg` for now.

- [ ] **Step 4: Type-check**

```bash
cd apps/web
bun run check 2>&1 | head -20
```

Expected: 0 errors. If `assetIdFor` import fails, verify `@repo/shared` resolves; check `tsconfig.json` paths.

**Acceptance check:** `metroSvg` method on adapter; ContentPort interface defines it; type-check clean.

### Task 30: Add `metroSvg` mocked-fetch test

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.mocked.test.ts`

- [ ] **Step 1: Add a new describe block**

Append to the file:

```ts
describe('directusAdapter.content.metroSvg — fetch contract', () => {
	it('hits /assets/<uuid> for the montreal-metro svg id from id-map', async () => {
		// Mock fetch to return SVG text
		sharedMockFetch.mockResolvedValueOnce(
			new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
				status: 200,
				headers: { 'Content-Type': 'image/svg+xml' },
			}),
		);

		const out = await directusAdapter.content.metroSvg();

		expect(out).toContain('<svg');
		const { pathname } = parseCapturedUrl();
		expect(pathname).toMatch(/^\/assets\/[0-9a-f-]{36}$/);
	});

	it('throws on non-2xx response', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('not found', { status: 404, statusText: 'Not Found' }),
		);

		await expect(directusAdapter.content.metroSvg()).rejects.toThrow(/404/);
	});
});
```

(Adjust mock helpers to match the file's existing patterns — `sharedMockFetch`, `parseCapturedUrl`, etc., names from 18c Task 45.)

- [ ] **Step 2: Run the test**

```bash
cd apps/web
bun test src/lib/adapters/directus.mocked.test.ts -t metroSvg
```

Expected: 2 new tests green.

**Acceptance check:** Mocked-fetch test asserts URL shape + error path.

### Task 31: Add `metroSvg` to route load

**Files:**
- Modify: `apps/web/src/routes/<identified-route>/+page.server.ts` (from Task 28)

- [ ] **Step 1: Add the load fetch**

Open the load file. Find the existing `load` export. Add `metroSvg` to whatever data is returned:

```ts
import { adapters } from '$lib/adapters';

export const load: PageServerLoad = async ({ /* existing params */ }) => {
	const [/* existing data */, metroSvg] = await Promise.all([
		// ... existing loaders ...
		adapters.content.metroSvg(),
	]);

	return {
		// ... existing returned data ...
		metroSvg,
	};
};
```

(If load is a `+page.ts` universal load and you want SSR-only, rename to `+page.server.ts` — but doing so changes data flow; keep as universal load if the rest of the route does.)

- [ ] **Step 2: Type-check**

```bash
bun run check
```

Expected: 0 errors.

**Acceptance check:** Load function fetches + returns `metroSvg`; type-check green.

### Task 32: Flip `MetroNetwork.svelte` to prop

**Files:**
- Modify: `apps/web/src/lib/motion/svg/MetroNetwork.svelte`
- Modify: consumer Svelte file (the one that imports MetroNetwork from Task 28)

- [ ] **Step 1: Replace `?raw` import with prop in MetroNetwork**

Open `apps/web/src/lib/motion/svg/MetroNetwork.svelte`. Replace the script section (focus on lines 16-22 where the `?raw` import lives):

```svelte
<!--
  MetroNetwork: receives Yesid's montreal-metro.svg as a prop (sourced from
  Directus via +page.server.ts → content.metroSvg()), then exposes DOM groups
  for GSAP animation. SSR-inlined, valid LCP candidate.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		svg: string;
		containerEl?: HTMLDivElement;
		svgEl?: SVGSVGElement;
	}

	let { svg, containerEl = $bindable(), svgEl = $bindable() }: Props = $props();

	// (existing onMount block UNCHANGED — DOM queries on the inlined SVG still work
	// because {@html svg} renders into the same DOM structure as the previous ?raw inline.)
```

Keep the entire `onMount` block as-is (the DOM-query logic for `metro-line`/`metro-station`/`metro-berri` classifications is independent of how the SVG got there).

Update the `<div>` line at the bottom to use `svg` instead of `metroSvgRaw`:

```svelte
<div
	bind:this={containerEl}
	class="flex max-h-[80dvh] w-full items-center justify-center"
	data-testid="metro-network-container"
>{@html svg}</div>
```

Delete the `import metroSvgRaw from '../../../../static/images/montreal-metro.svg?raw';` line.

- [ ] **Step 2: Update consumer usage**

Open the consumer Svelte file (e.g., `+page.svelte`). Find the `<MetroNetwork ... />` instance. Add the `svg` prop:

```svelte
<MetroNetwork svg={data.metroSvg} bind:containerEl bind:svgEl />
```

(Adjust to match existing usage. If `containerEl` and `svgEl` were not previously bound by parent, leave them unbound — they're optional.)

- [ ] **Step 3: Type-check + run web tests**

```bash
cd apps/web
bun run check
bun run test
```

Expected: 0 type errors; full test suite green.

If a `MetroNetwork` snapshot or component test breaks because it tested with `?raw` data, update it to pass an explicit `svg` prop.

**Acceptance check:** Type-check + tests green; component renders via prop.

### Task 33: Live homepage smoke + commit phase 8

- [ ] **Step 1: Run dev server**

```bash
cd apps/web
bun run dev &
DEV_PID=$!
sleep 3
```

- [ ] **Step 2: Curl the homepage (or whichever route renders MetroNetwork)**

```bash
curl -s http://localhost:5173/ | grep -c "metro-network\|<svg"
```

Expected: ≥ 1 match (the inlined SVG appears in SSR output).

- [ ] **Step 3: Visual check via browser preview**

Open `http://localhost:5173/` (or the relevant route) in a browser. Verify:
- Metro map visible
- GSAP animations fire (lines draw, stations pulse)
- No console errors
- Network tab shows ONE request to `cms.yesid.dev/assets/<uuid>` (during SSR or first hydration; subsequent requests cached)

- [ ] **Step 4: Stop dev server**

```bash
kill $DEV_PID
```

- [ ] **Step 5: Commit phase 8**

```bash
git add apps/web/src/lib/motion/svg/MetroNetwork.svelte apps/web/src/lib/adapters/ apps/web/src/routes/
git commit -m "feat(slice-18 18d Task 28-33): metro-svg consumer flip — fetch from Directus, prop-based MetroNetwork"
```

**Acceptance check:** Homepage renders metro map from Directus; tests + type-check green; no console errors.

---

## Phase 9 — Lottie retirement (Tasks 34–41)

### Task 34: Remove `lottieReverse` from `packages/shared`

**Files:**
- Modify: `packages/shared/src/types/content.ts`

- [ ] **Step 1: Find the field**

```bash
grep -n "lottieReverse\|lottie_reverse" packages/shared/src/types/content.ts
```

- [ ] **Step 2: Delete the line(s)**

Open `packages/shared/src/types/content.ts`. Find the `Service` interface (or wherever `lottieReverse` lives). Delete the `lottieReverse?: boolean;` line.

- [ ] **Step 3: Type-check from both apps**

```bash
cd apps/web && bun run check 2>&1 | head -10
cd ../cms && bun run check 2>&1 | head -10  # if apps/cms has type-check
```

Expected: errors in apps/web flagging missing `lottieReverse` consumers — these are exactly the files we'll fix in Task 35.

**Acceptance check:** `lottieReverse` removed from shared; downstream errors enumerable.

### Task 35: Remove `lottieReverse` from apps/web sources

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`
- Modify: `apps/web/src/lib/schemas/service.ts`
- Modify: `apps/web/src/lib/content/services.ts`

- [ ] **Step 1: Edit `directus.ts`**

Open `apps/web/src/lib/adapters/directus.ts`. Find:

```ts
	lottie_reverse?: boolean | null;
```

Delete it.

Find:

```ts
	if (row.lottie_reverse !== null && row.lottie_reverse !== undefined) {
		service.lottieReverse = row.lottie_reverse;
	}
```

Delete the entire if-block.

- [ ] **Step 2: Edit `schemas/service.ts`**

Open `apps/web/src/lib/schemas/service.ts`. Find:

```ts
	lottieReverse: z.boolean().optional(),
```

Delete that line.

- [ ] **Step 3: Edit `content/services.ts`**

Open `apps/web/src/lib/content/services.ts`. Find:

```ts
		lottieReverse: true,
```

Delete that line. (Should be on the `sql-development` entry.)

- [ ] **Step 4: Type-check**

```bash
cd apps/web
bun run check 2>&1 | head -10
```

Expected: 0 errors. Any remaining errors point to other consumers — fix those.

**Acceptance check:** `grep -rn "lottieReverse" apps/web/src` returns only test files (cleaned up in Task 36).

### Task 36: Remove `lottieReverse` from `directus.contract.test.ts`

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.contract.test.ts`

- [ ] **Step 1: Find the test**

Lines 94-109 (per spec § 5.2). Open the file at that range.

- [ ] **Step 2: Delete the test block**

Delete the entire `it('preserves optional scalar fields (icon, svg, lottieReverse, visible, stack)', ...)` test, OR remove only the `lottieReverse`-related lines and keep assertions for `icon`, `svg`, `visible`, `stack`. Recommend the latter — those other fields still exist:

```ts
	it('preserves optional scalar fields (icon, svg, visible, stack)', () => {
		const row = {
			id: 'a',
			station: 1,
			icon: 'wave',
			svg: '<svg/>',
			visible: false,
			stack: ['ts'],
			translations: [{ languages_code: 'en', title: 'A', description: 'd' }],
			deliverables: [],
			sections: [],
			related_projects: [],
		};
		const service = toService(row as never);
		expect(service.icon).toBe('wave');
		expect(service.svg).toBe('<svg/>');
		expect(service.visible).toBe(false);
		expect(service.stack).toEqual(['ts']);
	});
```

(Adjust to match existing test scaffold conventions.)

- [ ] **Step 3: Run the test**

```bash
cd apps/web
bun test src/lib/adapters/directus.contract.test.ts
```

Expected: green.

**Acceptance check:** Contract test no longer references `lottieReverse`; full file green.

### Task 37: Delete Lottie files

- [ ] **Step 1: Delete files**

```bash
cd <repo-root>
rm apps/web/src/lib/motion/components/LottiePlayer.svelte
rm apps/web/src/lib/motion/components/LottiePlayer.test.ts
rm -rf apps/web/static/lottie
rm -rf apps/web/src/lib/assets/lottie
rm apps/web/src/content/stack/lottie.md
```

- [ ] **Step 2: Verify**

```bash
find apps/web -name "*lottie*" -o -name "*Lottie*" 2>/dev/null
```

Expected: no matches except possibly `setup.dom.ts` (handled in Task 39).

- [ ] **Step 3: Run apps/web test suite**

```bash
cd apps/web
bun run check
bun run test 2>&1 | tail -20
```

Expected: type-check 0 errors; tests green. Any failure → likely a test file that imported LottiePlayer or mock setup that referenced `lottie-web` module — fix or delete those.

**Acceptance check:** No file references `Lottie` (case-insensitive) in `apps/web/src/lib` and `apps/web/static`; test suite green.

### Task 38: Remove `lottie-web` dep + regenerate lockfile

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Remove the dep**

Open `apps/web/package.json`. Find:

```json
		"lottie-web": "^5.13.0",
```

Delete that line. (Watch for trailing comma syntax — adjust the previous or next line as needed.)

- [ ] **Step 2: Reinstall**

```bash
cd apps/web
bun install
```

Expected: bun.lock updates; `lottie-web` no longer in install tree.

- [ ] **Step 3: Verify lockfile diff**

```bash
git diff bun.lock | grep -E "^\+|^-" | grep -i lottie
```

Expected: only `-` (delete) lines mentioning lottie; no `+` (add) lines.

- [ ] **Step 4: Verify type-check + tests still green**

```bash
bun run check
bun run test 2>&1 | tail -10
```

Expected: green.

**Acceptance check:** `apps/web/package.json` no longer lists `lottie-web`; `bun.lock` reflects removal; tests + type-check green.

### Task 39: Update `setup.dom.ts` IO stub comment

**Files:**
- Modify: `apps/web/src/tests/setup.dom.ts:71`

- [ ] **Step 1: Check whether other tests rely on the IntersectionObserver stub**

```bash
grep -rn "IntersectionObserver" apps/web/src --include="*.svelte" --include="*.ts" | grep -v setup.dom.ts | grep -v node_modules
```

If results > 0 → keep stub, just reword comment.
If empty → still keep stub (Svelte components frequently use IO via lazy-load patterns); just reword comment.

- [ ] **Step 2: Update the comment**

Open `apps/web/src/tests/setup.dom.ts`. Find line 71's comment block referencing LottiePlayer. Replace with a generic note:

```ts
// happy-dom does not implement IntersectionObserver. Stub it so any Svelte
// component using IO-based scroll triggers (lazy load, scroll-driven motion,
// reveal-on-scroll patterns) can render in tests without crashing.
```

- [ ] **Step 3: Run tests**

```bash
cd apps/web
bun run test 2>&1 | tail -10
```

Expected: green.

**Acceptance check:** Comment no longer references LottiePlayer; tests green.

### Task 40: Remove `lottie_reverse` from apps/cms seed + fixture + test

**Files:**
- Modify: `apps/cms/scripts/seed-services.ts`
- Modify: `apps/cms/fixtures/collections/services.json`
- Modify: `apps/cms/tests/seed-dry-run.test.ts`

- [ ] **Step 1: Edit `seed-services.ts`**

Find:

```ts
	lottie_reverse: boolean;
```

(in `DirectusServiceRow`). Delete that line.

Find:

```ts
		lottie_reverse: service.lottieReverse ?? false,
```

(in `toServiceRow`). Delete that line.

- [ ] **Step 2: Update `services.json` fixture**

```bash
grep -n "lottieReverse" apps/cms/fixtures/collections/services.json
```

For each match (likely just sql-development), remove the `"lottieReverse": true,` line.

- [ ] **Step 3: Update `seed-dry-run.test.ts`**

```bash
grep -n "lottie" apps/cms/tests/seed-dry-run.test.ts
```

For any expectation/snapshot referencing `lottie_reverse` or `lottieReverse`, remove or update.

- [ ] **Step 4: Run apps/cms test suite**

```bash
cd apps/cms
bun test
```

Expected: full suite green.

**Acceptance check:** `grep -rn "lottie" apps/cms/{scripts,fixtures,tests}` returns no matches.

### Task 41: Final cross-app green + commit phase 9

- [ ] **Step 1: Run both apps' full suites**

```bash
cd apps/cms && bun test
cd ../web && bun run check && bun run test
```

Expected: all green; `apps/web` reports same test count as before MINUS the LottiePlayer tests.

- [ ] **Step 2: Final grep**

```bash
cd <repo-root>
grep -ri "lottie" apps/ packages/ docs/slices/slice-18/ 2>/dev/null | grep -v node_modules | grep -v ".svelte-kit/" | grep -v "\.lock\b" | head -20
```

Expected: matches only in (a) historic git/snapshot files inside `apps/cms/directus/snapshot/` (not edited in 18d — leave for 18k), (b) `docs/slices/slice-18/plan.md` (historical mentions in amendments log — keep), (c) `tree.txt` if not regenerated. No live code/test references.

- [ ] **Step 3: Commit phase 9**

```bash
git add -A
git commit -m "refactor(slice-18 18d Task 34-41): retire Lottie completely — drop lottieReverse plumbing, delete LottiePlayer + 1.1MB dead JSON + lottie-web dep"
```

**Acceptance check:** Both apps' tests green; no live `lottie*` references in code/tests; commit lands.

---

## Phase 10 — Close (Tasks 42–47)

### Task 42: Update Public policy for folder-scoped files.read

**Files:**
- Modify: `apps/cms/directus/collections/permissions.json`

- [ ] **Step 1: Find Public policy on directus_files**

```bash
grep -n "directus_files\|public" apps/cms/directus/collections/permissions.json | head -20
```

- [ ] **Step 2: Add (or update) the read row**

Append to the permissions array (or update an existing matching row):

```json
{
	"collection": "directus_files",
	"action": "read",
	"permissions": {
		"_and": [
			{ "folder": { "name": { "_in": ["services", "projects", "blog", "brand", "about", "og"] } } }
		]
	},
	"validation": null,
	"presets": null,
	"fields": ["*"],
	"policy": "public",
	"_syncId": "_sync_perm_public_files_read_folder_scoped"
}
```

(Adjust `policy` value to match the actual Public-policy `_syncId` reference in the file — likely `_sync_policy_public` or similar.)

- [ ] **Step 3: Push schema**

```bash
cd apps/cms
bunx directus-sync push --url $PUBLIC_DIRECTUS_URL --token $DIRECTUS_ADMIN_TOKEN
```

Expected: 1 permission row added/updated.

- [ ] **Step 4: Verify**

```bash
# Unauth GET should now succeed for files in those folders
curl -sI "https://cms.yesid.dev/assets/$BOOTSTRAP_ID?key=hero-1200" | head -1
```

Expected: `HTTP/2 200`.

```bash
# Verify diff empty
bunx directus-sync diff --url $PUBLIC_DIRECTUS_URL --token $DIRECTUS_ADMIN_TOKEN
```

Expected: empty.

**Acceptance check:** Public can read assets in 6 folders; directus-sync diff empty.

### Task 43: Delete dead static files + fix HeroBanner comment

- [ ] **Step 1: Delete dead images**

```bash
rm apps/web/static/images/hero-station-art.png
rm apps/web/static/images/hero-station-art.webp
rm apps/web/static/images/metro-network-ref.svg
rm apps/web/static/images/montreal_map.jpg
rm apps/web/static/images/montreal-metro.source.svg
```

- [ ] **Step 2: Fix HeroBanner.svelte comment**

Open `apps/web/src/lib/components/home/HeroBanner.svelte`. Find line 3:

```svelte
  Uses Yesid's hand-built montreal_map.svg.
```

Replace with content reflecting reality (what HeroBanner currently does). Look at the rest of the component to understand:

```bash
head -30 apps/web/src/lib/components/home/HeroBanner.svelte
```

Then write a one-line factual replacement, e.g.:

```svelte
  Renders the home-page hero band with the metro-network motion (no static map asset).
```

Adjust based on what the component actually does.

- [ ] **Step 3: Verify apps/web build still works**

```bash
cd apps/web
bun run build 2>&1 | tail -20
```

Expected: build succeeds; no missing-asset errors.

**Acceptance check:** 5 dead static files deleted; HeroBanner comment factual; build green.

### Task 44: Update CONVENTIONS.md § 9

**Files:**
- Modify: `docs/slices/slice-18/CONVENTIONS.md`

- [ ] **Step 1: Update preset table**

Find § 9 "File + asset conventions" → preset convention table. Update the row reading:

```markdown
| `thumb-300` | 300 | Navigation thumbnails, related-items lists |
```

To:

```markdown
| `thumb-240` | 240 | Navigation thumbnails, related-items lists, square crop |
```

- [ ] **Step 2: Update AVIF status note**

Below the preset table, replace:

```markdown
AVIF variants added post-P8 probe (18d).
```

With (depending on probe outcome):

If GREEN:
```markdown
**AVIF variants live (18d Task 22):** `hero-1200-avif` (q=75), `card-600-avif` (q=70), `thumb-240-avif` (q=65). Use the AVIF preset key when serving to AVIF-capable clients (`<picture>` with `<source type="image/avif">`).
```

If RED:
```markdown
**AVIF deferred** — P8 probe RED in 18d (see [18d-asset-pipeline/research.md](../slice-18/18d-asset-pipeline/research.md)). WebP is the only modern format in slice-18; revisit post-Directus-12 upstream AVIF support.
```

**Acceptance check:** § 9 reflects 18d outcome.

### Task 45: Populate research.md + decisions.md final state

**Files:**
- Modify: `docs/slices/slice-18/18d-asset-pipeline/research.md`
- Modify: `docs/slices/slice-18/18d-asset-pipeline/decisions.md`

- [ ] **Step 1: Finalize research.md**

Replace any remaining `_TBD_` markers with actual results:
- P8 AVIF: status code + Content-Type + size (from Task 21)
- directus-sync settings-blob: observed behavior (from Task 7)
- R2 layout: flat UUID confirmed or alternative (from Task 20)

Add a new § "Lottie audit findings" with the dead-code report:

```markdown
## Lottie audit findings

LottiePlayer.svelte had zero production consumers (only its own test). 1.1 MB
of byte-identical duplicate JSON across `static/lottie/` and `src/lib/assets/lottie/`.
`lottie-web` dep + `lottieReverse` field plumbed across 6 files but unread.
Cleanup applied in 18d phase 9: 8 files deleted, 1 dep removed, 6 files edited,
1 Directus column dropped.
```

Add a § "Open follow-ups (post-18d)":

```markdown
## Open follow-ups

- R2 bucket versioning: not enabled. GitHub issue filed: <link>. Tackle in 18j polish if quick.
- `apps/cms/directus/snapshot/` subdir: legacy from pre-directus-sync. Cleanup in 18k close.
- assets-id-map sync script (CMS → packages/shared): manual today; consider script-emit on migrate-assets exit.
```

- [ ] **Step 2: Finalize decisions.md**

In the Amendments section, add any deviations from the spec encountered during execution. If none, write `_None._`.

**Acceptance check:** No `_TBD_` markers remain in research.md.

### Task 46: Update plan.md + memory

**Files:**
- Modify: `docs/slices/slice-18/plan.md`
- Modify: `C:\Users\otalo\.claude\projects\C--Users-otalo-Yesito-Projects-yesid-dev\memory\project_slice_18.md`

- [ ] **Step 1: Update slice plan**

Open `docs/slices/slice-18/plan.md`. Update § Status row for 18d:

```markdown
| **18d** | Asset pipeline ... | ✅ closed 2026-04-24 | shipped | [18d-asset-pipeline/](18d-asset-pipeline/) |
```

Add to Amendments log:

```markdown
| 2026-04-24 | **18d closed.** Asset pipeline shipped — 14 files in Directus + 4 (or 7) presets + assets-id-map.json + Lottie retirement (1.1 MB dead JSON + 8 files + 1 dep + 1 Directus field deleted) + montreal-metro.svg consumer flipped to Directus fetch + 5 dead static files (~4.4 MB) deleted. P8 AVIF probe: <green/red>. Public policy folder-scoped files.read live. directus-sync diff empty. | All planned tasks executed; deviations (if any) in 18d-asset-pipeline/decisions.md. | Status table + Amendments log |
```

- [ ] **Step 2: Update memory**

Open `~/.claude/projects/.../memory/project_slice_18.md`. Update the active-slice section to reflect 18d shipped + 18e becoming next-up. (Memory format follows existing conventions in that file.)

**Acceptance check:** plan.md status table reflects 18d closed; Amendments log has new row; memory updated.

### Task 47: Final verification + commit + PR

- [ ] **Step 1: All acceptance gates green** — review § 9 of spec; tick each:

- [ ] 14 files uploaded; legacy_path populated
- [ ] curl `?key=hero-1200`/`card-600`/`thumb-240`/`og-1200` all return 200 + correct format
- [ ] P8 result documented
- [ ] AVIF variants (if green) live
- [ ] assets-id-map.json: 14 entries, alphabetical, Zod-valid
- [ ] @repo/shared exports assetIdFor
- [ ] 4 (or 7) presets visible in Data Studio Settings
- [ ] directus-sync diff empty
- [ ] Public policy folder-scoped to 6 folders
- [ ] bun run test green both apps; bun run check 0 errors
- [ ] lottie-web absent from package.json + bun.lock
- [ ] LottiePlayer + 8 Lottie JSON + lottie.md + lottieReverse all gone
- [ ] services.lottie_reverse field dropped
- [ ] MetroNetwork renders via prop; live homepage smoke green
- [ ] 5 dead static files deleted
- [ ] HeroBanner.svelte comment fixed
- [ ] CONVENTIONS.md § 9 reflects thumb-240 + AVIF status
- [ ] R2 versioning issue filed

- [ ] **Step 2: Final test run**

```bash
cd apps/cms && bun test
cd ../web && bun run check && bun run test
```

Expected: all green.

- [ ] **Step 3: File R2 versioning issue**

```bash
gh issue create \
  --title "R2 bucket versioning: evaluate enable" \
  --body "Slice 18d (close) flagged this as defer-with-issue. Cloudflare R2 versioning is a console toggle (~2min). Evaluate cost vs idempotency benefit; tackle in 18j polish or skip. Source: docs/slices/slice-18/18d-asset-pipeline/research.md § Open follow-ups."
```

Note the issue URL; reference in research.md if useful.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status
git commit -m "feat(slice-18 18d): close — Public policy folder-scoped + dead static cleanup + docs + memory + 18d shipped"
```

- [ ] **Step 5: Open PR**

```bash
git push -u origin feature/slice-18
gh pr create --title "feat(slice-18 18d): asset pipeline + Lottie retirement" --body "$(cat <<'EOF'
## Summary

- Migrated 14 in-use static images from apps/web/static/images/ → Directus + R2 with `legacy_path` idempotency key
- Installed 4 (or 7 with AVIF) saved presets via directus-sync + seed-presets.ts
- Created 6 folders (services/projects/blog/brand/about/og); Public policy grants files.read folder-scoped
- Emitted apps/cms/fixtures/assets-id-map.json (re-exported via packages/shared.assetIdFor)
- Flipped MetroNetwork.svelte consumer from ?raw build-inline to Directus fetch + {@html svg}
- Retired Lottie completely: 1.1 MB dead JSON deleted, lottie-web dep removed, lottieReverse field dropped from Directus + 6 source files
- P8 AVIF probe: <green: 3 variants live | red: deferred>
- Deleted 5 dead static images (~4.4 MB)

## Test plan

- [ ] `bun test` green in apps/cms (14+ tests pass)
- [ ] `bun run test` green in apps/web (~1000+ tests pass)
- [ ] `bun run check` 0 errors in apps/web
- [ ] Live curl: `cms.yesid.dev/assets/<headshot-uuid>?key=hero-1200` returns 200 + image/webp
- [ ] Live homepage: metro map renders + GSAP animations fire
- [ ] `bunx directus-sync diff` empty
- [ ] `grep -ri lottie apps/ packages/` returns no live code matches
EOF
)"
```

**Acceptance check:** PR created + green CI; final test run green.

---

## Plan self-review

### Spec coverage check

| Spec § | Plan task(s) covering it | Notes |
|---|---|---|
| § 2 in-scope #1 (migrate 14 images) | Tasks 8, 23 | manifest triage + live migrate |
| § 2 in-scope #2 (6 folders) | Task 5 | folders.json |
| § 2 in-scope #3 (legacy_path field) | Task 4 | field schema |
| § 2 in-scope #4 (4 presets + AVIF) | Tasks 6, 17, 22 | settings + fixture + AVIF conditional |
| § 2 in-scope #5 (P8 probe) | Task 21 | live probe |
| § 2 in-scope #6 (assets-id-map.json) | Tasks 23, 25 | emitted + tested |
| § 2 in-scope #7 (Public policy) | Task 42 | folder-scoped read |
| § 2 in-scope #8 (Lottie retirement) | Tasks 34–41 | full purge |
| § 2 in-scope #9 (5 dead static files) | Task 43 | rm |
| § 2 in-scope #10 (metro-svg consumer flip) | Tasks 28–33 | port + load + prop flip |
| § 2 in-scope #11 (HeroBanner comment) | Task 43 | inline edit |
| § 2 in-scope #12 (CONVENTIONS thumb-240) | Task 44 | doc edit |
| § 4 schema changes | Task 7 | one push |
| § 5.1 migrate-assets retrofit | Tasks 10–15 | helpers + idempotency + lib + reset + path |
| § 5.1 seed-presets new | Tasks 16–19 | schema + fixture + script + test |
| § 5.2 web additions (metroSvg port) | Tasks 28–32 | port + test + load + flip |
| § 5.2 web deletions (Lottie) | Tasks 37, 38 | files + dep |
| § 5.2 lottieReverse removal | Tasks 34, 35, 36, 40 | shared + sources + tests |
| § 7 testing strategy | Tasks 11, 17(test), 18(test), 25, 30 | unit + mocked-fetch |
| § 8 phases 1–10 | Tasks 1–47 mapped 1:1 | |
| § 9 acceptance gates | Task 47 | final review checklist |
| § 10 risks R1–R9 | covered by Tasks 7 (R1), 12 (R2), 33 (R3), 3 (R4), 21 (R5), 7 (R6), 11 (R7), 26 (R8), 37 (R9) | implicit per task |

**Coverage: complete.**

### Placeholder scan

- No `TBD`/`TODO`/`fill in` in step content (only in initial scaffold templates, where they're explicitly placeholders for live findings)
- All file paths absolute or repo-relative
- All commands have expected output
- All code blocks complete

### Type consistency

- `legacy_path` (snake_case Directus field) vs `legacyPath` (camelCase JS) — consistent throughout
- `PresetsConfig` / `PresetsConfigSchema` / `PresetEntry` — consistent across schema file + tests + script
- `assetIdFor` / `AssetLegacyPath` — consistent across shared package + consumer
- `metroSvg` — consistent across port interface + adapter + load + prop name

**Plan ready for execution.**

---

## Total task count: 47

Estimated: ~6–8 hours of focused work (1 day with breaks). Roughly 12 commits across 10 phases.

## References

- **Spec:** [docs/superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md](../../superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md)
- **Conventions:** [docs/slices/slice-18/CONVENTIONS.md § 4 (seed shape) · § 5 (test taxonomy) · § 9 (file + asset)](../CONVENTIONS.md)
- **Slice plan:** [docs/slices/slice-18/plan.md § 18d](../plan.md)
- **Pre-existing artefacts:**
  - `apps/cms/scripts/migrate-assets.ts` (418 lines; retrofit target)
  - `apps/cms/fixtures/assets-manifest.json` (19 entries; triage to 14)
  - `apps/cms/tests/assets-manifest.test.ts` (14 tests; extend)
- **scripts/lib/* helpers** at `apps/cms/scripts/lib/`: sdk · auth · bottleneck · catch-error · logger · read-fixture · loaders
- **Asset helper (18c Task 47):** `apps/web/src/lib/directus/assets.ts`
