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
import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';
import { isRegistryExempt } from '$lib/utils/page-registry';

/** Locales that may appear as a URL path prefix. EN is never prefixed.
 *  Add 'es' here (plus src/params/locale.ts coverage) when Spanish routing opens. */
export const PREFIX_LOCALES: readonly Locale[] = ['fr'];

const PREFIX_SET: ReadonlySet<string> = new Set(PREFIX_LOCALES);

/** The optional-param segment as it appears in SvelteKit route ids. */
const LOCALE_SEGMENT = '/[[lang=locale]]';

function prefixOf(pathname: string): Locale | null {
	const seg = pathname.split('/')[1] ?? '';
	return PREFIX_SET.has(seg) ? (seg as Locale) : null;
}

/** Locale encoded in a pathname ('/fr/about' → 'fr'), else DEFAULT_LOCALE. */
export function pathLocale(pathname: string): Locale {
	return prefixOf(pathname) ?? DEFAULT_LOCALE;
}

/** '/fr/about' → '/about'; '/fr' → '/'; locale-less paths pass through. */
export function delocalizePath(pathname: string): string {
	if (pathname === '') return '/';
	const p = prefixOf(pathname);
	if (!p) return pathname;
	const rest = pathname.slice(p.length + 1);
	return rest === '' || rest === '/' ? '/' : rest;
}

/**
 * Localize an internal page href for a target locale. Idempotent (strips any
 * existing prefix first). External URLs, anchors, mailto/tel, and endpoint
 * surfaces (og/, api/, sitemap.xml, robots.txt, /work — same exemption set as
 * the registry gate) pass through untouched.
 */
export function localizeHref(href: string, locale: Locale): string {
	if (!href.startsWith('/') || href.startsWith('//')) return href;
	if (isRegistryExempt(href)) return href;
	const base = delocalizePath(href);
	if (locale === DEFAULT_LOCALE || !PREFIX_SET.has(locale)) return base;
	return base === '/' ? `/${locale}` : `/${locale}${base}`;
}

/**
 * Localize a full URL for a target locale, PRESERVING its query string and hash.
 * The language switcher uses this (not localizeHref) so in-progress URL state —
 * filters (?service=…), the engine inbound seed, ?station=… — survives an
 * EN⇄FR(⇄ES) switch instead of being silently dropped. Path handling (prefix
 * strip/re-add, exemptions, idempotency) is delegated to localizeHref.
 */
export function localizeUrl(url: URL, locale: Locale): string {
	// While prerendering there is no request query/hash to preserve — kit
	// forbids reading url.search at build (the query string is not part of the
	// prerendered representation). The switcher href self-corrects on
	// hydration, where the real URL (with any ?state) is available.
	if (building) return localizeHref(url.pathname, locale);
	return localizeHref(url.pathname, locale) + url.search + url.hash;
}

/**
 * True when navigating from→to is a LOCALE SWITCH: the same canonical page in a
 * different locale (e.g. /about → /fr/about). The language switcher produces
 * exactly these; the locale-handoff uses it to gate snapshot/restore so a normal
 * navigation (to a different page) never triggers a state restore.
 */
export function isLocaleSwitch(fromPathname: string, toPathname: string): boolean {
	return (
		delocalizePath(fromPathname) === delocalizePath(toPathname) &&
		pathLocale(fromPathname) !== pathLocale(toPathname)
	);
}

/** '/[[lang=locale]]/about' → '/about' — route ids stay keyed by their
 *  canonical (unprefixed) form everywhere (route-seo registries, getPageSeo). */
export function stripLocaleSegment(routeId: string): string {
	if (routeId === LOCALE_SEGMENT) return '/';
	if (routeId.startsWith(`${LOCALE_SEGMENT}/`)) return routeId.slice(LOCALE_SEGMENT.length);
	return routeId;
}

/** Resolve the request locale: params.lang first; pathname fallback for error
 *  renders (route.id null ⇒ empty params); DEFAULT_LOCALE last. */
export function localeFromParams(
	params: Partial<Record<string, string>>,
	pathname?: string,
): Locale {
	const lang = params?.lang;
	if (lang && PREFIX_SET.has(lang)) return lang as Locale;
	return pathname ? pathLocale(pathname) : DEFAULT_LOCALE;
}
