# Constitution CSS Grid Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SectionWrapper/EdgeRail/ListingLayout abstraction layer with plain CSS Grid, keeping identical visual output.

**Architecture:** Delete 3 shell components (~530 lines), migrate 7 pages to use scoped CSS Grid, document 4 CSS Grid recipes in CONSTITUTION.md. Zero visual regression.

**Tech Stack:** SvelteKit, Tailwind v4, CSS Grid, CSS `writing-mode` for rotated titles.

**Design spec:** `docs/specs/2026-04-15-constitution-css-grid-rewrite-design.md`

---

## File Map

### Files to Delete
- `src/lib/components/shells/SectionWrapper.svelte` (201 lines)
- `src/lib/components/shells/SectionWrapper.test.ts`
- `src/lib/components/shells/EdgeRail.svelte` (220 lines)
- `src/lib/components/shells/EdgeRail.test.ts`
- `src/lib/components/shells/ListingLayout.svelte` (109 lines)
- `src/lib/components/shells/DetailHero.svelte` (79 lines) — 0 consumers
- `src/lib/components/shells/DetailHero.test.ts`
- `src/lib/components/shells/CardGrid.svelte` (62 lines) — 0 consumers
- `src/lib/components/shells/CardGrid.test.ts`
- `src/lib/components/shells/BentoGrid.svelte` (34 lines) — 0 consumers
- `src/lib/components/shells/BentoGrid.test.ts`
- `src/lib/components/shells/AsidePanel.svelte` (57 lines) — 0 consumers
- `src/lib/components/shells/AsidePanel.test.ts`
- `src/lib/components/shells/index.ts` — barrel (after moving BlueprintShell)

### Files to Move
- `src/lib/components/shells/BlueprintShell.svelte` → `src/lib/components/brand/BlueprintShell.svelte`

### Files to Modify (Page Migrations)
- `src/lib/components/home/HomePage.svelte` — remove 5 SectionWrappers
- `src/lib/components/about/AboutPage.svelte` — remove 1 SectionWrapper
- `src/lib/components/blog/BlogListingPage.svelte` — remove 2 SectionWrappers
- `src/lib/components/projects/ProjectListingPage.svelte` — remove 1 SectionWrapper
- `src/lib/components/blog/BlogDetailHeader.svelte` — remove SectionWrapper + background slot
- `src/lib/components/projects/ProjectDetailHeader.svelte` — remove SectionWrapper + background slot
- `src/lib/components/projects/ProjectDetailPage.svelte` — remove SectionWrapper + 3 slots
- `src/routes/blog/+layout.svelte` — replace ListingLayout with Recipe 4
- `src/routes/projects/+layout.svelte` — replace ListingLayout with Recipe 4

### Files to Modify (Imports)
- `src/lib/components/blog/BlogBlueprint.svelte` — update BlueprintShell import path
- `src/lib/components/projects/ProjectsBlueprint.svelte` — update BlueprintShell import path
- `src/lib/components/brand/index.ts` — add BlueprintShell export

### Files to Modify (Docs)
- `docs/reference/CONSTITUTION.md` — rewrite §2, §6, §9, §11, §13
- `CLAUDE.md` — remove shells/ references
- `docs/reference/ARCHITECTURE.md` — update component tiers
- `docs/reference/CSS.md` — remove SectionWrapper references
- `docs/reference/TESTS.md` — remove shell test entries

---

## Task 1: Rewrite CONSTITUTION.md

**Files:**
- Modify: `docs/reference/CONSTITUTION.md`

- [ ] **Step 1: Rewrite §2 Layout Model**

Replace the "Section Pattern", "Scope Model — 6 Layers", and "4 Layout Patterns" with the 4 CSS Grid Recipes. Delete the SectionWrapper grid diagram and scope table.

The new §2 keeps:
- "The One Rule" paragraph (unchanged)
- Container Tokens table (unchanged)
- Container rule about text readability (unchanged)

Replace with:

