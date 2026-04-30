# CMS Environments

Workflow contract for the dual-environment Directus setup (dev + prod).

## Domains

| Domain | Purpose | Hosting |
|---|---|---|
| `cms.yesid.dev` | **Prod CMS** | Railway (`Directus CMS` service, project `yesid-dev-cms`) + Neon `main` branch |
| `cms.dev.yesid.dev` | **Dev CMS** | Railway (`directus-cms-dev` service, same project) + Neon `dev` branch |
| `directus-cms-dev-production.up.railway.app` | Direct dev URL (bypasses Cloudflare) | Same Railway service as `cms.dev.yesid.dev` |

The dev domain CNAME is **DNS-only** in Cloudflare (gray cloud) so Railway terminates TLS directly. Cloudflare's Universal SSL doesn't auto-cover 3rd-level subdomains like `cms.dev.yesid.dev`, so proxy mode (orange cloud) won't have a valid cert and will fail with `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`.

## Schema flow (every change)

```
edit local snapshot → sync:diff dev → sync:push dev → verify on Vercel preview → sync:push:prod (with explicit acks)
```

1. **Edit local files** (`apps/cms/directus/`) — either by hand or via `sync:pull` from a Data Studio change
2. **Verify against dev:**
    ```bash
    op run --env-file=apps/cms/.env -- bun --cwd apps/cms run sync:diff
    ```
3. **Push to dev:**
    ```bash
    op run --env-file=apps/cms/.env -- bun --cwd apps/cms run sync:push
    # Add DIRECTUS_SYNC_INCLUDE_PERMISSIONS=1 + DIRECTUS_SYNC_PERMISSIONS_ACK to push permissions
    ```
4. **Test on Vercel preview** — preview deploys read `PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev`
5. **Promote to prod** when satisfied:
    ```bash
    DIRECTUS_URL=https://cms.yesid.dev \
    DIRECTUS_ADMIN_EMAIL=op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/username \
    DIRECTUS_ADMIN_PASSWORD=op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password \
    DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH=1 \
    DIRECTUS_SYNC_PUSH_ACK=sync-push-can-delete-cms-data \
    op run --env-file=apps/cms/.env -- bun --cwd apps/cms run sync:push
    ```
    The `apps/cms/scripts/sync-push.ts` wrapper requires both ack vars before allowing a prod push. This is intentional friction — schema mistakes are expensive.

## Content flow (per-env, never sync between)

- **Dev** is for testing schema changes against realistic data. Initially seeded as a Neon copy-on-write fork of prod, so dev starts pre-loaded with prod's content.
- **Prod** is the only environment with real client data. Never `sync:pull` from dev to prod (would clobber).
- **Reset dev when it gets messy:** Neon console → `dev` branch → "Reset from parent" → wipes dev's data, fresh fork from `main`.

## Inject pipeline (no API hammering)

`apps/cms/.env` (gitignored) holds op:// references to 1Password items:
```
DIRECTUS_URL=https://directus-cms-dev-production.up.railway.app
PUBLIC_DIRECTUS_URL=https://directus-cms-dev-production.up.railway.app
DIRECTUS_ADMIN_EMAIL=op://yesid-dev/<dev-admin-id>/username
DIRECTUS_ADMIN_PASSWORD=op://yesid-dev/<dev-admin-id>/password
```

`op run --env-file=apps/cms/.env -- <cmd>` resolves all op:// in **one** API call (vs N calls for per-secret `op item get`). This avoids 1Password rate-limit issues during multi-secret ops.

For prod ops, override the dev defaults inline (see schema flow step 5).

## Vercel env split

| Environment | `PUBLIC_DIRECTUS_URL` |
|---|---|
| Production | `https://cms.yesid.dev` |
| Preview | `https://cms.dev.yesid.dev` |
| Development | `https://cms.dev.yesid.dev` |

Set via Vercel REST API (CLI's `vercel env add` is buggy for Preview env — it asks about per-branch scope and rejects the documented "all branches" command). Bypass:

```bash
PROJECT_ID=$(cat apps/web/.vercel/project.json | jq -r .projectId)
TEAM_ID=$(cat apps/web/.vercel/project.json | jq -r .orgId)
TOKEN=$(cat ~/AppData/Roaming/com.vercel.cli/Data/auth.json | jq -r .token)

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
  --data '{"key":"PUBLIC_DIRECTUS_URL","value":"<url>","type":"plain","target":["preview"]}'
```

## Windows SCHANNEL TLS quirk

Windows native `curl` (and tools using SCHANNEL TLS) sometimes chokes on Cloudflare-proxied hostnames with `SEC_E_ILLEGAL_MESSAGE`. **This affects `curl` only — not `directus-sync`, `bun`, or anything using OpenSSL.**

For ops from Windows:
- ✅ `bun -e "fetch(...)"` — uses OpenSSL, works
- ✅ `directus-sync` (uses node fetch / native fetch with OpenSSL) — works
- ✅ WSL `curl` (uses OpenSSL) — works
- ❌ Windows `curl` (SCHANNEL backend) — fails on some Cloudflare-proxied hosts

When you need to verify connectivity from a Windows shell, use `bun` instead of `curl`:
```bash
bun -e "console.log((await fetch('https://cms.dev.yesid.dev/server/health')).status)"
```

The dev CMS is currently **DNS-only** (gray cloud), so this only matters if you're debugging proxied prod URLs.

## Cost

~$5–10/month additional vs. prod-only:
- Railway sibling Directus service (Hobby plan, no extra plan upgrade)
- Neon dev branch storage (very small, branched from main)

## Don'ts

- Don't reuse prod admin creds on dev. Dev admin is `admin@yesid.dev` (separate password). Prod admin is `mgkdante@gmail.com`.
- Don't push to prod without both `DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH=1` + `DIRECTUS_SYNC_PUSH_ACK`. The wrapper enforces this.
- Don't push permissions casually. Use `DIRECTUS_SYNC_INCLUDE_PERMISSIONS=1` + `DIRECTUS_SYNC_PERMISSIONS_ACK` only when you mean it (parallel-branch work can clobber).
- Don't sync content rows between envs. Schema yes, data no.
- Don't toggle the `cms.dev.yesid.dev` Cloudflare CNAME to orange cloud — Universal SSL doesn't cover this hostname; proxy mode breaks TLS.

## Reference items in 1Password (vault `yesid-dev`)

| Title | What |
|---|---|
| `Directus admin - cms.yesid.dev` | Prod admin login (`mgkdante@gmail.com`) |
| `Directus admin - cms.dev.yesid.dev` | Dev admin login (`admin@yesid.dev`) |
| `Directus env secrets - KEY (dev)` | Dev `KEY` (Directus signing) |
| `Directus env secrets - SECRET (dev)` | Dev `SECRET` (Directus signing) |
| `Neon dev branch - yesid-dev-cms` | Postgres connection string for dev branch (pooled + direct variants) |
| `Cloudflare ops token - all` | Multi-service Cloudflare API token (DNS, Workers, KV, R2, D1) |
