# Slice 17b — Hexagonal Data Layer + LocalizedString Enforcement

**Type:** Sub-slice (Level 2, PR boundary)
**Parent slice:** 17 — Standardization: Design System + Ports & Adapters
**Status:** planned — spec finalized 2026-04-18
**Depends on:** 17a ✓, 17d ✓, 17e ✓, 17h ✓, 17j ✓ (all shipped)
**Enables:** 15 (SEO), 17c (Zod), 17f (Test factories), 18 (Payload CMS)
**Est. sessions:** ~4 (contingent on audit findings in Task 5)
**Branch:** `feature/slice-17b-repositories`

---

## Executive summary

Split data **definition** from data **access**, make the content source **swappable in one line**, and enforce **every user-facing string is `LocalizedString`**. 17b dissolves the current `src/lib/data/` folder into four layers — `repositories/` (ports), `adapters/` (implementations), `content/` (static source), `utils/` (engines) — plus a promoted top-level `types.ts`. Route loaders migrate off direct content imports and onto repositories. The CMS swap surface shrinks from "every loader + component" to "one file in `adapters/index.ts`." A full audit catalogs hardcoded strings in components and an extraction pass moves them into `content/*` as `LocalizedString`. Zero client-facing changes, zero visual changes, zero new features. Pure architecture + i18n cleanup.

---

## Goal in the context of Slice 17

Slice 17 has two thrusts:

1. **Design system** — visual cascade (tokens → components). **Shipped** in 17a / 17d / 17e / 17h.
2. **Architecture** — data cascade (sources → loaders). **This thrust starts here with 17b.**

17a gave yesid.dev a visual spine: one edit to a token, the whole site shifts. 17b gives yesid.dev a data spine: one edit to an adapter file, the whole app switches CMS. Same philosophy — single source of truth — different axis.

### What 17b specifically delivers

- A **seam** between "where data lives" and "who reads it," implemented as hexagonal architecture
- A **content layer** that is pure declaration, ready to be replaced by any CMS
- A **LocalizedString-only** rule for content — no more bare strings reaching users
- A **comprehensive audit** of hardcoded content in components, followed by extraction into the content layer
- **Governance** (VOCAB, CONSTITUTION, ARCHITECTURE) updated to codify the new pattern

### Why this sub-slice exists as its own PR

Without 17b, Slice 18 (Payload CMS) would touch every route loader and many components. With 17b, Slice 18 is a contained diff inside `src/lib/adapters/`. The cost of every downstream slice that reads data depends on the quality of 17b's seam.

---

