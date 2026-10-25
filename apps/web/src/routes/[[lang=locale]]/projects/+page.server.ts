// Service SVGs fetched via SvelteKit's `fetch` (works during SSR).

import { fetchServiceSvgContents } from '#lib/utils/index.js';
import { deriveProjectFacets } from '#lib/projects/project-facets.js';
import { adapter } from '#lib/adapters/index.js';
import { localeEntries } from '#lib/server/prerender-entries.js';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/projects')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const [services, projects, projectsPage] = await Promise.all([
		adapter.services.visible(),
		adapter.projects.public(),
		adapter.content.projectsPage(),
	]);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);
	const { tags, stackItems, serviceIds } = deriveProjectFacets(projects);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents, projectsPage };
};
