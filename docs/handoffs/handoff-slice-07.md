# Handoff: Slice 07 — Blog System

## Summary
Full blog system with two content lanes (professional and personal), SVG illustrations with GSAP MorphSVGPlugin hover morphs, client-side search, and tag/date-range/language filtering. Professional posts live at `/blog`, personal posts at `/blog/personal`, and individual posts at `/blog/[slug]`. Markdown content is parsed from frontmatter at build time and rendered to HTML via `marked`.

## What Was Built
- `src/routes/blog/+page.svelte`: Professional blog listing page
- `src/routes/blog/+page.ts`: Data loader for professional posts (filters by category, resolves SVG contents)
- `src/routes/blog/personal/+page.svelte`: Personal Corner listing page (yellow accent)
- `src/routes/blog/personal/+page.ts`: Data loader for personal posts
- `src/routes/blog/[slug]/+page.svelte`: Blog post detail page with centered layout
- `src/routes/blog/[slug]/+page.ts`: Detail page loader (resolves post + SVG + rendered HTML)
- `src/lib/components/BlogListingPage.svelte`: Shared listing page component (search, filters, tag sidebar, date range, language selector, corner link)
- `src/lib/components/BlogRow.svelte`: Individual post row for listings (SVG icon, title, excerpt, tags, date)
- `src/lib/components/BlogFilterSidebar.svelte`: Desktop sidebar with tag filter chips
- `src/lib/components/BlogFilterMobile.svelte`: Mobile-friendly filter controls
- `src/lib/components/BlogDetailHeader.svelte`: Post detail header (title, date, tags, SVG icon)
- `src/lib/components/BlogContent.svelte`: Rendered markdown content with typography styles
- `src/lib/components/BlogSvgIcon.svelte`: SVG illustration renderer with GSAP entrance animations (draw, morph, draw-fill, stagger) and MorphSVGPlugin hover morphs to geometric shapes
- `src/content/blog/professional/why-i-left-orm-for-raw-sql/index.md`: Real post
- `src/content/blog/professional/building-a-transit-pipeline/index.md`: Real post
- `src/content/blog/professional/anime-data-viz-challenge/index.md`: Real post
- `src/content/blog/professional/lorem-data-warehousing/index.md`: Lorem placeholder post
- `src/content/blog/professional/lorem-etl-patterns/index.md`: Lorem placeholder post
- `src/content/blog/personal/lorem-transit-future/index.md`: Lorem placeholder post
- `src/content/blog/personal/lorem-space-exploration/index.md`: Lorem placeholder post
- `src/content/blog/_template.md`: Template for creating new posts with all frontmatter fields

## Files Modified
- `src/lib/data/blog.ts`: Added frontmatter parser, markdown rendering via `marked`, SVG content resolver, helper functions (getPostsByCategory, getTagsForCategory, getLanguagesForCategory, getSvgContent, getSvgContentsForPosts, resolveAnimation, resolveSvgFallbackName)
- `src/lib/data/types.ts`: Added `BlogPost`, `BlogCategory`, `BlogAnimation` types
- `src/lib/data/index.ts`: Added blog exports to barrel file
- `src/lib/components/Nav.svelte`: Blog link verified in nav links array (already present from Slice 06d)
- `svelte.config.js`: Added mdsvex preprocessor and `.md` extension for SvelteKit to process markdown files

## How It Works

### Data Flow
1. **Markdown files** live in `src/content/blog/{category}/{slug}/index.md` with YAML frontmatter
2. **Build time**: `import.meta.glob('../../content/blog/**/*.md', { as: 'raw', eager: true })` loads all markdown as raw strings
3. **`parseFrontmatter()`** extracts metadata (title, date, tags, lang, category, animation, svg path)
4. **`BlogPost[]`** objects are created with resolved fields — slug derived from folder name, SVG path resolved with fallback
5. **Route loaders** (`+page.ts`) filter posts by category, resolve SVG contents, and pass to page components
6. **`marked`** renders markdown body to HTML on the detail page
7. **Components** render the data: `BlogListingPage` for listings, `BlogDetailHeader` + `BlogContent` for detail

### SVG Illustrations
- Each post can specify a custom SVG in frontmatter (`svg: my-icon`)
- If no custom SVG exists, `resolveSvgFallbackName(slug)` picks a deterministic fallback based on slug hash
- `BlogSvgIcon` renders the SVG and applies a GSAP entrance animation (one of 4 types)
- On hover, all SVG paths morph into a random geometric shape (triangle/circle/square/hexagon) via MorphSVGPlugin, then morph back on leave

