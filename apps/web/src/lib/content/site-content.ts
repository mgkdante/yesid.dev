// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
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
		es: 'PRÓXIMA PARADA: SIGUE BAJANDO',
		fr: 'PROCHAIN ARRÊT : FAIS DÉFILER',
	},
};

export const heroContent: HeroContent = {
	ctaContact: {
		en: 'Book a 20-min intro call',
		es: 'Agenda tu llamada intro de 20 min',
		fr: 'Réserver un appel intro de 20 min',
	},
	ctaWork: {
		en: 'See how I build →',
		es: 'Mira cómo construyo →',
		fr: 'Vois comment je bâtis →',
	},
	headline: {
		ariaSuffix: {
			en: 'Don\'t Break.',
			es: 'No se rompen.',
			fr: 'Ne cassent pas.',
		},
		line1: {
			en: 'SYSTEMS THAT',
			es: 'SISTEMAS QUE',
			fr: 'DES SYSTÈMES QUI',
		},
		line2: {
			en: 'DON\'T BREAK',
			es: 'NO SE ROMPEN',
			fr: 'NE CASSENT PAS',
		},
	},
	heroAnim: {
		scrollDown: {
			en: 'NEXT STOP: SCROLL DOWN',
			es: 'PRÓXIMA PARADA: SIGUE BAJANDO',
			fr: 'PROCHAIN ARRÊT : FAIS DÉFILER',
		},
	},
	identity: {
		en: 'freelance digital infrastructure - Montreal',
		es: 'infraestructura digital freelance - Montreal',
		fr: 'infrastructure numérique à la pige - Montréal',
	},
	refreshButton: {
		helper: {
			en: 'Regenerates the metrics + query results. Simulated STM-style pipeline data, not a live feed.',
			es: 'Regenera las métricas y los resultados de la consulta. Datos simulados, estilo pipeline STM, no un feed en vivo.',
			fr: 'Régénère les métriques et les résultats de requête. Données simulées, style pipeline STM, pas un flux en direct.',
		},
		helperLive: {
			en: 'Refreshes metrics + query results from the live pipeline.',
			es: 'Actualiza las métricas y los resultados de la consulta desde el pipeline en vivo.',
			fr: 'Actualise les métriques et les résultats de requête depuis le pipeline en direct.',
		},
		label: {
			en: 'PULL FRESH DATA',
			es: 'TRAER DATOS FRESCOS',
			fr: 'TIRER DES DONNÉES FRAÎCHES',
		},
	},
	sqlPanel: {
		columns: {
			avgDelayS: { en: 'avg_delay_s', es: 'avg_delay_s', fr: 'avg_delay_s' },
			route: { en: 'route', es: 'route', fr: 'route' },
			vehicles: { en: 'vehicles', es: 'vehicles', fr: 'vehicles' },
		},
		liveBadge: { en: 'LIVE', es: 'EN VIVO', fr: 'EN DIRECT' },
		liveLabel: { en: 'DEMO', es: 'DEMO', fr: 'DÉMO' },
		metaTemplate: {
			en: '5 rows · {queryTime}s · {updatedAgo}',
			es: '5 filas · {queryTime}s · {updatedAgo}',
			fr: '5 lignes · {queryTime}s · {updatedAgo}',
		},
		prompt: {
			en: 'yesid@transit:gold>',
			es: 'yesid@transit:gold>',
			fr: 'yesid@transit:gold>',
		},
	},
	subheadline: {
		en: 'I make data tell the truth.',
		es: 'Hago que los datos digan la verdad.',
		fr: 'Je fais parler les données, pour vrai.',
	},
	subtitle: {
		en: 'Building reliable infrastructure for teams that can\'t afford downtime.',
		es: 'Construyo infraestructura confiable para equipos que no pueden darse el lujo de una caída.',
		fr: 'Je bâtis de l\'infrastructure fiable pour les équipes qui n\'ont pas les moyens d\'avoir des pannes.',
	},
};

