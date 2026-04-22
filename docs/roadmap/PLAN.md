# yesid. Pipeline — Master Plan

**Owner:** Yesid O.
**Started:** April 2026
**Current phase:** A — Portfolio Site
**Future phases:** See docs/roadmap/FUTURE_PHASES.md (parked, not active)

## Goal

Ship yesid.dev as a memorable, motion-driven portfolio site with a scroll-based train journey, interactive 3D elements, and polished micro-interactions. The site is a platform, not a snapshot. Projects, services, and positioning are data that flows into reusable, animated components.

## Design Principles

1. **Data-driven.** Projects, services, skills, and links live in typed data files. The site renders whatever the data contains. Adding a project = adding one object to a file.
2. **Motion-first.** Every component ships with its animation behavior from day one. Motion is not decoration; it follows the "data in transit" metaphor defined in `docs/project/MOTION.md`.
3. **Componentized.** Every repeating UI pattern is a reusable component. Pages compose components. Components don't know about specific projects.
4. **Tested.** Every component and data layer ships with tests. Tests run on every push. If tests don't pass, code doesn't merge.
5. **Brand-consistent.** All colors, fonts, spacing come from tokens. Brand guide is source of truth for visuals, MOTION.md is source of truth for movement.
6. **Growable.** Architecture supports new sections (blog, case studies, services) without restructuring.
7. **Dark-first.** Dark theme ships in v1. Light theme is a future toggle.
8. **Progressive.** Full experience on desktop (3D + Lottie + scroll choreography).
9. **i18n-ready.** Data layer supports English, French, and Spanish from day one. English ships first. Translations added without refactoring.

## Tech Stack


| Layer                | Choice                                               | Why                                             |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Runtime              | Bun                                                  | Learning opportunity, fast, npm-compatible      |
| Framework            | SvelteKit 2 + Svelte 5                               | Already invested (Rail), fast, good DX          |
| Language             | TypeScript                                           | Type safety for data, catches errors early      |
| Styling              | Tailwind CSS + tokens.css                            | Brand config exists as tailwind.brand.js        |
| Fonts                | Inter + JetBrains Mono                               | Brand standard, Google Fonts                    |
| 3D                   | Threlte (@threlte/core + @threlte/extras) + Three.js | Svelte-native 3D, declarative, typed            |
| Scroll animation     | GSAP + ScrollTrigger                                 | Industry standard, scroll-linked timelines      |
| Illustrated motion   | Lottie (lottie-web)                                  | Lightweight vector animations for train + icons |
| Unit/Component Tests | Vitest + @testing-library/svelte                     | Fast, native SvelteKit integration              |
| E2E Tests            | Playwright                                           | Browser-level confidence                        |
| CI                   | GitHub Actions                                       | Runs tests + lint on every push/PR              |
| CD                   | Vercel                                               | Auto-deploy main, preview deploys on PRs        |
| Data                 | TypeScript files (no CMS, no DB)                     | Simple, version controlled, type-checked        |


## Site Architecture

```
Routes:
  /                  -> Home (train journey: hero → stations → CTA)
  /work              -> Project index (card grid, filterable by tag)
  /work/[slug]       -> Project detail (rendered from data)
  /services          -> Services index (all capabilities, linked to projects)
  /services/[id]     -> Service detail (deep dive, related projects, stack)
  /about             -> Bio, focus areas, skills
  /contact           -> Links (email, GitHub, LinkedIn, Upwork)

Data files:
  src/lib/data/types.ts       -> LocalizedString, Project, Service, SiteMeta interfaces
  src/lib/data/projects.ts    -> Project[] array
  src/lib/data/services.ts    -> Service[] array (station content)
  src/lib/data/meta.ts        -> Site-wide metadata (name, tagline, links)

Motion system (historical PLAN snapshot — post-17e reality differs: see docs/project/ARCHITECTURE.md):
  src/lib/motion/actions/     -> Svelte actions
  src/lib/motion/stores/      -> Scroll position, reduced-motion preference
  src/lib/motion/components/  -> LottiePlayer (post-17e)
  src/lib/motion/svg/         -> SVG train component
  src/lib/motion/utils/       -> GSAP helpers (lazy plugin loaders, shared ticker, scrub factories)

Components:
  ProjectCard         -> Renders a project summary (with boop hover + reveal entrance)
  ProjectGrid         -> Renders a filterable grid with FLIP animation
  ServiceStation      -> Renders a service as a "station" in the journey
  TagList             -> Renders tech stack tags (with stagger entrance)
  SectionHeader       -> Consistent section headings
  Nav                 -> Responsive nav with wordmark
  Footer              -> Minimal footer
  Hero                -> 3D scene + SVG train + tagline overlay
```

