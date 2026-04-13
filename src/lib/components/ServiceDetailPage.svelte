<!--
  Detail page layout for /services/[id].
  Full-width hero, centered content sections (matches WorkDetailPage).
  Station tabs → hero → gradient divider → collapsible sections →
  related projects band → prev/next nav.
-->
<script lang="ts">
	import type { Service, Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import StationTabs from './StationTabs.svelte';
	import ServiceNav from './ServiceNav.svelte';
	import DataFlowDiagram from './DataFlowDiagram.svelte';
	import ProjectMiniCard from './ProjectMiniCard.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import { Separator } from '$lib/components/ui/separator';

	let {
		service,
		services,
		prev,
		next,
		relatedProjects,
		serviceSvgContents
	}: {
		service: Service;
		services: readonly Service[];
		prev?: Service;
		next?: Service;
		relatedProjects: readonly Project[];
		serviceSvgContents: Record<string, string>;
	} = $props();

	let title = $derived(resolveLocale(service.title, 'en'));
	let description = $derived(resolveLocale(service.description, 'en'));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, 'en') : null);
	let stationNum = $derived(String(service.station).padStart(2, '0'));
	let totalStr = $derived(String(services.length).padStart(2, '0'));
	let svgContent = $derived(serviceSvgContents[service.id] ?? '');

	// svgMorphed tracks the SVG morph box hover/click state
	let svgMorphed = $state(false);

	// WHY: all user-facing strings go through LocalizedString so the page is ready
	// for future i18n without changing component logic.
	const labels = {
		backLink: { en: '\u2190 All Services' },
		serviceCounter: { en: 'Service' },
		valueProposition: { en: 'How This Helps You' },
		deliverables: { en: 'Typical Deliverables' },
		builtWith: { en: 'Built with' },
		seeAllWork: { en: 'See all work \u2192' }
	};
</script>

