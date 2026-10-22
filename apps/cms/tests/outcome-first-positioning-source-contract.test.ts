import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import {
	ABOUT_META_DESCRIPTION_BY_LOCALE,
	ABOUT_ROUTE_BY_LOCALE,
	HOME_DESCRIPTION_BY_LOCALE,
	SERVICES_DESCRIPTION_BY_LOCALE,
	SITE_META_BY_LOCALE,
	TITLE_BY_LOCALE,
} from '../fixtures/content/outcome-first-positioning';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const TITLES = TITLE_BY_LOCALE;

type Locale = keyof typeof TITLES;

const EXACT_COPY = {
	siteMeta: {
		en: {
			description:
				'Freelance digital solutions developer in Montréal helping Québec SMEs connect websites, data, reporting, automation, and workflows through practical, reliable systems.',
			default_description:
				'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
			owner_job_title: TITLES.en,
		},
		fr: {
			description:
				'Développeur de solutions numériques à la pige à Montréal, aidant les PME du Québec à relier sites web, données, rapports, automatisation et processus avec des systèmes fiables.',
			default_description:
				'yesid.dev aide les PME du Québec à relier sites web, données, rapports et processus par le web, l’automatisation, l’analytique, les bases de données et SQL.',
			owner_job_title: TITLES.fr,
		},
		es: {
			description:
				'Desarrollador de soluciones digitales en Montreal que ayuda a pymes de Québec a conectar sitios web, datos, reportes, automatización y procesos con sistemas confiables.',
			default_description:
				'yesid.dev ayuda a pymes de Québec a conectar sitios web, datos, reportes y procesos mediante desarrollo web, automatización, analítica, bases de datos y SQL.',
			owner_job_title: TITLES.es,
		},
	},
	routes: {
		'/': {
			en: {
				title: 'yesid. | Digital Infrastructure that Moves.',
				description:
					'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
			},
			fr: {
				title: 'yesid. | Infrastructure numérique qui avance.',
				description:
					'yesid.dev aide les PME du Québec à relier sites web, données, rapports et processus par le web, l’automatisation, l’analytique, les bases de données et SQL.',
			},
			es: {
				title: 'yesid. | Infraestructura digital que se mueve.',
				description:
					'yesid.dev ayuda a pymes de Québec a conectar sitios web, datos, reportes y procesos mediante desarrollo web, automatización, analítica, bases de datos y SQL.',
			},
		},
		'/about': {
			en: {
				title: TITLES.en,
				description:
					'Digital solutions developer in Montréal helping Québec SMEs connect websites, reports, and workflows through web, automation, analytics, databases, and SQL.',
			},
			fr: {
				title: TITLES.fr,
				description:
					"Développeur de solutions numériques à la pige à Montréal. J'aide les PME du Québec avec le web, l'automatisation, l'analytique, les bases de données et SQL.",
			},
			es: {
				title: TITLES.es,
				description:
					'Desarrollador freelance de soluciones digitales en Montreal. Ayudo a pymes de Québec con web, automatización, analítica, bases de datos y SQL confiables.',
			},
		},
		'/services': {
			en: {
				title: 'Digital Infrastructure Services: Web, Data, Automation',
				description:
					'Digital solutions for Québec SMEs: websites and e-commerce, workflow automation, dashboards and analytics, databases and SQL, built around real operations.',
			},
			fr: {
				title: 'Infrastructure numérique: web, données, automatisation',
				description:
					'Solutions numériques pour les PME du Québec : sites web et commerce en ligne, automatisation, tableaux de bord, analytique, bases de données et SQL fiables.',
			},
			es: {
				title: 'Infraestructura digital: web, datos, automatización',
				description:
					'Soluciones digitales para pymes de Québec: desarrollo web y e-commerce, automatización, tableros y analítica, bases de datos y SQL, según su operación real.',
			},
		},
	},
} as const;

const SQL_FIRST_PATTERNS = [
	/Freelance SQL(?: developer| and)/i,
	/Développeur SQL/i,
	/Desarrollador(?: freelance )?SQL/i,
	/Desarrollador SQL freelance/i,
	/SQL \+ digital infrastructure developer/i,
] as const;

const RESERVED_PERSON_TITLE_PATTERN = /\b(?:engineer|ingénieur|ingeniero)\b/i;

