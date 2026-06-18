import type { Project } from '$lib/types';
import { projects } from '$lib/content/projects';

export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): readonly Project[] {
	return projects.filter((project) => project.featured);
}

export function getPublicProjects(): readonly Project[] {
	return projects.filter((project) => project.status !== 'private');
}

export function getAllTags(): string[] {
	const tags = projects.flatMap((project) => project.tags);
	return [...new Set(tags)].sort();
}

export function getProjectsByService(serviceId: string): readonly Project[] {
	return projects.filter(
		(project) => project.status !== 'private' && project.relatedServices.includes(serviceId),
	);
}

export function getServiceIdsForProjects(): string[] {
	const ids = projects
		.filter((project) => project.status !== 'private')
		.flatMap((project) => project.relatedServices);
	return [...new Set(ids)].sort();
}

export function getAllStackItems(): string[] {
	const stacks = projects
		.filter((project) => project.status !== 'private')
		.flatMap((project) => project.stack);
	return [...new Set(stacks)].sort();
}
