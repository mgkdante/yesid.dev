// stack-shape (go2/w5 — engine layered learning) — pure helper behind the
// zero-match teaching moment.
//
// When no drawn recipe survives the AND filter, the engine still composes a
// generic project SHAPE from the picked techs' layers: which of the four
// STACK_LAYERS the visitor already covered, and which a working build usually
// still needs. Pure data-in/data-out — fully covered by stack-shape.test.ts.

import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import type { TechStackItem } from '$lib/types';

export interface StackShape {
	/** Dedup'd layers of the picked techs, in STACK_LAYERS render order. */
	present: StackLayer[];
	/** STACK_LAYERS minus present, same order. */
	missing: StackLayer[];
}

/**
 * Compose the project shape of a set of picked tech ids.
 * Ids without a committed layer (or unknown ids) are ignored — defensive.
 */
export function composeStackShape(
	pickedIds: readonly string[],
	techItems: readonly TechStackItem[],
): StackShape {
	const layerById = new Map(techItems.map((t) => [t.id, t.layer]));
	const covered = new Set<StackLayer>();
	for (const id of pickedIds) {
		const layer = layerById.get(id);
		if (layer && (STACK_LAYERS as readonly string[]).includes(layer)) {
			covered.add(layer);
		}
	}
	return {
		present: STACK_LAYERS.filter((l) => covered.has(l)),
		missing: STACK_LAYERS.filter((l) => !covered.has(l)),
	};
}
