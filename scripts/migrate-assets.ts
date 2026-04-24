#!/usr/bin/env bun
/**
 * Migrate yesid.dev's `static/images/*` tree into Directus-managed R2 storage.
 *
 * Slice 18 Task 9. Runs ONCE per environment (idempotent on re-run — existing
 * files with matching `legacy_path` entries in `directus_files.description`
 * are skipped; only new ones upload). Emits `fixtures/assets-id-map.json`
 * mapping each legacy path to the uploaded Directus file UUID — consumed by
 * Tasks 10–14 when content-type seed scripts reference images.
 *
 * Strategy:
 *   1. Load `fixtures/assets-manifest.json` + Zod-validate.
 *   2. Auth to Directus (static token or email/password).
 *   3. Ensure target folders exist — create any missing ones.
 *   4. For each manifest entry, upload the file from `<source>/<legacyPath>`
 *      with title + description + folder metadata. Skip if `legacyPath`
 *      already exists in the destination (matched via a tag search).
 *   5. Emit `fixtures/assets-id-map.json` with the legacyPath → file UUID map.
 *
 * Usage:
 *   bun run migrate:assets
 *   bun run migrate:assets -- --source ../yesid.dev/static/images --dry-run
 *
 * CLI flags:
 *   --source <path>   Source root on disk (default: ../yesid.dev/static/images)
 *   --dry-run         Skip uploads; print what WOULD happen.
 *
 * Required env:
 *   DIRECTUS_ADMIN_TOKEN  — preferred (skips /auth/login)
 *   OR
 *   DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD
 *   PUBLIC_DIRECTUS_URL   — optional, defaults to https://cms.yesid.dev
 *
 * Pure helpers (`parseManifest`, `resolveSourcePath`, `buildUploadForm`,
 * `mergeExistingFiles`) are exported for tests in
 * `tests/migrate-assets.test.ts` to unit-test without network I/O.
 */

import {
	createDirectus,
	rest,
	staticToken,
	createFolder,
	readFolders,
	readFiles,
	uploadFiles,
} from '@directus/sdk';
import { z } from 'zod';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath, join as joinPath, relative } from 'node:path';

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
 * Partition manifest entries into { alreadyUploaded, toUpload } by matching
 * each entry's `legacyPath` against existing files' `description` (we embed
 * the source legacy path in description's leading tag for idempotency).
 *
 * Tag convention: description starts with `[legacy:<path>] ` when uploaded by
 * this script. Re-runs skip matched entries and only process new ones.
 */
export function mergeExistingFiles(
	manifest: AssetsManifest,
	existingFiles: ReadonlyArray<{ id: string; description: string | null }>,
): { alreadyUploaded: Map<string, string>; toUpload: AssetEntry[] } {
	const tagRe = /^\[legacy:([^\]]+)\]/;
	const byLegacy = new Map<string, string>();
	for (const f of existingFiles) {
		const match = f.description?.match(tagRe);
		if (match) byLegacy.set(match[1] ?? '', f.id);
	}
	const toUpload: AssetEntry[] = [];
	const alreadyUploaded = new Map<string, string>();
	for (const entry of manifest.assets) {
		const existingId = byLegacy.get(entry.legacyPath);
		if (existingId) {
			alreadyUploaded.set(entry.legacyPath, existingId);
		} else {
			toUpload.push(entry);
		}
	}
	return { alreadyUploaded, toUpload };
}

/**
 * Build the descriptive tag + description string embedded into the Directus
 * file record. Keeping the legacy path in description is the idempotency
 * marker (see mergeExistingFiles above) and also lets Data Studio users see
 * where an asset came from at a glance.
 */
export function buildFileDescription(entry: AssetEntry): string {
	return `[legacy:${entry.legacyPath}] ${entry.description}`;
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

// --- Directus I/O (only exercised by CLI entrypoint) -----------------------

interface MigrateOptions {
	directusUrl: string;
	token: string;
	sourceRoot: string;
	outputMapPath: string;
	dryRun: boolean;
}

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

interface DirectusFolder {
	id: string;
	name: string;
	parent: string | null;
}

interface DirectusFile {
	id: string;
	description: string | null;
	folder: string | null;
}

async function ensureFolders(
	client: ReturnType<typeof createClient>,
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
		console.log(`[migrate] created folder: ${name} (${created.id})`);
	}
	return byName;
}

function createClient(directusUrl: string, token: string) {
	return createDirectus(directusUrl).with(staticToken(token)).with(rest());
}

