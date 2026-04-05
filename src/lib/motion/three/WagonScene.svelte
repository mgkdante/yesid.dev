<!--
  Threlte scene for the Montreal metro wagon hero visual.
  Loads a GLB model, lights it with brand orange, and applies
  idle bob + scroll-linked rotation.

  Model: "Montreal Metro" by mamont nikita (CC BY 4.0)
  Optimized with gltf-transform (dedup + Draco compression).
  Model coordinates span ~35,000 units — scaled down 0.0005x to fit scene.
-->
<script lang="ts">
	import { Canvas } from '@threlte/core';
	import WagonInner from './WagonInner.svelte';

	let {
		scrollProgress = 0,
		reducedMotion = false
	}: {
		scrollProgress?: number;
		reducedMotion?: boolean;
	} = $props();
</script>

<Canvas>
	<WagonInner {scrollProgress} {reducedMotion} />
</Canvas>
