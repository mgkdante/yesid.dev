# Slice 13d — Hero Text Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero text section ("DIGITAL INFRA. BUILT RIGHT." + SQL decoration) with a two-column proof layout: headline + live metric cards + CTAs on the left, a syntax-highlighted SQL panel on the right, and a full-width refresh button below.

**Architecture:** New `HeroMetrics` and `HeroSqlPanel` child components render inside `HeroBanner.svelte`'s existing `heroTextContainer`. Content comes from updated `heroContent` in `content.ts`. Mock data generation lives in a new `hero-data.ts` module. The GSAP stagger reveal expands from 4 to 7 groups. A site-wide circuit grid CSS background is added to `app.css`.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), TypeScript, GSAP (ScrollTrigger, CustomEase), Tailwind v4, Vitest + @testing-library/svelte, Bun

**Design spec:** `docs/specs/2026-04-10-hero-redesign.md`
**Reference HTML:** `docs/specs/hero-v4-approved-reference.html`

**Estimated effort:** 2–3 sessions

---

## File Structure

### New Files

```
src/lib/data/hero-data.ts              — CREATE: types, mock data generator, STM route list
src/lib/data/hero-data.test.ts         — CREATE: tests for mock data constraints
src/lib/components/HeroMetrics.svelte   — CREATE: 3 metric cards (vehicles, delay, routes)
src/lib/components/HeroMetrics.test.ts  — CREATE: component tests
src/lib/components/HeroSqlPanel.svelte  — CREATE: SQL query + results panel
src/lib/components/HeroSqlPanel.test.ts — CREATE: component tests
docs/reference/CSS.md                            — CREATE: CSS architecture reference (tokens, @theme, scoped)
```

### Modified Files

```
src/lib/data/content.ts                — MODIFY: replace heroContent (new headline, remove badge/sqlDecoration)
src/lib/data/content.test.ts           — MODIFY: update heroContent assertions
src/lib/data/index.ts                  — MODIFY: add hero-data exports
src/lib/styles/tokens.css              — MODIFY: add terminal/status tokens
src/app.css                            — MODIFY: add circuit grid background, @theme tokens
src/lib/components/HeroBanner.svelte   — MODIFY: replace heroTextContainer contents, update GSAP Phase 8
src/routes/home.test.ts                — MODIFY: update hero assertions for new structure
```

### Reused (no changes needed)

```
src/lib/motion/utils/gsap.ts           — ScrollTrigger, CustomEase already registered
src/lib/motion/stores/reducedMotion.ts — prefers-reduced-motion detection
src/lib/motion/svg/MetroNetwork.svelte — metro SVG animation (phases 1-6 untouched)
src/lib/data/locale.ts                 — resolveLocale() for i18n
src/lib/data/types.ts                  — LocalizedString (no new types needed here)
```

---

## Task 1: Data Layer — Types, Mock Generator, Content Strings

**Files:**
- Create: `src/lib/data/hero-data.ts`
- Create: `src/lib/data/hero-data.test.ts`
- Modify: `src/lib/data/content.ts`
- Modify: `src/lib/data/content.test.ts`
- Modify: `src/lib/data/index.ts`

### Step 1: Write hero-data.ts with types and mock generator

- [ ] **Step 1a: Write the failing test for hero-data**

Create `src/lib/data/hero-data.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateHeroData, INITIAL_HERO_DATA, STM_ROUTES } from './hero-data.js';

describe('STM_ROUTES', () => {
  it('contains at least 10 real STM route numbers', () => {
    expect(STM_ROUTES.length).toBeGreaterThanOrEqual(10);
    for (const route of STM_ROUTES) {
      expect(route).toMatch(/^\d+$/);
    }
  });
});

describe('generateHeroData', () => {
  it('returns 3 metrics', () => {
    const data = generateHeroData();
    expect(data.metrics).toHaveLength(3);
  });

  it('returns vehicles metric within 900–1500', () => {
    const data = generateHeroData();
    const vehicles = data.metrics.find(m => m.key === 'vehicles');
    expect(vehicles).toBeDefined();
    expect(vehicles!.value).toBeGreaterThanOrEqual(900);
    expect(vehicles!.value).toBeLessThanOrEqual(1500);
    expect(Number.isInteger(vehicles!.value)).toBe(true);
  });

  it('returns delay metric within 20–90', () => {
    const data = generateHeroData();
    const delay = data.metrics.find(m => m.key === 'delay');
    expect(delay).toBeDefined();
    expect(delay!.value).toBeGreaterThanOrEqual(20);
    expect(delay!.value).toBeLessThanOrEqual(90);
    expect(delay!.unit).toBe('s');
  });

  it('returns routes metric within 160–203', () => {
    const data = generateHeroData();
    const routes = data.metrics.find(m => m.key === 'routes');
    expect(routes).toBeDefined();
    expect(routes!.value).toBeGreaterThanOrEqual(160);
    expect(routes!.value).toBeLessThanOrEqual(203);
    expect(Number.isInteger(routes!.value)).toBe(true);
  });

  it('returns exactly 5 query rows', () => {
    const data = generateHeroData();
    expect(data.queryRows).toHaveLength(5);
  });

  it('query rows have valid route numbers from STM_ROUTES', () => {
    const data = generateHeroData();
    for (const row of data.queryRows) {
      expect(STM_ROUTES).toContain(row.route);
    }
  });

  it('query rows are sorted by vehicles descending', () => {
    const data = generateHeroData();
    for (let i = 1; i < data.queryRows.length; i++) {
      expect(data.queryRows[i - 1].vehicles).toBeGreaterThanOrEqual(data.queryRows[i].vehicles);
    }
  });

  it('query rows have delay within 10–80 and vehicles within 8–35', () => {
    const data = generateHeroData();
    for (const row of data.queryRows) {
      expect(row.avgDelayS).toBeGreaterThanOrEqual(10);
      expect(row.avgDelayS).toBeLessThanOrEqual(80);
      expect(row.vehicles).toBeGreaterThanOrEqual(8);
      expect(row.vehicles).toBeLessThanOrEqual(35);
    }
  });

  it('queryTime is within 0.015–0.045', () => {
    const data = generateHeroData();
    expect(data.queryTime).toBeGreaterThanOrEqual(0.015);
    expect(data.queryTime).toBeLessThanOrEqual(0.045);
  });

  it('generates different data on successive calls', () => {
    const a = generateHeroData();
    const b = generateHeroData();
    // At least one metric value should differ (statistically near-certain)
    const aVals = a.metrics.map(m => m.value);
    const bVals = b.metrics.map(m => m.value);
    expect(aVals).not.toEqual(bVals);
  });
});

describe('INITIAL_HERO_DATA', () => {
  it('has the same shape as generateHeroData output', () => {
    expect(INITIAL_HERO_DATA.metrics).toHaveLength(3);
    expect(INITIAL_HERO_DATA.queryRows).toHaveLength(5);
    expect(typeof INITIAL_HERO_DATA.queryTime).toBe('number');
  });
});
```

