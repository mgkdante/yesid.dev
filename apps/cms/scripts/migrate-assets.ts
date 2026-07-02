#!/usr/bin/env bun
/**
 * Migrate yesid.dev's `static/images/*` tree into Directus-managed R2 storage.
 *
 * Slice 18 Task 9 (originally) → retrofitted in 18d Tasks 10-15.
 *
 * Idempotency: filtered by `directus_files.legacy_path` (custom field added in
 * 18c, replacing the pre-18c `[legacy:<path>]` description-tag pattern).
 * Editor-uploaded files leave `legacy_path` NULL — they are never matched here.
 *
 * Strategy:
 *   1. Load `fixtures/assets-manifest.json` + Zod-validate.
 *   2. Auth to Directus (static token or email/password) via lib/auth.
 *   3. Ensure target folders exist — create any missing ones.
 *   4. Query existing files by `legacy_path` to compute idempotency partition.
 *   5. (Optional, --reset) Delete previously-uploaded entries so the next pass
 *      uploads fresh — useful for re-running after manifest changes.
 *   6. For each entry not yet uploaded, push the file from
 *      `<source>/<legacyPath>` with title + description + folder + legacy_path.
 *      Wrapped in withRateLimit() to stay under instance RATE_LIMITER_*.
 *   7. Emit `fixtures/assets-id-map.json` with the legacyPath → file UUID map.
 *
 * Usage:
 *   bun run migrate:assets
 *   bun run migrate:assets -- --source ../web/static --dry-run
 *   bun run migrate:assets -- --reset            (deletes prior, re-uploads)
 *
 * CLI flags:
 *   --source <path>   Source root on disk (default: ../web/static at monorepo)
 *   --dry-run         Skip uploads; print what WOULD happen.
 *   --reset           Delete previously-uploaded files first, then upload all.
 *   --preserve-ids-from-map
 *                     Upload new files with IDs from assets-id-map.json.
 *
 * Required env:
 *   DIRECTUS_ADMIN_TOKEN  — preferred (skips /auth/login)
 *   OR
 *   DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD
 *   PUBLIC_DIRECTUS_URL   — optional, defaults to https://cms.yesid.dev
 *
 * Pure helpers (`parseManifest`, `resolveSourcePath`, `findMissingSources`,
 * `validateFolderReferences`, `extractLegacyTopLevel`, `deriveAltText`,
 * `filterToUpload`, `buildIdMap`) are exported for tests in
 * `tests/migrate-assets.test.ts` to unit-test without network I/O.
 */

import {
	createFolder,
	deleteFile,
	readFolders,
	readFiles,
	updateFile,
	uploadFiles,
} from '@directus/sdk';
import { z } from 'zod';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath, join as joinPath, relative } from 'node:path';

import { assertDevCms, createClient as createSdkClient, defaultDirectusUrl, requireEnv } from './lib/sdk';
import { getAdminToken as getAdminTokenLib } from './lib/auth';
import { withRateLimit } from './lib/bottleneck';
import { DirectusError, parseErrors } from './lib/catch-error';
import { createLogger } from './lib/logger';

const log = createLogger('migrate');

// `requireEnv` is re-exported from lib/sdk; not used directly here, but kept
// imported for symmetry with other scripts that share this import block.
void requireEnv;

// --- Types + Zod schemas (validate manifest JSON at load-time) --------------

export const AssetEntrySchema = z.object({
	legacyPath: z.string().min(1),
	folder: z.string().min(1),
	title: z.string().min(1),
	description: z.string().min(1),
});

export const AssetsManifestSchema = z.object({
	description: z.string().min(1),
	sourceRoot: z.string().min(1),
	folders: z.record(z.string().min(1), z.string().min(1)),
	assets: z.array(AssetEntrySchema).min(1),
});

export type AssetEntry = z.infer<typeof AssetEntrySchema>;
export type AssetsManifest = z.infer<typeof AssetsManifestSchema>;
export interface ImageMetadata {
	type: string;
	width?: number;
	height?: number;
}

// --- Pure helpers (tested in tests/migrate-assets.test.ts) ------------------

