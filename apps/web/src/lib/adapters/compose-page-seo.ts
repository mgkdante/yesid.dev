// Static routes compose SEO from CMS values and code defaults; dynamic routes use route-seo-factories.ts.

import type {
	Locale,
	LocalizedString,
	PageSeo,
	RouteSeoOverride,
	SiteMeta,
	SiteSeoDefaults,
} from '#lib/types.ts';
import { canonicalFor } from '#lib/utils/seo-defaults.ts';
import { asset } from '#lib/directus/assets.ts';
import type { CodeRouteSeoDefaults } from './route-seo-defaults';

export function appendBrandPerLocale(body: LocalizedString, brand: string): LocalizedString {
	return {
		en: `${body.en} | ${brand}`,
		...(body.fr && { fr: `${body.fr} | ${brand}` }),
		...(body.es && { es: `${body.es} | ${brand}` }),
	};
}

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

	// Title body comes from CMS override if present, else code-side fallback.
	const titleBody: LocalizedString = (routeOverride?.title ?? codeDefaults.fallbackTitle) as LocalizedString;

	// Apply composedTitleStrategy. 'verbatim' (home) preserves em-dash format;
	// 'append-brand' (everything else) appends ` | ${siteMeta.name}` per locale.
	const title: LocalizedString =
		codeDefaults.composedTitleStrategy === 'verbatim'
			? titleBody
			: appendBrandPerLocale(titleBody, siteMeta.name);

	// Description fallback chain.
	const description: LocalizedString =
		(routeOverride?.description as LocalizedString | undefined) ??
		siteSeoDefaults.defaultDescription;
	const seoCopy = { titleBody, description };

	// OG image fallback chain. UUID → asset URL with `og-1200` preset (per
	// CONVENTIONS § 9 + P1 finding). When no UUID is available, leave ogImage
	// undefined and let <SeoHead> resolve `defaultOgImageFor(locale)` to the
	// static `/og/default.{locale}.png` fallback.
	const ogImageUuid = routeOverride?.ogImage ?? siteSeoDefaults.defaultOgImage;

	const canonical = canonicalFor(routeId === '/' ? '/' : routeId, locale);

	const seo: PageSeo = {
		title,
		description,
		canonical,
		ogType: codeDefaults.ogType,
		noIndex: codeDefaults.noIndex,
		jsonLd: codeDefaults.jsonLdFactory(siteMeta, locale, seoCopy),
	};

	if (ogImageUuid) {
		seo.ogImage = {
			url: asset(ogImageUuid, 'og-1200'),
			alt: {
				en: `${siteMeta.name} — ${titleBody.en}`,
				...(titleBody.fr && { fr: `${siteMeta.name} — ${titleBody.fr}` }),
				...(titleBody.es && { es: `${siteMeta.name} — ${titleBody.es}` }),
			},
			width: 1200,
			height: 630,
		};
	}

	return seo;
}
