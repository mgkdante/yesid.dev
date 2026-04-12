# Slice 08 — Work Pages (Index + FLIP Filter + Detail)

**Status:** ready
**Priority:** 1
**Estimated effort:** 2 sessions
**Depends on:** 02, 03, 07

## Objective

Build the `/work` listing page and `/work/[slug]` detail pages with service-linked SVG illustrations, FLIP-animated tag filtering, and data-flow diagrams.

## Context

This is the project portfolio section of yesid.dev. Projects display in a card grid with animated filtering. Each project links to services, and services provide SVG illustrations that cascade to projects. The architecture is cloud-ready (Slice 13) and i18n-ready (all text through LocalizedString).

## Acceptance Criteria

- [ ] `/work` renders a card grid with all public projects (5+ visible)
- [ ] Service filter pills filter projects by service with FLIP animation
- [ ] Tag filter pills filter by tag with FLIP animation
- [ ] Service + tag filters combine with AND logic
- [ ] Each card shows: title, one-liner, service SVG icons, tech tags
- [ ] Click card → navigates to `/work/[slug]`
- [ ] `/work/[slug]` renders two-column layout (content left, sticky sidebar right)
- [ ] Detail hero shows data-flow diagram auto-generated from `stack[]`
- [ ] Detail hero has morph SVG icon (MorphSVGPlugin)
- [ ] Detail sections scroll-reveal with `use:reveal`
- [ ] Sidebar shows: tech stack (stagger), service badges, external links
- [ ] Mobile: sidebar collapses above content, grid goes single column
- [ ] README section renders if `readmeUrl` is set (last section, labeled)
- [ ] 404 for invalid slugs
- [ ] 6 services exist (4 updated + 2 new), all with SVG illustrations
- [ ] 6 seed projects exist (2 updated + 4 placeholder)
- [ ] All text through `LocalizedString` and `resolveLocale()` — nothing hardcoded
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Technical Spec

**Design spec:** `docs/specs/2026-04-05-work-pages-design.md`
**Implementation plan:** `docs/plans/2026-04-05-work-pages.md`

Data model extensions, component list, SVG system, animation inventory, and route definitions are fully specified in the design spec. The implementation plan breaks these into 16 tasks with exact file paths, code, and test commands.

## Out of Scope

- Light theme
- i18n translations (structure maintained, English only for now)
- CMS/cloud integration (Slice 13)
- Home page rework for new services
- Services page
- Search on work listing (tag + service filters only)
- Image thumbnails (placeholder gradients)

## Learn

### GSAP Flip Plugin
**What it is:** FLIP (First, Last, Invert, Play) captures element positions before a DOM change, then animates from old position to new. Makes filter animations smooth instead of instant re-renders.
**Why it matters:** Same concept as a SQL execution plan optimizer — you compute the difference between two states and animate the transition instead of re-drawing from scratch.
**Try this:** Toggle a tag filter on `/work` and watch cards slide into new positions instead of popping.
**Go deeper:** https://gsap.com/docs/v3/Plugins/Flip/

### Service-Linked Architecture
**What it is:** Projects don't own their visual category — they link to services, and the SVG system cascades from services. Change a service SVG once, and every linked project updates.
**Why it matters:** Like a foreign key relationship in a database. The service table is the source of truth, projects reference it. No data duplication.
**Try this:** In `services.ts`, change the `svg` field on a service and see every linked project card update.
**Go deeper:** Data normalization applied to frontend architecture.

## Verify

1. Navigate to `/work` — card grid renders with 5+ projects
2. Click a service pill — cards FLIP-animate to show only matching projects
3. Click a tag pill — further filters with FLIP animation
4. Click a project card — navigates to `/work/[slug]`
5. On detail page — two-column layout, data-flow diagram, morph icon, scroll-reveal sections
6. Resize to mobile — sidebar above content, single-column grid
7. Navigate to `/work/nonexistent` — 404 page
8. Run `bun run test` — all pass
9. Run `bun run check` — no type errors
