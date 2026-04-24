# 18c — Decisions

> Populated during execution. Each D-entry amendment + probe-driven decision lands here with date + rationale.

## D-entry amendments locked at 18c start (from design spec)

| ID | Amendment | Source |
|---|---|---|
| D3 | Snapshot.yaml → directus-sync per-resource JSON files | Q6 + Agent A audit |
| D4 | + sessionStorage gate pattern (Agent D-#10) | Agent D |
| D5 | + Global Draft (v11.16) enabled; `REVISIONS_RETENTION=90d` | Q2 + Agent A |
| D6 | → `/shares` endpoint (not EDITOR_PREVIEW_TOKEN); `PreviewContext = { shareToken, version? }` | Q3 + Agent C |
| D7 | Unchanged (per-page block copies reaffirmed) | — |
| D8 | → Full-site revalidation (not per-URL) | Q5 |
| D9 | + `STORAGE_ASSET_TRANSFORM=presets` locked; + `legacy_path` custom field | Q10 + Agent A |
| D10 | + 2FA enforced admin + human-editor; SSO/OIDC NICE → SHOULD; instance-wide `RATE_LIMITER_*` | Q4 + Q12 + Agent C |
| D11 | → Zero custom extensions EXCEPT directus-sync | Q6 |
| D12 | → Turborepo monorepo two-app boundary (replaces strict two-repo) | Major pivot (owner approved) |
| **D13** (new) | Turborepo + pnpm workspaces monorepo | Monorepo pivot |
| **D14** (new) | `packages/shared` types + Zod only; runtime helpers stay app-local | Monorepo pivot + Q9 |
| **D15** (new) | Block Editor for all rich content (no Markdown interface anywhere) | Q1 + ripple |

## Probe-driven decisions (populated as probes land)

### P1 — Global Draft × Group interfaces (bug #26890)

**Decision:** TBD after probe. If bug confirmed → document collections where Global Draft must be per-item custom versions; if not → Global Draft everywhere.

### P2 — /shares endpoint behavior

**Decision:** TBD. Adapter boundary `PreviewContext = { shareToken, version? }` shape finalized per findings.

### P3 — Block Editor JSON shape

**Decision:** TBD. `BlockRenderer.svelte` block-type catalog in 18f based on findings.

### P4 — directus-sync on Railway

**Decision:** TBD. If probe fails → revert D11 amendment; fallback to snapshot.yaml.

### P5 — MCP system-prompt scope

**Decision:** TBD. F14 prompt written as single instance-global or per-role based on findings.

### P6 — Turborepo + Vercel deploy

**Decision:** TBD. If fails → blocker; revert D13.

### P7 — Railway monorepo + directus-sync Dockerfile

**Decision:** TBD. Combines D13 + D11.

### P8 — AVIF support

**Decision:** TBD. Add AVIF preset variant to D9 if green; otherwise stick with WebP.

### P9 — pnpm workspace + @yesido/shared in SvelteKit + Bun

**Decision:** TBD. If fails → fallback to per-app codegen; revert D14.

## Amendments during 18c execution

| Date | Amendment | Rationale |
|---|---|---|
| (populated as execution proceeds) | | |
