// Project repository — thin async delegation over adapter.projects.
// Route loaders call these functions; repositories never read $lib/content
// directly (only the adapter does).

import { adapter } from '$lib/adapters';
import type { PreviewContext, Project } from '$lib/types';

export async function getAllProjects(ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.all(ctx);
}

export async function getProjectBySlug(slug: string, ctx?: PreviewContext): Promise<Project | undefined> {
	return adapter.projects.bySlug(slug, ctx);
}

export async function getFeaturedProjects(ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.featured(ctx);
}

export async function getPublicProjects(ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.public(ctx);
}

export async function getProjectsByService(serviceId: string, ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.byService(serviceId, ctx);
}

export async function getAllTags(ctx?: PreviewContext): Promise<readonly string[]> {
	return adapter.projects.allTags(ctx);
}

export async function getAllStackItems(ctx?: PreviewContext): Promise<readonly string[]> {
	return adapter.projects.allStackItems(ctx);
}

export async function getServiceIdsForProjects(ctx?: PreviewContext): Promise<readonly string[]> {
	return adapter.projects.serviceIdsForProjects(ctx);
}
