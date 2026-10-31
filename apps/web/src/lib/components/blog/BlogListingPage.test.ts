import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { BlogPost } from '#lib/types.ts';
import { persisted } from '@yesid/ui/state';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/blog') },
}));
vi.mock('@yesid/motion/utils/blueprintScrub', () => ({ blueprintScrub: () => undefined }));
vi.mock('#lib/motion/utils/flip.ts', () => ({
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

describe('BlogListingPage language filter', () => {
	it('clears an incompatible persisted language instead of hiding the active-locale posts', async () => {
		persisted<string | null>('blog-lang', null).value = 'fr';
		render(BlogListingPage, {
			props: {
				posts: [englishPost],
				allTags: ['test'],
				languages: ['en'],
				heading: 'Blog',
				subtitle: 'Notes',
				emptyState: 'No posts match.',
				emptyStateNoPosts: 'No posts yet.',
			},
		});
		await tick();
		await tick();

		expect(persisted<string | null>('blog-lang', 'fr').value).toBeNull();
		expect(screen.getByText('English article')).toBeInTheDocument();
	});
});
