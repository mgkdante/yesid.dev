import { describe, it, expect } from 'bun:test';
import {
	LOREM_SLUGS,
	buildArchivePlan,
	describePlanEntry,
	parseFlags,
	type BlogPostStatusRow,
} from '../scripts/archive-lorem-posts';

describe('archive-lorem-posts pure helpers', () => {
	describe('LOREM_SLUGS', () => {
		it('targets exactly the 4 lorem placeholder posts (audit #17/#100/#68)', () => {
			expect([...LOREM_SLUGS].sort()).toEqual(
				[
					'lorem-data-warehousing',
					'lorem-etl-patterns',
					'lorem-space-exploration',
					'lorem-transit-future',
				].sort(),
			);
		});

		it('every slug matches the blog_posts id shape (slug-as-PK)', () => {
			for (const slug of LOREM_SLUGS) {
				expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
			}
		});

		it('slugs are unique', () => {
			expect(new Set(LOREM_SLUGS).size).toBe(LOREM_SLUGS.length);
		});
	});

	describe('buildArchivePlan', () => {
		const existing: BlogPostStatusRow[] = [
			{ id: 'lorem-data-warehousing', status: 'published' },
			{ id: 'lorem-etl-patterns', status: 'published' },
			{ id: 'lorem-transit-future', status: 'draft' },
			{ id: 'lorem-space-exploration', status: 'archived' },
		];

		it('plans an archive for every live (published or draft) row', () => {
			const plan = buildArchivePlan(LOREM_SLUGS, existing);
			const toArchive = plan.filter((e) => e.action === 'archive').map((e) => e.id);
			expect(toArchive.sort()).toEqual(
				['lorem-data-warehousing', 'lorem-etl-patterns', 'lorem-transit-future'].sort(),
			);
		});

		it('marks already-archived rows as no-op skips (idempotent re-runs)', () => {
			const plan = buildArchivePlan(LOREM_SLUGS, existing);
			const entry = plan.find((e) => e.id === 'lorem-space-exploration');
			expect(entry?.action).toBe('skip-already-archived');
			expect(entry?.currentStatus).toBe('archived');
		});

		it('marks slugs absent from the CMS as skip-missing instead of failing', () => {
			const plan = buildArchivePlan(LOREM_SLUGS, existing.slice(0, 2));
			const missing = plan.filter((e) => e.action === 'skip-missing').map((e) => e.id);
			expect(missing.sort()).toEqual(
				['lorem-space-exploration', 'lorem-transit-future'].sort(),
			);
			for (const e of plan) {
				if (e.action === 'skip-missing') expect(e.currentStatus).toBeNull();
			}
		});

		it('returns one entry per requested slug, in input order', () => {
			const plan = buildArchivePlan(LOREM_SLUGS, existing);
			expect(plan.map((e) => e.id)).toEqual([...LOREM_SLUGS]);
		});

		it('plans nothing when every row is already archived', () => {
			const allArchived = existing.map((r) => ({ ...r, status: 'archived' as const }));
			const plan = buildArchivePlan(LOREM_SLUGS, allArchived);
			expect(plan.every((e) => e.action === 'skip-already-archived')).toBe(true);
		});

		it('ignores non-target rows in the existing set', () => {
			const withExtra = [
				...existing,
				{ id: 'thinking-in-matrices', status: 'published' as const },
			];
			const plan = buildArchivePlan(LOREM_SLUGS, withExtra);
			expect(plan.length).toBe(LOREM_SLUGS.length);
			expect(plan.some((e) => e.id === 'thinking-in-matrices')).toBe(false);
		});
	});

	describe('parseFlags', () => {
		it('defaults to dry-run (apply=false) with no flags', () => {
			expect(parseFlags([]).apply).toBe(false);
		});

		it('stays dry-run with an explicit --dry-run flag', () => {
			expect(parseFlags(['--dry-run']).apply).toBe(false);
		});

		it('only writes with an explicit --apply', () => {
			expect(parseFlags(['--apply']).apply).toBe(true);
			expect(parseFlags(['--dry-run', '--apply']).apply).toBe(true);
		});
	});

	describe('describePlanEntry', () => {
		it('describes an archive mutation with the status transition', () => {
			const line = describePlanEntry({
				id: 'lorem-etl-patterns',
				currentStatus: 'published',
				action: 'archive',
			});
			expect(line).toContain('lorem-etl-patterns');
			expect(line).toContain('published -> archived');
		});

		it('describes skips without a mutation arrow', () => {
			const skip = describePlanEntry({
				id: 'lorem-etl-patterns',
				currentStatus: 'archived',
				action: 'skip-already-archived',
			});
			expect(skip).toContain('already archived');
			const missing = describePlanEntry({
				id: 'lorem-etl-patterns',
				currentStatus: null,
				action: 'skip-missing',
			});
			expect(missing).toContain('not found');
		});
	});
});
