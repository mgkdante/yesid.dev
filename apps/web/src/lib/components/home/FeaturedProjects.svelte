<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.

  Slice-23: Magazine card layout in a horizontal carousel.
  - Image full-bleed at top (flush with card edges, no Card py-4 padding)
  - "01 / FEATURED" mono marker overlaid on the image's lower-third
  - Brand-orange title overlay on the image (desktop) / below image (mobile)
  - Slim footer band with brand-orange metric (left) and abbreviated tech
    tags in mono (right)
  - 5 featured slugs in a horizontal scroll-snap carousel — 2-3 cards
    visible at once, arrow buttons advance one card at a time
  - Section reserves 100dvh of vertical space on desktop

  Desktop: hover turns image to color. Mobile: tap image toggles color,
  tap title/footer navigates to the project.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils';
	import { getProjectBySlug } from '$lib/content';
	import type { Project, ProofReelContent } from '$lib/types';

	let { proofReel: proofReelContent }: { proofReel: ProofReelContent } = $props();

	const toggleColorAriaTemplate = resolveLocale(proofReelContent.toggleColorAria, 'en');
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, 'en');

	const projects: (Project | undefined)[] = proofReelContent.slugs.map((slug) =>
		getProjectBySlug(slug),
	);

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
	// Curated for the values used in projects.ts; falls back to first 4 chars
	// uppercased for anything unmapped.
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

	// Carousel: track current index, wrap-around at boundaries, smooth scroll
	// between adjacent cards / instant jump across the loop seam so the user
	// experiences infinite cycling. The count display always reflects the
	// active card (1-indexed) out of total.
	let carouselEl = $state<HTMLDivElement | undefined>(undefined);
	let currentIndex = $state(0);
	const visibleProjects = $derived(projects.filter((p): p is Project => Boolean(p)));
	const total = $derived(visibleProjects.length);

	function scrollToIndex(idx: number, behavior: ScrollBehavior = 'smooth') {
		if (!carouselEl) return;
		const card = carouselEl.children[idx] as HTMLElement | undefined;
		if (!card) return;
		carouselEl.scrollTo({ left: card.offsetLeft, behavior });
		currentIndex = idx;
	}

	function scrollPrev() {
		if (total === 0) return;
		if (currentIndex === 0) {
			// At the start — jump instantly to the end to keep the loop seamless.
			scrollToIndex(total - 1, 'instant' as ScrollBehavior);
		} else {
			scrollToIndex(currentIndex - 1);
		}
	}

	function scrollNext() {
		if (total === 0) return;
		if (currentIndex === total - 1) {
			// At the end — jump instantly to the start.
			scrollToIndex(0, 'instant' as ScrollBehavior);
		} else {
			scrollToIndex(currentIndex + 1);
		}
	}

	// Update currentIndex when the user drag-scrolls (so the count stays
	// accurate without button presses). Debounce briefly so we read the
	// settled scrollLeft after scroll-snap has locked onto a card.
	let scrollDebounce: ReturnType<typeof setTimeout> | null = null;
	function handleCarouselScroll() {
		if (!carouselEl) return;
		if (scrollDebounce) clearTimeout(scrollDebounce);
		scrollDebounce = setTimeout(() => {
			if (!carouselEl) return;
			const cards = Array.from(carouselEl.children) as HTMLElement[];
			if (cards.length === 0) return;
			const scrollLeft = carouselEl.scrollLeft;
			// Pick the card whose offsetLeft is closest to scrollLeft.
			let nearest = 0;
			let nearestDist = Infinity;
			for (let i = 0; i < cards.length; i++) {
				const dist = Math.abs(cards[i].offsetLeft - scrollLeft);
				if (dist < nearestDist) {
					nearest = i;
					nearestDist = dist;
				}
			}
			if (nearest !== currentIndex) currentIndex = nearest;
		}, 120);
	}
</script>

