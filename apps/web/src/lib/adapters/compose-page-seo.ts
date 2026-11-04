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

function fitTitle(text: string, limit: number): string {
	if (text.length <= limit) return text;
	const clipped = text.slice(0, limit - 1).replace(/[\uD800-\uDBFF]$/u, '');
	const boundary = clipped.lastIndexOf(' ');
	const words = boundary > 0 ? clipped.slice(0, boundary) : clipped;
	return `${words.replace(/[\s,;:·–\u2014-]+$/u, '')}…`;
}

/** Keep the brand suffix intact; prefer a fitting fallback before shortening editorial copy. */
export function titleForSeo(primary: string | undefined, fallback: string, brand: string): string {
	const suffix = ` | ${brand}`;
	const preferred = primary?.trim() || fallback.trim();
	if (preferred.length + suffix.length <= 70) return `${preferred}${suffix}`;
	const fallbackBody = fallback.trim();
	if (fallbackBody.length + suffix.length <= 70) return `${fallbackBody}${suffix}`;
	return `${fitTitle(preferred, 70 - suffix.length)}${suffix}`;
}

export function appendBrandPerLocale(body: LocalizedString, brand: string): LocalizedString {
	return {
		en: titleForSeo(undefined, body.en, brand),
		...(body.fr && { fr: titleForSeo(undefined, body.fr, brand) }),
		...(body.es && { es: titleForSeo(undefined, body.es, brand) }),
	};
}

/** One image description format, including titles already branded by the home or title composer. */
export function shareImageAlt(title: string, brand: string): string {
	let body = title;
	for (const separator of [' | ', ' · ', ' \u2014 ']) {
		if (body.startsWith(`${brand}${separator}`)) body = body.slice(brand.length + separator.length);
	}
	const suffix = ` | ${brand}`;
	if (body.endsWith(suffix)) body = body.slice(0, -suffix.length);
	return `${body}${suffix}`;
}

export function shareImageAltPerLocale(body: LocalizedString, brand: string): LocalizedString {
	return {
		en: shareImageAlt(body.en, brand),
		...(body.fr && { fr: shareImageAlt(body.fr, brand) }),
		...(body.es && { es: shareImageAlt(body.es, brand) }),
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
 * Pure — no I/O. The composer is called from `resolvePageSeo()`
 * with the static site shapes already in hand.
 */
export function composePageSeo(args: ComposePageSeoArgs): PageSeo {
	const { routeId, locale, siteMeta, siteSeoDefaults, routeOverride, codeDefaults } = args;

	// Title body comes from CMS override if present, else code-side fallback.
	const titleBody: LocalizedString = (routeOverride?.title ?? codeDefaults.fallbackTitle) as LocalizedString;

	// Apply composedTitleStrategy. 'verbatim' (home) preserves its authored format;
	// 'append-brand' (everything else) appends ` | ${siteMeta.name}` per locale.
	const title: LocalizedString =
		codeDefaults.composedTitleStrategy === 'verbatim'
			? {
				en: fitTitle(titleBody.en, 70),
				...(titleBody.fr && { fr: fitTitle(titleBody.fr, 70) }),
				...(titleBody.es && { es: fitTitle(titleBody.es, 70) }),
			}
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
			alt: shareImageAltPerLocale(titleBody, siteMeta.name),
			width: 1200,
			height: 630,
		};
	}

	return seo;
}
