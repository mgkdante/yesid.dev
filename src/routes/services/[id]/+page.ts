// Load function for /services/[id] detail page.
// Resolves the service by ID, loads adjacent services for prev/next nav,
// related projects, and SVG content.
import { error } from '@sveltejs/kit';
import { fetchServiceSvgContents } from '$lib/utils';
import { getServiceById, getVisibleServices, getAdjacentServices, getProjectsByService } from '$lib/content';
export async function load({ params, fetch }) {
	const service = getServiceById(params.id);

	if (!service || service.visible === false) {
		error(404, { message: 'Service not found' });
	}

	const services = getVisibleServices();
	const { prev, next } = getAdjacentServices(params.id);
	const relatedProjects = getProjectsByService(params.id);
	const serviceSvgContents = await fetchServiceSvgContents(fetch);

	return { service, services, prev, next, relatedProjects, serviceSvgContents };
}
