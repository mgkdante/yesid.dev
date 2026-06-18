import { describe, it, expect } from 'bun:test';
import {
	toBlogPostRow,
	loadBlogPostsFixture,
} from '../scripts/seed-blog-posts';

describe('seed-blog-posts pure helpers', () => {
	const fixture = loadBlogPostsFixture();
	const orm = fixture.find((p) => p.id === 'why-i-left-orm-for-raw-sql')!;

	describe('toBlogPostRow', () => {
		it('preserves id + scalars', () => {
			const row = toBlogPostRow(orm);
			expect(row.id).toBe('why-i-left-orm-for-raw-sql');
			expect(row.status).toBe('published');
			expect(row.lang).toBe('en');
			expect(row.category).toBe('professional');
			expect(row.tags).toEqual(orm.tags);
		});

		it('passes body through unchanged (Editor.js shape)', () => {
			const row = toBlogPostRow(orm);
			expect(row.body).toEqual(orm.body as never);
		});

		it('promotes flat title + excerpt onto row (AM2.5 — no translations)', () => {
			const row = toBlogPostRow(orm);
			expect(row.title).toBe(orm.title);
			expect(row.excerpt).toBe(orm.excerpt);
		});

		it('promotes optional SEO fields onto the row when present', () => {
			const row = toBlogPostRow(orm);
			expect(row.seo_title).toBe('Raw SQL for PostgreSQL Control');
			expect(row.seo_description).toBe(
				'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.',
			);
			expect(row.date_modified).toBe('2026-04-01');
		});

		it('returns null url for non-external posts', () => {
			const row = toBlogPostRow(orm);
			expect(row.url).toBeNull();
		});

		it('maps cover_image_legacy_path to cover_image when present', () => {
			const fixtureWithCover = fixture.find((p) => p.cover_image_legacy_path !== null);
			if (fixtureWithCover) {
				const row = toBlogPostRow(fixtureWithCover);
				expect(row.cover_image).not.toBeNull();
			}
		});

		it('maps svg_illustration_id to svg_illustration', () => {
			const row = toBlogPostRow(orm);
			expect(row.svg_illustration).toBe(orm.svg_illustration_id);
		});
	});
});
