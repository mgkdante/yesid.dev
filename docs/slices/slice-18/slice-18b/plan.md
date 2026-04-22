# Sub-Slice 18b — Content Model + Seed · Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Sequencing:** 10 tasks across **two repos** — 8 in `yesid.dev-cms` (code + migration + seed + DNS), 1 cross-repo (prod verification), 1 in `yesid.dev` (docs close). Tasks roughly sequential. 18b-9 Resend DNS can overlap with 18b-1 → 18b-8 locally because propagation is async.

**Runtime:**
- `yesid.dev-cms`: bun (Node 22), per 18a D1.
- `yesid.dev`: bun, unchanged.

**Canonical commands:**

| Purpose | Command |
|---------|---------|
| Install deps | `bun install` |
| Add dep | `bun add <pkg>` |
| Dev server | `bun dev` |
| Prod build | `bun run build` |
| Type check | `bunx tsc --noEmit` |
| Create migration | `bunx payload migrate:create --name <name>` |
| Apply migrations | `bunx payload migrate` |
| Reset dev DB | `bunx payload migrate:fresh` |
| Regenerate types | `bunx payload generate:types` |
| Regenerate importmap | `bunx payload generate:importmap` |
| Seed (dev branch) | `bun run seed:dev` |
| Seed (prod branch) | `SEED_TARGET=prod bun run seed:prod` |

**Commit prefixes:**
- `yesid.dev-cms`: `feat(cms-slice-18b): …` (schema, migrations, MCP), `chore(cms-slice-18b): …` (env, blob flip, deps), `docs(cms-slice-18b): …` (README updates, seed README).
- `yesid.dev`: `docs(slice-18b): …` (this bundle, ARCHITECTURE update, sub-slice row).

**Two-PR close protocol (per spec D12):** PR A in `yesid.dev-cms` (substantive) → merges first; PR B in `yesid.dev` (docs, references PR A URL) → merges second → `bun run slice:close 18b` archives the bundle.

**Session layout:**
- Session 1 (Tasks 18b-1 → 18b-7): schema definition on Neon dev branch. Local heartbeat + local seed. No prod touches.
- Session 2 (Tasks 18b-8 → 18b-10): consolidated migration to prod Neon branch, prod seed, Resend DNS, close. Real-time gates: DNS propagation (~15 min), prod deploy (~2 min), prod seed (~30 s).

---

## Task 18b-1 — Extend `site-meta` global + verify Payload ≥ 3.20 `join` support

**Repo:** `yesid.dev-cms`.

**Goal:** Grow 18a's heartbeat `site-meta` global from `{ siteName, deployedAt }` to the full spec-D9 shape (`siteName`, `tagline: LocalizedString`, `description: LocalizedString`, `links: { email, github, linkedin, upwork }`). Confirm Payload's `type: 'join'` field is supported in the installed version (3.83.0 per 18a handoff — well past 3.20 cutoff). Warm-up task: one migration, one schema change, verifies local dev loop still works from 18a.

**Files:**
- Modify: `src/globals/SiteMeta.ts`
- Modify: `payload.config.ts` (no changes expected — just verify globals array structure)

**Canonical `src/globals/SiteMeta.ts` post-18b-1 shape:**

```ts
import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const SiteMeta: GlobalConfig = {
  slug: 'site-meta',
  admin: {
    group: 'Pages',
    description: 'Site-wide metadata — brand name, tagline, description, and social/outreach links.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'yesid.' },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'description', type: 'text', localized: true, admin: { description: 'Used for <meta name="description">. Keep under 160 chars for SEO.' } },
    {
      name: 'links',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'github', type: 'text', admin: { description: 'Full https URL.' } },
        { name: 'linkedin', type: 'text', admin: { description: 'Full https URL.' } },
        { name: 'upwork', type: 'text', admin: { description: 'Full https URL.' } },
      ],
    },
    {
      name: 'deployedAt',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-set by beforeChange hook on every save; ISO timestamp.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => ({ ...data, deployedAt: new Date().toISOString() }),
    ],
  },
}
```

**Steps:**

- [ ] **Step 1:** Verify Payload version supports `type: 'join'`. Run:
  ```bash
  cd ~/Yesito/Projects/yesid-dev-cms
  grep '"payload"' package.json
  ```
  Expect `"payload": "3.83.0"` or higher. If lower than 3.20, stop and upgrade per spec risk 8 (unlikely — 18a installed 3.83).
- [ ] **Step 2:** Open `src/globals/SiteMeta.ts`. Replace the heartbeat-only fields with the post-18b-1 shape above. Preserve the `beforeChange` hook.
- [ ] **Step 3:** Run `bunx tsc --noEmit`. Verify zero errors.
- [ ] **Step 4:** Generate a local migration on the dev Neon branch to verify the schema change is capturable. Run:
  ```bash
  bunx payload migrate:create --name probe-site-meta-extension
  ```
  Verify the generated `migrations/<timestamp>_probe-site-meta-extension.ts` includes `ADD COLUMN tagline`, `ADD COLUMN description`, a new `site-meta_links` table (or inlined `links_*` columns — whichever Payload chose for the group), etc.
- [ ] **Step 5:** Apply the probe migration locally:
  ```bash
  bunx payload migrate
  ```
  Verify output says applied.
- [ ] **Step 6:** `bun dev` → log in at `localhost:3000/admin` → Globals → Site Meta → edit `tagline` (EN tab) to `Digital infrastructure that moves.` and `description` (EN tab) to `Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.` + fill `links` with yesid.dev's values. Save. Switch to FR tab → verify the EN fallback shows via the localization config (fallback: true per 18a D8).
- [ ] **Step 7:** REST verify: `curl http://localhost:3000/api/globals/site-meta` → expect the new fields in the JSON.
- [ ] **Step 8:** MCP verify: from Claude Code / any configured MCP client, call `find-site-meta` tool → expect new fields.
- [ ] **Step 9:** **DELETE the probe migration** (it gets consolidated into `00002_initial_content` at 18b-7):
  ```bash
  rm migrations/*probe-site-meta-extension*
  # re-generate the barrel
  bunx payload migrate:create --name noop-reset  # produces an empty migration after the fresh reset
  rm migrations/*noop-reset*
  # confirm barrel is still clean
  ```
  Instead: `bunx payload migrate:fresh` and reapply ONLY the authentic base migration:
  ```bash
  bunx payload migrate:fresh  # wipes all tables, resets migrations table
  bunx payload migrate        # re-applies 00001_initial (the 18a baseline) only
  ```
  Verify `SELECT * FROM payload_migrations;` shows only `00001_initial`.
- [ ] **Step 10:** Re-verify schema picks up SiteMeta extension without a migration file when running with `push: false` — it shouldn't. That's the point; the final consolidated migration at 18b-7 captures it. So at this step, your `bun dev` will log a warning about schema drift, which is expected until 18b-7.
- [ ] **Step 11:** Commit the SiteMeta.ts change only.

```bash
cd ~/Yesito/Projects/yesid-dev-cms
git add src/globals/SiteMeta.ts
git commit -m "feat(cms-slice-18b): extend site-meta global with tagline, description, links group"
git push
```

**STOP criteria:**
- `src/globals/SiteMeta.ts` has the full post-18b-1 shape.
- `bunx tsc --noEmit` green.
- `payload_migrations` table has exactly 1 row (`00001_initial`). No 18b-task-specific migration files in `migrations/` directory.
- Commit pushed to `origin/main`.

---

## Task 18b-2 — Add `tech-stack` + `blog-posts` collections (no outbound relationships)

**Repo:** `yesid.dev-cms`.

**Goal:** Add the two independent collections — tech-stack (flat labels per D-rel-2) and blog-posts (Lexical body, no relationships). Tech-stack goes first because projects + services will reference it in 18b-3 + 18b-4.

**Files:**
- Create: `src/collections/TechStack.ts`
- Create: `src/collections/BlogPosts.ts`
- Modify: `src/payload.config.ts` (register both, register in mcpPlugin)

**Canonical `src/collections/TechStack.ts`** — see spec D-rel-2 for the full shape. Copy-paste from spec unchanged. Ensure the two `join` fields at the end point at `projects` + `services` collections via their `stack` field (those collections don't exist yet — Payload resolves `join` references lazily at query time, so defining them now is fine; migration won't error until 18b-3 + 18b-4 add the collections).

**Canonical `src/collections/BlogPosts.ts`:**

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'lang'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'excerpt', type: 'textarea', required: true, localized: true, admin: { description: 'Listing-card summary. 1-2 sentences.' } },
    { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'lang',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English',  value: 'en' },
        { label: 'French',   value: 'fr' },
        { label: 'Spanish',  value: 'es' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Professional', value: 'professional' },
        { label: 'Personal',     value: 'personal' },
      ],
    },
    { name: 'tags', type: 'text', hasMany: true, admin: { description: 'Free-string tags (D-rel-3).' } },
    {
      name: 'animation',
      type: 'select',
      defaultValue: 'draw',
      options: [
        { label: 'Draw',     value: 'draw' },
        { label: 'Morph',    value: 'morph' },
        { label: 'Draw-Fill', value: 'draw-fill' },
      ],
    },
    { name: 'svg', type: 'text', admin: { description: 'SVG filename in yesid.dev assets (per Q5, stays as string in 18b).' } },
    { name: 'url', type: 'text', admin: { description: 'Custom override URL. Leave blank to use /blog/<slug>.' } },
    { name: 'external', type: 'checkbox', defaultValue: false },
    { name: 'body', type: 'richText', required: true, localized: true },
  ],
}
```

**Steps:**

- [ ] **Step 1:** Create `src/collections/TechStack.ts` with the exact shape from spec D-rel-2.
- [ ] **Step 2:** Create `src/collections/BlogPosts.ts` with the pattern above.
- [ ] **Step 3:** Register both in `src/payload.config.ts`. Order in `collections: []` array (hub-first per D9):

```ts
import { TechStack } from './collections/TechStack'
import { BlogPosts } from './collections/BlogPosts'
// ...existing Users, Media imports...

