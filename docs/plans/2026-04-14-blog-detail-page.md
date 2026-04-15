# Blog Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the blog detail page (`/blog/[slug]`) as an infrastructure magazine editorial experience — magazine cover header, SectionWrapper three-column body, TOC left, transit route map right, CSS-styled SVG.

**Architecture:** Reuses the same constitutional three-column pattern as `ProjectDetailPage` — SectionWrapper with `sideLeft` (TOC), content (prose), `sideRight` (route map). Route bypasses ListingLayout via `+page@.svelte`. Shared IntersectionObserver drives both TOC and route map active states. All route map SVG elements styled via CSS classes.

**Tech Stack:** SvelteKit, Svelte 5 runes, GSAP (SplitText, DrawSVGPlugin), Bits UI (Collapsible), Vitest + happy-dom

**Design Spec:** `docs/specs/2026-04-14-blog-detail-page-design.md`
**Mockup (approved):** `docs/reference/mockups/blog-detail-page-full.html`
**Reference implementation:** `src/lib/components/projects/ProjectDetailPage.svelte`

---

## Clean-Slate Approach

**All blog detail components are built from scratch.** The existing `BlogDetailHeader.svelte` is DELETED and rebuilt — not incrementally patched. The route page is rewritten. This avoids inheriting any pre-constitutional patterns, hacky layout hacks, or stale CSS from the old implementation.

## File Map

### Delete (old structure)

| File | Why |
|------|-----|
| `src/routes/blog/[slug]/+page.svelte` | Replaced by `+page@.svelte` (clean rewrite, not rename) |
| `src/lib/components/blog/BlogDetailHeader.svelte` | Fully rebuilt from scratch — old structure is pre-constitutional |

### Create (from scratch)

| File | Responsibility |
|------|---------------|
| `src/routes/blog/[slug]/+page@.svelte` | Clean route page — bypasses ListingLayout, renders BlogDetailPage |
| `src/lib/components/blog/BlogDetailHeader.svelte` | **Rebuilt from scratch.** Magazine cover treatment (circuit grid, watermark, CornerMarks, edge labels, category line, display title, tag pills, GSAP entrance). Zero code carried from old version. |
| `src/lib/components/blog/BlogDetailPage.svelte` | Orchestrator: header + separator + SectionWrapper body (TOC left, prose center, route map right). Owns shared IntersectionObserver. |
| `src/lib/components/blog/BlogRouteMap.svelte` | Transit route diagram SVG for sideRight. Renders stations from heading data. All SVG styled via CSS classes. |
| `src/lib/components/blog/BlogRouteMap.test.ts` | Unit tests: station generation from headings, active state, CSS class application. |
| `src/lib/components/blog/BlogDetailPage.test.ts` | Structure tests: renders header, body sections, correct data-testid attributes. |

### Modify (minimal)

| File | Changes |
|------|---------|
| `src/routes/+layout.svelte:31-34` | Add blog detail pages to `isFullBleed` check. |
| `src/routes/blog/[slug]/+page.ts` | Add `postIndex` to returned data (position in blog list). |

### Reuse (no changes)

| Component | From | Usage |
|-----------|------|-------|
| `SectionWrapper` | `shells/` | Three-column body grid |
| `CornerMarks` | `brand/` | Header corner framing |
| `StickyPanel` | `brand/` | TOC + route map sticky wrappers |
| `CollapsibleSection` | `shared/` | TOC "On this page" wrapper |
| `ManifestoCanvas` | `home/` | Interactive particle canvas in header |
| `Separator` | `ui/` | Hazard stripes |
| `Badge` | `ui/` | Tag pills in header |
| `TableOfContents` | `shared/` | Heading parsing + processed HTML |
| `boop` | `motion/actions` | Back link hover |

---

## Task 1: Route Bypass + Root Layout

**Files:**
- Delete: `src/routes/blog/[slug]/+page.svelte` (old, pre-constitutional)
- Create: `src/routes/blog/[slug]/+page@.svelte` (clean rewrite)
- Modify: `src/routes/blog/[slug]/+page.ts` (add postIndex)
- Modify: `src/routes/+layout.svelte:31-34`