async function uploadOne(
	client: ReturnType<typeof createClient>,
	entry: AssetEntry,
	folderId: string,
	sourceRoot: string,
): Promise<string> {
	const absPath = resolveSourcePath(entry, sourceRoot);
	const bytes = readFileSync(absPath);
	const form = new FormData();
	form.append('folder', folderId);
	form.append('title', entry.title);
	form.append('description', buildFileDescription(entry));
	form.append('tags', JSON.stringify(['slice-18-migrated']));
	const filename = entry.legacyPath.split('/').pop() ?? entry.legacyPath;
	const blob = new Blob([bytes as unknown as BlobPart]);
	form.append('file', blob, filename);
	const uploaded = (await client.request(uploadFiles(form))) as DirectusFile;
	return uploaded.id;
}

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

	console.log(`[migrate] manifest: ${manifest.assets.length} assets`);
	console.log(`[migrate] source:   ${opts.sourceRoot}`);
	console.log(`[migrate] target:   ${opts.directusUrl}`);

	if (opts.dryRun) {
		console.log('\n[migrate] DRY RUN — no uploads will happen.\n');
		for (const entry of manifest.assets) {
			console.log(
				`  would upload: ${entry.legacyPath.padEnd(40)}  → folder="${entry.folder}"  title="${entry.title}"`,
			);
		}
		return new Map();
	}

	const client = createClient(opts.directusUrl, opts.token);

	// Ensure folders exist + collect their Directus IDs.
	const folderIds = await ensureFolders(
		client,
		Object.keys(manifest.folders),
	);

	// Read existing files — used for idempotency check.
	const existingFiles = (await client.request(
		readFiles({ fields: ['id', 'description', 'folder'], limit: -1 }),
	)) as DirectusFile[];
	const { alreadyUploaded, toUpload } = mergeExistingFiles(
		manifest,
		existingFiles.map((f) => ({ id: f.id, description: f.description })),
	);

	if (alreadyUploaded.size > 0) {
		console.log(
			`[migrate] skipping ${alreadyUploaded.size} already-uploaded assets (matched by description tag).`,
		);
	}
	console.log(`[migrate] uploading ${toUpload.length} new assets...\n`);

	const idMap = new Map<string, string>(alreadyUploaded);
	for (const entry of toUpload) {
		const folderId = folderIds.get(entry.folder);
		if (!folderId) {
			throw new Error(
				`[migrate] folder "${entry.folder}" was not created — check ensureFolders().`,
			);
		}
		const fileId = await uploadOne(client, entry, folderId, opts.sourceRoot);
		idMap.set(entry.legacyPath, fileId);
		console.log(
			`  ✓ ${entry.legacyPath.padEnd(40)}  →  ${fileId}  (folder=${entry.folder})`,
		);
	}

	// Emit the id-map file. Stable-ordered for diff-friendliness.
	const outputObj: Record<string, string> = {};
	for (const key of [...idMap.keys()].sort()) {
		outputObj[key] = idMap.get(key) ?? '';
	}
	writeFileSync(opts.outputMapPath, JSON.stringify(outputObj, null, '\t') + '\n');
	console.log(
		`\n[migrate] emitted ${opts.outputMapPath} (${idMap.size} entries).`,
	);

	return idMap;
}

function parseCliArgs(argv: readonly string[]): {
	sourceRoot?: string;
	dryRun: boolean;
} {
	let sourceRoot: string | undefined;
	let dryRun = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--dry-run') dryRun = true;
		else if (arg === '--source' && i + 1 < argv.length) {
			sourceRoot = argv[i + 1];
			i++;
		}
	}
	return { sourceRoot, dryRun };
}

async function main(): Promise<void> {
	const directusUrl =
		process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
	const { sourceRoot: cliSource, dryRun } = parseCliArgs(
		process.argv.slice(2),
	);

	const manifestPath = joinPath(import.meta.dir, '..', 'fixtures', 'assets-manifest.json');
	const manifestJson = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
	const manifest = parseManifest(manifestJson);

	// Default source = sibling yesid.dev repo's static/images.
	const defaultSource = resolvePath(
		import.meta.dir,
		'..',
		'..',
		'yesid.dev',
		'static',
		'images',
	);
	const sourceRoot = cliSource
		? resolvePath(cliSource)
		: existsSync(defaultSource)
			? defaultSource
			: resolvePath(import.meta.dir, '..', '..', 'yesid.dev', 'static', 'images');

	if (!existsSync(sourceRoot)) {
		throw new Error(
			`[migrate] source directory not found: ${sourceRoot}\n` +
				`  Pass --source <path> if the yesid.dev sibling repo isn't at the default location.`,
		);
	}

	const outputMapPath = joinPath(
		import.meta.dir,
		'..',
		'fixtures',
		'assets-id-map.json',
	);

	const token = dryRun ? 'dry-run' : await getAdminToken(directusUrl);

	await migrateAssets(manifest, {
		directusUrl,
		token,
		sourceRoot,
		outputMapPath,
		dryRun,
	});
	console.log('\n[migrate] done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[migrate] FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}

// Dev-surface helpers — not for CLI. Re-exported for tests.
export { relative as relativePath };
