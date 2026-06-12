import { getAboutPageContent } from '$lib/repositories';
import { fetchMontrealWeather } from '$lib/utils/weather';

// slice-18i Phase 7C: thread pageCache ctx so loadPage('about') memo-ises.
// Intentionally untyped (no PageServerLoad annotation) — the generated
// +page.server.ts type constrains the return to include App.PageData.seo,
// which is provided by +layout.ts, not the page server load.
export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const aboutPage = await getAboutPageContent(ctx);

	if (!aboutPage.weather.enabled) {
		return { aboutPage, weather: null };
	}

	const weather = await fetchMontrealWeather();
	return { aboutPage, weather };
};
