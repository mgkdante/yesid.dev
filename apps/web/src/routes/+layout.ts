import type { LayoutLoad } from './$types';
import { getPageSeo, getSiteSeoDefaults } from '$lib/repositories/meta';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';

// Universal load (runs both SSR + client). SSR guarantees bots and social
// crawlers see populated <head> tags on first byte — including for pages that
// set `export const ssr = false` on their own +page.ts (e.g., the home page
// disables SSR for GSAP compatibility but the layout still SSRs).
//
// Locale today is always DEFAULT_LOCALE (EN). When FR/ES ship, a locale
// resolver hook (accept-language, cookie, or URL segment depending on the
// scheme chosen) plugs in here.
//
// Slice 18 18h: `themeColor` sources from `site_meta.theme_color` (CMS), via
// `getSiteSeoDefaults()`. Per-request WeakMap memo on the raw singleton row
// shares the underlying CMS fetch with `getPageSeo()` (which also calls
// `meta.site()` + `meta.siteSeoDefaults()` inside the composer) — net one
// `readSingleton('site_meta')` call per navigation despite the two repository
// calls.
export const load: LayoutLoad = async ({ route, params }) => {
	const routeId = route.id ?? '/__error';
	const locale = DEFAULT_LOCALE;
	try {
		const [seo, siteSeoDefaults] = await Promise.all([
			getPageSeo(routeId, locale, params as Record<string, string>),
			getSiteSeoDefaults(),
		]);
		return { seo, themeColor: siteSeoDefaults.themeColor };
	} catch (err) {
		// Unknown route id or CMS unreachable: fall back to the 404 entry so the
		// page still renders with a valid <head>. Log so the dev build surfaces
		// the miss. themeColor falls through to SeoHead's `'#141414'` default.
		if (import.meta.env.DEV) {
			console.warn(`[+layout.ts] Falling back to error SEO for route "${routeId}":`, err);
		}
		const seo = await getPageSeo('/__error', locale);
		return { seo, themeColor: '#141414' };
	}
};
