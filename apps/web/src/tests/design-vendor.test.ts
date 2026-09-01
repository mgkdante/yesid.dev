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
	tag: 'v0.13.2',
	tagObject: '2809b5a33ed08cf0c2e470cbc56d2a8ac68836cb',
	peeledCommit: 'bcc628763245387c23eeeb7d81af7c0f75176421',
	assetName: 'yesid.dev-design-v0.13.2.tar',
	assetSize: 798_720,
	assetDigest: 'sha256:1376c630f0c5288c13ca671bc78073ca70e1f5d7d16287d4bc731c05847565e9',
	exclusionPolicyDigest: 'sha256:4f709f3409292c0971728a7f9cddb4ce06b8c354eed46cd5832e626b83af4300',
	toolDigest: 'sha256:650011070755661770506f51bc07f99ba6905fc62a573a4fcf0b668c00cbe2b8',
	treeHash: 'sha256:b52a34d388b0c77ab3084536912a9e2192e2e7c2a60609b4705a674b4449fced',
	manifestDigest: '843b5bd64524f2f17135ffac12de5d157ceaad67502d6a0844e5b1589876fe3d',
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

function bindingNames(name: ts.BindingName): string[] {
	if (ts.isIdentifier(name)) return [name.text];
	return name.elements.flatMap((element) =>
		ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
	);
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

function declaredNames(path: string): ReadonlySet<string> {
	const names = new Set<string>();
	const visit = (node: ts.Node): void => {
		if (
			(ts.isFunctionDeclaration(node) ||
				ts.isClassDeclaration(node) ||
				ts.isInterfaceDeclaration(node) ||
				ts.isTypeAliasDeclaration(node)) &&
			node.name
		) {
			names.add(node.name.text);
		}
		if (ts.isVariableDeclaration(node)) {
			for (const name of bindingNames(node.name)) names.add(name);
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile(path));
	return names;
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
		expect(cmsPackage.devDependencies['@yesid/i18n-core']).toBe(
			'file:../web/vendor/design/i18n-core',
		);
		expect(
			realpathSync(join(ROOT, 'apps/cms/node_modules/@yesid/i18n-core')),
		).toBe(realpathSync(join(process.cwd(), 'node_modules/@yesid/i18n-core')));
		expect(existsSync(join(ROOT, 'apps/cms/vendor/design/i18n-core'))).toBe(false);
		expect(existsSync(join(VENDOR, 'ui/src/brand/QuietModeButton.svelte'))).toBe(true);
	});

	it('keeps product analytics on the shared package boundary without duplicate mechanics', () => {
		const webSource = (path: string) => join(process.cwd(), path);
		const hasImport = (
			path: string,
			specifier: string,
			binding: string,
			kind: ModuleUse['kind'] = 'static',
		) =>
			moduleUses(webSource(path)).some(
				(use) =>
					use.specifier === specifier &&
					use.kind === kind &&
					(kind === 'dynamic' || (!use.typeOnly && use.bindings.includes(binding))),
			);

		expect(
			hasImport('src/lib/analytics/preset.ts', '@yesid/analytics/config', 'defineAnalyticsPreset'),
		).toBe(true);
		expect(
			hasImport('src/lib/analytics/client.ts', '@yesid/analytics/client', 'createAnalyticsClient'),
		).toBe(true);
		expect(
			hasImport('src/lib/analytics/client.ts', '@yesid/analytics/plausible', '', 'dynamic'),
		).toBe(true);
		expect(
			hasImport(
				'src/lib/components/analytics/Analytics.svelte',
				'@yesid/analytics/policy',
				'getAnalyticsPolicy',
			),
		).toBe(true);
		expect(
			hasImport(
				'src/lib/components/analytics/Analytics.svelte',
				'@yesid/analytics/client',
				'createPathnamePageviewTracker',
			),
		).toBe(true);
		expect(
			hasImport(
				'src/lib/components/analytics/AnalyticsConsent.svelte',
				'@yesid/analytics/policy',
				'getAnalyticsPolicy',
			),
		).toBe(true);
		expect(
			hasImport(
				'src/lib/components/layout/Footer.svelte',
				'@yesid/analytics/policy',
				'getAnalyticsPolicy',
			),
		).toBe(true);

		const clientUses = moduleUses(webSource('src/lib/analytics/client.ts'));
		expect(
			clientUses.some(
				(use) =>
					use.specifier === '@yesid/analytics/plausible' &&
					use.kind === 'static' &&
					!use.typeOnly,
			),
		).toBe(false);

		const consentUses = moduleUses(webSource('src/lib/state/analytics-consent.svelte.ts'));
		expect(
			consentUses.some(
				(use) =>
					use.specifier === '$lib/analytics/preset' &&
					!use.typeOnly &&
					use.bindings.includes('YESID_ANALYTICS_PRESET'),
			),
		).toBe(true);
		expect(consentUses.some((use) => use.specifier === '@yesid/analytics/consent')).toBe(false);

		const analyticsConsumers = productionSources()
			.filter((path) => moduleUses(path).some((use) => use.specifier.startsWith('@yesid/analytics/')))
			.map(relativeProductionPath);
		expect(analyticsConsumers).toEqual([
			'apps/web/src/lib/analytics/client.ts',
			'apps/web/src/lib/analytics/preset.ts',
			'apps/web/src/lib/components/analytics/Analytics.svelte',
			'apps/web/src/lib/components/analytics/AnalyticsConsent.svelte',
			'apps/web/src/lib/components/layout/Footer.svelte',
		]);

		expect(existsSync(join(process.cwd(), 'src/lib/analytics/policy.ts'))).toBe(false);
		expect(existsSync(join(process.cwd(), 'src/lib/analytics/transport.ts'))).toBe(false);
		expect(existsSync(join(process.cwd(), 'src/lib/utils/analytics.ts'))).toBe(false);
		const duplicateExports = new Set([
			'createAnalyticsClient',
			'createPathnamePageviewTracker',
			'getAnalyticsPolicy',
			'normalizeAnalyticsControls',
			'sanitizeAnalyticsReferrer',
			'sanitizeAnalyticsUrl',
			'sendPlausibleEvent',
		]);
		const duplicateMechanics = productionSources()
			.filter((path) => !path.endsWith('/src/lib/analytics/preset.ts'))
			.flatMap((path) =>
				[...declaredNames(path)]
					.filter((name) => duplicateExports.has(name))
					.map((name) => `${relativeProductionPath(path)}:${name}`),
			);
		expect(duplicateMechanics).toEqual([]);
	});

	it('keeps CMS locale reuse inside the repository-audit tooling boundary', () => {
		const auditPath = join(ROOT, 'apps/cms/scripts/audit-assets.ts');
		const uses = moduleUses(auditPath);
		expect(
			uses.some(
				(use) =>
					use.specifier === '@yesid/i18n-core' &&
					!use.typeOnly &&
					use.bindings.includes('createLocaleRouting'),
			),
		).toBe(true);
		expect(declaredNames(auditPath).has('localizedPublicRoute')).toBe(false);

		const i18nConsumers = productionSources()
			.filter((path) => moduleUses(path).some((use) => use.specifier === '@yesid/i18n-core'))
			.map(relativeProductionPath)
			.sort();
		expect(i18nConsumers).toEqual([
			'apps/cms/scripts/audit-assets.ts',
			'apps/web/src/lib/utils/locale-routing.ts',
		]);
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
