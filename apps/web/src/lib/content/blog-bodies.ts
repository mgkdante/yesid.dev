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
					text: 'I watch a lot of anime. I also spend a lot of time in databases. So when I found a dataset of 10 years of MyAnimeList ratings, genres, and studios — I knew what I had to do.',
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
					text: 'Single-cour anime (12-13 episodes) have the highest average rating. Two-cour shows (24-26) are close behind. Anything over 100 episodes drops significantly — length fatigue is real.',
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
					text: 'Before 2016, isekai (transported to another world) was a niche genre. After 2016, it accounts for 15% of all new anime. The data doesn\'t lie — we\'re living in the isekai era.',
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
					text: 'When a Quebec transit operator needed real-time visibility into their operations, they had data — lots of it. GTFS-RT feeds streaming vehicle positions, trip updates, and service alerts every 15 seconds. What they didn\'t have was a way to turn that firehose into decisions.',
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
	'lorem-data-warehousing': {
		blocks: [
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Why Dimensional Modeling?' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: {
					text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				},
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					alignment: 'left',
					caption: '',
					text: 'The goal of a data warehouse is not to store data — it\'s to answer questions. Dimensional modeling makes questions easy.',
				},
				id: 'm00000004',
				type: 'quote',
			},
			{
				data: { level: 3, text: 'Fact Tables vs Dimension Tables' },
				id: 'm00000005',
				type: 'header',
			},
			{
				data: { text: 'Lorem ipsum dolor sit amet:' },
				id: 'm00000006',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Fact tables</b> hold the measurements (revenue, count, duration)',
							items: [],
						},
						{
							content: '<b>Dimension tables</b> hold the context (who, what, when, where)',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm00000007',
				type: 'nestedlist',
			},
			{
				data: {
					code: 'CREATE TABLE fact_orders (\n  order_id BIGINT PRIMARY KEY,\n  customer_key INT REFERENCES dim_customer(customer_key),\n  product_key INT REFERENCES dim_product(product_key),\n  date_key INT REFERENCES dim_date(date_key),\n  quantity INT NOT NULL,\n  revenue NUMERIC(12,2) NOT NULL\n);',
				},
				id: 'm00000008',
				type: 'code',
			},
			{
				data: { level: 2, text: 'The Grain Decision' },
				id: 'm00000009',
				type: 'header',
			},
			{
				data: {
					text: 'Excepteur sint occaecat cupidatat non proident. The grain defines the most atomic level of detail in your fact table. Get this wrong and everything built on top crumbles.',
				},
				id: 'm0000000a',
				type: 'paragraph',
			},
			{
				data: { level: 3, text: 'Common Mistakes' },
				id: 'm0000000b',
				type: 'header',
			},
			{
				data: {
					items: [
						{
							content: '<b>Too coarse</b> — aggregating before loading loses detail you\'ll need later',
							items: [],
						},
						{
							content: '<b>Too fine</b> — transaction-level grain on a slow-changing dimension creates massive tables',
							items: [],
						},
						{
							content: '<b>Mixed grains</b> — combining daily and monthly facts in one table causes join confusion',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm0000000c',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Building the Date Dimension' },
				id: 'm0000000d',
				type: 'header',
			},
			{
				data: {
					text: 'Every warehouse needs a date dimension. Here\'s a generator:',
				},
				id: 'm0000000e',
				type: 'paragraph',
			},
			{
				data: {
					code: 'INSERT INTO dim_date (date_key, full_date, year, quarter, month, day_of_week)\nSELECT\n  TO_CHAR(d, \'YYYYMMDD\')::INT,\n  d,\n  EXTRACT(YEAR FROM d),\n  EXTRACT(QUARTER FROM d),\n  EXTRACT(MONTH FROM d),\n  TO_CHAR(d, \'Day\')\nFROM generate_series(\'2020-01-01\'::DATE, \'2030-12-31\'::DATE, \'1 day\') AS d;',
				},
				id: 'm0000000f',
				type: 'code',
			},
			{
				data: { level: 2, text: 'Lessons Learned' },
				id: 'm0000000g',
				type: 'header',
			},
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				},
				id: 'm0000000h',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Start with the questions</b>, not the data',
							items: [],
						},
						{
							content: '<b>Denormalize intentionally</b> — warehouse != OLTP',
							items: [],
						},
						{
							content: '<a href="https://example.com">PostgreSQL dimensional modeling guide</a> for deeper reading',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000i',
				type: 'nestedlist',
			},
		],
		time: 1777235049361,
		version: '2.31.2',
	},
	'lorem-etl-patterns': {
		blocks: [
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Every data engineer has been woken up at 3am by a failing pipeline. These patterns help prevent that.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Pattern 1: Idempotent Loads' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: {
					text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. The single most important property of any pipeline: running it twice produces the same result as running it once.',
				},
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					code: '-- Idempotent upsert using ON CONFLICT\nINSERT INTO staging.events (event_id, payload, loaded_at)\nVALUES ($1, $2, NOW())\nON CONFLICT (event_id) DO UPDATE\nSET payload = EXCLUDED.payload,\n    loaded_at = NOW();',
				},
				id: 'm00000004',
				type: 'code',
			},
			{
				data: {
					alignment: 'left',
					caption: '',
					text: 'If your pipeline isn\'t idempotent, it\'s a ticking time bomb. It\'s not a matter of if it will run twice — it\'s when.',
				},
				id: 'm00000005',
				type: 'quote',
			},
			{
				data: { level: 2, text: 'Pattern 2: Schema-on-Read with JSONB' },
				id: 'm00000006',
				type: 'header',
			},
			{
				data: {
					text: 'Lorem ipsum dolor sit amet. Store raw data as JSONB first, parse later:',
				},
				id: 'm00000007',
				type: 'paragraph',
			},
			{
				data: {
					code: '-- Land raw data fast\nINSERT INTO raw.api_responses (source, payload)\nVALUES (\'stripe\', $1::JSONB);\n\n-- Parse when ready\nCREATE VIEW clean.payments AS\nSELECT\n  payload->>\'id\' AS payment_id,\n  (payload->>\'amount\')::NUMERIC / 100 AS amount_dollars,\n  (payload->>\'created\')::TIMESTAMPTZ AS created_at\nFROM raw.api_responses\nWHERE source = \'stripe\';',
				},
				id: 'm00000008',
				type: 'code',
			},
			{
				data: { level: 2, text: 'Pattern 3: Watermark Tracking' },
				id: 'm00000009',
				type: 'header',
			},
			{
				data: { text: 'Track what you\'ve already processed:' },
				id: 'm0000000a',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: 'Store the last processed timestamp/ID per source',
							items: [],
						},
						{
							content: 'On each run, fetch only records <b>after</b> the watermark',
							items: [],
						},
						{
							content: 'Update watermark only after successful processing',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000b',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Pattern 4: Dead Letter Queues' },
				id: 'm0000000c',
				type: 'header',
			},
			{
				data: {
					text: 'Not every record will parse cleanly. Instead of failing the entire batch:',
				},
				id: 'm0000000d',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: 'Try to process the record',
							items: [],
						},
						{
							content: 'On failure, write it to a <code>dead_letter</code> table with the error message',
							items: [],
						},
						{
							content: 'Continue processing the rest',
							items: [],
						},
						{
							content: 'Alert on dead letter count exceeding threshold',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm0000000e',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Pattern 5: Backfill by Design' },
				id: 'm0000000f',
				type: 'header',
			},
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit:',
				},
				id: 'm0000000g',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Partition by date</b> so you can reprocess one day without touching the rest',
							items: [],
						},
						{
							content: '<b>Parameterize date ranges</b> in every pipeline step',
							items: [],
						},
						{
							content: '<b>Log processed ranges</b> for auditability',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000h',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'Summary' },
				id: 'm0000000i',
				type: 'header',
			},
			{
				data: {
					text: 'These five patterns won\'t make your pipeline bulletproof, but they\'ll make the 3am pages a lot less frequent.',
				},
				id: 'm0000000j',
				type: 'paragraph',
			},
		],
		time: 1777235049363,
		version: '2.31.2',
	},
	'lorem-space-exploration': {
		blocks: [
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. I\'m not an aerospace engineer. I build data pipelines and SQL queries. But every time a rocket launches, I stop what I\'m doing and watch.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Engineering' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: {
					text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore:',
				},
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Falcon 9</b> lands on a drone ship in the ocean after delivering payload to orbit',
							items: [],
						},
						{
							content: '<b>James Webb Space Telescope</b> unfolds a sunshield the size of a tennis court, 1.5 million km from Earth',
							items: [],
						},
						{
							content: '<b>Ingenuity</b> flew a helicopter on Mars — a planet with 1% of Earth\'s atmosphere',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm00000004',
				type: 'nestedlist',
			},
			{
				data: {
					alignment: 'left',
					caption: '',
					text: 'Every one of these achievements started as a problem someone said was impossible. That\'s engineering.',
				},
				id: 'm00000005',
				type: 'quote',
			},
			{
				data: { level: 2, text: 'The Data' },
				id: 'm00000006',
				type: 'header',
			},
			{
				data: { text: 'Space generates incredible datasets:' },
				id: 'm00000007',
				type: 'paragraph',
			},
			{
				data: {
					code: '-- Hypothetical: querying exoplanet candidates\nSELECT\n  planet_name,\n  orbital_period_days,\n  radius_earth_radii,\n  equilibrium_temp_k\nFROM kepler_candidates\nWHERE\n  radius_earth_radii BETWEEN 0.8 AND 1.5\n  AND equilibrium_temp_k BETWEEN 200 AND 320\nORDER BY discovery_date DESC;',
				},
				id: 'm00000008',
				type: 'code',
			},
			{
				data: {
					text: 'The Kepler mission alone produced over 2,600 confirmed exoplanets from <b>150,000 stars</b> worth of light curves. That\'s a data pipeline problem at cosmic scale.',
				},
				id: 'm00000009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What Space Teaches About Software' },
				id: 'm0000000a',
				type: 'header',
			},
			{
				data: { text: 'Lorem ipsum dolor sit amet:' },
				id: 'm0000000b',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Redundancy matters</b> — spacecraft have backup systems for backup systems',
							items: [],
						},
						{
							content: '<b>Testing is non-negotiable</b> — you can\'t hotfix something in orbit',
							items: [],
						},
						{
							content: '<b>Constraints drive creativity</b> — limited bandwidth, power, and compute force elegant solutions',
							items: [],
						},
						{
							content: '<b>Long-term thinking</b> — missions are planned decades in advance',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm0000000c',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'The Pale Blue Dot' },
				id: 'm0000000d',
				type: 'header',
			},
			{
				data: {
					text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				},
				id: 'm0000000e',
				type: 'paragraph',
			},
			{
				data: { text: 'Carl Sagan said it best:' },
				id: 'm0000000f',
				type: 'paragraph',
			},
			{
				data: {
					alignment: 'left',
					caption: '',
					text: 'Look again at that dot. That\'s here. That\'s home. That\'s us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives.',
				},
				id: 'm0000000g',
				type: 'quote',
			},
			{
				data: {
					text: 'I look up because it reminds me that the problems I solve with SQL and Python are small — but they\'re still worth solving well.',
				},
				id: 'm0000000h',
				type: 'paragraph',
			},
		],
		time: 1777235049368,
		version: '2.31.2',
	},
	'lorem-transit-future': {
		blocks: [
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. As someone who grew up taking the metro in Montreal and has ridden trains across Europe, the gap between what North America has and what it could have is staggering.',
				},
				id: 'm00000001',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The Current State' },
				id: 'm00000002',
				type: 'header',
			},
			{
				data: { text: 'Duis aute irure dolor in reprehenderit:' },
				id: 'm00000003',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Japan\'s Shinkansen</b> has been running since 1964. Zero fatal derailments.',
							items: [],
						},
						{
							content: '<b>France\'s TGV</b> connects Paris to Lyon in under 2 hours at 320 km/h.',
							items: [],
						},
						{
							content: '<b>Amtrak\'s Acela</b> tops out at 240 km/h but averages far less due to shared freight track.',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm00000004',
				type: 'nestedlist',
			},
			{
				data: {
					alignment: 'left',
					caption: '',
					text: 'The problem isn\'t speed — it\'s infrastructure. You can\'t run high-speed trains on 100-year-old freight corridors.',
				},
				id: 'm00000005',
				type: 'quote',
			},
			{
				data: { level: 2, text: 'Why It Matters' },
				id: 'm00000006',
				type: 'header',
			},
			{
				data: {
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit:',
				},
				id: 'm00000007',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Climate</b> — rail emits 80% less CO2 per passenger-km than flying',
							items: [],
						},
						{
							content: '<b>Urban development</b> — stations drive density, highways drive sprawl',
							items: [],
						},
						{
							content: '<b>Equity</b> — not everyone can drive or fly',
							items: [],
						},
						{
							content: '<b>Reliability</b> — trains run in weather that grounds planes',
							items: [],
						},
					],
					style: 'ordered',
				},
				id: 'm00000008',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'The Montreal-Toronto Corridor' },
				id: 'm00000009',
				type: 'header',
			},
			{
				data: { text: 'This is the most promising route in Canada:' },
				id: 'm0000000a',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Distance:</b> 540 km (similar to Paris–Lyon)',
							items: [],
						},
						{
							content: '<b>Current train time:</b> 5+ hours',
							items: [],
						},
						{
							content: '<b>Potential HSR time:</b> ~2.5 hours',
							items: [],
						},
						{
							content: '<b>Air shuttle time:</b> ~1 hour (plus 2+ hours of airport overhead)',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000b',
				type: 'nestedlist',
			},
			{
				data: {
					text: 'At 2.5 hours city-center to city-center, the train wins. That\'s the magic threshold where rail beats air for total journey time.',
				},
				id: 'm0000000c',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What Needs to Happen' },
				id: 'm0000000d',
				type: 'header',
			},
			{
				data: { text: 'Lorem ipsum dolor sit amet:' },
				id: 'm0000000e',
				type: 'paragraph',
			},
			{
				data: {
					items: [
						{
							content: '<b>Dedicated right-of-way</b> — separated from freight, no sharing',
							items: [],
						},
						{
							content: '<b>Political will</b> — infrastructure projects span election cycles',
							items: [],
						},
						{
							content: '<b>Funding model</b> — public investment with operating cost recovery',
							items: [],
						},
						{
							content: '<b>Phased delivery</b> — start with one corridor, prove the model, expand',
							items: [],
						},
					],
					style: 'unordered',
				},
				id: 'm0000000f',
				type: 'nestedlist',
			},
			{
				data: { level: 2, text: 'My Hope' },
				id: 'm0000000g',
				type: 'header',
			},
			{
				data: {
					text: 'Excepteur sint occaecat cupidatat non proident. I believe we\'ll see high-speed rail between Montreal and Toronto in my lifetime. The economics make sense. The climate demands it. The only question is whether we\'ll build it before or after the next generation gives up on trains entirely.',
				},
				id: 'm0000000h',
				type: 'paragraph',
			},
		],
		time: 1777235049370,
		version: '2.31.2',
	},
	'why-i-left-orm-for-raw-sql': {
		blocks: [
			{
				data: {
					text: 'For years, I relied on ORMs — SQLAlchemy, Django ORM, Prisma. They promised productivity. They delivered abstraction. But somewhere along the way, I stopped understanding what my database was actually doing.',
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
							content: '<b>You need to know your database.</b> ORMs hide the database behind an abstraction. That\'s fine until the abstraction leaks — and it always leaks.',
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
