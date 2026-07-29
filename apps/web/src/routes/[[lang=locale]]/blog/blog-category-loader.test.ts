import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlogPost } from '$lib/types';

const adapterMocks = vi.hoisted(() => ({
	adapter: {
		blog: {
			byCategory: vi.fn(),
			svgContentsForPosts: vi.fn(),
		},
		content: {
			blogPage: vi.fn(),
		},
	},
}));

vi.mock('$lib/adapters', () => adapterMocks);

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
		adapterMocks.adapter.blog.byCategory.mockReset();
		adapterMocks.adapter.blog.svgContentsForPosts.mockReset();
		adapterMocks.adapter.content.blogPage.mockReset();
	});

	it('filters posts to the request locale before deriving facets and SVG content', async () => {
		const posts = [
			post('en', 'article-en', ['english']),
			post('fr', 'article-fr', ['francais', 'partage']),
			post('es', 'article-es', ['espanol']),
		];
		adapterMocks.adapter.blog.byCategory.mockResolvedValue(posts);
		adapterMocks.adapter.content.blogPage.mockResolvedValue({ intro: { en: 'Blog' } });
		adapterMocks.adapter.blog.svgContentsForPosts.mockImplementation(async (localePosts: BlogPost[]) =>
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
		expect(adapterMocks.adapter.blog.svgContentsForPosts).toHaveBeenCalledWith(
			[posts[1]],
			expect.anything(),
		);
	});
});
