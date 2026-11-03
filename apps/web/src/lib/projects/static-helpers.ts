import { isEntityAvailable, type AvailabilityOptions } from '#lib/utils/content-availability.ts';
import type { Locale, Project } from '#lib/types.ts';
import { projects } from '#lib/content/projects.ts';

export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(locale: Locale = 'en', options: AvailabilityOptions = {}): readonly Project[] {
	// status guard matches every sibling helper: a featured project that gets
	// archived must not render on home linking to a 404 detail page.
	return projects.filter((project) => project.featured && isEntityAvailable({ kind: 'project', entity: project }, locale, options));
}

export function getPublicProjects(locale: Locale = 'en', options: AvailabilityOptions = {}): readonly Project[] {
	return projects.filter((project) => isEntityAvailable({ kind: 'project', entity: project }, locale, options));
}

export function getProjectsByService(serviceId: string, locale: Locale = 'en', options: AvailabilityOptions = {}): readonly Project[] {
	return projects.filter(
		(project) => isEntityAvailable({ kind: 'project', entity: project }, locale, options) && project.relatedServices.includes(serviceId),
	);
}
