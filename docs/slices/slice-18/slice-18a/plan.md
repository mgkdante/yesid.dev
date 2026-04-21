# Sub-Slice 18a — CMS Infrastructure Foundation · Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Sequencing:** 6 tasks across **two repos** — most in `yesid.dev-cms` (new), one in `yesid.dev` (docs-only close). Tasks roughly sequential; 18a-4 external-service provisioning can overlap with 18a-3 locally if DNS propagation kicks off early.

**Runtime:**
- `yesid.dev-cms`: **bun**, Node 22 (D1 — amended 2026-04-20 from initial pnpm recommendation). Commands: `bun install`, `bun add <pkg>`, `bun dev`, `bun run build`, `bunx payload migrate:create`, `bunx payload migrate`, `bunx payload generate:types`, `bunx payload generate:importmap`, `bunx tsc --noEmit`. Lockfile: `bun.lock` (committed).
- `yesid.dev`: bun (unchanged). Commands: `bun run check`, `bun run test`, `bun run build`, `bun run slice:close`.

**Commit prefixes:**
- `yesid.dev-cms` commits: `feat(cms-slice-18a): …` (setup/infra), `chore(cms-slice-18a): …` (env, config files), `docs(cms-slice-18a): …` (README/AGENTS/CLAUDE).
- `yesid.dev` commits: `docs(slice-18a): …` (bundle finalization, ARCHITECTURE update).

**Two-PR close protocol (per spec D11):** PR A in `yesid.dev-cms` (substantive code) → merges first; PR B in `yesid.dev` (docs-only, references PR A's URL) → merges second → `bun run slice:close 18a` archives the bundle.

**Cross-repo session layout:**
- Session 1 (Tasks 18a-1 → 18a-3): local-only work in `yesid.dev-cms`. No external-service signups required beyond a Neon account.
- Session 2 (Tasks 18a-4 → 18a-6): Vercel + Neon prod provisioning + DNS + `yesid.dev` docs close. Can span real time (DNS propagation, Resend DNS verify if attempted).

---

## Task 18a-1 — Scaffold `yesid.dev-cms` repo + local dev up

**Repo:** `yesid.dev-cms` (NEW — created in this task).

**Goal:** Empty GitHub repo → `bun create payload-app` scaffolded project → `bun dev` starts Payload admin at `localhost:3000/admin` against a temporary SQLite or local-Postgres instance Payload's blank template ships with. Zero config edits beyond template defaults at this step — just prove the scaffold works.

**Files created (by Payload template scaffold):**
- `yesid.dev-cms/package.json`
- `yesid.dev-cms/payload.config.ts`
- `yesid.dev-cms/src/app/(payload)/**` (Next.js routes for admin + API)
- `yesid.dev-cms/src/collections/Users.ts`
- `yesid.dev-cms/next.config.mjs`
- `yesid.dev-cms/tsconfig.json`
- `yesid.dev-cms/.gitignore`

**Steps:**

- [ ] **Step 1:** Create GitHub repo: `gh repo create mgkdante/yesid.dev-cms --private --description "Framework-agnostic Payload 3 CMS — powers yesid.dev, shipped as a reusable starter"`. Verify it exists on github.com.
- [ ] **Step 2:** Clone the empty repo as a SIBLING of `yesid.dev` (per spec's local-dev convention — `C:\Users\otalo\Yesito\Projects\yesid.dev-cms\`). Do NOT nest inside `yesid.dev`.
- [ ] **Step 3:** In the empty clone, run `bun create payload-app yesid-dev-cms --template blank --db postgres --name "yesid.dev CMS"`. Answer CLI prompts: name `yesid-dev-cms`, package manager → when asked, select the option that skips auto-install (often "None" or equivalent); we'll run `bun install` in Step 7 manually because `create-payload-app` historically prompts for npm/pnpm/yarn but not bun. Postgres DB. Accept the generated `PAYLOAD_SECRET`.

  > **bun fallback:** if `bun create payload-app` fails (template incompatibility), fall back to `bunx create-payload-app yesid-dev-cms --template blank --db postgres`. Either form delegates to the `create-payload-app` package. Record any issue + fallback used in `log.md` per D1 amendment note.

  > **Windows note:** run under Git Bash (the session shell) or PowerShell — the Payload CLI has known issues with `cmd.exe`. If prompts hang, Ctrl-C and re-run under the other shell.

- [ ] **Step 4:** Move all scaffold files from the nested `yesid-dev-cms/` sub-directory up to the repo root (the CLI creates a sub-directory by default). Verify: `yesid.dev-cms/package.json` exists at repo root.
- [ ] **Step 5:** Create `.nvmrc` with content `22`.
- [ ] **Step 6:** Add `engines` field to `package.json`: `"engines": { "node": ">=22.0.0 <23.0.0", "bun": ">=1.2.0" }`. Also add `"packageManager": "bun@1.2.x"` if the scaffold didn't. Delete any `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` the scaffold may have left behind — we commit `bun.lock` only.
- [ ] **Step 7:** `bun install` (first full install with the Node 22 constraint).
- [ ] **Step 8:** Set local `.env` from the template's `.env.example` (the scaffold generates both). Edit `DATABASE_URI` to point at a throwaway local Postgres — either `postgresql://postgres:postgres@localhost:5432/yesid_dev_cms_local` (requires Docker Postgres running) or a brand-new Neon dev branch created at this step via Neon dashboard (preferred per spec Q6).
- [ ] **Step 9:** `bun dev` → verify admin UI loads at `http://localhost:3000/admin`. You'll be prompted to create a first user manually (the scaffold doesn't have `onInit` bootstrap yet — that's 18a-2).
- [ ] **Step 10:** Create a first user via the admin UI (email: `yesid@yesid.dev` or similar, any password). Confirm you land on the admin dashboard.
- [ ] **Step 11:** Stop `bun dev`. `git add .` and commit the scaffold.

```bash
# in yesid.dev-cms
git add .
git commit -m "feat(cms-slice-18a): scaffold Payload 3 + Next.js 15 blank template with Postgres adapter"
git push -u origin main
```

**STOP criteria:**
- `bun dev` starts cleanly, admin UI reachable at `localhost:3000/admin`.
- Initial commit pushed to `origin/main`.
- `yesid.dev` repo completely untouched (sanity: `cd ../yesid.dev && git status` shows nothing under `src/`).
- No secrets committed (`.env` is in `.gitignore`, verify).

---

## Task 18a-2 — Wire `payload.config.ts`: adapters, plugins, collections, globals, onInit bootstrap

**Repo:** `yesid.dev-cms`.

**Goal:** Rewrite `payload.config.ts` to apply every Slice 18 design decision at once: Postgres adapter with `push: false` + `prodMigrations`, Vercel Blob plugin (no active collections), **`@payloadcms/plugin-mcp` exposing `site-meta` (D12)**, Resend email adapter, localization config, the `Users` collection (refined), the `SiteMeta` heartbeat global, and the `onInit` bootstrap hook. All in one task because the file is small and the pieces interlock; splitting across commits leaves broken intermediate states.

**Files:**
- Modify: `yesid.dev-cms/payload.config.ts`
- Modify: `yesid.dev-cms/src/collections/Users.ts`
- Create: `yesid.dev-cms/src/globals/SiteMeta.ts`
- Modify: `yesid.dev-cms/.env.example` (document all env vars introduced)
- Install deps: `@payloadcms/storage-vercel-blob`, `@payloadcms/email-resend`, **`@payloadcms/plugin-mcp` (D12)** (scaffold already brings `@payloadcms/db-postgres` + `payload` + `@payloadcms/next`)

**Canonical `payload.config.ts` pattern:**

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { Users } from './src/collections/Users'
import { SiteMeta } from './src/globals/SiteMeta'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — yesid.dev CMS' },
  },
  editor: lexicalEditor(),
  collections: [Users],
  globals: [SiteMeta],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
    fallback: true,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? process.env.DATABASE_URL ?? '',
    },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    // prodMigrations imported in Task 18a-3 after migrations exist; leave commented for now
    // prodMigrations: migrations,
  }),
  email: resendAdapter({
    defaultFromAddress: 'no-reply@cms.yesid.dev',
    defaultFromName: 'yesid.dev CMS',
    apiKey: process.env.RESEND_API_KEY ?? '',
  }),
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        // media: true  ← uncommented in Slice 18b when Media collection lands
      },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
    // D12 — Payload MCP plugin. Exposes site-meta as a find/update MCP tool at /api/mcp.
    // Each content collection added in 18b registers its own collections entry here as it lands.
    mcpPlugin({
      globals: {
        'site-meta': {
          enabled: { find: true, update: true },
          description:
            'Site-wide metadata — heartbeat in 18a (siteName), extended in 18b with tagline, description, links.',
        },
      },
      // collections: {} — intentionally empty in 18a; content collections land in 18b
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    const existing = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'admin' } },
      limit: 1,
    })
    if (
      existing.totalDocs === 0 &&
      process.env.PAYLOAD_ADMIN_EMAIL &&
      process.env.PAYLOAD_ADMIN_PASSWORD
    ) {
      await payload.create({
        collection: 'users',
        data: {
          email: process.env.PAYLOAD_ADMIN_EMAIL,
          password: process.env.PAYLOAD_ADMIN_PASSWORD,
          roles: ['admin'],
        },
      })
      payload.logger.info('[slice-18a] Bootstrap admin created')
    }
  },
})
```

**Canonical `src/collections/Users.ts` pattern:**

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  access: {
    create: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
    update: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
    delete: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['admin'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
```

