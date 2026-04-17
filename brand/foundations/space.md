# foundations / space

> Narrative. The three semantic tokens live in `src/lib/styles/tokens.css`. See `docs/reference/CSS.md § Spacing Tokens` for the canonical table and CONSTITUTION.md § 3 for the rules.

## What it is

Three semantic spacing tokens + Tailwind's default spacing scale. The semantic tokens are reserved for patterns that repeat across many sections — page gutters, section padding, grid gaps. Everything else uses the standard Tailwind scale (`p-2`, `gap-4`, `mt-6`, etc.). Arbitrary values (`p-[22px]`) are banned.

## Tokens

| Token | Value | Purpose |
|---|---|---|
| `--space-page-x` | `clamp(1.5rem, 4vw, 5rem)` | Horizontal page gutters. The left/right breathing room a page gives its content. |
| `--space-section-y` | `clamp(3rem, 8vw, 6rem)` | Vertical padding between top-level sections. |
| `--space-card-gap` | `clamp(1rem, 2vw, 1.5rem)` | Gap between cards / grid items inside a section. |

Tailwind utilities generated from these: `px-page-x`, `py-section-y`, `gap-card-gap`.

## Why only three

Smaller-scope spacing values (`gap: 0.75rem`, `padding: 1rem`) live in the components that use them. Promoting them to tokens bloats the design surface without adding value — a grid gap of 12px is not a shared concept; it's a visual decision for that one grid.

Earlier iterations had `--space-stack` (1.5rem) and `--space-cluster` (0.75rem) tokens. They were dropped on 2026-04-18 because they were documented but never defined in `tokens.css` — consumers referencing them silently fell back to initial (zero). See `decisions/2026-04-what-i-killed.md`.

## The clamp pattern

All three tokens use `clamp(min, preferred, max)`:

- `min` — the floor on the smallest phone.
- `preferred` — a viewport-relative value (`4vw`, `8vw`, `2vw`) that scales fluidly.
- `max` — the ceiling on the largest desktop.

A single token value covers every viewport from 280px to 2560px without breakpoint-driven overrides. The viewport decides how much space is appropriate; the clamp enforces the reasonable floor and ceiling.

### Example

`--space-page-x: clamp(1.5rem, 4vw, 5rem)`

| Viewport | `4vw` | Clamped to |
|---|---|---|
| 375px phone | 15px | 1.5rem (24px) — floor |
| 768px tablet | ~31px | ~31px — preferred |
| 1440px desktop | ~58px | 5rem (80px) — ceiling |
| 2560px ultrawide | ~102px | 5rem (80px) — ceiling |

No media query. No override. One line.

## When to use which

| Situation | Token |
|---|---|
| Horizontal gutter at the page edge | `var(--space-page-x)` |
| Top/bottom padding of a `<section>` | `var(--space-section-y)` |
| Gap between cards in a grid | `var(--space-card-gap)` |
| Internal component spacing (label + value, icon + text, padding around an element) | Standard Tailwind scale (`p-2`, `gap-3`, etc.) or a concrete value in scoped CSS |
| One-off vertical rhythm | Standard Tailwind scale |

## Rules

1. **If a spacing value appears on 3+ sections, it becomes a token.** If it doesn't repeat, it stays scoped.
2. **Arbitrary Tailwind spacing (`p-[22px]`) is banned.** Use the standard scale or a token.
3. **Use `clamp()` for fluid values.** Never layer a fluid-value override on top of a breakpoint media query — that invents two different values for the same element.
4. **Tailwind's default scale covers everything the semantic tokens don't.** The standard `0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16` scale is more than enough for internal component spacing.
5. **Prefer logical properties.** `padding-inline`, `margin-block` over `padding-left`, `margin-top`. The site is LTR today but the tokens should not assume that forever.

## Layout recipes

Spacing tokens live inside the four CSS Grid Recipes documented in `docs/reference/CONSTITUTION.md § 2`:

- **Recipe 1: Full-Bleed** — no horizontal constraints at all. Section decides its own padding or bleeds to the viewport edge.
- **Recipe 2: Contained** — `max-width: var(--container-content)` + `padding-inline: var(--space-page-x)`. Readable text widths.
- **Recipe 3: Content + Sidebars** — CSS Grid with `auto 1fr auto` columns; `gap: var(--space-card-gap)`.
- **Recipe 4: Edge Title Grid** — rotated title + divider + content; spacing tokens handle the inner gaps.

Every page on yesid.dev uses one of these four. No page invents its own layout.

## When to extend

Add a new spacing token only when:

1. A spacing value recurs on 3+ sections (not just one feature page).
2. The value is non-obviously derivable from the existing three + the Tailwind scale.
3. The new token is added to `tokens.css`, bridged through `@theme`, and documented in `docs/reference/CSS.md § Spacing Tokens` in the same change.

If the value is used once, it stays in scoped CSS. If it's used twice, it's a borderline candidate — wait for a third consumer before promoting.
