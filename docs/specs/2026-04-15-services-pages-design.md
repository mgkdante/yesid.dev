# Services Pages Design Spec

**Date:** 2026-04-15
**Scope:** `/services` listing + `/services/[id]` detail — constitutional wiring, orange identity, scroll fix
**Branch:** `feature/slice-17d-component-api`
**Sub-slice:** 17d-5

---

## 1. Design Direction

**Inverted orange accents on dark canvas.** The services section keeps the same `--background` as the rest of the site, but orange (`#E07800`) is pushed to full strength everywhere — borders, text, separators, metrics, and three solid orange surfaces (tabs strip, SVG panel, projects strip). Orange is the ink, not the paper.

**Why not full orange background?** Tested during brainstorming — wall-to-wall `#E07800` at 100dvh felt aggressive. The inverted accents approach keeps the warmth and distinctiveness without overwhelming.

---

## 2. Scroll Architecture (Repo-Wide Fix)

### Problem

`ServiceListingPage` creates a nested scroll container that violates the Constitution's Scroll Law:

1. `.service-listing` has `height: calc(100dvh - 5rem)` + `overflow: hidden` — blocks page scroll
2. `.scroll-area` has `overflow-y: auto` + `scrollbar-width: none` — hidden inner scrollbar
3. Lenis manages page-level scroll but never reaches services content
4. Footer is trapped inside the inner scroll container
5. StationTabs scrollbar is also hidden

### Fix

- **Eliminate the nested scroll container.** Services becomes a normal page that scrolls via Lenis (like every other page).
- **Page-level scroll-snap.** Apply `scroll-snap-type: y proximity` to the page scroll for services (not `mandatory` — allows free scrolling with gentle snap guidance).
- **Scrollbar always visible** on scrollable elements. No `scrollbar-width: none` unless the element is decorative.
- **Footer restored to global layout.** Remove `hideFooter` logic from `+layout.svelte`. Remove inner `<Footer />` from ServiceListingPage.
- **Lenis manages all scroll.** No inner `overflow-y: auto` containers stealing scroll. Inner scrollable containers (code blocks, horizontal tab overflow) use standard browser scroll propagation — when they hit their boundary, scroll propagates to the parent.

### Constitution Amendment

Add to Section 9 (Responsive) under Scroll Law:

> **No nested scroll containers.** A component must never create a scrollable container (`overflow-y: auto/scroll`) that captures page-level scroll. The page scroll (managed by Lenis) is the only vertical scroll axis. Exceptions: horizontally scrollable elements (`overflow-x: auto` for tabs, code blocks) and modal/drawer body content when the page scroll is locked.
>
> **Scrollbar visibility.** Scrollable elements must have visible scroll affordance. `scrollbar-width: none` is banned on vertically scrollable containers. Horizontal overflow elements may hide scrollbars if they have other scroll affordance (edge fade, arrow indicators).

### Audit Scope

Check all pages for nested scroll containers:
- ServiceListingPage — primary offender (fix in this slice)
- Any other `overflow-y: auto` + hidden scrollbar patterns — audit and flag

---

## 3. Listing Page (`/services`)

### Layout

Each service occupies **100dvh** as a snap viewport. 6 viewports scroll vertically with `scroll-snap-type: y proximity` on the page scroll. No nested scroll container — Lenis manages everything.

**No EdgeRail.** StationTabs + orange strips provide the identity. The orange accent language is the wayfinding — no rotated label needed.

**No ListingLayout wrapper.** Services listing uses its own page structure, not the blog/projects shared layout.

### Three Orange Anchors

Three solid `#E07800` surfaces frame each dark viewport:

| Surface | Position | Content | Behavior |
|---------|----------|---------|----------|
| **Tabs strip** | Sticky top | Station tabs (01-06), hazard stripe top edge, "6 SERVICES" counter | Sticky via `position: sticky`, dark text on orange, active tab has 3px dark bottom border, inactive tabs fade by distance |
| **SVG panel** | Right side of viewport (desktop/tablet), full-width banner (mobile) | Service SVG illustration with CornerMarks, dark strokes on orange | Static within each viewport, adapts size per breakpoint |
| **Projects strip** | Sticky bottom | "Built with this" + project links + count, hazard stripe bottom edge | Sticky via `position: sticky`, updates dynamically based on which service viewport is in view |

### Viewport Composition — Asymmetric Split

**Desktop (1440px+):**
```
┌─────────────────────────────────────────────────────────┐
│ ██████████████ ORANGE TABS STRIP ██████████████████████ │
├─────────────────────────────────────────────────────────┤
│                                          ┌────────────┐ │
│  Service 01 / 06                         │            │ │
│  SQL                                     │   ORANGE   │ │
│  Development.                            │    SVG     │ │
│  & Optimization                          │   PANEL    │ │
│                                          │  260×320   │ │
│  Queries that run in seconds,            │            │ │
│  not minutes                             └────────────┘ │
│                                                         │
│  Body text description...                               │
│                                                         │
│  [PostgreSQL] [SQL Server] [T-SQL] [PL/pgSQL]          │
│                                                         │
│  3x faster avg query      [Deep dive →]                │
├─────────────────────────────────────────────────────────┤
│ ██████████████ ORANGE PROJECTS STRIP ██████████████████ │
└─────────────────────────────────────────────────────────┘
```

**Tablet (768px):** Tighter split — SVG panel 180×220. Title 44px. Tabs scroll horizontally.

**Mobile (375px):** Stacked — orange SVG banner full-width at top (below tabs), title below at 42px. CTA full-width. Projects strip compact.

### Typography Scale (Listing)

| Element | Desktop | Tablet | Mobile | Font |
|---------|---------|--------|--------|------|
| Title | `clamp(44px, 5vw, 64px)` / 900 / -0.03em | 44px | 42px | Inter |
| Benefit headline | 24px / 600 | 20px | 18px | Inter |
| Body | 16px / 400 | 15px | 14px | Inter |
| Impact metric | 48px / 900 | 36px | 36px | Inter |
| Station counter | 14px / mono | 12px | 11px | JetBrains Mono |
| Tab labels | 13px / mono | 12px | 11px | JetBrains Mono |
| Stack pills | 12px / mono | 11px | 11px | JetBrains Mono |

### Orange Accent Rules (Full Strength)

All orange accents use pure `#E07800` — no opacity dilution, no `color-mix` tinting:
- Station counter text: `#E07800`
- Title dot: `#E07800`
- Subtitle: `#E07800`
- Stack pill borders AND text: `#E07800`, 1.5px solid
- Impact metric value: `#E07800`
- Impact metric label: `#E07800`
- CTA button: `#E07800` bg, dark text
- SVG panel border/bg: `#E07800`
- Hazard stripes: `var(--primary)` (same token, consistent with D136)

### Dynamic Projects Strip

The projects strip updates based on which service viewport is currently in view:
- Use `IntersectionObserver` on each service viewport (`threshold: 0.5`)
- When a viewport becomes majority-visible, update the strip's project links to that service's `relatedProjects`
- Strip shows: label ("Built with [service name]") | separator | project links (clickable, linking to `/projects/[slug]`) | count

### Scroll-Snap Behavior

- `scroll-snap-type: y proximity` on the scroll container (page-level, not nested)
- Each service viewport: `scroll-snap-align: start`
- Footer does NOT snap — flows naturally after the last service
- Trackpad, mousewheel, scrollbar — all work normally
- StationTabs click triggers `scrollIntoView({ behavior: 'smooth' })`

---

## 4. Detail Page (`/services/[id]`)

### Layout

Asymmetric split (Option C). Same orange strip language as listing. No TOC — services have 3-4 sections max.

**Route:** Uses standard layout (not `+page@.svelte` bypass). StationTabs in navigate mode (links, not scroll triggers). `isFullBleed` check NOT needed — detail page has normal `pt-20` spacing.

### Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ ██████████████ ORANGE TABS STRIP (navigate) ███████████ │
├─────────────────────────────────────────────────────────┤
│  ← All Services                                        │
│                                          ┌────────────┐ │
│  Service 01 / 06                         │   ORANGE   │ │
│  SQL Development.                        │    SVG     │ │
│  & Optimization                          │   PANEL    │ │
│                                          │  280×340   │ │
│  Description text...                     │            │ │
│  [PostgreSQL] [SQL Server] [T-SQL]       └────────────┘ │
│                                                         │
│  ═══════════ HAZARD SEPARATOR ═══════════              │
│                                                         │
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │   3x     │  │ ┌──────────────────────────────────┐ │ │
│  │  faster  │  │ │ How This Helps You               │ │ │
│  │          │  │ │ Content...                        │ │ │
│  │ ──────── │  │ └──────────────────────────────────┘ │ │
│  │ Benefit  │  │ ┌──────────────────────────────────┐ │ │
│  │ headline │  │ │ Typical Deliverables              │ │ │
│  │          │  │ │ ● item  ● item                    │ │ │
│  └──────────┘  │ └──────────────────────────────────┘ │ │
│   (sticky col) │ ┌──────────────────────────────────┐ │ │
│                │ │ My Approach                       │ │ │
│                │ │ Content...                        │ │ │
│                │ └──────────────────────────────────┘ │ │
│                └──────────────────────────────────────┘ │
│                                                         │
│ ██████████████ ORANGE PROJECTS STRIP ██████████████████ │
│                                                         │
│                              Next: Data Pipeline →      │
└─────────────────────────────────────────────────────────┘
```

### Hero (Asymmetric Split)

- **Left column:** Station counter (mono, orange) → title (56px desktop, orange dot) → subtitle (orange, italic) → description → stack pills (orange border + text)
- **Right column:** Orange SVG panel (280×340 desktop, CornerMarks, dark-stroked SVG illustration)
- **Back link:** `← All Services` in mono, orange, top-left

### Content Body

**Desktop:** Two-column grid — impact metric column (200px, sticky) left + content sections right.

**Impact metric column (desktop only):**
- Large metric value (52px, orange, bold)
- Metric label (mono, orange, uppercase)
- Separator line (orange 20%)
- Benefit headline below

**Content sections** — standard cards (not orange-tinted):
- Use existing Card/CollapsibleSection styling (bg-card, border-subtle)
- Sections: "How This Helps You" (valueProposition), "Typical Deliverables" (deliverables grid), custom sections from `service.sections[]`
- Deliverables grid: 2-column on desktop/tablet, 1-column mobile. Orange dots for list items.

**Tablet:** Impact metric collapses to inline row above sections. Single-column content.

**Mobile:** Full-width orange SVG banner at top. Metric inline. Sections stack vertically.

### Related Projects Strip

Same orange strip as listing page. Content:
- Label: "Built with [service title]"
- Vertical separator
- Project links (clickable → `/projects/[slug]`)
- Not sticky on detail page — static position, flows in page

### Prev/Next Navigation

- Positioned below projects strip
- Shows adjacent services (by station number)
- Previous on left, next on right
- Orange arrow + mono "Previous"/"Next" label + service title
- Uses `boop` action on hover
- Omits direction when at first/last service

### Typography Scale (Detail)

Same scale as listing page for hero elements. Content sections use:

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Section title | 15px / 700 | 14px | 13px |
| Section body | 15px / 1.7 line-height | 14px | 13px |
| Deliverable item | 14px | 13px | 12px |
| Impact metric | 52px / 900 | 40px | 36px |

---

## 5. Shared Components

### StationTabs (Restyled)

The existing StationTabs component is restyled but keeps its bits-ui/Tabs wiring:

| Property | Current | New |
|----------|---------|-----|
| Background | `var(--background)` | `#E07800` solid orange |
| Text color | `var(--secondary-foreground)` | `#1A1A18` dark |
| Active indicator | Orange bottom border | Dark (`#1A1A18`) bottom border |
| Active text | `var(--light-foreground)` | `#1A1A18` bold |
| Inactive fade | Distance-based opacity (keep) | Same behavior, darker text |
| Scrollbar | Hidden | Visible on overflow |
| Top edge | None | Hazard stripe (dark on orange) |

