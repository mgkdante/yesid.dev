import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import webConfig from '../../svelte.config.js';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CONFIG_URL =
	'https://github.com/mgkdante/yesid.dev-design/releases/download/config-v0.2.0/yesid-config-v0.2.0.tgz';
const CONFIG_LOCK_INTEGRITY =
	'sha512-UOP1BG2JaV88/EqrA2mmtlymrLV3OTOIeDqMAdZysySycERKE3OUK0oApKK1udQhGEZcMHd2xnuxNFY7gO5OnA==';
const CONFIG_BASE_DIGEST = '588a4acf72f44593561112fc945d410548b56cf556bbbc9bc745c1f7b218424f';
const MATERIALIZED_BASE = 'node_modules/.yesid-shared-tooling/turbo/base.json';
const YESID_TURBO_SEMANTIC_DIGEST =
	'e75710fea665b5304d6e4d0029588894374d3c7a07d4330dc6088d2f7d3f47b6';

const CONFIG_RECEIPT = {
	schema: 1,
	repository: 'github.com/mgkdante/yesid.dev-design',
	package: { name: '@yesid/config', version: '0.2.0' },
	tag: {
		name: 'config-v0.2.0',
		object: '4146d5b3e35d1ddefd3db003a630e14c9b3fbef9',
		peeledCommit: 'b88a519ade384c1e007aa7330638071bba2f6135',
	},
} as const;

const TSCONFIGS = [
	[
		'apps/web/tsconfig.json',
		{
			extends: ['./.svelte-kit/tsconfig.json', '@yesid/config/tsconfig/svelte-kit.json'],
		},
	],
	[
		'apps/cms/tsconfig.json',
		{
			extends: '@yesid/config/tsconfig/library.json',
			compilerOptions: {
				module: 'ESNext',
				noUncheckedIndexedAccess: true,
				esModuleInterop: true,
				resolveJsonModule: true,
				allowImportingTsExtensions: false,
				types: ['bun-types'],
				lib: ['ES2022'],
			},
			include: ['scripts/**/*', 'tests/**/*', 'fixtures/**/*'],
		},
	],
] as const;

const TURBO_OVERLAY = {
	tasks: {
		build: {
			outputs: ['.svelte-kit/**', '.vercel/**', 'dist/**'],
			env: [
				'PUBLIC_DIRECTUS_URL',
				'DIRECTUS_ADMIN_TOKEN',
				'DIRECTUS_BUILD_TOKEN',
				'DIRECTUS_DEV_BUILD_TOKEN',
				'DIRECTUS_ADMIN_EMAIL',
				'DIRECTUS_ADMIN_PASSWORD',
				'EXPORT_FALLBACKS_SKIP',
				'EXPORT_FALLBACKS_LIVE',
				'VERCEL_ENV',
				'VERCEL_GIT_COMMIT_REF',
				'OPENWEATHER_API_KEY',
			],
		},
	},
} as const;

const WEB_TURBO_CONFIG = {
	extends: ['//'],
	tasks: {
		build: {
			inputs: ['$TURBO_EXTENDS$', '!tests/**', '!playwright.config.ts'],
		},
	},
} as const;

type JsonObject = Record<string, unknown>;

function text(path: string): string {
	return readFileSync(join(REPOSITORY_ROOT, path), 'utf8');
}

function json(path: string): JsonObject {
	return JSON.parse(text(path)) as JsonObject;
}

function jsonc(path: string): JsonObject {
	return JSON.parse(text(path).replace(/^\s*\/\/.*$/gmu, '')) as JsonObject;
}

function sha256(value: string | Buffer): string {
	return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonicalize((value as JsonObject)[key])]),
		);
	}
	return value;
}

function mergeJson(base: unknown, overlay: unknown): unknown {
	if (
		base === null ||
		overlay === null ||
		typeof base !== 'object' ||
		typeof overlay !== 'object' ||
		Array.isArray(base) ||
		Array.isArray(overlay)
	) {
		return structuredClone(overlay);
	}
	const result = structuredClone(base) as JsonObject;
	for (const [key, value] of Object.entries(overlay)) {
		result[key] = Object.hasOwn(base, key)
			? mergeJson((base as JsonObject)[key], value)
			: structuredClone(value);
	}
	return result;
}

function resolveConfigRoot(): string | undefined {
	try {
		return dirname(
			createRequire(join(REPOSITORY_ROOT, 'package.json')).resolve('@yesid/config/package.json'),
		);
	} catch {
		return undefined;
	}
}

