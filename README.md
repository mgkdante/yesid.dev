# yesid.dev-cms

Directus 11+ CMS backend for [yesid.dev](https://yesid.dev). Currently scaffolded, awaiting provisioning.

The authoritative plan lives in the consumer repo: **[yesid.dev/docs/slices/slice-18](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18)** — start there for decisions, tasks, research findings.

## Current state

| Field | Value |
|-------|-------|
| Backend | Scaffolded (no runtime yet). Directus install lands in slice-18 Task 3b. |
| Version pin | `directus/directus:11.17.3` (Directus 11; don't float `latest` — Directus 12 license revision pending) |
| Hosting target | **Railway Hobby** (~$5/mo). See slice-18 spec § D1. |
| Database | **Neon Postgres** (BYO — preserved across migration) |
| Storage | **Cloudflare R2** via Directus's built-in `s3` driver (`$0` egress, 10 GB free). See slice-18 spec § D2. |
| Email | **Resend** (preserved; SMTP config) |
| Admin URL | `cms.yesid.dev` — offline until Task 3b DNS cutover |
| Consumer site | [yesid.dev](https://yesid.dev) — unaffected, reads content from a static TypeScript adapter throughout the migration |

## Provisioning checklist (Task 3b — dashboard work)

> Run this once to stand up the production instance. Every step is in an external dashboard — no code changes.

### 1. Prerequisites

- Neon Postgres project (already provisioned — reuse the existing `yesid-dev-cms` project).
  - Get the **pooled** connection string from Neon Console → the production branch → Connection details.
- Cloudflare account (free tier).
- Railway account (free tier for trial; Hobby plan required for production).
- The pre-merged PR: `.env.example` + `infra/directus/` scaffold.

### 2. Cloudflare R2 bucket + keys

1. Cloudflare Dashboard → **R2** → Create bucket `yesid-dev-cms`.
2. Navigate to **Manage R2 API Tokens** → Create token → Object Read & Write → scope to the bucket.
3. Save the Access Key ID, Secret Access Key, and the S3 Endpoint URL (format `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
4. Paste into the `STORAGE_S3_*` vars (see `.env.example`).

### 3. Railway project from the Directus template

1. https://railway.com/deploy/directus-cms → deploy.
2. Railway provisions: Directus + Postgres + Redis + S3-compat storage.
3. In Railway Dashboard → your project → **Variables**:
   - **Replace** the auto-provisioned Postgres → set `DB_CONNECTION_STRING` to Neon's pooled URL.
   - **Remove** the Railway-provisioned Postgres plugin if we aren't using it (free the resource).
   - Replace storage vars with the R2 values from step 2.
   - Set `KEY` + `SECRET` (generate: `openssl rand -hex 16` and `openssl rand -hex 32`).
   - Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (temporary — you'll rotate after first login).
   - Paste every other block from `.env.example`.
4. Verify the Directus image pins to `directus/directus:11.17.3` (Railway → Settings → Source → override if needed).
5. Deploy. Wait for the health check to go green.

### 4. First admin + rotate credentials

1. Open the Railway-assigned temporary domain (e.g. `directus-xxx.up.railway.app`).
2. Log in with the `ADMIN_EMAIL` + `ADMIN_PASSWORD` from the env.
3. Data Studio → User menu → change the admin password to something stored only in 1Password.
4. Railway → Variables → **delete** `ADMIN_EMAIL` and `ADMIN_PASSWORD` (they're bootstrap-only).

### 5. Custom domain + DNS cutover

1. Railway → Settings → Custom Domain → add `cms.yesid.dev`.
2. Railway shows the required CNAME target (a `*.up.railway.app` host).
3. **Only once Railway finishes auto-TLS on the temporary domain**: DNS provider for `yesid.dev` → update the `cms` A/CNAME to point at Railway's target (removing the prior Vercel record).
4. Wait for DNS propagation + Railway's TLS cert issuance (usually a few minutes).
5. Verify `https://cms.yesid.dev/server/health` returns 200.

### 6. Retire the old Vercel project

1. Vercel Dashboard → the `yesid-dev-cms` project (was Payload) → Settings → Delete.
2. (Optional) Remove the Vercel integration from the GitHub repo. `vercel.json` in this repo can be deleted in the Task 3c follow-up commit.

### 7. Enable MCP (native since v11.13)

1. Data Studio → Settings → AI → enable MCP server.
2. Roles → Create **`ai-editor`** → scope to content collections only (no `directus_users`, no `directus_settings`, no system collections).
3. Users → Create a dedicated MCP user in the `ai-editor` role → generate a static access token.
4. Register with Claude Code:
   ```bash
   claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/mcp \
     --header "Authorization: Bearer <AI-EDITOR-TOKEN>"
   ```

### 8. Report back

Once the production URL serves Data Studio on `https://cms.yesid.dev`, ping for Task 3c: schema snapshot capture + CI workflow + final handoff block.

## Local development (optional)

Pull the Directus image and run against a local Postgres, or against your Railway instance's staging branch:

```bash
cp .env.example .env
# fill .env with dev values (local Postgres or Neon dev branch, R2 optional)
docker run --rm -p 8055:8055 --env-file .env directus/directus:11.17.3
# open http://localhost:8055
```

No `package.json` — Directus is the app. This repo is config + snapshots + scripts only.

## Why these choices (TL;DR)

| Choice | Alternatives rejected | Why |
|---|---|---|
| Railway hosting | Directus Cloud ($15/mo, no Neon BYO) · Fly.io (PAYG) · Hetzner (DIY TLS) · Vercel (non-starter for Directus) | Official Directus template + BYO Neon + auto-TLS + $5/mo predictable cost. Best DX-per-dollar at this scale. |
| Cloudflare R2 storage | Vercel Blob (no Directus driver) · AWS S3 ($0.09/GB egress) · Backblaze B2 (needs CDN layer) | `$0` egress to Vercel frontend + 10 GB free + built-in `s3` driver + S3-compat portability. |
| Schema snapshot in Git | Data Studio-only · hand-rolled SQL | Reviewable PR diffs + reproducible + drift-detection. |
| Markdown for blog | Block Editor | Preserves `marked.parse` pipeline on yesid.dev; zero consumer changes. |
| Native Translations field | JSON-per-field · collection-per-locale | Directus-idiomatic editor UX + adapter-boundary `toLocalizedString` transform keeps `LocalizedString` shape unchanged. |

Full rationale in [yesid.dev slice-18 spec § Design decisions](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/spec.md).

## Related

- [yesid.dev slice-18 plan](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/plan.md) — task roadmap
- [yesid.dev slice-18 research.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/research.md) — Directus findings
- [Pivot research](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-headless-cms-best-practices) — why Directus beat Payload (append-only reference)
