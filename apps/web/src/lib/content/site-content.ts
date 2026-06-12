// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Home-page block content (hero, manifesto, proof reel, services grid, about teaser, CTA, closer).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { HeroAnimContent, HeroContent, ManifestoContent, ProofReelContent, ServicesGridContent, AboutIntroContent, CtaContent, CloserContent } from '$lib/types';

export const heroAnimContent: HeroAnimContent = {
	scrollDown: { en: 'NEXT STOP: SCROLL DOWN' },
};

export const heroContent: HeroContent = {
	ctaContact: { en: 'Let\'s talk' },
	ctaWork: { en: 'See how I build →' },
	headline: {
		ariaSuffix: { en: 'Don\'t Break.' },
		line1: { en: 'SYSTEMS THAT' },
		line2: { en: 'DON\'T BREAK.' },
	},
	heroAnim: {
		scrollDown: { en: 'NEXT STOP: SCROLL DOWN' },
	},
	refreshButton: {
		helper: {
			en: 'Refreshes metrics + query results from the live pipeline',
		},
		label: { en: 'PULL FRESH DATA' },
	},
	sqlPanel: {
		columns: {
			avgDelayS: { en: 'avg_delay_s' },
			route: { en: 'route' },
			vehicles: { en: 'vehicles' },
		},
		liveLabel: { en: 'LIVE' },
		metaTemplate: { en: '5 rows · {queryTime}s · updated {updatedAgo}' },
		prompt: { en: 'yesid@transit:gold>' },
	},
	subheadline: { en: 'I make data tell the truth.' },
	subtitle: {
		en: 'Building reliable infrastructure for teams that can\'t afford downtime.',
	},
};

export const manifestoContent: ManifestoContent = {
	edgeBottom: {
		connected: { en: 'CONNECTED' },
		line: { en: 'LIGNE ORANGE' },
		scrollHint: { en: 'SCROLL ↓' },
		url: { en: 'yesid.dev' },
		version: { en: 'v2.0' },
	},
	edgeLeft: {
		location: { en: 'MTL—QC' },
		sectionName: { en: 'MANIFESTO' },
		sectionNumber: { en: 'SEC—02' },
	},
	edgeRight: {
		dst: { en: 'DST Montréal, QC' },
		lat: { en: 'LAT 45.5017°N' },
		lng: { en: 'LNG 73.5673°W' },
		node: { en: 'NODE berri-uqam' },
		src: { en: 'SRC Sherbrooke, QC' },
		status: { en: 'STATUS active' },
		via: { en: 'VIA Lennoxville, QC' },
	},
	hiddenTransitLines: [
		{
			color: '#003DA5',
			name: { en: 'LIGNE BLEUE' },
		},
		{
			color: '#008F4F',
			name: { en: 'LIGNE VERTE' },
		},
		{
			color: '#F0CB00',
			name: { en: 'LIGNE JAUNE' },
		},
		{
			color: '#78BE20',
			name: { en: 'REM' },
		},
		{
			color: '#DA291C',
			name: { en: '11 VAUDREUIL/HUDSON' },
		},
		{
			color: '#009B3A',
			name: { en: '12 SAINT-JÉRÔME' },
		},
		{
			color: '#FFD100',
			name: { en: '13 MONT-SAINT-HILAIRE' },
		},
		{
			color: '#7B2D8E',
			name: { en: '14 CANDIAC' },
		},
		{
			color: '#0072CE',
			name: { en: '15 MASCOUCHE' },
		},
	],
	pills: [
		{
			label: { en: 'databases' },
			serviceId: 'database-engineering',
		},
		{
			label: { en: 'pipelines' },
			serviceId: 'data-pipeline',
		},
		{
			label: { en: 'dashboards' },
			serviceId: 'analytics-reporting',
		},
		{
			label: { en: 'websites' },
			serviceId: 'web-development',
		},
	],
	statement: {
		line1: { en: 'I BUILD THE' },
		line3Highlight: { en: 'OPERATIONS' },
		line3Part1: { en: 'YOUR' },
		line3Part2: { en: 'RUN ON' },
		lineHuge: { en: 'INFRASTRUCTURE' },
	},
	terminal: {
		command: { en: ':~$ cat manifesto.md' },
		user: { en: 'yesid@mtl' },
	},
	ticks: ['0', '80', '160', '240', '320', '400', '480'],
	transit: {
		arrivalLabel: { en: 'PROCHAIN / NEXT' },
		directionBadge: { en: 'DIRECTION: CENTRE-VILLE' },
		platformBadge: { en: 'QUAI / PLATFORM 2' },
	},
};

