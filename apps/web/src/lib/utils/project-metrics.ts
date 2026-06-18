import type { Project, ImpactMetric } from '$lib/types';

/**
 * Resolve a project's impact metrics, coalescing the current `impactMetrics`
 * array with the legacy singular `impactMetric`. Returns [] when neither is set.
 *
 * Centralizes the data-shape concern so the view components (ProjectCard,
 * ProjectGlancePanel, ProjectDetailHeader) stop each re-deriving the same
 * fallback — keeping the legacy-field handling out of the presentation layer.
 */
export function projectMetrics(
	project: Pick<Project, 'impactMetrics' | 'impactMetric'>,
): readonly ImpactMetric[] {
	if (project.impactMetrics && project.impactMetrics.length > 0) {
		return project.impactMetrics;
	}
	if (project.impactMetric) {
		return [project.impactMetric];
	}
	return [];
}
