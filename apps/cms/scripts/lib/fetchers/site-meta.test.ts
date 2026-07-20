/**
 * Snapshot test for the site-meta fetcher.
 *
 * Verifies that a Directus singleton payload (the kind `readSingleton('site_meta')`
 * returns) round-trips through `toSiteMeta()` + `SiteMetaSchema.parse()` and
 * produces the same shape that `apps/web/src/lib/content/site-meta.ts` currently
 * exports. Catches transform bugs at unit-test time (sub-second) before P7's
 * end-to-end drift check runs against live CMS.
 *
 * Fixture is hand-crafted to mirror the live `site_meta` row as seeded by
 * `apps/cms/scripts/seed-site-meta.ts` and reflected in `siteMeta` today.
 */

import { describe, expect, it } from 'bun:test';
import { toSiteMeta, type DirectusSiteMetaRow } from './site-meta';
import { SiteMetaSchema } from '@repo/shared/schemas';
import type { SiteMeta } from '@repo/shared';
// Hand-crafted Directus response mirroring the current production `site_meta`
// singleton. Crafted so toSiteMeta(fixture) === EXPECTED_SITE_META (the value
// currently exported from apps/web/src/lib/content/site-meta.ts).
const SITE_META_FIXTURE: DirectusSiteMetaRow = {
	id: 1,
	name: 'yesid.',
	email: 'contact@yesid.dev',
	github_url: 'https://github.com/mgkdante',
	linkedin_url: 'https://www.linkedin.com/in/otaloray/',
	upwork_url: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82',
	owner_name: 'Yesid O.',
	owner_locality: 'Montreal',
	owner_region: 'QC',
	owner_country: 'CA',
	owner_phone: '+12025550100',
	owner_knows_about: [
		'PostgreSQL',
		'dbt',
		'Power BI',
		'Python',
		'Digital Infrastructure',
		'ETL',
		'Data Warehousing',
		'SvelteKit',
		'TypeScript',
	],
	default_og_image: null,
	theme_color: '#141414',
	translations: [
		{
			languages_code: 'en',
			tagline: 'Digital infrastructure that moves.',
			description:
				'Freelance digital solutions developer in Montréal helping Québec SMEs connect websites, data, reporting, automation, and workflows through practical, reliable systems.',
			default_description:
				'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
			owner_job_title: 'Freelance Digital Solutions Developer',
		},
		{
			languages_code: 'fr',
			tagline: 'Une infrastructure numérique qui bouge.',
			description:
				'Développeur de solutions numériques à la pige à Montréal, aidant les PME du Québec à relier sites web, données, rapports, automatisation et processus avec des systèmes fiables.',
			default_description:
				'yesid.dev aide les PME du Québec à relier sites web, données, rapports et processus par le web, l’automatisation, l’analytique, les bases de données et SQL.',
			owner_job_title: 'Développeur de solutions numériques à la pige',
		},
		{
			languages_code: 'es',
			tagline: 'Infraestructura digital que se mueve.',
			description:
				'Desarrollador de soluciones digitales en Montreal que ayuda a pymes de Québec a conectar sitios web, datos, reportes, automatización y procesos con sistemas confiables.',
			default_description:
				'yesid.dev ayuda a pymes de Québec a conectar sitios web, datos, reportes y procesos mediante desarrollo web, automatización, analítica, bases de datos y SQL.',
			owner_job_title: 'Desarrollador freelance de soluciones digitales',
		},
	],
};

// Mirrors `siteMeta` exported by apps/web/src/lib/content/site-meta.ts today.
// If site-meta.ts is edited, this constant + the fixture above must move
// together; P7 drift check is the integration-level guard against forgetting.
const EXPECTED_SITE_META: SiteMeta = {
	name: 'yesid.',
	tagline: {
		en: 'Digital infrastructure that moves.',
		fr: 'Une infrastructure numérique qui bouge.',
		es: 'Infraestructura digital que se mueve.',
	},
	description: {
		en: 'Freelance digital solutions developer in Montréal helping Québec SMEs connect websites, data, reporting, automation, and workflows through practical, reliable systems.',
		fr: 'Développeur de solutions numériques à la pige à Montréal, aidant les PME du Québec à relier sites web, données, rapports, automatisation et processus avec des systèmes fiables.',
		es: 'Desarrollador de soluciones digitales en Montreal que ayuda a pymes de Québec a conectar sitios web, datos, reportes, automatización y procesos con sistemas confiables.',
	},
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
		upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82',
	},
	owner: {
		name: 'Yesid O.',
		jobTitle: {
			en: 'Freelance Digital Solutions Developer',
			fr: 'Développeur de solutions numériques à la pige',
			es: 'Desarrollador freelance de soluciones digitales',
		},
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA',
		},
		knowsAbout: [
			'PostgreSQL',
			'dbt',
			'Power BI',
			'Python',
			'Digital Infrastructure',
			'ETL',
			'Data Warehousing',
			'SvelteKit',
			'TypeScript',
		],
	},
};

describe('site-meta fetcher', () => {
	it('does not publish a phone value stored in the private CMS field', () => {
		const result = toSiteMeta({
			...SITE_META_FIXTURE,
			owner_phone: '+12025550100',
		});

		expect(result.owner).not.toHaveProperty('phone');
	});

	it('transforms a Directus singleton row into the current SiteMeta shape', () => {
		const result = toSiteMeta(SITE_META_FIXTURE);
		expect(result).toEqual(EXPECTED_SITE_META);
	});

	it('output parses through SiteMetaSchema (Zod gate)', () => {
		const result = toSiteMeta(SITE_META_FIXTURE);
		expect(() => SiteMetaSchema.parse(result)).not.toThrow();
	});

	it('handles owner_knows_about CSV-string fallback (non-SDK code paths)', () => {
		const csvFixture: DirectusSiteMetaRow = {
			...SITE_META_FIXTURE,
			owner_knows_about: 'PostgreSQL, dbt, Power BI ',
		};
		const result = toSiteMeta(csvFixture);
		expect(result.owner.knowsAbout).toEqual(['PostgreSQL', 'dbt', 'Power BI']);
	});

	it('omits optional links when null/undefined in Directus row', () => {
		const minimalFixture: DirectusSiteMetaRow = {
			...SITE_META_FIXTURE,
			linkedin_url: null,
			upwork_url: null,
		};
		const result = toSiteMeta(minimalFixture);
		expect(result.links).toEqual({
			email: 'contact@yesid.dev',
			github: 'https://github.com/mgkdante',
		});
	});

	it('LocalizedString shape carries the complete EN/FR/ES source', () => {
		const result = toSiteMeta(SITE_META_FIXTURE);
		expect(result.tagline).toEqual({
			en: 'Digital infrastructure that moves.',
			fr: 'Une infrastructure numérique qui bouge.',
			es: 'Infraestructura digital que se mueve.',
		});
		expect(result.description.en).toBeTruthy();
		expect(result.description.fr).toBeTruthy();
		expect(result.description.es).toBeTruthy();
	});
});
