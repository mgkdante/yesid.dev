# CSS Architecture — Design System Reference

**Last updated:** 2026-04-18
**Status:** Active — post-17a-4, Slice 17h prep

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

12 tokens. Fluid sizes use `clamp()`. Defined in `src/app.css` `@theme` block.

| Token | Size | Usage |
|-------|------|-------|
| `text-hero` | `clamp(64px, min(9vw, 11svh), 130px)` | Hero wordmark (HeroBanner) |
| `text-hero-mobile` | `clamp(48px, min(13vw, 8svh), 64px)` | Hero headline on narrow screens (added 17e-4) |
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

---

## Color Tokens

### Brand (static, never theme-switch)
Defined in `tokens.css` `:root`; mapped to Tailwind utilities via `@theme inline` in `app.css` (e.g. `--color-primary: var(--primary)` → `bg-primary`, `text-primary`, `border-primary`).

| Token | Value | Utility |
|-------|-------|---------|
| `--primary` | `#E07800` | `text-primary`, `bg-primary`, `border-primary` |
| `--accent` | `#FFB627` | `text-accent`, `bg-accent` |
| `--primary-hover` | `#C96A00` | `hover:bg-primary-hover` |
| `--accent-hover` | `#E5A220` | `hover:bg-accent-hover` |

### RGB Channel Tokens (for variable opacity)
Defined in `tokens.css` `:root`:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-rgb` | `224 120 0` | `rgb(var(--primary-rgb) / 0.5)` |

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
| `--light-foreground` | `#cccccc` | `#555555` | Light text variant |
| `--terminal` | `#0a0a0a` | `#F5F5F0` | Terminal/code panels |
| `--manifesto` | `#0f0d0a` | `#F0EDE5` | Manifesto section |
| `--border` | `#3A3A3A` | `#D8D4CA` | Default borders |
| `--border-subtle` | `#2a2a2a` | `#D8D4CA` | Subtle borders |
| `--border-strong` | `#333333` | `#C0BDB5` | Emphasized borders |
| `--destructive` | `#ff5f57` | `#ff5f57` | Error states |
| `--success` | `#28c840` | `#16a34a` | Success states |

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

---

## Z-Index Scale

Global stacking context — no magic numbers.

| Token | Value | Assignment |
|-------|-------|------------|
| `--z-base` | `0` | Default content |
| `--z-content` | `1` | Above-base content |
| `--z-rail` | `30` | Side rails, scroll indicators |
| `--z-sheet` | `50` | Bottom sheets, drawers |
| `--z-menu` | `60` | Menu overlays |
| `--z-nav` | `70` | Navigation (highest) |

---

## Transition Tokens

Defined in `src/lib/styles/tokens.css`, mirrored in `src/lib/motion/tokens.ts` (TS consumers need them at compute time for GSAP without paying for `getComputedStyle`). Parity is enforced by `src/lib/motion/tokens.test.ts`.

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `100ms` | Flash feedback, near-tap responses (added 17e-1) |
| `--duration-fast` | `150ms` | Hover states, toggles, micro-interactions |
| `--duration-normal` | `200ms` | Standard transitions |
| `--duration-slow` | `300ms` | Panel open/close |
| `--duration-slower` | `500ms` | Page transitions, large reveals |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose (Material standard, 17e-1 D260) |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Decel into rest (added 17e-1) |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric acceleration (added 17e-1) |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions |

**Adding a new token:** declare in `tokens.css`, mirror in `motion/tokens.ts`, update this table, run `bun run test -- src/lib/motion/tokens.test.ts`.

---

## Spacing Tokens

3 semantic tokens for recurring layout patterns. Defined in `tokens.css`, bridged to Tailwind via `@theme`.

| Token | Value | Purpose |
|-------|-------|---------|
| `--space-page-x` | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)` | Vertical padding between sections |
| `--space-card-gap` | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards in grids |

Tailwind utilities: `px-page-x`, `py-section-y`, `gap-card-gap`.

**Rules:** Arbitrary Tailwind spacing (`p-[22px]`) is banned — use standard scale or token. `clamp()` for fluid values.

---

## Container Widths

Containers are for **text readability only**, not section wrappers. Visual elements, SVGs, panels, and decorations live OUTSIDE containers at full viewport width.

| Token | Value | Usage |
|-------|-------|-------|
| `--container-content` | `64rem` (1024px) | Primary content width |
| `--container-wide` | `72rem` (1152px) | Wide layouts with sidebars |

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

13 reusable components (17a-4 refresh). Built in 17a-2a, expanded in 17d (MetroStation, SectionHeading, SvgIcon, BlueprintShell).

| Component | Props | Replaces |
|-----------|-------|----------|
| `StatusDot` | `color`, `pulse`, `size`, `ring` | 8+ pulsing dots (17a-4: `ring` prop adds outline halo) |
| `SectionLabel` | `text`, `variant`, `align` | 25+ mono labels |
| `SectionHeading` | `heading`, `dotAccent`, `labelText`, `align` | Heading + dot + subheading patterns |
| `StopLabel` | `stop`, `label` | 10 About bento stops |
| `MetroStation` | `name`, `color`, `size`, `ping` | Station badge + pulse markup |
| `ChevronToggle` | `open`, `size`, `direction` | 8+ expand arrows |
| `GlowOverlay` | `intensity` | 12 manual overlay divs |
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

## Anti-Patterns

- `text-[Npx]` — use semantic type scale tokens
- Hardcoded hex in class strings — use `var()` or brand utilities
- `style="font-size: 14px"` — use `text-small` class
- `z-index: 9999` — use z-index scale tokens
- `transition: all 0.3s` — use duration/easing tokens
- `overflow-x: hidden` on containers with sticky children — use `overflow-x: clip`
- Google Fonts CDN — use `@fontsource-variable` self-hosted packages
