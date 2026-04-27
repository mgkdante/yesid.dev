# components

> Read-only inventory of the component primitives powering yesid.dev. This file does not regenerate — update by hand when a new primitive lands (typically during 17a-6, 17d, or a future component slice).
>
> Atomic design tiers are defined at `docs/project/CONSTITUTION.md § 13`. The short version: Tier 1 = headless primitives + brand tokens; Tier 2 = brand-specific hand-built primitives; Tier 3 = page composition from Tier 1 + Tier 2.

## Tier 1 — ui/ (`src/lib/components/ui/`)

19 shadcn-svelte scaffolded primitives. Bits UI headless core + brand tokens. Pre-scaffolded accessibility. Customized with `--primary` / `--foreground` / other semantic tokens.

Import: `import { Button } from '$lib/components/ui/button'` (each primitive has its own directory and barrel).

| Primitive | Purpose |
|---|---|
| `badge` | Small labeled pill (absorbed brand `Tag` + `NumberBadge` in 17d) |
| `button` | Primary action button (absorbed brand `BrandButton` in 17d) |
| `card` | **Universal card surface** — replaces 18+ hand-rolled card patterns (absorbed brand `CardBase` in 17d). See CONSTITUTION § 13. |
| `collapsible` | Single-panel collapse (Bits UI primitive) |
| `dialog` | Modal dialog |
| `drawer` | Bottom sheet / side drawer (Vaul-Svelte) |
| `input` | Text input |
| `input-group` | Input + adornments |
| `label` | Form label |
| `resizable` | Paneforge-backed resizable split (used on contact page) |
| `scroll-area` | Custom-scrollbar container |
| `separator` | Horizontal / vertical divider (absorbed brand `HazardStripe` + `GradientSeparator` in 17d) |
| `sheet` | Edge-pinned panel |
| `skeleton` | Loading placeholder |
| `tabs` | Tabbed panels |
| `textarea` | Multi-line text input |
| `toggle` | Single toggle button |
| `toggle-group` | Grouped toggles |
| `tooltip` | Anchored tooltip |

## Tier 2 — brand/ (`src/lib/components/brand/`)

12 hand-built brand primitives with no shadcn equivalent. 17a-4 refresh count; GlowOverlay removed in slice-design Child 2 (0 consumers). Each has its own `.svelte` file + test + `Props` export in the barrel `index.ts`.

Import: `import { StatusDot, SectionHeading } from '$lib/components/brand'`.

| Primitive | Props | What it carries |
|---|---|---|
| `StatusDot` | `color`, `pulse`, `size`, `ring` | Round status indicator. `pulse` turns on the global `pulse-glow` keyframe. `ring` (17a-4) adds a CSS `outline` halo (not `ring-*` because Tailwind's `ring` collides with the pulse shadow). Replaces 8+ hand-rolled pulsing dots. |
| `SectionLabel` | `text`, `variant`, `align` | Mono uppercase label with the `// 00` or `SECTION_NAME` pattern. Replaces 25+ hand-rolled label instances. |
| `SectionHeading` | `heading`, `dotAccent`, `labelText`, `align` | Heading + optional dot + optional section label. Unifies the three-part heading used across home + listing pages. |
| `StopLabel` | `stop`, `label` | "STOP NN — LABEL" pattern from the About-page bento. Mono + `text-micro` prefix. |
| `MetroStation` | `name`, `color`, `size`, `ping` | Station badge + optional `station-ping` animation. Used on the MetroNetwork hero + inline throughout home sections. |
| `ChevronToggle` | `open`, `size`, `direction` | Animated chevron for expandable sections (filter groups, collapsibles). Replaces 8+ hand-rolled arrows. |
| `MetricDisplay` | `value`, `label`, `sublabel`, `size` | Big-number metric + mono uppercase label. Sized lg / md / sm. Used on service cards, about page, proof reel. |
| `CornerMarks` | `size`, `opacity` | Four L-shaped corner ticks (blueprint-style). Framing device for SVG panels and bento cards. |
| `TerminalChrome` | `title`, `tag`, `status`, `footer`, `children` | Terminal-window chrome (dots + title + tag + status + body + footer). Used on the contact page, about SQL panel, home hero SQL panel. |
| `StickyPanel` | `top`, `children` | Position-sticky side panel with offset handling. Used on 4 sidebars (blog TOC, project detail, service detail, etc.). |
| `SvgIcon` | `name`, `size`, `animate` | SVG asset loader + `animateDraw` / `animateDrawFill` / `animateMorph` variants. Wraps GSAP DrawSVGPlugin + MorphSVGPlugin. |
| `BlueprintShell` | `children`, `corners`, `label` | Blueprint frame — corner ticks + outer label. Framing layer for schematic content on listing pages. |

### Migrated out of brand/ in 17d

Six former brand primitives have been absorbed into `ui/` wrappers. Import from `ui/*`, not `brand/`.

| Former brand primitive | New home | Reason |
|---|---|---|
| `Tag` | `ui/badge` | Unified pill surface; shadcn-svelte Badge is the canonical primitive |
| `NumberBadge` | `ui/badge` | Same as `Tag` — one Badge with variants |
| `HazardStripe` | `ui/separator` | Unified separator surface; HazardStripe becomes a `variant` |
| `GradientSeparator` | `ui/separator` | Same as `HazardStripe` |
| `BrandButton` | `ui/button` | shadcn-svelte Button with brand tokens |
| `CardBase` | `ui/card` | Universal Card surface across all card-like patterns (17d card unification — 18+ instances consolidated) |

The barrel at `src/lib/components/brand/index.ts` documents the migration at the top of the file.

## Tier 3 — page (`src/lib/components/` direct children)

Roughly 40 page-level components under `about/`, `blog/`, `contact/`, `home/`, `projects/`, `services/`, `stack/`, `nav/`, `footer/`, `shared/`. These are one-off composition — they wire data into CSS Grid + Tier 1 / Tier 2 atoms. They never invent card styles, headings, labels, or dots. If a new visual pattern is needed on 2+ pages, it gets promoted to Tier 2 (brand/) or Tier 1 (ui/) depending on whether it's yesid-specific or a headless primitive.

Page components are inventoried in `docs/project/ARCHITECTURE.md § Structure` — this file focuses on the reusable primitives the pages compose from.

## When to add a primitive

1. The pattern appears on 2+ pages.
2. The pattern has a repeatable prop API (not a snowflake variation).
3. The pattern belongs at a clear tier — Tier 1 if it's a headless a11y primitive (usually via Bits UI); Tier 2 if it's yesid-specific visual craft.
4. Adding the primitive means updating `docs/project/CSS.md § Brand Primitives` + this file + a test + the barrel.

If any of those four fails, the pattern stays in scoped CSS in its consumer.
