// Layout server load — fetches nav slots for all 4 placement positions plus
// the generic error page content (status 0 / CMS fallback row).
//
// slice-18i Phase 5 Task 5.2: Nav.svelte and Footer.svelte previously imported
// nav data directly from $lib/content. This server load centralises the fetch
// so components receive NavLink arrays as typed props — no direct $lib/content
// imports remain in layout components after this task.
//
// slice-18i Phase 5 Task 5.4: +error.svelte previously imported errorPageContent
// directly from $lib/content. SvelteKit's error pages have no companion loader,
// so error page copy is pre-fetched here and forwarded via $page.data.errorPage.
// Status 0 maps to the CMS generic-fallback row; the component renders it for
// all status codes (404, 500, etc.) until per-status CMS rows ship.
//
// Failure strategy: each fetch is individually guarded. A failing slot returns
// [] or the static fallback rather than crashing the layout.

import type { LayoutServerLoad } from './$types';
import { adapter } from '$lib/adapters';
import { getPageSeo, getSiteSeoDefaults } from '$lib/repositories/meta';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import { siteMeta as STATIC_SITE_META } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { errorSeoFallback } from '$lib/adapters/route-seo-factories';
import { navLinks as staticNavLinks, menuItems as staticMenuItems, errorPageContent as staticErrorPageContent } from '$lib/content/nav';
import { FALLBACK_MORPH_SHAPES } from '$lib/utils/shapes';
import type { NavLink, ErrorPageContent } from '$lib/content/nav';

// CDN cache-control headers are set centrally in hooks.server.ts via
// response.headers.set (not setHeaders). Setting them here too triggered a
// runtime "header is already set" error on Vercel — the adapter-vercel
// runtime appears to call setHeaders internally for caching, conflicting
// with the manual setHeaders call. Single source of truth: hooks.server.ts.

export const load: LayoutServerLoad = async ({ route, params, locals }) => {
	const routeId = route.id ?? '/__error';
	const locale = DEFAULT_LOCALE;
	const ctx = { pageCache: locals.pageCache };

	const safeByPlacement = async (
		placement: 'header' | 'footer' | 'mobile' | 'menu',
		fallback: readonly NavLink[] = [],
	): Promise<readonly NavLink[]> => {
		try {
			return await adapter.nav.byPlacement(placement, ctx);
		} catch {
			return fallback;
		}
	};

	const safeErrorPage = async (): Promise<ErrorPageContent> => {
		if (routeId !== '/__error') {
			return staticErrorPageContent;
		}
		try {
			return await adapter.content.errorPage(0, ctx);
		} catch {
			return staticErrorPageContent;
		}
	};

	const safeSeo = async () => {
		try {
			const [seo, siteSeoDefaults] = await Promise.all([
				getPageSeo(routeId, locale, params as Record<string, string>, ctx),
				getSiteSeoDefaults(ctx),
			]);
			return { seo, themeColor: siteSeoDefaults.themeColor };
		} catch (err) {
			if (import.meta.env.DEV) {
				console.warn(`[+layout.server.ts] Falling back to error SEO for route "${routeId}":`, err);
			}
			return {
				seo: errorSeoFallback({
					locale,
					siteMeta: STATIC_SITE_META,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				}),
				themeColor: STATIC_SITE_SEO_DEFAULTS.themeColor,
			};
		}
	};

	const safeMorphShapes = async () => {
		try {
			return await adapter.content.morphShapes(ctx);
		} catch {
			return FALLBACK_MORPH_SHAPES;
		}
	};

	const [headerLinks, footerLinks, mobileLinks, menuItems, errorPage, seoData, morphShapes] = await Promise.all([
		safeByPlacement('header', staticNavLinks),
		safeByPlacement('footer'),
		safeByPlacement('mobile'),
		safeByPlacement('menu', staticMenuItems),
		safeErrorPage(),
		safeSeo(),
		safeMorphShapes(),
	]);

	return { headerLinks, footerLinks, mobileLinks, menuItems, errorPage, morphShapes, ...seoData };
};
