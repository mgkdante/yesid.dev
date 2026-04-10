<!--
  Home page: Slice 13 redesign — full-bleed kinetic experience.
  7 sections: Hero, Manifesto, Proof Reel, Services, Blog Teaser, About Strip, Dual CTA.
  All scroll-driven GSAP animation. Lenis smooth scroll. Zero side margins.
-->
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import Manifesto from '$lib/components/Manifesto.svelte';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Scrollable content — full-bleed, no side margins -->
	<div class="relative z-30">
		<!-- Section 1: Hero (metro SVG animation) -->
		<HeroBanner />

		<!-- Hard cut: yellow/black dashed line (Von Restorff break) -->
		<div
			data-testid="hard-cut"
			class="h-1 w-full"
			style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
		></div>

		<!-- Section 2: Manifesto (interactive circuit board + transit HUD) -->
		<Manifesto />

		<!-- Sections 3-7 added in sub-slices 13c-13f -->
	</div>
</div>
