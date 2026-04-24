import { describe, it, expect } from 'bun:test';
import { findOrphans } from './loaders';

// Loader tests focus on the pure helpers (findOrphans). The network-touching
// helpers (fetchExistingIds, loadSkeletonRecords, loadFullData, deleteOrphans)
// are exercised by the ephemeral-Directus integration tests in 18e+ when
// projects + M2M land — unit-mocking the SDK client for this file adds
// boilerplate without catching real issues.

describe('scripts/lib/loaders.ts', () => {
	describe('findOrphans', () => {
		it('returns existing - desired', () => {
			expect(findOrphans(['a', 'b', 'c'], ['a', 'c'])).toEqual(['b']);
		});

		it('returns empty when existing is a subset of desired', () => {
			expect(findOrphans(['a', 'b'], ['a', 'b', 'c'])).toEqual([]);
		});

		it('returns all existing when desired is empty', () => {
			expect(findOrphans(['a', 'b'], [])).toEqual(['a', 'b']);
		});

		it('returns empty when existing is empty', () => {
			expect(findOrphans([], ['a', 'b'])).toEqual([]);
		});

		it('preserves existing order', () => {
			expect(findOrphans(['z', 'a', 'm'], ['a'])).toEqual(['z', 'm']);
		});

		it('no duplicates added when desired has duplicates', () => {
			expect(findOrphans(['a', 'b'], ['a', 'a'])).toEqual(['b']);
		});
	});
});
