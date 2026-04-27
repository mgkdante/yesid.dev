<!--
  Heading.svelte — renders Editor.js `header` block.
  AM2: data.text is HTML (inline marks embedded). Render via {@html}.
  Heading id is deterministic kebab-case slug derived from stripped text.
-->
<script lang="ts">
	import type { HeaderBlock } from '@repo/shared';
	import { kebabSlug, stripHtml } from '@repo/shared';

	let { data }: { data: HeaderBlock['data'] } = $props();

	const headingId = $derived(kebabSlug(stripHtml(data.text)));
</script>

{#if data.level === 1}
	<h1 id={headingId}>{@html data.text}</h1>
{:else if data.level === 2}
	<h2 id={headingId}>{@html data.text}</h2>
{:else if data.level === 3}
	<h3 id={headingId}>{@html data.text}</h3>
{:else if data.level === 4}
	<h4 id={headingId}>{@html data.text}</h4>
{:else if data.level === 5}
	<h5 id={headingId}>{@html data.text}</h5>
{:else}
	<h6 id={headingId}>{@html data.text}</h6>
{/if}
