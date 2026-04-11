# Slice 09 — Services Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/services` (full-viewport kinetic scroll index) and `/services/[id]` (consultative detail page) with station tab navigation, DrawSVGPlugin animations, and proof strips.

**Architecture:** Data model extension adds optional fields to Service interface (backward compatible). Six new components: StationTabs (shared), ServiceCard, ProofStrip, ServiceListingPage, ServiceDetailPage, ServiceNav. Two new routes with SvelteKit load functions. All content through LocalizedString, all motion through existing GSAP/action infrastructure.

**Tech Stack:** SvelteKit 2 + Svelte 5, TypeScript, GSAP (ScrollTrigger, DrawSVGPlugin, SplitText), Tailwind CSS, Vitest + @testing-library/svelte

**Design spec:** `docs/superpowers/specs/2026-04-06-slice-09-services-design.md`
**Visual mockups:** `.superpowers/brainstorm/1296-1775447657/content/services-tabs-mobile.html` (index) and `service-detail-layout.html` (detail)

---

## File Structure

### New Files
```
src/lib/data/types.ts                     — MODIFY: add ServiceSection, subtitle, new optional fields to Service
src/lib/data/services.ts                  — MODIFY: populate new fields for all 6 services
src/lib/data/services.ts                  — MODIFY: add getAdjacentServices() helper
src/lib/components/StationTabs.svelte     — CREATE: reusable station tab navigation
src/lib/components/StationTabs.test.ts    — CREATE: tests
src/lib/components/ServiceCard.svelte     — CREATE: per-viewport service content block
src/lib/components/ServiceCard.test.ts    — CREATE: tests
src/lib/components/ProofStrip.svelte      — CREATE: bottom project proof strip
src/lib/components/ProofStrip.test.ts     — CREATE: tests
src/lib/components/ServiceListingPage.svelte — CREATE: full-viewport scroll layout
src/lib/components/ServiceDetailPage.svelte  — CREATE: detail page layout
src/lib/components/ServiceNav.svelte      — CREATE: prev/next service navigation
src/lib/components/ServiceNav.test.ts     — CREATE: tests
src/routes/services/+page.svelte          — CREATE: index route
src/routes/services/+page.ts              — CREATE: index load function
src/routes/services/[id]/+page.svelte     — CREATE: detail route
src/routes/services/[id]/+page.ts         — CREATE: detail load function
```

### Reused (no changes needed)
```
src/lib/data/serviceSvg.ts                — fetchServiceSvgContents(), getServiceSvgUrl()
src/lib/data/projects.ts                  — getProjectsByService()
src/lib/data/locale.ts                    — resolveLocale()
src/lib/data/index.ts                     — MODIFY: re-export new helpers
src/lib/motion/actions/reveal.ts          — use:reveal
src/lib/motion/actions/boop.ts            — use:boop
src/lib/motion/utils/stagger.ts           — stagger()
src/lib/motion/utils/gsap.ts              — registerGsapPlugins, ScrollTrigger
src/lib/components/DataFlowDiagram.svelte — stack visualization
```

---

## Task 1: Extend Service Data Model

**Files:**
- Modify: `src/lib/data/types.ts`
- Test: `src/lib/data/data-integrity.test.ts` (existing)

- [ ] **Step 1: Add ServiceSection interface and new Service fields to types.ts**

```typescript
// Add after the existing ProjectSection interface (around line 24):

// A content block inside a service's detail page.
// Same pattern as ProjectSection — separating sections from the main description
// allows rich detail pages without bloating the listing-level fields.
export interface ServiceSection {
  title: LocalizedString;
  content: LocalizedString;
}

// Then add these new optional fields to the Service interface, after relatedProjects:

  // --- Detail page fields (all optional for backward compat) ---
  // Optional qualifier shown below title (e.g., "& Optimization")
  subtitle?: LocalizedString;
  // 2-3 paragraph deep dive for the detail page
  longDescription?: LocalizedString;
  // "How this helps you" — client-facing value proposition
  valueProposition?: LocalizedString;
  // Typical deliverables list
  deliverables?: LocalizedString[];
  // Tools/technologies used in this service (not localized — tech names are universal)
  stack?: string[];
  // Custom collapsible content blocks for the detail page
  sections?: ServiceSection[];
```