collections: [TechStack, BlogPosts, Users, Media],
// services, projects, stack-scenarios slot in between TechStack and Users in later tasks
```

- [ ] **Step 4:** Extend `mcpPlugin()` in `payload.config.ts` (per D10):

```ts
mcpPlugin({
  collections: {
    'tech-stack': {
      enabled: { find: true, update: true },
      description: 'Tech stack labels — PostgreSQL, Python, TypeScript, etc. Flat (D-rel-2); inter-tech graph deferred.',
    },
    'blog-posts': {
      enabled: { find: true, update: true },
      description: 'Blog posts with Lexical rich-text body. Professional + personal streams.',
    },
  },
  globals: {
    'site-meta': { enabled: { find: true, update: true }, description: '...existing...' },
  },
})
```

- [ ] **Step 5:** `bunx tsc --noEmit` → expect green (TechStack's `join` field references to `projects` + `services` may generate warnings since those collections don't exist yet; verify they're warnings, not errors — Payload types are lenient at compile time for join refs). If errors: temporarily comment the `relatedProjects` + `relatedServices` join fields on TechStack.ts; re-enable in 18b-3 + 18b-4.
- [ ] **Step 6:** `bunx payload generate:importmap` (Payload regenerates the admin import map for new field types).
- [ ] **Step 7:** `bun dev` → admin UI → verify "Content" group shows Tech Stack + Blog Posts (empty). Users + Media still under "System" (admin.group added on them in 18b-6 task but Users still defaults to "System" via payload.config.ts admin.user config from 18a).
- [ ] **Step 8:** Create a test tech-stack entry via admin UI: `id=postgresql, name=PostgreSQL, layer=data, domains=[data-engineering], icon=postgresql, proficiency=expert`. Save. Verify it shows in the list view.
- [ ] **Step 9:** Create a test blog-post via admin UI: `slug=test-post, title=Test, excerpt=Hello, date=2026-04-21, lang=en, category=professional, body=<type one paragraph>`. Save. Verify.
- [ ] **Step 10:** Delete the test entries (cleanup for pre-migration state — fresh consolidated migration at 18b-7 expects no rows from manual UI entry, because seed at 18b-8 is the canonical data source).
- [ ] **Step 11:** Commit.

```bash
git add src/collections/TechStack.ts src/collections/BlogPosts.ts src/payload.config.ts
git commit -m "feat(cms-slice-18b): add tech-stack + blog-posts collections with MCP registration"
git push
```

**STOP criteria:**
- `src/collections/TechStack.ts` + `src/collections/BlogPosts.ts` exist.
- Both registered in `payload.config.ts` + `mcpPlugin()`.
- `bunx tsc --noEmit` green.
- Admin UI shows both under Content group, editable, saveable, deletable.
- No test entries remain post-task.

---

## Task 18b-3 — Add `services` collection (relationship → tech-stack; reverse-join for projects)

**Repo:** `yesid.dev-cms`.

**Goal:** Services collection with source-of-truth `stack` relationship → tech-stack (per D-rel-1 — new field; TS didn't have explicit service.stack) + reverse `join` for relatedProjects (auto-computed from projects.services once projects exist in 18b-4). Sections array (D2). Localized prose fields (D4).

**Files:**
- Create: `src/collections/Services.ts`
- Modify: `src/payload.config.ts` (register, mcpPlugin entry)

**Canonical `src/collections/Services.ts`:**

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

const httpsUrlValidate = (v: string | null | undefined) =>
  v == null || v.length === 0 || /^https:\/\//.test(v) || 'Must be an https URL'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    group: 'Content',
    useAsTitle: 'id',
    defaultColumns: ['id', 'station', 'visible'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'id', type: 'text', required: true, unique: true, index: true, admin: { description: 'Stable slug id, e.g. "sql-development".' } },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    { name: 'longDescription', type: 'textarea', localized: true },
    { name: 'valueProposition', type: 'textarea', localized: true },
    { name: 'station', type: 'number', required: true },
    { name: 'icon', type: 'text', admin: { description: 'Lottie/icon filename (kept as string per Q3).' } },
    { name: 'svg', type: 'text', admin: { description: 'SVG filename (kept as string per Q3).' } },
    { name: 'lottieReverse', type: 'checkbox', defaultValue: false },
    { name: 'visible', type: 'checkbox', defaultValue: true },
    {
      name: 'deliverables',
      type: 'array',
      localized: true,
      labels: { singular: 'Deliverable', plural: 'Deliverables' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'content', type: 'textarea', required: true, localized: true },
      ],
    },
    { name: 'benefitHeadline', type: 'text', localized: true },
    {
      name: 'impactMetric',
      type: 'group',
      fields: [
        { name: 'value', type: 'text', localized: true },
        { name: 'label', type: 'text', localized: true },
      ],
    },
    // Source of truth for tech relationships (D-rel-1):
    {
      name: 'stack',
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
    },
    // Reverse-join from projects.services (D-rel-1):
    {
      name: 'relatedProjects',
      type: 'join',
      collection: 'projects',
      on: 'services',
      admin: { readOnly: true, description: 'Auto-computed from project.services; edit on the Projects side.' },
    },
  ],
}
```

**Steps:**

- [ ] **Step 1:** Create `src/collections/Services.ts` with the pattern above.
- [ ] **Step 2:** Register in `src/payload.config.ts` collections array between TechStack and BlogPosts (hub-first order per D9):
  ```ts
  collections: [TechStack, Services, BlogPosts, Users, Media],
  ```
  (projects + stack-scenarios insert in 18b-4 + 18b-5.)
- [ ] **Step 3:** Add Services to `mcpPlugin()` collections entry:
  ```ts
  services: {
    enabled: { find: true, update: true },
    description: 'Service offerings — SQL Development, Data Pipelines, etc. Source-of-truth stack relationship; reverse-join relatedProjects.',
  },
  ```
- [ ] **Step 4:** `bunx tsc --noEmit` → expect green. The `relatedProjects` join field references `projects` which still doesn't exist — Payload should warn at schema-check time but TS should pass. If TS errors, temporarily comment the `relatedProjects` join field on Services.ts (uncomment at 18b-4 after projects collection lands).
- [ ] **Step 5:** `bunx payload generate:importmap`.
- [ ] **Step 6:** `bun dev` → admin UI → Content → Services → create a test service: `id=sql-development, title.en=SQL Development, description.en=Test, station=1, stack=[postgresql (pick from dropdown referencing Task 18b-2's tech-stack entry)]`. Save. Go back to tech-stack postgresql → verify `relatedServices` join field (added on TechStack.ts in 18b-2) shows the test service. **This is the first proof of D-rel-1 end-to-end.**
- [ ] **Step 7:** Delete test service + the postgresql tech-stack entry (cleanup — seed is canonical source).
- [ ] **Step 8:** Commit.

```bash
git add src/collections/Services.ts src/payload.config.ts
git commit -m "feat(cms-slice-18b): add services collection with stack relationship + relatedProjects join field"
git push
```

**STOP criteria:**
- Services collection defined, registered, MCP-enabled.
- `bunx tsc --noEmit` green.
- D-rel-1 proven locally: creating a service with `stack=[postgresql]` auto-populates `tech-stack/postgresql.relatedServices` via the join field.
- No test entries remain.

---

## Task 18b-4 — Add `projects` collection (relationships → services + tech-stack; impactMetric group + impactMetrics array; Media relationship for image)

**Repo:** `yesid.dev-cms`.

**Goal:** Projects collection — the heaviest schema. Source-of-truth `services` + `stack` relationships (per D-rel-1). Sections array (D2). Dual impact shape: `impactMetric` group (single, home-page variant) + `impactMetrics` array (multi, detail-page variant). Project image as Media relationship (per Q4).

**Files:**
- Create: `src/collections/Projects.ts`
- Modify: `src/payload.config.ts` (register, mcpPlugin entry)
- Modify: `src/collections/TechStack.ts` + `src/collections/Services.ts` — uncomment `relatedProjects` join fields if they were commented in 18b-2 / 18b-3.

**Canonical `src/collections/Projects.ts`:**

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

