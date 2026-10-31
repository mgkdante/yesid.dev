import type { Locale, LocalizedString, PageSeo, SiteMeta, SiteSeoDefaults } from '#lib/types.ts';
import { SITE_HOST } from '#lib/utils/seo-defaults.ts';
import { appendBrandPerLocale } from './compose-page-seo';

const DEFAULT_ERROR_TITLE: LocalizedString = { en: 'Not Found' };

/** The status row's browser tab title, then the code 0 row's, then the default text. */
export function errorTitleBody(
	rowsByStatus: Readonly<Record<number, { browserTitle?: LocalizedString } | undefined>>,
	status?: number,
): LocalizedString {
	return (status === undefined ? undefined : rowsByStatus[status]?.browserTitle)
		?? rowsByStatus[0]?.browserTitle
		?? DEFAULT_ERROR_TITLE;
}

/**
 * /__error — last-resort SEO. noIndex: true (nothing to crawl). Pulls brand
 * suffix from siteMeta and fallback description from siteSeoDefaults.
 */
export function errorSeoFallback(args: {
	locale: Locale;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
	/** Title body from errorTitleBody; the brand name is appended. */
	titleBody?: LocalizedString;
}): PageSeo {
	const { siteMeta, siteSeoDefaults, titleBody = DEFAULT_ERROR_TITLE } = args;
	return {
		title: appendBrandPerLocale(titleBody, siteMeta.name),
		description: siteSeoDefaults.defaultDescription,
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: true,
		// No jsonLd — route is noIndex, no point in structured data.
	};
}
