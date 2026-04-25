import { describe, expect, it } from 'bun:test';
import {
	type Service,
	collectServiceLocales,
	loadServicesFixture,
	localesIn,
	toDeliverableRows,
	toSectionRows,
	toServiceRow,
	toTranslationRows,
} from '../scripts/seed-services';

/**
 * Unit tests on the pure transformation helpers in seed-services.ts.
 *
 * Exercises the `Service` domain shape → Directus-row shape mapping without
 * any network I/O. Ensures the transformation stays idempotent + locale-aware
 * as new content types add their own transformations in Tasks 10–14.
 *
 * Scope: repo-local. No network. No Directus.
 */
describe('localesIn', () => {
	it('returns [] for undefined input', () => {
		expect(localesIn(undefined)).toEqual([]);
	});

	it('returns only present locales', () => {
		expect(localesIn({ en: 'a', fr: 'b' })).toEqual(['en', 'fr']);
		expect(localesIn({ en: 'a' })).toEqual(['en']);
	});

	it('skips empty strings', () => {
		expect(localesIn({ en: 'a', fr: '' })).toEqual(['en']);
	});

	it('preserves locale order (en, fr, es)', () => {
		expect(localesIn({ en: 'a', fr: 'b', es: 'c' })).toEqual([
			'en',
			'fr',
			'es',
		]);
	});
});

describe('collectServiceLocales', () => {
	const base: Service = {
		id: 'x',
		title: { en: 't' },
		description: { en: 'd' },
		station: 1,
		relatedProjects: [],
	};

	it('picks up locales from nested LocalizedString fields', () => {
		const s: Service = {
			...base,
			valueProposition: { en: 'v', fr: 'vf' },
			impactMetric: {
				value: { en: '3x' },
				label: { en: 'faster', fr: 'plus rapide' },
			},
		};
		expect(collectServiceLocales(s)).toEqual(['en', 'fr']);
	});

	it('picks up locales from deliverables + sections', () => {
		const s: Service = {
			...base,
			deliverables: [{ en: 'a', fr: 'a-fr' }],
			sections: [
				{
					title: { en: 'ts', es: 'ts-es' },
					content: { en: 'tc' },
				},
			],
		};
		expect(collectServiceLocales(s)).toEqual(['en', 'fr', 'es']);
	});

	it('returns just [en] when only English is populated', () => {
		expect(collectServiceLocales(base)).toEqual(['en']);
	});
});

describe('toTranslationRows', () => {
	it('produces one row per locale with nulls for missing optional fields', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'Title' },
			description: { en: 'Desc' },
			station: 1,
			relatedProjects: [],
		};
		const rows = toTranslationRows(s);
		expect(rows).toEqual([
			{
				languages_code: 'en',
				title: 'Title',
				subtitle: null,
				description: 'Desc',
				long_description: null,
				value_proposition: null,
				benefit_headline: null,
				impact_metric_value: null,
				impact_metric_label: null,
			},
		]);
	});

	it('propagates optional fields when present', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			subtitle: { en: 'S' },
			longDescription: { en: 'LD' },
			valueProposition: { en: 'VP' },
			benefitHeadline: { en: 'BH' },
			impactMetric: { value: { en: '3x' }, label: { en: 'faster' } },
			station: 1,
			relatedProjects: [],
		};
		const rows = toTranslationRows(s);
		expect(rows[0]).toMatchObject({
			languages_code: 'en',
			subtitle: 'S',
			long_description: 'LD',
			value_proposition: 'VP',
			benefit_headline: 'BH',
			impact_metric_value: '3x',
			impact_metric_label: 'faster',
		});
	});
});

describe('toDeliverableRows', () => {
	it('preserves sort order and per-locale labels', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			station: 1,
			relatedProjects: [],
			deliverables: [
				{ en: 'first' },
				{ en: 'second', fr: 'deuxième' },
			],
		};
		const rows = toDeliverableRows(s);
		expect(rows).toEqual([
			{ sort: 0, translations: [{ languages_code: 'en', label: 'first' }] },
			{
				sort: 1,
				translations: [
					{ languages_code: 'en', label: 'second' },
					{ languages_code: 'fr', label: 'deuxième' },
				],
			},
		]);
	});

	it('returns [] when no deliverables', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			station: 1,
			relatedProjects: [],
		};
		expect(toDeliverableRows(s)).toEqual([]);
	});
});

describe('toSectionRows', () => {
	it('preserves sort order and multi-locale title + content pairs', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			station: 1,
			relatedProjects: [],
			sections: [
				{ title: { en: 'My Approach' }, content: { en: 'Step 1' } },
				{
					title: { en: 'Second', fr: 'Deuxième' },
					content: { en: 'Content', fr: 'Contenu' },
				},
			],
		};
		const rows = toSectionRows(s);
		expect(rows[0]).toEqual({
			sort: 0,
			translations: [
				{
					languages_code: 'en',
					title: 'My Approach',
					content: 'Step 1',
				},
			],
		});
		expect(rows[1]?.translations).toHaveLength(2);
	});
});

describe('toServiceRow', () => {
	it('maps a minimal service and defaults visible', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			station: 1,
			relatedProjects: ['p1', 'p2'],
		};
		const row = toServiceRow(s);
		expect(row).toMatchObject({
			id: 'x',
			station: 1,
			visible: true,
			related_projects: ['p1', 'p2'],
		});
		expect(row.icon).toBeUndefined();
		expect(row.svg).toBeUndefined();
		expect(row.stack).toBeUndefined();
	});

	it('includes icon/svg/stack when present', () => {
		const s: Service = {
			id: 'x',
			title: { en: 'T' },
			description: { en: 'D' },
			station: 1,
			icon: 'icon.json',
			svg: 'svg.svg',
			stack: ['PostgreSQL', 'T-SQL'],
			relatedProjects: [],
		};
		const row = toServiceRow(s);
		expect(row.icon).toBe('icon.json');
		expect(row.svg).toBe('svg.svg');
		expect(row.stack).toEqual(['PostgreSQL', 'T-SQL']);
	});
});

describe('fixture → row pipeline (integration, pure)', () => {
	it('every service in fixtures/collections/services.json maps without throwing', () => {
		const services = loadServicesFixture();
		for (const s of services) {
			const row = toServiceRow(s);
			expect(row.id).toBe(s.id);
			expect(row.station).toBe(s.station);
			expect(row.translations.length).toBeGreaterThan(0);
		}
	});

	it('every translation row has a non-empty en title', () => {
		const services = loadServicesFixture();
		for (const s of services) {
			const row = toServiceRow(s);
			const en = row.translations.find((t) => t.languages_code === 'en');
			expect(en).toBeDefined();
			expect(en?.title.length).toBeGreaterThan(0);
		}
	});
});