- [ ] **Step 2: Run existing tests to verify backward compatibility**

Run: `bun run test -- --run src/lib/data/data-integrity.test.ts`
Expected: All existing tests PASS (new fields are optional, nothing breaks)

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/types.ts
git commit -m "feat(slice-09): extend Service interface with detail page fields"
```

---

## Task 2: Populate Service Data

**Files:**
- Modify: `src/lib/data/services.ts`
- Modify: `src/lib/data/index.ts`

- [ ] **Step 1: Add getAdjacentServices helper to services.ts**

```typescript
/**
 * Returns the previous and next services relative to the given ID,
 * ordered by station number. Used for prev/next navigation on detail pages.
 */
export function getAdjacentServices(id: string): { prev?: Service; next?: Service } {
  const visible = services.filter((s) => s.visible !== false);
  const sorted = [...visible].sort((a, b) => a.station - b.station);
  const index = sorted.findIndex((s) => s.id === id);
  if (index === -1) return {};
  return {
    prev: index > 0 ? sorted[index - 1] : undefined,
    next: index < sorted.length - 1 ? sorted[index + 1] : undefined
  };
}
```

- [ ] **Step 2: Populate all 6 services with new fields**

Add `subtitle`, `valueProposition`, `deliverables`, `stack`, and `sections` to each service object. Content is consultative, client-facing. Example for the first service:

```typescript
{
  id: 'sql-development',
  title: { en: 'SQL Development & Optimization' },
  subtitle: { en: '& Optimization' },
  description: {
    en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.'
  },
  station: 1,
  icon: 'station-sql.json',
  svg: 'service-sql.svg',
  visible: true,
  relatedProjects: ['transit-data-pipeline', 'lorem-query-optimizer', 'lorem-database-migration'],
  valueProposition: {
    en: 'Slow queries cost money — in compute, in delayed reports, in frustrated analysts waiting for data. I audit your SQL layer, identify the expensive queries, and rewrite them for speed and clarity. You get faster dashboards, lower database costs, and code your team can actually maintain.'
  },
  deliverables: [
    { en: 'Query performance audit' },
    { en: 'Optimized stored procedures' },
    { en: 'Index optimization strategy' },
    { en: 'Schema refactoring plan' },
    { en: 'Migration scripts with rollback' },
    { en: 'Documentation and runbook' }
  ],
  stack: ['PostgreSQL', 'SQL Server', 'T-SQL', 'PL/pgSQL'],
  sections: [
    {
      title: { en: 'My Approach' },
      content: {
        en: 'I start with your slowest queries — the ones that block dashboards and frustrate users. Using execution plans and profiling tools, I identify the root cause (missing indexes, implicit conversions, parameter sniffing) and fix them systematically. Every change is tested against production-scale data before deployment.'
      }
    }
  ]
}
```

Repeat this pattern for all 6 services with appropriate content for each:
- **data-pipeline**: stack: Python, dbt, Apache Airflow, PostgreSQL
- **analytics-reporting**: stack: Power BI, Retool, DAX, SQL
- **database-engineering**: stack: PostgreSQL, SQL Server, Alembic, Python
- **internal-tooling**: stack: Retool, PostgreSQL, REST API, Node.js
- **web-development**: stack: SvelteKit, TypeScript, Tailwind CSS, Vercel

- [ ] **Step 3: Re-export getAdjacentServices from index.ts**

Add to `src/lib/data/index.ts`:
```typescript
export { services, getServiceById, getVisibleServices, getAdjacentServices } from './services.js';
```

- [ ] **Step 4: Run tests**

Run: `bun run test -- --run src/lib/data/`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/services.ts src/lib/data/index.ts
git commit -m "feat(slice-09): populate service detail data + add getAdjacentServices helper"
```

---

## Task 3: StationTabs Component

