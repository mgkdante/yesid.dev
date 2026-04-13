# yesid.dev Constitution — Design Spec

**Date:** 2026-04-13
**Type:** Planning Session — Holistic Design System
**Status:** Approved
**Scope:** Slice 17 remaining phases (17a-5, 17a-6, 17d, 17e, 17a-4)
**Wireframes:** `.superpowers/brainstorm/919-1776054861/content/constitution-edge-to-edge.html`

---

## 1. Philosophy

The constitution is the law of the codebase. Every component, every page, every future slice follows it. It replaces ad-hoc decisions with a system.

### Guiding Principles

1. **The viewport is the canvas.** Edge-to-edge design everywhere. No wasted gutters. Content, SVGs, panels, typography USE the edges. Text containers center for readability; everything else fills the viewport.
2. **Tokens over magic numbers.** If a value repeats, it's a token. If it doesn't repeat, it's scoped CSS with a comment explaining why.
3. **Accessibility is infrastructure, not decoration.** Keyboard nav, focus management, semantic HTML, ARIA — non-negotiable. Bits UI handles the hard parts.
4. **Show the craft.** Use battle-tested libraries (Bits UI) for what they're good at. Build custom for what makes yesid.dev unique. The code itself demonstrates the philosophy: clean, scalable, intentional.
5. **Simple to grow.** Adding a new page or component means composing from the system, not inventing patterns. A junior dev (or future-you) should read the constitution and know exactly how to build the next thing.
6. **Young and bold.** Awwwards/Dribbble-level immersive design. Typography as a design element. Oversized type, mono annotations at edges, asymmetric layouts. Every pixel is intentional.

### Document Structure

The constitution lives at `docs/reference/CONSTITUTION.md` and covers:

1. Tokens (reference → CSS.md)
2. Layout Model (edge-to-edge, Section pattern, containers)
3. Spacing (semantic tokens, Tailwind scale rules)
4. Typography (type scale, heading hierarchy, type-as-design)
5. Semantic HTML (element selection rules)
6. Component Standards (props, class/rest, typing)
7. Accessibility (keyboard, focus, ARIA minimums)
8. Bits UI Integration (when/how, wrapping pattern)
9. Motion (GSAP vs CSS, reduced-motion, timing tokens)
10. Responsive (breakpoints, viewport units, safe areas, device support)
11. File Organization (size limits, co-location, naming)
12. Anti-Patterns (explicit list of what NOT to do)

Each section has: the rule, why it exists, a code example, and what to do when unsure.

---

## 2. Layout Model — Edge-to-Edge

### The One Rule

Every page renders at full viewport width. The `<main>` element provides only vertical flex — no horizontal constraints. The viewport IS the canvas.

### Edge-to-Edge vs Centered-in-a-Box

**Wrong:** Full-width wrapper → centered content box → everything inside the box. Empty gutters wasted.

**Right:** Full viewport → text containers center for readability → visual elements (SVGs, panels, decorations, grids) USE the edges. No wasted space. The edges are designed.

### The Section Pattern

Every major content block follows:

```svelte
<section class="w-full">
  <!-- Text/content: centered at appropriate container width -->
  <!-- Visual elements: bleed to viewport edges -->
  <!-- Decorative elements: anchored at edges -->
</section>
```

### 4 Layout Patterns

**Pattern A — Asymmetric Split:**
Text on one side, visual panel bleeding to the opposite edge. Used for heroes, feature sections.

**Pattern B — Centered Text + Edge Decoration:**
Prose centered for readability. Decorative elements (circuit lines, labels, dots) at viewport edges.

**Pattern C — Full-Bleed Visual Band:**
100% width visual sections: image galleries, data visualizations, separator moments. No container at all.

**Pattern D — Edge-Anchored Grid:**
Cards/panels extend to viewport edges on mobile (no margin), breathe with gutters on desktop. Grid borders can touch both edges.

### Container Tokens (text readability only)

| Token | Value | When to use |
|-------|-------|-------------|
| `--container-content` | `64rem` (1024px) | Default text sections, listings, grids |
| `--container-wide` | `72rem` (1152px) | Detail pages with sidebars |
| `--container-prose` | `65ch` | Blog text, long-form reading |
| (no container) | 100vw | Heroes, galleries, separators, visual panels |

**Rule:** Containers are guides for text readability, NOT constraints for the whole section. Visual elements, SVGs, panels, and decorative elements live OUTSIDE containers.

### Migration Impact

