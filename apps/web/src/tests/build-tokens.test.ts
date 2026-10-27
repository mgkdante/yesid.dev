import { spawnSync } from 'node:child_process';
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(process.cwd(), '../..');
const TOOL = resolve(REPO_ROOT, 'apps/web/tools/build-tokens.ts');
const FIXTURE_FILES = [
	'DESIGN.md',
	'apps/web/src/app.css',
	'apps/web/vendor/design/tokens/tokens.json',
	'apps/web/vendor/design/ui/package.json',
	'apps/web/vendor/design/ui/src/brand/index.ts',
] as const;
const temporaryRoots: string[] = [];

function createFixture(): string {
	const root = mkdtempSync(join(tmpdir(), 'yesid-build-tokens-'));
	temporaryRoots.push(root);
	for (const path of FIXTURE_FILES) {
		const target = resolve(root, path);
		mkdirSync(dirname(target), { recursive: true });
		copyFileSync(resolve(REPO_ROOT, path), target);
	}
	return root;
}

function runTool(root: string, ...args: string[]) {
	return spawnSync('bun', [TOOL, '--root', root, ...args], {
		cwd: REPO_ROOT,
		encoding: 'utf8',
	});
}

afterEach(() => {
	for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('product-owned token adapter', () => {
	it('--check reports a stale DESIGN.md without changing it', () => {
		const root = createFixture();
		const designPath = resolve(root, 'DESIGN.md');
		writeFileSync(designPath, `${readFileSync(designPath, 'utf8')}\nSTALE\n`);
		const before = readFileSync(designPath, 'utf8');

		const result = runTool(root, '--check');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('stale DESIGN.md');
		expect(readFileSync(designPath, 'utf8')).toBe(before);
	});

	it('writes DESIGN.md from the public UI inventory and leaves app.css and the inputs untouched', () => {
		const root = createFixture();
		const designPath = resolve(root, 'DESIGN.md');
		writeFileSync(designPath, 'STALE\n');
		const untouched = FIXTURE_FILES.filter((path) => path !== 'DESIGN.md').map(
			(path) => [path, readFileSync(resolve(root, path), 'utf8')] as const,
		);

		const result = runTool(root);
		const design = readFileSync(designPath, 'utf8');

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('wrote DESIGN.md');
		expect(result.stdout).not.toContain('app.css');
		expect(design).toContain(
			'GENERATED FROM apps/web/vendor/design/tokens/tokens.json — DO NOT EDIT',
		);
		expect(design).toContain('`@yesid/ui/brand` (23 components:');
		expect(design).toContain('14 primitive subpaths');
		for (const [path, content] of untouched) {
			expect(readFileSync(resolve(root, path), 'utf8'), path).toBe(content);
		}
	});

	it('is idempotent and makes the next non-mutating check pass', () => {
		const root = createFixture();

		expect(runTool(root).status).toBe(0);
		const secondWrite = runTool(root);
		const check = runTool(root, '--check');

		expect(secondWrite.status).toBe(0);
		expect(secondWrite.stdout).toContain('build idempotent (no changes)');
		expect(secondWrite.stdout).not.toContain('wrote ');
		expect(check.status).toBe(0);
		expect(check.stdout).toContain('generated token artifacts are current');
	});

	it('rejects duplicate CLI arguments with one stable diagnostic', () => {
		const root = createFixture();

		const result = runTool(root, '--check', '--check');

		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toBe('✗ build-tokens: duplicate argument: --check\n');
	});
});
