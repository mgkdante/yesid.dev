---
title: "CSS Custom Properties"
domain: styling
difficulty: 1
difficulty_label: beginner
reading_time: 7
tags:
  - learn
  - styling
  - beginner
date: 2026-04-08
---

# CSS Custom Properties


## The Analogy

CSS custom properties work exactly like SQL variables. In SQL, you write `DECLARE @bgColor VARCHAR(7) = '#141414'` once, then reference `@bgColor` everywhere you need that value. If you change the declaration, every reference updates automatically. CSS custom properties do the same thing: `--bg-primary: #141414` defines the variable, and `var(--bg-primary)` references it. One source of truth, many consumers.

## What It Is

A CSS custom property (also called a CSS variable) is a value you define once and reference anywhere in your stylesheet. The syntax has two parts:

1. **Declaration:** `--bg-primary: #141414;` -- the `--` prefix marks it as a custom property. The name is yours to choose.
2. **Reference:** `var(--bg-primary)` -- the `var()` function reads the value wherever you use it.

Custom properties are declared inside a CSS selector. The most common scope is `:root` (the `<html>` element), which makes the variable available everywhere on the page. But you can also declare them on a more specific selector -- like `[data-theme="dark"]` -- so they only apply when that selector matches.

This cascading behavior is the superpower: you can redefine a variable for a subset of the page, and everything inside that subset automatically uses the new value. This is exactly how theme switching works in this project.

## Why It Matters

Every modern design system uses CSS custom properties. They power dark/light theme switching, responsive spacing, and brand consistency. In interviews, you will be asked how you would implement a theme switcher or maintain consistent colors across a large application. The answer is always CSS custom properties. Without understanding them, you cannot read or maintain the styling layer of any production codebase.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/styles/tokens.css` | The `:root` block (lines 1-27) | Brand-wide constants defined once: fonts, spacing, radii |
| `src/lib/styles/tokens.css` | The `[data-theme="dark"]` block (lines 29-37) | Theme-specific values that change with the active theme |
| `src/lib/styles/tokens.css` | The `[data-theme="light"]` block (lines 39-47) | Same variable names, different values -- this is theme switching |
| `src/routes/+layout.svelte` | `bg-[var(--bg-primary)]` in the root `<div>` | A component consuming a token -- automatically adapts to the active theme |
| `src/lib/components/Nav.svelte` | `border-[var(--border)]` and `text-[var(--text-primary)]` | Navigation adapts its border and text colors to the active theme |

## The Mental Model

```
SQL Variables                          CSS Custom Properties
──────────────                         ──────────────────────

