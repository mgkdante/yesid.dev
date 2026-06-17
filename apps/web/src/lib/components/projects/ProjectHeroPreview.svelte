<script lang="ts">
	import type { Project } from '$lib/types';
	import { asset } from '$lib/directus/assets';
	import { getActiveTheme, resolveThemeValue, watchTheme, type Theme } from '$lib/utils/theme-media';
	import { onMount } from 'svelte';

	let {
		project,
		preset,
		alt = '',
		decorative = false,
		class: className = '',
		imageClass = '',
	}: {
		project: Project;
		preset: string;
		alt?: string;
		decorative?: boolean;
		class?: string;
		imageClass?: string;
	} = $props();

	let activeTheme = $state<Theme>(getActiveTheme());

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
				src={asset(primaryId, preset)}
				alt={primaryAlt}
				class="project-hero-preview__image {imageClass}"
				data-testid="project-hero-preview-image"
				loading="lazy"
				decoding="async"
			/>
		</div>
		{#if secondaryId}
			<div class="project-hero-preview__pane project-hero-preview__pane--secondary">
				<img
					src={asset(secondaryId, preset)}
					alt={secondaryAlt}
					class="project-hero-preview__image {imageClass}"
					data-testid="project-hero-preview-image"
					loading="lazy"
					decoding="async"
				/>
			</div>
		{/if}
	</div>
{/if}

<style>
	.project-hero-preview {
		--project-hero-preview-mat: #050505;
		--project-hero-preview-rule: color-mix(in srgb, var(--primary) 78%, transparent);
		--project-hero-preview-secondary-width: clamp(5.75rem, 26%, 24rem);
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: color-mix(in srgb, var(--border-subtle) 72%, transparent);
	}

	:global([data-theme="light"]) .project-hero-preview,
	:global(.theme-light) .project-hero-preview {
		--project-hero-preview-mat: #fff;
	}

	.project-hero-preview__pane {
		display: grid;
		min-width: 0;
		place-items: center;
		overflow: hidden;
		background: var(--project-hero-preview-mat);
	}

	.project-hero-preview__pane--primary {
		flex: 1 1 auto;
	}

	.project-hero-preview__pane--secondary {
		flex: 0 0 var(--project-hero-preview-secondary-width);
		border-left: 2px solid var(--project-hero-preview-rule);
	}

	.project-hero-preview__image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	@media (prefers-reduced-motion: reduce) {
		.project-hero-preview__image {
			transition: none;
		}
	}
</style>
