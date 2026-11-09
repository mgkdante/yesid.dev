# Published project drafts: local rehearsal

Status: blocked before nested-version verification, 2026-11-09.
Baseline: `origin/main` at `04a2437d`.

## Environment and commands

- Windows PowerShell, Bun 1.4.4, Docker Engine 29.9.3 (Linux containers).
- Official image from `apps/cms/Dockerfile`:
  `directus/directus:12.5.1@sha256:ef6fc027605ea659a972356e0c35fd7f88b02118b0b3a322dafbec3cc709fdab`.
- Fresh Postgres 16 Alpine container on the isolated `yesid-drafts-local` network.
- CMS binding: `127.0.0.1:18055:8055`. No production credentials, database,
  storage, flows, or configuration rows were loaded.
- Fresh local credentials lived only in temporary environment files outside
  the repository. No license was supplied or extracted from production.

Assemble the split repository snapshot, from the repository root:

```powershell
$draftRoot = Join-Path $env:TEMP 'yesid-project-drafts'
New-Item -ItemType Directory -Path $draftRoot -Force | Out-Null
$snapshot = Get-Content apps/cms/directus/snapshot/info.json -Raw | ConvertFrom-Json
$snapshot | Add-Member collections @(Get-ChildItem apps/cms/directus/snapshot/collections -Filter '*.json' | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json })
$snapshot | Add-Member fields @(Get-ChildItem apps/cms/directus/snapshot/fields -Recurse -Filter '*.json' | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json })
$snapshot | Add-Member relations @(Get-ChildItem apps/cms/directus/snapshot/relations -Recurse -Filter '*.json' | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json })
$snapshot | ConvertTo-Json -Depth 100 | Set-Content (Join-Path $draftRoot 'snapshot.json')
```

Input: 79 collections, 882 fields, 93 relations. The assembled file's SHA-256
was `616fe4d15b0a91ec347a858a6e5b2ea61bf660a192b46ee51a90fcefc8b8dca8`.
Whitespace, encoding and enumeration order can change the assembled-file hash.

Local environment files used these targets (secret values omitted):

```text
postgres.env: POSTGRES_USER=drafts, POSTGRES_DB=drafts, POSTGRES_PASSWORD=<fresh local value>
directus.env:
  KEY=<fresh local value>
  SECRET=<fresh local value>
  ADMIN_EMAIL=drafts@example.com
  ADMIN_PASSWORD=<fresh local value>
  DB_CLIENT=pg
  DB_HOST=yesid-drafts-db
  DB_PORT=5432
  DB_DATABASE=drafts
  DB_USER=drafts
  DB_PASSWORD=<same fresh local Postgres value>
  PUBLIC_URL=http://localhost:18055
  TELEMETRY=false
```

The following commands were run with those temporary files:

```powershell
docker network create yesid-drafts-local
docker run -d --name yesid-drafts-db --network yesid-drafts-local --env-file "$draftRoot/postgres.env" postgres:16-alpine
docker run -d --name yesid-drafts-cms --network yesid-drafts-local -p 127.0.0.1:18055:8055 --env-file "$draftRoot/directus.env" --mount "type=bind,source=$draftRoot,target=/rehearsal,readonly" directus/directus:12.5.1@sha256:ef6fc027605ea659a972356e0c35fd7f88b02118b0b3a322dafbec3cc709fdab
docker exec yesid-drafts-cms node -e 'console.log(JSON.stringify({client:process.env.DB_CLIENT,host:process.env.DB_HOST,database:process.env.DB_DATABASE,publicUrl:process.env.PUBLIC_URL}))'
docker exec yesid-drafts-cms node cli.js schema apply --yes /rehearsal/snapshot.json
```

The target readback printed only non-secret configuration:

```json
{"client":"pg","host":"yesid-drafts-db","database":"drafts","publicUrl":"http://localhost:18055"}
```

Schema apply exited 1 with this response:

```text
[22:13:59.297] INFO: Extensions loaded
[22:14:04.932] ERROR: Failed to create collection "build_queue"
[22:14:04.945] ERROR: collections limit exceeded.
type: DirectusError
message: collections limit exceeded.
at EntitlementManager.assert (.../license/entitlements/manager.js:207:94)
at async CollectionsService.createOne (.../services/collections.js:55:108)
extensions: { category: "collections" }
code: LIMIT_EXCEEDED
status: 403
```

An earlier temporary environment-file construction error caused an initial
attempt to use SQLite. That attempt also hit the collection limit, but is
excluded from the Postgres evidence above. The corrected Postgres bootstrap
also required replacing the rejected `.test` administrator email with
`drafts@example.com`. The vendor image has no `npx`; use `node cli.js`.

After the Postgres failure, this database query returned no rows:

```powershell
docker exec yesid-drafts-db psql -U drafts -d drafts -t -c "select collection from directus_collections where collection in ('projects','projects_sections','projects_sections_translations') order by collection;"
```

Both rehearsal containers were stopped. No `sync:push` was run.

## Acceptance evidence still required

The entitlement failure is not evidence that nested versions fail or succeed.
The required project collections were unavailable, so none of these runtime
claims has been established:

| Required check | Result |
| --- | --- |
| Save project translations and sections with nested EN/FR/ES block-editor translations into one version delta | Not reached |
| Existing child edits, new child creation and section ordering remain isolated from main | Not reached |
| Directus UI comparison shows the full nested changes | Not reached |
| Owner Promote applies all nested changes correctly | Not reached |
| Main-item query and actual project fetcher/export ignore unpromoted changes | Not reached |

Source inspection only: `fetchProjects` reads published projects with nested
translations and sections and supplies no content-version query parameter.
This supports the intended main-item boundary but does not prove isolation.

## Proposed design and continuation

Resume with a dedicated entitlement for this disposable local instance, then
repeat the full-schema rehearsal. Do not reuse a production license or token.
Do not treat a reduced schema or a newer Directus release as full acceptance.

If the rehearsal passes, prefer a guarded save-only script over broad grants
on `directus_versions`. Inject a dedicated, minimally scoped author token with
`op run`. The script should preview first, bind explicit apply to the reviewed
content hash, accept only named versions of `projects`, and expose no promotion,
publication, deletion, file creation, or arbitrary system-collection writes.
The exact token permissions still need validation against 12.5.1, especially
the existing restriction on updates to published projects. A script guard is
not a substitute for server-side permission limits.

Expected operator sequence, pending successful verification and implementation:
stage a named version; review all three languages and nested sections in
Directus; owner selects Promote; owner manually runs **Publish site**.

If nested versions demonstrably fail, propose a separate draft page graph or
section status plus export filtering. A section status alone does not isolate
edits to existing published project translations or section translations;
that alternative needs a complete promotion design before implementation.

No staging script, permission grant, or alternative schema was implemented.
The current risk remains: editing a published project's actual section rows
changes the next manual export. This document does not make that safe.

## Repository validation

- `bun install --frozen-lockfile`: passed with Bun 1.4.4.
- Root `bun run check`: passed, including CMS TypeScript and Svelte checks
  (0 errors, 0 warnings); CMS task was a Turbo cache hit.
- `bun run test` in `apps/cms`: 595 passed, 0 failed, 4,495 assertions.
- Build not run: this change only adds documentation, with no runtime or build edits.
- These gates do not validate the blocked Directus version behavior.
