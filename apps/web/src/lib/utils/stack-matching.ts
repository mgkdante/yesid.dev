// stack-matching (slice-29) — THE one pure function behind compose-as-matching.
//
// The Tech Stack Engine never free-form wires picked techs; it answers
// "what can these build?" by ranking the curated archetypes against the
// picks. Pure data-in/data-out: no DOM, no state, no fetches — fully covered
// by stack-matching.test.ts.

import type { StackArchetype } from '@repo/shared/schemas';

export interface Match {
	slug: string;
	/** |picked ∩ stackIds| / |stackIds| — share of the archetype already picked. */
	coverage: number;
	/** Picked ids present in the archetype, in archetype tech order. */
	matched: string[];
	/** Archetype ids not yet picked, in archetype tech order. */
	missing: string[];
}

/**
 * Rank archetypes by how much of their stack the picked techs cover.
 *
 * Rules (pinned by tests):
 * - empty picks → []
 * - coverage = |picked ∩ stackIds| / |stackIds| (picks outside every
 *   archetype never distort the denominator)
 * - zero-coverage archetypes are excluded
 * - sort: coverage desc, then slug asc
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
		const matched = stackIds.filter((id) => picks.has(id));
		if (matched.length === 0) continue;
		matches.push({
			slug: archetype.slug,
			coverage: matched.length / stackIds.length,
			matched,
			missing: stackIds.filter((id) => !picks.has(id)),
		});
	}

	return matches.sort((a, b) => {
		if (a.coverage !== b.coverage) return b.coverage - a.coverage;
		return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
	});
}