const OUTCOME_TERMS: Record<Locale, readonly RegExp[]> = {
	en: [
		/web(?:site| development)/i,
		/database|data/i,
		/automation|pipeline/i,
		/dashboard|reporting|analytics/i,
	],
	fr: [
		/\bweb\b|sites? web|développement web/i,
		/base de données|données/i,
		/automatisation|pipeline/i,
		/tableau de bord|rapport|analytique/i,
	],
	es: [
		/sitios? web|desarrollo web/i,
		/base de datos|datos/i,
		/automatización|pipeline/i,
		/tablero|reporte|analítica/i,
	],
};

function source(path: string): string {
	return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function json(path: string): any {
	return JSON.parse(source(path));
}

function byLocale(rows: any[]): Partial<Record<Locale, any>> {
	return Object.fromEntries(rows.map((row) => [row.languages_code, row]));
}

function route(path: string, fixture = 'apps/cms/fixtures/collections/route-seo.json'): any {
	const value = json(fixture).find((candidate: any) => candidate.path === path);
	expect(value, `missing ${path} in ${fixture}`).toBeDefined();
	return value;
}

function expectNotSqlFirst(label: string, values: readonly string[]): void {
	const violations = values.flatMap((value) =>
		SQL_FIRST_PATTERNS.flatMap((pattern) =>
			pattern.test(value) ? [`${label}: ${pattern.source} in ${JSON.stringify(value)}`] : [],
		),
	);
	expect(violations).toEqual([]);
}

function expectOutcomeBreadth(label: string, locale: Locale, value: string): void {
	const missing = OUTCOME_TERMS[locale].filter((pattern) => !pattern.test(value));
	expect(missing.map((pattern) => `${label}: missing ${pattern.source}`)).toEqual([]);
}

function arrayCopy(block: string, locale: Locale): string {
	const match = block.match(new RegExp(`${locale}:\\s*\\[([\\s\\S]*?)\\]`));
	expect(match, `missing ${locale} array`).not.toBeNull();
	return [...match![1].matchAll(/["']([^"']*)["']/g)].map((part) => part[1]).join(' ');
}

function expectGeneratedLiteral(content: string, value: string): void {
	const singleQuoted = value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
	expect(content.includes(value) || content.includes(singleQuoted), value).toBe(true);
}

describe('outcome-first positioning source contract', () => {
	test('the exact EN, FR, and ES global and route copy stays frozen across source and generated output', () => {
		const siteMeta = byLocale(json('apps/cms/fixtures/singletons/site-meta.json').translations);
		for (const locale of Object.keys(TITLES) as Locale[]) {
			for (const [field, value] of Object.entries(EXACT_COPY.siteMeta[locale])) {
				expect(siteMeta[locale]?.[field]).toBe(value);
			}
			expect(SITE_META_BY_LOCALE[locale]).toEqual(EXACT_COPY.siteMeta[locale]);
			expect(HOME_DESCRIPTION_BY_LOCALE[locale]).toBe(EXACT_COPY.routes['/'][locale].description);
			expect(ABOUT_ROUTE_BY_LOCALE[locale]).toEqual(EXACT_COPY.routes['/about'][locale]);
			expect(ABOUT_META_DESCRIPTION_BY_LOCALE[locale]).toBe(
				EXACT_COPY.routes['/about'][locale].description,
			);
			expect(SERVICES_DESCRIPTION_BY_LOCALE[locale]).toBe(
				EXACT_COPY.routes['/services'][locale].description,
			);
		}

		const spanishInput = json('apps/cms/ops/i18n/es-2026-07-09.json');
		const spanishRoutes = Object.fromEntries(
			spanishInput.entries
				.filter((entry: any) => entry.collection === 'route_seo')
				.map((entry: any) => [entry.id, entry.fields]),
		);
		const routeIds = { '/': 1, '/about': 2, '/services': 4 } as const;

		for (const path of Object.keys(EXACT_COPY.routes) as (keyof typeof EXACT_COPY.routes)[]) {
			const fixture = byLocale(route(path).translations);
			expect(fixture.en).toEqual({
				languages_code: 'en',
				...EXACT_COPY.routes[path].en,
			});
			expect(fixture.fr).toEqual({
				languages_code: 'fr',
				...EXACT_COPY.routes[path].fr,
			});
			expect(spanishRoutes[routeIds[path]]).toEqual(EXACT_COPY.routes[path].es);
		}

		const aboutMeta = json('apps/cms/fixtures/content/about-page.json').meta.description;
		const aboutIntro = json('apps/cms/fixtures/content/site-content.json').aboutIntroContent.title;
		for (const locale of Object.keys(TITLES) as Locale[]) {
			expect(aboutMeta[locale]).toBe(EXACT_COPY.routes['/about'][locale].description);
			expect(aboutIntro[locale]).toBe(TITLES[locale]);
		}

		const generated = [
			source('apps/web/src/lib/content/site-meta.ts'),
			source('apps/web/src/lib/content/route-seo.ts'),
			source('apps/web/src/lib/content/site-content.ts'),
			source('apps/web/src/lib/content/about-page.ts'),
		].join('\n');
		for (const locale of Object.keys(TITLES) as Locale[]) {
			for (const value of Object.values(EXACT_COPY.siteMeta[locale])) {
				expectGeneratedLiteral(generated, value);
			}
			for (const copy of Object.values(EXACT_COPY.routes)) {
				for (const value of Object.values(copy[locale])) expectGeneratedLiteral(generated, value);
			}
		}
	});

	test('exact umbrella titles propagate through CMS fixtures, generated fallbacks, and migration inputs', () => {
		const siteMeta = byLocale(json('apps/cms/fixtures/singletons/site-meta.json').translations);
		const aboutRoute = byLocale(route('/about').translations);
		const siteContent = json('apps/cms/fixtures/content/site-content.json');
		const aboutCard = json('apps/cms/fixtures/assets-manifest.json').assets.find(
			(asset: any) => asset.legacyPath === 'og/routes/about.png',
		);
		for (const locale of Object.keys(TITLES) as Locale[]) {
			expect(siteMeta[locale]?.owner_job_title).toBe(TITLES[locale]);
			expect(aboutRoute[locale]?.title).toBe(TITLES[locale]);
			expect(siteContent.aboutIntroContent.title[locale]).toBe(TITLES[locale]);
		}
		expect(aboutCard.description).toContain(TITLES.en);

		const generated = [
			source('apps/web/src/lib/content/site-meta.ts'),
			source('apps/web/src/lib/content/route-seo.ts'),
			source('apps/web/src/lib/content/site-content.ts'),
			source('apps/cms/fixtures/content/outcome-first-positioning.ts'),
			source('apps/cms/scripts/go2-message-pass.ts'),
		];
		for (const title of Object.values(TITLES)) {
			for (const content of generated) expect(content).toContain(title);
		}
	});

	test('replayable locale inputs and current fetcher fixtures cannot restore reserved titles', () => {
		for (const path of [
			'apps/cms/ops/i18n/fr-2026-06-13.json',
			'apps/cms/ops/i18n/fr-translations.example.json',
			'apps/cms/ops/i18n/es-2026-07-09.json',
		]) {
			expect(source(path), path).not.toMatch(RESERVED_PERSON_TITLE_PATTERN);
		}

		const fetcherTest = source('apps/cms/scripts/lib/fetchers/site-meta.test.ts');
		for (const title of Object.values(TITLES)) expect(fetcherTest).toContain(title);
		expect(fetcherTest).not.toMatch(RESERVED_PERSON_TITLE_PATTERN);
		expectNotSqlFirst('site-meta fetcher fixture', [fetcherTest]);
	});

	test('global, home, about, and aggregate services copy leads with outcomes instead of SQL', () => {
		const siteMeta = byLocale(json('apps/cms/fixtures/singletons/site-meta.json').translations);
		const home = byLocale(route('/').translations);
		const about = byLocale(route('/about').translations);
		const services = byLocale(route('/services').translations);
		const identitySurfaces = [
			'apps/cms/scripts/go2-message-pass.ts',
			'apps/cms/fixtures/content/about-page.json',
			'apps/cms/fixtures/content/site-content.json',
			'apps/cms/fixtures/assets-manifest.json',
			'apps/web/src/lib/content/site-meta.ts',
			'apps/web/src/lib/content/site-seo-defaults.ts',
			'apps/web/src/lib/content/route-seo.ts',
			'apps/web/src/lib/content/about-page.ts',
			'apps/web/src/lib/content/site-content.ts',
		];

		for (const locale of Object.keys(TITLES) as Locale[]) {
			const globalCopy = [
				siteMeta[locale]?.description,
				siteMeta[locale]?.default_description,
			].filter((value): value is string => typeof value === 'string');
			expectNotSqlFirst(`site_meta.${locale}`, globalCopy);
			for (const value of globalCopy) expectOutcomeBreadth(`site_meta.${locale}`, locale, value);

			const routeCopy = [
				home[locale]?.title,
				home[locale]?.description,
				about[locale]?.title,
				about[locale]?.description,
				services[locale]?.title,
				services[locale]?.description,
			].filter((value): value is string => typeof value === 'string');
			expectNotSqlFirst(`route_seo.${locale}`, routeCopy);
			if (home[locale]?.description) {
				expectOutcomeBreadth(`home.${locale}`, locale, home[locale].description);
			}
			if (services[locale]?.description) {
				expectOutcomeBreadth(`services.${locale}`, locale, services[locale].description);
			}
		}

		for (const path of identitySurfaces) {
			expectNotSqlFirst(path, [source(path)]);
		}
	});

	test('llms and Directus editorial prompts use the umbrella identity without ranking SQL first', () => {
		const llms = source('apps/web/src/lib/server/llms.ts');
		expect(llms).toContain(TITLES.en);
		expect(llms).toContain(TITLES.es);
		expectNotSqlFirst('llms.ts', [llms]);

		const [settings] = json('apps/cms/directus/collections/settings.json');
		for (const field of ['mcp_system_prompt', 'ai_system_prompt'] as const) {
			expect(settings[field]).toContain(`Yesid Otalora (${TITLES.en})`);
			expectNotSqlFirst(`settings.${field}`, [settings[field]]);
		}
	});

	test('default and route OG generators carry the outcome-first identity in every locale', () => {
		const defaultOg = source('apps/web/scripts/generate-og-default.ts');
		expect(defaultOg).toContain('generate-og-cards.ts');
		expect(defaultOg).not.toContain('siteMeta.tagline');
		expect(defaultOg).not.toContain('new Resvg');

		const routeOg = source('apps/web/scripts/generate-og-cards.ts');
		for (const copy of [
			'DIGITAL SOLUTIONS · MONTRÉAL',
			'SOLUTIONS NUMÉRIQUES · MONTRÉAL',
			'SOLUCIONES DIGITALES · MONTRÉAL',
		]) {
			expect(routeOg).toContain(copy);
		}
		const aboutBlock = routeOg.match(
			/about:\s*\{[\s\S]*?subtitle:\s*\{([\s\S]*?)\}\s*satisfies LL/,
		)?.[1];
		expect(aboutBlock).toBeDefined();
		for (const locale of Object.keys(TITLES) as Locale[]) {
			expect(arrayCopy(aboutBlock!, locale)).toBe(TITLES[locale]);
		}
		expect(routeOg).toContain('fitSize([SITE[loc].tagline], WIDTH - 2 * MARGIN');
		expect(routeOg).toContain('font-size="${siteTaglineSize}"');
		expectNotSqlFirst('generate-og-cards.ts', [routeOg]);
	});

	test('the replayable Spanish publication input cannot restore SQL-first route copy', () => {
		const input = json('apps/cms/ops/i18n/es-2026-07-09.json');
		const serializedInput = JSON.stringify(input);
		const routeEntries = Object.fromEntries(
			input.entries
				.filter((entry: any) => entry.collection === 'route_seo')
				.map((entry: any) => [entry.id, entry.fields]),
		);

		expect(routeEntries[2].title).toBe(TITLES.es);
		for (const id of [1, 2, 4]) {
			expectNotSqlFirst(`es-2026 route ${id}`, Object.values(routeEntries[id]));
		}
		expectOutcomeBreadth('es-2026 home', 'es', routeEntries[1].description);
		expectOutcomeBreadth('es-2026 services', 'es', routeEntries[4].description);
		expect(serializedInput).not.toMatch(/\bingeniero\b/i);

		// SQL remains valid inside its own service offer and historical blog copy.
		expect(
			input.entries.find(
				(entry: any) => entry.collection === 'services' && entry.id === 'sql-development',
			)?.fields.title,
		).toContain('SQL');
	});
});
