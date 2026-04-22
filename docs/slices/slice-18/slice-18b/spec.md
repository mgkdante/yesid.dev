# Sub-Slice 18b — Content Model + Seed

**Parent slice:** [Slice 18 — Cloud Content Layer: Payload (own repo) + Neon](../README.md)
**Status:** planning (2026-04-21)
**Depends on:** Slice 18a ✓ (CMS infrastructure foundation shipped 2026-04-21 — [mgkdante/yesid.dev-cms](https://github.com/mgkdante/yesid.dev-cms) live at `https://cms.yesid.dev`).
**Unblocks:** 18c (type-sync GitHub Action + first service swap), 18d (globals swap), 18e (collections swap), 18f (preview + webhook + cleanup).
**Size:** L (two sessions — session 1: collections/globals + local migration + heartbeat; session 2: prod migration + seed + DNS + close).
**Est. Sessions:** 1–2.
**Lives in two repos:** CODE ships in `yesid.dev-cms` (new collections, globals, migrations, seed script, payload.config.ts edits); DOCS bundle ships in `yesid.dev/docs/slices/slice-18/slice-18b/` and `ARCHITECTURE.md` / `README.md` / `PLAN.md` updates land in `yesid.dev`.
**Design spec carryover:** All 12 design decisions from 18a apply (bun runtime, Postgres adapter with `push: false`, Neon via Vercel Marketplace, Vercel Blob adapter registered, Resend for email, admin bootstrap via `onInit`, `prodMigrations` cold-start, localization en/fr/es, site-meta heartbeat, repo governance, two-PR close, MCP plugin first-class). 18b extends D4 (Blob) + D8 (localization) + D9 (site-meta) + D12 (MCP) — see below.

## Goal

Grow the Payload schema from 18a's minimal heartbeat (`users` + `Media` scaffold + `site-meta`) to the **full content model** for `yesid.dev`: 5 content collections, 10 globals, extended Media, every user-facing text field localized, every relevant surface MCP-exposed. Seed all of it with the existing `yesid.dev` TS + Markdown content via an idempotent Payload Local API script. Flip Vercel Blob on for uploads. Finish Resend DNS verification so `no-reply@cms.yesid.dev` is a real sender.

After 18b, `cms.yesid.dev` holds every byte of content that `yesid.dev` currently reads from `src/lib/content/*.ts` + `src/content/**/*.md`. Frontend is still **untouched** — `yesid.dev` keeps reading from static files. 18c owns the first service swap (`site-meta` → Payload REST).

## Why now

Three reasons this must be its own sub-slice between 18a's infrastructure and 18c's service-swap:

1. **Relationships only work if every collection exists at once.** `projects.services ↔ services.relatedProjects`, `projects.stack → tech-stack`, `stack-scenarios.techs → tech-stack` — none of these can be validated piecemeal. Landing the full content model in one bundle means one consolidated migration applied atomically, relationships proven end-to-end before any frontend reads.
2. **Seed script is a one-shot import, not a recurring build step.** Once Payload holds the data, `yesid.dev`'s TS/MD files are deletable (in 18f). Deferring seed to 18c+ would require partial dual-write (Payload + TS) during the swap, which is strictly worse than one clean seed now.
3. **Admin IA shape is discovered by building, not by spec alone.** Laying out Pages/Content/System groups in `admin.group` with 15 documents surfaces editor-ergonomics bugs (wrong field order, missing localization toggle, confusing field labels) that 18c+ would inherit silently. Fix them while the surface is small.

## Non-goals (scope guards)

- **No frontend integration.** `yesid.dev/src/lib/content/*.ts` untouched; adapters stay on `static.ts`. Zero new imports of `cms.yesid.dev` from `yesid.dev` source code (docs fine). Verify: `git diff main -- src/ tests/` in `yesid.dev` is empty.
- **No type-sync GitHub Action.** 18c owns cross-repo type mirroring. 18b's `bunx payload generate:types` produces the types file locally (committed to `yesid.dev-cms`); no PR lands in `yesid.dev` for this slice.
- **No service-layer swap.** All existing `src/lib/services/*.service.ts` keep calling the static adapter. 18c wires `getSiteMeta()` to REST first.
- **No preview route or revalidation webhook.** 18f owns both. Draft-mode fields on collections (`versions: { drafts: true }`) are NOT enabled in 18b — defaults only. Editors publishing in admin means publishing directly.
- **No deletion of `yesid.dev` content files.** `src/lib/content/*.ts` + `src/content/blog/` + `src/content/stack/` + `src/content/scenarios/` stay untouched. 18f deletes them after every route loads from CMS.
- **No admin theming.** Default dark theme (set in 18a). Custom logo, accent colors, per-collection icons — all post-v1 polish.
- **No custom field components.** Default Payload field UIs for every field type. No custom React components registered.
- **No role-gated access beyond admin.** Editor role exists in the `users.roles` enum but isn't exercised. All access stays `isAdmin()` gated per 18a. First external editor onboarding is a later slice.
- **No Lexical editor customization.** Default `lexicalEditor()` for blog body. No custom blocks (image+caption, code fence, callout) — those are post-seed polish when an editor complains.
- **No multi-tenancy.** One Payload instance, Yesid as sole operator.
- **No `tags` collection.** Per **D-rel-3** below, `project.tags` + `blog.tags` stay as free-string arrays.
- **No reverse-relationship auto-computation via hooks.** Per **D-rel-1** below, reverse edges use Payload's built-in `join` field — no manual `beforeChange` sync code.
- **No explicit inter-tech relationships in tech-stack.** Per **D-rel-2** below, tech-stack is a flat labels collection in 18b. No `connections` / `connectsTo` field; the TS `connectsTo` + `connectionNotes` data is intentionally dropped at seed time. Tech-tech relatedness stays implicit ("two techs are related if they share a project or service" — query-time computation, not stored). Explicit graph modeling lands in a future **engine-builder** slice.
- **No MCP exposure for Media or Users.** Media uploads are multipart REST; MCP's JSON-RPC surface isn't the sweet spot. Users stay admin-only per 18a Q9.

## Design decisions

### D1 — One consolidated migration at slice close, not per-task migrations

Per-task local migrations during 18b-1 through 18b-6 get reset via `bunx payload migrate:fresh` on the dev branch. Final `bunx payload migrate:create --name initial-content` at 18b-7 captures the full delta from 18a's `00001_initial` as a single migration file. Production Neon branch applies **two** migrations total (18a's `00001_initial` + 18b's `00002_initial_content`) on next cold start via `prodMigrations`.

**Rationale:** Single deploy = clean rollback semantic. If the consolidated migration fails on prod, we revert one commit and the failed migration never runs again. Per-task migrations leave a trail of intermediate schemas that prod never sees — audit noise, no benefit.

**Trade-off:** Local iteration during 18b-1 through 18b-6 rewrites the migration file repeatedly. Accepted cost. The file is generated, not hand-authored.

### D2 — Section-style content uses Payload `array` fields, not `blocks`

`projects.sections: ProjectSection[]` and `services.sections: ServiceSection[]` in the TS types are homogeneous arrays of `{ title: LocalizedString; content: LocalizedString }`. Payload's `array` field maps 1:1. Payload's `blocks` field (heterogeneous — text block vs image block vs code block) is strictly more expressive but editor-facing complexity isn't justified at 18b scope. Upgrade to `blocks` when an editor asks for image-in-section or code-in-section — not before.

### D3 — Every relationship authored via Payload's `relationship` field with `hasMany: true`

No join tables hand-authored; Payload handles the M:N with its internal relationship tables. Fields:

| Collection     | Field               | relationTo      | hasMany |
|----------------|---------------------|-----------------|---------|
| projects       | `services`          | services        | yes     |
| projects       | `stack`             | tech-stack      | yes     |
| services       | `stack`             | tech-stack      | yes (**new**, per D-rel-1) |
| services       | `relatedProjects`   | *(removed — reverse via `join`, D-rel-1)* | — |
| stack-scenarios| `techs`             | tech-stack      | yes     |
| stack-scenarios| `relatedProjects`   | projects        | yes     |
| tech-stack     | `relatedProjects`   | *(join field per D-rel-1)* | — |
| tech-stack     | `relatedServices`   | *(join field per D-rel-1)* | — |

See **D-rel-1** for the join-field mechanics. Per **D-rel-2**, tech-stack has **no** explicit inter-tech relationship fields in 18b.

### D4 — Localization: `localized: true` on every user-facing prose field

Fields marked localized in 18b:

- `projects`: `title`, `oneLiner`, `description`, `sections[].title`, `sections[].content`, `impactMetric.label`, `impactMetrics[].label`
- `services`: `title`, `description`, `subtitle`, `longDescription`, `valueProposition`, `deliverables[]`, `sections[].title`, `sections[].content`, `benefitHeadline`, `impactMetric.value`, `impactMetric.label`
- `blog-posts`: `title`, `excerpt`, `body` (rich text — Lexical supports per-locale trees natively)
- `tech-stack`: `name` stays **non-localized** (tech names are proper nouns — PostgreSQL is PostgreSQL in every language). No other prose fields (flat labels per D-rel-2).
- `stack-scenarios`: `summary`
- `Media`: `alt` (already exists from 18a scaffold — flip to `localized: true`), `caption` (new, localized per D-rel-4), `credit` (text, **non-localized**)

All globals: every prose/copy field localized; enum/URL/path/role-key fields non-localized.

Leaves untouched: slugs, ids, statuses, booleans, urls, icon filenames, station numbers, enum values. All canonical across locales.

**Payload config already set (18a D8):** `localization: { defaultLocale: 'en', locales: ['en', 'fr', 'es'], fallback: true }`. `fallback: true` means queries for `fr`/`es` resolve to `en` content when translation is missing — matches the existing TS `LocalizedString` contract (en required; fr/es optional).

### D5 — Seed source: sibling `yesid.dev` repo, read via relative path

`yesid.dev-cms/scripts/seed/index.ts` reads from `../yesid.dev/src/lib/content/*.ts` (via dynamic `import()` — bun runs TS natively) and `../yesid.dev/src/content/**/*.md` (via `readdir` + `fs.readFile` + `gray-matter` frontmatter parsing). Requires the sibling repo to be cloned at `C:\Users\otalo\Yesito\Projects\yesid.dev\` — the existing local layout.

**Runtime:** `bun run scripts/seed/index.ts`. `.env` loaded via bun's native support. Works against any Neon branch (default: dev; prod run is a deliberate flag).

**Rationale:** Keeps the seed as a **reference recipe** — the same code pattern a future client would adapt to import from their existing CMS/CSV/JSON. Hardcoding content inline in the seed script would look like a fixture; reading from a sibling repo reads like "here's how you import from an external source."

**If the sibling repo doesn't exist**, seed fails with a clear error message pointing to the yesid.dev GitHub URL and local layout doc. No silent fallback — better to fail loud than silently seed an empty DB.

### D6 — Seed idempotency: upsert by natural key (slug / id)

Each entity checked via `payload.find({ collection, where: { slug: { equals: X } } })` → if `totalDocs > 0`, `payload.update`; else `payload.create`. Natural keys:

| Entity           | Natural key    |
|------------------|----------------|
| projects         | `slug`         |
| services         | `id`           |
| blog-posts       | `slug`         |
| tech-stack       | `id`           |
| stack-scenarios  | `id`           |
| Media            | filename       |
| Globals          | singleton — always update |

Seed is re-runnable without creating duplicates. Editor-UI changes to unchanged fields are preserved (upsert writes only the seed-sourced fields; Payload retains other fields).

**Two-pass ordering to resolve circular relationships:** Pass 1 creates entities without reverse-edge relationships (tech-stack → services with empty stack → projects with services+stack refs → blog-posts → stack-scenarios). Pass 2 nothing — because reverse edges (tech-stack.relatedProjects, tech-stack.relatedServices) are `join` fields (D-rel-1), they're computed from the forward side; no second-pass write needed. See D-rel-1 for the mechanics.

### D7 — Lexical rich-text conversion at seed time (blog bodies)

Blog post markdown bodies convert to Lexical editor state via Payload's built-in `convertMarkdownToLexical` (from `@payloadcms/richtext-lexical/migrate`) if the version exposes it; else a minimal custom converter (paragraph-per-double-newline + heading detection via leading `#`). Conversion is intentionally shallow — code blocks, inline formatting, and image embeds may render as plain paragraphs.

**Post-seed plan:** Yesid re-authors any blog post that lost formatting via the admin UI. For 18b, proof-of-load matters more than fidelity. Listing-page metadata (`title`, `excerpt`, `date`, `tags`, `svg`, `animation`) ports cleanly from frontmatter — those never lose fidelity.

### D8 — Media extensions + Blob store link + duplicate deletion (extends 18a D4)

Per **D-rel-4** below:
- Keep scaffold `alt` field; flip to `localized: true`.
- Add `caption: LocalizedString` (optional).
- Add `credit: text` (optional, non-localized — attribution strings).
- `imageSizes`: `thumbnail` (200×200), `card` (600×400), `hero` (1200×800). Payload generates these server-side via `sharp` (already installed 18a).
- Flip `vercelBlobStorage.collections.media = true` in `payload.config.ts`.
- Yesid links the existing `yesid-dev-cms-media` Blob store to the Vercel project (3-click dashboard step — per 18a handoff).
- Yesid deletes the accidental `yesid-dev-cms-media2` duplicate store.
- Seed creates Media docs for every project image (`/static/images/projects/*.png` in `yesid.dev`), blog SVGs stay as filename refs (D-rel-4 — blog SVG fallbacks are a kinetic motion asset library, not editorial uploads).

**Media stays OUT of MCP** per D-rel-4 + D10 below.

### D9 — Admin IA via `admin.group` — 3 groups, hub-first ordering

Matches the slice-18/README.md direction. Set on every collection + global:

```ts
// Collections
{ slug: 'tech-stack',       admin: { group: 'Content', /* ... */ } }
{ slug: 'services',         admin: { group: 'Content', /* ... */ } }
{ slug: 'projects',         admin: { group: 'Content', /* ... */ } }
{ slug: 'blog-posts',       admin: { group: 'Content', /* ... */ } }
{ slug: 'stack-scenarios',  admin: { group: 'Content', /* ... */ } }
{ slug: 'users',            admin: { group: 'System' } }
{ slug: 'media',            admin: { group: 'System' } }

// Globals
{ slug: 'home-content',     admin: { group: 'Pages', /* ... */ } }
{ slug: 'services-page',    admin: { group: 'Pages', /* ... */ } }
{ slug: 'projects-page',    admin: { group: 'Pages', /* ... */ } }
{ slug: 'blog-page',        admin: { group: 'Pages', /* ... */ } }
{ slug: 'tech-stack-page',  admin: { group: 'Pages', /* ... */ } }
{ slug: 'about-content',    admin: { group: 'Pages', /* ... */ } }
{ slug: 'contact-content',  admin: { group: 'Pages', /* ... */ } }
{ slug: 'nav-links',        admin: { group: 'Pages', /* ... */ } }
{ slug: 'error-pages',      admin: { group: 'Pages', /* ... */ } }
{ slug: 'site-meta',        admin: { group: 'Pages', /* ... */ } }
```

**Ordering rule:** Array position in `payload.config.ts` `collections: []` / `globals: []` determines admin sidebar order within each group.

- **Pages (site-walk):** `home-content, services-page, projects-page, blog-page, tech-stack-page, about-content, contact-content, nav-links, error-pages, site-meta`
- **Content (hub-first, dependency order):** `tech-stack, services, projects, blog-posts, stack-scenarios` — editing tech-stack first means projects + services referencing them don't round-trip.
- **System:** `users, media` (users first — it's the scarier admin surface; media is operational).

### D10 — MCP registration on every new collection + global (extends 18a D12)

Each new collection + global gets a `mcpPlugin()` entry with `find` + `update` enabled. Exceptions:

- `users` — NOT MCP-exposed. Admin identity shouldn't be on the same surface as content API keys. (Carries 18a Q9 forward.)
- `Media` — NOT MCP-exposed. Uploads are multipart REST — outside the plugin's sweet spot. Per D-rel-4.

For every other collection/global, MCP tools become `find-<slug>` + `update-<slug>`. Per-collection descriptions capture the editor-facing purpose. Sample:

```ts
mcpPlugin({
  collections: {
    'tech-stack':       { enabled: { find: true, update: true }, description: '...' },
    services:           { enabled: { find: true, update: true }, description: '...' },
    projects:           { enabled: { find: true, update: true }, description: '...' },
    'blog-posts':       { enabled: { find: true, update: true }, description: '...' },
    'stack-scenarios':  { enabled: { find: true, update: true }, description: '...' },
  },
  globals: {
    'home-content':     { enabled: { find: true, update: true }, description: '...' },
    'services-page':    { enabled: { find: true, update: true }, description: '...' },
    'projects-page':    { enabled: { find: true, update: true }, description: '...' },
    'blog-page':        { enabled: { find: true, update: true }, description: '...' },
    'tech-stack-page':  { enabled: { find: true, update: true }, description: '...' },
    'about-content':    { enabled: { find: true, update: true }, description: '...' },
    'contact-content':  { enabled: { find: true, update: true }, description: '...' },
    'nav-links':        { enabled: { find: true, update: true }, description: '...' },
    'error-pages':      { enabled: { find: true, update: true }, description: '...' },
    'site-meta':        { enabled: { find: true, update: true }, description: '...' },
  },
})
```

### D11 — Resend sender DNS (SPF + DKIM CNAMEs to Cloudflare)

Per spec 18a D5, DNS verification for `no-reply@cms.yesid.dev` was deferred to 18b. 18b adds the SPF TXT + DKIM CNAMEs that Resend requires.

**Default execution path:** Yesid adds the 3–4 records manually via the Cloudflare dashboard (per 18a handoff — Cloudflare MCP has no DNS record tools at the current plan tier). Records captured in `log.md` (without secrets). Resend dashboard shows "verified" within 15 min of propagation.

**Alternate (not default):** Issue a Cloudflare API token with `Zone.DNS:Edit` scope and call the Cloudflare REST API directly from the session. Token becomes a new secret — overhead outweighs the 3-click dashboard step for a one-time task. Skip unless the manual path has blocker issues.

### D12 — Cross-repo layout same as 18a

Code → `yesid.dev-cms`. Docs bundle → `yesid.dev/docs/slices/slice-18/slice-18b/{spec,plan,log,handoff}.md`. `ARCHITECTURE.md` update, `slice-18/README.md` sub-slice row flip, `PLAN.md` unchanged (slice 18 already "in progress" post-18a).

**Commit prefixes:** `feat(cms-slice-18b): …` / `chore(cms-slice-18b): …` / `docs(cms-slice-18b): …` in `yesid.dev-cms`. `docs(slice-18b): …` in `yesid.dev`.

**Two-PR close protocol** (same as 18a D11):
- **PR A** — `yesid.dev-cms` (substantive): schema + migrations + MCP registrations + seed script + README/docs updates.
- **PR B** — `yesid.dev` (docs-only): slice-18b bundle + ARCHITECTURE update + README sub-slice row. Opens AFTER PR A merges so handoff references a real PR URL.

### D13 — Seed script is one-shot (not a recurring build step)

The seed script runs manually — `bun run seed:prod` or `bun run seed:dev` — not from CI, not from Vercel build, not from a cron. Its job is to import existing `yesid.dev` content once into Payload. Post-seed, Yesid's admin UI + MCP are the editing surface; re-running the seed would overwrite admin edits on unchanged fields (per D6 upsert semantics).

**Documented in `yesid.dev-cms/README.md`:** "Seed is a one-shot tool. After 18b completion, DO NOT re-run against prod without confirming which fields get overwritten."

### D-rel-1 — Bidirectional writer selection: collapse denormalization via Payload `join`

**Decision:** projects + services are the **source of truth** for their tech-stack relationships. tech-stack auto-populates reverse edges via Payload's `join` field type — no manual `beforeChange` hook, no two-place drift.

**TS (pre-18b) — two-place authored, manually kept in sync:**
- `project.stack: string[]` ← source of truth on the project side
- `tech-stack.relatedProjects: string[]` ← **denormalized reverse** (drift-prone)
- `tech-stack.relatedServices: string[]` ← **denormalized reverse** (drift-prone)
- services did NOT have an explicit `stack` field; the edge was only captured on `tech-stack.relatedServices`.

**Payload (18b) — single writer, auto-computed reverse:**

```ts
// projects collection
{
  name: 'services',
  type: 'relationship',
  relationTo: 'services',
  hasMany: true,
},
{
  name: 'stack',
  type: 'relationship',
  relationTo: 'tech-stack',
  hasMany: true,
},

// services collection — NEW explicit source-of-truth field
{
  name: 'stack',
  type: 'relationship',
  relationTo: 'tech-stack',
  hasMany: true,
},

// tech-stack collection — reverse edges computed, read-only in admin
{
  name: 'relatedProjects',
  type: 'join',
  collection: 'projects',
  on: 'stack',            // project.stack references this tech-stack doc
  admin: { readOnly: true, description: 'Auto-computed from project.stack' },
},
{
  name: 'relatedServices',
  type: 'join',
  collection: 'services',
  on: 'stack',            // service.stack references this tech-stack doc
  admin: { readOnly: true, description: 'Auto-computed from service.stack' },
},
```

**Same pattern** for projects.relatedServices ↔ services.relatedProjects:

```ts
// projects collection — source of truth (already declared above)
// { name: 'services', type: 'relationship', ... }

// services collection — reverse edge, join field
{
  name: 'relatedProjects',
  type: 'join',
  collection: 'projects',
  on: 'services',
  admin: { readOnly: true, description: 'Auto-computed from project.services' },
},
```

**Seed consequences** (for 18b-8 seed script):
- When importing `tech-stack.relatedProjects` + `.relatedServices` from the TS source, **do not write** to the tech-stack reverse fields — they're join-computed.
- Derive `service.stack` from the TS tech-stack's `relatedServices` arrays (inverted: for each tech T with `relatedServices: [S1, S2]`, emit `S1.stack += [T.id]` and `S2.stack += [T.id]`).
- Same derivation for `project.stack` from the TS tech-stack's `relatedProjects`.
- **Write only to the source-of-truth side** (projects.stack, services.stack, projects.services). Payload computes the join fields on read.

### D-rel-2 — tech-stack is a flat labels collection in 18b; no explicit inter-tech graph

**Decision:** tech-stack has NO `connections` / `connectsTo` field in 18b. Defer explicit inter-tech relationship modeling to a future **engine-builder** slice.

**Tech-stack fields (full 18b shape):**

```ts
// src/collections/TechStack.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const TechStack: CollectionConfig = {
  slug: 'tech-stack',
  admin: { group: 'Content', useAsTitle: 'name', defaultColumns: ['name', 'layer', 'proficiency'] },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'id', type: 'text', required: true, unique: true, admin: { description: 'Stable slug id, e.g. "postgresql". Matches yesid.dev tech IDs.' } },
    { name: 'name', type: 'text', required: true },
    {
      name: 'layer',
      type: 'select',
      required: true,
      options: [
        { label: 'Data',      value: 'data' },
        { label: 'Backend',   value: 'backend' },
        { label: 'API',       value: 'api' },
        { label: 'Frontend',  value: 'frontend' },
        { label: 'Mobile',    value: 'mobile' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'DevOps',    value: 'devops' },
        { label: 'Testing',   value: 'testing' },
        { label: 'Systems',   value: 'systems' },
      ],
    },
    {
      name: 'domains',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Data Engineering',    value: 'data-engineering' },
        { label: 'Web Development',     value: 'web-development' },
        { label: 'Mobile Development',  value: 'mobile-development' },
        { label: 'Analytics / BI',      value: 'analytics-bi' },
        { label: 'Systems Programming', value: 'systems-programming' },
        { label: 'DevOps / Infra',      value: 'devops-infra' },
        { label: 'Internal Tooling',    value: 'internal-tooling' },
      ],
    },
    { name: 'icon', type: 'text', admin: { description: 'Icon slug matching yesid.dev icon registry.' } },
    {
      name: 'proficiency',
      type: 'select',
      options: [
        { label: 'Expert',     value: 'expert' },
        { label: 'Proficient', value: 'proficient' },
        { label: 'Familiar',   value: 'familiar' },
      ],
    },
    // Reverse-edge join fields (D-rel-1) — auto-computed, read-only:
    { name: 'relatedProjects', type: 'join', collection: 'projects', on: 'stack', admin: { readOnly: true } },
    { name: 'relatedServices', type: 'join', collection: 'services', on: 'stack', admin: { readOnly: true } },
  ],
}
```

**Dropped from TS source at seed time:**
- `connectsTo: string[]` — ignored
- `connectionNotes: Record<string, string>` — ignored

These fields stay in `yesid.dev/src/content/stack/*.md` frontmatter until 18f cleanup. The seed reads them, logs `[seed] Skipping tech-stack.connectsTo for postgresql (deferred to engine-builder slice)`, and moves on.

**Tech-tech relatedness stays implicit for 18b.** "Is PostgreSQL related to Python?" = "Do any projects or services reference both?" — derivable at query time with a two-hop Payload `find`:

```ts
// pseudo — not implemented in 18b, documented for future engine-builder reference
const projectsUsingPostgres = await payload.find({
  collection: 'projects',
  where: { stack: { in: ['postgresql-id'] } },
  depth: 0,
})
const techsInThoseProjects = new Set(
  projectsUsingPostgres.docs.flatMap((p) => p.stack)
)
// "tech T is related to PostgreSQL if it's in techsInThoseProjects"
```

No code ships for this query in 18b — just the data shape that makes it possible. 18c+ frontend may implement it if the Build-Your-Stack configurator needs it.

**Auto-stub-creation:** If a `project.stack` or `service.stack` references a tech-stack id that doesn't exist yet at seed time, the seed creates a minimal stub doc (`id` + `name` = the referenced value, other fields left blank for later editor fill). In admin UI, Payload's built-in relationship-field "Add new" affordance covers the same case for live editing. No custom hooks required in 18b.

**Graduate to a `tech-stack.connections` array or a separate `tech-connections` collection** only when the engine-builder slice defines a concrete use case (directed edges, per-direction notes, weighted connections, etc.). Until then, 18b keeps tech-stack flat.

### D-rel-3 — Tags stay free strings (no `tags` collection)

**Decision:** `project.tags: string[]` + `blog.tags: string[]` stay as free-string arrays in Payload. Model as:

```ts
{
  name: 'tags',
  type: 'text',
  hasMany: true,
  admin: { description: 'Free-string tags for filtering. No cross-collection relationship.' },
},
```

**Rejected alternative:** Promote to a `tags` collection with relationship fields.

**Rejected for 18b because:**
- Tags aren't cross-referenced across collections today. Project tags and blog tags evolve independently.
- < 30 distinct tags in use across all content — no drift pain yet.
- Easy to promote later: one-time seed from existing string values into a new collection, then swap field types via migration. Deferred promotion keeps 18b small.
- Existing frontend filter logic reads `string[]` directly — preserving the shape keeps 18c's service-swap a no-brainer.

### D-rel-4 — Media collection extension: caption (localized) + credit (text); no MCP

Scaffold shipped with a minimal Media collection (`alt: text` + `upload: true`). 18b extends it:

```ts
// src/collections/Media.ts — final 18b shape
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'System', useAsTitle: 'filename' },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 200, height: 200, position: 'centre' },
      { name: 'card',      width: 600, height: 400, position: 'centre' },
      { name: 'hero',      width: 1200, height: 800, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt',     type: 'text', required: true, localized: true },
    { name: 'caption', type: 'text', localized: true },
    { name: 'credit',  type: 'text' },
  ],
}
```

**Blob flip:**

```ts
vercelBlobStorage({
  enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  collections: {
    media: true,   // ← flipped in 18b
  },
  token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
})
```

**Dashboard actions** (Yesid-driven, documented in log.md):
1. Link existing `yesid-dev-cms-media` Blob store to the Vercel project (Storage tab → Connect Store → existing).
2. Delete accidental `yesid-dev-cms-media2` duplicate store.
3. Verify `BLOB_READ_WRITE_TOKEN` env auto-sets after link.
4. Redeploy to pick up the flipped config.

**Not MCP-exposed:**
- MCP writes via JSON-RPC don't fit multipart file uploads cleanly.
- Admin UI + REST API (`POST /api/media` multipart) handle uploads. Frontend reads via REST (`GET /api/media/:id`) with image-URL fields pointing at Blob.
- Revisit if a strong agent-driven upload workflow emerges — would require a sidecar upload-URL endpoint the MCP tool could return for client-side PUT.

## File-touch summary

### MODIFIED in `yesid.dev-cms`

**Collections:**
- `src/collections/Users.ts` — add `admin.group: 'System'`. No field changes.
- `src/collections/Media.ts` — extend per D-rel-4 (caption, credit, localized alt, imageSizes, admin.group).

**New collections:**
- `src/collections/TechStack.ts` — flat labels collection (id, name, layer, domains, icon, proficiency) + join fields (D-rel-1). No inter-tech relationships per D-rel-2.
- `src/collections/Services.ts` — service schema with stack relationship (new per D-rel-1) + sections array.
- `src/collections/Projects.ts` — project schema with services + stack relationships + sections array + impactMetric group + impactMetrics array.
- `src/collections/BlogPosts.ts` — blog-post schema with Lexical body.
- `src/collections/StackScenarios.ts` — scenario schema with techs + relatedProjects relationships.

**New globals:**
- `src/globals/HomeContent.ts` — site-wide hero/manifesto/journey/proof/services-grid/closer copy (from site-content.ts).
- `src/globals/ServicesPage.ts` — services listing page intro/meta (from services.ts servicesPageMeta + servicesListingContent + servicesDetailContent).
- `src/globals/ProjectsPage.ts` — projects listing page intro/meta (from projects.ts projectsPageMeta + projectsListingContent + projectsDetailContent).
- `src/globals/BlogPage.ts` — blog listing page intro/meta (from blog.ts listing content).
- `src/globals/TechStackPage.ts` — tech-stack page content (from tech-stack.ts techStackPageContent).
- `src/globals/AboutContent.ts` — /about page (from about-page.ts aboutPageContent).
- `src/globals/ContactContent.ts` — /contact page (from contact-page.ts contactContent).
- `src/globals/NavLinks.ts` — nav + menu + shared chrome + metro bookends + navDirections (from nav.ts).
- `src/globals/ErrorPages.ts` — 404 copy (from nav.ts errorPageContent).

**Modified globals:**
- `src/globals/SiteMeta.ts` — extend beyond heartbeat: add `tagline` (localized), `description` (localized), `links` (group: email, github, linkedin, upwork).

**Modified config:**
- `src/payload.config.ts` — register all new collections + globals; flip `vercelBlobStorage.collections.media = true`; extend `mcpPlugin()` with all new entries per D10.
- `package.json` — add `gray-matter` dep (blog frontmatter parsing for seed), add `seed:dev` + `seed:prod` scripts.

**Migrations:**
- `migrations/00002_initial_content.ts` — generated by `bunx payload migrate:create --name initial-content` at 18b-7.
- `migrations/index.ts` — auto-updated barrel.

**Generated types:**
- `src/payload-types.ts` — regenerated by `bunx payload generate:types`.

**Seed script:**
- `scripts/seed/index.ts` — entry point. Loads `.env`, imports Payload Local API, reads sibling `../yesid.dev/` repo, runs two-pass upsert.
- `scripts/seed/lib/loadTs.ts` — dynamic import of sibling `yesid.dev/src/lib/content/*.ts` TS modules.
- `scripts/seed/lib/loadMd.ts` — `readdir` + `gray-matter` parsing of `yesid.dev/src/content/**/*.md`.
- `scripts/seed/lib/toLexical.ts` — markdown → Lexical conversion (per D7).
- `scripts/seed/lib/deriveStack.ts` — invert TS `tech-stack.relatedProjects` + `relatedServices` into per-entity `stack: []` arrays (per D-rel-1).
- `scripts/seed/upsert/*.ts` — one file per collection/global (tech-stack, services, projects, blog-posts, stack-scenarios, media, home-content, etc.).
- `scripts/seed/README.md` — documents the script as a reference recipe (D5, D13).

**Repo docs:**
- `yesid.dev-cms/README.md` — add "Seeding" + "Content model" subsections.

**Env:**
- `.env.example` — add no new vars (18b reuses all 18a vars).

### MODIFIED in `yesid.dev` (docs-only)

- `docs/slices/slice-18/slice-18b/spec.md` (this file)
- `docs/slices/slice-18/slice-18b/plan.md`
- `docs/slices/slice-18/slice-18b/log.md` (created at 18b-1, appended per task)
- `docs/slices/slice-18/slice-18b/handoff.md` (created at 18b-1, self-appended per task, finalized at 18b-10)
- `docs/slices/slice-18/README.md` — flip 18b row to `complete (2026-04-XX)` with PR refs.
- `docs/reference/ARCHITECTURE.md` — append "Content model (Slice 18b)" subsection under the two-repo topology block: collections + globals summary, relationship topology, MCP scope.
- `tree.txt` — regenerate at slice close.

### UNTOUCHED in `yesid.dev` (by design)

- `src/lib/content/*.ts` — all content TS files. 18f owns deletion.
- `src/content/**/*.md` — blog + stack + scenarios markdown. 18f owns deletion.
- `src/lib/adapters/static.ts` — adapter continues reading TS files. 18c flips first consumer onto REST.
- `src/lib/schemas/*.ts` — Zod schemas stay as-is; 17c's invariants unchanged.
- `src/lib/services/*.service.ts` — services stay on static adapter.
- `src/lib/cms-types.ts` — doesn't exist yet; 18c creates it via the type-sync Action.
- `package.json` / `bun.lock` — zero new yesid.dev deps.
- Any route loader, component, or test. `git diff main -- src/ tests/` returns empty.

## Acceptance criteria

### Content model

- [ ] 5 content collections exist in `src/collections/`: `TechStack.ts`, `Services.ts`, `Projects.ts`, `BlogPosts.ts`, `StackScenarios.ts`.
- [ ] 10 globals total in `src/globals/` (1 extended + 9 new): `SiteMeta` (extended beyond heartbeat), `HomeContent`, `ServicesPage`, `ProjectsPage`, `BlogPage`, `TechStackPage`, `AboutContent`, `ContactContent`, `NavLinks`, `ErrorPages`.
- [ ] `Media` extended per D-rel-4 (caption, credit, localized alt, imageSizes).
- [ ] Every user-facing prose field marked `localized: true` per D4. Enum/url/filename/id/slug fields stay non-localized.
- [ ] Relationships exactly as per D3 + D-rel-1: projects.services, projects.stack, services.stack, stack-scenarios.techs, stack-scenarios.relatedProjects. Reverse edges on tech-stack (`relatedProjects`, `relatedServices`) + services (`relatedProjects`) are `join` fields, read-only in admin.
- [ ] `tech-stack` is flat (id, name, layer, domains, icon, proficiency + join fields) per D-rel-2. No `connections` / `connectsTo` field.
- [ ] `project.tags` + `blog.tags` are `text` `hasMany: true` fields (free strings) per D-rel-3.
- [ ] No `tags` collection exists.
- [ ] `bunx tsc --noEmit` green in `yesid.dev-cms`.

### Migration

- [ ] `migrations/00002_initial_content.ts` exists, committed, generated by `bunx payload migrate:create --name initial-content`.
- [ ] `bunx payload migrate:fresh` on a clean Neon dev branch produces the full schema with only `00001_initial` + `00002_initial_content` applied (exactly 2 rows in `payload_migrations`).
- [ ] `prodMigrations: migrations` still imports the barrel; no new wiring needed.
- [ ] Prod Vercel deploy runs the new migration on first cold start. Neon prod branch shows `payload_migrations` with 2 rows.
- [ ] Post-migration Neon prod branch contains tables for every collection + global + join relationship: `projects`, `projects_locales`, `projects_sections`, `projects_sections_locales`, `projects_rels`, `services`, `services_locales`, `services_rels`, `tech-stack`, `blog-posts`, `blog-posts_locales`, `stack-scenarios`, `stack-scenarios_locales`, `media` (+ resizes subtables), every `<global-slug>_locales` where applicable. Note: tech-stack has NO locales subtable (no localized fields per D-rel-2) and NO connections subtable.

### Seed

- [ ] `yesid.dev-cms/scripts/seed/index.ts` exists, runs via `bun run seed:dev` (Neon dev branch) and `bun run seed:prod` (Neon prod branch — gated by explicit env flag `SEED_TARGET=prod`).
- [ ] Seed is idempotent: running twice against the same branch produces zero diff in row counts, zero net changes in updated_at except for edited fields.
- [ ] Seed reads from sibling `../yesid.dev/` repo (path resolution relative to `scripts/seed/`); clear error if sibling not present.
- [ ] Seed derives `project.stack` + `service.stack` from TS `tech-stack.{relatedProjects,relatedServices}` inversions per D-rel-1. Never writes to tech-stack reverse edges (join-computed).
- [ ] Seed ignores TS `tech-stack.connectsTo` + `connectionNotes` (D-rel-2 defers inter-tech graph to engine-builder slice). Log one `[seed] Skipping tech-stack.connectsTo for <id>` line per tech item that had the field.
- [ ] Seed auto-creates a minimal tech-stack stub doc (id + name only) if a `project.stack` or `service.stack` references an id not present after the primary tech-stack seed pass.
- [ ] Seed creates Media docs for every file in `yesid.dev/static/images/projects/*.png`; project.image references them by Media ID.
- [ ] Seed converts blog markdown bodies to Lexical editor state per D7. Listing fields (title/excerpt/date/tags/svg/animation) port cleanly from frontmatter.
- [ ] All 10 globals populated from their TS source.
- [ ] Post-seed row counts (dev branch):
  - `projects` ≥ 2 (from `src/lib/content/projects.ts`)
  - `services` ≥ 6 (from `src/lib/content/services.ts`)
  - `blog-posts` ≥ 7 (5 professional + 2 personal, per current filesystem)
  - `tech-stack` ≥ 35 (current `src/content/stack/*.md` count; MAY GROW as stack pages are authored, so ≥)
  - `stack-scenarios` ≥ 7 (current `src/content/scenarios/*.md` count)
  - `media` ≥ (project image count — count matches static/images/projects filesystem)

### MCP

- [ ] `mcpPlugin()` in `payload.config.ts` registers all 5 new collections + all 10 globals (including site-meta extension) with `find + update` enabled.
- [ ] `users` + `media` NOT registered in `mcpPlugin()` (D10 exceptions).
- [ ] From a local MCP client (Claude Code's `yesid-cms-prod` server registered in 18a) → `tools/list` returns `find-<slug>` + `update-<slug>` for every registered collection/global.
- [ ] MCP `find-projects` returns at least one project post-seed, matching the admin UI + REST `/api/projects` three-way.
- [ ] MCP `find-tech-stack` returns flat fields + the `relatedProjects` / `relatedServices` join fields populated from the project/service source-of-truth side.

### Blob + Media

- [ ] `vercelBlobStorage.collections.media = true` committed in `payload.config.ts`.
- [ ] Vercel project has `yesid-dev-cms-media` Blob store linked (Yesid dashboard action, logged).
- [ ] Accidental `yesid-dev-cms-media2` duplicate store deleted (Yesid dashboard action, logged).
- [ ] `BLOB_READ_WRITE_TOKEN` still set in Vercel env (auto-refreshed by link).
- [ ] Test upload via admin UI: upload one project image → verify file lands in `yesid-dev-cms-media` Blob store → verify admin shows thumbnail → verify `alt` + `caption` editable → verify resized variants (`thumbnail`, `card`, `hero`) present in Blob.
- [ ] Public read of the uploaded Media URL returns the image without auth.

### DNS

- [ ] SPF + DKIM Cloudflare CNAMEs for `cms.yesid.dev` added (3–4 records per Resend dashboard output). Record names + targets captured in `log.md` (no secrets).
- [ ] Resend dashboard shows `cms.yesid.dev` as verified.
- [ ] Test send via admin → "Request password reset" for a test user → email arrives from `no-reply@cms.yesid.dev` at Yesid's inbox (not in spam, SPF/DKIM pass per email headers).

### Docs

- [ ] `yesid.dev/docs/slices/slice-18/slice-18b/{spec,plan,log,handoff}.md` all committed.
- [ ] `handoff.md` serves as PR B body.
- [ ] `yesid.dev/docs/reference/ARCHITECTURE.md` gains "Content model (Slice 18b)" subsection under the two-repo topology block.
- [ ] `yesid.dev/docs/slices/slice-18/README.md` 18b row marked `complete (2026-04-XX)` with PR A + PR B numbers.
- [ ] `yesid.dev-cms/README.md` gains "Seeding" + "Content model" sections.
- [ ] `yesid.dev-cms/scripts/seed/README.md` documents the script's role as a reference recipe.
- [ ] `yesid.dev/tree.txt` regenerated (diff = new slice-18b bundle dir + seed script dir).

### Negative checks (things that must NOT happen)

- [ ] `yesid.dev` has zero source-file changes under `src/` or `tests/`. Verify: `git diff main -- src/ tests/` returns empty.
- [ ] No `src/lib/cms-types.ts` in `yesid.dev` — 18c owns that file.
- [ ] No frontend fetch from `yesid.dev` to `cms.yesid.dev` in prod, preview, or local. Grep `yesid.dev/src` for `cms.yesid.dev` matches nothing.
- [ ] No `tags` collection registered in `payload.config.ts` (D-rel-3).
- [ ] No manual reverse-edge sync hooks in any collection `beforeChange`/`afterChange` (D-rel-1 — join fields replace hook-based sync).
- [ ] No `connections` / `connectsTo` field on `tech-stack` (D-rel-2 — inter-tech graph deferred to engine-builder slice).
- [ ] No `tech-connections` collection (D-rel-2 — inter-tech graph deferred).
- [ ] `users` + `media` NOT appearing in `mcpPlugin()` collections/globals registration.
- [ ] No preview or revalidation webhook route (`/preview/...`, `/api/revalidate`) exists in `yesid.dev-cms` or `yesid.dev` — 18f owns those.
- [ ] No draft/publish state wiring on any collection (`versions: { drafts: true }` not set).
- [ ] No custom React field components in `yesid.dev-cms`.

### Budget

- [ ] Neon usage over session 1 + session 2 ≤ 20 compute-hours on dev branch; ≤ 2 on prod (migration + seed only).
- [ ] Vercel Blob: ≤ 50 MB post-seed (project images only; no bulk media). Free tier allows 1 GB.
- [ ] No payment method on Neon or Vercel. Free tier hard-caps protect.

## Open questions (resolve at implementation time)

- **Q1.** Seed blog markdown → Lexical fidelity: use `@payloadcms/richtext-lexical/migrate`'s `convertMarkdownToLexical` if available, or a custom paragraph-splitter? **Default: probe for the official helper at 18b-8 Step 1**; fall back to custom converter if the version shipped in `yesid.dev-cms` doesn't expose it. Post-seed, Yesid re-authors any post that lost formatting via admin UI. Document chosen path in `log.md`.
- **Q2.** `hero-data.ts` (mock STM transit KPIs in yesid.dev) — keep in yesid.dev frontend or pull into Payload? **Default: keep in yesid.dev.** Mock data for a visual hero isn't editable content; dragging it into Payload adds an admin doc no one ever edits. Revisit in 18f cleanup.
- **Q3.** `services.icon` / `services.svg` / `services.lottieReverse` — filename strings to asset bundle files (`src/lib/assets/lottie/*.json`). Keep as strings or promote to Media relationships? **Default: keep as strings.** Service icons are kinetic-motion assets tied to the frontend build — editor upload surface adds no value at 18b. Revisit when client CMS templates want editor-swappable service icons.
- **Q4.** `project.image` — currently a filename (`'yesid-dev.png'`). Convert to Media relationship at seed? **Default: yes, Media relationship.** Editors in admin UI will upload new project images naturally; relationship field makes that the canonical path. Seed creates one Media doc per existing static image.
- **Q5.** `blog.svg` — same question as Q3/Q4. **Default: keep as string** in 18b. Blog SVGs are brand kinetic-motion fallbacks (Slice 17e), not arbitrary uploads. Revisit when the kinetic SVG library stabilizes for external authors.
- **Q6.** `project.repoUrl` / `liveUrl` / `readmeUrl` — URL validation tightness at Payload field level? **Default: text with a custom `validate: (v) => v == null || /^https?:\/\//.test(v) || 'Must be an https URL'`**. Payload has no first-class URL field; 3-line custom validator is sufficient. Admin UI shows the field with a "must be https" hint.
- **Q7.** `stack-scenarios.recommended` (TS: `string[]` of tech-stack IDs) → Payload. **Default: relationship to `tech-stack` with `hasMany: true`**. Same treatment as `projects.stack`. Rename field to `techs` per slice-18 README's relationship topology naming.
- **Q8.** `contact-content.web3formsKey` — stored as plain text? **Default: yes, plain text**. It's a public form endpoint ID, not a secret despite the field name. Rename to `web3formsEndpoint` if the name misleads editors; defer naming polish.
- **Q9.** Seed runtime: bun directly, or tsx shell? **Default: bun.** Matches repo runtime. `bun run scripts/seed/index.ts`. `.env` loaded via bun's native support. No tsx, no Node shim.
- **Q10.** Consolidated migration squash at 18b-7: keep per-task migration files 00002 + 00003 + 00004..., or squash to one `00002_initial_content`? **Default: squash.** `bunx payload migrate:fresh` on dev between local iterations; `bunx payload migrate:create --name initial-content` once when schema is final. Prod Neon branch applies exactly 2 migrations total (18a `00001_initial` + 18b `00002_initial_content`). If anything drifts later, generate a new migration — don't rewrite 00002.
- **Q11.** Seed `SEED_TARGET=prod` gate: require explicit env flag or ask interactively? **Default: explicit env flag.** Safer for CI-less workflows. `bun run seed:prod` alias checks `SEED_TARGET === 'prod'` and the pooled connection string targets the prod branch; missing flag exits early with help text.
- **Q12.** Seed upsert: `overwriteExistingFields: true` semantic (wipe → recreate) or partial merge (only write seed-sourced fields, preserve everything else)? **Default: partial merge.** Seed script touches only the fields it's importing. Any admin-UI-edited field outside the seed shape is preserved. Re-seeding to refresh content from TS is safe; editor work isn't overwritten.
- **Q13.** Payload `versions: { drafts: true }` on any collection/global? **Default: NO for 18b.** Drafts add a publish workflow that 18f's preview route will need — defer until then. 18b keeps direct-publish semantics (admin Save = immediately public).
- **Q14.** Resend DNS via Cloudflare dashboard (manual) or via Cloudflare API token + REST? **Default: manual dashboard** (per D11). 3–4 records, one-time. Token would be a new secret to manage with no recurring benefit.

## Risks carried into the plan

1. **Circular relationship migration:** projects.services → services, services.stack → tech-stack, projects.stack → tech-stack, tech-stack has `join` back to projects + services. Payload handles the DDL order internally, but if any collection registers before its dependencies, `bunx payload migrate:create` may emit an awkward schema. **Mitigation:** register collections in `payload.config.ts` in the hub-first order per D9 (`tech-stack`, `services`, `projects`, `blog-posts`, `stack-scenarios`). Verify at 18b-7 via `bunx payload migrate:fresh` on a clean Neon dev branch.

2. **Localization + required-field interaction:** `required: true` + `localized: true` on same field. If seed only provides `en`, Payload's default fallback behavior may or may not raise a validation error when writing. **Mitigation:** `fallback: true` in localization config (18a D8) is supposed to make missing locales non-fatal at the data layer; verify at 18b-1 by creating a localized-required field, saving only `en`, refreshing — value should still show in all 3 locale tabs. If not, drop `required` from localized fields (acceptable — en has content per the TS contract).

3. **Seed script Payload initialization:** `scripts/seed/index.ts` imports Payload Local API outside of a Next.js process. The `@payloadcms/next` adapter assumes a Next.js context; bare Node/bun scripts need `getPayload({ config: await importConfig() })`. **Mitigation:** use Payload docs' canonical "local API script" pattern + bun-native TS import of `payload.config.ts`. If bun shim needed, document in `log.md`. Worst case: fall back to `tsx` for the seed script only (one deviation from D9 runtime rule, recorded).

4. **Lexical markdown conversion fidelity loss:** Default converter may drop code fences, nested lists, or inline formatting. **Mitigation:** post-seed, Yesid re-authors affected posts in admin UI. Document the conversion's known loss modes in `scripts/seed/README.md`. For 18b acceptance, body loading as plain paragraphs is sufficient; rich fidelity is post-seed concern.

5. **Blob store scope mismatch:** If the linked `yesid-dev-cms-media` store's scope differs from the Vercel project scope, uploads will 403. **Mitigation:** Yesid verifies in the dashboard that the store is "Connected" (not "Available") to `yesid-dev-cms` Vercel project after link; test upload before flipping `collections.media = true` in config.

6. **Seed duration > Vercel build timeout if run in build:** Not a concern — seed is NOT part of build (D13). Only ever runs manually. **No mitigation needed**; risk documented to prevent accidental CI-wiring.

7. **Seed idempotency edge case — removed TS content:** If a blog post is deleted from `yesid.dev/src/content/blog/` after seeding once, re-running the seed doesn't delete the corresponding Payload doc (upsert-only). **Mitigation:** document this "seed = upsert only, never delete" semantic in `scripts/seed/README.md`. If editor workflow ever needs "content removed in source = content removed in Payload", add an `--orphan-delete` flag to the seed; deferred until real need.

8. **Payload `join` field requires Payload ≥ 3.20** (approx — confirm during 18b-1 against `yesid.dev-cms` package.json 3.83). **Mitigation:** at 18b-1 Step 1, confirm Payload version supports `type: 'join'`. If older, either upgrade Payload to a version that supports it (low risk — 3.83 is already recent) or fall back to a `beforeChange` hook pattern (adds 50 lines of manual sync code per reverse edge — acceptable but worse). Record choice in `log.md`.

9. **MCP `update` operation on globals with localized fields:** `plugin-mcp` may or may not expose `locale` as a parameter on update tools in the current version. **Mitigation:** at 18b-1, after extending site-meta, verify via `curl` that `update-site-meta` accepts a `locale` param OR defaults to `defaultLocale`. If the update surface doesn't expose locale, document as a plugin gap — 18b updates still happen via admin UI / REST for now; MCP becomes write-en-only, read-any-locale.

10. **Vercel Blob free-tier cap:** 1 GB. Project images post-seed should be well under 50 MB. **Mitigation:** count + measure at seed completion; if over 500 MB, reassess `imageSizes` defaults (maybe downshift hero to 800×600). Unlikely at 18b volume.

11. **Windows Git Bash `\r` contamination on env vars** (carried from 18a risk register). Relevant if any 18b task pipes openssl/random output into `vercel env add`. **Mitigation:** use literal strings in env commands; if piping, `tr -d '\r'` first. Document pattern in `scripts/seed/README.md` for anyone else running the seed from Windows.

12. **Sibling-repo path assumption:** Seed reads `../yesid.dev/` — if Yesid moves repos, seed breaks. **Mitigation:** env var `SEED_SOURCE_REPO_PATH` overrides default relative path. Script prints the resolved path at startup so misconfiguration is obvious.

13. **Auto-stub-creation drift (D-rel-2):** If a TS project references a tech id (e.g., `'kubernetes'`) that isn't in the `tech-stack.ts` TS source, the seed silently creates a minimal stub. Over time, tech-stack acquires half-filled docs with only `id` + `name` set. **Mitigation:** seed logs a `[seed] Stub-created tech-stack <id> (no TS source)` warning for each stub, aggregated as a post-seed report. Yesid reviews the report and fills the stubs in admin UI or adds the tech to the TS source before re-seeding. If stub-creation becomes noisy (> 5 stubs per run), promote to a hard error and require TS source to include every referenced tech explicitly.

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-21 | Initial spec | Planning session at 18b start. 18a shipped infrastructure + heartbeat; 18b grows the full content model in one consolidated migration + seeds from sibling yesid.dev repo. |
| 2026-04-21 | D-rel-1 added — Payload `join` fields for reverse edges | Per Yesid's direction: collapse the denormalization, no two-place drift. Source-of-truth is on the projects + services side; tech-stack auto-populates `relatedProjects` + `relatedServices` via `join` fields. Services gains a new explicit `stack` field (absent in TS — the edge was only on tech-stack.relatedServices). |
| 2026-04-21 | D-rel-2 added — `tech-stack.connections` as nested `Array<{target, note}>` | Per Yesid's direction: replace the parallel `connectsTo: string[]` + `connectionNotes: Record<string,string>` TS shape with a single nested array. `Record` doesn't model cleanly in Payload; nested array gives relationship validation + optional note per edge. Graduate to a separate `tech-connections` collection only if asymmetric per-direction notes become a real need. |
| 2026-04-21 | D-rel-2 amended — tech-stack is flat in 18b; NO explicit inter-tech relationships. Auto-stub-creation at seed. | Per Yesid's direction later same day: "keep tech stack simple and just have a collection created… tech skills will be auto created if a project or service calls them up and it doesnt already exist. For the relationship between stack for the moment will be just if they share project or service. In the future when I build the engine i will work on relation but for the moment it wont be necessary that goes into the engine builder slice." Reverses the nested-array design decided earlier today. tech-stack becomes a flat labels collection (id, name, layer, domains, icon, proficiency + join fields). Seed drops `connectsTo` + `connectionNotes` from TS source and logs a skip line per item. Auto-creates stub tech-stack docs when referenced by projects/services but not yet present. Tech-tech relatedness stays implicit (shared projects/services — query-time computation, not stored). Explicit graph lands in a future engine-builder slice. |
| 2026-04-21 | D-rel-3 added — tags stay free strings | Per Yesid's direction: reject a `tags` collection at 18b. < 30 distinct tags, no cross-collection references, easy to promote later. Keep `project.tags` + `blog.tags` as `text[]`. |
| 2026-04-21 | D-rel-4 added — Media extension: caption (localized) + credit (text); no MCP | Per Yesid's direction: admin-friendly alt/caption/credit triad; MCP write path doesn't fit multipart uploads today. Scaffold's existing minimal Media collection extends cleanly into D-rel-4's shape + flips vercelBlobStorage.collections.media = true. |
| 2026-04-21 | D12 amended — branch-per-sub-slice instead of direct-to-main on `yesid.dev-cms` | Per Yesid's direction mid-18b-2: "why are we working on main?" Codex adversarial-review needs a branch-vs-main diff to auto-scope correctly (default scope returned empty on main); PR-review surface is a better audit UI than `git log`; revert-by-PR is cleaner than cherry-picking main commits. Retrofitted by creating `slice-18b` branch at HEAD (carrying commits `21642ce` + `2c881ed` + `57140fc`), then `git reset --hard c3e1c7b` + force-push on main. Tasks 18b-3 onwards commit to `slice-18b`. PR A opens `slice-18b` → `main` at 18b-10. This supersedes spec D12's inherited-from-18a direct-push stance. Future sub-slices (18c+) follow the same branch-per-sub-slice pattern. |
