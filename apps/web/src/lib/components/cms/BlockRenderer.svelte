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
	import ImageBlock from './blocks/ImageBlock.svelte';

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
</script>

{#snippet renderBlock(block: BlockEditorBlock)}
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
		<ImageBlock data={block.data} />
	{/if}
{/snippet}

{#each groups as group (group.blocks[0].id)}
	{#if group.kind === 'row'}
		<div role="list" data-image-layout="row" class="image-row" style={`--columns: ${Math.min(group.blocks.length, 3)}`}>
			{#each group.blocks as block (block.id)}
				<div role="listitem">{@render renderBlock(block)}</div>
			{/each}
		</div>
	{:else if group.kind === 'beside'}
		{@const image = group.blocks[0]}
		<div data-image-layout="beside" class="image-beside" class:portrait={image.type === 'image' && (image.data.file.height ?? 0) > (image.data.file.width ?? Infinity)}>
			{#each group.blocks as block (block.id)}
				<div>{@render renderBlock(block)}</div>
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
