import type { Service } from './types.js';

// Six core service offerings. English-only for now.
// Station numbers are sequential (1-4) matching the train journey order defined in
// MOTION.md. The station system is data-driven: adding a 5th service means adding one
// object here with station: 5 — no component or layout changes needed.
//
// relatedProjects lists project slugs that appear at each station. Slugs must exist
// in the projects array (enforced by data-integrity tests).
export const services: readonly Service[] = [
	{
		id: 'sql-development',
		title: { en: 'SQL Development & Optimization' },
		description: {
			en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.'
		},
		station: 1,
		icon: 'station-sql.json',
		svg: 'service-sql.svg',
		visible: true,
		relatedProjects: ['transit-data-pipeline', 'lorem-query-optimizer', 'lorem-database-migration']
	},
	{
		id: 'data-pipeline',
		title: { en: 'Data Pipeline Architecture' },
		description: {
			en: 'Design and build ELT/ETL pipelines that move data reliably from source to destination. Includes schema design, transformation logic, and orchestration setup.'
		},
		station: 2,
		icon: 'station-pipeline.json',
		svg: 'service-pipeline.svg',
		visible: true,
		relatedProjects: ['transit-data-pipeline']
	},
	{
		id: 'analytics-reporting',
		title: { en: 'Analytics & Reporting Systems' },
		description: {
			en: 'Turn raw data into actionable dashboards with Power BI and Retool. Semantic layer design, KPI definition, and report delivery built around how your team actually makes decisions.'
		},
		station: 3,
		icon: 'station-analytics.json',
		svg: 'service-reporting.svg',
		visible: true,
		relatedProjects: ['transit-data-pipeline', 'lorem-analytics-dashboard', 'lorem-retool-admin']
	},
	{
		id: 'database-engineering',
		title: { en: 'Database Engineering' },
		description: {
			en: 'Design, migrate, and tune databases for performance. Schema modeling, index optimization, and migration strategy built for reliability.'
		},
		station: 4,
		icon: 'station-performance.json',
		lottieReverse: true,
		svg: 'service-database.svg',
		visible: true,
		relatedProjects: ['lorem-database-migration', 'lorem-query-optimizer']
	},
	{
		id: 'internal-tooling',
		title: { en: 'Internal Tooling' },
		description: {
			en: 'Build admin panels and workflow tools that replace spreadsheets. Retool, custom dashboards, and approval systems designed for operations teams.'
		},
		station: 5,
		svg: 'service-tooling.svg',
		visible: true,
		relatedProjects: ['lorem-retool-admin']
	},
	{
		id: 'web-development',
		title: { en: 'Web Development' },
		description: {
			en: 'Data-driven web apps and authenticated portals. Full-stack development with SvelteKit, responsive design, and API integration.'
		},
		station: 6,
		svg: 'service-web.svg',
		visible: true,
		relatedProjects: ['yesid-dev']
	}
];

// --- Helper functions ---
// Co-located with the services array for the same reason as in projects.ts:
// helpers and data they query are always changed together.

/**
 * Returns the service with the given ID, or undefined if not found.
 * Used on work detail pages to resolve the service a project links to.
 */
export function getServiceById(id: string): Service | undefined {
	return services.find((s) => s.id === id);
}

/**
 * Returns all services where visible is not explicitly false.
 * Used to populate service filters and station listings.
 */
export function getVisibleServices(): readonly Service[] {
	return services.filter((s) => s.visible !== false);
}
