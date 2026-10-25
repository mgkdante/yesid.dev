import { adapter } from '#lib/adapters/index.js';
import { fetchMontrealWeather } from '#lib/utils/weather.js';
import { localeFromParams } from '#lib/utils/locale-routing.js';
import { localeEntries } from '#lib/server/prerender-entries.js';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/about')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

// Intentionally untyped (no PageServerLoad annotation) — the generated
// +page.server.ts type constrains the return to include App.PageData.seo,
// which is provided by +layout.ts, not the page server load.
export async function load({
	params,
	url,
}: {
	params: Partial<Record<string, string>>;
	url: URL;
}) {
	const aboutPage = await adapter.content.aboutPage();

	if (!aboutPage.weather.enabled) {
		return { aboutPage, weather: null };
	}

	// SSR-bake the condition in the request locale (fr/es). EN is the default.
	const locale = localeFromParams(params, url.pathname);
	const weather = await fetchMontrealWeather(locale);
	return { aboutPage, weather };
};
