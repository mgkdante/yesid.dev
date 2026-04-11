# Slice 09c-2a — Layout Rethink Design Spec

**Date:** 2026-04-06
**Status:** approved
**Depends on:** 09c-1 (complete)
**Estimated effort:** 1 session
**Scope:** Layout and visual presentation changes only. No new actions, interactions, or data model changes. Those belong in 09c-2b (enhancements).

---

## Design Principles

### Metro Branding Density

Metro identity follows a "stations vs destinations" model:

- **Listing pages (stations)** — metro-heavy: vertical line connectors, station number badges, transit wayfinding patterns. This is where the brand does its navigation work.
- **Detail pages (destinations)** — metro-light: accent colors only, content takes over. The reader arrived — let them consume.

### Content Preservation

Every data point currently visible stays visible. No features removed:
- SVG illustrations with GSAP entrance animations (draw/morph/draw-fill/stagger)
- MorphSVG hover effects on SVG icons
- Filter/search functionality
- Reading time, tags, dates, service badges
- DataFlowDiagram, TableOfContents
- Mobile responsive behavior

### No Feature Flags

The "featured" post is always the latest by date (`posts[0]` after date-sort). No manual flagging, no frontmatter field. Zero maintenance.

---

## Page Designs

### 1. Blog Listing (`/blog`, `/blog/personal`)

**Layout: Hybrid Featured Stop + Timeline**

```
┌─────────────────────────────────────────┐
│  [Search] [Filters]                     │
├─────────────────────────────────────────┤
│                                         │
│  ●─── Featured Station Card ──────────  │
│  01   ┌─────────────────────────────┐   │
│  │    │ BlogSvgIcon (larger)        │   │
│  │    │ Title (big typography)      │   │
│  │    │ Excerpt (2 lines)           │   │
│  │    │ Tags · Date · Reading time  │   │
│  │    └─────────────────────────────┘   │
│  │    accent border, #E07800            │
│  │                                      │
│  ●─── Timeline Row ──────────────────   │
│  02   Title              Date · X min   │
│  │    BlogSvgIcon (48px) + excerpt      │
│  │    Tags                              │
│  │                                      │
│  ●─── Timeline Row ──────────────────   │
│  03   Title              Date · X min   │
│  │    BlogSvgIcon (48px) + excerpt      │
│  │    Tags                              │
│  │                                      │
│  ⋮    (continues)                       │
└─────────────────────────────────────────┘
```

**Component changes:**
- `BlogListingPage.svelte` — new layout structure: featured card (index 0) + timeline rows (index 1+)
- `BlogRow.svelte` — restyle as timeline row: metro line left, station badge, cleaner typography, larger spacing
- New: featured card is a `featured` boolean prop on `BlogRow` (not a separate component). When `featured={true}`: larger SVG (64px), accent border, full excerpt visible. Keeps one component, two modes.
- Vertical metro line: CSS `border-left` or pseudo-element connecting station badges
- Station badges: monospace `padStart(2, '0')` numbers in orange circles (pattern from existing BlogCard)
- `BlogSvgIcon` — larger size on featured card (e.g., 64px vs 48px), same animations
- `BlogFilterSidebar` / `BlogFilterMobile` — unchanged, stay above the listing

**Personal Corner (`/blog/personal`):**
Same layout, yellow accent (`#FFB627`) instead of orange. Already handled by `accentColor` prop.

### 2. Blog Detail (`/blog/[slug]`)

**Layout: Editorial Reading — No Card Frame**

```
┌─────────────────────────────────────────┐
│ ████░░░░░░░░░░░░  Reading progress bar  │
├─────────────────────────────────────────┤
│                                         │
│  [Category] · [Reading time]            │
│  Title (large, Inter 800)               │
│  Date                                   │
│  BlogSvgIcon (entrance animation)       │
│                                         │
│─────────────────────────────────────────│
│                                         │
│  # The Problem with Abstractions        │
│                                         │
│  Body text at max-w-3xl, generous       │
│  line-height (1.8), comfortable         │
│  reading width...                       │
│                                         │
│  ┌─────────────────────── [📋 Copy] ─┐  │
│  │ SELECT route_id, stop_name,       │  │
│  │   LAG(arrival_time) OVER (...)    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  More body text continues...            │
│                                         │
└─────────────────────────────────────────┘
```

