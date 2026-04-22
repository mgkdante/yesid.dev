# slice-18 — Spec (Cloud content layer: Directus)

> Single-level slice (no sub-slices). Spec is mostly immutable after approval. Post-approval changes get logged in § Amendments at the bottom.

## Metadata

| Field             | Value                                                     |
|-------------------|-----------------------------------------------------------|
| Status            | approved (post-Task-2: D1/D2/D3 + Q4–Q7 resolved)         |
| Priority          | 1                                                         |
| Estimated effort  | 6–8 sessions                                              |
| Parent slice      | none (single-level)                                       |
| Depends on        | slice-headless-cms-best-practices (research; PR #31)      |
| Unblocks          | upcoming slices 19+ (content-driven features)             |
| Size              | L                                                         |
| Branch            | feature/slice-18                                          |

## Goal

Ship a Directus-backed content layer for yesid.dev: a production-hosted Directus 11+ instance on `cms.yesid.dev`, a `DirectusAdapter` that conforms to the existing `ContentAdapter` contract, and feature parity with `staticAdapter` for every content type (services, projects, blog posts, pages, meta). Payload is gone from `yesid-dev-cms`. The site reads through the adapter seam — repositories, components, and routes unchanged.

## Why this slice

The prior CMS attempt (Payload) over-coupled to Node infrastructure and under-delivered on admin UX for a solo operator. Pivoted to Directus in PR #31 after a 6-agent research slice. This slice executes the pivot end-to-end: scorch Payload, stand up Directus, wire the adapter, migrate seed data, verify, cut over.

## Core principle

**The adapter seam is the contract.** If a change crosses the seam — touching repositories, components, or route loaders — it doesn't belong in this slice. Slice-18 is a CMS swap, not a redesign. Any temptation to "improve" the consumer side triggers STOP + defer.

## Durable outputs

1. `DirectusAdapter` at `src/lib/adapters/directus.ts` (Task 4).
2. Directus schema + seed scripts in `yesid-dev-cms` (Task 3 + Task 6 — paths TBD from Task 2 research).
3. Resolved D-entries in § Design decisions capturing hosting, storage, and schema-provisioning choices (Task 2 output).
4. Memory updates (`project_cms_directus.md`, `project_slice_18_status.md`) reflecting shipped state.

## Reference sites / prior art

- **slice-headless-cms-best-practices** (`docs/slices/slice-headless-cms-best-practices/`) — pivot rationale + FORMULA + 12-heuristic eval. Primary reference for every D-entry below.
- **Adapter contract predecessor:** `staticAdapter` in `src/lib/adapters/static.ts` — target surface for Directus.

## Context

### Problem

- yesid.dev content lives in hand-authored TS modules (`src/lib/content/*.ts`). Every content change is a PR. No admin UI. No non-developer authoring path.
- Prior Payload attempt built out `yesid-dev-cms` but was never wired to the site (adapter seam never flipped). 73 seeded rows stranded.
- Payload's Node-coupled deploy story + slow Data Studio UX didn't justify the infrastructure cost for a solo operator.

### Prior decisions still load-bearing

- **Pivot to Directus** (PR #31 decision-brief). Locked.
- **Adapter seam at `src/lib/adapters/index.ts`** is the single mutation point. Non-negotiable.
- **Infrastructure kept across the migration:** Neon Postgres, Resend, `cms.yesid.dev`. Non-negotiable.
- **No Payload co-existence.** Hard cutover via scorch.

### Constraints

- Solo operator; every hour of custom-extension work is an hour not shipping content.
- Budget-conscious; free-tier / cheap-tier preferred for Directus hosting.
- Zero public-site downtime tolerated (site runs on `staticAdapter` through the entire migration).

### What's intentionally NOT being addressed here

- Content redesign. Adapter is a faithful swap; new fields / new content types land in future slices.
- Auth. Public site has no auth surface; Directus admin auth is inherited from the platform.

## Architecture

- **Zero changes to `src/lib/repositories/*` or `src/lib/components/*`.** Entire swap happens at `src/lib/adapters/index.ts:6`.
- **New file:** `src/lib/adapters/directus.ts` — implements `ContentAdapter` against Directus REST / GraphQL.
- **Swap point:** one-line `export { directusAdapter as adapter }` change in `src/lib/adapters/index.ts`.
- **yesid-dev-cms rebuild:** Payload scorched (Task 1), Directus installed (Task 3), schema + seed provisioned (Task 3 + Task 6).
- **DNS + TLS unchanged.** `cms.yesid.dev` stops serving Payload and starts serving Directus; certificate, DKIM, SPF all preserved.
- **Measurement:** parity check against `staticAdapter` output at Task 7 — same pages render the same content.

## Scope

### In scope

- Full Payload removal from `yesid-dev-cms`.
- Directus 11+ install, schema, seed migration.
- `DirectusAdapter` implementing `ContentAdapter` for all current content types.
- Adapter-seam flip.
- Dev + prod verification.
- Slice-level handoff + cross-tool peer review.

### Out of scope

- New content types or field additions. (Future slices.)
- Auth for non-admin surfaces. (None exists today.)
- Redesign of any page, component, or route.
- Dual-adapter fallback ("failover to static"). Hard cutover only.
- CI-gated content-change previews. (Future slice.)

## Design decisions

Populated as Task 2 research produces findings. Each D-entry: chosen / alternatives / why this won / tradeoff / affects. Stubs below anchor known open questions.

### D1 — Directus hosting: **Railway Hobby** ($5/mo)

- **Chosen:** Self-host Directus on Railway's Hobby plan, using the official Directus CMS template as the starting point. Keep our existing Neon Postgres (BYO via `DB_*` env overrides). Auto-TLS on `cms.yesid.dev`.
- **Alternatives considered:**
  - Directus Cloud Starter ($15/mo): rejected — shared-DB architecture can't reuse Neon; custom-domain support is "partial"; 3× the cost.
  - Fly.io PAYG ($3–6/mo, scale-to-zero): acceptable runner-up; cheaper and has scale-to-zero, but no Directus-authored template and the PAYG-only signup is a newer path.
  - Hetzner CX22 (€3.99/mo): cheapest raw specs but DIY Caddy/Traefik TLS + OS patching; incompatible with "solo operator, budget on operator hours" profile.
  - Render Starter ($7/mo): works but more expensive than Railway for equivalent specs.
  - DO App Platform Basic ($5/mo): fine; no native Directus template, so Railway wins on DX.
  - Vercel: non-starter — Directus needs persistent Node + filesystem + WebSockets; Vercel's FaaS model can't host it (Vercel's own KB confirms).
- **Why this won:** official Directus template on Railway provisions the full stack in one click; BYO-Neon satisfies the plan-level infra constraint; auto-TLS on 2 custom domains preserves `cms.yesid.dev` + DKIM/SPF; $5/mo floor with $5 credit ≈ predictable near-zero overage at our traffic profile; lowest ops burden of any BYO-Neon-compatible option.
- **Tradeoff:** no scale-to-zero (Directus is always-on at $5/mo floor). Fly.io would give scale-to-zero at slightly lower cost — revisit if traffic genuinely is near-zero and `$` matters more than DX.
- **Affects:** Task 3 (install + config), Task 8 (retire Vercel project on yesid.dev-cms at cutover).

### D2 — Storage adapter: **Cloudflare R2** via built-in `s3` driver

- **Chosen:** Cloudflare R2 bucket, accessed via Directus's built-in `s3` driver (with `STORAGE_S3_ENDPOINT` pointed at the R2 S3-compatible URL). `$0` egress, 10 GB + 1M Class A + 10M Class B ops free per month.
- **Alternatives considered:**
  - **Vercel Blob: RULED OUT — no Directus driver exists.** This is a revision from the research slice's assumption (live fetch of `https://directus.io/docs/configuration/files` on 2026-04-22 confirmed the driver catalogue: `local`, `s3`, `gcs`, `azure`, `cloudinary`, `supabase`). A custom `@directus/storage-driver-vercel-blob` is conceptually possible but fails the `feedback_prefer_platform_builtins` rule.
  - Backblaze B2: cheaper storage ($6/TB vs R2 $15/TB) with free egress via Cloudflare CDN — but adds CDN config overhead. Runner-up if storage grows past 10 GB.
  - Tigris: $0 egress, pairs naturally with Fly.io. Runner-up if we revisit D1 to Fly.io.
  - AWS S3: $0.09/GB egress hurts the Vercel-frontend story.
  - Cloudinary: overkill; Directus already does image transforms via `/assets/<id>?width=…`.
  - Directus local filesystem: fine on Railway/Fly (with volume) for dev, but ties us to a single host and makes backups a separate problem.
- **Why this won:** `$0` egress is the single biggest cost lever for a Vercel-hosted frontend. 10 GB free covers yesid.dev's asset mix for year 1. Built-in `s3` driver = zero custom-code maintenance. S3-compatible → portability (swap env vars to move to B2 later).
- **Tradeoff:** R2 storage is $0.015/GB vs B2's $0.006/GB — pricier per GB at scale. At our asset size the savings don't justify CDN-config overhead.
- **Affects:** Task 3 (storage provision + env wiring), Task 4 (media URL shape — adapter returns `{DIRECTUS_URL}/assets/{id}?width=…`).

### D3 — Schema provisioning: **`directus schema snapshot` + `apply`** with YAML committed to Git

- **Chosen:** Use Directus's `snapshot` CLI to produce `infra/directus/snapshot.yaml` (all collections, fields, relations, roles, permissions, flows). Commit to Git. Apply in CI via `directus schema apply` on an ephemeral Directus instance as a smoke-test gate; apply to production via a manual-approval step.
- **Alternatives considered:**
  - Data Studio (GUI) alone: fast for prototyping but zero audit trail; unreviewable; impossible to rebuild. Use for exploration, always follow with a snapshot.
  - Raw SQL migrations (Knex `./migrations/`): higher maintenance, hand-written up/down scripts. Reserve for cases the schema API can't express (triggers, materialized views).
- **Why this won:** YAML PR diffs are readable; full reproducibility from the file; drift detection via `schemaDiff`; Flows + roles + permissions included in the snapshot (as of Directus 11).
- **Tradeoff:** `schema apply` is destructive on field removals — CI needs a confirmation gate or manual-approval step before production apply. Also: seed data is NOT in the snapshot (schema only); Task 6 handles seed via a separate `scripts/seed.ts`.
- **Affects:** yesid.dev-cms repo shape (adds `infra/directus/snapshot.yaml` + CI), Task 3 (bootstrap with apply), Task 6 (seed separately).

## File-touch summary

- **Created:**
  - `docs/slices/slice-18/{plan,spec,research,handoff}.md` (Task 0)
  - `src/lib/adapters/directus.ts` (Task 4)
  - yesid-dev-cms schema / seed scripts (Task 3 + Task 6 — paths TBD from Task 2)
- **Modified:**
  - `src/lib/adapters/index.ts` (Task 4 — one-line flip; drop stale Payload comment)
- **Deleted:**
  - Entire Payload surface in yesid-dev-cms (Task 1 — collections, globals, config, migrations, seed, types, packages, scripts)
- **Out-of-repo:**
  - `cms.yesid.dev` — Directus supersedes Payload (Task 3)
  - Memory files: `project_slice_18_status.md`, `project_cms_directus.md`

## Acceptance criteria

- [ ] Task 0 — scaffold landed on `feature/slice-18`; 4-file flat bundle; handoff Task 0 block appended.
- [ ] Task 1 — yesid-dev-cms `main` has zero `@payloadcms/*` refs. `grep -rn "@payloadcms\|payloadcms"` returns no matches.
- [ ] Task 2 — D1/D2/D3 resolved with rationale; site code untouched.
- [ ] Task 3 — Directus serves `cms.yesid.dev`; admin login works; schema matches current `staticAdapter` shape.
- [ ] Task 4 — `DirectusAdapter` in production; one content type sourced from Directus; repository + component tests green.
- [ ] Task 5 — all content types on Directus; staticAdapter removed or dev-only-gated (TBD per research).
- [ ] Task 6 — seed parity: every staticAdapter row represented in Directus; locales verified.
- [ ] Task 7 — full yesid.dev test suite + full E2E green on `main` with Directus live.
- [ ] Task 8 — slice close: handoff PR body drafted; peer review clean; memory files updated.
- [ ] Every task: `bun run test` + `bun run check` + `bun run lint` green on yesid.dev.

## Open questions

- **Q1.** Directus hosting → resolved as D1 (Railway Hobby).
- **Q2.** Storage adapter → resolved as D2 (Cloudflare R2 via `s3` driver).
- **Q3.** Schema provisioning → resolved as D3 (`snapshot` + `apply` YAML in Git).
- **Q4.** Does `staticAdapter` stay as a dev-only fallback or get deleted entirely? → **Keep as dev-only fallback through Slice 18 close. Delete in Slice 19+ after 2+ weeks of production-green Directus.** Rationale: safety net during cutover; removal is an independent decision that doesn't block the migration. Consumer-side: `src/lib/adapters/index.ts` re-export flips to `directusAdapter as adapter` in prod; a dev-mode fallback can be wired as a Task 4 detail if needed (likely not needed — dev traffic is the developer, who can run Directus locally).
- **Q5.** Is preview/draft content needed for blog? Does that change adapter shape? → **Yes, using Directus native `status` field + Content Versioning + `@directus/visual-editing` package; wire in a follow-up slice, OUT of Slice 18 scope.** Adapter impact: DirectusAdapter accepts an optional `preview?: boolean` flag at construction; public token filters `status._eq="published"`; preview route uses `withToken()` for a short-lived signed token that bypasses the filter. Scope note: preview routes + visual-editing overlay are a distinct feature and land later.
- **Q6.** Locale strategy — Directus translations collection vs per-locale collection vs JSON per field. → **Approach A: native Directus Translations field type + adapter-boundary transform.** Creates a `languages` collection + `<collection>_translations` junction per collection. DirectusAdapter ships a pure function `toLocalizedString(translations, field, fallback='en') → LocalizedString` so the consumer shape is unchanged. Per-request SvelteKit pattern: fetch `fields: ['*', { translations: ['*'] }]` (all locales at once — cost trivial at our size). Falls back to `en` when requested locale is missing.
- **Q7.** Blog rich-text — Directus Block Editor vs keeping Markdown. → **Keep Markdown.** Use Directus's Markdown interface for blog-post body fields; SVG illustrations stored as `directus_files` and referenced by file ID. Adapter resolves file IDs to `{DIRECTUS_URL}/assets/{id}` URLs. Rationale: preserves `marked.parse` pipeline unchanged; keeps the BlogPost shape stable; avoids a component rewrite (Block Editor output is structured JSON, not HTML-compatible markdown). Same choice for tech-stack descriptions (currently one markdown file per item at `src/content/stack/{id}.md`; becomes a Markdown field on the `tech_stack` collection).

## Risks

See `plan.md` § Risks — slice-level risks live there and apply to every task in this single-level slice.

## Free-tier / cost / quota considerations

To resolve during Task 2:
- Directus Cloud pricing tiers (if managed).
- Directus + Postgres memory footprint (if self-host). Neon reuse vs new instance.
- Blob / S3 egress for media.

## Amendments log

| Date | Change | Why | Affected sections |
|------|--------|-----|-------------------|
| 2026-04-22 | D1, D2, D3 resolved (Railway / R2 / snapshot+apply); Q4–Q7 resolved. | Task 2 research landed; findings in research.md. Spec moves from draft to post-Task-2 state. | § Design decisions (D1/D2/D3), § Open questions (Q4–Q7). |
| 2026-04-22 | Vercel Blob downgraded from D2 candidate to non-starter. | Live fetch of Directus docs confirmed no Vercel Blob driver ships with `@directus/api`; custom driver would fail the `prefer built-ins` rule. Revision from the research slice's earlier assumption. | D2. |
