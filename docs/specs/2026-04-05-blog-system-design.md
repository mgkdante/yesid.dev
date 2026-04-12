# Slice 07 — Blog System Design

**Date:** 2026-04-05
**Status:** approved
**Depends on:** 06d

## Overview

Build a full blog system for yesid.dev with two content lanes (Professional + Personal), per-post SVG illustrations with GSAP animations, markdown rendering via mdsvex, sidebar tag filtering, and i18n-ready posts. The blog is brand-first — professional by default, with a warmer "Personal Corner" accessible via sidebar navigation.

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Content format | Markdown + YAML frontmatter | Write-anywhere (phone, laptop), standardized, code blocks native |
| Rendering | mdsvex | SvelteKit standard, compiles .md to Svelte components, future component embedding |
| Content lanes | Professional (default) + Personal | Brand-first; personal interests are secondary but accessible |
| Routes | `/blog` (pro), `/blog/personal`, `/blog/[slug]` | Clean URL separation between lanes |
| i18n | `lang` field per post (en/fr/es) | No translation needed — write natively in one language per post |
| SVG illustrations | Per-post, stored alongside .md | Each post can have a custom illustration that animates |
| SVG fallbacks | 4 professional + 4 personal | Random assignment when no custom SVG provided |
| SVG animation | draw / morph / draw-fill / stagger | Per-post frontmatter field, random if omitted |
| Listing layout | Horizontal rows, full excerpt, sidebar filters | Scannable, filterable by tag |
| Detail layout | Title + Side SVG Icon (option C) | Compact branded header, content-focused below divider |
| Personal Corner vibe | Yellow #FFB627 accent, personal fallback SVGs, tagline | Warmer, "off the clock" feel |
| CMS readiness | Data layer abstracted for Slice 13 | Clean interfaces, no hardcoded content in templates |

## Content Architecture

### File Structure

```
src/content/blog/
├── professional/
│   ├── why-i-left-orm-for-raw-sql/
│   │   ├── index.md
│   │   └── illustration.svg        # optional custom SVG
│   ├── building-a-transit-pipeline/
│   │   ├── index.md
│   │   └── illustration.svg
│   ├── anime-data-viz-challenge/
│   │   └── index.md                 # no SVG = uses fallback
│   ├── lorem-data-warehousing/
│   │   └── index.md
│   └── lorem-etl-patterns/
│       └── index.md
└── personal/
    ├── lorem-transit-future/
    │   ├── index.md
    │   └── illustration.svg
    └── lorem-space-exploration/
        └── index.md

src/lib/assets/blog-fallbacks/
├── pro-database.svg
├── pro-code.svg
├── pro-pipeline.svg
├── pro-chart.svg
├── personal-rocket.svg
├── personal-train.svg
├── personal-telescope.svg
└── personal-globe.svg
```

**Convention:** Slug = folder name. Category = parent directory (`professional/` or `personal/`). Each post is self-contained in its own folder — `.md`, `.svg`, and any future assets (images, diagrams) live together.

### Frontmatter Schema

```yaml
---
title: Why I Left ORM for Raw SQL
excerpt: After years of fighting ORMs, I switched to raw SQL and never looked back.
date: 2026-04-01
lang: en                    # en | fr | es
category: professional      # professional | personal (derived from folder, but explicit in frontmatter too)
tags: [sql, postgresql, opinion]
animation: draw             # draw | morph | draw-fill | stagger (random if omitted)
svg: illustration.svg       # filename in same folder (fallback if omitted)
external: false             # true = links to external URL instead of detail page
url:                        # only used if external: true
---
```

### BlogPost Type Updates

```typescript
interface BlogPost {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  date: string;                          // ISO YYYY-MM-DD
  lang: 'en' | 'fr' | 'es';
  category: 'professional' | 'personal';
  tags: string[];
  animation: 'draw' | 'morph' | 'draw-fill' | 'stagger';
  svg: string;                           // resolved path to SVG (custom or fallback)
  url: string;
  external: boolean;
}
```

## Routes

