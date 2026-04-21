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
	// services must resolve before fetchServiceSvgContents can run (post-17c
	// the util no longer imports from $lib/content — services are threaded in
	// explicitly). Everything else stays parallel.
	const services = await getVisibleServices();
	const [projects, tags, stackItems, serviceIds, serviceSvgContents] = await Promise.all([
		getPublicProjects(),
		getAllTags(),
		getAllStackItems(),
		getServiceIdsForProjects(),
		fetchServiceSvgContents(fetch, services),
	]);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents };
}