const httpsUrlValidate = (v: string | null | undefined) =>
  v == null || v.length === 0 || /^https:\/\//.test(v) || 'Must be an https URL'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'Content',
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'status', 'featured'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'oneLiner', type: 'textarea', required: true, localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Public',  value: 'public' },
        { label: 'Private', value: 'private' },
        { label: 'WIP',     value: 'wip' },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'tags', type: 'text', hasMany: true },
    // Source-of-truth relationships (D-rel-1):
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Service offerings this project fulfills. Authors the projects↔services edge.' },
    },
    {
      name: 'stack',
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
      admin: { description: 'Tech items this project uses. Authors the projects↔tech-stack edge.' },
    },
    // URLs (Q6 — custom https validator):
    { name: 'repoUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'liveUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'readmeUrl', type: 'text', validate: httpsUrlValidate },
    // Project image as Media relationship (Q4):
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Project cover image. Uploads land in Vercel Blob.' },
    },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'content', type: 'textarea', required: true, localized: true },
      ],
    },
    // Single impact metric for home/listing card (services-grid variant):
    {
      name: 'impactMetric',
      type: 'group',
      fields: [
        { name: 'value', type: 'text', admin: { description: 'e.g. "3x faster"' } },
        { name: 'label', type: 'text', localized: true, admin: { description: 'e.g. "avg query improvement"' } },
        { name: 'before', type: 'text', admin: { description: 'Optional "before" value for comparison displays.' } },
      ],
    },
    // Multiple metrics for detail-page glance panel:
    {
      name: 'impactMetrics',
      type: 'array',
      labels: { singular: 'Impact Metric', plural: 'Impact Metrics' },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'before', type: 'text' },
      ],
    },
    { name: 'location', type: 'text' },
    { name: 'environment', type: 'text' },
    { name: 'version', type: 'text' },
  ],
}
```

**Steps:**

- [ ] **Step 1:** Create `src/collections/Projects.ts` with the pattern above.
- [ ] **Step 2:** If `src/collections/TechStack.ts` has its `relatedProjects` join field commented (from 18b-2 Step 5 fallback), uncomment now. Similarly uncomment Services.ts `relatedProjects` if needed.
- [ ] **Step 3:** Register in `payload.config.ts` collections array:
  ```ts
  collections: [TechStack, Services, Projects, BlogPosts, Users, Media],
  ```
- [ ] **Step 4:** Extend `mcpPlugin().collections` with:
  ```ts
  projects: {
    enabled: { find: true, update: true },
    description: 'Portfolio projects. Source-of-truth services + stack relationships; image via Media upload.',
  },
  ```
- [ ] **Step 5:** `bunx tsc --noEmit` → expect green. If errors on Services' `relatedProjects` join field, verify it's uncommented + references `projects` via `on: 'services'`.
- [ ] **Step 6:** `bunx payload generate:importmap`.
- [ ] **Step 7:** `bun dev` → admin UI → Content → Projects → create test entry:
  - slug=test-proj, title.en=Test Project, oneLiner.en=Hello, description.en=Desc, status=public, featured=true
  - services=[sql-development (from 18b-3 test if still present; else create a new service first)]
  - stack=[postgresql (create tech-stack entry first)]
  - impactMetric.value=3x faster, impactMetric.label.en=query speedup
  - impactMetrics[]: add two rows
  - Leave image blank (Media upload gets tested in 18b-6).
- [ ] **Step 8:** Save. Navigate to the test service → verify `relatedProjects` join field shows the test project. Navigate to postgresql tech-stack → verify `relatedProjects` shows the test project. **D-rel-1 fully proven both ways.**
- [ ] **Step 9:** Delete test project + test service + test tech-stack entry.
- [ ] **Step 10:** Commit.

```bash
git add src/collections/Projects.ts src/collections/Services.ts src/collections/TechStack.ts src/payload.config.ts
git commit -m "feat(cms-slice-18b): add projects collection with services + stack relationships + impact metrics"
git push
```

**STOP criteria:**
- Projects collection defined, registered, MCP-enabled.
- TechStack + Services join fields uncommented + functional.
- `bunx tsc --noEmit` green.
- D-rel-1 proven both directions: services.relatedProjects + tech-stack.relatedProjects both populate when a project references them.
- No test entries remain.

---

## Task 18b-5 — Add `stack-scenarios` collection (relationship → tech-stack + projects); extend Media collection

**Repo:** `yesid.dev-cms`.

**Goal:** Final content collection — stack-scenarios with `techs` (renamed from TS `recommended` per Q7) + `relatedProjects` relationships. Extend Media per D-rel-4 (caption localized, credit, imageSizes, localized alt, admin.group).

**Files:**
- Create: `src/collections/StackScenarios.ts`
- Modify: `src/collections/Media.ts`
- Modify: `src/payload.config.ts` (register StackScenarios, mcpPlugin entry; Media registration unchanged but admin.group added)

**Canonical `src/collections/StackScenarios.ts`:**

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const StackScenarios: CollectionConfig = {
  slug: 'stack-scenarios',
  admin: {
    group: 'Content',
    useAsTitle: 'id',
    defaultColumns: ['id', 'domains'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'id', type: 'text', required: true, unique: true, index: true },
    {
      name: 'domains',
      type: 'select',
      hasMany: true,
      required: true,
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
    {
      name: 'techs',  // renamed from TS 'recommended' per Q7
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
      required: true,
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
    },
    { name: 'summary', type: 'textarea', required: true, localized: true },
  ],
}
```

**Canonical extended `src/collections/Media.ts`** — already specified in spec D-rel-4. Copy-paste.

**Steps:**

- [ ] **Step 1:** Create `src/collections/StackScenarios.ts` with the pattern above.
- [ ] **Step 2:** Overwrite `src/collections/Media.ts` with the D-rel-4 shape (add caption localized, credit, imageSizes, localized alt, admin.group: 'System').
- [ ] **Step 3:** Register StackScenarios in `payload.config.ts` collections array:
  ```ts
  collections: [TechStack, Services, Projects, BlogPosts, StackScenarios, Users, Media],
  ```
- [ ] **Step 4:** Extend `mcpPlugin().collections` with:
  ```ts
  'stack-scenarios': {
    enabled: { find: true, update: true },
    description: 'Build-Your-Stack configurator scenarios. References tech-stack + projects.',
  },
  ```
  Note: Media is NOT added to mcpPlugin (D-rel-4).
- [ ] **Step 5:** Add admin.group to Users collection so it shows in the "System" group:
  ```ts
  // src/collections/Users.ts — add/adjust admin block
  admin: {
    group: 'System',
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  ```
- [ ] **Step 6:** `bunx tsc --noEmit` → expect green.
- [ ] **Step 7:** `bunx payload generate:importmap`.
- [ ] **Step 8:** `bun dev` → verify admin UI sidebar shows three groups: "Pages" (site-meta — only global so far), "Content" (Tech Stack, Services, Projects, Blog Posts, Stack Scenarios), "System" (Users, Media).
- [ ] **Step 9:** Quick smoke: create a test tech-stack entry (postgresql) + test service (sql) + test project (proj) + test stack-scenario (id=test, domains=[web-development], techs=[postgresql], relatedProjects=[proj], summary.en=test). Save. Delete all in reverse order.
- [ ] **Step 10:** Commit.

```bash
git add src/collections/StackScenarios.ts src/collections/Media.ts src/collections/Users.ts src/payload.config.ts
git commit -m "feat(cms-slice-18b): add stack-scenarios collection + extend Media with caption/credit/imageSizes + Users admin.group"
git push
```

**STOP criteria:**
- StackScenarios collection exists, registered, MCP-enabled.
- Media extended per D-rel-4.
- All 5 content collections defined: TechStack, Services, Projects, BlogPosts, StackScenarios.
- Admin sidebar shows correct groups.
- `bunx tsc --noEmit` green.

---

## Task 18b-6 — Add 9 remaining globals with admin.group: 'Pages'

**Repo:** `yesid.dev-cms`.

**Goal:** Define 9 new globals mapping 1:1 from yesid.dev content modules. Each lives in `src/globals/<Name>.ts`. Ordering in `globals: []` follows the site-walk sequence from spec D9.

**Files:**
- Create: `src/globals/HomeContent.ts`
- Create: `src/globals/ServicesPage.ts`
- Create: `src/globals/ProjectsPage.ts`
- Create: `src/globals/BlogPage.ts`
- Create: `src/globals/TechStackPage.ts`
- Create: `src/globals/AboutContent.ts`
- Create: `src/globals/ContactContent.ts`
- Create: `src/globals/NavLinks.ts`
- Create: `src/globals/ErrorPages.ts`
- Modify: `src/payload.config.ts` (register all 9 + extend mcpPlugin.globals with 9 new entries)

**Shape strategy:** each global mirrors the TS source's top-level shape. Deeply nested content (like `site-content.ts`'s `heroContent.sqlPanel.columns`) maps to Payload `group` fields. Arrays of objects map to `array` fields. Free-string arrays map to `text[] hasMany`. Every user-facing prose field gets `localized: true`.

**Canonical pattern — `src/globals/HomeContent.ts` (abridged, representative; full shape lands at implementation time by copy-porting from `yesid.dev/src/lib/content/site-content.ts`):**

```ts
import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  admin: { group: 'Pages', description: 'Home page — hero, manifesto, journey, proof reel, services grid, closer.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'headline',
          type: 'group',
          fields: [
            { name: 'line1', type: 'text', required: true, localized: true },
            { name: 'line2', type: 'text', required: true, localized: true },
            { name: 'ariaSuffix', type: 'text', required: true, localized: true },
          ],
        },
        { name: 'subheadline', type: 'text', required: true, localized: true },
        { name: 'subtitle', type: 'textarea', required: true, localized: true },
        { name: 'ctaWork', type: 'text', required: true, localized: true },
        { name: 'ctaContact', type: 'text', required: true, localized: true },
        // sqlPanel and refreshButton ports similarly as nested groups — omitted in this plan excerpt for brevity.
      ],
    },
    {
      name: 'manifesto',
      type: 'group',
      fields: [
        // Statement / terminal / pills / edgeLeft / edgeRight — all as nested groups + arrays.
      ],
    },
    // journey, proof, servicesGrid, closer — all follow the same pattern.
  ],
}
```

> **Implementation note:** the HomeContent shape is the largest global. Use a two-pass approach in 18b-6 Step 1: first draft the top-level groups, verify tsc green; then fill in nested fields. Don't try to author the whole thing in one TS file edit — iterate with `bunx tsc --noEmit` in between.

**Canonical pattern — `src/globals/NavLinks.ts`:**

