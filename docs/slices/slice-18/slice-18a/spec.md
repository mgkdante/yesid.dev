# Sub-Slice 18a — CMS Infrastructure Foundation

**Parent slice:** [Slice 18 — Cloud Content Layer: Payload (own repo) + Neon](../README.md)
**Status:** planning (2026-04-20)
**Depends on:** Slice 16 (E2E + Perf + Brand QA), 17c (Zod schemas) ✓ — both gate full Slice 18 start. 18a itself has no `yesid.dev` code dependency; it's greenfield work in a new repo.
**Unblocks:** 18b (content model + seed script), 18c (type-sync Action + first service swap), and every downstream 18 sub-slice.
**Size:** L (two sessions — session 1: local stack up, Payload admin reachable at `localhost:3000`; session 2: Neon + Vercel + Blob + Resend + DNS, admin reachable at `cms.yesid.dev`).
**Est. Sessions:** 1–2.
**Lives in two repos:** CODE ships in the NEW repo **`yesid.dev-cms`**; this DOCS bundle + `ARCHITECTURE.md` updates ship in `yesid.dev`.
**Design spec (authoritative):** `<cloud>/yesid.dev/docs/archive/legacy-flat/specs/2026-04-16-cms-payload-design.md` — read first. All four design decisions carried over here (Payload/Neon/Blob/two-repo).

## Goal

Stand up `yesid.dev-cms` — a brand-new Payload 3 + Next.js CMS — from empty to a reachable admin UI at `https://cms.yesid.dev/admin` with email-password login working against a Neon Postgres database and Vercel Blob media storage. No collections beyond a `users` auth collection and a single `site-meta` heartbeat global that proves the stack end-to-end.

After 18a, Slice 18's migration has a live, reachable backend. 18b grows the full content model + seed. 18c wires the first frontend service swap. Everything downstream layers on the foundation 18a establishes. `yesid.dev` source code is **untouched** in 18a — only `docs/` updates.

## Why now

Three reasons this must be its own sub-slice before any content model or data migration lands:

1. **Unknown-unknowns live at the infrastructure layer.** Neon pooler behavior under Vercel cold starts, Vercel Blob token scoping, Resend DNS verification, admin bootstrap flow, Payload migration runner, Next.js 15 + Node runtime pinning on Vercel — all of these have to be proven in a clean deploy **before** the full content model stacks on top. Debug one surface at a time.
2. **Environment drift is real.** Local dev against a Neon dev branch, prod against a Neon main branch, previews against auto-branched DBs — one settled answer per environment must land before collections multiply. Wrong call at 18a costs an afternoon; wrong call at 18e costs a weekend.
3. **"Hello world" de-risks the template pitch.** `yesid.dev-cms` is ALSO the framework-agnostic Payload starter we sell to clients later. The smallest repo that deploys cleanly is the strongest first commit — it becomes the public proof-of-concept and the seed for per-framework integration recipes.

## Non-goals (deliberate scope guards)

- **No content collections beyond `users` + `site-meta` heartbeat.** `projects`, `services`, `blog-posts`, `tech-stack`, `stack-scenarios`, and the remaining globals land in 18b. Writing them against unproven infra wastes the debugging feedback loop.
- **No seed script.** 18b owns data import from `yesid.dev` (`projects.ts`, `services.ts`, blog content, etc.).
- **No frontend integration.** `yesid.dev` reads from its existing static adapter throughout 18a. No `src/lib/adapters/payload.ts`, no fetch utilities, no Zod wiring for Payload responses. 18c owns the first service swap (`site-meta` as pilot).
- **No type-sync GitHub Action.** `payload generate:types` is run manually at 18a-5 to prove the CLI works; the cross-repo Action lands in 18c with the first consumer-side import.
- **No admin theming.** React admin stays Payload's default. Brand polish (dark palette, orange accent, custom logo) is a post-v1 polish sub-slice.
- **No preview route or revalidation webhook.** 18f owns both.
- **No deletion of any `yesid.dev` TS data files.** 18f owns cleanup.
- **No multi-tenancy.** One Payload instance, one owner (Yesid). Editor/client roles arrive per-client later.
- **No custom access control.** Payload's built-in `users.roles` + default `isAdmin`-style access is sufficient for one operator in 18a.
- **No Lexical editor customization.** Default Lexical is fine; customization only matters once `blog-posts` exists in 18b.
- **No framework integration recipes beyond a placeholder paragraph.** Full SvelteKit recipe lands with 18c's dogfooded service swap; Next.js / Astro / Nuxt recipes land on paying-client demand.
- **No GitHub issue templates, CODEOWNERS, or repo polish** on `yesid.dev-cms`. That's all 18g or a repo-polish slice.

