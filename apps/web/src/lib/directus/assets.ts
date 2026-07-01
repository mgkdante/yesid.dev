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
// `thumb-240`). `buildSrcSet` parses this suffix to synthesise the
// `<descriptor>w` entries. The fixed-size social card preset (`og-1200`) also
// carries a numeric suffix but is used at its native size for OG images.
//
// Factory pattern keeps the helper unit-testable without touching
// $env/static/public; the default binding at the bottom reads the env once
// lazily for consumer ergonomics.
//
// Static (build-time) env, NOT $env/dynamic/public: dynamic env is unreadable
// while prerendering, and this module runs during prerender for every page
// with images. The namespace import + `in` guard (instead of a named import)
// keeps builds green in contexts where PUBLIC_DIRECTUS_URL is unset (hermetic
// CI, dev deploys) — a named import of an absent static env var is a build
// error. Unset resolves to '', which only matters when an asset misses the
// mirror map (dev-only fallback path; production fails loud regardless).

import { dev } from '$app/environment';
import * as staticPublicEnv from '$env/static/public';
import { mirroredMediaAssets } from '$lib/content/media-assets';
import { mediaVariants } from '$lib/content/media-variants';
import type { MediaVariantEntry } from '$lib/types';

const PUBLIC_DIRECTUS_URL =
	(staticPublicEnv as Record<string, string | undefined>).PUBLIC_DIRECTUS_URL ?? '';

/**
 * Canonical preset list — the exact set seeded in Directus
 * (fixtures/brand/presets.json + directus/collections/settings.json):
 * hero-1200, card-600, thumb-240, og-1200. Each consumer site may narrow this
 * to its own union by branding over the string type. Callers typically pass
 * these names as string literals. TS will accept any `string` at call sites
 * too, since typos here are low-impact (result is a 404 on the asset URL, not
 * a crash).
 */
export type AssetPreset =
	| 'hero-1200'
	| 'card-600'
	| 'thumb-240'
	| 'og-1200'
	// Allow arbitrary preset names while still auto-completing the canonical
	// set. Every string literal is assignable to `string & {}`, but the union
	// members take precedence in IDE suggestions.
	| (string & {});

/**
 * Everything an <img> needs for responsive rendering. `srcset`/`width`/
 * `height` are present when the asset is mirrored AND has generated variants
 * (media-variants.ts); callers supply `sizes` at the call site (it encodes
 * layout knowledge the helper cannot have).
 */
export interface AssetImageSource {
	src: string;
	srcset?: string;
	width?: number;
	height?: number;
}

export interface AssetHelpers {
	/** Build a mirrored static URL or, when allowed, a Directus /assets URL. */
	asset(id: string, preset?: AssetPreset): string;
	/** Build a `srcset` attribute value from a list of presets ordered by width. */
	buildSrcSet(id: string, presets: readonly AssetPreset[]): string;
	/** Resolve src + srcset + intrinsic dimensions for responsive <img> use. */
	assetImage(id: string, preset?: AssetPreset): AssetImageSource;
}

export interface CreateAssetsOptions {
	mirroredAssets?: Readonly<Record<string, string>>;
	/** Variant map keyed by mirrored static path (media-variants.ts). */
	variants?: Readonly<Record<string, MediaVariantEntry>>;
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
	const variants = options.variants ?? {};
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

	const assetImage: AssetHelpers['assetImage'] = (id, preset) => {
		const mirrored = mirrors[id];
		if (mirrored) {
			const entry = variants[mirrored];
			if (!entry) return { src: mirrored };
			return {
				src: mirrored,
				srcset: entry.variants.map((v) => `${v.path} ${v.width}w`).join(', '),
				width: entry.width,
				height: entry.height,
			};
		}
		// Dev-only Directus fallback (unknown/unmirrored id): preset transforms
		// stand in for the missing variant files.
		return {
			src: asset(id, preset),
			srcset: buildSrcSet(id, ['thumb-240', 'card-600', 'hero-1200']),
		};
	};

	return { asset, buildSrcSet, assetImage };
}

/**
 * Extract a numeric width from a preset suffix (e.g. `hero-1200` -> 1200).
 * An ad-hoc preset without a trailing `-NNN` returns 0. Callers treat that as
 * "no width descriptor" (effectively a 1x entry).
 */
function parsePresetWidth(preset: string): number {
	const match = preset.match(/-(\d+)$/);
	return match ? Number(match[1]) : 0;
}

// ---------------------------------------------------------------------------
// Default bindings: lazily construct the helpers so importing this module
// is side-effect-free (keeps the static analysis in apps/web/src/tests happy).
// ---------------------------------------------------------------------------

let cachedDefault: AssetHelpers | null = null;

function defaultAssets(): AssetHelpers {
	if (cachedDefault) return cachedDefault;
	cachedDefault = createAssets(PUBLIC_DIRECTUS_URL, {
		allowDirectusFallback: dev,
		mirroredAssets: mirroredMediaAssets,
		variants: mediaVariants,
	});
	return cachedDefault;
}

export const asset: AssetHelpers['asset'] = (id, preset) =>
	defaultAssets().asset(id, preset);

export const buildSrcSet: AssetHelpers['buildSrcSet'] = (id, presets) =>
	defaultAssets().buildSrcSet(id, presets);

export const assetImage: AssetHelpers['assetImage'] = (id, preset) =>
	defaultAssets().assetImage(id, preset);