- [ ] **Step 1b: Run test to verify it fails**

Run: `bun run test -- --run src/lib/data/hero-data.test.ts`
Expected: FAIL — module `./hero-data.js` does not exist.

- [ ] **Step 1c: Create hero-data.ts with types and mock generator**

Create `src/lib/data/hero-data.ts`:

```typescript
// Mock data generator for the hero section.
// Phase 1: constrained random data simulating STM transit pipeline KPIs.
// Phase 2 (future): wire to live Neon Postgres API, fall back to this on error.

export interface HeroMetric {
  label: string;
  value: number;
  unit?: string;
  sub: string;
  key: 'vehicles' | 'delay' | 'routes';
}

export interface HeroQueryRow {
  route: string;
  avgDelayS: number;
  vehicles: number;
}

export interface HeroData {
  metrics: HeroMetric[];
  queryRows: HeroQueryRow[];
  queryTime: number;
}

// Real STM bus route numbers for realistic mock data.
export const STM_ROUTES = [
  '24', '80', '121', '51', '165', '18', '45', '69',
  '105', '139', '30', '55', '150', '67', '97',
] as const;

const ROUTES_TOTAL = 203;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function generateHeroData(): HeroData {
  const vehicles = randomInt(900, 1500);
  const avgDelay = randomFloat(20, 90, 1);
  const coverage = randomFloat(80, 95, 1);
  const routesLive = randomInt(160, ROUTES_TOTAL);

  const shuffled = [...STM_ROUTES].sort(() => Math.random() - 0.5).slice(0, 5);
  const queryRows: HeroQueryRow[] = shuffled
    .map((route) => ({
      route,
      avgDelayS: randomFloat(10, 80, 1),
      vehicles: randomInt(8, 35),
    }))
    .sort((a, b) => b.vehicles - a.vehicles);

  return {
    metrics: [
      { label: 'VEHICLES TRACKED', value: vehicles, key: 'vehicles', sub: 'STM \u00b7 LIVE' },
      { label: 'AVG DELAY', value: avgDelay, unit: 's', key: 'delay', sub: `${coverage}% COVERAGE` },
      { label: 'ROUTES LIVE', value: routesLive, key: 'routes', sub: `OF ${ROUTES_TOTAL} TOTAL` },
    ],
    queryRows,
    queryTime: randomFloat(0.015, 0.045, 3),
  };
}

// Stable initial data so the first render is deterministic for SSR/tests.
export const INITIAL_HERO_DATA: HeroData = {
  metrics: [
    { label: 'VEHICLES TRACKED', value: 1247, key: 'vehicles', sub: 'STM \u00b7 LIVE' },
    { label: 'AVG DELAY', value: 47.3, unit: 's', key: 'delay', sub: '87.6% COVERAGE' },
    { label: 'ROUTES LIVE', value: 186, key: 'routes', sub: 'OF 203 TOTAL' },
  ],
  queryRows: [
    { route: '24', avgDelayS: 32.1, vehicles: 28 },
    { route: '80', avgDelayS: 51.7, vehicles: 24 },
    { route: '121', avgDelayS: 18.4, vehicles: 22 },
    { route: '51', avgDelayS: 44.9, vehicles: 19 },
    { route: '165', avgDelayS: 27.6, vehicles: 17 },
  ],
  queryTime: 0.023,
};
```

- [ ] **Step 1d: Run test to verify it passes**

Run: `bun run test -- --run src/lib/data/hero-data.test.ts`
Expected: ALL PASS

- [ ] **Step 1e: Update content.ts — replace heroContent**

In `src/lib/data/content.ts`, replace the entire `heroContent` export with:

```typescript
export const heroContent = {
  headline: {
    line1: { en: 'PIPELINES THAT' } satisfies LocalizedString,
    line2: { en: "DON'T BREAK." } satisfies LocalizedString,
  },
  subheadline: { en: 'Data that tell the truth.' } satisfies LocalizedString,
  subtitle: {
    en: "Building reliable infrastructure for teams that can't afford downtime.",
  } satisfies LocalizedString,
  ctaWork: { en: 'See how I build \u2192' } satisfies LocalizedString,
  ctaContact: { en: "Let's talk" } satisfies LocalizedString,
  sqlPanel: {
    prompt: { en: 'yesid@transit:gold>' } satisfies LocalizedString,
    liveLabel: { en: 'LIVE' } satisfies LocalizedString,
  },
  refreshButton: {
    label: { en: 'PULL FRESH DATA' } satisfies LocalizedString,
    helper: {
      en: 'Refreshes metrics + query results from the live pipeline',
    } satisfies LocalizedString,
  },
} as const;
```

**Removed fields:** `badge`, `headline.line3`, `sqlDecoration` — no longer in the hero design.

- [ ] **Step 1f: Update content.test.ts — fix heroContent assertions**

Replace the `heroContent` describe block in `src/lib/data/content.test.ts`:

```typescript
describe('heroContent', () => {
  it('has headline lines as non-empty English strings', () => {
    expect(heroContent.headline.line1.en).toBe('PIPELINES THAT');
    expect(heroContent.headline.line2.en).toBe("DON'T BREAK.");
  });

  it('has subheadline text', () => {
    expect(heroContent.subheadline.en).toBe('Data that tell the truth.');
  });

  it('has subtitle text', () => {
    expect(heroContent.subtitle.en.length).toBeGreaterThan(0);
  });

  it('has CTA labels', () => {
    expect(heroContent.ctaWork.en.length).toBeGreaterThan(0);
    expect(heroContent.ctaContact.en.length).toBeGreaterThan(0);
  });

  it('has SQL panel labels', () => {
    expect(heroContent.sqlPanel.prompt.en).toContain('yesid@transit');
    expect(heroContent.sqlPanel.liveLabel.en).toBe('LIVE');
  });

  it('has refresh button labels', () => {
    expect(heroContent.refreshButton.label.en).toContain('PULL');
    expect(heroContent.refreshButton.helper.en.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 1g: Update index.ts — add hero-data exports**

In `src/lib/data/index.ts`, add after the existing content exports:

```typescript
// Hero mock data (Slice 13d)
export { generateHeroData, INITIAL_HERO_DATA, STM_ROUTES } from './hero-data.js';
export type { HeroMetric, HeroQueryRow, HeroData } from './hero-data.js';
```

- [ ] **Step 1h: Run all data tests**

Run: `bun run test -- --run src/lib/data/hero-data.test.ts src/lib/data/content.test.ts`
Expected: ALL PASS

- [ ] **Step 1i: Run type check**

Run: `bun run check`
Expected: PASS — no type errors.

- [ ] **Step 1j: Commit**

```bash
git add src/lib/data/hero-data.ts src/lib/data/hero-data.test.ts src/lib/data/content.ts src/lib/data/content.test.ts src/lib/data/index.ts
git commit -m "feat(slice-13d): hero data layer — types, mock generator, content strings"
```

**STOP. Ask Yesid to verify tests pass before moving to Task 2.**

---

## Task 2: CSS Tokens + Circuit Grid Background

**Files:**
- Modify: `src/lib/styles/tokens.css`
- Modify: `src/app.css`

- [ ] **Step 2a: Add terminal/status tokens to tokens.css**

In `src/lib/styles/tokens.css`, add to the `[data-theme="dark"]` block:

```css
--bg-terminal: #0a0a0a;
--border-subtle: #2a2a2a;
--text-dim: #4a4a4a;
--status-live: #22c55e;
```

Also add to the `@media (prefers-color-scheme: dark)` block inside `:root:not([data-theme="light"])`:

```css
--bg-terminal: #0a0a0a;
--border-subtle: #2a2a2a;
--text-dim: #4a4a4a;
--status-live: #22c55e;
```

- [ ] **Step 2b: Add @theme tokens and circuit grid to app.css**

In the `@theme` block in `src/app.css`, add:

```css
/* Terminal / SQL panel (Slice 13d) */
--color-terminal-bg: #0a0a0a;
--color-terminal-border: #2a2a2a;
--color-dim: #4a4a4a;
--color-live: #22c55e;
```

After the closing `}` of the `html` rule (after `overflow-x: hidden;`), add the circuit grid:

```css
/* Circuit grid background — site-wide except nav/footer.
   Applied via main content wrapper in +layout.svelte or per-section.
   Uses brand orange at very low opacity for a subtle engineering texture. */
.circuit-grid {
  position: relative;
}
.circuit-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(224,120,0,0.025) 0px, transparent 1px, transparent 80px),
    repeating-linear-gradient(0deg, rgba(224,120,0,0.025) 0px, transparent 1px, transparent 80px);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 2c: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 2d: Commit**

```bash
git add src/lib/styles/tokens.css src/app.css
git commit -m "feat(slice-13d): CSS tokens for terminal panel + circuit grid background"
```

**STOP. Ask Yesid to verify the circuit grid is visible on existing pages (add `circuit-grid` class to a test section to confirm, then remove).**

---

## Task 3: HeroMetrics Component

**Files:**
- Create: `src/lib/components/HeroMetrics.svelte`
- Create: `src/lib/components/HeroMetrics.test.ts`

- [ ] **Step 3a: Write the failing test**

Create `src/lib/components/HeroMetrics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroMetrics from './HeroMetrics.svelte';
import { INITIAL_HERO_DATA } from '$lib/data';

describe('HeroMetrics', () => {
  const metrics = INITIAL_HERO_DATA.metrics;

  it('renders 3 metric cards', () => {
    render(HeroMetrics, { props: { metrics } });
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(3);
  });

  it('renders vehicle count with comma formatting', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-vehicles').textContent).toContain('1,247');
  });

  it('renders delay with unit suffix', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-delay').textContent).toContain('47.3');
    expect(screen.getByTestId('metric-value-delay').textContent).toContain('s');
  });

  it('renders routes count', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-routes').textContent).toContain('186');
  });

  it('renders labels for each card', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText('VEHICLES TRACKED')).toBeInTheDocument();
    expect(screen.getByText('AVG DELAY')).toBeInTheDocument();
    expect(screen.getByText('ROUTES LIVE')).toBeInTheDocument();
  });

  it('renders sub-labels for each card', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText(/STM/)).toBeInTheDocument();
    expect(screen.getByText(/COVERAGE/)).toBeInTheDocument();
    expect(screen.getByText(/OF 203 TOTAL/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3b: Run test to verify it fails**

Run: `bun run test -- --run src/lib/components/HeroMetrics.test.ts`
Expected: FAIL — cannot resolve `./HeroMetrics.svelte`.

- [ ] **Step 3c: Create HeroMetrics.svelte**

Create `src/lib/components/HeroMetrics.svelte`:

```svelte
<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '$lib/data/hero-data.js';

  interface Props {
    metrics: HeroMetric[];
  }

  let { metrics }: Props = $props();

  function formatValue(metric: HeroMetric): string {
    if (metric.key === 'vehicles') return metric.value.toLocaleString('en-US');
    if (metric.key === 'delay') return metric.value.toFixed(1);
    return String(metric.value);
  }
</script>

