// Load function for /services/[id] detail page.
// Resolves the service by ID, loads adjacent services for prev/next nav,
// related projects, and SVG content.

import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '$lib/utils';
import {
	getServiceById,
	getVisibleServices,
	getAdjacentServices,
	getProjectsByService,
} from '$lib/repositories';

export async function load({ params, fetch }) {
	const service = await getServiceById(params.id);

	if (!service || service.visible === false) {
		error(404, { message: 'Service not found' });
	}

	const [services, adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		getVisibleServices(),
		getAdjacentServices(params.id),
		getProjectsByService(params.id),
		fetchServiceSvgContents(fetch),
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
