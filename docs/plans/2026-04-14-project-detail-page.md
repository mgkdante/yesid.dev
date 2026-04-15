# Project Detail Page Redesign — Implementation Plan

**Date:** 2026-04-14
**Slice:** 17d (Component API)
**Branch:** `feature/slice-17d-component-api`
**Spec:** `docs/specs/2026-04-14-project-detail-page-design.md`
**Mockup:** `docs/reference/mockups/project-detail-page-approved.html`

> **For agentic workers:** This plan is designed for `superpowers:subagent-driven-development`.
> Each task is self-contained (2-5 min), has explicit file lists, and follows TDD where applicable.
> Run `bun run test` and `bun run check` after every task. Commit after each green pass.

---

## Prerequisites

- Branch `feature/slice-17d-component-api` checked out
- Dev server running: `bun run dev`
- All existing tests pass: `bun run test` and `bun run check`

---

## Task 1 — Data Layer: Stack Role Mapping

**Files:**
- CREATE: `src/lib/data/stackRoles.ts`
- CREATE: `src/lib/data/stackRoles.test.ts`
- MODIFY: `src/lib/data/index.ts` (add barrel export)

**Steps:**

- [ ] **1a. Write test file first (RED)**

```typescript
// src/lib/data/stackRoles.test.ts
import { describe, it, expect } from 'vitest';
import { getStackRole, STACK_ROLE_MAP } from './stackRoles.js';

describe('STACK_ROLE_MAP', () => {
  it('is a non-empty record of string → string', () => {
    expect(Object.keys(STACK_ROLE_MAP).length).toBeGreaterThan(0);
    Object.entries(STACK_ROLE_MAP).forEach(([key, value]) => {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
      expect(value.length).toBeLessThanOrEqual(9);
    });
  });

  it('maps known technologies to expected roles', () => {
    expect(STACK_ROLE_MAP['PostgreSQL']).toBe('DB');
    expect(STACK_ROLE_MAP['Python']).toBe('ETL');
    expect(STACK_ROLE_MAP['SvelteKit']).toBe('FE');
    expect(STACK_ROLE_MAP['Vercel']).toBe('DEPLOY');
  });
});

describe('getStackRole', () => {
  it('returns mapped role for a known tech', () => {
    expect(getStackRole('PostgreSQL')).toBe('DB');
    expect(getStackRole('dbt')).toBe('TRANSFORM');
    expect(getStackRole('Power BI')).toBe('VIZ');
  });

  it('falls back to uppercase truncated name for unknown tech', () => {
    expect(getStackRole('Terraform')).toBe('TERRAF');
  });

  it('handles short unknown names without crashing', () => {
    expect(getStackRole('Go')).toBe('GO');
    expect(getStackRole('R')).toBe('R');
  });

  it('truncates fallback to 6 characters max', () => {
    const result = getStackRole('SomeVeryLongTechnology');
    expect(result.length).toBeLessThanOrEqual(6);
  });
});
```

- [ ] **1b. Run test — verify it fails** (`bun run test -- stackRoles`)

- [ ] **1c. Implement the module (GREEN)**

```typescript
// src/lib/data/stackRoles.ts

// Maps technology names (as they appear in project.stack) to short role labels
// for the hero edge metadata display. Roles should be <=9 chars, uppercase.
// WHY: The project detail hero auto-generates edge metadata from the stack array.
// This mapping gives each tech a meaningful category label (DB, ETL, FE) instead
// of repeating the tech name.
export const STACK_ROLE_MAP: Readonly<Record<string, string>> = {
  'PostgreSQL': 'DB',
  'SQL Server': 'DB',
  'MySQL': 'DB',
  'Python': 'ETL',
  'dbt': 'TRANSFORM',
  'Power BI': 'VIZ',
  'Apache Airflow': 'ORCH',
  'Airflow': 'ORCH',
  'Retool': 'UI',
  'SvelteKit': 'FE',
  'Svelte 5': 'FE',
  'TypeScript': 'LANG',
  'Tailwind CSS': 'STYLE',
  'Vercel': 'DEPLOY',
  'Node.js': 'RUNTIME',
  'REST API': 'API',
  'Alembic': 'MIGRATE',
  'SSMS': 'TOOL',
  'T-SQL': 'LANG',
  'DAX': 'LANG',
};

/**
 * Returns the role label for a given technology name.
 * Falls back to the first 6 characters uppercased if the tech is not in the map.
 * WHY: Edge metadata needs a short role prefix for every stack item. Unknown
 * techs get a truncated name rather than throwing — graceful degradation.
 */
export function getStackRole(tech: string): string {
  return STACK_ROLE_MAP[tech] ?? tech.toUpperCase().slice(0, 6);
}
```

- [ ] **1d. Run test — verify it passes** (`bun run test -- stackRoles`)

- [ ] **1e. Add barrel export to `src/lib/data/index.ts`**

Add after the shapes export block:

```typescript
// Stack role mapping (project detail hero metadata)
export { STACK_ROLE_MAP, getStackRole } from './stackRoles.js';
```

- [ ] **1f. Run `bun run test` and `bun run check`** — both must pass

- [ ] **1g. Commit:** `feat(slice-17d): add stack-to-role mapping for hero edge metadata`

---

## Task 2 — Data Layer: Extend Project Type

**Files:**
- MODIFY: `src/lib/data/types.ts`
- MODIFY: `src/lib/data/projects.ts`
- MODIFY: `src/lib/data/data-integrity.test.ts` (if it validates Project shape)

**Steps:**

- [ ] **2a. Add optional fields to the Project interface in `src/lib/data/types.ts`**

After the existing `impactMetric?: ImpactMetric;` line, add:

```typescript
  // --- Hero metadata fields (optional, with sensible defaults) ---
  // Auto-displayed in the manifesto-style hero edge metadata.
  // If omitted, the hero shows fallback values.
  location?: string;          // e.g., "sherbrooke" — defaults to "sherbrooke"
  environment?: string;       // e.g., "production" — defaults to "production"
  version?: string;           // e.g., "2.4.1" — defaults to "1.0.0"
  // Multiple impact metrics for the glanceable panel.
  // Falls back to wrapping the single impactMetric if this is not set.
  impactMetrics?: ImpactMetric[];
```

- [ ] **2b. Add new fields to project data entries in `src/lib/data/projects.ts`**

Add the fields to the `transit-data-pipeline` project (the richest example):

