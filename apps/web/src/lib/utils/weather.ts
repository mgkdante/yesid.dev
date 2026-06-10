// Shared weather fetch for Montreal.
// Server-side only — uses $env/dynamic/private. Client code may import the
// WeatherData TYPE only (type imports are erased; the env import must never
// reach the browser bundle).
//
// Freshness model (slice-28.1, audit #20/#122):
//   - The 30-minute in-memory TTL below only bounds OpenWeather API calls
//     within a warm server instance — it is NOT what visitors see.
//   - /about + /contact SSR-bake this value into HTML that the CDN caches
//     for up to a day (hooks.server.ts s-maxage=86400), so the baked number
//     can be that stale.
//   - GET /api/weather re-exposes this util with a 30-minute edge TTL;
//     ContactPage/AboutWeather refresh from it after hydration.

import { env } from '$env/dynamic/private';

export interface WeatherData {
	temp: number;
	condition: string;
	icon: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
let cachedWeather: WeatherData | null = null;
let cachedAt = 0;

/**
 * Fetch current Montreal weather from OpenWeatherMap.
 * Returns null if API key is missing or fetch fails.
 */
export async function fetchMontrealWeather(): Promise<WeatherData | null> {
	if (!env.OPENWEATHER_API_KEY) {
		return null;
	}

	const now = Date.now();
	if (cachedWeather && now - cachedAt < CACHE_TTL_MS) {
		return cachedWeather;
	}

	try {
		const res = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=Montreal,CA&units=metric&appid=${env.OPENWEATHER_API_KEY}`
		);

		if (res.ok) {
			const data = await res.json();
			cachedWeather = {
				temp: Math.round(data.main.temp),
				condition: data.weather[0]?.description ?? '',
				icon: data.weather[0]?.icon ?? '01d',
			};
			cachedAt = now;
			return cachedWeather;
		}
	} catch {
		// Silently fall back — caller shows UI without weather
	}

	return null;
}
