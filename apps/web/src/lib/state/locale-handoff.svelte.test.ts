import { describe, it, expect } from 'vitest';
import { localeHandoffKey, isLocaleHandoffNavigation } from './locale-handoff.svelte';

describe('locale-handoff stable route identity', () => {
	it('uses a translation-group identity instead of a locale-specific slug', () => {
		expect(localeHandoffKey('/blog/english-slug', 'blog:article-one')).toBe(
			'id:blog:article-one',
		);
		expect(localeHandoffKey('/fr/blog/slug-francais', 'blog:article-one')).toBe(
			'id:blog:article-one',
		);
	});

	it('recognizes different translated slugs as one locale handoff when identity is stable', () => {
		expect(
			isLocaleHandoffNavigation(
				'/blog/english-slug',
				'/fr/blog/slug-francais',
				'blog:article-one',
			),
		).toBe(true);
	});

	it('does not treat different slugs as a switch without a stable identity', () => {
		expect(
			isLocaleHandoffNavigation('/blog/english-slug', '/fr/blog/other-article'),
		).toBe(false);
	});
});
