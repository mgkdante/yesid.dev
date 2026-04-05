// Scene geometry config for the Threlte 3D hero background.
// All positions are derived from stationCount — no hardcoded counts.
// Called once at scene init with services.length.

import { Vector3, CatmullRomCurve3 } from 'three';

export interface SceneConfig {
	camera: {
		position: [number, number, number];
		fov: number;
	};
	primaryPath: CatmullRomCurve3;
	stationPositions: Vector3[];
	secondaryPaths: [CatmullRomCurve3, CatmullRomCurve3];
}

/**
 * Builds all 3D geometry positions from a station count.
 * The primary path passes through N+2 nodes (departure, N stations, destination).
 * Two decorative secondary paths sit behind the primary at deeper Z values.
 */
export function getSceneConfig(stationCount: number): SceneConfig {
	const nodeCount = stationCount + 2; // departure + stations + destination

	// --- Primary path: gentle arc through all nodes ---
	const primaryPoints: Vector3[] = [];
	const stationPositions: Vector3[] = [];

	for (let i = 0; i < nodeCount; i++) {
		// t goes from 0 to 1 across all nodes
		const t = i / (nodeCount - 1);

		// X: distribute evenly from -4.5 to 4.5
		const x = -4.5 + t * 9;

		// Y: sine arc — peaks at center, zero at edges
		const y = Math.sin(t * Math.PI) * 1.2;

		// Z: primary depth at -1 with slight per-node variation for visual interest
		const z = -1 + Math.sin(t * Math.PI * 2) * 0.3;

		const point = new Vector3(x, y, z);
		primaryPoints.push(point);

		// Interior nodes (not departure/destination) are station positions
		if (i > 0 && i < nodeCount - 1) {
			stationPositions.push(point.clone());
		}
	}

	const primaryPath = new CatmullRomCurve3(primaryPoints, false, 'catmullrom', 0.5);

	// --- Secondary paths: decorative curves at deeper Z, crossing near center ---

	// Path A: sweeps from upper-left to lower-right, dips through center
	const secondaryA = new CatmullRomCurve3(
		[
			new Vector3(-5, 2.5, -2.5),
			new Vector3(-2, 0.5, -2.3),
			new Vector3(0, -0.8, -2.5),
			new Vector3(2.5, 0.3, -2.7),
			new Vector3(5, 1.8, -2.5)
		],
		false,
		'catmullrom',
		0.5
	);

	// Path B: sweeps from lower-left to upper-right, converges with A near center
	const secondaryB = new CatmullRomCurve3(
		[
			new Vector3(-5, -1.5, -3.5),
			new Vector3(-1.5, -0.3, -3.3),
			new Vector3(0.5, -0.5, -3.5),
			new Vector3(2, -1.8, -3.7),
			new Vector3(5, -0.5, -3.5)
		],
		false,
		'catmullrom',
		0.5
	);

	return {
		camera: {
			position: [0, 0, 5],
			fov: 50
		},
		primaryPath,
		stationPositions,
		secondaryPaths: [secondaryA, secondaryB]
	};
}
