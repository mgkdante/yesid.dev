// Load function for /services index page.
// Server-only so service/project CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '$lib/utils';
import { getVisibleServices, getProjectsByService } from '$lib/repositories';
import type { Project } from '$lib/types';

export async function load({ fetch, locals }: { fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const services = await getVisibleServices(ctx);
	const [serviceSvgContents, projectsPerService] = await Promise.all([
		fetchServiceSvgContents(fetch, services),
		Promise.all(services.map((service) => getProjectsByService(service.id, ctx))),
	]);
	const serviceProjects: Record<string, readonly Project[]> = {};
	services.forEach((service, i) => {
		serviceProjects[service.id] = projectsPerService[i];
	});

	return { services, serviceSvgContents, serviceProjects };
}
