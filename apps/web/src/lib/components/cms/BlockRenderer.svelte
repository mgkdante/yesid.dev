<script lang="ts">
	import { groupImageLayouts } from './image-layouts';
	import type { BlockEditorBlock, BlockEditorDoc } from '@repo/shared';
	import Heading from './blocks/Heading.svelte';
	import Paragraph from './blocks/Paragraph.svelte';
	import Table from './blocks/Table.svelte';
	import NestedList from './blocks/NestedList.svelte';
	import CodeBlock from './blocks/CodeBlock.svelte';
	import Quote from './blocks/Quote.svelte';
	import Delimiter from './blocks/Delimiter.svelte';
	import ImageBlock, { ARTICLE_COLUMN } from './blocks/ImageBlock.svelte';

	let {
		doc,
		codeHighlights,
	}: {
		doc: BlockEditorDoc;
		/** block.id → server-highlighted HTML ($lib/server/code-highlights).
		 *  Absent entries render as plain escaped <pre> inside CodeBlock. */
		codeHighlights?: Readonly<Record<string, string>>;
	} = $props();
	const groups = $derived(groupImageLayouts(doc.blocks));
	const GRID_GAP = 24;
	const isPortrait = (block: BlockEditorBlock) =>
		block.type === 'image' && (block.data.file.height ?? 0) > (block.data.file.width ?? Infinity);
	/** Desktop column width for a row of n columns, or a beside layout's image column. */
	const rowSlot = (n: number) => Math.round((ARTICLE_COLUMN - GRID_GAP * (n - 1)) / n);
	const besideSlot = (block: BlockEditorBlock) =>
		Math.round((ARTICLE_COLUMN - GRID_GAP) * (isPortrait(block) ? 1 / 3 : 1 / 2));
</script>

{#snippet renderBlock(block: BlockEditorBlock, slot: number = ARTICLE_COLUMN)}
	{#if block.type === 'header'}
		<Heading data={block.data} />
	{:else if block.type === 'paragraph'}
		<Paragraph data={block.data} />
	{:else if block.type === 'table'}
		<Table data={block.data} />
	{:else if block.type === 'nestedlist'}
		<NestedList style={block.data.style} items={block.data.items} />
	{:else if block.type === 'code'}
		<CodeBlock data={block.data} highlightedHtml={codeHighlights?.[block.id]} />
	{:else if block.type === 'quote'}
		<Quote data={block.data} />
	{:else if block.type === 'delimiter'}
		<Delimiter />
	{:else if block.type === 'image'}
		<ImageBlock data={block.data} {slot} />
	{/if}
{/snippet}

{#each groups as group (group.blocks[0].id)}
	{#if group.kind === 'row'}
		<div role="list" data-image-layout="row" class="image-row" style={`--columns: ${Math.min(group.blocks.length, 3)}`}>
			{#each group.blocks as block (block.id)}
				<div role="listitem">{@render renderBlock(block, rowSlot(Math.min(group.blocks.length, 3)))}</div>
			{/each}
		</div>
	{:else if group.kind === 'beside'}
		{@const image = group.blocks[0]}
		<div data-image-layout="beside" class="image-beside" class:portrait={isPortrait(image)}>
			{#each group.blocks as block (block.id)}
				<div>{@render renderBlock(block, block === image ? besideSlot(image) : ARTICLE_COLUMN)}</div>
			{/each}
		</div>
	{:else}
		{@render renderBlock(group.blocks[0])}
	{/if}
{/each}

<style>
	.image-row, .image-beside { display: grid; gap: 1.5rem; min-width: 0; }
	.image-row > div, .image-beside > div { min-width: 0; overflow-wrap: anywhere; }
	@media (min-width: 768px) {
		.image-row { grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); }
		.image-beside { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.image-beside.portrait { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
	}
</style>
