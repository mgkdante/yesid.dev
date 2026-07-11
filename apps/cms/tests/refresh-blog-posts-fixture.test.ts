import { describe, expect, it } from 'bun:test';
import { toBlogPostFixture, type RawBlogPost } from '../scripts/refresh-fixtures';

describe('refresh-fixtures blog post mapping', () => {
	it('preserves the translation key in the disaster-recovery fixture', () => {
		const row: RawBlogPost = {
			id: 'penser-en-matrices',
			translation_key: 'thinking-in-matrices',
			status: 'published',
			date_published: '2026-07-11T00:00:00.000Z',
			date_modified: null,
			sort: 3,
			lang: 'fr',
			category: 'personal',
			tags: [],
			external: false,
			url: null,
			cover_image: null,
			svg_illustration: null,
			animation: 'draw',
			title: 'Penser en matrices',
			excerpt: 'Une façon concrète de structurer des problèmes.',
			seo_title: null,
			seo_description: null,
			body: { time: 0, blocks: [], version: '2.31.0' },
		};

		expect(toBlogPostFixture(row).translation_key).toBe('thinking-in-matrices');
	});
});
