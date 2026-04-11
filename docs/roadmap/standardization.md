# Slice 17 — Standardization: Design System + Ports & Adapters

**Status:** planned
**Est. Sessions:** 13-14 (across 7 sub-slices)
**Depends on:** Slice 13 (Home Page) complete
**Key constraint:** Visual IMPROVEMENTS allowed (bigger text, better consistency), but no new features. Structural refactor + design system unification.

---

## Philosophy

Two goals, one slice:

1. **Design system.** The site should feel like one product, not 22 slices bolted together. One change to a token, a card style, or a type scale cascades everywhere. Adding a light theme = swapping one file, zero component edits. Brand components (terminals, dividers, cursors, cards) are reusable primitives, not one-off implementations.

2. **Architecture.** The codebase should read like a blueprint. Types define shape, schemas validate, services query, loaders orchestrate, components render. Each layer has one job. The seam between data source and service layer is where Slice 18 (Keystatic) plugs in with zero component changes.

### Tailwind CSS: Keep or Replace?

**Decision: Keep Tailwind v4, but enforce strict token discipline.**

Tailwind v4's CSS-first `@theme` config is exactly what a design system needs — tokens defined once in CSS, Tailwind generates the utility classes. The problem isn't Tailwind. The problem is bypassing the system with arbitrary values (`text-[11px]`, `#E07800` inline, `style="max-width: 64rem"`). 275 font-size declarations across 40 files, each picking its own size.

The fix is rules, not a framework swap:
- **No arbitrary values in templates.** No `text-[11px]`, `text-[13px]`, `p-[22px_24px]`. Everything maps to a token.
- **`@theme` is the single source.** All spacing, colors, radii, type sizes live there. Components consume, never define.
- **CSS custom properties for theme-switching.** `tokens.css` handles `var(--bg-surface)` for dark/light. `@theme` handles static brand values.
- **Scoped `<style>` for complex layout only.** Grid templates, keyframe animations, pseudo-elements. Never for colors, fonts, or spacing.

Alternatives considered:
- **vanilla-extract / Panda CSS** — type-safe tokens, but SvelteKit support is immature, would require migrating every component
- **Plain CSS + custom properties** — works but loses all utility composition already built across 40+ components
- **UnoCSS** — same utility model as Tailwind with less ecosystem. Lateral move, not improvement.

Tailwind v4 + strict tokens + CSS custom properties is the right stack. The design system is the discipline layer on top.

---

## Current State (Audit)

What the codebase looks like today and what this refactor fixes.

### Data Access — No Service Layer

Routes import directly from `$lib/data` barrel or individual data files. There is no `src/lib/services/` directory. Query functions like `getProjectBySlug()`, `getAllTechItems()` live inside data files alongside the raw data arrays.

| Route | Current Import |
|-------|---------------|
| `/work/[slug]` | `import { getProjectBySlug, getServiceById } from '$lib/data'` |
| `/tech-stack` | `import { getAllTechItems, getAllScenarios } from '$lib/data/tech-stack.js'` |
| `/blog` | `import { getPostsByCategory, getTagsForCategory, ... } from '$lib/data'` |
| `/blog/personal` | `import { getPostsByCategory, getTagsForCategory, ... } from '$lib/data'` |
| `/blog/[slug]` | `import { getPostBySlug, getPostHtml, getSvgContent } from '$lib/data'` |
| `/about` | Server-side fetch in `+page.server.ts` |

**Problem:** Data definition and data access are coupled. Swapping to Keystatic (Slice 18) requires changing every route loader. The service layer creates the seam: route loaders call services, services call data source. Swap the data source implementation, everything downstream stays.

### CSS — 192 Hardcoded Hex Colors

| Issue | Count | Files Affected |
|-------|-------|----------------|
| Hardcoded hex colors (`#xxx`) in `.svelte` | 192 occurrences | 30 files |
| Inline `style=` attributes | 96 occurrences | 30+ files |

Heaviest offenders: `Train.svelte` (38), `TrainTop.svelte` (24), `BlogContent.svelte` (17), `ContactPage.svelte` (18), `HomeServices.svelte` (21), `BlogFilterMobile.svelte` (11), `MetroNetwork.svelte` (11).

