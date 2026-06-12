// stack-shape (go2/w5 — engine layered learning, taste round 2) — the pure
// helpers behind the engine's ALWAYS-ON build-shape teaching.
//
// Taste round 2 (operator verdict): the composed project shape is no longer a
// zero-match fallback — it is the PRIMARY teaching surface of compose mode.
// The matrix is layer coverage, not tech pairs: every pick maps to one of the
// four STACK_LAYERS, so any pick set covers one of 15 possible layer
// combinations — and every combination has a hand-written reading of what
// those layers can do TOGETHER. Total function: no pick combo ever teaches
// nothing. (AND-matched archetypes remain a bonus rail of "known builds".)
//
// Pure data-in/data-out — fully covered by stack-shape.test.ts.

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

/**
 * The full coverage matrix: one homey-teacher reading per possible layer
 * combination (2⁴ − 1 = 15 — small enough to write every cell by hand).
 * Keys are present layers joined with '+', in STACK_LAYERS render order.
 * Every reading says what the covered layers can do TOGETHER, in human words.
 */
export const SHAPE_READINGS: Record<string, string> = {
	interface: 'a face with nothing behind it yet — pure look and feel',
	logic: 'thinking with nowhere to show it — a script, the seed of an automation',
	data: 'memory with nothing using it yet — records kept safe and queryable',
	infra: 'ground with nothing standing on it yet — a place for software to live',
	'interface+logic': 'a face that thinks — an app that computes but forgets on every refresh',
	'interface+data': 'a face on memory — records people can browse, nothing computes yet',
	'interface+infra': 'a live page on real ground — no brain or memory behind it yet',
	'logic+data': 'thinking over memory — the working core of a pipeline or a report',
	'logic+infra': 'code with ground to run on — a bot, a scheduled job, an automation',
	'data+infra': 'memory on real ground — a hosted database, ready for tools on top',
	'interface+logic+data': 'a whole app missing only ground — it works, it just needs somewhere to live',
	'interface+logic+infra': 'a live app that forgets — give it memory and it keeps records',
	'interface+data+infra': 'a live window onto records — add thinking and it can act on them',
	'logic+data+infra': 'a headless system — an automation with memory; only the face is missing',
	'interface+logic+data+infra': 'all four layers — the shape of a complete, working product',
};

/**
 * Read a shape's coverage from the matrix. Total over every present-set the
 * engine can produce; the empty set (defensive — every published tech carries
 * a layer today) gets a gentle prompt instead of a blank.
 */
export function readShape(present: readonly StackLayer[]): string {
	return (
		SHAPE_READINGS[present.join('+')] ??
		'no layers covered yet — pick a part with a layer to give the build a shape'
	);
}

/**
 * English indefinite article for a layer name — ONE source so the gap line
 * ("add an interface layer + a data layer…") and the mini-blueprint ghost
 * annotations ("+ add an interface layer") can never disagree (round 3).
 */
export function layerArticle(layer: StackLayer): 'a' | 'an' {
	return layer === 'interface' || layer === 'infra' ? 'an' : 'a';
}
