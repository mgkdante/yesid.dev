// Directus adapter — contract tests (consumer side of the slice-18 D12
// boundary).
//
// Scope:
//   1. Structural: every port + method required by `ContentAdapter` is present
//      on `directusAdapter` (compile-time via `ContentAdapter` annotation,
//      runtime via key enumeration).
//   2. Pure mapping: `toService(row)` translates a synthetic Directus row into
//      a valid `Service` domain object WITHOUT any network call.
//
// This test is the consumer-side half of the cross-repo contract. The CMS
// repo ships a mirror `snapshot-shape` test that asserts the snapshot YAML
// has the fields this mapping reads. Together they prevent adapter-seam drift.
//
// 18c Task 44 (F6): setup.data.ts mocks `$lib/adapters/directus` to route
// repository tests through staticAdapter. This test is the subject-under-test
// for directus.ts, so we `vi.unmock` at the top — the mocked module is only
// relevant for composite-adapter consumers, never for directus.ts's own tests.
// That sheds the `vi.importActual` scaffolding the prior iteration needed.

import { describe, expect, it, vi } from 'vitest';

// Hoisted by Vitest above all `import` statements below.
vi.unmock('$lib/adapters/directus');

import type { ContentAdapter } from './types';
import {
	directusAdapter,
	type DirectusService,
	toLocalizedString,
	toService,
} from './directus';

describe('directusAdapter — structural contract', () => {
	it('exposes every required ContentAdapter port', () => {
		const required = [
			'projects',
			'services',
			'blog',
			'meta',
			'techStack',
			'content',
		] as const;
		for (const port of required) {
			expect(directusAdapter).toHaveProperty(port);
		}
	});

	it('services port exposes every required method', () => {
		const required = ['all', 'byId', 'visible', 'adjacent'] as const;
		for (const method of required) {
			expect(typeof directusAdapter.services[method]).toBe('function');
		}
	});

	it('conforms to ContentAdapter (compile-time gate)', () => {
		const adapter: ContentAdapter = directusAdapter;
		expect(adapter).toBeDefined();
	});

	it('un-implemented ports throw a clear TODO error (not silently return empty)', async () => {
		// Tasks 10–14 progressively replace these throws with real impls.
		// Until then, fail loud when consumer code asks for an un-migrated port.
		await expect(directusAdapter.projects.all()).rejects.toThrow(/not implemented/);
		await expect(directusAdapter.blog.all()).rejects.toThrow(/not implemented/);
		await expect(directusAdapter.meta.site()).rejects.toThrow(/not implemented/);
		await expect(directusAdapter.techStack.all()).rejects.toThrow(/not implemented/);
		await expect(directusAdapter.content.hero()).rejects.toThrow(/not implemented/);
	});
});

describe('toService — pure row-to-domain mapping', () => {
	it('maps a minimal row (id + station + en-only translations) to a valid Service', () => {
		const row: DirectusService = {
			id: 'sql-development',
			station: 1,
			related_projects: ['project-a', 'project-b'],
			translations: [
				{
					languages_code: 'en',
					title: 'SQL Development',
					description: 'Write, refactor, and tune SQL queries.',
				},
			],
		};
		const service = toService(row);
		expect(service.id).toBe('sql-development');
		expect(service.station).toBe(1);
		expect(service.title).toEqual({ en: 'SQL Development' });
		expect(service.description).toEqual({ en: 'Write, refactor, and tune SQL queries.' });
		expect(service.relatedProjects).toEqual(['project-a', 'project-b']);
	});

	it('preserves optional scalar fields (icon, svg, visible, stack)', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			icon: 'station-sql.json',
			svg: 'service-sql.svg',
			visible: false,
			stack: ['PostgreSQL', 'T-SQL'],
			related_projects: [],
			translations: [{ languages_code: 'en', title: 'X', description: 'desc' }],
		};
		const service = toService(row);
		expect(service.icon).toBe('station-sql.json');
		expect(service.svg).toBe('service-sql.svg');
		expect(service.visible).toBe(false);
		expect(service.stack).toEqual(['PostgreSQL', 'T-SQL']);
	});

	it('composes multi-locale LocalizedStrings from the translations array', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: [],
			translations: [
				{ languages_code: 'en', title: 'Hello' },
				{ languages_code: 'fr', title: 'Bonjour' },
				{ languages_code: 'es', title: 'Hola' },
			],
		};
		const service = toService(row);
		expect(service.title).toEqual({ en: 'Hello', fr: 'Bonjour', es: 'Hola' });
	});

	it('assembles impactMetric only when both value + label are present', () => {
		const withBoth: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: [],
			translations: [
				{
					languages_code: 'en',
					title: 'X',
					description: 'd',
					impact_metric_value: '3x faster',
					impact_metric_label: 'avg query',
				},
			],
		};
		expect(toService(withBoth).impactMetric).toEqual({
			value: { en: '3x faster' },
			label: { en: 'avg query' },
		});

		const onlyValue: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: [],
			translations: [
				{
					languages_code: 'en',
					title: 'X',
					description: 'd',
					impact_metric_value: '3x faster',
				},
			],
		};
		expect(toService(onlyValue).impactMetric).toBeUndefined();
	});

	it('sorts deliverables by `sort` column then maps per-row translations', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: [],
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
			deliverables: [
				{
					id: 2,
					sort: 1,
					translations: [{ languages_code: 'en', label: 'Second' }],
				},
				{
					id: 1,
					sort: 0,
					translations: [{ languages_code: 'en', label: 'First' }],
				},
			],
		};
		const service = toService(row);
		expect(service.deliverables).toEqual([
			{ en: 'First' },
			{ en: 'Second' },
		]);
	});

	it('sorts sections by `sort` and hydrates title + content LocalizedStrings', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: [],
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
			sections: [
				{
					id: 1,
					sort: 0,
					translations: [
						{ languages_code: 'en', title: 'My Approach', content: 'Step 1' },
					],
				},
			],
		};
		const service = toService(row);
		expect(service.sections).toEqual([
			{ title: { en: 'My Approach' }, content: { en: 'Step 1' } },
		]);
	});

	it('returns an empty relatedProjects array when the field is null', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			related_projects: null,
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
		};
		expect(toService(row).relatedProjects).toEqual([]);
	});
});

describe('toLocalizedString — exposed helper', () => {
	// Complementary to directus.test.ts's coverage — documents that this export
	// is part of the adapter's public surface (reused by future port impls).
	it('falls back to en when the requested locale is missing', () => {
		const result = toLocalizedString(
			[{ languages_code: 'en', title: 'Hello' }],
			'title',
		);
		expect(result).toEqual({ en: 'Hello' });
	});

	it('returns { en: "" } when no translations at all', () => {
		expect(toLocalizedString([], 'title')).toEqual({ en: '' });
		expect(toLocalizedString(null, 'title')).toEqual({ en: '' });
		expect(toLocalizedString(undefined, 'title')).toEqual({ en: '' });
	});
});
