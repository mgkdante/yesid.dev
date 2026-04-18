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
