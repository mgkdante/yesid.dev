# Slice 18 — Cloud Content Layer: Payload (own repo) + Neon

**Level 1 direction doc.**

**Status:** planned
**Depends on:** 16, 17
**Est. Sessions:** 5–7
**Design spec:** pre-migration spec lived at `docs/specs/2026-04-16-cms-payload-design.md` — now in `<cloud>/yesid.dev/docs/archive/legacy-flat/specs/2026-04-16-cms-payload-design.md` (authoritative — read first when slice starts)
**Supersedes:** previous Keystatic plan for this slice (Decisions Log 2026-04-16)

## Decision

**Payload 3** — MIT-licensed, Node-native, TypeScript-schema CMS with a real admin UI. Backed by **Neon Postgres** (free tier, scale-to-zero, DB branching). Media on **Vercel Blob**.

## Two repos, not a monorepo

- `yesid.dev` — the SvelteKit site. Stays structurally as-is (public showcase, open-source artifact).
- `yesid.dev-cms` — new repo, Payload 3 + Next.js admin + API + Postgres schema. **Framework-agnostic Payload starter** — plugs into SvelteKit, Next.js, Astro, Nuxt, or any REST client. Ships as its own reusable product with per-framework integration recipes (SvelteKit first).

Both repos deploy to Vercel independently. `yesid.dev-cms` lives at `cms.yesid.dev`. yesid.dev is the reference build; `yesid.dev-cms` is the reusable CMS product.

**Positioning:** "WordPress flexibility without WordPress, but modern. Bring your own framework."

## Why Payload over Keystatic

Full rationale in design spec. Short form:

1. Non-tech clients can use it — email/password auth, no GitHub account required, real admin UI with roles and drafts.
2. Dynamic queries, real relationships, proper joins — not just string refs between files.
3. Clear path to future features: client logins, form submissions storage, open-source project docs, e-commerce.
4. Template fit — clone one repo, get site + CMS + shared types. Keystatic could not carry that pitch.

Keystatic stays in the toolkit as a possible **"Static" budget tier** for pure-content clients with one editor. It is not the primary offering. **Do not build the Static tier template in Slice 18** — only if real client demand appears later.

## Architecture

```
Repo: yesid.dev                    Repo: yesid.dev-cms
(SvelteKit — public showcase)      (Payload 3 + Next.js — CMS starter)
         │                                    │
         │ Vercel                             │ Vercel
         ▼                                    ▼
    yesid.dev                         cms.yesid.dev
         │       REST (+ GraphQL)             │
         │ ◄───────────────────────────────►  │
         │       webhook on publish           │
         └─────────────┐           ┌──────────┘
                       ▼           ▼
                  Neon Postgres (content DB, branches per PR)
                  Vercel Blob    (media)

Type sync: payload generate:types → GitHub Action → PR in yesid.dev updating
           src/lib/cms-types.ts (no monorepo tax, types stay in sync).
```

## Content model — Payload collections / globals

| Type | Maps from | Notes |
|------|-----------|-------|
| `projects` (collection) | `src/lib/data/projects.ts` | slug, title (loc), sections (blocks), services + stack (relationships) |
| `services` (collection) | `src/lib/data/services.ts` | id, title (loc), relatedProjects (relationship), detailSections (blocks) |
| `blog-posts` (collection) | `src/content/blog/*.md` | body as Lexical rich text; rendered to HTML in SvelteKit |
| `tech-stack` (collection) | `src/content/stack/*.md` | shared vocabulary — referenced by projects + services + scenarios |
| `stack-scenarios` (collection) | `src/lib/data/stack-scenarios.ts` | for Build Your Stack configurator |
| `site-meta` (global) | `src/lib/data/meta.ts` | single editable doc |
| `home-content` (global) | `src/lib/data/content.ts` (home sections) | single editable doc |
| `about-content` (global) | `src/lib/data/about-page.ts` | single editable doc |
| `contact-content` (global) | `src/lib/data/contact-page.ts` | single editable doc |
| `nav-links` (global) | `src/lib/data/nav.ts` | single editable doc |
| `error-pages` (global) | `src/lib/data/error-pages.ts` | single editable doc |

Localization uses Payload's built-in `localized: true` flag on text fields (maps cleanly to the existing `LocalizedString` pattern — en required, fr/es optional).

## Admin Information Architecture (lands in 18b)

Payload admin sidebar is organized into three groups via `admin.group`. Within each group, order is authored order in the `collections: []` / `globals: []` arrays of `payload.config.ts`.

