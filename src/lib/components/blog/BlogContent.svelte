<!--
  Styled wrapper for rendered markdown blog content.
  Provides typography styles for headings, code blocks, blockquotes, lists, links.
  Editorial reading layout — no card frame, content breathes freely.
  Features: heading anchor links on hover, code copy buttons on pre blocks.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { blogDetailContent } from '$lib/content/blog';

	let {
		accentColor = 'var(--primary)',
		children
	}: {
		accentColor?: string;
		children: import('svelte').Snippet;
	} = $props();

	let contentEl: HTMLDivElement;

	const copyLabel = resolveLocale(blogDetailContent.code.copyLabel, 'en');
	const copyAria = resolveLocale(blogDetailContent.code.copyAria, 'en');
	const errorLabel = resolveLocale(blogDetailContent.code.errorLabel, 'en');

	onMount(() => {
		if (!contentEl) return;

		// Add copy buttons to all <pre> elements for code block clipboard support
		const preElements = contentEl.querySelectorAll('pre');

		preElements.forEach((pre) => {
			// Ensure pre is positioned so the absolute button works
			pre.style.position = 'relative';

			const btn = document.createElement('button');
			btn.className = 'copy-btn';
			btn.textContent = copyLabel;
			btn.setAttribute('aria-label', copyAria);

			btn.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				if (!code) return;

				try {
					await navigator.clipboard.writeText(code.textContent ?? '');
					btn.textContent = '\u2713';
					setTimeout(() => {
						btn.textContent = copyLabel;
					}, 2000);
				} catch {
					// Clipboard API may fail in insecure contexts — fail silently
					btn.textContent = errorLabel;
					setTimeout(() => {
						btn.textContent = copyLabel;
					}, 2000);
				}
			});

			pre.appendChild(btn);
		});
	});
</script>

<!-- Blog content card — matches work detail structure -->
<div class="mt-8 min-w-0 overflow-x-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-6 md:p-8" data-testid="blog-content">
	<div class="blog-content prose-dark" style="--blog-accent: {accentColor};" bind:this={contentEl}>
		{@render children()}
	</div>
</div>

<style>
	/* Accent color overrides — per-post accent instead of brand-primary */
	.blog-content :global(a) { color: var(--blog-accent); }
	.blog-content :global(code) { color: var(--blog-accent); }
	.blog-content :global(blockquote) { border-left-color: var(--blog-accent); }

	/* Heading anchor links — '#' slides in from the left on hover */
	.blog-content :global(h2),
	.blog-content :global(h3) {
		position: relative;
	}
	.blog-content :global(h2)::before,
	.blog-content :global(h3)::before {
		content: '#';
		position: absolute;
		right: 100%;
		margin-right: 0.5rem;
		color: var(--blog-accent);
		opacity: 0;
		transform: translateX(-4px);
		transition: opacity var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default);
	}
	.blog-content :global(h2):hover::before,
	.blog-content :global(h3):hover::before {
		opacity: var(--opacity-muted);
		transform: translateX(0);
	}

	/* Code copy button — hidden by default, shown on pre:hover */
	.blog-content :global(.copy-btn) {
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
	.blog-content :global(pre:hover .copy-btn) {
		opacity: 1;
	}
	.blog-content :global(.copy-btn:hover) {
		color: var(--foreground);
		background: var(--popover);
	}
</style>
