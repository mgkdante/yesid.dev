import { spawnSync } from 'node:child_process';
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = resolve(process.cwd(), '../..');
const CHECKER = resolve(REPOSITORY_ROOT, 'apps/web/scripts/check-client-payload.mjs');
const PACKAGE_JSON = resolve(REPOSITORY_ROOT, 'apps/web/package.json');
const WORKFLOW = resolve(REPOSITORY_ROOT, '.github/workflows/web.yml');
const ROOT_KEY = '.svelte-kit/generated/client-optimized/nodes/0.js';
const ENGINE_KEY = 'src/lib/components/stack-engine/Engine.svelte';
const BUDGET_ENV = [
	'ROOT_LAYOUT_ENTRY_BUDGET_GZIP',
	'ROOT_LAYOUT_PAYLOAD_BUDGET_GZIP',
	'ENGINE_CHUNK_BUDGET_GZIP',
] as const;
const temporaryRoots: string[] = [];

type ManifestRecord = {
	file: string;
	imports?: string[];
	dynamicImports?: string[];
	isDynamicEntry?: boolean;
};

type Manifest = Record<string, ManifestRecord>;

const DEFAULT_FILES: Record<string, string> = {
	'_app/immutable/nodes/0.root.js': 'export const rootLayout = "root-layout-entry";\n',
	'_app/immutable/chunks/shared.js': 'export const shared = "direct-static-import";\n',
	'_app/immutable/chunks/engine.js': 'export const engine = "lazy-engine-entry";\n',
	'_app/immutable/chunks/dynamic.js': 'export const dynamic = "ignored-dynamic-import";\n',
	'_app/immutable/chunks/stale.js': 'export const stale = "ignored-unreferenced-output";\n',
};

function defaultManifest(): Manifest {
	return {
		[ROOT_KEY]: {
			file: '_app/immutable/nodes/0.root.js',
			imports: ['_shared.js'],
			dynamicImports: ['_dynamic.js'],
			isDynamicEntry: true,
		},
		[ENGINE_KEY]: {
			file: '_app/immutable/chunks/engine.js',
			imports: ['_shared.js'],
			isDynamicEntry: true,
		},
		'_shared.js': { file: '_app/immutable/chunks/shared.js' },
		'_dynamic.js': {
			file: '_app/immutable/chunks/dynamic.js',
			isDynamicEntry: true,
		},
		'_stale.js': { file: '_app/immutable/chunks/stale.js' },
	};
}

function createRoot(): string {
	const root = mkdtempSync(join(tmpdir(), 'yesid-client-payload-'));
	temporaryRoots.push(root);
	return root;
}

function writeBuild(root: string, manifest: Manifest, files = DEFAULT_FILES): void {
	const client = resolve(root, '.svelte-kit/output/client');
	writeFile(root, '.svelte-kit/output/client/.vite/manifest.json', JSON.stringify(manifest));
	for (const [path, content] of Object.entries(files)) {
		const target = resolve(client, path);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, content);
	}
}

function writeFile(root: string, path: string, content: string): void {
	const target = resolve(root, path);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, content);
}

function fixture(
	mutate?: (manifest: Manifest, files: Record<string, string>) => void,
): { root: string; manifest: Manifest; files: Record<string, string> } {
	const root = createRoot();
	const manifest = defaultManifest();
	const files = { ...DEFAULT_FILES };
	mutate?.(manifest, files);
	writeBuild(root, manifest, files);
	return { root, manifest, files };
}

function runChecker(root: string, overrides: Record<string, string> = {}) {
	const env = { ...process.env };
	for (const name of BUDGET_ENV) delete env[name];
	return spawnSync(process.execPath, [CHECKER], {
		cwd: root,
		encoding: 'utf8',
		env: { ...env, ...overrides },
	});
}

