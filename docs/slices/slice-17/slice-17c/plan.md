# Sub-Slice 17c — Zod Schema Validation · Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Sequencing:** 9 tasks (incl. 17c-2b added post-audit), roughly sequential. Each task is a commit. TDD where it buys something (schema logic); lighter where it's mechanical mirroring (per AGENTS.md plan-authoring discipline — "pattern-establishing = spec in plan; pattern-following = execute with judgment").

**Runtime:** Bun. `bun run test`, `bun run check`, `bun run build`.

**Commit prefix:** `feat(slice-17c): ...` for tasks 1–6 (incl. 2b), `refactor(slice-17c): ...` for task 7, `docs(slice-17c): ...` for task 8 + this plan + spec + handoff.

---

## Task 17c-1 — Shared primitives + parse helper

**Files:**
- Create: `src/lib/schemas/shared.ts`
- Create: `src/lib/schemas/parse.ts`
- Create: `src/lib/schemas/parse.test.ts`
- Modify: `src/lib/schemas/seo.ts` (re-export `LocalizedStringSchema` from `shared.ts`)

**Canonical pattern — `parse.ts`:**

```ts
import { z } from 'zod';

// Wrap every adapter-boundary parse call so the thrown error names the port
// that produced bad data. Critical when Payload (Slice 18) starts delivering
// unknown-shaped JSON — the stack trace alone tells us which collection broke.
export function parsePort<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`[adapter.${label}] ${result.error.message}`);
  }
  return result.data;
}
```