## Design decisions (with rationale)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Service function signatures | **Async everywhere** (`Promise<T>`) | Forward-compatible with Payload/Keystatic from day one. Slice 18 becomes a pure implementation swap — zero signature change. Cost: one `await` per loader call. |
| 2 | Interface style | **Implicit modules** (named function exports) | SvelteKit-idiomatic. No DI container needed. Test mocking via `vi.mock` at module boundary. The adapter layer absorbs the "contract" concern, so repository files stay minimal. |
| 3 | Scope of "services" | **Content-only** — 6 services for content types; utilities stay out | Service layer exists for the CMS seam. Payload doesn't own weather, markdown rendering, or SVG files. Wrapping them in services adds boundaries for a swap that will never happen. |
| 4 | Naming: "services" content vs code-layer | **Rename the code layer, not the content.** Code layer = `repositories/`; content stays "services" (URL, nav, type `Service`) | "Services" is the most industry-standard word for freelance work; users expect it. The ambiguity is a code problem, so fix it in code. "Repository" is the hexagonal-architecture term — matches Slice 17's "Ports & Adapters" framing literally. |
| 5 | Repository file naming | **No `.service.ts` suffix** — `repositories/project.ts` | Folder name already signals the layer. Cleaner imports: `from '$lib/repositories/project'`. No collision because `repositories/service.ts` is the service-offerings repository (disambiguated by folder). |
| 6 | CMS-agnostic design | **γ hexagonal-pure — `adapters/` as its own top-level folder** | Ports and adapters are separate concerns → separate folders. Repositories folder stays pure (ports only). Adapters folder holds all CMS knowledge. Adding Keystatic = one file + one re-export flip. |
| 7 | Client-facing "Services" vocabulary | **Unchanged** — URL `/services`, nav "Services", H1 "Services" stay. No "Offerings" rename. | Internal code is "repositories"; external brand is "services." Decoupling keeps SEO, existing links, and brand narrative intact. |
| 8 | Hardcoded content handling | **Audit + extract in 17b** (one PR, one coherent cleanup) | Audit and extraction are logically coupled — separating them creates half-done state. Auditing under a parallel Sonnet subagent sweep makes the audit phase cheap. Calibration gate at Task 5 STOP can split into 17b-1 + 17b-2 if findings balloon. |
| 9 | Barrel strategy | `repositories/index.ts` + `adapters/index.ts` + `content/index.ts` exist. `data/index.ts` deleted at end of Task 4. | Loaders import `from '$lib/repositories'`. Repositories import `from '$lib/adapters'`. Adapters are the only caller of `$lib/content`. Clean boundaries. |
| 10 | LocalizedString enforcement | **Every user-facing string in `content/*` is `LocalizedString`.** Bare strings only for internal identifiers, URLs, icon names, enum codes. | Reinforces existing `feedback_data_driven.md` memory. Enables fr/es translations by filling one object per field, no component edits. Integrity test guards against regression. |
| 11 | Metro stop derivation | **Fold into `repositories/service.ts`** as `getMetroStops()`. Content file `data/metro.ts` dissolved. | Metro stops are a view over services. Bookend labels ("Departure", "Terminal") become LocalizedString in `content/nav.ts`. Structural topology is code in the repository. |
| 12 | Hero mock data | **Fold into `repositories/content.ts`** as `getHeroMockData()`. `content/hero-data.ts` reduced to pure data declarations. | Mock data is content that will be CMS-owned. Generation logic is a repository concern. |
| 13 | Layout/error component imports | **Deferred to Slice 15**. Keep direct `$lib/content/*` imports for static constants (`siteMeta`, `errorPageContent`) with documented exception. | Migrating layout/error to service-via-prop requires root `+layout.ts` and SSR ripple changes. Slice 15 SEO forces the question naturally via `<SeoHead>`. Scope control. |
| 14 | `weather.ts` / `service-svg.ts` | **Stay as utilities** imported directly by loaders. Documented exception in ARCHITECTURE.md. | External runtime fetches, never CMS-owned. Wrapping them in the adapter pattern adds ceremony with no swap benefit. |
| 15 | Interpolation convention | **Brace placeholders** — `{ en: "Showing {count} results" }` resolved as `.replace('{count}', String(count))`. | No new dependency. Works in every locale. Simple enough that the pattern is obvious from reading any content file. Codified in VOCAB.md. |

---

## Target architecture

### Folder layout

```
src/lib/
├── components/              # UI — unchanged
├── motion/                  # Animation — unchanged
│
├── repositories/            ← PORTS: what the app asks for
│   ├── project.ts           ─ getAllProjects, getProjectBySlug, getFeaturedProjects, …
│   ├── service.ts           ─ getAllServices, getServiceById, getMetroStops, getAdjacentServices, …
│   ├── blog.ts              ─ getAllPosts, getPostBySlug, getPostHtml, getPostsByCategory, …
│   ├── meta.ts              ─ getSiteMeta, getPersonSchema
│   ├── tech-stack.ts        ─ getAllTechItems, getConnections, getAllScenarios, …
│   ├── content.ts           ─ getHeroContent, getAboutContent, getNavLinks, getHeroMockData, …
│   └── index.ts             ─ barrel
│
├── adapters/                ← ADAPTERS: how ports are fulfilled
│   ├── index.ts             ─ re-exports the ACTIVE adapter (one-line swap point)
│   ├── types.ts             ─ ContentAdapter contract
│   └── static.ts            ─ reads from $lib/content (today's implementation)
│   (future: payload.ts, keystatic.ts, mock.ts)
│
├── content/                 ← SOURCES: raw CMS-owned content
│   ├── projects.ts
│   ├── services.ts          ─ stays as "services" — client-facing vocab preserved
│   ├── blog.ts
│   ├── meta.ts
│   ├── tech-stack.ts
│   ├── site-content.ts      ─ was content.ts, renamed to avoid self-shadowing the folder
│   ├── nav.ts
│   ├── about-page.ts
│   ├── contact-page.ts
│   ├── hero-data.ts         ─ pure mock-data declarations (derivation moves to repository)
│   ├── integrity.test.ts    ─ cross-collection integrity + LocalizedString guard
│   └── index.ts             ─ barrel
│
├── types.ts                 ← promoted from data/types.ts. Single import source for all types.
│
└── utils/                   ← ENGINES: pure, stateless, never CMS-owned
    ├── locale.ts            ─ resolveLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES
    ├── markdown.ts          ─ (was highlight.ts) marked + Shiki brand renderer
    ├── shapes.ts            ─ SVG geometric shapes + pickRandomShape
    ├── journey-shapes.ts    ─ SVG morph path configs
    ├── metro-network.ts     ─ hero SVG topology (~45 nodes)
    ├── stack-roles.ts       ─ (was stackRoles.ts) STACK_ROLE_MAP lookup
    ├── service-svg.ts       ─ (was serviceSvg.ts) runtime SVG asset fetch
    ├── weather.ts           ─ OpenWeatherMap client
    └── json-ld.ts           ─ (optional) was schema.ts; may absorb into repositories/meta.ts
```

