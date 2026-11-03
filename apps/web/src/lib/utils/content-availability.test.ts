import { describe, expect, it } from 'vitest';
import { isEntityAvailable, isPathPublished, isLocaleAvailable } from './content-availability';
import { sitePages } from '#lib/content/site-pages.ts';
import type { Project } from '#lib/types.ts';

describe('content availability', () => {
	it.each(['en', 'fr', 'es'] as const)('combines entity visibility, registry and locale for %s', (locale) => {
		const cases = [
			{ kind: 'project', entity: { slug: 'example', status: 'public' }, expected: true },
			{ kind: 'project', entity: { slug: 'example', status: 'wip' }, expected: true },
			{ kind: 'project', entity: { slug: 'example', status: 'private' }, expected: false },
			{ kind: 'service', entity: { id: 'example', visible: true }, expected: true },
			{ kind: 'service', entity: { id: 'example' }, expected: true },
			{ kind: 'service', entity: { id: 'example', visible: false }, expected: false },
			{ kind: 'post', entity: { slug: 'example', lang: locale }, expected: true },
			{ kind: 'post', entity: { slug: 'example', lang: locale === 'en' ? 'fr' : 'en' }, expected: false },
		] as const;
		for (const row of cases) {
			expect(isEntityAvailable(row, locale)).toBe(row.expected);
			expect(isEntityAvailable(row, locale, { pages: [] })).toBe(false);
			expect(isEntityAvailable(row, locale, { locales: [] })).toBe(false);
		}
	});
	it('keeps English fallback for localized project copy; unsupported and switched-off locales are absent', () => {
		const entity: Pick<Project, 'slug' | 'status'> = { slug: 'english-only', status: 'public' };
		expect(isEntityAvailable({ kind: 'project', entity }, 'fr')).toBe(true);
		expect(isEntityAvailable({ kind: 'project', entity }, 'fr', { locales: ['en'] })).toBe(false);
		expect(isLocaleAvailable('de')).toBe(false);
		expect(isPathPublished('/', [])).toBe(true);
		expect(isPathPublished('/about', sitePages.filter((page) => page.path !== '/about'))).toBe(false);
	});
	it('keeps site page publication separate from entity status and locale', () => {
		expect(isPathPublished('/projects/example')).toBe(true);
		expect(isEntityAvailable({ kind: 'project', entity: { slug: 'example', status: 'private' } }, 'en')).toBe(false);
		expect(isEntityAvailable({ kind: 'project', entity: { slug: 'example', status: 'public' } }, 'fr', { locales: ['en'] })).toBe(false);
		expect(isPathPublished('/projects/example', [])).toBe(false);
	});
});
