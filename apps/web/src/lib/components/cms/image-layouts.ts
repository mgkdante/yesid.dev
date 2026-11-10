import type { BlockEditorBlock } from '@repo/shared';

type Group = { kind: 'single' | 'row' | 'beside'; blocks: BlockEditorBlock[] };

/** Consume only explicit adjacent layouts, retaining source and reading order. */
export function groupImageLayouts(blocks: readonly BlockEditorBlock[]): Group[] {
	const groups: Group[] = [];
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (block.type === 'image' && block.data.layout === 'row') {
			const run = [block];
			while (blocks[i + 1]?.type === 'image') {
				const next = blocks[i + 1];
				if (next.type !== 'image' || next.data.layout !== 'row') break;
				run.push(next);
				i++;
			}
			groups.push({ kind: 'row', blocks: run });
		} else if (block.type === 'image' && block.data.layout === 'beside' &&
			['table', 'paragraph', 'nestedlist'].includes(blocks[i + 1]?.type)) {
			groups.push({ kind: 'beside', blocks: [block, blocks[++i]] });
		} else groups.push({ kind: 'single', blocks: [block] });
	}
	return groups;
}
