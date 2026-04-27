# Slice 18h — Meta + route_seo — Implementation Plan

> Read [spec.md](spec.md) + [decisions.md](decisions.md) first. Patterns reused from 18a–g without re-derivation.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` for task execution. Checkbox (`- [ ]`) syntax tracks progress. Per-phase boundary pause for owner review.
>
> **Worktree:** `C:/Users/otalo/Yesito/Projects/yesid.dev-18h` on `feature/slice-18-18h`.

## Phase map

| Phase | Tasks | Scope |
|---|---|---|
| 1 | Probes + fixtures | P1–P5 live probes (preset name, og-default UUID, title-body extraction, singleton SDK pattern, comments `_or` shape); author 2 fixtures (`site-meta.json` + `route-seo.json`) |
| 2 | Schema | 4 collections (singleton + 3 standard) + ~30 fields + 4 relations + permissions via directus-sync |
| 3 | Seed | `seed-site-meta.ts` (singleton upsert) + `seed-route-seo.ts` (multi-row); run live |
| 4 | Adapter | New `SiteSeoDefaults` + `RouteSeoOverride` TS + Zod (SiteMeta unchanged per Q9); `fetchSingletonRow()` shared helper; `meta.site()` flip to CMS; `meta.siteSeoDefaults()` new method (Q9 amendment); `meta.routeSeo.byPath()` new method; refactor `meta.forRoute()` to composer + `code-side per-route constant table` (new file) + extract dynamic factories (new file); contract + mocked tests |
| 5 | Consumer wiring + cleanup | `<SeoHead>` reads `themeColor` from data; `+layout.ts` fetches siteSeoDefaults alongside seo; brand `siteMeta` const extracted to `site-meta.ts`; STATIC routeSeoEntries deleted; `FALLBACK_DESCRIPTION` deleted; visual diff = 0 across 8 static routes + Footer + About + jsonLd |
| 6 | Close | Acceptance + GH issues + memory + PR |

Estimated effort: **0.75 session** (bumped from 0.5 by Q2 expansion).

## Phase 1 — Probes + fixtures (4 tasks)

**Exit gate:** P1–P5 documented in `research.md`; `apps/cms/fixtures/singletons/site-meta.json` + `apps/cms/fixtures/collections/route-seo.json` authored; FK references verified.

### Task 1: Run P1–P5 probes

```bash
# P1 — preset registry
find apps/cms/directus -path '*preset*' -type f
ls apps/cms/directus/snapshot/ 2>&1 | head -20

# P2 — og-default UUID
bun -e "const m = JSON.parse(require('fs').readFileSync('apps/cms/fixtures/assets-id-map.json','utf-8')); console.log(JSON.stringify(Object.entries(m).filter(([k]) => /og|default|social/i.test(k)), null, 2));"

# P3 — title-body extraction
bun -e "import('./apps/web/src/lib/content/meta.ts').then(m => ['/', '/about', '/contact', '/services', '/projects', '/blog', '/blog/personal', '/tech-stack'].forEach(p => { const e = m.routeSeoEntries[p]; if (typeof e === 'object') { console.log(p, '|', e.title.en, '|', e.description.en); } }));"

# P4 — singleton SDK pattern (verify @directus/sdk has updateSingleton + readSingleton)
grep -rn 'updateSingleton\|readSingleton\|singleton' apps/cms/scripts/ apps/web/src/lib/adapters/ apps/web/node_modules/@directus/sdk/dist/index.d.ts 2>/dev/null | head -20

