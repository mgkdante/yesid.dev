# yesid.dev

Source for [yesid.dev](https://yesid.dev), the portfolio and information site
of Yesid Fernando Otalora, a freelance digital-infrastructure consultant in
Quebec, Canada. It presents work in database engineering and SQL, data
pipelines and automation, analytics and reporting, and web development.

## Product

The site is a multilingual SvelteKit application with:

- service, project, and technology case-study content;
- an editorial blog in English, French, and Spanish;
- accessible contact, legal, privacy, and consent flows;
- structured metadata, sitemaps, share cards, and machine-readable content;
- a Directus-backed publishing pipeline with build-time delivery.

## Architecture

Each domain has one owner:

| Path | Responsibility |
|---|---|
| `apps/web` | SvelteKit application, routes, product components, generated content adapters, and deployment |
| `apps/cms` | Directus schema, deterministic fixtures, content export, and operational tooling |
| `packages/shared` | Product-owned schemas and utilities shared by the web and CMS domains |
| `apps/web/vendor/design` | Immutable `yesid.dev-design` Release; never edited by the consumer |

Content moves in one direction:

```text
Directus
   │ publish
   ▼
typed build-time export ──► SvelteKit build ──► Vercel
       │
       └── committed fallback snapshot for deterministic local and CI builds
```

The public application does not query Directus for page data at request time.
Directus remains the editorial source; the deployed build owns delivery.

## Design-system customer boundary

`yesid.dev-design` is released independently. This repository vendors one
exact schema-2 Release under `apps/web/vendor/design` and owns only its product
adapters, product policy, composed components, generated outputs, and product
tests.

From `apps/web`, verify the customer payload:

```bash
bun vendor/design/tools/adopt.ts --check --dest vendor/design
```

Future upgrades use a reviewed exact-tag adoption. Never patch the vendored
snapshot.

## Local development

Prerequisites: Bun 1.3+ and Node 22+.

```bash
bun install --frozen-lockfile
bun run dev
```

The default local site uses committed content fallbacks. Connected CMS
operations require the environment references documented in `.env.example`;
never commit resolved credentials.

Run the repository gates:

```bash
bun run test
bun run check
bun run ci:tokens
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

<!-- ST6 CMS reporter probe setup. This branch is intentionally never merged. -->
