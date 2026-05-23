<!--
  HomeServices — Section 4: Benefit-led services grid.

  Slice-23: Station Card layout. Each service card has an icon hero
  zone at the top (centered SVG icon, "0N / SERVICE" marker top-left,
  radial glow), the service title + benefit headline below, and a
  slim footer band with the impact metric.

  3 columns on desktop (≥1024px), 1 column on tablet/mobile.
  Carnegie-informed: benefit text leads, service title is the visual
  star — same content priority as before, restructured into the
  Station Card frame.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolveLocale } from '$lib/utils';

	import { getVisibleServices } from '$lib/content';
	import { morphHover, pressBounce, cursorGlow, cardParallax } from '$lib/motion/actions';
	import { SectionHeading } from '$lib/components/brand';
	import ServicesBlueprint from './ServicesBlueprint.svelte';
	import type { ServicesGridContent } from '$lib/types';

	let { servicesGrid: servicesGridContent }: { servicesGrid: ServicesGridContent } = $props();

	const services = getVisibleServices();
	const viewIllustrationAriaTemplate = resolveLocale(servicesGridContent.viewIllustrationAria, 'en');
	const viewAllLink = resolveLocale(servicesGridContent.viewAllLink, 'en');

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// One flag per card — flipped true after the SVG is fetched and injected.
	// `use:morphHover` reads this via its `enabled` param to gate morphs until
	// the SVG paths are actually in the DOM.
	const svgReady = $state<boolean[]>(services.map(() => false));

	onMount(() => {
		if (!browser || !sectionEl) return;

		const panels = sectionEl.querySelectorAll('[data-testid="services-svg-panel"]');
		panels.forEach(async (panel, i) => {
			const service = services[i];
			if (!service?.svg) return;

			try {
				const res = await fetch(`/svg/services/${service.svg}`);
				if (!res.ok) return;
				const svgText = await res.text();

				const wrapper = panel.querySelector('.svg-inline-wrapper');
				if (!wrapper) return;
				wrapper.innerHTML = svgText;

				svgReady[i] = true;
			} catch {
				// Graceful fallback — SVG fetch failure keeps the static <img> placeholder.
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
		<!-- 3-column grid (1 col on tablet/mobile). Cards in the same row share height. -->
		<div class="services-grid grid grid-cols-1 gap-5 lg:grid-cols-3">
			{#each services as service, i}
				{@const benefit = service.benefitHeadline ? resolveLocale(service.benefitHeadline, 'en') : ''}
				{@const title = resolveLocale(service.title, 'en')}
				{@const metricValue = service.impactMetric ? resolveLocale(service.impactMetric.value, 'en') : ''}
				{@const metricLabel = service.impactMetric ? resolveLocale(service.impactMetric.label, 'en') : ''}
				<a
					href="/services/{service.id}"
					data-testid="services-card"
					class="services-card-link group block tap-press"
					use:morphHover={{ enabled: svgReady[i], disableClickToggle: true }}
				>
					<div
						class="services-card relative overflow-hidden"
						use:cursorGlow={{ intensity: 0.1 }}
						use:cardParallax
					>
						<!-- Icon zone: centered SVG hero with radial glow + marker. -->
						<div class="services-icon-zone relative">
							<!-- 01 / SERVICE marker, top-left of icon zone. -->
							<div class="services-marker">
								{String(service.station).padStart(2, '0')} / SERVICE
							</div>

							<!-- SVG icon button — morph triggers from the parent link's
							     hover via use:morphHover above (with disableClickToggle
							     so mobile taps navigate normally). -->
							<button
								type="button"
								data-testid="services-svg-panel"
								class="services-svg-panel"
								aria-label={viewIllustrationAriaTemplate.replace('{title}', title)}
							>
								<div class="svg-inline-wrapper pointer-events-none">
									<!-- Fallback: static img until JS injects inline SVG -->
									<img
										src="/svg/services/{service.svg}"
										alt=""
										width="64"
										height="64"
									/>
								</div>
							</button>
						</div>

						<!-- Title + benefit. -->
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

						<!-- Slim footer band with the impact metric. -->
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

		<!-- View all link — shared mono-caption brand-orange style with the
		     FeaturedProjects "View all projects →" link below. -->
		<div
			data-testid="services-viewall"
			class="mt-12 flex justify-end"
		>
			<a
				href="/services"
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

	@media (min-width: 1024px) {
		.services-section {
			min-height: 100dvh;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}

	/* Grid — uniform row heights across the 3 columns. */
	.services-grid {
		grid-auto-rows: 1fr;
	}

	/* Card link wrapper — `block` so the inner card fills it, no underline. */
	.services-card-link {
		text-decoration: none;
		height: 100%;
	}

	/* Card frame — brand-aligned card-surface pattern matching the
	   Magazine proof cards. Grid with explicit rows so every card has
	   the same icon-zone size, content section, and footer band
	   regardless of title/benefit length. */
	.services-card {
		background: var(--background);
		border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
		border-radius: var(--radius-lg);
		display: grid;
		grid-template-rows: 11rem 1fr auto;
		height: 100%;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default),
			transform 220ms var(--ease-default);
	}

	.services-card-link:hover .services-card {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		box-shadow: var(--shadow-section);
		transform: translateY(-3px);
	}

	/* Icon zone — fixed height grid row, centered icon, subtle radial
	   brand-orange glow + diagonal gradient for the "station signage"
	   feel. */
	.services-icon-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1f1f1f, #161616);
		background-image:
			radial-gradient(
				circle at 50% 55%,
				color-mix(in srgb, var(--primary) 9%, transparent),
				transparent 65%
			),
			linear-gradient(135deg, #1f1f1f, #161616);
	}

	/* "01 / SERVICE" marker — top-left of icon zone, brand-orange mono. */
	.services-marker {
		position: absolute;
		left: 1.25rem;
		top: 1rem;
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		font-weight: 700;
		z-index: 2;
	}

	@media (min-width: 768px) {
		.services-marker {
			font-size: 1rem;
			letter-spacing: 0.24em;
		}
	}

	/* SVG panel — circular tile centered in the icon zone. */
	button.services-svg-panel {
		appearance: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: pointer;
		width: 92px;
		height: 92px;
		border-radius: 18px;
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
		box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 22%, transparent);
	}

	.svg-inline-wrapper {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Icon drifts toward the cursor via cardParallax's ±4px clamp.
		   1.5x multiplier (vs the Magazine title's 2.5x) keeps the effect
		   subtle on the smaller icon canvas. */
		transform: translate(
			calc(var(--parallax-x, 0px) * 1.5),
			calc(var(--parallax-y, 0px) * 1.5)
		);
		transition: transform 180ms var(--ease-default);
	}

	/* Content section — title + benefit, with the title dominant. */
	.services-content {
		padding: 1.5rem 1.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.services-title {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.5rem;
		line-height: 1.1;
		color: var(--foreground);
		letter-spacing: -0.02em;
	}

	@media (min-width: 768px) {
		.services-title {
			font-size: 1.75rem;
		}
	}

	.services-benefit {
		font-size: 0.95rem;
		line-height: 1.4;
		color: var(--muted-foreground);
	}

	/* Footer band — slim, brand-orange metric value + mono caption label. */
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
		color: var(--primary);
		letter-spacing: -0.02em;
	}

	.services-metric-label {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	@media (min-width: 768px) {
		.services-metric-value {
			font-size: 1.75rem;
		}
		.services-metric-label {
			font-size: 0.9rem;
		}
	}

	/* Shared "View all ___ →" link styling — unified with FeaturedProjects
	   so both home sections present the same brand-aligned link pattern. */
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

	/* Mobile: shrink the icon zone so the cards aren't unnecessarily tall on
	   single-column layouts. */
	@media (max-width: 767px) {
		.services-card {
			grid-template-rows: 8.5rem 1fr auto;
		}
		button.services-svg-panel {
			width: 72px;
			height: 72px;
			border-radius: 14px;
		}
		.svg-inline-wrapper {
			width: 48px;
			height: 48px;
		}
		.services-content {
			padding: 1.25rem 1.5rem 0.875rem;
		}
		.services-footer {
			padding: 0.875rem 1.5rem;
		}
	}
</style>