| Current pattern | Becomes |
|----------------|---------|
| Layout's `max-w-5xl px-6` on `<main>` | Removed. `<main>` = `flex-1` only |
| Blog/work pages constrained by layout | Full-bleed with prose container inside |
| `max-w-6xl` in WorkDetailPage | `var(--container-wide)` |
| `max-w-[1920px]` in AboutPage | Removed — full-bleed is default |
| `padding: 0 3rem/5rem/8rem` in ServiceCard | `var(--space-page-x)` |

---

## 3. Spacing

### Semantic Spacing Tokens (NEW)

Replace ~230 hardcoded spacing values in scoped styles:

| Token | Value | Purpose |
|-------|-------|---------|
| `--space-page-x` | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)` | Vertical padding between sections |
| `--space-card-gap` | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards in grids |
| `--space-stack` | `1.5rem` | Default vertical stack spacing |
| `--space-cluster` | `0.75rem` | Tight groupings (label + value, icon + text) |

### Rules

- If a spacing value appears in 3+ sections, it becomes a token.
- Unique component-internal spacing stays as scoped CSS with standard Tailwind classes.
- Arbitrary Tailwind values (`p-[22px]`) are banned — use standard scale or a token.
- `clamp()` for fluid values that scale across viewports.

---

## 4. Typography

### Type Scale (already implemented, now enforced)

| Token | Size | Usage |
|-------|------|-------|
| `text-display` | `clamp(40px, 5vw, 64px)` | Hero headlines, page titles |
| `text-title` | `clamp(28px, 4vw, 40px)` | Section headings (H2) |
| `text-heading` | `clamp(20px, 3vw, 24px)` | Card titles, H3 |
| `text-subheading` | `18px` | Subtitles, H4 |
| `text-body-lg` | `18px` | Lead paragraphs, hero subtitles |
| `text-body` | `16px` | Paragraphs, descriptions |
| `text-small` | `14px` | Metadata, labels |
| `text-mono` | `13px` | Terminal text, code, SQL |
| `text-caption` | `12px` | Timestamps, footnotes, tags |
| `text-micro` | `10px` | Chrome annotations, stop labels |

### Typography as Design

Typography isn't just for reading — it's a design element:

- **Oversized display type** — bold headlines that command attention
- **Mono annotations at edges** — `// section-label` patterns, rotated sidebar text, edge-anchored labels
- **Type contrast** — Inter for human text, JetBrains Mono for system/data/code
- **Size contrast** — display-size metrics next to caption-size labels creates visual hierarchy

### Heading Hierarchy Rules

- One `<h1>` per page — never skip levels
- Every `<section>` should have a heading (can be `sr-only` if visually hidden)
- Use semantic heading levels for structure, CSS for visual size

### Exception

HeroBanner wordmark uses `text-[64px]` / `md:text-[clamp(72px,...,130px)]` — intentionally outside the type scale.

---

## 5. Semantic HTML

| Element | When to use |
|---------|-------------|
| `<section>` | Major content regions with a heading |
| `<article>` | Self-contained content (blog post, project card, service) |
| `<figure>` + `<figcaption>` | Images with captions, code with labels, project screenshots |
| `<nav>` with `aria-label` | Navigation regions (distinguish with labels) |
| `<aside>` | Complementary content (sidebars, TOC, filters) |
| `<header>` | Page or section headers |
| `<footer>` | Page or section footers |
| `<time datetime>` | All dates must use machine-readable `datetime` |
| `<button>` | Every interactive element — never `<div onclick>` |
| `<a>` | Navigation — must have `href` |

### Current Gaps to Fix

| Issue | Fix | Sub-slice |
|-------|-----|-----------|
| Home has dual `<h1>` | Merge into single `<h1>` with `<span>` children | 17d |
| Manifesto has no heading | Add visually hidden `<h2>` | 17d |
| `<h3>` without `<h2>` in About | Fix hierarchy | 17d |
| 0 `<figure>` usage | ProofReel images, polaroids, service SVGs | 17d |
| 8 `<div onclick>` patterns | Replace with `<button>` or Bits UI | 17d |
| BlogCard `<time>` missing `datetime` | Add attribute | 17d |
| BlogRow, BlogDetailHeader dates as plain text | Wrap in `<time>` | 17d |

---

## 6. Component Standards

### Universal Prop Pattern

Every component follows this pattern:

