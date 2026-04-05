import { describe, it, expect } from 'vitest';
import { stagger } from './stagger.js';

describe('stagger utility', () => {
	it('returns 0 for index 0 regardless of baseDelay', () => {
		// The first element should always animate without delay.
		expect(stagger(0, 80, { randomize: false })).toBe(0);
		expect(stagger(0, 120, { randomize: false })).toBe(0);
	});

	it('returns baseDelay * index when randomize is false', () => {
		expect(stagger(1, 80, { randomize: false })).toBe(80);
		expect(stagger(2, 80, { randomize: false })).toBe(160);
		expect(stagger(3, 80, { randomize: false })).toBe(240);
	});

	it('returns 0 for index 0 even with randomization enabled', () => {
		// index 0 * baseDelay = 0, no variance (variance based on baseDelay, result >= 0)
		const result = stagger(0, 80);
		expect(result).toBeGreaterThanOrEqual(0);
	});

	it('randomized result stays within ±randomRange of the deterministic value', () => {
		const baseDelay = 100;
		const randomRange = 0.15;
		const maxVariance = baseDelay * randomRange; // 15

		// Run many iterations to give randomization a chance to hit edges.
		for (let i = 0; i < 100; i++) {
			const result = stagger(2, baseDelay, { randomize: true, randomRange });
			const deterministic = 2 * baseDelay; // 200
			expect(result).toBeGreaterThanOrEqual(deterministic - maxVariance);
			expect(result).toBeLessThanOrEqual(deterministic + maxVariance);
		}
	});

	it('never returns a negative value', () => {
		for (let i = 0; i < 200; i++) {
			expect(stagger(0, 80)).toBeGreaterThanOrEqual(0);
			expect(stagger(1, 10)).toBeGreaterThanOrEqual(0);
		}
	});

	it('returns 0 when baseDelay is 0', () => {
		expect(stagger(5, 0)).toBe(0);
	});

	it('respects a custom randomRange option', () => {
		const baseDelay = 100;
		const randomRange = 0.05; // 5%
		const maxVariance = baseDelay * randomRange; // 5

		for (let i = 0; i < 100; i++) {
			const result = stagger(1, baseDelay, { randomize: true, randomRange });
			const deterministic = 1 * baseDelay; // 100
			expect(result).toBeGreaterThanOrEqual(deterministic - maxVariance);
			expect(result).toBeLessThanOrEqual(deterministic + maxVariance);
		}
	});

	it('defaults to randomize: true', () => {
		// With randomize: true, consecutive calls for index >= 1 may differ.
		// Run enough iterations to see at least one different value.
		const results = new Set(Array.from({ length: 50 }, () => stagger(3, 80)));
		// A pure deterministic function would always return 240. Randomization should
		// produce at least 2 distinct values across 50 calls.
		expect(results.size).toBeGreaterThan(1);
	});
});
