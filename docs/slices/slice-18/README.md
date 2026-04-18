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