| Route | Purpose | Load Function |
|-------|---------|---------------|
| `/blog` | Professional listing with sidebar filters | Load all professional posts, extract all tags |
| `/blog/personal` | Personal Corner listing with sidebar filters | Load all personal posts, extract all tags |
| `/blog/[slug]` | Post detail (both categories) | Load single post by slug, resolve SVG, render markdown |

### Route Files

```
src/routes/blog/
├── +page.svelte              # Professional listing
├── +page.ts                  # Load professional posts + tags
├── personal/
│   ├── +page.svelte          # Personal Corner listing
│   └── +page.ts              # Load personal posts + tags
└── [slug]/
    ├── +page.svelte          # Post detail
    └── +page.ts              # Load single post + content + SVG
```

## Listing Page Design

### Desktop Layout
- **Left sidebar** (~140px): tag filter pills (vertical stack), dashed divider, "Personal Corner" link at bottom
- **Main content**: page heading "Dispatches" + subtitle, horizontal post rows
- Active tag filter highlighted with `#E07800` fill
- "Personal Corner" link uses `#FFB627` border + text

### Mobile Layout
- **Collapsible filter menu**: "Filters" button toggles a dropdown panel
- Tags displayed as horizontal wrapping pills inside the panel
- "Personal Corner" is the **last item** in the toggled menu, below a dashed divider
- Post rows stack vertically below

### Post Row (both viewports)
- SVG icon (48px desktop, 36px mobile) in dark container, left-aligned
- Title (semibold, white)
- Full excerpt (muted text)
- Tags as monospace pills + date on the right
- Hover: border shifts to `#E07800` (professional) or `#FFB627` (personal)
- `use:boop` scale on hover
- `use:reveal` stagger on scroll

### Personal Corner Listing
- Same layout structure as professional
- Heading: "Personal Corner"
- Subtitle: "Trains, space, and things I think about" (in `#FFB627`)
- Accent color throughout: `#FFB627` instead of `#E07800`
- Different fallback SVGs (rocket, train, telescope, globe)
- "Back to Professional" link where "Personal Corner" link would be

### Tag Filtering
- Tags are extracted from all posts in the current category
- Clicking a tag filters the listing to posts with that tag
- "All" shows everything (default active state)
- Client-side filtering (no page reload) — Svelte reactivity
- Filtered state reflected in URL via query param: `/blog?tag=sql`

## Detail Page Design

### Header Section
- Back link: `← back to dispatches` (or `← back to personal corner`) — `use:boop` hover
- **Flex row**: title + meta on the left, animated SVG icon (72px) on the right
- Title: large heading, white
- Below title: tag pills + date + lang badge (monospace)
- **Gradient divider**: `linear-gradient(90deg, #E07800, #2a2a2a)` (or `#FFB627` for personal)

### Content Body
- Max-width prose container (~65ch line width)
- Rendered via mdsvex — markdown compiled to Svelte components

### Markdown Typography
- **Headings**: brand font (Inter), proper hierarchy, white
- **Paragraphs**: `#ccc`, 1.8 line-height, comfortable spacing
- **Code blocks (fenced)**: `#141414` bg, `1px solid #2a2a2a` border, JetBrains Mono, `#E07800` text. Subtle slide-up entrance animation.
- **Inline code**: same monospace, subtle background
- **Blockquotes**: `3px solid #E07800` left border, `#141414` bg, italic
- **Lists**: proper indentation, bullet/number styling
- **Links**: `#E07800` color, underline on hover
- **Bold**: `#f5f5f0` (white, stands out from `#ccc` body)

## SVG Illustration System

### Custom SVGs
- Live in the post folder as `illustration.svg`
- Must be simple paths (no raster, no complex gradients)
- Use brand colors: `#E07800`, `#FFB627`, `#C96A00`, `#f5f5f0`

### Fallback SVGs
- 4 professional: database, code brackets, pipeline/flow, chart/bars
- 4 personal: rocket, train, telescope, globe
- Stored in `src/lib/assets/blog-fallbacks/`
- Deterministic random assignment based on slug hash (same post always gets same fallback)

