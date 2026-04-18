// Load function for /services index page.
// Fetches all visible services, their SVG illustrations, and related projects
// for the RelatedProjects component on each service viewport.
import { fetchServiceSvgContents } from '$lib/utils';

import { getVisibleServices, getProjectsByService } from '$lib/content';
export async function load({ fetch }) {
	const services = getVisibleServices();
	const serviceSvgContents = await fetchServiceSvgContents(fetch);

	// Pre-resolve related projects for each service (for RelatedProjects)
	const serviceProjects: Record<string, ReturnType<typeof getProjectsByService>> = {};
	for (const service of services) {
		serviceProjects[service.id] = getProjectsByService(service.id);
	}

	return { services, serviceSvgContents, serviceProjects };
}