**Canonical `src/globals/SiteMeta.ts` pattern (heartbeat-only in 18a, grown in 18b):**

```ts
import type { GlobalConfig } from 'payload'

export const SiteMeta: GlobalConfig = {
  slug: 'site-meta',
  admin: {
    description:
      'Site-wide metadata. Heartbeat in 18a (siteName only); extended in 18b with tagline, description, links, etc.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'yesid.dev',
    },
    {
      name: 'deployedAt',
      type: 'text',
      admin: {
        description: 'Auto-set by beforeChange hook; ISO timestamp of last admin edit.',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => ({ ...data, deployedAt: new Date().toISOString() }),
    ],
  },
}
```

**Steps:**

- [ ] **Step 1:** Install new dependencies in `yesid.dev-cms`:
  ```bash
  bun add @payloadcms/storage-vercel-blob @payloadcms/email-resend @payloadcms/plugin-mcp
  ```
- [ ] **Step 2:** Replace scaffold `payload.config.ts` with the canonical pattern above. Leave `prodMigrations: migrations` import commented — it's added in Task 18a-3 after migrations exist.
- [ ] **Step 3:** Replace scaffold `src/collections/Users.ts` with the pattern above (adds `roles` field + access control).
- [ ] **Step 4:** Create `src/globals/SiteMeta.ts` with the heartbeat-only pattern above.
- [ ] **Step 5:** Update `.env.example` to document every env var introduced (no secrets, just keys):
  ```ini
  # --- Postgres (from Neon Vercel integration in prod; local Neon dev branch for dev) ---
  DATABASE_URI=postgresql://...pooler.neon.tech/...?sslmode=require
  DATABASE_URL_UNPOOLED=postgresql://...neon.tech/...?sslmode=require
  # --- Payload ---
  PAYLOAD_SECRET=change-me-32-chars-min
  PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
  NEXT_PUBLIC_SERVER_URL=http://localhost:3000
  # --- Storage ---
  BLOB_READ_WRITE_TOKEN=
  # --- Email ---
  RESEND_API_KEY=
  # --- Admin bootstrap (remove after first login per Slice 18a spec D6) ---
  PAYLOAD_ADMIN_EMAIL=
  PAYLOAD_ADMIN_PASSWORD=
  ```
