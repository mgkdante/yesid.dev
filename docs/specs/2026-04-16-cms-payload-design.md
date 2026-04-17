# CMS Cloud Layer — Payload Design Spec

**Date:** 2026-04-16
**Status:** APPROVED (brainstorm complete, pending implementation plan)
**Supersedes:** Keystatic decision in `docs/roadmap/PLAN.md` Slice 18 (2026-04-10 entry)
**Owner:** Yesid O.
**Target slice:** 18 — Cloud Content Layer

---

## TL;DR

yesid.dev pivots from **Keystatic (Git-based CMS)** to **Payload 3 (Postgres-backed, open-source, Node-native CMS)**. yesid.dev itself fully migrates: blog posts, tech stack items, projects, services, site meta, and page content all live in Payload.

**Two repos, not a monorepo:**

- **`yesid.dev`** — the SvelteKit site. Stays as-is structurally. Public showcase / open-source artifact. Consumers see SvelteKit at the top level, not backend scaffolding.
- **`yesid.dev-cms`** — the Payload CMS (admin UI + REST/GraphQL API + Postgres schema). **Framework-agnostic Payload starter** that plugs into SvelteKit, Next.js, Astro, Nuxt, or any REST client. Becomes a standalone product with per-framework integration recipes.

Database is **Neon Postgres** (free tier, scale-to-zero, DB branching). Media storage is **Vercel Blob**. Both repos deploy to Vercel independently. The setup doubles as the **client-offering template** — the "WordPress flexibility without WordPress, but modern" pitch.

---

## Context & Motivation

### Why not Keystatic (the previous plan)

Keystatic is excellent for developer-authored content, but three properties make it the wrong fit for the client-offering goal:

