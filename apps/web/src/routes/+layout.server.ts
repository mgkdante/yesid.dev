// Layout server load — resolves nav slots for all 4 placement positions plus
// the generic error page content (status 0 fallback row). All adapter reads
// resolve from the build-time static content layer (post-27.2) — "CMS" rows
// below are CMS-authored content exported at build, not live calls.
//
// slice-18i Phase 5 Task 5.2: Nav.svelte and Footer.svelte previously imported
// nav data directly from $lib/content. This server load centralises the read
// so components receive NavLink arrays as typed props — no direct $lib/content
// imports remain in layout components after this task.
//
// slice-18i Phase 5 Task 5.4: +error.svelte previously imported errorPageContent
// directly from $lib/content. SvelteKit's error pages have no companion loader,
// so error page copy is pre-resolved here and forwarded via $page.data.errorPage.
// Status 0 maps to the generic-fallback row; the component renders it for
// all status codes (404, 500, etc.) until per-status rows ship.
//
// Failure strategy: each read is individually guarded. A failing slot returns
// [] or the static fallback rather than crashing the layout.
//
// slice-26.1 (content controls): this load is ALSO the single route-gating
// point for the site_pages registry. Before any data resolution, the request
// path is resolved against $lib/content/site-pages (published rows only —
// exact match, else longest listing prefix). No entry → the section was
// archived in the CMS (or never existed) → 404. Non-page surfaces (/og/,
// /sitemap.xml, /robots.txt, /work, /api/) never run this load (+server.ts
// endpoints skip layout loads) and are additionally exempt inside the helper.

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isPathPublished } from '$lib/utils/page-registry';
import { adapter } from '$lib/adapters';
import { getPageSeo, getSiteSeoDefaults } from '$lib/repositories/meta';
import { localeFromParams, stripLocaleSegment, delocalizePath } from '$lib/utils/locale-routing';
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

export const load: LayoutServerLoad = async ({ route, params, locals, url }) => {
	// Route ids stay keyed by their canonical (unprefixed) form everywhere
	// downstream — route-seo registries, getPageSeo, the composer (slice-28.6).
	const routeId = stripLocaleSegment(route.id ?? '/__error');

	// Registry route-gate (slice-26.1). Only gate real page routes: a null
	// route.id means SvelteKit is already rendering the error page for an
	// unmatched path — gating there would just re-throw inside the error
	// render. Archived/unknown sections 404 before any content resolution.
	// Registry paths are locale-less, so the gate compares the delocalized
	// pathname ('/fr/about' gates as '/about').
	if (route.id !== null && !isPathPublished(delocalizePath(url.pathname))) {
		error(404, { message: 'Not found' });
	}
	// slice-28.6: locale from params.lang (page routes) with a pathname
	// fallback (error renders carry no params).
	const locale = localeFromParams(params as Record<string, string>, url.pathname);
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
			// CMS-generated shapes via the adapter port ($lib/content/morph-shapes
			// since slice-28.5 #120).
			return await adapter.content.morphShapes(ctx);
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