/** Parse + validate the manifest; throws on shape drift. */
export function parseManifest(json: unknown): AssetsManifest {
	return AssetsManifestSchema.parse(json);
}

/** Resolve an absolute path on disk from a manifest entry + source root. */
export function resolveSourcePath(entry: AssetEntry, sourceRoot: string): string {
	return resolvePath(sourceRoot, entry.legacyPath);
}

/**
 * Every entry in the manifest must point at an existing file on disk. Returns
 * the list of missing paths so the migration can fail loud before any upload.
 */
export function findMissingSources(
	manifest: AssetsManifest,
	sourceRoot: string,
): readonly { entry: AssetEntry; absPath: string }[] {
	const missing: { entry: AssetEntry; absPath: string }[] = [];
	for (const entry of manifest.assets) {
		const absPath = resolveSourcePath(entry, sourceRoot);
		if (!existsSync(absPath)) {
			missing.push({ entry, absPath });
		}
	}
	return missing;
}

/**
 * Parse the first-level folder name off a legacy path. Used when inspecting
 * files or validating manifest grouping consistency.
 */
export function extractLegacyTopLevel(legacyPath: string): string {
	const parts = legacyPath.split('/');
	return parts.length > 1 ? (parts[0] ?? '') : '';
}

/**
 * Validate that every manifest entry's declared `folder` is one of the named
 * folders in the manifest's `folders` map. Catches typos like "proyects" vs
 * "projects" at load-time.
 */
export function validateFolderReferences(manifest: AssetsManifest): string[] {
	const errors: string[] = [];
	const declared = new Set(Object.keys(manifest.folders));
	for (const entry of manifest.assets) {
		if (!declared.has(entry.folder)) {
			errors.push(
				`asset "${entry.legacyPath}" references folder "${entry.folder}" which is not declared in the manifest's folders map`,
			);
		}
	}
	return errors;
}

/**
 * Derive a sentence-case alt text from a filename.
 *   'headshot.webp'        → 'Headshot'
 *   'polaroid-1.webp'      → 'Polaroid 1'
 *   'edu-bishops.svg'      → 'Edu Bishops'
 *   'montreal-metro.svg'   → 'Montreal Metro'
 */
export function deriveAltText(filename: string): string {
	const base = filename.replace(/\.[^.]+$/, '');
	return base
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
}

export function mimeTypeForLegacyPath(legacyPath: string): string {
	const ext = legacyPath.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'svg':
			return 'image/svg+xml';
		case 'webp':
			return 'image/webp';
		default:
			return 'application/octet-stream';
	}
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
	return String.fromCharCode(...bytes.slice(start, start + length));
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
	return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
	return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
	return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
	return (
		(bytes[offset] << 24) |
		(bytes[offset + 1] << 16) |
		(bytes[offset + 2] << 8) |
		bytes[offset + 3]
	) >>> 0;
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
	return (
		bytes[offset] |
		(bytes[offset + 1] << 8) |
		(bytes[offset + 2] << 16) |
		(bytes[offset + 3] << 24)
	) >>> 0;
}

function validDimensions(
	width: number,
	height: number,
): { width: number; height: number } | null {
	if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
	if (width <= 0 || height <= 0) return null;
	return { width, height };
}

function parsePngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (bytes.length < 24) return null;
	if (!pngSignature.every((value, index) => bytes[index] === value)) return null;
	if (ascii(bytes, 12, 4) !== 'IHDR') return null;
	return validDimensions(readUint32BE(bytes, 16), readUint32BE(bytes, 20));
}

function isJpegStartOfFrame(marker: number): boolean {
	return (
		(marker >= 0xc0 && marker <= 0xc3) ||
		(marker >= 0xc5 && marker <= 0xc7) ||
		(marker >= 0xc9 && marker <= 0xcb) ||
		(marker >= 0xcd && marker <= 0xcf)
	);
}

