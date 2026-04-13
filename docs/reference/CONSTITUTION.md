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

### 4 Layout Patterns

| Pattern | Description | When to use |
|---------|-------------|-------------|
| **A — Asymmetric Split** | Text on one side, visual panel bleeding to opposite edge | Heroes, feature sections |
| **B — Centered Text + Edge Decoration** | Prose centered, decorative elements at viewport edges | Content pages, about sections |
| **C — Full-Bleed Visual Band** | 100% width visual sections, no container | Galleries, data viz, separators |
| **D — Edge-Anchored Grid** | Cards extend to viewport edges on mobile, breathe on desktop | Listings, bento grids |

### Container Tokens

| Token | Value | When to use |
|-------|-------|-------------|
| `--container-content` | `64rem` (1024px) | Default text sections, listings, grids |
| `--container-wide` | `72rem` (1152px) | Detail pages with sidebars |
| `--container-prose` | `65ch` | Blog text, long-form reading |
| *(no container)* | `100vw` | Heroes, galleries, separators, visual panels |

**Rule:** Containers are for text readability, NOT constraints for the whole section. Visual elements, SVGs, panels, and decorative elements live OUTSIDE containers.

---

## 3. Spacing

### Semantic Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--space-page-x` | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)` | Vertical padding between sections |
| `--space-card-gap` | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards in grids |
| `--space-stack` | `1.5rem` | Default vertical stack spacing |
| `--space-cluster` | `0.75rem` | Tight groupings (label + value, icon + text) |

### Rules

1. If a spacing value appears in 3+ sections, it becomes a token.
2. Unique component-internal spacing stays as scoped CSS with standard Tailwind classes.
3. **Arbitrary Tailwind values (`p-[22px]`) are banned** — use standard scale or a token.
4. Use `clamp()` for fluid values that scale across viewports.
5. Tailwind's default spacing scale (0.5, 1, 1.5, 2, 3, 4, ...) covers everything the semantic tokens don't.

---

## 4. Typography

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `text-hero` | `clamp(64px, min(9vw, 11svh), 130px)` | Hero wordmark only |
| `text-display` | `clamp(40px, 5vw, 64px)` | Page titles, hero headlines |
| `text-title` | `clamp(28px, 4vw, 40px)` | Section headings (H2) |
| `text-heading` | `clamp(20px, 3vw, 24px)` | Card titles, H3 |
| `text-subheading` | `18px` | Subtitles, H4 |
| `text-body-lg` | `18px` | Lead paragraphs |
| `text-body` | `16px` | Paragraphs, descriptions |
| `text-small` | `14px` | Metadata, labels |
| `text-mono` | `13px` | Terminal, code, SQL |
| `text-caption` | `12px` | Timestamps, footnotes, tags |
| `text-micro` | `10px` | Chrome annotations, stop labels |

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

| Element | When to use |
|---------|-------------|
| `<section>` | Major content regions with a heading |
| `<article>` | Self-contained content (blog post, project card, service) |
| `<figure>` + `<figcaption>` | Images with captions, code with labels |
| `<nav>` with `aria-label` | Navigation regions (distinguish with labels) |
| `<aside>` | Complementary content (sidebars, TOC, filters) |
| `<header>` / `<footer>` | Page or section headers/footers |
| `<time datetime>` | All dates — must have machine-readable `datetime` attribute |
| `<button>` | Every interactive element — **never `<div onclick>`** |
| `<a>` | Navigation — must have `href` |

---

## 6. Component Standards

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

**Use for:** Interactive a11y primitives (Dialog, Collapsible, Tabs, Toggle, Tooltip).
**Don't use for:** Presentational components (cards, labels, badges, separators).

**Wrapping pattern:**

```
bits-ui (headless)  →  brand wrapper (our styling + GSAP)  →  page component
   Dialog.Root           BrandDialog                          StackBottomSheet
   Collapsible.Root      BrandCollapsible                     CollapsibleSection
   Tabs.Root             BrandTabs                            StationTabs
```

`forceMount` + `child` snippet gives full GSAP control. Bits UI handles a11y (focus trap, ESC, ARIA), we handle brand styling and animation.

### File Size Limits

| Limit | Action |
|-------|--------|
| < 400 lines | Ideal |
| 400–600 lines | Acceptable if cohesive. Flag for review. |
| > 600 lines | **Must split.** Extract sub-components or utilities. |

