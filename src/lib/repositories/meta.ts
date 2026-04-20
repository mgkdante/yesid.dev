// Site-meta repository. `getPersonSchema()` composes adapter data with the
// pure JSON-LD builder — the one permitted bit of "work" a repository does.
// Zod will later slot in before `buildPersonSchema` if SiteMeta needs runtime
// validation (Slice 17c).

import { adapter } from '$lib/adapters';
import { buildPersonSchema } from '$lib/utils/json-ld';
import type { Locale, PageSeo, SiteMeta } from '$lib/types';

export async function getSiteMeta(): Promise<SiteMeta> {
	return adapter.meta.site();
}

export async function getPersonSchema(): Promise<string> {
	const meta = await adapter.meta.site();
	return buildPersonSchema(meta);
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
