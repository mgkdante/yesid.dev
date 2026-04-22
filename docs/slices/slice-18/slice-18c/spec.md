# slice-18/slice-18c — Spec

> Sub-slice-level specification. Sub-slices are the **PR boundary** — each becomes its own pull request. Parent slice spec lives in the parent README + plan (slice-18 uses its README.md as the canonical direction doc; plan.md carries parent-level decisions).

> **Spec is mostly immutable after approval.** Post-approval changes get logged in § Amendments at the bottom — never rewrite history. D1–D3 below are deliberately scaffolded as "pending — resolved in Task 18c-2" because their rationale depends on the research authored in Task 18c-1; their final values land as an Amendments-log entry when Task 18c-2 closes.

## Metadata

| Field             | Value                                                                |
|-------------------|----------------------------------------------------------------------|
| Status            | draft                                                                |
| Priority          | 1 (blocks 18d, 18e, 18f, 18g)                                        |
| Estimated effort  | 2–3 sessions                                                         |
| Parent slice      | [../README.md](../README.md) + [../plan.md](../plan.md)              |
| Depends on        | PR #31 (research slice merged), PR #33 (slice-18 Level-1 bundle merged) |
| Unblocks          | 18d (scorched-earth rebuild), 18e (content migration), 18f (frontend rewire) |
| Size              | M (3–4 tasks, docs-only)                                             |
| Sessions          | 2–3                                                                  |
| Branch            | `feature/slice-18c-directus-research`                                |
| Worktree          | none (docs-only; single working copy is fine)                        |

## Goal

Produce the research + decisions + rebuild spec that 18d (and 18e, 18f) execute: a Directus-architecture deep-dive, a `yesid.dev-cms` repo audit, three locked-in decisions (hosting, storage, schema approach), a Directus-specific editor-ergonomics FORMULA, and a concrete step-by-step rebuild spec. Every downstream sub-slice gets what it needs to start without re-opening settled questions.

## Why this sub-slice

Parent D6 explicitly defers hosting + storage decisions to research. 18d rebuild work cannot begin until those close + a schema approach + a rebuild spec are authored. Carving this out as its own sub-slice (separate PR boundary) gives reviewers a clean contract: the research + decisions merge as a reviewable deliverable, then 18d executes against it without in-flight ambiguity. It also keeps the scorched-earth rebuild PR (18d) focused on code change, not strategy.

## Core principle

**Decide once; execute without ambiguity.** Every artifact this sub-slice ships is aimed at making downstream sub-slices executable by a fresh session with no external context. Research informs decisions; decisions inform the rebuild spec; the rebuild spec drives 18d. No "we'll figure it out in implementation" allowed to cross the 18c → 18d boundary.

## Durable outputs

1. **Directus-architecture + repo-audit deep-dive** — `docs/slices/slice-18/slice-18c/research.md`. Ground truth for Directus primitive vocabulary + scorch/keep inventory. Informs every later sub-slice.
2. **Three locked decisions** — `docs/slices/slice-18/slice-18c/decisions.md` + promoted to this spec's § Design decisions (D1 Hosting, D2 Storage, D3 Schema approach). Unblocks 18d + 18e + 18f.
3. **Directus FORMULA** — `docs/slices/slice-18/slice-18c/formula.md`. Editor-ergonomics checklist parallel to Payload's 22-item FORMULA. Becomes the defensive-customization contract for every future Directus project, not just 18d.
4. **Rebuild spec for 18d** — `docs/slices/slice-18/slice-18c/rebuild-spec.md`. Step-by-step commands + schema definition. 18d executes without re-reading source research.

## Reference sites / prior art

