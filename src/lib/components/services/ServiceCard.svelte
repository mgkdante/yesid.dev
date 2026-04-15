<!--
  ServiceCard — per-viewport service block for the /services listing page.
  Asymmetric split: text left, SVG panel right (stacked on mobile).
  Bold orange accents, benefit headline, impact metric. D186.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { SectionLabel } from '$lib/components/brand';
	import ServiceSvgPanel from './ServiceSvgPanel.svelte';
	import { cn } from '$lib/utils.js';

	export interface ServiceCardProps {
		/** The service data to display */
		service: Service;
		/** Raw SVG content for the service illustration */
		svgContent: string;
		/** Position index (0-based) in the listing */
		index: number;
		/** Total number of services */
		total: number;
		class?: string;
		[key: string]: unknown;
	}

	let {
		service,
		svgContent,
		index,
		total,
		class: className = '',
		...rest
	}: ServiceCardProps = $props();

	let stationNum = $derived(String(service.station).padStart(2, '0'));
	let totalStr = $derived(String(total).padStart(2, '0'));
	let title = $derived(resolveLocale(service.title, 'en'));
	let description = $derived(resolveLocale(service.description, 'en'));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, 'en') : null);
	let benefitHeadline = $derived(
		service.benefitHeadline ? resolveLocale(service.benefitHeadline, 'en') : null
	);
	let metricValue = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.value, 'en') : null
	);
	let metricLabel = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.label, 'en') : null
	);
</script>

<section
	class={cn('service-viewport', className)}
	data-testid="service-card-{service.id}"
	id="service-{service.id}"
	{...rest}
>
	<div class="viewport-inner">
		<!-- Text content -->
		<div class="service-text">
			<SectionLabel text="Service {stationNum} / {totalStr}" variant="station" class="mb-4 block" />

			<h2 class="service-title">
				{title}<span class="title-dot">.</span>
			</h2>

			{#if subtitle}
				<p class="service-subtitle">{subtitle}</p>
			{/if}

			{#if benefitHeadline}
				<p class="benefit-headline">{benefitHeadline}</p>
			{/if}

			<p class="service-description">{description}</p>

			{#if service.stack && service.stack.length > 0}
				<div class="stack-pills">
					{#each service.stack as tech}
						<span class="stack-pill">{tech}</span>
					{/each}
				</div>
			{/if}

			<div class="cta-row">
				{#if metricValue}
					<div class="metric-inline">
						<span class="metric-value">{metricValue}</span>
						{#if metricLabel}
							<span class="metric-label">{metricLabel}</span>
						{/if}
					</div>
				{/if}

				<a href="/services/{service.id}" class="deep-dive-cta">
					Deep dive &rarr;
				</a>
			</div>
		</div>

		<!-- Single SVG panel — responsive via CSS -->
		{#if svgContent}
			<ServiceSvgPanel {svgContent} class="svg-panel-responsive" />
		{/if}
	</div>
</section>

<style>
	.service-viewport {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100svh;
		padding: 0 var(--space-page-x);
		scroll-snap-align: start;
		overflow: hidden;
	}

	@media (min-width: 1024px) {
		.service-viewport {
			height: 100dvh;
		}
	}

	.viewport-inner {
		display: flex;
		align-items: center;
		gap: clamp(2rem, 4vw, 4rem);
		width: 100%;
		min-height: 0;
	}

	.service-text {
		flex: 1;
		min-width: 0;
	}

	.service-title {
		font-family: var(--font-heading);
		font-size: clamp(44px, 5vw, 64px);
		font-weight: 900;
		color: var(--foreground);
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin-bottom: 0.5rem;
	}

	.title-dot { color: var(--primary); }

	.service-subtitle {
		font-size: var(--text-heading);
		color: var(--primary);
		margin-bottom: 1rem;
		font-style: italic;
	}

	.benefit-headline {
		font-size: clamp(18px, 2.5vw, 24px);
		font-weight: 600;
		color: var(--foreground);
		line-height: 1.3;
		margin-bottom: 1rem;
	}

	.service-description {
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--secondary-foreground);
		max-width: 55ch;
		margin-bottom: var(--space-stack);
	}

	.stack-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: var(--space-stack);
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

	.cta-row {
		display: flex;
		align-items: center;
		gap: clamp(1.5rem, 3vw, 3rem);
		flex-wrap: wrap;
	}

	.metric-inline {
		display: flex;
		align-items: baseline;
		gap: var(--space-cluster);
	}

	.metric-value {
		font-size: clamp(36px, 4vw, 48px);
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
	}

	.metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.deep-dive-cta {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		font-weight: 700;
		color: var(--background);
		background: var(--primary);
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: opacity var(--duration-fast);
	}
	.deep-dive-cta:hover {
		opacity: 0.85;
	}

	/* SVG panel: responsive sizing */
	:global(.svg-panel-responsive) {
		flex-shrink: 0;
	}

	/* Mobile: compact layout to fit within 100svh */
	@media (max-width: 767px) {
		.service-viewport {
			justify-content: flex-start;
			padding-top: 1.5rem;
		}
		.viewport-inner {
			flex-direction: row;
			align-items: flex-start;
			gap: var(--space-cluster);
		}
		:global(.svg-panel-responsive) {
			width: 80px;
			min-width: 80px;
			padding: 0.5rem;
		}
		:global(.svg-panel-responsive [data-slot="svg-icon"]) {
			--svg-icon-size: 56px;
			width: 56px;
			height: 56px;
		}
		.service-subtitle {
			display: none;
		}
		.service-description {
			max-width: none;
			font-size: var(--text-small);
			line-height: 1.5;
			margin-bottom: 0.75rem;
		}
		.service-title {
			font-size: clamp(28px, 7vw, 36px);
			margin-bottom: 0.25rem;
		}
		.benefit-headline {
			font-size: var(--text-body);
			margin-bottom: 0.5rem;
		}
		.stack-pills {
			margin-bottom: 0.75rem;
		}
		.stack-pill {
			font-size: var(--text-micro);
			padding: 0.125rem 0.5rem;
		}
		.metric-value {
			font-size: clamp(28px, 6vw, 36px);
		}
		.deep-dive-cta {
			padding: 0.5rem 1rem;
			font-size: var(--text-caption);
		}
	}
</style>
