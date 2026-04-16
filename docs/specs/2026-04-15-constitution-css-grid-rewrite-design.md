# Design Spec: Constitution Rewrite — CSS Grid + Flexbox

**Date:** 2026-04-15
**Slice:** 17d (Component API)
**Branch:** `feature/slice-17d-component-api`
**Status:** Approved
**Approach:** #1 — Delete all shell components, replace with CSS Grid recipes in Constitution

---

## 1. Problem Statement

SectionWrapper (201 lines) creates more problems than it solves:

- **CSS specificity fights** — ProjectDetailPage needed `:global(.section-wrapper.detail-body[data-layout="centered"])` to override grid columns
- **Hardcoded measurements** — inline `--edge-left: 340px` styles fighting the component's own grid logic
- **Unexpected grid columns** — 4 layout modes (`bleed`, `centered`, `split`, `grid`) with different column formulas create unpredictable behavior
- **Wrapper tax** — every section wrapped in a component that adds 0 visual value for `layout="bleed"` (just `width: 100%`)

EdgeRail (220 lines) includes Canvas text measurement, `@chenglou/pretext` dependency, and complex `$effect` sizing logic — all for a rotated title that CSS `writing-mode` handles in 15 lines.

**Evidence:** Pages without SectionWrapper (blog detail body, services listing/detail, contact, tech-stack) are consistently simpler and more maintainable than pages with it.

## 2. Solution

Delete SectionWrapper, EdgeRail, and ListingLayout. Replace with 4 CSS Grid recipes documented in CONSTITUTION.md. Each page owns its layout in scoped CSS.

### Design Decisions

- **D211:** Delete SectionWrapper/EdgeRail/ListingLayout — CSS Grid recipes replace all 3
- **D212:** 4 recipes: Full-Bleed, Contained, Content+Sidebars, Edge Title Grid
- **D213:** Rotated edge titles stay as visual pattern, implemented with `writing-mode: vertical-rl` + `clamp()` sizing (~20 lines vs 220)
- **D214:** Background decorations use `position: relative` parent + `position: absolute` child (no slot needed)
- **D215:** Atomic design drops from 4 tiers to 3 (shells/ tier deleted)
- **D216:** Shell survivors (BlueprintShell, DetailHero, CardGrid, BentoGrid, AsidePanel) move to brand/ or inline into single consumers
- **D217:** Constitution §2, §6, §9, §11, §13 rewritten; other sections unchanged

## 3. CSS Grid Recipes

### Recipe 1: Full-Bleed

```css
.section {
  width: 100%;
  /* No container. Content IS the section. */
}
```

**For:** Heroes, visual bands, headers, bento grids — any section that bleeds to viewport edges.

**Used by:** Home hero/manifesto, About bento, blog/project detail headers.

### Recipe 2: Contained

```css
.section {
  max-width: var(--container-content); /* or --container-wide, --container-prose */
  margin-inline: auto;
  padding-inline: var(--space-page-x);
}
```

**For:** Text sections, forms, simple centered content.

**Used by:** Contact page, Tech-stack, error page.

### Recipe 3: Content + Sidebars

```css
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-card-gap);
}
@media (min-width: 1024px) {
  .section-grid {
    grid-template-columns: auto 1fr auto;
    /* or proportional: 1fr 2fr 1fr */
  }
}
```

**For:** Any content area flanked by functional sidebars (TOC, filter panels, metadata panels, rotated headings).

**Used by:** Project detail body (TOC | content | glance panel), blog detail body (TOC | content), home centered sections (rotated heading | content).

Sidebars collapse to stacked on mobile or hide with a responsive class if they have a mobile alternative (floating pill, collapsible panel).

### Recipe 4: Edge Title Grid

```css
.listing-grid {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .listing-grid {
    grid-template-columns: auto 1px 1fr;
    margin-top: -5rem; /* extend behind nav */
  }
  .edge-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: clamp(8rem, 15vw, 15rem);
    font-family: var(--font-heading);
    font-weight: 900;
    color: var(--text-muted);
    opacity: 0.06;
    white-space: nowrap;
    position: sticky;
    top: 0;
    height: 100dvh;
    display: flex;
    align-items: center;
  }
  .accent-rail {
    background: var(--primary);
    opacity: 0.15;
  }
}
```

**For:** Listing pages with a big rotated section title rail.

**Used by:** Blog listing, Projects listing (via route `+layout.svelte`).

### Background Decoration Pattern

No component slot needed. Use relative/absolute positioning:

```svelte
<section class="relative w-full">
  <!-- Background decoration -->
  <div class="absolute inset-0 -z-10 pointer-events-none">
    <ServicesBlueprint />
  </div>
  <!-- Content -->
  <div class="content-grid">...</div>
</section>
```

## 4. Sweep Pass — Page-by-Page Migration

### Pages Already Clean (no migration)

