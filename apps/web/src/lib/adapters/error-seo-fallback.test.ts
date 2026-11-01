import { describe, expect, it } from 'vitest';
import type { SiteMeta, SiteSeoDefaults } from '#lib/types.ts';
import { errorSeoFallback, errorTitleBody } from './error-seo-fallback';

const siteMeta = {
	name: 'yesid.',
	tagline: { en: 'Digital systems that do their job.' },
	description: { en: 'Independent digital practice.' },
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
	},
	owner: {
		name: 'Yesid Otalora',
		jobTitle: { en: 'Freelance Digital Infrastructure Developer' },
		knowsAbout: ['PostgreSQL', 'SvelteKit'],
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA',
		},
	},
} satisfies SiteMeta;

const siteSeoDefaults = {
	defaultOgImage: null,
	themeColor: '#141414',
	defaultDescription: { en: 'Fallback description.' },
} satisfies SiteSeoDefaults;

describe('errorSeoFallback boundary', () => {

	it('preserves the representative error SEO contract', () => {
		expect(errorSeoFallback({ locale: 'fr', siteMeta, siteSeoDefaults })).toEqual({
			title: { en: 'Not Found | yesid.' },
			description: { en: 'Fallback description.' },
			canonical: 'https://yesid.dev',
			ogType: 'website',
			noIndex: true,
		});
	});

	it('uses the status row tab title, then the code 0 row, then the default text', () => {
		const rows = { 0: { browserTitle: { en: 'Lost' } }, 404: { browserTitle: { en: 'Missing' } }, 500: {} };
		expect(errorTitleBody(rows, 404)).toEqual({ en: 'Missing' });
		expect(errorTitleBody(rows, 500)).toEqual({ en: 'Lost' });
		expect(errorTitleBody(rows, 503)).toEqual({ en: 'Lost' });
		expect(errorTitleBody({ 404: {} }, 404)).toEqual({ en: 'Not Found' });
	});

	it('appends the brand to the browser tab title from the CMS', () => {
		const titleBody = { en: 'Lost', fr: 'Perdu' };
		expect(errorSeoFallback({ locale: 'fr', siteMeta, siteSeoDefaults, titleBody }).title).toEqual({
			en: 'Lost | yesid.',
			fr: 'Perdu | yesid.',
		});
	});
});
