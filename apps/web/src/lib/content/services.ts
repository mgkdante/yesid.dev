// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Services array (id, title, station, deliverables, sections, related projects). Chrome + helpers live in services.companion.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { Service } from '$lib/types';

export const services: readonly Service[] = [
	{
		benefitHeadline: { en: 'Queries that run in seconds, not minutes' },
		deliverables: [
			{ en: 'Query performance audit' },
			{ en: 'Optimized stored procedures' },
			{ en: 'Index optimization strategy' },
			{ en: 'Schema refactoring plan' },
			{ en: 'Migration scripts with rollback' },
			{ en: 'Documentation and runbook' },
		],
		description: {
			en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.',
		},
		id: 'sql-development',
		impactMetric: {
			label: { en: 'avg query improvement' },
			value: { en: '3x faster' },
		},
		relatedProjects: [
			'transit-data-pipeline',
			'lorem-database-migration',
			'lorem-query-optimizer',
		],
		sections: [
			{
				content: {
					en: 'I start with your slowest queries — the ones that block dashboards and frustrate users. Using execution plans and profiling tools, I identify the root cause (missing indexes, implicit conversions, parameter sniffing) and fix them systematically. Every change is tested against production-scale data before deployment.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'T-SQL', 'PL/pgSQL'],
		station: 1,
		subtitle: { en: '& Optimization' },
		svg: 'service-sql.svg',
		title: { en: 'SQL Development & Optimization' },
		valueProposition: {
			en: 'Slow queries cost money — in compute, in delayed reports, in frustrated analysts waiting for data. I audit your SQL layer, identify the expensive queries, and rewrite them for speed and clarity. You get faster dashboards, lower database costs, and code your team can actually maintain.',
		},
		visible: true,
	},
	{
		benefitHeadline: { en: 'Your data arrives clean, on time, every morning' },
		deliverables: [
			{ en: 'Pipeline architecture design' },
			{ en: 'ELT/ETL implementation' },
			{ en: 'Orchestration setup (Airflow/cron)' },
			{ en: 'Schema design and validation' },
			{ en: 'Error handling and alerting' },
			{ en: 'Runbook and monitoring dashboard' },
		],
		description: {
			en: 'Design and build ELT/ETL pipelines that move data reliably from source to destination. Includes schema design, transformation logic, and orchestration setup.',
		},
		id: 'data-pipeline',
		impactMetric: {
			label: { en: 'pipeline uptime' },
			value: { en: '99.9%' },
		},
		relatedProjects: ['transit-data-pipeline'],
		sections: [
			{
				content: {
					en: 'I design pipelines that are boring in the best way — predictable, observable, and easy to debug at 3 AM. Every pipeline gets idempotent loads, schema contracts, and clear logging. I prefer dbt for transformation logic because it makes SQL testable and version-controlled.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['Python', 'dbt', 'Apache Airflow', 'PostgreSQL'],
		station: 2,
		svg: 'service-pipeline.svg',
		title: { en: 'Data Pipeline Architecture' },
		valueProposition: {
			en: 'Data stuck in silos is data nobody can use. I build pipelines that move information from source systems to your warehouse reliably — with logging, retry logic, and schema validation. Your analysts get clean, fresh data every morning without chasing down broken jobs.',
		},
		visible: true,
	},
	{
		benefitHeadline: { en: 'Decisions in 15 minutes, not 2 days' },
		deliverables: [
			{ en: 'Semantic layer / data model design' },
			{ en: 'Power BI or Retool dashboards' },
			{ en: 'KPI definition and documentation' },
			{ en: 'Automated report delivery' },
			{ en: 'User training and onboarding' },
			{ en: 'Performance tuning for large datasets' },
		],
		description: {
			en: 'Turn raw data into actionable dashboards with Power BI and Retool. Semantic layer design, KPI definition, and report delivery built around how your team actually makes decisions.',
		},
		id: 'analytics-reporting',
		impactMetric: {
			label: { en: 'reporting turnaround' },
			value: { en: '2d → 15m' },
		},
		relatedProjects: ['lorem-analytics-dashboard', 'lorem-retool-admin'],
		sections: [
			{
				content: {
					en: 'I start by understanding how your team makes decisions — what questions they ask, how often, and what data they trust. Then I build a semantic layer that makes those questions easy to answer. The dashboard is the last step, not the first.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['Power BI', 'Retool', 'DAX', 'SQL'],
		station: 3,
		svg: 'service-reporting.svg',
		title: { en: 'Analytics & Reporting Systems' },
		valueProposition: {
			en: 'A dashboard nobody trusts is worse than no dashboard. I build reporting systems grounded in a clean semantic layer — so the numbers match across reports, filters work intuitively, and your team stops second-guessing the data. You get dashboards that drive decisions, not confusion.',
		},
		visible: true,
	},
	{
		benefitHeadline: { en: 'Zero-downtime migrations while you sleep' },
		deliverables: [
			{ en: 'Schema design and normalization review' },
			{ en: 'Migration strategy and scripts' },
			{ en: 'Index optimization audit' },
			{ en: 'Backup and recovery plan' },
			{ en: 'Performance benchmarking' },
			{ en: 'Documentation and ER diagrams' },
		],
		description: {
			en: 'Design, migrate, and tune databases for performance. Schema modeling, index optimization, and migration strategy built for reliability.',
		},
		id: 'database-engineering',
		impactMetric: {
			label: { en: 'migrated safely' },
			value: { en: '500GB+' },
		},
		relatedProjects: ['lorem-database-migration', 'lorem-query-optimizer'],
		sections: [
			{
				content: {
					en: 'I treat database changes like infrastructure changes — planned, tested, and reversible. Every migration gets a rollback script. Every schema change gets benchmarked against realistic data volumes. I use Alembic for version-controlled migrations and test against staging before touching production.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'Alembic', 'Python'],
		station: 4,
		svg: 'service-database.svg',
		title: { en: 'Database Engineering' },
		valueProposition: {
			en: 'Database problems compound — a bad schema today means painful migrations tomorrow. I design schemas that scale, write migrations that don\'t break production, and tune indexes so your app stays fast as data grows. You get a database that\'s an asset, not a liability.',
		},
		visible: true,
	},
	{
		benefitHeadline: { en: 'Your team stops copying between spreadsheets' },
		deliverables: [
			{ en: 'Requirements and workflow mapping' },
			{ en: 'Retool or custom admin panel' },
			{ en: 'API integration layer' },
			{ en: 'Role-based access control' },
			{ en: 'User onboarding documentation' },
			{ en: 'Maintenance and extension guide' },
		],
		description: {
			en: 'Build admin panels and workflow tools that replace spreadsheets. Retool, custom dashboards, and approval systems designed for operations teams.',
		},
		id: 'internal-tooling',
		impactMetric: {
			label: { en: 'less manual data entry' },
			value: { en: '80%' },
		},
		relatedProjects: ['lorem-retool-admin'],
		sections: [
			{
				content: {
					en: 'I start by shadowing the workflow — watching how data moves through your team. Then I build the simplest tool that eliminates the bottleneck. Retool for rapid prototyping, custom code when Retool hits its limits. Every tool ships with docs so your team can extend it without me.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		station: 5,
		svg: 'service-tooling.svg',
		title: { en: 'Internal Tooling' },
		valueProposition: {
			en: 'Your ops team is copying data between spreadsheets and Slack threads. I build internal tools — admin panels, approval workflows, data entry forms — that centralize operations and eliminate manual work. You ship faster because your team spends time on decisions, not data entry.',
		},
		visible: true,
	},
	{
		benefitHeadline: { en: 'A frontend that matches your backend quality' },
		deliverables: [
			{ en: 'Full-stack SvelteKit application' },
			{ en: 'Responsive design implementation' },
			{ en: 'API integration and data layer' },
			{ en: 'Authentication and authorization' },
			{ en: 'Deployment and CI/CD setup' },
			{ en: 'Performance optimization' },
		],
		description: {
			en: 'Data-driven web apps and authenticated portals. Full-stack development with SvelteKit, responsive design, and API integration.',
		},
		id: 'web-development',
		impactMetric: {
			label: { en: 'Lighthouse performance' },
			value: { en: '100' },
		},
		relatedProjects: ['yesid-dev'],
		sections: [
			{
				content: {
					en: 'I build with SvelteKit because it compiles away the framework — you get fast pages with minimal JavaScript. Every component is typed, every page is server-rendered for SEO, and the data layer connects cleanly to your backend. I deploy to Vercel for zero-config CI/CD and edge caching.',
				},
				title: { en: 'My Approach' },
			},
		],
		stack: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Vercel'],
		station: 6,
		svg: 'service-web.svg',
		title: { en: 'Web Development' },
		valueProposition: {
			en: 'Your digital infrastructure deserves a frontend that matches. I build web applications that connect directly to your data layer — client portals, internal dashboards, public-facing tools — with the same attention to performance and reliability I bring to the backend.',
		},
		visible: true,
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'services'.
export * from './services.companion';