### Data flow

```
Route loader
    │
    ▼  imports from $lib/repositories
Repository (port — thin delegation)
    │
    ▼  imports { adapter } from $lib/adapters
Adapter (index.ts re-exports active implementation)
    │
    ▼  static.ts imports from $lib/content
Content (raw source — pure declaration)
```

Loader never sees content. Content never knows who reads it. Adapter is the single bridge. Swap the adapter, nothing else moves.

### Import rules (enforced; codified in ARCHITECTURE.md)

| From → To | Allowed |
|---|---|
| Route loaders → `$lib/repositories` | ✅ |
| Route loaders → `$lib/content` | ❌ |
| Route loaders → `$lib/adapters` | ❌ |
| Route loaders → `$lib/utils/weather`, `$lib/utils/service-svg` | ✅ (documented exceptions) |
| Components → `$lib/repositories` | ❌ (data via props from loaders) |
| Components → `$lib/content` | ❌ |
| Components → `$lib/utils/locale` (`resolveLocale`) | ✅ |
| Components → other `$lib/utils/*` (markdown, shapes, etc.) | ✅ |
| `repositories/*` → `$lib/adapters` | ✅ |
| `repositories/*` → `$lib/content` | ❌ (only adapters read content) |
| `repositories/*` → `$lib/utils` | ✅ (for formatting helpers) |
| `adapters/static.ts` → `$lib/content` | ✅ (only caller of content) |
| `adapters/*` → `$lib/repositories` | ❌ (wrong direction) |
| `adapters/*` → `$lib/utils` | ✅ |
| Anyone → `$lib/types` | ✅ |
| `$lib/types` → any `$lib/*` | ❌ (types imports only primitives) |

### Documented exceptions

Two deliberate bypasses of the "loaders only talk to repositories" rule:

1. **`+layout.svelte` + `+error.svelte`** — keep importing `siteMeta`, `errorPageContent` directly from `$lib/content/*`. Rationale: static constants used in non-loader components; full migration requires root layout loader changes that belong in Slice 15 SEO. Reviewed then.
2. **`weather.ts`, `service-svg.ts`** — loaders import directly. Rationale: external runtime fetches, not CMS-ownable. Wrapping adds boundary with no swap benefit.

Both are listed in ARCHITECTURE.md § Documented Exceptions with rationale.

---

## Repository + adapter contracts

### Naming conventions

| Concept | Pattern | Example |
|---|---|---|
| File name | singular noun, kebab-case | `project.ts`, `tech-stack.ts` |
| Query function | `get<Thing>By<Key>` or `getAll<Things>` | `getProjectBySlug`, `getAllProjects` |
| Multi-filter | `get<Things>By<Filter>` | `getProjectsByService` |
| Existence check | `has<Thing>` | `hasProject` |
| Derived view | `get<View>` | `getMetroStops`, `getAdjacentServices` |
| Adapter method path | `adapter.<collection>.<verb>` | `adapter.projects.bySlug(slug)` |
| Async always | `Promise<T>` return | `Promise<readonly Project[]>` |
| Not-found | `undefined` (never null) | `Promise<Project \| undefined>` |
| Mutability | `readonly` arrays | `Promise<readonly Project[]>` |

### Canonical repository (example: `project.ts`)

```ts
// src/lib/repositories/project.ts
import { adapter } from '$lib/adapters'
import type { Project } from '$lib/types'

export async function getAllProjects(): Promise<readonly Project[]> {
  return adapter.projects.all()
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return adapter.projects.bySlug(slug)
}

export async function getFeaturedProjects(): Promise<readonly Project[]> {
  return adapter.projects.featured()
}

export async function getPublicProjects(): Promise<readonly Project[]> {
  return adapter.projects.public()
}

export async function getProjectsByService(serviceId: string): Promise<readonly Project[]> {
  return adapter.projects.byService(serviceId)
}
```

