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
	import { registerGsapPlugins, gsap, ScrollTrigger, MorphSVGPlugin } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	const services = getVisibleServices();
	const heading = resolveLocale(servicesGridContent.heading, 'en');
	const headingDot = resolveLocale(servicesGridContent.headingDot, 'en');
	const subheading = resolveLocale(servicesGridContent.subheading, 'en');

	// Geometric morph targets (48×48 viewBox — matches the service SVGs)
	const SHAPES = {
		triangle: 'M24 8 L40 38 L8 38 Z',
		circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
		square: 'M10 10 L38 10 L38 38 L10 38 Z',
		hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z',
	};
	const SHAPE_KEYS = Object.keys(SHAPES) as (keyof typeof SHAPES)[];

	let sectionEl: HTMLElement | undefined = $state(undefined);
	let activeMorphIndex = $state(-1);

	// Per-card morph state: converted paths + original path data
	const cardPaths: SVGPathElement[][] = [];
	const cardOriginals: string[][] = [];
	const cardReady: boolean[] = [];
	let lastShapeIdx = -1;

	function pickRandomShape(): keyof typeof SHAPES {
		let idx: number;
		do {
			idx = Math.floor(Math.random() * SHAPE_KEYS.length);
		} while (idx === lastShapeIdx && SHAPE_KEYS.length > 1);
		lastShapeIdx = idx;
		return SHAPE_KEYS[idx];
	}

	function handleCardEnter(index: number) {
		if (isPrefersReducedMotion() || !cardReady[index]) return;
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

		const shape = pickRandomShape();
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
			const shape = pickRandomShape();
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

				// Convert all elements to paths for MorphSVGPlugin
				const elements = Array.from(
					svg.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')
				) as SVGElement[];
				if (elements.length === 0) return;

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const paths = elements.map((el) => (MorphSVGPlugin.convertToPath as any)(el)[0] as SVGPathElement);
				cardPaths[i] = paths;
				cardOriginals[i] = paths.map((p) => p.getAttribute('d') ?? '');
				cardReady[i] = true;
			} catch {
				// Graceful fallback — SVG load failure doesn't break the page
			}
		});

		// Entrance animation
		if (!isPrefersReducedMotion()) {
			const label = sectionEl.querySelector('[data-services-label]');
			const cards = sectionEl.querySelectorAll('[data-services-card]');
			const viewall = sectionEl.querySelector('[data-services-viewall]');

			gsap.set(label, { opacity: 0 });
			gsap.set(cards, { opacity: 0, y: 30 });
			gsap.set(viewall, { opacity: 0 });

			ScrollTrigger.create({
				trigger: sectionEl,
				start: 'top bottom-=50',
				once: true,
				onEnter: () => {
					const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
					tl.to(label, { opacity: 1, duration: 0.3 });
					tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, '-=0.1');
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
	<!-- Blueprint background — AZUR MPM-10 + MR-73 blueprints layered -->
	<div class="blueprint-bg absolute inset-0 z-0" aria-hidden="true">
		<!-- AZUR side elevation — primary full-page blueprint (centered, faint) -->
		<div class="train-svg absolute inset-x-[2%] top-[25%] bottom-[25%] z-0 opacity-[0.15]" aria-hidden="true">
			<img src="/svg/blueprint/azur-side-elevation.svg" alt="" class="h-full w-full" />
		</div>

		<!-- ALL 12 blueprint SVGs — tiled wall-to-wall, no gaps -->
		<div class="edge-details absolute inset-0 z-0 opacity-[0.18] overflow-hidden" aria-hidden="true">
			<!-- Row 1: top band (4 panels spanning full width) -->
			<img src="/svg/blueprint/azur-front-view.svg" alt="" class="edge-detail" style="top:0;left:0;width:22%;height:38%;" />
			<img src="/svg/blueprint/detail-bogie.svg" alt="" class="edge-detail" style="top:0;left:22%;width:28%;height:28%;" />
			<img src="/svg/blueprint/azur-top-view.svg" alt="" class="edge-detail" style="top:0;left:50%;width:28%;height:22%;" />
			<img src="/svg/blueprint/azur-bogie-detail.svg" alt="" class="edge-detail" style="top:0;right:0;width:22%;height:30%;" />
			<!-- Row 1 fill: plug gap between bogie+top-view row and middle -->
			<img src="/svg/blueprint/detail-door.svg" alt="" class="edge-detail" style="top:22%;left:38%;width:18%;height:22%;" />
			<img src="/svg/blueprint/detail-window.svg" alt="" class="edge-detail" style="top:24%;right:0;width:18%;height:20%;" />
			<!-- Row 2: middle band (3 panels) -->
			<img src="/svg/blueprint/azur-cross-section.svg" alt="" class="edge-detail" style="top:38%;left:0;width:20%;height:34%;" />
			<img src="/svg/blueprint/detail-interior.svg" alt="" class="edge-detail" style="top:40%;left:20%;width:18%;height:30%;" />
			<img src="/svg/blueprint/detail-handrails.svg" alt="" class="edge-detail" style="top:44%;right:0;width:18%;height:28%;" />
			<!-- Row 3: bottom band (3 panels spanning full width) -->
			<img src="/svg/blueprint/mr73-side-elevation.svg" alt="" class="edge-detail" style="bottom:0;left:0;width:38%;height:30%;" />
			<img src="/svg/blueprint/detail-seat.svg" alt="" class="edge-detail" style="bottom:0;left:38%;width:24%;height:28%;" />
			<img src="/svg/blueprint/azur-side-elevation.svg" alt="" class="edge-detail" style="bottom:0;right:0;width:38%;height:30%;" />
		</div>

		<!-- Corner crosshairs -->
		<div class="crosshair" style="top:24px;left:24px;"></div>
		<div class="crosshair" style="top:24px;right:24px;"></div>
		<div class="crosshair" style="bottom:24px;left:24px;"></div>
		<div class="crosshair" style="bottom:24px;right:24px;"></div>
		<!-- Reference labels -->
		<span class="ref-label" style="top:16px;right:56px;">SEC-04 / SERVICES</span>
		<span class="ref-label" style="bottom:16px;left:56px;">DWG: AZUR-MPM10-ELEV</span>
		<span class="ref-label" style="bottom:16px;right:56px;">SCALE 1:48 | REV.A</span>
		<span class="ref-label" style="top:16px;left:56px;">STM / ALSTOM-BBD</span>
	</div>

	<!-- Content -->
	<div class="relative z-10">
		<!-- Section heading -->
		<div data-services-label>
			<h2
				data-testid="services-heading"
				class="section-heading"
			>{heading}<span class="section-dot">{headingDot}</span></h2>
			<p
				data-testid="services-subheading"
				class="section-subheading"
			>{subheading}</p>
		</div>

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
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							data-testid="services-svg-panel"
							class="svg-panel relative flex flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300"
							onclick={(e) => handleSvgTap(e, i)}
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
						</div>

						<!-- Card text -->
						<div class="flex min-w-0 flex-1 flex-col gap-1.5">
							{#if benefit}
								<div
									data-testid="services-benefit"
									class="text-body-lg font-medium leading-snug"
									style="color: var(--text-primary);"
								>{benefit}</div>
							{/if}
							<div
								data-testid="services-title"
								class="services-title font-extrabold leading-none tracking-tight"
								style="color: var(--brand-accent);"
							>{title}</div>
							{#if metricValue}
								<div class="mt-2 flex items-baseline gap-2" data-testid="services-metric">
									<span
										class="font-mono text-2xl font-bold"
										style="color: var(--brand-primary);"
									>{metricValue}</span>
									<span
										class="text-small"
										style="color: var(--text-secondary);"
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
				style="color: var(--text-secondary); border-color: var(--border);"
			>View all services &rarr;</a>
		</div>
	</div>
</section>

<style>
	/* Section heading — matches Terminus style */
	.section-heading {
		font-family: Inter, sans-serif;
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 900;
		color: var(--text-primary);
		letter-spacing: -2px;
		margin-block-end: 6px;
	}
	.section-dot {
		color: var(--brand-primary);
	}
	.section-subheading {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		color: var(--text-muted);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-block-end: 36px;
	}

	.services-section {
		padding: 80px 16px;
	}

	@media (min-width: 768px) {
		.services-section {
			padding: 100px 24px;
		}
	}

	@media (min-width: 1024px) {
		.services-section {
			padding: 140px 32px;
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
		background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
		border: 1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent);
		padding: 24px;
		text-decoration: none;
		backdrop-filter: blur(6px);
	}

	.services-card:hover {
		border-color: color-mix(in srgb, var(--brand-primary) 60%, transparent);
		transform: translateY(-2px);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--brand-primary) 8%, transparent);
	}

	/* Service title — responsive via clamp */
	.services-title {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		letter-spacing: -0.025em;
	}

	/* SVG panel — always square */
	.svg-panel {
		width: 80px;
		min-width: 80px;
		aspect-ratio: 1;
		align-self: center;
		background: var(--bg-surface);
		border: 1px solid var(--border);
	}

	@media (min-width: 1024px) {
		.svg-panel {
			width: 90px;
			min-width: 90px;
		}
	}

	.services-card:hover .svg-panel {
		background: var(--bg-elevated);
		border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
	}

	/* View all link hover */
	.view-all-link:hover {
		color: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.crosshair {
		position: absolute;
		width: 32px;
		height: 32px;
	}
	.crosshair::before {
		content: '';
		position: absolute;
		width: 32px;
		height: 1px;
		background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
		left: 50%;
	}

	.ref-label {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 10px;
		color: color-mix(in srgb, var(--brand-primary) 20%, transparent);
		letter-spacing: 1.5px;
		z-index: 0;
	}

	/* Edge detail positioning */
	.edge-detail {
		position: absolute;
	}

	/* Hide engineering annotations on smaller screens (crosshairs + ref labels) */
	@media (max-width: 1023px) {
		.ref-label,
		.crosshair {
			display: none;
		}
	}

	/* Reduce edge detail opacity on mobile — still visible but subtler */
	@media (max-width: 767px) {
		.edge-details {
			opacity: 0.05;
		}

		.train-svg {
			opacity: 0.05;
		}
	}
</style>
