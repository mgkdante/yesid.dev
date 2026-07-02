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
import { SiteMetaSchema, type SiteMeta } from '../schemas/site-meta';

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
				'Freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
			default_description:
				'yesid., freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
			owner_job_title: 'Freelance Digital Infrastructure Engineer',
		},
		{
			languages_code: 'fr',
			tagline: 'Une infrastructure numérique qui bouge.',
			description:
				"Ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
			default_description:
				"yesid., ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
			owner_job_title: 'Ingénieur pigiste en infrastructure numérique',
		},
		{
			languages_code: 'es',
			owner_job_title: 'Ingeniero independiente en infraestructura digital',
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
	},
	description: {
		en: 'Freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
		fr: "Ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
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
			en: 'Freelance Digital Infrastructure Engineer',
			fr: 'Ingénieur pigiste en infrastructure numérique',
			es: 'Ingeniero independiente en infraestructura digital',
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

	it('LocalizedString shape: omits absent es locale for fields not translated', () => {
		const result = toSiteMeta(SITE_META_FIXTURE);
		// tagline + description carry en + fr in the current fixture; es stays absent
		expect(result.tagline).toEqual({
			en: 'Digital infrastructure that moves.',
			fr: 'Une infrastructure numérique qui bouge.',
		});
		expect(result.description.en).toBeTruthy();
		expect(result.description.fr).toBeTruthy();
		expect(result.description.es).toBeUndefined();
	});
});
