// Hand-written companion to the CMS-derived `projects.ts` (slice-18m).
//
// Holds local helper functions
// over the `projects` array. The legacy `RawProject` type + `rawProjectToProject`
// wrapper (used pre-#41 when description/sections.content were plain LocalizedString)
// are deleted — the CMS-derived `projects` is already the full Project shape
// with LocalizedBlockEditorDoc. Slated for 18k cleanup.

import type { Project } from '$lib/types';
import { projects } from './projects';

// --- Helper functions ---
// Operate on the generated `projects` array. Co-located here because helpers
// and the data they query are conceptually a unit.

/**
 * Returns the project with the given slug, or undefined if none matches.
 * Slugs are unique by convention (enforced in data-integrity.test.ts).
 */
export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

/**
 * Returns all projects marked as featured.
 * Featured projects appear in the home page showcase section.
 */
export function getFeaturedProjects(): readonly Project[] {
	return projects.filter((p) => p.featured);
}

/**
 * Returns all projects that are not private.
 * Includes 'public' and 'wip' — both are safe to display to visitors.
 */
export function getPublicProjects(): readonly Project[] {
	return projects.filter((p) => p.status !== 'private');
}

/**
 * Returns a deduplicated, alphabetically sorted array of all tags across all projects.
 * Used to build tag filter UIs without duplicates.
 */
export function getAllTags(): string[] {
	const allTags = projects.flatMap((p) => p.tags);
	return [...new Set(allTags)].sort();
}

/**
 * Returns all non-private projects linked to a given service ID.
 * Used on service detail pages and the work listing to show related projects.
 */
export function getProjectsByService(serviceId: string): readonly Project[] {
	return projects.filter(
		(p) => p.status !== 'private' && p.relatedServices.includes(serviceId),
	);
}

/**
 * Returns deduplicated, sorted service IDs from all public projects.
 * Used to build service filter UI on the work listing page.
 */
export function getServiceIdsForProjects(): string[] {
	const ids = projects
		.filter((p) => p.status !== 'private')
		.flatMap((p) => p.relatedServices);
	return [...new Set(ids)].sort();
}

/**
 * Returns deduplicated, sorted tech stack items from all public projects.
 * Used to build tech stack filter UI on the work listing page.
 */
export function getAllStackItems(): string[] {
	const stacks = projects
		.filter((p) => p.status !== 'private')
		.flatMap((p) => p.stack);
	return [...new Set(stacks)].sort();
}
