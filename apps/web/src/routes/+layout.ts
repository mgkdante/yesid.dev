import type { LayoutLoad } from './$types';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import { siteMeta as STATIC_SITE_META } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { errorSeoFallback } from '$lib/adapters/route-seo-factories';
import {
	navLinks as staticNavLinks,
	menuItems as staticMenuItems,
	footerLinks as staticFooterLinks,
	mobileLinks as staticMobileLinks,
	errorPageContent as staticErrorPageContent,
} from '$lib/content/nav';
import type { NavLink, ErrorPageContent } from '$lib/content/nav';
import { FALLBACK_MORPH_SHAPES } from '$lib/utils/shapes';
import type { MorphShape, PageSeo, SiteSeoDefaults } from '$lib/types';

/** Shape of the layout-data slots merged from +layout.server.ts. */
interface LayoutSlotData {
	headerLinks: readonly NavLink[];
	footerLinks: readonly NavLink[];
	mobileLinks: readonly NavLink[];
	menuItems: readonly NavLink[];
	/** CMS-fetched generic error page (status 0 fallback row). Forwarded to
	 *  +error.svelte via `$page.data.errorPage`. SvelteKit error pages have no
	 *  companion loader so this must travel through the layout data. */
	errorPage: ErrorPageContent;
}

interface LayoutServerSlots extends Partial<LayoutSlotData> {
	seo?: PageSeo;
	themeColor?: SiteSeoDefaults['themeColor'];
	morphShapes?: readonly MorphShape[];
}

// Universal load (runs both SSR + client). It must stay CMS-free: +layout.server.ts
// resolves SEO/nav/error content once, SvelteKit serializes that into __data.json,
// and this load only forwards the server data during hydration.
//
// Locale today is always DEFAULT_LOCALE (EN). When FR/ES ship, a locale
// resolver hook (accept-language, cookie, or URL segment depending on the
// scheme chosen) plugs in here.
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
export const load: LayoutLoad = async ({ data }) => {
	const locale = DEFAULT_LOCALE;
	const serverData = (data ?? {}) as LayoutServerSlots;

	// Static fallback for layout slots — used when +layout.server.ts data is
	// unavailable (e.g., during CSR-only renders in tests).
	const slotFallback: LayoutSlotData = {
		headerLinks: staticNavLinks,
		footerLinks: staticFooterLinks,
		mobileLinks: staticMobileLinks,
		menuItems: staticMenuItems,
		errorPage: staticErrorPageContent,
	};

	const slots: LayoutSlotData = {
		headerLinks: serverData.headerLinks ?? slotFallback.headerLinks,
		// Use length-based fallback for footer + mobile: `??` does not replace an
		// empty array returned by the server (staticAdapter pre-fix returned []).
		// After the regen these server values will be populated, but the fallback
		// guard ensures correct behaviour during any intermediate deploy window.
		footerLinks:
			serverData.footerLinks?.length ? serverData.footerLinks : slotFallback.footerLinks,
		mobileLinks:
			serverData.mobileLinks?.length ? serverData.mobileLinks : slotFallback.mobileLinks,
		menuItems: serverData.menuItems ?? slotFallback.menuItems,
		errorPage: serverData.errorPage ?? slotFallback.errorPage,
	};

	const seo = serverData.seo ?? errorSeoFallback({
			locale,
			siteMeta: STATIC_SITE_META,
			siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
		});
	const themeColor = serverData.themeColor ?? STATIC_SITE_SEO_DEFAULTS.themeColor;
	const morphShapes = serverData.morphShapes ?? FALLBACK_MORPH_SHAPES;

	return { seo, themeColor, morphShapes, ...slots };
};
