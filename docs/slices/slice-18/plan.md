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

Full task state lives in TodoWrite + the handoff per-task sections. This table is orientational — tasks expand into full spec/plan blocks before execution. **Scope corrected at Task 2b (2026-04-23)**: Tasks 5–7 shipped services as proof-of-pattern, not the full slice. Remaining five content types (projects, blog, tech-stack, meta, site-chrome via M2A pages) land as Tasks 10–14 per the CMS-native re-plan in research.md § Topic 10.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0 | Scaffold slice-18 bundle | ✅ shipped | yesid.dev `e918736`; 4-file flat bundle. |
| 1 | Remove Payload from yesid.dev-cms + clean slate | ✅ shipped | yesid.dev-cms PRs #1 (`a7a1db6`) + #2 (`0295dd6`). Final state: 4 tracked files. |
| 2 | Directus infra research (hosting, storage, schema, locales) | ✅ shipped | Resolved spec D1/D2/D3 + Q4–Q7. Zero site code changes. |
| 3 | Directus install on Railway + Neon + R2 + native MCP | ✅ shipped | Live at `cms.yesid.dev`. yesid.dev-cms PR #3. |
| 4 | DirectusAdapter scaffold + `services` port impl + scorched-earth Neon cleanup | ✅ shipped | yesid.dev `427ad19`. Seam NOT flipped (per plan). |
| 5 | `services` collection schema in Directus | ✅ shipped | yesid.dev-cms PR #5 merged (`13aaeb9`). |
| 6 | Seed `services` content + schema hotfixes | ✅ shipped | yesid.dev `7222c92`; yesid.dev-cms PR #6 merged (`4963c94`). |
| 7 | Flip `services` port to Directus (hybrid adapter) | ✅ shipped | yesid.dev `a373bf5`. Port-by-port pattern; services live from cms.yesid.dev; other 5 ports still static. |
| **2b** | **CMS-native research + two-repo decoupling re-plan** | **✅ shipped** | **This task.** Research on Topics 1–10 via 3 parallel agents. Locked D4–D12; revised Q5; resolved Q8–Q12. Revised task list below (Tasks 8–15). Zero code changes. |
| 8 | Two-repo decoupling + minimal toolchain on yesid.dev-cms | planned | Re-init `package.json` with `@directus/sdk` + `zod` + `bun-types`; migrate `seed-directus-services.ts` → yesid.dev-cms/`scripts/seed-services.ts`; document rotation policy; cross-repo contract test scaffold. |
| 9 | Asset pipeline migration (`static/images/*` → Directus + R2) | planned | Bulk-upload via SDK; 5 folders (services/blog/projects/brand/og); 4 saved presets; `assets-id-map.json` committed. No adapter work. |
| 10 | Projects content type (schema + seed + adapter + flip) | planned | `projects` + translations + M2M junction replacing CSV `Service.related_projects`; `hero_image` M2O to `directus_files`; Content Versioning enabled. |
| 11 | Blog content type (schema + seed + adapter + flip) | planned | `blog_posts` + translations; Markdown body field (preserves `marked.parse` pipeline); SVG illustrations as `directus_files`. |
| 12 | Tech-stack content types (schema + seed + adapter + flip) | planned | `tech_stack` + `tech_relations` + `stack_scenarios` + translations; `body_markdown` replaces per-item `src/content/stack/{id}.md`; graph utilities intact. |
| 13 | Meta + route SEO (schema + seed + adapter + flip) | planned | `site_meta` singleton + `route_seo` collection + translations + `og_image` M2O; closed-registry contract preserved. |
| 14 | Site-chrome via M2A pages (schema + seed + adapter + flip) | planned | `pages` collection with M2A `blocks` + 12+ block collections + `nav_links`/`menu_items`/`error_pages` singletons. Adapter flattens per-request to preserve `ContentPort` surface; zero consumer-side component change. Largest remaining task. |
| 15 | Slice close (role/policy tighten + optional Flow revalidation + peer review + PR + memories) | planned | Tighten ai-editor per D10; enable collaborative-editing env vars; wire Flow-based revalidation or defer; Codex adversarial peer review; open+merge feature/slice-18 PR; update memories; retire Vercel project on cms repo. |

## Session layout

- **Session 1 — Planning + scorch (Tasks 0 + 1).** Shipped 2026-04-22.
- **Session 2 — Task 2 (infra research).** Shipped 2026-04-22.
- **Session 3 — Task 3 (Directus install + MCP).** Shipped 2026-04-23 overnight.
- **Session 4 — Tasks 4–7 (services proof-of-pattern).** Shipped 2026-04-23.
- **Session 5 — Task 2b (CMS-native re-plan).** This session. Zero code changes.
- **Sessions 6+ — Tasks 8–15 (remaining migration).** Each task = one owner-approved STOP point. Estimated 5–7 sessions; Tasks 10–13 parallelizable after Task 9.

Divergence from this shape gets logged in § Amendments.

## Success criteria (slice-level)

