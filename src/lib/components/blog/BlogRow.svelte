<!--
  Single blog post row in the listing page.
  Metro timeline layout: station badge + vertical line | content card.
  Featured prop controls accent border, larger SVG, and full excerpt.
-->
<script lang="ts">
	import type { BlogPost } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { Badge } from '$lib/components/ui/badge';
	import { MetroStation } from '$lib/components/brand';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { SvgIcon } from '$lib/components/brand';
	import { cn } from '$lib/utils.js';

	export interface BlogRowProps {
		/** The blog post data to display */
		post: BlogPost;
		/** Raw SVG content for the decorative icon */
		svgContent?: string;
		/** Accent color for tags and highlights */
		accentColor?: string;
		/** Position index in the listing (1-based station number) */
		index?: number;
		/** Whether this is a featured/highlighted row */
		featured?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		post,
		svgContent = '',
		accentColor = 'var(--primary)',
		index = 0,
		featured = false,
		class: className = '',
		...rest
	}: BlogRowProps = $props();

	let cardHovered = $state(false);

	// Station number: 1-based, zero-padded to 2 digits
	let stationNumber = $derived(String(index + 1).padStart(2, '0'));

	// SVG icon size: featured posts get a larger illustration
	let iconSize = $derived(featured ? 64 : 48);
</script>

<a
	href={post.url}
	target={post.external ? '_blank' : undefined}
	rel={post.external ? 'noopener noreferrer' : undefined}
	class={cn("group block", className)}
	data-testid="blog-row"
	data-batch="blog-item"
	use:boop={{ scale: 1.015, timing: 300 }}
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
	{...rest}
>
	<!-- Metro timeline wrapper: badge + line on left, content card on right -->
	<div class="flex gap-3">
		<!-- Metro line column: station badge + vertical connector -->
		<MetroStation index={index + 1} showLine pulseDelay={index * 0.4} />

		<!-- Content card -->
		<article
			class="blog-row relative flex min-w-0 flex-1 items-start gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--card)]/80 backdrop-blur-sm transition-all duration-300 md:gap-5"
			class:p-5={featured}
			class:md\:p-6={featured}
			class:p-4={!featured}
			class:md\:p-5={!featured}
			style="--accent: {accentColor};"
			use:cursorGlow
		>
			<!-- SVG icon -->
			{#if svgContent}
				<div class="relative z-10 shrink-0">
					<SvgIcon
						{svgContent}
						animation={post.animation}
						size={iconSize}
						trigger="load"
						hovered={cardHovered}
					/>
				</div>
			{/if}

			<!-- Content -->
			<div class="relative z-10 min-w-0 flex-1">
				<h2 class="text-sm font-semibold leading-snug text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent)] md:text-base">
					{resolveLocale(post.title, 'en')}
				</h2>
				<p
					class="mt-1.5 text-xs leading-relaxed text-[var(--secondary-foreground)] md:text-sm"
					class:line-clamp-2={!featured}
				>
					{resolveLocale(post.excerpt, 'en')}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-1.5">
					{#each post.tags as tag}
						<span use:magnetic={{ strength: 2, radius: 30 }}>
							<Badge variant="tag-active" size="xs" style="border-color: {accentColor}30; background: {accentColor}15; color: {accentColor}">{tag}</Badge>
						</span>
					{/each}
					<time datetime={post.date} class="ml-auto font-mono text-caption text-[var(--muted-foreground)]">
						{post.date}
					</time>
				</div>
			</div>
		</article>
	</div>
</a>

<style>
	.blog-row:hover {
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 8%, transparent);
	}

	/* WHY: SVG metro line needs display:block to avoid inline baseline gap,
	   and a min-height so very short posts still show a line segment */
	.metro-line-svg {
		display: block;
		min-height: 20px;
	}

</style>
