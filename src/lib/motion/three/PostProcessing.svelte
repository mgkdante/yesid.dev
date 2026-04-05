<!--
  Bloom post-processing for the hero 3D scene.
  Uses the `postprocessing` library directly per Threlte v8 patterns:
  disables auto-render, manages an EffectComposer, and renders via useTask.
-->
<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import { onMount } from 'svelte';
	import { Color, type Camera } from 'three';
	import {
		EffectComposer,
		EffectPass,
		RenderPass,
		BloomEffect,
		KernelSize
	} from 'postprocessing';

	let { reducedMotion = false }: { reducedMotion?: boolean } = $props();

	const { scene, renderer, camera, size, renderStage, autoRender } = useThrelte();

	// Set scene background here because this component has useThrelte() access
	scene.background = new Color('#141414');

	const composer = new EffectComposer(renderer);

	function setupPasses(cam: Camera) {
		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, cam));

		// Skip bloom when reduced motion is on — just render normally
		if (!reducedMotion) {
			composer.addPass(
				new EffectPass(
					cam,
					new BloomEffect({
						intensity: 1.2,
						luminanceThreshold: 0,
						luminanceSmoothing: 0.08,
						mipmapBlur: true,
						kernelSize: KernelSize.MEDIUM,
						// Half resolution for performance (MOTION.md S6 constraint)
						height: 256,
						width: 256
					})
				)
			);
		}
	}

	// Rebuild passes when camera changes
	$effect(() => {
		setupPasses($camera);
	});

	// Resize composer when canvas size changes
	$effect(() => {
		composer.setSize($size.width, $size.height);
	});

	// Disable auto rendering so we control the pipeline
	onMount(() => {
		const prev = autoRender.current;
		autoRender.set(false);
		return () => autoRender.set(prev);
	});

	useTask(
		(delta) => {
			composer.render(delta);
		},
		{ stage: renderStage, autoInvalidate: false }
	);
</script>
