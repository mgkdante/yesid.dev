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

	// Carousel controls: scroll by one card width per click.
	let carouselEl = $state<HTMLDivElement | undefined>(undefined);

	function getStep(): number {
		if (!carouselEl) return 400;
		const first = carouselEl.children[0] as HTMLElement | undefined;
		if (!first) return 400;
		const gap = parseFloat(getComputedStyle(carouselEl).columnGap || '24') || 24;
		return first.getBoundingClientRect().width + gap;
	}

	function scrollPrev() {
		carouselEl?.scrollBy({ left: -getStep(), behavior: 'smooth' });
	}

	function scrollNext() {
		carouselEl?.scrollBy({ left: getStep(), behavior: 'smooth' });
	}
</script>

<section
	data-testid="proof-reel-section"
	class="proof-reel-section relative px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- Horizontal carousel: 2-3 cards visible, scroll-snap on each. -->
	<div class="proof-carousel-viewport">
		<div class="proof-carousel" bind:this={carouselEl}>
			{#each projects as project, i}
				{#if project}
					{@const title = resolveLocale(project.title, 'en')}
					{@const metric = project.impactMetric}
					{@const metricLabel = metric ? resolveLocale(metric.label, 'en') : ''}
					{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
					<div class="proof-card group relative flex flex-col overflow-hidden">
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
							<div class="proof-image-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"></div>
							<!-- 01 / FEATURED marker on the lower third of the image. -->
							<div class="proof-marker absolute left-[1.25rem] bottom-[4.25rem] z-[3]">
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

	<!-- Carousel controls + View all link. -->
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
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}

	.proof-card:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		box-shadow: var(--shadow-section);
	}

	/* Button reset for image area. Explicit zero on all spacing axes so the
	   button hugs the card's rounded top edge without any user-agent or
	   inherited margin sneaking in. */
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
	}

	/* Image height — sized for the 100dvh section so 2 cards comfortably
	   fit in view with a third peeking, per operator direction. */
	.proof-image {
		height: clamp(16rem, 44dvh, 28rem);
	}

	/* Magazine gradient — fade from transparent to near-black at the bottom
	   for title overlay legibility. */
	.proof-image-gradient {
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%);
	}

	/* "01 / FEATURED" marker — brand-orange mono caption. */
	.proof-marker {
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		font-weight: 600;
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
	   image on desktop. Bumped weight + size + drop-shadow per operator
	   feedback ("bigger and flashier"). */
	.proof-title {
		padding: 1.25rem 1.5rem 0.5rem;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.75rem;
		line-height: 1.1;
		color: var(--primary);
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	@media (min-width: 768px) {
		.proof-title {
			/* Pull up to overlap the image's bottom — title sits over the
			   gradient, anchored 1.5rem from the image's bottom edge. */
			margin-top: -4.5rem;
			padding: 0 1.5rem 1rem;
			font-size: 2.125rem;
			color: var(--primary);
			text-shadow:
				0 2px 16px rgba(0, 0, 0, 0.85),
				0 0 24px color-mix(in srgb, var(--primary) 35%, transparent);
			position: relative;
			z-index: 2;
		}
	}

	/* Footer band — slim, metric on the left, tags on the right. */
	.proof-footer {
		padding: 1rem 1.25rem;
		border-top-color: #262626;
		min-height: 4rem;
	}

	.proof-metric-before {
		color: var(--muted-foreground);
		font-size: 0.8125rem;
		text-decoration: line-through;
		margin-bottom: 0.125rem;
	}

	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.375rem;
		line-height: 1;
		color: var(--primary);
		letter-spacing: -0.02em;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.proof-tag {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		letter-spacing: 0.08em;
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
		padding-inline: var(--space-page-x);
		padding-bottom: 0.5rem;
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
