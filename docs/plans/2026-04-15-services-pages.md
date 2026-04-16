# Services Pages (17d-5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite services listing and detail pages with bold orange identity, constitutional wiring, and fixed scroll architecture.

**Architecture:** Eliminate the nested scroll container. Services pages use page-level Lenis scroll with `scroll-snap-type: y proximity`. Three solid orange surfaces (tabs strip, SVG panel, projects strip) frame dark viewport content. Asymmetric split layout — text left, orange SVG panel right. Standard cards for content sections. All wired through brand primitives, tokens, and constitutional patterns.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind v4, Bits UI (via ui/tabs), brand primitives (CornerMarks, SectionLabel, MetricDisplay, SvgIcon), Separator (ui/), CollapsibleSection, Vitest + @testing-library/svelte.

**Session estimate:** 2-3 implementation sessions.

**Design spec:** `docs/specs/2026-04-15-services-pages-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/components/services/ProjectsStrip.svelte` | Solid orange bottom strip — project links, dynamic per service |
| `src/lib/components/services/ProjectsStrip.test.ts` | Tests for ProjectsStrip |
| `src/lib/components/services/ServiceSvgPanel.svelte` | Orange container for service SVG with CornerMarks |
| `src/lib/components/services/ServiceSvgPanel.test.ts` | Tests for ServiceSvgPanel |

### Rewritten Files
| File | What changes |
|------|-------------|
| `src/lib/components/services/ServiceCard.svelte` | Asymmetric split, bigger typography, orange accents, benefit headline, impact metric |
| `src/lib/components/services/ServiceCard.test.ts` | Updated tests for new structure |
| `src/lib/components/services/ServiceListingPage.svelte` | Eliminate nested scroll, page-level snap, sticky tabs/strip |
| `src/lib/components/services/ServiceDetailPage.svelte` | Asymmetric hero, impact column, standard cards, orange strip |

### Modified Files
| File | What changes |
|------|-------------|
| `src/lib/components/shared/StationTabs.svelte` | Orange strip styling (bg, text color, active indicator, hazard edge) |
| `src/routes/+layout.svelte` | Remove `hideFooter` logic |
| `docs/reference/CONSTITUTION.md` | Add nested scroll ban + scrollbar visibility rule |
| `docs/reference/TESTS.md` | Update services test index |

---

## Task 1: Constitution Amendment — Scroll Law

**Files:**
- Modify: `docs/reference/CONSTITUTION.md` (Section 9, Scroll Law subsection)

- [ ] **Step 1: Read current Scroll Law section**

Read `docs/reference/CONSTITUTION.md` Section 9, locate the Scroll Law subsection (starts at line ~439).

- [ ] **Step 2: Add nested scroll ban and scrollbar visibility rules**

Add after the existing Scroll Law rule 5 ("Every scrollable container must have visible scroll affordance"):

```markdown
6. **No nested scroll containers.** A component must never create a scrollable container (`overflow-y: auto/scroll`) that captures page-level scroll. The page scroll (managed by Lenis) is the only vertical scroll axis. Exceptions: horizontally scrollable elements (`overflow-x: auto` for tabs, code blocks) and modal/drawer body content when the page scroll is locked via `body { overflow: hidden }`.
7. **Scrollbar visibility.** `scrollbar-width: none` is banned on vertically scrollable containers. Horizontal overflow elements may hide scrollbars if they have other scroll affordance (edge fade, arrow indicators).
```

- [ ] **Step 3: Add to Anti-Patterns (Section 11)**

Add to the "Never" list in Section 11:

```markdown
- `overflow-y: auto` + `scrollbar-width: none` on the same element — creates invisible scroll trap
- Nested vertical scroll containers that capture page-level Lenis scroll
```

- [ ] **Step 4: Commit**

```bash
git add docs/reference/CONSTITUTION.md
git commit -m "$(cat <<'EOF'
docs(slice-17d-5): amend constitution — ban nested scroll containers

Add rules 6-7 to Scroll Law: no nested vertical scroll containers
(Lenis is the only vertical scroll axis), scrollbar-width: none
banned on vertical scrollers. Add anti-patterns.
EOF
)"
```

---

## Task 2: Layout Fix — Remove hideFooter Logic

**Files:**
- Modify: `src/routes/+layout.svelte:40-41`

