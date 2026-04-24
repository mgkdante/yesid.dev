# 18a — Research (retrospective)

> Historical record. Tasks 0–7 shipped 2026-04-22 → 2026-04-23 across 4 sessions.

## Research landed during 18a

- **Directus infra research** (Task 2, 2026-04-22) — 4 parallel agents covered adapter-contract mapping, Directus docs, hosting options, storage options, schema provisioning, locale strategy, seed migration path, built-in vs custom extensions, MCP server, recent releases. Full write-up previously at `docs/slices/slice-18/research.md` § Task 2 findings (migrated here for durability; preserved in git commit `eff42cd` et al. on `feature/slice-18`).

## Key findings that shaped D-entries

- Railway Hobby ($5/mo) over Directus Cloud ($15/mo with shared DB) → D1.
- Cloudflare R2 via built-in `s3` driver (no Vercel Blob driver exists) → D2.
- `directus schema snapshot + apply` with YAML in Git → D3 (later amended in 18c to directus-sync per-resource files).
- Native Translations field + adapter-boundary `toLocalizedString` transform → Q6.
- Markdown for blog body (later superseded by D15/Q1 Block Editor in 18c re-plan).
- Native MCP GA since v11.13 — enabled in 18a.
- Zero custom Directus extensions required → D11 (later amended to allow directus-sync).

## References

- Design spec (re-plan): [`../../../superpowers/specs/2026-04-24-slice-18-replan.md`](../../../superpowers/specs/2026-04-24-slice-18-replan.md)
- Audit (re-plan): [`../../../superpowers/research/2026-04-24-slice-18-replan-audit.md`](../../../superpowers/research/2026-04-24-slice-18-replan-audit.md)
- Git history: `git log --oneline -- apps/web/src/lib/adapters/` (or `src/lib/adapters/` pre-monorepo) shows Tasks 0–7 commits.
