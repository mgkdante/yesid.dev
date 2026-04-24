# 18d — Research

> Probe findings + live-state observations. Populated as work progresses; finalized at close.

## P8 — AVIF support

**Status:** Pending — runs in Task 21 (post first upload).

**Method:** `curl -I https://cms.yesid.dev/assets/<headshot-uuid>?format=avif`

**Result:** _TBD (Task 21)_

**Decision:** _TBD — green → add 3 AVIF variants in Task 22; red → defer to post-Directus-12._

---

## directus-sync `storage_asset_presets` diff behavior

**Status:** Resolved — Task 7 (2026-04-24).

**Question:** Is the `storage_asset_presets` JSON in `directus/collections/settings.json` array-replace, array-merge, or per-entry diffable?

**Result:** Settings is one blob; `storage_asset_presets` array replaced wholesale via a single UPDATE entry in the diff. directus-sync push handled the change cleanly — the entire 4-preset array was written in one settings UPDATE, and diff went empty post-push. No partial-merge behavior observed.

**Additional finding (Task 7):** `directus-sync` uses `preserveIds = true` for the folders collection. This means `_syncId` values in `directus/collections/folders.json` must be valid UUIDs — directus-sync sends the `_syncId` as the folder's `id` field in the POST body. Non-UUID `_syncId` strings (e.g., `_sync_folder_services`) cause Directus to return HTTP 403 FORBIDDEN. Folders JSON was corrected to use proper UUIDs as `_syncId` values before the push succeeded.

**Decision:** Use directus-sync as primary authoring path. `seed-presets.ts` (Task 18) provides a parallel SDK-based path for manual presets pushes when directus-sync is not desired (e.g., AVIF variant addition mid-flight in Task 22). The two paths are safe to coexist — directus-sync does a full array replace, so whichever runs last wins; coordinate order explicitly.

---

## R2 bucket layout (key naming)

**Status:** Pending — observed in Task 20 (first upload).

**Question:** Does Directus s3 driver write to flat UUID keys, or folder-prefixed keys?

**Result:** _TBD_

**Decision:** _Documentation-only — affects rollback runbook and future migrate-out scripts; no design change either way._