- [ ] **Step 1: Remove hideFooter derived and conditional**

In `src/routes/+layout.svelte`, remove:

```typescript
// Line 40-41 — DELETE these:
let hideFooter = $derived($page.url.pathname === '/services');
```

And change the footer conditional from:

```svelte
{#if !hideFooter}
  <div class="relative z-[45]">
    <Footer />
  </div>
{/if}
```

To:

```svelte
<div class="relative z-[45]">
  <Footer />
</div>
```

- [ ] **Step 2: Run check**

Run: `bun run check`
Expected: 0 errors (hideFooter was only used in the template conditional)

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "$(cat <<'EOF'
fix(slice-17d-5): restore footer to global layout on services page

Remove hideFooter logic — services page will use page-level scroll
so the footer flows naturally after content. D191.
EOF
)"
```

---

## Task 3: ServiceSvgPanel Component (TDD)

**Files:**
- Create: `src/lib/components/services/ServiceSvgPanel.test.ts`
- Create: `src/lib/components/services/ServiceSvgPanel.svelte`

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/services/ServiceSvgPanel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceSvgPanel from './ServiceSvgPanel.svelte';

describe('ServiceSvgPanel', () => {
  it('renders with data-testid', () => {
    render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
    expect(screen.getByTestId('service-svg-panel')).toBeTruthy();
  });

  it('renders SvgIcon when svgContent is provided', () => {
    render(ServiceSvgPanel, {
      props: { svgContent: '<svg><circle r="10"/></svg>' }
    });
    expect(screen.getByTestId('service-svg-panel').querySelector('[data-slot="svg-icon"]')).toBeTruthy();
  });

  it('renders CornerMarks', () => {
    render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
    expect(screen.getByTestId('service-svg-panel').querySelector('[data-slot="corner-marks"]')).toBeTruthy();
  });

  it('does not render when svgContent is empty', () => {
    render(ServiceSvgPanel, { props: { svgContent: '' } });
    expect(screen.queryByTestId('service-svg-panel')).toBeNull();
  });

  it('applies variant="banner" class for mobile layout', () => {
    render(ServiceSvgPanel, {
      props: { svgContent: '<svg></svg>', variant: 'banner' }
    });
    const el = screen.getByTestId('service-svg-panel');
    expect(el.classList.contains('svg-panel--banner')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/lib/components/services/ServiceSvgPanel.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ServiceSvgPanel**

Create `src/lib/components/services/ServiceSvgPanel.svelte`:

```svelte
<!--
  ServiceSvgPanel — orange container for service SVG illustrations.
  CornerMarks dress the panel. SVG strokes invert via container color.
  variant="panel" (desktop/tablet side panel) or "banner" (mobile full-width).
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { SvgIcon, CornerMarks } from '$lib/components/brand';

  export interface ServiceSvgPanelProps {
    /** Raw SVG content string */
    svgContent: string;
    /** "panel" = sized side panel, "banner" = full-width mobile strip */
    variant?: 'panel' | 'banner';
    class?: string;
    [key: string]: unknown;
  }

  let {
    svgContent,
    variant = 'panel',
    class: className = '',
    ...rest
  }: ServiceSvgPanelProps = $props();
</script>

{#if svgContent}
  <div
    class={cn(
      'svg-panel',
      variant === 'banner' && 'svg-panel--banner',
      className
    )}
    data-testid="service-svg-panel"
    {...rest}
  >
    <CornerMarks size="sm" opacity={0.25} />
    <SvgIcon {svgContent} size={variant === 'banner' ? 100 : 200} />
  </div>
{/if}

<style>
  .svg-panel {
    position: relative;
    background: var(--primary);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-stack);
    color: var(--background);
    overflow: hidden;
  }

  /* Desktop/tablet: sized panel */
  .svg-panel:not(.svg-panel--banner) {
    width: clamp(180px, 20vw, 280px);
    aspect-ratio: 5 / 6;
  }

  /* Mobile: full-width banner */
  .svg-panel--banner {
    width: 100%;
    padding: var(--space-stack);
  }
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/lib/components/services/ServiceSvgPanel.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/services/ServiceSvgPanel.svelte src/lib/components/services/ServiceSvgPanel.test.ts
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): ServiceSvgPanel — orange SVG container with CornerMarks

