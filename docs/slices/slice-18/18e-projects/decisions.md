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

## Amendments (2026-04-24)

| ID | Amendment | Source |
|---|---|---|
| AM1 | Public policy `_syncId` is `_sync_default_public_policy` (not `_sync_public_policy` as the spec/plan placeholder suggested). | Phase 3 finding |
| AM2 | New policy `_sync_human_editor_policy` was created during Phase 3 — referenced in CONVENTIONS but not previously instantiated. Roles still empty (`roles: []`); future task to assign a role. | Phase 3 finding |
| AM3 | Cosmetic FK constraint name mismatch on `projects_impact_metrics_translations.projects_impact_metrics_id` (Postgres truncates >63-char identifiers with hash suffix; directus-sync snapshot has different truncation). Persists as no-op noise on `sync:diff`. Filed as follow-up issue at close (Phase 10). | Phase 6 finding |
| AM4 | The plan's "thumb-240" preset reference was incorrect — actual preset name is `thumb-300`. ProjectCard uses `card-600`; no `thumb-300` consumers identified in current codebase. | Phase 8 finding |
| AM5 | ProjectSchema (`apps/web/src/lib/schemas/project.ts`) already existed from earlier slices; Task 26 was a content-equivalence verification, no new commit. | Phase 7a finding |
| AM6 | Only ProjectCard.svelte uses `project.image` in current consumer code; the plan's enumeration of multiple components (ProjectMiniCard, ProjectDetailHeader, etc.) overstated the surface area. | Phase 8 finding |

## Open follow-ups (filed as GitHub issues at close)

- #41 — Block Editor migration for projects description + sections.content (post-18f)
- #42 — scaffold-port.ts extension for M2M-heavy schemas (slice-18k)
- #43 — projects integration tests (slice-18j)
- #44 — N+1 batch optimization for services M2M (follow-on)
- #45 — Cosmetic FK constraint name diff noise (follow-on)
