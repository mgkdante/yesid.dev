import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { Window } from 'happy-dom';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd(), '../..');
const VENDOR = resolve(process.cwd(), 'vendor/design');
const PACKAGES = ['tokens', 'motion', 'gates', 'seo-kit', 'ui', 'analytics', 'i18n-core'] as const;
const htmlWindow = new Window({
	settings: {
		disableJavaScriptEvaluation: true,
		disableJavaScriptFileLoading: true,
		disableCSSFileLoading: true,
	},
});

const PINNED_RELEASE = {
	tag: 'v0.22.0',
	tagObject: 'c0956ce81b1912d4a8e5411ff8e0b7235ea76453',
	peeledCommit: '3e817a15a5a1b40740ab7583a58e2b90b34f34ef',
	assetName: 'yesid.dev-design-v0.22.0.tar',
	assetSize: 2_672_640,
	assetDigest: 'sha256:6d8c41f78f144e524e709d427f85e0482e5219e3fbddfb20d2548a866d5112ad',
	exclusionPolicyDigest: 'sha256:4f709f3409292c0971728a7f9cddb4ce06b8c354eed46cd5832e626b83af4300',
	toolDigest: 'sha256:3d688b437650357ca30a5c3e37e64885a2fb4a9b76f37baf5ee554f5f98956f6',
	treeHash: 'sha256:0c9916631dcdcb506cbe860fddd087f6ea523fa06cfa62591161a990dc83c290',
	manifestDigest: 'c26b746eb42b652fea1f3b6f937666b5076bdcec3e5f1bf6af26c0f31aeeca31',
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

interface ModuleUse {
	specifier: string;
	kind: 'static' | 'dynamic';
	typeOnly: boolean;
	bindings: readonly string[];
}

function sourceText(path: string): string {
	const raw = readFileSync(path, 'utf8');
	if (!path.endsWith('.svelte')) return raw;
	return svelteScriptText(raw);
}

function svelteScriptText(raw: string): string {
	const template = htmlWindow.document.createElement('template');
	template.innerHTML = raw;
	return [...template.content.querySelectorAll('script')]
		.map((script) => script.textContent ?? '')
		.join('\n');
}

function sourceFile(path: string): ts.SourceFile {
	return ts.createSourceFile(path, sourceText(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function moduleUses(path: string): readonly ModuleUse[] {
	const uses: ModuleUse[] = [];
	const visit = (node: ts.Node): void => {
		if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
			const clause = node.importClause;
			const named = clause?.namedBindings;
			const bindings = [
				...(clause?.name ? [clause.name.text] : []),
				...(named && ts.isNamespaceImport(named)
					? [named.name.text]
					: named && ts.isNamedImports(named)
						? named.elements.map((element) => element.name.text)
						: []),
			];
			const typeOnly = Boolean(
				clause?.isTypeOnly ||
					(named &&
						ts.isNamedImports(named) &&
						named.elements.length > 0 &&
						named.elements.every((element) => element.isTypeOnly)),
			);
			uses.push({
				specifier: node.moduleSpecifier.text,
				kind: 'static',
				typeOnly,
				bindings,
			});
		}
		if (
			ts.isCallExpression(node) &&
			node.expression.kind === ts.SyntaxKind.ImportKeyword &&
			node.arguments.length === 1 &&
			ts.isStringLiteral(node.arguments[0])
		) {
			uses.push({
				specifier: node.arguments[0].text,
				kind: 'dynamic',
				typeOnly: false,
				bindings: [],
			});
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile(path));
	return uses;
}

function productionSources(): readonly string[] {
	return [join(ROOT, 'apps/web/src'), join(ROOT, 'apps/cms/scripts')]
		.flatMap((dir) => walkFiles(dir))
		.filter((path) => /\.(?:ts|svelte)$/.test(path))
		.filter((path) => !/\.(?:test|spec)\.ts$/.test(path))
		.filter((path) => !/(?:^|\/)tests?(?:\/|$)/.test(path));
}

function relativeProductionPath(path: string): string {
	return relative(ROOT, path).replaceAll('\\', '/');
}

function vendorPath(path: string): string {
	return relative(VENDOR, path).replaceAll('\\', '/');
}

describe('immutable design customer contract', () => {
	it('extracts Svelte script tags without allowing tag casing to bypass the boundary audit', () => {
		expect(
			svelteScriptText(
				'<SCRIPT lang="ts">import { analyticsClient } from "@yesid/analytics/client";</SCRIPT>',
			),
		).toContain('@yesid/analytics/client');
		expect(
			svelteScriptText(
				'<ScRiPt context="module">import { createLocaleRouting } from "@yesid/i18n-core";</sCrIpT >',
			),
		).toContain('@yesid/i18n-core');
	});

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
		expect(walkFiles(join(VENDOR, 'i18n-core')).map(vendorPath)).toEqual([
			'i18n-core/README.md',
			'i18n-core/package.json',
			'i18n-core/src/copy.ts',
			'i18n-core/src/format.ts',
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
				.map(vendorPath)
				.filter((path) => /(?:^|\/)(?:__tests__|test-fixtures)(?:\/|$)|(?:^|\/)vitest\.|\.(?:test|spec)\.[^.]+$/.test(path)),
		);
		expect(retainedTests).toEqual([]);
	});

	it('resolves every consumed design package through the vendored customer boundary', () => {
		const appPackage = readJson(join(process.cwd(), 'package.json')) as {
			dependencies: Record<string, string>;
			devDependencies: Record<string, string>;
		};
		const cmsPackage = readJson(join(ROOT, 'apps/cms/package.json')) as {
			devDependencies: Record<string, string>;
		};
		expect(appPackage.dependencies['@yesid/i18n-core']).toBe('file:vendor/design/i18n-core');
		expect(appPackage.dependencies['@yesid/motion']).toBe('file:vendor/design/motion');
		expect(appPackage.dependencies['@yesid/seo-kit']).toBe('file:vendor/design/seo-kit');
		expect(appPackage.dependencies['@yesid/tokens']).toBe('file:vendor/design/tokens');
		expect(appPackage.dependencies['@yesid/ui']).toBe('file:vendor/design/ui');
		expect(appPackage.devDependencies['@yesid/gates']).toBe('file:vendor/design/gates');
		expect(appPackage.dependencies['@yesid/analytics']).toBe('file:vendor/design/analytics');
		expect(appPackage.devDependencies['@yesid/analytics']).toBeUndefined();
		expect(cmsPackage.devDependencies['@yesid/i18n-core']).toBeUndefined();
		expect(existsSync(join(ROOT, 'apps/cms/vendor/design/i18n-core'))).toBe(false);
		expect(existsSync(join(VENDOR, 'ui/src/brand/QuietModeButton.svelte'))).toBe(true);
	});

	it('keeps production i18n consumers inside the locale-routing boundary', () => {
		const i18nConsumers = productionSources()
			.filter((path) => moduleUses(path).some((use) => use.specifier === '@yesid/i18n-core'))
			.map(relativeProductionPath)
			.sort();
		expect(i18nConsumers).toEqual(['apps/web/src/lib/utils/locale-routing.ts']);
	});

	it('delegates neutral SEO mechanics while product policy stays consumer-owned', () => {
		const boundaries = [
			['src/routes/sitemap.xml/+server.ts', "from '@yesid/seo-kit/sitemap'"],
			['src/lib/adapters/jsonld.ts', "from '@yesid/seo-kit/jsonld'"],
			['src/tests/sitemap-coverage.test.ts', "from '@yesid/gates'"],
			['src/tests/og-coverage.test.ts', "from '@yesid/gates'"],
		] as const;

		for (const [path, boundary] of boundaries) {
			expect(readFileSync(join(process.cwd(), path), 'utf8'), path).toContain(boundary);
		}
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
