import { describe, expect, it } from 'vitest';
import type { SiteMeta, SiteSeoDefaults } from '#lib/types.ts';
import { errorSeoFallback } from './error-seo-fallback';

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
		jobTitle: { en: 'Freelance Digital Solutions Developer' },
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
});
