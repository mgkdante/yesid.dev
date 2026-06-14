// Mock data generator for the hero section.
// Phase 1: constrained random data simulating STM transit pipeline KPIs.
// Phase 2 (future): wire to live Neon Postgres API, fall back to this on error.

export interface HeroMetric {
  // Code-owned dynamic data only — value/unit/key plus the numbers the CMS
  // sub-templates interpolate. The dashboard card LABEL/SUB copy is CMS truth
  // now: HeroMetrics resolves it from siteLabels.heroDashboard keyed by `key`
  // (slice fr-leaks-cms-truth). Numbers/units and the "STM" wordmark stay
  // verbatim; only the words localize, and they live in Directus.
  value: number;
  unit?: string;
  key: 'vehicles' | 'delay' | 'routes';
  // Dynamic numbers the CMS sub-templates interpolate: {coverage} (delay card,
  // per-render %) and {total} (routes card, constant route count). Optional so
  // bare fixtures still satisfy HeroMetric; HeroMetrics substitutes them into
  // siteLabels.heroDashboard.delaySub / .routesSub.
  coverage?: number;
  total?: number;
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
      {
        value: vehicles,
        key: 'vehicles',
      },
      {
        value: avgDelay,
        unit: 's',
        key: 'delay',
        coverage,
      },
      {
        value: routesLive,
        key: 'routes',
        total: ROUTES_TOTAL,
      },
    ],
    queryRows,
    queryTime: randomFloat(0.015, 0.045, 3),
  };
}

// Stable initial data so the first render is deterministic for SSR/tests.
export const INITIAL_HERO_DATA: HeroData = {
  metrics: [
    {
      value: 1247,
      key: 'vehicles',
    },
    {
      value: 47.3,
      unit: 's',
      key: 'delay',
      coverage: 87.6,
    },
    {
      value: 186,
      key: 'routes',
      total: 203,
    },
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
