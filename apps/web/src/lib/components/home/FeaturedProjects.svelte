<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.

  Slice-23: Magazine card layout. Image full-bleed at top, title overlay
  on desktop / below image on mobile, slim footer band with metric (left)
  and abbreviated tech tags (right).

  Desktop: hover turns image to color. Mobile: tap image toggles color,
  tap title/footer navigates to the project.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils';

	import { getProjectBySlug } from '$lib/content';
	import type { Project, ProofReelContent } from '$lib/types';
	import { Card } from '$lib/components/ui/card';

	// slice-18i Phase 7C: proofReelContent now flows as a prop from the server load.
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
</script>

<section
	data-testid="proof-reel-section"
	class="relative py-[var(--space-section-y)] px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- 3-card grid -->
	<div class="proof-tiles-grid mb-8 grid grid-cols-1 gap-[var(--space-card-gap)] sm:grid-cols-2 lg:grid-cols-3 md:mb-10">
		{#each projects as project, i}
			{#if project}
				{@const title = resolveLocale(project.title, 'en')}
				{@const metric = project.impactMetric}
				{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
				<Card class="proof-card group relative flex flex-col overflow-hidden">
					<!-- Image: full-bleed top, B&W → color hover/tap toggle. -->
					<button
						type="button"
						class="proof-image relative h-48 w-full overflow-hidden sm:h-56"
						class:image-active={activeImageIndex === i}
						data-testid="proof-card-image"
						onclick={(e) => handleImageTap(e, i)}
						aria-label={toggleColorAriaTemplate.replace('{title}', title)}
					>
						<img
							src={imageUrl}
							alt={title}
							class="proof-img h-full w-full object-cover grayscale brightness-[0.4] transition-all duration-500 ease-out"
							loading="lazy"
						/>
						<div class="proof-img-overlay absolute inset-0 bg-black/30 transition-opacity duration-500"></div>
						<!-- Magazine gradient for legibility under the overlay title. -->
						<div class="proof-image-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"></div>
						<!-- 01 / FEATURED marker on the lower third of the image. -->
						<div class="proof-marker absolute left-[1.125rem] bottom-[3.25rem] z-[3]">
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
									<span data-testid="proof-metric-label" class="proof-metric-label">{metric?.label}</span>
								</div>
							</div>
							<div class="proof-footer-right flex flex-wrap items-center justify-end gap-x-2">
								{#each project.stack as tech, ti}
									<span data-testid="proof-tag" class="proof-tag">{abbrev(tech)}{ti < project.stack.length - 1 ? ' ·' : ''}</span>
								{/each}
							</div>
						</div>
					</a>
				</Card>
			{/if}
		{/each}
	</div>

	<!-- View all link -->
	<div class="text-right">
		<a
			data-testid="proof-view-all"
			href={proofReelContent.viewAllHref}
			class="tap-feedback inline-flex items-center font-mono text-caption tracking-wider md:text-mono"
			style="color: var(--primary); border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent); min-height: 2.75rem; padding-inline: 0.25rem;"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	/* Card frame — Magazine DNA from slice-23 design. */
	:global(.proof-card) {
		background: #1e1e1e;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
	}

	/* Button reset for image area. */
	button.proof-image {
		appearance: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: start;
		background: transparent;
	}

	/* Magazine gradient — soft fade from transparent to near-black at the
	   bottom for title overlay legibility. */
	.proof-image-gradient {
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 100%);
	}

	/* "01 / FEATURED" marker — brand-orange mono caption. */
	.proof-marker {
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		font-weight: 600;
	}

	/* Desktop hover: image turns color, overlay fades. */
	:global(.proof-card:hover) .proof-img,
	.proof-image.image-active .proof-img {
		filter: grayscale(0) brightness(0.7);
	}

	:global(.proof-card:hover) .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay {
		opacity: var(--opacity-subtle);
	}

	/* Title: below image on mobile, overlay on image on desktop. */
	.proof-title {
		padding: 1rem 1.125rem 0.5rem;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.25rem;
		line-height: 1.2;
		color: var(--foreground);
	}

	@media (min-width: 768px) {
		.proof-title {
			/* Pull up to overlap the image's bottom — title sits over the
			   gradient overlay, anchored 1.125rem from the image's bottom edge. */
			margin-top: -3.25rem;
			padding: 0 1.125rem 0.75rem;
			font-size: 1.375rem;
			color: #ffffff;
			text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
			position: relative;
			z-index: 2;
		}
	}

	/* Footer band — slim, metric on the left, tags on the right. */
	.proof-footer {
		padding: 0.875rem 1.125rem;
		border-top-color: #262626;
		min-height: 3.5rem;
	}

	.proof-metric-before {
		color: var(--muted-foreground);
		font-size: 0.8125rem;
		text-decoration: line-through;
		margin-bottom: 0.125rem;
	}

	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.1875rem;
		line-height: 1;
		color: var(--primary);
		letter-spacing: -0.01em;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.proof-tag {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		letter-spacing: 0.05em;
	}

	.proof-card-link {
		text-decoration: none;
	}

	/* Mobile tap cursor for image. */
	@media (max-width: 767px) {
		.proof-image {
			cursor: pointer;
		}
	}

	/* At 640–1023px (tablet range): force single-column to prevent the 3rd
	   tile from orphaning in a 2-col grid at 768px. */
	@media (min-width: 640px) and (max-width: 1023px) {
		.proof-tiles-grid {
			grid-template-columns: 1fr !important;
		}
	}

	/* Consistent card alignment within the grid. */
	.proof-tiles-grid :global(.proof-card) {
		align-self: stretch;
	}
</style>
