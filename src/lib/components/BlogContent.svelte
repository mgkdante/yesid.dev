<!--
  Styled wrapper for rendered markdown blog content.
  Provides typography styles for headings, code blocks, blockquotes, lists, links.
  Editorial reading layout — no card frame, content breathes freely.
  Features: heading anchor links on hover, code copy buttons on pre blocks.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let {
		accentColor = '#E07800',
		children
	}: {
		accentColor?: string;
		children: import('svelte').Snippet;
	} = $props();

	let contentEl: HTMLDivElement;

	onMount(() => {
		if (!contentEl) return;

		// Add copy buttons to all <pre> elements for code block clipboard support
		const preElements = contentEl.querySelectorAll('pre');

		preElements.forEach((pre) => {
			// Ensure pre is positioned so the absolute button works
			pre.style.position = 'relative';

			const btn = document.createElement('button');
			btn.className = 'copy-btn';
			btn.textContent = 'Copy';
			btn.setAttribute('aria-label', 'Copy code to clipboard');

			btn.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				if (!code) return;

				try {
					await navigator.clipboard.writeText(code.textContent ?? '');
					btn.textContent = '\u2713';
					setTimeout(() => {
						btn.textContent = 'Copy';
					}, 2000);
				} catch {
					// Clipboard API may fail in insecure contexts — fail silently
					btn.textContent = 'Error';
					setTimeout(() => {
						btn.textContent = 'Copy';
					}, 2000);
				}
			});

			pre.appendChild(btn);
		});
	});
</script>

<!-- Editorial reading layout — no card frame, content breathes freely -->
<div class="mt-8" data-testid="blog-content">
	<div class="blog-content" style="--blog-accent: {accentColor};" bind:this={contentEl}>
		{@render children()}
	</div>
</div>

<style>
	/* Prose container — comfortable reading width */
	.blog-content {
		max-width: 72ch;
		font-size: 0.9375rem;
		line-height: 1.8;
		color: #ccc;
	}

	/* Headings */
	.blog-content :global(h1),
	.blog-content :global(h2),
	.blog-content :global(h3),
	.blog-content :global(h4) {
		font-family: 'Inter', sans-serif;
		color: #f5f5f0;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	.blog-content :global(h1) { font-size: 1.5rem; font-weight: 700; }
	.blog-content :global(h2) { font-size: 1.25rem; font-weight: 700; }
	.blog-content :global(h3) { font-size: 1.1rem; font-weight: 600; }
	.blog-content :global(h4) { font-size: 1rem; font-weight: 600; }

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
		transition: opacity 0.2s ease, transform 0.2s ease;
	}
	.blog-content :global(h2):hover::before,
	.blog-content :global(h3):hover::before {
		opacity: 0.6;
		transform: translateX(0);
	}

	/* Paragraphs */
	.blog-content :global(p) {
		margin-bottom: 1rem;
	}

	/* Bold */
	.blog-content :global(strong) {
		color: #f5f5f0;
		font-weight: 600;
	}

	/* Links */
	.blog-content :global(a) {
		color: var(--blog-accent);
		text-decoration: none;
	}
	.blog-content :global(a:hover) {
		text-decoration: underline;
	}

	/* Fenced code blocks — slightly darker than card bg for contrast */
	.blog-content :global(pre) {
		background: #0f0f0f;
		border: 1px solid #2a2a2a;
		border-radius: 0.375rem;
		padding: 0.875rem 1rem;
		overflow-x: auto;
		margin: 1rem 0;
		font-size: 0.8125rem;
		line-height: 1.6;
	}
	.blog-content :global(pre code) {
		font-family: 'JetBrains Mono', monospace;
		color: #E07800;
		background: none;
		padding: 0;
		border: none;
		font-size: inherit;
	}

	/* Code copy button — hidden by default, shown on pre:hover */
	.blog-content :global(.copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-family: 'Inter', sans-serif;
		color: #999;
		background: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 0.25rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.blog-content :global(pre:hover .copy-btn) {
		opacity: 1;
	}
	.blog-content :global(.copy-btn:hover) {
		color: #f5f5f0;
		background: #2a2a2a;
	}

	/* Inline code */
	.blog-content :global(code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85em;
		color: var(--blog-accent);
		background: #1a1a1a;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid #2a2a2a;
	}

	/* Blockquotes */
	.blog-content :global(blockquote) {
		border-left: 3px solid var(--blog-accent);
		background: #141414;
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0.75rem 1rem;
		margin: 1rem 0;
	}
	.blog-content :global(blockquote p) {
		margin-bottom: 0;
		font-style: italic;
		color: #ccc;
	}

	/* Lists */
	.blog-content :global(ul),
	.blog-content :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}
	.blog-content :global(li) {
		margin-bottom: 0.375rem;
	}
	.blog-content :global(ul) { list-style: disc; }
	.blog-content :global(ol) { list-style: decimal; }

	/* Horizontal rules */
	.blog-content :global(hr) {
		border: none;
		border-top: 1px solid #2a2a2a;
		margin: 2rem 0;
	}

	/* Images */
	.blog-content :global(img) {
		max-width: 100%;
		border-radius: 0.375rem;
		margin: 1rem 0;
	}
</style>
