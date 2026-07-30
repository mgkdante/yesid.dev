import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd(), '../..');
const VENDOR = resolve(process.cwd(), 'vendor/design');
const PACKAGES = ['tokens', 'motion', 'gates', 'seo-kit', 'ui', 'analytics', 'i18n-core'] as const;

const PINNED_RELEASE = {
	tag: 'v0.13.0',
	tagObject: '1d86331a512a87cc321ecd20f5f27e18dcf5f6e7',
	peeledCommit: 'eaf1b302421a103652a54b0e631b2fe09e55cb65',
	assetName: 'yesid.dev-design-v0.13.0.tar',
	assetSize: 839_680,
	assetDigest: 'sha256:9d8883abbd6e232ae345228e012acb1f450ac7b871bd37f9b17e3527e9be8fdd',
	exclusionPolicyDigest: 'sha256:4f709f3409292c0971728a7f9cddb4ce06b8c354eed46cd5832e626b83af4300',
	toolDigest: 'sha256:650011070755661770506f51bc07f99ba6905fc62a573a4fcf0b668c00cbe2b8',
	treeHash: 'sha256:250bb133292d687ca0249cb21426c8194e4bbf84b0f223382a03e7422e73767f',
	manifestDigest: 'f54004437e9e6e7f035fc24afd6ed09946adabb2f4e7d8e5f3caaa712ce7c3fb',
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
		const rawManifest = readFileSync(join(VENDOR, 'manifest.json'));
		expect(createHash('sha256').update(rawManifest).digest('hex')).toBe(PINNED_RELEASE.manifestDigest);
		expect(walkFiles(join(VENDOR, 'i18n-core')).map((path) => relative(VENDOR, path))).toEqual([
			'i18n-core/package.json',
			'i18n-core/src/index.ts',
			'i18n-core/src/routing.ts',
			'i18n-core/tsconfig.json',
		]);
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

	it('resolves every consumed design package through the vendored customer boundary', () => {
		const appPackage = readJson(join(process.cwd(), 'package.json')) as {
			dependencies: Record<string, string>;
			devDependencies: Record<string, string>;
		};
		expect(appPackage.dependencies['@yesid/i18n-core']).toBe('file:vendor/design/i18n-core');
		expect(appPackage.dependencies['@yesid/motion']).toBe('file:vendor/design/motion');
		expect(appPackage.dependencies['@yesid/seo-kit']).toBe('file:vendor/design/seo-kit');
		expect(appPackage.dependencies['@yesid/tokens']).toBe('file:vendor/design/tokens');
		expect(appPackage.dependencies['@yesid/ui']).toBe('file:vendor/design/ui');
		expect(appPackage.devDependencies['@yesid/gates']).toBe('file:vendor/design/gates');
		expect(appPackage.dependencies['@yesid/analytics']).toBeUndefined();
		expect(appPackage.devDependencies['@yesid/analytics']).toBeUndefined();
		expect(existsSync(join(VENDOR, 'ui/src/brand/QuietModeButton.svelte'))).toBe(true);
	});

	it('delegates neutral SEO mechanics while product policy stays consumer-owned', () => {
		const boundaries = [
			['src/routes/sitemap.xml/+server.ts', "from '@yesid/seo-kit/sitemap'"],
			['src/lib/adapters/jsonld.ts', "from '@yesid/seo-kit/jsonld'"],
			['src/lib/og/render.ts', "from '@yesid/seo-kit/satori'"],
			['src/tests/sitemap-coverage.test.ts', "from '@yesid/gates'"],
			['src/tests/og-coverage.test.ts', "from '@yesid/gates'"],
		] as const;

		for (const [path, boundary] of boundaries) {
			expect(readFileSync(join(process.cwd(), path), 'utf8'), path).toContain(boundary);
		}
		expect(readFileSync(join(process.cwd(), 'src/lib/og/render.ts'), 'utf8')).not.toContain(
			"import satori from 'satori'",
		);
	});

	it('keeps the consumer-owned Satori peer on the byte-parity version', () => {
		const rootPackage = readJson(join(ROOT, 'package.json')) as {
			overrides: Record<string, string>;
		};
		expect(rootPackage.overrides.satori).toBe('0.10.14');
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
