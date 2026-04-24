# slice-18 — Spec (Cloud content layer: Directus)

> Single-level slice (no sub-slices). Spec is mostly immutable after approval. Post-approval changes get logged in § Amendments at the bottom.

## Metadata

| Field             | Value                                                     |
|-------------------|-----------------------------------------------------------|
| Status            | approved + mid-slice scope correction (post-Task-2b: D1–D12 locked, Q4–Q12 resolved) |
| Priority          | 1                                                         |
| Estimated effort  | 12–15 sessions total (7 shipped Tasks 0–7; ~6 remaining Tasks 8–15)   |
| Parent slice      | none (single-level)                                       |
| Depends on        | slice-headless-cms-best-practices (research; PR #31)      |
| Unblocks          | upcoming slices 19+ (preview-routes + visual-editing feature slice, AVIF verification, `staticAdapter` deletion, marketplace extensions evaluation) |
| Size              | XL (expanded mid-slice from L at Task 2b)                 |
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

### D4 — Visual Editor integration: **`@directus/visual-editing` v2 SDK, conditionally wired**

- **Chosen:** `@directus/visual-editing` v2.0.0 (MIT, npm package) as the consumer-side click-to-edit overlay. Render `data-directus={setAttr({collection, item, fields, mode})}` attributes **conditionally** (gated by `$page.url.searchParams.has('edit')` or similar), and call `apply({ directusUrl, onSaved: invalidateAll })` lazily via `onMount` per opt-in component — never from `+layout.svelte` globally.
- **Alternatives considered:** Always-on attributes (rejected — leaks collection/item IDs to public DOM; SEO noise); custom overlay (rejected — re-implements what ships with the SDK); Payload-style live-edit (non-applicable; Payload is gone).
- **Why this won:** First-party SDK; SvelteKit-idiomatic wiring officially documented; field-level permission gating honored natively (Directus ≥ 11.16 + library ≥ v2.0.0); `invalidateAll()` on save matches SvelteKit's re-fetch idiom.
- **Tradeoff:** Requires every block shape to carry `id: string` to the consumer — adapter churn when blocks land (Task 14). Also mandates CSP/CORS config on `cms.yesid.dev`: `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC=https://yesid.dev https://*.vercel.app` + `CORS_ORIGIN=https://yesid.dev`.
- **Affects:** Task 14 (block shapes add `id`), yesid.dev-cms env config, Slice 19+ feature-slice when preview routes wire up.

### D5 — Content Versioning: **enable on all user collections + block collections; no separate `status` field**

- **Chosen:** Enable Directus Content Versioning (v11+) on every content collection (services, projects, blog_posts, tech_stack, stack_scenarios, pages, and every block_* collection). Use Directus's global `draft` version (reserved, auto-present on every item since v11.16) as the canonical editor workspace. Editors edit draft → Compare → Promote via Data Studio's native UI. No separate `status` field.
- **Alternatives considered:** Add a `status` enum (`draft | published | archived`) on top of versioning — rejected as duplicate state; `status` only earns its place if we later need scheduled publishing. Version-free workflow (authoritative row only) — rejected; editors need safe drafting.
- **Why this won:** `/items/{collection}` always returns main — **versioning does NOT silently filter list responses**, so public anonymous reads stay unchanged regardless of open drafts. The `?version=draft` param is opt-in and item-scoped only; preview routes use it explicitly. Promote is the publish verb; no extra state to reconcile.
- **Tradeoff:** `directus_versions` + `directus_revisions` grow indefinitely unless pruned — set `REVISIONS_RETENTION=90d` in Railway env at close.
- **Affects:** every content-type task (Tasks 10–14) enables versioning at authorship; Slice 19+ preview routes consume the `?version=draft` path.

### D6 — Preview routes: **dedicated `/preview/*` tree + single editor token + per-call `PreviewContext`**

- **Chosen (shape locked; implementation deferred per Q5):** Dedicated `/preview/[collection]/[id]?version={{$version}}&token={{$token}}` route tree in yesid.dev. Server-only `+page.server.ts` validates the token against a single `EDITOR_PREVIEW_TOKEN` env var; Directus Visual Editor injects `{{$version}}` + `{{$token}}` globally. Adapter surface gets an optional `PreviewContext = { token, version? }` parameter per method call — never at construction — so `directusAdapter` branches on `withToken(token, readItem(..., { version }))` and `staticAdapter` ignores the arg.
- **Alternatives considered:** Query flag on public URLs (`/services/[id]?preview=TOKEN`) — rejected; couples preview cache-defeat to public routes. Directus `/shares` one-shot tokens — rejected as overkill for a single-editor (owner-only) site; revisit if multi-editor becomes a requirement. Per-construction preview adapter variant — rejected; doubles adapter wiring for a per-request concern.
- **Why this won:** Dedicated route tree can opt out of prerender/ISR via `export const prerender = false` + `config = { isr: false }` + `cache-control: no-store` without touching public routes; per-call `PreviewContext` keeps the adapter singleton-shaped; token validation is a single `if` in the route handler.
- **Tradeoff:** Manual token rotation (Topic 9 operations section); no per-user audit trail (single token = all editors look the same). Acceptable while owner is the only editor.
- **Affects:** Slice 19+ (implementation slice). D6 locks the shape so the implementing slice doesn't re-debate.

### D7 — Page composition: **`pages` collection with M2A `blocks` field; per-page block copies**

- **Chosen:** Create a `pages` collection (slug-keyed: `home | about | contact | services | projects | tech-stack | blog`) with a Many-to-Any `blocks` field pointing at block collections (`block_hero`, `block_manifesto`, `block_proof_reel`, `block_services_grid`, `block_cta`, `block_closer`, `block_about_content`, `block_contact_content`, `block_tech_stack_page_content`, `block_blog_page_content`, `block_projects_page_content`, `block_journey_panel` — expanding as pages migrate). Each block collection has its own `translations` O2M. **Per-page block copies** — a "CTA" is authored separately on home, services, and projects pages (duplicated content; simpler editor UX). Adapter flattens at the boundary to preserve the existing `ContentPort` method surface; no consumer-side component change.
- **Alternatives considered:** Flat singletons with 20+ fields each (rejected — no drag-reorder, no add/remove, every new page = schema work); reusable catalog block collections with M2O references (rejected for MVP — clunkier author UX; revisit when 3+ pages share 2+ blocks); rewriting consumers to iterate `blocks[]` arrays with discriminated-union components (rejected — redesigns every page; out of Slice 18 scope).
- **Why this won:** Editor gains drag-reorder, add/remove block type, and any future page drops in without schema work. Adapter-side `loadPage(slug)` helper memoizes per-request so all N port calls on one page share one Directus round-trip (confirmed M2A-query shape with collection-keyed `item` hydration via `@directus/sdk`). Zero consumer change lands the migration without surface disruption.
- **Tradeoff:** Content duplication when the same block (CTA) appears on N pages; higher row count in `directus_versions` for block-level edits. Both acceptable at current page count.
- **Affects:** Task 14 primarily; also the `site-content.ts`-typed `typeof import(...)` ContentPort methods preserve their TS shape via `import type` from a type-only module.

### D8 — Publish revalidation: **Directus Flow → Webhook → SvelteKit ISR bypass**

- **Chosen:** One Directus Flow per content collection (services, projects, blog_posts, tech_stack, pages, site_meta, route_seo). Trigger = Event Hook (action, `items.update` + `items.create` + `items.delete`). Condition op filters on `$trigger.payload.status _eq published` (or equivalent version-promotion signal). Webhook op calls `GET https://yesid.dev/<canonical route>` with header `x-prerender-revalidate: {{$env.VERCEL_BYPASS_TOKEN}}`. SvelteKit routes set `config.isr.bypassToken` to match. No custom `/api/revalidate` endpoint.
- **Alternatives considered:** Custom SvelteKit `/api/revalidate?path=…` endpoint — rejected; SvelteKit + Vercel's native `bypassToken` mechanism matches the ISR model without extra code. Custom Directus hook extension — rejected; Flows cover the use case fully and are snapshot-versioned. Schedule-based polling — rejected; Directus Flows model events natively.
- **Why this won:** 100% built-ins; flow definitions export with `snapshot.yaml`; Webhook op supports bearer-style headers; Vercel's ≤300ms global purge + 30s stale-while-revalidate-with-retry gives operational resilience without first-class retry in Directus.
- **Tradeoff:** No first-class HMAC or retry on the Directus webhook op; Vercel's stale-while-revalidate absorbs the gap. Also: unpublish + delete require their own event hooks to purge stale 200s.
- **Affects:** Task 15 (optional within Slice 18; defer if time-constrained). `VERCEL_BYPASS_TOKEN` = shared env var (Railway + Vercel).

### D9 — Asset pipeline: **`/assets/:id?key=<preset>` with saved presets + folder-per-content-type**

- **Chosen:** Upload assets to Directus via SDK → files written to R2 via built-in `s3` driver → public reads via `/assets/:id?key=<preset>` with saved presets `hero-1200` (WebP, width 1200, quality 85, cover), `card-600` (WebP, width 600, quality 80, cover), `thumb-240` (WebP, width 240, quality 75, cover), `og-1200` (JPG, width 1200 × height 630, quality 85, cover). One folder per content type (`/services`, `/blog`, `/projects`, `/brand`, `/og`). Alt text via `directus_files.description`. Explicit `width` + `format` params allowed for arbitrary `srcset` widths (bypasses 5-op cap only when using presets).
- **Alternatives considered:** Per-request transform params only (rejected — hits the 5-op-per-request cap quickly); Cloudinary as a CMS plugin (rejected — overkill; Directus does transforms via Sharp); presigned R2 URLs bypassing Directus (rejected — loses permissions + transforms layer); keeping `static/images/*` pass-through (rejected — not CMS-native; no editor control).
- **Why this won:** `$0` R2 egress (D2) × preset-based caching × Directus-native Sharp transforms × Cloudflare CDN per-query-string caching = optimal cost/DX at yesid.dev's asset size. Migration is a one-off script; adapter exposes `{ id, url, width, height, description }` per asset; `asset()` helper composes `srcset` client-side.
- **Tradeoff:** AVIF absent from Directus's documented format list (as of 2026-04-23) — use WebP for now, revisit when live-verified. `legacy_path` custom field retained on `directus_files` only during Slice 18 migration window; drop in Slice 19+ once every consumer flips.
- **Affects:** Task 9 (migration script + presets + folders), Tasks 10–14 (each content type references assets via Task 9 map).

### D10 — Role/policy matrix: **capability policies composed onto admin/human-editor/ai-editor/Public roles**

- **Chosen:** Nine capability policies (`content-read-all`, `content-read-published`, `content-edit-safe-fields` [field-allowlist excluding `slug`], `slug-edit-admin-only`, `no-delete-published` [filter `status _neq published`], `delete-anything`, `files-read-public` [folder-scoped], `files-write-editor`, `versions-own` [filter `user_created _eq $CURRENT_USER`]). Four roles compose them: `admin` (all caps), `human-editor` (read+edit-safe+no-delete-published+files-write+versions-own), `ai-editor` (same as human-editor + read on `directus_collections/fields/relations` for MCP schema tool), `Public` (content-read-published + files-read-public). Collaborative editing enabled: `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true`.
- **Alternatives considered:** Monolithic per-role permissions (rejected — duplicates `no-delete-published` across roles; non-reusable); role hierarchy inheritance (v11 model moved `admin_access` onto policies — hierarchy is organizational only); granting `Administrator` to all editors (rejected — defeats the access-control purpose of the split).
- **Why this won:** Policies are shareable across roles; new roles (future "guest reviewer") become a role-composition exercise, not a permissions rewrite. Field allowlists are Directus's documented mechanism for "title yes, slug no". Filter-rule `permissions` block handles "no delete when published" at the DB layer (403 on request). Versions-own filter prevents editors from force-publishing peers' drafts.
- **Tradeoff:** ai-editor has wider surface than a pure read-only MCP — chosen deliberately so AI agents can author drafts, not force-publish. Collaborative editing requires Redis for multi-instance scale (single-instance Railway deploy doesn't need it yet but env vars stay enabled for consistency).
- **Affects:** Task 15 (policy authoring + snapshot export); MCP role tightening.

### D11 — Extensions posture: **zero custom Directus extensions in Slice 18**

- **Chosen:** No custom Directus extensions for Slice 18. All 14 inventoried temptations (on-publish side effects, Slack/Discord notify, seed scripts, auto-slug, publish dashboard, M2A authoring UI, GitHub stars sync, visual editing, cache invalidation, preview routes, AI alt-text, SEO fields, Turnstile, multi-lingual) resolve to Flows, built-in interfaces, Insights dashboards, or consumer-side code. Marketplace extensions (`directus-labs/seo-plugin`, `ai-alt-text-writer`, `ai-translator`) deferred to Slice 19+ pending concrete need.
- **Alternatives considered:** Install marketplace extensions now as a platform-posture move (rejected — reinforces `feedback_prefer_platform_builtins` at the cost of premature complexity); write custom hooks for on-publish side effects (rejected — Flows are declarative, snapshot-versioned, non-blocking); custom block-editor layout (rejected — blog stays markdown per Q7; M2A with native interfaces is sufficient).
- **Why this won:** Directus 11.17.3's built-in surface (Flows + ~14 operations + Translations + Slug + Tags + Markdown interfaces + Insights + Content Versioning + native MCP) covers every Slice 18 use case. Custom extensions would add ops burden (currently Railway template has no persistent `extensions/` mount — custom Dockerfile required) + maintenance code. The written justification rule stays intact.
- **Tradeoff:** If a future need emerges (e.g., complex AI Flow that doesn't fit `Run Script` sandbox), we'll reach for a marketplace op first, then consider a custom extension with a spec amendment. Friction is intentional.
- **Affects:** repo shape (no `extensions/` dir in yesid.dev-cms for Slice 18); marketplace extensions flagged for Slice 19+ evaluation.

### D12 — Repo-separation boundary: **yesid.dev owns consumer; yesid.dev-cms owns CMS; contract = adapter interface × snapshot × SDK shape**

- **Chosen:** Two-repo decoupling. **yesid.dev** owns: `ContentAdapter` interface (`src/lib/adapters/types.ts`), all adapter implementations (`directus.ts`, `static.ts`, `index.ts`), adapter tests, preview routes (future `.server.ts`), consumer env (`PUBLIC_DIRECTUS_URL`, `EDITOR_PREVIEW_TOKEN`, `VERCEL_BYPASS_TOKEN`), slice bundle docs. **yesid.dev-cms** owns: Directus container version pin, schema snapshot (`infra/directus/snapshot.yaml`), Flow definitions (inside snapshot), extension source (if any), role/policy config, Directus env template, **seed scripts** (migrated from yesid.dev in Task 8), **asset-migration scripts**, schema-apply CI. Contract seam = the `ContentAdapter` TS interface × `@directus/sdk` REST response shape × schema snapshot — a three-point synchronization rule. `scripts/seed-directus-services.ts` is explicitly misplaced today and migrates in Task 8 (rename to `seed-services.ts` on the CMS side; yesid.dev-cms gets a minimal `package.json` with `@directus/sdk` + `zod` + `bun-types`).
- **Alternatives considered:** Monorepo via Bun/Turbo workspaces (rejected — re-couples independent shipping cadences; different CI concerns; different security surfaces); one-repo unified (rejected — Payload-era mistake being corrected); contract-as-generated-types via `openapi-typescript` (deferred — Directus SDK already provides typed responses; generated-types layer adds ceremony without solving the change-propagation problem).
- **Why this won:** Each repo ships independently against its own deploy target (Vercel / Railway); CI scopes cleanly (unit+typecheck+preview vs ephemeral-Directus smoke+prod-apply); secrets stay scoped (admin token NEVER leaves CMS repo; public URL only in consumer repo); schema changes are reviewed as snapshot diffs on the CMS side before any consumer wiring. Three-point contract rule gives deterministic change-propagation (consumer-only derived = yesid.dev PR only; new authored field = CMS PR first then yesid.dev PR; rename = sequenced two-PR with prod-apply gate).
- **Tradeoff:** Two PR reviews per schema change; shared-token rotation is a manual multi-repo update. Mitigated by documented rotation policy in `yesid.dev-cms/README.md` Operations section.
- **Affects:** Task 8 (the decoupling task itself — seed script migration + `package.json` re-init on CMS side + cross-repo contract test scaffold); every subsequent task (10–14) lands as paired PRs per the three-point rule.

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

- [x] Task 0 — scaffold landed on `feature/slice-18`; 4-file flat bundle; handoff Task 0 block appended.
- [x] Task 1 — yesid-dev-cms `main` has zero `@payloadcms/*` refs. `grep -rn "@payloadcms\|payloadcms"` returns no matches.
- [x] Task 2 — D1/D2/D3 resolved with rationale; site code untouched.
- [x] Task 3 — Directus serves `cms.yesid.dev`; admin login works; schema matches current `staticAdapter` shape.
- [x] Task 4 — `DirectusAdapter` scaffold + `services` port + `toLocalizedString` transform; adapter compiles, tests added, seam NOT flipped (per plan).
- [x] Task 5 — `services` collection schema in Directus (snapshot-committed); smoke-apply CI green.
- [x] Task 6 — `services` seed parity: 6 services seeded with English translations; counts match; MCP read-backs verified.
- [x] Task 7 — `services` port flipped to Directus (hybrid adapter); `/`, `/services`, `/services/[id]` render live-Directus; test suite green (96 files · 975 tests).
- [x] Task 2b — D4–D12 locked; Q5 revised; Q8–Q12 resolved; revised task list (Tasks 8–15) documented in plan.md; site code untouched.
- [ ] Task 8 — yesid.dev-cms re-init with minimal `package.json` (`@directus/sdk` + `zod` + `bun-types`); `scripts/seed-directus-services.ts` migrated from yesid.dev to yesid.dev-cms/`scripts/seed-services.ts`; rotation policy documented; cross-repo contract test scaffold in yesid.dev.
- [ ] Task 9 — asset migration: all ~30+ `static/images/*` uploaded to Directus + R2 via SDK; folders created per content type; saved presets (`hero-1200`, `card-600`, `thumb-240`, `og-1200`) defined; `assets-id-map.json` committed; representative `/assets/:id?key=hero-1200` returns WebP with correct dimensions.
- [ ] Task 10 — `projects` schema + seed + adapter port + flip; Content Versioning enabled; `/projects` + `/projects/[slug]` render from Directus; `services.related_projects` resolves via M2M junction.
- [ ] Task 11 — `blog_posts` schema + seed (markdown body, SVG illustrations as `directus_files`) + adapter port + flip; `/blog` + `/blog/[slug]` render from Directus; `marked.parse` pipeline unchanged.
- [ ] Task 12 — `tech_stack` + `tech_relations` + `stack_scenarios` schema + seed (per-item markdown in `body_markdown` field) + adapter port + flip; `/tech-stack` + `/tech-stack/[id]` render with graph utilities intact.
- [ ] Task 13 — `site_meta` singleton + `route_seo` collection + seed (includes routeSeoEntries) + adapter port + flip; every route's `<head>` sourced from Directus; closed-registry contract preserved.
- [ ] Task 14 — `pages` collection with M2A `blocks` + block collections (`block_hero`, `block_manifesto`, `block_proof_reel`, `block_services_grid`, `block_cta`, `block_closer`, `block_about_content`, `block_contact_content`, `block_tech_stack_page_content`, `block_blog_page_content`, `block_projects_page_content`, `block_journey_panel`) + `nav_links` + `menu_items` + `error_pages` singletons + seed + `content` port adapter impl + flip; all page routes render from Directus; block `id` surfaced to consumer for future Visual Editor integration.
- [ ] Task 15 — role/policy matrix tightened per D10 (9 capability policies on admin/human-editor/ai-editor/Public); collaborative editing env vars enabled; optional Flow-based revalidation wired or formally deferred; cross-tool peer review (Codex) green; yesid.dev `feature/slice-18` PR opened and merged; `staticAdapter` retained as dev-only fallback with Slice 19+ deletion flagged; memory files updated (`project_slice_18.md` → shipped state + `project_completed_slices.md` row).
- [ ] Every task: `bun run test` + `bun run check` + `bun run lint` green on yesid.dev.
- [ ] Every task: yesid.dev-cms schema-apply CI green (ephemeral smoke + production `workflow_dispatch` approval).

## Open questions

- **Q1.** Directus hosting → resolved as D1 (Railway Hobby).
- **Q2.** Storage adapter → resolved as D2 (Cloudflare R2 via `s3` driver).
- **Q3.** Schema provisioning → resolved as D3 (`snapshot` + `apply` YAML in Git).
- **Q4.** Does `staticAdapter` stay as a dev-only fallback or get deleted entirely? → **Keep as dev-only fallback through Slice 18 close. Delete in Slice 19+ after 2+ weeks of production-green Directus.** Rationale: safety net during cutover; removal is an independent decision that doesn't block the migration. Consumer-side: `src/lib/adapters/index.ts` re-export flips to `directusAdapter as adapter` in prod; a dev-mode fallback can be wired as a Task 4 detail if needed (likely not needed — dev traffic is the developer, who can run Directus locally).
- **Q5.** Is preview/draft content needed for blog? Does that change adapter shape? → **Confirmed deferred (Slice 19+); shape locked in D6.** Revision 2026-04-23 (Task 2b): the original phrasing mixed draft state with a `status` field. After Topic 2 research: Directus Content Versioning (v11+) supersedes the `status` approach entirely — versioning is per-item-opt-in via `?version=draft`, the public list API always returns main, and Promote is the publish verb. D5 enables versioning on all collections now (Slice 18); D6 locks the preview-route shape (`/preview/[collection]/[id]?version=draft&token=…`, per-call `PreviewContext` at adapter boundary, single `EDITOR_PREVIEW_TOKEN` env var). The implementation slice lands post-Slice-18.
- **Q6.** Locale strategy — Directus translations collection vs per-locale collection vs JSON per field. → **Approach A: native Directus Translations field type + adapter-boundary transform.** Creates a `languages` collection + `<collection>_translations` junction per collection. DirectusAdapter ships a pure function `toLocalizedString(translations, field, fallback='en') → LocalizedString` so the consumer shape is unchanged. Per-request SvelteKit pattern: fetch `fields: ['*', { translations: ['*'] }]` (all locales at once — cost trivial at our size). Falls back to `en` when requested locale is missing.
- **Q7.** Blog rich-text — Directus Block Editor vs keeping Markdown. → **Keep Markdown.** Use Directus's Markdown interface for blog-post body fields; SVG illustrations stored as `directus_files` and referenced by file ID. Adapter resolves file IDs to `{DIRECTUS_URL}/assets/{id}` URLs. Rationale: preserves `marked.parse` pipeline unchanged; keeps the BlogPost shape stable; avoids a component rewrite (Block Editor output is structured JSON, not HTML-compatible markdown). Same choice for tech-stack descriptions (currently one markdown file per item at `src/content/stack/{id}.md`; becomes a Markdown field on the `tech_stack` collection).

- **Q8.** Does Content Versioning apply to block collections inside the M2A `pages.blocks` field, or only the parent page? → **Enable on every user collection including blocks.** Rationale: editors get a uniform "draft → promote" UX per block. Block-level versioning rows land in the same `directus_versions` table; retention policy (`REVISIONS_RETENTION=90d`) cleans them on the same cadence as parent-page versions.

- **Q9.** Flow-based revalidation — land in Slice 18 or defer? → **Optional within Slice 18 (Task 15); defer if time-constrained.** Site rendering correctness doesn't depend on it — Vercel's stale-while-revalidate + manual purge covers the gap until flows land. Flow definitions live in the schema snapshot, so adding them later is a yesid.dev-cms PR + snapshot apply, not a cross-repo migration.

- **Q10.** AVIF support in `/assets/:id?format=avif` — is it real? → **Unknown from docs as of 2026-04-23.** The Directus `/docs/guides/files/transform` page lists `auto | jpg | png | webp | tiff` for `format`. AVIF may work live but isn't documented. Use WebP for Slice 18; probe a live `cms.yesid.dev/assets/<id>?format=avif` request in Slice 19+ to verify before adopting.

- **Q11.** Versions policy shape — can editors force-publish each other's drafts? → **No.** Default policy: editors CRUD own versions (`user_created _eq $CURRENT_USER`); admin-only delete/force-promote. Applies to human-editor + ai-editor roles.

- **Q12.** Block reuse strategy for blocks that appear on multiple pages (e.g., `cta` on home + services + projects)? → **Per-page copies for MVP.** Duplicate content across pages; simpler editor UX than the "pick an existing CTA" pattern. Revisit only when 3+ pages actively share 2+ blocks.

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
| 2026-04-23 | D4–D12 added (Task 2b research pass). Q5 revised; Q8–Q12 opened + resolved. Scope expands to full-migration of all 6 content types + formal two-repo decoupling. | Task 2b research via three parallel agents (Clusters A/B/C): Topics 1–10 in research.md § Task 2b findings. Owner identified mid-slice that Tasks 5–7 shipped services as a TS-mirror (hardcoded-content replacer), not a proper CMS deployment — spec now reflects CMS-native migration for remaining 5 content types (projects, blog, tech-stack, meta, site-chrome via M2A pages). | D4 (Visual Editor), D5 (Content Versioning), D6 (Preview routes — shape locked, implementation deferred), D7 (M2A pages), D8 (Flows → revalidation), D9 (Asset pipeline), D10 (Role/policy matrix), D11 (Extensions posture), D12 (Repo-separation boundary); Q5 revised; Q8–Q12 opened + resolved. |
