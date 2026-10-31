<!--
  Paragraph.svelte — renders Editor.js `paragraph` block.
  AM2: data.text is HTML (inline marks embedded). Render via {@html}.
-->
<script lang="ts">
	import type { ParagraphBlock } from '@repo/shared';
	import { escapeHtml } from '#lib/utils/code-fences.ts';
	import { parseYouTubeParagraph } from '#lib/utils/youtube.ts';
	import YouTubeVideo from './YouTubeVideo.svelte';

	let { data }: { data: ParagraphBlock['data'] } = $props();

	const renderedText = $derived(renderInlineCodeSpans(data.text));
	const video = $derived(parseYouTubeParagraph(data.text));

	function renderInlineCodeSpans(html: string): string {
		return html
			.split(/(<[^>]+>)/g)
			.map((part) => {
				if (part.startsWith('<') && part.endsWith('>')) return part;
				return part.replace(/`([^`]+)`/g, (_match, value: string) => `<code>${escapeHtml(value)}</code>`);
			})
			.join('');
	}
</script>

{#if video}
	<YouTubeVideo {video} />
{:else}
	<p>{@html renderedText}</p>
{/if}