**Files:**
- Create: `src/lib/components/StationTabs.svelte`
- Create: `src/lib/components/StationTabs.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StationTabs from './StationTabs.svelte';

const mockServices = [
  { id: 'sql-development', title: { en: 'SQL Development & Optimization' }, description: { en: '' }, station: 1, relatedProjects: [], visible: true },
  { id: 'data-pipeline', title: { en: 'Data Pipeline Architecture' }, description: { en: '' }, station: 2, relatedProjects: [], visible: true },
  { id: 'analytics-reporting', title: { en: 'Analytics & Reporting Systems' }, description: { en: '' }, station: 3, relatedProjects: [], visible: true }
];

describe('StationTabs', () => {
  it('renders a tab for each service', () => {
    render(StationTabs, { props: { services: mockServices, activeId: 'sql-development' } });
    expect(screen.getByText('SQL Dev')).toBeTruthy();
    expect(screen.getByText('Pipeline')).toBeTruthy();
    expect(screen.getByText('Analytics')).toBeTruthy();
  });

  it('renders station numbers', () => {
    render(StationTabs, { props: { services: mockServices, activeId: 'sql-development' } });
    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('02')).toBeTruthy();
    expect(screen.getByText('03')).toBeTruthy();
  });

  it('marks the active tab', () => {
    render(StationTabs, { props: { services: mockServices, activeId: 'data-pipeline' } });
    const activeTab = screen.getByTestId('station-tab-data-pipeline');
    expect(activeTab.getAttribute('data-active')).toBe('true');
  });

  it('renders links in navigate mode', () => {
    render(StationTabs, { props: { services: mockServices, activeId: 'sql-development', mode: 'navigate' } });
    const link = screen.getByTestId('station-tab-data-pipeline');
    expect(link.closest('a')?.getAttribute('href')).toBe('/services/data-pipeline');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- --run src/lib/components/StationTabs.test.ts`
