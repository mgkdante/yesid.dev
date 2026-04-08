---
title: "Tailwind Configuration"
domain: project-setup
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - project-setup
  - intermediate
prerequisites:
  - "[[sveltekit-project-structure]]"
date: 2026-04-08
---

# Tailwind Configuration


## The Analogy

Tailwind's `@theme` block is like defining your database's ENUM types and DEFAULT values -- you declare the allowed values once, and every query (component) references them by name. Just as you would never scatter raw hex color codes `#E07800` across fifty different components, you would never hardcode `'pending'` or `'active'` as strings across fifty SQL queries when you have an ENUM. The `@theme` block is your single source of truth, and the generated utility classes are the typed references that keep everything consistent.

## What It Is

**Tailwind CSS** is a utility-first CSS framework. Instead of writing custom CSS like `color: #E07800; font-weight: 600;`, you compose styles directly in HTML using short class names: `text-brand-primary font-semibold`. Each class does exactly one thing, and you combine them like building blocks.

**Tailwind v4** (the version this project uses) introduced a major change: CSS-first configuration. In older versions (v3 and below), you configured Tailwind in a JavaScript file called `tailwind.config.js`. In v4, that configuration lives directly in your CSS file using a special `@theme` block. This means no JavaScript config file at all -- everything Tailwind needs to know about your brand's colors, fonts, and spacing is declared in plain CSS.

The `@theme` block follows a naming convention. When you write `--color-brand-primary: #E07800;` inside `@theme`, Tailwind automatically generates utility classes for every context where a color applies: `text-brand-primary` (text color), `bg-brand-primary` (background), `border-brand-primary` (border), and more. The same pattern applies to fonts (`--font-heading` generates `font-heading`), border radii (`--radius-brand` generates `rounded-brand`), and other design tokens.

## Why It Matters

Understanding Tailwind configuration is essential for any front-end work on this project. If you need to add a new brand color, change a font, or adjust a border radius, you need to know where those values live and how they flow into components. Getting this wrong means either hardcoded values scattered across files (a maintenance nightmare) or broken styling that doesn't match the brand. In a job interview, being able to explain how a design system's tokens flow from definition to usage shows you understand scalable CSS architecture -- a skill that separates junior from mid-level front-end developers.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/app.css` | The `@theme` block (lines 14-42) | This is where all brand colors, fonts, and radii are defined for Tailwind |
| `src/app.css` | The `@import 'tailwindcss'` line (line 5) | This single import activates the entire Tailwind framework |
| `src/app.css` | The `@import '$lib/styles/tokens.css'` line (line 2) | CSS custom properties for theme-switching are loaded separately, before Tailwind |
| `vite.config.ts` | The `tailwindcss()` plugin (line 11) | The `@tailwindcss/vite` plugin processes Tailwind classes at build time, replacing the older PostCSS approach |
| `src/lib/styles/tokens.css` | The `:root` and `[data-theme]` blocks | CSS custom properties that change with theme (dark/light), separate from Tailwind's static `@theme` values |

## The Mental Model

Here is the flow from definition to rendered pixel:

```
Step 1: DEFINE (src/app.css @theme block)
  --color-brand-primary: #E07800;
          |
          v
