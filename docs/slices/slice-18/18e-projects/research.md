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
