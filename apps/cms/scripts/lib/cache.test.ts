import { describe, expect, it, beforeEach, afterAll } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCache, writeCache } from './cache';
import type { ExportData } from '../export-data';

const FIXTURE: ExportData = {
	siteMeta: {
		name: 'yesid.',
		tagline: { en: 'Hello' },
		description: { en: 'Hi there.' },
		links: { email: 'a@b', github: 'gh' },
		owner: {
			name: 'Y',
			jobTitle: { en: 'Engineer' },
			address: { locality: 'M', region: 'Q', country: 'C' },
			knowsAbout: ['x'],
		},
	},
	morphShapes: [
		{ id: 'a', label: 'A', path: 'p', viewbox: '0 0 1 1', sort: 1 },
	],
};

const tmpDirs: string[] = [];

async function tmp(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), 'cms-cache-test-'));
	tmpDirs.push(dir);
	return dir;
}

afterAll(async () => {
	await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe('cache', () => {
	it('readCache returns null when file does not exist', async () => {
		const dir = await tmp();
		const result = await readCache(join(dir, 'nonexistent.json'));
		expect(result).toBeNull();
	});

	it('writeCache then readCache round-trips ExportData', async () => {
		const dir = await tmp();
		const path = join(dir, '.cms-cache.json');
		await writeCache(path, FIXTURE, 'https://cms.example');
		const read = await readCache(path);
		expect(read).toEqual(FIXTURE);
	});

	it('writeCache creates parent directories if needed', async () => {
		const dir = await tmp();
		const path = join(dir, 'nested', 'deep', '.cms-cache.json');
		await writeCache(path, FIXTURE, 'https://cms.example');
		const read = await readCache(path);
		expect(read).not.toBeNull();
	});

	it('readCache throws on malformed JSON', async () => {
		const dir = await tmp();
		const path = join(dir, '.cms-cache.json');
		await Bun.write(path, 'not json {');
		expect(readCache(path)).rejects.toThrow(/failed to read/);
	});

	it('readCache throws on unsupported version', async () => {
		const dir = await tmp();
		const path = join(dir, '.cms-cache.json');
		await Bun.write(
			path,
			JSON.stringify({ version: '999', writtenAt: '2026-01-01', directusUrl: 'x', data: {} }),
		);
		expect(readCache(path)).rejects.toThrow(/unsupported cache version/);
	});

	it('cache envelope includes writtenAt + directusUrl for debuggability', async () => {
		const dir = await tmp();
		const path = join(dir, '.cms-cache.json');
		await writeCache(path, FIXTURE, 'https://cms.example');
		const raw = await Bun.file(path).text();
		const parsed = JSON.parse(raw) as { writtenAt: string; directusUrl: string };
		expect(parsed.writtenAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(parsed.directusUrl).toBe('https://cms.example');
	});
});
