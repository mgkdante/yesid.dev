# CSS Architecture — Design System Reference

**Last updated:** 2026-04-13
**Status:** Active — Slice 17a-6 Bits UI Integration

> Single source of truth for the yesid.dev design system tokens, layers, and rules.

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

## Type Scale

9 semantic tokens. Fluid headings use `clamp()`.

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

**Hard rules:** body >= 16px, mono >= 13px, labels >= 12px, micro for chrome only.

**Exception:** HeroBanner wordmark uses `text-[64px]` / `md:text-[clamp(72px,...,130px)]` — intentionally outside the type scale.

---

## Color Tokens

### Brand (static, never theme-switch)
Defined in `@theme`:

| Token | Value | Utility |
|-------|-------|---------|
| `--color-brand-primary` | `#E07800` | `text-brand-primary`, `bg-brand-primary` |
| `--color-brand-accent` | `#FFB627` | `text-brand-accent`, `bg-brand-accent` |
| `--color-brand-primary-hover` | `#C96A00` | `hover:bg-brand-primary-hover` |
| `--color-brand-accent-hover` | `#E5A220` | `hover:bg-brand-accent-hover` |

### RGB Channel Tokens (for variable opacity)
Defined in `tokens.css` `:root`:

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary-rgb` | `224 120 0` | `rgb(var(--brand-primary-rgb) / 0.5)` |
| `--brand-accent-rgb` | `255 182 39` | `rgb(var(--brand-accent-rgb) / 0.3)` |

### Semantic (theme-switching)
Defined in `tokens.css` per theme. Token names follow shadcn-svelte's **background/foreground pair** convention.

| Token | Dark | Light | Role |
|-------|------|-------|------|
| `--background` | `#141414` | `#FAFAF8` | Page background |
| `--foreground` | `#F5F5F0` | `#111111` | Main text |
| `--muted` | `#1E1E1E` | `#F0EDE5` | Card/panel background |
| `--muted-foreground` | `#666666` | `#888888` | De-emphasized text |
| `--card` | `#1a1a1a` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `var(--foreground)` | `var(--foreground)` | Card text |
| `--popover` | `#2A2A2A` | `#FFFFFF` | Hover/elevated surfaces |
| `--popover-foreground` | `var(--foreground)` | `var(--foreground)` | Popover text |
| `--primary` | `#E07800` | `#E07800` | Brand primary (orange) |
| `--primary-foreground` | `var(--background)` | `var(--background)` | Text on primary |
| `--secondary-foreground` | `#999999` | `#555555` | Supporting text |
| `--dim-foreground` | `#4a4a4a` | `#AAAAAA` | Faintest text |
| `--code-foreground` | `#cccccc` | `#333333` | Code/terminal text |
| `--light-foreground` | `#b3b3b3` | `#666666` | Light text variant |
| `--deep` | `#0D0D0D` | `#F0EDE5` | Deep backgrounds |
| `--terminal` | `#0a0a0a` | `#F5F5F0` | Terminal/code panels |
| `--manifesto` | `#0f0d0a` | `#F0EDE5` | Manifesto section |
| `--border` | `#3A3A3A` | `#D8D4CA` | Default borders |
| `--border-subtle` | `#2a2a2a` | `#D8D4CA` | Subtle borders |
| `--border-strong` | `#333333` | `#C0BDB5` | Emphasized borders |
| `--live` | `#22c55e` | `#16a34a` | Live/active indicator |
| `--destructive` | `#ff5f57` | `#dc2626` | Error states |
| `--success` | `#28c840` | `#16a34a` | Success states |
| `--warning` | `#f59e0b` | `#d97706` | Warning states |

### Token Naming Convention

Tokens follow the **shadcn-svelte background/foreground pair** pattern:
- Each surface color (e.g., `--card`) has a matching text color (e.g., `--card-foreground`)
- Components use the `cn()` utility from `$lib/utils` for Tailwind class composition with merge support
- The `data-slot` attribute identifies component parts for style targeting

### Adding new colors (checklist)
1. Add to `:root` or both `[data-theme]` blocks in `tokens.css`
2. Add to both `prefers-color-scheme` media query blocks
3. Map to `@theme` in `app.css` if a Tailwind utility is needed
4. Update this document

---

## Shadow Tokens

Uses `color-mix()` for brand-connected alpha values.

| Token | Usage |
|-------|-------|
| `--shadow-glow-sm` | Subtle brand glow (buttons, small elements) |
| `--shadow-glow-md` | Medium brand glow (cards on hover) |
| `--shadow-glow-lg` | Large brand glow (hero elements, modals) |
| `--shadow-card` | Card elevation (brand glow + depth) |
| `--shadow-section` | Section-level elevation |
| `--shadow-nav` | Navigation bar shadow |
| `--shadow-status` | Status indicator glow (uses `--status-live`) |

---

## Z-Index Scale

Global stacking context — no magic numbers.

| Token | Value | Assignment |
|-------|-------|------------|
| `--z-base` | `0` | Default content |
| `--z-content` | `1` | Above-base content |
| `--z-rail` | `30` | Side rails, scroll indicators |
| `--z-footer` | `40` | Footer |
| `--z-sheet` | `50` | Bottom sheets, drawers |
| `--z-menu` | `60` | Menu overlays |
| `--z-nav` | `70` | Navigation (highest) |

