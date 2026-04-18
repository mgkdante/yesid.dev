// Load function for /services index page.
// Fetches all visible services, their SVG illustrations, and related projects
// for the RelatedProjects component on each service viewport.

import { fetchServiceSvgContents } from '$lib/utils';
import { getVisibleServices, getProjectsByService } from '$lib/repositories';
import type { Project } from '$lib/types';

export async function load({ fetch }) {
	const [services, serviceSvgContents] = await Promise.all([
		getVisibleServices(),
		fetchServiceSvgContents(fetch),
	]);

	// Pre-resolve related projects for each service (for RelatedProjects).
	// Fan out through the adapter in parallel instead of sequentially.
	const projectsPerService = await Promise.all(
		services.map((service) => getProjectsByService(service.id))
	);
	const serviceProjects: Record<string, readonly Project[]> = {};
	services.forEach((service, i) => {
		serviceProjects[service.id] = projectsPerService[i];
	});

	return { services, serviceSvgContents, serviceProjects };
}