<section
	data-testid="proof-reel-section"
	class="proof-reel-section relative px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- Horizontal carousel: 2-3 cards visible, scroll-snap on each. -->
	<div class="proof-carousel-viewport">
		<div class="proof-carousel" bind:this={carouselEl} onscroll={handleCarouselScroll}>
			{#each projects as project, i}
				{#if project}
					{@const title = resolveLocale(project.title, 'en')}
					{@const metric = project.impactMetric}
					{@const metricLabel = metric ? resolveLocale(metric.label, 'en') : ''}
					{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
					<div class="proof-card group relative overflow-hidden">
						<!-- Image: full-bleed, B&W → color hover/tap toggle. -->
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
								class="proof-img h-full w-full object-cover grayscale brightness-[0.7] transition-all duration-500 ease-out"
								loading="lazy"
							/>
							<div class="proof-img-overlay absolute inset-0 bg-black/15 transition-opacity duration-500"></div>
							<!-- Gradient overlay for title legibility. -->
							<div class="proof-image-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"></div>
							<!-- 01 / FEATURED marker — top-left of image, well clear of the
							     title overlay at the bottom. -->
							<div class="proof-marker absolute left-[1.75rem] top-[1.5rem] z-[3]">
								{String(i + 1).padStart(2, '0')} / FEATURED
							</div>
						</button>

						<!-- Title + footer wrapped in the project link. -->
						<a
							href="/projects/{project.slug}"
							class="proof-card-link tap-press flex flex-1 flex-col"
							data-testid="proof-card"
						>
							<div class="proof-title" data-testid="proof-card-title">{title}</div>

							<div class="proof-footer mt-auto flex items-center justify-between border-t">
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
										<span data-testid="proof-tag" class="proof-tag">{abbrev(tech)}{ti < project.stack.length - 1 ? ' ·' : ''}</span>
									{/each}
								</div>
							</div>
						</a>
					</div>
				{/if}
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

	/* Card frame — brand-aligned card-surface pattern (matches
	   $lib/components/ui/card/card.svelte's .card-surface): site background
	   + brand-orange border that intensifies on hover, plus the global
	   section shadow on hover. Padding/margin set to 0 explicitly so the
	   image button sits flush against the rounded top edge. */
	.proof-card {
		background: var(--background);
		border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
		border-radius: var(--radius-lg);
		padding: 0;
		margin: 0;
		/* Explicit height + grid rows so every card has the SAME total
		   height, image row, and text row — image never floats with a gap
		   above it, and the text section is consistent across cards
		   regardless of content variation. */
		height: clamp(34rem, 78dvh, 56rem);
		display: grid;
		grid-template-rows: clamp(22rem, 56dvh, 38rem) 1fr;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}

	.proof-card:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		box-shadow: var(--shadow-section);
	}

	/* Image button: fills row 1 of the grid exactly. No spacing of its own. */
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
	}

	/* Link section: fills row 2 of the grid. Internal flex column so title
	   and footer stack with the footer pushed to the bottom. */
	.proof-card-link {
		grid-row: 2;
		display: flex;
		flex-direction: column;
		min-height: 0;
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

	/* Desktop hover: image turns color, overlay fades. */
	.proof-card:hover .proof-img,
	.proof-image.image-active .proof-img {
		filter: grayscale(0) brightness(0.85);
	}

	.proof-card:hover .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay {
		opacity: var(--opacity-subtle);
	}

	/* Title: brand-orange, big & flashy. Below image on mobile, overlay on
	   image on desktop. Scaled up again per operator direction (taller
	   cards → bigger title). */
	.proof-title {
		padding: 1.5rem 1.75rem 0.75rem;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 2rem;
		line-height: 1.05;
		color: var(--primary);
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	@media (min-width: 768px) {
		.proof-title {
			/* Pull up to overlap the image's bottom — title sits over the
			   gradient, anchored 1.75rem from the image's bottom edge. */
			margin-top: -5.25rem;
			padding: 0 1.75rem 1.25rem;
			font-size: 2.75rem;
			color: var(--primary);
			text-shadow:
				0 2px 18px rgba(0, 0, 0, 0.9),
				0 0 28px color-mix(in srgb, var(--primary) 40%, transparent);
			position: relative;
			z-index: 2;
		}
	}

	/* Footer band — slim, metric on the left, tags on the right.
	   All text scaled up to match the taller cards + bigger title. */
	.proof-footer {
		padding: 1.25rem 1.75rem;
		border-top-color: color-mix(in srgb, var(--primary) 15%, transparent);
		min-height: 5rem;
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

	.proof-card-link {
		text-decoration: none;
	}

	/* Carousel viewport: clips the horizontally scrolling carousel. */
	.proof-carousel-viewport {
		margin-inline: calc(var(--space-page-x) * -1);
		margin-bottom: 1.5rem;
	}

	.proof-carousel {
		display: flex;
		gap: 1.25rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		scrollbar-width: none;
		padding-inline-start: var(--space-page-x);
		padding-bottom: 0.5rem;
		/* Right padding sized so the LAST card can be scroll-snapped to the
		   viewport's leading edge — without it, card 5 caps out at the
		   right peek slot and clicking next at counts 4/5 produces no
		   visible movement. */
		padding-inline-end: calc(100vw - clamp(340px, 44vw, 720px));
	}
	.proof-carousel::-webkit-scrollbar {
		display: none;
	}

	/* Each card sized so 2 fit in viewport (with peek of the 3rd to signal
	   the carousel). Operator preference: bigger cards, fewer in view. */
	.proof-card {
		flex: 0 0 clamp(340px, 44vw, 720px);
		scroll-snap-align: start;
	}

	/* Carousel controls + View all row. */
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

	/* Mobile tap cursor for image. */
	@media (max-width: 767px) {
		.proof-image {
			cursor: pointer;
		}
	}
</style>
