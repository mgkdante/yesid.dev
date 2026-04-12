# Slice 08 — Work Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/work` listing page with card grid + FLIP-animated tag filtering, and `/work/[slug]` detail pages with two-column layout, service-linked SVG system, and data-flow diagrams.

**Architecture:** Service-linked SVG system — each of 6 services gets an animated SVG illustration, projects link to services via `relatedServices: string[]`, SVGs cascade from services to project cards and detail pages. All content flows through typed `LocalizedString` interfaces, never hardcoded. Data helpers are the sole access point for components.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), TypeScript, GSAP (Flip, DrawSVGPlugin, MorphSVGPlugin), Tailwind CSS v4, Vitest, Bun

**Design Spec:** `docs/specs/2026-04-05-work-pages-design.md`

---

## File Map

### New Files


| File                                          | Responsibility                                                   |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `static/svg/services/service-sql.svg`         | SQL Development service SVG                                      |
| `static/svg/services/service-pipeline.svg`    | Data Pipelines service SVG                                       |
| `static/svg/services/service-reporting.svg`   | Reporting service SVG                                            |
| `static/svg/services/service-database.svg`    | Database Engineering service SVG                                 |
| `static/svg/services/service-tooling.svg`     | Internal Tooling service SVG                                     |
| `static/svg/services/service-web.svg`         | Web Development service SVG                                      |
| `src/lib/components/WorkSvgIcon.svelte`       | Service SVG renderer with GSAP DrawSVG entrance + MorphSVG hover |
| `src/lib/components/WorkCard.svelte`          | Project card for the grid listing                                |
| `src/lib/components/WorkListingPage.svelte`   | Full listing page with FLIP grid + service/tag filters           |
| `src/lib/components/WorkDetailPage.svelte`    | Detail page layout (two-column, hero, sections, README)          |
| `src/lib/components/WorkDetailSidebar.svelte` | Sticky sidebar: tech stack, service badges, links                |
| `src/lib/components/WorkServiceBadge.svelte`  | Small service badge with SVG icon + label                        |
| `src/lib/components/DataFlowDiagram.svelte`   | Auto-generated pipeline schematic from stack[]                   |
| `src/routes/work/+page.ts`                    | Listing page data loader                                         |
| `src/routes/work/+page.svelte`                | Listing page route                                               |
| `src/routes/work/[slug]/+page.ts`             | Detail page data loader (+ README fetch)                         |
| `src/routes/work/[slug]/+page.svelte`         | Detail page route                                                |
| `src/lib/data/projects.test.ts`               | Extended tests for new helpers                                   |
| `src/lib/data/data-integrity.test.ts`         | Extended tests for new fields                                    |


### Modified Files


| File                           | Change                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `src/lib/data/types.ts`        | Add `relatedServices`, `readmeUrl` to Project; add `svg`, `visible` to Service |
| `src/lib/data/services.ts`     | Rename service 4, add services 5-6, add svg/visible fields to all              |
| `src/lib/data/projects.ts`     | Add `relatedServices` to existing projects, add 4 seed projects, new helpers   |
| `src/lib/data/index.ts`        | Re-export new helpers and service helpers                                      |
| `src/lib/motion/utils/gsap.ts` | Register Flip plugin if not already registered                                 |


---

## Task 1: Extend Type Interfaces

**Files:**

- Modify: `src/lib/data/types.ts`
- **Step 1: Add new fields to Service interface**

Add `svg` and `visible` fields after the existing `lottieReverse` field:

```typescript
// SVG illustration filename for work page cards and detail pages.
// Each service gets one SVG that cascades to all linked projects.
svg?: string;
// When false, this service is hidden from listings and filters.
// Allows toggling services on/off without deleting data. Defaults to true.
visible?: boolean;
```

- **Step 2: Add new fields to Project interface**

Add `relatedServices` and `readmeUrl` fields after the existing `liveUrl` field:

```typescript
// Service IDs this project is associated with. SVGs cascade from services.
// A project can link to 1+ services. IDs must match existing service.id values.
relatedServices: string[];
// GitHub raw README URL for auto-import as the last content section.
// Fetched in SvelteKit load(). Omit if no README should be shown.
readmeUrl?: string;
```

- **Step 3: Run type check**

Run: `bun run check`
Expected: Type errors in `projects.ts` because existing projects lack `relatedServices`. This is expected — fixed in Task 3.

