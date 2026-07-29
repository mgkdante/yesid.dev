// Load function for /services/[id] detail page.
// Server-only so service/project reads (static content layer post-27.2)
// resolve once on the server and hydrate via __data.json.

import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '$lib/utils';
import { adapter } from '$lib/adapters';
import { serviceEntries } from '$lib/server/prerender-entries';

export const entries = serviceEntries;

export async function load({ params, fetch, locals }: { params: { id: string }; fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const service = await adapter.services.byId(params.id, ctx);

	if (!service || service.visible === false) {
		error(404, { message: 'Service not found' });
	}

	const services = await adapter.services.visible(ctx);
	const [adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		adapter.services.adjacent(params.id, ctx),
		adapter.projects.byService(params.id, ctx),
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
