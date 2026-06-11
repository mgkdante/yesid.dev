// Hand-written companion to the CMS-derived `projects.ts` (slice-18m).
//
// Holds route chrome (listing + meta + detail copy) and local helper functions
// over the `projects` array. The legacy `RawProject` type + `rawProjectToProject`
// wrapper (used pre-#41 when description/sections.content were plain LocalizedString)
// are deleted — the CMS-derived `projects` is already the full Project shape
// with LocalizedBlockEditorDoc. Slated for 18k cleanup.

import type { LocalizedString, Project } from '$lib/types';
import { projects } from './projects';

/** HTML `<title>` + `<meta description>` for the `/projects` route. Extracted
 *  in Task 17b-7k. */
export const projectsPageMeta = {
	title: { en: 'Projects | yesid.' } satisfies LocalizedString,
	description: {
		en: 'Projects, pipelines, and systems built by yesid. — freelance digital infrastructure in Montreal.',
	} satisfies LocalizedString,
} as const;

/** Projects-listing-page chrome copy extracted from components in Task 17b-7d.
 *  Consumed by ProjectListingPage, ProjectFilterMobile, ProjectFilterSidebar,
 *  ProjectCard, and (via re-use) the services detail's "see all projects" link. */
export const projectsListingContent = {
	heading: { en: 'Projects' } satisfies LocalizedString,
	searchPlaceholder: { en: 'Search projects...' } satisfies LocalizedString,
	/** "See all projects →" link — used from service detail pages pointing to /projects. */
	seeAllLink: { en: 'See all projects →' } satisfies LocalizedString,
	filters: {
		filtersLabel: { en: 'Filters' } satisfies LocalizedString,
		services: { en: 'Services' } satisfies LocalizedString,
		tags: { en: 'Tags' } satisfies LocalizedString,
		techStack: { en: 'Tech Stack' } satisfies LocalizedString,
		allLabel: { en: 'All' } satisfies LocalizedString,
		showingPrefix: { en: 'Showing' } satisfies LocalizedString,
	},
	card: {
		/** Suffix after the first N stack items; template `{count}` -> extra count. */
		stackOverflowSuffix: { en: '+{count} more' } satisfies LocalizedString,
	},
} as const;

/** Projects-detail-page chrome copy extracted from components in Task 17b-7e.
 *  Consumed by ProjectDetailHeader, ProjectDetailPage, ProjectGlancePanel(+Mobile),
 *  ProjectTocPill. */
export const projectsDetailContent = {
	backToListingLabel: { en: '← All Projects' } satisfies LocalizedString,
	tocSectionTitle: { en: 'On this page' } satisfies LocalizedString,
	readmeSectionTitle: { en: 'README' } satisfies LocalizedString,
	/** Glance panel (desktop sidebar + mobile collapsible) section headings. */
	glance: {
		overview: { en: 'Overview' } satisfies LocalizedString,
		impact: { en: 'Impact' } satisfies LocalizedString,
		stack: { en: 'Stack' } satisfies LocalizedString,
		services: { en: 'Services' } satisfies LocalizedString,
		links: { en: 'Links' } satisfies LocalizedString,
		/** Mobile-only rolled-up heading. */
		projectInfo: { en: 'Project Info' } satisfies LocalizedString,
		/** Link labels inside the Links section. */
		liveSiteLabel: { en: 'Live Site' } satisfies LocalizedString,
		liveSiteLabelMobile: { en: '↗ Live Site' } satisfies LocalizedString,
		githubLabel: { en: 'GitHub' } satisfies LocalizedString,
	},
	tocPill: {
		openAria: { en: 'Table of contents' } satisfies LocalizedString,
		closeAria: { en: 'Close table of contents' } satisfies LocalizedString,
	},
} as const;

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
