import { describe, expect, it } from 'vitest';
import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
import { collectProjectImages, collectProjectGalleryImages } from './project-images';

describe('project story image collection', () => {
	it('deduplicates file UUIDs across editor IDs and asset URLs without losing metadata or mutating the story', () => {
		const controls = '1e736cd2-dd12-40ed-8175-4483538b66e1';
		const light = '774906cc-920c-4455-a4cc-6e5a5be057d5';
		const sections = 'dc0500ef-ead8-4403-9625-b22e39ab348a';
		const image = (id: string, fileId: string, caption: string): ImageBlock => ({
			id, type: 'image', data: { file: { fileId, fileURL: '', url: `/assets/${fileId}` }, caption, withBorder: true, withBackground: false, stretched: false },
		});
		const first = image('same-editor-id', controls, 'Authored caption');
		const repeated = image('different-editor-id', '', 'Later caption');
		repeated.data.file.url = `https://cms.yesid.dev/assets/${controls}?key=card-600`;
		repeated.data.variants = { light: { fileId: light, fileURL: '', url: `/assets/${light}` } };
		const docs: BlockEditorDoc[] = [
			{ time: 0, version: '2.31.2', blocks: [first] },
			{ time: 0, version: '2.31.2', blocks: [repeated, image('same-editor-id', sections, 'Another image')] },
		];
		const before = structuredClone(docs);
		const collected = collectProjectImages(docs);
		expect(collected).toHaveLength(2);
		expect(collected[0]!.data).toMatchObject({ file: { fileId: controls }, caption: 'Authored caption', variants: { light: { fileId: light } } });
		expect(new Set(collected.map((block) => block.id)).size).toBe(2);
		expect(docs).toEqual(before);
	});

	it('keeps authored document order, deduplicates URL-only images and ignores empty files', () => {
		const image = (url: string, caption = ''): ImageBlock => ({
			id: 'local-editor-id', type: 'image', data: {
				file: { fileId: '', fileURL: '', url }, caption,
				withBorder: false, withBackground: false, stretched: false,
			},
		});
		const docs: BlockEditorDoc[] = [
			{ time: 0, version: '2', blocks: [image('/first.png'), image('')] },
			{ time: 0, version: '2', blocks: [image('/second.png', 'Second'), image('/first.png', 'First')] },
		];
		expect(collectProjectImages(docs).map((image) => [image.data.file.url, image.data.caption])).toEqual([
			['/first.png', 'First'], ['/second.png', 'Second'],
		]);
	});
});


describe('project gallery captures', () => {
 it('expands paired captures in authored order and keeps unpaired images once', () => {
  const image = (id: string): ImageBlock => ({ id, type: 'image', data: {
   file: { fileId: id, fileURL: '', url: `/${id}.png` }, caption: id,
   withBorder: false, withBackground: false, stretched: false,
  } });
  const paired = image('paired');
  paired.data.variants = { light: { fileId: 'light', fileURL: '', url: '/light.png', width: 800, height: 600 } };
  const single = image('single');
  const docs: BlockEditorDoc[] = [{ time: 0, version: '2', blocks: [paired, single, paired] }];
  const before = structuredClone(docs);
  const items = collectProjectGalleryImages(docs);
  expect(items.map(item => [item.data.file.fileId, item.captureTheme, item.data.caption])).toEqual([
   ['paired', 'dark', 'paired'], ['light', 'light', 'paired'], ['single', undefined, 'single'],
  ]);
  expect(items[1]?.data.file).toMatchObject({ width: 800, height: 600 });
  expect(new Set(items.map(item => item.id)).size).toBe(3);
  expect(docs).toEqual(before);
 });
});

 it('deduplicates identical pairs across sections while retaining shared dark assets with distinct light captures', () => {
  const pair = (light: string): ImageBlock => ({ id: 'local', type: 'image', data: {
   file: { fileId: 'dark', fileURL: '', url: '/dark.png' },
   variants: { light: { fileId: light, fileURL: '', url: `/${light}.png` } },
   caption: light, withBorder: false, withBackground: false, stretched: false,
  } });
  const docs: BlockEditorDoc[] = ['l1', 'l1', 'l2', 'l2'].map(light => ({ time: 0, version: '2', blocks: [pair(light)] }));
  const images = collectProjectGalleryImages(docs);
  expect(images.map(image => [image.data.file.fileId, image.captureTheme])).toEqual([
   ['dark', 'dark'], ['l1', 'light'], ['dark', 'dark'], ['l2', 'light'],
  ]);
  expect(new Set(images.map(image => image.id)).size).toBe(4);
 });
