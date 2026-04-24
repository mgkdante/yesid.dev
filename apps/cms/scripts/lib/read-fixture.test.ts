import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { z } from 'zod';
import { readFixture } from './read-fixture';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';

describe('scripts/lib/read-fixture.ts', () => {
	let dir: string;
	let validPath: string;
	let invalidJsonPath: string;
	let invalidShapePath: string;

	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), 'read-fixture-test-'));
		validPath = join(dir, 'valid.json');
		invalidJsonPath = join(dir, 'invalid.json');
		invalidShapePath = join(dir, 'shape.json');
		writeFileSync(validPath, JSON.stringify({ id: 'x', n: 3 }));
		writeFileSync(invalidJsonPath, '{ not json');
		writeFileSync(invalidShapePath, JSON.stringify({ id: 'y' }));
	});

	afterAll(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	const schema = z.object({ id: z.string(), n: z.number() });

	it('loads + validates a good fixture', async () => {
		const data = await readFixture(validPath, schema);
		expect(data).toEqual({ id: 'x', n: 3 });
	});

	it('throws when file missing', async () => {
		await expect(readFixture(join(dir, 'nope.json'), schema)).rejects.toThrow(
			/file not found/,
		);
	});

	it('throws on invalid JSON', async () => {
		await expect(readFixture(invalidJsonPath, schema)).rejects.toThrow(
			/invalid JSON/,
		);
	});

	it('throws with issue detail on schema mismatch', async () => {
		await expect(readFixture(invalidShapePath, schema)).rejects.toThrow(/n/);
	});
});
