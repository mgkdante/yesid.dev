# yesid.dev — apps/cms

Directus 12 CMS backing [yesid.dev](https://yesid.dev). Two live environments on Railway, schema-as-code via directus-sync, content shipped to the consumer site through build-time export.

Long-form decisions, research, and slice history live in Notion (Architecture → Dev vs Prod, plus the slice-18* artifact pages). This README is the operational reference for the CMS package.

## Current state

| Field | Value |
|-------|-------|
| Prod | `https://cms.yesid.dev` — Railway service, live |
| Dev | `https://cms.dev.yesid.dev` — Railway service, live (refreshed from prod via `scripts/refresh-dev-from-prod.sh`) |
| Image | `directus/directus:12.0.0` + `directus-extension-sync@3.0.6` (manifest host-overridden to load on v12 — see the Dockerfile banner; drop the override when tractr ships v12 support), pinned in `apps/cms/Dockerfile` |
| Database | Neon Postgres (BYO; separate Neon target per environment) |
| Storage | Cloudflare R2 via Directus's built-in `s3` driver |
| Email | Resend (SMTP transport) |
| Consumer site | [yesid.dev](https://yesid.dev) — reads all *data* from a build-time static content layer; live Directus serves only `/assets/*` media URLs at runtime |

## How content reaches production

Publishing is a build-time pipeline, not a runtime read:

1. Editor publishes, updates a published row, or archives a row in Data Studio on prod (the Flow condition matches `status ∈ {published, archived}` — widened at slice-26 close so deprecations deploy too).
2. The "Vercel revalidate on publish" Flow POSTs `VERCEL_DEPLOY_HOOK_URL` (env var on the Railway service, consumed by the Flow's request operation).
3. Vercel rebuilds `apps/web`; the `prebuild` step (`apps/cms/scripts/export-fallbacks.ts`) re-exports CMS content into the static content layer, authenticating with `DIRECTUS_BUILD_TOKEN`.
4. The deployed site serves the freshly exported content — no Directus data reads at request time.

**Deprecation policy: archive, don't delete.** There is no delete-triggered rebuild path. To retire content, set `status = "archived"` — the archive transition itself fires the rebuild Flow (since the slice-26 condition fix), and export-fallbacks filters archived rows out. Do not add a Directus Flow for deletes.

## Schema workflow (directus-sync)

Schema is code: `apps/cms/directus/**` (collections + snapshot JSON) is the reviewed artifact.

```bash
# 1) Author schema changes in Data Studio (dev first: cms.dev.yesid.dev).
# 2) Preview the drift, then materialize it locally:
op run --env-file=apps/cms/.env -- bun run --cwd apps/cms sync:diff   # read-only preview
op run --env-file=apps/cms/.env -- bun run --cwd apps/cms sync:pull   # overwrite apps/cms/directus/** with remote state
# 3) Review the diff, commit, open a PR.
git add apps/cms/directus/ && git commit -m "feat(cms): ..."
```

Prod apply is gated: the `cms.yml` workflow's push job runs on manual `workflow_dispatch` (environment-protected). `sync:push` locally is wrapped by `scripts/sync-push.ts`, which requires explicit prod acks (`DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH=1` + `DIRECTUS_SYNC_PUSH_ACK=...` — see `.env.example`) and auto-merges per-env file FKs (see below).

Config lives in `apps/cms/directus-sync.config.cjs` (dumpPath, enabled features, env-var connection). The sync extension is installed via `apps/cms/Dockerfile`; the `directus-sync` CLI is a devDependency of this package.

CI (`.github/workflows/cms.yml`): unit tests on PR, `sync:diff` preview on main-bound PRs, gated `sync:push` on dispatch. (The former `contract-test.yml` — ephemeral Directus + apps/web adapter integration tests — was retired at slice-26 close together with the dormant apps/web directus adapter it existed to test.)

## Shared secrets (cross-service)

Two secrets connect the CMS to the consumer build. Real values live in 1Password / the respective dashboards — never in git.

| Secret | Lives in | Purpose |
|---|---|---|
| `VERCEL_DEPLOY_HOOK_URL` | Railway service env (read by the publish Flow) | The single rebuild trigger: Flow POSTs it after a publish/archive; Vercel rebuilds the site |
| `DIRECTUS_BUILD_TOKEN` | Vercel build env (Production) | Auth for `export-fallbacks.ts` during the build. Scoped read-only token of the **Build Bot** user (policy "Build Bot — content read", 1P item "API — Directus — Build Bot"); swapped off the admin token at slice-26 close |
| `LICENSE_KEY` | Railway service env (both services) + GH Actions secret `DIRECTUS_LICENSE_KEY` (contract-test) | Directus 12 Open Innovation Grant key (1P item "API — Directus — License", renews 2027-06-10; 5 activations bound to PUBLIC_URL) |

The preview-era tokens (`VERCEL_BYPASS_TOKEN`, `EDITOR_PREVIEW_TOKEN`) are gone: `/preview/*` routes and ISR revalidation webhooks never shipped, and slice-27.2 removed the runtime CMS seam they were designed for.

### Rotation runbook

- **`VERCEL_DEPLOY_HOOK_URL`** — Vercel dashboard → yesid-dev project → Settings → Git → Deploy Hooks: create a new hook, copy the URL into the Railway service variable (`railway variables --service "Directus CMS" --set "VERCEL_DEPLOY_HOOK_URL=<new>"`), delete the old hook in Vercel, then verify by re-saving any published row and watching a Production build start. Update the 1P item.
- **`DIRECTUS_BUILD_TOKEN`** — mint a fresh token for the Build Bot user (`PATCH /users/<build-bot-id> {"token": "<openssl rand -hex 24>"}` with an admin token), update the Vercel env (`vercel env rm DIRECTUS_BUILD_TOKEN production --yes && printf '%s' "<new>" | vercel env add DIRECTUS_BUILD_TOKEN production`), update the 1P item, then fire the deploy hook once and confirm `export-fallbacks` logs `mode=live` in the Vercel build.
- **Prod admin token** — rotate in Data Studio (admin user → token), then update BOTH consumers in the same sitting: the GH Actions secret `DIRECTUS_PROD_ADMIN_TOKEN` (`gh secret set`) and the 1P item "API — Directus — Prod/Dev" `admin_token` field. A mid-deploy rotation orphaned CI once (slice-27.2) — do it between releases.
- **`LICENSE_KEY`** — only on grant renewal: update the Railway vars on both services + the GH secret + the 1P item. Deactivate stale activations in Data Studio → Settings → License if URLs changed.

## Local development (optional)

Run the pinned image against a local Postgres or the dev environment's Neon branch:

```bash
cp .env.example .env
# fill .env with dev values (local Postgres or Neon dev branch, R2 optional)
docker build -t directus-local apps/cms && docker run --rm -p 8055:8055 --env-file .env directus-local  # build from the Dockerfile — the stock image lacks the sync extension + host override
# open http://localhost:8055
```

The `package.json` here is **scripts-only** tooling (seed, export, migration, sync, tests). Directus itself always runs from the pinned container image — this package ships config + schema dumps + scripts + tests.

```bash
bun install              # installs @directus/sdk + directus-sync + zod + helpers
bun test                 # fixture + seed-dry-run + sync-push + lib tests (no network)

# From the repo root, 1Password-injected (see .env.example for the recipe):
op run --env-file=apps/cms/.env -- bun run --cwd apps/cms sync:diff
op run --env-file=apps/cms/.env -- bun run --cwd apps/cms sync:pull

# Root package.json shortcuts (root .env):
bun run cms:sync:diff:op
bun run cms:sync:push:op
```

> Bun 1.3.x flag-parsing gotcha: `bun --cwd <dir> run <script>` silently prints
> `bun run` help instead of running the script. Use `bun run --cwd <dir> <script>`
> (flags after `run`) or `cd` into the package first. Verified on bun 1.3.13.

## Operations

### Seeding content domains

Seed scripts are one-shot/idempotent per domain (`seed:services`, `seed:projects`, `seed:presets`, ...). Most domains were seeded once in slice-18 and are now maintained in Data Studio — re-run a seeder only when you know it's the right tool (several are stamped DONE in their headers).

```bash
# 1) Admin credentials from 1Password (no hand-copying).
export DIRECTUS_ADMIN_TOKEN=$(op read "op://yesid-dev/5maqocwjgg5uxeckueadwkmzuy/admin_token")
export PUBLIC_DIRECTUS_URL=https://cms.yesid.dev

# 2) Seed (from apps/cms).
bun run seed:services
```

Alternatively, set `DIRECTUS_ADMIN_EMAIL` + `DIRECTUS_ADMIN_PASSWORD` to use the `/auth/login` flow.

`seed:services` is **nuke-and-recreate** — idempotent, safe to re-run. It clears the `services` domain tree (FK CASCADE removes translations, deliverables, sections) then re-creates from `fixtures/collections/services.json`.

### Per-env file FK fields (slice-18k #120, #73, #86 — operational rule)

Singleton + collection fields that reference Directus `directus_files` UUIDs are **per-environment**. The UUID a file gets on dev (cms.dev.yesid.dev) is different from the UUID it gets on prod (cms.yesid.dev) because each Directus env mints its own file IDs.

Affected fields (slice-18 close inventory):
- `directus_settings.project_logo` — auto-merged by `sync-push.ts` (slice-18k Codex review P2 fix)
- `directus_settings.public_foreground` — auto-merged by `sync-push.ts`
- `directus_settings.public_favicon` — auto-merged by `sync-push.ts`
- `site_meta.default_og_image` — NOT auto-merged; seed-site-meta.ts uses updateSingleton which overwrites. Operator must manually re-PATCH after each `seed-site-meta` run on dev/prod.
- `icons.svg_override` (for 5 deferred rows: alembic, dax, rest-api, ssis, ssrs) — NOT auto-merged; seed-icons.ts uses delete+create. Operator must re-upload + re-PATCH after each `seed-icons` run.

Per slice-18k closure decisions, the committed fixtures for these fields are **`null`** to prevent the seed scripts from recreating FK-constraint failures on environments where the referenced UUID doesn't exist (the original `#120` pattern: settings.json had baked UUIDs `d610c3ad-...` that existed in no env, so `sync:push` failed on settings step with `RECORD_NOT_UNIQUE`).

**Auto-merge protection for `directus_settings` (slice-18k sync-push.ts):** `apps/cms/scripts/sync-push.ts` reads the live env's current values for `project_logo` / `public_foreground` / `public_favicon` BEFORE invoking directus-sync push, merges any non-null live values into the committed settings.json in place (overwriting the committed null), runs the push (so live values are preserved), then restores settings.json from a backup so git stays clean. This means after step 3 below (uploading per-env brand assets + PATCHing live settings), all subsequent `sync:push` runs are SAFE — the live branding survives. See `apps/cms/scripts/sync-push.ts` `mergeProtectedSettingsFields` + `preMergeProtectedSettings`.

**Operational rule when bootstrapping a fresh env (or restoring after Neon PITR):**

1. Run `sync:push` to provision schema + folders (will set the file-FK fields to `null` because that's what's committed).
2. **Important pre-step for `seed-brand-assets`:** the committed `apps/cms/fixtures/assets-id-map.json` is a STALE snapshot from an early dev env. Its UUIDs (including `brand/yesid-icon.svg → d610c3ad-...`) do NOT exist in current dev or current prod — this is the same orphan UUID family that #120 nulled from settings.json. Before running `seed-brand-assets` on any env, **clear the dev keys from assets-id-map.json first** so the script re-uploads + writes env-specific UUIDs. Otherwise the script skips upload (per the `if (existing)` short-circuit in `scripts/seed-brand-assets.ts`) and downstream PATCHes target the dead UUIDs.
3. Upload the env's brand assets:
   - Clear stale entries from `assets-id-map.json` (or delete the file entirely; it'll be re-created by the seed). Then from the repo root:
     ```bash
     cd apps/cms && bun --env-file=.env run scripts/seed-brand-assets.ts
     ```
     (`bun run --env-file=apps/cms/.env --cwd apps/cms ...` also parses correctly on bun 1.3.13; the broken form is `bun --cwd ... run ...` — see the gotcha note above.)
   - For `site_meta.default_og_image`: upload `apps/web/static/og/default.en.png` to the `og/` folder via Directus admin UI (or a one-off upload script following the seed-brand-assets.ts pattern), then PATCH `site_meta.default_og_image` to the new UUID via admin UI or:
     ```bash
     curl -X PATCH "https://<env-cms-host>/items/site_meta" \
       -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"default_og_image":"<new-file-uuid>"}'
     ```
   - For `icons.svg_override` (5 deferred rows): upload each of `apps/cms/icons/{alembic,dax,rest-api,ssis,ssrs}.svg` to the `icons/` folder via admin UI or a one-off upload script, then PATCH each `icons` row:
     ```bash
     curl -X PATCH "https://<env-cms-host>/items/icons/<row-id>" \
       -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"svg_override":"<new-file-uuid>"}'
     ```
4. For `settings.project_logo / public_foreground / public_favicon`: read the post-seed `assets-id-map.json` (now populated with env-specific UUIDs from step 3) and PATCH each settings field via admin UI or REST. **Do NOT use the committed assets-id-map.json values directly** — they're the stale dev snapshot.

5. **Auto-merge takes over from here:** all subsequent `sync:push` runs preserve the env-specific settings file FKs via the sync-push.ts merge wrapper (see "Auto-merge protection" above). No manual re-PATCH after each push is required for `directus_settings`. Manual re-PATCH IS still required for `site_meta.default_og_image` after `seed-site-meta` runs, and for `icons.svg_override` after `seed-icons` runs (those seed scripts don't have equivalent merge protection).

**Why not just commit the dev UUID:** because seeding prod from the committed fixture would set prod's `site_meta.default_og_image` to dev's UUID, which prod's `directus_files` doesn't have → FK constraint error on next seed (re-creates #120). The null + per-env PATCH rule is the only setup that survives `sync:push` cleanly across all envs.

**Why not refactor to use `assets-id-map.json` for these fields:** would require teaching `seed-site-meta.ts` (and any other singleton seed touching file FKs) to resolve `@assets-map:<key>` sentinels at payload-construction time. The refactor is in scope for any future slice that adds substantial new file-FK fields; for slice-18 close it was rejected as scope-enlarging for a single field with graceful consumer fallback (web `<SeoHead>` resolves null `default_og_image` to static `/og/default.{locale}.png`).

### Existing Windows worktrees + `.gitattributes` LF enforcement (slice-18k #111)

`.gitattributes` enforces LF for text files going forward. However, **gitattributes are only applied on checkout** — Windows worktrees created before slice-18k may still have CRLF copies of `DESIGN.md`, `apps/web/src/app.css`, `apps/web/src/lib/styles/tokens.css`, `apps/web/src/lib/motion/tokens.ts`, etc.

If `packages/tokens` tests still fail on Windows after pulling slice-18k, run the one-time renormalize:

```bash
git add --renormalize .
git status --short  # confirm any *.md/*.css/*.ts files were re-staged with LF
git commit -m "chore: apply .gitattributes LF normalization (slice-18k #111 follow-up)"
```

Linux/macOS worktrees are unaffected (no CRLF in tracked files to begin with).

### Asset migration (one-off, Slice 18 Task 9)

Bulk-upload `apps/web/static/images/*` into Directus-managed R2 storage. Reads `fixtures/assets-manifest.json` for metadata + target folders; walks the source tree for the binaries.

```bash
# 1) Pull the admin token from 1Password.
export DIRECTUS_ADMIN_TOKEN=$(op read "op://yesid-dev/5maqocwjgg5uxeckueadwkmzuy/admin_token")
export PUBLIC_DIRECTUS_URL=https://cms.yesid.dev

# 2) Dry-run first — prints what would upload without touching Directus.
bun run migrate:assets -- --dry-run

# 3) Real run (auto-detects the static/images tree; override with --source <path>).
bun run migrate:assets

# 4) Verify: the run emits `fixtures/assets-id-map.json` mapping each legacyPath
#    to the uploaded Directus file UUID. Commit it — downstream consumers read it.
git add fixtures/assets-id-map.json
git commit -m "chore(cms): emit assets-id-map.json after live migration"
```

**Idempotency.** The script tags every uploaded file's `description` with a leading `[legacy:<path>]` marker. Re-runs read existing files, skip entries whose `legacyPath` is already tagged, and only upload new ones. Safe to re-run after adding new entries to the manifest.

**Folder creation.** Folders are created on first run if missing. Existing folders with matching names are reused.

### Asset presets (saved transforms)

Directus saved asset presets let consumers request named sizes via `?key=<preset>` instead of string-building query params. They bypass the 5-op-per-request transform cap in production. Slice 18 installed four: `hero-1200`, `card-600`, `thumb-240`, `og-1200`.

```bash
# Idempotent — overwrites directus_settings.storage_asset_presets with the
# declared SLICE_18_PRESETS array.
export DIRECTUS_ADMIN_TOKEN=$(op read "op://yesid-dev/5maqocwjgg5uxeckueadwkmzuy/admin_token")
export PUBLIC_DIRECTUS_URL=https://cms.yesid.dev
bun run seed:presets
```

Presets live in `directus_settings.storage_asset_presets` — a JSON column on the singleton settings record, NOT part of the schema snapshot. Adding / changing presets is a re-run of `seed:presets`, not a schema apply.

### PR coordination (monorepo)

Since the 2026-04-24 monorepo pivot, schema + consumer changes ship from this one repo. Sequence within a PR (or PR train):

1. **Schema first** — `apps/cms/directus/**` changes reviewed and applied to prod via `cms.yml` dispatch.
2. **Consumer second** — adapter/static-layer changes in `apps/web` that depend on the new schema.

Pure consumer changes (component, styling, route) don't touch this package. Pure schema/seed changes don't need apps/web edits unless the adapter shape changes.

## Repo layout

```
apps/cms/
├── Dockerfile                   # directus/directus:11.17.3 + directus-extension-sync (Railway builds this)
├── directus-sync.config.cjs     # directus-sync CLI config (dumpPath, features, env connection)
├── directus/
│   ├── collections/             # directus-sync dumps: flows, operations, permissions, policies, roles, settings, ...
│   └── snapshot/                # schema snapshot (authoritative, reviewed in PRs)
├── fixtures/                    # seed data + assets manifest/id-map (frozen content snapshots)
├── brand/                       # brand SVGs uploaded per-env by seed-brand-assets
├── icons/                       # SVG overrides for icon rows the icon pipeline can't render
├── scripts/                     # export-fallbacks, sync-push wrapper, seed-*, migrate-*, refresh-dev-from-prod
│   └── lib/                     # shared fetchers/emitters/auth used by export + seeds
├── tests/                       # fixture + dry-run + sync-push tests (bun test, no network)
├── vercel.json                  # ignoreCommand guard from the standalone-repo era (skips any Vercel build rooted here); harmless
├── .env.example                 # Railway env reference + local op-inject recipes
└── README.md                    # this file
```

CI workflows live at the repo root: `.github/workflows/cms.yml` (tests + gated sync). The former `contract-test.yml` (ephemeral Directus + adapter integration tests) was retired at slice-26 close with the dormant apps/web directus adapter.

## Why these choices (TL;DR)

| Choice | Alternatives rejected | Why |
|---|---|---|
| Railway hosting | Directus Cloud ($15/mo, no Neon BYO) · Fly.io (PAYG) · Hetzner (DIY TLS) · Vercel (non-starter for Directus) | Official Directus support + BYO Neon + auto-TLS + predictable cost. Best DX-per-dollar at this scale. |
| Cloudflare R2 storage | Vercel Blob (no Directus driver) · AWS S3 ($0.09/GB egress) · Backblaze B2 (needs CDN layer) | `$0` egress + 10 GB free + built-in `s3` driver + S3-compat portability. |
| Schema dumps in Git (directus-sync) | Data Studio-only · hand-rolled SQL | Reviewable PR diffs + reproducible + drift-detection. |
| Block Editor for rich content | Markdown columns | Directus-native editing; the consumer renders Block Editor JSON via BlockRenderer / serializeBlocksToHtml. |
| Native Translations field | JSON-per-field · collection-per-locale | Directus-idiomatic editor UX + adapter-boundary `toLocalizedString` transform keeps `LocalizedString` shape unchanged. |
| Build-time export over runtime reads | SSR reads against live CMS | slice-27.2: site stays up when the CMS is down; CMS load is one build per publish, not per request. Media URLs remain the one live runtime seam. |

Full rationale lives in the Notion slice-18 spec and research pages.

## Appendix: historical provisioning (April 2026)

> **Historical.** This checklist stood up the production instance in slice-18 (April 2026). Both environments have been live since; keep this only as a reference for standing up a *new* environment from zero. Where it conflicts with current state (e.g. snapshot paths, workflow names), current state wins.

### 1. Prerequisites

- Neon Postgres project (reuse the existing `yesid-dev-cms` project; pooled connection string from Neon Console).
- Cloudflare account (free tier).
- Railway account (Hobby plan for production).

### 2. Cloudflare R2 bucket + keys

1. Cloudflare Dashboard → **R2** → Create bucket `yesid-dev-cms`.
2. **Manage R2 API Tokens** → Create token → Object Read & Write → scope to the bucket.
3. Save the Access Key ID, Secret Access Key, and the S3 Endpoint URL (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
4. Paste into the `STORAGE_S3_*` vars (see `.env.example`).

### 3. Railway project

1. Deploy from the Directus template (https://railway.com/deploy/directus-cms) — or point a Railway service at this repo's `apps/cms/Dockerfile` (current setup).
2. In Railway Dashboard → Variables:
   - Set `DB_CONNECTION_STRING` to Neon's pooled URL (remove any Railway-provisioned Postgres).
   - Set the `STORAGE_S3_*` vars from step 2.
   - Set `KEY` + `SECRET` (`openssl rand -hex 16` / `openssl rand -hex 32`).
   - Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (bootstrap-only — rotate + delete after first login).
   - Paste the remaining blocks from `.env.example`.
3. Deploy; wait for the health check.

### 4. First admin + rotate credentials

1. Open the Railway-assigned temporary domain.
2. Log in with the bootstrap `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
3. Change the admin password to something stored only in 1Password.
4. Railway → Variables → **delete** `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### 5. Custom domain + DNS

1. Railway → Settings → Custom Domain → add the `cms.*` host.
2. Point the DNS CNAME at Railway's target once auto-TLS completes on the temporary domain.
3. Verify `https://<host>/server/ping` returns 200 (v12 gates `/server/health` behind auth).

### 6. MCP (native since Directus 11.13)

1. Data Studio → Settings → AI → enable MCP server.
2. Roles → Create **`ai-editor`** → scope to content collections only (no system collections).
3. Create a dedicated MCP user in that role → generate a static access token.
4. Register with Claude Code:
   ```bash
   claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/mcp \
     --header "Authorization: Bearer <AI-EDITOR-TOKEN>"
   ```

## Related

- Notion → Architecture → Dev vs Prod — environment procedures.
- Notion slice-18* plan/research pages — migration history + Directus findings.
- Notion headless-CMS pivot research — why Directus beat Payload.
