# Slice 18 — Cloud Content Layer: Directus (pivoted from Payload 2026-04-22)

**Level 1 direction doc.**

**Status:** in progress — 18a + 18b shipped on Payload (now historical); pivoted to Directus 2026-04-22; remaining sub-slices 18c–18g rewritten below to execute the Directus migration.
**Depends on:** 16, 17, `slice-headless-cms-best-practices` (research + decision slice)
**Est. Sessions:** 5–8 for the Directus rebuild (scorched earth + migration + cutover)

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-16 | Payload over Keystatic (original Slice 18 plan) | Pre-migration design spec |
| 2026-04-21 | Shipped 18a (CMS infra) + 18b (content model + seed) on Payload 3.83.0 | Live at cms.yesid.dev |
| **2026-04-22** | **PIVOTED to Directus 11+** | Research slice `slice-headless-cms-best-practices` produced decision brief. Key factors: Directus's mobile/iPad admin, official SvelteKit tutorials (7 vs Payload's archived community starter), SvelteKit-native live preview, Directus MCP GA (native v11.13), commercial trajectory (independent VC-funded vs Figma-acquired with Cloud paused), editor UX 23/25 vs 14/25, "procurement over scratch" values alignment, design-locked so Payload's blocks advantage moot near-term. Yesid slept on the decision brief + returned committed. |

## Decision

