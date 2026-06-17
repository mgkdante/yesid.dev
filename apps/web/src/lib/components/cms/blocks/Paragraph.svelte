<!--
  Paragraph.svelte — renders Editor.js `paragraph` block.
  AM2: data.text is HTML (inline marks embedded). Render via {@html}.
-->
<script lang="ts">
	import type { ParagraphBlock } from '@repo/shared';

	let { data }: { data: ParagraphBlock['data'] } = $props();

	const renderedText = $derived(renderInlineCodeSpans(data.text));

	function renderInlineCodeSpans(html: string): string {
		return html
			.split(/(<[^>]+>)/g)
			.map((part) => {
				if (part.startsWith('<') && part.endsWith('>')) return part;
				return part.replace(/`([^`]+)`/g, (_match, value: string) => `<code>${escapeHtml(value)}</code>`);
			})
			.join('');
	}

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
</script>

<p>{@html renderedText}</p>
