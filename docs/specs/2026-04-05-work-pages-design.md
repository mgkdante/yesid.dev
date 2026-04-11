# Slice 08 — Work Pages Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Depends on:** Slices 02, 03, 07

## Overview

Build the `/work` listing page and `/work/[slug]` detail pages for the yesid.dev portfolio. Projects display in a card grid with FLIP-animated tag filtering. Each project links to one or more services, and services provide animated SVG illustrations that cascade to project cards and detail pages.

This slice also expands the service taxonomy from 4 to 6 services, adds 4 placeholder seed projects, and establishes the SVG-per-service illustration system.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Listing layout | Card grid + FLIP filter | Visual impact, differentiates from blog's row layout, premium feel |
| Detail layout | Two-column (sticky sidebar) | Content left, tech stack + links sidebar right. Mobile: sidebar collapses above content |
| SVG system | Service-linked | Projects inherit SVGs from their `relatedServices`. One SVG per service (6 total). No separate category taxonomy. |
| Animation: listing | FLIP on grid filter | Cards smoothly rearrange when tags/services are toggled |
| Animation: detail hero | Morph icon (MorphSVGPlugin) | Small geometric SVG morphs between shapes on page load |
| Animation: detail body | Data-flow diagram + scroll-reveal | Auto-generated pipeline schematic from `stack[]`. Sections use existing `use:reveal`. |
| README import | Optional, always last section | `readmeUrl?` field on Project. Fetched at build time. Rendered with markdown pipeline. Curated sections display above it. |
| Services | 6 total, all visible | 4 existing + Internal Tooling + Web Development. Each toggleable via visibility flag. |
| Seed projects | 6 total | 2 existing (yesid.dev public, transit now public) + 4 placeholders |
| Cloud readiness | Clean interfaces | Data model stays interface-driven. Slice 13 swaps data source without changing components. |

## Services (6)

| # | ID | Name | One-liner | SVG Concept | GSAP Animation |
|---|-----|------|-----------|-------------|----------------|
| 1 | `sql-development` | SQL Development | Write, refactor, and tune SQL across PostgreSQL and SQL Server | Database cylinder + SELECT text | DrawSVG: cylinder draws → text types in |
| 2 | `data-pipeline` | Data Pipelines | Move data reliably from source to destination | Source → transform → destination flow | DrawSVG: nodes appear → lines trace → dots flow |
| 3 | `analytics-reporting` | Reporting | Turn raw data into dashboards your team actually uses | Bar chart + trend line | DrawSVG: bars grow up → trend line draws |
| 4 | `database-engineering` | Database Engineering | Design, migrate, and tune databases for performance | Schema diagram with connected tables | DrawSVG: tables appear → relations connect |
| 5 | `internal-tooling` | Internal Tooling | Build admin panels and workflow tools that replace spreadsheets | App window with UI elements | DrawSVG: window draws → UI elements stagger in |
| 6 | `web-development` | Web Development | Data-driven web apps and authenticated portals | Browser frame with components | DrawSVG: browser draws → components assemble |

**Note:** Services 1-3 already exist in `services.ts`. Service 4 (`database-performance`) is renamed to `database-engineering` — both the `id` and the title change (broader scope). Update all `relatedProjects` references accordingly. Services 5-6 are new additions.

**Each service gets:**
- A `svg` field pointing to its SVG file (e.g., `service-sql.svg`)
- A `visible` field (default `true`) for show/hide toggle
- The existing `icon` field (Lottie) remains for the home page train journey

## Seed Projects (6)

| # | Slug | Title | Services | Stack | Tags | Status |
|---|------|-------|----------|-------|------|--------|
| 1 | `yesid-dev` | yesid.dev — Portfolio Site | Web Development | SvelteKit, TypeScript, Tailwind, Vercel | portfolio, web, svelte | public |
| 2 | `transit-data-pipeline` | Transit Operations Data Pipeline | Data Pipelines, SQL Development | PostgreSQL, Python, dbt, Power BI, Airflow | etl, transit, postgresql, dbt | **public** (was private) |
| 3 | `lorem-analytics-dashboard` | Lorem Analytics Dashboard | Reporting | Power BI, SQL Server, Python | analytics, reporting, sql-server | public |
| 4 | `lorem-database-migration` | Lorem Database Migration | Database Engineering, SQL Development | PostgreSQL, Python, Alembic | postgresql, migration, schema | public |
| 5 | `lorem-query-optimizer` | Lorem Query Optimizer | SQL Development, Database Engineering | SQL Server, Python, SSMS | sql, performance, sql-server | public |
| 6 | `lorem-retool-admin` | Lorem Retool Admin Panel | Internal Tooling, Reporting | Retool, PostgreSQL, REST API | retool, admin, postgresql | public |

**Transit repo:** https://github.com/mgkdante/transit (now public)

## Data Model Changes

### Project (extended)

```typescript
interface Project {
  // ... existing fields ...
  relatedServices: string[];  // NEW: service IDs this project belongs to
  readmeUrl?: string;         // NEW: GitHub raw README URL for import
}
```

### Service (extended)