---

## Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `150ms` | Hover states, toggles |
| `--duration-normal` | `200ms` | Standard transitions |
| `--duration-slow` | `300ms` | Panel open/close |
| `--duration-slower` | `500ms` | Page transitions, reveals |
| `--ease-default` | `ease` | General-purpose easing |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions |
| `--ease-decel` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |

---

## Spacing Tokens

5 semantic tokens for recurring layout patterns. Defined in `tokens.css`, bridged to Tailwind via `@theme`.

| Token | Value | Purpose |
|-------|-------|---------|
| `--space-page-x` | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)` | Vertical padding between sections |
| `--space-card-gap` | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards in grids |
| `--space-stack` | `1.5rem` | Default vertical stack spacing |
| `--space-cluster` | `0.75rem` | Tight groupings (label + value, icon + text) |

Tailwind utilities: `px-page-x`, `py-section-y`, `gap-card-gap`, `gap-stack`, `gap-cluster`.

**Rules:** Arbitrary Tailwind spacing (`p-[22px]`) is banned — use standard scale or token. `clamp()` for fluid values.

---

## Container Widths

Containers are for **text readability only**, not section wrappers. Visual elements, SVGs, panels, and decorations live OUTSIDE containers at full viewport width.

| Token | Value | Usage |
|-------|-------|-------|
| `--container-content` | `64rem` (1024px) | Primary content width |
| `--container-wide` | `72rem` (1152px) | Wide layouts with sidebars |
| `--container-prose` | `65ch` | Prose/reading columns |

---

## Breakpoints

5 canonical breakpoints replacing Tailwind v4 defaults. Defined in `@theme` block of `app.css`.

| Prefix | Width | Devices |
|--------|-------|---------|
| `sm:` | `360px` | iPhone SE, most phones |
| `md:` | `520px` | Foldables open, large phone landscape |
| `lg:` | `768px` | iPad Mini, tablets |
| `xl:` | `1024px` | Laptops, iPad Pro landscape |
| `2xl:` | `1440px` | Desktop monitors |

Design guideline: mobile-first. Base = smallest screen. Breakpoints add complexity.

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

## Radius Tokens

Unified naming between `tokens.css` and `@theme`.

| Token | Value | Utility |
|-------|-------|---------|
| `--radius-sm` | `4px` | `rounded-sm` |
| `--radius-md` | `8px` | `rounded-md` |
| `--radius-lg` | `12px` | `rounded-lg` |
| `--radius-xl` | `16px` | `rounded-xl` |
| `--radius-pill` | `9999px` | `rounded-pill` |

---

## Opacity Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-muted` | `0.6` | De-emphasized elements |
| `--opacity-dim` | `0.3` | Background elements |
| `--opacity-subtle` | `0.15` | Borders, dividers |
| `--opacity-faint` | `0.05` | Ghost elements, circuit grid |

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
| `blink` | 0%/100%: opacity 1, 50%: opacity 0 | Terminal cursors, blinking indicators |
| `pulse-glow` | Oscillating opacity + brand glow box-shadow | LED dots, status indicators |

Used via `.led-pulse` utility class or direct `animation:` reference.

---

## Brand Utility Classes (app.css)

12 utility classes for shared brand patterns. Wired into components in Phase B (17a-2b).

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
| 12 | `.bento-card` | Full bento card bundle (border, bg, radius, hover) |

---

## Brand Primitives (`src/lib/components/brand/`)

15 reusable components built in Slice 17a-2a.

| Component | Props | Replaces |
|-----------|-------|----------|
| `StatusDot` | `color`, `pulse`, `size` | 8+ pulsing dots |
| `SectionLabel` | `text`, `variant`, `align` | 25+ mono labels |
| `StopLabel` | `stop`, `label` | 10 About bento stops |
| `Tag` | `text`, `size`, `active`, `accentColor`, `interactive` | 8+ tag pills |
| `NumberBadge` | `value`, `color`, `sonar` | 3 numbered circles |
| `ChevronToggle` | `open`, `size`, `direction` | 8+ expand arrows |
| `HazardStripe` | `size`, `angle`, `label` | 11+ stripe bars |
| `GlowOverlay` | `intensity` | 12 manual overlay divs |
| `MetricDisplay` | `value`, `label`, `sublabel`, `size` | 6 stat combos |
| `BrandButton` | `variant`, `size`, `href`, `children` | 7+ CTA styles |
| `CardBase` | `hover`, `glow`, `interactive`, `padding`, `href`, `children` | 12+ card patterns |
| `CornerMarks` | `size`, `opacity` | 8 blueprint ticks |
| `TerminalChrome` | `title`, `tag`, `status`, `footer`, `children` | 4 terminal windows |
| `StickyPanel` | `top`, `children` | 4 sticky sidebars |
| `GradientSeparator` | `label`, `maxWidth` | Pre-existing, tokenized |

Import: `import { StatusDot, Tag } from '$lib/components/brand';`

---

## Anti-Patterns

- `text-[Npx]` — use semantic type scale tokens
- Hardcoded hex in class strings — use `var()` or brand utilities
- `style="font-size: 14px"` — use `text-small` class
- `z-index: 9999` — use z-index scale tokens
- `transition: all 0.3s` — use duration/easing tokens
