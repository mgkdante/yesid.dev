import { expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const workflow = readFileSync(new URL('../workflows/web.yml', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
// Exercise the actual workflow bootstrap, including both independent jobs.
const bootstraps = [...workflow.matchAll(/      - name: Materialize trusted policy[\s\S]*?        run: \|\n((?:          .*\n)+)/g)]
	.map(match => match[1]!.replace(/^          /gm, ''));
const realPolicy = readFileSync(new URL('./web-ci.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const pin = readFileSync(new URL('../../.bun-version', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';

test.each([0, 1])('trusted policy bootstrap %s uses the event base and rejects forged policy', index => {
	const script = bootstraps[index]!;
	expect(bootstraps).toHaveLength(2);
	const root = mkdtempSync(join(tmpdir(), 'web-ci-trust-'));
	const repo = join(root, 'repo');
	mkdirSync(repo);
	const git = (...args: string[]) => {
		const result = Bun.spawnSync(['git', '-C', repo, ...args]);
		if (result.exitCode) throw new Error(result.stderr.toString());
		return result.stdout.toString().trim();
	};
	const write = (path: string, value: string) => writeFileSync(join(repo, path), value);
	try {
		git('init', '-b', 'main');
		git('config', 'user.name', 'Policy test');
		git('config', 'user.email', 'policy@example.invalid');
		mkdirSync(join(repo, '.github/scripts'), { recursive: true });
		write('.github/scripts/web-ci.ts', realPolicy);
		write('.bun-version', pin);
		write('README.md', 'base');
		git('add', '.'); git('commit', '-m', 'base policy');
		const base = git('rev-parse', 'HEAD');
		git('remote', 'add', 'origin', repo);
		git('checkout', '-b', 'pr');
		write('.github/scripts/web-ci.ts', "import './forged';\n");
		write('.github/scripts/forged.ts', "console.log('e2e=false');\n");
		// PR runtime configuration must not be loaded from the checkout.
		write('bunfig.toml', 'preload = ["./.github/scripts/forged.ts"]\n');
		write('.bun-version', '0.0.0');
		git('add', '.'); git('commit', '-m', 'forge policy');
		const head = git('rev-parse', 'HEAD');
		git('checkout', 'main');
		write('README.md', 'main advanced beyond event base');
		git('add', '.'); git('commit', '-m', 'advance main');
		const mainHead = git('rev-parse', 'HEAD');
		git('checkout', 'pr');
		const run = (script: string, event: string, baseSha: string) => {
			const output = join(root, 'outputs');
			writeFileSync(output, '');
			const result = Bun.spawnSync([bash, '-c', script], {
				cwd: repo, env: { ...process.env, EVENT_NAME: event, BASE_SHA: baseSha,
					RUNNER_TEMP: root.replaceAll('\\', '/'), GITHUB_OUTPUT: output.replaceAll('\\', '/') },
			});
			return { result, outputs: readFileSync(output, 'utf8') };
		};
		for (const event of ['pull_request', 'merge_group', 'workflow_dispatch']) {
			const { result, outputs } = run(script, event, base);
			expect(result.exitCode).toBe(0);
			expect(outputs).toContain(`revision=${event === 'workflow_dispatch' ? mainHead : base}\n`);
			const directory = /^directory=(.+)$/m.exec(outputs)![1]!.trim();
			const nativeDir = process.platform === 'win32'
				? Bun.spawnSync([bash, '-c', 'cygpath -w "$1"', '--', directory]).stdout.toString().trim()
				: directory;
			expect(resolve(nativeDir).startsWith(resolve(repo))).toBe(false);
			expect(readFileSync(join(nativeDir, '.bun-version'), 'utf8')).toBe(pin);
			const env = { ...process.env, EVENT_NAME: event, BASE_SHA: base, HEAD_SHA: head,
				GITHUB_OUTPUT: '', GIT_DIR: git('rev-parse', '--absolute-git-dir'), GIT_WORK_TREE: repo };
			const classify = Bun.spawnSync([process.execPath, '.github/scripts/web-ci.ts', 'classify'], { cwd: nativeDir, env });
			expect(classify.exitCode).toBe(0);
			expect(classify.stdout.toString()).toBe('e2e=true\n');
			const required = Bun.spawnSync([process.execPath, '.github/scripts/web-ci.ts', 'required'], {
				cwd: nativeDir, env: { ...env, NEEDS: JSON.stringify({ extra: { result: 'failure' } }) },
			});
			expect(required.exitCode).toBe(1);
		}
		git('checkout', '--orphan', 'unrelated');
		git('commit', '--allow-empty', '-m', 'unrelated base');
		const unrelated = git('rev-parse', 'HEAD');
		expect(run(script, 'pull_request', unrelated).result.exitCode).not.toBe(0);
		expect(run(script, 'pull_request', '').result.exitCode).not.toBe(0);
		for (const invalidBase of [unrelated, '', 'a'.repeat(40)]) {
			const { result, outputs } = run(script, 'merge_group', invalidBase);
			expect(result.exitCode).toBe(0);
			expect(outputs).toContain('force_e2e=true\n');
			expect(outputs).toContain(`revision=${mainHead}\n`);
		}
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}, 30_000);

