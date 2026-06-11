// Pure composer — slice-18 18h Phase 4 Task 11.
//
// Given CMS data (siteMeta + siteSeoDefaults + optional routeOverride) and
// code-side defaults (ogType, noIndex, jsonLd factory, fallbackTitle), produce
// a `PageSeo`. Used by `staticAdapter.meta.forRoute()` for STATIC routes only;
// dynamic routes go through `route-seo-factories.ts`.
//
// Title strategy (P3 finding 2026-04-27):
//   - 'verbatim'      → home `/` keeps `'yesid. — X'` em-dash brand-first format
//   - 'append-brand'  → other routes append `' | ${siteMeta.name}'` per locale
//
// Description fallback chain:
//   routeOverride.description → siteSeoDefaults.defaultDescription
//
// OG image fallback chain:
//   routeOverride.ogImage UUID → siteSeoDefaults.defaultOgImage UUID → undefined
//   (consumer's <SeoHead> resolves undefined to `/og/default.{locale}.png`).

import type {
	Locale,
	LocalizedString,
	PageSeo,
	RouteSeoOverride,
	SiteMeta,
	SiteSeoDefaults,
} from '$lib/types';
import { SITE_HOST } from '$lib/utils/seo-defaults';
import { asset } from '$lib/directus/assets';
import type { CodeRouteSeoDefaults } from './route-seo-defaults';

export interface ComposePageSeoArgs {
	routeId: string;
	locale: Locale;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
	routeOverride: RouteSeoOverride | undefined;
	codeDefaults: CodeRouteSeoDefaults;
}

/**
 * Compose final PageSeo for a static route.
 *
 * Pure — no I/O. The composer is called from `staticAdapter.meta.forRoute()`
 * with the static site shapes already in hand.
 */
export function composePageSeo(args: ComposePageSeoArgs): PageSeo {
	const { routeId, locale, siteMeta, siteSeoDefaults, routeOverride, codeDefaults } = args;
	void locale;

	// Title body comes from CMS override if present, else code-side fallback.
	const titleBody: LocalizedString = (routeOverride?.title ?? codeDefaults.fallbackTitle) as LocalizedString;

	// Apply composedTitleStrategy. 'verbatim' (home) preserves em-dash format;
	// 'append-brand' (everything else) appends ` | ${siteMeta.name}` per locale.
	const title: LocalizedString =
		codeDefaults.composedTitleStrategy === 'verbatim'
			? titleBody
			: {
					en: `${titleBody.en} | ${siteMeta.name}`,
					...(titleBody.fr && { fr: `${titleBody.fr} | ${siteMeta.name}` }),
					...(titleBody.es && { es: `${titleBody.es} | ${siteMeta.name}` }),
				};

	// Description fallback chain.
	const description: LocalizedString =
		(routeOverride?.description as LocalizedString | undefined) ??
		siteSeoDefaults.defaultDescription;

	// OG image fallback chain. UUID → asset URL with `og-1200` preset (per
	// CONVENTIONS § 9 + P1 finding). When no UUID is available, leave ogImage
	// undefined and let <SeoHead> resolve `defaultOgImageFor(locale)` to the
	// static `/og/default.{locale}.png` fallback.
	const ogImageUuid = routeOverride?.ogImage ?? siteSeoDefaults.defaultOgImage;
	const canonical = `${SITE_HOST}${routeId === '/' ? '' : routeId}`;

	const seo: PageSeo = {
		title,
		description,
		canonical,
		ogType: codeDefaults.ogType,
		noIndex: codeDefaults.noIndex,
		jsonLd: codeDefaults.jsonLdFactory(siteMeta, locale),
	};

	if (ogImageUuid) {
		seo.ogImage = {
			url: asset(ogImageUuid, 'og-1200'),
			alt: { en: `${siteMeta.name} — ${titleBody.en}` },
			width: 1200,
			height: 630,
		};
	}

	return seo;
}