<div class="grid grid-cols-3 gap-3.5" data-testid="hero-metrics">
  {#each metrics as metric (metric.key)}
    <div
      class="rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5 transition-colors duration-300 hover:border-[var(--brand-primary)]"
      data-testid="metric-card"
    >
      <div class="font-mono text-[9px] tracking-[2px] text-[var(--text-muted)]">
        {metric.label}
      </div>
      <div
        class="mt-1 font-heading text-[clamp(28px,2.5vw,36px)] font-extrabold leading-none text-[var(--brand-primary)]"
        data-testid="metric-value-{metric.key}"
      >
        {formatValue(metric)}{#if metric.unit}<span class="text-[60%] text-[var(--text-secondary)]">{metric.unit}</span>{/if}
      </div>
      <div class="mt-1 font-mono text-[9px] text-[var(--text-dim)]">
        {metric.sub}
      </div>
    </div>
  {/each}
</div>
```

- [ ] **Step 3d: Run test to verify it passes**

Run: `bun run test -- --run src/lib/components/HeroMetrics.test.ts`
Expected: ALL PASS

- [ ] **Step 3e: Commit**

```bash
git add src/lib/components/HeroMetrics.svelte src/lib/components/HeroMetrics.test.ts
git commit -m "feat(slice-13d): HeroMetrics component — 3 transit KPI cards"
```

**STOP. Ask Yesid to verify on localhost (component renders correctly when wired into hero in Task 5).**

---

## Task 4: HeroSqlPanel Component

**Files:**
- Create: `src/lib/components/HeroSqlPanel.svelte`
- Create: `src/lib/components/HeroSqlPanel.test.ts`

- [ ] **Step 4a: Write the failing test**

Create `src/lib/components/HeroSqlPanel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroSqlPanel from './HeroSqlPanel.svelte';
import { INITIAL_HERO_DATA } from '$lib/data';

describe('HeroSqlPanel', () => {
  const props = {
    rows: INITIAL_HERO_DATA.queryRows,
    queryTime: INITIAL_HERO_DATA.queryTime,
    prompt: 'yesid@transit:gold>',
    liveLabel: 'LIVE',
  };

  it('renders the terminal prompt', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByTestId('sql-prompt').textContent).toContain('yesid@transit');
  });

  it('renders the LIVE indicator', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByTestId('sql-live')).toBeInTheDocument();
    expect(screen.getByTestId('sql-live').textContent).toContain('LIVE');
  });

  it('renders the SQL query with syntax highlighting', () => {
    render(HeroSqlPanel, { props });
    const query = screen.getByTestId('sql-query');
    expect(query.textContent).toContain('SELECT');
    expect(query.textContent).toContain('gold.latest_trip_delay_snapshot');
    expect(query.textContent).toContain('LIMIT');
  });

  it('renders 5 result rows', () => {
    render(HeroSqlPanel, { props });
    const rows = screen.getAllByTestId('sql-result-row');
    expect(rows).toHaveLength(5);
  });

  it('renders result column headers', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByText('route')).toBeInTheDocument();
    expect(screen.getByText('avg_delay_s')).toBeInTheDocument();
    expect(screen.getByText('vehicles')).toBeInTheDocument();
  });

  it('renders meta line with query time', () => {
    render(HeroSqlPanel, { props });
    const meta = screen.getByTestId('sql-meta');
    expect(meta.textContent).toContain('5 rows');
    expect(meta.textContent).toContain('0.023s');
  });
});
```

- [ ] **Step 4b: Run test to verify it fails**

Run: `bun run test -- --run src/lib/components/HeroSqlPanel.test.ts`
Expected: FAIL — cannot resolve `./HeroSqlPanel.svelte`.

- [ ] **Step 4c: Create HeroSqlPanel.svelte**

Create `src/lib/components/HeroSqlPanel.svelte`:

```svelte
<!--
  SQL panel for the hero — shows a real Gold-layer query with syntax highlighting
  and a results table. Rows + queryTime are props so the parent can refresh them.
  The SQL query itself is static (always the same analysis query).
-->
<script lang="ts">
  import type { HeroQueryRow } from '$lib/data/hero-data.js';

  interface Props {
    rows: HeroQueryRow[];
    queryTime: number;
    prompt: string;
    liveLabel: string;
    updatedAgo?: string;
  }

  let { rows, queryTime, prompt, liveLabel, updatedAgo = '30s ago' }: Props = $props();
</script>

<div
  class="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-terminal)] p-[22px_24px] font-mono"
  data-testid="sql-panel"
>
  <!-- Header: prompt + live dot -->
  <div class="mb-4 flex items-center justify-between">
    <span class="text-[11px] tracking-[1px] text-[var(--text-muted)]" data-testid="sql-prompt">
      {prompt}
    </span>
    <span class="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]" data-testid="sql-live">
      <span class="live-dot"></span>
      {liveLabel}
    </span>
  </div>

  <!-- Query with syntax highlighting -->
  <div class="text-xs leading-[1.7]" data-testid="sql-query">
    <span class="text-[var(--brand-primary)]">SELECT</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;d.route_short_name,</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">round</span><span class="text-[var(--text-secondary)]">(</span><span class="text-[var(--brand-primary)]">avg</span><span class="text-[var(--text-secondary)]">(f.delay_seconds)::numeric, 1)</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">AS</span> <span class="text-[var(--text-secondary)]">avg_delay_s,</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">count</span><span class="text-[var(--text-secondary)]">(</span><span class="text-[var(--brand-primary)]">DISTINCT</span> <span class="text-[var(--text-secondary)]">f.vehicle_id)</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">AS</span> <span class="text-[var(--text-secondary)]">vehicles</span><br />
    <span class="text-[var(--brand-primary)]">FROM</span> <span class="text-[var(--brand-accent)]">gold.latest_trip_delay_snapshot</span> <span class="text-[var(--text-secondary)]">f</span><br />
    <span class="text-[var(--brand-primary)]">JOIN</span> <span class="text-[var(--brand-accent)]">gold.dim_route</span> <span class="text-[var(--text-secondary)]">d</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">USING</span> <span class="text-[var(--text-secondary)]">(provider_id, route_id)</span><br />
    <span class="text-[var(--brand-primary)]">WHERE</span> <span class="text-[var(--text-secondary)]">f.delay_seconds</span> <span class="text-[var(--brand-primary)]">IS NOT NULL</span><br />
    <span class="text-[var(--brand-primary)]">GROUP BY</span> <span class="text-[var(--text-secondary)]">d.route_short_name</span><br />
    <span class="text-[var(--brand-primary)]">ORDER BY</span> <span class="text-[var(--text-secondary)]">vehicles</span> <span class="text-[var(--brand-primary)]">DESC</span><br />
    <span class="text-[var(--brand-primary)]">LIMIT</span> <span class="text-[var(--brand-accent)]">5</span><span class="text-[var(--text-secondary)]">;</span>
  </div>

  <!-- Results table -->
  <div class="mt-4 border-t border-[var(--border-subtle)] pt-3">
    <div class="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">route</span>
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">avg_delay_s</span>
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">vehicles</span>
      {#each rows as row (row.route)}
        <span class="text-[var(--text-primary)]" data-testid="sql-result-row">{row.route}</span>
        <span class="text-[var(--brand-accent)]">{row.avgDelayS}</span>
        <span class="text-[var(--text-secondary)]">{row.vehicles}</span>
      {/each}
    </div>
    <div class="mt-2.5 text-[10px] text-[var(--text-dim)]" data-testid="sql-meta">
      5 rows &middot; {queryTime}s &middot; updated {updatedAgo}
    </div>
  </div>
</div>

<style>
  .live-dot {
    width: 7px;
    height: 7px;
    background: var(--status-live);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--status-live);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 6px var(--status-live); }
    50% { box-shadow: 0 0 12px var(--status-live), 0 0 24px rgba(34, 197, 94, 0.3); }
  }
