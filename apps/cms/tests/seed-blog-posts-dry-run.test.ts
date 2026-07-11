import { describe, it, expect } from 'bun:test';
import {
	toBlogPostRow,
	loadBlogPostsFixture,
	BlogPostsFixtureSchema,
} from '../scripts/seed-blog-posts';

describe('seed-blog-posts pure helpers', () => {
	const fixture = loadBlogPostsFixture();
	const aiWorkflow = fixture.find(
		(p) => p.id === 'ai-accelerated-human-owned-my-actual-workflow',
	)!;

	describe('toBlogPostRow', () => {
		it('preserves id + scalars', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.id).toBe('ai-accelerated-human-owned-my-actual-workflow');
			expect(row.translation_key).toBe('ai-accelerated-human-owned-my-actual-workflow');
			expect(row.status).toBe('published');
			expect(row.lang).toBe('en');
			expect(row.category).toBe('professional');
			expect(row.tags).toEqual(aiWorkflow.tags);
		});

		it('passes body through unchanged (Editor.js shape)', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.body).toEqual(aiWorkflow.body as never);
		});

		it('promotes flat title + excerpt onto row (AM2.5 — no translations)', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.title).toBe(aiWorkflow.title);
			expect(row.excerpt).toBe(aiWorkflow.excerpt);
		});

		it('promotes optional SEO fields onto the row when present', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.seo_title).toBe('AI-Accelerated, Human-Owned: My Development Workflow');
			expect(row.seo_description).toBe(
				'My real AI-assisted development workflow: I choose architecture, direct implementation, inspect the files, catch mistakes, and own what ships.',
			);
			expect(row.date_modified).toBe('2026-07-11');
		});

		it('returns null url for non-external posts', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.url).toBeNull();
		});

		it('returns null cover_image when the fixture has no cover', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.cover_image).toBeNull();
		});

		it('maps svg_illustration_id to svg_illustration', () => {
			const row = toBlogPostRow(aiWorkflow);
			expect(row.svg_illustration).toBe(aiWorkflow.svg_illustration_id);
		});
	});

	describe('translation-key compatibility', () => {
		it('requires exactly 18 rows across six translation keys', () => {
			const oneCompleteGroup = fixture.filter(
				(post) => post.translation_key === fixture[0]!.translation_key,
			);

			const result = BlogPostsFixtureSchema.safeParse(oneCompleteGroup);
			expect(result.success).toBe(false);
			if (result.success) return;
			expect(result.error.issues.map((issue) => issue.message).join(' | ')).toContain(
				'fixture must contain exactly 18 rows across six translation keys',
			);
		});

		it('requires exactly one en, fr, and es row in each explicit translation group', () => {
			const translationKey = fixture[0]!.translation_key;
			const incompleteGroup = fixture.filter(
				(post) => post.translation_key === translationKey && post.lang !== 'es',
			);

			const result = BlogPostsFixtureSchema.safeParse(incompleteGroup);
			expect(result.success).toBe(false);
			if (result.success) return;
			expect(result.error.issues.map((issue) => issue.message).join(' | ')).toContain(
				'translation_key must group exactly one en, fr, and es row',
			);
		});

		it('requires an explicit translation_key on every fixture row', () => {
			const rows = structuredClone(fixture) as Array<Record<string, unknown>>;
			delete rows[0]!.translation_key;

			expect(BlogPostsFixtureSchema.safeParse(rows).success).toBe(false);
		});
	});
});
