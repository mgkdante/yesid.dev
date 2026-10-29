# yesid.dev

Source for [yesid.dev](https://yesid.dev), the portfolio and information site
of Yesid Fernando Otalora, a freelance digital-infrastructure consultant in
Quebec, Canada. It presents work in database engineering and SQL, data
pipelines and automation, analytics and reporting, and web development.

## Product

The site is a multilingual SvelteKit application with:

- service, project, and technology case-study content;
- an editorial blog in English, French, and Spanish;
- accessible contact, legal and privacy flows;
- structured metadata, sitemaps, share cards, and machine-readable content;
- a Directus-backed publishing pipeline with build-time delivery.

## Architecture

Each domain has one owner:

| Path | Responsibility | Owner guide |
|---|---|---|
| `apps/web` | SvelteKit application, routes, product components, generated content adapters, and deployment | [`apps/web/README.md`](apps/web/README.md) |
| `apps/cms` | Directus schema, deterministic fixtures, content export, and operational tooling | [`apps/cms/README.md`](apps/cms/README.md) |
| `packages/shared` | Product-owned schemas, types, asset contracts, and runtime constants shared by the web and CMS domains | [`packages/shared/README.md`](packages/shared/README.md) |
| `@yesid/*` | yesid.dev-design v0.28.0 release tarballs, pinned by URL in `apps/web/package.json` and by integrity in `bun.lock` | [design repo](https://github.com/mgkdante/yesid.dev-design) |

Content moves in one direction:

```text
Directus
   │ publish
   ▼
typed build-time export ──► SvelteKit build ──► Vercel
       │
       └── shared fixture for deterministic local and CI generation
```

The public application does not query Directus for page data at request time.
Directus remains the editorial source; the deployed build owns delivery.

## Design-system customer boundary

`yesid.dev-design` is released independently. This repository installs one exact release's package tarballs by URL and owns only its product code. A bump changes the tag in every `@yesid` URL, runs `bun install`, and lands in its own pull request.

Design tokens: [upstream DESIGN.md](https://github.com/mgkdante/yesid.dev-design/blob/main/DESIGN.md).

Never patch the packages.

## Local development

Prerequisites: Bun 1.4.4 and an updated Node.js LTS runtime (22.23.4+ or 24.22.1+).

```bash
bun install --frozen-lockfile
bun run dev
```

Web dev, test, check and build generate ignored content modules from the shared
fixture by default, without credentials or network. Trusted Vercel targets use
live content; local operators select it with `EXPORT_FALLBACKS_SOURCE=live`.
Refresh the fixture from a live cache with
`bun apps/cms/scripts/trim-export-fixture.ts`; commit the fixture, not generated modules.

Run the repository gates:

```bash
bun run test
bun run check
bun run build
```

## Repository status

This is a public source repository for portfolio inspection, not an open-source
project. Original yesid.dev material is all rights reserved. See
[LICENSE](LICENSE).

- Security reports: [SECURITY.md](SECURITY.md)
- Support and service inquiries: [SUPPORT.md](SUPPORT.md)
- Contribution policy: [CONTRIBUTING.md](CONTRIBUTING.md)
- Third-party material: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