```typescript
// In the transit-data-pipeline entry, after impactMetric:
location: 'sherbrooke',
environment: 'production',
version: '2.4.1',
impactMetrics: [
  { value: '30s', label: 'Real-time refresh cycles' },
  { value: '99.9%', label: 'Pipeline uptime' },
],
```

Add to `lorem-analytics-dashboard`:

```typescript
impactMetrics: [
  { value: '15 min', label: 'Reporting across 12 depts', before: '2 days' },
  { value: '73%', label: 'Query time reduction' },
],
```

Other projects: leave without the new fields (they are all optional).

- [ ] **2c. Run `bun run test` and `bun run check`** — both must pass (existing tests should still work since all new fields are optional)

- [ ] **2d. Commit:** `feat(slice-17d): extend Project type with hero metadata fields`

---

## Task 3 — ProjectDetailHero Component

**Files:**
- CREATE: `src/lib/components/projects/ProjectDetailHero.svelte`

**Steps:**

- [ ] **3a. Create the hero component**

```svelte
<!--
  Manifesto-style hero for /projects/[slug].
  Background: circuit grid + warm glow + CornerMarks + GlowOverlay + cursorGlow.
  Edge metadata auto-generated from Project data (hidden below lg).
  Center: back link, title (SplitText), subtitle, tech pills.
  Bottom: terminal prompt with TerminalCursor.
-->
<script lang="ts">
  import type { Project } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { getStackRole } from '$lib/data/stackRoles.js';
  import { CornerMarks, GlowOverlay } from '$lib/components/brand';
  import { Badge } from '$lib/components/ui/badge';
  import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
  import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
  import { boop } from '$lib/motion/actions/boop.js';
  import { onMount } from 'svelte';
  import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
  import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';

  let { project }: { project: Project } = $props();

  // WHY: derive hero data from project fields with sensible fallbacks.
  // Edge metadata is auto-generated — no hardcoded content.
  const location = $derived(project.location ?? 'sherbrooke');
  const environment = $derived(project.environment ?? 'production');
  const version = $derived(project.version ?? '1.0.0');

  // WHY: the first related service ID makes a meaningful "layer" label
  // for the right-edge metadata.
  const layerId = $derived(
    project.relatedServices[0] ?? project.slug
  );

  // Build stack role pairs for right edge
  const stackRoles = $derived(
    project.stack.map((tech) => ({
      role: getStackRole(tech),
      name: tech.toLowerCase().replace(/\s+/g, '-'),
    }))
  );

  // Impact metrics for left edge — combine single + array sources
  const metrics = $derived(() => {
    if (project.impactMetrics && project.impactMetrics.length > 0) {
      return project.impactMetrics;
    }
    if (project.impactMetric) {
      return [project.impactMetric];
    }
    return [];
  });

  // GSAP hero entrance animation
  let heroEl: HTMLElement;
  let titleEl: HTMLHeadingElement;

  onMount(() => {
    if (isPrefersReducedMotion() || !heroEl) return;
    registerGsapPlugins();

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // 1. Circuit grid + glow fade in
    const grid = heroEl.querySelector('[data-layer="grid"]');
    const glow = heroEl.querySelector('[data-layer="glow"]');
    const edges = heroEl.querySelectorAll('[data-layer="edge"]');
    const decorations = heroEl.querySelectorAll('[data-layer="decoration"]');
    const pills = heroEl.querySelectorAll('[data-animate="pill"]');

    if (grid) tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    if (glow) tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.2);

    // 2. Edges and decorations
    if (edges.length > 0) {
      tl.fromTo(edges, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1 }, 0.3);
    }
    if (decorations.length > 0) {
      tl.fromTo(decorations, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.4);
    }

    // 3. Title char reveal with SplitText
    if (titleEl && SplitText) {
      const split = new SplitText(titleEl, { type: 'chars' });
      tl.fromTo(
        split.chars,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.02 },
        0.5
      );
    }

    // 4. Tech pills stagger in
    if (pills.length > 0) {
      tl.fromTo(
        pills,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 },
        0.8
      );
    }
  });
</script>

<section
  bind:this={heroEl}
  class="project-detail-hero group relative flex min-h-[320px] items-center justify-center overflow-hidden lg:min-h-[440px]"
  style="background: var(--manifesto);"
  data-testid="project-detail-hero"
  use:cursorGlow
>
  <!-- Circuit grid -->
  <div class="circuit-grid absolute inset-0" data-layer="grid" aria-hidden="true"></div>
  <!-- Grid intersection dots -->
  <div class="circuit-dots absolute inset-0" data-layer="grid" aria-hidden="true"></div>
  <!-- Warm radial glow -->
  <div class="warm-glow absolute inset-0" data-layer="glow" aria-hidden="true"></div>

  <!-- GlowOverlay (cursor-following) -->
  <GlowOverlay intensity={0.06} />

  <!-- CornerMarks -->
  <CornerMarks size="md" opacity={0.12} />

  <!-- Chevrons (top-right decoration) -->
  <div
    class="absolute right-[55px] top-[70px] hidden items-center gap-1.5 lg:flex"
    style="opacity: 0.07;"
    data-layer="decoration"
    aria-hidden="true"
  >
    {#each Array(3) as _}
      <div class="h-3.5 w-3.5 rotate-[-45deg] border-b-2 border-r-2 border-primary"></div>
    {/each}
  </div>

  <!-- Crosshair (bottom-right decoration) -->
  <div
    class="absolute bottom-[55px] right-[45px] hidden lg:block"
    style="opacity: 0.06;"
    data-layer="decoration"
    aria-hidden="true"
  >
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--primary)" stroke-width="0.8">
      <circle cx="22" cy="22" r="16" />
      <line x1="22" y1="0" x2="22" y2="44" />
      <line x1="0" y1="22" x2="44" y2="22" />
    </svg>
  </div>

  <!-- Ticks (top center) -->
  <div
    class="absolute left-1/2 top-[18px] hidden -translate-x-1/2 gap-7 font-mono text-[8px] lg:flex"
    style="color: rgba(var(--primary-rgb) / 0.08);"
    data-layer="decoration"
    aria-hidden="true"
  >
    {#each [0, 80, 160, 240, 320, 400, 480] as tick}
      <span>{tick}</span>
    {/each}
  </div>

  <!-- Edge Left: project identity + impact metrics (desktop only) -->
  <div class="edge-left hidden lg:block" data-layer="edge" aria-hidden="true">
    <div>PRJ <span class="edge-value">{project.slug}</span></div>
    <div>SRC {location}</div>
    <div>ENV {environment}</div>
    <div>VER {version}</div>
    <div>STATUS <span class="edge-value">{project.status}</span></div>
    <div class="edge-separator">───────</div>
    {#each metrics() as metric}
      <div>{metric.value} {metric.label}</div>
    {/each}
  </div>

  <!-- Edge Right: tech stack breakdown (desktop only) -->
  <div class="edge-right hidden lg:block" data-layer="edge" aria-hidden="true">
    <div>LAYER {layerId}</div>
    {#each stackRoles as item}
      <div>{item.role} <span class="edge-value">{item.name}</span></div>
    {/each}
    <div class="edge-separator">───────</div>
    <div>NODES {project.stack.length}</div>
  </div>

  <!-- Terminal prompt (bottom center) -->
  <div class="terminal-prompt" aria-hidden="true">
    yesid@{project.slug}:~$ cat overview.md<TerminalCursor />
  </div>

  <!-- Center content -->
  <div class="relative z-10 mx-auto max-w-[900px] px-5 py-10 text-center lg:px-8 lg:pb-[60px] lg:pt-10">
    <!-- Back link -->
    <a
      href="/projects"
      class="mb-5 inline-block font-mono text-xs tracking-[0.5px] text-primary opacity-70 transition-opacity hover:opacity-100 lg:mb-7"
      use:boop={{ scale: 1.05, timing: 200 }}
    >
      &larr; All Projects
    </a>

    <!-- Title -->
    <h1
      bind:this={titleEl}
      class="hero-title mb-3 font-heading font-black uppercase leading-[0.95] tracking-[-0.03em] text-primary lg:mb-4"
    >
      {resolveLocale(project.title, 'en')}
    </h1>

    <!-- Subtitle (oneLiner) -->
    <p class="mx-auto mb-5 max-w-[560px] font-heading text-[15px] leading-relaxed text-text-secondary lg:mb-7 lg:text-[18px]">
      {resolveLocale(project.oneLiner, 'en')}
    </p>

    <!-- Tech pills -->
    <div class="flex flex-wrap justify-center gap-1.5 lg:gap-2">
      {#each project.stack as tech}
        <span class="hero-pill" data-animate="pill">
          {tech}
        </span>
      {/each}
    </div>
  </div>
</section>

<style>
  /* Circuit grid — 80px tile (60px on mobile for density) */
  .circuit-grid {
    background-image:
      repeating-linear-gradient(90deg, rgb(var(--primary-rgb) / 0.035) 0px, rgb(var(--primary-rgb) / 0.035) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(0deg, rgb(var(--primary-rgb) / 0.035) 0px, rgb(var(--primary-rgb) / 0.035) 1px, transparent 1px, transparent 80px);
  }

  @media (max-width: 1023px) {
    .circuit-grid {
      background-image:
        repeating-linear-gradient(90deg, rgb(var(--primary-rgb) / 0.035) 0px, rgb(var(--primary-rgb) / 0.035) 1px, transparent 1px, transparent 60px),
        repeating-linear-gradient(0deg, rgb(var(--primary-rgb) / 0.035) 0px, rgb(var(--primary-rgb) / 0.035) 1px, transparent 1px, transparent 60px);
    }
  }

  /* Grid intersection dots */
  .circuit-dots {
    background-image:
      radial-gradient(circle 2.5px at 80px 80px, rgb(var(--primary-rgb) / 0.12) 0%, transparent 4px),
      radial-gradient(circle 2px at 160px 160px, rgb(var(--primary-rgb) / 0.08) 0%, transparent 3px);
    background-size: 320px 320px;
  }

  /* Warm center glow */
  .warm-glow {
    background: radial-gradient(
      ellipse 60% 50% at 50% 50%,
      rgb(var(--primary-rgb) / 0.04) 0%,
      transparent 70%
    );
  }

  /* Edge metadata shared styles */
  .edge-left,
  .edge-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    color: rgb(var(--primary-rgb) / 0.15);
    line-height: 2.4;
    text-transform: uppercase;
  }

  .edge-left {
    left: 28px;
  }

  .edge-right {
    right: 28px;
    text-align: right;
  }

  .edge-value {
    color: rgb(var(--primary-rgb) / 0.25);
  }

  .edge-separator {
    margin-top: 8px;
    opacity: 0.5;
  }

  /* Terminal prompt at bottom center */
  .terminal-prompt {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 1px;
    color: rgb(var(--primary-rgb) / 0.1);
    white-space: nowrap;
  }

  @media (min-width: 1024px) {
    .terminal-prompt {
      bottom: 20px;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: rgb(var(--primary-rgb) / 0.12);
    }
  }

  /* Title responsive sizing: clamp(2rem, 5vw, 4rem) on desktop, 32px on mobile */
  .hero-title {
    font-size: 32px;
    text-shadow: 0 0 60px rgb(var(--primary-rgb) / 0.12);
  }

  @media (min-width: 1024px) {
    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      text-shadow: 0 0 80px rgb(var(--primary-rgb) / 0.12);
    }
  }

  /* Tech pills — manifesto style with pill radius */
  .hero-pill {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: rgb(var(--primary-rgb) / 0.5);
    border: 1px solid rgb(var(--primary-rgb) / 0.12);
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    background: rgb(var(--primary-rgb) / 0.03);
  }

  @media (min-width: 1024px) {
    .hero-pill {
      font-size: 13px;
      color: rgb(var(--primary-rgb) / 0.6);
      border-color: rgb(var(--primary-rgb) / 0.15);
      padding: 7px 18px;
      background: rgb(var(--primary-rgb) / 0.04);
    }
  }
</style>
```

