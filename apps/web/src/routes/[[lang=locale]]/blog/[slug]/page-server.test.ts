import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlogPost, BlockEditorDoc } from '$lib/types';

const repositoryMocks = vi.hoisted(() => ({
	getAllPosts: vi.fn(),
	getPostBySlug: vi.fn(),
	getPostBody: vi.fn(),
	getSvgContent: vi.fn(),
	getBlogPageContent: vi.fn(),
}));

vi.mock('$lib/repositories', () => repositoryMocks);
vi.mock('$lib/server/code-highlights', () => ({ collectCodeHighlights: () => ({}) }));

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

function locals(): App.Locals {
	return { pageCache: new Map() } as unknown as App.Locals;
}

describe('blog detail loader locale boundary', () => {
	beforeEach(() => {
		for (const mock of Object.values(repositoryMocks)) mock.mockReset();
		repositoryMocks.getPostBody.mockResolvedValue(body);
		repositoryMocks.getSvgContent.mockResolvedValue('<svg />');
		repositoryMocks.getBlogPageContent.mockResolvedValue({ intro: { en: 'Blog' } });
	});

	it('rejects a slug whose post language does not match the request locale', async () => {
		const englishPost = post('en', 'article-en');
		repositoryMocks.getPostBySlug.mockResolvedValue(englishPost);
		repositoryMocks.getAllPosts.mockResolvedValue([englishPost]);

		await expect(
			load({ params: { lang: 'fr', slug: englishPost.slug }, locals: locals() }),
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
		repositoryMocks.getPostBySlug.mockResolvedValue(selected);
		repositoryMocks.getAllPosts.mockResolvedValue(posts);

		const result = await load({
			params: { lang: 'fr', slug: selected.slug },
			locals: locals(),
		});

		expect(result.postIndex).toBe(2);
	});
});
