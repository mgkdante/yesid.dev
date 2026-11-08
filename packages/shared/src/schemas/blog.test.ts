import { describe, expect, it } from 'bun:test';
import { BlogPostSchema } from './blog';

const validPost = {
	translationKey: 'four-projects-four-stacks',
	slug: 'four-projects-four-stacks',
	title: 'Four projects, four stacks',
	excerpt: 'A short listing excerpt.',
	date: '2026-07-10',
	lang: 'en',
	category: 'professional',
	tags: ['sveltekit'],
	animation: 'draw',
	svg: '/images/blog/four-projects-four-stacks.svg',
	url: '/blog/four-projects-four-stacks',
	external: false,
};

describe('BlogPostSchema translationKey', () => {
	it('accepts a non-empty kebab-case translation key', () => {
		expect(BlogPostSchema.safeParse(validPost).success).toBe(true);
	});

	it('requires a translation key', () => {
		const { translationKey: _translationKey, ...postWithoutKey } = validPost;

		expect(BlogPostSchema.safeParse(postWithoutKey).success).toBe(false);
	});

	it.each(['', 'Four-Projects-Four-Stacks', 'four projects', 'four_projects', 'four--projects'])(
		'rejects a non-kebab translation key: %s',
		(translationKey) => {
			expect(BlogPostSchema.safeParse({ ...validPost, translationKey }).success).toBe(false);
		},
	);
});
