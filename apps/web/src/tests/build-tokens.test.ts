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

function appOwnedCss(content: string): { before: string; after: string } {
	const start = '/* ===== TOKENS:START ===== */';
	const end = '/* ===== TOKENS:END ===== */';
	const startIndex = content.indexOf(start);
	const endIndex = content.indexOf(end);
	if (startIndex < 0 || endIndex < 0) throw new Error('fixture token sentinels are missing');
	return {
		before: content.slice(0, startIndex),
		after: content.slice(endIndex + end.length),
	};
}

afterEach(() => {
	for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('product-owned token adapter', () => {
	it('depends only on public @yesid/tokens APIs and the vendored customer source', () => {
		const source = readFileSync(TOOL, 'utf8');

		expect(source).toContain("from '@yesid/tokens/parse'");
		expect(source).toContain("from '@yesid/tokens/generators/theme-block'");
		expect(source).toContain("from '@yesid/tokens/generators/design-md'");
		expect(source).not.toContain('@yesid/tokens/src/');
		expect(source).toContain('apps/web/vendor/design/tokens/tokens.json');
	});

	it('--check reports both stale product artifacts without changing either file', () => {
		const root = createFixture();
		const appCssPath = resolve(root, 'apps/web/src/app.css');
		const designPath = resolve(root, 'DESIGN.md');
		writeFileSync(
			appCssPath,
			readFileSync(appCssPath, 'utf8').replace('--font-heading:', '--font-heading-stale:'),
		);
		writeFileSync(designPath, `${readFileSync(designPath, 'utf8')}\nSTALE\n`);
		const before = {
			appCss: readFileSync(appCssPath, 'utf8'),
			design: readFileSync(designPath, 'utf8'),
		};

		const result = runTool(root, '--check');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('stale apps/web/src/app.css');
		expect(result.stderr).toContain('stale DESIGN.md');
		expect(readFileSync(appCssPath, 'utf8')).toBe(before.appCss);
		expect(readFileSync(designPath, 'utf8')).toBe(before.design);
	});

	it('writes the generated theme and public UI inventory without changing app-owned CSS', () => {
		const root = createFixture();
		const appCssPath = resolve(root, 'apps/web/src/app.css');
		const designPath = resolve(root, 'DESIGN.md');
		writeFileSync(
			appCssPath,
			readFileSync(appCssPath, 'utf8')
				.replace(
					'apps/web/vendor/design/tokens/tokens.json',
					'packages/tokens/tokens.json',
				)
				.replace('bun run tokens:build', 'bun run --cwd packages/tokens build'),
		);
		writeFileSync(designPath, 'STALE\n');
		const beforeAppCss = readFileSync(appCssPath, 'utf8');
		const immutableInputs = FIXTURE_FILES.slice(2).map((path) => [
			path,
			readFileSync(resolve(root, path), 'utf8'),
		] as const);

		const result = runTool(root);
		const appCss = readFileSync(appCssPath, 'utf8');
		const design = readFileSync(designPath, 'utf8');
		const expectedAppCss = beforeAppCss
			.replace(
				'GENERATED FROM packages/tokens/tokens.json',
				'GENERATED FROM apps/web/vendor/design/tokens/tokens.json',
			)
			.replace('bun run --cwd packages/tokens build', 'bun run tokens:build');

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('wrote apps/web/src/app.css');
		expect(result.stdout).toContain('wrote DESIGN.md');
		expect(appOwnedCss(appCss)).toEqual(appOwnedCss(beforeAppCss));
		expect(appCss).toBe(expectedAppCss);
		expect(appCss).toContain(
			'GENERATED FROM apps/web/vendor/design/tokens/tokens.json - DO NOT EDIT',
		);
		expect(design).toContain(
			'GENERATED FROM apps/web/vendor/design/tokens/tokens.json — DO NOT EDIT',
		);
		expect(design).toContain('`@yesid/ui/brand` (9 components:');
		expect(design).toContain('13 primitive subpaths');
		for (const [path, content] of immutableInputs) {
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
