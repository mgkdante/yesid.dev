// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';

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
//   - a `static/og/default.{locale}.png` asset to be needed. The generator
//     script was deleted in slice-27.1 (restore from a5f28f2^ at French
//     launch); until then the asset is produced manually and committed.
export const PUBLISHED_LOCALES: readonly Locale[] = ['en'];

// Re-exported from $lib/utils/locale so there's exactly one DEFAULT_LOCALE
// in the codebase. Consumers of seo-defaults get it without a second import.
export { DEFAULT_LOCALE };

/**
 * Returns the default OG image path for a given locale.
 *
 * For published locales, returns `/og/default.{locale}.png` — a manually
 * produced, committed asset under `static/og/` (the generate-og-default
 * script was deleted in slice-27.1; restorable from a5f28f2^ when a new
 * locale launches). For unpublished locales, falls back to the EN default
 * so `og:image` meta always resolves to a real file.
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