# P5 — comments _or shape (existing rows for projects + tech_stack)
bun -e "const perms = JSON.parse(require('fs').readFileSync('apps/cms/directus/collections/permissions.json','utf-8')); console.log(JSON.stringify(perms.filter(p => p.collection === 'directus_comments').map(r => ({ action: r.action, policy: r.policy, permissions: r.permissions, _syncId: r._syncId })), null, 2));"
```

Document each finding inline in `research.md § P1–P5`. No commit (probe outputs only).

### Task 2: Author `apps/cms/fixtures/singletons/site-meta.json`

Single object — 13 parent fields + at least 1 EN translation row + (where available) FR/ES `owner_job_title` populated since EN/FR/ES are all available in the existing const for jobTitle.

```json
{
  "id": 1,
  "name": "yesid.",
  "email": "contact@yesid.dev",
  "github_url": "https://github.com/mgkdante",
  "linkedin_url": "https://www.linkedin.com/in/otaloray/",
  "upwork_url": "https://www.upwork.com/freelancers/~011ba4ec420b4cdd82",
  "owner_name": "Yesid O.",
  "owner_locality": "Montreal",
  "owner_region": "QC",
  "owner_country": "CA",
  "owner_knows_about": "PostgreSQL,dbt,Power BI,Python,Digital Infrastructure,ETL,Data Warehousing,SvelteKit,TypeScript",
  "default_og_image": "<UUID-from-P2-or-null>",
  "theme_color": "#141414",
  "translations": [
    {
      "languages_code": "en",
      "tagline": "Digital infrastructure that moves.",
      "description": "Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.",
      "default_description": "yesid. — freelance data infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, Python. Real-time pipelines, analytics, dashboards for growing teams.",
      "owner_job_title": "Digital Infrastructure Consultant"
    },
    {
      "languages_code": "fr",
      "tagline": "",
      "description": "",
      "default_description": "",
      "owner_job_title": "Consultant en infrastructure numérique"
    },
    {
      "languages_code": "es",
      "tagline": "",
      "description": "",
      "default_description": "",
      "owner_job_title": "Consultor de infraestructura digital"
    }
  ]
}
```

`tagline`/`description`/`default_description` for FR + ES are empty strings (no copy yet). EN row carries the data; `<SeoHead>` falls through to EN via existing `resolveLocale()` helper. Editors populate FR/ES via Data Studio when copy is signed off.

If P2 returns no og-default UUID, set `default_og_image: null` and rely on code-side `SITE_HOST + '/og/default.png'` fallback. File at 18h close: GH issue for og-default brand asset upload.

```bash
mkdir -p apps/cms/fixtures/singletons
# write file
git add apps/cms/fixtures/singletons/site-meta.json
git commit -m "feat(slice-18 18h Phase 1 Task 2): site_meta singleton fixture (brand + SEO defaults)"
```

### Task 3: Author `apps/cms/fixtures/collections/route-seo.json`

Array of 8 rows — one per static route. Titles are page-body only (` | yesid.` suffix stripped — composer auto-appends from `site_meta.name`).

```json
[
  {
    "path": "/",
    "og_image": null,
    "status": "published",
    "sort": 1,
    "translations": [
      { "languages_code": "en", "title": "Digital Infrastructure that Moves.", "description": "Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, dashboards." }
    ]
  },
  { "path": "/about", "og_image": null, "status": "published", "sort": 2, "translations": [{ "languages_code": "en", "title": "About Yesid", "description": "Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work." }] },
  { "path": "/contact", "og_image": null, "status": "published", "sort": 3, "translations": [{ "languages_code": "en", "title": "Contact", "description": "Get in touch for freelance SQL, PostgreSQL, dbt, Power BI, or data infrastructure work. Based in Montreal; available across Canada and for remote engagements." }] },
  { "path": "/services", "og_image": null, "status": "published", "sort": 4, "translations": [{ "languages_code": "en", "title": "Services", "description": "Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams." }] },
  { "path": "/projects", "og_image": null, "status": "published", "sort": 5, "translations": [{ "languages_code": "en", "title": "Projects", "description": "Recent freelance and client work: real-time transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects for teams in Montreal and Canada." }] },
  { "path": "/blog", "og_image": null, "status": "published", "sort": 6, "translations": [{ "languages_code": "en", "title": "Blog", "description": "Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and building analytics systems for growing teams. Montreal-based freelance consultant." }] },
  { "path": "/blog/personal", "og_image": null, "status": "published", "sort": 7, "translations": [{ "languages_code": "en", "title": "Personal Blog", "description": "Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog, still fundamentally about building things well." }] },
  { "path": "/tech-stack", "og_image": null, "status": "published", "sort": 8, "translations": [{ "languages_code": "en", "title": "Tech Stack", "description": "The tools, languages, and platforms yesid. works with daily: PostgreSQL, dbt, Power BI, Python, SvelteKit, TypeScript, and the glue that holds them together." }] }
]
```

```bash
git add apps/cms/fixtures/collections/route-seo.json
git commit -m "feat(slice-18 18h Phase 1 Task 3): route_seo fixture (8 static routes, EN)"
```

### Task 4: Phase 1 review pause

Owner reviews probe findings + fixture content. Any deviation from plan locked into `decisions.md` as an amendment. Phase 2 dispatch only after owner sign-off.

## Phase 2 — Schema (1 task)

**Exit gate:** all 4 collections live; `bun run sync:diff` clean; permissions matrix correct.

### Task 5: Author Directus schema via directus-sync

Mirror existing patterns. Files to create under `apps/cms/directus/snapshot/`:

**Collections (4 files):**

- `collections/site_meta.json` — `meta.singleton: true`, `display_template: "{{name}}"`, `icon: "tune"`, `note: "Site identity + SEO defaults (brand name, contact links, owner identity, fallback OG image, theme color). Singleton — one row only."`, `accountability: "all"`, `versioning: true`
- `collections/site_meta_translations.json` — translation junction; `hidden: true` from main nav
- `collections/route_seo.json` — `display_template: "{{path}}"`, `icon: "link"`, `archive_field: "status"`, `sort_field: "sort"`, `note: "Per-route SEO override (title + description + og_image) for static routes. Falls back to site_meta defaults when fields are empty."`, `preview_url: "https://yesid.dev{{path}}"`
- `collections/route_seo_translations.json` — translation junction; `hidden: true`

**Fields (~30 files):**

- `fields/site_meta/{id,name,email,github_url,linkedin_url,upwork_url,owner_name,owner_locality,owner_region,owner_country,owner_knows_about,default_og_image,theme_color}.json` (13)
- `fields/site_meta_translations/{id,site_meta_id,languages_code,tagline,description,default_description,owner_job_title}.json` (7)
- `fields/route_seo/{id,path,og_image,status,sort}.json` (5)
- `fields/route_seo_translations/{id,route_seo_id,languages_code,title,description}.json` (5)

**Field interface choices:**

- `email` → `input` interface with format `email` validation
- `*_url` fields → `input` interface with format `url` validation
- `owner_country` → `input` interface, length=2 — display hint "ISO 3166-1 alpha-2 (e.g., CA, US, MX)"
- `owner_knows_about` → `tags` interface (CSV in DB; pill-input UI in Data Studio)
- `default_og_image` → `file-image` interface, M2O to directus_files, folder filter `og` if exists
- `theme_color` → `input` interface with regex validation `^#[0-9a-fA-F]{6}$`
- `tagline` / `description` / `default_description` → `input-multiline` (textarea) per CONVENTIONS § 7
- `owner_job_title` → `input` interface
- `path` (route_seo) → `input` interface, regex `^/`
- `route_seo_translations.title` / `description` → `input` (allow null/empty for "fall back" semantics)

**Relations (4 files):**

- `relations/site_meta_translations/{site_meta_id,languages_code}.json` (2)
- `relations/route_seo_translations/{route_seo_id,languages_code}.json` (2)

**Permissions (extend single `apps/cms/directus/collections/permissions.json`):**

For `route_seo` — mirror blog_posts shape (3 ai-editor rows: read/create/update with publish-block on create+update; 3 human-editor rows: read/create/update; 1 Public row: read filter `status=published`) — 7 rows total.

For `site_meta` (singleton variant — 5 rows):
- ai-editor read (no filter)
- ai-editor update (no filter)
- human-editor read
- human-editor update
- Public read (no filter — singleton always exposed)

For `directus_comments` — extend the existing `_or` array per P5 finding. Add `{ collection: { _eq: 'site_meta' } }` + `{ collection: { _eq: 'route_seo' } }` to each existing comments row.

After authoring:

```bash
cd apps/cms
bun run sync:diff   # show pending changes — must look right

# PowerShell session (live ops):
$env:OP_SERVICE_ACCOUNT_TOKEN = [System.Environment]::GetEnvironmentVariable('OP_SERVICE_ACCOUNT_TOKEN', 'User')
$env:DIRECTUS_ADMIN_EMAIL = private-contact-03@example.invalid'
$env:DIRECTUS_ADMIN_PASSWORD = (op read 'op://yesid-dev/Directus admin - cms.yesid.dev/password').Trim()
cd apps/cms
bun run sync:push
bun run sync:diff   # must be silent
```

Commit:

