<!--
  CodeBlock.svelte renders Editor.js `code` blocks.
  Fenced languages are highlighted with Shiki inside the shared TerminalChrome.
  Mermaid fences render as diagrams.
-->
<script lang="ts">
	import type { CodeBlock } from '@repo/shared';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { parseCodeFence } from '$lib/utils/code-fences';
	import { highlightCodeHtml } from '$lib/utils/syntax-highlight';
	import { TerminalChrome } from '$lib/components/brand';
	import MermaidDiagram from './MermaidDiagram.svelte';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';

	let { data }: { data: CodeBlock['data'] } = $props();

	const codeChrome = siteLabels.blogChrome.detail.code;
	const copyLabel = resolveLocale(codeChrome.copyLabel, locale);
	const copyAria = resolveLocale(codeChrome.copyAria, locale);
	const errorLabel = resolveLocale(codeChrome.errorLabel, locale);

	let buttonLabel = $state(copyLabel);
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;
	const parsed = $derived(parseCodeFence(data.code));
	const language = $derived(parsed.kind === 'code' && parsed.language ? parsed.normalizedLanguage : undefined);
	const highlightedHtml = $derived(
		parsed.kind === 'code' ? highlightCodeHtml(parsed.body, parsed.normalizedLanguage) : '',
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
		title="code"
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
			{@html highlightedHtml}
		</div>
	</TerminalChrome>
{/if}
