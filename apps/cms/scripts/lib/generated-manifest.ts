/**
 * Generated-content manifest: the anchor that lets a pre-commit hook detect
 * hand-edits to the CMS-derived `.ts` modules under apps/web/src/lib/content/.
 *
 * WHY THIS EXISTS
 * ---------------
 * Those modules carry a `GENERATED FILE - do not edit by hand.` header. They
 * are an edge cache of Directus CMS state — `export:fallbacks` regenerates them
 * FROM the CMS on every build, so a hand-edit is silently overwritten on the
 * next prod rebuild (and worse, masks the fact that the CMS was never updated).
 * The CMS is the single source of truth.
 *
 * The export script records the SHA-256 of every module it emits into
 * `generated.manifest.json` (this module's `writeManifest`). The pre-commit
 * guard (.githooks/pre-commit) then verifies that every staged generated `.ts`
 * still hashes to its recorded value: a real regen updates the `.ts` AND the
 * manifest together (commit passes); a hand-edit changes only the `.ts`
 * (hash mismatch → commit blocked, with a pointer back to the CMS).
 *
 * The manifest's `files` keys ARE the authoritative set of generated modules —
 * companions, tests, and `index.ts` are absent because the export script never
 * emits them, so they are never guarded.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Filename of the manifest, written alongside the generated modules. */
export const GENERATED_MANIFEST_FILENAME = 'generated.manifest.json';

/**
 * Marker present in the header of every generated module. Single source of
 * truth for "is this file generated?" — kept in sync with the header emitted by
 * emit-module.ts. The bash hooks grep for this exact string too.
 */
export const GENERATED_HEADER_MARKER = 'GENERATED FILE - do not edit by hand.';

const MANIFEST_NOTE =
	'SHA-256 of each CMS-generated content module, as last emitted by ' +
	'export:fallbacks (apps/cms/scripts/export-fallbacks.ts). The Directus CMS ' +
	'is the source of truth; these .ts files are a regenerated edge cache. ' +
	'DO NOT hand-edit this manifest or the .ts files it lists — edit the CMS and ' +
	're-run `bun run --cwd apps/cms export:fallbacks`. The pre-commit hook ' +
	'(.githooks/pre-commit) blocks any commit where a generated .ts no longer ' +
	'matches its hash here.';

export interface GeneratedManifest {
	/** Human-readable note. JSON has no comments, so this rides as a `//` key. */
	'//': string;
	algorithm: 'sha256';
	/** Map of module basename (e.g. `about-page.ts`) → lowercase hex SHA-256. */
	files: Record<string, string>;
}

/** SHA-256 (lowercase hex) of a UTF-8 string — matches `sha256sum` of the file. */
export function hashContent(content: string): string {
	return createHash('sha256').update(content, 'utf8').digest('hex');
}

/** Absolute path to the manifest for a given content directory. */
export function manifestPath(contentDir: string): string {
	return resolve(contentDir, GENERATED_MANIFEST_FILENAME);
}

/** Reads + parses the manifest; returns null if absent or malformed. */
export async function loadManifest(contentDir: string): Promise<GeneratedManifest | null> {
	try {
		const raw = await readFile(manifestPath(contentDir), 'utf8');
		const parsed = JSON.parse(raw) as GeneratedManifest;
		if (!parsed || typeof parsed !== 'object' || typeof parsed.files !== 'object') {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

/** Builds a manifest object with deterministically sorted `files` keys. */
export function buildManifest(files: Record<string, string>): GeneratedManifest {
	const sorted: Record<string, string> = {};
	for (const key of Object.keys(files).sort()) sorted[key] = files[key];
	return { '//': MANIFEST_NOTE, algorithm: 'sha256', files: sorted };
}

/**
 * Serializes a manifest to its canonical on-disk form (tab-indented, sorted
 * keys, trailing newline). Pure — used by both the writer and tests.
 */
export function serializeManifest(files: Record<string, string>): string {
	return `${JSON.stringify(buildManifest(files), null, '\t')}\n`;
}

/** Writes the manifest for `contentDir` from a basename → hash map. */
export async function writeManifest(
	contentDir: string,
	files: Record<string, string>,
): Promise<void> {
	await writeFile(manifestPath(contentDir), serializeManifest(files), 'utf8');
}
