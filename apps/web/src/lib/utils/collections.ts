// Small pure collection helpers shared across route loaders and facet
// derivations. Client-safe (no env), so re-exported from the $lib/utils barrel.

/**
 * De-duplicate an iterable of strings and return it lexicographically sorted.
 * Generic over the string subtype so facet derivations keep their narrow type
 * (e.g. `uniqueSorted(posts.map((p) => p.lang))` stays `readonly Locale[]`).
 */
export function uniqueSorted<T extends string>(values: Iterable<T>): readonly T[] {
	return [...new Set(values)].sort();
}
