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
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'blog'.
export * from './blog.companion';
