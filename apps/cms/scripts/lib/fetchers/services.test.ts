import { describe, expect, it } from 'bun:test';
import { toService, type DirectusService } from './services';
import { ServiceSchema } from '@repo/shared/schemas';
const FIXTURE: DirectusService = {
	id: 'sql-development',
	station: 1,
	icon: null,
	svg: 'service-sql.svg',
	visible: true,
	tech_stack: [
		{ sort: 0, tech_stack_id: { id: 'postgresql', name: 'PostgreSQL' } },
		{ sort: 1, tech_stack_id: { id: 'sql-server', name: 'SQL Server' } },
	],
	translations: [
		{
			languages_code: 'en',
			title: 'SQL Development & Optimization',
			description: 'Write, refactor, and tune SQL queries.',
			subtitle: '& Optimization',
			value_proposition: 'Slow queries cost money — I audit and rewrite them.',
			benefit_headline: 'Queries that run in seconds, not minutes',
			impact_metric_value: '3x faster',
			impact_metric_label: 'avg query improvement',
		},
	],
	deliverables: [
		{ id: 1, sort: 2, translations: [{ languages_code: 'en', label: 'Schema refactoring plan' }] },
		{ id: 2, sort: 1, translations: [{ languages_code: 'en', label: 'Query performance audit' }] },
	],
	sections: [
		{
			id: 1,
			sort: 1,
			translations: [
				{ languages_code: 'en', title: 'My Approach', content: 'I start with your slowest queries.' },
			],
		},
	],
};

describe('services fetcher transform', () => {
	it('produces a Service with localized title + description', () => {
		const result = toService(FIXTURE);
		expect(result.id).toBe('sql-development');
		expect(result.station).toBe(1);
		expect(result.title.en).toBe('SQL Development & Optimization');
		expect(result.description.en).toMatch(/Write, refactor/);
	});

	it('sorts deliverables by sort ascending', () => {
		const result = toService(FIXTURE);
		expect(result.deliverables).toHaveLength(2);
		expect(result.deliverables?.[0].en).toBe('Query performance audit');
		expect(result.deliverables?.[1].en).toBe('Schema refactoring plan');
	});

	it('attaches sections with localized title + content', () => {
		const result = toService(FIXTURE);
		expect(result.sections).toHaveLength(1);
		expect(result.sections?.[0].title.en).toBe('My Approach');
	});

	it('attaches impactMetric when both value and label are present', () => {
		const result = toService(FIXTURE);
		expect(result.impactMetric).toEqual({
			value: { en: '3x faster' },
			label: { en: 'avg query improvement' },
		});
	});

	it('omits impactMetric when either value or label is missing', () => {
		const noImpact: DirectusService = {
			...FIXTURE,
			translations: [{ languages_code: 'en', title: 'X', description: 'Y' }],
		};
		const result = toService(noImpact);
		expect(result.impactMetric).toBeUndefined();
	});

	it('output (with relatedProjects added) parses through ServiceSchema', () => {
		const result = toService(FIXTURE);
		(result as { relatedProjects: string[] }).relatedProjects = ['transit-data-pipeline'];
		expect(() => ServiceSchema.parse(result)).not.toThrow();
	});
});

describe('services per-language Show on site', () => {
	const withFrench = (show: boolean): DirectusService => ({
		...FIXTURE,
		translations: [
			{ ...FIXTURE.translations![0]!, show_on_site: true },
			{ languages_code: 'fr', show_on_site: show, title: 'Développement SQL', description: 'Requêtes.' },
		],
		deliverables: [{ id: 1, sort: 1, translations: [{ languages_code: 'en', label: 'Audit' }, { languages_code: 'fr', label: 'Audit FR' }] }],
	});

	it('shows a switched-on French row and falls back to English when it is off', () => {
		expect(toService(withFrench(true)).title.fr).toBe('Développement SQL');
		const off = toService(withFrench(false));
		expect(off.title.fr).toBeUndefined();
		expect(off.deliverables?.[0]?.fr).toBeUndefined();
		expect(off.visible).toBe(true);
	});

	it('hides the service when English is switched off', () => {
		const englishOff = { ...FIXTURE, translations: [{ ...FIXTURE.translations![0]!, show_on_site: false }] };
		expect(toService(englishOff).visible).toBe(false);
	});
});