```bash
git add apps/cms/directus/snapshot/ apps/cms/directus/collections/permissions.json
git commit -m "feat(slice-18 18h Phase 2): site_meta singleton (brand + SEO defaults) + route_seo schema + permissions"
```

## Phase 3 — Seed (3 tasks)

**Exit gate:** singleton + 8 route rows live in Directus; verifiable via Public reads.

### Task 6: `apps/cms/scripts/seed-site-meta.ts`

Singleton upsert pattern (per P4 finding). Probable shape using SDK `updateSingleton()`:

```ts
#!/usr/bin/env bun
import { createDirectus, rest, updateSingleton, withToken } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { defaultDirectusUrl } from './lib/sdk';
import { readFixture } from './lib/read-fixture';
import { z } from 'zod';
import { logger } from './lib/logger';
import { parseErrors } from './lib/catch-error';

const SiteMetaTranslationSchema = z.object({
  languages_code: z.enum(['en', 'fr', 'es']),
  tagline: z.string().max(100),
  description: z.string().max(300),
  default_description: z.string(),  // 50–200 enforced for `en` only via .superRefine below
  owner_job_title: z.string().max(80),
});

const SiteMetaFixtureSchema = z.object({
  id: z.literal(1),
  name: z.string().max(30),
  email: z.string().email(),
  github_url: z.string().url(),
  linkedin_url: z.string().url().optional(),
  upwork_url: z.string().url().optional(),
  owner_name: z.string().max(80),
  owner_locality: z.string().max(80),
  owner_region: z.string().max(4),
  owner_country: z.string().length(2),
  owner_knows_about: z.string(),  // CSV
  default_og_image: z.string().uuid().nullable(),
  theme_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  translations: z.array(SiteMetaTranslationSchema).min(1).superRefine((arr, ctx) => {
    const en = arr.find((t) => t.languages_code === 'en');
    if (!en) ctx.addIssue({ code: 'custom', message: 'EN translation required' });
    if (en && (en.default_description.length < 50 || en.default_description.length > 200)) {
      ctx.addIssue({ code: 'custom', message: `EN default_description must be 50–200 chars (got ${en.default_description.length})` });
    }
  }),
});

const log = logger('seed-site-meta');

export async function seedSiteMeta(opts: { dryRun?: boolean; reset?: boolean }) {
  const fixture = readFixture('apps/cms/fixtures/singletons/site-meta.json', SiteMetaFixtureSchema);
  if (opts.dryRun) {
    log.info('dry-run', { id: fixture.id, fieldCount: Object.keys(fixture).length, translationCount: fixture.translations.length });
    return;
  }
  const token = await getAdminToken();
  const client = createDirectus(defaultDirectusUrl()).with(rest());
  // Singleton upsert: updateSingleton creates the row if it doesn't exist;
  // overwrites payload otherwise. --reset has no special semantics for a
  // singleton (the row is unique by definition; we always upsert).
  await client.request(withToken(token, updateSingleton('site_meta', fixture)));
  log.info('site_meta upserted', { id: 1 });
}

if (import.meta.main) {
  const dryRun = process.argv.includes('--dry-run');
  const reset = process.argv.includes('--reset');
  seedSiteMeta({ dryRun, reset }).catch((err) => {
    log.error(parseErrors(err));
    process.exit(1);
  });
}
```

Add unit test `apps/cms/tests/seed-site-meta-dry-run.test.ts` that exercises fixture schema parse + dry-run logging + EN-required check.

```bash
git add apps/cms/scripts/seed-site-meta.ts apps/cms/tests/seed-site-meta-dry-run.test.ts
git commit -m "feat(slice-18 18h Phase 3 Task 6): seed-site-meta.ts (singleton upsert, brand + SEO defaults)"
```

### Task 7: `apps/cms/scripts/seed-route-seo.ts`

