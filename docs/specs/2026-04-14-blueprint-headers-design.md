# Blueprint Headers — Design Spec

**Date:** 2026-04-14
**Slice:** 17d-4 (Wiring + Edge-to-Edge Pass)
**Branch:** `feature/slice-17d-component-api`
**Scope:** Blog listing + Projects listing header redesign

---

## Summary

Replace the current blog listing header (big "Dispatches" heading + hero SVG icon) and the vertical hazard stripe with a Da Vincian blueprint wall — multiple overlapping infrastructure SVG drawings that fill the entire header section. Projects listing gets the same treatment with a different SVG set. EdgeRail stays with a thin accent line replacing the hazard stripe.

Each page section gets its own engineering visual vocabulary:
- **Blog** = transit operations (bridges, tracks, catenary, signals, stations, bogies)
- **Projects** = tunneling & construction (TBM, lining segments, erector, geology, ventilation, grout injection)

## Design Decisions

| ID | Decision |
|----|----------|
| D139 | Vertical hazard stripe → thin 1px accent line (`color-mix(in srgb, var(--primary) 20%, transparent)`) |
| D140 | Blog listing header: remove "Dispatches" h1, "Blog." prefix, mono subtitle, hero SVG icon |
| D141 | Blog listing header: replace with BlogBlueprint component (6 layered SVG drawings, ~240px) |
| D142 | Projects listing header: same pattern — ProjectsBlueprint component (6 layered SVG drawings, ~240px) |
| D143 | Blueprint SVGs use `currentColor`, container sets `text-[var(--primary)]` — zero hardcoded hex |
| D144 | Each SVG is an independent Svelte component for adjustable density/placement |
| D145 | Horizontal hazard stripe divider under blueprint header |
| D146 | Blog detail page does NOT get blueprint header — only listing pages |
| D147 | Personal Corner (/blog/personal) uses the same transit blueprints as professional blog |
| D148 | Mobile: EdgeRail hidden, blueprint header + "Blog."/"Projects." title merged in compact hero |
| D149 | French labels on blueprints for Montreal transit DNA (VOIE, QUAI, CATÉNAIRE, VOUSSOIRS, etc.) |
| D150 | Blog + Projects still share the same archetype (EdgeRail + accent line + listing layout) |

## Architecture

### Blog Blueprint SVGs (new)

Located in `src/lib/components/svg/`:

| Component | Subject | Notes |
|-----------|---------|-------|
| `BlueprintBridge.svelte` | Arch bridge elevation with cross-bracing, dimension lines | Full-width background layer |
| `BlueprintTrackPlan.svelte` | Track turnout, double track, platform outline, sleepers | Mid-layer, slight rotation |
| `BlueprintCatenary.svelte` | 25kV overhead wire system, poles, droppers, messenger wire | Upper area |
| `BlueprintSignal.svelte` | Two-aspect signal diagram (R/V), mounting pole | Small accent piece |
| `BlueprintStationSection.svelte` | Tunnel arch cross-section, dual platforms | Lower-right area |
| `BlueprintDetailBogie.svelte` | **Already exists** — MPM-10 bogie with springs/wheels | Reuse from ServicesBlueprint |

### Projects Blueprint SVGs (new)

| Component | Subject | Notes |
|-----------|---------|-------|
| `BlueprintTBM.svelte` | Full TBM side elevation — cutterhead, shield sections, thrust cylinders, screw conveyor, tail skin, installed voussoirs | Full-width background layer (hero drawing) |
| `BlueprintTunnelSection.svelte` | Tunnel cross-section — lining ring with labeled segments (K-A-B-C-D-E), diameter dimension | Overlapping right side |
| `BlueprintErector.svelte` | Segment erector arm mechanism, pivot, grab, arc guide | Small detail piece |
| `BlueprintGeology.svelte` | Geological strata bands — argile, calcaire, roche mère, hatching | Background texture layer |
| `BlueprintVentShaft.svelte` | Ventilation shaft, fan housing, lining marks | Vertical accent piece |
| `BlueprintGroutInjection.svelte` | Grout injection nozzle, spray pattern, pressure gauge | Small detail piece |

### Composition Components

| Component | Location | Role |
|-----------|----------|------|
| `BlogBlueprint.svelte` | `src/lib/components/blog/` | Imports 6 SVGs, positions each absolutely with opacity 3-8%, slight rotations, radial vignette mask |
| `ProjectsBlueprint.svelte` | `src/lib/components/projects/` | Same pattern, tunneling SVGs |

