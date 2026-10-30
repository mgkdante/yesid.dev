// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import { building } from '$app/env';
import type { SeoHeadProps } from '@yesid/ui/head';
import type { PageSeo } from '#lib/schemas/seo.ts';
import type { Locale } from '#lib/types.ts';
import { DEFAULT_LOCALE, resolveLocale } from '#lib/utils/locale.ts';
import { delocalizePath, localizeHref, localizeUrl } from '#lib/utils/locale-routing.ts';

// Production canonical host. No trailing slash. Upgrade to an env var when
// a staging domain is introduced (currently yesid.dev is the only target).
export const SITE_HOST = 'https://yesid.dev';

// Public service area. MUST stay byte-identical to the approved GBP listing:
// Montréal only, with the Gatineau legal street address kept private. This
// feeds ProfessionalService `areaServed` and the llms.txt geography line.
export const SERVICE_AREAS = ['Montréal'] as const;

// Set the Google Business Profile URL only after the listing is verified and public.
export const GBP_PROFILE_URL: string | undefined = undefined;

// 1200x630 branded default shipped as static asset, per-locale.
// Pages without an explicit ogImage fall back to `defaultOgImageFor(locale)`.
// The legacy `DEFAULT_OG_IMAGE` const is kept as an EN alias for direct
// consumers; new code should prefer the locale-aware helper.
export const DEFAULT_OG_IMAGE = '/og/default.en.png';

// Brand wordmark. Not localised — "yesid." is the brand in all languages.
export const SITE_NAME = 'yesid.';

export const TWITTER_HANDLE = '@mgkDante';

import { PUBLISHED_LOCALES } from './published-locales';
export { PUBLISHED_LOCALES };

// Re-exported from $lib/utils/locale so there's exactly one DEFAULT_LOCALE
// in the codebase. Consumers of seo-defaults get it without a second import.
export { DEFAULT_LOCALE };

/**
 * Returns the default OG image path for a given locale.
 *
 * For published locales, returns `/og/default.{locale}.png`, a committed asset
 * under `static/og/` produced by scripts/generate-og-cards.ts.
 * For unpublished locales, falls back to the EN default so `og:image` always
 * resolves to a real file.
 */
export function defaultOgImageFor(locale: Locale): string {
	if (PUBLISHED_LOCALES.includes(locale)) return `/og/default.${locale}.png`;
	return DEFAULT_OG_IMAGE;
}

/**
 * The committed OG share cards under /og/routes/ and /og/services/ that ship a
 * per-locale sibling (X.fr.png, X.es.png) beside the EN base (X.png), minted by
 * scripts/generate-og-cards.ts. Set-gated so a base path without minted variants
 * transparently stays on EN. Never add a path here before both its fr AND es
 * files land in static/og/, or the swap would point at a 404.
 */
const LOCALIZED_OG_CARDS: ReadonlySet<string> = new Set([
	'/og/routes/about.png',
	'/og/routes/contact.png',
	'/og/routes/projects.png',
	'/og/routes/services.png',
	'/og/services/database-engineering.png',
	'/og/services/data-pipeline.png',
	'/og/services/analytics-reporting.png',
	'/og/services/web-development.png',
]);

/**
 * Swap a static EN OG card for its per-locale sibling. Returns the URL unchanged
 * for EN, unpublished locales, cards without a minted variant, and any dynamic
 * (/og/project, /og/blog), absolute, or query-string URL. Project and blog
 * prerenders are already path-localized, so they pass through untouched.
 * This is the single swap point:
 * both route cards (compose-page-seo) and service cards (route-seo-factories)
 * flow their url through SeoHead, which calls this.
 */
export function localizeOgCard(url: string, locale: Locale): string {
	if (locale === DEFAULT_LOCALE || !PUBLISHED_LOCALES.includes(locale)) return url;
	if (!LOCALIZED_OG_CARDS.has(url)) return url;
	return url.replace(/\.png$/, `.${locale}.png`);
}

/* Unpublished prefix locales canonicalize to English; published locales get their own prefixed canonical. */
export function canonicalFor(pathname: string, locale: Locale): string {
	const trimmed = pathname.replace(/\/+$/, '');
	const base = delocalizePath(trimmed === '' ? '/' : trimmed);
	const effective =
		locale !== DEFAULT_LOCALE && PUBLISHED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
	const prefix = effective === DEFAULT_LOCALE ? '' : `/${effective}`;
	return `${SITE_HOST}${prefix}${base === '/' ? '' : base}`;
}

/** The current page in `target` for the language switch: the page's exact translated alternate when it
 *  has alternates (the blog index when that translation is missing), else the same path. Keeps query and hash. */
export function languageHref(url: URL, target: Locale, alternates?: Partial<Record<Locale, string>>): string {
	if (!alternates) return localizeUrl(url, target);
	const suffix = building ? '' : url.search + url.hash;
	const exact = alternates[target];
	if (!exact) return localizeHref('/blog', target) + suffix;
	const href = new URL(exact, url.origin);
	return (href.origin === new URL(SITE_HOST).origin ? href.pathname : href.href) + suffix;
}

/** The page head for one locale: the resolution the old SeoHead component did. */
export function seoHeadProps(seo: PageSeo, locale: Locale, themeColor?: string): SeoHeadProps {
	const title = resolveLocale(seo.title, locale);
	const image = seo.ogImage ? localizeOgCard(seo.ogImage.url, locale) : defaultOgImageFor(locale);
	const path = seo.canonical.replace(SITE_HOST, '') || '/';
	const locales = seo.localeAlternates
		? PUBLISHED_LOCALES.filter((l) => Boolean(seo.localeAlternates?.[l]))
		: PUBLISHED_LOCALES;
	const xDefault = seo.localeAlternates ? seo.localeAlternates.en : canonicalFor(path, 'en');
	return {
		title,
		description: resolveLocale(seo.description, locale),
		siteName: SITE_NAME,
		canonical: seo.canonical,
		alternates: seo.singleLocale
			? []
			: [
					...locales.map((l) => ({ hreflang: l, href: seo.localeAlternates?.[l] ?? canonicalFor(path, l) })),
					...(xDefault ? [{ hreflang: 'x-default', href: xDefault }] : []),
				],
		ogLocale: `${locale}_CA`,
		ogLocaleAlternates: locales.filter((l) => l !== locale).map((l) => `${l}_CA`),
		image: {
			url: image.startsWith('http') ? image : `${SITE_HOST}${image}`,
			alt: seo.ogImage ? resolveLocale(seo.ogImage.alt, locale) : `${SITE_NAME} · ${title}`,
			width: seo.ogImage?.width,
			height: seo.ogImage?.height,
		},
		type: seo.ogType,
		noIndex: seo.noIndex,
		twitter: { site: TWITTER_HANDLE, creator: TWITTER_HANDLE },
		themeColor,
		jsonLd: seo.jsonLd,
	};
}
