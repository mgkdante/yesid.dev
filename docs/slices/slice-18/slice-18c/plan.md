# slice-18/slice-18c — Plan

> Sub-slice-level execution plan (Level 2, PR boundary). Sub-slices do NOT have sub-sub-slices — tasks below are implemented directly via Iteration Protocol. Tasks have NO files; they live in TodoWrite / Codex equivalent (D19).

> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:executing-plans` (or `superpowers:subagent-driven-development` for parallel-eligible tasks) to execute this plan.

**Goal:** Produce the research + decisions + rebuild spec that sub-slice 18d will execute — hosting choice, storage choice, schema approach, Directus FORMULA (editor ergonomics), and a concrete scorched-earth rebuild spec.

**Architecture:** Docs-only sub-slice. No application code changes in `yesid.dev`. Sandbox experiments (throwaway Directus instance, schema trials) allowed on a separate branch in `yesid.dev-cms` (e.g., `slice-cms-ux-redesign`) but must not touch main in either repo.

**Tech Stack:** inherited from project — no stack changes in this sub-slice. Sandbox uses Directus 11+ via Docker Compose for local feel-testing.

**Branch:** `feature/slice-18c-directus-research` (no worktree — docs-only, single session series).

**Multi-session estimate:** 2–3 sessions (research + synthesis + rebuild-spec authoring).

**Spec:** [./spec.md](spec.md) · **Parent slice plan:** [../plan.md](../plan.md)

**Prerequisite:** `slice-headless-cms-best-practices` merged (PR #31); slice-18 Level-1 bundle merged (PR #33). Pivot decision D1 in parent plan already locked.

---

## Important context

- Parent slice 18 already pivoted (parent D1): Directus 11+ replaces Payload 3. Do NOT revisit the platform choice in this sub-slice — it's settled.
- 18a + 18b shipped on Payload 3.83.0 on 2026-04-21. Production state: 73 seeded rows across 5 collections + 7 page-globals + 3 true singletons + 1 media row at `cms.yesid.dev`. DNS + Resend + MCP all configured against the existing `yesid.dev-cms` repo and subdomain.
- The research slice `slice-headless-cms-best-practices` (decision-brief + research.md) is the source of truth for the pivot rationale AND for the existing Payload FORMULA (22-item checklist, 12 content-modeling heuristics). Many parent-level decisions (D1–D6) already reference it — don't re-derive.
- This sub-slice is **docs-only**. No `src/`, `tests/`, `static/`, or `yesid.dev-cms`-main changes. Sandbox exploration lands on a throwaway branch + gets captured in research notes here; it is not a deliverable.
- The rebuild spec this sub-slice produces is what 18d consumes. 18d does not begin until 18c merges. Same for 18e (content migration) which depends on the schema approach decision from this sub-slice.
- Parent D6 explicitly defers hosting + storage decisions here. Those MUST be resolved before close.

## Read these files first

Read in order:

1. [`./spec.md`](spec.md) — this sub-slice's spec (scope, goal, design decisions).
2. [`../plan.md`](../plan.md) — parent slice-18 plan (themes, constraints, parent D1–D6).
3. [`../README.md`](../README.md) — slice-18 post-pivot direction doc (architecture diagram, content-model crosswalk, cost model, acceptance criteria).
4. [`../../slice-headless-cms-best-practices/decision-brief.md`](../../slice-headless-cms-best-practices/decision-brief.md) — pivot rationale + scorecard.
5. [`../../slice-headless-cms-best-practices/research.md`](../../slice-headless-cms-best-practices/research.md) — 6-agent analysis, cited. Long (~1000 lines); skim § DNS & Infrastructure Migration Inventory + § Directus sections fully.
6. [`../../slice-headless-cms-best-practices/plan.md`](../../slice-headless-cms-best-practices/plan.md) — includes the 22-item Payload FORMULA that this sub-slice re-expresses for Directus.
7. [`../../../reference/ARCHITECTURE.md`](../../../reference/ARCHITECTURE.md) and [`../../../project/ARCHITECTURE.md`](../../../project/ARCHITECTURE.md) — two-repo topology + Directus pivot delta already landed; confirm they match what this sub-slice assumes.
8. Live docs: [directus.io/docs](https://directus.io/docs), [directus.io/mcp](https://directus.io/mcp), [SvelteKit tutorials on directus.io](https://directus.io/docs/tutorials).

## Hard constraints

- No application code changes in `yesid.dev`. Zero `src/`, `tests/`, `static/`, or `package.json` edits.
- No `main`-branch commits in `yesid.dev-cms`. Sandbox experiments land on a throwaway branch; the repo is otherwise frozen until 18d.
- Platform choice is locked (parent D1 — Directus 11+). Do not re-open.
- **Use built-in Directus features by default.** For every requirement this sub-slice captures — auth, i18n, drafts, revisions, media, file storage, rich text, preview, webhooks, MCP, email, permissions, presence, search — the rebuild spec must cite the Directus built-in mechanism (feature name + Admin UI path or CLI command + docs link). Custom extensions, hardcoded workarounds, or hand-rolled adapters are allowed ONLY when no built-in equivalent exists AND a written justification appears in `research.md § 4` or `decisions.md`. (See spec D5.)
- FORMULA output must be actionable — every item must be a concrete Directus-UI or configuration step, not aspirational. § A (default-on) items are always preferred over § B (configure-for-clients); § B items are always preferred over bespoke code.
- Rebuild spec must be executable by a fresh session with no external context beyond what this sub-slice + the parent bundle + the research slice provide.
- Hosting + storage decisions close this sub-slice. No "defer to 18d" allowed — parent D6 already did that once.
- Budget discipline: total monthly cost of chosen hosting + storage ≤ €20/mo (self-host) OR $20/mo (managed). If neither option fits, escalate to owner — don't silently pick a pricier tier.

## Canonical commands

> Inherited from parent slice-18 plan. Only local-docs lint applies to this sub-slice; the rest become relevant in 18d+.

| Purpose       | Command                                              |
| ------------- | ---------------------------------------------------- |
| Install       | inherited from parent (`bun install`)                |
| Build         | inherited (`bun run build`) — not exercised this sub-slice |
| Test (unit)   | inherited (`bun run test`) — not exercised           |
| Test (E2E)    | inherited (`bun run test:e2e`) — not exercised       |
| Lint          | inherited (`bun run lint`) — docs-only; should be a no-op here |
| Typecheck     | inherited (`bun run check`) — docs-only; no-op here  |
| Run locally   | inherited (`bun run dev`) — not exercised            |
| Migrate (DB)  | n/a                                                  |
| Run secrets   | inherited (`op run --env-file=.env -- <cmd>`) — not exercised |

Sandbox-only (optional, on throwaway branch in `yesid.dev-cms`):

- `docker compose up -d directus` — spin up a local Directus instance against a scratch Neon branch for feel-testing.
- `npx directus schema snapshot ./snapshot.yaml` — export a schema to compare / feed into the rebuild spec.

## Session layout

- **Session 1 — Research + repo audit (Task 18c-1):** read source material, audit yesid.dev-cms's current Payload state, draft Directus-architecture section. Closing budget at end of Task 1.
- **Session 2 — Decisions + FORMULA (Tasks 18c-2 + 18c-3):** resolve hosting, storage, schema approach (D1–D3 of this sub-slice's spec); draft Directus FORMULA (editor ergonomics). Close at end of Task 3.
- **Session 3 — Rebuild spec + close (Task 18c-4):** author the 18d-ready rebuild spec; run `/workflow-close-slice`. Optional — if Session 2 left budget, fold Task 4 into it.

## File structure

### Files to create

| Path                                                       | Created in task | Purpose |
|------------------------------------------------------------|-----------------|---------|
| `docs/slices/slice-18/slice-18c/plan.md`                   | scaffold (now)  | this file |
| `docs/slices/slice-18/slice-18c/spec.md`                   | scaffold (now)  | sub-slice spec |
| `docs/slices/slice-18/slice-18c/handoff.md`                | scaffold (now)  | running PR-body log |
| `docs/slices/slice-18/slice-18c/research.md`               | task 18c-1      | Directus architecture deep-dive + yesid.dev-cms repo audit |
| `docs/slices/slice-18/slice-18c/decisions.md`              | task 18c-2      | hosting / storage / schema-approach decisions (D1–D3 of this sub-slice) |
| `docs/slices/slice-18/slice-18c/formula.md`                | task 18c-3      | FORMULA for Directus — editor ergonomics checklist (parallel to Payload's 22-item) |
| `docs/slices/slice-18/slice-18c/rebuild-spec.md`           | task 18c-4      | concrete step-by-step spec for 18d to execute |

### Files to modify

| Path                                  | Modified in task | Change |
|---------------------------------------|------------------|--------|
| `docs/slices/slice-18/devlog.md`      | every task       | append per-task entry per D19 (slice-level devlog, not sub-slice) |

### Files to delete

| Path | Deleted in task | Why |
|------|-----------------|-----|
| — | — | none (research-only sub-slice creates nothing to delete) |

### Files outside repo (cloud, global config, etc.)

| Path                                                                 | Touched in task | Action |
|----------------------------------------------------------------------|-----------------|--------|
| `yesid.dev-cms` repo, branch `slice-cms-ux-redesign` (optional sandbox) | any task        | modify — throwaway experiments only; not merged anywhere |

## Tasks

> Each task = one Level 3 unit. Each ends with **STOP. Ask owner to verify before next task.** Iteration Protocol applies.

---

### Task 18c-1 — Directus architecture + `yesid.dev-cms` repo audit

- **Goal:** Produce a Directus-architecture deep-dive + an inventory of what exists in `yesid.dev-cms` today (Payload state) and what gets scorched in 18d.
- **Files:**
  - Create: `docs/slices/slice-18/slice-18c/research.md`
  - Modify: `docs/slices/slice-18/devlog.md` (append task entry)
- **Dependencies:** none (first task).

**Steps:**

- [ ] **Step 1:** Read the 8 files in § Read these files first in order. Do not skim the research-slice decision-brief; re-read the scorecard + integrated recommendation.
- [ ] **Step 2:** Author `research.md` § 1 — Directus 11+ primitives: Collections, Singletons, M2A (Many-to-Any) relations, Translations interface (junction tables), Flows, Insights, Data Studio, Files, Extensions, native MCP (v11.13). One paragraph per primitive; name the Payload equivalent where applicable.
- [ ] **Step 3:** Author `research.md` § 2 — `yesid.dev-cms` repo audit. Run `gh repo view mgkdante/yesid.dev-cms` and `gh api repos/mgkdante/yesid.dev-cms/contents` to enumerate current Payload artifacts. Produce a table: **Path** | **Type** (collection / global / config / migration / seed / plugin / other) | **18d action** (scorch / rewrite / keep / archive).
- [ ] **Step 4:** Author `research.md` § 3 — two-repo topology delta. Confirm `cms.yesid.dev` DNS + Resend DKIM/SPF + MCP config remain as-is under Directus; list every infra artifact that stays vs gets swapped.
- [ ] **Step 5:** Author `research.md` § 4 — **built-in-first inventory** (per spec D5). For every slice-18 requirement, name the Directus built-in that satisfies it (feature name + docs link + Admin UI path or CLI command). Only after the built-in row is exhausted do extensions (marketplace or custom) appear — and each extension row carries a one-line justification of why no built-in covers the requirement. Cover at minimum: i18n (Translations interface), rich text (built-in WYSIWYG vs Lexical parity), media (Files + storage driver), drafts (built-in draft/publish), revisions (default-on), MCP (native v11.13), email (built-in email service + SMTP/Resend driver routing), permissions/roles, presence, global search, activity feed, webhooks (Flows).
- [ ] **Step 6:** Run canonical verification: `grep -n "FILL IN" docs/slices/slice-18/slice-18c/research.md` must return nothing; `wc -l` should be > 100.
- [ ] **Step 7:** Append a `### Task 18c-1` block to `../devlog.md` current session AND a `### Task 18c-1` block to `./handoff.md` per the handoff template.

