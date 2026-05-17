// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Blog posts (slugs, titles, excerpts, dates, tags, SVG illustration refs). Helpers + chrome live in blog.companion.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { BlogPost } from '$lib/types';

export const blogPosts: readonly BlogPost[] = [
	{
		animation: 'draw',
		category: 'professional',
		date: '2026-04-01',
		excerpt: 'After years of fighting with ORMs, I switched to raw SQL and never looked back. Here is what I learned about control, performance, and knowing your database.',
		external: false,
		lang: 'en',
		slug: 'why-i-left-orm-for-raw-sql',
		svg: 'pro-chart',
		tags: ['sql', 'postgresql', 'opinion'],
		title: 'Why I Left ORM for Raw SQL',
		url: '/blog/why-i-left-orm-for-raw-sql',
	},
	{
		animation: 'draw-fill',
		category: 'professional',
		date: '2026-03-20',
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. A practical walkthrough of dimensional modeling for analytics warehouses.',
		external: false,
		lang: 'en',
		slug: 'lorem-data-warehousing',
		svg: 'pro-code',
		tags: ['sql', 'warehousing'],
		title: 'Designing a Star Schema from Scratch',
		url: '/blog/lorem-data-warehousing',
	},
	{
		animation: 'morph',
		category: 'professional',
		date: '2026-03-15',
		excerpt: 'How I designed an ELT pipeline to process real-time GTFS feeds for a Quebec transit operator — from ingestion to dashboard.',
		external: false,
		lang: 'en',
		slug: 'building-a-transit-pipeline',
		svg: 'pro-code',
		tags: ['etl', 'postgresql', 'python', 'case-study'],
		title: 'Building a Transit Data Pipeline',
		url: '/blog/building-a-transit-pipeline',
	},
	{
		animation: 'draw',
		category: 'personal',
		date: '2026-03-10',
		excerpt: 'Lorem ipsum dolor sit amet. Why North America is decades behind on high-speed rail — and what it would take to catch up.',
		external: false,
		lang: 'en',
		slug: 'lorem-transit-future',
		svg: 'personal-globe',
		tags: ['transit', 'infrastructure'],
		title: 'The Future of High-Speed Rail in North America',
		url: '/blog/lorem-transit-future',
	},
	{
		animation: 'morph',
		category: 'professional',
		date: '2026-03-01',
		excerpt: 'I visualized 10 years of MyAnimeList data using SQL and Power BI. The results surprised me — and taught me something about storytelling with data.',
		external: false,
		lang: 'en',
		slug: 'anime-data-viz-challenge',
		svg: 'pro-chart',
		tags: ['dataviz', 'power-bi', 'fun'],
		title: 'The Anime Data Viz Challenge',
		url: '/blog/anime-data-viz-challenge',
	},
	{
		animation: 'draw-fill',
		category: 'professional',
		date: '2026-02-28',
		excerpt: 'Lorem ipsum dolor sit amet. Five battle-tested patterns for building data pipelines that don\'t break at 3am.',
		external: false,
		lang: 'fr',
		slug: 'lorem-etl-patterns',
		svg: 'pro-chart',
		tags: ['pipeline', 'etl'],
		title: 'ETL Patterns That Actually Scale',
		url: '/blog/lorem-etl-patterns',
	},
	{
		animation: 'morph',
		category: 'personal',
		date: '2026-02-15',
		excerpt: 'Lorem ipsum dolor sit amet. On the quiet joy of following space exploration as a software person who builds things on Earth.',
		external: false,
		lang: 'en',
		slug: 'lorem-space-exploration',
		svg: 'personal-telescope',
		tags: ['space', 'exploration'],
		title: 'Why I Still Look Up',
		url: '/blog/lorem-space-exploration',
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'blog'.
export * from './blog.companion';
