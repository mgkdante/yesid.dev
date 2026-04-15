---
title: "Self-Hosted Fonts with @fontsource"
domain: devops
difficulty: 1
difficulty_label: beginner
reading_time: 5
tags:
  - learn
  - devops
  - beginner
  - fonts
  - performance
prerequisites:
  - "[[bun-runtime]]"
  - "[[sveltekit-project-structure]]"
date: 2026-04-15
---

# Self-Hosted Fonts with @fontsource

## The Analogy

Using Google Fonts CDN is like ordering supplies from a warehouse across town every time a customer walks in. Self-hosting fonts is like keeping those supplies in your own stockroom — no delivery delay, no dependency on the warehouse being open.

## What It Is

**Google Fonts CDN** loads font files from Google's servers at page load. The browser fetches HTML, then makes additional network requests to Google to download font files. During this gap, text renders in a fallback system font (like Arial), then "swaps" to the real font when it arrives — causing a visible **layout shift** (text resizes, lines reflow).

**Self-hosted fonts** via `@fontsource-variable` bundles the font files directly into your app's build output. The fonts are served from the same origin as your HTML, CSS, and JavaScript. No external network request, no swap delay.

**Variable fonts** are a single font file that contains all weights (100-900) and styles. Instead of loading separate files for Regular, Bold, and Italic, one variable font file covers everything. This is smaller total download and more flexible.

## Why It Matters

Layout shift from font loading is a real UX problem and a Lighthouse performance penalty (CLS — Cumulative Layout Shift). For a portfolio site where first impressions matter, having text jump around on load looks unprofessional. Self-hosting fonts is the simplest fix with the biggest impact.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/+layout.svelte` | `import '@fontsource-variable/inter'` | Imports font CSS (client-side only, guarded by `browser` check) |
| `src/app.css` | `:root { font-family: 'Inter Variable', ... }` | Sets the variable font as the global default |
| `src/app.html` | Comment: "Fonts: self-hosted via @fontsource-variable" | Documents that no external font requests are made |
| `package.json` | `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | The npm packages that contain the font files |

## The Mental Model

```
Before (Google Fonts CDN):
  Browser loads HTML → discovers <link> to fonts.googleapis.com
  → downloads font CSS → discovers font file URLs → downloads .woff2 files
  → swaps fallback font for real font → layout shift!

After (Self-hosted):
  Browser loads HTML → CSS already references bundled font files
  → font files served from same origin (often already cached)
  → no swap needed → no layout shift
```

## Worked Example

```typescript
// From: src/routes/+layout.svelte
// Fonts are imported client-side only — SSR doesn't need them
import { browser } from '$app/environment';

if (browser) {
  // These imports trigger the font CSS to load, which references
  // the .woff2 files bundled in the package
  import('@fontsource-variable/inter');
  import('@fontsource-variable/jetbrains-mono');
}
```

```css
/* From: src/app.css */
/* Override the root font-family to use the variable font.
   The @theme block defines --font-heading and --font-body as 'Inter',
   but the actual loaded font is 'Inter Variable' from @fontsource. */
:root {
  font-family: 'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif;
}
code, kbd, samp, pre {
  font-family: 'JetBrains Mono Variable', 'JetBrains Mono', 'Fira Code', monospace;
}
```

The `:root` override ensures the variable font takes priority. The non-variable name (`'Inter'`) is the fallback for browsers that don't support variable fonts (very rare today).

## Common Mistakes

1. **Importing fonts at the top level (not client-guarded):**
   - **What happens:** SSR tries to process font CSS, causing build warnings or errors
   - **Fix:** Guard with `if (browser)` and use dynamic `import()`
   - **Why:** Font CSS references file paths that only make sense in the browser

2. **Not updating `:root` font-family:**
   - **What happens:** The font files load but the browser still uses the old font stack
   - **Fix:** Add the variable font name (e.g., `'Inter Variable'`) to `:root` font-family
   - **Why:** `@fontsource-variable` registers the font under its variable name, not the base name

3. **Keeping the Google Fonts `<link>` tag:**
   - **What happens:** Browser makes unnecessary network requests to Google
   - **Fix:** Remove the `<link>` from `app.html`
   - **Why:** The self-hosted fonts replace the CDN ones entirely

## Connections

- **Depends on:** [[bun-runtime]] because `bun install` adds the font packages
- **Depends on:** [[sveltekit-project-structure]] because the import goes in `+layout.svelte`
- **Related:** [[tailwind-utility-first]] because Tailwind's `font-heading` / `font-mono` utilities reference the same font families

## Knowledge Check

1. Why does Google Fonts CDN cause layout shift? -> See [What It Is](#what-it-is)
2. Why is the import guarded with `if (browser)`? -> See [Common Mistakes](#common-mistakes)
3. What's the difference between `'Inter'` and `'Inter Variable'`? -> See [Worked Example](#worked-example)

## Go Deeper

- [fontsource.org](https://fontsource.org/) — official documentation and font catalog
- [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices) — comprehensive font loading guide
