# Project Detail Page — Design Spec

**Date:** 2026-04-14
**Status:** APPROVED
**Slice:** 17d (Component API)
**Branch:** `feature/slice-17d-component-api`
**Mockup:** `docs/reference/mockups/project-detail-page-approved.html`

---

## 1. Summary

Redesign `/projects/[slug]` as an immersive visual case study page. The hero zone uses the same manifesto visual language (circuit grid, warm glow, edge metadata, CornerMarks, GlowOverlay) with project-specific data auto-generated from the `Project` type. Below the hero, a three-column layout: sticky TOC on the left, dynamic narrative sections in the center, and a glanceable data panel on the right.

### Design Goals

- **Visual continuity** with the manifesto section — same `#0f0d0a` background, circuit grid, corner marks, cursor glow
- **Project as mission briefing** — edge metadata whispers the project's fingerprint (slug, stack, metrics, status)
- **Case study narrative** — sections are dynamic from `project.sections[]`, defaulting to 4-5 standard sections (Problem, Approach, Build, Result, README)
- **Glanceable sidebar** — overview, impact metrics, stack, services, links — all at a glance without scrolling the narrative
- **Placeholder-first** — design slots for diagrams, screenshots, and code blocks so content capture becomes a shot list
- **Maximum primitive reuse** — every visual element maps to an existing component

---

## 2. Page Structure

```
+--+-------------------------------------------------------------+
|  |  MANIFESTO HERO (full-width, #0f0d0a bg)                    |
|  |  ┌ CornerMarks ──────────────────────────── CornerMarks ┐   |
|  |  │  Edge Left          CENTER CONTENT        Edge Right  │   |
|A |  │  (project meta)     ← All Projects        (stack)     │   |
|C |  │                     TRANSIT DATA                       │   |
|C |  │                     PIPELINE                           │   |
|E |  │                     subtitle                           │   |
|N |  │                     [pills] [pills] [pills]            │   |
|T |  │  ─────────          terminal prompt       ─────────    │   |
|  |  └ CornerMarks ──────────────────────────── CornerMarks ┘   |
|L |  ─── Separator variant="gradient" ───────────────────────    |
|I |                                                              |
|N |  ┌─────────┬───────────────────────────┬──────────────┐     |
|E |  │  LEFT   │    CENTER                 │   RIGHT      │     |
|  |  │  TOC    │    Dynamic Sections       │   Glanceable │     |
|  |  │ 200px   │    (flex: 1)              │   260px      │     |
|  |  │ sticky  │                           │   sticky     │     |
|  |  │         │    01 The Problem         │   Overview   │     |
|  |  │  ● Prob │    02 The Approach        │   Impact     │     |
|  |  │    App  │       Data Flow (h3)      │   Stack      │     |
|  |  │    Buil │       Schema Design (h3)  │   Services   │     |
|  |  │    Resu │    03 The Build           │   Links      │     |
|  |  │    READ │       ETL Pipeline (h3)   │              │     |
|  |  │         │       Monitoring (h3)     │              │     |
|  |  │ SEC 1/5 │    04 The Result          │              │     |
|  |  │         │    05 README              │              │     |
|  |  └─────────┴───────────────────────────┴──────────────┘     |
+--+-------------------------------------------------------------+
```

---

## 3. Manifesto Hero

### 3.1 Background Layers (same as Manifesto.svelte)

| Layer | What | CSS | Z-order |
|-------|------|-----|---------|
| Base | Solid `var(--manifesto)` (`#0f0d0a` dark, `#F0EDE5` light) | `background: var(--manifesto)` | — |
| Circuit grid | Repeating 80px grid lines at 3.5% primary opacity | `repeating-linear-gradient` (90deg + 0deg), plus radial dot intersections at 320px tile | `z-base` |
| Warm glow | Centered elliptical radial gradient, 4% primary | `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(primary, 0.04), transparent 70%)` | Above grid |
| GlowOverlay | Cursor-following radial glow | `GlowOverlay` component + `cursorGlow` action on container | `z-content + 3` |

