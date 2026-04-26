import { describe, it, expect } from 'bun:test';
import fixture from '../fixtures/collections/morph-shapes.json' with { type: 'json' };
import { z } from 'zod';

const MorphShapeFixtureSchema = z.array(z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	label: z.string().min(1),
	path: z.string().regex(/^[Mm].*[Zz]$/, 'must be a closed SVG path (start with M, end with Z)'),
	viewbox: z.string().regex(/^\d+\s+\d+\s+\d+\s+\d+$/, 'must be "0 0 W H" format'),
	sort: z.number().int().min(0),
	description: z.string(),
}));

describe('apps/cms/fixtures/collections/morph-shapes.json', () => {
	it('parses through MorphShapeFixtureSchema', () => {
		const result = MorphShapeFixtureSchema.safeParse(fixture);
		if (!result.success) console.error(result.error.issues);
		expect(result.success).toBe(true);
	});

	it('contains at least 4 shapes (matching current static lib)', () => {
		expect(fixture.length).toBeGreaterThanOrEqual(4);
	});

	it('has unique ids', () => {
		const ids = fixture.map((s: { id: string }) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