```markdown
### 4 CSS Grid Recipes

Every section uses one of these patterns. No layout wrapper components — just scoped CSS.

#### Recipe 1: Full-Bleed

\`\`\`css
.section { width: 100%; }
\`\`\`

For: Heroes, visual bands, headers, bento grids.

#### Recipe 2: Contained

\`\`\`css
.section {
  max-width: var(--container-content); /* or --container-wide, --container-prose */
  margin-inline: auto;
  padding-inline: var(--space-page-x);
}
\`\`\`

For: Text sections, forms, simple centered content.

#### Recipe 3: Content + Sidebars

\`\`\`css
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-card-gap);
}
@media (min-width: 1024px) {
  .section-grid {
    grid-template-columns: auto 1fr auto;
    /* or proportional: 1fr 2fr 1fr */
  }
}
\`\`\`

For: Content flanked by sidebars (TOC, filter panels, rotated headings).
Use `auto` when the sidebar sizes itself. Use proportional `fr` when columns share space.
Sidebars collapse to stacked on mobile or hide with a responsive class.

#### Recipe 4: Edge Title Grid

\`\`\`css
.listing-grid {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .listing-grid {
    grid-template-columns: auto 1px 1fr;
    margin-top: -5rem;
  }
  .edge-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: clamp(8rem, 15vw, 15rem);
    font-weight: 900;
    color: var(--text-muted);
    opacity: 0.06;
    position: sticky;
    top: 0;
    height: 100dvh;
  }
}
\`\`\`

For: Listing pages with a big rotated section title.

### Background Decorations

Use `position: relative` on the section + `position: absolute` on the decoration:

\`\`\`svelte
<section class="relative w-full">
  <div class="absolute inset-0 -z-10 pointer-events-none">
    <DecorativeElement />
  </div>
  <div class="content-grid">...</div>
</section>
\`\`\`
```

- [ ] **Step 2: Rewrite §6 Component Standards — tiers table**

