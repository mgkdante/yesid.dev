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

	// services must resolve before fetchServiceSvgContents can run (post-17c
	// the util no longer imports from $lib/content — services are threaded in
	// explicitly). Adjacent + related-projects stay parallel.
	const services = await getVisibleServices();
	const [adjacent, relatedProjects, serviceSvgContents] = await Promise.all([
		getAdjacentServices(params.id),
		getProjectsByService(params.id),
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
