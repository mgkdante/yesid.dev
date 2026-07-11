import { describe, expect, it } from 'vitest';
import type { Locale } from '$lib/types';
import { findBlogTranslationVariants, groupBlogTranslations } from '$lib/blog/translations';

const locales = ['en', 'fr', 'es'] as const satisfies readonly Locale[];

function completePosts() {
	return Array.from({ length: 6 }, (_, index) =>
		locales.map((lang) => ({
			translationKey: `article-${index + 1}`,
			slug: `article-${index + 1}-${lang}`,
			lang,
		})),
	).flat();
}

describe('groupBlogTranslations', () => {
	it('groups six articles with one English, French, and Spanish variant each', () => {
		const groups = groupBlogTranslations(completePosts());

		expect(groups).toHaveLength(6);
		for (const group of groups) {
			expect(group.translationKey).toMatch(/^article-[1-6]$/);
			expect(group.posts.en.lang).toBe('en');
			expect(group.posts.fr.lang).toBe('fr');
			expect(group.posts.es.lang).toBe('es');
		}
	});

	it('rejects two posts with the same translation key and locale', () => {
		const posts = completePosts();
		posts.push({
			translationKey: 'article-1',
			slug: 'article-1-en-duplicate',
			lang: 'en',
		});

		expect(() => groupBlogTranslations(posts)).toThrow(
			'Duplicate blog translation for article-1 (en)',
		);
	});
});

describe('findBlogTranslationVariants', () => {
	it('returns the available locale rows without requiring a complete group', () => {
		const posts = completePosts().filter(
			(post) => post.translationKey !== 'article-1' || post.lang !== 'es',
		);

		expect(findBlogTranslationVariants(posts, 'article-1')).toEqual({
			en: { translationKey: 'article-1', slug: 'article-1-en', lang: 'en' },
			fr: { translationKey: 'article-1', slug: 'article-1-fr', lang: 'fr' },
		});
	});
});
