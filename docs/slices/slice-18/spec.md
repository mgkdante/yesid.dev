# slice-18 — Spec (Cloud content layer: Directus)

> Single-level slice (no sub-slices). Spec is mostly immutable after approval. Post-approval changes get logged in § Amendments at the bottom.

## Metadata

| Field             | Value                                                     |
|-------------------|-----------------------------------------------------------|
| Status            | draft                                                     |
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

### D1 — Directus hosting

- **Chosen:** TBD (Task 2)
- **Alternatives considered:** Directus Cloud managed · self-host on Railway · self-host on Fly.io · self-host on Render · self-host on existing infra.
- **Why this won:** TBD
- **Tradeoff:** TBD
- **Affects:** Task 3, Task 8.

### D2 — Storage adapter

- **Chosen:** TBD (Task 2)
- **Alternatives considered:** Directus local FS · Vercel Blob · S3-compatible (R2 / Backblaze / Tigris) · Cloudinary.
- **Why this won:** TBD
- **Tradeoff:** TBD
- **Affects:** Task 3, Task 4 (media URLs).

### D3 — Schema provisioning approach

- **Chosen:** TBD (Task 2)
- **Alternatives considered:** Directus Data Studio (GUI) · Directus schema-snapshot CLI · hand-rolled SQL migrations.
- **Why this won:** TBD
- **Tradeoff:** TBD
- **Affects:** Task 3, Task 6, yesid-dev-cms Git history shape.

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

- **Q1.** Directus hosting. Resolution: Task 2 → D1.
- **Q2.** Storage adapter. Resolution: Task 2 → D2.
- **Q3.** Schema provisioning. Resolution: Task 2 → D3.
- **Q4.** Does `staticAdapter` stay as a dev-only fallback or get deleted entirely? Resolution: end of Task 5.
- **Q5.** Is preview/draft content needed for blog? Does that change adapter shape? Resolution: Task 2.
- **Q6.** Locale strategy — Directus translations collection vs per-locale collection vs JSON per field. Resolution: Task 2.
- **Q7.** Blog rich-text — Directus M2A block editor vs keeping `.md` files referenced by Directus. Resolution: Task 2.

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
