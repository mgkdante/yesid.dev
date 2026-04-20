// Site-meta repository. Slice 15b deleted the Slice-12 `getPersonSchema`
// wrapper — JSON-LD is now emitted via the adapters/jsonld factories + the
// <JsonLd> component; the repository no longer participates in that flow.

import { adapter } from '$lib/adapters';
import type { Locale, PageSeo, SiteMeta } from '$lib/types';

export async function getSiteMeta(): Promise<SiteMeta> {
	return adapter.meta.site();
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
): Promise<PageSeo> {
	return adapter.meta.forRoute(routeId, locale, params);
}
