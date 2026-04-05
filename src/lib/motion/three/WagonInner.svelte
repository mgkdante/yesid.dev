<!--
  Inner scene content for the wagon — must be a child of <Canvas>.
  Handles model loading, camera, lighting, and animation.
-->
<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { useGltf, useDraco } from '@threlte/extras';

	let {
		scrollProgress = 0,
		reducedMotion = false
	}: {
		scrollProgress?: number;
		reducedMotion?: boolean;
	} = $props();

	// The GLB uses Draco compression — useDraco() returns a DRACOLoader
	// that fetches the decoder from Google CDN (gstatic.com/draco/1.4.3)
	const dracoLoader = useDraco();
	const gltf = useGltf('/models/metro-wagon.glb', { dracoLoader });

	// Idle bob animation
	let bobY = $state(0);

	useTask(() => {
		if (reducedMotion) return;
		bobY = Math.sin(Date.now() * 0.001) * 0.3;
	});

	// Scroll-linked Y rotation
	let scrollRotation = $derived(reducedMotion ? 0 : scrollProgress * 0.5);
</script>

<!-- Camera: front 3/4 angle matching the Sketchfab default POV —
     slightly elevated, looking down the length of the wagon -->
<T.PerspectiveCamera
	makeDefault
	position={[4, 3, 12]}
	fov={35}
	oncreate={(ref) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<!-- Lighting -->
<T.DirectionalLight position={[10, 15, 10]} intensity={2.5} color="#E07800" />
<T.DirectionalLight position={[-5, 8, -5]} intensity={1} color="#FFB627" />
<T.AmbientLight intensity={0.4} color="#ffffff" />

<!-- Wagon model — scaled down from ~35k unit bounding box -->
{#if $gltf}
	<T.Group
		position.y={bobY}
		rotation.y={scrollRotation}
		scale={[0.0005, 0.0005, 0.0005]}
	>
		<T is={$gltf.scene} />
	</T.Group>
{/if}
