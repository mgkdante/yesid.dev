---
title: "Dark Theme Architecture"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[css-custom-properties]]"
  - "[[design-tokens]]"
date: 2026-04-08
---

# Dark Theme Architecture


## The Analogy

Imagine two database schemas -- `dev` and `prod` -- that share the exact same table structure (same table names, same column names, same constraints) but contain different data. A query like `SELECT * FROM users` returns different rows depending on which schema you are connected to, but the query itself never changes. Dark theme architecture works identically: the CSS variable names (`--bg-primary`, `--text-primary`) are the same in both themes, but the values change. Components write `var(--bg-primary)` once and never care which theme is active.

## What It Is

Dark theme architecture is a system where the entire visual appearance of a site switches between dark and light modes by redefining a set of CSS custom properties. The architecture has three parts:

1. **Theme selector on the root element:** The `<html>` tag carries a `data-theme` attribute (e.g., `data-theme="dark"`). This attribute determines which set of variable values is active.

2. **Two sets of variable values:** In `tokens.css`, the same variable names are defined inside `[data-theme="dark"]` and `[data-theme="light"]` selectors. Each set has different hex values for backgrounds, text, and borders.

3. **System preference fallback:** `@media (prefers-color-scheme: dark)` and `@media (prefers-color-scheme: light)` blocks provide defaults based on the user's OS setting. These only apply when no explicit `data-theme` attribute is set.

In this project, dark is the default. The site ships as a dark-themed application. The light theme values exist in `tokens.css` but are not currently toggled by the UI (no theme toggle button yet). The architecture is ready for it -- the plumbing is in place.

## Why It Matters

Dark mode is an expected feature in modern applications. Apple, Google, and every major platform support it at the OS level. Users expect websites to respect their preference. In interviews, you will be asked how to implement theme switching. The standard answer is CSS custom properties with a data attribute on the root element. Understanding this architecture also teaches you the broader pattern of "contextual configuration" -- the same code behaving differently based on environment, which is a fundamental software engineering concept.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/styles/tokens.css` | `[data-theme="dark"]` block (lines 29-37) | Dark theme variable values |
| `src/lib/styles/tokens.css` | `[data-theme="light"]` block (lines 39-47) | Light theme variable values -- same names, different hex |
| `src/lib/styles/tokens.css` | `@media (prefers-color-scheme: dark)` (lines 49-59) | System preference fallback when no data-theme is set |
| `src/app.css` | `html { background-color: var(--bg-primary); }` (line 47) | The root element consuming theme tokens |
| `src/routes/+layout.svelte` | `bg-[var(--bg-primary)] text-[var(--text-primary)]` | Layout wrapper consuming theme tokens via Tailwind |

## The Mental Model

```
Two Schemas, Same Structure
═══════════════════════════

Database analogy:
  dev schema:   users.bg_color = '#141414'  (dark background)
  prod schema:  users.bg_color = '#FAFAF8'  (light background)
  Query:        SELECT bg_color FROM users   (same query, different result)

CSS equivalent:
  [data-theme="dark"]:   --bg-primary: #141414
  [data-theme="light"]:  --bg-primary: #FAFAF8
  Component:             background: var(--bg-primary)  (same rule, different result)


How theme resolution works:

  ┌─ User's OS preference ──────────────────────────────┐
  │  prefers-color-scheme: dark                         │
  │  → applies ONLY if <html> has no data-theme attr    │
  └─────────────────────────┬───────────────────────────┘
                            │ (lowest priority)
                            ▼
  ┌─ data-theme attribute ──────────────────────────────┐
  │  <html data-theme="dark">                          │
  │  → [data-theme="dark"] { --bg-primary: #141414 }   │
  │  → overrides @media preference                      │
  └─────────────────────────┬───────────────────────────┘
                            │ (highest priority)
                            ▼
  ┌─ Component consumption ─────────────────────────────┐
  │  background: var(--bg-primary)                      │
  │  → resolves to #141414                              │
  │  Component never knows which theme is active.       │
  └─────────────────────────────────────────────────────┘
```

The priority order matters:
1. `data-theme` attribute (explicit choice) wins if present
2. `@media (prefers-color-scheme)` (OS preference) is the fallback
3. Components are theme-agnostic -- they always use `var()` references

## Worked Example

```css
/* From: src/lib/styles/tokens.css */
/* The full theme-switching system in one file. */

/* Step 1: Brand constants — same in every theme */
:root {
  --brand-primary: #E07800;    /* Always orange, never changes */
  --brand-accent: #FFB627;     /* Always yellow */
  --font-heading: 'Inter', system-ui, sans-serif;
}

/* Step 2: Dark theme values — active when data-theme="dark" */
[data-theme="dark"], .theme-dark {
  --bg-primary: #141414;       /* Near-black */
  --bg-surface: #1E1E1E;       /* Slightly lighter */
  --bg-elevated: #2A2A2A;      /* Cards, modals */
  --border: #3A3A3A;           /* Subtle dark borders */
  --text-primary: #F5F5F0;     /* Off-white */
  --text-secondary: #999999;   /* Gray */
  --text-muted: #666666;       /* Very gray */
}

/* Step 3: Light theme values — same names, lighter colors */
[data-theme="light"], .theme-light {
  --bg-primary: #FAFAF8;       /* Warm white */
  --bg-surface: #F0EDE5;       /* Cream */
  --bg-elevated: #FFFFFF;      /* Pure white */
  --border: #D8D4CA;           /* Warm gray */
  --text-primary: #111111;     /* Near-black */
  --text-secondary: #555555;   /* Medium gray */
  --text-muted: #888888;       /* Light gray */
}

/* Step 4: System preference fallback */
@media (prefers-color-scheme: dark) {
  /* Only applies when NO data-theme attribute is set */
  :root:not([data-theme="light"]) {
    --bg-primary: #141414;
    --text-primary: #F5F5F0;
    /* ... same as [data-theme="dark"] */
  }
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg-primary: #FAFAF8;
    --text-primary: #111111;
    /* ... same as [data-theme="light"] */
  }
}
```

Notice the `:root:not([data-theme="light"])` selector in the `prefers-color-scheme: dark` media query. This means: "Apply dark values to the root element, but ONLY if the root does not explicitly have `data-theme="light"`. This ensures that an explicit user choice (via the data attribute) always overrides the OS preference.

## Common Mistakes

1. **Using theme colors from the wrong layer:** Writing `bg-dark-bg` (Layer 2 Tailwind utility) instead of `bg-[var(--bg-primary)]` (Layer 1 theme token).
   - **What happens:** `bg-dark-bg` is always `#141414` regardless of theme. It does not switch in light mode.
   - **Fix:** For any background, text, or border that should change with the theme, use `var(--token)` from tokens.css.
   - **Why:** Layer 2 (`@theme`) values are static brand constants. Layer 1 (`tokens.css`) values are theme-aware.

