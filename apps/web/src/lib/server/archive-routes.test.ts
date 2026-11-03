import { describe, expect, it } from 'vitest';
import { createContentCatalog } from '#lib/catalog/index.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { load } from '../../routes/+layout.server';

const content = createContentCatalog({ pages: sitePages.filter((page) => !['/about', '/blog', '/projects', '/services'].includes(page.path)) });

describe('archived route fixtures', () => {
	it.each(['', '/fr', '/es'])('root layout rejects archived %s static and detail paths', async (prefix) => {
		for (const path of ['/about', '/blog/archived-article', '/projects/archived-project', '/services/archived-service']) {
			await expect(load({
				route: { id: '/[[lang=locale]]' + path }, params: {},
				url: new URL(`https://yesid.dev${prefix}${path}`),
			} as Parameters<typeof load>[0], content)).rejects.toMatchObject({ status: 404 });
		}
	});
});
