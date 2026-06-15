<!--
  ServiceDetailPage — consultative deep dive for /services/[id].
  Asymmetric split hero (text left, orange SVG panel right).
  Impact metric column (desktop sticky) + standard CollapsibleSection cards.
  Related projects in right panel (desktop) / bottom list (mobile). D186, D187, D189.
-->
<script lang="ts">
	import type { Service, Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { servicesListingContent, servicesDetailContent } from '$lib/content/services';
	import { projectsListingContent } from '$lib/content/projects';
	import { boop } from '$lib/motion/actions/boop.js';
	import { pressBounce } from '$lib/motion/actions/pressBounce.js';
	import StationTabs from '$lib/components/shared/StationTabs.svelte';
	import ServiceNav from './ServiceNav.svelte';
	import ServiceSvgPanel from './ServiceSvgPanel.svelte';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SectionLabel } from '$lib/components/brand';

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

	let title = $derived(resolveLocale(service.title, locale));
	let description = $derived(resolveLocale(service.description, locale));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, locale) : null);
	let stationNum = $derived(String(service.station).padStart(2, '0'));
	let totalStr = $derived(String(services.length).padStart(2, '0'));
	let stationLabelText = $derived(
		resolveLocale(servicesListingContent.stationLabelTemplate, locale)
			.replace('{stationNum}', stationNum)
			.replace('{totalStr}', totalStr)
	);
	let svgContent = $derived(serviceSvgContents[service.id] ?? '');
	let benefitHeadline = $derived(
		service.benefitHeadline ? resolveLocale(service.benefitHeadline, locale) : null
	);
	let metricValue = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.value, locale) : null
	);
	let metricLabel = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.label, locale) : null
	);
	let backLinkLabel = $derived(resolveLocale(servicesDetailContent.backToServicesLabel, locale));
	let valuePropositionHeading = $derived(
		resolveLocale(servicesDetailContent.valuePropositionHeading, locale)
	);
	let deliverablesHeading = $derived(
		resolveLocale(servicesDetailContent.deliverablesHeading, locale)
	);
	let relatedProjectsHeading = $derived(
		resolveLocale(servicesDetailContent.relatedProjectsHeading, locale)
	);
	let relatedProjectsAria = $derived(
		resolveLocale(servicesDetailContent.relatedProjectsNavAria, locale)
	);
	let seeAllProjectsLabel = $derived(
		resolveLocale(projectsListingContent.seeAllLink, locale)
	);
</script>

