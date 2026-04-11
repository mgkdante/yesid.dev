# Slice 13g — Services Grid Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Mockup:** `docs/superpowers/mockups/slice-13g-services-grid.html`
**Research:** `docs/research/scroll_analysis.md`, `docs/research/persuasion_analysis.md`

## Goal

Build Section 4 of the home page: a benefit-led, data-driven services grid informed by Carnegie and Cialdini persuasion psychology. The section is the page's "exhale" — structured, scannable, and breathing — after three dense kinetic sections (Hero, Manifesto, Proof Reel).

## Design Principles

### Persuasion Framework (Carnegie + Cialdini)

1. **Benefit text leads every card** — Carnegie: "talk in terms of the other person's interests." The first thing the visitor reads is what they GET, not what you DO.
2. **Service title is the visual star** — large, yellow, bold. Scannable identification after the hook.
3. **Impact metric embeds authority** — Cialdini: precise numbers build trust. One proof point per card.
4. **Cards link to detail pages** — Cialdini foot-in-the-door: low-commitment click ("learn more"), not "hire me."
5. **You/your language** — Carnegie: people listen when you talk about them.

### Scroll Position Psychology

By Section 4, the visitor has been impressed (Hero), aligned (Manifesto), and shown proof (Proof Reel). Their internal state shifts from "Is this person impressive?" to "What can you do for ME?" The services grid answers that question with clarity, not spectacle. (See `docs/research/scroll_analysis.md` for full analysis.)

## Section Architecture

### Position & Color

- **Section 4** of home page, after Proof Reel
- **NOT the color-break section** — Manifesto already owns the Von Restorff break
- Stays on dark palette (`#141414` / `var(--bg-primary)`)
- Distinguished by **blueprint grid background** with MR-73 train technical drawing
- Separated from Proof Reel by **hard cut** (yellow/black dashed line, same pattern as other dividers)
- Separated from Blog Teaser (Section 5) by hard cut

### Layout

- **Full-bleed** — zero side constraints, no max-width. Grid stretches edge-to-edge with 32px side padding.
- **Generous vertical padding** — ~140px top and bottom (~85-90vh feel)
- **3×2 grid** on desktop (1024+), 2×3 tablet (768-1023), 1×6 stacked on mobile (<768)
- **Gap:** 20px between cards
- **Section label:** "Services" — 12px uppercase, `#666666` (--text-muted), 3px letter-spacing
- **"View all services →"** link below grid — `#999999` → `#E07800` on hover

### Component

- `HomeServices.svelte` — new component in `src/lib/components/`
- Fully data-driven from `services.ts` via `getVisibleServices()`
- Dynamic grid: adapts if services are added/removed (no hardcoded count)

## Card Design

### Per-Card Information Architecture

```
┌─────────────────────────────────────────────────┐
│ [SVG Panel]  Benefit text (white, 17px)         │
│ [80px wide   SERVICE TITLE (#FFB627, 40px,      │
│  stretches     bold 800)                        │
│  full        Metric: 24px #E07800 mono + label  │
│  height]                                        │
└─────────────────────────────────────────────────┘
```

### Typography

| Element | Size | Weight | Color | Font |
|---------|------|--------|-------|------|
| Benefit headline | 17px | 500 | `#F5F5F0` (--text-primary) | Inter |
| Service title | 40px (desktop), `clamp()` responsive | 800 | `#FFB627` (--brand-accent) | Inter |
| Impact metric value | 24px | 700 | `#E07800` (--brand-primary) | JetBrains Mono |
| Impact metric label | 13px | 400 | `#999999` (--text-secondary) | Inter |

### Card Styling

- **Background:** `rgba(10,10,10,0.8)` + `backdrop-filter: blur(6px)` — matches Proof Reel cards
- **Border:** `1px solid rgba(224,120,0,0.15)` — subtle orange tint
- **Border radius:** 12px (--radius-lg)
- **Padding:** 24px
- **Hover:** border → `rgba(224,120,0,0.6)`, box-shadow `0 8px 32px rgba(224,120,0,0.08)` (warm glow, no bg fill — matches Proof Reel hover)
- **Each card is an `<a>` tag** linking to `/services/[id]`

### SVG Panel

- **Width:** 80px, full card height (`align-self: stretch`)
- **Background:** `#1E1E1E` (--bg-surface)
- **Border:** `1px solid #3A3A3A` (--border)
- **Border radius:** 12px
- **Content:** Service SVG icon (from `static/svg/services/service-*.svg`)
- **Hover/tap interaction:** SVG morphs from geometric icon to a natural/organic shape using GSAP MorphSVGPlugin. Desktop: morph on card hover, reverse on leave. Mobile: tap toggles morph, tap again reverses.
- **SVG source files:** `static/svg/services/service-sql.svg`, `service-pipeline.svg`, `service-reporting.svg`, `service-database.svg`, `service-tooling.svg`, `service-web.svg`

## Background: Blueprint Grid + MR-73 Train

### Blueprint Grid (CSS layers)

All on `#141414` base — same color as rest of page:

1. **Major grid lines** — 160px spacing, `rgba(224,120,0,0.08)` opacity
2. **Minor grid lines** — 40px spacing, `rgba(224,120,0,0.035)` opacity
3. **Dot intersections** — 3px dots at major crossings, ~12-16% opacity
4. **Center radial glow** — `rgba(224,120,0,0.04)`, ellipse 80% × 60%

### MR-73 Train Technical Drawing (SVG)

Full-page side elevation of STM Bombardier MR-73 motor car at ~7% opacity:

