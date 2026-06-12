<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.

  Slice-23: Magazine card layout in an Embla horizontal carousel with
  infinite loop.

  go2/home-cards (operator: "the cards don't say nothing — title, stack,
  metric and big ass pic"): story-first recompose of the card INTERIOR —
  the section's carousel grid/footprint is unchanged.
    - The image is a reduced band (theme-aware treatment: dark dims,
      light whitens — F5 precedent) with the title overlaying its bottom
      gradient (WHITE reflective voice, round-4 doctrine) and a 1px
      catch-light seam where the band meets the body (INTERLOCKING).
    - The body leads with a station signage chip (which station built
      it), the project's one-liner excerpt (the story), then the tech
      stack as a quiet mono line.
    - Footer keeps the YELLOW-voice metric and adds a quiet orange
      exploration line ("see the build →").
    - Imageless projects (e.g. cafe-arona) get the gradient + service-SVG
      fallback panel, ProjectCard-style, with the title in foreground ink
      (no photo => no reflective voice).

  Desktop: hover turns image to color. Mobile: tap image toggles color,
  tap body/footer navigates to the project.
-->
<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import WheelGesturesPlugin from 'embla-carousel-wheel-gestures';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { resolveLocale } from '$lib/utils';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { fillTemplate } from '$lib/utils/labels';
	import { siteLabels } from '$lib/content';
	import type { Project, ProofReelContent, Service } from '$lib/types';
	import { cursorGlow, cardParallax, magnetic } from '$lib/motion/actions';

	// slice-28.5 (#124): the resolved featured projects arrive as a prop from
	// the home +page.server.ts load (repository -> adapter), replacing the
	// previous direct getProjectBySlug() calls into the $lib/content companion.
	// The server load preserves this component's exact prior semantics:
	// proofReel.slugs order, unresolvable slugs silently dropped.
	//
	// go2/home-cards: `services` joins the same prop pipeline (already loaded
	// for HomeServices) so each card can name the station that built it.
	let {
		proofReel: proofReelContent,
		projects,
		services = [],
	}: {
		proofReel: ProofReelContent;
		projects: readonly Project[];
		services?: readonly Service[];
	} = $props();

	const toggleColorAriaTemplate = resolveLocale(proofReelContent.toggleColorAria, locale);
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, locale);

	// go2-t1c2: chrome microcopy from the site_labels singleton, previous
	// literals kept as code fallbacks.
	const carouselPrevAria = resolveLocale(siteLabels.a11y.carouselPrev, locale) || 'Previous projects';
	const carouselNextAria = resolveLocale(siteLabels.a11y.carouselNext, locale) || 'Next projects';
	const markerFeaturedTemplate = resolveLocale(siteLabels.ui.markerFeatured, locale) || '{num} / FEATURED';

	// go2/home-cards: quiet exploration line — ORANGE standard action (it's
	// exploration, not conversion). Code literal per locale pending a
	// ui_see_the_build site_labels seed in a future CMS pass.
	const seeBuildLabel = resolveLocale(
		{ en: 'see the build', fr: 'voir le chantier', es: 'ver la obra' },
		locale,
	);

	const visibleProjects = $derived(projects);
	const total = $derived(visibleProjects.length);

	// go2/home-cards: each card declares the station that built it — the
	// project's primary service (relatedServices[0]) resolved against the
	// services prop. Unresolvable ids (archived stations) render no chip.
	function primaryService(project: Project): Service | undefined {
		const id = project.relatedServices[0];
		return id ? services.find((s) => s.id === id) : undefined;
	}

	/** Pad station number to 2 digits (1 → "01") — StationTabs convention. */
	function padStation(n: number): string {
		return String(n).padStart(2, '0');
	}

	// Imageless-project fallback panel gradient, keyed by primary service —
	// same token pairs as ProjectCard's listing fallback (GO-2 stations).
	const SERVICE_GRADIENTS: Record<string, [string, string]> = {
		'database-engineering': ['var(--primary)', 'var(--primary-hover)'],
		'data-pipeline': ['var(--accent)', 'var(--accent-hover)'],
		'analytics-reporting': ['var(--primary)', 'var(--accent)'],
		'web-development': ['var(--accent)', 'var(--primary)'],
	};

	function fallbackGradient(project: Project): [string, string] {
		return SERVICE_GRADIENTS[project.relatedServices[0] ?? ''] ?? ['var(--primary)', 'var(--accent)'];
	}

	// Mobile tap toggle: which card image is in color mode (-1 = none).
	let activeImageIndex = $state(-1);

	function handleImageTap(e: Event, index: number) {
		if (window.matchMedia('(max-width: 767px)').matches) {
			e.preventDefault();
			e.stopPropagation();
			activeImageIndex = activeImageIndex === index ? -1 : index;
		}
	}

	// Slice-23: abbreviate tech stack labels to mono codes for the stack line.
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
				{@const title = resolveLocale(project.title, locale)}
				{@const excerpt = resolveLocale(project.oneLiner, locale)}
				{@const metric = project.impactMetric}
				{@const metricLabel = metric ? resolveLocale(metric.label, locale) : ''}
				{@const imageUrl = proofReelContent.images[project.slug]}
				{@const service = primaryService(project)}
				{@const gradient = fallbackGradient(project)}
				<div class="embla__slide">
					<div
						class="proof-card group relative overflow-hidden"
						data-active={currentIndex === i}
						use:cursorGlow
						use:cardParallax
					>
						<!-- Image band: reduced-height row 1 — the image supports, the
						     content below leads. The button wraps the band — image is
						     decorative (alt=""); the button's aria-label carries the
						     accessible name including the title (slice-23 a11y:
						     decorative-image pattern avoids label-content-name-mismatch). -->
						<button
							type="button"
							class="proof-image relative w-full overflow-hidden"
							class:image-active={activeImageIndex === i}
							data-testid="proof-card-image"
							onclick={(e) => handleImageTap(e, i)}
							aria-label={toggleColorAriaTemplate.replace('{title}', title)}
						>
							{#if imageUrl}
								<img
									src={imageUrl}
									alt=""
									class="proof-img absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out"
									loading="lazy"
								/>
								<!-- Theme-tinted dim wash (F5 precedent): ink in dark mode,
								     paper in light — no hardcoded black. -->
								<div class="proof-img-overlay absolute inset-0 transition-opacity duration-500"></div>
								<!-- Title-legibility gradient at the band's bottom. Ground
								     stays near-black in BOTH modes — round-4 doctrine: the
								     WHITE reflective voice needs the photo's dark ground. -->
								<div class="proof-image-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"></div>
							{:else}
								<!-- Gradient + service-SVG fallback for imageless projects
								     (cafe-arona) — ProjectCard listing parity, token-driven. -->
								<div
									class="proof-image-fallback absolute inset-0 flex items-center justify-end pr-8"
									data-testid="proof-image-fallback"
									style="background: linear-gradient(135deg, color-mix(in srgb, {gradient[0]} 13%, transparent), color-mix(in srgb, {gradient[1]} 7%, transparent));"
								>
									{#if service?.svg}
										<img
											src="/svg/services/{service.svg}"
											alt=""
											width="96"
											height="96"
											class="proof-fallback-icon"
											loading="lazy"
										/>
									{/if}
								</div>
							{/if}
							<!-- 01 / FEATURED marker at the band's top-left. -->
							<div class="proof-marker absolute left-[1.75rem] top-[1.25rem] z-[3]">
								{fillTemplate(markerFeaturedTemplate, { num: String(i + 1).padStart(2, '0') })}
							</div>
						</button>

						<!-- Title: overlays the image band's bottom via grid overlap.
						     Over a photo it speaks the WHITE reflective voice (round-4
						     doctrine); over the fallback panel it drops to foreground
						     ink — no photo, no reflective register. -->
						<div
							class="proof-title"
							class:proof-title--ink={!imageUrl}
							data-testid="proof-card-title"
						>{title}</div>

						<!-- Body + footer: row 2 — the card's story. Click target for nav. -->
						<a
							href={localizeHref(`/projects/${project.slug}`, locale)}
							class="proof-body-link tap-press"
							data-testid="proof-card"
						>
							<div class="proof-body">
								<!-- Station signage chip — which station built it. Theme-
								     invariant signage pair (StationTabs backlit-sign precedent). -->
								{#if service}
									<span class="proof-station-chip" data-testid="proof-station-chip">
										<span class="proof-station-chip-num">{padStation(service.station)}</span>
										<span>{resolveLocale(service.title, locale)}</span>
									</span>
								{/if}

								<!-- The story line — the project's operator-written one-liner. -->
								<p class="proof-excerpt" data-testid="proof-excerpt">{excerpt}</p>

								<!-- Tech stack as a quiet mono line, pinned above the footer. -->
								<div class="proof-stack flex flex-wrap items-center gap-x-2">
									{#each project.stack as tech, ti}
										<span
											data-testid="proof-tag"
											class="proof-tag"
											use:magnetic={{ strength: 8, radius: 70 }}
										>{abbrev(tech)}{ti < project.stack.length - 1 ? ' ·' : ''}</span>
									{/each}
								</div>
							</div>

							<div class="proof-footer">
								<div class="proof-footer-left flex flex-col">
									{#if metric?.before}
										<span data-testid="proof-metric-before" class="proof-metric-before">{metric.before}</span>
									{/if}
									<div class="flex items-baseline gap-2">
										<span data-testid="proof-metric-value" class="proof-metric-value">{metric?.value}</span>
										<span data-testid="proof-metric-label" class="proof-metric-label">{metricLabel}</span>
									</div>
								</div>
								<!-- Quiet exploration line — ORANGE standard action. -->
								<span class="proof-see-build" data-testid="proof-see-build">
									{seeBuildLabel}
									<span class="proof-see-build-arrow" aria-hidden="true">→</span>
								</span>
							</div>
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Carousel controls + position counter + View all link.
	     Arrow glyphs are wrapped in aria-hidden so they don't compute as a
	     visible text label competing with each button's aria-label
	     (label-content-name-mismatch / WCAG 2.5.3). The accessible name is
	     "Previous/Next projects"; the glyph is decoration. -->
	<div class="proof-controls">
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollPrev}
			aria-label={carouselPrevAria}
		>
			<span aria-hidden="true">←</span>
		</button>
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollNext}
			aria-label={carouselNextAria}
		>
			<span aria-hidden="true">→</span>
		</button>
		<div class="proof-count" aria-live="polite" data-testid="proof-count">
			<span class="proof-count-current">{String(currentIndex + 1).padStart(2, '0')}</span>
			<span class="proof-count-sep">/</span>
			<span class="proof-count-total">{String(total).padStart(2, '0')}</span>
		</div>
		<a
			data-testid="proof-view-all"
			href={proofReelContent.viewAllHref}
			class="home-view-all tap-feedback ml-auto inline-flex items-center font-mono text-caption tracking-wider md:text-mono"
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
	   wrap-around.
	   go2/home-cards: display flex so the card stretches to the tallest
	   sibling (flex cross-axis stretch) — uniform card heights with zero
	   content clipping at any excerpt/title length. */
	.embla__slide {
		flex: 0 0 clamp(340px, 44vw, 720px);
		min-width: 0;
		margin-right: 1.25rem;
		display: flex;
	}

	/* Card frame — brand-aligned card-surface pattern. Grid with overlap:
	   image band and title share row 1 (title align-self: end pins it to
	   the band's bottom edge); body+footer link is row 2. */
	/* GO2-W5: surface-1 now aliases --card (tokens.json flip) so the panel
	   lifts solid off the board (no grid bleed-through); inset bevel =
	   panel catching the lamp. */
	/* go2/home-cards round-5 card parity: the chassis steps to the blog
	   list card's 3px frame (BlogRow/ProjectCard precedent — base 2px
	   card spec + one-step width override), same color + radius. */
	.proof-card {
		background: var(--surface-1);
		border: 2px solid var(--border-brand);
		border-width: 3px;
		border-radius: var(--radius-lg);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		padding: 0;
		margin: 0;
		width: 100%;
		min-height: clamp(30rem, 64dvh, 44rem);
		display: grid;
		/* Story-first recompose: the image is a reduced BAND (row 1, fixed
		   clamp) and the body takes the rest — content leads, image supports.
		   Row 2 is a bare 1fr (= minmax(auto, 1fr)): the auto floor lets the
		   track GROW with content (narrow cards, wrapped labels) instead of
		   letting the footer spill past the card edge. */
		grid-template-rows: clamp(11rem, 26dvh, 16rem) 1fr;
		grid-template-columns: 1fr;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default),
			transform 220ms var(--ease-default);
	}

	.proof-card:hover {
		border-color: var(--border-brand-active);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
		transform: translateY(-3px);
	}

	/* Image band button: fills row 1 of the grid exactly. */
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

	/* Catch-light seam — 1px lamp edge where the image band interlocks with
	   the body panel (GO2-W5 INTERLOCKING edge-highlight precedent). */
	button.proof-image::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 1px;
		background: var(--edge-highlight);
		z-index: 3;
		pointer-events: none;
	}

	/* The global `img { height: auto }` rule in app.css wins over Tailwind's
	   .h-full via cascade-layer ordering, leaving the image at its natural
	   aspect ratio inside the band — visible as a gap at the band's bottom.
	   Forced fill via !important on the scoped image selector. */
	.proof-img {
		height: 100% !important;
		width: 100% !important;
	}

	/* Theme-aware image treatment (go2/w4 F5 precedent): dark mode dims the
	   B&W photo; light mode WHITENS it instead so the band reads as bleached
	   paper, not a dark slab on the warm page. */
	.proof-img {
		filter: grayscale(1) brightness(0.7);
	}

	:global([data-theme='light']) .proof-img,
	:global(.theme-light) .proof-img {
		filter: grayscale(1) brightness(1.12) contrast(0.9);
	}

	/* Dim wash rides the theme's background token — ink in dark, paper in
	   light (no hardcoded black). */
	.proof-img-overlay {
		background: color-mix(in srgb, var(--background) 18%, transparent);
	}

	/* Magazine gradient — fade to near-black at the band's bottom for title
	   overlay legibility. Theme-INVARIANT ground per round-4 doctrine: the
	   WHITE reflective voice always sits on the photo's dark ground. */
	.proof-image-gradient {
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.88) 100%);
	}

	/* Imageless fallback: service SVG art at low opacity over the token
	   gradient panel — brightens a step on card hover (ProjectCard parity). */
	.proof-fallback-icon {
		opacity: 0.3;
		transition: opacity var(--duration-slow) var(--ease-default);
	}

	.proof-card:hover .proof-fallback-icon,
	.proof-image.image-active .proof-fallback-icon {
		opacity: 0.5;
	}

	/* "01 / FEATURED" marker — mono caption at top-left of image. Round-4
	   doctrine: station markers are wayfinding overlines — the YELLOW voice
	   (label-station precedent; accent-text = AA amber both modes). */
	.proof-marker {
		color: var(--accent-text);
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

	:global([data-theme='light']) .proof-card:hover .proof-img,
	:global(.theme-light) .proof-card:hover .proof-img,
	:global([data-theme='light']) .proof-image.image-active .proof-img,
	:global(.theme-light) .proof-image.image-active .proof-img,
	:global([data-theme='light']) .proof-card[data-active='true'] .proof-img,
	:global(.theme-light) .proof-card[data-active='true'] .proof-img {
		filter: grayscale(0) brightness(1);
	}

	.proof-card:hover .proof-img-overlay,
	.proof-image.image-active .proof-img-overlay,
	.proof-card[data-active='true'] .proof-img-overlay {
		opacity: 0;
	}

	.proof-card[data-active='true'] {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}

	/* Title — overlays the image band's bottom via grid overlap. Translates
	   by --parallax-x / --parallax-y (set by cardParallax) so it drifts
	   slightly toward the cursor. Round-4 doctrine: key headline words over
	   the photo gradient speak the WHITE reflective voice (theme-invariant —
	   the gradient ground is near-black in both modes); the orange glow
	   stays as the signage catch-light. */
	.proof-title {
		grid-row: 1;
		grid-column: 1;
		align-self: end;
		justify-self: stretch;
		z-index: 2;
		padding: 0.875rem 1.75rem 1rem;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: var(--text-heading);
		line-height: 1.05;
		color: var(--reflective);
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
			font-size: var(--text-title);
			text-shadow:
				0 2px 18px rgba(0, 0, 0, 0.9),
				0 0 28px color-mix(in srgb, var(--primary) 40%, transparent);
		}
	}

	/* Fallback-panel title — no photo, no reflective register: foreground
	   ink on the token gradient, both modes. */
	.proof-title.proof-title--ink {
		color: var(--foreground);
		text-shadow: none;
	}

	/* Body + footer link — grid row 2. Flex column: body grows, footer
	   pins to the card's bottom edge. */
	/* No min-height:0 anywhere down this chain — the link's min-content
	   contribution is the row's auto floor (see grid-template-rows note). */
	.proof-body-link {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
	}

	.proof-body {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 1.25rem 1.75rem 1rem;
	}

	/* Station signage chip — backlit station sign (StationTabs precedent):
	   theme-INVARIANT signage pair, 10.06:1 both modes. Declares the
	   station that built the project. */
	.proof-station-chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5em;
		background: var(--signage-bg);
		color: var(--signage-text);
		/* Faint amber outline so the sign's silhouette reads on the dark
		   card too (#1C1814 on #1a1a1a); the 2px amber base is the backlit
		   edge (StationTabs active-tab precedent). */
		border: 1px solid color-mix(in srgb, var(--signage-text) 30%, transparent);
		border-bottom: 2px solid var(--signage-text);
		border-radius: var(--radius-sm);
		padding: 0.3rem 0.6rem;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		line-height: 1.2;
	}

	.proof-station-chip-num {
		font-weight: 800;
	}

	/* The story line — the operator-written one-liner. Clamped so long
	   excerpts can never clip the composition. */
	.proof-excerpt {
		margin: 0;
		font-size: var(--text-small);
		line-height: 1.55;
		color: var(--secondary-foreground);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Tech stack line — quiet mono codes pinned just above the footer rule. */
	.proof-stack {
		margin-top: auto;
	}

	.proof-tag {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		letter-spacing: 0.1em;
		font-weight: 500;
	}

	.proof-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.75rem 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
	}

	.proof-metric-before {
		color: var(--muted-foreground);
		font-size: var(--text-small);
		text-decoration: line-through;
		margin-bottom: 0.25rem;
	}

	/* Round-4 doctrine: metric/number callouts speak the YELLOW voice. */
	.proof-metric-value {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.875rem;
		line-height: 1;
		color: var(--accent-text);
		letter-spacing: -0.02em;
	}

	.proof-metric-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Quiet exploration line — ORANGE standard action (round-5 doctrine:
	   yellow is reserved for conversion; exploration rides --primary). */
	.proof-see-build {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.08em;
		color: var(--primary);
		border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		padding-bottom: 0.125rem;
		transition: border-color var(--duration-normal) var(--ease-default);
		white-space: nowrap;
	}

	.proof-see-build-arrow {
		display: inline-block;
		transition: transform var(--duration-normal) var(--ease-default);
	}

	.proof-card:hover .proof-see-build {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
	}

	.proof-card:hover .proof-see-build-arrow {
		transform: translateX(3px);
	}

	@media (min-width: 768px) {
		.proof-metric-value {
			font-size: 2.25rem;
		}
		.proof-metric-label {
			font-size: var(--text-mono);
		}
		.proof-tag {
			font-size: var(--text-mono);
		}
		.proof-metric-before {
			font-size: var(--text-body);
		}
		.proof-excerpt {
			font-size: var(--text-body);
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

	/* Carousel position counter — mono caption. Round-4 doctrine: a position
	   readout is a departure-board value — the YELLOW voice (the arrows next
	   to it stay orange: they're the interactive controls). */
	.proof-count {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375rem;
		margin-left: 0.5rem;
		font-family: var(--font-mono);
		letter-spacing: 0.15em;
		/* go2/home-cards QA: the counter is a departure-board readout — it
		   never compresses (digits were wrapping vertically at 390px when
		   the flexed View-all link squeezed the row). */
		flex-shrink: 0;
		white-space: nowrap;
	}

	.proof-count-current {
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent-text);
	}

	.proof-count-sep {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--accent-text) 85%, transparent);
	}

	.proof-count-total {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--accent-text) 85%, transparent);
	}

	/* Shared "View all ___ →" link styling — unified with HomeServices
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

		/* Card: same band/body composition as desktop, just smaller. The
		   flex-stretched slide keeps sibling cards equal-height while the
		   min-height floor preserves the carousel's footprint — content can
		   grow, nothing clips. */
		.proof-card {
			min-height: clamp(20rem, 50dvh, 30rem);
			grid-template-rows: clamp(8rem, 22dvh, 10.5rem) 1fr;
		}

		/* Image band: fills row 1 via the grid track. */
		button.proof-image {
			grid-row: 1;
			height: 100%;
		}

		/* Marker: smaller on mobile, top-left of image. */
		.proof-marker {
			font-size: 0.75rem;
			letter-spacing: 0.18em;
		}

		/* Title: overlays the band's bottom (grid row 1, align-self: end)
		   — same layout as desktop, just smaller. Drop-shadow restored for
		   legibility over the gradient. */
		.proof-title {
			grid-row: 1;
			grid-column: 1;
			align-self: end;
			justify-self: stretch;
			z-index: 2;
			padding: 0.75rem 1.25rem 0.875rem;
			font-size: var(--text-heading);
			line-height: 1.1;
			text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
			pointer-events: none;
		}

		.proof-title.proof-title--ink {
			text-shadow: none;
		}

		/* Body: tighter rhythm at mobile widths. */
		.proof-body {
			padding: 1rem 1.25rem 0.75rem;
			gap: 0.625rem;
		}

		.proof-excerpt {
			font-size: var(--text-small);
			-webkit-line-clamp: 3;
		}

		/* Footer: metric and exploration line stack — side-by-side is too
		   cramped at mobile widths. */
		.proof-footer {
			padding: 0.875rem 1.25rem 1rem;
			flex-direction: column;
			align-items: flex-start;
			justify-content: flex-start;
			gap: 0.625rem;
		}

		.proof-metric-value {
			font-size: 1.375rem;
		}
		.proof-metric-label {
			font-size: var(--text-caption);
		}
		.proof-tag {
			font-size: var(--text-caption);
		}
		.proof-metric-before {
			font-size: var(--text-small);
		}
		.proof-station-chip {
			font-size: var(--text-micro);
		}
		.proof-see-build {
			font-size: var(--text-caption);
		}

		/* Tap cursor on the image button. */
		.proof-image {
			cursor: pointer;
		}
	}
</style>
