# yesid.dev web application

This package owns the public SvelteKit application: routes, product components,
prerendering, SEO, consented analytics, contact delivery, and the Vercel build.
It consumes editorial content and shared contracts; it does not own Directus
schema, editorial rows, or the vendored design-system source.

## Runtime boundaries

| Interface | Contract |
|---|---|
| [`src/lib/adapters/`](src/lib/adapters/) | Route-facing content interface. `adapter` is the stable entry point and `staticAdapter` reads generated modules. |
| [`src/lib/content/`](src/lib/content/) | Build-time runtime content. The CMS emitter registry produces 20 ignored modules; never edit those outputs by hand. |
| [`src/lib/directus/assets.ts`](src/lib/directus/assets.ts) | The sanctioned media seam. Known file identities resolve to committed mirrors; unknown media may use Directus only in development and fails loudly in production. |
| [`../../packages/shared/`](../../packages/shared/) | Product types, validation schemas, asset contracts, and dependency-free stack-layer constants. |
| [`vendor/design/manifest.json`](vendor/design/manifest.json) | Immutable design Release receipt. Product code may adapt the released packages but must not patch the vendored tree or receipt. |

Page content moves in one direction:

```text
Directus -> CMS exporter -> generated modules -> staticAdapter -> routes/components
```

The public application never queries Directus for page content at request time.
The media helper is intentionally separate: committed mirrors are the production
path, while a Directus `/assets/*` URL supports newly uploaded media during local
editing. See the [CMS owner guide](../cms/README.md) for the export, schema and recovery
contracts, and the [asset serving map](#asset-serving-map) for the serving model
of each image and SVG family.

## Dependency direction

- Routes and product components depend on the adapter, app utilities, shared
  contracts, and released `@yesid/*` packages.
- `apps/web` and `apps/cms` may depend on `@repo/shared`; the shared package must
  not import either application.
- Generated modules conform to shared contracts but remain owned by the CMS
  emitter registry. App code must not become a second generator.
  Zod schema barrel when they only need the canonical layer tuple and type.

## Locale and privacy policy

The public locale interface is exactly `en`, `fr`, and `es`. Route publication,
schema allowance, per-field English fallback, and translation-coverage gates are
separate controls. Do not infer one from another or add a locale in only one
layer.

Contact delivery and analytics are separate privacy domains. The contact form
sends its fields to Web3Forms. Plausible loads only after consent and receives
only the app's allowlisted analytics events, never contact-form fields. Preserve
that separation when adding tracking or changing form behavior.

## Failure behavior

- A trusted live content export must complete the whole 20-module registry
  and pass legal-truth and SEO validators before emission.
- Production rendering fails for an unmirrored media identity; development may
  use the explicit Directus fallback to preview new editorial media.
- The sitemap, client-payload, token, vendor, locale, and browser gates are
  release contracts, not optional reports.

## Asset serving map

The split is by SERVING MODEL, which the platform imposes:
Vite-bundled art must live under `src/`, statically-served files under `static/`,
CMS sources under `apps/cms/`. Anything CMS-served goes through the CMS asset
pipeline ([Asset and preset ownership](../cms/README.md#asset-and-preset-ownership)).

### Brand (canonical sources)

| Path | What | Served |
| --- | --- | --- |
| `apps/cms/brand/yesid-wordmark.svg` | Canonical outlined wordmark: "yesid" + orange period as paths (no font dependency). Regenerate via a fresh Inter shaping pass if the brand ever changes; the site header/footer render the wordmark as HTML text, this file is the asset-of-record. | Directus admin chrome |
| `apps/cms/brand/yesid-icon.svg` | Orange dot icon | Directus admin chrome (`project_logo`) |
| `apps/web/static/favicon.svg` | Primary favicon (initial paint; `theme.svelte.js` repaints it as a data-URI per theme) | Static `/favicon.svg` via `app.html` |
| `apps/web/static/favicon.ico` | 16/32/48 px ICO generated from `favicon.svg`, for clients that request `/favicon.ico` by convention | Static `/favicon.ico` |
| `apps/web/static/apple-touch-icon.png` | 180×180 opaque touch icon generated from `favicon.svg` on `#141414` | Static `/apple-touch-icon.png` via `app.html` |

Regenerate both binary icons from `favicon.svg` if the mark changes.

### Site art

| Location | What | Serving model |
| --- | --- | --- |
| `src/lib/assets/blog-fallbacks/*.svg` | 8 blog no-image icons (pro-* / personal-*), slug-hash selected | Vite `?raw` glob (`src/lib/blog/static-helpers.ts`); registered in CMS `illustrations` |
| `src/lib/assets/project-fallbacks/*.svg` | Digital-infrastructure blueprints: `digital-mobile` below md, `digital-desktop` at md+ | Vite `?raw` imports in `ProjectCard.svelte`; registered in CMS `illustrations` |
| `src/lib/components/svg/{azur,detail,transit,tunneling}/*.svelte` | Live blueprint drawings as inline components (`currentColor` for theming) | Svelte components (ServicesBlueprint / BlogBlueprint / ProjectsBlueprint) |
| `src/lib/components/svg/cta/*.svelte` | Code-owned CTA sheets for a transit route/stops, interface suite, data pipeline, and code system. `CtaBlueprintBackground.svelte` combines them once each with the existing Azur side elevation, bridge, catenary, railway signal, station section, tunnel section, geology, TBM, and ventilation shaft. The responsive wall has 12 unique detail sheets; no blueprint component is repeated. | Inline Svelte components behind the one shared `CtaBand`; semantic catalog keys are `site.cta.blueprint-route`, `site.cta.blueprint-interface`, `site.cta.blueprint-pipeline`, and `site.cta.blueprint-code` |
| `static/svg/services/*.svg` | 6 service line icons; filenames are CMS data (`services.svg`) | Dual: `?raw` glob (`src/lib/utils/service-svg.ts`, SSR) + client fetch/img `/svg/services/...` |
| `static/svg/graffiti/*.svg` | Localized closer lettering: `the-end.{en,fr,es}.svg`, generated by `scripts/build-graffiti.mjs` from the pinned OFL Lacquer font, plus unchanged `prop-{sign,helmet,barricade,balise}.svg` | Runtime fetch: explicit locale URLs in `CloserGraffiti` and bounded prop URLs in `CloserProps` |
| `static/images/**` | Raster + CMS-mirrored assets (metro map, about art, work shots) | Static; CMS mirror via `media-assets.ts` (GENERATED) + `assets-id-map.json` |
| `static/og/**.png` | 30 committed OG share cards, 1200x630 <150KB, minted by `scripts/generate-og-cards.ts`: `default.{en,fr,es}` (home + locale fallback), localized `routes/{services,contact,about,projects}`, localized `services/<id>`, and `site.{en,fr,es}` (standalone share assets, unwired) | Static; blog/project Satori + resvg cards prerender at build into deployment-static `/og/{blog,project}/` files |

### Rules

- Dead art gets deleted, not parked: the pre-componentization `static/svg/blueprint/`
  exports and unused graffiti props get deleted. If a file has zero
  references, it goes.
- Template-string fetches (`/svg/graffiti/prop-${name}.svg`, `/svg/services/${service.svg}`)
  and `?raw` globs break silently on renames: unit tests stub `/svg/` fetches
  (`src/tests/setup.dom.ts`), so run the local e2e after moving anything here.
- GENERATED content modules (`src/lib/content/*.ts`) embed SVG filenames and asset
  UUIDs: edit Directus + regenerate, never the `.ts`.
- Behavioral blueprint compositions remain code-owned. Catalog the stable semantic
  selection key (`site.cta.blueprint-background`) and its four new drawing keys;
  do not copy component markup into Directus or replace the source SVGs with CMS
  files. The shared CTA composition has no runtime fetch and must stay decorative,
  `aria-hidden`, unfocusable, clipped by its band, and motion-safe.
- Until the code-component reconciliation policy lands, this map is the selectable
  catalog for those keys. Do not create partial Directus code-component records:
  partial linking changes live usage identities.
- Current checks verify manifest SHA-256 digests and UUID-map/manifest consistency.
  `assets.ts` rejects unknown UUIDs in production, and the web asset-boundary guard
  checks literal asset identities and raw HTML/SVG injection files.

## Commands

Run package checks from the repository root:

```bash
bun run --cwd apps/web test
bun run --cwd apps/web check
bun run --cwd apps/web build
bun run --cwd apps/web check:client-payload
```

Verify the immutable design receipt from this directory:

```bash
bun vendor/design/tools/adopt.ts --check --dest vendor/design
```

Web dev, test, check and build generate ignored content modules from the shared
fixture by default, without credentials or network. Trusted Vercel targets use
live content; local operators select it with `EXPORT_FALLBACKS_SOURCE=live`.
Refresh the fixture from a live cache with
`bun apps/cms/scripts/trim-export-fixture.ts`; commit the fixture, not generated modules.
