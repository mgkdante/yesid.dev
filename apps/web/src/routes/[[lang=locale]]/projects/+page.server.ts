// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('projects') memoization and add projectsPage chrome content.
//
// Service SVGs fetched via SvelteKit's `fetch` (works during SSR).

import { fetchServiceSvgContents, uniqueSorted } from '$lib/utils';
import {
	getPublicProjects,
	getVisibleServices,
	getProjectsPageContent,
} from '$lib/repositories';
import { localeEntries } from '$lib/server/prerender-entries';
import type { Project } from '$lib/types';

export const entries = localeEntries;

function tagsFromProjects(projects: readonly Project[]): readonly string[] {
	return uniqueSorted(projects.flatMap((project) => project.tags));
}

function stackItemsFromProjects(projects: readonly Project[]): readonly string[] {
	return uniqueSorted(projects.flatMap((project) => project.stack));
}

function serviceIdsFromProjects(projects: readonly Project[]): readonly string[] {
	return uniqueSorted(projects.flatMap((project) => project.relatedServices));
}

export async function load({ fetch, locals }: { fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [services, projects, projectsPage] = await Promise.all([
		getVisibleServices(ctx),
		getPublicProjects(ctx),
		getProjectsPageContent(ctx),
	]);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);
	const tags = tagsFromProjects(projects);
	const stackItems = stackItemsFromProjects(projects);
	const serviceIds = serviceIdsFromProjects(projects);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents, projectsPage };
};
