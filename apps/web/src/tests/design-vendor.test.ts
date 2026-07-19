import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd(), '../..');
const VENDOR = resolve(process.cwd(), 'vendor/design');
const PACKAGES = ['tokens', 'motion', 'gates', 'ui'] as const;

const PINNED_RELEASE = {
	tag: 'v0.7.1',
	tagObject: 'a4e50ea2662765ba70f44f21701ba29023025974',
	peeledCommit: 'c0188172f07e6c4238b3397aa7e1b0d4ff154ee9',
	assetName: 'yesid.dev-design-v0.7.1.tar',
	assetSize: 3_491_840,
	assetDigest: 'sha256:edcdd687d515b3bb0af30da13bc5eaf4af0240c6489df2bfcacfa1c73d422f5f',
	exclusionPolicyDigest: 'sha256:4f709f3409292c0971728a7f9cddb4ce06b8c354eed46cd5832e626b83af4300',
	toolDigest: 'sha256:d27659e78f6464654875b233cf223d6a599ca377d8eaec9a89917cfcd8a6463c',
	treeHash: 'sha256:f8fdb98957a2449bf4678e3c6126ce5b529b9a2756ee37de98555493d331b8f4',
} as const;

function readJson(path: string) {
	return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function walkFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir).sort()) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) walkFiles(path, out);
		else out.push(path);
	}
	return out;
}

describe('immutable design customer contract', () => {
	it('pins the exact schema-2 Release provenance and complete package closure', () => {
		const manifest = readJson(join(VENDOR, 'manifest.json'));

		expect(manifest).toEqual({
			schema: 2,
			repository: 'github.com/mgkdante/yesid.dev-design',
			provenance: {
				mode: 'release',
				tag: {
					name: PINNED_RELEASE.tag,
					object: PINNED_RELEASE.tagObject,
					peeledCommit: PINNED_RELEASE.peeledCommit,
				},
				asset: {
					name: PINNED_RELEASE.assetName,
					size: PINNED_RELEASE.assetSize,
					digest: PINNED_RELEASE.assetDigest,
				},
			},
			packages: PACKAGES,
			exclusionPolicyDigest: PINNED_RELEASE.exclusionPolicyDigest,
			toolDigest: PINNED_RELEASE.toolDigest,
			treeHash: PINNED_RELEASE.treeHash,
		});
	});

	it('keeps upstream package internals out of the consumer workspace and test authority', () => {
		for (const name of PACKAGES) {
			expect(existsSync(join(ROOT, 'packages', name)), name).toBe(false);
		}
		expect(existsSync(join(ROOT, 'packages/shared'))).toBe(true);
		expect(existsSync(join(VENDOR, 'tools/adopt.ts'))).toBe(true);

		const retainedTests = PACKAGES.flatMap((name) =>
			walkFiles(join(VENDOR, name))
				.map((path) => relative(VENDOR, path))
				.filter((path) => /(?:^|\/)(?:__tests__|test-fixtures)(?:\/|$)|(?:^|\/)vitest\.|\.(?:test|spec)\.[^.]+$/.test(path)),
		);
		expect(retainedTests).toEqual([]);
	});

	it('resolves every design package through the vendored customer boundary', () => {
		const appPackage = readJson(join(process.cwd(), 'package.json')) as {
			dependencies: Record<string, string>;
			devDependencies: Record<string, string>;
		};
		expect(appPackage.dependencies['@yesid/motion']).toBe('file:vendor/design/motion');
		expect(appPackage.dependencies['@yesid/tokens']).toBe('file:vendor/design/tokens');
		expect(appPackage.dependencies['@yesid/ui']).toBe('file:vendor/design/ui');
		expect(appPackage.devDependencies['@yesid/gates']).toBe('file:vendor/design/gates');
	});

	it('runs only consumer-owned tests and direct integrity in CI', () => {
		const rootPackage = readJson(join(ROOT, 'package.json')) as {
			scripts: Record<string, string>;
		};
		const workflow = readFileSync(join(ROOT, '.github/workflows/web.yml'), 'utf8');

		expect(rootPackage.scripts.test).toBe('turbo run test');
		expect(workflow).toContain('bun vendor/design/tools/adopt.ts --check --dest vendor/design');
		for (const name of PACKAGES) {
			expect(workflow).not.toContain(`packages/${name} test`);
		}
	});
});
