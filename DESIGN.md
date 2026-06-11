---
version: alpha
name: yesid.dev
description: Digital infrastructure that moves. Edge-to-edge, dark-first, one orange, motion-with-intent.

# GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT
# Run `bun run --cwd packages/tokens build` to regenerate.

colors:
  primary: "#E07800"
  primary-hover: "#C96A00"
  accent: "#FFB627"
  accent-hover: "#E5A220"
  destructive-foreground: "#FAFAF8"
  background: "#141414"
  foreground: "#F5F5F0"
  muted: "#1E1E1E"
  muted-foreground: "#949494"
  card: "#1a1a1a"
  popover: "#2A2A2A"
  secondary-foreground: "#999999"
  terminal: "#0a0a0a"
  manifesto: "#0f0d0a"
  border: "#3A3A3A"
  border-subtle: "#2f2f2f"
  border-strong: "#4A4A4A"
  destructive: "#ff5f57"
  success: "#28c840"
  accent-text: "#FFB627"
  accent-foreground: "#141414"
  input: "#3A3A3A"

typography:
  hero:
    fontSize: "8.125rem"
  hero-mobile:
    fontSize: "4rem"
  display:
    fontSize: "4rem"
  title:
    fontSize: "2.5rem"
  heading:
    fontSize: "1.5rem"
  subheading:
    fontSize: "1.125rem"
  body:
    fontSize: "1rem"
  small:
    fontSize: "0.875rem"
  mono:
    fontSize: "0.8125rem"
  caption:
    fontSize: "0.75rem"
  micro:
    fontSize: "0.625rem"

rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"

spacing:
  "page-x": "clamp(1.5rem, 4vw, 5rem)"
  "section-y": "clamp(3rem, 8vw, 6rem)"
  "card-gap": "clamp(1rem, 2vw, 1.5rem)"

components:
  # see Notion design system page
---

## Overview

yesid.dev is a freelance digital-infrastructure brand. The design language is edge-to-edge,
dark-first, restrained-orange. Every visual decision traces back to one of five principles:
edge-to-edge layout, dark-first surfaces, one-orange interactivity, motion-with-intent,
no fluff. Full narrative and implementation rules: Notion → Business → Brand.

## Colors

Single brand orange (`#E07800`) reserved for interactive surfaces only. Semantic tokens
(`background`, `foreground`, `card`, `muted`, etc.) carry theme-switching responsibility.
Contrast verified on dark first, then light.

## Typography

Inter Variable for headings + body; JetBrains Mono Variable for code, terminals, mono labels.
Self-hosted (no Google Fonts CDN). Type scale uses `clamp()` for fluid sizing across breakpoints.
Hard floors: body ≥ 16px, mono ≥ 13px, labels ≥ 12px, micro for chrome only.

## Layout

Four CSS Grid recipes: Full-Bleed · Contained · Content+Sidebars · Edge-Title-Grid. Container
widths cap at `64rem` (content) / `72rem` (wide). Page gutters scale via `--space-page-x`.
Section spacing scales via `--space-section-y`. Detailed recipes: Notion → Business → Brand.

## Elevation & Depth

Shadow tokens use `color-mix(in srgb, var(--primary) N%, transparent)` for brand-connected
glows. Six tiers: `glow-sm`, `glow-md`, `glow-lg`, `card`, `section`, `nav`. No raw
`box-shadow` in components.

## Shapes

Five radius tokens: `sm` (4px), `md` (8px, default), `lg` (12px), `xl` (16px), `pill` (9999px).
Borders use semantic tokens (`border`, `border-subtle`, `border-strong`).

## Components

See `apps/web/src/lib/components/brand/` (12 brand primitives) and `apps/web/src/lib/components/ui/`
(19 shadcn-svelte primitives, customized with brand tokens). Design-system documentation:
Notion → Business → Brand.

## Do's and Don'ts

**Do**

- Reference tokens via `var(--token)` or Tailwind utilities (`bg-primary`, `text-foreground`).
- Use the 4 CSS Grid recipes; pages own their grids in scoped CSS.
- Respect `prefers-reduced-motion` on every animation.

**Don't**

- Hardcode hex colors in components.
- Use arbitrary Tailwind values (`text-[14px]`, `p-[22px]`) — use the scale or a token.
- Use `vh` on mobile; use `dvh`/`svh`/`lvh`.
- Add motion that doesn't serve wayfinding, feedback, or emphasis.
