<!--
  Styled wrapper for rendered markdown blog content.
  Provides typography styles for headings, code blocks, blockquotes, lists, links.
-->
<script lang="ts">
	let {
		accentColor = '#E07800',
		children
	}: {
		accentColor?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="blog-content mt-8" style="--blog-accent: {accentColor};" data-testid="blog-content">
	{@render children()}
</div>

<style>
	/* Prose container — comfortable reading width */
	.blog-content {
		max-width: 65ch;
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

	/* Fenced code blocks */
	.blog-content :global(pre) {
		background: #141414;
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
