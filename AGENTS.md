# yesid.dev contributor guide

This repository contains the source for [yesid.dev](https://yesid.dev): a
multilingual portfolio and information site backed by a build-time content
pipeline. It is public for inspection but remains proprietary; read
`CONTRIBUTING.md`, `LICENSE`, and `SECURITY.md` before proposing work.

## Stack and repository layout

- Bun 1.4.4+ and an updated Node.js LTS runtime (22.23.4+ or 24.22.1+)
- SvelteKit, Svelte 5, TypeScript, Tailwind CSS, and Vite in `apps/web`
- Directus 12 content schema, fixtures, exporters, and operations in `apps/cms`
- Shared product schemas and utilities in `packages/shared`
- An immutable design-system release in `apps/web/vendor/design`

The browser and request-time application do not query Directus for page
content. Directus is the editorial source, and the CMS exporter writes typed,
ignored modules under `apps/web/src/lib/content` for the SvelteKit build.

## Local setup

```bash
bun install --frozen-lockfile
bun run setup:hooks
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
bun run ci:tokens
bun run build
```

Web dev, test, check and build generate ignored content modules from the shared
fixture by default, without credentials or network. Trusted Vercel targets use
live content; local operators select it with `EXPORT_FALLBACKS_SOURCE=live`.
Refresh the fixture from a live cache with
`bun apps/cms/scripts/trim-export-fixture.ts`; commit the fixture, not generated modules.

## Vendored design and tokens

`apps/web/vendor/design` is one complete, immutable schema-2 release from
`yesid.dev-design`. Do not patch files inside that directory. From
`apps/web`, verify the adopted release with:

```bash
bun vendor/design/tools/adopt.ts --check --dest vendor/design
```

The vendored token sources feed the product-owned adapter at
`apps/web/tools/build-tokens.ts`. After an authorized token-source or adapter
change, regenerate and verify outputs from the repository root:

```bash
bun run tokens:build
bun run ci:tokens
```

Do not hand-edit `DESIGN.md`.

## Pre-commit integrity

`.githooks/pre-commit` protects two repository boundaries:

1. vendored design payload changes require their release manifest;
2. generated token outputs require their source or adapter.

Install the hook with `bun run setup:hooks`. CI repeats the vendor
and token checks so a clean clone does not rely on local hook setup.

Keep changes small, preserve public behavior unless the task explicitly says
otherwise, and add tests around observable behavior rather than source text or
implementation taste.
