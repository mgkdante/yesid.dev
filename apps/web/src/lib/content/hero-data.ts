// Mock data generator for the hero section.
// Phase 1: constrained random data simulating STM transit pipeline KPIs.
// Phase 2 (future): wire to live Neon Postgres API, fall back to this on error.

import type { Locale, LocalizedString } from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';

export interface HeroMetric {
  // Resolved, display-ready label/sub (plain strings). The metric cards
  // (HeroMetrics → MetricDisplay) render these directly. EN by default; the
  // consumer (HeroBanner) overwrites them with the locale-resolved value of
  // labelI18n/subI18n at render time via localizeHeroData().
  label: string;
  value: number;
  unit?: string;
  sub: string;
  key: 'vehicles' | 'delay' | 'routes';
  // go2/about: localized sources for the dashboard LABELS. Numbers/units and
  // the "STM" wordmark stay verbatim; only the words get a fr. Optional so bare
  // generators/fixtures (EN-only label/sub) still satisfy HeroMetric.
  labelI18n?: LocalizedString;
  subI18n?: LocalizedString;
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
        label: 'VEHICLES TRACKED',
        value: vehicles,
        key: 'vehicles',
        sub: 'STM \u00b7 LIVE',
        labelI18n: { en: 'VEHICLES TRACKED', fr: 'V\u00c9HICULES SUIVIS' },
        subI18n: { en: 'STM \u00b7 LIVE', fr: 'STM \u00b7 EN DIRECT' },
      },
      {
        label: 'AVG DELAY',
        value: avgDelay,
        unit: 's',
        key: 'delay',
        sub: `${coverage}% COVERAGE`,
        labelI18n: { en: 'AVG DELAY', fr: 'RETARD MOYEN' },
        subI18n: { en: `${coverage}% COVERAGE`, fr: `${coverage}% DE COUVERTURE` },
      },
      {
        label: 'ROUTES LIVE',
        value: routesLive,
        key: 'routes',
        sub: `OF ${ROUTES_TOTAL} TOTAL`,
        labelI18n: { en: 'ROUTES LIVE', fr: 'LIGNES EN DIRECT' },
        subI18n: { en: `OF ${ROUTES_TOTAL} TOTAL`, fr: `SUR ${ROUTES_TOTAL} AU TOTAL` },
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
      label: 'VEHICLES TRACKED',
      value: 1247,
      key: 'vehicles',
      sub: 'STM \u00b7 LIVE',
      labelI18n: { en: 'VEHICLES TRACKED', fr: 'V\u00c9HICULES SUIVIS' },
      subI18n: { en: 'STM \u00b7 LIVE', fr: 'STM \u00b7 EN DIRECT' },
    },
    {
      label: 'AVG DELAY',
      value: 47.3,
      unit: 's',
      key: 'delay',
      sub: '87.6% COVERAGE',
      labelI18n: { en: 'AVG DELAY', fr: 'RETARD MOYEN' },
      subI18n: { en: '87.6% COVERAGE', fr: '87.6% DE COUVERTURE' },
    },
    {
      label: 'ROUTES LIVE',
      value: 186,
      key: 'routes',
      sub: 'OF 203 TOTAL',
      labelI18n: { en: 'ROUTES LIVE', fr: 'LIGNES EN DIRECT' },
      subI18n: { en: 'OF 203 TOTAL', fr: 'SUR 203 AU TOTAL' },
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

// go2/about: resolve each metric's localized LABEL/SUB into the display-ready
// `label`/`sub` plain strings for the requested locale, leaving values, units,
// keys, and query rows untouched (numbers/units never localize). The metric
// cards stay locale-agnostic — HeroBanner feeds them this resolved copy.
export function localizeHeroData(data: HeroData, locale: Locale): HeroData {
  return {
    ...data,
    metrics: data.metrics.map((metric) => ({
      ...metric,
      label: metric.labelI18n ? resolveLocale(metric.labelI18n, locale) : metric.label,
      sub: metric.subI18n ? resolveLocale(metric.subI18n, locale) : metric.sub,
    })),
  };
}
