<script lang="ts">
	import type { Project, Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { cursorGlow, magnetic } from '@yesid/motion/actions';
	import SvgIcon from '#lib/components/brand/SvgIcon.svelte';
	import { Badge } from '@yesid/ui/badge';
	import { Card } from '@yesid/ui/card';
	import DataFlowDiagram from '#lib/components/projects/DataFlowDiagram.svelte';
	import { cn } from '@yesid/ui/cn';
	import { serviceLineColor } from '#lib/utils/service-colors.ts';
	import { projectMetrics } from '#lib/utils/project-metrics.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import ProjectHeroPreview from './ProjectHeroPreview.svelte';
	import digitalDesktopBlueprint from '#lib/assets/project-fallbacks/digital-desktop.svg?raw';
	import digitalMobileBlueprint from '#lib/assets/project-fallbacks/digital-mobile.svg?raw';

	type ProjectCardVariant = 'listing' | 'proof';

	export interface ProjectCardProps {

		project: Project;

		services?: readonly Service[];

		serviceSvgContents?: Record<string, string>;
		variant?: ProjectCardVariant;
		/** Forward first-card loading priority to the media preview. */
		eager?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		project,
		services = [],
		serviceSvgContents = {},
		variant = 'listing',
		eager = false,
		class: className = '',
		...rest
	}: ProjectCardProps = $props();

	const VARIANT = {
		listing: { testId: 'project-card', mediaTestId: 'project-card-image', titleTestId: undefined, excerptTestId: undefined, metricTestPrefix: 'project-card', mediaPreset: 'card-600' },
		proof: { testId: 'proof-card', mediaTestId: 'proof-card-image', titleTestId: 'proof-card-title', excerptTestId: 'proof-excerpt', metricTestPrefix: 'proof', mediaPreset: 'hero-1200' },
	} as const;
	const v = $derived(VARIANT[variant]);

	// Rendered card widths: listing = 2-col grid beside the sidebar (~40vw
	// desktop, full-width mobile); proof = one or two whole carousel slots.
	const mediaSizes = $derived(
		variant === 'proof'
			? '(min-width: 768px) 50vw, 92vw'
			: '(min-width: 768px) 40vw, 92vw',
	);

	let cardHovered = $state(false);
	let isProof = $derived(variant === 'proof');
	let mediaClass = $derived(cn('project-card-media overflow-hidden', `project-card-media--${variant}`));

	let displayTags = $derived(project.tags.slice(0, 4));

	let displayStack = $derived(project.stack.slice(0, 5));

	let projectServices = $derived(
		project.relatedServices
			.map((id) => services.find((s) => s.id === id))
			.filter((s): s is Service => !!s)
	);

	const listingChrome = siteLabels.projectsChrome.listing;
	const stackLabel = listingChrome.filters.techStack;
	const servicesLabel = listingChrome.filters.services;
	const stackOverflowTemplate = resolveLocale(listingChrome.card.stackOverflowSuffix, locale);
	const stackOverflow = $derived(
		project.stack.length > 5
			? stackOverflowTemplate.replace('{count}', String(project.stack.length - 5))
			: ''
	);

	const proofMetrics = $derived(projectMetrics(project));
</script>

<a
	href={localizeHref(`/projects/${project.slug}`, locale)}
	class={cn("tap-press project-card group block h-full", `project-card--${variant}`, className)}
	data-testid={v.testId}
	data-flip-id={project.slug}
	data-batch="project-item"
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
	{...rest}
>
	<div class="h-full" use:cursorGlow>
	<Card class="h-full gap-0 py-0">
		<div class="project-card-layout h-full flex-1">

		{#if project.image}
			<div class={mediaClass} data-testid={v.mediaTestId}>
				<ProjectHeroPreview
					{project}
					preset={v.mediaPreset}
					alt={resolveLocale(project.title, locale)}
					imageClass={cn('project-card-img', !isProof && 'transition-transform duration-500 group-hover:scale-105 group-active:scale-105')}
					{eager}
					sizes={mediaSizes}
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
				class="project-card-title font-bold text-[var(--foreground)] transition-colors duration-300 group-hover:text-primary group-active:text-primary"
				data-testid={v.titleTestId}
			>
				{resolveLocale(project.title, locale)}
			</h2>

			<p class="project-card-excerpt mt-1.5 leading-relaxed text-[var(--secondary-foreground)]" data-testid={v.excerptTestId}>
				{resolveLocale(project.oneLiner, locale)}
			</p>

			{#if projectServices.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(servicesLabel, locale)}
					</div>
					<div class="flex flex-wrap gap-1.5">
					{#each projectServices as service}
						<div
							class="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5"
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
							<span
								class="line-bullet"
								style="background: {serviceLineColor(service.id)};"
								aria-hidden="true"
							></span>
							<span class="project-card-meta font-mono leading-tight text-[var(--foreground)]">
								{resolveLocale(service.title, locale)}
							</span>
						</div>
					{/each}
					</div>
				</div>
			{/if}

			{#if displayStack.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(stackLabel, locale)}
					</div>
					<DataFlowDiagram stack={displayStack} size="sm" />
					{#if stackOverflow}
						<span class="project-card-meta mt-0.5 block font-mono text-[var(--muted-foreground)]">{stackOverflow}</span>
					{/if}
				</div>
			{/if}

			{#if !isProof}
				<div class="flex flex-wrap gap-1 pt-3">
					{#each displayTags as tag}
						<span use:magnetic={{ strength: 2, radius: 30 }}>
							<Badge
								variant="tag-active"
								size="xs"
								class="project-card-tag"
							>{tag}</Badge>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		{#if isProof && proofMetrics.length > 0}
			<div class="project-card-proof-metric" data-testid="{v.metricTestPrefix}-metric-strip">
				<div class="project-card-proof-metric__grid">
					{#each proofMetrics as metric}
						<div class="project-card-proof-metric__item" data-testid="{v.metricTestPrefix}-metric-item">
							{#if metric.before}
								<span
									class="proof-metric-before"
									data-testid="{v.metricTestPrefix}-metric-before"
								>{metric.before}</span>
							{/if}
							<div class="project-card-proof-metric__line">
								<span class="proof-metric-value" data-testid="{v.metricTestPrefix}-metric-value">{metric.value}</span>
								<span class="proof-metric-label" data-testid="{v.metricTestPrefix}-metric-label">{resolveLocale(metric.label, locale)}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		</div>

		</div>
	</Card>
	</div>
</a>

<style>
	/* Strip SvgIcon container border/bg when nested in card badges */
	.service-badge-icon :global([data-slot="svg-icon"]) {
		border: none;
		background: transparent;
		border-radius: 0;
	}

	.line-bullet {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.project-card :global(.card-surface) {
		border-width: 3px;
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

	.project-card--proof :global(.card-surface) {
		min-height: clamp(30rem, 64dvh, 44rem);
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

	:global(.project-card-tag) {
		font-size: var(--text-tag);
		letter-spacing: 0;
	}

	.project-card--proof .project-card-body {
		padding: 1.25rem 1.25rem 1rem;
	}

	.project-card-proof-metric {
		margin-top: auto;
		display: flex;
		align-items: stretch;
		min-height: 6.5rem;
		flex-shrink: 0;
		padding: 0.95rem 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
	}

	.project-card-proof-metric__grid {
		display: grid;
		width: 100%;
		min-width: 0;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
		align-items: stretch;
		gap: 0.75rem;
		position: relative;
	}

	.project-card-proof-metric__item {
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-inline-end: 0.75rem;
		border-inline-end: 1px solid color-mix(in srgb, var(--primary) 16%, transparent);
	}

	.project-card-proof-metric__item:last-child {
		border-inline-end: 0;
	}

	.project-card-proof-metric__line {
		display: flex;
		min-width: 0;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.proof-metric-before {
		color: var(--muted-foreground);
		font-size: var(--text-small);
		text-decoration: line-through;
		margin-bottom: 0.25rem;
		max-width: 100%;
		overflow-wrap: anywhere;
	}

	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: var(--text-metric-value-mobile);
		line-height: 1;
		color: var(--accent-text);
		max-width: 100%;
		overflow-wrap: anywhere;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		overflow-wrap: anywhere;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.project-card--proof[data-active='true'] :global(.card-surface) {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}

	@media (--tablet-min) {
		.project-card--proof .project-card-body {
			padding: 1.25rem 1.75rem 1rem;
		}

		.project-card-proof-metric {
			padding-inline: 1.75rem;
		}

		.proof-metric-label {
			font-size: var(--text-mono);
		}

		.proof-metric-before {
			font-size: var(--text-body);
		}
	}

	@media (--tablet-max) {
		.project-card--proof :global(.card-surface) {
			min-height: clamp(20rem, 50dvh, 30rem);
		}

		.project-card-proof-metric {
			padding: 0.8rem 1rem;
		}

		.project-card-proof-metric__grid {
			gap: 0.5rem;
		}

		.project-card-proof-metric__item {
			padding-inline-end: 0.5rem;
		}

		.proof-metric-label {
			font-size: var(--text-caption);
		}

		.proof-metric-before {
			font-size: var(--text-small);
		}
	}

	/* Large image scale rests under reduced motion; component CSS must outrank layered zoom utilities. */
	@media (prefers-reduced-motion: reduce) {
		:global(.project-card-img) {
			transition: none;
			scale: 1;
		}
	}

	/* Alpha-only pipeline attention remains active under reduced motion. */
	.project-card :global(.df-line) {
		transition: stroke-opacity var(--duration-normal) var(--ease-default);
	}
	.project-card:hover :global(.df-line),
	.project-card:active :global(.df-line) {
		stroke-opacity: 1;
	}
</style>
