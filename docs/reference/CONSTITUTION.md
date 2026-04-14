# CONSTITUTION.md — yesid.dev Development Standards

> **Status:** Active governance document. Every component, page, and future slice follows these rules.
> **Source of truth for:** layout model, spacing, typography, semantic HTML, components, a11y, motion, responsive, file organization.
> **Token reference:** `docs/reference/CSS.md` has the full token inventory.

---

## 1. Philosophy

1. **The viewport is the canvas.** Edge-to-edge design everywhere. Text containers center for readability; visual elements (SVGs, panels, decorations, grids) USE the edges. No wasted gutters.
2. **Tokens over magic numbers.** If a value repeats in 3+ places, it becomes a token. If it doesn't repeat, it's scoped CSS with a comment explaining why.
3. **Accessibility is infrastructure, not decoration.** Keyboard nav, focus management, semantic HTML, ARIA — non-negotiable.
4. **Show the craft.** Use battle-tested libraries (Bits UI) for what they're good at. Build custom for what makes yesid.dev unique.
5. **Simple to grow.** Adding a new page or component means composing from the system, not inventing patterns.
6. **Young and bold.** Awwwards-level immersive design. Typography as a design element. Oversized type, mono annotations at edges, every pixel intentional.

---

## 2. Layout Model

### The One Rule

Every page renders at full viewport width. `<main>` provides only vertical flex — no horizontal constraints. The viewport IS the canvas.

### Section Pattern

Every major content block follows:

```svelte
<section class="w-full">
  <!-- Text/content: centered at appropriate container width -->
  <div class="mx-auto px-[var(--space-page-x)]" style="max-width: var(--container-content)">
    <!-- prose, listings, grids -->
  </div>
  <!-- Visual elements: bleed to viewport edges -->
  <!-- Decorative elements: anchored at edges -->
</section>
```

### The Scope Model — 6 Layers

Content placement is determined by **SCOPE** — what the content is true for — not by content type. All layers are content-agnostic: decorative, interactive, or informational content can go in any layer.

```
┌─ PAGE LEVEL (EdgeRail) ──────────────────────────────────────────────┐
│                                                                       │
│  ┌─ SECTION LEVEL (SectionWrapper) ───────────────────────────────┐  │
│  │                                                                 │  │
│  │  ┌────────┐  ┌─────────────────────────┐  ┌────────┐          │  │
│  │  │  side  │  │       CONTENT           │  │  side  │          │  │
│  │  │  left  │  │  Main section content   │  │ right  │          │  │
│  │  └────────┘  └─────────────────────────┘  └────────┘          │  │
│  │  BACKGROUND (z:0) — decorative layer spanning all columns      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  EDGE LEFT                                              EDGE RIGHT   │
│  (persistent)                                          (persistent)  │
└───────────────────────────────────────────────────────────────────────┘
```


| Layer | Component | Scope | Examples |
| --- | --- | --- | --- |
| **Edge Left** | EdgeRail (left) | Whole page | Page title, persistent labels, page-level info |
| **Edge Right** | EdgeRail (right) | Whole page | Year, page metrics, persistent decoration |
| **Section Side Left** | SectionWrapper sideLeft | This section | Filters, sidebars, section annotations |
| **Section Content** | SectionWrapper content | This section | Cards, text, grids — main content |
| **Section Side Right** | SectionWrapper sideRight | This section | Complementary info, section annotations |
| **Section Background** | SectionWrapper background | This section | Decorative SVGs, circuit grids |


**Deciding where content goes:**

1. True for the **whole page**? → EdgeRail (persistent as you scroll)
2. True for **this section only**? → SectionWrapper sideLeft/sideRight
3. **Main content** of the section? → SectionWrapper content
4. **Decorative background** for the section? → SectionWrapper background

