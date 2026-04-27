<!--
  NestedList.svelte — renders Editor.js `nestedlist` block.
  Single block type (not separate ul/ol). Recursive via children rendering.
  AM2: item.content is HTML — render via {@html}.
-->
<script lang="ts">
	import type { NestedListItem } from '@repo/shared';
	import Self from './NestedList.svelte';

	let {
		style,
		items,
	}: {
		style: 'unordered' | 'ordered';
		items: NestedListItem[];
	} = $props();
</script>

{#if style === 'ordered'}
	<ol>
		{#each items as item, i (i)}
			<li>
				{@html item.content}
				{#if item.items.length > 0}
					<Self style="ordered" items={item.items} />
				{/if}
			</li>
		{/each}
	</ol>
{:else}
	<ul>
		{#each items as item, i (i)}
			<li>
				{@html item.content}
				{#if item.items.length > 0}
					<Self style="unordered" items={item.items} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}