**PAGES** (globals — one doc each, site-walk order matching yesid.dev nav):
1. Home → 2. Services (page intro/meta) → 3. Projects (page intro/meta) → 4. Blog (page intro/meta) → 5. Tech Stack (page intro/meta) → 6. About → 7. Contact → 8. Nav Links → 9. Error Pages → 10. Site Meta

**CONTENT** (collections — lists, hub-first dependency order so referenced items exist before referring items):
1. Tech Stack (hub — referenced by services, projects, stack-scenarios) → 2. Services (referenced by projects) → 3. Projects → 4. Blog Posts → 5. Stack Scenarios

**SYSTEM:** Users, Media.

**Rationale:** pages follow site-walk because editors think route-by-route; collections follow dependency order because creating a project that references a non-existent tech forces a round-trip. Relationship topology: `projects.{services,stack}` → services/tech-stack; `services.stack` → tech-stack; `stack-scenarios.techs` → tech-stack. Tech-stack is the deepest-referenced leaf — edit first.

## Sub-slices

Slice 18 ships in 6 PR-sized sub-slices. Total ~5–7 sessions. Each sub-slice bundle (spec/plan/log/handoff) lives at `docs/slices/slice-18/slice-18<letter>/`. Only 18a is specced in detail so far (2026-04-20); 18b–18f have scope-level blurbs below and will be specced at their own planning sessions when upstream dependencies land.

| # | Name | Size | Depends on | Owns migration-order steps | Status |
|---|------|------|------------|----------------------------|--------|
| 18a | CMS Infrastructure Foundation | L (1–2 sessions) | Slice 16, 17c ✓ | 1, 3 | **✅ shipped 2026-04-21** |
| 18b | Content Model + Seed | L (1–2 sessions) | 18a | 2, 4 | planned |
| 18c | Type Sync + First Service Swap (site-meta) | M (1 session) | 18b | 5, 6 (site-meta only) | planned |
| 18d | Globals Swap | M (1 session) | 18c | 6 (nav, home, about, contact, errors) | planned |
| 18e | Collections Swap | L (1–2 sessions) | 18d | 6 (blog, projects, services, tech-stack, stack-scenarios) | planned |
| 18f | Preview + Webhook + Cleanup | M (1 session) | 18e | 7, 8 | planned |

**18a — CMS Infrastructure Foundation** (specced 2026-04-20 — see `slice-18a/spec.md` + `slice-18a/plan.md`). Stands up `yesid.dev-cms` repo, Payload 3 + Next.js, Neon Postgres via Vercel Marketplace integration, Vercel Blob, Resend. Deploys to `cms.yesid.dev`. Only a `users` auth collection + `site-meta` heartbeat global. Zero `yesid.dev` source changes. Proves the stack end-to-end before any data moves.

**18b — Content Model + Seed.** Defines every collection (`projects`, `services`, `blog-posts`, `tech-stack`, `stack-scenarios`, `media`) + every global (`home-content`, `about-content`, `contact-content`, `nav-links`, `error-pages`; extends `site-meta` beyond 18a heartbeat). Localization enabled on all `localized: true` text fields per LocalizedString pattern. Relationships wired bidirectionally where useful (`projects.services` ↔ `services.relatedProjects`). Admin IA (see above) applied via `admin.group`. Seed script imports existing TS/MD data from `yesid.dev` via Payload Local API; idempotent, kept in repo as the "import from other sources" recipe for future clients.

**18c — Type Sync + First Service Swap.** GitHub Action in `yesid.dev-cms`: schema change → `payload generate:types` → opens PR in `yesid.dev` updating `src/lib/cms-types.ts`. Canonical REST fetch utility (`src/lib/cms/fetch.ts`) + Zod-validated response parsing at the service-layer boundary (17c pattern extended). First service swap: `site-meta`. Feature-flagged, both static and Payload implementations live, tests green between swap. Establishes the pattern 18d/18e follow.

**18d — Globals Swap.** Flip remaining globals (`nav-links`, `home-content`, `about-content`, `contact-content`, `error-pages`) off static files onto Payload REST, one global per commit. Each extends 18c's fetch + Zod pattern. Per-service feature flag. Tests green between swaps. Rollback per swap = one revert.

**18e — Collections Swap.** Flip dynamic collections (`blog-posts`, `projects`, `services`, `tech-stack`, `stack-scenarios`), one collection per commit. Same pattern as 18d. ISR caching decisions land here — each SvelteKit route wires revalidation tags that 18f's webhook will target. Heaviest sub-slice due to volume + relationship resolution + richer response shapes.

