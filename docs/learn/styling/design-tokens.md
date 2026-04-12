---
title: "Design Tokens"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[css-custom-properties]]"
  - "[[tailwind-utility-first]]"
date: 2026-04-08
---

# Design Tokens


## The Analogy

A data dictionary catalogs every column, type, and constraint in your database so anyone querying it knows exactly what `customer_id` means, where it lives, and what values are valid. Design tokens are the data dictionary for your UI. They catalog every color, font, spacing value, and border radius in the interface. Instead of a developer guessing "what shade of orange?" or "how much padding?", they look up the token: `--brand-primary` is `#E07800`, `--radius-md` is `8px`. One source of truth, documented and enforced.

## What It Is

Design tokens are named values that represent every visual decision in a design system. In this project, they live in two files that form a two-layer system:

**Layer 1: Semantic tokens** (`src/lib/styles/tokens.css`) -- CSS custom properties that change with the theme. These are the variables components actually consume. Names describe purpose, not appearance:
- `--bg-primary` -- the main background color (dark: `#141414`, light: `#FAFAF8`)
- `--text-secondary` -- secondary text color (dark: `#999999`, light: `#555555`)
- `--border` -- default border color

**Layer 2: Brand utilities** (`src/app.css` `@theme` block) -- static values that Tailwind turns into utility classes. These never change with the theme. Names describe the brand palette:
- `--color-brand-primary: #E07800` generates `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`
- `--font-heading: 'Inter', ...` generates `font-heading`
- `--radius-brand: 8px` generates `rounded-brand`

The two layers work together. Theme-switching values go in Layer 1 (tokens.css). Static brand values go in Layer 2 (`@theme`). Components use whichever layer is appropriate: `var(--bg-primary)` for themed values, `bg-brand-primary` for brand constants.

## Why It Matters

