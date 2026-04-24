<!--
  HomePage — orchestrator for the home page sections.
  5 sections: Hero, Manifesto, Featured Projects, Services, Closer.
  Projects/Services/Closer: alternating rotated SectionHeading titles (left → right → left).
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
	import { createCrescendoScrub } from '$lib/motion/scrubs/index.js';

	// Section + rotated-title bindings for crescendo scrubs (desktop only).
	let projectsSectionEl = $state<HTMLElement>(undefined!);
	let projectsTitleEl = $state<HTMLElement>(undefined!);
	let servicesSectionEl = $state<HTMLElement>(undefined!);
	let servicesTitleEl = $state<HTMLElement>(undefined!);
	let closerSectionEl = $state<HTMLElement>(undefined!);
	let closerTitleEl = $state<HTMLElement>(undefined!);

	let destroyFns: Array<() => void> = [];

	onMount(() => {
		if (!browser) return;
		// Rotated titles are display:none below 1024px — skip wiring on mobile.
		if (window.matchMedia('(max-width: 1023px)').matches) return;

		if (projectsTitleEl && projectsSectionEl) {
			destroyFns.push(createCrescendoScrub(projectsTitleEl, { section: projectsSectionEl }));
		}
		if (servicesTitleEl && servicesSectionEl) {
			destroyFns.push(createCrescendoScrub(servicesTitleEl, { section: servicesSectionEl }));
		}
		if (closerTitleEl && closerSectionEl) {
			destroyFns.push(createCrescendoScrub(closerTitleEl, { section: closerSectionEl }));
		}
	});

	onDestroy(() => {
		destroyFns.forEach((fn) => fn());
		destroyFns = [];
	});
</script>

<!-- Section 1: Hero — full-bleed, scroll-locked GSAP -->
<section class="w-full">
	<HeroBanner />
</section>

<Separator variant="hazard" />

<!-- Section 2: Manifesto — full-bleed, GSAP targets children by class -->
<section class="w-full">
	<Manifesto />
</section>

<Separator variant="hazard" />

<!-- Section 3: Featured Projects — rotated title LEFT -->
<section bind:this={projectsSectionEl} class="home-section home-section--left">
	<div bind:this={projectsTitleEl} class="rotated-title rotated-title--left">
		<SectionHeading heading="Projects" />
	</div>
	<div class="home-section-content">
		<FeaturedProjects />
	</div>
</section>

<Separator variant="hazard" />

<!-- Section 4: Services — rotated title RIGHT, blueprint background spans full width -->
<section bind:this={servicesSectionEl} class="home-section home-section--right relative">
	<div class="absolute inset-0 -z-10 pointer-events-none">
		<ServicesBlueprint />
	</div>
	<div class="home-section-content">
		<HomeServices />
	</div>
	<div bind:this={servicesTitleEl} class="rotated-title rotated-title--right">
		<SectionHeading heading="Services" />
	</div>
</section>

<Separator variant="hazard" />

<!-- Section 5: Closer — rotated title LEFT (Terminus — D263 crescendo target) -->
<section bind:this={closerSectionEl} class="home-section home-section--left">
	<div bind:this={closerTitleEl} class="rotated-title rotated-title--left">
		<SectionHeading heading="Terminus" />
	</div>
	<div class="home-section-content">
		<HomeCloser />
	</div>
</section>

<style>
	/* Shared rotated title base. `transform` is reserved for crescendo scale
	   scrub (17e-3); rotation uses the individual `rotate` property so the
	   two layers don't conflict. */
	.rotated-title {
		position: sticky;
		top: 50%;
		writing-mode: vertical-rl;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		transform-origin: center center;
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

	/* Hide rotated titles on mobile */
	@media (max-width: 1023px) {
		.rotated-title {
			display: none;
		}
	}
</style>
