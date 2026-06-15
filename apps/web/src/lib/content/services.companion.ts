// Hand-written companion to the CMS-derived `services.ts` (slice-18m).
//
// Holds the local helper functions that operate on the `services` array exported
// by the generated module. The route chrome (listing + detail microcopy) now
// lives in the CMS site_labels singleton (siteLabels.servicesChrome.{listing,
// detail}) and is read there directly by the components — single source = CMS.

import type { Service } from '$lib/types';
import { services } from './services';

// --- Helper functions ---
// Operate on the generated `services` array. Co-located here because helpers and
// the data they query are conceptually a unit, but the data layer is CMS-derived.

/**
 * Returns the service with the given ID, or undefined if not found.
 * Used on work detail pages to resolve the service a project links to.
 */
export function getServiceById(id: string): Service | undefined {
	return services.find((s) => s.id === id);
}

/**
 * Returns all services where visible is not explicitly false.
 * Used to populate service filters and station listings.
 */
export function getVisibleServices(): readonly Service[] {
	return services.filter((s) => s.visible !== false);
}

/**
 * Returns the previous and next services relative to the given ID,
 * ordered by station number. Used for prev/next navigation on detail pages.
 */
export function getAdjacentServices(id: string): { prev?: Service; next?: Service } {
	const visible = services.filter((s) => s.visible !== false);
	const sorted = [...visible].sort((a, b) => a.station - b.station);
	const index = sorted.findIndex((s) => s.id === id);
	if (index === -1) return {};
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}
