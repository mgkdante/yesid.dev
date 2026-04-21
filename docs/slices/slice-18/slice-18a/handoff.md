# Sub-Slice 18a — Handoff

> This file is the body of the `yesid.dev` PR (PR B, per spec D11). It grows per-task during execution and is finalized at 18a-6. Cross-repo `yesid.dev-cms` PR uses a copy of this at merge time.

**Status:** ✅ COMPLETE — All 6 tasks shipped. PR body summary below.

---

## What shipped so far

### Task 18a-1 — CMS repo scaffolded, bun-converted, pushed to origin ✅ COMPLETE

- Empty private repo created: [`mgkdante/yesid.dev-cms`](https://github.com/mgkdante/yesid.dev-cms).
- Payload 3.83.0 + Next.js 16.2.3 + React 19.2.4 blank template scaffolded to `C:\Users\otalo\Yesito\Projects\yesid-dev-cms\` (dir name without period per npm convention; repo name retains `.` to match brand).
- Postgres DB adapter `@payloadcms/db-postgres@3.83.0` pinned.
- Scaffold converted from its default pnpm/mixed setup to **pure bun** (D1):
  - `packageManager: bun@1.3.11`, `engines.bun >=1.2.0`, `engines.node >=22.0.0 <23.0.0`
  - `trustedDependencies: [sharp, esbuild, unrs-resolver]` (bun-native replacement for `pnpm.onlyBuiltDependencies`)
  - `.npmrc` + `.yarnrc` deleted
  - `.nvmrc = 22`
  - Test scripts migrated from `pnpm run` to `bun run`
  - `migrate` + `migrate:create` scripts added
- `bun.lock` generated (text format, bun 1.3.11) and committed.
- 2 commits on `origin/main`:
  - `80f2e05` — `feat: initial commit` (scaffold)
  - `a541d29` — `chore(cms-slice-18a): convert scaffold to bun + Node 22 + project metadata`

### Task 18a-1 local heartbeat verified

- Neon dev branch provisioned by Yesid; pooled connection string written to `yesid-dev-cms/.env` (gitignored).
- `bun dev` → Next.js ready in 605 ms; Payload pulled schema from Neon auto-push path; admin UI reachable at `http://localhost:3000/admin`.
- First admin user created via Payload's first-run UI → persisted in Neon `users` table.
- `src/payload-types.ts` auto-regenerated for Postgres numeric IDs; diff committed as `b33b2da`.
- Dev server stopped cleanly.

**Total commits on `origin/main`:** 3 (`80f2e05` scaffold + `a541d29` bun conversion + `b33b2da` types regen).

### Task 18a-2 — `payload.config.ts` wired, scaffold cruft removed ✅ COMPLETE

- 3 new dependencies: `@payloadcms/storage-vercel-blob@3.83.0`, `@payloadcms/email-resend@3.83.0`, `@payloadcms/plugin-mcp@^3.83.0`.
- `src/payload.config.ts` rewritten to declare every Slice 18 design decision at once:
  - `postgresAdapter` with `push: false` + `migrationDir: ../migrations` (prodMigrations wired in 18a-3).
  - `vercelBlobStorage` plugin registered (self-disables without token; collections empty per D4).
  - **`mcpPlugin` (D12)** — `site-meta` global exposed with `find` + `update` tools. Content collections register in 18b.
  - `resendAdapter` — sender `no-reply@cms.yesid.dev`.
  - Localization `en`/`fr`/`es`, fallback enabled.
  - Admin `titleSuffix: ' — yesid.dev CMS'`.
  - `onInit` bootstrap hook (idempotent admin creation from env vars).
- `src/access/isAdmin.ts` — type-guard helper narrows `User | PayloadMcpApiKey` union for access rules.
- `src/collections/Users.ts` — added `roles` field + gated access via `isAdmin()`.
- `src/globals/SiteMeta.ts` — heartbeat global (`siteName`, `deployedAt`), `beforeChange` hook sets `deployedAt` to ISO timestamp on every save.
- `.env.example` — documents all required env vars (DATABASE variants, PAYLOAD_SECRET, SERVER_URL x2, BLOB_READ_WRITE_TOKEN, RESEND_API_KEY, PAYLOAD_ADMIN_EMAIL/PASSWORD).
- Scaffold cruft removed: `src/app/(frontend)/`, `src/app/my-route/`, `tests/`, `Dockerfile`, `docker-compose.yml`, `test.env`, `playwright.config.ts`, `vitest.config.mts`, `vitest.setup.ts`, 6 test-related devDeps.
- `bunx tsc --noEmit` green. Commit `9da6638` pushed.
- **Total commits on `origin/main`:** 4.

### Task 18a-3 — Initial migration + heartbeat + MCP smoke test ✅ COMPLETE

- `bunx payload migrate:create` generated `migrations/20260421_035719.{ts,json}` + `migrations/index.ts` barrel (full schema: enums for locales/roles; tables for users, users_sessions, users_roles, media, site-meta, payload_mcp_api_keys, payload_kv, payload_preferences, payload_locked_documents, payload_migrations).
- `bunx payload migrate:fresh` — dropped auto-pushed tables + reapplied migration cleanly from blank state. 1 row in `payload_migrations`.
- `prodMigrations: migrations` wired in `payload.config.ts`; Vercel cold-start runtime-migrate path ready (D7).
- `onInit` bootstrap proven locally — created admin from `.env` (`contact@yesid.dev`). Idempotent across server restarts (no duplicate admin on second boot).
- **Heartbeat verified end-to-end via REST:** login → update `site-meta.siteName` via `POST /api/globals/site-meta` → `beforeChange` hook auto-set `deployedAt` to ISO timestamp → persisted across `bun dev` stop/restart cycles.
- **MCP endpoint (D12) verified end-to-end locally** (ahead of scheduled 18a-5 prod run): Yesid generated an API key via admin UI → 3 curl calls (`initialize`, `tools/list`, `tools/call findSiteMeta`) all returned 200 with expected JSON-RPC responses. `findSiteMeta` + `updateSiteMeta` tools exposed with localization params. Three-way consistency confirmed (admin UI ↔ REST ↔ MCP).
- `admin.theme: 'dark'` set as default in config (user preference).
- `bun run build` green — prod build compiles, 4 routes detected (`/admin/*`, `/api/*`, `/api/graphql`, `/api/graphql-playground`).
- Commits: `fca7ddc` (migration + heartbeat) + `0e01be5` (dark theme). **Total on `origin/main`:** 6.

### Task 18a-4 — External service provisioning + first prod deploy ✅ COMPLETE

- **Neon:** `yesid-dev-cms` project (org `Yesid`, id `sparkling-sky-51665073`), 2 branches: `production` (primary) + `dev` (local). Pg 17, region `aws-us-east-1`.
- **Vercel:** `yesid-dev-cms` project, Node 24.x runtime (build uses `.nvmrc=22`), imported from GitHub, Neon Marketplace integration auto-wired `DATABASE_URL` + `DATABASE_URL_UNPOOLED`.
- **Env vars set via CLI** (7 manual + 2 auto-set by Neon): `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_ADMIN_EMAIL`, `PAYLOAD_ADMIN_PASSWORD`, `RESEND_API_KEY`.
- **Hiccup resolved:** Windows Git Bash appended trailing `\r` to openssl-generated env values (`PAYLOAD_ADMIN_PASSWORD`, `PAYLOAD_SECRET`). First deploy's `onInit` created admin with tainted password → login blocked → hit 5-attempt rate limit. Remediated by deleting tainted user via Neon SQL (MCP), re-setting env with literal strings, redeploying. Documented for spec risk register.
- **DNS:** CNAME `cms.yesid.dev` → `cname.vercel-dns.com` (DNS-only, no proxy) added by Yesid via Cloudflare dashboard. Note: Cloudflare MCP has no DNS record tools — future DNS automation needs a CF API token with Zone.DNS:Edit scope.
- **Blob:** 2 stores exist (`yesid-dev-cms-media` + accidental `yesid-dev-cms-media2`), neither project-linked. TTY blocker on `vercel blob create-store` interactive flow; Payload config self-disables plugin without `BLOB_READ_WRITE_TOKEN` so deploy proceeds. Linking deferred to Yesid as 3-click dashboard step.
- **Deploy:** Production deploy green, `cms.yesid.dev` certificate issued, HTTPS serving 200 at `/admin` + `/api/*`.
- **Prod verification:**
  - ✅ REST login with `contact@yesid.dev` — Authentication Passed.
  - ✅ REST `site-meta` edit persisted — `siteName: "yesid.dev (prod heartbeat 18a)"`, `deployedAt` hook fired.
  - ✅ MCP endpoint 401 without auth, 200 with valid Bearer.
  - ✅ MCP 3-call smoke test (initialize / tools/list / findSiteMeta) — all ✓, three-way consistency (admin UI ↔ REST ↔ MCP) confirmed on prod.
  - ✅ `yesid-cms-prod` MCP server registered in Claude Code (`C:\Users\otalo\.claude.json` project-scoped).
- **Commits in this task:** 0 (all provisioning via CLI/MCP, no code changes).

### Task 18a-5 — Rotate admin + delete bootstrap env vars + verify idempotency ✅ COMPLETE

- Yesid rotated admin password via prod admin UI; saved to password manager.
- Removed `PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD` from Vercel env.
- Redeploy triggered, aliased to `cms.yesid.dev` in 2 min.
- Cold start: no `[slice-18a] Bootstrap admin created` log line (env-guard in `onInit` correctly skips create path when env vars absent).
- Neon SQL confirmed single user row (`id=2, contact@yesid.dev, roles=[admin]`), **no duplicate admin** from second cold start.
- Rotated password still authenticates post-env-cleanup → user record persists independent of env vars (the intended invariant).
- **Commits in this task:** 0 (Vercel env operations + deploy only, no code).

### Task 18a-6 — Bundle close ✅ COMPLETE

- Wrote `yesid.dev-cms/{README.md, AGENTS.md, CLAUDE.md}` — commit `e7deca3` pushed to `yesid.dev-cms@main`.
- Updated `yesid.dev/docs/reference/ARCHITECTURE.md` with two-repo topology subsection (Neon + Blob + Resend + MCP + migration pipeline 18a→18f).
- Updated `yesid.dev/docs/slices/slice-18/README.md` sub-slice table — 18a row = shipped 2026-04-21 (added Status column).
- Updated `yesid.dev/docs/roadmap/PLAN.md` Slice 18 row — `planned` → `in progress — 18a shipped`.
- Regenerated `tree.txt`.

---

## What shipped in 18a (single-line summary)

Stood up `yesid.dev-cms` — framework-agnostic Payload 3 CMS with native MCP surface — from scratch to a live production deployment at `https://cms.yesid.dev` backed by Neon Postgres + Vercel Blob + Resend, with `site-meta` heartbeat global as the proof collection, `onInit` admin bootstrap + rotation flow, three-way consistency (admin UI / REST / MCP) verified end-to-end on both local and prod. Zero code changes in `yesid.dev`; all migration mechanics stay to come in 18b onwards.

## Totals

- **`yesid.dev-cms`:** 7 commits on `main`, 0 PRs (greenfield repo, direct pushes for 18a).
- **`yesid.dev`:** 1 PR (this one, docs-only).
- **External services provisioned:** Neon project (1), Vercel project (1), Neon Marketplace integration, Vercel Blob store (created, link deferred), Resend API key, DNS CNAME (via Cloudflare).
- **Prod state:** admin UI reachable, REST + MCP both serving, migration applied, admin idempotent, free-tier usage well under cap.

## Amendments carried forward (for 18b pickup)

- Spec D1: bun override (Yesid's direction) — carried.
- Spec D12: MCP plugin first-class — wired + proven three-way on prod.
- Media collection stays (scaffold default) — 18b enables `vercelBlobStorage.collections.media = true` and wires uploads.
- Blob store link deferred — 3-click dashboard step Yesid can do at convenience (non-blocking; plugin self-disables without token).
- Windows Git Bash `\r` contamination — new risk-register entry for any future `openssl`-piped env vars. Use literal strings or `tr -d '\r'`.
- Cloudflare MCP DNS gap — documented; future DNS automation needs CF API token with Zone.DNS:Edit scope.
- Payload test harness (Playwright + Vitest) deleted from scaffold — re-introduce when 17f-style test architecture for the CMS is relevant (likely 18b+).

## Open items for 18b

- All remaining collections (`projects`, `services`, `blog-posts`, `tech-stack`, `stack-scenarios`) + globals (`home-content`, `about-content`, `contact-content`, `nav-links`, `error-pages`; extend `site-meta`).
- Seed script importing TS + MD from `yesid.dev`.
- Admin IA via `admin.group` per the direction doc.
- Link `yesid-dev-cms-media` Blob store; delete accidental `yesid-dev-cms-media2` duplicate.
- MCP collection-level registration for each new collection (`mcpPlugin.collections`).

---

## Amendments during execution

| # | Change | Rationale |
|---|--------|-----------|
| 1 | Directory name `yesid-dev-cms` (no period), not `yesid.dev-cms` (matches repo name). | Standard npm convention; period in dir name is unusual and can cause tooling edge cases. Repo retains period to match `yesid.dev` brand. Cosmetic mismatch only. |
| 2 | Media collection (scaffold default) kept in 18a despite spec non-goal. | Template ships `src/collections/Media.ts`; 18b will enable it. Keeping it now saves touching `payload.config.ts` twice. Vercel Blob plugin's `collections: {}` map stays empty per spec D4 until 18b flips `media: true`. |
| 3 | `unrs-resolver` postinstall fails on Windows + bun 1.3.11 with `Permission denied`. | Transitive dep of `eslint-config-next`. Workaround: `bun install --ignore-scripts`. Non-runtime (eslint-time only). Will document in `yesid.dev-cms/README.md` under "Local dev / Windows gotchas." |
| 4 | Scaffold was interactive (TTY required for DB prompt); run from Yesid's terminal, not headless bash. | `uv_tty_init EBADF` error in the assistant's bash tool. Matches spec D11 pattern of dashboard/TTY steps delegated to Yesid. Noted so 18b+ avoids the same trap. |

---

## Open items for downstream sub-slices

- **Directory rename** (`yesid-dev-cms` → `yesid.dev-cms`) — defer to 18a-6 close or leave permanent. Low priority.
- **18b pickup:** `Media` collection already exists from scaffold — 18b flips Blob plugin `collections.media = true` + adds the remaining content collections (`projects`, `services`, `blog-posts`, `tech-stack`, `stack-scenarios`) + globals.
- **18c pickup:** type-sync GitHub Action mirrors `yesid.dev-cms/payload-types.ts` into `yesid.dev/src/lib/cms-types.ts`.

---

## Verification so far

- `bun install --ignore-scripts` — green (751 installs, 911 packages, no changes after package.json edits).
- `git push -u origin main` — green; 2 commits visible at `https://github.com/mgkdante/yesid.dev-cms/commits/main`.
- `bunx tsc --noEmit` — NOT YET RUN (deferred to Task 18a-2 after config edits).
- `bun dev` — NOT YET RUN (blocked on DB).

---

## Free-tier usage snapshot

Not applicable at this stage (no external services provisioned yet — that's 18a-4).

---