- [ ] **3b. Verify import paths work** — `bun run check` must pass

- [ ] **3c. Commit:** `feat(slice-17d): create ProjectDetailHero with manifesto visuals`

---

## Task 4 — ProjectGlancePanel (Desktop Sidebar)

**Files:**
- CREATE: `src/lib/components/projects/ProjectGlancePanel.svelte`

**Steps:**

- [ ] **4a. Create the glance panel component**

```svelte
<!--
  Right sidebar for the project detail page.
  Shows: overview, impact metrics, stack tags, services, external links.
  Each section is conditionally rendered — hidden when data is empty.
  Desktop only (hidden below lg). Mobile gets ProjectGlancePanelMobile.
-->
<script lang="ts">
  import type { Project, Service, ImpactMetric } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { SectionLabel, MetricDisplay, StickyPanel } from '$lib/components/brand';
  import { Badge } from '$lib/components/ui/badge';
  import ServiceBadge from './ServiceBadge.svelte';

  let {
    project,
    services,
    serviceSvgContents,
  }: {
    project: Project;
    services: Service[];
    serviceSvgContents: Record<string, string>;
  } = $props();

  // WHY: unify single and array metrics into one list for rendering.
  // impactMetrics takes priority; falls back to wrapping impactMetric.
  const allMetrics = $derived((): ImpactMetric[] => {
    if (project.impactMetrics && project.impactMetrics.length > 0) {
      return project.impactMetrics;
    }
    if (project.impactMetric) {
      return [project.impactMetric];
    }
    return [];
  });

  const hasMetrics = $derived(allMetrics().length > 0);
  const hasServices = $derived(services.length > 0);
  const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);

  // Alternating colors for metrics: primary, accent, primary, accent...
  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

<StickyPanel top="5rem">
  <div
    class="glance-panel"
    style="max-height: calc(100dvh - 8rem); overflow-y: auto; padding-left: 24px;"
    data-testid="project-glance-panel"
  >
    <!-- Overview -->
    <div class="mb-6">
      <SectionLabel text="Overview" variant="section" class="mb-2.5" />
      <p class="text-[15px] leading-[1.7]" style="color: rgb(var(--foreground-rgb) / 0.5);">
        {resolveLocale(project.description, 'en')}
      </p>
    </div>

    <!-- Impact metrics -->
    {#if hasMetrics}
      <div class="panel-divider"></div>
      <div class="mb-6">
        <SectionLabel text="Impact" variant="section" class="mb-3" />
        <div class="grid grid-cols-2 gap-4">
          {#each allMetrics() as metric, i}
            <MetricDisplay
              value={metric.value}
              label={metric.label}
              size="md"
              labelBelow
              style="--metric-color: {metricColors[i % 2]};"
              class="[&_[class*='text-primary']]:text-[var(--metric-color)]"
            />
          {/each}
        </div>
      </div>
    {/if}

    <!-- Stack -->
    {#if project.stack.length > 0}
      <div class="panel-divider"></div>
      <div class="mb-6">
        <SectionLabel text="Stack" variant="section" class="mb-2.5" />
        <div class="flex flex-wrap gap-1.5">
          {#each project.stack as tech}
            <Badge variant="tag" size="xs">{tech}</Badge>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Services -->
    {#if hasServices}
      <div class="panel-divider"></div>
      <div class="mb-6">
        <SectionLabel text="Services" variant="section" class="mb-2.5" />
        <div class="flex flex-col gap-2">
          {#each services as service}
            <a
              href="/services/{service.id}"
              class="glance-service-link flex items-center gap-2 text-[13px] no-underline"
              style="color: rgb(var(--primary-rgb) / 0.65);"
            >
              <div
                class="flex h-6 w-6 items-center justify-center rounded border font-mono text-[10px]"
                style="border-color: rgb(var(--primary-rgb) / 0.15); color: rgb(var(--primary-rgb) / 0.3);"
              >
                {String(service.station).padStart(2, '0')}
              </div>
              {resolveLocale(service.title, 'en')}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Links -->
    {#if hasLinks}
      <div class="panel-divider"></div>
      <div>
        <SectionLabel text="Links" variant="section" class="mb-2.5" />
        <div class="flex flex-col gap-2">
          {#if project.liveUrl}
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 font-mono text-[13px] no-underline"
              style="color: var(--primary);"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 3h7v7M13 3L3 13" />
              </svg>
              Live Site
            </a>
          {/if}
          {#if project.repoUrl}
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 font-mono text-[13px] no-underline"
              style="color: var(--primary);"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</StickyPanel>

<style>
  .panel-divider {
    height: 1px;
    background: linear-gradient(to right, rgb(var(--primary-rgb) / 0.12), transparent);
    margin-bottom: 24px;
  }

  .glance-service-link {
    transition: color var(--duration-fast) var(--ease-default);
  }

  .glance-service-link:hover {
    color: var(--primary);
  }
</style>
```

