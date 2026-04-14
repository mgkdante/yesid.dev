<!--
  HomePage — orchestrator for the home page sections.
  5 sections: Hero, Manifesto, Featured Projects, Services, Closer.
  All wrapped in SectionWrapper for constitutional compliance.
  Projects/Services/Closer: alternating rotated SectionHeading titles (left → right → left).
-->
<script lang="ts">
	import HeroBanner from './HeroBanner.svelte';
	import Manifesto from './Manifesto.svelte';
	import FeaturedProjects from './FeaturedProjects.svelte';
	import HomeServices from './HomeServices.svelte';
	import HomeCloser from './HomeCloser.svelte';
	import ServicesBlueprint from './ServicesBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SectionWrapper } from '$lib/components/shells';
	import { SectionHeading } from '$lib/components/brand';
</script>

<!-- Section 1: Hero — full-bleed, scroll-locked GSAP -->
<SectionWrapper layout="bleed">
	<HeroBanner />
</SectionWrapper>

<Separator variant="hazard" />

<!-- Section 2: Manifesto — full-bleed, GSAP targets children by class -->
<SectionWrapper layout="bleed">
	<Manifesto />
</SectionWrapper>

<Separator variant="hazard" />

<!-- Section 3: Featured Projects — rotated title LEFT -->
<SectionWrapper layout="centered" style="--edge-left: clamp(4.5rem, 8vw, 8rem)">
	{#snippet sideLeft()}
		<div class="rotated-title rotated-title--left">
			<SectionHeading heading="Projects" />
		</div>
	{/snippet}
	<FeaturedProjects />
</SectionWrapper>

<Separator variant="hazard" />

<!-- Section 4: Services — rotated title RIGHT, blueprint background spans full width -->
<SectionWrapper layout="centered" style="--edge-right: clamp(4.5rem, 8vw, 8rem)">
	{#snippet background()}
		<ServicesBlueprint />
	{/snippet}
	{#snippet sideRight()}
		<div class="rotated-title rotated-title--right">
			<SectionHeading heading="Services" />
		</div>
	{/snippet}
	<HomeServices />
</SectionWrapper>

<Separator variant="hazard" />

<!-- Section 5: Closer — rotated title LEFT -->
<SectionWrapper layout="centered" style="--edge-left: clamp(4.5rem, 8vw, 8rem)">
	{#snippet sideLeft()}
		<div class="rotated-title rotated-title--left">
			<SectionHeading heading="Terminus" />
		</div>
	{/snippet}
	<HomeCloser />
</SectionWrapper>

<style>
	/* Shared rotated title base */
	.rotated-title {
		position: sticky;
		top: 50%;
		writing-mode: vertical-rl;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
	}

	/* Left side: rotate 180° (reads bottom → top) */
	.rotated-title--left {
		transform: rotate(180deg);
	}

	/* Right side: natural vertical-rl (reads top → bottom), no rotation */
	.rotated-title--right {
		/* writing-mode: vertical-rl already reads top → bottom */
	}

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
</style>
