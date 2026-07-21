import { describe, expect, it } from 'vitest';
import { projectFactory } from '../../tests/factories';
import { deriveProjectFacets } from './project-facets';

const project = (
	status: 'public' | 'private' | 'wip',
	tags: string[],
	stack: string[],
	relatedServices: string[],
) => projectFactory.build({ status, tags, stack, relatedServices });

describe('deriveProjectFacets', () => {
	it('excludes private-only tags, stack items, and service IDs', () => {
		const facets = deriveProjectFacets([
			project('public', ['visible-tag'], ['Visible stack'], ['visible-service']),
			project('private', ['private-tag'], ['Private stack'], ['private-service']),
		]);

		expect(facets).toEqual({
			tags: ['visible-tag'],
			stackItems: ['Visible stack'],
			serviceIds: ['visible-service'],
		});
	});

	it('retains facets from both public and work-in-progress projects', () => {
		const facets = deriveProjectFacets([
			project('public', ['public-tag'], ['Public stack'], ['public-service']),
			project('wip', ['wip-tag'], ['WIP stack'], ['wip-service']),
		]);

		expect(facets).toEqual({
			tags: ['public-tag', 'wip-tag'],
			stackItems: ['Public stack', 'WIP stack'],
			serviceIds: ['public-service', 'wip-service'],
		});
	});

	it('deduplicates and sorts every facet', () => {
		const facets = deriveProjectFacets([
			project('public', ['zeta', 'alpha'], ['Zeta', 'Alpha'], ['zeta', 'alpha']),
			project('wip', ['alpha'], ['Alpha'], ['alpha']),
		]);

		expect(facets).toEqual({
			tags: ['alpha', 'zeta'],
			stackItems: ['Alpha', 'Zeta'],
			serviceIds: ['alpha', 'zeta'],
		});
	});
});
