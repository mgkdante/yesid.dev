// GET /api/weather — fresh Montreal weather for client-side refresh.
//
// slice-28.1 (audit #20/#122): /about and /contact bake weather into the SSR
// HTML, and the page-level CDN cache (hooks.server.ts: s-maxage=86400) can
// serve that snapshot for up to a day. This endpoint lets the client refresh
// after hydration: same WeatherData shape, same server-side util (the
// OPENWEATHER_API_KEY never leaves the server), with its own 30-minute edge
// TTL so crawl-heavy days still cost at most ~48 OpenWeather calls.
//
// Returns JSON `null` (200) when the key is missing or the upstream fetch
// fails — clients keep whatever value was SSR-baked.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchMontrealWeather } from '$lib/utils/weather';
import { isSupportedLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
import type { Locale } from '$lib/types';

// Resolve the locale from ?lang= (client passes the active locale). Unknown or
// missing values fall back to EN — the cache-control below is locale-agnostic,
// and ?lang is part of the URL so each language stays its own cacheable key.
function localeFromQuery(url: URL): Locale {
	const lang = url.searchParams.get('lang');
	return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}

export const GET: RequestHandler = async ({ url }) => {
	const weather = await fetchMontrealWeather(localeFromQuery(url));
	return json(weather, {
		headers: {
			'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600',
		},
	});
};
