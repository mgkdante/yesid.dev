<script lang="ts">
	import type { ProjectSummary, Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { cursorGlow } from '@yesid/motion/actions';
	import SvgIcon from '#lib/components/brand/SvgIcon.svelte';
	import { Card } from '@yesid/ui/card';
	import { cn } from '@yesid/ui/cn';
	import { serviceLineColor } from '#lib/utils/service-colors.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import ProjectHeroPreview from './ProjectHeroPreview.svelte';
	import ProjectProofLinks from './ProjectProofLinks.svelte';
	import digitalDesktopBlueprint from '#lib/assets/project-fallbacks/digital-desktop.svg?raw';
	import digitalMobileBlueprint from '#lib/assets/project-fallbacks/digital-mobile.svg?raw';

	type ProjectCardVariant = 'listing' | 'proof';

	export interface ProjectCardProps {

		project: ProjectSummary;

		services?: readonly Service[];

		serviceSvgContents?: Record<string, string>;
		variant?: ProjectCardVariant;
		/** Forward first-card loading priority to the media preview. */
		eager?: boolean;
		/** False keeps every link out of the tab order (decorative loop copies). */
		tabbable?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		project,
		services = [],
		serviceSvgContents = {},
		variant = 'listing',
		eager = false,
		tabbable = true,
		class: className = '',
		...rest
	}: ProjectCardProps = $props();
	const titleId = $props.id();

	const VARIANT = {
		listing: { testId: 'project-card', mediaTestId: 'project-card-image', titleTestId: undefined, excerptTestId: undefined, mediaPreset: 'card-600' },
		proof: { testId: 'proof-card', mediaTestId: 'proof-card-image', titleTestId: 'proof-card-title', excerptTestId: 'proof-excerpt', mediaPreset: 'hero-1200' },
	} as const;
	const v = $derived(VARIANT[variant]);

	// Rendered pane widths per breakpoint. Listing values are measured on /projects:
	// a split card gives the phone screenshot ~25vw on mobile, so asking for the
	// whole card width there downloads twice the pixels for the LCP image.
	const MEDIA_SIZES = {
		listing: {
			single: '(min-width: 1280px) 35vw, (min-width: 1024px) 63vw, (min-width: 768px) 90vw, 82vw',
			primary: '(min-width: 1280px) 26vw, (min-width: 1024px) 52vw, 72vw',
			secondary: '(min-width: 1280px) 12vw, (min-width: 1024px) 18vw, (min-width: 768px) 24vw, 30vw',
		},
		proof: {
			single: '(min-width: 768px) 50vw, 92vw',
			primary: '(min-width: 768px) 50vw, 92vw',
			secondary: '(min-width: 768px) 16vw, 40vw',
		},
	} as const;
	const mediaSizes = $derived(MEDIA_SIZES[variant]);

	let cardHovered = $state(false);

	let isProof = $derived(variant === 'proof');
	let mediaClass = $derived(cn('project-card-media overflow-hidden', `project-card-media--${variant}`));

	let projectServices = $derived(
		project.relatedServices
			.map((id) => services.find((s) => s.id === id))
			.filter((s): s is Service => !!s)
	);

	const listingChrome = siteLabels.projectsChrome.listing;
	const servicesLabel = listingChrome.filters.services;

</script>

<article
	class={cn("tap-press project-card group relative block h-full", `project-card--${variant}`, className)}
	data-testid={v.testId}
	data-flip-id={project.slug}
	data-batch="project-item"
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
	use:cursorGlow
	{...rest}
>
	<a href={localizeHref(`/projects/${project.slug}`, locale)} class="project-card-link" aria-labelledby={titleId} tabindex={tabbable ? undefined : -1}></a>
	<Card class="h-full gap-0 py-0">
		<div class="project-card-layout h-full flex-1">

		{#if project.image}
			<div class={mediaClass} data-testid={v.mediaTestId}>
				<ProjectHeroPreview
					{project}
					preset={v.mediaPreset}
					alt={resolveLocale(project.title, locale)}
					imageClass={cn('project-card-img', !isProof && project.imageSecondary && 'transition-transform duration-500 group-hover:scale-105 group-active:scale-105')}
					{eager}
					sizes={project.imageSecondary ? mediaSizes.primary : mediaSizes.single}
					secondarySizes={mediaSizes.secondary}
				/>
			</div>
		{:else}
			<div
				class={cn(mediaClass, 'project-card-blueprint relative')}
				data-testid={v.mediaTestId}
			>
				<div
					class="blueprint-art blueprint-art--desktop"
					data-testid="project-blueprint-fallback"
					aria-hidden="true"
				>
					{@html digitalDesktopBlueprint}
				</div>
				<div class="blueprint-art blueprint-art--mobile" aria-hidden="true">
					{@html digitalMobileBlueprint}
				</div>
			</div>
		{/if}

		<div class="project-card-info flex min-w-0 flex-col" data-testid="project-card-info">
		<div class="project-card-body flex flex-1 flex-col p-4">

			<h2
				id={titleId}
				class="project-card-title font-bold text-[var(--foreground)] transition-colors duration-300 group-hover:text-primary group-active:text-primary"
				data-testid={v.titleTestId}
			>
				{resolveLocale(project.title, locale)}
			</h2>

			<p class="project-card-excerpt mt-1.5 leading-relaxed text-[var(--secondary-foreground)]" data-testid={v.excerptTestId}>
				{resolveLocale(project.oneLiner, locale)}
			</p>

			{#if !isProof}
			{#if projectServices.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(servicesLabel, locale)}
					</div>
					<div class="project-card-services">
					{#each projectServices as service}
						<div
							class="project-card-service inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5"
							style="border-color: color-mix(in srgb, var(--primary) 35%, transparent);"
						>
							{#if serviceSvgContents[service.id]}
								<div class="service-badge-icon" aria-hidden="true">
									<SvgIcon
										svgContent={serviceSvgContents[service.id]}
										size={28}
										hovered={cardHovered}
									/>
								</div>
							{/if}
							<span class="project-card-meta inline-flex min-w-0 items-start gap-2 font-mono leading-tight text-[var(--foreground)]">
								<span
									class="first-line-bullet"
									style="background: {serviceLineColor(service.id)};"
									aria-hidden="true"
								></span>
								<span>{resolveLocale(service.title, locale)}</span>
							</span>
						</div>
					{/each}
					</div>
				</div>
			{/if}

			{/if}
		</div>

		{#if isProof}
			<div class="project-card-links" data-testid="proof-card-links">
				<ProjectProofLinks {project} {tabbable} />
			</div>
		{/if}
		</div>

		</div>
	</Card>
</article>

<style>
	/* From tablet up: always two rows, filled column by column. One service leaves the second row
	   empty but sized, two stack, three or four split into two columns. Equal 1fr
	   rows keep every card's services block the same height. */
	.project-card-services {
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(2, 1fr);
		grid-auto-columns: minmax(0, 1fr);
		justify-items: start;
		gap: 0.375rem;
	}

	/* Labels wrap between words only, overriding the global break-word. */
	.project-card-service {
		min-width: 0;
		max-width: 100%;
		word-break: normal;
		overflow-wrap: normal;
	}

	/* Two columns share the card: tighter insides leave room for the icon and a whole word. */
	@media (--tablet-min) {
		.project-card-service {
			padding-inline: 0.5rem;
			gap: 0.375rem;
		}
		.project-card-service .project-card-meta {
			gap: 0.375rem;
		}
	}

	/* Phones stack every service in one column. */
	@media (--tablet-max) {
		.project-card-services {
			grid-auto-flow: row;
			grid-template-rows: none;
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* Strip SvgIcon container border/bg when nested in card badges */
	.service-badge-icon :global([data-slot="svg-icon"]) {
		border: none;
		background: transparent;
		border-radius: 0;
	}

	.project-card :global(.card-surface) {
		border-width: 3px;
	}

	/* The link layer takes the pointer, so the surface follows the card's hover. */
	.project-card:hover :global(.card-surface) {
		border-color: var(--border-brand-active);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}

	.project-card-link {
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: var(--radius-lg);
	}

	.project-card-media {
		border-bottom: 2px solid color-mix(in srgb, var(--primary) 78%, transparent);
	}

	.project-card-blueprint {
		color: var(--primary);
		background-image:
			linear-gradient(color-mix(in srgb, var(--primary) 10%, transparent) 1px, transparent 1px),
			linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, transparent) 1px, transparent 1px),
			linear-gradient(color-mix(in srgb, var(--primary) 5%, transparent) 1px, transparent 1px),
			linear-gradient(90deg, color-mix(in srgb, var(--primary) 5%, transparent) 1px, transparent 1px);
		background-size:
			96px 96px,
			96px 96px,
			24px 24px,
			24px 24px;
	}

	.blueprint-art {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		opacity: 0.6;
		transition: opacity 300ms;
	}

	.project-card:hover .blueprint-art,
	.project-card:active .blueprint-art {
		opacity: 0.85;
	}

	.blueprint-art :global(svg) {
		width: 100%;
		height: 100%;
	}

	.blueprint-art--desktop {
		display: none;
	}

	@media (--tablet-min) {
		.blueprint-art--desktop {
			display: flex;
		}

		.blueprint-art--mobile {
			display: none;
		}
	}

	.project-card-layout {
		display: grid;
		grid-template-rows: 1fr 1fr;
	}
	@media (--tablet-max) {
		.project-card-layout {
			grid-template-rows: 1fr 3fr;
		}
	}

	/* Home cards size to their content and the reel stretches each one to the tallest:
	   equal media and info halves from tablet up, a 16:9 frame over the info on phones. */
	.project-card--proof .project-card-layout {
		grid-template-rows: 1fr 1fr;
	}

	.project-card-links {
		position: relative;
		z-index: 2;
		padding: 0.25rem 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
	}

	.project-card-links:not(:has(li)) {
		display: none;
	}

	.project-card-links :global(.project-links) {
		gap: 0 1rem;
	}

	.project-card-links :global(:is(.project-links a, .project-links__private)) {
		font-size: var(--text-caption);
	}

	.project-card-title {
		font-size: var(--text-card-title);
		line-height: 1.2;
		letter-spacing: 0;
	}

	.project-card-excerpt {
		font-size: var(--text-card-body);
	}

	.project-card-meta {
		font-size: var(--text-card-meta);
	}

	.project-card--proof .project-card-body {
		padding: 1rem 1.25rem 0.75rem;
	}

	.project-card--proof[data-active='true'] :global(.card-surface) {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}

	@media (--tablet-min) {
		.project-card--proof .project-card-body {
			padding: 1rem 1.75rem 0.75rem;
		}

		.project-card-links {
			padding-inline: 1.75rem;
		}
	}

	@media (--tablet-max) {
		.project-card--proof .project-card-layout {
			grid-template-rows: auto 1fr;
		}

		.project-card--proof .project-card-media {
			aspect-ratio: 16 / 9;
		}

		.project-card-links {
			padding-inline: 1rem;
		}
	}

	/* Large image scale rests under reduced motion; component CSS must outrank layered zoom utilities. */
	@media (prefers-reduced-motion: reduce) {
		:global(.project-card-img) {
			transition: none;
			scale: 1;
		}
	}

</style>
