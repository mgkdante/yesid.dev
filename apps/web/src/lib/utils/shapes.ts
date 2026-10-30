// Browser-safe morph shapes hydrate from the layout's adapter result.

import type { MorphShape } from '@repo/shared';

let cache: readonly MorphShape[] | null = null;

/**
 * Seed the browser-side morph-shape cache from SSR data.
 */
export function setMorphShapes(shapes: readonly MorphShape[]): void {
	cache = shapes;
}

/**
 * Pick a random shape from the array, never the same as lastIndex.
 * Callers track lastIndex themselves to avoid consecutive duplicates.
 */
export function pickRandomShape(
	shapes: readonly MorphShape[],
	lastIndex = -1,
): { shape: MorphShape; index: number } {
	if (shapes.length === 0) {
		throw new Error('No morph shapes available — fetch from adapter first.');
	}
	let idx: number;
	do {
		idx = Math.floor(Math.random() * shapes.length);
	} while (idx === lastIndex && shapes.length > 1);
	return { shape: shapes[idx]!, index: idx };
}

// The generated CMS module owns shapes; this seed serves adapter failures and isolated mounts without hydration.

export const SHAPES = {
	triangle: 'M24 8 L40 38 L8 38 Z',
	circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
	square: 'M10 10 L38 10 L38 38 L10 38 Z',
	hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z',
} as const;

/** Derived from the SHAPES seed — fallback plumbing only. */
export type ShapeKey = keyof typeof SHAPES;

/** Derived from the SHAPES seed — fallback plumbing only. */
export const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];

export const FALLBACK_MORPH_SHAPES: readonly MorphShape[] = SHAPE_KEYS.map((key, index) => ({
	id: key,
	label: key[0]!.toUpperCase() + key.slice(1),
	path: SHAPES[key],
	viewbox: '0 0 48 48',
	sort: index + 1,
}));

/**
 * Return the SSR-hydrated morph shapes (CMS-generated, set via setMorphShapes
 * in +layout.svelte). If a component is mounted in isolation in tests or
 * story-like environments, fall back to the SHAPES seed above.
 */
export async function getMorphShapes(): Promise<readonly MorphShape[]> {
	return cache ?? FALLBACK_MORPH_SHAPES;
}
