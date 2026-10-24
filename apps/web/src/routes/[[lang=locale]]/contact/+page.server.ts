import { adapter } from '$lib/adapters';
import { fetchMontrealWeather } from '$lib/utils/weather';
import { localeFromParams } from '$lib/utils/locale-routing';
import { localeEntries } from '$lib/server/prerender-entries';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/contact')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({
	params,
	url,
}: {
	params: Partial<Record<string, string>>;
	url: URL;
}) {
	// SSR-bake the condition in the request locale (fr/es). EN is the default.
	const locale = localeFromParams(params, url.pathname);
	const [contactPage, weather] = await Promise.all([
		adapter.content.contactPage(),
		fetchMontrealWeather(locale),
	]);

	return { contactPage, weather };
};
