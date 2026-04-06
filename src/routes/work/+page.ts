// Universal load for /work listing page.
// Follows the same synchronous data-loading pattern as /blog's +page.ts.
// All data is compile-time static — no fetch needed, no server-only APIs.
import {
	getPublicProjects,
	getAllTags,
	getServiceIdsForProjects,
	getVisibleServices,
	getServiceSvgContents
} from '$lib/data';

export function load() {
	const projects = getPublicProjects();
	const tags = getAllTags();
	const serviceIds = getServiceIdsForProjects();
	const services = getVisibleServices();
	// Load service SVG raw strings via import.meta.glob (build-time, same as blog SVGs)
	const serviceSvgContents = getServiceSvgContents();

	return { projects, tags, serviceIds, services, serviceSvgContents };
}
