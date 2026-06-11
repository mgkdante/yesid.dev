import { describe, expect, it } from 'bun:test';
import { StackArchetypeSchema } from '@repo/shared/schemas';
import {
	orderArchetypeTechLinks,
	toStackArchetype,
	type DirectusStackArchetypeRow,
} from '../scripts/lib/fetchers/stack-archetypes';

const DASHBOARD_ROW: DirectusStackArchetypeRow = {
	id: 'uuid-1',
	status: 'published',
	slug: 'data-dashboard',
	sort: 1,
	icon: 'monitoring',
	proof_project: 'transit-data-pipeline',
	service: 'sql-development',
	translations: [
		{
			languages_code: 'en',
			title: 'A data dashboard',
			hook: 'See your numbers move.',
			description: 'Live metrics drawn straight from data you own.',
		},
		{
			languages_code: 'fr',
			title: 'Un tableau de bord',
			hook: 'Voyez vos chiffres bouger.',
			description: 'Des métriques en direct.',
		},
	],
	tech: [
		// Intentionally shuffled — transform must re-order by (layer, sort).
		{ tech_stack_id: 'docker', layer: 'infra', sort: 4 },
		{ tech_stack_id: 'sveltekit', layer: 'interface', sort: 1 },
		{ tech_stack_id: 'postgresql', layer: 'data', sort: 3 },
		{ tech_stack_id: 'rest-api', layer: 'logic', sort: 2 },
	],
};

describe('stack-archetypes fetcher transform', () => {
	it('maps slug, copy, proof project, and service', () => {
		const result = toStackArchetype(DASHBOARD_ROW);
		expect(result.slug).toBe('data-dashboard');
		expect(result.title).toEqual({ en: 'A data dashboard', fr: 'Un tableau de bord' });
		expect(result.hook.en).toBe('See your numbers move.');
		expect(result.description.en).toBe('Live metrics drawn straight from data you own.');
		expect(result.proofProjectSlug).toBe('transit-data-pipeline');
		expect(result.serviceId).toBe('sql-development');
	});

	it('orders tech links by STACK_LAYERS render order, then sort', () => {
		const result = toStackArchetype(DASHBOARD_ROW);
		expect(result.tech.map((l) => l.id)).toEqual([
			'sveltekit',
			'rest-api',
			'postgresql',
			'docker',
		]);
		expect(result.tech.map((l) => l.layer)).toEqual(['interface', 'logic', 'data', 'infra']);
	});

	it('orders same-layer links by sort, slug-stable on ties', () => {
		const ordered = orderArchetypeTechLinks([
			{ tech_stack_id: 'b-tech', layer: 'logic', sort: 2 },
			{ tech_stack_id: 'a-tech', layer: 'logic', sort: 1 },
			{ tech_stack_id: 'z-tech', layer: 'interface', sort: 9 },
			{ tech_stack_id: 'tie-b', layer: 'data', sort: 1 },
			{ tech_stack_id: 'tie-a', layer: 'data', sort: 1 },
		]);
		expect(ordered.map((l) => l.tech_stack_id)).toEqual([
			'z-tech',
			'a-tech',
			'b-tech',
			'tie-a',
			'tie-b',
		]);
	});

	it('tolerates the expanded M2O object form for proof_project/service', () => {
		const expanded: DirectusStackArchetypeRow = {
			...DASHBOARD_ROW,
			proof_project: { id: 'transit-data-pipeline' },
			service: { id: 'sql-development' },
		};
		const result = toStackArchetype(expanded);
		expect(result.proofProjectSlug).toBe('transit-data-pipeline');
		expect(result.serviceId).toBe('sql-development');
	});

	it('output parses through StackArchetypeSchema (Zod gate)', () => {
		expect(() => StackArchetypeSchema.parse(toStackArchetype(DASHBOARD_ROW))).not.toThrow();
	});

	it('FAILS LOUD when a published archetype has zero tech links', () => {
		const empty: DirectusStackArchetypeRow = { ...DASHBOARD_ROW, tech: [] };
		expect(() => toStackArchetype(empty)).toThrow(/data-dashboard.*zero tech links/);
		const missing: DirectusStackArchetypeRow = { ...DASHBOARD_ROW, tech: undefined };
		expect(() => toStackArchetype(missing)).toThrow(/zero tech links/);
	});

	it('FAILS LOUD when proof_project or service is missing', () => {
		expect(() => toStackArchetype({ ...DASHBOARD_ROW, proof_project: null })).toThrow(
			/data-dashboard/,
		);
		expect(() => toStackArchetype({ ...DASHBOARD_ROW, service: null })).toThrow(
			/data-dashboard/,
		);
	});

	it('junction sort accepts null (treated as last within the layer)', () => {
		const withNull = toStackArchetype({
			...DASHBOARD_ROW,
			tech: [
				{ tech_stack_id: 'late', layer: 'logic', sort: null },
				{ tech_stack_id: 'early', layer: 'logic', sort: 1 },
			],
		});
		expect(withNull.tech.map((l) => l.id)).toEqual(['early', 'late']);
	});
});
