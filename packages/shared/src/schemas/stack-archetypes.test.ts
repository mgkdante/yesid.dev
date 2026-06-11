import { describe, it, expect } from 'bun:test';
import { STACK_LAYERS, StackArchetypeSchema } from './stack-archetypes';

// Minimal valid LocalizedString for test fixtures.
const ls = (en: string) => ({ en });

describe('STACK_LAYERS', () => {
	it('exports the four canonical layers in render order (interface → infra)', () => {
		expect(STACK_LAYERS).toEqual(['interface', 'logic', 'data', 'infra']);
	});
});

describe('StackArchetypeSchema', () => {
	const valid = {
		slug: 'data-dashboard',
		title: ls('A data dashboard'),
		hook: ls('See your numbers move.'),
		description: ls('Live metrics from data you own.'),
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'sql-development',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'postgresql', layer: 'data', sort: 2 },
		],
	};

	it('parses a minimal valid StackArchetype', () => {
		expect(() => StackArchetypeSchema.parse(valid)).not.toThrow();
	});

	it('rejects an empty en title', () => {
		const bad = { ...valid, title: ls('') };
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('rejects an empty slug', () => {
		const bad = { ...valid, slug: '' };
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('rejects an empty tech array', () => {
		const bad = { ...valid, tech: [] };
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('rejects an unknown layer', () => {
		const bad = {
			...valid,
			tech: [{ id: 'sveltekit', layer: 'cloud', sort: 1 }],
		};
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('rejects a tech link with an empty id', () => {
		const bad = { ...valid, tech: [{ id: '', layer: 'interface', sort: 1 }] };
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('rejects a non-integer sort', () => {
		const bad = { ...valid, tech: [{ id: 'sveltekit', layer: 'interface', sort: 1.5 }] };
		expect(() => StackArchetypeSchema.parse(bad)).toThrow();
	});

	it('accepts scenario archetypes without proof/service (amendment 2026-06-11)', () => {
		const { proofProjectSlug, serviceId, ...scenario } = valid;
		expect(StackArchetypeSchema.parse(scenario)).toEqual(scenario);
	});
	it('rejects empty proofProjectSlug / serviceId', () => {
		expect(() => StackArchetypeSchema.parse({ ...valid, proofProjectSlug: '' })).toThrow();
		expect(() => StackArchetypeSchema.parse({ ...valid, serviceId: '' })).toThrow();
	});
});