---

## Task 2: Update Services Data

**Files:**

- Modify: `src/lib/data/services.ts`
- **Step 1: Add svg and visible fields to all 4 existing services**

Add `svg` and `visible: true` to each service object. For service 4 (`database-performance`), also rename the `id` to `database-engineering` and update the title/description:

Service 1 additions: `svg: 'service-sql.svg', visible: true`
Service 2 additions: `svg: 'service-pipeline.svg', visible: true`
Service 3 additions: `svg: 'service-reporting.svg', visible: true`
Service 4: rename `id` from `'database-performance'` to `'database-engineering'`, update `title` to `{ en: 'Database Engineering' }`, update `description` to `{ en: 'Design, migrate, and tune databases for performance. Schema modeling, index optimization, and migration strategy built for reliability.' }`, add `svg: 'service-database.svg', visible: true`

- **Step 2: Add service 5 — Internal Tooling**

```typescript
{
  id: 'internal-tooling',
  title: { en: 'Internal Tooling' },
  description: {
    en: 'Build admin panels and workflow tools that replace spreadsheets. Retool, custom dashboards, and approval systems designed for operations teams.'
  },
  station: 5,
  svg: 'service-tooling.svg',
  visible: true,
  relatedProjects: ['lorem-retool-admin']
}
```

- **Step 3: Add service 6 — Web Development**

```typescript
{
  id: 'web-development',
  title: { en: 'Web Development' },
  description: {
    en: 'Data-driven web apps and authenticated portals. Full-stack development with SvelteKit, responsive design, and API integration.'
  },
  station: 6,
  svg: 'service-web.svg',
  visible: true,
  relatedProjects: ['yesid-dev']
}
```

- **Step 4: Update relatedProjects on existing services to reference new seed projects**

Service 1 (`sql-development`): add `'lorem-query-optimizer'`, `'lorem-database-migration'` to relatedProjects
Service 2 (`data-pipeline`): keep `'transit-data-pipeline'`
Service 3 (`analytics-reporting`): add `'lorem-analytics-dashboard'`, `'lorem-retool-admin'`
Service 4 (`database-engineering`): set relatedProjects to `['lorem-database-migration', 'lorem-query-optimizer']`

- **Step 5: Run type check**

Run: `bun run check`
Expected: Still errors from projects.ts (missing `relatedServices`). Services should be clean.

---

## Task 3: Update Projects Data + Add Seed Projects

**Files:**

- Modify: `src/lib/data/projects.ts`
- **Step 1: Add relatedServices to existing yesid-dev project**

Add `relatedServices: ['web-development']` to the yesid-dev project object.

- **Step 2: Update transit-data-pipeline — make public, add relatedServices**

Change `status` from `'private'` to `'public'`. Add `relatedServices: ['data-pipeline', 'sql-development']`. Add `repoUrl: 'https://github.com/mgkdante/transit'`.

- **Step 3: Add 4 placeholder seed projects**

Add these after the existing 2 projects. All use `LocalizedString` for user-facing text, never hardcoded in components:

