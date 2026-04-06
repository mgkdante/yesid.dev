# Slice 09 — Services Pages (/services + /services/[id])

**Status:** ready
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 02, 08

## Objective

Build the `/services` index page and `/services/[id]` detail pages. Services are the heart of the site — they connect projects, skills, and client value into a comprehensive view of what yesid. offers.

## Context

Services already exist in the data layer (`src/lib/data/services.ts`) with 6 entries:
- SQL Development & Optimization
- Data Pipeline Architecture
- Analytics & Reporting Systems
- Database Engineering
- Internal Tooling
- Web Development

Each has an `id`, `title`, `description`, `svg`, and `relatedProjects`. Work detail pages already link to `/services/[id]` via service badges (currently 404). This slice makes those links work and builds a rich services section.

The Service type needs to be extended with additional fields for the detail pages: long-form content sections, stack/tools used, example deliverables, and client-facing value propositions.

## Design Intent

Services pages should feel consultative, not transactional. The client should understand:
1. **What the service is** — clear, jargon-free explanation
2. **How it helps them** — value proposition, business outcomes
3. **What it looks like in practice** — linked projects as proof, stack used
4. **What to expect** — typical deliverables, process overview

Content should be light, digestible, and skimmable. No walls of text.

## Data Model Extension

The Service interface needs new fields (all LocalizedString, all optional for backward compat):

```typescript
interface Service {
  // existing fields...
  id: string;
  title: LocalizedString;
  description: LocalizedString;  // short — used in listings/cards
  station: number;
  icon?: string;
  svg?: string;
  visible?: boolean;
  relatedProjects: string[];

  // NEW fields for detail pages
  longDescription?: LocalizedString;    // 2-3 paragraph deep dive
  valueProposition?: LocalizedString;   // "How this helps you" — client-facing
  deliverables?: LocalizedString[];     // typical deliverables list
  stack?: string[];                     // tools/technologies used in this service
  sections?: ServiceSection[];          // case-study-style content blocks
}

interface ServiceSection {
  title: LocalizedString;
  content: LocalizedString;
}
```

## Acceptance Criteria

### /services (index page)
- [ ] Renders all visible services as cards/sections
- [ ] Each card shows: title, short description, SVG icon, related project count
- [ ] Click card → navigates to `/services/[id]`
- [ ] Visual hierarchy: services feel like "stations" or "capabilities"
- [ ] Mobile responsive (single column)
- [ ] Page has a hero/header explaining what yesid. does

### /services/[id] (detail page)
- [ ] Renders service title, SVG icon (large), long description
- [ ] Shows value proposition section ("How this helps you")
- [ ] Lists typical deliverables
- [ ] Shows stack/tools used in this service
- [ ] Lists related projects with links back to `/work/[slug]`
- [ ] Project cards or mini-cards showing title + one-liner
- [ ] Collapsible content sections (same pattern as work detail)
- [ ] 404 for invalid service IDs
- [ ] Mobile responsive

### Data & Architecture
- [ ] All text through LocalizedString (cloud-ready, i18n-compliant)
- [ ] Service type extended with new optional fields (backward compatible)
- [ ] No hardcoded content in components — everything from data layer
- [ ] Existing service badges in work pages link correctly to detail pages

### Tests
- [ ] Data layer tests for new Service fields
- [ ] Component render tests for listing and detail pages
- [ ] 404 test for invalid service ID

## Routes

```
/services          -> ServiceListingPage.svelte
/services/[id]     -> ServiceDetailPage.svelte
```

## Key Components to Build

1. **ServiceListingPage.svelte** — index page with service cards
2. **ServiceDetailPage.svelte** — detail page with sections, projects, stack
3. **ServiceCard.svelte** — card for the listing page (title, desc, SVG, project count)

## Existing Infrastructure to Reuse

- `TableOfContents.svelte` — if detail pages have sections, reuse for navigation
- `DataFlowDiagram.svelte` — show stack as pipeline diagram
- `WorkCard.svelte` or mini variant — show related projects
- `reveal` action — scroll-reveal entrance animations
- `boop` action — hover interactions
- Service SVGs already exist in `/static/svg/services/`
- Collapsible section pattern from WorkDetailPage

## Verify

1. Navigate to `/services` — see all 6 services with cards
2. Click a service → `/services/sql-development` detail page
3. See long description, value prop, deliverables, stack, related projects
4. Click a related project → goes to `/work/[slug]`
5. From `/work/[slug]`, click a service badge → goes to `/services/[id]` (no more 404)
6. Mobile: responsive layout, readable content
7. `bun run test` passes
8. `bun run check` passes