Repositories are **delegation**. They don't transform, combine, or validate. That's adapter's job (today) and Zod's job (Slice 17c). The one exception: derived views like `getMetroStops()` (below).

### Canonical adapter (example: `static.ts`)

```ts
// src/lib/adapters/static.ts
import { projects } from '$lib/content/projects'
import { services } from '$lib/content/services'
// … other content imports
import type { ContentAdapter } from './types'

export const staticAdapter: ContentAdapter = {
  projects: {
    all: async () => projects,
    bySlug: async (slug) => projects.find((p) => p.slug === slug),
    featured: async () => projects.filter((p) => p.featured),
    public: async () => projects.filter((p) => p.visibility === 'public'),
    byService: async (serviceId) =>
      projects.filter((p) => p.services?.includes(serviceId)),
  },
  services: {
    all: async () => services,
    byId: async (id) => services.find((s) => s.id === id),
    visible: async () => services.filter((s) => s.visible !== false),
    adjacent: async (id) => {
      const visible = services.filter((s) => s.visible !== false)
      const idx = visible.findIndex((s) => s.id === id)
      return {
        prev: idx > 0 ? visible[idx - 1] : undefined,
        next: idx < visible.length - 1 ? visible[idx + 1] : undefined,
      }
    },
  },
  // blog, meta, techStack, content …
}
```

Every method `async`. Every method is a straight query. No business logic. Signatures intentionally match what the Payload adapter will need.

### Adapter contract

```ts
// src/lib/adapters/types.ts
import type {
  Project, Service, BlogPost, SiteMeta, TechStackItem,
  HeroContent, AboutContent, NavContent, ContactContent, AboutPageContent,
  HeroData, ErrorPageContent, Connection, Scenario, /* … */
} from '$lib/types'

export interface ContentAdapter {
  projects: ProjectPort
  services: ServicePort
  blog: BlogPort
  meta: MetaPort
  techStack: TechStackPort
  content: ContentPort
}

interface ProjectPort {
  all(): Promise<readonly Project[]>
  bySlug(slug: string): Promise<Project | undefined>
  featured(): Promise<readonly Project[]>
  public(): Promise<readonly Project[]>
  byService(serviceId: string): Promise<readonly Project[]>
}

interface ServicePort {
  all(): Promise<readonly Service[]>
  byId(id: string): Promise<Service | undefined>
  visible(): Promise<readonly Service[]>
  adjacent(id: string): Promise<{ prev?: Service; next?: Service }>
}

interface BlogPort {
  all(): Promise<readonly BlogPost[]>
  bySlug(slug: string): Promise<BlogPost | undefined>
  html(slug: string): Promise<string>
  byCategory(category: string): Promise<readonly BlogPost[]>
  tagsForCategory(category: string): Promise<readonly string[]>
  languagesForCategory(category: string): Promise<readonly string[]>
  svgContent(name: string): Promise<string | undefined>
}

interface MetaPort {
  site(): Promise<SiteMeta>
}

interface TechStackPort {
  items(): Promise<readonly TechStackItem[]>
  byId(id: string): Promise<TechStackItem | undefined>
  byLayer(layer: string): Promise<readonly TechStackItem[]>
  connections(): Promise<readonly Connection[]>
  scenarios(): Promise<readonly Scenario[]>
}

interface ContentPort {
  hero(): Promise<HeroContent>
  about(): Promise<AboutContent>
  nav(): Promise<NavContent>
  aboutPage(): Promise<AboutPageContent>
  contactPage(): Promise<ContactContent>
  heroMock(): Promise<HeroData>
  errorPage(): Promise<ErrorPageContent>
}
```

TypeScript enforces completeness via the `: ContentAdapter` annotation. Missing a method fails compilation.

### Adapter swap procedure (the one-file promise)

```ts
// src/lib/adapters/index.ts
export { staticAdapter as adapter } from './static'

// Slice 18: add src/lib/adapters/payload.ts, then:
// export { payloadAdapter as adapter } from './payload'
```

That's the entire swap surface.

### Three special cases

**1. Metro stops (derived view).** `getMetroStops()` lives in `repositories/service.ts`. It calls `adapter.services.visible()` + reads bookend labels from `adapter.content.nav()`, interleaves them, returns the full metro strip. Metro is a yesid.dev-specific view, not a CMS concept — so it's a repository concern, not an adapter concern.

