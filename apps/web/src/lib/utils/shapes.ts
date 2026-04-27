// Geometric morph-target shapes.
//
// Slice 18 18f Phase 11: migrated from hardcoded const to CMS-managed
// collection (morph_shapes). This file is now a thin async wrapper with a
// module-level cache, plus legacy SHAPES export for the static-adapter
// fallback path.

import { adapter } from '$lib/adapters';
import type { MorphShape } from '@repo/shared';

let cache: readonly MorphShape[] | null = null;

/**
 * Fetch morph shapes from the active adapter (Directus or static), with a
 * module-level cache. First call resolves; subsequent calls return cached.
 */
export async function getMorphShapes(): Promise<readonly MorphShape[]> {
	if (cache) return cache;
	cache = await adapter.content.morphShapes();
	return cache;
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

// ---------------------------------------------------------------------------
// LEGACY EXPORTS — for static-adapter fallback only.
// Will be removed in 18i once all consumers use getMorphShapes().
// ---------------------------------------------------------------------------

/** @deprecated Use getMorphShapes() — fetches from adapter (Directus or static). */
export const SHAPES = {
	triangle: 'M24 8 L40 38 L8 38 Z',
	circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
	square: 'M10 10 L38 10 L38 38 L10 38 Z',
	hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z',
} as const;

/** @deprecated derived from SHAPES — dropped in 18i. */
export type ShapeKey = keyof typeof SHAPES;

/** @deprecated derived from SHAPES — dropped in 18i. */
export const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];
