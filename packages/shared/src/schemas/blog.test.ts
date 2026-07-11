import { describe, expect, it } from 'bun:test';
import { BlogPostSchema } from './blog';

const validPost = {
	translationKey: 'the-two-hour-internet-slot',
	slug: 'the-two-hour-internet-slot',
	title: 'The two-hour internet slot',
	excerpt: 'A short listing excerpt.',
	date: '2026-07-10',
	lang: 'en',
	category: 'personal',
	tags: ['internet'],
	animation: 'draw',
	svg: '/images/blog/the-two-hour-internet-slot.svg',
	url: '/blog/the-two-hour-internet-slot',
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

	it.each(['', 'The-Two-Hour-Slot', 'two hour slot', 'two_hour_slot', 'two--hour-slot'])(
		'rejects a non-kebab translation key: %s',
		(translationKey) => {
			expect(BlogPostSchema.safeParse({ ...validPost, translationKey }).success).toBe(false);
		},
	);
});
