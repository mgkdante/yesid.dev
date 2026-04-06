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
					<span class="station-counter">
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

			<div class="gradient-divider"></div>
		</div>

		<!-- Centered content area — exact WorkDetailPage section pattern -->
		<div class="centered-content">
			<!-- Value Proposition -->
			{#if service.valueProposition}
				<div use:reveal={{ direction: 'up', delay: 100 }}>
					<CollapsibleSection title={resolveLocale(labels.valueProposition, 'en')} open={true}>
						{#snippet icon()}
							<svg class="h-4 w-4 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<circle cx="8" cy="8" r="2.5" />
								<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
							</svg>
						{/snippet}
						<p class="text-sm leading-relaxed text-[#ccc] md:text-base">
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
							<svg class="h-4 w-4 shrink-0 text-[#E07800]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
							</svg>
						{/snippet}
						<div class="deliverables-grid">
							{#each service.deliverables as deliverable}
								<div class="deliverable-item">
									<span class="deliverable-dot" aria-hidden="true"></span>
									<span class="text-sm text-[#ccc]">{resolveLocale(deliverable, 'en')}</span>
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
							<p class="text-sm leading-relaxed text-[#ccc]">
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
		background: var(--bg-primary, #141414);
		min-height: 100vh;
	}

	.detail-article {
		padding-bottom: 4rem;
	}

	/* Hero area — full width with padding */
	.hero-area {
		padding: 2rem 3rem 0;
	}
	@media (min-width: 1024px) {
		.hero-area { padding: 2rem 5rem 0; }
	}

	.back-link {
		display: inline-block;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #E07800;
		text-decoration: none;
		margin-bottom: 1.5rem;
		transition: opacity 0.15s;
	}
	.back-link:hover { text-decoration: underline; }

	.hero-layout {
		display: flex;
		align-items: flex-start;
		gap: 3rem;
	}

	@media (max-width: 767px) {
		.hero-area { padding: 1.5rem 1.25rem 0; }
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
		border: 1px solid var(--border, #1a1a1a);
		background: #1a1a1a;
		padding: 2rem;
		cursor: pointer;
		transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
		            border-color 0.3s ease,
		            border-radius 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
		            box-shadow 0.4s ease;
	}
	.hero-svg-box:hover,
	.hero-svg-box:global(.morphed) {
		border-color: #E07800;
		border-radius: 50%;
		transform: scale(1.06) rotate(3deg);
		box-shadow: 0 0 24px rgba(224, 120, 0, 0.2), 0 0 60px rgba(224, 120, 0, 0.08);
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
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #E07800;
		margin-bottom: 0.75rem;
	}

	.detail-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(1.75rem, 3.5vw, 3rem);
		font-weight: 800;
		color: var(--text-primary, #f5f5f0);
		line-height: 1.1;
		margin-bottom: 0.5rem;
	}
	.title-dot { color: #E07800; }

	.detail-subtitle {
		font-size: 1rem;
		color: #555;
		margin-bottom: 0.75rem;
		font-style: italic;
	}

	.detail-description {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--text-secondary, #999);
		max-width: 60ch;
	}

	.stack-area { margin-top: 1.25rem; }

	.gradient-divider {
		height: 2px;
		border-radius: 999px;
		margin-top: 2rem;
		background: linear-gradient(90deg, #E07800 0%, #FFB627 40%, #2a2a2a 100%);
	}

	/* Centered content — same max-w-6xl as WorkDetailPage */
	.centered-content {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}
	@media (min-width: 768px) {
		.centered-content { padding: 0 2rem; }
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
		color: #ccc;
	}

	.deliverable-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #E07800;
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
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary, #f5f5f0);
	}

	.related-link {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #E07800;
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
