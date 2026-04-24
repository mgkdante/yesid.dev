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

**Interim decision (2026-04-24 — local research complete, Railway verify owner-gated):** **Proceed with D3 + D11 amendments.** Extension `directus-extension-sync@3.0.6` verified on npm with Directus 11 host compat (`^11.0.0`). Dual-component architecture confirmed: CLI runs from CI; extension installed into Railway Directus image via minimal `pnpm add --prod --no-save` Dockerfile step (no custom EXTENSIONS_PATH needed — auto-discovered from `node_modules` via `directus:extension` manifest). Railway "image pull → Dockerfile build" flip is a documented dashboard switch.

**Owner verification gate (Task 17, not probe-blocking for phase entry):** `docker build` + `docker run` locally → confirm extension auto-loads; push Dockerfile to Railway staging service → confirm deploy green; run `npx directus-sync@3 diff` against staging → confirm CLI/extension handshake. If any step fails → revert D3 + D11 amendments; restore snapshot.yaml workflow.

**License note:** GPL-3.0 on the extension. We run as authoring tool only; don't modify/redistribute source. Template-extraction post-Slice-18 references `pnpm add` step, not source copy. No copyleft viral obligation.

**Full research notes:** [`research.md § P4`](research.md#p4--directus-sync-on-railway-via-custom-dockerfile).

### P5 — MCP system-prompt scope

**Decision:** TBD. F14 prompt written as single instance-global or per-role based on findings.

### P6 — Turborepo + Vercel deploy

**Interim decision (2026-04-24 — local research complete, Vercel preview verify owner-gated):** **Proceed with D13 (Turborepo + pnpm workspaces monorepo).** Vercel documents exact auto-config for our shape (SvelteKit preset + Root Directory=`apps/web` + global `turbo run build` with auto-inferred filter + Output=`.svelte-kit/**` + `.vercel/**`). Env vars are project-scoped and split hosting (Vercel web / Railway cms) eliminates `apps/cms/.env` leak vector. pnpm workspaces + `workspace:*` protocol natively supported. SvelteKit adapter-vercel@6.3.1 + `nodejs22.x` runtime unchanged from current setup.

`packages/shared` ships TS source directly (no build step); SvelteKit's Vite 7 + Bun both handle workspace TS. Fallback if Vite refuses: add `tsc --build` emit (additive — no D13/D14 revert).

**Owner verification gate (Task 16 — not blocking phase entry):** Create `yesido-platform-web` Vercel project post Task 10 umbrella creation → set Root Directory=`apps/web` → port env vars from existing yesid.dev project → preview deploy on consolidation branch → confirm SSR green + no env leak. Keep old project alive until Task 19 cutover for zero-downtime DNS switch.

**Full research notes:** [`research.md § P6`](research.md#p6--turborepo--vercel-monorepo-deploy).

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
