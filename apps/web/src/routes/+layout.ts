import type { LayoutLoad } from './$types';
import { getPageSeo } from '$lib/repositories/meta';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';

// Universal load (runs both SSR + client). SSR guarantees bots and social
// crawlers see populated <head> tags on first byte — including for pages that
// set `export const ssr = false` on their own +page.ts (e.g., the home page
// disables SSR for GSAP/Lottie compatibility but the layout still SSRs).
//
// Locale today is always DEFAULT_LOCALE (EN). When FR/ES ship, a locale
// resolver hook (accept-language, cookie, or URL segment depending on the
// scheme chosen) plugs in here.
export const load: LayoutLoad = async ({ route, params }) => {
	const routeId = route.id ?? '/__error';
	const locale = DEFAULT_LOCALE;
	try {
		const seo = await getPageSeo(routeId, locale, params as Record<string, string>);
		return { seo };
	} catch (err) {
		// Unknown route id: fall back to the 404 entry so the page still renders
		// with a valid <head>. Log so the dev build surfaces the miss.
		if (import.meta.env.DEV) {
			console.warn(`[+layout.ts] Falling back to error SEO for route "${routeId}":`, err);
		}
		const seo = await getPageSeo('/__error', locale);
		return { seo };
	}
};