```ts
// repositories/service.ts (excerpt)
export async function getMetroStops(): Promise<readonly MetroStop[]> {
  const services = await adapter.services.visible()
  const nav = await adapter.content.nav()

  return [
    { id: 'hero', stopNumber: '00', label: nav.metroBookends.departure, type: 'hero' },
    ...services.map((s, i) => ({
      id: s.id,
      stopNumber: String(i + 1).padStart(2, '0'),
      label: s.title,
      type: 'service' as const,
    })),
    { id: 'about', stopNumber: String(services.length + 1).padStart(2, '0'), label: nav.metroBookends.about, type: 'about' },
    { id: 'terminal', stopNumber: 'TERMINAL', label: nav.metroBookends.terminal, type: 'terminal' },
  ]
}
```

**2. Blog HTML rendering.** `getPostHtml(slug)` delegates to `adapter.blog.html(slug)`. The static adapter calls `marked(post.markdown)` synchronously (wrapped async). Payload's future adapter will fetch markdown from Payload and run `marked` on the result. Same interface.

**3. Weather, service-SVG.** External runtime fetches. Imported directly by loaders as utilities. Explicit exception documented in ARCHITECTURE.md.

### Error handling philosophy

Adapters throw on unexpected errors. Repositories don't catch — they propagate. Loaders handle via SvelteKit's `error()`. Components assume data is valid because the loader is their gatekeeper. Zod (Slice 17c) will add a validation pass between adapter and repository later.

---

## Content layer rules

### The rule

**Every value in `src/lib/content/` that renders as copy to a user is a `LocalizedString`.** No exceptions inside content files.

```ts
// src/lib/types.ts (unchanged)
export interface LocalizedString {
  en: string       // required — fallback anchor
  fr?: string      // optional — filled over time
  es?: string      // optional — filled over time
}
```

Fallback: requested locale → `en`. No chain (es → fr → en). Simple, predictable, SQL `COALESCE(requested, en)` equivalent.

### What counts as user-facing

LocalizedString required for:
- Visible copy (headings, paragraphs, labels, button text)
- `aria-label`, `aria-description`
- `alt` text, `placeholder`, `title` attributes
- Form labels, error messages, validation copy
- Empty-state / "no results" messages
- Meta tags (`<title>`, `<meta content>`, OG, Twitter)
- JSON-LD `name`, `description`, `jobTitle`
- Loading indicator copy
- 404/500 page text

### What stays bare `string`

Bare string allowed for:
- Record keys / IDs (`"postgres"`, `"dbt"`, slugs)
- URLs (`https://…`, `/blog/foo`)
- Icon names (`"lucide:database"`), SVG filenames
- CSS classes, token names
- Enum-like technical codes (`"DB"`, `"ETL"`, `"FE"` in `STACK_ROLE_MAP`) — treated as universal tech shorthand; upgrade if feedback demands it
- Date strings (ISO format)
- Status codes (`"published"`, `"draft"`)
- Locale codes themselves

### Enum + label-map pattern

When content has enum-coded fields, codes stay bare; labels live in a separate map:

```ts
// content/projects.ts
export const projects = [
  { slug: 'yesid-dev', status: 'shipped', /* … */ }
]

// content/nav.ts (or content/labels.ts)
export const projectStatusLabels: Record<ProjectStatus, LocalizedString> = {
  'shipped':     { en: 'Shipped', fr: 'Livré', es: 'Entregado' },
  'archived':    { en: 'Archived', fr: 'Archivé', es: 'Archivado' },
  'in-progress': { en: 'In progress', fr: 'En cours', es: 'En curso' },
}
```

Components resolve the label, never the code: `{resolveLocale(projectStatusLabels[project.status], locale)}`.

### Interpolation convention

Runtime values inside LocalizedStrings use brace placeholders:

```ts
{ en: "Showing {count} results", fr: "Affichage de {count} résultats" }

// in component:
resolveLocale(content.resultsLabel, locale).replace('{count}', String(count))
```

Simple, no dependency. Codified in VOCAB.md.

### Where `resolveLocale()` is called

**Always at render time**, never upstream. Loaders pass full `LocalizedString` objects + the user's `locale`. Components call `resolveLocale(str, locale)` at the exact render line. This keeps repositories/adapters locale-agnostic (Payload stores localized fields natively; adapters pass through).

### Content file shape conventions

