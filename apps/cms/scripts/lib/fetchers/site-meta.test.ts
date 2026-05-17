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
				'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.',
			default_description:
				'yesid. — freelance data infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, Python. Real-time pipelines, analytics, dashboards for growing teams.',
			owner_job_title: 'Digital Infrastructure Consultant',
		},
		{
			languages_code: 'fr',
			owner_job_title: 'Consultant en infrastructure numérique',
		},
		{
			languages_code: 'es',
			owner_job_title: 'Consultor de infraestructura digital',
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
	},
	description: {
		en: 'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.',
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
			en: 'Digital Infrastructure Consultant',
			fr: 'Consultant en infrastructure numérique',
			es: 'Consultor de infraestructura digital',
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

	it('LocalizedString shape: omits absent fr/es locales for fields not translated', () => {
		const result = toSiteMeta(SITE_META_FIXTURE);
		// tagline + description are en-only in current fixture
		expect(result.tagline).toEqual({ en: 'Digital infrastructure that moves.' });
		expect(result.description.en).toBeTruthy();
		expect(result.description.fr).toBeUndefined();
		expect(result.description.es).toBeUndefined();
	});
});