1. **GitHub auth requirement.** Non-technical clients (small biz owners, agencies' end users) would need to create GitHub accounts and authorize a GitHub App just to edit their own website. This is friction that's fine for a blog author but lethal for a paying client.
2. **No dynamic queries.** Content is files. Relationships are string references. Queries like "projects where tag = X and status = published ordered by date desc" require build-time processing, not runtime.
3. **No path to teams/roles/auth/client logins.** Future slices — client dashboards, e-commerce, form submission storage, open-source project docs with comments — cannot be built on a file-based CMS.

Keystatic stays in the toolkit as a possible **"Static" budget tier** for clients with pure-content sites and one editor. It is not the primary offering.

### Why Payload

- **MIT-licensed, Node-native, TypeScript-first.** No vendor lock-in. Self-hostable forever. Schema is TypeScript config objects, not a DSL.
- **Real admin UI for non-tech clients.** Email/password login, role-based permissions, draft/publish workflow, live preview, media library, versioning — all built in.
- **Dynamic API.** REST + GraphQL + a Local API (direct DB calls with type safety). SvelteKit consumes whichever fits.
- **Relational data.** Runs on Postgres (via Drizzle) — real joins, proper relationships, not string-ref hacks.
- **Template story.** `yesid.dev-cms` ships as a framework-agnostic Payload starter with per-framework integration recipes (SvelteKit first, Next.js/Astro/Nuxt next). Sells as "WordPress flexibility without WordPress, but modern."
- **Brand fit.** "Digital Infrastructure" — you own the stack, composable, portable, no SaaS dependency.

### Why not Sanity / Supabase / others

| Option | Why not |
|--------|---------|
| **Sanity** | Great editor UX but SaaS-only, vendor cloud, per-seat/API pricing. Kept as escape hatch for rare clients who explicitly want managed SaaS and will pay for it. |
| **Supabase** | Supabase's headline features (Auth, Storage, RLS) duplicate what Payload already provides. Pays for bundled features you won't use. Makes sense only if you skip Payload. |
| **Directus** | Viable spiritual alternative (Vue admin, Postgres-first), but smaller ecosystem, less "WordPress-replacement" pitch than Payload. Worth revisiting only if Payload-specific pain shows up. |
| **PocketBase** | Svelte-native admin (nice alignment with stack), single Go binary, very "infrastructure-honest." Rejected because schema flexibility is weaker than Payload — nested blocks/arrays/relationships matter for the rich content models yesid.dev needs. |
| **Custom Svelte admin** | Maximum craft, multi-slice project, defeats the "template for clients" goal. Not now. |
| **Strapi / KeystoneJS / Ghost / Statamic** | Individually fine, but none beat Payload on all four of: MIT + Node + TypeScript schema + modern admin. |

The React admin is not an issue: Payload schemas are pure TypeScript configs, the SvelteKit app stays 100% Svelte, and clients see a web UI without caring what framework renders it. Admin customization (branding, custom field components) is deferred — it's future-you's problem, not day-one's.

---

## Architecture

### High-level topology

```
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  Repo: yesid.dev             │          │  Repo: yesid.dev-cms         │
│  (SvelteKit 2 + Svelte 5)    │          │  (Payload 3 + Next.js)       │
│                              │          │                              │
│  Public showcase.            │          │  Framework-agnostic CMS      │
│  Consumes content via        │          │  starter. Admin UI + REST +  │
│  REST/GraphQL.               │          │  GraphQL. Writes to DB.      │
│                              │          │                              │
│  src/lib/services/*.ts       │          │  collections/                │
│    ← Slice 17b seam          │          │  globals/                    │
│                              │          │  access/                     │
│                              │          │  payload.config.ts           │
└──────────────┬───────────────┘          └──────────────┬───────────────┘
               │                                         │
               │ Vercel deploy                           │ Vercel deploy
               ▼                                         ▼
      ┌─────────────────┐                       ┌─────────────────┐
      │ yesid.dev       │                       │ cms.yesid.dev   │
      │ (static + ISR)  │   HTTPS (REST/GQL)    │ (admin + API)   │
      │                 │ ◄───────────────────► │                 │
      │                 │   webhook on publish  │                 │
      └─────────────────┘                       └────────┬────────┘
                                                         │
                                             writes      │
                                                         ▼
                                              ┌────────────────────────┐
                                              │   Neon Postgres        │
                                              │   (content database)   │
                                              │   + DB branches / PRs  │
                                              └────────────────────────┘
                                                         ▲
                                                         │ media metadata
                                              ┌────────────────────────┐
                                              │   Vercel Blob          │
                                              │   (images, uploads)    │
                                              └────────────────────────┘

Type sync:
   yesid.dev-cms  ──► payload-types.ts generated on schema change
                  ──► GitHub Action pushes to yesid.dev/src/lib/cms-types.ts
                  ──► SvelteKit imports for API response typing
```

### Why each piece

| Layer | Choice | Why |
|-------|--------|-----|
| **CMS runtime** | Payload 3 (Next.js admin) | MIT, Node, TypeScript schemas, real admin UI |
| **Frontend runtime** | SvelteKit 2 (unchanged) | Existing investment, brand identity built on it |
| **Repo split** | Two repos (`yesid.dev`, `yesid.dev-cms`) | Frontend repo stays clean for showcase / open-source; CMS repo ships as framework-agnostic starter |
| **Database** | Neon Postgres (free tier) | Serverless, scale-to-zero, DB branching, zero vendor lock-in, already familiar |
| **Media storage** | Vercel Blob | Zero config, native Vercel integration, adapter built into Payload |
| **Hosting** | Vercel (both repos, separate projects) | Fastest path to production; Payload 3 runs on Vercel serverless |
| **Rendering strategy** | SvelteKit ISR + Payload webhook revalidation | Fresh on publish, fast on reads, low DB load |
| **Type sync** | Payload `generate:types` → GitHub Action → commit to frontend repo | No monorepo tax; types stay in sync with every CMS schema change |
| **Local dev DB** | Docker Postgres OR Neon branch per dev | Both supported; Neon branch is simpler once cloud is set up |
| **Local dev workflow** | Two terminals (or `concurrently` root task with both repos cloned as siblings) | Small friction vs. monorepo `bun run dev`; acceptable for the showcase win |

### Data access pattern (post-migration)

```
SvelteKit route loader
        │
        ▼
src/lib/services/*.service.ts  ← Slice 17b seam
        │
        │ fetch (Zod-validated at the boundary)
        ▼
Payload REST API (or GraphQL) @ cms.yesid.dev
        │
        ▼
Neon Postgres
```

Because the CMS is in a separate repo/deployment, the frontend cannot import Payload's Local API — it consumes REST/GraphQL exclusively. That's fine: it's the standard pattern, it matches the "framework-agnostic CMS" story perfectly, and ISR caching means DB load stays low.

The Slice 17b service layer is what makes this possible: `getAllProjects()` / `getPostBySlug()` / `getServices()` don't change signature. Only the implementation behind them swaps from reading `.ts` data files to calling `cms.yesid.dev/api/...`. Routes, components, tests — all untouched.

### Rendering strategy

- **Default: ISR** (Incremental Static Regeneration) on all content-driven routes. Vercel caches pages at the edge. Payload fires a webhook on publish → SvelteKit revalidates the affected paths. Result: first hit is a cached HTML response (~50ms), second hit after publish is fresh.
- **Exception: draft preview routes.** When editing in Payload, "Preview" navigates to `/preview/[collection]/[slug]?token=...` which bypasses cache and fetches from Payload directly (draft content).
- **Fallback: build-time static** for routes that almost never change (home page marketing copy) — acceptable if full rebuilds are cheap.

---

## Content Model (Payload Collections)

Direct mapping from current TypeScript data files to Payload collections. Localization handled via Payload's built-in `localized: true` flag on text fields (maps cleanly to the existing `LocalizedString` pattern — `en` required, `fr`/`es` optional).

| Collection | Maps from | Key fields | Notes |
|------------|-----------|------------|-------|
| `projects` | `src/lib/data/projects.ts` | `slug`, `title` (loc), `oneLiner` (loc), `description` (loc), `stack` (relationship → `tech-stack`), `tags`, `services` (relationship), `sections` (blocks), `status`, `featured`, `repoUrl`, `liveUrl` | `slug` is non-localized unique key |
| `services` | `src/lib/data/services.ts` | `id`, `title` (loc), `description` (loc), `station`, `icon` (upload), `relatedProjects` (relationship), `detailSections` (blocks) | Station auto-orders by array index (derived, not stored) |
| `blog-posts` | `src/content/blog/*.md` | `slug`, `title` (loc), `date`, `excerpt` (loc), `category`, `tags`, `lang`, `body` (Lexical rich text or Markdoc) | Body stored as Lexical JSON (Payload default) — renderer converts to HTML in SvelteKit |
| `tech-stack` | `src/content/stack/*.md` | `id`, `name`, `layer`, `domains`, `connectsTo`, `proficiency`, `icon`, `whatItIs` (loc), `whyIUseIt` (loc), `inPractice` (loc) | Shared vocabulary — other collections reference by id |
| `stack-scenarios` | `src/lib/data/stack-scenarios.ts` | `id`, `domains`, `techs` (relationship), `summary` (loc) | Used by Build Your Stack configurator |
| `site-meta` | `src/lib/data/meta.ts` | `name`, `tagline` (loc), `description` (loc), `links` | **Global** (single doc), not a collection |
| `home-content` | `src/lib/data/content.ts` (home sections) | hero copy, manifesto copy, CTA copy | **Global** — one editable doc |
| `about-content` | `src/lib/data/about-page.ts` | bio, metrics, methodology, testimonials | **Global** — one editable doc |
| `contact-content` | `src/lib/data/contact-page.ts` | info terminal copy, form copy, web3forms key | **Global** |
| `nav-links` | `src/lib/data/nav.ts` | ordered array of label + href | **Global** |
| `error-pages` | `src/lib/data/error-pages.ts` | 404 copy, station messaging | **Global** |

**Relationships (bidirectional where useful):**

- `projects.services` ↔ `services.relatedProjects`
- `projects.stack` → `tech-stack` (one-way)
- `services.stack` → `tech-stack` (one-way)
- `blog-posts.tags` → free-text for now, may become a `tags` collection in a later slice
- `stack-scenarios.techs` → `tech-stack`

**Users collection:** Payload's built-in `users` collection — Yesid as admin, future clients get scoped collaborator roles later.

---

## Migration Strategy

Migration happens **inside Slice 18**, not as a prerequisite. `yesid.dev` repo stays structurally as-is — the SvelteKit layout doesn't change. A new `yesid.dev-cms` repo is created alongside. Order of attack:

1. **Create `yesid.dev-cms` repo.** New GitHub repo, scaffold Payload 3 + Next.js, configure for Neon Postgres, Vercel Blob adapter, email auth.
2. **Define collections + globals** (TypeScript config objects, all schemas at once so relationships can be set up correctly).
3. **Deploy CMS to Vercel** at `cms.yesid.dev` subdomain (separate Vercel project, linked to `yesid.dev-cms`). Set env vars for Neon + Blob.
4. **Seed script** — node script in `yesid.dev-cms` reads existing TS data files and markdown from `yesid.dev` (via a git submodule reference, temporary symlink, or a one-off copy of the data files) and writes to Payload via the Local API. Idempotent. One-time use but kept in repo as reference and as the "import from other sources" recipe for clients.
5. **Set up type sync** — add a GitHub Action in `yesid.dev-cms` that runs `payload generate:types` on schema change and opens a PR in `yesid.dev` updating `src/lib/cms-types.ts`.
6. **Service layer swap** (in `yesid.dev`) — flip implementations in `src/lib/services/*.service.ts` one at a time, one service per commit, test suite green between each swap. Order: site-meta → nav-links → home-content → about-content → contact-content → blog-posts → projects → services → tech-stack → stack-scenarios. Each service calls the Payload REST API; Zod schemas from Slice 17c validate the response shape.
7. **Preview + revalidation** — wire a Payload publish hook in `yesid.dev-cms` that POSTs to `yesid.dev/api/revalidate?tag=...&secret=...`. Wire `/preview/[collection]/[slug]?token=...` in `yesid.dev` that bypasses cache and requests draft content from Payload using the token.
8. **Delete TS data files** in `yesid.dev` only after every route loads from the CMS and every test passes against the new source.

**Rollback path at every step:** Services can hold both implementations behind a feature flag; if something breaks, the old `.ts`-backed function is one import swap away. Full rollback = revert the commit. Because the repos are independent, a bad CMS deploy doesn't take the frontend down — `yesid.dev` keeps serving its ISR cache.

---

## Client Offering Strategy

`yesid.dev-cms` is the core product. It's a **framework-agnostic Payload starter** — Postgres-backed, Vercel-ready, pre-configured with email auth, media uploads, localization, and a sensible base schema. A client gets it paired with their framework of choice.

**The offering is two pieces:**

1. **`yesid.dev-cms` starter template.** Clone, rename, configure Neon + Blob, deploy. Client has a working CMS at `cms.[their-domain].com` in a day. Same repo whether the client uses SvelteKit, Next.js, Astro, or anything else.
2. **Framework integration recipe.** Per-framework recipe (SvelteKit is the first and dogfooded on yesid.dev itself; Next.js is the obvious second; Astro/Nuxt follow if demand appears). Each recipe shows: how to fetch from Payload's REST API, how to set up ISR/revalidation, how to wire the preview route, how to handle drafts and localized content.

**Why this positioning is stronger than a single monorepo template:**

- Clients with an existing Next.js codebase can adopt the CMS without rewriting. They just point their fetch calls at the new Payload deployment.
- Agencies / freelancers that favor frameworks other than yours can still use your starter. Bigger addressable market.
- The CMS is a reusable asset you maintain once and offer many times.
- Your public case study is "I built yesid.dev on my own starter" — proof of the product, not just a template you made.

**Positioning:** "WordPress flexibility without WordPress, but modern. Bring your own framework."

**Per-client setup workflow:**

1. Fork / clone `yesid.dev-cms`, rebrand if needed.
2. Spin up a fresh Neon project + Vercel Blob store.
3. Deploy CMS to Vercel at `cms.[client-domain]`.
4. Add/extend collections for client-specific content needs.
5. Hand the client the admin URL. Train them.
6. Wire their frontend (their framework, their repo) using the relevant integration recipe.

**Two-tier pricing possibility (post-launch):**

| Tier | CMS | Target client |
|------|-----|---------------|
| **Static** (budget) | Keystatic web UI (in the frontend repo) | Single-editor portfolio / marketing site, no dynamic features |
| **Dynamic** (default) | `yesid.dev-cms` Payload starter | Teams, client logins, e-commerce, open-source project docs, anything with real CMS needs |

**Do not build the Static tier template now.** Ship the Payload starter, document the SvelteKit recipe, use it for yesid.dev, then for a real paying client. Only add the Keystatic tier if budget-tier demand actually appears. Maintaining two starters dilutes focus.

---

## Cost Model

### yesid.dev (day one)

- **Neon Postgres free tier:** 191.9 compute-hours/month, 0.5 GB storage. Realistic usage ~55–65 hrs/month (admin edits + ISR-cached reads). No bill.
- **Vercel Blob free tier:** 1 GB storage, 10 GB bandwidth. Comfortable for a portfolio.
- **Vercel hosting:** Hobby plan covers both projects.
- **Total:** **$0/month.**

### Scaling triggers

- Neon past ~150 compute-hrs sustained → $19/mo Launch plan (still cheap).
- Media library grows past 1 GB → add paid Blob tier or migrate to R2.
- Client project with real traffic → move the CMS to Railway/Hetzner for persistent compute (better admin UX, cron jobs, long-running uploads) without touching SvelteKit.

### Guardrails against bill shock

- Do not add a payment method to Neon or Vercel until consciously upgrading.
- Avoid long-lived DB connections from SvelteKit — use Neon's HTTP/serverless driver so compute can scale to zero.
- No per-minute cron pings. Schedule cron jobs hourly+ or use Vercel Cron with edge caching.
- Clean up DB branches when PRs merge.

---

## Dependencies & Slice Position

- **Depends on Slice 16** (E2E + QA) — tests the pre-migration state so regressions are detectable.
- **Depends on Slice 17b** (service layer) — Payload plugs into that seam. Without it, every route loader would change.
- **Depends on Slice 17c** (Zod schemas) — validates Payload API responses at the service-layer boundary. Malformed CMS data gets caught before it reaches components.
- **Does NOT depend on Slice 14** (Stack Builder Logic) — but Slice 14 inherits the Payload-backed tech stack content for free.

---

## Open Questions / Deferred Decisions

These are tracked but not blockers for the implementation plan:

1. **Admin branding** — Payload admin is React/Next. At some point, brand it to match yesid.dev (dark theme, orange accent, custom logo). Defer to a polish sub-slice after v1.
2. **Draft preview UX** — Payload supports live preview in an iframe. Wire during 18, but polish (resize controls, device frames) is deferred.
3. **Backups** — Neon ships point-in-time restore on free tier. At client scale, add a weekly logical-dump to R2 as belt-and-suspenders.
4. **Multi-tenancy** — for client sites, the default is one Payload instance per client (clean isolation). Multi-tenant Payload (one instance, many clients) is a Phase C+ consideration, not day one.
5. **Rich text format** — Lexical (Payload default, richer) vs Markdoc/MD (simpler, portable). Lean Lexical for yesid.dev blog (better editor UX); revisit if portability becomes urgent.
6. **i18n strategy with Payload** — Payload's localization is row-level (one row per locale per doc). Maps cleanly to the existing `LocalizedString` TS shape. Finalize exact adapter in the implementation plan.
7. **Search** — Payload has no built-in fulltext search. Current blog search is client-side. Likely stays client-side for v1; revisit with Typesense/Meilisearch if blog grows past ~100 posts.

---

## Acceptance Criteria (for Slice 18)

- [ ] `yesid.dev-cms` repo exists, scaffolded with Payload 3 + Next.js.
- [ ] Payload admin reachable at `cms.yesid.dev/admin`, auth working.
- [ ] All content collections + globals defined with Payload localization enabled.
- [ ] Seed script imports all existing content (projects, services, blog posts, tech stack, globals) without data loss.
- [ ] Type-sync GitHub Action: `yesid.dev-cms` schema change → generated types → PR in `yesid.dev` updating `src/lib/cms-types.ts`.
- [ ] Every service in `src/lib/services/*.service.ts` reads from the Payload REST API, not TS files. Zod validates responses.
- [ ] Every existing route renders identically to pre-migration (verified by Slice 16 E2E suite).
- [ ] Payload publish hook → POSTs to `yesid.dev/api/revalidate` with a shared secret; SvelteKit ISR revalidates affected paths end-to-end.
- [ ] `/preview/[collection]/[slug]?token=...` in `yesid.dev` renders draft content from Payload for logged-in editors.
- [ ] Vercel deployment green for both repos.
- [ ] Neon DB branch auto-created for every `yesid.dev-cms` PR; destroyed on merge.
- [ ] Full Neon + Vercel Blob free-tier budget — no overage.
- [ ] `docs/reference/ARCHITECTURE.md` updated with the two-repo topology.
- [ ] `docs/reference/PATTERNS.md` updated with Payload conventions (collection naming, relationship patterns, access control defaults, REST fetch + Zod parse pattern at the service boundary).
- [ ] `yesid.dev-cms` README includes a "Using with SvelteKit" integration recipe section.
- [ ] Old TS data files deleted from `yesid.dev`; no references remain.

---

## Out of Scope for Slice 18

- Admin theming / custom field components (polish sub-slice later).
- Multi-tenant Payload (one instance per client is the day-one rule).
- Fulltext search upgrade (stays client-side for blog).
- Analytics on admin usage.
- Client billing / onboarding automation for the template offering.
- Keystatic "Static tier" template (build only if client demand appears).
- Moving Payload to Railway / Hetzner (reversible later, Vercel is fine for v1).
- Next.js / Astro / Nuxt integration recipes (only SvelteKit recipe ships in Slice 18; other framework recipes are written on demand for paying clients or as separate marketing content).

---

## Design Decisions Log (this spec)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Payload over Keystatic | Non-tech clients + dynamic queries + roles/auth + client login path + template fit |
| 2 | Sanity as escape hatch only | Payload covers the common case; Sanity for rare clients who want managed SaaS |
| 3 | Full migration of yesid.dev (not hybrid) | Dogfood honesty — "I use this every day" is the strongest template pitch |
| 4 | Two repos (`yesid.dev` + `yesid.dev-cms`) — not monorepo | Keeps `yesid.dev` clean for public showcase and open-sourcing; reframes `yesid.dev-cms` as a standalone framework-agnostic starter (bigger product surface than a tied-together monorepo) |
| 4b | `yesid.dev-cms` ships as framework-agnostic Payload starter | Per-framework integration recipes (SvelteKit first, others on demand) — bigger addressable market than a single SvelteKit-locked template |
| 5 | Vercel for both repos (day one) | Fastest path to production; move CMS to Railway/Hetzner only when triggered |
| 6 | Neon Postgres | Serverless scale-to-zero, DB branching aligns with Vercel previews, zero vendor lock-in |
| 7 | Vercel Blob for media | Zero-config, native Vercel integration |
| 8 | React admin is acceptable | Schemas are TS config; Svelte stays pure on the frontend; clients don't see framework |
| 9 | Payload REST API exclusively from the frontend | Two-repo split means no Local API across boundaries; REST is the universal pattern and matches the framework-agnostic positioning. Zod validates at the service boundary. |
| 10 | ISR + webhook revalidation as default rendering | Fresh on publish, fast on reads, low DB load |

---

## Next Steps

1. User reviews this spec.
2. On approval, invoke `superpowers:writing-plans` to produce the Slice 18 implementation plan at `docs/plans/2026-04-NN-slice-18-cms-payload-plan.md`.
3. Implementation begins only after Slice 16 (E2E + QA) closes.

---

**References:**

- Payload docs: https://payloadcms.com/docs
- Neon docs: https://neon.tech/docs
- Vercel Blob: https://vercel.com/docs/storage/vercel-blob
- Turborepo: https://turbo.build/repo/docs
- Service layer seam: `docs/roadmap/standardization.md` (Slice 17b)
