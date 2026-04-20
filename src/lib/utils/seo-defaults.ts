// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import type { Locale } from '$lib/types';

// Production canonical host. No trailing slash. Upgrade to an env var when
// a staging domain is introduced (currently yesid.dev is the only target).
export const SITE_HOST = 'https://yesid.dev';

// 1200x630 branded default shipped as static asset, per-locale.
// Pages without an explicit ogImage fall back to `defaultOgImageFor(locale)`.
// The legacy `DEFAULT_OG_IMAGE` const is kept as an EN alias for direct
// consumers; new code should prefer the locale-aware helper.
export const DEFAULT_OG_IMAGE = '/og/default.en.png';

// Brand wordmark. Not localised — "yesid." is the brand in all languages.
export const SITE_NAME = 'yesid.';

// Locales that currently have translated content AND published URL coverage.
// Adding a locale here causes:
//   - og:locale:alternate meta to emit for this locale
//   - hreflang link tags to include this locale
//   - sitemap to iterate routes × this locale
//   - canonicalFor to need a URL scheme (TODO when first non-EN locale ships)
//   - `bun run og:default` to emit `static/og/default.{locale}.png` if
//     siteMeta.tagline.{locale} is filled in
export const PUBLISHED_LOCALES: readonly Locale[] = ['en'];

// Default locale for the site. Kept in sync with $lib/utils/locale.ts#DEFAULT_LOCALE.
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Returns the default OG image path for a given locale.
 *
 * For published locales, returns `/og/default.{locale}.png` — the generator
 * script (scripts/generate-og-default.ts) emits one image per published
 * locale with a siteMeta.tagline translation. For unpublished locales, falls
 * back to the EN default so `og:image` meta always resolves to a real file.
 */
export function defaultOgImageFor(locale: Locale): string {
	if (PUBLISHED_LOCALES.includes(locale)) return `/og/default.${locale}.png`;
	return DEFAULT_OG_IMAGE;
}

/**
 * Returns the canonical absolute URL for a route in a given locale.
 *
 * 15a: EN-only today. When FR/ES launch, the slice that introduces them picks
 * a URL scheme (subdomain, path prefix, or accept-language negotiation) and
 * updates this helper in one place.
 *
 * Trailing slashes are stripped so "/about/" and "/about" produce the same URL.
 */
export function canonicalFor(pathname: string, _locale: Locale): string {
	const trimmed = pathname.replace(/\/+$/, '');
	if (trimmed === '' || trimmed === '/') return SITE_HOST;
	return `${SITE_HOST}${trimmed}`;
}
