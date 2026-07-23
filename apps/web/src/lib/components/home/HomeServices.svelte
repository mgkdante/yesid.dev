<!--
  HomeServices — Section 4: Benefit-led services grid.

  Slice-23: Station Card layout. Each service card has an icon hero
  zone at the top (centered SVG icon, "0N / SERVICE" marker top-left,
  radial glow), the service title + benefit headline below, and a
  slim footer band with the impact metric.

  Round 5b: 2×2 grid on desktop (≥1024px) — four stations, two per row —
  1 column on tablet/mobile.
  Carnegie-informed: benefit text leads, service title is the visual
  star — same content priority as before, restructured into the
  Station Card frame.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { resolveLocale } from '$lib/utils';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { fillTemplate } from '$lib/utils/labels';
	import { siteLabels } from '$lib/content';

	import { morphHover, pressBounce, cursorGlow, cardParallax } from '$lib/motion/actions';
	import { gsap, loadDrawSVG } from '$lib/motion/utils/gsap';
	import { SectionHeading } from '$lib/components/brand';
	import type { Service, ServicesGridContent } from '$lib/types';

	// slice-28.5 (#124): services arrive as a prop from the home
	// +page.server.ts load (repository -> adapter), replacing the previous
	// direct getVisibleServices() call into the static helper layer. Same
	// data, adapter-resolved — so a slice-26 adapter re-point reaches this grid.
	let {
		servicesGrid: servicesGridContent,
		services,
	}: { servicesGrid: ServicesGridContent; services: readonly Service[] } = $props();

	// GO-2: station order IS the journey order. Sort defensively — the CMS
	// export carries no order guarantee after the station renumber.
	// $derived so the sort and the chrome strings recompute if the props
	// change: a plain const captures only the initial value, which Svelte 5
	// flags (state_referenced_locally).
	const orderedServices = $derived([...services].sort((a, b) => a.station - b.station));

	const viewIllustrationAriaTemplate = $derived(
		resolveLocale(servicesGridContent.viewIllustrationAria, locale)
	);
	const viewAllLink = $derived(resolveLocale(servicesGridContent.viewAllLink, locale));

	// go2-t1c2: card marker template from site_labels, previous literal as fallback.
	const markerServiceTemplate = resolveLocale(siteLabels.ui.markerService, locale) || '{num} / SERVICE';

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// One flag per card — flipped true after the SVG is fetched and injected.
	// `use:morphHover` reads this via its `enabled` param to gate morphs until
	// the SVG paths are actually in the DOM. untrack: the seed is a deliberate
	// one-shot snapshot of the card count; the flags are owned locally after init.
	const svgReady = $state<boolean[]>(untrack(() => orderedServices.map(() => false)));

	onMount(() => {
		if (!browser || !sectionEl) return;

		// Slice-23: kick off DrawSVG plugin load in parallel with the SVG
		// fetches so the draw-in animation can fire as soon as both are
		// ready (no eager-await stalling the icon injection). Draw stays
		// active under reduced-motion per operator policy — brief one-time
		// stroke-dashoffset animation, not a vestibular trigger.
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
				if (!res.ok) return;
				const svgText = await res.text();

				const wrapper = panel.querySelector('.svg-inline-wrapper');
				if (!wrapper) return;
				wrapper.innerHTML = svgText;

				// Animate each path / line / shape from 0% draw to 100%, staggered
				// per card so the 6 icons cascade in rather than fire together.
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
				// Graceful fallback — SVG fetch failure keeps the static <img> placeholder.
			}
		});
	});
</script>

<!-- go2/w4 operator QA: sectionGlow unwired — no section-scale hover glow here.
     The primitive itself lives on in $lib/motion/actions for other consumers. -->
<section
	bind:this={sectionEl}
	data-testid="services-section"
	class="services-section relative overflow-hidden"
>
	<div class="relative z-10">
		<!-- Round 5b (operator-ordered): with four stations the section is a
		     uniform 2×2 grid on desktop (2 per row; mobile/tablet stays
		     stacked). Cards in the same row share height. -->
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
						<!-- Icon zone: centered SVG hero with radial glow + marker. -->
						<div class="services-icon-zone relative">
							<!-- 01 / SERVICE marker, top-left of icon zone. -->
							<div class="services-marker">
								{fillTemplate(markerServiceTemplate, { num: String(service.station).padStart(2, '0') })}
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
										width="96"
										height="96"
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
	/* GO2-W5: surface-1 now aliases --card (tokens.json flip) so the panel
	   lifts solid off the board; inset bevel = panel catching the lamp.
	   Round 3: brand grid at 2px. */
	/* Round 5 (operator: "you removed the fun svgs!"): the icon zone grows a
	   step so the service art is the hero of the card again — rounds 3/4
	   boldened every structural line around the 64px icons and visually
	   drowned them. */
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

	/* Icon zone — fixed height grid row, centered icon, subtle radial
	   brand-orange glow + diagonal gradient for the "station signage"
	   feel. */
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

	/* "01 / SERVICE" marker — top-left of icon zone. Round-4 doctrine:
	   station markers are wayfinding overlines — the YELLOW voice
	   (label-station precedent; accent-text = AA amber both modes). */
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

	/* SVG panel — rounded tile centered in the icon zone. Round 5: one big
	   step up (92px → 128px tile, 64px → 96px art) — the fun SVGs are
	   unmistakably present again. */
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
		/* Round 5 light-register: ~40% of each service SVG's linework strokes
		   var(--accent) (#FFB627 brand amber, no theme mapping) — invisible on
		   paper. Remap to --line-amber inside the art scope only: dark resolves
		   to the same #FFB627, light to the daylight-surviving #B57F00
		   (MetroStation track precedent). */
		--accent: var(--line-amber);
		/* Icon drifts toward the cursor via cardParallax's ±4px clamp.
		   3x multiplier → effective drift ±12px on the icon canvas. */
		transform: translate(
			calc(var(--parallax-x, 0px) * 3),
			calc(var(--parallax-y, 0px) * 3)
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

	/* Footer band — slim, brand-orange metric value + mono caption label. */
	.services-footer {
		padding: 1rem 1.75rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
	}

	/* Round-4 doctrine: metric/number callouts speak the YELLOW voice. */
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
	   single-column layouts. Round 5: scaled up in lockstep with desktop so
	   the art stays the hero (72→96 tile, 48→64 art). */
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
