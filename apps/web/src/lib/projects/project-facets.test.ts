import { describe, expect, it } from 'vitest';
import { projectFactory } from '../../tests/factories';
import { deriveProjectFacets } from './project-facets';

const project = (
	status: 'public' | 'private' | 'wip',
	stack: string[],
	relatedServices: string[],
) => projectFactory.build({ status, stack, relatedServices });

describe('deriveProjectFacets', () => {
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