```ts
import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const NavLinks: GlobalConfig = {
  slug: 'nav-links',
  admin: { group: 'Pages', description: 'Top navigation + menu overlay + shared chrome labels.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'navLinks',
      type: 'array',
      labels: { singular: 'Nav Link', plural: 'Nav Links' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'priority',
          type: 'select',
          required: true,
          defaultValue: '1',
          options: [
            { label: '1 — always visible', value: '1' },
            { label: '2 — hidden on narrow', value: '2' },
          ],
        },
      ],
    },
    {
      name: 'menuItems',
      type: 'array',
      labels: { singular: 'Menu Item', plural: 'Menu Items' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'href', type: 'text', required: true },
        { name: 'subtitle', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'metroBookends',
      type: 'group',
      fields: [
        { name: 'departure', type: 'text', required: true, localized: true },
        { name: 'featured', type: 'text', required: true, localized: true },
        { name: 'about', type: 'text', required: true, localized: true },
        { name: 'blog', type: 'text', required: true, localized: true },
        { name: 'terminal', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'navDirections',
      type: 'group',
      fields: [
        { name: 'previous', type: 'text', required: true, localized: true },
        { name: 'next', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'sharedChrome',
      type: 'group',
      fields: [
        { name: 'openMenuAria', type: 'text', required: true, localized: true },
        { name: 'closeMenuAria', type: 'text', required: true, localized: true },
        { name: 'footerNavAria', type: 'text', required: true, localized: true },
        { name: 'menuOverlayAria', type: 'text', required: true, localized: true },
        { name: 'menuOverlayFooterLabel', type: 'text', required: true, localized: true },
        { name: 'searchPlaceholder', type: 'text', required: true, localized: true },
        { name: 'clearFiltersLabel', type: 'text', required: true, localized: true },
        { name: 'tocToggleSectionAria', type: 'text', required: true, localized: true },
        { name: 'tocHeading', type: 'text', required: true, localized: true },
        { name: 'tocMobileButton', type: 'text', required: true, localized: true },
      ],
    },
  ],
}
```

**For the other 7 globals**, port each section of the TS source into a group/array pattern following the examples above. Use TS source as the authority for field names + localization decisions.

**Source mapping:**

| Global | yesid.dev TS source |
|--------|---------------------|
| HomeContent | `src/lib/content/site-content.ts` (heroContent + manifestoContent + journeyPanels + proofContent + servicesGridContent + closerContent) |
| ServicesPage | `src/lib/content/services.ts` (servicesPageMeta + servicesListingContent + servicesDetailContent) |
| ProjectsPage | `src/lib/content/projects.ts` (projectsPageMeta + projectsListingContent + projectsDetailContent) |
| BlogPage | `src/lib/content/blog.ts` (listing + detail content + page meta) |
| TechStackPage | `src/lib/content/tech-stack.ts` (techStackPageContent) |
| AboutContent | `src/lib/content/about-page.ts` (aboutPageContent — identity, metrics, methodology, testimonials, techStack categorization, interests, weather, clientLogos, cta, stopLabels, labels, meta) |
| ContactContent | `src/lib/content/contact-page.ts` (contactContent — all fields incl. web3formsKey as plain text per Q8) |
| NavLinks | `src/lib/content/nav.ts` (navLinks + menuItems + metroBookends + navDirections + sharedChromeContent) |
| ErrorPages | `src/lib/content/nav.ts` (errorPageContent) |

**Steps:**

- [ ] **Step 1:** Create `src/globals/HomeContent.ts`. Port the site-content.ts sections into grouped/array fields. Use the abridged canonical pattern above as starting scaffold. After each major section added, run `bunx tsc --noEmit`.
- [ ] **Step 2:** Create `src/globals/ServicesPage.ts`, `src/globals/ProjectsPage.ts`, `src/globals/BlogPage.ts`, `src/globals/TechStackPage.ts` — these are lighter (page meta + listing + detail copy; no deep nesting like HomeContent).
- [ ] **Step 3:** Create `src/globals/AboutContent.ts` — medium-weight global with identity group, metrics array, methodology array, testimonials array, techStack array, interests array, weather group, cta group, stopLabels group, labels group, meta group.
- [ ] **Step 4:** Create `src/globals/ContactContent.ts` — follows contactContent TS shape.
- [ ] **Step 5:** Create `src/globals/NavLinks.ts` (canonical pattern above).
- [ ] **Step 6:** Create `src/globals/ErrorPages.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ErrorPages: GlobalConfig = {
  slug: 'error-pages',
  admin: { group: 'Pages', description: '404 and other error page copy.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'notFound',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
        { name: 'terminalLine', type: 'text', required: true },
        {
          name: 'suggestions',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
```

- [ ] **Step 7:** Register all 9 globals in `payload.config.ts` in site-walk order per D9:

```ts
import { HomeContent } from './globals/HomeContent'
import { ServicesPage } from './globals/ServicesPage'
import { ProjectsPage } from './globals/ProjectsPage'
import { BlogPage } from './globals/BlogPage'
import { TechStackPage } from './globals/TechStackPage'
import { AboutContent } from './globals/AboutContent'
import { ContactContent } from './globals/ContactContent'
import { NavLinks } from './globals/NavLinks'
import { ErrorPages } from './globals/ErrorPages'
// SiteMeta already imported from 18a

globals: [
  HomeContent,
  ServicesPage,
  ProjectsPage,
  BlogPage,
  TechStackPage,
  AboutContent,
  ContactContent,
  NavLinks,
  ErrorPages,
  SiteMeta,
],
```

- [ ] **Step 8:** Extend `mcpPlugin().globals` with all 9 new entries (per spec D10 sample). Leave the existing `site-meta` entry.
- [ ] **Step 9:** `bunx tsc --noEmit` → must be green across all 9 globals.
- [ ] **Step 10:** `bunx payload generate:importmap`.
- [ ] **Step 11:** `bun dev` → verify admin sidebar "Pages" group shows all 10 globals in site-walk order: Home Content, Services Page, Projects Page, Blog Page, Tech Stack Page, About Content, Contact Content, Nav Links, Error Pages, Site Meta.
- [ ] **Step 12:** Commit.

```bash
git add src/globals/ src/payload.config.ts
git commit -m "feat(cms-slice-18b): add 9 globals (home/services/projects/blog/tech-stack/about/contact/nav/error) with admin.group: Pages"
git push
```

**STOP criteria:**
- All 9 new global files exist, all registered.
- `bunx tsc --noEmit` green.
- Admin sidebar shows all 10 globals in correct order under "Pages".
- Each global MCP-registered per D10.

---

## Task 18b-7 — Consolidated migration `00002_initial_content` + regenerate types

**Repo:** `yesid.dev-cms`.

**Goal:** Single migration file captures 18b's full delta on top of 18a's `00001_initial`. Types regenerated. Locally applied against a freshly reset Neon dev branch to prove the consolidated migration is cleanly reproducible from scratch.

**Files:**
- Create: `migrations/00002_initial_content.ts` (generated — full schema delta)
- Modify: `migrations/index.ts` (barrel auto-updated by migrate:create)
- Modify: `src/payload-types.ts` (regenerated)

**Steps:**

- [ ] **Step 1:** Confirm `.env` points at the Neon **dev** branch (not prod). Sanity: `grep DATABASE .env` → host should contain `-dev-` or the non-primary branch name.
- [ ] **Step 2:** Fully reset the dev branch schema:
  ```bash
  bunx payload migrate:fresh
  ```
  Drops all tables + wipes `payload_migrations`.
- [ ] **Step 3:** Re-apply the 18a baseline only:
  ```bash
  bunx payload migrate
  ```
  Expect exactly `00001_initial` applied. Verify:
  ```sql
  -- Neon SQL editor
  SELECT name FROM payload_migrations ORDER BY name;
  -- expect: 00001_initial
  ```
- [ ] **Step 4:** Generate the consolidated 18b migration:
  ```bash
  bunx payload migrate:create --name initial-content
  ```
  Produces `migrations/<timestamp>_initial-content.ts`. Inspect the generated SQL — should include `CREATE TABLE` for services, projects, blog-posts, stack-scenarios; `ALTER TABLE site-meta ADD COLUMN tagline` etc.; locale subtables for every localized collection; relationship tables for M:N edges.
- [ ] **Step 5:** Apply locally to the dev branch:
  ```bash
  bunx payload migrate
  ```
  Verify: `SELECT name FROM payload_migrations;` shows both `00001_initial` + the new `initial-content` row.
- [ ] **Step 6:** Regenerate Payload types:
  ```bash
  bunx payload generate:types
  ```
  Verify `src/payload-types.ts` gains interfaces: `Project`, `Service`, `TechStack`, `BlogPost`, `StackScenario`, `HomeContent`, `ServicesPage`, … and extended `SiteMeta`.
- [ ] **Step 7:** Run `bunx tsc --noEmit` → green.
- [ ] **Step 8:** Run `bun run build` → green (Next.js prod build).
- [ ] **Step 9:** Quick smoke in admin UI: create one test doc in each collection + save one field on each global to confirm the new schema is editable and persists. Then delete the test docs + revert global fields before Task 18b-8 seed.
- [ ] **Step 10:** Commit.

```bash
# The generated migration filename includes a timestamp — rename to 00002_initial_content.ts for cleanliness
cd ~/Yesito/Projects/yesid-dev-cms
mv migrations/*_initial-content.ts migrations/00002_initial_content.ts
# Edit migrations/index.ts if the barrel still references the timestamped name
git add migrations/ src/payload-types.ts
git commit -m "feat(cms-slice-18b): consolidated initial-content migration + regenerated types"
git push
```

**STOP criteria:**
- `migrations/00002_initial_content.ts` exists + committed.
- `migrations/index.ts` barrel updated.
- `src/payload-types.ts` regenerated + committed.
- `bunx payload migrate:fresh` + `bunx payload migrate` on dev branch produces exactly 2 rows in `payload_migrations`.
- `bunx tsc --noEmit` + `bun run build` both green.

---

## Task 18b-8 — Seed script + local seed verify

