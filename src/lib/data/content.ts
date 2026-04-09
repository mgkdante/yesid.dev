// Centralized UI content for i18n support.
// Every user-facing string on the site lives here as a LocalizedString.
// Components import from this module and call resolveLocale() — no
// hardcoded English strings in templates.

import type { LocalizedString, JourneyPanel } from './types.js';

export const heroAnimContent = {
	scrollDown: { en: 'NEXT STOP: SCROLL DOWN' } satisfies LocalizedString,
} as const;

export const heroContent = {
	badge: { en: 'AVAILABLE FOR HIRE' } satisfies LocalizedString,
	headline: {
		line1: { en: 'DIGITAL' } satisfies LocalizedString,
		line2: { en: 'INFRA' } satisfies LocalizedString,
		line3: { en: 'BUILT RIGHT.' } satisfies LocalizedString,
	},
	subtitle: {
		en: 'Freelance digital infrastructure — PostgreSQL, Python, Power BI, SvelteKit — from Montreal to your pipeline.'
	} satisfies LocalizedString,
	ctaWork: { en: 'View work →' } satisfies LocalizedString,
	ctaContact: { en: 'Get in touch' } satisfies LocalizedString,
	sqlDecoration: {
		line1: { en: 'SELECT  y.expertise' } satisfies LocalizedString,
		line2: { en: 'FROM    yesid AS y' } satisfies LocalizedString,
		line3: { en: "WHERE   y.work = 'Quality'" } satisfies LocalizedString,
	},
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
