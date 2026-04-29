// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('projects') memoization and add projectsPage chrome content.
//
// Service SVGs fetched via SvelteKit's `fetch` (works during SSR).

import { fetchServiceSvgContents } from '$lib/utils';
import {
	getPublicProjects,
	getAllTags,
	getAllStackItems,
	getServiceIdsForProjects,
	getVisibleServices,
	getProjectsPageContent,
} from '$lib/repositories';

export async function load({ fetch, locals }: { fetch: typeof globalThis.fetch; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	// services must resolve before fetchServiceSvgContents can run (post-17c
	// the util no longer imports from $lib/content — services are threaded in
	// explicitly). Everything else stays parallel.
	const services = await getVisibleServices();
	const [projects, tags, stackItems, serviceIds, serviceSvgContents, projectsPage] = await Promise.all([
		getPublicProjects(),
		getAllTags(),
		getAllStackItems(),
		getServiceIdsForProjects(),
		fetchServiceSvgContents(fetch, services),
		getProjectsPageContent(ctx),
	]);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents, projectsPage };
};
