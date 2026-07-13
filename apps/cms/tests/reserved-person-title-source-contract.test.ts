import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const RECONCILER = join(import.meta.dir, '..', 'scripts', 'reconcile-reserved-person-titles.ts');

const ACTIVE_TITLE_SOURCES = [
	'apps/cms/scripts/go2-message-pass.ts',
	'apps/cms/fixtures/singletons/site-meta.json',
	'apps/cms/fixtures/collections/route-seo.json',
	'apps/cms/fixtures/content/about-page.json',
	'apps/cms/fixtures/content/site-content.json',
	'apps/cms/fixtures/assets-manifest.json',
	'apps/cms/directus/collections/settings.json',
	'apps/web/src/lib/server/llms.ts',
	'apps/web/scripts/generate-og-cards.ts',
	'apps/web/src/lib/content/site-meta.ts',
	'apps/web/src/lib/content/route-seo.ts',
	'apps/web/src/lib/content/about-page.ts',
	'apps/web/src/lib/content/site-content.ts',
] as const;

const APPROVED_TITLES = {
	en: 'Freelance SQL and Digital Infrastructure Developer',
	fr: 'Développeur SQL et en infrastructure numérique, à la pige',
	es: 'Desarrollador freelance SQL y de infraestructura digital',
} as const;

const APPROVED_ABOUT_DESCRIPTIONS = {
	en: "Freelance SQL and Digital Infrastructure Developer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
	fr: "Développeur SQL et en infrastructure numérique, à la pige, basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
	es: 'Desarrollador freelance SQL y de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
} as const;

const COPY_FREEZE_SHA256: Record<(typeof ACTIVE_TITLE_SOURCES)[number], string> = {
	'apps/cms/scripts/go2-message-pass.ts':
		'ce5613af32ca0048212fda57b6b929d3af507d85cd7ecebd57d9f8e6f366e3d9',
	'apps/cms/fixtures/singletons/site-meta.json':
		'a625c74c03415a68a3ae6ace28cd0ea4ab4785bbc42b4cbea97068fdb4388760',
	'apps/cms/fixtures/collections/route-seo.json':
		'1ee819348778cddceb55f8a876523c8503a049fdc620925c23e3297e2b867ff2',
	'apps/cms/fixtures/content/about-page.json':
		'9352ffbe2b48f3f12c724caac1e80ce553d9a6cdc9a9164e43aa99688f26ae0e',
	'apps/cms/fixtures/content/site-content.json':
		'2d23cafae380f5511a07cc74ee521c1a3ef91c8eeab487e33ce827d2575ebdc2',
	'apps/cms/fixtures/assets-manifest.json':
		'9a9d919278c41660e2dbdcfce3e287482bb80f1a887f915386838a4b846ee6d1',
	'apps/cms/directus/collections/settings.json':
		'679fc717b00b941e896c6bf54e1c3c57db0c73d22e7a96b2eace43e56ec1f501',
	'apps/web/src/lib/server/llms.ts':
		'2e0781d3c3f83d92f8c8c7a999b5b5d1756b8ac7898fff907e3d0fd413367d21',
	'apps/web/scripts/generate-og-cards.ts':
		'54be57948b8598092b771a3e859ce53da32833576cf3e2250be58e5f5033c770',
	'apps/web/src/lib/content/site-meta.ts':
		'3dd41d3026bc43d687dad7d54c1c8e005eb6f2542ea18cb01306620b52948a7c',
	'apps/web/src/lib/content/route-seo.ts':
		'dd3fbdce3a484bc105bdcab988a6c4627da10f442a617a8839d30264abbc14c4',
	'apps/web/src/lib/content/about-page.ts':
		'2d58dfff451bc4c958245b9a5dfbec0046e5777f705289275eb263479d592530',
	'apps/web/src/lib/content/site-content.ts':
		'd9fb9cd7872b326aef079156bafc778f7ba608ce9cd6dd22110724f3c8e45d19',
};

