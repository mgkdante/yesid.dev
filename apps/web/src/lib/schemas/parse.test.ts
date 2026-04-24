import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parsePort } from './parse';

const TestSchema = z.object({ id: z.string(), count: z.number() });

describe('parsePort', () => {
	it('returns the parsed value when input matches the schema', () => {
		const input = { id: 'abc', count: 42 };
		const result = parsePort('test.port', TestSchema, input);
		expect(result).toEqual(input);
	});

	it('throws when input violates the schema, tagging the error with the port label', () => {
		expect(() =>
			parsePort('projects.all', TestSchema, { id: 'x', count: 'not-a-number' }),
		).toThrow(/^\[adapter\.projects\.all\]/);
	});

	it('includes Zod error context in the thrown message', () => {
		try {
			parsePort('test.port', TestSchema, { id: 'x', count: 'bad' });
			expect.fail('should have thrown');
		} catch (err) {
			expect(err).toBeInstanceOf(Error);
			const message = (err as Error).message;
			expect(message).toMatch(/^\[adapter\.test\.port\]/);
			expect(message).toMatch(/count/);
		}
	});

	it('handles array schemas', () => {
		const result = parsePort('blog.all', z.array(z.string()), ['a', 'b']);
		expect(result).toEqual(['a', 'b']);
	});

	it('handles optional schemas with undefined input', () => {
		const result = parsePort('projects.bySlug', TestSchema.optional(), undefined);
		expect(result).toBeUndefined();
	});

	it('preserves the parsed narrow type at runtime for downstream consumers', () => {
		const result = parsePort('meta.site', TestSchema, { id: 'x', count: 1 });
		expect(typeof result.id).toBe('string');
		expect(typeof result.count).toBe('number');
	});
});
