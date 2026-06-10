// MEDIA RUNTIME SEAM (slice-28.5 audit #123): this module is the ONE live
// runtime Directus dependency left after slice-27.2. All *data* reads resolve
// from the static adapter ($lib/content snapshots — see the DORMANT banner in
// $lib/adapters/directus.ts), but every CMS-managed image still composes a
// `${PUBLIC_DIRECTUS_URL}/assets/<uuid>` URL HERE, at request time, via
// dynamic env. Consumers: ProjectCard.svelte (project images, SSR'd on
// /projects and home), ImageBlock.svelte (blog-body images), and
// compose-page-seo.ts (OG image when a CMS UUID is set). If
// PUBLIC_DIRECTUS_URL is unset in the runtime environment, defaultAssets()
// below throws DURING SSR — deliberate fail-loud (a silently broken image
// host is worse to debug than a named error). Cross-ref:
// packages/shared/src/assets.ts carries the build-time half of this seam
// (legacyPath → UUID map).
//
// ---------------------------------------------------------------------------
//
// Directus asset URL helper (18c Task 47).
//
// Composes `/assets/:id?key=<preset>` URLs against cms.yesid.dev. The server
// locks asset transforms to named presets (`STORAGE_ASSET_TRANSFORM=presets`,
// set on Railway via 18c Task 37) — callers MUST pass a preset key rather
// than ad-hoc width/height params. Presets are authored in Data Studio →
// Settings → File Transformation Presets.
//
// Convention: preset keys end with `-<width>` (e.g., `hero-1200`, `card-600`,
// `thumb-300`). `buildSrcSet` parses this suffix to synthesise the
// `<descriptor>w` entries. Presets without a numeric suffix (e.g., `hero-og`
// for fixed-size OG images) get no width descriptor.
//
// Factory pattern keeps the helper unit-testable without touching
// $env/dynamic/public; the default binding at the bottom reads the env once
// lazily for consumer ergonomics.

import { env as publicEnv } from '$env/dynamic/public';

/**
 * Canonical preset list (18c). Each consumer site may narrow this to its own
 * union by branding over the string type. Callers typically pass these names
 * as string literals — TS will accept any `string` at call sites too, since
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
	/** Build a Directus /assets URL. With preset → `?key=<preset>`; without → raw asset. */
	asset(id: string, preset?: AssetPreset): string;
	/** Build a `srcset` attribute value from a list of presets ordered by width. */
	buildSrcSet(id: string, presets: readonly AssetPreset[]): string;
}

/**
 * Factory — bind a base URL and get typed asset helpers. Prefer the default
 * `asset` / `buildSrcSet` exports at the bottom for app consumer code; use
 * this factory in tests to inject a fake base URL.
 */
export function createAssets(baseUrl: string): AssetHelpers {
	const base = baseUrl.replace(/\/+$/, '');

	const asset: AssetHelpers['asset'] = (id, preset) => {
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
 * Extract a numeric width from a preset suffix (e.g., `hero-1200` → 1200).
 * Presets without a trailing `-NNN` (e.g., `hero-og`) return 0 — callers
 * treat that as "no width descriptor" (effectively a 1x entry).
 */
function parsePresetWidth(preset: string): number {
	const match = preset.match(/-(\d+)$/);
	return match ? Number(match[1]) : 0;
}

// ---------------------------------------------------------------------------
// Default bindings — lazily read PUBLIC_DIRECTUS_URL so importing this module
// is side-effect-free (keeps the static analysis in apps/web/src/tests happy).
// ---------------------------------------------------------------------------

let cachedDefault: AssetHelpers | null = null;

function defaultAssets(): AssetHelpers {
	if (cachedDefault) return cachedDefault;
	const url = publicEnv.PUBLIC_DIRECTUS_URL;
	if (!url) {
		throw new Error(
			'[assets] PUBLIC_DIRECTUS_URL is unset — cannot compose Directus /assets/<uuid> URLs. ' +
				'This is the media runtime seam ($lib/directus/assets.ts): the ONE live Directus ' +
				'dependency left after slice-27.2, read at request time, so this throw surfaces in SSR. ' +
				'Set PUBLIC_DIRECTUS_URL in the runtime environment (Vercel env, not just build env).',
		);
	}
	cachedDefault = createAssets(url);
	return cachedDefault;
}

export const asset: AssetHelpers['asset'] = (id, preset) =>
	defaultAssets().asset(id, preset);

export const buildSrcSet: AssetHelpers['buildSrcSet'] = (id, presets) =>
	defaultAssets().buildSrcSet(id, presets);
