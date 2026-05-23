import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { MorphShapeSchema, type MorphShape } from '../schemas/morph-shape';

describe('morph-shapes schema', () => {
	it('accepts a well-formed MorphShape row', () => {
		const row: MorphShape = {
			id: 'circle',
			label: 'Circle',
			path: 'M24 0a24 24 0 1 1 0 48a24 24 0 0 1 0-48z',
			viewbox: '0 0 48 48',
			sort: 1,
		};
		expect(() => MorphShapeSchema.parse(row)).not.toThrow();
	});

	it('rejects a row missing required fields', () => {
		const bad = { id: 'x', label: 'X', path: 'M0 0' };
		expect(() => MorphShapeSchema.parse(bad)).toThrow();
	});

	it('round-trips a sorted array', () => {
		const rows: MorphShape[] = [
			{ id: 'a', label: 'A', path: 'p1', viewbox: '0 0 48 48', sort: 1 },
			{ id: 'b', label: 'B', path: 'p2', viewbox: '0 0 48 48', sort: 2 },
		];
		const out = z.array(MorphShapeSchema).parse(rows);
		expect(out).toEqual(rows);
	});
});