DECLARE @bgColor = '#141414'           :root { --bg-primary: #141414; }

SELECT * FROM pages                    div {
WHERE bg = @bgColor                      background: var(--bg-primary);
                                       }

-- Same variable, different context:   [data-theme="dark"] {
SET @bgColor = '#FAFAF8'                 --bg-primary: #141414;
-- (in a different execution scope)    }
                                       [data-theme="light"] {
                                         --bg-primary: #FAFAF8;
                                       }

How the cascade works:

  <html data-theme="dark">           ← sets --bg-primary to #141414
    <body>
      <div style="bg: var(--bg)">    ← gets #141414
        <nav>                        ← also gets #141414
        </nav>
      </div>
    </body>
  </html>

  Change data-theme to "light" →
  Every var(--bg-primary) instantly becomes #FAFAF8
```

The key insight: the variable name stays the same (`--bg-primary`), but its value changes depending on which selector is active. Components never need to know which theme is active -- they just read the variable.

## Worked Example

```css
/* From: src/lib/styles/tokens.css */
/* This file defines the entire color vocabulary for the site. */

/* Step 1: Brand constants — these NEVER change with the theme */
:root {
  --brand-primary: #E07800;       /* Orange — the signature color */
  --brand-accent: #FFB627;        /* Yellow — secondary highlight */
  --font-heading: 'Inter', system-ui, sans-serif;
}

/* Step 2: Theme-specific values — these SWAP when the theme changes */
[data-theme="dark"], .theme-dark {
  --bg-primary: #141414;          /* Near-black background */
  --bg-surface: #1E1E1E;          /* Slightly lighter surface */
  --text-primary: #F5F5F0;        /* Off-white text */
  --text-secondary: #999999;      /* Muted secondary text */
  --border: #3A3A3A;              /* Subtle dark border */
}

[data-theme="light"], .theme-light {
  --bg-primary: #FAFAF8;          /* Warm white background */
  --bg-surface: #F0EDE5;          /* Cream surface */
  --text-primary: #111111;        /* Near-black text */
  --text-secondary: #555555;      /* Medium gray text */
  --border: #D8D4CA;              /* Warm gray border */
}
```

A component consumes these without caring about the theme:

```svelte
<!-- From: src/routes/+layout.svelte -->
<!-- This div adapts to any theme because it uses var() references -->
<div class="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  <!-- Everything inside inherits the correct colors -->
</div>
```

`bg-[var(--bg-primary)]` is Tailwind's arbitrary value syntax -- it generates `background-color: var(--bg-primary)`. The variable resolves to `#141414` in dark mode or `#FAFAF8` in light mode, depending on the `data-theme` attribute on `<html>`.

## Common Mistakes

1. **Hardcoding colors instead of using variables:** Writing `background: #141414` directly in a component instead of `background: var(--bg-primary)`.
   - **What happens:** The component ignores theme changes. Dark mode shows, light mode does not switch.
   - **Fix:** Always use `var(--token-name)` for any value that should change with the theme.
   - **Why:** Custom properties are the indirection layer that makes theming possible. Hardcoded values bypass it.

2. **Forgetting the fallback value:** Writing `var(--bg-primar)` (typo) without a fallback.
   - **What happens:** The property silently fails. The browser uses the inherited or default value, which may be transparent or the wrong color.
   - **Fix:** Use the optional fallback: `var(--bg-primary, #141414)`. If the variable is undefined, the fallback kicks in.
   - **Why:** CSS does not throw errors for undefined variables. It just ignores the declaration.

3. **Confusing `:root` scope with `[data-theme]` scope:** Putting theme-specific values in `:root` instead of in a `[data-theme]` selector.
   - **What happens:** The values never change because `:root` is always active. Theme switching has no effect.
   - **Fix:** Put values that change between themes inside `[data-theme="dark"]` and `[data-theme="light"]`. Put constants (brand colors, fonts) in `:root`.
   - **Why:** `:root` is the base. `[data-theme]` selectors override the base for the active theme.

## Break It to Learn It

### Exercise 1: Change a token value
1. Open `src/lib/styles/tokens.css`
2. In the `[data-theme="dark"]` block, change `--bg-primary: #141414` to `--bg-primary: #ff0000`
3. **Predict:** What color will the page background become?
4. **Verify:** Run `bun run dev`, open localhost, and observe
5. **What you learned:** Every element using `var(--bg-primary)` instantly turned red. One change, site-wide effect.
6. **Undo your change**

### Exercise 2: Break a variable reference
1. Open `src/routes/+layout.svelte`
2. In the root `<div>`, change `bg-[var(--bg-primary)]` to `bg-[var(--bg-typo)]`
3. **Predict:** What will the background look like?
4. **Verify:** Run `bun run dev` and observe. The background becomes transparent (or white, depending on the browser default).
5. **What you learned:** A misspelled variable name silently fails. CSS does not throw errors -- it just skips the declaration.
6. **Undo your change**

### Exercise 3: See cascading in action
1. Open `src/lib/styles/tokens.css`
2. Below the `[data-theme="dark"]` block, add a new rule: `nav { --text-primary: #00ff00; }`
3. **Predict:** Will only the nav text turn green, or the entire page?
4. **Verify:** Run `bun run dev` and observe. Only text inside `<nav>` turns green.
5. **What you learned:** Custom properties cascade -- a more specific selector overrides the inherited value, but only within its subtree.
6. **Undo your change**

## Connections

- **Depends on:** nothing (this is foundational CSS)
- **Enables:** [[design-tokens]] because design tokens are built entirely on custom properties
- **Enables:** [[dark-theme-architecture]] because theme switching works by redefining custom property values
- **Related:** [[tailwind-utility-first]] because Tailwind's arbitrary value syntax (`bg-[var(--token)]`) bridges utilities and custom properties

## Knowledge Check

1. What is the difference between `--bg-primary` and `var(--bg-primary)`? → See [What It Is](#what-it-is)
2. Why does the background color change when you switch from dark to light theme? → See [The Mental Model](#the-mental-model)
3. What happens if you misspell a variable name in `var()`? → See [Common Mistakes](#common-mistakes)
4. Where should you put values that never change with the theme? → See [Worked Example](#worked-example)

## Go Deeper

- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS-Tricks: A Complete Guide to Custom Properties](https://css-tricks.com/a-complete-guide-to-custom-properties/)