function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

	let offset = 2;
	while (offset + 4 < bytes.length) {
		while (offset < bytes.length && bytes[offset] === 0xff) offset++;
		const marker = bytes[offset];
		offset++;

		if (marker === 0xd9 || marker === 0xda) break;
		if (offset + 2 > bytes.length) break;

		const segmentLength = readUint16BE(bytes, offset);
		if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

		if (isJpegStartOfFrame(marker) && segmentLength >= 7) {
			const height = readUint16BE(bytes, offset + 3);
			const width = readUint16BE(bytes, offset + 5);
			return validDimensions(width, height);
		}

		offset += segmentLength;
	}

	return null;
}

function parseWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	if (bytes.length < 30) return null;
	if (ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') return null;

	let offset = 12;
	while (offset + 8 <= bytes.length) {
		const chunkType = ascii(bytes, offset, 4);
		const chunkSize = readUint32LE(bytes, offset + 4);
		const dataOffset = offset + 8;
		if (dataOffset + chunkSize > bytes.length) break;

		if (chunkType === 'VP8X' && chunkSize >= 10) {
			const width = readUint24LE(bytes, dataOffset + 4) + 1;
			const height = readUint24LE(bytes, dataOffset + 7) + 1;
			return validDimensions(width, height);
		}

		if (chunkType === 'VP8L' && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
			const b0 = bytes[dataOffset + 1];
			const b1 = bytes[dataOffset + 2];
			const b2 = bytes[dataOffset + 3];
			const b3 = bytes[dataOffset + 4];
			const width = 1 + (((b1 & 0x3f) << 8) | b0);
			const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
			return validDimensions(width, height);
		}

		if (
			chunkType === 'VP8 ' &&
			chunkSize >= 10 &&
			bytes[dataOffset + 3] === 0x9d &&
			bytes[dataOffset + 4] === 0x01 &&
			bytes[dataOffset + 5] === 0x2a
		) {
			const width = readUint16LE(bytes, dataOffset + 6) & 0x3fff;
			const height = readUint16LE(bytes, dataOffset + 8) & 0x3fff;
			return validDimensions(width, height);
		}

		offset = dataOffset + chunkSize + (chunkSize % 2);
	}

	return null;
}

function parseSvgNumber(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = Number.parseFloat(value.trim());
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSvgAttr(tag: string, attrName: string): string | undefined {
	const match = tag.match(
		new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, 'i'),
	);
	return match?.[1] ?? match?.[2] ?? match?.[3];
}

function parseSvgDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	const text = new TextDecoder('utf8').decode(bytes);
	const svgTag = text.match(/<svg\b[^>]*>/i)?.[0];
	if (!svgTag) return null;

	const width = parseSvgNumber(getSvgAttr(svgTag, 'width'));
	const height = parseSvgNumber(getSvgAttr(svgTag, 'height'));
	if (width && height) return validDimensions(width, height);

	const viewBox = getSvgAttr(svgTag, 'viewBox');
	const parts = viewBox
		?.trim()
		.split(/[\s,]+/)
		.map((part) => Number.parseFloat(part));
	if (parts?.length === 4) {
		return validDimensions(parts[2] ?? 0, parts[3] ?? 0);
	}

	return null;
}

export function imageMetadataFromBytes(legacyPath: string, bytes: Uint8Array): ImageMetadata {
	const pngDimensions = parsePngDimensions(bytes);
	if (pngDimensions) return { type: 'image/png', ...pngDimensions };

	const jpegDimensions = parseJpegDimensions(bytes);
	if (jpegDimensions) return { type: 'image/jpeg', ...jpegDimensions };

	const webpDimensions = parseWebpDimensions(bytes);
	if (webpDimensions) return { type: 'image/webp', ...webpDimensions };

	const svgDimensions = parseSvgDimensions(bytes);
	if (svgDimensions) return { type: 'image/svg+xml', ...svgDimensions };

	return { type: mimeTypeForLegacyPath(legacyPath) };
}

export function imageMetadataForSource(absPath: string, legacyPath: string): ImageMetadata {
	return imageMetadataFromBytes(legacyPath, readFileSync(absPath));
}

export function buildFileMetadataPatch(
	file: Pick<DirectusFile, 'type' | 'width' | 'height'>,
	expected: ImageMetadata,
): { type?: string; width?: number; height?: number } {
	const patch: { type?: string; width?: number; height?: number } = {};
	if (file.type !== expected.type) patch.type = expected.type;
	if (expected.width && file.width !== expected.width) patch.width = expected.width;
	if (expected.height && file.height !== expected.height) patch.height = expected.height;
	return patch;
}