### Animation Types
| Type | Plugin | Description |
|------|--------|-------------|
| `draw` | DrawSVGPlugin | Paths draw stroke-by-stroke |
| `morph` | MorphSVGPlugin | Circle morphs into illustration |
| `draw-fill` | DrawSVGPlugin + tween | Paths draw then fill with color wash |
| `stagger` | gsap.from + stagger | Pieces fly in one by one |

### Animation Behavior
- **Listing page**: SVG animates on scroll-reveal (ScrollTrigger, plays once)
- **Detail page**: SVG animates on page entrance (plays once on load)
- All animations respect `prefers-reduced-motion` (static SVG shown instead)

## Animation Plan

### Listing Page
- Cards stagger-reveal on scroll (`use:reveal` with stagger timing)
- SVG icons animate on their card's scroll-reveal
- Card hover: border color transition + `use:boop` scale
- Filter transitions: Svelte `{#each}` with `animate:flip` for smooth reordering

### Detail Page
- SVG icon plays entrance animation on page load
- Title + meta fade in from left (GSAP fromTo)
- Gradient divider draws on (DrawSVGPlugin or CSS animation)
- Content sections reveal on scroll
- Code blocks subtle slide-up entrance
- Back link: `use:boop` hover

## Data Layer Design (CMS-Ready for Slice 13)

### Abstraction Principle
All blog data access goes through functions in `blog.ts`. Components never read files directly. When Slice 13 swaps the data source (CMS, Notion, etc.), only `blog.ts` changes — zero component changes.

### Functions

```typescript
// Get posts by category, sorted by date descending
getPostsByCategory(category: 'professional' | 'personal'): BlogPost[]

// Get single post with rendered content + SVG path
getPostBySlug(slug: string): { post: BlogPost; content: string; svgPath: string } | undefined

// Get all unique tags for a category
getTagsForCategory(category: 'professional' | 'personal'): string[]

// Get posts filtered by tag within a category
getPostsByTag(category: 'professional' | 'personal', tag: string): BlogPost[]

// Existing: still works for home page BlogFeed
getLatestPosts(count: number): BlogPost[]
```

### SVG Resolution

```typescript
// Resolves SVG for a post: custom → fallback (deterministic random)
resolveSvg(post: BlogPost): string
```

Deterministic fallback: hash the slug, mod by 4, pick from the category's fallback array. Same slug always gets the same fallback.

### Animation Resolution

```typescript
// Resolves animation type: explicit → random (deterministic)
resolveAnimation(post: BlogPost): 'draw' | 'morph' | 'draw-fill' | 'stagger'
```

Same deterministic approach as SVG fallback.

## Components

### New Components
| Component | Purpose | Reusable? |
|-----------|---------|-----------|
| `BlogListingPage` | Shared layout for professional + personal listings | Yes (parameterized by category) |
| `BlogFilterSidebar` | Tag filters + Personal Corner link | Yes |
| `BlogFilterMobile` | Mobile collapsible filter menu | Yes |
| `BlogRow` | Single post row in listing (SVG + title + excerpt + tags) | Yes |
| `BlogDetailHeader` | Title + side SVG + meta + gradient divider | Yes |
| `BlogSvgIcon` | Renders + animates an SVG illustration | Yes |
| `BlogContent` | Styled markdown content wrapper | Yes |

### Existing Components (modified)
| Component | Change |
|-----------|--------|
| `BlogCard` | Keep for home page `BlogFeed` — no changes |
| `BlogFeed` | Keep for home page — no changes |
| `Nav` | Add "Blog" link |

### Componentization Rules
- `BlogListingPage` is one component used by BOTH `/blog` and `/blog/personal` — parameterized by `category`, `accentColor`, `heading`, `subtitle`
- `BlogRow` receives a `BlogPost` + accent color — no category logic inside
- `BlogSvgIcon` receives SVG path + animation type — handles all 4 animation variants
- `BlogFilterSidebar` and `BlogFilterMobile` receive tags array + active tag + personal corner link config
- All components are category-agnostic — they render what they're given