Standard collection seed (mirror `seed-services.ts` / `seed-tech-stack.ts` shape — lib/* helpers + Zod fixture + dry-run + reset + pure helpers + parseFlags + main + import.meta.main guard).

```ts
const RouteSeoTranslationSchema = z.object({
  languages_code: z.enum(['en', 'fr', 'es']),
  title: z.string().max(70).nullable(),
  description: z.string().min(50).max(200).nullable(),
});

const RouteSeoFixtureSchema = z.array(
  z.object({
    path: z.string().regex(/^\//),
    og_image: z.string().uuid().nullable(),
    status: z.enum(['draft', 'published', 'archived']),
    sort: z.number().int(),
    translations: z.array(RouteSeoTranslationSchema).min(1),
  }),
);
```

`--reset` deletes all rows then recreates (standard collection-seed semantics; NOT singleton). Idempotent re-runs upsert by `path` (use `path` as the natural key for skeleton-then-full-data pattern).

```bash
git add apps/cms/scripts/seed-route-seo.ts apps/cms/tests/seed-route-seo-dry-run.test.ts
git commit -m "feat(slice-18 18h Phase 3 Task 7): seed-route-seo.ts (8 static routes)"
```

### Task 8: Run seeds live + verify

PowerShell session (live ops):

```powershell
$env:OP_SERVICE_ACCOUNT_TOKEN = [System.Environment]::GetEnvironmentVariable('OP_SERVICE_ACCOUNT_TOKEN', 'User')
$env:DIRECTUS_ADMIN_EMAIL = private-contact-03@example.invalid'
$env:DIRECTUS_ADMIN_PASSWORD = (op read 'op://yesid-dev/Directus admin - cms.yesid.dev/password').Trim()
bun run apps/cms/scripts/seed-site-meta.ts --dry-run
bun run apps/cms/scripts/seed-site-meta.ts
bun run apps/cms/scripts/seed-route-seo.ts --dry-run | head -40
bun run apps/cms/scripts/seed-route-seo.ts
```

Verify (bash session):

```bash
# Public reads (no auth)
curl -s 'https://cms.yesid.dev/items/site_meta?fields=id,name,email,owner_name,theme_color,default_og_image,translations.languages_code,translations.tagline,translations.owner_job_title' | bun -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf-8')), null, 2))"
curl -s 'https://cms.yesid.dev/items/route_seo?fields=path,status,sort,translations.languages_code,translations.title&limit=-1' | bun -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf-8')), null, 2))"
echo -n "route_seo count: " && curl -s 'https://cms.yesid.dev/items/route_seo?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data?.length ?? 'ERROR')"
```

Expected: site_meta returns 1 row with all 13 parent fields + 3 translation rows (EN populated, FR/ES with `owner_job_title` only); route_seo returns 8 rows with EN translations.

No commit (operates on live state).

## Phase 4 — Adapter (5 tasks)

**Exit gate:** `meta.site()` (brand) + `meta.siteSeoDefaults()` (SEO defaults) + `meta.routeSeo.byPath()` + composed `meta.forRoute()` work via live Public reads with parsePort guards; contract + mocked tests pass; `bun run check` 0 errors; jsonLd factories + Footer/About emit unchanged output. Single `readSingleton('site_meta')` call per route navigation (verified via mocked-fetch test).

### Task 9: Add new types — `SiteSeoDefaults` + `RouteSeoOverride` + Zod schemas

`SiteMeta` TS interface UNCHANGED (Q9 amendment). New types:

`packages/shared/src/types/content.ts`:

```ts
export interface SiteSeoDefaults {
  defaultOgImage: string | null;        // UUID or null
  themeColor: string;                    // hex color, e.g. '#141414'
  defaultDescription: LocalizedString;   // SEO fallback meta description
}

export interface RouteSeoOverride {
  path: string;
  ogImage: string | null;                // UUID or null
  title: LocalizedString | null;         // null = no override
  description: LocalizedString | null;   // null = no override
}
```

`apps/web/src/lib/schemas/site-seo-defaults.ts` (NEW):

```ts
import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { SiteSeoDefaults } from '$lib/types';

export const SiteSeoDefaultsSchema = z.object({
  defaultOgImage: z.string().uuid().nullable(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  defaultDescription: LocalizedStringSchema,
});

// Drift detector — mirrors apps/web/src/lib/schemas/meta.ts § _SiteMetaCheck pattern
type _SiteSeoDefaultsCheck = z.infer<typeof SiteSeoDefaultsSchema> extends SiteSeoDefaults
  ? SiteSeoDefaults extends z.infer<typeof SiteSeoDefaultsSchema>
    ? true
    : false
  : false;
const _siteSeoDefaultsCheck: _SiteSeoDefaultsCheck = true;
void _siteSeoDefaultsCheck;
```

`apps/web/src/lib/schemas/route-seo.ts` (NEW):

```ts
import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { RouteSeoOverride } from '$lib/types';

export const RouteSeoOverrideSchema = z.object({
  path: z.string().regex(/^\//),
  ogImage: z.string().uuid().nullable(),
  title: LocalizedStringSchema.nullable(),
  description: LocalizedStringSchema.nullable(),
});

type _RouteSeoOverrideCheck = z.infer<typeof RouteSeoOverrideSchema> extends RouteSeoOverride
  ? RouteSeoOverride extends z.infer<typeof RouteSeoOverrideSchema>
    ? true
    : false
  : false;
const _routeSeoOverrideCheck: _RouteSeoOverrideCheck = true;
void _routeSeoOverrideCheck;
```

Re-export from `apps/web/src/lib/types/index.ts`.

Create `apps/web/src/lib/content/site-meta.ts` (NEW — extracted brand const for static-adapter test fixture):

```ts
import type { SiteMeta } from '$lib/types';

// Static brand identity — used by static.ts adapter as test fixture / fallback only.
// Runtime data comes from CMS via directus.ts adapter (Q2 amendment 2026-04-27).
// Will be deleted in 18k when static adapter retires.
export const siteMeta: SiteMeta = {
  name: 'yesid.',
  tagline: { en: 'Digital infrastructure that moves.' },
  description: { en: 'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.' },
  links: {
    email: 'contact@yesid.dev',
    github: 'https://github.com/mgkdante',
    linkedin: 'https://www.linkedin.com/in/otaloray/',
    upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82',
  },
  owner: {
    name: 'Yesid O.',
    jobTitle: {
      en: 'Digital Infrastructure Consultant',
      fr: 'Consultant en infrastructure numérique',
      es: 'Consultor de infraestructura digital',
    },
    address: { locality: 'Montreal', region: 'QC', country: 'CA' },
    knowsAbout: ['PostgreSQL', 'dbt', 'Power BI', 'Python', 'Digital Infrastructure', 'ETL', 'Data Warehousing', 'SvelteKit', 'TypeScript'],
  },
};
```

Update `apps/web/src/lib/adapters/static.ts § meta.site()` to import from `$lib/content/site-meta` (was `$lib/content/meta`).

For static adapter, also implement `meta.siteSeoDefaults()` returning a hardcoded fallback shape:

```ts
// static.ts § meta.siteSeoDefaults
siteSeoDefaults: async () => ({
  defaultOgImage: null,  // resolves to '/og/default.png' in consumer
  themeColor: '#141414',
  defaultDescription: { en: 'yesid. — freelance data infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, Python. Real-time pipelines, analytics, dashboards for growing teams.' },
}),
```

```bash
cd apps/web && bun run check 2>&1 | tail -10  # drift detectors should pass
git add packages/shared/src/types/content.ts apps/web/src/lib/types apps/web/src/lib/schemas/site-seo-defaults.ts apps/web/src/lib/schemas/route-seo.ts apps/web/src/lib/content/site-meta.ts apps/web/src/lib/adapters/static.ts
git commit -m "feat(slice-18 18h Phase 4 Task 9): SiteSeoDefaults + RouteSeoOverride types + Zod + drift detectors; extract brand const to site-meta.ts"
```

### Task 10: Implement `meta.site()` flip + `meta.siteSeoDefaults()` + `meta.routeSeo.byPath()` in `directus.ts` (shared `fetchSingletonRow`)

Per Q9 amendment: two methods read from one shared singleton fetch. WeakMap memo on the raw row, not on output shapes.

```ts
interface DirectusSiteMetaTranslation {
  languages_code: 'en' | 'fr' | 'es';
  tagline: string;
  description: string;
  default_description: string;
  owner_job_title: string;
}
interface DirectusSiteMetaRow {
  id: number;
  name: string;
  email: string;
  github_url: string;
  linkedin_url: string | null;
  upwork_url: string | null;
  owner_name: string;
  owner_locality: string;
  owner_region: string;
  owner_country: string;
  owner_knows_about: string;  // CSV
  default_og_image: string | null;
  theme_color: string;
  translations: readonly DirectusSiteMetaTranslation[];
}

const SITE_META_FIELDS = [
  'id', 'name', 'email', 'github_url', 'linkedin_url', 'upwork_url',
  'owner_name', 'owner_locality', 'owner_region', 'owner_country', 'owner_knows_about',
  'default_og_image', 'theme_color',
  { translations: ['languages_code', 'tagline', 'description', 'default_description', 'owner_job_title'] },
] as const;

const ROUTE_SEO_FIELDS = ['id', 'path', 'og_image', 'status', { translations: ['languages_code', 'title', 'description'] }] as const;

// Shared singleton fetch — both meta.site() and meta.siteSeoDefaults() use this.
// Per-request WeakMap memo on the raw row (not on mapped shapes) so both methods
// share a single CMS round-trip.
const siteRowMemo = new WeakMap<object, DirectusSiteMetaRow>();
const defaultCtx = {};

async function fetchSingletonRow(ctx?: PreviewContext): Promise<DirectusSiteMetaRow> {
  const memoKey = (ctx as object | undefined) ?? defaultCtx;
  const cached = siteRowMemo.get(memoKey);
  if (cached) return cached;
  const fetch = queuedFetch(ctx);
  const row = (await fetch(readSingleton('site_meta', { fields: SITE_META_FIELDS as unknown as string[] }))) as unknown as DirectusSiteMetaRow;
  siteRowMemo.set(memoKey, row);
  return row;
}

// Brand SiteMeta mapper — TS shape unchanged (Q9).
function toSiteMeta(row: DirectusSiteMetaRow): SiteMeta {
  const links: SiteLinks = {
    email: row.email,
    github: row.github_url,
    ...(row.linkedin_url && { linkedin: row.linkedin_url }),
    ...(row.upwork_url && { upwork: row.upwork_url }),
  };
  const knowsAbout = row.owner_knows_about.split(',').map((s) => s.trim()).filter(Boolean);
  const owner: SiteOwner = {
    name: row.owner_name,
    jobTitle: toLocalizedString(row.translations, 'owner_job_title'),
    address: { locality: row.owner_locality, region: row.owner_region, country: row.owner_country },
    knowsAbout,
  };
  return {
    name: row.name,
    tagline: toLocalizedString(row.translations, 'tagline'),
    description: toLocalizedString(row.translations, 'description'),
    links,
    owner,
  };
}

// SEO defaults mapper — new shape (Q9).
function toSiteSeoDefaults(row: DirectusSiteMetaRow): SiteSeoDefaults {
  return {
    defaultOgImage: row.default_og_image,
    themeColor: row.theme_color,
    defaultDescription: toLocalizedString(row.translations, 'default_description'),
  };
}

interface DirectusRouteSeoTranslation {
  languages_code: 'en' | 'fr' | 'es';
  title: string | null;
  description: string | null;
}
interface DirectusRouteSeoRow {
  id: number;
  path: string;
  og_image: string | null;
  status: 'draft' | 'published' | 'archived';
  translations: readonly DirectusRouteSeoTranslation[];
}

function toRouteSeoOverride(row: DirectusRouteSeoRow): RouteSeoOverride {
  return {
    path: row.path,
    ogImage: row.og_image,
    title: toLocalizedStringNullable(row.translations, 'title'),
    description: toLocalizedStringNullable(row.translations, 'description'),
  };
}

// In the meta port:
site: async (ctx) => {
  const row = await fetchSingletonRow(ctx);
  return parsePort('meta.site', SiteMetaSchema, toSiteMeta(row));
},

siteSeoDefaults: async (ctx) => {
  const row = await fetchSingletonRow(ctx);
  return parsePort('meta.siteSeoDefaults', SiteSeoDefaultsSchema, toSiteSeoDefaults(row));
},

routeSeo: {
  byPath: async (path, ctx) => {
    const fetch = queuedFetch(ctx);
    const rows = (await fetch(readItems('route_seo', {
      filter: { _and: [{ path: { _eq: path } }, { status: { _eq: 'published' } }] },
      fields: ROUTE_SEO_FIELDS as unknown as string[],
      limit: 1,
    }))) as unknown as DirectusRouteSeoRow[];
    const item = rows[0] ? toRouteSeoOverride(rows[0]) : undefined;
    return parsePort('meta.routeSeo.byPath', RouteSeoOverrideSchema.optional(), item);
  },
},
```

Update `apps/web/src/lib/adapters/types.ts § MetaPort`:

```ts
export interface MetaPort {
  site(ctx?: PreviewContext): Promise<SiteMeta>;
  siteSeoDefaults(ctx?: PreviewContext): Promise<SiteSeoDefaults>;
  routeSeo: {
    byPath(path: string, ctx?: PreviewContext): Promise<RouteSeoOverride | undefined>;
  };
  forRoute(routeId: string, locale: Locale, params?: Record<string, string>, ctx?: PreviewContext): Promise<PageSeo>;
}
```

Static adapter: keep `routeSeo.byPath` returning `undefined` (static has no per-route overrides; `forRoute()` falls through to code-side defaults).

```bash
git commit -am "feat(slice-18 18h Phase 4 Task 10): directus.meta.site flip to CMS; siteSeoDefaults + routeSeo.byPath new methods; shared fetchSingletonRow + WeakMap memo on raw row"
```

### Task 11: Extract dynamic factories to `route-seo-factories.ts` + create `route-seo-defaults.ts` + composer

New file `apps/web/src/lib/adapters/route-seo-factories.ts` — moves the 3 dynamic factories + 1 error fallback from `apps/web/src/lib/content/meta.ts`. Refactored signature accepts both `siteMeta` and `siteSeoDefaults`:

```ts
// Extracted from apps/web/src/lib/content/meta.ts in 18h.
// Each factory receives (params, locale, ctx, adapter, siteMeta, siteSeoDefaults) and returns a PageSeo.
// Both site shapes fetched ONCE per layout load (shared fetchSingletonRow memo).
import type { ContentAdapter, Locale, PageSeo, SiteMeta, SiteSeoDefaults, PreviewContext } from '$lib/types';
import { extractText } from '@repo/shared';
import { SITE_HOST } from '$lib/utils/seo-defaults';
import { buildPersonNode, buildServiceNode, buildCreativeWorkNode, buildBlogPostingNode, buildBreadcrumbListNode } from '$lib/adapters/jsonld';

interface FactoryArgs {
  params: Record<string, string>;
  locale: Locale;
  ctx?: PreviewContext;
  adapter: ContentAdapter;
  siteMeta: SiteMeta;
  siteSeoDefaults: SiteSeoDefaults;
}

export async function servicesIdSeoFactory(args: FactoryArgs): Promise<PageSeo> {
  const { params, locale, ctx, adapter, siteMeta, siteSeoDefaults } = args;
  const service = await adapter.services.byId(params.id, ctx);
  if (!service) throw new Error(`Unknown service id: ${params.id}`);
  // ... existing logic from routeSeoEntries['/services/[id]'], using:
  //   - siteMeta.name for title suffix
  //   - siteMeta for jsonLd factory args (Person, Service nodes)
  //   - siteSeoDefaults.defaultDescription as fallback when service.description fails fitDescriptionForSeo
}

export async function projectsSlugSeoFactory(args: FactoryArgs): Promise<PageSeo> { /* ... */ }
export async function blogSlugSeoFactory(args: FactoryArgs): Promise<PageSeo> { /* ... */ }
export function errorSeoFallback(args: { locale: Locale; siteMeta: SiteMeta; siteSeoDefaults: SiteSeoDefaults }): PageSeo { /* ... */ }