export const manifestoContent: ManifestoContent = {
	edgeBottom: {
		connected: { en: 'CONNECTED', es: 'CONECTADO', fr: 'CONNECTÉ' },
		line: {
			en: 'LIGNE ORANGE',
			es: 'LIGNE ORANGE',
			fr: 'LIGNE ORANGE',
		},
		scrollHint: { en: 'SCROLL ↓', es: 'BAJA ↓', fr: 'DÉFILER ↓' },
		url: { en: 'yesid.dev', es: 'yesid.dev', fr: 'yesid.dev' },
		version: { en: 'v2.0', es: 'v2.0', fr: 'v2.0' },
	},
	edgeLeft: {
		location: { en: 'MTL-QC', es: 'MTL-QC', fr: 'MTL-QC' },
		sectionName: { en: 'MANIFESTO', es: 'MANIFIESTO', fr: 'MANIFESTE' },
		sectionNumber: { en: 'SEC-02', es: 'SEC-02', fr: 'SEC-02' },
	},
	edgeRight: {
		dst: {
			en: 'DST Montréal, QC',
			es: 'DST Montréal, QC',
			fr: 'DST Montréal, QC',
		},
		lat: {
			en: 'LAT 45.5017°N',
			es: 'LAT 45.5017°N',
			fr: 'LAT 45.5017°N',
		},
		lng: {
			en: 'LNG 73.5673°W',
			es: 'LNG 73.5673°W',
			fr: 'LNG 73.5673°W',
		},
		node: {
			en: 'NODE berri-uqam',
			es: 'NODE berri-uqam',
			fr: 'NODE berri-uqam',
		},
		src: {
			en: 'SRC Sherbrooke, QC',
			es: 'SRC Sherbrooke, QC',
			fr: 'SRC Sherbrooke, QC',
		},
		status: {
			en: 'STATUS active',
			es: 'STATUS active',
			fr: 'STATUS active',
		},
		via: {
			en: 'VIA Lennoxville, QC',
			es: 'VIA Lennoxville, QC',
			fr: 'VIA Lennoxville, QC',
		},
	},
	hiddenTransitLines: [
		{
			color: '#003DA5',
			name: { en: 'LIGNE BLEUE', es: 'LIGNE BLEUE', fr: 'LIGNE BLEUE' },
		},
		{
			color: '#008F4F',
			name: { en: 'LIGNE VERTE', es: 'LIGNE VERTE', fr: 'LIGNE VERTE' },
		},
		{
			color: '#F0CB00',
			name: { en: 'LIGNE JAUNE', es: 'LIGNE JAUNE', fr: 'LIGNE JAUNE' },
		},
		{
			color: '#78BE20',
			name: { en: 'REM', es: 'REM', fr: 'REM' },
		},
		{
			color: '#DA291C',
			name: {
				en: '11 VAUDREUIL/HUDSON',
				es: '11 VAUDREUIL/HUDSON',
				fr: '11 VAUDREUIL/HUDSON',
			},
		},
		{
			color: '#009B3A',
			name: {
				en: '12 SAINT-JÉRÔME',
				es: '12 SAINT-JÉRÔME',
				fr: '12 SAINT-JÉRÔME',
			},
		},
		{
			color: '#FFD100',
			name: {
				en: '13 MONT-SAINT-HILAIRE',
				es: '13 MONT-SAINT-HILAIRE',
				fr: '13 MONT-SAINT-HILAIRE',
			},
		},
		{
			color: '#7B2D8E',
			name: { en: '14 CANDIAC', es: '14 CANDIAC', fr: '14 CANDIAC' },
		},
		{
			color: '#0072CE',
			name: {
				en: '15 MASCOUCHE',
				es: '15 MASCOUCHE',
				fr: '15 MASCOUCHE',
			},
		},
	],
	pills: [
		{
			label: {
				en: 'databases',
				es: 'bases de datos',
				fr: 'bases de données',
			},
			serviceId: 'database-engineering',
		},
		{
			label: { en: 'pipelines', es: 'pipelines', fr: 'pipelines' },
			serviceId: 'data-pipeline',
		},
		{
			label: { en: 'dashboards', es: 'tableros', fr: 'tableaux de bord' },
			serviceId: 'analytics-reporting',
		},
		{
			label: { en: 'websites', es: 'sitios web', fr: 'sites web' },
			serviceId: 'web-development',
		},
	],
	statement: {
		line1: {
			en: 'I BUILD THE',
			es: 'CONSTRUYO LA',
			fr: 'JE BÂTIS L\'',
		},
		line3Highlight: {
			en: 'OPERATIONS',
			es: 'TUS OPERACIONES',
			fr: 'TES OPÉRATIONS',
		},
		line3Part1: { en: 'YOUR', es: 'QUE', fr: 'DONT' },
		line3Part2: { en: 'RUN ON', es: 'NECESITAN', fr: 'ONT BESOIN' },
		lineHuge: {
			en: 'INFRASTRUCTURE',
			es: 'INFRAESTRUCTURA',
			fr: 'INFRASTRUCTURE',
		},
	},
	terminal: {
		command: {
			en: ':~$ cat manifesto.md',
			es: ':~$ cat manifesto.md',
			fr: ':~$ cat manifesto.md',
		},
		user: { en: 'yesid@mtl', es: 'yesid@mtl', fr: 'yesid@mtl' },
	},
	ticks: ['0', '80', '160', '240', '320', '400', '480'],
	transit: {
		arrivalLabel: {
			en: 'PROCHAIN / NEXT',
			es: 'PROCHAIN / NEXT',
			fr: 'PROCHAIN / NEXT',
		},
		directionBadge: {
			en: 'DIRECTION: CENTRE-VILLE',
			es: 'DIRECTION: CENTRE-VILLE',
			fr: 'DIRECTION: CENTRE-VILLE',
		},
		platformBadge: {
			en: 'QUAI / PLATFORM 2',
			es: 'QUAI / PLATFORM 2',
			fr: 'QUAI / PLATFORM 2',
		},
	},
};