## Placeholder Content

7 total posts (5 professional + 2 personal), all using lorem ipsum body text:

### Migration: Existing Posts
The 3 existing flat files in `src/content/blog/*.md` must be migrated to the new folder structure:
- `why-i-left-orm-for-raw-sql.md` → `professional/why-i-left-orm-for-raw-sql/index.md`
- `building-a-transit-pipeline.md` → `professional/building-a-transit-pipeline/index.md`
- `anime-data-viz-challenge.md` → `professional/anime-data-viz-challenge/index.md`

Add `lang`, `category`, and `animation` fields to their frontmatter. Delete the original flat files after migration.

### Professional (5)
1. `why-i-left-orm-for-raw-sql` — migrated, keep content
2. `building-a-transit-pipeline` — migrated, keep content
3. `anime-data-viz-challenge` — migrated, keep content
4. `lorem-data-warehousing` — new, lorem ipsum, tags: [sql, warehousing]
5. `lorem-etl-patterns` — new, lorem ipsum, tags: [pipeline, etl]

### Personal (2)
6. `lorem-transit-future` — new, lorem ipsum, tags: [transit, infrastructure]
7. `lorem-space-exploration` — new, lorem ipsum, tags: [space, exploration]

All lorem posts exercise markdown features: headings, code blocks, lists, blockquotes, bold, links, images.

## Nav Update

Add "Blog" to the main navigation. Position: after existing links, before any CTA. Links to `/blog`.

## Out of Scope

- Syntax highlighting (code blocks are monospace + brand color, no language-specific coloring)
- Table of contents / sidebar navigation on detail page
- Pagination on listing page
- RSS feed
- Comments / reactions
- Social sharing buttons
- SEO meta tags (Slice 10)
- Search on blog listing (filtering by tag is in scope)
- Real blog content (lorem ipsum only for new posts)
- Cross-posting to LinkedIn
- CMS integration (Slice 13 — but data layer is designed for it)

## Acceptance Criteria

- [ ] `/blog` renders professional posts with sidebar tag filters
- [ ] `/blog/personal` renders personal posts with warmer yellow accent
- [ ] `/blog/[slug]` renders full markdown with title + side SVG icon layout
- [ ] Per-post folders: `blog/professional/slug/index.md` + optional `illustration.svg`
- [ ] Frontmatter supports: title, excerpt, date, lang, category, tags, animation, svg, external
- [ ] Tag filtering works client-side (click tag → posts filter, URL updates)
- [ ] Mobile: collapsible filter menu with Personal Corner as last item
- [ ] SVG illustrations animate (draw/morph/draw-fill/stagger) on scroll (listing) and load (detail)
- [ ] Fallback SVGs assigned deterministically when no custom SVG provided
- [ ] Animation type assigned deterministically when not specified
- [ ] Markdown renders: headings, paragraphs, code blocks, inline code, bold, italic, lists, links, blockquotes
- [ ] Code blocks styled with JetBrains Mono, dark bg, brand orange text
- [ ] At least 7 blog posts (5 professional + 2 personal)
- [ ] Nav includes "Blog" link
- [ ] Back link on detail page returns to correct listing (professional or personal)
- [ ] External posts still open externally
- [ ] 404 handling for nonexistent slugs
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Responsive: works on mobile + desktop
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Data layer functions abstracted for future CMS swap (Slice 13)

## Verify

1. `bun run dev` → navigate to `/blog`
2. Confirm professional posts listed with sidebar filters
3. Click a tag → posts filter, URL updates to `/blog?tag=sql`
4. Click "Personal Corner" in sidebar → navigates to `/blog/personal` with yellow accent
5. Click a post → detail page with title + side SVG animation + rendered markdown
6. Confirm code blocks, blockquotes, headings all styled correctly
7. Click "back to dispatches" → returns to listing
8. Try `/blog/nonexistent` → 404
9. Test on mobile: filter menu collapses, Personal Corner is last filter item
10. `bun run test` — all pass
11. `bun run check` — no type errors