// fitDescriptionForSeo helper moves to this file too — used by all factories.
function fitDescriptionForSeo(desc: { en: string; fr?: string; es?: string } | undefined, fallback: { en: string; fr?: string; es?: string }) {
  if (!desc) return fallback;
  const len = desc.en.length;
  if (len < 50 || len > 200) return fallback;
  return desc;
}
```

New file `apps/web/src/lib/adapters/route-seo-defaults.ts` — code-side technical defaults for static routes:

```ts
import type { Locale, PageSeo, SiteMeta, SchemaOrgNode } from '$lib/types';
import { buildPersonNode, buildWebSiteNode, buildProfilePageNode, buildBreadcrumbListNode, buildCollectionPageNode } from '$lib/adapters/jsonld';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export interface CodeRouteSeoDefaults {
  ogType: PageSeo['ogType'];
  noIndex: boolean;
  fallbackTitle: { en: string; fr?: string; es?: string };
  /** P3 finding 2026-04-27: home `/` uses em-dash brand-first format (`yesid. — X`); all other routes use `X | yesid.` pipe suffix. 'verbatim' = use fallbackTitle/route_seo title as-is; 'append-brand' = append ` | ${siteMeta.name}` per locale. */
  composedTitleStrategy: 'verbatim' | 'append-brand';
  jsonLdFactory: (siteMeta: SiteMeta, locale: Locale) => SchemaOrgNode[];
}

