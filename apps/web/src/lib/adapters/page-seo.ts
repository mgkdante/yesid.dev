// SEO policy stays here; generated content comes from the catalog.
import { catalog, type ContentCatalog } from '#lib/catalog/index.ts';
import { ownerPhone as generatedOwnerPhone } from '#lib/content/site-owner-phone.server.ts';
import type { Locale } from '#lib/types.ts';
import { PageSeoSchema, type PageSeo } from '#lib/schemas/seo.ts';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import { errorSeoFallback } from './error-seo-fallback';
import { routeSeoFactories } from './route-seo-factories';
import { composePageSeo } from './compose-page-seo';

export async function resolvePageSeo(
	routeId: string,
	locale: Locale,
	params: Record<string, string> = {},
	options: { catalog?: ContentCatalog; ownerPhone?: string } = {},
): Promise<PageSeo> {
	const content = options.catalog ?? catalog;
	const siteMeta = content.meta.site();
	const siteSeoDefaults = content.meta.siteSeoDefaults();
	const dynamicFactory = routeSeoFactories[routeId];
	if (dynamicFactory) return PageSeoSchema.parse(await dynamicFactory({ params, locale, catalog: content, siteMeta, siteSeoDefaults }));
	if (routeId === '/__error') return PageSeoSchema.parse(errorSeoFallback({
		locale, siteMeta, siteSeoDefaults, titleBody: content.content.errorPage().browserTitle,
	}));
	const codeDefaults = codeRouteSeoDefaults[routeId];
	if (!codeDefaults) throw new Error(`[page-seo] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts.`);
	// Keep the owner phone confined to JSON-LD for static routes, as before.
	const phone = options.ownerPhone ?? generatedOwnerPhone;
	const jsonLdSiteMeta = phone ? { ...siteMeta, owner: { ...siteMeta.owner, phone } } : siteMeta;
	return PageSeoSchema.parse(composePageSeo({
		routeId, locale, siteMeta: jsonLdSiteMeta, siteSeoDefaults, codeDefaults,
		routeOverride: content.meta.routeOverrides().find((entry) => entry.path === routeId),
	}));
}
