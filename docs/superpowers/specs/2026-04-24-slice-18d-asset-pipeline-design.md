# Slice 18d — Asset Pipeline + Lottie Retirement

- **Status:** Design approved 2026-04-24 · implementation pending
- **Type:** Sub-slice design (per [slice-18 plan § 18d](../../slices/slice-18/plan.md))
- **Session budget:** ~1 day (single session)
- **Branch:** `feature/slice-18` on `yesid.dev` (monorepo)
- **Owner:** Yesid
- **Brainstorm output:** this document (brainstorming session 2026-04-24)

---

## 1. Context

18c shipped monorepo consolidation + services retrofit + conventions. 18d is the last foundation sub-slice — it installs the asset pipeline (folders, presets, `legacy_path` idempotency key, migrate-assets script, AVIF probe, id-map fixture) that 18e–18i consume when content-type migrations reference images.

**Starting state inherited from 18c:**

- directus-sync operational; `apps/cms/directus/**.json` schema authoring
- 72-file schema, Railway env vars locked (`STORAGE_ASSET_TRANSFORM=presets` · `RATE_LIMITER_*` · `REVISIONS_RETENTION=90d` · `WEBSOCKETS_*`)
- `apps/cms/scripts/lib/*` (7 files: sdk, auth, bottleneck, catch-error, logger, read-fixture, loaders)
- `apps/web/src/lib/directus/assets.ts` — `asset(id, preset?)` + `buildSrcSet(id, widths)` helpers
- `apps/cms/fixtures/collections/services.json` seeded; live services render from Directus
- 1011 tests pass in `apps/web`; 0 type errors

**Pre-existing 18d artefacts (inherited from `git subtree add` in 18b from old `yesid.dev-cms@6b29715f`):**

- `apps/cms/scripts/migrate-assets.ts` (418 lines; **pre-18c-conventions**)
- `apps/cms/fixtures/assets-manifest.json` (19 entries, includes dead files)
- `apps/cms/tests/assets-manifest.test.ts` (14 tests, currently passing)

These inherited files require retrofit to match 18c conventions — **not write-from-scratch.** Delta detailed in § 5.

**Prerequisites verified:**

- `cms.yesid.dev` healthy + `scripts/lib/*` helpers present
- `bun 1.3.11`
- 1Password admin token path: `op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/username` + `/password`

---

## 2. Scope

### In scope

1. Migrate 14 in-use static images from `apps/web/static/images/` → Directus + Cloudflare R2
2. Create 6 folders in Directus (`services`, `projects`, `blog`, `brand`, `about`, `og`)
3. Add `legacy_path` custom field on `directus_files` (idempotency key, replaces description-tag pattern)
4. Seed 4 transformation presets (`hero-1200`, `card-600`, `thumb-240`, `og-1200`), +3 AVIF variants if P8 probe green
5. Run P8 AVIF probe live, document result in research.md
6. Emit `apps/cms/fixtures/assets-id-map.json` for 18e-18i consumption
7. Update Public policy: grant `directus_files.read` scoped to 6 content folders (per D10)
8. **Retire Lottie completely** — delete LottiePlayer component, 1.1 MB of dead JSON, `lottie-web` dep, `lottieReverse` field plumbing across 6 source files + directus schema
9. **Delete 5 dead static images** from `apps/web/static/images/` (~4.4 MB)
10. Flip `MetroNetwork.svelte` consumer to fetch SVG from Directus (replaces `?raw` inline import)
11. Fix stale doc comment in `HeroBanner.svelte`
12. Update `CONVENTIONS.md § 9` preset table (`thumb-300` → `thumb-240`)

### Out of scope (deferred to later sub-slices)

- 18l brand assets (Directus logo/favicon upload) — depends on 18d pipeline
- Editor-uploaded file lifecycle (orphan sweep, rotation) — deferred to 18j polish
- R2 bucket versioning evaluation — GitHub issue only, enable in 18j if quick
- `apps/cms/directus/snapshot/` subdir cleanup — 18k close scope
- Content migrations (projects, blog, tech-stack, meta, pages) — 18e–18i scope

---

## 3. Decisions (from brainstorm 2026-04-24)

### A. Scope & triage

- **A1 · hero-station-art duplicate** — both `.png` (2.6 MB) and `.webp` (168 KB) deleted. Neither referenced in `apps/web/src/`.
- **A2 · `.source.svg`** — deleted. Figma export source; not referenced.
- **A3 · brand logo/favicon** — deferred to 18l. 18d uploads from `apps/web/static/images/` only.
- **A4 · folder assignment** — 14 files across 3 populated folders (`about`=12, `brand`=1 (montreal-metro.svg), `projects`=1 (yesid-dev.png)) + 3 declared-empty folders (`services`, `blog`, `og`) created for 18e/18f/18i/18l to populate. See § 5 for per-file mapping.
- **A5 · image re-processing at upload** — upload as-is. Presets handle serving-time transforms. No Sharp dep.