**Repo:** `yesid.dev-cms`.

**Goal:** Idempotent bun script reads sibling `yesid.dev` TS + MD content and upserts into Payload via Local API. Dev branch gets seeded end-to-end; three-way consistency check on one collection + one global.

**Files:**
- Create: `scripts/seed/index.ts` (entry)
- Create: `scripts/seed/lib/loadTs.ts` (dynamic TS import helpers)
- Create: `scripts/seed/lib/loadMd.ts` (`readdir` + `gray-matter` parsing)
- Create: `scripts/seed/lib/toLexical.ts` (markdown → Lexical)
- Create: `scripts/seed/lib/deriveStack.ts` (per D-rel-1, invert tech-stack reverse arrays into project.stack + service.stack)
- Create: `scripts/seed/upsert/tech-stack.ts`
- Create: `scripts/seed/upsert/services.ts`
- Create: `scripts/seed/upsert/projects.ts`
- Create: `scripts/seed/upsert/blog-posts.ts`
- Create: `scripts/seed/upsert/stack-scenarios.ts`
- Create: `scripts/seed/upsert/media.ts`
- Create: `scripts/seed/upsert/globals.ts` (one file for all 10 globals — each is a single-doc upsert)
- Create: `scripts/seed/README.md`
- Modify: `package.json` (add `gray-matter` dep + `seed:dev` / `seed:prod` scripts)

**Seed `package.json` additions:**

```json
{
  "dependencies": {
    "gray-matter": "^4.0.3"
  },
  "scripts": {
    "seed:dev": "bun run scripts/seed/index.ts",
    "seed:prod": "SEED_TARGET=prod bun run scripts/seed/index.ts"
  }
}
```

**Canonical `scripts/seed/index.ts`:**

```ts
/**
 * Seed yesid.dev-cms from sibling yesid.dev content.
 *
 * Idempotent: re-run safe, upserts by natural key (slug/id).
 * Source: ../yesid.dev/src/lib/content/*.ts + ../yesid.dev/src/content/**\/*.md
 * Target: current Payload DB (Neon branch determined by DATABASE_URI).
 *
 * Usage:
 *   bun run seed:dev                        — seeds the current .env DATABASE_URI (dev)
 *   SEED_TARGET=prod bun run seed:prod      — gated, seeds prod branch
 *
 * Per spec D5/D13: one-shot reference recipe. NOT part of build.
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_SOURCE_REPO = path.resolve(__dirname, '../../..', 'yesid.dev')
const SOURCE_REPO = process.env.SEED_SOURCE_REPO_PATH ?? DEFAULT_SOURCE_REPO

async function main() {
  console.log(`[seed] Source repo: ${SOURCE_REPO}`)
  console.log(`[seed] Target: ${process.env.SEED_TARGET ?? 'dev'} (${process.env.DATABASE_URI?.split('@')[1]?.split('/')[0] ?? '<unknown>'})`)

  if (process.env.SEED_TARGET === 'prod') {
    console.log('[seed] PROD TARGET — proceeding with explicit flag. Ctrl-C within 5s to abort.')
    await new Promise((r) => setTimeout(r, 5000))
  }

  const payload = await getPayload({ config })

  const { upsertTechStack } = await import('./upsert/tech-stack')
  const { upsertServices } = await import('./upsert/services')
  const { upsertProjects } = await import('./upsert/projects')
  const { upsertBlogPosts } = await import('./upsert/blog-posts')
  const { upsertStackScenarios } = await import('./upsert/stack-scenarios')
  const { upsertMedia } = await import('./upsert/media')
  const { upsertGlobals } = await import('./upsert/globals')

  // Order matters: hub collections first, reverse-join collections after (D6).
  // Auto-stub-creation (D-rel-2) fires if a project/service references an id not yet present.
  console.log('\n[seed] 1/7 tech-stack (primary pass)')
  await upsertTechStack({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 2/7 media (project images)')
  await upsertMedia({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 3/7 services (+ auto-stub tech-stack if any)')
  await upsertServices({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 4/7 projects (+ auto-stub tech-stack if any)')
  await upsertProjects({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 5/7 blog-posts')
  await upsertBlogPosts({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 6/7 stack-scenarios')
  await upsertStackScenarios({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] 7/7 globals')
  await upsertGlobals({ payload, sourceRepo: SOURCE_REPO })

  console.log('\n[seed] DONE')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed] FAILED:', err)
  process.exit(1)
})
```

**Canonical `scripts/seed/upsert/tech-stack.ts`** (primary pass — creates docs from TS source; D-rel-2 drops connectsTo):

```ts
import type { Payload } from 'payload'
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'

export async function upsertTechStack(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args
  const stackDir = path.join(sourceRepo, 'src/content/stack')
  const files = (await readdir(stackDir)).filter((f) => f.endsWith('.md'))

  for (const file of files) {
    const raw = await readFile(path.join(stackDir, file), 'utf8')
    const { data } = matter(raw)

    // Drop per D-rel-2: connectsTo, connectionNotes (inter-tech graph deferred).
    if (data.connectsTo?.length) {
      console.log(`[seed]   Skipping tech-stack.connectsTo for ${data.id} (deferred to engine-builder slice)`)
    }

    const found = await payload.find({
      collection: 'tech-stack',
      where: { id: { equals: data.id } },
      limit: 1,
    })
    const payloadData = {
      id: data.id,
      name: data.name,
      layer: data.layer,
      domains: data.domains ?? [],
      icon: data.icon ?? '',
      proficiency: data.proficiency ?? 'familiar',
    }
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'tech-stack',
        id: found.docs[0].id,
        data: payloadData,
      })
    } else {
      await payload.create({ collection: 'tech-stack', data: payloadData })
    }
  }

  console.log(`[seed]   tech-stack: ${files.length} items processed`)
}

/**
 * Auto-stub-creation helper (D-rel-2). Called from projects + services upsert
 * when their stack array references an id not yet present.
 */
export async function ensureTechStackStub(payload: Payload, id: string) {
  const found = await payload.find({
    collection: 'tech-stack',
    where: { id: { equals: id } },
    limit: 1,
  })
  if (found.totalDocs === 0) {
    console.warn(`[seed]   Stub-created tech-stack <${id}> (no TS source) — fill fields in admin UI`)
    await payload.create({
      collection: 'tech-stack',
      data: { id, name: id, layer: 'data', proficiency: 'familiar' },
    })
  }
}
```

**Canonical `scripts/seed/upsert/services.ts`** (derives service.stack from TS tech-stack.relatedServices — per D-rel-1):

```ts
import type { Payload } from 'payload'
import path from 'path'
import { ensureTechStackStub } from './tech-stack'

export async function upsertServices(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args

  // Load services + tech-stack TS sources via dynamic import (bun runs TS).
  const servicesMod = await import(path.join(sourceRepo, 'src/lib/content/services.ts'))
  const services = servicesMod.services as Array<any>

  // Derive service.stack by inverting tech-stack.relatedServices (D-rel-1).
  // Load tech-stack markdown frontmatter to read relatedServices.
  const { readdir, readFile } = await import('fs/promises')
  const matter = (await import('gray-matter')).default
  const stackDir = path.join(sourceRepo, 'src/content/stack')
  const stackFiles = (await readdir(stackDir)).filter((f) => f.endsWith('.md'))
  const serviceToTechs = new Map<string, string[]>() // serviceId → [techId, …]
  for (const file of stackFiles) {
    const raw = await readFile(path.join(stackDir, file), 'utf8')
    const { data } = matter(raw)
    for (const serviceId of data.relatedServices ?? []) {
      if (!serviceToTechs.has(serviceId)) serviceToTechs.set(serviceId, [])
      serviceToTechs.get(serviceId)!.push(data.id)
    }
  }

  for (const svc of services) {
    const derivedStack = serviceToTechs.get(svc.id) ?? []
    // Ensure every referenced tech-stack id exists (auto-stub if missing):
    for (const techId of derivedStack) {
      await ensureTechStackStub(payload, techId)
    }

    const found = await payload.find({
      collection: 'services',
      where: { id: { equals: svc.id } },
      limit: 1,
    })
    const payloadData = {
      id: svc.id,
      title: svc.title,
      subtitle: svc.subtitle,
      description: svc.description,
      longDescription: svc.longDescription,
      valueProposition: svc.valueProposition,
      station: svc.station,
      icon: svc.icon ?? '',
      svg: svc.svg ?? '',
      lottieReverse: svc.lottieReverse ?? false,
      visible: svc.visible ?? true,
      deliverables: (svc.deliverables ?? []).map((text: any) => ({ text })),
      sections: svc.sections ?? [],
      benefitHeadline: svc.benefitHeadline,
      impactMetric: svc.impactMetric,
      // D-rel-1 source-of-truth:
      stack: derivedStack,
    }
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'services',
        id: found.docs[0].id,
        data: payloadData,
      })
    } else {
      await payload.create({ collection: 'services', data: payloadData })
    }
  }
  console.log(`[seed]   services: ${services.length} items processed`)
}
```

**Canonical `scripts/seed/upsert/projects.ts`** (derives project.stack from tech-stack.relatedProjects; resolves service refs to Payload doc IDs; handles Media relationship for image):

