# slice-18 — Plan (Cloud content layer: Directus)

> Single-level slice. Four flat files in this bundle: [plan.md](plan.md) (this file) · [spec.md](spec.md) · [research.md](research.md) · [handoff.md](handoff.md). Tasks tracked via TodoWrite (no task files).

> **Restart context:** prior slice-18 attempt (PRs #33, #34) was scorched in #35. Going back to the classic flow: **research → brainstorm → spec → plan → implement → iterate → close**. Start lean; front-run nothing.

## Scope

Migrate the site's content source from `staticAdapter` (typed TS content modules under `src/lib/content/*.ts`) to a Directus CMS served from `cms.yesid.dev`. Swap happens at the one-file adapter seam (`src/lib/adapters/index.ts`) — repositories (`src/lib/repositories/*`) and components stay untouched. The `yesid-dev-cms` repo transitions from Payload 3.x to Directus 11+.

## Hard constraints

- **No nested sub-slice folders.** Flat `docs/slices/slice-18/` only.
- **No `@payloadcms/*` packages in yesid.dev.** Ever.
- **Prefer Directus built-ins over custom extensions.** Every custom extension needs written justification in a spec D-entry (`feedback_prefer_platform_builtins.md`).
- **Never hardcode content.** All content flows through the adapter seam as `LocalizedString` + typed interfaces (`feedback_data_driven.md`).
- **Infrastructure constant across the migration:** Neon Postgres, Resend (DKIM + SPF), `cms.yesid.dev` domain.
- **No direct commits to `main`.** Branch + PR for every change.
- **No archive branches in yesid-dev-cms.** Scorch IS the audit trail; research slice is the historical record.
- **Hard cutover.** No `cms-legacy.yesid.dev`. When Directus lands, Payload is gone.
- **Research slice is append-only reference.** Don't modify `docs/slices/slice-headless-cms-best-practices/`.

## Canonical commands

| Purpose     | Command               |
| ----------- | --------------------- |
| Install     | `bun install`         |
| Build       | `bun run build`       |
| Test (unit) | `bun run test`        |
| Lint        | `bun run lint`        |
| Typecheck   | `bun run check`       |
| Run locally | `bun run dev`         |

## Tasks

Full task state lives in TodoWrite. This table is orientational — Tasks 2+ are one-line placeholders and expand into full spec/plan blocks before execution.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0 | Scaffold slice-18 bundle | ✅ shipped | yesid.dev `e918736`; 4-file flat bundle. |
| 1 | Remove Payload from yesid.dev-cms + clean slate | ✅ shipped | yesid.dev-cms PRs #1 (`a7a1db6`) + #2 (`0295dd6`). Final state: 4 tracked files. |
| 2 | Directus research (adapter-contract mapping, hosting, storage, schema, locales) | ✅ shipped | This session. Resolved spec D1/D2/D3 + Q4–Q7. **Zero site code changes.** |
| 3 | Directus install on Railway + Neon + R2 + native MCP | ✅ shipped | This session. Live at directus-cms-production-df43.up.railway.app. yesid.dev-cms PR #3 (`5945f56` + `d22669c`). Manual ops remain (PostGIS drop, custom domain, Vercel retire) — see handoff § 5. |
| 4 | DirectusAdapter + first-service swap | planned | One-line flip at `src/lib/adapters/index.ts`. |
| 5 | Remaining collection swaps (services, projects, blog, meta) | planned | Each swap = verification boundary. |
| 6 | Seed data + locale parity | planned | 73-row baseline from Payload era. |
| 7 | Integration + full-site E2E on Directus | planned | |
| 8 | Slice close + cutover finalization | planned | Payload endpoints die; DNS stays. |

## Session layout

- **Session 1 (this) — Planning + scorch.** Task 0 + Task 1.
- **Session 2 — Task 2 (research).** Zero site code changes.
- **Session 3+ — Implementation sessions.** Each task = one owner-approved STOP point.

Divergence from this shape gets logged in § Amendments.

## Success criteria (slice-level)

- [ ] yesid.dev reads every content type via `DirectusAdapter` on `main` (no `staticAdapter` in production).
- [ ] yesid-dev-cms runs Directus 11+, zero Payload code / deps remaining.
- [ ] `cms.yesid.dev` serves Directus admin + content API with TLS + DKIM/SPF preserved.
- [ ] Full test / lint / typecheck green on yesid.dev `main` after every task merge.
- [ ] All 73 Payload-era rows (or equivalent) present in Directus; locales intact.
- [ ] `project_cms_directus.md` + `project_slice_18_status.md` memories reflect shipped state.

## Risks (cross-cutting)

- **R1.** ~~Directus hosting decision is open.~~ **Resolved 2026-04-22 (Task 2):** Railway Hobby + BYO Neon (spec D1).
- **R2.** ~~73-row seed migration Payload-Postgres → Directus.~~ **Reframed 2026-04-22:** the prior slice-18 work scorched Payload data before it ever fed the site; the 73 rows are gone and recreating them from yesid.dev's TS/MD source is the plan (research.md § Seed migration path). No production data loss possible. Revisit: Task 6 (seed script from source modules).
- **R3.** Domain + DKIM handoff during Directus install. Impact: email sending breaks. Mitigation: no DNS changes until Directus serves HTTPS on `cms.yesid.dev`. Revisit: Task 3.
- **R4.** Custom-extension temptation. Impact: Directus maintenance burden + platform-builtins violation. Mitigation: enforce `feedback_prefer_platform_builtins.md` at every D-entry. Task 2 audit (research.md § Built-in features vs custom extensions) confirms zero custom extensions required for Slice 18. Revisit: every design decision.
- **R5.** Directus 12 license revision. Impact: BSL 1.1 terms may change in Directus 12 (announced today 2026-04-22 on directus.io/blog). Mitigation: pin to `directus/directus:11.17.3` at Task 3 — buys a known BSL 3-year window. Revisit: before any upgrade to v12.
- **R6.** Vercel Blob storage had no Directus driver despite earlier assumption. Impact: avoided — decision flipped to R2 at Task 2. Closed.

## Decisions log (slice-level)

### D1 — Directus over Payload

- **Chosen:** Directus 11+ as the CMS for yesid.dev's cloud content.
- **Alternatives considered:** Payload 3.x (prior direction), Sanity, Strapi, Ghost, keeping `staticAdapter`.
- **Why this won:** `docs/slices/slice-headless-cms-best-practices/decision-brief.md` (PR #31). Summary: built-in localization + Postgres + admin UX vs Payload's Node-first coupling for a SvelteKit consumer.
- **Tradeoff:** Give up Payload's TypeScript-native config; Directus config is Data Studio + Flows (more GUI-driven).
- **Affects:** all tasks.

### D2 — Scorch-not-archive for Payload removal

- **Chosen:** Delete all Payload code from yesid-dev-cms in one PR. No `payload-archive` branch. No `cms-legacy.yesid.dev`.
- **Alternatives considered:** Archive branch with graceful deprecation · side-by-side Payload + Directus · dual-adapter fallback.
- **Why this won:** Audit trail = research-slice bundle + Git history. Side-by-side doubles infra cost. yesid.dev runs on `staticAdapter` throughout the migration — no public-site risk during the gap. Hard cutover is simpler.
- **Tradeoff:** `cms.yesid.dev` 404s between scorch and Directus install. Accepted — admin downtime only.
- **Affects:** Task 1, Task 3.

### D3 — Single-level flat bundle

- **Chosen:** One `docs/slices/slice-18/` directory with 4 files (plan, spec, research, handoff). No nested sub-slice folders.
- **Alternatives considered:** Multi-sub-slice (a/, b/, c/) · Level-1 bundle with sub-slice overlays (prior attempt — scorched).
- **Why this won:** Prior attempt over-engineered this. Classic single-level flow = one PR boundary per task; handoff accumulates sections.
- **Tradeoff:** If scope genuinely grows, may need to re-carve mid-flight. Accepted; amendments log captures divergence.
- **Affects:** all tasks — structural.

## Amendments log

| # | Date | Change | Rationale |
|---|------|--------|-----------|
| 1 | 2026-04-22 | Tasks 0–2 shipped; R1 resolved; R2 reframed (no Payload data to migrate); R5 + R6 added. | Task 2 research landed; spec D1/D2/D3 + Q4–Q7 resolved via four parallel agents (adapter mapping + Directus docs + hosting/storage + research-slice re-read). Full findings in research.md. |
| 2 | 2026-04-23 | Task 3 shipped via MCPs (Cloudflare/Railway/Neon/Vercel/1P CLI); Resend SMTP deferred → HTTP API; Neon clean-slated mid-task. | Owner used MCPs to drive provisioning end-to-end. Railway egress blocks SMTP port 587 → Resend SMTP path is dead, switching to HTTPS API via Directus Flow as a follow-up. Neon DROP SCHEMA + CREATE SCHEMA in response to owner's "clean up neon db and rebuild" steering after the Railway template seeded its CMS demo content on the freshly-pointed Neon DB. |

## Notes

- Research slice reference: `docs/slices/slice-headless-cms-best-practices/` (12-heuristic + 22-item FORMULA; PR #31 merged 2026-04-22).
- Adapter seam: `src/lib/adapters/index.ts:6` — the single line that flips per-adapter.
- yesid-dev-cms location: `C:/Users/otalo/Yesito/Projects/yesid-dev-cms` (sibling repo; hyphen, not dot).
