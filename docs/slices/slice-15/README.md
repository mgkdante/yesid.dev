# Slice 15 — SEO + Metadata: Maximum Discoverability

**Level 1 direction doc.**

**Status:** in progress (15a shipped, 15b next, 15c deferred post-Payload)
**Depends on:** 13, 17a, 17b (all shipped)
**Est. Sessions:** 1–2 per sub-slice

## Sub-slice status

| Sub-slice | Status | PR | Scope |
|-----------|--------|----|-------|
| 15a | ✅ shipped 2026-04-20 | #26 | Meta + OG + Twitter + canonical + sitemap + robots + build gate + locale-aware OG image |
| 15b | planned next | — | JSON-LD structured data (Person, WebSite, BlogPosting, Service, BreadcrumbList, ProfilePage) |
| 15c | deferred (post-Slice 18) | — | Per-post / per-project Satori OG image generation |

## Goal

Make yesid.dev maximally discoverable. Every public route ships with proper meta tags, Open Graph, Twitter Cards, JSON-LD structured data, canonical URLs, sitemap.xml, and robots.txt. Pages render correctly when shared on LinkedIn / Twitter / Slack / Discord / iMessage.

## Why this matters more than most devs think

90% of portfolio sites have zero structured data, broken OG tags, and no sitemap. Recruiters and clients Google "data engineer Montreal" or "SQL developer transit pipeline" and get LinkedIn results because nobody's portfolio is optimized. This slice makes yesid.dev the result that shows up WITH a rich card, author photo, and site links. It also makes every blog post, project, and service page individually discoverable, not just the home page.

## 5 Layers of SEO

1. **Page-Level Meta Tags** — Every route gets: `<title>`, `<meta name="description">`, canonical URL, `robots` directive. Titles follow the pattern `Page Name | yesid.` (brand-consistent, under 60 chars). Descriptions are unique per page, 150-160 chars, written for humans not keyword stuffing. All pulled from data layer via a shared `<SeoHead>` component that every +layout.svelte or +page.svelte uses.
2. **Open Graph + Twitter Cards** — Every page gets: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`. Twitter equivalents: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`. OG images: generate a branded default (orange wordmark on dark bg, 1200x630). Blog posts and projects can override with custom OG images. Service pages use a shared branded template.
3. **Structured Data (JSON-LD)** — The differentiator. Most portfolios skip this entirely. Add:
   - **Person** schema on home/about: name, jobTitle ("Data Infrastructure Engineer"), url, sameAs (LinkedIn, GitHub), knowsAbout (SQL, Python, PostgreSQL, etc.), worksFor, address (Montreal, QC)
   - **WebSite** schema on home: name, url, description, author
   - **BlogPosting** schema on each blog post: headline, datePublished, author, description, image, articleSection
   - **Service** schema on each service page: name, description, provider (Person), areaServed
   - **BreadcrumbList** schema on all subpages: structured navigation path (Home > Work > STM Transit Pipeline)
   - **ProfilePage** schema on about page (new schema type Google supports for personal sites)
4. **Technical SEO**
   - `sitemap.xml` auto-generated at build time from all public routes (home, blog/*, work/*, services/*, about, contact). Use `@sveltejs/kit` prerender entries or a custom build script.
   - `robots.txt` with sitemap reference, allow all public routes, block /preview and /admin (Payload, added in Slice 18)
   - Canonical URLs on every page (prevents duplicate content from trailing slashes or query params)
   - `<link rel="alternate" hreflang="en">` tags ready for i18n (structure only, fr/es pages come later)
   - Performance meta: proper `<meta name="viewport">`, `theme-color` (#141414), `color-scheme: dark`
5. **Social Preview Testing** — Verify every page type renders correctly when shared on LinkedIn, Twitter/X, Slack, Discord, iMessage. This is how recruiters first see the site. A broken preview = invisible. Test with: opengraph.xyz, Twitter Card Validator, LinkedIn Post Inspector.

## Shared Component

```
<SeoHead
  title="STM Transit Pipeline | yesid."
  description="Near-real-time GTFS analytics..."
  ogImage="/og/stm-transit-pipeline.png"
  type="article"
  canonical="https://yesid.dev/work/stm-transit-pipeline"
  jsonLd={blogPostingSchema}
/>
```

Every page passes its specific data. The component renders all `<svelte:head>` tags. One place to maintain, every page covered.

## OG Image Strategy

- Default branded image: wordmark + tagline on dark bg (1200x630) for pages without custom images
- Blog posts: auto-generate OG images at build time using satori or a canvas script (title + date + brand colors on dark card)
- Projects: screenshot or custom graphic per project (manual, added as content)
- If auto-generation is too complex for this slice, ship with the default branded image for all pages and add per-page images in a polish pass

## Locale-Aware Meta

- `og:locale` set to `en_CA` (base)
- `og:locale:alternate` ready for `fr_CA` and `es` when translations ship
- `hreflang` link tags point to self for now, ready to point to locale variants later
- Description meta uses `resolveLocale()` so it serves French descriptions when fr pages exist

## Acceptance Criteria

- Every public route has unique `<title>` and `<meta name="description">`
- Every public route has complete OG tags (title, description, image, url, type)
- Every public route has Twitter Card tags
- JSON-LD Person schema on home and about pages
- JSON-LD BlogPosting schema on every blog post
- JSON-LD Service schema on every service page
- JSON-LD BreadcrumbList on all subpages
- `sitemap.xml` generated at build time, contains all public routes
- `robots.txt` references sitemap, blocks /preview
- Canonical URLs set on every page
- OG image renders correctly when shared (test with opengraph.xyz)
- `bun run build` succeeds with all meta in place
- `bun run test` passes
- Lighthouse SEO score: 100 on all page types

## Out of Scope

- Per-page custom OG image generation (use default branded image, upgrade later)
- Google Search Console setup (do after deploy in Slice 22)
- Analytics (separate concern)
- i18n page variants (structure only, actual translations are future)

## You'll learn

Open Graph protocol, JSON-LD structured data, Schema.org vocabulary, technical SEO (sitemaps, canonical URLs, robots.txt), social preview optimization, `<svelte:head>` patterns in SvelteKit.
