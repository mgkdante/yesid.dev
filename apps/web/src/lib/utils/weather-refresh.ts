// Client-side weather refresh. Every page prerenders (`+layout.server.ts:36`), and
// `fetchMontrealWeather` returns `null` while building (`weather.ts` building guard), so in
// production the `weather` prop ships as `null` and this fetch is the only source of
// weather in the browser. (The prop is real under `vite dev` and in unit tests, which is
// why consumers still render it first.) EN must omit `?lang=` so the `/api/weather` URL —
// and therefore its edge cache key (`api/weather/+server.ts` s-maxage) — stays
// byte-identical to the pre-i18n form; fr/es append it so OpenWeather localizes
// `condition`.

import type { Locale } from '$lib/types';
import type { WeatherData } from '$lib/utils/weather';
import { DEFAULT_LOCALE } from '$lib/utils/locale';

export async function fetchFreshWeather(locale: Locale): Promise<WeatherData | null> {
	try {
		const url = locale === DEFAULT_LOCALE ? '/api/weather' : `/api/weather?lang=${locale}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const data = (await res.json()) as WeatherData | null;
		if (data && typeof data.temp === 'number') return data;
		return null;
	} catch {
		return null;
	}
}
