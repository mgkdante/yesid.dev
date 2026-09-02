# Shared product contracts

`@repo/shared` owns the product-domain interfaces that both the SvelteKit app
and Directus tooling must agree on. It contains types, Zod schemas, asset
contracts, small domain utilities, and dependency-free runtime constants. It
does not own editorial data, generated content modules, UI behavior, or CMS
operations.

## Public interfaces

| Import | Use |
|---|---|
| `@repo/shared` | Compatibility aggregate for existing consumers, including content and asset contracts. Prefer a narrower subpath in new code. |
| `@repo/shared/types` | Type-only product content interfaces. |
| `@repo/shared/schemas` | Zod validation schemas for CMS inputs and generated content. This interface carries a runtime Zod dependency. |
| `@repo/shared/stack-layers` | Canonical stack-layer tuple and derived type without the schema barrel's runtime dependency. |

The dependency direction is always applications to shared contracts:

```text
apps/cms  ─┐
           ├─> @repo/shared
apps/web  ─┘
```

This package must not import either application. App-specific composition stays
with its app, and cross-app behavior belongs here only when both consumers need
one product-owned contract.

## Content and locale contracts

Directus remains the editorial source. The CMS emitter registry validates and
writes the 22 generated modules consumed by `apps/web`; this package defines
their shapes but neither reads Directus nor emits runtime content. Generated
modules and their manifest must never be edited by hand.

The locale union is exactly `en`, `fr`, and `es`. English is required in shared
localized values; French and Spanish may fall back to English at the field
shape. That schema rule is distinct from public route publication and from the
content-coverage tests that prove which translations exist.

## Failure behavior

- Schemas reject malformed CMS and generated-content shapes at the validation
  boundary.
- Asset contracts reject unknown semantic identities instead of silently
  inventing paths.
- Runtime-only constants must remain importable without pulling the schema
  barrel into a client bundle.

Run the package suite from the repository root:

```bash
bun run --cwd packages/shared test
```

Content export, recovery, and environment rules belong to the
[CMS owner guide](../../apps/cms/README.md). Web rendering, media fallback,
privacy, and vendor-receipt rules belong to the
[web owner guide](../../apps/web/README.md).