## Design decisions

### D1 — New repo `yesid.dev-cms`; **bun** (not pnpm); Node 22

**Amended 2026-04-20 per Yesid's direction.** Initial draft recommended pnpm on Payload ecosystem-fit grounds (Payload docs + templates are pnpm-first). Overridden: **consistency with the primary `yesid.dev` bun runtime wins.** One runtime across both repos, one mental model, one `PATH` binding, one lockfile format to reason about. If Payload-specific bun incompatibilities surface (unlikely for 18a's scope: Next.js 15 + `@payloadcms/db-postgres` + Resend adapter + Blob plugin + MCP plugin all use standard Node APIs bun supports), we fall back to pnpm with a recorded amendment and move on.

Node pinned to **Node 22 LTS** via `.nvmrc` + `package.json.engines` + Vercel project settings. bun bundles its own JS runtime but honors `engines.node` when invoked as `bun`; Payload 3.83's supported matrix lists Node 20/22.

**Canonical commands throughout this slice:**

| Purpose | Command |
|---|---|
| Scaffold | `bun create payload-app` |
| Install deps | `bun install` |
| Add dep | `bun add <pkg>` |
| Dev server | `bun dev` (runs `package.json` `"dev": "next dev"`) |
| Production build | `bun run build` |
| Type check | `bunx tsc --noEmit` |
| Payload CLI (migrate, types, etc.) | `bunx payload <subcommand>` |

Lockfile is `bun.lock` (bun 1.2+ text format; replaces the older binary `bun.lockb`). Committed.

### D2 — Postgres adapter; `push: false`; migrations are the only schema history

Use `@payloadcms/db-postgres` (not Mongoose). Schema evolves via Payload-generated migrations, committed to the repo.

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { migrations } from './migrations'

db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URI ?? process.env.DATABASE_URL },
  push: false,             // never auto-sync schema; always via migrations
  migrationDir: './migrations',
  prodMigrations: migrations, // see D7 — runtime migrate on Vercel cold start
})
```

`push: false` is deliberate. Auto-push is fine for scratch work but dangerous in a Neon-branched world where every Vercel PR gets its own DB branch — a push from one branch can silently diverge schema and leave later merges unsure of truth. Migrations are the single serial history, which `yesid.dev-cms` clients (including yesid.dev itself) will trust.

### D3 — Neon provisioned via Vercel Marketplace integration, not manual wiring

Provision Neon via the Vercel Marketplace integration. The integration auto-sets these env vars on the Vercel project:

- `DATABASE_URL` (pooled, `-pooler.` host, for serverless function connections)
- `DATABASE_URL_UNPOOLED` (direct host, for migrations — pooled endpoints reject DDL)
- `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (raw components)

and automatically creates a DB branch per Vercel preview deployment, destroyed on merge. This is exactly what the design spec wants from day one; doing it manually duplicates what the integration already handles.

Payload's `postgresAdapter` reads `DATABASE_URI` by convention; alias to `DATABASE_URL` in `payload.config.ts`:

```ts
pool: { connectionString: process.env.DATABASE_URI ?? process.env.DATABASE_URL }
```

Migrations CLI uses `DATABASE_URL_UNPOOLED` explicitly (Task 18a-5) because the Neon pooler endpoint refuses DDL.

### D4 — Vercel Blob adapter registered in config; no enabled collections until 18b

`@payloadcms/storage-vercel-blob` lives in `payload.config.ts` from 18a, but the `collections` map stays empty until 18b introduces the `media` collection. Registering the plugin with no enabled collections is a runtime no-op and saves a config diff when 18b flips `media: true`.

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

