import { describe, expect, it } from 'vitest';
import { createContentCatalog } from '#lib/catalog/index.ts';

describe('listing helpers use the request locale and the site pages registry', () => {
	it.each(['en', 'fr', 'es'] as const)('omits unavailable %s listings and featured projects', (locale) => {
		for (const options of [{ locales: [] }, { pages: [] }]) {
			const content = createContentCatalog(options);
			expect(content.projects.available(locale)).toEqual([]);
			expect(content.projects.featured(locale)).toEqual([]);
			expect(content.services.available(locale)).toEqual([]);
		}
		const content = createContentCatalog({ locales: [locale] });
		expect(content.projects.available(locale).length).toBeGreaterThan(0);
		expect(content.projects.featured(locale).length).toBeGreaterThan(0);
		expect(content.services.available(locale).length).toBeGreaterThan(0);
	});
});