- [ ] **4b. Run `bun run check`** — must pass

- [ ] **4c. Commit:** `feat(slice-17d): create ProjectGlancePanel desktop sidebar`

---

## Task 5 — ProjectGlancePanelMobile (Collapsible)

**Files:**
- CREATE: `src/lib/components/projects/ProjectGlancePanelMobile.svelte`

**Steps:**

- [ ] **5a. Create the mobile collapsible panel**

```svelte
<!--
  Collapsible "Project Info" panel for mobile (<lg).
  Shows between gradient separator and content sections.
  Collapsed: label + inline metric preview + chevron toggle.
  Expanded: overview, metrics row, stack tags, links.
-->
<script lang="ts">
  import type { Project, ImpactMetric } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { ChevronToggle, MetricDisplay, SectionLabel } from '$lib/components/brand';
  import { Badge } from '$lib/components/ui/badge';
  import { Collapsible } from 'bits-ui';

  let { project }: { project: Project } = $props();

  let open = $state(false);

  // WHY: same metric unification as desktop panel
  const allMetrics = $derived((): ImpactMetric[] => {
    if (project.impactMetrics && project.impactMetrics.length > 0) {
      return project.impactMetrics;
    }
    if (project.impactMetric) {
      return [project.impactMetric];
    }
    return [];
  });

  const hasMetrics = $derived(allMetrics().length > 0);
  const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);
  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

<Collapsible.Root bind:open class="mobile-glance-panel" data-testid="project-glance-panel-mobile">
  <Collapsible.Trigger
    class="flex w-full items-center justify-between border-b px-5 py-3.5"
    style="background: rgb(var(--primary-rgb) / 0.015); border-color: var(--border-subtle);"
  >
    <div class="flex items-center gap-3">
      <span class="font-mono text-[10px] uppercase tracking-[2px]" style="color: rgb(var(--primary-rgb) / 0.4);">
        Project Info
      </span>
      <!-- Inline metric preview (collapsed state) -->
      {#if hasMetrics && !open}
        <div class="flex gap-3">
          {#each allMetrics().slice(0, 2) as metric, i}
            <span
              class="font-heading text-[16px] font-extrabold"
              style="color: {metricColors[i % 2]};"
            >
              {metric.value}
            </span>
          {/each}
        </div>
      {/if}
    </div>
    <ChevronToggle {open} size="sm" direction="down" />
  </Collapsible.Trigger>

  <Collapsible.Content class="mobile-glance-content">
    <div class="space-y-4 px-5 pb-5">
      <!-- Overview -->
      <p class="text-sm leading-relaxed" style="color: rgb(var(--foreground-rgb) / 0.45);">
        {resolveLocale(project.description, 'en')}
      </p>

      <!-- Metrics row -->
      {#if hasMetrics}
        <div class="flex gap-4">
          {#each allMetrics() as metric, i}
            <div class="flex items-start gap-4">
              {#if i > 0}
                <div class="h-10 w-px" style="background: rgb(var(--primary-rgb) / 0.1);"></div>
              {/if}
              <div>
                <div
                  class="font-heading text-2xl font-extrabold"
                  style="color: {metricColors[i % 2]};"
                >
                  {metric.value}
                </div>
                <div class="font-mono text-[9px]" style="color: rgb(var(--foreground-rgb) / 0.25);">
                  {metric.label}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Stack tags -->
      {#if project.stack.length > 0}
        <div class="flex flex-wrap gap-1">
          {#each project.stack as tech}
            <Badge variant="tag" size="xs">{tech}</Badge>
          {/each}
        </div>
      {/if}

      <!-- Links -->
      {#if hasLinks}
        <div class="flex gap-4">
          {#if project.liveUrl}
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs no-underline"
              style="color: var(--primary);"
            >
              &#8599; Live Site
            </a>
          {/if}
          {#if project.repoUrl}
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs no-underline"
              style="color: var(--primary);"
            >
              GitHub
            </a>
          {/if}
        </div>
      {/if}
    </div>
  </Collapsible.Content>
</Collapsible.Root>

<style>
  /* Smooth expand/collapse animation (same pattern as CollapsibleSection) */
  .mobile-glance-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--duration-normal) var(--ease-default);
    overflow: hidden;
  }

  .mobile-glance-content[data-state="open"] {
    grid-template-rows: 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    .mobile-glance-content {
      transition: none;
    }
  }
</style>
```

