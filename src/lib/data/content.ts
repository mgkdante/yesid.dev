// Centralized UI content for i18n support.
// Every user-facing string on the site lives here as a LocalizedString.
// Components import from this module and call resolveLocale() — no
// hardcoded English strings in templates.

import type { LocalizedString, JourneyPanel } from './types.js';

export const heroAnimContent = {
	scrollDown: { en: 'NEXT STOP: SCROLL DOWN' } satisfies LocalizedString,
} as const;

export const heroContent = {
	headline: {
		line1: { en: 'PIPELINES THAT' } satisfies LocalizedString,
		line2: { en: "DON'T BREAK." } satisfies LocalizedString,
	},
	subheadline: { en: 'Data that tell the truth.' } satisfies LocalizedString,
	subtitle: {
		en: "Building reliable infrastructure for teams that can't afford downtime.",
	} satisfies LocalizedString,
	ctaWork: { en: 'See how I build \u2192' } satisfies LocalizedString,
	ctaContact: { en: "Let's talk" } satisfies LocalizedString,
	sqlPanel: {
		prompt: { en: 'yesid@transit:gold>' } satisfies LocalizedString,
		liveLabel: { en: 'LIVE' } satisfies LocalizedString,
	},
	refreshButton: {
		label: { en: 'PULL FRESH DATA' } satisfies LocalizedString,
		helper: {
			en: 'Refreshes metrics + query results from the live pipeline',
		} satisfies LocalizedString,
	},
} as const;

export const manifestoContent = {
	statement: {
		line1: { en: 'I BUILD THE' } satisfies LocalizedString,
		lineHuge: { en: 'INFRASTRUCTURE' } satisfies LocalizedString,
		line3Part1: { en: 'YOUR' } satisfies LocalizedString,
		line3Highlight: { en: 'OPERATIONS' } satisfies LocalizedString,
		line3Part2: { en: 'RUN ON' } satisfies LocalizedString,
	},
	terminal: {
		user: { en: 'yesid@mtl' } satisfies LocalizedString,
		command: { en: ':~$ cat manifesto.md' } satisfies LocalizedString,
	},
	pills: [
		{ label: { en: 'pipelines' } satisfies LocalizedString, serviceId: 'data-pipeline' },
		{ label: { en: 'databases' } satisfies LocalizedString, serviceId: 'database-engineering' },
		{ label: { en: 'dashboards' } satisfies LocalizedString, serviceId: 'analytics-reporting' },
		{ label: { en: 'internal_tools' } satisfies LocalizedString, serviceId: 'internal-tooling' },
		{ label: { en: 'web_apps' } satisfies LocalizedString, serviceId: 'web-development' },
	],
	edgeLeft: {
		sectionNumber: { en: 'SEC—02' } satisfies LocalizedString,
		sectionName: { en: 'MANIFESTO' } satisfies LocalizedString,
		location: { en: 'MTL—QC' } satisfies LocalizedString,
	},
	edgeRight: {
		lat: { en: 'LAT 45.5017°N' } satisfies LocalizedString,
		lng: { en: 'LNG 73.5673°W' } satisfies LocalizedString,
		src: { en: 'SRC Sherbrooke, QC' } satisfies LocalizedString,
		via: { en: 'VIA Lennoxville, QC' } satisfies LocalizedString,
		dst: { en: 'DST Montréal, QC' } satisfies LocalizedString,
		node: { en: 'NODE berri-uqam' } satisfies LocalizedString,
		status: { en: 'STATUS active' } satisfies LocalizedString,
	},
	edgeBottom: {
		connected: { en: 'CONNECTED' } satisfies LocalizedString,
		line: { en: 'LIGNE ORANGE' } satisfies LocalizedString,
		url: { en: 'yesid.dev' } satisfies LocalizedString,
		version: { en: 'v2.0' } satisfies LocalizedString,
		scrollHint: { en: 'SCROLL ↓' } satisfies LocalizedString,
	},
	transit: {
		arrivalLabel: { en: 'PROCHAIN / NEXT' } satisfies LocalizedString,
		platformBadge: { en: 'QUAI / PLATFORM 2' } satisfies LocalizedString,
		directionBadge: { en: 'DIRECTION: CENTRE-VILLE' } satisfies LocalizedString,
	},
	ticks: ['0', '80', '160', '240', '320', '400', '480'],
	hiddenTransitLines: [
		{ name: { en: 'LIGNE BLEUE' } satisfies LocalizedString, color: '#003DA5' },
		{ name: { en: 'LIGNE VERTE' } satisfies LocalizedString, color: '#008F4F' },
		{ name: { en: 'LIGNE JAUNE' } satisfies LocalizedString, color: '#F0CB00' },
		{ name: { en: 'REM' } satisfies LocalizedString, color: '#78BE20' },
		{ name: { en: '11 VAUDREUIL/HUDSON' } satisfies LocalizedString, color: '#DA291C' },
		{ name: { en: '12 SAINT-JÉRÔME' } satisfies LocalizedString, color: '#009B3A' },
		{ name: { en: '13 MONT-SAINT-HILAIRE' } satisfies LocalizedString, color: '#FFD100' },
		{ name: { en: '14 CANDIAC' } satisfies LocalizedString, color: '#7B2D8E' },
		{ name: { en: '15 MASCOUCHE' } satisfies LocalizedString, color: '#0072CE' },
	],
} as const;