Many inline `style=` are for dynamic JS values (scroll position, transforms) — those are fine. Static style attributes need migration to Tailwind classes or scoped CSS.

### Component Props — No Exported Interfaces

Zero components in `src/lib/components/` export typed prop interfaces. Props are defined inline. This means:
- No IDE autocomplete when using components
- No reusable prop patterns across components
- No shared `WithAnimation`, `WithLocale`, `WithTestId` mixins

### GSAP + Svelte 5

- **19 components** import GSAP
- **9 components** use `$effect()`
- **0 files** combine `$effect()` + GSAP directly (good — the known bug hasn't been hit)
- **7 Svelte actions** exist in `src/lib/motion/actions/` with 68 total uses across 26 components
- **58 files** reference reduced-motion — widespread but potentially inconsistent enforcement

GSAP usage is mostly correct (not inside `$effect()`), but motion logic is scattered across components rather than centralized in reusable factories.

### Design System — No System, Just Patterns

The site has brand components, but each reimplements the brand independently. There's no shared design system — each component picked its own sizes, colors, and patterns.

**Typography chaos — 275 font-size declarations across 40 files:**

tokens.css defines a type scale (`--text-h1: 2rem`, `--text-body: 1rem`) but almost nothing uses it. Components use arbitrary Tailwind sizes: `text-[11px]`, `text-[13px]`, `text-xs`, `text-sm`, `text-2xl`, `text-[10px]`. The result: 15+ distinct font sizes with no semantic meaning. Text is often too small.

**Terminal chrome — reimplemented 5+ times:**

| Component | What it builds | Shared? |
|-----------|---------------|---------|
| `InfraFrame` | LED + title bar + hazard stripe + status footer | Used on tech-stack page only |
| `HeroSqlPanel` | Rounded border + bg-terminal + prompt + live dot | Hero only |
| `AboutCta` | Terminal window with blinking cursor | About page only |
| `ContactPage` | Dual terminal layout | Contact page only |
| `Manifesto` | Terminal-style text with cursor | Home page only |

All five build the same visual language (dark bg, mono font, border, LED/live indicator) from scratch.

**Hazard stripes — duplicated 5+ times:**

| Component | Implementation |
|-----------|---------------|
| `StationDivider` | Inline `style=` with hardcoded `#FFB627`/`#141414` repeating gradient |
| `ProofStrip` | Scoped CSS with same gradient, different class name |
| `StationTabs` | Inline hazard stripe pattern |
| `InfraFrame` | `.frame-stripe` scoped class |
| `HeroBanner` | Inline hazard stripe |

Same visual, five implementations. Change the stripe angle = five files to edit.

**Blinking cursor — exists as component, inconsistently used:**

`TerminalCursor.svelte` exists and uses `var(--brand-primary)`. But some components (Manifesto, AboutCta) implement their own cursor blink instead of using it.

**Cards — no shared base:**

`WorkCard`, `BlogRow`, `ProjectCard`, `ProjectMiniCard`, `ServiceCard`, `StackNode` — all implement hover states, borders, backgrounds, and interactions independently. No shared card primitive.

**Light theme — structure exists but would break:**

`tokens.css` has `[data-theme="light"]` with 7 semantic tokens defined. But components hardcode `#141414`, `#1E1E1E`, `#0a0a0a` directly. Switching to light theme would leave dark backgrounds scattered everywhere. Only components using `var(--bg-surface)` would actually switch.

**GradientSeparator — has hardcoded hex in scoped CSS:**

Even the "global" separator component hardcodes `#E07800` and `#FFB627` in its `<style>` block instead of using `var(--brand-primary)` and `var(--brand-accent)`.

### Validation — No Zod Schemas

No `src/lib/schemas/` directory exists. TypeScript interfaces catch build-time errors only. When Keystatic feeds content as JSON, there's no runtime validation. Malformed data would reach components silently.

### Tests — No Factory Pattern

Tests create mock data inline. Example: `HomeServices.test.ts` and `ProofReel.test.ts` render components directly without shared test data factories. Each test file rebuilds its own data setup. When the data model changes, every test file needs updating.

34 component test files exist — good coverage, but fragile data setup.

---

## Target Architecture

### Design System (the cascading foundation)

```
┌─────────────────────────────────────────────────────────────────┐
│  tokens.css — THE source of truth                               │
│  Semantic color props (--bg-surface, --text-primary)            │
│  Theme switching: [data-theme="dark"] / [data-theme="light"]    │
│  Type scale, spacing scale, radii, shadows                      │
│  Brand colors (--brand-primary, --brand-accent)                 │
│  Change one value here → every component updates                │
├─────────────────────────────────────────────────────────────────┤
│  app.css @theme — Tailwind token bridge                         │
│  Maps tokens to Tailwind utilities (bg-brand-primary, text-lg)  │
│  Type scale: --text-display, --text-title, --text-body, etc.    │
│  Spacing scale: --space-section, --space-card, --space-inline   │
│  No arbitrary values in component templates                     │
├─────────────────────────────────────────────────────────────────┤
│  Brand Primitives (src/lib/components/brand/)                   │
│  TerminalChrome — shared terminal window wrapper                │
│  HazardStripe — the stripe, one implementation                  │
│  GradientSeparator — flowing gradient divider                   │
│  TerminalCursor — blinking cursor                               │
│  CardBase — shared card with hover/glow/border                  │
│  SectionLabel — "// SECTION" mono labels                        │
│  LiveDot — pulsing green/orange status indicator                │
│  CircuitGrid — the background texture                           │
│  Used across the entire site. Portable to other projects.       │
├─────────────────────────────────────────────────────────────────┤
│  Scoped <style> — ONLY for component-specific layout            │
│  Grid templates, position, overflow, keyframes                  │
│  NEVER for colors, fonts, spacing, or brand patterns            │
└─────────────────────────────────────────────────────────────────┘
```

**The cascade guarantee:** Changing `--brand-primary` in tokens.css changes the orange everywhere — in the gradient separator, hazard stripes, terminal cursors, card borders, scrollbar, circuit grid, links, buttons. Zero component edits.

**Light theme guarantee:** Adding `[data-theme="light"]` values in tokens.css switches every component that uses semantic tokens. No component knows whether it's dark or light — it just renders `var(--bg-surface)`.

### Application Architecture (data flow)

```
┌─────────────────────────────────────────────────────┐
│  Route Loaders (+page.ts)                           │
│  Import from services only. Never touch data files. │
├─────────────────────────────────────────────────────┤
│  Service Layer (src/lib/services/*.service.ts)      │
│  Typed query functions. JSDoc. Explicit returns.    │
│  THE SEAM: Keystatic swaps here, nothing else moves │
├─────────────────────────────────────────────────────┤
│  Zod Schemas (src/lib/schemas/*.ts)                 │
│  Runtime validation. Parse, don't validate.         │
│  Clear error messages, not generic Zod dumps.       │
├─────────────────────────────────────────────────────┤
│  Data Layer (src/lib/data/*.ts)                     │
│  Raw data definitions. Types. Constants.            │
│  No query logic — that lives in services.           │
├─────────────────────────────────────────────────────┤
│  Components (src/lib/components/*.svelte)            │
│  Exported prop interfaces. Shared UI shells.        │
│  Consume brand primitives + resolved data via props │
├─────────────────────────────────────────────────────┤
│  Motion (src/lib/motion/)                           │
│  Actions for DOM lifecycle. Factories for timelines.│
│  Reduced-motion enforced at factory level.          │
└─────────────────────────────────────────────────────┘
```

**Import rules (enforced post-refactor):**

| From → To | Allowed |
|-----------|---------|
| Route loaders → Services | Yes |
| Route loaders → Data files | **No** |
| Services → Data files | Yes |
| Services → Schemas | Yes |
| Components → Services | **No** (receive data via props) |
| Components → Data files | **No** (receive data via props) |
| Components → Motion actions | Yes |
| Motion factories → GSAP | Yes |
| Components → Raw GSAP | Discouraged (use factories) |

---

## Execution Sequence

Slice 17 executes in two phases, with SEO (Slice 15) sandwiched between them. This avoids building SEO on data patterns that get refactored, and ensures E2E tests cover the final architecture.

```
Phase 1 — Foundation (before SEO)
  17a: CSS audit + consolidation + CSS.md
  17b: Service layer extraction
    ↓
  15: SEO + metadata (built on service layer)
    ↓
Phase 2 — Standardization (after SEO)
  17c: Zod schema validation
  17d: Component API standardization + shared UI shells
  17e: Motion consolidation
  17f: Test architecture + documentation
  17g: Learning docs refactor
    ↓
  16: E2E + QA (tests the FINAL state)
    ↓
  18: Keystatic (plugs into 17b service seam)
```

**Why this split:**
1. **17a+17b first** — service layer gives SEO clean data access (`getAllProjects()` through services, not raw imports)
2. **15 after 17b** — `<SeoHead>` built once on the right foundation, no rework
3. **17c after 15** — Zod validates SEO structured data too
4. **16 last** — E2E tests cover the fully standardized + SEO-equipped site
5. **18 after 16** — Keystatic plugs into 17b's service seam; SEO metadata becomes first test collection

---

## Sub-slices

### 17a — Design System + CSS Consolidation

**Est. Sessions:** 4-5
**Depends on:** 13
**Why first:** The design system is the foundation everything else builds on. Brand primitives, type scale, color tokens, and component patterns must be locked before extracting shared shells (17d) or standardizing component APIs.

This is the biggest sub-slice and the most impactful. Every other sub-slice depends on the discipline established here.

#### Scope

**1. Semantic type scale — big, legible, uniform:**

Replace the 275 ad-hoc font-size declarations with a semantic type scale. Currently tokens.css defines sizes nobody uses. The new scale is the only way to set text size.

| Token | Desktop | Mobile (clamp) | Usage |
|-------|---------|----------------|-------|
| `--text-display` | 4rem (64px) | clamp(2.5rem, 5vw, 4rem) | Hero headlines, page titles |
| `--text-title` | 2.5rem (40px) | clamp(1.75rem, 4vw, 2.5rem) | Section headings (H2) |
| `--text-heading` | 1.5rem (24px) | clamp(1.25rem, 3vw, 1.5rem) | Card titles, H3 |
| `--text-subheading` | 1.125rem (18px) | 1.125rem | Subtitles, H4 |
| `--text-body` | 1rem (16px) | 1rem | Paragraphs, descriptions |
| `--text-body-lg` | 1.125rem (18px) | 1.125rem | Lead paragraphs, hero subtitles |
| `--text-small` | 0.875rem (14px) | 0.875rem | Metadata, labels |
| `--text-caption` | 0.75rem (12px) | 0.75rem | Timestamps, footnotes |
| `--text-mono` | 0.8125rem (13px) | 0.8125rem | Terminal text, code, SQL |

**Rule:** Body text is never smaller than 16px. Terminal/mono text never smaller than 13px. Labels never smaller than 12px. If you need a size not in this table, the answer is "use the closest one," not "add a new arbitrary value."

Map each token to Tailwind `@theme` so `text-display`, `text-title`, `text-heading`, `text-body` etc. work as utility classes.

**2. Brand primitives — shared components in `src/lib/components/brand/`:**

Extract every duplicated brand pattern into a single reusable component.

| Primitive | Replaces | Props |
|-----------|----------|-------|
| `TerminalChrome` | 5 different terminal window implementations (InfraFrame, HeroSqlPanel, AboutCta, ContactPage terminals, Manifesto) | `title`, `tag`, `status`, `footer[]`, `children` (slot) |
| `HazardStripe` | 5 implementations across StationDivider, ProofStrip, StationTabs, InfraFrame, HeroBanner | `height?`, `angle?`, `label?` |
| `GradientSeparator` | Already exists but hardcodes hex — migrate to tokens | `label?`, `maxWidth?` |
| `TerminalCursor` | Already exists, well-built — just enforce usage | (no changes needed) |
| `CardBase` | 6 different card implementations (WorkCard, BlogRow, ProjectCard, ProjectMiniCard, ServiceCard, StackNode) | `hover?`, `glow?`, `children` (slot) |
| `SectionLabel` | Repeated `// LABEL` mono text pattern across home sections | `text`, `align?` |
| `LiveDot` | Duplicated pulsing dot in HeroSqlPanel, InfraFrame, StationTabs | `color?`, `pulse?` |

**TerminalChrome is the big win.** Five components build the same visual: dark background, mono font, top bar with LED/tag, hazard stripe accent, status footer. After this, building a new terminal-style section = `<TerminalChrome title="analysis.sql"><YourContent /></TerminalChrome>`.

**These primitives are portable.** They use tokens for colors and have no data dependencies. You could drop `brand/` into another SvelteKit project, import `tokens.css`, and the brand renders.

**3. Color token lockdown:**

- Audit every `.svelte` file. Replace all 192 hardcoded hex colors with `var()` tokens or Tailwind brand utilities
- GradientSeparator: `#E07800` → `var(--brand-primary)`, `#FFB627` → `var(--brand-accent)`
- StationDivider: inline `style=` gradient → use `HazardStripe` component
- HeroSqlPanel: `border-[var(--border-subtle)]` → just `border-border-subtle`
- Every color consumed via semantic tokens, never raw hex

**Light theme preparation:**
- Complete the `[data-theme="light"]` block in tokens.css with ALL semantic tokens (currently only 7 of ~15 are defined)
- Add missing light tokens: `--bg-terminal`, `--border-subtle`, `--text-dim`, `--status-live`, `--bg-manifesto`
- Verify every component only uses `var(--token)` for colors — no hardcoded dark values remain
- Light theme is not shipped in this slice, but it's one toggle away

**4. Spacing + layout system:**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-section` | 6rem (96px) | Between major page sections |
| `--space-card` | 1.5rem (24px) | Card internal padding |
| `--space-card-gap` | 1.5rem | Grid gap between cards |
| `--space-inline` | 0.5rem | Inline element spacing |
| `--container-max` | per breakpoint | Page-level max-width |

**5. Brand color scalability:**

- `--brand-*` naming convention with clear roles:
  - `--brand-primary` (#E07800) — actions, links, emphasis
  - `--brand-accent` (#FFB627) — secondary emphasis, hover states, hazard stripes
  - `--brand-primary-hover` (#C96A00) — interactive hover
  - `--brand-accent-hover` (#E5A220) — secondary hover
  - Future: `--brand-secondary`, `--brand-tertiary` follow same pattern
- Color addition checklist in CSS.md:
  1. Add `--brand-[name]` to tokens.css
  2. Add `@theme` entry in app.css
  3. Map to semantic tokens if it replaces a role
  4. Update CSS.md

**6. Responsive breakpoint system:**

| Breakpoint | Width | Purpose |
|------------|-------|---------|
| `sm` | 360px | Mobile |
| `md` | 520px | Foldable / large phone |
| `lg` | 768px | Tablet |
| `xl` | 1024px | Laptop |
| `2xl` | 1440px | Desktop |

- Define in `tokens.css` (custom properties) + `app.css` (`@theme` screens)
- Audit every component for ad-hoc `max-width`/`min-width` — consolidate to canonical values
- Container strategy: one `--container-max` per breakpoint, consumed by layout shell
- Touch target rule: minimum 44x44px on `sm` and `md`
- Grid behavior per tier: document columns for each major layout at each breakpoint
- Math-derived sizes, modern viewport units: `svh`, `lvh`, `dvh`, `env(safe-area-inset-*)`

**7. Scoped style audit — enforce separation:**

Every component's `<style>` block gets audited:
- Colors → move to `var()` tokens
- Font sizes → move to type scale tokens
- Spacing → move to spacing tokens or Tailwind utilities
- Keep ONLY: grid templates, position, overflow, keyframes, pseudo-elements, component-specific layout

**8. Animation & GSAP cleanup:**

- GSAP does NOT work reliably inside Svelte 5 `$effect()` — timeline callbacks (`onComplete`) never fire. Ref: [dev.to/jasper-clarke](https://dev.to/jasper-clarke/integrating-svelte-5-with-gsap-3-54no)
- Audit every component using GSAP in `$effect()` and migrate to:
  - **Svelte actions** (`use:animate`) for element-lifecycle animations
  - **CSS transitions** for state-driven open/close/toggle (MenuOverlay is reference)
- Create shared `src/lib/motion/utils/animate.ts` action wrapping GSAP with `destroy()` cleanup
- Document animation strategy in CSS.md

**9. Create `docs/CSS.md`:**

- The design system architecture: tokens → @theme → brand primitives → components
- Every token with purpose, default value, and which components consume it
- Type scale reference with visual examples
- Color palette with semantic role descriptions
- Brand primitive component reference with usage examples
- Rules: what goes in tokens vs @theme vs scoped style
- Color addition checklist
- Breakpoint reference table (container width, padding, grid columns, heading sizes)
- Animation strategy (GSAP actions vs CSS transitions vs Svelte transitions)

#### Acceptance Criteria

- [ ] Zero hardcoded hex colors in any `.svelte` file (all through tokens or @theme)
- [ ] Brand primitives directory exists (`src/lib/components/brand/`) with all shared components
- [ ] `TerminalChrome` used by all terminal-style UIs (replaced 5 implementations)
- [ ] `HazardStripe` used by all hazard stripe instances (replaced 5 implementations)
- [ ] `CardBase` exists as shared card foundation
- [ ] Semantic type scale enforced — no arbitrary `text-[Npx]` in templates
- [ ] Body text never smaller than 16px, mono never smaller than 13px
- [ ] `[data-theme="light"]` has all semantic tokens defined (not shipped, but ready)
- [ ] CSS.md exists and covers the full design system
- [ ] Adding a new brand color requires exactly 2 file edits (tokens.css + app.css)
- [ ] All responsive breakpoints use only the five canonical values
- [ ] Touch targets meet 44x44px minimum on mobile/foldable
- [ ] Typography uses `clamp()` for headings with documented min/max values
- [ ] Zero GSAP usage inside `$effect()` — all migrated to actions or CSS transitions
- [ ] Shared `animate.ts` action exists with proper cleanup
- [ ] No horizontal scroll at any breakpoint
- [ ] `--container-max` is single source of truth for page-width containment
- [ ] `bun run build` succeeds
- [ ] `bun run test` passes

---

### 17b — Service Layer Extraction

**Est. Sessions:** 2
**Depends on:** 17a

#### Scope

Split data definition from data access. Every content type gets `src/lib/services/*.service.ts` with typed query functions.

**Services to create:**

| Service File | Functions | Source Data |
|-------------|-----------|-------------|
| `project.service.ts` | `getAllProjects()`, `getProjectBySlug()`, `getFeaturedProjects()`, `getPublicProjects()`, `getProjectsByService()`, `getAllTags()`, `getAllStackItems()` | `projects.ts` |
| `service.service.ts` | `getAllServices()`, `getServiceById()`, `getVisibleServices()`, `getAdjacentServices()` | `services.ts` |
| `blog.service.ts` | `getAllPosts()`, `getPostBySlug()`, `getPostHtml()`, `getPostsByCategory()`, `getTagsForCategory()`, `getLanguagesForCategory()`, `getSvgContent()`, `getLatestPosts()` | `blog.ts` |
| `meta.service.ts` | `getSiteMeta()`, `buildPersonSchema()` | `meta.ts`, `schema.ts` |
| `tech-stack.service.ts` | `getAllTechItems()`, `getTechItemById()`, `getTechItemsByLayer()`, `getConnections()`, `getAllScenarios()`, `getScenarioForDomains()` | `tech-stack.ts` |
| `content.service.ts` | `getHeroContent()`, `getAboutContent()`, `getCtaContent()`, `getNavLinks()`, `getErrorPageContent()` | `content.ts`, `nav.ts`, `about-page.ts`, `contact-page.ts` |

**This is THE Keystatic seam.** Slice 18 swaps the service implementation from reading `.ts` data files to reading Keystatic Reader API. Route loaders, components, tests — everything downstream stays identical.

**Migration pattern:**
```
Before: import { getProjectBySlug } from '$lib/data'
After:  import { getProjectBySlug } from '$lib/services/project.service'
```

The `$lib/data/index.ts` barrel export stays for backward compatibility during migration but route loaders must not import from it.

#### Acceptance Criteria

- [ ] `src/lib/services/` directory exists with all service files
- [ ] No route loader imports from `$lib/data/*.ts` directly (all through services)
- [ ] Service functions are typed with explicit return types
- [ ] Every service function has JSDoc
- [ ] `bun run test` passes

---

### 15 — SEO + Metadata (INSERTED HERE)

> Full spec remains in `docs/PLAN.md` under Slice 15.
> Built on the service layer from 17b — `<SeoHead>` calls services, not raw data files.
> This is why 17b comes before 15.

---

### 17c — Zod Schema Validation

**Est. Sessions:** 0.5
**Depends on:** 15 (runs after SEO so Zod validates structured data too)

#### Scope

Every content type gets a Zod schema in `src/lib/schemas/`. Services parse raw data through schemas before returning to loaders.

**Schemas to create:**

| Schema | Validates |
|--------|-----------|
| `LocalizedStringSchema` | `{ en: string, fr?: string, es?: string }` |
| `ProjectSchema` | Full project shape including sections, status, links |
| `ServiceSchema` | Service with optional detail sections |
| `BlogPostSchema` | Frontmatter + parsed content |
| `SiteMetaSchema` | Owner, links, address, description |
| `ContentSchema` | Hero text, about text, CTA text |
| `SeoSchema` | JSON-LD structured data (Person, BlogPosting, Service, BreadcrumbList) |

TypeScript interfaces catch build-time errors. Zod catches runtime errors from external data. When Keystatic feeds content as JSON, the schema layer guarantees components never receive malformed data.

#### Acceptance Criteria

- [ ] Zod schemas exist for Project, Service, BlogPost, SiteMeta, Content, LocalizedString, SEO data
- [ ] Services validate data through schemas before returning
- [ ] Schema validation errors produce clear, actionable messages (not generic Zod dumps)
- [ ] `bun run check` + `bun run test` pass

---

### 17d — Component API Standardization + Shared UI Shells

**Est. Sessions:** 3
**Depends on:** 17c

#### Scope

**Prop interfaces:** Audit all components. Props use exported TypeScript interfaces. Shared prop patterns extracted:

| Mixin | Fields |
|-------|--------|
| `WithAnimation` | `animate?: boolean`, `animationDelay?: number` |
| `WithLocale` | `locale?: Locale` |
| `WithTestId` | `testId?: string` |

**Shared UI shells:** Blog, work, and services pages repeat layout patterns. Extract into composable shells:

| Shell | Replaces | Used By |
|-------|----------|---------|
| `ListingShell` | Repeated sidebar + grid + empty state | Blog listing, Work listing, Services listing |
| `DetailShell` | Repeated hero + sections + nav + related | Blog detail, Work detail, Service detail |
| `FilterChips` | Repeated tag/filter bar | Blog filters, Work filters, Stack filters |
| `CollapsibleSection` | Already exists, needs ARIA audit | Service detail, About sections |
| `EmptyState` | Repeated "no results" messaging | All listing pages |

**Note:** `CardBase` is extracted in 17a as a brand primitive. This slice wires all card variants (WorkCard, BlogRow, ProjectCard, etc.) to use it. `TerminalChrome` from 17a is also wired into HeroSqlPanel, ContactPage, AboutCta, etc.

#### Acceptance Criteria

- [ ] Every component exports its props interface
- [ ] No inline prop types anywhere
- [ ] Shared `ListingShell` used by blog, work, and services listing pages
- [ ] Shared `CardBase` used by all card variants
- [ ] All content access through `resolveLocale()`
- [ ] `bun run test` passes

---

### 17e — Motion Consolidation

**Est. Sessions:** 2
**Depends on:** 17d

#### Scope

Extract ad-hoc inline GSAP calls into reusable timeline factories in `src/lib/motion/factories/`:

| Factory | Replaces |
|---------|----------|
| `createRevealTimeline()` | Scattered scroll-reveal setups across 10+ components |
| `createStaggerTimeline()` | Repeated stagger patterns for lists, grids, tags |
| `createMorphAnimation()` | MorphSVGPlugin calls in BlogSvgIcon, WorkSvgIcon, StackNode |
| `createDrawAnimation()` | DrawSVGPlugin calls for metro lines, connections |

All factories enforce `prefers-reduced-motion` at the utility level so individual components don't need to check.

**Current state:** 58 files reference reduced-motion but enforcement is scattered. Post-refactor, the 4 factories are the single enforcement point.

**Target:** 80%+ of components use factories instead of raw GSAP.

#### Acceptance Criteria

- [ ] Motion factories exist in `src/lib/motion/factories/`
- [ ] 80%+ of components use factories instead of raw GSAP
- [ ] Reduced-motion enforcement at factory level, not duplicated per component
- [ ] All existing animations behave identically
- [ ] `bun run test` passes

---

### 17f — Test Architecture + Documentation

**Est. Sessions:** 1-2
**Depends on:** 17e

#### Scope

**Test factories:** Shared data builders for all content types so tests don't repeat setup:

| Factory | Creates |
|---------|---------|
| `createMockProject()` | Project with sensible defaults, overridable fields |
| `createMockService()` | Service with detail sections |
| `createMockBlogPost()` | BlogPost with frontmatter |
| `createMockSiteMeta()` | SiteMeta with links, address |
| `createMockTechItem()` | TechStackItem with connections |

Service tests mock the data source so they work unchanged when Slice 18 swaps it.

**Documentation updates:**
- ARCHITECTURE.md with layer diagram and import rules
- `src/lib/README.md` explaining the import hierarchy
- Optimize test architecture: target 90%+ coverage without slow test suites

#### Acceptance Criteria

- [ ] Test factories exist for all content types in a shared location
- [ ] Service tests mock data source (not real data files)
- [ ] Consistent test naming: `*.test.ts`
- [ ] ARCHITECTURE.md reflects layered system with import rules table
- [ ] `src/lib/README.md` explains the import hierarchy
- [ ] `bun run test` passes with new test structure
- [ ] `bun run check` passes

---

### 17g — Learning Docs Refactor

**Est. Sessions:** 2
**Depends on:** 17f

#### Scope

Full sweep of `docs/learn/` to align with the restructured codebase. Every learn doc that references moved/renamed/refactored code needs its "How We Use It" table and "Worked Example" updated to new locations and patterns.

**Updates:**
1. Scan every `.md` in `docs/learn/` for file paths that no longer exist. Update to new locations.
2. Update "Worked Example" code snippets where patterns changed (inline GSAP → factory call, direct data import → service call).

**New learn docs:**
- `data-layer/service-layer-pattern.md`
- `data-layer/zod-validation.md`
- `frontend/shared-ui-shells.md`
- `motion/motion-factories.md`
- `testing/test-factories.md`
- `styling/css-architecture-docs.md`

**Meta updates:**
- Update `meta.json` with new concepts and revised prerequisites
- Update `docs/learn/README.md` learning paths if domains shifted

New docs follow `docs/learn/_template.md`.

#### Acceptance Criteria

- [ ] Zero broken file references in any learn doc
- [ ] New learn docs exist for all 17-introduced concepts
- [ ] `meta.json` reflects the post-17 architecture
- [ ] `bun run check` passes (no code touched)

---

## Global Acceptance Criteria

Every sub-slice must pass these:

- [ ] `bun run build` succeeds
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Site looks and behaves identically before and after
- [ ] Zero new features introduced
- [ ] Zero visual changes

## Scope Boundaries

**In scope:** CSS consolidation, CSS.md, service layer, Zod schemas, shared UI shells, motion factories, test utilities, documentation, learning docs refactor.

**Out of scope:** CMS integration (Slice 18), new features, visual changes, SEO implementation (Slice 15 — runs between Phase 1 and Phase 2), E2E tests (Slice 16 — runs after Phase 2).

## What You'll Learn

CSS architecture documentation, service layer pattern (ports & adapters), Zod runtime validation ("parse, don't validate"), DRY component composition with Svelte 5 snippets/slots, test factory pattern, hexagonal architecture lite.