Design tokens are the foundation of every scalable design system. Companies like Salesforce, GitHub, and Shopify publish their token systems as open-source packages. In interviews, you will be asked how you would maintain visual consistency across a 50-page application. The answer is design tokens. Without them, every component invents its own colors, spacing, and fonts, and the UI drifts into visual chaos.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/styles/tokens.css` | The entire file | Layer 1: all semantic tokens that power theme switching |
| `src/app.css` | The `@theme` block (lines 14-42) | Layer 2: brand palette, fonts, and radii as Tailwind utilities |
| `src/app.css` | The `html` rule (lines 46-50) | Shows tokens being consumed: `background-color: var(--bg-primary)` |
| `src/lib/components/Hero.svelte` | The CTA button classes | Uses both layers: `bg-brand-primary` (Layer 2) and `text-[var(--text-primary)]` (Layer 1) |
| `src/lib/components/AboutBento.svelte` | The bento card divs | Shows `border-[#2a2a2a] bg-[#1a1a1a]` -- card-surface colors used consistently |

## The Mental Model

```
The Two-Layer Token System
══════════════════════════

Layer 2: Brand Utilities (src/app.css @theme)
┌─────────────────────────────────────────────────┐
│  Static values. Never change.                   │
│  --color-brand-primary: #E07800  → bg-brand-*   │
│  --color-brand-accent: #FFB627   → text-brand-* │
│  --font-heading: 'Inter'         → font-heading │
│  --radius-brand: 8px             → rounded-brand│
└─────────────────────────────────────────────────┘
           ↑ Tailwind reads these and generates utility classes

Layer 1: Semantic Tokens (src/lib/styles/tokens.css)
┌─────────────────────────────────────────────────┐
│  Theme-switching values. Change per theme.      │
│                                                 │
│  [data-theme="dark"]        [data-theme="light"]│
│  --bg-primary: #141414      --bg-primary: #FAFA │
│  --text-primary: #F5F5F0    --text-primary: #111│
│  --border: #3A3A3A          --border: #D8D4CA   │
└─────────────────────────────────────────────────┘
           ↑ Components read these via var()

SQL Analogy:
  Layer 2 = System catalog (sys.types) — fixed types, always the same
  Layer 1 = Environment variables (@@LANGUAGE, @@DATEFIRST) — change per session
```

The decision of which layer to use is simple: if the value changes between dark and light theme, it goes in Layer 1 (tokens.css). If the value is always the same regardless of theme (like the brand orange), it goes in Layer 2 (`@theme`).

## Worked Example

```css
/* From: src/app.css — Layer 2: Brand utilities */
/* The @theme block tells Tailwind v4 to generate utility classes. */

@theme {
  /* These become bg-brand-primary, text-brand-primary, border-brand-primary */
  --color-brand-primary: #E07800;
  --color-brand-accent: #FFB627;

  /* These become font-heading, font-body, font-mono */
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* This becomes rounded-brand */
  --radius-brand: 8px;
}
```

```css
/* From: src/lib/styles/tokens.css — Layer 1: Semantic tokens */
/* These variables swap values when [data-theme] changes. */

[data-theme="dark"], .theme-dark {
  --bg-primary: #141414;    /* Page background */
  --bg-surface: #1E1E1E;   /* Card/panel background */
  --text-primary: #F5F5F0; /* Main text */
  --border: #3A3A3A;        /* Default borders */
}
```

A component then uses both layers:

```svelte
<!-- From: src/lib/components/Hero.svelte -->
<!-- text-[var(--text-primary)] = Layer 1 (theme-aware) -->
<!-- bg-brand-primary = Layer 2 (always #E07800) -->

<h1 class="text-[var(--text-primary)] text-4xl font-heading font-bold">
  {heading}
</h1>

<a class="bg-brand-primary hover:bg-brand-primary-hover px-6 py-3 rounded-brand">
  {primaryCta.label}
</a>
```

## Common Mistakes

1. **Putting theme-switching values in `@theme`:** Adding `--color-bg-primary: #141414` to the `@theme` block.
   - **What happens:** The value becomes a Tailwind utility (`bg-bg-primary`) but does not switch with the theme. It is always `#141414`.
   - **Fix:** Theme-switching values go in `tokens.css` inside `[data-theme]` selectors. `@theme` is for static brand values only.
   - **Why:** `@theme` generates Tailwind utilities from fixed values. It has no concept of themes or selectors.

2. **Using a raw hex color when a token exists:** Writing `text-[#E07800]` instead of `text-brand-primary`.
   - **What happens:** It works visually, but the value is disconnected from the token system. If the brand color changes, this instance is missed.
   - **Fix:** Check both `tokens.css` and the `@theme` block. If a token exists, use it.
   - **Why:** Design tokens exist to prevent scattered magic values. Every raw hex is a maintenance risk.

3. **Creating a new token without documenting it:** Adding `--bg-card-hover: #252525` to tokens.css without updating `docs/reference/CSS.md`.
   - **What happens:** The next developer does not know the token exists. They create another one for the same purpose.
   - **Fix:** Always add a `docs/reference/CSS.md` entry when creating or changing tokens. Explain: name, purpose, where consumed, why existing tokens do not cover the case.
   - **Why:** Undocumented tokens are indistinguishable from dead code.

## Break It to Learn It

### Exercise 1: Trace a token from definition to consumption
1. Open `src/lib/styles/tokens.css`
2. Find `--text-secondary` in the `[data-theme="dark"]` block. Note its value (`#999999`)
3. Open `src/lib/components/Hero.svelte`. Find `text-[var(--text-secondary)]` on the `<p>` tag
4. **Predict:** What color is the subheading text in dark mode?
5. **Verify:** Run `bun run dev`, inspect the subheading element in DevTools, check `computed styles > color`
6. **What you learned:** The token provides indirection -- the component says "use secondary text color" without knowing the exact hex.

### Exercise 2: Break the brand utility
1. Open `src/app.css`
2. In the `@theme` block, change `--color-brand-primary: #E07800` to `--color-brand-primary: #00ff00`
3. **Predict:** What elements will turn green?
4. **Verify:** Run `bun run dev`. Look at the CTA buttons, nav active states, tag pills, and any other element using `bg-brand-primary` or `text-brand-primary`
5. **What you learned:** One token change propagates to every component that consumes it. This is the power of a single source of truth.
6. **Undo your change**

### Exercise 3: See both layers coexist
1. Open `src/lib/components/Hero.svelte`
2. The heading uses `text-[var(--text-primary)]` (Layer 1 -- theme-aware) and the CTA uses `bg-brand-primary` (Layer 2 -- static brand)
3. **Predict:** If you switch to light theme, will the heading text color change? Will the CTA background color change?
4. **Verify:** In `src/lib/styles/tokens.css`, the heading uses `--text-primary` which is different for dark (`#F5F5F0`) and light (`#111111`). The CTA uses `--color-brand-primary` from `@theme`, which is always `#E07800`.
5. **What you learned:** Layer 1 adapts to themes. Layer 2 stays constant. Components can mix both.

## Connections

- **Depends on:** [[css-custom-properties]] because Layer 1 tokens are CSS custom properties
- **Depends on:** [[tailwind-utility-first]] because Layer 2 tokens generate Tailwind utility classes
- **Enables:** [[dark-theme-architecture]] because the theme system is built on Layer 1 tokens
- **Related:** [[scoped-styles-in-svelte]] because scoped styles consume tokens via `var()`

## Knowledge Check

1. What is the difference between Layer 1 and Layer 2 in this project's token system? → See [What It Is](#what-it-is)
2. Where do you put a color that should change between dark and light themes? → See [The Mental Model](#the-mental-model)
3. What happens if you add a raw hex color instead of using a token? → See [Common Mistakes](#common-mistakes)
4. What file must you update when adding a new token? → See [Common Mistakes](#common-mistakes)
5. What is the SQL analogy for design tokens? → See [The Analogy](#the-analogy)

## Go Deeper

- [Tailwind CSS v4: Theme Configuration](https://tailwindcss.com/docs/theme)
- [Design Tokens W3C Community Group](https://www.w3.org/community/design-tokens/)
