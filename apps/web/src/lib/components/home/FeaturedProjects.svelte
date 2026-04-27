<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.
  Two-column cards: text/metrics left, B&W image right.
  Desktop: hover turns image to color. Mobile: tap image toggles color, tap text navigates.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils';

	import { proofReelContent, getProjectBySlug, rawProjectToProject } from '$lib/content';
	import type { Project } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import { SectionHeading } from '$lib/components/brand';

	const heading = resolveLocale(proofReelContent.heading, 'en');
	const subheading = resolveLocale(proofReelContent.subheading, 'en');
	const sectionLabel = resolveLocale(proofReelContent.sectionLabel, 'en');
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, 'en');
	const toggleColorAriaTemplate = resolveLocale(proofReelContent.toggleColorAria, 'en');

	const projects: (Project | undefined)[] = proofReelContent.slugs.map((slug) => {
		const raw = getProjectBySlug(slug);
		return raw ? rawProjectToProject(raw) : undefined;
	});

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
</script>

<section
	data-testid="proof-reel-section"
	class="relative py-[var(--space-section-y)] px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<!-- 3-card grid -->
	<div class="mb-8 grid grid-cols-1 gap-[var(--space-card-gap)] sm:grid-cols-2 lg:grid-cols-3 md:mb-10">
		{#each projects as project, i}
			{#if project}
				{@const title = resolveLocale(project.title, 'en')}
				{@const metric = project.impactMetric}
				{@const imageUrl = proofReelContent.images[project.slug as keyof typeof proofReelContent.images]}
				<Card class="proof-card group flex flex-col">
					<!-- Image — B&W default, color on hover (desktop) / tap (mobile) -->
					<button
						type="button"
						class="proof-image relative h-48 w-full overflow-hidden md:h-56"
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
					</button>

					<!-- Text — links to project -->
					<a
						href="/projects/{project.slug}"
						class="block flex-1 p-5 md:p-6"
						data-testid="proof-card"
					>
						{#if metric}
							<div class="mb-1">
								{#if metric.before}
									<span
										data-testid="proof-metric-before"
										class="mr-1.5 text-heading font-normal line-through md:text-title"
										style="color: var(--muted-foreground);"
									>{metric.before}</span>
								{/if}
								<span
									data-testid="proof-metric-value"
									class="font-heading text-4xl font-black leading-none tracking-tight md:text-5xl"
									style="color: var(--primary); letter-spacing: -0.03em;"
								>{metric.value}</span>
							</div>
							<div
								data-testid="proof-metric-label"
								class="mb-5 text-small md:mb-6"
								style="color: var(--secondary-foreground);"
							>{metric.label}</div>
						{/if}

						<div
							data-testid="proof-card-title"
							class="mb-4 font-heading text-body-lg font-bold leading-snug md:mb-5 md:text-heading"
							style="color: var(--foreground);"
						>{title}</div>

						<div class="flex flex-wrap gap-1.5">
							{#each project.stack as tech}
								<span data-testid="proof-tag">
									<Badge variant="tag-active" size="sm">{tech}</Badge>
								</span>
							{/each}
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
			class="font-mono text-caption tracking-wider md:text-mono"
			style="color: var(--primary); border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	/* Button reset for proof-image */
	button.proof-image {
		appearance: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: start;
		background: transparent;
	}

	/* Desktop hover: image turns color */
	.proof-card:hover .proof-img,
	.proof-image.image-active .proof-img {
		filter: grayscale(0) brightness(0.7);
	}

	.proof-card:hover .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay {
		opacity: var(--opacity-subtle);
	}

	.proof-card:hover [data-testid='proof-tag'] {
		color: color-mix(in srgb, var(--primary) 85%, transparent) !important;
		border-color: color-mix(in srgb, var(--primary) 40%, transparent) !important;
		background: color-mix(in srgb, var(--primary) 8%, transparent) !important;
	}

	/* Mobile image tap cursor */
	@media (max-width: 767px) {
		.proof-image {
			cursor: pointer;
		}
	}
</style>
