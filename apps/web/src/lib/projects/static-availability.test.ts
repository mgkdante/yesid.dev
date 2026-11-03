import { describe, expect, it } from 'vitest';
import { getPublicProjects, getFeaturedProjects } from './static-helpers';
import { getVisibleServices } from '#lib/services/static-helpers.ts';

describe('listing helpers use the request locale and the site pages registry', () => {
	it.each(['en', 'fr', 'es'] as const)('omits unavailable %s listings and featured projects', (locale) => {
		for (const read of [getPublicProjects, getFeaturedProjects, getVisibleServices]) {
			expect(read(locale, { locales: [] })).toEqual([]);
			expect(read(locale, { pages: [] })).toEqual([]);
			expect(read(locale, { locales: [locale] }).length).toBeGreaterThan(0);
		}
	});
});