**Example — Blog listing page:**
- EdgeRail left: "Blog" label (true for the whole page)
- SectionWrapper (listing section) sideLeft: filter sidebar (scoped to this section's cards)
- SectionWrapper (listing section) content: search + post list
- If a hero section is added above the listing, filters stay in the listing section — they don't apply to the hero

### 4 Layout Patterns


| Pattern                                 | Description                                                  | When to use                     |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------- |
| **A — Asymmetric Split**                | Text on one side, visual panel bleeding to opposite edge     | Heroes, feature sections        |
| **B — Centered Text + Edge Decoration** | Prose centered, decorative elements at viewport edges        | Content pages, about sections   |
| **C — Full-Bleed Visual Band**          | 100% width visual sections, no container                     | Galleries, data viz, separators |
| **D — Edge-Anchored Grid**              | Cards extend to viewport edges on mobile, breathe on desktop | Listings, bento grids           |


### Container Tokens


| Token                 | Value            | When to use                                  |
| --------------------- | ---------------- | -------------------------------------------- |
| `--container-content` | `64rem` (1024px) | Default text sections, listings, grids       |
| `--container-wide`    | `72rem` (1152px) | Detail pages with sidebars                   |
| `--container-prose`   | `65ch`           | Blog text, long-form reading                 |
| *(no container)*      | `100vw`          | Heroes, galleries, separators, visual panels |


**Rule:** Containers are for text readability, NOT constraints for the whole section. Visual elements, SVGs, panels, and decorative elements live OUTSIDE containers.

---

## 3. Spacing

### Semantic Tokens


| Token               | Value                      | Purpose                                      |
| ------------------- | -------------------------- | -------------------------------------------- |
| `--space-page-x`    | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters                      |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)`   | Vertical padding between sections            |
| `--space-card-gap`  | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards in grids                   |
| `--space-stack`     | `1.5rem`                   | Default vertical stack spacing               |
| `--space-cluster`   | `0.75rem`                  | Tight groupings (label + value, icon + text) |


### Rules

1. If a spacing value appears in 3+ sections, it becomes a token.
2. Unique component-internal spacing stays as scoped CSS with standard Tailwind classes.
3. **Arbitrary Tailwind values (`p-[22px]`) are banned** — use standard scale or a token.
4. Use `clamp()` for fluid values that scale across viewports.
5. Tailwind's default spacing scale (0.5, 1, 1.5, 2, 3, 4, ...) covers everything the semantic tokens don't.

---

## 4. Typography

### Type Scale


| Token             | Size                                  | Usage                           |
| ----------------- | ------------------------------------- | ------------------------------- |
| `text-hero`       | `clamp(64px, min(9vw, 11svh), 130px)` | Hero wordmark only              |
| `text-display`    | `clamp(40px, 5vw, 64px)`              | Page titles, hero headlines     |
| `text-title`      | `clamp(28px, 4vw, 40px)`              | Section headings (H2)           |
| `text-heading`    | `clamp(20px, 3vw, 24px)`              | Card titles, H3                 |
| `text-subheading` | `18px`                                | Subtitles, H4                   |
| `text-body-lg`    | `18px`                                | Lead paragraphs                 |
| `text-body`       | `16px`                                | Paragraphs, descriptions        |
| `text-small`      | `14px`                                | Metadata, labels                |
| `text-mono`       | `13px`                                | Terminal, code, SQL             |
| `text-caption`    | `12px`                                | Timestamps, footnotes, tags     |
| `text-micro`      | `10px`                                | Chrome annotations, stop labels |


### Typography as Design

- **Oversized display type** — bold headlines that command attention
- **Mono annotations at edges** — `// section-label` patterns, rotated sidebar text
- **Type contrast** — Inter for human text, JetBrains Mono for system/data/code
- **Size contrast** — display-size metrics next to caption-size labels

### Heading Hierarchy

- One `<h1>` per page — never skip levels.
- Every `<section>` should have a heading (can be `sr-only` if visually hidden).
- Use semantic heading levels for structure, CSS classes for visual size.

### Exception

HeroBanner wordmark uses custom sizing outside the type scale — intentional, documented.

---

## 5. Semantic HTML


