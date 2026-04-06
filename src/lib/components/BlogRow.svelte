<!--
  Single blog post row in the listing page.
  Horizontal layout: SVG icon | title + full excerpt + tags + date.
  Designed for visual impact — metro-themed with animated SVG illustrations.
-->
<script lang="ts">
	import type { BlogPost } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import BlogSvgIcon from './BlogSvgIcon.svelte';

	let {
		post,
		svgContent = '',
		accentColor = '#E07800',
		index = 0
	}: {
		post: BlogPost;
		svgContent?: string;
		accentColor?: string;
		index?: number;
	} = $props();

	let cardHovered = $state(false);
</script>

<a
	href={post.url}
	target={post.external ? '_blank' : undefined}
	rel={post.external ? 'noopener noreferrer' : undefined}
	class="group block"
	data-testid="blog-row"
	use:boop={{ scale: 1.015, timing: 300 }}
	use:reveal={{ delay: stagger(index, 80) }}
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
>
	<article
		class="blog-row relative flex items-start gap-4 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]/80 p-4 backdrop-blur-sm transition-all duration-300 md:gap-5 md:p-5"
		style="--accent: {accentColor};"
	>
		<!-- Subtle glow on hover -->
		<div
			class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style="background: radial-gradient(ellipse at 0% 50%, color-mix(in srgb, {accentColor} 8%, transparent), transparent 70%);"
		></div>

		<!-- SVG icon -->
		{#if svgContent}
			<div class="relative z-10 shrink-0">
				<BlogSvgIcon
					{svgContent}
					animation={post.animation}
					size={48}
					trigger="scroll"
					hovered={cardHovered}
				/>
			</div>
		{/if}

		<!-- Content -->
		<div class="relative z-10 min-w-0 flex-1">
			<h3 class="text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent)] md:text-base">
				{resolveLocale(post.title, 'en')}
			</h3>
			<p class="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)] md:text-sm">
				{resolveLocale(post.excerpt, 'en')}
			</p>
			<div class="mt-3 flex flex-wrap items-center gap-1.5">
				{#each post.tags as tag}
					<span
						class="rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-200 md:text-xs"
						style="border-color: color-mix(in srgb, {accentColor} 60%, transparent); color: {accentColor};"
						use:magnetic={{ strength: 2, radius: 30 }}
					>
						{tag}
					</span>
				{/each}
				<span class="ml-auto font-mono text-[10px] text-[var(--text-muted)] md:text-xs">
					{post.date}
				</span>
			</div>
		</div>
	</article>
</a>

<style>
	.blog-row:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