### Two Content Lanes
- **Professional** (`/blog`): Orange accent (#E07800), data/SQL/infrastructure posts
- **Personal** (`/blog/personal`): Yellow accent (#FFB627), personal interests (trains, space, etc.)
- Each lane has a link to the other ("Personal Corner" / "Back to Professional")
- `BlogListingPage` is fully reusable — configured via props

### Filtering
- **Search**: Matches against title and excerpt (case-insensitive)
- **Tags**: Sidebar chip filter (click to toggle, supports multiple)
- **Date range**: Start/end date inputs filter by post date
- **Language**: Dropdown filters by post `lang` field (en/fr/es)
- All filters are client-side — dataset is small enough that server round-trips are unnecessary

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| `marked` for HTML rendering | mdsvex had issues with `<` characters in inline code/content, causing parse errors | mdsvex for both preprocessing and rendering (rejected due to content parsing bugs) |
| Per-post folders (`category/slug/index.md`) | Allows co-located assets (images, diagrams) per post in the future | Flat files (`category/slug.md`) — no room for co-located assets |
| Deterministic SVG fallback from slug hash | Every post always gets the same illustration, even without explicit SVG assignment | Random fallback (inconsistent across builds), no fallback (empty space) |
| MorphSVGPlugin for hover effects | Already loaded from Slice B+ — reuses the plugin for a delightful micro-interaction | CSS transforms only (less interesting), no hover effect (missed opportunity) |
| Client-side filtering | 7 posts total — no benefit to server-side filtering | SvelteKit form actions with server-side filtering (overkill for small dataset) |
| Shared `BlogListingPage` component | Avoids duplicating search/filter logic between professional and personal lanes | Separate listing components per lane (code duplication) |
| mdsvex in svelte.config.js | SvelteKit needs the preprocessor to recognize `.md` files as valid page/component inputs | Only using `marked` (wouldn't integrate with SvelteKit's file-based routing for .md) |

## What Yesid Should Know

### How to Create a New Blog Post
1. Copy `src/content/blog/_template.md` to `src/content/blog/{category}/{your-slug}/index.md`
   - `category` is either `professional` or `personal`
   - `your-slug` should be URL-safe (lowercase, hyphens, no spaces)
2. Fill in the frontmatter fields:
   - `title`: Post title
   - `date`: YYYY-MM-DD format
   - `excerpt`: Short description for listing cards
   - `tags`: Comma-separated list in brackets, e.g. `[sql, postgresql, optimization]`
   - `lang`: `en`, `fr`, or `es`
   - `category`: `professional` or `personal`
   - `animation`: One of `draw`, `morph`, `draw-fill`, `stagger` (controls SVG entrance effect)
   - `svg`: Optional custom SVG name (omit for automatic fallback)
3. Write your content in markdown below the `---` frontmatter block
4. The post will appear automatically on the correct listing page after rebuild

### Key Concepts
- **`import.meta.glob`**: Vite feature that loads files matching a glob pattern at build time. No database, no CMS — just files on disk compiled into the bundle.
- **`marked`**: Lightweight markdown-to-HTML library. Simpler than mdsvex for content rendering, especially when content has special characters.
- **MorphSVGPlugin**: Converts any SVG element to a `<path>` then smoothly interpolates between two path definitions. Hover morphs work by saving original paths, morphing to a geometric target, then morphing back.

## What Comes Next
**Slice 08 — Work Pages** (index + FLIP filter + detail). The `/work` route needs a project grid with animated tag filtering and individual project detail pages at `/work/[slug]`.

## How to Verify
1. Navigate to `/blog` — see professional posts listed with SVG icons, search bar, and tag filters
2. Click "Personal Corner" — navigate to `/blog/personal` with yellow accent and personal posts
3. Click "Back to Professional" — return to `/blog`
4. Use search to filter posts by title/excerpt
5. Click tag chips to filter by tag
6. Use date range inputs to filter by date
7. Use language dropdown to filter by language
8. Hover over SVG icons — they morph into geometric shapes and morph back
9. Click a post — navigate to `/blog/[slug]` with centered detail layout, header with SVG, and rendered markdown content
10. Tap SVG icons on mobile — tap toggles the morph effect

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Listing page without SVG illustrations | Added BlogSvgIcon with per-post SVG rendering | `BlogRow.svelte`, `BlogSvgIcon.svelte`, `blog.ts` |
| 2 | SVGs need animation | Added GSAP entrance animations (draw, morph, draw-fill, stagger) | `BlogSvgIcon.svelte` |
| 3 | Hover effect needed | Added MorphSVGPlugin morph-to-shape on hover | `BlogSvgIcon.svelte` |
| 4 | Need search and filters | Added search, tag/date/language filters to listing | `BlogListingPage.svelte`, `BlogFilterSidebar.svelte`, `BlogFilterMobile.svelte` |
| 5 | SVG tap toggle for mobile | Added tap-to-toggle morph behavior for touch devices | `BlogSvgIcon.svelte` |
| 6 | Detail page content not centered | Applied max-w-2xl centered layout to detail page | `+page.svelte` (blog/[slug]) |
| Final | Approved | — | — |
