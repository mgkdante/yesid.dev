import { describe, expect, it } from 'bun:test';
import { toTechStackItem, type DirectusTechStackRow } from './tech-stack';
import { TechStackItemSchema } from '../schemas/tech-stack';
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
});
