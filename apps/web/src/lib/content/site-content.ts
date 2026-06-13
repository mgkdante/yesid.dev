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
	scrollDown: {
		en: 'NEXT STOP: SCROLL DOWN',
		fr: 'PROCHAIN ARRÊT : FAIS DÉFILER',
	},
};

export const heroContent: HeroContent = {
	ctaContact: { en: 'Let\'s talk', fr: 'Parlons-en' },
	ctaWork: { en: 'See how I build →', fr: 'Vois comment je bâtis →' },
	headline: {
		ariaSuffix: { en: 'Don\'t Break.', fr: 'Ne cassent pas.' },
		line1: { en: 'SYSTEMS THAT', fr: 'DES SYSTÈMES QUI' },
		line2: { en: 'DON\'T BREAK', fr: 'NE CASSENT PAS' },
	},
	heroAnim: {
		scrollDown: {
			en: 'NEXT STOP: SCROLL DOWN',
			fr: 'PROCHAIN ARRÊT : FAIS DÉFILER',
		},
	},
	refreshButton: {
		helper: {
			en: 'Refreshes metrics + query results from the live pipeline',
			fr: 'Rafraîchit les métriques et les résultats de requête à partir du pipeline en direct',
		},
		label: { en: 'PULL FRESH DATA', fr: 'TIRER DES DONNÉES FRAÎCHES' },
	},
	sqlPanel: {
		columns: {
			avgDelayS: { en: 'avg_delay_s', fr: 'avg_delay_s' },
			route: { en: 'route', fr: 'route' },
			vehicles: { en: 'vehicles', fr: 'vehicles' },
		},
		liveLabel: { en: 'LIVE', fr: 'EN DIRECT' },
		metaTemplate: {
			en: '5 rows · {queryTime}s · updated {updatedAgo}',
			fr: '5 lignes · {queryTime}s · mis à jour {updatedAgo}',
		},
		prompt: { en: 'yesid@transit:gold>', fr: 'yesid@transit:gold>' },
	},
	subheadline: {
		en: 'I make data tell the truth.',
		fr: 'Je fais parler les données, pour vrai.',
	},
	subtitle: {
		en: 'Building reliable infrastructure for teams that can\'t afford downtime.',
		fr: 'Je bâtis de l\'infrastructure fiable pour les équipes qui n\'ont pas les moyens d\'avoir des pannes.',
	},
};