- [ ] **Step 6:** `bunx payload generate:importmap` (the blank template generates an import map for admin UI on first run).
- [ ] **Step 7:** Start `bun dev` against the local `.env`. Payload will complain about `push: false` + no migrations — this is expected; fix in Task 18a-3.
- [ ] **Step 8:** Stop `bun dev`. Run `bunx tsc --noEmit` — verify no type errors in `payload.config.ts`, `Users.ts`, `SiteMeta.ts`.
- [ ] **Step 9:** Commit.

```bash
# in yesid.dev-cms
git add package.json bun.lock payload.config.ts src/collections/Users.ts src/globals/SiteMeta.ts .env.example
git commit -m "feat(cms-slice-18a): wire postgres + vercel blob + resend + mcp plugin + localization + users + site-meta global + onInit bootstrap"
```

**STOP criteria:**
- `bunx tsc --noEmit` green.
- All four files committed.
- No `.env` committed (verify `.gitignore` excludes it).
- `payload.config.ts` declares: `postgresAdapter` with `push: false`, `vercelBlobStorage` plugin (empty `collections`), **`mcpPlugin` exposing `site-meta` global with `find` + `update` operations (D12)**, `resendAdapter`, localization (en/fr/es), `Users` collection, `SiteMeta` global, `onInit` bootstrap.

---

## Task 18a-3 — Generate initial migration + wire `prodMigrations` + verify local heartbeat

**Repo:** `yesid.dev-cms`.

**Goal:** Payload's schema (post-18a-2 config) is now captured as a committed migration. `prodMigrations` is imported into `payload.config.ts` so runtime migrate works on Vercel cold starts (D7). Local heartbeat proven: admin can log in + edit `site-meta.siteName` + value persists after `bun dev` restart.

**Files:**
- Create: `yesid.dev-cms/migrations/00001_initial.ts` (generated)
- Create: `yesid.dev-cms/migrations/index.ts` (generated barrel)
- Modify: `yesid.dev-cms/payload.config.ts` (uncomment `prodMigrations` import + config)
- Create: `yesid.dev-cms/payload-types.ts` (generated)

**Steps:**

- [ ] **Step 1:** Confirm `.env` points at a CLEAN Neon dev branch (NOT a shared one, NOT prod). If still pointing at Docker, create a Neon dev branch via dashboard now and update `.env`. Run `bunx payload migrate:fresh` if needed to wipe any stale schema. (On a clean branch, skip this.)
- [ ] **Step 2:** Generate the initial migration:
  ```bash
  bunx payload migrate:create --name initial
  ```
  This produces `migrations/00001_initial.ts` + updates `migrations/index.ts` with the barrel import.
- [ ] **Step 3:** Run the migration locally:
  ```bash
  bunx payload migrate
  ```
  Verify output says `initial` applied. In Neon dashboard, confirm tables created: `users`, `users_sessions`, `site-meta`, `site-meta_locales`, `payload_migrations`, `payload_preferences`, `payload_locked_documents`.
- [ ] **Step 4:** Uncomment the `prodMigrations` wiring in `payload.config.ts`:
  ```ts
  import { migrations } from './migrations'
  // ...
  db: postgresAdapter({
    // ...existing pool + push + migrationDir...
    prodMigrations: migrations,
  }),
  ```
- [ ] **Step 5:** Generate types:
  ```bash
  bunx payload generate:types
  ```
  Verify `payload-types.ts` exists at repo root, contains `User` and `SiteMeta` interfaces.
- [ ] **Step 6:** `bun dev` again. Log in with the admin user created in Task 18a-1. Navigate to Globals → Site Meta. Edit `siteName` to something distinctive (e.g., `yesid.dev (local test)`). Save.
- [ ] **Step 7:** Stop `bun dev`. Restart `bun dev`. Log in again. Verify `siteName` still shows the edited value — proves persistence across process restart.
- [ ] **Step 8:** Verify `deployedAt` auto-populated with the ISO timestamp of the Step 6 save.
- [ ] **Step 9:** Run `bun run build` (Next.js production build). Verify it completes without errors.
- [ ] **Step 10:** Commit.

```bash
# in yesid.dev-cms
git add migrations/ payload.config.ts payload-types.ts
git commit -m "feat(cms-slice-18a): generate initial migration + wire prodMigrations + commit generated types"
git push
```

**STOP criteria:**
- `migrations/00001_initial.ts` + `migrations/index.ts` committed.
- `prodMigrations: migrations` wired in `payload.config.ts`.
- `payload-types.ts` committed.
- Local heartbeat proven: edit → restart → value persists.
- `bun run build` green.

---

## Task 18a-4 — Provision Neon prod project + Vercel project + Blob + Resend + DNS

**Repo:** `yesid.dev-cms` (for linking); external dashboards (Neon, Vercel, Resend, DNS provider).

