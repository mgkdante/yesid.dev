# Slice 17 — Standardization: Design System + Ports & Adapters

**Status:** approved
**Date:** 2026-04-11
**Est. Sessions:** 20.5-23.5 (across 9 sub-slices)
**Depends on:** Slice 00 (Repo Hygiene) complete, Slice 13 (Home Page) complete
**Key constraint:** Visual IMPROVEMENTS allowed (bigger text, better consistency), but no new features. Structural refactor + design system unification.

---

## 1. Philosophy

Two goals, one slice:

1. **Design system.** The site should feel like one product, not 22 slices bolted together. One change to a token, a card style, or a type scale cascades everywhere. Adding a light theme = swapping one file, zero component edits. Brand components (terminals, dividers, cursors, cards) are reusable primitives, not one-off implementations.

2. **Architecture.** The codebase should read like a blueprint. Types define shape, schemas validate, services query, loaders orchestrate, components render. Each layer has one job. The seam between data source and service layer is where Slice 18 (Keystatic) plugs in with zero component changes.

**Design principles:** CLEAN, DRY, SCALABLE, MAINTAINABLE, SUSTAINABLE.

---

## 2. Current State (Codebase Audit — April 2026)

### 2.1 Color Token Violations

| Issue | Count | Files |
|-------|-------|-------|
| Hardcoded hex colors (`#xxx`) in `.svelte` | **411** | 63 |
| `rgba(224,120,0,...)` brand orange bypassing tokens | **151** | 37 |
| `border-[#2a2a2a]` instead of `var(--border-subtle)` | **36** | 17 |
| `bg-[#1a1a1a]` — no token exists | **17** | 15+ |
| `bg-[#141414]` instead of `var(--bg-primary)` | **16** | 8+ |
| `text-[#E07800]` instead of brand token | **21** | 10+ |
| `border-[#333]` — no token exists | **10** | 9 |
| Inline `style=` attributes | **147** | 47 |
| Arbitrary `text-[Npx]` values | **116** | 31 |