</style>
```

- [ ] **Step 4d: Run test to verify it passes**

Run: `bun run test -- --run src/lib/components/HeroSqlPanel.test.ts`
Expected: ALL PASS

- [ ] **Step 4e: Commit**

```bash
git add src/lib/components/HeroSqlPanel.svelte src/lib/components/HeroSqlPanel.test.ts
git commit -m "feat(slice-13d): HeroSqlPanel component — syntax-highlighted SQL + results"
```

**STOP. Ask Yesid to verify on localhost (component renders correctly when wired into hero in Task 5).**

---

## Task 5: HeroBanner Layout Swap

Replace the `heroTextContainer` contents with the new two-column grid layout. This is the main integration task — it wires HeroMetrics + HeroSqlPanel into the hero and repositions the orange dot.

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` (HTML template only — GSAP in Task 6)

- [ ] **Step 5a: Update script imports**

In `HeroBanner.svelte`'s `<script>` block, replace the content imports:

**Remove these lines:**
```typescript
const badgeLabel = resolveLocale(heroContent.badge, 'en');
const headlineLine1 = resolveLocale(heroContent.headline.line1, 'en');
const headlineLine2 = resolveLocale(heroContent.headline.line2, 'en');
const headlineLine3 = resolveLocale(heroContent.headline.line3, 'en');
const subtitleText = resolveLocale(heroContent.subtitle, 'en');
const ctaWorkLabel = resolveLocale(heroContent.ctaWork, 'en');
const ctaContactLabel = resolveLocale(heroContent.ctaContact, 'en');
const sqlLine1 = resolveLocale(heroContent.sqlDecoration.line1, 'en');
const sqlLine2 = resolveLocale(heroContent.sqlDecoration.line2, 'en');
const sqlLine3 = resolveLocale(heroContent.sqlDecoration.line3, 'en');
```

**Add these lines:**
```typescript
import HeroMetrics from './HeroMetrics.svelte';
import HeroSqlPanel from './HeroSqlPanel.svelte';
import { INITIAL_HERO_DATA, generateHeroData } from '$lib/data';
import type { HeroData } from '$lib/data';

const headlineLine1 = resolveLocale(heroContent.headline.line1, 'en');
const headlineLine2 = resolveLocale(heroContent.headline.line2, 'en');
const subheadlineText = resolveLocale(heroContent.subheadline, 'en');
const subtitleText = resolveLocale(heroContent.subtitle, 'en');
const ctaWorkLabel = resolveLocale(heroContent.ctaWork, 'en');
const ctaContactLabel = resolveLocale(heroContent.ctaContact, 'en');
const sqlPrompt = resolveLocale(heroContent.sqlPanel.prompt, 'en');
const sqlLiveLabel = resolveLocale(heroContent.sqlPanel.liveLabel, 'en');
const refreshLabel = resolveLocale(heroContent.refreshButton.label, 'en');
const refreshHelper = resolveLocale(heroContent.refreshButton.helper, 'en');

let heroData: HeroData = $state(INITIAL_HERO_DATA);
let updatedAgo: string = $state('30s ago');
let refreshIcon: HTMLSpanElement;

function handleRefresh() {
  heroData = generateHeroData();
  updatedAgo = 'just now';

  // Spin the refresh icon
  if (refreshIcon) {
    refreshIcon.style.transition = 'transform 0.6s ease';
    refreshIcon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      refreshIcon.style.transition = 'none';
      refreshIcon.style.transform = 'rotate(0deg)';
    }, 600);
  }
}
```

- [ ] **Step 5b: Replace heroTextContainer HTML**

Replace the entire contents inside `heroTextContainer` (the `<div>` bound to `heroTextContainer` with `data-testid="hero-text-container"`). Replace from the inner `<div class="flex w-full max-w-5xl ...">` through the closing `</div>` of the SQL decoration, with:

```svelte
<div class="w-full max-w-6xl">
  <!-- Two-column grid: left text | divider | right SQL -->
  <div class="hero-grid">
    <!-- LEFT COLUMN -->
    <div>
      <h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
        <span
          class="block text-[clamp(48px,6vw,84px)] text-[var(--text-primary)]"
          data-testid="hero-line1"
          data-hero-stagger="1"
        >
          {headlineLine1}
        </span>
      </h1>

      <div class="my-6" data-hero-stagger="3">
        <HeroMetrics metrics={heroData.metrics} />
      </div>

      <h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
        <span
          class="block text-[clamp(48px,6vw,84px)] text-[var(--brand-primary)]"
          data-testid="hero-line2"
        >
          <span data-hero-stagger="1">DON'T BREAK</span><span
            bind:this={heroDot}
            class="text-[var(--brand-primary)]"
            data-testid="hero-dot"
          >.</span>
        </span>
      </h1>

      <div
        class="mt-2.5 text-[clamp(20px,2.5vw,34px)] font-bold leading-[1.1] text-[var(--text-secondary)]"
        data-testid="hero-subheadline"
        data-hero-stagger="2"
      >
        {subheadlineText}
      </div>

      <p
        class="mt-5 text-[15px] leading-[1.7] text-[var(--text-secondary)]"
        data-testid="hero-subtitle"
        data-hero-stagger="6"
      >
        {subtitleText}
      </p>

      <div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
        <a
          href="/work"
          class="inline-flex items-center rounded-lg bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-[#141414] transition-colors hover:bg-[var(--brand-primary-hover)]"
          data-testid="hero-cta-work"
        >
          {ctaWorkLabel}
        </a>
        <a
          href="/contact"
          class="inline-flex items-center rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          data-testid="hero-cta-contact"
        >
          {ctaContactLabel}
        </a>
      </div>
    </div>

    <!-- VERTICAL DIVIDER (desktop only) -->
    <div
      class="hidden self-stretch md:block"
      data-hero-stagger="5"
    >
      <div class="hero-divider"></div>
    </div>

    <!-- RIGHT COLUMN: SQL PANEL -->
    <div data-hero-stagger="4">
      <HeroSqlPanel
        rows={heroData.queryRows}
        queryTime={heroData.queryTime}
        prompt={sqlPrompt}
        liveLabel={sqlLiveLabel}
        {updatedAgo}
      />
    </div>
  </div>

  <!-- REFRESH BUTTON — full width, below grid -->
  <div class="mt-8 text-center" data-hero-stagger="7">
    <button
      class="refresh-btn"
      data-testid="hero-refresh"
      onclick={handleRefresh}
    >
      <span bind:this={refreshIcon} class="text-xl">&#x21bb;</span>
      {refreshLabel}
    </button>
    <div class="mt-2 font-mono text-[10px] text-[var(--text-dim)]">
      {refreshHelper}
    </div>
  </div>
</div>
```

- [ ] **Step 5c: Add scoped styles for hero grid, divider, and refresh button**

In the `<style>` block at the bottom of `HeroBanner.svelte`, add:

```css
/* Two-column hero grid: text | divider | SQL panel */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 32px;
  align-items: start;
}

/* Vertical divider with faded ends */
.hero-divider {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--border) 15%,
    var(--border) 85%,
    transparent 100%
  );
}

/* Refresh button — orange gradient, glow, JetBrains Mono */
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%);
  color: #141414;
  border: none;
  padding: 16px 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 800;
  font-family: var(--font-mono);
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow:
    0 0 24px rgba(224, 120, 0, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.2s, transform 0.2s;
}
.refresh-btn:hover {
  box-shadow:
    0 0 40px rgba(224, 120, 0, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

/* Mobile: stacked layout */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .refresh-btn {
    width: 100%;
    justify-content: center;
    padding: 14px;
    font-size: 14px;
    margin-bottom: 14px;
  }
}
```

- [ ] **Step 5d: Run type check**

Run: `bun run check`
Expected: PASS — no type errors. If errors exist from removed badge/sqlDecoration references, fix remaining references.

- [ ] **Step 5e: Run tests**

Run: `bun run test -- --run src/lib/components/HeroMetrics.test.ts src/lib/components/HeroSqlPanel.test.ts`
Expected: ALL PASS

- [ ] **Step 5f: Commit**

```bash
git add src/lib/components/HeroBanner.svelte
git commit -m "feat(slice-13d): hero layout swap — two-column grid with metrics + SQL panel"
```

**STOP. Ask Yesid to verify on localhost:**
- **Desktop (1440px):** Two-column layout with headline left, SQL panel right, divider between. Metric cards 3-across under "PIPELINES THAT". "DON'T BREAK." in orange below cards. Refresh button centered below.
- **Mobile (375px):** Stacked layout, no divider, SQL panel below text. Full-width refresh button.
- **Scroll animation:** The zoom-out from the metro SVG should still work — the orange dot in "DON'T BREAK." should be the transform origin. The stagger reveal won't be updated yet (coming in Task 6).

---

## Task 6: GSAP Stagger Animation — 7 Groups

Update GSAP Phase 8 in `HeroBanner.svelte` from 4 stagger groups to 7.

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` (script block only — Phase 8 tweens)

- [ ] **Step 6a: Replace Phase 8 stagger selectors**

In the `onMount` function, find the Phase 8 section (after `// === Phase 8`). Replace:

```typescript
const stagger1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
const stagger2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
const stagger3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
const stagger4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');

tl.to(stagger1, {
  opacity: 1,
  duration: 0.15,
  stagger: 0.02,
  ease: 'power1.out',
}, 1.10);

tl.to(stagger2, {
  opacity: 1,
  duration: 0.12,
  ease: 'power1.out',
}, 1.18);

tl.to(stagger3, {
  opacity: 1,
  duration: 0.10,
  stagger: 0.02,
  ease: 'power1.out',
}, 1.25);

tl.to(stagger4, {
  opacity: 1,
  duration: 0.10,
  ease: 'power1.out',
}, 1.32);
```

With:

```typescript
// Stagger group references — 7 groups for the redesigned hero
const stagger1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]'); // Headlines
const stagger2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]'); // Subheadline
const stagger3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]'); // Metric cards
const stagger4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]'); // SQL panel
const stagger5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]'); // Divider
const stagger6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]'); // Subtitle + CTAs
const stagger7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]'); // Refresh button

// Stagger 1: Headlines ("PIPELINES THAT", "DON'T BREAK.")
tl.to(stagger1, {
  opacity: 1,
  duration: 0.15,
  stagger: 0.02,
  ease: 'power1.out',
}, 1.10);

// Stagger 2: Subheadline ("Data that tell the truth.")
tl.to(stagger2, {
  opacity: 1,
  duration: 0.12,
  ease: 'power1.out',
}, 1.18);

// Stagger 3: Metric cards (left → right)
tl.to(stagger3, {
  opacity: 1,
  duration: 0.12,
  ease: 'power1.out',
}, 1.22);

// Stagger 4: SQL panel (fade in)
tl.to(stagger4, {
  opacity: 1,
  duration: 0.12,
  ease: 'power1.out',
}, 1.26);

// Stagger 5: Vertical divider
tl.to(stagger5, {
  opacity: 1,
  duration: 0.10,
  ease: 'power1.out',
}, 1.30);

// Stagger 6: Subtitle + CTAs
tl.to(stagger6, {
  opacity: 1,
  duration: 0.10,
  stagger: 0.02,
  ease: 'power1.out',
}, 1.32);

// Stagger 7: Refresh button (last, fade up)
tl.to(stagger7, {
  opacity: 1,
  y: 0,
  duration: 0.10,
  ease: 'power1.out',
}, 1.38);
```