describe('yesid.dev shared-config canary', () => {
	it('pins the immutable config Release once at the workspace root', () => {
		const manifest = json('package.json') as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const resolutions = [
			manifest.dependencies?.['@yesid/config'],
			manifest.devDependencies?.['@yesid/config'],
		].filter((value): value is string => value !== undefined);

		expect(resolutions).toEqual([CONFIG_URL]);
		expect(text('bun.lock')).toContain(CONFIG_URL);
		expect(text('bun.lock')).toContain(CONFIG_LOCK_INTEGRITY);
	});

	it('installs the exact annotated-tag receipt from the Release asset', () => {
		const configRoot = resolveConfigRoot();
		expect(configRoot).toBeDefined();
		if (!configRoot) return;

		const receipt = JSON.parse(
			readFileSync(join(configRoot, '.yesid-config-release.json'), 'utf8'),
		) as JsonObject;
		expect(receipt).toEqual(CONFIG_RECEIPT);
	});

	it.each(TSCONFIGS)('%s adopts the shared preset with its exact local overlay', (path, expected) => {
		expect(jsonc(path)).toEqual(expected);
	});

	it('uses projectRunes while preserving the local Vercel and prerender policy', () => {
		const source = text('apps/web/svelte.config.js');
		expect(source).toContain("from '@yesid/config/svelte/project-runes.js'");
		expect(source).not.toContain("from 'node:path'");
		expect(source).toMatch(/adapter:\s*adapter\(\{\s*runtime:\s*'nodejs22\.x'\s*\}\)/u);
		expect(webConfig.kit?.prerender?.entries).toEqual(['*', '/llms.txt', '/llms-full.txt']);

		const runes = webConfig.compilerOptions?.runes;
		expect(runes).toBeTypeOf('function');
		if (typeof runes !== 'function') return;
		expect(runes({ filename: join(REPOSITORY_ROOT, 'apps/web/src/App.svelte') })).toBe(true);
		expect(
			runes({ filename: join(REPOSITORY_ROOT, 'apps/web/node_modules/pkg/App.svelte') }),
		).toBeUndefined();
	});

	it('keeps Turbo equal to the digest-bound shared base plus the yesid.dev overlay', () => {
		const overlayPath = '.github/shared-tooling/turbo.overlay.json';
		expect(existsSync(join(REPOSITORY_ROOT, overlayPath))).toBe(true);
		if (!existsSync(join(REPOSITORY_ROOT, overlayPath))) return;
		expect(json(overlayPath)).toEqual(TURBO_OVERLAY);

		const configRoot = resolveConfigRoot();
		expect(configRoot).toBeDefined();
		if (!configRoot) return;
		const baseBytes = readFileSync(join(configRoot, 'turbo/base.json'));
		expect(sha256(baseBytes)).toBe(CONFIG_BASE_DIGEST);
		expect(mergeJson(JSON.parse(baseBytes.toString('utf8')), json(overlayPath))).toEqual(
			json('turbo.json'),
		);
		expect(sha256(JSON.stringify(canonicalize(json('turbo.json'))))).toBe(
			YESID_TURBO_SEMANTIC_DIGEST,
		);
	});

	it('locks the web package build-input policy', () => {
		const path = 'apps/web/turbo.json';
		expect(existsSync(join(REPOSITORY_ROOT, path))).toBe(true);
		if (!existsSync(join(REPOSITORY_ROOT, path))) return;

		expect(json(path)).toEqual(WEB_TURBO_CONFIG);
	});

	it('keeps Playwright-only files out of resolved web build inputs', () => {
		const result = spawnSync(
			'bun',
			['x', 'turbo', 'run', 'build', '--filter=@repo/web', '--dry=json'],
			{
				cwd: REPOSITORY_ROOT,
				encoding: 'utf8',
			},
		);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		if (result.status !== 0) return;

		const dryRun = JSON.parse(result.stdout) as {
			tasks: Array<{
				package: string;
				task: string;
				inputs: Record<string, string>;
			}>;
		};
		const build = dryRun.tasks.find(
			(task) => task.package === '@repo/web' && task.task === 'build',
		);
		expect(build).toBeDefined();
		if (!build) return;

		const inputs = Object.keys(build.inputs);
		expect(inputs.filter((path) => path.startsWith('tests/'))).toEqual([]);
		expect(inputs).not.toContain('playwright.config.ts');
		expect(inputs).toEqual(
			expect.arrayContaining([
				'.env.example',
				'src/routes/+layout.svelte',
				'src/tests/sitemap-coverage.test.ts',
			]),
		);
	});

	it('binds the materialized base and raw overlay digest in the shared-tooling manifest', () => {
		const manifestPath = '.github/shared-tooling.json';
		const overlayPath = '.github/shared-tooling/turbo.overlay.json';
		expect(existsSync(join(REPOSITORY_ROOT, manifestPath))).toBe(true);
		if (!existsSync(join(REPOSITORY_ROOT, manifestPath))) return;
		expect(existsSync(join(REPOSITORY_ROOT, overlayPath))).toBe(true);
		if (!existsSync(join(REPOSITORY_ROOT, overlayPath))) return;

		const manifest = json(manifestPath);
		expect(manifest.schema).toBe(1);
		expect(manifest.configurations).toEqual([
			{
				mode: 'json-merge',
				sources: [
					{
						path: MATERIALIZED_BASE,
						digest: `sha256:${CONFIG_BASE_DIGEST}`,
					},
					{
						path: overlayPath,
						digest: `sha256:${sha256(readFileSync(join(REPOSITORY_ROOT, overlayPath)))}`,
					},
				],
				target: 'turbo.json',
			},
		]);
	});

	it('materializes a verified regular-file base for the drift gate', () => {
		const script = '.github/scripts/materialize-shared-config.mjs';
		expect(existsSync(join(REPOSITORY_ROOT, script))).toBe(true);
		if (!existsSync(join(REPOSITORY_ROOT, script))) return;

		const result = spawnSync(process.execPath, [script], {
			cwd: REPOSITORY_ROOT,
			encoding: 'utf8',
		});
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(JSON.parse(result.stdout)).toEqual({
			schema: 1,
			package: CONFIG_RECEIPT.package,
			tag: CONFIG_RECEIPT.tag,
			destination: MATERIALIZED_BASE,
			digest: `sha256:${CONFIG_BASE_DIGEST}`,
		});

		const destination = join(REPOSITORY_ROOT, MATERIALIZED_BASE);
		expect(existsSync(destination)).toBe(true);
		expect(sha256(readFileSync(destination))).toBe(CONFIG_BASE_DIGEST);
	});
});
