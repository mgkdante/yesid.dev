// Live transit KPIs consumer (homework #2 phase 2).
// Contract: GET https://transit.yesid.dev/api/v1/kpis (transit-data-proxy):
//   - server cache 30s + stale-while-revalidate; the client sends no-store
//     because the promised cache lives server-side.
//   - number lanes are NULLABLE per source; a stale vehicles feed is a 503
//     (+ Retry-After), never invented numbers.
//   - topRoutes carries UP TO 5 rows (fewer overnight); avgDelayS can be
//     NEGATIVE (early buses); routesTotal = 227 trackable bus routes.
// Honest-null policy on this side: the hero is either fully LIVE (every lane
// present) or fully DEMO with DEMO labels. Partial-live rendering would dress
// mixed data up as one coherent snapshot, which is the exact overclaim the
// honesty pass removed.

import type { HeroData, HeroQueryRow } from './hero-data';

export const LIVE_KPIS_URL = 'https://transit.yesid.dev/api/v1/kpis';

/** One pipeline publish cycle: the endpoint's snapshot advances every ~30s. */
export const LIVE_POLL_MS = 30_000;

export interface LiveHeroSnapshot {
	data: HeroData;
	/** Seconds since snapshotAt, computed server-side at serve time. */
	freshnessS: number;
}

function num(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Map a raw /api/v1/kpis payload onto the hero's HeroData shape.
 * Returns null unless EVERY lane the hero renders is present and finite;
 * a null return means "stay in DEMO mode", never "render a partial".
 * queryTime is left at 0 for the caller (fetchLiveKpis stamps the measured
 * round trip, the live analog of the demo generator's fake query time).
 */
export function mapLiveKpis(payload: unknown): LiveHeroSnapshot | null {
	if (typeof payload !== 'object' || payload === null) return null;
	const p = payload as Record<string, unknown>;
	const vehicles = num(p.vehicles);
	const avgDelayS = num(p.avgDelayS);
	const coverage = num(p.coverage);
	const routesLive = num(p.routesLive);
	const routesTotal = num(p.routesTotal);
	const freshnessS = num(p.freshnessS);
	const rawRoutes = Array.isArray(p.topRoutes) ? p.topRoutes : null;
	if (
		vehicles === null ||
		avgDelayS === null ||
		coverage === null ||
		routesLive === null ||
		routesTotal === null ||
		freshnessS === null ||
		rawRoutes === null ||
		rawRoutes.length === 0
	) {
		return null;
	}

	const queryRows: HeroQueryRow[] = [];
	for (const raw of rawRoutes.slice(0, 5)) {
		if (typeof raw !== 'object' || raw === null) return null;
		const row = raw as Record<string, unknown>;
		const route = typeof row.route === 'string' && row.route.length > 0 ? row.route : null;
		const rowVehicles = num(row.vehicles);
		const rowDelay = num(row.avgDelayS);
		if (route === null || rowVehicles === null || rowDelay === null) return null;
		queryRows.push({ route, avgDelayS: rowDelay, vehicles: rowVehicles });
	}

	return {
		freshnessS,
		data: {
			metrics: [
				{ value: vehicles, key: 'vehicles' },
				// coverage arrives as a 0-1 fraction; the CMS delaySub template
				// interpolates it as "{coverage}% COVERAGE".
				{ value: avgDelayS, unit: 's', key: 'delay', coverage: Math.round(coverage * 1000) / 10 },
				{ value: routesLive, key: 'routes', total: routesTotal },
			],
			queryRows,
			queryTime: 0,
		},
	};
}

/**
 * Fetch + map one live snapshot. Any failure (network, 503 pipeline-cold,
 * malformed body, missing lane) resolves to null so the caller falls back to
 * the demo generator with DEMO labels.
 */
export async function fetchLiveKpis(fetchFn: typeof fetch = fetch): Promise<LiveHeroSnapshot | null> {
	try {
		const started = Date.now();
		const res = await fetchFn(LIVE_KPIS_URL, { cache: 'no-store' });
		if (!res.ok) return null;
		const snapshot = mapLiveKpis(await res.json());
		if (!snapshot) return null;
		snapshot.data.queryTime = Math.max(0.001, parseFloat(((Date.now() - started) / 1000).toFixed(3)));
		return snapshot;
	} catch {
		return null;
	}
}
