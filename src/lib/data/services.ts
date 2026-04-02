import type { Service } from './types.js';

// Four core service offerings. English-only for now.
// Icon strings are identifiers — slice 03 will resolve them to actual SVG/icon components.
// Keeping icons as strings here avoids importing an icon library into the data layer.
export const services: readonly Service[] = [
	{
		title: { en: 'SQL Development & Optimization' },
		description: {
			en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.'
		},
		icon: 'database'
	},
	{
		title: { en: 'Data Pipeline Architecture' },
		description: {
			en: 'Design and build ELT/ETL pipelines that move data reliably from source to destination. Includes schema design, transformation logic, and orchestration setup.'
		},
		icon: 'pipeline'
	},
	{
		title: { en: 'Analytics & Reporting Systems' },
		description: {
			en: 'Turn raw data into actionable dashboards with Power BI and Retool. Semantic layer design, KPI definition, and report delivery built around how your team actually makes decisions.'
		},
		icon: 'chart'
	},
	{
		title: { en: 'Database Performance Tuning' },
		description: {
			en: 'Diagnose slow queries, missing indexes, and schema bottlenecks. Targeted fixes that reduce query time without rewriting your application.'
		},
		icon: 'gauge'
	}
];
