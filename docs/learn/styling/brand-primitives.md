---
title: "Brand Primitives"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[design-tokens]]"
  - "[[svelte-components]]"
  - "[[slots-and-composition]]"
date: 2026-04-12
---

# Brand Primitives

## The Analogy

In a database, you define stored procedures to encapsulate business logic so that every application calling the database uses the same validated logic instead of writing raw SQL. Brand primitives are the stored procedures of a design system. Instead of every component hand-building a button with 15 CSS properties, you call `<BrandButton>` — one component that encapsulates every visual decision (color, size, font, hover state, focus ring) so it's consistent everywhere.

## What It Is

Brand primitives are small, focused Svelte components that encode a single brand pattern — a button, a card, a terminal window frame, a pulsing status dot. They sit between design tokens (raw values like `--brand-primary: #E07800`) and full-page components (like `AboutPage.svelte`). Tokens define *what the values are*. Primitives define *how those values compose into reusable UI patterns*.

In this project, 15 brand primitives live in `src/lib/components/brand/`. They are imported through a barrel export:

```typescript
import { StatusDot, BrandButton, CardBase } from '$lib/components/brand';
```

Each primitive:
- Has typed props (TypeScript)
- Spreads `...rest` for custom classes
- Uses design tokens (never hardcoded hex values)
- Is tested independently

## Why It Matters

Every design system at scale (Material UI, Chakra, Radix, shadcn/ui) is built on this pattern. In interviews, you'll be asked: "How do you maintain visual consistency across 50+ components?" The answer is primitives — small, composable building blocks that enforce the brand rules so individual page components don't have to. Without them, every developer re-invents the button, the card, and the badge, and the UI drifts into inconsistency.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/brand/index.ts` | Barrel export of all 15 primitives | Single import path for the entire brand component library |
| `src/lib/components/brand/BrandButton.svelte` | Props: `variant`, `size`, `href`, `children` | Shows how one component replaces 10+ bespoke CTA implementations |
| `src/lib/components/brand/TerminalChrome.svelte` | Props: `title`, `tag`, `status`, `footer`, `noPadding` | Shows how a complex pattern (terminal window) becomes a single component call |
| `src/lib/components/ContactPage.svelte` | `<TerminalChrome>` and `<BrandButton>` usage | Consumer that composes two primitives to build a form |
| `src/lib/components/AboutMetrics.svelte` | `<MetricDisplay>` usage | Consumer using MetricDisplay instead of raw value+label markup |

## The Mental Model

```
Design System Layers
════════════════════

Layer 3: Page Components (AboutPage, ContactPage, BlogListingPage)
  │  Compose primitives + custom layout
  │
Layer 2: Brand Primitives (BrandButton, CardBase, TerminalChrome)
  │  Encode brand patterns using tokens
  │  Import from: $lib/components/brand
  │
Layer 1: Design Tokens (--brand-primary, --bg-surface, --radius-md)
  │  Raw named values in tokens.css + @theme
  │
Layer 0: Brand Guide (brand_guide.pdf)
       The source of truth for all visual decisions

SQL Analogy:
  Layer 0 = Business requirements document
  Layer 1 = Column types and constraints (CREATE TABLE)
  Layer 2 = Stored procedures (CREATE PROCEDURE)
  Layer 3 = Application queries (SELECT ... JOIN ...)
```

The key insight: **Layer 2 is the enforcement layer.** Without it, Layer 3 components must each independently implement the brand rules from Layer 1. With it, Layer 3 just calls the primitive and gets correct brand styling automatically.

## Worked Example

```svelte
<!-- From: src/lib/components/ContactPage.svelte -->
<!-- Before: 15 lines of custom terminal chrome markup -->
<!-- After: One component call -->

<script>
  import { TerminalChrome, BrandButton } from '$lib/components/brand';
</script>

<!-- TerminalChrome encapsulates: title bar, StatusDot, HazardStripe,
     body area with terminal styling, and optional footer.
     The consumer just provides the content. -->
<TerminalChrome title="contact.form" tag="input">
  <!-- Form fields go here as children -->
  <form>
    <!-- ... form fields ... -->

    <!-- BrandButton encapsulates: brand colors, font, size variants,
         hover states, focus rings, disabled states.
         The consumer picks variant + size. -->
    <BrandButton variant="primary" size="lg" type="submit">
      TRANSMIT
    </BrandButton>
  </form>
