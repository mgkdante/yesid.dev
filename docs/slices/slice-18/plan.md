# slice-18 — Plan

> Slice-level plan (Level 1). Sits between the project plan ([../../plan.md](../../plan.md)) and per-sub-slice plans under `<letter>/plan.md`.

> **Devlog:** [devlog.md](devlog.md) — self-appending session record, shared across all sub-slices of this slice (D19).

> **Direction doc:** [README.md](README.md) — the post-pivot narrative of Slice 18 (architecture diagram, content-model crosswalk, cost model, acceptance criteria). This plan stays short and structural; the narrative lives in README.md.

## Scope

Cloud content layer for yesid.dev: move site content out of committed `.ts` files into a headless CMS (`yesid.dev-cms` repo at `cms.yesid.dev`) so non-engineer editors can manage content with drafts, previews, i18n (en/fr/es), and AI-agent (MCP) integration — while yesid.dev keeps its SvelteKit + Zod-at-the-boundary architecture. **Mid-slice pivot 2026-04-22:** sub-slices 18a + 18b shipped on Payload 3.83.0; research slice `slice-headless-cms-best-practices` produced a decision brief; stack pivoted to Directus 11+. Remaining sub-slices (18c–18g) execute scorched-earth rebuild + content migration + frontend rewire + DNS cutover. Out of scope: Keystatic, Block-based page builder (design-locked), multi-tenant Directus, migrating off Neon Postgres.

## Strategic themes

> Cross-cutting themes this slice advances. Themes group sub-slices by intent. Tag each sub-slice in § Sub-slices with its theme(s).

- **CMS pivot: Payload → Directus** (P0): Replace Payload 3 infrastructure with Directus 11+ on the same `yesid.dev-cms` repo. Drives every remaining sub-slice. — sub-slices: c, d, e, f, g
- **Authoring UX + MCP-native platform** (P0): Deliver an admin non-engineers can actually use (iPad admin, revisions on by default, global search, "where used" media lookup, in-app help) + native Directus MCP (v11.13) for AI agents. Compounds across every future client. — sub-slices: c, d, f
- **Preserve 73 rows + Zod contract discipline** (P0): Migrate all seeded content without loss (73 rows, en/fr/es); keep Slice 17c's Zod-at-the-adapter-boundary invariant intact under new Directus response shapes. — sub-slices: e, f
- **Reversible cutover** (P1): Every sub-slice ships behind a rollback path. 18d rebuilds on staging before touching prod; 18g keeps Payload alive on `cms-legacy.yesid.dev` for a 2-week escrow. — sub-slices: d, f, g

## Hard constraints

> Non-negotiable boundaries for this slice. Apply to every sub-slice within it. Violating any triggers STOP + ask owner.

- Stack stays SvelteKit 2 + Svelte 5 + Bun + Tailwind v4 + Neon Postgres. No framework swap.
- Zod-at-the-adapter-boundary invariant (Slice 17c) survives the CMS swap. Every `*.service.ts` still validates via a schema in `src/lib/schemas/` before returning data.
- All 73 production rows preserved across migration (projects 6, services 6, tech-stack 45, blog-posts 7, stack-scenarios 7, media 1, + page-level singletons). Zero data loss tolerated.
- Design is locked for now (per 2026-04-22 direction) — no block-based page-builder work in this slice. Deferred items 18g (VOCAB labels) and 18h (SVG palette picker) revisit post-launch.
- Budget stays free/low-tier: Neon free tier, Vercel Blob free tier (or R2 / Directus Files), Directus self-host ≤ €5/mo OR Directus Cloud Standard $15/mo. No surprise enterprise billing.
- `cms.yesid.dev` domain + Resend sender domain reused as-is; DKIM/SPF TXT records unchanged.
- Rollback path exists at every sub-slice boundary. Payload stays reachable on `cms-legacy.yesid.dev` for 2 weeks after 18g DNS flip.

## Canonical commands

> Ground truth for build / verify / run during this slice. Sub-slice plans inherit this table by reference.

