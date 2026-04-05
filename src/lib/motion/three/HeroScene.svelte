<!--
  Threlte Canvas wrapper for the hero 3D background.
  Composes DataPaths, StationNodes, and PostProcessing into a single scene.
  Accepts scrollProgress (0-1) — in the preview this comes from a slider;
  in slice 06 it will come from GSAP ScrollTrigger.
-->
<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { getSceneConfig } from './scene-config.js';
	import { services } from '$lib/data/services.js';
	import DataPaths from './DataPaths.svelte';
	import StationNodes from './StationNodes.svelte';
	import PostProcessing from './PostProcessing.svelte';

	let {
		scrollProgress = 0,
		reducedMotion = false
	}: {
		scrollProgress?: number;
		reducedMotion?: boolean;
	} = $props();

	const config = getSceneConfig(services.length);
	const stationCount = services.length;

	// activeStation: 0 = none lit, 1 = first, ..., N = all lit
	let activeStation = $derived(Math.floor(scrollProgress * stationCount));
</script>

<Canvas>
	<T.PerspectiveCamera
		makeDefault
		position={config.camera.position}
		fov={config.camera.fov}
		oncreate={(ref) => {
			ref.lookAt(0, 0, -1);
		}}
	/>

	<T.AmbientLight intensity={0.1} />

	<DataPaths
		primaryPath={config.primaryPath}
		secondaryPaths={config.secondaryPaths}
		{scrollProgress}
		{reducedMotion}
	/>

	<StationNodes
		positions={config.stationPositions}
		{activeStation}
		{reducedMotion}
	/>

	<!-- PostProcessing also sets scene.background via useThrelte() -->
	<PostProcessing {reducedMotion} />
</Canvas>