**Component changes:**
- `BlogContent.svelte` — remove CollapsibleSection wrapper. Content renders directly with prose styles. Widen from `max-w-2xl` (42ch) to `max-w-3xl` (~48ch) for better reading.
- `BlogDetailHeader.svelte` — cleaner typography: category + reading time on one line, large title, date below. BlogSvgIcon with entrance animation stays.
- Heading anchors: `h2`/`h3` get a `#` link via CSS `::before` that slides in on hover (ME-6 from original spec, pulled into 09c-2a since it's a layout concern).
- Code copy button: overlay `📋` top-right of `<pre>` blocks, click copies to clipboard, shows checkmark 2s (ME-5, pulled in as layout concern).
- Reading progress bar: fixed `<div>` at top of viewport, `scaleX()` driven by scroll position of the blog content area (query via `[data-testid="blog-content"]`). Orange-to-yellow gradient (ME-2, pulled in as layout concern).
- Metro branding: accent color on links, headings, code highlights. No metro line or station badges.

### 3. Work Listing (`/work`)

**Layout: Metro Stacked — Full-Width Cards on Metro Line**

```
┌─────────────────────────────────────────┐
│  [Search] [Filters]                     │
├─────────────────────────────────────────┤
│                                         │
│  ●  ┌───────────────────────────────┐   │
│  01 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  │  │ Gradient banner + title       │   │
│  │  ├───────────────────────────────┤   │
│  │  │ Description                   │   │
│  │  │ Services: ◆ Pipeline ◆ DB    │   │
│  │  │ Stack: [PG] → [Py] → [dbt]   │   │
│  │  │ Tags: ETL · real-time         │   │
│  │  │ WorkSvgIcon (morph on hover)  │   │
│  │  └───────────────────────────────┘   │
│  │                                      │
│  ●  ┌───────────────────────────────┐   │
│  02 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  │  │ Different gradient + title    │   │
│  │  ├───────────────────────────────┤   │
│  │  │ (same content structure)      │   │
│  │  └───────────────────────────────┘   │
│  │                                      │
│  ⋮  (continues)                         │
└─────────────────────────────────────────┘
```

**Component changes:**
- `WorkListingPage.svelte` — switch from multi-column FLIP grid to single-column stacked layout. Metro line connects cards vertically. FLIP animation still runs on filter changes (cards reorder vertically instead of grid reflow — simpler animation, same visual continuity).
- `WorkCard.svelte` — restyle as full-width stacked card:
  - Gradient banner top (uses existing `SERVICE_GRADIENTS` mapping)
  - Title below gradient (not overlaid — better readability, no text-on-image contrast issues)
  - Description, services (with SVG badges), tech stack (DataFlowDiagram inline), tags below
  - WorkSvgIcon with morph-on-hover stays
  - `use:tilt` on article, `use:magnetic` on tags — unchanged
- Station badges: orange circles with monospace numbers on the metro line
- `WorkFilterSidebar` / `WorkFilterMobile` — unchanged, stay above

**Gradient per project:**
Reuse existing `SERVICE_GRADIENTS` record (keyed by first related service). Already in WorkCard.

### 4. Work Detail (`/work/[slug]`)

**Layout: Hero Banner + Meta Strip + CollapsibleSections**

```
┌─────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓  CASE STUDY                        ▓  │
│ ▓  Transit Data Pipeline             ▓  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
├─────────────────────────────────────────┤
│ Services: ◆ Pipeline ◆ DB │ Stack: ... │
│ Tags: ETL · real-time · transit         │
├─────────────────────────────────────────┤
│                                         │
│  ▎ The Challenge           [▼]          │
│  ▎ Montreal's transit authority...      │
│                                         │
│  ▎ The Solution            [▼]          │
│  ▎ A Python ingestion service...        │
│                                         │
│  ┌─ DataFlowDiagram (full width) ─────┐ │
│  │  [PG] → [Python] → [dbt] → [AF]   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ▎ README                  [▼]          │
│  ▎ (TableOfContents syncs)              │
│                                         │
│  ← Previous Stop    Next Stop →         │
└─────────────────────────────────────────┘
```

**Component changes:**
- `WorkDetailPage.svelte` — add gradient hero banner at top (full-width, reuses project gradient). Add meta strip below (services with SVG icons, stack pills, tags in one horizontal row). Rest of page (CollapsibleSections, ToC, README) unchanged.
- `DataFlowDiagram` — promote from sidebar/inline to full-width between content sections.
- `ServiceNav` pattern reused for next/prev stop navigation at bottom (MT-3 from original spec, pulled in since it's layout).
- All SVGs in service badges, DataFlowDiagram stay with their animations.

---

## Pages NOT in scope

- Home page (`/`)
- Services listing (`/services`)
- Services detail (`/services/[id]`)
- Preview (`/preview`)

---

## Responsive Behavior

All layouts are mobile-first:
- **Blog listing**: metro line + featured card stack naturally in single column
- **Blog detail**: progress bar spans full width, content already single-column
- **Work listing**: already single-column (stacked cards), no grid-to-stack transition needed
- **Work detail**: hero banner full-width, meta strip wraps, CollapsibleSections unchanged

---

## Testing Strategy

- Existing tests must stay green (no component API changes that break tests)
- New tests for:
  - Featured card selection logic (latest by date)
  - Reading progress bar (scroll position → scaleX)
  - Code copy button (clipboard interaction)
  - Heading anchor link generation
- Visual verification on localhost required before handoff

---

## What Moves to 09c-2b

These items from the original 09c-2 spec are deferred:
- ME-1: `cursorGlow` action
- ME-3: Animated gradient border on WorkCard hover
- ME-4: `ScrollTrigger.batch()` for listing entrances
- MT-1: Metro line CSS in blog listing (the metro line structure is in 09c-2a, animated drawing is 09c-2b)
- MT-2: Station number badges (structure in 09c-2a, animation in 09c-2b)
- MT-4: Animated dashed separators (DrawSVGPlugin)

Items pulled FROM 09c-2b INTO 09c-2a (layout concerns):
- ME-2: Reading progress bar
- ME-5: Code block copy button
- ME-6: Heading anchor links
- MT-3: Next/prev stop nav on work detail
