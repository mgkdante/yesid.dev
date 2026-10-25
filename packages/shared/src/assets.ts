/**
 * Typed accessor for the frozen asset-id map from the 18d migration.
 *
 * 18e-18i + the metro-svg consumer in 18d phase 8 use this to resolve a
 * legacyPath to its Directus file UUID.
 *
 * Source of truth: apps/cms/fixtures/assets-id-map.json (authoritative);
 * packages/shared/fixtures/assets-id-map.json is a mirror. Both copies are a
 * frozen record of the 18d migration (GH #40), not a regeneration target.
 */
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };

/**
 * Look up a Directus file UUID by legacy path. Returns undefined on miss.
 */
export function assetIdForOrUndefined(legacyPath: string): string | undefined {
	return (idMap as Record<string, string>)[legacyPath];
}
