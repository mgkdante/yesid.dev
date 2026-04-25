# 18d — Research

> Probe findings + live-state observations. Populated as work progresses; finalized at close.

## P8 — AVIF support

**Status:** Resolved — Task 21 (2026-04-24).

**Method:**
1. Ad-hoc `?format=avif` probe: returned HTTP 200 + WebP body (9344 bytes = original size) — confirms `STORAGE_ASSET_TRANSFORM=presets` blocks ad-hoc transforms and falls back to the original.
2. Preset probe (`probe-avif` key, `format: "avif"`, q=75): added temporarily, waited 3s, fetched via `?key=probe-avif` — returned HTTP 200 + WebP body (9344 bytes = same as source). AVIF format silently downgraded by Sharp/Directus to WebP.

**Bootstrap file:** `headshot.webp` — 9344 bytes, 600×400 px (smaller than all preset targets; `withoutEnlargement: true` prevents upscaling, so all presets return the original dimensions).

**Result:** RED. `curl -s /assets/66f6ddc8-c3f2-4bd7-97a5-978940757b77?key=probe-avif` returned HTTP 200 + `file` identified output as `RIFF (little-endian) data, Web/P image, VP8 encoding, 600x400`. AVIF format not supported — silently downgraded to WebP. Size was identical to the original (9344 bytes vs 9344 bytes).

**Decision:** WebP-only stack for slice-18. AVIF deferred until Directus 12 upstream support lands (requires libvips/Sharp rebuild with AVIF encoder). Skip Task 22.

---

## directus-sync `storage_asset_presets` diff behavior

**Status:** Resolved — Task 7 (2026-04-24).

**Question:** Is the `storage_asset_presets` JSON in `directus/collections/settings.json` array-replace, array-merge, or per-entry diffable?

**Result:** Settings is one blob; `storage_asset_presets` array replaced wholesale via a single UPDATE entry in the diff. directus-sync push handled the change cleanly — the entire 4-preset array was written in one settings UPDATE, and diff went empty post-push. No partial-merge behavior observed.

**Additional finding (Task 7):** `directus-sync` uses `preserveIds = true` for the folders collection. This means `_syncId` values in `directus/collections/folders.json` must be valid UUIDs — directus-sync sends the `_syncId` as the folder's `id` field in the POST body. Non-UUID `_syncId` strings (e.g., `_sync_folder_services`) cause Directus to return HTTP 403 FORBIDDEN. Folders JSON was corrected to use proper UUIDs as `_syncId` values before the push succeeded.

**Decision:** Use directus-sync as primary authoring path. `seed-presets.ts` (Task 18) provides a parallel SDK-based path for manual presets pushes when directus-sync is not desired (e.g., AVIF variant addition mid-flight in Task 22). The two paths are safe to coexist — directus-sync does a full array replace, so whichever runs last wins; coordinate order explicitly.

---

## Preset transform behavior

**Status:** Resolved — Task 24 (2026-04-25).

**Question:** Do `storage_asset_presets` actually transform images, or silently pass through?

**Method:** Downloaded `yesid-dev.png` (355621 bytes, 2482×1326 PNG) via `?key=thumb-240`, `?key=card-600`, and `?key=hero-1200`. Inspected resulting dimensions + file sizes using `file` command. Also downloaded `headshot.webp` (9344 bytes, 600×400 WebP) via `?key=thumb-240`. Checked response `content-disposition` and `content-type` headers.

**Result:** Transforms NOT executing. All 3 preset downloads of `yesid-dev.png` returned identical raw PNG (355621 bytes, 2482×1326) — no resizing, no WebP conversion. `headshot.webp` via `?key=thumb-240` returned the original WebP (9344 bytes, 600×400) unchanged. `content-disposition` header shows original filename in all cases (not a transformed variant name). Railway env has `STORAGE_ASSET_TRANSFORM=presets`; Directus settings DB shows `"all"` (env var takes precedence at container startup). Despite preset keys being valid (9-curl matrix: all HTTP 200), Sharp is not executing transforms on any file type.

Root cause hypothesis: Sharp native bindings not functional in Railway container (libvips not installed or wrong architecture). Directus silently falls back to raw passthrough when Sharp is unavailable rather than returning an error.

**Decision:** Sharp encoder broken on Railway Directus 11.17.3 deployment. For slice-18d purposes the raw files upload cleanly to R2 and are accessible — the id-map is valid and `assetIdFor()` helper is unaffected. Image optimization (resize + WebP conversion) is not available until Sharp is fixed. Track as post-slice-18 infrastructure task: investigate libvips/Sharp availability in Railway Directus container; consider `sharp` npm install or custom Dockerfile. WebP passthrough is usable for 18d-18i since source files are already WebP where needed.

---

## Open follow-ups (post-18d)

- **Sharp/Railway image transforms** — silent passthrough confirmed; presets configured but not actually executing. File GitHub issue; tackle in 18j polish or as standalone infrastructure ticket. Acceptance gate "preset returns 1200-wide WebP" not met for sources >1200; works for ≤1200 sources by passthrough.
- **R2 bucket versioning** — not enabled. Cloudflare console toggle (~2 min). Defer to 18j.
- **`apps/cms/directus/snapshot/` legacy directory** — pre-directus-sync layout retained for now; cleanup at 18k close.
- **assets-id-map sync between apps/cms and packages/shared** — manual today (cp on 18d). Consider script-emit on `migrate-assets` exit, or CI drift check.
- **Orphan `legacy_path.json` at `apps/cms/directus/fields/directus_files/`** — duplicates the canonical at `apps/cms/directus/snapshot/fields/directus_files/`. Cleaned up in Task 46 (this close).

---

## R2 bucket layout (key naming)

**Status:** Resolved — Task 20 (2026-04-24).

**Question:** Does Directus s3 driver write to flat UUID keys, or folder-prefixed keys?

**Result:** Presumed flat UUID keys based on standard Directus s3 driver behavior. Cannot directly inspect bucket without Cloudflare R2 console access. Bootstrap upload (`headshot.webp` → `66f6ddc8-c3f2-4bd7-97a5-978940757b77`) succeeded cleanly via the Directus SDK `uploadFiles()` call; all four preset transforms (`/assets/<uuid>?key=<preset>`) returned valid WebP images (HTTP 200). The s3 driver default behavior stores files at flat UUID keys (no folder prefix, no `legacy_path` subdirectory). The `folder` field in Directus metadata (about folder: `e4764c31-b8b4-4045-b066-76653bc3c884`) is a logical grouping only — it does not affect the R2 storage key.

**Decision:** Rollback runbooks should assume flat UUID keys. migrate-out scripts must rely on the Directus `/files` API to enumerate UUIDs → `legacy_path` mappings, not on inspecting R2 key structure directly.
