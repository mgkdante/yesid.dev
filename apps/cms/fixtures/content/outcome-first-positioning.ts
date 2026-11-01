export const TITLE_BY_LOCALE = {
	en: 'Freelance Digital Infrastructure Developer',
	fr: 'Développeur en infrastructure numérique à la pige',
	es: 'Desarrollador freelance de infraestructura digital',
} as const;

export type OutcomeFirstLocale = keyof typeof TITLE_BY_LOCALE;

export const SITE_META_BY_LOCALE = {
	en: {
		description:
			'Freelance digital infrastructure developer in Montréal helping businesses across Canada connect websites, data, reporting, automation, and workflows.',
		default_description:
			'yesid.dev helps businesses in Québec and across Canada connect websites, data, reporting, and workflows through web, automation, analytics, databases, and SQL.',
		owner_job_title: TITLE_BY_LOCALE.en,
	},
	fr: {
		description:
			'Développeur en infrastructure numérique à la pige à Montréal, aidant les entreprises partout au Canada à relier sites web, données, rapports et processus.',
		default_description:
			'yesid.dev aide les entreprises du Québec et de partout au Canada à relier sites web, données, rapports et processus : web, automatisation, analytique et SQL.',
		owner_job_title: TITLE_BY_LOCALE.fr,
	},
	es: {
		description:
			'Desarrollador de infraestructura digital en Montreal que ayuda a empresas de todo Canadá a conectar sitios web, datos, reportes, automatización y procesos.',
		default_description:
			'yesid.dev ayuda a empresas de Québec y de todo Canadá a conectar sitios web, datos, reportes y procesos con web, automatización, analítica, bases de datos y SQL.',
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
			'Digital infrastructure developer in Montréal helping Canadian businesses connect websites, reports, and workflows through web, automation, analytics, and SQL.',
	},
	fr: {
		title: TITLE_BY_LOCALE.fr,
		description:
			"Développeur en infrastructure numérique à la pige à Montréal. J'aide les entreprises canadiennes avec le web, l'automatisation, l'analytique et SQL.",
	},
	es: {
		title: TITLE_BY_LOCALE.es,
		description:
			'Desarrollador freelance de infraestructura digital en Montreal. Ayudo a empresas canadienses con web, automatización, analítica, bases de datos y SQL.',
	},
} as const;

export const ABOUT_META_DESCRIPTION_BY_LOCALE = {
	en: ABOUT_ROUTE_BY_LOCALE.en.description,
	fr: ABOUT_ROUTE_BY_LOCALE.fr.description,
	es: ABOUT_ROUTE_BY_LOCALE.es.description,
} as const;

export const SERVICES_DESCRIPTION_BY_LOCALE = {
	en: 'Digital solutions for Canadian businesses: websites and e-commerce, workflow automation, dashboards and analytics, databases and SQL, built around real operations.',
	fr: 'Solutions numériques pour les entreprises canadiennes : sites web et commerce en ligne, automatisation, tableaux de bord, analytique, bases de données et SQL.',
	es: 'Soluciones digitales para empresas canadienses: desarrollo web y e-commerce, automatización, tableros y analítica, bases de datos y SQL, según su operación real.',
} as const;
