// Site-meta repository. Slice 15b deleted the Slice-12 `getPersonSchema`
// wrapper — JSON-LD is now emitted via the adapters/jsonld factories + the
// <JsonLd> component; the repository no longer participates in that flow.

import { adapter } from '$lib/adapters';
import type { Locale, PageSeo, PreviewContext, SiteSeoDefaults } from '$lib/types';

// getSiteMeta — pruned in slice-28.3 (#117, zero consumers). The underlying
// adapter.meta.site port stays for the slice-26 RUN_PARITY oracle.

/**
 * Slice-18 18h Q9: site-wide SEO defaults from the `site_meta` singleton.
 *
 * Consumers: root `+layout.ts` (threads `themeColor` to `<SeoHead>`).
 */
export async function getSiteSeoDefaults(ctx?: PreviewContext): Promise<SiteSeoDefaults> {
	return adapter.meta.siteSeoDefaults(ctx);
}

/**
 * Resolve PageSeo for a SvelteKit route id + locale.
 *
 * Consumers: root +layout.ts only (layout-authoritative per Slice 15a spec).
 * Page/layout code does not import the adapter directly — it goes through
 * this repository wrapper.
 *
 * Unknown routes throw at the adapter — the route registry is closed. Adding
 * a new public route without a content/meta.ts entry is a bug caught here,
 * by the sitemap coverage check (Task 11), and by the existing integrity tests.
 */
export async function getPageSeo(
	routeId: string,
	locale: Locale,
	params?: Record<string, string>,
	ctx?: PreviewContext,
): Promise<PageSeo> {
	return adapter.meta.forRoute(routeId, locale, params, ctx);
}