- [ ] **Step 6b: Add initial y-offset for refresh button**

Find the line `gsap.set(staggerEls, { opacity: 0 });` and add after it:

```typescript
// Refresh button starts slightly below for a fade-up entrance
const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
if (refreshEl) gsap.set(refreshEl, { y: 12 });
```

- [ ] **Step 6c: Adjust Phase 9 hold position**

Update the Phase 9 hold to account for the longer stagger sequence. Change:
```typescript
tl.set({}, {}, 1.5);
```
To:
```typescript
tl.set({}, {}, 1.55);
```

- [ ] **Step 6d: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 6e: Commit**

```bash
git add src/lib/components/HeroBanner.svelte
git commit -m "feat(slice-13d): GSAP stagger reveal — 7 groups for redesigned hero"
```

**STOP. Ask Yesid to verify on localhost:**
- Scroll through the full animation: metro SVG → zoom into Berri-UQAM → cross-fade → zoom out revealing hero text
- Elements should stagger in: headlines first → subheadline → metric cards → SQL panel → divider → subtitle + CTAs → refresh button
- The "." dot in "DON'T BREAK." should be the zoom-out origin
- Reduced motion: all content visible immediately, no animations

---

## Task 7: Circuit Grid Background — Site-wide

Apply the `circuit-grid` class to page sections across the site, excluding nav and footer.

**Files:**
- Modify: `src/routes/+page.svelte` (or `+layout.svelte` — depends on structure)
- Potentially modify section wrappers in other route pages

- [ ] **Step 7a: Identify where to apply the circuit-grid class**

Read `src/routes/+layout.svelte` and `src/routes/+page.svelte` to determine the best application point. The goal is to apply `circuit-grid` to the `<main>` content area (between nav and footer) so all page sections get the background.

Two approaches:
1. **Layout-level:** Add `circuit-grid` class to the `<main>` element in `+layout.svelte`
2. **Section-level:** Add `circuit-grid` class to individual sections

Layout-level is preferred (one change, all pages).

- [ ] **Step 7b: Add circuit-grid class**

In `+layout.svelte`, add the `circuit-grid` class to the `<main>` element. If there is no explicit `<main>` wrapper, add one between the nav and footer.

- [ ] **Step 7c: Verify visually**

Check at least 3 pages:
1. Home page — hero + manifesto sections should show grid
2. `/work` — project cards should show grid
3. `/contact` — contact form should show grid
4. Navbar and footer should NOT show the grid

- [ ] **Step 7d: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(slice-13d): circuit grid background site-wide (excludes nav/footer)"
```

**STOP. Ask Yesid to verify on localhost — scroll through multiple pages checking for subtle orange grid lines behind content. Nav and footer must NOT have the grid.**

---

## Task 8: Mobile Responsive Polish

Fine-tune the mobile layout for screens below 768px.

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` (scoped styles)
- Modify: `src/lib/components/HeroMetrics.svelte` (mobile overrides)
- Modify: `src/lib/components/HeroSqlPanel.svelte` (mobile overrides)

- [ ] **Step 8a: HeroMetrics mobile — horizontal scroll**

In `HeroMetrics.svelte`, update the container to switch from grid to horizontal scroll on mobile. Replace the outer `<div>` classes:

```svelte
<div class="hero-metrics-grid" data-testid="hero-metrics">
```

Add scoped style:

```css
.hero-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

@media (max-width: 768px) {
  .hero-metrics-grid {
    display: flex;
    gap: 8px;
    overflow-x: auto;
  }
  .hero-metrics-grid > :global(div) {
    flex: 0 0 auto;
    padding: 10px 12px;
  }
}
```

Remove the Tailwind `grid grid-cols-3 gap-3.5` classes since the scoped CSS handles it.

- [ ] **Step 8b: HeroSqlPanel mobile — smaller text**

In `HeroSqlPanel.svelte`, add to the scoped styles:

```css
@media (max-width: 768px) {
  .sql-panel-wrap {
    padding: 12px;
    margin-bottom: 14px;
  }
  .sql-panel-wrap :global(.text-xs) {
    font-size: 10px;
    line-height: 1.5;
  }
}
```

Add `sql-panel-wrap` class to the outer div.

- [ ] **Step 8c: HeroBanner mobile — headline nowrap, CTA sizing**

In `HeroBanner.svelte`'s mobile media query, add:

```css
@media (max-width: 768px) {
  /* ... existing rules ... */

  /* Keep "PIPELINES THAT" on one line */
  [data-testid="hero-line1"] {
    font-size: 34px;
    white-space: nowrap;
  }

  /* Slightly smaller orange headline on mobile */
  [data-testid="hero-line2"] {
    font-size: 34px;
  }

  /* CTAs: equal width, side by side */
  .hero-ctas-mobile {
    display: flex;
    gap: 10px;
  }
  .hero-ctas-mobile > * {
    flex: 1;
    text-align: center;
    padding: 10px 16px;
    font-size: 12px;
  }
}
```

- [ ] **Step 8d: Run tests**

Run: `bun run test -- --run src/lib/components/HeroMetrics.test.ts src/lib/components/HeroSqlPanel.test.ts`
Expected: ALL PASS

- [ ] **Step 8e: Commit**

```bash
git add src/lib/components/HeroBanner.svelte src/lib/components/HeroMetrics.svelte src/lib/components/HeroSqlPanel.svelte
git commit -m "feat(slice-13d): mobile responsive — horizontal scroll metrics, stacked layout"
```

