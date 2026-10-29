<!--
  Editor.js `code` blocks and README fences. Loads highlight on the server (`$lib/server/code-highlights`)
  and pass the markup as `highlightedHtml`; without it the package CodeBlock shows plain text.
  Mermaid fences render as diagrams.
-->
<script lang="ts">
	import type { CodeBlock as CodeBlockData } from '@repo/shared';
	import { CodeBlock } from '@yesid/ui/brand';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { parseCodeFence } from '#lib/utils/code-fences.ts';
	import MermaidDiagram from './MermaidDiagram.svelte';

	const locale = getLocale();
	import { siteLabels } from '#lib/content/index.ts';

	let {
		data,
		highlightedHtml,
	}: { data: CodeBlockData['data']; highlightedHtml?: string } = $props();

	const codeChrome = siteLabels.blogChrome.detail.code;
	const copy = {
		label: resolveLocale(codeChrome.copyLabel, locale),
		ariaLabel: resolveLocale(codeChrome.copyAria, locale),
		copied: resolveLocale(codeChrome.copiedLabel, locale),
		failed: resolveLocale(codeChrome.errorLabel, locale),
	};
	const parsed = $derived(parseCodeFence(data.code));
</script>

{#snippet highlighted()}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<pre tabindex="0"><code>{@html highlightedHtml}</code></pre>
{/snippet}

{#if parsed.kind === 'mermaid'}
	<MermaidDiagram code={parsed.body} />
{:else}
	<CodeBlock
		code={parsed.body}
		title={resolveLocale(codeChrome.title, locale)}
		language={parsed.language ? parsed.normalizedLanguage : undefined}
		{copy}
		children={highlightedHtml ? highlighted : undefined}
	/>
{/if}
