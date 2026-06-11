import { describe, expect, it } from 'bun:test';
import { asSingletonRow } from './singleton';

describe('asSingletonRow', () => {
	it('unwraps a one-element array (pre-flip CMS shape)', () => {
		expect(asSingletonRow<{ id: number }>([{ id: 7 }], 'block_hero')).toEqual({ id: 7 });
	});
	it('passes a plain object through (post-flip singleton shape)', () => {
		expect(asSingletonRow<{ id: number }>({ id: 7 }, 'block_hero')).toEqual({ id: 7 });
	});
	it('throws on an empty array', () => {
		expect(() => asSingletonRow([], 'block_hero')).toThrow('[block_hero] no row found');
	});
	it('throws on null/undefined/primitives', () => {
		expect(() => asSingletonRow(null, 'block_hero')).toThrow('[block_hero] unexpected response shape');
		expect(() => asSingletonRow(undefined, 'block_hero')).toThrow();
		expect(() => asSingletonRow('x', 'block_hero')).toThrow();
	});
});
