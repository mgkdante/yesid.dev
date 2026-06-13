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
	education: [
		{
			icon: 'champlain',
			program: { en: 'DEC, Accounting & Management Technology' },
			school: { en: 'Champlain Regional College, Lennoxville' },
		},
		{
			icon: 'bishops',
			program: {
				en: 'B.Sc. Computer Science, minor in Business Administration',
			},
			school: { en: 'Bishop\'s University' },
		},
	],
	identity: {
		headshot: '/images/about/headshot.webp',
		name: { en: 'Yesid' },
		polaroids: [
			{
				alt: { en: 'Walking with my dog in Montreal' },
				caption: { en: 'Off-duty mode' },
				rotate: -3,
				src: '/images/about/polaroid-1.webp',
			},
			{
				alt: { en: 'Dante, the family dog' },
				caption: { en: 'Dante, the family\'s good boy' },
				rotate: 3,
				src: '/images/about/polaroid-dante.webp',
			},
			{
				alt: { en: 'Poupoune, my dog' },
				caption: { en: 'Poupoune 🐾' },
				rotate: -2,
				src: '/images/about/polaroid-poupoune.webp',
			},
			{
				alt: { en: 'Yesid' },
				caption: { en: 'That\'s me' },
				rotate: 2,
				src: '/images/about/polaroid-yesid.webp',
			},
			{
				alt: { en: 'With my family' },
				caption: { en: 'Family' },
				rotate: -4,
				src: '/images/about/polaroid-family.webp',
			},
			{
				alt: { en: 'With friends' },
				caption: { en: 'Friends' },
				rotate: 3,
				src: '/images/about/polaroid-friends.webp',
			},
			{
				alt: { en: 'At the art museum in Ottawa' },
				caption: { en: 'Museum day, Ottawa' },
				rotate: -3,
				src: '/images/about/polaroid-museum.webp',
			},
		],
		title: { en: 'Curious builder, lifelong tinkerer' },
		valueProp: {
			en: 'I\'m Yesid (Yesito to my friends). I was born in Zipaquirá, Colombia, and grew up in Sherbrooke, Québec from the age of ten. I\'ve been pulling computers apart since I was a kid. The family\'s first PC showed up in 2002, and by 2005 I was tinkering with it so much my mom would get mad. These days I\'m proud to be her engineer #1. That curiosity never left. Now I build clear systems and explain them in plain words, so you always know exactly what you\'re getting.',
		},
	},
	interests: [
		{
			id: 'anime',
			image: '/images/about/interests/anime.webp',
			label: { en: 'Anime' },
		},
		{
			id: 'transit',
			image: '/images/about/interests/transit.webp',
			label: { en: 'Transit' },
		},
		{
			id: 'space',
			image: '/images/about/interests/space.webp',
			label: { en: 'Space' },
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
	languages: ['Français', 'English', 'Español'],
	meta: {
		description: {
			en: 'Freelance digital infrastructure engineer based in Montreal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that ship.',
		},
		title: { en: 'About · yesid.' },
	},
	methodology: [
		{
			description: {
				en: 'I take things apart to learn how they work, then build better ones.',
			},
			id: 'curiosity',
			label: { en: 'CURIOSITY' },
			station: 1,
		},
		{
			description: { en: 'If it works but it\'s ugly, it\'s only half done.' },
			id: 'aesthetics',
			label: { en: 'AESTHETICS' },
			station: 2,
		},
		{
			description: {
				en: 'Good tools lift the people around them. That\'s the whole point.',
			},
			id: 'community',
			label: { en: 'COMMUNITY' },
			station: 3,
		},
		{
			description: { en: 'I\'d rather build it right than build it twice.' },
			id: 'quality',
			label: { en: 'QUALITY' },
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
		clients: { en: 'LANGUAGES' },
		identity: { en: 'IDENTITY' },
		interests: { en: 'INTERESTS' },
		location: { en: 'LOCATION' },
		metrics: { en: 'METRICS' },
		next: { en: 'NEXT' },
		process: { en: 'CORE BELIEFS' },
		snapshots: { en: 'SNAPSHOTS' },
		stack: { en: 'EDUCATION' },
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
			author: 'Guy Sensei',
			company: 'Personal lore',
			quote: {
				en: 'You have the gift of perseverance, and that\'s what makes you a genius too.',
			},
			role: { en: 'Sensei' },
		},
	],
	weather: {
		city: { en: 'Montreal' },
		enabled: true,
		hook: { en: 'Guess where I am?' },
	},
};
