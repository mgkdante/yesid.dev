<!--
  Paragraph.svelte — renders Editor.js `paragraph` block.
  AM2: data.text is HTML (inline marks embedded). Render via {@html}.
-->
<script lang="ts">
	import type { ParagraphBlock } from '@repo/shared';

	let { data }: { data: ParagraphBlock['data'] } = $props();
</script>

<p>{@html data.text}</p>
