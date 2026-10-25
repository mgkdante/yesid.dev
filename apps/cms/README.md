# yesid.dev CMS

Directus 12 is the editorial source for [yesid.dev](https://yesid.dev). This
package owns its schema, build-time content export, assets, and guarded
operator tooling. The public site serves generated
SvelteKit content and mirrored static media without per-request CMS reads.
Directus serves editorial/source media; it is not the public site's media CDN.

Production and development are separate Railway services at
`https://cms.yesid.dev` and `https://cms.dev.yesid.dev`. Each uses its own Neon
Postgres target and credentials. Cloudflare R2 is attached through Directus's
built-in `s3` storage driver.

## Architecture and ownership

| Path | Owner |
|---|---|
| [`Dockerfile`](Dockerfile) | Digest-pinned `directus/directus:12.5.1` with Node 22.23.4; separately packaged `directus-extension-sync@3.0.6` and the local no-index extension |
| [`directus/`](directus/) | Reviewable directus-sync collections and schema snapshot |
| [`fixtures/`](fixtures/) | Retained asset inventories, preset declarations, site labels, and positioning inputs |
| [`scripts/lib/fetchers/`](scripts/lib/fetchers/) | Read-side adapters from Directus rows to product content interfaces |
| [`scripts/lib/emitters/`](scripts/lib/emitters/) | The single registry and formatter for generated content modules |
| [`scripts/`](scripts/) | Export, audit, migration, reconciliation, and recovery entry points |
| [`tests/`](tests/) | Offline schema, fixture, boundary, and dry-run contracts |
| [`../web/src/lib/content/`](../web/src/lib/content/) | Generated modules consumed by SvelteKit; never edit them by hand |
| [`../../packages/shared/`](../../packages/shared/) | Shared content schemas and the asset-registry interface |

The package is scripts-only. Directus itself runs from the container image;
`package.json` provides the tooling used around that image.

## Clean-clone setup

Use Bun 1.4.4 and an updated Node.js LTS runtime (22.23.4+ or 24.22.1+). From the repository root:

```bash
bun install --frozen-lockfile
bun run setup:hooks
bun run --cwd apps/cms test
```

The default web development command generates content from the shared fixture
and does not need CMS credentials:

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
Directus or shared fixture -> export-fallbacks.ts -> 20 ignored typed modules -> SvelteKit
```

Web dev, test, check and build generate ignored content modules from the shared
fixture by default, without credentials or network. Trusted Vercel targets use
live content; local operators select it with `EXPORT_FALLBACKS_SOURCE=live`.
Refresh the fixture from a live cache with
`bun apps/cms/scripts/trim-export-fixture.ts`; commit the fixture, not generated modules.

The exporter validates the complete registry before emitting. Every live export
also validates legal truths and explicit SEO description lengths. Trusted Vercel
fetch failures fail the build. Explicit local live exports may fall back to the
last live cache; missing live content and cache fails the export.

CMS projects export only when published; draft is not public WIP. Required
`block_*` singletons must be published or the live build fails before emitting
new modules. Statusless configuration remains supported. An archived
`site_pages` section is excluded consistently from route, OG, LLM and sitemap
generation; a successful rebuild is still required to remove deployed output.

Intentional runtime integrations are server-side weather, Transit KPI polling,
Web3Forms contact submission and consent-gated analytics. Sitemap, robots and
redirect handlers read generated content. `.cms-cache.json` is a local exporter
fallback, not visitor content storage; optional GitHub README reads occur at
build time. Vite development alone may fall back to CMS assets.

### Image publication requires an explicit mirror release

CMS edits require the manual Publish action and cannot change committed
image bytes. Register new images through the existing reviewed asset manifest
and UUID mapping workflow first. For a registered image or same-ID replacement,
read from the selected CMS into a preview, then write only the reviewed digest:

```bash
# In apps/cms, with the selected CMS URL and read credential injected securely:
bun scripts/mirror-asset.ts --path=images/about/headshot.webp
bun scripts/mirror-asset.ts --path=images/about/headshot.webp --apply-sha256=<reviewed-digest>
```

This reads one CMS image and changes local source bytes only; it does not upload,
delete, change permissions or deploy. Review rights/provenance, the image diff
and mapping, regenerate variants through the validated build, then use the
separately approved source release. An unregistered UUID, invalid image, format
mismatch or changed digest fails before replacing the mirror. CMS deletion does
not erase existing repository/deployment bytes; removal needs its own reviewed
source release. Preserve trashed provenance pages and potentially unique links.

### Publish once per editing session (D6)

After editing, open Site Config (`build_queue`) → Flows → **Publish site** and
confirm. This manual action requests one build of the current published CMS
content for this environment, taking about 3 minutes. It POSTs the environment's
`VERCEL_DEPLOY_HOOK_URL` (allow-listed in `FLOWS_ENV_ALLOW_LIST`) with
`buildCache=false`. Edits never rebuild the site by themselves; no polling flow
remains. The legacy refresh flag is retained as dead schema and has no effect
on publishing.

The only other declared flow logs translation reminders on publish. Repository
contracts verify the intended configuration offline; verify delivery with an
actual target build and deployed-content receipt. Live configuration changes
remain separately authorized operator work.

## Locale contract

The public locale interface is exactly `en`, `fr`, and `es`.
`packages/shared/src/types/content.ts` and
`packages/shared/src/schemas/shared.ts` own the type and validation seam.
English is required in every localized value. French and Spanish are optional
at the field shape so missing content falls back directly to English, while
the web publication layer currently exposes all three locale routes. Support
for a locale is not proof that every field has a translation; content
integrity tests own that coverage evidence.

Locale-aware fetchers must preserve the same three-code interface.

## Schema workflow

`directus/` is schema and configuration. Editorial rows live in Directus.
Retained fixtures hold asset and content contracts; they do not restore editorial rows.

From the repository root with a configured ignored `apps/cms/.env`:

```bash
bun run --env-file=.env --cwd apps/cms sync:diff
bun run --env-file=.env --cwd apps/cms sync:pull
```

`sync:diff` is the read-only preview. `sync:pull` replaces the local
`apps/cms/directus/` dump with remote state, so review its complete diff and
stage only that directory. Production apply belongs to the environment-gated
`push` job in [`.github/workflows/cms.yml`](../../.github/workflows/cms.yml).
The `flows-push` dispatch audits permissions, previews, pushes only `flows`, and checks convergence.
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

slice-43.12 (2026-10-24) retired the duplicate Ops Bot role/policy and rebound
the repository's Ops Bot role, policy and permission sync ids on DEV and PROD.
Production pushes selecting policies or permissions remain blocked by
`sync-push.ts` because the dump declares 31 deferred asset-registry grants
(and 10 Editor bookmarks in presets) that production intentionally lacks.
Existing acknowledgements do not override that hold. Use only separately
approved, narrowly scoped flow work; do not apply the broad configuration diff.

Permission control follows the same rule. The read-only audit owns discovery.
Targeted reconcilers and the guarded CMS workflow own repairs. Do not replace
them with ad-hoc Data Studio or REST mutations.

### Production Build Bot cover permission

Applied to production on 2026-10-12 by the `buildbot-cover-permission` lane
(cms run 38205771447). The grant stays out of the shared dump and unmapped by
design. Its receipt artifact expires 2026-11-11.

[`ops/permissions/buildbot-cover-permission.json`](ops/permissions/buildbot-cover-permission.json)
is the production-only operational declaration, separate from the shared
`directus/collections/permissions.json` dump so production file identities cannot
become development configuration. Its allowlist and pre-apply evidence belong
to operations; the published cover references remain in audited content sources.
Its `syncBinding` remains pending. This reconciler creates no sync mapping;
do not use a full `sync:pull` to capture one, because pulling can create remote
mappings for unrelated rows. Before any future permissions synchronization,
review a production-only load/save binding that preserves this exact rule and
keeps its production UUIDs out of the shared development dump.
It targets Build Bot policy `9ef59c42-2e10-43e4-b0f9-7b7c91bff997`,
`directus_files:read`, and fields `id`, `title`, `description` for exactly:

- `2c41a9a0-34aa-4e3b-b333-5e6dcd53497c`
- `2d257b93-bb5c-451a-9f2e-143291d881ad`
- `42024627-5dab-496e-9d69-18387300802e`
- `4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d`

This also permits authenticated image bytes and allowed preset transforms for
those four files. It is not metadata-only. Anonymous access, other file IDs,
file writes, users, policies, and the five preexisting asset-registry permission
differences stay outside the change. The reconciler freezes the complete
recipient graph and existing Build Bot permission preimage into its reviewed
hash; it refuses changed recipients, prior permission drift, or conflicting
file-read rows instead of reconciling the whole policy.

The declaration pins the Build Bot permission count and hash
(`permissionsCount` / `permissionsSha256`). Any other Build Bot permission
change — for example retiring the three dead reads on `site_blocks`,
`site_catalog`, `site_layout` (collections that no longer exist) — must re-pin
the declaration or wait until the rollback window has closed.

Use the `cms` workflow on `main`; all four cover actions require passing tests
and the `production` environment. The static administrator credential is
available only to each reconciler step. Receipts are retained for 30 days in
the `buildbot-cover-permission` artifact; keep the apply run ID and preserve
its receipt if a longer rollback window is required.

1. Dispatch `buildbot-cover-permission-preview`. Review `preview.json`, its
   exact planned create, recipient/permission preimage, and plan SHA-256.
2. After direct human approval, dispatch `buildbot-cover-permission-apply`
   with that hash in `cover_permission_approval_sha256`. It previews again,
   then applies only if the live preimage still matches the approved plan.
   Save `apply.json`, including the returned numeric `createdId`.
3. If rollback is authorized and needed, dispatch
   `buildbot-cover-permission-rollback-preview` with the original apply run ID
   in `cover_permission_apply_run_id`. The workflow downloads that completed
   main CMS run's receipt from this repository, including when verification
   failed after creation. Review `rollback-preview.json` and its plan hash.
4. Dispatch `buildbot-cover-permission-rollback` with the same original apply
   run ID and the reviewed rollback hash in `cover_permission_approval_sha256`.
   It compares the full live row and preserved preimage before deleting only
   the receipt's `createdId`, then verifies restoration. Any mismatch stops it.

Never retry a failed or uncertain create blindly. Preserve the receipt and
inspect the exact live row through the reconciler; an uncertain POST without
a recorded ID needs investigation before another write. The guards do not
provide atomic compare-and-swap against concurrent external administrator
writes: coordinate a single writer for the operation. Do not substitute
`sync:push --include-permissions` or a broad `--require-converged` audit.

An administrator readback proves only the targeted permission change. After
authorized apply, separately use the existing production Build Bot credential
to verify the twelve blog cover expansions, exactly four accessible file IDs,
a denied fifth file and ungranted metadata field, and unchanged anonymous
access. Then run the normal CMS-to-production export/build/deploy pipeline and
verify the new deployment's covers, SEO/JSON-LD, and full publication routes.
Do not mark publication accepted from the permission receipt alone.

## Recovery

- DEV recovery: `refresh-dev-from-prod.sh` resets Neon from PROD and syncs R2.
- PROD recovery: use Neon instant restore within the project history window.
- Schema and configuration recovery: use guarded `sync-push`.

## Asset and preset ownership

`packages/shared/src/asset-registry.ts` owns semantic keys, release entries,
usage declarations, kinds, roles, and delivery modes. The Directus snapshot
owns `asset_records`, `asset_versions`, and `asset_usages`. The corresponding
setup scripts are guarded migration tools, not alternate schema
authorities.

`fixtures/assets-manifest.json` owns the repository-to-CMS migration inventory
and the SHA-256 digest of each committed mirror. Export verifies those bytes
before emitting; manifest tests check every digest. Web guards reject literal
Directus asset identities and new raw HTML/SVG injection files outside the
reviewed allowlist.
`fixtures/assets-id-map.json` and its shared-package mirror are a frozen record
of the 18d migration, consumed by export and tests. They are not a regeneration
target. File UUIDs are environment-specific and must not be copied into another
environment as configuration. `fixtures/brand/presets.json` owns the four
named transform declarations, also recorded in
`directus/collections/settings.json` as `storage_asset_presets`.

The current OpenWeather setup uses one existing key, independently scoped to `develop`
and Production; this is target scoping, not a claim that a second credential exists.

## Environment contract

| Target | CMS origin | Build credential | Export rule |
|---|---|---|---|
| Vercel Production | `https://cms.yesid.dev` | `DIRECTUS_BUILD_TOKEN` | `EXPORT_FALLBACKS_LIVE=1`; live or fail |
| `develop` preview | `https://cms.dev.yesid.dev` | `DIRECTUS_DEV_BUILD_TOKEN` | `EXPORT_FALLBACKS_LIVE=1`; live or fail |
| Generic preview | none required | none | Generate from the shared fixture |
| Local | none by default | none by default | Fixture; explicit `EXPORT_FALLBACKS_SOURCE=live` permits live/cache export |

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
- [Security reporting](../../SECURITY.md)
