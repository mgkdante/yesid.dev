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
| 0 | Scaffold slice-18 bundle | 🟢 active | This session. 4-file flat bundle. |
| 1 | Remove Payload from yesid-dev-cms | 🟢 active | This session. Branch `chore/remove-payload` on the cms repo. Hard scorch + PR. |
| 2 | Directus research (adapter-contract mapping, hosting, storage, schema, FORMULA) | planned | Builds on slice-headless-cms-best-practices. **Zero site code changes.** |
| 3 | Directus install + schema provisioning (yesid-dev-cms rebuild) | planned | Hosting decision from Task 2 drives this. |
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

- **R1.** Directus hosting decision is open. Impact: blocks Task 3+. Mitigation: Task 2 closes it. Revisit: end of Task 2.
- **R2.** 73-row seed migration Payload-Postgres → Directus. Impact: content loss / locale drift. Mitigation: export + diff before scorching old data; cutover only after parity check. Revisit: Task 6.
- **R3.** Domain + DKIM handoff during Directus install. Impact: email sending breaks. Mitigation: no DNS changes until Directus serves HTTPS on `cms.yesid.dev`. Revisit: Task 3.
- **R4.** Custom-extension temptation. Impact: Directus maintenance burden + platform-builtins violation. Mitigation: enforce `feedback_prefer_platform_builtins.md` at every D-entry. Revisit: every design decision.

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

## Notes

- Research slice reference: `docs/slices/slice-headless-cms-best-practices/` (12-heuristic + 22-item FORMULA; PR #31 merged 2026-04-22).
- Adapter seam: `src/lib/adapters/index.ts:6` — the single line that flips per-adapter.
- yesid-dev-cms location: `C:/Users/otalo/Yesito/Projects/yesid-dev-cms` (sibling repo; hyphen, not dot).
