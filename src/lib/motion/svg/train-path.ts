// Generates an SVG path string for GSAP MotionPathPlugin.
// The train travels from off-screen top to off-screen bottom along the
// right edge of the viewport, with subtle horizontal wobble. The path is
// defined in pixel coordinates relative to a viewport-sized container.
//
// stationCount determines intermediate waypoints so the train
// passes through evenly-spaced positions along the journey.

/**
 * Builds a VERTICAL SVG path string for the train's trajectory.
 * @param stationCount Number of service stations (determines curve shape)
 * @param width Container width in pixels (defaults to 1920)
 * @param height Container height in pixels (defaults to 1080)
 * @returns SVG path string suitable for GSAP MotionPathPlugin
 */
export function getTrainMotionPath(
	stationCount: number,
	width = 1920,
	height = 1080
): string {
	// Train starts off-screen top and ends off-screen bottom
	const startY = -200;
	const endY = height + 200;
	// Rail runs along the right edge, 28px from the right side
	const baseX = width - 28;

	// Total nodes: start + N stations + end
	const nodeCount = stationCount + 2;
	const points: { x: number; y: number }[] = [];

	for (let i = 0; i < nodeCount; i++) {
		const t = i / (nodeCount - 1);
		const y = startY + t * (endY - startY);

		// Gentle horizontal wobble — peaks at center, flat at edges.
		// Station positions (non-start, non-end) flatten to baseX for
		// clean alignment with station nodes.
		const isStation = i > 0 && i < nodeCount - 1;
		const waveAmplitude = width * 0.005;
		const x = isStation
			? baseX
			: baseX - Math.sin(t * Math.PI) * waveAmplitude;

		points.push({ x: Math.round(x), y: Math.round(y) });
	}

	// Build a smooth cubic bezier path through the points
	let path = `M ${points[0].x},${points[0].y}`;

	if (points.length === 2) {
		// Simple line for 0 stations
		path += ` L ${points[1].x},${points[1].y}`;
		return path;
	}

	// Use smooth cubic beziers (S command) for a natural curve.
	// Control point offset is on the Y axis (vertical travel direction).
	for (let i = 1; i < points.length; i++) {
		const prev = points[i - 1];
		const curr = points[i];

		// Control point offset: 1/3 of the vertical distance between points
		const cpOffset = (curr.y - prev.y) / 3;

		if (i === 1) {
			// First curve: explicit cubic bezier
			path += ` C ${prev.x},${prev.y + cpOffset} ${curr.x},${curr.y - cpOffset} ${curr.x},${curr.y}`;
		} else {
			// Subsequent curves: smooth continuation
			path += ` S ${curr.x},${curr.y - cpOffset} ${curr.x},${curr.y}`;
		}
	}

	return path;
}
