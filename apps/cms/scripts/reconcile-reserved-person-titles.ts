#!/usr/bin/env bun

import { isDeepStrictEqual, parseArgs as parseNodeArgs } from 'node:util';
import { getAdminToken } from './lib/auth';
import { createQueuedFetch } from './lib/queued-fetch';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;

export const PROD_CONFIRMATION = 'APPLY_PROD_OUTCOME_FIRST_POSITIONING';
export const MAX_PATCHES = 18;

export const TITLE_BY_LOCALE = {
	en: 'Freelance Digital Solutions Developer',
	fr: 'Développeur de solutions numériques à la pige',
	es: 'Desarrollador freelance de soluciones digitales',
} as const;

export type Target = keyof typeof TARGET_URLS;
export type Locale = keyof typeof TITLE_BY_LOCALE;

export interface IntroRow {
	id: number;
	languages_code: Locale;
	title: string;
}

export interface AboutContentRow {
	id: number;
	languages_code: Locale;
	meta_title: string;
	meta_description: string;
}

export interface SiteMetaRow {
	id: number;
	languages_code: Locale;
	description: string;
	default_description: string;
	owner_job_title: string;
}

export interface RouteTranslationRow {
	id: number;
	languages_code: Locale;
	title: string;
	description: string;
}

export interface CmsSnapshot {
	aboutIntro: IntroRow[];
	aboutContent: AboutContentRow[];
	siteMeta: SiteMetaRow[];
	homeRoute: { id: number; path: '/'; translations: RouteTranslationRow[] };
	aboutRoute: { id: number; path: '/about'; translations: RouteTranslationRow[] };
	servicesRoute: { id: number; path: '/services'; translations: RouteTranslationRow[] };
}

export interface TitlePatch {
	method: 'PATCH';
	locale: Locale;
	path: string;
	before: Record<string, unknown>;
	body: Record<string, unknown>;
}

export interface CliOptions {
	target: Target;
	apply: boolean;
}

const LOCALES: readonly Locale[] = ['en', 'fr', 'es'];

const PREVIOUS_INTRO_TITLES: Record<Locale, string> = {
	en: 'Freelance SQL and Digital Infrastructure Developer',
	fr: 'Développeur SQL et en infrastructure numérique, à la pige',
	es: 'Desarrollador freelance SQL y de infraestructura digital',
};

const PREVIOUS_ABOUT_META_DESCRIPTIONS: Record<Locale, string> = {
	en: "Freelance SQL and Digital Infrastructure Developer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
	fr: "Développeur SQL et en infrastructure numérique, à la pige, basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
	es: 'Desarrollador freelance SQL y de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
};

export const ABOUT_META_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: 'Digital solutions developer in Montréal helping Québec SMEs connect websites, reports, and workflows through web, automation, analytics, databases, and SQL.',
	fr: "Développeur de solutions numériques à la pige à Montréal. J'aide les PME du Québec avec le web, l'automatisation, l'analytique, les bases de données et SQL.",
	es: 'Desarrollador freelance de soluciones digitales en Montreal. Ayudo a pymes de Québec con web, automatización, analítica, bases de datos y SQL confiables.',
};

const PREVIOUS_SITE_META: Record<
	Locale,
	Pick<SiteMetaRow, 'description' | 'default_description' | 'owner_job_title'>
> = {
	en: {
		description:
			'Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
		owner_job_title: 'Freelance SQL and Digital Infrastructure Developer',
	},
	fr: {
		description:
			"Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
		default_description:
			"yesid., Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
		owner_job_title: 'Développeur SQL et en infrastructure numérique, à la pige',
	},
	es: {
		description:
			'Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y sitios web que impulsan. PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y los sitios web que impulsan. Entregado con números.',
		owner_job_title: 'Desarrollador freelance SQL y de infraestructura digital',
	},
};

export const SITE_META_BY_LOCALE: typeof PREVIOUS_SITE_META = {
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
};