</TerminalChrome>
```

Before brand primitives, ContactPage had ~40 lines of inline terminal chrome (StatusDot, title bar, hazard stripe, body wrapper) duplicated from other files. After: one `<TerminalChrome>` call. If the terminal design changes, it changes everywhere at once.

## Common Mistakes

1. **Wrapping a primitive with extra div+styles that duplicate what it already does:** Adding `<div class="rounded-lg border border-[var(--border)] p-4">` around `<CardBase>`.
   - **What happens:** Double borders, double padding. The CardBase already provides these styles.
   - **Fix:** Check what the primitive provides before adding wrapper styles. Use the primitive's props (like `padding`, `hover`, `glow`) to customize.
   - **Why:** Primitives are meant to be the *only* source of that pattern. Wrapping defeats the purpose.

2. **Rebuilding a primitive inline instead of importing it:** Writing a custom `<span class="font-mono text-xs text-brand-primary">01</span>` instead of `<NumberBadge value={1}>`.
   - **What happens:** It looks the same today, but when the badge design changes (size, font, sonar animation), this instance is missed.
   - **Fix:** Check `$lib/components/brand/index.ts` — if a primitive exists for the pattern, use it.
   - **Why:** The whole point of primitives is one source of truth. Every inline rebuild is a future maintenance burden.

3. **Using Svelte actions on component tags:** Writing `<CardBase use:tilt>` expecting the action to work.
   - **What happens:** Svelte actions (`use:`) only work on HTML elements, not component tags. The action silently fails.
   - **Fix:** Apply actions to a wrapper element inside the component, or use CardBase's built-in props (like `interactive`, `glow`) which provide equivalent behavior.
   - **Why:** This is a Svelte language constraint. Components compile to function calls, not DOM elements, so `use:` has no element to attach to.

## Break It to Learn It

### Exercise 1: Trace a primitive from import to render
1. Open `src/lib/components/brand/StatusDot.svelte`
2. Note the props: `color`, `pulse`, `size`
3. Open `src/lib/components/Footer.svelte`
4. Find the `<StatusDot>` usage — note which props are passed
5. **Predict:** What color is the dot? Does it pulse?
6. **Verify:** Run `bun run dev`, navigate to any page, scroll to the footer
7. **What you learned:** The primitive provides defaults (green, pulsing) — the consumer only overrides what it needs.
8. **Undo any changes**

### Exercise 2: Replace a primitive with inline code
1. Open `src/lib/components/CollapsibleSection.svelte`
2. Find the `<ChevronToggle>` usage
3. Replace it with a raw SVG: `<svg class="w-4 h-4"><path d="M6 9l6 6 6-6"/></svg>`
4. **Predict:** What do you lose?
5. **Verify:** Run `bun run dev` — the chevron no longer animates on open/close, has no transition, and doesn't respect the `open` state for rotation.
6. **What you learned:** The primitive encapsulates animation, state binding, and styling. Replacing it with raw markup loses all three.
7. **Undo your change**

### Exercise 3: See the barrel export
1. Open `src/lib/components/brand/index.ts`
2. Count how many components are exported
3. Open any consumer file and check its import statement
4. **Predict:** If you rename `StatusDot.svelte` to `LiveDot.svelte`, how many files would break?
5. **Answer:** Only the barrel export (`index.ts`) needs updating. Every consumer imports from `'$lib/components/brand'`, not the file directly.
6. **What you learned:** Barrel exports provide indirection — consumers don't know or care about file names.

## Connections

- **Depends on:** [[design-tokens]] because primitives consume tokens for all visual values
- **Depends on:** [[svelte-components]] because each primitive is a Svelte component
- **Depends on:** [[slots-and-composition]] because primitives use `{@render children()}` for content projection
- **Enables:** [[component-architecture]] because page components compose primitives instead of building from scratch
- **Related:** [[scoped-styles-in-svelte]] because primitives own their scoped styles

## Knowledge Check

1. What is the difference between a design token and a brand primitive? → See [The Mental Model](#the-mental-model)
2. Where do you import brand primitives from? → See [What It Is](#what-it-is)
3. Why can't you use `use:tilt` on `<CardBase>`? → See [Common Mistakes](#common-mistakes)
4. What happens if you rebuild a primitive inline? → See [Common Mistakes](#common-mistakes)
5. How many layers are in this project's design system? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/) — the methodology behind component-based design systems
- [Svelte Component Composition](https://svelte.dev/docs/svelte/legacy-slots) — how slots and children work in Svelte 5