Expected: FAIL (component doesn't exist)

- [ ] **Step 3: Implement StationTabs.svelte**

```svelte
<!--
  Reusable station tab navigation for /services index and detail pages.
  Two modes:
  - 'scroll': tabs trigger scrollTo (index page, controlled by parent via onSelect)
  - 'navigate': tabs are <a> links to /services/[id] (detail page)
-->
<script lang="ts">
  import type { Service } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';

  let {
    services,
    activeId,
    mode = 'scroll',
    onSelect
  }: {
    services: readonly Service[];
    activeId: string;
    mode?: 'scroll' | 'navigate';
    onSelect?: (id: string) => void;
  } = $props();

  // Short label: first word or two for compact display
  function shortLabel(service: Service): string {
    const title = resolveLocale(service.title, 'en');
    const words = title.split(' ');
    // "SQL Development & Optimization" → "SQL Dev"
    // "Data Pipeline Architecture" → "Pipeline"
    // "Analytics & Reporting Systems" → "Analytics"
    // "Database Engineering" → "DB Eng."
    // "Internal Tooling" → "Tooling"
    // "Web Development" → "Web Dev"
    if (words[0] === 'SQL') return 'SQL Dev';
    if (words[0] === 'Data') return 'Pipeline';
    if (words[0] === 'Analytics') return 'Analytics';
    if (words[0] === 'Database') return 'DB Eng.';
    if (words[0] === 'Internal') return 'Tooling';
    if (words[0] === 'Web') return 'Web Dev';
    return words[0];
  }

  let sorted = $derived(
    [...services].sort((a, b) => a.station - b.station)
  );

  function handleClick(id: string) {
    if (mode === 'scroll' && onSelect) {
      onSelect(id);
    }
  }
</script>

<nav
  class="station-tabs"
  data-testid="station-tabs"
  aria-label="Service navigation"
>
  <div class="station-tabs-inner">
    {#each sorted as service, i}
      {@const isActive = service.id === activeId}
      {@const stationNum = String(service.station).padStart(2, '0')}
      {@const distance = Math.abs(sorted.findIndex(s => s.id === activeId) - i)}
      {@const opacity = isActive ? 1 : Math.max(0.35, 1 - distance * 0.15)}

      {#if mode === 'navigate'}
        <a
          href="/services/{service.id}"
          class="station-tab"
          class:active={isActive}
          style="opacity: {opacity}"
          data-testid="station-tab-{service.id}"
          data-active={isActive}
          aria-current={isActive ? 'page' : undefined}
        >
          <span class="station-num">{stationNum}</span>
          <span class="station-label">{shortLabel(service)}</span>
        </a>
      {:else}
        <button
          class="station-tab"
          class:active={isActive}
          style="opacity: {opacity}"
          data-testid="station-tab-{service.id}"
          data-active={isActive}
          onclick={() => handleClick(service.id)}
          aria-current={isActive ? 'true' : undefined}
        >
          <span class="station-num">{stationNum}</span>
          <span class="station-label">{shortLabel(service)}</span>
        </button>
      {/if}
    {/each}
  </div>
</nav>

<style>
  .station-tabs {
    background: var(--color-bg-secondary, #0d0d0d);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    position: relative;
  }
  .station-tabs::-webkit-scrollbar { display: none; }

  .station-tabs-inner {
    display: flex;
    align-items: stretch;
    height: 46px;
    border-bottom: 1px solid var(--color-border, #1a1a1a);
    min-width: max-content;
  }

  .station-tab {
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 14px;
    border: none;
    background: transparent;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: opacity 0.3s, border-color 0.3s;
  }

  .station-tab.active {
    background: var(--color-bg-tertiary, #111);
    border-bottom-color: #E07800;
    opacity: 1 !important;
  }

  .station-tab:hover { opacity: 0.85 !important; }

  .station-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.5rem;
    color: #555;
    font-weight: 700;
  }
  .station-tab.active .station-num { color: #E07800; }

  .station-label {
    font-size: 0.68rem;
    color: #888;
    white-space: nowrap;
  }
  .station-tab.active .station-label {
    color: var(--text-primary, #f5f5f0);
    font-weight: 700;
  }
</style>
```

- [ ] **Step 4: Run tests**

Run: `bun run test -- --run src/lib/components/StationTabs.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/StationTabs.svelte src/lib/components/StationTabs.test.ts
git commit -m "feat(slice-09): add StationTabs component — reusable station tab navigation"
```

---

## Task 4: ProofStrip Component

**Files:**
- Create: `src/lib/components/ProofStrip.svelte`
- Create: `src/lib/components/ProofStrip.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProofStrip from './ProofStrip.svelte';

const mockProjects = [
  { slug: 'transit-data-pipeline', title: { en: 'Transit Data Pipeline' }, oneLiner: { en: 'ELT for transit' }, description: { en: '' }, stack: [], tags: [], status: 'public' as const, featured: false, relatedServices: [], sections: [] },
  { slug: 'lorem-query-optimizer', title: { en: 'Query Optimizer' }, oneLiner: { en: 'SQL analysis' }, description: { en: '' }, stack: [], tags: [], status: 'public' as const, featured: false, relatedServices: [], sections: [] }
];

describe('ProofStrip', () => {
  it('renders project count', () => {
    render(ProofStrip, { props: { projects: mockProjects } });
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders project titles', () => {
    render(ProofStrip, { props: { projects: mockProjects } });
    expect(screen.getByText('Transit Data Pipeline')).toBeTruthy();
    expect(screen.getByText('Query Optimizer')).toBeTruthy();
  });

  it('links projects to /work/[slug]', () => {
    render(ProofStrip, { props: { projects: mockProjects } });
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('/work/transit-data-pipeline');
  });

  it('renders label text', () => {
    render(ProofStrip, { props: { projects: mockProjects } });
    expect(screen.getByText('Built with this')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- --run src/lib/components/ProofStrip.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement ProofStrip.svelte**

The ProofStrip shows related projects as mini-cards linking to `/work/[slug]`. Desktop: horizontal row with title + one-liner. Mobile: scrollable, title only.

Props: `projects: readonly Project[]`

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ProofStrip.svelte src/lib/components/ProofStrip.test.ts
git commit -m "feat(slice-09): add ProofStrip component — bottom project proof strip"
```

---

## Task 5: ServiceCard Component

**Files:**
- Create: `src/lib/components/ServiceCard.svelte`
- Create: `src/lib/components/ServiceCard.test.ts`

- [ ] **Step 1: Write failing tests**

Tests verify: renders title, description, station counter, stack pills, "Deep dive" CTA with correct href, SVG container.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement ServiceCard.svelte**

Per-viewport content block for the index page. Contains: station counter ("Service 01 / 06"), large kinetic title (SplitText target), optional subtitle, description, stack pills, "Deep dive →" link to `/services/[id]`, SVG placeholder (DrawSVGPlugin target).

Props: `service: Service`, `svgContent: string`, `index: number`, `total: number`

Desktop: text left, SVG right. Mobile: SVG centered above, text below.

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ServiceCard.svelte src/lib/components/ServiceCard.test.ts
git commit -m "feat(slice-09): add ServiceCard component — per-viewport service content"
```

---

## Task 6: ServiceNav Component

**Files:**
- Create: `src/lib/components/ServiceNav.svelte`
- Create: `src/lib/components/ServiceNav.test.ts`

- [ ] **Step 1: Write failing tests**

Tests verify: renders prev/next links, first service has no prev, last service has no next, correct hrefs.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement ServiceNav.svelte**

Props: `prev?: Service`, `next?: Service`. Renders prev (left) and next (right) links to `/services/[id]` with service title. Uses `use:boop` on hover.

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ServiceNav.svelte src/lib/components/ServiceNav.test.ts
git commit -m "feat(slice-09): add ServiceNav component — prev/next service navigation"
```

---

## Task 7: /services Route (Index Page)

**Files:**
- Create: `src/routes/services/+page.ts`
- Create: `src/routes/services/+page.svelte`
- Create: `src/lib/components/ServiceListingPage.svelte`

- [ ] **Step 1: Create load function**

```typescript
// src/routes/services/+page.ts
import {
  getVisibleServices,
  getProjectsByService,
  fetchServiceSvgContents
} from '$lib/data';

export async function load({ fetch }) {
  const services = getVisibleServices();
  const serviceSvgContents = await fetchServiceSvgContents(fetch);

  // Pre-resolve related projects for each service (for ProofStrip)
  const serviceProjects: Record<string, ReturnType<typeof getProjectsByService>> = {};
  for (const service of services) {
    serviceProjects[service.id] = getProjectsByService(service.id);
  }

  return { services, serviceSvgContents, serviceProjects };
}
```

- [ ] **Step 2: Create ServiceListingPage.svelte**

Full-viewport scroll layout. Composes: StationTabs (sticky top, mode='scroll'), metro line (left, desktop only), ServiceCard per viewport, ProofStrip (fixed bottom). GSAP ScrollTrigger with snap. DrawSVGPlugin on SVGs. SplitText on titles.

Key behavior:
- `snap: 1 / services.length` for viewport locking
- ScrollTrigger `onUpdate` syncs active tab and metro line
- Click tab → `gsap.scrollTo` target viewport
- Metro line: CSS gradient updated via ScrollTrigger progress
- `prefers-reduced-motion`: skip DrawSVG/SplitText, instant snap

- [ ] **Step 3: Create +page.svelte route wrapper**

```svelte
<!-- src/routes/services/+page.svelte -->
<script lang="ts">
  import ServiceListingPage from '$lib/components/ServiceListingPage.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Services — yesid.</title>
  <meta name="description" content="Data infrastructure, tools, and systems. SQL development, data pipelines, analytics, database engineering, internal tooling, and web development." />
</svelte:head>

<ServiceListingPage
  services={data.services}
  serviceSvgContents={data.serviceSvgContents}
  serviceProjects={data.serviceProjects}
/>
```

- [ ] **Step 4: Run dev server and verify /services loads**

Run: `bun run dev`
Navigate to: `http://localhost:5173/services`
Expected: Page renders with all 6 services in viewport-snapped layout

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/routes/services/ src/lib/components/ServiceListingPage.svelte
git commit -m "feat(slice-09): add /services index — full-viewport kinetic scroll layout"
```

---

## Task 8: /services/[id] Route (Detail Page)

**Files:**
- Create: `src/routes/services/[id]/+page.ts`
- Create: `src/routes/services/[id]/+page.svelte`
- Create: `src/lib/components/ServiceDetailPage.svelte`

- [ ] **Step 1: Create load function with 404**

```typescript
// src/routes/services/[id]/+page.ts
import { error } from '@sveltejs/kit';
import {
  getServiceById,
  getVisibleServices,
  getAdjacentServices,
  getProjectsByService,
  fetchServiceSvgContents
} from '$lib/data';

export async function load({ params, fetch }) {
  const service = getServiceById(params.id);

  if (!service || service.visible === false) {
    error(404, { message: 'Service not found' });
  }

  const services = getVisibleServices();
  const { prev, next } = getAdjacentServices(params.id);
  const relatedProjects = getProjectsByService(params.id);
  const serviceSvgContents = await fetchServiceSvgContents(fetch);

  return { service, services, prev, next, relatedProjects, serviceSvgContents };
}
```

- [ ] **Step 2: Create ServiceDetailPage.svelte**

Layout: StationTabs (mode='navigate') at top, hero (SVG + title + description + stack), gradient divider, collapsible sections (reuse WorkDetailPage pattern — chevron toggle, `use:reveal`), related projects band (3-col grid desktop, stacked mobile), ServiceNav at bottom.

Collapsible sections:
1. "How This Helps You" — `service.valueProposition` (open by default)
2. "Typical Deliverables" — `service.deliverables[]` (open by default, 2-col grid)
3. Custom `service.sections[]` — collapsed by default

All sections render only if their data field is defined.

- [ ] **Step 3: Create +page.svelte route wrapper**

```svelte
<!-- src/routes/services/[id]/+page.svelte -->
<script lang="ts">
  import ServiceDetailPage from '$lib/components/ServiceDetailPage.svelte';
  import { resolveLocale } from '$lib/data/locale.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>{resolveLocale(data.service.title, 'en')} — yesid.</title>
  <meta name="description" content={resolveLocale(data.service.description, 'en')} />
</svelte:head>

<ServiceDetailPage
  service={data.service}
  services={data.services}
  prev={data.prev}
  next={data.next}
  relatedProjects={data.relatedProjects}
  serviceSvgContents={data.serviceSvgContents}
/>
```

- [ ] **Step 4: Verify /services/sql-development loads**

Navigate to: `http://localhost:5173/services/sql-development`
Expected: Detail page renders with hero, sections, related projects, prev/next nav

- [ ] **Step 5: Verify 404 for invalid ID**

Navigate to: `http://localhost:5173/services/nonexistent`
Expected: 404 page

- [ ] **Step 6: Verify service badges on work pages link correctly**

Navigate to: `http://localhost:5173/work/transit-data-pipeline`
Click a service badge → should navigate to `/services/[id]` (no more 404)

- [ ] **Step 7: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/routes/services/[id]/ src/lib/components/ServiceDetailPage.svelte
git commit -m "feat(slice-09): add /services/[id] detail — consultative deep dive with collapsible sections"
```

---

## Task 9: Integration Tests + Polish

**Files:**
- Modify: existing test files as needed

- [ ] **Step 1: Write route-level tests**

Test that `/services` renders all 6 services, `/services/sql-development` renders the detail page, and `/services/invalid-id` returns 404.

- [ ] **Step 2: Verify bidirectional navigation**

- From `/services` → click "Deep dive" → lands on `/services/[id]`
- From `/services/[id]` → click project in related projects → lands on `/work/[slug]`
- From `/work/[slug]` → click service badge → lands on `/services/[id]`
- From `/services/[id]` → click station tab → lands on other `/services/[other-id]`
- From `/services/[id]` → click prev/next → navigates correctly

- [ ] **Step 3: Run full test suite**

Run: `bun run test`
Run: `bun run check`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(slice-09): add integration tests for services routes"
```

---

## Task 10: Docs + Handoff Prep

**Files:**
- Modify: `docs/PLAN.md`
- Modify: `CLAUDE.md`
- Update: `docs/slices/slice-09-services.md`
- Create: `docs/devlog/YYYY-MM-DD-slice-09.md`
- Update: `tree.txt`

- [ ] **Step 1: Update PLAN.md slice 09 status**

Change status from `planned` to `in-progress` (or `complete` if approved).

- [ ] **Step 2: Update CLAUDE.md**

Update "Active Slice" section and repo structure to include `/services` routes and new components.

- [ ] **Step 3: Update slice spec**

Update `docs/slices/slice-09-services.md` to reflect the approved design (replace the old spec with the approved design from the brainstorming spec).

- [ ] **Step 4: Write dev log**

- [ ] **Step 5: Update tree.txt**

Run the tree command per CLAUDE.md instructions.

- [ ] **Step 6: Commit all docs**

```bash
git add docs/ CLAUDE.md tree.txt
git commit -m "docs: update slice 09 spec, plan, and devlog"
```

---

## Execution Order

Tasks 1-2 (data) → Tasks 3-6 (components, parallelizable) → Task 7 (index route) → Task 8 (detail route) → Task 9 (tests) → Task 10 (docs)

Components in Tasks 3-6 are independent and can be built in parallel by separate agents if using subagent-driven development.