Change the tiers table from 4 rows to 3 rows. Delete the **shells/** tier entirely:

```markdown
| Tier       | Location                    | Source                   | Conventions                                        |
| ---------- | --------------------------- | ------------------------ | -------------------------------------------------- |
| **ui/**    | `src/lib/components/ui/`    | shadcn-svelte scaffolded | `cn()`, `data-slot`, background/foreground tokens  |
| **brand/** | `src/lib/components/brand/` | Hand-built               | `cn()`, `data-slot`, brand-specific styling + GSAP |
| **page**   | `src/lib/components/`       | One-off page components  | Consume from ui/ and brand/ tiers, own CSS Grid    |
```

- [ ] **Step 3: Rewrite §9 Responsive — Edge Decorations paragraph**

Replace the current "Edge Decorations" paragraph (references SectionWrapper side slots) with:

```markdown
### Edge Decorations

Edge columns (rotated titles, decorative rails) collapse to `display: none` below `xl:` (1024px) via media query. No wrapper component needed — edge elements are grid cells that disappear at smaller breakpoints.
```

- [ ] **Step 4: Update §11 Anti-Patterns**

Remove these SectionWrapper-specific anti-patterns:
- "Inline section padding in page components (use SectionWrapper or semantic spacing tokens)"
- "Hand-rolled edge decorations in page components (use SectionWrapper side slots or EdgeRail)"

Add these new anti-patterns:
- "Layout wrapper components — use CSS Grid recipes directly in scoped styles"
- "Shared layout components with multiple modes/variants — each page owns its grid"

- [ ] **Step 5: Rewrite §13 Atomic Design**

Replace the 4-tier hierarchy with 3 tiers. Delete all SectionWrapper/EdgeRail/shells documentation. Delete the shells slot conventions table. Keep Card documentation unchanged.

New hierarchy:

```markdown
### 3-Tier Component Hierarchy

\`\`\`
TIER 1: ui/        → Universal headless primitives + brand tokens
    ↓ composes
TIER 2: brand/     → yesid.dev-only craft, no library equivalent
    ↓ composes
TIER 3: page       → Pure composition — CSS Grid + Tier 1-2 atoms
\`\`\`
```

New composition rules:
1. Tier 3 never creates UI patterns — only wires data into CSS Grid + Tier 1-2 atoms
2. Tier 2 may use Tier 1
3. Tier 1 is self-contained
4. New page = choose a CSS Grid recipe + fill with atoms. Zero layout invention.

- [ ] **Step 6: Run `bun run check` to verify no breakage**

Run: `bun run check`
Expected: 0 errors (doc changes only, no code changes yet)

- [ ] **Step 7: Commit**

```bash
git add docs/reference/CONSTITUTION.md
git commit -m "docs(slice-17d): rewrite CONSTITUTION.md — CSS Grid recipes replace SectionWrapper"
```

---

## Task 2: HomePage — Remove 5 SectionWrappers

**Files:**
- Modify: `src/lib/components/home/HomePage.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

In the `<script>` block, delete the import line:
```typescript
import { SectionWrapper } from '$lib/components/shells';
```

- [ ] **Step 2: Replace Hero and Manifesto sections (bleed → unwrap)**

Replace:
```svelte
<SectionWrapper layout="bleed">
	<HeroBanner />
</SectionWrapper>
```
With:
```svelte
<section class="w-full">
	<HeroBanner />
</section>
```

Same for Manifesto section — replace `<SectionWrapper layout="bleed">` with `<section class="w-full">`.

- [ ] **Step 3: Replace Projects section (centered + sideLeft)**

Replace:
```svelte
<SectionWrapper layout="centered" style="--edge-left: clamp(4.5rem, 8vw, 8rem)">
	{#snippet sideLeft()}
		<div class="rotated-title rotated-title--left">
			<SectionHeading heading="Projects" />
		</div>
	{/snippet}
	<FeaturedProjects />
</SectionWrapper>
```
With:
```svelte
<section class="home-section home-section--left">
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading="Projects" />
	</div>
	<div class="home-section-content">
		<FeaturedProjects />
	</div>
</section>
```

- [ ] **Step 4: Replace Services section (centered + sideRight + background)**

Replace:
```svelte
<SectionWrapper layout="centered" style="--edge-right: clamp(4.5rem, 8vw, 8rem)">
	{#snippet background()}
		<ServicesBlueprint />
	{/snippet}
	{#snippet sideRight()}
		<div class="rotated-title rotated-title--right">
			<SectionHeading heading="Services" />
		</div>
	{/snippet}
	<HomeServices />
</SectionWrapper>
```
With:
```svelte
<section class="home-section home-section--right relative">
	<div class="absolute inset-0 -z-10 pointer-events-none">
		<ServicesBlueprint />
	</div>
	<div class="home-section-content">
		<HomeServices />
	</div>
	<div class="rotated-title rotated-title--right">
		<SectionHeading heading="Services" />
	</div>
</section>
```

- [ ] **Step 5: Replace Closer section (centered + sideLeft)**

Same pattern as Projects section:
```svelte
<section class="home-section home-section--left">
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading="Terminus" />
	</div>
	<div class="home-section-content">
		<HomeCloser />
	</div>
</section>
```

- [ ] **Step 6: Add scoped CSS Grid for home sections**

Add to the existing `<style>` block:

```css
/* Recipe 3: Content + Side Column */
.home-section {
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;
}

.home-section-content {
	min-width: 0;
}

/* Left-side heading: heading | content */
@media (min-width: 1024px) {
	.home-section--left {
		grid-template-columns: clamp(4.5rem, 8vw, 8rem) 1fr;
	}
	.home-section--right {
		grid-template-columns: 1fr clamp(4.5rem, 8vw, 8rem);
	}
}

