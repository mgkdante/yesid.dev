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

export type AssetLegacyPath = keyof typeof idMap;

/**
 * Look up a Directus file UUID by its legacy path. Throws if the path isn't
 * in the map. Fail loud so missing assets surface at boot, not at render.
 */
export function assetIdFor(legacyPath: AssetLegacyPath): string {
	const id = (idMap as Record<string, string>)[legacyPath];
	if (!id) {
		throw new Error(
			`[assets] no Directus file id for legacyPath "${legacyPath}". Did the manifest change without re-running migrate-assets?`,
		);
	}
	return id;
}

/**
 * Untyped variant for cases where the legacyPath is built dynamically and
 * type-narrowing isn't possible. Returns undefined on miss.
 */
export function assetIdForOrUndefined(legacyPath: string): string | undefined {
	return (idMap as Record<string, string>)[legacyPath];
}