export const manifestoContent: ManifestoContent = {
	edgeBottom: {
		connected: { en: 'CONNECTED', fr: 'CONNECTÉ' },
		line: { en: 'LIGNE ORANGE', fr: 'LIGNE ORANGE' },
		scrollHint: { en: 'SCROLL ↓', fr: 'DÉFILER ↓' },
		url: { en: 'yesid.dev', fr: 'yesid.dev' },
		version: { en: 'v2.0', fr: 'v2.0' },
	},
	edgeLeft: {
		location: { en: 'MTL-QC', fr: 'MTL-QC' },
		sectionName: { en: 'MANIFESTO', fr: 'MANIFESTE' },
		sectionNumber: { en: 'SEC-02', fr: 'SEC-02' },
	},
	edgeRight: {
		dst: { en: 'DST Montréal, QC', fr: 'DST Montréal, QC' },
		lat: { en: 'LAT 45.5017°N', fr: 'LAT 45.5017°N' },
		lng: { en: 'LNG 73.5673°W', fr: 'LNG 73.5673°W' },
		node: { en: 'NODE berri-uqam', fr: 'NODE berri-uqam' },
		src: { en: 'SRC Sherbrooke, QC', fr: 'SRC Sherbrooke, QC' },
		status: { en: 'STATUS active', fr: 'STATUS active' },
		via: { en: 'VIA Lennoxville, QC', fr: 'VIA Lennoxville, QC' },
	},
	hiddenTransitLines: [
		{
			color: '#003DA5',
			name: { en: 'LIGNE BLEUE', fr: 'LIGNE BLEUE' },
		},
		{
			color: '#008F4F',
			name: { en: 'LIGNE VERTE', fr: 'LIGNE VERTE' },
		},
		{
			color: '#F0CB00',
			name: { en: 'LIGNE JAUNE', fr: 'LIGNE JAUNE' },
		},
		{
			color: '#78BE20',
			name: { en: 'REM', fr: 'REM' },
		},
		{
			color: '#DA291C',
			name: { en: '11 VAUDREUIL/HUDSON', fr: '11 VAUDREUIL/HUDSON' },
		},
		{
			color: '#009B3A',
			name: { en: '12 SAINT-JÉRÔME', fr: '12 SAINT-JÉRÔME' },
		},
		{
			color: '#FFD100',
			name: { en: '13 MONT-SAINT-HILAIRE', fr: '13 MONT-SAINT-HILAIRE' },
		},
		{
			color: '#7B2D8E',
			name: { en: '14 CANDIAC', fr: '14 CANDIAC' },
		},
		{
			color: '#0072CE',
			name: { en: '15 MASCOUCHE', fr: '15 MASCOUCHE' },
		},
	],
	pills: [
		{
			label: { en: 'databases', fr: 'bases de données' },
			serviceId: 'database-engineering',
		},
		{
			label: { en: 'pipelines', fr: 'pipelines' },
			serviceId: 'data-pipeline',
		},
		{
			label: { en: 'dashboards', fr: 'tableaux de bord' },
			serviceId: 'analytics-reporting',
		},
		{
			label: { en: 'websites', fr: 'sites web' },
			serviceId: 'web-development',
		},
	],
	statement: {
		line1: { en: 'I BUILD THE', fr: 'JE BÂTIS L\'' },
		line3Highlight: { en: 'OPERATIONS', fr: 'TES OPÉRATIONS' },
		line3Part1: { en: 'YOUR', fr: 'DONT' },
		line3Part2: { en: 'RUN ON', fr: 'ONT BESOIN' },
		lineHuge: { en: 'INFRASTRUCTURE', fr: 'INFRASTRUCTURE' },
	},
	terminal: {
		command: { en: ':~$ cat manifesto.md', fr: ':~$ cat manifesto.md' },
		user: { en: 'yesid@mtl', fr: 'yesid@mtl' },
	},
	ticks: ['0', '80', '160', '240', '320', '400', '480'],
	transit: {
		arrivalLabel: { en: 'PROCHAIN / NEXT', fr: 'PROCHAIN / NEXT' },
		directionBadge: {
			en: 'DIRECTION: CENTRE-VILLE',
			fr: 'DIRECTION: CENTRE-VILLE',
		},
		platformBadge: { en: 'QUAI / PLATFORM 2', fr: 'QUAI / PLATFORM 2' },
	},
};

export const proofReelContent: ProofReelContent = {
	heading: { en: 'PROOF', fr: 'PREUVES' },
	headingDot: { en: '.', fr: '.' },
	images: {
		'transit-data-pipeline': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
		'yesid-dev': 'https://cms.yesid.dev/assets/8b57ccd1-bed1-46ae-bb24-a887714a8bcc?key=card-600',
	},
	sectionLabel: { en: '// PROOF', fr: '// PREUVES' },
	slugs: ['transit-data-pipeline', 'yesid-dev'],
	subheading: { en: 'SELECTED WORK', fr: 'TRAVAUX CHOISIS' },
	toggleColorAria: {
		en: 'Toggle color for {title}',
		fr: 'Activer la couleur pour {title}',
	},
	viewAllHref: '/projects',
	viewAllLabel: { en: 'View all projects →', fr: 'Voir tous les projets →' },
};

export const servicesGridContent: ServicesGridContent = {
	heading: { en: 'SERVICES', fr: 'SERVICES' },
	headingDot: { en: '.', fr: '.' },
	subheading: { en: 'WHAT I BUILD', fr: 'CE QUE JE BÂTIS' },
	viewAllLink: {
		en: 'View all services →',
		fr: 'Voir tous les services →',
	},
	viewIllustrationAria: {
		en: 'View {title} illustration',
		fr: 'Voir l\'illustration de {title}',
	},
};