/* Hide rotated titles on mobile */
@media (max-width: 1023px) {
	.rotated-title {
		display: none;
	}
}
```

- [ ] **Step 7: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors. Home page renders identically.

- [ ] **Step 8: Visually verify on localhost:5173**

Check at 1440px desktop and 375px mobile:
- Hero and Manifesto: unchanged (full-bleed)
- Projects/Services/Closer: rotated headings visible on desktop, hidden on mobile
- ServicesBlueprint background visible behind Services section
- Hazard separators between all sections

- [ ] **Step 9: Commit**

```bash
git add src/lib/components/home/HomePage.svelte
git commit -m "refactor(slice-17d): HomePage — replace 5 SectionWrappers with CSS Grid"
```

---

## Task 3: AboutPage — Remove 1 SectionWrapper

**Files:**
- Modify: `src/lib/components/about/AboutPage.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace SectionWrapper with plain section**

The AboutPage wraps its entire bento grid in `<SectionWrapper layout="bleed">`. Replace with `<section class="w-full">` — the bento grid CSS is self-contained and needs no wrapper.

Replace:
```svelte
<SectionWrapper layout="bleed" style="min-height: calc(100dvh - 5rem)" data-testid="page-about">
```
With:
```svelte
<section class="w-full" style="min-height: calc(100dvh - 5rem)" data-testid="page-about">
```

And the matching closing tag: `</SectionWrapper>` → `</section>`.

- [ ] **Step 3: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/about/AboutPage.svelte
git commit -m "refactor(slice-17d): AboutPage — remove SectionWrapper bleed (no-op wrapper)"
```

---

## Task 4: BlogListingPage — Remove 2 SectionWrappers

**Files:**
- Modify: `src/lib/components/blog/BlogListingPage.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace header SectionWrapper (bleed → unwrap)**

Replace:
```svelte
<SectionWrapper layout="bleed" container="none">
	<div class="blog-blueprint-header" data-batch="blog-item">
```
With:
```svelte
<section class="w-full">
	<div class="blog-blueprint-header" data-batch="blog-item">
```

And the matching closing: `</SectionWrapper>` → `</section>`.

- [ ] **Step 3: Replace listing SectionWrapper (centered + sideLeft → CSS Grid)**

Replace the second SectionWrapper block:
```svelte
<SectionWrapper layout="centered" container="none" style="--edge-left: clamp(220px, 22vw, 320px)">
	{#snippet sideLeft()}
		<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4" data-lenis-prevent>
			<BlogFilterSidebar ... />
		</div>
	{/snippet}

	<!-- Listing content with padding -->
	<div class="px-4 py-6 md:px-6 md:py-8">
	...
	</div>
</SectionWrapper>
```

With a plain CSS Grid:
```svelte
<section class="blog-listing-grid">
	<aside class="blog-filter-column">
		<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4" data-lenis-prevent>
			<BlogFilterSidebar ... />
		</div>
	</aside>

	<div class="px-4 py-6 md:px-6 md:py-8">
	...
	</div>
</section>
```

- [ ] **Step 4: Add scoped CSS Grid for listing**

Add to the `<style>` block:
```css
/* Recipe 3: Filter sidebar + content */
.blog-listing-grid {
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;
}

.blog-filter-column {
	display: none;
}

@media (min-width: 1024px) {
	.blog-listing-grid {
		grid-template-columns: clamp(220px, 22vw, 320px) 1fr;
	}
	.blog-filter-column {
		display: block;
	}
}
```

- [ ] **Step 5: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/blog/BlogListingPage.svelte
git commit -m "refactor(slice-17d): BlogListingPage — replace 2 SectionWrappers with CSS Grid"
```

---

## Task 5: ProjectListingPage — Remove 1 SectionWrapper

**Files:**
- Modify: `src/lib/components/projects/ProjectListingPage.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace listing SectionWrapper with CSS Grid**

Same pattern as Task 4 Step 3. The header is already a plain `<div>` (not wrapped in SectionWrapper). Replace the listing SectionWrapper:

```svelte
<SectionWrapper layout="centered" container="none" style="--edge-left: clamp(220px, 22vw, 320px)">
	{#snippet sideLeft()}
		<div class="sticky top-8 ..." data-lenis-prevent>
			<ProjectFilterSidebar ... />
		</div>
	{/snippet}
	...
</SectionWrapper>
```

With:
```svelte
<section class="project-listing-grid">
	<aside class="project-filter-column">
		<div class="sticky top-8 ..." data-lenis-prevent>
			<ProjectFilterSidebar ... />
		</div>
	</aside>
	...
</section>
```

- [ ] **Step 3: Add scoped CSS Grid**

```css
.project-listing-grid {
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;
}

.project-filter-column {
	display: none;
}

@media (min-width: 1024px) {
	.project-listing-grid {
		grid-template-columns: clamp(220px, 22vw, 320px) 1fr;
	}
	.project-filter-column {
		display: block;
	}
}
```

- [ ] **Step 4: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectListingPage.svelte
git commit -m "refactor(slice-17d): ProjectListingPage — replace SectionWrapper with CSS Grid"
```

---

## Task 6: BlogDetailHeader — Remove SectionWrapper + Background Slot

**Files:**
- Modify: `src/lib/components/blog/BlogDetailHeader.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace SectionWrapper with relative-positioned section**

The current pattern:
```svelte
<SectionWrapper layout="bleed" centerContent class="header-section">
	{#snippet background()}
		<!-- CornerMarks, chevrons, watermark, edge labels -->
	{/snippet}
	<!-- Content: back link, category, title, tags, meta -->
</SectionWrapper>
```

Replace with:
```svelte
<section class="header-section relative w-full flex items-center">
	<!-- Background decorations -->
	<div class="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
		<!-- CornerMarks, chevrons, watermark, edge labels — move here from background snippet -->
	</div>
	<!-- Content: back link, category, title, tags, meta -->
</section>
```

Move the contents of the `{#snippet background()}...{/snippet}` block into the absolute-positioned div. Remove the snippet wrapper syntax (`{#snippet background()}` and `{/snippet}`). The content children stay in place — remove any snippet wrapping.

- [ ] **Step 3: Update scoped CSS**

The existing `.header-section` styles should still work. Check for any rules targeting `.section-wrapper` or `[data-layout]` selectors — delete them. If there are `:global(.section-wrapper...)` overrides, delete those too.

Add if needed:
```css
.header-section {
	min-height: 60dvh;
}
```

- [ ] **Step 4: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/blog/BlogDetailHeader.svelte
git commit -m "refactor(slice-17d): BlogDetailHeader — replace SectionWrapper with relative/absolute"
```

---

## Task 7: ProjectDetailHeader — Remove SectionWrapper + Background Slot

**Files:**
- Modify: `src/lib/components/projects/ProjectDetailHeader.svelte`

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace SectionWrapper with relative-positioned section**

Same pattern as Task 6. Replace `<SectionWrapper layout="bleed" centerContent class="header-section">` with a plain `<section>`. Move background snippet contents into an absolute-positioned div.

```svelte
<section class="header-section relative w-full flex items-center">
	<div class="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
		<!-- CornerMarks, chevrons, crosshair SVG, ticks, edge metadata — from background snippet -->
	</div>
	<!-- Content: back link, title, stack pills — stay in place -->
</section>
```

- [ ] **Step 3: Clean up scoped CSS**

Delete any `:global(.section-wrapper...)` or `[data-layout]` selectors. The header-section styles should work as-is.

- [ ] **Step 4: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectDetailHeader.svelte
git commit -m "refactor(slice-17d): ProjectDetailHeader — replace SectionWrapper with relative/absolute"
```

---

## Task 8: ProjectDetailPage — Remove SectionWrapper + 3 Slots

**Files:**
- Modify: `src/lib/components/projects/ProjectDetailPage.svelte`