Clean slate. Delete the old route page entirely. Create a fresh `+page@.svelte` that bypasses ListingLayout and renders the new `BlogDetailPage` orchestrator.

- [ ] **Step 1: Delete old route page and create new one**

Delete `src/routes/blog/[slug]/+page.svelte` and create `src/routes/blog/[slug]/+page@.svelte` from scratch. The `@` suffix resets the layout chain, bypassing the blog `+layout.svelte` which wraps everything in `ListingLayout`.

```bash
rm src/routes/blog/\[slug\]/+page.svelte
```

Create `src/routes/blog/[slug]/+page@.svelte` (minimal shell for now — BlogDetailPage created in Task 4):

```svelte
<!--
  Blog detail page — /blog/[slug]
  Renders the BlogDetailPage component with data from the loader.
  Uses +page@.svelte to bypass ListingLayout (same as project detail).
-->
<script lang="ts">
  import BlogDetailHeader from '$lib/components/blog/BlogDetailHeader.svelte';

  let { data } = $props();
</script>

<!-- Temporary: just header until BlogDetailPage is built in Task 4 -->
<article data-testid="blog-detail-page">
  <p>Blog detail page — {data.post.slug}</p>
</article>
```

- [ ] **Step 1b: Add postIndex to the load function**

In `src/routes/blog/[slug]/+page.ts`, add `postIndex`:

```typescript
import { getRecentPosts } from '$lib/data';

// After existing load logic, add:
const allPosts = getRecentPosts(100);
const postIndex = allPosts.findIndex((p) => p.slug === post.slug) + 1;

// Add postIndex to return
return { post, html, svgContent, readingTime, postIndex };
```

- [ ] **Step 2: Add blog detail to isFullBleed check in root layout**

In `src/routes/+layout.svelte`, update the `isFullBleed` derived to include blog detail pages:

```typescript
let isFullBleed = $derived(
  $page.url.pathname === '/' ||
  ($page.url.pathname.startsWith('/projects/') && $page.url.pathname !== '/projects') ||
  ($page.url.pathname.startsWith('/blog/') && $page.url.pathname !== '/blog' && $page.url.pathname !== '/blog/personal')
);
```

This matches: `/blog/why-i-left-orm-for-raw-sql` but NOT `/blog` or `/blog/personal`.

- [ ] **Step 3: Verify build**

```bash
bun run check
```

Expected: 0 errors. The route rename should be transparent — `+page.ts` (the load function) stays the same.

- [ ] **Step 4: Commit**

```bash
git add src/routes/blog/\[slug\]/+page@.svelte src/routes/blog/\[slug\]/+page.ts src/routes/+layout.svelte
git commit -m "refactor(slice-17d-4): blog detail clean slate — bypass ListingLayout via +page@"
```

---

## Task 2: BlogDetailHeader — Rebuild from Scratch

**Files:**
- Delete: `src/lib/components/blog/BlogDetailHeader.svelte` (old pre-constitutional version)
- Create: `src/lib/components/blog/BlogDetailHeader.svelte` (from scratch)

**Clean slate.** Delete the existing `BlogDetailHeader.svelte` entirely — zero code carried forward. Build the magazine cover treatment fresh, using `ProjectDetailHeader.svelte` as the structural reference (extends behind nav, circuit grid, ManifestoCanvas, edge metadata, GSAP entrance).

- [ ] **Step 1: Delete old header and create new one from scratch**

```bash
rm src/lib/components/blog/BlogDetailHeader.svelte
```

Create `src/lib/components/blog/BlogDetailHeader.svelte` from scratch. Key design:

**Props (same interface, expanded):**
```typescript
let {
  post,
  svgContent = '',
  accentColor = 'var(--primary)',
  readingTime = 0,
  postIndex = 1
}: {
  post: BlogPost;
  svgContent?: string;
  accentColor?: string;
  readingTime?: number;
  postIndex?: number;
} = $props();
```

`postIndex` is the post's position in the blog list — used for the "Vol. 01 // Iss. {N}" edge label.

