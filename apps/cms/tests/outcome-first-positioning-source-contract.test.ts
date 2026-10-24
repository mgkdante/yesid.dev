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

function source(path: string): string {
	return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function json(path: string): any {
	return JSON.parse(source(path));
}

function expectNotSqlFirst(label: string, values: readonly string[]): void {
	const violations = values.flatMap((value) =>
		SQL_FIRST_PATTERNS.flatMap((pattern) =>
			pattern.test(value) ? [`${label}: ${pattern.source} in ${JSON.stringify(value)}`] : [],
		),
	);
	expect(violations).toEqual([]);
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
		for (const locale of Object.keys(TITLES) as Locale[]) {
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

	test('exact umbrella titles propagate through generated fallbacks and migration inputs', () => {
		const aboutCard = json('apps/cms/fixtures/assets-manifest.json').assets.find(
			(asset: any) => asset.legacyPath === 'og/routes/about.png',
		);
		expect(aboutCard.description).toContain(TITLES.en);

		const generated = [
			source('apps/web/src/lib/content/site-meta.ts'),
			source('apps/web/src/lib/content/route-seo.ts'),
			source('apps/web/src/lib/content/site-content.ts'),
			source('apps/cms/fixtures/content/outcome-first-positioning.ts'),
		];
		for (const title of Object.values(TITLES)) {
			for (const content of generated) expect(content).toContain(title);
		}
	});

	test('current fetcher fixtures cannot restore reserved titles', () => {
		const fetcherTest = source('apps/cms/scripts/lib/fetchers/site-meta.test.ts');
		for (const title of Object.values(TITLES)) expect(fetcherTest).toContain(title);
		expect(fetcherTest).not.toMatch(RESERVED_PERSON_TITLE_PATTERN);
		expectNotSqlFirst('site-meta fetcher fixture', [fetcherTest]);
	});

	test('global, home, about, and aggregate services copy leads with outcomes instead of SQL', () => {
		const identitySurfaces = [
			'apps/cms/fixtures/assets-manifest.json',
			'apps/web/src/lib/content/site-meta.ts',
			'apps/web/src/lib/content/site-seo-defaults.ts',
			'apps/web/src/lib/content/route-seo.ts',
			'apps/web/src/lib/content/about-page.ts',
			'apps/web/src/lib/content/site-content.ts',
		];

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
});
