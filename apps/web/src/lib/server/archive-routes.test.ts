import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SitePage } from '#lib/types.ts';

const registry = vi.hoisted(() => ({ pages: [] as readonly SitePage[] }));
vi.mock('#lib/content/site-pages.ts', () => ({ get sitePages() { return registry.pages; } }));

beforeEach(async () => {
	vi.resetModules();
	const { sitePages } = await vi.importActual<{ sitePages: readonly SitePage[] }>('#lib/content/site-pages.ts');
	registry.pages = sitePages.filter((page) => !['/about', '/blog', '/projects', '/services'].includes(page.path));
});

describe('archived route boundaries', () => {
	it.each(['', '/fr', '/es'])('root layout rejects archived %s static and detail paths', async (prefix) => {
		const { load } = await import('../../routes/+layout.server');
		for (const path of ['/about', '/blog/archived-article', '/projects/archived-project', '/services/archived-service']) {
			await expect(load({
				route: { id: '/[[lang=locale]]' + path }, params: {}, locals: {},
				url: new URL(`https://yesid.dev${prefix}${path}`),
			} as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 404 });
		}
	});
});
