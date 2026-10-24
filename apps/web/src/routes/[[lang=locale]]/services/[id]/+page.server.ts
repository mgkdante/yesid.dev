// Load function for /services/[id] detail page.
// Server-only so service/project reads (static content layer post-27.2)
// resolve once on the server and hydrate via __data.json.

import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '$lib/utils';
import { adapter } from '$lib/adapters';
import { serviceEntries } from '$lib/server/prerender-entries';

export const entries = serviceEntries;
export const prerender = entries().length > 0;

export async function load({ params, fetch }: { params: { id: string }; fetch: typeof globalThis.fetch }) {
	const service = await adapter.services.byId(params.id);

	if (!service || service.visible === false) {
		error(404, { message: 'Service not found' });
	}

	const services = await adapter.services.visible();
	const [adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		adapter.services.adjacent(params.id),
		adapter.projects.byService(params.id),
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
