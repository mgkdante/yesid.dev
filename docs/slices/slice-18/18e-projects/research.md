# 18e — Research

> Probe findings + live-state observations during execution. Populated as work progresses; finalized at close.

## P-cascade — Directus 11 cascade FK filter syntax

**Status:** Resolved — Phase 1 Task 3 (2026-04-24).

**Question:** Does Directus 11 permission filter syntax support FK traversal in `read` filters (e.g., `projects_id.status _eq "published"` on a junction collection)?

**Method:** Probe `/items/services_translations` with `filter[services_id][visible][_eq]=true` against live cms.yesid.dev. Auth via email+password login to `/auth/login` (stored 1Password credential is a password, not a static token); JWT Bearer used for the probe request.

**Result:** HTTP 200 with 3-row array of `services_translations` rows (`id` + `services_id`), filtered to only those whose parent `services` record has `visible=true`. Response: `{"data":[{"id":13,"services_id":"sql-development"},{"id":14,"services_id":"data-pipeline"},{"id":15,"services_id":"analytics-reporting"}]}`. FK traversal applied successfully — Directus 11 resolved `filter[services_id][visible]` across the M2O relationship without errors.

**Decision:** PASS — Public policy will use cascade filters in Phase 3 Task 11. Syntax `filter[<fk_field>][<remote_field>][_eq]=<value>` is confirmed working on junction/translation collections in Directus 11.

---

## Open follow-ups

(Empty — populate as work progresses.)

## Live state after Phase 6 push + seed

**Status:** Resolved — Phase 6 (2026-04-24).

- 7 collections live: projects + projects_translations + projects_sections + projects_sections_translations + projects_impact_metrics + projects_impact_metrics_translations + projects_services M2M junction.
- 6 projects seeded via `bun run seed:projects --reset`. Counts: yesid-dev (1 section, 0 metrics), transit-data-pipeline (0 sections, 2 metrics), lorem-analytics-dashboard (2 sections, 2 metrics), lorem-database-migration (2 sections, 1 metric), lorem-query-optimizer (1 section, 0 metrics), lorem-retool-admin (1 section, 0 metrics).
- 10 projects_services junction rows.
- Public anon read of `/items/projects` returns 6 rows; cascade FK filter on translations + sub-collections + junction working as designed.
- hero_image M2O resolved for `yesid-dev` only (legacy path `images/work/yesid-dev.png` → UUID via `assetIdForOrUndefined`); other 5 are NULL.
- 58 permission rows + 1 new policy (`_sync_human_editor_policy`) applied via single sync:push.
- directus-sync diff post-push: 0 collection / 0 field changes; 1 cosmetic relation diff on `projects_impact_metrics_translations.projects_impact_metrics_id` — Postgres auto-generated FK constraint name (`projects_impact_metrics_translations_proje__299c02d3_foreign`) vs the file's truncated name (`projects_impact_metrics_translations_project__id_foreign`). Pure naming, FK semantics identical; no runtime impact and won't reapply on subsequent push (lhs is DB-driven). Permissions diff fully empty (85 unchanged, 0 to create/update/delete).

## Live state after Phase 9 (final)

**Status:** Resolved — Phase 9 (2026-04-24).

- /projects renders 6 projects from Directus (no static fallback).
- /projects/yesid-dev: hero_image from R2 served via /assets/<uuid>?key=hero-1200.
  Sharp transform issue (#37) means served bytes are original PNG (not 1200-wide WebP);
  acceptable for current image dimensions.
- /services/sql-development "Related projects" strip resolves via M2M junction;
  junction reads per-ctx memoized.
- services.related_projects field DROPPED; DirectusService row interface cleaned up.
- All 4 test boundaries green; bun run check 0 errors apps/web; bun run test full suite green
  both apps.
