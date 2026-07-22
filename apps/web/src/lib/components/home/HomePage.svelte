<!--
  HomePage — orchestrator for the home page sections.
  7 sections: Hero, Manifesto, Services, About teaser, Featured Projects,
  CTA band, Closer. (Services lead the story per operator 2026-07-03:
  context → identity → proof. About teaser + CTA band went live in the
  homework #21c batch.)
  Projects/Services/Closer: alternating rotated SectionHeading titles (left → right → left).

  slice-18i Phase 7C: all page-block content flows as props from +page.svelte
  (loaded server-side from Directus M2A). Components no longer import static
  content modules directly.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import HeroBanner from './HeroBanner.svelte';
	import Manifesto from './Manifesto.svelte';
	import FeaturedProjects from './FeaturedProjects.svelte';
	import HomeServices from './HomeServices.svelte';
	import HomeAboutTeaser from './HomeAboutTeaser.svelte';
	import CtaBand from '$lib/components/shared/CtaBand.svelte';
	import HomeCloser from './HomeCloser.svelte';
	import ServicesBlueprint from './ServicesBlueprint.svelte';
	import HazardSeparator from '$lib/components/shared/HazardSeparator.svelte';
	import { SectionHeading } from '$lib/components/brand';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { computeRotatedTitleSize } from '$lib/utils/rotated-title-fit';
	import {
		registerScrollContext,
		lenisAwareScrollTo,
		localeHandoff,
	} from '$lib/state/locale-handoff.svelte';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';
	import type {
		HeroContent,
		HeroAnimContent,
		ManifestoContent,
		ProofReelContent,
		ServicesGridContent,
		AboutIntroContent,
		CtaContent,
		CloserContent,
		Project,
		Service,
		SiteMeta,
		BlogPost,
	} from '$lib/types';
	import type { HeroData } from '$lib/live';

	interface Props {
		metroSvg: string;
		hero: HeroContent;
		heroAnim: HeroAnimContent;
		manifesto: ManifestoContent;
		proofReel: ProofReelContent;
		servicesGrid: ServicesGridContent;
		about: AboutIntroContent;
		cta: CtaContent;
		closer: CloserContent;
		initialHeroData: HeroData;
		/** slice-28.5 (#124): primary collection data resolved by +page.server.ts
		 *  through the repository layer — section components no longer call the
		 *  $lib/content companions for services/projects. */
		services: readonly Service[];
		featuredProjects: readonly Project[];
		siteMeta: SiteMeta;
		serviceSvgContents: Record<string, string>;
	}
	let {
		metroSvg,
		hero,
		heroAnim,
		manifesto,
		proofReel,
		servicesGrid,
		about,
		cta,
		closer,
		initialHeroData,
		services,
		featuredProjects,
		siteMeta,
		serviceSvgContents,
	}: Props = $props();

// go2-t1c2: rotated home section titles from site_labels, previous
	// literals kept as code fallbacks.
	const sectionProjects = resolveLocale(siteLabels.pages.homeSectionProjects, locale);
	const sectionServices = resolveLocale(siteLabels.pages.homeSectionServices, locale);
	const sectionAbout = resolveLocale(siteLabels.pages.homeSectionAbout, locale);
	const sectionTerminus = resolveLocale(siteLabels.pages.homeSectionTerminus, locale);

	// Rotated-title fit (operator spec 2026-07-03): ONE mathematically
	// computed size per locale: the LONGEST label must exactly fit the 50dvh
	// sticky cap, capped at the 6rem design max; all four titles share it.
	// null until measured: the CSS var fallback below carries first paint.
	let rotatedTitleSize = $state<number | null>(null);
	const rotatedVar = $derived(
		rotatedTitleSize === null ? undefined : `--rotated-title-size: ${rotatedTitleSize}px`,
	);

	function recomputeRotatedTitleFit() {
		const sample = document.querySelector('.rotated-title .section-heading-text');
		if (!sample) return;
		// Budget = the sticky cap (50dvh) with 2% breathing room; max = 6rem.
		const budget = window.innerHeight * 0.5 * 0.98;
		const size = computeRotatedTitleSize(
			sample,
			[sectionServices, sectionAbout, sectionProjects, sectionTerminus],
			budget,
			96,
		);
		if (size !== null) rotatedTitleSize = size;
	}

	// GO-w2t5 → go2/w4: backgroundBreathing lives inside HomeCloser (each
	// section component owns its own effect). HomeServices' sectionGlow was
	// unwired in w4 per operator QA — the primitive stays in
	// $lib/motion/actions. Bindings stay for future section-scoped motion.
	// Crescendo scrubs were removed from the rotated titles per operator
	// feedback — titles are sticky-only without scale animation, so the
	// visual no longer overflows section bounds.
	let projectsSectionEl = $state<HTMLElement>(undefined!);
	let servicesSectionEl = $state<HTMLElement>(undefined!);
	let closerSectionEl = $state<HTMLElement>(undefined!);

	let destroyFns: Array<() => void> = [];

	/** Max scrollable distance for the current (post-pin-refresh) document. */
	function maxScroll(): number {
		return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
	}

	/** The pin ScrollTrigger if the hero intro is live (absent once collapsed). */
	function findPinTrigger(): ReturnType<typeof ScrollTrigger.getAll>[number] | undefined {
		return ScrollTrigger.getAll().find((t) => Boolean(t.vars.pin));
	}

	onMount(() => {
		if (!browser) return;
		// Section magnetism removed entirely (operator call 2026-07-03):
		// scrolling settles wherever the visitor stops it, on every input.

		// Rotated-title fit: compute once, again when the web font finishes
		// loading (metrics change), and on every resize (the height budget
		// moves with the viewport).
		recomputeRotatedTitleFit();
		document.fonts?.ready.then(() => recomputeRotatedTitleFit()).catch(() => {});
		let fitRaf = 0;
		const onResize = () => {
			cancelAnimationFrame(fitRaf);
			fitRaf = requestAnimationFrame(recomputeRotatedTitleFit);
		};
		window.addEventListener('resize', onResize);
		destroyFns.push(() => {
			cancelAnimationFrame(fitRaf);
			window.removeEventListener('resize', onResize);
		});

		// slice-34.4 — reading position survives a locale switch on the HOME page,
		// the hardest case: HeroBanner's GSAP pin rewrites the document height
		// (~900svh) AFTER a deferred ScrollTrigger.refresh, and the height also
		// depends on the hero-intro state (live pin vs collapsed same-day reload).
		// A raw scrollY captured against one height is meaningless against another,
		// so we capture a NORMALIZED FRACTION (scrollY / maxScroll) and, after the
		// remounted page's pin has materialized + refreshed, jump to
		// fraction * maxScroll via the Lenis-aware recipe.
		destroyFns.push(
			registerScrollContext({
				capture: () => {
					const max = maxScroll();
					return {
						kind: 'home-fraction',
						fraction: max > 0 ? window.scrollY / max : 0,
						y: window.scrollY,
					};
				},
				restore: async (snap) => {
					const s = snap as { fraction?: number; y?: number } | null;
					const fraction = Math.min(1, Math.max(0, s?.fraction ?? 0));

					// Wait for the pin ScrollTrigger to materialize on the freshly
					// remounted page. HeroBanner builds it inside setupIntro() and
					// defers ScrollTrigger.refresh() to a rAF, so the pin (and the
					// final document height) is not ready synchronously after paint.
					// Poll a bounded number of frames; once the pin exists we refresh
					// to lock its start/end + the document height, then jump.
					//
					// Intro collapsed (same-day reload / completed): NO pin trigger
					// ever appears — the poll times out fast and we jump against the
					// short collapsed height, which is correct for that state.
					await waitForPinOrTimeout(30);
					const pin = findPinTrigger();
					if (pin) ScrollTrigger.refresh();

					lenisAwareScrollTo(Math.round(fraction * maxScroll()));
				},
			}),
		);
	});

	/** Resolve once the pin ScrollTrigger exists, or after `maxFrames` rAFs. */
	function waitForPinOrTimeout(maxFrames: number): Promise<void> {
		return new Promise((resolve) => {
			let frames = 0;
			const tick = () => {
				if (findPinTrigger() || frames >= maxFrames) {
					resolve();
					return;
				}
				frames++;
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
	}

	onDestroy(() => {
		destroyFns.forEach((fn) => fn());
		destroyFns = [];
	});
</script>

<!-- Section 1: Hero — full-bleed, scroll-locked GSAP -->
<section class="w-full">
	<HeroBanner {metroSvg} {hero} {heroAnim} {initialHeroData} />
</section>

<HazardSeparator />

<!-- Section 2: Manifesto — full-bleed, GSAP targets children by class -->
<section class="w-full">
	<Manifesto {manifesto} />
</section>

<HazardSeparator />

<!-- Section 3: Services — rotated title RIGHT, blueprint background spans
     full width. Operator 2026-07-03: services lead so the story builds
     context (what I do) → identity (who I am) → proof (what I built). -->
<section bind:this={servicesSectionEl} class="home-section home-section--right relative" style={rotatedVar}>
	<div class="absolute inset-0 -z-10 pointer-events-none">
		<ServicesBlueprint />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading={sectionServices} />
	</div>
	<div class="home-section-content">
		<HomeServices {servicesGrid} {services} />
	</div>
	<div class="rotated-title rotated-title--right">
		<SectionHeading heading={sectionServices} />
	</div>
</section>

<HazardSeparator />

<!-- Section 3b: About teaser — rotated title LEFT (operator 2026-07-03: every
     titled section alternates: Services R → About L → Projects R → Terminus L;
     only the CTA goes untitled, it's special). -->
<section class="home-section home-section--left" style={rotatedVar}>
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading={sectionAbout} />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading={sectionAbout} />
	</div>
	<div class="home-section-content">
		<HomeAboutTeaser {about} />
	</div>
</section>

<HazardSeparator />

<!-- Section 4: Featured Projects — rotated title RIGHT; the proof lands with
     the service context already established above it. -->
<section bind:this={projectsSectionEl} class="home-section home-section--right home-section--proof-reel" style={rotatedVar}>
	<div class="home-section-heading-mobile">
		<SectionHeading heading={sectionProjects} />
	</div>
	<div class="home-section-content">
		<!-- go2/home-cards: services join the proof reel so each card can name
		     the station that built it (same prop the services grid consumes). -->
		<FeaturedProjects {proofReel} projects={featuredProjects} {services} {serviceSvgContents} />
	</div>
	<div class="rotated-title rotated-title--right">
		<SectionHeading heading={sectionProjects} />
	</div>
</section>

<!-- Section 4b: CTA band — the mid-page conversion action. The hazard strip
     is INSIDE CtaBand now (every CTA wears it), so no separate separator. -->
<section class="w-full">
	<CtaBand {cta} {siteMeta} testidPrefix="home-cta-band" />
</section>

<HazardSeparator />

<!-- Section 5: Closer — rotated title LEFT (Terminus — D263 crescendo target) -->
<section bind:this={closerSectionEl} class="home-section home-section--left" style={rotatedVar}>
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading={sectionTerminus} />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading={sectionTerminus} />
	</div>
	<div class="home-section-content">
		<HomeCloser {closer} {siteMeta} />
	</div>
</section>

<style>
	/* Shared rotated title base. Both `scale` (crescendo scrub) and `rotate`
	   use individual transform properties so they compose without disturbing
	   the sticky positioning of the element itself. Slice-23 Task 4 caps the
	   *physical* height so the title is visibly smaller than its containing
	   section — sticky can only engage if the element has room to move within
	   its containing block. `max-block-size` would target the horizontal axis
	   here (vertical-rl writing mode flips block/inline), hence the physical
	   `max-height`. */
	.rotated-title {
		position: sticky;
		top: 50%;
		/* Capped at 50dvh so the title leaves room for sticky to engage at
		   top: 50% within a ~100dvh section (sticky's max position is
		   `containing-block-bottom - element-height`). Physical `max-height`
		   here, not `max-block-size`, because vertical-rl writing-mode flips
		   the block axis to horizontal. */
		max-height: 50dvh;
		writing-mode: vertical-rl;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
	}

	/* Left side: rotate 180° (reads bottom → top) */
	.rotated-title--left {
		rotate: 180deg;
	}

	/* Right side: natural vertical-rl (reads top → bottom), no rotation */

	/* Super bold display size — full brand color, maximized for edge column.
	   The SIZE IS COMPUTED (operator spec 2026-07-03): per locale, the
	   longest label is measured and the shared --rotated-title-size is the
	   largest size at which IT fits the 50dvh sticky cap (design max 6rem):
	   as big as mathematically possible, zero overflow on either axis, all
	   four titles uniform. See $lib/utils/rotated-title-fit.ts. The var
	   fallback only covers first paint before hydration measures. */
	.rotated-title :global(.section-heading-text) {
		font-size: var(--rotated-title-size, min(clamp(3.5rem, 7vw, 6rem), 5.5dvh));
		font-weight: 900;
		letter-spacing: -0.02em;
		margin-block-end: 0;
	}

	/* Hide subheading in rotated context */
	.rotated-title :global([data-slot="section-heading-sub"]) {
		display: none;
	}

	/* Recipe 3: Content + Side Column */
	.home-section {
		display: grid;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.home-section-content {
		min-width: 0;
	}

	/* Left-side heading: heading | content */
	@media (min-width: 1024px) {
		.home-section--left {
			grid-template-columns: clamp(4.5rem, 8vw, 8rem) 1fr;
		}
		.home-section--right {
			grid-template-columns: 1fr clamp(4.5rem, 8vw, 8rem);
		}
	}

	/* Mobile-only horizontal heading per section — the rotated vertical
	   title is hidden below 1024px (impractical at narrow widths), so this
	   horizontal heading takes its place at the top of each section. */
	.home-section-heading-mobile {
		display: none;
	}

	/* Hide rotated titles on mobile */
	@media (max-width: 1023px) {
		.rotated-title {
			display: none;
		}

		.home-section-heading-mobile {
			display: block;
			padding: 2rem var(--space-page-x) 0.5rem;
		}

		.home-section--proof-reel .home-section-heading-mobile {
			padding-bottom: 0;
		}

		.home-section--proof-reel :global(.proof-reel-section) {
			padding-block-start: clamp(0.75rem, 2dvh, 1.25rem);
		}
	}
</style>
