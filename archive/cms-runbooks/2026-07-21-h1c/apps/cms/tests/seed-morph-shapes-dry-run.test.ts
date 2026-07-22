import { describe, it, expect } from 'bun:test';
import {
	toMorphShapeRow,
	loadMorphShapesFixture,
} from '../scripts/seed-morph-shapes';

describe('seed-morph-shapes pure helpers', () => {
	const fixture = loadMorphShapesFixture();

	it('loads ≥4 fixture rows', () => {
		expect(fixture.length).toBeGreaterThanOrEqual(4);
	});

	it('every row has a closed SVG path', () => {
		for (const row of fixture) {
			expect(row.path).toMatch(/^[Mm]/);
			expect(row.path).toMatch(/[Zz]\s*$/);
		}
	});

	it('toMorphShapeRow returns the row shape unchanged', () => {
		const row = toMorphShapeRow(fixture[0]);
		expect(row).toEqual(fixture[0]);
	});
});