export const proofReelContent: ProofReelContent = {
	heading: { en: 'PROOF', es: 'PRUEBAS', fr: 'PREUVES' },
	headingDot: { en: '.', es: '.', fr: '.' },
	sectionLabel: { en: '// PROOF', es: '// PRUEBAS', fr: '// PREUVES' },
	subheading: {
		en: 'SELECTED WORK',
		es: 'TRABAJOS ESCOGIDOS',
		fr: 'TRAVAUX CHOISIS',
	},
	toggleColorAria: {
		en: 'Toggle color for {title}',
		es: 'Alternar el color de {title}',
		fr: 'Activer la couleur pour {title}',
	},
	viewAllHref: '/projects',
	viewAllLabel: {
		en: 'View all projects →',
		es: 'Ver todos los proyectos →',
		fr: 'Voir tous les projets →',
	},
};

export const servicesGridContent: ServicesGridContent = {
	heading: { en: 'SERVICES', es: 'SERVICIOS', fr: 'SERVICES' },
	headingDot: { en: '.', es: '.', fr: '.' },
	subheading: {
		en: 'WHAT I BUILD',
		es: 'LO QUE CONSTRUYO',
		fr: 'CE QUE JE BÂTIS',
	},
	viewAllLink: {
		en: 'View all services →',
		es: 'Ver todos los servicios →',
		fr: 'Voir tous les services →',
	},
	viewIllustrationAria: {
		en: 'View {title} illustration',
		es: 'Ver la ilustración de {title}',
		fr: 'Voir l\'illustration de {title}',
	},
};

export const aboutContent: AboutIntroContent = {
	bio: {
		en: 'I take data, make it tell stories, and build the systems it moves through.',
		es: 'Tomo los datos, hago que cuenten historias y construyo los sistemas por donde se mueven.',
		fr: 'Je prends la donnée, je lui fais raconter des histoires, et je bâtis les systèmes dans lesquels elle circule.',
	},
	interests: {
		en: 'Manga · Transit · Space · Montreal food scene',
		es: 'Manga · Transporte público · Espacio · Comida de Montreal',
		fr: 'Manga · Transport collectif · Espace · Scène bouffe de Montréal',
	},
	interestsLabel: { en: 'INTERESTS', es: 'INTERESES', fr: 'INTÉRÊTS' },
	location: {
		city: { en: 'Montreal', es: 'Montreal', fr: 'Montréal' },
		region: { en: 'QC, Canada', es: 'QC, Canadá', fr: 'QC, Canada' },
	},
	locationLabel: { en: 'LOCATION', es: 'UBICACIÓN', fr: 'EMPLACEMENT' },
	moreLink: {
		en: '→ More about me',
		es: '→ Más sobre mí',
		fr: '→ En savoir plus sur moi',
	},
	name: { en: 'Yesid', es: 'Yesid', fr: 'Yesid' },
	stackItems: ['PostgreSQL', 'dbt + Airflow', 'Power BI', 'SvelteKit'],
	stackLabel: { en: 'STACK', es: 'STACK', fr: 'STACK' },
	title: {
		en: 'Freelance Digital Infrastructure Engineer',
		es: 'Ingeniero freelance de infraestructura digital',
		fr: 'Ingénieur en infrastructure numérique, à la pige',
	},
};

