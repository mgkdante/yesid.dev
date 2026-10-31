import { describe, expect, it } from 'bun:test';
import {
	BLOG_POST_SORT,
	isAvailableTranslation,
	resolveSvgFallbackName,
	toBlogExport,
	toBlogPost,
	type DirectusBlogPostRow,
	type DirectusBlogPostTranslation,
} from './blog-posts';
import { BlogPostSchema } from '@repo/shared/schemas';
import type { BlockEditorDoc } from '@repo/shared';

const BODY: BlockEditorDoc = {
	time: 0,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text: 'Native fs.' } }],
};

const ENGLISH: DirectusBlogPostTranslation = {
	languages_code: 'en',
	show_on_site: true,
	slug: 'why-bun-is-fast',
	title: 'Why Bun Is Fast',
	excerpt: 'Native fs + jsc',
	body: BODY,
	seo_title: null,
	seo_description: null,
};

const FRENCH: DirectusBlogPostTranslation = {
	...ENGLISH,
	languages_code: 'fr',
	slug: 'pourquoi-bun-est-rapide',
	title: 'Pourquoi Bun est rapide',
};

const POST: DirectusBlogPostRow = {
	id: 'why-bun-is-fast',
	status: 'published',
	date_published: '2026-04-14T12:00:00Z',
	date_modified: null,
	sort: 1,
	category: 'professional',
	tags: [
		{ sort: 0, tags_id: { id: 'bun' } },
		{ sort: 1, tags_id: { id: 'js' } },
	],
	external: false,
	url: null,
	cover_image: null,
	svg_illustration: { id: 'illust-1', label: 'Bun', category: 'professional', file: { id: 'file-uuid' } },
	animation: 'draw',
	translations: [ENGLISH, FRENCH],
};

describe('blog language availability', () => {
	it('needs Show on site, a title and article text', () => {
		expect(isAvailableTranslation(POST, ENGLISH)).toBe(true);
		expect(isAvailableTranslation(POST, { ...ENGLISH, show_on_site: false })).toBe(false);
		expect(isAvailableTranslation(POST, { ...ENGLISH, show_on_site: null })).toBe(false);
		expect(isAvailableTranslation(POST, { ...ENGLISH, title: '  ' })).toBe(false);
		expect(isAvailableTranslation(POST, { ...ENGLISH, body: null })).toBe(false);
		expect(isAvailableTranslation(POST, { ...ENGLISH, body: { ...BODY, blocks: [] } })).toBe(false);
	});

	it('needs a title and the post URL for external posts', () => {
		const external = { ...POST, external: true, url: 'https://example.com/post' };
		expect(isAvailableTranslation(external, { ...ENGLISH, body: null })).toBe(true);
		expect(isAvailableTranslation({ ...external, url: null }, { ...ENGLISH, body: null })).toBe(false);
	});

	it('exports only the available languages, each at its own slug with its body', () => {
		const { posts, bodies } = toBlogExport([
			{ ...POST, translations: [ENGLISH, { ...FRENCH, show_on_site: false }] },
		]);
		expect(posts.map((post) => [post.lang, post.slug, post.translationKey])).toEqual([
			['en', 'why-bun-is-fast', 'why-bun-is-fast'],
		]);
		expect(Object.keys(bodies)).toEqual(['why-bun-is-fast']);
	});

	it('drops a post with no available language', () => {
		expect(toBlogExport([{ ...POST, translations: [] }]).posts).toEqual([]);
	});
});

describe('blog-posts fetcher transform', () => {
	it('uses a deterministic newest-first order when publication dates tie', () => {
		expect(BLOG_POST_SORT).toEqual(['-date_published', 'sort', 'id']);
	});

	it('builds /blog/<language slug> urls and groups languages by the post key', () => {
		const french = toBlogPost(POST, FRENCH);
		expect(french.url).toBe('/blog/pourquoi-bun-est-rapide');
		expect(french.slug).toBe('pourquoi-bun-est-rapide');
		expect(french.lang).toBe('fr');
		expect(french.translationKey).toBe('why-bun-is-fast');
		expect(french.external).toBe(false);
	});

	it('uses explicit url for external posts', () => {
		expect(toBlogPost({ ...POST, external: true, url: 'https://example.com/post' }, ENGLISH).url).toBe(
			'https://example.com/post',
		);
	});

	it('uses svg_illustration.id when present (FK to illustrations)', () => {
		expect(toBlogPost(POST, ENGLISH).svg).toBe('illust-1');
	});

	it('gives every language the same hash-picked fallback when svg_illustration is null', () => {
		const noIllust = { ...POST, svg_illustration: null };
		const english = toBlogPost(noIllust, ENGLISH);
		expect(english.svg).toBe(resolveSvgFallbackName('why-bun-is-fast', 'professional'));
		expect(english.svg).toMatch(/^pro-/);
		expect(toBlogPost(noIllust, FRENCH).svg).toBe(english.svg);
	});

	it('strips time component from date_published (YYYY-MM-DD output)', () => {
		expect(toBlogPost(POST, ENGLISH).date).toBe('2026-04-14');
	});

	it('maps CMS-backed SEO fields, modified date, and cover image alt text', () => {
		const row = {
			...POST,
			date_modified: '2026-04-20T09:30:00Z',
			cover_image: {
				id: '11111111-1111-4111-8111-111111111111',
				description: 'Query plan screenshot inside the yesid.dev CMS.',
				title: 'Raw SQL cover',
			},
		} as unknown as DirectusBlogPostRow;
		const result = toBlogPost(row, {
			...ENGLISH,
			seo_title: 'Raw SQL for PostgreSQL Control',
			seo_description: 'Why raw SQL can beat ORM abstractions for PostgreSQL work.',
		});
		expect(result.dateModified).toBe('2026-04-20');
		expect(result.seoTitle).toBe('Raw SQL for PostgreSQL Control');
		expect(result.seoDescription).toBe('Why raw SQL can beat ORM abstractions for PostgreSQL work.');
		expect(result.coverImage).toBe('11111111-1111-4111-8111-111111111111');
		expect(result.coverImageAlt).toBe('Query plan screenshot inside the yesid.dev CMS.');
	});

	it('output parses through BlogPostSchema', () => {
		expect(() => BlogPostSchema.parse(toBlogPost(POST, ENGLISH))).not.toThrow();
	});
});

describe('SVG fallback resolution', () => {
	it('uses personal fallbacks for personal category', () => {
		expect(resolveSvgFallbackName('foo', 'personal')).toMatch(/^personal-/);
	});

	it('is deterministic for the same slug', () => {
		expect(resolveSvgFallbackName('test-slug', 'professional')).toBe(
			resolveSvgFallbackName('test-slug', 'professional'),
		);
	});
});
