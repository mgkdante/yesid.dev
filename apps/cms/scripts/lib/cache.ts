/**
 * Cache layer for the export-fallbacks pipeline.
 *
 * Writes a snapshot of the last successful fetch to a single JSON file beside
 * the generated TS modules. When the next run can't reach Directus, reads
 * the snapshot and emits TS from it — keeping `bun run prebuild` non-fatal
 * during transient CMS outages.
 *
 * The cache is meant to be ephemeral: it's gitignored, regenerated on every
 * successful run, and can be deleted at any time (a fresh build will recreate
 * it OR exit-0-without-emitting if both CMS and cache are unavailable).
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ExportData } from '../export-data';

interface CacheEnvelope {
	/** Schema version of the envelope. Bump if `data` shape changes. */
	version: '1';
	/** ISO timestamp when this cache was written. */
	writtenAt: string;
	/** Directus URL the snapshot was taken from (for debugging). */
	directusUrl: string;
	/** The fetched + validated ExportData. */
	data: ExportData;
}

export async function readCache(path: string): Promise<ExportData | null> {
	if (!existsSync(path)) return null;
	try {
		const raw = await readFile(path, 'utf8');
		const parsed = JSON.parse(raw) as CacheEnvelope;
		if (parsed.version !== '1') {
			throw new Error(`unsupported cache version: ${String(parsed.version)}`);
		}
		return parsed.data;
	} catch (err) {
		throw new Error(`[cache] failed to read ${path}: ${(err as Error).message}`);
	}
}

export async function writeCache(
	path: string,
	data: ExportData,
	directusUrl: string,
): Promise<void> {
	const envelope: CacheEnvelope = {
		version: '1',
		writtenAt: new Date().toISOString(),
		directusUrl,
		data,
	};
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(envelope, null, '\t') + '\n', 'utf8');
}
