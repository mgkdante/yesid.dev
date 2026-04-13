<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.
  Two-column cards: text/metrics left, B&W image right.
  Desktop: hover turns image to color. Mobile: tap image toggles color, tap text navigates.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { proofReelContent, getProjectBySlug, resolveLocale } from '$lib/data/index.js';
	import type { Project } from '$lib/data/index.js';
	import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { Tag } from '$lib/components/brand';

	const heading = resolveLocale(proofReelContent.heading, 'en');
	const headingDot = resolveLocale(proofReelContent.headingDot, 'en');
	const subheading = resolveLocale(proofReelContent.subheading, 'en');
	const sectionLabel = resolveLocale(proofReelContent.sectionLabel, 'en');
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, 'en');

	const projects: (Project | undefined)[] = proofReelContent.slugs.map((slug) =>
		getProjectBySlug(slug)
	);

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// Mobile tap toggle: track which card image is active (-1 = none)
	let activeImageIndex = $state(-1);

	function handleImageTap(e: Event, index: number) {
		// On mobile, toggle color instead of navigating
		if (window.matchMedia('(max-width: 767px)').matches) {
			e.preventDefault();
			e.stopPropagation();
			activeImageIndex = activeImageIndex === index ? -1 : index;
		}
	}

	onMount(() => {
		if (!browser || !sectionEl) return;

		if ($prefersReducedMotion) return;

		registerGsapPlugins();

		const label = sectionEl.querySelector('[data-proof-label]');
		const cards = sectionEl.querySelectorAll('[data-proof-card]');
		const viewall = sectionEl.querySelector('[data-proof-viewall]');

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
				tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, '-=0.1');
				tl.to(viewall, { opacity: 1, duration: 0.3 }, '-=0.2');
			},
		});

		return () => {
			ScrollTrigger.getAll().forEach(st => {
				if (st.trigger === sectionEl) st.kill();
			});
			gsap.set([label, ...cards, viewall], { clearProps: 'all' });
		};
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="proof-reel-section"
	class="relative py-16 px-6 md:py-24 md:px-12 lg:px-16 lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- Section heading -->
	<div data-proof-label>
		<h2
			data-testid="proof-reel-heading"
			class="section-heading"
		>{heading}<span class="section-dot">{headingDot}</span></h2>
		<p
			data-testid="proof-reel-subheading"
			class="section-subheading"
		>{subheading}</p>
	</div>

	<!-- 3-card grid -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:mb-10">
		{#each projects as project, i}
			{#if project}
				{@const title = resolveLocale(project.title, 'en')}
				{@const metric = project.impactMetric}
				{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
				<div
					data-proof-card
					class="proof-card group flex flex-col overflow-hidden rounded-xl transition-all duration-300"
					style="background: color-mix(in srgb, var(--bg-primary) 80%, transparent); border: 1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent);"
				>
					<!-- Image — B&W default, color on hover (desktop) / tap (mobile) -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="proof-image relative h-48 overflow-hidden md:h-56"
						class:image-active={activeImageIndex === i}
						data-testid="proof-card-image"
						onclick={(e) => handleImageTap(e, i)}
					>
						<img
							src={imageUrl}
							alt={title}
							class="proof-img h-full w-full object-cover grayscale brightness-[0.4] transition-all duration-500 ease-out"
							loading="lazy"
						/>
						<div class="proof-img-overlay absolute inset-0 bg-black/30 transition-opacity duration-500"></div>
					</div>

					<!-- Text — links to project -->
					<a
						href="/work/{project.slug}"
						class="block flex-1 p-5 md:p-6"
						data-testid="proof-card"
					>
						{#if metric}
							<div class="mb-1">
								{#if metric.before}
									<span
										data-testid="proof-metric-before"
										class="mr-1.5 text-heading font-normal line-through md:text-title"
										style="color: var(--text-muted);"
									>{metric.before}</span>
								{/if}
								<span
									data-testid="proof-metric-value"
									class="font-heading text-4xl font-black leading-none tracking-tight md:text-5xl"
									style="color: var(--brand-primary); letter-spacing: -0.03em;"
								>{metric.value}</span>
							</div>
							<div
								data-testid="proof-metric-label"
								class="mb-5 text-small md:mb-6"
								style="color: var(--text-secondary);"
							>{metric.label}</div>
						{/if}

						<div
							data-testid="proof-card-title"
							class="mb-4 font-heading text-body-lg font-bold leading-snug md:mb-5 md:text-heading"
							style="color: var(--text-primary);"
						>{title}</div>

						<div class="flex flex-wrap gap-1.5">
							{#each project.stack as tech}
								<span data-testid="proof-tag">
									<Tag text={tech} active accentColor="var(--brand-primary)" />
								</span>
							{/each}
						</div>
					</a>
				</div>
			{/if}
		{/each}
	</div>

	<!-- View all link -->
	<div data-proof-viewall class="text-right">
		<a
			data-testid="proof-view-all"
			href={proofReelContent.viewAllHref}
			class="font-mono text-caption tracking-wider md:text-mono"
			style="color: var(--brand-primary); border-bottom: 1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent);"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	/* Section heading — matches Terminus style */
	.section-heading {
		font-family: var(--font-heading);
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
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-block-end: 36px;
	}

	/* Desktop hover: card border + image turns color */
	.proof-card:hover {
		border-color: color-mix(in srgb, var(--brand-primary) 60%, transparent) !important;
		box-shadow: var(--shadow-section);
	}

	.proof-card:hover .proof-img,
	.proof-image.image-active .proof-img {
		filter: grayscale(0) brightness(0.7);
	}

	.proof-card:hover .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay {
		opacity: var(--opacity-subtle);
	}

	.proof-card:hover [data-testid='proof-tag'] {
		color: color-mix(in srgb, var(--brand-primary) 85%, transparent) !important;
		border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important;
		background: color-mix(in srgb, var(--brand-primary) 8%, transparent) !important;
	}

	/* Mobile image tap cursor */
	@media (max-width: 767px) {
		.proof-image {
			cursor: pointer;
		}
	}
</style>
