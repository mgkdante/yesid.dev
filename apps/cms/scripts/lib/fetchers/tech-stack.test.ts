import { describe, expect, it } from 'bun:test';
import { toTechStackItem, type DirectusTechStackRow } from './tech-stack';
import { TechStackItemSchema } from '@repo/shared/schemas';
import type { BlockEditorDoc } from '@repo/shared';

const DOC: BlockEditorDoc = {
	time: 0,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text: 'A row-level paragraph.' } }],
};

const FIXTURE: DirectusTechStackRow = {
	id: 'postgresql',
	name: 'PostgreSQL',
	icon: null,
	icon_id: {
		id: 'icon-uuid-1',
		name: 'PostgreSQL',
		iconify_id: 'logos:postgresql',
		svg_override: null,
	},
	status: 'published',
	sort: 1,
	translations: [
		{ languages_code: 'en', what_it_is: DOC, what_i_use_it_for: DOC, why_i_use_it_instead: DOC },
	],
	services: [{ services_id: 'sql-development' }, { services_id: 'data-pipeline' }],
	projects: [{ projects_id: 'transit-data-pipeline' }],
};

describe('tech-stack fetcher transform', () => {
	it('maps id + name + icon_id', () => {
		const result = toTechStackItem(FIXTURE);
		expect(result.id).toBe('postgresql');
		expect(result.name).toBe('PostgreSQL');
		expect(result.icon?.iconify_id).toBe('logos:postgresql');
	});

	it('flattens services + projects M2M junctions', () => {
		const result = toTechStackItem(FIXTURE);
		expect(result.relatedServices).toEqual(['sql-development', 'data-pipeline']);
		expect(result.relatedProjects).toEqual(['transit-data-pipeline']);
	});

	it('output parses through TechStackItemSchema', () => {
		const result = toTechStackItem(FIXTURE);
		expect(() => TechStackItemSchema.parse(result)).not.toThrow();
	});

	it('uses empty paragraph fallback for missing en translation', () => {
		const noEn: DirectusTechStackRow = { ...FIXTURE, translations: [] };
		const result = toTechStackItem(noEn);
		expect(result.what_it_is.en.blocks).toHaveLength(1);
		expect(result.what_it_is.en.blocks[0].type).toBe('paragraph');
	});

	it('icon is null when icon_id is undefined/null', () => {
		const noIcon: DirectusTechStackRow = { ...FIXTURE, icon_id: null };
		const result = toTechStackItem(noIcon);
		expect(result.icon).toBeNull();
	});

	// slice-29: engine support fields (layer + enables), both optional.

	it('passes layer through when set, omits the key when null/absent', () => {
		const withLayer: DirectusTechStackRow = { ...FIXTURE, layer: 'data' };
		expect(toTechStackItem(withLayer).layer).toBe('data');
		expect('layer' in toTechStackItem(FIXTURE)).toBe(false);
		const nullLayer: DirectusTechStackRow = { ...FIXTURE, layer: null };
		expect('layer' in toTechStackItem(nullLayer)).toBe(false);
	});

	it('flattens enables into a LocalizedString, omitting the key when absent', () => {
		const withEnables: DirectusTechStackRow = {
			...FIXTURE,
			translations: [
				{ ...FIXTURE.translations[0], enables: 'stores and queries your data reliably' },
				{
					languages_code: 'fr',
					what_it_is: null,
					what_i_use_it_for: null,
					why_i_use_it_instead: null,
					enables: 'stocke et interroge vos données de manière fiable',
				},
			],
		};
		expect(toTechStackItem(withEnables).enables).toEqual({
			en: 'stores and queries your data reliably',
			fr: 'stocke et interroge vos données de manière fiable',
		});
		expect('enables' in toTechStackItem(FIXTURE)).toBe(false);
	});

	it('layer + enables variants still parse through TechStackItemSchema', () => {
		const full: DirectusTechStackRow = {
			...FIXTURE,
			layer: 'data',
			translations: [{ ...FIXTURE.translations[0], enables: 'stores your data' }],
		};
		expect(() => TechStackItemSchema.parse(toTechStackItem(full))).not.toThrow();
		expect(() => TechStackItemSchema.parse(toTechStackItem(FIXTURE))).not.toThrow();
	});
});
