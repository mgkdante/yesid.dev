<!--
  Single blog post row in the listing page.
  Metro timeline layout: station badge + vertical line | content card.
-->
<script lang="ts">
	import type { BlogPost } from '$lib/types';
	import { boop, cursorGlow, magnetic } from '@yesid/motion/actions';
	import { Badge } from '@yesid/ui/badge';
	import { MetroStation } from '$lib/components/brand';
	import { SvgIcon } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';
	import { siteLabels } from '$lib/content';

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
		class?: string;
		[key: string]: unknown;
	}

	let {
		post,
		svgContent = '',
		accentColor = 'var(--primary)',
		index = 0,
		class: className = '',
		...rest
	}: BlogRowProps = $props();

	let cardHovered = $state(false);

	// Station number: 1-based, zero-padded to 2 digits
	let stationNumber = $derived(String(index + 1).padStart(2, '0'));
	let languageName = $derived(resolveLocale(siteLabels.ui.languageNames[post.lang], locale) || post.lang);
	let languageAria = $derived(`${resolveLocale(siteLabels.blogChrome.listing.filters.language, locale)}: ${languageName}`);

	let iconSize = 64;
</script>

<a
	href={post.external ? post.url : localizeHref(post.url, post.lang)}
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
		<Card class="blog-row p-5 md:p-6" style="--blog-row-accent: {accentColor};">
			<!-- SVG icon -->
			{#if svgContent}
				<div class="blog-row-icon relative z-10">
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
			<div class="blog-row-body relative z-10 min-w-0">
				<div class="blog-row-head">
					<h2 class="blog-row-title font-semibold text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-text)]">
						{post.title}
					</h2>
					<div class="blog-meta-row" data-testid="blog-meta-row">
						<!-- Round-4 doctrine: the post date is a departure-time readout,
						     paired with source language as article metadata. -->
						<time datetime={post.date} class="blog-date">
							{post.date}
						</time>
						<Badge
							variant="outline"
							size="xs"
							data-testid="blog-lang-chip"
							class="blog-language-chip"
							aria-label={languageAria}
						>
							{languageName}
						</Badge>
					</div>
				</div>
				<p class="blog-excerpt mt-2 leading-relaxed text-[var(--secondary-foreground)]">
					{post.excerpt}
				</p>
				<div class="blog-topic-tags mt-3 flex flex-wrap items-center gap-2" data-testid="blog-topic-tags">
					{#each post.tags as tag}
						<span use:magnetic={{ strength: 2, radius: 30 }}>
							<Badge class="blog-topic-tag" variant="tag-active" size="xs" style="border-color: color-mix(in srgb, {accentColor} 30%, transparent); background: color-mix(in srgb, {accentColor} 15%, transparent); color: {accentColor}">{tag}</Badge>
						</span>
					{/each}
				</div>
			</div>
		</Card>
		</div>
	</div>
</a>

<style>
	/* Round-4: dividers between list items one step thicker — the blog-row
	   frame steps 2px → 3px (the round-3 divider progression applied to
	   listing list items; shared ui/card elsewhere stays 2px). */
	:global(.card-surface.blog-row) {
		border-width: 3px;
		display: grid;
		grid-template-columns: 4rem minmax(0, 1fr);
		gap: 0.75rem 0.875rem;
		align-items: center;
	}

	.blog-row-icon {
		grid-column: 1;
		grid-row: 1;
		width: 4rem;
		height: 4rem;
	}

	.blog-row-body {
		display: contents;
	}

	.blog-row-head {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
	}

	.blog-row-title {
		font-size: var(--text-card-title);
		line-height: 1.25;
		letter-spacing: 0;
	}

	.blog-excerpt {
		grid-column: 1 / -1;
		grid-row: 2;
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		font-size: var(--text-card-body);
	}

	.blog-topic-tags {
		grid-column: 1 / -1;
		grid-row: 3;
	}

	.blog-meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.blog-date {
		font-family: var(--font-mono);
		font-size: var(--text-card-meta);
		line-height: 1;
		color: var(--accent-text);
	}

	:global(.blog-topic-tag) {
		font-size: var(--text-tag);
		letter-spacing: 0;
	}

	:global(.blog-language-chip) {
		border-color: var(--accent-text);
		background: var(--accent-surface);
		color: var(--accent-text);
		font-size: var(--text-micro);
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	@media (--tablet-min) {
		:global(.card-surface.blog-row) {
			display: flex;
			flex-direction: row;
			align-items: flex-start;
			gap: 1.5rem;
			row-gap: 0;
			column-gap: 1.5rem;
		}

		.blog-row-icon {
			flex: 0 0 auto;
			margin: 0;
		}

		.blog-row-body {
			display: block;
			flex: 1 1 0;
		}

		.blog-row-head {
			grid-column: auto;
			grid-row: auto;
		}

		.blog-excerpt {
			grid-column: auto;
			grid-row: auto;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		.blog-topic-tags {
			grid-column: auto;
			grid-row: auto;
		}
	}
</style>
