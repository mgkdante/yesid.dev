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
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'projects'.
export * from './projects.companion';
