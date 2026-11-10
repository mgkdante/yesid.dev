import { describe, expect, test } from 'bun:test';
// @ts-expect-error The browser extension is an independently built JS package.
import { roundTrip, setImageControl, imageFile } from '../extensions/article-editor/src/data.js';

const image = { id: 'a', type: 'image', data: { file: { fileId: 'dark' }, caption: 'Before', variants: { light: { fileId: 'light' }, future: 1 }, layout: 'beside', showBothThemes: true, unknown: { nested: [1, 2] } } };
const paragraph = { id: 'p', type: 'paragraph', data: { text: 'After' } };
const previous = { blocks: [image, paragraph] };
const stock = { id: 'a', type: 'image', data: { file: { fileId: 'dark' }, caption: 'Edited', stretched: true } };

describe('article editor image save/load boundary', () => {
  test('preserves unknown fields and edited stock fields through repeated saves and reordering', () => {
    const saved = { blocks: [paragraph, stock] };
    const result = roundTrip(previous, saved);
    expect(result.blocks[0]).toEqual(paragraph);
    expect(result.blocks[1].data).toEqual({ ...image.data, ...stock.data });
    expect(roundTrip(result, saved)).toEqual(result);
    expect(roundTrip(previous, { blocks: [paragraph] }).blocks).toEqual([paragraph]);
    expect(roundTrip(previous, { blocks: [{ ...stock, id: 'new' }] }).blocks[0].data).toEqual(stock.data);
    expect(roundTrip(previous, null)).toBeNull();
  });
  test('maps layout, light picker and toggle without changing unrelated data', () => {
    const normal = setImageControl(previous, 'a', 'layout', '');
    expect(normal.blocks[0].data.layout).toBeUndefined();
    const row = setImageControl(normal, 'a', 'layout', 'row');
    expect(roundTrip(row, { blocks: [stock] }).blocks[0].data.layout).toBe('row');
    const removed = setImageControl(row, 'a', 'light', null);
    expect(removed.blocks[0].data.variants).toEqual({ future: 1 });
    expect(setImageControl(removed, 'a', 'showBothThemes', true).blocks[0].data.showBothThemes).toBe(false);
    const file = imageFile({ id: 'uuid', filename_download: 'test.light.png', width: 10, height: 20 }, '/');
    const paired = setImageControl(removed, 'a', 'light', file);
    const both = setImageControl(paired, 'a', 'showBothThemes', true);
    expect(both.blocks[0].data.variants.light).toMatchObject({ fileId: 'uuid', fileURL: '/files/uuid', url: '/assets/uuid', width: 10, height: 20 });
    expect(both.blocks[0].data.showBothThemes).toBe(true);
    expect(both.blocks[0].data.unknown).toEqual(image.data.unknown);
    expect(previous.blocks[0]).toEqual(image);
  });
});
