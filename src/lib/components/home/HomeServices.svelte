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
	import { SHAPES, pickRandomShape } from '$lib/data/shapes.js';
	import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { convertSvgToMorphPaths } from '$lib/motion/utils/morphHelpers.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { SectionHeading } from '$lib/components/brand';
	import ServicesBlueprint from './ServicesBlueprint.svelte';

	const services = getVisibleServices();
	const heading = resolveLocale(servicesGridContent.heading, 'en');
	const subheading = resolveLocale(servicesGridContent.subheading, 'en');

	let sectionEl: HTMLElement | undefined = $state(undefined);
	let activeMorphIndex = $state(-1);

	// Per-card morph state: converted paths + original path data
	const cardPaths: SVGPathElement[][] = [];
	const cardOriginals: string[][] = [];
	const cardReady: boolean[] = [];
	let lastShapeIdx = -1;

	function handleCardEnter(index: number) {
		if (isPrefersReducedMotion() || !cardReady[index]) return;
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

		const { key: shape, index: shapeIdx } = pickRandomShape(lastShapeIdx);
		lastShapeIdx = shapeIdx;
		const paths = cardPaths[index];
		paths.forEach((p) => gsap.killTweensOf(p));
		gsap.to(paths, {
			morphSVG: SHAPES[shape],
			duration: 0.4,
			stagger: 0.03,
			ease: 'power2.inOut',
			overwrite: true,
		});
	}

	function handleCardLeave(index: number) {
		if (isPrefersReducedMotion() || !cardReady[index]) return;
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

		const paths = cardPaths[index];
		const originals = cardOriginals[index];
		paths.forEach((path, i) => {
			gsap.killTweensOf(path);
			gsap.to(path, {
				morphSVG: originals[i],
				duration: 0.4,
				delay: i * 0.03,
				ease: 'power2.inOut',
				overwrite: true,
			});
		});
	}

	function handleSvgTap(e: Event, index: number) {
		if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) return;
		if (isPrefersReducedMotion() || !cardReady[index]) return;
		e.preventDefault();
		e.stopPropagation();

		const isMorphed = activeMorphIndex === index;
		activeMorphIndex = isMorphed ? -1 : index;

		const paths = cardPaths[index];
		const originals = cardOriginals[index];

		if (isMorphed) {
			// Unmorph: back to original
			paths.forEach((path, i) => {
				gsap.killTweensOf(path);
				gsap.to(path, {
					morphSVG: originals[i],
					duration: 0.4,
					delay: i * 0.03,
					ease: 'power2.inOut',
					overwrite: true,
				});
			});
		} else {
			// Morph: into random shape
			const { key: shape, index: shapeIdx } = pickRandomShape(lastShapeIdx);
			lastShapeIdx = shapeIdx;
			paths.forEach((p) => gsap.killTweensOf(p));
			gsap.to(paths, {
				morphSVG: SHAPES[shape],
				duration: 0.4,
				stagger: 0.03,
				ease: 'power2.inOut',
				overwrite: true,
			});
		}
	}

	onMount(() => {
		if (!browser || !sectionEl) return;

		registerGsapPlugins();

		// Fetch and inject inline SVGs, then convert elements to paths
		const panels = sectionEl.querySelectorAll('[data-testid="services-svg-panel"]');
		panels.forEach(async (panel, i) => {
			const service = services[i];
			if (!service?.svg) return;

			try {
				const res = await fetch(`/svg/services/${service.svg}`);
				if (!res.ok) return;
				const svgText = await res.text();

				// Inject SVG content inline
				const wrapper = panel.querySelector('.svg-inline-wrapper');
				if (!wrapper) return;
				wrapper.innerHTML = svgText;

				const svg = wrapper.querySelector('svg');
				if (!svg) return;

				const { paths, originals } = convertSvgToMorphPaths(svg);
				if (paths.length === 0) return;

				cardPaths[i] = paths;
				cardOriginals[i] = originals;
				cardReady[i] = true;
			} catch {
				// Graceful fallback — SVG load failure doesn't break the page
			}
		});

		// Entrance animation
		if (!isPrefersReducedMotion()) {
			const cards = sectionEl.querySelectorAll('[data-services-card]');
			const viewall = sectionEl.querySelector('[data-services-viewall]');

			gsap.set(cards, { opacity: 0, y: 30 });
			gsap.set(viewall, { opacity: 0 });

			ScrollTrigger.create({
				trigger: sectionEl,
				start: 'top bottom-=50',
				once: true,
				onEnter: () => {
					const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
					tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 });
					tl.to(viewall, { opacity: 1, duration: 0.3 }, '-=0.2');
				},
			});
		}

		return () => {
			ScrollTrigger.getAll().forEach((st) => {
				if (st.trigger === sectionEl) st.kill();
			});
		};
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
					data-services-card
					class="services-card group flex rounded-xl transition-all duration-300"
					onmouseenter={() => handleCardEnter(i)}
					onmouseleave={() => handleCardLeave(i)}
				>
					<div class="card-inner flex w-full gap-5">
						<!-- SVG panel: inline SVG injected on mount for MorphSVGPlugin -->
						<button
							type="button"
							data-testid="services-svg-panel"
							class="svg-panel relative flex flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300"
							onclick={(e) => handleSvgTap(e, i)}
							aria-label="View {title} illustration"
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
				</a>
			{/each}
		</div>

		<!-- View all link -->
		<div
			data-testid="services-viewall"
			data-services-viewall
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

	/* Card — matches ProofReel card styling */
	.services-card {
		background: color-mix(in srgb, var(--background) 80%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		padding: 24px;
		text-decoration: none;
		backdrop-filter: blur(6px);
	}

	.services-card:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		transform: translateY(-2px);
		box-shadow: var(--shadow-section);
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