export const aboutContent: AboutIntroContent = {
	bio: {
		en: 'Montreal, QC, I bring data, make it tell stories, and build the systems it moves through.',
		fr: 'Montréal, QC. Je prends la donnée, je lui fais raconter des histoires, et je bâtis les systèmes dans lesquels elle circule.',
	},
	interests: {
		en: 'Anime · Data viz · Open source · Montreal food scene',
		fr: 'Anime · Visualisation de données · Open source · Scène bouffe de Montréal',
	},
	interestsLabel: { en: 'INTERESTS', fr: 'INTÉRÊTS' },
	location: {
		city: { en: 'Montreal', fr: 'Montréal' },
		region: { en: 'QC, Canada', fr: 'QC, Canada' },
	},
	locationLabel: { en: 'LOCATION', fr: 'EMPLACEMENT' },
	moreLink: { en: '→ More about me', fr: '→ En savoir plus sur moi' },
	name: { en: 'Yesid O.', fr: 'Yesid O.' },
	stackItems: [],
	stackLabel: { en: 'STACK', fr: 'STACK' },
	title: {
		en: 'Freelance Digital Infrastructure Engineer',
		fr: 'Ingénieur en infrastructure numérique, à la pige',
	},
};

export const ctaContent: CtaContent = {
	ctaContact: { en: 'Get in touch', fr: 'Parlons-en' },
	ctaGithub: { en: 'View on GitHub', fr: 'Voir sur GitHub' },
	heading: {
		en: 'Let\'s build something\nthat moves',
		fr: 'Bâtissons quelque chose\nqui avance',
	},
	subtitle: {
		en: 'Have a data problem? Let\'s talk.',
		fr: 'Un problème de données? Parlons-en.',
	},
};

export const closerContent: CloserContent = {
	attribution: {
		text: {
			en: 'Graffiti Vectors by Vecteezy',
			fr: 'Graffiti Vectors by Vecteezy',
		},
		url: 'https://www.vecteezy.com/free-vector/graffiti',
	},
	cta: {
		href: '/contact',
		label: {
			en: 'Initialize connection',
			fr: 'Initialiser la connexion',
		},
	},
	heading: { en: 'TERMINUS', fr: 'TERMINUS' },
	headingDot: { en: '.', fr: '.' },
	rows: {
		about: {
			action: { en: 'cd', fr: 'cd' },
			description: { en: 'Yesid O. · Montreal', fr: 'Yesid O. · Montréal' },
			label: { en: 'ABOUT', fr: 'À PROPOS' },
		},
		connect: {
			action: { en: 'GO', fr: 'GO' },
			description: {
				en: 'GitHub · open-source work',
				fr: 'GitHub · travail open-source',
			},
			label: { en: 'EXPLORE', fr: 'EXPLORER' },
		},
		contact: {
			action: { en: 'GO', fr: 'GO' },
			description: {
				en: 'Start a project together',
				fr: 'Partir un projet ensemble',
			},
			label: { en: 'CONTACT', fr: 'CONTACT' },
		},
		read: {
			action: { en: 'cd', fr: 'cd' },
			label: { en: 'READ', fr: 'LIRE' },
		},
	},
	subheading: { en: 'END OF LINE', fr: 'FIN DE LA LIGNE' },
	terminal: {
		city: { en: 'Montreal, QC', fr: 'Montréal, QC' },
		destinationsLabel: { en: '{count} destinations', fr: '{count} destinations' },
		encoding: { en: 'UTF-8', fr: 'UTF-8' },
		prompt: { en: '// where to next?', fr: '// on va où, là?' },
		title: {
			en: 'yesid@terminus:~/destinations',
			fr: 'yesid@terminus:~/destinations',
		},
	},
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'site-content'.
export * from './site-content.companion';
