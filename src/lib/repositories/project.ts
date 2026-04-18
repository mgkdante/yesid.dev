// Project repository — thin async delegation over adapter.projects.
// Route loaders call these functions; repositories never read $lib/content
// directly (only the adapter does).

import { adapter } from '$lib/adapters';
import type { Project } from '$lib/types';

export async function getAllProjects(): Promise<readonly Project[]> {
	return adapter.projects.all();
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
	return adapter.projects.bySlug(slug);
}

export async function getFeaturedProjects(): Promise<readonly Project[]> {
	return adapter.projects.featured();
}

export async function getPublicProjects(): Promise<readonly Project[]> {
	return adapter.projects.public();
}

export async function getProjectsByService(serviceId: string): Promise<readonly Project[]> {
	return adapter.projects.byService(serviceId);
}

export async function getAllTags(): Promise<readonly string[]> {
	return adapter.projects.allTags();
}

export async function getAllStackItems(): Promise<readonly string[]> {
	return adapter.projects.allStackItems();
}

export async function getServiceIdsForProjects(): Promise<readonly string[]> {
	return adapter.projects.serviceIdsForProjects();
}
