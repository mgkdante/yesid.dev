# Slice 07 — Blog System

**Status:** ready
**Priority:** 1
**Estimated effort:** 1-2 sessions
**Depends on:** 06d

## Objective

Build `/blog` listing page and `/blog/[slug]` detail pages so blog posts written in markdown render as full pages on the site.

## Context

The data layer already exists: `src/lib/data/blog.ts` reads markdown files from `src/content/blog/` via `import.meta.glob`, parses YAML frontmatter, and exposes `getLatestPosts()` / `getPostBySlug()`. The home page already shows the 3 latest posts via `BlogFeed` + `BlogCard`. What's missing: the actual routes, full markdown rendering on detail pages, and enough placeholder content to fill out the design.

Use **lorem ipsum / generic placeholder text** for all blog post content. Yesid will write real posts later. The 3 existing posts can stay but should not block the build — their content is secondary to the page structure.

## Acceptance Criteria

- [ ] `/blog` route renders a listing page showing ALL blog posts (not just 3)
- [ ] Posts on `/blog` are sorted by date descending (newest first)
- [ ] Each post card on `/blog` links to `/blog/[slug]`
- [ ] `/blog/[slug]` route renders the full markdown content of a post as styled HTML
- [ ] Blog detail page shows: title, date, tags, full rendered markdown body, back link to `/blog`
- [ ] Markdown rendering supports: headings, paragraphs, code blocks (inline + fenced), bold, italic, lists, links, blockquotes
- [ ] At least **5 total blog posts** exist in `src/content/blog/` (add 2+ lorem ipsum posts to the existing 3)
- [ ] Blog listing page has the metro aesthetic (dark bg, orange accents, monospace dates) consistent with the rest of the site
- [ ] Blog detail page has readable typography: comfortable line length, proper spacing between elements
- [ ] Both pages are responsive (mobile + desktop)
- [ ] Nav includes a "Blog" link that navigates to `/blog`
- [ ] Visiting `/blog/nonexistent-slug` shows a 404 or redirects gracefully
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Blog posts with `external: true` still open externally (not broken by new routes)

## Technical Spec

### New files to create

| File | Purpose |
|------|---------|
| `src/routes/blog/+page.svelte` | Blog listing page |
| `src/routes/blog/+page.ts` | Load function for listing (passes all posts) |
| `src/routes/blog/[slug]/+page.svelte` | Blog detail page |
| `src/routes/blog/[slug]/+page.ts` | Load function for detail (passes single post + rendered content) |
| `src/content/blog/lorem-data-warehousing.md` | Placeholder post (lorem ipsum) |
| `src/content/blog/lorem-etl-patterns.md` | Placeholder post (lorem ipsum) |

### Files to modify

| File | Change |
|------|--------|
| `src/lib/data/blog.ts` | Export raw markdown content alongside metadata (the `content` from `parseFrontmatter` is already parsed but not exposed). Add a function like `getPostContent(slug): string \| undefined` |
| `src/lib/components/Nav.svelte` (or equivalent nav component) | Add "Blog" link to navigation |

### Markdown rendering

For rendering markdown to HTML on the detail page, use one of:
- **mdsvex** — if it integrates cleanly with the existing SvelteKit build
- **marked** or **markdown-it** — lighter alternative, render at build/load time and inject as `{@html}`

The choice is left to implementation. The key requirement: fenced code blocks must render with a `<pre><code>` structure suitable for styling (syntax highlighting is NOT required in this slice but the structure should support it later).

### Placeholder posts

Add 2+ new markdown files to `src/content/blog/` with:
- Valid YAML frontmatter matching the existing format (title, excerpt, date, tags, external: false)
- Lorem ipsum body content that exercises all supported markdown features (headings, lists, code blocks, bold, links, blockquotes)
- Dates spread across different months so the listing looks realistic

### Blog listing page design

- Full-width dark background, max-w-5xl centered content (consistent with home page)
- Page heading: "Blog" or "Dispatches" (metro themed)
- Posts rendered as cards (reuse or extend `BlogCard` component)
- Show all posts, not paginated (pagination is out of scope)
- Stagger entrance animation via `use:reveal` (consistent with other sections)

### Blog detail page design

- Max-width prose container (~65ch) for comfortable reading
- Title as large heading
- Date + tags displayed below title
- Rendered markdown body with styled typography:
  - Headings: brand font, proper hierarchy
  - Code blocks: dark bg, monospace (JetBrains Mono), subtle border
  - Links: orange brand color
  - Blockquotes: left border in brand orange
- "Back to blog" link at top or bottom
- No sidebar, no table of contents (out of scope)

### BlogPost type update

The `BlogPost` interface in `types.ts` may need a `content` field (raw markdown string) or this can be handled separately via the `getPostContent()` function. Either approach is fine — keep it clean.

## Out of Scope

- Syntax highlighting (code blocks render as plain monospace text)
- Table of contents / sidebar navigation
- Pagination on listing page
- RSS feed
- Comments / reactions
- Social sharing buttons
- SEO meta tags (Slice 10)
- Search / filtering on blog listing
- Writing real blog content (lorem ipsum only)
- Cross-posting to LinkedIn
- Tag filtering page (`/blog/tag/[tag]`)

## Learn

### SvelteKit Dynamic Routes
**What it is:** `[slug]` in a route folder name creates a dynamic segment. SvelteKit extracts the value from the URL and passes it to the load function via `params.slug`.
**Why it matters:** Think of it like a parameterized SQL query — `SELECT * FROM posts WHERE slug = $1`. The route is the query template, the slug is the parameter.
**Try this:** After the slice, visit `/blog/why-i-left-orm-for-raw-sql` and check the network tab to see how SvelteKit resolves it.
**Go deeper:** https://svelte.dev/docs/kit/routing#Layout-pages

### Markdown to HTML Rendering
**What it is:** Markdown is a lightweight text format (like this spec). A renderer converts it to HTML elements that the browser can display and CSS can style.
**Why it matters:** It's similar to how a SQL view transforms raw data into a readable format — the markdown is the raw data, the renderer is the view, and the styled HTML is the output.
**Try this:** Edit one of the lorem ipsum posts, add a new heading or code block, and watch it appear on the detail page.
**Go deeper:** https://mdsvex.pngwn.io/docs (if mdsvex is chosen)

## Verify

1. Run `bun run dev` and navigate to `http://localhost:5173/blog`
2. Confirm all 5+ posts appear, sorted newest first
3. Click any post — confirm the full markdown body renders with proper styling
4. Check code blocks, headings, lists, links, blockquotes all render correctly
5. Click "Back to blog" — returns to listing
6. Try `/blog/nonexistent` — should 404 or handle gracefully
7. Check on mobile viewport — responsive layout works
8. Run `bun run test` — all pass
9. Run `bun run check` — no type errors