```ts
// content/projects.ts
import type { Project } from '$lib/types'

// 1. Typed, readonly array/object export.
export const projects: readonly Project[] = [
  {
    slug: 'some-project',
    title: { en: 'The title', fr: 'Le titre' },    // LocalizedString inline
    description: { en: '…', fr: '…' },
    status: 'shipped',                               // enum code, bare
    // …
  }
] as const

// 2. NO query functions (they live in repositories/).
// 3. NO resolveLocale calls (that's render-time).
// 4. NO derived data (computation lives in repositories/).
```

Content = **declaration only**. If Payload takes over, this file deletes without functional loss.

### Integrity test assertions

`src/lib/content/integrity.test.ts` (replaces `data-integrity.test.ts`) asserts:

1. Every `LocalizedString` in every content file has non-empty `en`
2. Every content item has its required top-level fields
3. Cross-references resolve (project.services[] exist in services; blog.category is known)
4. **New:** bare-string-in-LocalizedString-slot detector (safety net beyond TypeScript)
5. **New:** translation-debt report — counts en-only LocalizedStrings per file (reports, doesn't fail)

---

## Hardcoded content audit + extraction

### Phase A — Audit

**Deliverable:** `docs/slices/slice-17/slice-17b/audit-hardcoded-content.md`

**Signal patterns the audit flags:**

| Pattern | Example |
|---|---|
| Template text between tags | `<h2>Featured projects</h2>` |
| Template expressions with string literals | `{isLoading ? 'Loading…' : 'Done'}` |
| `aria-label`, `aria-description` | `aria-label="Close menu"` |
| `alt` attribute | `alt="Montreal skyline"` |
| `placeholder` attribute | `placeholder="Enter email"` |
| `title` attribute | `title="View on GitHub"` |
| Hardcoded error / validation / empty-state | `error = 'Invalid email'` |
| Meta tags | `<title>About yesid.dev</title>` |

**Does not flag:**

- `.test.ts` files
- Comments
- Technical attributes (`class`, `id`, `data-*`, `role`, `type`, `name`, `for`, `href`, `src`, `aria-hidden="true"`)
- Enum codes / record keys (short, uppercase, no whitespace)
- `<style>` block contents
- Server-only code never reaching client

**Tooling: parallel Sonnet 4.6 subagents.** Seven agents, one per directory:

1. `src/lib/components/home/`
2. `src/lib/components/blog/`
3. `src/lib/components/projects/`
4. `src/lib/components/services/`
5. `src/lib/components/about/` + `contact/`
6. `src/lib/components/brand/` + `ui/` + `navigation/` + `common/`
7. `src/routes/**/*.svelte`

Each returns a structured markdown table (columns: Line, String, Type, Suggested content file, Suggested key). Merged into master document with appendices:

- **Translation debt** — existing LocalizedStrings with only `en` defined, by file
- **Edge cases** — strings where agent was uncertain

**Parallelization requires Yesid's approval at Task 5 start (project rule: "Parallel agents require approval").**

### Phase B — Extraction

**One component at a time.** Component-by-component with commit per component. Never batched. Each becomes a Level-3 task in plan.md with a STOP.

**Per-component steps:**

1. Read audit rows for the component
2. For each row:
   - Add key to appropriate `content/*.ts` as LocalizedString (`en` filled, `fr`/`es` blank)
   - Update `types.ts` if adding a field
   - Replace hardcoded string with `{resolveLocale(content.key, locale)}`
   - Update prop flow if new data needed from loader
3. `bun run test` (component + integrity)
4. `bun run check`
5. Visual spot-check in preview at target URL + mobile breakpoint
6. Commit: `feat(slice-17b): extract hardcoded strings from <Component>`
7. STOP for approval

**Grouping strategy:** sibling components with shared content extract together (e.g., `WorkFilterMobile` + `WorkFilterDesktop`). ContactPage + sub-components = one task. Target ~15–25 extraction tasks.

**Sequencing:** top-down route (home → blog → projects → services → about → contact) recommended for coherent visual review. Final choice at Task 7 start.

### Edge cases

- **Prop-passed strings** — push fix upstream to the parent supplying the string
- **Interpolated strings** — brace-placeholder pattern
- **Singular/plural** — `Intl.PluralRules` at render; content holds separate forms when translation arrives
- **Date formatting** — `Intl.DateTimeFormat`, no content extraction needed

### Calibration gate at Task 5 STOP

After the audit report is written, three outcomes:

- **Proceed as-is** → continue to Task 6
- **Split 17b** → 17b ships as infrastructure only (Tasks 1–4, 8–10); audit + extraction become 17b-2 with its own plan
- **Rescope** → drop extraction entirely; defer to a later slice

Audit itself is cheap (half a session). Worst case it becomes the plan.md for the next sub-slice.

---

## Migration sequence

High-level task list. Full per-task plan lives in `plan.md` (next step after spec approval).

| # | Task | Depends on | Est. |
|---|---|---|---|
| 17b-1 | Baseline + folder restructure (`data/` → `content/` + `utils/` + `types.ts`) | — | 0.5 session |
| 17b-2 | Adapter scaffold (`types.ts`, `static.ts`, `index.ts`, contract test) | 17b-1 | 0.25 |
| 17b-3 | Repository layer (6 files + barrel, fold metro + hero-mock derivation) | 17b-2 | 0.5 |
| 17b-4 | Route loader migration (11 files + documented exceptions) | 17b-3 | 0.5 |
| 17b-5 | Hardcoded content audit (parallel subagents) | 17b-4 | 0.5 |
| 17b-6 | Content-side LocalizedString upgrade | 17b-5 | 0.25 |
| 17b-7a–x | Component-by-component extraction (15–25 sub-tasks) | 17b-6 | 1.0–1.5 |
| 17b-8 | Integrity test enhancements | 17b-7 complete | 0.25 |
| 17b-9 | Governance updates (VOCAB, CONSTITUTION, ARCHITECTURE) | 17b-8 | 0.25 |
| 17b-10 | Final verification + PR | 17b-9 | 0.25 |

**Total:** ~4 sessions (conservative; 17b-7 may span more based on audit).

Each task ends with STOP + Yesid approval per the Iteration Protocol. Commit per task. No batching. TodoWrite tracks progress live; markdown progress table printed in every STOP.

### Risk mitigations

| Risk | Mitigation |
|---|---|
| Audit surfaces 300+ findings | Calibration gate at Task 5 STOP — split into 17b-1 (infra) + 17b-2 (extraction) |
| Route loader migration breaks SSR | Task 4 includes preview spot-check on every page before STOP |
| Layout/error component imports break after restructure | Keep direct `$lib/content/*` imports for static constants (documented exception) |
| Metro strip renders wrong after derivation moves | Task 3 STOP includes home metro spot-check |
| Hero animation breaks after hero-mock fold-in | Task 3 STOP includes hero spot-check |
| Preview server stale state during migration | Restart preview after Tasks 1 and 4 |

---

## Governance updates

### VOCAB.md

**Architecture terms:** Port, Adapter, Repository, Content layer, Engine layer (utility), CMS-agnostic.

**Content terms:** LocalizedString, Translation debt, Enum + label-map pattern, Brace placeholder interpolation.

**Disambiguation:** "Services" (client-facing brand word) vs `repositories/service.ts` (code module) vs `src/lib/services/` (doesn't exist — we went with `repositories/` to avoid the clash). "Data" concept split into three: `content/` (source), `repositories/` (read API), `utils/` (engines).

### CONSTITUTION.md

New top-level section: **§ Data Architecture**. Codifies:

1. Four-layer hexagonal pattern + diagram
2. Import rules table
3. LocalizedString rule + user-facing-vs-bare checklist
4. CMS-agnostic rule: *"Any future CMS swap MUST be achievable by editing only `adapters/` files. PRs editing repositories or content to accommodate a new CMS are rejected — the code is in the wrong place."*
5. Documented exceptions (weather, service-svg, layout/error)

### ARCHITECTURE.md (new file)

Contents:

1. Layered hexagonal diagram
2. Layer responsibilities table
3. Import rules (enforced)
4. Naming conventions
5. Adapter swap procedure (step-by-step)
6. Documented exceptions with rationale
7. Decision log (the 15 decisions from this spec)

### `src/lib/README.md` (new)

One-page reference explaining the four-layer hierarchy for anyone landing inside `src/lib/`.

### Cloud learn doc

`<cloud>/yesid.dev/docs/learn/architecture/hexagonal-data-layer.md` — ports-and-adapters theory, how-we-use-it at yesid.dev with file links, worked example (adding a CMS), prerequisite learn docs.

---

## Acceptance criteria

### Structural

- `src/lib/data/` does not exist
- `src/lib/content/`, `src/lib/repositories/`, `src/lib/adapters/`, `src/lib/utils/` all exist
- `src/lib/types.ts` exists at top level
- `src/lib/repositories/` contains 6 files + `index.ts`
- `src/lib/adapters/` contains `static.ts`, `types.ts`, `index.ts`
- `src/lib/adapters/index.ts` has exactly one active export: `staticAdapter as adapter`
- No file in `src/lib/repositories/` imports from `$lib/content/*`
- No file in `src/lib/content/` imports from `$lib/repositories/*` or `$lib/adapters/*`
- No route loader imports from `$lib/content/*` or `$lib/adapters/*` (except documented exceptions)
- All repository functions are `async` with `readonly` returns where applicable

### Content

- Every user-facing string in `src/lib/content/*` is `LocalizedString`
- `content/integrity.test.ts` passes with LocalizedString guard enabled
- Translation-debt report emits en-only count per file
- `audit-hardcoded-content.md` committed in slice bundle

### Extraction

- Every audit finding is either extracted or explicitly marked "not needed" with rationale
- No component renders a bare user-facing string (per Section 4 checklist)
- Every localized-content component calls `resolveLocale()` at render time
- Loader → component flow passes `locale` where needed

### Testing

- `bun run test` passes — full output with every test named
- `bun run check` passes
- `bun run build` succeeds
- Repository tests exist alongside repository files
- Adapter contract test exists (`adapters/adapter.test.ts`)

### Visual regression

- Every page renders identically at 1440px and 375px:
  - Home (hero, services, proof, closer, manifesto)
  - /services listing + /services/[id] detail
  - /projects listing + /projects/[slug] detail
  - /blog listing + /blog/personal + /blog/[slug] detail
  - /tech-stack
  - /about
  - /contact
  - /+error (404)
- Hero metro strip renders all service stops + bookends
- Hero mock animation plays
- Blog markdown renders with Shiki highlighting
- Montreal weather loads on /about + /contact

### Documentation

- VOCAB.md updated
- CONSTITUTION.md updated with § Data Architecture
- ARCHITECTURE.md created
- `src/lib/README.md` created
- Cloud learn doc committed

### Process

- Every task commits with `<type>(slice-17b): <description>` convention
- Each task's commit SHA recorded in `handoff.md`
- `handoff.md` has Summary + PR body sections at close
- OS-quirks appended to `<cloud>/claude-knowledge/os-quirks/windows.md` if any
- `tree.txt` regenerated

### Downstream enablement

- Slice 15 SEO can read from `repositories/meta.ts` with zero refactor
- Slice 17c Zod can insert between adapter and repository with zero repository change
- Slice 17f test factories can mock the adapter via `adapters/_mock.ts` pattern
- Slice 18 Payload can drop `adapters/payload.ts` and flip one line in `adapters/index.ts`

---

## Out of scope (explicit)

- **Payload integration itself** — Slice 18
- **Keystatic integration** — future
- **Zod schemas** — Slice 17c (runs after Slice 15 SEO)
- **SEO `<SeoHead>`** — Slice 15 (runs on 17b's seam)
- **Test factories** — Slice 17f
- **Full fr/es translations** — post-Slice 17 (translation debt tracked, not paid)
- **Layout/error migration off `$lib/content`** — deferred to Slice 15
- **URL changes** — none. `/services`, `/projects`, etc. all stay
- **User-facing copy changes** — none
- **Visual/brand changes** — none
- **New features** — none
- **Renaming "services" to "offerings"** — rejected. Client-facing stays "Services."

---

## What 17b unlocks

- **Slice 15 SEO** runs on the repository seam → `<SeoHead>` works identically static or Payload
- **Slice 17c Zod** plugs in between adapter and repository → runtime validation becomes a clean diff
- **Slice 17f tests** mock adapters, not data files → test stability through any CMS swap
- **Slice 18 Payload** = one adapter file + one import flip → contained diff, no route/component changes
- **Translation to fr/es** → content file is the single place to fill translations; component diff is zero
- **Future content tweaks** → one commit touches one content file, cascades everywhere

---

## Planning session notes

- **Session date:** 2026-04-18
- **Parent model:** Opus 4.7 (as recommended for main-session deep-reasoning per CLAUDE.md)
- **Subagents:** none used during spec (planning only)
- **Brainstorming flow:** followed `superpowers:brainstorming` skill — 7 design sections presented and approved sequentially
- **Key clarifying questions answered:** 15 design decisions recorded above with rationale
- **Spec author responsibility at implementation time:** plan.md written next via `superpowers:writing-plans` skill
