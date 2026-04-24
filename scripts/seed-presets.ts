#!/usr/bin/env bun
/**
 * Seed Directus's saved asset presets (Settings → Storage Asset Presets).
 *
 * Slice 18 Task 9. Presets live in `directus_settings.storage_asset_presets`
 * as a JSON array — a data field on the singleton settings record, NOT part
 * of the schema snapshot. This script PATCHes /settings to register:
 *
 *   - hero-1200   (WebP, 1200px wide, q=85, cover)
 *   - card-600    (WebP, 600px wide, q=80, cover)
 *   - thumb-240   (WebP, 240px wide, q=75, cover)
 *   - og-1200     (JPG, 1200×630, q=85, cover — for OG card rendering)
 *
 * Consumer rendering passes these preset keys (`?key=hero-1200`) to bypass
 * Directus's 5-op-per-request transform cap and guarantee uniform output
 * across all content types.
 *
 * Idempotent — re-running overwrites the presets with the declared set.
 *
 * Usage:
 *   bun run seed:presets
 *
 * Required env: see scripts/seed-services.ts (same auth shape).
 *
 * Pure helpers are exported for tests/seed-presets.test.ts.
 */

import { z } from 'zod';

// --- Preset schema -----------------------------------------------------------

export const AssetPresetSchema = z.object({
	key: z.string().regex(/^[a-z0-9-]+$/, 'key must be lowercase-hyphen'),
	fit: z.enum(['cover', 'contain', 'inside', 'outside']),
	width: z.number().int().positive(),
	height: z.number().int().positive().optional(),
	quality: z.number().int().min(1).max(100),
	format: z.enum(['auto', 'jpg', 'png', 'webp', 'tiff']),
	withoutEnlargement: z.boolean().optional(),
	transforms: z.unknown().optional(),
});

export type AssetPreset = z.infer<typeof AssetPresetSchema>;

/**
 * The canonical preset set for Slice 18. Add new presets here only after
 * confirming the consumer side actually wants a new named size — presets are
 * cheap to add but expensive to remove (cached variants would need a CDN
 * purge if a key's params change mid-flight).
 */
export const SLICE_18_PRESETS: readonly AssetPreset[] = [
	{
		key: 'hero-1200',
		fit: 'cover',
		width: 1200,
		quality: 85,
		format: 'webp',
		withoutEnlargement: true,
	},
	{
		key: 'card-600',
		fit: 'cover',
		width: 600,
		quality: 80,
		format: 'webp',
		withoutEnlargement: true,
	},
	{
		key: 'thumb-240',
		fit: 'cover',
		width: 240,
		quality: 75,
		format: 'webp',
		withoutEnlargement: true,
	},
	{
		key: 'og-1200',
		fit: 'cover',
		width: 1200,
		height: 630,
		quality: 85,
		format: 'jpg',
		withoutEnlargement: true,
	},
];

export function validatePresets(
	presets: readonly AssetPreset[],
): readonly AssetPreset[] {
	return z.array(AssetPresetSchema).min(1).parse(presets);
}

export function presetsAreEqual(
	a: readonly AssetPreset[],
	b: readonly AssetPreset[],
): boolean {
	if (a.length !== b.length) return false;
	const sort = (arr: readonly AssetPreset[]) =>
		[...arr].sort((x, y) => x.key.localeCompare(y.key));
	const as = sort(a);
	const bs = sort(b);
	return as.every((item, i) => {
		const other = bs[i];
		return other ? JSON.stringify(item) === JSON.stringify(other) : false;
	});
}

// --- Directus I/O ------------------------------------------------------------

async function getAdminToken(directusUrl: string): Promise<string> {
	if (process.env.DIRECTUS_ADMIN_TOKEN) {
		return process.env.DIRECTUS_ADMIN_TOKEN;
	}
	const email = process.env.DIRECTUS_ADMIN_EMAIL;
	const password = process.env.DIRECTUS_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error(
			'Need DIRECTUS_ADMIN_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.',
		);
	}
	const res = await fetch(`${directusUrl}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		throw new Error(`[auth] ${res.status} ${res.statusText}`);
	}
	const body = (await res.json()) as { data: { access_token: string } };
	return body.data.access_token;
}

async function main(): Promise<void> {
	const directusUrl =
		process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
	console.log(`[seed-presets] target: ${directusUrl}`);

	const presets = validatePresets(SLICE_18_PRESETS);
	console.log(`[seed-presets] ${presets.length} presets to install:`);
	for (const p of presets) {
		console.log(
			`  - ${p.key.padEnd(12)}  ${p.format.padEnd(5)}  ${p.width}${p.height ? `x${p.height}` : ''}  q=${p.quality}  fit=${p.fit}`,
		);
	}

	const token = await getAdminToken(directusUrl);
	const res = await fetch(`${directusUrl}/settings`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ storage_asset_presets: presets }),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`[seed-presets] PATCH /settings failed: ${res.status} — ${text}`);
	}
	const body = (await res.json()) as {
		data?: { storage_asset_presets?: unknown };
	};
	const installed = body.data?.storage_asset_presets;
	console.log(
		`\n[seed-presets] done. Directus responded with ${
			Array.isArray(installed) ? installed.length : 0
		} presets installed.`,
	);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error(
			'[seed-presets] FAILED:',
			err instanceof Error ? err.message : err,
		);
		process.exit(1);
	});
}