<div class="service-detail" data-testid="service-detail-page">
	<!-- Station tabs — navigate mode -->
	<StationTabs
		{services}
		activeId={service.id}
		mode="navigate"
	/>

	<article class="detail-article">
		<!-- Hero — full width -->
		<div class="hero-area">
			<a
				href="/services"
				class="back-link"
				use:boop={{ scale: 1.05, timing: 200 }}
			>
				{resolveLocale(labels.backLink, 'en')}
			</a>

			<header class="hero-layout" use:reveal={{ direction: 'up', delay: 0 }}>
				<!-- SVG in rounded morph box -->
				{#if svgContent}
					<button
						type="button"
						class="hero-svg-box {svgMorphed ? 'morphed' : ''}"
						data-testid="service-detail-svg"
						onmouseenter={() => svgMorphed = true}
						onmouseleave={() => svgMorphed = false}
						onclick={() => svgMorphed = !svgMorphed}
						aria-label="Service illustration"
					>
						<div class="svg-inner">
							{@html svgContent}
						</div>
					</button>
				{/if}

				<div class="hero-text">
					<span class="station-counter label-section font-semibold">
						{resolveLocale(labels.serviceCounter, 'en')} {stationNum} / {totalStr}
					</span>

					<h1 class="detail-title">
						{title}<span class="title-dot">.</span>
					</h1>

					{#if subtitle}
						<p class="detail-subtitle">{subtitle}</p>
					{/if}

					<p class="detail-description">{description}</p>

					{#if service.stack && service.stack.length > 0}
						<div class="stack-area" use:reveal={{ direction: 'up', delay: 80 }}>
							<DataFlowDiagram stack={service.stack} size="lg" />
						</div>
					{/if}
				</div>
			</header>

			<Separator variant="gradient" />
		</div>

		<!-- Centered content area — exact WorkDetailPage section pattern -->
		<div class="centered-content">
			<!-- Value Proposition -->
			{#if service.valueProposition}
				<div use:reveal={{ direction: 'up', delay: 100 }}>
					<CollapsibleSection title={resolveLocale(labels.valueProposition, 'en')} open={true}>
						{#snippet icon()}
							<svg class="h-4 w-4 shrink-0 text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<circle cx="8" cy="8" r="2.5" />
								<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
							</svg>
						{/snippet}
						<p class="text-sm leading-relaxed text-text-light md:text-base">
							{resolveLocale(service.valueProposition, 'en')}
						</p>
					</CollapsibleSection>
				</div>
			{/if}

			<!-- Deliverables -->
			{#if service.deliverables && service.deliverables.length > 0}
				<div use:reveal={{ direction: 'up', delay: 150 }}>
					<CollapsibleSection title={resolveLocale(labels.deliverables, 'en')} open={true}>
						{#snippet icon()}
							<svg class="h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
							</svg>
						{/snippet}
						<div class="deliverables-grid">
							{#each service.deliverables as deliverable}
								<div class="deliverable-item">
									<span class="deliverable-dot" aria-hidden="true"></span>
									<span class="text-sm text-text-light">{resolveLocale(deliverable, 'en')}</span>
								</div>
							{/each}
						</div>
					</CollapsibleSection>
				</div>
			{/if}

			<!-- Custom sections — numbered, collapsed by default -->
			{#if service.sections}
				{#each service.sections as section, i}
					<div use:reveal={{ direction: 'up', delay: 200 + i * 80 }}>
						<CollapsibleSection title={resolveLocale(section.title, 'en')} open={true} index={i}>
							<p class="text-sm leading-relaxed text-text-light">
								{resolveLocale(section.content, 'en')}
							</p>
						</CollapsibleSection>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Related Projects -->
		{#if relatedProjects.length > 0}
			<div class="centered-content" style="margin-top: 2.5rem;">
				<div class="related-header" use:reveal={{ direction: 'up', delay: 100 }}>
					<h2 class="related-title">{resolveLocale(labels.builtWith, 'en')} {title}</h2>
					<a href="/work" class="related-link">{resolveLocale(labels.seeAllWork, 'en')}</a>
				</div>

				<div class="projects-grid">
					{#each relatedProjects as project, i}
						<ProjectMiniCard {project} index={i} />
					{/each}
				</div>
			</div>
		{/if}

		<!-- Prev/Next Nav — centered -->
		<div class="centered-content">
			<ServiceNav {prev} {next} />
		</div>
	</article>
</div>

<style>
	.service-detail {
		background: var(--background);
		min-height: 100dvh;
	}

	.detail-article {
		padding-bottom: 4rem;
	}

	/* Hero area — full width with fluid gutters */
	.hero-area {
		padding: 2rem var(--space-page-x) 0;
	}

	.back-link {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--primary);
		text-decoration: none;
		margin-bottom: 1.5rem;
		transition: opacity var(--duration-fast);
	}
	.back-link:hover { text-decoration: underline; }

	.hero-layout {
		display: flex;
		align-items: flex-start;
		gap: 3rem;
	}

	@media (max-width: 767px) {
		.hero-area { padding: 1.5rem var(--space-page-x) 0; }
		.hero-layout {
			flex-direction: column;
			align-items: center;
		}
	}

	/* SVG morph box — same as listing page */
	.hero-svg-box {
		flex: 0 0 200px;
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 1.25rem;
		border: 1px solid var(--border);
		background: var(--card);
		padding: 2rem;
		cursor: pointer;
		transition: transform var(--duration-slower) var(--ease-bounce),
		            border-color var(--duration-slow) var(--ease-default),
		            border-radius var(--duration-slower) var(--ease-bounce),
		            box-shadow 0.4s var(--ease-default);
	}
	.hero-svg-box:hover,
	.hero-svg-box:global(.morphed) {
		border-color: var(--primary);
		border-radius: 50%;
		transform: scale(1.06) rotate(3deg);
		box-shadow: var(--shadow-glow-lg);
	}

	@media (max-width: 767px) {
		.hero-svg-box {
			flex: none;
			width: 140px;
			height: 140px;
			padding: 1.25rem;
		}
	}

	.svg-inner {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.svg-inner :global(svg) {
		width: 100%;
		height: 100%;
	}

	.hero-text { flex: 1; min-width: 0; }

	.station-counter {
		display: block;
		color: var(--primary);
		margin-bottom: 0.75rem;
	}

	.detail-title {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 3.5vw, 3rem);
		font-weight: 800;
		color: var(--foreground);
		line-height: 1.1;
		margin-bottom: 0.5rem;
	}
	.title-dot { color: var(--primary); }

	.detail-subtitle {
		font-size: 1rem;
		color: var(--muted-foreground);
		margin-bottom: 0.75rem;
		font-style: italic;
	}

	.detail-description {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--secondary-foreground);
		max-width: 60ch;
	}

	.stack-area { margin-top: 1.25rem; }

	/* Centered content — uses container-wide for sidebar layout */
	.centered-content {
		max-width: var(--container-wide);
		margin: 0 auto;
		padding: 0 var(--space-page-x);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}

	/* Deliverables grid */
	.deliverables-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.625rem;
	}
	@media (min-width: 768px) {
		.deliverables-grid { grid-template-columns: 1fr 1fr; }
	}

	.deliverable-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--light-foreground);
	}

	.deliverable-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}

	/* Related projects section */

	.related-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.related-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.related-link {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--primary);
		text-decoration: none;
	}
	.related-link:hover { text-decoration: underline; }

	.projects-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}
	@media (min-width: 768px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (min-width: 1024px) { .projects-grid { grid-template-columns: repeat(3, 1fr); } }

	/* ProjectMiniCard handles its own styling */
</style>
