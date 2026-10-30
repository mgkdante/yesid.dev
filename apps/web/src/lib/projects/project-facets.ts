import type { ProjectSummary } from '#lib/types.ts';
import { uniqueSorted } from '#lib/utils/collections.ts';

export function deriveProjectFacets(projects: readonly ProjectSummary[]): {
	tags: readonly string[];
	stackItems: readonly string[];
	serviceIds: readonly string[];
} {
	const visibleProjects = projects.filter((project) => project.status !== 'private');

	return {
		tags: uniqueSorted(visibleProjects.flatMap((project) => project.tags)),
		stackItems: uniqueSorted(visibleProjects.flatMap((project) => project.stack)),
		serviceIds: uniqueSorted(visibleProjects.flatMap((project) => project.relatedServices)),
	};
}