- **Car body:** 17,200mm length with roof curve, floor line, center line
- **4 door pairs** (bi-parting, dashed outlines)
- **9 windows** between doors
- **2 rubber-tire bogies** with wheels, guide wheels, axles, hub detail
- **Pantograph/roof equipment** with collector shoe
- **Couplers** at both ends
- **Rail with sleepers/ties**
- **Dimension lines:** 17,200mm length, 3,500mm height, 11,800mm bogie centers, 1,200mm floor height
- **Cross-section inset** (top area): car profile, seats, 2,500mm width
- **Title block:** STM BOMBARDIER / MR-73 MOTOR CAR / SIDE ELEVATION / SCALE 1:48 / DWG MR73-001-B

### Edge Detail Panels (~8% opacity)

6 component detail drawings filling edges and corners:

| Position | Detail | Content |
|----------|--------|---------|
| Top-left | Bogie Assembly (Detail B) | Rubber tires, guide wheels, 174kW motor, third rail shoe, 2,000mm axle span |
| Top-right | Door Assembly (Detail C) | Bi-parting leaves, track rollers, threshold plate, 1,575mm width |
| Left edge | Interior Cross-Section (D-D) | Car shell, window, handrails, seats, aisle (680mm), HVAC, lighting |
| Right edge | Handrails (Detail E) | Ceiling mount, vertical pole, grab loops, strap handles, 1,200mm span |
| Bottom-left | Window Assembly (Detail F) | Double glazing, rubber seals, 1,100mm × 650mm |
| Bottom-center | Seat Module (Detail G) | Seat back, cushion, floor mounts, mirrored pair, 430mm depth |

### Engineering Annotations

- **Crosshairs** at 4 section corners (32px, 15% opacity)
- **Reference labels** in JetBrains Mono (10px, 20% opacity): "SEC-04 / SERVICES", "DWG: MR73-SIDE-ELEV", "SCALE 1:48 | REV.B", "STM / BOMBARDIER"

## Data Layer Changes

### New Fields on `Service` Type

```typescript
// Add to Service interface in src/lib/data/types.ts
benefitHeadline: LocalizedString;    // Visitor-facing outcome
impactMetric: {
  value: LocalizedString;            // e.g., "3x faster", "99.9%"
  label: LocalizedString;            // e.g., "avg query improvement"
};
```

### Benefit Headlines (Draft — will be refined during implementation)

| Service | Benefit Headline | Metric |
|---------|-----------------|--------|
| SQL Development | "Queries that run in seconds, not minutes" | 3x faster / avg query improvement |
| Data Pipelines | "Your data arrives clean, on time, every morning" | 99.9% / pipeline uptime |
| Analytics & Reporting | "Decisions in 15 minutes, not 2 days" | 2d→15m / reporting turnaround |
| Database Engineering | "Zero-downtime migrations while you sleep" | 500GB+ / migrated safely |
| Internal Tooling | "Your team stops copying between spreadsheets" | 80% / less manual data entry |
| Web Development | "A frontend that matches your backend quality" | 100 / Lighthouse performance |

## Animation

### Entrance

- **Staggered fade-up** — cards fade in + translateY(30px→0) with 100-150ms stagger
- Single ScrollTrigger, `start: 'top bottom-=50'`, `once: true`
- `gsap.set` + `gsap.to` pattern (not `gsap.from`)
- Section label and "view all" link animate in with the first/last card respectively
- `registerGsapPlugins()` called before any GSAP usage
- Respects `prefers-reduced-motion` — skip animation, show immediately

### SVG Morph (Hover/Tap)

- **Desktop:** On card hover, SVG morphs from geometric service icon to organic/natural shape. On hover leave, reverses.
- **Mobile:** First tap morphs, second tap reverses (toggle pattern, same as Proof Reel image tap).
- Uses `MorphSVGPlugin` (available, GSAP is free)
- Duration: ~0.4s, ease: `power2.inOut`
- Morph targets: existing paths in `static/svg/services/service-*.svg` files

## Responsive Behavior

| Breakpoint | Grid | Title Size | SVG Panel | Padding |
|------------|------|-----------|-----------|---------|
| Desktop (1024+) | 3 columns | 40px | 80px wide | 140px top/bottom, 32px sides |
| Tablet (768-1023) | 2 columns | `clamp(28px, 4vw, 40px)` | 70px wide | 100px top/bottom, 24px sides |
| Mobile (<768) | 1 column | `clamp(28px, 8vw, 36px)` | 70px wide | 80px top/bottom, 16px sides |

Blueprint background: train SVG hidden on mobile (< 768px), edge details hidden on tablet and below (< 1024px). Grid lines and glow persist on all breakpoints.

## Testing

- **Unit tests:** Data integrity — all services have `benefitHeadline` and `impactMetric`
- **Component tests:** HomeServices renders correct number of cards, links are correct, section label present
- **Accessibility:** Cards are `<a>` tags with meaningful text, section has heading structure
- **Reduced motion:** Animation disabled, all cards visible immediately

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/data/types.ts` | Add `benefitHeadline` and `impactMetric` to `Service` type |
| `src/lib/data/services.ts` | Add benefit headlines and metrics to all 6 services |
| `src/lib/components/HomeServices.svelte` | New component |
| `src/lib/components/HomeServices.test.ts` | New test file |
| `src/routes/+page.svelte` | Import and render HomeServices after ProofReel |
| `src/routes/home.test.ts` | Update home page tests |
| `docs/TESTS.md` | Add HomeServices tests |
| `docs/CSS.md` | Document blueprint background tokens if new ones added |