### B. Schema & conventions

- **B1 · `legacy_path` key shape** — full relative path from `apps/web/static/`, e.g. `images/about/headshot.webp`. Unique index on non-NULL values.
- **B2 · Alt text** — derived default `deriveAltText(filename)` (kebab→space, sentence-case), editor override in Data Studio; not publish-blocking in 18d.
- **B3 · R2 bucket layout** — probe question, not design decision. Document actual behavior in research.md (expect flat UUID keys).
- **B4 · `storage_asset_presets` diff** — probe question. Settings is one blob; array replace, not merge. If directus-sync diff reads cleanly, use it. Fallback: SDK seed + `directus-sync pull` to capture.
- **B5 · AVIF probe sequencing** — bootstrap 1 file → probe → branch. Single explicit phase (phase 6).

### C. Process

- **C1 · Migration atomicity** — resumable, not atomic. Each upload independent. Re-run safe via `legacy_path` check. `--dry-run` + `--reset` (deletes by `legacy_path` matches; never folder-wide nuke).
- **C2 · Test strategy** — pure helpers unit-tested; I/O is live-smoke-only (not CI-gated; requires admin token).
- **C3 · `apps/cms/directus/snapshot/` subdir** — leave for 18k cleanup.
- **C4 · Manifest as control surface** — yes. Single source of truth for folder/alt overrides; Zod-validated; diff-friendly.

### D. Montreal metro SVG

- **Migrate to Directus + flip consumer in 18d.** Treat as content (network changes IRL); `{@html svg}` preserves CSS-color-friendliness; small apps/web scope creep (~10 LOC + 2 tests).

### E. Lottie

- **Full retirement in 18d.** Zero production consumers; ~1.1 MB dead bytes; `lottie-web` unused npm dep; `lottieReverse` field plumbed across 6 source files but nothing reads it. Includes Directus schema drop of `services.lottie_reverse`.

### F. Task-list structure

- **Approach A (schema-first, dependency-ordered) with borrowing from B (bootstrap + AVIF probe before full batch).** 10 phases, see § 8.

---

## 4. Schema changes (one directus-sync push)

| Change | File | Action | Notes |
|---|---|---|---|
| `directus_files.legacy_path` custom field | `apps/cms/directus/fields/directus_files/legacy_path.json` | **add** | string; unique on non-NULL; indexed; hidden in list view; full width; note="Idempotency key for migrate-assets (slice-18d); Not editable post-migration" |
| 6 folders | `apps/cms/directus/collections/folders.json` | **add** | `services`, `projects`, `blog`, `brand`, `about`, `og` · parent=null · each with `_syncId` prefix `_sync_folder_` |
| `storage_asset_presets` array | `apps/cms/directus/collections/settings.json` | **update** | 4 preset objects (§ 5.2); +3 AVIF variants post-probe |
| `services.lottie_reverse` field | `apps/cms/directus/snapshot/fields/services/lottie_reverse.json` | **delete** | Destructive — live data on `sql-development` row becomes null before drop (see risk R4) |

**Ordering:** single push at phase 2 close. Destructive drop + non-destructive additions in same diff. `directus-sync diff` empty required before phase proceeds.

---

## 5. Code surface

### 5.1 · `apps/cms`

#### `scripts/migrate-assets.ts` — retrofit existing 418-line script

**Deltas vs pre-existing code:**

- **Idempotency** — replace description-tag (`[legacy:...]`) with `legacy_path` field query: `readFiles({ filter: { legacy_path: { _in: manifest paths } }, fields: ['id', 'legacy_path'] })`. Build `Map<legacyPath, id>` for skip check.
- **Auth** — remove inline `getAdminToken`, import from `./lib/auth`.
- **Client** — remove inline `createClient`, import from `./lib/sdk`.
- **Errors** — wrap all `client.request(...)` in try/catch; surface via `parseErrors` + `DirectusError` from `./lib/catch-error`.
- **Rate-limiting** — wrap `uploadOne` with `withRateLimit({ maxConcurrent: 3, minTime: 100 })` from `./lib/bottleneck`. Lower concurrency than default 5 due to R2 multipart weight.
- **Flags** — add `--reset` (delete files where `legacy_path` in manifest, then re-upload) alongside existing `--dry-run`.
- **Source default** — `resolvePath(import.meta.dir, '..', '..', 'web', 'static', 'images')` (monorepo-aware).
- **Folders** — remove dependency on `manifest.folders` having exactly the used keys; always ensure all 6 declared folders exist (even if empty for 18d; 18e-18i populate the rest).
- **Upload call** — set `legacy_path` via form field on `uploadFiles(form)`; description becomes plain editor alt text (no `[legacy:...]` prefix).

