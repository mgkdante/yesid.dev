import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Schema-shape assertions on `infra/directus/snapshot.yaml` — catches drift
 * when someone edits the snapshot by hand (or when `directus schema snapshot`
 * produces a shape that diverges from what the yesid.dev adapter expects).
 *
 * These assertions are the CMS-side half of the adapter-seam contract:
 * the yesid.dev adapter expects `services` + `services_translations` +
 * `services_deliverables` + `services_sections` + their translation junctions
 * with specific field names. Drift on the CMS side fails CI here BEFORE it
 * reaches the consumer.
 *
 * Scope: repo-local. Reads the snapshot YAML as a text file, parses it, and
 * asserts structural properties. No network. No live Directus.
 */

interface SnapshotCollection {
	collection: string;
	meta?: unknown;
	schema?: unknown;
}

interface SnapshotField {
	collection: string;
	field: string;
	type: string;
}

interface SnapshotRelation {
	collection: string;
	field: string;
	related_collection?: string;
}

interface Snapshot {
	version: number;
	directus: string;
	vendor: string;
	collections: readonly SnapshotCollection[];
	fields: readonly SnapshotField[];
	relations: readonly SnapshotRelation[];
}

function loadSnapshot(): Snapshot {
	const path = join(import.meta.dir, '..', 'infra', 'directus', 'snapshot.yaml');
	const text = readFileSync(path, 'utf8');
	return parseYaml(text) as Snapshot;
}

describe('infra/directus/snapshot.yaml — parseable', () => {
	it('parses as valid YAML', () => {
		expect(() => loadSnapshot()).not.toThrow();
	});

	it('pins to Directus 11.17.x (no silent version drift)', () => {
		const snap = loadSnapshot();
		expect(snap.directus).toMatch(/^11\.17\./);
	});

	it('pins vendor to postgres', () => {
		const snap = loadSnapshot();
		expect(snap.vendor).toBe('postgres');
	});

	it('has a numeric version field (not a string)', () => {
		const snap = loadSnapshot();
		expect(typeof snap.version).toBe('number');
	});
});

describe('infra/directus/snapshot.yaml — collections present', () => {
	// Post-Task-6: services domain tree must exist. Future tasks add projects,
	// blog, tech_stack, meta, pages — add collection names here as each task
	// lands.
	const REQUIRED_USER_COLLECTIONS = [
		'services',
		'services_translations',
	] as const;

	it('includes every required user collection', () => {
		const snap = loadSnapshot();
		const present = new Set(snap.collections.map((c) => c.collection));
		for (const name of REQUIRED_USER_COLLECTIONS) {
			expect(present.has(name)).toBe(true);
		}
	});

	it('includes the built-in `languages` collection (created by the Translations interface)', () => {
		const snap = loadSnapshot();
		const present = new Set(snap.collections.map((c) => c.collection));
		expect(present.has('languages')).toBe(true);
	});
});

describe('infra/directus/snapshot.yaml — services field contract', () => {
	// yesid.dev's directus.ts adapter reads these exact field names. If the
	// snapshot drifts (someone renames a field in Data Studio without updating
	// the adapter), this test catches it BEFORE the consumer PR merges.
	const REQUIRED_SERVICES_FIELDS = [
		'id',
		'station',
		'lottie_reverse',
		'visible',
		'related_projects',
		'stack',
	] as const;

	it('services collection has every field the adapter reads', () => {
		const snap = loadSnapshot();
		const servicesFields = new Set(
			snap.fields
				.filter((f) => f.collection === 'services')
				.map((f) => f.field),
		);
		for (const field of REQUIRED_SERVICES_FIELDS) {
			expect(servicesFields.has(field)).toBe(true);
		}
	});

	it('services_translations has languages_code + localizable fields', () => {
		const snap = loadSnapshot();
		const fields = new Set(
			snap.fields
				.filter((f) => f.collection === 'services_translations')
				.map((f) => f.field),
		);
		expect(fields.has('languages_code')).toBe(true);
		expect(fields.has('title')).toBe(true);
		expect(fields.has('description')).toBe(true);
	});
});

describe('infra/directus/snapshot.yaml — consistency', () => {
	it('every relation references a real collection', () => {
		const snap = loadSnapshot();
		const collections = new Set(snap.collections.map((c) => c.collection));
		for (const r of snap.relations) {
			expect(collections.has(r.collection)).toBe(true);
			if (r.related_collection) {
				expect(collections.has(r.related_collection)).toBe(true);
			}
		}
	});

	it('every field references a real collection', () => {
		const snap = loadSnapshot();
		const collections = new Set(snap.collections.map((c) => c.collection));
		for (const f of snap.fields) {
			expect(collections.has(f.collection)).toBe(true);
		}
	});
});
