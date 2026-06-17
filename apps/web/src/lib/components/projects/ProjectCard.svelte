<!--
  Single project card for the /projects listing page.
  Layout: short gradient banner (120px) -> title -> description -> service badges
         -> tech stack inline diagram -> tag pills.
  Banner shows project image if available, otherwise a gradient with a subtle
  SvgIcon at the right. Full card is a link to /projects/{slug}.
  Hover triggers border glow + SVG morph. No entrance animation — Snappy Doctrine (17e-2).
-->
<script lang="ts">
	import type { Project, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { SvgIcon } from '$lib/components/brand';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import DataFlowDiagram from '$lib/components/home/DataFlowDiagram.svelte';
	import { cn } from '$lib/utils';
	import { siteLabels } from '$lib/content';
	import ProjectHeroPreview from './ProjectHeroPreview.svelte';

	type ProjectCardVariant = 'listing' | 'proof';
	type ProjectCardSize = 'listing' | 'proof';

	export interface ProjectCardProps {
		/** The project data to display */
		project: Project;
		/** Available services for badge rendering */
		services?: readonly Service[];
		/** SVG contents keyed by service ID */
		serviceSvgContents?: Record<string, string>;
		/** Position index for stagger animations */
		index?: number;
		variant?: ProjectCardVariant;
		cardSize?: ProjectCardSize;
		testId?: string;
		mediaTestId?: string;
		titleTestId?: string;
		excerptTestId?: string;
		metricTestPrefix?: string;
		mediaPreset?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		project,
		services = [],
		serviceSvgContents = {},
		index = 0,
		variant = 'listing',
		cardSize = variant === 'proof' ? 'proof' : 'listing',
		testId = variant === 'proof' ? 'proof-card' : 'project-card',
		mediaTestId = variant === 'proof' ? 'proof-card-image' : 'project-card-image',
		titleTestId = variant === 'proof' ? 'proof-card-title' : undefined,
		excerptTestId = variant === 'proof' ? 'proof-excerpt' : undefined,
		metricTestPrefix = variant === 'proof' ? 'proof' : 'project-card',
		mediaPreset = variant === 'proof' ? 'hero-1200' : 'card-600',
		class: className = '',
		...rest
	}: ProjectCardProps = $props();

	let cardHovered = $state(false);
	let isProof = $derived(variant === 'proof');
	let mediaClass = $derived(cn('project-card-media overflow-hidden', `project-card-media--${cardSize}`));

	// Show at most 4 tags to keep the card compact
	let displayTags = $derived(project.tags.slice(0, 4));

	// Show at most 5 stack items in the inline diagram to keep cards compact
	let displayStack = $derived(project.stack.slice(0, 5));

	// Resolve service objects for this project so we can show title labels
	let projectServices = $derived(
		project.relatedServices
			.map((id) => services.find((s) => s.id === id))
			.filter((s): s is Service => !!s)
	);

	// Gradient color based on the first related service's position in the palette.
	// GO-2: keyed by the 4 consolidated stations; unknown/archived ids take the
	// fallback pair below.
	const SERVICE_GRADIENTS: Record<string, [string, string]> = {
		'database-engineering': ['var(--primary)', 'var(--primary-hover)'],
		'data-pipeline': ['var(--accent)', 'var(--accent-hover)'],
		'analytics-reporting': ['var(--primary)', 'var(--accent)'],
		'web-development': ['var(--accent)', 'var(--primary)']
	};

	// GO2-W5 STM line bullets: each service chip carries its line color —
	// database = orange line, pipeline = yellow line (line-amber survives
	// daylight), analytics = green line, web = lunar white.
	const SERVICE_LINE_COLORS: Record<string, string> = {
		'database-engineering': 'var(--primary)',
		'data-pipeline': 'var(--line-amber)',
		'analytics-reporting': 'var(--signal-proceed)',
		'web-development': 'var(--signal-lunar)'
	};

	let gradientColors = $derived(
		SERVICE_GRADIENTS[project.relatedServices[0]] ?? ['var(--primary)', 'var(--accent)']
	);

	// i18n labels pulled from content layer (Task 17b-7d).
	const listingChrome = siteLabels.projectsChrome.listing;
	const stackLabel = listingChrome.filters.techStack;
	const servicesLabel = listingChrome.filters.services;
	const stackOverflowTemplate = resolveLocale(listingChrome.card.stackOverflowSuffix, locale);
	const stackOverflow = $derived(
		project.stack.length > 5
			? stackOverflowTemplate.replace('{count}', String(project.stack.length - 5))
			: ''
	);

	const proofMetrics = $derived(
		project.impactMetrics && project.impactMetrics.length > 0
			? project.impactMetrics
			: project.impactMetric
				? [project.impactMetric]
				: []
	);
	const visibleProofMetrics = $derived(proofMetrics.slice(0, 3));
	const hasProofMetricOverflow = $derived(proofMetrics.length > 3);
</script>

<a
	href={localizeHref(`/projects/${project.slug}`, locale)}
	class={cn("tap-press project-card group block h-full", `project-card--${variant}`, className)}
	data-testid={testId}
	data-flip-id={project.slug}
	data-batch="project-item"
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
	{...rest}
>
	<div class="h-full" use:cursorGlow>
	<Card class="h-full gap-0 py-0">
		<article class="flex h-full flex-col">
		<!-- Gradient banner: short (120px), full-width. Image or gradient+icon fallback -->
		{#if project.image}
			<div class={mediaClass} data-testid={mediaTestId}>
				<ProjectHeroPreview
					{project}
					preset={mediaPreset}
					alt={resolveLocale(project.title, locale)}
					imageClass="project-card-img transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
				/>
			</div>
		{:else}
			<div
				class={cn(mediaClass, 'flex items-center justify-end pr-6')}
				data-testid={mediaTestId}
				style="background: linear-gradient(135deg, color-mix(in srgb, {gradientColors[0]} 13%, transparent), color-mix(in srgb, {gradientColors[1]} 7%, transparent));"
			>
				{#if project.relatedServices[0] && serviceSvgContents[project.relatedServices[0]]}
					<div class="opacity-30 transition-opacity duration-300 group-hover:opacity-50 group-active:opacity-50">
						<SvgIcon
							svgContent={serviceSvgContents[project.relatedServices[0]]}
							size={72}
							hovered={cardHovered}
						/>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content area — all content stacks naturally below the banner -->
		<div class="project-card-body flex flex-1 flex-col p-4">
			<!-- Title below the gradient, not overlaid -->
			<h2
				class="text-base font-bold text-[var(--foreground)] transition-colors duration-300 group-hover:text-primary group-active:text-primary md:text-lg"
				data-testid={titleTestId}
			>
				{resolveLocale(project.title, locale)}
			</h2>

			<!-- Description -->
			<p class="mt-1.5 text-sm leading-relaxed text-[var(--secondary-foreground)]" data-testid={excerptTestId}>
				{resolveLocale(project.oneLiner, locale)}
			</p>

			<!-- Service badges row — SVGs with MorphSVG on card hover -->
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
								style="background: {SERVICE_LINE_COLORS[service.id] ?? 'var(--signal-lunar)'};"
								aria-hidden="true"
							></span>
							<span class="font-mono text-caption leading-tight text-[var(--foreground)]">
								{resolveLocale(service.title, locale)}
							</span>
						</div>
					{/each}
					</div>
				</div>
			{/if}

			<!-- Tech stack SVG diagram with DrawSVG animation -->
			{#if displayStack.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(stackLabel, locale)}
					</div>
					<DataFlowDiagram stack={displayStack} size="sm" />
					{#if stackOverflow}
						<span class="mt-0.5 block font-mono text-caption text-[var(--muted-foreground)]">{stackOverflow}</span>
					{/if}
				</div>
			{/if}

			<!-- Tags as small pills -->
			<div class="flex flex-wrap gap-1 pt-3">
				{#each displayTags as tag}
					<span use:magnetic={{ strength: 2, radius: 30 }}>
						<Badge
							variant="tag-active"
							size="xs"
							data-testid={isProof ? 'proof-project-tag' : undefined}
						>{tag}</Badge>
					</span>
				{/each}
			</div>
		</div>

		{#if isProof}
			<div class="project-card-proof-metric" data-testid="{metricTestPrefix}-metric-strip">
				<div class="project-card-proof-metric__grid">
					{#each visibleProofMetrics as metric}
						<div class="project-card-proof-metric__item" data-testid="{metricTestPrefix}-metric-item">
							{#if metric.before}
								<span
									class="proof-metric-before"
									data-testid="{metricTestPrefix}-metric-before"
								>{metric.before}</span>
							{/if}
							<div class="project-card-proof-metric__line">
								<span class="proof-metric-value" data-testid="{metricTestPrefix}-metric-value">{metric.value}</span>
								<span class="proof-metric-label" data-testid="{metricTestPrefix}-metric-label">{resolveLocale(metric.label, locale)}</span>
							</div>
						</div>
					{/each}
					{#if hasProofMetricOverflow}
						<div class="project-card-proof-metric__overflow" data-testid="{metricTestPrefix}-metric-overflow" aria-label="More metrics">...</div>
					{/if}
					{#if visibleProofMetrics.length === 0}
						<div class="project-card-proof-metric__item" aria-hidden="true">
							<div class="project-card-proof-metric__line">
								<span class="proof-metric-value"></span>
								<span class="proof-metric-label"></span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		</article>
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

	/* GO2-W5 STM line bullet — the service's line color as a roundel dot. */
	.line-bullet {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Round-4: dividers between list items one step thicker — the project-card
	   frame steps 2px → 3px (round-3 divider progression applied to listing
	   list items; shared ui/card elsewhere stays 2px).
	   Round 5 card parity (operator): the chassis is EXACTLY the blog list
	   card's — same width (3px), color (--border-brand via .card-surface) and
	   radius (--radius-lg), both modes. The round-1 "route lights up" inset
	   left strip is gone: it painted a 2px primary band inside the left border
	   and made the project frame read 5px vs the blog row's clean 3px. */
	.project-card :global(.card-surface) {
		border-width: 3px;
	}

	.project-card-media {
		border-bottom: 2px solid color-mix(in srgb, var(--primary) 78%, transparent);
	}

	.project-card-media--listing {
		height: 13rem;
	}

	.project-card--proof :global(.card-surface) {
		min-height: clamp(30rem, 64dvh, 44rem);
	}

	.project-card-media--proof {
		height: clamp(15rem, 38dvh, 22rem);
	}

	.project-card--proof .project-card-body {
		padding: 1.25rem 1.25rem 1rem;
	}

	.project-card-proof-metric {
		margin-top: auto;
		display: flex;
		align-items: stretch;
		height: clamp(6.5rem, 12dvh, 7.75rem);
		padding: 0.95rem 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		overflow: hidden;
	}

	.project-card-proof-metric__grid {
		display: grid;
		width: 100%;
		min-width: 0;
		grid-template-columns: repeat(3, minmax(0, 1fr));
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

	.project-card-proof-metric__item:nth-child(3),
	.project-card-proof-metric__item:last-child {
		border-inline-end: 0;
	}

	.project-card-proof-metric__overflow {
		position: absolute;
		inset-block-end: 0.2rem;
		inset-inline-end: -0.15rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid color-mix(in srgb, var(--primary) 45%, transparent);
		border-radius: 999px;
		background: var(--card);
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 800;
		line-height: 1;
		color: var(--primary);
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.875rem;
		line-height: 1;
		color: var(--accent-text);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.project-card--proof[data-active='true'] :global(.card-surface) {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}

	@media (min-width: 768px) {
		.project-card--proof .project-card-body {
			padding: 1.25rem 1.75rem 1rem;
		}

		.project-card-proof-metric {
			padding-inline: 1.75rem;
		}

		.proof-metric-value {
			font-size: 2.25rem;
		}

		.proof-metric-label {
			font-size: var(--text-mono);
		}

		.proof-metric-before {
			font-size: var(--text-body);
		}
	}

	@media (max-width: 767px) {
		.project-card--proof :global(.card-surface) {
			min-height: clamp(20rem, 50dvh, 30rem);
		}

		.project-card-media--proof {
			height: clamp(8rem, 22dvh, 10.5rem);
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

		.proof-metric-value {
			font-size: 1.25rem;
		}

		.proof-metric-label {
			font-size: var(--text-caption);
		}

		.proof-metric-before {
			font-size: var(--text-small);
		}
	}

	/* GO-w2t5 retier: large-surface image scale is MOTION-GATED — rest under
	   reduce. Unlayered component CSS outrides the @layer utilities zoom. */
	@media (prefers-reduced-motion: reduce) {
		:global(.project-card-img) {
			transition: none;
			scale: 1;
		}
	}

	/* GO-w2t5: the pipeline "goes live" on card attention — alpha-only →
	   SAFE-ALWAYS. Rest state is the diagram's stroke-opacity=0.5 attribute. */
	.project-card :global(.df-line) {
		transition: stroke-opacity var(--duration-normal) var(--ease-default);
	}
	.project-card:hover :global(.df-line),
	.project-card:active :global(.df-line) {
		stroke-opacity: 1;
	}
</style>