```typescript
{
  slug: 'lorem-analytics-dashboard',
  title: { en: 'Lorem Analytics Dashboard' },
  oneLiner: { en: 'Executive KPI dashboard tracking operational metrics across 12 departments.' },
  description: { en: 'A Power BI dashboard suite built for a logistics company. Pulls data from SQL Server, applies business logic in DAX, and delivers daily refreshes to executive stakeholders. Reduced reporting time from 2 days to 15 minutes.' },
  stack: ['Power BI', 'SQL Server', 'Python', 'DAX'],
  tags: ['analytics', 'reporting', 'sql-server'],
  status: 'public',
  featured: false,
  relatedServices: ['analytics-reporting'],
  sections: [
    { title: { en: 'The Problem' }, content: { en: 'Operations managers were spending two days each month compiling reports from multiple spreadsheets. Data was stale by the time decisions were made.' } },
    { title: { en: 'The Approach' }, content: { en: 'Connected directly to SQL Server with scheduled refreshes. Built a semantic layer in DAX so business users could slice data without writing queries.' } }
  ]
},
{
  slug: 'lorem-database-migration',
  title: { en: 'Lorem Database Migration' },
  oneLiner: { en: 'Zero-downtime migration from legacy MySQL to PostgreSQL for a SaaS platform.' },
  description: { en: 'Migrated a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads. Included schema redesign, data type mapping, and stored procedure conversion.' },
  stack: ['PostgreSQL', 'Python', 'Alembic', 'MySQL'],
  tags: ['postgresql', 'migration', 'schema'],
  status: 'public',
  featured: false,
  relatedServices: ['database-engineering', 'sql-development'],
  sections: [
    { title: { en: 'Why Migrate?' }, content: { en: 'The legacy MySQL instance was hitting performance limits. PostgreSQL offered better JSON support, CTEs, and window functions needed for the analytics layer.' } },
    { title: { en: 'Migration Strategy' }, content: { en: 'Used a dual-write pattern: new writes go to both databases, reads gradually shift to PostgreSQL. Shadow reads validated correctness before the cutover.' } }
  ]
},
{
  slug: 'lorem-query-optimizer',
  title: { en: 'Lorem Query Optimizer' },
  oneLiner: { en: 'Automated SQL Server query analysis tool that identifies slow queries and suggests index improvements.' },
  description: { en: 'A Python-based tool that connects to SQL Server, analyzes execution plans, identifies missing indexes, and generates optimization recommendations. Reduced average query time by 73% across 200+ stored procedures.' },
  stack: ['SQL Server', 'Python', 'SSMS', 'T-SQL'],
  tags: ['sql', 'performance', 'sql-server'],
  status: 'public',
  featured: false,
  relatedServices: ['sql-development', 'database-engineering'],
  repoUrl: 'https://github.com/mgkdante/lorem-query-optimizer',
  sections: [
    { title: { en: 'How It Works' }, content: { en: 'Connects to the target SQL Server instance, captures execution plans for the heaviest queries, and analyzes them for common anti-patterns: table scans, implicit conversions, and parameter sniffing issues.' } }
  ]
},
{
  slug: 'lorem-retool-admin',
  title: { en: 'Lorem Retool Admin Panel' },
  oneLiner: { en: 'Internal operations dashboard for managing inventory and approval workflows.' },
  description: { en: 'A Retool-based admin panel that replaced 6 spreadsheets with a unified interface. CRUD operations on PostgreSQL, role-based access control, and automated approval routing.' },
  stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
  tags: ['retool', 'admin', 'postgresql'],
  status: 'public',
  featured: false,
  relatedServices: ['internal-tooling', 'analytics-reporting'],
  sections: [
    { title: { en: 'Before & After' }, content: { en: 'Operations ran on 6 Google Sheets with manual copy-paste between them. The Retool panel centralized everything into one interface with real-time PostgreSQL queries.' } }
  ]
}
```

- **Step 4: Run type check**

Run: `bun run check`
Expected: PASS — all projects now have `relatedServices`.

---

## Task 4: Add New Data Helpers

**Files:**

- Modify: `src/lib/data/projects.ts`
- Modify: `src/lib/data/services.ts` (add service helpers)
- Modify: `src/lib/data/index.ts`
- **Step 1: Write failing tests for new project helpers**

Add to `src/lib/data/projects.test.ts`:

```typescript
import {
  getProjectBySlug,
  getFeaturedProjects,
  getPublicProjects,
  getAllTags,
  getProjectsByService,
  getServiceIdsForProjects,
  projects
} from './projects.js';

describe('getProjectsByService', () => {
  it('returns projects linked to a given service ID', () => {
    const results = getProjectsByService('sql-development');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      expect(p.relatedServices).toContain('sql-development');
    });
  });

  it('excludes private projects', () => {
    const results = getProjectsByService('sql-development');
    results.forEach((p) => {
      expect(p.status).not.toBe('private');
    });
  });

  it('returns empty array for unknown service ID', () => {
    expect(getProjectsByService('nonexistent')).toEqual([]);
  });
});

describe('getServiceIdsForProjects', () => {
  it('returns deduplicated sorted service IDs from public projects', () => {
    const ids = getServiceIdsForProjects();
    expect(ids.length).toBeGreaterThan(0);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- **Step 2: Run tests to verify they fail**

Run: `bun run test -- src/lib/data/projects.test.ts`
Expected: FAIL — functions not defined.

- **Step 3: Implement new project helpers**

Add to `src/lib/data/projects.ts`:

```typescript
/**
 * Returns all non-private projects linked to a given service ID.
 */
