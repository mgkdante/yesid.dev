#!/usr/bin/env bun
/**
 * CI counterpart of the pre-commit content guard (.githooks/pre-commit GUARD 2).
 *
 * Hooks are opt-in on fresh clones (`bun run setup:hooks`), so the pre-commit
 * SHA-256 check alone cannot stop a hand-edited generated module from reaching
 * a PR. This script re-runs the same verification hermetically (no network, no
 * git) so web.yml can enforce it on every PR:
 *
 *   1. Every *.ts under apps/web/src/lib/content/ whose basename is listed in
 *      generated.manifest.json must hash (SHA-256) to its recorded value.
 *   2. Every listed manifest entry must exist on disk (a deleted module needs
 *      a real regen, which rewrites the manifest too).
 *   3. Every unlisted *.ts carrying the generated header marker in its first
 *      400 bytes is a hand-created/renamed generated file — rejected.
 *   4. The manifest must not record `source: "cache"`: a cache-fallback emit
 *      rewrites modules and manifest consistently, so hashes alone cannot tell
 *      a stale snapshot from a live export; the provenance field can. Re-run
 *      export:fallbacks against the dev CMS before committing.
 *
 * Companions (*.companion.ts), tests (*.test.ts), index.ts and other
 * code-owned files are unlisted and carry no marker, so they pass untouched.
 *
 * Run: `bun run ci:content` (root) / `bun scripts/verify-content-manifest.ts`.
 * Exit 0 = clean; exit 1 = violations listed on stderr.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	GENERATED_HEADER_MARKER,
	hashContent,
	loadManifest,
} from './lib/generated-manifest';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CONTENT_DIR = resolve(SCRIPT_DIR, '../../web/src/lib/content');

export interface ContentVerification {
	/** Files checked against a manifest hash. */
	verified: string[];
	/** Human-readable violations; empty means the guard passes. */
	violations: string[];
}

/** Pure-ish core (reads the given dir only) shared by CLI and tests. */
export async function verifyContentDir(contentDir: string): Promise<ContentVerification> {
	const violations: string[] = [];
	const verified: string[] = [];

	const manifest = await loadManifest(contentDir);
	if (!manifest) {
		return {
			verified,
			violations: [
				`generated.manifest.json is missing or malformed under ${contentDir}. ` +
					'Run `bun run --cwd apps/cms export:fallbacks` and commit the result.',
			],
		};
	}

	// Provenance guard: a cache-fallback emit is internally consistent (hashes
	// match), so only the recorded source distinguishes it from a live export.
	// Absent field = live (manifests written before the field existed).
	if (manifest.source === 'cache') {
		violations.push(
			'generated.manifest.json records source "cache": the committed content modules were emitted ' +
				'from the .cms-cache.json fallback, not a live CMS export. Re-run ' +
				'`bun run --cwd apps/cms export:fallbacks` against the dev CMS and commit the result.',
		);
	}

	const entries = await readdir(contentDir, { withFileTypes: true });
	const onDisk = new Set(
		entries.filter((e) => e.isFile() && e.name.endsWith('.ts')).map((e) => e.name),
	);

	for (const [base, recorded] of Object.entries(manifest.files)) {
		if (!onDisk.has(base)) {
			violations.push(
				`${base}: listed in generated.manifest.json but missing on disk. ` +
					'A real regen (export:fallbacks) updates the manifest and the modules together.',
			);
			continue;
		}
		const content = await readFile(resolve(contentDir, base), 'utf8');
		const actual = hashContent(content);
		if (actual !== recorded) {
			violations.push(
				`${base}: SHA-256 mismatch (hand-edit?). recorded=${recorded} actual=${actual}. ` +
					'The CMS is the source of truth: edit the dev CMS, run export:fallbacks, commit both.',
			);
		} else {
			verified.push(base);
		}
	}

	for (const base of onDisk) {
		if (base in manifest.files) continue;
		const content = await readFile(resolve(contentDir, base), 'utf8');
		if (content.slice(0, 400).includes(GENERATED_HEADER_MARKER)) {
			violations.push(
				`${base}: carries the generated header but is not in generated.manifest.json. ` +
					'Generated modules must come from export:fallbacks, which registers them.',
			);
		}
	}

	return { verified, violations };
}

async function main(): Promise<void> {
	const dirArg = process.argv.find((a) => a.startsWith('--content-dir='));
	const contentDir = dirArg ? resolve(dirArg.slice('--content-dir='.length)) : DEFAULT_CONTENT_DIR;

	const { verified, violations } = await verifyContentDir(contentDir);
	if (violations.length > 0) {
		console.error(`[ci:content] FAILED: ${violations.length} violation(s) in ${contentDir}`);
		for (const v of violations) console.error(`  - ${v}`);
		process.exit(1);
	}
	console.log(
		`[ci:content] OK: ${verified.length} generated module(s) match generated.manifest.json.`,
	);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[ci:content] FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
