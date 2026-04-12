<!--
  Home page: Slice 13 redesign — full-bleed kinetic experience.
  5 sections: Hero, Manifesto, Proof Reel, Services, Closer (terminus departure board).
  All scroll-driven GSAP animation. Lenis smooth scroll. Zero side margins.
-->
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import Manifesto from '$lib/components/Manifesto.svelte';
	import ProofReel from '$lib/components/ProofReel.svelte';
	import HomeServices from '$lib/components/HomeServices.svelte';
	import HomeCloser from '$lib/components/HomeCloser.svelte';
	import { HazardStripe } from '$lib/components/brand';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Scrollable content — full-bleed, no side margins -->
	<div class="relative z-30">
		<!-- Section 1: Hero (metro SVG animation) -->
		<HeroBanner />

		<HazardStripe />
		<Manifesto />
		<HazardStripe />
		<ProofReel />
		<HazardStripe />
		<HomeServices />
		<HazardStripe />
		<HomeCloser />
	</div>
</div>