Solid orange panel with dark-stroked SVG (via currentColor inversion).
Two variants: "panel" (desktop side panel) and "banner" (mobile full-width).
5 tests. D184, D192.
EOF
)"
```

---

## Task 4: ProjectsStrip Component (TDD)

**Files:**
- Create: `src/lib/components/services/ProjectsStrip.test.ts`
- Create: `src/lib/components/services/ProjectsStrip.svelte`

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/services/ProjectsStrip.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectsStrip from './ProjectsStrip.svelte';

const mockProjects = [
  { slug: 'transit-data-pipeline', title: { en: 'Transit Data Pipeline' }, oneLiner: { en: '' }, description: { en: '' }, stack: [], tags: [], status: 'public' as const, featured: false, relatedServices: [], sections: [] },
  { slug: 'lorem-query-optimizer', title: { en: 'Query Optimizer' }, oneLiner: { en: '' }, description: { en: '' }, stack: [], tags: [], status: 'public' as const, featured: false, relatedServices: [], sections: [] },
];

describe('ProjectsStrip', () => {
  it('renders with data-testid', () => {
    render(ProjectsStrip, { props: { projects: mockProjects } });
    expect(screen.getByTestId('projects-strip')).toBeTruthy();
  });

  it('renders project links with correct hrefs', () => {
    render(ProjectsStrip, { props: { projects: mockProjects } });
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('/projects/transit-data-pipeline');
    expect(links[1].getAttribute('href')).toBe('/projects/lorem-query-optimizer');
  });

  it('renders project count', () => {
    render(ProjectsStrip, { props: { projects: mockProjects } });
    expect(screen.getByText('2 PROJECTS')).toBeTruthy();
  });

  it('renders contextual label when serviceTitle is provided', () => {
    render(ProjectsStrip, {
      props: { projects: mockProjects, serviceTitle: 'SQL Development' }
    });
    expect(screen.getByText('Built with SQL Development')).toBeTruthy();
  });

  it('renders default label when serviceTitle is omitted', () => {
    render(ProjectsStrip, { props: { projects: mockProjects } });
    expect(screen.getByText('Built with this')).toBeTruthy();
  });

  it('renders empty state when no projects', () => {
    render(ProjectsStrip, { props: { projects: [] } });
    expect(screen.getByText('0 PROJECTS')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/lib/components/services/ProjectsStrip.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ProjectsStrip**

Create `src/lib/components/services/ProjectsStrip.svelte`:

```svelte
<!--
  ProjectsStrip — solid orange bottom strip for services pages.
  Shows related project links. Updates dynamically on listing page.
  Layout: label | separator | project links (scrollable) | count
-->
<script lang="ts">
  import type { Project } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { Separator } from '$lib/components/ui/separator';
  import { cn } from '$lib/utils.js';

  export interface ProjectsStripProps {
    /** Projects to display */
    projects: readonly Project[];
    /** Optional service name for contextual label */
    serviceTitle?: string;
    class?: string;
    [key: string]: unknown;
  }

  let {
    projects,
    serviceTitle,
    class: className = '',
    ...rest
  }: ProjectsStripProps = $props();

  let label = $derived(
    serviceTitle ? `Built with ${serviceTitle}` : 'Built with this'
  );
  let countLabel = $derived(
    `${projects.length} ${projects.length === 1 ? 'PROJECT' : 'PROJECTS'}`
  );
</script>

