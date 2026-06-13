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
	cta: {
		buttonHref: '/contact',
		buttonLabel: { en: 'Send message →', fr: 'Envoyer un message →' },
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
			program: {
				en: 'DEC, Accounting & Management Technology',
				fr: 'DEC, Techniques de comptabilité et de gestion',
			},
			school: {
				en: 'Champlain Regional College, Lennoxville',
				fr: 'Champlain Regional College, Lennoxville',
			},
		},
		{
			icon: 'bishops',
			program: {
				en: 'B.Sc. Computer Science, minor in Business Administration',
				fr: 'B. Sc. informatique, mineure en administration des affaires',
			},
			school: { en: "Bishop's University", fr: "Bishop's University" },
		},
	],
	identity: {
		headshot: '/images/about/headshot.webp',
		name: { en: 'Yesid', fr: 'Yesid' },
		polaroids: [
			{
				alt: { en: 'Walking with my dog in Montreal', fr: 'En promenade avec mon chien à Montréal' },
				caption: { en: 'Off-duty mode', fr: 'Mode relâche' },
				rotate: -3,
				src: '/images/about/polaroid-1.webp',
			},
			{
				alt: { en: 'Dante, the family dog', fr: 'Dante, le chien de la famille' },
				caption: { en: "Dante, the family's good boy", fr: 'Dante, le bon chien de la famille' },
				rotate: 3,
				src: '/images/about/polaroid-dante.webp',
			},
			{
				alt: { en: 'Poupoune, my dog', fr: 'Poupoune, mon chien' },
				caption: { en: 'Poupoune 🐾', fr: 'Poupoune 🐾' },
				rotate: -2,
				src: '/images/about/polaroid-poupoune.webp',
			},
			{
				alt: { en: 'Yesid', fr: 'Yesid' },
				caption: { en: "That's me", fr: "C'est moi" },
				rotate: 2,
				src: '/images/about/polaroid-yesid.webp',
			},
			{
				alt: { en: 'With my family', fr: 'Avec ma famille' },
				caption: { en: 'Family', fr: 'La famille' },
				rotate: -4,
				src: '/images/about/polaroid-family.webp',
			},
			{
				alt: { en: 'With friends', fr: 'Avec les amis' },
				caption: { en: 'Friends', fr: 'Les amis' },
				rotate: 3,
				src: '/images/about/polaroid-friends.webp',
			},
			{
				alt: { en: 'At the art museum in Ottawa', fr: "Au musée d'art à Ottawa" },
				caption: { en: 'Museum day, Ottawa', fr: 'Journée musée, Ottawa' },
				rotate: -3,
				src: '/images/about/polaroid-museum.webp',
			},
		],
		title: { en: 'Curious builder, lifelong tinkerer', fr: 'Bâtisseur curieux, bricoleur depuis toujours' },
		valueProp: {
			en: "I'm Yesid (Yesito to my friends). I was born in Zipaquirá, Colombia, and grew up in Sherbrooke, Québec from the age of ten. I've been pulling computers apart since I was a kid. The family's first PC showed up in 2002, and by 2005 I was tinkering with it so much my mom would get mad. These days I'm proud to be her engineer #1. That curiosity never left. Now I build clear systems and explain them in plain words, so you always know exactly what you're getting.",
			fr: "Je suis Yesid (Yesito pour mes chums). Je suis né à Zipaquirá, en Colombie, et j'ai grandi à Sherbrooke, au Québec, depuis l'âge de dix ans. Je démonte des ordinateurs depuis que je suis tout petit. Le premier PC de la famille est arrivé en 2002, et dès 2005 je le bricolais tellement que ma mère pognait les nerfs. Aujourd'hui, je suis fier d'être son ingénieur numéro un. Cette curiosité-là ne m'a jamais lâché. Astheure, je bâtis des systèmes clairs et je les explique en mots simples, comme ça tu sais toujours exactement ce que tu reçois.",
		},
	},
	interests: [
		{
			id: 'anime',
			image: '/images/about/interests/anime.webp',
			label: { en: 'Anime', fr: 'Anime' },
		},
		{
			id: 'transit',
			image: '/images/about/interests/transit.webp',
			label: { en: 'Transit', fr: 'Transport collectif' },
		},
		{
			id: 'space',
			image: '/images/about/interests/space.webp',
			label: { en: 'Space', fr: "L'espace" },
		},
		{
			id: 'food',
			image: '/images/about/interests/food.webp',
			label: { en: 'MTL Food', fr: 'Bouffe MTL' },
		},
	],
	labels: {
		polaroidNextAria: { en: 'Next photo', fr: 'Photo suivante' },
		polaroidPrevAria: { en: 'Previous photo', fr: 'Photo précédente' },
		showTestimonialAria: { en: 'Show testimonial {index}', fr: 'Afficher le témoignage {index}' },
		testimonialSlideAria: { en: 'Testimonial {index} of {total}', fr: 'Témoignage {index} sur {total}' },
		testimonialsCarouselAria: { en: 'Personal quote', fr: 'Citation personnelle' },
		testimonialsTabNavAria: { en: 'Quote navigation', fr: 'Navigation de citation' },
	},
	languages: ['Español', 'English', 'Français'],
	meta: {
		description: {
			en: 'Freelance digital infrastructure engineer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can\'t afford downtime.',
			fr: 'Ingénieur pigiste en infrastructure numérique basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l\'infrastructure fiable pour les équipes qui n\'ont pas les moyens d\'avoir des pannes.',
		},
		title: { en: 'About · yesid.', fr: 'À propos · yesid.' },
	},
	methodology: [
		{
			description: {
				en: 'I take things apart to learn how they work, then build better ones.',
				fr: "Je démonte les choses pour comprendre comment elles marchent, puis j'en construis de meilleures.",
			},
			id: 'curiosity',
			label: { en: 'CURIOSITY', fr: 'CURIOSITÉ' },
			station: 1,
		},
		{
			description: {
				en: "If it works but it's ugly, it's only half done.",
				fr: "Si ça fonctionne mais que c'est laid, ce n'est qu'à moitié fait.",
			},
			id: 'aesthetics',
			label: { en: 'AESTHETICS', fr: 'ESTHÉTIQUE' },
			station: 2,
		},
		{
			description: {
				en: 'Good tools lift the people around them, that’s the whole point.',
				fr: "Les bons outils élèvent les gens autour d'eux, c'est tout l'intérêt.",
			},
			id: 'community',
			label: { en: 'COMMUNITY', fr: 'COMMUNAUTÉ' },
			station: 3,
		},
		{
			description: {
				en: "I'd rather build it right than build it twice.",
				fr: 'Je préfère bien le bâtir que le bâtir deux fois.',
			},
			id: 'quality',
			label: { en: 'QUALITY', fr: 'QUALITÉ' },
			station: 4,
		},
	],
	metrics: [
		{
			label: { en: 'years building data systems', fr: 'années à bâtir des systèmes de données' },
			value: '5+',
		},
		{
			label: { en: 'databases designed & optimized', fr: 'bases de données conçues et optimisées' },
			value: '30+',
		},
		{
			label: { en: 'avg. query speed improvement', fr: 'amélioration moyenne des requêtes' },
			value: '3x',
		},
		{
			label: { en: 'pipeline uptime delivered', fr: 'disponibilité livrée sur les pipelines' },
			value: '99.9%',
		},
	],
	stopLabels: {
		clients: { en: 'LANGUAGES', fr: 'LANGUES' },
		identity: { en: 'IDENTITY', fr: 'IDENTITÉ' },
		interests: { en: 'INTERESTS', fr: 'INTÉRÊTS' },
		location: { en: 'LOCATION', fr: 'LOCALISATION' },
		metrics: { en: 'METRICS', fr: 'MESURES' },
		next: { en: 'NEXT', fr: 'SUITE' },
		process: { en: 'CORE BELIEFS', fr: 'CONVICTIONS' },
		snapshots: { en: 'SNAPSHOTS', fr: 'PHOTOS' },
		stack: { en: 'EDUCATION', fr: 'FORMATION' },
		testimonials: { en: 'QUOTE', fr: 'CITATION' },
	},
	testimonials: [
		{
			author: 'Guy Sensei',
			company: 'Personal lore',
			quote: {
				en: "You have the gift of perseverance, and that's what makes you a genius too.",
				fr: "Tu as le don de la persévérance, et c'est ce qui fait de toi un génie.",
			},
			role: { en: 'Sensei', fr: 'Gaï Sensei' },
		},
	],
	weather: {
		city: { en: 'Montreal', fr: 'Montréal' },
		enabled: true,
		hook: { en: 'Guess where I am?', fr: 'Devine où je suis?' },
	},
};
