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
		resolveLocale(servicesListingContent.stationLabelTemplate, locale)
			.replace('{stationNum}', stationNum)
			.replace('{totalStr}', totalStr)
	);
	let deepDiveLabel = $derived(resolveLocale(servicesListingContent.deepDiveLabel, locale));
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
	let stackLabel = $derived(resolveLocale(servicesListingContent.stackLabel, locale));
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

		<!-- Mobile-only SVG banner (desktop uses the side panel in .card-aside). -->
		{#if svgContent}
			<div class="svg-mobile-banner">
				<ServiceSvgPanel {svgContent} variant="banner" />
			</div>
		{/if}

		<!-- Right rail (desktop): SVG panel on top, collapsible Stack below it.
		     On mobile the SVG here is hidden (the banner above is used); this row
		     contributes the full-width Stack collapsible. -->
		<div class="card-aside">
			{#if svgContent}
				<ServiceSvgPanel {svgContent} class="svg-panel-responsive" />
			{/if}
			{#if service.stack && service.stack.length > 0}
				<details class="stack-panel">
					<summary class="stack-summary">
						<span class="stack-summary-text">{stackLabel}</span>
						<span class="stack-summary-count">{service.stack.length}</span>
						<span class="stack-chevron" aria-hidden="true"></span>
					</summary>
					<div class="stack-pills">
						{#each service.stack as tech}
							<span class="stack-pill">{tech}</span>
						{/each}
					</div>
				</details>
			{/if}
		</div>

		<!-- Mobile-only full-width deep-dive CTA. -->
		<div class="card-bottom">
			<a href={localizeHref(`/services/${service.id}`, locale)} class="deep-dive-cta mobile-only tap-press" use:pressBounce>
				{deepDiveLabel}
			</a>
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

	/* Bigger station label on the card so "SERVICE 0X / 04" scales with the
	   enlarged title block (overrides the global .label-station 15px). Desktop
	   only in effect; the clamp min equals the old size so mobile is unchanged. */
	.service-text :global(.label-station) {
		font-size: clamp(15px, 1.2vw, 18px);
	}

	.service-title {
		font-family: var(--font-heading);
		font-size: clamp(46px, 6vw, 84px);
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
		font-size: clamp(20px, 2.8vw, 30px);
		font-weight: 600;
		color: var(--foreground);
		line-height: 1.3;
		margin-bottom: 1.5rem;
	}

	.service-description {
		font-size: clamp(18px, 1.4vw, 21px);
		line-height: 1.7;
		color: var(--secondary-foreground);
		max-width: 55ch;
		margin-bottom: 1.5rem;
	}

	.stack-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 0.875rem 0.875rem;
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

	/* card-bottom now holds only the mobile-only deep-dive CTA. Hidden on desktop
	   (the desktop CTA lives in .cta-row; the SVG + Stack live in .card-aside). */
	.card-bottom {
		display: none;
	}

	/* Desktop right rail: SVG panel on top, collapsible Stack below it. */
	.card-aside {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 1.25rem;
		/* Match the SVG panel width so expanding the Stack wraps the pills inside
		   the rail instead of widening the column and reflowing the title. */
		width: clamp(180px, 20vw, 280px);
	}

	/* Collapsible "Stack" disclosure. Collapsed by default so the card reads
	   clean for non-technical visitors; technical buyers expand it on demand. */
	.stack-panel {
		border: 1.5px solid var(--primary);
		border-radius: var(--radius-md);
		background: transparent;
	}
	.stack-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding-inline: 0.875rem;
		cursor: pointer;
		list-style: none;
		user-select: none;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--secondary-foreground);
	}
	.stack-summary::-webkit-details-marker {
		display: none;
	}
	.stack-summary-count {
		color: var(--primary);
		font-weight: 700;
	}
	.stack-chevron {
		margin-left: auto;
		width: 8px;
		height: 8px;
		border-right: 2px solid var(--primary);
		border-bottom: 2px solid var(--primary);
		transform: rotate(-45deg);
		transition: transform var(--duration-fast) var(--ease-default);
	}
	.stack-panel[open] .stack-chevron {
		transform: rotate(45deg);
	}

	/* Mobile-only banner — hidden from tablet up (desktop keeps the side panel). */
	@media (min-width: 768px) {
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
		font-size: clamp(36px, 4vw, 48px);
		font-weight: 900;
		color: var(--accent-text);
		line-height: 1;
	}

	.metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--accent-text);
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
		/* min-height instead of a hard cap: the banner row can push past the
		   usable area on short phones — the card grows rather than clipping
		   its ends (justify-center + fixed height would crop both). */
		.service-viewport {
			height: auto;
			min-height: calc(100svh - 12rem);
			display: flex;
			flex-direction: column;
			justify-content: center;
			scroll-margin-top: 8.75rem;
			padding-block: 1rem;
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
		/* The side panel belongs to desktop — mobile gets the banner above. */
		.card-aside :global(.svg-panel-responsive) {
			display: none;
		}
		/* Mobile: the rail is just the full-width Stack collapsible. */
		.card-aside {
			width: 100%;
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
		.service-title {
			font-size: clamp(32px, 9vw, 44px);
			margin-bottom: 0.5rem;
		}
		.benefit-headline {
			font-size: clamp(18px, 4.8vw, 22px);
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
