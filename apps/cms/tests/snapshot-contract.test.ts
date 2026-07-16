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
import { ASSET_REGISTRY_COLLECTIONS } from '../scripts/lib/assets/editor-presets';
import { buildAssetRegistryPlan } from '../scripts/setup-asset-registry-schema';

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

describe('site-labels analytics controls exist in the snapshot', () => {
	const fieldNames = ['analytics_enabled', 'analytics_consent_show_banner'] as const;
	const fieldsDir = join(SNAPSHOT_DIR, 'fields', 'site_labels');

	it('commits both required true-default boolean fields with their approved editor copy', () => {
		const missing = fieldNames.filter(
			(field) => !existsSync(join(fieldsDir, `${field}.json`)),
		);
		expect(missing).toEqual([]);

		const snapshots = Object.fromEntries(
			fieldNames.map((field) => [
				field,
				JSON.parse(readFileSync(join(fieldsDir, `${field}.json`), 'utf8')),
			]),
		) as Record<(typeof fieldNames)[number], Record<string, any>>;
		expect(snapshots.analytics_enabled).toMatchObject({
			collection: 'site_labels',
			field: 'analytics_enabled',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				note: 'Master switch. Off disables Plausible tracking, pageviews, conversion events, the consent banner, and footer analytics preferences after the site rebuilds. Stored visitor choices are retained.',
				options: { label: 'Analytics enabled' },
				required: true,
				special: ['cast-boolean'],
			},
			schema: { default_value: true, is_nullable: false },
		});
		expect(snapshots.analytics_consent_show_banner).toMatchObject({
			collection: 'site_labels',
			field: 'analytics_consent_show_banner',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				note: "When analytics is enabled, off starts cookieless Plausible analytics for visitors without a saved decline. Saved declines stay untracked and footer preferences remain available. Use only after confirming the site's legal basis and published privacy notice support this mode.",
				options: { label: 'Show analytics consent banner' },
				required: true,
				special: ['cast-boolean'],
			},
			schema: { default_value: true, is_nullable: false },
		});
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

describe('asset registry plan is captured exactly in the schema snapshot', () => {
	const plan = buildAssetRegistryPlan();
	const expectedCollections = new Map<string, Record<string, unknown>>();
	const expectedFieldPayloads = new Map<string, Map<string, Record<string, unknown>>>(
		ASSET_REGISTRY_COLLECTIONS.map((collection) => [collection, new Map()]),
	);
	const expectedRelationPayloads = new Map<string, Map<string, Record<string, unknown>>>(
		ASSET_REGISTRY_COLLECTIONS.map((collection) => [collection, new Map()]),
	);
	const expectedFields = new Map<string, Set<string>>(
		ASSET_REGISTRY_COLLECTIONS.map((collection) => [collection, new Set<string>()]),
	);
	const expectedRelations = new Map<string, Set<string>>(
		ASSET_REGISTRY_COLLECTIONS.map((collection) => [collection, new Set<string>()]),
	);

	for (const step of plan) {
		if (step.kind === 'collection') {
			const collection = String(step.payload?.collection);
			expectedCollections.set(collection, step.payload!);
			for (const field of (step.payload?.fields ?? []) as Array<Record<string, unknown>>) {
				const fieldName = String(field.field);
				expectedFields.get(collection)?.add(fieldName);
				expectedFieldPayloads.get(collection)?.set(fieldName, field);
			}
		}
		if (step.kind === 'field') {
			const collection = step.path.slice('/fields/'.length);
			const field = String(step.payload?.field);
			expectedFields.get(collection)?.add(field);
			expectedFieldPayloads.get(collection)?.set(field, step.payload!);
		}
		if (step.kind === 'relation') {
			const collection = String(step.payload?.collection);
			const field = String(step.payload?.field);
			expectedRelations.get(collection)?.add(field);
			expectedRelationPayloads.get(collection)?.set(field, step.payload!);
		}
	}

	it('has the five grouped collection snapshots', () => {
		for (const collection of ASSET_REGISTRY_COLLECTIONS) {
			const path = join(SNAPSHOT_DIR, 'collections', `${collection}.json`);
			expect(existsSync(path), collection).toBe(true);
			if (!existsSync(path)) continue;
			const snapshot = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
			const expected = expectedCollections.get(collection)!;
			expect(snapshot).toMatchObject({
				collection,
				meta: { ...(expected.meta as Record<string, unknown>), collection },
				schema: { name: collection },
			});
		}
	});

	it('has exactly the planned field files for every registry collection', () => {
		for (const collection of ASSET_REGISTRY_COLLECTIONS) {
			const directory = join(SNAPSHOT_DIR, 'fields', collection);
			const actual = existsSync(directory)
				? readdirSync(directory)
						.filter((file) => file.endsWith('.json'))
						.map((file) => file.slice(0, -'.json'.length))
						.sort()
				: [];
			expect(actual, collection).toEqual([...expectedFields.get(collection)!].sort());
		}
	});

	it('preserves every planned field type, editor option, validation, and schema constraint', () => {
		for (const collection of ASSET_REGISTRY_COLLECTIONS) {
			for (const [field, expected] of expectedFieldPayloads.get(collection)!) {
				const path = join(SNAPSHOT_DIR, 'fields', collection, `${field}.json`);
				expect(existsSync(path), `${collection}.${field}`).toBe(true);
				if (!existsSync(path)) continue;
				const snapshot = JSON.parse(readFileSync(path, 'utf8')) as {
					collection: string;
					field: string;
					type: string;
					meta: Record<string, unknown>;
					schema: Record<string, unknown> | null;
				};

				expect(snapshot.collection, `${collection}.${field}`).toBe(collection);
				expect(snapshot.field, `${collection}.${field}`).toBe(field);
				expect(snapshot.type, `${collection}.${field}`).toBe(String(expected.type));
				expect(snapshot.meta, `${collection}.${field}`).toMatchObject(
					{ ...(expected.meta as Record<string, unknown>), collection, field },
				);
				if (expected.schema === null) {
					// directus-sync omits schema for alias fields instead of serializing null.
					expect(snapshot.schema ?? null, `${collection}.${field}`).toBeNull();
				} else {
					expect(snapshot.schema, `${collection}.${field}`).toMatchObject(
						{ ...(expected.schema as Record<string, unknown>), name: field, table: collection },
					);
				}
			}
		}
	});

	it('has exactly the planned relation files for every registry collection', () => {
		for (const collection of ASSET_REGISTRY_COLLECTIONS) {
			const directory = join(SNAPSHOT_DIR, 'relations', collection);
			const actual = existsSync(directory)
				? readdirSync(directory)
						.filter((file) => file.endsWith('.json'))
						.map((file) => file.slice(0, -'.json'.length))
						.sort()
				: [];
			expect(actual, collection).toEqual([...expectedRelations.get(collection)!].sort());
		}
	});

	it('preserves every planned relation target, junction option, and delete rule', () => {
		for (const collection of ASSET_REGISTRY_COLLECTIONS) {
			for (const [field, expected] of expectedRelationPayloads.get(collection)!) {
				const path = join(SNAPSHOT_DIR, 'relations', collection, `${field}.json`);
				expect(existsSync(path), `${collection}.${field}`).toBe(true);
				if (!existsSync(path)) continue;
				const snapshot = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
				expect(snapshot, `${collection}.${field}`).toMatchObject({
					collection,
					field,
					related_collection: expected.related_collection,
					meta: {
						...(expected.meta as Record<string, unknown>),
						many_collection: collection,
						many_field: field,
						one_collection: expected.related_collection,
					},
					schema: {
						...(expected.schema as Record<string, unknown>),
						table: collection,
						column: field,
						foreign_key_table: expected.related_collection,
					},
				});
			}
		}
	});
});
