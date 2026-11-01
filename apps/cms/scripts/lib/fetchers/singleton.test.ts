import { describe, expect, it } from 'bun:test';
import { cmsClientDouble } from '../../../tests/helpers/doubles';
import { asSingletonRow, fetchBlockSingleton, type BlockRow } from './singleton';

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

describe('block publication boundary', () => {
	for (const status of ['draft', 'archived', undefined, null, '']) it(`rejects ${String(status)} block content before an export can publish it`, async () => {
		const client = cmsClientDouble(() => ({ id: 1, status, translations: [{ title: 'Unpublished copy' }] }));
		await expect(fetchBlockSingleton(client, 'block_hero', 'hero', ['id', 'translations.*'])).rejects.toThrow('not published');
	});
	it('accepts the published pre-singleton array shape', async () => {
		const client = cmsClientDouble(() => [{ id: 1, status: 'published' }]);
		expect(await fetchBlockSingleton<BlockRow>(client, 'block_hero', 'hero')).toEqual({ id: 1, status: 'published' });
	});
	it('retains published blocks and statusless settings', async () => {
		for (const row of [{ id: 1, status: 'published' }, { id: 2 }]) {
			const client = cmsClientDouble(() => row);
			expect(await fetchBlockSingleton<BlockRow>(client, 'site_labels', 'settings')).toEqual(row);
		}
	});
});
