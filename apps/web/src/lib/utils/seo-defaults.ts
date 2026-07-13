// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';
import { delocalizePath } from '$lib/utils/locale-routing';

// Production canonical host. No trailing slash. Upgrade to an env var when
// a staging domain is introduced (currently yesid.dev is the only target).
export const SITE_HOST = 'https://yesid.dev';

// Public service area. MUST stay byte-identical to the approved GBP listing:
// Montréal only, with the Gatineau legal street address kept private. This
// feeds ProfessionalService `areaServed` and the llms.txt geography line.
export const SERVICE_AREAS = ['Montréal'] as const;

// Public Google Business Profile URL (the Maps place / share link). Unknown
// until the listing is verified + public (Homework #12); once you have it, set
// it here and it joins the ProfessionalService `sameAs` for entity linking.
export const GBP_PROFILE_URL: string | undefined = undefined;

// 1200x630 branded default shipped as static asset, per-locale.
// Pages without an explicit ogImage fall back to `defaultOgImageFor(locale)`.
// The legacy `DEFAULT_OG_IMAGE` const is kept as an EN alias for direct
// consumers; new code should prefer the locale-aware helper.
export const DEFAULT_OG_IMAGE = '/og/default.en.png';

// Brand wordmark. Not localised — "yesid." is the brand in all languages.
export const SITE_NAME = 'yesid.';

// X (Twitter) attribution for shares (homework #14). The operator's personal
// handle for now; swap here when a brand handle exists.
export const TWITTER_HANDLE = '@mgkDante';

// THE FLIP LEVER (slice-28.6) moved to $lib/utils/published-locales so
// bare-bun scripts can read it without locale-routing's `$app/environment`.
// Re-exported here so app code keeps one import site. Flip checklist lives in
// the slice-28.6 runbook (PR body): FR content drop → og/default.{locale}.png
// → flip the const → update the three flip-keyed tests.
import { PUBLISHED_LOCALES } from './published-locales';
export { PUBLISHED_LOCALES };

// Re-exported from $lib/utils/locale so there's exactly one DEFAULT_LOCALE
// in the codebase. Consumers of seo-defaults get it without a second import.
export { DEFAULT_LOCALE };

/**
 * Returns the default OG image path for a given locale.
 *
 * For published locales, returns `/og/default.{locale}.png`, a committed asset
 * under `static/og/` produced by scripts/generate-og-cards.ts. The legacy
 * generate-og-default.ts entry point delegates to that canonical renderer.
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
 * (/og/project, /og/blog), absolute, or query-string URL, so the already
 * locale-aware surfaces pass through untouched. This is the single swap point:
 * both route cards (compose-page-seo) and service cards (route-seo-factories)
 * flow their url through SeoHead, which calls this.
 */
export function localizeOgCard(url: string, locale: Locale): string {
	if (locale === DEFAULT_LOCALE || !PUBLISHED_LOCALES.includes(locale)) return url;
	if (!LOCALIZED_OG_CARDS.has(url)) return url;
	return url.replace(/\.png$/, `.${locale}.png`);
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