Both modes (scroll + navigate) get the same orange treatment.

### RelatedProjects / Projects Strip (New Component)

The current `RelatedProjects` component is replaced with a new `ProjectsStrip` component styled for the orange strip:

- Solid `#E07800` background
- Dark text
- Layout: label | vertical separator | project links | count
- Hazard stripe bottom edge
- Horizontal scroll on overflow
- Accepts `projects` prop + optional `serviceTitle` for contextual label

### SVG Panel (New Pattern)

Orange container for service SVG illustrations:

- Solid `#E07800` background, `border-radius: var(--radius-lg)`
- CornerMarks (dark on orange)
- SVG illustration rendered with dark strokes (inverted from current orange-on-dark)
- Desktop: sized panel (260-280px wide). Mobile: full-width banner.
- "ILLUSTRATION" label below (mono, orange, 10px) — desktop only

### ServiceCard (Rewritten)

Current ServiceCard rewritten for the new viewport composition:

- Fills 100dvh, `scroll-snap-align: start`
- Asymmetric grid layout (text left, SVG panel right)
- All orange accents at full strength
- Impact metric and benefit headline prominent
- CTA button: solid orange bg, dark text
- Responsive: grid → stacked at mobile breakpoint

---

## 6. SVG Adaptation

Service SVGs (`service-sql.svg`, `service-pipeline.svg`, etc.) currently use `currentColor` with orange strokes on dark background. On the orange SVG panel, they need inverted rendering:

- **Inside orange panel:** SVG strokes become dark (`#1A1A18` or `currentColor` with dark text color on the orange container)
- **Implementation:** The SVG panel container sets `color: #1A1A18` — since SVGs use `currentColor`, strokes automatically invert
- **No SVG file changes needed** — the container's text color drives the stroke color

---

## 7. Responsive Breakpoints

All breakpoints follow the Constitution's 5 canonical values:

| Breakpoint | Layout shift |
|------------|-------------|
| Base (<360px) | Stacked, compact spacing |
| sm: 360px | Comfortable stacked |
| md: 520px | Stacked but more breathing room |
| lg: 768px | Asymmetric split (tighter), tabs may scroll |
| xl: 1024px | Full asymmetric split, all elements visible |
| 2xl: 1440px | Maximum widths, widest panels |

Key responsive shifts:
- **Asymmetric → stacked** at `lg:` (768px) breakpoint
- **SVG panel → full-width SVG banner** below `lg:`
- **Impact metric column → inline metric** below `xl:` (1024px)
- **Tabs strip:** horizontal scroll with visible scrollbar below `xl:`
- **Projects strip:** horizontal scroll on overflow at all breakpoints

---

## 8. Motion

### Listing Page

- **Scroll-snap:** `y proximity` on page scroll — gentle guidance, not forced
- **Tab sync:** IntersectionObserver tracks active viewport → updates StationTabs + ProjectsStrip
- **Entrance animation:** Each viewport's content fades up on first intersection (CSS keyframes with `prefers-reduced-motion` guard)
- **Tab click:** `scrollIntoView({ behavior: 'smooth' })` via Lenis

### Detail Page

- **Section entrance:** Staggered fade-up on load (same CSS keyframe pattern as ProjectDetailPage)
- **Reveal action:** Content sections use `use:reveal` for scroll-triggered entrance
- **Boop:** Prev/next links, back link, CTA button
- **Reduced motion:** All animations skip to final state

---

