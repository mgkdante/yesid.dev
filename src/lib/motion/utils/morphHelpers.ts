// Shared helpers for MorphSVGPlugin-based SVG morph animations.
// Centralizes the convertToPath boilerplate used by HomeServices, BlogSvgIcon, WorkSvgIcon.

import { MorphSVGPlugin } from './gsap.js';

const SVG_SHAPE_SELECTOR = 'path, circle, ellipse, rect, line, polyline, polygon';

/**
 * Convert all SVG shape elements inside a container to MorphSVG-compatible paths.
 * Returns the converted paths and their original `d` attributes (for morph-back).
 */
export function convertSvgToMorphPaths(container: SVGElement): {
	paths: SVGPathElement[];
	originals: string[];
} {
	const elements = Array.from(
		container.querySelectorAll(SVG_SHAPE_SELECTOR)
	) as SVGElement[];

	if (elements.length === 0) return { paths: [], originals: [] };

	// SVG_SHAPE_SELECTOR matches 'path' in addition to SVGPrimitive shapes;
	// MorphSVGPlugin.convertToPath is a runtime no-op on paths, but its typedef
	// narrows the input to SVGPrimitive. Path elements get passed through here
	// to keep the one-pass iteration — the cast acknowledges the typedef gap.
	const paths = elements.map(
		(el) =>
			el instanceof SVGPathElement
				? el
				: MorphSVGPlugin.convertToPath(el as SVGCircleElement | SVGRectElement | SVGEllipseElement | SVGPolygonElement | SVGPolylineElement | SVGLineElement)[0],
	);
	const originals = paths.map((p) => p.getAttribute('d') ?? '');

	return { paths, originals };
}