- **Research slice** [`docs/slices/slice-headless-cms-best-practices/`](../../slice-headless-cms-best-practices/) — 6-agent analysis, decision-brief, 22-item Payload FORMULA. Source of truth for pivot rationale (parent D1).
- **Parent slice direction** [`../README.md`](../README.md) — post-pivot architecture diagram, content-model crosswalk, cost model, acceptance criteria.
- **Directus docs** — [`directus.io/docs`](https://directus.io/docs), [`directus.io/mcp`](https://directus.io/mcp), 7 official SvelteKit tutorials at [`directus.io/docs/tutorials`](https://directus.io/docs/tutorials).
- **Slice 17c Zod-at-the-boundary invariant** — [`docs/project/ARCHITECTURE.md § Schema validation at the adapter boundary`](../../../project/ARCHITECTURE.md) — must survive the CMS swap intact.

## Context

### Problem

Parent slice 18 pivoted mid-flight from Payload to Directus (parent D1). 18a + 18b shipped on Payload and hold production state (73 rows at `cms.yesid.dev`). Parent D6 deferred three decisions (hosting, storage, schema approach) to this sub-slice because their answers depend on research that wasn't budgeted into the decision-brief authoring. 18d (scorched-earth rebuild) and 18e (content migration) and 18f (frontend rewire) all have hard dependencies on those decisions + on a concrete rebuild spec.

### Prior decisions still load-bearing

- **Parent D1** — Directus 11+ over Payload. Locked. Not revisited here.
- **Parent D2** — Scorched-earth rebuild on the same `yesid.dev-cms` repo. Constrains this sub-slice's audit output (research.md § 2 must produce a scorch-list keyed to the existing repo layout).
- **Parent D3** — Content migration via export-import (not in-place DB mutation). Constrains D3 below (schema approach must support export-import, not force in-place schema mutation).
- **Parent D4** — Directus Translations interface replaces Payload `localized: true`. Fixed at parent level; this sub-slice's rebuild spec must reflect it.
- **Parent D5** — DNS cutover with 2-week escrow. Not directly in 18c's scope (implemented in 18g) but the rebuild spec must preserve DNS compatibility.
- **Slice 17c Zod-at-the-boundary invariant** — must survive. This sub-slice's rebuild spec flags the places 18f's Zod rewrite will need.

### Constraints

- **Budget discipline.** Monthly cost of (D1 hosting + D2 storage) ≤ €20 self-host OR $20 managed. Flag if neither option fits.
- **Docs-only delivery.** No `yesid.dev` source / test / static / config edits. Sandbox experiments allowed on a throwaway branch in `yesid.dev-cms`; commits there are referenced in research.md but not deliverables.
- **No platform re-litigation.** Parent D1 is settled.
- **Schema approach must support rollback.** A one-way in-place mutation that can't revert is disqualified regardless of other merits.

### What's intentionally NOT being addressed here

- Executing the scorched-earth rebuild (→ 18d).
- Migrating content rows (→ 18e).
- Frontend rewire / Zod rewrite (→ 18f).
- DNS cutover + Payload sunset (→ 18g).
- Block-based page-builder design work — design is locked per 2026-04-22 direction.

## Architecture

- **Docs-only deliverable.** Every output file lives under `docs/slices/slice-18/slice-18c/`. Zero code changes in `yesid.dev`. Zero `main`-branch changes in `yesid.dev-cms`.
- **Sandbox experiments** (optional) land on a throwaway branch `slice-cms-ux-redesign` in `yesid.dev-cms`. Findings get captured in `research.md` with cited commit SHAs. Sandbox commits are never merged.
- **Decision artifact** = `decisions.md` with three decisions (D1/D2/D3). Those decisions are then promoted into this `spec.md § Design decisions` with full structure per template (Chosen / Alternatives / Why / Tradeoff / Affects).
- **Contract to 18d** = `rebuild-spec.md`. Step-by-step commands + schema definition. 18d opens its own sub-slice bundle (`docs/slices/slice-18/slice-18d/`) and references this file as its primary input.

## Scope

### In scope

- Directus 11+ architecture deep-dive (collections, singletons, M2A, Translations, Flows, Insights, Data Studio, Files, Extensions, native MCP).
- `yesid.dev-cms` current Payload-state audit + scorch/keep/archive inventory.
- Three decisions: D1 hosting, D2 media storage, D3 schema approach.
- Directus FORMULA — editor-ergonomics checklist parallel to Payload's 22-item.
- Concrete step-by-step rebuild spec for 18d.
- Per-task append entries in `../devlog.md` + `./handoff.md`.

### Out of scope

- Executing the scorched-earth rebuild (→ 18d).
- Content migration of 73 rows (→ 18e).
- Frontend rewire + Zod schema rewrite (→ 18f).
- DNS cutover + Payload archive (→ 18g).
- Sandbox code commits merged anywhere.
- Re-opening parent D1 (Directus over Payload).
- Block-based page-builder design work (deferred post-launch).

## Design decisions

> D1–D3 are the deferred decisions from parent D6. They are scaffolded here as pending entries; their final Chosen values + full rationale land via Task 18c-2 and are recorded in § Amendments at close.

### D1 — Hosting (pending — resolved in Task 18c-2)

- **Chosen:** _pending — one of Railway / Hetzner VPS / Directus Cloud Standard_
- **Alternatives considered:** Railway (PaaS ease), Hetzner VPS (lowest cost, highest ops), Directus Cloud Standard (least ops, fewest extension options). Others (Fly.io, Vercel) evaluated and rejected in research.md.
- **Why this won:** _pending — filled at Task 18c-2 close with the decision rationale._
- **Tradeoff:** _pending._
- **Affects:** 18d scaffold (Dockerfile + deploy config), 18e (import target host), 18f (API base URL in frontend).
- **Cost constraint:** total monthly cost across D1 + D2 ≤ €20 self-host OR $20 managed. Enforced at Task 18c-2 verification.

### D2 — Media storage (pending — resolved in Task 18c-2)

- **Chosen:** _pending — one of Vercel Blob / Cloudflare R2 / Directus Files (built-in)_
- **Alternatives considered:** Vercel Blob (existing integration, 1 GB free), Cloudflare R2 (10 GB free + egress-free, $0.015/GB), Directus Files (built-in, uses whatever storage driver you configure — routing question).
- **Why this won:** _pending._
- **Tradeoff:** _pending._
- **Affects:** 18d (storage driver configuration), 18e (media URL rewrite pass during content migration), 18f (image src URL patterns in `src/lib/services/*.service.ts`).

### D3 — Schema approach (pending — resolved in Task 18c-2)

- **Chosen:** _pending — one of (a) introspect Payload DB / (b) fresh Directus rebuild in same Neon project / (c) fresh Directus rebuild in new Neon branch_
- **Alternatives considered:** (a) Directus introspects existing Payload tables (lowest friction but fights i18n reshape); (b) new Directus tables alongside old Payload tables in same Neon project (clean break, one DB); (c) fresh Neon branch for Directus (100% isolation, two DBs during migration window).
- **Why this won:** _pending._
- **Tradeoff:** _pending._
- **Affects:** 18d (schema definition + migration commands), 18e (export source + import target), 18f (Zod schema rewrite scale).
- **Rollback constraint:** chosen approach must support rollback at each step. One-way in-place mutation is disqualified (per § Context > Constraints).

### D4 — Sub-slice folder naming: `slice-18c/` (not `c/`)

- **Chosen:** Folder name is `docs/slices/slice-18/slice-18c/`.
- **Alternatives considered:** `docs/slices/slice-18/c/` per the subslice template's `<letter>/` convention.
- **Why this won:** Existing project convention — `docs/slices/slice-15/slice-15c/` is the established precedent. Branch naming (`feature/slice-18c-...`) already uses this shape. User explicitly requested this path.
- **Tradeoff:** Diverges from the template's `<letter>/` hint. Template docs warrant a future update to match reality; flagged as a parent-slice amendment candidate.
- **Affects:** all file paths in this sub-slice + parent plan's § Sub-slices table references.

### D5 — Prefer built-in Directus features over custom / hardcoded

- **Chosen:** Every requirement surfaced in 18c (auth, i18n, drafts, revisions, media, file storage, rich text, preview, webhooks, MCP, email, permissions, presence, search, activity feed, etc.) is first satisfied by a built-in Directus feature. `research.md § 4` is a **built-in-first inventory** (not an extension catalog); `formula.md § A` (default-on) comes before § B (configure) comes before any custom path; `rebuild-spec.md § 4` maps every field to a built-in interface/display. Custom extensions, hardcoded adapters, or hand-rolled workarounds are allowed ONLY when no built-in equivalent exists AND a written justification appears in `research.md § 4` or `decisions.md`.
- **Alternatives considered:** "Use whatever works fastest" (mixed built-in + custom without preference); "Re-create the Payload FORMULA verbatim in Directus" (which would over-customize areas where Directus ships richer defaults).
- **Why this won:** Yesid's 2026-04-22 direction ("No hardcoding — use built in assets provided by Directus"). Built-ins carry forward across Directus upgrades; custom extensions age into maintenance debt. Research slice already scored Directus 8/8 on editor differentiators *because* of its defaults — the FORMULA should lean on them, not over-ride them. Matches the project-wide memory rule `feedback_data_driven.md` (never hardcode).
- **Tradeoff:** Accepts that some Payload-era patterns (e.g., Lexical-specific block features) lose fidelity if Directus's built-in WYSIWYG doesn't match 1:1. Yesid has already accepted this in the pivot decision (parent D1, § tradeoff row).
- **Affects:** Tasks 18c-1 (audit must note built-in parity for every Payload custom), 18c-2 (hosting + storage picks must use built-in storage drivers, not hand-rolled S3 wrappers), 18c-3 (FORMULA § A foregrounds default-on items), 18c-4 (rebuild spec cites built-in for every requirement; custom flagged with justification). Also affects downstream sub-slices 18d / 18e / 18f — every schema field maps to a built-in Directus interface unless justified.

## File-touch summary

- **Created:**
  - `docs/slices/slice-18/slice-18c/plan.md` — this sub-slice's plan (scaffolded at open).
  - `docs/slices/slice-18/slice-18c/spec.md` — this file.
  - `docs/slices/slice-18/slice-18c/handoff.md` — running PR-body log.
  - `docs/slices/slice-18/slice-18c/research.md` — Task 18c-1 output.
  - `docs/slices/slice-18/slice-18c/decisions.md` — Task 18c-2 output.
  - `docs/slices/slice-18/slice-18c/formula.md` — Task 18c-3 output.
  - `docs/slices/slice-18/slice-18c/rebuild-spec.md` — Task 18c-4 output.
- **Modified:**
  - `docs/slices/slice-18/devlog.md` — per-task appends (D19: slice-level devlog, not sub-slice).
- **Deleted:** none.
- **Out-of-repo:** optional — `yesid.dev-cms` branch `slice-cms-ux-redesign` (sandbox experiments, never merged).

## Acceptance criteria

- [ ] `research.md` shipped (Task 18c-1): 4 sections populated, > 100 lines, repo-audit table exhaustive, § 4 is a **built-in-first inventory** (not a custom-extension catalog; every requirement names the Directus built-in before listing any extension per D5), no FILL IN.
- [ ] `decisions.md` shipped (Task 18c-2): D1 + D2 + D3 each have a concrete Chosen value (not "TBD"); total monthly cost (D1 + D2) ≤ €20 self-host OR $20 managed.
- [ ] `spec.md § Design decisions` D1–D3 updated from "pending" to filled entries (via Amendments log); D4 remains as-written.
- [ ] `formula.md` shipped (Task 18c-3): four sections (A default-on / B configure / C heuristics / D effort) populated; § A ≥ 8 items; § B ≥ 8 items; § C ≥ 10 heuristics; § D has hours estimate + rationale.
- [ ] `rebuild-spec.md` shipped (Task 18c-4): 6 sections populated; § 4 schema covers all 10 collections + 10 globals from 18b and maps every field to a built-in Directus interface/display (custom interfaces require written justification per D5); § 2 scorch list matches research.md § 2 exactly.
- [ ] `./handoff.md § 3 Tasks completed` has 4 appended per-task blocks (one per 18c-1 through 18c-4).
- [ ] `../devlog.md` has per-task entries under the session block(s) that executed 18c (D19: slice-level devlog).
- [ ] `../plan.md § Sub-slices` row for 18c updated to ✅ shipped + PR link (at slice close).
- [ ] `bun run test` + `bun run check` + `bun run lint` green (no-op expected — docs-only).
- [ ] Cross-tool adversarial peer review (Codex per `feedback_codex_review_at_slice_close.md`) clean OR all BLOCKER/HIGH findings addressed.
- [ ] `/workflow-close-slice` run; § Summary + § PR Body + § Peer review notes in handoff.md populated.

## Open questions

- **Q1.** Does any D1 hosting option (Railway / Hetzner / Directus Cloud) have a blocker against Neon Postgres as the underlying DB? Resolution expected: Task 18c-2 Step 1, via research.md § 1 + live Directus docs.
- **Q2.** Does D2's choice (Blob / R2 / Directus Files) require a URL-rewrite pass during 18e content migration, or can Directus's file-driver resolve legacy Vercel Blob URLs transparently? Resolution expected: Task 18c-2 Step 2.
- **Q3.** Does D3's schema-approach choice require an explicit `npx directus schema apply` step or is Admin-UI click-path sufficient? Resolution expected: Task 18c-4 Step 4 (rebuild-spec authoring).

## Risks

- **R1.** Hosting pricing page out-of-date. Condition: Directus Cloud pricing shifts between research-slice date (2026-04-22) and this sub-slice's execution. Impact: D1 decision premised on stale numbers. Mitigation: Task 18c-2 Step 1 re-fetches pricing pages live; if numbers diverge > 10% from decision-brief, flag + re-evaluate.
- **R2.** Directus extension for Resend email adapter is unmaintained. Condition: research.md § 4 discovers that the needed Resend integration requires a custom adapter, not an off-the-shelf extension. Impact: 18d rebuild balloons by 0.5–1 day. Mitigation: flag in `research.md § 4` + add to rebuild-spec.md § 3 with a concrete implementation path (clone SMTP adapter + swap to Resend SDK).
- **R3.** MCP endpoint migration friction. Condition: `mcp__yesid-cms-prod__*` Claude Code tools are hard-coded to Payload's MCP endpoint shape; Directus's native MCP (v11.13) may have different auth / tool names / response shapes. Impact: 18g DNS flip breaks AI-agent tooling. Mitigation: Task 18c-1 Step 5 explicitly audits MCP endpoint delta and flags to rebuild-spec.md § 3 + 18g handoff.
- **R4.** Sandbox commits leak into main. Condition: sandbox experiments on `yesid.dev-cms/slice-cms-ux-redesign` accidentally get pushed to main or referenced as deliverables. Impact: violates docs-only constraint + pollutes audit. Mitigation: every task's verification step checks `git log main --since=<session-start>` in `yesid.dev-cms` is unchanged.

## Free-tier / cost / quota considerations

- **Directus Cloud Standard:** $15/mo/seat. If chosen for D1, that's $180/yr fixed cost — evaluate against Hetzner's ~€54/yr + Yesid's time cost of managing a VPS.
- **Cloudflare R2 free tier:** 10 GB storage + unlimited egress. Fits projected volume (~25 MB) with huge headroom; Class A operations free up to 1M/mo.
- **Vercel Blob free tier:** 1 GB storage + 10 GB bandwidth. Sufficient but tighter than R2.
- **Neon free tier:** 0.5 GB + 191.9 compute-hrs/mo. Must fit Directus schema + 73 migrated rows + translations junction rows (~3× multiplier = 200–450 rows). Well within free tier.
- **Sandbox cost:** throwaway Directus on local Docker = $0. Production test on Directus Cloud trial = $0 (14-day trial). No surprise bills expected in this sub-slice.

## Amendments log

| Date       | Change                                                                  | Why                                                                             | Affected sections |
|------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------|-------------------|
| 2026-04-22 | Spec scaffolded with D1–D3 pending, D4 (folder naming) resolved         | Sub-slice opened; D1–D3 depend on Task 18c-2 research (by design)               | § Design decisions |
| 2026-04-22 | D5 added — prefer built-in Directus features over custom / hardcoded    | Yesid direction mid-scaffold: "use Directus available built-in features … no hardcoding" | § Design decisions, § Acceptance criteria, plan.md § Hard constraints + § Tasks 18c-1/3/4 |
