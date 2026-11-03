import { describe, expect, it } from 'vitest';
import type { BlogPost, BlockEditorDoc } from '#lib/types.ts';

import { createContentCatalog } from '#lib/catalog/index.ts';

import { load } from './+page.server';

const body: BlockEditorDoc = {
	time: 1,
	version: '2.31.2',
	blocks: [{ id: 'paragraph', type: 'paragraph', data: { text: 'Article body' } }],
};

function post(lang: BlogPost['lang'], slug: string): BlogPost {
	return {
		translationKey: slug.replace(/-(?:en|fr|es)$/, ''),
		slug,
		title: `${lang} title`,
		excerpt: `${lang} excerpt`,
		date: '2026-07-11',
		lang,
		category: 'professional',
		tags: [lang],
		animation: 'draw',
		svg: `/images/blog/${slug}.svg`,
		url: `${lang === 'en' ? '' : `/${lang}`}/blog/${slug}`,
		external: false,
	};
}

describe('blog detail loader locale boundary', () => {
	it('rejects a slug whose post language does not match the request locale', async () => {
		const englishPost = post('en', 'article-en');

		await expect(
			load({ params: { lang: 'fr', slug: englishPost.slug } }, createContentCatalog({ posts: [englishPost], bodies: { [englishPost.slug]: body } })),
		).rejects.toMatchObject({ status: 404 });
	});

	it('computes the station index among posts in the active locale only', async () => {
		const posts = [
			post('en', 'first-en'),
			post('fr', 'first-fr'),
			post('es', 'first-es'),
			post('fr', 'second-fr'),
			post('en', 'second-en'),
		];
		const selected = posts[3];

		const result = await load({
			params: { lang: 'fr', slug: selected.slug },
		}, createContentCatalog({ posts, bodies: { [selected.slug]: body } }));

		expect(result.postIndex).toBe(2);
	});
});