export const proofReelContent = {
	heading: { en: 'PROOF' } satisfies LocalizedString,
	headingDot: { en: '.' } satisfies LocalizedString,
	subheading: { en: 'SELECTED WORK' } satisfies LocalizedString,
	sectionLabel: { en: '// PROOF' } satisfies LocalizedString,
	viewAllLabel: { en: 'View all work \u2192' } satisfies LocalizedString,
	viewAllHref: '/work',
	slugs: ['transit-data-pipeline', 'lorem-analytics-dashboard', 'lorem-database-migration'] as const,
	// Placeholder images — replace with real project screenshots later.
	images: {
		'transit-data-pipeline': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop',
		'lorem-analytics-dashboard': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
		'lorem-database-migration': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
	},
} as const;

export const servicesGridContent = {
	heading: { en: 'SERVICES' } satisfies LocalizedString,
	headingDot: { en: '.' } satisfies LocalizedString,
	subheading: { en: 'WHAT I BUILD' } satisfies LocalizedString,
} as const;

export const aboutContent = {
	name: { en: 'Yesid O.' } satisfies LocalizedString,
	title: { en: 'Freelance Data Engineer' } satisfies LocalizedString,
	bio: {
		en: 'Montreal, QC — building digital infrastructure for teams that ship.'
	} satisfies LocalizedString,
	moreLink: { en: '→ More about me' } satisfies LocalizedString,
	stackLabel: { en: 'STACK' } satisfies LocalizedString,
	stackItems: ['PostgreSQL', 'SQL Server', 'Python', 'Power BI', 'Retool', 'SvelteKit'] as const,
	locationLabel: { en: 'LOCATION' } satisfies LocalizedString,
	location: {
		city: { en: 'Montreal' } satisfies LocalizedString,
		region: { en: 'QC, Canada' } satisfies LocalizedString,
	},
	interestsLabel: { en: 'INTERESTS' } satisfies LocalizedString,
	interests: {
		en: 'Anime · Data viz · Open source · Montreal food scene'
	} satisfies LocalizedString,
} as const;

export const ctaContent = {
	heading: {
		en: "Let's build something\nthat moves"
	} satisfies LocalizedString,
	subtitle: {
		en: "Have a data problem? Let's talk. Available for freelance projects and consulting."
	} satisfies LocalizedString,
	ctaContact: { en: 'Get in touch' } satisfies LocalizedString,
	ctaGithub: { en: 'View on GitHub' } satisfies LocalizedString,
} as const;

// Data-driven panels for the horizontal skills journey section.
// Adding or removing a skill means editing this array only — zero component changes.
// Each panel maps to one "stop" in the metro metaphor: a label, body text,
// words to animate, and the skills shown at that stop.
export const skillsJourneyPanels: readonly JourneyPanel[] = [
	{
		id: 'foundation',
		label: { en: '01 — FOUNDATION' },
		text: { en: 'Every system starts at the foundation' },
		highlightWords: ['foundation'],
		highlightEffect: 'scale',
		skills: [
			{ id: 'sql', name: 'SQL', subtitle: 'PostgreSQL · SQL Server', icon: 'sql' },
		],
	},
	{
		id: 'routes',
		label: { en: '02 — ROUTES' },
		text: { en: 'Routes that move data, logic, and pixels' },
		highlightWords: ['data', 'logic', 'pixels'],
		highlightEffect: 'charReveal',
		skills: [
			{ id: 'typescript', name: 'TypeScript', icon: 'typescript' },
			{ id: 'python', name: 'Python', icon: 'python' },
		],
	},
	{
		id: 'stations',
		label: { en: '03 — STATIONS' },
		text: { en: 'Stations where users stop and understand' },
		highlightWords: ['Stations', 'understand'],
		highlightEffect: 'wave',
		skills: [
			{ id: 'sveltekit', name: 'SvelteKit', icon: 'sveltekit' },
			{ id: 'powerbi', name: 'Power BI', icon: 'powerbi' },
		],
	},
	{
		id: 'motion',
		label: { en: '04 — MOTION' },
		text: { en: 'The motion that makes the ride unforgettable' },
		highlightWords: ['motion', 'unforgettable'],
		highlightEffect: 'gradient',
		skills: [
			{ id: 'gsap', name: 'GSAP', icon: 'gsap' },
			{ id: 'docker', name: 'Docker', icon: 'docker' },
		],
	},
] as const;

export const skillsJourneyCta = {
	prompt: { en: 'Your next stop?' } satisfies LocalizedString,
	button: { en: "Let's build together →" } satisfies LocalizedString,
} as const;

export const closerContent = {
	heading: { en: 'TERMINUS' } satisfies LocalizedString,
	headingDot: { en: '.' } satisfies LocalizedString,
	subheading: { en: 'END OF LINE' } satisfies LocalizedString,
	cta: {
		label: { en: 'Initialize connection' } satisfies LocalizedString,
		href: '/contact',
	},
	rows: {
		contact: {
			label: { en: 'CONTACT' } satisfies LocalizedString,
			description: { en: 'Start a project together' } satisfies LocalizedString,
			action: { en: 'GO' } satisfies LocalizedString,
		},
		connect: {
			label: { en: 'EXPLORE' } satisfies LocalizedString,
			description: { en: 'GitHub \u00B7 open-source work' } satisfies LocalizedString,
			action: { en: 'GO' } satisfies LocalizedString,
		},
		read: {
			label: { en: 'READ' } satisfies LocalizedString,
			action: { en: 'cd' } satisfies LocalizedString,
		},
		about: {
			label: { en: 'ABOUT' } satisfies LocalizedString,
			description: { en: 'Yesid O. \u00B7 Montreal' } satisfies LocalizedString,
			action: { en: 'cd' } satisfies LocalizedString,
		},
	},
	attribution: {
		text: { en: 'Graffiti Vectors by Vecteezy' } satisfies LocalizedString,
		url: 'https://www.vecteezy.com/free-vector/graffiti',
	},
} as const;