## 9. Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| D183 | Inverted orange accents, not orange background | Full orange at 100dvh felt aggressive. Dark canvas with bold orange accents balances warmth and readability. |
| D184 | Three solid orange surfaces (tabs, SVG panel, projects strip) | Creates consistent "orange sandwich" framing without overwhelming the viewport. |
| D185 | No EdgeRail on services | StationTabs + orange strips provide identity. Scroll-snap viewports don't need a rotated sidebar label. |
| D186 | Asymmetric split layout (Option C) | Engineering spec sheet vibe — text left, SVG panel right. Impact metric gets its own column on desktop. |
| D187 | Standard cards for detail content sections | Orange-tinted cards tested but rejected — standard bg-card/border-subtle keeps consistency with rest of site. |
| D188 | Scroll-snap `y proximity` (not `mandatory`) | Allows free scrolling + trackpad + scrollbar while still providing snap guidance. |
| D189 | No TOC on detail page | Services have 3-4 sections max. TOC adds complexity without value. |
| D190 | Nested scroll container eliminated | Violates Constitution Scroll Law. Page-level Lenis scroll replaces inner container. |
| D191 | Footer restored to global layout | Was trapped in nested scroll container. Returns to standard position. |
| D192 | SVG strokes invert via container `color` | No SVG file changes — `currentColor` responds to container's text color. |
| D193 | Constitution amended with nested scroll ban | Prevents future scroll traps across all pages. |
| D194 | Hazard stripes edge the orange strips | Connects to existing brand language (hazard stripes used on separators site-wide). |
| D195 | Dynamic projects strip via IntersectionObserver | Strip updates project links based on which service viewport is majority-visible. |

---

## 10. Files Affected

### New Files
- `src/lib/components/services/ProjectsStrip.svelte` — orange projects strip
- `src/lib/components/services/ServiceSvgPanel.svelte` — orange SVG container with CornerMarks

### Rewritten Files
- `src/lib/components/services/ServiceListingPage.svelte` — eliminate nested scroll, new viewport composition
- `src/lib/components/services/ServiceCard.svelte` — asymmetric split, bigger typography
- `src/lib/components/services/ServiceDetailPage.svelte` — asymmetric split, orange strips, impact column

### Modified Files
- `src/lib/components/shared/StationTabs.svelte` — orange strip styling
- `src/routes/+layout.svelte` — remove `hideFooter` logic
- `src/routes/services/+page.svelte` — remove inner footer reference if any
- `docs/reference/CONSTITUTION.md` — add nested scroll ban + scrollbar visibility rule

### Deleted
- Inner `<Footer />` from ServiceListingPage

---

## 11. Acceptance Criteria

1. `/services` loads with page-level scroll (Lenis). No nested scroll container. Trackpad, mousewheel, and scrollbar all work naturally.
2. Each service viewport occupies 100dvh with `scroll-snap-align: start`.
3. StationTabs strip is solid orange, sticky at top, dark text.
4. Projects strip is solid orange, sticky at bottom, updates dynamically per service.
5. SVG illustrations render with dark strokes inside orange panels.
6. Footer appears in its standard position after the last service viewport.
7. Detail page uses asymmetric split hero with orange SVG panel.
8. Detail page content sections use standard cards (not orange-tinted).
9. Impact metric column visible on desktop (52px value, sticky).
10. All typography meets the scale defined in this spec.
11. All responsive breakpoints work (1440, 768, 375).
12. `bun run test` and `bun run check` pass.
13. Constitution amended with nested scroll ban.
14. No `scrollbar-width: none` on vertical scroll containers.

---

## 12. Mockups

Approved mockups saved in `.superpowers/brainstorm/1208-1776282068/content/`:
- `listing-styled-strips-orange-svg.html` — listing viewport (approved direction)
- `listing-responsive-breakpoints.html` — listing at 3 breakpoints (approved)
- `detail-responsive-breakpoints.html` — detail at 3 breakpoints (approved, standard cards)