export function getProjectsByService(serviceId: string): readonly Project[] {
  return projects.filter(
    (p) => p.status !== 'private' && p.relatedServices.includes(serviceId)
  );
}

/**
 * Returns deduplicated, sorted service IDs from all public projects.
 * Used to build service filter UI.
 */
export function getServiceIdsForProjects(): string[] {
  const ids = projects
    .filter((p) => p.status !== 'private')
    .flatMap((p) => p.relatedServices);
  return [...new Set(ids)].sort();
}
```

- **Step 4: Add service helper — getServiceById, getVisibleServices**

Add to `src/lib/data/services.ts`:

```typescript
/**
 * Returns the service with the given ID, or undefined if not found.
 */
export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

/**
 * Returns all services where visible is not explicitly false.
 */
export function getVisibleServices(): readonly Service[] {
  return services.filter((s) => s.visible !== false);
}
```

- **Step 5: Update barrel export**

Add to `src/lib/data/index.ts`:

```typescript
// Project helpers (extended for work pages)
export { projects, getProjectBySlug, getFeaturedProjects, getPublicProjects, getAllTags, getProjectsByService, getServiceIdsForProjects } from './projects.js';

// Services data + helpers
export { services, getServiceById, getVisibleServices } from './services.js';
```

- **Step 6: Run all tests**

Run: `bun run test`
Expected: PASS.

- **Step 7: Commit**

```bash
git add src/lib/data/
git commit -m "feat(slice-08): extend data layer — 6 services, 6 projects, service-linked helpers"
```

---

## Task 5: Update Data Integrity Tests

**Files:**

- Modify: `src/lib/data/data-integrity.test.ts`
- **Step 1: Add integrity tests for new fields**

Add to the `projects data integrity` describe block:

```typescript
it('all projects have a relatedServices array with at least one entry', () => {
  projects.forEach((p) => {
    expect(Array.isArray(p.relatedServices)).toBe(true);
    expect(p.relatedServices.length).toBeGreaterThan(0);
  });
});

it('all relatedServices IDs reference existing service IDs', () => {
  const validServiceIds = new Set(services.map((s) => s.id));
  projects.forEach((p) => {
    p.relatedServices.forEach((sid) => {
      expect(validServiceIds.has(sid), `service "${sid}" in project "${p.slug}" not found`).toBe(true);
    });
  });
});
```

Add to the `services data integrity` describe block:

```typescript
it('all services with svg field reference a valid filename', () => {
  services.forEach((s) => {
    if (s.svg) {
      expect(s.svg.trim()).not.toBe('');
      expect(s.svg).toMatch(/\.svg$/);
    }
  });
});
```

- **Step 2: Run tests**

Run: `bun run test -- src/lib/data/data-integrity.test.ts`
Expected: PASS.

- **Step 3: Commit**

```bash
git add src/lib/data/data-integrity.test.ts
git commit -m "test(slice-08): add data integrity tests for relatedServices and service SVGs"
```

---

## Task 6: Create Service SVGs

**Files:**

- Create: `static/svg/services/service-sql.svg`
- Create: `static/svg/services/service-pipeline.svg`
- Create: `static/svg/services/service-reporting.svg`
- Create: `static/svg/services/service-database.svg`
- Create: `static/svg/services/service-tooling.svg`
- Create: `static/svg/services/service-web.svg`
- **Step 1: Create the directory**

Run: `mkdir -p static/svg/services`

- **Step 2: Create all 6 SVGs**

Each SVG should:

- Use a `48x48` viewBox (consistent with BlogSvgIcon)
- Use only `path`, `rect`, `circle`, `ellipse`, `line`, `polyline` elements (GSAP-animatable)
- Use brand colors: `#E07800` (orange), `#FFB627` (yellow), plus reduced-opacity variants
- Use `fill="none"` on stroked elements so DrawSVG works
- No text elements (use paths for text-like shapes)
- Keep under 15 elements per SVG for clean animation

SVG concepts per the design spec:

1. **service-sql.svg** — database cylinder (3 ellipses stacked) + bracket shapes
2. **service-pipeline.svg** — circle → rectangle → filled circle with dashed connecting lines + dot markers
3. **service-reporting.svg** — 3 bar chart rectangles + ascending polyline trend
4. **service-database.svg** — 2 table rectangles (top) with connection lines to 1 table (bottom), horizontal lines inside
5. **service-tooling.svg** — outer rounded rect (window), horizontal divider, 3 circles (window dots), inner rectangles (UI elements)
6. **service-web.svg** — outer rounded rect (browser), address bar line, 3 dots, component rectangles inside, stand below

