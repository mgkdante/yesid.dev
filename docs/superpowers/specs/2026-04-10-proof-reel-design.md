# Proof Reel — Design Spec

**Slice:** 13f
**Date:** 2026-04-10
**Status:** Approved by Yesid
**Reference mockup:** `.superpowers/brainstorm/905-1775861785/content/01-proof-reel-design.html`

---

## Problem

After the hero (proof moment with live transit data + SQL) and manifesto (personal statement + capability pills), the home page needs to show breadth — that the transit pipeline isn't a one-off. The Proof Reel is Section 3: a fast, scannable display of 3 featured projects with prominent impact metrics, linking into `/work/[slug]` detail pages.

## Design Principle

**Act 2 of the page rhythm.** The research scan of 6 Awwwards sites (digitalflagship, byfrontyard, daveholloway, jasminegunarto, raviklaassens, shader.se) showed every site follows a 3-act structure: Act 1 (Identity: hero + manifesto), Act 2 (Proof: work display), Act 3 (Close: CTA). The Proof Reel is the start of Act 2 — same dark background, circuit grid, terminal aesthetic. No color break (that's reserved for Services in a later sub-slice).

## Research Basis

- **Page rhythm rule:** Every Awwwards site has exactly ONE dramatic "break" section dividing the page into acts. The Proof Reel stays in the dark palette.
- **Typography scale:** Card/item text target from scan: `clamp(1.5rem, 3vw, 2.5rem)`. Body at 1rem.
- **Animation pattern:** Staggered entrance (digitalflagship, daveholloway) — not pinned scrub — to give the visitor a breeze after the dense hero + manifesto pins.
- **Hero already features transit:** The hero SQL panel + metrics showcase the transit pipeline's live data. The Proof Reel shows the same project from a different angle (impact story, not live data) plus two additional projects to demonstrate breadth.

---

## Approved Design

### Data Model Change

Add an `impactMetric` field to the `Project` interface in `types.ts`:

```typescript
export interface ImpactMetric {
  value: string;       // "30s", "15 min", "500 GB"
  label: string;       // "Real-time refresh cycles", "Zero-downtime migration"
  before?: string;     // Optional: "2 days" (for before/after display)
}

export interface Project {
  // ... existing fields ...
  impactMetric?: ImpactMetric;  // Optional — not all projects have one yet
}
```

This is a long-term investment: every future project will include structured metrics.

### Featured Projects (3 cards)

| Project | Slug | Hero Metric | Before | Supporting Line | Stack |
|---------|------|-------------|--------|-----------------|-------|
| Transit Operations Data Pipeline | `transit-data-pipeline` | **30s** | — | Real-time refresh cycles | PostgreSQL, Python, dbt, Power BI |
| Lorem Analytics Dashboard | `lorem-analytics-dashboard` | **15 min** | ~~2 days~~ | Reporting across 12 departments | Power BI, SQL Server, Python, DAX |
| Lorem Database Migration | `lorem-database-migration` | **500 GB** | — | Zero-downtime migration | PostgreSQL, Python, Alembic, MySQL |

### Card Anatomy

```
┌─────────────────────────────────┐
│  30s                            │  ← metric: Inter Black, #E07800, 48px desktop / 36px mobile
│  Real-time refresh cycles       │  ← label: Inter, #999, 14px / 13px
│                                 │
│  Transit Operations             │  ← title: Inter Bold, #F5F5F0, 20px / 17px
│  Data Pipeline                  │
│                                 │
│  PostgreSQL  Python  dbt        │  ← tags: JetBrains Mono, ghost pills (orange tint)
└─────────────────────────────────┘
```

When `before` exists (Analytics Dashboard), render as:
```
  ~~2 days~~ 15 min
```
The "before" value is smaller (28px / 22px), gray (#666), strikethrough. The "after" value is the hero metric at full size.

### Card Styling

- Background: `rgba(10,10,10,0.8)` (terminal bg, semi-transparent)
- Border: `1px solid rgba(224,120,0,0.15)` (subtle orange)
- Border radius: `12px` (`--radius-lg`)
- Padding: `1.75rem` desktop / `1.25rem` mobile
- **Hover:** border brightens to `rgba(224,120,0,0.6)`, `translateY(-2px)` lift, `box-shadow: 0 8px 32px rgba(224,120,0,0.08)` glow
- **Click target:** entire card is an `<a>` to `/work/[slug]`

### Tag Pills

Same style as manifesto capability pills (terminal prompt aesthetic):
- Font: JetBrains Mono, 11px / 10px, `letter-spacing: 0.04em`
- Color: `rgba(224,120,0,0.7)`
- Border: `1px solid rgba(224,120,0,0.2)`
- Background: `rgba(224,120,0,0.05)`
- Border radius: `9999px` (pill)
- **Hover (card hover):** text brightens to 0.85, border to 0.4, bg to 0.08

### Section Layout

```
┌──────────────────────────────────────────────────────────────┐
│  // PROOF                                                     │  ← label: JetBrains Mono, 11px, rgba(224,120,0,0.5)
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Transit  │  │Analytics │  │ Database │                   │
│  │ Pipeline │  │Dashboard │  │Migration │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                               │
│                                    View all work →            │  ← JetBrains Mono, 13px, #E07800
└──────────────────────────────────────────────────────────────┘
```

- Background: `#141414` (same as page)
- Circuit grid overlay (existing `.circuit-grid` class)
- Section label: `// PROOF` — JetBrains Mono, 11px, `rgba(224,120,0,0.5)`, `letter-spacing: 3px`, uppercase
- Grid: `grid-template-columns: 1fr 1fr 1fr` with `1.5rem` gap
- "View all work →" link: right-aligned, JetBrains Mono 13px, `#E07800`, subtle underline
- Section padding: `3rem 2rem` desktop / `1.5rem 1rem` mobile

### Responsive Behavior

| Breakpoint | Layout | Metric Size | Title Size |
|------------|--------|-------------|------------|
| Desktop (≥1024px) | 3-column grid | 48px | 20px |
| Tablet (≥640px) | 2-column + 1 below (or 3 narrower) | 40px | 18px |
| Mobile (<640px) | Stacked full-width | 36px | 17px |

### Animation

**Type:** Staggered entrance (no pin). Uses GSAP ScrollTrigger `onEnter` — NOT scrub.

**Trigger:** `start: 'top 80%'` on the section container.

**Sequence:**
1. Section label (`// PROOF`) fades in: `opacity: 0 → 1`, `0.3s`
2. Cards stagger up: `y: 30, opacity: 0 → y: 0, opacity: 1`, stagger `0.15s`, duration `0.6s`, `power2.out`
3. "View all work →" link fades in: `opacity: 0 → 1`, `0.3s` after cards complete

**Reverse:** `onLeaveBack` reverses the timeline (scroll back up → cards disappear).

**Reduced motion:** All content visible immediately, no animation.

### Section-to-Page Links

| Element | Links To |
|---------|----------|
| Each card (full click target) | `/work/[slug]` |
| "View all work →" | `/work` |

---

## Data Sources

- `projects.ts` — project data (titles, slugs, stack, one-liners)
- `types.ts` — `Project` interface (modified: add `ImpactMetric`)
- New `impactMetric` field populated on 3 featured projects

The component reads projects by slug, not by `getFeaturedProjects()`. A `proofReelSlugs` constant in `content.ts` defines which 3 projects appear and in what order: `['transit-data-pipeline', 'lorem-analytics-dashboard', 'lorem-database-migration']`. The component imports this array and calls `getProjectBySlug()` for each.

---

## Out of Scope

- Changes to hero or manifesto sections
- Changes to `/work` listing or detail pages
- New CSS tokens (reuses existing terminal/brand tokens)
- Lenis changes
- Any other home page sections (Services, Blog, About, CTA)

---

## Acceptance Criteria

- [ ] `ImpactMetric` interface added to `types.ts`
- [ ] 3 featured projects have `impactMetric` populated in `projects.ts`
- [ ] `ProofReel.svelte` renders 3 cards in a responsive grid
- [ ] Each card shows: hero metric (orange, large), supporting line, title, tech stack pills
- [ ] Analytics Dashboard card shows before/after (~~2 days~~ 15 min)
- [ ] Cards are full click targets linking to `/work/[slug]`
- [ ] "View all work →" links to `/work`
- [ ] Hover: border brightens, subtle lift + glow
- [ ] Section label `// PROOF` in JetBrains Mono
- [ ] Dark background (#141414) with circuit grid
- [ ] GSAP staggered entrance on scroll (no pin)
- [ ] Reduced motion: static, all content visible
- [ ] Mobile: stacked full-width, smaller metrics/titles
- [ ] `bun run test` and `bun run check` both pass