| Page | Route | Pattern |
|------|-------|---------|
| Blog detail body | `/blog/[slug]` | `1fr 2fr` grid |
| Services listing | `/services` | Flexbox + sticky tabs |
| Services detail | `/services/[id]` | `1fr 2fr 1fr` grid |
| Contact | `/contact` | `2fr 5fr` grid |
| Tech-stack | `/tech-stack` | Flexbox column |
| Error | `+error.svelte` | Flexbox centered |

### Pages to Migrate

#### HomePage.svelte — Remove 5 SectionWrappers

| Section | Current | After |
|---------|---------|-------|
| Hero | `SectionWrapper layout="bleed"` | `<section class="w-full">` — unwrap |
| Manifesto | `SectionWrapper layout="bleed"` | `<section class="w-full">` — unwrap |
| Projects | `centered` + `sideLeft` rotated heading | Recipe 3: `auto 1fr` at `xl:` |
| Services | `centered` + `sideRight` + `background` blueprint | Recipe 3: `1fr auto` at `xl:` + relative/absolute for blueprint |
| Closer | `centered` + `sideLeft` rotated heading | Recipe 3: `auto 1fr` at `xl:` |

Rotated `<SectionHeading>` elements move from snippet slots into plain grid cells.

#### AboutPage.svelte — Remove 1 SectionWrapper

Unwrap `SectionWrapper layout="bleed"`. The bento grid CSS is self-contained.

#### BlogListingPage.svelte — Remove 2 SectionWrappers

| Section | Current | After |
|---------|---------|-------|
| Header | `SectionWrapper layout="bleed"` | Unwrap — `<BlogBlueprint>` is already full-bleed |
| Listing | `centered` + `sideLeft` filter sidebar | Recipe 3: `clamp(220px, 22vw, 320px) 1fr` at `xl:` |

#### ProjectListingPage.svelte — Remove 1 SectionWrapper

Same pattern as blog listing inner — filter sidebar becomes a grid column.

#### BlogDetailHeader.svelte — Remove 1 SectionWrapper

`layout="bleed"` with `background` slot → unwrap, decorations become absolute positioned in relative parent.

#### ProjectDetailHeader.svelte — Remove 1 SectionWrapper

Same pattern as blog detail header.

#### ProjectDetailPage.svelte — Remove 1 SectionWrapper

`centered` + `sideLeft` (TOC) + `sideRight` (glance panel) → Recipe 3: `1fr 2fr 1fr` at `xl:`. Removes the `:global(.detail-body)` specificity hack entirely.

### Route Layouts — Replace ListingLayout

| File | Change |
|------|--------|
| `routes/blog/+layout.svelte` | Replace `<ListingLayout label="Blog">` with Recipe 4 inline grid |
| `routes/projects/+layout.svelte` | Replace `<ListingLayout label="Projects">` with Recipe 4 inline grid |

Rotated "Blog." / "Projects." titles move into route layouts as plain HTML + scoped CSS (~20 lines each).

### shells/ Directory Cleanup

| Component | Lines | Action | Reason |
|-----------|-------|--------|--------|
| `SectionWrapper.svelte` | 201 | **DELETE** | Replaced by CSS Grid recipes |
| `EdgeRail.svelte` | 220 | **DELETE** | Replaced by `writing-mode` CSS |
| `ListingLayout.svelte` | 109 | **DELETE** | Replaced by Recipe 4 in route layouts |
| `BlueprintShell.svelte` | 94 | **MOVE** to `brand/` | Used by BlogBlueprint + ProjectsBlueprint |
| `DetailHero.svelte` | 79 | **CHECK** | Inline if 1-2 consumers, else move to `brand/` |
| `CardGrid.svelte` | 62 | **CHECK** | Inline if 1-2 consumers, else move to `brand/` |
| `BentoGrid.svelte` | 34 | **CHECK** | May be unused (About uses custom grid) |
| `AsidePanel.svelte` | 57 | **CHECK** | Inline if 1-2 consumers, else move to `brand/` |

After cleanup: **shells/ directory deleted**, useful survivors move to `brand/`.

## 5. Constitution Changes

### Sections Rewritten

| Section | Scope of Change |
|---------|----------------|
| **§2 Layout Model** | Delete Scope Model (6 layers), delete SectionWrapper/EdgeRail docs, replace with 4 CSS Grid Recipes + background decoration pattern |
| **§6 Component Standards** | Update tiers: 4 → 3, delete shells/ tier, remove shells/ slot conventions table |
| **§9 Responsive** | Delete "Edge Decorations" paragraph referencing SectionWrapper side slots, replace with "edge columns collapse via media query" |
| **§11 Anti-Patterns** | Remove SectionWrapper-specific anti-patterns, add: "Don't create layout wrapper components — use CSS Grid recipes directly" |
| **§13 Atomic Design** | Rewrite to 3 tiers, delete shells/ tier, delete SectionWrapper/EdgeRail/slot documentation, keep Card documentation |

### Sections Unchanged

§1 Philosophy, §3 Spacing, §4 Typography, §5 Semantic HTML, §7 Accessibility, §8 Motion, §10 File Organization, §12 Token Reference.

## 6. Atomic Design — New 3-Tier Model