plugins: [
  vercelBlobStorage({
    enabled: true,
    collections: {
      // media: true   ← uncommented in 18b when the Media collection lands
    },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
]
```

Blob store is provisioned via Vercel dashboard in 18a so `BLOB_READ_WRITE_TOKEN` is already set when 18b wires uploads. Zero uploads actually happen in 18a.

### D5 — Resend for email; DNS verification deferred to 18b

Use `@payloadcms/email-resend`. The default `from` address is `no-reply@cms.yesid.dev` once DNS (SPF/DKIM) is verified on Resend. Before DNS verification, Resend's sandbox sender works for admin-only email (password reset to Yesid's own address). Full sender DNS verification can slide into 18b without blocking 18a's acceptance criteria.

```ts
email: resendAdapter({
  defaultFromAddress: 'no-reply@cms.yesid.dev',
  defaultFromName: 'yesid.dev CMS',
  apiKey: process.env.RESEND_API_KEY ?? '',
})
```

If `RESEND_API_KEY` is unset in local dev, Payload logs emails to console — fine for development.

### D6 — Admin bootstrap via `onInit` hook + env-gated creds, rotated after first login

A fresh Neon DB has no admin user on first deploy. Two options:

| Approach | Verdict |
|---|---|
| Run `payload seed` from Yesid's laptop against the prod DB | Rejected — requires local → prod DB access; leaks creds through terminal history; breaks if laptop is offline during deploy |
| `onInit(payload)` hook creates an admin from env vars if none exists | ✓ Chosen — idempotent, runs on cold start, zero laptop dependency |

```ts
onInit: async (payload) => {
  const existing = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'admin' } },
    limit: 1,
  })
  if (existing.totalDocs === 0 && process.env.PAYLOAD_ADMIN_EMAIL) {
    await payload.create({
      collection: 'users',
      data: {
        email: process.env.PAYLOAD_ADMIN_EMAIL,
        password: process.env.PAYLOAD_ADMIN_PASSWORD!,
        roles: ['admin'],
      },
    })
    payload.logger.info('[slice-18a] Bootstrap admin created')
  }
}
```

`PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD` are set in Vercel dashboard env once; the hook runs at cold start; admin is provisioned idempotently. After first successful login, Yesid rotates the password via the admin UI and **removes the two bootstrap env vars from Vercel**. Handoff notes both actions.

Risk: anyone who reads Vercel env vars before rotation sees the bootstrap creds. Mitigation: rotate + remove within 24 h of first login. Acceptable day-one for a one-operator system.

### D7 — `prodMigrations` for Vercel cold starts; no separate migrate step

Vercel serverless doesn't run persistent processes, so `bunx payload migrate` as a deploy step would need a custom build command with direct DB access from Vercel's build environment. Cleaner path: pass `prodMigrations: migrations` to `postgresAdapter`, which applies pending migrations the first time a function cold-starts. Payload tracks applied migrations in a `payload_migrations` table and skips already-applied ones, so runs are idempotent across the fleet.

Trade-off: the first cold-start post-deploy is slower (migration window + normal init). For yesid.dev's day-one traffic (single admin), imperceptible. If this ever becomes a problem (high-traffic client CMS down the line), switching to a build-time migrate step is a local change.

### D8 — Localization config baked in from 18a; field-level `localized: true` used from 18b

`localization: { defaultLocale: 'en', locales: ['en', 'fr', 'es'], fallback: true }` lives in `payload.config.ts` from 18a. Collections added in 18b mark individual fields `localized: true` without a config diff. The `site-meta` heartbeat global has a single **non-localized** `siteName: string` field — enough to prove the stack. Localized fields get exercised in 18b with `title`/`description`/etc. on real collections.

### D9 — `site-meta` global is the heartbeat, not a throwaway

The `site-meta` global defined in 18a (fields: `siteName: string`, `deployedAt?: string` auto-set by a `beforeChange` hook) is the **same** global that 18b extends with brand name, tagline, description, links — and the **same** global that 18c's first service swap (`getSiteMeta()`) points to. Don't throw it away after proof-of-life; grow it. 18b field additions are additive migrations.

### D10 — Repo governance: `yesid.dev-cms` inherits yesid.dev workflow discipline on day one

`yesid.dev-cms` gets its own thin `AGENTS.md` + `CLAUDE.md` + 4-file slice bundle convention on day one so future work in that repo (18b onwards, plus future clients who fork it) inherits the same workflow:

- `yesid.dev-cms/AGENTS.md` (≈30 lines) — points at the `yesid.dev` AGENTS.md for the core contract, adds a note about the CMS-side commit prefix (`feat(cms-slice-18a): …`) and the cross-repo bundle location.
- `yesid.dev-cms/CLAUDE.md` — mirrors the yesid.dev role-binding table (Opus 4.7 for deeper reasoning, Sonnet 4.6 for execution); no CMS-specific overrides needed in 18a.
- No `docs/slices/` directory yet in `yesid.dev-cms` — that bundle lives in `yesid.dev` during Slice 18 because yesid.dev is the primary repo being migrated. `yesid.dev-cms` starts its own slice directory only when it diverges as a standalone product (Phase C2+ — public template release).

The workflow-efficiency skill (v1.1.0 from 17k) auto-activates on session start in the new repo without any extra wiring.

### D12 — Payload MCP plugin enabled in 18a as a first-class capability

**Amended 2026-04-20 per Yesid's direction.** `@payloadcms/plugin-mcp` ships in `payload.config.ts` from day one, not as a later polish. The plugin exposes Payload collections + globals as MCP tools at `https://cms.yesid.dev/api/mcp`, authenticated via per-user API keys generated from the admin UI. This is the payoff that reframes `yesid.dev-cms` from "headless CMS" to "headless CMS with native agent surface" — the client-offering pitch becomes "WordPress flexibility without WordPress, modern, **and agent-editable out of the box.**"

