// Server-only weather fetch; clients refresh CDN-baked page data through /api/weather's separate 30-minute cache.
import { building } from '$app/env';

import { OPENWEATHER_API_KEY } from '$app/env/private';
import type { Locale } from '#lib/types.ts';
import { DEFAULT_LOCALE } from '#lib/utils/locale.ts';

export interface WeatherData {
	temp: number;
	condition: string;
	icon: string;
}

// Map the request locale to OpenWeather's `lang` code. OpenWeather localizes
// data.weather[0].description per this param; en|fr|es happen to be identity
// for our locales, but the explicit map keeps the contract honest and defaults
// any unknown locale to English (EN stays the default — no lang param drift).
const OPENWEATHER_LANG: Record<Locale, string> = {
	en: 'en',
	fr: 'fr',
	es: 'es',
};

function openWeatherLang(locale: Locale): string {
	return OPENWEATHER_LANG[locale] ?? OPENWEATHER_LANG[DEFAULT_LOCALE];
}

const CACHE_TTL_MS = 30 * 60 * 1000;

// Cache is keyed by OpenWeather lang code: the `condition` string is localized,
// so a warm EN entry must never be served to an FR/ES request and vice versa.
// temp/icon are locale-invariant, so the extra calls are at most one per locale
// per TTL window.
interface CacheEntry {
	weather: WeatherData;
	at: number;
}
const cache = new Map<string, CacheEntry>();

/**
 * Fetch current Montreal weather from OpenWeatherMap in the given locale.
 * `condition` is localized via OpenWeather's `lang` param (en|fr|es).
 * Defaults to English. Returns null if API key is missing or fetch fails.
 */
export async function fetchMontrealWeather(
	locale: Locale = DEFAULT_LOCALE,
): Promise<WeatherData | null> {
	// Runtime env values are unavailable while prerendering, and a build-time
	// snapshot would be stale anyway. Prerendered pages
	// ship without baked weather; WeatherScene/AboutWeather hydrate from
	// GET /api/weather, which stays a dynamic (non-prerendered) endpoint.
	if (building) {
		return null;
	}
	if (!OPENWEATHER_API_KEY) {
		return null;
	}

	const lang = openWeatherLang(locale);
	const now = Date.now();
	const cached = cache.get(lang);
	if (cached && now - cached.at < CACHE_TTL_MS) {
		return cached.weather;
	}

	try {
		const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Montreal,CA&units=metric&lang=${lang}&appid=${OPENWEATHER_API_KEY}`);

		if (res.ok) {
			const data = await res.json();
			const weather: WeatherData = {
				temp: Math.round(data.main.temp),
				condition: data.weather[0]?.description ?? '',
				icon: data.weather[0]?.icon ?? '01d',
			};
			cache.set(lang, { weather, at: now });
			return weather;
		}
	} catch {
		// Silently fall back — caller shows UI without weather
	}

	return null;
}
