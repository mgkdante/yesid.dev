import { describe, expect, it } from 'vitest';
import type { BlogPost } from '#lib/types.ts';

import { createContentCatalog } from '#lib/catalog/index.ts';
import { blogPosts } from '#lib/content/blog.ts';

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
		svg: blogPosts[0]!.svg,
		url: `${lang === 'en' ? '' : `/${lang}`}/blog/${slug}`,
		external: false,
	};
}

describe('loadBlogCategory', () => {
	it('filters posts to the request locale before deriving facets and SVG content', async () => {
		const posts = [
			post('en', 'article-en', ['english']),
			post('fr', 'article-fr', ['francais', 'partage']),
			post('es', 'article-es', ['espanol']),
		];

		const result = await loadBlogCategory(
			'professional',
			'fr',
			createContentCatalog({ posts }),
		);

		expect(result.posts.map((entry) => entry.slug)).toEqual(['article-fr']);
		expect(result.tags).toEqual(['francais', 'partage']);
		expect(result.languages).toEqual(['fr']);
		expect(Object.keys(result.svgContents)).toEqual(['article-fr']);
		expect(result.svgContents['article-fr']).toContain('<svg');
	});
});
