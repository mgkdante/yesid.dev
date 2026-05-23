// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services). Helpers live in projects.companion.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { Project } from '$lib/types';

export const projects: readonly Project[] = [
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A personal brand and portfolio site for a freelance SQL developer and digital infrastructure consultant. Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and deployed to Vercel. Designed to be multilingual (en/fr/es) from day one.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409366,
				version: '2.31.2',
			},
		},
		featured: true,
		image: '8b57ccd1-bed1-46ae-bb24-a887714a8bcc',
		liveUrl: 'https://yesid.dev',
		oneLiner: {
			en: 'The site you are looking at: a SvelteKit portfolio built slice by slice.',
		},
		relatedServices: ['web-development'],
		repoUrl: 'https://github.com/mgkdante/yesid.dev',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'SvelteKit compiles away the framework at build time, producing lean HTML and minimal JavaScript. For a portfolio site where first impression and load speed matter, that trade-off is worth making.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409366,
						version: '2.31.2',
					},
				},
				title: { en: 'Why SvelteKit?' },
			},
		],
		slug: 'yesid-dev',
		stack: [
			'SvelteKit',
			'Svelte 5',
			'TypeScript',
			'Tailwind CSS',
			'Vercel',
		],
		status: 'public',
		tags: ['portfolio', 'web', 'svelte'],
		title: { en: 'yesid.dev — Portfolio Site' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A production data pipeline ingesting GTFS-RT feeds, transforming them with dbt, and surfacing KPIs in a Power BI dashboard. Built for a transit authority in Quebec.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409586,
				version: '2.31.2',
			},
		},
		environment: 'production',
		featured: false,
		impactMetric: {
			label: { en: 'Real-time refresh cycles' },
			value: '30s',
		},
		impactMetrics: [
			{
				label: { en: 'Real-time refresh cycles' },
				value: '30s',
			},
			{
				label: { en: 'Pipeline uptime' },
				value: '99.9%',
			},
		],
		location: 'sherbrooke',
		oneLiner: {
			en: 'An end-to-end ELT pipeline processing real-time transit data for a regional operator.',
		},
		readmeUrl: 'https://raw.githubusercontent.com/mgkdante/transit/main/README.md',
		relatedServices: ['data-pipeline', 'sql-development'],
		repoUrl: 'https://github.com/mgkdante/transit',
		sections: [],
		slug: 'transit-data-pipeline',
		stack: [
			'PostgreSQL',
			'Python',
			'dbt',
			'Power BI',
			'Apache Airflow',
		],
		status: 'public',
		tags: ['etl', 'transit', 'postgresql', 'dbt'],
		title: { en: 'Transit Operations Data Pipeline' },
		version: '2.4.1',
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Power BI dashboard suite built for a logistics company. Pulls data from SQL Server, applies business logic in DAX, and delivers daily refreshes to executive stakeholders. Reduced reporting time from 2 days to 15 minutes.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409843,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			before: '2 days',
			label: { en: 'Reporting across 12 depts' },
			value: '15 min',
		},
		impactMetrics: [
			{
				before: '2 days',
				label: { en: 'Reporting across 12 depts' },
				value: '15 min',
			},
			{
				label: { en: 'Query time reduction' },
				value: '73%',
			},
		],
		oneLiner: {
			en: 'Executive KPI dashboard tracking operational metrics across 12 departments.',
		},
		readmeUrl: 'https://github.com/zen-browser/desktop/blob/dev/README.md',
		relatedServices: ['analytics-reporting'],
		repoUrl: 'https://github.com/zen-browser',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Operations managers were spending two days each month compiling reports from multiple spreadsheets. Data was stale by the time decisions were made.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
				},
				title: { en: 'The Problem' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Connected directly to SQL Server with scheduled refreshes. Built a semantic layer in DAX so business users could slice data without writing queries.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
				},
				title: { en: 'The Approach' },
			},
		],
		slug: 'lorem-analytics-dashboard',
		stack: ['Power BI', 'SQL Server', 'Python', 'DAX'],
		status: 'public',
		tags: ['analytics', 'reporting', 'sql-server'],
		title: { en: 'Lorem Analytics Dashboard' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'Migrated a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads. Included schema redesign, data type mapping, and stored procedure conversion.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410164,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			label: { en: 'Zero-downtime migration' },
			value: '500 GB',
		},
		impactMetrics: [
			{
				label: { en: 'Zero-downtime migration' },
				value: '500 GB',
			},
		],
		oneLiner: {
			en: 'Zero-downtime migration from legacy MySQL to PostgreSQL for a SaaS platform.',
		},
		readmeUrl: 'https://github.com/oven-sh/bun/blob/main/README.md',
		relatedServices: ['database-engineering', 'sql-development'],
		repoUrl: 'https://github.com/oven-sh/bun',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The legacy MySQL instance was hitting performance limits. PostgreSQL offered better JSON support, CTEs, and window functions needed for the analytics layer.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
				},
				title: { en: 'Why Migrate?' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Used a dual-write pattern: new writes go to both databases, reads gradually shift to PostgreSQL. Shadow reads validated correctness before the cutover.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
				},
				title: { en: 'Migration Strategy' },
			},
		],
		slug: 'lorem-database-migration',
		stack: ['PostgreSQL', 'Python', 'Alembic', 'MySQL'],
		status: 'public',
		tags: ['postgresql', 'migration', 'schema'],
		title: { en: 'Lorem Database Migration' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Python-based tool that connects to SQL Server, analyzes execution plans, identifies missing indexes, and generates optimization recommendations. Reduced average query time by 73% across 200+ stored procedures.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410452,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			label: { en: 'Query time reduction' },
			value: '73%',
		},
		oneLiner: {
			en: 'Automated SQL Server query analysis tool that identifies slow queries and suggests index improvements.',
		},
		relatedServices: ['sql-development', 'database-engineering'],
		repoUrl: 'https://github.com/mgkdante/lorem-query-optimizer',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Connects to the target SQL Server instance, captures execution plans for the heaviest queries, and analyzes them for common anti-patterns: table scans, implicit conversions, and parameter sniffing issues.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410452,
						version: '2.31.2',
					},
				},
				title: { en: 'How It Works' },
			},
		],
		slug: 'lorem-query-optimizer',
		stack: ['SQL Server', 'Python', 'SSMS', 'T-SQL'],
		status: 'public',
		tags: ['sql', 'performance', 'sql-server'],
		title: { en: 'Lorem Query Optimizer' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Retool-based admin panel that replaced 6 spreadsheets with a unified interface. CRUD operations on PostgreSQL, role-based access control, and automated approval routing.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410643,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			label: { en: 'Spreadsheets replaced' },
			value: '6',
		},
		oneLiner: {
			en: 'Internal operations dashboard for managing inventory and approval workflows.',
		},
		relatedServices: ['internal-tooling', 'analytics-reporting'],
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Operations ran on 6 Google Sheets with manual copy-paste between them. The Retool panel centralized everything into one interface with real-time PostgreSQL queries.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410643,
						version: '2.31.2',
					},
				},
				title: { en: 'Before & After' },
			},
		],
		slug: 'lorem-retool-admin',
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		status: 'public',
		tags: ['retool', 'admin', 'postgresql'],
		title: { en: 'Lorem Retool Admin Panel' },
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'projects'.
export * from './projects.companion';
