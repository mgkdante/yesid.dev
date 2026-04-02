import type { Project } from './types.js';

// Seed data — English only. French and Spanish fields are intentionally omitted;
// they will be filled in as content is translated (not in this slice).
// One project is featured (surfaces on the home page), one is private (client NDA work
// that exists in the data but is never rendered in public listings).
const projects: readonly Project[] = [
	{
		slug: 'yesid-dev',
		title: { en: 'yesid.dev — Portfolio Site' },
		oneLiner: { en: 'The site you are looking at: a SvelteKit portfolio built slice by slice.' },
		description: {
			en: 'A personal brand and portfolio site for a freelance SQL developer and data infrastructure consultant. Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and deployed to Vercel. Designed to be multilingual (en/fr/es) from day one.'
		},
		stack: ['SvelteKit', 'Svelte 5', 'TypeScript', 'Tailwind CSS', 'Vercel'],
		tags: ['portfolio', 'web', 'svelte'],
		status: 'public',
		featured: true,
		repoUrl: 'https://github.com/mgkdante/yesid.dev',
		liveUrl: 'https://yesid.dev',
		sections: [
			{
				title: { en: 'Why SvelteKit?' },
				content: {
					en: 'SvelteKit compiles away the framework at build time, producing lean HTML and minimal JavaScript. For a portfolio site where first impression and load speed matter, that trade-off is worth making.'
				}
			}
		]
	},
	{
		slug: 'transit-data-pipeline',
		title: { en: 'Transit Operations Data Pipeline' },
		oneLiner: {
			en: 'An end-to-end ELT pipeline processing real-time transit data for a regional operator.'
		},
		description: {
			en: 'A production data pipeline ingesting GTFS-RT feeds, transforming them with dbt, and surfacing KPIs in a Power BI dashboard. Built for a transit authority in Quebec. Under NDA — repository and client details are private.'
		},
		stack: ['PostgreSQL', 'Python', 'dbt', 'Power BI', 'Apache Airflow'],
		tags: ['etl', 'transit', 'postgresql', 'dbt'],
		// private: client work under NDA — data exists for portfolio record-keeping only
		status: 'private',
		featured: false,
		sections: []
	}
];

// --- Helper functions ---
// These operate only on the local `projects` array. They are co-located here
// because the helpers and the data they query are always changed together.

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
	// Set removes duplicates; spread + sort gives a stable, readable order
	return [...new Set(allTags)].sort();
}

export { projects };