---

## 7. Accessibility

### Minimum Requirements (every component)

| Requirement | Rule |
|-------------|------|
| Keyboard navigable | Every interactive element reachable via Tab, operable via Enter/Space |
| Focus visible | `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }` |
| No `<div onclick>` | Interactive elements must be `<button>`, `<a>`, or Bits UI primitive |
| Zero `svelte-ignore a11y_*` | No a11y suppressions. Redesign if needed. |
| ARIA attributes | Decorative → `aria-hidden`. Regions → `aria-label`. State → `aria-expanded`, `aria-pressed` |
| One `<h1>` per page | Never skip heading levels. Every `<section>` needs a heading. |
| Reduced motion | Every animation (GSAP + CSS) must respect `prefers-reduced-motion` |

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

| Animation type | Tool |
|---------------|------|
| Scroll-linked reveals | GSAP ScrollTrigger |
| Complex choreography | GSAP Timeline |
| Hover/focus states | CSS `transition` with duration/easing tokens |
| Looping decorative | CSS `@keyframes` |
| Mount/unmount (dialogs, sheets) | Bits UI `forceMount` + GSAP |
| Svelte `transition:` / `animate:` | **Never** — GSAP is the motion system |

### Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `150ms` | Hover, toggles, micro-interactions |
| `--duration-normal` | `200ms` | Standard transitions |
| `--duration-slow` | `300ms` | Panel open/close, reveals |
| `--duration-slower` | `500ms` | Page transitions, large reveals |
| `--ease-default` | `ease` | General purpose |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions |
| `--ease-decel` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |

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

### 5 Canonical Breakpoints

| Prefix | Width | Devices | Layout |
|--------|-------|---------|--------|
| *(base)* | < 360px | Galaxy Fold closed | Single column, stacked |
| `sm:` | 360px | iPhone SE, most phones | Single column, edge-to-edge cards |
| `md:` | 520px | Foldables open, large phone landscape | 2-column grids, split panels |
| `lg:` | 768px | iPad Mini, tablets | Sidebars appear, 3-col grids |
| `xl:` | 1024px | Laptops, iPad Pro landscape | Full asymmetric layouts |
| `2xl:` | 1440px | Desktop monitors | Maximum edge decor, widest panels |

Defined in `src/lib/styles/tokens.css` + `src/app.css` `@theme`. Replaces Tailwind v4 defaults.

### Viewport Units

| Unit | When |
|------|------|
| `dvh` | Full-height sections — updates with browser chrome |
| `svh` | Stable measurements — font sizing, scroll calculations |
| `lvh` | Maximum possible height — background sizing |
| `vh` | **Never** — inconsistent on mobile |

### Safe Areas

```css
/* Required on: nav, footer, fixed/sticky elements, bottom sheets, overlays */
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-top: env(safe-area-inset-top, 0px);
```

`viewport-fit=cover` in `<meta name="viewport">` is required for `env()` to work.

### Rules

1. **Mobile-first.** Base = smallest screen. Breakpoints add complexity.
2. **Edge-to-edge at every viewport.** Cards touch edges on mobile. Edge decor scales on desktop.
3. **No horizontal scroll.** Every component, every breakpoint.
4. **One breakpoint system.** Only the 5 canonical values. No one-off `@media (max-width: 767px)`.
5. **`clamp()` for fluid values.** Typography and spacing scale fluidly. Breakpoints handle layout structure.
6. **Touch-first on sm/md.** 44x44px minimum touch targets.

---

## 10. File Organization

### Size Limits

| Limit | Action |
|-------|--------|
| < 400 lines | Ideal |
| 400–600 lines | Acceptable if cohesive |
| > 600 lines | **Must split** |

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
- `svelte-ignore a11y_*` — redesign instead
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

| File | Purpose |
|------|---------|
| `src/lib/styles/tokens.css` | CSS custom properties (theme-switching, brand, spacing, shadows, z-index, transitions, opacity, radius) |
| `src/app.css` `@theme` block | Tailwind v4 utilities (type scale, spacing, container widths, breakpoints) |
| `src/app.css` `@theme inline` block | Dynamic tokens that reference `var()` (colors, borders) |

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