<div class={cn('projects-strip', className)} data-testid="projects-strip" {...rest}>
  <div class="strip-inner">
    <span class="strip-label">{label}</span>
    <div class="strip-separator" aria-hidden="true"></div>
    <div class="strip-links">
      {#each projects as project (project.slug)}
        <a href="/projects/{project.slug}" class="strip-link">
          <span class="strip-dot" aria-hidden="true"></span>
          <span class="strip-name">{resolveLocale(project.title, 'en')}</span>
        </a>
      {/each}
    </div>
    <span class="strip-count">{countLabel}</span>
  </div>
  <Separator variant="hazard" hazardSize="sm" />
</div>

<style>
  .projects-strip {
    background: var(--primary);
    color: var(--background);
  }

  .strip-inner {
    display: flex;
    align-items: center;
    padding: 0.75rem var(--space-page-x);
    gap: var(--space-stack);
  }

  .strip-label {
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.45;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .strip-separator {
    width: 1px;
    height: 1rem;
    background: color-mix(in srgb, var(--background) 20%, transparent);
    flex-shrink: 0;
  }

  .strip-links {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-stack);
    overflow-x: auto;
  }

  .strip-link {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
    text-decoration: none;
    color: var(--background);
    font-size: var(--text-small);
    font-weight: 600;
    white-space: nowrap;
    transition: opacity var(--duration-fast);
  }
  .strip-link:hover {
    opacity: 0.7;
  }

  .strip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--background);
    opacity: 0.4;
    flex-shrink: 0;
  }

  .strip-count {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: var(--text-micro);
    letter-spacing: 1px;
    opacity: 0.4;
    white-space: nowrap;
  }
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/lib/components/services/ProjectsStrip.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/services/ProjectsStrip.svelte src/lib/components/services/ProjectsStrip.test.ts
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): ProjectsStrip — solid orange strip for service project links

Solid orange bg, dark text, hazard bottom edge. Dynamic label via
serviceTitle prop. Horizontal scroll on overflow. 6 tests. D184, D195.
EOF
)"
```

---

## Task 5: StationTabs Orange Restyling

**Files:**
- Modify: `src/lib/components/shared/StationTabs.svelte`

- [ ] **Step 1: Update scroll mode (Tabs.List) styling**

In `StationTabs.svelte`, change the `Tabs.List` class and style attributes:

From:
```svelte
<Tabs.List
  variant="line"
  class="station-tabs flex w-full overflow-x-auto border-b md:justify-center"
  style="background: var(--background); border-color: var(--border);"
>
```

To:
```svelte
<Tabs.List
  variant="line"
  class="station-tabs flex w-full overflow-x-auto md:justify-center"
  style="background: var(--primary); border: none;"
>
```

- [ ] **Step 2: Update navigate mode styling**

Change the `<nav>` element similarly:

From:
```svelte
<nav
  aria-label="Service navigation"
  class="station-tabs flex w-full overflow-x-auto border-b md:justify-center"
  style="background: var(--background); border-color: var(--border);"
>
```

To:
```svelte
<nav
  aria-label="Service navigation"
  class="station-tabs flex w-full overflow-x-auto md:justify-center"
  style="background: var(--primary); border: none;"
>
```

- [ ] **Step 3: Update tab item styles**

Replace the `.station-tab` CSS block:

```css
.station-tab {
  min-width: max-content;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  color: var(--background);
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  padding: 0.875rem 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-small);
  transition: opacity var(--duration-fast) var(--ease-default);
}

.station-tab.active {
  border-bottom-color: var(--background);
  color: var(--background);
  font-weight: 800;
}

.station-tab:not(.active):hover {
  opacity: 0.7;
}

.text-brand {
  color: var(--background);
}
```

- [ ] **Step 4: Remove hidden scrollbar styles**

Delete these CSS rules (scrollbar should be visible on overflow):

```css
/* DELETE — scrollbar must be visible per Constitution */
.station-tabs,
:global([data-slot="tabs-list"].station-tabs) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.station-tabs::-webkit-scrollbar,
:global([data-slot="tabs-list"].station-tabs)::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 5: Add hazard stripe above tabs**

Add `Separator` import (already imported) and add hazard stripe before the tabs in both modes. The existing `<Separator variant="hazard" />` at the top of the component already provides this — verify it's present. If not, add:

```svelte
<Separator variant="hazard" hazardSize="sm" />
```

- [ ] **Step 6: Run check and tests**

Run: `bun run check && bun run test src/lib/components/shared`
Expected: 0 errors, existing StationTabs tests pass (they test structure, not styling)

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/shared/StationTabs.svelte
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): StationTabs — solid orange strip styling

