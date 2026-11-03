import { localeFromParams } from '#lib/utils/locale-routing.ts';
// Load function for /services index page.
// Server-only so service CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { catalog } from '#lib/catalog/index.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/services')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ fetch, params = {} }: { fetch: typeof globalThis.fetch; params?: { lang?: string } }) {
	const locale = localeFromParams(params);
	const services = await catalog.services.available(locale);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);

	return { services, serviceSvgContents };
}
