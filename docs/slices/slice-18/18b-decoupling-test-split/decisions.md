# 18b — Decisions (retrospective)

> Decisions landed during Task 8 + Task 2b research (2026-04-23 → 2026-04-24).

## Decisions

| ID | Decision | Status |
|---|---|---|
| D4 | `@directus/visual-editing` v2 SDK + conditional `data-directus` rendering | shape locked |
| D5 | Content Versioning on all user collections; no separate `status` field | shape locked; amended 18c (+Global Draft) |
| D6 | Preview routes: dedicated `/preview/*` tree + `EDITOR_PREVIEW_TOKEN` + per-call `PreviewContext` | shape locked; amended 18c (→ /shares endpoint per Q3) |
| D7 | M2A pages + block collections; per-page block copies | shape locked |
| D8 | Flows Event Hook → Webhook op → SvelteKit ISR bypass | shape locked; amended 18c (→ full-site per Q5) |
| D9 | `/assets/:id?key=<preset>` + folder-per-content-type + WebP default + bulk SDK upload | shape locked; amended 18c (+`STORAGE_ASSET_TRANSFORM=presets` + `legacy_path`) |
| D10 | Role/policy matrix — 9 capability policies on 4 roles | shape locked; amended 18c (+2FA + SSO SHOULD + rate limits) |
| D11 | Zero custom Directus extensions in Slice 18 | shape locked; amended 18c (allow directus-sync only) |
| D12 | Two-repo strict separation via adapter-seam contract | shape locked; amended 18c (→ Turborepo monorepo two-app boundary) |

## Open questions resolved during 18b

| Q | Resolution | Status |
|---|---|---|
| Q5 | Preview/draft implementation deferred to post-Slice-18 | deferred |
| Q8 | Content Versioning on block collections | confirmed |
| Q9 | Flow revalidation optional in Slice 18 (now J7 in 18j) | scheduled |
| Q10 | AVIF support — probe in 18d (Slice 18) | scheduled |
| Q11 | Versions policy — editors CRUD own; admin-only delete | shape locked |
| Q12 | Block reuse strategy — per-page copies for MVP | confirmed |

## Amendments during 18b execution

| Date | Change | Rationale |
|---|---|---|
| 2026-04-23 | Task 8 added cross-repo test-suite split at owner approval | Owner emphasized test boundary as first-class part of decoupling |
| 2026-04-24 | PR #7 merged as `8293eec` | Paired PR flow validated; moved to Task 9 (later re-planned to 18d) |
| 2026-04-24 | Mid-slice scope correction + Task 2b research pass inserted | Tasks 5–7 shipped services as TS-mirror, not proper CMS deployment |
