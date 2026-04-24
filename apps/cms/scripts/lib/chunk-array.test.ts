import { describe, it, expect } from 'bun:test';
import { chunkArray } from './chunk-array';

describe('scripts/lib/chunk-array.ts', () => {
	it('chunks even division', () => {
		expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	it('returns a smaller final chunk when not evenly divisible', () => {
		expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it('returns empty array for empty input', () => {
		expect(chunkArray([], 3)).toEqual([]);
	});

	it('returns single chunk when size exceeds length', () => {
		expect(chunkArray([1, 2], 10)).toEqual([[1, 2]]);
	});

	it('throws on non-positive size', () => {
		expect(() => chunkArray([1, 2], 0)).toThrow(/must be positive/);
		expect(() => chunkArray([1, 2], -1)).toThrow(/must be positive/);
	});

	it('is generic over element type', () => {
		const result = chunkArray(['a', 'b', 'c'], 2);
		const first: readonly string[] = result[0];
		expect(first).toEqual(['a', 'b']);
	});
});