## Data Interfaces

```typescript
type Locale = 'en' | 'fr' | 'es'

type LocalizedString = {
  en: string
  fr?: string
  es?: string
}

interface Project {
  slug: string                    // NOT localized, URL-safe
  title: LocalizedString
  oneLiner: LocalizedString
  description: LocalizedString
  stack: string[]                 // NOT localized, tech names are universal
  tags: string[]                  // NOT localized
  status: 'public' | 'private' | 'wip'
  featured: boolean
  repoUrl?: string
  liveUrl?: string
  sections: {
    title: LocalizedString
    content: LocalizedString
  }[]
}

interface Service {
  id: string                      // unique identifier
  title: LocalizedString
  description: LocalizedString
  station: number                 // Sequential position in the train journey (1, 2, 3, ... N). NOT capped. Grows with the array.
  icon?: string                   // Lottie animation filename
  relatedProjects: string[]       // slugs of related projects to show at this station
}

interface SiteMeta {
  name: string                    // NOT localized, brand name is always "yesid."
  tagline: LocalizedString
  description: LocalizedString    // for SEO meta
  links: {
    email: string
    github: string
    linkedin?: string
    upwork?: string
  }
}
```

**Note:** The Service interface in the repo (slice 02) currently has only `title`, `description`, `icon`. The `id`, `station`, and `relatedProjects` fields will be added in slice 04. The `station` field is sequential (1, 2, 3, ...) with no hardcoded upper bound. The number of stations is always `services.length`.

## Testing Standards

Every slice ships code AND tests. No exceptions.

**Unit tests (Vitest):**

- Data layer: validate interfaces, check required fields, test helper functions
- Components: render with props, check output, test edge cases (empty data, missing optional fields)
- Motion actions: test that they apply/remove classes/transforms correctly
- Utilities: test any helper functions

**E2E tests (Playwright):**

- Each page renders without errors
- Navigation works (all links, mobile menu)
- Project detail pages load from data
- Responsive: test at mobile (375px), tablet (768px), desktop (1280px)
- Performance: frame rate above threshold during scroll

**CI pipeline (GitHub Actions):**

- Triggered on: push to main, pull requests
- Steps: install (bun install), lint, type-check, unit tests (bun run test), build, e2e tests
- PR cannot merge if any step fails

**Test file convention:**

- Unit tests: next to the file they test (e.g., `ProjectCard.test.ts` beside `ProjectCard.svelte`)
- E2E tests: in `tests/` directory at project root (e.g., `tests/home.spec.ts`)

**Yesid tests manually:**

- Yesid will review the site manually after every slice and will give the OK.

## Self-Documentation

**tree.txt** at project root is updated at the end of every slice. It is the repo's self-portrait.

Generate with:

```bash
##On Windows, use this command to generate tree.txt instead of `tree -I`:

cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"

##Or use PowerShell:

Get-ChildItem -Recurse -Name | Where-Object { $_ -notmatch 'node_modules|\.git|\.remember|bun\.lockb|\.svelte-kit|\.vercel|\.DS_Store' } | Out-File tree.txt -Encoding utf8
```

## Slices