const EXACT_CODE_FIELD_FRAGMENTS = {
	'apps/cms/scripts/go2-message-pass.ts': [
		`export const SELF_TITLE = '${APPROVED_TITLES.en}';`,
		`fr: { owner_job_title: '${APPROVED_TITLES.fr}' },`,
		`es: { owner_job_title: '${APPROVED_TITLES.es}' },`,
	],
	'apps/web/src/lib/server/llms.ts': [
		`works as a ${APPROVED_TITLES.en} in Montreal`,
		`trabaja como ${APPROVED_TITLES.es} en Montreal`,
	],
	'apps/web/scripts/generate-og-cards.ts': [
		"en: ['Freelance SQL and', 'Digital Infrastructure', 'Developer']",
		"fr: ['Développeur SQL et en', 'infrastructure numérique,', 'à la pige']",
		"es: ['Desarrollador freelance SQL', 'y de infraestructura digital']",
	],
	'apps/web/src/lib/content/site-meta.ts': [
		`en: '${APPROVED_TITLES.en}'`,
		`fr: '${APPROVED_TITLES.fr}'`,
		`es: '${APPROVED_TITLES.es}'`,
	],
	'apps/web/src/lib/content/route-seo.ts': [
		`en: '${APPROVED_TITLES.en}'`,
		`fr: '${APPROVED_TITLES.fr}'`,
		`es: '${APPROVED_TITLES.es}'`,
	],
	'apps/web/src/lib/content/about-page.ts': [
		`en: '${APPROVED_ABOUT_DESCRIPTIONS.en.replaceAll("'", "\\'")}'`,
		`fr: '${APPROVED_ABOUT_DESCRIPTIONS.fr.replaceAll("'", "\\'")}'`,
		`es: '${APPROVED_ABOUT_DESCRIPTIONS.es}'`,
	],
	'apps/web/src/lib/content/site-content.ts': [
		`en: '${APPROVED_TITLES.en}'`,
		`fr: '${APPROVED_TITLES.fr}'`,
		`es: '${APPROVED_TITLES.es}'`,
	],
} as const;

const RESERVED_PERSON_TITLE_PATTERNS = [
	/Digital Infrastructure Engineer/i,
	/ingénieur(?: pigiste)?(?: d'| en )infrastructure numérique/i,
	/ingeniero(?: freelance| independiente)? de infraestructura digital/i,
	/data \+ web engineer/i,
] as const;

function source(path: string): string {
	return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function json(path: string): any {
	return JSON.parse(source(path));
}

describe('reserved person-title source contract', () => {
	test('guarded CMS reconciler exists', () => {
		expect(existsSync(RECONCILER)).toBe(true);
	});

	test('active title sources contain no reserved person-title wording', () => {
		const violations = ACTIVE_TITLE_SOURCES.flatMap((path) =>
			RESERVED_PERSON_TITLE_PATTERNS.flatMap((pattern) =>
				pattern.test(source(path)) ? [`${path}: ${pattern.source}`] : [],
			),
		);
		expect(violations).toEqual([]);
	});

	test('each code and generated surface carries its locale-owned exact approved field', () => {
		const violations = Object.entries(EXACT_CODE_FIELD_FRAGMENTS).flatMap(
			([path, fragments]) =>
				fragments.flatMap((fragment) => {
					const count = source(path).split(fragment).length - 1;
					return count === 1 ? [] : [`${path}: expected one exact field fragment, found ${count}`];
				}),
		);
		expect(violations).toEqual([]);
	});

	test('structured fixtures bind the approved copy to the correct locale and field', () => {
		const siteMeta = json('apps/cms/fixtures/singletons/site-meta.json');
		const siteMetaByLocale = Object.fromEntries(
			siteMeta.translations.map((row: any) => [row.languages_code, row]),
		);
		for (const locale of ['en', 'fr', 'es'] as const) {
			expect(siteMetaByLocale[locale].owner_job_title).toBe(APPROVED_TITLES[locale]);
		}

		const aboutRoute = json('apps/cms/fixtures/collections/route-seo.json').find(
			(row: any) => row.path === '/about',
		);
		expect(
			Object.fromEntries(
				aboutRoute.translations.map((row: any) => [row.languages_code, row.title]),
			),
		).toEqual(APPROVED_TITLES);

		const aboutPage = json('apps/cms/fixtures/content/about-page.json');
		expect(aboutPage.meta.description).toEqual(APPROVED_ABOUT_DESCRIPTIONS);
		const siteContent = json('apps/cms/fixtures/content/site-content.json');
		expect(siteContent.aboutIntroContent.title).toEqual(APPROVED_TITLES);

		const aboutCard = json('apps/cms/fixtures/assets-manifest.json').assets.find(
			(asset: any) => asset.legacyPath === 'og/routes/about.png',
		);
		expect(aboutCard.description).toBe(
			`Share card for the /about route: Yesid O., ${APPROVED_TITLES.en}, with headshot.`,
		);

		const [settings] = json('apps/cms/directus/collections/settings.json');
		expect(settings.mcp_system_prompt).toContain(
			'Yesid Otalora (SQL + digital infrastructure developer)',
		);
		expect(settings.ai_system_prompt).toContain(
			'Yesid Otalora (SQL + digital infrastructure developer)',
		);
	});

	test('copy-freeze checksums lock every non-target leaf on each active surface', () => {
		const drifts = ACTIVE_TITLE_SOURCES.flatMap((path) => {
			const actual = createHash('sha256').update(source(path)).digest('hex');
			return actual === COPY_FREEZE_SHA256[path]
				? []
				: [`${path}: expected ${COPY_FREEZE_SHA256[path]}, received ${actual}`];
		});
		expect(drifts).toEqual([]);
	});
});
