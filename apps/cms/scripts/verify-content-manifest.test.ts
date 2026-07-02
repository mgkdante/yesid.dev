import { describe, expect, it } from 'bun:test';
import { mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	GENERATED_HEADER_MARKER,
	hashContent,
	writeManifest,
} from './lib/generated-manifest';
import { verifyContentDir } from './verify-content-manifest';

const GENERATED_HEADER = `// ----------------------------------------------------------------------\n// ${GENERATED_HEADER_MARKER}\n// ----------------------------------------------------------------------\n`;

async function makeContentDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), 'ci-content-'));
	const navContent = `${GENERATED_HEADER}\nexport const nav = [];\n`;
	const heroCompanion = `// code-owned companion, no marker\nexport const heroExtras = 1;\n`;
	await writeFile(join(dir, 'nav.ts'), navContent, 'utf8');
	await writeFile(join(dir, 'hero.companion.ts'), heroCompanion, 'utf8');
	await writeManifest(dir, { 'nav.ts': hashContent(navContent) });
	return dir;
}

describe('verifyContentDir', () => {
	it('passes when every listed module hashes to its recorded value', async () => {
		const dir = await makeContentDir();
		try {
			const { verified, violations } = await verifyContentDir(dir);
			expect(violations).toEqual([]);
			expect(verified).toEqual(['nav.ts']);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('flags a hand-edited module (hash mismatch)', async () => {
		const dir = await makeContentDir();
		try {
			await writeFile(join(dir, 'nav.ts'), `${GENERATED_HEADER}\nexport const nav = ['edited'];\n`, 'utf8');
			const { violations } = await verifyContentDir(dir);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toContain('nav.ts: SHA-256 mismatch');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('flags a listed module that was deleted from disk', async () => {
		const dir = await makeContentDir();
		try {
			await unlink(join(dir, 'nav.ts'));
			const { violations } = await verifyContentDir(dir);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toContain('nav.ts: listed in generated.manifest.json but missing on disk');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('flags an unlisted file that carries the generated header', async () => {
		const dir = await makeContentDir();
		try {
			await writeFile(join(dir, 'sneaky.ts'), `${GENERATED_HEADER}\nexport const sneaky = 1;\n`, 'utf8');
			const { violations } = await verifyContentDir(dir);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toContain('sneaky.ts: carries the generated header');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('ignores code-owned files without marker or manifest entry', async () => {
		const dir = await makeContentDir();
		try {
			await writeFile(join(dir, 'index.ts'), `export * from './nav';\n`, 'utf8');
			const { violations } = await verifyContentDir(dir);
			expect(violations).toEqual([]);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('fails loudly when the manifest itself is missing', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'ci-content-nomanifest-'));
		try {
			const { violations } = await verifyContentDir(dir);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toContain('generated.manifest.json is missing or malformed');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