| #   | Name                                                | Status                                                           | Depends On   | Est. Sessions |
| --- | --------------------------------------------------- | ---------------------------------------------------------------- | ------------ | ------------- |
| 01  | Project scaffold + brand + CI pipeline              | complete                                                         | none         | 1             |
| 02  | Data layer (types, data files, site meta)           | complete                                                         | 01           | 1             |
| 03  | Component library (basic, no motion)                | complete                                                         | 01           | 1-2           |
| 04  | Motion infrastructure + component enhancement       | complete                                                         | 02, 03       | 2-3           |
| 05  | Layout shell + scroll progress rail                 | complete                                                         | 03, 04       | 1             |
| 06  | Home page: train journey + hero 3D scene            | complete                                                         | 02, 04, 05   | 2-3           |
| 06d | Home page redesign: Metro System Evolved            | complete                                                         | 06           | 3-4           |
| A   | SVG metro hero (experimental)                       | complete                                                         | 06d          | 1             |
| C   | Zoom transition between hero + journey              | complete                                                         | A            | 1             |
| B   | Animated wordmark + horizontal scroll CTA           | complete                                                         | A, C         | 2             |
| B+  | Icon morphs + scroll UX for SkillsJourney           | complete                                                         | B            | 1-2           |
| 07  | Blog system (markdown content + /blog routes)       | complete                                                         | 06d          | 1-2           |
| 08  | Work pages (index + FLIP filter + detail)           | complete                                                         | 02, 03, 07   | 1-2           |
| 09  | Services pages (/services + /services/[id])         | ready                                                            | 02, 08       | 2-3           |
| 09b | About + Contact pages (bento grid /about)           | complete                                                         | 02, 03, 09   | 3-4           |
| 10  | Tech Stack page: "The Control Room" (/tech-stack)   | spec approved                                                    | 09b          | 6-8           |
| 11  | Navbar research + redesign + 404 page               | planned                                                          | 10           | 1-2           |
| 12  | Footer research + redesign                          | planned                                                          | 11           | 1             |
| 13  | Home page rework (post-hero, archive SkillsJourney) | planned                                                          | 10, 11, 12   | 2-3           |
| 14  | Stack Builder Logic Engine (graph-based recs)       | deferred — first CD/CI feature post-deploy. See FUTURE_PHASES.md | 10, 13       | 3-4           |
| 17  | Standardization: Design System + Ports & Adapters   | planned — split execution (see Execution Sequence below)         | 13           | 13-14         |
| 15  | SEO + metadata                                      | planned — built on 17b service layer                             | 13, 17a, 17b | 1-2           |
| 16  | E2E test suite + performance + brand QA             | planned — tests final standardized + SEO state                   | 15, 17       | 3             |
| 18  | Cloud content layer — **Directus** (own repo) + Neon | in progress — 18a + 18b shipped 2026-04-21 on Payload (now historical); **pivoted to Directus 2026-04-22** after research; 18c-18g rewritten as Directus rebuild | 16, 17       | 5-8           |
| 19  | Mobile UI/UX optimization                           | planned                                                          | 17, B+       | 2             |
| 19b | Accessibility (A11Y) optimization                   | planned                                                          | 19           | 2             |
| 20  | Scroll smoothness + animation polish                | planned                                                          | B+, 19b      | 1             |
| 21  | Repo cleanup for public release                     | planned                                                          | 16, 18       | 1             |
| 22  | Deploy to Vercel + DNS cutover                      | planned                                                          | 21           | 1             |


### Execution Sequence (Post-Home Page)

Slice 17 executes in two phases, with SEO sandwiched between them. This avoids building SEO on data patterns that 17 will refactor, and ensures E2E tests cover the final architecture.

```
13 (home page)
  → 17a (CSS audit + consolidation)
  → 17d (component API standardization)
  → 17e (motion consolidation)
  → 17b (service layer extraction)
    → 15 (SEO + metadata — built on service layer, not raw data files)
  → 17c (Zod schemas — validates SEO structured data too)
  → 17f (test architecture + docs)
    → 16 (E2E + QA — tests the FINAL state including SEO)
      → 18 (Directus CMS — plugs into 17b service seam, SEO metadata as first test collection; pivoted from Payload 2026-04-22)
        → 19 (mobile optimization)
          → 19b (accessibility / A11Y)
            → 20 (scroll polish)
  → 17g (learning docs refactor)
              → 21 (repo cleanup)
            → 22 (deploy)
```

**Why this order:**

1. **17a+17b first** — service layer gives SEO clean data access (`getAllProjects()`, not raw imports)
2. **15 after 17b** — `<SeoHead>` built once on the right foundation, no refactor needed
3. **17c-17g after 15** — Zod validates SEO structured data; remaining standardization completes
4. **16 last before deploy** — E2E tests cover the fully standardized + SEO-equipped site
5. **18 after 16** — Directus plugs into 17b's service seam; SEO metadata becomes first test collection (pivoted from Payload 2026-04-22 — see `docs/slices/slice-headless-cms-best-practices/decision-brief.md`)

## Slice Summaries

### Completed (shipped before 2026-04-17 — see git log + cloud mirror for full specs/plans/handoffs)

