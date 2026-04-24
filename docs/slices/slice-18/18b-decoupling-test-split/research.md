# 18b — Research (retrospective)

> Historical record. Task 2b research + Task 8 execution shipped 2026-04-23 → 2026-04-24.

## Research landed during 18b

**Task 2b — CMS-native + two-repo decoupling research** (2026-04-23, 3 parallel agents):

- **Cluster A** — @directus/visual-editing SDK, Content Versioning, Preview routes (SvelteKit), M2A (Many-to-Any) blocks
- **Cluster B** — Flows for publish → Vercel revalidation, Asset pipeline, Role/policy matrix
- **Cluster C** — Extensions vs built-ins, Repo-separation boundary, Revised task list for remaining content types

Full 10-topic audit lives in git commit `57264f3` (formerly at slice-level `research.md § Task 2b findings`). Re-plan audit expanded on these findings → [`../../../superpowers/research/2026-04-24-slice-18-replan-audit.md`](../../../superpowers/research/2026-04-24-slice-18-replan-audit.md).

## Key findings that shaped D-entries

- **D12 (repo-separation boundary)** — yesid.dev owns consumer; yesid.dev-cms owns CMS; contract via `ContentAdapter` interface × snapshot × SDK response shape. Later amended in 18c re-plan to Turborepo monorepo with two-app boundary.
- **D4 (Visual Editor shape)** — `@directus/visual-editing` v2 SDK, conditional `data-directus` attributes.
- **D5 (Content Versioning)** — enable on all user collections; no separate `status` field; later amended in 18c to add Global Draft.
- **D7 (M2A pages)** — per-page block copies for MVP; adapter flattens to preserve `ContentPort`.
- **D8 (Flows revalidation)** — Flow Event Hook → Webhook op → SvelteKit ISR bypass. Later amended in 18c re-plan to full-site revalidation (Q5).
- **D9 (Asset pipeline)** — presets + folder-per-content-type + WebP default. Later amended in 18c to lock `STORAGE_ASSET_TRANSFORM=presets` + `legacy_path` field.
- **D10 (Role/policy matrix)** — 9 capability policies on admin/human-editor/ai-editor/Public. Amended 18c to enforce 2FA + conservative rate limits.
- **D11 (extensions posture)** — zero custom extensions. Amended 18c to allow directus-sync (only).

## Additional research in the 18c re-plan audit

The 18c re-plan (2026-04-24) added deeper research via 4 parallel agents that superseded many of the 2b findings:

- **Agent A** — Exhaustive Directus 11.17.3 feature catalog × yesid.dev use-case MUST/SHOULD/NICE/DEFER matrix.
- **Agent B** — Adversarial code review of 18a/18b (found C1 adjacency double-fetch, C2 snapshot Unicode corruption, C3 vi.importActual coupling, P1-P9 pattern-affecting issues).
- **Agent C** — Editor UX + Data Studio + MCP workflow deep-dive.
- **Agent D** — Mature Directus + SvelteKit patterns from 10+ GitHub repos.

That audit lives at [`../../../superpowers/research/2026-04-24-slice-18-replan-audit.md`](../../../superpowers/research/2026-04-24-slice-18-replan-audit.md).

## References

- Design spec: [`../../../superpowers/specs/2026-04-24-slice-18-replan.md`](../../../superpowers/specs/2026-04-24-slice-18-replan.md)
- Git history: commits `57264f3` (Task 2b docs) + `3eb9358` (Task 8 consumer-side) + `540de0e` + `9f43891` on `feature/slice-18`.
- yesid.dev-cms PR [#7](https://github.com/mgkdante/yesid.dev-cms/pull/7) (task-8-decoupling, merged `8293eec`).
