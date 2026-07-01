import { getContactPageContent } from '$lib/repositories';
import { fetchMontrealWeather } from '$lib/utils/weather';
import { localeFromParams } from '$lib/utils/locale-routing';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

// slice-18i Phase 7C: thread pageCache ctx so loadPage('contact') memo-ises.
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

	// SSR-bake the condition in the request locale (fr/es). EN is the default.
	const locale = localeFromParams(params, url.pathname);
	const [contactPage, weather] = await Promise.all([
		getContactPageContent(ctx),
		fetchMontrealWeather(locale),
	]);

	return { contactPage, weather };
};
