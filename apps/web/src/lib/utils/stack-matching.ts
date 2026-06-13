// stack-matching (slice-29, AND-rewrite go2/w4) — THE one pure function
// behind compose-as-matching.
//
// The Tech Stack Engine never free-form wires picked techs; it answers
// "what can these build?" by filtering the curated archetypes against the
// picks. Pure data-in/data-out: no DOM, no state, no fetches — fully covered
// by stack-matching.test.ts.

import type { StackArchetype } from '@repo/shared/schemas';

export interface Match {
	slug: string;
	/** |picked| / |stackIds| — share of the matched archetype already picked. */
	coverage: number;
	/** Picked ids (all of them — AND contract), in archetype tech order. */
	matched: string[];
	/** Archetype ids not yet picked, in archetype tech order. */
	missing: string[];
}

/**
 * Filter + rank archetypes against the picked techs — AND semantics.
 *
 * Rules (pinned by tests):
 * - empty picks → []
 * - an archetype matches ONLY if EVERY picked tech is in its stack
 *   (picked ⊆ stackIds) — more picks narrow the results, never widen them
 * - coverage = |picked| / |stackIds| (duplicates in picks count once)
 * - sort: fewer missing first (closest to complete), then slug asc
 * - matched/missing preserve the archetype's tech order (layer-major, the
 *   same order the blueprint draws)
 */
export function matchArchetypes(
	picked: readonly string[],
	archetypes: readonly StackArchetype[],
): Match[] {
	if (picked.length === 0) return [];
	const picks = new Set(picked);

	const matches: Match[] = [];
	for (const archetype of archetypes) {
		const stackIds = archetype.tech.map((link) => link.id);
		const stackSet = new Set(stackIds);
		// AND contract: any pick outside the stack disqualifies the archetype.
		if (![...picks].every((id) => stackSet.has(id))) continue;
		const matched = stackIds.filter((id) => picks.has(id));
		matches.push({
			slug: archetype.slug,
			coverage: matched.length / stackIds.length,
			matched,
			missing: stackIds.filter((id) => !picks.has(id)),
		});
	}

	return matches.sort((a, b) => {
		if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
		return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
	});
}
