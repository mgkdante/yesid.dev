# yesid.dev

[![cms](https://github.com/yesid-dev/yesid.dev/actions/workflows/cms.yml/badge.svg?branch=main)](https://github.com/yesid-dev/yesid.dev/actions/workflows/cms.yml)
[![secret-scan](https://github.com/yesid-dev/yesid.dev/actions/workflows/secret-scan.yml/badge.svg?branch=main)](https://github.com/yesid-dev/yesid.dev/actions/workflows/secret-scan.yml)

Source for [yesid.dev](https://yesid.dev), the portfolio and information site of
Yesid Fernando Otalora, a freelance digital-infrastructure consultant in Quebec,
Canada. It covers database engineering and SQL, data pipelines and automation,
analytics and reporting, and web development, in English, French and Spanish.

## Stack

- [SvelteKit](https://svelte.dev) with Svelte 5 and TypeScript, Tailwind CSS 4 and GSAP
- [Directus 12](https://directus.io) as the editorial CMS, on Railway with Neon Postgres and Cloudflare R2
- Vercel for the site, Bun workspaces and Turborepo for the monorepo
- The `@yesid/*` design-system packages from [yesid.design](https://github.com/yesid-dev/yesid.design)

## Quickstart

You need Bun 1.4.4 and Node.js 22.23.4+ or 24.22.1+.

```bash
git clone https://github.com/yesid-dev/yesid.dev.git
cd yesid.dev
bun install --frozen-lockfile
bun run dev
```

The site runs at http://localhost:5173. Local builds read content from a
committed fixture, so you need no credentials and no CMS access. Only Vercel
production builds export live content from Directus. Pull requests target
`main`, and their Vercel preview deployments build from the fixture; that
preview is the staging environment. Merges go through the `main` merge queue:
enqueue a green pull request with `gh pr merge --auto --squash`, and the queue
reruns the required checks on the combined change before squash-merging it.

Check, test and build:

```bash
bun run check
bun run test
bun run build
```

End-to-end tests build and preview the site, then run Playwright against it:

```bash
cd apps/web
bunx playwright install chromium
bun run test:e2e
```

## Admin deploy now

`deploy-now.yml` builds and deploys an explicit ref, without tests or check gates.
Set Actions secret `VERCEL_TOKEN`, variables `VERCEL_ORG_ID` and
`VERCEL_PROJECT_ID` for web; set secret `RAILWAY_TOKEN` for CMS.
Choose `web` (default), `cms`, or `both`; each target queues independently.
The run summary records the checked-out SHA and deployment receipt.
All four are set. Without one of them, dispatch fails early.

```bash
gh workflow run deploy-now.yml -R yesid-dev/yesid.dev --ref main -f ref=<sha> -f target=web
```

Token-free admin fallback: from an authenticated local Vercel CLI session,
promote an existing deployment built for the **Production environment**, after
verifying its project and intended commit. This ships that Production build
without rebuilding it. Promoting a Preview deployment rebuilds for Production
and cannot provide this no-rebuild fallback:

```bash
vercel promote <deployment-url> --scope mgkdantes-projects
```

## Architecture

| Path | Owns |
|---|---|
| [`apps/web`](apps/web/README.md) | The SvelteKit site: routes, components, SEO and the Vercel build |
| [`apps/cms`](apps/cms/README.md) | Directus schema, the content exporter, fixtures and operator tooling |
| [`packages/shared`](packages/shared/README.md) | Types, Zod schemas and asset contracts used by both apps |

Content moves one way. Editors publish in Directus. At build time an exporter
writes typed modules that the SvelteKit build reads, and Vercel serves the
result. The site never queries Directus for page content at request time.

```text
Directus ──► exporter ──► typed modules ──► SvelteKit build ──► Vercel
                ▲
                └── shared fixture (local and CI builds)
```

The `@yesid/*` packages come from one exact yesid.design release, installed
by URL and pinned by integrity in `bun.lock`. A version bump gets its own pull
request, and the packages are never patched here.

## Documentation

Longer documentation lives in Notion. This README and the per-workspace
READMEs stay the source for local commands.

| Document | Covers | Access |
|---|---|---|
| [Architecture wiki](https://yesid-dev.notion.site/3603e8630690813bbe4ac7adac7d1bd7?v=4093e86306908049b5ee000c3e271459) | As-built system: setup, content model, pipeline, web app, CMS, deployment, security, testing, operations and known limits | Public |

Each page is written against a pinned commit of this repository and names it.

## Links

- Live site: [yesid.dev](https://yesid.dev)
- Design system: [yesid-dev/yesid.design](https://github.com/yesid-dev/yesid.design)
- Contributor guide: [AGENTS.md](AGENTS.md)
- Security reports: [SECURITY.md](SECURITY.md)
- Support: [SUPPORT.md](SUPPORT.md)

## License

This repository is public for inspection, not open source. Original yesid.dev
material is all rights reserved. See [LICENSE](LICENSE),
[CONTRIBUTING.md](CONTRIBUTING.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