```ts
import type { Payload } from 'payload'
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'
import { ensureTechStackStub } from './tech-stack'

export async function upsertProjects(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args

  const projectsMod = await import(path.join(sourceRepo, 'src/lib/content/projects.ts'))
  // projects export is internal; adjust to the actual export name in projects.ts
  const projects = projectsMod.projects as Array<any>

  // Derive project.stack by inverting tech-stack.relatedProjects (D-rel-1).
  const stackDir = path.join(sourceRepo, 'src/content/stack')
  const stackFiles = (await readdir(stackDir)).filter((f) => f.endsWith('.md'))
  const projectToTechs = new Map<string, string[]>()
  for (const file of stackFiles) {
    const raw = await readFile(path.join(stackDir, file), 'utf8')
    const { data } = matter(raw)
    for (const projSlug of data.relatedProjects ?? []) {
      if (!projectToTechs.has(projSlug)) projectToTechs.set(projSlug, [])
      projectToTechs.get(projSlug)!.push(data.id)
    }
  }

  // Resolve service id refs to Payload service doc IDs.
  const allServices = await payload.find({ collection: 'services', limit: 200 })
  const serviceIdToDocId = new Map(allServices.docs.map((s) => [s.id, s.id]))

  // Resolve Media doc IDs for project images.
  const allMedia = await payload.find({ collection: 'media', limit: 200 })
  const mediaFilenameToDocId = new Map(allMedia.docs.map((m) => [m.filename, m.id]))

  for (const proj of projects) {
    const derivedStack = projectToTechs.get(proj.slug) ?? proj.stack ?? []
    for (const techId of derivedStack) {
      await ensureTechStackStub(payload, techId)
    }

    const serviceRefs = (proj.relatedServices ?? []).map((sId: string) => serviceIdToDocId.get(sId)).filter(Boolean)
    const imageRef = proj.image ? mediaFilenameToDocId.get(proj.image) : undefined

    const found = await payload.find({
      collection: 'projects',
      where: { slug: { equals: proj.slug } },
      limit: 1,
    })
    const payloadData = {
      slug: proj.slug,
      title: proj.title,
      oneLiner: proj.oneLiner,
      description: proj.description,
      status: proj.status,
      featured: proj.featured,
      tags: proj.tags ?? [],
      services: serviceRefs,
      stack: derivedStack,
      repoUrl: proj.repoUrl,
      liveUrl: proj.liveUrl,
      readmeUrl: proj.readmeUrl,
      image: imageRef,
      sections: proj.sections ?? [],
      impactMetric: proj.impactMetric,
      impactMetrics: proj.impactMetrics ?? [],
      location: proj.location,
      environment: proj.environment,
      version: proj.version,
    }
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'projects',
        id: found.docs[0].id,
        data: payloadData,
      })
    } else {
      await payload.create({ collection: 'projects', data: payloadData })
    }
  }
  console.log(`[seed]   projects: ${projects.length} items processed`)
}
```

**Canonical `scripts/seed/upsert/blog-posts.ts`** (markdown → Lexical per D7):

```ts
import type { Payload } from 'payload'
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'
import { markdownToLexical } from '../lib/toLexical'

export async function upsertBlogPosts(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args
  const blogRoot = path.join(sourceRepo, 'src/content/blog')

  const posts: Array<{ slug: string; category: 'professional' | 'personal'; file: string; dir: string }> = []
  for (const cat of ['professional', 'personal'] as const) {
    const catDir = path.join(blogRoot, cat)
    const entries = await readdir(catDir)
    for (const slug of entries) {
      const indexPath = path.join(catDir, slug, 'index.md')
      try {
        await readFile(indexPath, 'utf8')
        posts.push({ slug, category: cat, file: indexPath, dir: path.join(catDir, slug) })
      } catch {
        // no index.md in this subdir — skip
      }
    }
  }

  for (const p of posts) {
    const raw = await readFile(p.file, 'utf8')
    const { data, content } = matter(raw)
    const lexicalBody = markdownToLexical(content)

    const found = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })
    const payloadData = {
      slug: p.slug,
      title: { en: data.title },
      excerpt: { en: data.excerpt },
      date: data.date,
      lang: data.lang ?? 'en',
      category: p.category,
      tags: data.tags ?? [],
      animation: data.animation ?? 'draw',
      svg: data.svg ?? '',
      url: data.url ?? '',
      external: data.external ?? false,
      body: { en: lexicalBody },
    }
    if (found.totalDocs > 0) {
      await payload.update({ collection: 'blog-posts', id: found.docs[0].id, data: payloadData })
    } else {
      await payload.create({ collection: 'blog-posts', data: payloadData })
    }
  }
  console.log(`[seed]   blog-posts: ${posts.length} items processed`)
}
```

**Canonical `scripts/seed/lib/toLexical.ts`** (minimal markdown → Lexical state per D7):

```ts
/**
 * Naive markdown → Lexical converter.
 * Splits body on double-newlines; each chunk becomes one paragraph node.
 * Lines starting with # / ## / ### / #### become heading nodes.
 * Loses: inline formatting, lists, code fences, images.
 * Editor re-authors affected posts post-seed per D7.
 */
export function markdownToLexical(md: string): any {
  const trimmed = md.trim()
  const blocks = trimmed.split(/\n\n+/).map((b) => b.trim()).filter(Boolean)

  const children = blocks.map((block) => {
    const headingMatch = block.match(/^(#+)\s+(.*)$/)
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6)
      return {
        type: 'heading',
        version: 1,
        tag: `h${level}`,
        children: [{ type: 'text', version: 1, text: headingMatch[2] }],
      }
    }
    return {
      type: 'paragraph',
      version: 1,
      children: [{ type: 'text', version: 1, text: block }],
    }
  })

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }
}
```

**Canonical `scripts/seed/upsert/media.ts`** (reads `yesid.dev/static/images/projects/*` and creates Media docs):

```ts
import type { Payload } from 'payload'
import path from 'path'
import { readdir } from 'fs/promises'

export async function upsertMedia(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args
  const imagesDir = path.join(sourceRepo, 'static/images/projects')

  let files: string[] = []
  try {
    files = (await readdir(imagesDir)).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f))
  } catch {
    console.log('[seed]   media: no project images directory found — skipping')
    return
  }

  for (const filename of files) {
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (found.totalDocs > 0) continue // idempotent — skip existing

    const filePath = path.join(imagesDir, filename)
    await payload.create({
      collection: 'media',
      data: {
        alt: { en: filename.replace(/\.\w+$/, '').replace(/-/g, ' ') },
      },
      filePath, // Payload reads the file from disk and uploads to Blob.
    })
  }
  console.log(`[seed]   media: ${files.length} files processed`)
}
```

**Canonical `scripts/seed/upsert/globals.ts`** — single file handling all 10 globals. Each block reads TS source + calls `payload.updateGlobal({ slug, data })`. Abridged pattern:

```ts
import type { Payload } from 'payload'
import path from 'path'

export async function upsertGlobals(args: { payload: Payload; sourceRepo: string }) {
  const { payload, sourceRepo } = args

  // site-meta
  const metaMod = await import(path.join(sourceRepo, 'src/lib/content/meta.ts'))
  await payload.updateGlobal({
    slug: 'site-meta',
    data: {
      siteName: metaMod.siteMeta.name,
      tagline: metaMod.siteMeta.tagline,
      description: metaMod.siteMeta.description,
      links: metaMod.siteMeta.links,
    },
  })
  console.log('[seed]     site-meta ✓')

  // home-content
  const siteContentMod = await import(path.join(sourceRepo, 'src/lib/content/site-content.ts'))
  await payload.updateGlobal({
    slug: 'home-content',
    data: {
      hero: siteContentMod.heroContent,
      manifesto: siteContentMod.manifestoContent,
      // ... other sections; match the global field shape defined in 18b-6
    },
  })
  console.log('[seed]     home-content ✓')

  // services-page — from services.ts exports
  const servicesMod = await import(path.join(sourceRepo, 'src/lib/content/services.ts'))
  await payload.updateGlobal({
    slug: 'services-page',
    data: {
      meta: servicesMod.servicesPageMeta,
      listing: servicesMod.servicesListingContent,
      detail: servicesMod.servicesDetailContent,
    },
  })
  console.log('[seed]     services-page ✓')

  // projects-page, blog-page, tech-stack-page, about-content, contact-content, nav-links, error-pages
  // ... same pattern. Each reads its TS export + calls payload.updateGlobal.
  // Full implementation at task execution time.
}
```

**Canonical `scripts/seed/README.md`:**

