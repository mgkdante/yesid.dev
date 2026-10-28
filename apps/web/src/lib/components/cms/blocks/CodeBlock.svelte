<!--
  CodeBlock.svelte renders Editor.js `code` blocks.
  Highlighting happens SERVER-SIDE ($lib/server/code-highlights → Shiki):
  loads pass a block-id-keyed map down through BlockRenderer, and this
  component consumes its entry via `highlightedHtml`. Without an entry the
  package CodeBlock shows plain text — never import the Shiki chain here, that is
  exactly the ~300KB gz client regression this replaced.
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
		failed: resolveLocale(codeChrome.errorLabel, locale),
	};
	const parsed = $derived(parseCodeFence(data.code));
</script>

{#snippet highlighted()}
	{@html highlightedHtml}
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
