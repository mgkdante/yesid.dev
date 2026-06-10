/**
 * MEDIA RUNTIME SEAM (slice-28.5 audit #123) — read this before assuming the
 * site is CMS-independent at runtime.
 *
 * Asset URLs are the ONE live runtime Directus dependency left after
 * slice-27.2 moved all *data* reads to the static adapter. The UUIDs this map
 * resolves are served from live Directus `/assets/<uuid>` at request time by
 * `apps/web/src/lib/directus/assets.ts` (`asset()` / `buildSrcSet()`), which
 * reads PUBLIC_DIRECTUS_URL via dynamic env on first use and THROWS INTO SSR
 * if it is unset. The "CMS out of the SSR path" story (see the DORMANT banner
 * in apps/web/src/lib/adapters/directus.ts) covers data, not media: if
 * Directus is down or PUBLIC_DIRECTUS_URL is missing in the runtime env,
 * pages render but project-card / blog-body / OG images do not (or SSR 500s
 * on the env throw). Keep this in mind for slice-26 (Directus v12 upgrade)
 * and any future "can we turn the CMS off?" conversation.
 *
 * ---------------------------------------------------------------------------
 *
 * Typed accessor for the asset-id map emitted by 18d migrate-assets.
 *
 * 18e-18i + the metro-svg consumer in 18d phase 8 use this to resolve a
 * legacyPath to its Directus file UUID.
 *
 * Source of truth: apps/cms/fixtures/assets-id-map.json (authoritative);
 * packages/shared/fixtures/assets-id-map.json is a mirror. BOTH copies are
 * emitted by apps/cms/scripts/migrate-assets.ts (GH #40) — refresh them by
 * re-running migrate-assets, never by hand-editing either file.
 */
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };

export type AssetLegacyPath = keyof typeof idMap;

/**
 * Look up a Directus file UUID by its legacy path. Throws if the path isn't
 * in the map — fail loud so missing assets surface at boot, not at render.
 */
export function assetIdFor(legacyPath: AssetLegacyPath): string {
	const id = (idMap as Record<string, string>)[legacyPath];
	if (!id) {
		throw new Error(
			`[assets] no Directus file id for legacyPath "${legacyPath}" — did the manifest change without re-running migrate-assets?`,
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
