import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	fetchLiveKpis,
	LIVE_KPIS_URL,
	LIVE_POLL_MS,
	mapLiveKpis,
	startLiveKpiPolling,
} from './live-kpis';

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

describe('startLiveKpiPolling', () => {
	let visibilityDocument: EventTarget & { hidden: boolean };

	beforeEach(() => {
		vi.useFakeTimers();
		visibilityDocument = Object.assign(new EventTarget(), { hidden: false });
		vi.stubGlobal('document', visibilityDocument);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('polls immediately when visible and again at the live cadence', () => {
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);

		expect(poll).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(LIVE_POLL_MS - 1);
		expect(poll).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1);
		expect(poll).toHaveBeenCalledTimes(2);

		stop();
	});

	it('does not poll on a hidden start or hidden interval ticks', () => {
		visibilityDocument.hidden = true;
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);

		vi.advanceTimersByTime(LIVE_POLL_MS * 2);
		expect(poll).not.toHaveBeenCalled();

		stop();
	});

	it('polls immediately when a hidden document becomes visible', () => {
		visibilityDocument.hidden = true;
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);

		visibilityDocument.hidden = false;
		visibilityDocument.dispatchEvent(new Event('visibilitychange'));
		expect(poll).toHaveBeenCalledTimes(1);

		stop();
	});

	it('restarts the cadence after waking instead of firing the mount-anchored tick', () => {
		visibilityDocument.hidden = true;
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);
		vi.advanceTimersByTime(LIVE_POLL_MS - 1);

		visibilityDocument.hidden = false;
		visibilityDocument.dispatchEvent(new Event('visibilitychange'));
		expect(poll).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(1);

		vi.advanceTimersByTime(1);
		expect(poll).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(LIVE_POLL_MS - 1);
		expect(poll).toHaveBeenCalledTimes(2);

		stop();
	});

	it('suppresses interval ticks after the document returns hidden', () => {
		visibilityDocument.hidden = true;
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);
		visibilityDocument.hidden = false;
		visibilityDocument.dispatchEvent(new Event('visibilitychange'));

		visibilityDocument.hidden = true;
		visibilityDocument.dispatchEvent(new Event('visibilitychange'));
		vi.advanceTimersByTime(LIVE_POLL_MS * 2);
		expect(poll).toHaveBeenCalledTimes(1);

		stop();
	});

	it('clears its interval and visibility listener on teardown', () => {
		const removeEventListener = vi.spyOn(visibilityDocument, 'removeEventListener');
		const poll = vi.fn();
		const stop = startLiveKpiPolling(poll);

		stop();
		expect(vi.getTimerCount()).toBe(0);
		expect(removeEventListener).toHaveBeenCalledWith(
			'visibilitychange',
			expect.any(Function),
		);

		vi.advanceTimersByTime(LIVE_POLL_MS);
		visibilityDocument.dispatchEvent(new Event('visibilitychange'));
		expect(poll).toHaveBeenCalledTimes(1);
	});
});