**New pure helpers (exported for tests):**

- `deriveAltText(filename: string): string` — `'anime.webp'` → `'Anime'` · `'polaroid-1.webp'` → `'Polaroid 1'` · `'logo-3.svg'` → `'Logo 3'`
- `filterToUpload(manifest: AssetsManifest, existingByPath: Map<string, string>): { alreadyUploaded: Map<string, string>; toUpload: AssetEntry[] }` — replaces `mergeExistingFiles`
- `buildIdMap(entries: Array<{ legacyPath: string; id: string }>): Record<string, string>` — stable alphabetical order

**Kept from pre-existing code:**

- `parseManifest`, `resolveSourcePath`, `findMissingSources`, `extractLegacyTopLevel`, `validateFolderReferences`, `AssetEntrySchema`, `AssetsManifestSchema`

#### `fixtures/assets-manifest.json` — triage to 14 entries

**Remove 6 dead entries:** `hero-station-art.png`, `hero-station-art.webp`, `metro-network-ref.svg`, `montreal_map.jpg`, `montreal-metro.source.svg` (decide: keep `montreal-metro.svg`).

**Folder declarations:** all 6 folders (services/projects/blog/brand/about/og), even with only 3 populated in 18d.

**Final 14-entry manifest:**

| legacyPath | folder |
|---|---|
| `images/montreal-metro.svg` | brand |
| `images/about/headshot.webp` | about |
| `images/about/polaroid-1.webp` | about |
| `images/about/polaroid-2.webp` | about |
| `images/about/polaroid-3.webp` | about |
| `images/about/interests/anime.webp` | about |
| `images/about/interests/dataviz.webp` | about |
| `images/about/interests/food.webp` | about |
| `images/about/interests/opensource.webp` | about |
| `images/about/logo-1.svg` | about |
| `images/about/logo-2.svg` | about |
| `images/about/logo-3.svg` | about |
| `images/about/logo-4.svg` | about |
| `images/work/yesid-dev.png` | projects |

Note: `legacyPath` now prefixed with `images/` per decision B1 (full path from `apps/web/static/`).

#### `scripts/seed-presets.ts` — new

Purpose: push `directus_settings.storage_asset_presets` from `fixtures/brand/presets.json`.

Shape:

```ts
#!/usr/bin/env bun
import { readSingleton, updateSingleton } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { readFixture } from './lib/read-fixture';
import { PresetsSchema } from './lib/schemas/presets';  // new local Zod schema
import { createLogger } from './lib/logger';

export function buildPresetPayload(config: PresetsConfig): DirectusPresetsSettings { ... }

export async function seedPresets(opts: SeedOpts): Promise<void> {
  if (opts.dryRun) { log.info(`dry-run: would patch storage_asset_presets with ${opts.config.presets.length} presets`); return; }
  await client.request(updateSingleton('directus_settings', { storage_asset_presets: opts.config.presets }));
}

if (import.meta.main) { main().catch(...); }
```

Flags: `--dry-run`, `--reset` (reset is identical to full push for a single-blob setting; alias for clarity with seed-services pattern).

#### `fixtures/brand/presets.json` — new

```json
{
  "presets": [
    { "key": "hero-1200", "fit": "contain", "width": 1200, "format": "webp", "quality": 85, "withoutEnlargement": true },
    { "key": "card-600",  "fit": "contain", "width": 600,  "format": "webp", "quality": 80, "withoutEnlargement": true },
    { "key": "thumb-240", "fit": "cover",   "width": 240,  "height": 240, "format": "webp", "quality": 75 },
    { "key": "og-1200",   "fit": "cover",   "width": 1200, "height": 630, "format": "jpg",  "quality": 85 }
  ]
}
```

Post-P8-green addendum:

```json
{ "key": "hero-1200-avif", "format": "avif", "width": 1200, "quality": 75 },
{ "key": "card-600-avif",  "format": "avif", "width": 600,  "quality": 70 },
{ "key": "thumb-240-avif", "format": "avif", "width": 240,  "height": 240, "fit": "cover", "quality": 65 }
```

#### `fixtures/assets-id-map.json` — emitted by migrate-assets

```json
{
  "images/about/headshot.webp": "11111111-...",
  "images/about/interests/anime.webp": "22222222-...",
  "images/about/logo-1.svg": "33333333-...",
  ...
}
```

Alphabetical key order. UUID values. Committed to repo. Zod-validated via `tests/assets-id-map.test.ts`.

#### Tests

