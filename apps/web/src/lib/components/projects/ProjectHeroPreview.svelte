<script lang="ts">
	import type { ProjectSummary } from '#lib/types.ts';
	import { assetImage } from '#lib/directus/assets.ts';
	import type { Theme } from '@yesid/ui/state';
	import { resolveThemeValue, watchTheme } from '#lib/utils/theme-media.ts';
	import { onMount } from 'svelte';

	let {
		project,
		preset,
		alt = '',
		decorative = false,
		class: className = '',
		imageClass = '',
		eager = false,
		sizes = '(min-width: 768px) 40vw, 92vw',
	}: {
		project: ProjectSummary;
		preset: string;
		alt?: string;
		decorative?: boolean;
		class?: string;
		imageClass?: string;
		/** First-card/LCP treatment: loading=eager + fetchpriority=high.
		 *  Everything else stays lazy. */
		eager?: boolean;
		/** Rendered-width hint for srcset selection — set per surface. */
		sizes?: string;
	} = $props();

	// Start from the server markup's dark theme: hydration keeps the server's src,
	// so the mount-time sync must be a real change for light variants to load.
	let activeTheme = $state<Theme>('dark');

	onMount(() => {
		return watchTheme((theme) => {
			activeTheme = theme;
		});
	});

	const primaryId = $derived(resolveThemeValue(activeTheme, project.image, project.imageLight));
	const secondaryId = $derived(
		project.imageSecondary
			? resolveThemeValue(activeTheme, project.imageSecondary, project.imageSecondaryLight)
			: undefined,
	);
	const hasSecondary = $derived(Boolean(secondaryId));
	const primaryAlt = $derived(decorative ? '' : alt);
	const secondaryAlt = $derived(decorative ? '' : `${alt} secondary view`.trim());

	const primaryImage = $derived(primaryId ? assetImage(primaryId, preset) : undefined);
	const secondaryImage = $derived(secondaryId ? assetImage(secondaryId, preset) : undefined);
	const SECONDARY_SIZES = '(min-width: 768px) 16vw, 40vw';
</script>

{#if primaryId}
	<div
		class="project-hero-preview {className}"
		data-testid="project-hero-preview"
		data-split={hasSecondary ? 'true' : 'false'}
		data-layout={hasSecondary ? 'desktop-mobile' : 'single'}
	>
		<div class="project-hero-preview__pane project-hero-preview__pane--primary">
			<img
				src={primaryImage?.src}
				srcset={primaryImage?.srcset}
				{sizes}
				width={primaryImage?.width}
				height={primaryImage?.height}
				alt={primaryAlt}
				class="project-hero-preview__image {imageClass}"
				data-testid="project-hero-preview-image"
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={eager ? 'high' : undefined}
				decoding="async"
			/>
		</div>
		{#if secondaryId}
			<div class="project-hero-preview__pane project-hero-preview__pane--secondary">
				<img
					src={secondaryImage?.src}
					srcset={secondaryImage?.srcset}
					sizes={SECONDARY_SIZES}
					width={secondaryImage?.width}
					height={secondaryImage?.height}
					alt={secondaryAlt}
					class="project-hero-preview__image {imageClass}"
					data-testid="project-hero-preview-image"
					loading={eager ? 'eager' : 'lazy'}
					decoding="async"
				/>
			</div>
		{/if}
	</div>
{/if}

<style>
	.project-hero-preview {
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.project-hero-preview__pane {
		position: relative;
		min-width: 0;
		overflow: hidden;
	}

	.project-hero-preview__pane--primary {
		flex: 1 1 0;
	}

	.project-hero-preview__pane--secondary {
		flex: 0 0 auto;
		height: 100%;
		max-width: 40%;
		/* A phone viewport, whatever length the capture is. */
		aspect-ratio: 9 / 19.5;
		border-left: 2px solid color-mix(in srgb, var(--primary) 78%, transparent);
	}

	/* Screenshots fill their pane and crop from the bottom, keeping the page
	   header in frame. Absolute so an image never sizes the card's media row. */
	.project-hero-preview__image {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
	}

	@media (prefers-reduced-motion: reduce) {
		.project-hero-preview__image {
			transition: none;
		}
	}
</style>
