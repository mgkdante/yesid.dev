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
	import { Separator } from '$lib/components/ui/separator';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Scrollable content — full-bleed, no side margins -->
	<div class="relative z-30">
		<!-- Section 1: Hero (metro SVG animation) -->
		<HeroBanner />

		<Separator variant="hazard" />
		<Manifesto />
		<Separator variant="hazard" />
		<ProofReel />
		<Separator variant="hazard" />
		<HomeServices />
		<Separator variant="hazard" />
		<HomeCloser />
	</div>
</div>