### 3.2 Decorative Elements

| Element | Primitive | Placement | Opacity |
|---------|-----------|-----------|---------|
| Corner ticks | `CornerMarks size="md"` | All 4 corners, 12px inset | 0.12 |
| Chevrons | 3x right-pointing chevron divs (same as `ManifestoTransit`) | Top-right, 70px from top, 55px from right | 0.07 |
| Crosshair | SVG circle + cross lines (44x44) | Bottom-right, 45px from right, 55px from bottom | 0.06 |
| Ticks | Horizontal number sequence (0, 80, 160...480) | Top center, 18px from top | 0.08 |

### 3.3 Edge Metadata (Auto-Generated)

**Left edge** — project identity and impact metrics:

```
PRJ {project.slug}
SRC {project.location || 'sherbrooke'}
ENV {project.environment || 'production'}
VER {project.version || '1.0.0'}
STATUS {project.status}
───────
{impactMetric.value} {impactMetric.label}    (for each metric)
```

**Right edge** — tech stack breakdown:

```
LAYER {relatedServices[0].id || project.slug}
{ROLE} {stack[0]}      (e.g., DB postgresql)
{ROLE} {stack[1]}      (e.g., ETL python)
...
───────
NODES {stack.length}
```

**Stack-to-role mapping:** Each tech in `project.stack` gets a role label derived from the related service type or a sensible default. If no role can be determined, use the tech name directly. The mapping should be defined in the data layer as a simple record type.

**Bottom center** — terminal prompt:

```
yesid@{slug}:~$ cat overview.md█
```

Uses `TerminalCursor` primitive for the blinking block cursor.

**Styling:**
- Font: `var(--font-mono)`, 10px, `letter-spacing: 1.5px`
- Color: `rgba(var(--primary), 0.15)` base, `0.25` for value highlights
- Line-height: 2.4
- Text-transform: uppercase
- Position: absolute, vertically centered (`top: 50%; transform: translateY(-50%)`)
- Left edge: 28px from left
- Right edge: 28px from right, text-align: right

**Responsive:** Edge metadata text is hidden below `lg` (1024px). On mobile, only the center content, corner marks, and terminal prompt remain visible.

### 3.4 Center Content

| Element | Typography | Color | Notes |
|---------|-----------|-------|-------|
| Back link | `var(--font-mono)`, 12px, letter-spacing 0.5px | `var(--primary)` at 0.7 opacity | `boop` action (scale 1.05, 200ms). Links to `/projects` |
| Title (h1) | `var(--font-heading)`, weight 900, `clamp(2.5rem, 5vw, 4rem)`, tracking -0.03em | `var(--primary)` | Uppercase. `text-shadow: 0 0 80px rgba(primary, 0.12)`. Line-height 0.95. Multi-word titles break with `<br>` |
| Subtitle | `var(--font-heading)`, 18px, line-height 1.5 | `var(--text-secondary)` (50% foreground) | `project.oneLiner`. Max-width 560px, centered |
| Tech pills | `var(--font-mono)`, 13px, letter-spacing 0.04em | `rgba(primary, 0.6)` text, `rgba(primary, 0.15)` border, `rgba(primary, 0.04)` bg | `border-radius: var(--radius-pill)`, padding 7px 18px. Use `Badge variant="tag"` with pill styling. Rendered from `project.stack` |

**Spacing:**
- Back link → title: 28px (`mb-7`)
- Title → subtitle: 16px (`mb-4`)
- Subtitle → pills: 28px (`mb-7`)
- Padding: 40px top, 60px bottom, 2rem inline
- Max-width center block: 900px

### 3.5 Hero Height

- Desktop: `min-height: 440px` — tall enough for 2-line titles and 5 pills
- Mobile: `min-height: 320px` — shorter, single-line title wraps naturally
- Content vertically centered with `display: flex; align-items: center; justify-content: center`

---

## 4. Gradient Separator

Full-width `Separator variant="gradient"` between hero and body. Same as existing usage:
```
height: 1px;
background: linear-gradient(to right, transparent, var(--primary), transparent);
```

