/**
 * Typed accessor for the asset-id map emitted by 18d migrate-assets.
 *
 * 18e-18i + the metro-svg consumer in 18d phase 8 use this to resolve a
 * legacyPath to its Directus file UUID.
 *
 * Source of truth: apps/cms/fixtures/assets-id-map.json (authoritative);
 * packages/shared/fixtures/assets-id-map.json is a mirror. BOTH copies are
 * emitted by apps/cms/scripts/migrate-assets.ts (GH #40). Refresh them by
 * re-running migrate-assets, never by hand-editing either file.
 */
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };

/**
 * Look up a Directus file UUID by legacy path. Returns undefined on miss.
 */
export function assetIdForOrUndefined(legacyPath: string): string | undefined {
	return (idMap as Record<string, string>)[legacyPath];
}
