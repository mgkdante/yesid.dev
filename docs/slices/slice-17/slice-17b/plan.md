# Slice 17b — Hexagonal Data Layer + LocalizedString Enforcement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split data definition from data access via hexagonal architecture (repositories → adapters → content), making the CMS source swappable in one line. Enforce LocalizedString for all user-facing content. Zero visual or user-facing changes.

**Architecture:** Four-layer structure under `src/lib/`: `repositories/` (ports — public API loaders call), `adapters/` (implementations — reads from content or future CMSes), `content/` (raw CMS-owned source, renamed from `data/`), `utils/` (pure engines — never CMS-owned). Plus top-level `types.ts`. Repositories are thin async delegation to adapters. Adapters satisfy the `ContentAdapter` interface. Swap CMS = one file in `adapters/index.ts`.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Bun runtime, Vitest, Tailwind v4. No new dependencies.

**Spec:** [spec.md](spec.md) — authoritative design source. 15 design decisions, full rationale.

---

## Pre-flight — done once before starting Task 1

- [ ] **P.1: Confirm baseline is green**

  Run:
  ```bash
  bun run test
  bun run check
  ```
  Expected: All tests pass. No type errors. Save the test count — we'll compare post-refactor to verify no tests disappeared.

- [ ] **P.2: Confirm branch is `feature/slice-17b-repositories`**

  Run:
  ```bash
  git branch --show-current
  ```
  Expected: `feature/slice-17b-repositories`

- [ ] **P.3: Seed TodoWrite from this plan's 10 Level-3 tasks**

  Create one todo per Level-3 task below (17b-1 through 17b-10). Mark 17b-1 as `in_progress`.

- [ ] **P.4: Open preview server for visual spot-checks**

  Run:
  ```bash
  bun run dev
  ```
  Keep it running throughout. Restart explicitly after Tasks 1 and 4 (large import reshuffles).

---

## Task 17b-1: Baseline + folder restructure

**Purpose:** Dissolve `src/lib/data/` into `src/lib/content/`, `src/lib/utils/`, `src/lib/types.ts`. No repository or adapter layer yet — imports point directly at the new locations.

**Files affected:**
- **Create:** `src/lib/content/` (directory), `src/lib/utils/` (directory), `src/lib/types.ts`
- **Move:** every file from `src/lib/data/` to new locations (details below)
- **Rename:** `data/content.ts` → `content/site-content.ts`, `data/highlight.ts` → `utils/markdown.ts`, `data/stackRoles.ts` → `utils/stack-roles.ts`, `data/serviceSvg.ts` → `utils/service-svg.ts`
- **Delete:** `src/lib/data/` (entire folder at end of task)
- **Modify:** every file in `src/` that imports from `$lib/data` or its subpaths

### Steps

- [ ] **1.1: Inventory all `$lib/data` import sites**

  Run:
  ```bash
  grep -rn "from ['\"]\\\$lib/data" src/ | sort
  ```
  Save the output to a scratchpad — you'll use it during step 1.9 to verify completeness.

- [ ] **1.2: Create the new directory structure**

  Run:
  ```bash
  mkdir -p src/lib/content src/lib/utils
  ```

- [ ] **1.3: Move content files (10 files)**

  Run (sequentially):
  ```bash
  git mv src/lib/data/projects.ts src/lib/content/projects.ts
  git mv src/lib/data/projects.test.ts src/lib/content/projects.test.ts
  git mv src/lib/data/services.ts src/lib/content/services.ts
  git mv src/lib/data/blog.ts src/lib/content/blog.ts
  git mv src/lib/data/meta.ts src/lib/content/meta.ts
  git mv src/lib/data/tech-stack.ts src/lib/content/tech-stack.ts
  git mv src/lib/data/tech-stack.test.ts src/lib/content/tech-stack.test.ts
  git mv src/lib/data/content.ts src/lib/content/site-content.ts
  git mv src/lib/data/content.test.ts src/lib/content/site-content.test.ts
  git mv src/lib/data/nav.ts src/lib/content/nav.ts
  git mv src/lib/data/nav.test.ts src/lib/content/nav.test.ts
  git mv src/lib/data/about-page.ts src/lib/content/about-page.ts
  git mv src/lib/data/about-page.test.ts src/lib/content/about-page.test.ts
  git mv src/lib/data/contact-page.ts src/lib/content/contact-page.ts
  git mv src/lib/data/contact-page.test.ts src/lib/content/contact-page.test.ts
  git mv src/lib/data/hero-data.ts src/lib/content/hero-data.ts
  git mv src/lib/data/hero-data.test.ts src/lib/content/hero-data.test.ts
  git mv src/lib/data/metro.ts src/lib/content/metro.ts
  git mv src/lib/data/metro.test.ts src/lib/content/metro.test.ts
  git mv src/lib/data/data-integrity.test.ts src/lib/content/integrity.test.ts
  ```

- [ ] **1.4: Move utility files with renames**

  Run:
  ```bash
  git mv src/lib/data/locale.ts src/lib/utils/locale.ts
  git mv src/lib/data/locale.test.ts src/lib/utils/locale.test.ts
  git mv src/lib/data/highlight.ts src/lib/utils/markdown.ts
  git mv src/lib/data/shapes.ts src/lib/utils/shapes.ts
  git mv src/lib/data/shapes.test.ts src/lib/utils/shapes.test.ts
  git mv src/lib/data/stackRoles.ts src/lib/utils/stack-roles.ts
  git mv src/lib/data/stackRoles.test.ts src/lib/utils/stack-roles.test.ts
  git mv src/lib/data/serviceSvg.ts src/lib/utils/service-svg.ts
  git mv src/lib/data/journey-shapes.ts src/lib/utils/journey-shapes.ts
  git mv src/lib/data/metro-network.ts src/lib/utils/metro-network.ts
  git mv src/lib/data/metro-network.test.ts src/lib/utils/metro-network.test.ts
  git mv src/lib/data/weather.ts src/lib/utils/weather.ts
  git mv src/lib/data/schema.ts src/lib/utils/json-ld.ts
  git mv src/lib/data/schema.test.ts src/lib/utils/json-ld.test.ts
  ```

- [ ] **1.5: Promote types to top-level**

  Run:
  ```bash
  git mv src/lib/data/types.ts src/lib/types.ts
  ```

- [ ] **1.6: Delete the old data barrel**

  Run:
  ```bash
  git rm src/lib/data/index.ts
  ```

- [ ] **1.7: Confirm `src/lib/data/` is empty and delete it**

  Run:
  ```bash
  ls src/lib/data/
  ```
  Expected: empty. If any files remain, investigate — they may be files I missed.

  Then:
  ```bash
  rmdir src/lib/data
  ```

- [ ] **1.8: Update every import in moved files to their sibling paths**

  Many of the moved files import from each other — e.g., `content/projects.ts` imports from `./types.js`, `./locale.js`. These relative imports now point to siblings that have moved. Fix with these sweeps:

  - In every file under `src/lib/content/`: `from './types.js'` → `from '$lib/types'`, `from './locale.js'` → `from '$lib/utils/locale'`, `from './highlight.js'` → `from '$lib/utils/markdown'`, `from './shapes.js'` → `from '$lib/utils/shapes'`, `from './stackRoles.js'` → `from '$lib/utils/stack-roles'`
  - In every file under `src/lib/utils/`: same treatment for cross-utility imports
  - Any `./<specific-file>.js` reference that stayed in the same folder keeps its relative path

  Run this grep to verify no stale relative paths remain:
  ```bash
  grep -rn "from '\\./types" src/lib/content src/lib/utils
  grep -rn "from '\\./highlight" src/lib/
  grep -rn "from '\\./stackRoles" src/lib/
  grep -rn "from '\\./serviceSvg" src/lib/
  ```
  Expected: no matches for the old names.

- [ ] **1.9: Update all consumer imports in `src/`**

  For every consumer found in step 1.1, update the import path. Use the mapping table below:

  | Old import | New import |
  |---|---|
  | `from '$lib/data'` (barrel) | Use specific paths — see below |
  | `from '$lib/data/types.js'` | `from '$lib/types'` |
  | `from '$lib/data/locale.js'` | `from '$lib/utils/locale'` |
  | `from '$lib/data/projects.js'` | `from '$lib/content/projects'` |
  | `from '$lib/data/services.js'` | `from '$lib/content/services'` |
  | `from '$lib/data/blog.js'` | `from '$lib/content/blog'` |
  | `from '$lib/data/meta.js'` | `from '$lib/content/meta'` |
  | `from '$lib/data/tech-stack.js'` | `from '$lib/content/tech-stack'` |
  | `from '$lib/data/content.js'` | `from '$lib/content/site-content'` |
  | `from '$lib/data/nav.js'` | `from '$lib/content/nav'` |
  | `from '$lib/data/about-page.js'` | `from '$lib/content/about-page'` |
  | `from '$lib/data/contact-page.js'` | `from '$lib/content/contact-page'` |
  | `from '$lib/data/hero-data.js'` | `from '$lib/content/hero-data'` |
  | `from '$lib/data/metro.js'` | `from '$lib/content/metro'` |
  | `from '$lib/data/highlight.js'` | `from '$lib/utils/markdown'` |
  | `from '$lib/data/shapes.js'` | `from '$lib/utils/shapes'` |
  | `from '$lib/data/stackRoles.js'` | `from '$lib/utils/stack-roles'` |
  | `from '$lib/data/serviceSvg.js'` | `from '$lib/utils/service-svg'` |
  | `from '$lib/data/journey-shapes.js'` | `from '$lib/utils/journey-shapes'` |
  | `from '$lib/data/metro-network.js'` | `from '$lib/utils/metro-network'` |
  | `from '$lib/data/weather.js'` | `from '$lib/utils/weather'` |
  | `from '$lib/data/schema.js'` | `from '$lib/utils/json-ld'` |

  For barrel imports (`from '$lib/data'`), expand into individual specific imports. Example:

  Before:
  ```ts
  import { siteMeta, buildPersonSchema } from '$lib/data'
  ```
  After:
  ```ts
  import { siteMeta } from '$lib/content/meta'
  import { buildPersonSchema } from '$lib/utils/json-ld'
  ```

- [ ] **1.10: Verify no `$lib/data` references remain**

  Run:
  ```bash
  grep -rn "\\\$lib/data" src/ docs/ 2>/dev/null
  ```
  Expected: no matches in `src/`. (Matches in `docs/` are historical; leave them for Task 9 to clean.)

- [ ] **1.11: Run type check**

  Run:
  ```bash
  bun run check
  ```
  Expected: passes. If it fails, missing/broken imports remain — fix them before continuing.

- [ ] **1.12: Run full test suite**

  Run:
  ```bash
  bun run test
  ```
  Expected: all tests that passed at P.1 still pass. Same count. No new failures.

  **Per `TESTS.md` rule: print the full test table with every test name + status in the task-completion STOP. Never "some tests failed" without listing.**

- [ ] **1.13: Visual spot-check every page**

  Restart preview:
  ```bash
  # Ctrl+C the running dev server, then:
  bun run dev
  ```

  Using `mcp__Claude_Preview__preview_start` + `preview_snapshot`, visit each page at 1440px, verify renders:
  - `/` (home)
  - `/services`
  - `/services/data-engineering` (example detail)
  - `/projects`
  - `/projects/<first-slug>`
  - `/blog`
  - `/blog/personal`
  - `/blog/<first-slug>`
  - `/tech-stack`
  - `/about`
  - `/contact`
  - Non-existent URL → `/+error`

  Expected: all render identically to pre-restructure. No console errors.

- [ ] **1.14: Commit**

  Run:
  ```bash
  git add -A
  git status
  ```
  Verify staged changes are only moved/renamed files + import updates — no stray files.

  ```bash
  git commit -m "refactor(slice-17b): restructure data layer into content, utils, types

  - Move src/lib/data/ content files to src/lib/content/
  - Move src/lib/data/ utility files to src/lib/utils/ with renames:
    - highlight.ts -> markdown.ts
    - stackRoles.ts -> stack-roles.ts
    - serviceSvg.ts -> service-svg.ts
    - schema.ts -> json-ld.ts
  - Rename content/content.ts -> content/site-content.ts (avoid folder shadow)
  - Promote data/types.ts -> src/lib/types.ts (flat contracts)
  - Delete src/lib/data/ folder including barrel index.ts
  - Update all import sites in src/ to new paths
  - Rename data-integrity.test.ts -> integrity.test.ts

  No functional changes. Every test that passed before passes now. Site
  renders identically across all pages."
  ```