```typescript
interface Service {
  // ... existing fields ...
  svg?: string;       // NEW: SVG filename for work page illustrations
  visible?: boolean;  // NEW: show/hide toggle (default true)
}
```

## Routes

### `/work` — Listing Page

- **Layout:** Card grid, 2 columns on desktop, 1 on mobile
- **Filters:**
  - Tag pills (from all project tags) — click to filter, FLIP animation on grid
  - Service pills (from visible services) — click to filter by service
  - "All" pill resets filters
- **Each card shows:**
  - Project title
  - One-liner excerpt
  - Service SVG icons (from linked services, small)
  - Tech stack tags (first 3-4)
  - Click navigates to `/work/[slug]`
- **Only shows** projects where `status !== 'private'`
- **Animation:** GSAP Flip plugin (First, Last, Invert, Play) on filter changes — cards smoothly rearrange. Requires `Flip` from GSAP (already available since GSAP is fully free).
- **Filter layout:** Service pills row first, then tag pills row below. Both rows wrap on mobile.
- **Component:** `WorkListingPage.svelte` (new), `WorkCard.svelte` (new)

### `/work/[slug]` — Detail Page

- **Layout:** Two-column on desktop (content left, sticky sidebar right). On mobile, sidebar content renders above the main content in the same style/colors.
- **Hero section:**
  - Project title + one-liner
  - Morph SVG icon (MorphSVGPlugin) — morphs between service SVG shapes on load
  - Data-flow diagram — auto-generated from `stack[]` array, nodes stagger in + DrawSVG connecting lines
- **Content sections (left column):**
  - Each `ProjectSection` renders as a card with title + content
  - Scroll-revealed with `use:reveal`
  - README section: if `readmeUrl` is set, fetched in the SvelteKit `load()` function and rendered as markdown (same pipeline as blog posts). Always appears last. Labeled clearly (e.g., "Repository README" with a GitHub icon).
- **Sidebar (right column, sticky):**
  - Tech stack tags (stagger animation)
  - Service badges (linked to services, showing service SVG)
  - External links (Live Site, GitHub repo) — if available
  - On mobile: renders above content sections, same style
- **404:** Invalid slugs show a 404 page
- **Components:** `WorkDetailPage.svelte` (new), `WorkDetailSidebar.svelte` (new), `DataFlowDiagram.svelte` (new), `WorkServiceBadge.svelte` (new)

## SVG System

### Per-service SVGs

6 SVG files stored in `static/svg/services/` (URL-served, consistent with Lottie files in `static/lottie/`):

| File | Service | Visual |
|------|---------|--------|
| `service-sql.svg` | SQL Development | Database cylinder + query text |
| `service-pipeline.svg` | Data Pipelines | Source → transform → destination |
| `service-reporting.svg` | Reporting | Bar chart + trend line |
| `service-database.svg` | Database Engineering | Schema tables + relations |
| `service-tooling.svg` | Internal Tooling | App window + UI elements |
| `service-web.svg` | Web Development | Browser frame + components |

### SVG rendering component

Reuse or extend the `BlogSvgIcon.svelte` pattern:
- Load SVG content
- GSAP DrawSVG entrance animation on mount
- MorphSVG hover/morph between service shapes (for detail hero)
- Respect `prefers-reduced-motion`

### Data-flow diagram component

`DataFlowDiagram.svelte` — auto-generates a pipeline visualization from `stack[]`:
- Each tech in the stack becomes a node (rounded rect + label)
- Nodes connected by dashed lines with animated dots
- GSAP staggers nodes in left-to-right, then DrawSVG traces connecting lines
- Responsive: wraps or scrolls horizontally on mobile

## Animation Inventory

| Where | What | Plugin/Action | Trigger |
|-------|------|--------------|---------|
| Listing: grid | Cards rearrange | FLIP (GSAP) | Filter change |
| Listing: cards | Entrance | `use:reveal` | Scroll |
| Detail: hero icon | Shape morph | MorphSVGPlugin | Page load |
| Detail: data-flow | Nodes + lines | DrawSVGPlugin + stagger | Page load / scroll |
| Detail: sections | Slide in | `use:reveal` | Scroll |
| Detail: sidebar tags | Stagger in | GSAP stagger | Page load |
| Detail: service badges | Fade in | `use:reveal` | Page load |

## Out of Scope

- Light theme (dark-first, light is future)
- i18n translations (English only for now, LocalizedString structure maintained)
- CMS/cloud integration (Slice 13)
- Home page rework to integrate with new services (future slice)
- Services page (Slice 09 or later)
- Search on work listing (keep it simple — tag + service filters only)
- Image thumbnails on cards (placeholder gradient for now, real screenshots later)

## Cloud Readiness Notes (for Slice 13)

The architecture is designed so Slice 13 can swap the data source without changing components:
- All data flows through typed interfaces (`Project`, `Service`)
- Helper functions (`getPublicProjects()`, `getProjectBySlug()`) are the only data access points
- Components receive resolved data as props — they don't know where data comes from
- README fetching is already URL-based — cloud version just changes the URL source
- Service visibility toggle is a data field, not a component concern