/**
 * Partition manifest entries into { alreadyUploaded, toUpload } using a map of
 * existing files keyed by `legacy_path`. Replaces the pre-18c
 * `mergeExistingFiles` (which matched on description-tag); legacy_path is the
 * new idempotency key — set as a dedicated form field at upload time.
 */
export function filterToUpload(
	manifest: AssetsManifest,
	existingByLegacyPath: ReadonlyMap<string, string>,
): { alreadyUploaded: Map<string, string>; toUpload: AssetEntry[] } {
	const alreadyUploaded = new Map<string, string>();
	const toUpload: AssetEntry[] = [];
	for (const entry of manifest.assets) {
		const existingId = existingByLegacyPath.get(entry.legacyPath);
		if (existingId) {
			alreadyUploaded.set(entry.legacyPath, existingId);
		} else {
			toUpload.push(entry);
		}
	}
	return { alreadyUploaded, toUpload };
}

/**
 * Build the legacyPath → uuid record for the emitted id-map fixture. Sorts
 * keys alphabetically for diff-friendliness.
 */
export function buildIdMap(
	entries: ReadonlyArray<{ legacyPath: string; id: string }>,
): Record<string, string> {
	const sorted = [...entries].sort((a, b) =>
		a.legacyPath.localeCompare(b.legacyPath),
	);
	const out: Record<string, string> = {};
	for (const e of sorted) out[e.legacyPath] = e.id;
	return out;
}

export function collectPreservedIdMapEntries(
	existingMaps: ReadonlyArray<Record<string, unknown>>,
	manifestKeys: ReadonlySet<string>,
): Map<string, string> {
	const preservedEntries = new Map<string, string>();
	for (const existingMap of existingMaps) {
		for (const [key, value] of Object.entries(existingMap)) {
			if (manifestKeys.has(key)) continue;
			if (key.startsWith('images/')) continue;
			if (typeof value === 'string' && !preservedEntries.has(key)) {
				preservedEntries.set(key, value);
			}
		}
	}
	return preservedEntries;
}

export function desiredIdsForManifest(
	manifest: AssetsManifest,
	idMap: Readonly<Record<string, unknown>>,
): Map<string, string> {
	const desiredIds = new Map<string, string>();
	for (const entry of manifest.assets) {
		const desiredId = idMap[entry.legacyPath];
		if (typeof desiredId !== 'string' || desiredId.length === 0) {
			throw new Error(
				`[migrate] missing preserved file id for ${entry.legacyPath}`,
			);
		}
		desiredIds.set(entry.legacyPath, desiredId);
	}
	return desiredIds;
}

export function findPreservedIdConflicts(
	existingByLegacyPath: ReadonlyMap<string, string>,
	desiredIds: ReadonlyMap<string, string>,
): readonly { legacyPath: string; existingId: string; desiredId: string }[] {
	const conflicts: { legacyPath: string; existingId: string; desiredId: string }[] = [];
	for (const [legacyPath, existingId] of existingByLegacyPath) {
		const desiredId = desiredIds.get(legacyPath);
		if (desiredId && desiredId !== existingId) {
			conflicts.push({ legacyPath, existingId, desiredId });
		}
	}
	return conflicts;
}

// --- Directus I/O (only exercised by CLI entrypoint) -----------------------

interface MigrateOptions {
	directusUrl: string;
	token: string;
	sourceRoot: string;
	/**
	 * One or more paths to emit the assets-id-map.json to. GH #40: a single
	 * authoritative copy lives at `apps/cms/fixtures/assets-id-map.json`; a
	 * mirror is written to `packages/shared/fixtures/assets-id-map.json` so
	 * `@repo/shared.assetIdFor` resolves from a workspace-package import
	 * without crossing the app-independence boundary (D12). Both paths are
	 * written atomically in the same run — no manual `cp` needed afterward.
	 */
	outputMapPaths: readonly string[];
	dryRun: boolean;
	reset: boolean;
	preserveIds?: ReadonlyMap<string, string>;
}

