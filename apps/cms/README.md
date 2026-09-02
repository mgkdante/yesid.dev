# yesid.dev CMS

Directus 12 is the editorial source for [yesid.dev](https://yesid.dev). This
package owns its schema, deterministic recovery inputs, build-time content
export, assets, and guarded operator tooling. The public site serves generated
SvelteKit content and does not read CMS data per request; Directus remains the
runtime origin for `/assets/*` media.

Production and development are separate Railway services at
`https://cms.yesid.dev` and `https://cms.dev.yesid.dev`. Each uses its own Neon
Postgres target and credentials. Cloudflare R2 is attached through Directus's
built-in `s3` storage driver.

## Architecture and ownership

| Path | Owner |
|---|---|
| [`Dockerfile`](Dockerfile) | Pinned `directus/directus:12.0.0` image, `directus-extension-sync@3.0.6`, and the local no-index extension |
| [`directus/`](directus/) | Reviewable directus-sync collections and schema snapshot |
| [`fixtures/`](fixtures/) | Validated bootstrap, recovery, asset, and content inputs; not a substitute for current live CMS state |
| [`scripts/lib/fetchers/`](scripts/lib/fetchers/) | Read-side adapters from Directus rows to product content interfaces |
| [`scripts/lib/emitters/`](scripts/lib/emitters/) | The single registry and formatter for generated content modules |
| [`scripts/`](scripts/) | Export, audit, seed, migration, reconciliation, and recovery entry points |
| [`tests/`](tests/) | Offline schema, fixture, boundary, and dry-run contracts |
| [`../web/src/lib/content/`](../web/src/lib/content/) | Generated modules consumed by SvelteKit; never edit them by hand |
| [`../../packages/shared/`](../../packages/shared/) | Shared content schemas and the asset-registry interface |

The package is scripts-only. Directus itself runs from the container image;
`package.json` provides the tooling used around that image.

## Clean-clone setup

Use Bun 1.3.11 and Node 22 or newer. From the repository root:

```bash
bun install --frozen-lockfile
bun run setup:hooks
bun run --cwd apps/cms test
bun run ci:content
```

The default web development command uses the committed content modules and
does not need CMS credentials:

```bash
bun run dev
```

To run Directus locally, create the ignored environment file from the public
schema, supply a dedicated local or development database and the required
values, then build the repository image:

```bash
cp apps/cms/.env.example apps/cms/.env
docker build -t yesid-cms-local apps/cms
docker run --rm -p 8055:8055 --env-file apps/cms/.env yesid-cms-local
```

Open `http://localhost:8055`. Never point a casual local container at the
production database. Environment variable names and target rules live in
[`apps/cms/.env.example`](.env.example); resolved values belong only in ignored
local files or their deployment target.

## Content delivery

Content moves through one interface:

```text
Directus -> export-fallbacks.ts -> 22 typed modules + hash manifest -> SvelteKit build
```

[`scripts/lib/emitters/configs.ts`](scripts/lib/emitters/configs.ts) owns the
exact 22-module registry. A complete fetch must satisfy the whole registry
before any module is emitted. The exporter writes the modules and
`apps/web/src/lib/content/generated.manifest.json` together. The manifest
records SHA-256 hashes and whether the source was `live` or `cache`.

Trusted Vercel Production and the `develop` preview use live-or-fail export
when `EXPORT_FALLBACKS_LIVE=1` is correctly scoped. Other previews skip CMS
access. Local builds may use the last cache or leave the committed modules
unchanged, with a visible warning. `bun run ci:content` rejects hash drift,
unregistered generated files, missing modules, and a committed cache-sourced
manifest.

To perform an authorized live export from a configured `apps/cms/.env`:

```bash
bun run --env-file=.env --cwd apps/cms export:fallbacks
bun run ci:content
```

Edit content in the development CMS, regenerate, review the generated diff,
and then promote through the repository. Do not edit the generated TypeScript
modules directly.

### Rebuild state is runtime state

The repository declares `Vercel revalidate on publish` and `Force Rebuild
(this environment)` as active. That declaration is desired configuration, not
proof of live behavior: the latest authenticated operator read found both
named live flows inactive. Saving CMS content is therefore not evidence that a
rebuild ran, and manual Flow execution must not be assumed to work.

Until a fresh authenticated read proves the live rows active, verify content
delivery with an actual target build and deployed-content receipt. Keep flow
audit and repair work in the guarded workflow; do not activate or edit live
flows as part of ordinary content authoring.

## Locale contract

The public locale interface is exactly `en`, `fr`, and `es`.
`packages/shared/src/types/content.ts` and
`packages/shared/src/schemas/shared.ts` own the type and validation seam.
English is required in every localized value. French and Spanish are optional
at the field shape so missing content falls back directly to English, while
the web publication layer currently exposes all three locale routes. Support
for a locale is not proof that every field has a translation; content
integrity tests own that coverage evidence.

Locale-aware seeders and fetchers must preserve the same three-code interface.

## Schema workflow

`directus/` is schema and configuration. Editorial rows live in Directus;
fixtures are explicit seed or recovery inputs. Keep those responsibilities
separate.

From the repository root with a configured ignored `apps/cms/.env`:

```bash
bun run --env-file=.env --cwd apps/cms sync:diff
bun run --env-file=.env --cwd apps/cms sync:pull
```

`sync:diff` is the read-only preview. `sync:pull` replaces the local
`apps/cms/directus/` dump with remote state, so review its complete diff and
stage only that directory. Production apply belongs to the environment-gated
`push` job in [`.github/workflows/cms.yml`](../../.github/workflows/cms.yml).
The package command below exists for an explicitly authorized apply and always
runs through the repository guard wrapper:

```bash
bun run --env-file=.env --cwd apps/cms sync:push
```

Never invoke the underlying directus-sync push directly. The wrapper refuses
production without the acknowledgements documented in `.env.example`, keeps
permissions out by default, and preserves environment-specific settings file
references. A committed dump, successful diff, or green test does not prove
the live environment matches it; keep the post-apply readback.

Permission control follows the same rule. The read-only audit and candidate
diagnostic own discovery. Targeted reconcilers and the guarded CMS workflow own
repairs. Do not replace them with ad-hoc Data Studio or REST mutations.

## Content, seed, and recovery tools

- Data Studio owns routine editorial changes.
- `fixtures/content/`, `fixtures/collections/`, and `fixtures/singletons/` are
  validated bootstrap and disaster-recovery inputs.
- `seed-*` scripts own one content domain each. Some replace domain rows, so
  read the script contract, run its offline tests or dry-run, and confirm the
  target before any apply.
- On an existing environment, capture `site_meta.default_og_image` and every
  `icons.svg_override` before `seed-site-meta.ts` or `seed-icons.ts --reset`,
  then reapply them afterward. Their fixtures may contain `null`;
  `sync-push.ts` protects only `project_logo`, `public_foreground`, and
  `public_favicon`, not these environment-specific references.
- `migrate-assets.ts` and `setup-*` scripts own bounded migrations. They are
  not clean-clone setup steps and should not be replayed because a script is
  present.
- `refresh-fixtures.ts` owns reconstruction of committed recovery fixtures
  from an authenticated source; its output requires review before commit.
- `refresh-dev-from-prod.sh` owns the coordinated development recovery path:
  database refresh, development token rebind, R2 sync, and protected branch
  promotion. Use its preflight and tests rather than reproducing those steps
  manually.

## Asset and preset ownership

`packages/shared/src/asset-registry.ts` owns semantic keys, release entries,
usage declarations, kinds, roles, and delivery modes. The Directus snapshot
owns `asset_records`, `asset_versions`, and `asset_usages`. The corresponding
setup and sync scripts are guarded migration tools, not alternate schema
authorities.

`fixtures/assets-manifest.json` owns the repository-to-CMS migration inventory.
`fixtures/assets-id-map.json` is the committed mapping consumed by export and
tests; file UUIDs are environment-specific and must not be copied into another
environment as configuration. `fixtures/brand/presets.json` owns the four
named transform declarations, and `seed-presets.ts` validates and applies them
to `directus_settings.storage_asset_presets`.

The current OpenWeather setup uses one existing key, independently scoped to `develop`
and Production; this is target scoping, not a claim that a second credential exists.

### Asset audit ownership boundary

The asset audit is a read-only evidence pipeline with one owner per stage:

- `scripts/lib/assets/repository-scan.ts` inventories repository assets and
  references without CMS access.
- `scripts/lib/assets/directus-scan.ts` performs bounded, GET-only reads from
  the fixed development and production CMS targets.
- `scripts/lib/assets/audit.ts` reconciles repository, registry, file, content,
  generated-output, OG, and SVG evidence.
- `scripts/lib/assets/report.ts` owns deterministic public serialization and
  hashing.
- `scripts/audit-assets.ts` owns CLI options, credentials, target selection,
  gates, output paths, and baseline publication.

`bun run verify:assets-audit` is the credential-free CI gate. It reads
`fixtures/assets/audit-baseline.json` and writes the ignored
`.asset-audit/report.json`; an offline report does not prove live CMS state.
Replacing the accepted baseline is a separate publication action requiring a
complete live run with `--update-baseline` and
`--confirm=UPDATE_ASSET_AUDIT_BASELINE`, followed by review of both diffs.

## Environment contract

| Target | CMS origin | Build credential | Export rule |
|---|---|---|---|
| Vercel Production | `https://cms.yesid.dev` | `DIRECTUS_BUILD_TOKEN` | `EXPORT_FALLBACKS_LIVE=1`; live or fail |
| `develop` preview | `https://cms.dev.yesid.dev` | `DIRECTUS_DEV_BUILD_TOKEN` | `EXPORT_FALLBACKS_LIVE=1`; live or fail |
| Generic preview | none required | none | Skip CMS export and use committed modules |
| Local | development origin when configured | local operator credential | Soft fallback with an explicit warning |

Production and development credentials must be distinct and bound only to
their matching target. Generic previews receive neither build credential nor
the live-export flag. Verify target metadata without printing values after any
credential change.

## Public contracts

- [Repository architecture](../../README.md)
- [CMS environment schema](.env.example)
- [CMS CI and guarded operations](../../.github/workflows/cms.yml)
- [Shared content interfaces](../../packages/shared/src/types/content.ts)
- [Asset-registry interface](../../packages/shared/src/asset-registry.ts)
- [Outcome-first positioning source](fixtures/content/outcome-first-positioning.ts)
- [Generated-content manifest](../web/src/lib/content/generated.manifest.json)
- [Security reporting](../../SECURITY.md)
