<script lang="ts">
	import type { SchemaOrgNode } from '$lib/schemas/seo';
	import { serializeJsonLd } from '$lib/utils/json-ld-serialize';

	let { nodes }: { nodes: readonly SchemaOrgNode[] } = $props();

	const serialized = $derived(serializeJsonLd(nodes));
</script>

<svelte:head>
	{#if nodes.length > 0}
		{@html `<script type="application/ld+json">${serialized}</script>`}
	{/if}
</svelte:head>
