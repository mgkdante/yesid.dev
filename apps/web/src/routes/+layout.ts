import type { LayoutLoad } from './$types';
import { pathLocale } from '#lib/utils/locale-routing.ts';
import { siteMeta as STATIC_SITE_META } from '#lib/content/site-meta.ts';
import { STATIC_SITE_SEO_DEFAULTS } from '#lib/content/site-seo-defaults.ts';
import { errorSeoFallback } from '#lib/adapters/error-seo-fallback.ts';
import {
	navLinks as staticNavLinks,
	menuItems as staticMenuItems,
	footerLinks as staticFooterLinks,
	errorPageContent as staticErrorPageContent,
} from '#lib/content/nav.ts';
import type { NavLink, ErrorPageContent } from '#lib/navigation/types.ts';
// CSR fallbacks use the same generated shapes as SSR; the handwritten seed is reserved for adapter failures.
import { morphShapes as generatedMorphShapes } from '#lib/content/morph-shapes.ts';
import type { Locale, MorphShape, PageSeo, SiteSeoDefaults } from '#lib/types.ts';

/** Shape of the layout-data slots merged from +layout.server.ts. */
interface LayoutSlotData {
	headerLinks: readonly NavLink[];
	footerLinks: readonly NavLink[];
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

// Forward serialized server data during hydration; this layout's own server output is data, not parent().
export const load: LayoutLoad = async ({ data, url }) => {
	const serverData = (data ?? {}) as LayoutServerSlots;
	// Server-derived locale wins; CSR-only renders (tests) derive from the URL.
	const locale = serverData.locale ?? pathLocale(url.pathname);

	// Static fallback for layout slots — used when +layout.server.ts data is
	// unavailable (e.g., during CSR-only renders in tests).
	const slotFallback: LayoutSlotData = {
		headerLinks: staticNavLinks,
		footerLinks: staticFooterLinks,
		menuItems: staticMenuItems,
		errorPage: staticErrorPageContent,
	};

	const slots: LayoutSlotData = {
		headerLinks: serverData.headerLinks ?? slotFallback.headerLinks,
		// Use length-based fallback for footer: `??` does not replace an
		// empty array, and +layout.server.ts's guarded slots return [] when a
		// read fails (footer has no server-side fallback arg). The
		// length check keeps nav rendering from the static fallback in that
		// case. (Historical trigger: a pre-fix staticAdapter returned [] for
		// this slot during a deploy window.)
		footerLinks:
			serverData.footerLinks?.length ? serverData.footerLinks : slotFallback.footerLinks,
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
