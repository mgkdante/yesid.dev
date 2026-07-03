import { describe, it, expect } from 'vitest';
import { mapLiveKpis, fetchLiveKpis, LIVE_KPIS_URL } from './live-kpis';

// Real-shaped payload from the deployed endpoint (2026-07-02), including a
// negative avgDelayS (early buses are part of the contract).
const validPayload = {
	snapshotAt: '2026-07-03T01:15:40Z',
	freshnessS: 20,
	vehicles: 448,
	avgDelayS: 64,
	coverage: 0.81,
	routesLive: 143,
	routesTotal: 227,
	topRoutes: [
		{ route: '439', vehicles: 10, avgDelayS: -45 },
		{ route: '747', vehicles: 10, avgDelayS: 221 },
		{ route: '141', vehicles: 7, avgDelayS: 18 },
		{ route: '48', vehicles: 7, avgDelayS: 49 },
		{ route: '49', vehicles: 7, avgDelayS: 53 },
	],
};

describe('mapLiveKpis', () => {
	it('maps a full payload onto HeroData (metrics keyed, coverage as %)', () => {
		const snap = mapLiveKpis(validPayload);
		expect(snap).not.toBeNull();
		expect(snap!.freshnessS).toBe(20);
		const [vehicles, delay, routes] = snap!.data.metrics;
		expect(vehicles).toEqual({ value: 448, key: 'vehicles' });
		expect(delay.key).toBe('delay');
		expect(delay.value).toBe(64);
		expect(delay.coverage).toBe(81);
		expect(routes).toEqual({ value: 143, key: 'routes', total: 227 });
		expect(snap!.data.queryRows).toHaveLength(5);
		expect(snap!.data.queryRows[0]).toEqual({ route: '439', avgDelayS: -45, vehicles: 10 });
	});

	it('accepts fewer than 5 topRoutes (overnight) and caps at 5', () => {
		const two = { ...validPayload, topRoutes: validPayload.topRoutes.slice(0, 2) };
		expect(mapLiveKpis(two)!.data.queryRows).toHaveLength(2);
		const seven = { ...validPayload, topRoutes: [...validPayload.topRoutes, ...validPayload.topRoutes.slice(0, 2)] };
		expect(mapLiveKpis(seven)!.data.queryRows).toHaveLength(5);
	});

	it('returns null when any lane is null (honest-null: DEMO, not partial-live)', () => {
		expect(mapLiveKpis({ ...validPayload, avgDelayS: null })).toBeNull();
		expect(mapLiveKpis({ ...validPayload, vehicles: null })).toBeNull();
		expect(mapLiveKpis({ ...validPayload, topRoutes: [] })).toBeNull();
		expect(mapLiveKpis({ ...validPayload, topRoutes: [{ route: '51', vehicles: null, avgDelayS: 3 }] })).toBeNull();
		expect(mapLiveKpis(null)).toBeNull();
		expect(mapLiveKpis('nope')).toBeNull();
	});
});

describe('fetchLiveKpis', () => {
	it('resolves a stamped snapshot on 200 with no-store', async () => {
		const fetchFn = (async (url: RequestInfo | URL, init?: RequestInit) => {
			expect(String(url)).toBe(LIVE_KPIS_URL);
			expect(init?.cache).toBe('no-store');
			return new Response(JSON.stringify(validPayload), { status: 200 });
		}) as typeof fetch;
		const snap = await fetchLiveKpis(fetchFn);
		expect(snap).not.toBeNull();
		expect(snap!.data.queryTime).toBeGreaterThan(0);
	});

	it('resolves null on 503 (pipeline cold) and on network error', async () => {
		const cold = (async () => new Response('cold', { status: 503 })) as typeof fetch;
		expect(await fetchLiveKpis(cold)).toBeNull();
		const boom = (async () => {
			throw new Error('offline');
		}) as unknown as typeof fetch;
		expect(await fetchLiveKpis(boom)).toBeNull();
	});
});
