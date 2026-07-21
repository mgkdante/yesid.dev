import type { Locale, PageSeo, SiteMeta, SiteSeoDefaults } from '$lib/types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

/**
 * /__error — last-resort SEO. noIndex: true (nothing to crawl). Pulls brand
 * suffix from siteMeta and fallback description from siteSeoDefaults.
 */
export function errorSeoFallback(args: {
	locale: Locale;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
}): PageSeo {
	const { siteMeta, siteSeoDefaults } = args;
	return {
		title: { en: `Not Found | ${siteMeta.name}` },
		description: siteSeoDefaults.defaultDescription,
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: true,
		// No jsonLd — route is noIndex, no point in structured data.
	};
}