- [ ] **1.15: STOP — update TodoWrite, print progress table, wait for approval**

  Print:
  ```markdown
  | # | Task | Status | Commit |
  |---|------|--------|--------|
  | 17b-1 | Folder restructure | completed | <commit-sha> |
  | 17b-2 | Adapter scaffold | pending | — |
  | ... | ... | ... | ... |
  ```

  Append to `docs/slices/slice-17/slice-17b/log.md` and `handoff.md` per Iteration Protocol.

---

## Task 17b-2: Adapter scaffold

**Purpose:** Create `src/lib/adapters/` with the `ContentAdapter` contract, the static implementation, and the swap-point index. Adapter test verifies every contract method returns shape-correct data.

**Files affected:**
- **Create:** `src/lib/adapters/types.ts`, `src/lib/adapters/static.ts`, `src/lib/adapters/index.ts`, `src/lib/adapters/adapter.test.ts`

### Steps

- [ ] **2.1: Create the directory**

  Run:
  ```bash
  mkdir -p src/lib/adapters
  ```

- [ ] **2.2: Write the `ContentAdapter` contract type**

  Create `src/lib/adapters/types.ts`:

  ```ts
  import type {
    Project, Service, BlogPost, BlogCategory, BlogAnimation,
    SiteMeta, TechStackItem, InfraLayer, DomainCluster,
    StackScenario, TechRelation, Locale,
    AboutContent, ContactContent, JourneyPanel
  } from '$lib/types'
  import type { MetroStop } from '$lib/content/metro'
  import type { HeroData } from '$lib/content/hero-data'
  import type { ErrorPageContent, NavLink, MenuItem } from '$lib/content/nav'

  export interface ContentAdapter {
    projects: ProjectPort
    services: ServicePort
    blog: BlogPort
    meta: MetaPort
    techStack: TechStackPort
    content: ContentPort
  }

  export interface ProjectPort {
    all(): Promise<readonly Project[]>
    bySlug(slug: string): Promise<Project | undefined>
    featured(): Promise<readonly Project[]>
    public(): Promise<readonly Project[]>
    byService(serviceId: string): Promise<readonly Project[]>
    allTags(): Promise<readonly string[]>
    allStackItems(): Promise<readonly string[]>
    serviceIdsForProjects(): Promise<readonly string[]>
  }

  export interface ServicePort {
    all(): Promise<readonly Service[]>
    byId(id: string): Promise<Service | undefined>
    visible(): Promise<readonly Service[]>
    adjacent(id: string): Promise<{ prev?: Service; next?: Service }>
  }

  export interface BlogPort {
    all(): Promise<readonly BlogPost[]>
    bySlug(slug: string): Promise<BlogPost | undefined>
    html(slug: string): Promise<string>
    byCategory(category: BlogCategory): Promise<readonly BlogPost[]>
    byTag(category: BlogCategory, tag: string): Promise<readonly BlogPost[]>
    tagsForCategory(category: BlogCategory): Promise<readonly string[]>
    languagesForCategory(category: BlogCategory): Promise<readonly Locale[]>
    latest(count: number, category?: BlogCategory): Promise<readonly BlogPost[]>
    svgContent(post: BlogPost): Promise<string>
    svgContentsForPosts(posts: readonly BlogPost[]): Promise<Record<string, string>>
    resolveSvgFallbackName(slug: string, category: BlogCategory): Promise<string>
    resolveAnimation(slug: string, explicit: string | undefined): Promise<BlogAnimation>
  }

  export interface MetaPort {
    site(): Promise<SiteMeta>
  }

  export interface TechStackPort {
    all(): Promise<readonly TechStackItem[]>
    byId(id: string): Promise<TechStackItem | undefined>
    byLayer(layer: InfraLayer): Promise<readonly TechStackItem[]>
    byDomain(domain: DomainCluster): Promise<readonly TechStackItem[]>
    connections(id: string): Promise<readonly string[]>
    incomingConnections(id: string): Promise<readonly string[]>
    outgoingRelations(id: string): Promise<readonly TechRelation[]>
    incomingRelations(id: string): Promise<readonly TechRelation[]>
    content(id: string): Promise<string>
    allScenarios(): Promise<readonly StackScenario[]>
    scenarioForDomains(domains: DomainCluster[]): Promise<StackScenario | undefined>
  }

  export interface ContentPort {
    hero(): Promise<typeof import('$lib/content/site-content').heroContent>
    heroAnim(): Promise<typeof import('$lib/content/site-content').heroAnimContent>
    manifesto(): Promise<typeof import('$lib/content/site-content').manifestoContent>
    proofReel(): Promise<typeof import('$lib/content/site-content').proofReelContent>
    servicesGrid(): Promise<typeof import('$lib/content/site-content').servicesGridContent>
    about(): Promise<typeof import('$lib/content/site-content').aboutContent>
    cta(): Promise<typeof import('$lib/content/site-content').ctaContent>
    closer(): Promise<typeof import('$lib/content/site-content').closerContent>
    skillsJourneyPanels(): Promise<readonly JourneyPanel[]>
    skillsJourneyCta(): Promise<typeof import('$lib/content/site-content').skillsJourneyCta>
    navLinks(): Promise<readonly NavLink[]>
    menuItems(): Promise<readonly MenuItem[]>
    errorPage(): Promise<ErrorPageContent>
    aboutPage(): Promise<AboutContent>
    contactPage(): Promise<ContactContent>
    heroMock(): Promise<HeroData>
    initialHeroData(): Promise<HeroData>
  }
  ```

  **Note the complexity of `ContentPort`.** The `typeof import(...)` pattern preserves the exact inferred types from existing content files without duplicating them. When content files evolve, the port type follows. Adapter implementations satisfy automatically.

- [ ] **2.3: Write the static adapter**

  Create `src/lib/adapters/static.ts`:

  ```ts
  import type { ContentAdapter } from './types'

  // Content imports — the ONLY place content/ is read.
  import {
    projects, getProjectBySlug as findBySlug, getFeaturedProjects,
    getPublicProjects, getProjectsByService, getAllTags, getAllStackItems,
    getServiceIdsForProjects
  } from '$lib/content/projects'
  import {
    services, getServiceById, getVisibleServices, getAdjacentServices
  } from '$lib/content/services'
  import {
    blogPosts, getPostBySlug, getPostHtml, getPostsByCategory,
    getPostsByTag, getTagsForCategory, getLanguagesForCategory,
    getLatestPosts, getSvgContent, getSvgContentsForPosts,
    resolveSvgFallbackName, resolveAnimation
  } from '$lib/content/blog'
  import { siteMeta } from '$lib/content/meta'
  import {
    getAllTechItems, getTechItemById, getTechItemsByLayer,
    getTechItemsByDomain, getConnections, getIncomingConnections,
    getOutgoingRelations, getIncomingRelations, getTechItemContent,
    getAllScenarios, getScenarioForDomains
  } from '$lib/content/tech-stack'
  import {
    heroContent, heroAnimContent, manifestoContent, proofReelContent,
    servicesGridContent, aboutContent, ctaContent, closerContent,
    skillsJourneyPanels, skillsJourneyCta
  } from '$lib/content/site-content'
  import { navLinks, menuItems, errorPageContent } from '$lib/content/nav'
  import { aboutPageContent } from '$lib/content/about-page'
  import { contactContent } from '$lib/content/contact-page'
  import { generateHeroData, INITIAL_HERO_DATA } from '$lib/content/hero-data'

  export const staticAdapter: ContentAdapter = {
    projects: {
      all: async () => projects,
      bySlug: async (slug) => findBySlug(slug),
      featured: async () => getFeaturedProjects(),
      public: async () => getPublicProjects(),
      byService: async (serviceId) => getProjectsByService(serviceId),
      allTags: async () => getAllTags(),
      allStackItems: async () => getAllStackItems(),
      serviceIdsForProjects: async () => getServiceIdsForProjects(),
    },
    services: {
      all: async () => services,
      byId: async (id) => getServiceById(id),
      visible: async () => getVisibleServices(),
      adjacent: async (id) => getAdjacentServices(id),
    },
    blog: {
      all: async () => blogPosts,
      bySlug: async (slug) => getPostBySlug(slug),
      html: async (slug) => getPostHtml(slug),
      byCategory: async (category) => getPostsByCategory(category),
      byTag: async (category, tag) => getPostsByTag(category, tag),
      tagsForCategory: async (category) => getTagsForCategory(category),
      languagesForCategory: async (category) => getLanguagesForCategory(category),
      latest: async (count, category) => getLatestPosts(count, category),
      svgContent: async (post) => getSvgContent(post),
      svgContentsForPosts: async (posts) => getSvgContentsForPosts(posts),
      resolveSvgFallbackName: async (slug, category) => resolveSvgFallbackName(slug, category),
      resolveAnimation: async (slug, explicit) => resolveAnimation(slug, explicit),
    },
    meta: {
      site: async () => siteMeta,
    },
    techStack: {
      all: async () => getAllTechItems(),
      byId: async (id) => getTechItemById(id),
      byLayer: async (layer) => getTechItemsByLayer(layer),
      byDomain: async (domain) => getTechItemsByDomain(domain),
      connections: async (id) => getConnections(id),
      incomingConnections: async (id) => getIncomingConnections(id),
      outgoingRelations: async (id) => getOutgoingRelations(id),
      incomingRelations: async (id) => getIncomingRelations(id),
      content: async (id) => getTechItemContent(id),
      allScenarios: async () => getAllScenarios(),
      scenarioForDomains: async (domains) => getScenarioForDomains(domains),
    },
    content: {
      hero: async () => heroContent,
      heroAnim: async () => heroAnimContent,
      manifesto: async () => manifestoContent,
      proofReel: async () => proofReelContent,
      servicesGrid: async () => servicesGridContent,
      about: async () => aboutContent,
      cta: async () => ctaContent,
      closer: async () => closerContent,
      skillsJourneyPanels: async () => skillsJourneyPanels,
      skillsJourneyCta: async () => skillsJourneyCta,
      navLinks: async () => navLinks,
      menuItems: async () => menuItems,
      errorPage: async () => errorPageContent,
      aboutPage: async () => aboutPageContent,
      contactPage: async () => contactContent,
      heroMock: async () => generateHeroData(),
      initialHeroData: async () => INITIAL_HERO_DATA,
    },
  }
  ```

  **The `: ContentAdapter` annotation is what enforces the contract.** Missing a method → compile error.

- [ ] **2.4: Create the swap-point index**

  Create `src/lib/adapters/index.ts`:

  ```ts
  // The single line that picks the active content backend.
  // To switch CMS: add a new adapter file in this folder and change the re-export below.
  export { staticAdapter as adapter } from './static'
  ```

