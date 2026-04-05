<!--
  Renders one IcosahedronGeometry node per station position.
  Nodes at index <= activeStation glow fully; others are dim.
  Transitions lerp smoothly in useTask (instant when reducedMotion).
-->
<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { IcosahedronGeometry, MeshStandardMaterial, MathUtils, Color } from 'three';
	import type { Vector3 } from 'three';

	let {
		positions,
		activeStation = 0,
		reducedMotion = false
	}: {
		positions: Vector3[];
		activeStation?: number;
		reducedMotion?: boolean;
	} = $props();

	const EMISSIVE = new Color('#E07800');

	// Shared geometry — all nodes use the same shape (detail=1)
	const geometry = new IcosahedronGeometry(1, 1);

	// One material per node so emissiveIntensity can differ
	const materials = positions.map(
		() =>
			new MeshStandardMaterial({
				emissive: EMISSIVE,
				emissiveIntensity: 0.15,
				color: 0x000000
			})
	);

	useTask((delta) => {
		for (let i = 0; i < materials.length; i++) {
			// Stations are 1-indexed in the data, but positions array is 0-indexed
			const isActive = i + 1 <= activeStation;
			const target = isActive ? 1.0 : 0.15;

			if (reducedMotion) {
				materials[i].emissiveIntensity = target;
			} else {
				materials[i].emissiveIntensity = MathUtils.lerp(
					materials[i].emissiveIntensity,
					target,
					delta * 4
				);
			}
		}
	});
</script>

{#each positions as pos, i}
	<T.Mesh
		geometry={geometry}
		material={materials[i]}
		position.x={pos.x}
		position.y={pos.y}
		position.z={pos.z}
		scale={0.12}
	/>
{/each}