```ts
import { mcpPlugin } from '@payloadcms/plugin-mcp'

plugins: [
  vercelBlobStorage({ /* ... */ }),
  mcpPlugin({
    globals: {
      'site-meta': {
        enabled: { find: true, update: true },
        description:
          'Site-wide metadata — heartbeat in 18a, extended in 18b with brand name, tagline, description, links.',
      },
    },
    // collections: {} — each content collection exposed in 18b as it lands
  }),
]
```

**In scope for 18a:**
- Plugin registered in `payload.config.ts`.
- `site-meta` global exposed with `find` + `update` MCP operations — the heartbeat doubles as MCP smoke test.
- MCP API key generated via admin UI for Yesid's own workflow (Claude Code / Cursor / VS Code) post-bootstrap.
- Acceptance: MCP endpoint reachable + a `find` request against `site-meta` from a local MCP client returns the heartbeat value edited in 18a-5.

**Out of scope for 18a (deferred to 18b or later):**
- Exposing any collection beyond `site-meta`. Each content collection (`projects`, `services`, `blog-posts`, etc.) gets MCP-enabled in 18b when the collection itself lands.
- Custom API-key scoping or role-based MCP filtering. Default one-operator posture is sufficient in 18a.
- Configuring Yesid's MCP clients (`.mcp.json` in `yesid.dev`, Cursor config, VS Code config) to talk to the prod endpoint — that's a workstation setup step, not a repo commit.
- Rate limiting or audit logging on the MCP endpoint — Payload's defaults hold; custom hardening is a polish slice.

**Why first-class from 18a, not later:**

1. **Yesid's workflow from day one.** As soon as `site-meta` is editable, Claude Code can edit it via MCP without opening the browser. That's immediate leverage.
2. **Template positioning.** Every public demo of `yesid.dev-cms` shows MCP-native out of the box — no "and then install this plugin" footnote.
3. **Smoke-test compounding.** The heartbeat (`site-meta` edit persists) is already in scope; piggy-backing an MCP `find` on the same doc costs nothing extra and proves a second surface works.
4. **Plugin add-after-the-fact is strictly harder.** Plugin registration affects the admin UI chrome (extra "API Keys" admin panel), the routing tree (`/api/mcp` added), and per-user key creation UX. Baking it in while schema is empty is smoother than retrofitting when collections exist.

### D11 — Two-PR cross-repo close protocol

Slice 18a touches two repos, so the close protocol differs from single-repo sub-slices:

- **PR A — `yesid.dev-cms`** (substantive): all scaffolding, config, bootstrap, README, AGENTS, CLAUDE. Title: `Slice 18a — CMS infrastructure foundation`. Body: contents of `yesid.dev/docs/slices/slice-18/slice-18a/handoff.md` (copy-paste at merge time).
- **PR B — `yesid.dev`** (docs-only): this bundle (spec + plan + log + handoff) + `ARCHITECTURE.md` updates + `docs/slices/slice-18/README.md` row flip + `tree.txt` regen. Title: `Slice 18a docs — CMS foundation (companion to yesid.dev-cms PR #N)`. Opens **after** PR A merges so the handoff can reference a real PR URL and production deploy.
- `bun run slice:close 18a --name "CMS Infrastructure Foundation" --pr <B>` runs in yesid.dev after PR B merges; archives the bundle to `<cloud>/yesid.dev/docs/archive/slices/slice-18/slice-18a/`.

Commits in `yesid.dev-cms` use prefix `feat(cms-slice-18a): ...` so `slice-18a` is greppable across both repos. Commits in `yesid.dev` use `docs(slice-18a): ...`.

## File-touch summary

### NEW repo: `yesid.dev-cms` (created in 18a)

- GitHub repo: `mgkdante/yesid.dev-cms`, **private** in 18a; public flip happens in a later polish slice when the template pitch is marketing-ready.
- Scaffold command: `bun create payload-app yesid-dev-cms --template blank --db postgres` (D1).
- Files (after scaffold + 18a edits, ~20 new files beyond the scaffold):
  - `package.json` — bun, Node 22, Next.js 15, Payload 3.83, `@payloadcms/db-postgres`, `@payloadcms/storage-vercel-blob`, `@payloadcms/email-resend`, **`@payloadcms/plugin-mcp`** (D12)
  - `bun.lock` — committed
  - `payload.config.ts` — postgresAdapter + vercelBlobStorage plugin + **mcpPlugin (D12)** + resendAdapter + onInit bootstrap + localization + `users` + `site-meta`
  - `src/collections/Users.ts` — auth collection; `roles` field with `['admin', 'editor']` enum (editor unused in 18a but reserved)
  - `src/globals/SiteMeta.ts` — heartbeat global (also the first MCP-exposed global per D12)
  - `src/app/(payload)/admin/[[...segments]]/page.tsx` — Next.js admin route (from template, unchanged)
  - `src/app/(payload)/api/[...slug]/route.ts` — REST API route (from template, unchanged)
  - `migrations/00001_initial.ts` (generated by `bunx payload migrate:create`)
  - `migrations/index.ts` (generated barrel that `prodMigrations` imports)
  - `payload-types.ts` — generated by `bunx payload generate:types`, committed (per Q1)
  - `.env.example` — documents every required env var, zero secrets
  - `.env.local` — untracked, local dev only, points at Neon dev branch
  - `.nvmrc` — `22`
  - `AGENTS.md` — thin, ~30 lines, backlinks yesid.dev AGENTS.md + workflow-knowledge
  - `CLAUDE.md` — role-binding table mirrored from yesid.dev
  - `README.md` — pitch paragraph + local run instructions + backlink to `yesid.dev/docs/slices/slice-18/`
  - `.gitignore`, `tsconfig.json`, `next.config.mjs` — from template, no edits in 18a

### NEW external infrastructure (provisioned in 18a)