```md
# yesid.dev-cms Seed Script

One-shot tool that imports existing yesid.dev content into Payload via the Local API.

## Layout

```
scripts/seed/
  index.ts              — entry
  lib/
    loadTs.ts           — dynamic TS module import
    loadMd.ts           — readdir + gray-matter
    toLexical.ts        — markdown → Lexical converter
    deriveStack.ts      — invert tech-stack reverse arrays into project/service.stack (D-rel-1)
  upsert/
    tech-stack.ts       — primary + auto-stub helper
    services.ts         — derives service.stack from tech-stack.relatedServices
    projects.ts         — derives project.stack + resolves services + image
    blog-posts.ts       — markdown body → Lexical
    stack-scenarios.ts
    media.ts            — uploads yesid.dev/static/images/projects/* to Blob
    globals.ts          — all 10 globals in one file
  README.md             — this file
```

## Running

```bash
# Dev branch (current .env DATABASE_URI):
bun run seed:dev

# Prod branch (explicit gate):
SEED_TARGET=prod bun run seed:prod

# Override source repo path:
SEED_SOURCE_REPO_PATH=/custom/yesid.dev bun run seed:dev
```

## Semantics

- **Upsert by natural key.** Re-runnable without duplicates. See spec D6.
- **Partial merge.** Seed writes ONLY the fields it imports; admin-UI-edited fields are preserved.
- **Not deletion-aware.** Content removed from yesid.dev TS/MD after seeding stays in Payload until manually deleted.
- **One-shot.** DO NOT wire into CI or build. See spec D13.

## Known-loss conversions (D7)

- Blog markdown → Lexical loses code fences, inline formatting, lists.
- Post-seed: Yesid re-authors affected posts in admin UI.

## Troubleshooting

- **"Sibling repo not found":** set `SEED_SOURCE_REPO_PATH` to your yesid.dev checkout.
- **"[seed] Stub-created tech-stack <id>":** a project/service referenced a tech id missing from yesid.dev's `src/content/stack/*.md`. Either fill the stub in admin UI or add the missing TS source and re-run.
- **Bun + Windows Git Bash `\r` contamination on env vars:** use literal strings; if piping, `tr -d '\r'` first (per spec risk 11).
```

**Steps:**

- [ ] **Step 1:** `bun add gray-matter`.
- [ ] **Step 2:** Add `seed:dev` + `seed:prod` scripts to `package.json`.
- [ ] **Step 3:** Create `scripts/seed/` directory structure with all files from the canonical patterns above. The abridged `globals.ts` needs full implementation at this step — port each global's TS export.
- [ ] **Step 4:** `bunx tsc --noEmit` → fix any type errors in the seed scripts.
- [ ] **Step 5:** **Probe Lexical migration helper** (per Q1): check whether `@payloadcms/richtext-lexical/migrate` exports `convertMarkdownToLexical`. If yes, replace `scripts/seed/lib/toLexical.ts`'s naive impl with the official helper. If no, keep the naive impl. Record choice in `log.md`.
- [ ] **Step 6:** Run seed against dev Neon branch:
  ```bash
  cd ~/Yesito/Projects/yesid-dev-cms
  bun run seed:dev
  ```
  Watch output — expect logs for each pass, plus any `[seed] Stub-created tech-stack <id>` warnings + `[seed] Skipping tech-stack.connectsTo` lines.
- [ ] **Step 7:** Idempotency verify — re-run seed immediately:
  ```bash
  bun run seed:dev
  ```
  Expect row counts unchanged. Verify in Neon SQL:
  ```sql
  SELECT (SELECT COUNT(*) FROM projects) AS projects,
         (SELECT COUNT(*) FROM services) AS services,
         (SELECT COUNT(*) FROM "tech-stack") AS tech_stack,
         (SELECT COUNT(*) FROM "blog-posts") AS blog_posts,
         (SELECT COUNT(*) FROM "stack-scenarios") AS stack_scenarios,
         (SELECT COUNT(*) FROM media) AS media;
  ```
- [ ] **Step 8:** Three-way smoke test on `projects`:
  - admin UI → Projects list → count + inspect one entry's fields (title EN, stack, services relationship resolved)
  - REST: `curl http://localhost:3000/api/projects?limit=1`
  - MCP via Claude Code → `find-projects` tool → same data
  - All three return matching content.
- [ ] **Step 9:** Three-way smoke test on `home-content` global (updated by seed). Same pattern: admin UI + `curl /api/globals/home-content` + MCP `find-home-content`.
- [ ] **Step 10:** Commit.

```bash
git add scripts/ package.json bun.lock
git commit -m "feat(cms-slice-18b): add idempotent seed script importing from sibling yesid.dev repo"
git push
```

**STOP criteria:**
- `scripts/seed/` directory complete with all files.
- `bun run seed:dev` succeeds against Neon dev branch.
- Re-running `seed:dev` is a no-op (row counts unchanged, no errors).
- Three-way consistency (admin/REST/MCP) passes on projects + home-content.
- Row counts meet spec AC: projects ≥ 2, services ≥ 6, blog-posts ≥ 7, tech-stack ≥ 35, stack-scenarios ≥ 7, media ≥ (static/images/projects/ file count).
- `bunx tsc --noEmit` green.

---

## Task 18b-9 — Prod deploy + prod migration + prod seed + Blob flip + Resend DNS

**Repo:** `yesid.dev-cms` + external dashboards (Vercel, Cloudflare, Resend).

**Goal:** Ship everything from 18b-1 through 18b-8 to production. Migration runs on Vercel cold start. Prod seed runs against Neon prod branch. Vercel Blob flipped on for Media with the existing store linked. Resend DNS verified (SPF + DKIM CNAMEs to Cloudflare).

**Files modified (deploy):**
- Modify: `src/payload.config.ts` — flip `vercelBlobStorage.collections.media = true`.

**Steps:**

- [ ] **Step 1 — Blob store dashboard actions** (Yesid-driven, logged in `log.md`):
  1. Open Vercel dashboard → `yesid-dev-cms` project → Storage tab.
  2. Click **Connect Store** on the existing `yesid-dev-cms-media` Blob store (from 18a Task 4 — unlinked).
  3. Verify `BLOB_READ_WRITE_TOKEN` auto-repopulates in project env.
  4. Delete the accidental `yesid-dev-cms-media2` duplicate store.
- [ ] **Step 2 — Flip Blob in config:**
  ```ts
  // src/payload.config.ts
  vercelBlobStorage({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    collections: {
      media: true,  // ← flipped from false
    },
    token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
  }),
  ```
  Commit:
  ```bash
  git add src/payload.config.ts
  git commit -m "chore(cms-slice-18b): enable Vercel Blob for Media collection uploads"
  git push
  ```
- [ ] **Step 3 — Wait for Vercel prod deploy.** Push to main triggers build → deploy → cold start runs `prodMigrations` (applies `00002_initial_content` on the prod Neon branch). Monitor Vercel logs for migration success.
- [ ] **Step 4 — Verify prod migration.** In Neon dashboard → prod branch → SQL editor:
  ```sql
  SELECT name FROM payload_migrations ORDER BY name;
  -- expect exactly: 00001_initial, 00002_initial_content
  ```
- [ ] **Step 5 — Prod smoke (pre-seed).** Open `https://cms.yesid.dev/admin` → log in → verify new collections + globals exist, all empty/default. Create one test entry in tech-stack via admin UI (id=test, name=test, layer=data). Upload a test image to Media (verify it lands in the `yesid-dev-cms-media` Blob store; view the Blob URL). Delete both after verify.
- [ ] **Step 6 — Run prod seed** (gated):
  ```bash
  cd ~/Yesito/Projects/yesid-dev-cms
  # Ensure local .env DATABASE_URI points at the PROD pooled connection string.
  # (Copy from Vercel env var DATABASE_URL; ensure trailing \r stripped per spec risk 11.)
  SEED_TARGET=prod bun run seed:prod
  ```
  Watch output — expect all passes to complete. Log any stub-created entries.
- [ ] **Step 7 — Revert local .env** back to dev branch (avoid accidental re-seed against prod in the next session).
- [ ] **Step 8 — Prod three-way smoke test:**
  - Admin UI → Projects → inspect one entry (e.g., yesid-dev slug).
  - REST: `curl https://cms.yesid.dev/api/projects?limit=1 -H "Authorization: Bearer <key>"` (or public GET — projects collection has `read: () => true`, no auth needed).
  - MCP via `yesid-cms-prod` server registered in Claude Code (from 18a-5) → `find-projects` tool.
  - All three match. Same check on `home-content` global.
- [ ] **Step 9 — Resend DNS (SPF + DKIM CNAMEs to Cloudflare).** Yesid-driven dashboard actions:
  1. Open Resend dashboard → Domains → `cms.yesid.dev` → Verify.
  2. Resend shows 3–4 DNS records to add (typically: 1 MX or TXT for SPF, 2 CNAMEs for DKIM, 1 TXT for DMARC-optional).
  3. Open Cloudflare dashboard → `yesid.dev` zone → DNS.
  4. Add each record exactly as Resend specifies. TTL auto.
  5. Return to Resend → click "Verify DNS". Wait up to 15 min for propagation.
  6. Status flips to "Verified" — log the date/time + record names in `log.md`.
- [ ] **Step 10 — Resend sender smoke test.**
  1. Admin UI → Users → your user → send password reset (from the admin logout flow "Forgot password?" link OR via Users collection → "Forgot password" action).
  2. Verify email arrives at Yesid's inbox from `no-reply@cms.yesid.dev` — not in spam.
  3. Inspect email headers: `Authentication-Results` should show `spf=pass`, `dkim=pass`.
  4. Do NOT use the reset link (cancels). Log the test-send completion.
- [ ] **Step 11 — Budget check.** Neon dashboard → Usage → confirm prod compute ≤ 2 hrs since 18b started. Vercel Blob → confirm storage ≤ 50 MB. Record in `handoff.md`.

**STOP criteria:**
- Blob store linked, duplicate deleted, Media uploads work via admin.
- Prod Neon branch has 2 migrations applied (`00001_initial` + `00002_initial_content`).
- Prod seed ran successfully. Row counts match dev branch.
- Three-way consistency passes on prod projects + home-content.
- Resend DNS verified + test-send confirms SPF/DKIM pass.
- Budget snapshot recorded.

**No git commit this task** beyond Step 2's Blob-flip commit — all verification + dashboard work.

---

## Task 18b-10 — Close bundle: `yesid.dev-cms` docs + `yesid.dev` docs PR + slice:close

**Repos:** `yesid.dev-cms` (README updates); `yesid.dev` (bundle finalization, ARCHITECTURE update, sub-slice row flip).

**Goal:** Both repos have 18b artifacts committed. PR A merged in `yesid.dev-cms`; PR B merged in `yesid.dev`. `bun run slice:close 18b` archives the bundle.

### Part A — `yesid.dev-cms` README updates + PR A

**Files:**
- Modify: `yesid.dev-cms/README.md` — add "Content model" + "Seeding" sections.

**README additions** (append under existing "Using with MCP" section):

```md
## Content model (Slice 18b)

**Collections:**

| Slug | Purpose | Notable fields |
|------|---------|----------------|
| `tech-stack` | Flat tech labels — PostgreSQL, Python, etc. | id, name, layer, domains, icon, proficiency |
| `services` | Service offerings | title, station, stack (→ tech-stack), relatedProjects (join from projects.services) |
| `projects` | Portfolio projects | slug, title, services (→ services), stack (→ tech-stack), sections, impactMetric(s), image (→ Media) |
| `blog-posts` | Blog with Lexical rich text | slug, title, body, category (professional/personal), tags |
| `stack-scenarios` | Build-Your-Stack configurator presets | id, domains, techs (→ tech-stack), relatedProjects (→ projects) |
| `media` | Vercel Blob-backed uploads | alt (localized), caption (localized), credit, imageSizes |
| `users` | Admin auth | email, roles |

**Globals (site-walk order, Pages group):** home-content, services-page, projects-page, blog-page, tech-stack-page, about-content, contact-content, nav-links, error-pages, site-meta.

**Relationship topology:** projects + services are source-of-truth for their tech relationships; tech-stack auto-populates `relatedProjects` + `relatedServices` via Payload `join` fields. `services.relatedProjects` similarly join-computed from `projects.services`. See `yesid.dev/docs/slices/slice-18/slice-18b/spec.md` D-rel-1 for the mechanics.

Full Payload types: `src/payload-types.ts` (regenerated on schema change).

## Seeding

One-shot import from sibling yesid.dev content. See `scripts/seed/README.md` for full details.

```bash
bun run seed:dev            # dev Neon branch
SEED_TARGET=prod bun run seed:prod   # prod (explicit gate)
```

DO NOT wire into CI or build — seed is manual-only.
```

- [ ] **Step A1:** Update `yesid.dev-cms/README.md` with the sections above.
- [ ] **Step A2:** Commit:
  ```bash
  git add README.md
  git commit -m "docs(cms-slice-18b): document content model + seeding in README"
  git push
  ```
- [ ] **Step A3:** Open PR A in `yesid.dev-cms` (optional — repo has had direct main pushes in 18a; if a reviewable diff exists from 18b commits, consolidate into a single PR for the record). Body: point at `yesid.dev/docs/slices/slice-18/slice-18b/handoff.md`.
  ```bash
  # If all 18b commits went to main directly, skip the PR — direct history is the audit trail.
  # If you want a PR for visibility:
  gh pr create --base main --head <18b-branch-if-any> \
    --title "Slice 18b — Content Model + Seed" \
    --body "See yesid.dev/docs/slices/slice-18/slice-18b/handoff.md for details."
  ```
  Default: direct pushes to main OK for greenfield repo (same as 18a pattern). Skip PR A.

### Part B — `yesid.dev` bundle finalization + ARCHITECTURE update + PR B

**Files:**
- Modify: `yesid.dev/docs/slices/slice-18/slice-18b/log.md` — finalize chronological record.
- Modify: `yesid.dev/docs/slices/slice-18/slice-18b/handoff.md` — finalize as PR B body.
- Modify: `yesid.dev/docs/slices/slice-18/README.md` — flip 18b row to `complete (2026-04-XX)` with PR refs.
- Modify: `yesid.dev/docs/reference/ARCHITECTURE.md` — append "Content model (Slice 18b)" subsection.
- Modify: `yesid.dev/tree.txt` — regenerate.

**ARCHITECTURE.md append pattern** (under the two-repo topology block added in 18a):

```md
#### Content model (Slice 18b)

`yesid.dev-cms` now holds the full content layer for `yesid.dev`. Schema + migration + seed landed in 18b; frontend still reads static TS/MD until 18c+ swaps each service onto the Payload REST API.

**Collections (hub-first):** tech-stack → services → projects → blog-posts → stack-scenarios. Users + Media under System.

**Globals (site-walk, Pages group):** home-content, services-page, projects-page, blog-page, tech-stack-page, about-content, contact-content, nav-links, error-pages, site-meta.

**Relationship topology (D-rel-1):** projects + services are source-of-truth for tech references; tech-stack auto-populates `relatedProjects` + `relatedServices` via Payload `join` fields. `services.relatedProjects` similarly join-computed. No manual sync hooks.

**Tech-stack is flat in 18b (D-rel-2).** No inter-tech graph — deferred to a future engine-builder slice. Tech-tech relatedness stays implicit (shared projects/services, query-time).

**Localization:** `localized: true` on every user-facing prose field. Enum/URL/id/slug/boolean fields canonical across locales.

**MCP surface:** every collection + global exposed via `@payloadcms/plugin-mcp` at `/api/mcp` with `find` + `update` tools. Exceptions: Users (admin-only), Media (multipart uploads don't fit MCP today).

**Media:** Vercel Blob-backed; `vercelBlobStorage.collections.media: true`. imageSizes (thumbnail/card/hero) generated server-side via `sharp`.

**Seed:** `yesid.dev-cms/scripts/seed/` — idempotent one-shot import from sibling `yesid.dev` TS + MD. Upsert by slug/id; re-run safe; preserves admin-UI edits outside seed-sourced fields.
```

**slice-18/README.md row flip pattern:**

```md
| 18b | Content Model + Seed | L (1–2 sessions) | 18a | 2, 4 | **✅ shipped 2026-04-XX** (PR [yesid.dev#N]) |
```

- [ ] **Step B1:** Finalize `log.md` — consolidate per-task appends into one clean chronological record. Include: Payload version confirmed, any Lexical conversion helper choice (Q1), any bun-Payload runtime friction, stub-created tech-stack count, Resend DNS records added, budget snapshot.
- [ ] **Step B2:** Finalize `handoff.md` — structure: Summary / What shipped / What verified (3-way smoke results + seed row counts) / Open items for 18c (type-sync Action + site-meta service swap) / Free-tier usage / Retrospective.
- [ ] **Step B3:** Append the "Content model (Slice 18b)" subsection to `ARCHITECTURE.md`.
- [ ] **Step B4:** Update `docs/slices/slice-18/README.md` — flip 18b row.
- [ ] **Step B5:** Regenerate `tree.txt` via PowerShell command (from `PLAN.md` tree.txt convention):
  ```powershell
  Get-ChildItem -Recurse -Name | Where-Object { $_ -notmatch 'node_modules|\.git|\.remember|bun\.lockb|\.svelte-kit|\.vercel|\.DS_Store' } | Out-File tree.txt -Encoding utf8
  ```
  Diff = new `docs/slices/slice-18/slice-18b/` directory only.
- [ ] **Step B6:** Verify no `src/` changes in `yesid.dev`:
  ```bash
  cd ~/Yesito/Projects/yesid.dev
  git diff main -- src/ tests/
  # expect: (empty)
  ```
- [ ] **Step B7:** Commit all doc changes on a branch:
  ```bash
  cd ~/Yesito/Projects/yesid.dev
  git checkout -b slice-18b-docs
  git add docs/slices/slice-18/ docs/reference/ARCHITECTURE.md tree.txt
  git commit -m "docs(slice-18b): bundle + ARCHITECTURE content-model subsection + sub-slice table flip"
  git push -u origin slice-18b-docs
  ```
- [ ] **Step B8:** Open PR B using `handoff.md` as body:
  ```bash
  gh pr create --base main --head slice-18b-docs \
    --title "Slice 18b docs — Content Model + Seed" \
    --body "$(cat docs/slices/slice-18/slice-18b/handoff.md)"
  ```
- [ ] **Step B9:** Wait for CI green. Merge PR B (squash).
- [ ] **Step B10:** Close sub-slice:
  ```bash
  cd ~/Yesito/Projects/yesid.dev
  bun run slice:close 18b --name "Content Model + Seed" --pr <B>
  ```
  Script mirrors the bundle to `<cloud>/yesid.dev/docs/archive/slices/slice-18/slice-18b/` and appends a one-liner to `COMPLETED-SLICES.md`.
- [ ] **Step B11:** Update `project_completed_slices.md` memory: append new row for 18b with shipped date + PR.

**STOP criteria:**
- PR B merged, CI green.
- `bun run slice:close 18b` ran successfully; bundle archived in cloud.
- `docs/slices/slice-18/README.md` shows 18b row = complete.
- `project_completed_slices.md` memory gains one row.
- `git diff main -- src/ tests/` in yesid.dev returns empty.

---

## PR + close protocol (summary)

Per spec D12 (mirrors 18a D11):

1. Tasks 18b-1 → 18b-8 push commits directly to `yesid.dev-cms/main`.
2. Task 18b-9 pushes the Blob-flip commit + dashboard actions (no code commits).
3. Task 18b-10 Part A commits README updates to `yesid.dev-cms/main`. PR A optional (direct main OK for greenfield).
4. Task 18b-10 Part B opens PR B in `yesid.dev` from `slice-18b-docs` branch. PR body = `handoff.md`.
5. PR B merges (squash).
6. `bun run slice:close 18b` archives the bundle to cloud + appends to `COMPLETED-SLICES.md`.
7. Memory auto-save (`project_completed_slices.md` row append).

## Risk register (deltas from spec)

Spec's 13-item risk register applies verbatim. Execution-time additions:

| Risk | Observed at task | Mitigation |
|------|------------------|------------|
| (none so far — populated during execution) | | |

## Out of scope reminders (from spec, repeated for discipline)

- No frontend integration (18c+).
- No type-sync GitHub Action (18c).
- No service-layer swap (18c+).
- No preview route or revalidation webhook (18f).
- No deletion of `yesid.dev` TS/MD content (18f).
- No admin theming (post-v1).
- No custom field components (post-v1).
- No editor role exercised beyond default admin.
- No Lexical editor customization.
- No multi-tenancy.
- No `tags` collection (D-rel-3).
- No inter-tech relationship graph on tech-stack (D-rel-2 — deferred to engine-builder slice).
- No MCP exposure on Users or Media (D10, D-rel-4).
