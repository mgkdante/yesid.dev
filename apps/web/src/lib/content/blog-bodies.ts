// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Block Editor body per published blog post, keyed by slug. Powers static blog.bodyBySlug + blog.html (serializeBlocksToHtml).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { BlockEditorDoc } from '$lib/types';

export const blogBodies: Readonly<Record<string, BlockEditorDoc>> = {
	'anime-data-viz-challenge': {
		blocks: [
			{
				data: {
					text: 'I watch a lot of anime. I also spend a lot of time in databases. So when I found a dataset of 10 years of MyAnimeList ratings, genres, and studios, I knew what I had to do.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Dataset' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: { text: 'The Kaggle dataset contains:' },
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '~17,000 anime titles',
							items: [],
						},
						{
							content: 'Ratings, member counts, and favorites',
							items: [],
						},
						{
							content: 'Genre tags and studio information',
							items: [],
						},
						{
							content: 'Airing dates and episode counts',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm00000004',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'The Questions' },
				id: 'm00000005',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: 'Which studios consistently produce the highest-rated anime?',
							items: [],
						},
						{
							content: 'Is there a "golden length" for anime series?',
							items: [],
						},
						{
							content: 'How have genre trends shifted over the decade?',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm00000006',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Surprising Findings' },
				id: 'm00000007',
				type: 'header',
			},
			{
				data: {
					level: 3,
					text: 'Studio quality is remarkably consistent',
				},
				id: 'm00000008',
				type: 'header',
			},
			{
				data: {
					text: 'Madhouse, Bones, and Wit Studio maintain average ratings above 7.5 across their entire catalogs. Studio Deen... does not. The standard deviation tells the real story: some studios are high-variance bets.',
				},
				id: 'm00000009',
				type: 'paragraph',
			},
			{
				data: { level: 3, text: '12-13 episodes is the sweet spot' },
				id: 'm0000000a',
				type: 'header',
			},
			{
				data: {
					text: 'Single-cour anime (12-13 episodes) have the highest average rating. Two-cour shows (24-26) are close behind. Anything over 100 episodes drops significantly, length fatigue is real.',
				},
				id: 'm0000000b',
				type: 'paragraph',
			},
			{
				data: { level: 3, text: 'Isekai exploded in 2016' },
				id: 'm0000000c',
				type: 'header',
			},
			{
				data: {
					text: 'Before 2016, isekai (transported to another world) was a niche genre. After 2016, it accounts for 15% of all new anime. The data doesn\'t lie, we\'re living in the isekai era.',
				},
				id: 'm0000000d',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Technical Stack' },
				id: 'm0000000e',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: '<b>PostgreSQL</b> for data storage and analysis (CTEs, window functions, pivot queries)',
							items: [],
						},
						{
							content: '<b>Power BI</b> for visualization',
							items: [],
						},
						{
							content: '<b>Python</b> for data cleaning and import',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000f',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'What I Learned About Data Storytelling' },
				id: 'm0000000g',
				type: 'header',
			},
			{
				data: {
					text: 'Numbers without narrative are just noise. The anime dataset taught me that the best visualizations answer a question the viewer didn\'t know they had. "Which studio should I trust?" is more compelling than "Average rating by studio."',
				},
				id: 'm0000000h',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Data viz is not about showing data. It\'s about showing insight.',
				},
				id: 'm0000000i',
				type: 'paragraph',
			},
		],
		time: 1777235049353,
		version: '2.31.2',
	},
	'building-a-transit-pipeline': {
		blocks: [
			{
				data: {
					text: 'When a Quebec transit operator needed real-time visibility into their operations, they had data, lots of it. GTFS-RT feeds streaming vehicle positions, trip updates, and service alerts every 15 seconds. What they didn\'t have was a way to turn that firehose into decisions.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Architecture' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: { text: 'The pipeline follows an ELT pattern:' },
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Extract:</b> Python scripts poll GTFS-RT protobuf feeds every 15 seconds',
							items: [],
						},
						{
							content: '<b>Load:</b> Raw data lands in a PostgreSQL staging schema',
							items: [],
						},
						{
							content: '<b>Transform:</b> dbt models clean, deduplicate, and aggregate into analytics-ready tables',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm00000004',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Key Decisions' },
				id: 'm00000005',
				type: 'header',
			},
			{
				data: { level: 3, text: 'Why PostgreSQL over a data warehouse?' },
				id: 'm00000006',
				type: 'header',
			},
			{
				data: {
					text: 'The data volume (&lt; 50GB/month) didn\'t justify Snowflake or BigQuery costs. PostgreSQL with proper indexing handles the analytical queries under 2 seconds. Sometimes the boring choice is the right choice.',
				},
				id: 'm00000007',
				type: 'paragraph',
			},
			{
				data: { level: 3, text: 'Why ELT over ETL?' },
				id: 'm00000008',
				type: 'header',
			},
			{
				data: {
					text: 'Loading raw data first means we never lose fidelity. When the PM asked "can we also track schedule adherence?" three months in, the raw data was already there. We just added a dbt model.',
				},
				id: 'm00000009',
				type: 'paragraph',
			},
			{
				data: { level: 3, text: 'Why dbt?' },
				id: 'm0000000a',
				type: 'header',
			},
			{
				data: {
					text: 'Version-controlled transformations. Every business rule is a SQL file with tests. When the on-time definition changed from "within 5 minutes" to "within 3 minutes," it was a one-line diff.',
				},
				id: 'm0000000b',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Dashboard' },
				id: 'm0000000c',
				type: 'header',
			},
			{
				data: {
					text: 'Power BI connects directly to the analytics schema. KPIs include:',
				},
				id: 'm0000000d',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: 'On-time performance by route and time period',
							items: [],
						},
						{
							content: 'Fleet utilization rates',
							items: [],
						},
						{
							content: 'Service alert response times',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000e',
				type: 'nestedlist',
			},
			{
				data: {
					text: 'The operator went from weekly Excel reports to real-time dashboards in 6 weeks.',
				},
				id: 'm0000000f',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What I\'d Do Differently' },
				id: 'm0000000g',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: 'Use Apache Airflow from day one instead of cron. The monitoring alone is worth it.',
							items: [],
						},
						{
							content: 'Add data quality checks earlier in the pipeline. Bad upstream data cascaded into confusing dashboard numbers for two days before we caught it.',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000h',
				type: 'nestedlist',
			},
		],
		time: 1777235049358,
		version: '2.31.2',
	},
	'why-i-left-orm-for-raw-sql': {
		blocks: [
			{
				data: {
					text: 'For years, I relied on ORMs, SQLAlchemy, Django ORM, Prisma. They promised productivity. They delivered abstraction. But somewhere along the way, I stopped understanding what my database was actually doing.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Breaking Point' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: {
					text: 'It happened on a Tuesday. A query that should have taken 50ms was taking 12 seconds. The ORM had generated a nested subquery with 4 JOINs when a simple CTE would have done the job. I spent 3 hours debugging the ORM\'s query builder before giving up and writing the SQL myself.',
				},
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: { text: 'The raw SQL took 47ms.' },
				id: 'm00000004',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What I Learned' },
				id: 'm00000005',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: '<b>You need to know your database.</b> ORMs hide the database behind an abstraction. That\'s fine until the abstraction leaks, and it always leaks.',
							items: [],
						},
						{
							content: '<b>SQL is already a DSL.</b> We don\'t need another language on top of a language designed for exactly this purpose.',
							items: [],
						},
						{
							content: '<b>Performance tuning requires SQL literacy.</b> You can\'t optimize what you can\'t read. EXPLAIN ANALYZE doesn\'t speak ORM.',
							items: [],
						},
						{
							content: '<b>Migrations are where ORMs shine.</b> I still use migration tools. But the queries themselves? Raw SQL, every time.',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm00000006',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'My Stack Now' },
				id: 'm00000007',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: '<b>PostgreSQL</b> for everything stateful',
							items: [],
						},
						{
							content: '<b>Raw SQL</b> with parameterized queries',
							items: [],
						},
						{
							content: '<b>dbt</b> for transformations',
							items: [],
						},
						{
							content: '<b>pg_stat_statements</b> for monitoring',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm00000008',
				type: 'nestedlist',
			},
			{
				data: {
					text: 'The code is longer. The control is absolute. The performance is predictable.',
				},
				id: 'm00000009',
				type: 'paragraph',
			},
			{
				data: { text: 'I\'m not going back.' },
				id: 'm0000000a',
				type: 'paragraph',
			},
		],
		time: 1777235049365,
		version: '2.31.2',
	},
};
