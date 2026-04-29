import type { LayoutLoad } from './$types';
import { getPageSeo, getSiteSeoDefaults } from '$lib/repositories/meta';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import { siteMeta as STATIC_SITE_META } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { errorSeoFallback } from '$lib/adapters/route-seo-factories';
import { navLinks as staticNavLinks, menuItems as staticMenuItems } from '$lib/content/nav';
import type { NavLink } from '$lib/content/nav';

/** Shape of the nav-slot data merged from +layout.server.ts. */
interface NavSlotData {
	headerLinks: readonly NavLink[];
	footerLinks: readonly NavLink[];
	mobileLinks: readonly NavLink[];
	menuItems: readonly NavLink[];
}

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
//
// Defense-in-depth: the catch fallback is CMS-free. A previous incident saw
// the live `site_meta` singleton wiped (orphan-delete from a parallel
// `sync:push`); the catch had previously called `getPageSeo('/__error')`
// which re-entered the same broken singleton, cascading every route into
// 500. The fallback now uses the static brand fixture + STATIC_SITE_SEO_DEFAULTS
// so a wiped/unreachable CMS degrades to the dev-default <head> instead.
//
// slice-18i Phase 5 Task 5.2: reads nav slot data from the `data` parameter
// (i.e., the +layout.server.ts output, typed as LayoutServerData) so
// +layout.svelte can pass headerLinks / footerLinks / menuItems as props to
// Nav and Footer components.
//
// Note: SvelteKit's LayoutLoad InputData = LayoutServerData (the server load
// output). The `data` parameter in LayoutLoadEvent carries the server data.
// `parent()` in a root layout returns LayoutParentData which is `{}` — it does
// NOT carry the server data from this layout's own +layout.server.ts.
export const load: LayoutLoad = async ({ route, params, data }) => {
	const routeId = route.id ?? '/__error';
	const locale = DEFAULT_LOCALE;

	// Static fallback for nav slots — used when +layout.server.ts data is
	// unavailable (e.g., during the catch branch or CSR-only renders).
	const navFallback: NavSlotData = {
		headerLinks: staticNavLinks,
		footerLinks: staticMenuItems,
		mobileLinks: [],
		menuItems: staticMenuItems,
	};

	// `data` holds the +layout.server.ts output (LayoutServerData).
	// Awaited concurrently with the SEO fetch.
	const slots: NavSlotData = {
		headerLinks: data?.headerLinks ?? navFallback.headerLinks,
		footerLinks: data?.footerLinks ?? navFallback.footerLinks,
		mobileLinks: data?.mobileLinks ?? navFallback.mobileLinks,
		menuItems: data?.menuItems ?? navFallback.menuItems,
	};

	try {
		const [seo, siteSeoDefaults] = await Promise.all([
			getPageSeo(routeId, locale, params as Record<string, string>),
			getSiteSeoDefaults(),
		]);
		return { seo, themeColor: siteSeoDefaults.themeColor, ...slots };
	} catch (err) {
		if (import.meta.env.DEV) {
			console.warn(`[+layout.ts] Falling back to error SEO for route "${routeId}":`, err);
		}
		const seo = errorSeoFallback({
			locale,
			siteMeta: STATIC_SITE_META,
			siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
		});
		return { seo, themeColor: STATIC_SITE_SEO_DEFAULTS.themeColor, ...slots };
	}
};
