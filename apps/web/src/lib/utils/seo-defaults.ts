// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';
import { delocalizePath } from '$lib/utils/locale-routing';

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
// THE FLIP LEVER (slice-28.6): adding a locale here causes:
//   - og:locale:alternate meta to emit for this locale
//   - hreflang link tags to include this locale
//   - sitemap to iterate routes × this locale
//   - canonicalFor to emit /{locale}-prefixed canonicals (scheme DONE — /fr
//     path prefix per slice-28.6; routing opens separately via PREFIX_LOCALES
//     in $lib/utils/locale-routing)
//   - the EN|FR locale switcher (MenuOverlay/Footer) to become visible
//   - a `static/og/default.{locale}.png` asset to be needed (generator script
//     restored in slice-28.6: apps/web/scripts/generate-og-default.ts)
// Flip checklist lives in the slice-28.6 runbook (PR body): FR content drop →
// og/default.fr.png → flip this const → update the three flip-keyed tests.
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
 * Canonical absolute URL for a route in a locale. /fr path-prefix scheme
 * (slice-28.6): EN unprefixed; published non-EN locales get /{locale}; an
 * UNPUBLISHED prefix locale self-canonicalizes to the EN URL so /fr can be
 * QA'd live pre-flip without index pollution. Idempotent on prefixed input;
 * trailing slashes stripped.
 */
export function canonicalFor(pathname: string, locale: Locale): string {
	const trimmed = pathname.replace(/\/+$/, '');
	const base = delocalizePath(trimmed === '' ? '/' : trimmed);
	const effective =
		locale !== DEFAULT_LOCALE && PUBLISHED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
	const prefix = effective === DEFAULT_LOCALE ? '' : `/${effective}`;
	return `${SITE_HOST}${prefix}${base === '/' ? '' : base}`;
}