Step 2: GENERATE (Tailwind engine, via @tailwindcss/vite)
  Scans your .svelte files for class names like "text-brand-primary"
  Generates CSS: .text-brand-primary { color: #E07800; }
          |
          v
Step 3: USE (any .svelte component)
  <span class="text-brand-primary">yesid.</span>
          |
          v
Step 4: RENDER (browser)
  The span displays text in #E07800 orange
```

The naming convention is the key:

```
@theme variable name          Generated utility classes
-----------------------       -------------------------
--color-brand-primary     ->  text-brand-primary
                              bg-brand-primary
                              border-brand-primary

--font-heading            ->  font-heading

--radius-brand            ->  rounded-brand
```

The prefix (`--color-`, `--font-`, `--radius-`) tells Tailwind what category the token belongs to. Tailwind strips the prefix and generates the appropriate utilities. Think of it like a SQL column type: the type tells the database engine what operations are valid. `--color-*` tells Tailwind "this value is valid for text color, background color, and border color."

## Worked Example

Let us trace how the Hero component's call-to-action button gets its orange background and rounded corners. Open `src/lib/components/Hero.svelte` and look at line 31:

```svelte
<!-- From: src/lib/components/Hero.svelte (line 31) -->
<a
  href={primaryCta.href}
  class="inline-flex items-center rounded-brand bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary-hover"
>
  {primaryCta.label}
</a>
```

Here is what each brand-related class does:

1. **`rounded-brand`** -- Tailwind sees this class name and looks for `--radius-brand` in the `@theme` block. It finds `--radius-brand: 8px;` (line 39 of `src/app.css`). It generates CSS: `.rounded-brand { border-radius: 8px; }`.

2. **`bg-brand-primary`** -- Tailwind looks for `--color-brand-primary` in `@theme`. It finds `#E07800` (line 16). It generates: `.bg-brand-primary { background-color: #E07800; }`.

3. **`hover:bg-brand-primary-hover`** -- The `hover:` prefix is a Tailwind modifier. Tailwind looks for `--color-brand-primary-hover` in `@theme`, finds `#C96A00` (line 18), and generates: `.hover\:bg-brand-primary-hover:hover { background-color: #C96A00; }`.

4. **`font-semibold`** and **`text-white`** -- These are built-in Tailwind utilities, not from our `@theme` block. Tailwind ships with a full set of defaults for weights, spacing, and common colors.

The result: an orange button with 8px rounded corners that darkens on hover. Every one of those values is defined exactly once in `src/app.css`, and every component that needs the brand orange references it by name, never by hex code.

## Common Mistakes

1. **Using hex colors directly in components:** Writing `text-[#E07800]` or `bg-[#E07800]` instead of `text-brand-primary` or `bg-brand-primary`.
   - **What happens:** It works visually, but now the color value is scattered across files. When the brand orange changes (it happened once already -- the hover variant was adjusted), you have to find-and-replace across the entire codebase instead of changing one line in `src/app.css`.
   - **Fix:** Always use the generated utility class (`text-brand-primary`, `bg-brand-accent`). If no token exists for the color you need, add it to the `@theme` block in `src/app.css` first, then update `docs/CSS.md`.
   - **Why:** This is the same principle as database normalization. A value should be defined in exactly one place. Every other reference should be a foreign key (class name) pointing back to the source (the `@theme` block).

2. **Looking for a `tailwind.config.js` file:** Many tutorials and Stack Overflow answers reference a `tailwind.config.js` (or `.ts`) file. This project does not have one.
   - **What happens:** You create a `tailwind.config.js` file, add your colors there, and wonder why nothing works. Or you waste time searching for a file that does not exist.
   - **Fix:** All Tailwind configuration lives in the `@theme` block inside `src/app.css`. This is the Tailwind v4 way. The `@tailwindcss/vite` plugin in `vite.config.ts` handles everything that the old PostCSS + config file approach used to handle.
   - **Why:** Tailwind v4 eliminated the JavaScript config file entirely. Configuration is now CSS-native, which means fewer moving parts and no context-switching between CSS and JS when defining your design tokens.

3. **Confusing `@theme` values with CSS custom properties in `tokens.css`:** Both files define things like colors and fonts, so it is natural to mix them up.
   - **What happens:** You add a new theme-switching color (one that changes between dark and light mode) to the `@theme` block, or you add a static brand color to `tokens.css`. Either way, it does not behave as expected -- `@theme` values do not switch with theme, and `tokens.css` values do not generate Tailwind utility classes.
   - **Fix:** Use `@theme` in `src/app.css` for static brand values that never change (the orange is always `#E07800` regardless of dark/light mode). Use `src/lib/styles/tokens.css` for semantic values that flip between themes (`--bg-primary` is `#141414` in dark mode, `#FAFAF8` in light mode). To use a `tokens.css` variable in a Tailwind class, use the bracket syntax: `text-[var(--text-primary)]`.
   - **Why:** These are two different systems solving two different problems. `@theme` defines the brand palette (fixed). `tokens.css` defines the semantic theme (variable). Keeping them separate makes theme-switching work correctly without breaking brand consistency.

## Break It to Learn It

### Exercise 1: Remove a color from @theme
1. Open `src/app.css`
2. Comment out line 16: `/* --color-brand-primary: #E07800; */`
3. **Predict:** What will happen to the orange dot after "yesid" in the navigation?
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/`, look at the nav wordmark
5. **What you learned:** The `text-brand-primary` class on the dot in `src/lib/components/Nav.svelte` depends on the `@theme` definition. Without it, Tailwind cannot generate the utility class, and the color falls back to the browser default (usually black or inherited color).
6. **Undo your change**

### Exercise 2: Add a new brand color
1. Open `src/app.css`
2. Inside the `@theme` block, add a new line after line 17: `--color-brand-success: #22C55E;`
3. Open `src/lib/components/Hero.svelte`
4. On line 31, change `bg-brand-primary` to `bg-brand-success`
5. **Predict:** What color will the primary CTA button be?
6. **Verify:** Run `bun run dev`, navigate to the homepage, look at the hero button
7. **What you learned:** Adding a variable to `@theme` with the `--color-` prefix immediately makes `bg-brand-success`, `text-brand-success`, and `border-brand-success` available as utility classes -- no restart needed, no config file to edit.
8. **Undo your changes in both files**

### Exercise 3: Spot the difference between @theme and tokens.css
1. Open `src/lib/styles/tokens.css` and find `--bg-primary` under `[data-theme="dark"]` (line 30)
2. Open `src/app.css` and find `--color-dark-bg` in the `@theme` block (line 21)
3. Notice: both define `#141414`. But `--bg-primary` in tokens.css changes when the theme switches to light mode (`#FAFAF8`). `--color-dark-bg` in `@theme` is always `#141414`.
4. **Predict:** If you write `class="bg-dark-bg"` on an element, will it change color when you switch to light mode?
5. **Answer:** No. `@theme` values are static. For theme-switching, you must use `bg-[var(--bg-primary)]` which reads from `tokens.css`.
6. **What you learned:** `@theme` is for brand constants. `tokens.css` is for semantic values that vary by theme. They solve different problems and should not be mixed.

## Connections

- **Depends on:** [[sveltekit-project-structure]] because you need to know where `src/app.css` and `vite.config.ts` live in the project
- **Enables:** [[design-tokens]] because understanding `@theme` is necessary before understanding the full token architecture (tokens.css + @theme combined)
- **Related:** [[css-custom-properties]] because `@theme` variables and CSS custom properties look similar but serve different roles

## Knowledge Check

1. Where do you define a new brand color in this project? -> See [How We Use It in This Project](#how-we-use-it-in-this-project)
2. What naming convention makes `--color-brand-accent` generate `text-brand-accent` and `bg-brand-accent`? -> See [The Mental Model](#the-mental-model)
3. Why does this project not have a `tailwind.config.js` file? -> See [Common Mistakes](#common-mistakes)
4. When should you use `bg-[var(--bg-primary)]` instead of a Tailwind `@theme` class? -> See [Common Mistakes](#common-mistakes) (mistake 3)
5. What Vite plugin replaces the old PostCSS-based Tailwind setup? -> See [How We Use It in This Project](#how-we-use-it-in-this-project)

## Go Deeper

- [Tailwind CSS v4 Documentation -- Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Upgrade Guide (v3 to v4 differences)](https://tailwindcss.com/docs/upgrade-guide)
- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
