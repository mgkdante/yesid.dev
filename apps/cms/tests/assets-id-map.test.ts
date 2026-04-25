import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { z } from 'zod';

/**
 * Schema for fixtures/assets-id-map.json — emitted by migrate-assets.ts and
 * consumed by 18e-18i (and packages/shared via re-export).
 */
const AssetsIdMapSchema = z.record(
	z.string().regex(/^images\//),
	z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
);

function loadIdMap(): Record<string, string> {
	const path = joinPath(import.meta.dir, '..', 'fixtures', 'assets-id-map.json');
	return JSON.parse(readFileSync(path, 'utf8'));
}

describe('fixtures/assets-id-map.json', () => {
	it('parses against AssetsIdMapSchema (every key is "images/..." path; every value is UUID)', () => {
		expect(() => AssetsIdMapSchema.parse(loadIdMap())).not.toThrow();
	});

	it('contains exactly 14 entries (matches manifest cardinality)', () => {
		const m = loadIdMap();
		expect(Object.keys(m).length).toBe(14);
	});

	it('keys are sorted alphabetically (diff-friendly)', () => {
		const m = loadIdMap();
		const keys = Object.keys(m);
		const sorted = [...keys].sort();
		expect(keys).toEqual(sorted);
	});

	it('every value is a unique UUID (no duplicates)', () => {
		const m = loadIdMap();
		const ids = Object.values(m);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('contains the metro-svg + headshot + yesid-dev sentinel paths', () => {
		const m = loadIdMap();
		// Use direct key access — toHaveProperty splits on '/' as a path separator
		expect(m['images/montreal-metro.svg']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/about/headshot.webp']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/work/yesid-dev.png']).toMatch(/^[0-9a-f-]{36}$/);
	});
});
