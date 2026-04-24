// Shared weather fetch for Montreal.
// Server-side only — uses $env/dynamic/private.
// 30-minute in-memory cache to avoid hitting API on every page load.

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