```typescript
export interface ComponentNameProps {
  /** What this prop does */
  propName: string;
  /** Optional with default */
  variant?: 'primary' | 'ghost';
  /** Allow consumer styling */
  class?: string;
  /** Allow consumer attributes */
  [key: string]: any;  // via ...rest
}

let { propName, variant = 'primary', class: className = '', ...rest }: ComponentNameProps = $props();
```

### Rules

1. Every component exports a named `Props` interface (not inline types)
2. Every component accepts `class` prop + `...rest` spread
3. Props use `$props()` destructuring with defaults
4. JSDoc on every non-obvious prop
5. Interfaces re-exported through barrel files

### Bits UI Integration

**Adopted for:** Interactive a11y primitives (Dialog, Collapsible, Tabs, Toggle). NOT for presentational components.

**Wrapping pattern:** Bits UI components are wrapped in brand-styled components, never used raw in pages:

```
bits-ui (headless)  →  brand wrapper (our styling + GSAP)  →  page component
   Dialog.Root           BrandDialog                          StackBottomSheet
   Collapsible.Root      BrandCollapsible                     CollapsibleSection
   Tabs.Root             BrandTabs                            StationTabs
```

Key: `forceMount` + `child` snippet gives full GSAP control. Bits UI handles a11y (focus trap, ESC, ARIA), we handle brand styling and animation.

### New Brand Wrappers (17d)

| Wrapper | Bits UI base | Replaces |
|---------|-------------|----------|
| `BrandDialog` | `Dialog` | StackBottomSheet, MenuOverlay, filter modals |
| `BrandCollapsible` | `Collapsible` | CollapsibleSection manual `aria-expanded` |
| `BrandTabs` | `Tabs` | StationTabs, AboutTestimonials manual tablist |
| `BrandTooltip` | `Tooltip` | (new capability for future use) |

### Existing Primitives — Status

**Keep as-is (11 of 15):** StatusDot, SectionLabel, StopLabel, NumberBadge, ChevronToggle, HazardStripe, GlowOverlay, MetricDisplay, CornerMarks, TerminalChrome, GradientSeparator. These are presentational/decorative — no Bits UI needed.

**Get Bits UI underneath (2 of 15):**

- **Tag:** `interactive=true` currently renders `<span>` — must use Bits UI `Toggle` for keyboard a11y
- **BrandButton:** Needs `disabled` state, `type="button"` default — wrap Bits UI `Button`

**Fix a11y only (2 of 15):**

- **CardBase:** When `interactive=true` + no `href`, needs keyboard support
- **StickyPanel:** No changes needed

**All 15 get:** `class` + `...rest` props if missing (currently only 4/15 have this)

### Deduplication Targets (17d)

| Duplication | Resolution |
|------------|-----------|
| `isTouchDevice()` x3 | Extract to `$lib/motion/utils/device.ts` |
| BlogSvgIcon / WorkSvgIcon (70% identical) | Merge into `SvgIcon` with `trigger` prop |
| SHAPES constant x3 | Extract to `$lib/data/shapes.ts` |
| `station-ping` keyframes x2 | Move to `app.css` global keyframes |
| StackPanel / StackBottomSheet similar CSS | Extract shared patterns to tokens |

### File Size Limits

| Limit | Action |
|-------|--------|
| < 400 lines | Ideal |
| 400-600 lines | Acceptable if cohesive. Flag for review. |
| > 600 lines | **Must split.** Extract sub-components or utilities. |

**Current violations:** Manifesto (1006), tech-stack (909), HomeCloser (760), HeroBanner (734). All broken up in 17d.

---

## 7. Accessibility

### Minimum Requirements (every component)

| Requirement | Rule |
|-------------|------|
| Keyboard navigable | Every interactive element reachable via Tab, operable via Enter/Space |
| Focus visible | `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }` on every interactive element |
| No `<div onclick>` | Interactive elements must be `<button>`, `<a>`, or Bits UI primitive |
| Zero `svelte-ignore a11y_*` | No a11y suppressions allowed. Redesign if needed. |
| ARIA attributes | Decorative → `aria-hidden`. Regions → `aria-label`. State → `aria-expanded`, `aria-pressed` |
| One `<h1>` per page | Never skip heading levels. Every `<section>` needs a heading. |
| Reduced motion | Every animation (GSAP + CSS) must respect `prefers-reduced-motion` |

### The svelte-ignore Purge (17d)

All 15 current suppressions become 0:

| Files | Fix |
|-------|-----|
| tech-stack (x3), StackBottomSheet (x2), MenuOverlay | `<div onclick>` backdrops → `BrandDialog` (Bits UI) |
| StackDiagram, ProofReel, HomeServices, AboutInterests | `<div onclick>` → `<button>` |

