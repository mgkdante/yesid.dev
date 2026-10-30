<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/env';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { fillTemplate } from '#lib/utils/labels.ts';
	import { siteLabels } from '#lib/content/index.ts';

	import { pressBounce, cursorGlow, cardParallax } from '@yesid/motion/actions';
	import { morphHover } from '#lib/motion/actions/morphHover.js';
	import { gsap, loadDrawSVG } from '@yesid/motion/utils/gsap';
	import { SectionHeading } from '@yesid/ui/brand';
	import type { Service, ServicesGridContent } from '#lib/types.ts';

	let {
		servicesGrid: servicesGridContent,
		services,
	}: { servicesGrid: ServicesGridContent; services: readonly Service[] } = $props();

	// Station order defines the journey; CMS exports do not guarantee collection order.
	const orderedServices = $derived([...services].sort((a, b) => a.station - b.station));

	const viewIllustrationAriaTemplate = $derived(
		resolveLocale(servicesGridContent.viewIllustrationAria, locale)
	);
	const viewAllLink = $derived(resolveLocale(servicesGridContent.viewAllLink, locale));

	const markerServiceTemplate = resolveLocale(siteLabels.ui.markerService, locale) || '{num} / SERVICE';

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// Morphing waits for injected SVG paths; readiness flags seed once and remain locally owned.
	const svgReady = $state<boolean[]>(untrack(() => orderedServices.map(() => false)));

	onMount(() => {
		if (!browser || !sectionEl) return;

		// Load DrawSVG alongside SVG fetches so icon injection does not wait on the plugin.
		const drawPluginPromise: Promise<void> = loadDrawSVG();

		const panels = sectionEl.querySelectorAll('[data-testid="services-svg-panel"]');
		panels.forEach(async (panel, i) => {
			const service = orderedServices[i];
			if (!service?.svg) return;

			try {
				const [res] = await Promise.all([
					fetch(`/svg/services/${service.svg}`),
					drawPluginPromise,
				]);
				if (!res.ok) {
					console.warn(
						'[home-services] Decorative SVG fetch failed; keeping the static image.',
					);
					return;
				}
				const svgText = await res.text();

				const wrapper = panel.querySelector('.svg-inline-wrapper');
				if (!wrapper) return;
				wrapper.innerHTML = svgText;

				const svg = wrapper.querySelector('svg');
				if (svg) {
					const drawable = svg.querySelectorAll(
						'path, line, polyline, polygon, rect, circle, ellipse',
					);
					if (drawable.length > 0) {
						gsap.set(drawable, { drawSVG: '0%' });
						gsap.to(drawable, {
							drawSVG: '100%',
							duration: 1.1,
							stagger: 0.04,
							ease: 'power2.inOut',
							delay: i * 0.12,
						});
					}
				}

				svgReady[i] = true;
			} catch {
				console.warn(
					'[home-services] Decorative SVG fetch failed; keeping the static image.',
				);
			}
		});
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="services-section"
	class="services-section relative overflow-hidden"
>
	<div class="relative z-10">

		<div class="services-grid grid grid-cols-1 gap-5 lg:grid-cols-2">
			{#each orderedServices as service, i}
				{@const benefit = service.benefitHeadline ? resolveLocale(service.benefitHeadline, locale) : ''}
				{@const title = resolveLocale(service.title, locale)}
				{@const metricValue = service.impactMetric ? resolveLocale(service.impactMetric.value, locale) : ''}
				{@const metricLabel = service.impactMetric ? resolveLocale(service.impactMetric.label, locale) : ''}
				<a
					href={localizeHref(`/services/${service.id}`, locale)}
					data-testid="services-card"
					class="services-card-link group block tap-press"
					use:morphHover={{ enabled: svgReady[i], disableClickToggle: true }}
				>
					<div
						class="services-card relative overflow-hidden"
						use:cursorGlow
						use:cardParallax
					>

						<div class="services-icon-zone relative">

							<div class="services-marker">
								{fillTemplate(markerServiceTemplate, { num: String(service.station).padStart(2, '0') })}
							</div>

							<!-- Parent-link hover drives morphs; disabled click toggles let mobile taps navigate. -->
							<button
								type="button"
								data-testid="services-svg-panel"
								class="services-svg-panel"
								aria-label={viewIllustrationAriaTemplate.replace('{title}', title)}
							>
								<div class="svg-inline-wrapper pointer-events-none">

									<img
										src="/svg/services/{service.svg}"
										alt=""
										width="96"
										height="96"
									/>
								</div>
							</button>
						</div>

						<div class="services-content">
							<div
								data-testid="services-title"
								class="services-title"
							>{title}</div>
							{#if benefit}
								<div
									data-testid="services-benefit"
									class="services-benefit"
								>{benefit}</div>
							{/if}
						</div>

						{#if metricValue}
							<div
								class="services-footer"
								data-testid="services-metric"
							>
								<span class="services-metric-value">{metricValue}</span>
								<span class="services-metric-label">{metricLabel}</span>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		<div
			data-testid="services-viewall"
			class="mt-12 flex justify-end"
		>
			<a
				href={localizeHref('/services', locale)}
				class="home-view-all tap-feedback inline-flex items-center font-mono text-caption tracking-wider md:text-mono"
				use:pressBounce
			>{viewAllLink}</a>
		</div>
	</div>
</section>

<style>
	.services-section {
		padding: var(--space-section-y) var(--space-page-x);
	}

	@media (--desktop-min) {
		.services-section {
			min-height: 100dvh;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}

	.services-grid {
		grid-auto-rows: 1fr;
	}

	.services-card-link {
		text-decoration: none;
		height: 100%;
	}

	/* Explicit grid rows keep icon, content and footer sizes aligned across varied copy lengths. */

	.services-card {
		background: var(--surface-1);
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-lg);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		display: grid;
		grid-template-rows: 12.5rem 1fr auto;
		height: 100%;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default),
			transform 220ms var(--ease-default);
	}

	.services-card-link:hover .services-card {
		border-color: var(--border-brand-active);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
		transform: translateY(-3px);
	}

	.services-icon-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, color-mix(in srgb, var(--surface-2) 96%, var(--foreground)), color-mix(in srgb, var(--surface-1) 92%, var(--terminal)));
		background-image:
			radial-gradient(
				circle at 50% 55%,
				color-mix(in srgb, var(--primary) 9%, transparent),
				transparent 65%
			),
			linear-gradient(135deg, color-mix(in srgb, var(--surface-2) 96%, var(--foreground)), color-mix(in srgb, var(--surface-1) 92%, var(--terminal)));
	}

	.services-marker {
		position: absolute;
		left: 1.25rem;
		top: 1rem;
		color: var(--accent-text);
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.22em;
		text-transform: uppercase;
		font-weight: 700;
		z-index: 2;
	}

	@media (--tablet-min) {
		.services-marker {
			font-size: var(--text-menu-subtitle);
			letter-spacing: 0.24em;
		}
	}

	button.services-svg-panel {
		appearance: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: pointer;
		width: 128px;
		height: 128px;
		border-radius: 22px;
		background: color-mix(in srgb, var(--primary) 6%, var(--background));
		border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 250ms var(--ease-default);
	}

	.services-card-link:hover button.services-svg-panel {
		background: color-mix(in srgb, var(--primary) 14%, var(--background));
		border-color: color-mix(in srgb, var(--primary) 38%, transparent);
		box-shadow: 0 0 24px color-mix(in srgb, var(--glow) 22%, transparent);
	}

	.svg-inline-wrapper {
		width: 96px;
		height: 96px;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Remap amber linework locally to line-amber so service art remains visible on light paper. */
		--accent: var(--line-amber);

		transform: translate(
			calc(var(--parallax-x, 0px) * 3),
			calc(var(--parallax-y, 0px) * 3)
		);
		transition: transform 180ms var(--ease-default);
	}

	.services-content {
		padding: 1.5rem 1.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.services-title {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: var(--text-card-title);
		line-height: 1.1;
		color: var(--foreground);
		letter-spacing: 0;
	}

	@media (--tablet-min) {
		.services-title {
			font-size: calc(var(--text-card-title) + 0.25rem);
		}
	}

	.services-benefit {
		font-size: var(--text-card-body);
		line-height: 1.4;
		color: var(--muted-foreground);
	}

	.services-footer {
		padding: 1rem 1.75rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
	}

	.services-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--accent-text);
		letter-spacing: -0.02em;
	}

	.services-metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-card-meta);
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0;
	}

	@media (--tablet-min) {
		.services-metric-value {
			font-size: 1.75rem;
		}
		.services-metric-label {
			font-size: var(--text-card-meta);
		}
	}

	.home-view-all {
		color: var(--primary);
		border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		min-height: 2.75rem;
		padding-inline: 0.25rem;
		transition: border-color var(--duration-normal) var(--ease-default);
	}

	.home-view-all:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
	}

	@media (--tablet-max) {
		.services-card {
			grid-template-rows: 10rem 1fr auto;
		}
		button.services-svg-panel {
			width: 96px;
			height: 96px;
			border-radius: 16px;
		}
		.svg-inline-wrapper {
			width: 64px;
			height: 64px;
		}
		.services-content {
			padding: 1.25rem 1.5rem 0.875rem;
		}
		.services-footer {
			padding: 0.875rem 1.5rem;
		}
	}
</style>
