<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.

  Slice-23: Magazine card layout in an Embla horizontal carousel with
  infinite loop. Title overlays the image's bottom via grid overlap so
  there's no empty text-row gap; metric + tags sit in a slim footer
  row below.

  Desktop: hover turns image to color. Mobile: tap image toggles color,
  tap footer navigates to the project.
-->
<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import WheelGesturesPlugin from 'embla-carousel-wheel-gestures';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { resolveLocale } from '$lib/utils';
	import { getProjectBySlug } from '$lib/content';
	import type { Project, ProofReelContent } from '$lib/types';
	import { cursorGlow, cardParallax, magnetic } from '$lib/motion/actions';

	let { proofReel: proofReelContent }: { proofReel: ProofReelContent } = $props();

	const toggleColorAriaTemplate = resolveLocale(proofReelContent.toggleColorAria, 'en');
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, 'en');

	const projects: (Project | undefined)[] = proofReelContent.slugs.map((slug) =>
		getProjectBySlug(slug),
	);
	const visibleProjects = $derived(projects.filter((p): p is Project => Boolean(p)));
	const total = $derived(visibleProjects.length);

	// Mobile tap toggle: which card image is in color mode (-1 = none).
	let activeImageIndex = $state(-1);

	function handleImageTap(e: Event, index: number) {
		if (window.matchMedia('(max-width: 767px)').matches) {
			e.preventDefault();
			e.stopPropagation();
			activeImageIndex = activeImageIndex === index ? -1 : index;
		}
	}

	// Slice-23: abbreviate tech stack labels to mono codes for the footer band.
	const TECH_ABBR: Record<string, string> = {
		PostgreSQL: 'PG',
		'SQL Server': 'SQL',
		Python: 'PY',
		DAX: 'DAX',
		'Power BI': 'BI',
		dbt: 'DBT',
		'Apache Airflow': 'AIRFLOW',
		Alembic: 'ALEM',
		MySQL: 'MY',
		SSMS: 'SSMS',
		'T-SQL': 'T-SQL',
		Retool: 'RT',
		'REST API': 'API',
		'Node.js': 'NODE',
		'PL/pgSQL': 'PLSQL',
	};

	function abbrev(tech: string): string {
		return TECH_ABBR[tech] ?? tech.slice(0, 4).toUpperCase();
	}

	// Embla carousel — infinite loop. The library handles slide cloning
	// internally so card 1 appears next to card 5 seamlessly during scroll.
	let emblaApi: EmblaCarouselType | undefined = $state(undefined);
	let currentIndex = $state(0);

	const emblaOptions = {
		loop: true,
		align: 'start' as const,
		slidesToScroll: 1,
		containScroll: false as const,
	};

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		currentIndex = emblaApi.selectedScrollSnap();
		emblaApi.on('select', () => {
			if (emblaApi) currentIndex = emblaApi.selectedScrollSnap();
		});
	}

	function scrollPrev() {
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		emblaApi?.scrollNext();
	}
</script>

