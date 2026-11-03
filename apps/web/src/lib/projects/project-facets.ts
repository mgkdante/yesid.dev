import { isEntityAvailable, type AvailabilityOptions } from '#lib/catalog/availability.ts';
import type { Locale, ProjectSummary } from '#lib/types.ts';
import { uniqueSorted } from '#lib/utils/collections.ts';

export function deriveProjectFacets(projects: readonly ProjectSummary[], locale: Locale = 'en', options: AvailabilityOptions = {}): {
	stackItems: readonly string[];
	serviceIds: readonly string[];
} {
	const visibleProjects = projects.filter((project) => isEntityAvailable({ kind: 'project', entity: project }, locale, options));

	return {
		stackItems: uniqueSorted(visibleProjects.flatMap((project) => project.stack)),
		serviceIds: uniqueSorted(visibleProjects.flatMap((project) => project.relatedServices)),
	};
}
