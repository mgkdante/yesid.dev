/**
 * Snapshot test for the site-meta fetcher.
 *
 * Verifies that a Directus singleton payload (the kind `readSingleton('site_meta')`
 * returns) round-trips through `toSiteMeta()` + `SiteMetaSchema.parse()` and
 * produces the same shape that `apps/web/src/lib/content/site-meta.ts` currently
 * exports. Catches transform bugs at unit-test time (sub-second) before P7's
 * end-to-end drift check runs against live CMS.
 *
 * Fixture is hand-crafted to mirror the live `site_meta` row
 * reflected in `siteMeta` today.
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
				'Freelance digital infrastructure developer in Montréal helping businesses across Canada connect websites, data, reporting, automation, and workflows.',
			default_description:
				'yesid.dev helps businesses in Québec and across Canada connect websites, data, reporting, and workflows through web, automation, analytics, databases, and SQL.',
			owner_job_title: 'Freelance Digital Infrastructure Developer',
		},
		{
			languages_code: 'fr',
			tagline: 'Une infrastructure numérique qui bouge.',
			description:
				'Développeur en infrastructure numérique à la pige à Montréal, aidant les entreprises partout au Canada à relier sites web, données, rapports et processus.',
			default_description:
				'yesid.dev aide les entreprises du Québec et de partout au Canada à relier sites web, données, rapports et processus : web, automatisation, analytique et SQL.',
			owner_job_title: 'Développeur en infrastructure numérique à la pige',
		},
		{
			languages_code: 'es',
			tagline: 'Infraestructura digital que se mueve.',
			description:
				'Desarrollador de infraestructura digital en Montreal que ayuda a empresas de todo Canadá a conectar sitios web, datos, reportes, automatización y procesos.',
			default_description:
				'yesid.dev ayuda a empresas de Québec y de todo Canadá a conectar sitios web, datos, reportes y procesos con web, automatización, analítica, bases de datos y SQL.',
			owner_job_title: 'Desarrollador freelance de infraestructura digital',
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
		en: 'Freelance digital infrastructure developer in Montréal helping businesses across Canada connect websites, data, reporting, automation, and workflows.',
		fr: 'Développeur en infrastructure numérique à la pige à Montréal, aidant les entreprises partout au Canada à relier sites web, données, rapports et processus.',
		es: 'Desarrollador de infraestructura digital en Montreal que ayuda a empresas de todo Canadá a conectar sitios web, datos, reportes, automatización y procesos.',
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
			en: 'Freelance Digital Infrastructure Developer',
			fr: 'Développeur en infrastructure numérique à la pige',
			es: 'Desarrollador freelance de infraestructura digital',
		},
		phone: '+12025550100',
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
	it('publishes the CMS phone only as the owner phone used by the search-engine data', () => {
		const result = toSiteMeta({ ...SITE_META_FIXTURE, owner_phone: ' +12025550100 ' });

		expect(result.owner.phone).toBe('+12025550100');
		expect(JSON.stringify(result).split('2025550100')).toHaveLength(2);
	});

	it.each([null, undefined, '', '   '])('omits the phone when the CMS field is %p', (owner_phone) => {
		expect(toSiteMeta({ ...SITE_META_FIXTURE, owner_phone }).owner).not.toHaveProperty('phone');
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