export const proofReelContent: ProofReelContent = {
	heading: { en: 'PROOF' },
	headingDot: { en: '.' },
	images: {
		'transit-data-pipeline': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
		'yesid-dev': 'https://cms.yesid.dev/assets/8b57ccd1-bed1-46ae-bb24-a887714a8bcc?key=card-600',
	},
	sectionLabel: { en: '// PROOF' },
	slugs: ['transit-data-pipeline', 'yesid-dev'],
	subheading: { en: 'SELECTED WORK' },
	toggleColorAria: { en: 'Toggle color for {title}' },
	viewAllHref: '/projects',
	viewAllLabel: { en: 'View all projects →' },
};

export const servicesGridContent: ServicesGridContent = {
	heading: { en: 'SERVICES' },
	headingDot: { en: '.' },
	subheading: { en: 'WHAT I BUILD' },
	viewAllLink: { en: 'View all services →' },
	viewIllustrationAria: { en: 'View {title} illustration' },
};

export const aboutContent: AboutIntroContent = {
	bio: {
		en: 'Montreal, QC — I bring data, make it tell stories, and build the systems it moves through.',
	},
	interests: {
		en: 'Anime · Data viz · Open source · Montreal food scene',
	},
	interestsLabel: { en: 'INTERESTS' },
	location: {
		city: { en: 'Montreal' },
		region: { en: 'QC, Canada' },
	},
	locationLabel: { en: 'LOCATION' },
	moreLink: { en: '→ More about me' },
	name: { en: 'Yesid O.' },
	stackItems: [],
	stackLabel: { en: 'STACK' },
	title: { en: 'Freelance Digital Infrastructure Engineer' },
};

export const ctaContent: CtaContent = {
	ctaContact: { en: 'Get in touch' },
	ctaGithub: { en: 'View on GitHub' },
	heading: { en: 'Let\'s build something\nthat moves' },
	subtitle: {
		en: 'Have a data problem? Let\'s talk. Available for freelance projects and consulting.',
	},
};

export const closerContent: CloserContent = {
	attribution: {
		text: { en: 'Graffiti Vectors by Vecteezy' },
		url: 'https://www.vecteezy.com/free-vector/graffiti',
	},
	cta: {
		href: '/contact',
		label: { en: 'Initialize connection' },
	},
	heading: { en: 'TERMINUS' },
	headingDot: { en: '.' },
	rows: {
		about: {
			action: { en: 'cd' },
			description: { en: 'Yesid O. · Montreal' },
			label: { en: 'ABOUT' },
		},
		connect: {
			action: { en: 'GO' },
			description: { en: 'GitHub · open-source work' },
			label: { en: 'EXPLORE' },
		},
		contact: {
			action: { en: 'GO' },
			description: { en: 'Start a project together' },
			label: { en: 'CONTACT' },
		},
		read: {
			action: { en: 'cd' },
			label: { en: 'READ' },
		},
	},
	subheading: { en: 'END OF LINE' },
	terminal: {
		city: { en: 'Montreal, QC' },
		destinationsLabel: { en: '{count} destinations' },
		encoding: { en: 'UTF-8' },
		prompt: { en: '// where to next?' },
		title: { en: 'yesid@terminus:~/destinations' },
	},
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'site-content'.
export * from './site-content.companion';
