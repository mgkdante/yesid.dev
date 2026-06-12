// Load function for /services/[id] detail page.
// Server-only so service/project reads (static content layer post-27.2)
// resolve once on the server and hydrate via __data.json.

import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '$lib/utils';
import {
	getServiceById,
	getVisibleServices,
	getAdjacentServices,
	getProjectsByService,
} from '$lib/repositories';

export async function load({ params, fetch, locals }: { params: { id: string }; fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const service = await getServiceById(params.id, ctx);

	if (!service || service.visible === false) {
		error(404, { message: 'Service not found' });
	}

	const services = await getVisibleServices(ctx);
	const [adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		getAdjacentServices(params.id, ctx),
		getProjectsByService(params.id, ctx),
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
