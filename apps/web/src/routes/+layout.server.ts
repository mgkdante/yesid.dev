// Gate published page routes, then resolve layout data with per-port fallbacks.

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// consolidation-deploy-honesty: the site is 100% build-time content, so every
// page prerenders to static HTML at build. Each route exports explicit entries
// (every published locale + content slugs) via $lib/server/prerender-entries. Endpoint
// routes (+server.ts: og/, api/, sitemap.xml, robots.txt, /work, service
// redirects) opt out individually — they stay on the lambda.
export const prerender = true;
import { isPathPublished } from '#lib/utils/page-registry.ts';
import { adapter } from '#lib/adapters/index.ts';
import { localeFromParams, stripLocaleSegment, delocalizePath } from '#lib/utils/locale-routing.ts';
import { siteMeta as STATIC_SITE_META } from '#lib/content/site-meta.ts';
import { STATIC_SITE_SEO_DEFAULTS } from '#lib/content/site-seo-defaults.ts';
import { errorSeoFallback } from '#lib/adapters/error-seo-fallback.ts';
import { navLinks as staticNavLinks, menuItems as staticMenuItems, errorPageContent as staticErrorPageContent } from '#lib/content/nav.ts';
import { FALLBACK_MORPH_SHAPES } from '#lib/utils/shapes.ts';
import type { NavLink, ErrorPageContent } from '#lib/navigation/types.ts';

// CDN cache-control headers are set centrally in hooks.server.ts via
// response.headers.set (not setHeaders). Setting them here too triggered a
// runtime "header is already set" error on Vercel — the adapter-vercel
// runtime appears to call setHeaders internally for caching, conflicting
// with the manual setHeaders call. Single source of truth: hooks.server.ts.

export const load: LayoutServerLoad = async ({ route, params, url }) => {

	const routeId = stripLocaleSegment(route.id ?? '/__error');

	// Skip registry gating for unmatched-route error renders to avoid throwing again during error handling.
	if (route.id !== null && !isPathPublished(delocalizePath(url.pathname))) {
		error(404, 'Not found');
	}

	const locale = localeFromParams(params as Record<string, string>, url.pathname);
	const safeByPlacement = async (
		placement: 'header' | 'footer' | 'mobile' | 'menu',
		fallback: readonly NavLink[] = [],
	): Promise<readonly NavLink[]> => {
		try {
			return await adapter.nav.byPlacement(placement);
		} catch {
			return fallback;
		}
	};

	const safeErrorPage = async (): Promise<ErrorPageContent> => {
		if (routeId !== '/__error') {
			return staticErrorPageContent;
		}
		try {
			return await adapter.content.errorPage(0);
		} catch {
			return staticErrorPageContent;
		}
	};

	const safeSeo = async () => {
		try {
			const [seo, siteSeoDefaults] = await Promise.all([
				adapter.meta.forRoute(routeId, locale, params as Record<string, string>),
				adapter.meta.siteSeoDefaults(),
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
					titleBody: staticErrorPageContent.browserTitle,
				}),
				themeColor: STATIC_SITE_SEO_DEFAULTS.themeColor,
			};
		}
	};

	const safeMorphShapes = async () => {
		try {

			return await adapter.content.morphShapes();
		} catch {
			// Last-resort hand-written seed — see the FALLBACK SEED banner in
			// utils/shapes.ts.
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

	return { headerLinks, footerLinks, mobileLinks, menuItems, errorPage, morphShapes, locale, ...seoData };
};