**`shared.ts`:** Move `LocalizedStringSchema` here from `seo.ts`; `seo.ts` re-exports for back-compat (so `routeSeoEntries` callers don't break). No new primitives beyond what spec D3 permits.

**Steps:**

- [ ] **Step 1:** Write `parse.test.ts` with two cases: (a) valid value passes through unchanged, (b) invalid value throws `Error` whose message starts with `[adapter.<label>]` and includes Zod's error text.
- [ ] **Step 2:** Run `bun run test src/lib/schemas/parse.test.ts` — verify it FAILS (no `parse.ts` yet).
- [ ] **Step 3:** Write `parse.ts` with the `parsePort` function above.
- [ ] **Step 4:** Run `bun run test src/lib/schemas/parse.test.ts` — verify PASS.
- [ ] **Step 5:** Create `shared.ts` with `LocalizedStringSchema` relocated from `seo.ts`. Keep the `.refine` on `en` (non-whitespace). In `seo.ts`, replace the definition with `export { LocalizedStringSchema } from './shared';`.
- [ ] **Step 6:** Run `bun run test` (whole suite) — verify all existing SEO/JSON-LD tests still pass.
- [ ] **Step 7:** Run `bun run check` — verify no type errors.
- [ ] **Step 8:** Commit.

```bash
git add src/lib/schemas/shared.ts src/lib/schemas/parse.ts src/lib/schemas/parse.test.ts src/lib/schemas/seo.ts
git commit -m "feat(slice-17c): add parsePort helper + shared LocalizedStringSchema"
```

**STOP criteria:** `bun run test` green, `bun run check` green, `parse.test.ts` has ≥2 passing cases.

---

## Task 17c-2 — Project + Service schemas

**Files:**
- Create: `src/lib/schemas/project.ts`
- Create: `src/lib/schemas/service.ts`

**Pattern — mirror TS, add drift detector:**

```ts
// src/lib/schemas/project.ts
import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { Project } from '$lib/types';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

export const ProjectSectionSchema = z.object({
  title: LocalizedStringSchema,
  content: LocalizedStringSchema,
});

export const ImpactMetricSchema = z.object({
  value: z.string(),
  label: LocalizedStringSchema,
  before: z.string().optional(),
});

export const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: LocalizedStringSchema,
  oneLiner: LocalizedStringSchema,
  description: LocalizedStringSchema,
  stack: z.array(z.string()),
  tags: z.array(z.string()),
  status: ProjectStatusSchema,
  featured: z.boolean(),
  repoUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  image: z.string().optional(),
  relatedServices: z.array(z.string()),
  readmeUrl: z.string().optional(),
  sections: z.array(ProjectSectionSchema),
  impactMetric: ImpactMetricSchema.optional(),
  impactMetrics: z.array(ImpactMetricSchema).optional(),
  location: z.string().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
});

// Drift detector: if the TS interface evolves and the schema doesn't (or
// vice versa), this line fails to compile. No runtime cost.
type _ProjectSchemaCheck = z.infer<typeof ProjectSchema> extends Project
  ? (Project extends z.infer<typeof ProjectSchema> ? true : false)
  : false;
const _projectSchemaCheck: _ProjectSchemaCheck = true;
void _projectSchemaCheck;
```

Repeat the shape for `service.ts` — `ServiceSchema`, `ServiceSectionSchema`, drift detector vs `Service` interface.

**Steps:**

- [ ] **Step 1:** Write `project.ts` (schema + drift detector).
- [ ] **Step 2:** Write `service.ts` (schema + drift detector).
- [ ] **Step 3:** Run `bun run check` — any drift-detector failure means the mirror is off. Fix until it compiles.
- [ ] **Step 4:** Quick adapter-free sanity — in a scratch repl or inline vitest, confirm `ProjectSchema.parse(projects[0])` returns without throwing against real seed data. Skip formal test file; Task 17c-7 covers seed-parses-clean assertions in `integrity.test.ts`.
- [ ] **Step 5:** Commit.

```bash
git add src/lib/schemas/project.ts src/lib/schemas/service.ts
git commit -m "feat(slice-17c): add ProjectSchema + ServiceSchema with drift detectors"
```

**STOP criteria:** `bun run check` green. Both schemas have drift detector lines.

---

## Task 17c-2b — TechStackPage schema + adapter port + repository delegator

**Added post-audit** (spec D8). Closes the first of two 17b seam leaks: `routes/tech-stack/+page.svelte` currently imports `techStackPageContent` directly; this task routes it through `adapter.content.techStackPage()` → `repositories/content.ts` → route load function. Task 17c-6 later wraps the port with `parsePort` and updates the route.

**Files:**
- Create: `src/lib/schemas/tech-stack-page.ts`
- Modify: `src/lib/adapters/types.ts` (extend `ContentPort`)
- Modify: `src/lib/adapters/static.ts` (add port method — no `parsePort` yet, Task 17c-6 adds it)
- Modify: `src/lib/repositories/content.ts` (add delegator)

**Pattern — `tech-stack-page.ts`:**

```ts
import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { techStackPageContent } from '$lib/content/tech-stack';

const LocalizedStatsSchema = z.object({
  technologies: LocalizedStringSchema,
  layers: LocalizedStringSchema,
  domains: LocalizedStringSchema,
  projects: LocalizedStringSchema,
});

export const TechStackPageContentSchema = z.object({
  meta: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
  }),
  hero: z.object({
    overline: LocalizedStringSchema,
    titleLine1: LocalizedStringSchema,
    titleLine2: LocalizedStringSchema,
    terminalAria: LocalizedStringSchema,
    stats: LocalizedStatsSchema,
  }),
  actions: z.object({
    getInTouch: LocalizedStringSchema,
    viewServices: LocalizedStringSchema,
  }),
  cta: z.object({
    headingLine1: LocalizedStringSchema,
    headingLine2: LocalizedStringSchema,
    sub: LocalizedStringSchema,
    availability: LocalizedStringSchema,
  }),
});

export type TechStackPageContent = z.infer<typeof TechStackPageContentSchema>;

// Drift detector: TS literal type (via typeof) must be assignable to the schema shape.
type _TechStackPageCheck = typeof techStackPageContent extends TechStackPageContent ? true : false;
const _techStackPageCheck: _TechStackPageCheck = true;
void _techStackPageCheck;
```

**Adapter wiring — `ContentPort` in `adapters/types.ts`:**

Add field: `techStackPage: () => Promise<TechStackPageContent>`

**Adapter wiring — `staticAdapter.content` in `adapters/static.ts`:**

```ts
import { techStackPageContent } from '$lib/content/tech-stack';
// ...
content: {
  // ...existing ports...
  techStackPage: async () => techStackPageContent,
}
```

(Task 17c-6 wraps this with `parsePort('content.techStackPage', TechStackPageContentSchema, techStackPageContent)`.)

**Repository — `repositories/content.ts`:**

```ts
export async function getTechStackPageContent() {
  return adapter.content.techStackPage();
}
```

**Steps:**

- [ ] **Step 1:** Write `tech-stack-page.ts` (schema + drift detector).
- [ ] **Step 2:** Extend `ContentPort` in `adapters/types.ts`.
- [ ] **Step 3:** Add `techStackPage` port method to `staticAdapter.content` (unwrapped — Task 17c-6 wraps it).
- [ ] **Step 4:** Add `getTechStackPageContent()` to `repositories/content.ts`.
- [ ] **Step 5:** Run `bun run check` — drift detector compiles, `ContentPort` satisfied.
- [ ] **Step 6:** Run `bun run test` — adapter contract test still passes (port added, nothing broken).
- [ ] **Step 7:** Commit.

```bash
git add src/lib/schemas/tech-stack-page.ts src/lib/adapters/types.ts src/lib/adapters/static.ts src/lib/repositories/content.ts
git commit -m "feat(slice-17c): add techStackPage port + TechStackPageContentSchema"
```

**STOP criteria:** `bun run check` green, `bun run test` green. The `routes/tech-stack/+page.svelte` direct import is NOT yet removed — that's Task 17c-6's job (bundled with service-svg refactor so the route change lands in the same commit as its schema wrap).

---

## Task 17c-3 — Blog + SiteMeta + TechStack schemas

**Files:**
- Create: `src/lib/schemas/blog.ts`
- Create: `src/lib/schemas/meta.ts`
- Create: `src/lib/schemas/tech-stack.ts`

**Pattern:** Same as task 17c-2 — mirror TS, enum-wrap string-literal unions (`BlogCategory`, `BlogAnimation`, `Locale`, `InfraLayer`, `DomainCluster`, `Proficiency`), drift detector per exported schema.

**Notes per file:**

- `blog.ts` — `BlogPostSchema` includes `date: z.string()` (not `z.iso.date()` — strictness budget D3), `lang: LocaleSchema`, `external: z.boolean()`.
- `meta.ts` — `SiteMetaSchema` nests `SiteLinksSchema`, `SiteAddressSchema`, `SiteOwnerSchema`. `SiteOwner.knowsAbout` is `readonly string[]` in TS → schema uses `z.array(z.string())` (readonly is a TS compile-time marker; Zod doesn't mirror it — the drift detector allows mutable-to-readonly assignment in one direction, confirm compile passes).
- `tech-stack.ts` — `TechStackItemSchema`, `TechRelationSchema`, `StackScenarioSchema`. `connectionNotes: Record<string, string> | undefined` → `z.record(z.string(), z.string()).optional()`.

**Steps:**

- [ ] **Step 1:** Write `blog.ts` (enums + post + drift detector).
- [ ] **Step 2:** Write `meta.ts` (site + nested + drift detectors).
- [ ] **Step 3:** Write `tech-stack.ts` (item + relation + scenario + enums + drift detectors).
- [ ] **Step 4:** Run `bun run check` — fix any drift detector compile failures.
- [ ] **Step 5:** Commit.

```bash
git add src/lib/schemas/blog.ts src/lib/schemas/meta.ts src/lib/schemas/tech-stack.ts
git commit -m "feat(slice-17c): add BlogPost, SiteMeta, TechStack schemas"
```

**STOP criteria:** `bun run check` green.

---

## Task 17c-4 — About + Contact + Nav + Journey + HeroData schemas

**Files:**
- Create: `src/lib/schemas/about-page.ts`
- Create: `src/lib/schemas/contact-page.ts`
- Create: `src/lib/schemas/nav.ts`
- Create: `src/lib/schemas/journey.ts`
- Create: `src/lib/schemas/hero-data.ts`

**Volume note:** `about-page.ts` is the largest (13 nested interfaces — `AboutPolaroid`, `AboutIdentity`, `AboutMetric`, `AboutMethodStep`, `AboutTestimonial`, `AboutTechItem`, `AboutInterest`, `AboutWeatherConfig`, `AboutClientLogo`, `AboutCta`, `AboutStopLabels`, `AboutLabels`, `PageMeta`, `AboutContent`). Keep each as a named export so future composition is clean.

**Pattern carry-overs:**
- `HighlightEffect`, `SkillIcon` → `z.enum([...])` in `journey.ts`.
- `AboutCta.lines[].color` is `'orange' | 'muted' | 'accent'` → `z.enum`.
- `AboutCta.socials` / `ContactContent.socials` are `readonly { label, href, icon }[]` → `z.array(z.object({ label: z.string(), href: z.string(), icon: z.string() }))`.
- `HeroData.metrics[].key` is `'vehicles' | 'delay' | 'routes'` → `z.enum`.
- `NavLink.priority` is `1 | 2` → `z.union([z.literal(1), z.literal(2)])`.
- `ErrorPageContent.suggestions` is `readonly { label: LocalizedString; href: string }[]` → schema array of object.

Every top-level schema gets a drift detector against its TS counterpart.

**Steps:**

- [ ] **Step 1:** Write `nav.ts`. Fastest — 4 small schemas.
- [ ] **Step 2:** Write `journey.ts` (JourneySkill + JourneyPanel + enums).
- [ ] **Step 3:** Write `hero-data.ts` (HeroMetric + HeroQueryRow + HeroData + `key` enum).
- [ ] **Step 4:** Write `contact-page.ts` (terminal fields + info terminal + form terminal + validation + success + `ContactContent`).
- [ ] **Step 5:** Write `about-page.ts` (all 14 schemas).
- [ ] **Step 6:** Run `bun run check` after each file to catch drift early (cheap fast-feedback vs. all-at-end).
- [ ] **Step 7:** Commit.

```bash
git add src/lib/schemas/nav.ts src/lib/schemas/journey.ts src/lib/schemas/hero-data.ts src/lib/schemas/contact-page.ts src/lib/schemas/about-page.ts
git commit -m "feat(slice-17c): add About, Contact, Nav, Journey, HeroData schemas"
```

**STOP criteria:** `bun run check` green, all drift detectors compile.

---

## Task 17c-5 — Schemas barrel

**Files:**
- Create: `src/lib/schemas/index.ts`

**Content:** Single-file re-export of every schema + inferred type. Adapter imports become one-line. Pattern:

```ts
export * from './shared';
export * from './parse';
export * from './seo';
export * from './jsonld';
export * from './project';
export * from './service';
export * from './blog';
export * from './meta';
export * from './tech-stack';
export * from './about-page';
export * from './contact-page';
export * from './nav';
export * from './journey';
export * from './hero-data';
```

**Steps:**

- [ ] **Step 1:** Write `index.ts`.
- [ ] **Step 2:** Run `bun run check` — verify no name collisions (if any surface, use `export { X }` instead of `export *` for that module — avoid rename hacks).
- [ ] **Step 3:** Commit.

```bash
git add src/lib/schemas/index.ts
git commit -m "feat(slice-17c): barrel export for schemas"
```

**STOP criteria:** `bun run check` green, no export collisions.

---

## Task 17c-6 — Wire `parsePort` into `staticAdapter`

**Files:**
- Modify: `src/lib/adapters/static.ts`

**Approach:** Wrap every port method that returns content-shaped data. Leave pure-derived and string/utility ports alone (spec D2).

**Canonical wrap pattern (one example — rest is pattern-following):**

```ts
// before
projects: {
  all: async () => projects,
  bySlug: async (slug) => getProjectBySlug(slug),
  ...
}

// after
import { parsePort, ProjectSchema, ... } from '$lib/schemas';
...
projects: {
  all: async () => parsePort('projects.all', z.array(ProjectSchema), projects),
  bySlug: async (slug) =>
    parsePort('projects.bySlug', ProjectSchema.optional(), getProjectBySlug(slug)),
  featured: async () => parsePort('projects.featured', z.array(ProjectSchema), getFeaturedProjects()),
  public: async () => parsePort('projects.public', z.array(ProjectSchema), getPublicProjects()),
  byService: async (id) => parsePort('projects.byService', z.array(ProjectSchema), getProjectsByService(id)),
  // utility returns — unchanged
  allTags: async () => getAllTags(),
  allStackItems: async () => getAllStackItems(),
  serviceIdsForProjects: async () => getServiceIdsForProjects(),
}
```

**Wrap matrix:**

| Port.method | Schema | Notes |
|---|---|---|
| `projects.all/featured/public/byService` | `z.array(ProjectSchema)` | |
| `projects.bySlug` | `ProjectSchema.optional()` | |
| `projects.allTags/allStackItems/serviceIdsForProjects` | — | utility (`string[]`) |
| `services.all/visible` | `z.array(ServiceSchema)` | |
| `services.byId` | `ServiceSchema.optional()` | |
| `services.adjacent` | `z.object({ prev: ServiceSchema.optional(), next: ServiceSchema.optional() })` | |
| `blog.all/byCategory/byTag/latest` | `z.array(BlogPostSchema)` | |
| `blog.bySlug` | `BlogPostSchema.optional()` | |
| `blog.html/svgContent/resolveSvgFallbackName` | — | string utility |
| `blog.tagsForCategory/languagesForCategory` | — | string[] utility |
| `blog.svgContentsForPosts` | — | `Record<string,string>` utility |
| `blog.resolveAnimation` | `BlogAnimationSchema` | wrap — it's enum-typed |
| `meta.site` | `SiteMetaSchema` | |
| `meta.forRoute` | (already parses PageSeo) | unchanged |
| `techStack.all/byLayer/byDomain` | `z.array(TechStackItemSchema)` | |
| `techStack.byId` | `TechStackItemSchema.optional()` | |
| `techStack.connections/incomingConnections` | — | string[] utility |
| `techStack.outgoingRelations/incomingRelations` | `z.array(TechRelationSchema)` | |
| `techStack.content` | — | string utility |
| `techStack.allScenarios` | `z.array(StackScenarioSchema)` | |
| `techStack.scenarioForDomains` | `StackScenarioSchema.optional()` | |
| `content.skillsJourneyPanels` | `z.array(JourneyPanelSchema)` | |
| `content.navLinks` | `z.array(NavLinkSchema)` | |
| `content.menuItems` | `z.array(MenuItemSchema)` | |
| `content.metroBookends` | `MetroBookendsSchema` | |
| `content.errorPage` | `ErrorPageContentSchema` | |
| `content.aboutPage` | `AboutContentSchema` | |
| `content.contactPage` | `ContactContentSchema` | |
| `content.techStackPage` | `TechStackPageContentSchema` | new port from 17c-2b; wrap + update route to consume via repo (closes 17b seam leak) |
| `content.heroMock/initialHeroData` | `HeroDataSchema` | |
| `content.hero/heroAnim/manifesto/proofReel/servicesGrid/about/cta/closer/skillsJourneyCta` | — | site-chrome typeof literals (spec non-goal) |

**Steps:**

- [ ] **Step 1:** Import `parsePort`, `z`, and every needed schema from `$lib/schemas` at the top of `static.ts`.
- [ ] **Step 2:** Apply the wrap pattern to each port method per the matrix above. Work top-down: `projects` → `services` → `blog` → `meta` → `techStack` → `content`. Don't forget `content.techStackPage` (added in 17c-2b, unwrapped until now).
- [ ] **Step 3:** Run `bun run check` — verify types still resolve (all port methods still satisfy `ContentAdapter`).
- [ ] **Step 4:** Run `bun run test` — adapter contract test (`src/lib/adapters/adapter.test.ts`) should pass as-is; if a port now throws because seed data has a latent issue, fix the seed data (NOT the schema) and note in handoff.
- [ ] **Step 5:** **Close 17b seam leak #1 — `service-svg.ts` param injection.** Change `fetchServiceSvgContents(fetchFn)` → `fetchServiceSvgContents(fetchFn, services: readonly Service[])`. Delete the `import { services } from '$lib/content/services'` line. Update all 3 callers: `src/routes/projects/+page.ts`, `src/routes/services/+page.ts`, `src/routes/services/[id]/+page.ts` — each already loads services via the adapter (directly or via repository); thread that array into the call site.
- [ ] **Step 6:** **Close 17b seam leak #2 — `routes/tech-stack/+page.svelte` via load function.** Create `src/routes/tech-stack/+page.ts` (if absent) with a `load()` that calls `getTechStackPageContent()` + existing data calls. Remove `import { techStackPageContent } from '$lib/content/tech-stack'` from `+page.svelte`; replace with `const { techStackPage } = data.content ?? data` (match the route's existing `let { data } = $props()` pattern). Verify the route still renders identically.
- [ ] **Step 7:** Run `bun run build` — SSR path exercises every port AND the updated routes; parse errors here mean real contract violations or route regressions.
- [ ] **Step 8:** Verify seam closure: `rg "from '\\\$lib/content/" src/lib/utils/ src/routes/tech-stack/` returns empty.
- [ ] **Step 9:** Commit.

```bash
git add src/lib/adapters/static.ts src/lib/utils/service-svg.ts \
        src/routes/projects/+page.ts src/routes/services/+page.ts src/routes/services/\[id\]/+page.ts \
        src/routes/tech-stack/+page.ts src/routes/tech-stack/+page.svelte
git commit -m "feat(slice-17c): wire parsePort into staticAdapter + close 17b seam leaks"
```

**STOP criteria:** `bun run check` + `bun run test` + `bun run build` all green. Adapter contract test passes. Existing 954+ tests still pass. `rg "from '\\\$lib/content/" src/lib/utils/ src/routes/tech-stack/` returns empty (both seam leaks closed).

---

## Task 17c-7 — Trim `integrity.test.ts`, add seed-parses-clean smoke tests

**Files:**
- Modify: `src/lib/content/integrity.test.ts`

**What to remove** (per-field assertions superseded by Zod):
- Status enum checks (covered by `ProjectStatusSchema`).
- LocalizedString.en non-empty (covered by `LocalizedStringSchema.refine`).
- Slug URL-safety is a tightening we're NOT adding (spec D3) — KEEP this assertion in integrity tests (it's cross-cutting, not a Zod field constraint).
- Per-field `.trim() !== ''` checks on other required strings — **keep**; the schema uses `.min(1)` which allows whitespace-only. Either tighten schemas (scope creep) or keep these tests. Verdict: keep.

**What to add** (one block per content file):

```ts
describe('seed data parses through schemas', () => {
  it('projects parse through ProjectSchema', () => {
    expect(() => z.array(ProjectSchema).parse(projects)).not.toThrow();
  });
  it('services parse through ServiceSchema', () => {
    expect(() => z.array(ServiceSchema).parse(services)).not.toThrow();
  });
  // ... one per data file
});
```

This double-check catches schema drift even when the adapter wiring happens to accept the seed for unrelated reasons.

**What to keep** (cross-entity invariants Zod can't express):
- Unique slugs across projects.
- `project.relatedServices` IDs reference existing service IDs.
- `service.relatedProjects` slugs reference existing project slugs.
- Station numbers on services are sequential / unique.
- Tech stack `connectsTo` IDs reference existing tech items.
- Scenario `recommended` IDs reference existing tech items.

**Steps:**

- [ ] **Step 1:** Read current `integrity.test.ts` end-to-end. Identify the assertions Zod now covers.
- [ ] **Step 2:** Delete the superseded assertions. Leave cross-entity and trim-safety checks.
- [ ] **Step 3:** Add the "seed data parses through schemas" describe block with one `it` per content file (projects, services, blog posts, site meta, tech stack items, scenarios, about, contact, hero-data, nav links, menu items, metro bookends, error page).
- [ ] **Step 4:** Run `bun run test src/lib/content/integrity.test.ts` — verify PASS.
- [ ] **Step 5:** Run full `bun run test` — verify nothing else regressed.
- [ ] **Step 6:** Commit.

```bash
git add src/lib/content/integrity.test.ts
git commit -m "refactor(slice-17c): layer integrity tests with schema parse + keep cross-entity invariants"
```

**STOP criteria:** `bun run test` green, integrity file reduced by ~150 lines (target) while preserving cross-entity checks.

---

## Task 17c-8 — ARCHITECTURE.md update + handoff

**Files:**
- Modify: `docs/reference/ARCHITECTURE.md`
- Modify: `docs/slices/slice-17/slice-17c/handoff.md` (finalize)
- Modify: `docs/slices/slice-17/README.md` (flip 17c row to COMPLETE + PR #)

**ARCHITECTURE.md edit** — add paragraph + update layer table:

- Paragraph under the "Application Architecture" or "Target Architecture" section (location already exists in slice-17 README; mirror it in the project-level ARCHITECTURE): "Every adapter port method that returns content parses through a Zod schema from `src/lib/schemas/` before handing off to repositories. `parsePort(label, schema, value)` tags errors with the port they originated in, so contract violations from any adapter (static today, Payload in Slice 18) are immediately attributable."
- One-row addition to the `src/lib/` directory table: `│   ├── schemas/       # ← Slice 17c: Zod contracts validated at adapter boundary`

**handoff.md** — finalize the task-by-task self-append started at task 17c-1. Include:
- Summary of files created/modified (numbers from `git diff main --stat`).
- Any seed-data fixes discovered during task 17c-6 wiring.
- Open questions from spec marked resolved.
- Delta vs. original 0.5-session estimate (honest retrospective).

**slice-17/README.md** — change row 24 (`17c Zod Schemas`) status from `planned` to `COMPLETE` and PR column to the PR number once opened.

**Steps:**

- [ ] **Step 1:** Edit `docs/reference/ARCHITECTURE.md` (paragraph + table row).
- [ ] **Step 2:** Finalize `handoff.md` (assumes the file has been appended to as tasks landed; if not, write the full retrospective now).
- [ ] **Step 3:** Update `docs/slices/slice-17/README.md` row.
- [ ] **Step 4:** Run `bun run check && bun run test && bun run build` one last time.
- [ ] **Step 5:** Commit.

```bash
git add docs/reference/ARCHITECTURE.md docs/slices/slice-17/slice-17c/handoff.md docs/slices/slice-17/README.md
git commit -m "docs(slice-17c): mark 17c complete + document schema layer in ARCHITECTURE"
```

**STOP criteria:** All three validation commands green. Ready to open PR.

---

## PR + close protocol

Open PR with handoff.md as the body (per AGENTS.md § Self-appending handoff). Title: `Slice 17c — Zod Schema Validation`.

After merge: `bun run slice:close 17 17c` moves the bundle to cloud and appends a one-liner to `COMPLETED-SLICES.md`.

## Risk register

| Risk | Mitigation |
|---|---|
| A drift detector fails mid-task 17c-2 through -4 because a TS interface has a subtlety (readonly, branded types) Zod doesn't mirror cleanly | Note in handoff; use `z.infer extends T ? true : false` one-way check instead of bidirectional if needed. Keep moving. |
| Seed data has latent invalid values that only surface when the schema is applied (task 17c-6) | Fix the SEED, not the schema. Note the fix in handoff. |
| `SiteOwner.knowsAbout` `readonly` mismatch with `z.array().readonly()` — Zod 4 supports `.readonly()` on arrays; verify at task 17c-3 | Use `.readonly()` if available in installed Zod version; otherwise accept one-way drift detector. |
| `bun run build` slower because of added parsing on SSR — acceptable; ~15 small schemas, parse cost is negligible vs. adapter I/O that doesn't exist yet | No action — measure if perceived slow during task 17c-6. |
| Tech-stack route regression when moving `techStackPageContent` from component import to `+page.ts` load function (Step 6) | `bun run build` catches type errors; manual smoke-test the `/tech-stack` route before commit (hero + CTA render with identical copy). Handoff notes any visual delta. |
| `fetchServiceSvgContents` callers that load services via repository (not direct adapter call) — confirm each of the 3 route loaders actually has a services array in scope at the call site | If a caller loads projects but not services, thread a repository call in. No caller should need to reach around — verify during Step 5. |

## Out of scope reminders (from spec, repeated here for discipline)

- No `Result<T, E>` envelope.
- No site-chrome schemas (hero/manifesto/proofReel/etc.).
- No learning doc.
- No test factory integration.
- No URL/email/slug tightening beyond what TS already encodes.