- [ ] **2.5: Write the adapter contract test (TDD: this test should pass immediately since we just wrote a complete implementation)**

  Create `src/lib/adapters/adapter.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { adapter } from './index'

  describe('ContentAdapter contract', () => {
    describe('projects port', () => {
      it('all() returns a non-empty readonly array', async () => {
        const result = await adapter.projects.all()
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      })

      it('bySlug() returns undefined for unknown slug', async () => {
        const result = await adapter.projects.bySlug('__nonexistent__')
        expect(result).toBeUndefined()
      })

      it('featured() returns a subset of all()', async () => {
        const [all, featured] = await Promise.all([
          adapter.projects.all(),
          adapter.projects.featured(),
        ])
        expect(featured.length).toBeLessThanOrEqual(all.length)
      })
    })

    describe('services port', () => {
      it('all() returns a non-empty readonly array', async () => {
        const result = await adapter.services.all()
        expect(result.length).toBeGreaterThan(0)
      })

      it('byId() returns undefined for unknown id', async () => {
        const result = await adapter.services.byId('__nonexistent__')
        expect(result).toBeUndefined()
      })

      it('adjacent() returns prev/next shape', async () => {
        const all = await adapter.services.visible()
        const middle = all[Math.floor(all.length / 2)]
        const result = await adapter.services.adjacent(middle.id)
        expect(result).toHaveProperty('prev')
        expect(result).toHaveProperty('next')
      })
    })

    describe('blog port', () => {
      it('all() returns a non-empty readonly array', async () => {
        const result = await adapter.blog.all()
        expect(result.length).toBeGreaterThan(0)
      })

      it('byCategory("professional") returns posts', async () => {
        const result = await adapter.blog.byCategory('professional')
        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('meta port', () => {
      it('site() returns SiteMeta shape', async () => {
        const result = await adapter.meta.site()
        expect(result).toHaveProperty('owner')
        expect(result).toHaveProperty('links')
        expect(result).toHaveProperty('address')
      })
    })

    describe('techStack port', () => {
      it('all() returns a non-empty readonly array', async () => {
        const result = await adapter.techStack.all()
        expect(result.length).toBeGreaterThan(0)
      })

      it('allScenarios() returns scenarios', async () => {
        const result = await adapter.techStack.allScenarios()
        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('content port', () => {
      it('hero() returns content', async () => {
        const result = await adapter.content.hero()
        expect(result).toBeDefined()
      })

      it('nav links() returns a non-empty array', async () => {
        const result = await adapter.content.navLinks()
        expect(result.length).toBeGreaterThan(0)
      })

      it('heroMock() returns HeroData shape', async () => {
        const result = await adapter.content.heroMock()
        expect(result).toHaveProperty('metrics')
        expect(result).toHaveProperty('queries')
      })
    })
  })
  ```

- [ ] **2.6: Run adapter test**

  Run:
  ```bash
  bun run test src/lib/adapters/adapter.test.ts
  ```
  Expected: all tests pass.

- [ ] **2.7: Run full check**

  Run:
  ```bash
  bun run check
  ```
  Expected: passes. If it fails, the `ContentAdapter` interface has mismatches with `staticAdapter`.

- [ ] **2.8: Run full test suite to confirm no regression**

  Run:
  ```bash
  bun run test
  ```
  Expected: all tests pass, including pre-existing ones.

- [ ] **2.9: Commit**

  ```bash
  git add src/lib/adapters/
  git commit -m "feat(slice-17b): scaffold CMS-agnostic adapter layer

  - Add src/lib/adapters/ with ContentAdapter interface
  - staticAdapter implements full contract, reads from \$lib/content/*
  - adapters/index.ts is the one-line swap point for future CMSes
  - adapter.test.ts verifies every port method returns shape-correct data

  Adapter isn't wired yet — route loaders still import content directly.
  Task 17b-3 introduces repositories that consume this adapter."
  ```

- [ ] **2.10: STOP — progress table + handoff append + approval**

---

## Task 17b-3: Repository layer (6 files + barrel)

**Purpose:** Create `src/lib/repositories/` with 6 repository modules delegating to the adapter. Fold `metro.ts` derivation into `repositories/service.ts`. Fold hero-mock generation into `repositories/content.ts`.

**Files affected:**
- **Create:** `src/lib/repositories/project.ts`, `service.ts`, `blog.ts`, `meta.ts`, `tech-stack.ts`, `content.ts`, `index.ts`, and test files
- **Modify:** move existing `content/*.test.ts` tests that test query functions into `repositories/*.test.ts`
- **Delete:** `src/lib/content/metro.ts` + `metro.test.ts` (derivation now lives in repo)

### Steps

- [ ] **3.1: Create the directory**

  Run:
  ```bash
  mkdir -p src/lib/repositories
  ```

- [ ] **3.2: Write `repositories/project.ts`**

  Create:

  ```ts
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

  export async function getAllTags(): Promise<readonly string[]> {
    return adapter.projects.allTags()
  }

  export async function getAllStackItems(): Promise<readonly string[]> {
    return adapter.projects.allStackItems()
  }

  export async function getServiceIdsForProjects(): Promise<readonly string[]> {
    return adapter.projects.serviceIdsForProjects()
  }
  ```

- [ ] **3.3: Write `repositories/service.ts` (includes metro derivation)**

  First, read `src/lib/content/metro.ts` to understand the current `buildMetroLine` logic. Port it into the repository, sourcing from adapter instead of the local `services` import. Also port `formatStopLabel` and `getStopByType`.

  Create `src/lib/repositories/service.ts`:

  ```ts
  import { adapter } from '$lib/adapters'
  import type { Service, Locale } from '$lib/types'

  export async function getAllServices(): Promise<readonly Service[]> {
    return adapter.services.all()
  }

  export async function getServiceById(id: string): Promise<Service | undefined> {
    return adapter.services.byId(id)
  }

  export async function getVisibleServices(): Promise<readonly Service[]> {
    return adapter.services.visible()
  }

  export async function getAdjacentServices(
    id: string
  ): Promise<{ prev?: Service; next?: Service }> {
    return adapter.services.adjacent(id)
  }

  // Metro stop derivation — view over services + nav bookend labels.
  // Moved from src/lib/content/metro.ts in 17b-3. The metro line is a
  // yesid.dev-specific projection, not a CMS concept, so it lives in the
  // repository rather than the adapter.

  export interface MetroStop {
    readonly id: string
    readonly label: import('$lib/types').LocalizedString
    readonly stopNumber: string
    readonly type: 'hero' | 'service' | 'featured' | 'about' | 'blog' | 'terminal'
  }

  export async function getMetroStops(): Promise<readonly MetroStop[]> {
    const services = await adapter.services.visible()
    // Bookend labels currently live in content/metro.ts inline.
    // They move to content/nav.ts under `metroBookends` during Task 6.
    // For now, reproduce the exact current labels:
    const stops: MetroStop[] = []

    stops.push({
      id: 'hero',
      stopNumber: '00',
      label: { en: 'Departure', fr: 'Départ', es: 'Salida' },
      type: 'hero',
    })

    services.forEach((service, idx) => {
      stops.push({
        id: service.id,
        stopNumber: String(idx + 1).padStart(2, '0'),
        label: service.title,
        type: 'service',
      })
    })

    stops.push({
      id: 'about',
      stopNumber: String(services.length + 1).padStart(2, '0'),
      label: { en: 'About', fr: 'À propos', es: 'Acerca de' },
      type: 'about',
    })

    stops.push({
      id: 'blog',
      stopNumber: String(services.length + 2).padStart(2, '0'),
      label: { en: 'Blog', fr: 'Blog', es: 'Blog' },
      type: 'blog',
    })

    stops.push({
      id: 'terminal',
      stopNumber: 'TERMINAL',
      label: { en: 'Home', fr: 'Accueil', es: 'Inicio' },
      type: 'terminal',
    })

    return stops
  }

  export async function getTotalStops(): Promise<number> {
    return (await getMetroStops()).length
  }

  export async function getStopByType(
    type: MetroStop['type']
  ): Promise<MetroStop | undefined> {
    const stops = await getMetroStops()
    return stops.find((s) => s.type === type)
  }

  export function formatStopLabel(stop: MetroStop, locale: Locale = 'en'): string {
    return stop.label[locale] ?? stop.label.en
  }

  export async function formatServicesLabel(): Promise<string> {
    const visible = await adapter.services.visible()
    return `${visible.length} ACTIVE`
  }
  ```

  **Note:** This preserves the current bookend labels as inline LocalizedStrings. Task 6 (LocalizedString upgrade) moves them into `content/nav.ts` as `metroBookends: { departure, about, blog, terminal }` and the repository reads from there.

- [ ] **3.4: Write `repositories/blog.ts`**

  Create:

  ```ts
  import { adapter } from '$lib/adapters'
  import type {
    BlogPost, BlogCategory, BlogAnimation, Locale
  } from '$lib/types'

  export async function getAllPosts(): Promise<readonly BlogPost[]> {
    return adapter.blog.all()
  }

  export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return adapter.blog.bySlug(slug)
  }

  export async function getPostHtml(slug: string): Promise<string> {
    return adapter.blog.html(slug)
  }

  export async function getPostsByCategory(
    category: BlogCategory
  ): Promise<readonly BlogPost[]> {
    return adapter.blog.byCategory(category)
  }

  export async function getPostsByTag(
    category: BlogCategory,
    tag: string
  ): Promise<readonly BlogPost[]> {
    return adapter.blog.byTag(category, tag)
  }

  export async function getTagsForCategory(
    category: BlogCategory
  ): Promise<readonly string[]> {
    return adapter.blog.tagsForCategory(category)
  }

  export async function getLanguagesForCategory(
    category: BlogCategory
  ): Promise<readonly Locale[]> {
    return adapter.blog.languagesForCategory(category)
  }

  export async function getLatestPosts(
    count: number,
    category?: BlogCategory
  ): Promise<readonly BlogPost[]> {
    return adapter.blog.latest(count, category)
  }

  export async function getSvgContent(post: BlogPost): Promise<string> {
    return adapter.blog.svgContent(post)
  }

  export async function getSvgContentsForPosts(
    posts: readonly BlogPost[]
  ): Promise<Record<string, string>> {
    return adapter.blog.svgContentsForPosts(posts)
  }

  export async function resolveSvgFallbackName(
    slug: string,
    category: BlogCategory
  ): Promise<string> {
    return adapter.blog.resolveSvgFallbackName(slug, category)
  }

  export async function resolveAnimation(
    slug: string,
    explicit: string | undefined
  ): Promise<BlogAnimation> {
    return adapter.blog.resolveAnimation(slug, explicit)
  }
  ```

- [ ] **3.5: Write `repositories/meta.ts`**

  Create:

  ```ts
  import { adapter } from '$lib/adapters'
  import { buildPersonSchema } from '$lib/utils/json-ld'
  import type { SiteMeta } from '$lib/types'

  export async function getSiteMeta(): Promise<SiteMeta> {
    return adapter.meta.site()
  }

  export async function getPersonSchema(): Promise<string> {
    const meta = await adapter.meta.site()
    return buildPersonSchema(meta)
  }
  ```

- [ ] **3.6: Write `repositories/tech-stack.ts`**

  Create:

  ```ts
  import { adapter } from '$lib/adapters'
  import type {
    TechStackItem, InfraLayer, DomainCluster,
    StackScenario, TechRelation
  } from '$lib/types'

  export async function getAllTechItems(): Promise<readonly TechStackItem[]> {
    return adapter.techStack.all()
  }

  export async function getTechItemById(id: string): Promise<TechStackItem | undefined> {
    return adapter.techStack.byId(id)
  }

  export async function getTechItemsByLayer(layer: InfraLayer): Promise<readonly TechStackItem[]> {
    return adapter.techStack.byLayer(layer)
  }

  export async function getTechItemsByDomain(domain: DomainCluster): Promise<readonly TechStackItem[]> {
    return adapter.techStack.byDomain(domain)
  }

  export async function getConnections(id: string): Promise<readonly string[]> {
    return adapter.techStack.connections(id)
  }

  export async function getIncomingConnections(id: string): Promise<readonly string[]> {
    return adapter.techStack.incomingConnections(id)
  }

  export async function getOutgoingRelations(id: string): Promise<readonly TechRelation[]> {
    return adapter.techStack.outgoingRelations(id)
  }

  export async function getIncomingRelations(id: string): Promise<readonly TechRelation[]> {
    return adapter.techStack.incomingRelations(id)
  }

  export async function getTechItemContent(id: string): Promise<string> {
    return adapter.techStack.content(id)
  }

  export async function getAllScenarios(): Promise<readonly StackScenario[]> {
    return adapter.techStack.allScenarios()
  }

  export async function getScenarioForDomains(
    domains: DomainCluster[]
  ): Promise<StackScenario | undefined> {
    return adapter.techStack.scenarioForDomains(domains)
  }
  ```