<div class="service-detail" data-testid="service-detail-page">
	<!-- Station tabs — navigate mode (orange strip).
	     Round 6: wrapped in the same solid top-band treatment as the
	     /services listing's .tabs-bar — the backdrop ::before paints the
	     nav gap above the tabs solid (was showing the circuit grid here
	     while the listing showed solid background). -->
	<div class="tabs-bar">
		<StationTabs
			{services}
			activeId={service.id}
			mode="navigate"
		/>
	</div>

	<article class="detail-article">
		<!-- Hero — asymmetric split: text left, SVG right -->
		<div class="hero-area">
			<a
				href={localizeHref('/services', locale)}
				class="back-link tap-feedback inline-flex items-center min-h-11 px-2"
				use:boop={{ scale: 1.05, timing: 200 }}
			>
				{backLinkLabel}
			</a>

			<header class="hero-grid">
				<!-- Text column -->
				<div class="hero-text">
					<SectionLabel text={stationLabelText} variant="station" class="mb-4 block" />

					<h1 class="detail-title">
						{title}<span class="title-dot">.</span>
					</h1>

					{#if subtitle}
						<p class="detail-subtitle">{subtitle}</p>
					{/if}

					<p class="detail-description">{description}</p>

					{#if service.stack && service.stack.length > 0}
						<div class="stack-pills">
							{#each service.stack as tech}
								<span class="stack-pill">{tech}</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- SVG panel — desktop/tablet only (wrapper controls visibility).
				     Operator pass 2: text leads the detail hero, art sits to the
				     right on desktop — morph on hover AND tap, both themes. -->
				{#if svgContent}
					<div class="svg-desktop">
						<ServiceSvgPanel {svgContent} />
					</div>
				{/if}
			</header>

			<!-- SVG banner — mobile only (wrapper controls visibility) -->
			{#if svgContent}
				<div class="svg-mobile">
					<ServiceSvgPanel {svgContent} variant="banner" />
				</div>
			{/if}
		</div>

		<Separator variant="hazard" />

		<!-- Body: impact column | content sections | projects panel -->
		<div class="body-area">
			<div class="body-grid">
				<!-- Impact metric column — desktop only, sticky -->
				{#if metricValue}
					<aside class="impact-column">
						<div class="impact-metric">
							<span class="impact-value">{metricValue}</span>
							{#if metricLabel}
								<span class="impact-label">{metricLabel}</span>
							{/if}
						</div>
						{#if benefitHeadline}
							<div class="impact-separator" aria-hidden="true"></div>
							<p class="benefit-headline">{benefitHeadline}</p>
						{/if}
					</aside>
				{/if}

				<!-- Content sections -->
				<div class="sections">
					<!-- Mobile-only inline metric -->
					{#if metricValue}
						<div class="metric-inline">
							<span class="metric-inline-value">{metricValue}</span>
							{#if metricLabel}
								<span class="metric-inline-label">{metricLabel}</span>
							{/if}
							{#if benefitHeadline}
								<p class="metric-inline-headline">{benefitHeadline}</p>
							{/if}
						</div>
					{/if}

					<!-- Value Proposition -->
					{#if service.valueProposition}
						<div>
							<CollapsibleSection title={valuePropositionHeading} sectionKey="svc-valueprop" open={true}>
								{#snippet icon()}
									<svg class="h-4 w-4 shrink-0 text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<circle cx="8" cy="8" r="2.5" />
										<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
									</svg>
								{/snippet}
								<p class="section-body">
									{resolveLocale(service.valueProposition, locale)}
								</p>
							</CollapsibleSection>
						</div>
					{/if}

					<!-- Deliverables -->
					{#if service.deliverables && service.deliverables.length > 0}
						<div>
							<CollapsibleSection title={deliverablesHeading} sectionKey="svc-deliverables" open={true}>
								{#snippet icon()}
									<svg class="h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
										<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
									</svg>
								{/snippet}
								<div class="deliverables-grid">
									{#each service.deliverables as deliverable}
										<div class="deliverable-item">
											<span class="deliverable-dot" aria-hidden="true"></span>
											<span>{resolveLocale(deliverable, locale)}</span>
										</div>
									{/each}
								</div>
							</CollapsibleSection>
						</div>
					{/if}

					<!-- Custom sections -->
					{#if service.sections}
						{#each service.sections as section, i}
							<div>
								<CollapsibleSection title={resolveLocale(section.title, locale)} sectionKey="svc-section-{i}" open={true} index={i}>
									<p class="section-body">
										{resolveLocale(section.content, locale)}
									</p>
								</CollapsibleSection>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Related projects — right panel (desktop), hidden on mobile -->
				{#if relatedProjects.length > 0}
					<aside class="projects-panel">
						<CollapsibleSection
							title="{relatedProjectsHeading} ({relatedProjects.length})"
							sectionKey="svc-related-desktop"
							open={true}
						>
							{#snippet icon()}
								<span class="projects-count">{relatedProjects.length}</span>
							{/snippet}
							<nav class="projects-list" aria-label={relatedProjectsAria}>
								{#each relatedProjects as project}
									<a
										href={localizeHref(`/projects/${project.slug}`, locale)}
										class="project-link tap-press"
										use:boop={{ scale: 1.02, timing: 150 }}
										use:pressBounce
									>
										<span class="project-dot" aria-hidden="true"></span>
										<span class="project-name">{resolveLocale(project.title, locale)}</span>
									</a>
								{/each}
							</nav>
							<a href={localizeHref('/projects', locale)} class="projects-all tap-feedback">
								{seeAllProjectsLabel}
							</a>
						</CollapsibleSection>
					</aside>
				{/if}
			</div>
		</div>

		<!-- Related projects — mobile only, before prev/next -->
		{#if relatedProjects.length > 0}
			<div class="projects-mobile">
				<CollapsibleSection
					title="{relatedProjectsHeading} ({relatedProjects.length})"
					sectionKey="svc-related-mobile"
					open={true}
				>
					{#snippet icon()}
						<span class="projects-count">{relatedProjects.length}</span>
					{/snippet}
					<nav class="projects-list" aria-label={relatedProjectsAria}>
						{#each relatedProjects as project}
							<a
								href={localizeHref(`/projects/${project.slug}`, locale)}
								class="project-link tap-press"
								use:boop={{ scale: 1.02, timing: 150 }}
								use:pressBounce
							>
								<span class="project-dot" aria-hidden="true"></span>
								<span class="project-name">{resolveLocale(project.title, locale)}</span>
							</a>
						{/each}
					</nav>
					<a href={localizeHref('/projects', locale)} class="projects-all tap-feedback">
						{seeAllProjectsLabel}
					</a>
				</CollapsibleSection>
			</div>
		{/if}

		<!-- Prev/Next Nav -->
		<div class="nav-area">
			<ServiceNav {prev} {next} />
		</div>
	</article>
</div>

<style>
	.service-detail {
		/* transparent so the root .circuit-grid shows through, matching /projects */
		min-height: 100dvh;
	}

	.detail-article {
		padding-bottom: 0;
	}

	/* ── Top band (round 6) ── */

	/* Solid backdrop above the tabs — identical treatment to the /services
	   listing's .tabs-bar::before: covers the nav gap (main's pt-20 strip)
	   so the page top reads as the same solid band on both routes. The
	   detail tabs are not sticky, so no position: sticky here — just the
	   positioning anchor for the backdrop. */
	.tabs-bar {
		position: relative;
	}

	.tabs-bar::before {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: 100%;
		height: calc(5rem + env(safe-area-inset-top, 0px) + 1rem);
		background: var(--background);
		pointer-events: none;
	}

	/* ── Hero ── */

	.hero-area {
		padding: 2rem var(--space-page-x) 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--primary);
		text-decoration: none;
		margin-bottom: 1.5rem;
		margin-left: -0.5rem; /* compensate px-2 so text stays visually flush */
		min-height: 2.75rem; /* 44px touch target */
		padding-inline: 0.5rem;
		transition: opacity var(--duration-fast);
	}
	.back-link:hover {
		text-decoration: underline;
	}

	/* Desktop: text left, SVG panel right */
	.hero-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	@media (min-width: 768px) {
		.hero-grid {
			display: grid;
			grid-template-columns: 1fr auto;
			gap: clamp(2rem, 4vw, 4rem);
			align-items: start;
		}
	}

	/* SVG visibility: wrapper divs control show/hide cleanly */
	.svg-desktop {
		display: none;
	}
	@media (min-width: 768px) {
		.svg-desktop {
			display: block;
		}
	}

	.svg-mobile {
		margin-top: 1.5rem;
	}
	@media (min-width: 768px) {
		.svg-mobile {
			display: none;
		}
	}

	.hero-text {
		min-width: 0;
	}

	.detail-title {
		font-family: var(--font-heading);
		font-size: clamp(32px, 4vw, 56px);
		font-weight: 900;
		color: var(--foreground);
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin-bottom: 0.5rem;
	}

	.title-dot {
		color: var(--primary);
	}

	.detail-subtitle {
		font-size: var(--text-heading);
		color: var(--primary);
		margin-bottom: 1rem;
		font-style: italic;
	}

	.detail-description {
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--secondary-foreground);
		max-width: 60ch;
		margin-bottom: 1.5rem;
	}

	/* Stack pills — orange border + text (matches ServiceCard) */
	.stack-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.stack-pill {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		padding: 0.25rem 0.625rem;
		border: 1.5px solid var(--primary);
		border-radius: var(--radius-pill);
		color: var(--primary);
		background: transparent;
		cursor: default;
	}

	/* ── Body area ── */

	.body-area {
		padding: 2rem var(--space-page-x) 0;
	}

	.body-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.body-grid {
			display: grid;
			grid-template-columns: 1fr 2fr 1fr;
			gap: clamp(1.25rem, 2vw, 2.5rem);
			align-items: start;
		}
	}

	/* ── Impact column (desktop only, sticky) ── */

	.impact-column {
		display: none;
	}

	@media (min-width: 1024px) {
		.impact-column {
			display: flex;
			flex-direction: column;
			position: sticky;
			top: calc(5rem + 4rem + 2rem);
		}
	}

	.impact-metric {
		display: flex;
		flex-direction: column;
	}

	/* Round-4 doctrine: the impact metric is a number callout — the YELLOW
	   wayfinding voice (accent-text = AA amber both modes). */
	.impact-value {
		font-family: var(--font-heading);
		font-size: clamp(88px, 10vw, 140px);
		font-weight: 900;
		color: var(--accent-text);
		line-height: 0.8;
		letter-spacing: -0.05em;
	}

	.impact-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--accent-text);
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-top: 0.5rem;
	}

	.impact-separator {
		width: 2.5rem;
		height: 2px;
		background: color-mix(in srgb, var(--primary) 40%, transparent);
		margin-block: 1.5rem;
	}

	.benefit-headline {
		font-size: var(--text-body);
		font-weight: 500;
		color: var(--secondary-foreground);
		line-height: 1.5;
	}

	/* ── Mobile inline metric (below 1024px) ── */

	.metric-inline {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 0.5rem;
	}

	@media (min-width: 1024px) {
		.metric-inline {
			display: none;
		}
	}

	/* Round-4 doctrine: mobile metric callout = YELLOW voice too. */
	.metric-inline-value {
		font-family: var(--font-heading);
		font-size: clamp(32px, 5vw, 40px);
		font-weight: 900;
		color: var(--accent-text);
		line-height: 1;
	}

	.metric-inline-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--accent-text);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.metric-inline-headline {
		flex-basis: 100%;
		font-size: var(--text-small);
		color: var(--secondary-foreground);
		line-height: 1.5;
		margin-top: 0.25rem;
	}

	/* ── Sections ── */

	.sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-body {
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--secondary-foreground);
	}

	/* Deliverables grid */
	.deliverables-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.625rem;
	}
	@media (min-width: 768px) {
		.deliverables-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.deliverable-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--text-small);
		color: var(--secondary-foreground);
	}

	.deliverable-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}

	/* ── Related projects panel (desktop right column) ── */

	.projects-panel {
		display: none;
	}

	@media (min-width: 1024px) {
		.projects-panel {
			display: block;
			position: sticky;
			top: calc(5rem + 4rem + 2rem);
		}
	}

	.projects-count {
		font-family: var(--font-mono);
		font-size: var(--text-micro);
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-pill);
	}

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.project-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		text-decoration: none;
		color: var(--foreground);
		font-size: var(--text-body);
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: background var(--duration-fast), color var(--duration-fast);
	}
	.project-link:hover {
		background: color-mix(in srgb, var(--primary) 8%, transparent);
	}
	.project-link:hover .project-name {
		color: var(--primary);
	}

	.project-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}

	.project-name {
		transition: color var(--duration-fast);
	}

	.projects-all {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--primary);
		text-decoration: none;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-subtle);
		transition: opacity var(--duration-fast);
	}
	.projects-all:hover {
		text-decoration: underline;
	}

	/* ── Related projects mobile (bottom of page) ── */

	.projects-mobile {
		padding: 1.5rem var(--space-page-x);
	}

	@media (min-width: 1024px) {
		.projects-mobile {
			display: none;
		}
	}

	/* ── Nav area ── */

	.nav-area {
		padding: 0 var(--space-page-x);
	}

	/* ── Mobile adjustments ── */

	@media (max-width: 767px) {
		.hero-area {
			padding: 1.5rem var(--space-page-x) 1.5rem;
		}

		.detail-title {
			font-size: clamp(28px, 7vw, 36px);
		}

		.detail-subtitle {
			font-size: var(--text-body);
		}

		.detail-description {
			font-size: var(--text-small);
			line-height: 1.5;
			margin-bottom: 1rem;
		}

		.stack-pill {
			font-size: var(--text-micro);
			padding: 0.125rem 0.5rem;
		}
	}
</style>
