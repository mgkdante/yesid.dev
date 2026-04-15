# Blog Detail Page — Design Spec

**Date:** 2026-04-14
**Slice:** 17d-4 (continuation)
**Branch:** `feature/slice-17d-component-api`
**Status:** Approved
**Predecessor:** Project Detail Page (Session 5-7)

---

## 1. Design Intent

An infrastructure magazine editorial experience. Each blog post is presented as a **cover story** — the kind of feature spread you'd find in *Railway Gazette* or *ENR Engineering News-Record* if they were covering yesid.dev's work. Big display typography, the unmistakable orange, CornerMarks framing the viewport, and a transit route map that turns your reading journey into a metro line.

The project detail page is the **technical case study**. The blog detail page is the **editorial feature**. Same constitutional bones, different personality.

### Design Principles

1. **Magazine cover energy.** The header IS the cover. Uppercase display title, watermark category, ruled category line, corner marks. Maximum editorial impact.
2. **Reading-first body.** The header commands; the body serves. Prose at `65ch`, comfortable typography, no competing panels. The content IS the experience.
3. **Margins are alive.** Left margin: TOC + circuit decorations. Right margin: transit route map. Not empty whitespace — intentional craft that rewards the wide viewport.
4. **Montreal metro DNA.** The route map uses the exact visual language from the hero's `montreal-metro.svg` — same node shapes, stroke styles, organic curves. Scaled for sidebar, styled via CSS.
5. **Constitutional compliance.** SectionWrapper three-column grid, semantic HTML, token-only styling, mobile-first, zero overflow.

---

## 2. Header — Magazine Cover Story

### Layout

Full-bleed, centered, extends behind nav. Same technique as `ProjectDetailHeader`:

```
margin-top: calc(-1 * var(--nav-height));
padding-top: var(--nav-height);
```

Minimum height: ~420px desktop, ~280px mobile.

### Background Layers (bottom to top)

1. **Circuit grid** — same repeating-linear-gradient pattern as project detail header. `color-mix(in srgb, var(--primary) 3.5%, transparent)`. Fades in via GSAP.
2. **ManifestoCanvas** — interactive hover/click particle canvas. Reused directly from home Manifesto / project detail.
3. **Watermark** — The word "DISPATCH" (professional) or "PERSONAL" (personal category), ~160-200px font-size, `font-weight: 900`, `color-mix(in srgb, var(--primary) 2.5%, transparent)`. Centered, pointer-events none.

### Content (centered, z above backgrounds)

From top to bottom:

1. **Back link** — `<- back to dispatches` (professional) or `<- back to personal corner` (personal). Mono, xs, primary color, `use:boop`. Links to `/blog` or `/blog/personal`.

2. **Category line** — `── Professional ──` with ruled borders (horizontal lines flanking text). Mono, 11px, letter-spacing 3px, uppercase, primary color. Uses CSS pseudo-elements for the ruled lines.

3. **Title** — `clamp(32px, 6vw, 64px)`, `font-weight: 900`, uppercase, `letter-spacing: -0.04em`, `line-height: 0.95`. The first keyword/technology in the title gets `color: var(--primary)` highlight (determined from `post.tags[0]` or manual scan of the title text). SplitText char-by-char entrance animation.

4. **Tag pills** — Same style as project detail header tech pills. Mono, orange border, subtle orange background, border-radius pill.

5. **Meta row** — Date (human-readable: "Apr 2026") + reading time + language. Mono, 11px, `color-mix(in srgb, var(--primary) 35%, transparent)`. Dots as separators.

### Edge Decorations (desktop only, xl+)

- **Left edge label** (rotated -90deg): `VOL. 01 // ISS {postIndex}` — computed from the post's position in the blog list.
- **Right edge label** (rotated 90deg): `{date} // {readingTime} MIN`.
- Mono, 10px, letter-spacing 2px, `color-mix(in srgb, var(--primary) 20%, transparent)`.

### Corner Marks

