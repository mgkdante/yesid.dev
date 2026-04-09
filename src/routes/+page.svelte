<!--
  Home page: Slice 13 redesign — full-bleed kinetic experience.
  7 sections: Hero, Manifesto, Proof Reel, Services, Blog Teaser, About Strip, Dual CTA.
  All scroll-driven GSAP animation. Lenis smooth scroll. Zero side margins.
-->
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Scrollable content — full-bleed, no side margins -->
	<div class="relative z-30">
		<!-- Section 1: Hero (metro SVG animation) -->
		<HeroBanner />

		<!-- Sections 2-7 added in sub-slices 13b-13f -->
	</div>
</div>
