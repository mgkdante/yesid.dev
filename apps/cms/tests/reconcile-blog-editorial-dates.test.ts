import { describe, expect, it } from 'bun:test';
import {
	BLOG_EDITORIAL_FAMILIES,
	EXPECTED_ROW_COUNT,
	buildDatePlan,
	normalizeEditorialDate,
	type BlogDateRow,
} from '../scripts/reconcile-blog-editorial-dates';

function staleRows(): BlogDateRow[] {
	return BLOG_EDITORIAL_FAMILIES.flatMap((family) =>
		(['en', 'fr', 'es'] as const).map((lang) => ({
			id: family.ids[lang],
			translation_key: family.translationKey,
			lang,
			status: 'published' as const,
			date_published: '2026-07-11T00:00:00.000Z',
			date_modified: '2026-07-11T00:00:00.000Z',
		})),
	);
}

describe('blog editorial date schedule', () => {
	it('pins six chapter dates and eighteen exact rows', () => {
		expect(BLOG_EDITORIAL_FAMILIES.map((family) => family.date)).toEqual([
			'2026-06-01',
			'2026-06-09',
			'2026-06-17',
			'2026-06-25',
			'2026-07-03',
			'2026-07-11',
		]);
		expect(EXPECTED_ROW_COUNT).toBe(18);
	});

	it('normalizes date-only values to noon UTC', () => {
		expect(normalizeEditorialDate('2026-06-01')).toBe(
			'2026-06-01T12:00:00.000Z',
		);
	});

	it('plans exactly eighteen date-only patches without date_modified', () => {
		const plan = buildDatePlan(staleRows());
		expect(plan).toHaveLength(18);
		expect(
			plan.every((patch) =>
				Object.keys(patch).sort().join(',') === 'date_published,id',
			),
		).toBe(true);
		expect(new Set(plan.map((patch) => patch.id)).size).toBe(18);
	});

	it('gives every locale in a family the same timestamp', () => {
		const plan = buildDatePlan(staleRows());
		for (const family of BLOG_EDITORIAL_FAMILIES) {
			const timestamps = plan
				.filter((patch) => Object.values(family.ids).includes(patch.id))
				.map((patch) => patch.date_published);
			expect(new Set(timestamps)).toEqual(
				new Set([normalizeEditorialDate(family.date)]),
			);
		}
	});

	it('converges to an empty plan', () => {
		const converged = staleRows().map((row) => {
			const family = BLOG_EDITORIAL_FAMILIES.find(
				(candidate) => candidate.translationKey === row.translation_key,
			)!;
			return {
				...row,
				date_published: normalizeEditorialDate(family.date),
			};
		});
		expect(buildDatePlan(converged)).toEqual([]);
	});

	it('refuses missing, duplicate, wrong-locale, wrong-id, and draft rows', () => {
		const rows = staleRows();
		expect(() => buildDatePlan(rows.slice(1))).toThrow(/exactly 18/);
		expect(() => buildDatePlan([...rows.slice(0, -1), rows[0]!])).toThrow(
			/duplicate row id/,
		);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, lang: 'fr' }, ...rows.slice(1)]),
		).toThrow(/locale ownership/);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, id: 'unexpected' }, ...rows.slice(1)]),
		).toThrow(/row ownership/);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, status: 'draft' }, ...rows.slice(1)]),
		).toThrow(/must be published/);
	});
});