- [ ] **5b. Run `bun run check`** — must pass

- [ ] **5c. Commit:** `feat(slice-17d): create ProjectGlancePanelMobile collapsible panel`

---

## Task 6 — ProjectTocPill (Floating Mobile TOC)

**Files:**
- CREATE: `src/lib/components/projects/ProjectTocPill.svelte`

**Steps:**

- [ ] **6a. Create the floating TOC pill component**

```svelte
<!--
  Floating pill at the bottom center of the viewport on mobile (<lg).
  Shows current section name + counter. Tapping opens a bottom drawer with full TOC.
  Visibility: appears when content sections are in view (past hero).
  Z-index: var(--z-sheet) — above content, below nav.
-->
<script lang="ts">
  import type { ProjectSection } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { ChevronToggle } from '$lib/components/brand';
  import { onMount, onDestroy } from 'svelte';

  let {
    sections,
    readmeExists = false,
  }: {
    sections: ProjectSection[];
    readmeExists?: boolean;
  } = $props();

  // WHY: total includes README if it exists
  const totalSections = $derived(sections.length + (readmeExists ? 1 : 0));

  let visible = $state(false);
  let drawerOpen = $state(false);
  let currentIndex = $state(0);

  // WHY: section name comes from the data, not from DOM scraping
  const currentSectionName = $derived(() => {
    if (currentIndex < sections.length) {
      return resolveLocale(sections[currentIndex].title, 'en');
    }
    if (readmeExists && currentIndex === sections.length) {
      return 'README';
    }
    return sections.length > 0 ? resolveLocale(sections[0].title, 'en') : '';
  });

  let observer: IntersectionObserver | undefined;

  onMount(() => {
    // WHY: observe all section headings to track the active one
    // and toggle pill visibility based on hero position
    const heroEl = document.querySelector('[data-testid="project-detail-hero"]');
    const sectionEls = document.querySelectorAll('[data-section-index]');

    // Show pill when hero is out of view
    if (heroEl) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          visible = !entry.isIntersecting;
        },
        { threshold: 0 }
      );
      heroObserver.observe(heroEl);
    }

    // Track active section
    if (sectionEls.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute('data-section-index'));
              if (!isNaN(idx)) currentIndex = idx;
            }
          }
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      sectionEls.forEach((el) => observer?.observe(el));
    }
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  function scrollToSection(index: number): void {
    const el = document.querySelector(`[data-section-index="${index}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawerOpen = false;
    }
  }
</script>

{#if visible}
  <!-- Pill button -->
  <div class="toc-pill-container lg:hidden" data-testid="project-toc-pill">
    <button
      class="toc-pill"
      onclick={() => (drawerOpen = !drawerOpen)}
      aria-label="Table of contents"
    >
      <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
      <span class="font-mono text-[11px]" style="color: rgb(var(--foreground-rgb) / 0.5);">
        {currentSectionName()}
      </span>
      <span class="font-mono text-[9px]" style="color: rgb(var(--primary-rgb) / 0.3);">
        {currentIndex + 1}/{totalSections}
      </span>
      <ChevronToggle open={drawerOpen} size="sm" direction="down" />
    </button>

    <!-- Drawer -->
    {#if drawerOpen}
      <!-- Backdrop -->
      <button
        class="toc-drawer-backdrop"
        onclick={() => (drawerOpen = false)}
        aria-label="Close table of contents"
      ></button>

      <div class="toc-drawer">
        <nav class="flex flex-col gap-1 p-4">
          {#each sections as section, i}
            <button
              class="toc-drawer-item"
              class:active={currentIndex === i}
              onclick={() => scrollToSection(i)}
            >
              <span class="font-mono text-[10px]" style="color: rgb(var(--primary-rgb) / 0.3);">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{resolveLocale(section.title, 'en')}</span>
            </button>
          {/each}
          {#if readmeExists}
            <button
              class="toc-drawer-item"
              class:active={currentIndex === sections.length}
              onclick={() => scrollToSection(sections.length)}
            >
              <svg class="h-3.5 w-3.5" style="color: var(--primary);" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>README</span>
            </button>
          {/if}
        </nav>
      </div>
    {/if}
  </div>
{/if}

<style>
  .toc-pill-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-sheet);
  }

  .toc-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: rgb(20 20 20 / 0.95);
    border: 1px solid rgb(var(--primary-rgb) / 0.2);
    border-radius: var(--radius-pill);
    backdrop-filter: blur(8px);
    cursor: pointer;
    white-space: nowrap;
  }

  .toc-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: -1;
    border: none;
    cursor: default;
  }

  .toc-drawer {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 260px;
    background: rgb(20 20 20 / 0.97);
    border: 1px solid rgb(var(--primary-rgb) / 0.15);
    border-radius: 12px;
    backdrop-filter: blur(12px);
    box-shadow: 0 -8px 32px rgb(0 0 0 / 0.4);
  }

  .toc-drawer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: var(--font-heading);
    font-size: 14px;
    color: rgb(var(--foreground-rgb) / 0.4);
    transition: background var(--duration-fast) var(--ease-default),
                color var(--duration-fast) var(--ease-default);
    text-align: left;
    width: 100%;
  }

  .toc-drawer-item:hover {
    background: rgb(var(--primary-rgb) / 0.05);
    color: rgb(var(--foreground-rgb) / 0.7);
  }

  .toc-drawer-item.active {
    color: var(--primary);
    font-weight: 600;
  }
