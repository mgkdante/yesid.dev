// Refresh CDN-stale page weather with a separate 30-minute cache; null preserves the client's existing value.

import type { RequestHandler } from './$types';

// Stays on the lambda: live weather is the entire point of this endpoint —
// prerendered pages ship without baked weather and hydrate from here.
export const prerender = false;
import { fetchMontrealWeather } from '#lib/utils/weather.ts';
import { isSupportedLocale, DEFAULT_LOCALE } from '#lib/utils/locale.ts';
import type { Locale } from '#lib/types.ts';

// Resolve the locale from ?lang= (client passes the active locale). Unknown or
// missing values fall back to EN — the cache-control below is locale-agnostic,
// and ?lang is part of the URL so each language stays its own cacheable key.
function localeFromQuery(url: URL): Locale {
	const lang = url.searchParams.get('lang');
	return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}

export const GET: RequestHandler = async ({ url }) => {
	const weather = await fetchMontrealWeather(localeFromQuery(url));
	return Response.json(weather, {
		headers: {
			'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600',
		},
	});
};