**Hard rule:** No new `svelte-ignore a11y_*` comments. If it can't be made accessible, redesign it.

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

## 8. Motion Convention

### When to Use What

| Animation type | Tool |
|---------------|------|
| Scroll-linked reveals | GSAP ScrollTrigger |
| Complex choreography | GSAP Timeline |
| Hover/focus states | CSS `transition` with duration/easing tokens |
| Looping decorative | CSS `@keyframes` |
| Mount/unmount (dialogs, sheets) | Bits UI `forceMount` + GSAP |
| Svelte `transition:` / `animate:` | **Never** — GSAP is the motion system |

### Motion Tokens (enforced)

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

### 17e: Ground-Up Motion Re-Engineering

**Hard rule:** 17e does NOT patch existing code. It tears down and rebuilds.

After 22+ slices of iterative building, the animation code has accumulated hacks, workarounds, and bolted-on fixes. 17e architects the motion system from scratch:

1. **Design the preset system first** — factories, timing, reduced-motion, scroll patterns
2. **Rewrite each animation** to use presets — not "find and replace," but re-engineer
3. **If an animation can't use a preset, the preset system grows** — never add a hack
4. **Every preset bakes in:** timing tokens, easing tokens, reduced-motion guards, cleanup on destroy

Conceptual shape (implementation in 17e planning):

```typescript
// $lib/motion/presets/
fadeIn(element, options?);           // opacity 0→1
slideUp(element, options?);          // y:offset→0 + fade
staggerReveal(elements, stagger?);   // staggered entrance
scrollReveal(element, trigger?);     // ScrollTrigger-based
morphShape(element, target?);        // MorphSVG preset
```

### Global Keyframes (app.css)

| Keyframe | Used by |
|----------|---------|
| `blink` | Terminal cursors, indicators |
| `pulse-glow` | LED dots, status indicators |
| `station-ping` | Station active dots (currently duplicated — consolidate) |
| `gradient-flow` | GradientSeparator |

**Rule:** If a `@keyframes` is used by 2+ components, it moves to `app.css`. Component-specific animations stay scoped.

---

## 9. Responsive Standards

### 5 Canonical Breakpoints

| Prefix | Width | Devices | Layout |
|--------|-------|---------|--------|
| (base) | < 360px | Galaxy Fold closed (280px) | Single column, stacked |
| `sm:` | 360px | iPhone SE, most phones | Single column, edge-to-edge cards |
| `md:` | 520px | Foldables open, large phone landscape | 2-column grids, split panels appear |
| `lg:` | 768px | iPad Mini, tablets | Sidebars appear, 3-col grids |
| `xl:` | 1024px | Laptops, iPad Pro landscape | Full asymmetric layouts |
| `2xl:` | 1440px | Desktop monitors | Maximum edge decor, widest panels |

**Migration:** Replaces Tailwind v4 defaults (640/768/1024/1280/1536). Defined in `tokens.css` + `app.css` `@theme`.

### Viewport Units

| Unit | When |
|------|------|
| `dvh` | Full-height sections — updates with browser chrome |
| `svh` | Stable measurements (scroll calculations) |
| `lvh` | Maximum possible height (background sizing) |
| `vh` | **Never** — inconsistent on mobile |

### Safe Areas

```css
/* Required on: nav, footer, fixed/sticky, bottom sheets */
padding-bottom: env(safe-area-inset-bottom);
padding-top: env(safe-area-inset-top);
```

Currently only 2 files use `env()`. Constitution expands site-wide.

### Responsive Rules

1. **Mobile-first.** Base = smallest screen. Breakpoints add complexity.
2. **Edge-to-edge at every viewport.** Cards touch edges on mobile. Edge decor scales on desktop.
3. **No horizontal scroll.** Every component, every breakpoint.
4. **One breakpoint system.** Only the 5 canonical values. No one-off `500px` or `767px`.
5. **`clamp()` for fluid values.** Typography and spacing scale fluidly. Breakpoints handle layout structure.
6. **Touch-first on sm/md.** 44x44px minimum targets. Tap replaces hover. Motion effects disabled.
7. **Container queries considered.** For component-level responsive (cards, panels) — 0 usage today, evaluate in 17d.

---

## 10. File Organization

### Size Limits

| Limit | Action |
|-------|--------|
| < 400 lines | Ideal |
| 400-600 lines | Acceptable if cohesive |
| > 600 lines | **Must split** |

