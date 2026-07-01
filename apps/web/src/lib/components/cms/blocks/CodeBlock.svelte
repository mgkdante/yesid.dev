<!--
  CodeBlock.svelte renders Editor.js `code` blocks.
  Highlighting happens SERVER-SIDE ($lib/server/code-highlights → Shiki):
  loads pass a block-id-keyed map down through BlockRenderer, and this
  component consumes its entry via `highlightedHtml`. Without an entry it
  renders a plain escaped <pre> — never import the Shiki chain here, that is
  exactly the ~300KB gz client regression this replaced.
  Mermaid fences render as diagrams.
-->
<script lang="ts">
	import type { CodeBlock } from '@repo/shared';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { parseCodeFence, renderPlainCodeHtml } from '$lib/utils/code-fences';
	import { TerminalChrome } from '$lib/components/brand';
	import MermaidDiagram from './MermaidDiagram.svelte';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';

	let {
		data,
		highlightedHtml,
	}: { data: CodeBlock['data']; highlightedHtml?: string } = $props();

	const codeChrome = siteLabels.blogChrome.detail.code;
	const codeTitle = resolveLocale(codeChrome.title, locale);
	const copyLabel = resolveLocale(codeChrome.copyLabel, locale);
	const copyAria = resolveLocale(codeChrome.copyAria, locale);
	const errorLabel = resolveLocale(codeChrome.errorLabel, locale);

	let buttonLabel = $state(copyLabel);
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;
	const parsed = $derived(parseCodeFence(data.code));
	const language = $derived(parsed.kind === 'code' && parsed.language ? parsed.normalizedLanguage : undefined);
	const codeHtml = $derived(
		parsed.kind === 'code' ? (highlightedHtml ?? renderPlainCodeHtml(parsed.body)) : '',
	);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(parsed.body);
			buttonLabel = '✓';
		} catch {
			buttonLabel = errorLabel;
		}
		if (resetTimeout) clearTimeout(resetTimeout);
		resetTimeout = setTimeout(() => { buttonLabel = copyLabel; }, 2000);
	}
</script>

{#if parsed.kind === 'mermaid'}
	<MermaidDiagram code={parsed.body} />
{:else}
	<TerminalChrome
		title={codeTitle}
		tag={language}
		tagTestId={language ? 'code-block-language' : undefined}
		noPadding
		class="terminal-code"
		data-code-language={language}
		data-code-copy={parsed.body}
	>
		{#snippet actions()}
			<button
				type="button"
				class="terminal-code-copy"
				onclick={copyToClipboard}
				aria-label={copyAria}
			>
				{buttonLabel}
			</button>
		{/snippet}
		<div class="terminal-code-body" data-language={language}>
			{@html codeHtml}
		</div>
	</TerminalChrome>
{/if}
