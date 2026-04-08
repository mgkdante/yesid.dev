// Server-side weather fetch for the About page.
// Uses OpenWeatherMap free tier. API key stays on the server —
// only the result (temp, condition, icon code) reaches the browser.
// Graceful fallback: if the API fails or key is missing, returns null.

import { env } from '$env/dynamic/private';
import { aboutPageContent } from '$lib/data/about-page.js';

// Simple in-memory TTL cache to avoid hitting the API on every page load.
// 30 minutes is plenty — weather doesn't change that fast.
const CACHE_TTL_MS = 30 * 60 * 1000;
let cachedWeather: { temp: number; condition: string; icon: string } | null = null;
let cachedAt = 0;

export async function load() {
	// Skip if weather is disabled or API key is missing
	if (!aboutPageContent.weather.enabled || !env.OPENWEATHER_API_KEY) {
		return { weather: null };
	}

	// Return cached result if still fresh
	const now = Date.now();
	if (cachedWeather && now - cachedAt < CACHE_TTL_MS) {
		return { weather: cachedWeather };
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
			return { weather: cachedWeather };
		}
	} catch {
		// Silently fall back — widget shows city without temperature
	}

	return { weather: null };
}
