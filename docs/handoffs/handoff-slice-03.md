# Handoff: Slice 03 — Component Library

## Summary

Built 6 reusable UI components that render the typed data from slice 02. Every component accepts plain strings (locale resolution happens upstream at the page level), uses brand tokens for styling, and ships with a full test suite. Pages in slices 05-07 can now compose these components directly.

## What Was Built

- `src/lib/components/TagList.svelte` — renders a `string[]` as pill badges; renders nothing when empty
- `src/lib/components/SectionHeader.svelte` — `<h2>` heading with optional subtitle
- `src/lib/components/ServiceCard.svelte` — service tile with icon placeholder, title, description
- `src/lib/components/ProjectCard.svelte` — clickable project card with status badge and TagList; links to `/work/[slug]`
- `src/lib/components/ProjectGrid.svelte` — responsive 2-column grid of ProjectCards
- `src/lib/components/Hero.svelte` — hero section with h1, subheading, and optional CTA buttons

## Files Modified

- `docs/reference/ARCHITECTURE.md` — added `src/lib/components/` directory to the structure diagram
- `tree.txt` — added 12 new component files
- `docs/devlog/2026-04-02.md` — slice 03 session appended

## How It Works

Components are locale-agnostic. They receive resolved strings and render them. The locale resolution chain (`resolveLocale()` from `$lib/data`) runs at the page level before data reaches any component.

**Dependency chain (bottom-up):**
```
TagList           ← leaf
SectionHeader     ← leaf
ServiceCard       ← leaf
ProjectCard       ← imports TagList
ProjectGrid       ← imports ProjectCard
Hero              ← leaf
```

**Styling:** two systems are used together. CSS custom properties (`var(--bg-surface)`, `var(--text-primary)`) handle theme-switching colors. Tailwind `@theme` utilities (`bg-brand-primary`, `rounded-brand-lg`) handle static brand values. Cards use elevated backgrounds with `border-[var(--border)]` borders that reveal `border-brand-primary` on hover.

**Status badges in ProjectCard:**
- `public` → no badge (default, no noise)
- `wip` → warning-yellow badge using `#FFB627` (brand accent = semantic warning)
- `private` → muted badge using surface/border tokens

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Entire ProjectCard is an `<a>` | Whole card surface is clickable — better UX than a small button inside the card | Link only on the title |
| Empty TagList renders no DOM element | A dangling `<ul>` is invisible but noisy; conditional render is cleaner | Always render `<ul>`, let CSS hide it |
| ProjectGrid renders nothing when empty | Caller controls empty state (e.g. a message); grid shouldn't decide | Render "No projects yet" placeholder |
| Left-aligned Hero | Developer/data portfolios read as more credible left-aligned; centered feels like SaaS marketing | Centered layout |
| Keyed `{#each (project.slug)}` in ProjectGrid | Stable DOM identity for Svelte diffing; slugs are unique by data-integrity contract | Unkeyed each (slower re-renders) |
| Icon renders as text placeholder | No icon library yet; string identifier works as a placeholder and the swap to SVG is isolated to one file | Empty div, no icon rendered |

## Learn

### Svelte 5 Runes (`$props()`)
**What it is:** In Svelte 5, a component's props come in via `let { title, tags = [] } = $props()`. This replaces the old `export let title` syntax. The `$props()` rune is the new way to declare what data a component accepts.
**Why it matters:** Components are like functions — `$props()` is the function signature. TypeScript can catch mismatches before the code runs. It's the same idea as your typed SQL interfaces in slice 02: define the shape, then let the type system enforce it.
**Try this:** Open `ProjectCard.svelte`. Change `tags: string[]` to `tags: number[]` in the props type. Run `bun run check`. See the TypeScript error. Then undo it.
**Go deeper:** https://svelte.dev/docs/svelte/basic-markup#Component-props

### Tailwind `group` for hover propagation
**What it is:** Adding `class="group"` to a parent element lets child elements react to the parent's hover state using `group-hover:` prefix. Example: `<a class="group"><div class="group-hover:border-brand-primary">`. The border changes when the link is hovered.
**Why it matters:** ProjectCard's entire card surface is a link (`<a>`), but the visible border is on the inner `<article>`. Without `group`, you'd need JavaScript to propagate the hover. With `group`, it's pure CSS — no runtime cost.
**Try this:** Open `ProjectCard.svelte`. Remove `group` from the `<a>` class and `group-hover:` from the article class. Start `bun run dev`, hover a card. The border won't change. Add them back and see the difference.
**Go deeper:** https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state

### Component testing with `@testing-library/svelte`
**What it is:** `render(Component, { props })` mounts the component into a real (jsdom) DOM. `screen.getByText()`, `screen.getByRole()`, and `screen.getByTestId()` query the rendered HTML. `toBeInTheDocument()` asserts it exists.
**Why it matters:** When you change a component, tests tell you if you accidentally broke something. It's like CHECK constraints on your UI — silent until something violates the contract, then it fails loudly.
**Try this:** Open `Hero.test.ts`. Add a new test: check that the `<section>` has `data-testid="hero"`. Run `bun run test`. See it pass.
**Go deeper:** https://testing-library.com/docs/svelte-testing-library/intro

## What Comes Next

**Slice 04 — Layout & Navigation:** builds the shell that wraps all pages (nav, footer, `+layout.svelte`). Components from this slice will appear inside that shell.

**Slices 05-07 — Pages:** compose these components with real data from `$lib/data`. For example, the home page (slice 05) will render `<Hero>`, `<SectionHeader>`, and `<ProjectGrid>` wired to `getFeaturedProjects()` output.

## How to Verify

1. `bun run test` — all 75 tests pass
2. `bun run check` — 0 errors, 0 warnings
3. `bun run dev` — inspect a component in the browser: colors should match `tokens.css` values visible in DevTools
4. Hover a ProjectCard — border should turn orange (`#E07800`)
5. Import any component from a page: `import Hero from '$lib/components/Hero.svelte'`