Orange bg, dark text, dark active indicator. Remove hidden scrollbar
(Constitution scroll visibility rule). Hazard stripe top edge. D184.
EOF
)"
```

---

## Task 6: ServiceCard Rewrite

**Files:**
- Rewrite: `src/lib/components/services/ServiceCard.svelte`
- Rewrite: `src/lib/components/services/ServiceCard.test.ts`

- [ ] **Step 1: Update tests for new structure**

Rewrite `ServiceCard.test.ts` — the component now has benefit headline, impact metric, and uses ServiceSvgPanel:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceCard from './ServiceCard.svelte';

const mockService = {
  id: 'sql-development',
  title: { en: 'SQL Development & Optimization' },
  subtitle: { en: '& Optimization' },
  description: {
    en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server.'
  },
  station: 1,
  relatedProjects: [],
  stack: ['PostgreSQL', 'SQL Server', 'T-SQL'],
  svg: 'service-sql.svg',
  visible: true,
  benefitHeadline: { en: 'Queries that run in seconds, not minutes' },
  impactMetric: {
    value: { en: '3x' },
    label: { en: 'faster avg query' },
  },
};

describe('ServiceCard', () => {
  it('renders the service title with orange dot', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
  });

  it('renders the benefit headline', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('Queries that run in seconds, not minutes')).toBeTruthy();
  });

  it('renders the impact metric value', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('3x')).toBeTruthy();
  });

  it('renders the station counter', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('Service 01 / 06')).toBeTruthy();
  });

  it('renders stack pills', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('PostgreSQL')).toBeTruthy();
    expect(screen.getByText('SQL Server')).toBeTruthy();
  });

  it('renders a "Deep dive" link with correct href', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    const link = screen.getByRole('link', { name: /deep dive/i });
    expect(link.getAttribute('href')).toBe('/services/sql-development');
  });

  it('renders ServiceSvgPanel when svgContent is provided', () => {
    render(ServiceCard, {
      props: {
        service: mockService,
        svgContent: '<svg><circle r="10"/></svg>',
        index: 0,
        total: 6
      }
    });
    expect(screen.getByTestId('service-svg-panel')).toBeTruthy();
  });

  it('applies scroll-snap-align via class', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    const el = screen.getByTestId('service-card-sql-development');
    expect(el).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/lib/components/services/ServiceCard.test.ts`
Expected: FAIL — new expected elements not found

- [ ] **Step 3: Rewrite ServiceCard component**

Rewrite `ServiceCard.svelte` with the asymmetric split layout, bigger typography, benefit headline, impact metric, and ServiceSvgPanel. Use `SectionLabel` for the station counter, orange accent tokens at full strength, and `cn()` for class composition. The component must:

- Fill 100dvh with `scroll-snap-align: start`
- Grid layout: text left, ServiceSvgPanel right (stacked on mobile)
- Use `resolveLocale()` for all text
- Show `benefitHeadline` and `impactMetric` from service data
- CTA button: solid orange bg, dark text
- Stack pills: orange border + orange text
- All responsive via canonical breakpoints (`lg:` for split → stack transition)

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/lib/components/services/ServiceCard.test.ts`
Expected: 8 tests PASS

- [ ] **Step 5: Run check**

Run: `bun run check`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/services/ServiceCard.svelte src/lib/components/services/ServiceCard.test.ts
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): ServiceCard — asymmetric split with bold orange accents

100dvh viewport, text left + ServiceSvgPanel right. Benefit headline,
impact metric, orange stack pills, solid orange CTA. Responsive:
split → stacked at lg:. 8 tests. D186.
EOF
)"
```

---

## Task 7: ServiceListingPage Rewrite

**Files:**
- Rewrite: `src/lib/components/services/ServiceListingPage.svelte`
- Modify: `src/routes/services/+page.svelte` (remove any footer references)

- [ ] **Step 1: Rewrite ServiceListingPage**

Rewrite `ServiceListingPage.svelte` — eliminate nested scroll container, use page-level scroll with scroll-snap, sticky StationTabs at top, sticky ProjectsStrip at bottom. Structure:

```
<div class="services-page">        ← no overflow: hidden, no fixed height
  <StationTabs />                   ← position: sticky; top: nav-height
  {#each services as service}
    <ServiceCard />                  ← 100dvh, scroll-snap-align: start
  {/each}
  <ProjectsStrip />                 ← position: sticky; bottom: 0
</div>
```

