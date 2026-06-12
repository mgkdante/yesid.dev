<!--
  Single blog post row in the listing page.
  Metro timeline layout: station badge + vertical line | content card.
  Featured prop controls accent border, larger SVG, and full excerpt.
-->
<script lang="ts">
	import type { BlogPost } from '$lib/types';
	import { boop } from '$lib/motion/actions/boop.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { Badge } from '$lib/components/ui/badge';
	import { MetroStation } from '$lib/components/brand';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { SvgIcon } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();

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

	let iconSize = 64;
</script>

<a
	href={post.external ? post.url : localizeHref(post.url, locale)}
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
		<div class="min-w-0 flex-1" use:cursorGlow>
		<Card class="blog-row flex flex-row items-start gap-5 p-5 md:gap-6 md:p-6">
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
				<h2 class="text-base font-semibold leading-snug text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-text)] md:text-lg">
					{post.title}
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-[var(--secondary-foreground)] line-clamp-2 md:text-base">
					{post.excerpt}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					{#each post.tags as tag}
						<span use:magnetic={{ strength: 2, radius: 30 }}>
							<Badge variant="tag-active" size="xs" style="border-color: color-mix(in srgb, {accentColor} 30%, transparent); background: color-mix(in srgb, {accentColor} 15%, transparent); color: {accentColor}">{tag}</Badge>
						</span>
					{/each}
				</div>
				<time datetime={post.date} class="mt-2 block font-mono text-xs text-[var(--muted-foreground)]">
					{post.date}
				</time>
			</div>
		</Card>
		</div>
	</div>
</a>

