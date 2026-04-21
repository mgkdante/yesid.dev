# yesid.dev CMS

Framework-agnostic [Payload 3](https://payloadcms.com) starter backed by **Neon Postgres** + **Vercel Blob**, with **native MCP (Model Context Protocol) surface built in**. Powers [yesid.dev](https://yesid.dev); ships as a reusable CMS foundation for any SvelteKit / Next.js / Astro / Nuxt / REST / MCP consumer.

**Status:** Slice 18a complete — infrastructure foundation + MCP surface live. Content collections land in Slice 18b. Framework integration recipes (SvelteKit first) land in Slice 18c+.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | **bun** (Node 22 via `.nvmrc`) |
| CMS | Payload 3.83 |
| Framework | Next.js 16.2.3 (Turbopack) |
| DB | Neon Postgres 17 (free tier, scale-to-zero, DB branching per PR) |
| Media | Vercel Blob |
| Email | Resend |
| MCP | `@payloadcms/plugin-mcp` (HTTP + JSON-RPC at `/api/mcp`) |
| Hosting | Vercel |

## Local development

```bash
bun install
cp .env.example .env
# Fill .env with a Neon dev-branch DATABASE_URI + generated PAYLOAD_SECRET
bun dev
# Admin UI: http://localhost:3000/admin
```

> **Windows + bun note:** if `bun install` fails on `unrs-resolver` postinstall (`Permission denied` / `EPERM`), retry with `bun install --ignore-scripts`. Transient file-lock race on Windows; the skipped script is a dev-time transitive dep (eslint module resolution) with no runtime impact.

## Using with MCP

Every enabled global and collection is exposed as an MCP tool at `/api/mcp` over HTTP (JSON-RPC). Authenticate with a per-user API key generated from the admin UI (Users → your user → API Keys).

**Claude Code:**

```bash
claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/api/mcp \
  --header "Authorization: Bearer <YOUR-MCP-KEY>"
```

**Cursor / VS Code / `mcp-remote`-compatible clients:**

```json
{
  "mcpServers": {
    "yesid-cms-prod": {
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

Two-repo split (per [`yesid.dev/docs/slices/slice-18/README.md`](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/README.md)):

- **[`yesid.dev`](https://github.com/mgkdante/yesid.dev)** — SvelteKit site (public showcase, open-source artifact).
- **`yesid.dev-cms`** (this repo) — Payload CMS admin + REST/GraphQL API + **MCP endpoint (`/api/mcp`)** + DB schema.

Both deploy independently to Vercel. CMS at `cms.yesid.dev`.

## Deploy

Auto-deploy on push to `main` via the linked Vercel project. Required env vars (all set via `vercel env add` or dashboard — see [`.env.example`](./.env.example) for the full list + descriptions):

- `DATABASE_URI` + `DATABASE_URL_UNPOOLED` (from Neon Vercel Marketplace integration)
- `PAYLOAD_SECRET` — 32+ char random (`openssl rand -base64 32`)
- `BLOB_READ_WRITE_TOKEN` — from Vercel Blob integration (plugin self-disables without)
- `RESEND_API_KEY` — from resend.com/api-keys
- `NEXT_PUBLIC_SERVER_URL` + `PAYLOAD_PUBLIC_SERVER_URL` = your prod URL

**First-deploy admin bootstrap** (one-time): set `PAYLOAD_ADMIN_EMAIL` + `PAYLOAD_ADMIN_PASSWORD` in env. On first cold start, the `onInit` hook provisions an admin with role `admin`. After first successful login, **rotate the password in the admin UI and delete both env vars from Vercel**. Hook is idempotent — subsequent cold starts with env vars absent (or admin already existing) are no-ops.

## Migrations

Schema changes are captured as Payload-generated migration files under `migrations/` and run at runtime via `prodMigrations` on Vercel cold start (no separate CI step needed).

```bash
# After editing collections / globals:
bunx payload migrate:create --name <description>

# Apply locally to your Neon dev branch:
bunx payload migrate

# Prod runs automatically on next Vercel cold start.
```

## Slice docs

Slice 18 specs, plans, logs, handoffs live in the [yesid.dev repo](https://github.com/mgkdante/yesid.dev) under `docs/slices/slice-18/`:

- [Slice 18 overview](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/README.md)
- [Slice 18a spec](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/slice-18a/spec.md) — infrastructure foundation (this slice)
- [Slice 18a plan](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/slice-18a/plan.md)

## License

MIT (consistent with [Payload's license](https://github.com/payloadcms/payload/blob/main/LICENSE)).
