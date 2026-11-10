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
    const copy = pasteBlocks(previous, [image], 'p');
    expect(roundTrip(copy, { blocks: [{ ...stock, id: copy.blocks[2].id }] }).blocks[0].data.variants).toEqual(image.data.variants);
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
    const file = imageFile({ id: 'uuid', type: 'image/png', filename_download: 'test.light.png', width: 10, height: 20 }, '/');
    const paired = setImageControl(removed, 'a', 'light', file);
    const both = setImageControl(paired, 'a', 'showBothThemes', true);
    expect(both.blocks[0].data.variants.light).toMatchObject({ fileId: 'uuid', fileURL: '/files/uuid', url: '/assets/uuid', width: 10, height: 20 });
    expect(both.blocks[0].data.showBothThemes).toBe(true);
    expect(both.blocks[0].data.unknown).toEqual(image.data.unknown);
    expect(previous.blocks[0]).toEqual(image);
  });
});
// @ts-expect-error Independently built browser JS package.
import { normalizeIds, pasteBlocks, componentError } from '../extensions/article-editor/src/data.js';
import { BlockEditorDocSchema } from '../../../packages/shared/src/types/blocks';

test('duplicate ids are normalized before editing and controls target only their image', () => {
  const second = { ...image, data: { ...image.data, layout: 'row', variants: { light: { fileId: 'other' } } } };
  const doc = normalizeIds({ blocks: [image, second, paragraph] });
  expect(new Set(doc.blocks.map((b: any) => b.id)).size).toBe(3);
  const saved = roundTrip(doc, { blocks: doc.blocks.map((b: any) => b.type === 'image' ? { ...b, data: stock.data } : b) });
  expect(saved.blocks[0].data.variants).toEqual(image.data.variants);
  expect(saved.blocks[1].data.variants).toEqual(second.data.variants);
  const edited = setImageControl(saved, doc.blocks[1].id, 'layout', 'beside');
  expect(edited.blocks[0].data).toEqual(saved.blocks[0].data);
  expect(edited.blocks[0].id).not.toBe(edited.blocks[1].id);
  expect(edited.blocks[1].data.layout).toBe('beside');
  expect(() => roundTrip({ blocks: [image, image] }, { blocks: [stock] })).toThrow();
});

test('clipboard copies retain per-block metadata with unique ids even for the same file', () => {
  const other = { ...image, id: 'b', data: { ...image.data, layout: 'row', showBothThemes: false } };
  const copied = pasteBlocks({ blocks: [image, other, paragraph] }, [image, other], 'p');
  expect(new Set(copied.blocks.map((b: any) => b.id)).size).toBe(5);
  expect(copied.blocks[3].data).toEqual(image.data);
  expect(copied.blocks[4].data).toEqual(other.data);
  const saved = roundTrip(copied, { blocks: copied.blocks.map((b: any) => b.type === 'image' ? { ...b, data: stock.data } : b) });
  expect(saved.blocks[3].data.variants).toEqual(image.data.variants);
  expect(saved.blocks[4].data.layout).toBe('row');
  expect(saved.blocks[4].data.showBothThemes).toBe(false);
});

test('picker normalizes SQLite filesize and nullable optional fields into the shared document contract', () => {
  const file = imageFile({ id: 'light', type: 'image/png', width: 10, height: 20, filesize: 123, title: null, filename_download: 'light.png' }, '/');
  expect(file.size).toBe('123');
  expect(file.title).toBeUndefined();
  const doc = setImageControl({ time: 0, version: '2', blocks: [{ ...image, data: { ...image.data, file: { fileId: 'dark', fileURL: '', url: '' }, withBorder: false, withBackground: false, stretched: false } }] }, 'a', 'light', file);
  expect(BlockEditorDocSchema.safeParse(doc).success).toBe(true);
});

test('picker rejects SVG and raster files with unusable dimensions', () => {
  for (const fields of [{ type: 'image/svg+xml', width: null, height: null }, { type: 'image/png', width: null, height: 20 }, { type: 'image/png', width: 0, height: 20 }]) {
    expect(() => imageFile({ id: 'bad', ...fields }, '/')).toThrow();
  }
});

test('missing Directus components fail visibly instead of mounting unresolved tags', () => {
  expect(componentError('interface-input-block-editor', {})).toContain('unavailable');
  expect(componentError({}, 'v-upload')).toContain('unavailable');
  expect(componentError({}, {})).toBe('');
});
