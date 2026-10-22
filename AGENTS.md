# yesid.dev contributor guide

This repository contains the source for [yesid.dev](https://yesid.dev): a
multilingual portfolio and information site backed by a build-time content
pipeline. It is public for inspection but remains proprietary; read
`CONTRIBUTING.md`, `LICENSE`, and `SECURITY.md` before proposing work.

## Stack and repository layout

- Bun 1.3.x and Node 22+
- SvelteKit, Svelte 5, TypeScript, Tailwind CSS, and Vite in `apps/web`
- Directus 12 content schema, fixtures, exporters, and operations in `apps/cms`
- Shared product schemas and utilities in `packages/shared`
- An immutable design-system release in `apps/web/vendor/design`

The browser and request-time application do not query Directus for page
content. Directus is the editorial source, and the CMS exporter writes typed,
committed modules under `apps/web/src/lib/content` for the SvelteKit build.

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
bun run ci:content
EXPORT_FALLBACKS_SKIP=1 bun run build
```

`EXPORT_FALLBACKS_SKIP=1` makes the build use the committed content modules
without contacting a CMS. Run a live export only with an explicitly configured,
authenticated environment:

```bash
bun run --env-file=.env --cwd apps/cms export:fallbacks
```

Generated content modules are not hand-edited. A valid export updates the
modules and `apps/web/src/lib/content/generated.manifest.json` together.
`bun run ci:content` verifies their hashes.

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

Do not hand-edit `DESIGN.md` or the generated token region in
`apps/web/src/app.css`.

## Pre-commit integrity

`.githooks/pre-commit` protects three repository boundaries:

1. vendored design payload changes require their release manifest;
2. generated token outputs require their source or adapter;
3. CMS-generated content modules must match their recorded hashes.

Install the hook with `bun run setup:hooks`. CI repeats the generated-content,
vendor, and token checks so a clean clone does not rely on local hook setup.

Keep changes small, preserve public behavior unless the task explicitly says
otherwise, and add tests around observable behavior rather than source text or
implementation taste.