export const codeRouteSeoDefaults: Record<string, CodeRouteSeoDefaults> = {
  '/': {
    ogType: 'website',
    noIndex: false,
    fallbackTitle: { en: 'yesid. — Digital Infrastructure that Moves.' },
    composedTitleStrategy: 'verbatim',
    jsonLdFactory: (sm) => [buildPersonNode(sm), buildWebSiteNode(sm), buildProfilePageNode(SITE_HOST)],
  },
  '/about': {
    ogType: 'profile',
    noIndex: false,
    fallbackTitle: { en: 'About Yesid' },
    composedTitleStrategy: 'append-brand',
    jsonLdFactory: (sm) => [buildPersonNode(sm), buildProfilePageNode(`${SITE_HOST}/about`), buildBreadcrumbListNode([{ name: 'Home', url: SITE_HOST }, { name: 'About', url: `${SITE_HOST}/about` }], `${SITE_HOST}/about`)],
  },
  // ... 6 more entries (one per static route): /contact, /services, /projects, /blog, /blog/personal, /tech-stack — all 'append-brand'
};
```

Refactor `directus.meta.forRoute()`:

```ts
forRoute: async (routeId, locale, params, ctx) => {
  const [siteMeta, siteSeoDefaults] = await Promise.all([
    adapter.meta.site(ctx),
    adapter.meta.siteSeoDefaults(ctx),
  ]);

  // Dynamic factory dispatch
  const dynamicFactory = routeSeoFactories[routeId];
  if (dynamicFactory) {
    return dynamicFactory({ params: params!, locale, ctx, adapter, siteMeta, siteSeoDefaults });
  }

  // Static-route compose
  const codeDefaults = codeRouteSeoDefaults[routeId];
  if (!codeDefaults) throw new Error(`[meta.forRoute] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts or seed a route_seo row.`);
  const routeOverride = await adapter.meta.routeSeo.byPath(routeId, ctx);
  return composePageSeo({ routeId, locale, siteMeta, siteSeoDefaults, routeOverride, codeDefaults });
},
```

`routeSeoFactories` registry:

```ts
const routeSeoFactories: Record<string, (args: FactoryArgs) => Promise<PageSeo>> = {
  '/services/[id]': servicesIdSeoFactory,
  '/projects/[slug]': projectsSlugSeoFactory,
  '/blog/[slug]': blogSlugSeoFactory,
};
// '/__error' handled separately (synchronous) — see errorSeoFallback in static fallback.
```

Add `composePageSeo` pure helper at `apps/web/src/lib/adapters/compose-page-seo.ts`:

```ts
export function composePageSeo(args: {
  routeId: string;
  locale: Locale;
  siteMeta: SiteMeta;
  siteSeoDefaults: SiteSeoDefaults;
  routeOverride: RouteSeoOverride | undefined;
  codeDefaults: CodeRouteSeoDefaults;
}): PageSeo {
  const { routeId, locale, siteMeta, siteSeoDefaults, routeOverride, codeDefaults } = args;
  const titleBody = routeOverride?.title ?? codeDefaults.fallbackTitle;
  // P3 finding 2026-04-27: home `/` preserves 'yesid. — X' em-dash format; all other routes append ' | yesid.'.
  const title: LocalizedString = codeDefaults.composedTitleStrategy === 'verbatim'
    ? titleBody
    : {
        en: `${titleBody.en} | ${siteMeta.name}`,
        ...(titleBody.fr && { fr: `${titleBody.fr} | ${siteMeta.name}` }),
        ...(titleBody.es && { es: `${titleBody.es} | ${siteMeta.name}` }),
      };
  const description = routeOverride?.description ?? siteSeoDefaults.defaultDescription;
  const ogImageUuid = routeOverride?.ogImage ?? siteSeoDefaults.defaultOgImage;
  return {
    title,
    description,
    canonical: `${SITE_HOST}${routeId === '/' ? '' : routeId}`,
    ogImage: ogImageUuid ? {
      url: asset(ogImageUuid, 'og-1200'),
      alt: { en: `${siteMeta.name} — ${titleBody.en}` },
      width: 1200,
      height: 630,
    } : undefined,
    ogType: codeDefaults.ogType,
    noIndex: codeDefaults.noIndex,
    jsonLd: codeDefaults.jsonLdFactory(siteMeta, locale),
  };
}
```

```bash
git commit -am "feat(slice-18 18h Phase 4 Task 11): meta.forRoute composer + route-seo-defaults + extracted factories (consume both siteMeta + siteSeoDefaults)"
```

### Task 12: Adapter index hybrid flip + repository wrapper update

In `apps/web/src/lib/adapters/index.ts`:
- Hybrid flip: directus adapter wins for `meta` port (all methods)
- Static adapter remains as fallback (test scope)

In `apps/web/src/lib/repositories/meta.ts`:
- Existing `getSiteMeta()` continues to wrap `adapter.meta.site()` — now returns CMS-backed brand SiteMeta
- New `getSiteSeoDefaults()` wraps `adapter.meta.siteSeoDefaults()`
- Existing `getPageSeo()` continues to wrap `adapter.meta.forRoute()` — now uses composer

```bash
cd apps/web && bun run check 2>&1 | tail -10
git commit -am "feat(slice-18 18h Phase 4 Task 12): hybrid flip meta port; getSiteSeoDefaults repo wrapper"
```

### Task 13: Contract + mocked tests

`apps/web/src/lib/adapters/directus.contract.test.ts` — assert:
1. `composePageSeo` output for each of 8 static routes equals the existing `routeSeoEntries` static entries (deep-equal on `<head>` shape, ignoring jsonLd factory output equivalence)
2. `meta.site()` returned shape matches `SiteMetaSchema` (covered by `parsePort`)
3. `meta.siteSeoDefaults()` returned shape matches `SiteSeoDefaultsSchema`
4. `meta.routeSeo.byPath('/about')` returns expected override structure
5. **Single-fetch invariant:** calling `meta.site()` + `meta.siteSeoDefaults()` in the same context only triggers ONE `readSingleton('site_meta')` call (asserts the WeakMap memo on raw row works)

`apps/web/src/lib/adapters/directus.mocked.test.ts` — mock fetch for:
1. `readSingleton('site_meta')` — assert URL shape, fields list (count: 1 per `meta.forRoute()` invocation)
2. `readItems('route_seo', { filter: { _and: [{ path: { _eq: '/about' } }, { status: { _eq: 'published' } }] } })` — assert filter + fields shape

```bash
cd apps/web && bun run check 2>&1 | tail -10
cd apps/web && bun run test 2>&1 | tail -10
git commit -am "test(slice-18 18h Phase 4 Task 13): meta composer contract + single-fetch invariant + mocked-fetch tests"
```

## Phase 5 — Consumer wiring + cleanup (3 tasks)

**Exit gate:** `<SeoHead>` reads `themeColor` from data; visual diff = 0 across 8 static routes + Footer + About + jsonLd; `bun run check` 0 errors; `bun run test` no regressions.

### Task 14: `<SeoHead>` accepts `themeColor` prop + `+layout.ts` threads through

```svelte
<!-- SeoHead.svelte -->
let {
  seo,
  locale,
  themeColor = '#141414',  // fallback for static-adapter scenarios
  dev = runtimeDev,
}: { seo: PageSeo; locale: Locale; themeColor?: string; dev?: boolean } = $props();
<!-- ... -->
<meta name="theme-color" content={themeColor} />
```

`+layout.ts`:

```ts
import { getSiteSeoDefaults, getPageSeo } from '$lib/repositories/meta';

