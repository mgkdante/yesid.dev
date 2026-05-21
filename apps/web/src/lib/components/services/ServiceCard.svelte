<!--
  ServiceCard — per-viewport service block for the /services listing page.
  Asymmetric split: text left, SVG panel right (stacked on mobile).
  Bold orange accents, benefit headline, impact metric. D186.
-->
<script lang="ts">
	import type { Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { servicesListingContent } from '$lib/content/services';
	import { SectionLabel } from '$lib/components/brand';
	import ServiceSvgPanel from './ServiceSvgPanel.svelte';
	import { cn } from '$lib/utils';
	import { pressBounce } from '$lib/motion/actions';

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
	let stationLabelText = $derived(
		resolveLocale(servicesListingContent.stationLabelTemplate, 'en')
			.replace('{stationNum}', stationNum)
			.replace('{totalStr}', totalStr)
	);
	let deepDiveLabel = $derived(resolveLocale(servicesListingContent.deepDiveLabel, 'en'));
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
			<SectionLabel text={stationLabelText} variant="station" class="mb-4 block" />

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

				<!-- Desktop CTA — hidden on mobile -->
				<a href="/services/{service.id}" class="deep-dive-cta desktop-only tap-press" use:pressBounce>
					{deepDiveLabel}
				</a>
			</div>
		</div>

		<!-- Mobile: CTA + SVG side by side. Desktop: SVG panel only. -->
		<div class="card-bottom">
			<a href="/services/{service.id}" class="deep-dive-cta mobile-only tap-press" use:pressBounce>
				{deepDiveLabel}
			</a>
			{#if svgContent}
				<ServiceSvgPanel {svgContent} class="svg-panel-responsive" />
			{/if}
		</div>
	</div>
</section>

<style>
	.service-viewport {
		height: 100svh;
		padding-inline: var(--space-page-x);
		scroll-snap-align: start;
	}

	@media (min-width: 1024px) {
		.service-viewport {
			height: 100dvh;
		}
	}

	/* Sticky inner centers content in the usable viewport area between
	   the sticky tabs (top ~9rem) and projects strip (bottom ~3.5rem).
	   top = usable-center minus estimated half-content-height.
	   Works at every scroll position — no scroll-to hack needed. */
	.viewport-inner {
		position: sticky;
		top: calc(50dvh - 13rem);
		display: flex;
		align-items: center;
		gap: clamp(2rem, 4vw, 4rem);
		width: 100%;
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
		margin-bottom: 1rem;
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
		margin-bottom: 1.5rem;
	}

	.service-description {
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--secondary-foreground);
		max-width: 55ch;
		margin-bottom: 1.5rem;
	}

	.stack-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
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

	/* Desktop: card-bottom is just the SVG panel */
	.card-bottom {
		flex-shrink: 0;
		overflow: hidden; /* clips SVG during initial render — prevents size flash */
	}

	/* Desktop CTA visible, mobile CTA hidden — combined selector beats .deep-dive-cta */
	.deep-dive-cta.mobile-only { display: none; }
	.deep-dive-cta.desktop-only { display: inline-block; }

	.metric-inline {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
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
		font-size: var(--text-body);
		font-weight: 700;
		color: var(--background);
		background: var(--primary);
		padding: 1rem 2.5rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		letter-spacing: 0.5px;
		transition: transform var(--duration-fast), box-shadow var(--duration-fast);
	}
	.deep-dive-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px color-mix(in srgb, var(--primary) 40%, transparent);
	}

	/* SVG panel: responsive sizing */
	:global(.svg-panel-responsive) {
		flex-shrink: 0;
	}

	/* Mobile: card = usable area height, SVG stacked on top, flex centered.
	   scroll-margin-top aligns tab clicks below the sticky tabs. */
	@media (max-width: 767px) {
		.service-viewport {
			height: calc(100svh - 12rem);
			display: flex;
			flex-direction: column;
			justify-content: center;
			scroll-margin-top: 8.75rem;
		}
		.viewport-inner {
			position: static;
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		/* Swap CTA visibility */
		.deep-dive-cta.desktop-only { display: none; }
		.deep-dive-cta.mobile-only { display: inline-block; }
		/* CTA + SVG at opposite ends of the row */
		.card-bottom {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
		/* Same card as desktop, just scaled down */
		.card-bottom :global(.svg-panel-responsive) {
			width: 80px;
			min-width: 80px;
			flex-shrink: 0;
		}
		.card-bottom :global(.svg-panel-responsive [data-slot="svg-icon"]) {
			--svg-icon-size: 48px;
			width: 48px;
			height: 48px;
		}
		.service-subtitle {
			display: none;
		}
		.service-description {
			max-width: none;
			font-size: var(--text-small);
			line-height: 1.5;
			margin-bottom: 1rem;
		}
		.service-title {
			font-size: clamp(28px, 7vw, 36px);
			margin-bottom: 0.5rem;
		}
		.benefit-headline {
			font-size: var(--text-body);
			margin-bottom: 1rem;
		}
		.stack-pills {
			margin-bottom: 1rem;
		}
		.stack-pill {
			font-size: var(--text-micro);
			padding: 0.125rem 0.5rem;
		}
		.metric-value {
			font-size: clamp(28px, 6vw, 36px);
		}
		.deep-dive-cta {
			padding: 1rem 1.5rem;
			font-size: var(--text-small);
			min-height: 44px;
		}
	}
</style>