| Element                     | When to use                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `<section>`                 | Major content regions with a heading                        |
| `<article>`                 | Self-contained content (blog post, project card, service)   |
| `<figure>` + `<figcaption>` | Images with captions, code with labels                      |
| `<nav>` with `aria-label`   | Navigation regions (distinguish with labels)                |
| `<aside>`                   | Complementary content (sidebars, TOC, filters)              |
| `<header>` / `<footer>`     | Page or section headers/footers                             |
| `<time datetime>`           | All dates — must have machine-readable `datetime` attribute |
| `<button>`                  | Every interactive element — **never `<div onclick>`**       |
| `<a>`                       | Navigation — must have `href`                               |


---

## 6. Component Standards

### Component Tiers

Three tiers of components, each with distinct conventions:


| Tier       | Location                    | Source                   | Conventions                                        | Count                        |
| ---------- | --------------------------- | ------------------------ | -------------------------------------------------- | ---------------------------- |
| **ui/**    | `src/lib/components/ui/`    | shadcn-svelte scaffolded | `cn()`, `data-slot`, background/foreground tokens  | 56 components, 15 customized |
| **brand/** | `src/lib/components/brand/` | Hand-built               | `cn()`, `data-slot`, brand-specific styling + GSAP | 15 primitives                |
| **page**   | `src/lib/components/`       | One-off page components  | Consume from ui/ and brand/ tiers                  | ~40 components               |


**ui/ tier (shadcn-svelte):** Pre-scaffolded accessible components (Button, Badge, Dialog, Tabs, etc.). Customized with brand tokens. Import: `import { Button } from '$lib/components/ui/button'`.

**brand/ tier (hand-built):** Brand-specific primitives (StatusDot, TerminalChrome, HazardStripe, etc.) that have no shadcn equivalent. Import: `import { StatusDot, Tag } from '$lib/components/brand'`.

### Shared Conventions

Both ui/ and brand/ tiers use:

- `**cn()` utility** from `$lib/utils` for Tailwind class composition with merge support
- `**data-slot` attribute** to identify component parts for style targeting
- **background/foreground token pairs** (e.g., `--card` / `--card-foreground`)

### Universal Prop Pattern

Every component follows:

```typescript
export interface ComponentNameProps {
  /** What this prop does */
  propName: string;
  /** Optional with default */
  variant?: 'primary' | 'ghost';
  /** Allow consumer styling */
  class?: string;
  /** Allow consumer attributes */
  [key: string]: any;
}

let { propName, variant = 'primary', class: className = '', ...rest }: ComponentNameProps = $props();
```

### Rules

1. Every component exports a named `Props` interface (not inline types).
2. Every component accepts `class` prop + `...rest` spread.
3. Props use `$props()` destructuring with defaults.
4. JSDoc on every non-obvious prop.

### Bits UI Integration (17a-6)

Bits UI is the **headless accessibility layer** providing keyboard nav, focus traps, ARIA attributes, and screen reader support. It powers the interactive primitives in both the ui/ and brand/ tiers.

**Use for:** Interactive a11y primitives (Dialog, Collapsible, Tabs, Toggle, Tooltip).
**Don't use for:** Presentational components (cards, labels, badges, separators).

**Wrapping pattern:**

```
bits-ui (headless)  →  ui/ or brand/ wrapper (our styling + GSAP)  →  page component
   Dialog.Root           ui/dialog                                     MenuOverlay
   Collapsible.Root      (direct in brand)                             CollapsibleSection
   Tabs.Root             ui/tabs                                       StationTabs
   Drawer.Root           (vaul-svelte)                                 StackBottomSheet