**Verification:**

- `research.md` has 4 populated sections (no FILL IN), > 100 lines, tables for § 2 (repo audit) and § 4 (extensions) are filled.
- `gh repo view mgkdante/yesid.dev-cms` output quoted in § 2 (inline or linked).
- `handoff.md § Task 18c-1` captures: created files, decisions made, verification output.

**STOP. Ask owner to verify before Task 2.**

---

### Task 18c-2 — Decisions: hosting + storage + schema approach

- **Goal:** Resolve the three deferred decisions (parent D6) with written rationale + final picks.
- **Files:**
  - Create: `docs/slices/slice-18/slice-18c/decisions.md`
  - Modify: `docs/slices/slice-18/slice-18c/spec.md` (add D1–D3 entries), `docs/slices/slice-18/devlog.md`
- **Dependencies:** Task 18c-1 complete (research inventory informs the decisions).

**Steps:**

- [ ] **Step 1:** Author `decisions.md § D1 — Hosting`. Compare Railway (PaaS ease, ~$5–20/mo), Hetzner (VPS €4.50/mo, highest ops load), Directus Cloud (Standard $15/mo, least ops, fewest extension options). Include: cost/mo table, ops-load estimate, migration-path-back cost, fit with SvelteKit + Vercel frontend, MCP / Resend / Neon compatibility. State the pick + the tradeoff explicitly.
- [ ] **Step 2:** Author `decisions.md § D2 — Media storage`. Compare Vercel Blob (existing integration, 1 GB free, ~$0.15/GB), Cloudflare R2 (10 GB free, $0.015/GB, egress-free), Directus Files (uses whatever storage driver you configure — so really a default-routing question). Include: cost/mo at Yesid's projected volume (currently 1 row, target ~50 media items at ~500KB avg = 25 MB), driver complexity in Directus, URL-rewrite impact on 18e content migration. State the pick + tradeoff.
- [ ] **Step 3:** Author `decisions.md § D3 — Schema approach`. Compare: **(a)** DB introspect Directus against the existing Payload Neon DB (Directus reads Payload's tables via introspection); **(b)** fresh rebuild in the same Neon project (new Directus tables alongside old Payload tables, migrate content, drop old); **(c)** fresh Neon branch for Directus (parallel DB, 100% isolation). Weigh: i18n reshape (Payload's `localized:true` → Directus Translations junction tables), Zod schema rewrite size, rollback cost, clean-break vs in-place-mutation risk. State pick + tradeoff.
- [ ] **Step 4:** Promote each decision to `spec.md § Design decisions` as **D1 / D2 / D3** with the standard structure (Chosen / Alternatives / Why / Tradeoff / Affects).
- [ ] **Step 5:** Run canonical verification: no FILL IN in `decisions.md` or `spec.md` D-sections; each decision names a single concrete choice (not "Railway or Hetzner — TBD").
- [ ] **Step 6:** Append `### Task 18c-2` to `../devlog.md` + `./handoff.md`.