This is the most complex migration — 3 slots (sideLeft, content, sideRight) becoming a 3-column CSS Grid.

- [ ] **Step 1: Remove SectionWrapper import**

Delete: `import { SectionWrapper } from '$lib/components/shells';`

- [ ] **Step 2: Replace SectionWrapper with CSS Grid**

Replace:
```svelte
<SectionWrapper layout="centered" container="none" class="detail-body">
	{#snippet sideLeft()}
		<!-- TOC panel (sticky) -->
	{/snippet}

	<!-- CollapsibleSection cards + README -->

	{#snippet sideRight()}
		<ProjectGlancePanel ... />
	{/snippet}
</SectionWrapper>
```

With:
```svelte
<div class="detail-body">
	<aside class="toc-column">
		<!-- TOC panel (sticky) — contents from sideLeft snippet -->
	</aside>

	<div class="sections-column">
		<!-- CollapsibleSection cards + README — contents from children -->
	</div>

	<aside class="glance-column">
		<ProjectGlancePanel ... />
	</aside>
</div>
```

- [ ] **Step 3: Add scoped CSS Grid**

Delete the existing `:global(.section-wrapper.detail-body[data-layout="centered"])` override. Replace with direct scoped CSS:

```css
.detail-body {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-card-gap);
	padding-inline: var(--space-page-x);
}

.toc-column,
.glance-column {
	display: none;
}

@media (min-width: 1024px) {
	.detail-body {
		grid-template-columns: 1fr 2fr 1fr;
	}
	.toc-column,
	.glance-column {
		display: block;
	}
}
```

- [ ] **Step 4: Delete `:global()` specificity hacks**

Search the `<style>` block for any `:global(.section-wrapper...)` or `:global(.detail-body...)` rules. Delete them all — the page now owns its grid directly.

- [ ] **Step 5: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 6: Visually verify on localhost:5173**

Navigate to any project detail page. Check:
- Desktop 1440px: 3-column layout (TOC | content | glance panel)
- Mobile 375px: single column, TOC hidden, GlancePanelMobile shows, floating TocPill works

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/projects/ProjectDetailPage.svelte
git commit -m "refactor(slice-17d): ProjectDetailPage — replace SectionWrapper with 3-column CSS Grid"
```

---

## Task 9: Route Layouts — Replace ListingLayout with Recipe 4

**Files:**
- Modify: `src/routes/blog/+layout.svelte`
- Modify: `src/routes/projects/+layout.svelte`

- [ ] **Step 1: Rewrite blog route layout**

Replace the entire `src/routes/blog/+layout.svelte` (currently 9 lines):

```svelte
<script lang="ts">
	let { children } = $props();
</script>

<div class="listing-layout">
	<div class="edge-title-column">
		<div class="edge-title">Blog<span class="edge-dot">.</span></div>
		<div class="metro-dots metro-dots-top">
			<div class="metro-line"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-lg"></div>
		</div>
		<div class="metro-dots metro-dots-bottom">
			<div class="metro-dot metro-dot-lg"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-line"></div>
		</div>
	</div>
	<div class="accent-rail"></div>
	<div class="listing-content">
		{@render children()}
	</div>
</div>

