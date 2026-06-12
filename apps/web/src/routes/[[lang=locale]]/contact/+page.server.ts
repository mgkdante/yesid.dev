import { getContactPageContent } from '$lib/repositories';
import { fetchMontrealWeather } from '$lib/utils/weather';

// slice-18i Phase 7C: thread pageCache ctx so loadPage('contact') memo-ises.
export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [contactPage, weather] = await Promise.all([
		getContactPageContent(ctx),
		fetchMontrealWeather(),
	]);

	return { contactPage, weather };
};