### Naming

- Components: PascalCase (`BrandDialog.svelte`)
- Utilities: camelCase (`device.ts`)
- Brand primitives: `src/lib/components/brand/`
- Motion presets: `src/lib/motion/presets/`
- Shared data: `src/lib/data/`

### Co-location

- Test files next to source (never top-level `tests/`)
- Props interfaces in the component file, re-exported through barrel
- Component-specific types in the component file

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
- `max-width: 767px` — use canonical breakpoints only
- `vh` unit — use `dvh`/`svh`/`lvh`
- Svelte `transition:` / `animate:` — use GSAP
- Raw GSAP calls without reduced-motion guard
- Components without `class` + `...rest` props
- Inline types instead of exported interfaces
- Files > 600 lines without splitting

---

## 12. Library Decisions

### Bits UI — ADOPT

**Why:** Headless, Svelte 5 native, zero styling opinions, WAI-ARIA compliant, GSAP compatible via `forceMount` + `child` snippet, tree-shakeable. Solves accessibility without constraining design.

**Install:** `bun add bits-ui`

**Use for:** Dialog, Collapsible, Tabs, Toggle, Tooltip, Scroll Area — interactive components that need keyboard nav, focus trapping, ARIA.

**Don't use for:** Presentational components (cards, labels, badges, separators) — our brand primitives handle these.

### shadcn-svelte — CHERRY-PICK INSPIRATION

**Why not full adoption:** Token naming conflicts (`--primary` vs our `--brand-primary`), most components unused for a portfolio site.

**Take from it:** Component wrapping patterns, the "you own the code" philosophy, specific component implementations when needed.

### Skeleton — REJECT

**Why:** Invasive global styles, `--spacing` override breaks all Tailwind, 200+ competing tokens, Zag.js bundle bloat.

### Flowbite Svelte — REJECT

**Why:** JS-object theming (not CSS custom properties), dark mode mismatch, Svelte transition lock-in fights GSAP.

---

## 13. Sub-Slice Specifications

### Execution Order

```
17a-5 (Spacing + Layout)     ← first, most visual impact
  ↓
17a-6 (Bits UI Integration)  ← install + document patterns
  ↓
17d (Component API)          ← biggest slice, uses Bits UI + new layout
  ↓
17e (Motion Re-Engineering)  ← ground-up rebuild after components stabilize
  ↓
17a-4 (Dead Code Cleanup)   ← last, informed by everything above
```

### 17a-5: Spacing & Layout Constitution (2-3 sessions)

**Scope:**
- Define 5 semantic spacing tokens in `tokens.css`
- Define 5 canonical breakpoints in `tokens.css` + `@theme`
- Remove layout-level `max-w-5xl` constraint — all pages full-bleed
- Migrate sections to use spacing tokens + container tokens
- Fix arbitrary Tailwind values (28 instances)
- Migrate scoped style spacing (~230 rules) where they map to tokens
- Expand `env(safe-area-inset-*)` to all fixed/sticky elements
- Migrate `vh` → `dvh`/`svh`/`lvh` site-wide
- Write `CONSTITUTION.md` (the governance document)

**Acceptance criteria:**
- Zero arbitrary Tailwind spacing values
- All breakpoints use canonical 5 values
- No horizontal scroll at any breakpoint
- `CONSTITUTION.md` exists and covers all 12 sections

### 17a-6: Bits UI Integration (1-2 sessions)

**Scope:**
- Install `bits-ui`
- Build wrapping pattern: `BrandDialog`, `BrandCollapsible`, `BrandTabs`, `BrandTooltip`
- Document integration patterns in `CONSTITUTION.md`
- Test GSAP animation compatibility with `forceMount` + `child` snippet
- Wire 2 existing primitives to Bits UI (Tag → Toggle, BrandButton → Button)

**Acceptance criteria:**
- 4 brand wrappers built and tested
- Tag with `interactive=true` is keyboard accessible
- BrandButton has `disabled` state and `type="button"` default
- GSAP animations work inside Bits UI wrappers

### 17d: Component API (4 sessions)

**Scope:**
- Upgrade all brand primitives: `class` + `...rest` on all 15
- Replace hand-rolled dialogs with `BrandDialog` (5 files)
- Replace hand-rolled collapsibles with `BrandCollapsible` (6+ files)
- Replace hand-rolled tabs with `BrandTabs` (2 files)
- Fix all 15 `svelte-ignore a11y_*` suppressions
- Fix semantic HTML gaps (heading hierarchy, `<figure>`, `<time>`, `<button>`)
- Break up large files: Manifesto, tech-stack, HomeCloser, HeroBanner
- Deduplicate: isTouchDevice, SvgIcon merge, SHAPES extract, station-ping consolidate
- Export Props interfaces from all consumer components
- Apply `:focus-visible` standard to all interactive elements

