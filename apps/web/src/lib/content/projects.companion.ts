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
	title: { en: 'Projects | yesid.', fr: 'Projets | yesid.' } satisfies LocalizedString,
	description: {
		en: 'Projects, pipelines, and systems built by yesid., freelance digital infrastructure in Montreal.',
		fr: 'Des projets, des pipelines pis des systèmes bâtis par yesid., infrastructure numérique en freelance à Montréal.',
	} satisfies LocalizedString,
} as const;

/** Projects-listing-page chrome copy extracted from components in Task 17b-7d.
 *  Consumed by ProjectListingPage, ProjectFilterMobile, ProjectFilterSidebar,
 *  ProjectCard, and (via re-use) the services detail's "see all projects" link. */
export const projectsListingContent = {
	heading: { en: 'Projects', fr: 'Projets' } satisfies LocalizedString,
	searchPlaceholder: {
		en: 'Search projects...',
		fr: 'Rechercher des projets…',
	} satisfies LocalizedString,
	/** "See all projects →" link — used from service detail pages pointing to /projects. */
	seeAllLink: {
		en: 'See all projects →',
		fr: 'Voir tous les projets →',
	} satisfies LocalizedString,
	filters: {
		filtersLabel: { en: 'Filters', fr: 'Filtres' } satisfies LocalizedString,
		services: { en: 'Services', fr: 'Services' } satisfies LocalizedString,
		tags: { en: 'Tags', fr: 'Étiquettes' } satisfies LocalizedString,
		techStack: { en: 'Tech Stack', fr: 'Stack technique' } satisfies LocalizedString,
		allLabel: { en: 'All', fr: 'Tous' } satisfies LocalizedString,
		showingPrefix: { en: 'Showing', fr: 'Affichage' } satisfies LocalizedString,
	},
	card: {
		/** Suffix after the first N stack items; template `{count}` -> extra count. */
		stackOverflowSuffix: { en: '+{count} more', fr: '+{count} de plus' } satisfies LocalizedString,
	},
} as const;

/** Projects-detail-page chrome copy extracted from components in Task 17b-7e.
 *  Consumed by ProjectDetailHeader, ProjectDetailPage, ProjectGlancePanel(+Mobile),
 *  ProjectTocPill. */
export const projectsDetailContent = {
	backToListingLabel: { en: '← All Projects', fr: '← Tous les projets' } satisfies LocalizedString,
	tocSectionTitle: { en: 'On this page', fr: 'Sur cette page' } satisfies LocalizedString,
	readmeSectionTitle: { en: 'README', fr: 'README' } satisfies LocalizedString,
	/** Glance panel (desktop sidebar + mobile collapsible) section headings. */
	glance: {
		overview: { en: 'Overview', fr: 'Aperçu' } satisfies LocalizedString,
		impact: { en: 'Impact', fr: 'Impact' } satisfies LocalizedString,
		stack: { en: 'Stack', fr: 'Stack' } satisfies LocalizedString,
		services: { en: 'Services', fr: 'Services' } satisfies LocalizedString,
		links: { en: 'Links', fr: 'Liens' } satisfies LocalizedString,
		/** Mobile-only rolled-up heading. */
		projectInfo: { en: 'Project Info', fr: 'Infos du projet' } satisfies LocalizedString,
		/** Link labels inside the Links section. */
		liveSiteLabel: { en: 'Live Site', fr: 'Site en ligne' } satisfies LocalizedString,
		liveSiteLabelMobile: { en: '↗ Live Site', fr: '↗ Site en ligne' } satisfies LocalizedString,
		githubLabel: { en: 'GitHub', fr: 'GitHub' } satisfies LocalizedString,
	},
	tocPill: {
		openAria: { en: 'Table of contents', fr: 'Table des matières' } satisfies LocalizedString,
		closeAria: { en: 'Close table of contents', fr: 'Fermer la table des matières' } satisfies LocalizedString,
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