interface DirectusFolder {
	id: string;
	name: string;
	parent: string | null;
}

interface DirectusFile {
	id: string;
	legacy_path: string | null;
	type?: string | null;
	width?: number | null;
	height?: number | null;
}

async function ensureFolders(
	client: ReturnType<typeof createSdkClient>,
	folderNames: readonly string[],
): Promise<Map<string, string>> {
	const existing = (await client.request(
		readFolders({ fields: ['id', 'name', 'parent'], limit: -1 }),
	)) as DirectusFolder[];
	const byName = new Map<string, string>();
	for (const f of existing) {
		if (!f.parent) byName.set(f.name, f.id);
	}
	for (const name of folderNames) {
		if (byName.has(name)) continue;
		const created = (await client.request(
			createFolder({ name }),
		)) as DirectusFolder;
		byName.set(name, created.id);
		log.info(`created folder: ${name} (${created.id})`);
	}
	return byName;
}

async function uploadOne(
	client: ReturnType<typeof createSdkClient>,
	entry: AssetEntry,
	folderId: string,
	sourceRoot: string,
	desiredId?: string,
): Promise<string> {
	const absPath = resolveSourcePath(entry, sourceRoot);
	const bytes = readFileSync(absPath);
	const form = new FormData();
	if (desiredId) form.append('id', desiredId);
	form.append('folder', folderId);
	form.append('legacy_path', entry.legacyPath);
	form.append('description', entry.description);
	form.append('title', entry.title);
	form.append('tags', JSON.stringify(['slice-18-migrated']));
	const filename = entry.legacyPath.split('/').pop() ?? entry.legacyPath;
	const metadata = imageMetadataFromBytes(entry.legacyPath, bytes);
	form.append('type', metadata.type);
	if (metadata.width) form.append('width', String(metadata.width));
	if (metadata.height) form.append('height', String(metadata.height));
	const blob = new Blob([bytes as unknown as BlobPart], { type: metadata.type });
	form.append('file', blob, filename);
	const uploaded = (await client.request(uploadFiles(form))) as { id: string };
	return uploaded.id;
}

const uploadOneRateLimited = withRateLimit(uploadOne, {
	maxConcurrent: 3,
	minTime: 100,
});