- Vercel project `yesid-dev-cms` linked to the GitHub repo; deploy to prod at `cms.yesid.dev`.
- Neon project `yesid-dev-cms` (free tier, region = `aws-us-east-1` to match yesid.dev's Vercel region).
- Vercel Blob store named `yesid-dev-cms-media`, scoped to the Vercel project.
- Resend account (org: Yesid), API key generated for `yesid-dev-cms`.
- DNS: CNAME `cms.yesid.dev` → Vercel alias target (same DNS provider as `yesid.dev`).
- Vercel env vars (all via dashboard; NEVER committed):
  - `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (auto-set by Neon integration)
  - `PAYLOAD_SECRET` — 32-char random, generated via `openssl rand -base64 32`
  - `BLOB_READ_WRITE_TOKEN` (auto-set by Vercel Blob integration)
  - `RESEND_API_KEY` (manually copied from Resend dashboard)
  - `PAYLOAD_ADMIN_EMAIL`, `PAYLOAD_ADMIN_PASSWORD` — seed only, removed after first login per D6
  - `NEXT_PUBLIC_SERVER_URL=https://cms.yesid.dev`
  - `PAYLOAD_PUBLIC_SERVER_URL=https://cms.yesid.dev`

### MODIFIED in `yesid.dev` (docs-only)

- `docs/slices/slice-18/slice-18a/spec.md` (this file)
- `docs/slices/slice-18/slice-18a/plan.md`
- `docs/slices/slice-18/slice-18a/log.md` (created at 18a-1, appended per-task per AGENTS.md)
- `docs/slices/slice-18/slice-18a/handoff.md` (created at 18a-1, self-appended per-task, finalized at 18a-6)
- `docs/reference/ARCHITECTURE.md` — add "Two-repo topology (Slice 18)" subsection + one new row in the component table pointing to `yesid.dev-cms`
- `docs/slices/slice-18/README.md` — add a sub-slice table (currently absent); 18a row flips to `complete` at close
- `docs/roadmap/PLAN.md` — flip the Slice 18 status cell from `planned` to `in progress (18a shipped PR #N)` after PR B merges
- `tree.txt` — regenerated at sub-slice close (only diff: new bundle directory)

### UNTOUCHED in `yesid.dev` (by design — D11)

- `src/lib/adapters/static.ts` and every other source file — frontend still reads from static data throughout 18a
- `src/lib/schemas/*.ts` — Payload response schemas arrive in 18c
- `src/lib/content/*` — TS data files untouched until 18f
- Any route loader, any component, any test
- `package.json` / `bun.lockb` — no new deps

## Acceptance criteria

### Infrastructure

- [ ] `yesid.dev-cms` repo exists on GitHub under `mgkdante/`, private.
- [ ] `bun install && bun dev` on a clean clone starts Payload admin at `http://localhost:3000/admin`.
- [ ] Local dev connects to a dedicated Neon dev branch (NOT Docker, NOT prod main) via `.env.local`.
- [ ] `bunx payload migrate:create` produced `migrations/00001_initial.ts`, committed.
- [ ] `bunx payload generate:types` produced `payload-types.ts`, committed (per Q1).
- [ ] **MCP plugin wired** — `@payloadcms/plugin-mcp` in `package.json`, `mcpPlugin({ globals: { 'site-meta': { enabled: { find: true, update: true } } } })` in `payload.config.ts` (D12).
- [ ] Vercel project `yesid-dev-cms` exists, linked to the GitHub repo, production deploy green on main.
- [ ] Vercel Blob store provisioned; `BLOB_READ_WRITE_TOKEN` auto-set in Vercel env.
- [ ] Neon project linked via Vercel Marketplace integration; DB branching confirmed by a throwaway PR that spins up a preview branch + tears it down on close.
- [ ] Resend API key set in Vercel env (full sender DNS verification deferred to 18b per D5).
- [ ] DNS CNAME `cms.yesid.dev` → Vercel; certificate issued; HTTPS loads cleanly.

### Functional

- [ ] `https://cms.yesid.dev/admin` loads the Payload admin login page within 3 s of first cold start.
- [ ] First Vercel cold start runs `prodMigrations`; `payload_migrations` table has exactly one applied migration row.
- [ ] `onInit` hook creates exactly one admin user from `PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD` on first cold start; subsequent cold starts are idempotent — no duplicate admin, no log spam.
- [ ] Yesid can log in at `https://cms.yesid.dev/admin` with the seed creds.
- [ ] After first login, the `site-meta` global can be edited and saved via the admin UI; the change persists across a page refresh and across a fresh Vercel function cold start.
- [ ] Password rotated via admin UI; `PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD` **removed** from Vercel env; a post-removal redeploy still works (hook finds existing admin, no-op, no error).
- [ ] A throwaway Vercel preview PR in `yesid.dev-cms` auto-creates a Neon DB branch, runs `prodMigrations` against it, and tears down cleanly on PR close.

### MCP endpoint (D12)

- [ ] `https://cms.yesid.dev/api/mcp` responds to a valid MCP `initialize` request with a 200 and the MCP server capabilities JSON.
- [ ] An MCP API key is generatable from the admin UI (Payload's built-in flow) and scoped to Yesid's admin user.
- [ ] A local MCP client (e.g., `mcp-remote` via `npx`) configured against the prod endpoint + API key lists `site-meta` as a `find`-able + `update`-able tool.
- [ ] Running the MCP `find` tool on `site-meta` from that client returns the same value shown in the admin UI and the REST `/api/site-meta` endpoint (three-way consistency check).
- [ ] MCP client config snippet (`mcp-remote` JSON) captured in `yesid.dev-cms/README.md` under a "Using with MCP" subsection.

### Docs

- [ ] `yesid.dev/docs/slices/slice-18/slice-18a/{spec,plan,log,handoff}.md` all exist. `handoff.md` is the body of `yesid.dev-cms` PR A.
- [ ] `yesid.dev/docs/reference/ARCHITECTURE.md` updated with a two-repo topology subsection.
- [ ] `yesid.dev/docs/slices/slice-18/README.md` gains a sub-slice table; 18a row marked `complete` with PR A + PR B numbers.
- [ ] `yesid.dev-cms/README.md` contains: one-paragraph pitch, local-run instructions, backlink to `yesid.dev/docs/slices/slice-18/`, MIT license note (consistent with Payload's license).
- [ ] `yesid.dev-cms/AGENTS.md` + `CLAUDE.md` exist and mirror yesid.dev conventions (thin pointers).
- [ ] `yesid.dev/tree.txt` regenerated; only new entries under `docs/slices/slice-18/slice-18a/`.

### Budget

- [ ] Neon usage over the first week post-deploy ≤ 5 compute-hours (admin-only traffic, no ISR consumers).
- [ ] Vercel Blob: 0 bytes used in 18a (no uploads).
- [ ] **No payment method** added to Neon or Vercel. Free-tier hard cap is the only cost protection needed for 18a.

### Negative checks (things that must NOT happen)

- [ ] `yesid.dev` has zero source-file changes under `src/` or `tests/`. Verify: `git diff main -- src/ tests/` returns empty.
- [ ] `yesid.dev-cms` has no content collections beyond `users`. No `projects`, `services`, `media`, `blog-posts`, `tech-stack`, `stack-scenarios` — those are 18b.
- [ ] No Payload seed script file in `yesid.dev-cms/` — 18a uses only the `onInit` bootstrap hook, not data seeding.
- [ ] No type-sync GitHub Action in `yesid.dev-cms/.github/workflows/` — 18c owns it.
- [ ] No `src/lib/cms-types.ts` in `yesid.dev` — 18c owns it.
- [ ] No frontend fetch from `yesid.dev` to `cms.yesid.dev` in prod, preview, or local. Verify by grepping `yesid.dev` for `cms.yesid.dev` (should match only docs, never code).
- [ ] **MCP plugin scope boundary:** only `site-meta` exposed. `users` collection NOT MCP-exposed (admin-only). No other collections/globals exposed — those land in 18b alongside their schema definitions.

## Open questions (resolve at implementation time)

- **Q1.** Commit generated `payload-types.ts` to `yesid.dev-cms`, or gitignore and regenerate in CI? **Default: commit.** Single source for local dev + makes the type-sync PR generation in 18c a diff against a known base. Revisit if the file balloons past ~2k lines.
- **Q2.** Use Resend's Vercel integration for auto env var, or manually copy-paste `RESEND_API_KEY`? **Default: Vercel integration.** One less source of truth and the integration scopes the key per project.
- **Q3.** Visibility: private or public `yesid.dev-cms` repo at 18a close? **Default: private.** No public commitments yet, faster iteration, same cost ($0). Flip public when the framework-agnostic pitch is marketing-ready (likely post-18f polish sub-slice).
- **Q4.** Free-tier Neon or Launch ($19/mo)? **Default: free-tier with no payment method attached.** Design spec confirms the free tier's 191.9 compute-hrs/mo + 0.5 GB is sufficient for yesid.dev usage projections.
- **Q5.** Sender DNS verification for `no-reply@cms.yesid.dev` in 18a or 18b? **Default: 18b.** Resend sandbox works for admin-only password reset in 18a; the SPF/DKIM setup is cheap work that doesn't block 18a's acceptance.
- **Q6.** Local dev DB: Neon dev branch or Docker Postgres? **Default: Neon dev branch.** Keeps local and prod identical (Postgres version, pooler behavior, SSL config). Docker is the fallback only if Neon dev-branch cold starts feel sluggish during iteration.
- **Q7.** `payload-types.ts` file location: repo root or `src/`? **Default: repo root** (Payload CLI default). 18c's type-sync Action mirrors to `yesid.dev/src/lib/cms-types.ts`; paths are explicit either way.
- **Q8.** MCP API key storage for Yesid's workstation (Claude Code, Cursor, VS Code configs)? **Default: store in Yesid's password manager, reference from each client's config file via env var expansion where supported.** No MCP key committed to any repo, ever. Document the pattern in `yesid.dev-cms/README.md`.
- **Q9.** Expose `users` collection via MCP? **Default: NO.** Admin identity shouldn't be editable via the same surface that might eventually see less-trusted API keys. Stays admin-UI-only.

## Risks carried into the plan

1. **Neon + Vercel integration edge case** — the integration occasionally double-sets `DATABASE_URL` if a Neon project is already linked to a different Vercel team. Mitigation: provision Neon from a brand-new Vercel project (18a-4) before manually setting any DB env vars.
2. **Resend DNS verification may block first `onInit` email if Payload tries to send a welcome email** — default admin-create flow in Payload does NOT auto-send an email when the user is created server-side via `payload.create()`, so this should be a non-issue. If it surfaces, downgrade `onInit` to skip the email flag. Verify at 18a-5.
3. **Vercel serverless cold-start migration window** — the first post-deploy cold start will run pending migrations inline. If this takes >60 s (Vercel's default function timeout on Hobby), the first request 504s but subsequent requests succeed because the migration completed. Mitigation: set function timeout to 300 s (the new Vercel default per the knowledge-update) for the admin route.
4. **DNS propagation lag** — `cms.yesid.dev` CNAME may take up to 60 min to propagate globally. Plan schedules the DNS change in 18a-4 but acceptance criteria's final login check may happen in 18a-5 to allow propagation.
5. **Payload 3 + Next.js 15 + Node 22 compatibility** — verify `bun create payload-app` produces a template that boots cleanly on Node 22 before committing. Fallback: pin Next.js at the version Payload's template defaults to.
6. **bun + Payload ecosystem compatibility** — Payload's docs/templates/CI examples are pnpm-first (D1 amendment). Specific risk: some Payload dev-time tooling (admin import-map generator, migrate CLI) may shell out to `node` with assumptions that don't hold under bun. Mitigation: first local `bun dev` run (Task 18a-1 Step 9) surfaces this immediately; fallback = pnpm with an amendment, done.
7. **MCP plugin API-key surface** — once `@payloadcms/plugin-mcp` is live, `/api/mcp` accepts Bearer auth; a leaked key is a full CMS write surface. Mitigation: API keys generated only for Yesid's admin user at 18a-5, stored in password manager (Q8), never committed. Audit log review at 18a-5 STOP criteria.

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-20 | Initial spec | Planning session at Slice 18 lead time; 18a is the infrastructure-only foundation, deliberately scoped below the content model and service swaps so each dependency gets debugged in isolation. |
| 2026-04-20 | D1 amended — switched runtime from pnpm to **bun** | Per Yesid's direction: consistency with `yesid.dev`'s bun runtime outweighs Payload's pnpm ecosystem fit. One runtime across both repos, one lockfile format, one mental model. Fallback to pnpm only if bun-specific incompatibilities surface during 18a-1. |
| 2026-04-20 | D12 added — Payload MCP plugin (`@payloadcms/plugin-mcp`) enabled in 18a as first-class | Per Yesid's direction: "MCP tool super important to add." Folds in with heartbeat smoke test at near-zero cost, unlocks agent-editable workflow from day one, reframes `yesid.dev-cms` positioning from "headless CMS" to "headless CMS + native agent surface." Scope: `site-meta` global only in 18a; each content collection MCP-exposed in 18b as its schema lands. |