afterEach(() => {
	for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('manifest-backed client payload budgets', () => {
	it('reports all three metrics and passes a valid build', () => {
		const { root } = fixture();

		const result = runChecker(root);

		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stderr).toBe('');
		expect(result.stdout).toContain(
			'root layout entry: _app/immutable/nodes/0.root.js — 47 bytes raw',
		);
		expect(result.stdout).toContain('root layout payload: 2 files (1 direct static import)');
		expect(result.stdout).toContain(
			'engine dynamic entry: _app/immutable/chunks/engine.js — 43 bytes raw',
		);
		expect(result.stdout).toContain('OK: client payload budgets pass');
	});

	it('counts each direct JS output once and ignores dynamic, stale, CSS, and asset outputs', () => {
		const { root } = fixture((manifest, files) => {
			manifest[ROOT_KEY].imports = ['_shared.js', '_shared.js', '_shared-alias.js'];
			manifest[ROOT_KEY].dynamicImports = ['_dynamic.js'];
			manifest['_shared-alias.js'] = { file: '_app/immutable/chunks/shared.js' };
			manifest[ROOT_KEY].file = '_app/immutable/nodes/0.root.js';
			files['_app/immutable/assets/root.css'] = 'x'.repeat(50_000);
			files['_app/immutable/assets/font.woff2'] = 'x'.repeat(50_000);
			files['_app/immutable/chunks/dynamic.js'] = 'x'.repeat(50_000);
			files['_app/immutable/chunks/stale.js'] = 'x'.repeat(50_000);
		});
		const expectedRaw =
			Buffer.byteLength(DEFAULT_FILES['_app/immutable/nodes/0.root.js']) +
			Buffer.byteLength(DEFAULT_FILES['_app/immutable/chunks/shared.js']);

		const result = runChecker(root);

		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toContain(
			`root layout payload: 2 files (1 direct static import) — ${expectedRaw} bytes raw`,
		);
	});

	it.each([
		['ROOT_LAYOUT_ENTRY_BUDGET_GZIP', 'root layout entry'],
		['ROOT_LAYOUT_PAYLOAD_BUDGET_GZIP', 'root layout payload'],
		['ENGINE_CHUNK_BUDGET_GZIP', 'engine dynamic entry'],
	])('fails when %s is exceeded', (name, metric) => {
		const { root } = fixture();

		const result = runChecker(root, { [name]: '1' });

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`FAIL: ${metric}`);
		expect(result.stderr).toContain('budget 1 bytes gzip');
	});

	it('requires the engine manifest record to be a dynamic entry', () => {
		const { root } = fixture((manifest) => {
			manifest[ENGINE_KEY].isDynamicEntry = false;
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`FAIL: ${ENGINE_KEY} is not a dynamic entry`);
	});

	it('rejects an engine output emitted as a route node', () => {
		const { root } = fixture((manifest, files) => {
			manifest[ENGINE_KEY].file = '_app/immutable/nodes/engine.js';
			files['_app/immutable/nodes/engine.js'] = files['_app/immutable/chunks/engine.js'];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: engine output is a route node');
	});

	it('rejects an engine that is directly statically reachable from the root layout', () => {
		const { root } = fixture((manifest) => {
			manifest[ROOT_KEY].imports = ['_shared.js', ENGINE_KEY];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: engine is statically reachable from the root layout');
	});

	it('rejects an engine that is transitively statically reachable from the root layout', () => {
		const { root } = fixture((manifest) => {
			manifest['_shared.js'].imports = [ENGINE_KEY];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: engine is statically reachable from the root layout');
	});

	it.each(BUDGET_ENV)('rejects invalid %s overrides', (name) => {
		const { root } = fixture();

		for (const value of ['0', '-1', '1.5', 'NaN', 'Infinity', '']) {
			const result = runChecker(root, { [name]: value });
			expect(result.status, `${name}=${value}`).toBe(1);
			expect(result.stderr).toContain(`FAIL: ${name} must be a finite positive integer`);
		}
	});

	it('fails closed when the manifest is missing', () => {
		const result = runChecker(createRoot());

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: cannot read .svelte-kit/output/client/.vite/manifest.json');
	});

	it('fails closed when the manifest is malformed', () => {
		const root = createRoot();
		writeFile(root, '.svelte-kit/output/client/.vite/manifest.json', '{not json');

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: malformed client manifest JSON');
	});

	it.each([
		[ROOT_KEY, 'root layout'],
		[ENGINE_KEY, 'engine'],
	])('fails closed when required manifest key %s is missing', (key, label) => {
		const { root } = fixture((manifest) => {
			delete manifest[key];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`FAIL: missing ${label} manifest record: ${key}`);
	});

	it('fails closed when a static import record is missing', () => {
		const { root } = fixture((manifest) => {
			manifest[ROOT_KEY].imports = ['_missing.js'];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: missing manifest record for static import: _missing.js');
	});

	it.each([
		['root layout', '_app/immutable/nodes/0.root.js'],
		['direct static import', '_app/immutable/chunks/shared.js'],
		['engine', '_app/immutable/chunks/engine.js'],
	])('fails closed when the %s output file is missing', (label, path) => {
		const { root } = fixture((_manifest, files) => {
			delete files[path];
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`FAIL: cannot read ${label} output: ${path}`);
	});

	it('fails closed when a manifest output escapes the client directory', () => {
		const { root } = fixture((manifest) => {
			manifest[ENGINE_KEY].file = '../../../../outside.js';
		});

		const result = runChecker(root);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('FAIL: engine output escapes the client directory');
	});

	it('wires the renamed checker exactly once immediately after the CI build', () => {
		const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as {
			scripts: Record<string, string>;
		};
		const workflow = readFileSync(WORKFLOW, 'utf8');
		const gate = [
			'      - name: Client payload budgets',
			'        working-directory: apps/web',
			'        run: bun run check:client-payload',
		].join('\n');

		expect(packageJson.scripts['check:client-payload']).toBe(
			'node scripts/check-client-payload.mjs',
		);
		expect(packageJson.scripts['check:engine-chunk']).toBeUndefined();
		expect(workflow.split(gate)).toHaveLength(2);

		const buildHeading = '      - name: Build';
		const buildIndex = workflow.indexOf(buildHeading);
		const gateIndex = workflow.indexOf(gate);
		const nextStepIndex = workflow.indexOf('\n      - ', buildIndex + buildHeading.length) + 1;
		expect(buildIndex).toBeGreaterThan(-1);
		expect(gateIndex).toBe(nextStepIndex);
	});
});
