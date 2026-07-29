// Locale routing helpers — slice-28.6 (/fr path-prefix scheme).
//
// TWO LEVERS, deliberately separate:
//   PREFIX_LOCALES (here)      = which locales RESOLVE as URL prefixes. Routing-level.
//   PUBLISHED_LOCALES (seo-defaults.ts) = which locales are ANNOUNCED to crawlers
//     (hreflang, sitemap variants, FR canonicals, the locale switcher).
// /fr works as soon as 'fr' is in PREFIX_LOCALES, but self-canonicalizes to the
// EN URL until 'fr' joins PUBLISHED_LOCALES — so FR can be QA'd live, unindexed,
// and the launch is a one-line flip.

import { building } from '$app/environment';
import { createLocaleRouting } from '@yesid/i18n-core';
import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';
import { isRegistryExempt } from '$lib/utils/page-registry';

/** Locales that may appear as a URL path prefix. EN is never prefixed.
 *  L1: 'es' opened 2026-07-09 (dark-QA state: /es resolves + prerenders but
 *  self-canonicalizes to EN and stays out of sitemap/hreflang/switcher until
 *  'es' joins PUBLISHED_LOCALES). */
export const PREFIX_LOCALES: readonly Locale[] = ['fr', 'es'];

/** The optional-param segment as it appears in SvelteKit route ids. */
const LOCALE_SEGMENT = '/[[lang=locale]]';

const routing = createLocaleRouting<Locale>({
	defaultLocale: DEFAULT_LOCALE,
	prefixLocales: PREFIX_LOCALES,
	isPathExempt: isRegistryExempt,
	localeSegment: LOCALE_SEGMENT,
	preserveSearchAndHash: !building,
});

export const pathLocale = routing.pathLocale;
export const delocalizePath = routing.delocalizePath;
export const localizeHref = routing.localizeHref;
export const localizeUrl: (url: URL, locale: Locale) => string = routing.localizeUrl;
export const isLocaleSwitch = routing.isLocaleSwitch;
export const stripLocaleSegment = routing.stripLocaleSegment;
export const isPrefixLocale = routing.isPrefixLocale;

/** Resolve the request locale: params.lang first; pathname fallback for error
 *  renders (route.id null ⇒ empty params); DEFAULT_LOCALE last. */
export function localeFromParams(
	params: Partial<Record<string, string>>,
	pathname?: string,
): Locale {
	const lang = params?.lang;
	if (lang && isPrefixLocale(lang)) return lang;
	return pathname ? pathLocale(pathname) : DEFAULT_LOCALE;
}