| Purpose           | Command                                                           |
| ----------------- | ----------------------------------------------------------------- |
| Install           | `bun install`                                                     |
| Build             | `bun run build`                                                   |
| Test (unit)       | `bun run test`                                                    |
| Test (E2E)        | `bun run test:e2e`                                                |
| Lint              | `bun run lint`                                                    |
| Typecheck         | `bun run check`                                                   |
| Run locally       | `bun run dev`                                                     |
| Migrate (DB)      | n/a on yesid.dev; Directus schema lives in `yesid.dev-cms` repo   |
| Run with secrets  | `op run --env-file=.env -- <cmd>` (where secrets needed)          |

CMS-side commands (`yesid.dev-cms` repo, added 18d): Directus CLI (`npx directus schema apply`, `npx directus schema snapshot`), Docker Compose for local dev, Railway / Hetzner / Directus Cloud CLI for deploy (host choice finalized in 18c).

## Sub-slices

> The slice decomposes into sub-slices. **Each sub-slice is a separate PR boundary** with its own `plan.md`, `spec.md`, `handoff.md` under `docs/slices/slice-18/<letter>/`. Tasks within a sub-slice live in TodoWrite / Codex tracker (no task-level files — D19).

| Letter | Scope (one line) | Theme(s) | Status | PR | Sessions |
|--------|------------------|----------|--------|----|----------|
| a | CMS Infrastructure Foundation (Payload) — **HISTORICAL post-pivot** | CMS pivot (superseded) | ✅ shipped 2026-04-21 | [#29](https://github.com/mgkdante/yesid.dev/pull/29) | 1 |
| b | Content Model + Seed (Payload) — **HISTORICAL post-pivot** (73 rows become migration source in 18e) | CMS pivot (superseded) | ✅ shipped 2026-04-21 | [#30](https://github.com/mgkdante/yesid.dev/pull/30) | 1 |
| c | Directus Research + Rebuild Spec — hosting choice, storage choice, schema approach, FORMULA-for-Directus | CMS pivot, Authoring UX | ⏳ planned (next) | — | 2–3 |
| d | Scorched-Earth Rebuild — delete Payload code from yesid.dev-cms; scaffold Directus; rebuild schema; deploy to staging | CMS pivot, Authoring UX, Reversible cutover | ⏳ planned | — | 1–2 |
| e | Content Migration — export 73 rows from Payload; transform; i18n reshape (`localized` → Translations); import to Directus; verify round-trip | Preserve 73 rows, Zod contract | ⏳ planned | — | 1–2 |
| f | Frontend Rewire — replace `@payloadcms/*` with `@directus/sdk` across `src/lib/services/*.service.ts`; rewrite ~40–60% of Zod schemas; Directus Flow → `revalidateTag` webhook; preview route | Authoring UX, Preserve 73 rows, Zod contract, Reversible cutover | ⏳ planned | — | 2 |
| g | DNS Cutover + Parallel-Run + Payload Sunset — add `cms-legacy.yesid.dev`; flip `cms.yesid.dev` to Directus; 2-week escrow; archive Payload to `payload-archive` branch + delete legacy DNS | Reversible cutover | ⏳ planned | — | 1 |

<!-- Single letters (a, b, c, d, e, f, g). Design-polish items originally planned as 18g (VOCAB labels) + 18h (SVG palette picker) deferred post-launch per 2026-04-22 direction; letter g reassigned to DNS cutover. -->

## Session layout

> Rough outline of how the slice breaks into wall-clock sessions. Updated as reality diverges.

- **Session 1 — 18a Implementation (2026-04-21):** Payload CMS infra; PR #29 merged. [pre-pivot]
- **Session 2 — 18b Implementation (2026-04-21):** 73-row seed + page globals; PR #30 merged. [pre-pivot]
- **Sessions 3–4 — Research slice `slice-headless-cms-best-practices` (2026-04-22):** 6 parallel agents, decision brief, Directus pivot. PR #31 merged.
- **Session 5 — slice-cloud-ii workflow extraction + yesid.dev partition (2026-04-22):** workflow plugin extraction, docs/project + docs/reference split, Level-1 bundle retrofit prep. PR #32 merged.
- **Session 6 — Slice 18 bundle retrofit (this session):** scaffold slice-18 Level-1 bundle (plan.md + devlog.md). PR (this one).
- **Sessions 7+ — Sub-slice 18c:** Directus research + rebuild spec on `feature/slice-18c-directus-research`.
- **Subsequent sessions (18d–18g):** scorched-earth rebuild → content migration → frontend rewire → DNS cutover.

## Success criteria (slice-level)

> What makes this slice "done" beyond its sub-slices' PRs individually merging.

- [ ] All planned sub-slices (18c, 18d, 18e, 18f, 18g) closed and merged; 18a + 18b already merged and marked HISTORICAL.
- [ ] `yesid.dev-cms` repo running Directus 11+ at `cms.yesid.dev`; Payload code fully scorched from repo (archived to `payload-archive` branch).
- [ ] All 73 production rows present in Directus; i18n reshape (en/fr/es) verified via round-trip test; zero data loss.
- [ ] Every service in `yesid.dev/src/lib/services/*.service.ts` reads from `@directus/sdk` with Zod validation intact.
- [ ] Slice 16 E2E suite green on main with all sub-slice PRs merged — every existing route renders identically to pre-migration.
- [ ] Directus Flow → `yesid.dev/api/revalidate` webhook end-to-end; preview route serves draft content via `@directus/visual-editing`.
- [ ] DNS cutover complete; `cms-legacy.yesid.dev` escrow closed after 2 weeks; legacy DNS + Vercel Payload deployment deleted.
- [ ] Directus MCP configured; Claude Code `mcp__yesid-cms-prod__*` tools re-pointed at the new endpoint.
- [ ] `docs/project/ARCHITECTURE.md` + `docs/project/PATTERNS.md` updated with Directus topology + SDK-over-Zod service pattern.
- [ ] Governance docs updated per AGENTS.md § Slice Closing (`docs/project/STACK.md`, `docs/project/SERVICES.md`, `docs/project/VOCAB.md`).
- [ ] Project-plan slice index (`docs/plan.md`) updated to reflect 18a–18g closure.

## Validation to run

> Acceptance gates for the slice as a whole (sub-slice-level gates live in each `<letter>/plan.md`).

- `bun run test` green on main after 18g merge.
- `bun run test:e2e` green — Slice 16 E2E suite, every route renders identically to pre-migration.
- `bun run lint` + `bun run check` clean.
- Lighthouse against `yesid.dev` within budget (parity with pre-migration baseline).
- Publish-webhook round-trip: edit in Directus → Flow fires → `yesid.dev` revalidates → route shows new content within cache TTL.
- Integrity test: spot-check 10 migrated rows (3 collections + 3 singletons + 4 translations) match Payload source.
- Cost check: Neon usage ≤ free tier; Directus host bill ≤ €5/mo (self-host) or $15/mo (Cloud).

## Risks (cross-cutting)

- **R1. i18n reshape misfires.** Condition: Directus `_translations` junction tables multiply row count ~3× and rewrite field access patterns — easy to drop a locale or miswire fallback. Impact: user-visible locale bugs on migrated pages. Mitigation: Zod schemas enforce the new shape at the adapter boundary (Slice 17c invariant); integrity test compares Payload source rows to Directus output per locale. Revisit: after 18e migration, before 18f rewire.
- **R2. Zod schema rewrite size exceeded.** Condition: Payload's flat `localized: true` fields vs Directus Translations junction = ~40–60% schema rewrite. Impact: 18f takes 2× expected sessions; drift between schema and response shape allows silent breaks. Mitigation: `directus-sdk-typegen` for generated types; Zod schema mirrors the generated TS field-for-field with bidirectional drift detector. Revisit: mid-18f, after first service migration.
- **R3. DNS cutover rollback race.** Condition: DNS TTL + CDN cache windows mean a bad flip keeps serving stale Directus for up to 24h. Impact: downtime or half-broken content. Mitigation: `cms-legacy.yesid.dev` CNAME stays live 2 weeks; frontend can be feature-flagged back to Payload endpoint per-service if needed. Revisit: during 18g cutover window.
- **R4. Hosting choice drag.** Condition: Railway vs Hetzner vs Directus Cloud unresolved blocks 18d rebuild start. Impact: 18c research over-runs, delays 18d/18e/18f. Mitigation: 18c has explicit deliverable of a hosting decision + FORMULA; no rebuild work begins until 18c closes. Revisit: end of 18c session.
- **R5. Mid-migration image URL breakage.** Condition: Payload media served from Vercel Blob; Directus Files may relocate binaries. Impact: broken `<img>` references on migrated rows. Mitigation: 18e includes URL-rewrite pass + round-trip verification; storage decision (Blob vs R2 vs Directus Files) finalized in 18c. Revisit: during 18e content migration.

## Decisions log (parent-level)

> Slice-wide design decisions. Sub-slice-scoped decisions live in each `<letter>/spec.md` § Design decisions and reference parent decisions as `parent D<N>`. Full rationale for the pivot lives in [`docs/slices/slice-headless-cms-best-practices/decision-brief.md`](../slice-headless-cms-best-practices/decision-brief.md) — this log summarizes only; don't re-derive.

### D1 — CMS platform: Directus 11+ over Payload 3

- **Chosen:** Directus 11+ (via scorched-earth rebuild on existing `yesid.dev-cms` repo).
- **Alternatives considered:** Stay on Payload 3 with 22-item FORMULA defensive customization; prototype both for 2–3 days before deciding; hybrid (yesid.dev on Payload, new clients on Directus).
- **Why this won:** Research slice `slice-headless-cms-best-practices` produced 6-agent analysis. Key factors: Directus 23/25 vs Payload 14/25 on 5-task admin UX test; 8/8 editor differentiators (iPad admin, revisions default-on, "Used In" media lookup, global search, presence indicator, in-app help, activity feed, keyboard shortcuts); 7 official SvelteKit tutorials vs 1 archived Payload community starter; MCP parity (Directus native v11.13 vs Payload plugin); commercial trajectory 7.5/10 (independent, VC-funded, growing) vs Payload 5/10 (Figma-acquired, Cloud paused).
- **Tradeoff:** 18–22 day migration cost; Payload's block-composition UX 2.5× faster per editor task; TypeScript DX degrades (community type-gen vs first-party); Lexical→WYSIWYG content reshape; Vue (not React) for custom admin extensions.
- **Affects:** all remaining sub-slices (c, d, e, f, g).
- **Source:** [`decision-brief.md § Final Scorecard`](../slice-headless-cms-best-practices/decision-brief.md) + [`decision-brief.md § My integrated recommendation`](../slice-headless-cms-best-practices/decision-brief.md).

### D2 — Scorched-earth rebuild on the same `yesid.dev-cms` repo

- **Chosen:** Delete Payload code (collections, globals, config, migrations, seed scripts) from `yesid.dev-cms`; rebuild as Directus in the same repo.
- **Alternatives considered:** New `yesid.dev-directus` repo with Payload code archived.
- **Why this won:** Preserves git history for audit; DNS (`cms.yesid.dev`) + Resend sender domain (DKIM/SPF) already configured against this host; single `cms.yesid.dev` URL stays stable across migration; reduces coordination overhead with frontend rewire in 18f.
- **Tradeoff:** Commit history shows an unusual mid-flight rewrite; Payload-era code archived to a `payload-archive` branch (not deleted outright) in 18g for escrow period.
- **Affects:** 18d, 18g.

### D3 — Content migration via export-import, not in-place DB mutation

- **Chosen:** Export 73 rows from Payload (Local API or direct DB query); transform to Directus import format; import via Directus CLI + schema apply.
- **Alternatives considered:** In-place schema mutation on the shared Neon Postgres DB; Directus DB introspection against the existing Payload tables.
- **Why this won:** Directus Translations junction tables are structurally different from Payload's `localized: true` flat fields; clean break is safer than schema-migration-at-ORM-boundary; verifiable round-trip tests easier to write against an import boundary.
- **Tradeoff:** One-shot migration step; must validate row count + i18n coverage end-to-end; slightly longer implementation than in-place mutation would be if it worked.
- **Affects:** 18e.

### D4 — Directus Translations interface replaces Payload `localized: true`

- **Chosen:** Per-collection `_translations` junction tables (en/fr/es) for every localized field, per Directus's canonical i18n pattern.
- **Alternatives considered:** Custom interface mimicking Payload's field-level locale tabs; flat field-per-locale pattern.
- **Why this won:** Native Directus tooling (admin UI, SDK, MCP, export/import) all target the Translations pattern; deviating means losing ecosystem support; normalized data shape is cleaner for future queries.
- **Tradeoff:** ~3× row count for localized fields (73 rows × en/fr/es × localized-field-count ≈ 200–450 translation rows); Zod schemas in `src/lib/schemas/` need a ~40–60% rewrite to mirror the new shape.
- **Affects:** 18e, 18f.

### D5 — DNS cutover with 2-week escrow

- **Chosen:** Add `cms-legacy.yesid.dev` CNAME → Vercel Payload (escrow); flip `cms.yesid.dev` → new Directus host; maintain both for 2 weeks; then archive Payload code to `payload-archive` branch and delete legacy DNS.
- **Alternatives considered:** Immediate DNS flip + Payload deletion; permanent `cms-legacy.yesid.dev` keep-alive.
- **Why this won:** 2-week window catches content-integrity issues that only surface under live editor use; reversible via DNS TTL (~1 day rollback); forces explicit sunset rather than indefinite drift.
- **Tradeoff:** Two DNS records + two deployments live for 2 weeks; ops overhead during escrow.
- **Affects:** 18g.

### D6 — Hosting + storage choice deferred to 18c research

- **Chosen:** Hosting (Railway / Hetzner / Directus Cloud) and media storage (Vercel Blob / Cloudflare R2 / Directus Files) finalized inside sub-slice 18c as part of the research deliverable; not pre-committed in this plan.
- **Alternatives considered:** Pre-commit in this plan to Railway + Vercel Blob (lowest-change option).
- **Why this won:** Cost + operational fit across three options requires audit + comparison against Directus-specific constraints; pre-committing would bias the research; 18c explicitly has this as a deliverable.
- **Tradeoff:** 18d rebuild work cannot start until 18c closes with a hosting + storage decision.
- **Affects:** 18c (produces the decision), 18d (consumes it), 18e (storage choice affects media migration).

## Amendments log

| # | Date       | Change                                                                 | Rationale                                                                                                                        |
|---|------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| 1 | 2026-04-22 | PIVOT: stack changed from Payload 3 to Directus 11+ mid-slice          | Research slice `slice-headless-cms-best-practices` decision brief; see D1 above                                                  |
| 2 | 2026-04-22 | Retrofit Level-1 bundle (this plan + devlog.md)                        | D19 requires every Level-1 slice to carry its own plan + devlog; 18a + 18b shipped without one because PR #29/#30 predated D19   |
| 3 | 2026-04-22 | Sub-slices 18g (VOCAB labels) + 18h (SVG palette picker) deferred      | Design locked per 2026-04-22 direction; letter g reassigned to DNS cutover                                                        |

## Notes

**Related slices:**
- [`slice-headless-cms-best-practices`](../slice-headless-cms-best-practices/) — research slice that produced the Directus pivot decision. Source of truth for D1 rationale.
- [`slice-17`](../slice-17/) — established the Zod-at-the-adapter-boundary invariant that 18f must preserve.
- [`slice-16`](../slice-16/) — established the E2E suite that Slice 18 must keep green.
- [`slice-cloud-ii`](../slice-cloud-ii/) — workflow-extraction slice that produced the Level-1 bundle retrofit requirement (D19) and the `docs/project` + `docs/reference` partition this plan assumes.

**Cross-repo:** [`yesid.dev-cms`](https://github.com/mgkdante/yesid.dev-cms) is the CMS-side repo. Sub-slices 18d–18g each have a companion commit sequence there.

**Retrofit context:** This plan + [devlog.md](devlog.md) are being added to an already-in-flight parent slice. Sub-slices 18a + 18b shipped on 2026-04-21 before the Level-1 bundle convention (D19) was established. This plan captures the slice shape retroactively; historical sub-slice PRs remain the canonical implementation record for 18a + 18b.