- `tests/assets-manifest.test.ts` — extend: 13-entry expectation; `legacyPath` must start with `images/`
- `tests/migrate-assets.test.ts` — new (or extend existing): `deriveAltText`, `filterToUpload`, `buildIdMap`
- `tests/seed-presets.test.ts` — new: `buildPresetPayload`, Zod validation
- `tests/assets-id-map.test.ts` — new: schema validation, alphabetical order, UUID format
- `tests/brand-presets-fixture.test.ts` — new: Zod validation of `fixtures/brand/presets.json`
- `tests/seed-dry-run.test.ts` — update: remove `lottie_reverse` assertions

### 5.2 · `apps/web`

#### Additions

**`src/lib/adapters/directus.ts`** — new port method on content namespace:

```ts
async metroSvg(ctx?: PreviewContext): Promise<string> {
  const idMap = await loadAssetsIdMap();  // helper reads fixture
  const id = idMap['images/montreal-metro.svg'];
  if (!id) throw new Error('metroSvg: id-map missing montreal-metro.svg entry');
  return parsePort(
    'content.metroSvg',
    z.string().min(1),
    await queuedFetch(`${url}/assets/${id}`, ctxHeaders(ctx)).then(r => r.text())
  );
}
```

**`src/lib/directus/assets-id-map.ts`** — new helper:

```ts
import idMap from '../../../../cms/fixtures/assets-id-map.json';  // type-safe via tsconfig path alias or local copy
// OR: static import via packages/shared re-export if we want cross-app consumption
export function assetIdFor(legacyPath: string): string { ... }
```

**Decision point:** how does `apps/web` read `assets-id-map.json` given D12 (app independence)? Options:

- **Option α:** static import via relative path `../../../../cms/fixtures/...` (convention violation; code review catches)
- **Option β:** Add to `@repo/shared` re-export (D14 compliant; types + JSON only)
- **Option γ:** Copy at build time via script (D12 clean but adds build step)

→ **Recommend β** — `packages/shared/fixtures/assets-id-map.json` re-exports the CMS fixture; `@repo/shared` surfaces `assetIdFor(path)`. Source of truth remains CMS; sync via a copy script in `packages/shared/package.json` build step. Revisit if this adds friction.

**`src/routes/+page.server.ts`** (homepage — renders MetroNetwork):

```ts
export const load = async ({ fetch, ... }: ServerLoadEvent) => {
  const [...existingLoaders, metroSvg] = await Promise.all([
    ...,
    adapters.content.metroSvg()
  ]);
  return { ..., metroSvg };
};
```

Exact route to be confirmed in phase 8 (grep for `MetroNetwork` import).

**`src/lib/motion/svg/MetroNetwork.svelte`** — flip to props:

```svelte
<script lang="ts">
  let { svg, containerEl = $bindable(), svgEl = $bindable() } = $props<{ svg: string }>();
  ...
</script>

<div bind:this={containerEl} ...>{@html svg}</div>
```

Consumer updated: `<MetroNetwork svg={data.metroSvg} />`.

#### Deletions (Lottie retirement)

| File / artefact | Action |
|---|---|
| `src/lib/motion/components/LottiePlayer.svelte` | delete |
| `src/lib/motion/components/LottiePlayer.test.ts` | delete |
| `static/lottie/station-{analytics,performance,pipeline,sql}.json` (~540 KB) | delete (4 files) |
| `src/lib/assets/lottie/station-{analytics,performance,pipeline,sql}.json` (~540 KB) | delete (4 files, byte-identical duplicate of static/) |
| `src/content/stack/lottie.md` | delete |
| `lottie-web: ^5.13.0` in `package.json` | remove → `bun install` regenerates lockfile |

#### Deletions (static images)

| File | Size |
|---|---:|
| `static/images/hero-station-art.png` | 2.6 MB |
| `static/images/hero-station-art.webp` | 168 KB |
| `static/images/metro-network-ref.svg` | 320 KB |
| `static/images/montreal_map.jpg` | 1.3 MB |
| `static/images/montreal-metro.source.svg` | 24 KB |

**Total deleted from static/: 4.4 MB.** (`montreal-metro.svg` retained at 16 KB because `?raw` consumer is flipped in phase 8, not phase 9.)

#### `lottieReverse` field removal — 6 source files

| File | Lines | Action |
|---|---|---|
| `src/lib/adapters/directus.ts` | 73, 187-188 | Remove row type field + mapping block |
| `src/lib/adapters/directus.contract.test.ts` | 94-109 | Remove test block (or reframe for next non-deleted optional field) |
| `src/lib/schemas/service.ts` | 30 | Remove Zod field |
| `src/lib/content/services.ts` | 176 | Remove `lottieReverse: true` from `sql-development` entry |
| `packages/shared/src/types/content.ts` | (lookup) | Remove `lottieReverse?: boolean` from Service interface |
| `src/tests/setup.dom.ts` | 71 | Update comment; verify IntersectionObserver stub is used by other consumers (if yes, keep stub, reword comment; if no, delete stub) |

