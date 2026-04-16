// Geometric target shapes for SVG morph animations.
// Centered in a 48x48 viewBox, sized to ~60% of viewBox.

export const SHAPES = {
	triangle: 'M24 8 L40 38 L8 38 Z',
	circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
	square: 'M10 10 L38 10 L38 38 L10 38 Z',
	hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z'
} as const;

export type ShapeKey = keyof typeof SHAPES;

export const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];

/**
 * Pick a random shape key, never the same as lastIndex.
 * Callers track lastIndex themselves to avoid consecutive duplicates.
 */
export function pickRandomShape(lastIndex = -1): { key: ShapeKey; index: number } {
	let idx: number;
	do {
		idx = Math.floor(Math.random() * SHAPE_KEYS.length);
	} while (idx === lastIndex && SHAPE_KEYS.length > 1);
	return { key: SHAPE_KEYS[idx], index: idx };
}
