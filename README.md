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

A minimal `package.json` lives here for **scripts-only** tooling (seed, migration, snapshot tests). Directus itself runs from the pinned container image — this repo ships config + snapshots + scripts + tests only.

```bash
bun install          # installs @directus/sdk + zod + yaml + bun-types
bun test             # runs snapshot-shape + fixture + seed-dry-run tests (no network)
bun run seed:services  # seeds the live Directus (requires admin creds — see below)
```

## Repo layout

```
yesid.dev-cms/
├── infra/directus/
│   └── snapshot.yaml           # schema-as-code (authoritative)
├── fixtures/
│   └── services.json           # seed data (exported from yesid.dev/src/lib/content/services.ts)
├── scripts/
│   └── seed-services.ts        # idempotent seeder (exports pure transformation helpers for tests)
├── tests/
│   ├── services-fixture.test.ts    # Zod-validates fixtures/services.json
│   ├── seed-dry-run.test.ts        # unit tests on pure transformation helpers
│   └── snapshot-shape.test.ts      # asserts on snapshot.yaml structure (drift catcher)
├── .github/workflows/
│   ├── schema-apply.yml        # ephemeral smoke + prod-gated apply + bun test + optional seed
│   └── contract-test.yml       # checks out yesid.dev sibling; runs adapter integration test against our snapshot
├── package.json                # scripts-only; @directus/sdk + zod + yaml + bun-types
├── tsconfig.json               # strict mode; bun-types; scripts+tests+fixtures only
├── .env.example                # Directus env var template
└── README.md                   # this file
```

## Operations

### Running the seed against production

```bash
# 1) Pull the admin token from 1Password (no hand-copying credentials).
export DIRECTUS_ADMIN_TOKEN=$(op read "op://yesid-dev/directus-admin/credential")
export PUBLIC_DIRECTUS_URL=https://cms.yesid.dev

# 2) Seed.
bun run seed:services
```

Alternatively, set `DIRECTUS_ADMIN_EMAIL` + `DIRECTUS_ADMIN_PASSWORD` to use the `/auth/login` flow.

The seed is **nuke-and-recreate** — idempotent, safe to re-run. It clears the `services` domain tree (FK CASCADE removes translations, deliverables, sections) then re-creates from `fixtures/services.json` via the Directus SDK.

### Shared secret rotation policy

Two tokens are shared between this repo (Railway env) and the consumer repo (Vercel env):

| Token | Where used | Purpose |
|---|---|---|
| `VERCEL_BYPASS_TOKEN` | Directus Flow → Vercel ISR | `x-prerender-revalidate` header on Flow webhook ops that invalidate yesid.dev page cache after content publishes |
| `EDITOR_PREVIEW_TOKEN` | Directus Visual Editor → yesid.dev `/preview/*` routes | Validates preview-route requests against the `?token=…` query param |

**Rotate every 90 days** or immediately on suspected leak.

```bash
# 1) Generate a new token (≥ 32 chars per Vercel's requirement).
NEW_TOKEN=$(openssl rand -hex 32)

# 2) Update Railway (CMS side).
#    Dashboard → Directus CMS service → Variables → VERCEL_BYPASS_TOKEN (or EDITOR_PREVIEW_TOKEN) → set new value → Redeploy.
#    OR via CLI:
railway variables --service "Directus CMS" --set "VERCEL_BYPASS_TOKEN=$NEW_TOKEN"
railway redeploy --service "Directus CMS"

# 3) Update Vercel (consumer side).
#    Dashboard → yesid.dev project → Settings → Environment Variables → update → Redeploy latest production.
#    OR via CLI (requires `vercel env rm` then `vercel env add`):
vercel env rm VERCEL_BYPASS_TOKEN production
echo "$NEW_TOKEN" | vercel env add VERCEL_BYPASS_TOKEN production

# 4) Verify both sides.
#    Directus Flow: manually trigger via Data Studio → Flows → Log shows 200 from Vercel.
#    Preview route: curl -H 'x-prerender-revalidate: wrong-token' https://yesid.dev/preview/... → 401.
#                   curl -H 'x-prerender-revalidate: '"$NEW_TOKEN" https://yesid.dev/preview/... → 200.

# 5) Rotate the prior value out of 1Password after verification.
```

Never share either token outside the two repo env stores. Never commit them to Git. Never log them.

### Schema changes (Data Studio → snapshot.yaml → PR)

```bash
# 1) Author in Data Studio against the live CMS.
# 2) Re-snapshot:
DIRECTUS_URL=https://cms.yesid.dev \
DIRECTUS_TOKEN=$(op read "op://yesid-dev/directus-admin/credential") \
  bunx @directus/sdk@^20 schema-snapshot --url "$DIRECTUS_URL" --token "$DIRECTUS_TOKEN" \
  > infra/directus/snapshot.yaml
#    (or export via the CLI / API that matches your 11.17.3 workflow)
# 3) git checkout -b schema/<change-name>
# 4) bun test  (snapshot-shape test catches drift before PR)
# 5) git commit + open PR → schema-apply.yml runs ephemeral smoke
# 6) After merge: workflow_dispatch → target=prod → review printed diff → confirm apply
```

**Destructive schema apply** (field removal, type change) prints the full diff in the prod-apply workflow log — operator MUST review before confirming. The snapshot-shape test in CI guards against accidental collection/field removals by asserting required-collection presence.

### Consumer-side PR coordination

Per slice-18 spec D12, schema changes follow a two-PR rule:

1. **This repo's PR first** — snapshot + seed changes. Smoke-CI green. Prod-apply via `workflow_dispatch` after operator review.
2. **yesid.dev's PR second** — adapter + consumer changes. Link to this repo's merged PR in the description.

Pure consumer changes (new component, styling, route) do NOT need a PR here. Pure schema + seed changes do NOT need a PR on yesid.dev.

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
