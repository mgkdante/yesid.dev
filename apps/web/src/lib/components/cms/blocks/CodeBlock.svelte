<!--
  CodeBlock.svelte — renders Editor.js `code` block.
  AM3: no language hint. Plain <pre><code>{data.code}</code></pre> with copy button.
  Svelte's default {expr} interpolation escapes HTML — XSS-safe by construction.
-->
<script lang="ts">
	import type { CodeBlock } from '@repo/shared';
	import { resolveLocale } from '$lib/utils/locale';
	import { blogDetailContent } from '$lib/content/blog';

	let { data }: { data: CodeBlock['data'] } = $props();

	const copyLabel = resolveLocale(blogDetailContent.code.copyLabel, 'en');
	const copyAria = resolveLocale(blogDetailContent.code.copyAria, 'en');
	const errorLabel = resolveLocale(blogDetailContent.code.errorLabel, 'en');

	let buttonLabel = $state(copyLabel);
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(data.code);
			buttonLabel = '✓';
		} catch {
			buttonLabel = errorLabel;
		}
		if (resetTimeout) clearTimeout(resetTimeout);
		resetTimeout = setTimeout(() => { buttonLabel = copyLabel; }, 2000);
	}
</script>

<pre><code>{data.code}</code><button class="copy-btn" onclick={copyToClipboard} aria-label={copyAria}>{buttonLabel}</button></pre>

<style>
	pre { position: relative; }
	.copy-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-family: var(--font-body);
		color: var(--muted-foreground);
		background: var(--card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease-default);
	}
	pre:hover .copy-btn { opacity: 1; }
	.copy-btn:hover { color: var(--foreground); background: var(--popover); }
</style>