const PREVIOUS_HOME_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: 'Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, dashboards.',
	fr: 'Développeur SQL pigiste et consultant en infrastructure numérique à Montréal. PostgreSQL, dbt, Power BI et Python pour pipelines, analyses et tableaux de bord.',
	es: 'Desarrollador SQL freelance y consultor de infraestructura digital en Montreal. PostgreSQL, dbt, Power BI, Python. Pipelines en tiempo real, análisis, tableros.',
};

export const HOME_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: 'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
	fr: 'yesid.dev aide les PME du Québec à relier sites web, données, rapports et processus par le web, l’automatisation, l’analytique, les bases de données et SQL.',
	es: 'yesid.dev ayuda a pymes de Québec a conectar sitios web, datos, reportes y procesos mediante desarrollo web, automatización, analítica, bases de datos y SQL.',
};

const PREVIOUS_ABOUT_ROUTE_BY_LOCALE: Record<
	Locale,
	Pick<RouteTranslationRow, 'title' | 'description'>
> = {
	en: {
		title: 'Freelance SQL and Digital Infrastructure Developer',
		description:
			'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work.',
	},
	fr: {
		title: 'Développeur SQL et en infrastructure numérique, à la pige',
		description:
			'Consultant en infrastructure numérique basé à Montréal. Expérience en SQL, entrepôts de données et analyses temps réel, disponible pour mandats pigistes.',
	},
	es: {
		title: 'Desarrollador freelance SQL y de infraestructura digital',
		description:
			'Consultor de infraestructura digital en Montreal. Experiencia en SQL, almacenes de datos y analítica en tiempo real. Disponible para freelance y consultoría.',
	},
};

export const ABOUT_ROUTE_BY_LOCALE: typeof PREVIOUS_ABOUT_ROUTE_BY_LOCALE = {
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
};

const PREVIOUS_SERVICES_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: 'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams.',
	fr: "Services d'infrastructure numérique: conseil SQL et PostgreSQL, pipelines dbt, analyses Power BI, ETL Python et plateformes de données temps réel.",
	es: 'Servicios de infraestructura digital: consultoría SQL y PostgreSQL, pipelines dbt, analítica Power BI, ETL en Python y plataformas de datos en tiempo real.',
};

export const SERVICES_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: 'Digital solutions for Québec SMEs: websites and e-commerce, workflow automation, dashboards and analytics, databases and SQL, built around real operations.',
	fr: 'Solutions numériques pour les PME du Québec : sites web et commerce en ligne, automatisation, tableaux de bord, analytique, bases de données et SQL fiables.',
	es: 'Soluciones digitales para pymes de Québec: desarrollo web y e-commerce, automatización, tableros y analítica, bases de datos y SQL, según su operación real.',
};

