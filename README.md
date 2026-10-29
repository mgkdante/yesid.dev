# yesid.dev

[![cms](https://github.com/mgkdante/yesid.dev/actions/workflows/cms.yml/badge.svg?branch=main)](https://github.com/mgkdante/yesid.dev/actions/workflows/cms.yml)
[![secret-scan](https://github.com/mgkdante/yesid.dev/actions/workflows/secret-scan.yml/badge.svg?branch=main)](https://github.com/mgkdante/yesid.dev/actions/workflows/secret-scan.yml)

Source for [yesid.dev](https://yesid.dev), the portfolio and information site of
Yesid Fernando Otalora, a freelance digital-infrastructure consultant in Quebec,
Canada. It covers database engineering and SQL, data pipelines and automation,
analytics and reporting, and web development, in English, French and Spanish.

## Stack

- [SvelteKit](https://svelte.dev) with Svelte 5 and TypeScript, Tailwind CSS 4 and GSAP
- [Directus 12](https://directus.io) as the editorial CMS, on Railway with Neon Postgres and Cloudflare R2
- Vercel for the site, Bun workspaces and Turborepo for the monorepo
- The `@yesid/*` design-system packages from [yesid.dev-design](https://github.com/mgkdante/yesid.dev-design)

## Quickstart

You need Bun 1.4.4 and Node.js 22.23.4+ or 24.22.1+.

```bash
git clone https://github.com/mgkdante/yesid.dev.git
cd yesid.dev
bun install --frozen-lockfile
bun run dev
```

The site runs at http://localhost:5173. Local builds read content from a
committed fixture, so you need no credentials and no CMS access. Vercel
production builds and `develop` previews export live content from Directus;
other previews use the fixture.

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

The `@yesid/*` packages come from one exact yesid.dev-design release, installed
by URL and pinned by integrity in `bun.lock`. A version bump gets its own pull
request, and the packages are never patched here.

## Links

- Live site: [yesid.dev](https://yesid.dev)
- Design system: [mgkdante/yesid.dev-design](https://github.com/mgkdante/yesid.dev-design)
- Contributor guide: [AGENTS.md](AGENTS.md)
- Security reports: [SECURITY.md](SECURITY.md)
- Support: [SUPPORT.md](SUPPORT.md)

## License

This repository is public for inspection, not open source. Original yesid.dev
material is all rights reserved. See [LICENSE](LICENSE),
[CONTRIBUTING.md](CONTRIBUTING.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
