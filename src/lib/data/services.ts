import type { Service } from './types.js';

// Four core service offerings. English-only for now.
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
		relatedProjects: ['transit-data-pipeline']
	},
	{
		id: 'data-pipeline',
		title: { en: 'Data Pipeline Architecture' },
		description: {
			en: 'Design and build ELT/ETL pipelines that move data reliably from source to destination. Includes schema design, transformation logic, and orchestration setup.'
		},
		station: 2,
		icon: 'station-pipeline.json',
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
		relatedProjects: ['transit-data-pipeline']
	},
	{
		id: 'database-performance',
		title: { en: 'Database Performance Tuning' },
		description: {
			en: 'Diagnose slow queries, missing indexes, and schema bottlenecks. Targeted fixes that reduce query time without rewriting your application.'
		},
		station: 4,
		icon: 'station-performance.json',
		lottieReverse: true,
		relatedProjects: []
	}
];