export function parseCli(argv: readonly string[]): CliOptions {
	const { values } = parseNodeArgs({
		args: [...argv],
		options: {
			target: { type: 'string' },
			apply: { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
			confirm: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	});
	if (values.target !== 'dev' && values.target !== 'prod') {
		throw new Error('[reserved-person-titles] required: --target=dev|prod');
	}
	const apply = values.apply === true;
	if (apply && values['dry-run'] === true) {
		throw new Error('[reserved-person-titles] choose one: --dry-run or --apply');
	}
	if (values.target === 'prod' && apply) {
		if (values.confirm !== PROD_CONFIRMATION) {
			throw new Error(
				`[reserved-person-titles] PROD apply requires --confirm=${PROD_CONFIRMATION}`,
			);
		}
	} else if (values.confirm !== undefined) {
		throw new Error('[reserved-person-titles] --confirm is accepted only for PROD apply');
	}
	return { target: values.target, apply };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertId(value: unknown, label: string): asserts value is number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
		throw new Error(`[reserved-person-titles] invalid ${label} row id`);
	}
}

function rowsByLocale<T extends { id: number; languages_code: Locale }>(
	rows: readonly T[],
	label: string,
): Record<Locale, T> {
	if (rows.length !== LOCALES.length) {
		throw new Error(`[reserved-person-titles] expected 3 ${label} rows, received ${rows.length}`);
	}
	const result = {} as Record<Locale, T>;
	const ids = new Set<number>();
	for (const row of rows) {
		if (!isRecord(row) || !LOCALES.includes(row.languages_code)) {
			throw new Error(`[reserved-person-titles] malformed ${label} row`);
		}
		assertId(row.id, label);
		if (ids.has(row.id) || result[row.languages_code]) {
			throw new Error(`[reserved-person-titles] duplicate ${label} row`);
		}
		ids.add(row.id);
		result[row.languages_code] = row;
	}
	for (const locale of LOCALES) {
		if (!result[locale]) throw new Error(`[reserved-person-titles] missing ${label}.${locale}`);
	}
	return result;
}

function subset(row: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
	return Object.fromEntries(keys.map((key) => [key, row[key]]));
}

function planFieldPatch(
	plan: TitlePatch[],
	options: {
		row: Record<string, unknown> & { id: number; languages_code: Locale };
		path: string;
		previous: Record<string, unknown>;
		desired: Record<string, unknown>;
	},
): void {
	const keys = Object.keys(options.desired);
	const current = subset(options.row, keys);
	if (isDeepStrictEqual(current, options.desired)) return;
	if (!isDeepStrictEqual(current, options.previous)) {
		throw new Error(
			`[reserved-person-titles] unrelated title drift in ${options.path}`,
		);
	}
	plan.push({
		method: 'PATCH',
		locale: options.row.languages_code,
		path: options.path,
		before: current,
		body: structuredClone(options.desired),
	});
}

function routeRows<
	Path extends CmsSnapshot['homeRoute']['path'] | CmsSnapshot['aboutRoute']['path'] | CmsSnapshot['servicesRoute']['path'],
>(
	route: { id: number; path: Path; translations: RouteTranslationRow[] },
	path: Path,
	label: string,
): Record<Locale, RouteTranslationRow> {
	if (!isRecord(route) || route.path !== path || !Array.isArray(route.translations)) {
		throw new Error(`[reserved-person-titles] malformed ${path} route`);
	}
	assertId(route.id, `${path} route`);
	return rowsByLocale(route.translations, label);
}

export function buildPlan(snapshot: CmsSnapshot): TitlePatch[] {
	if (!isRecord(snapshot)) throw new Error('[reserved-person-titles] malformed snapshot');
	const intro = rowsByLocale(snapshot.aboutIntro, 'about-intro');
	const aboutContent = rowsByLocale(snapshot.aboutContent, 'about-content');
	const siteMeta = rowsByLocale(snapshot.siteMeta, 'site-meta');
	const homeRoute = routeRows(snapshot.homeRoute, '/', 'home-route');
	const aboutRoute = routeRows(snapshot.aboutRoute, '/about', 'about-route');
	const servicesRoute = routeRows(snapshot.servicesRoute, '/services', 'services-route');

	const plan: TitlePatch[] = [];
	for (const locale of LOCALES) {
		planFieldPatch(plan, {
			row: intro[locale] as unknown as Record<string, unknown> & IntroRow,
			path: `/items/block_about_intro_translations/${intro[locale].id}`,
			previous: { title: PREVIOUS_INTRO_TITLES[locale] },
			desired: { title: TITLE_BY_LOCALE[locale] },
		});
	}
	for (const locale of LOCALES) {
		planFieldPatch(plan, {
			row: aboutContent[locale] as unknown as Record<string, unknown> & AboutContentRow,
			path: `/items/block_about_content_translations/${aboutContent[locale].id}`,
			previous: { meta_description: PREVIOUS_ABOUT_META_DESCRIPTIONS[locale] },
			desired: { meta_description: ABOUT_META_DESCRIPTION_BY_LOCALE[locale] },
		});
	}
	for (const locale of LOCALES) {
		planFieldPatch(plan, {
			row: siteMeta[locale] as unknown as Record<string, unknown> & SiteMetaRow,
			path: `/items/site_meta_translations/${siteMeta[locale].id}`,
			previous: PREVIOUS_SITE_META[locale],
			desired: SITE_META_BY_LOCALE[locale],
		});
	}
	for (const locale of LOCALES) {
		planFieldPatch(plan, {
			row: homeRoute[locale] as unknown as Record<string, unknown> & RouteTranslationRow,
			path: `/items/route_seo_translations/${homeRoute[locale].id}`,
			previous: { description: PREVIOUS_HOME_DESCRIPTION_BY_LOCALE[locale] },
			desired: { description: HOME_DESCRIPTION_BY_LOCALE[locale] },
		});
	}
	for (const locale of LOCALES) {
		if (TITLE_BY_LOCALE[locale].length > 70) {
			throw new Error(`[reserved-person-titles] ${locale} route title exceeds 70 characters`);
		}
		planFieldPatch(plan, {
			row: aboutRoute[locale] as unknown as Record<string, unknown> & RouteTranslationRow,
			path: `/items/route_seo_translations/${aboutRoute[locale].id}`,
			previous: PREVIOUS_ABOUT_ROUTE_BY_LOCALE[locale],
			desired: ABOUT_ROUTE_BY_LOCALE[locale],
		});
	}
	for (const locale of LOCALES) {
		planFieldPatch(plan, {
			row: servicesRoute[locale] as unknown as Record<string, unknown> & RouteTranslationRow,
			path: `/items/route_seo_translations/${servicesRoute[locale].id}`,
			previous: { description: PREVIOUS_SERVICES_DESCRIPTION_BY_LOCALE[locale] },
			desired: { description: SERVICES_DESCRIPTION_BY_LOCALE[locale] },
		});
	}
	if (plan.length > MAX_PATCHES) {
		throw new Error(`[reserved-person-titles] patch cap exceeded (${plan.length})`);
	}
	return plan;
}

export async function applyVerifiedPlan(
	plan: readonly TitlePatch[],
	deps: {
		readSnapshot: () => Promise<CmsSnapshot>;
		sendPatch: (step: TitlePatch) => Promise<void>;
	},
): Promise<number> {
	let sentCount = 0;
	function assertExpectedSubset(
		currentPlan: readonly TitlePatch[],
		expectedPlan: readonly TitlePatch[],
		message: string,
	): void {
		const expectedByPath = new Map(expectedPlan.map((candidate) => [candidate.path, candidate]));
		for (const candidate of currentPlan) {
			const expected = expectedByPath.get(candidate.path);
			if (
				!expected ||
				!isDeepStrictEqual(candidate.before, expected.before) ||
				!isDeepStrictEqual(candidate.body, expected.body)
			) {
				throw new Error(message);
			}
		}
	}

	for (const [index, step] of plan.entries()) {
		let currentPlan: TitlePatch[];
		try {
			currentPlan = buildPlan(await deps.readSnapshot());
		} catch (error) {
			throw new Error(
				`[reserved-person-titles] state changed before PATCH ${step.path}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		assertExpectedSubset(
			currentPlan,
			plan.slice(index),
			`[reserved-person-titles] state changed before PATCH ${step.path}`,
		);
		const current = currentPlan.find((candidate) => candidate.path === step.path);
		if (!current) continue;
		await deps.sendPatch(step);
		sentCount += 1;
		let afterPlan: TitlePatch[];
		try {
			afterPlan = buildPlan(await deps.readSnapshot());
		} catch (error) {
			throw new Error(
				`[reserved-person-titles] post-PATCH verification failed for ${step.path}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		assertExpectedSubset(
			afterPlan,
			plan.slice(index + 1),
			`[reserved-person-titles] post-PATCH verification failed for ${step.path}`,
		);
	}
	const remaining = buildPlan(await deps.readSnapshot());
	if (remaining.length !== 0) {
		throw new Error(
			`[reserved-person-titles] post-apply verification failed: ${remaining.length} PATCHes remain`,
		);
	}
	return sentCount;
}

const PATHS = {
	aboutIntro:
		'/items/block_about_intro_translations?fields=id,languages_code,title&limit=-1',
	aboutContent:
		'/items/block_about_content_translations?fields=id,languages_code,meta_title,meta_description&limit=-1',
	siteMeta:
		'/items/site_meta_translations?fields=id,languages_code,description,default_description,owner_job_title&limit=-1',
	homeRoute:
		'/items/route_seo?fields=id,path,translations.id,translations.languages_code,translations.title,translations.description&filter[path][_eq]=%2F&limit=1',
	aboutRoute:
		'/items/route_seo?fields=id,path,translations.id,translations.languages_code,translations.title,translations.description&filter[path][_eq]=%2Fabout&limit=1',
	servicesRoute:
		'/items/route_seo?fields=id,path,translations.id,translations.languages_code,translations.title,translations.description&filter[path][_eq]=%2Fservices&limit=1',
} as const;

export function createReconcilerFetch(
	upstreamFetch: typeof fetch = globalThis.fetch,
	sleep?: (ms: number) => Promise<void>,
): typeof fetch {
	return createQueuedFetch({
		maxConcurrent: 1,
		minTime: 50,
		retries: 4,
		fetch: upstreamFetch,
		sleep,
	});
}

const reconcilerFetch = createReconcilerFetch();

export async function requestData(
	url: string,
	token: string,
	path: string,
	fetcher: typeof fetch = reconcilerFetch,
): Promise<unknown> {
	const response = await fetcher(`${url}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!response.ok) {
		throw new Error(`[reserved-person-titles] GET ${path} failed (${response.status})`);
	}
	const body = (await response.json()) as unknown;
	if (!isRecord(body) || !('data' in body)) {
		throw new Error(`[reserved-person-titles] malformed GET ${path} response`);
	}
	return body.data;
}

export async function readSnapshot(url: string, token: string): Promise<CmsSnapshot> {
	const [aboutIntro, aboutContent, siteMeta, homeRoutes, aboutRoutes, servicesRoutes] = await Promise.all([
		requestData(url, token, PATHS.aboutIntro),
		requestData(url, token, PATHS.aboutContent),
		requestData(url, token, PATHS.siteMeta),
		requestData(url, token, PATHS.homeRoute),
		requestData(url, token, PATHS.aboutRoute),
		requestData(url, token, PATHS.servicesRoute),
	]);
	if (
		!Array.isArray(aboutIntro) ||
		!Array.isArray(aboutContent) ||
		!Array.isArray(siteMeta) ||
		!Array.isArray(homeRoutes) ||
		homeRoutes.length !== 1 ||
		!Array.isArray(aboutRoutes) ||
		aboutRoutes.length !== 1 ||
		!Array.isArray(servicesRoutes) ||
		servicesRoutes.length !== 1
	) {
		throw new Error('[reserved-person-titles] malformed CMS snapshot response');
	}
	return {
		aboutIntro: aboutIntro as IntroRow[],
		aboutContent: aboutContent as AboutContentRow[],
		siteMeta: siteMeta as SiteMetaRow[],
		homeRoute: homeRoutes[0] as CmsSnapshot['homeRoute'],
		aboutRoute: aboutRoutes[0] as CmsSnapshot['aboutRoute'],
		servicesRoute: servicesRoutes[0] as CmsSnapshot['servicesRoute'],
	};
}

async function sendPatch(url: string, token: string, step: TitlePatch): Promise<void> {
	const response = await reconcilerFetch(`${url}${step.path}`, {
		method: step.method,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(step.body),
	});
	if (!response.ok) {
		throw new Error(
			`[reserved-person-titles] PATCH ${step.path} failed (${response.status})`,
		);
	}
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const url = TARGET_URLS[options.target];
	const token = await getAdminToken(url, { allowBuildToken: false });
	const plan = buildPlan(await readSnapshot(url, token));
	console.log(
		`[reserved-person-titles] target=${options.target} mode=${options.apply ? 'APPLY' : 'DRY-RUN'} patches=${plan.length}`,
	);
	for (const step of plan) {
		console.log(JSON.stringify({ method: step.method, path: step.path, locale: step.locale, body: step.body }));
	}
	if (!options.apply) {
		console.log('[reserved-person-titles] dry-run complete; no writes sent');
		return;
	}
	const sentCount = await applyVerifiedPlan(plan, {
		readSnapshot: () => readSnapshot(url, token),
		sendPatch: (step) => sendPatch(url, token, step),
	});
	console.log(
		`[reserved-person-titles] verified convergence; planned=${plan.length} sent=${sentCount}; NO CHANGES remain`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(
			'[reserved-person-titles] FAILED:',
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	});
}
