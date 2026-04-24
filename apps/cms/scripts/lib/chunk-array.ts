/**
 * Split an array into fixed-size chunks.
 *
 * Added in 18c Task 27 (F7). Used by batched SDK operations (e.g., upsert N
 * items M at a time) to stay under Directus's payload-size or rate limits.
 * Preserves order; last chunk may be smaller than `size`.
 */

export function chunkArray<T>(arr: readonly T[], size: number): readonly (readonly T[])[] {
	if (size <= 0) throw new Error(`chunkArray: size must be positive (got ${size})`);
	if (arr.length === 0) return [];
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size));
	}
	return out;
}