**Directus 11+** — same yesid.dev-cms repository, scorched-earth rebuild. MIT core + BSL (only bites above $5M ARR, irrelevant for Yesid's freelance scale). Self-host on Railway / Hetzner / Directus Cloud (choice deferred to `slice-directus-research`).

## Two repos

Unchanged from pre-pivot architecture:
- `yesid.dev` — the SvelteKit site. Stays structurally as-is.
- `yesid.dev-cms` — SAME REPO, Payload code scorched, rebuilt as Directus. Deploys at `cms.yesid.dev`.

## Architecture (post-pivot)

```
Repo: yesid.dev                    Repo: yesid.dev-cms
(SvelteKit — public showcase)      (Directus 11+ — CMS)
         │                                    │
         │ Vercel                             │ Railway / Hetzner / Directus Cloud (TBD)
         ▼                                    ▼
    yesid.dev                         cms.yesid.dev
         │       REST (+ GraphQL + SDK)       │
         │ ◄───────────────────────────────►  │
         │       Directus Flow: publish webhook → revalidate
         └─────────────┐           ┌──────────┘
                       ▼           ▼
                  Neon Postgres (SAME DB; reuse or rebuild — TBD slice-directus-research)
                  Vercel Blob or Cloudflare R2 or Directus Files (TBD)
                  Resend (SAME API key, SAME sender domain)

AI-agent integration: Directus native MCP (v11.12+, all tiers) replaces Payload's plugin.
```

## Content model (under Directus)

Same conceptual model as Payload 18b; re-expressed in Directus's primitives:

| Concept | Payload 18b shape | Directus shape |
|---------|-------------------|----------------|
| projects, services, blog-posts, tech-stack, stack-scenarios | 5 Collections | 5 Collections |
| media | Collection with `upload: true` | Files (native Directus file collection) |
| home-content, services-page, projects-page, blog-page, tech-stack-page, about-content, contact-content (7 page-globals) | 7 Globals w/ flat fields | **7 singletons** (pattern: collection w/ single-row + role UI hiding) — OR **converted to a `pages` collection with slug-keyed entries** per Q3 resolution. Decision in `slice-directus-research`. |
| nav-links, error-pages, site-meta (3 true singletons) | 3 Globals | 3 Directus singletons |
| i18n field-level (en/fr/es) | `localized: true` | Directus Translations interface (`_translations` junction tables) |

**Schema migration:** re-express in Directus; 73 rows migrate via export-import; `_translations` reshape multiplies row count ~3× (en/fr/es × localized-field-count).

## Admin Information Architecture

Simpler than Payload's AV under Directus's better-by-default admin:
- **Pages** (singletons or `pages` collection depending on Q3 final decision in `slice-directus-research`)
- **Content** collections: projects, services, blog-posts, tech-stack, stack-scenarios
- **Files** (native)
- **Settings**: nav-links, error-pages, site-meta (singletons), users, roles

Display templates (`{{title}} — {{slug}}`) configured per collection. Folders group collections in sidebar. Activity feed + global search + revisions are default-on.

## Sub-slices (post-pivot)

| # | Name | Status | Notes |
|---|------|--------|-------|
| 18a | CMS Infrastructure Foundation (Payload) | ✅ shipped 2026-04-21 — **HISTORICAL** | PR #29. Superseded by pivot — code scorched in slice 18d. |
| 18b | Content Model + Seed (Payload) | ✅ shipped 2026-04-21 — **HISTORICAL** | PR #30. 73 rows become migration source in slice 18e. |
| **18c** | **Directus Research + Rebuild Spec** (new slice: `slice-directus-research`) | planned — NEXT | Comprehensive research into Directus architecture + yesid.dev-cms repo audit + migration strategy + hosting decision (Railway / Hetzner / Cloud) + new FORMULA for Directus + storage choice (Vercel Blob vs R2 vs Directus Files) + schema approach (DB introspect vs fresh rebuild in same Neon). **Docs-only**; sandbox experiments allowed on `slice-cms-ux-redesign` branch; no main-branch code changes. |
| **18d** | **Scorched-Earth Rebuild** | planned | Scorch Payload code from yesid.dev-cms (delete collections/*.ts + globals/*.ts + payload.config.ts + migrations/ + seed scripts); scaffold Directus (Dockerfile + env + schema config); rebuild schema in Directus Data Studio or via CLI; install required extensions; deploy to staging URL for verification. |
| **18e** | **Content Migration** | planned | Export 73 rows from the Payload production DB (via Local API or direct DB query); transform to Directus NDJSON import format; i18n reshape (Payload `localized` → Directus Translations pattern); import via Directus CLI (`npx directus schema apply` + import tool); media re-link (URL rewrites or re-upload); verify round-trip. |
| **18f** | **Frontend Rewire on yesid.dev** | planned | Replace `@payloadcms/*` clients with `@directus/sdk` across `src/lib/services/*.service.ts`; rewrite ~40-60% of Slice 17c Zod schemas to match Directus response shapes (esp. translations + M2A); update type-gen pipeline (`directus-sdk-typegen`); wire Directus Flow → SvelteKit `revalidateTag` for ISR; update preview route; update form actions via Directus Flows. |
| **18g** | **DNS Cutover + Parallel-Run + Payload Sunset** | planned | Add `cms-legacy.yesid.dev` DNS CNAME pointing to Vercel Payload (escrow); flip `cms.yesid.dev` to new Directus host; monitor 24h; keep Payload on legacy subdomain 2 weeks; integrity tests; rollback plan documented; at end of escrow archive Payload code to `payload-archive` branch + delete legacy DNS record + delete Vercel Payload deployment. Codex peer review per convention. |

Original 18g (VOCAB labels) and 18h (SVG palette picker) are **deferred** — they were design-detail polish items; "design is locked for now" per Yesid's 2026-04-22 direction. Revisit post-launch.

## Migration order (inside this slice, post-pivot)

1. Close `slice-headless-cms-best-practices` with the pivot decision (done).
2. Open `slice-directus-research` (new sub-slice 18c). Produce the research + plan.
3. Execute 18d scorched-earth rebuild.
4. Execute 18e content migration.
5. Execute 18f frontend rewire.
6. Execute 18g DNS cutover + parallel-run + Payload sunset.

**Rollback at every step:** Payload stays live on `cms-legacy.yesid.dev` during 18g's 2-week escrow; DNS flip is reversible at DNS TTL. Frontend stays on the old Payload service layer until 18f lands; per-service feature flagging optional.

## DNS records inventory

Consolidated in `docs/slices/slice-headless-cms-best-practices/research.md` § DNS & Infrastructure Migration Inventory. Summary:

- **Update:** `cms.yesid.dev` A/CNAME → new Directus host (host TBD in 18c).
- **Keep:** Resend DKIM + SPF TXT records on `cms.yesid.dev` (domain-scoped, not host-scoped; same sender domain).
- **Add:** `cms-legacy.yesid.dev` CNAME → Vercel Payload (escrow, temporary).
- **Remove:** `cms-legacy.yesid.dev` after 2-week escrow closes.

## Cost model (post-pivot)

**Day one Directus:** $0-20/mo on self-host (Hetzner VPS ~€5/mo + Neon free tier), or $15/mo Directus Cloud Standard. Either comparable to Payload's self-host cost. **Payload Cloud is paused — the forced-self-host is the same on both platforms now.**

## Guardrails against surprise bills

- Neon Postgres free tier still fits (0.5 GB, 191.9 compute-hrs).
- Vercel Blob free tier (1 GB) or Cloudflare R2 free tier (10 GB) for media.
- Directus Cloud Standard $15/mo is predictable per-seat pricing (no usage surprise).
- Monitor in 18g: egress, DB rows, seat count.

## Rendering strategy

Unchanged from pre-pivot:
- **Default:** ISR — Vercel caches pages at edge; Directus Flow webhooks `revalidateTag` on publish.
- **Exception:** `/preview/[collection]/[slug]?token=...` bypasses cache for drafts; Directus Live Preview wires via `@directus/visual-editing`.
- **Fallback:** build-time static for rarely-changing routes.

## Acceptance criteria (post-pivot)

- `yesid.dev-cms` repo scorched of Payload code + rebuilt as Directus 11+, deployed to `cms.yesid.dev`.
- All collections + globals (or pages collection) defined with Directus Translations.
- 73 rows migrated from Payload DB to Directus without data loss.
- Every service in `yesid.dev/src/lib/services/*.service.ts` reads from Directus SDK (Zod-validated), not TS files.
- Slice 16 E2E suite green — every existing route renders identically to pre-migration.
- Directus Flow → `yesid.dev/api/revalidate` webhook end-to-end.
- Preview route serves draft content for logged-in editors via `@directus/visual-editing`.
- DNS cutover complete; `cms-legacy.yesid.dev` escrow holds 2 weeks; Payload archived after.
- Directus MCP configured + Claude Code `mcp__yesid-cms-prod__*` tools re-pointed at new endpoint.
- Resend email still sends from `no-reply@cms.yesid.dev` via Directus email adapter.
- Full free/low-tier budget — no overage vs pre-pivot.
- `docs/reference/ARCHITECTURE.md` updated with Directus topology; `docs/reference/PATTERNS.md` updated with Directus SDK + Zod service pattern.
- `yesid.dev-cms` README rewritten as Directus starter recipe (per `slice-directus-research`'s FORMULA).
- Old Payload TS data files already deleted; no lingering references.

## Out of scope

- Block-based page builder work (deferred — design locked per Yesid's 2026-04-22 direction).
- Keystatic "Static tier" template.
- Multi-tenant Directus.
- Migrating off Neon Postgres.
- Rebuilding the MCP plugin concept (Directus native covers it).

## You'll learn

Directus 11+ architecture (Data Studio, collections, singletons, M2A relations, Translations, Flows, Insights, MCP), Directus extension ecosystem, scorched-earth repo migration pattern, Payload → Directus content migration via export-import, Zod-at-the-boundary pattern under a new CMS shape, DNS cutover with escrow window, Directus deployment on Railway / Hetzner / Directus Cloud, editor UX calibration for small-business clients.