Key implementation details:
- Remove `height: calc(100dvh - 5rem)` and `overflow: hidden` from container
- Remove inner `.scroll-area` with `overflow-y: auto`
- Remove inner `<Footer />`
- Apply `scroll-snap-type: y proximity` to the `.services-page` container (or via a CSS class on `<main>` for services route)
- StationTabs: `position: sticky; top: 5rem; z-index: var(--z-rail)`
- ProjectsStrip: `position: sticky; bottom: 0; z-index: var(--z-rail)`
- Use `IntersectionObserver` on each ServiceCard viewport (`threshold: 0.5`) to track active service → update `activeId` for StationTabs and `currentProjects` for ProjectsStrip
- Pass `serviceTitle` to ProjectsStrip for contextual label
- Remove RelatedProjects import (replaced by ProjectsStrip)

- [ ] **Step 2: Update +page.svelte if needed**

Check `src/routes/services/+page.svelte` — remove any Footer-related imports or references. The footer is now in the global layout.

- [ ] **Step 3: Run check and existing tests**

Run: `bun run check && bun run test src/lib/components/services`
Expected: 0 errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/services/ServiceListingPage.svelte src/routes/services/+page.svelte
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): ServiceListingPage — page-level scroll, orange strips

Eliminate nested scroll container. Page-level Lenis scroll with
scroll-snap: y proximity. Sticky StationTabs (top) + ProjectsStrip
(bottom, dynamic). IntersectionObserver tracks active viewport.
D188, D190, D191, D195.
EOF
)"
```

---

## Task 8: ServiceDetailPage Rewrite

**Files:**
- Rewrite: `src/lib/components/services/ServiceDetailPage.svelte`

- [ ] **Step 1: Rewrite ServiceDetailPage**

Rewrite with asymmetric split hero, impact metric column (desktop), standard cards, and orange ProjectsStrip. Structure:

```
<article>
  <StationTabs mode="navigate" />
  
  <!-- Hero: asymmetric split -->
  <div class="hero">
    <a href="/services" class="back-link">← All Services</a>
    <div class="hero-grid">                        ← grid: 1fr auto (desktop)
      <div class="hero-text">
        <SectionLabel />                           ← "Service 01 / 06"
        <h1>SQL Development.</h1>
        <p class="subtitle">& Optimization</p>
        <p class="description">...</p>
        <div class="stack-pills">...</div>
      </div>
      <ServiceSvgPanel />                          ← orange panel (desktop)
    </div>
    <ServiceSvgPanel variant="banner" />           ← orange banner (mobile only)
  </div>
  
  <Separator variant="hazard" />
  
  <!-- Body: impact column + sections -->
  <div class="body-grid">                          ← grid: 200px 1fr (desktop)
    <div class="impact-column">                    ← sticky, desktop only
      <MetricDisplay value="3x" label="faster" size="lg" labelBelow />
      <p class="benefit-headline">...</p>
    </div>
    <div class="sections">
      <CollapsibleSection title="How This Helps You">...</CollapsibleSection>
      <CollapsibleSection title="Typical Deliverables">...</CollapsibleSection>
      {#each service.sections as section}
        <CollapsibleSection>...</CollapsibleSection>
      {/each}
    </div>
  </div>
  
  <ProjectsStrip serviceTitle={title} />
  <ServiceNav {prev} {next} />
</article>
```

Key implementation details:
- Use `SectionLabel` for station counter (variant="station")
- Use `MetricDisplay` (brand primitive) for impact metric — `size="lg"`, `labelBelow`
- Use `CollapsibleSection` for content sections — standard card styling
- Use `Separator variant="hazard"` between hero and body
- Use `cn()` for class composition
- Use `use:reveal` on body sections for scroll-triggered entrance
- Use `use:boop` on back link, CTA, prev/next
- Desktop: impact column `position: sticky; top: 5rem` within the body grid
- Mobile: impact metric inline above sections, ServiceSvgPanel variant="banner"
- Responsive grid: `grid-template-columns: 200px 1fr` on `xl:`, single column below
- Hero grid: `grid-template-columns: 1fr auto` on `lg:`, stacked below

- [ ] **Step 2: Run check and tests**

Run: `bun run check && bun run test src/lib/components/services`
Expected: 0 errors, all tests pass (ServiceNav tests unchanged)

- [ ] **Step 3: Visual preflight**

Before STOPping, verify expected layout:
- Desktop 1440px: asymmetric hero, impact column left, sections right
- Mobile 375px: stacked, SVG banner, inline metric

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/services/ServiceDetailPage.svelte
git commit -m "$(cat <<'EOF'
feat(slice-17d-5): ServiceDetailPage — asymmetric split, impact column

Orange StationTabs, asymmetric hero with ServiceSvgPanel, impact
metric column (desktop sticky), standard CollapsibleSection cards,
ProjectsStrip, prev/next nav. D186, D187, D189.
EOF
)"
```

---

## Task 9: Scroll Audit + TESTS.md + CSS.md

**Files:**
- Modify: `docs/reference/TESTS.md`
- Modify: `docs/reference/CSS.md` (if new tokens added)
- Audit: repo-wide `overflow-y: auto` + `scrollbar-width: none`

- [ ] **Step 1: Repo-wide scroll audit**

Search for other nested scroll containers:
```bash
# Find vertically scrollable containers with hidden scrollbars
grep -rn "scrollbar-width: none" src/ --include="*.svelte" --include="*.css"
grep -rn "overflow-y: auto" src/ --include="*.svelte" --include="*.css"
```

For each finding:
- If it's a vertical container that captures page scroll → flag for fix
- If it's a horizontal overflow or modal/drawer body → acceptable (document why)
- StationTabs hidden scrollbar is already fixed in Task 5

- [ ] **Step 2: Update TESTS.md**

Add new test entries under the Components section:

```markdown
### Services
- `ServiceCard.test.ts` — title, benefit headline, impact metric, station counter, stack pills, CTA link, SVG panel (8 tests)
- `ServiceSvgPanel.test.ts` — rendering, CornerMarks, empty state, banner variant (5 tests)
- `ProjectsStrip.test.ts` — project links, count, contextual label, empty state (6 tests)
- `ServiceNav.test.ts` — prev/next links, hrefs, titles, omissions (5 tests)
```

- [ ] **Step 3: Commit**

```bash
git add docs/reference/TESTS.md docs/reference/CSS.md
git commit -m "$(cat <<'EOF'
docs(slice-17d-5): update TESTS.md and CSS.md for services pages
EOF
)"
```

---

## Task 10: Visual Verification + Final Check

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Print the test table per CLAUDE.md.

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: 0 errors

- [ ] **Step 3: Visual verification — listing page**

Start dev server: `bun run dev`
Navigate to `http://localhost:5173/services`

Check at 1440px:
- [ ] Page scrolls normally (Lenis). Trackpad, mousewheel, scrollbar all work.
- [ ] StationTabs: solid orange, sticky at top, dark text, hazard stripe top edge
- [ ] Each service occupies 100dvh, scroll-snap guides to start
- [ ] ServiceCard: asymmetric split (text left, orange SVG panel right)
- [ ] Title ~64px, benefit headline visible, impact metric orange
- [ ] Stack pills: orange border + orange text
- [ ] CTA: solid orange button
- [ ] ProjectsStrip: solid orange, sticky bottom, updates dynamically per service
- [ ] Footer appears after last service (not inside scroll container)

Check at 375px:
- [ ] Stacked layout: orange SVG banner at top, title below
- [ ] Tabs scroll horizontally
- [ ] No horizontal overflow

- [ ] **Step 4: Visual verification — detail page**

Navigate to `http://localhost:5173/services/sql-development`

Check at 1440px:
- [ ] StationTabs: solid orange, navigate mode, "01 SQL Dev" active
- [ ] Hero: asymmetric split, orange SVG panel right
- [ ] Hazard separator between hero and body
- [ ] Impact metric column sticky on left (52px "3x")
- [ ] Content sections: standard cards (bg-card, border-subtle)
- [ ] ProjectsStrip: solid orange, "Built with SQL Development"
- [ ] Prev/next nav: orange arrows, boop on hover

Check at 375px:
- [ ] SVG banner full-width at top
- [ ] Impact metric inline
- [ ] Sections stacked

- [ ] **Step 5: STOP and report to Yesid**

Report what was built, what to check on `http://localhost:5173/services` and `/services/sql-development`, and any decisions made.

---

## Session Estimates

| Session | Tasks | Focus |
|---------|-------|-------|
| 1 | T1-T5 | Constitution, layout fix, new components, StationTabs restyle |
| 2 | T6-T7 | ServiceCard + ServiceListingPage rewrite |
| 3 | T8-T10 | ServiceDetailPage rewrite, audit, verification |

Tasks are sequenced so each session produces a buildable, testable state. The iteration protocol applies: one task → test → STOP → approval → next task.
