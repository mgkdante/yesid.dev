export const TITLE_BY_LOCALE = {
	en: 'Freelance Digital Solutions Developer',
	fr: 'Développeur de solutions numériques à la pige',
	es: 'Desarrollador freelance de soluciones digitales',
} as const;

export type OutcomeFirstLocale = keyof typeof TITLE_BY_LOCALE;

export const SITE_META_BY_LOCALE = {
	en: {
		description:
			'Freelance digital solutions developer in Montréal helping Québec SMEs connect websites, data, reporting, automation, and workflows through practical, reliable systems.',
		default_description:
			'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
		owner_job_title: TITLE_BY_LOCALE.en,
	},
	fr: {
		description:
			'Développeur de solutions numériques à la pige à Montréal, aidant les PME du Québec à relier sites web, données, rapports, automatisation et processus avec des systèmes fiables.',
		default_description:
			'yesid.dev aide les PME du Québec à relier sites web, données, rapports et processus par le web, l’automatisation, l’analytique, les bases de données et SQL.',
		owner_job_title: TITLE_BY_LOCALE.fr,
	},
	es: {
		description:
			'Desarrollador de soluciones digitales en Montreal que ayuda a pymes de Québec a conectar sitios web, datos, reportes, automatización y procesos con sistemas confiables.',
		default_description:
			'yesid.dev ayuda a pymes de Québec a conectar sitios web, datos, reportes y procesos mediante desarrollo web, automatización, analítica, bases de datos y SQL.',
		owner_job_title: TITLE_BY_LOCALE.es,
	},
} as const;

export const HOME_DESCRIPTION_BY_LOCALE = {
	en: SITE_META_BY_LOCALE.en.default_description,
	fr: SITE_META_BY_LOCALE.fr.default_description,
	es: SITE_META_BY_LOCALE.es.default_description,
} as const;

export const ABOUT_ROUTE_BY_LOCALE = {
	en: {
		title: TITLE_BY_LOCALE.en,
		description:
			'Digital solutions developer in Montréal helping Québec SMEs connect websites, reports, and workflows through web, automation, analytics, databases, and SQL.',
	},
	fr: {
		title: TITLE_BY_LOCALE.fr,
		description:
			"Développeur de solutions numériques à la pige à Montréal. J'aide les PME du Québec avec le web, l'automatisation, l'analytique, les bases de données et SQL.",
	},
	es: {
		title: TITLE_BY_LOCALE.es,
		description:
			'Desarrollador freelance de soluciones digitales en Montreal. Ayudo a pymes de Québec con web, automatización, analítica, bases de datos y SQL confiables.',
	},
} as const;

export const ABOUT_META_DESCRIPTION_BY_LOCALE = {
	en: ABOUT_ROUTE_BY_LOCALE.en.description,
	fr: ABOUT_ROUTE_BY_LOCALE.fr.description,
	es: ABOUT_ROUTE_BY_LOCALE.es.description,
} as const;

export const SERVICES_DESCRIPTION_BY_LOCALE = {
	en: 'Digital solutions for Québec SMEs: websites and e-commerce, workflow automation, dashboards and analytics, databases and SQL, built around real operations.',
	fr: 'Solutions numériques pour les PME du Québec : sites web et commerce en ligne, automatisation, tableaux de bord, analytique, bases de données et SQL fiables.',
	es: 'Soluciones digitales para pymes de Québec: desarrollo web y e-commerce, automatización, tableros y analítica, bases de datos y SQL, según su operación real.',
} as const;