export const load: LayoutLoad = async ({ route, params }) => {
  const routeId = route.id ?? '/__error';
  const locale = DEFAULT_LOCALE;
  try {
    const [seo, siteSeoDefaults] = await Promise.all([
      getPageSeo(routeId, locale, params as Record<string, string>),
      getSiteSeoDefaults(),
    ]);
    return { seo, themeColor: siteSeoDefaults.themeColor };
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[+layout.ts] Falling back to error SEO for route "${routeId}":`, err);
    const seo = await getPageSeo('/__error', locale);
    return { seo, themeColor: '#141414' };
  }
};
```

`+layout.svelte`:

```svelte
<SeoHead seo={data.seo} locale={DEFAULT_LOCALE} themeColor={data.themeColor} />
```

The `Promise.all` with `getPageSeo` + `getSiteSeoDefaults` shares the underlying `fetchSingletonRow()` memo — one CMS round-trip.

```bash
cd apps/web && bun run check 2>&1 | tail -10
git commit -am "feat(slice-18 18h Phase 5 Task 14): SeoHead reads themeColor from layout data"
```

### Task 15: Cleanup `apps/web/src/lib/content/meta.ts`

Delete from this file:
- `siteMeta` const (already extracted to `apps/web/src/lib/content/site-meta.ts` in Task 9)
- `routeSeoEntries` STATIC entries (`/`, `/about`, `/contact`, `/services`, `/projects`, `/blog`, `/blog/personal`, `/tech-stack`)
- `routeSeoEntries` DYNAMIC factories (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`, `/__error`) — already extracted to `apps/web/src/lib/adapters/route-seo-factories.ts` in Task 11
- `FALLBACK_DESCRIPTION` const (replaced by `siteSeoDefaults.defaultDescription`)
- `fitDescriptionForSeo` helper (already moved to route-seo-factories.ts in Task 11)
- All unused imports (jsonLd factory imports if no longer needed at file scope)
- The entire `routeSeoEntries` export

After cleanup, `apps/web/src/lib/content/meta.ts` is either empty (delete the file) or contains only the orchestration shim if any consumer still imports from this path. Verify via:

```bash
grep -rn "from '\$lib/content/meta'\|from '\$lib/content/meta'" apps/web/src/ --include='*.ts' --include='*.svelte'
```

If no callers remain, delete `apps/web/src/lib/content/meta.ts` entirely.

```bash
cd apps/web && bun run check 2>&1 | tail -10
cd apps/web && bun run test 2>&1 | tail -10
git commit -am "chore(slice-18 18h Phase 5 Task 15): delete static routeSeoEntries + FALLBACK_DESCRIPTION; meta.ts now empty/deleted"
```

### Task 16: Visual diff verification (8 static routes + Footer + About + jsonLd)

Live spot check against deployed preview (Vercel branch deploy `feature/slice-18-18h`):

```bash
PREVIEW_URL="https://yesid-dev-git-feature-slice-18-18h-otalo.vercel.app"
for path in / /about /contact /services /projects /blog /blog/personal /tech-stack; do
  echo "=== $path ==="
  curl -s "$PREVIEW_URL$path" | grep -oE '<title>.*</title>|<meta name="description"[^>]*>|<meta property="og:image"[^>]*>|<meta name="theme-color"[^>]*>|<meta property="og:type"[^>]*>|<link rel="canonical"[^>]*>' | head -10
done
```

Compare each route's emitted `<head>` against pre-flip baseline (snapshot from `main` branch). Differences should be zero.

Footer + About verification: load `$PREVIEW_URL/` and `$PREVIEW_URL/about`; visually verify links + brand name + tagline render unchanged.

jsonLd verification:

```bash
curl -s "$PREVIEW_URL/" | bun -e "const html = require('fs').readFileSync(0,'utf-8'); const m = html.match(/<script type=\"application\/ld\+json\">([\s\S]+?)<\/script>/g); m?.forEach(s => console.log(s));"
```

Expected: same Person/WebSite/ProfilePage nodes as pre-flip.

No commit (verification only).

## Phase 6 — Close (4 tasks)

**Exit gate:** PR open with summary; GH issues filed; memory updated.

### Task 17: Acceptance run

```bash
cd apps/web && bun run check 2>&1 | tail -10  # 0 errors expected
cd apps/web && bun run test 2>&1 | tail -10   # baseline + new contract + mocked tests + single-fetch invariant
cd apps/cms && bun test 2>&1 | tail -10       # baseline + new seed dry-run tests
```

### Task 18: File GH issues

- **`apps/web/src/lib/content/site-meta.ts` cleanup → 18k** (test-fallback file; delete when static adapter retires)
- **`og_title` + `og_description` per-route overrides** (per locked Q5 — defer until campaign use case)
- **`twitter_handle` site-wide** (per locked Q6 — defer until Twitter account exists)
- **`og-default.jpg` brand asset upload** (if P2 returned no UUID — needs designer-supplied 1200×630)
- **Light-mode toggle leveraging `site_meta.theme_color`** (per Q7 — already infrastructure-ready)

### Task 19: Memory + close ceremony

- Update `~/.claude/projects/.../memory/project_completed_slices.md`: add 18h row
- Update `~/.claude/projects/.../memory/project_slice_18.md`: mark 18h closed, advance to 18i (or 18l if owner sequencing)
- Update `docs/slices/slice-18/plan.md`: 18h status flipped to ✅ closed; mention Q2 + Q9 amendments in slice-level changelog
- Push branch

### Task 20: PR open

```bash
git push -u origin feature/slice-18-18h
gh pr create --title "Slice 18 18h: site_meta singleton (brand + SEO defaults) + route_seo" --body "$(cat <<'EOF'
## Summary
- `site_meta` singleton (combined brand identity + SEO defaults) + `route_seo` collection live in Directus
- 8 static routes' SEO authored in CMS; 4 dynamic-route factories extracted to `apps/web/src/lib/adapters/route-seo-factories.ts`
- Two adapter methods read same singleton (Q9): `meta.site()` returns brand SiteMeta (TS unchanged); `meta.siteSeoDefaults()` returns SEO defaults; shared `fetchSingletonRow()` + WeakMap memo on raw row = one CMS round-trip per request
- New types: `SiteSeoDefaults`, `RouteSeoOverride` + Zod schemas + drift detectors
- `theme_color` migrated from hardcoded `#141414` to CMS field; `<SeoHead>` accepts `themeColor` prop
- Brand `siteMeta` const extracted to `apps/web/src/lib/content/site-meta.ts` (test fixture only); STATIC `routeSeoEntries` deleted; `FALLBACK_DESCRIPTION` deleted

## Test plan
- [ ] `apps/cms` `bun test` green
- [ ] `apps/web` `bun run check` 0 errors
- [ ] `apps/web` `bun run test` no regressions
- [ ] Single-fetch invariant: `meta.site()` + `meta.siteSeoDefaults()` triggers only ONE `readSingleton` per context
- [ ] 8 static routes return identical `<head>` (visual diff = 0 on title/description/canonical/og:type/og:image/theme-color)
- [ ] 4 dynamic routes unchanged
- [ ] Footer + About page + jsonLd unchanged
- [ ] GH issues filed per `decisions.md § Open follow-ups`
EOF
)"
```

## Acceptance gates summary

- [ ] 4 collections live (`site_meta` singleton + 3 standard) in Directus
- [ ] Singleton seeded: 13 parent fields + 1 EN translation row (+ 2 partial FR/ES translations for `owner_job_title`)
- [ ] 8 `route_seo` rows seeded (one per static route, EN translations)
- [ ] Permissions matrix correct (singleton variant for site_meta — R+U only; standard for route_seo; comments rows extended)
- [ ] `meta.site()` returns brand SiteMeta from CMS via Public read (TS shape unchanged)
- [ ] `meta.siteSeoDefaults()` returns SEO defaults from same singleton row
- [ ] Single-fetch invariant verified: one `readSingleton('site_meta')` call per request, even when both methods are invoked
- [ ] `meta.routeSeo.byPath('/about')` works
- [ ] Composed `meta.forRoute()` returns identical PageSeo shape vs. pre-flip for all 8 static routes
- [ ] `SiteMeta` TS shape UNCHANGED; new `SiteSeoDefaults` + `RouteSeoOverride` TS + Zod + drift detectors added
- [ ] `<SeoHead>` reads `themeColor` from layout data; default `'#141414'` preserved
- [ ] `apps/web/src/lib/content/meta.ts` shrunk or deleted; brand const + dynamic factories + FALLBACK_DESCRIPTION all moved/deleted
- [ ] 8 static routes' `<head>` identical to pre-flip (visual diff = 0)
- [ ] 4 dynamic routes unchanged (factories extracted but logic unchanged)
- [ ] Footer + About + jsonLd unchanged
- [ ] `apps/web` `bun run check` 0 errors; `bun run test` no regressions; `apps/cms` `bun test` green
- [ ] 5 GH issues filed + memory + plan synced
- [ ] PR merged
