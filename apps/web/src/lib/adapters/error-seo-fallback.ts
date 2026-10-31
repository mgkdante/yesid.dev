import type { Locale, LocalizedString, PageSeo, SiteMeta, SiteSeoDefaults } from '#lib/types.ts';
import { SITE_HOST } from '#lib/utils/seo-defaults.ts';
import { appendBrandPerLocale } from './compose-page-seo';

/**
 * /__error — last-resort SEO. noIndex: true (nothing to crawl). Pulls brand
 * suffix from siteMeta and fallback description from siteSeoDefaults.
 */
export function errorSeoFallback(args: {
	locale: Locale;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
	/** Title body from the generic error row; the brand name is appended. */
	titleBody?: LocalizedString;
}): PageSeo {
	const { siteMeta, siteSeoDefaults, titleBody = { en: 'Not Found' } } = args;
	return {
		title: appendBrandPerLocale(titleBody, siteMeta.name),
		description: siteSeoDefaults.defaultDescription,
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: true,
		// No jsonLd — route is noIndex, no point in structured data.
	};
}