**Acceptance criteria:**
- Zero `svelte-ignore a11y_*` comments
- Zero files > 600 lines
- All components export Props interfaces
- All interactive elements keyboard accessible
- All `<div onclick>` replaced with `<button>` or Bits UI

### 17e: Motion Re-Engineering (2-3 sessions)

**Scope:**
- Architect motion preset system from scratch (NOT patch existing)
- Build preset factories: `fadeIn`, `slideUp`, `staggerReveal`, `scrollReveal`, `morphShape`
- Every preset bakes in: timing tokens, easing tokens, reduced-motion guards, cleanup
- Rewrite all 75 GSAP calls to use presets
- Consolidate 18 CSS `@keyframes` — shared ones to `app.css`, unique stay scoped
- Standardize reduced-motion: consistent pattern for GSAP + CSS
- Centralize `isTouchDevice()` (from device.ts created in 17d)

**Acceptance criteria:**
- All GSAP animations route through preset system
- Zero raw `gsap.to/from/fromTo` in component files (only in presets)
- All animations have reduced-motion guards
- Shared keyframes in `app.css`, component-specific stay scoped
- Motion presets documented in `CONSTITUTION.md`

### 17a-4: Dead Code Cleanup (1 session)

**Scope:**
- Delete dead components: AboutBento, BlogCard, ProjectCard, SectionHeader
- Delete dead Three.js/Threlte files (6 files) + dev preview routes (2 routes)
- Remove unused tokens (22 defined but never referenced)
- Clean up metro line in ServiceListingPage (scrapped functionality)
- Final sweep for anything orphaned by 17d/17e refactors

**Acceptance criteria:**
- Zero dead components
- Zero unused tokens
- Zero dead routes
- `bun run check` passes

---

## 14. Session Estimates

| Sub-slice | Sessions | Dependencies |
|-----------|----------|-------------|
| 17a-5 Spacing + Layout | 2-3 | None |
| 17a-6 Bits UI Integration | 1-2 | None (can parallel 17a-5) |
| 17d Component API | 4 | 17a-5 + 17a-6 |
| 17e Motion Re-Engineering | 2-3 | 17d |
| 17a-4 Dead Code | 1 | 17d + 17e |
| **Total** | **10-13** | |

---

## 15. Research Summary (for reference)

### Codebase Audit Findings

| Category | Count |
|----------|-------|
| Arbitrary Tailwind spacing | 28 instances |
| Hardcoded CSS spacing in scoped styles | ~230 rules |
| Different container strategies | 5 approaches |
| `<div onclick>` a11y suppressions | 15 instances |
| Files > 500 lines | 4 (Manifesto 1006, tech-stack 909, HomeCloser 760, HeroBanner 734) |
| GSAP calls | 75 across 15 files |
| CSS `@keyframes` | 18 across 10 files |
| CSS reduced-motion guards | 16 files |
| JS reduced-motion guards | 32 files |
| Tailwind responsive classes | 121 across 41 files |
| CSS `@media` queries | 56 across 27 files |
| Modern viewport units (dvh/svh/lvh) | 14 occurrences in 5 files |
| `env(safe-area-inset-*)` | 2 files |
| Container queries | 0 |
| Svelte transitions | 0 |
| `isTouchDevice()` copies | 3 |
| BlogSvgIcon/WorkSvgIcon overlap | 70% identical |
| SHAPES constant copies | 3 |
| `station-ping` keyframe copies | 2 |

### Library Evaluation Matrix

| Library | Svelte 5 | Headless | A11y | GSAP compat | Token conflicts | Verdict |
|---------|---------|---------|------|-------------|----------------|---------|
| Bits UI | Native | Yes | Excellent (WAI-ARIA) | Excellent (forceMount) | None | **ADOPT** |
| shadcn-svelte | Yes | Copy-paste | Good (via Bits UI) | Good | Medium (naming) | Cherry-pick |
| Skeleton | Native | No (styled) | Good (Zag.js) | Caveats | **High** (200+ tokens) | Reject |
| Flowbite Svelte | Native | No (pre-styled) | Moderate | Caveats (Svelte transitions) | **High** (JS theming) | Reject |