<style>
	/* Recipe 4: Edge Title Grid */
	.listing-layout {
		display: block;
		width: 100%;
	}
	.edge-title-column { display: none; }
	.accent-rail { display: none; }
	.listing-content { min-width: 0; }

	@media (min-width: 1024px) {
		.listing-layout {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			margin-top: -5rem;
		}
		.listing-content {
			padding-top: 5rem;
		}
		.edge-title-column {
			display: flex;
			align-items: center;
			justify-content: center;
			position: sticky;
			top: 0;
			height: 100dvh;
			writing-mode: vertical-rl;
			padding-inline: 0.5rem;
			/* position: relative needed for metro-dots absolute positioning */
		}
		.edge-title {
			font-family: var(--font-heading);
			font-size: clamp(8rem, 15vw, 15rem);
			font-weight: 900;
			color: var(--text-muted);
			opacity: 0.06;
			white-space: nowrap;
			line-height: 1;
			letter-spacing: -0.04em;
		}
		.edge-dot {
			color: var(--primary);
			opacity: 1;
		}
		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}
	}

	/* Metro station dots */
	.metro-dots {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.metro-dots-top { top: 16px; }
	.metro-dots-bottom { bottom: 16px; }
	.metro-line {
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
	}
	.metro-dot { border-radius: 50%; }
	.metro-dot-sm {
		width: 5px;
		height: 5px;
		border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.metro-dot-lg {
		width: 8px;
		height: 8px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		border: 1.5px solid color-mix(in srgb, var(--primary) 30%, transparent);
	}
</style>
```

- [ ] **Step 2: Rewrite projects route layout**

Same structure as blog layout, with "Projects" instead of "Blog":

Copy the blog layout to `src/routes/projects/+layout.svelte`. Change:
- `Blog<span class="edge-dot">.</span>` → `Projects<span class="edge-dot">.</span>`

Everything else (grid, metro dots, accent rail) is identical.

- [ ] **Step 3: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors. Both listing pages render with the edge title rail.

- [ ] **Step 4: Visually verify**

Check `/blog` and `/projects` at 1440px:
- Rotated title visible in left rail
- Accent line between title and content
- Metro dots above and below title
- Content area fills remaining width

Check at 375px mobile:
- No edge title visible
- Content fills full width
- Mobile heading ("Blog." / "Projects.") visible inside the page component

- [ ] **Step 5: Commit**

```bash
git add src/routes/blog/+layout.svelte src/routes/projects/+layout.svelte
git commit -m "refactor(slice-17d): route layouts — replace ListingLayout with inline Recipe 4"
```

---

## Task 10: Move BlueprintShell to brand/, Delete shells/ Directory

**Files:**
- Move: `src/lib/components/shells/BlueprintShell.svelte` → `src/lib/components/brand/BlueprintShell.svelte`
- Modify: `src/lib/components/brand/index.ts` — add BlueprintShell export
- Modify: `src/lib/components/blog/BlogBlueprint.svelte` — update import path
- Modify: `src/lib/components/projects/ProjectsBlueprint.svelte` — update import path
- Delete: entire `src/lib/components/shells/` directory

- [ ] **Step 1: Move BlueprintShell**

```bash
cp src/lib/components/shells/BlueprintShell.svelte src/lib/components/brand/BlueprintShell.svelte
```

- [ ] **Step 2: Add to brand barrel**

In `src/lib/components/brand/index.ts`, add:
```typescript
export { default as BlueprintShell } from './BlueprintShell.svelte';
export type { BlueprintShellProps } from './BlueprintShell.svelte';
```

- [ ] **Step 3: Update BlueprintShell consumers**

In `src/lib/components/blog/BlogBlueprint.svelte`, change:
```typescript
// FROM:
import { BlueprintShell } from '$lib/components/shells';
// TO:
import { BlueprintShell } from '$lib/components/brand';
```

Same change in `src/lib/components/projects/ProjectsBlueprint.svelte`.

- [ ] **Step 4: Remove `@chenglou/pretext` dependency**

This package was only used by EdgeRail for Canvas text measurement. No longer needed.

```bash
bun remove @chenglou/pretext
```

- [ ] **Step 5: Delete the entire shells/ directory**

```bash
rm -rf src/lib/components/shells/
```

This deletes:
- `SectionWrapper.svelte` + `.test.ts` (0 remaining consumers)
- `EdgeRail.svelte` + `.test.ts` (0 remaining consumers)
- `ListingLayout.svelte` (0 remaining consumers)
- `DetailHero.svelte` + `.test.ts` (0 external consumers)
- `CardGrid.svelte` + `.test.ts` (0 external consumers)
- `BentoGrid.svelte` + `.test.ts` (0 external consumers)
- `AsidePanel.svelte` + `.test.ts` (0 external consumers)
- `index.ts` (barrel — no longer needed)

- [ ] **Step 6: Run `bun run check`**

Run: `bun run check`
Expected: 0 errors. No file imports from `$lib/components/shells` anymore.

If there are import errors, search for any remaining references:
```bash
grep -r "components/shells" src/
```

- [ ] **Step 7: Run `bun run test`**

Run: `bun run test`
Expected: All tests pass. Shell test files are deleted (they tested deleted components). Page tests should still pass since we only changed implementation, not behavior.

Note the test count — it will drop because we deleted shell component tests.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(slice-17d): delete shells/ directory, move BlueprintShell to brand/"
```

---

## Task 11: Update CLAUDE.md + Reference Docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/reference/ARCHITECTURE.md`
- Modify: `docs/reference/CSS.md`
- Modify: `docs/reference/TESTS.md`

- [ ] **Step 1: Update CLAUDE.md**

Search for and remove/update references to:
- `shells/` directory
- `SectionWrapper`
- `EdgeRail`
- `ListingLayout`
- "shells/ tier" or "Tier 3 — shells/"

In the Repo Structure section, remove the shells/ line if present. Update the component tiers description to reflect 3 tiers.

- [ ] **Step 2: Update ARCHITECTURE.md**

Remove any shell component documentation. Update the component tiers diagram to show 3 tiers. Remove SectionWrapper/EdgeRail from any component lists.

- [ ] **Step 3: Update CSS.md**

Remove references to SectionWrapper CSS variables (`--edge-left`, `--edge-right`), SectionWrapper data attributes (`[data-layout]`, `[data-container]`), and EdgeRail positioning rules.

- [ ] **Step 4: Update TESTS.md**

Remove entries for deleted shell test files:
- `SectionWrapper.test.ts`
- `EdgeRail.test.ts`
- `DetailHero.test.ts`
- `CardGrid.test.ts`
- `BentoGrid.test.ts`
- `AsidePanel.test.ts`

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/reference/ARCHITECTURE.md docs/reference/CSS.md docs/reference/TESTS.md
git commit -m "docs(slice-17d): update reference docs — remove shells/ references, 3-tier model"
```

---

## Task 12: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass. Note the new test count (will be lower than 798 due to deleted shell tests).

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: 0 errors.

- [ ] **Step 3: Search for orphaned references**

```bash
grep -r "SectionWrapper\|EdgeRail\|ListingLayout\|components/shells" src/ --include="*.svelte" --include="*.ts"
```

Expected: 0 results. If any remain, fix them.

- [ ] **Step 4: Search for orphaned `:global()` layout hacks**

```bash
grep -r ":global(.section-wrapper\|:global(.detail-body\|data-layout" src/ --include="*.svelte"
```

Expected: 0 results.

- [ ] **Step 5: Visual spot-check all pages**

Open each route on `localhost:5173` at 1440px desktop:
- `/` — 5 sections with rotated headings
- `/about` — bento grid
- `/blog` — edge title + filter sidebar
- `/blog/[any-slug]` — magazine header + 2-col body
- `/projects` — edge title + filter sidebar
- `/projects/[any-slug]` — header + 3-col body
- `/services` — sticky tabs + cards
- `/services/[any-id]` — hero + 3-col body
- `/tech-stack` — centered hero
- `/contact` — 2-col terminals

Every page should look identical to before. No visual regression.

- [ ] **Step 6: Print test results table**

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
```

- [ ] **Step 7: Update checkpoint**

Update `docs/slices/slice-17-checkpoint.md` with:
- Constitution rewrite complete
- Shells/ directory deleted
- New test count
- Next action: wireframe diagrams or contact page

- [ ] **Step 8: Commit checkpoint**

```bash
git add docs/slices/slice-17-checkpoint.md
git commit -m "docs(slice-17d): update checkpoint — constitution CSS Grid rewrite complete"
```