CornerMarks component, `size="md"`, `opacity={0.12}`. Same as project detail.

### Entrance Animation (GSAP timeline)

1. Circuit grid fade-in (0.6s)
2. Edge labels + corner marks fade-in (staggered, 0.5s)
3. Title SplitText chars (staggered 0.02s per char, from y:20 + opacity:0)
4. Tag pills slide up + fade (staggered 0.1s)
5. Reduced motion: all elements at final state immediately.

### Accent Color

- Professional posts: `var(--primary)` (#E07800)
- Personal posts: `var(--accent)` (#FFB627)

The accent color propagates to: category line, tag pills, meta row, edge labels, watermark, and the route map.

---

## 3. Separator

Hazard stripes — `<Separator variant="hazard" />`. Same as project detail. Full viewport width.

---

## 4. Body — Three-Column Layout

Uses `SectionWrapper layout="centered"` with `sideLeft` and `sideRight` slots. Same pattern as `ProjectDetailPage`.

```svelte
<SectionWrapper
  layout="centered"
  container="none"
  class="detail-body"
  style="--edge-left: 280px; --edge-right: 280px;"
>
```

Body has standard site background — NO special treatment. Only the header gets the magazine cover.

### 4.1 SideLeft — TOC + Circuit Decorations

Sticky panel (`StickyPanel top="5rem"`). Contains:

#### Table of Contents

Same pattern as project detail's sideLeft TOC:

- **"On this page"** label — `CollapsibleSection` wrapper, open by default.
- **Nav items** — Parsed from markdown headings (h2, h3, h4). Border-left tracking line (`2px solid color-mix(in srgb, var(--primary) 12%, transparent)`).
- **Active tracking** — IntersectionObserver on headings. Active item: `color: var(--primary)`, `font-weight: 600`, orange dot indicator at `-19px` left.
- **Sub-items** — h3/h4 indented, smaller text, dimmer.
- **Section counter** — Below nav: `SEC {n} / {total}` with glowing dot. Same as project detail.

#### Circuit Decorations (below TOC)

Separated by a subtle border-top. Contains:

- **Mono annotations**: `// filed-under`, `// {category}`, `// word-count: {n}`, `// avg-read: {readingTime}`. Mono, 10px, `color-mix(in srgb, var(--primary) 15%, transparent)`.
- **Metro circuit nodes**: Vertical chain of dots + connecting lines. Same visual language as hero metro network — orange filled circles, connecting lines. Styled via CSS classes, NOT inline SVG attributes.
- **Vertical reading progress bar**: 2px track, fill height driven by scroll percentage. `background: linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary) 20%, transparent))`.

### 4.2 Center — Prose Content

- **Container**: `max-width: var(--container-prose)` (65ch) centered within the content column.
- **Component**: `BlogContent` (existing component, already styled). Wraps `{@html processedHtml}`.
- **Features preserved**: Code copy buttons, heading anchor links on hover, blockquote accent borders, per-post accent color.
- **Heading IDs**: Injected by `TableOfContents.getProcessedHtml()` for scroll-to linking.

### 4.3 SideRight — Transit Route Map

A vertical transit route diagram. Each h2 section of the post is a "station" on the line. The reader "rides the route" through the content.

#### Visual Language (matches `montreal-metro.svg` exactly)

All SVG elements styled via **CSS classes and custom properties** — zero inline `fill`/`stroke` attributes.

**CSS class structure:**

```css
.route-line {
  stroke: var(--primary);
  stroke-width: 3;        /* proportional: 12.123 in hero ÷ ~4x scale */
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.route-station {
  fill: var(--primary);
  opacity: 0.4;           /* inactive stations dimmer */
}

.route-station--active {
  fill: var(--primary);
  opacity: 1;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 40%, transparent));
}

.route-station--terminus {
  /* start/end of line: slightly different styling */
  stroke: var(--primary);
  stroke-width: 2;
  fill: none;
}
```

**SVG dimensions and shapes:**

| Element | Size | Shape |
|---------|------|-------|
| Regular station | 10-12px diameter | Circle (`<circle>`) |
| Active station | 18-20px diameter | Circle with glow (CSS `filter: drop-shadow`) |
| Terminus markers | 14px diameter | Circle, stroke-only (hollow) |
| Connecting lines | 3px stroke | Organic curves (`<path>` with bezier curves, NOT straight), matching metro line style |

**Station nodes** are circles, not paths — simpler SVG, easier to style via CSS. The connecting line between stations uses gentle S-curves (cubic bezier), not straight vertical lines, echoing the organic curves of Montreal's metro routes.

#### Data Source

Stations derived from markdown headings (same source as TOC). Each h2 = a station. h3/h4 optionally shown as minor stops (smaller nodes on the same line segment).

#### Scroll Tracking

IntersectionObserver (shared with TOC — same observer, both panels react to the same heading visibility events). When a heading enters the viewport:
- Its station node transitions to active state (glow, full opacity)
- The route line "fills" up to that station (DrawSVG or stroke-dashoffset technique via CSS transition)
- Previous stations remain lit (the rider has passed them)

#### Layout

- **Top**: `ROUTE MAP` label — mono, 10px, letter-spacing 2px, primary color, opacity 0.3.
- **Map area**: The vertical transit line with stations, centered in the column.
- **Bottom**: Terminus marker + `TERMINUS` label.
- **Background (optional)**: A ghosted, heavily faded fragment of `montreal-metro.svg` behind the route map as texture. Opacity ~0.02-0.03. CSS-filtered, not a separate SVG — the same image loaded once and clipped/positioned.

#### Entrance Animation

On page load (GSAP timeline, after header animation completes):
1. Route line draws on (DrawSVGPlugin or CSS stroke-dashoffset, 0.8s)
2. Station nodes pop in with stagger (scale from 0 → 1, 0.05s stagger)
3. First station activates (glow)
4. Reduced motion: all at final state immediately.

#### Sticky Behavior

Wrapped in `StickyPanel top="5rem"`. The route map stays visible as you scroll through the prose.

---

## 5. Mobile (below xl: / 1024px)

- **Header**: Compresses. Title smaller (`clamp(24px, 5vw, 32px)`). No edge labels, no corner marks. Watermark hidden. Category line + title + tags + meta all stack centered.
- **Hazard separator**: Full width (same).
- **Collapsible TOC**: Below separator. Same collapsible toggle button pattern as existing blog detail. Uses `TableOfContents` component.
- **Route map**: Hidden. It's margin decoration, not critical navigation. The TOC handles section navigation on mobile.
- **Prose**: Full width, no side columns. `SectionWrapper` collapses sides to 0 per constitution.
- ~~Reading progress bar~~: REMOVED per feedback — not used on blog detail.

---

## 6. Route Structure

### File: `src/routes/blog/[slug]/+page@.svelte`

**Rename from `+page.svelte` to `+page@.svelte`** — bypasses `ListingLayout` (EdgeRail + accent line), same technique as project detail. The blog detail page manages its own full-bleed layout.

### File: `src/routes/blog/[slug]/+page.ts`

Existing load function. Provides: `post`, `html`, `svgContent`, `readingTime`. No changes needed.

---

## 7. Component Architecture

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `BlogDetailPage` | `src/lib/components/blog/BlogDetailPage.svelte` | Orchestrator — header + separator + SectionWrapper body. Analogous to `ProjectDetailPage`. |
| `BlogDetailHeader` | `src/lib/components/blog/BlogDetailHeader.svelte` | **Redesign** existing. Magazine cover treatment. |
| `BlogRouteMap` | `src/lib/components/blog/BlogRouteMap.svelte` | Transit route diagram for sideRight. SVG rendered inline, all elements styled via CSS classes. |

### Reused Primitives

| Component | From | Usage |
|-----------|------|-------|
| `SectionWrapper` | shells/ | Three-column body grid |
| `CornerMarks` | brand/ | Header corner framing |
| `StickyPanel` | brand/ | TOC + route map sticky wrappers |
| `CollapsibleSection` | shared/ | TOC "On this page" wrapper |
| `ManifestoCanvas` | home/ | Interactive particle canvas in header |
| `Separator` | ui/ | Hazard stripes between header and body |
| `Badge` | ui/ | Tag pills |
| `SectionLabel` | brand/ | Mono annotations |
| `TableOfContents` | shared/ | Heading parsing + processed HTML |
| ~~`ReadingProgressBar`~~ | ~~layout/~~ | ~~REMOVED per feedback~~ |
| `boop` | motion/actions | Back link hover |

### Shared Observer Pattern

The IntersectionObserver for heading tracking should be set up ONCE in `BlogDetailPage` and its state (activeHeadingId) passed down to both the TOC and the route map. Both panels react to the same signal. This avoids duplicate observers.

---

## 8. Accent Color Propagation

The post's category determines the accent color:

```typescript
const accentColor = post.category === 'personal' ? 'var(--accent)' : 'var(--primary)';
```

This color propagates via CSS custom property to:
- Header: watermark, category line, title highlight, edge labels, corner marks, tag pills, meta row
- Body: TOC active state, route map line/stations, BlogContent accent (heading anchors, code, blockquotes)
- Reading progress bar gradient

Set once on the outermost wrapper as `style="--blog-accent: {accentColor}"` and reference everywhere as `var(--blog-accent)`.

---

## 9. SVG Styling Rules (Non-Negotiable)

All SVG elements in BlogRouteMap are styled via **CSS classes and custom properties**. Zero inline presentation attributes.

```svelte
<!-- CORRECT -->
<circle class="route-station" cx="50" cy="100" r="6" />
<path class="route-line" d="M50 106 C50 130 50 150 50 170" />

<!-- WRONG — never do this -->
<circle fill="#E07800" stroke-width="2" ... />
<path stroke="#E07800" stroke-linecap="round" ... />
```

CSS handles all visual properties:
- `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`
- `opacity`, `filter` (drop-shadow for glow)
- `transition` for state changes (active tracking)
- Animation via CSS `stroke-dashoffset` or GSAP targeting classes

This ensures:
1. Theme-switching readiness (accent color changes propagate via CSS custom properties)
2. Reduced motion can disable animations via CSS `@media (prefers-reduced-motion)`
3. Consistent with constitution anti-pattern: "No hardcoded hex in class strings"

---

## 10. Mockups

Approved mockups saved in `docs/reference/mockups/`:

- `blog-detail-header-options.html` — Header options A/B/C (C approved)
- `blog-detail-body-layout.html` — Body layout with margin decorations

---

## 11. Decisions Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D160 | Blog detail designed separately from project detail | Different content type (editorial vs case study) needs its own personality |
| D161 | Header: Option C — full-bleed cover story | Maximum magazine cover impact, shares DNA with project detail, cleanest mobile adaptation |
| D162 | Body: No right data panel | Blog prose needs breathing room, metadata in header. Right column = decorative route map |
| D163 | Right column: Transit route map | Bold infrastructure decoration, matches brand transit identity, functional (scroll tracking) |
| D164 | Route map uses montreal-metro.svg visual language | Consistency with hero animation — same node shapes, stroke styles, organic curves |
| D165 | All route map SVG styled via CSS classes | Zero inline fill/stroke — theme-ready, animation-ready, constitution-compliant |
| D166 | Route bypasses ListingLayout via +page@.svelte | Same technique as project detail — blog detail manages its own full-bleed layout |
| D167 | Shared IntersectionObserver for TOC + route map | Single observer, state shared via props — no duplicate watchers |
| D168 | Body has standard site background | Only header gets special treatment — editorial personality lives in the cover, not the reading experience |
| D169 | Left column: TOC + mono annotations + circuit nodes | Same TOC pattern as project detail, plus editorial metadata annotations |
