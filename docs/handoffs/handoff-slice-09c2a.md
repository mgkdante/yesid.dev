# Handoff: Slice 09c-2a — Layout Rethink

## Summary
Redesigned blog and work listing/detail layouts for editorial reading (blog) and immersive storytelling (work). Blog gets a metro timeline with featured stop; blog detail drops the card frame for breathing editorial layout with progress bar, heading anchors, and code copy. Work listing switches to full-width stacked cards with gradient banners on a metro line. Work detail kept as-is per Yesid's approval.

## What Was Built
- `src/lib/components/ReadingProgressBar.svelte`: Fixed progress bar at top of viewport, scroll-driven, orange-to-yellow gradient, respects reduced motion, accessible (role=progressbar)
- `src/lib/components/BlogRow.test.ts`: 8 tests for BlogRow featured prop, station badges, metro line

## Files Modified
- `src/lib/components/BlogRow.svelte`: Metro timeline layout with station badge + vertical line, `featured` prop for larger SVG/padding on first post
- `src/lib/components/BlogListingPage.svelte`: Passes `featured={i === 0}` to first BlogRow
- `src/lib/components/BlogContent.svelte`: Removed CollapsibleSection wrapper, widened to 72ch, added heading anchor CSS (::before with #), added code copy button (onMount clipboard injection)
- `src/lib/components/BlogDetailHeader.svelte`: Cleaner typography (unchanged structure, minor styling)
- `src/routes/blog/[slug]/+page.svelte`: Added ReadingProgressBar, removed contentTitle prop
- `src/routes/blog/[slug]/+page.ts`: Strip first h1 from markdown to prevent duplicate title
- `src/lib/components/WorkCard.svelte`: Full-width stacked layout — shorter gradient banner (200px), title below, all content sections stacked vertically
- `src/lib/components/WorkListingPage.svelte`: Metro line + station badges wrapping each card, stagger import for line reveal

## How It Works

**Blog Listing — Hybrid Featured Stop + Timeline:**
The first post in `filteredPosts` (latest by date) gets `featured={true}` — larger SVG (64px), more padding. All posts sit on a vertical metro line with orange station badges (01, 02, 03...). No feature flags — the sort order determines the featured post automatically.

**Blog Detail — Editorial Reading:**
Content no longer wrapped in CollapsibleSection. The `blog-content` div renders at 72ch width. A `ReadingProgressBar` component tracks scroll position of the `[data-testid="blog-content"]` element via rAF + getBoundingClientRect. Heading anchors use CSS `::before` pseudo-elements that slide in on hover. Code copy buttons are injected into `<pre>` elements on mount via DOM manipulation.

**Work Listing — Metro Stacked Cards:**
Each WorkCard is now full-width with a 200px gradient banner (from SERVICE_GRADIENTS), title below, then description/services/stack/tags stacked. The WorkListingPage wraps each card in a flex row with a metro line column (badge + connector). FLIP animation on filter changes still works — cards reorder vertically.

**Work Detail — Unchanged:**
Kept the original sidebar + CollapsibleSection layout per Yesid's preference.

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| No feature flag for featured post | Auto-select latest by date = zero maintenance | Manual frontmatter flag — adds upkeep |
| Strip first h1 from markdown | Markdown body starts with `# Title` duplicating BlogDetailHeader | Remove from markdown files — breaks standalone reading |
| 200px gradient banner (not 120px) | 120px felt too short for visual impact | 280px (original) — too tall for stacked layout |
| Transparent border + accent on hover | Matches work card pattern, no visible border at rest | border-[#2a2a2a] always visible — felt heavy |
| Keep work detail as-is | Yesid tested and preferred original layout | Hero banner + meta strip — felt worse in practice |

## What Yesid Should Know
- **Featured post** is always `filteredPosts[0]` — if you filter by tag, the first result becomes featured. This is intentional.
- **Reading progress bar** only shows when reduced motion is OFF. It's invisible to users who prefer reduced motion.
- **Code copy button** uses `navigator.clipboard.writeText()` which requires HTTPS in production. Localhost works fine.
- **Heading anchors** (#) appear on h2/h3 only, not h1/h4. They're CSS-only (no JS), so they're decorative — clicking doesn't navigate to an anchor yet (that would need JS to generate IDs).
- **Work card gradient** comes from `SERVICE_GRADIENTS` keyed to first related service. New services need an entry there.

## What Comes Next
**Slice 09c-2b — Enhancements** (deferred items):
- ME-1: `cursorGlow` action for pointer-following glow
- ME-3: Animated gradient border on WorkCard hover
- ME-4: `ScrollTrigger.batch()` for listing entrances
- MT-1: Animated metro line drawing (structure in 09c-2a, animation in 09c-2b)
- MT-4: Animated dashed separators (DrawSVGPlugin)

## How to Verify
1. `/blog` — first post has larger SVG + padding, metro line connects all posts
2. `/blog/personal` — same layout, yellow accent
3. `/blog/why-i-left-orm-for-raw-sql` — progress bar at top, no duplicate title, heading anchors on hover, code copy on pre blocks
4. `/work` — full-width stacked cards, gradient banners, metro line, all content visible
5. `/work/transit-data-pipeline` — unchanged from before
6. `/services/sql-development` — unchanged
7. Mobile — all pages responsive
8. `bun run test` — 322 pass
9. `bun run check` — 0 errors

## Iterations

Approved on first test. No iterations needed.
