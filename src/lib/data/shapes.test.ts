import { describe, it, expect } from 'vitest';
import { SHAPES, SHAPE_KEYS, pickRandomShape } from './shapes.js';
import type { ShapeKey } from './shapes.js';

describe('shapes', () => {
	it('SHAPES has 4 geometric shapes', () => {
		expect(Object.keys(SHAPES)).toHaveLength(4);
		expect(SHAPES.triangle).toBeDefined();
		expect(SHAPES.circle).toBeDefined();
		expect(SHAPES.square).toBeDefined();
		expect(SHAPES.hexagon).toBeDefined();
	});

	it('all SHAPES values are valid SVG path strings', () => {
		for (const path of Object.values(SHAPES)) {
			expect(path).toMatch(/^M/);
		}
	});

	it('SHAPE_KEYS matches SHAPES keys', () => {
		expect(SHAPE_KEYS).toEqual(Object.keys(SHAPES));
	});

	it('pickRandomShape returns a valid shape key and index', () => {
		const result = pickRandomShape();
		expect(SHAPE_KEYS).toContain(result.key);
		expect(result.index).toBeGreaterThanOrEqual(0);
		expect(result.index).toBeLessThan(SHAPE_KEYS.length);
	});

	it('pickRandomShape avoids the last index', () => {
		// Run enough times to statistically guarantee avoidance
		for (let i = 0; i < 50; i++) {
			const result = pickRandomShape(0);
			expect(result.index).not.toBe(0);
		}
	});
});
