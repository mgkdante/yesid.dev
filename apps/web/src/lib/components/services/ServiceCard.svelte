<!--
  ServiceCard — per-viewport service block for the /services listing page.
  Asymmetric split: text left, SVG panel right (stacked on mobile).
  Bold orange accents, benefit headline, impact metric. D186.
-->
<script lang="ts">
	import type { Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';
	import { SectionLabel } from '@yesid/ui/brand';
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
		resolveLocale(siteLabels.servicesChrome.listing.stationLabelTemplate, locale)
			.replace('{stationNum}', stationNum)
			.replace('{totalStr}', totalStr)
	);
	let deepDiveLabel = $derived(resolveLocale(siteLabels.servicesChrome.listing.deepDiveLabel, locale));
	let title = $derived(resolveLocale(service.title, locale));
	let description = $derived(resolveLocale(service.description, locale));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, locale) : null);
	let benefitHeadline = $derived(
		service.benefitHeadline ? resolveLocale(service.benefitHeadline, locale) : null
	);
	let metricValue = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.value, locale) : null
	);
	let metricLabel = $derived(
		service.impactMetric ? resolveLocale(service.impactMetric.label, locale) : null
	);
</script>

<section
	class={cn('service-viewport', index === 0 && 'service-viewport-first', className)}
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
				<a href={localizeHref(`/services/${service.id}`, locale)} class="deep-dive-cta desktop-only tap-press" use:pressBounce>
					{deepDiveLabel}
				</a>
			</div>
		</div>

		<!-- Mobile-only SVG banner — operator order: metric → art → deep dive.
		     The text column above ends on the metric; the CTA row closes below. -->
		{#if svgContent}
			<div class="svg-mobile-banner">
				<ServiceSvgPanel {svgContent} variant="banner" />
			</div>
		{/if}

		<!-- Mobile: full-width deep-dive CTA. Desktop: SVG panel only. -->
		<div class="card-bottom">
			<a href={localizeHref(`/services/${service.id}`, locale)} class="deep-dive-cta mobile-only tap-press" use:pressBounce>
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

	@media (--desktop-min) {
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
		/* Original distance restored — the giant title (below) fills the row so the
		   text no longer floats far from the SVG panel. */
		gap: clamp(2rem, 4vw, 4rem);
		width: 100%;
	}

	.service-text {
		flex: 1;
		min-width: 0;
	}

	/* Giant — matches the detail page's hero title size. */
	.service-title {
		font-family: var(--font-heading);
		font-size: clamp(56px, 8vw, 104px);
		font-weight: 900;
		color: var(--foreground);
		line-height: 1.02;
		letter-spacing: -0.035em;
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
		font-size: clamp(20px, 2.6vw, 26px);
		font-weight: 600;
		color: var(--foreground);
		line-height: 1.3;
		margin-bottom: 1.5rem;
	}

	.service-description {
		font-size: clamp(18px, 1.5vw, 22px);
		line-height: 1.6;
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

	/* Mobile-only banner — hidden from tablet up (desktop keeps the side panel). */
	@media (--tablet-min) {
		.svg-mobile-banner {
			display: none;
		}
	}

	/* Desktop CTA visible, mobile CTA hidden — combined selector beats .deep-dive-cta */
	.deep-dive-cta.mobile-only { display: none; }
	.deep-dive-cta.desktop-only { display: inline-block; }

	.metric-inline {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	/* Round-4 doctrine: metric/number callouts speak the YELLOW voice
	   (accent-text = AA amber both modes); the CTA next to it stays orange. */
	.metric-value {
		font-size: clamp(44px, 5vw, 60px);
		font-weight: 900;
		color: var(--accent-text);
		line-height: 1;
	}

	.metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--accent-text);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.deep-dive-cta {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: var(--text-subheading);
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
		box-shadow: 0 4px 20px color-mix(in srgb, var(--glow) 40%, transparent);
	}

	/* SVG panel: responsive sizing */
	:global(.svg-panel-responsive) {
		flex-shrink: 0;
	}

	/* Mobile: card = usable area height, SVG stacked on top, flex centered.
	   scroll-margin-top aligns tab clicks below the sticky tabs. */
	@media (--tablet-max) {
		.service-viewport {
			height: auto;
			min-height: 0;
			padding-block: clamp(4rem, 14svh, 7rem);
			margin-bottom: clamp(3rem, 12svh, 6rem);
			scroll-margin-top: 8.75rem;
			scroll-snap-align: none;
		}
		.service-viewport-first {
			padding-block-start: clamp(1.5rem, 5svh, 3rem);
		}
		.viewport-inner {
			position: static;
			top: auto;
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}
		/* Swap CTA visibility */
		.deep-dive-cta.desktop-only { display: none; }
		.deep-dive-cta.mobile-only { display: inline-block; }
		/* The side panel belongs to desktop — mobile gets the banner above. */
		.card-bottom :global(.svg-panel-responsive) {
			display: none;
		}
		/* Deep dive closes the card as a full-width tappable bar. */
		.card-bottom {
			display: flex;
		}
		.deep-dive-cta.mobile-only {
			flex: 1;
			text-align: center;
		}
		/* Banner icon bounded so the capped viewport keeps its rhythm. */
		.svg-mobile-banner :global([data-slot='svg-icon']) {
			--svg-icon-size: 96px;
			width: 96px;
			height: 96px;
		}
		.service-subtitle {
			display: none;
		}
		.service-description {
			max-width: none;
			font-size: var(--text-body);
			line-height: 1.55;
			margin-bottom: 1rem;
		}
		/* Big on mobile too — matches the detail page's mobile title size. */
		.service-title {
			font-size: clamp(40px, 11vw, 60px);
			margin-bottom: 0.5rem;
		}
		.benefit-headline {
			font-size: var(--text-subheading);
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
			font-size: clamp(34px, 8vw, 46px);
		}
		.deep-dive-cta {
			padding: 1rem 1.5rem;
			font-size: var(--text-body);
			min-height: 44px;
		}
	}
</style>