**18f — Preview + Webhook + Cleanup.** Payload publish hook → POSTs to `yesid.dev/api/revalidate?tag=...&secret=...`. Preview route `/preview/[collection]/[slug]?token=...` bypasses cache for draft content. **Delete** every `src/lib/content/*.ts` and `src/content/blog/*.md` file from `yesid.dev` — content lives only in Payload after this step. Update `ARCHITECTURE.md` with final state. Write `yesid.dev-cms/README.md` "Using with SvelteKit" integration recipe (framework-agnostic positioning per design spec).

## Migration order (inside this slice, not a prerequisite)

1. Create `yesid.dev-cms` repo. Scaffold Payload 3 + Next.js with Neon Postgres + Vercel Blob adapters, email auth.
2. Define all collections + globals with Payload localization enabled (maps 1:1 to existing LocalizedString).
3. Deploy CMS to Vercel at `cms.yesid.dev` subdomain.
4. Seed script in `yesid.dev-cms` imports existing TS/MD data from `yesid.dev` via Local API. Idempotent, kept in repo as the "import from other sources" recipe for clients.
5. Set up type-sync GitHub Action: CMS schema change → `payload generate:types` → opens PR in `yesid.dev` updating `src/lib/cms-types.ts`.
6. Service layer swap (from Slice 17b in `yesid.dev`) — flip implementations one service at a time, one commit each, tests green between every swap. Each service calls Payload REST API; Zod schemas (Slice 17c) validate response shape. Order: site-meta → nav-links → home-content → about-content → contact-content → blog-posts → projects → services → tech-stack → stack-scenarios.
7. Wire Payload publish hook → POST to `yesid.dev/api/revalidate` with shared secret. Wire `/preview/[collection]/[slug]?token=...` in `yesid.dev` for draft content.
8. Delete old TS data files in `yesid.dev` only after every route loads from the CMS and tests pass.

**Rollback at every step:** services hold both implementations behind a feature flag during the swap; full rollback is one revert. Because the repos are independent, a bad CMS deploy doesn't take the frontend down — `yesid.dev` keeps serving its ISR cache.

## Cost model

**yesid.dev, day one:** $0/month. Neon free tier (191.9 compute-hrs/mo, 0.5 GB) is more than enough; Vercel Blob free tier (1 GB, 10 GB bandwidth) fits a portfolio. Do not attach a payment method to Neon until consciously upgrading — free plan is hard-capped, not soft-capped.

## Guardrails against surprise bills

- Use Neon's HTTP/serverless driver from SvelteKit (short-lived connections, compute scales to zero).
- No per-minute cron pings; hourly+ or Vercel Cron with edge caching.
- Clean up DB branches when PRs merge.

## Rendering strategy

- **Default:** ISR — Vercel caches pages at the edge; Payload webhook triggers revalidation on publish.
- **Exception:** `/preview/[collection]/[slug]?token=...` bypasses cache for draft content (logged-in editors only).
- **Fallback:** build-time static for routes that almost never change.

## Acceptance criteria

- `yesid.dev-cms` repo scaffolded with Payload 3 + Next.js, deployed to Vercel at `cms.yesid.dev`.
- All collections + globals defined with Payload localization enabled.
- Seed script imports all existing content without data loss.
- Type-sync GitHub Action wired: CMS schema change → PR in `yesid.dev` updating `src/lib/cms-types.ts`.
- Every service in `src/lib/services/*.service.ts` reads from Payload REST API (Zod-validated), not TS files.
- Slice 16 E2E suite green — every existing route renders identically to pre-migration.
- Payload publish hook → `yesid.dev/api/revalidate` end-to-end.
- Preview route serves draft content for logged-in editors.
- Both Vercel deployments green; Neon DB branch auto-created per CMS PR.
- Full free-tier budget — no overage.
- `docs/reference/ARCHITECTURE.md` updated with two-repo topology; `docs/reference/PATTERNS.md` updated with Payload REST + Zod service pattern.
- `yesid.dev-cms` README includes a "Using with SvelteKit" integration recipe.
- Old TS data files deleted from `yesid.dev`; no lingering references.

## Out of scope

- Admin theming / custom field components (polish sub-slice later).
- Keystatic "Static tier" template (build only if client demand appears).
- Multi-tenant Payload (one instance per client is the day-one rule).
- Moving Payload to Railway/Hetzner (reversible later; Vercel is fine for v1).
- Fulltext search upgrade — blog search stays client-side.

## You'll learn

Payload 3 collections/globals/blocks, framework-agnostic CMS architecture (REST API + Zod at the frontend boundary), cross-repo type-sync via GitHub Actions, Neon Postgres + DB branching, Vercel Blob for media, ISR revalidation via webhooks, preview/draft flows, service-layer seam migration under test coverage.