#### Tests (apps/web)

- `bun run check` — 0 type errors post-Lottie removal
- `bun run test` — full suite green; `directus.contract.test.ts` passes without `lottieReverse` assertions
- New: `src/lib/adapters/directus.mocked.test.ts` adds `content.metroSvg` mocked-fetch assertion (URL shape: `/assets/<uuid>` GET; returns plain text)

### 5.3 · `apps/web/src/lib/components/home/HeroBanner.svelte`

Stale doc comment line 3: `"Uses Yesid's hand-built montreal_map.svg."` — references a non-existent file. Update to reflect reality (e.g., describe what HeroBanner actually does).

---

## 6. Data flow

```
fixtures/assets-manifest.json  (14 entries, Zod-validated)
fixtures/brand/presets.json    (4 presets, Zod-validated)
apps/web/static/images/**       (source files)
directus/fields/.../legacy_path.json  (schema)
directus/collections/folders.json      (schema)
directus/collections/settings.json     (storage_asset_presets)
       │
       ▼
  bun run migrate:assets
  bun run seed:presets
       │
       ▼
  Directus API (Railway)
       │
       ▼
  directus_files (with legacy_path)
  directus_settings (storage_asset_presets)
  Cloudflare R2 (asset bytes)
       │
       ▼
  fixtures/assets-id-map.json (emitted + committed)
       │
       ├────→ packages/shared/fixtures/assets-id-map.json (re-exported)
       │              │
       │              ▼
       │      @repo/shared.assetIdFor(path): string
       │              │
       │              ▼
       │      apps/web consumers: content.metroSvg() + 18e-18i content ports
       │              │
       │              ▼
       │      asset(id, preset?) helper → /assets/<id>?key=<preset>
       │
       └────→ 18e/18f/18g/18h/18i/18l seed scripts reference by legacyPath
```

**Consumer flow (montreal-metro.svg SSR):**

```
GET /  (homepage)
  │
  ▼
+page.server.ts load()
  │   await adapters.content.metroSvg()
  ▼
  client.request(readAsset(id)) → GET cms.yesid.dev/assets/<uuid>
  │   returns text/svg+xml body
  ▼
returns { metroSvg: '<svg>...</svg>' }
  │
  ▼
+page.svelte: <MetroNetwork svg={data.metroSvg} />
  │
  ▼
MetroNetwork.svelte: <div>{@html svg}</div>
  │
  ▼
SSR HTML contains inlined SVG (CSS-styleable, GSAP-targetable)
```

---

## 7. Testing strategy

### Unit (no network; CI-gated)

- `tests/assets-manifest.test.ts` — extend with 13-entry expectation + `images/` prefix assertion
- `tests/migrate-assets.test.ts` — exercise `deriveAltText`, `filterToUpload`, `buildIdMap`, `parseManifest` triaged shape
- `tests/seed-presets.test.ts` — exercise `buildPresetPayload` + Zod `PresetsSchema` rejection on malformed input
- `tests/assets-id-map.test.ts` — schema validation + alphabetical key order + UUID format
- `tests/brand-presets-fixture.test.ts` — round-trip `fixtures/brand/presets.json` through Zod
- `tests/seed-dry-run.test.ts` — update: remove `lottie_reverse` from expected row shape

### Live smoke (manual, gated on `DIRECTUS_ADMIN_TOKEN`; NOT CI-run)

- `bun run migrate:assets -- --dry-run` — parses manifest, lists files, asserts all source files exist on disk
- `bun run migrate:assets -- --limit 1 --source apps/web/static/images` (via temp env) — 1 file upload bootstrap
- `curl -I cms.yesid.dev/assets/<id>?key=hero-1200` — returns `image/webp`, `Content-Length` ≈ scaled size
- `curl -I cms.yesid.dev/assets/<id>?format=avif` — **P8 probe**: image/avif or 415/400
- Full `bun run migrate:assets` — remaining 13 uploads in <60s (phase-6 bootstrap already uploaded 1 of 14)
- Post-migrate sample check: 3 files × 4 presets each = 12 curl-I calls, all 200 + correct Content-Type

### Regression (apps/web, CI-gated)

- `bun run check` — 0 type errors
- `bun run test` — full suite green
- `directus.contract.test.ts` — still green with `lottieReverse` removed
- New mocked-fetch test for `content.metroSvg` — asserts GET `/assets/<uuid>` returns text

### Directus schema correctness

