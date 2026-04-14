<!--
  Blog detail page header: title + side SVG icon + tags + date + gradient divider.
  Category determines accent color (orange for professional, yellow for personal).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlogPost } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { Badge } from '$lib/components/ui/badge';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import { SvgIcon } from '$lib/components/brand';

	let {
		post,
		svgContent = '',
		accentColor = 'var(--primary)',
		readingTime = 0
	}: {
		post: BlogPost;
		svgContent?: string;
		accentColor?: string;
		readingTime?: number;
	} = $props();

	const labels = {
		backDispatches: { en: '\u2190 back to dispatches' },
		backPersonal: { en: '\u2190 back to personal corner' },
		minRead: { en: 'min read' }
	};

	let headerEl: HTMLDivElement;
	let backHref = $derived(
		post.category === 'personal' ? '/blog/personal' : '/blog'
	);
	let backLabel = $derived(
		post.category === 'personal'
			? resolveLocale(labels.backPersonal, 'en')
			: resolveLocale(labels.backDispatches, 'en')
	);

	onMount(() => {
		if (isPrefersReducedMotion() || !headerEl) return;
		registerGsapPlugins();

		// Entrance animation: title + meta fade in from left
		const titleEl = headerEl.querySelector('[data-animate="title"]');
		const metaEl = headerEl.querySelector('[data-animate="meta"]');
		if (titleEl) gsap.from(titleEl, { x: -20, opacity: 0, duration: 0.6, ease: 'power2.out' });
		if (metaEl) gsap.from(metaEl, { x: -20, opacity: 0, duration: 0.6, delay: 0.15, ease: 'power2.out' });
	});
</script>

<div bind:this={headerEl} data-testid="blog-detail-header">
	<!-- Back link -->
	<a
		href={backHref}
		class="mb-4 inline-block font-mono text-xs transition-colors hover:underline"
		style="color: {accentColor};"
		use:boop={{ scale: 1.05, timing: 200 }}
	>
		{backLabel}
	</a>

	<!-- Title + SVG row -->
	<div class="flex items-center gap-2 md:gap-3">
		<div class="min-w-0 flex-1">
			<h1
				data-animate="title"
				class="font-heading text-xl font-bold leading-tight text-[var(--foreground)] md:text-2xl lg:text-3xl"
			>
				{resolveLocale(post.title, 'en')}
			</h1>
			<div data-animate="meta" class="mt-2 flex flex-wrap items-center gap-1.5">
				{#each post.tags as tag}
					<Badge variant="tag-active" size="xs" style="border-color: {accentColor}30; background: {accentColor}15; color: {accentColor}">{tag}</Badge>
				{/each}
				<time datetime={post.date} class="font-mono text-caption text-[var(--muted-foreground)]">
					{post.date}
				</time>
				{#if readingTime > 0}
					<span class="font-mono text-caption text-[var(--muted-foreground)]">
						&middot; {readingTime} {resolveLocale(labels.minRead, 'en')}
					</span>
				{/if}
				<span class="font-mono text-caption text-[var(--muted-foreground)]">
					&middot; {post.lang}
				</span>
			</div>
		</div>

		<!-- SVG icon -->
		{#if svgContent}
			<div class="shrink-0">
				<SvgIcon
					{svgContent}
					animation={post.animation}
					size={72}
					trigger="load"
				/>
			</div>
		{/if}
	</div>

</div>