- **Step 3: Verify SVGs load**

Open each in browser: `http://localhost:5173/svg/services/service-sql.svg` (etc.)
Expected: Each renders as a clean geometric illustration in brand colors.

- **Step 4: Commit**

```bash
git add static/svg/services/
git commit -m "feat(slice-08): add 6 service SVG illustrations"
```

---

## Task 7: Create WorkSvgIcon Component

**Files:**

- Create: `src/lib/components/WorkSvgIcon.svelte`
- **Step 1: Build the component**

Follows the same pattern as `BlogSvgIcon.svelte` but simplified — only `draw` and `draw-fill` entrance animations (no morph/stagger variants). Accepts `svgContent` (raw SVG string), `size`, and `hovered` prop for morph interaction.

Key differences from BlogSvgIcon:

- Default animation is `'draw-fill'` (draw strokes then soft fill)
- Smaller default size (`36px` for cards, `48px` for detail)
- Same MorphSVG hover behavior (morph to random geometric shape, revert on leave)
- Same tap-to-toggle morph behavior for mobile
- Respects `prefers-reduced-motion`

Props:

```typescript
{
  svgContent: string;
  size?: number;       // default 36
  hovered?: boolean;   // driven by parent hover state
}
```

- **Step 2: Verify manually**

Test in dev server by temporarily rendering a WorkSvgIcon with one of the service SVGs.

- **Step 3: Commit**

```bash
git add src/lib/components/WorkSvgIcon.svelte
git commit -m "feat(slice-08): add WorkSvgIcon component with DrawSVG entrance + MorphSVG hover"
```

---

## Task 8: Create DataFlowDiagram Component

**Files:**

- Create: `src/lib/components/DataFlowDiagram.svelte`
- **Step 1: Build the component**

Auto-generates a pipeline visualization SVG from a `stack: string[]` prop.

Props:

```typescript
{
  stack: string[];
  accentColor?: string;  // default '#E07800'
}
```

Behavior:

- Each tech in `stack` becomes a node: rounded rect with the tech name as text
- Nodes are arranged horizontally with dashed connecting lines between them
- Animated dots travel along the connecting lines
- GSAP entrance: nodes stagger in left-to-right with `opacity: 0 → 1, y: 10 → 0`, then DrawSVG traces the connecting lines
- Responsive: if `stack.length > 4`, the diagram scrolls horizontally on mobile or wraps to 2 rows
- Respects `prefers-reduced-motion` — static render without animation
- Colors alternate between `#E07800` and `#FFB627` for visual variety
- The SVG is generated dynamically based on stack length — no hardcoded positions
- **Step 2: Commit**

```bash
git add src/lib/components/DataFlowDiagram.svelte
git commit -m "feat(slice-08): add DataFlowDiagram component — auto-generates pipeline SVG from stack[]"
```

---

## Task 9: Create WorkCard Component

**Files:**

- Create: `src/lib/components/WorkCard.svelte`
- **Step 1: Build the component**

A card for the `/work` grid listing.

Props:

```typescript
{
  project: Project;
  serviceSvgContents: Record<string, string>;  // serviceId → raw SVG string
  index?: number;  // for stagger delay
}
```

Layout:

- Top: placeholder gradient thumbnail area (colored by first service accent)
- Middle: project title (resolved via `resolveLocale`), one-liner excerpt
- Bottom row: service SVG mini-icons (from `relatedServices`, rendered small ~20px), first 3-4 tech tags as pills
- Full card is a clickable `<a href="/work/{project.slug}">` link
- Hover: `use:boop` + WorkSvgIcon morph
- Entrance: `use:reveal` with stagger delay from `index`

All text resolved through `resolveLocale()`. Uses `DEFAULT_LOCALE` for now.

- **Step 2: Commit**

```bash
git add src/lib/components/WorkCard.svelte
git commit -m "feat(slice-08): add WorkCard component for project grid"
```

---

## Task 10: Create WorkListingPage Component (with FLIP)

**Files:**

- Create: `src/lib/components/WorkListingPage.svelte`
- **Step 1: Build the component**

Full listing page with FLIP-animated card grid.

Props:

```typescript
{
  projects: readonly Project[];
  allTags: readonly string[];
  serviceIds: readonly string[];
  services: readonly Service[];
  serviceSvgContents: Record<string, string>;
}
```

Layout:

- Header: "Work" heading + subtitle (from data, `LocalizedString`)
- Service filter pills row: one pill per visible service + "All" pill. Active pill is highlighted.
- Tag filter pills row: one pill per tag + "All" pill.
- Card grid: 2 columns on desktop (`md` breakpoint), 1 column on mobile.
- Empty state: "No projects match the selected filters."

FLIP animation on filter change:

1. Before updating the filter, capture card positions with `Flip.getState()`
2. Update the reactive filter state (Svelte re-renders the grid)
3. After DOM update, call `Flip.from()` with `duration: 0.5, ease: 'power2.inOut', stagger: 0.05`
4. Cards that leave get `scale: 0, opacity: 0` exit. Cards that enter get `scale: 0 → 1` entrance.

Register `Flip` in the gsap utils if not already: add `import { Flip } from 'gsap/Flip'` and register it in `registerGsapPlugins()`.

Filter logic:

- Service filter and tag filter are independent (AND logic: must match both if both active)
- URL params: `?service=sql-development&tag=postgresql` for shareable URLs
- Uses `goto()` with `replaceState: true, noScroll: true` like blog listing
- **Step 2: Register GSAP Flip plugin**

In `src/lib/motion/utils/gsap.ts`, add Flip to the imports and registration:

```typescript
import { Flip } from 'gsap/Flip';
// Add to registerGsapPlugins():
gsap.registerPlugin(Flip);
// Add to exports:
export { Flip };
```

- **Step 3: Commit**

```bash
git add src/lib/components/WorkListingPage.svelte src/lib/motion/utils/gsap.ts
git commit -m "feat(slice-08): add WorkListingPage with FLIP-animated grid filtering"
```

---

## Task 11: Create /work Route

**Files:**

- Create: `src/routes/work/+page.ts`
- Create: `src/routes/work/+page.svelte`
- **Step 1: Create the data loader**

`src/routes/work/+page.ts`:

```typescript
import { getPublicProjects, getAllTags, getServiceIdsForProjects, getVisibleServices } from '$lib/data';

export function load() {
  const projects = getPublicProjects();
  const tags = getAllTags();
  const serviceIds = getServiceIdsForProjects();
  const services = getVisibleServices();

  // Load SVG contents for all services that have an svg field
  const serviceSvgContents: Record<string, string> = {};
  for (const service of services) {
    if (service.svg) {
      try {
        // Use import.meta.glob for build-time SVG loading
        // Implementation: load from static/svg/services/ at build time
        // For now, fetch at runtime from the static path
      } catch {
        // SVG not found — skip silently
      }
    }
  }

  return { projects, tags, serviceIds, services, serviceSvgContents };
}
```

Note: The exact SVG loading mechanism should use `import.meta.glob` for build-time loading (same pattern as blog SVGs) or fetch from `/svg/services/` path. Follow whichever pattern the blog system uses in `src/lib/data/blog.ts`.

- **Step 2: Create the page component**

`src/routes/work/+page.svelte`:

```svelte
<script lang="ts">
  import WorkListingPage from '$lib/components/WorkListingPage.svelte';
  let { data } = $props();
</script>

<WorkListingPage
  projects={data.projects}
  allTags={data.tags}
  serviceIds={data.serviceIds}
  services={data.services}
  serviceSvgContents={data.serviceSvgContents}
/>
```

- **Step 3: Verify in browser**

Navigate to `http://localhost:5173/work`
Expected: Card grid renders with 5 public projects (transit is now public), filter pills work.

- **Step 4: Commit**

```bash
git add src/routes/work/
git commit -m "feat(slice-08): add /work route with project grid listing"
```

---

## Task 12: Create Detail Page Components

**Files:**

- Create: `src/lib/components/WorkServiceBadge.svelte`
- Create: `src/lib/components/WorkDetailSidebar.svelte`
- Create: `src/lib/components/WorkDetailPage.svelte`
- **Step 1: Create WorkServiceBadge**

Small badge showing a service's SVG icon + name. Used in the sidebar.

Props:

```typescript
{
  service: Service;
  svgContent: string;
}
```

