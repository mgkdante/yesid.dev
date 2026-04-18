import type { Service } from '$lib/types';

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
		subtitle: { en: '& Optimization' },
		description: {
			en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.'
		},
		station: 1,
		icon: 'station-sql.json',
		svg: 'service-sql.svg',
		visible: true,
		benefitHeadline: { en: 'Queries that run in seconds, not minutes' },
		impactMetric: {
			value: { en: '3x faster' },
			label: { en: 'avg query improvement' },
		},
		relatedProjects: ['transit-data-pipeline', 'lorem-query-optimizer', 'lorem-database-migration'],
		valueProposition: {
			en: 'Slow queries cost money — in compute, in delayed reports, in frustrated analysts waiting for data. I audit your SQL layer, identify the expensive queries, and rewrite them for speed and clarity. You get faster dashboards, lower database costs, and code your team can actually maintain.'
		},
		deliverables: [
			{ en: 'Query performance audit' },
			{ en: 'Optimized stored procedures' },
			{ en: 'Index optimization strategy' },
			{ en: 'Schema refactoring plan' },
			{ en: 'Migration scripts with rollback' },
			{ en: 'Documentation and runbook' }
		],
		stack: ['PostgreSQL', 'SQL Server', 'T-SQL', 'PL/pgSQL'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I start with your slowest queries — the ones that block dashboards and frustrate users. Using execution plans and profiling tools, I identify the root cause (missing indexes, implicit conversions, parameter sniffing) and fix them systematically. Every change is tested against production-scale data before deployment.'
				}
			}
		]
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
		benefitHeadline: { en: 'Your data arrives clean, on time, every morning' },
		impactMetric: {
			value: { en: '99.9%' },
			label: { en: 'pipeline uptime' },
		},
		relatedProjects: ['transit-data-pipeline'],
		valueProposition: {
			en: 'Data stuck in silos is data nobody can use. I build pipelines that move information from source systems to your warehouse reliably — with logging, retry logic, and schema validation. Your analysts get clean, fresh data every morning without chasing down broken jobs.'
		},
		deliverables: [
			{ en: 'Pipeline architecture design' },
			{ en: 'ELT/ETL implementation' },
			{ en: 'Orchestration setup (Airflow/cron)' },
			{ en: 'Schema design and validation' },
			{ en: 'Error handling and alerting' },
			{ en: 'Runbook and monitoring dashboard' }
		],
		stack: ['Python', 'dbt', 'Apache Airflow', 'PostgreSQL'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I design pipelines that are boring in the best way — predictable, observable, and easy to debug at 3 AM. Every pipeline gets idempotent loads, schema contracts, and clear logging. I prefer dbt for transformation logic because it makes SQL testable and version-controlled.'
				}
			}
		]
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
		benefitHeadline: { en: 'Decisions in 15 minutes, not 2 days' },
		impactMetric: {
			value: { en: '2d \u2192 15m' },
			label: { en: 'reporting turnaround' },
		},
		relatedProjects: ['transit-data-pipeline', 'lorem-analytics-dashboard', 'lorem-retool-admin'],
		valueProposition: {
			en: 'A dashboard nobody trusts is worse than no dashboard. I build reporting systems grounded in a clean semantic layer — so the numbers match across reports, filters work intuitively, and your team stops second-guessing the data. You get dashboards that drive decisions, not confusion.'
		},
		deliverables: [
			{ en: 'Semantic layer / data model design' },
			{ en: 'Power BI or Retool dashboards' },
			{ en: 'KPI definition and documentation' },
			{ en: 'Automated report delivery' },
			{ en: 'User training and onboarding' },
			{ en: 'Performance tuning for large datasets' }
		],
		stack: ['Power BI', 'Retool', 'DAX', 'SQL'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I start by understanding how your team makes decisions — what questions they ask, how often, and what data they trust. Then I build a semantic layer that makes those questions easy to answer. The dashboard is the last step, not the first.'
				}
			}
		]
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
		benefitHeadline: { en: 'Zero-downtime migrations while you sleep' },
		impactMetric: {
			value: { en: '500GB+' },
			label: { en: 'migrated safely' },
		},
		relatedProjects: ['lorem-database-migration', 'lorem-query-optimizer'],
		valueProposition: {
			en: 'Database problems compound — a bad schema today means painful migrations tomorrow. I design schemas that scale, write migrations that don\'t break production, and tune indexes so your app stays fast as data grows. You get a database that\'s an asset, not a liability.'
		},
		deliverables: [
			{ en: 'Schema design and normalization review' },
			{ en: 'Migration strategy and scripts' },
			{ en: 'Index optimization audit' },
			{ en: 'Backup and recovery plan' },
			{ en: 'Performance benchmarking' },
			{ en: 'Documentation and ER diagrams' }
		],
		stack: ['PostgreSQL', 'SQL Server', 'Alembic', 'Python'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I treat database changes like infrastructure changes — planned, tested, and reversible. Every migration gets a rollback script. Every schema change gets benchmarked against realistic data volumes. I use Alembic for version-controlled migrations and test against staging before touching production.'
				}
			}
		]
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
		benefitHeadline: { en: 'Your team stops copying between spreadsheets' },
		impactMetric: {
			value: { en: '80%' },
			label: { en: 'less manual data entry' },
		},
		relatedProjects: ['lorem-retool-admin'],
		valueProposition: {
			en: 'Your ops team is copying data between spreadsheets and Slack threads. I build internal tools — admin panels, approval workflows, data entry forms — that centralize operations and eliminate manual work. You ship faster because your team spends time on decisions, not data entry.'
		},
		deliverables: [
			{ en: 'Requirements and workflow mapping' },
			{ en: 'Retool or custom admin panel' },
			{ en: 'API integration layer' },
			{ en: 'Role-based access control' },
			{ en: 'User onboarding documentation' },
			{ en: 'Maintenance and extension guide' }
		],
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I start by shadowing the workflow — watching how data moves through your team. Then I build the simplest tool that eliminates the bottleneck. Retool for rapid prototyping, custom code when Retool hits its limits. Every tool ships with docs so your team can extend it without me.'
				}
			}
		]
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
		benefitHeadline: { en: 'A frontend that matches your backend quality' },
		impactMetric: {
			value: { en: '100' },
			label: { en: 'Lighthouse performance' },
		},
		relatedProjects: ['yesid-dev'],
		valueProposition: {
			en: 'Your digital infrastructure deserves a frontend that matches. I build web applications that connect directly to your data layer — client portals, internal dashboards, public-facing tools — with the same attention to performance and reliability I bring to the backend.'
		},
		deliverables: [
			{ en: 'Full-stack SvelteKit application' },
			{ en: 'Responsive design implementation' },
			{ en: 'API integration and data layer' },
			{ en: 'Authentication and authorization' },
			{ en: 'Deployment and CI/CD setup' },
			{ en: 'Performance optimization' }
		],
		stack: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Vercel'],
		sections: [
			{
				title: { en: 'My Approach' },
				content: {
					en: 'I build with SvelteKit because it compiles away the framework — you get fast pages with minimal JavaScript. Every component is typed, every page is server-rendered for SEO, and the data layer connects cleanly to your backend. I deploy to Vercel for zero-config CI/CD and edge caching.'
				}
			}
		]
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

/**
 * Returns the previous and next services relative to the given ID,
 * ordered by station number. Used for prev/next navigation on detail pages.
 */
export function getAdjacentServices(id: string): { prev?: Service; next?: Service } {
	const visible = services.filter((s) => s.visible !== false);
	const sorted = [...visible].sort((a, b) => a.station - b.station);
	const index = sorted.findIndex((s) => s.id === id);
	if (index === -1) return {};
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined
	};
}
