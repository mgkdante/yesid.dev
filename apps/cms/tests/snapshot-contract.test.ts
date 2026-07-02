/**
 * Snapshot ↔ fetcher contract (2026-07-01 expert sweep, bucket A #1).
 *
 * The committed directus-sync dump (apps/cms/directus/snapshot/) rotted for
 * weeks without any signal: route_seo was absent and 126 of the 148
 * site_labels columns the fetchers read were missing, so a sync:push would
 * have proposed DELETING live schema. Nothing tied the snapshot to the code
 * that depends on it.
 *
 * These tests are that tie. They parse the fetcher sources for the literals
 * they read from Directus and assert each one exists in the committed
 * snapshot:
 *
 *   1. every `ls('<field>')` literal in the site-labels fetcher has a
 *      snapshot field file under fields/site_labels_translations/
 *   2. every `readItems('<collection>')` / `readSingleton('<collection>')`
 *      literal across the fetchers has a snapshot collection file
 *
 * If a fetcher gains a field/collection, `directus-sync pull` against dev
 * (see apps/cms/README) refreshes the snapshot and these stay green. If the
 * snapshot rots again, apps/cms `bun test` goes red in CI instead of a
 * sync:push proposing schema deletions.
 */

import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CMS_ROOT = resolve(import.meta.dir, '..');
const FETCHERS_DIR = join(CMS_ROOT, 'scripts', 'lib', 'fetchers');
const SNAPSHOT_DIR = join(CMS_ROOT, 'directus', 'snapshot');

function fetcherSources(): { name: string; source: string }[] {
	return readdirSync(FETCHERS_DIR)
		.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
		.map((f) => ({ name: f, source: readFileSync(join(FETCHERS_DIR, f), 'utf8') }));
}

function extractAll(source: string, re: RegExp): string[] {
	return [...source.matchAll(re)].map((m) => m[1]!);
}

describe('site-labels fetcher ls() literals exist in the snapshot', () => {
	const source = readFileSync(join(FETCHERS_DIR, 'site-labels.ts'), 'utf8');
	const literals = [...new Set(extractAll(source, /\bls\('([^']+)'\)/g))];

	it('finds the expected scale of literals (sanity: the regex still matches)', () => {
		// 148 at the time of the sweep; assert a floor so a refactor that breaks
		// the regex fails loudly instead of vacuously passing on zero literals.
		expect(literals.length).toBeGreaterThanOrEqual(100);
	});

	it('has a snapshot field file for every literal', () => {
		const fieldsDir = join(SNAPSHOT_DIR, 'fields', 'site_labels_translations');
		const missing = literals.filter((l) => !existsSync(join(fieldsDir, `${l}.json`)));
		expect(missing).toEqual([]);
	});
});

describe('fetcher collection literals exist in the snapshot', () => {
	// Junction/translation tables reached via nested field selections do not
	// appear as readItems() literals; this covers the top-level reads only,
	// which is exactly what rotted (route_seo).
	const literals = new Set<string>();
	for (const { source } of fetcherSources()) {
		for (const c of extractAll(source, /readItems\('([a-z0-9_]+)'/g)) literals.add(c);
		for (const c of extractAll(source, /readSingleton\('([a-z0-9_]+)'/g)) literals.add(c);
	}

	it('finds the expected scale of collections (sanity: the regex still matches)', () => {
		expect(literals.size).toBeGreaterThanOrEqual(10);
	});

	it('has a snapshot collection file for every collection a fetcher reads', () => {
		const collectionsDir = join(SNAPSHOT_DIR, 'collections');
		const missing = [...literals].filter(
			(c) => !existsSync(join(collectionsDir, `${c}.json`)),
		);
		expect(missing).toEqual([]);
	});
});