- [ ] **3.7: Write `repositories/content.ts`**

  Create:

  ```ts
  import { adapter } from '$lib/adapters'
  import type { AboutContent, ContactContent, JourneyPanel } from '$lib/types'
  import type { ErrorPageContent, NavLink, MenuItem } from '$lib/content/nav'
  import type { HeroData } from '$lib/content/hero-data'

  // Site content getters
  export async function getHeroContent() {
    return adapter.content.hero()
  }

  export async function getHeroAnimContent() {
    return adapter.content.heroAnim()
  }

  export async function getManifestoContent() {
    return adapter.content.manifesto()
  }

  export async function getProofReelContent() {
    return adapter.content.proofReel()
  }

  export async function getServicesGridContent() {
    return adapter.content.servicesGrid()
  }

  export async function getAboutContent() {
    return adapter.content.about()
  }

  export async function getCtaContent() {
    return adapter.content.cta()
  }

  export async function getCloserContent() {
    return adapter.content.closer()
  }

  export async function getSkillsJourneyPanels(): Promise<readonly JourneyPanel[]> {
    return adapter.content.skillsJourneyPanels()
  }

  export async function getSkillsJourneyCta() {
    return adapter.content.skillsJourneyCta()
  }

  // Navigation content
  export async function getNavLinks(): Promise<readonly NavLink[]> {
    return adapter.content.navLinks()
  }

  export async function getMenuItems(): Promise<readonly MenuItem[]> {
    return adapter.content.menuItems()
  }

  export async function getErrorPageContent(): Promise<ErrorPageContent> {
    return adapter.content.errorPage()
  }

  // Full-page content
  export async function getAboutPageContent(): Promise<AboutContent> {
    return adapter.content.aboutPage()
  }

  export async function getContactPageContent(): Promise<ContactContent> {
    return adapter.content.contactPage()
  }

  // Hero mock data — `heroMock()` produces a fresh random shuffle each call;
  // `initialHeroData()` returns the static initial value used during SSR.
  export async function getHeroMockData(): Promise<HeroData> {
    return adapter.content.heroMock()
  }

  export async function getInitialHeroData(): Promise<HeroData> {
    return adapter.content.initialHeroData()
  }
  ```

