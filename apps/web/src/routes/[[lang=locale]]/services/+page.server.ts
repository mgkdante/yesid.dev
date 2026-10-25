// Load function for /services index page.
// Server-only so service/project CMS reads are serialized through __data.json.

import { fetchServiceSvgContents } from '#lib/utils/index.js';
import { adapter } from '#lib/adapters/index.js';
import { localeEntries } from '#lib/server/prerender-entries.js';
import type { EntryGenerator } from './$types';
import type { Project } from '#lib/types.js';

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
