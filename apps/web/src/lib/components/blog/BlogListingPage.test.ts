import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { BlogPost } from '$lib/types';
import { applyEntries, captureEntries } from '$lib/state/locale-handoff.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
	page: {
		subscribe(run: (value: { url: URL }) => void) {
			run({ url: new URL('http://localhost/blog') });
			return () => {};
		},
	},
}));
vi.mock('$lib/components/shared/listing-blueprint-scrub', () => ({
	startListingBlueprintScrub: async () => undefined,
}));
vi.mock('$lib/motion/utils/flip.js', () => ({
	captureFlipState: () => null,
	animateFlipTransition: () => undefined,
}));

import BlogListingPage from './BlogListingPage.svelte';

const englishPost: BlogPost = {
	translationKey: 'article',
	slug: 'article-en',
	title: 'English article',
	excerpt: 'English excerpt',
	date: '2026-07-11',
	lang: 'en',
	category: 'professional',
	tags: ['test'],
	animation: 'draw',
	svg: '/images/blog/article.svg',
	url: '/blog/article-en',
	external: false,
};

afterEach(() => cleanup());

describe('BlogListingPage language-filter handoff', () => {
	it('clears an incompatible persisted language instead of hiding the active-locale posts', async () => {
		render(BlogListingPage, {
			props: {
				posts: [englishPost],
				allTags: ['test'],
				languages: ['en'],
				subtitle: 'Blog',
			},
		});
		await tick();

		applyEntries({ 'blog-lang': 'fr' });
		await tick();
		await tick();

		expect(captureEntries()['blog-lang']).toBeNull();
		expect(screen.getByText('English article')).toBeInTheDocument();
	});
});