Pattern follows `ServicesBlueprint.svelte` exactly:
- Container: `position: relative; overflow: hidden; height: 240px;`
- Container color: `text-[var(--primary)]` (SVGs use `currentColor`)
- Each SVG: `position: absolute` with specific top/left/width/height/opacity/transform
- Vignette overlay: `radial-gradient(ellipse at center, transparent ~15%, rgba(bg, 0.6-0.7) ~80%)`

### Layout Changes

**Blog layout (`src/routes/blog/+layout.svelte`):**
- Vertical hazard stripe → thin 1px accent line (already changed in this session)
- Grid: `auto 1px 1fr` (rail + accent line + content)

**Blog listing (`BlogListingPage.svelte`):**
- SectionWrapper 1 (header): remove heading, subtitle, SVG icon → replace with BlogBlueprint
- Mobile: add "Blog." title + subtitle inside blueprint area (visible when EdgeRail hidden)
- Horizontal hazard separator stays between header and listing sections

**Projects listing (`ProjectListingPage.svelte`):**
- Same structural changes as blog listing
- ProjectsBlueprint instead of BlogBlueprint
- Mobile: "Projects." title inside blueprint area

**Projects layout (new: `src/routes/projects/+layout.svelte`):**
- Create with same pattern as blog layout
- EdgeRail "Projects." + thin accent line + content column

### What's NOT Changing

- Blog detail page — no blueprint, constitutional wiring deferred
- EdgeRail component itself — stays as-is
- SectionWrapper — stays as-is
- Filter sidebar — stays in sideLeft slot
- BlogRow / metro timeline — stays as-is
- Mobile filter / search — stays as-is
- GSAP batch entrance animations — stays as-is

## SVG Drawing Guidelines

All blueprint SVGs follow existing conventions:
- `currentColor` for all strokes — no hardcoded colors
- `fill="none"` by default (line drawings)
- French technical labels where appropriate (VOIE, QUAI, CATÉNAIRE, BOUCLIER, VOUSSOIRS, ROUE DE COUPE, ARGILE, CALCAIRE, ROCHE MÈRE, ÉRECTEUR, PUITS, VIS SANS FIN)
- Reference marks and dimension annotations (SPT-A1, SW-14, SIG-07A, Ø 9.4m, H=5.5m)
- Thin stroke-widths (0.3–1.2) for technical drawing feel
- Each SVG has a `class` prop for external positioning

## Visual Spec

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├────┬─┬───────────────────────────────────────────┤
│    │ │                                           │
│ B  │ │   ░░░ Blueprint drawings ░░░  (240px)     │
│ l  │ │   ░░░ layered, full-bleed  ░░░           │
│ o  │ │   ░░░ vignette overlay     ░░░           │
│ g  │ │                                           │
│ .  │ ├───────────────────────────────────────────┤
│    │ │ ▓▓▓▓▓ hazard stripe ▓▓▓▓▓▓▓▓▓▓ (6px)    │
│    │ ├──────────┬────────────────────────────────┤
│    │ │ Filters  │  ○ 01 │ Post card            │ │
│    │ │ (sticky) │  ○ 02 │ Post card            │ │
│    │ │          │  ○ 03 │ Post card            │ │
│    │ │          │       │                      │ │
├────┴─┴──────────┴───────┴──────────────────────┘─┘
│  Footer                                           │
└───────────────────────────────────────────────────┘

EdgeRail = auto width (~56px)
Accent line = 1px
Content = 1fr
```

### Mobile (<1024px)

```
┌────────────────────────┐
│  Nav                    │
├────────────────────────┤
│ ░░░ Blueprints ░░░    │
│ Blog.                  │  ← title overlaid on blueprint
│ dispatches from field  │
├────────────────────────┤
│ ▓▓▓ hazard ▓▓▓ (4px)  │
├────────────────────────┤
│ [Search...]            │
│ [Tags: SQL dbt ...]    │
├────────────────────────┤
│ ○ 01 │ Post card       │
│ ○ 02 │ Post card       │
│ ○ 03 │ Post card       │
├────────────────────────┤
│  Footer                │
└────────────────────────┘

No EdgeRail, no accent line
Blueprint height reduced (~120px)
"Blog." + subtitle inside blueprint area
```

## Estimated Effort

- 5 new Blog SVG components (~half day — reference real technical drawings)
- 6 new Projects SVG components (~half day)
- 2 composition components (BlogBlueprint, ProjectsBlueprint) — pattern from ServicesBlueprint
- Blog layout already updated (thin accent line done)
- BlogListingPage header section rework
- Projects layout creation + ProjectListingPage header section rework
- Mobile responsive treatment for both

~2-3 sessions for SVGs + wiring. Blog detail page deferred to a separate session.