export async function migrateAssets(
	manifest: AssetsManifest,
	opts: MigrateOptions,
): Promise<Map<string, string>> {
	// Fail loud if any source file is missing BEFORE touching Directus.
	const missing = findMissingSources(manifest, opts.sourceRoot);
	if (missing.length > 0) {
		const list = missing.map((m) => `  - ${m.entry.legacyPath} → ${m.absPath}`).join('\n');
		throw new Error(`[migrate] ${missing.length} source files missing:\n${list}`);
	}
	const folderErrors = validateFolderReferences(manifest);
	if (folderErrors.length > 0) {
		throw new Error(`[migrate] folder-reference errors:\n  ${folderErrors.join('\n  ')}`);
	}

	log.info(`manifest: ${manifest.assets.length} assets`);
	log.info(`source:   ${opts.sourceRoot}`);
	log.info(`target:   ${opts.directusUrl}`);

	if (opts.dryRun) {
		log.info('');
		log.info('DRY RUN — no uploads will happen.');
		log.info('');
		for (const entry of manifest.assets) {
			log.info(
				`  would upload: ${entry.legacyPath.padEnd(40)}  → folder="${entry.folder}"  title="${entry.title}"`,
			);
		}
		return new Map();
	}

	const client = createSdkClient(opts.directusUrl, opts.token);

	// Ensure folders exist + collect their Directus IDs.
	const folderIds = await ensureFolders(
		client,
		Object.keys(manifest.folders),
	);

	// Idempotency: query existing files by legacy_path (replaces description-tag
	// pattern from pre-18c version). Only files with a non-null legacy_path —
	// editor-uploaded files leave the field NULL.
	const wantedPaths = manifest.assets.map((a) => a.legacyPath);
	const existingFiles = (await client.request(
		readFiles({
			fields: ['id', 'legacy_path', 'type', 'width', 'height'],
			filter: { legacy_path: { _in: wantedPaths } },
			limit: -1,
		}),
	)) as DirectusFile[];
	const existingByLegacyPath = new Map<string, string>();
	for (const f of existingFiles) {
		if (f.legacy_path) existingByLegacyPath.set(f.legacy_path, f.id);
	}

	if (opts.reset && existingByLegacyPath.size > 0) {
		log.info(`reset: deleting ${existingByLegacyPath.size} previously-uploaded files...`);
		for (const [legacyPath, id] of existingByLegacyPath) {
			try {
				await client.request(deleteFile(id));
			} catch (err) {
				const msgs = parseErrors(err);
				log.warn(`  failed to delete ${legacyPath} (${id}): ${msgs.join(' · ')}`);
			}
		}
		existingByLegacyPath.clear();
	} else {
		const manifestByLegacyPath = new Map(
			manifest.assets.map((entry) => [entry.legacyPath, entry]),
		);
		for (const file of existingFiles) {
			if (!file.legacy_path) continue;
			const entry = manifestByLegacyPath.get(file.legacy_path);
			if (!entry) continue;
			const expectedMetadata = imageMetadataForSource(
				resolveSourcePath(entry, opts.sourceRoot),
				file.legacy_path,
			);
			const patch = buildFileMetadataPatch(file, expectedMetadata);
			if (Object.keys(patch).length === 0) continue;
			try {
				await client.request(updateFile(file.id, patch));
				const changes = Object.entries(patch)
					.map(([key, value]) => `${key}=${value}`)
					.join(', ');
				log.info(
					`repaired file metadata: ${file.legacy_path} (${changes})`,
				);
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to repair file metadata for ${file.legacy_path}: ${msgs.join(' · ')}`,
				);
			}
		}
	}

	if (!opts.reset && opts.preserveIds?.size) {
		const conflicts = findPreservedIdConflicts(existingByLegacyPath, opts.preserveIds);
		if (conflicts.length > 0) {
			const list = conflicts
				.map(
					(conflict) =>
						`  - ${conflict.legacyPath}: existing=${conflict.existingId}, desired=${conflict.desiredId}`,
				)
				.join('\n');
			throw new Error(
				`[migrate] ${conflicts.length} preserved id conflicts found. Re-run with --reset only after verifying these are disposable migrated assets.\n${list}`,
			);
		}
	}

	const { alreadyUploaded, toUpload } = filterToUpload(manifest, existingByLegacyPath);

	if (alreadyUploaded.size > 0) {
		log.info(
			`skipping ${alreadyUploaded.size} already-uploaded assets (matched by legacy_path).`,
		);
	}
	log.info(`uploading ${toUpload.length} new assets...`);
	log.info('');

	const idMap = new Map<string, string>(alreadyUploaded);
	for (const entry of toUpload) {
		const folderId = folderIds.get(entry.folder);
		if (!folderId) {
			throw new Error(
				`[migrate] folder "${entry.folder}" was not created — check ensureFolders().`,
			);
		}
		let fileId: string;
		const desiredId = opts.preserveIds?.get(entry.legacyPath);
		try {
			fileId = await uploadOneRateLimited(
				client,
				entry,
				folderId,
				opts.sourceRoot,
				desiredId,
			);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Upload failed for ${entry.legacyPath}: ${msgs.join(' · ')}`,
			);
		}
		if (desiredId && fileId !== desiredId) {
			throw new DirectusError(
				500,
				`Upload failed for ${entry.legacyPath}: Directus returned ${fileId}, expected preserved id ${desiredId}`,
			);
		}
		idMap.set(entry.legacyPath, fileId);
		log.info(
			`  ✓ ${entry.legacyPath.padEnd(40)}  →  ${fileId}  (folder=${entry.folder})`,
		);
	}

	// Emit the id-map file. Stable-ordered for diff-friendliness. Preserve
	// non-images keys owned by sibling seeders, such as brand/* from
	// seed-brand-assets.ts, while still letting removed manifest images disappear.
	const manifestKeys = new Set(manifest.assets.map((entry) => entry.legacyPath));
	const existingMaps: Record<string, unknown>[] = [];
	for (const outPath of opts.outputMapPaths) {
		if (!existsSync(outPath)) continue;
		try {
			existingMaps.push(JSON.parse(readFileSync(outPath, 'utf8')) as Record<string, unknown>);
		} catch {
			log.warn(`could not read existing id-map for preserved entries: ${outPath}`);
		}
	}
	const preservedEntries = collectPreservedIdMapEntries(existingMaps, manifestKeys);

	const outputObj: Record<string, string> = {};
	for (const [key, value] of preservedEntries) {
		outputObj[key] = value;
	}
	for (const key of [...idMap.keys()].sort()) {
		outputObj[key] = idMap.get(key) ?? '';
	}
	const serialized = JSON.stringify(outputObj, null, '\t') + '\n';
	const outputEntryCount = Object.keys(outputObj).length;
	for (const outPath of opts.outputMapPaths) {
		writeFileSync(outPath, serialized);
		log.info(`  ✓ emitted ${outPath} (${outputEntryCount} entries)`);
	}
	log.info('');

	return idMap;
}

