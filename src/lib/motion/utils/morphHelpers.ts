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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const paths = elements.map((el) => (MorphSVGPlugin.convertToPath as any)(el)[0] as SVGPathElement);
	const originals = paths.map((p) => p.getAttribute('d') ?? '');

	return { paths, originals };
}
