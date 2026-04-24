# slice-18 — Handoff

> Single-level slice. This handoff IS the PR body when the slice closes. Self-appending: per-task sections accumulate below as work lands. Don't rewrite prior entries.

## 1) Status

| Field | Value |
|-------|-------|
| Status | 🟡 in progress (Tasks 0–7 + 2b + 8 shipped; Tasks 9–15 remaining per revised CMS-native plan; two-repo decoupling + test-suite split now formalized) |
| Slice PR (site) | pending — [`feature/slice-18`](https://github.com/mgkdante/yesid.dev/tree/feature/slice-18) (keep accumulating sessions before opening; likely opens at slice close) |
| Scorch PR (cms)      | [mgkdante/yesid.dev-cms#1](https://github.com/mgkdante/yesid.dev-cms/pull/1) — **MERGED** as `a7a1db6` |
| Clean-slate PR (cms) | [mgkdante/yesid.dev-cms#2](https://github.com/mgkdante/yesid.dev-cms/pull/2) — **MERGED** as `0295dd6` |
| Spec | [./spec.md](spec.md) |
| Plan | [./plan.md](plan.md) |
| Research | [./research.md](research.md) |
| Branch (site) | `feature/slice-18` (yesid.dev) — head `a373bf5` (Task 7 close) |
| Branch (cms)  | PR #1 branch `chore/remove-payload`: `0effef9` + `803d60c` → merged `a7a1db6`. PR #2 branch `chore/clean-slate`: `f3a94df` → merged `0295dd6`. PR #3 branch (Task 3): `5945f56` (scaffold) + `d22669c` (snapshot+CI). |
| Neon safety branch | `br-muddy-surf-am5n6sh9` (`pre-scorch-safety-2026-04-23`, off `br-orange-waterfall-amfej6qp`) — created Task 4 session before the scorched-earth DROP; retain until Task 7 E2E green. |
| Tasks completed | 10 / 16 (Task 0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 2b + 8) — Task 8 (this session) migrated the seed script to yesid.dev-cms, added a minimal bun-based CMS toolchain (@directus/sdk + zod + yaml + bun-types), established the test-suite split (CMS tests: fixture-validate + seed-dry-run + snapshot-shape; consumer tests: contract + env-gated integration), and wired mirrored cross-repo contract-test workflows. yesid.dev-cms PR #7 opened; yesid.dev commit on feature/slice-18. |
| yesid.dev-cms PR #7 | [task-8-decoupling](https://github.com/mgkdante/yesid.dev-cms/pull/7) — **MERGED** as `8293eec` (2026-04-24 01:50 UTC). Schema-apply smoke + new `bun test` step green on merge. No schema mutations. |
| Live Directus | https://cms.yesid.dev/mcp ✓ Connected (MCP registered as `yesid-cms-prod`) — schema tool returns `collections: []` after cleanup |
| MCP endpoint | https://cms.yesid.dev/mcp — 7 tools (items/files/folders/assets/trigger-flow/schema/system-prompt) |

## 2) Scope (from spec)

**Goal:** Ship a Directus-backed content layer for yesid.dev. See [./spec.md § Goal](spec.md).

**Acceptance criteria:** see [./spec.md § Acceptance criteria](spec.md).

## 3) Tasks completed

---

### Task 0 — Scaffold slice-18 bundle ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Session:** 2026-04-22
- **Commit(s):** `e918736` — docs(slice-18): open slice — flat 4-file bundle (plan/spec/research/handoff)

**Files:**

- Created: `docs/slices/slice-18/plan.md` — slice-level plan (scope, constraints, task roadmap, D1–D3)
- Created: `docs/slices/slice-18/spec.md` — slice spec (goal, D-stubs for Task 2, acceptance criteria)
- Created: `docs/slices/slice-18/research.md` — Task 2 findings landing pad
- Created: `docs/slices/slice-18/handoff.md` — this file

**What landed:**

Fresh flat single-level bundle for slice-18 after PR #35 scorch. Four files, zero subdirectories. Plan + spec lock the non-negotiables (no Payload, Directus target, adapter-seam swap, no sub-slice nesting); research.md and spec D-entries reserve space for Task 2 findings without front-running them.

**Decisions:**

- D1 (plan) — Directus over Payload (pivot lock from PR #31).
- D2 (plan) — Scorch-not-archive for Payload removal (hard cutover).
- D3 (plan) — Single-level flat bundle.

**Tests / verification:**

- `ls docs/slices/slice-18/` → 4 files (plan.md + spec.md + research.md + handoff.md), 0 subdirectories ✅
- Plan/spec/research stubs deliberately leave D-entries + research sections as TBD for Task 2.

---

### Task 1 — Remove Payload from yesid.dev-cms + clean slate ✅

Landed as **two sequential PRs** (per owner steering mid-session: after PR #1 merged, owner asked for a true start-from-scratch state, so PR #2 deleted the remaining transition scaffolding).

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Session:** 2026-04-22
- **PRs** (separate repo — `yesid.dev-cms`, NOT `yesid.dev`):
  - **[#1](https://github.com/mgkdante/yesid.dev-cms/pull/1)** — scorch Payload. Commits `0effef9` (scorch; 56 files · 152 insertions · 20,282 deletions) + `803d60c` (`vercel.json` with `ignoreCommand: exit 0` to calm Vercel after it kept trying to build the removed Next shell). Merged as `a7a1db6`.
  - **[#2](https://github.com/mgkdante/yesid.dev-cms/pull/2)** — clean slate. Commit `f3a94df` (15 files · 23 insertions · 545 deletions). Merged as `0295dd6`. Deletes `.env.example`, `.prettierrc.json`, `.vscode/`, `AGENTS.md`, `CLAUDE.md`, `CODEX-CONTEXT.md`, `bun.lock`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `tsconfig.json`. Rewrites `.gitignore` + `README.md`. Final tracked file list: `.gitignore`, `.nvmrc`, `README.md`, `vercel.json`. That's it.

**Files deleted (yesid.dev-cms):**

- `src/collections/` (7 files), `src/globals/` (10 files), `src/access/isAdmin.ts`
- `src/app/(payload)/` — entire Next.js route group (admin UI + GraphQL + REST + layout + custom.scss)
- `src/payload.config.ts`, `src/payload-types.ts`
- `migrations/` (4 migration files + index)
- `scripts/seed/` (entire seed scaffold), `scripts/auto-migrate-create.mjs`

**Files modified (yesid.dev-cms):**

- `package.json`: removed all `@payloadcms/*`, `payload`, `next`, `react`, `react-dom`, `sharp`, `graphql`, `gray-matter`, `tsx`, `eslint-config-next`, `@types/react(-dom)`. Dropped Payload-era scripts (`build`, `dev`, `devsafe`, `generate:*`, `migrate*`, `payload`, `start`, `seed:*`). Minimal shell retained: `cross-env`, `dotenv`, `eslint`, `prettier`, `typescript`, `@types/node`.
- `bun.lock`: regenerated (18 removed, 3 installed; no orphans).
- `next.config.ts`: stripped `withPayload` wrapper + `/api/media` local patterns. Placeholder `export default {}` until Task 3.
- `eslint.config.mjs`: removed `src/payload-types.ts` / `src/payload-generated-schema.ts` from ignores; minimal flat config.
- `tsconfig.json`: removed `@payload-config` path alias + `next` plugin.
- `README.md`, `AGENTS.md`, `CODEX-CONTEXT.md`, `CLAUDE.md`: rewritten as scorched placeholders pointing at `yesid.dev/docs/slices/slice-18`.
- `vercel.json`: new, minimal (`ignoreCommand: exit 0`) — prevents Vercel from re-trying the Next.js build of the empty shell.

**What landed:**

- **PR #1 (merged).** Scorched the Payload 3.x surface: `src/collections/`, `src/globals/`, `src/access/`, `src/app/(payload)/` route group, `payload.config.ts`, `payload-types.ts`, `migrations/`, `scripts/seed/`, `scripts/auto-migrate-create.mjs`. Removed every `@payloadcms/*` package plus `payload`, `next`, `react`, `react-dom`, `sharp`, `graphql`, `gray-matter`, `tsx`, `eslint-config-next`, `@types/react(-dom)`. Dropped Payload-era scripts. Kept a minimal shell (`cross-env`, `dotenv`, `eslint`, `prettier`, `typescript`). Added `vercel.json` to stop Vercel's retries.
- **PR #2 (open).** Clean-slate pass: deleted the minimal shell entirely. No more `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.env.example`, `.prettierrc.json`, `.vscode/`, `AGENTS.md`, `CLAUDE.md`, `CODEX-CONTEXT.md`, `bun.lock`. Repo is now **four tracked files**: `.gitignore` (minimal generic), `.nvmrc` (Node 22), `README.md` (one-paragraph pointer at slice-18), `vercel.json` (ignore guard). `.git/` history preserved as the audit trail.

yesid.dev is untouched (Payload was never wired to the site via the adapter seam). The `yesid.dev-cms` repo starts Task 3 from a genuine blank state — no Next-shaped leftovers to anchor decisions.

**Decisions:**

- Follows plan D2 (scorch-not-archive). No `payload-archive` branch. No `cms-legacy.yesid.dev` DNS record.
- **Vercel deploys disabled via `vercel.json`** — PR #1's initial commit broke Vercel's auto-build (Vercel had a cached Next.js detection and tried `bun run build`, which we removed). Surface was a red X on PR #1 that owner read as "conflicts". Adding `ignoreCommand: exit 0` kept the PR cleanly green and aligned with plan D2's accepted admin-downtime window. Task 3 will replace this config (or retire the Vercel project entirely if D1 picks a non-Vercel host).
- **Two-PR split instead of one** — owner asked for a true start-from-scratch state post-PR-#1 merge. Rather than amending #1, the clean-slate work landed as a separate PR #2. Benefit: commit history has a clear sequence (scorch Payload → clean slate), and the diffs are readable individually.

**Accepted downtime:**

- `cms.yesid.dev` admin returns no service between this PR merge and Directus install (Task 3). **Admin downtime only** — the public yesid.dev site reads from `staticAdapter` and is unaffected.

**Reviews:**

- Spec adherence: ✅ — matches plan D2 and spec § Architecture (yesid.dev-cms rebuild).
- Git state: ✅ `MERGEABLE`, no file conflicts, branch ahead of `origin/main` by 2 commits.
- Vercel CI: green after the `803d60c` follow-up (build intentionally skipped during scorch window).

**Tests / verification (yesid.dev — must stay green):**

- `grep -rn "@payloadcms" src/ package.json` → **0 matches** ✅
- `grep -rn "@payloadcms\|payloadcms"` in yesid.dev-cms tree (PR #1 state; PR #2 strips it further) → **0 matches** ✅
- `bun run check` on yesid.dev → **0 errors**, 20 warnings (all pre-existing — unused CSS selectors, `$state` hints; unrelated to slice-18). 4,043 files checked.
- `bun run test` on yesid.dev → **95 test files · 968 tests passed** ✅ (transient happy-dom teardown noise re: port 3000 is unrelated; tests completed before teardown).
- `bun run lint` → n/a (no `lint` script on yesid.dev; svelte-check coverage is under `bun run check`).
- `bun install` in yesid.dev-cms (post-PR-#1) → **`Saved lockfile` · 3 packages installed · Removed: 18** ✅ (PR #2 removes `bun.lock` entirely — no package.json means no lockfile).
- Post-PR-#2 tracked file count in yesid.dev-cms → **4** (`.gitignore`, `.nvmrc`, `README.md`, `vercel.json`).

**Follow-ups flagged:**

- Stale Payload comment at `src/lib/adapters/index.ts:2` ("Slice 18 (Payload CMS) is expected…") — replace with a Directus-targeted comment in Task 4 when `DirectusAdapter` wires in.
- Task 2 research gate: do not proceed to Directus install (Task 3) until D1/D2/D3 resolved.
- Vercel integration posture: after Task 2 resolves D1 (hosting), decide whether to keep the Vercel project on yesid.dev-cms or retire it. If Directus lives on Railway/Fly/etc., the Vercel project becomes useless and should be deleted.

---

### Task 3 — Directus production deploy on Railway + Neon + R2 + native MCP ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high) — via MCPs (Cloudflare, Railway, Neon, Vercel, 1Password CLI)
- **Session:** 2026-04-22 → 04-23 (overnight)
- **PR:** [yesid.dev-cms#3](https://github.com/mgkdante/yesid.dev-cms/pull/3) (Task 3a scaffold + Task 3c snapshot + CI in one PR)
- **Commit(s):**
  - `5945f56` — chore(slice-18 task-3a): scaffold Directus provisioning (.env.example + infra/directus/ + README walkthrough)
  - `d22669c` — chore(slice-18 task-3c): initial Directus schema snapshot + CI apply workflow

**Out-of-band ops the user did (Task 3b dashboard work):**
- Created Cloudflare R2 bucket `yesid-dev-cms` at `https://eccfb9bedd87d413eaf4cac6ae2285d3.r2.cloudflarestorage.com`
- Generated R2 API token (Object Read+Write scoped to bucket) — Access Key + Secret pasted via screenshot
- Deployed the official Railway Directus CMS template (services: Directus CMS, Redis, PostGIS — PostGIS now unused; Neon is canonical)

**Autonomous ops (driven via MCPs from this session):**
- **Cloudflare MCP:** verified R2 bucket existence at active account `eccfb9bedd87d413eaf4cac6ae2285d3`
- **Neon MCP:** fetched pooled connection string for project `sparkling-sky-51665073` (database `neondb`, role `neondb_owner`, branch `br-orange-waterfall-amfej6qp`); ran `DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO neondb_owner` to clean-slate (per owner steering "clean up neon db and rebuild")
- **Railway CLI:** linked workspace `C:/Users/otalo/Yesito/Projects/yesid-dev-cms` to project `6da31832-268c-4c26-a7f6-3fc09ebf943f` env `production`; replaced template defaults with our config — DB swapped from Railway PostGIS to Neon, storage swapped from template Tigris to Cloudflare R2 (built-in `s3` driver), CORS opened for yesid.dev + Vercel previews + localhost, MCP enabled, KEY/admin email rotated; deleted `DIRECTUS_TEMPLATE` + `EXTENSIONS_LOCATION` env vars to prevent the CMS template's 24 demo collections from re-applying on the clean Neon DB
- **Directus REST API:** PATCHed `/users/me` to rename admin (`example@email.com` → private-contact-07@example.invalid`); PATCHed `/settings` to enable MCP + set project metadata (name, color, descriptor); created `ai-editor` role + user with hex static API token; smoke-tested file upload roundtrip + MCP `initialize` + `tools/list`
- **1Password CLI:** stored 4 items in vault `yesid-dev` — Directus admin login (`thkyjj4lpbpkvdzm3tbkcltj6u`), R2 S3 credentials (`q6o65zjli46npuv47mykjm7mce`), Cloudflare R2-scoped API token (`lzllqrehh2ql32pbw37iirry2u`), Directus KEY+SECRET (`b5xcxl3wc4y2c3vm5zsvyn7uou`); ai-editor MCP token save **deferred** (op CLI session timed out mid-batch — token saved to `%TEMP%/directus-ai-editor-token.txt` for manual save next session)
- **Vercel MCP:** identified the old yesid-dev-cms Payload-era project at `prj_Joj5MVld6v58XOfDzGWrIF3bo6vj` (team `team_KBKhzsXDEl7lR3zC7r3nhp8h`) — pending retirement after DNS flip

**What landed:**

A live Directus 11.17.3 install running against Neon Postgres (read-write pooled) with Cloudflare R2 file storage, Railway Redis cache, Railway public domain (`directus-cms-production-df43.up.railway.app`), CORS open for yesid.dev, native MCP server enabled with an `ai-editor` role + static token. Initial schema snapshot captured to `infra/directus/snapshot.yaml` (369 bytes — empty user collections, only Directus core indexes). CI workflow at `.github/workflows/schema-apply.yml` validates snapshots on PR via ephemeral Directus container and gates production apply behind a `workflow_dispatch` with required reviewers.

The clean-slate of Neon was a mid-task pivot: the Railway template seeded its "cms" demo content (24 collections like pages/posts/blocks/forms) on the freshly-pointed Neon DB, AND Neon still carried orphan Payload tables from the prior yesid-dev-cms install. Owner asked for a true rebuild — `DROP SCHEMA public CASCADE` + `CREATE SCHEMA public` was the cleanest path. Removing `DIRECTUS_TEMPLATE` env var prevented the template script from re-applying.

The Resend SMTP integration intentionally **deferred**: Railway's egress blocks outbound port 587 to `smtp.resend.com` (CONN ETIMEDOUT in deploy logs). Plan: switch to Resend's HTTPS API via a Directus Flow `webhook` operation in a follow-up task. EMAIL_* env vars stripped from Railway service to unblock health-check (the SMTP timeout was hanging `/server/health`).

**Pipeline diagram (Mermaid — addresses owner's "graph of this pipeline" request):**

```mermaid
flowchart LR
  subgraph Vercel["Vercel (yesid.dev frontend)"]
    SVK["SvelteKit 2 + Svelte 5<br/>Bun runtime"]
    ADP["src/lib/adapters/index.ts<br/>(seam — re-exports adapter)"]
    STAT["staticAdapter<br/>src/lib/content/*.ts"]
    DIR_A["DirectusAdapter<br/>(Task 4 — pending)"]
  end
  subgraph Railway["Railway Hobby (us-east4-eqdc4a)"]
    DCT["Directus 11.17.3<br/>Node 22 · Express<br/>image SHA ae6ab737..."]
    RDS["Redis<br/>(Railway plugin)<br/>cache + sync store"]
    PG["PostGIS<br/>(template-provisioned;<br/>UNUSED — drop)"]
  end
  subgraph CF["Cloudflare (account eccfb9be...)"]
    R2["R2 bucket: yesid-dev-cms<br/>$0 egress · 10 GB free<br/>S3-compat endpoint"]
    DNS["DNS: cms.yesid.dev<br/>(currently → old Vercel; flip pending)"]
  end
  subgraph Neon["Neon Postgres (sparkling-sky-51665073)"]
    PG_NEON["postgres 17 · pooled<br/>ep-broad-lake-amtl585d-pooler<br/>db: neondb · role: neondb_owner<br/>tables: 29 directus_*"]
  end
  subgraph Resend["Resend (DEFERRED)"]
    MAIL["smtp.resend.com:587<br/>blocked by Railway egress<br/>fallback: HTTPS API via Flow"]
  end
  subgraph AI["AI clients"]
    CLAUDE["Claude Code · Cursor · ChatGPT"]
  end

  SVK --> ADP
  ADP -.active.-> STAT
  ADP -.future.-> DIR_A
  DIR_A -. REST/SDK .-> DCT

  DCT -- pg-pooled --> PG_NEON
  DCT -- s3 driver --> R2
  DCT -- cache + ws --> RDS
  DCT -.deferred.-> MAIL
  PG -.unused.-> DCT

  CLAUDE -- "Bearer token<br/>JSON-RPC" --> DCT_MCP[/mcp endpoint<br/>directus-mcp v0.1.0/]
  DCT_MCP --- DCT

  DNS -.flip pending.-> DCT

  classDef pending fill:#eee,stroke:#999,stroke-dasharray: 5 5,color:#666
  classDef deferred fill:#fef0e0,stroke:#c67,color:#933
  classDef live fill:#d4f4d4,stroke:#393,color:#063
  classDef unused fill:#f0d0d0,stroke:#a44,color:#600,stroke-dasharray: 3 3

  class DCT,RDS,R2,PG_NEON,DCT_MCP live
  class DIR_A,DNS pending
  class MAIL deferred
  class PG unused
```

**Decisions (added during execution):**

- Task 3.D-1 — **Drop the Resend SMTP path entirely.** Railway's egress is firewalled to `smtp.resend.com:587` (CONN ETIMEDOUT after 10s). Switch to Resend's HTTPS API (`POST https://api.resend.com/emails`) wired via a Directus Flow with a `webhook` operation in a follow-up. EMAIL_* env vars removed from Railway to unblock health checks.
- Task 3.D-2 — **Clean-slate Neon mid-task** (after the Railway template had already seeded demo CMS data on Neon). Per owner: "clean up neon db and rebuild." `DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO neondb_owner`. Combined with deleting `DIRECTUS_TEMPLATE` env var so the template's bootstrap script doesn't re-apply.
- Task 3.D-3 — **Defer dropping the PostGIS Railway service.** Railway CLI does not expose `service delete`; only the dashboard does. PostGIS now sits unused (~$0 of credit/month at idle). Drop in next session via dashboard click.

**Reviews:**

- Spec adherence: ✅ — D1 (Railway), D2 (R2), D3 (snapshot+apply YAML in Git) all hit. Q4–Q7 plan-level resolutions still hold. Q5 preview + Q6 locale wait for Task 4+. Q7 blog markdown approach kept (no Block Editor).
- Cross-tool adversarial review: deferred to slice close per `feedback_codex_review_at_slice_close.md`.

**Tests / verification:**

- `curl https://directus-cms-production-df43.up.railway.app/server/health` → `{"status":"ok"}` ✅
- Login as private-contact-07@example.invalid / 9i6ls4txdw94j0ynk76cbbb7rulr42lc` → 321-char access token ✅
- Neon `get_database_tables` → 29 tables, ALL `directus_*` (zero user collections) ✅
- File upload: `POST /files` with text payload → returns `{id, storage:"s3", filename_disk, filesize}` ✅
- File roundtrip: `GET /assets/<id>` → exact uploaded bytes ✅
- MCP `initialize`: `{"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{},"prompts":{}},"serverInfo":{"name":"directus-mcp","version":"0.1.0"}}}` ✅
- MCP `tools/list` with `ai-editor` Bearer token → 7 tools (items, files, folders, assets, trigger-flow, schema, system-prompt) ✅
- `infra/directus/snapshot.yaml` captured: 369 bytes, `version: 1`, `directus: 11.17.3`, `vendor: postgres`, empty `collections`/`relations` (expected for fresh install) ✅
- yesid.dev untouched: no `feature/slice-18` source code changes since Task 2 cleanup commit `1535fa5`

**Follow-ups flagged:**

- **Manual dashboard ops (next user touchpoint):**
  - Drop the `PostGIS` Railway service (https://railway.com/project/6da31832-268c-4c26-a7f6-3fc09ebf943f → PostGIS service → Settings → Delete)
  - Add `cms.yesid.dev` as Railway custom domain (Directus CMS service → Settings → Custom Domain → add `cms.yesid.dev` → Railway returns CNAME target)
  - Update Cloudflare DNS for `cms.yesid.dev`: CNAME → Railway target (currently CNAMEs to `b76ed8df3d024b08.vercel-dns-017.com`); set proxy ORANGE-OFF (or ON for the Cloudflare CDN cache benefit — Directus serves correct cache headers)
  - Delete the old Vercel project `prj_Joj5MVld6v58XOfDzGWrIF3bo6vj` once DNS propagates and `https://cms.yesid.dev/server/health` returns 200
- **Resend HTTP API integration** (defer to a follow-up task or a sub-slice of 18): wire a Directus Flow `email-on-event` → `webhook` operation hitting `POST https://api.resend.com/emails` with the API key from 1P (`op://yesid-dev/s7ztvxh5t7qc764644le3w7zhi/credential`). Update `directus_settings` to use Flow as the email transport.
- **Save MCP ai-editor token to 1P** — currently in `%TEMP%/directus-ai-editor-token.txt` (op CLI session timed out mid-create). Run `op signin` then `op item create --category="API Credential" --vault=yesid-dev --title="Directus MCP - ai-editor token" ...` (full command in handoff § 16).
- **Tighten ai-editor permissions** before publishing the MCP for general AI client use — currently the role has the default Directus permissions (which are restrictive but not yet content-collection-scoped). Plan: add a custom policy via `/policies` + `/access` that grants only read+update on yesid.dev content collections (after Task 5 defines them).
- **Pin Railway image to 11.17.3 explicitly** in a `Dockerfile`/`railway.json` override so Railway can't auto-bump (already running on 11.17.3 per template default; lock for deterministic redeploys).

---

### Task 4 — DirectusAdapter scaffold + services port + scorched-earth Neon cleanup ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high) — via Directus MCP + Neon MCP
- **Session:** 2026-04-23
- **Commit(s):** `427ad19` — feat(slice-18 task-4): DirectusAdapter scaffold + services port + toLocalizedString
- **Neon safety branch:** `br-muddy-surf-am5n6sh9` (created off `br-orange-waterfall-amfej6qp` before the scorch; retain until Task 5 lands a real schema)

**Files:**

- Created: `src/lib/adapters/directus.ts` — Directus adapter scaffold (pure `toLocalizedString` helper + `services` port impl + 5 ports throwing TODO errors for Task 5+)
- Created: `src/lib/adapters/directus.test.ts` — 7 unit tests for `toLocalizedString` (empty/missing, EN-only, all-3-locale, fallback locale, empty-string absence, non-string coercion, sibling-field isolation)
- Modified: `.env.example` — documented `PUBLIC_DIRECTUS_URL` (public) + `DIRECTUS_READ_TOKEN` (1P-backed, server-only)
- Modified: `package.json` + `bun.lock` — added `@directus/sdk@20.3.0`
- Out-of-repo (Neon project `sparkling-sky-51665073` — `yesid-dev-cms`):
  - **Dropped all 84 non-`directus_*` public tables** (Payload-legacy schema + `payload_*` infrastructure: `about_content*`, `blog_page*`, `blog_posts*`, `contact_content*`, `error_pages*`, `home_content*`, `media*`, `nav_links*`, `projects*`, `services*`, `site_meta*`, `stack_scenarios*`, `tech_stack*`, `users*`, `payload_*` — full list in § 17 Validation results).
  - Cleared Directus registry of orphan rows (`directus_collections`, `directus_fields`, `directus_relations`, `directus_permissions`, `directus_presets`, `directus_revisions` — all filtered `NOT LIKE 'directus_%'`).
  - Result: MCP `schema` tool now returns only `directus_*` system collections + empty user collection set. Task 5 gets a clean slate.
- Out-of-repo (Directus admin — ai-editor role permissions):
  - Widened `ai-editor` role with **read-only** access to `directus_collections`, `directus_fields`, `directus_relations` (3 rows). Required so the MCP `schema` tool works. Write/delete on `directus_*` remain blocked — the "never edit system collections" rail still holds.

**What landed:**

A fully type-checked Directus adapter scaffold that compiles against the `ContentAdapter` contract but is not yet wired at runtime. `src/lib/adapters/index.ts:7` still re-exports the static adapter — production yesid.dev is unaffected. The `services` port has a real implementation against Directus's native Translations field shape (per Q6 Approach A): `fetchServices()` calls `readItems('services', { fields: ['*', { translations: ['*'] }] })`, and `toService(row)` maps `{ id, station, icon?, svg?, lottie_reverse?, visible?, related_projects?, stack?, translations: [{ languages_code, title, description, ... }] }` → the existing `Service` TS type. `impactMetric`, `deliverables`, and `sections` are intentionally left out of the scaffold mapping — they depend on sub-collections that don't exist yet and will be filled in at Task 5 when the real schema lands in Data Studio.

The client is **lazy-initialized** — `createDirectus(...)` only fires on the first port call, not at module import time. This keeps the unit test env-free: `directus.test.ts` imports `toLocalizedString` directly without triggering `$env/dynamic/*` resolution or the SDK's fetch wiring. `buildClient()` throws a clear error if `PUBLIC_DIRECTUS_URL` or `DIRECTUS_READ_TOKEN` is missing at runtime, so failures surface with a meaningful message the first time a route actually hits the adapter.

**Scorched-earth Neon cleanup (out of Task-4 scope, but executed this session per owner's "remove payload legacy tables or anything you find"):** the Neon DB still carried 84 Payload-shape tables (`_locales` junctions, `_rels` polymorphic M2A, `_texts` FTS indexes, `payload_*` infrastructure). These weren't referenced from any Directus collection — they were orphan tables from the pre-pivot Payload era — but they'd clutter Task 5's schema design and potentially mislead anyone reading the DB. Options considered: (a) narrow — drop only `payload_*` (7 tables); (b) medium — drop payload + `*_locales` that use Payload's `_locale`/`_parent_id` shape; (c) scorched — drop everything non-`directus_*`. Owner chose (c) — matches the yesid-dev-cms repo scorched-earth rebuild (PRs #1 + #2) and gives Task 5 a true greenfield. Safety: a Neon branch `pre-scorch-safety-2026-04-23` (`br-muddy-surf-am5n6sh9`) was created off main before the DROP — Neon's PITR + the branch together provide 24h rollback. After the scorch, Directus MCP `schema` returns a clean `collections: []` + only `directus_*` system entries.

**Decisions (added during execution):**

- Task 4.D-1 — **Lazy-initialize the Directus client.** Module top-level must not call `createDirectus(...)` because vitest imports `directus.ts` in a Node env where `$env/dynamic/public` may resolve to `undefined` for `PUBLIC_DIRECTUS_URL`. Eager init → crashing unit tests. Lazy init (`cachedClient: ... | null` + `client()` accessor) keeps tests env-free and still gives fast path at runtime (cache after first call). Also aligns with SvelteKit's server-side-only usage pattern for adapter code.
- Task 4.D-2 — **Generic-bound signature for `toLocalizedString`**, not `Record<string, unknown>` intersection. Original `type TranslationRow = { languages_code: string } & Record<string, unknown>` caused 6 TS errors because interfaces (`DirectusServiceTranslation`) don't satisfy `Record<string, unknown>` without an explicit index signature. Switched to `<T extends { languages_code: string }>(translations: ReadonlyArray<T>, field: string)` — accepts any typed translation shape directly, narrows the field access via a local `as Record<string, unknown>` cast inside the loop. Zero ergonomic loss at the call site; zero index-signature pollution on the interfaces.
- Task 4.D-3 — **Scorched-earth cleanup of Neon public schema.** All 84 non-`directus_*` tables dropped + Directus registry rows cleaned. Rationale above.
- Task 4.D-4 — **Widen `ai-editor` role read permissions** to include `directus_collections`, `directus_fields`, `directus_relations`. Required for the MCP `schema` tool to work (queries `directus_collections` internally). Write/delete on `directus_*` remain blocked — the safety rail still holds against accidental system-collection mutation from AI clients.
- Task 4.D-5 — **Skip the adapter-seam flip in `src/lib/adapters/index.ts`.** Per plan Task 4 contract — flip lands at Task 7 after Tasks 5–6 define real collections and seed data. Static adapter stays active throughout Task 4.

**Reviews:**

- Spec adherence: ✅ — Q6 (native Translations + adapter-boundary `toLocalizedString` transform) implemented exactly as specified. D1/D2/D3 unaffected (this task is purely yesid.dev-side). Pin to SDK `^20` ✅. No changes to `src/lib/repositories/*`, `src/lib/components/*`, or `src/routes/*` ✅. Static adapter still the active re-export ✅.
- Cross-tool adversarial review: deferred to slice close per `feedback_codex_review_at_slice_close.md`.

**Tests / verification:**

- `bun run check` → **0 errors**, 20 pre-existing warnings ✅ (adapter + test file both compile against strict TypeScript settings)
- `bun run test` → **975 tests passing** (up from 968 in Task 3 — the 7 new `toLocalizedString` tests land cleanly; the pre-existing 968 pass unchanged) ✅
- `directusAdapter: ContentAdapter` type annotation compiles — all 6 ports + their methods satisfy the contract ✅
- Module import is env-free — `directus.test.ts` imports without needing `PUBLIC_DIRECTUS_URL`/`DIRECTUS_READ_TOKEN` set ✅
- Directus MCP `schema` tool round-trip post-cleanup: returns `collections: []` + `directus_*` system only, zero Payload cruft ✅
- Neon SQL verification: `SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'directus_%'` → `0` ✅
- yesid-cms-prod MCP still `✓ Connected` after session (`claude mcp list`) ✅

**Follow-ups flagged:**

- **Task 5 gate** — real Directus collection design in Data Studio. First target: `services` (smallest surface, matches the port implemented here). Once the collection exists with real Translations, re-snapshot → `yesid.dev-cms/infra/directus/snapshot.yaml` → commit in yesid.dev-cms.
- **Fill in the scaffold's TODOs once collections exist** — `impactMetric` (maps to `impact_metric_value` + `impact_metric_label` translation fields), `deliverables` (M2M to `services_deliverables` with per-item translations), `sections` (M2M to `services_sections` with `title` + `content` translations per section), `stack` (simple string array column or M2M to a shared `tech_stack`).
- **Port 5 stub ports** (`projects`, `blog`, `meta`, `techStack`, `content`) — each has its own schema + mapping work, each lands in a subsequent Task 5 sub-step or Task 6.
- **Widened `ai-editor` reads on system collections** — currently has read on `directus_collections/fields/relations` (minimum needed for `schema` MCP tool). Follow-up #7 in § 5 is superseded: the scope is now "after Task 5 lands, add an explicit policy scoping write access to user collections only; keep the 3 system-read grants."
- **Delete the Neon safety branch `br-muddy-surf-am5n6sh9`** once Task 5 produces a real schema + passes Task 7 E2E (≥ 2 weeks post-flip). Free to keep before then — costs $0 on Hobby.

---

### Task 5 — Services collection schema (Directus-native Translations pattern) ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high) — via Directus REST + 1P CLI + Neon MCP (read-only verify)
- **Session:** 2026-04-23 (same session as Task 4)
- **Owner decision:** chose **Path B — programmatic REST** over Path A (Data Studio click-through) for speed + repeatability. Spec D3 still satisfied: the YAML snapshot is the canonical artifact; how it got generated (REST vs GUI) is an implementation detail.
- **PR (yesid.dev-cms):** [mgkdante/yesid.dev-cms#5](https://github.com/mgkdante/yesid.dev-cms/pull/5) — **MERGED as `13aaeb9`** (2026-04-23). Snapshot commit `468f241`; 6 follow-up commits fixed the smoke-apply CI (see § Task 5 CI fixes below).

**Files:**

- Modified (yesid.dev-cms): `infra/directus/snapshot.yaml` — 369 B baseline → 48 KB with 7 user collections + fields + relations (+1,844 lines)
- Out-of-repo (Directus admin, Neon `sparkling-sky-51665073`):
  - Created 7 collections via `POST /collections` (REST): `languages`, `services`, `services_translations`, `services_deliverables`, `services_deliverables_translations`, `services_sections`, `services_sections_translations`
  - Created 6 relations via `POST /relations`: (a) `services_translations.services_id → services.id` with `one_field: "translations"` + `junction_field: "languages_code"`; (b) `services_translations.languages_code → languages.code` with `junction_field: "services_id"`; (c) `services_deliverables.services_id → services.id` with `one_field: "deliverables"` + `sort_field: "sort"`; (d) `services_deliverables_translations.services_deliverables_id → services_deliverables.id` (Translations junction); (e) same lang-code FK; (f) `services_sections.services_id → services.id` with `one_field: "sections"` + `sort_field: "sort"`; (g) + `services_sections_translations` pair.
  - Seeded `languages`: `en` / `fr` / `es`.
  - Granted Public policy `read` on all 7 collections via batch `POST /permissions`.

**What landed:**

The Directus side of the services content model, hand-designed to mirror `src/lib/types.ts` `Service` TypeScript shape so the Task 4 `DirectusAdapter.toService()` mapping binds 1:1 with zero TS adjustments. Translations follow the Directus-native pattern per spec Q6 Approach A: each translatable collection has a sibling `_translations` junction with `<parent>_id` + `languages_code` FKs and per-locale field rows; the parent carries an O2M alias (e.g. `services.translations`) that exposes the junction as a nested array. Fetch pattern from the adapter (already implemented): `readItems('services', { fields: ['*', { translations: ['*'] }] })` → `toLocalizedString(row.translations, fieldName)` composes the `LocalizedString` at the adapter boundary.

Schema shape, summarized:

- **`services`** — `id` (PK string, kebab-case slug; interface `input` with `slug: true`), `station` (int, required, drives order + nav), `icon` (string, Lottie filename), `svg` (string, illustration filename), `lottie_reverse` (bool default false), `visible` (bool default true), `related_projects` (csv of project slugs; M2M upgrade later when projects collection lands), `stack` (csv of tech names). Sort field: `station`.
- **`services_translations`** — auto-id PK, `services_id` + `languages_code` FKs. Translated fields: `title` (string, required), `subtitle`, `description` (text, required), `long_description` (text), `value_proposition` (text), `benefit_headline`, `impact_metric_value`, `impact_metric_label` (all strings).
- **`services_deliverables`** — auto-id PK, `services_id` FK, `sort` int. One translated field via junction: `label` (string, required).
- **`services_sections`** — auto-id PK, `services_id` FK, `sort` int. Two translated fields via junction: `title` (string, required), `content` (text, required).
- **`languages`** — `code` PK (string, 2-letter ISO 639-1), `name` (string, required), `direction` (enum `ltr`/`rtl`, default `ltr`). Seeded with `en` · `fr` · `es`.

**Why the Public-policy permissions bit matters.** The adapter's SvelteKit server-load calls are unauthenticated by default (they don't have a session context). The Public role (policy `abf8a154-5b1c-4a46-ac9c-7300570f4f17`) now has explicit `read` permissions on all 7 collections. After Task 7 flips the seam, SvelteKit's `+page.server.ts`/`+layout.server.ts` loaders can hit the Directus SDK with no token and get data back — same trust model as a public REST endpoint. Admin writes (Data Studio, Task 6 seed, AI editor) still require auth.

**Decisions (added during execution):**

- Task 5.D-1 — **Path B (programmatic REST) over Data Studio.** Spec D3 says "snapshot + apply YAML" is the durable mechanism; it doesn't specify HOW the schema gets authored pre-snapshot. GUI click-through for 7 collections + 6 relations + 7 permissions = 40+ clicks × ambiguity about interface settings. REST is faster, reviewable in a shell transcript, repeatable if we need to rebuild from scratch on a fresh instance. Snapshot YAML output is identical either way.
- Task 5.D-2 — **`related_projects` as CSV (not M2M yet).** Projects collection doesn't exist. CSV field of project slugs is equivalent to `relatedProjects: string[]` in TS. When projects lands (Task 5-next or Slice 19), upgrade to M2M junction `services_projects` via `POST /relations` + data migration (keys already exist as slugs). No adapter change needed — the field stays a `string[]` on the Service type.
- Task 5.D-3 — **`sort` on `_deliverables` + `_sections` collections.** TS type is a positional array (`deliverables: LocalizedString[]`, `sections: ServiceSection[]`). Without an explicit sort column, Directus orders by `id` which tracks creation order — editing order becomes painful. `sort` is an explicit int column wired via relation `sort_field: "sort"`; Data Studio exposes drag-to-reorder UI; adapter's `readItems` query can `sort: ['sort']` to preserve order on fetch. Small ergonomic win.
- Task 5.D-4 — **Junction collections are `hidden: true`** in Data Studio. Users don't want to see `services_translations` as a first-class entity in the nav — they want to edit translations inline on the parent. `hidden: true` on the junction collections hides them from the sidebar; the parent still exposes them via the `translations` alias interface.
- Task 5.D-5 — **Admin token rotation not required.** The token used for this session was obtained via `POST /auth/login` with 1P-stored admin credentials; session access token lives 15 min and was unused after the setup sequence completed. No long-lived admin static token was created — each admin mutation requires a fresh login from 1P. Minimal surface.

**Reviews:**

- Spec adherence: ✅ — Q6 Approach A (native Translations + `toLocalizedString` adapter boundary) implemented exactly as specified. Q7 markdown staying markdown ✅ (no Block Editor introduced). D3 snapshot-in-Git ✅. D1/D2 unaffected (schema is DB-level; storage + hosting unchanged).
- Cross-tool adversarial review: deferred to slice close.

**Tests / verification:**

- Directus MCP `schema` round-trip on all 7 collections → every field, type, `note`, and `interface` matches spec ✅
- Unauth smoke: `curl https://cms.yesid.dev/items/services` → `{"data":[]}` (200, empty — collection exists, no items; Task 6 seeds) ✅
- Unauth smoke: `curl https://cms.yesid.dev/items/languages` → all three locales return ✅
- yesid.dev type alignment: `DirectusServiceTranslation` in `src/lib/adapters/directus.ts` (Task 4) has `languages_code` + identical field names → 1:1 mapping with zero TS changes ✅
- yesid.dev-cms PR #5 opened ✅

**Task 5 CI fixes (post-snapshot-commit, landed in PR #5 before merge):**

Six follow-up commits on the same branch fixed defects in the `schema-apply` CI workflow authored at Task 3c. The workflow had never actually been exercised end-to-end (Task 3c's snapshot was a 369-byte empty baseline that no-op'd through diff+apply without exercising most code paths). PR #5's 48 KB snapshot triggered every gap:

| # | SHA | Defect | Fix |
|---|-----|--------|-----|
| 1 | `766026d` | Boot timed out — `--network host` + 2-min poll | `--add-host=host.docker.internal:host-gateway` + DB_HOST=host.docker.internal + 5-min poll + streamed `docker logs -f` + `docker inspect --format='State:...'` timeout diagnostics |
| 2 | `4ee9283` | `Validation failed for field "email"` with `admin@ci.local` (TLD-rejected) | Tried `admin@ci.test` — still rejected by 11.17.3 validator |
| 3 | `5b42566` | Email still failing; also noticed image's default CMD exits after bootstrap on a fresh DB (doesn't auto-chain to `start`) | Explicit `sh -c "npx directus bootstrap && exec npx directus start"` + `LOG_LEVEL=debug` for visibility |
| 4 | `f053506` | `admin@ci.test` still rejected | Switched to `admin@example.com` (RFC 2606 reserved + real `.com` TLD — validator passes) |
| 5 | `7980ece` | `/schema/diff` rejected `Content-Type: application/yaml` — routes through `schemaMultipartHandler` | Multipart form upload (`-F "file=@infra/directus/snapshot.yaml"`); mirrored to prod-apply job |
| 6 | `0e037d3` | `/schema/apply` rejected body — `Invalid payload. "hash" is required` | Strip the `{data: ...}` wrapper (`jq '.data' \| curl --data-binary @-`); mirrored to prod-apply |

**Green run (`24863731974`):** Directus healthy after 10 polls (30 s), schema diff applied with hash `f32d9d23cdc4…`, smoke-checks confirmed 7 user collections post-apply.

**Upshot:** Task 3c's CI workflow had 4 real defects in its REST calls — all three Directus 11.17.3 API shapes (bootstrap command chain, `/schema/diff` multipart, `/schema/apply` body contract) needed correction. All three are now documented inline in the workflow so a later reader (or Task 6 seed script) doesn't re-discover them.

**Follow-ups flagged:**

- **Task 6** (yesid.dev-cms) — write `scripts/seed.ts` that reads `../yesid.dev/src/lib/content/services.ts` and upserts into these collections via SDK. Each `Service` becomes one row in `services` + N rows in `services_translations` (one per locale present) + M rows in `services_deliverables` + corresponding translations + K rows in `services_sections` + translations. Idempotent (upsert by natural key — slug for services, position for sub-collections).
- **Task 4 adapter follow-ups now unblocked** — `impactMetric` (maps to `impact_metric_value` + `impact_metric_label` translation fields), `deliverables` (fetch via `{ fields: ['*', { deliverables: ['*', { translations: ['*'] }] }] }`, then compose LocalizedString per row), `sections` (same pattern with `title` + `content`), `stack` (csv field — split on comma).
- **Projects, blog_posts, tech_stack, site_meta, site-chrome pages** — each needs its own Task-5-style schema design before their adapter ports can fill in. Same pattern: collection + Translations junction(s) + `_deliverables`/`_sections`-style sub-collections where needed.
- **Default visibility for sub-collections** — the `_translations` + `_deliverables` + `_sections` collections are `hidden: true` for the sidebar, but Data Studio still lists them under `Content`. If that's noisy, the alternative is a stable Dev Studio folder grouping — cosmetic, not blocking.
- **Schema-apply CI gate** — `.github/workflows/schema-apply.yml` (Task 3c) needs to run on PR #5 to validate the snapshot applies cleanly on an ephemeral container. Watch the workflow run.

---

### Task 6 — Seed services content into Directus ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high) — via @directus/sdk v20 + 1P CLI (admin creds) + Directus REST (schema hotfixes) + MCP items tool (verification)
- **Session:** 2026-04-23 (continued from Task 5 close)
- **PR (yesid.dev):** `feature/slice-18` commit `7222c92`
- **PR (yesid.dev-cms):** [mgkdante/yesid.dev-cms#6](https://github.com/mgkdante/yesid.dev-cms/pull/6) — **MERGED as `4963c94`** (2026-04-23). Contained the schema hotfixes discovered during seed validation.

**Files:**

- Created (yesid.dev): `scripts/seed-directus-services.ts` — 277 lines. Reads `src/lib/content/services.ts`, maps each `Service` → Directus nested-create payload, posts one atomic `POST /items/services` per service with translations + deliverables + sections nested.
- Modified (yesid.dev): `.env.example` — `DIRECTUS_ADMIN_EMAIL` + `DIRECTUS_ADMIN_PASSWORD` (1P refs).
- Modified (yesid.dev): `package.json` — `seed:services` npm script (`op run --env-file=.env -- bun scripts/seed-directus-services.ts`).
- Modified (yesid.dev-cms): `infra/directus/snapshot.yaml` — +130 lines, −10 lines (5 alias field entries + 2 field-type changes).
- Out-of-repo (Directus at `cms.yesid.dev`):
  - 6 services created: `sql-development`, `data-pipeline`, `analytics-reporting`, `database-engineering`, `internal-tooling`, `web-development` (stations 1–6).
  - 6 `services_translations` rows (one per service, locale `en`).
  - 36 `services_deliverables` rows (6 per service) + 36 `services_deliverables_translations` rows.
  - 6 `services_sections` rows (one per service with "My Approach" title) + 6 `services_sections_translations` rows.
  - 5 alias fields added on parent collections (see Task 6 § Schema hotfixes).
  - `related_projects` + `stack` field types: **csv → json** (see Task 6 § Schema hotfixes).

**What landed:**

Live Directus now carries a faithful mirror of yesid.dev's canonical `services.ts` content. Every English string, deliverable, section, impact metric, stack list, and related-project link made it across. The data is reachable via:

- Directus REST/SDK with `readItems('services', { fields: ['*', { translations: ['*'] }, { deliverables: ['*', { translations: ['*'] }] }, { sections: ['*', { translations: ['*'] }] }] })` — returns the full hydrated Service shape 1:1 with what `staticAdapter` returns from TS.
- MCP `items` tool with the same deep query (verified during the session).
- Data Studio `/admin/content/services` — each service renders with translations + deliverables + sections in the expected inline interfaces.

The seed is idempotent. Re-running `bun scripts/seed-directus-services.ts` wipes existing services (FK CASCADE removes junctions) and recreates from `services.ts`. Same Directus state every time.

**Location deviation (spec-sketch said "in yesid.dev-cms", script actually lives in yesid.dev):**

Plan § Next-tasks at Task 3 close sketched the seed living in `yesid.dev-cms/scripts/seed.ts`. Final location is `yesid.dev/scripts/seed-directus-services.ts` instead. Rationale: yesid.dev has all the TS infrastructure pre-wired (SvelteKit path aliases `$lib/*`, `@directus/sdk` installed at Task 4, bun configured, `tsconfig.json` strict, the canonical `services.ts` source itself). yesid.dev-cms is a minimal scaffold (`.gitignore` + `.nvmrc` + `README.md` + `vercel.json` + `infra/directus/`) without a full TS project, so running a seed from there would require either vendoring the canonical content or adding scaffolding that yesid.dev already has.

The physical location is a dev-ergonomics choice; the Directus state produced is identical either way. The script is a one-shot replay tool — not production code — so living on the "consumer" side of the seam is fine. Task 6 is noted in yesid.dev's durable outputs (`scripts/seed-directus-services.ts`), not in yesid.dev-cms.

**Schema hotfixes discovered during seed validation (yesid.dev-cms PR #6):**

1. **5 missing alias fields.** Task 5's programmatic `POST /relations` created the junction tables + FK constraints, and declared `one_field: "translations"` / `"deliverables"` / `"sections"` in the relation metadata — but that alone does NOT create the corresponding row in `directus_fields` for the alias. Data Studio's UI does that as a separate `POST /fields/<collection>` call under the hood; our programmatic flow skipped it. Without these rows, deep-fetch queries 403 with `"You don't have permission to access fields translations/deliverables/sections"`. Fix: 5 targeted `POST /fields/<parent>` calls with `type: "alias"`, `schema: null`, and the appropriate `interface` + `special` combos (`translations` for junction-backed arrays; `list-o2m` for one-to-many). Now committed in the snapshot.

2. **`related_projects` + `stack` type: csv → json.** Task 5 declared these as `csv` — the Directus type that stores a comma-joined string at the DB layer. The seed sent `string[]` arrays via `@directus/sdk createItem`; the SDK serialised them with `JSON.stringify` and wrote `"[\"a\",\"b\",\"c\"]"` into the column verbatim (bypassing the csv-type's comma-join semantics). Reading back returned the raw JSON string, not an array. Fix: swap to `type: "json"`, which stores native arrays and round-trips through the SDK correctly. Aligns 1:1 with the TS typing on `DirectusService` in `src/lib/adapters/directus.ts` (`related_projects?: string[] | null`). No adapter TS changes needed — the type was already `string[]`.

**Decisions (added during execution):**

- Task 6.D-1 — **Location: yesid.dev, not yesid.dev-cms.** Ergonomics of TS infrastructure re-use outweighed plan-sketch adherence. Rationale documented above.
- Task 6.D-2 — **Nuke-and-recreate idempotency over per-row upsert.** The alternative (natural-key upsert by slug + position) requires `services_translations.{services_id, languages_code}` composite lookup + per-field patch + delete-orphans for removed deliverables. Nuke-and-recreate is ~40 lines shorter and makes the seed trivially auditable: it always converges to `services.ts` state regardless of prior Directus state. Only destructive on the services domain tree; `languages` + other collections untouched.
- Task 6.D-3 — **Atomic nested create (one POST per service) over manual join writes.** Directus SDK's `createItem('services', { translations: [...], deliverables: [{ translations: [...] }, ...], sections: [...] })` handles the junction writes transactionally. Manual junction POSTs would need careful ordering + rollback-on-fail handling; nested create gets both for free.
- Task 6.D-4 — **Three auth paths (token, email+password, error).** CI runs may pass a static `DIRECTUS_ADMIN_TOKEN`; interactive local dev uses 1P-injected email+password and the script round-trips `/auth/login`. Falls back with a clear error message if neither is present.
- Task 6.D-5 — **Schema hotfixes committed as a separate yesid.dev-cms PR (not amended into PR #5).** PR #5 was already merged when the hotfixes surfaced. PR #6 keeps history clean: PR #5 = "Task 5 schema as designed"; PR #6 = "Task 6 seed validation surfaced two schema defects, fixed here." Cross-tool readers can trace the fix chronology linearly.

**Reviews:**

- Spec adherence: ✅ — Q6 native Translations pattern used end-to-end; Q7 markdown not relevant (sections stored as text, rendered as plain text by consumer — markdown can come later with no schema change).
- Cross-tool adversarial review: deferred to slice close.

**Tests / verification:**

- Seed script end-to-end run via `DIRECTUS_ADMIN_TOKEN=$(cat /tmp/directus-token.txt) bun scripts/seed-directus-services.ts`: 6 services created, 6 verified-on-read-back, counts match ✅
- MCP items tool deep fetch: `related_projects` + `stack` return proper `string[]` arrays (not stringified) ✅
- MCP items tool deep fetch with `deliverables.translations.label` + `sections.translations.title` + `sections.translations.content`: all resolve correctly to the English source text from `services.ts` ✅
- Directus Data Studio (implicit via schema tool confirmation): services collection has 11 fields including the 3 alias fields (translations, deliverables, sections) ✅

**Follow-ups flagged:**

- **yesid.dev-cms PR #6** — needs to land. Will re-run `schema-apply` CI on the new snapshot; all the Task 5-era CI fixes (multipart upload, apply body unwrap, etc.) carry forward. Expected to be green.
- **Task 7 unblocked** once PR #6 merges. Flip `src/lib/adapters/index.ts:7` from `staticAdapter` → `directusAdapter`, run full test suite + manual smoke on the 7 services-consuming routes (`/`, `/services`, `/services/[id]`, relevant cross-refs).
- **Adapter TODOs from Task 4** (`impactMetric`, `deliverables`, `sections` in `toService()`) — now unblocked by the real Directus data. The 3 TODO-marked fields can be filled in as part of Task 7's parity work (they're currently skipped in the mapping; will emit as `undefined` on the Service object).
- **`bun run check` + `bun run test`** on yesid.dev `feature/slice-18` — **NOT re-run this session** (the seed script is pure CLI; no .svelte or .ts change that the site imports; adapter seam still on static). Should run before Task 7 lands.
- **fr/es translation stubs** — the `services_translations` rows only carry `en` today because `services.ts` has English-only content. When French/Spanish translations are written (future slice), adding a row per `(services_id, languages_code)` tuple in Data Studio (or a follow-up seed run) is a no-op on the adapter / consumer side; the `toLocalizedString` helper picks them up automatically.

---

### Task 7 — Flip services port to Directus (hybrid adapter) ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high) — live preview-driven browser smoke; env-propagation debugging via vite HMR overlay + SSR HTML inspection
- **Session:** 2026-04-23 (same session as Tasks 4/5/6)
- **Commit:** yesid.dev `a373bf5`
- **Branch:** `feature/slice-18`

**Files:**

- Modified: `src/lib/adapters/directus.ts` — filled Task-4 TODOs (impactMetric, deliverables, sections); extended `fetchServices()` deep fetch; dropped `DIRECTUS_READ_TOKEN` + `staticToken()` binding (anonymous Public-policy reads).
- Modified: `src/lib/adapters/index.ts` — rewrote from one-line `staticAdapter` re-export to **port-by-port hybrid**: `services: directusAdapter.services` + 5 other ports still on `staticAdapter`.
- Modified: `src/lib/adapters/adapter.test.ts` — imports `staticAdapter` directly (not via `./index`) so the contract test stays network-free regardless of flip state.
- Modified: `src/tests/setup.data.ts` — two new `vi.mock` calls: (a) stub `$env/dynamic/{private,public}` to empty `{}` so the adapter module loads in Node test env; (b) swap `directusAdapter` for `staticAdapter` during tests.
- Modified: `src/tests/setup.dom.ts` — same two mocks for the DOM test tier (happy-dom doesn't expose `process`, so `$env/dynamic/*`'s virtual modules throw without the stubs).
- Modified: `.env.example` — dropped `DIRECTUS_READ_TOKEN` doc (adapter is anonymous); kept admin creds for the Task 6 seed script.

**What landed:**

Production `/services`, `/services/[id]`, and the home-page metro-stops section now read from Directus at `cms.yesid.dev` via anonymous SDK calls. All 6 services, their English translations, 6 deliverables per service, 1 section per service, impact metrics, stack tags — every field round-trips from TS types through the Directus Translations pattern with zero visible diff from the pre-flip static-rendered pages.

The 5 other content ports stay on `staticAdapter` — projects, blog, meta, techStack, content. Migration is port-by-port: each subsequent content type will land its own Directus schema + seed + adapter-impl + one-line index flip.

**Decisions (added during execution):**

- Task 7.D-1 — **Port-by-port hybrid over whole-adapter flip.** Original plan sketched "flip `src/lib/adapters/index.ts:6`" as a one-line swap of the re-export. That would have required ALL content types (projects, blog, techStack, meta, content) to be in Directus first — which is actually Tasks 5b-5f of a more expansive Task-5. Given we only moved services so far, a whole-adapter flip would break every route except /services. Hybrid wins: services migrates with bounded risk; other content types follow independently in future slices/tasks. Both options satisfy the `ContentAdapter` contract typing — hybrid just picks each port's source explicitly.
- Task 7.D-2 — **Anonymous reads, no site-side auth token.** The initial adapter scaffold (Task 4) required `DIRECTUS_READ_TOKEN` via `$env/dynamic/private`. At dev-server boot this triggered a SvelteKit "cannot import `$env/dynamic/private` into code that runs in the browser" blocking error — the universal `+layout.ts` → `meta.ts` repo → adapter chain pulls the server-only env into client bundles. Fix: drop the token + `staticToken()` binding entirely; read via the Public policy granted during Task 5. Side benefit: one less credential to rotate; site-runtime has zero auth surface. Admin writes (seed script, Data Studio) still require full auth — unchanged.
- Task 7.D-3 — **vi.mock `$env/dynamic/*` to empty `{}` in both test setups.** The DOM test tier uses happy-dom which doesn't provide `process`, so `$env/dynamic/*`'s virtual module (which reads `process.env`) threw TypeErrors at module load. Stubbing them forces the adapter to fail clearly when invoked (buildClient() throws "PUBLIC_DIRECTUS_URL required") — but imports stay clean, and the directus-adapter mock above short-circuits invocation anyway. Same stubs added to data-tier setup for symmetry.
- Task 7.D-4 — **Contract test imports `staticAdapter` directly, not via `./index`.** The test file verifies the shape of a ContentAdapter — the contract is enforced compile-time by the TS annotation on each implementation. Runtime verification targeted at the static impl is sufficient; flipping the production adapter's re-export doesn't invalidate the contract test. Makes the test env-free and stable regardless of future port migrations.

**Reviews:**

- Spec adherence: ✅ — Q6 (native Translations + `toLocalizedString` adapter boundary) implemented end-to-end; Q4 (staticAdapter kept as fallback for un-migrated ports) respected; D1/D2/D3 unaffected.
- Cross-tool adversarial review: deferred to Task 8 slice close.

**Tests / verification:**

- `bun run check` — 0 errors, 20 pre-existing warnings (unchanged) ✅
- `bun run test` — 96 test files pass, 975 tests pass ✅
- **Live dev server smoke (Svelte + Directus end-to-end):**
  - `/` — home renders; 6 services appear in metro stops + services-grid ✅
  - `/services` — all 6 services listed with Directus-backed titles/descriptions/tags ✅
  - `/services/sql-development` — full detail page: title, value proposition, 5 deliverables, "My Approach" section + body, impact metric ("3x faster / avg query improvement"), stack tags — all from cms.yesid.dev ✅
  - `/services/database-engineering` — same shape, different data: title, stack (PostgreSQL / SQL Server / Alembic / Python), "500GB+ MIGRATED SAFELY" impact metric, benefit headline ✅
  - `/services/web-development` — renders ✅
  - `/projects` — 200 OK (untouched path, still on static) ✅
- SSR HTML contains `"SQL Development & Optimization"`, `"Query performance audit"`, `"My Approach"`, `"execution plans and profiling tools"`, `"3x faster"` — every one sourced from Directus ✅
- No `$env/dynamic/private` browser-leak warning in dev server overlay ✅
- No 404 / error-page fallback HTML ✅

**Follow-ups flagged:**

- **Task 8** — slice close. Update spec amendments log (Task 5 scope re-framed from "all content types" → "services only; other types in future slices"). Peer review. Open the yesid.dev feature/slice-18 PR. Update memories. Retire the Vercel project on yesid.dev-cms if DNS has flipped.
- **Production `PUBLIC_DIRECTUS_URL`** — currently set in `.env` at `https://cms.yesid.dev`. For Vercel deploys, needs to be added as a project env var in the Vercel dashboard (or via `vercel env add PUBLIC_DIRECTUS_URL`).
- **`projects` content-type migration** — next Directus schema design pass. `projects` + `projects_translations` + `projects_sections` + related-projects M2M junction (so `services.related_projects` upgrades from CSV of slugs to a proper M2M). Pattern established by Tasks 4–7 repeats cleanly.
- **Preview/draft mode** — spec Q5 deferred to a follow-up slice. Wire Directus Content Versioning + `@directus/visual-editing` behind a `?preview=token` query param handler on a `.server.ts` route; adapter reuses the same Translations transform with an extra filter layer.

---

### Task 2b — CMS-native research + two-repo decoupling re-plan ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Executed by:** Claude Code (Opus 4.7 [1m], reasoning=high) — via 3 parallel `general-purpose` Agents each running WebFetch against directus.io/docs + vercel.com/docs + svelte.dev/docs (live fetches 2026-04-23)
- **Session:** 2026-04-23 (this session)
- **Commit:** TBD — this block is authored pre-commit
- **Branch:** `feature/slice-18`

**Files:**

- Modified: `docs/slices/slice-18/research.md` — appended § `## Task 2b findings (session: 2026-04-23)` with 10 topic sections (~10k words) + `## Task 2b decisions ready to lock in spec.md`.
- Modified: `docs/slices/slice-18/spec.md` — added D4–D12 (Visual Editor, Content Versioning, Preview routes, M2A pages, Flows → revalidation, Asset pipeline, Role/policy matrix, Extensions posture, Repo-separation boundary); revised Q5 (preview shape locked, implementation deferred per research); added Q8–Q12 (versioning on blocks, Flow revalidation timing, AVIF, versions policy, block reuse); expanded Acceptance criteria with Tasks 8–15; bumped Size L → XL + Estimated effort 6–8 → 12–15 sessions; Amendments log row.
- Modified: `docs/slices/slice-18/plan.md` — rewrote Tasks table (Tasks 0–7 + 2b shipped; Tasks 8–15 planned per CMS-native re-plan); added R7 (scope expansion) + R8 (cross-repo coordination overhead); updated Success criteria; Amendments log row.
- Modified: `docs/slices/slice-18/handoff.md` — this block + updated Status table + § 4 Open items + § 7 Amendments.

**What landed:**

Ten research topics resolved via three parallel subagents (Clusters A/B/C) over live Directus 11.17.3 docs, Vercel/SvelteKit docs, and local browse of both sibling repos. Topic-by-topic synthesis:

- **Topic 1 (Visual Editor):** `@directus/visual-editing` v2.0.0 npm package; SvelteKit `apply({ directusUrl, onSaved: invalidateAll })` + conditional `data-directus={setAttr(...)}` attribute rendering gated by `?edit=<flag>`; CSP/CORS config on cms.yesid.dev required (`FRAME_SRC=https://yesid.dev https://*.vercel.app`, `CORS_ORIGIN=https://yesid.dev`).
- **Topic 2 (Content Versioning):** per-collection opt-in; `/items/{collection}` list endpoint always returns main (versioning does NOT silently filter lists); `?version=draft` is item-scoped only; Promote is the publish verb; **no separate `status` field needed**.
- **Topic 3 (Preview routes):** dedicated `/preview/[collection]/[id]?version=draft&token=…` route tree; single `EDITOR_PREVIEW_TOKEN` env var; per-call `PreviewContext` at adapter boundary; implementation deferred to Slice 19+ per Q5.
- **Topic 4 (M2A blocks):** `pages` + M2A `blocks` + block collections (`block_hero`, `block_manifesto`, `block_proof_reel`, `block_services_grid`, `block_cta`, `block_closer`, …); per-page block copies for MVP; adapter flattens at boundary to preserve existing `ContentPort` methods; per-request memoization.
- **Topic 5 (Flows → revalidation):** Event Hook (action) → Condition (`status _eq published`) → Webhook op → SvelteKit route with `config.isr.bypassToken`. One flow per collection. No custom `/api/revalidate` endpoint.
- **Topic 6 (Asset pipeline):** `/assets/:id?key=<preset>` with saved presets (`hero-1200`, `card-600`, `thumb-240`, `og-1200`); one folder per content type; alt text via `directus_files.description`; WebP format (AVIF deferred — docs don't list it).
- **Topic 7 (Role/policy matrix):** v11 split Users → Roles → Policies → Permissions. Nine capability policies composed onto `admin`/`human-editor`/`ai-editor`/`Public`. Field-allowlist for slug-admin-only; filter-rule `status _neq published` for no-delete-published; versions-own filter for `user_created _eq $CURRENT_USER`. Enable `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true`.
- **Topic 8 (Extensions vs built-ins):** **zero custom extensions** for Slice 18. All 14 inventoried temptations (on-publish hooks, notifications, seed, slug generation, dashboards, M2A authoring, GitHub sync, visual editing, cache invalidation, preview routes, AI alt-text, SEO fields, Turnstile, i18n) resolve to Flows + built-in interfaces or consumer-side code. Marketplace extensions deferred to Slice 19+.
- **Topic 9 (Repo-separation boundary):** ownership table with ~20 rows; contract = `ContentAdapter` interface × `snapshot.yaml` × `@directus/sdk` shape; three-point change-propagation rule; `scripts/seed-directus-services.ts` migrates from yesid.dev to yesid.dev-cms (Task 8); cross-repo contract test in yesid.dev CI; rotation policy for `VERCEL_BYPASS_TOKEN` + `EDITOR_PREVIEW_TOKEN`.
- **Topic 10 (Revised task list):** Tasks 8–15 — decoupling → assets → projects/blog/tech-stack/meta (parallelizable) → site-chrome M2A pages (largest) → close. Paired PRs per task (yesid.dev-cms schema + seed first, then yesid.dev adapter + flip). 5–7 sessions estimated.

**Decisions (ratified):**

- D4–D12 added to spec.md § Design decisions. Summary row in research.md § "Task 2b decisions ready to lock in spec.md".
- Q5 revised: preview shape locked in D6, implementation deferred to follow-up slice.
- Q8 (versioning on blocks), Q9 (Flow revalidation timing), Q10 (AVIF), Q11 (versions policy), Q12 (block reuse) all resolved in spec.md § Open questions.
- Plan tasks 5–7 kept as shipped (services); prior "Task 5b–5f" placeholder replaced with discrete Tasks 10–14 scoped per content type + Task 15 close.

**Reviews:**

- Spec adherence: ✅ D1–D3 untouched (infra decisions). D4–D12 layered on top. All new D-entries reinforce existing rules (`feedback_prefer_platform_builtins`, `feedback_data_driven`).
- Cross-tool adversarial peer review: deferred to slice close per `feedback_codex_review_at_slice_close.md`.
- Scope: mid-slice scope correction explicitly documented in plan § Amendments row 3 and spec § Amendments row dated 2026-04-23.

**Tests / verification:**

- `bun run check` on yesid.dev → **unchanged** (no code touched). Expected: 0 errors, 20 pre-existing warnings (pre-existing before Task 2b; unrelated).
- `bun run test` on yesid.dev → **unchanged** (no code touched). Expected: 96 test files, 975 tests passing (Task 7 baseline).
- `docs/slices/slice-18/{plan,spec,research,handoff}.md` grew but consumer code + adapter code + tests all untouched.
- yesid.dev-cms untouched this session.
- cms.yesid.dev live Directus untouched this session.

**Research source URLs (all fetched 2026-04-23):**

- https://directus.io/docs/guides/content/visual-editor
- https://directus.io/docs/guides/content/content-versioning
- https://directus.io/docs/api/versions
- https://directus.io/docs/tutorials/getting-started/implementing-live-preview-in-sveltekit
- https://directus.io/docs/guides/data-model/relationships
- https://directus.io/docs/guides/automate/{flows,triggers,operations}
- https://directus.io/docs/guides/files/{transform,upload,access}
- https://directus.io/docs/api/{assets,files,policies,permissions,roles}
- https://directus.io/docs/configuration/{files,realtime,extensions}
- https://directus.io/docs/guides/auth/access-control
- https://directus.io/docs/reference/filter-rules
- https://directus.io/docs/guides/content/collaborative-editing
- https://directus.io/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk
- https://vercel.com/docs/incremental-static-regeneration
- https://svelte.dev/docs/kit/adapter-vercel
- https://github.com/directus-labs/extensions (marketplace inventory)

**Follow-ups flagged:**

- Task 8 (next up): re-init `yesid.dev-cms` with minimal `package.json`; migrate `scripts/seed-directus-services.ts` → `yesid.dev-cms/scripts/seed-services.ts`; document rotation policy; cross-repo contract test scaffold.
- Task 9 (after Task 8): asset migration from `static/images/*` → Directus + R2. Emits `assets-id-map.json` consumed by Tasks 10–14.
- Tasks 10–13 (parallelizable after Task 9): projects / blog / tech-stack / meta — each follows same pattern (schema + seed + adapter port + flip; paired yesid.dev-cms + yesid.dev PRs).
- Task 14 (depends on 9 + benefits from 10–13): site-chrome as M2A pages. Largest remaining task; warrants its own session.
- Task 15 (slice close): role/policy tighten, optional Flow revalidation, peer review, PR, memories.
- **No manual ops required from owner this session.** Task 2b is research + docs only.

---

### Task 8 — Two-repo decoupling + minimal toolchain + test-suite split ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Session:** 2026-04-23 (same session as Task 2b — owner approved consecutive tasks after Task 2b close)
- **Paired PRs:**
  - yesid.dev-cms **[PR #7](https://github.com/mgkdante/yesid.dev-cms/pull/7)** — **MERGED** as `8293eec` (2026-04-24 01:50 UTC)
  - yesid.dev commit `3eb9358` + handoff `540de0e` on `feature/slice-18` (no PR yet — accumulates until slice close)

**Files (yesid.dev-cms — PR #7):**

- Created: `package.json` — minimal scripts-only toolchain: `@directus/sdk@^20`, `zod@^3`, `yaml@^2`, `bun-types@latest`. Scripts: `seed:services` + `test`. No build/lint runners.
- Created: `tsconfig.json` — strict + `noUncheckedIndexedAccess` + `bun-types` only. `noEmit: true`.
- Created: `bun.lock` — reproducible installs for CI.
- Created: `fixtures/services.json` — 405-line JSON export of yesid.dev's `src/lib/content/services.ts` (6 services with English translations + deliverables + sections). Authoritative data joins the CMS repo; no cross-repo git coupling at seed time.
- Created: `scripts/seed-services.ts` — migrated + refactored from yesid.dev's `scripts/seed-directus-services.ts`. Inlined minimal `Service` type + Zod schemas. Exported pure transformation helpers (`toServiceRow`, `toTranslationRows`, `toDeliverableRows`, `toSectionRows`, `collectServiceLocales`, `localesIn`, `loadServicesFixture`). Entry-point gated via `import.meta.main` so tests can import without triggering `main()`.
- Created: `tests/services-fixture.test.ts` — 7 Zod-validation tests on `fixtures/services.json`. Catches drift between fixture JSON + Zod schema.
- Created: `tests/seed-dry-run.test.ts` — 19 unit tests on pure transformation helpers. No network, no Directus. Fast (runs in <500ms).
- Created: `tests/snapshot-shape.test.ts` — 7 tests that parse `infra/directus/snapshot.yaml` and assert on required collections (services + services_translations + languages) + required fields the adapter reads (id, station, lottie_reverse, visible, related_projects, stack + translations.languages_code/title/description). Repo-local drift catcher.
- Created: `.github/workflows/contract-test.yml` — NEW cross-repo boundary check. Checks out `mgkdante/yesid.dev` sibling, boots ephemeral Directus with THIS snapshot, grants Public policy read on the services domain, seeds via `bun run seed:services`, then runs yesid.dev's `directus.integration.test.ts`. Opt-in via `contract-test` PR label + nightly cron (07:00 UTC).
- Modified: `.github/workflows/schema-apply.yml` — added Bun setup + `bun install --frozen-lockfile` + `bun test` step before docker run (catches drift before boot). Added optional `seed: true` `workflow_dispatch` input that runs seed against the ephemeral Directus (smoke-only; prod seed stays a local manual ops step).
- Modified: `README.md` — expanded with (a) repo layout tree, (b) `bun install` + `bun test` local-dev instructions, (c) Operations section: seed-against-prod recipe using 1P token, (d) shared-token rotation policy (90d cadence for `VERCEL_BYPASS_TOKEN` + `EDITOR_PREVIEW_TOKEN`, with openssl + Railway + Vercel + verification steps), (e) schema-change workflow, (f) paired-PR coordination rule.
- Modified: `.gitignore` — exclude `.next/` + `media/` (Payload-era leftovers; R2 is canonical storage).

**Files (yesid.dev — commit `3eb9358` on `feature/slice-18`):**

- Deleted: `scripts/seed-directus-services.ts` (migrated to yesid.dev-cms/PR #7).
- Modified: `src/lib/adapters/directus.ts` — added `export` to `toService` + the 5 `DirectusService*` row interfaces so contract tests can construct synthetic rows. Purely additive — no behavior change at runtime.
- Created: `src/lib/adapters/directus.contract.test.ts` — 13 tests covering (a) structural conformance: `directusAdapter` exposes every `ContentAdapter` port + method; (b) compile-time gate: `adapter: ContentAdapter = directusAdapter` assignment; (c) un-implemented-port throws — `projects.all()`, `blog.all()`, `meta.site()`, `techStack.all()`, `content.hero()` all reject with `/not implemented/` (uses `vi.importActual` to bypass the setup-mocked adapter and reach the real one); (d) pure `toService` row-to-domain mapping on synthetic rows (impactMetric conditionality, sort ordering on deliverables + sections, multi-locale composition, null-coalescing on optional scalars); (e) `toLocalizedString` exposure check.
- Created: `src/lib/adapters/directus.integration.test.ts` — 6 env-gated tests (skipped unless `RUN_DIRECTUS_INTEGRATION=1` + `PUBLIC_DIRECTUS_URL` set). Asserts end-to-end on live ephemeral Directus: `services.all()` returns `Service[]` with valid shapes; `services.visible()` is a subset; `services.byId()` handles known + unknown ids; `services.adjacent()` returns `{prev, next}`; deliverables + sections hydrate via Translations. Used exclusively by the cross-repo contract-test workflow.
- Created: `.github/workflows/contract-test.yml` — mirror of the CMS repo's workflow. Checks out `mgkdante/yesid.dev-cms` sibling, boots ephemeral Directus with sibling's snapshot, seeds, runs `directus.integration.test.ts` with `RUN_DIRECTUS_INTEGRATION=1`. Opt-in via `contract-test` PR label + nightly cron (07:15 UTC, offset from CMS's 07:00 to spread CI load).

**What landed:**

The two-repo decoupling is now structural + testable. Before Task 8, the two repos were conceptually separate but practically entangled: seed script lived on the wrong side, there was no CMS-side test suite, and the only adapter-contract check was the existing `adapter.test.ts` (which tests the static adapter only). After Task 8:

- **Each repo runs its own bun test suite.** Consumer: 98 files, 989 passing + 6 skipped (the integration suite). CMS: 3 files, 33 passing. Independent CI cycles.
- **Three distinct test boundaries validate the adapter seam:**
  1. CMS-side `snapshot-shape.test.ts` — asserts the authored schema contains the fields the adapter reads (catches "someone edited snapshot.yaml without updating adapter types").
  2. Consumer-side `directus.contract.test.ts` — asserts the adapter's structural + pure-mapping behavior against synthetic rows (catches "someone refactored toService and broke the mapping").
  3. Cross-repo `contract-test.yml` (both sides) — end-to-end ephemeral Directus + seed + adapter integration (catches "the two sides work in isolation but not together").
- **Paired-PR flow established.** yesid.dev-cms PR #7 lands first (no schema change here; safe baseline). yesid.dev commit on `feature/slice-18` follows in the same session. Future content-type tasks (10–14) will follow the same shape: CMS PR → smoke green → prod apply → consumer PR → merge.
- **Rotation policy documented** for the two shared tokens (`VERCEL_BYPASS_TOKEN` + `EDITOR_PREVIEW_TOKEN`). No CI automation — manual + checklisted per 90d cadence or on suspected leak.

**Decisions (added during execution):**

- Task 8.D-1 — **Inline the Service type + Zod schemas in the CMS-side seed script** rather than export from yesid.dev as a shared package. Cross-repo TS imports would re-couple the two repos. The CMS repo's `scripts/seed-services.ts` defines its own minimal Service shape (matching yesid.dev's exactly at fixture-export time) + a Zod schema for validation. Any future shape change to the Service type touches both sides — that's the intended coupling, made explicit.
- Task 8.D-2 — **Fixture JSON in yesid.dev-cms/fixtures/, exported from yesid.dev's TS module.** Alternative rejected: `git archive` subtree fetch in CI (adds cross-repo git coupling). Alternative rejected: npm-publish yesid.dev's content as a package (overkill; the fixture is static during Slice 18). The JSON file is committed authorship; during Slice 18 close, yesid.dev's `src/lib/content/services.ts` freezes and Directus Data Studio becomes the authoring surface.
- Task 8.D-3 — **Skip-by-default integration tests, env-gated.** `vitest`'s `describe.skipIf` pattern keeps `directus.integration.test.ts` out of local `bun run test` (no network, no env dependency). The cross-repo contract-test workflow sets `RUN_DIRECTUS_INTEGRATION=1` + `PUBLIC_DIRECTUS_URL=http://localhost:8055` before running, enabling the live assertions against ephemeral Directus. A mirrored `describe.skipIf(RUN && URL_)` "guard" test prints a silent pass documenting that the integration suite exists.
- Task 8.D-4 — **Expose `toService` + `DirectusService*` interfaces from `src/lib/adapters/directus.ts`** so `directus.contract.test.ts` can construct synthetic rows. Additive-only change; `directusAdapter` remains the only production consumer. This is the minimal surface needed for contract testing without refactoring the adapter's internal helpers.
- Task 8.D-5 — **Contract-test workflow opts in via PR label `contract-test`**, not every PR. Running ephemeral Directus + seed + integration takes ~3 min of CI time; opt-in + nightly cron is a better cost/drift-catch balance than always-on per PR. Labels are cheap to apply when a change touches the adapter seam.
- Task 8.D-6 — **Node-modules exclusion in `.gitignore` + `.next/` + `media/` added** — the yesid.dev-cms repo had these as untracked but polluting `git status`. Scorch was incomplete on disk even though the tracked file list was clean; this commit makes the exclusion explicit.

**Reviews:**

- Spec adherence: ✅ D12 (repo-separation boundary) fully implemented. Ownership table in research.md § Topic 9 now matches reality — no misplaced files. Contract definition operationalized via three test boundaries.
- Cross-tool adversarial peer review: deferred to slice close per `feedback_codex_review_at_slice_close.md`.

**Tests / verification:**

- yesid.dev-cms: `bun install --frozen-lockfile` → 5 packages (no tree explosion). `bun test` → **3 files · 33 tests · 143 expect() calls · 460ms** ✅
- yesid.dev: `bun run check` → **0 errors**, 20 pre-existing warnings (unchanged from Task 7 baseline) ✅
- yesid.dev: `bun run test` → **98 files · 989 passing · 6 skipped · 995 total** ✅ (up from 96/975 at Task 7; new: `directus.contract.test.ts` + `directus.integration.test.ts` [6 skipped])
- Contract test verifies un-implemented ports still throw "not implemented" — ensures the hybrid at `src/lib/adapters/index.ts` stays honest (services only on Directus; other 5 ports throw if accidentally routed).
- Smoke CI on yesid.dev-cms PR #7: pending (will run when PR opens — expected green; same docker setup + new `bun test` step).

**Follow-ups flagged:**

- **yesid.dev-cms PR #7 review + merge** — operator to review + merge. Smoke-CI expected green. No prod apply (no schema change).
- **Task 9 unblocks** once PR #7 merges. Task 9 = asset pipeline migration (`static/images/*` → Directus + R2 via SDK uploads). Emits `assets-id-map.json` for Tasks 10–14 to reference.
- **Manual smoke test opportunity**: trigger `workflow_dispatch` on yesid.dev-cms PR #7 with `target: smoke` + `seed: true` — verifies the entire fixture → ephemeral apply → seed → Public read → adapter integration round-trips end-to-end before any Task 10+ content-type lands.
- **Paired-PR flow rehearsal**: Task 10 (projects content type) will be the first actual cross-repo coordination — yesid.dev-cms PR with schema + seed + snapshot + prod-apply (via `workflow_dispatch`), then yesid.dev PR with adapter impl + flip. Task 8 established the pattern; Task 10 exercises it.
- **Bun version pin**: both contract-test workflows use `bun-version: latest`. Consider pinning to a specific version (e.g. 1.3.11) for deterministic CI once 1.3.x behavior is stable.
- **Enable Vercel env var `PUBLIC_DIRECTUS_URL`** — currently local only. Per Task 7 follow-up, this needs to land in Vercel project settings before any production deploy flips remaining ports.

---

## 4) Open items for downstream tasks

- ~~Task 2: resolve D1/D2/D3.~~ **Done.**
- ~~Task 3: Directus install on Railway Hobby + Neon + R2 + native MCP.~~ **Done.** Manual ops by user remain (drop PostGIS service, retire Vercel project after DNS settles) — see § 5 Follow-ups + Task 3 § Manual dashboard ops.
- ~~Task 4: DirectusAdapter scaffold + `services` port + `toLocalizedString`.~~ **Done.** Scorched-earth Neon cleanup landed as a Task 3 follow-up.
- ~~Task 5: Services collection schema + snapshot to yesid.dev-cms.~~ **Done.** yesid.dev-cms PR #5 merged (`13aaeb9`).
- ~~Task 6: Seed services content + schema hotfixes.~~ **Done.** yesid.dev `7222c92`; yesid.dev-cms PR #6 merged (`4963c94`).
- ~~Task 7: Flip services port to Directus (hybrid adapter).~~ **Done.** yesid.dev `a373bf5`.
- ~~**Task 2b (mid-slice scope correction): CMS-native research + two-repo decoupling re-plan.**~~ **Done.** D4–D12 locked; Q5 revised; Q8–Q12 resolved; Tasks 8–15 documented. No code changes.
- ~~**Task 8: Two-repo decoupling + minimal toolchain + test-suite split.**~~ **Done this session.** yesid.dev-cms PR #7 open (task-8-decoupling) + yesid.dev `3eb9358` on feature/slice-18. 33 new CMS tests + 13 new consumer contract tests + 6 new skipped-by-default consumer integration tests + mirrored `contract-test.yml` in both repos + CMS README Operations section with rotation policy.
- **Task 9:** Asset pipeline migration. Walk `static/images/*` → emit manifest → bulk-upload via SDK to 5 folders (services/blog/projects/brand/og). Define 4 saved presets in Data Studio (`hero-1200`, `card-600`, `thumb-240`, `og-1200`). Retain `legacy_path` custom field on `directus_files` during migration window. Emit `assets-id-map.json`. No adapter work this task.
- **Task 10:** Projects content type. Schema (`projects` + translations + M2M junction replacing `services.related_projects` CSV + `hero_image` M2O → `directus_files`) + seed + adapter port (`projects`, 8 methods) + flip `projects: directusAdapter.projects` at `src/lib/adapters/index.ts`. Content Versioning enabled. Paired PRs.
- **Task 11:** Blog content type. Schema (`blog_posts` + translations + Markdown body field + `cover_image`/`svg_illustration`/`animation_reverse` M2Os to `directus_files`) + seed reading `yesid.dev/src/content/blog/**/*.md` + adapter port (`blog`, 12 methods; `html` preserves `marked.parse`) + flip. Paired PRs.
- **Task 12:** Tech-stack content types. Schema (`tech_stack` + translations + `body_markdown` + `tech_relations` + `stack_scenarios` + translations) + seed reading `yesid.dev/src/lib/content/tech-stack.ts` + `src/content/stack/{id}.md` files + adapter port (`techStack`, 12 methods incl. graph utilities) + flip. Paired PRs.
- **Task 13:** Meta + route SEO. Schema (`site_meta` singleton + translations + `route_seo` collection + translations + `og_image` M2O) + seed reading `yesid.dev/src/lib/content/meta.ts` (incl. `routeSeoEntries`) + adapter port (`meta`, 2 methods; closed-registry contract throws on unknown route) + flip. Paired PRs.
- **Task 14:** Site-chrome via M2A pages. Schema (`pages` collection + M2A `blocks` field + 12+ block collections + `nav_links`/`menu_items`/`error_pages` singletons) + seed reading yesid.dev's `src/lib/content/{home-page,about-page,contact-page,services-page,projects-page,tech-stack-page,blog-page}.ts` + `nav.ts` + `site-content.ts` + adapter port (`content`, 19 methods; per-request memoized `loadPage(slug)`) + flip. Largest remaining task. Paired PRs.
- **Task 15:** Slice close. Tighten `ai-editor` role per D10 (field allowlists; filters; drop system-collection writes; keep 3 system-reads for MCP schema tool). Enable `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true`. Scope `directus_files.read` on Public role via `folder._in: [public folder ids]`. Optional: wire Flow-based revalidation per D8 (one Flow per content collection; Webhook op → SvelteKit route with `bypassToken`). Cross-tool adversarial peer review (Codex). Open yesid.dev `feature/slice-18` PR against main. Update memories. Retire Vercel project on yesid.dev-cms after DNS flip confirmed.

## 5) Follow-ups flagged (accumulating)

1. ~~Replace stale Payload comment in `src/lib/adapters/index.ts`.~~ Done in pre-Task-2 cleanup (`1535fa5`).
2. ~~Retire Vercel project on yesid.dev-cms at Task 3 cutover.~~ → moved to **Manual dashboard ops** in Task 3 block (waits for DNS flip).
3. Monitor Directus 12 license revision (directus.io/bsl); decide upgrade path before any v12 bump.
4. After Task 7 production-green for 2+ weeks: delete `staticAdapter` in Slice 19+ (Q4 resolution).
5. **Resend email integration** — Railway blocks SMTP egress (port 587). Switch to Resend HTTPS API via Directus Flow + webhook operation. Resend key already in 1P at `op://yesid-dev/s7ztvxh5t7qc764644le3w7zhi/credential`.
6. ~~**Save Directus MCP ai-editor token to 1P.**~~ Done — token lives in 1P vault `yesid-dev` at `op://yesid-dev/mymltacjptswpjx24kw3iwxfpy/credential`; consumed as `$YESID_CMS_MCP_TOKEN` via `op read`.
7. **Tighten ai-editor role permissions (updated at Task 4)** — now has explicit **read** on `directus_collections/fields/relations` (widened Task 4 so the MCP `schema` tool works). Write/delete on `directus_*` system collections remain blocked. Follow-up: once Task 5 defines the real user collections, add a `/policies` + `/access` row scoping write access to those collections only, while keeping the 3 system-read grants.
8. **Drop the unused PostGIS Railway service** — Railway CLI doesn't expose `service delete`; do via dashboard.
9. **Pin Directus image to 11.17.3 explicitly** in a `Dockerfile`/`railway.json` override (currently runs on it via template default but isn't locked).

## 6) Iterations (per Iteration Protocol step 7)

*(Populated if/when tasks need a fix-retest cycle.)*

## 7) Amendments during execution

| # | Date | Change | Rationale |
|---|------|--------|-----------|
| 1 | 2026-04-22 | Task 1 shipped as TWO PRs instead of one. | Owner asked for a true start-from-scratch state after PR #1 merged. PR #2 (`chore/clean-slate`) was added to strip the remaining Payload-era transition scaffolding (package.json, tsconfig, eslint, next.config, .vscode, all doc markers). Better than amending PR #1 because the merged history preserves a clean "scorch → clean slate" sequence readable in isolation. |
| 2 | 2026-04-22 | Added `vercel.json` mid-PR-#1. | Vercel had a cached Next.js detection and kept failing to build the scorched shell, surfacing as a red check owner read as "conflicts". `ignoreCommand: exit 0` is a 4-line safeguard for the transition window; Task 3 will replace or retire it. |
| 3 | 2026-04-23 | Mid-Task-3: clean-slated Neon (`DROP SCHEMA public CASCADE`) + removed `DIRECTUS_TEMPLATE` env var. | Railway template seeded its 24 demo CMS collections on the freshly-pointed Neon DB AND Neon still carried Payload-era orphan tables. Owner asked: "clean up neon db and rebuild." The DB drop + template-var unset together gave a true clean slate. |
| 4 | 2026-04-23 | Mid-Task-3: stripped all `EMAIL_SMTP_*` env vars from Railway. | New deployments kept failing healthcheck because Directus's SMTP transport hung on `CONN ETIMEDOUT` to `smtp.resend.com:587` — Railway's egress firewall blocks port 587. Switching to Resend's HTTPS API via a Directus Flow + webhook operation is the follow-up plan (deferred — see § 5 Follow-ups #5). |
| 5 | 2026-04-23 | PR #3 grew with Task 3c commits (snapshot + CI) instead of opening a separate Task 3c PR. | Task 3a's scaffold (`infra/directus/` placeholder dir) and Task 3c's payload (`snapshot.yaml` + CI workflow) are tightly coupled and target the same files. Single PR → one review, one merge. PR title intent updated in commit messages. |
| 6 | 2026-04-23 | Slice 18 scope expanded mid-slice after Task 7. Task 2b research pass inserted; revised task list grew from 8 to 16 tasks (0–7 shipped + 2b shipped + 8–15 planned). | Owner identified that Tasks 5–7 shipped services as a "TS-mirror" (hardcoded-content replacer pattern) rather than a proper CMS deployment. Slice 18 now explicitly covers full migration of all 6 content types + formal two-repo decoupling (yesid.dev + yesid.dev-cms ship independently through the adapter-seam contract). Task 2b research — 3 parallel Agents, 10 topics, ~10k words in research.md — locked D4–D12 and the revised sequence. Paired yesid.dev-cms + yesid.dev PRs per task from Task 8 onward. Estimated effort expanded 6–8 → 12–15 sessions. |
| 7 | 2026-04-23 | Task 8 added a cross-repo test-suite split + per-repo bun test suites at owner's explicit approval ("separate both concerns ... so that is tests as well!"). | Prior plan specified only one new test (yesid.dev contract test). Owner emphasized the test boundary as a first-class part of decoupling. Final shape: three test entry points — CMS-side `bun test` (fixture-validate + seed-dry-run + snapshot-shape) + consumer-side contract + mirrored cross-repo `contract-test.yml` in both repos. 33 new CMS tests + 13 new consumer contract tests + 6 skipped-by-default consumer integration tests land in this task; all green. Operating model note added to memory: post-Slice-18 = two-repo default. |

## 8) Files created (cumulative)

**yesid.dev:**
- `docs/slices/slice-18/plan.md` — Task 0
- `docs/slices/slice-18/spec.md` — Task 0
- `docs/slices/slice-18/research.md` — Task 0 (populated with Task 2 findings)
- `docs/slices/slice-18/handoff.md` — Task 0 (this file)
- `src/lib/adapters/directus.ts` — Task 4 (DirectusAdapter scaffold)
- `src/lib/adapters/directus.test.ts` — Task 4 (`toLocalizedString` unit tests)

**yesid.dev-cms (Task 3a + 3c — PR #3):**
- `.env.example` — Task 3a (`5945f56`)
- `infra/directus/README.md` — Task 3a (`5945f56`)
- `infra/directus/.gitkeep` — Task 3a (`5945f56`)
- `infra/directus/snapshot.yaml` — Task 3c (`d22669c`)
- `.github/workflows/schema-apply.yml` — Task 3c (`d22669c`)

## 9) Files modified (cumulative)

**yesid.dev:**
- `src/lib/adapters/index.ts` — Task 2 pre-cleanup (`1535fa5`): neutralized "Slice 18 (Payload CMS)" comment → Directus-cited.
- `src/lib/adapters/types.ts` — Task 2 pre-cleanup (`1535fa5`): "Payload or Keystatic" → "Directus, Keystatic, mock"; "Payload-ready" → "CMS-ready".
- `src/lib/adapters/static.ts` — Task 2 pre-cleanup (`1535fa5`): "no Payload benefit" → "no CMS benefit".
- `src/lib/adapters/adapter.test.ts` — Task 2 pre-cleanup (`1535fa5`): "Payload or Keystatic adapter" → "Directus or other CMS adapter".
- `scripts/generate-og-default.ts` — Task 2 pre-cleanup (`1535fa5`): "post-Payload" → "post-CMS-migration".
- `docs/slices/slice-18/plan.md` — Task 2: Tasks table + Risks + Amendments updated.
- `docs/slices/slice-18/spec.md` — Task 2: D1/D2/D3 + Q4–Q7 resolved; Status draft → approved; Amendments log.
- `docs/slices/slice-18/research.md` — Task 2: full findings populated under all 7 pre-reserved subsections + 2 new sections.
- `docs/slices/slice-18/handoff.md` — Task 2 + Task 3 updates: Status table, § 3 Tasks (Task 3 block + Mermaid diagram), § 4–5 Open items + Follow-ups, § 7 Amendments (rows 3–5), § 12 Schema, § 14 Architectural seam, § 15 Environment (full Railway env table), § 17 Validation, § 25 Next prompt.
- `docs/slices/slice-18/research.md` — Task 2b (2026-04-23): appended § Task 2b findings (10 topic sections, ~10k words) + § Task 2b decisions ready to lock in spec.md. All Directus 11.17.3 + Vercel/SvelteKit URLs fetched live 2026-04-23.
- `docs/slices/slice-18/spec.md` — Task 2b (2026-04-23): Metadata (Status + Size XL + Estimated effort 12–15), D4–D12 added (§ Design decisions), Q5 revised, Q8–Q12 added (§ Open questions), Acceptance criteria expanded with Tasks 8–15, Amendments log row.
- `docs/slices/slice-18/plan.md` — Task 2b (2026-04-23): Tasks table rewrote with Tasks 8–15 planned + Task 2b marked shipped; Success criteria expanded; R7 + R8 added to § Risks; Amendments log row 3.
- `docs/slices/slice-18/handoff.md` — Task 2b (2026-04-23): Status table row + Tasks completed count 8→9 of 16; § 3 Tasks (Task 2b completion block); § 4 Open items (Tasks 8–15 scoped); § 7 Amendments (row 6); § 25 Next recommended prompt (Task 8 block prepended); § 27 Final Status.

**yesid.dev-cms (Task 3 — PR #3):**
- `README.md` — Task 3a (`5945f56`): expanded with full 8-step provisioning walkthrough.

**yesid.dev-cms — out-of-band on the Railway service (no commit, env-vars):**
- See § 15 Environment table for the full env vars set/unset on `Directus CMS` service.

**Live Directus (no commit — runtime state managed via API):**
- `directus_users.email` — admin renamed `example@email.com` → private-contact-07@example.invalid`
- `directus_settings` — PATCHed: `mcp_enabled`, `mcp_allow_deletes`, `mcp_system_prompt_enabled`, `mcp_system_prompt`, `project_name`, `project_url`, `project_color`, `project_descriptor`
- `directus_roles` — created `AI Editor` role (`1dd4acc4-234a-49c6-9e85-19634a3ab69d`)
- `directus_users` — created `ai-editor@yesid.dev` user (`8f77b52b-a4d9-4c15-964b-140432454646`) with static API token
- `directus_files` — one test file (`95c39b57-...`) from R2 smoke; safe to delete

## 10) Files deleted (cumulative)

**yesid.dev:** none Tasks 0–3.
**yesid.dev-cms:** all the Payload + Next.js scaffolding (PR #1 + #2). Nothing more in Task 3.
**Neon DB (Task 3):** `DROP SCHEMA public CASCADE` removed all prior tables (Payload orphans + Railway template demo content). Schema then re-created empty; Directus migrations populated 29 `directus_*` tables on first boot.

## 11) Repository / file-tree changes

yesid.dev `docs/slices/slice-18/`:

```
docs/slices/slice-18/
├── plan.md
├── spec.md
├── research.md
└── handoff.md
```

Flat. No subdirectories. Matches plan D3.

## 12) Schema / data changes

- **Task 0–2:** None.
- **Task 3:** Neon `public` schema dropped + recreated (`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO neondb_owner`). Directus boot then created **29 `directus_*` system tables** via its built-in migrations (directus_access, directus_activity, directus_collections, directus_comments, directus_dashboards, directus_deployment_*, directus_extensions, directus_fields, directus_files, directus_flows, directus_folders, directus_migrations, directus_notifications, directus_operations, directus_panels, directus_permissions, directus_policies, directus_presets, directus_relations, directus_revisions, directus_roles, directus_sessions, directus_settings, directus_shares, directus_translations, directus_users, directus_versions). Zero user collections. Schema captured to `infra/directus/snapshot.yaml` (369 bytes).
- **Tasks 4–6 (planned):** real yesid.dev content model lands; snapshot grows accordingly.

## 13) Entrypoints / commands status

No entrypoint changes this session.

## 14) Architectural seam status

- **Tasks 0–4:** seam at `src/lib/adapters/index.ts:7` **unchanged** — yesid.dev still re-exports `staticAdapter as adapter`. Task 4 lands `src/lib/adapters/directus.ts` as a sibling file but does NOT flip the re-export. Repositories + components untouched.
- **Task 7:** seam flips. `index.ts` re-export changes from `staticAdapter` → `directusAdapter` after Tasks 5–6 define real collections + seed data, and parity is confirmed.

## 15) Environment / config

**yesid.dev:** Task 4 added `PUBLIC_DIRECTUS_URL` + `DIRECTUS_READ_TOKEN` to `.env.example` — `PUBLIC_DIRECTUS_URL` is a plain string (`https://cms.yesid.dev`), `DIRECTUS_READ_TOKEN` resolves from 1P at `op://yesid-dev/directus-read-token/credential`. Consumed in `src/lib/adapters/directus.ts` only; adapter is dormant until Task 7.

**yesid.dev-cms (Railway service `Directus CMS`)** — current env after Task 3:

| Var | Value (or shape) | Set by | Notes |
|---|---|---|---|
| KEY | 16-byte hex | Task 3 | JWT signing — saved in 1P |
| SECRET | 32-char | template (kept) | Session signing — saved in 1P |
| ADMIN_EMAIL | cms-admin@example.invalid | Task 3 | Bootstrap; admin user created on first boot |
| ADMIN_PASSWORD | 32-char (template-generated) | template (kept) | Saved in 1P; rotate via Data Studio when convenient |
| PUBLIC_URL | https://directus-cms-production-df43.up.railway.app | template | **Update to https://cms.yesid.dev after DNS flip** |
| DB_CLIENT | pg | Task 3 | |
| DB_CONNECTION_STRING | postgres://...@ep-broad-lake-amtl585d-pooler.c-5.us-east-1.aws.neon.tech/neondb?... | Task 3 | Neon pooled |
| DB_SSL__REJECT_UNAUTHORIZED | true | Task 3 | |
| STORAGE_LOCATIONS | s3 | template (kept) | |
| STORAGE_S3_DRIVER | s3 | template (kept) | |
| STORAGE_S3_KEY | (R2 Access Key, 32 char) | Task 3 | Saved in 1P |
| STORAGE_S3_SECRET | (R2 Secret, 64 char) | Task 3 | Saved in 1P |
| STORAGE_S3_BUCKET | yesid-dev-cms | Task 3 | |
| STORAGE_S3_ENDPOINT | https://eccfb9bedd87d413eaf4cac6ae2285d3.r2.cloudflarestorage.com | Task 3 | |
| STORAGE_S3_REGION | auto | Task 3 | R2 always uses `auto` |
| STORAGE_S3_FORCE_PATH_STYLE | true | Task 3 | Required for R2 |
| REDIS | redis://default:...@redis.railway.internal:6379 | template | Auto-injected by Railway |
| CACHE_ENABLED | true | template | |
| CACHE_STORE | redis | template | |
| CACHE_AUTO_PURGE | true | template | |
| SYNCHRONIZATION_STORE | redis | template | |
| WEBSOCKETS_ENABLED | true | template | |
| CORS_ENABLED | true | Task 3 | |
| CORS_ORIGIN | https://yesid.dev,https://*.vercel.app,http://localhost:5173,http://localhost:4173 | Task 3 | Allows Vercel previews + dev |
| CORS_METHODS | GET,POST,PATCH,DELETE,OPTIONS | Task 3 | |
| CORS_ALLOWED_HEADERS | Content-Type,Authorization | Task 3 | |
| CORS_CREDENTIALS | true | Task 3 | |
| MCP_ENABLED | true | Task 3 | Setting also enabled in `directus_settings.mcp_enabled` |
| EMAIL_FROM | no-reply@yesid.dev | Task 3 | |
| EMAIL_TRANSPORT | *(unset)* | — | Removed; Resend SMTP blocked by Railway egress (deferred to HTTP API via Flow) |
| EMAIL_SMTP_* | *(unset)* | — | Removed for same reason |
| DIRECTUS_TEMPLATE | *(unset)* | Task 3 (deleted) | Removed to prevent template re-applying 24 demo CMS collections on the clean Neon DB |
| EXTENSIONS_LOCATION | *(unset)* | Task 3 (deleted) | Removed; extensions stored locally in container (no S3 round-trip) |

## 16) Commands executed (in order)

```bash
# yesid.dev — Task 0
git fetch origin
git checkout main
git pull origin main                       # fast-forward to 8960b51 (PR #35 scorch merge)
git checkout -b feature/slice-18
mkdir -p docs/slices/slice-18
# (wrote plan.md + spec.md + research.md + handoff.md)
git add docs/slices/slice-18/
git commit -m "docs(slice-18): open slice — flat 4-file bundle …"   # e918736
git push -u origin feature/slice-18

# yesid.dev-cms — Task 1 PR #1 (scorch)
cd ../yesid-dev-cms
git checkout -b chore/remove-payload
git rm -r src/app/\(payload\)/ src/collections/ src/globals/ src/access/ \
         src/payload.config.ts src/payload-types.ts \
         migrations/ scripts/seed/ scripts/auto-migrate-create.mjs
# (rewrote package.json / next.config.ts / eslint.config.mjs / tsconfig.json / README + AGENTS + CLAUDE + CODEX-CONTEXT)
bun install                                # regen bun.lock (18 removed, 3 installed)
git add -u
git commit -m "chore: remove Payload (slice-18 restart …)"           # 0effef9
git push -u origin chore/remove-payload
gh pr create --title "chore: remove Payload — slice-18 restart (scorch)" --body "…"   # PR #1

# Follow-up after Vercel 'red X' surfaced as 'conflicts'
# (added vercel.json with ignoreCommand=exit 0)
git add vercel.json
git commit -m "chore: skip Vercel deploys for the scorch window"     # 803d60c
git push                                                             # pushed onto PR #1
# (PR #1 merged by owner as a7a1db6)

# yesid.dev-cms — Task 1 PR #2 (clean slate, per owner steering)
git fetch origin
git checkout main
git pull                                   # fast-forward to a7a1db6
git checkout -b chore/clean-slate
git rm .env.example .prettierrc.json AGENTS.md CLAUDE.md CODEX-CONTEXT.md \
       bun.lock eslint.config.mjs next.config.ts package.json tsconfig.json
git rm -r .vscode
rm -f next-env.d.ts tsconfig.tsbuildinfo   # gitignored artifacts on disk
# (rewrote .gitignore + README.md)
git add .gitignore README.md
git commit -m "chore: clean slate — remove all Payload-era + Next.js scaffolding"   # f3a94df
git push -u origin chore/clean-slate
gh pr create --title "chore: clean slate — start from scratch" --body "…"            # PR #2

# yesid.dev — handoff finalization
cd ../yesid.dev
# (edited docs/slices/slice-18/handoff.md)
git add docs/slices/slice-18/handoff.md
git commit -m "docs(slice-18): Task 0 + Task 1 handoff — SHAs, verification, PR links"
git push

# === Task 3 — Directus production deploy (this session) ===
# 1) Discover platform state via MCPs
#    - Cloudflare MCP set_active_account eccfb9bedd87d413eaf4cac6ae2285d3 → r2_bucket_get yesid-dev-cms (exists, ENAM)
#    - Neon MCP get_connection_string sparkling-sky-51665073 → pooled URL retrieved
#    - Railway list-projects → yesid-dev-cms (6da31832-...) with services Directus CMS / Redis / PostGIS
#    - Vercel list_projects team_KBKhzsXDEl7lR3zC7r3nhp8h → old yesid-dev-cms project prj_Joj5...
# 2) Link Railway workspace + first-pass env update (DB → Neon, KEY, admin email, CORS, MCP, partial email)
cd C:/Users/otalo/Yesito/Projects/yesid-dev-cms
railway link --project 6da31832-268c-4c26-a7f6-3fc09ebf943f --service "Directus CMS" --environment production
railway variables --service "Directus CMS" --set "KEY=..." --set "DB_CONNECTION_STRING=postgresql://..." \
  --set "private-contact-05@example.invalid" --set "CORS_ENABLED=true" --set "CORS_ORIGIN=https://yesid.dev,..." \
  --set "MCP_ENABLED=true" --set "EMAIL_FROM=no-reply@yesid.dev" ...
# 3) Iteration: discover that the template still seeded demo CMS collections on Neon
#    Owner: "clean up neon db and rebuild"
railway variable delete DIRECTUS_TEMPLATE --service "Directus CMS"
railway variable delete EXTENSIONS_LOCATION --service "Directus CMS"
# Neon MCP: DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO neondb_owner
# 4) Read R2 creds from screenshot (Cloudflare MCP cannot create R2 tokens), apply via Railway
#    Resend SMTP password fetched via op CLI (op://yesid-dev/s7ztvxh5t7qc764644le3w7zhi/credential)
RESEND_KEY=$(op read "op://yesid-dev/s7ztvxh5t7qc764644le3w7zhi/credential")
railway variables --service "Directus CMS" --set "STORAGE_S3_KEY=..." --set "STORAGE_S3_SECRET=..." \
  --set "STORAGE_S3_BUCKET=yesid-dev-cms" --set "STORAGE_S3_ENDPOINT=https://eccfb9be....r2.cloudflarestorage.com" \
  --set "STORAGE_S3_REGION=auto" --set "STORAGE_S3_FORCE_PATH_STYLE=true" --set "EMAIL_SMTP_PASSWORD=$RESEND_KEY"
# 5) Three deploys FAILED on healthcheck (Resend SMTP CONN ETIMEDOUT — Railway blocks port 587)
#    Mitigation: strip EMAIL_SMTP_* vars
railway variable delete EMAIL_SMTP_HOST --service "Directus CMS"
railway variable delete EMAIL_SMTP_PORT --service "Directus CMS"
railway variable delete EMAIL_SMTP_USER --service "Directus CMS"
railway variable delete EMAIL_SMTP_SECURE --service "Directus CMS"
railway variable delete EMAIL_SMTP_PASSWORD --service "Directus CMS"
railway variable delete EMAIL_TRANSPORT --service "Directus CMS"
# Trigger a clean redeploy via re-set
railway variable set EMAIL_FROM=no-reply@yesid.dev --service "Directus CMS"
# 6) Smoke
curl -sf https://directus-cms-production-df43.up.railway.app/server/health  # {"status":"ok"}
TOKEN=$(curl -sf POST .../auth/login -d '{"email":"cms-admin@example.invalid","password":"..."}' | jq .data.access_token)
# Upload test file → returns id 95c39b57-... storage:s3 ✓
# Roundtrip GET /assets/<id> → returns uploaded bytes ✓
# 7) Enable MCP via PATCH /settings (env MCP_ENABLED only sets default, not the directus_settings row)
curl -X PATCH .../settings -H "Authorization: Bearer $TOKEN" -d '{"mcp_enabled":true,"mcp_allow_deletes":false,"mcp_system_prompt_enabled":true,"mcp_system_prompt":"...","project_name":"yesid.dev CMS","project_url":"https://yesid.dev","project_color":"#E07800","project_descriptor":"Directus 11 backend for yesid.dev"}'
# 8) Create ai-editor role + user + static API token + verify MCP
ROLE_ID=$(curl POST .../roles -d '{"name":"AI Editor","icon":"smart_toy","description":"..."}' | jq .data.id)
USER_ID=$(curl POST .../users -d "{\"first_name\":\"AI\",...,\"role\":\"$ROLE_ID\"}" | jq .data.id)
AI_TOKEN=$(openssl rand -hex 40)
curl PATCH .../users/$USER_ID -d "{\"token\":\"$AI_TOKEN\"}"
curl POST .../mcp -H "Authorization: Bearer $AI_TOKEN" -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
# → 7 tools: system-prompt, items, files, folders, assets, trigger-flow, schema ✓
# 9) Save secrets to 1Password (4 items succeeded; ai-editor token save deferred — op CLI session timed out)
op item create --category="API Credential" --vault=yesid-dev --title="Cloudflare R2 - yesid.dev-cms" ...
op item create --category="API Credential" --vault=yesid-dev --title="Cloudflare API Token - R2 bucket scope" ...
op item create --category=LOGIN --vault=yesid-dev --title="Directus admin - cms.yesid.dev" ...
op item create --category="API Credential" --vault=yesid-dev --title="Directus env secrets - KEY + SECRET" ...
# 10) Capture initial schema snapshot + commit
mkdir -p infra/directus
curl -H "Authorization: Bearer $TOKEN" "https://...up.railway.app/schema/snapshot?export=yaml" -o infra/directus/snapshot.yaml
# 11) PR #3 (Task 3a + 3c)
git add .github/workflows/schema-apply.yml infra/directus/snapshot.yaml
git commit -m "chore(slice-18 task-3c): initial Directus schema snapshot + CI apply workflow"
git push  # → updates open PR #3 with Task 3c commits
```

## 17) Validation results

**Task 0:**
- `ls docs/slices/slice-18/` → 4 files (plan/spec/research/handoff.md), 0 subdirectories ✅

**Task 1 (both PRs merged):**
- `grep -rn "@payloadcms\|payloadcms" yesid.dev-cms/` (excluding node_modules/.next/.vercel/.git) → 0 matches ✅
- yesid.dev-cms tracked file count after PR #2 merge → 4 (`.gitignore`, `.nvmrc`, `README.md`, `vercel.json`) ✅
- yesid.dev `grep "@payloadcms" src/ package.json` → 0 matches ✅
- yesid.dev `bun run check` → 0 errors, 4,043 files, 20 pre-existing warnings (unrelated) ✅
- yesid.dev `bun run test` → 95 files, 968 tests, all passed ✅

**Task 2 (pre-cleanup commit `1535fa5`):**
- `bun run check` post-cleanup → 0 errors, 4,043 files, same 20 pre-existing warnings ✅

**Task 2 (research):**
- `grep "TBD" docs/slices/slice-18/spec.md` on D1/D2/D3 sections → 0 matches ✅
- research.md has populated findings under all pre-reserved subsections + 2 new sections (MCP server, Recent Directus releases) ✅
- spec.md Amendments log records: Task 2 resolution + Vercel Blob driver revision ✅
- plan.md Tasks table updates: 0 + 1 + 2 marked shipped; Task 3 marked next ✅

**Task 3 (Directus production deploy):**
- Railway build of `directus/directus:11.17.3@sha256:ae6ab737fd04...` → SUCCESS (deployment `cc20477c-62ff-47ce-91a7-977e3e26d675`) after the EMAIL_SMTP_* vars were removed. Earlier attempts (3) FAILED on healthcheck because the SMTP outbound to `smtp.resend.com:587` hung (`code: ETIMEDOUT, command: CONN`) — Railway egress blocks port 587.
- `curl https://directus-cms-production-df43.up.railway.app/server/health` → `{"status":"ok"}` ✅
- Login as private-contact-07@example.invalid` → 321-char access token ✅ (vs 4-char NULL on the previous deploy where the template's hardcoded `example@email.com` had been bootstrapped — fixed by removing `DIRECTUS_TEMPLATE` env)
- Neon MCP `get_database_tables` → 29 tables, ALL `directus_*` ✅
- Directus `/collections?limit=-1` → 0 user collections (truly clean, no template demo content) ✅
- File upload (`POST /files` text payload, 46 bytes) → returns `{id: "95c39b57-...", filename_disk: "<id>.txt", storage: "s3", filesize: "46"}` ✅
- File roundtrip (`GET /assets/<id>`) → exact uploaded bytes ✅
- MCP endpoint `POST /mcp` `initialize` → `{"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{},"prompts":{}},"serverInfo":{"name":"directus-mcp","version":"0.1.0"}}}` ✅
- MCP `tools/list` with `ai-editor` Bearer token → 7 tools (system-prompt, items, files, folders, assets, trigger-flow, schema) ✅
- `GET /schema/snapshot?export=yaml` → 369-byte YAML, `version: 1`, `directus: 11.17.3`, `vendor: postgres`, empty `collections`/`relations` ✅
- yesid.dev untouched: `git status` clean since Task 2 cleanup commit `1535fa5`

## 18) Errors encountered

*(Append-only; empty unless errors hit.)*

## 19) Assumptions made

- **Schema / data shape:** current `staticAdapter` + `ContentAdapter` interface defines target shape for Directus collections (Task 2 validates).
- **Naming / conventions:** `yesid-dev-cms` keeps that name (hyphen, not dot) even after Payload removal — becomes the Directus-install shell.
- **Provider IDs:** Resend, Neon, domain ownership all unchanged across migration.
- **URLs / endpoints:** `cms.yesid.dev` persists; only the backend behind it changes.
- **Storage:** TBD — Task 2.
- **Local / dev environment:** Windows 11 + Bun + SvelteKit 2 for yesid.dev; yesid-dev-cms is Next.js 15 → becomes Directus host.
- **Package / dependency versions:** Directus 11+ (per research-slice pivot).
- **Folder structure:** flat `docs/slices/slice-18/` enforced.
- **Operational behavior:** hard cutover at Task 3/4, not gradual dual-run.

## 20) Peer review notes

*(Populated at slice close via Codex cross-tool adversarial review — per `feedback_codex_review_at_slice_close.md`.)*

## 21) Known gaps / deferred work

- Auth for non-admin surfaces: N/A (none exist).
- Content redesign: deferred to future slices.
- CI-gated preview deploys for content changes: deferred (likely slice-19+).

## 22) Deferred risks

- `cms.yesid.dev` admin downtime between Task 1 merge and Task 3 install — accepted (no public user-facing impact). Revisit: Task 3 launch.

## 23) Summary

*(Added at `/workflow-close-slice`.)*

## 24) PR Body

*(Added at `/workflow-close-slice`.)*

## 25) Next recommended prompt

### Task 8 — Two-repo decoupling + minimal toolchain on yesid.dev-cms (2026-04-23)

```text
Session type: Implementation (two-repo decoupling). Paired PRs (yesid.dev-cms + yesid.dev).
Tool: Claude Code (Opus 4.7 [1m], reasoning=high). Sonnet 4.6 acceptable for the minimal toolchain setup.
Focus: Task 8 — move seed script from yesid.dev to yesid.dev-cms; re-init yesid.dev-cms with minimal package.json; add rotation-policy docs; scaffold cross-repo contract test.

Context:
- Task 2b (prior session) locked D4–D12 and designed Tasks 8–15. Read docs/slices/slice-18/{plan,spec,research,handoff}.md.
- This is the FIRST post-decoupling task. Subsequent tasks (10–14) follow the paired-PR pattern: yesid.dev-cms PR (schema + seed) lands + applies to prod FIRST, then yesid.dev PR (adapter + flip).
- No schema changes this task. No content changes. Just repo shape + tooling.

In-scope (yesid.dev-cms):
1. Re-init with minimal package.json: { "type": "module", "devDependencies": { "@directus/sdk": "^20", "zod": "^3", "bun-types": "latest" }, "scripts": { "seed:services": "bun scripts/seed-services.ts", ... } }
2. Copy yesid.dev/scripts/seed-directus-services.ts → yesid.dev-cms/scripts/seed-services.ts. Inline minimal row shape (don't import from yesid.dev — no cross-repo git coupling). Data source: committed services.json (exported from yesid.dev's src/lib/content/services.ts) sitting in yesid.dev-cms/fixtures/.
3. Add scripts/seed-services.ts invocation to .github/workflows/schema-apply.yml as an optional workflow_dispatch input `seed: true`.
4. Update yesid.dev-cms/README.md Operations section: VERCEL_BYPASS_TOKEN + EDITOR_PREVIEW_TOKEN rotation policy (generate via `openssl rand -hex 32`; rotate every 90d or on leak; update Railway Vars → redeploy; update Vercel env → redeploy; verify).

In-scope (yesid.dev):
5. Delete scripts/seed-directus-services.ts (now lives in yesid.dev-cms).
6. Add .github/workflows/contract-test.yml — skipped-by-default integration test that checks out both repos, spins ephemeral Directus with yesid.dev-cms/infra/directus/snapshot.yaml, seeds a fixture row per collection, runs bun test src/lib/adapters/directus.integration.test.ts (new file, tagged integration). Enable via PR label 'contract-test' or schedule nightly.

Paired-PR merge order:
1. yesid.dev-cms PR first. Merge after CI green. No prod-apply yet (no schema change).
2. yesid.dev PR second. Delete scripts/seed-directus-services.ts. Merge after yesid.dev-cms PR merges.

Hard constraints:
- No schema changes in Directus (no .yaml mutation, no Data Studio click).
- No content changes.
- Seed script data exported ONCE to yesid.dev-cms/fixtures/services.json; yesid.dev's src/lib/content/services.ts stays authoritative through Slice 18, then becomes frozen-reference in Slice 19+.
- No bun install in yesid.dev-cms that pulls in build tooling — stay minimal (SDK + zod + bun-types only).

Validation:
- yesid.dev-cms: `bun install` succeeds with 3 devDeps. `bun run seed:services` (dry-run or against ephemeral Directus) completes.
- yesid.dev: bun run check + bun run test green (unchanged).
- Both PRs: paired links in descriptions; yesid.dev-cms merges first, yesid.dev merges second.
- Cross-repo contract test workflow present but skipped by default (won't run on every PR — opt-in via label).

STOP at Task 8 close. Owner verifies + greenlights Task 9 (asset pipeline migration).
```

### Prior session's recommended prompt (Task 3/4 era — kept for historical context)

```text
Session type: Manual dashboard ops (user) → then implementation (DirectusAdapter wiring).
Tool: Claude Code (Opus 4.7 [1m], reasoning=high). Sonnet 4.6 acceptable for the adapter scaffolding.
Focus: Close out Task 3 manual ops + start Task 4 — write the DirectusAdapter against the live Railway Directus.

Manual ops to do FIRST (Yesid, in browser tabs):
1. Drop the PostGIS Railway service → https://railway.com/project/6da31832-268c-4c26-a7f6-3fc09ebf943f → PostGIS service → Settings → Delete Service.
2. Add cms.yesid.dev as Railway custom domain → Directus CMS service → Settings → Custom Domain → cms.yesid.dev → Railway returns a CNAME target like xxx.up.railway.app.
3. Cloudflare DNS → yesid.dev zone → DNS Records → cms.yesid.dev (currently CNAME → b76ed8df3d024b08.vercel-dns-017.com) → update to Railway's CNAME target → Proxy can stay ON (Railway plays nicely with Cloudflare proxying).
4. Wait ~2 min for Railway auto-TLS to issue the cert (status visible in Railway dashboard). Verify: curl -sf https://cms.yesid.dev/server/health → {"status":"ok"}.
5. Update Railway env: PUBLIC_URL=https://cms.yesid.dev (currently https://directus-cms-production-df43.up.railway.app).
6. Vercel Dashboard → mgkdantes-projects → yesid-dev-cms project (prj_Joj5MVld6v58XOfDzGWrIF3bo6vj) → Settings → Delete project. Vercel.json on yesid.dev-cms can stay (harmless guard) or be removed in a follow-up.
7. (Optional) op signin → save the ai-editor MCP token from %TEMP%/directus-ai-editor-token.txt to 1P (recipe in handoff § 16).
8. (Optional) Register MCP with Claude Code: claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/mcp --header "Authorization: Bearer <ai-editor-token>".

Then start Task 4 (Claude Code, in this session):
- Read docs/slices/slice-18/{plan,spec,research,handoff}.md (Task 3 block + Mermaid diagram in handoff is the architecture.)
- Read src/lib/adapters/{index.ts, static.ts, types.ts} for the contract Directus must satisfy.
- Install @directus/sdk in yesid.dev (bun add @directus/sdk).
- Create src/lib/adapters/directus.ts:
  - createDirectus<Schema>(PUBLIC_DIRECTUS_URL, { globals: { fetch } }).with(staticToken(DIRECTUS_READ_TOKEN)).with(rest())
  - Implement toLocalizedString(translations, field, fallback='en'): LocalizedString
  - Stub all 6 ports (projects/services/blog/meta/techStack/content) — but only fully implement ONE port (services — smallest surface, easiest parity check).
- Add env: PUBLIC_DIRECTUS_URL (in $env/static/public) + DIRECTUS_READ_TOKEN (in $env/static/private).
- Don't flip src/lib/adapters/index.ts:6 yet — that flips when Task 5 has at least the services collection in Directus AND Task 6 seeded it.
- Run bun run check + bun run test → must stay green.

Hard constraints:
- NO modification of repositories, components, or routes (just adapter + types).
- NO floating directus version (pin in Dockerfile if Task 4 introduces one; SDK uses any v20.x).
- Site stays on staticAdapter throughout Task 4 (parity check happens at Task 7).
- Directus collections aren't designed yet — Task 4 stubs the adapter, Task 5 designs the model in Data Studio + re-snapshots, Task 6 seeds.

Validation: bun run check + bun run test green; new directus.ts compiles; toLocalizedString function unit tests pass; src/lib/adapters/index.ts re-export still points at staticAdapter (no production change).

STOP after Task 4 close. Owner verifies + greenlights Task 5 (real schema design in Data Studio).
```

Read these files first:
1. docs/slices/slice-18/{plan,spec,research,handoff}.md  (Task 2 decisions are binding)
2. https://directus.io/docs/self-hosted/quickstart  (fresh fetch — pin to Directus docs for 11.17.x)
3. https://railway.com/deploy/directus-cms  (official template)
4. https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/  (R2 S3-compat config reference)

Important context:
- yesid.dev-cms is a clean-slate repo: `.gitignore` + `.nvmrc` + `README.md` + `vercel.json` (ignoreCommand guard). Nothing else. Directus install will add the Directus files + snapshot.yaml + seed script scaffolding.
- yesid.dev adapter still on `staticAdapter`. Don't touch. Public site is unaffected during Task 3.
- Version pin: `directus/directus:11.17.3` (do NOT float `latest` — Directus 12 license revision pending).
- Neon Postgres: reuse the existing yesid.dev-cms project (from the Payload era). Connection string is in Yesid's 1Password.
- Domain: `cms.yesid.dev` DNS is currently pointed at the retired Vercel project. Do NOT flip the DNS until Directus serves HTTPS successfully on a temporary Railway domain; only then cut over.
- Resend + DKIM + SPF: preserve. Email adapter for Directus likely needs SMTP or API config — verify during Task 3 pre-flight.

Implement only this scope:
1. Provision Railway project from the official Directus template.
2. Swap `DB_*` env to the Neon connection string (unpooled for admin, pooled for read paths).
3. Create R2 bucket + access keys; set Directus storage env per research.md § Storage options.
4. Boot Directus against Neon. Create the first admin user. Verify Data Studio loads.
5. Define an initial schema (minimal — just `site_meta` singleton as smoke test; full schema lands across Tasks 4–6). Commit a first `infra/directus/snapshot.yaml` to yesid.dev-cms via a new branch + PR.
6. Add a GitHub Actions workflow in yesid.dev-cms that applies the snapshot to an ephemeral Directus in PRs.
7. Configure Railway custom domain → `cms.yesid.dev` with auto-TLS. Once HTTPS serves cleanly, flip the A/CNAME from the old Vercel project to Railway. Retire the Vercel project on yesid.dev-cms.
8. Enable native MCP server. Create `ai-editor` role. Generate token. Confirm Claude Code can connect to `https://cms.yesid.dev/mcp`.
9. Write Task 3 block in handoff.md with tool attribution + commit SHAs + verification output (curl tests).

Hard constraints:
- NO changes to yesid.dev site code in Task 3. Adapter swap is Task 4.
- NO modifications to the research slice bundle.
- NO custom Directus extensions. Built-ins only (R5 from plan's Risks).
- NO Directus 12. Pin 11.17.3.
- NO DNS flip until Directus serves TLS on the new host.
- Data-destructive actions (schema apply with field removals) need owner approval before prod.

Validation to run:
- Directus admin serves on Railway temporary domain → login works.
- Once domain flips: `curl https://cms.yesid.dev/server/health` → 200.
- `curl https://cms.yesid.dev/items/site_meta` with bearer token → JSON payload.
- MCP: `claude mcp list` shows `yesid-cms-prod`; `claude mcp call yesid-cms-prod read-me` returns the ai-editor user.
- yesid.dev still green: `bun run check` + `bun run test`.

STOP at Task 3 close. Ask owner to verify before Task 4 (DirectusAdapter swap).
```

## 26) Cross-tool handoff context

```text
Current project state:
- yesid.dev main at 8960b51 (PR #35 merged — scorch of prior slice-18 docs).
- yesid.dev still reads content via staticAdapter; zero @payloadcms refs in the site.
- yesid-dev-cms (sibling repo) runs Payload 3.x at cms.yesid.dev. Task 1 deletes that code.
- slice-18 bundle opened fresh on feature/slice-18: flat docs/slices/slice-18/ with plan/spec/research/handoff.

What this slice-opening session changed:
- Created the 4-file flat bundle. No site code changes.
- (After Task 1 merges in yesid-dev-cms): zero Payload code in yesid-dev-cms; cms.yesid.dev admin offline until Task 3.

Key file paths:
- Slice bundle: docs/slices/slice-18/{plan,spec,research,handoff}.md
- Adapter seam (unchanged): src/lib/adapters/index.ts
- Static adapter (unchanged, active): src/lib/adapters/static.ts
- Content modules (unchanged): src/lib/content/*.ts
- Research reference: docs/slices/slice-headless-cms-best-practices/

Required env / runtime config: none new this session.

Required next step: Task 2 — Directus research (spec D1/D2/D3 resolution).
```

## 27) Final Status

🟡 **IN PROGRESS** — Tasks 0–7 + Task 2b shipped. yesid.dev `feature/slice-18` head: Task 7 at `a373bf5` + Task 2b docs commit (TBD — authored pre-commit in this session). services content-type live from cms.yesid.dev via hybrid adapter; 5 other ports still on static. yesid.dev-cms main is at `4963c94` (PRs #5 + #6 merged).

**Task 2b outcome (2026-04-23):** mid-slice scope correction captured. Slice 18 now explicitly covers full migration of all 6 content types + two-repo decoupling (yesid.dev + yesid.dev-cms ship independently through the adapter-seam contract). Spec D4–D12 locked via 3 parallel research agents over Directus 11.17.3 docs: Visual Editor, Content Versioning, Preview routes (shape locked, implementation deferred Slice 19+), M2A pages, Flows → revalidation, Asset pipeline, Role/policy matrix, Extensions posture (zero custom), Repo-separation boundary. Q5 revised; Q8–Q12 resolved. Plan rewrote Tasks table: Tasks 8–15 replace the prior one-line "Task 8 slice close" placeholder.

**Remaining (7 tasks, ~5–7 sessions):**
- Task 8 — two-repo decoupling (seed script migration; minimal `package.json` on yesid.dev-cms; rotation policy; contract-test scaffold)
- Task 9 — asset pipeline migration (`static/images/*` → Directus + R2)
- Tasks 10–13 — projects / blog / tech-stack / meta (parallelizable after Task 9)
- Task 14 — site-chrome via M2A pages (largest remaining task)
- Task 15 — slice close (role/policy tighten; optional Flow revalidation; peer review; PR; memories)

**Verification (Task 2b):** `bun run check` + `bun run test` unchanged (no code touched). Docs-only commit.