**Verification:**

- `decisions.md` has 3 decisions, each with Chosen / Alternatives / Why / Tradeoff / Affects.
- `spec.md § Design decisions` has D1, D2, D3 matching `decisions.md`.
- Each pick names a concrete provider / approach. No "TBD" in Chosen values.
- Total monthly cost of D1 + D2 picks ≤ €20 (self-host) OR $20 (managed). Flag otherwise.

**STOP. Ask owner to verify before Task 3.**

---

### Task 18c-3 — FORMULA for Directus (editor ergonomics)

- **Goal:** Author a Directus-equivalent of the Payload 22-item FORMULA — a concrete editor-ergonomics checklist for shipping a client-ready Directus admin. Targets yesid.dev's CRUD-dominant target clients (flower shop, restaurant, blogger, small e-commerce) per decision-brief's archetype analysis.
- **Files:**
  - Create: `docs/slices/slice-18/slice-18c/formula.md`
  - Modify: `docs/slices/slice-18/devlog.md`
- **Dependencies:** Task 18c-1 (for Directus-primitive vocabulary).

**Steps:**

- [ ] **Step 1:** Read the Payload FORMULA in `../../slice-headless-cms-best-practices/plan.md § FORMULA stub` + `research.md § 2 Authoring Ergonomics`. Note the 22-item checklist and 12 heuristics.
- [ ] **Step 2:** Author `formula.md § A — Default-on items` (things Directus ships with that Payload needs defensive customization for). Examples from decision-brief: revisions-on-by-default, presence indicator, mobile/iPad admin, Note field renders by default, Used-In media lookup, activity feed, keyboard shortcuts, global search, in-app product tour. Each item: feature name + Directus-configuration location + client-visible effect.
- [ ] **Step 3:** Author `formula.md § B — Configure-for-clients items` (things Directus supports but ship off by default). E.g., display templates (`{{title}} — {{slug}}`), Translations interface wiring, WYSIWYG field constraints (block inline-HTML paste), file folders + thumbnail generation, role permissions for editor vs admin, Flows for publish webhook + draft notifications. Each item: feature name + Directus-configuration location + concrete config snippet (CLI command or Admin-UI path) + why it matters for a flower shop / restaurant / blogger / small e-commerce.
- [ ] **Step 4:** Author `formula.md § C — Heuristics` (editorial principles parallel to Payload's 12). E.g., one singletons-vs-pages-collection rule (parent Q3-era), localized-fields-inside-Translations rule, M2A-for-reusable-blocks rule, file-folder-per-collection rule. Keep to 10–15 heuristics.
- [ ] **Step 5:** Estimate `formula.md § D — Effort-per-project` — Directus defensive-config hours per project. Decision-brief estimate was 3–4 hrs (vs Payload's 12–16). Refine based on the concrete checklist just authored. Flag any § B item that pulls the estimate above 6 hrs as a candidate for built-in-first re-design (per spec D5).
- [ ] **Step 6:** Run canonical verification: no FILL IN; § A + § B + § C each have ≥ 5 items; § D has a numeric estimate with rationale.
- [ ] **Step 7:** Append `### Task 18c-3` to `../devlog.md` + `./handoff.md`.

**Verification:**

- `formula.md` has four sections (A / B / C / D) populated.
- § A ≥ 8 default-on items; § B ≥ 8 configure items; § C ≥ 10 heuristics; § D has an hours estimate with supporting reasoning.
- Each § B item has a concrete config step — CLI or Admin-UI path. No "configure in the admin" hand-waves.

**STOP. Ask owner to verify before Task 4.**

---

### Task 18c-4 — Rebuild spec for 18d

- **Goal:** Produce a concrete step-by-step spec that 18d can execute to scorch Payload + rebuild as Directus. Zero ambiguity; 18d should need only this file + parent plan to proceed.
- **Files:**
  - Create: `docs/slices/slice-18/slice-18c/rebuild-spec.md`
  - Modify: `docs/slices/slice-18/devlog.md`
- **Dependencies:** Tasks 18c-1, 18c-2, 18c-3 complete.

**Steps:**

- [ ] **Step 1:** Author `rebuild-spec.md § 1 — Pre-rebuild checklist`. Covers: production snapshot (Neon backup), DNS TTL lowering for `cms.yesid.dev`, Resend sender domain confirmation stays, MCP client config noted, `cms-legacy.yesid.dev` DNS record scheduled for 18g.
- [ ] **Step 2:** Author `rebuild-spec.md § 2 — Scorch plan`. Using research.md § 2 repo-audit table, list every file in `yesid.dev-cms` that 18d deletes (collections/*.ts, globals/*.ts, payload.config.ts, migrations/, seed/*, `@payloadcms/*` dependencies). Include `git rm` commands.
- [ ] **Step 3:** Author `rebuild-spec.md § 3 — Scaffold Directus`. Concrete steps: Dockerfile, docker-compose.yml, .env template (match D1 hosting choice), Directus CLI bootstrap (`npx directus init`), extension installs from research.md § 4 table.
- [ ] **Step 4:** Author `rebuild-spec.md § 4 — Schema definition`. For each of the 5 collections + 7 page-globals + 3 singletons + 1 media collection, define the Directus equivalent. Use either YAML (for `npx directus schema apply`) or a step-by-step Admin UI click path. Include relationships (M2A for reusable blocks per Q3 resolution; Translations junction tables per parent D4). Every field must map to a built-in Directus interface/display type; flag any field that would require a custom interface with a written justification per spec D5.
- [ ] **Step 5:** Author `rebuild-spec.md § 5 — Post-rebuild validation`. What 18d must prove before handing off to 18e: `npx directus schema snapshot` produces expected output, admin loads at staging URL, sample content round-trips via API, MCP endpoint responds.
- [ ] **Step 6:** Author `rebuild-spec.md § 6 — Rollback`. If rebuild breaks mid-way, how 18d reverts (branch-level revert on yesid.dev-cms; staging URL teardown; production stays on Payload).
- [ ] **Step 7:** Run canonical verification: no FILL IN; every step has a concrete command or click path; § 4 schema covers ALL 10 collections + 10 globals from 18b.
- [ ] **Step 8:** Append `### Task 18c-4` to `../devlog.md` + `./handoff.md`.

**Verification:**

- `rebuild-spec.md` has 6 sections, all populated.
- § 4 covers every collection + global from 18b's 73-row seed.
- § 2 scorch list matches research.md § 2 repo-audit table exactly (no drift).
- § 3 extension installs match research.md § 4 extension inventory.

**STOP. Ask owner to verify before `/workflow-close-slice`.**

---

## Execution order

- Task 18c-1 → Task 18c-2 → Task 18c-3 → Task 18c-4 (sequential — each task's output feeds the next).
- Parallelization: 18c-2 and 18c-3 could run in parallel after 18c-1, but owner approval required per AGENTS.md § Hard rules; default is sequential.

## Validation to run

After every task:

- `grep -rn "FILL IN" docs/slices/slice-18/slice-18c/` — must return nothing except template placeholders in the current task's in-progress file (which is why this is a per-task check, not a global one).
- `ls docs/slices/slice-18/slice-18c/` — expected file count grows by 1 per task (plan/spec/handoff scaffolded at open; research.md after 1; decisions.md after 2; formula.md after 3; rebuild-spec.md after 4).
- `bun run lint` on yesid.dev — should be a no-op (docs-only changes); if it trips, investigate.

At sub-slice close (before `/workflow-close-slice`):

- All 4 tasks' handoff entries present in `./handoff.md § 3 Tasks completed`.
- Parent slice-18 `plan.md § Sub-slices` row for 18c updated from ⏳ planned to ✅ shipped + PR link (landed in this PR's close).
- Parent slice-18 `devlog.md` has 4 per-task entries under the session block(s) that executed 18c.
- Cross-tool adversarial peer review (Codex) clean OR BLOCKER/HIGH findings addressed (per `feedback_codex_review_at_slice_close.md`).
- `bun run test`, `bun run check`, `bun run lint`: all green no-op (docs-only sub-slice).

## Common pitfalls

- **Forgetting this is docs-only.** Temptation: "let me just spin up Directus + scaffold a collection while I research" — that's a sandbox experiment on `slice-cms-ux-redesign` branch in `yesid.dev-cms`, NOT a deliverable of this sub-slice. Record findings in research.md; don't commit sandbox code anywhere on main.
- **Re-opening the platform choice.** Parent D1 is locked. If research surfaces new evidence against Directus, flag it in a spec amendment + escalate to owner — do NOT re-litigate the pivot mid-research.
- **Deferring the hosting/storage decisions again.** Parent D6 already said "deferred to 18c". This sub-slice must close them. If there's a blocker (e.g., pricing page missing), state it in a decision as "Chosen: X, with revisit trigger Y" rather than leaving TBD.
- **FORMULA bloat.** The goal is an actionable checklist, not a feature catalog. Every § B item must pass the "can a junior dev do this in 15 min?" test. If an item requires a 2-hour deep dive, break it into sub-steps or escalate.
- **Rebuild spec ambiguity.** 18d executes this without re-reading the parent bundle. "Configure Directus" is insufficient; "Run `npx directus schema apply schema.yaml` against the `DIRECTUS_DATABASE_URL` env var" is sufficient.
- **Devlog vs sub-slice file confusion.** Per D19, devlog is AT PARENT SLICE LEVEL (`../devlog.md`). Every per-task append goes there, NOT in a `slice-18c/devlog.md` (which must NOT exist).
- **Touching main repo.** Any code-looking commit on `yesid.dev` main (even `package.json`) while 18c is in flight is a scope violation — STOP and revert.

## Out of scope

- Scorched-earth rebuild (→ 18d).
- Content migration (→ 18e).
- Frontend rewire to Directus SDK (→ 18f).
- DNS cutover (→ 18g).
- Any `yesid.dev` source / test / static / config changes in this sub-slice.
- Re-opening parent D1 (Directus over Payload) — that's settled in the parent spec.
- Re-deriving FORMULA items from scratch without reading the Payload FORMULA first (duplicated work).
- Block-based page builder investigation — design locked per 2026-04-22 direction.

## Notes

**Related research:** [`../../slice-headless-cms-best-practices/`](../../slice-headless-cms-best-practices/) — full 6-agent research bundle. `decision-brief.md` is the pivot rationale; `research.md` is the ~1000-line cited source. `plan.md` has the 22-item Payload FORMULA this sub-slice re-expresses for Directus.

**Cross-repo sandbox:** If hands-on feel-testing is needed (e.g., "does Translations junction really take 3-4 clicks for a new locale?"), create a branch `slice-cms-ux-redesign` in `yesid.dev-cms`, commit experiments there, reference commit SHAs in `research.md`. Do NOT merge sandbox commits to `yesid.dev-cms` main.

**MCP:** `mcp__yesid-cms-prod__*` tools remain pointed at Payload until 18g DNS flip. No re-pointing in this sub-slice.
