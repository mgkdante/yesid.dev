import { describe, expect, it } from 'vitest';
import { projectFactory } from '../../tests/factories';
import { deriveProjectFacets } from './project-facets';

const project = (
	status: 'public' | 'private' | 'wip',
	stack: string[],
	relatedServices: string[],
) => projectFactory.build({ status, stack, relatedServices });

describe('deriveProjectFacets', () => {
	it('uses the request locale and omits facets when the project site page is archived', () => {
		const rows = [project('public', ['SQL'], ['database'])];
		expect(deriveProjectFacets(rows, 'es', { locales: ['en'] })).toEqual({ stackItems: [], serviceIds: [] });
		expect(deriveProjectFacets(rows, 'fr', { locales: ['fr'] })).toEqual({ stackItems: ['SQL'], serviceIds: ['database'] });
		expect(deriveProjectFacets(rows, 'en', { pages: [] })).toEqual({ stackItems: [], serviceIds: [] });
	});
	it('excludes private-only stack items and service IDs', () => {
		const facets = deriveProjectFacets([
			project('public', ['Visible stack'], ['visible-service']),
			project('private', ['Private stack'], ['private-service']),
		]);

		expect(facets).toEqual({
			stackItems: ['Visible stack'],
			serviceIds: ['visible-service'],
		});
	});

	it('retains facets from both public and work-in-progress projects', () => {
		const facets = deriveProjectFacets([
			project('public', ['Public stack'], ['public-service']),
			project('wip', ['WIP stack'], ['wip-service']),
		]);

		expect(facets).toEqual({
			stackItems: ['Public stack', 'WIP stack'],
			serviceIds: ['public-service', 'wip-service'],
		});
	});

	it('deduplicates and sorts every facet', () => {
		const facets = deriveProjectFacets([
			project('public', ['Zeta', 'Alpha'], ['zeta', 'alpha']),
			project('wip', ['Alpha'], ['alpha']),
		]);

		expect(facets).toEqual({
			stackItems: ['Alpha', 'Zeta'],
			serviceIds: ['alpha', 'zeta'],
		});
	});
});
