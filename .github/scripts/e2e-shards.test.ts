import { describe, expect, test } from 'bun:test';
import { assignFiles, filePattern } from './e2e-shards';
import profile from './e2e-durations.json';

describe('duration-balanced file assignment', () => {
	test('every file appears once, including new files without history', () => {
		const files = ['slow.spec.ts', 'new.spec.ts', 'fast.spec.ts', 'nested/other.spec.ts'];
		const shards = assignFiles(files, { 'slow.spec.ts': 100, 'fast.spec.ts': 10 }, 2);
		expect(shards.flatMap(shard => shard.files).sort()).toEqual([...files].sort());
		expect(shards.every(shard => shard.files.length > 0)).toBe(true);
		expect(assignFiles([...files].reverse(), { 'slow.spec.ts': 100, 'fast.spec.ts': 10 }, 2)).toEqual(shards);
	});
	test('balances the complete recorded suite close to its mean', () => {
		const files = Object.keys(profile.durationMs);
		const shards = assignFiles(files, profile.durationMs);
		const mean = shards.reduce((sum, shard) => sum + shard.durationMs, 0) / shards.length;
		expect(shards.flatMap(shard => shard.files).sort()).toEqual(files.sort());
		expect(Math.max(...shards.map(shard => shard.durationMs))).toBeLessThan(mean * 1.01);
		// Configuration C has two workers; this is an estimate, not a wall-clock assertion.
		expect(Math.max(...shards.map(shard => shard.durationMs)) / 2).toBeLessThan(4 * 60_000);
	});
	test('rejects duplicate files, invalid shard counts and malformed measurements', () => {
		for (const count of [0, 1.5, 3]) expect(() => assignFiles(['a.spec.ts', 'b.spec.ts'], { a: 1 }, count)).toThrow();
		expect(() => assignFiles(['a.spec.ts', 'a.spec.ts'], { a: 1 }, 2)).toThrow();
		for (const value of [0, -1, NaN, Infinity]) {
			expect(() => assignFiles(['a.spec.ts'], { 'a.spec.ts': value }, 1)).toThrow();
		}
	});
	test('matches exact paths rather than similarly named or nested alternatives', () => {
		const pattern = new RegExp(filePattern('page-content/a[1].spec.ts'));
		expect(pattern.test('/home/runner/tests/page-content/a[1].spec.ts')).toBe(true);
		expect(pattern.test('C:\\tests\\page-content\\a[1].spec.ts')).toBe(true);
		expect(pattern.test('/home/runner/tests/page-content/a1.spec.ts')).toBe(false);
		expect(pattern.test('/home/runner/tests/page-content/a[1].spec.ts.extra')).toBe(false);
	});
});
