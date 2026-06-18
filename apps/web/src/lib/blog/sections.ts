import type { BlockEditorBlock, BlockEditorDoc } from '@repo/shared';
import { kebabSlug, stripHtml } from '@repo/shared';

export interface BlogBodySection {
	id: string;
	title: string;
	anchor: string;
	doc: BlockEditorDoc;
}

function nextHeadingAnchor(title: string, counts: Map<string, number>): string {
	const base = kebabSlug(stripHtml(title)) || 'section';
	const seen = counts.get(base) ?? 0;
	counts.set(base, seen + 1);
	return seen === 0 ? base : `${base}-${seen + 1}`;
}

function sectionDoc(source: BlockEditorDoc, blocks: BlockEditorBlock[]): BlockEditorDoc {
	return {
		time: source.time,
		version: source.version,
		blocks,
	};
}

export function sectionizeBlogBody(
	doc: BlockEditorDoc,
	fallbackTitle = 'Article',
): BlogBodySection[] {
	const headingCounts = new Map<string, number>();
	const leadingBlocks: BlockEditorBlock[] = [];
	const sections: BlogBodySection[] = [];
	let current: BlogBodySection | null = null;

	for (const block of doc.blocks) {
		if (block.type === 'header' && block.data.level === 2) {
			current = {
				id: `blog-section-${sections.length}`,
				title: stripHtml(block.data.text),
				anchor: nextHeadingAnchor(block.data.text, headingCounts),
				doc: sectionDoc(doc, sections.length === 0 ? [...leadingBlocks] : []),
			};
			sections.push(current);
			continue;
		}

		if (current) current.doc.blocks.push(block);
		else leadingBlocks.push(block);
	}

	if (sections.length === 0) {
		return [
			{
				id: 'blog-section-0',
				title: fallbackTitle,
				anchor: 'blog-article',
				doc: sectionDoc(doc, [...doc.blocks]),
			},
		];
	}

	return sections;
}