**Goal:** All production external services exist, linked, and env vars set in Vercel. Nothing deployed yet — that's Task 18a-5. Order matters: Neon first (integration creates Vercel project env vars), Blob second, Resend third, DNS last (can propagate in background).

**No files modified in this task.** This is infrastructure provisioning via dashboards. Notes captured in `log.md` and `handoff.md`.

**Steps:**

- [ ] **Step 1 — Vercel project (minimal).** In Vercel dashboard, create new project `yesid-dev-cms` linked to the GitHub repo. **Do NOT deploy yet** — cancel the initial deploy attempt. Choose region `Washington D.C. (iad1)` to match `yesid.dev`'s region (check yesid.dev's Vercel project to confirm). Framework preset: Next.js. Build command: default (`bun run build`). Install command: default (`bun install`).
- [ ] **Step 2 — Neon via Vercel Marketplace integration.** In the Vercel project's Storage tab, click "Connect Database" → Neon (Marketplace). Create new Neon project `yesid-dev-cms`, region matching (`aws-us-east-1` ≈ `iad1`), free tier, Postgres 17. Confirm the integration auto-sets: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. Neon branches per Vercel preview: **enabled** in integration settings.
- [ ] **Step 3 — Mirror `DATABASE_URI`.** Payload reads `DATABASE_URI` but Neon/Vercel set `DATABASE_URL`. In Vercel project env, add `DATABASE_URI` manually = same value as `DATABASE_URL` (pooled). Alternative: just rely on the `process.env.DATABASE_URL ?? process.env.DATABASE_URI` fallback in `payload.config.ts` — decide at this step; default is add `DATABASE_URI` for explicitness.
- [ ] **Step 4 — `PAYLOAD_SECRET` generation.** Generate a 32-char secret (under Git Bash):
  ```bash
  openssl rand -base64 32
  ```
  Paste into Vercel env `PAYLOAD_SECRET`. Do NOT commit or log elsewhere.