---

## 5. Three-Column Body Layout

### 5.1 Grid Structure

```css
display: grid;
grid-template-columns: 200px 1fr 260px;
gap: 0;
max-width: 1280px;       /* wider than current --container-wide (1152px) */
margin: 0 auto;
padding: 40px 32px;
```

The center column has subtle `1px solid rgba(foreground, 0.04)` borders on left and right, with `32px` horizontal padding inside.

### 5.2 Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| `>= lg` (1024px) | Full three-column grid |
| `< lg` | Single column — TOC becomes floating pill, glanceable panel collapses above content, sections stack vertically |

---

## 6. Left Column — Sticky Table of Contents

### 6.1 Container

Wrap in `StickyPanel top="5rem"` (80px — below nav). Padding-right: 24px.

### 6.2 Header

`SectionLabel variant="section"` — text: "On this page", mono 10px, letter-spacing 2px, `rgba(primary, 0.35)`, uppercase. Margin-bottom: 20px.

### 6.3 TOC Navigation

Use the existing `TableOfContents` component in `embedded` mode, adapted to work with section data rather than raw HTML. The TOC must:

- List all `project.sections[]` titles as top-level items
- Nest any sub-sections (h3 headings within a section's content) as indented children
- If `readmeHtml` exists, include "README" as the final top-level entry
- Track scroll position with IntersectionObserver to highlight the active section

**Visual treatment:**

| Element | Style |
|---------|-------|
| Container | `border-left: 2px solid rgba(primary, 0.12)`, `padding-left: 16px` |
| Active item | `color: var(--primary)`, `font-weight: 600`, active dot (6px circle, primary, positioned on the border-left line at -17px) |
| Inactive item | `color: var(--text-muted)` (35% foreground), cursor: pointer |
| Sub-items | `padding-left: 16px`, `font-size: 13px`, `color: rgba(foreground, 0.2)` |
| Font | `var(--font-heading)`, 14px, `line-height: 2.6` |

### 6.4 Section Counter

Below the nav, 24px margin-top:
- 6px orange dot with `box-shadow: 0 0 8px rgba(primary, 0.4)` (pulsing glow)
- Text: `SEC {current} / {total}`, mono 9px, `rgba(primary, 0.3)`, letter-spacing 1.5px

### 6.5 Hide Below lg

The entire left column is hidden below 1024px. It is replaced by the floating TOC pill (see Section 9.2).

---

## 7. Center Column — Dynamic Sections

### 7.1 Section Rendering

Sections render from `project.sections[]`. Each section has:

```typescript
interface ProjectSection {
  title: LocalizedString;
  content: LocalizedString;
  // Future: subsections, media slots, code blocks
}
```

### 7.2 Section Heading

Each section heading is an `h2` with a numbered badge:

```
[Badge variant="number" — mono 11px, rgba(primary, 0.4), 
 border 1px solid rgba(primary, 0.15), radius 4px, padding 3px 8px]
 
 Section Title — Inter 24px, weight 700, var(--foreground), 
 letter-spacing -0.01em
```

Gap between badge and title: 12px (flex, align-items center).
Margin-bottom: 20px.

### 7.3 Section Body Text

- Font: `var(--font-heading)`, 17px for main paragraphs, 16px for sub-section paragraphs
- Color: `rgba(foreground, 0.55)` for primary text, `0.45` for sub-section text
- Line-height: 1.9
- Max-width: 680px (prevents ultra-wide lines in the fluid center column)
- Margin-bottom between sections: 48px

### 7.4 Sub-Sections (h3)

When a section's content contains sub-headings. In the current data model, sub-sections are defined by rendering section content as markdown and extracting h3 tags. For now, all sub-section detection happens at render time by parsing the section's HTML output for `<h3>` elements — no data model change needed:

```
h3 — Inter 18px, weight 600, rgba(foreground, 0.8)
padding-left: 12px
border-left: 3px solid rgba(primary, 0.25)
margin: 24px 0 16px (top/bottom)
```

Sub-sections appear in the TOC as nested indented items.

### 7.5 Content Slots

Sections can contain mixed content types. The rendering engine should support:

| Content Type | Treatment |
|-------------|-----------|
| **Text** | Paragraph styling as above |
| **Diagram/Image placeholder** | Dashed border container (`1px dashed rgba(primary, 0.1)`), `var(--muted)` background, `border-radius: 8px`, centered placeholder text in mono. Height varies: 200-300px |
| **Code block** | `background: #0a0a0a`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `padding: 20px`. Font: `var(--font-mono)`, 14px, `line-height: 2`. SQL keywords highlighted at `rgba(primary, 0.75)`, comments at `rgba(foreground, 0.25)` |
| **Screenshot** | Same container as diagram but with gradient background: `linear-gradient(135deg, #0a0a0a, var(--manifesto))`. Larger height for product screenshots (260-300px) |

### 7.6 README Section

If `project.readmeUrl` exists and `readmeHtml` is loaded:

- Section heading uses the GitHub SVG icon (18x18, primary color) instead of a number badge
- Title: "README"
- Content: rendered markdown HTML with `prose-dark` styling (existing)
- Appears as the last section in the TOC

### 7.7 Default Sections Template

When a project has no custom `sections[]`, use these defaults as a content guide:

| # | Title | Purpose | Content Slots |
|---|-------|---------|--------------|
| 01 | The Problem | What challenge existed | Text |
| 02 | The Approach | How you solved it | Text + diagram placeholder + sub-sections (Data Flow, Schema Design, etc.) |
| 03 | The Build | Technical deep dive | Text + code blocks + sub-sections (pipeline, monitoring, etc.) |
| 04 | The Result | Final product showcase | Screenshot placeholder + text |
| 05 | README | GitHub readme | Markdown HTML (if `readmeUrl` exists) |

Projects are free to define any number of sections with any titles. The defaults serve as a content capture guide.

---

## 8. Right Column — Glanceable Data Panel

### 8.1 Container

Wrap in `StickyPanel top="5rem"`. Padding-left: 24px. `max-height: calc(100dvh - 8rem)`, `overflow-y: auto`.

### 8.2 Sections

Each section in the panel has a consistent structure:

- **Label**: `SectionLabel variant="section"` — mono 10px, letter-spacing 2px, `rgba(primary, 0.35)`, uppercase, weight 500, margin-bottom 10px
- **Divider**: `height: 1px; background: linear-gradient(to right, rgba(primary, 0.12), transparent)`, margin 24px vertical

**Panel sections in order:**

#### 8.2.1 Overview

`project.description` rendered as a paragraph.
- Font: 15px, `rgba(foreground, 0.5)`, line-height 1.7

#### 8.2.2 Impact

Uses `MetricDisplay` primitives in a 2-column grid (`gap: 16px`):

| Prop | Value |
|------|-------|
| `value` | `project.impactMetric.value` (e.g., "30s") |
| `label` | (below, mono 10px, `rgba(foreground, 0.3)`) |
| `size` | `"md"` — renders value at 28px, weight 800 |
| Colors | First metric: `var(--primary)`. Second metric: `var(--accent)`. Alternate if more. |

If the project has no `impactMetric`, this section is hidden.

#### 8.2.3 Stack

`project.stack` rendered as `Badge variant="tag" size="xs"`:
- `padding: 4px 10px`, `border: 1px solid var(--border-subtle)`, `border-radius: 4px`
- Font: `var(--font-mono)`, 12px, `rgba(foreground, 0.5)`
- Flex-wrap, gap 6px

#### 8.2.4 Services

`relatedServices` rendered as linked items:
- Each: station number badge (24x24, border `rgba(primary, 0.15)`, mono 10px center) + service title
- Font: 13px, `rgba(primary, 0.65)`
- Links to `/services/{id}`
- Gap: 8px between items

If no related services, this section is hidden.

#### 8.2.5 Links

External links (`project.liveUrl`, `project.repoUrl`):
- Live Site: arrow-up-right SVG icon (14x14) + text
- GitHub: GitHub SVG icon (14x14) + text
- Font: `var(--font-mono)`, 13px, `var(--primary)`
- Gap: 8px between links

If neither URL exists, this section is hidden.

### 8.3 Hide Below lg

The entire right column is hidden below 1024px. Content moves to the collapsible mobile panel (Section 9.1).

---

## 9. Mobile Layout (`< 1024px`)

### 9.1 Collapsible Glanceable Panel

Positioned between the gradient separator and the content sections.

**Collapsed state:**
- Full-width button with flex `space-between`
- Left: "Project Info" label (`SectionLabel` style) + inline metric preview (first 2 `MetricDisplay` values at 16px, primary/accent colors)
- Right: `ChevronToggle` (rotates on expand)
- Background: `rgba(primary, 0.015)`
- Border-bottom: `1px solid var(--border-subtle)`
- Padding: 14px 20px

**Expanded state (Collapsible from bits-ui):**
- Padding: 0 20px 20px
- Overview text (14px, line-height 1.6)
- Metrics row (flex, `MetricDisplay size="sm"` — values at 24px, with 1px accent dividers)
- Stack tags (flex-wrap, `Badge variant="tag" size="xs"`)
- Links row (flex, mono 12px, primary color)
- Smooth grid-row CSS animation (same as `CollapsibleSection`)

### 9.2 Floating TOC Pill

Fixed to the bottom center of the viewport. Shows when content sections are in view (i.e., scrolled past the hero).

**Design:**
- Background: `rgba(20, 20, 20, 0.95)` with `backdrop-filter: blur(8px)`
- Border: `1px solid rgba(primary, 0.2)`
- Border-radius: `var(--radius-pill)` (9999px)
- Padding: 8px 20px
- Content: orange dot (6px) + current section name (mono 11px, `rgba(foreground, 0.5)`) + counter ("1/5", mono 9px, `rgba(primary, 0.3)`) + `ChevronToggle` (12px)
- Tap action: opens a bottom drawer/sheet with the full TOC list
- Z-index: `var(--z-sheet)` — above content, below nav

### 9.3 Mobile Hero

- `min-height: 320px`
- No edge metadata text (hidden)
- Corner marks at 8px inset, 16px size
- Circuit grid at 60px tile size (denser on smaller screen)
- Title: 32px (drops from clamp), single line wraps naturally
- Pills: 10px font, 4px 12px padding, tighter gaps (6px)
- Terminal prompt: 8px, letter-spacing 1px

### 9.4 Mobile Content Sections

- Section headings: h2 at 20px
- Body text: 16px, line-height 1.8
- Sub-section h3: 16px, weight 600
- Diagram placeholders: 160px height
- Padding: 20px
- Margin-bottom between sections: 36px

---

## 10. Accent Line

A thin vertical accent line runs the full height of the page on the left edge.

| Property | Desktop | Mobile |
|----------|---------|--------|
| Width | 4px | 3px |
| Color | `var(--primary)` solid at top, fading to transparent |
| Gradient | `linear-gradient(to bottom, primary 0%, primary 20%, rgba(primary, 0.3) 40%, transparent 80%)` | Same but shorter fade: `primary 15%, rgba 30%, transparent 60%` |

Implementation: CSS grid `grid-template-columns: 4px 1fr` (3px on mobile) wrapping the entire page.

---

## 11. Animation Plan

| Element | Animation | Trigger | Notes |
|---------|-----------|---------|-------|
| Hero background layers | Opacity 0→1, staggered (circuit grid → glow → edges → transit elements) | ScrollTrigger `start: 'top 80%'` or page load | Same timeline structure as `Manifesto.svelte` |
| Center title | SplitText char reveal, `y: 20→0`, `opacity: 0→1`, `stagger: 0.02` | Part of hero timeline | Uses GSAP SplitText |
| Tech pills | `opacity: 0→1`, `y: 15→0`, `stagger: 0.1` | Part of hero timeline, after title | Same as manifesto pills |
| Section headings | `reveal` action, `direction: 'up'`, staggered delay | Scroll into view | Existing `reveal` action |
| Sidebar tags | GSAP stagger `y: 8→0`, `opacity: 0→1`, `back.out(1.4)` | Page mount | Same as existing `ProjectDetailSidebar` |
| Mobile panel expand | CSS grid-row animation | Toggle click | bits-ui Collapsible (existing pattern) |
| Floating TOC pill | Fade in/out based on scroll position | IntersectionObserver on hero bottom | Show when hero scrolls out of view |

---

## 12. Data Layer Requirements

### 12.1 Project Type Extensions

The existing `Project` type needs optional fields for hero metadata generation:

```typescript
interface Project {
  // Existing fields (unchanged)
  slug: string;
  title: LocalizedString;
  oneLiner: LocalizedString;
  description: LocalizedString;
  stack: string[];
  sections: ProjectSection[];
  impactMetric?: ImpactMetric;
  relatedServices: string[];
  liveUrl?: string;
  repoUrl?: string;
  readmeUrl?: string;
  status: 'public' | 'private';
  featured: boolean;

  // New optional fields for hero metadata
  location?: string;          // e.g., "sherbrooke" — defaults to "sherbrooke"
  environment?: string;       // e.g., "production" — defaults to "production"
  version?: string;           // e.g., "2.4.1" — defaults to "1.0.0"
}
```

### 12.2 Stack Role Mapping

A utility function to map tech stack items to role labels for the right edge metadata:

```typescript
const STACK_ROLE_MAP: Record<string, string> = {
  'PostgreSQL': 'DB',
  'SQL Server': 'DB',
  'Python': 'ETL',
  'dbt': 'TRANSFORM',
  'Power BI': 'VIZ',
  'Airflow': 'ORCH',
  'Retool': 'UI',
  'SvelteKit': 'FE',
  'TypeScript': 'LANG',
  'Tailwind CSS': 'STYLE',
  'Vercel': 'DEPLOY',
  // ... extend as needed
};

function getStackRole(tech: string): string {
  return STACK_ROLE_MAP[tech] ?? tech.toUpperCase().slice(0, 6);
}
```

### 12.3 Impact Metrics (Multiple)

Currently `impactMetric` is a single optional `ImpactMetric`. For the glanceable panel to show 2+ metrics (as in the mockup), either:
- **Option A**: Change to `impactMetrics: ImpactMetric[]` (breaking change, requires updating all project data)
- **Option B**: Add `impactMetrics?: ImpactMetric[]` alongside existing `impactMetric` (backwards compatible, prefer this)

The panel renders all entries from `impactMetrics` (or falls back to the single `impactMetric` wrapped in an array). Metrics alternate primary/accent colors.

---

## 13. Primitives Reuse Map

| Page Zone | Primitive | Source |
|-----------|-----------|--------|
| Hero background | Circuit grid CSS (extracted from `Manifesto.svelte`) | `src/lib/components/home/Manifesto.svelte` |
| Hero corners | `CornerMarks size="md"` | `src/lib/components/brand/CornerMarks.svelte` |
| Hero glow | `GlowOverlay` + `cursorGlow` action | `src/lib/components/brand/GlowOverlay.svelte` |
| Hero cursor | `TerminalCursor` | `src/lib/components/shared/TerminalCursor.svelte` |
| Hero pills | `Badge variant="tag"` with pill radius | `src/lib/components/ui/badge/badge.svelte` |
| Hero back link | `boop` action | `src/lib/motion/actions/boop.ts` |
| Separator | `Separator variant="gradient"` | `src/lib/components/ui/separator/separator.svelte` |
| TOC wrapper | `StickyPanel top="5rem"` | `src/lib/components/brand/StickyPanel.svelte` |
| TOC content | `TableOfContents embedded` (adapted) | `src/lib/components/shared/TableOfContents.svelte` |
| Section numbering | `Badge variant="number"` | `src/lib/components/ui/badge/badge.svelte` |
| Panel labels | `SectionLabel variant="section"` | `src/lib/components/brand/SectionLabel.svelte` |
| Panel metrics | `MetricDisplay size="md"` | `src/lib/components/brand/MetricDisplay.svelte` |
| Panel tags | `Badge variant="tag" size="xs"` | `src/lib/components/ui/badge/badge.svelte` |
| Panel services | `ServiceBadge` | `src/lib/components/projects/ServiceBadge.svelte` |
| Mobile expand | `Collapsible` (bits-ui) + `ChevronToggle` | `src/lib/components/ui/collapsible/`, `src/lib/components/brand/ChevronToggle.svelte` |
| Section reveal | `reveal` action | `src/lib/motion/actions/reveal.ts` |
| Hero animations | GSAP `ScrollTrigger` + `SplitText` | `src/lib/motion/utils/gsap.ts` |

---

## 14. Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/components/projects/ProjectDetailHero.svelte` | Manifesto-style hero with auto-generated edge metadata |
| `src/lib/components/projects/ProjectGlancePanel.svelte` | Right sidebar glanceable data panel (overview, metrics, stack, services, links) |
| `src/lib/components/projects/ProjectGlancePanelMobile.svelte` | Mobile collapsible version of the glance panel |
| `src/lib/components/projects/ProjectTocPill.svelte` | Mobile floating TOC pill with drawer |
| `src/lib/data/stackRoles.ts` | Stack-to-role mapping utility for hero edge metadata |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/components/projects/ProjectDetailPage.svelte` | Complete rewrite — new three-column layout, hero integration, TOC placement |
| `src/lib/components/projects/ProjectDetailSidebar.svelte` | Replaced by `ProjectGlancePanel` — delete or repurpose |
| `src/lib/data/types.ts` | Add `location?`, `environment?`, `version?` to Project. Add `impactMetrics?: ImpactMetric[]` |
| `src/lib/data/projects.ts` | Add new optional fields to project data entries |
| `src/routes/projects/[slug]/+page.svelte` | Minimal — just passes data to rewritten `ProjectDetailPage` |
| `src/routes/projects/[slug]/+page.ts` | May need to pass additional data for hero metadata |

### Potentially Extractable (for blog detail later)

| Component | Shared Pattern |
|-----------|---------------|
| Hero background (circuit grid + glow + corners) | Could become `ManifestoHeroShell` |
| Three-column layout (TOC + content + sidebar) | Could become `DetailLayout` shell |
| Floating TOC pill | Shared between project and blog mobile |

These extractions happen in the consolidation pass, NOT in this slice.

---

## 15. Acceptance Criteria

1. Hero renders with manifesto background (circuit grid, warm glow, corner marks, cursor glow)
2. Edge metadata auto-generates from project data (slug, stack, location, metrics)
3. Edge metadata hidden on mobile (`< 1024px`)
4. Title renders in `text-display` size, orange, uppercase, centered
5. Tech pills render from `project.stack` in manifesto pill style
6. Terminal prompt shows with blinking cursor
7. Three-column layout below hero: TOC (200px left), content (flex), glance panel (260px right)
8. TOC tracks scroll position and highlights active section with orange dot
9. TOC shows sub-sections (h3) nested and indented
10. Sections render dynamically from `project.sections[]`
11. Section headings have numbered badges (01, 02, 03...)
12. Sub-sections have orange left border accent
13. Glance panel shows: overview, impact metrics (MetricDisplay), stack tags, services, links
14. Glance panel sections hide when data is empty
15. Mobile: both sidebars hidden, replaced by collapsible panel + floating TOC pill
16. Collapsible panel shows inline metric preview when collapsed
17. Floating TOC pill shows current section name + counter, opens drawer on tap
18. `reveal` animations on section headings
19. Hero entrance animation (GSAP timeline: grid → glow → edges → title chars → pills)
20. All text sizes match mockup (h2: 24px, body: 17px, sub-h3: 18px, code: 14px)
21. `bun run check` passes with 0 errors
22. All existing tests continue to pass
