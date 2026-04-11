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

		<!-- Hard cut: yellow/black dashed line (Von Restorff break) -->
		<div
			class="h-1 w-full"
			style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
		></div>

		<!-- Section 3: Proof Reel (featured project cards with impact metrics) -->
		<ProofReel />

		<!-- Hard cut: yellow/black dashed line -->
		<div
			class="h-1 w-full"
			style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
		></div>

		<!-- Section 4: Services Grid (benefit-led, blueprint background) -->
		<HomeServices />

		<!-- Hard cut: yellow/black dashed line -->
		<div
			class="h-1 w-full"
			style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
		></div>

		<!-- Hard cut: yellow/black dashed line -->
		<div
			class="h-1 w-full"
			style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
		></div>

		<!-- Section 5: The Closer (terminus departure board + graffiti wall) -->
		<HomeCloser />
	</div>
</div>
