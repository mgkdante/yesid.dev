# slice-18 — Research Notes

> Findings accumulate here as Tasks 2+ progress. The authoritative background record is `docs/slices/slice-headless-cms-best-practices/` (PR #31). This file captures slice-specific research downstream of that slice — **in particular Task 2 resolves spec D1/D2/D3 and Q4–Q7**.

## Primary reference

- **[../slice-headless-cms-best-practices/decision-brief.md](../slice-headless-cms-best-practices/decision-brief.md)** — pivot rationale, FORMULA, 12-heuristic scoring. Read first.
- **[../slice-headless-cms-best-practices/research.md](../slice-headless-cms-best-practices/research.md)** — 22-item deep research bundle. Skim § SvelteKit integration + § Directus deep-dive before Task 2.

## Task 2 findings (session: 2026-04-22)

Sourced via four parallel research passes: (A) in-repo adapter-contract mapping; (B) Directus core docs via official docs.directus.io (live fetch 2026-04-22); (C) hosting + storage via vendor pricing pages (live fetch 2026-04-22); (D) research-slice grounding re-read.

**One revision to the research slice:** the decision-brief stated Directus has a first-party Vercel Blob adapter. Live fetch of `https://directus.io/docs/configuration/files` confirmed `STORAGE_LOCATIONS` only ships drivers for `local`, `s3`, `gcs`, `azure`, `cloudinary`, `supabase`. **No `vercel-blob` driver exists.** This revision downgrades Vercel Blob from candidate to non-starter for D2 (§ Storage options).

---

### Adapter contract mapping

yesid.dev's `ContentAdapter` is defined at [src/lib/adapters/types.ts](../../../src/lib/adapters/types.ts). Six ports, every method async, collections return `readonly T[]`, not-found returns `undefined` — except `meta.forRoute` which throws (closed route registry). Validation lives at the adapter boundary via a `parsePort(portName, schema, data)` helper wrapping Zod schema parses.

**Ports and method counts:**

| Port | Methods | Schemas | Notes |
|------|--------:|---------|-------|
| `projects` | 8 | ProjectSchema | Includes cross-reference utilities (`byService`, `allTags`, `allStackItems`, `serviceIdsForProjects`) |
| `services` | 4 | ServiceSchema | `adjacent` returns `{ prev?, next? }` for metro-stop navigation |
| `blog` | 12 | BlogPostSchema + BlogAnimationSchema | Includes file-system helpers (`html`, `svgContent`, `svgContentsForPosts`, `resolveSvgFallbackName`, `resolveAnimation`) |
| `meta` | 2 | SiteMetaSchema + PageSeoSchema | `forRoute(routeId, locale, params?)` — THROWS on unknown route (closed registry) |
| `techStack` | 12 | TechStackItemSchema + TechRelationSchema + StackScenarioSchema | Includes graph utilities (`connections`, `incomingConnections`, `outgoingRelations`, `incomingRelations`) + `content(id)` returning raw markdown from `src/content/stack/{id}.md` |
| `content` | 19 | JourneyPanel/NavLink/MenuItem/MetroBookends/ErrorPageContent/AboutContent/ContactContent/TechStackPageContent/HeroData | 10 site-chrome literals are `typeof import(...)`-typed (spec D2 non-goal to validate) — bypass Zod |

**Contract summary (full matrix in `static.ts`):** every validated port uses `parsePort` at the seam; utility ports that return strings (`html`, `svgContent`, `content`) return raw content with no schema, falling back to `''` when missing. The `content` port's 19 methods are a mix of schema-validated (e.g., `skillsJourneyPanels`, `navLinks`, `menuItems`, `aboutPage`, `contactPage`) and site-chrome literals bound to `typeof import('$lib/content/site-content')` — site chrome is tight-coupled to the TS source for zero drift.

**LocalizedString shape (ubiquitous):**

```ts
// src/lib/types — LocalizedString definition
type LocalizedString = {
  en: string;   // required, non-empty after trim
  fr?: string;  // optional, backfilled over time
  es?: string;  // optional
};
```

Used on every public-facing string: `Project.title`, `Service.description`, `BlogPost.title`, `SiteMeta.tagline`, `PageSeo.title/description`, `StackScenario.summary`, and all `content.*` schema-validated fields. Plain strings only for non-localizable data (slugs, IDs, URLs, dates, enum tags).

**Directus content-model sketch (target):**

| Directus collection | Type | Source of truth today | i18n |
|---|---|---|---|
| `site_meta` | singleton | `src/lib/content/meta.ts` | Translations field on localized fields (tagline, description, owner.jobTitle) |
| `site_settings` | singleton | `src/lib/content/meta.ts` (subsets) | — |
| `nav_links` | singleton (array-of-objects field) | `src/lib/content/nav.ts` | Translations on `label` |
| `menu_items` | singleton | `src/lib/content/nav.ts` | Translations on `title`, `subtitle` |
| `error_pages` | singleton | `src/lib/content/nav.ts` | Translations on `label`, `heading`, `suggestions` |
| `services` | collection | `src/lib/content/services.ts` | Translations on `title`, `description`, `subtitle`, `longDescription`, `valueProposition`, `deliverables[]`, `benefitHeadline`, `impactMetric` |
| `projects` | collection | `src/lib/content/projects.ts` | Translations on `title`, `oneLiner`, `description`, `sections[].title`, `sections[].content`, `impactMetric.label` |
| `blog_posts` | collection | `src/content/blog/**/*.md` frontmatter + body | Translations on `title`, `excerpt` + per-post `lang` enum |
| `tech_stack` | collection | `src/lib/content/tech-stack.ts` + `src/content/stack/{id}.md` | English-only identifiers; description in Markdown field (can add Translations later) |
| `tech_relations` | collection | derived today | Store `connectsTo` + `connectionNotes` as M2M with context field |
| `stack_scenarios` | collection | `src/lib/content/tech-stack.ts` | Translations on `summary` |
| `pages` (home/about/contact/tech-stack/services/projects/blog landing) | collection + M2A `blocks` | `src/lib/content/*-page.ts` + `site-content.ts` | Translations at block level, not on the page record |
| `route_seo` | collection, `route_id` unique | `src/lib/content/meta.ts` `routeSeoEntries` | Translations on `title`, `description`, `og_image.alt` |

**Decisions flowing from this:**
- Site-chrome literals (hero/manifesto/cta/closer blocks) move to `pages` with M2A `blocks` pattern — D3 research recommends this (research slice Q3 already locked 7 page-globals → `pages` collection).
- `meta.forRoute` → Directus `route_seo` collection with route_id lookup. Keep closed-registry contract: adapter still throws on unknown route (DirectusAdapter rejects on empty result rather than returning undefined).
- Markdown bodies (blog + tech_stack) stay as Markdown fields (Directus Markdown interface, not Block Editor) — preserves `marked.parse` pipeline, avoids consumer shape change.
- SVG illustrations + image assets: stored as `directus_files`, referenced by file ID; adapter resolves to `{DIRECTUS_URL}/assets/{id}`.

**Open contract-level questions for Task 3+:**
- Route-SEO fallback strategy: keep the current throw-on-unknown contract (bug-catching) or add a default seed row? → keep throw.
- Blog SVG custom-vs-fallback map: move the fallback selection logic server-side (Directus Flow computes + stores) or keep deterministic client-side hash? → keep client-side (deterministic, cheaper, DB-free).
- `techStack.content(id)` returns raw markdown; leave it as markdown or pre-render? → markdown (consumer component uses `marked`).

**Source:** [src/lib/adapters/types.ts](../../../src/lib/adapters/types.ts), [src/lib/adapters/static.ts](../../../src/lib/adapters/static.ts), all of [src/lib/content/](../../../src/lib/content/).

---

### Hosting options

Live fetch of Directus Cloud + Railway + Fly.io + Render + DigitalOcean + Hetzner pricing pages on 2026-04-22.

| Platform | Smallest viable | BYO Neon? | Custom domain | Auto-TLS | Scale-to-zero | Ops burden | Monthly floor |
|---|---|---|---|---|---|---|---|
| **Railway Hobby** | $5/mo + $5 credit | ✅ | ✅ (2 domains) | ✅ | ❌ | Low (git-push, managed) | **$5** |
| **Fly.io PAYG** | ~$3.32/mo shared-cpu-1x 512MB | ✅ | ✅ | ✅ | ✅ | Medium | $3–6 |
| **Hetzner CX22 (EU)** | €3.99/mo | ✅ | ✅ (manual Caddy) | Manual | ❌ | **High** (DIY) | $4–5 |
| **Render Starter** | $7/mo (512MB, 0.5 vCPU) | ✅ | ✅ | ✅ | ❌ | Low | $7 |
| **DO App Platform Basic** | $5/mo (512MiB) | ✅ | ✅ | ✅ | ❌ | Low | $5 |
| **Directus Cloud Starter** | $15/mo | ❌ (shared) | Partial | Managed | — | Zero | $15 |
| **Vercel** | — | — | — | — | — | — | **Non-starter** |

**Why Vercel is out:** Directus is a long-running Node process with persistent filesystem, background jobs, and (since v11.15) WebSockets for collaborative editing. Vercel's Serverless Functions have 10s (Hobby) / 300s (Pro, updated per 2026 knowledge update) limits and no filesystem persistence. Vercel's own KB recommends hosting Directus elsewhere (source: https://vercel.com/kb/guide/using-a-headless-cms-with-vercel, fetched 2026-04-22).

**Why not Directus Cloud Starter ($15/mo):** plan uses shared Directus-controlled Postgres, so we cannot reuse our Neon instance (breaks plan constraint "Neon Postgres preserved"). Custom-domain support is "partial" on Starter + Professional (full only on Enterprise). 3× the Railway price.

**Recommendation: Railway Hobby ($5/mo).**
- Official Directus CMS template (https://railway.com/deploy/directus-cms, fetched 2026-04-22) — one-click provisions Directus + Postgres + Redis + S3-compatible storage; swap Postgres `DB_*` env to our Neon URL.
- BYO Neon ✅ preserves plan constraint.
- Auto-TLS on 2 custom domains ✅ preserves `cms.yesid.dev` + DKIM/SPF.
- Git-push deploys, logs, env management, managed backups.
- Predictable cost: $5/mo minimum + $5 included credit = real cost ≈ $0 overage at our traffic profile.

**Runner-up: Fly.io ($3–6/mo) with scale-to-zero.**
- Cheaper if scale-to-zero matters (low traffic → pay only when active). New accounts are PAYG only (legacy free tier closed Oct 2024).
- Acceptable ops overhead. No Directus-authored one-click template.

**Hetzner CX22 is cheapest on paper** but the ops burden (DIY Caddy/Traefik for TLS, manual OS patching, reverse-proxy config) costs operator hours that a solo operator can't spare — mis-aligned with profile. Locked out.

**Source:** https://railway.com/pricing · https://fly.io/docs/about/pricing/ · https://render.com/pricing · https://www.digitalocean.com/pricing · https://www.hetzner.com/cloud · https://directus.io/pricing/cloud (all fetched 2026-04-22).

---

### Storage options

Live fetch of storage-provider pricing on 2026-04-22.

Directus's storage layer uses driver plugins configured via `STORAGE_LOCATIONS=<name>` + `STORAGE_<NAME>_DRIVER=<type>` + provider-specific env. Drivers that ship with `@directus/api` by default: `local`, `s3`, `gcs`, `azure`, `cloudinary`, `supabase` (source: https://directus.io/docs/configuration/files, fetched 2026-04-22).

**No Vercel Blob driver exists.** This revises the research slice's earlier statement. R2 / Backblaze / Tigris all use the generic `s3` driver with `STORAGE_S3_ENDPOINT` pointed at their S3-compatible URL.

| Option | Storage $/GB/mo | Egress to internet | Free tier | Directus driver |
|---|---|---|---|---|
| **Cloudflare R2** | $0.015 | **$0 (free)** | 10 GB + 1M Class A ops + 10M Class B ops | `s3` (built-in) |
| **Backblaze B2** | $0.006 | Free 3× stored (or free via Cloudflare CDN); then $0.01/GB | 10 GB | `s3` (built-in) |
| **Tigris** | $0.02 | **$0 (free)** | 5 GB | `s3` (built-in) |
| **Supabase Storage** | $0.021 (Pro) | Metered | 1 GB + 5 GB egress (Free) | `supabase` (built-in) |
| **AWS S3 Standard** | $0.023 | $0.09/GB (after 100 GB first-year free) | Time-limited | `s3` (built-in) |
| **Vercel Blob** | $0.023 (after 5 GB Hobby) | $0.05/GB (after 100 GB Hobby) | 5 GB storage + 100 GB transfer on Hobby | **None (would require custom driver)** |
| **Cloudinary** | Credit-based | Via CDN | 25 credits/mo | `cloudinary` (built-in) |

**Recommendation: Cloudflare R2 via the built-in `s3` driver.**
- **$0 egress** is the single biggest cost lever when the Vercel frontend serves most images — every R2→Vercel-edge fetch is free, every S3→Vercel-edge fetch is $0.05–0.09/GB.
- 10 GB + 1M ops free forever covers yesid.dev's asset mix (est. 200–800 MB in year 1).
- Uses built-in `s3` driver — zero custom-code or extension maintenance burden.
- S3-compatible → portability (swap to B2 later via env-var change).

**Config sketch:**
```
STORAGE_LOCATIONS=s3
STORAGE_S3_DRIVER=s3
STORAGE_S3_KEY=<R2_access_key>
STORAGE_S3_SECRET=<R2_secret_key>
STORAGE_S3_BUCKET=yesid-dev-cms
STORAGE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_S3_REGION=auto
```

**Runner-up: Backblaze B2** if storage grows past 10 GB — cheaper at scale ($6/TB vs R2 $15/TB) and still $0 egress when paired with Cloudflare CDN.

**Vercel Blob is ruled out** (no Directus driver; custom-driver maintenance fails the `feedback_prefer_platform_builtins` rule).

**Source:** https://developers.cloudflare.com/r2/pricing/ · https://www.backblaze.com/cloud-storage/pricing · https://www.tigrisdata.com/pricing/ · https://aws.amazon.com/s3/pricing/ · https://vercel.com/docs/vercel-blob/usage-and-pricing · https://directus.io/docs/configuration/files (all fetched 2026-04-22).

---

### Schema provisioning approach

Directus ships three paths for moving schema between environments (source: https://directus.io/docs/configuration/migrations and https://directus.io/docs/tutorials/migration/promoting-changes-between-environments-in-directus, fetched 2026-04-22).

1. **`directus schema snapshot` + `directus schema apply`** — snapshot writes a human-readable YAML of every collection, field, relation, role, permission, preset, translation, and flow. Apply is idempotent; produces a dry-run diff via SDK `schemaDiff(snapshot)`.
2. **Data Studio (GUI)** — fast for prototyping, zero audit trail, unreviewable.
3. **Custom SQL migrations** — Knex migration files in `./migrations/`. Use only when schema API can't express something (triggers, materialized views). Higher maintenance.

**Recommendation: `snapshot.yaml` committed to git, applied in CI.**
- Review-ability: PR diffs are readable.
- Reproducibility: ephemeral CI instance rebuilds from the file for every deploy.
- Drift detection: `schemaDiff` surfaces un-committed schema changes.
- Flows + roles + permissions included in the snapshot (v11+).

**Seed data: custom TypeScript script.** Directus has no `directus seed` command. yesid.dev reuses its typed `src/lib/content/*.ts` modules as the source of truth — a `scripts/seed.ts` in `yesid.dev-cms` authenticates with an admin token and calls SDK `createItems(...)` idempotently (check-exists or upsert-by-slug). 73-row baseline from Payload era is dead; we rebuild from yesid.dev's canonical TS/MD files.

**CI shape (Task 3 will formalize):**
```yaml
on: [push to main, PR to main]
jobs:
  schema:
    - spin ephemeral Directus (docker compose)
    - directus bootstrap
    - directus schema apply ./infra/directus/snapshot.yaml
    - bun scripts/seed.ts (idempotent)
    - smoke: curl GET /items/projects?limit=1
```

**Gotcha:** `schema apply` is destructive on field removals — Task 3 must add a confirmation gate or require a manual approval step.

---

### Locale strategy

Directus's native **Translations field type** (not to be confused with the ISO `translations` collection which is a layout artifact) creates, on creation, three things automatically:
1. A shared `languages` collection with `code` / `name` / `direction` columns.
2. A `<collection>_translations` junction with `<collection>_id`, `languages_code`, and your per-locale fields.
3. An alias field on the parent collection that exposes the translations as a nested array.

Source: https://directus.io/docs/configuration/translations (fetched 2026-04-22).

**Three approaches for yesid.dev's `LocalizedString = { en, fr?, es? }`:**

| Approach | Admin UX | Adapter transform | Storage shape |
|---|---|---|---|
| **A. Translations field (normalized)** | Best — per-locale side-by-side in Data Studio, field-level validation, per-locale permissions | Required: `toLocalizedString(translations, field, fallback='en')` at adapter boundary | Junction-table rows; 3× row count but indexed |
| B. JSON field with locale-keyed object | Raw JSON textarea — poor authoring UX | None (shape matches 1:1) | One JSON column per field |
| C. One collection per locale (`projects_en` etc.) | Catastrophic duplication; no referential integrity | None | N collections |

**Recommendation: Approach A** (native Translations) + pure adapter transform.

Adapter transform sketch (lives in `src/lib/adapters/directus.ts`, Task 4):

```ts
function toLocalizedString(
  translations: Array<{ languages_code: string; [key: string]: unknown }>,
  field: string,
  fallback: Locale = 'en'
): LocalizedString {
  const byLocale = new Map(translations.map(t => [t.languages_code, t[field] as string]));
  return {
    en: (byLocale.get('en') ?? byLocale.get(fallback) ?? '') as string,
    fr: byLocale.get('fr') as string | undefined,
    es: byLocale.get('es') as string | undefined,
  };
}
```

SvelteKit per-request fetch pattern (source: https://directus.io/docs/tutorials/getting-started/implement-multilingual-content-with-directus-and-svelte-kit, fetched 2026-04-22):

```ts
await directus.request(readItems('projects', {
  fields: ['*', { translations: ['*'] }],
  // Optionally narrow per-page: deep: { translations: { _filter: { languages_code: { _eq: 'fr' } } } }
}));
```

yesid.dev fetches ALL translations at once (only 3 locales; cost is trivial) and lets the adapter's `toLocalizedString` compose the response. Consumer components unchanged.

---

### Seed migration path

yesid.dev is unusual: the prior CMS (Payload) never fed the site, so there is no production data to migrate. The `staticAdapter` continues to read from `src/lib/content/*.ts` and `src/content/blog/**/*.md` throughout the migration. The Directus seed IS those TypeScript + Markdown files.

**Plan (Task 6):**
1. Write `scripts/seed.ts` in `yesid.dev-cms` that:
   - Reads from `../yesid.dev/src/lib/content/*.ts` (sibling repo path) or a published NPM package shipping the content modules.
   - Reads blog posts from `../yesid.dev/src/content/blog/**/*.md` (frontmatter + body).
   - For each record, upserts into Directus via SDK `createItem` / `updateItem` with a natural-key match (slug for projects/blog, id for services/tech-stack).
   - For each `LocalizedString` field, splits into per-locale translation rows.
   - Uploads media assets (blog illustrations, project hero images, service icons) to R2 via Directus `uploadFiles`, then links the returned file ID into the record.
2. Run once to seed, then Data Studio becomes the source of truth.
3. Keep `scripts/seed.ts` as an idempotent backfill tool (safe to re-run — upserts).

**Source-of-truth transition:** after Task 6 completes, yesid.dev's `src/lib/content/*.ts` modules become frozen reference (read-only; no more edits land there). Content edits go to Directus UI from Task 5 onward.

---

### Built-in features vs custom extensions (feedback_prefer_platform_builtins audit)

Inventory against Directus 11.17.3 built-ins as of 2026-04-22:

| Need | Directus built-in | Custom extension required? |
|---|---|---|
| Localized text fields | Translations field | No |
| Role + permission matrix | Native permissions (role → collection → policy) | No |
| Media storage | `s3` driver → R2 | No |
| Markdown authoring | Markdown interface | No |
| Rich text / blocks | Block Editor interface (v11+) — NOT used for yesid.dev blog | No |
| Flexible page composition | M2A field + block collections | No |
| Draft/preview | `status` field + Content Versioning (v11+) | No |
| On-publish cache invalidation | Flows → webhook operation → Vercel `/api/revalidate` | No |
| Scheduled content | Flows CRON trigger | No |
| Revisions / audit log | Native (on by default) | No |
| AI / MCP integration | Native MCP server (v11.13+, GA Nov 7 2025) | No |
| Schema-as-code | `directus schema snapshot` YAML + `apply` | No |
| Seed data | `scripts/seed.ts` (custom TS, not a Directus extension) | No (plain script, not a Directus extension) |
| yesid.dev adapter shape | Pure transform function at adapter seam (not a Directus extension) | No |

**No custom Directus extensions required for Slice 18.** This honors `feedback_prefer_platform_builtins.md` cleanly.

**If Task 3+ surfaces a new need**, the extension-proposal rule applies: justify in a spec D-entry amendment, weigh against a Flow or built-in first.

---

### MCP server (native GA since v11.13, Nov 7 2025)

Directus 11.13 shipped native MCP directly on the server (no separate process) — source: https://directus.io/blog/directus-v11-13-release (fetched 2026-04-22). Enabled via Data Studio → Settings → AI. Supports Claude Desktop, Claude Code, ChatGPT, Cursor, Raycast.

**Installation (once Task 3 lands Directus on `cms.yesid.dev`):**
1. Create a role `ai-editor` scoped to content collections (no `directus_users`, no `directus_settings`, no `directus_files` deletes).
2. Create a user in that role; generate a static access token.
3. Enable MCP in Data Studio.
4. Client config (Claude Code):
   ```bash
   claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/mcp \
     --header "Authorization: Bearer <AI-EDITOR-TOKEN>"
   ```
5. Every mutation from the AI inherits role permissions + lands in Directus's activity feed.

**Replaces the Payload plugin MCP cleanly.** Same integration depth, better permission model, audit-native.

---

### Recent Directus releases (Oct 2025 – Apr 2026)

Latest stable: **v11.17.3** (2026-04-15). Pin to this for Task 3's initial install; don't float on `latest`.

| Version | Date | Headline | Breaking? |
|---|---|---|---|
| v11.13.0 | 2025-11-07 | **Native MCP server GA** | Minor |
| v11.14.0 | 2025-12 | AI Assistant beta (multimodal) | — |
| v11.15.0 | 2026-02-12 | Collaborative editing + AI Assistant GA + deployment module | Minor |
| v11.16.0 | 2026-03-10 | Global draft versions on all items + multimodal AI chat + RBAC on deployments | Minor |
| v11.17.0 | 2026-03-24 | Background data import + translation collection generator | Minor |
| v11.17.3 | 2026-04-15 | User tab status filters + `/ai/object` structured-output endpoint | None |

**License note (today 2026-04-22):** Directus blog published "Evolving Our License for Long-Term Sustainability" — BSL 1.1 remains today; Directus 12 is expected to introduce revised license terms. Pinning to `11.17.3` buys a known BSL 3-year window. Monitor https://directus.io/bsl.

**Source:** https://github.com/directus/directus/releases · https://directus.io/docs/releases/changelog · https://directus.io/blog (all fetched 2026-04-22).

---

## Appending rules

- Append-only. Don't rewrite prior findings — amend with a dated note.
- Every finding carries its source (URL, Directus docs version, or commit SHA of tested config).
- Decisions flow from findings here → D-entries in `spec.md`. Don't let the spec drift from the research.

## Task 2 decisions ready to lock in spec.md

- **D1 (hosting):** Railway Hobby ($5/mo) with BYO Neon. → see spec.md § Design decisions.
- **D2 (storage):** Cloudflare R2 via built-in `s3` driver. → see spec.md § Design decisions.
- **D3 (schema provisioning):** `directus schema snapshot` + `apply` with YAML committed to git. → see spec.md § Design decisions.
- **Q4 (staticAdapter fate):** Keep as dev-only fallback through Slice 18 close; delete in Slice 19+. → see spec.md § Open questions.
- **Q5 (preview/draft):** Directus native `status` + Content Versioning + `@directus/visual-editing` package; wire preview in a follow-up slice (out of Slice 18 scope). → see spec.md § Open questions.
- **Q6 (locale strategy):** Approach A (native Translations field) + adapter-boundary `toLocalizedString` transform. → see spec.md § Open questions.
- **Q7 (blog rich-text):** Markdown (keep `marked.parse` pipeline); SVG illustrations as `directus_files` referenced by ID. → see spec.md § Open questions.

---

## Task 2b findings (session: 2026-04-23)

Sourced via three parallel research passes (Clusters A/B/C) against Directus 11.17.3 docs (live fetch 2026-04-23), Vercel/SvelteKit docs, and local browse of both sibling repos. Ten topics total, mapping the CMS-native surface yesid.dev should adopt now that services-as-proof-of-pattern has shipped.

**Scope correction captured:** Tasks 5–7 shipped services as a TS-mirror (hardcoded-content replacer pattern). The remaining 5 content types (projects, blog, tech-stack, meta, site-chrome) must land as CMS-native — using Versioning, M2A blocks, Flows, Translations, visual editing, preview tokens, asset transforms — rather than flat collections of static-adapter shape. Slice 18 scope = full migration of all 6 content types; the two repos evolve into independently-shipping domains.

**Doc-availability note:** Several Directus URLs 404'd during Cluster C agent runs — the Directus docs IA restructured post-11.13. Prefer `/docs/api/*` and `/docs/guides/*` paths over older `/docs/reference/*` and `/docs/sdk/commands/*` variants. All cited URLs below were verified live on 2026-04-23.

---

### Topic 1: @directus/visual-editing SDK

Directus ships a first-party click-to-edit overlay as `@directus/visual-editing` v2.0.0 (MIT). The GitHub repo was archived on 2026-04-22 because the code folded into the Directus monorepo; the npm package remains the canonical consumer-side integration point. The **Visual Editor Studio Module** (Settings → Visual Editor) renders the frontend URL inside an iframe; the library boots, finds every element wrapped with a `data-directus` attribute, overlays an edit button, and opens a drawer/modal/popover authored directly against the Directus item.

CSP / CORS on the Directus container is mandatory: `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC=https://yesid.dev https://*.vercel.app` + `CORS_ORIGIN=https://yesid.dev`. Field-level permission gating requires Directus ≥ 11.16 paired with library ≥ v2.0.0; non-admin users only see edit affordances for fields where their role has `update` permission.

**Consumer integration (verbatim signatures from the SvelteKit tutorial):**

```ts
// src/lib/visual-editor.ts
import { apply, setAttr, remove } from '@directus/visual-editing';
import { invalidateAll } from '$app/navigation';
import { PUBLIC_DIRECTUS_URL } from '$env/static/public';

let isApplied = false;

export async function initializeVisualEditor() {
  if (typeof window !== 'undefined' && !isApplied) {
    await apply({
      directusUrl: PUBLIC_DIRECTUS_URL,
      onSaved: async () => {
        await invalidateAll(); // re-runs load() on the current route
      }
    });
    isApplied = true;
  }
}

export { setAttr };
```

```svelte
<!-- inside a component, e.g. ManifestoBlock.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeVisualEditor, setAttr } from '$lib/visual-editor';
  export let block: { id: string; headline: string };
  onMount(initializeVisualEditor);
</script>

<h1
  data-directus={setAttr({
    collection: 'block_manifesto',
    item: block.id,
    fields: 'headline',
    mode: 'popover'
  })}
>
  {block.headline}
</h1>
```

Modes: `'popover'` (single field inline), `'modal'` (full-screen), `'drawer'` (side panel, default — best for multi-field blocks). `onSaved` callback fires after every successful save; `invalidateAll()` is the SvelteKit-idiomatic re-fetch, with `window.location.reload()` as fallback.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Render `data-directus` attrs always, or gated? | **Conditional** — gate via `$page.url.searchParams.has('edit')`. Production HTML stays clean; non-admins can't read collection/item IDs off the DOM. |
| 2 | Where does `apply()` live? | Dedicated `src/lib/visual-editor.ts` + `onMount` per opt-in component. Do NOT call from `+layout.svelte` globally — lazy-load only when edit mode is on. |
| 3 | `onSaved` strategy | `invalidateAll()` with `location.reload()` fallback. Match the Directus tutorial verbatim — don't invent a cache-bust layer. |
| 4 | Every block gets an `id` exposed to the DOM | **Yes.** Adapter must carry `id: string` through every block shape. Today's `HomeData.hero` is a plain object with no id — add during the M2A migration (Topic 4). |
| 5 | CSP / CORS config on `cms.yesid.dev` | Set `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC=https://yesid.dev https://*.vercel.app` + `CORS_ORIGIN=https://yesid.dev` before the first integration test. |

**Source:**
- https://directus.io/docs/guides/content/visual-editor (fetched 2026-04-23)
- https://directus.io/docs/guides/content/visual-editor/frontend-library (fetched 2026-04-23)
- https://directus.io/docs/guides/content/visual-editor/studio-module (fetched 2026-04-23)
- https://directus.io/docs/tutorials/getting-started/integrating-the-directus-visual-editor-with-sveltekit (fetched 2026-04-23)
- https://github.com/directus/visual-editing (fetched 2026-04-23) — archived 2026-04-22, v2.0.0 is current

---

### Topic 2: Content Versioning (v11+)

Directus Content Versioning (enabled per-collection in Settings → Data Model) lets editors create a **modifiable copy of an item without affecting the live content**. Central primitives: `main` (published, API-visible) and `draft` (reserved, global draft automatically present on every item when versioning is on, since v11.16). Additional named versions (e.g. `v2`, `winter-campaign`) can be created on demand. Each version stores only a **delta** of changed fields in `directus_versions`; the main row stays authoritative until a **Promote** operation copies the delta fields into it. **Compare** returns a field-by-field diff; `/versions/:id/save` persists ongoing edits into the version delta.

**Public API filter semantics — critical finding:** The standard `/items/{collection}` endpoint *always* returns the main version. The `?version=draft` parameter is **opt-in and item-scoped only** — it works on `GET /items/{collection}/{id}?version=draft` but NOT on list endpoints. There is no "status=draft silently hides rows" behavior. That means:

- Public site reads (`adapter.content.hero()`) stay anonymous and always see main.
- Preview reads (inside `/preview/...` routes) explicitly pass `version: 'draft'` + an auth token.
- **No separate `status` field is needed** unless we want a three-state publish lifecycle on top of versioning (e.g., scheduled publishing). Directus already has `/versions/:id/promote` as the publish verb; a second status field duplicates state.

**SDK shapes (confirmed):**

```ts
import { createDirectus, rest, readItem, withToken } from '@directus/sdk';

// Public read — always main
const publicRead = await directus.request(
  readItem('pages', pageId, { fields: ['*'] })
);

// Preview read — draft version, authed
const draftRead = await directus.request(
  withToken(EDITOR_TOKEN, readItem('pages', pageId, { version: 'draft', fields: ['*'] }))
);
```

Endpoint reference: `GET/POST/PATCH/DELETE /versions`, `GET /versions/{id}/compare`, `POST /versions/{id}/promote` (body `{ mainHash, fields }`), `POST /versions/{id}/save`.

**Visual Editor interaction:** the Studio Module exposes a global version picker. Setting the Collection Preview URL to `https://yesid.dev/preview/{{slug}}?version={{$version}}` causes the iframe to reload with the interpolated URL when the editor toggles between main and draft. SvelteKit's preview route reads `version=draft` from `url.searchParams` and passes it to the adapter.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Which collections get versioning? | **All 6 content types** (services, projects, blog, tech-stack, meta, site-chrome) **plus every block collection** under M2A. Author experience = "edit draft → preview → promote" uniformly. |
| 2 | Add a separate `status` field? | **No.** Version promotion is the publish verb. Add `status` only if we later need scheduled publishing. |
| 3 | Preview shows draft by default? | **Yes** — `/preview/[...]` routes request `version: 'draft'`, Directus falls back to main for items without a draft. |
| 4 | Retention of old versions | Directus retains `directus_versions` + `directus_revisions` indefinitely unless cleaned. Set `REVISIONS_RETENTION=90d` in Railway env once live. |
| 5 | Promotion UX | Editors use Directus Data Studio's native Compare → Promote. No custom UI. |

**Source:**
- https://directus.io/docs/guides/content/content-versioning (fetched 2026-04-23)
- https://directus.io/docs/api/versions (fetched 2026-04-23)
- https://directus.io/docs/guides/connect/query-parameters (fetched 2026-04-23)
- https://directus.io/docs/tutorials/workflows/combine-live-preview-and-content-versioning-with-next-js (fetched 2026-04-23)

---

### Topic 3: Preview routes (SvelteKit + signed tokens)

SvelteKit's natural preview primitive is a `+page.server.ts` `load` that runs Node-side, so Directus credentials never reach the browser. Directus does **not** issue one-shot JWTs for public preview links — the two legitimate mechanisms are (a) a **long-lived static editor token** read server-side from a URL param and validated against an env allowlist, or (b) Directus's `/shares` endpoint (role-scoped access tokens for arbitrary items). For yesid.dev's single-editor (owner-only) case, **option (a) is dramatically simpler** and matches the official SvelteKit tutorial.

**URL shape — recommendation: dedicated `/preview/*` routes, not query flags on public URLs.** Rationale: preview routes opt out of prerender/ISR without touching public routes; easier to lock behind middleware; obvious in server logs. The URL configured in Directus (Settings → Visual Editor) becomes:

```
https://yesid.dev/preview/[collection]/[id]?version={{$version}}&token={{$token}}
```

Visual Editor interpolates `{{$version}}` natively; `{{$token}}` is set once globally in Visual Editor settings against an `EDITOR_PREVIEW_TOKEN` env var on Directus.

**Integration sketch:**

```ts
// src/routes/preview/[collection]/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createDirectus, rest, readItem, withToken } from '@directus/sdk';
import type { PageServerLoad } from './$types';

export const prerender = false;
export const config = { isr: false };

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const token = url.searchParams.get('token');
  const version = url.searchParams.get('version') ?? 'draft';

  if (!token || token !== env.EDITOR_PREVIEW_TOKEN) {
    throw error(401, 'Invalid preview token');
  }

  setHeaders({ 'cache-control': 'no-store, no-cache, must-revalidate' });

  const client = createDirectus(env.DIRECTUS_URL).with(rest());
  const data = await client.request(
    withToken(token, readItem(params.collection, params.id, { version, fields: ['*'] }))
  );

  return { block: data, previewMode: true };
};
```

**Adapter boundary shape — recommendation: accept an optional `PreviewContext` per call, not at construction.** The adapter is a singleton instance shared by all requests; constructing two variants (public vs preview) doubles complexity for a per-request concern:

```ts
export interface PreviewContext {
  token: string;
  version?: string; // default 'draft'
}

export interface ContentPort {
  hero(preview?: PreviewContext): Promise<HeroBlock>;
  // ...
}
```

Public calls omit the arg; server routes pass it through. `staticAdapter` ignores it; `directusAdapter` branches to `withToken(token, readItem(..., { version }))`.

**Vercel / caching:** `export const prerender = false` + `config = { isr: false }` + `setHeaders({ 'cache-control': 'no-store' })` fully defeats both build-time prerender and Vercel edge cache on preview routes. Public routes unchanged.

**Scope note:** preview-route wiring + `@directus/visual-editing` overlay are deferred per Q5 to a follow-up slice. Slice 18 scope = parity migration; preview ships as a distinct feature slice.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | URL shape | `/preview/[collection]/[id]?version=draft&token=<T>` — dedicated route tree. |
| 2 | Token mechanism | Single `EDITOR_PREVIEW_TOKEN` env var, validated server-side against `url.searchParams`. Skip `/shares` for MVP. Rotate quarterly. |
| 3 | Adapter boundary | Per-call optional `PreviewContext`, not constructor flag. |
| 4 | Cache strategy | `prerender = false` + `cache-control: no-store` on preview routes; public routes unchanged. |
| 5 | Server-only enforcement | All Directus credentials via `$env/dynamic/private`. Preview routes live in `+page.server.ts` exclusively — no `+page.ts`. |

**Source:**
- https://directus.io/docs/tutorials/getting-started/implementing-live-preview-in-sveltekit (fetched 2026-04-23)
- https://directus.io/docs/tutorials/workflows/combine-live-preview-and-content-versioning-with-next-js (fetched 2026-04-23)
- https://directus.io/docs/guides/connect/sdk (fetched 2026-04-23)
- https://directus.io/docs/guides/connect/query-parameters (fetched 2026-04-23)
- https://kit.svelte.dev/docs/server-only-modules

---

### Topic 4: M2A (Many-to-Any) blocks for flexible page composition

Directus Many-to-Any ("Builder") fields are the CMS-native analogue of yesid.dev's current "singleton page orchestrates typed block literals" pattern in `site-content.ts`. An M2A field is configured by (1) creating a **parent collection** (e.g. `pages`), (2) adding a field of type `M2A` / `Builder`, (3) picking the **allowed related collections** (`block_hero`, `block_manifesto`, `block_proof_reel`, `block_services_grid`, `block_cta`, `block_closer`), and (4) optionally a `sort` field for drag-reorder. Directus auto-generates a hidden junction collection (`<parent>_<field>`) with `id`, `<parent>_id`, `collection` (discriminator), `item` (FK), `sort`.

**Querying M2A with the SDK (confirmed — collection-keyed `item` shape):**

```ts
const home = await directus.request(
  readItems('pages', {
    filter: { slug: { _eq: 'home' } },
    fields: [
      'id', 'slug', 'title',
      {
        blocks: [
          'id', 'collection', 'sort',
          {
            item: {
              block_hero:          ['*', { translations: ['*'] }],
              block_manifesto:     ['*', { translations: ['*'] }],
              block_proof_reel:    ['*', { items: ['*'] }],
              block_services_grid: ['*'],
              block_cta:           ['*', { translations: ['*'] }],
              block_closer:        ['*']
            }
          }
        ]
      }
    ],
    limit: 1
  })
);
```

The `item:` key inside `blocks[...]` is a **collection-keyed object** — Directus hydrates each junction row's `item` with fields appropriate to its `collection` discriminator. Response: `blocks` is `Array<{ id, collection, sort, item: BlockHero | BlockManifesto | ... }>`.

**Translations compose naturally** — each block collection gets its own `translations` O2M, composed via nested `fields` + `deep._filter` on `languages_code`. Recommendation: build a `buildBlocksQuery(locale)` helper in `directusAdapter` that composes it once.

**Adapter shape — recommendation: flatten at the adapter, preserve the existing `ContentPort` interface.** The current `ContentPort` exposes `hero()`, `manifesto()`, `proofReel()`, etc. as independent methods. If we change to `homePageData(): Promise<{ blocks: Block[] }>`, every `+page.svelte` must be rewritten. Instead, the adapter's Directus impl issues **one M2A query per page load**, then maps blocks into each existing port method:

```ts
async function loadHomeBlocks(locale: Locale) {
  const page = await client.request(readItems('pages', { filter: { slug: { _eq: 'home' } }, fields: [...], limit: 1 }));
  const byCollection = new Map<string, unknown>();
  for (const row of page[0].blocks) byCollection.set(row.collection, row.item);
  return byCollection;
}

export const directusAdapter = {
  content: {
    async hero(preview?: PreviewContext) {
      const blocks = await loadHomeBlocks('en'); // memoized per-request
      return blocks.get('block_hero') as HeroBlock;
    },
    async manifesto(preview?: PreviewContext) {
      const blocks = await loadHomeBlocks('en');
      return blocks.get('block_manifesto') as ManifestoBlock;
    },
    // ...
  }
};
```

Memoize `loadHomeBlocks` per-request (SvelteKit `event.locals` or a `RequestEvent`-scoped weakmap) so all 8 port calls on one page share one Directus round-trip. **Zero consumer change.**

**Block reuse across pages** — the `cta` block lives on home, services, and projects pages. Two patterns:
1. **Per-page copies** — each page collection has its own `blocks` M2A; a "CTA" is authored three times. Editors-friendly, no accidental cross-page edits, duplicated content.
2. **Reusable catalog** — `block_cta` is a standalone collection; pages reference entries by M2O. Single source of truth, clunkier author UX.

**Recommendation: pattern 1 (per-page copies) for MVP.** yesid.dev's pages are bespoke; duplication is low. Revisit only when 3+ pages actively share 2+ blocks.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | M2A or flat singletons? | **M2A.** Even without reorder, editors gain drag-reorder + add/remove + future pages drop in without schema work. |
| 2 | Reuse for shared blocks (CTA) | **Per-page copies** for MVP. |
| 3 | Adapter response shape | **Flatten at adapter.** Keep existing `ContentPort`. Memoize per-request. |
| 4 | Translations pattern | Native O2M per block, composed via nested `fields` + `deep._filter`. Helper function. |
| 5 | Block `id` on consumer side | **Required.** Every block carries `id: string` for Visual Editor `setAttr`. |
| 6 | Allowed collections on `pages.blocks` | Start with 6 (hero, manifesto, proof_reel, services_grid, cta, closer). Add as pages migrate. |

**Source:**
- https://directus.io/docs/guides/data-model/relationships (fetched 2026-04-23)
- https://directus.io/docs/tutorials/getting-started/create-reusable-blocks-with-many-to-any-relationships (fetched 2026-04-23)
- https://directus.io/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk (fetched 2026-04-23)
- https://directus.io/docs/guides/connect/query-parameters (fetched 2026-04-23)

---

### Topic 5: Flows — publish → Vercel revalidate

Directus Flows is the built-in automation engine. For the "editor publishes → purge Vercel cache" pattern, the right recipe is an **Event Hook trigger** filtered to the content collection + action `update` (and `create` for first publish), routed through a **Condition** op (`status == published` — or, given we skip `status` per Topic 2, via a Directus version-promotion event), into a **Webhook / Request URL** operation that calls Vercel's ISR bypass URL with the `x-prerender-revalidate` header.

SvelteKit's Vercel adapter exposes exactly this invalidation path via `config.isr.bypassToken` — no framework-agnostic "revalidate by tag" API; you ping the page URL directly.

**Flow spec (YAML sketch):**

```yaml
# Flow: services-publish-revalidate
trigger:
  type: event
  options:
    type: action              # non-blocking; fires AFTER commit
    scope: ["items.update"]   # also add items.create for first publish
    collections: ["services"] # one flow per collection
operations:
  - key: only_published
    type: condition
    options:
      filter:
        "$trigger.payload.status": { _eq: "published" }
  - key: revalidate
    type: request
    resolve: only_published
    options:
      method: GET
      url: "https://yesid.dev/services/{{$trigger.keys[0]}}"
      headers:
        - header: "x-prerender-revalidate"
          value: "{{$env.VERCEL_BYPASS_TOKEN}}"
```

**SvelteKit route config (recommendation):**

```ts
// src/routes/services/[slug]/+page.server.ts
import { VERCEL_BYPASS_TOKEN } from '$env/static/private';
export const config = {
  isr: { expiration: 3600, bypassToken: VERCEL_BYPASS_TOKEN }
};
```

**Key grounded facts:**

- **Five trigger types:** Event Hook, Webhook, Schedule, Another Flow, Manual. Event hooks split into **Filter (blocking/pre-commit)** and **Action (non-blocking/post-commit)**. For cache revalidation use **Action** — Vercel's response shouldn't block Directus's commit.
- **Collection-scoped filtering** on event-hook triggers; batch creates fire once per item.
- **Webhook op** supports method, URL, headers, body; retries + HMAC signing NOT first-class. Fallback: Vercel's own stale-while-revalidate ("if revalidation fails, Vercel preserves stale content with 30s TTL and retries shortly after").
- **Vercel ISR on-demand revalidation:** `GET` or `HEAD` to the cached route with `x-prerender-revalidate: <token>` (or `__prerender_bypass` cookie); token must be ≥32 chars. Global purge in ≤300ms.
- **Logs:** Directus stores flow logs in DB; docs warn to prune occasionally. Run history in Data Studio.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | One flow vs one-per-collection | **One per collection** (services, blog, projects, meta, page). Cleaner scoping + per-flow metrics. |
| 2 | URL target | **Canonical SvelteKit route** (e.g. `/services/${slug}`), not a custom `/api/revalidate`. SvelteKit + Vercel's native `bypassToken` is the idiomatic path. |
| 3 | Payload shape | **Zero body**, URL + token header. SvelteKit regenerates server-side by re-running `load()`. |
| 4 | Publish detection | Event Hook (action) on `items.update` + `items.create`, scoped to collection, Condition op `status _eq published`. |
| 5 | Secret management | `VERCEL_BYPASS_TOKEN` as Railway env var, referenced `{{$env.VERCEL_BYPASS_TOKEN}}`. Never hardcode — flows export as JSON. |
| 6 | Unpublish + delete | Add `items.delete` event-hook hitting Vercel with the same URL. Otherwise deleted slugs live in CDN for `expiration` seconds. |

**Source:**
- https://directus.io/docs/guides/automate/flows (fetched 2026-04-23)
- https://directus.io/docs/guides/automate/triggers (fetched 2026-04-23)
- https://directus.io/docs/guides/automate/operations (fetched 2026-04-23)
- https://vercel.com/docs/incremental-static-regeneration (fetched 2026-04-23)
- https://vercel.com/docs/frameworks/sveltekit (fetched 2026-04-23)
- https://svelte.dev/docs/kit/adapter-vercel (fetched 2026-04-23)

---

### Topic 6: Asset pipeline (R2 + `/assets` transforms)

Directus ships a full on-the-fly image transformation endpoint at `GET /assets/:id` backed by Sharp, layered on the pluggable storage adapter (the `s3` driver is R2-compatible — already chosen in D2). Architecture: upload via SDK → Directus writes to R2 → public `/assets/:id?width=…&format=webp` URLs → Cloudflare proxy/Vercel CDN caches those URLs. Saved presets (`?key=…`) let the frontend request named sizes without string-building query params.

**Transform query params (confirmed):**

- `width`, `height` (px integers)
- `quality` (1–100)
- `fit`: `cover` (default), `contain`, `inside`, `outside`
- `format`: `auto`, `jpg`, `png`, `webp`, `tiff` (**AVIF not in docs-listed set — verify live before relying on it**)
- `withoutEnlargement`: `true` prevents upscaling
- `transforms`: 2D JSON array of Sharp ops, e.g. `[["rotate",90],["blur",10]]`
- `key`: name of a saved preset defined in Data Studio
- `download`: forces Content-Disposition attachment

**Saved presets** live at Settings → Storage Asset Presets; production env caps transform ops per request at 5 (excludes saved presets) — so presets bypass that cap.

**Integration sketch (adapter + markup):**

```ts
// src/lib/directus/assets.ts
const CMS = 'https://cms.yesid.dev';
export const asset = (id: string, key?: string, q?: Record<string, string>) => {
  const params = new URLSearchParams(q);
  if (key) params.set('key', key);
  return `${CMS}/assets/${id}${params.size ? '?' + params : ''}`;
};

// Component usage
<img
  src={asset(file.id, 'hero-1200')}
  srcset={[640, 960, 1280, 1920]
    .map(w => `${asset(file.id, undefined, { width: `${w}`, format: 'webp' })} ${w}w`)
    .join(', ')}
  sizes="100vw"
  alt={file.description}
  width={file.width}
  height={file.height}
/>
```

**Bulk upload (migration script):**

```ts
import { createDirectus, rest, uploadFiles, authentication } from '@directus/sdk';
const client = createDirectus(CMS).with(rest()).with(authentication());

const form = new FormData();
form.append('folder', SERVICES_FOLDER_ID);
form.append('title', 'Data platform icon');
form.append('description', 'Stacked cubes representing…'); // = alt text
form.append('file', await readFileStream('./static/images/services/data.svg'));
const uploaded = await client.request(uploadFiles(form));
```

**CDN-layering architecture:** Directus serves assets through its Node process reading from R2 (not a direct R2-to-browser link). Cloudflare DNS points `cms.yesid.dev` at Railway → Cloudflare caches `/assets/:id?…` responses per query-string. No presigned-URL flow (bypasses Directus entirely — wrong tier for public-read assets).

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Presets vs per-request params | **Presets** for repeating sizes (`hero-1200`, `card-600`, `thumb-240`, `og-1200`); explicit params only for arbitrary `srcset` widths. |
| 2 | Folder structure | One folder per content type (`/services`, `/blog`, `/projects`, `/brand`, `/og`) + `folder` param on every upload. |
| 3 | Alt text source | `directus_files.description`; enforce non-null via validation or interface. |
| 4 | WebP vs AVIF | **Start with WebP via preset.** AVIF absent from docs — avoid until verified live. |
| 5 | Adapter shape | Expose `{ id, url, width, height, description }` from the adapter; build `src`/`srcset` client-side via `asset()` helper. |
| 6 | Migration approach | Stage `static/images/*` as a manifest (filename → folder → title/description), batch-upload via SDK in one script. Retain a `legacy_path` custom field on `directus_files` during migration to map old URLs → new IDs before cutover. |

**Source:**
- https://directus.io/docs/guides/files/transform (fetched 2026-04-23)
- https://directus.io/docs/configuration/files (fetched 2026-04-23)
- https://directus.io/docs/api/assets (fetched 2026-04-23)
- https://directus.io/docs/api/files (fetched 2026-04-23)
- https://directus.io/docs/guides/files/upload (fetched 2026-04-23)
- https://directus.io/docs/guides/files/access (fetched 2026-04-23)

---

### Topic 7: Role / policy matrix

Directus 11 split the old monolithic "role" into **Users → Roles → Policies → Permissions**. A role is an organizational bucket that attaches N policies; the same policy can be shared across roles and assigned directly to individual users. Recommendation for yesid.dev: **one policy per capability** (`content-read-all`, `content-edit-safe-fields`, `slug-edit-admin-only`, `no-delete-published`, `files-read-public`, `files-write-editor`, `versions-own`), composed onto roles (`admin`, `human-editor`, `ai-editor`) plus the built-in `Public`.

**Full matrix:**

| Capability policy | collection | action | fields | permissions (filter) | on role |
| --- | --- | --- | --- | --- | --- |
| `content-read-all` | all content collections | `read` | `*` | `{}` | admin, human-editor, ai-editor |
| `content-read-published` | same | `read` | `*` | — (version filtering happens via `?version` param; public endpoint returns main) | Public |
| `content-edit-safe-fields` | same | `create`, `update` | `["title","body","hero","description","tags","date_published"]` | `{}` | human-editor, ai-editor |
| `slug-edit-admin-only` | same | `update` | `["slug"]` | `{}` | admin only |
| `no-delete-published` | same | `delete` | `*` | `{ "status": { "_neq": "published" } }` | human-editor, ai-editor |
| `delete-anything` | same | `delete` | `*` | `{}` | admin |
| `files-read-public` | `directus_files` | `read` | `["id","title","description","type","width","height","filename_download","folder"]` | `{ "folder": { "_in": [public_folder_ids] } }` | Public |
| `files-write-editor` | `directus_files` | `create`, `update` | `*` | `{}` | human-editor, ai-editor |
| `versions-own` | `directus_versions` | `create`, `read`, `update` | `*` | `{ "user_created": { "_eq": "$CURRENT_USER" } }` | human-editor, ai-editor |

**Example permission JSON (no-delete-published):**

```json
{
  "collection": "services",
  "action": "delete",
  "fields": ["*"],
  "permissions": { "status": { "_neq": "published" } },
  "validation": {},
  "presets": {},
  "policy": "<no-delete-published-policy-id>"
}
```

**Key grounded facts:**

- **Policy object:** `id`, `name`, `icon`, `description`, `ip_access` (CIDR allowlist), `enforce_tfa`, `admin_access`, `app_access` (Data Studio login), M2M to users/roles, O2M to permissions.
- **Role object:** `name`, `icon`, `description`, `parent` (hierarchy), `children`, M2M policies, O2M users. No direct `admin_access` on roles — that flag moved onto policies.
- **Permission object:** `collection`, `action` (`create | read | update | delete | share`), `fields` (array; `*` or allowlist), `permissions` (filter-rule for row-level access), `validation` (filter-rule evaluated before write), `presets` (default values injected on write), `policy` (FK).
- **Public role:** all perms off by default; docs warn that enabling collection-read exposes all rows to bots. For Public on `directus_files`, filter by `folder._in: [public folder ids]` so only marketing assets are anonymously readable.
- **Field-level perms:** only **allowlisting** (no denylists). "Title yes, slug no" = two permissions under the policy: one `update` with `fields: ["title", ...]`; slug under a separate admin-only policy.
- **Filter-rule syntax:** `_eq`, `_neq`, `_lt`, `_gt`, `_in`, `_contains`, `_regex`, `_and`, `_or`, plus dynamic vars `$CURRENT_USER`, `$CURRENT_ROLE`, `$NOW` (with optional offset). Nested access supported: `$CURRENT_USER.avatar.filesize`.
- **Collaborative editing (v11.15+):** requires `WEBSOCKETS_ENABLED=true`. All collab actions respect existing permissions — no separate perm system. Redis needed only for multi-instance clustering.

**ai-editor tightening (current → recommended minimum):**

- Current: widened in Task 4 for schema tool reads (`directus_collections`, `directus_fields`, `directus_relations`). Keep — MCP needs this.
- Recommended additions at Slice 18 close:
  - Keep: read on collections + `directus_files`.
  - Keep: create/update on content collections with **field allowlist excluding `slug`** + `no-delete-published` filter.
  - Drop: any write on `directus_collections / _fields / _relations` — schema changes stay admin-only.
  - Drop: any access to `directus_users`, `directus_roles`, `directus_policies`, `directus_permissions`, `directus_settings`.

**Decisions for yesid.dev:**

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Policy granularity | **One policy per capability**, compose via role. |
| 2 | Slug vs title | Two policies: `content-edit-safe-fields` (excludes slug) on editors + `slug-edit-admin-only` on admin. |
| 3 | Public file scoping | Filter `directus_files.read` by `folder._in: [public folder ids]`. |
| 4 | Collaborative editing | **Enable now** (`WEBSOCKETS_ENABLED=true`, `WEBSOCKETS_COLLAB_ENABLED=true`) while single-user — consistent behavior if a second editor joins later. |
| 5 | Versions policy | Editors CRUD own versions (`user_created _eq $CURRENT_USER`); admin-only delete. |
| 6 | ai-editor policy diet | Confirm no system-collection write scope; add `no-delete-published` filter. |
| 7 | Admin = one account | Admin tied to single non-MCP user; MCP agents always connect as `ai-editor`. |

**Source:**
- https://directus.io/docs/guides/auth/access-control (fetched 2026-04-23)
- https://directus.io/docs/api/policies (fetched 2026-04-23)
- https://directus.io/docs/api/permissions (fetched 2026-04-23)
- https://directus.io/docs/api/roles (fetched 2026-04-23)
- https://directus.io/docs/reference/filter-rules (fetched 2026-04-23)
- https://directus.io/docs/configuration/realtime (fetched 2026-04-23)
- https://directus.io/docs/guides/content/collaborative-editing (fetched 2026-04-23)

---

### Topic 8: Extensions vs built-ins decision matrix

Directus 11.17.3 ships a deep built-in surface — Flows for automation, native Translations/Slug/Tags/Markdown interfaces, Insights panels, Content Versioning, native MCP. The overwhelming bias for yesid.dev is **no custom extensions**. Every extension added to `yesid-dev-cms` becomes code we must maintain, test, and deploy — it directly violates `feedback_prefer_platform_builtins.md` unless a written justification accompanies it. Flows + ~14 built-in operations cover every inventoried use case below.

**Decision matrix (14 temptations → 0 extensions for Slice 18):**

| # | Need | Directus built-in | Custom-extension path | Choice + rationale |
|---|---|---|---|---|
| 1 | On-publish side effect (audit, derived field, status flip) | **Flow: Event Hook (action) → Create/Update Data op** | Action hook extension | **Flow.** Declarative, snapshot-versioned, non-blocking. |
| 2 | Slack/Discord notification on publish | **Flow: Event Hook → Webhook op (POST to incoming webhook URL)** | Custom hook with SDK | **Flow.** Webhooks accept plain POSTs — no SDK needed. Secret URL in Railway env. |
| 3 | Import from TS source modules (Task 6 seed pattern) | None natively — closest: CSV import | `bun scripts/seed.ts` with `@directus/sdk` | **Plain `bun` script** in yesid.dev-cms. Not an extension — one-off ops script. |
| 4 | Auto-slug from title | **Built-in "Slug" interface** + Flow filter fallback | Custom interface | **Built-in.** Auto-fills on keystroke. Flow filter as fallback for API-only creation. |
| 5 | Publish status dashboard | **Data Studio Insights dashboards + panels** | Custom module | **Insights.** Drag-drop config in snapshot. |
| 6 | Authoring UI for M2A (blog body) | **Built-in Markdown interface** (blog stays markdown per D7) | Custom block-editor layout | **Built-in Markdown.** Block Editor unused (preserves `marked.parse` pipeline per Q7). |
| 7 | Pull GitHub repo stars nightly | **Flow: Schedule → Webhook → Transform → Update Data** | Custom op with Octokit | **Flow.** GitHub REST is a straight `fetch`. |
| 8 | Visual editing iframe | **`@directus/visual-editing` NPM package** (consumer-side) | N/A | **Consumer NPM package** in yesid.dev, not a Directus extension. |
| 9 | Cache invalidation on publish (Topic 5) | **Flow: Event Hook → Webhook op** | Custom hook | **Flow.** Webhook op handles bearer-auth natively. |
| 10 | Custom preview routes for drafts | **SvelteKit `+page.server.ts` + Content Versioning API** | N/A | **SvelteKit route** on yesid.dev. Versioning native. |
| 11 | Image auto-alt-text (AI) | **Flow: Event Hook on `files.upload` → Webhook (AI API) → Update Data** OR **`directus-labs/ai-alt-text-writer` marketplace op** | Custom | **Defer.** Install marketplace op only when an un-alted hero image actually ships. |
| 12 | SEO field bundle | **Built-in fields** (mirror `SiteMeta` + `PageSeo`) OR **`directus-labs/seo-plugin`** | Custom bundle | **Built-in fields + grouping first.** SEO bundle only if built-ins prove insufficient. |
| 13 | Cloudflare Turnstile on contact form | None — not a CMS concern | N/A | **Consumer-side.** |
| 14 | Multi-lingual authoring | **Built-in Translations** (already in use — services_translations) | Custom locale-switcher | **Built-in.** Proven in Task 6/7. |

**Extension hosting pattern (if one ever lands):** Directus auto-loads from `EXTENSIONS_PATH=./extensions`. Railway template doesn't currently mount a persistent extensions volume — adding an extension means switching to a custom `Dockerfile` that `COPY`s `extensions/` and rebuilds on every push. Meaningful ops-burden step up → another reason to stay in Flow territory.

**Marketplace extensions** (preferred over custom): Data Studio → Settings → Marketplace. Extensions stored in DB, survive restarts. `MARKETPLACE_TRUST=sandboxed` (default) is safe. Candidates (from `github.com/directus-labs/extensions`) worth evaluating at slice 19+: AI Alt Text Writer, AI Translator, AI Writer, SEO Plugin, YouTube Embed Interface, Related Items Bundle.

**Source:**
- https://directus.io/docs/guides/extensions/api-extensions/hooks (fetched 2026-04-23)
- https://directus.io/docs/guides/extensions/api-extensions/operations (fetched 2026-04-23)
- https://directus.io/docs/guides/extensions/app-extensions/interfaces (fetched 2026-04-23)
- https://directus.io/docs/guides/automate/triggers (fetched 2026-04-23)
- https://directus.io/docs/guides/automate/operations (fetched 2026-04-23)
- https://directus.io/docs/configuration/extensions (fetched 2026-04-23)
- https://github.com/directus-labs/extensions (fetched 2026-04-23)

---

### Topic 9: Repo-separation boundary — yesid.dev-cms vs yesid.dev

Owner's rule: each repo ships independently. A schema change in `yesid-dev-cms` doesn't force a PR in `yesid.dev`; a Svelte component change in `yesid.dev` doesn't force a PR in `yesid-dev-cms`. The two repos meet at exactly one surface — the **`ContentAdapter` TS interface × `@directus/sdk` REST response shape × schema snapshot**. Every other concern sits cleanly on one side. Current state review confirms one misplacement: `scripts/seed-directus-services.ts` is in `yesid.dev` but describes authoring state in `yesid.dev-cms` — must move.

The two repos also have different deploy cadences (Vercel-on-push for yesid.dev; Railway image pin + manual schema-apply for yesid.dev-cms), different CI concerns (unit/typecheck/preview vs ephemeral-Directus smoke + prod-apply), and different security surfaces (public anon reads vs admin token + Neon DB URL). Monorepo via workspaces would re-couple them; two-repo with a contract seam preserves independent shipping.

**Ownership table:**

| Concern | Repo | File path(s) | Rationale |
|---|---|---|---|
| Directus container version pin | **yesid.dev-cms** | Railway service config + `.env.example` + `README.md` | Pin `directus/directus:11.17.3`; bumps = cms-repo PR. |
| Schema snapshot | **yesid.dev-cms** | `infra/directus/snapshot.yaml` | Authoritative collections/fields/relations/flows. Reviewed diff = change log. |
| Schema-apply CI | **yesid.dev-cms** | `.github/workflows/schema-apply.yml` | Ephemeral smoke + prod-gated. Already green. |
| Flow definitions | **yesid.dev-cms** | Inside `snapshot.yaml` | Flows ride the snapshot/apply pipeline. Webhook URLs come from per-env env vars. |
| Extension source (if any) | **yesid.dev-cms** | `extensions/` loaded via `EXTENSIONS_PATH=./extensions` (needs custom Dockerfile) | Requires moving off Railway template — friction is intentional. |
| Directus env template | **yesid.dev-cms** | `.env.example` | Mirrors Railway Variables. |
| **Seed scripts** (authored data → Directus) | **yesid.dev-cms** (after migration) | `scripts/seed-*.ts` + its own minimal `package.json` | Seed writes **into** Directus. CMS-side concern. |
| Asset migration scripts | **yesid.dev-cms** | `scripts/migrate-assets.ts` | Writes into Directus files/R2. |
| Data Studio role/policy config | **yesid.dev-cms** | `snapshot.yaml` (permissions block) | Roles/policies export with schema. |
| MCP token + `ai-editor` role | **yesid.dev-cms** | `snapshot.yaml` (role) + Railway Variables (token) | Role shape = schema; token = env. |
| `ContentAdapter` TS interface | **yesid.dev** | `src/lib/adapters/types.ts` | Consumer-side contract. Any new port method = yesid.dev PR. |
| Directus adapter impl | **yesid.dev** | `src/lib/adapters/directus.ts`, `directus.test.ts` | Translates REST → `ContentAdapter` shape. |
| Static fallback adapter | **yesid.dev** | `src/lib/adapters/static.ts` | Disaster-recovery + unit-test baseline. |
| Hybrid adapter selector | **yesid.dev** | `src/lib/adapters/index.ts` | Port-by-port switch. |
| Preview routes | **yesid.dev** | `src/routes/preview/[collection]/[id]/+page.server.ts` (future) | Server-only; uses private admin token. |
| Revalidation endpoint (if custom) | **yesid.dev** | `src/routes/api/revalidate/+server.ts` (future) | Receives Flow webhook POST; verifies `REVALIDATE_TOKEN`. (Not strictly needed — Flows can hit the canonical route directly.) |
| Public env `PUBLIC_DIRECTUS_URL` | **yesid.dev** (Vercel) | `$env/dynamic/public` | Safe-in-bundle; consumer baseURL. |
| Private env `DIRECTUS_ADMIN_TOKEN` | **yesid.dev-cms only** (Railway) | Railway Variables | Scope as narrow as possible. Consumer preview route uses a dedicated `EDITOR_PREVIEW_TOKEN`, not admin. |
| Shared env `VERCEL_BYPASS_TOKEN` / `EDITOR_PREVIEW_TOKEN` | **Both** | Railway Variables + Vercel env | Identical value across both; rotation = manual PR updating both. |
| Slice bundles | **yesid.dev** | `docs/slices/slice-*/` | Cross-repo contract + decision log. |
| Cross-tool orchestration (CLAUDE.md, AGENTS.md, workflow) | **yesid.dev** | root | Consumer repo is operator's home; CMS repo stays minimal. |

**Contract definition — three sync points:**

1. **`ContentAdapter` interface** (yesid.dev `src/lib/adapters/types.ts`) — method surface the site calls.
2. **Schema snapshot** (yesid.dev-cms `infra/directus/snapshot.yaml`) — collections/fields/relations backing the adapter's REST queries.
3. **`@directus/sdk` response shape** — emerges from (2), consumed by (1)'s implementation.

**Change-propagation rule:**

- **Consumer-only derived field** (computed from existing) → yesid.dev PR only.
- **New authored field** (e.g., `excerpt` on blog) → yesid.dev-cms PR first (snapshot diff + smoke apply) → yesid.dev PR extending adapter mapping. Link in yesid.dev PR description to CMS PR hash.
- **Rename field** → same two-PR sequence; CMS PR must land + apply to prod before yesid.dev PR merges. Gate with `workflow_dispatch` prod-apply step.
- **Contract-breaking change** → mark slice as explicitly cross-repo in `plan.md`; reviewers look at both PRs together; merge order mandated.

**Migration notes — one file misplaced:**

| File | Current location | Target location | Steps |
|---|---|---|---|
| `scripts/seed-directus-services.ts` | `yesid.dev/scripts/…` | `yesid.dev-cms/scripts/seed-services.ts` | (1) `yesid.dev-cms`: `bun init -y` then add `@directus/sdk` + `zod` as devDeps (scorched in Task 1; needs re-init). (2) Copy script; replace `import { services } from '../src/lib/content/services'` with either (a) committed JSON export of services (authoring data joins CMS repo) — simpler, no cross-repo git coupling — or (b) `git archive` subtree fetch of `src/lib/content/` from yesid.dev in CI. **Recommend (a).** (3) Add invocation to `.github/workflows/schema-apply.yml` as optional step gated by `workflow_dispatch` input `seed: true`. (4) Remove `yesid.dev/scripts/seed-directus-services.ts`. (5) Inline minimal type definition in CMS-repo script (seed doesn't need full domain types — just row shape). |

Secondary question: yesid.dev-cms needs `bun` set up again, **minimally**. Leaf `package.json` with `@directus/sdk` + `zod`, dev script `bun run seed`. Do **not** add build tooling, linting, or test runners — CMS repo's job is config + snapshot + seed, not a compiled TS codebase. README update: "No runtime `package.json`; scripts-only `package.json` for seed/migration tooling."

**CI shape per repo:**

- **yesid.dev PRs:** unit tests (vitest, includes `adapter.test.ts`, `directus.test.ts` mocked), typecheck (`svelte-kit sync && tsc --noEmit`), lint, Vercel preview deploy. **New:** cross-repo contract test (optional, runs on PRs touching `src/lib/adapters/directus.ts` or `types.ts`).
- **yesid.dev-cms PRs:** `schema-apply.yml smoke` (ephemeral Postgres + Directus 11.17.3 → `/schema/diff` → `/schema/apply` → smoke HTTP checks). Already green. Later: add `actionlint` for workflows + `yamllint` for snapshot.

**Cross-repo contract test** (lives in yesid.dev, runs on PRs touching `src/lib/adapters/directus.ts`):
1. `actions/checkout@v4` for yesid.dev.
2. Second `actions/checkout@v4` with `repository: mgkdante/yesid.dev-cms, path: cms`.
3. Boot ephemeral Directus with `cms/infra/directus/snapshot.yaml`.
4. Seed minimal fixture row per collection.
5. Run `bun test src/lib/adapters/directus.integration.test.ts` (new file, tagged `integration`, skipped by default).
6. Tear down.

**Prod schema apply** remains manual `workflow_dispatch` on yesid.dev-cms — operator reviews diff, confirms, clicks run.

**Secret rotation policy** (`VERCEL_BYPASS_TOKEN` / `EDITOR_PREVIEW_TOKEN`): document in `yesid.dev-cms/README.md` Operations section: rotate every 90 days or on suspected leak. Generate via `openssl rand -hex 32`. Update Railway Variables → redeploy Directus. Update Vercel env → redeploy consumer. Verify both. No CI automation — manual + checklisted.

**Source:**
- https://directus.io/docs/configuration/extensions (fetched 2026-04-23)
- https://directus.io/docs/guides/extensions/installing-extensions (fetched 2026-04-23)
- https://directus.io/docs/guides/automate/flows (fetched 2026-04-23)
- local browse of both sibling repos (2026-04-23)

---

### Topic 10: Revised task list for remaining content types

Synthesis across Topics 1–9. Remaining work after Tasks 0–7 partitions into **7 bounded tasks**, each touching both repos through the adapter contract. Preview/draft wiring (Topics 1 + 2 + 3) is deferred to a follow-up slice per the original Q5 resolution — Slice 18 lands **parity + CMS-native schema + Content Versioning enabled on every collection**, but the `/preview/*` routes + `apply()` overlay ship as a distinct feature slice.

Each task follows the two-repo pattern (per Topic 9):
1. **yesid.dev-cms PR first** — Data Studio schema authored, snapshot exported, seed script updated, ephemeral CI smoke-apply green, production apply via `workflow_dispatch` with operator approval.
2. **yesid.dev PR second** — adapter port implemented, tests added/updated, one-line flip at `src/lib/adapters/index.ts`, live-preview smoke on affected routes, `bun run check` + `bun run test` green.

Content Versioning enabled on every user collection at authorship (cheap; reversible; matches future Visual Editor behavior).

---

**Task 8 — Two-repo decoupling + minimal toolchain on yesid.dev-cms**

- Re-init `yesid.dev-cms` with leaf `package.json`: `@directus/sdk` + `zod` + `bun-types`. No build tools, no linting beyond `actionlint`/`yamllint` on CI.
- Migrate `yesid.dev/scripts/seed-directus-services.ts` → `yesid.dev-cms/scripts/seed-services.ts`. Inline minimal row shape; no cross-repo git coupling.
- Remove `yesid.dev/scripts/seed-directus-services.ts`.
- Add `.github/workflows/schema-apply.yml` optional seed step gated by `workflow_dispatch` input `seed: true`.
- Document rotation policy for `VERCEL_BYPASS_TOKEN` / `EDITOR_PREVIEW_TOKEN` in `yesid.dev-cms/README.md` Operations section.
- Add cross-repo contract test scaffold in yesid.dev (skipped-by-default integration test; CI wiring).
- No schema changes this task.

**Acceptance:** seed-services still runnable from yesid.dev-cms; yesid.dev builds + tests green; CMS repo has a minimal `package.json` + one seed script + one updated README.

---

**Task 9 — Asset pipeline migration (static/images/* → Directus + R2)**

- Stage a manifest: walk `static/images/*`, emit `assets-manifest.json` mapping filename → target folder (`services`, `blog`, `projects`, `brand`, `og`) → title → description (alt text).
- Create folders in Directus via SDK (one per content type).
- Bulk upload via SDK `uploadFiles` with `folder` + `title` + `description` per file. Retain a `legacy_path` custom field on `directus_files` during migration.
- Define saved presets in Data Studio: `hero-1200` (WebP, width 1200, quality 85, cover), `card-600` (WebP, width 600, quality 80, cover), `thumb-240` (WebP, width 240, quality 75, cover), `og-1200` (JPG, width 1200, height 630, quality 85, cover).
- Snapshot export + smoke-apply CI green.
- Emit `assets-id-map.json` in yesid.dev-cms (or commit a re-runnable lookup helper): `legacy_path` → `file_id`. Consumed by later seed scripts (projects/blog/meta).
- No adapter work this task — consumer still reads `static/images/*` paths; cutover per-content-type as those ports flip.

**Acceptance:** all ~30+ `static/images/*` present under the right Directus folders; one representative asset rendered via `https://cms.yesid.dev/assets/:id?key=hero-1200` returns a WebP with the right dimensions; `assets-id-map.json` committed.

---

**Task 10 — Projects content type (schema + seed + adapter + flip)**

- Schema: `projects` collection (id, slug, title, one_liner, description, sections, impact_metric, visible, sort) + `projects_translations` (O2M; languages_code, title, one_liner, description, sections, impact_metric.label) + M2M to `services` via `services_projects_relations` junction (replaces current `Service.related_projects` CSV).
- Content Versioning enabled.
- `hero_image` M2O → `directus_files` (uses Task 9 map).
- Tags as CSV field (native Directus tags interface).
- Snapshot export + smoke-apply + production apply.
- Seed script in yesid.dev-cms reading from yesid.dev's `src/lib/content/projects.ts` (committed JSON export dropped into yesid.dev-cms, per Task 8 pattern).
- Adapter: `projects` port implementation (all 8 methods: `all`, `byId`, `byService`, `allTags`, `allStackItems`, `serviceIdsForProjects`, plus cross-ref utilities via the new M2M junction).
- Update `services` M2M to pull `related_projects` from the junction too — minor adapter churn, zero consumer-side change.
- Flip `src/lib/adapters/index.ts` port: `projects: directusAdapter.projects`.
- Tests: adapter integration test spinning ephemeral Directus; consumer components + routes unchanged.

**Acceptance:** `/projects` + `/projects/[slug]` render from Directus; `Service.related_projects` resolves via M2M junction; SSR HTML contains project titles, descriptions, impact metrics sourced from cms.yesid.dev; `bun run check` + `bun run test` green.

---

**Task 11 — Blog content type (schema + seed + adapter + flip)**

- Schema: `blog_posts` collection (id, slug, status, date_published, lang, body [Markdown interface per Q7], excerpt [translations], cover_image [M2O directus_files], svg_illustration [M2O directus_files — optional], animation_reverse [M2O directus_files — optional]) + `blog_posts_translations` (languages_code, title, excerpt).
- Content Versioning enabled.
- Snapshot + CI + prod-apply.
- Seed: read from `yesid.dev/src/content/blog/**/*.md` (gray-matter parse frontmatter + body); upload SVG illustrations (may already be in Task 9 map); upsert blog posts in yesid.dev-cms seed script.
- Adapter: `blog` port (all 12 methods; `html` now renders Markdown body through `marked.parse` same as before; `svgContent` / `svgContentsForPosts` / `resolveSvgFallbackName` / `resolveAnimation` return URLs from `/assets/:id` via the cover_image + svg_illustration fields).
- Flip `blog: directusAdapter.blog`.
- Tests updated; `html` + `svgContent` helpers route through the new adapter.

**Acceptance:** `/blog` + `/blog/[slug]` render with Directus-sourced frontmatter + body; SVG illustrations resolve via `/assets/:id`; animation fallbacks still work (deterministic client-side hash preserved); tests green.

---

**Task 12 — Tech-stack content types (schema + seed + adapter + flip)**

- Schema: `tech_stack` (id, slug, title, category, status, body_markdown [Markdown interface]) + `tech_stack_translations` (languages_code, title) + `tech_relations` (id, from_tech M2O, to_tech M2O, connects_to_label, connection_notes) + `stack_scenarios` (id, slug, title, summary) + `stack_scenarios_translations` (languages_code, summary).
- Content Versioning enabled on `tech_stack` + `stack_scenarios`.
- `body_markdown` replaces the per-item files under `src/content/stack/{id}.md` (consumer still uses `marked`).
- Snapshot + CI + prod-apply.
- Seed: read from yesid.dev `src/lib/content/tech-stack.ts` + `src/content/stack/{id}.md` files (committed JSON + markdown join CMS repo as fixtures).
- Adapter: `techStack` port (12 methods: schema-validated CRUD + graph utilities — `connections`, `incomingConnections`, `outgoingRelations`, `incomingRelations`; `content(id)` returns raw markdown from `body_markdown`).
- Flip `techStack: directusAdapter.techStack`.

**Acceptance:** `/tech-stack` + `/tech-stack/[id]` render with Directus-sourced items + relations + scenario summaries; markdown content pipeline preserved; graph utilities return correct adjacency; tests green.

---

**Task 13 — Meta + route SEO (schema + seed + adapter + flip)**

- Schema: `site_meta` singleton (brand name, owner M2O to a `people` singleton or inline object; tagline, description, social links array, DKIM/SPF config metadata) + `site_meta_translations` (languages_code, tagline, description, owner.jobTitle) + `route_seo` collection (route_id [unique], visibility flags) + `route_seo_translations` (languages_code, title, description, og_image_alt) + `route_seo.og_image` M2O → `directus_files`.
- Content Versioning on `site_meta` + `route_seo`.
- Snapshot + CI + prod-apply.
- Seed: read from yesid.dev `src/lib/content/meta.ts` (includes `routeSeoEntries` map).
- Adapter: `meta` port (2 methods; `forRoute` keeps closed-registry contract — throws on unknown route by rejecting an empty `readItems('route_seo', { filter: { route_id: { _eq: id } }, limit: 1 })` response).
- Flip `meta: directusAdapter.meta`.

**Acceptance:** every route's SEO (title/description/OG) sourced from Directus; `<head>` renders correct meta tags on SSR; `meta.forRoute` throws for unknown routes (bug-catching preserved); tests green.

---

**Task 14 — Site-chrome via M2A pages (schema + seed + adapter + flip)**

Largest remaining task. Migrates the site-chrome literals (home-page, about-page, contact-page, tech-stack-page, services-page, projects-page, blog-page, error-pages, nav, menu, proof reel) into a CMS-native M2A structure.

- Schema:
  - `pages` collection (id, slug [unique: `home` | `about` | `contact` | `tech-stack` | `services` | `projects` | `blog`], title)
  - `pages_blocks` M2A junction (auto-generated)
  - Block collections: `block_hero`, `block_manifesto`, `block_proof_reel`, `block_services_grid`, `block_cta`, `block_closer`, `block_journey_panel`, `block_about_content`, `block_contact_content`, `block_tech_stack_page_content`, `block_blog_page_content`, `block_projects_page_content` (expand as pages are authored).
  - Each block collection has its own `translations` O2M table.
  - Singleton collections outside M2A: `nav_links` (array-of-objects), `menu_items`, `error_pages` (error content, separate from pages M2A).
  - Content Versioning enabled on everything.
- Snapshot + CI + prod-apply.
- Seed: read from yesid.dev `src/lib/content/{home-page,about-page,contact-page,services-page,projects-page,tech-stack-page,blog-page}.ts` + `nav.ts` + `site-content.ts`. For each page file, create one `pages` row + N `pages_blocks` junction rows pointing to the right block collection with the right translation rows.
- Adapter: `content` port (19 methods). Strategy: per-request memoized `loadPage(slug)` helper fetches the full M2A tree in one query; each port method (`heroData`, `proofReelItems`, `navLinks`, `menuItems`, `errorPages`, `aboutPage`, `contactPage`, `techStackPageContent`, `skillsJourneyPanels`, etc.) picks from the memoized Map or the singleton collection. Consumer `ContentPort` shape unchanged — zero `+page.svelte` or component changes.
- Flip `content: directusAdapter.content`.
- 10 site-chrome literal methods that today `typeof import(...)`-type against `src/lib/content/site-content` — these transition to typed row fetches; TS types stay identical by continuing to export the `site-content` TS shape as a type-only module (`import type { … }`).

**Acceptance:** `/`, `/about`, `/contact`, `/services`, `/projects`, `/tech-stack`, `/blog` all render from Directus; hero/manifesto/cta/closer/proof-reel/services-grid blocks all hydrate correctly; nav + menu + error pages work; `bun run test` green including the 10 site-chrome `typeof import(...)` tests.

---

**Task 15 — Slice close (role/policy tighten + Flow revalidation + peer review + PR + memories)**

- Tighten `ai-editor` role per Topic 7 minimum: field allowlists excluding `slug`; `no-delete-published` filter; drop any system-collection write scope; keep read on `directus_collections/fields/relations` for MCP schema tool.
- Define `human-editor` role (unused today but pre-created for future human collaborators). Compose capability policies onto it.
- Public-files folder scoping via `directus_files.read` filter.
- **Optional within Slice 18:** wire Flow-based revalidation (Topic 5) — one Flow per content type (services, projects, blog, tech_stack, meta, pages) → Webhook op → SvelteKit route with `bypassToken`. If time-constrained, defer to a follow-up slice.
- Cross-tool adversarial peer review (Codex) on the full slice per `feedback_codex_review_at_slice_close.md`.
- Open yesid.dev `feature/slice-18` PR — accumulates all Tasks 0–14 into one mergeable PR with the full handoff as the PR body.
- Update memories: `project_slice_18.md` → complete state + deletion of `staticAdapter` scheduled for Slice 19+; `project_completed_slices.md` row added after merge.
- Retire Vercel project on yesid.dev-cms after DNS flip confirmed + 7-day cooling period.

**Acceptance:** slice close ceremony complete; PR merged; memories updated; staticAdapter still present as dev-fallback but scheduled for removal in Slice 19+; Directus 11.17.3 pinned; role/policy matrix tightened; optional Flow revalidation either green or formally deferred.

---

**Sequence + dependency graph:**

```
Task 8 (decoupling) ──> Task 9 (assets) ──> Task 10 (projects)
                              └──> Task 11 (blog)
                              └──> Task 12 (tech-stack)
                              └──> Task 13 (meta)
Task 10..13 can run in any order after Task 9. Task 14 (site-chrome) depends on Task 9 (assets) and — for clean consumer-side types — benefits from 10..13 being done so the adapter is proven across ports. Task 15 depends on 8..14.
```

**Parallelism:** Tasks 10, 11, 12, 13 are independent once Task 9's asset map exists; they could be batched into a single session if resourced accordingly. Task 14 is large enough to deserve its own session.

**Slice close estimate:** 5–7 additional sessions after Task 2b.

---

## Task 2b decisions ready to lock in spec.md

- **D4 (Visual Editor):** `@directus/visual-editing` v2 SDK; conditional `data-directus` rendering gated by `?edit=<flag>`; lazy `apply()` per opt-in component. → see spec.md § Design decisions.
- **D5 (Content Versioning):** enable on all user collections + block collections; `?version=draft` opt-in at item level; no separate `status` field; Promote is the publish verb. → see spec.md § Design decisions.
- **D6 (Preview routes):** dedicated `/preview/[collection]/[id]?version=draft&token=…` route tree; single `EDITOR_PREVIEW_TOKEN` env var; per-call optional `PreviewContext` at adapter boundary. **Implementation deferred** to follow-up slice per Q5. → see spec.md § Design decisions + § Open questions (Q5).
- **D7 (M2A pages):** `pages` collection + M2A `blocks` field + block collections; per-page block copies for MVP (no reusable catalog); adapter flattens at boundary preserving existing `ContentPort` methods; per-request memoization. → see spec.md § Design decisions.
- **D8 (Flows → revalidation):** Event Hook (action) → Condition (`status _eq published`) → Webhook op → SvelteKit route with `config.isr.bypassToken`. One flow per collection. No custom `/api/revalidate` endpoint. **Optional within Slice 18** — land at close or defer. → see spec.md § Design decisions.
- **D9 (Asset pipeline):** `/assets/:id?key=<preset>`; saved presets `hero-1200` / `card-600` / `thumb-240` / `og-1200`; one folder per content type; WebP format (AVIF deferred until docs-verified); alt text via `description` field; bulk upload via SDK in `yesid.dev-cms/scripts/migrate-assets.ts`. → see spec.md § Design decisions.
- **D10 (Role/policy matrix):** one policy per capability (content-read-all, content-edit-safe-fields, slug-edit-admin-only, no-delete-published, files-read-public [folder-scoped], files-write-editor, versions-own); composed onto admin, human-editor, ai-editor, Public roles; `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true`. → see spec.md § Design decisions.
- **D11 (Extensions posture):** no custom extensions in Slice 18. All 14 evaluated temptations resolve to Flows + built-in interfaces. Marketplace extensions (seo-plugin, ai-alt-text-writer) deferred to Slice 19+. Reinforces `feedback_prefer_platform_builtins`. → see spec.md § Design decisions.
- **D12 (Repo-separation boundary):** yesid.dev owns adapter/routes/consumer + slice bundle docs; yesid.dev-cms owns schemas/flows/seeds/extensions/CI. Contract = `ContentAdapter` interface × `snapshot.yaml` × `@directus/sdk` response shape. Seed script migrates from yesid.dev to yesid.dev-cms (Task 8). Cross-repo contract test on yesid.dev PRs touching the adapter. → see spec.md § Design decisions.
- **Q5 (preview/draft — follow-up):** confirmed deferred. D6 locks the shape; implementation slice scheduled post-18 close.
- **Q8 (versioning on blocks):** yes — enable on all block collections, not just parent pages, so editors see a uniform "draft → promote" UX per block.
- **Q9 (Flow revalidation timing):** optional within Slice 18 (Task 15); defer if time-constrained. Site rendering correctness doesn't depend on it — stale-while-revalidate + manual purge covers the gap.
- **Q10 (AVIF support):** unknown from docs; use WebP for now, verify AVIF via live `/assets/:id?format=avif` probe before adopting in Slice 19+.
- **Q11 (versions policy shape):** editors CRUD own (`user_created _eq $CURRENT_USER`); admin-only delete/force-publish. Default for human-editor + ai-editor roles.
- **Q12 (block reuse strategy):** per-page copies for MVP (CTA authored 3× — home/services/projects). Revisit only when 3+ pages actively share 2+ blocks.
