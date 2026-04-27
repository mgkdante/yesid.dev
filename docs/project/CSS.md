# CSS Architecture — Design System Reference

**Last updated:** 2026-04-18
**Status:** Active — post-17a-4, Slice 17h prep

> Single source of truth for the yesid.dev design system tokens, layers, and rules.

> **Token catalog:** all design tokens (colors, typography, spacing, shadows, z-index, transitions, opacity, radius, container widths) live in [`/DESIGN.md`](../../DESIGN.md) (Google-spec strict). This file carries the **architecture + rules + process** for working with tokens — not the values.

## Architecture

```
tokens.css (:root)     →  CSS custom properties (semantic tokens)
                           ↓
app.css (@theme)       →  Tailwind v4 utility bridge (--font-size-*, --shadow-*, etc.)
                           ↓
Tailwind utilities     →  Composable classes (text-display, shadow-card, z-nav)
                           ↓
<style> scoped         →  Component-specific layout, animations, pseudo-elements
```

**Three layers, strict separation:**

| Layer | File | Purpose | Example |
|-------|------|---------|---------|
| Semantic tokens | `src/lib/styles/tokens.css` | Theme-switching CSS custom properties | `var(--background)`, `var(--muted-foreground)` |
| Brand utilities | `src/app.css` `@theme` block | Static brand values mapped to Tailwind utilities | `text-brand-primary`, `bg-brand-accent` |
| Component scope | `<style>` in `.svelte` | Layout/structure specific to one component | grid templates, position, overflow |

---

## Breakpoints

Tailwind v4 defaults — `@theme` in `app.css` keeps no `--breakpoint-*` overrides.

| Prefix | Width | Layout transition |
|--------|-------|-------------------|
| `sm:` | `640px` | Large phone landscape → comfortable single column |
| `md:` | `768px` | Tablet → 2-column grids, sidebars appear |
| `lg:` | `1024px` | Laptop → full asymmetric layouts, edge decor |
| `xl:` | `1280px` | Desktop → maximum widths, widest panels |
| `2xl:` | `1536px` | Ultrawide → optional ceiling |

Design guideline: mobile-first. Base = smallest screen. Breakpoints add complexity. CONSTITUTION § 9 has the device-coverage matrix that frames design intent orthogonally to these Tailwind breakpoints.

### Viewport Units

| Unit | When |
|------|------|
| `dvh` | Full-height sections — updates with browser chrome |
| `svh` | Stable measurements — font sizing, scroll calculations |
| `lvh` | Maximum possible height — background sizing |
| `vh` | **Never** — inconsistent on mobile |

### Safe Areas

`env(safe-area-inset-*)` applied to: Nav (top), Footer (bottom), StackBottomSheet (bottom), MenuOverlay (top + bottom), tech-stack build overlay (bottom). Requires `viewport-fit=cover` in `<meta>` tag.

---

## Rules

1. **Zero hardcoded colors.** Use `var(--token)` or Tailwind brand class.
2. **Tailwind for composition, scoped styles for structure.** Scoped `<style>` for complex layouts, animations, pseudo-elements.
3. **No `!important`.** Fix the cascade instead.
4. **No inline `style=`** except dynamic JS values (scroll position, transforms).
5. **DRY through tokens, not classes.** Extract tokens or shared components, not `.my-card-style` utilities.
6. **One source of truth per value.** Defined in one place, referenced everywhere.
7. **Document before adding.** New tokens require a CSS.md entry.
8. **Mobile-first responsive.** Base = mobile. `md:` and `lg:` add complexity.
9. **Prefer logical properties.** `padding-inline`, `margin-block` over `padding-left`, `margin-top`.
10. **Group utilities.** Order: layout -> spacing -> sizing -> typography -> color -> effects -> state.

## Global Keyframes (app.css)

| Keyframe | Pattern | Usage |
|----------|---------|-------|
| `blink` | 0%/100%: opacity 1, 50%: opacity 0 | `TerminalCursor.svelte` cursor underscore |
| `pulse-glow` | Opacity 1 ↔ 0.7 + brand box-shadow 4px → 10px | `StopLabel`, `MetricDisplay` pulse-glow areas, `ManifestoEdgeBottom` `.manifesto__status-dot` (consolidated 17e-5 from scoped keyframe) |
| `station-ping` | Scale 1 → 2.5 + opacity 0.6 → 0 | `MetroStation.svelte` outward ping |
| `typewriter-blink` | 0%/100% visible, 50% hidden (`step-end`) | Hero scroll-prompt cursor (`.typewriter-cursor`, 17e-4; keyframe fixed 17e-5) |

**Rule:** If a `@keyframes` is used by 2+ components, it moves to `app.css`. Component-specific one-offs stay scoped.

Consumers apply keyframes via explicit `animation:` declarations. The one utility-class shortcut is `.led-pulse` (see utility table below) — a named alias for `animation: pulse-glow 2s ease-in-out infinite`. Current consumers all use direct `animation:` declarations; `.led-pulse` is available for future adoption.

---

## Brand Utility Classes (app.css)

12 utility classes for shared brand patterns. Wired into components in Phase B (17a-2b).

> **Card surface:** `ui/card` (`src/lib/components/ui/card/`) is the single card surface for all cards site-wide. Use `<Card>` instead of any utility class for card styling.

