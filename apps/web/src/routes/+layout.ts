import type { LayoutLoad } from './$types';
import { pathLocale } from '$lib/utils/locale-routing';
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
import type { NavLink, ErrorPageContent } from '$lib/navigation/types';
// slice-28.5 (#120): client fallback reads the GENERATED morph-shapes module
// (same source the static adapter serves), not the utils/shapes.ts seed —
// otherwise a CSR-only render would show pre-CMS shapes while SSR shows CMS
// shapes. The seed remains the catch{} fallback in +layout.server.ts only.
import { morphShapes as generatedMorphShapes } from '$lib/content/morph-shapes';
import type { Locale, MorphShape, PageSeo, SiteSeoDefaults } from '$lib/types';

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
	locale?: Locale;
}

// Universal load (runs both SSR + client). It must stay CMS-free: +layout.server.ts
// resolves SEO/nav/error content once, SvelteKit serializes that into __data.json,
// and this load only forwards the server data during hydration.
//
// Locale (slice-28.6): the resolver lives in +layout.server.ts
// (params.lang → pathname fallback). This load forwards the server-derived
// locale; CSR-only renders (tests) derive it from the URL path prefix.
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
export const load: LayoutLoad = async ({ data, url }) => {
	const serverData = (data ?? {}) as LayoutServerSlots;
	// Server-derived locale wins; CSR-only renders (tests) derive from the URL.
	const locale = serverData.locale ?? pathLocale(url.pathname);

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
		// empty array, and +layout.server.ts's guarded slots return [] when a
		// read fails (footer/mobile have no server-side fallback arg). The
		// length check keeps nav rendering from the static fallback in that
		// case. (Historical trigger: a pre-fix staticAdapter returned [] for
		// these slots during a deploy window.)
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
	const morphShapes = serverData.morphShapes ?? generatedMorphShapes;

	return { seo, themeColor, morphShapes, locale, ...slots };
};
