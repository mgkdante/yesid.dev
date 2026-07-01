<!--
  BlockRenderer.svelte — top-level dispatch for Editor.js Block Editor docs.
  Slice 18 18f Phase 10. Reused by 18g (tech-stack), 18i (M2A blocks),
  and #41 (projects.description + sections.content).

  Iterates doc.blocks; dispatches on block.type. Per AM1: Editor.js shape.
-->
<script lang="ts">
	import type { BlockEditorDoc } from '@repo/shared';
	import Heading from './blocks/Heading.svelte';
	import Paragraph from './blocks/Paragraph.svelte';
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
</script>

{#each doc.blocks as block (block.id)}
	{#if block.type === 'header'}
		<Heading data={block.data} />
	{:else if block.type === 'paragraph'}
		<Paragraph data={block.data} />
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
{/each}