| # | Class | Purpose |
|---|-------|---------|
| 1 | `.brand-fade-line` | Gradient line from brand-primary to transparent |
| 2 | `.divider-dashed` | Dashed border-top with `--border-strong` |
| 3 | `.scrollbar-hidden` | Hide scrollbar, preserve scroll |
| 4 | `.brand-glow-hover` | Hover border + shadow glow transition |
| 5 | `.img-desat` | Grayscale B&W, color on hover |
| 6 | `.grid-responsive-cards` | 1→2→3 column responsive grid |
| 7 | `.label-section` | Mono uppercase, caption size, muted color |
| 8 | `.label-station` | Mono uppercase, small size, brand-primary color |
| 9 | `.label-metric` | Mono uppercase, caption size, 2px tracking |
| 10 | `.prose-dark` | Full markdown prose styling (blog + work detail) |
| 11 | `.led-pulse` | Pulse-glow animation for LED indicators |
| 12 | `.grid-rows-collapse` | CSS-grid collapse/expand rows via `[data-state]` |

---

## Brand Primitives (`src/lib/components/brand/`)

12 reusable components (slice-design refresh — `GlowOverlay` removed; 0 consumers). Built in 17a-2a, expanded in 17d (MetroStation, SectionHeading, SvgIcon, BlueprintShell).

| Component | Props | Replaces |
|-----------|-------|----------|
| `StatusDot` | `color`, `pulse`, `size`, `ring` | 8+ pulsing dots (17a-4: `ring` prop adds outline halo) |
| `SectionLabel` | `text`, `variant`, `align` | 25+ mono labels |
| `SectionHeading` | `heading`, `dotAccent`, `labelText`, `align` | Heading + dot + subheading patterns |
| `StopLabel` | `stop`, `label` | 10 About bento stops |
| `MetroStation` | `name`, `color`, `size`, `ping` | Station badge + pulse markup |
| `ChevronToggle` | `open`, `size`, `direction` | 8+ expand arrows |
| `MetricDisplay` | `value`, `label`, `sublabel`, `size` | 6 stat combos |
| `CornerMarks` | `size`, `opacity` | 8 blueprint ticks |
| `TerminalChrome` | `title`, `tag`, `status`, `footer`, `children` | 4 terminal windows |
| `StickyPanel` | `top`, `children` | 4 sticky sidebars |
| `SvgIcon` | `name`, `size`, `animate` | SVG loader + DrawSVG/morph animation wrapper |
| `BlueprintShell` | `children`, `corners`, `label` | Blueprint frame with corners + label |

Import: `import { StatusDot, SectionHeading } from '$lib/components/brand';`

### Migrated into `ui/` (17d)

6 primitives moved to shadcn ui/ wrappers — don't import from `brand/` for these:

| Former brand/ | New home | Notes |
|---------------|----------|-------|
| `Tag`, `NumberBadge` | `ui/badge` | Unified pill surface |
| `HazardStripe`, `GradientSeparator` | `ui/separator` | Separator variants |
| `BrandButton` | `ui/button` | shadcn Button with brand tokens |
| `CardBase` | `ui/card` | Single card surface site-wide (see §13 Atomic Design in CONSTITUTION.md) |

---

## Font Loading (Self-Hosted)

Fonts are self-hosted via `@fontsource-variable` packages (no Google Fonts CDN). This eliminates layout shift from font-swap delay.

| Package | Font | Usage |
|---------|------|-------|
| `@fontsource-variable/inter` | Inter Variable | Headings + body text |
| `@fontsource-variable/jetbrains-mono` | JetBrains Mono Variable | Code, terminals, mono labels |

**How it works:**
- Packages are imported in `+layout.svelte` (client-side only, guarded by `browser` check)
- `:root` font-family overrides in `app.css` set the variable font stacks globally
- The `@theme` block references these same font families for Tailwind utility generation

---

## Overflow Patterns

| Pattern | When | Why |
|---------|------|-----|
| `overflow-x: clip` | Containers with sticky children | Clips visually without creating a scroll container (preserves `position: sticky`) |
| `overflow-x: hidden` | Containers that need scroll containment | Creates a scroll container — breaks sticky positioning for children |
| `overflow-x: auto` on child | Code blocks inside cards | Allows horizontal scroll within the constrained parent |

**Key rule:** Never use `overflow-x: hidden` on a parent that contains `position: sticky` children. Use `overflow-x: clip` instead.

---

## Prose Styling

Blog and project detail pages use `.prose-dark` utility (defined in `app.css`) plus additional scoped overrides:

| Property | Mobile | Desktop | Where |
|----------|--------|---------|-------|
| Base font size | 17px | 18px | `.prose-dark` in `app.css` |
| Scroll margin top | `5rem` | `5rem` | Global rule in `app.css` for all `[id]` headings |
| Code block overflow | `overflow-x: auto` | `overflow-x: auto` | Shiki `pre` blocks scroll horizontally |

Shiki brand theme (`yesid-brand`) colors: orange keywords, yellow strings, warm dark background, muted comments.

---

## Adding a new token

1. Edit `packages/tokens/tokens.json` — add the token to the appropriate group (color, text, space, radius, shadow, z, duration, ease, opacity, container).
2. Run `bun run tokens:build` — regenerates `tokens.css`, `app.css @theme`, `motion/tokens.ts`, `DESIGN.md`.
3. Run `bun run test` — parity tests verify the cascade.
4. Run `bun run tokens:lint` — design-md lint clean.
5. Commit `packages/tokens/tokens.json` together with the generated outputs (the pre-commit hook enforces this).

---

## Anti-Patterns

- `text-[Npx]` — use semantic type scale tokens
- Hardcoded hex in class strings — use `var()` or brand utilities
- `style="font-size: 14px"` — use `text-small` class
- `z-index: 9999` — use z-index scale tokens
- `transition: all 0.3s` — use duration/easing tokens
- `overflow-x: hidden` on containers with sticky children — use `overflow-x: clip`
- Google Fonts CDN — use `@fontsource-variable` self-hosted packages
