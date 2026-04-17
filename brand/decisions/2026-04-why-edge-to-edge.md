# why edge-to-edge

**Date:** 2026-04-18
**Decision type:** Layout philosophy
**Status:** Accepted. Codified in `docs/reference/CONSTITUTION.md § 2`.

## Context

When the portfolio site started (Slice 1, April 2026), the default layout was the Bootstrap-era template: a centered max-width `<main>` with 24px gutters on mobile, 48px on desktop, and every page's content boxed inside the same container. Safe, conventional, forgettable.

After Slice 13 (home page rework), the hero broke out of the container. Then the manifesto did. By Slice 17a-5, the pattern was clear: the site was better when sections chose their own layout rather than inheriting a container from a shared wrapper. The question wasn't "should sections use the edges," it was "what should the rule be."

## Options considered

### Option A — Stay centered-container

Every section lives inside `max-width: 1024px` with auto margins. Safe on ultrawide monitors. Predictable. Reads as "respectable developer portfolio, probably from 2014." Wastes a lot of viewport on desktop and eats too much space on phone.

### Option B — Full-bleed everywhere

Every section spans `100vw`. Decorative elements (MetroNetwork, blueprints, terminal windows) use the full viewport. Awwwards-era immersive design. Looks great at 1440px, breaks down on 360px where line length becomes unreadable.

### Option C — Hybrid (selected)

`<main>` has no horizontal constraints at all — just vertical flex. Each section chooses its own layout from a small set of CSS Grid Recipes:

- **Recipe 1: Full-Bleed** — visual bands, heroes, hero panels. Width = 100%.
- **Recipe 2: Contained** — text sections, forms, simple content. `max-width: var(--container-content)` (1024px) with `padding-inline: var(--space-page-x)`.
- **Recipe 3: Content + Sidebars** — three-column grid (auto / 1fr / auto) for sidebars flanking content.
- **Recipe 4: Edge Title Grid** — rotated edge title + divider + content. Listing pages and contact.

Containers exist but only for text readability. Visual elements (SVGs, panels, grids, decorations) live outside containers and use the viewport edges.

## Decision

Option C. The viewport is the canvas. Text containers center for readability; visual elements use the edges. No unused gutters.

Implementation details:

- `<main>` is edge-to-edge. No `max-width`. No horizontal `padding`.
- Each `<section>` chooses one of the 4 Recipes.
- No shared layout wrapper component. Each section owns its CSS Grid in scoped styles.
- Responsive breakpoints determine when layouts restructure (from stacked mobile to asymmetric desktop), not when containers widen.

## Rationale

1. **Desktop real estate stops being wasted.** On a 1440px monitor, a centered 1024px container leaves ~208px of unused gutter on each side. Edge-to-edge puts that space to work (SVG decorations, rotated edge titles, sidebars) — not to pad the container.

2. **Text stays readable.** Long-form reading (blog, project detail) still goes through `--container-content` (1024px) with `padding-inline: var(--space-page-x)`. Line length tops out around 72ch. The edge-to-edge rule is about visual elements; paragraph width is unaffected.

3. **Personality through structure.** The site looks distinctive because the layouts are asymmetric and use rotated edge titles, bled-out SVGs, full-viewport bands. Container-bound design can't do that without looking like a bolt-on.

4. **Mobile-first still works.** On phones the 4 Recipes collapse to single-column stacks with edge-to-edge cards. Recipe 1's bled visuals become edge-to-edge on phone too. Nothing is responsively hidden to make this work — layouts restructure at `md:` (768) and `lg:` (1024).

5. **Fewer abstractions.** When this rule was first drafted (Slice 17a-5), it was going to ship as shared wrapper components (`<SectionWrapper>`, `<EdgeRail>`, `<ListingLayout>`). By the end of Slice 17d, those had been deleted — 4 scoped CSS Grid Recipes turned out cleaner than a 3-wrapper abstraction layer that grew modes and variants over time.

## Consequences

- Every new page uses one of the 4 Recipes directly. Page components don't invent grids.
- `CONSTITUTION.md § 2` is the source of truth. The recipes are named, the container tokens are listed (`--container-content`, `--container-wide`), and the layout rule is enforced at PR review.
- Wireframes for each recipe live in `docs/reference/wireframes/` (11 HTML files, one per page template, three breakpoints each).
- The No Overflow Guarantee (`CONSTITUTION.md § 9`) becomes essential — edge-to-edge makes it easier to accidentally let content escape the viewport. Seven CSS layers prevent overflow mathematically.
- The device-coverage matrix (Nano / Phone / Foldable / Tablet / Laptop / Desktop) is orthogonal to Tailwind breakpoints. Device classes describe design intent; breakpoints describe when layouts restructure. They don't need to align.

## What this decision prevents

Drift back into "pad the page and center everything." Without the rule codified, every new page would be tempted to re-introduce a `<main>` container because it's safer. With the rule codified, a new page starts by picking a recipe.

Also prevents the opposite drift: everything becomes Awwwards-level immersion even when the content doesn't warrant it. Recipe 2 (Contained) exists explicitly to keep simple text sections simple.

## Revisit trigger

This decision gets reopened if:

- A new page category emerges that doesn't fit any of the 4 Recipes (at which point the Recipe list grows, not shrinks).
- The site adopts a print stylesheet (print layout has fundamentally different constraints).
- Multiple pages in succession invent variants of Recipe 3 or 4 that could be unified into a new Recipe.

Nothing else justifies reopening this.
