<!--
  HomePage — orchestrator for the home page sections.
  5 sections: Hero, Manifesto, Featured Projects, Services, Closer.
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
	import HomeCloser from './HomeCloser.svelte';
	import ServicesBlueprint from './ServicesBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SectionHeading } from '$lib/components/brand';
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
	} from '$lib/types';
	import type { HeroData } from '$lib/content/hero-data';

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
	}
	let {
		metroSvg,
		hero,
		heroAnim,
		manifesto,
		proofReel,
		servicesGrid,
		about: _about,
		cta: _cta,
		closer,
		initialHeroData,
		services,
		featuredProjects,
	}: Props = $props();

	// Section bindings retained for upcoming slice-23 tasks (sectionGlow /
	// backgroundBreathing). Crescendo scrubs were removed from the rotated
	// titles per operator feedback — titles are sticky-only without scale
	// animation, so the visual no longer overflows section bounds.
	let projectsSectionEl = $state<HTMLElement>(undefined!);
	let servicesSectionEl = $state<HTMLElement>(undefined!);
	let closerSectionEl = $state<HTMLElement>(undefined!);

	let destroyFns: Array<() => void> = [];

	onMount(() => {
		if (!browser) return;
		// Section bindings kept for future ambient effects; no setup
		// currently active.
	});

	onDestroy(() => {
		destroyFns.forEach((fn) => fn());
		destroyFns = [];
	});
</script>

<!-- Section 1: Hero — full-bleed, scroll-locked GSAP -->
<section class="w-full">
	<HeroBanner {metroSvg} {hero} {heroAnim} {initialHeroData} />
</section>

<Separator variant="hazard" />

<!-- Section 2: Manifesto — full-bleed, GSAP targets children by class -->
<section class="w-full">
	<Manifesto {manifesto} />
</section>

<Separator variant="hazard" />

<!-- Section 3: Featured Projects — rotated title LEFT -->
<section bind:this={projectsSectionEl} class="home-section home-section--left">
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading="Projects" />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading="Projects" />
	</div>
	<div class="home-section-content">
		<FeaturedProjects {proofReel} projects={featuredProjects} />
	</div>
</section>

<Separator variant="hazard" />

<!-- Section 4: Services — rotated title RIGHT, blueprint background spans full width -->
<section bind:this={servicesSectionEl} class="home-section home-section--right relative">
	<div class="absolute inset-0 -z-10 pointer-events-none">
		<ServicesBlueprint />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading="Services" />
	</div>
	<div class="home-section-content">
		<HomeServices {servicesGrid} {services} />
	</div>
	<div class="rotated-title rotated-title--right">
		<SectionHeading heading="Services" />
	</div>
</section>

<Separator variant="hazard" />

<!-- Section 5: Closer — rotated title LEFT (Terminus — D263 crescendo target) -->
<section bind:this={closerSectionEl} class="home-section home-section--left">
	<div class="rotated-title rotated-title--left">
		<SectionHeading heading="Terminus" />
	</div>
	<div class="home-section-heading-mobile">
		<SectionHeading heading="Terminus" />
	</div>
	<div class="home-section-content">
		<HomeCloser {closer} />
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

	/* Super bold display size — full brand color, maximized for edge column */
	.rotated-title :global(.section-heading-text) {
		font-size: clamp(3.5rem, 7vw, 6rem);
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
	}
</style>
