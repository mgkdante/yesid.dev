// Universal load for /projects listing page.
// Service SVGs fetched via SvelteKit's `fetch` (works during SSR and CSR).

import { fetchServiceSvgContents } from '$lib/utils';
import {
	getPublicProjects,
	getAllTags,
	getAllStackItems,
	getServiceIdsForProjects,
	getVisibleServices,
} from '$lib/repositories';

export async function load({ fetch }) {
	const [projects, tags, stackItems, serviceIds, services, serviceSvgContents] = await Promise.all([
		getPublicProjects(),
		getAllTags(),
		getAllStackItems(),
		getServiceIdsForProjects(),
		getVisibleServices(),
		fetchServiceSvgContents(fetch),
	]);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents };
}