**STOP. Ask Yesid to verify on localhost at 375px width:**
- "PIPELINES THAT" on one line
- Metric cards in horizontal scroll row
- SQL panel below text, full width
- Refresh button full width
- CTAs side by side

---

## Task 9: Test Updates + Documentation

Update `home.test.ts` for the new hero structure and create `docs/reference/CSS.md`.

**Files:**
- Modify: `src/routes/home.test.ts`
- Create: `docs/reference/CSS.md`

- [ ] **Step 9a: Update home.test.ts**

Replace the hero-specific tests in `src/routes/home.test.ts`:

```typescript
it('renders the hero headline', () => {
  render(Page);
  expect(screen.getByTestId('hero-line1')).toBeInTheDocument();
  expect(screen.getByTestId('hero-line1').textContent).toContain('PIPELINES THAT');
  expect(screen.getByTestId('hero-line2')).toBeInTheDocument();
  expect(screen.getByTestId('hero-line2').textContent).toContain("DON'T BREAK.");
});

it('renders the hero orange dot', () => {
  render(Page);
  const dot = screen.getByTestId('hero-dot');
  expect(dot).toBeInTheDocument();
  expect(dot.textContent).toBe('.');
});

it('renders hero subheadline', () => {
  render(Page);
  const sub = screen.getByTestId('hero-subheadline');
  expect(sub).toBeInTheDocument();
  expect(sub.textContent).toContain('Data that tell the truth');
});

it('renders hero subtitle', () => {
  render(Page);
  const subtitle = screen.getByTestId('hero-subtitle');
  expect(subtitle).toBeInTheDocument();
  expect(subtitle.textContent).toContain('reliable infrastructure');
});

it('renders hero CTAs', () => {
  render(Page);
  expect(screen.getByTestId('hero-cta-work')).toBeInTheDocument();
  expect(screen.getByTestId('hero-cta-contact')).toBeInTheDocument();
});

it('renders hero metric cards', () => {
  render(Page);
  expect(screen.getByTestId('hero-metrics')).toBeInTheDocument();
  const cards = screen.getAllByTestId('metric-card');
  expect(cards).toHaveLength(3);
});

it('renders hero SQL panel', () => {
  render(Page);
  expect(screen.getByTestId('sql-panel')).toBeInTheDocument();
  expect(screen.getByTestId('sql-query').textContent).toContain('SELECT');
});

it('renders hero refresh button', () => {
  render(Page);
  expect(screen.getByTestId('hero-refresh')).toBeInTheDocument();
});
```

**Remove** the old `hero-badge` and `hero-sql` tests (those elements no longer exist).

- [ ] **Step 9b: Run full test suite**

Run: `bun run test`
Expected: ALL PASS. Print the full test result table per CLAUDE.md.

- [ ] **Step 9c: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 9d: Create docs/reference/CSS.md**

Create `docs/reference/CSS.md` documenting the three-layer CSS architecture and all tokens. Include the new terminal/status tokens added in Task 2.

- [ ] **Step 9e: Commit**

```bash
git add src/routes/home.test.ts docs/reference/CSS.md
git commit -m "feat(slice-13d): test updates + CSS.md documentation"
```

**STOP. Ask Yesid to verify all tests pass, then proceed to slice closing.**

---

## Execution Order

```
Task 1 (data layer) ← foundation, everything depends on this
  ↓
Task 2 (CSS tokens + grid) ← independent of Tasks 3-4, but needed by Task 5
  ↓
Task 3 (HeroMetrics) ← depends on Task 1 types
  ↓
Task 4 (HeroSqlPanel) ← depends on Task 1 types
  ↓
Task 5 (layout swap) ← depends on Tasks 1-4
  ↓
Task 6 (GSAP stagger) ← depends on Task 5 HTML structure
  ↓
Task 7 (circuit grid) ← independent, can run anytime after Task 2
  ↓
Task 8 (mobile polish) ← depends on Task 5
  ↓
Task 9 (tests + docs) ← final, depends on everything
```

**Session estimate:**
- **Session 1:** Tasks 1–5 (data, tokens, components, layout swap)
- **Session 2:** Tasks 6–9 (GSAP, grid, mobile, tests)

---

## Out of Scope

- Live API integration (Phase 2 — future slice, connects to Neon Postgres)
- Changes to the metro SVG animation (Phases 1-6)
- Changes to the manifesto section below the hard cut
- Changes to the hard cut transition itself
- i18n translations (all content is English-only for now)
- Three.js / Threlte (this slice is pure 2D)

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| Two-column grid with divider | Task 5 |
| "PIPELINES THAT" + "DON'T BREAK." headlines | Tasks 1, 5 |
| 3 metric cards (vehicles, delay, routes) | Tasks 1, 3, 5 |
| SQL panel with syntax highlighting | Task 4, 5 |
| Real SQL query from Gold layer | Task 4 |
| "PULL FRESH DATA" refresh button | Tasks 1, 5, (handled inline in Task 5) |
| Mock data within constrained bounds | Task 1 |
| Mobile stacked layout | Tasks 5, 8 |
| Circuit grid background site-wide | Tasks 2, 7 |
| GSAP 7-group stagger reveal | Task 6 |
| Reduced motion: static display | Already handled by existing code (stagger els start visible) |
| Dot as zoom transform-origin | Task 5 (heroDot binding moved) |

### Placeholder Scan

No TBD/TODO/placeholder patterns found. All tasks include code.

### Type Consistency

- `HeroMetric`, `HeroQueryRow`, `HeroData` — defined in Task 1, used in Tasks 3, 4, 5
- `generateHeroData()`, `INITIAL_HERO_DATA` — defined in Task 1, imported in Task 5
- `heroContent.headline.line1/line2`, `.subheadline`, `.subtitle`, `.ctaWork`, `.ctaContact`, `.sqlPanel`, `.refreshButton` — defined in Task 1, used in Task 5
- `formatValue()` — defined and used only in Task 3
- `handleRefresh()` — defined and used only in Task 5
- All `data-testid` values match between component code and test assertions