- [ ] yesid.dev reads every content type via `DirectusAdapter` on `main` — all 6 ports flipped (`services`, `projects`, `blog`, `techStack`, `meta`, `content`). `staticAdapter` retained as dev-only fallback per Q4; deletion scheduled Slice 19+.
- [x] yesid-dev-cms runs Directus 11.17.3, zero Payload code / deps remaining.
- [x] `cms.yesid.dev` serves Directus admin + content API with TLS + DKIM/SPF preserved.
- [ ] Full test / lint / typecheck green on yesid.dev `main` after every task merge.
- [ ] All 6 content types (services + projects + blog + tech-stack + meta + site-chrome) land in Directus via their CMS-native shape per D5–D12 (versioning enabled, M2A pages, Translations, folder-scoped assets).
- [ ] yesid.dev-cms has its own minimal `package.json` + `scripts/seed-*.ts` + schema-apply CI; the two repos ship independently per D12.
- [ ] Cross-repo contract test green on yesid.dev PRs touching the adapter.
- [ ] Role/policy matrix tightened per D10 before slice close (9 capability policies; ai-editor scoped; Public folder-filtered).
- [ ] `project_slice_18.md` memory updated to shipped state; `project_completed_slices.md` row added post-merge.
- [ ] Cross-tool peer review (Codex) clean per `feedback_codex_review_at_slice_close.md`.

## Risks (cross-cutting)

- **R1.** ~~Directus hosting decision is open.~~ **Resolved 2026-04-22 (Task 2):** Railway Hobby + BYO Neon (spec D1).
- **R2.** ~~73-row seed migration Payload-Postgres → Directus.~~ **Reframed 2026-04-22:** the prior slice-18 work scorched Payload data before it ever fed the site; the 73 rows are gone and recreating them from yesid.dev's TS/MD source is the plan (research.md § Seed migration path). No production data loss possible. Revisit: Task 6 (seed script from source modules).
- **R3.** Domain + DKIM handoff during Directus install. Impact: email sending breaks. Mitigation: no DNS changes until Directus serves HTTPS on `cms.yesid.dev`. Revisit: Task 3.
- **R4.** Custom-extension temptation. Impact: Directus maintenance burden + platform-builtins violation. Mitigation: enforce `feedback_prefer_platform_builtins.md` at every D-entry. Task 2 audit (research.md § Built-in features vs custom extensions) confirms zero custom extensions required for Slice 18. Revisit: every design decision.
- **R5.** Directus 12 license revision. Impact: BSL 1.1 terms may change in Directus 12 (announced today 2026-04-22 on directus.io/blog). Mitigation: pin to `directus/directus:11.17.3` at Task 3 — buys a known BSL 3-year window. Revisit: before any upgrade to v12.
- **R6.** Vercel Blob storage had no Directus driver despite earlier assumption. Impact: avoided — decision flipped to R2 at Task 2. Closed.
- **R7.** Scope expanded mid-slice (Task 2b). Impact: Slice 18 now spans ~12–15 sessions instead of 6–8; risk that owner fatigue or context-window drift weakens later tasks. Mitigation: (a) Tasks 10–13 are parallelizable after Task 9, so batch-friendly; (b) each task ships its own yesid.dev-cms PR + yesid.dev PR per D12, keeping diffs reviewable; (c) Flow revalidation (Task 15) is explicitly optional within Slice 18 — defer to follow-up slice if timing slips. Revisit: end of Task 9.
- **R8.** Cross-repo coordination overhead. Impact: every schema-touching task now requires two PRs (yesid.dev-cms + yesid.dev) with a mandated merge order. Risk of stalled PRs or mid-sync breakage. Mitigation: (a) cross-repo contract test scaffolded in Task 8; (b) yesid.dev-cms prod apply gated via `workflow_dispatch` — schema lands in prod before the consumer PR merges; (c) documented three-point contract-change rule in D12. Revisit: end of Task 10 (first post-decoupling cross-repo task).

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
| 3 | 2026-04-23 | Tasks 4–7 shipped as services proof-of-pattern (not full slice). Mid-slice scope correction: Slice 18 = full migration + two-repo decoupling. Task 2b research pass inserted. Revised task list (Tasks 8–15). | Owner flagged mid-slice that Tasks 5–7 shipped services as a TS-mirror (hardcoded-content replacer), not a proper CMS deployment. Task 2b researched CMS-native patterns (visual editing, versioning, M2A, Flows, asset pipeline, role/policy, extensions, repo separation) via 3 parallel agents — 10 topics. Spec now has D4–D12 locked; Q5 revised; Q8–Q12 resolved. Remaining 5 content types (projects, blog, tech-stack, meta, site-chrome) re-planned as CMS-native collections leveraging M2A pages + Content Versioning + Translations. Tasks 8–15 sequence Tasks 10–13 as parallelizable after Task 9 (assets). No code changes in Task 2b; research + docs only. |

## Notes

- Research slice reference: `docs/slices/slice-headless-cms-best-practices/` (12-heuristic + 22-item FORMULA; PR #31 merged 2026-04-22).
- Adapter seam: `src/lib/adapters/index.ts:6` — the single line that flips per-adapter.
- yesid-dev-cms location: `C:/Users/otalo/Yesito/Projects/yesid-dev-cms` (sibling repo; hyphen, not dot).
