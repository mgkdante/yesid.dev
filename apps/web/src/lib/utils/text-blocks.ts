export type TextBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

const LIST_ITEM = /^\s*-\s+/;

/** Plain CMS text to blocks: consecutive "- " lines form one list, every other non-empty line is a paragraph. */
export function toTextBlocks(text: string): TextBlock[] {
	const blocks: TextBlock[] = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		if (LIST_ITEM.test(line)) {
			const item = line.replace(LIST_ITEM, '');
			const last = blocks.at(-1);
			if (last?.kind === 'list') last.items.push(item);
			else blocks.push({ kind: 'list', items: [item] });
		} else {
			blocks.push({ kind: 'paragraph', text: line });
		}
	}
	return blocks;
}
