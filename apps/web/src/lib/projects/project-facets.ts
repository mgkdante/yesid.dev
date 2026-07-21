import type { Project } from '$lib/types';
import { uniqueSorted } from '$lib/utils';

export function deriveProjectFacets(projects: readonly Project[]): {
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
