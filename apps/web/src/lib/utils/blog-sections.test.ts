import { describe, expect, it } from 'vitest';
import type { BlockEditorDoc } from '@repo/shared';
import { sectionizeBlogBody } from '$lib/blog/sections';

const baseDoc = (blocks: BlockEditorDoc['blocks']): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks,
});

describe('sectionizeBlogBody', () => {
	it('turns h2 blocks into card titles and keeps leading prose in the first section', () => {
		const doc = baseDoc([
			{ id: 'lead', type: 'paragraph', data: { text: 'Lead paragraph before the first section.' } },
			{ id: 'h-one', type: 'header', data: { text: 'First Section', level: 2 } },
			{ id: 'p-one', type: 'paragraph', data: { text: 'First section body.' } },
			{ id: 'h-three', type: 'header', data: { text: 'Nested point', level: 3 } },
			{ id: 'h-two', type: 'header', data: { text: 'Second Section', level: 2 } },
			{ id: 'p-two', type: 'paragraph', data: { text: 'Second section body.' } },
		]);

		const sections = sectionizeBlogBody(doc);

		expect(sections).toHaveLength(2);
		expect(sections[0]).toMatchObject({
			id: 'blog-section-0',
			title: 'First Section',
			anchor: 'first-section',
		});
		expect(sections[0].doc.blocks.map((block) => block.id)).toEqual(['lead', 'p-one', 'h-three']);
		expect(sections[1]).toMatchObject({
			id: 'blog-section-1',
			title: 'Second Section',
			anchor: 'second-section',
		});
		expect(sections[1].doc.blocks.map((block) => block.id)).toEqual(['p-two']);
	});

	it('falls back to one article section when the post has no h2 headings', () => {
		const doc = baseDoc([
			{ id: 'p-one', type: 'paragraph', data: { text: 'Only prose here.' } },
			{ id: 'h-three', type: 'header', data: { text: 'Small heading', level: 3 } },
		]);

		const sections = sectionizeBlogBody(doc, 'Article');

		expect(sections).toHaveLength(1);
		expect(sections[0]).toMatchObject({
			id: 'blog-section-0',
			title: 'Article',
			anchor: 'blog-article',
		});
		expect(sections[0].doc.blocks).toEqual(doc.blocks);
	});

	it('suffixes duplicate h2 anchors the same way the shared heading extractor does', () => {
		const doc = baseDoc([
			{ id: 'h-one', type: 'header', data: { text: 'Setup', level: 2 } },
			{ id: 'p-one', type: 'paragraph', data: { text: 'First setup.' } },
			{ id: 'h-two', type: 'header', data: { text: 'Setup', level: 2 } },
			{ id: 'p-two', type: 'paragraph', data: { text: 'Second setup.' } },
		]);

		const sections = sectionizeBlogBody(doc);

		expect(sections.map((section) => section.anchor)).toEqual(['setup', 'setup-2']);
	});
});
