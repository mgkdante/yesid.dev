import { localeFromParams } from '#lib/utils/locale-routing.ts';
// Load function for /services/[id] detail page.
// Server-only so service/project reads (static content layer post-27.2)
// resolve once on the server and hydrate via __data.json.

import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { catalog } from '#lib/catalog/index.ts';
import { serviceEntries } from '#lib/server/prerender-entries.ts';

export const entries = serviceEntries;
export const prerender = entries().length > 0;

export async function load({ params, fetch }: { params: { id: string; lang?: string }; fetch: typeof globalThis.fetch }) {
	const locale = localeFromParams(params);
	const service = await catalog.services.byId(params.id);

	if (!service || !catalog.isAvailable({ kind: 'service', entity: service }, locale)) {
		error(404, 'Service not found');
	}

	const services = await catalog.services.available(locale);
	const [adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		catalog.services.adjacent(params.id, locale),
		catalog.projects.byService(params.id, locale),
		fetchServiceSvgContents(fetch, services),
	]);

	return {
		service,
		services,
		prev: adjacent.prev,
		next: adjacent.next,
		relatedProjects,
		serviceSvgContents,
	};
}
