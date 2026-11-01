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
	en: 'I build the infrastructure your operations run on: databases & SQL, pipelines & automation, dashboards & analytics, websites & e-commerce.',
	fr: "Je bâtis l'infrastructure sur laquelle vos opérations reposent : bases de données et SQL, pipelines et automatisation, tableaux de bord et analytique, sites web et commerce en ligne.",
	es: 'Construyo la infraestructura sobre la que funcionan tus operaciones: bases de datos y SQL, pipelines y automatización, dashboards y analítica, sitios web y e-commerce.',
} as const;
