# Hero Text Redesign — Design Spec

**Slice:** 13d
**Date:** 2026-04-10
**Status:** Approved by Yesid
**Reference mockup:** `docs/specs/hero-v4-approved-reference.html`
**Brainstorm session:** `.superpowers/brainstorm/471-1775835572/`

---

## Problem

After the metro SVG animation zooms into the orange dot and reveals the "yesid." wordmark, the hero text section ("DIGITAL INFRA. BUILT RIGHT." + SQL decoration) feels empty and generic. The animation builds incredible momentum, then the text reveal doesn't match that energy. The manifesto section below delivers the real statement — the hero text is a weak middle.

## Design Principle

**Carnegie: "Start with what THEY want to hear, not what you want to say."**

The hero must lead with what visitors gain — Upwork clients want reliable outcomes, Alto/CDPQ want proven infrastructure capability. The hero is not a manifesto (that's below the hard cut). It's a **proof moment** — tagline + live data + real SQL.

## Research Basis

- **Digital Flagship model:** Hero = tagline + work proof woven between text lines. Separate manifesto section with color break below.
- **Early-career positioning research:** The site itself IS the proof. Lead with outcomes and trust signals. Never mention what you lack.
- **7-site findings (docs/research/findings.md):** Text-as-architecture, variable size rhythm, never-flat-dark.
- **Transit pipeline (C:\Users\otalo\Yesito\Projects\transit):** Production-grade GTFS/GTFS-RT pipeline with 5-schema Postgres architecture on Neon, running 30s refresh cycles. Real data.

---

## Approved Design

### Layout: Two-column grid with vertical divider

```
┌──────────────────────────────────────────────────────────────────┐
│  PIPELINES THAT                    │  yesid@transit:gold>  ● LIVE │
│                                    │                              │
│  ┌─────────┐ ┌─────────┐ ┌──────┐ │  SELECT                      │
│  │VEHICLES │ │AVG DELAY│ │ROUTES│ │    d.route_short_name,        │
│  │ 1,247   │ │ 47.3s   │ │ 186  │ │    round(avg(f.delay...      │
│  │STM·LIVE │ │87.6%COV │ │/203  │ │  FROM gold.latest_trip...    │
│  └─────────┘ └─────────┘ └──────┘ │  JOIN gold.dim_route d ...    │
│                                    │  WHERE f.delay_seconds ...    │
│  DON'T BREAK.                      │  GROUP BY ... ORDER BY ...    │
│  Data that tell the truth.         │  LIMIT 5;                     │
│                                    │  ─────────────────────────    │
│  Building reliable infrastructure  │  route  avg_delay_s  vehicles │
│  for teams that can't afford       │  24     32.1         28       │
│  downtime.                         │  80     51.7         24       │
│                                    │  121    18.4         22       │
│  [See how I build →] [Let's talk]  │  51     44.9         19       │
│                                    │  165    27.6         17       │
│                                    │  5 rows · 0.023s · 30s ago   │
├──────────────────────────────────────────────────────────────────┤
│              [ ↻ PULL FRESH DATA ]                               │
│     Refreshes metrics + query results from the live pipeline     │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (stacked)

```
┌─────────────────────┐
│ PIPELINES THAT      │
│ [VEHICLES][DELAY][R]│  ← horizontal scroll
│ DON'T BREAK.        │
│ Data that tell the  │
│ truth.              │
│                     │
│ subtitle...         │
│                     │
│ ┌─ SQL PANEL ─────┐ │
│ │ yesid@transit:.. │ │
│ │ SELECT ...       │ │
│ │ route  delay     │ │
│ │ 24     32.1s     │ │
│ │ 80     51.7s     │ │
│ │ 121    18.4s     │ │
│ └─────────────────┘ │
│ [↻ PULL FRESH DATA] │  ← full width
│ [See how I build][Talk]│
└─────────────────────┘
```

---

## Content

### Headline

```
PIPELINES THAT
[metric cards]
DON'T BREAK.
Data that tell the truth.
```

- "PIPELINES THAT" — white `#f5f5f0`, Inter 900, `clamp(48px, 6vw, 84px)`
- "DON'T BREAK." — brand orange `#E07800`, same size
- "Data that tell the truth." — muted `#999`, `clamp(20px, 2.5vw, 34px)`, Inter 700
- Variable size rhythm: ~2.5x ratio between headline and subheadline

### Metric Cards (3 across)

| Card | Label | Source (Gold KPI view) | Mock value |
|------|-------|----------------------|------------|
| VEHICLES TRACKED | `kpi_active_vehicles_latest.active_vehicle_count` | 1,247 |
| AVG DELAY | `kpi_avg_trip_delay_latest.avg_delay_seconds` | 47.3s |
| ROUTES LIVE | `kpi_routes_with_live_vehicles_latest.routes_with_live_vehicles` | 186 |

Card style:
- Background `#1e1e1e`, border `#3a3a3a`, radius 10px
- Label: JetBrains Mono 9px, `#666`, letter-spacing 2px
- Value: Inter 800, `#E07800`, clamp(28px, 2.5vw, 36px)
- Sub-label: JetBrains Mono 9px, `#4a4a4a`
- Hover: border transitions to `#E07800`

### SQL Panel

- Background `#0a0a0a`, border `#2a2a2a`, radius 12px
- Prompt: `yesid@transit:gold>` in JetBrains Mono 11px `#666`
- Green LIVE dot: `#22c55e` with `box-shadow: 0 0 6px` and pulse animation
- Query text: JetBrains Mono 12px, syntax-highlighted:
  - Keywords (`SELECT`, `FROM`, `JOIN`, etc.): `#E07800`
  - Table names (`gold.latest_trip_delay_snapshot`, `gold.dim_route`): `#FFB627`
  - Column names: `#999`
- Results table: 3 columns (route, avg_delay_s, vehicles), column headers `#666`
- Meta line: "5 rows · 0.023s · updated 30s ago" in `#4a4a4a`

**The actual SQL query:**
```sql
SELECT
  d.route_short_name,
  round(avg(f.delay_seconds)::numeric, 1) AS avg_delay_s,
  count(DISTINCT f.vehicle_id) AS vehicles
FROM gold.latest_trip_delay_snapshot f
JOIN gold.dim_route d
  USING (provider_id, route_id)
WHERE f.delay_seconds IS NOT NULL
GROUP BY d.route_short_name
ORDER BY vehicles DESC
LIMIT 5;
```

### Vertical Divider (desktop only)

- 1px wide, gradient fade at top and bottom
- `linear-gradient(180deg, transparent 0%, #3a3a3a 15%, #3a3a3a 85%, transparent 100%)`
- Hidden on mobile (< 768px)

### Refresh Button

- **Full-width centered** below the two-column grid
- Orange gradient: `linear-gradient(135deg, #E07800, #C96A00)`
- Text: "↻ PULL FRESH DATA" in JetBrains Mono 800, 15px, letter-spacing 2px
- Glow: `box-shadow: 0 0 24px rgba(224,120,0,0.3), 0 4px 12px rgba(0,0,0,0.4)`
- Hover: intensified glow + translateY(-1px)
- Helper text below: "Refreshes metrics + query results from the live pipeline" in JetBrains Mono 10px `#4a4a4a`
- Mobile: full width, same prominence

### CTAs

- Primary: "See how I build →" — `#E07800` bg, `#141414` text, 14px 700
- Secondary: "Let's talk" — border `#3a3a3a`, white text, hover orange

### Subtitle

"Building reliable infrastructure for teams that can't afford downtime."
- `#999`, 15px, line-height 1.7

---

## Data Architecture

### Phase 1 (this slice): Mock data with API-ready interface

```typescript
interface HeroMetrics {
  vehicles: number;      // kpi_active_vehicles_latest
  avgDelay: number;      // kpi_avg_trip_delay_latest (seconds)
  delayCoverage: number; // percentage
  routesLive: number;    // kpi_routes_with_live_vehicles_latest
  routesTotal: number;   // gold.dim_route count
}

interface HeroQueryResult {
  route: string;         // route_short_name
  avgDelayS: number;     // avg delay in seconds
  vehicles: number;      // distinct vehicle count
}
```

**Mock data generation (constrained randomization):**
- Vehicles: random int 900–1500
- Avg delay: random float 20–90 (1 decimal)
- Routes live: random int 160–203
- Query results: 5 random routes from real STM route list, delay 10–80, vehicles 8–35
- Query time: random float 0.015–0.045

**Refresh behavior:**
1. Click "PULL FRESH DATA"
2. Spin icon animation (360° rotation, 0.6s)
3. Try API fetch (future Phase 2)
4. On API error/timeout (>3s): generate mock data within constrained bounds
5. Update all metric cards + SQL results simultaneously
6. Update meta line to "just now"

### Phase 2 (future): Wire to live transit API

- API endpoint on Oracle VM (Postgres)
- Three KPI queries → metric cards
- One route summary query → SQL panel results
- Fallback to Phase 1 mock data on any failure
- Visitor never sees loading/error states

---

## Site-wide Circuit Grid Background

**Approved addition:** The subtle orange circuit grid background from the hero should appear on ALL page sections site-wide, except the navbar and footer.

```css
/* New CSS token or utility */
.circuit-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(224,120,0,0.025) 0px, transparent 1px, transparent 80px),
    repeating-linear-gradient(0deg, rgba(224,120,0,0.025) 0px, transparent 1px, transparent 80px);
  pointer-events: none;
  z-index: 0;
}
```

Implementation: add as a global background in `app.css` or as a layout-level element that excludes nav and footer. Details TBD in implementation plan.

---

## Responsive Breakpoints

| Breakpoint | Layout | Headline | Metrics |
|-----------|--------|----------|---------|
| ≥768px (desktop) | Two-column grid with divider | `clamp(48px, 6vw, 84px)` | 3-col grid |
| <768px (mobile) | Stacked, full-width | `34px`, "PIPELINES THAT" on one line | Horizontal scroll flex |

---

## Integration with Existing Hero Animation

The hero text reveal is the PAYOFF of the metro SVG animation. The transition must be seamless.

### Animation sequence (scroll-driven, existing phases preserved)

```
Phase 1-5:  Metro SVG draws, stations appear, labels fade in
Phase 5:    Zoom into Berri-UQAM → orange fills viewport
Phase 6:    Cross-fade SVG → heroTextContainer (both orange, seamless)
            At this point, the "." in "DON'T BREAK." fills the entire screen.
            The "." is the TRANSFORM-ORIGIN for the zoom-out.
Phase 7:    Zoom out from "." → "DON'T BREAK." line appears first
            Continue zoom → "PIPELINES THAT" + metrics + SQL panel reveal
Phase 8:    Stagger animation on individual elements:
            Stagger 1: headline lines ("PIPELINES THAT", "DON'T BREAK.")
            Stagger 2: subheadline ("Data that tell the truth.")
            Stagger 3: metric cards (left → right with slight delay)
            Stagger 4: SQL panel (fade + slide from right)
            Stagger 5: divider (fade in)
            Stagger 6: subtitle + CTAs
            Stagger 7: refresh button (last, fade up)
Phase 9:    Hold — hero fully visible, user reads + can interact
```

### Key constraint: the "." dot

The orange "." in "DON'T BREAK**.**" serves as:
1. The zoom-out transform-origin (matching the Berri-UQAM dot position)
2. The visual bridge between the metro animation and the hero text
3. The brand dot (always `#E07800`, per brand guide)

`heroTextContainer` starts scaled up so the "." fills the viewport (same as current behavior with `calcHeroTextScale()`). The transform-origin is calculated from the "." glyph's rendered position using `getDotGlyphCenter()` (existing function in HeroBanner.svelte).

### What changes vs current

| Aspect | Current | New |
|--------|---------|-----|
| Text container content | "DIGITAL INFRA. BUILT RIGHT." + SQL decoration | New two-column layout |
| Dot location | "." after "INFRA" on line 2 | "." after "DON'T BREAK" |
| Stagger elements | Badge, headline, subtitle, CTAs, SQL code | Headlines, metrics, SQL panel, CTAs, refresh |
| `data-hero-stagger` groups | 4 groups | 7 groups |
| Static content after zoom | Left text + right SQL code | Left hero + divider + right SQL panel |

### What stays the same

- Phases 1-6 (metro SVG animation) — untouched
- `pinContainer` structure — untouched
- `heroTextContainer` wrapper — kept, contents replaced
- `calcHeroTextScale()` and `getDotGlyphCenter()` — same logic, new dot element
- ScrollTrigger configuration (800% scroll distance) — untouched
- Scroll lock during typewriter — untouched
- `normalizeScroll` — untouched

---

## Acceptance Criteria

1. Desktop: two-column layout with headline+metrics+CTAs left, SQL panel right, divider between
2. "PIPELINES THAT" full width of left column, metrics 3-across directly below
3. SQL panel top-aligned with "PIPELINES THAT"
4. Real SQL query syntax-highlighted with Gold layer table names
5. "PULL FRESH DATA" button refreshes both metrics and SQL results
6. Mock data within constrained bounds (realistic STM numbers)
7. Mobile: stacked layout, "PIPELINES THAT" on one line, horizontal scroll metrics
8. Circuit grid background visible on all pages except nav/footer
9. GSAP stagger reveal animation on hero text (zoom-out from metro animation)
10. Reduced motion: static display, no animations, all content visible

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/lib/components/HeroBanner.svelte` | Replace hero text container with new layout |
| `src/lib/data/content.ts` | Update `heroContent` with new text + metric data |
| `src/lib/data/content.test.ts` | Update tests |
| `src/lib/components/HeroSqlPanel.svelte` | NEW — SQL panel component |
| `src/lib/components/HeroMetrics.svelte` | NEW — metric cards component |
| `src/app.css` | Add circuit grid background site-wide |
| `src/lib/styles/tokens.css` | Add any new tokens |
| `docs/reference/CSS.md` | Document new tokens/patterns |
| `src/routes/home.test.ts` | Update hero tests |

---

## Out of Scope

- Live API integration (Phase 2, future slice)
- Changes to the metro SVG animation (Phases 1-6)
- Changes to the manifesto section
- Changes to the hard cut transition
