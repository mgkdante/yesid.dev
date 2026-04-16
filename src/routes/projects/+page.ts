// Universal load for /projects listing page.
// Follows the same data-loading pattern as /blog's +page.ts.
// Service SVGs are fetched via SvelteKit's fetch (works during SSR and CSR).
import {
	getPublicProjects,
	getAllTags,
	getAllStackItems,
	getServiceIdsForProjects,
	getVisibleServices,
	fetchServiceSvgContents
} from '$lib/data';

export async function load({ fetch }) {
	const projects = getPublicProjects();
	const tags = getAllTags();
	const stackItems = getAllStackItems();
	const serviceIds = getServiceIdsForProjects();
	const services = getVisibleServices();
	// Fetch service SVG raw strings from static assets
	const serviceSvgContents = await fetchServiceSvgContents(fetch);

	return { projects, tags, stackItems, serviceIds, services, serviceSvgContents };
}
