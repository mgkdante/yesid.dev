<!--
  Styled wrapper for rendered Block Editor blog content.
  Provides typography styles for headings, code blocks, blockquotes, lists, links.
  Editorial reading layout — no card frame, content breathes freely.
  Features: heading anchor links on hover. Code copy buttons are owned by CodeBlock.svelte.
-->
<script lang="ts">
	let {
		accentColor = 'var(--primary)',
		children
	}: {
		accentColor?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<!-- Blog content card — matches work detail structure.
     go2/w4: prose centers inside the card (prose-dark caps at 72ch; the card
     itself is capped + centered by BlogDetailPage's .content-column). -->
<div class="mt-8 min-w-0 overflow-x-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-6 md:p-8" data-testid="blog-content">
	<div class="blog-content prose-dark mx-auto" style="--blog-accent: {accentColor};">
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
</style>