2. **Adding a new color without defining it in both themes:** Adding `--bg-card-hover: #252525` to `[data-theme="dark"]` but forgetting to add it to `[data-theme="light"]`.
   - **What happens:** In light mode, `var(--bg-card-hover)` is undefined. The property silently fails or falls back to an inherited value, creating a visual bug.
   - **Fix:** Every new variable must be defined in both `[data-theme="dark"]` and `[data-theme="light"]`, plus both `@media (prefers-color-scheme)` blocks.
   - **Why:** The theme system only works when every variable has a value in every context.

3. **Hardcoding dark-mode-specific colors in components:** Writing `bg-[#1a1a1a]` directly in a component instead of using a token.
   - **What happens:** Works in dark mode, but the element stays dark in light mode. Looks wrong.
   - **Fix:** If the value should change with the theme, define a token in tokens.css and reference it with `var()`. If it genuinely should always be `#1a1a1a` (rare), document why.
   - **Why:** Hardcoded dark colors bypass the theme system.

## Break It to Learn It

### Exercise 1: Simulate a theme switch
1. Open your browser DevTools on `http://localhost:5173/`
2. Select the `<html>` element in the Elements panel
3. Change its attribute from `data-theme="dark"` to `data-theme="light"` (or add the attribute if missing)
4. **Predict:** What will happen to the page background, text colors, and borders?
5. **Verify:** The entire page switches to light mode instantly. Background becomes warm white, text becomes dark.
6. **What you learned:** The theme switch is purely CSS. No JavaScript needed to repaint -- just changing one attribute on `<html>` triggers the cascade.
7. **Undo your change** (change the attribute back)

### Exercise 2: Break the system preference fallback
1. Open `src/lib/styles/tokens.css`
2. In the `@media (prefers-color-scheme: dark)` block, change `:root:not([data-theme="light"])` to just `:root`
3. **Predict:** What happens if someone sets `data-theme="light"` on `<html>` while their OS prefers dark mode?
4. **Verify:** The `:root` selector always matches, and because it's inside a media query that matches, its values override the `[data-theme="light"]` values (depending on source order). The explicit light theme choice is ignored.
5. **What you learned:** The `:not()` guard ensures that the explicit `data-theme` attribute always wins over the OS preference.
6. **Undo your change**

### Exercise 3: Add a value to only one theme
1. Open `src/lib/styles/tokens.css`
2. In the `[data-theme="dark"]` block only, add: `--accent-glow: rgba(224, 120, 0, 0.5);`
3. Open `src/lib/components/Nav.svelte`. In the `<nav>` element, add `style="box-shadow: 0 0 20px var(--accent-glow)"`
4. **Predict:** What happens in dark mode? What happens if you switch to light mode (via DevTools)?
5. **Verify:** Dark mode shows an orange glow under the nav. Light mode shows nothing (the variable is undefined, so `box-shadow` silently fails).
6. **What you learned:** Every theme-switching variable must exist in both theme blocks. Missing values cause silent visual bugs.
7. **Undo your changes** (remove both additions)

## Connections

- **Depends on:** [[css-custom-properties]] because the theme system is built entirely on custom properties
- **Depends on:** [[design-tokens]] because Layer 1 tokens are the theme-switching values
- **Related:** [[tailwind-utility-first]] because Tailwind's arbitrary values (`bg-[var(--token)]`) bridge the theme system into utility classes
- **Related:** [[mobile-first-responsive]] because both responsive design and theming use contextual CSS (media queries vs data attributes)

## Knowledge Check

1. How does the site know which theme to use? → See [The Mental Model](#the-mental-model)
2. Why do the `@media (prefers-color-scheme)` blocks use `:root:not([data-theme])`? → See [Worked Example](#worked-example)
3. What happens if a variable is defined in the dark block but not the light block? → See [Common Mistakes](#common-mistakes)
4. What is the SQL analogy for theme switching? → See [The Analogy](#the-analogy)
5. Which values change with the theme and which stay constant? → See [How We Use It in This Project](#how-we-use-it-in-this-project)

## Go Deeper

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [web.dev: Building a Color Scheme](https://web.dev/articles/building/a-color-scheme)
