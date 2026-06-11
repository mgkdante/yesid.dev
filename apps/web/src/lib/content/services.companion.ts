// Hand-written companion to the CMS-derived `services.ts` (slice-18m).
//
// Holds the route chrome (listing + meta + detail copy) and the local
// helper functions that operate on the `services` array exported by the
// generated module.

import type { LocalizedString, Service } from '$lib/types';
import { services } from './services';

/** Services-listing-page chrome copy extracted from components in Task 17b-7f.
 *  Consumed by ServiceListingPage, ServiceCard, ProjectsStrip. */
export const servicesListingContent = {
	heading: { en: 'Services' } satisfies LocalizedString,
	/** Template for the SectionLabel on each service viewport.
	 *  Placeholders: {stationNum}, {totalStr} (both zero-padded). Shared with
	 *  ServiceDetailPage's hero — imported there from this same block. */
	stationLabelTemplate: { en: 'Service {stationNum} / {totalStr}' } satisfies LocalizedString,
	deepDiveLabel: { en: 'Deep dive →' } satisfies LocalizedString,
	/** Labels for the sticky orange ProjectsStrip under the services listing. */
	projectsStrip: {
		/** Template when a service is active; placeholder {serviceTitle}. */
		builtWithService: { en: 'Built with {serviceTitle}' } satisfies LocalizedString,
		/** Fallback when no service is selected. */
		builtWithFallback: { en: 'Built with this' } satisfies LocalizedString,
		/** Project-count noun (ALL-CAPS in the strip). */
		projectSingular: { en: 'PROJECT' } satisfies LocalizedString,
		projectPlural: { en: 'PROJECTS' } satisfies LocalizedString,
	},
} as const;

/** HTML `<title>` + `<meta description>` for the `/services` route. Extracted
 *  in Task 17b-7k. Per-service-detail pages already resolve their own title +
 *  description from the service data. */
export const servicesPageMeta = {
	title: { en: 'Services — yesid.' } satisfies LocalizedString,
	description: {
		en: 'Four stations: Databases & SQL, Pipelines & Automation, Dashboards & Analytics, Websites & E-commerce. Built in Montreal, shipped with numbers.',
	} satisfies LocalizedString,
} as const;

/** Services-detail-page chrome copy extracted from components in Task 17b-7f.
 *  Consumed by ServiceDetailPage, ServiceNav. Station label template lives on
 *  `servicesListingContent` (shared with ServiceCard) — imported separately. */
export const servicesDetailContent = {
	backToServicesLabel: { en: '← All Services' } satisfies LocalizedString,
	valuePropositionHeading: { en: 'How This Helps You' } satisfies LocalizedString,
	deliverablesHeading: { en: 'Typical Deliverables' } satisfies LocalizedString,
	relatedProjectsHeading: { en: 'Related Projects' } satisfies LocalizedString,
	/** Aria-label on the nav listing the related project links. */
	relatedProjectsNavAria: { en: 'Related projects' } satisfies LocalizedString,
	/** Aria-label on the ServiceNav prev/next wrapper. */
	serviceNavAria: { en: 'Service navigation' } satisfies LocalizedString,
} as const;

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
