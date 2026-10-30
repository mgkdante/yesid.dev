<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/env';
	import HeroBanner from './HeroBanner.svelte';
	import Manifesto from './Manifesto.svelte';
	import FeaturedProjects from './FeaturedProjects.svelte';
	import HomeServices from './HomeServices.svelte';
	import HomeAboutTeaser from './HomeAboutTeaser.svelte';
	import CtaBand from '#lib/components/shared/CtaBand.svelte';
	import HomeCloser from './HomeCloser.svelte';
	import ServicesBlueprint from './ServicesBlueprint.svelte';
	import { Separator } from '@yesid/ui/separator';
	import { SectionHeading } from '@yesid/ui/brand';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { ScrollTrigger } from '@yesid/motion/utils/gsap';
	import { computeRotatedTitleSize } from '#lib/utils/rotated-title-fit.ts';
	import {
		registerScrollContext,
		lenisAwareScrollTo,
		localeHandoff,
	} from '#lib/state/locale-handoff.svelte.ts';

	const locale = getLocale();
	import { siteLabels } from '#lib/content/index.ts';
	import type {
		HeroContent,
		HeroAnimContent,
		ManifestoContent,
		ProofReelContent,
		ServicesGridContent,
		AboutIntroContent,
		CloserContent,
		ProjectSummary,
		Service,
		SiteMeta,
		BlogPost,
	} from '#lib/types.ts';
	import type { HeroData } from '#lib/live/index.ts';

	interface Props {
		metroSvg: string;
		hero: HeroContent;
		heroAnim: HeroAnimContent;
		manifesto: ManifestoContent;
		proofReel: ProofReelContent;
		servicesGrid: ServicesGridContent;
		about: AboutIntroContent;
		closer: CloserContent;
		initialHeroData: HeroData;

		services: readonly Service[];
		featuredProjects: readonly ProjectSummary[];
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

	// Fit the longest localized label to the sticky height cap and share its size across the four titles.
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

		// Restore a scroll fraction after the hero pin refresh because locale and intro state change document height.
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
	<HeroBanner
		metroSvg={metroSvg}
		hero={hero}
		heroAnim={heroAnim}
		initialHeroData={initialHeroData}
	/>
</section>

<Separator variant="hazard" />

<!-- Section 2: Manifesto — full-bleed, GSAP targets children by class -->
<section class="w-full"><Manifesto manifesto={manifesto} /></section>
<Separator variant="hazard" />

<section
	bind:this={servicesSectionEl}
	class="home-section home-section--right relative"
	style={rotatedVar}
>
	<div class="absolute inset-0 -z-10 pointer-events-none opacity-75"><ServicesBlueprint /></div>
	<div class="home-section-heading-mobile"><SectionHeading heading={sectionServices} /></div>
	<div class="home-section-content"><HomeServices servicesGrid={servicesGrid} services={services} /></div>
	<div class="rotated-title rotated-title--right"><SectionHeading heading={sectionServices} /></div>
</section>

<Separator variant="hazard" />

<section
	class="home-section home-section--left"
	style={rotatedVar}
>
	<div class="rotated-title rotated-title--left"><SectionHeading heading={sectionAbout} /></div>
	<div class="home-section-heading-mobile"><SectionHeading heading={sectionAbout} /></div>
	<div class="home-section-content"><HomeAboutTeaser about={about} /></div>
</section>

<Separator variant="hazard" />

<!-- Section 4: Featured Projects — rotated title RIGHT; the proof lands with
     the service context already established above it. -->
<section bind:this={projectsSectionEl} class="home-section home-section--right home-section--proof-reel" style={rotatedVar}>
	<div class="home-section-heading-mobile">
		<SectionHeading heading={sectionProjects} />
	</div>
	<div class="home-section-content">
		<!-- go2/home-cards: services join the proof reel so each card can name
		     the station that built it (same prop the services grid consumes). -->

		<FeaturedProjects
			proofReel={proofReel}
			projects={featuredProjects}
			services={services}
			serviceSvgContents={serviceSvgContents}
		/>
	</div>
	<div class="rotated-title rotated-title--right">
		<SectionHeading heading={sectionProjects} />
	</div>
</section>

<!-- Section 4b: CTA band — the mid-page conversion action. The hazard strip
     is INSIDE CtaBand now (every CTA wears it), so no separate separator. -->
<!-- The home CTA draws its blueprints a step bolder than the CTA on other pages. -->
<section class="w-full" style:--cta-blueprint-ink="0.75">
	<CtaBand testidPrefix="home-cta-band" />
</section>

<Separator variant="hazard" />

<!-- Section 5: Closer — rotated title LEFT (Terminus — D263 crescendo target) -->

<section
	bind:this={closerSectionEl}
	class="home-section home-section--left"
	style={rotatedVar}
>
	<div class="rotated-title rotated-title--left"><SectionHeading heading={sectionTerminus} /></div>
	<div class="home-section-heading-mobile"><SectionHeading heading={sectionTerminus} /></div>
	<div class="home-section-content"><HomeCloser closer={closer} siteMeta={siteMeta} /></div>
</section>

<style>
	/* Use physical max-height for vertical writing so sticky titles retain room to move. */
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

	/* Share the measured longest-label size across titles; the CSS fallback covers first paint. */
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
	@media (--desktop-min) {
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
	@media (--desktop-max) {
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
