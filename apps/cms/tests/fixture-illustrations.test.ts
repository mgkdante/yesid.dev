import { describe, it, expect } from 'bun:test';
import fixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';

const IllustrationFixtureSchema = z.array(z.object({
	id: z.string().min(1).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	file_legacy_path: z.string().min(1),
	label: z.string().min(1),
	category: z.enum(['professional', 'personal', 'general']),
	tags: z.array(z.string()),
	description: z.string().min(1),
	sort: z.number().int().min(0),
}));

describe('apps/cms/fixtures/collections/illustrations.json', () => {
	it('parses through IllustrationFixtureSchema', () => {
		const result = IllustrationFixtureSchema.safeParse(fixture);
		if (!result.success) console.error(result.error.issues);
		expect(result.success).toBe(true);
	});

	it('contains both professional and personal categories', () => {
		const items = IllustrationFixtureSchema.parse(fixture);
		const cats = new Set(items.map((i) => i.category));
		expect(cats.has('professional')).toBe(true);
		expect(cats.has('personal')).toBe(true);
	});

	it('has unique ids', () => {
		const ids = fixture.map((i: { id: string }) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('has at least 4 professional + 4 personal entries', () => {
		const items = IllustrationFixtureSchema.parse(fixture);
		const pro = items.filter((i) => i.category === 'professional').length;
		const personal = items.filter((i) => i.category === 'personal').length;
		expect(pro).toBeGreaterThanOrEqual(4);
		expect(personal).toBeGreaterThanOrEqual(4);
	});
});
