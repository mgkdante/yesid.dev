// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// /about page content (identity, metrics, methodology, testimonials, etc.).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { AboutContent } from '$lib/types';

export const aboutPageContent: AboutContent = {
	clientCount: 10,
	clientLogos: [
		{ name: 'Client 1', src: '/images/about/logo-1.svg' },
		{ name: 'Client 2', src: '/images/about/logo-2.svg' },
		{ name: 'Client 3', src: '/images/about/logo-3.svg' },
		{ name: 'Client 4', src: '/images/about/logo-4.svg' },
	],
	cta: {
		availability: { en: 'Booking Q3 2026' },
		buttonHref: '/contact',
		buttonLabel: { en: 'Send message →' },
		command: '$ yesid --contact',
		lines: [
			{ color: 'orange', text: '> Ready for new projects' },
			{ color: 'muted', text: '> Email: contact@yesid.dev' },
			{
				color: 'muted',
				text: '> GitHub: https://github.com/mgkdante',
			},
			{
				color: 'muted',
				text: '> LinkedIn: https://www.linkedin.com/in/otaloray/',
			},
		],
		socials: [
			{
				href: 'mailto:contact@yesid.dev',
				icon: 'email',
				label: 'Email',
			},
			{
				href: 'https://github.com/mgkdante',
				icon: 'github',
				label: 'GitHub',
			},
			{
				href: 'https://www.linkedin.com/in/otaloray/',
				icon: 'linkedin',
				label: 'LinkedIn',
			},
		],
	},
	identity: {
		headshot: '/images/about/headshot.webp',
		name: { en: 'Yesid O.' },
		polaroids: [
			{
				alt: { en: 'Walking with my dog in Montreal' },
				caption: { en: 'Off-duty mode' },
				rotate: -3,
				src: '/images/about/polaroid-1.webp',
			},
			{
				alt: { en: 'Yesid smiling' },
				caption: { en: 'The usual suspect' },
				rotate: 4,
				src: '/images/about/polaroid-2.webp',
			},
			{
				alt: { en: 'Portrait — Yesid Otalora' },
				caption: { en: 'Circa 2019' },
				rotate: -2,
				src: '/images/about/polaroid-3.webp',
			},
		],
		title: { en: 'Freelance Digital Infrastructure Engineer' },
		valueProp: {
			en: 'I help teams ship reliable digital infrastructure — from databases to dashboards to the pipelines between them.',
		},
	},
	interests: [
		{
			id: 'anime',
			image: '/images/about/interests/anime.webp',
			label: { en: 'Anime' },
		},
		{
			id: 'dataviz',
			image: '/images/about/interests/dataviz.webp',
			label: { en: 'Data Viz' },
		},
		{
			id: 'opensource',
			image: '/images/about/interests/opensource.webp',
			label: { en: 'Open Source' },
		},
		{
			id: 'food',
			image: '/images/about/interests/food.webp',
			label: { en: 'MTL Food' },
		},
	],
	labels: {
		clientsServed: { en: 'clients served' },
		polaroidNextAria: { en: 'Next photo' },
		polaroidPrevAria: { en: 'Previous photo' },
		showTestimonialAria: { en: 'Show testimonial {index}' },
		testimonialSlideAria: { en: 'Testimonial {index} of {total}' },
		testimonialsCarouselAria: { en: 'Client testimonials' },
		testimonialsTabNavAria: { en: 'Testimonial navigation' },
	},
	meta: {
		description: {
			en: 'Freelance digital infrastructure engineer based in Montreal. PostgreSQL, SQL Server, Python, Power BI — building reliable infrastructure for teams that ship.',
		},
		title: { en: 'About — yesid.' },
	},
	methodology: [
		{
			description: {
				en: 'Map your current data landscape — what flows where, what breaks, and where the bottlenecks hide.',
			},
			id: 'audit',
			label: { en: 'AUDIT' },
			station: 1,
		},
		{
			description: {
				en: 'Redesign queries, schemas, and pipelines so your team gets clean data fast, every time.',
			},
			id: 'optimize',
			label: { en: 'OPTIMIZE' },
			station: 2,
		},
		{
			description: {
				en: 'Write runbooks and architecture docs your team can actually follow without you in the room.',
			},
			id: 'document',
			label: { en: 'DOCUMENT' },
			station: 3,
		},
		{
			description: {
				en: 'Transfer ownership cleanly. Your infra runs on its own — no vendor lock-in, no mystery code.',
			},
			id: 'handoff',
			label: { en: 'HANDOFF' },
			station: 4,
		},
	],
	metrics: [
		{
			label: { en: 'years building data systems' },
			value: '5+',
		},
		{
			label: { en: 'databases designed & optimized' },
			value: '30+',
		},
		{
			label: { en: 'avg. query speed improvement' },
			value: '3x',
		},
		{
			label: { en: 'pipeline uptime delivered' },
			value: '99.9%',
		},
	],
	stopLabels: {
		clients: { en: 'CLIENTS' },
		identity: { en: 'IDENTITY' },
		interests: { en: 'INTERESTS' },
		location: { en: 'LOCATION' },
		metrics: { en: 'METRICS' },
		next: { en: 'NEXT' },
		process: { en: 'PROCESS' },
		snapshots: { en: 'SNAPSHOTS' },
		stack: { en: 'STACK' },
		testimonials: { en: 'TESTIMONIALS' },
	},
	techStack: [
		{
			category: 'databases',
			name: 'PostgreSQL',
			relatedServices: ['sql-development', 'database-engineering'],
		},
		{
			category: 'databases',
			name: 'SQL Server',
			relatedServices: ['sql-development', 'database-engineering'],
		},
		{
			category: 'languages',
			name: 'Python',
			relatedServices: ['data-pipelines', 'analytics'],
		},
		{
			category: 'languages',
			name: 'TypeScript',
			relatedServices: ['web-development', 'internal-tooling'],
		},
		{
			category: 'frameworks',
			name: 'SvelteKit',
			relatedServices: ['web-development'],
		},
		{
			category: 'tools',
			name: 'Power BI',
			relatedServices: ['analytics'],
		},
		{
			category: 'tools',
			name: 'Retool',
			relatedServices: ['internal-tooling'],
		},
		{
			category: 'tools',
			name: 'Docker',
			relatedServices: ['data-pipelines', 'database-engineering'],
		},
	],
	testimonials: [
		{
			author: 'Sarah Chen',
			company: 'Logistics Platform',
			quote: {
				en: '"Cut our dashboard load time from 45 seconds to under 2. Yesid rebuilt the entire reporting pipeline in three weeks."',
			},
			role: { en: 'VP of Engineering' },
		},
		{
			author: 'Marcus Tremblay',
			company: 'FinTech Startup',
			quote: {
				en: '"First engineer we\'ve hired who actually documents everything. Our team was fully self-sufficient within a week of handoff."',
			},
			role: { en: 'CTO' },
		},
		{
			author: 'Priya Sharma',
			company: 'E-Commerce Co.',
			quote: {
				en: '"We went from spreadsheet chaos to a proper data pipeline. The whole analytics team noticed the difference on day one."',
			},
			role: { en: 'Head of Analytics' },
		},
	],
	weather: {
		city: { en: 'Montreal' },
		enabled: true,
		hook: { en: 'Guess where I am?' },
	},
};
