import type { Project } from '$lib/types';
import { projects } from '$lib/content/projects';

export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): readonly Project[] {
	// status guard matches every sibling helper: a featured project that gets
	// archived must not render on home linking to a 404 detail page.
	return projects.filter((project) => project.featured && project.status !== 'private');
}

export function getPublicProjects(): readonly Project[] {
	return projects.filter((project) => project.status !== 'private');
}

export function getProjectsByService(serviceId: string): readonly Project[] {
	return projects.filter(
		(project) => project.status !== 'private' && project.relatedServices.includes(serviceId),
	);
}
