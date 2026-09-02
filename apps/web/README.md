# yesid.dev web application

This package owns the public SvelteKit application: routes, product components,
prerendering, SEO, consented analytics, contact delivery, and the Vercel build.
It consumes editorial content and shared contracts; it does not own Directus
schema, editorial rows, or the vendored design-system source.

## Runtime boundaries

| Interface | Contract |
|---|---|
| [`src/lib/adapters/`](src/lib/adapters/) | Route-facing content interface. `adapter` is the stable entry point and `staticAdapter` reads generated modules. |
| [`src/lib/content/`](src/lib/content/) | Build-time runtime content. The CMS emitter registry produces 22 modules and `generated.manifest.json`; never edit those outputs by hand. |
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
editing. See the [CMS owner guide](../cms/README.md) for export, recovery, and
authenticated operational procedures, and [ASSETS.md](ASSETS.md) for the serving
model of each image and SVG family.

## Dependency direction

- Routes and product components depend on the adapter, app utilities, shared
  contracts, and released `@yesid/*` packages.
- `apps/web` and `apps/cms` may depend on `@repo/shared`; the shared package must
  not import either application.
- Generated modules conform to shared contracts but remain owned by the CMS
  emitter registry. App code must not become a second generator.
- Runtime-only consumers should use `@repo/shared/stack-layers` instead of the
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

- A trusted live content export must complete the whole 22-module registry
  before emission. The content gate rejects missing, unregistered, or hash-drifted
  generated output.
- Production rendering fails for an unmirrored media identity; development may
  use the explicit Directus fallback to preview new editorial media.
- The sitemap, client-payload, token, vendor, locale, and browser gates are
  release contracts, not optional reports.

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

The build invokes the CMS exporter before Vite. Credential-free local and CI
builds use the committed generated modules according to the exporter contract;
see the CMS guide before attempting a connected export.