```

`forceMount` + `child` snippet gives full GSAP control. Bits UI handles a11y (focus trap, ESC, ARIA), we handle brand styling and animation.

### File Size Limits


| Limit         | Action                                               |
| ------------- | ---------------------------------------------------- |
| < 400 lines   | Ideal                                                |
| 400–600 lines | Acceptable if cohesive. Flag for review.             |
| > 600 lines   | **Must split.** Extract sub-components or utilities. |


---

## 7. Accessibility

### Minimum Requirements (every component)


| Requirement                 | Rule                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Keyboard navigable          | Every interactive element reachable via Tab, operable via Enter/Space                       |
| Focus visible               | `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }`          |
| No `<div onclick>`          | Interactive elements must be `<button>`, `<a>`, or Bits UI primitive                        |
| Zero `svelte-ignore a11y_`* | No a11y suppressions. Redesign if needed.                                                   |
| ARIA attributes             | Decorative → `aria-hidden`. Regions → `aria-label`. State → `aria-expanded`, `aria-pressed` |
| One `<h1>` per page         | Never skip heading levels. Every `<section>` needs a heading.                               |
| Reduced motion              | Every animation (GSAP + CSS) must respect `prefers-reduced-motion`                          |


### Reduced Motion Standard

**GSAP:**

```typescript
if (isPrefersReducedMotion()) {
  gsap.set(element, { opacity: 1, y: 0 }); // Final state immediately
  return;
}
```

**CSS:**

```css
@media (prefers-reduced-motion: reduce) {
  .animated-thing { animation: none; transition: none; }
}
```

Both guards required if component uses both GSAP and CSS animation.

---

## 8. Motion

### When to Use What


| Animation type                    | Tool                                         |
| --------------------------------- | -------------------------------------------- |
| Scroll-linked reveals             | GSAP ScrollTrigger                           |
| Complex choreography              | GSAP Timeline                                |
| Hover/focus states                | CSS `transition` with duration/easing tokens |
| Looping decorative                | CSS `@keyframes`                             |
| Mount/unmount (dialogs, sheets)   | Bits UI `forceMount` + GSAP                  |
| Svelte `transition:` / `animate:` | **Never** — GSAP is the motion system        |


### Motion Tokens


| Token               | Value                               | Usage                              |
| ------------------- | ----------------------------------- | ---------------------------------- |
| `--duration-fast`   | `150ms`                             | Hover, toggles, micro-interactions |
| `--duration-normal` | `200ms`                             | Standard transitions               |
| `--duration-slow`   | `300ms`                             | Panel open/close, reveals          |
| `--duration-slower` | `500ms`                             | Page transitions, large reveals    |
| `--ease-default`    | `ease`                              | General purpose                    |
| `--ease-bounce`     | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions               |
| `--ease-decel`      | `cubic-bezier(0, 0, 0.2, 1)`        | Enter animations                   |


**Rule:** CSS transitions use token vars. No raw `0.3s ease`.

### Global Keyframes (app.css)

If a `@keyframes` is used by 2+ components, it moves to `app.css`. Component-specific animations stay scoped.

### 17e: Ground-Up Motion Re-Engineering

17e does NOT patch existing animation code. It tears down and rebuilds from scratch:

1. Design the preset system first — factories, timing, reduced-motion, scroll patterns.
2. Rewrite each animation to use presets — not find-and-replace, but re-engineer.
3. If an animation can't use a preset, the preset system grows — never add a hack.
4. Every preset bakes in: timing tokens, easing tokens, reduced-motion guards, cleanup on destroy.

---

## 9. Responsive

### Device Coverage Matrix

6 device classes, every real device falls into exactly one:


| Class        | Width Range | Devices                               | Layout                              |
| ------------ | ----------- | ------------------------------------- | ----------------------------------- |
| **Nano**     | 280–359px   | Galaxy Fold closed                    | Single column, stacked, compact     |
| **Phone**    | 360–519px   | iPhone SE, most phones                | Single column, edge-to-edge cards   |
| **Foldable** | 520–767px   | Foldables open, large phone landscape | 2-column grids, split panels        |
| **Tablet**   | 768–1023px  | iPad Mini, tablets                    | Sidebars appear, 3-col grids        |
| **Laptop**   | 1024–1439px | Laptops, iPad Pro landscape           | Full asymmetric layouts, edge decor |
| **Desktop**  | 1440px+     | Desktop monitors                      | Maximum edge decor, widest panels   |


### 5 Canonical Breakpoints


| Prefix   | Width   | Transition                                        |
| -------- | ------- | ------------------------------------------------- |
| *(base)* | < 360px | Nano devices                                      |
| `sm:`    | 360px   | Phone → comfortable single column                 |
| `md:`    | 520px   | Foldable → 2-column layouts unlock                |
| `lg:`    | 768px   | Tablet → sidebars, 3-col grids                    |
| `xl:`    | 1024px  | Laptop → full asymmetric, edge decorations appear |
| `2xl:`   | 1440px  | Desktop → maximum widths, widest panels           |


Defined in `src/lib/styles/tokens.css` + `src/app.css` `@theme`. Replaces Tailwind v4 defaults.

### Two-Pronged Responsive System


| Tool            | Purpose                  | Example                                         |
| --------------- | ------------------------ | ----------------------------------------------- |
| **Breakpoints** | Layout structure changes | Column count, sidebar visibility, grid patterns |
| `**clamp()`**   | Fluid value scaling      | Typography, spacing, container widths           |


Breakpoints handle **when** layout shifts. `clamp()` handles **how much** values scale between shifts. Together, every viewport width from 280px to 2560px gets the right value — no device falls through the cracks.

### Math-Driven Layout Calculations

Every structural dimension is calculated from shared variables — components don't guess sizes, they compute them:

| Calculation | Formula | Why |
|-------------|---------|-----|
| **Content height** | `100dvh - var(--nav-height) - var(--footer-height)` | Main content fills exactly the remaining viewport |
| **Full-height sections** | `100dvh` (dynamic) or `100svh` (stable) | Accounts for mobile browser chrome show/hide |
| **Container widths** | `min(var(--container-token), 100vw - var(--space-page-x) * 2)` | Never exceeds viewport minus gutters |
| **Side panels** | `minmax(0, var(--edge-width))` | Collapse to 0 before causing overflow |
| **Section spacing** | `clamp(min, preferred, max)` | Scales fluidly, bounded at both ends |
| **Grid layouts** | `var(--edge-left, 0) 1fr var(--edge-right, 0)` | Sum always equals 100% of parent |

**The principle:** Every element's size is a function of its parent's size and shared tokens. Nav height changes? Content area recalculates. Viewport shrinks? `min()` picks the smaller value. Browser chrome appears? `dvh` updates. No element relies on a fixed number that could become wrong — the math keeps everything in sync.

### No Overflow Guarantee

Content overflow is **mathematically impossible**. 7 layers of CSS enforcement, each catching what the previous layer missed:


| Layer | Rule                                        | What it catches                           |
| ----- | ------------------------------------------- | ----------------------------------------- |
| 1     | `html { overflow-x: clip }`                 | Viewport boundary — nothing escapes       |
| 2     | `body { overflow-wrap: anywhere }`          | Long words/URLs break instead of overflow |
| 3     | `img, svg, video { max-width: 100% }`       | Media scales down to fit parent           |
| 4     | Flex/grid children: `min-width: 0`          | Flex items can shrink below content size  |
| 5     | Containers: `min(token, 100vw - gutters)`   | Container widths capped to viewport       |
| 6     | Side panels: `minmax(0, var(--edge-width))` | Edge panels collapse before overflowing   |
| 7     | `pre, code, table { overflow-x: auto }`     | Preformatted content scrolls internally   |


**The math makes it impossible.** Every width is wrapped in `min()`, every text in `overflow-wrap`, every media in `max-width: 100%`. Overflow isn't "avoided" — it's **mathematically prevented** by construction. `min(var(--container-content), 100vw - var(--space-page-x) * 2)` can never exceed the viewport. `clamp(min, preferred, max)` can never exceed `max`. The 7 layers are redundant by design — each catches what a developer might forget to apply from the others.

**Testing:** Resize to 280px. No horizontal scrollbar. No clipped content. If a new component overflows, the component is wrong — not the system.

### Scroll Law

> **Scroll flows downward. Touch scroll is sacred.**

1. No child element may block page-level vertical scroll.
2. No motion action (GSAP, CSS, JS) may `preventDefault` on touch scroll events.
3. Drawers, modals, and overlays use `body { overflow: hidden }` to lock scroll — never touch event interception.
4. Horizontal scroll is only permitted inside explicitly scrollable containers (`overflow-x: auto`) — never at the page level.
5. Every scrollable container must have visible scroll affordance (scrollbar or edge fade).

### Touch Target Enforcement

Below `xl:` (1024px), every interactive element must be at least **44×44px** (WCAG 2.5.5 AAA). This includes:

- Buttons, links, toggles
- Tab items, filter chips
- Close buttons, navigation items
- Form inputs and selectors

Use `min-height: 44px; min-width: 44px` or padding to achieve the target area. The visual element can be smaller — the tap target cannot.

### Container Overflow Prevention

Every container width uses the viewport-capped `min()` pattern:

```css
max-width: min(var(--container-token), 100vw - var(--space-page-x) * 2);
```

The math: `min()` picks the smaller of two values. On a 360px phone with 24px gutters, `100vw - 48px = 312px`. The container token (`1024px`) is ignored because `min(1024, 312) = 312`. On a 1440px desktop, `min(1024, 1360) = 1024` — the token wins. **No viewport can produce overflow.** This is not a guideline — it's arithmetic.

### Viewport Units


| Unit  | When                                                   |
| ----- | ------------------------------------------------------ |
| `dvh` | Full-height sections — updates with browser chrome     |
| `svh` | Stable measurements — font sizing, scroll calculations |
| `lvh` | Maximum possible height — background sizing            |
| `vh`  | **Never** — inconsistent on mobile                     |


### Safe Areas

```css
/* Required on: nav, footer, fixed/sticky elements, bottom sheets, overlays, drawers */
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-top: env(safe-area-inset-top, 0px);
padding-left: env(safe-area-inset-left, 0px);
padding-right: env(safe-area-inset-right, 0px);
```

`viewport-fit=cover` in `<meta name="viewport">` is required for `env()` to work. Safe areas apply to ALL fixed/sticky elements — not just nav and footer.

### Edge Decorations

SectionWrapper side slots (edge panels flanking content) collapse to `0` below `xl:` (1024px). However, EdgeRail and standalone edge content may be visible at any breakpoint if the section has no side panels competing for space. The rule is: **edge content must not cause overflow or crowd content** — if there's room, it can appear.

### Rules

1. **Mobile-first.** Base = smallest screen. Breakpoints add complexity.
2. **Edge-to-edge at every viewport.** Cards touch edges on mobile. Edge decor scales on desktop.
3. **No horizontal scroll.** Enforced by the 7-layer No Overflow Guarantee.
4. **One breakpoint system.** Only the 5 canonical values. No one-off `@media (max-width: 767px)`.
5. `**clamp()` for fluid values.** Typography and spacing scale fluidly. Breakpoints handle layout structure.
6. **Touch targets 44×44px** below `xl:`.
7. **Scroll Law is sacred.** Never block page scroll. Never intercept touch events.

---

## 10. File Organization

### Size Limits


| Limit         | Action                 |
| ------------- | ---------------------- |
| < 400 lines   | Ideal                  |
| 400–600 lines | Acceptable if cohesive |
| > 600 lines   | **Must split**         |


### Naming

- Components: PascalCase (`BrandDialog.svelte`)
- Utilities: camelCase (`device.ts`)
- Brand primitives: `src/lib/components/brand/`
- Motion presets: `src/lib/motion/presets/`
- Shared data: `src/lib/data/`

### Co-location

- Test files next to source (never top-level `tests/`).
- Props interfaces in the component file, re-exported through barrel.
- Component-specific types in the component file.

---

## 11. Anti-Patterns

**Never:**

- `text-[Npx]` arbitrary font sizes — use type scale tokens
- Hardcoded hex in class strings — use `var()` or brand utilities
- `style="font-size: 14px"` — use type scale class
- `z-index: 9999` — use z-index scale tokens
- `transition: all 0.3s` — use duration/easing tokens
- `<div onclick>` — use `<button>` or Bits UI
- `svelte-ignore a11y_`* — redesign instead
- `@media (max-width: 767px)` — use canonical breakpoints only
- `vh` unit in CSS — use `dvh`/`svh`/`lvh`
- Svelte `transition:` / `animate:` — use GSAP
- Raw GSAP calls without reduced-motion guard
- Components without `class` + `...rest` props
- Inline types instead of exported interfaces
- Files > 600 lines without splitting
- Arbitrary Tailwind spacing values (`p-[22px]`) — use standard scale or token

---

## 12. Token Reference

Full token inventory is in `docs/reference/CSS.md`. Key files:


| File                                | Purpose                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/lib/styles/tokens.css`         | CSS custom properties (theme-switching, brand, spacing, shadows, z-index, transitions, opacity, radius) |
| `src/app.css` `@theme` block        | Tailwind v4 utilities (type scale, spacing, container widths, breakpoints)                              |
| `src/app.css` `@theme inline` block | Dynamic tokens that reference `var()` (colors, borders)                                                 |


