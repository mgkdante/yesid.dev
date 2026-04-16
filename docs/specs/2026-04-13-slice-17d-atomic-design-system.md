# Slice 17d: Atomic Design System + Edge-to-Edge — Design Spec

**Date:** 2026-04-13
**Type:** Planning Session — Atomic Design System + Edge-to-Edge Visual Pass
**Status:** Draft
**Scope:** Atomic component hierarchy, unified Card, CSS Grid section architecture, edge decorations, file splits, SVG tokenization, semantic HTML, deduplication, props standardization
**Branch:** `feature/slice-17d-component-api` (from main after PR #9 merge)
**Depends on:** 17a-6 complete (shadcn-svelte + Bits UI + token convention)

---

## 1. Philosophy

17d is the atomic backbone of yesid.dev. Two reinforcing pillars:

1. **Atomic Design System** — A 4-tier component hierarchy where pages never invent patterns, only compose atoms. One change to an atom cascades everywhere. The Constitution governs what can exist at each tier.

2. **Edge-to-Edge Visual Pass** — Every page uses the full viewport canvas. Content centers for readability. Visual elements, decorations, and edge annotations USE the edges. No wasted gutters. Each section has 3 independent layers: background, sides, content.

### Design Principles

1. **Composition over configuration.** Components have slots, not 20 props. Pages compose atoms, they don't configure god-components.
2. **One change, cascading everywhere.** Modify Card's border token → all 18 card instances update. Modify SectionWrapper's edge width → all pages respond.
3. **Zero-cost optionality.** Empty slots and grid columns collapse to 0. You don't pay for what you don't use.
4. **The Constitution is the guardrail.** The system enables infinite variation — the Constitution defines what SHOULD go where to maintain cohesion.
5. **CSS Grid is the layout engine.** Hardware-accelerated, no JS layout calculations, responsive via CSS custom properties.

---

## 2. Atomic Hierarchy — 4 Tiers

### Tier Structure

```
TIER 1: ui/        → Universal headless primitives + brand tokens
    ↓ composes
TIER 2: brand/     → yesid.dev-only craft, no library equivalent
    ↓ composes
TIER 3: shells/    → Composable page scaffolds from Tier 1+2
    ↓ composes
TIER 4: page       → Pure composition — zero custom patterns
```

### Tier Details

| Tier | Location | Purpose | Count |
|------|----------|---------|-------|
| **1 — ui/** | `src/lib/components/ui/` | shadcn-svelte scaffolded, Bits UI headless + brand tokens | 56 components |
| **2 — brand/** | `src/lib/components/brand/` | Hand-built, unique to yesid.dev | ~15 components |
| **3 — shells/** | `src/lib/components/shells/` | Composable layout scaffolds | ~7 shells (new) |
| **4 — page** | `src/lib/components/` | Pure composition — wires data into Tier 1-3 | ~40 components |

### Composition Rules (Constitution Section 13)

1. **Tier 4 never creates UI patterns** — only wires data into Tier 1-3 atoms.
2. **Tier 3 composes Tier 1+2** — SectionWrapper uses Card, SectionHeading, SectionLabel.
3. **Tier 2 may use Tier 1** — TerminalChrome uses StatusDot, Separator.
4. **Tier 1 is self-contained** — no upward dependencies.
5. **New page = choose shells + fill with atoms** — zero CSS invention.
6. **When to create a new atom:** pattern appears on 2+ pages, or will appear on future pages.
7. **When to compose existing atoms:** the pattern is a combination of existing atoms with page-specific data.

---

## 3. Unified Card

### Decision

One Card atom for 3 clusters (Bento + Content + Grid = 18 instances). Terminal and Interactive patterns excluded.

### Card Surface (unified)

| Property | Value | Source |
|----------|-------|--------|
| Background | `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur(6px)` | ProofReel pattern |
| Border | `1px solid color-mix(in srgb, var(--primary) 15%, transparent)` | ProofReel pattern |
| Radius | `var(--radius-lg)` | Consistent across clusters |
| Hover | Border glow to `color-mix(in srgb, var(--primary) 60%, transparent)` + `var(--shadow-section)` | Universal glow |

### Motion Actions (opt-in per consumer)

| Action | Where | Behavior |
|--------|-------|----------|
| `use:tilt` | **Bento cards only** (About page) | 3D tilt following cursor. Bento = physical tiles, tilt reinforces the metaphor. |
| `use:cursorGlow` | Any card that wants it | Cursor-following glow overlay. Opt-in. |
| `use:boop` | BlogRow, ProjectMiniCard | Hover scale. Opt-in. |

### Excluded from Card

| Pattern | Reason | Stays as |
|---------|--------|----------|
| TerminalChrome (3 instances) | Brand-specific craft — title bar, StatusDot, hazard stripe, body, footer. Not a "card." | Separate brand primitive |
| StackNode (1 instance) | Interactive node with keyboard nav, scale hover. Refactored to `<button>` with token-based styling — not a Card. | `<button>` element |
| StackScenarioCard (1 instance) | Presentation container specific to tech-stack configurator. Uses Card surface but not the Card component — it's a simple `<article>` with card tokens. | `<article>` element |

### Card API

```typescript
// ui/card customized — extends shadcn Card
export interface CardProps {
  class?: string;
  [key: string]: any; // ...rest
}
```

The Card component provides the unified surface. Consumers add behavior through Svelte actions (`use:tilt`, `use:cursorGlow`) and content through slots. No variant prop — the surface is universal.

---

## 4. Section Architecture — CSS Grid

### 3 Independent Layers

Each section has 3 independent, optional layers:

```
┌─────────────────────────────────────────────────────┐
│  BACKGROUND (optional)                               │
│  SVG blueprints, circuit grids, canvas effects       │
│  Purely decorative. z-index: 0.                      │
│                                                      │
│  ┌──────┐  ┌──────────────────────────┐  ┌──────┐  │
│  │ SIDE │  │        CONTENT           │  │ SIDE │  │
│  │ left │  │  Cards, text, grids      │  │right │  │
│  │(opt) │  │  Centered in container   │  │(opt) │  │
│  └──────┘  └──────────────────────────┘  └──────┘  │
│  z-index: 1                               z-index: 1│
└─────────────────────────────────────────────────────┘
```

### CSS Grid Implementation

```css
.section-wrapper {
  display: grid;
  grid-template-columns: var(--edge-left, 0) 1fr var(--edge-right, 0);
  width: 100%;
  position: relative;
}

.section-background {
  grid-column: 1 / -1;
  grid-row: 1;
  z-index: 0;
}

.section-side-left {
  grid-column: 1;
  grid-row: 1;
  z-index: 1;
}

.section-content {
  grid-column: 2;
  grid-row: 1;
  z-index: 1;
}

.section-side-right {
  grid-column: 3;
  grid-row: 1;
  z-index: 1;
}
```

### Key Properties

- **Optional:** Empty grid columns collapse to 0. No wrapper divs, no conditional logic.
- **Horizontally asymmetric:** Left and right sides can have different widths (`--edge-left: 40px`, `--edge-right: 80px`).
- **Vertically asymmetric:** Content within each side uses `align-self` or flex for positioning (top, center, bottom). Across sections, each independently chooses which sides to show.
- **Responsive:** At `xl:` and above, `--edge-left/--edge-right` are set. Below `xl:`, both are `0` — sides hidden, content full-width. One CSS variable per side controls the entire responsive behavior.

### 4 Layout Patterns (Constitution)

| Pattern | grid-template-columns | When |
|---------|----------------------|------|
| A — Asymmetric Split | `var(--edge-left) 1fr 1fr var(--edge-right)` | Heroes, feature sections |
| B — Centered + Edges | `var(--edge-left) 1fr var(--edge-right)` | Content pages, about |
| C — Full-Bleed | `1fr` (content spans all) | Galleries, separators |
| D — Edge-Anchored Grid | `var(--edge-left) 1fr var(--edge-right)` | Listings, bento |

### SectionWrapper Props

```typescript
export interface SectionWrapperProps {
  /** Layout pattern from Constitution */
  layout?: 'split' | 'centered' | 'bleed' | 'grid';
  /** Container width for content */
  container?: 'content' | 'wide' | 'prose' | 'none';
  /** Full viewport height */
  fullHeight?: boolean;
  /** Vertical center content */
  centerContent?: boolean;
  /** Consumer styling */
  class?: string;
  [key: string]: any;
}
```

### SectionWrapper Slots

```svelte
<SectionWrapper layout="centered" container="content">
  {#snippet background()}
    <!-- Decorative SVGs, circuit grids, gradients -->
  {/snippet}
  {#snippet sideLeft()}
    <!-- Mono labels, section dots, ticks -->
  {/snippet}
  {#snippet sideRight()}
    <!-- Blueprint annotations, version labels -->
  {/snippet}

  <!-- Default slot: content (cards, text, grids) -->
  <Card>...</Card>
</SectionWrapper>
```

---

## 5. EdgeRail — Page-Level Edge Decorations

### Purpose

Persistent edge elements that span the entire page, independent of individual sections. Like ScrollRail but for content markers.

### Content Examples

- Rotated page label (`// about`, `// services`)
- Section progress dots (metro-style)
- Vertical circuit lines
- Blueprint tick marks
- Version/date annotations

### Behavior

- Sticky positioning along viewport edges (scrolls with page, sticks at viewport boundary)
- Only visible at `xl:` breakpoint and above
- Positioned independently of SectionWrapper sides
- EdgeRail provides the **baseline rhythm**; SectionWrapper slots add **section-specific personality**

### Props

```typescript
export interface EdgeRailProps {
  /** Which side */
  position: 'left' | 'right';
  /** Page label (rotated) */
  label?: string;
  /** Section markers */
  sections?: { id: string; label: string }[];
  class?: string;
}
```

---

## 6. New Atoms — Brand Tier

### SectionHeading

Replaces 2 verbatim CSS copies (ProofReel, HomeServices). The section heading + orange dot + mono subheading pattern.

```svelte
<SectionHeading
  heading="Proof in the data."
  subheading="// measured impact"
/>
```

### MetroStation

Replaces 3 copy-pasted badge + pulse + SVG line blocks (WorkListingPage, BlogRow metro badges).

```svelte
<MetroStation index={1} showLine={true} />
```

### SvgIcon

Merges BlogSvgIcon + WorkSvgIcon (70% identical code). The `animation` prop defaults to `'draw-fill'` and `trigger` defaults to `'load'`.

```svelte
<SvgIcon
  svgContent={svg}
  size={48}
  animation="draw"
  trigger="scroll"
/>
```

### SvgMorphBox

Extracts the identical SVG morph container from ServiceCard and ServiceDetailPage. Square container that morphs to circle on hover.

```svelte
<SvgMorphBox
  svgContent={serviceSvg}
  size={240}
/>
```

---

## 7. New Shells — Shell Tier

### ListingShell

Extracts 60% structural overlap from WorkListingPage + BlogListingPage.

Provides: container wrapper, h1 header, mobile/desktop filter dual-render, sidebar + content flex layout, batch animation setup, filter summary + clear, empty state.

```svelte
<ListingShell title="Dispatches" subtitle="// professional">
  {#snippet filters()}
    <FilterGroup ... />
  {/snippet}
  {#snippet sidebar()}
    <FilterSidebar ... />
  {/snippet}

  {#each items as item}
    <BlogRow post={item} />
  {/each}
</ListingShell>
```

### DetailHero

Extracts shared detail page header: back-link + h1 + description + gradient separator. Used by WorkDetailPage, blog/[slug], ServiceDetailPage.

```svelte
<DetailHero
  backLink={{ href: '/work', label: 'All Projects' }}
  title={project.title}
  subtitle={project.oneLiner}
>
  {#snippet extras()}
    <DataFlowDiagram ... />
  {/snippet}
</DetailHero>
```

### CardGrid

Responsive 1-2-3 column card grid. Replaces 3+ inline grid patterns.

```svelte
<CardGrid columns={{ sm: 1, md: 2, lg: 3 }}>
  {#each items as item}
    <Card>...</Card>
  {/each}
</CardGrid>
```

### BentoGrid

About page named-area CSS grid. Extracts the inline grid from AboutPage.

```svelte
<BentoGrid>
  <Card style="grid-area: identity" use:tilt use:cursorGlow>
    <AboutIdentity />
  </Card>
  ...
</BentoGrid>
```

### AsidePanel

Standardized sidebar pattern. Encodes: semantic `<aside>`, sticky positioning, responsive show/hide, consistent surface.

```svelte
<AsidePanel position="right" sticky>
  <WorkDetailSidebar ... />
</AsidePanel>
```

---

## 8. Primitive Wiring (15 opportunities)

### SectionLabel (8 instances — zero imports currently)

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| ContactPage | 160, 167 | Hand-rolled mono/uppercase | `<SectionLabel text={...} variant="metric" />` |
| tech-stack/+page | 721-731 | `.hero-overline` CSS | `<SectionLabel text={...} variant="section" />` |
| tech-stack/+page | 827-833 | `.hero-stat-label` CSS | `<SectionLabel text={...} variant="metric" />` |
| ProofReel | 193-199 | `.section-subheading` CSS | `<SectionLabel text={...} variant="section" />` |
| HomeServices | 342-348 | `.section-subheading` CSS | `<SectionLabel text={...} variant="section" />` |
| ServiceCard | 105-114 | `.station-counter` CSS | `<SectionLabel text={...} variant="station" />` |
| +error | 41-46 | Inline mono span | `<SectionLabel text={...} variant="section" />` |
| ServiceNav | 92-97 | `.nav-label` CSS | `<SectionLabel text={...} variant="section" />` |

### MetricDisplay (2 instances)

| File | Lines | Complexity |
|------|-------|-----------|
| tech-stack/+page | 186-202 | Medium — 4 hero stats with custom sizing |
| ProofReel | 130-147 | Hard — needs `before` prop for strikethrough |

### TerminalChrome (2 instances)

| File | Complexity | Resolution |
|------|-----------|-----------|
| tech-stack/+page hero terminal | Medium | Evaluate fit with TerminalChrome `noPadding` |
| InfraFrame | Medium | Compose InfraFrame ON TOP of TerminalChrome (InfraFrame = TerminalChrome + CornerMarks + grid overlay) |

### StatusDot (3 instances)

| File | Lines | Complexity |
|------|-------|-----------|
| Manifesto status dot | 256, 666-678 | Easy — translucent pulse dot |
| Manifesto active/inactive dots | 224-227, 563-578 | Hard — needs hollow variant |
| +error metro dots | 69-73 | Medium — filled + hollow pattern |

---

## 9. Responsive Mathematical Guarantee

### Philosophy

No person is left behind. Not "tested on 3 devices and looks okay" — a system where the MATH guarantees every viewport from 280px to 3840px renders correctly. Breakpoints handle layout shifts. `clamp()` handles value scaling. Between any two breakpoints, continuous fluid scaling covers every pixel.

This responsive system is portable — designed to be reused across all future projects and SaaS products.

### Two-Pronged System

```
Breakpoints = structural shifts (1-col → 2-col → sidebar → full asymmetric)
clamp()     = continuous scaling (padding, font-size, gaps, container widths)

Result: Every pixel width from 280px to 3840px+ is mathematically covered.
```

### Device Coverage Matrix

| Class | Width Range | Layout | Touch | Examples |
|-------|-------------|--------|-------|----------|
| Small phone | 280-359px | Single column, stacked, full-bleed | 44x44px min | Galaxy Fold closed |
| Phone | 360-519px | Single column, edge-to-edge cards | 44x44px min | iPhone SE/15/16, Pixel, Galaxy S |
| Large phone / Foldable | 520-767px | 2-col grids, split panels begin | 44x44px min | Foldable open, iPhone Plus landscape |
| Small tablet | 768-1023px | Sidebars appear, 3-col grids | 44x44px min | iPad Mini, iPad Air |
| Laptop / Large tablet | 1024-1439px | Full asymmetric layouts, edges appear | No minimum | iPad Pro landscape, MacBook |
| Desktop | 1440px+ | Max edge decor, widest panels, full experience | No minimum | External monitors, ultrawide |

### Mathematical Guarantees

1. **Typography:** All fluid sizes use `clamp(min, preferred, max)`. Body never below 16px. Mono never below 13px. Labels never below 12px. Headings scale with viewport but have hard min/max bounds.

2. **Spacing:** `--space-page-x: clamp(1.5rem, 4vw, 5rem)`. At 280px → 1.5rem. At 1440px → 5rem. Every width in between → `4vw`. No gaps in coverage.

3. **Touch targets:** All interactive elements (buttons, links, toggles, cards) have minimum 44x44px touch area on devices < 1024px. Enforced via `min-height: 44px; min-width: 44px` or equivalent padding.

4. **Containers:** `min(var(--container-content), 100vw - var(--space-page-x) * 2)` — content never overflows viewport. Mathematically impossible.

5. **No horizontal scroll:** `overflow-x: clip` on `<html>`. All elements constrained by container or viewport. No element wider than its parent.

6. **Safe areas:** `env(safe-area-inset-*)` on ALL fixed/sticky/absolute-positioned elements. Covers notched phones, dynamic island, rounded corners, home indicator bars.

7. **Viewport units:** `dvh` for sections (updates with browser chrome), `svh` for calculations (stable), `lvh` for backgrounds (maximum). Never `vh`.

8. **Edge decorations:** Only render at `xl:` (1024px+). Below 1024px, content uses full viewport width. Zero edge decoration on touch devices — they get full content instead.

### No Overflow Guarantee (Constitutional Law)

**Nothing overflows its parent. Ever. At any viewport. The CSS enforces this mathematically — not with visual checks, but with constraints that make overflow impossible.**

**5 layers of enforcement:**

```css
/* Layer 1: Global — nothing escapes the viewport */
html { overflow-x: clip; }

/* Layer 2: Text — long words break instead of overflowing */
body { overflow-wrap: anywhere; word-break: break-word; }

/* Layer 3: Media — images/SVGs/videos can't exceed their container */
img, svg, video, iframe { max-width: 100%; height: auto; }

/* Layer 4: Flex/Grid children — can't push past parent bounds */
/* Applied to all flex/grid containers in the system */
.flex > *, .grid > * { min-width: 0; }

/* Layer 5: Containers — mathematically capped at viewport */
.container { max-width: min(var(--container-width), 100vw - var(--space-page-x) * 2); }
```

**SectionWrapper side panels:**

```css
/* Side columns use minmax — they shrink to 0 before overflowing */
grid-template-columns: minmax(0, var(--edge-left, 0)) 1fr minmax(0, var(--edge-right, 0));
```

If content inside a side panel would overflow, the panel shrinks. If the viewport can't fit the sides + content, sides collapse to 0. The content column (`1fr`) absorbs all available space. No calculation needed — CSS Grid handles it automatically.

**Text in containers:**

```css
/* Tables, code blocks, and pre-formatted text scroll internally */
pre, code, table { overflow-x: auto; max-width: 100%; }

/* Flex text truncates with ellipsis instead of overflowing */
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

**The guarantee chain:**
1. Viewport → `overflow-x: clip` (nothing escapes)
2. Section → `width: 100%` (never wider than viewport)
3. Grid columns → `minmax(0, ...)` (shrink before overflow)
4. Container → `min(token, 100vw - gutters)` (capped at viewport)
5. Content → `min-width: 0` (flex/grid children can shrink)
6. Text → `overflow-wrap: anywhere` (words break at boundaries)
7. Media → `max-width: 100%` (images scale down)

**If any element is about to overflow its parent, the CSS system recalculates automatically.** No JavaScript. No resize observers. Pure CSS constraints that make overflow mathematically impossible.

### Constitution Section 9 Upgrade

The existing Constitution Section 9 (Responsive) will be enhanced with:
- The device coverage matrix
- Mathematical guarantee formulas
- Touch target enforcement rules
- Container overflow prevention formula
- Safe area expansion to ALL fixed/sticky elements

---

## 10. Scroll Behavior Fixes

### Reported Issues

1. **Drawer scroll blocked** — Opening a drawer (StackBottomSheet / vaul-svelte) blocks scrolling inside the drawer content. Users can't scroll long content within the drawer.
2. **Tabs horizontal scroll blocked** — StationTabs on the work page can't be swiped/scrolled horizontally on mobile to see overflow tabs.
3. **Work page scroll blocked** — The entire /work page won't scroll at all.

### Root Cause Investigation (during implementation)

Likely causes to investigate:
- `overflow: hidden` or `overflow: clip` on parent elements blocking scroll propagation
- Drawer/Dialog scroll lock not releasing properly after close
- `overscroll-behavior: contain` trapping scroll inside nested scrollable elements
- GSAP ScrollTrigger `normalizeScroll` intercepting touch events
- Touch event `preventDefault()` in motion actions blocking native scroll
- TerminalChrome `overflow: hidden` on parent clipping child scroll (already identified)

### Fix Requirements

- **Drawer:** Content inside drawer body must scroll vertically when content exceeds viewport height
- **Tabs:** Horizontal tab overflow must be swipeable on touch devices
- **Page scroll:** All pages must scroll vertically at all viewports — nothing blocks page-level scroll
- **Scroll lock:** Dialogs/Drawers may lock body scroll while open, but MUST release on close
- **No Overflow Guarantee applies:** internal elements scroll via `overflow-x: auto` or `overflow-y: auto`, page-level scroll is never blocked

### Constitution Addition

Add to Section 9 (Responsive):
- **Scroll flows downward.** Page-level scroll is never blocked by child elements. Nested scrollable regions (drawers, panels, code blocks) scroll internally but never capture page scroll.
- **Touch scroll is sacred.** No motion action, no GSAP plugin, no custom touch handler may `preventDefault()` on touch events that would block native scroll.

---

## 11. Global Brand Polish

### Text Selection Highlight

Add brand-colored `::selection` pseudo-element to `app.css`:

```css
::selection {
  background: color-mix(in srgb, var(--primary) 30%, transparent);
  color: var(--foreground);
}
```

Selecting any text on the site highlights it in translucent brand orange. One line of CSS, site-wide impact.

---

## 10. Semantic HTML Fixes

| Issue | File | Fix |
|-------|------|-----|
| Dual `<h1>` on home | HeroBanner:485,499 | Consolidate into single `<h1>` with `<span>` children |
| Missing `<h1>` on About | AboutIdentity:57 | Promote `<h2>` to `<h1>` |
| Missing `<h1>` on Services index | ServiceCard:42 | Add page-level `<h1>` |
| h1→h3 skips | BlogRow:106, WorkCard:111, WorkDetailSidebar:68 | Add intermediate `<h2>` |
| No `<time datetime>` | BlogDetailHeader:80, BlogRow:122 | Wrap dates in `<time datetime="{post.date}">` |
| TerminalChrome overflow | brand/TerminalChrome:99 | Add `overflow-y: auto` to `.terminal-body` |

---

## 10. Code Deduplication

| Target | Copies | Resolution |
|--------|--------|-----------|
| `isTouchDevice()` | 3 (tilt.ts, magnetic.ts, cursorGlow.ts) | Extract to `$lib/motion/utils/device.ts` |
| `SHAPES` + `pickRandomShape()` | 3 (BlogSvgIcon, WorkSvgIcon, HomeServices) | Extract to `$lib/data/shapes.ts` |
| `MorphSVGPlugin.convertToPath` boilerplate | 3 | Extract to `$lib/motion/utils/morphHelpers.ts` |
| Morph-back-to-original animation loop | 3 | Helper function in morphHelpers |
| `station-ping` keyframes | 2 (BlogRow, WorkListingPage) | Move to global `app.css` |
| Grid-rows-collapse CSS | 3 (WorkFilterMobile, BlogFilterMobile, CollapsibleSection) | Utility class in `app.css` |
| Section heading CSS | 2 (ProofReel, HomeServices) | SectionHeading component |

---

## 11. File Splits

| File | Lines | After | Strategy |
|------|-------|-------|----------|
| Manifesto | 1006 | ~320 | 9 sub-components: ManifestoEdgeLeft, ManifestoEdgeRight, ManifestoEdgeTop, ManifestoEdgeBottom, ManifestoTransit, ManifestoBeckLines, ManifestoRoundels, ManifestoFlowLines, ManifestoStripes |
| tech-stack/+page | 919 | ~380 | 4 components: TechStackHero (terminal + typewriter + stats), TechStackCta, TechStackBuildSection (de-duped from 3x), TechStackDivider |
| HomeCloser | 749 | ~280 | 4 sub-components: CloserGraffiti (DrawSVG animation subsystem), CloserFloodlight (inline SVG + beam), CloserProps (construction prop injection), CloserTerminalBoard (departure rows) |
| HeroBanner | 734 | ~330 | 3 TS modules: heroTimeline.ts (buildHeroTimeline + measurement utils), heroScrollLock.ts, heroTypewriter.ts. 2 components: HeroTextContent, HeroMobileSql |
| HomeServices | 478 | ~380 | 1 component: ServicesBlueprint (background SVG grid) |
| StackPanel | 453 | ~370 | 1 component: StackPanelOrientation (hint/orientation card) |

---

## 12. SVG Tokenization

| Group | Files | Action |
|-------|-------|--------|
| Blueprint SVGs (`static/svg/blueprint/`) | 12 | Convert to Svelte components (Train.svelte pattern). Replace 743x `#E07800` with `var(--primary)`. Import as components in HomeServices instead of `<img>`. |
| Services SVGs (`static/svg/services/`) | 6 | Replace `#E07800`/`#FFB627` with `var(--primary)`/`var(--accent)` in source files. Already fetch-injected at runtime. |
| Orphan SVGs (`static/svg/`) | 9 | Delete — zero references in codebase, all use `currentColor` (unused). |

---

## 13. Props Standardization

### Current State

- **9** brand primitives export Props interfaces + class/rest
- **~70** page components use inline `$props()` types, no class/rest
- **0** page components are externally composable

### Target State

All page components that consumers import get:

```typescript
export interface ComponentNameProps {
  /** Documented props */
  propName: string;
  /** Consumer styling */
  class?: string;
  /** Consumer attributes */
  [key: string]: any;
}
```

Priority: Components consumed by shells (ListingShell consumers like BlogRow, WorkCard) get interfaces first. Internal sub-components (Manifesto sub-components) can use inline types.

---

## 14. Constitution Update

Add **Section 13: Atomic Design** to `docs/reference/CONSTITUTION.md`:

- 4-tier hierarchy with composition rules
- Card as universal surface (unified spec)
- SectionWrapper as layout engine (CSS Grid, 3 layers, 4 patterns)
- EdgeRail as page-level edge decoration
- When to create a new atom vs compose existing ones
- Component naming per tier
- Slot conventions
- Anti-patterns: page components creating custom card styles, inline section padding, hand-rolled edge decorations

---

## 15. Out of Scope (deferred)

| Deferred to | What |
|-------------|------|
| 17e | Motion preset system (ground-up rebuild of GSAP calls) |
| 17e | Reduced-motion audit (standardize all 75 GSAP calls) |
| 17a-4 | Dead code cleanup (final sweep after 17d + 17e) |
| Future | Container queries for component-level responsive |
| Future | Light theme (tokens ready, component testing deferred) |

---

## 16. Session Estimates

| Sub-slice | Sessions | Focus |
|-----------|----------|-------|
| 17d-1 | 1 | Constitution atomicity update + Card unification + brand atoms (SectionHeading, MetroStation) |
| 17d-2 | 1-2 | SvgIcon merge + utility extractions (device.ts, shapes.ts, morphHelpers.ts) + dedup (station-ping, grid-rows) |
| 17d-3 | 1-2 | Shells (SectionWrapper with CSS Grid, EdgeRail, ListingShell, DetailHero, CardGrid, AsidePanel) |
| 17d-4 | 1-2 | File splits (Manifesto, tech-stack, HomeCloser, HeroBanner) |
| 17d-5 | 1 | SVG tokenization (12 blueprints → Svelte, 6 services → var(), 9 orphans → delete) |
| 17d-6 | 1-2 | Wiring (SectionLabel x8, MetricDisplay, TerminalChrome, StatusDot) + semantic HTML fixes + props standardization |
| 17d-7 | 1-2 | Edge-to-edge pass (apply SectionWrapper + EdgeRail to all pages, design side content per page) |
| **Total** | **7-11** | |

---

## 17. Key Decisions

| ID | Decision | Reasoning |
|----|----------|-----------|
| D75 | Unified Card surface (ProofReel pattern) for Bento + Content + Grid clusters | One atom, cascading changes. ProofReel's translucent bg + primary-tinted border is the boldest + most cohesive. |
| D76 | Tilt on bento cards only | Dashboard tiles = physical metaphor. Everywhere else = noise. Tilt is a design choice, not a default. |
| D77 | Terminal excluded from Card | TerminalChrome is brand craft — title bar, StatusDot, hazard stripe. Not a "card." |
| D78 | Interactive nodes excluded from Card | StackNode/StackScenarioCard refactored to semantic HTML containers. |
| D79 | CSS Grid for SectionWrapper | Hardware-accelerated, zero-cost optional columns, responsive via CSS variables, naturally overlapping layers. |
| D80 | 3 independent section layers (background, sides, content) | Background decorations (SVGs, grids) are atmosphere. Sides are structural annotations. Content is the payload. All optional, all composable. |
| D81 | EdgeRail + SectionWrapper slots (Option C) | EdgeRail = page-level baseline rhythm. SectionWrapper slots = section-specific personality. Layered approach. |
| D82 | Horizontally + vertically asymmetric sides | Left/right sides can have different widths and content. Across sections, each independently chooses which sides to show. |
| D83 | 4-tier atomic hierarchy (ui/ → brand/ → shells/ → page) | Strict composition. Pages never invent patterns. Constitution governs each tier. |
| D84 | Constitution Section 13: Atomic Design | Atomicity is non-negotiable governance — as fundamental as layout, spacing, and a11y. |

---

## 18. Acceptance Criteria

1. **Constitution:** Section 13 (Atomic Design) written and governs all development
2. **Card:** One unified surface for 18 instances. ProofReel background/border. Universal border glow hover. Tilt bento-only.
3. **SectionWrapper:** CSS Grid with 3 optional layers (background, sides, content). 4 layout patterns. Horizontally and vertically asymmetric sides.
4. **EdgeRail:** Page-level edge decorations. Only visible at `xl:+`. Rotated labels, section dots, circuit lines.
5. **Shells:** SectionWrapper, EdgeRail, ListingShell, DetailHero, CardGrid, BentoGrid, AsidePanel — all built and documented.
6. **Brand atoms:** SectionHeading, MetroStation, SvgIcon (merged), SvgMorphBox — all built and wired.
7. **Wiring:** SectionLabel (8), MetricDisplay (2), TerminalChrome (2), StatusDot (3) — all wired.
8. **Semantic HTML:** One h1 per page, no heading skips, all dates in `<time>`, TerminalChrome overflow fixed.
9. **Dedup:** isTouchDevice, SHAPES, morphHelpers, station-ping, grid-rows-collapse — all centralized.
10. **File splits:** Zero files > 600 lines.
11. **SVGs:** 12 blueprints as Svelte components, 6 services tokenized, 9 orphans deleted.
12. **Props:** All consumer-facing components export Props interfaces + class/rest.
13. **Tests:** `bun run test` + `bun run check` pass.
14. **Edge-to-edge:** All pages use SectionWrapper with full-bleed sections. Edge decorations designed per page. Content containers only constrain text — visual elements USE the edges.
15. **Visual upgrade:** Site looks bolder and more cohesive — unified card surface, designed edges, full-bleed layouts. Not identical to before — intentionally improved.
