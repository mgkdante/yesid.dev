import { describe, expect, it } from 'bun:test';
import { toBlogPost, resolveSvgFallbackName, type DirectusBlogPostRow } from './blog-posts';
import { BlogPostSchema } from '@repo/shared/schemas';
const FIXTURE_EXTERNAL: DirectusBlogPostRow = {
	id: 'why-bun-is-fast',
	status: 'published',
	date_published: '2026-04-14T12:00:00Z',
	sort: 1,
	lang: 'en',
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
	title: 'Why Bun Is Fast',
	excerpt: 'Native fs + jsc',
};

describe('blog-posts fetcher transform', () => {
	it('builds /blog/<slug> url for non-external posts', () => {
		const result = toBlogPost(FIXTURE_EXTERNAL);
		expect(result.url).toBe('/blog/why-bun-is-fast');
		expect(result.external).toBe(false);
	});

	it('uses explicit url for external posts', () => {
		const ext: DirectusBlogPostRow = { ...FIXTURE_EXTERNAL, external: true, url: 'https://example.com/post' };
		const result = toBlogPost(ext);
		expect(result.url).toBe('https://example.com/post');
	});

	it('uses svg_illustration.id when present (FK to illustrations)', () => {
		const result = toBlogPost(FIXTURE_EXTERNAL);
		expect(result.svg).toBe('illust-1');
	});

	it('falls back to deterministic hash-picked fallback name when svg_illustration is null', () => {
		const noIllust: DirectusBlogPostRow = { ...FIXTURE_EXTERNAL, svg_illustration: null };
		const result = toBlogPost(noIllust);
		expect(result.svg).toBe(resolveSvgFallbackName('why-bun-is-fast', 'professional'));
		expect(result.svg).toMatch(/^pro-/);
	});

	it('strips time component from date_published (YYYY-MM-DD output)', () => {
		const result = toBlogPost(FIXTURE_EXTERNAL);
		expect(result.date).toBe('2026-04-14');
	});

	it('maps CMS-backed SEO fields, modified date, and cover image alt text', () => {
		const row = {
			...FIXTURE_EXTERNAL,
			date_modified: '2026-04-20T09:30:00Z',
			seo_title: 'Raw SQL for PostgreSQL Control',
			seo_description:
				'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.',
			cover_image: {
				id: '11111111-1111-4111-8111-111111111111',
				description: 'Query plan screenshot inside the yesid.dev CMS.',
				title: 'Raw SQL cover',
			},
		} as unknown as DirectusBlogPostRow;

		const result = toBlogPost(row) as Record<string, unknown>;
		expect(result.dateModified).toBe('2026-04-20');
		expect(result.seoTitle).toBe('Raw SQL for PostgreSQL Control');
		expect(result.seoDescription).toBe(
			'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.',
		);
		expect(result.coverImage).toBe('11111111-1111-4111-8111-111111111111');
		expect(result.coverImageAlt).toBe('Query plan screenshot inside the yesid.dev CMS.');
	});

	it('output parses through BlogPostSchema', () => {
		const result = toBlogPost(FIXTURE_EXTERNAL);
		expect(() => BlogPostSchema.parse(result)).not.toThrow();
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
