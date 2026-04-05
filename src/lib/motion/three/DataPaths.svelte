<!--
  Renders TubeGeometry along each CatmullRomCurve3 from scene-config.
  Primary path: emissiveIntensity lerps 0.3→1.0 with scrollProgress.
  Secondary paths: pulse gently via sine wave on elapsed time.
-->
<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { TubeGeometry, MeshStandardMaterial, MathUtils, Color } from 'three';
	import type { CatmullRomCurve3 } from 'three';

	let {
		primaryPath,
		secondaryPaths,
		scrollProgress = 0,
		reducedMotion = false
	}: {
		primaryPath: CatmullRomCurve3;
		secondaryPaths: [CatmullRomCurve3, CatmullRomCurve3];
		scrollProgress?: number;
		reducedMotion?: boolean;
	} = $props();

	const EMISSIVE = new Color('#E07800');

	// Pre-build geometries (static — curves don't change after init)
	const primaryGeo = new TubeGeometry(primaryPath, 64, 0.025, 8, false);
	const secondaryGeoA = new TubeGeometry(secondaryPaths[0], 32, 0.012, 8, false);
	const secondaryGeoB = new TubeGeometry(secondaryPaths[1], 32, 0.012, 8, false);

	// Materials created once, updated per-frame via useTask
	const primaryMat = new MeshStandardMaterial({
		emissive: EMISSIVE,
		emissiveIntensity: 0.3,
		color: 0x000000
	});

	const secondaryMatA = new MeshStandardMaterial({
		emissive: EMISSIVE,
		emissiveIntensity: 0.4,
		color: 0x000000
	});

	const secondaryMatB = new MeshStandardMaterial({
		emissive: EMISSIVE,
		emissiveIntensity: 0.4,
		color: 0x000000
	});

	let elapsed = 0;

	useTask((delta) => {
		elapsed += delta;

		// Primary path: lerp emissiveIntensity toward target based on scroll
		const primaryTarget = MathUtils.lerp(0.3, 1.0, scrollProgress);
		if (reducedMotion) {
			primaryMat.emissiveIntensity = primaryTarget;
		} else {
			primaryMat.emissiveIntensity = MathUtils.lerp(
				primaryMat.emissiveIntensity,
				primaryTarget,
				delta * 3
			);
		}

		// Secondary paths: gentle sine pulse (independent frequencies)
		if (reducedMotion) {
			secondaryMatA.emissiveIntensity = 0.4;
			secondaryMatB.emissiveIntensity = 0.4;
		} else {
			secondaryMatA.emissiveIntensity = 0.4 + Math.sin(elapsed * 1.3) * 0.15;
			secondaryMatB.emissiveIntensity = 0.4 + Math.sin(elapsed * 0.9) * 0.15;
		}
	});
</script>

<!-- Primary data path -->
<T.Mesh geometry={primaryGeo} material={primaryMat} />

<!-- Secondary decorative paths -->
<T.Mesh geometry={secondaryGeoA} material={secondaryMatA} />
<T.Mesh geometry={secondaryGeoB} material={secondaryMatB} />
