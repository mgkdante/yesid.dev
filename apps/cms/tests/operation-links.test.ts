import { describe, expect, it } from 'bun:test';
import operations from '../directus/collections/operations.json';

// Directus 12.5.1: api/src/database/migrations/20220429A-add-flows.ts
// defines resolve and reject as separate UNIQUE foreign keys. The same target
// may appear once in each column, but cannot repeat within either column,
// including links belonging to different flows. NULL has no incoming link.
describe('Directus operation links fit their database constraints', () => {
	it.each(['resolve', 'reject'] as const)('has at most one incoming %s link per target across the snapshot', (branch) => {
		const incoming = new Map<string, string[]>();
		for (const operation of operations) {
			const target = operation[branch];
			if (target === null) continue;
			const keys = incoming.get(target) ?? [];
			keys.push(operation.key);
			incoming.set(target, keys);
		}
		const duplicates = [...incoming].filter(([, keys]) => keys.length > 1);
		expect(duplicates).toEqual([]);
	});
});