- `bunx directus-sync diff` — empty after phase 2 push
- Manual: Data Studio → Settings → File Transformation Presets → 4 (or 7) entries visible
- Manual: Data Studio → Files → 6 folders visible at root
- Manual: Data Studio → Roles → Public → Files → read allowed filtered by folder IN 6-folder-set

### Live homepage smoke

Visual check post-phase-8: `/` (or wherever MetroNetwork renders) — metro map displays, GSAP animations fire, no console errors.

---

## 8. Task phases

Each phase has a tight exit gate. Phase cannot proceed to next until gate green.

### Phase 1 — Pre-flight

- Create `docs/slices/slice-18/18d-asset-pipeline/research.md` (empty scaffold with § for probe P8, directus-sync diff findings, R2 layout discovery)
- Create `docs/slices/slice-18/18d-asset-pipeline/decisions.md` (initial row per decision A-F from § 3)
- Confirm pre-existing artefacts land audit (migrate-assets.ts 418 lines · assets-manifest.json 19 entries · assets-manifest.test.ts 14 tests)
- Verify tooling: `bun --version` ≥ 1.3.11 · `op --version` · `bunx directus-sync --version`
- **Exit gate:** research.md + decisions.md skeletons committed; tooling verified

### Phase 2 — Schema push

- Write `apps/cms/directus/fields/directus_files/legacy_path.json` (per § 4 specs)
- Update `apps/cms/directus/collections/folders.json` with 6 folders (services/projects/blog/brand/about/og)
- Update `apps/cms/directus/collections/settings.json` — add `storage_asset_presets` array with 4 presets (§ 5.1 shape)
- Pre-zero `lottie_reverse` data: SDK call `updateItem('services', 'sql-development', { lottie_reverse: null })`
- Delete `apps/cms/directus/snapshot/fields/services/lottie_reverse.json`
- `bunx directus-sync push` (via script or manual with token)
- `bunx directus-sync diff` → empty
- **Exit gate:** diff empty + 6 folders visible in Data Studio + `legacy_path` field visible on directus_files + 4 presets visible in Settings + `lottie_reverse` column removed from services

### Phase 3 — Manifest retrofit

- Edit `apps/cms/fixtures/assets-manifest.json`: drop 5 dead entries, keep 13 (add `images/` prefix to all legacyPath values), declare all 6 folders in `folders:{}`
- Update `apps/cms/tests/assets-manifest.test.ts`:
  - Change expected count assertion: 13 (not 19)
  - Add: every `legacyPath` must start with `images/`
  - Add: folders map must declare all 6 folder names
- Run `bun test tests/assets-manifest.test.ts` → green
- **Exit gate:** manifest test green with 14 entries + 6 folder declarations

### Phase 4 — Script retrofit (migrate-assets)

- Replace description-tag idempotency with `legacy_path` filter query (per § 5.1 deltas)
- Swap inline auth/client for `./lib/auth` + `./lib/sdk`
- Wrap `uploadOne` with `withRateLimit({ maxConcurrent: 3, minTime: 100 })`
- Add `--reset` flag (deletes by `legacy_path` IN manifest)
- Fix source default to monorepo path
- Add new pure helpers: `deriveAltText`, `filterToUpload`, `buildIdMap`
- Write `tests/migrate-assets.test.ts` (or extend existing) — exercise new helpers
- **Exit gate:** `bun test tests/migrate-assets.test.ts tests/assets-manifest.test.ts` green · `bun run check` 0 errors · dry-run on local dir lists expected 14 files

### Phase 5 — Seed-presets script

- Write `apps/cms/scripts/lib/schemas/presets.ts` (Zod `PresetsSchema`)
- Write `apps/cms/scripts/seed-presets.ts` per § 5.1 shape
- Write `apps/cms/fixtures/brand/presets.json` with 4 presets
- Write `tests/seed-presets.test.ts` + `tests/brand-presets-fixture.test.ts`
- `bun run seed:presets -- --dry-run` passes
- **Exit gate:** 2 new tests green · dry-run logs expected payload · Zod schema rejects malformed fixture

### Phase 6 — Bootstrap upload + AVIF probe

- Add script entry to `apps/cms/package.json`: `"migrate:assets": "bun run scripts/migrate-assets.ts"`, `"seed:presets": "bun run scripts/seed-presets.ts"`
- Set env: `DIRECTUS_ADMIN_TOKEN=$(op read ...)` via 1Password CLI
- Run `bun run seed:presets` → 4 presets live
- Run `bun run migrate:assets -- --limit 1 --filter 'about/headshot.webp'` (single file upload; may need to add `--filter` flag to script)
- `curl -I cms.yesid.dev/assets/<headshot-uuid>?key=hero-1200` → 200 + image/webp + ~12 KB
- **AVIF probe**: `curl -I cms.yesid.dev/assets/<headshot-uuid>?format=avif`
- Document probe result + preset shape in `18d-asset-pipeline/research.md`
- Branch decision:
  - **If probe green** (image/avif returned): append 3 AVIF variants to `fixtures/brand/presets.json`; re-run `bun run seed:presets`; verify 7 presets live
  - **If probe red** (400/415/JSON error): document "WebP-only for slice-18" in research.md; leave 4 presets