Phase A / pre-13 shipped the foundation: Slice 01 scaffolded SvelteKit 2 + Svelte 5 + Tailwind v4 + Vitest + Playwright on Bun with GitHub Actions CI. 02 built the typed data layer (projects, services, skills, blog, nav). 03 delivered the basic component library (buttons, cards, tags, containers). 04 shipped the motion infrastructure (GSAP + ScrollTrigger + Lenis + Lottie + reveal/tilt actions — most of these later retired or re-engineered in 17e). 05 added the scroll progress rail + site-wide layout shell. 06 / 06d built the home page (train-journey hero, 3D scene, evolved Metro System). Experimental slices A/B/C/B+ iterated the SVG metro hero, zoom transition, animated wordmark, and icon morphs.

Slice 07 shipped /blog (markdown pipeline, filters, search, SVG morph hover, reading-progress bar). 08 shipped /projects (FLIP grid, detail layout). 09 / 09b shipped /services (kinetic index, station tabs, consultative detail) + /about (bento dashboard) + /contact (dual-terminal + Web3Forms). 10 / 10d+ shipped /tech-stack ("The Control Room") + testing infrastructure optimization (happy-dom, 2 Vitest projects, threads pool, ~56s → ~29s). 11 shipped pill navbar + menu overlay + branded 404. 12 shipped 3-row footer + orange-dot favicon + JSON-LD schema.

Slice 13 shipped the home-page rework (two-column hero, manifesto, transit HUD, interactive canvas, metrics, proof reel, services grid, construction-site closer). 13b–13h polished each subsection. Slice 17 Phase 1 (design-system visual layer) completed 2026-04-18 across 17a-1 (token foundation), 17a-2a/b (brand primitives build + wire), 17a-3a/b (color lockdown + token wiring), 17a-4 (dead-code + dedup), 17a-5 (spacing tokens + CONSTITUTION.md + dvh/svh/safe-areas), 17a-6 (Bits UI integration), 17d (component API + card unification + contact redesign), 17e (motion re-engineering, 6 sub-slices), 17h (brand bundle — narrative + logo assets + governance freshen). PRs #2, #3, #4, #5, #6, #8, #12, #14, #15, #17, #19, #20, #22 merged to main.