**Missing semantic color tokens:** `--bg-card` (#1a1a1a, 17 uses), `--border-strong` (#333, 18 uses), `--status-error` (#ff5f57, 5+ uses), `--status-success` (#28c840, 5+ uses), `--text-code` (#ccc, 5 uses), `--bg-deep` (#0D0D0D, 3 uses).

### 2.2 Token Category Gaps

| Category | Tokens Defined | Actual Usage | Gap |
|----------|---------------|-------------|-----|
| Type scale | 6 sizes (not in @theme) | 116 arbitrary values | @theme gap + migration needed |
| Shadows | **0** | 31 unique box-shadow declarations | Full gap |
| Z-index | **0** | 14 distinct values across 47 declarations | Full gap |
| Transitions | **0** | 42 unique declarations, 4 unnamed beziers | Full gap |
| Opacity | **0** | 23 distinct values | Full gap |
| Containers | **0** | 6+ distinct max-widths | Full gap |
| Spacing | Delegated to Tailwind | Consistent (Tailwind 4px grid) | OK |
| Radius | Split-brained (tokens.css vs @theme names differ) | `rounded-sm` resolves to Tailwind default (2px) not brand (4px) | Naming gap |
| Light theme | 7 of ~20 tokens defined | 5 dark-only tokens have no light equivalent | Partial gap |

### 2.3 Duplicated Brand Patterns

**Components (15 extractions needed):**

| Pattern | Occurrences | Files | Extract As |
|---------|------------|-------|------------|
| Cursor-follow glow overlay div | **12** | About* (8), BlogRow, ProjectMiniCard, WorkCard, AboutCta | `<GlowOverlay>` component |
| Terminal chrome (header + body) | 5 | InfraFrame, HeroSqlPanel, AboutCta, ContactPage (2), Manifesto | `<TerminalChrome>` component |
| Hazard stripes | **10+** | StationDivider, ProofStrip, StationTabs, InfraFrame, HeroBanner, HomeCloser, +page, +error, tech-stack, Manifesto, AboutPage | `<HazardStripe>` component (3 sizes) |
| Card hover glow (box-shadow + transition) | **8+** | WorkCard, ProjectMiniCard, InfraFrame, AboutPage, ServiceCard, ServiceDetailPage, WorkServiceBadge, StackNode, StackConfigurator, StackFilters, HomeServices, ProofReel | `<CardBase>` component |
| Pulsing status dot | **7** | HeroSqlPanel, Footer, Manifesto, SkillsJourney (2), HomeCloser, InfraFrame | `<StatusDot>` component (orange/green) |
| Section label typography | **12+** | WorkCard, WorkFilterMobile, BlogFilter*, FilterGroup, AboutBento, WorkDetailSidebar, TableOfContents | `<SectionLabel>` component (3 variants) |
| CTA button styles | **5+** | HeroBanner (2), SkillsJourney, AboutCta, Hero, ContactPage | `<BrandButton>` component (primary/ghost, sm/md/lg) |
| Tech tag pill | **8+** | WorkCard, WorkDetailSidebar, BlogDetailHeader, BlogRow, ProjectCard, TagList, FilterGroup, ProofReel | `<Tag>` component (xs/sm) |
| Numbered circle badge | 3 | BlogRow, CollapsibleSection, WorkListingPage | `<NumberBadge>` component |
| Sticky sidebar panel | **4** | blog/[slug], WorkDetailPage, WorkDetailSidebar, BlogFilterSidebar | `<StickyPanel>` component |
| Blink cursor keyframes | 3 (beyond TerminalCursor) | Manifesto, HomeCloser, ConstructionScene | Global `@keyframes blink` |
| Circuit grid background | 3 | app.css, InfraFrame, Manifesto | Extend `.circuit-grid` utility |

**Utility classes (6 extractions needed):**

| Pattern | Occurrences | Extract As |
|---------|------------|------------|
| Brand fade-out separator | 5 files | `.brand-fade-line` |
| Dashed divider | 9 files | `.divider-dashed` |
| Hidden scrollbar | 5 files | `.scrollbar-hidden` |
| Brand glow hover | 8+ files | `.brand-glow-hover` |
| Image desaturate on hover | 3 files | `.img-desat` / `.img-reveal` |
| Responsive card grid | 3 files | `.grid-responsive-cards` |

**Action enhancement:**

| Action | Issue | Fix |
|--------|-------|-----|
| `cursorGlow` | 12 consumers manually create identical overlay div | Auto-inject overlay in the action |

### 2.4 Cross-Page Component Unification

These serve the **same purpose** on different pages but are implemented separately:

| Component Pair | Lines | Unify Into | Shared By |
|---------------|-------|------------|-----------|
| `WorkFilterMobile` + `BlogFilterMobile` | ~180 + ~160 | `<FilterMobile>` with config prop | Work, Blog |
| `WorkFilterSidebar` + `BlogFilterSidebar` | ~130 + ~120 | `<FilterSidebar>` with config prop | Work, Blog |
| `WorkListingPage` + `BlogListingPage` | 366 + 272 | `<ListingShell>` wrapper | Work, Blog, Services |
| `BlogSvgIcon` + `WorkSvgIcon` | 241 + ~120 | `<SvgIcon>` with morph variants | Blog, Work |
| 6 card variants | varies | `<CardBase>` + domain adapters | All listing pages |

### 2.5 Component Architecture

| Metric | Count |
|--------|-------|
| Total Svelte components | 66 |
| Components exporting prop interfaces | **0** |
| Components with inline-only prop types | 62 |
| Components directly importing from `$lib/data` | **16** |
| Components over 200 lines | **28** |
| Components over 700 lines | 4 (Manifesto 1021, SkillsJourney 983, HomeCloser 859, HeroBanner 731) |
| Suppressed a11y warnings (instead of fixed) | **12** across 6 files |
| Test files | 66 |
| `src/lib/services/` exists | No |
| `src/lib/schemas/` exists | No |
| `src/lib/components/brand/` exists | No |

### 2.6 Repeated Prop Patterns (Mixin Candidates)

| Prop Pattern | Components | Extract As |
|-------------|-----------|------------|
| `accentColor?: string` (defaults to #E07800) | 10+ | `AccentColorProps` |
| `stop?: string; label?: string` (metro stop) | 9 (all About bento cards) | `MetroStopProps` |
| `activeTag/onTagSelect/activeLang/onLangSelect` | 3+ | `FilterStateProps` |
| `svgContent` | 3 | Part of `SvgIcon` |
| `index: number` | 7+ | Consider `WithIndex` |

---

## 3. Target Architecture

### 3.1 Design System (Cascading Foundation)

```
tokens.css — THE source of truth
  Semantic color props (--bg-surface, --text-primary, --bg-card, --status-*)
  Theme switching: [data-theme="dark"] / [data-theme="light"]
  Type scale (9 tokens with clamp() for responsive)
  Shadow scale (7 tokens: glow-sm/md/lg, card, section, nav, status)
  Z-index scale (7 tokens: base, rail, footer, sheet, menu, nav, max)
  Transition tokens (duration-fast/normal/slow, ease-bounce/decel)
  Opacity tokens (muted/dim/subtle/faint)
  Container tokens (content/wide/prose)
  Brand colors with hover variants
  Spacing delegated to Tailwind's 4px grid
  ─────────────────��───────────────────────────────────
app.css @theme — Tailwind token bridge
  Maps ALL tokens to Tailwind utilities
  Type scale: text-display, text-title, text-heading, text-body, etc.
  Shadows: shadow-glow-sm, shadow-glow-md, shadow-card, etc.
  Z-index: z-rail, z-sheet, z-menu, z-nav
  Radius: UNIFIED naming (no split-brain)
  Container: max-w-content, max-w-wide, max-w-prose
  ─────────────────────────────────────────────────────
app.css utility classes
  .brand-fade-line, .divider-dashed, .scrollbar-hidden
  .brand-glow-hover, .img-desat, .grid-responsive-cards
  .label-section, .label-station, .label-metric
  Global @keyframes: blink, pulse-glow
  ─────────────────────────────────────────────────��───
Brand Primitives (src/lib/components/brand/)
  TerminalChrome, HazardStripe, CardBase, StatusDot,
  GlowOverlay, BrandButton, Tag, NumberBadge,
  SectionLabel, StickyPanel, GradientSeparator, TerminalCursor
  ────────────────────────────────────────────────────��
Shared UI Shells (src/lib/components/shared/)
  ListingShell, FilterMobile, FilterSidebar,
  SvgIcon, DetailShell, EmptyState
  ──────────────────────────────────────────────────���──
Domain Components (src/lib/components/)
  Compose brand primitives + shared shells
  Props via exported interfaces + shared mixins
  Data via props only (never import $lib/data)
  Scoped <style> for layout ONLY (grid, position, overflow, keyframes)
```

**The cascade guarantee:** Changing `--brand-primary` in tokens.css changes the orange everywhere. Zero component edits.

**Light theme guarantee:** Adding `[data-theme="light"]` values switches every component. No component knows whether it's dark or light.

### 3.2 Application Architecture (Data Flow)

```
Route Loaders (+page.ts / +page.server.ts)
  Import from services only. Never touch data files.
  ─────────────────────────────────────────────────────
Service Layer (src/lib/services/*.service.ts)
  Typed query functions. JSDoc. Explicit returns.
  THE SEAM: Keystatic swaps here, nothing else moves.
  ─────────────────────────────────────────────────────
Zod Schemas (src/lib/schemas/*.ts)
  Runtime validation. Parse, don't validate.
  ─────────────────────────────────────────────────────
Data Layer (src/lib/data/*.ts)
  Raw data definitions. Types. Constants.
  No query logic.
  ─────────────────────────────────────────────────────
Components (src/lib/components/**/*.svelte)
  Exported prop interfaces. Shared UI shells.
  Consume brand primitives + resolved data via props.
  ─────────────────────────────────────────────────────
Motion (src/lib/motion/)
  Actions for DOM lifecycle. Factories for timelines.
  Reduced-motion enforced at factory level.
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
| Components → Brand primitives | Yes |
| Components → Shared UI shells | Yes |
| Components → Motion actions | Yes |
| Motion factories → GSAP | Yes |
| Components → Raw GSAP | Discouraged (use factories) |

---

## 4. Token Specifications

### 4.1 Semantic Type Scale

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

**Hard rules:** Body text never < 16px. Mono never < 13px. Labels never < 12px. No `text-[Npx]` arbitrary values.

### 4.2 Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-glow-sm` | `0 0 6px color-mix(in srgb, var(--brand-primary) 30%, transparent)` | Status dots, subtle emphasis |
| `--shadow-glow-md` | `0 0 12px color-mix(in srgb, var(--brand-primary) 20%, transparent)` | Active states, menu items |
| `--shadow-glow-lg` | `0 0 24px color-mix(in srgb, var(--brand-primary) 15%, transparent), 0 0 60px color-mix(in srgb, var(--brand-primary) 6%, transparent)` | Service cards, featured items |
| `--shadow-card` | `0 0 16px color-mix(in srgb, var(--brand-primary) 8%, transparent), 0 2px 8px rgba(0,0,0,0.3)` | Card hover state |
| `--shadow-section` | `0 8px 32px color-mix(in srgb, var(--brand-primary) 6%, transparent)` | Elevated sections |
| `--shadow-nav` | `0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)` | Nav glass |
| `--shadow-status` | `0 0 6px color-mix(in srgb, var(--status-success) 40%, transparent)` | Green status dots |

**Note:** Shadow tokens use `color-mix()` (Decision D6) to stay connected to brand tokens. This means changing `--brand-primary` automatically updates all glow shadows. Browser support: 97%+ (baseline 2023).

### 4.3 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default stacking |
| `--z-content` | 1 | Content above base |
| `--z-rail` | 30 | Scroll rail, sticky elements |
| `--z-footer` | 40 | Footer overlap |
| `--z-sheet` | 50 | Bottom sheets, panels |
| `--z-menu` | 60 | Menu overlay |
| `--z-nav` | 70 | Navigation (always on top) |

### 4.4 Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions (hover color, opacity) |
| `--duration-normal` | 200ms | Standard transitions (border, shadow) |
| `--duration-slow` | 300ms | Layout transitions (expand, slide) |
| `--duration-slower` | 500ms | Complex transitions (page, modal) |
| `--ease-default` | ease | General purpose |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful overshoot |
| `--ease-decel` | cubic-bezier(0, 0, 0.2, 1) | Entering elements |

### 4.5 Missing Semantic Color Tokens

| Token | Dark Value | Purpose |
|-------|-----------|---------|
| `--bg-card` | #1a1a1a | Card/container surfaces (17 current uses) |
| `--bg-deep` | #0D0D0D | Deepest background |
| `--border-strong` | #333333 | Stronger borders, dashed dividers (18 uses) |
| `--status-error` | #ff5f57 | Terminal red, error states |
| `--status-success` | #28c840 | Terminal green, success states |
| `--text-code` | #cccccc | Inline code, terminal output |

### 4.6 Container Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--container-content` | 64rem (1024px) | Primary content width |
| `--container-wide` | 72rem (1152px) | Wide layouts (work detail) |
| `--container-prose` | 65ch | Blog/service prose columns |

### 4.7 Responsive Breakpoints

| Breakpoint | Width | Purpose |
|------------|-------|---------|
| `sm` | 360px | Mobile |
| `md` | 520px | Foldable / large phone |
| `lg` | 768px | Tablet |
| `xl` | 1024px | Laptop |
| `2xl` | 1440px | Desktop |

Touch target minimum: 44x44px on `sm` and `md`.

---

## 5. Brand Primitive Specifications

### 5.1 Components (`src/lib/components/brand/`)

| Component | Replaces | Props | Notes |
|-----------|----------|-------|-------|
| `TerminalChrome` | 5 terminal implementations | `title`, `tag?`, `status?`, `footer?`, `children` (snippet) | The big DRY win |
| `HazardStripe` | 10+ stripe implementations | `size?: 'sm' | 'md' | 'lg'`, `angle?`, `label?` | 3 size variants (6px/8px/12px) |
| `CardBase` | 8+ card hover/glow patterns | `hover?`, `glow?`, `interactive?`, `children` (snippet) | Foundation for all cards |
| `GlowOverlay` | 12 manual overlay divs | `intensity?: number` | Visual element. `cursorGlow` action injects this automatically — consumers use the action, not the component directly. |
| `StatusDot` | 7 pulsing dot implementations | `color?: 'orange' | 'green'`, `pulse?: boolean` | Replaces duplicated keyframes |
| `SectionLabel` | 12+ label patterns | `text`, `variant?: 'section' | 'station' | 'metric'`, `align?` | 3 typography variants |
| `BrandButton` | 4+ CTA styles | `variant?: 'primary' | 'ghost'`, `size?: 'sm' | 'md' | 'lg'`, `href?` | Unifies all CTAs |
| `Tag` | 8+ pill implementations | `text`, `size?: 'xs' | 'sm'`, `active?`, `accentColor?` | Tech tags, filter chips |
| `NumberBadge` | 3 numbered circles | `value: number`, `color?` | Mono text in colored circle |
| `StickyPanel` | 4 sticky sidebar patterns | `children` (snippet) | Sidebar with scroll and border |
| `GradientSeparator` | Exists, needs token fix | `label?`, `maxWidth?` | Migrate hex → tokens |
| `TerminalCursor` | Exists, enforce usage | (no changes) | Remove 3 duplicate blink keyframes |

### 5.2 Shared UI Shells (`src/lib/components/shared/`)

| Shell | Replaces | Props | Used By |
|-------|----------|-------|---------|
| `ListingShell` | WorkListingPage + BlogListingPage structure | `searchPlaceholder`, `filters` (snippet), `content` (snippet), `emptyState` (snippet) | Blog, Work, Services |
| `FilterMobile` | WorkFilterMobile + BlogFilterMobile | `filterConfig`, `activeFilters`, `onClear` | Blog, Work |
| `FilterSidebar` | WorkFilterSidebar + BlogFilterSidebar | `filterConfig`, `activeFilters`, `onClear` | Blog, Work |
| `SvgIcon` | BlogSvgIcon + WorkSvgIcon | `svgContent`, `morphTargets?`, `entranceType?` | Blog, Work |
| `DetailShell` | Repeated hero + sections + nav pattern | `header` (snippet), `sidebar` (snippet), `content` (snippet) | Blog detail, Work detail, Service detail |
| `EmptyState` | Repeated "no results" messaging | `message`, `icon?` | All listing pages |

### 5.3 Utility Classes (in `app.css`)

| Class | Replaces | Definition |
|-------|----------|------------|
| `.brand-fade-line` | 5 gradient separator patterns | `background: linear-gradient(90deg, var(--brand-primary), transparent)` |
| `.divider-dashed` | 9 dashed border patterns | `border-top: 1px dashed var(--border-strong)` |
| `.scrollbar-hidden` | 5 hidden scrollbar patterns | `scrollbar-width: none` + webkit hide |
| `.brand-glow-hover` | 8+ hover shadow patterns | Shadow + transition bundle |
| `.img-desat` | 3 grayscale patterns | `filter: grayscale(1) brightness(0.4)` with transition |
| `.grid-responsive-cards` | 3 responsive grid patterns | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `.label-section` | 12+ section labels | `font-mono text-caption uppercase tracking-widest text-muted` |
| `.label-station` | 6 station labels | `font-mono text-small tracking-[3px] text-brand-primary` |
| `.label-metric` | 6 metric labels | `font-mono text-caption tracking-[2px] text-muted` |

### 5.4 Action Enhancement

| Action | Change | Impact |
|--------|--------|--------|
| `cursorGlow` | Auto-inject the `pointer-events-none absolute inset-0` overlay div | Removes 12 duplicate markup blocks |

### 5.5 Global Keyframes (in `app.css`)

| Keyframe | Currently Duplicated In | After |
|----------|------------------------|-------|
| `@keyframes blink` | Manifesto, HomeCloser, ConstructionScene (+ TerminalCursor) | One definition in app.css |
| `@keyframes pulse-glow` | InfraFrame, AboutPage, tech-stack, Manifesto, Footer, HeroSqlPanel | One definition with CSS variable for color |

---

## 6. Execution Sequence

```
Phase 1 — Foundation
  17a-1: Token Foundation .............. 3 sessions
  17a-2: Brand Primitives .............. 3 sessions
  17a-3: Color Lockdown ................ 3 sessions
  17b:   Service Layer Extraction ...... 2 sessions
    ↓
  15: SEO + Metadata (built on service layer)
    ↓
Phase 2 — Standardization
  17c: Zod Schema Validation ........... 0.5 sessions
  17d: Component API + Shared Shells ... 4 sessions
  17e: Motion Consolidation ............ 2-3 sessions
  17f: Test Architecture ............... 1-2 sessions
  17g: Learning Docs ................... 2 sessions
    ↓
  16: E2E + QA
    ↓
  18: Keystatic
```

**Why this sequence:**
1. 17a-1 defines the token system everything else consumes.
2. 17a-2 builds brand primitives that 17a-3 uses during color lockdown.
3. 17a-3 sweeps every file — last chance to catch stray values.
4. 17b creates the data seam before SEO (15) builds on it.
5. 17c validates structured data including SEO schemas.
6. 17d unifies components using the brand primitives from 17a-2.
7. 17e consolidates motion using factories (includes GSAP `$effect()` cleanup).
8. 17f restructures tests with factories.
9. 17g updates all learning docs to reflect the new architecture.

---

## 7. Sub-slice Details

### 7.1 — 17a-1: Token Foundation

**Est. Sessions:** 3
**Branch:** `feature/slice-17a-1-token-foundation`

**Scope:**
1. Expand semantic type scale to 9 tokens with `clamp()`. Map ALL to `@theme`.
2. Define shadow scale (7 tokens) in `tokens.css` + `@theme`.
3. Define z-index scale (7 tokens) in `tokens.css` + `@theme`.
4. Define transition/duration/easing tokens in `tokens.css` + `@theme`.
5. Define opacity semantic tokens.
6. Define container width tokens.
7. Add missing semantic color tokens (`--bg-card`, `--border-strong`, `--status-error`, `--status-success`, `--text-code`, `--bg-deep`).
8. Fix radius naming split-brain — unify tokens.css and @theme naming.
9. Formalize brand color naming with addition checklist.
10. Migrate all 116 arbitrary `text-[Npx]` to semantic type scale.
11. Define 5 canonical responsive breakpoints.
12. Create `docs/reference/CSS.md` v1 — full token reference.

**Skills to use:** `design-systems:tokenize`, `design-systems:design-token`, `design-systems:naming-convention`, `ui-design:color-system`, `ui-design:typography-scale`, `ui-design:spacing-system`, `design-systems:theming-system`, `interaction-design:animation-principles`.

**Acceptance criteria:**
- [ ] 9 type scale tokens in `tokens.css`, all mapped in `@theme`
- [ ] Zero `text-[Npx]` arbitrary values in any `.svelte` file
- [ ] Body text never < 16px, mono never < 13px, labels never < 12px
- [ ] Shadow tokens defined and generating Tailwind utilities
- [ ] Z-index scale defined — no magic numbers in global stacking
- [ ] Transition tokens defined — no unnamed cubic-bezier curves
- [ ] Missing semantic colors added (`--bg-card`, `--border-strong`, `--status-*`, `--text-code`)
- [ ] Radius naming unified between tokens.css and @theme
- [ ] Container width tokens defined
- [ ] 5 canonical breakpoints in tokens.css + @theme
- [ ] `CSS.md` exists with full token reference
- [ ] `bun run build` + `bun run test` + `bun run check` pass
- [ ] No layout regressions or broken pages (text size consistency improvements are expected — text will be bigger/more uniform, not pixel-identical)

### 7.2 — 17a-2: Brand Primitives

**Est. Sessions:** 3
**Branch:** `feature/slice-17a-2-brand-primitives`

**Scope:**
1. Create `src/lib/components/brand/` directory.
2. Build all 12 brand primitive components (see Section 5.1).
3. Wire primitives into all consuming components.
4. Build 6 utility classes in `app.css` (see Section 5.3).
5. Enhance `cursorGlow` action to auto-inject overlay.
6. Move `@keyframes blink` and `@keyframes pulse-glow` to `app.css`.
7. Update CSS.md with brand primitive reference.

**Skills to use:** `design-systems:component-spec`, `design-systems:create-component`, shadcn MCP (reference patterns), Svelte MCP autofixer.

**Acceptance criteria:**
- [ ] `src/lib/components/brand/` exists with all 12 primitives
- [ ] `TerminalChrome` replaces all 5 terminal implementations
- [ ] `HazardStripe` replaces all 10+ stripe implementations
- [ ] `CardBase` used by all card variants
- [ ] `GlowOverlay` replaces all 12 manual overlay divs
- [ ] `StatusDot` replaces all 7 pulsing dot implementations
- [ ] `BrandButton` replaces all 4+ CTA styles
- [ ] `Tag` replaces all 8+ pill implementations
- [ ] `cursorGlow` action auto-injects overlay
- [ ] Global keyframes in app.css (no component-level duplicates)
- [ ] 6 utility classes defined
- [ ] Zero brand pattern duplication
- [ ] `bun run test` passes, site looks identical

### 7.3 — 17a-3: Color Lockdown

**Est. Sessions:** 3
**Branch:** `feature/slice-17a-3-color-lockdown`

**Scope:**
1. Replace all remaining hardcoded hex colors (411+ → 0).
2. Replace all `rgba(224,120,0,...)` with token references or `color-mix()`.
3. Audit every `<style>` block — move colors/fonts/spacing out, keep only layout.
4. Complete `[data-theme="light"]` block with ALL semantic tokens.
5. Migrate inline `style=` attributes where they contain static values.
6. Replace all shadow, z-index, transition values with tokens.
7. Final CSS.md update.

**Acceptance criteria:**
- [ ] Zero hardcoded hex colors in any `.svelte` file
- [ ] Zero `rgba(224,120,0,...)` bypassing tokens
- [ ] Scoped `<style>` blocks contain only layout (grid, position, overflow, keyframes)
- [ ] `[data-theme="light"]` has ALL semantic tokens defined (not shipped, but ready)
- [ ] Adding a new brand color = exactly 2 file edits (tokens.css + app.css)
- [ ] No horizontal scroll at any breakpoint
- [ ] All page headers use `--text-display` or `--text-title` (matching home page energy — D9)
- [ ] Full-bleed section pattern applied consistently (backgrounds edge-to-edge, content contained)
- [ ] `bun run test` passes, no layout regressions

### 7.4 — 17b: Service Layer Extraction

**Est. Sessions:** 2
**Branch:** `feature/slice-17b-service-layer`

**Scope:**
Create `src/lib/services/` with typed query functions. Migrate all 16 components that directly import from `$lib/data` to receive data via props from route loaders that call services.

**Services:** `project.service.ts`, `service.service.ts`, `blog.service.ts`, `meta.service.ts`, `tech-stack.service.ts`, `content.service.ts`.

**Acceptance criteria:**
- [ ] `src/lib/services/` exists with all service files
- [ ] No route loader imports from `$lib/data` directly
- [ ] No component imports from `$lib/data` (except types)
- [ ] Service functions are typed with explicit return types + JSDoc
- [ ] `bun run test` passes

### 7.5 — 17c: Zod Schema Validation

**Est. Sessions:** 0.5
**Branch:** `feature/slice-17c-zod-schemas`

**Scope:**
Zod schemas for all content types. Services parse data through schemas.

**Schemas:** `LocalizedStringSchema`, `ProjectSchema`, `ServiceSchema`, `BlogPostSchema`, `SiteMetaSchema`, `ContentSchema`, `SeoSchema`.

**Acceptance criteria:**
- [ ] Zod schemas exist for all content types
- [ ] Services validate through schemas before returning
- [ ] Clear, actionable error messages
- [ ] `bun run check` + `bun run test` pass

### 7.6 — 17d: Component API + Shared UI Shells

**Est. Sessions:** 4
**Branch:** `feature/slice-17d-component-api`
**Depends on:** 17a-2 (brand primitives must exist to wire into), 17c (schemas for prop types)

**Scope:**
1. Extract prop interfaces for all 66 components.
2. Create shared prop mixins: `AccentColorProps`, `MetroStopProps`, `FilterStateProps`.
3. Build shared UI shells (see Section 5.2): `ListingShell`, `FilterMobile`, `FilterSidebar`, `SvgIcon`, `DetailShell`, `EmptyState`.
4. Unify cross-page component pairs.
5. Fix 12 suppressed a11y warnings — add proper `role`, `tabindex`, keyboard handlers.
6. Standardize event handler naming convention.

**Skills to use:** `design-systems:pattern-library`, `design-systems:naming-convention`, `design-systems:accessibility-audit`, Svelte MCP autofixer.

**Acceptance criteria:**
- [ ] Every component exports its props interface
- [ ] Shared prop mixins used where applicable
- [ ] `ListingShell` used by blog + work + services listing pages
- [ ] `FilterMobile` + `FilterSidebar` replace Work/Blog duplicates
- [ ] `SvgIcon` replaces BlogSvgIcon + WorkSvgIcon
- [ ] Zero suppressed a11y warnings (all fixed properly)
- [ ] Consistent event handler naming
- [ ] `ListingShell` and `DetailShell` use full-bleed section pattern from home page (D9)
- [ ] `bun run test` passes

### 7.7 — 17e: Motion Consolidation

**Est. Sessions:** 2-3
**Branch:** `feature/slice-17e-motion-consolidation`

**Scope:**
1. Create motion factories: `createRevealTimeline()`, `createStaggerTimeline()`, `createMorphAnimation()`, `createDrawAnimation()`.
2. Migrate GSAP out of `$effect()` — use Svelte actions or CSS transitions.
3. Create shared `animate.ts` action with proper `destroy()` cleanup.
4. Enforce `prefers-reduced-motion` at factory level.
5. Target: 80%+ of components use factories instead of raw GSAP.

**Acceptance criteria:**
- [ ] Motion factories in `src/lib/motion/factories/`
- [ ] Zero GSAP inside `$effect()`
- [ ] `animate.ts` action exists with cleanup
- [ ] 80%+ components use factories
- [ ] Reduced-motion at factory level only
- [ ] All animations behave identically
- [ ] `bun run test` passes

### 7.8 — 17f: Test Architecture

**Est. Sessions:** 1-2
**Branch:** `feature/slice-17f-test-architecture`

**Scope:**
Test factories for all content types. Service tests mock data source. Documentation updates (ARCHITECTURE.md, src/lib/README.md).

**Acceptance criteria:**
- [ ] Test factories for all content types
- [ ] Service tests mock data source (portable to Keystatic)
- [ ] ARCHITECTURE.md reflects layered system
- [ ] `src/lib/README.md` explains import hierarchy
- [ ] `bun run test` passes

### 7.9 — 17g: Learning Docs

**Est. Sessions:** 2
**Branch:** `feature/slice-17g-learning-docs`

**Scope:**
Update all `docs/learn/` references to new file paths. Write new learn docs for: service layer pattern, Zod validation, shared UI shells, motion factories, test factories, CSS architecture.

**Acceptance criteria:**
- [ ] Zero broken file references in learn docs
- [ ] New learn docs for all Slice 17 concepts
- [ ] `meta.json` reflects post-17 architecture

---

## 8. Skills & Tools Map

| Phase | Skills | MCP Tools |
|-------|--------|-----------|
| 17a-1 Token Foundation | `design-systems:tokenize`, `design-systems:design-token`, `design-systems:naming-convention`, `ui-design:color-system`, `ui-design:typography-scale`, `ui-design:spacing-system`, `design-systems:theming-system`, `interaction-design:animation-principles` | Context7 (Tailwind v4 @theme docs) |
| 17a-2 Brand Primitives | `design-systems:component-spec`, `design-systems:create-component` | Svelte MCP autofixer, shadcn MCP (reference) |
| 17a-3 Color Lockdown | `design-systems:audit-system`, `designer-toolkit:design-token-audit` | Chrome DevTools (lighthouse) |
| 17b Service Layer | `api-design` | Context7 (SvelteKit docs) |
| 17c Zod Schemas | — | Context7 (Zod docs) |
| 17d Component API | `design-systems:pattern-library`, `design-systems:naming-convention`, `design-systems:accessibility-audit` | Svelte MCP autofixer |
| 17e Motion | — | Context7 (GSAP docs) |
| 17f Tests | `engineering:testing-strategy` | — |
| 17g Learn Docs | `engineering:documentation` | — |

---

## 9. Scope Boundaries

**In scope:** CSS token architecture, brand primitives, utility classes, color lockdown, light theme prep, service layer, Zod schemas, shared UI shells, component API standardization, cross-page unification, motion factories, test factories, documentation, learning docs, a11y fixes.

**Out of scope:** CMS integration (Slice 18), new features, new pages, visual redesign (only consistency improvements), SEO (Slice 15 — between Phase 1 and 2), E2E tests (Slice 16 — after Phase 2), light theme shipping (prep only).

**Decision D9 — Home page as the standard:** The home page's bold typography and full-bleed layout is the design target for all pages. During 17a-3 (style audit) and 17d (shared shells), ensure every page matches that energy: big type, edge-to-edge sections, immersive feel. The success metric: if applying the home page's look to another page is trivial (swap a shell, use the type scale), the design system works.

---

## 10. Global Acceptance Criteria

Every sub-slice must pass:

- [ ] `bun run build` succeeds
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] No layout regressions or broken pages (consistency improvements expected)
- [ ] Zero new features introduced
- [ ] Zero visual regressions beyond intended consistency improvements
