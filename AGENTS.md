# yesid.dev contributor guide

This repository contains the source for [yesid.dev](https://yesid.dev): a
multilingual portfolio and information site backed by a build-time content
pipeline. It is public for inspection but remains proprietary; read
`CONTRIBUTING.md`, `LICENSE`, and `SECURITY.md` before proposing work.

## Project context (Notion)
Profile: https://app.notion.com/p/4033e8630690813cba9afa4949d1c849
Start page: https://app.notion.com/p/4083e863069080df9e63d165128a1522
This project's guide: https://app.notion.com/p/3f33e86306908116baf8c70ce55b9069
Shared formats (roadmap, slice, spec, handoff, session): https://app.notion.com/p/4003e8630690809b8045d8ad3a439995

- You MUST start every session by fetching my enabled Notion Skills via `notion-get-enabled-skills`.
- When Notion is connected, read the project guide before planning; re-read live records before relying on any status.
- Save durable facts about me as Notion Memories (parent "memory"), not in this file.
- Repository instructions own local commands and constraints; Notion owns plans, decisions and handoffs.
- Without Notion access, say what you couldn't read and propose the Notion update instead of claiming it.
- Never use em dashes in anything written for Yesito.

## Stack and repository layout

- Bun 1.4.4+ and an updated Node.js LTS runtime (22.23.4+ or 24.22.1+)
- SvelteKit, Svelte 5, TypeScript, Tailwind CSS, and Vite in `apps/web`
- Directus 12 content schema, fixtures, exporters, and operations in `apps/cms`
- Shared product schemas and utilities in `packages/shared`
- The `@yesid/*` design-system packages, installed from one exact yesid.dev-design release

The browser and request-time application do not query Directus for page
content. Directus is the editorial source, and the CMS exporter writes typed,
ignored modules under `apps/web/src/lib/content` for the SvelteKit build.

## Local setup

```bash
bun install --frozen-lockfile
bun run dev
```

Use `.env.example` and `apps/cms/.env.example` as variable schemas. Keep
resolved credentials in ignored local environment files or inject them through
1Password; never commit tokens, passwords, service-account material, or filled
dotenv files.

## Repository gates

Run the checks that match the files you changed, then the full local gates:

```bash
bun run check
bun run test
bun run build
```

Web dev, test, check and build generate ignored content modules from the shared
fixture by default, without credentials or network. Trusted Vercel targets use
live content; local operators select it with `EXPORT_FALLBACKS_SOURCE=live`.
Refresh the fixture from a live cache with
`bun apps/cms/scripts/trim-export-fixture.ts`; commit the fixture, not generated modules.

## Design system

`@yesid/*` come from one exact yesid.dev-design release, installed by URL (`apps/web/package.json`, root `package.json` for `@yesid/config`) and pinned by integrity in `bun.lock`. Never patch them under `node_modules`; change them upstream and bump.

Keep changes small, preserve public behavior unless the task explicitly says
otherwise, and add tests around observable behavior rather than source text or
implementation taste.