- **Exit gate:** probe result documented + AVIF decision locked + 4 or 7 presets live + bootstrap upload round-trips via `?key=hero-1200`

### Phase 7 — Full migrate + id-map

- Run `bun run migrate:assets` for remaining 13 files
- Verify `apps/cms/fixtures/assets-id-map.json` written with 14 alphabetically-ordered entries
- Sanity: pick 3 files × 3 presets → 9 curl -I calls; all return 200 + expected Content-Type + reasonable Content-Length
- Commit `assets-id-map.json`
- Copy (or script-emit) `assets-id-map.json` to `packages/shared/fixtures/assets-id-map.json` (per Option β from § 5.2) + add `@repo/shared` re-export `assetIdFor(path)`
- Write `tests/assets-id-map.test.ts` + run
- **Exit gate:** 14 uploads complete · id-map committed · 9-curl sample green · shared re-export + test green

### Phase 8 — Consumer flip (montreal-metro SVG)

- Grep `apps/web/src/routes/` for components that import `MetroNetwork` to find the right `+page.server.ts`
- Write `apps/web/src/lib/adapters/directus.ts` → add `content.metroSvg(ctx?)` method per § 5.2
- Update the identified `+page.server.ts` load to include `metroSvg`
- Flip `apps/web/src/lib/motion/svg/MetroNetwork.svelte` to accept `svg` prop (§ 5.2)
- Update consumer `<MetroNetwork svg={data.metroSvg} />` wherever rendered
- Add mocked-fetch test: `apps/web/src/lib/adapters/directus.mocked.test.ts` → asserts GET `/assets/<uuid>` pattern
- `bun run check` + `bun run test` green
- Live smoke: deploy preview · load `/` · metro map visible · GSAP animations play · no console errors
- **Exit gate:** homepage renders MetroNetwork from Directus · full test suite green · type-check clean

### Phase 9 — Lottie retirement

