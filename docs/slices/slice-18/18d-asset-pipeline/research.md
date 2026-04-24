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
