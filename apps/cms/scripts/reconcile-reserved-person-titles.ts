#!/usr/bin/env bun

import { isDeepStrictEqual, parseArgs as parseNodeArgs } from 'node:util';
import { getAdminToken } from './lib/auth';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;

export const PROD_CONFIRMATION = 'APPLY_PROD_RESERVED_PERSON_TITLES';
export const MAX_PATCHES = 12;

export const TITLE_BY_LOCALE = {
	en: 'Freelance SQL and Digital Infrastructure Developer',
	fr: 'Développeur SQL et en infrastructure numérique, à la pige',
	es: 'Desarrollador freelance SQL y de infraestructura digital',
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
	aboutRoute: { id: number; path: '/about'; translations: RouteTranslationRow[] };
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
	en: 'Freelance Digital Infrastructure Engineer',
	fr: 'Ingénieur en infrastructure numérique, à la pige',
	es: 'Ingeniero freelance de infraestructura digital',
};

const PREVIOUS_ABOUT_META_DESCRIPTIONS: Record<Locale, string> = {
	en: "Freelance digital infrastructure engineer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
	fr: "Ingénieur pigiste en infrastructure numérique basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
	es: 'Ingeniero freelance de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
};

export const ABOUT_META_DESCRIPTION_BY_LOCALE: Record<Locale, string> = {
	en: "Freelance SQL and Digital Infrastructure Developer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
	fr: "Développeur SQL et en infrastructure numérique, à la pige, basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
	es: 'Desarrollador freelance SQL y de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
};

const PREVIOUS_SITE_META: Record<
	Locale,
	Pick<SiteMetaRow, 'description' | 'default_description' | 'owner_job_title'>
> = {
	en: {
		description:
			'Freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
		owner_job_title: 'Freelance Digital Infrastructure Engineer',
	},
	fr: {
		description:
			"Ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
		default_description:
			"yesid., ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
		owner_job_title: 'Ingénieur pigiste en infrastructure numérique',
	},
	es: {
		description:
			'Ingeniero freelance de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y sitios web que impulsan. PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., ingeniero freelance de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y los sitios web que impulsan. Entregado con números.',
		owner_job_title: 'Ingeniero independiente en infraestructura digital',
	},
};

export const SITE_META_BY_LOCALE: typeof PREVIOUS_SITE_META = {
	en: {
		description:
			'Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
		owner_job_title: TITLE_BY_LOCALE.en,
	},
	fr: {
		description:
			"Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
		default_description:
			"yesid., Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
		owner_job_title: TITLE_BY_LOCALE.fr,
	},
	es: {
		description:
			'Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y sitios web que impulsan. PostgreSQL, dbt, Power BI, SvelteKit.',
		default_description:
			'yesid., Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y los sitios web que impulsan. Entregado con números.',
		owner_job_title: TITLE_BY_LOCALE.es,
	},
};

const PREVIOUS_ROUTE_TITLES: Record<Locale, string> = {
	en: 'Yesid, Digital Infrastructure Engineer in Montreal',
	fr: 'Yesid, ingénieur en infrastructure numérique à Montréal',
	es: 'Yesid, ingeniero de infraestructura digital en Montreal',
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

export function buildPlan(snapshot: CmsSnapshot): TitlePatch[] {
	if (!isRecord(snapshot)) throw new Error('[reserved-person-titles] malformed snapshot');
	const intro = rowsByLocale(snapshot.aboutIntro, 'about-intro');
	const aboutContent = rowsByLocale(snapshot.aboutContent, 'about-content');
	const siteMeta = rowsByLocale(snapshot.siteMeta, 'site-meta');
	if (
		!isRecord(snapshot.aboutRoute) ||
		snapshot.aboutRoute.path !== '/about' ||
		!Array.isArray(snapshot.aboutRoute.translations)
	) {
		throw new Error('[reserved-person-titles] malformed /about route');
	}
	assertId(snapshot.aboutRoute.id, '/about route');
	const route = rowsByLocale(snapshot.aboutRoute.translations, 'about-route');

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
		if (TITLE_BY_LOCALE[locale].length > 70) {
			throw new Error(`[reserved-person-titles] ${locale} route title exceeds 70 characters`);
		}
		planFieldPatch(plan, {
			row: route[locale] as unknown as Record<string, unknown> & RouteTranslationRow,
			path: `/items/route_seo_translations/${route[locale].id}`,
			previous: { title: PREVIOUS_ROUTE_TITLES[locale] },
			desired: { title: TITLE_BY_LOCALE[locale] },
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
): Promise<void> {
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
}

const PATHS = {
	aboutIntro:
		'/items/block_about_intro_translations?fields=id,languages_code,title&limit=-1',
	aboutContent:
		'/items/block_about_content_translations?fields=id,languages_code,meta_title,meta_description&limit=-1',
	siteMeta:
		'/items/site_meta_translations?fields=id,languages_code,description,default_description,owner_job_title&limit=-1',
	aboutRoute:
		'/items/route_seo?fields=id,path,translations.id,translations.languages_code,translations.title,translations.description&filter[path][_eq]=%2Fabout&limit=1',
} as const;

async function requestData(url: string, token: string, path: string): Promise<unknown> {
	const response = await fetch(`${url}${path}`, {
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
	const [aboutIntro, aboutContent, siteMeta, aboutRoutes] = await Promise.all([
		requestData(url, token, PATHS.aboutIntro),
		requestData(url, token, PATHS.aboutContent),
		requestData(url, token, PATHS.siteMeta),
		requestData(url, token, PATHS.aboutRoute),
	]);
	if (
		!Array.isArray(aboutIntro) ||
		!Array.isArray(aboutContent) ||
		!Array.isArray(siteMeta) ||
		!Array.isArray(aboutRoutes) ||
		aboutRoutes.length !== 1
	) {
		throw new Error('[reserved-person-titles] malformed CMS snapshot response');
	}
	return {
		aboutIntro: aboutIntro as IntroRow[],
		aboutContent: aboutContent as AboutContentRow[],
		siteMeta: siteMeta as SiteMetaRow[],
		aboutRoute: aboutRoutes[0] as CmsSnapshot['aboutRoute'],
	};
}

async function sendPatch(url: string, token: string, step: TitlePatch): Promise<void> {
	const response = await fetch(`${url}${step.path}`, {
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
	await applyVerifiedPlan(plan, {
		readSnapshot: () => readSnapshot(url, token),
		sendPatch: (step) => sendPatch(url, token, step),
	});
	console.log(
		`[reserved-person-titles] verified ${plan.length} PATCHes; NO CHANGES remain`,
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