- Delete files (§ 5.2 deletions list): LottiePlayer.svelte + test · static/lottie/*.json (4) · src/lib/assets/lottie/*.json (4) · src/content/stack/lottie.md
- Remove `lottieReverse` from 6 source files per § 5.2 table
- Remove `lottie-web` from `apps/web/package.json` · `bun install` regenerates `bun.lock`
- Check `apps/cms/fixtures/collections/services.json` — remove `lottieReverse: true` from sql-development entry
- Check `apps/cms/scripts/seed-services.ts` — remove `lottie_reverse` from `DirectusServiceRow` + `toServiceRow`
- Update `tests/seed-dry-run.test.ts` — remove `lottie_reverse` from expected row shape
- `bun run check` in apps/web → 0 errors
- `bun run test` in both apps → green
- **Exit gate:** full test suite green · `bun.lock` diff shows `lottie-web` removed · `grep -ri lottie apps/ packages/` returns only unrelated matches (git history, README mentions)

### Phase 10 — Close

- Update `apps/cms/directus/collections/permissions.json` → Public policy: add `directus_files.read` with folder-scoped filter per D10 (`{ folder: { id: { _in: [folder_ids] } } }` or equivalent by-name filter)
- Push `directus-sync` → `diff` empty
- Delete 5 dead static files from `apps/web/static/images/`
- Fix `apps/web/src/lib/components/home/HeroBanner.svelte:3` stale comment
- Update `docs/slices/slice-18/CONVENTIONS.md § 9`: rename `thumb-300` → `thumb-240` in preset table; mention AVIF variant status (green or deferred per phase 6)
- Populate `18d-asset-pipeline/decisions.md` with AVIF result + any deviations from this spec
- Write `18d-asset-pipeline/research.md` final content: directus-sync storage_asset_presets diff behavior findings · R2 layout finding · P8 result
- Update memory `project_slice_18.md` — 18d shipped row
- Add `docs/slices/slice-18/plan.md` Amendments row: "2026-04-24 · 18d shipped"
- File GitHub issue for R2 bucket versioning (defer to 18j)
- Open PR on yesid.dev against main (or ready-for-review on feature/slice-18)
- **Exit gate:** PR green · all acceptance gates § 9 satisfied · Codex review scheduled for 18k (not blocking)

---

## 9. Acceptance gates

All must be green before merge.

- [ ] 14 files uploaded; `legacy_path` field populated on every record
- [ ] `curl cms.yesid.dev/assets/<id>?key=hero-1200 -I` → `image/webp` + 1200-wide
- [ ] `curl ...?key=card-600` · `?key=thumb-240` · `?key=og-1200` all work
- [ ] P8 AVIF probe result documented in `18d-asset-pipeline/research.md`
- [ ] If AVIF green: 3 AVIF variants live in Data Studio
- [ ] `apps/cms/fixtures/assets-id-map.json` committed · Zod-valid · 14 entries · alphabetically ordered
- [ ] `packages/shared` re-exports `assetIdFor(path)` typed helper
- [ ] 4 (or 7) presets visible in Data Studio → Settings → File Transformation Presets
- [ ] `bunx directus-sync diff` empty after final push
- [ ] Public policy grants `directus_files.read` folder-scoped to 6 folders (not blanket)
- [ ] `bun run test` green in both apps · `bun run check` 0 errors in apps/web
- [ ] `lottie-web` absent from `apps/web/package.json` + `bun.lock`
- [ ] LottiePlayer + 8 Lottie JSON + content/stack/lottie.md + `lottieReverse` everywhere deleted
- [ ] `services.lottie_reverse` Directus field dropped
- [ ] `MetroNetwork.svelte` renders via prop; live homepage smoke green (GSAP anim fires)
- [ ] 5 dead static files deleted from `apps/web/static/images/`
- [ ] `HeroBanner.svelte:3` doc comment updated
- [ ] `CONVENTIONS.md § 9` reflects `thumb-240`
- [ ] GitHub issue filed for R2 bucket versioning (18j scope)

---

## 10. Risks + mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | `storage_asset_presets` via directus-sync is one-big-blob; array replace (not merge) may drift or reject | Phase 2 dry-run push + diff review; fallback: SDK seed via `seed-presets.ts` + `directus-sync pull` to capture |
| R2 | `legacy_path` unique index conflicts with editor-uploaded files of same filename | Index is unique on NON-NULL only; editor uploads leave NULL; idempotency filter queries use `_nnull` + `_in` |
| R3 | MetroNetwork SSR fetches SVG from Directus; Vercel build fails if CMS unreachable | Default SvelteKit SSR renders at request time, not build; ISR+revalidation handles post-edit cache bust; verify in phase 8 preview |
| R4 | Dropping `lottie_reverse` field errors because row has non-null value | Phase 2 pre-zeros via SDK `updateItem` before drop |
| R5 | AVIF probe is first live upload; order sensitivity | Phase 6 sequences explicitly: push schema → 1-file bootstrap → probe → branch decision → full batch |
| R6 | directus-sync rejects field drop due to referential concerns | Fallback: manual column drop via Data Studio; document in `docs/ops/rollback.md` |
| R7 | Pre-existing `migrate-assets.ts` retrofit introduces regressions in pre-existing 14 tests | Incremental retrofit: update helpers one at a time; run `bun test tests/assets-manifest.test.ts` after each; green → proceed |
| R8 | `packages/shared` re-export of JSON fixture creates build ordering issue (CMS must emit before web can build) | Phase 7 commits the id-map; subsequent builds use committed artefact; if drift occurs, tests catch; long-term: consider CI check |
| R9 | Lottie stack article content loss (`content/stack/lottie.md`) | Content is listed in the post-18 memory retire-list; 18f blog migration can reference if user wants a farewell note; safe to delete |

---

## 11. References

- **Brainstorm discussion:** 2026-04-24 session (this document's source)
- **Slice parent:** [docs/slices/slice-18/plan.md § 18d](../../slices/slice-18/plan.md)
- **Replan spec:** [docs/superpowers/specs/2026-04-24-slice-18-replan.md § 7.1](./2026-04-24-slice-18-replan.md) (18d sketch + D9 asset decisions)
- **Conventions:** [docs/slices/slice-18/CONVENTIONS.md § 9](../../slices/slice-18/CONVENTIONS.md) (file + asset conventions)
- **18c research — P8 AVIF:** [docs/slices/slice-18/18c-foundations/research.md § P8](../../slices/slice-18/18c-foundations/research.md)
- **Pre-existing script:** `apps/cms/scripts/migrate-assets.ts`
- **Pre-existing manifest:** `apps/cms/fixtures/assets-manifest.json`
- **Scripts lib (18c):** `apps/cms/scripts/lib/` (7 files)
- **Asset helper (18c Task 47):** `apps/web/src/lib/directus/assets.ts`

---

## 12. Amendments log

| Date | Change | Why |
|---|---|---|
| 2026-04-24 | Spec written + approved | Brainstorm complete |