function parseCliArgs(argv: readonly string[]): {
	sourceRoot?: string;
	dryRun: boolean;
	reset: boolean;
	preserveIdsFromMap: boolean;
} {
	let sourceRoot: string | undefined;
	let dryRun = false;
	let reset = false;
	let preserveIdsFromMap = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--dry-run') dryRun = true;
		else if (arg === '--reset') reset = true;
		else if (arg === '--preserve-ids-from-map') preserveIdsFromMap = true;
		else if (arg === '--source' && i + 1 < argv.length) {
			sourceRoot = argv[i + 1];
			i++;
		}
	}
	return { sourceRoot, dryRun, reset, preserveIdsFromMap };
}

async function main(): Promise<void> {
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const { sourceRoot: cliSource, dryRun, reset, preserveIdsFromMap } = parseCliArgs(
		process.argv.slice(2),
	);

	const manifestPath = joinPath(import.meta.dir, '..', 'fixtures', 'assets-manifest.json');
	const manifestJson = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
	const manifest = parseManifest(manifestJson);

	// Monorepo-aware default: scripts/ lives at apps/cms/scripts/; the web app's
	// static dir is at apps/web/static/. Manifest sourceRoot is "apps/web/static"
	// so that joinPath(sourceRoot, legacyPath) → "apps/web/static/images/<rest>".
	const defaultSource = resolvePath(import.meta.dir, '..', '..', 'web', 'static');
	const sourceRoot = cliSource ? resolvePath(cliSource) : defaultSource;

	if (!existsSync(sourceRoot)) {
		throw new Error(
			`[migrate] source directory not found: ${sourceRoot}\n` +
				`  Pass --source <path> if the apps/web/static directory isn't at the default location.`,
		);
	}

	// GH #40: emit to both apps/cms (authoritative) AND packages/shared (mirror)
	// in one pass — eliminates the post-migrate manual `cp` step + drift risk.
	const outputMapPaths = [
		joinPath(import.meta.dir, '..', 'fixtures', 'assets-id-map.json'),
		resolvePath(
			import.meta.dir,
			'..',
			'..',
			'..',
			'packages',
			'shared',
			'fixtures',
			'assets-id-map.json',
		),
	];

	let preserveIds: Map<string, string> | undefined;
	if (preserveIdsFromMap) {
		if (!existsSync(outputMapPaths[0])) {
			throw new Error(`[migrate] id map not found: ${outputMapPaths[0]}`);
		}
		const idMapJson = JSON.parse(readFileSync(outputMapPaths[0], 'utf8')) as Record<string, unknown>;
		preserveIds = desiredIdsForManifest(manifest, idMapJson);
		log.info(`preserving ${preserveIds.size} file ids from ${outputMapPaths[0]}`);
	}

	const token = dryRun ? 'dry-run' : await getAdminTokenLib(directusUrl);

	await migrateAssets(manifest, {
		directusUrl,
		token,
		sourceRoot,
		outputMapPaths,
		dryRun,
		reset,
		preserveIds,
	});
	log.info('');
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[migrate] FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}

// Dev-surface helpers — not for CLI. Re-exported for tests.
export { relative as relativePath };