```
TIER 1: ui/        → Universal headless primitives + brand tokens
    ↓ composes
TIER 2: brand/     → yesid.dev-only craft, no library equivalent
    ↓ composes
TIER 3: page       → Pure composition — wires data into grids + Tier 1-2 atoms
```

| Tier | Location | Purpose | Examples |
|------|----------|---------|---------|
| **1 — ui/** | `src/lib/components/ui/` | shadcn-svelte + Bits UI headless primitives | Button, Badge, Dialog, Tabs, Card |
| **2 — brand/** | `src/lib/components/brand/` | Hand-built yesid.dev craft | SectionHeading, MetroStation, TerminalChrome, StatusDot, BlueprintShell |
| **3 — page** | `src/lib/components/` | Pure composition — wires data into CSS Grid layouts + Tier 1-2 atoms | HomePage, BlogDetailPage, ServiceCard |

**Composition rules:**
1. Tier 3 never creates UI patterns — only wires data into CSS Grid + Tier 1-2 atoms
2. Tier 2 may use Tier 1 (TerminalChrome uses StatusDot)
3. Tier 1 is self-contained — no upward dependencies
4. New page = choose a CSS Grid recipe + fill with atoms. Zero layout invention.

## 7. Net Impact

- **~530 lines deleted** (SectionWrapper 201 + EdgeRail 220 + ListingLayout 109)
- **12 SectionWrapper removals** across 7 files
- **0 visual change** — every page looks identical before and after
- **0 `:global()` hacks** — pages own their grids
- **1 dependency removable** — `@chenglou/pretext` (only used by EdgeRail)
- **3 → simpler mental model** — read the scoped CSS, understand the layout

## 8. Deliverable Ordering

```
Session B — Constitution + Sweep (Implementation)
  T1:  Rewrite CONSTITUTION.md §2, §6, §9, §11, §13
  T2:  Update CLAUDE.md references to shells/SectionWrapper
  T3:  HomePage — remove 5 SectionWrappers
  T4:  AboutPage — remove 1 SectionWrapper
  T5:  BlogListingPage — remove 2 SectionWrappers
  T6:  ProjectListingPage — remove 1 SectionWrapper
  T7:  BlogDetailHeader + ProjectDetailHeader — remove background slots
  T8:  ProjectDetailPage — remove SectionWrapper, own the grid
  T9:  Route layouts — replace ListingLayout with inline Recipe 4
  T10: Delete shells/ (SectionWrapper, EdgeRail, ListingLayout), relocate survivors
  T11: Update barrel exports, fix imports across codebase
  T12: bun run test + bun run check — verify zero regression
  T13: Update ARCHITECTURE.md, CSS.md, TESTS.md

Session C — Wireframe Diagrams
  Visual companion wireframes for all 11 page templates × 3 breakpoints

Session D — Contact Page (17d-6)
  Contact page redesign
```

**Session B estimate:** 13 tasks, each mostly deletion + simple grid CSS. May split into 2 sessions if needed.

## 9. Wireframe Diagrams Plan

11 page templates, each at 3 breakpoints (375px mobile, 768px tablet, 1440px desktop):

| Template | Route | Grid Recipe | Complexity |
|----------|-------|-------------|-----------|
| Home | `/` | Mixed (1+2+3) | High — 5 sections |
| About | `/about` | Full-Bleed (1) | Medium — bento grid |
| Blog listing | `/blog` | Edge Title (4) + Sidebars (3) | Medium |
| Blog detail | `/blog/[slug]` | Sidebars (3) | Medium |
| Projects listing | `/projects` | Edge Title (4) + Sidebars (3) | Medium |
| Project detail | `/projects/[slug]` | Sidebars (3) | Medium |
| Services listing | `/services` | Full-Bleed (1) | Medium — sticky tabs |
| Service detail | `/services/[id]` | Sidebars (3) | Medium |
| Tech-stack | `/tech-stack` | Contained (2) | Simple |
| Contact | `/contact` | Contained (2) + Sidebars (3) | Simple |
| Error | `+error.svelte` | Contained (2) | Simple |

Wireframes show grid cells labeled, columns/rows visible, with breakpoint tabs to switch views.

## 10. Acceptance Criteria

- [ ] CONSTITUTION.md §2, §6, §9, §11, §13 rewritten with CSS Grid recipes
- [ ] SectionWrapper.svelte, EdgeRail.svelte, ListingLayout.svelte deleted
- [ ] All 12 SectionWrapper usages replaced with scoped CSS Grid
- [ ] Rotated edge titles on listing pages use `writing-mode` CSS (~20 lines each)
- [ ] Background decorations use relative/absolute pattern
- [ ] shells/ directory deleted, survivors relocated to brand/
- [ ] Zero visual regression — every page looks identical
- [ ] Zero `:global()` specificity hacks for layout
- [ ] `bun run test` passes (798/798)
- [ ] `bun run check` passes (0 errors)
- [ ] CLAUDE.md, ARCHITECTURE.md, CSS.md, TESTS.md updated
- [ ] Wireframe diagrams created for all 11 templates × 3 breakpoints