Full per-slice specs, plans, devlogs, and handoffs live at `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and in `git log`. Cloud-side `COMPLETED-SLICES.md` is the one-line index.

### Active

**Slice 17j — Workflow Efficiency** (in progress, 2026-04-17). Two pillars: token efficiency (prune 7 accretion sources) + workflow structure (3-level hierarchy, 4-file sub-slice bundles, self-appending handoff, close-script, OS-agnostic env var, shared vocabulary). Codifies findings into a portable cloud knowledge base, a `workflow-efficiency` skill, and a global-config snapshot. Trade-secret personal IP portable across Yesid's 6 services. Spec: `docs/slices/slice-17/slice-17j/spec.md`. Plan: `docs/slices/slice-17/slice-17j/plan.md`.

### Remaining in Slice 17 (planned)

- **17b** Service Layer (~2 sessions) — extracts service seams. Depends on design-system phase. Enables Slice 15 (SEO) and Slice 18 (Directus CMS, pivoted from Payload 2026-04-22).
- **17c** Zod Schemas (~0.5 session) — validates data-layer + future SEO structured data. Depends on 17b.
- **17f** Test Architecture (~1–2 sessions) — test factories + co-location rules. Runs after 15.
- **17g** Learning Docs Refactor (~2 sessions) — sweep the `docs/learn/` cloud mirror to align with post-17 architecture. **Scope re-evaluation needed** given learn/ moved to cloud in 17j.

### Upcoming (planned, detailed below)

15, 16, 18, 19, 19b, 20, 21, 22 — see sections below for scope and sequencing.

### Slice 15 — SEO + Metadata: Maximum Discoverability

**Full direction:** [docs/slices/slice-15/README.md](../slices/slice-15/README.md)
**Status:** planned **Depends on:** 13, 17a, 17b **Est.:** 1–2 sessions

### Slice 16 — E2E Test Suite + Performance + Brand QA Pass

**Full direction:** [docs/slices/slice-16/README.md](../slices/slice-16/README.md)
**Status:** planned **Depends on:** 15, 17 **Est.:** 3 sessions

### Slice 17 — Standardization: Ports & Adapters Lite

**Full direction:** [docs/slices/slice-17/README.md](../slices/slice-17/README.md)
**Status:** IN PROGRESS — Phase 1 visual stage complete (17a, 17d, 17e, 17h shipped); 17j Workflow Efficiency active. **Depends on:** 13 **Est.:** 20–24 sessions across all sub-slices

### Slice 18 — Cloud Content Layer: Directus (own repo) + Neon (pivoted from Payload 2026-04-22)

**Full direction:** [docs/slices/slice-18/README.md](../slices/slice-18/README.md)
**Status:** planned **Depends on:** 16, 17 **Est.:** 5–7 sessions

### Slice 19 — Mobile UI/UX Optimization

**Full direction:** [docs/slices/slice-19/README.md](../slices/slice-19/README.md)
**Status:** planned **Depends on:** 17, B+ **Est.:** 2 sessions

### Slice 19b — Accessibility (A11Y) Optimization

**Full direction:** [docs/slices/slice-19b/README.md](../slices/slice-19b/README.md)
**Status:** planned **Depends on:** 19 **Est.:** 2 sessions

### Slice 20 — Scroll Smoothness + Animation Polish

**Full direction:** [docs/slices/slice-20/README.md](../slices/slice-20/README.md)
**Status:** planned **Depends on:** B+, 19b **Est.:** 1 session

### Slice 21 — Repo Cleanup for Public Release

**Full direction:** [docs/slices/slice-21/README.md](../slices/slice-21/README.md)
**Status:** planned **Depends on:** 16, 18 **Est.:** 1 session

### Slice 22 — Deploy to Vercel + DNS Cutover

**Full direction:** [docs/slices/slice-22/README.md](../slices/slice-22/README.md)
**Status:** planned **Depends on:** 21 **Est.:** 1 session

## Pre-Slice Work

- **Before Slice 02:** ~~Finalize project descriptions, service definitions, site meta~~ (done)
- **Before Slice 06:**
  - ~~Source 4 Lottie station icons from LottieFiles marketplace~~ (done, recolored to brand palette)
  - ~~Write hero copy and CTA text~~ (done: "The infrastructure is ready." / "Let's build something that moves.")
  - ~~Write service descriptions for each station~~ (done)
  - Remodel a new train from top POV
- **Before Slice 08:** Write About page bio
- **Before Slice 11:** Verify backup path exists on local machine

## Lottie Asset Pipeline

### v1: Marketplace sourcing (COMPLETE)

4 Lottie animations sourced from LottieFiles marketplace, recolored to brand palette, and ready for use:


| File                       | Station            | Source                      | Status                                                                  |
| -------------------------- | ------------------ | --------------------------- | ----------------------------------------------------------------------- |
| `station-sql.json`         | 1: SQL Development | LottieFiles (database icon) | Recolored, bg removed                                                   |
| `station-pipeline.json`    | 2: Data Pipeline   | LottieFiles (data flow)     | Recolored, logos kept, destination replaced with orange dot             |
| `station-analytics.json`   | 3: Analytics       | LottieFiles (data analysis) | Recolored                                                               |
| `station-performance.json` | 4: Performance     | LottieFiles (speed test)    | Recolored, text changed to yesid.dev/Montreal QC, green gradients fixed |


All files use exclusively brand palette colors: #E07800, #FFB627, #C96A00, #E5A220, #F5F5F0, #999999, #666666, #141414, #1E1E1E.

Place all Lottie JSON files in `src/lib/assets/lottie/`.

### Adding new station Lotties (future)

Adding a new service station requires one new Lottie file:

1. Source from LottieFiles marketplace (or design custom)
2. Recolor to brand palette
3. Place in `src/lib/assets/lottie/station-{name}.json`
4. Reference filename in the Service object's `icon` field
5. No component or layout changes needed

### v2+: Custom Lotties

When ready to create custom animations, swap marketplace JSON files for custom ones. The `LottiePlayer.svelte` component accepts any Lottie JSON. No code changes needed.

**Design flow for custom Lotties:**

1. Design in Figma (shapes, colors, keyframe planning)
2. Export to After Effects (or animate directly if simple)
3. Export with Bodymovin plugin as JSON
4. Replace file in `src/lib/assets/lottie/`

## Decisions Log


| Date       | Decision                                           | Rationale                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-01 | Slice-based workflow adopted                       | Prevents scope creep, forces sequential focus                                                                                                                                                                |
| 2026-04-01 | SvelteKit 2 chosen                                 | Prior investment (Rail), good DX, Vercel-native                                                                                                                                                              |
| 2026-04-01 | Dark theme only in v1                              | Brand default, reduces scope                                                                                                                                                                                 |
| 2026-04-01 | Data-driven architecture                           | Site grows with career, no hardcoded content                                                                                                                                                                 |
| 2026-04-01 | No CMS in v1                                       | TS files are simpler, version controlled, type-safe                                                                                                                                                          |
| 2026-04-01 | Future phases parked                               | Ship site before anything else                                                                                                                                                                               |
| 2026-04-02 | Site is a platform, not a snapshot                 | Components and data are generic                                                                                                                                                                              |
| 2026-04-02 | TDD integrated into every slice                    | Tests ship with code, CI enforces quality                                                                                                                                                                    |
| 2026-04-02 | GitHub Actions + Vercel CD                         | Automated pipeline from push to production                                                                                                                                                                   |
| 2026-04-02 | Repo cleanup before public                         | Pipeline artifacts archived locally, repo stays clean                                                                                                                                                        |
| 2026-04-02 | Archive path                                       | C:\Users\otalo\Yesito\cloud\yesid-pipeline-archive\                                                                                                                                                          |
| 2026-04-02 | Bun as runtime                                     | Learning opportunity, fast, drop-in npm replacement                                                                                                                                                          |
| 2026-04-02 | tree.txt updated every slice                       | Repo self-documents its structure                                                                                                                                                                            |
| 2026-04-02 | i18n baked into data layer                         | Owner is Colombian in Quebec. EN/FR/ES supported from day one.                                                                                                                                               |
| 2026-04-02 | Motion-first approach adopted                      | Every component ships with animation from day one                                                                                                                                                            |
| 2026-04-02 | Train journey metaphor for home page               | Single continuous narrative tied to brand + career                                                                                                                                                           |
| 2026-04-02 | Threlte for 3D (minimal dark + glowing paths)      | Svelte-native, declarative, typed                                                                                                                                                                            |
| 2026-04-02 | GSAP for scroll choreography                       | Industry standard, ScrollTrigger for scroll-linked                                                                                                                                                           |
| 2026-04-02 | Lottie for train + station icons                   | Lightweight, polished illustration, designed in Figma                                                                                                                                                        |
| 2026-04-02 | Hybrid 3D env + Lottie train                       | Best of both: interactive depth + illustration quality                                                                                                                                                       |
| 2026-04-02 | No 3D on mobile                                    | Performance over spectacle on constrained devices                                                                                                                                                            |
| 2026-04-02 | Extended timeline (4-5 weeks)                      | Ship something memorable over something fast                                                                                                                                                                 |
| 2026-04-02 | MOTION.md created                                  | Source of truth for motion language, parallel to brand guide                                                                                                                                                 |
| 2026-04-02 | SVG train + GSAP MotionPathPlugin                  | Train movement is scroll-linked (needs GSAP), not pre-baked                                                                                                                                                  |
| 2026-04-02 | Marketplace Lotties for v1                         | Custom Lotties require After Effects skill; marketplace fills the gap                                                                                                                                        |
| 2026-04-02 | Additive animation architecture                    | New animations = new files, not refactoring existing code                                                                                                                                                    |
| 2026-04-02 | Three animation layers defined                     | Threlte (atmosphere) + GSAP (choreography) + Lottie (illustration)                                                                                                                                           |
| 2026-04-02 | Standardized action/component patterns             | Every motion component checks reduced-motion, cleans up on destroy                                                                                                                                           |
| 2026-04-02 | SEO as dedicated slice (09)                        | Meta tags, OG, sitemap layered after all pages exist                                                                                                                                                         |
| 2026-04-02 | Locale routing deferred                            | URL prefixes (/fr/, /es/) not in v1. Data is ready, routing added when translations exist.                                                                                                                   |
| 2026-04-02 | Service interface evolves in slice 04              | Add station, id, relatedProjects when motion infrastructure exists                                                                                                                                           |
| 2026-04-02 | Layered animation architecture                     | Four independent layers: Svelte actions (interaction) + GSAP (choreography) + Lottie (illustration) + Threlte (atmosphere). Each removable.                                                                  |
| 2026-04-02 | SVG train + GSAP MotionPath for movement           | Scroll-linking needs real-time control. Lottie optional for idle polish only.                                                                                                                                |
| 2026-04-02 | Marketplace Lotties recolored to brand             | 4 station icons sourced, recolored (#E07800 family), fixed (bg removed, logos adjusted, text replaced). Done.                                                                                                |
| 2026-04-02 | Data-driven station system                         | No hardcoded station count. services.length determines everything. Adding a service = 1 object + 1 Lottie.                                                                                                   |
| 2026-04-02 | Easter eggs planned                                | Small surprises that reward curiosity (MOTION.md section 9). Implement as time allows.                                                                                                                       |
| 2026-04-02 | MOTION.md v1.1                                     | Updated with layered architecture, SVG train approach, marketplace Lottie strategy, easter eggs, data-driven stations.                                                                                       |
| 2026-04-03 | Metro System Evolved redesign                      | Home page expanded to 8 stops: hero, 4 services, featured work, about bento, blog, CTA                                                                                                                       |
| 2026-04-03 | 3D Montreal metro wagon in hero                    | Sketchfab model (CC BY 4.0, mamont nikita) over AI-generated station art                                                                                                                                     |
| 2026-04-03 | Blog from markdown files                           | `src/content/blog/*.md` with frontmatter, parsed at build time via `import.meta.glob`                                                                                                                        |
| 2026-04-03 | Station dividers with hazard stripes               | Yellow/black repeating gradient between metro stops                                                                                                                                                          |
| 2026-04-03 | Draggable train                                    | Train can be dragged along rail to scroll the page                                                                                                                                                           |
| 2026-04-03 | Rail at viewport edge                              | Rail moved from inside max-w-5xl to fixed right edge of viewport                                                                                                                                             |
| 2026-04-03 | gltf-transform for model optimization              | 88MB Sketchfab GLB → 4.3MB via dedup + Draco compression                                                                                                                                                     |
| 2026-04-03 | Data-driven metro line (metro.ts)                  | Stop numbers auto-compute. Adding a service extends the entire rail.                                                                                                                                         |
| 2026-04-03 | Centralized i18n content (content.ts)              | All UI strings in one place for future French/Spanish translations                                                                                                                                           |
| 2026-04-03 | ~~Replace 3D fab with scroll-linked video~~        | SCRAPPED — 06f removed from plan                                                                                                                                                                             |
| 2026-04-04 | Experimental slices (A, B, C) for hero + journey   | Rapid prototyping of SVG hero, zoom transition, and horizontal scroll CTA                                                                                                                                    |
| 2026-04-04 | GSAP all plugins free                              | SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase — all available at no cost                                                                                                                              |
| 2026-04-05 | SkillsJourney horizontal scroll section            | 5-panel horizontal scroll with data-driven panels, replacing train journey on home page                                                                                                                      |
| 2026-04-05 | Per-word GSAP triggers (trigger: hw)               | Using individual word elements as ScrollTrigger targets instead of paragraph for accurate timing                                                                                                             |
| 2026-04-05 | containerAnimation + scrub for all effects         | Pure scrub with containerAnimation naturally reverses on scroll back; no toggleActions/yoyo                                                                                                                  |
| 2026-04-05 | No animation on non-keyword text                   | Static white text for uniform look + lighter performance; only keywords get effects                                                                                                                          |
| 2026-04-05 | Shape morphs deferred to Slice B+                  | MorphSVGPlugin shapes separated from text animations for cleaner delivery                                                                                                                                    |
| 2026-04-05 | `marked` over mdsvex for blog content rendering    | mdsvex had parse errors with `<` characters in inline code/content; `marked` is simpler and more reliable                                                                                                    |
| 2026-04-05 | Per-post folders (`category/slug/index.md`)        | Allows co-located assets (images, diagrams) per post in the future                                                                                                                                           |
| 2026-04-05 | Deterministic SVG fallback from slug hash          | Every post gets the same illustration even without explicit SVG assignment — consistent across builds                                                                                                        |
| 2026-04-05 | MorphSVGPlugin hover morph on blog SVGs            | Already loaded from Slice B+ — reuses plugin for delightful micro-interaction on hover/tap                                                                                                                   |
| 2026-04-05 | Client-side blog filtering (search/tags/date/lang) | 7 posts total — no benefit to server-side filtering; keeps UX snappy                                                                                                                                         |
| 2026-04-05 | Two blog content lanes (professional + personal)   | Separates brand-facing technical content from personal interests; different accent colors (#E07800 vs #FFB627)                                                                                               |
| 2026-04-07 | Brand = Digital Infrastructure (not just data/SQL) | Current focus is data engineering + SQL, but the brand umbrella covers databases, dashboards, pipelines, internal tools, web systems. All copy reflects broader positioning.                                 |
| 2026-04-07 | Slice 10 = Home page rework after About/Contact    | Building all route pages gave clarity on site identity. Home (post-hero) was built before subsites. Rework with full context. Archive SkillsJourney (keep code, disable render, bring back optimized later). |
| 2026-04-10 | Slice 14 deferred to CD/CI                         | First feature released under a proper CD/CI pipeline after deploy, like a real engineer                                                                                                                      |
| 2026-04-22 | Slice 18 CMS: PIVOT from Payload to Directus        | Supersedes 2026-04-16 Payload decision. Research slice `slice-headless-cms-best-practices` (6 parallel agents, 3 dimensions, 2 WebFetches including directus.io/mcp) + decision-brief shipped. Decisive factors: (a) mobile/iPad admin (Payload admin breaks <768px, Directus works on iPad); (b) SvelteKit live preview (Directus has 7 official tutorials + `@directus/visual-editing` v2; Payload's only community SvelteKit starter archived Nov 2025); (c) Directus MCP GA native v11.13 Nov 2025 (first-party, all tiers) — correction to earlier claim that Directus lacked MCP; (d) commercial trajectory (Directus 7.5/10 independent + founder-led + VC-funded 28→55 employees Jul'24→Feb'26; Payload 5/10 Figma-acquired Jun'25 with Cloud paused, repositioning as Figma CMS backend); (e) editor UX Agent J verdict 23/25 vs 14/25 on 5-task test + 8/8 deep differentiators; (f) "procurement over scratch" values alignment (Directus 70% editor-ready default vs Payload's 25%, FORMULA cost 3-4 hrs vs 12-16 hrs per project); (g) design-locked near-term so Payload's blocks advantage (10:1 Agent I) weights to zero until post-launch. Migration: scorched-earth rebuild of yesid.dev-cms (SAME repo, Payload code deleted) + 18-22 realistic dev-days. Full brief at `docs/slices/slice-headless-cms-best-practices/decision-brief.md`. |
| 2026-04-10 | Standardize (17) before SEO (15) + QA (16)         | SEO built on service layer = no rework. E2E tests cover final architecture. Split execution: 17a+17b → 15 → 17c-17g → 16 → 18. Keystatic gets SEO metadata as first test collection.                         |
| 2026-04-07 | No standalone tech stack page                      | About page widget + service detail pages + blog posts cover tools better than a resume-style page. Anti-pattern per conversion research.                                                                     |
| 2026-04-07 | Live weather widget (OpenWeatherMap free tier)     | API key in .env, server-side fetch in +page.server.ts, graceful fallback. Unique personality touch on About page.                                                                                            |
| 2026-04-16 | Slice 18 CMS: pivot from Keystatic to Payload      | Supersedes 2026-04-10 Keystatic decision. Non-tech clients need email/password + real admin (Keystatic requires GitHub auth). Template goal ("WordPress flexibility, modern") fits Payload; dynamic queries, roles, client-login path. Keystatic kept as possible "Static tier" for pure-content clients. Full design spec: `docs/specs/2026-04-16-cms-payload-design.md`.                                                                             |
| 2026-04-16 | Slice 18 ships as two repos, not a monorepo        | `yesid.dev` (SvelteKit) stays clean for showcase and open-sourcing. `yesid.dev-cms` (Payload 3 + Next.js) becomes a framework-agnostic CMS starter — per-framework integration recipes (SvelteKit first, Next.js/Astro/Nuxt on demand). Bigger addressable market than a SvelteKit-locked monorepo template. Type sync via GitHub Action, not shared package. Revises earlier same-day monorepo decision.                                                 |
| 2026-04-16 | Neon Postgres + Vercel Blob for CMS storage        | Neon: serverless, scale-to-zero, DB branching per PR, zero vendor lock-in (plain Postgres). Vercel Blob: zero-config media storage. Supabase rejected — its Auth/Storage/RLS duplicate Payload's built-ins. |


## Rules

1. One slice at a time. No scattering.
2. Spec before code. Always.
3. Review handoff before next slice. Always.
4. Code and tests ship together. No code without tests.
5. CI must be green before merging. No exceptions.
6. tree.txt updated at the end of every slice.
7. Motion follows MOTION.md principles. No random animation.
8. Content decisions and code both happen in Claude Code.
9. Lottie assets sourced before slice 06 starts.
10. Every animation respects prefers-reduced-motion.
11. Station system is fully data-driven. Adding a service = adding one object to services.ts + one Lottie JSON. Zero component/layout changes. Home page, scroll rail, train path, and Threlte nodes all derive from services array length and data. No hardcoded station counts or per-station logic.
12. Each motion layer (Svelte/GSAP/Lottie/Threlte) is independently removable.

