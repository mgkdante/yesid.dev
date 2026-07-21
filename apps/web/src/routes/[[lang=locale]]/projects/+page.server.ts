// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('projects') memoization and add projectsPage chrome content.
//
// Service SVGs fetched via SvelteKit's `fetch` (works during SSR).

import { fetchServiceSvgContents } from '$lib/utils';
import { deriveProjectFacets } from '$lib/projects/project-facets';
import {
	getPublicProjects,
	getVisibleServices,
	getProjectsPageContent,
} from '$lib/repositories';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

export async function load({ fetch, locals }: { fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [services, projects, projectsPage] = await Promise.all([
		getVisibleServices(ctx),
		getPublicProjects(ctx),
		getProjectsPageContent(ctx),
	]);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);
	const { tags, stackItems, serviceIds } = deriveProjectFacets(projects);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents, projectsPage };
};
