// CMS media URL helper. Generated content keeps Directus file UUIDs as the
// editing identity, while media-assets.ts maps known UUIDs to committed static
// files for production rendering. In dev, unknown IDs may still fall back to
// PUBLIC_DIRECTUS_URL so new CMS uploads can be previewed before they are
// added to the mirror manifest. In production, unknown IDs fail loud.
//
// ---------------------------------------------------------------------------
//
// Media asset URL helper (18c Task 47, mirror-aware after media export work).
//
// Composes mirrored static URLs for known CMS file UUIDs. When fallback is
// enabled, unknown IDs compose `/assets/:id?key=<preset>` URLs against
// Directus for local editing flows. The server locks asset transforms to named
// presets (`STORAGE_ASSET_TRANSFORM=presets`, set on Railway via 18c Task 37).
//
// Convention: preset keys end with `-<width>` (e.g., `hero-1200`, `card-600`,
// `thumb-300`). `buildSrcSet` parses this suffix to synthesise the
// `<descriptor>w` entries. Presets without a numeric suffix (e.g. `hero-og`)
// for fixed-size OG images get no width descriptor.
//
// Factory pattern keeps the helper unit-testable without touching
// $env/dynamic/public; the default binding at the bottom reads the env once
// lazily for consumer ergonomics.

import { dev } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { mirroredMediaAssets } from '$lib/content/media-assets';

/**
 * Canonical preset list (18c). Each consumer site may narrow this to its own
 * union by branding over the string type. Callers typically pass these names
 * as string literals. TS will accept any `string` at call sites too, since
 * typos here are low-impact (result is a 404 on the asset URL, not a crash).
 */
export type AssetPreset =
	| 'hero-1200'
	| 'card-600'
	| 'thumb-300'
	| 'hero-og'
	// Allow arbitrary preset names while still auto-completing the canonical
	// set. Every string literal is assignable to `string & {}`, but the union
	// members take precedence in IDE suggestions.
	| (string & {});

export interface AssetHelpers {
	/** Build a mirrored static URL or, when allowed, a Directus /assets URL. */
	asset(id: string, preset?: AssetPreset): string;
	/** Build a `srcset` attribute value from a list of presets ordered by width. */
	buildSrcSet(id: string, presets: readonly AssetPreset[]): string;
}

export interface CreateAssetsOptions {
	mirroredAssets?: Readonly<Record<string, string>>;
	allowDirectusFallback?: boolean;
}

/**
 * Factory: bind a base URL and get typed asset helpers. Prefer the default
 * `asset` / `buildSrcSet` exports at the bottom for app consumer code; use
 * this factory in tests to inject a fake base URL.
 */
export function createAssets(baseUrl: string, options: CreateAssetsOptions = {}): AssetHelpers {
	const base = baseUrl.replace(/\/+$/, '');
	const mirrors = options.mirroredAssets ?? {};
	const allowDirectusFallback = options.allowDirectusFallback ?? true;

	const asset: AssetHelpers['asset'] = (id, preset) => {
		const mirrored = mirrors[id];
		if (mirrored) return mirrored;
		if (!allowDirectusFallback) {
			throw new Error(
				`[assets] no mirrored media asset for "${id}" and Directus fallback is disabled.`,
			);
		}
		if (!base) {
			throw new Error(
				'[assets] PUBLIC_DIRECTUS_URL is unset and the requested media asset is not mirrored.',
			);
		}
		const path = `${base}/assets/${encodeURIComponent(id)}`;
		return preset ? `${path}?key=${preset}` : path;
	};

	const buildSrcSet: AssetHelpers['buildSrcSet'] = (id, presets) =>
		presets
			.map((preset) => {
				const width = parsePresetWidth(preset);
				const url = asset(id, preset);
				return width > 0 ? `${url} ${width}w` : url;
			})
			.join(', ');

	return { asset, buildSrcSet };
}

/**
 * Extract a numeric width from a preset suffix (e.g. `hero-1200` -> 1200).
 * Presets without a trailing `-NNN` (e.g. `hero-og`) return 0. Callers
 * treat that as "no width descriptor" (effectively a 1x entry).
 */
function parsePresetWidth(preset: string): number {
	const match = preset.match(/-(\d+)$/);
	return match ? Number(match[1]) : 0;
}

// ---------------------------------------------------------------------------
// Default bindings: lazily read PUBLIC_DIRECTUS_URL so importing this module
// is side-effect-free (keeps the static analysis in apps/web/src/tests happy).
// ---------------------------------------------------------------------------

let cachedDefault: AssetHelpers | null = null;

function defaultAssets(): AssetHelpers {
	if (cachedDefault) return cachedDefault;
	cachedDefault = createAssets(publicEnv.PUBLIC_DIRECTUS_URL ?? '', {
		allowDirectusFallback: dev,
		mirroredAssets: mirroredMediaAssets,
	});
	return cachedDefault;
}

export const asset: AssetHelpers['asset'] = (id, preset) =>
	defaultAssets().asset(id, preset);

export const buildSrcSet: AssetHelpers['buildSrcSet'] = (id, presets) =>
	defaultAssets().buildSrcSet(id, presets);
