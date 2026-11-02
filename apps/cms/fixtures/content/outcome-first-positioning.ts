export const TITLE_BY_LOCALE = {
	en: 'Freelance Digital Infrastructure Developer',
	fr: "Développeur d'infrastructure numérique à la pige",
	es: 'Desarrollador freelance de infraestructura digital',
} as const;

export type OutcomeFirstLocale = keyof typeof TITLE_BY_LOCALE;

export const SITE_META_BY_LOCALE = {
	en: {
		description:
			'Digital Infrastructure Developer. I help Québec and Canadian SMEs become more competitive, more productive and generate more value per employee.',
		default_description:
			'I help Canadian businesses become more competitive, more productive, and generate more value per employee, starting with Montréal and Québec.',
		owner_job_title: TITLE_BY_LOCALE.en,
	},
	fr: {
		description:
			"Développeur d'infrastructure numérique. J'aide les PME du Québec et du Canada à devenir plus compétitives, plus productives et à générer plus de valeur par employé.",
		default_description:
			"J'aide les entreprises canadiennes à devenir plus compétitives, plus productives et à générer plus de valeur par employé, en commençant par Montréal et le Québec.",
		owner_job_title: TITLE_BY_LOCALE.fr,
	},
	es: {
		description:
			'Desarrollador de infraestructura digital. Ayudo a las pymes de Quebec y Canadá a ser más competitivas, más productivas y a generar más valor por empleado.',
		default_description:
			'Ayudo a las empresas canadienses a ser más competitivas, más productivas y a generar más valor por empleado, empezando por Montreal y Quebec.',
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
			'Digital Infrastructure Developer. I help Québec and Canadian SMEs become more competitive, more productive and generate more value per employee.',
	},
	fr: {
		title: TITLE_BY_LOCALE.fr,
		description:
			"Développeur d'infrastructure numérique. J'aide les PME du Québec et du Canada à devenir plus compétitives, plus productives et à générer plus de valeur par employé.",
	},
	es: {
		title: TITLE_BY_LOCALE.es,
		description:
			'Desarrollador de infraestructura digital. Ayudo a las pymes de Quebec y Canadá a ser más competitivas, más productivas y a generar más valor por empleado.',
	},
} as const;

export const ABOUT_META_DESCRIPTION_BY_LOCALE = {
	en: ABOUT_ROUTE_BY_LOCALE.en.description,
	fr: ABOUT_ROUTE_BY_LOCALE.fr.description,
	es: ABOUT_ROUTE_BY_LOCALE.es.description,
} as const;

export const SERVICES_DESCRIPTION_BY_LOCALE = {
	en: 'Websites and online stores, automation and AI, reports and dashboards, custom software and databases. Freelance in Montréal for Québec and Canadian SMEs.',
	fr: "Sites web et boutiques, automatisation et IA, rapports et tableaux de bord, logiciels et bases de données. Pigiste à Montréal pour les PME d'ici.",
	es: 'Sitios web y tiendas, automatización e IA, reportes y tableros, software y bases de datos. Freelance en Montreal para pymes de Quebec y Canadá.',
} as const;
