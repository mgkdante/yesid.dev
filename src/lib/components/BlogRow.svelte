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
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import BlogSvgIcon from './BlogSvgIcon.svelte';

	let {
		post,
		svgContent = '',
		accentColor = '#E07800',
		index = 0,
		featured = false
	}: {
		post: BlogPost;
		svgContent?: string;
		accentColor?: string;
		index?: number;
		featured?: boolean;
	} = $props();

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
	class="group block"
	data-testid="blog-row"
	data-batch="blog-item"
	use:boop={{ scale: 1.015, timing: 300 }}
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
>
	<!-- Metro timeline wrapper: badge + line on left, content card on right -->
	<div class="flex gap-3">
		<!-- Metro line column: station badge + vertical connector -->
		<div class="flex flex-col items-center">
			<!-- Station badge: numbered circle with sonar pulse radiating outward -->
			<div class="station-badge-wrapper">
				<!-- WHY: stagger delay based on index so badges pulse at offset intervals,
				     avoiding all badges pulsing simultaneously (feels more organic) -->
				<div
					class="station-pulse"
					style="animation-delay: {index * 0.4}s;"
				></div>
				<div
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-caption font-bold text-[#0a0a0a]"
					style="background-color: {accentColor};"
					data-testid="station-badge"
				>
					{stationNumber}
				</div>
			</div>
			<!-- Vertical metro line connecting stations — SVG for DrawSVGPlugin animation -->
			<svg
				class="metro-line-svg flex-1"
				width="2"
				viewBox="0 0 2 100"
				preserveAspectRatio="none"
				aria-hidden="true"
				data-testid="metro-line"
				data-metro-line
			>
				<line
					x1="1" y1="0" x2="1" y2="100"
					stroke={accentColor}
					stroke-width="2"
				/>
			</svg>
		</div>

		<!-- Content card -->
		<article
			class="blog-row relative flex min-w-0 flex-1 items-start gap-4 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]/80 backdrop-blur-sm transition-all duration-300 md:gap-5"
			class:p-5={featured}
			class:md\:p-6={featured}
			class:p-4={!featured}
			class:md\:p-5={!featured}
			style="--accent: {accentColor};"
			use:cursorGlow
		>
			<!-- Subtle glow on hover -->
			<div
				class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in srgb, {accentColor} 6%, transparent), transparent 60%);"
			></div>

			<!-- SVG icon -->
			{#if svgContent}
				<div class="relative z-10 shrink-0">
					<BlogSvgIcon
						{svgContent}
						animation={post.animation}
						size={iconSize}
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
				<p
					class="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)] md:text-sm"
					class:line-clamp-2={!featured}
				>
					{resolveLocale(post.excerpt, 'en')}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-1.5">
					{#each post.tags as tag}
						<span
							class="rounded border px-1.5 py-0.5 font-mono text-caption transition-colors duration-200"
							style="border-color: color-mix(in srgb, {accentColor} 60%, transparent); color: {accentColor};"
							use:magnetic={{ strength: 2, radius: 30 }}
						>
							{tag}
						</span>
					{/each}
					<span class="ml-auto font-mono text-caption text-[var(--text-muted)]">
						{post.date}
					</span>
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

	/* WHY: wrapper provides a positioning context for the absolute pulse ring */
	.station-badge-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* WHY: sonar ping effect radiating from the badge center —
	   absolute positioning keeps it centred without affecting layout */
	.station-pulse {
		position: absolute;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(224, 120, 0, 0.5);
		animation: station-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	@keyframes station-ping {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		75%, 100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.station-pulse {
			animation: none;
			display: none;
		}
	}
</style>
