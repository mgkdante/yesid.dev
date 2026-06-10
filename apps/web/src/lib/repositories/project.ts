// Project repository — thin async delegation over adapter.projects.
// Route loaders call these functions; repositories never read $lib/content
// directly (only the adapter does).
// Slice-28.3 (#117): pruned wrappers with zero route/test consumers
// (getAllProjects, getFeaturedProjects, getAllTags, getAllStackItems,
// getServiceIdsForProjects). Adapter-port methods stay for the slice-26
// RUN_PARITY oracle.

import { adapter } from '$lib/adapters';
import type { PreviewContext, Project } from '$lib/types';

export async function getProjectBySlug(slug: string, ctx?: PreviewContext): Promise<Project | undefined> {
	return adapter.projects.bySlug(slug, ctx);
}

export async function getPublicProjects(ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.public(ctx);
}

export async function getProjectsByService(serviceId: string, ctx?: PreviewContext): Promise<readonly Project[]> {
	return adapter.projects.byService(serviceId, ctx);
}
