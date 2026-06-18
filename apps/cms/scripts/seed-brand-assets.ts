#!/usr/bin/env bun
//
// DONE — one-shot seed, completed (slice-18l; banner added in slice-28.5,
// audit #34). The brand SVGs are uploaded and their UUIDs are mapped in
// fixtures/assets-id-map.json (re-runs are no-ops once mapped). Keep for
// fresh-environment bootstrap only. Kept in-tree per the 27.2
// archive-not-delete convention.
//
/**
 * Upload yesid.dev brand SVGs (icon + wordmark) to Directus and capture their
 * file UUIDs in `apps/cms/fixtures/assets-id-map.json` so settings.json can
 * reference the icon as `project_logo`.
 *
 * Slice 18l. Idempotent: re-runs are no-ops once UUIDs are mapped. To force
 * re-upload, delete the keys from assets-id-map.json before running.
 *
 * Pattern matches seed-illustrations.ts (18f) — uses lib/sdk + lib/auth +
 * lib/logger + lib/catch-error. No fixture collection: files map straight
 * to repo paths.
 */

import { readFolders, uploadFiles } from '@directus/sdk';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { parseSeedFlags } from './lib/cli';

const log = createLogger('seed-brand-assets');

interface BrandAsset {
	/** Map key in assets-id-map.json. Stable across runs. */
	mapKey: string;
	/** Path relative to apps/cms/ (script cwd) of the source SVG. */
	sourcePath: string;
	/** Filename Directus stores. */
	filename: string;
	/** Title shown in Directus file row. */
	title: string;
	/** Description shown in Directus file row (used as alt text). */
	description: string;
}

const ASSETS: readonly BrandAsset[] = [
	{
		mapKey: 'brand/yesid-icon.svg',
		sourcePath: 'brand/yesid-icon.svg',
		filename: 'yesid-icon.svg',
		title: 'yesid.dev mark',
		description: 'yesid.dev brand mark — orange dot. Used as Directus admin project_logo (sidebar header + favicon).',
	},
	{
		mapKey: 'brand/yesid-wordmark.svg',
		sourcePath: 'brand/yesid-wordmark.svg',
		filename: 'yesid-wordmark.svg',
		title: 'yesid.dev wordmark',
		description: 'yesid.dev brand wordmark — "yesid" + dot. Reserved for future custom_css use; not currently wired into Directus admin chrome.',
	},
] as const;

interface DirectusFolder {
	id: string;
	name: string;
}

interface Schema {
	directus_folders: DirectusFolder[];
}

interface AssetsIdMap {
	[key: string]: string;
}

const ASSETS_MAP_PATH = resolve(import.meta.dir, '../fixtures/assets-id-map.json');

function readAssetsMap(): AssetsIdMap {
	const raw = readFileSync(ASSETS_MAP_PATH, 'utf8');
	return JSON.parse(raw) as AssetsIdMap;
}

function writeAssetsMap(map: AssetsIdMap): void {
	const sorted: AssetsIdMap = {};
	for (const k of Object.keys(map).sort()) {
		sorted[k] = map[k]!;
	}
	writeFileSync(ASSETS_MAP_PATH, `${JSON.stringify(sorted, null, '\t')}\n`, 'utf8');
}

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}

export async function seedBrandAssets(opts: SeedRunOptions): Promise<{ iconUuid: string; wordmarkUuid: string }> {
	const map = readAssetsMap();

	if (opts.dryRun) {
		log.info(`dry-run: would upload ${ASSETS.length} brand assets to ${opts.directusUrl} → folder=brand`);
		for (const a of ASSETS) {
			const existing = map[a.mapKey];
			log.info(`  ${existing ? '~' : '+'} ${a.mapKey.padEnd(28)} ${existing ? `(already mapped: ${existing})` : '(would upload)'}`);
		}
		return { iconUuid: map['brand/yesid-icon.svg'] ?? '', wordmarkUuid: map['brand/yesid-wordmark.svg'] ?? '' };
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	const folders = (await client.request(
		readFolders({ filter: { name: { _eq: 'brand' } }, fields: ['id', 'name'], limit: 1 }),
	)) as DirectusFolder[];
	if (folders.length === 0) {
		throw new Error(
			'[seed-brand-assets] brand folder not found in Directus. Run sync:push first to provision folders.json.',
		);
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const brandFolderId = folders[0]!.id;

	let mutated = false;
	for (const asset of ASSETS) {
		const existing = map[asset.mapKey];
		if (existing) {
			log.info(`  ~ ${asset.mapKey.padEnd(28)} (already mapped: ${existing})`);
			continue;
		}

		const svgBytes = readFileSync(resolve(import.meta.dir, '..', asset.sourcePath));
		const formData = new FormData();
		formData.append('folder', brandFolderId);
		formData.append('title', asset.title);
		formData.append('description', asset.description);
		formData.append('file', new Blob([svgBytes], { type: 'image/svg+xml' }), asset.filename);

		try {
			const uploaded = await client.request(uploadFiles(formData));
			const uuid = (uploaded as { id: string }).id;
			map[asset.mapKey] = uuid;
			mutated = true;
			log.info(`  + ${asset.mapKey.padEnd(28)} uploaded → ${uuid}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to upload ${asset.sourcePath}: ${parseErrors(err).join(' · ')}`);
		}
	}

	if (mutated) {
		writeAssetsMap(map);
		log.info(`assets-id-map.json updated.`);
	} else {
		log.info(`no changes — all brand assets already uploaded.`);
	}

	const iconUuid = map['brand/yesid-icon.svg'];
	const wordmarkUuid = map['brand/yesid-wordmark.svg'];
	if (!iconUuid || !wordmarkUuid) {
		throw new Error('[seed-brand-assets] map is missing icon or wordmark UUID after run.');
	}
	log.info(`project_logo UUID for settings.json: ${iconUuid}`);
	return { iconUuid, wordmarkUuid };
}

async function main(): Promise<void> {
	const { dryRun } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : ''}`);

	if (dryRun) {
		await seedBrandAssets({ directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedBrandAssets({ directusUrl, token });
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-brand-assets] FAILED:', err);
		process.exit(1);
	});
}