Layout: Small inline-flex badge with 20px SVG icon + service title. Orange border, dark background. Uses `resolveLocale()` for the service title.

- **Step 2: Create WorkDetailSidebar**

Sticky sidebar for the detail page.

Props:

```typescript
{
  project: Project;
  services: Service[];
  serviceSvgContents: Record<string, string>;
}
```

Layout (rendered in order):

1. **Tech Stack** section: heading + tag pills (stagger animation)
2. **Services** section: heading + WorkServiceBadge for each linked service
3. **Links** section: Live Site link (if `liveUrl`), GitHub link (if `repoUrl`), each with external link icon

On mobile: renders as a horizontal/stacked section above the content, same colors/style.

- **Step 3: Create WorkDetailPage**

Full detail page layout.

Props:

```typescript
{
  project: Project;
  services: Service[];
  serviceSvgContents: Record<string, string>;
  readmeHtml?: string;
}
```

Layout:

1. **Hero section** (full width):
  - Back link "← All Projects" to `/work`
  - Project title (`resolveLocale`) + one-liner
  - Data-flow diagram (from `project.stack`)
  - Morph SVG icon — if project has relatedServices, morph between their SVGs on load
2. **Two-column section** (desktop):
  - Left: content sections as cards (each `use:reveal`). Then README section last (if `readmeHtml` provided), labeled "Repository README" with GitHub icon.
  - Right: `WorkDetailSidebar` (sticky)
3. **Mobile**: sidebar content renders above the left column content, same visual style

README section styling: Reuse `BlogContent.svelte` markdown styles or create a shared markdown renderer component. The README HTML is pre-rendered in the load function.

- **Step 4: Commit**

```bash
git add src/lib/components/WorkServiceBadge.svelte src/lib/components/WorkDetailSidebar.svelte src/lib/components/WorkDetailPage.svelte
git commit -m "feat(slice-08): add WorkDetailPage, WorkDetailSidebar, WorkServiceBadge components"
```

---

## Task 13: Create /work/[slug] Route

**Files:**

- Create: `src/routes/work/[slug]/+page.ts`
- Create: `src/routes/work/[slug]/+page.svelte`
- **Step 1: Create the data loader with README fetching**

`src/routes/work/[slug]/+page.ts`:

```typescript
import { error } from '@sveltejs/kit';
import { getProjectBySlug, getServiceById } from '$lib/data';
import type { Service } from '$lib/data/types.js';

export async function load({ params, fetch }) {
  const project = getProjectBySlug(params.slug);

  if (!project || project.status === 'private') {
    error(404, { message: 'Project not found' });
  }

  // Resolve linked services
  const services: Service[] = project.relatedServices
    .map((id) => getServiceById(id))
    .filter((s): s is Service => s !== undefined);

  // Load service SVG contents
  const serviceSvgContents: Record<string, string> = {};
  for (const service of services) {
    if (service.svg) {
      try {
        const res = await fetch(`/svg/services/${service.svg}`);
        if (res.ok) {
          serviceSvgContents[service.id] = await res.text();
        }
      } catch {
        // SVG not found — skip
      }
    }
  }

  // Fetch README if URL is set
  let readmeHtml: string | undefined;
  if (project.readmeUrl) {
    try {
      const res = await fetch(project.readmeUrl);
      if (res.ok) {
        const rawMarkdown = await res.text();
        // Use the same markdown rendering approach as blog posts
        // Import a markdown-to-html utility or use a library
        // For now, store raw markdown — render in component
        readmeHtml = rawMarkdown;
      }
    } catch {
      // README fetch failed — skip silently
    }
  }

  return { project, services, serviceSvgContents, readmeHtml };
}
```

Note: The README markdown-to-HTML conversion should use the same pipeline as blog posts. Check how `getPostHtml()` works in `blog.ts` and reuse that approach. If it uses a Svelte markdown preprocessor, the README might need a different approach (runtime rendering). The implementer should check the blog system and match its approach.

- **Step 2: Create the page component**

`src/routes/work/[slug]/+page.svelte`:

```svelte
<script lang="ts">
  import WorkDetailPage from '$lib/components/WorkDetailPage.svelte';
  let { data } = $props();
</script>

<WorkDetailPage
  project={data.project}
  services={data.services}
  serviceSvgContents={data.serviceSvgContents}
  readmeHtml={data.readmeHtml}
/>
```

- **Step 3: Test valid slug**

