// Load function for /services index page.
// Server-only so service CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '#lib/utils/index.ts';
import { adapter } from '#lib/adapters/index.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/services')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const services = await adapter.services.visible();
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);

	return { services, serviceSvgContents };
}