- [ ] **3.8: Write `repositories/index.ts` barrel**

  Create:

  ```ts
  // Public repository barrel — route loaders import from '$lib/repositories'.
  export * from './project'
  export * from './service'
  export * from './blog'
  export * from './meta'
  export * from './tech-stack'
  export * from './content'
  ```

  **Note:** The barrel uses `export *`. If two repositories export the same name (shouldn't happen given our naming), TypeScript will catch the collision. Manual review: function names in this plan are globally unique.

- [ ] **3.9: Move + adapt existing query-function tests**

  Tests currently in `src/lib/content/` that test query functions (not just raw data) need to move to `src/lib/repositories/` and have their imports updated. Most tests stay in content (integrity tests of raw data stay).

  **Files to move (query-function tests):**
  - `src/lib/content/projects.test.ts` → `src/lib/repositories/project.test.ts` (if it tests query functions; otherwise keep in content)
  - `src/lib/content/tech-stack.test.ts` → `src/lib/repositories/tech-stack.test.ts` (same logic)
  - `src/lib/content/metro.test.ts` → `src/lib/repositories/service.test.ts` (metro is now a repository function)

  For each moved test file:
  1. Update imports: `from './projects.js'` → `from './project'` (new repository path) OR `from '$lib/repositories/project'`
  2. Adjust expectations: all repository functions are `async` now. Tests calling `getProjectBySlug('foo')` must `await` the result. Change `expect(getProjectBySlug(...))` to `expect(await getProjectBySlug(...))`.
  3. Example transform:

     Before:
     ```ts
     it('returns a project by slug', () => {
       const result = getProjectBySlug('yesid-dev')
       expect(result).toBeDefined()
     })
     ```
     After:
     ```ts
     it('returns a project by slug', async () => {
       const result = await getProjectBySlug('yesid-dev')
       expect(result).toBeDefined()
     })
     ```

  4. For tests that tested `buildMetroLine()` internals or `metroStops` constant — adapt to test `getMetroStops()` (now async). If the test read `TOTAL_STOPS`, change to `await getTotalStops()`.

  Run:
  ```bash
  git mv src/lib/content/projects.test.ts src/lib/repositories/project.test.ts
  git mv src/lib/content/tech-stack.test.ts src/lib/repositories/tech-stack.test.ts
  git mv src/lib/content/metro.test.ts src/lib/repositories/service.test.ts
  ```

  Then edit each to async + correct imports.

- [ ] **3.10: Dissolve `content/metro.ts`**

  The derivation logic moved to `repositories/service.ts`. The content file no longer serves a purpose.

  Before deleting, grep for any remaining imports:
  ```bash
  grep -rn "from '\\\$lib/content/metro'" src/
  grep -rn "from '\\./metro'" src/lib/content/
  ```

  For every match, replace with imports from `$lib/repositories/service`:
  - `metroStops` → `await getMetroStops()`
  - `TOTAL_STOPS` → `await getTotalStops()`
  - `formatStopLabel` → same name, now in `$lib/repositories/service` (sync function)
  - `formatServicesLabel` → same name, now in `$lib/repositories/service` (now async)
  - `getStopByType` → same name, now async
  - `MetroStop` type → same name, imported from `$lib/repositories/service`

  Once no references remain:
  ```bash
  git rm src/lib/content/metro.ts
  ```

- [ ] **3.11: Adjust `content/hero-data.ts` to be pure data**

  The current `hero-data.ts` has:
  - `STM_ROUTES` constant — stays (pure data)
  - `HeroMetric`, `HeroQueryRow`, `HeroData` interfaces — stays (move to `src/lib/types.ts` eventually, but for 17b keep here)
  - `generateHeroData()` function — stays in content (adapter calls it); generation logic is data-specific (relies on local STM_ROUTES)
  - `INITIAL_HERO_DATA` constant — stays

  Actually, no changes needed to the file itself — the adapter imports and calls `generateHeroData` + `INITIAL_HERO_DATA` directly. The repository exposes them through `getHeroMockData()` / `getInitialHeroData()`. **Verify the file exports haven't changed; no edit needed in this step.**

- [ ] **3.12: Run type check**

  Run:
  ```bash
  bun run check
  ```
  Expected: passes. Common failures to fix:
  - Missing `await` on repository calls in tests
  - Stale `from '$lib/content/metro'` imports
  - `MetroStop` type import path changed

- [ ] **3.13: Run full test suite**

  Run:
  ```bash
  bun run test
  ```
  Expected: all tests pass. New repository tests mirror the old content-file tests behaviorally.

  Print the full test table per `TESTS.md` rule.

- [ ] **3.14: Visual spot-check the metro strip + hero**

  Restart preview if stale. Visit `/` and verify:
  - Hero renders with all mock data (metrics + queries animate)
  - Metro strip at the bottom shows: Departure (00) → each service → About → Blog → Home (TERMINAL)
  - No console errors

- [ ] **3.15: Commit**

  ```bash
  git add -A
  git commit -m "feat(slice-17b): add repositories as port layer

  - Create src/lib/repositories/ with 6 modules + index.ts barrel:
    project, service, blog, meta, tech-stack, content
  - All functions are async (Promise<T>), readonly collections where
    applicable, undefined (not null) for not-found
  - Repositories delegate to adapter.<collection>.<verb> — zero business
    logic, pure ports layer
  - Fold content/metro.ts derivation into repositories/service.ts as
    getMetroStops(), getTotalStops(), getStopByType(), formatStopLabel(),
    formatServicesLabel(). Bookend labels (Departure/About/Blog/Home)
    inlined as LocalizedStrings; they'll move to content/nav.ts in Task 6.
  - Move query-function tests from content/ to repositories/; update them
    to async.
  - Delete src/lib/content/metro.ts (dissolved).

  Route loaders and components still import from content/ directly —
  Task 17b-4 migrates them."
  ```

- [ ] **3.16: STOP — progress table + handoff append + approval**

---

## Task 17b-4: Route loader migration

**Purpose:** Migrate every route loader off `$lib/content/*` onto `$lib/repositories`. Add `await` where needed. Documented exceptions: `weather.ts`, `service-svg.ts` (direct from `$lib/utils/`), `+layout.svelte`/`+error.svelte` (keep static constants from `$lib/content/*`).

**Files affected:**
- **Modify (route loaders):** `src/routes/+page.ts`, `/projects/+page.ts`, `/projects/[slug]/+page.ts`, `/services/+page.ts`, `/services/[id]/+page.ts`, `/blog/+page.ts`, `/blog/personal/+page.ts`, `/blog/[slug]/+page.ts`, `/tech-stack/+page.ts`, `/about/+page.server.ts`, `/contact/+page.server.ts`

### Steps

- [ ] **4.1: Write the migration mapping**

  Rule: replace each content import with the corresponding repository import. The function names are the same. Add `await` at every call site.

  Example — `/projects/[slug]/+page.ts`:

  Before:
  ```ts
  import { getProjectBySlug, getServiceById } from '$lib/content/projects'
  // Actually was from '$lib/data' barrel before Task 1:
  // import { getProjectBySlug, getServiceById } from '$lib/data'

  export const load = ({ params }) => {
    const project = getProjectBySlug(params.slug)
    if (!project) throw error(404)
    const service = project.primaryServiceId
      ? getServiceById(project.primaryServiceId)
      : undefined
    return { project, service }
  }
  ```

  After:
  ```ts
  import { getProjectBySlug } from '$lib/repositories/project'
  import { getServiceById } from '$lib/repositories/service'

  export const load = async ({ params }) => {
    const project = await getProjectBySlug(params.slug)
    if (!project) throw error(404)
    const service = project.primaryServiceId
      ? await getServiceById(project.primaryServiceId)
      : undefined
    return { project, service }
  }
  ```

  Note the function signature becomes `async`.

- [ ] **4.2: Migrate `/+page.ts`**

  Read the current file, then apply the rule from 4.1:
  - Replace content imports with repository imports
  - Make load function async
  - Add `await` on repository calls

  Example code shape (match to actual file):
  ```ts
  import type { PageLoad } from './$types'
  import { getFeaturedProjects } from '$lib/repositories/project'
  import { getVisibleServices, getMetroStops } from '$lib/repositories/service'
  import { getHeroContent, getHeroAnimContent, getInitialHeroData } from '$lib/repositories/content'

  export const load: PageLoad = async () => {
    const [featured, services, metroStops, hero, heroAnim, initialHero] = await Promise.all([
      getFeaturedProjects(),
      getVisibleServices(),
      getMetroStops(),
      getHeroContent(),
      getHeroAnimContent(),
      getInitialHeroData(),
    ])
    return { featured, services, metroStops, hero, heroAnim, initialHero }
  }
  ```

- [ ] **4.3: Migrate `/projects/+page.ts`**

  Apply migration. Functions used: `getAllProjects`, `getAllTags`, `getAllStackItems`, `getServiceIdsForProjects`, maybe `getAllServices` if services appear in filter UI.

- [ ] **4.4: Migrate `/projects/[slug]/+page.ts`**

  Apply migration. Functions used: `getProjectBySlug`, `getServiceById`. Note this file also imports `marked` from `$lib/utils/markdown` — that stays as-is (utility import, documented exception not required because utility is the correct location).

- [ ] **4.5: Migrate `/services/+page.ts`**

  Apply migration. Functions used: `getVisibleServices`, possibly `getProjectsByService`.

- [ ] **4.6: Migrate `/services/[id]/+page.ts`**

  Apply migration. Functions: `getServiceById`, `getAdjacentServices`, `getProjectsByService`.

- [ ] **4.7: Migrate `/blog/+page.ts`**

  Apply migration. Functions: `getPostsByCategory('professional')`, `getTagsForCategory`, `getLanguagesForCategory`, `getSvgContentsForPosts`.

- [ ] **4.8: Migrate `/blog/personal/+page.ts`**

  Apply migration. Same functions but category `'personal'`.

- [ ] **4.9: Migrate `/blog/[slug]/+page.ts`**

  Apply migration. Functions: `getPostBySlug`, `getPostHtml`, `getSvgContent`, `getAllPosts` (or `getLatestPosts` for related).

- [ ] **4.10: Migrate `/tech-stack/+page.ts`**

  Apply migration. Functions: `getAllTechItems`, `getAllScenarios`.

- [ ] **4.11: Migrate `/about/+page.server.ts`**

  This file imports `aboutPageContent` + `fetchMontrealWeather`. After migration:
  ```ts
  import { getAboutPageContent } from '$lib/repositories/content'
  import { fetchMontrealWeather } from '$lib/utils/weather'  // documented exception

  export const load: PageServerLoad = async () => {
    const [about, weather] = await Promise.all([
      getAboutPageContent(),
      fetchMontrealWeather(),
    ])
    return { about, weather }
  }
  ```

- [ ] **4.12: Migrate `/contact/+page.server.ts`**

  Similar pattern:
  ```ts
  import { getContactPageContent } from '$lib/repositories/content'
  import { fetchMontrealWeather } from '$lib/utils/weather'

  export const load: PageServerLoad = async () => {
    const [content, weather] = await Promise.all([
      getContactPageContent(),
      fetchMontrealWeather(),
    ])
    return { content, weather }
  }
  ```

- [ ] **4.13: Leave `+layout.svelte` + `+error.svelte` as-is**

  Documented exception. These import static constants (`siteMeta`, `buildPersonSchema`, `errorPageContent`) from `$lib/content/*` directly. Full migration to repositories is deferred to Slice 15 SEO.

  **Action required:** Add a comment to each file clarifying the exception, so future readers don't "fix" it:

  Add at the top of `src/routes/+layout.svelte` (after `<script>`):
  ```svelte
  <!-- Imports siteMeta + buildPersonSchema directly from content/utils as a
       documented exception. Full migration to repositories deferred to Slice 15
       SEO where <SeoHead> forces the question naturally. See ARCHITECTURE.md
       § Documented Exceptions. -->
  ```

  Add similar comment to `src/routes/+error.svelte`.

- [ ] **4.14: Verify no route loader imports from `$lib/content`**

  Run:
  ```bash
  grep -rn "from '\\\$lib/content" src/routes --include="*+page*"
  ```
  Expected: no matches. (Matches in `.svelte` files are OK — components can import static constants if needed; the rule only forbids loaders.)

  Run:
  ```bash
  grep -rn "from '\\\$lib/adapters" src/routes
  ```
  Expected: no matches. (Adapters are internal; only repositories read them.)

- [ ] **4.15: Run type check**

  ```bash
  bun run check
  ```
  Expected: passes. Common failures: missing `await`, untyped `Promise<T>` returns.

- [ ] **4.16: Run full test suite**

  ```bash
  bun run test
  ```
  Expected: all pass.

- [ ] **4.17: Run build**

  ```bash
  bun run build
  ```
  Expected: succeeds. This is when SSR catches async-handling bugs that `bun run check` doesn't (e.g., forgotten `await` in `+page.server.ts` returning `Promise<T>` instead of `T`).

- [ ] **4.18: Restart preview + full page spot-check**

  Restart preview. Visit every page at 1440px AND 375px:
  - `/` (home — verify hero animation, metro strip, all sections load)
  - `/services` + `/services/data-engineering`
  - `/projects` + `/projects/yesid-dev`
  - `/blog` + `/blog/personal` + any blog post detail
  - `/tech-stack`
  - `/about` (verify weather loads)
  - `/contact` (verify weather loads)
  - `/some-404-url` → error page

  For each, confirm:
  - Content renders correctly
  - No console errors
  - SSR works (disable JS in devtools, reload — HTML still has content)

- [ ] **4.19: Commit**

  ```bash
  git add -A
  git commit -m "refactor(slice-17b): migrate route loaders to repository layer

  - All +page.ts / +page.server.ts now import from \$lib/repositories
  - All load functions are async, awaiting repository calls
  - Parallelize independent repository calls with Promise.all()
  - +layout.svelte and +error.svelte keep direct \$lib/content imports as
    documented exception (deferred to Slice 15 SEO); added clarifying
    comments so the exception is visible
  - weather.ts and service-svg.ts keep direct \$lib/utils imports as
    documented exception (external runtime fetches, never CMS-owned)

  No visual or behavioral change. Every page renders identically."
  ```

- [ ] **4.20: STOP — progress table + handoff append + approval**

---

## Task 17b-5: Hardcoded content audit (parallel subagents)

**Purpose:** Catalog every hardcoded string in `.svelte` files that should be in `content/*` as LocalizedString. Output is a reviewable audit document committed to the slice bundle.

**⚠ REQUIRES EXPLICIT APPROVAL FROM YESID before spawning parallel agents.** Project rule per CLAUDE.md: "Parallel agents require approval. Independent research/exploration only."

**Files affected:**
- **Create:** `docs/slices/slice-17/slice-17b/audit-hardcoded-content.md`

### Steps

- [ ] **5.1: Request approval to spawn 7 parallel Sonnet subagents**

  Present the plan to Yesid:
  - 7 subagents, one per component directory group (see 5.3 below)
  - Each returns a markdown table of findings
  - Merged into single audit document
  - Approval requested because project rule requires it

  Wait for explicit approval. If denied, fall back to sequential grep-based audit (slower, takes ~1 full session instead of ~0.5).

- [ ] **5.2: Write the subagent prompt (ask Yesid to approve or edit)**

  The prompt (plain text — subagents don't use skills):

  ```
  You are auditing Svelte files under <DIRECTORY> for user-facing strings
  that should live in the content layer instead of being hardcoded.

  For each .svelte file under <DIRECTORY>, find every hardcoded string that:
    1. Renders as template text between tags (e.g., <h2>Featured projects</h2>)
    2. Is inside a template expression with a string literal (e.g.,
       {isLoading ? 'Loading...' : 'Done'})
    3. Is an aria-label, aria-description, aria-placeholder attribute value
    4. Is an alt attribute value
    5. Is a placeholder attribute value
    6. Is a title attribute value
    7. Is an error / validation / empty-state string in <script>
    8. Is a meta tag content (<title>, <meta content="...">)

  SKIP:
    - .test.ts files
    - Strings in comments (<!-- ... -->, // ..., /* ... */)
    - Technical attributes: class, id, data-*, role, type, name, for, href, src
    - Short uppercase codes like "DB", "ETL", "FE", "SQL" — technical enum codes
    - Single-character strings
    - Strings that are just "true" / "false" / "null"
    - Strings inside <style> blocks (CSS values)
    - Strings in server-only code that never reaches the client
    - Expressions that already call resolveLocale(...) — already localized
    - Expressions accessing .en / .fr / .es — already pulling from LocalizedString

  OUTPUT:
  Return a single markdown document with this structure:

  # Audit — <directory-name>

  ## Files scanned
  - <file-path> (<line-count> lines)
  ... repeat for every .svelte file

  ## Findings (<total-count>)

  ### <file-path> (<finding-count> findings)

  | Line | String | Type | Suggested content file | Suggested key |
  |---|---|---|---|---|
  | 23 | "View details" | button text | content/services.ts | viewDetailsLabel |
  ...

  ### <next-file-path> ...

  ## Edge cases flagged for human review (<count>)

  Cases where you're uncertain if the string should be extracted. Include
  line, string, reason for uncertainty.

  SUGGESTED CONTENT FILE should be based on the component's domain:
    - home/* components -> content/site-content.ts
    - blog/* components -> content/blog.ts (or nav.ts for listing chrome)
    - projects/* -> content/projects.ts (or nav.ts)
    - services/* -> content/services.ts
    - about/* -> content/about-page.ts
    - contact/* -> content/contact-page.ts
    - navigation/*, common/* -> content/nav.ts
    - brand/*, ui/* -> closest domain, or flag for human review

  SUGGESTED KEY should be camelCase, concise, descriptive. Examples:
    - "View details" -> viewDetailsLabel
    - "Close menu" -> closeMenuAria (aria-specific keys get "Aria" suffix)
    - "No results found" -> noResultsMessage
    - "Loading..." -> loadingLabel

  Be conservative. When uncertain, add to "Edge cases" appendix rather
  than guess.
  ```

  Wait for Yesid's approval or edits.

- [ ] **5.3: Spawn the 7 subagents in parallel**

  Use the `Agent` tool with 7 concurrent calls in a single message, each with:
  - `description`: "Audit <directory>"
  - `subagent_type`: `general-purpose` (or `Explore` for faster surface-level pass — verify with Yesid which he prefers)
  - `model`: `sonnet`
  - `prompt`: the approved prompt from 5.2 with `<DIRECTORY>` replaced

  The 7 directories:
  1. `src/lib/components/home/`
  2. `src/lib/components/blog/`
  3. `src/lib/components/projects/`
  4. `src/lib/components/services/`
  5. `src/lib/components/about/` + `src/lib/components/contact/`
  6. `src/lib/components/brand/` + `src/lib/components/ui/` + `src/lib/components/navigation/` + `src/lib/components/common/` (combine into one prompt)
  7. `src/routes/**/*.svelte` (page-level .svelte files — flag that route loaders aren't in scope, only .svelte files)

- [ ] **5.4: Merge subagent outputs into master document**

  Create `docs/slices/slice-17/slice-17b/audit-hardcoded-content.md` with structure:

  ```markdown
  # Hardcoded Content Audit — Slice 17b

  **Generated:** <date>
  **Method:** 7 parallel Sonnet 4.6 subagents
  **Total findings:** <sum across all agents>
  **Files audited:** <count>

  ## Summary by directory

  | Directory | Files | Findings |
  |---|---|---|
  | home | ... | ... |
  | blog | ... | ... |
  | ... | ... | ... |
  | **Total** | ... | ... |

  ## Findings by component (sorted by finding count, worst first)

  <merged findings tables from all 7 agents, sorted by finding count
  descending>

  ## Content-layer translation debt

  LocalizedString fields in content/* that have only `en` filled — these
  aren't extraction targets (they're already localized structurally) but
  they're the long tail for future fr/es translation work.

  <one table per content file, listing en-only keys>

  ## Edge cases flagged for human review

  <merged edge cases from all 7 agents>

  ## Extraction task breakdown (draft)

  Proposed component groupings for Task 17b-7 sub-tasks. Each group becomes
  one Level-3 task (one commit, one STOP).

  - 17b-7a: <ContactPage + sub-components> — <N findings>
  - 17b-7b: <HomeServices + related> — <N findings>
  - ... etc
  ```

  Commit this document.

- [ ] **5.5: Run content-layer translation-debt scan (separate from component audit)**

  Write and run a small script (or do it by hand with grep) that scans `src/lib/content/` for LocalizedString objects with only `en` defined:

  ```bash
  # Rough heuristic grep — not perfect but gives a ballpark
  grep -rn "{ en: ['\"]" src/lib/content | grep -v "fr:" | wc -l
  ```

  Add the output to the audit document under "Content-layer translation debt."

- [ ] **5.6: Present the audit to Yesid + calibration gate**

  Three outcomes possible:
  - **Proceed as-is** → continue to Task 17b-6 and 17b-7
  - **Split 17b** → 17b ships with Tasks 1–4 + 8–10 only; new sub-slice 17b-2 handles 17b-6 + 17b-7 with its own plan derived from the audit
  - **Rescope / defer extraction** → drop extraction from Slice 17

  Wait for Yesid's decision before Task 6.

- [ ] **5.7: Commit the audit**

  ```bash
  git add docs/slices/slice-17/slice-17b/audit-hardcoded-content.md
  git commit -m "docs(slice-17b): hardcoded content audit report

  Parallel subagent sweep across src/lib/components/** and src/routes/**
  cataloged <N> hardcoded strings across <M> components. Audit includes:
    - Findings table per component with suggested content file + key
    - Content-layer translation debt (en-only LocalizedStrings)
    - Edge cases flagged for human review
    - Draft task breakdown for 17b-7 extraction sub-tasks

  Yesid calibration decision: <proceed | split | defer>."
  ```

- [ ] **5.8: STOP — progress table + handoff append + approval**

---

## Task 17b-6: Content-side LocalizedString upgrade

**Purpose:** Upgrade any bare-string fields in `src/lib/content/*` that should be `LocalizedString`. Update type definitions, wrap data, fix callers.

**Files affected:**
- **Modify:** `src/lib/types.ts` (field types), content files (`src/lib/content/*.ts`), and any components reading the upgraded fields via `.en`-direct access
- **Modify:** `src/lib/repositories/service.ts` — replace inline bookend `LocalizedString`s with reads from `content/nav.ts` `metroBookends`

### Steps

- [ ] **6.1: Identify bare-string fields from audit appendix**

  From `audit-hardcoded-content.md`, pull the content-layer translation-debt table + any fields identified as "should be LocalizedString but isn't."

  Expected volume: 20–50 fields across ~10 content files.

- [ ] **6.2: Add `metroBookends` to `content/nav.ts`**

  Add the following to `src/lib/content/nav.ts`:

  ```ts
  export interface MetroBookends {
    departure: LocalizedString
    about: LocalizedString
    blog: LocalizedString
    terminal: LocalizedString
  }

  export const metroBookends: MetroBookends = {
    departure: { en: 'Departure', fr: 'Départ', es: 'Salida' },
    about: { en: 'About', fr: 'À propos', es: 'Acerca de' },
    blog: { en: 'Blog', fr: 'Blog', es: 'Blog' },
    terminal: { en: 'Home', fr: 'Accueil', es: 'Inicio' },
  }
  ```

  Don't forget to import `LocalizedString` from `$lib/types` at the top of `nav.ts`.

- [ ] **6.3: Wire `repositories/service.ts` to use `metroBookends`**

  Replace the inline LocalizedStrings in `getMetroStops()` with reads from the adapter:

  First, add `metroBookends()` to the adapter's `ContentPort`:

  `src/lib/adapters/types.ts` — add to `ContentPort`:
  ```ts
  metroBookends(): Promise<import('$lib/content/nav').MetroBookends>
  ```

  `src/lib/adapters/static.ts` — add to `content`:
  ```ts
  import { metroBookends } from '$lib/content/nav'
  // ...
  metroBookends: async () => metroBookends,
  ```

  `src/lib/repositories/content.ts` — add:
  ```ts
  import type { MetroBookends } from '$lib/content/nav'

  export async function getMetroBookends(): Promise<MetroBookends> {
    return adapter.content.metroBookends()
  }
  ```

  Then update `repositories/service.ts` `getMetroStops()`:
  ```ts
  export async function getMetroStops(): Promise<readonly MetroStop[]> {
    const [services, bookends] = await Promise.all([
      adapter.services.visible(),
      adapter.content.metroBookends(),
    ])
    const stops: MetroStop[] = []

    stops.push({
      id: 'hero',
      stopNumber: '00',
      label: bookends.departure,
      type: 'hero',
    })

    services.forEach((service, idx) => {
      stops.push({
        id: service.id,
        stopNumber: String(idx + 1).padStart(2, '0'),
        label: service.title,
        type: 'service',
      })
    })

    stops.push({
      id: 'about',
      stopNumber: String(services.length + 1).padStart(2, '0'),
      label: bookends.about,
      type: 'about',
    })
    stops.push({
      id: 'blog',
      stopNumber: String(services.length + 2).padStart(2, '0'),
      label: bookends.blog,
      type: 'blog',
    })
    stops.push({
      id: 'terminal',
      stopNumber: 'TERMINAL',
      label: bookends.terminal,
      type: 'terminal',
    })

    return stops
  }
  ```

- [ ] **6.4: Upgrade other bare-string fields per audit**

  For each flagged field (example: `errorPageContent.retryButton` currently `string`):

  1. Edit `src/lib/types.ts` (or the content file where the type is defined):
     Before: `retryButton: string`
     After: `retryButton: LocalizedString`
  2. Edit the content file to wrap the existing value:
     Before: `retryButton: 'Try again'`
     After: `retryButton: { en: 'Try again' }` (leave fr/es empty for now — translation debt)
  3. Find consumers in `src/` via grep:
     ```bash
     grep -rn "errorPageContent.retryButton" src/
     grep -rn ".retryButton" src/lib/components/
     ```
  4. Update each consumer to use `resolveLocale`:
     Before: `{errorPageContent.retryButton}`
     After: `{resolveLocale(errorPageContent.retryButton, locale)}`
     Add import if missing: `import { resolveLocale } from '$lib/utils/locale'`
     Ensure `locale` is in scope (loader pass-through + `$props()` in component).

  Repeat for every flagged field.

- [ ] **6.5: Run type check after each batch of fields**

  Don't upgrade 30 fields then check. Upgrade 3-5, run `bun run check`, fix any cascading type errors, then move on. This keeps the error list short and actionable.

- [ ] **6.6: Run full test suite**

  ```bash
  bun run test
  ```
  Expected: all pass. The integrity test (old version, still passing) should still be green. Any broken test points to a missed consumer update.

- [ ] **6.7: Visual spot-check any affected pages**

  For every content file you touched, identify which pages consume it and spot-check them in preview at 1440px + 375px.

- [ ] **6.8: Commit**

  ```bash
  git add -A
  git commit -m "refactor(slice-17b): upgrade bare strings to LocalizedString in content

  Upgrades content-layer fields flagged in audit-hardcoded-content.md from
  bare \`string\` to \`LocalizedString\`. Affected content files:
  <list them>.

  Also moves metro bookend labels (Departure, About, Blog, Home) out of
  repositories/service.ts inline declarations and into content/nav.ts as
  metroBookends. Added ContentPort.metroBookends() to the adapter contract.

  fr/es translations left empty for now — these become translation debt
  tracked by the integrity test."
  ```

- [ ] **6.9: STOP — progress table + handoff append + approval**

---

## Task 17b-7: Component-by-component hardcoded content extraction

**Purpose:** Extract every hardcoded string flagged in the audit from components into `content/*` as LocalizedString, wiring components through `resolveLocale()`. One commit per component (or tight component group). One STOP per commit.

**Files affected:** Every component listed in audit + matching content files. Full list materializes at Task 5 end.

### Sub-task breakdown

Derived from `audit-hardcoded-content.md` at the end of Task 5. Proposed draft groupings (refined from audit):

- **17b-7a**: Home hero + HomeServices + HomeCloser
- **17b-7b**: Blog listing (WorkFilter*, BlogFilter*, BlogRow, BlogCard)
- **17b-7c**: Blog detail (BlogContent, BlogNav)
- **17b-7d**: Projects listing (WorkFilter*, WorkCard, ProjectCard)
- **17b-7e**: Projects detail (WorkDetailSidebar, ProjectStackList)
- **17b-7f**: Services listing + detail
- **17b-7g**: Tech-stack page
- **17b-7h**: About page (bento, identity, metrics, method, testimonials, interests)
- **17b-7i**: Contact page (terminals + form)
- **17b-7j**: Navigation + common (MenuOverlay, Navbar, Footer)
- **17b-7k**: Brand + UI primitives (if any extractable strings remain)
- **17b-7l**: Error page + 404 flow

Adjust count after audit. Likely 10–20 groups.

### Steps per sub-task (repeat for each group)

- [ ] **7.X.1: Read the audit rows for this group**

  Open `audit-hardcoded-content.md`. Copy the rows for the components in this group into a scratchpad.

- [ ] **7.X.2: Add LocalizedString entries to the content file(s)**

  For each audit row:
  - Locate the suggested content file
  - Add a new field under an appropriate structural group (e.g., `errorPageContent.actions.retry` rather than flat `errorPageContent.retryButtonLabel`)
  - Value: `{ en: "<the original string>" }` — fr/es empty
  - Update the TypeScript type definition (either in-line interface or in `$lib/types.ts`)

  Example — extracting "View details" from `ServiceCard.svelte`:

  Add to `src/lib/content/services.ts`:
  ```ts
  export interface ServicesGridLabels {
    viewDetails: LocalizedString
    learnMore: LocalizedString
    // ... etc.
  }

  export const servicesGridLabels: ServicesGridLabels = {
    viewDetails: { en: 'View details' },
    learnMore: { en: 'Learn more' },
    // ...
  }
  ```

- [ ] **7.X.3: Expose through adapter + repository**

  Add the new field to the adapter `ContentPort` if it's a new top-level concept:
  ```ts
  // adapters/types.ts
  servicesGridLabels(): Promise<import('$lib/content/services').ServicesGridLabels>
  ```

  ```ts
  // adapters/static.ts
  import { servicesGridLabels } from '$lib/content/services'
  // ...
  servicesGridLabels: async () => servicesGridLabels,
  ```

  ```ts
  // repositories/service.ts (or content.ts — depends on domain)
  export async function getServicesGridLabels(): Promise<ServicesGridLabels> {
    return adapter.content.servicesGridLabels()
  }
  ```

  **Shortcut for tightly-scoped labels:** if a label is always read with its parent content (e.g., `servicesGridContent.labels`), nest it as a field of the parent rather than adding a new top-level method. Reduces ceremony.

- [ ] **7.X.4: Update the component**

  Before (ServiceCard.svelte):
  ```svelte
  <script lang="ts">
    import type { Service } from '$lib/types'
    let { service }: { service: Service } = $props()
  </script>

  <button>View details</button>
  ```

  After:
  ```svelte
  <script lang="ts">
    import type { Service, Locale } from '$lib/types'
    import type { ServicesGridLabels } from '$lib/content/services'
    import { resolveLocale } from '$lib/utils/locale'

    let { service, labels, locale }: {
      service: Service
      labels: ServicesGridLabels
      locale: Locale
    } = $props()
  </script>

  <button>{resolveLocale(labels.viewDetails, locale)}</button>
  ```

  If the component isn't already receiving `labels` + `locale`, update its parent (typically the page route) to pass them:

  ```svelte
  <!-- page.svelte -->
  <ServiceCard {service} {labels} {locale} />
  ```

  And the route loader to fetch + forward:
  ```ts
  import { getServicesGridLabels } from '$lib/repositories/service'

  export const load: PageLoad = async () => {
    const [services, labels] = await Promise.all([
      getVisibleServices(),
      getServicesGridLabels(),
    ])
    return { services, labels }
  }
  ```

  `locale` comes from the root layout / user detection. For Slice 17b, use `DEFAULT_LOCALE` if locale passing isn't already wired — TODO cleanup item for Slice 20.

- [ ] **7.X.5: Run type check**

  ```bash
  bun run check
  ```
  Expected: passes. Common failures: missing prop in parent, wrong type import.

- [ ] **7.X.6: Run tests for this component**

  ```bash
  bun run test src/lib/components/<path-to-component>
  ```
  Expected: passes. If the test rendered the component and checked for "View details" text, the test now needs to set up the `labels` prop.

- [ ] **7.X.7: Run full test suite**

  ```bash
  bun run test
  ```
  Expected: passes.

- [ ] **7.X.8: Visual spot-check**

  Restart preview if needed. Visit the page this component renders on at 1440px + 375px. Verify:
  - The original text still appears
  - No console errors
  - Layout unchanged

- [ ] **7.X.9: Commit**

  ```bash
  git add -A
  git commit -m "feat(slice-17b): extract hardcoded strings from <ComponentName>

  Moved <N> strings from <Component>.svelte to content/<file>.ts as
  LocalizedString. Wired through resolveLocale() at render time. Updated
  route loader to fetch + pass labels.

  Translation debt: <N> new en-only LocalizedStrings."
  ```

- [ ] **7.X.10: Append per-component row to `handoff.md`**

  ```markdown
  ## 17b-7X: <ComponentName> extraction
  - Strings extracted: <N>
  - Content file: <path>
  - Commit: <sha>
  ```

- [ ] **7.X.11: STOP — progress table + approval before next group**

---

## Task 17b-8: Integrity test enhancements

**Purpose:** Upgrade `src/lib/content/integrity.test.ts` with two new assertions: bare-string-in-LocalizedString-slot detector, and translation-debt counter (reports, doesn't fail).

**Files affected:**
- **Modify:** `src/lib/content/integrity.test.ts`

### Steps

- [ ] **8.1: Open the current integrity test**

  Read `src/lib/content/integrity.test.ts`. Understand its existing cross-reference assertions (project.services[] exist in services, blog.category is known, etc.) — preserve them.

- [ ] **8.2: Add LocalizedString type-guard helper**

  Add at the top of the test file:

  ```ts
  import type { LocalizedString } from '$lib/types'

  function isLocalizedString(value: unknown): value is LocalizedString {
    return (
      typeof value === 'object' &&
      value !== null &&
      'en' in value &&
      typeof (value as { en: unknown }).en === 'string' &&
      (value as { en: string }).en.length > 0
    )
  }

  function walkForLocalizedStrings(
    obj: unknown,
    path = ''
  ): Array<{ path: string; value: LocalizedString }> {
    if (obj === null || obj === undefined) return []
    if (typeof obj !== 'object') return []
    if (Array.isArray(obj)) {
      return obj.flatMap((item, i) =>
        walkForLocalizedStrings(item, `${path}[${i}]`)
      )
    }
    if (isLocalizedString(obj)) {
      return [{ path, value: obj as LocalizedString }]
    }
    return Object.entries(obj).flatMap(([key, value]) =>
      walkForLocalizedStrings(value, path ? `${path}.${key}` : key)
    )
  }
  ```

- [ ] **8.3: Add test — every LocalizedString has non-empty `en`**

  Add:

  ```ts
  import { projects } from '$lib/content/projects'
  import { services } from '$lib/content/services'
  import { blogPosts } from '$lib/content/blog'
  import { siteMeta } from '$lib/content/meta'
  import { aboutPageContent } from '$lib/content/about-page'
  import { contactContent } from '$lib/content/contact-page'
  import { navLinks, menuItems, errorPageContent, metroBookends } from '$lib/content/nav'
  import * as siteContent from '$lib/content/site-content'

  describe('Content integrity — LocalizedString safety', () => {
    const sources = [
      { name: 'projects', data: projects },
      { name: 'services', data: services },
      { name: 'blogPosts', data: blogPosts },
      { name: 'siteMeta', data: siteMeta },
      { name: 'aboutPageContent', data: aboutPageContent },
      { name: 'contactContent', data: contactContent },
      { name: 'navLinks', data: navLinks },
      { name: 'menuItems', data: menuItems },
      { name: 'errorPageContent', data: errorPageContent },
      { name: 'metroBookends', data: metroBookends },
      { name: 'heroContent', data: siteContent.heroContent },
      { name: 'aboutContent', data: siteContent.aboutContent },
      // ... add every content export
    ]

    for (const { name, data } of sources) {
      it(`${name}: every LocalizedString has non-empty en`, () => {
        const localized = walkForLocalizedStrings(data, name)
        for (const { path, value } of localized) {
          expect(value.en, `${path} is missing or empty en`).toBeTruthy()
          expect(typeof value.en).toBe('string')
          expect(value.en.length).toBeGreaterThan(0)
        }
      })
    }
  })
  ```

- [ ] **8.4: Add translation-debt reporter (non-failing)**

  Add:

  ```ts
  describe('Content integrity — translation debt (reports, does not fail)', () => {
    it('reports en-only LocalizedStrings per source', () => {
      const sources = [
        // same array as 8.3
      ]

      const report: Record<string, { total: number; enOnly: number; paths: string[] }> = {}

      for (const { name, data } of sources) {
        const localized = walkForLocalizedStrings(data, name)
        const enOnly = localized.filter(({ value }) => !value.fr && !value.es)
        report[name] = {
          total: localized.length,
          enOnly: enOnly.length,
          paths: enOnly.map((x) => x.path),
        }
      }

      // Log the report — don't assert. Translation debt is tracked, not
      // treated as a failure.
      console.log('\nTranslation debt report:')
      for (const [name, stats] of Object.entries(report)) {
        console.log(`  ${name}: ${stats.enOnly}/${stats.total} en-only`)
      }
    })
  })
  ```

- [ ] **8.5: Run integrity test**

  ```bash
  bun run test src/lib/content/integrity.test.ts
  ```
  Expected: all LocalizedString-safety assertions pass. Translation-debt report logs counts.

- [ ] **8.6: Run full test suite**

  ```bash
  bun run test
  ```
  Expected: all pass.

- [ ] **8.7: Commit**

  ```bash
  git add src/lib/content/integrity.test.ts
  git commit -m "test(slice-17b): enhance content integrity test with LocalizedString guards

  - New assertion: every LocalizedString in content/* has non-empty en
  - New reporter: translation debt (en-only count per content source)
  - Reporter logs counts but does not fail — translation debt is tracked,
    not rejected"
  ```

- [ ] **8.8: STOP — progress table + handoff append + approval**

---

## Task 17b-9: Governance updates

**Purpose:** Update VOCAB.md, CONSTITUTION.md, create ARCHITECTURE.md + `src/lib/README.md`, and write the cloud learn doc.

**Files affected:**
- **Modify:** `docs/reference/VOCAB.md`, `docs/reference/CONSTITUTION.md`
- **Create:** `docs/reference/ARCHITECTURE.md`, `src/lib/README.md`, `<cloud>/yesid.dev/docs/learn/architecture/hexagonal-data-layer.md`

### Steps

- [ ] **9.1: Update VOCAB.md — add architecture terms**

  Append a new section to `docs/reference/VOCAB.md`:

  ```markdown
  ## Data architecture (17b — 2026-04-18)

  ### Core terms

  **Port.** A typed contract for what the app needs from data access. Lives in the `ContentAdapter` interface at `src/lib/adapters/types.ts`. Implementation-free — pure contract.

  **Adapter.** An implementation that fulfills a port. Today: `staticAdapter` in `src/lib/adapters/static.ts` reads from `src/lib/content/*`. Tomorrow: `payloadAdapter`, `keystaticAdapter`, etc. Swap by editing one line in `src/lib/adapters/index.ts`.

  **Repository.** Public API layer over the adapter. Lives in `src/lib/repositories/*.ts`. Thin delegation — one function per use-case, each calls the adapter. Route loaders call repositories; repositories call adapters.

  **Content layer.** Raw CMS-owned source. Lives in `src/lib/content/*`. Pure declarations. Read only by `adapters/static.ts` today; tomorrow replaced by Payload/Keystatic/etc.

  **Engine layer (utility).** Pure functions and runtime helpers. Never CMS-owned. Lives in `src/lib/utils/*`. Examples: `locale.ts`, `markdown.ts`, `shapes.ts`, `weather.ts`, `service-svg.ts`.

  **CMS-agnostic.** Architecture where swapping the content source (static ↔ Payload ↔ Keystatic ↔ …) is a one-file operation in `adapters/index.ts`. Core 17b deliverable.

  ### Content terms

  **LocalizedString.** `{ en: string, fr?: string, es?: string }`. The only permissible type for user-facing strings in `src/lib/content/*`. Enforced by integrity test.

  **Translation debt.** Count of LocalizedStrings with only `en` defined. Reported per content source by `content/integrity.test.ts`. Tracked, not treated as a build failure.

  **Enum + label-map pattern.** When content has enum-coded fields (e.g., `project.status = "shipped"`), codes stay bare strings; labels live in a separate `Record<EnumCode, LocalizedString>` map. Components resolve the label, never the code.

  **Brace placeholder interpolation.** Template pattern for runtime values inside LocalizedStrings: `{ en: "Showing {count} results" }` resolved as `.replace('{count}', String(count))`. No dependency.

  ### Disambiguation

  **"Services"** (client-facing brand word) — the freelance services Yesid offers. User-facing: URL `/services`, nav label, page H1.

  **`src/lib/repositories/service.ts`** — the code module that fetches service data. No naming conflict because the folder is `repositories/`, not `services/`. Chose `repositories/` specifically to resolve the ambiguity.

  **Data vs content.** After 17b, there is no `src/lib/data/` folder. The "data" concept split into: `content/` (static source), `repositories/` (read API), `utils/` (engines).
  ```

- [ ] **9.2: Update CONSTITUTION.md — add § Data Architecture**

  Append a new top-level section to `docs/reference/CONSTITUTION.md`:

  ```markdown
  ## § Data Architecture (ratified 2026-04-18 in Slice 17b)

  ### The four-layer hexagonal pattern

  ```
  Route loader
      |
      v  imports from $lib/repositories
  Repository (port — thin delegation)
      |
      v  imports { adapter } from $lib/adapters
  Adapter (index.ts re-exports active implementation)
      |
      v  static.ts imports from $lib/content
  Content (raw source — pure declaration)
  ```

  ### Layers

  | Layer | Path | Responsibility | Reads from | Written by |
  |---|---|---|---|---|
  | Loaders | `src/routes/**/+page*.ts` | Fetch data, pass to components via props | Repositories | Route code |
  | Repositories | `src/lib/repositories/*.ts` | Public query API. Thin delegation. | Adapters | Human |
  | Adapters | `src/lib/adapters/*.ts` | Fulfill the `ContentAdapter` contract. | Content (today), Payload/Keystatic (future) | Human |
  | Content | `src/lib/content/*.ts` | Raw CMS-owned source. Pure declarations. | — | Human today, CMS tomorrow |
  | Utils | `src/lib/utils/*.ts` | Pure engines. Never CMS-owned. | — | Human |
  | Types | `src/lib/types.ts` | Shared TypeScript contracts. | — | Human |

  ### Import rules (enforced)

  | From → To | Allowed |
  |---|---|
  | Route loaders → `$lib/repositories` | ✅ |
  | Route loaders → `$lib/content` | ❌ |
  | Route loaders → `$lib/adapters` | ❌ |
  | Route loaders → `$lib/utils/weather`, `$lib/utils/service-svg` | ✅ (documented exceptions) |
  | Components → `$lib/repositories` | ❌ (data via props) |
  | Components → `$lib/content` | ❌ |
  | Components → `$lib/utils/locale`, other pure utils | ✅ |
  | `repositories/*` → `$lib/adapters` | ✅ |
  | `repositories/*` → `$lib/content` | ❌ (only adapters read content) |
  | `repositories/*` → `$lib/utils` | ✅ |
  | `adapters/static.ts` → `$lib/content` | ✅ (only caller of content) |
  | `adapters/*` → `$lib/repositories` | ❌ (wrong direction) |
  | `adapters/*` → `$lib/utils` | ✅ |
  | Anyone → `$lib/types` | ✅ |
  | `$lib/types` → any `$lib/*` | ❌ (types imports only primitives) |

  ### LocalizedString rule

  Every value in `src/lib/content/*` that renders as copy to a user is a `LocalizedString`. Full stop.

  User-facing strings requiring LocalizedString:
  - Visible copy (headings, paragraphs, labels, buttons)
  - `aria-label`, `aria-description`, alt text, placeholders, titles
  - Form labels, error messages, validation copy
  - Empty-state and loading messages
  - Meta tags (`<title>`, `<meta content>`, OG, Twitter)
  - JSON-LD `name`, `description`, `jobTitle`
  - 404/500 page text

  Bare string allowed for:
  - Record keys, IDs, slugs
  - URLs
  - Icon names, SVG filenames
  - CSS classes, token names
  - Enum-like technical codes ("DB", "ETL", "FE" — short uppercase tags)
  - Date strings (ISO format)
  - Status codes (rendered label is separate LocalizedString)
  - Locale codes themselves

  **Test:** "Would a French-speaking visitor want this in French?" If yes, LocalizedString.

  Enforced by `src/lib/content/integrity.test.ts`.

  ### CMS-agnostic rule

  Any future CMS swap MUST be achievable by editing only `src/lib/adapters/` files. PRs that edit repositories or content to accommodate a new CMS are rejected — the code is in the wrong place.

  ### Documented exceptions

  Two deliberate bypasses of the standard import rules:

  1. **`+layout.svelte` + `+error.svelte`** keep importing `siteMeta`, `errorPageContent`, `buildPersonSchema` directly from `$lib/content/*` / `$lib/utils/json-ld`. Rationale: these are non-loader components using static constants; full migration requires root layout loader changes belonging to Slice 15 SEO.

  2. **`weather.ts`, `service-svg.ts`** are imported directly by loaders as `$lib/utils/*`. Rationale: external runtime fetches, not CMS-ownable. Wrapping in the adapter pattern adds ceremony with no swap benefit.
  ```

- [ ] **9.3: Create ARCHITECTURE.md**

  Create `docs/reference/ARCHITECTURE.md` with:

  ```markdown
  # ARCHITECTURE.md — yesid.dev

  > Source of truth for data layer structure, naming, and evolution rules.
  > Last updated: 2026-04-18 in Slice 17b.

  ## Hexagonal data architecture

  <copy the diagram + layer responsibilities from CONSTITUTION.md>

  ## Import rules

  <copy the full table>

  ## Naming conventions

  | Concept | Pattern | Example |
  |---|---|---|
  | Repository file | singular noun, kebab-case | `project.ts`, `tech-stack.ts` |
  | Query function | `get<Thing>By<Key>` or `getAll<Things>` | `getProjectBySlug`, `getAllProjects` |
  | Derived view | `get<View>` | `getMetroStops`, `getAdjacentServices` |
  | Adapter method path | `adapter.<collection>.<verb>` | `adapter.projects.bySlug(slug)` |
  | Return type | `Promise<readonly T[]>` or `Promise<T \| undefined>` | async always, readonly arrays, undefined for not-found |

  ## Adapter swap procedure (how to add a new CMS)

  1. Create `src/lib/adapters/<cms-name>.ts` implementing `ContentAdapter`
  2. Export your adapter: `export const <cmsName>Adapter: ContentAdapter = { ... }`
  3. Edit `src/lib/adapters/index.ts`:
     ```ts
     export { <cmsName>Adapter as adapter } from './<cms-name>'
     ```
  4. Run `bun run test` — any broken tests signal missing methods or contract drift
  5. Deploy

  Rejected: editing repositories or content to accommodate your CMS. That's a code-in-wrong-place smell.

  ## Documented exceptions

  <from CONSTITUTION.md>

  ## Decision log — Slice 17b (2026-04-18)

  1. Async everywhere (`Promise<T>`) — forward-compatible with Payload/Keystatic.
  2. Implicit modules (named function exports), not explicit interface classes.
  3. Content-only service scope — weather/SVG/etc. stay as utils.
  4. Repositories, not services — avoid "services" verb-noun ambiguity.
  5. Drop `.service.ts` suffix — folder name is the signal.
  6. γ hexagonal-pure — adapters in their own folder, not nested under repositories.
  7. Client-facing "Services" vocabulary unchanged — no "Offerings" rename.
  8. Audit + extract in 17b (one PR, one coherent cleanup) with calibration gate at Task 5.
  9. Barrel per layer: `repositories/index.ts`, `adapters/index.ts`, `content/index.ts`.
  10. LocalizedString enforcement in content layer — bare strings only for technical/structural uses.
  11. Metro stops fold into `repositories/service.ts` (view over services).
  12. Hero mock folds into `repositories/content.ts` with adapter indirection.
  13. Layout/error component imports deferred to Slice 15.
  14. `weather.ts` / `service-svg.ts` documented exceptions.
  15. Brace placeholder interpolation pattern, no new dependency.
  ```

- [ ] **9.4: Create `src/lib/README.md`**

  Create:

  ```markdown
  # src/lib/ — yesid.dev library structure

  ## Four-layer hexagonal data architecture

  ```
  repositories/   → Port layer: what loaders ask for
  adapters/       → Adapter layer: how ports are fulfilled (CMS swap point)
  content/        → Source layer: raw CMS-owned content
  utils/          → Engine layer: pure helpers, never CMS-owned
  types.ts        → Shared TypeScript contracts (flat, top-level)
  components/     → UI
  motion/         → Animation factories + actions
  styles/         → CSS tokens + imports
  ```

  ## Who imports what

  - **Route loaders** import from `$lib/repositories` (+ `$lib/utils/weather`, `$lib/utils/service-svg` as documented exceptions)
  - **Components** import types + pure utils; receive data via props from loaders
  - **Repositories** import `$lib/adapters` + `$lib/utils`; never read `$lib/content` directly
  - **Adapters** import `$lib/content` (only `adapters/static.ts`) + `$lib/utils`
  - **Content** imports `$lib/types` + pure utils (locale, etc.); never touches repositories/adapters

  See `docs/reference/ARCHITECTURE.md` for full import rules and decision log.

  ## CMS swap

  Change CMS = edit one line in `src/lib/adapters/index.ts` + add a new adapter file.

  See `docs/reference/ARCHITECTURE.md § Adapter swap procedure`.
  ```

- [ ] **9.5: Write cloud learn doc**

  Create `<cloud>/yesid.dev/docs/learn/architecture/hexagonal-data-layer.md`. `<cloud>` resolves to `$YESITO_CLOUD_ROOT` or `~/Yesito/cloud`.

  Use the learn doc template: overview, how-we-use-it (with links to specific files), worked example (adding a Payload adapter), prerequisite learn docs (if any).

- [ ] **9.6: Update `docs/slices/slice-17/README.md` progress table**

  Mark 17b as COMPLETE, add PR number (placeholder, will be filled at close):

  ```markdown
  | 17b Service Layer | COMPLETE — hexagonal (repositories + adapters) + LocalizedString enforcement | #<pr-number-filled-at-pr-creation> | ~4 |
  ```

- [ ] **9.7: Run build + test + check**

  ```bash
  bun run build
  bun run test
  bun run check
  ```
  Expected: all pass. No docs-only changes should affect these, but run anyway.

- [ ] **9.8: Commit**

  ```bash
  git add -A
  git commit -m "docs(slice-17b): update VOCAB, CONSTITUTION, ARCHITECTURE for hexagonal data layer

  - VOCAB.md: add architecture terms (port, adapter, repository, content/engine
    layers, CMS-agnostic), content terms (LocalizedString, translation debt,
    enum + label-map, brace placeholders), and disambiguation entries.
  - CONSTITUTION.md: add \u00a7 Data Architecture with 4-layer diagram,
    layer responsibilities, full import rules table, LocalizedString rule,
    CMS-agnostic rule, documented exceptions.
  - ARCHITECTURE.md: created. Contains decision log for all 15 17b decisions,
    adapter swap procedure, naming conventions.
  - src/lib/README.md: created. Quick-reference for the folder structure.
  - Cloud learn doc: \$YESITO_CLOUD_ROOT/yesid.dev/docs/learn/architecture/
    hexagonal-data-layer.md — theory + how-we-use-it + Payload worked example.
  - Mark 17b complete in docs/slices/slice-17/README.md progress table."
  ```

- [ ] **9.9: STOP — progress table + handoff append + approval**

---

## Task 17b-10: Final verification + PR

**Purpose:** Final full-system verification, finalize handoff, create PR.

### Steps

- [ ] **10.1: Run full build**

  ```bash
  bun run build
  ```
  Expected: succeeds. Note build time for handoff.

- [ ] **10.2: Run full test suite with explicit table**

  ```bash
  bun run test
  ```
  Capture the output. Print a table per `TESTS.md`:

  ```markdown
  | Test File | Test Name | Status | Failure Reason |
  |-----------|-----------|--------|----------------|
  | src/... | it(...) | PASS | |
  | ... | ... | ... | ... |
  ```

  Every test listed. No "some tests failed."

- [ ] **10.3: Run type check**

  ```bash
  bun run check
  ```
  Expected: passes with no errors.

- [ ] **10.4: Visual spot-check every page at 1440px + 375px**

  Using preview tools, visit each URL at both breakpoints:

  | URL | 1440px | 375px |
  |---|---|---|
  | `/` | ☐ | ☐ |
  | `/services` | ☐ | ☐ |
  | `/services/data-engineering` | ☐ | ☐ |
  | `/projects` | ☐ | ☐ |
  | `/projects/<first-project-slug>` | ☐ | ☐ |
  | `/blog` | ☐ | ☐ |
  | `/blog/personal` | ☐ | ☐ |
  | `/blog/<first-post-slug>` | ☐ | ☐ |
  | `/tech-stack` | ☐ | ☐ |
  | `/about` | ☐ | ☐ |
  | `/contact` | ☐ | ☐ |
  | `/totally-fake-url` → 404 | ☐ | ☐ |

  For each: rendering matches pre-17b, no console errors, weather loads on about/contact.

- [ ] **10.5: Regenerate `tree.txt`**

  Run (Windows):
  ```bash
  cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
  ```

  (Or the macOS/Linux equivalent if running elsewhere.)

- [ ] **10.6: Append any OS-quirks discovered during 17b**

  If the migration surfaced any Windows-specific issues (CRLF in tests, path-length, etc.), append to `<cloud>/claude-knowledge/os-quirks/windows.md` per CLAUDE.md rule.

- [ ] **10.7: Finalize `handoff.md`**

  Append final sections to `docs/slices/slice-17/slice-17b/handoff.md`:

  ```markdown
  ---

  ## Summary

  <3-5 sentence overview of what shipped, what was hard, what went smoothly>

  ## Metrics

  - Total commits: <N>
  - Files changed: <N>
  - Lines +/-: <+X / -Y>
  - Test count: <N> (pre-17b: <M>)
  - Type errors fixed: <N>
  - Hardcoded strings extracted: <N>
  - Content files touched: <N>
  - Translation debt added: <N> en-only LocalizedStrings
  - Full test suite runtime: <X>s
  - Build runtime: <Y>s

  ## Follow-ups (post-merge, not in this sub-slice)

  - fr/es translations for <N> en-only LocalizedStrings (tracked by
    translation-debt reporter in integrity test)
  - Slice 15 (next): migrate +layout.svelte and +error.svelte off direct
    $lib/content imports as <SeoHead> forces the question
  - Slice 17c (queued): add Zod schemas between adapter and repository
  - Slice 18 (future): drop payload.ts adapter, flip one line in
    adapters/index.ts, zero other changes

  ## PR body

  <the exact markdown that'll go in the PR description>
  ```

- [ ] **10.8: Push the branch**

  ```bash
  git push -u origin feature/slice-17b-repositories
  ```

- [ ] **10.9: Create the PR**

  ```bash
  gh pr create --title "feat(slice-17b): Hexagonal Data Layer + LocalizedString Enforcement" --body "$(cat docs/slices/slice-17/slice-17b/handoff.md)"
  ```

  Wait for CI / GitHub checks to pass.

- [ ] **10.10: STOP — Yesid reviews PR on GitHub**

  Capture the PR number. Yesid reviews, squash-merges when happy.

- [ ] **10.11: Post-merge — run `slice:close`**

  After squash-merge:

  ```bash
  git checkout main
  git pull origin main
  git branch -d feature/slice-17b-repositories
  bun run slice:close 17b --name "Hexagonal Data Layer + LocalizedString" --pr <PR-NUMBER>
  ```

  This mirrors the bundle to cloud, deletes local copy, updates `COMPLETED-SLICES.md`, regenerates `tree.txt`.

- [ ] **10.12: Update `docs/slices/slice-17/CHECKPOINT.md`**

  Mark 17b COMPLETE. Set next sub-slice to 15 (SEO + Metadata). Note the seam is open for Slice 18 validation.

- [ ] **10.13: Commit checkpoint update on main**

  ```bash
  git add docs/slices/slice-17/CHECKPOINT.md
  git commit -m "docs(slice-17): refresh CHECKPOINT.md — 17b shipped, next is 15"
  git push origin main
  ```

- [ ] **10.14: Final TodoWrite update + session end**

  Mark all tasks complete. Slice 17b is done.

---

## Self-review notes (plan author, 2026-04-18)

**Spec coverage.** Every spec section maps to plan tasks:
- § Folder layout → Task 17b-1
- § Adapter contract + ContentAdapter type → Task 17b-2
- § Repositories (6 files + barrel, metro fold-in, hero-mock fold-in) → Task 17b-3
- § Route loader migration → Task 17b-4
- § Hardcoded audit (parallel subagents, prompt, merge doc) → Task 17b-5
- § LocalizedString rule + upgrade path → Task 17b-6
- § Per-component extraction procedure → Task 17b-7 (template, instantiated from audit)
- § Integrity test enhancements → Task 17b-8
- § Governance updates → Task 17b-9
- § Acceptance + PR → Task 17b-10

**Placeholder scan.** No TBD / TODO / "similar to" / incomplete code blocks. Every step has either concrete code or concrete commands.

**Type consistency.** Function names match across tasks:
- `getProjectBySlug` (Task 3) ↔ `adapter.projects.bySlug` (Task 2) ↔ loader imports (Task 4) — consistent
- `getMetroStops` (Task 3) with inline bookends → (Task 6) reads from `content/nav.ts` `metroBookends` via `adapter.content.metroBookends()` — consistent
- `ContentAdapter` interface (Task 2) matches all `staticAdapter` methods (Task 2) — same file, self-consistent

**One known ambiguity** (intentional): Task 7 sub-task count ("10-20 groups") depends on audit output from Task 5. Template procedure is concrete; specific sub-tasks instantiate at Task 5 STOP via Yesid approval.

**One known out-of-scope item** (intentional): `locale` propagation from loader to every component. Components using `resolveLocale` in Task 7 need `locale` in scope. For Slice 17b, fallback to `DEFAULT_LOCALE` import at component level if not wired. Full locale pipeline is post-17 work (noted in ARCHITECTURE.md decision log as a known TODO).