Navigate to `http://localhost:5173/work/yesid-dev`
Expected: Detail page renders with title, data-flow diagram, sections, sidebar.

- **Step 4: Test invalid slug (404)**

Navigate to `http://localhost:5173/work/nonexistent`
Expected: 404 error page.

- **Step 5: Commit**

```bash
git add src/routes/work/
git commit -m "feat(slice-08): add /work/[slug] detail route with README fetch + 404"
```

---

## Task 14: Update GSAP Registration + Motion Utils

**Files:**

- Modify: `src/lib/motion/utils/gsap.ts`
- **Step 1: Ensure Flip plugin is registered**

Check if `Flip` is already imported/registered. If not, add:

```typescript
import { Flip } from 'gsap/Flip';

// In registerGsapPlugins():
gsap.registerPlugin(/* ...existing */, Flip);

// Add to exports:
export { Flip };
```

- **Step 2: Run type check**

Run: `bun run check`
Expected: PASS.

- **Step 3: Commit (if changes made)**

```bash
git add src/lib/motion/utils/gsap.ts
git commit -m "feat(slice-08): register GSAP Flip plugin for grid filter animation"
```

---

## Task 15: Integration Testing + Polish

**Files:**

- Various component files
- **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass. Fix any failures from data changes (e.g., tests that assumed 2 projects).

- **Step 2: Run type check**

Run: `bun run check`
Expected: PASS.

- **Step 3: Manual testing checklist**

Test at `http://localhost:5173/work`:

- Card grid renders all 5 public projects
- Service filter pills show 6 services
- Clicking a service filter shows only matching projects with FLIP animation
- Tag filter pills show all unique tags
- Clicking a tag filters with FLIP animation
- Combining service + tag filter works (AND logic)
- "All" resets each filter independently
- Cards show service SVG icons
- Cards are clickable → navigate to detail page
- Mobile (375px): single column, filters wrap

Test at `http://localhost:5173/work/yesid-dev`:

- Two-column layout on desktop
- Sidebar is sticky
- Data-flow diagram renders from stack[]
- Morph SVG icon animates on load
- Sections scroll-reveal
- Tags stagger in
- Service badges show in sidebar
- Links show (Live Site, GitHub)
- Mobile: sidebar renders above content
- Back link "← All Projects" works

Test 404: `http://localhost:5173/work/nonexistent` → 404 page

- **Step 4: Commit final polish**

```bash
git add -A
git commit -m "feat(slice-08): polish work pages — responsive, animations, filter UX"
```

---

## Task 16: Documentation Updates

**Files:**

- Update: `docs/reference/ARCHITECTURE.md`
- Update: `CLAUDE.md` (repo structure section)
- Update: `tree.txt`
- Create: `docs/devlog/2026-04-05-slice-08.md`
- `create handoff report`
- **Step 1: Update ARCHITECTURE.md**

Add work page components, routes, and SVG system to the architecture doc.

- **Step 2: Update CLAUDE.md repo structure**

Add work routes and new components to the directory listing.

- **Step 3: Update tree.txt**

Run: `cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"`

- **Step 4: Write dev log**

Create `docs/devlog/2026-04-05-slice-08.md` following the dev log format from CLAUDE.md.

- **Step 5: Commit docs**

```bash
git add docs/ CLAUDE.md tree.txt
git commit -m "docs(slice-08): update architecture, repo structure, and dev log"
```

---

## Summary


| Task | Component                    | Est.   |
| ---- | ---------------------------- | ------ |
| 1    | Type interfaces              | 2 min  |
| 2    | Services data (6 services)   | 5 min  |
| 3    | Projects data (6 projects)   | 5 min  |
| 4    | Data helpers + tests         | 5 min  |
| 5    | Data integrity tests         | 3 min  |
| 6    | Service SVGs (6 files)       | 10 min |
| 7    | WorkSvgIcon component        | 5 min  |
| 8    | DataFlowDiagram component    | 10 min |
| 9    | WorkCard component           | 5 min  |
| 10   | WorkListingPage + FLIP       | 15 min |
| 11   | /work route                  | 3 min  |
| 12   | Detail components (3)        | 15 min |
| 13   | /work/[slug] route           | 5 min  |
| 14   | GSAP Flip registration       | 2 min  |
| 15   | Integration testing + polish | 10 min |
| 16   | Documentation                | 5 min  |


