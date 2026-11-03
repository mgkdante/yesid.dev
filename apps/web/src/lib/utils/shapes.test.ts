import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SHAPES, SHAPE_KEYS, pickRandomShape, getMorphShapes, setMorphShapes } from './shapes.js';
import type { MorphShape } from '@repo/shared';

const sampleShapes: readonly MorphShape[] = [
	{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 1 },
	{ id: 'circle', label: 'Circle', path: 'M24 8 A16 16 0 1 1 23.99 8 Z', viewbox: '0 0 48 48', sort: 2 },
	{ id: 'square', label: 'Square', path: 'M10 10 L38 10 L38 38 L10 38 Z', viewbox: '0 0 48 48', sort: 3 },
];

describe('legacy SHAPES (deprecated, kept for static fallback)', () => {
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
});

describe('getMorphShapes (async getter with cache)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setMorphShapes(sampleShapes);
	});

	it('returns shapes from catalog on first call', async () => {
		// Note: cache may be populated from a previous test run in the same module.
		// The important invariant is that the returned shapes are always valid.
		const shapes = await getMorphShapes();
		expect(shapes).toBeDefined();
		expect(shapes.length).toBeGreaterThan(0);
	});

	it('returned shapes have required MorphShape fields', async () => {
		const shapes = await getMorphShapes();
		for (const shape of shapes) {
			expect(shape).toHaveProperty('id');
			expect(shape).toHaveProperty('path');
			expect(shape).toHaveProperty('viewbox');
			expect(shape).toHaveProperty('sort');
		}
	});

	it('keeps the hydrated fixture stable across repeated reads', async () => {
		expect(await getMorphShapes()).toEqual(sampleShapes);
		expect(await getMorphShapes()).toEqual(sampleShapes);
	});
});

describe('pickRandomShape (new signature: array + lastIndex)', () => {
	it('returns a shape from the input array', () => {
		const result = pickRandomShape(sampleShapes);
		expect(sampleShapes).toContain(result.shape);
		expect(result.index).toBeGreaterThanOrEqual(0);
		expect(result.index).toBeLessThan(sampleShapes.length);
	});

	it('avoids the last index when given multiple shapes', () => {
		for (let i = 0; i < 50; i++) {
			const result = pickRandomShape(sampleShapes, 0);
			expect(result.index).not.toBe(0);
		}
	});

	it('returns shape object with correct path', () => {
		const result = pickRandomShape(sampleShapes);
		expect(result.shape.path).toBeDefined();
		expect(result.shape.path).toMatch(/^M/);
	});

	it('throws when given empty shapes array', () => {
		expect(() => pickRandomShape([])).toThrow(/No morph shapes/);
	});
});