</style>
```

- [ ] **6b. Run `bun run check`** — must pass

- [ ] **6c. Commit:** `feat(slice-17d): create ProjectTocPill floating mobile TOC`

---

## Task 7 — Rewrite ProjectDetailPage (Three-Column Layout)

**Files:**
- MODIFY: `src/lib/components/projects/ProjectDetailPage.svelte` (complete rewrite)

**Steps:**

- [ ] **7a. Rewrite the page component with the new three-column layout**

```svelte
<!--
  Full detail page layout for /projects/[slug].
  Structure: accent line (left edge) + hero + gradient separator + three-column body.
  Desktop: sticky TOC (left 200px) + dynamic sections (center) + glance panel (right 260px).
  Mobile: collapsible glance panel + floating TOC pill + stacked sections.
-->
<script lang="ts">
  import type { Project, Service } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { reveal } from '$lib/motion/actions/reveal.js';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import { SectionLabel, StickyPanel } from '$lib/components/brand';
  import TableOfContents from '$lib/components/shared/TableOfContents.svelte';
  import ProjectDetailHero from './ProjectDetailHero.svelte';
  import ProjectGlancePanel from './ProjectGlancePanel.svelte';
  import ProjectGlancePanelMobile from './ProjectGlancePanelMobile.svelte';
  import ProjectTocPill from './ProjectTocPill.svelte';
  import { onMount } from 'svelte';

  let {
    project,
    services,
    serviceSvgContents,
    readmeHtml,
  }: {
    project: Project;
    services: Service[];
    serviceSvgContents: Record<string, string>;
    readmeHtml?: string;
  } = $props();

  // WHY: track active section index for the desktop TOC active dot
  let activeSectionIndex = $state(0);
  let sectionObserver: IntersectionObserver | undefined;

  const totalSections = $derived(
    project.sections.length + (readmeHtml ? 1 : 0)
  );

  onMount(() => {
    const sectionEls = document.querySelectorAll('[data-section-index]');
    if (sectionEls.length === 0) return;

    sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-section-index'));
            if (!isNaN(idx)) activeSectionIndex = idx;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sectionEls.forEach((el) => sectionObserver?.observe(el));

    return () => sectionObserver?.disconnect();
  });

  function scrollToSection(index: number): void {
    const el = document.querySelector(`[data-section-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<article class="page-wrapper" data-testid="project-detail-page">
  <!-- Accent line runs the full height on the left edge -->
  <div class="accent-line" aria-hidden="true"></div>

  <div class="page-content">
    <!-- Manifesto Hero -->
    <ProjectDetailHero {project} />

    <!-- Gradient separator between hero and body -->
    <Separator variant="gradient" />

    <!-- Mobile: collapsible glance panel (between separator and content) -->
    <div class="lg:hidden">
      <ProjectGlancePanelMobile {project} />
    </div>

    <!-- Three-column body -->
    <div class="body-grid">
      <!-- LEFT: Sticky Table of Contents (desktop only) -->
      <aside class="toc-column hidden lg:block">
        <StickyPanel top="5rem">
          <div class="pr-6">
            <SectionLabel text="On this page" variant="section" class="mb-5" />

            <nav class="toc-nav">
              {#each project.sections as section, i}
                <button
                  class="toc-item"
                  class:active={activeSectionIndex === i}
                  onclick={() => scrollToSection(i)}
                >
                  {#if activeSectionIndex === i}
                    <div class="toc-dot"></div>
                  {/if}
                  {resolveLocale(section.title, 'en')}
                </button>
              {/each}
              {#if readmeHtml}
                <button
                  class="toc-item"
                  class:active={activeSectionIndex === project.sections.length}
                  onclick={() => scrollToSection(project.sections.length)}
                >
                  {#if activeSectionIndex === project.sections.length}
                    <div class="toc-dot"></div>
                  {/if}
                  README
                </button>
              {/if}
            </nav>

            <!-- Section counter -->
            <div class="mt-6 flex items-center gap-2">
              <div class="toc-counter-dot"></div>
              <span class="font-mono text-[9px] tracking-[1.5px]" style="color: rgb(var(--primary-rgb) / 0.3);">
                SEC {activeSectionIndex + 1} / {totalSections}
              </span>
            </div>
          </div>
        </StickyPanel>
      </aside>

      <!-- CENTER: Dynamic sections -->
      <div class="center-column">
        {#each project.sections as section, i}
          <div
            class="section-block"
            data-section-index={i}
            use:reveal={{ direction: 'up', delay: 100 + i * 60 }}
          >
            <h2 class="section-heading">
              <Badge variant="number">{String(i + 1).padStart(2, '0')}</Badge>
              {resolveLocale(section.title, 'en')}
            </h2>
            <div class="section-body">
              {@html resolveLocale(section.content, 'en')}
            </div>
          </div>
        {/each}

        <!-- README section -->
        {#if readmeHtml}
          <div
            class="section-block"
            data-section-index={project.sections.length}
            use:reveal={{ direction: 'up', delay: 200 }}
          >
            <h2 class="section-heading">
              <svg class="h-[18px] w-[18px]" style="color: var(--primary);" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              README
            </h2>
            <div class="prose-dark section-body">
              {@html readmeHtml}
            </div>
          </div>
        {/if}
      </div>

      <!-- RIGHT: Glanceable data panel (desktop only) -->
      <div class="glance-column hidden lg:block">
        <ProjectGlancePanel {project} {services} {serviceSvgContents} />
      </div>
    </div>
  </div>
</article>

<!-- Mobile floating TOC pill -->
<ProjectTocPill sections={project.sections} readmeExists={!!readmeHtml} />

<style>
  /* Page-level grid: accent line + content */
  .page-wrapper {
    display: grid;
    grid-template-columns: 3px 1fr;
    min-height: 100dvh;
  }

  @media (min-width: 1024px) {
    .page-wrapper {
      grid-template-columns: 4px 1fr;
    }
  }

  /* Accent line — primary gradient fading to transparent */
  .accent-line {
    background: linear-gradient(
      to bottom,
      var(--primary) 0%,
      var(--primary) 15%,
      rgb(var(--primary-rgb) / 0.3) 30%,
      transparent 60%
    );
  }

  @media (min-width: 1024px) {
    .accent-line {
      background: linear-gradient(
        to bottom,
        var(--primary) 0%,
        var(--primary) 20%,
        rgb(var(--primary-rgb) / 0.3) 40%,
        transparent 80%
      );
    }
  }

  .page-content {
    background: var(--background);
  }

  /* Three-column body grid */
  .body-grid {
    display: block;
    padding: 20px;
    max-width: 1280px;
    margin: 0 auto;
  }

  @media (min-width: 1024px) {
    .body-grid {
      display: grid;
      grid-template-columns: 200px 1fr 260px;
      gap: 0;
      padding: 40px 32px;
    }
  }

  /* TOC column */
  .toc-nav {
    font-family: var(--font-heading);
    font-size: 14px;
    line-height: 2.6;
    border-left: 2px solid rgb(var(--primary-rgb) / 0.12);
    padding-left: 16px;
  }

  .toc-item {
    display: block;
    position: relative;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--text-muted);
    transition: color var(--duration-fast) var(--ease-default);
  }

  .toc-item:hover {
    color: rgb(var(--foreground-rgb) / 0.6);
  }

  .toc-item.active {
    color: var(--primary);
    font-weight: 600;
  }

  /* Active dot on the TOC border line */
  .toc-dot {
    position: absolute;
    left: -19px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary);
  }

  /* Pulsing counter dot */
  .toc-counter-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary);
    box-shadow: 0 0 8px rgb(var(--primary-rgb) / 0.4);
  }

  /* Center column borders and padding */
  .center-column {
    padding: 0;
  }

  @media (min-width: 1024px) {
    .center-column {
      padding: 0 32px;
      border-left: 1px solid rgb(var(--foreground-rgb) / 0.04);
      border-right: 1px solid rgb(var(--foreground-rgb) / 0.04);
    }
  }

  /* Section blocks */
  .section-block {
    margin-bottom: 36px;
  }

  @media (min-width: 1024px) {
    .section-block {
      margin-bottom: 48px;
    }
  }

  /* Section heading: numbered badge + title */
  .section-heading {
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: 700;
    color: var(--foreground);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.01em;
  }

  @media (min-width: 1024px) {
    .section-heading {
      font-size: 24px;
      margin-bottom: 20px;
      gap: 12px;
    }
  }

  /* Section body text */
  .section-body {
    font-size: 16px;
    color: rgb(var(--foreground-rgb) / 0.5);
    line-height: 1.8;
    max-width: 680px;
  }

  @media (min-width: 1024px) {
    .section-body {
      font-size: 17px;
      color: rgb(var(--foreground-rgb) / 0.55);
      line-height: 1.9;
    }
  }

  /* Sub-section h3 styling (within rendered HTML content) */
  .section-body :global(h3) {
    font-family: var(--font-heading);
    font-size: 16px;
    font-weight: 600;
    color: rgb(var(--foreground-rgb) / 0.7);
    margin: 20px 0 12px;
    padding-left: 10px;
    border-left: 2px solid rgb(var(--primary-rgb) / 0.2);
  }

  @media (min-width: 1024px) {
    .section-body :global(h3) {
      font-size: 18px;
      color: rgb(var(--foreground-rgb) / 0.8);
      margin: 24px 0 16px;
      padding-left: 12px;
      border-left: 3px solid rgb(var(--primary-rgb) / 0.25);
    }
  }
</style>
```

- [ ] **7b. Run `bun run check`** — must pass

- [ ] **7c. Navigate to a project detail page and verify the layout renders**

  - Desktop (1440px): three-column layout, hero with edge metadata, TOC on left, glance panel on right
  - Mobile (375px): single column, collapsible panel, floating TOC pill

- [ ] **7d. Commit:** `feat(slice-17d): rewrite ProjectDetailPage with three-column layout`

---

## Task 8 — Route Adjustments

**Files:**
- MODIFY: `src/routes/projects/[slug]/+page.svelte` (minor: may need no change)
- MODIFY: `src/routes/projects/[slug]/+page.ts` (minor: may need no change)

**Steps:**

- [ ] **8a. Verify `+page.svelte` still passes all needed props**

The current `+page.svelte` passes `project`, `services`, `serviceSvgContents`, and `readmeHtml`. The rewritten `ProjectDetailPage` expects the same props. No change should be needed.

- [ ] **8b. Verify `+page.ts` still returns all needed data**

The loader already returns `project`, `services`, `serviceSvgContents`, and `readmeHtml`. No change needed for the new type fields since they are optional and come from the project data directly.

- [ ] **8c. Run `bun run test` and `bun run check`** — both must pass

- [ ] **8d. Commit (only if changes were needed):** `fix(slice-17d): adjust project detail route for new layout`

---

## Task 9 — Desktop TOC Scroll Tracking Polish

**Files:**
- MODIFY: `src/lib/components/projects/ProjectDetailPage.svelte`

**Steps:**

- [ ] **9a. Add sub-section (h3) detection for TOC nesting**

After the page renders, scan each section's content for `<h3>` elements and add them as nested items in the TOC. This needs a client-side approach since section content is rendered as HTML.

In the `onMount` of `ProjectDetailPage.svelte`, after the IntersectionObserver setup:

```typescript
// WHY: sub-sections (h3 inside rendered content) should appear nested in the TOC.
// We detect them at render time by scanning the DOM, not from the data model.
const subsections: Array<{ sectionIndex: number; text: string; id: string }> = [];
const sectionEls = document.querySelectorAll('[data-section-index]');
sectionEls.forEach((el, sectionIdx) => {
  const h3s = el.querySelectorAll('h3');
  h3s.forEach((h3, subIdx) => {
    const id = `subsection-${sectionIdx}-${subIdx}`;
    h3.id = id;
    subsections.push({
      sectionIndex: sectionIdx,
      text: h3.textContent ?? '',
      id,
    });
  });
});
```

- [ ] **9b. Add sub-section items to the TOC nav markup**

Under each `toc-item` button, render nested sub-items if they exist:

```svelte
{#each subsections.filter(s => s.sectionIndex === i) as sub}
  <button
    class="toc-sub-item"
    onclick={() => document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
  >
    {sub.text}
  </button>
{/each}
```

Add CSS:

```css
.toc-sub-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0 0 16px;
  font-size: 13px;
  color: rgb(var(--foreground-rgb) / 0.2);
  transition: color var(--duration-fast) var(--ease-default);
}

.toc-sub-item:hover {
  color: rgb(var(--foreground-rgb) / 0.4);
}
```

- [ ] **9c. Run `bun run check`** — must pass

- [ ] **9d. Visually verify:** TOC shows nested h3 items, active section tracking works when scrolling

- [ ] **9e. Commit:** `feat(slice-17d): add sub-section nesting to desktop TOC`

---

## Task 10 — Hero GSAP Animation Refinement

**Files:**
- MODIFY: `src/lib/components/projects/ProjectDetailHero.svelte`

**Steps:**

- [ ] **10a. Verify GSAP animation plays on page load**

Navigate to a project detail page and confirm:
- Circuit grid fades in first
- Warm glow follows
- Edge metadata appears
- Title characters reveal one by one (SplitText)
- Tech pills stagger in last

- [ ] **10b. Add cleanup on destroy to prevent GSAP memory leaks**

```typescript
import { onDestroy } from 'svelte';

let tl: gsap.core.Timeline | undefined;

onMount(() => {
  // ... existing setup ...
  tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  // ... rest of animation ...
});

onDestroy(() => {
  tl?.kill();
});
```

- [ ] **10c. Run `bun run test` and `bun run check`** — both must pass

- [ ] **10d. Commit:** `fix(slice-17d): add GSAP timeline cleanup to ProjectDetailHero`

---

## Task 11 — Visual Verification and Polish

**Files:**
- MODIFY: Various files as needed for visual fixes

**Steps:**

- [ ] **11a. Desktop verification at 1440px**
  - Hero: circuit grid, glow, corner marks, edge metadata, pills, terminal cursor
  - Three-column layout: TOC tracks scroll, glance panel shows all sections
  - Section headings have numbered badges
  - Section body text at 17px with 1.9 line-height
  - Accent line on left edge with gradient fade

- [ ] **11b. Mobile verification at 375px**
  - Hero: shorter (320px), no edge metadata, smaller pills
  - Collapsible panel between separator and content
  - Floating TOC pill appears when scrolling past hero
  - Sections stack vertically with 36px margin between
  - Section headings at 20px

- [ ] **11c. Fix any visual discrepancies** between mockup and implementation

- [ ] **11d. Run `bun run test` and `bun run check`** — both must pass

- [ ] **11e. Commit:** `fix(slice-17d): visual polish for project detail page`

---

## Task 12 — Data Layer Tests for New Fields

**Files:**
- MODIFY: `src/lib/data/projects.test.ts`

**Steps:**

- [ ] **12a. Add tests for the new optional fields**

```typescript
describe('project optional metadata fields', () => {
  it('transit-data-pipeline has location, environment, version', () => {
    const project = getProjectBySlug('transit-data-pipeline');
    expect(project?.location).toBe('sherbrooke');
    expect(project?.environment).toBe('production');
    expect(project?.version).toBe('2.4.1');
  });

  it('transit-data-pipeline has impactMetrics array', () => {
    const project = getProjectBySlug('transit-data-pipeline');
    expect(project?.impactMetrics).toBeDefined();
    expect(project!.impactMetrics!.length).toBeGreaterThanOrEqual(2);
    expect(project!.impactMetrics![0].value).toBe('30s');
    expect(project!.impactMetrics![1].value).toBe('99.9%');
  });

  it('projects without new fields still work (optional)', () => {
    const project = getProjectBySlug('yesid-dev');
    expect(project?.location).toBeUndefined();
    expect(project?.environment).toBeUndefined();
    expect(project?.version).toBeUndefined();
    expect(project?.impactMetrics).toBeUndefined();
  });
});
```

- [ ] **12b. Run `bun run test`** — all tests pass

- [ ] **12c. Commit:** `test(slice-17d): add tests for project metadata extensions`

---

## Summary

| Task | Description | Est. Time | Files |
|------|-------------|-----------|-------|
| 1 | Stack role mapping (data + test) | 3 min | 3 create, 1 modify |
| 2 | Extend Project type + data | 3 min | 2 modify |
| 3 | ProjectDetailHero component | 5 min | 1 create |
| 4 | ProjectGlancePanel (desktop) | 4 min | 1 create |
| 5 | ProjectGlancePanelMobile | 4 min | 1 create |
| 6 | ProjectTocPill (mobile) | 4 min | 1 create |
| 7 | Rewrite ProjectDetailPage | 5 min | 1 modify |
| 8 | Route adjustments | 2 min | 0-2 modify |
| 9 | TOC sub-section nesting | 3 min | 1 modify |
| 10 | GSAP animation refinement | 3 min | 1 modify |
| 11 | Visual verification + polish | 5 min | varies |
| 12 | Data layer tests | 3 min | 1 modify |

**Total estimated time:** ~44 minutes (8-12 tasks, 2-5 min each)

**Dependency chain:**
- Tasks 1-2 (data layer) must complete first
- Tasks 3-6 (components) can run in parallel after data layer
- Task 7 (page rewrite) depends on 3-6
- Tasks 8-12 depend on 7

**Commit convention:** `<type>(slice-17d): <description>`
