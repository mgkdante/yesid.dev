// Load function for /services index page.
// Server-only so service/project CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '$lib/utils';
import { adapter } from '$lib/adapters';
import { localeEntries } from '$lib/server/prerender-entries';
import type { Project } from '$lib/types';

export const entries = localeEntries;

export async function load({ fetch, locals }: { fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const [services, projects] = await Promise.all([
		adapter.services.visible(ctx),
		adapter.projects.public(ctx),
	]);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);
	const serviceProjects: Record<string, readonly Project[]> = {};
	services.forEach((service) => {
		serviceProjects[service.id] = projects.filter((project) =>
			project.relatedServices.includes(service.id),
		);
	});

	return { services, serviceSvgContents, serviceProjects };
}
