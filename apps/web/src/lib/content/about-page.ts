// About page content — data-driven, cloud-ready.
// Every user-facing string is a LocalizedString. Components import this
// module and call resolveLocale() — no hardcoded English strings in templates.
//
// Placeholder values are realistic stand-ins that read well on-screen.
// Yesid replaces them with real content when ready — zero component changes.

import type { AboutContent } from '$lib/types';
import { siteMeta } from './meta.js';

export const aboutPageContent: AboutContent = {
	identity: {
		name: { en: 'Yesid O.' },
		title: { en: 'Freelance Digital Infrastructure Engineer' },
		valueProp: {
			en: 'I help teams ship reliable digital infrastructure — from databases to dashboards to the pipelines between them.',
		},
		headshot: '/images/about/headshot.webp',
		polaroids: [
			{
				src: '/images/about/polaroid-1.webp',
				alt: { en: 'Walking with my dog in Montreal' },
				caption: { en: 'Off-duty mode' },
				rotate: -3,
			},
			{
				src: '/images/about/polaroid-2.webp',
				alt: { en: 'Yesid smiling' },
				caption: { en: 'The usual suspect' },
				rotate: 4,
			},
			{
				src: '/images/about/polaroid-3.webp',
				alt: { en: 'Portrait — Yesid Otalora' },
				caption: { en: 'Circa 2019' },
				rotate: -2,
			},
		],
	},

	metrics: [
		{ value: '5+', label: { en: 'years building data systems' } },
		{ value: '30+', label: { en: 'databases designed & optimized' } },
		{ value: '3x', label: { en: 'avg. query speed improvement' } },
		{ value: '99.9%', label: { en: 'pipeline uptime delivered' } },
	],

	methodology: [
		{
			id: 'audit',
			station: 1,
			label: { en: 'AUDIT' },
			description: { en: 'Map your current data landscape — what flows where, what breaks, and where the bottlenecks hide.' },
		},
		{
			id: 'optimize',
			station: 2,
			label: { en: 'OPTIMIZE' },
			description: { en: 'Redesign queries, schemas, and pipelines so your team gets clean data fast, every time.' },
		},
		{
			id: 'document',
			station: 3,
			label: { en: 'DOCUMENT' },
			description: { en: 'Write runbooks and architecture docs your team can actually follow without you in the room.' },
		},
		{
			id: 'handoff',
			station: 4,
			label: { en: 'HANDOFF' },
			description: { en: 'Transfer ownership cleanly. Your infra runs on its own — no vendor lock-in, no mystery code.' },
		},
	],

	testimonials: [
		{
			quote: { en: '"Cut our dashboard load time from 45 seconds to under 2. Yesid rebuilt the entire reporting pipeline in three weeks."' },
			author: 'Sarah Chen',
			role: { en: 'VP of Engineering' },
			company: 'Logistics Platform',
		},
		{
			quote: { en: '"First engineer we\'ve hired who actually documents everything. Our team was fully self-sufficient within a week of handoff."' },
			author: 'Marcus Tremblay',
			role: { en: 'CTO' },
			company: 'FinTech Startup',
		},
		{
			quote: { en: '"We went from spreadsheet chaos to a proper data pipeline. The whole analytics team noticed the difference on day one."' },
			author: 'Priya Sharma',
			role: { en: 'Head of Analytics' },
			company: 'E-Commerce Co.',
		},
	],

	// Central tech stack source of truth — categorized, cascade-ready.
	// When Slice 14 (cloud layer) arrives, services/projects will reference these.
	techStack: [
		{ name: 'PostgreSQL', category: 'databases', relatedServices: ['sql-development', 'database-engineering'] },
		{ name: 'SQL Server', category: 'databases', relatedServices: ['sql-development', 'database-engineering'] },
		{ name: 'Python', category: 'languages', relatedServices: ['data-pipelines', 'analytics'] },
		{ name: 'TypeScript', category: 'languages', relatedServices: ['web-development', 'internal-tooling'] },
		{ name: 'SvelteKit', category: 'frameworks', relatedServices: ['web-development'] },
		{ name: 'Power BI', category: 'tools', relatedServices: ['analytics'] },
		{ name: 'Retool', category: 'tools', relatedServices: ['internal-tooling'] },
		{ name: 'Docker', category: 'tools', relatedServices: ['data-pipelines', 'database-engineering'] },
	],

	// Diagonal strip interests — background images (B&W → color on hover).
	// Yesid provides real images later in static/images/about/interests/.
	interests: [
		{ id: 'anime', label: { en: 'Anime' }, image: '/images/about/interests/anime.webp' },
		{ id: 'dataviz', label: { en: 'Data Viz' }, image: '/images/about/interests/dataviz.webp' },
		{ id: 'opensource', label: { en: 'Open Source' }, image: '/images/about/interests/opensource.webp' },
		{ id: 'food', label: { en: 'MTL Food' }, image: '/images/about/interests/food.webp' },
	],

	weather: {
		city: { en: 'Montreal' },
		hook: { en: 'Guess where I am?' },
		enabled: true,
	},

	clientLogos: [
		{ name: 'Client 1', src: '/images/about/logo-1.svg' },
		{ name: 'Client 2', src: '/images/about/logo-2.svg' },
		{ name: 'Client 3', src: '/images/about/logo-3.svg' },
		{ name: 'Client 4', src: '/images/about/logo-4.svg' },
	],

	clientCount: 10,

	cta: {
		command: '$ yesid --contact',
		lines: [
			{ text: '> Ready for new projects', color: 'orange' },
			{ text: `> Email: ${siteMeta.links.email}`, color: 'muted' },
			{ text: `> GitHub: ${siteMeta.links.github}`, color: 'muted' },
			{ text: `> LinkedIn: ${siteMeta.links.linkedin ?? ''}`, color: 'muted' },
		],
		buttonLabel: { en: 'Send message →' },
		buttonHref: '/contact',
		availability: { en: 'Booking Q3 2026' },
		socials: [
			{ label: 'Email', href: `mailto:${siteMeta.links.email}`, icon: 'email' },
			{ label: 'GitHub', href: siteMeta.links.github, icon: 'github' },
			{ label: 'LinkedIn', href: siteMeta.links.linkedin ?? '', icon: 'linkedin' },
		],
	},

	// Stop labels — 10 bento cards in AboutPage, one per grid area. Source of
	// truth for the ALL-CAPS station labels; child components no longer carry
	// default `label = 'XXX'` values. Extracted in Task 17b-7g.
	stopLabels: {
		identity: { en: 'IDENTITY' },
		metrics: { en: 'METRICS' },
		testimonials: { en: 'TESTIMONIALS' },
		process: { en: 'PROCESS' },
		stack: { en: 'STACK' },
		clients: { en: 'CLIENTS' },
		interests: { en: 'INTERESTS' },
		snapshots: { en: 'SNAPSHOTS' },
		location: { en: 'LOCATION' },
		next: { en: 'NEXT' },
	},

	// Chrome labels used inside about-family components. Extracted in 17b-7g.
	labels: {
		clientsServed: { en: 'clients served' },
		polaroidPrevAria: { en: 'Previous photo' },
		polaroidNextAria: { en: 'Next photo' },
		testimonialsCarouselAria: { en: 'Client testimonials' },
		testimonialsTabNavAria: { en: 'Testimonial navigation' },
		testimonialSlideAria: { en: 'Testimonial {index} of {total}' },
		showTestimonialAria: { en: 'Show testimonial {index}' },
	},

	// HTML <title> + <meta description> for /about. Extracted in 17b-7k.
	meta: {
		title: { en: 'About — yesid.' },
		description: {
			en: 'Freelance digital infrastructure engineer based in Montreal. PostgreSQL, SQL Server, Python, Power BI — building reliable infrastructure for teams that ship.',
		},
	},
};
