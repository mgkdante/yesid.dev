<!--
  HomeServices — Section 4: Benefit-led services grid.
  3×2 grid on desktop, 2×3 tablet, 1×6 mobile.
  Blueprint background with MR-73 train technical drawing.
  Carnegie-informed: benefit text leads, service title is the visual star.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getVisibleServices, resolveLocale, servicesGridContent } from '$lib/data/index.js';
	import { SHAPES } from '$lib/data/shapes.js';
	import { morphHover } from '$lib/motion/actions';
	import { Card } from '$lib/components/ui/card';
	import { SectionHeading } from '$lib/components/brand';
	import ServicesBlueprint from './ServicesBlueprint.svelte';

	const services = getVisibleServices();
	const heading = resolveLocale(servicesGridContent.heading, 'en');
	const subheading = resolveLocale(servicesGridContent.subheading, 'en');

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// One flag per card — flipped true after the SVG is fetched and injected.
	// `use:morphHover` reads this via its `enabled` param to gate morphs until
	// the SVG paths are actually in the DOM.
	const svgReady = $state<boolean[]>(services.map(() => false));

	onMount(() => {
		if (!browser || !sectionEl) return;

		// MorphSVG plugin is lazy-loaded inside use:morphHover on first hover.
		// Fetch each service SVG and inject it inline so morphHover can find
		// <path> elements to morph.
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
	<!-- Content -->
	<div class="relative z-10">
		<!-- 3×2 grid — auto-rows: 1fr for uniform card height -->
		<div class="services-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each services as service, i}
				{@const benefit = service.benefitHeadline ? resolveLocale(service.benefitHeadline, 'en') : ''}
				{@const title = resolveLocale(service.title, 'en')}
				{@const metricValue = service.impactMetric ? resolveLocale(service.impactMetric.value, 'en') : ''}
				{@const metricLabel = service.impactMetric ? resolveLocale(service.impactMetric.label, 'en') : ''}
				<a
					href="/services/{service.id}"
					data-testid="services-card"
					class="group block"
				>
					<Card class="services-card flex h-full p-6">
					<div class="card-inner flex w-full gap-5">
						<!-- SVG panel: inline SVG injected on mount; use:morphHover owns the hover/tap animation. -->
						<button
							type="button"
							data-testid="services-svg-panel"
							class="svg-panel relative flex flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300"
							aria-label="View {title} illustration"
							use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}
						>
							<div class="svg-inline-wrapper pointer-events-none" style="width:56px;height:56px;">
								<!-- Fallback: static img until JS injects inline SVG -->
								<img
									src="/svg/services/{service.svg}"
									alt=""
									width="56"
									height="56"
								/>
							</div>
						</button>

						<!-- Card text -->
						<div class="flex min-w-0 flex-1 flex-col gap-1.5">
							{#if benefit}
								<div
									data-testid="services-benefit"
									class="text-body-lg font-medium leading-snug"
									style="color: var(--foreground);"
								>{benefit}</div>
							{/if}
							<div
								data-testid="services-title"
								class="services-title font-extrabold leading-none tracking-tight"
								style="color: var(--accent);"
							>{title}</div>
							{#if metricValue}
								<div class="mt-2 flex items-baseline gap-2" data-testid="services-metric">
									<span
										class="font-mono text-2xl font-bold"
										style="color: var(--primary);"
									>{metricValue}</span>
									<span
										class="text-small"
										style="color: var(--secondary-foreground);"
									>{metricLabel}</span>
								</div>
							{/if}
						</div>
					</div>
					</Card>
				</a>
			{/each}
		</div>

		<!-- View all link -->
		<div
			data-testid="services-viewall"
			class="mt-12 text-center"
		>
			<a
				href="/services"
				class="view-all-link border-b pb-0.5 text-body font-medium tracking-wide transition-colors duration-200"
				style="color: var(--secondary-foreground); border-color: var(--border);"
			>View all services &rarr;</a>
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

	/* Grid — uniform row heights */
	.services-grid {
		grid-auto-rows: 1fr;
	}

	/* Service title — responsive via clamp */
	.services-title {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		letter-spacing: -0.025em;
	}

	/* SVG panel — always square */
	button.svg-panel {
		appearance: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: pointer;
		width: 80px;
		min-width: 80px;
		aspect-ratio: 1;
		align-self: center;
		background: var(--muted);
		border: 1px solid var(--border);
	}

	@media (min-width: 1024px) {
		.svg-panel {
			width: 90px;
			min-width: 90px;
		}
	}

	.services-card:hover .svg-panel {
		background: var(--popover);
		border-color: color-mix(in srgb, var(--primary) 30%, transparent);
	}

	/* View all link hover */
	.view-all-link:hover {
		color: var(--primary);
		border-color: var(--primary);
	}

</style>
