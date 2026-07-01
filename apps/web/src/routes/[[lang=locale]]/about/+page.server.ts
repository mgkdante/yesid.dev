import { getAboutPageContent } from '$lib/repositories';
import { fetchMontrealWeather } from '$lib/utils/weather';
import { localeFromParams } from '$lib/utils/locale-routing';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

// slice-18i Phase 7C: thread pageCache ctx so loadPage('about') memo-ises.
// Intentionally untyped (no PageServerLoad annotation) — the generated
// +page.server.ts type constrains the return to include App.PageData.seo,
// which is provided by +layout.ts, not the page server load.
export async function load({
	locals,
	params,
	url,
}: {
	locals: App.Locals;
	params: Partial<Record<string, string>>;
	url: URL;
}) {
	const ctx = { pageCache: locals.pageCache };

	const aboutPage = await getAboutPageContent(ctx);

	if (!aboutPage.weather.enabled) {
		return { aboutPage, weather: null };
	}

	// SSR-bake the condition in the request locale (fr/es). EN is the default.
	const locale = localeFromParams(params, url.pathname);
	const weather = await fetchMontrealWeather(locale);
	return { aboutPage, weather };
};
