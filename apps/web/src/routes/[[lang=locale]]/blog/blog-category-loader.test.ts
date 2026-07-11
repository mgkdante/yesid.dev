import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlogPost } from '$lib/types';

const repositoryMocks = vi.hoisted(() => ({
	getPostsByCategory: vi.fn(),
	getSvgContentsForPosts: vi.fn(),
	getBlogPageContent: vi.fn(),
}));

vi.mock('$lib/repositories', () => repositoryMocks);

import { loadBlogCategory } from './blog-category-loader';

function post(lang: BlogPost['lang'], slug: string, tags: readonly string[]): BlogPost {
	return {
		translationKey: 'shared-article',
		slug,
		title: `${lang} title`,
		excerpt: `${lang} excerpt`,
		date: '2026-07-11',
		lang,
		category: 'professional',
		tags: [...tags],
		animation: 'draw',
		svg: `/images/blog/${slug}.svg`,
		url: `${lang === 'en' ? '' : `/${lang}`}/blog/${slug}`,
		external: false,
	};
}

describe('loadBlogCategory', () => {
	beforeEach(() => {
		repositoryMocks.getPostsByCategory.mockReset();
		repositoryMocks.getSvgContentsForPosts.mockReset();
		repositoryMocks.getBlogPageContent.mockReset();
	});

	it('filters posts to the request locale before deriving facets and SVG content', async () => {
		const posts = [
			post('en', 'article-en', ['english']),
			post('fr', 'article-fr', ['francais', 'partage']),
			post('es', 'article-es', ['espanol']),
		];
		repositoryMocks.getPostsByCategory.mockResolvedValue(posts);
		repositoryMocks.getBlogPageContent.mockResolvedValue({ intro: { en: 'Blog' } });
		repositoryMocks.getSvgContentsForPosts.mockImplementation(async (localePosts: BlogPost[]) =>
			Object.fromEntries(localePosts.map((entry) => [entry.slug, `<svg id="${entry.slug}" />`])),
		);

		const result = await loadBlogCategory(
			'professional',
			'fr',
			{ pageCache: new Map() } as unknown as { pageCache: App.Locals['pageCache'] },
		);

		expect(result.posts.map((entry) => entry.slug)).toEqual(['article-fr']);
		expect(result.tags).toEqual(['francais', 'partage']);
		expect(result.languages).toEqual(['fr']);
		expect(result.svgContents).toEqual({ 'article-fr': '<svg id="article-fr" />' });
		expect(repositoryMocks.getSvgContentsForPosts).toHaveBeenCalledWith(
			[posts[1]],
			expect.anything(),
		);
	});
});