export const ctaContent: CtaContent = {
	ctaContact: { en: 'Get in touch', es: 'Hablemos', fr: 'Parlons-en' },
	ctaGithub: {
		en: 'View on GitHub',
		es: 'Ver en GitHub',
		fr: 'Voir sur GitHub',
	},
	heading: {
		en: 'Let\'s build something\nthat moves',
		es: 'Construyamos algo\nque se mueva',
		fr: 'Bâtissons quelque chose\nqui avance',
	},
	subtitle: {
		en: 'Database, pipeline, dashboard, website: wherever it\'s stuck, that\'s where we start.',
		es: 'Base de datos, pipeline, tablero, sitio web: donde se atasca la cosa, ahí empezamos.',
		fr: 'Base de données, pipeline, tableau de bord, site web : peu importe où ça accroche, c\'est là qu\'on commence.',
	},
};

export const closerContent: CloserContent = {
	attribution: {
		text: {
			en: 'Graffiti Vectors by Vecteezy',
			es: 'Graffiti Vectors by Vecteezy',
			fr: 'Graffiti Vectors by Vecteezy',
		},
		url: 'https://www.vecteezy.com/free-vector/graffiti',
	},
	cta: {
		href: '/contact',
		label: {
			en: 'Initialize connection',
			es: 'Inicializar conexión',
			fr: 'Initialiser la connexion',
		},
	},
	heading: { en: 'TERMINUS', es: 'TERMINAL', fr: 'TERMINUS' },
	headingDot: { en: '.', es: '.', fr: '.' },
	rows: {
		about: {
			action: { en: 'cd', es: 'cd', fr: 'cd' },
			description: {
				en: 'About the builder',
				es: 'Sobre quien construye',
				fr: 'À propos du bâtisseur',
			},
			label: { en: 'YESID', es: 'YESID', fr: 'YESID' },
		},
		connect: {
			action: { en: 'GO', es: 'GO', fr: 'GO' },
			description: {
				en: 'GitHub · open-source work',
				es: 'GitHub · trabajo open source',
				fr: 'GitHub · travail open source',
			},
			label: { en: 'GITHUB REPO', es: 'REPO GITHUB', fr: 'DÉPÔT GITHUB' },
		},
		contact: {
			action: { en: 'GO', es: 'GO', fr: 'GO' },
			description: {
				en: 'Start a project together',
				es: 'Empezar un proyecto juntos',
				fr: 'Démarrer un projet ensemble',
			},
			label: { en: 'CONTACT', es: 'CONTACTO', fr: 'CONTACT' },
		},
		read: {
			action: { en: 'cd', es: 'cd', fr: 'cd' },
			description: {
				en: 'Writing and field notes',
				es: 'Artículos y notas de campo',
				fr: 'Notes et articles',
			},
			label: { en: 'BLOG', es: 'BLOG', fr: 'BLOGUE' },
		},
		stack: {
			action: { en: 'cd', es: 'cd', fr: 'cd' },
			description: {
				en: 'Tools and architecture',
				es: 'Herramientas y arquitectura',
				fr: 'Outils et architecture',
			},
			label: { en: 'STACK', es: 'STACK', fr: 'STACK' },
		},
	},
	subheading: {
		en: 'END OF LINE',
		es: 'FIN DE LA LÍNEA',
		fr: 'FIN DE LA LIGNE',
	},
	terminal: {
		city: {
			en: 'Montreal, QC',
			es: 'Montreal, QC',
			fr: 'Montréal, QC',
		},
		destinationsLabel: {
			en: '{count} destinations',
			es: '{count} destinos',
			fr: '{count} destinations',
		},
		encoding: { en: 'UTF-8', es: 'UTF-8', fr: 'UTF-8' },
		prompt: {
			en: '// where to next?',
			es: '// ¿y ahora a dónde?',
			fr: '// on va où, là?',
		},
		title: {
			en: 'yesid@terminus:~/destinations',
			es: 'yesid@terminus:~/destinations',
			fr: 'yesid@terminus:~/destinations',
		},
	},
};