### Token Architecture

```
tokens.css (:root)          → CSS custom properties (theme-aware values)
    ↓
app.css @theme              → Tailwind utilities (static brand values)
app.css @theme inline       → Tailwind utilities (dynamic var() references)
    ↓
Components                  → Consume via var() in scoped CSS or Tailwind classes
```

One source of truth per value. Defined in one place, referenced everywhere.

---

## 13. Atomic Design

### 4-Tier Component Hierarchy

```
TIER 1: ui/        → Universal headless primitives + brand tokens
    ↓ composes
TIER 2: brand/     → yesid.dev-only craft, no library equivalent
    ↓ composes
TIER 3: shells/    → Composable page scaffolds from Tier 1+2
    ↓ composes
TIER 4: page       → Pure composition — zero custom patterns
```


| Tier            | Location                     | Purpose                                                   | Examples                                                |
| --------------- | ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| **1 — ui/**     | `src/lib/components/ui/`     | shadcn-svelte scaffolded, Bits UI headless + brand tokens | Button, Badge, Dialog, Tabs, Card                       |
| **2 — brand/**  | `src/lib/components/brand/`  | Hand-built, unique to yesid.dev                           | SectionHeading, MetroStation, TerminalChrome, StatusDot |
| **3 — shells/** | `src/lib/components/shells/` | Composable layout scaffolds                               | SectionWrapper, EdgeRail, DetailHero, CardGrid, BentoGrid, AsidePanel |
| **4 — page**    | `src/lib/components/`        | Pure composition — wires data into Tier 1-3               | ProofReel, HomeServices, BlogRow, AboutPage             |


### Composition Rules

1. **Tier 4 never creates UI patterns.** Page components only wire data into Tier 1-3 atoms. No custom card styles, no hand-rolled section padding, no bespoke headings.
2. **Tier 3 composes Tier 1+2.** SectionWrapper uses Card, SectionHeading, SectionLabel.
3. **Tier 2 may use Tier 1.** TerminalChrome uses StatusDot. MetroStation uses Badge.
4. **Tier 1 is self-contained.** No upward dependencies.
5. **New page = choose shells + fill with atoms.** Zero CSS invention.
6. **When to create a new atom:** pattern appears on 2+ pages, or will appear on future pages per roadmap.
7. **When to compose existing atoms:** the pattern is a combination of existing atoms with page-specific data.

### Card — Universal Surface

One Card atom for all card-like surfaces across the site. The unified surface replaces 18+ hand-rolled card patterns.


| Property   | Value                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Background | `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur(6px)`                                  |
| Border     | `1px solid color-mix(in srgb, var(--primary) 15%, transparent)`                                                  |
| Radius     | `var(--radius-lg)`                                                                                               |
| Hover      | Border → `color-mix(in srgb, var(--primary) 60%, transparent)` + `var(--shadow-section)`                         |
| Transition | `border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)` |


**Motion actions are opt-in per consumer:**


| Action           | Where                         | Behavior                      |
| ---------------- | ----------------------------- | ----------------------------- |
| `use:tilt`       | Bento cards only (About page) | 3D tilt following cursor      |
| `use:cursorGlow` | Any card that wants it        | Cursor-following glow overlay |
| `use:boop`       | BlogRow, ProjectMiniCard      | Hover scale                   |


**Excluded from Card:** TerminalChrome (brand craft, not a card), StackNode (interactive button), StackScenarioCard (one-off presentation container).

### SectionWrapper — Section-Level Layout Engine

Every major content section uses SectionWrapper's 3-layer CSS Grid. Content in SectionWrapper sides is **section-scoped** — it pertains to this section only (see Section 2: The Scope Model).

```
┌─────────────────────────────────────────────────────┐
│  BACKGROUND — decorative SVGs, circuit grids (z:0)  │
│  ┌──────┐  ┌──────────────────────────┐  ┌──────┐  │
│  │ SIDE │  │        CONTENT           │  │ SIDE │  │
│  │ left │  │  Cards, text, grids      │  │right │  │
│  │(opt) │  │  Centered in container   │  │(opt) │  │
│  └──────┘  └──────────────────────────┘  └──────┘  │
│  z:1                                      z:1       │
└─────────────────────────────────────────────────────┘
```

**Key properties:**

- Empty grid columns collapse to `0`. No wrapper divs, no conditional logic.
- Sides can have different widths (`--edge-left`, `--edge-right`).
- Below `xl:` (1024px), both sides are `0` — content fills full width.
- Background spans all columns via `grid-column: 1 / -1`.
- **Sides are content-agnostic.** Filter sidebars, ToC panels, annotations, decorative elements — anything section-scoped goes in `sideLeft`/`sideRight`.

**Math-driven layout:** Side panels use `minmax(0, var(--edge-width))` — they collapse to `0` before overflowing. Content uses `min(var(--container-token), 100vw - var(--space-page-x) * 2)` — viewport-capped. The grid template `var(--edge-left, 0) 1fr var(--edge-right, 0)` ensures: `edge-left + content + edge-right ≤ 100vw` at every breakpoint. CSS computes the layout — no JS measurements, no resize observers, no guesswork.

**Multi-section pages:** A page can have multiple SectionWrapper instances. Each is independent — a blog page might have a header section (bleed) and a listing section (centered with filter sidebar in sideLeft). The sidebar is scoped to the listing section; adding a hero section above doesn't affect it.

### EdgeRail — Page-Level Edge Decorations

Persistent edge elements spanning the entire page. Content in EdgeRail is **page-scoped** — it's true for the whole page (see Section 2: The Scope Model).

Content: rotated page labels, section progress dots, vertical circuit lines, blueprint tick marks, metrics, complementary information. All layers are content-agnostic — not restricted to decoration.

- Fixed positioning along viewport edges
- Only visible at `xl:` (1024px) and above
- Positioned independently of SectionWrapper sides
- Persists as the user scrolls through all sections

### Slot Conventions Per Tier


| Tier        | Slots                                                       | Pattern                                   |
| ----------- | ----------------------------------------------------------- | ----------------------------------------- |
| **ui/**     | `children` (default), named slots per shadcn convention     | Standard Svelte 5 snippets                |
| **brand/**  | `children` (default), named slots for optional regions      | `{#snippet label()}`, `{#snippet icon()}` |
| **shells/** | `background`, `sideLeft`, `sideRight`, `children` (content) | CSS Grid areas                            |
| **page**    | No outward slots — page is the top-level composer           | N/A                                       |


### Anti-Patterns

**Never:**

- Page components creating custom card styles (use Card)
- Inline section padding in page components (use SectionWrapper or semantic spacing tokens)
- Hand-rolled edge decorations in page components (use SectionWrapper side slots or EdgeRail)
- Duplicating heading + dot + subheading CSS (use SectionHeading)
- Copy-pasting station badge + pulse markup (use MetroStation)
- Adding a Tier 2/3 component to a page without checking if a Tier 1 equivalent exists
- Creating a new atom for a pattern used on only 1 page (scoped CSS instead)

