---
id: tailwind
name: "Tailwind CSS"
layer: frontend
domains: [web-development]
connectsTo: [sveltekit, nextjs]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: tailwind
proficiency: expert
---

## What it is

Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS classes like `.card-header`, you compose small utility classes directly in your HTML: `flex items-center gap-4 text-sm font-medium`. Tailwind scans your files at build time and generates only the CSS you actually use, resulting in tiny production stylesheets. Version 4 introduced a CSS-native engine with `@theme` for design tokens.

## Why I use it

Tailwind eliminates the naming problem that plagues CSS at scale. I don't need to invent class names, maintain a separate stylesheet, or worry about specificity conflicts. For a component-based architecture like Svelte, co-locating styles with markup makes components truly self-contained. I pair Tailwind with semantic CSS custom properties for theming — Tailwind handles composition (spacing, flex, typography), while `tokens.css` handles meaning (what "primary background" means in light vs. dark mode).

## In Practice

On yesid.dev, Tailwind CSS v4 handles all compositional styling. The `@theme` block in `app.css` defines brand values (orange `#E07800`, yellow `#FFB627`, Inter and JetBrains Mono fonts), while `tokens.css` provides semantic tokens like `--bg-primary` and `--text-muted` that components reference. Every component uses Tailwind utilities for layout and spacing, with scoped `<style>` blocks reserved for complex grid layouts or animations that would need more than three utilities on one element.