<section
	data-testid="proof-reel-section"
	class="proof-reel-section relative px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- Embla viewport — overflow hidden, slides translated by the library.
	     WheelGesturesPlugin enables horizontal trackpad swipes / mouse-wheel
	     scrolling to advance the carousel. -->
	<div class="embla" use:emblaCarouselSvelte={{ options: emblaOptions, plugins: [WheelGesturesPlugin()] }} onemblaInit={onEmblaInit}>
		<div class="embla__container">
			{#each visibleProjects as project, i}
				{@const title = resolveLocale(project.title, 'en')}
				{@const metric = project.impactMetric}
				{@const metricLabel = metric ? resolveLocale(metric.label, 'en') : ''}
				{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
				<div class="embla__slide">
					<div
						class="proof-card group relative overflow-hidden"
						data-active={currentIndex === i}
						use:cursorGlow={{ intensity: 0.1 }}
						use:cardParallax
					>
						<!-- Image: full-bleed in grid row 1. -->
						<button
							type="button"
							class="proof-image relative w-full overflow-hidden"
							class:image-active={activeImageIndex === i}
							data-testid="proof-card-image"
							onclick={(e) => handleImageTap(e, i)}
							aria-label={toggleColorAriaTemplate.replace('{title}', title)}
						>
							<img
								src={imageUrl}
								alt={title}
								class="proof-img absolute inset-0 h-full w-full object-cover grayscale brightness-[0.7] transition-all duration-500 ease-out"
								loading="lazy"
							/>
							<div class="proof-img-overlay absolute inset-0 bg-black/15 transition-opacity duration-500"></div>
							<!-- Gradient overlay for title legibility at image bottom. -->
							<div class="proof-image-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"></div>
							<!-- 01 / FEATURED marker at the image's top-left. -->
							<div class="proof-marker absolute left-[1.75rem] top-[1.5rem] z-[3]">
								{String(i + 1).padStart(2, '0')} / FEATURED
							</div>
						</button>

						<!-- Title: grid-row 1 (overlaps image) on desktop, grid-row 2 on mobile.
						     Sits over the gradient on desktop, below the image on mobile. -->
						<div class="proof-title" data-testid="proof-card-title">{title}</div>

						<!-- Footer: grid-row 2 (or 3 on mobile). Click target for nav. -->
						<a
							href="/projects/{project.slug}"
							class="proof-footer-link tap-press"
							data-testid="proof-card"
						>
							<div class="proof-footer flex items-center justify-between">
								<div class="proof-footer-left flex flex-col">
									{#if metric?.before}
										<span data-testid="proof-metric-before" class="proof-metric-before">{metric.before}</span>
									{/if}
									<div class="flex items-baseline gap-2">
										<span data-testid="proof-metric-value" class="proof-metric-value">{metric?.value}</span>
										<span data-testid="proof-metric-label" class="proof-metric-label">{metricLabel}</span>
									</div>
								</div>
								<div class="proof-footer-right flex flex-wrap items-center justify-end gap-x-2">
									{#each project.stack as tech, ti}
										<span
											data-testid="proof-tag"
											class="proof-tag"
											use:magnetic={{ strength: 8, radius: 70 }}
										>{abbrev(tech)}{ti < project.stack.length - 1 ? ' ·' : ''}</span>
									{/each}
								</div>
							</div>
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Carousel controls + position counter + View all link. -->
	<div class="proof-controls">
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollPrev}
			aria-label="Previous projects"
		>
			←
		</button>
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollNext}
			aria-label="Next projects"
		>
			→
		</button>
		<div class="proof-count" aria-live="polite" data-testid="proof-count">
			<span class="proof-count-current">{String(currentIndex + 1).padStart(2, '0')}</span>
			<span class="proof-count-sep">/</span>
			<span class="proof-count-total">{String(total).padStart(2, '0')}</span>
		</div>
		<a
			data-testid="proof-view-all"
			href={proofReelContent.viewAllHref}
			class="proof-view-all tap-feedback ml-auto inline-flex items-center font-mono text-caption tracking-wider md:text-mono"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	/* Section vertical rhythm — fills 100dvh on lg+, content centered. */
	.proof-reel-section {
		padding-block: clamp(2rem, 4dvh, 4rem);
	}

	/* Embla viewport. The library translates slides inside; the viewport
	   clips the overflow.
	   overflow-x: clip + overflow-y: visible so the hover-lift on
	   .proof-card (translateY(-3px)) doesn't get chopped off at the
	   top edge. clip is non-scrollable and doesn't force overflow-y
	   to auto, unlike `hidden`. */
	.embla {
		overflow-x: clip;
		overflow-y: visible;
		margin-bottom: 1.5rem;
		padding-block: 0.5rem;
	}

	.embla__container {
		display: flex;
		touch-action: pan-y pinch-zoom;
	}

	/* Per-slide margin instead of container `gap`. Embla's loop wraps slides
	   via CSS transforms — flex `gap` doesn't apply across the loop seam,
	   so card 1 ends up flush against card 5 with no spacing. Margin-right
	   on every slide guarantees the gap shows up everywhere, including the
	   wrap-around. */
	.embla__slide {
		flex: 0 0 clamp(340px, 44vw, 720px);
		min-width: 0;
		margin-right: 1.25rem;
	}

	/* Card frame — brand-aligned card-surface pattern. Grid with overlap:
	   image and title share row 1 (title align-self: end pins it to the
	   image's bottom edge); footer is row 2. No empty space anywhere. */
	.proof-card {
		background: var(--background);
		border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
		border-radius: var(--radius-lg);
		padding: 0;
		margin: 0;
		height: clamp(32rem, 70dvh, 50rem);
		display: grid;
		/* 4:1 ratio per design — image takes 4/5 of card height, footer 1/5.
		   Explicit fr ratio (not 1fr/auto) so the footer scales with the
		   card instead of being content-sized. */
		grid-template-rows: 4fr 1fr;
		grid-template-columns: 1fr;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default),
			transform 220ms var(--ease-default);
	}

	.proof-card:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		box-shadow: var(--shadow-section);
		transform: translateY(-3px);
	}

	/* Image button: fills row 1 of the grid exactly. */
	button.proof-image {
		appearance: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
		text-align: start;
		background: transparent;
		display: block;
		width: 100%;
		height: 100%;
		grid-row: 1;
		grid-column: 1;
		position: relative;
	}

	/* The global `img { height: auto }` rule in app.css wins over Tailwind's
	   .h-full via cascade-layer ordering, leaving the image at its natural
	   aspect ratio (e.g. 632×474 for an 800×600 source) inside a 632×571
	   button — visible as a gap at the bottom of every card. Forced fill
	   via !important on the scoped image selector. */
	.proof-img {
		height: 100% !important;
		width: 100% !important;
	}

	/* Magazine gradient — fade from transparent to near-black at the bottom
	   for title overlay legibility. */
	.proof-image-gradient {
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%);
	}

	/* "01 / FEATURED" marker — brand-orange mono caption at top-left of image. */
	.proof-marker {
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		font-weight: 700;
	}

	@media (min-width: 768px) {
		.proof-marker {
			font-size: 1rem;
			letter-spacing: 0.24em;
		}
	}

	/* Image colour states:
	   - hover (desktop) → in color
	   - mobile-tap toggle → in color
	   - the currently-active carousel slide → in color (persistent
	     spotlight on the focused project on both desktop and mobile).
	   - Active slide also gets a brighter border + heavier glow to
	     reinforce the "you're looking at this one" cue. */
	.proof-card:hover .proof-img,
	.proof-image.image-active .proof-img,
	.proof-card[data-active='true'] .proof-img {
		filter: grayscale(0) brightness(0.95);
	}

	.proof-card:hover .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay,
	.proof-card[data-active='true'] .proof-img-overlay {
		opacity: 0;
	}

	.proof-card[data-active='true'] {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		box-shadow: var(--shadow-section);
	}

	/* Title — overlays the image's bottom via grid overlap on desktop;
	   normal flow below the image on mobile. Translates by --parallax-x /
	   --parallax-y (set by cardParallax) so it drifts slightly toward the
	   cursor. */
	.proof-title {
		grid-row: 1;
		grid-column: 1;
		align-self: end;
		justify-self: stretch;
		z-index: 2;
		padding: 1.5rem 1.75rem;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 2rem;
		line-height: 1.05;
		color: var(--primary);
		letter-spacing: -0.02em;
		text-transform: uppercase;
		pointer-events: none;
		/* 2.5× multiplier on top of cardParallax's ±4px clamp → effective
		   drift of ±10px. Stronger response without forking the primitive. */
		transform: translate(
			calc(var(--parallax-x, 0px) * 2.5),
			calc(var(--parallax-y, 0px) * 2.5)
		);
		transition: transform 180ms var(--ease-default);
	}

	@media (min-width: 768px) {
		.proof-title {
			font-size: 2.75rem;
			text-shadow:
				0 2px 18px rgba(0, 0, 0, 0.9),
				0 0 28px color-mix(in srgb, var(--primary) 40%, transparent);
		}
	}

	/* Mobile rules consolidated at the end of styles (search "MOBILE OVERRIDES")
	   so the cascade order properly defeats the desktop defaults. */

	/* Footer link — grid row 2 on desktop. */
	.proof-footer-link {
		grid-row: 2;
		grid-column: 1;
		display: block;
		text-decoration: none;
	}

	.proof-footer {
		padding: 1.75rem 1.75rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		/* Dropped explicit min-height so the grid's 1fr ratio dictates row
		   height instead of being bumped by content constraints. */
		min-height: 0;
		height: 100%;
		box-sizing: border-box;
	}

	.proof-metric-before {
		color: var(--muted-foreground);
		font-size: 1.05rem;
		text-decoration: line-through;
		margin-bottom: 0.25rem;
	}

	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.875rem;
		line-height: 1;
		color: var(--primary);
		letter-spacing: -0.02em;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.proof-tag {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--muted-foreground);
		letter-spacing: 0.1em;
		font-weight: 500;
	}

	@media (min-width: 768px) {
		.proof-metric-value {
			font-size: 2.25rem;
		}
		.proof-metric-label {
			font-size: 1rem;
		}
		.proof-tag {
			font-size: 1rem;
		}
		.proof-metric-before {
			font-size: 1.15rem;
		}
	}

	/* Carousel controls + counter + View all row. */
	.proof-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.proof-control-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 999px;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 200ms ease-out,
			border-color 200ms ease-out;
	}

	.proof-control-btn:hover {
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		border-color: color-mix(in srgb, var(--primary) 55%, transparent);
	}

	/* Carousel position counter — mono caption, brand-orange. */
	.proof-count {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375rem;
		margin-left: 0.5rem;
		font-family: var(--font-mono);
		letter-spacing: 0.15em;
	}

	.proof-count-current {
		font-size: 1rem;
		font-weight: 700;
		color: var(--primary);
	}

	.proof-count-sep {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--primary) 40%, transparent);
	}

	.proof-count-total {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--primary) 50%, transparent);
	}

	.proof-view-all {
		color: var(--primary);
		border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		min-height: 2.75rem;
		padding-inline: 0.25rem;
	}

	/* ═════════════════════════════════════════════════════════════════
	   MOBILE OVERRIDES — placed at the end of the cascade so they
	   reliably defeat the desktop defaults (which all use the same
	   .proof-* class specificity). DO NOT TOUCH the desktop rules
	   above — those are locked.
	   ═════════════════════════════════════════════════════════════════ */
	@media (max-width: 767px) {
		/* Extra padding-block on mobile so the section breathes between the
		   adjacent <Separator /> bars and the carousel content. */
		.proof-reel-section {
			padding-block: clamp(2.5rem, 6dvh, 4rem);
		}

		/* Card: same 4:1 (image:footer) layout as desktop, just smaller.
		   Fixed clamp height + explicit fr ratio so every card has the
		   same image-row size and footer-row size regardless of content. */
		.proof-card {
			height: clamp(20rem, 52dvh, 28rem);
			grid-template-rows: 4fr 1fr;
		}

		/* Image: fills row 1 via the grid track. */
		button.proof-image {
			grid-row: 1;
			height: 100%;
		}

		/* Marker: smaller on mobile, top-left of image. */
		.proof-marker {
			font-size: 0.75rem;
			letter-spacing: 0.18em;
		}

		/* Title: overlays the image's bottom (grid row 1, align-self: end)
		   — same layout as desktop, just smaller. Drop-shadow restored for
		   legibility over the gradient. */
		.proof-title {
			grid-row: 1;
			grid-column: 1;
			align-self: end;
			justify-self: stretch;
			z-index: 2;
			padding: 0.875rem 1.25rem;
			font-size: 1.375rem;
			line-height: 1.1;
			text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
			pointer-events: none;
		}

		/* Footer: row 2 (below image), same as desktop. */
		.proof-footer-link {
			grid-row: 2;
			grid-column: 1;
		}

		/* Stack metric (left) and tags (right) vertically — the side-by-side
		   layout is too cramped at mobile widths. */
		.proof-footer {
			padding: 1rem 1.25rem;
			min-height: 0;
			height: auto;
			flex-direction: column;
			align-items: flex-start;
			justify-content: flex-start;
			gap: 0.5rem;
		}

		.proof-footer-right {
			justify-content: flex-start !important;
		}

		.proof-metric-value {
			font-size: 1.375rem;
		}
		.proof-metric-label {
			font-size: 0.75rem;
		}
		.proof-tag {
			font-size: 0.75rem;
		}
		.proof-metric-before {
			font-size: 0.875rem;
		}

		/* Tap cursor on the image button. */
		.proof-image {
			cursor: pointer;
		}
	}
</style>