- [ ] **Step 5 — Vercel Blob store.** In the Vercel project's Storage tab, create new Blob store `yesid-dev-cms-media`. This auto-sets `BLOB_READ_WRITE_TOKEN` in the project env. Zero uploads in 18a; the token is ready for 18b.
- [ ] **Step 6 — Resend account + API key.** Sign up at [resend.com](https://resend.com) if not already (Yesid may have an existing account). Create API key scoped to domain `cms.yesid.dev`. Paste `RESEND_API_KEY` into Vercel env. **DNS sender verification deferred to 18b** per spec D5.
- [ ] **Step 7 — `NEXT_PUBLIC_SERVER_URL` + `PAYLOAD_PUBLIC_SERVER_URL`.** In Vercel env, set both to `https://cms.yesid.dev` for the Production environment; set both to `$VERCEL_URL` template for Preview.
- [ ] **Step 8 — Admin bootstrap creds.** In Vercel env, add:
  - `PAYLOAD_ADMIN_EMAIL` = Yesid's admin email
  - `PAYLOAD_ADMIN_PASSWORD` = strong temporary password (20+ chars, unique, not reused — will be rotated in 18a-5)

  Both scoped to **Production** only (not Preview, not Development).
- [ ] **Step 9 — DNS CNAME.** In yesid.dev's DNS provider (confirm which one — likely Cloudflare or Vercel-managed DNS), add CNAME `cms` → `cname.vercel-dns.com` (or the specific target Vercel shows in the Domains tab of the project). TTL = 3600. Propagation starts in background.
- [ ] **Step 10 — Bind `cms.yesid.dev` in Vercel project Domains tab.** Paste `cms.yesid.dev` as a custom domain. Vercel will issue a Let's Encrypt cert once DNS resolves (typically <10 min).
- [ ] **Step 11 — Log all actions in `log.md`.** Per AGENTS.md self-appending convention: each step above appends a one-line entry to `yesid.dev/docs/slices/slice-18/slice-18a/log.md` with timestamp and action (no secrets).

**STOP criteria:**
- Vercel project `yesid-dev-cms` exists, linked to GitHub repo, Neon + Blob stores attached.
- All env vars set: `DATABASE_URL`, `DATABASE_URI`, `DATABASE_URL_UNPOOLED`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `PAYLOAD_ADMIN_EMAIL`, `PAYLOAD_ADMIN_PASSWORD`, `NEXT_PUBLIC_SERVER_URL`, `PAYLOAD_PUBLIC_SERVER_URL`.
- DNS CNAME for `cms.yesid.dev` submitted (propagation not required before 18a-5).
- No deploy triggered yet (cancel or ignore any auto-deploy from the GitHub link).

**No git commit this task** — infrastructure only. Log entries only.

---

## Task 18a-5 — Production deploy + admin bootstrap verification + credential rotation

**Repo:** `yesid.dev-cms` (deploys via main-branch push or manual Vercel deploy button).

**Goal:** First production deploy green; `onInit` bootstrap creates admin; Yesid logs in at `https://cms.yesid.dev/admin`; edits `site-meta`; confirms persistence across cold starts; **verifies MCP endpoint end-to-end (D12)**; rotates password + removes bootstrap env vars. Preview branch lifecycle verified on a throwaway PR.

**No files modified** (infrastructure + manual verification). All work captured in `log.md` + `handoff.md`.

**Steps:**

- [ ] **Step 1 — Trigger production deploy.** Push any trivial commit to `main` (or use Vercel dashboard "Redeploy" → "Use existing build cache: OFF"). Wait for deploy to finish green.
- [ ] **Step 2 — Verify migration ran on cold start.** Neon dashboard → `yesid-dev-cms` project → main branch → Tables. Confirm `payload_migrations` table exists with 1 row (`initial`). Confirm `users` + `site-meta` tables exist.
- [ ] **Step 3 — Wait for DNS + cert.** `curl -I https://cms.yesid.dev/admin` → expect 200 or 307 (redirect to login). If DNS still propagating, wait up to 60 min; sanity-check with `nslookup cms.yesid.dev`.
- [ ] **Step 4 — Verify admin bootstrap.** Load `https://cms.yesid.dev/admin` in browser. Log in with `PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD`. Confirm successful login → admin dashboard appears. In Vercel logs, verify one log line: `[slice-18a] Bootstrap admin created`.
- [ ] **Step 5 — Verify heartbeat.** Navigate to Globals → Site Meta. Edit `siteName` to `yesid.dev (prod heartbeat 2026-04-XX)`. Save. Refresh the page — value persists. Read raw DB via Neon SQL Editor: `SELECT site_name, deployed_at FROM "site-meta";` — values match. Heartbeat proven end-to-end.
- [ ] **Step 6 — Trigger a cold start on a different route.** `curl https://cms.yesid.dev/api/site-meta` → expect JSON response with the edited `siteName`. Confirms REST API serves persisted data.
- [ ] **Step 6b — MCP endpoint smoke test (D12).**
  1. In admin UI → your user → API Keys → "Generate new key" (Payload's built-in flow). Label it `slice-18a-smoke-test`. Copy the key to Yesid's password manager.
  2. `curl -X POST https://cms.yesid.dev/api/mcp \
    -H "Authorization: Bearer <KEY>" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}}}'` → expect 200 + a JSON-RPC response naming the Payload MCP server + its tools (should list `find-site-meta` + `update-site-meta`).
  3. Configure a local MCP client to test end-to-end — simplest is adding this to Claude Code's MCP config:
    ```bash
    claude mcp add --transport http yesid-cms https://cms.yesid.dev/api/mcp \
      --header "Authorization: Bearer <KEY>"
    ```
    Restart Claude Code. Verify the `yesid-cms` server shows in `/mcp` with `find-site-meta` + `update-site-meta` tools.
  4. From Claude Code: "Fetch site-meta from yesid-cms MCP server" — expect the same `siteName` value edited in Step 5 and returned by the REST call in Step 6. Three-way consistency check (admin UI, REST, MCP) passed.
  5. Remove the `slice-18a-smoke-test` key from admin UI once verified. Generate a long-lived one for Yesid's actual workflow and store it in password manager.
  6. Append to `log.md` the client config snippet (with `<KEY>` placeholder, no real key) — this becomes the basis for the "Using with MCP" section of `yesid.dev-cms/README.md` in Task 18a-6.
- [ ] **Step 7 — Idempotency check.** In Vercel dashboard → Deployments → tap "Redeploy" on the current prod. Wait for deploy. Check Vercel logs — the `[slice-18a] Bootstrap admin created` line should **NOT** reappear (hook finds existing admin, no-op). If it does, `onInit` bug → fix before continuing.
- [ ] **Step 8 — Rotate password.** In admin UI → Users → your admin user → change password to a new 20+ char password (store in Yesid's password manager). Log out. Log in with new password — confirm success.
- [ ] **Step 9 — Remove bootstrap env vars.** In Vercel env, **delete** `PAYLOAD_ADMIN_EMAIL` and `PAYLOAD_ADMIN_PASSWORD`. Trigger redeploy. Wait for green. Verify in Vercel logs: no bootstrap log line (hook's env-guard skips the branch because env vars are absent). Verify admin login still works with the rotated password (user record persists in DB, independent of env).
- [ ] **Step 10 — Preview branch lifecycle.** Open a throwaway PR in `yesid.dev-cms` (e.g., `chore(cms-slice-18a): test preview deploy — DELETE`). Push a trivial commit (e.g., README typo). Wait for Vercel preview deploy. In Neon dashboard → Branches, confirm a new DB branch was created for this PR. Close the PR without merging. Confirm the Neon branch is auto-deleted.
- [ ] **Step 11 — Free-tier budget check.** Neon dashboard → Usage. Confirm `<5` compute-hours over the session. Vercel dashboard → Blob → confirm 0 bytes. No payment method on either account.
- [ ] **Step 12 — `handoff.md` section for this task.** Append heartbeat URL, rotated-password note (in password manager), preview-branch-lifecycle verification, free-tier usage numbers.

**STOP criteria:**
- `https://cms.yesid.dev/admin` reachable with rotated admin credentials.
- `site-meta.siteName` edit persisted — three-way consistency across admin UI + `/api/site-meta` REST + **MCP `find-site-meta` tool from a local client (D12)** + raw SQL.
- Bootstrap env vars removed from Vercel; redeploy clean; login still works.
- Preview branch auto-created + auto-destroyed.
- Long-lived MCP API key generated, stored in Yesid's password manager (NOT committed anywhere); smoke-test key rotated/deleted.
- Neon + Blob usage within free tier; no payment method attached.

**No git commit this task** — verification only. All notes go in `log.md` + `handoff.md`.

---

## Task 18a-6 — Close bundle: `yesid.dev-cms` README/AGENTS/CLAUDE + `yesid.dev` docs finalization

**Repos:** `yesid.dev-cms` (README + AGENTS + CLAUDE commits) AND `yesid.dev` (bundle finalization, ARCHITECTURE update, sub-slice row, tree.txt).

**Goal:** Both repos have their 18a artifacts committed + PR A (`yesid.dev-cms`) + PR B (`yesid.dev`) opened + PR A merged + PR B merged + `bun run slice:close 18a` run in `yesid.dev`.

### Part A — `yesid.dev-cms` docs commit + PR A

**Files:**
- Create: `yesid.dev-cms/README.md`
- Create: `yesid.dev-cms/AGENTS.md`
- Create: `yesid.dev-cms/CLAUDE.md`

**`yesid.dev-cms/README.md` template (thin):**

```md
# yesid.dev CMS

Framework-agnostic [Payload 3](https://payloadcms.com) starter backed by Neon Postgres + Vercel Blob, with **native MCP (Model Context Protocol) surface built in**. Powers [yesid.dev](https://yesid.dev); ships as a reusable CMS foundation for any SvelteKit / Next.js / Astro / Nuxt / REST / MCP consumer.

**Status:** Slice 18a complete — infrastructure foundation + MCP surface. Content collections land in Slice 18b. Framework integration recipes land in Slice 18c+.

## Local development

Runtime: **bun** (Node 22 for engines). Lockfile: `bun.lock`.

```bash
bun install
cp .env.example .env
# Fill .env with a Neon dev-branch DATABASE_URI + generated PAYLOAD_SECRET + BLOB_READ_WRITE_TOKEN + RESEND_API_KEY
bun dev
# Admin UI: http://localhost:3000/admin
```

## Using with MCP

Every enabled collection and global is exposed as a tool at `/api/mcp` over HTTP (JSON-RPC). Authenticate with a per-user API key generated from the admin UI (Users → your user → API Keys).

**Claude Code:**
```bash
claude mcp add --transport http yesid-cms https://cms.yesid.dev/api/mcp \
  --header "Authorization: Bearer <YOUR-MCP-KEY>"
```

**Cursor / VS Code / other `mcp-remote`-compatible clients:**
```json
{
  "mcpServers": {
    "yesid-cms": {
      "type": "http",
      "url": "https://cms.yesid.dev/api/mcp",
      "headers": { "Authorization": "Bearer <YOUR-MCP-KEY>" }
    }
  }
}
```

Slice 18a exposes `site-meta` (find + update). Each content collection added in 18b registers its own MCP tools automatically.

**Never commit an MCP key.** Treat it like a CMS admin password. Store in a password manager; reference per-client via env var expansion where supported.

## Architecture

Two-repo split (per [yesid.dev/docs/slices/slice-18/README.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/README.md)):

- **`yesid.dev`** — SvelteKit site (public showcase, open-source artifact).
- **`yesid.dev-cms`** (this repo) — Payload CMS admin + REST/GraphQL API + **MCP endpoint (`/api/mcp`)** + DB schema.

Both deploy independently to Vercel. CMS at `cms.yesid.dev`.

## Slice docs

Slice 18 specs, plans, logs, handoffs live in the yesid.dev repo under `docs/slices/slice-18/`. See:

- [Slice 18 overview](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/README.md)
- [Slice 18a spec](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/slice-18a/spec.md)
- [Slice 18a plan](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/slice-18a/plan.md)

## License

MIT (consistent with Payload's license).
```

**`yesid.dev-cms/AGENTS.md` template (thin pointer):**

```md
# AGENTS.md — yesid.dev-cms

This repo inherits the workflow contract from [mgkdante/yesid.dev](https://github.com/mgkdante/yesid.dev) — see that repo's [AGENTS.md](https://github.com/mgkdante/yesid.dev/blob/main/AGENTS.md) for the authoritative process (3-level hierarchy: Slice → Sub-slice → Task; 4-file sub-slice bundle; self-appending handoff; mandatory tool attribution).

## Repo-specific adjustments

- Commit prefix for Slice 18 work: `feat(cms-slice-18<letter>): …`, `chore(cms-slice-18<letter>): …`, `docs(cms-slice-18<letter>): …`.
- Runtime: **bun**, Node 22 (consistent with `yesid.dev`). `bun install`, `bun dev`, `bun run build`, `bunx payload migrate`, `bunx payload generate:types`.
- Slice bundle docs (spec/plan/log/handoff) live in the `yesid.dev` repo at `docs/slices/slice-18/slice-18<letter>/` — this repo only has code. Rationale: `yesid.dev` is the primary consumer during the migration; when `yesid.dev-cms` spins out as a public framework-agnostic template (Phase C2+), it will gain its own `docs/slices/` directory.
- Cross-tool portability (Codex + Claude Code) applies here too — see the yesid.dev AGENTS.md overlay.
```

**`yesid.dev-cms/CLAUDE.md` template (role bindings mirrored from yesid.dev):**

```md
# CLAUDE.md — Claude Code entry point for yesid.dev-cms

> **Read [AGENTS.md](AGENTS.md) first.** Workflow contract is there — tool-agnostic, shared with Codex. This file is a thin pointer + Claude Code role bindings.

## Claude Code role bindings

| AGENTS.md role                        | Claude Code binding                                      |
| ------------------------------------- | -------------------------------------------------------- |
| deeper-reasoning model                | **Opus 4.7** (200k)                                      |
| deeper-reasoning model (XL)           | **Opus 4.7 `[1m]`** (1M context)                         |
| faster/cheaper model                  | **Sonnet 4.6**                                           |
| live progress tracker                 | `TodoWrite` tool                                         |
| parallel-dispatch mechanism           | `Agent` tool with `model: 'sonnet'` or `model: 'opus'`   |
| mid-session model switch              | `/model <name>` slash command                            |
| context-budget check                  | `/cost` or `/context-budget` slash commands              |
| tool config                           | `.claude/settings.json` + `.mcp.json` at repo root (when needed) |

**Never Haiku.** Mirrors `yesid.dev/CLAUDE.md` bindings exactly — this repo has no CMS-specific overrides at 18a.
```

**Part A steps:**

- [ ] **Step 1:** Create all three files with the templates above.
- [ ] **Step 2:** Commit.
  ```bash
  # in yesid.dev-cms
  git add README.md AGENTS.md CLAUDE.md
  git commit -m "docs(cms-slice-18a): add thin README + AGENTS + CLAUDE pointers to yesid.dev"
  git push
  ```
- [ ] **Step 3:** Open PR A in `yesid.dev-cms` (main ← main is N/A since we've been pushing to main directly for this greenfield repo). Actually — pause: was Task 18a-1 through 18a-3 pushed to `main` directly, or a feature branch?
  - **Decision carried from spec:** for a greenfield repo with zero collaborators, push to `main` directly is fine. PR A is **skipped** for `yesid.dev-cms` in 18a; the git history on `main` is the audit trail. Future sub-slices (18b+) will use PR-per-sub-slice once there's meaningful diff review value.
  - If Yesid prefers a PR regardless: open one from a `slice-18a` branch after resetting `main` → `HEAD~N` and force-pushing. Defer to implementation-time preference; default = no PR in `yesid.dev-cms` for 18a.

### Part B — `yesid.dev` bundle finalization + ARCHITECTURE update + PR B

**Files:**
- Modify: `yesid.dev/docs/slices/slice-18/slice-18a/log.md` — finalize (appended throughout; final polish here)
- Modify: `yesid.dev/docs/slices/slice-18/slice-18a/handoff.md` — finalize (self-appended per-task; consolidate here)
- Modify: `yesid.dev/docs/slices/slice-18/README.md` — add sub-slice table + flip 18a row to `complete`
- Modify: `yesid.dev/docs/reference/ARCHITECTURE.md` — add "Two-repo topology (Slice 18)" subsection
- Modify: `yesid.dev/docs/roadmap/PLAN.md` — flip Slice 18 row from `planned` to `in progress (18a shipped)`
- Modify: `yesid.dev/tree.txt` — regenerate via PowerShell command (from PLAN.md header)

**`ARCHITECTURE.md` edit** — add subsection under "Topology" or equivalent (locate based on current file structure at implementation time):

```md
### Two-repo topology (Slice 18 onwards)

yesid.dev is no longer self-contained for content. Slice 18 (Payload CMS) splits responsibility across two repos that deploy independently:

| Repo | Role | Runtime | Deploys to |
|------|------|---------|------------|
| `yesid.dev` | SvelteKit site — consumes content via Payload REST API | bun | yesid.dev |
| `yesid.dev-cms` | Payload 3 + Next.js admin + API + DB schema + **MCP surface (`/api/mcp`)** | bun (Node 22) | cms.yesid.dev |

Database: **Neon Postgres** (free tier, scale-to-zero, DB branching per PR).
Media: **Vercel Blob**.
Type sync (arrives in 18c): `yesid.dev-cms` schema change → `payload generate:types` → GitHub Action → PR in `yesid.dev` updating `src/lib/cms-types.ts`.

Slice 18a landed the infrastructure only: admin reachable, bootstrap idempotent, zero collections beyond `users` + `site-meta` heartbeat. 18b adds the full content model; 18c swaps the first frontend service off static data onto the Payload REST API.
```

**`docs/slices/slice-18/README.md` edit** — append a new section:

```md
## Sub-slices

| # | Name | Status | Size | PR |
|---|------|--------|------|-----|
| 18a | CMS Infrastructure Foundation | complete (2026-04-XX) | L | yesid.dev #B, yesid.dev-cms main@<SHA> |
| 18b | Content Model + Seed | planned | L | — |
| 18c | Type Sync + First Service Swap (site-meta) | planned | M | — |
| 18d | Globals Swap (nav, home, about, contact, errors) | planned | M | — |
| 18e | Collections Swap (blog, projects, services, tech-stack, stack-scenarios) | planned | L | — |
| 18f | Preview + Revalidation Webhook + TS Data File Cleanup | planned | M | — |
```

**`docs/roadmap/PLAN.md` edit** — update the Slice 18 row:

```md
| 18  | Cloud content layer — Payload (own repo) + Neon    | in progress — 18a shipped (PR #B) | 16, 17       | 5-7           |
```

**Part B steps:**

- [ ] **Step 1:** Finalize `log.md` — consolidate per-task appends into a clean chronological record. Include: GitHub repo URL, Vercel project URL, Neon project URL, Blob store name, Resend API key scope, DNS CNAME target, production URL, and PR numbers.
- [ ] **Step 2:** Finalize `handoff.md` — this becomes PR B's body. Structure: Summary → What shipped (bulleted) → What verified (bulleted) → Open items for 18b (notably: D5 DNS verification, Q1 generated-types location, Q3 repo visibility flip) → Free-tier usage snapshot → Retrospective (what took longer than expected, what to compress in 18b-18f).
- [ ] **Step 3:** Edit `docs/reference/ARCHITECTURE.md` with the two-repo topology subsection (pattern above). Locate the right section by reading the file first; match existing heading style.
- [ ] **Step 4:** Edit `docs/slices/slice-18/README.md` — append the sub-slice table (pattern above).
- [ ] **Step 5:** Edit `docs/roadmap/PLAN.md` — update Slice 18 row status (pattern above).
- [ ] **Step 6:** Regenerate `tree.txt` via PowerShell:
  ```powershell
  Get-ChildItem -Recurse -Name | Where-Object { $_ -notmatch 'node_modules|\.git|\.remember|bun\.lockb|\.svelte-kit|\.vercel|\.DS_Store' } | Out-File tree.txt -Encoding utf8
  ```
  (from PLAN.md `tree.txt` convention). Only diff should be the new slice-18a bundle directory.
- [ ] **Step 7:** Verify no `src/` changes: `git diff main -- src/ tests/` → empty.
- [ ] **Step 8:** Commit all doc changes.
  ```bash
  # in yesid.dev
  git checkout -b slice-18a-docs
  git add docs/slices/slice-18/ docs/reference/ARCHITECTURE.md docs/roadmap/PLAN.md tree.txt
  git commit -m "docs(slice-18a): bundle + ARCHITECTURE + sub-slice table + PLAN flip"
  git push -u origin slice-18a-docs
  ```
- [ ] **Step 9:** Open PR B using `handoff.md` as the body:
  ```bash
  gh pr create --base main --head slice-18a-docs \
    --title "Slice 18a docs — CMS Infrastructure Foundation" \
    --body "$(cat docs/slices/slice-18/slice-18a/handoff.md)"
  ```
- [ ] **Step 10:** Wait for CI green. Merge PR B (squash, per repo convention).
- [ ] **Step 11:** Close the sub-slice:
  ```bash
  bun run slice:close 18a --name "CMS Infrastructure Foundation" --pr <B>
  ```
  The script mirrors the bundle to `<cloud>/yesid.dev/docs/archive/slices/slice-18/slice-18a/` and appends a one-liner to `COMPLETED-SLICES.md`.

**STOP criteria:**
- PR B merged. CI green.
- `bun run slice:close 18a` ran successfully. Bundle archived in cloud.
- `docs/slices/slice-18/README.md` shows 18a row = complete.
- `docs/roadmap/PLAN.md` shows Slice 18 = in progress.
- Memory `project_completed_slices.md` auto-appended (or manually appended at end of session).

---

## PR + close protocol (summary)

Per spec D11:

1. Tasks 18a-1 → 18a-5 push commits directly to `yesid.dev-cms/main` (greenfield repo, no PR review value yet).
2. Task 18a-6 Part A commits README/AGENTS/CLAUDE to `yesid.dev-cms/main`.
3. Task 18a-6 Part B opens PR B in `yesid.dev` from `slice-18a-docs` branch. PR body = `handoff.md`.
4. PR B merges (squash).
5. `bun run slice:close 18a` archives the bundle.
6. Memory auto-save (via `anthropic-skills:consolidate-memory` or manual append to `project_completed_slices.md`).

## Risk register

| Risk | Mitigation |
|---|---|
| **Payload 3 + Node 22 + Next.js 15 incompatibility** surfaces at `bun create payload-app` (Task 18a-1) | Fall back to Payload's recommended Next.js version in the template. Pin both in `package.json`. Note in handoff. |
| **Neon Vercel integration double-sets `DATABASE_URL`** if a prior Neon project already linked to the Vercel team | Create `yesid-dev-cms` as a fresh Neon project + fresh Vercel project in Task 18a-4. Do not reuse existing Neon projects. |
| **DNS propagation >60 min** blocks login verification in Task 18a-5 | Task 18a-5 Steps 3-4 tolerate up to 60 min wait. If longer, switch to `<vercel-deployment-url>/admin` for verification, return to DNS-based URL once propagation completes. Handoff notes the actual propagation time. |
| **`prodMigrations` cold-start exceeds function timeout** on first deploy | Default Vercel function timeout is now 300s (knowledge-update). For a single small migration, well under. If it ever fails, add `maxDuration: 300` to the admin route file. |
| **`onInit` bootstrap duplicates admin on multi-region cold starts** (two functions boot simultaneously, both find "no admin", both create) | Payload's email uniqueness constraint on `users.email` makes the second create fail — Postgres uniqueness violation. One admin wins; handoff notes any "duplicate key" log line as expected-benign. |
| **Resend sender DNS verification** drags into 18a | Explicitly deferred to 18b (spec D5, Q5). Sandbox sender handles admin-only password reset. Do NOT block 18a on this. |
| **Vercel Blob token scope error** when 18b enables `collections: { media: true }` | 18a just provisions the token; 18b will verify scope on first upload. If 18a's provisioning step creates a store with wrong scope, fix at that step — handoff notes the store name + scope for 18b pickup. |
| **bun + Payload ecosystem friction** (Payload docs/templates assume pnpm) | Per D1 amendment: verify during Task 18a-1 Steps 3–9 that `bun create payload-app` + `bun dev` + `bunx payload migrate` all work. If a specific command fails, either try `bunx <pnpm-equivalent>` or fall back to pnpm with a recorded amendment. Do NOT silently switch runtimes mid-slice. |
| **MCP API-key leakage** — `/api/mcp` accepts Bearer auth; a leaked key is full CMS write surface | Keys generated only at 18a-5 post-rotation, stored in Yesid's password manager, never committed to any repo. Document the generation flow in `yesid.dev-cms/README.md`. |

## Out of scope reminders (from spec, repeated here for discipline)

- No content collections beyond `users` + `site-meta`.
- No seed script.
- No frontend integration.
- No type-sync GitHub Action.
- No admin theming.
- No preview route or revalidation webhook.
- No deletion of `yesid.dev` TS data files.
- No multi-tenancy or custom access control beyond role-gated defaults.
- No Lexical editor customization.
- No framework integration recipes beyond a README placeholder paragraph.
