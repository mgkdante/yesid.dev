// Load function for /services index page.
// Server-only so service/project CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '$lib/utils';
import { adapter } from '$lib/adapters';
import { localeEntries } from '$lib/server/prerender-entries';
import type { EntryGenerator } from './$types';
import type { Project } from '$lib/types';

export const entries = (() => localeEntries('/services')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const [services, projects] = await Promise.all([
		adapter.services.visible(),
		adapter.projects.public(),
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
