<!--
  Dev-only preview page for the Threlte 3D hero scene.
  Reachable at /preview. Not linked from nav.
  Validates scene geometry and bloom glow before slice 06 wires it to scroll.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import { services } from '$lib/data/services.js';

	let scrollValue = $state(0);
	let reducedMotion = $state(false);

	// 0-1 from the 0-100 slider
	let scrollProgress = $derived(scrollValue / 100);
	let activeStation = $derived(Math.floor(scrollProgress * services.length));

	// Dynamic import — Three.js must not run during SSR
	let HeroScene: Component<{ scrollProgress?: number; reducedMotion?: boolean }> | null =
		$state(null);

	onMount(async () => {
		const mod = await import('$lib/motion/three/HeroScene.svelte');
		HeroScene = mod.default;
	});
</script>

<!-- Fixed overlay covers the entire viewport, including Nav/Footer from root layout -->
<div class="fixed inset-0 z-50 overflow-hidden bg-[#141414]">
	<!-- 3D scene fills viewport -->
	{#if HeroScene}
		<div class="absolute inset-0">
			<HeroScene {scrollProgress} {reducedMotion} />
		</div>
	{:else}
		<div class="flex h-full items-center justify-center text-neutral-500">
			Loading 3D scene...
		</div>
	{/if}

	<!-- Floating control panel — top-right -->
	<div
		class="absolute right-4 top-4 z-10 flex flex-col gap-3 rounded-lg bg-black/70 p-4 backdrop-blur"
	>
		<label class="flex flex-col gap-1 text-xs text-neutral-400">
			Scroll progress
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				bind:value={scrollValue}
				class="w-48 accent-[#E07800]"
			/>
		</label>

		<p class="font-mono text-sm text-neutral-200">
			Station {activeStation} / {services.length}
		</p>

		<label class="flex items-center gap-2 text-xs text-neutral-400">
			<input type="checkbox" bind:checked={reducedMotion} class="accent-[#E07800]" />
			Reduced motion
		</label>
	</div>

	<!-- Dev label — bottom-left -->
	<p class="absolute bottom-4 left-4 z-10 font-mono text-caption tracking-wide text-neutral-600">
		PRE-SLICE-06 PREVIEW &mdash; not production
	</p>
</div>
