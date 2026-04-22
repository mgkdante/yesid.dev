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
