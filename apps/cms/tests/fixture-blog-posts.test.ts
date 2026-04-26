import { describe, it, expect } from 'bun:test';
import postsFixture from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import illustrationsFixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';
import { BlockEditorDocSchema } from '@repo/shared';

// AM2.5: blog_posts is mono-language. Flat `title` + `excerpt` on parent.
// No `blog_posts_translations` collection; no `translations` array.
// AM1: body is Editor.js { time, blocks, version }, validated via BlockEditorDocSchema.
//
// NOTE: BlockEditorDocSchema is typed as z.ZodType<BlockEditorDoc> (opaque wrapper)
// to enable the recursive NestedListItemSchema. Zod v3 cannot embed an opaque
// ZodType as a field inside z.object() — the internal _parse dispatch breaks.
// We use z.unknown() for the body field here, then validate each body separately
// via BlockEditorDocSchema.safeParse() in the dedicated per-body test below.
const BlogPostFixtureSchema = z.array(z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	category: z.enum(['professional', 'personal']),
	tags: z.array(z.string()),
	external: z.boolean(),
	url: z.string().nullable(),
	cover_image_legacy_path: z.string().nullable(),
	svg_illustration_id: z.string().nullable(),
	animation: z.enum(['draw', 'morph', 'draw-fill']),
	title: z.string().min(1),
	excerpt: z.string().min(1).max(500),
	body: z.unknown(),
}));

describe('apps/cms/fixtures/collections/blog-posts.json', () => {
	it('parses through BlogPostFixtureSchema', () => {
		const result = BlogPostFixtureSchema.safeParse(postsFixture);
		if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2));
		expect(result.success).toBe(true);
	});

	it('contains exactly 7 posts (matches current markdown count)', () => {
		expect(postsFixture.length).toBe(7);
	});

	it('every svg_illustration_id (when set) exists in illustrations fixture', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		const ids = new Set(illustrationsFixture.map((i: { id: string }) => i.id));
		for (const p of posts) {
			if (p.svg_illustration_id) {
				expect(ids.has(p.svg_illustration_id)).toBe(true);
			}
		}
	});

	it('external posts have url; non-external posts have null url', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			if (p.external) expect(p.url).toBeTruthy();
			else expect(p.url).toBeNull();
		}
	});

	it('non-external posts have non-empty body.blocks', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (let i = 0; i < posts.length; i++) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const p = posts[i]!;
			const body = (postsFixture[i] as { body: { blocks: unknown[] } }).body;
			if (!p.external) expect(body.blocks.length).toBeGreaterThan(0);
		}
	});

	it('every body parses through BlockEditorDocSchema', () => {
		for (const p of postsFixture) {
			const result = BlockEditorDocSchema.safeParse(p.body);
			expect(result.success).toBe(true);
		}
	});
});

// Export schema for reuse by seed-blog-posts.ts (Phase 8)
export { BlogPostFixtureSchema };
