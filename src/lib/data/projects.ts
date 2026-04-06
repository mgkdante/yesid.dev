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
		relatedServices: ['web-development'],
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
			en: 'A production data pipeline ingesting GTFS-RT feeds, transforming them with dbt, and surfacing KPIs in a Power BI dashboard. Built for a transit authority in Quebec.'
		},
		stack: ['PostgreSQL', 'Python', 'dbt', 'Power BI', 'Apache Airflow'],
		tags: ['etl', 'transit', 'postgresql', 'dbt'],
		status: 'public',
		featured: false,
		relatedServices: ['data-pipeline', 'sql-development'],
		repoUrl: 'https://github.com/mgkdante/transit',
		readmeUrl: 'https://raw.githubusercontent.com/mgkdante/transit/main/README.md',
		sections: []
	},
	{
		slug: 'lorem-analytics-dashboard',
		title: { en: 'Lorem Analytics Dashboard' },
		oneLiner: { en: 'Executive KPI dashboard tracking operational metrics across 12 departments.' },
		description: {
			en: 'A Power BI dashboard suite built for a logistics company. Pulls data from SQL Server, applies business logic in DAX, and delivers daily refreshes to executive stakeholders. Reduced reporting time from 2 days to 15 minutes.'
		},
		stack: ['Power BI', 'SQL Server', 'Python', 'DAX'],
		tags: ['analytics', 'reporting', 'sql-server'],
		status: 'public',
		featured: false,
		relatedServices: ['analytics-reporting'],
		sections: [
			{
				title: { en: 'The Problem' },
				content: {
					en: 'Operations managers were spending two days each month compiling reports from multiple spreadsheets. Data was stale by the time decisions were made.'
				}
			},
			{
				title: { en: 'The Approach' },
				content: {
					en: 'Connected directly to SQL Server with scheduled refreshes. Built a semantic layer in DAX so business users could slice data without writing queries.'
				}
			}
		]
	},
	{
		slug: 'lorem-database-migration',
		title: { en: 'Lorem Database Migration' },
		oneLiner: { en: 'Zero-downtime migration from legacy MySQL to PostgreSQL for a SaaS platform.' },
		description: {
			en: 'Migrated a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads. Included schema redesign, data type mapping, and stored procedure conversion.'
		},
		stack: ['PostgreSQL', 'Python', 'Alembic', 'MySQL'],
		tags: ['postgresql', 'migration', 'schema'],
		status: 'public',
		featured: false,
		relatedServices: ['database-engineering', 'sql-development'],
		sections: [
			{
				title: { en: 'Why Migrate?' },
				content: {
					en: 'The legacy MySQL instance was hitting performance limits. PostgreSQL offered better JSON support, CTEs, and window functions needed for the analytics layer.'
				}
			},
			{
				title: { en: 'Migration Strategy' },
				content: {
					en: 'Used a dual-write pattern: new writes go to both databases, reads gradually shift to PostgreSQL. Shadow reads validated correctness before the cutover.'
				}
			}
		]
	},
	{
		slug: 'lorem-query-optimizer',
		title: { en: 'Lorem Query Optimizer' },
		oneLiner: { en: 'Automated SQL Server query analysis tool that identifies slow queries and suggests index improvements.' },
		description: {
			en: 'A Python-based tool that connects to SQL Server, analyzes execution plans, identifies missing indexes, and generates optimization recommendations. Reduced average query time by 73% across 200+ stored procedures.'
		},
		stack: ['SQL Server', 'Python', 'SSMS', 'T-SQL'],
		tags: ['sql', 'performance', 'sql-server'],
		status: 'public',
		featured: false,
		relatedServices: ['sql-development', 'database-engineering'],
		repoUrl: 'https://github.com/mgkdante/lorem-query-optimizer',
		sections: [
			{
				title: { en: 'How It Works' },
				content: {
					en: 'Connects to the target SQL Server instance, captures execution plans for the heaviest queries, and analyzes them for common anti-patterns: table scans, implicit conversions, and parameter sniffing issues.'
				}
			}
		]
	},
	{
		slug: 'lorem-retool-admin',
		title: { en: 'Lorem Retool Admin Panel' },
		oneLiner: { en: 'Internal operations dashboard for managing inventory and approval workflows.' },
		description: {
			en: 'A Retool-based admin panel that replaced 6 spreadsheets with a unified interface. CRUD operations on PostgreSQL, role-based access control, and automated approval routing.'
		},
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		tags: ['retool', 'admin', 'postgresql'],
		status: 'public',
		featured: false,
		relatedServices: ['internal-tooling', 'analytics-reporting'],
		sections: [
			{
				title: { en: 'Before & After' },
				content: {
					en: 'Operations ran on 6 Google Sheets with manual copy-paste between them. The Retool panel centralized everything into one interface with real-time PostgreSQL queries.'
				}
			}
		]
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

/**
 * Returns all non-private projects linked to a given service ID.
 * Used on service detail pages and the work listing to show related projects.
 */
export function getProjectsByService(serviceId: string): readonly Project[] {
	return projects.filter(
		(p) => p.status !== 'private' && p.relatedServices.includes(serviceId)
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

export { projects };