**Structure (inside a containing div):**
1. Circuit grid (`.header__circuit-grid` — CSS background-image, same pattern as `ProjectDetailHeader`)
2. `ManifestoCanvas` (interactive particle canvas, `containerEl={headerEl}`)
3. `SectionWrapper layout="bleed" centerContent`:
   - `{#snippet background()}`:
     - `CornerMarks size="md" opacity={0.12}`
     - Decorative chevrons (top-right, desktop only, same as project detail)
     - Watermark text — `post.category === 'personal' ? 'Personal' : 'Dispatch'`, positioned absolute center, ~160-180px, weight 900, `color-mix(in srgb, var(--blog-accent) 2.5%, transparent)`
     - Edge labels (rotated, desktop only):
       - Left: `VOL. 01 // ISS. {postIndex}`
       - Right: `{formattedDate} // {readingTime} MIN`
   - Content slot:
     - Back link (`<a>` with `use:boop`)
     - Category line with ruled pseudo-element borders: `── Professional ──`
     - `<h1>` — display-size uppercase title with SplitText animation. First tag keyword highlighted in orange using a derived that scans the title text for `post.tags[0]`.
     - Tag pills (Badge components or styled `<span>` elements matching project detail pill style)
     - Meta row: formatted date + reading time + language

**CSS (scoped `<style>`):**
- `.blog-detail-header` — extends behind nav: `margin-top: calc(-1 * var(--nav-height, 64px))`, `padding-top: var(--nav-height, 64px)`, `overflow: hidden`, `background: var(--manifesto, #0f0d0a)`, `cursor: crosshair`
- Circuit grid: same `repeating-linear-gradient` + `radial-gradient` dots as `ProjectDetailHeader`
- Edge labels: `position: absolute`, `transform: rotate(±90deg)`, mono, 10px, letter-spacing 2px
- Title: `font-size: clamp(28px, 6vw, 56px)` on mobile→desktop, uppercase, -0.04em tracking
- Category line: `display: flex; align-items: center; gap: 1rem`, pseudo-elements for ruled lines
- Tag pills: same `.header__pill` styles as `ProjectDetailHeader`
- `--blog-accent` custom property set on the wrapper for accent color propagation

**GSAP entrance (onMount):**
Same timeline pattern as `ProjectDetailHeader`:
1. Circuit grid → opacity 1 (0.6s)
2. Edge labels → opacity 1 (stagger 0.1s) at 0.3s
3. Decorations → opacity 1 (stagger 0.05s) at 0.4s
4. Title SplitText chars (stagger 0.02s, from y:20 + opacity:0) at 0.6s
5. Tag pills → opacity 1, y:0 (stagger 0.1s) at 0.9s
6. Reduced motion guard: `if (isPrefersReducedMotion()) return`

Scope all GSAP selectors: `const q = gsap.utils.selector(headerEl)`

- [ ] **Step 2: Verify build + visual**

```bash
bun run check
```

Start dev server (`bun run dev`), navigate to `/blog/why-i-left-orm-for-raw-sql`. The header should render with magazine cover treatment. Body will still be the old layout (we wire it in Task 4).

Pre-flight visual check:
- Desktop (1440px): Cover header with circuit grid, watermark, corner marks, edge labels, display title, tag pills
- Mobile (375px): Compact header, no edge labels/corners, title smaller

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/blog/BlogDetailHeader.svelte
git commit -m "feat(slice-17d-4): BlogDetailHeader rebuilt from scratch — magazine cover"
```

---

## Task 3: BlogRouteMap Component

**Files:**
- Create: `src/lib/components/blog/BlogRouteMap.svelte`
- Create: `src/lib/components/blog/BlogRouteMap.test.ts`

New component: transit route diagram SVG for the right panel. Derives stations from heading data. All SVG styled via CSS classes — zero inline `fill`/`stroke` attributes.

- [ ] **Step 1: Write BlogRouteMap tests**

Create `src/lib/components/blog/BlogRouteMap.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogRouteMap from './BlogRouteMap.svelte';

const mockHeadings = [
  { id: 'the-breaking-point', text: 'The Breaking Point', level: 2 },
  { id: 'what-i-learned', text: 'What I Learned', level: 2 },
  { id: 'know-your-database', text: 'Know your database', level: 3 },
  { id: 'sql-is-a-dsl', text: 'SQL is already a DSL', level: 3 },
  { id: 'my-stack-now', text: 'My Stack Now', level: 2 },
];

describe('BlogRouteMap', () => {
  it('renders with data-testid', () => {
    const { getByTestId } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: '' },
    });
    expect(getByTestId('blog-route-map')).toBeTruthy();
  });

  it('renders a station for each h2 heading', () => {
    const { container } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: '' },
    });
    const majorStations = container.querySelectorAll('.route-station--major');
    expect(majorStations.length).toBe(3); // 3 h2 headings
  });

  it('renders minor stops for h3 headings', () => {
    const { container } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: '' },
    });
    const minorStations = container.querySelectorAll('.route-station--minor');
    expect(minorStations.length).toBe(2); // 2 h3 headings
  });

  it('applies active class to the current station', () => {
    const { container } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: 'what-i-learned' },
    });
    const activeStations = container.querySelectorAll('.route-station--active');
    expect(activeStations.length).toBe(1);
  });

  it('applies passed class to stations before active', () => {
    const { container } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: 'what-i-learned' },
    });
    const passedStations = container.querySelectorAll('.route-station--passed');
    // "The Breaking Point" is before "What I Learned"
    expect(passedStations.length).toBeGreaterThanOrEqual(1);
  });

  it('uses CSS classes not inline SVG attributes', () => {
    const { container } = render(BlogRouteMap, {
      props: { headings: mockHeadings, activeHeadingId: '' },
    });
    const svg = container.querySelector('svg');
    const allElements = svg?.querySelectorAll('circle, path, text') ?? [];
    for (const el of allElements) {
      expect(el.getAttribute('fill')).toBeNull();
      expect(el.getAttribute('stroke')).toBeNull();
      expect(el.getAttribute('stroke-width')).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
bun run test -- src/lib/components/blog/BlogRouteMap.test.ts
```

Expected: FAIL — `BlogRouteMap.svelte` doesn't exist yet.

- [ ] **Step 3: Implement BlogRouteMap**

Create `src/lib/components/blog/BlogRouteMap.svelte`:

**Props interface:**
```typescript
export interface RouteHeading {
  id: string;
  text: string;
  level: number;
}

export interface BlogRouteMapProps {
  headings: RouteHeading[];
  activeHeadingId: string;
  class?: string;
}
```

**Derived data:**
- `stations` — maps headings to positions along the vertical line. h2 = major station (larger node), h3/h4 = minor stop (smaller node).
- `activeIndex` — index of the active heading in the array.
- For each station: compute `passed` (index < activeIndex), `active` (index === activeIndex), `upcoming` (index > activeIndex).

**SVG structure:**
The component renders an `<svg>` with `viewBox` dynamically calculated from the number of stations. Vertical spacing: ~100px between h2 stations, ~40px between h3 substations.

```svelte
<svg
  class="route-map-svg {className}"
  viewBox="0 0 {svgWidth} {svgHeight}"
  xmlns="http://www.w3.org/2000/svg"
  data-testid="blog-route-map"
  aria-hidden="true"
>
  <!-- Terminus start -->
  <circle class="route-station--terminus" cx={cx} cy={startY} r="7" />

  {#each stations as station, i}
    <!-- Connecting line to this station -->
    <path
      class="route-line"
      class:route-line--active={station.passed || station.active}
      d={computeCurvePath(prevY, station.y)}
    />

    <!-- Station node -->
    <circle
      class="route-station"
      class:route-station--major={station.level === 2}
      class:route-station--minor={station.level > 2}
      class:route-station--active={station.active}
      class:route-station--passed={station.passed}
      cx={cx}
      cy={station.y}
      r={station.level === 2 ? 8 : 4}
    />

    <!-- Station label (h2 only) -->
    {#if station.level === 2}
      <text
        class="route-label-text"
        class:route-label-text--active={station.active}
        x={cx + labelOffset}
        y={station.y + 4}
      >
        {station.text.toUpperCase()}
      </text>
    {/if}
  {/each}

  <!-- Terminus end -->
  <circle class="route-station--terminus" cx={cx} cy={endY} r="5" />
</svg>
```

**Helper function for organic curves** (matches montreal-metro.svg line style):
```typescript
function computeCurvePath(fromY: number, toY: number): string {
  const cx = 60; // center x
  const midY = (fromY + toY) / 2;
  // Gentle S-curve with slight horizontal offset
  const offset = (toY - fromY) > 60 ? 5 : 3;
  return `M${cx} ${fromY} C${cx + offset} ${midY - 10} ${cx - offset} ${midY + 10} ${cx} ${toY}`;
}
```

**CSS (scoped `<style>`):**
All visual properties on CSS classes — matching `montreal-metro.svg` DNA:

```css
.route-line {
  fill: none;
  stroke: var(--blog-accent, var(--primary));
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.15;
  transition: opacity var(--duration-normal) var(--ease-default);
}

.route-line--active {
  opacity: 0.8;
}

.route-station--major {
  fill: var(--blog-accent, var(--primary));
  opacity: 0.25;
  transition: opacity var(--duration-normal) var(--ease-default),
              filter var(--duration-normal) var(--ease-default);
}

.route-station--minor {
  fill: var(--blog-accent, var(--primary));
  opacity: 0.15;
  transition: opacity var(--duration-normal) var(--ease-default);
}

.route-station--active {
  opacity: 1;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--blog-accent, var(--primary)) 40%, transparent));
}

.route-station--passed {
  opacity: 0.6;
}

.route-station--terminus {
  fill: none;
  stroke: var(--blog-accent, var(--primary));
  stroke-width: 2;
  opacity: 0.3;
}

.route-label-text {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  fill: color-mix(in srgb, var(--blog-accent, var(--primary)) 25%, transparent);
}

.route-label-text--active {
  fill: var(--blog-accent, var(--primary));
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .route-line,
  .route-station--major,
  .route-station--minor {
    transition: none;
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
bun run test -- src/lib/components/blog/BlogRouteMap.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Verify build**

```bash
bun run check
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/blog/BlogRouteMap.svelte src/lib/components/blog/BlogRouteMap.test.ts
git commit -m "feat(slice-17d-4): BlogRouteMap — transit route diagram, CSS-styled SVG"
```

---

## Task 4: BlogDetailPage Orchestrator

**Files:**
- Create: `src/lib/components/blog/BlogDetailPage.svelte`
- Modify: `src/routes/blog/[slug]/+page@.svelte`

Orchestrator component that wires header + separator + SectionWrapper body. Owns the shared IntersectionObserver for heading tracking. Same architectural role as `ProjectDetailPage`.

- [ ] **Step 1: Create BlogDetailPage**

Create `src/lib/components/blog/BlogDetailPage.svelte`:

**Props:**
```typescript
import type { BlogPost } from '$lib/data/types.js';

let {
  post,
  html,
  svgContent = '',
  readingTime = 0,
  postIndex = 1
}: {
  post: BlogPost;
  html: string;
  svgContent?: string;
  readingTime?: number;
  postIndex?: number;
} = $props();
```

**Derived:**
```typescript
const accentColor = $derived(
  post.category === 'personal' ? 'var(--accent)' : 'var(--primary)'
);
```

**Heading extraction and observer:**
Use the existing `TableOfContents` component's heading parsing by binding it and calling `getProcessedHtml()`. Also extract headings as a flat list for the route map.

Heading parsing for the route map:
```typescript
interface RouteHeading {
  id: string;
  text: string;
  level: number;
}

// Parse headings from HTML for both TOC and route map
const headings = $derived.by((): RouteHeading[] => {
  if (!browser) return [];
  const result: RouteHeading[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(processedHtml, 'text/html');
  doc.querySelectorAll('h2, h3, h4').forEach((el) => {
    const id = el.id;
    const text = el.textContent?.trim() ?? '';
    const level = parseInt(el.tagName[1]);
    if (id && text) result.push({ id, text, level });
  });
  return result;
});
```

**Shared IntersectionObserver (onMount):**
Same pattern as `ProjectDetailPage` — observes all heading elements, updates `activeHeadingId`. This state is shared with both the TOC (sideLeft) and route map (sideRight).

```typescript
let activeHeadingId = $state('');

onMount(() => {
  const headingEls = document.querySelectorAll('[id^="the-"], [id^="what-"], [id^="my-"], h2[id], h3[id], h4[id]');
  // More robust: query all headings with an id inside the blog content area
  const contentEl = document.querySelector('[data-testid="blog-content"]');
  if (!contentEl) return;
  const observedHeadings = contentEl.querySelectorAll('h2[id], h3[id], h4[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.id) {
          activeHeadingId = entry.target.id;
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  observedHeadings.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
});
```

**Template structure:**
```svelte
<article data-testid="blog-detail-page" style="--blog-accent: {accentColor};">
  <!-- Full-bleed header -->
  <BlogDetailHeader {post} {svgContent} {accentColor} {readingTime} {postIndex} />

  <!-- Edge-to-edge hazard stripes -->
  <Separator variant="hazard" />

  <!-- Mobile: collapsible TOC -->
  <div class="mx-auto mt-6 px-[var(--space-page-x)] xl:hidden" style="max-width: var(--container-content)">
    <TableOfContents html={html} />
  </div>

  <!-- Body: SectionWrapper with TOC left, prose center, route map right -->
  <SectionWrapper
    layout="centered"
    container="none"
    class="detail-body"
    style="--edge-left: 280px; --edge-right: 280px;"
  >
    {#snippet sideLeft()}
      <StickyPanel top="5rem">
        <div class="toc-panel toc-scroll">
          <CollapsibleSection title="On this page" open={true}>
            <!-- Desktop TOC nav using same pattern as ProjectDetailPage -->
            <!-- ... TOC nav items from headings ... -->
          </CollapsibleSection>

          <!-- Mono annotations below TOC -->
          <div class="left-deco">
            <!-- Circuit decorations, annotations, progress -->
          </div>
        </div>
      </StickyPanel>
    {/snippet}

    <!-- Center: prose content -->
    <BlogContent accentColor={accentColor}>
      {@html processedHtml}
    </BlogContent>

    {#snippet sideRight()}
      <StickyPanel top="5rem">
        <div class="route-panel">
          <span class="route-label">Route Map</span>
          <BlogRouteMap {headings} {activeHeadingId} />
          <span class="route-terminus-label">Terminus</span>
        </div>
      </StickyPanel>
    {/snippet}
  </SectionWrapper>
</article>
```

**Scoped CSS:**
- Same TOC styles as `ProjectDetailPage` (`.toc-nav`, `.toc-item`, `.toc-dot`, `.toc-counter`)
- Same `.detail-body` padding as project detail
- `.left-deco` — separator, mono annotations, circuit nodes
- `.route-panel` — centered flex column
- `.route-label` / `.route-terminus-label` — mono, small, uppercase
- `.toc-scroll` — `max-height: calc(100dvh - 14rem); overflow-y: auto`

- [ ] **Step 2: Update the route page to use BlogDetailPage**

Rewrite `src/routes/blog/[slug]/+page@.svelte`:

```svelte
<!--
  Blog detail page — /blog/[slug]
  Renders the BlogDetailPage component with data from the loader.
-->
<script lang="ts">
  import BlogDetailPage from '$lib/components/blog/BlogDetailPage.svelte';

  let { data } = $props();
</script>

<BlogDetailPage
  post={data.post}
  html={data.html}
  svgContent={data.svgContent}
  readingTime={data.readingTime}
/>
```

- [ ] **Step 3: Verify build + visual**

```bash
bun run check
```

Start dev server, navigate to `/blog/why-i-left-orm-for-raw-sql`.

Pre-flight visual check:
- Desktop (1440px): Magazine cover header + hazard stripes + three-column body (TOC left, prose center, route map right)
- Mobile (375px): Compact header + hazard + collapsible TOC + single-column prose
- Both sides collapse below xl: (1024px)
- No horizontal overflow at any width (280px - 2560px)

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/blog/BlogDetailPage.svelte src/routes/blog/\[slug\]/+page@.svelte
git commit -m "feat(slice-17d-4): BlogDetailPage orchestrator — three-column editorial layout"
```

---

## Task 5: TOC Wiring + Left Column Decorations

**Files:**
- Modify: `src/lib/components/blog/BlogDetailPage.svelte`

Wire the TOC nav in sideLeft with active heading tracking, section counter, and circuit decorations below.

- [ ] **Step 1: Wire TOC nav with heading tracking**

In `BlogDetailPage.svelte`, implement the sideLeft content:

**TOC nav** — same structure as `ProjectDetailPage` sideLeft:
- Items from `headings` array
- `class:active={activeHeadingId === heading.id}` on each button
- Orange dot indicator for active item
- Sub-items (h3/h4) indented via inline `padding-left`
- Section counter: `SEC {activeIndex + 1} / {headings.filter(h => h.level === 2).length}`
- `scrollToHeading(id)` function using `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`

**Circuit decorations below TOC** (`.left-deco`):
- Mono annotations: `// filed-under`, `// {post.category}`, `// word-count: {wordCount}`, `// avg-read: {readingTime}m`
- Metro circuit nodes: a small inline SVG or styled divs matching the hero's visual language — orange circles connected by thin lines, styled via CSS classes
- Word count derived from HTML: `html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length`

- [ ] **Step 2: Verify build + visual**

```bash
bun run check
```

Check on dev server:
- TOC tracks active heading on scroll
- Active item shows orange dot + bold text
- Section counter updates
- Circuit decorations render below TOC
- TOC scrolls independently if content is long

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/blog/BlogDetailPage.svelte
git commit -m "feat(slice-17d-4): blog TOC wiring + left column circuit decorations"
```

---

## Task 6: Route Map Entrance Animation

**Files:**
- Modify: `src/lib/components/blog/BlogRouteMap.svelte`

Add GSAP entrance animation: route line draws on, station nodes pop in with stagger.

- [ ] **Step 1: Add DrawSVG / stroke-dashoffset animation**

In `BlogRouteMap.svelte`, add an `onMount` block:

```typescript
onMount(() => {
  if (!browser || isPrefersReducedMotion()) return;
  registerGsapPlugins();

  const svg = document.querySelector('[data-testid="blog-route-map"]');
  if (!svg) return;

  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  // Lines draw on
  tl.from(q('.route-line'), {
    drawSVG: '0%',
    duration: 0.8,
    stagger: 0.05,
  }, 0);

  // Major stations pop in
  tl.from(q('.route-station--major'), {
    scale: 0,
    transformOrigin: 'center center',
    duration: 0.3,
    stagger: 0.1,
  }, 0.4);

  // Minor stations pop in
  tl.from(q('.route-station--minor'), {
    scale: 0,
    transformOrigin: 'center center',
    duration: 0.2,
    stagger: 0.05,
  }, 0.6);

  // Labels fade in
  tl.from(q('.route-label-text'), {
    opacity: 0,
    x: -5,
    duration: 0.3,
    stagger: 0.08,
  }, 0.7);

  // Terminus markers
  tl.from(q('.route-station--terminus'), {
    scale: 0,
    transformOrigin: 'center center',
    duration: 0.3,
  }, 0.3);

  return () => tl.kill();
});
```

- [ ] **Step 2: Verify build + visual**

```bash
bun run check
```

Check on dev server: route map should animate in when the page loads. Verify reduced motion: stations and lines appear at final state immediately.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/blog/BlogRouteMap.svelte
git commit -m "feat(slice-17d-4): route map GSAP entrance — DrawSVG + station stagger"
```

---

## Task 7: BlogDetailPage Tests

**Files:**
- Create: `src/lib/components/blog/BlogDetailPage.test.ts`

Structure tests verifying the orchestrator renders correct components and structure.

- [ ] **Step 1: Write BlogDetailPage tests**

Create `src/lib/components/blog/BlogDetailPage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost } from '$lib/data/types.js';

const mockPost: BlogPost = {
  slug: 'test-post',
  title: { en: 'Test Post Title' },
  excerpt: { en: 'Test excerpt' },
  date: '2026-04-01',
  lang: 'en',
  category: 'professional',
  tags: ['sql', 'postgresql'],
  animation: 'draw',
  svg: '',
  url: '/blog/test-post',
  external: false,
};

const mockHtml = '<h2>Section One</h2><p>Content one</p><h2>Section Two</h2><p>Content two</p>';

describe('BlogDetailPage', () => {
  it('renders with data-testid', () => {
    const { getByTestId } = render(BlogDetailPage, {
      props: { post: mockPost, html: mockHtml },
    });
    expect(getByTestId('blog-detail-page')).toBeTruthy();
  });

  it('renders the blog detail header', () => {
    const { getByTestId } = render(BlogDetailPage, {
      props: { post: mockPost, html: mockHtml },
    });
    expect(getByTestId('blog-detail-header')).toBeTruthy();
  });

  it('renders blog content area', () => {
    const { getByTestId } = render(BlogDetailPage, {
      props: { post: mockPost, html: mockHtml },
    });
    expect(getByTestId('blog-content')).toBeTruthy();
  });

  it('sets --blog-accent custom property for professional posts', () => {
    const { getByTestId } = render(BlogDetailPage, {
      props: { post: mockPost, html: mockHtml },
    });
    const article = getByTestId('blog-detail-page');
    expect(article.style.getPropertyValue('--blog-accent')).toContain('--primary');
  });

  it('sets --blog-accent to accent for personal posts', () => {
    const personalPost = { ...mockPost, category: 'personal' as const };
    const { getByTestId } = render(BlogDetailPage, {
      props: { post: personalPost, html: mockHtml },
    });
    const article = getByTestId('blog-detail-page');
    expect(article.style.getPropertyValue('--blog-accent')).toContain('--accent');
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
bun run test
```

Expected: all tests pass (existing + new BlogRouteMap + BlogDetailPage tests).

Print the test results table per CLAUDE.md.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/blog/BlogDetailPage.test.ts
git commit -m "test(slice-17d-4): BlogDetailPage + BlogRouteMap structure tests"
```

---

## Task 8: Visual Verification + Polish

**Files:**
- Possibly modify: any component from Tasks 2-6 based on visual issues found

Full visual verification at desktop and mobile breakpoints. Fix any layout, overflow, or styling issues.

- [ ] **Step 1: Desktop verification (1440px)**

Navigate to `/blog/why-i-left-orm-for-raw-sql` at 1440px width.

Check:
- Header: circuit grid, watermark, corner marks, edge labels, display title with orange highlight, tag pills, meta row
- Hazard stripes full width
- Three columns: TOC left (280px), prose center (65ch), route map right (280px)
- TOC active tracking on scroll
- Route map station tracking on scroll (same heading triggers both)
- Route map entrance animation plays on load
- No horizontal overflow
- Content readable, proper spacing

- [ ] **Step 2: Mobile verification (375px)**

Resize to 375px:

Check:
- Header compresses (no edge labels, no corners, smaller title)
- Hazard stripes full width
- Collapsible TOC toggle below hazard
- Single column prose, no side panels
- Route map hidden
- No horizontal overflow
- Touch targets >= 44px for interactive elements

- [ ] **Step 3: Check all blog posts**

Navigate through each post to verify no regressions:
- `/blog/why-i-left-orm-for-raw-sql`
- `/blog/building-a-transit-pipeline`
- `/blog/anime-data-viz-challenge`
- Personal posts (should use `var(--accent)` yellow)

- [ ] **Step 4: Fix any issues found**

Address layout/overflow/styling issues. Each fix is a separate commit.

- [ ] **Step 5: Run final checks**

```bash
bun run test && bun run check
```

All tests pass, 0 errors.

- [ ] **Step 6: Commit polish**

```bash
git add -A
git commit -m "fix(slice-17d-4): blog detail visual polish pass"
```

---

## Summary

| Task | Component | Type | Est. |
|------|-----------|------|------|
| 1 | Route bypass + root layout | Config | Quick |
| 2 | BlogDetailHeader redesign | Rewrite | Medium |
| 3 | BlogRouteMap component | New + Tests | Medium |
| 4 | BlogDetailPage orchestrator | New | Medium |
| 5 | TOC wiring + left decorations | Wire | Medium |
| 6 | Route map entrance animation | GSAP | Quick |
| 7 | BlogDetailPage tests | Tests | Quick |
| 8 | Visual verification + polish | QA | Medium |

**Total: 8 tasks.** Recommend 2 sessions (Tasks 1-5 in first session, 6-8 in second).

**Shared primitives reused (no changes):** SectionWrapper, CornerMarks, StickyPanel, CollapsibleSection, ManifestoCanvas, Separator, Badge, TableOfContents, boop.

**New components:** BlogDetailPage, BlogRouteMap.

**Redesigned:** BlogDetailHeader.
