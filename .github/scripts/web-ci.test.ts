import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedFiles, required, selectE2e } from './web-ci';

describe('e2e selection', () => {
	test.each([
		[['README.md', 'AGENTS.md', 'GLOSSARY.md'], false],
		[['README.md', 'apps/web/src/app.css'], true],
		[['unknown.md'], true],
		[['.github/workflows/web.yml'], true],
		[['bun.lock'], true],
		[['package.json'], true],
		[['packages/shared/README.md'], true],
		[['contracts/guide.md'], true],
		[[], true],
	] as [string[], boolean][])('%j selects %s', (files, selected) => {
		expect(selectE2e('pull_request', () => files)).toBe(selected);
		expect(selectE2e('merge_group', () => files)).toBe(selected);
	});
	test('errors and git failures select e2e', () => {
		expect(selectE2e('pull_request', () => { throw new Error('diff failed'); })).toBe(true);
		expect(selectE2e('pull_request', () => changedFiles('a'.repeat(40), 'b'.repeat(40)))).toBe(true);
		expect(selectE2e('pull_request', () => changedFiles('', ''))).toBe(true);
		expect(selectE2e('merge_group', () => { throw new Error('unreadable group'); })).toBe(true);
		expect(selectE2e('merge_group', () => changedFiles('', ''))).toBe(true);
	});
	test.each(['workflow_dispatch', 'push', ''])('%s always selects e2e', event => {
		expect(selectE2e(event, () => ['README.md'])).toBe(true);
	});
});

test('merge groups compare the supplied base tree directly to the group head', () => {
	const repo = mkdtempSync(join(tmpdir(), 'web-ci-range-'));
	const git = (...args: string[]) => {
		const result = Bun.spawnSync(['git', '-C', repo, ...args]);
		if (result.exitCode) throw new Error(result.stderr.toString());
		return result.stdout.toString().trim();
	};
	try {
		git('init', '-b', 'main');
		git('config', 'user.name', 'Range test');
		git('config', 'user.email', 'range@example.invalid');
		writeFileSync(join(repo, 'README.md'), 'initial');
		git('add', '.'); git('commit', '-m', 'initial');
		git('branch', 'group');
		writeFileSync(join(repo, 'app.ts'), 'main change');
		git('add', '.'); git('commit', '-m', 'main advances');
		const base = git('rev-parse', 'HEAD');
		git('checkout', 'group');
		writeFileSync(join(repo, 'README.md'), 'group change');
		git('add', '.'); git('commit', '-m', 'group head');
		const head = git('rev-parse', 'HEAD');
		const classify = (event: string) => Bun.spawnSync([process.execPath,
			join(import.meta.dir, 'web-ci.ts'), 'classify'], { cwd: repo,
			env: { ...process.env, EVENT_NAME: event, BASE_SHA: base, HEAD_SHA: head, GITHUB_OUTPUT: '' } });
		expect(classify('pull_request').stdout.toString()).toBe('e2e=false\n');
		expect(classify('merge_group').stdout.toString()).toBe('e2e=true\n');
	} finally {
		rmSync(repo, { recursive: true, force: true });
	}
});

const needs = (selected = 'true', e2e = 'success') => ({
	classify: { result: 'success', outputs: { e2e: selected } },
	'ci-work': { result: 'success' },
	'prerelease-guard': { result: 'success' },
	e2e: { result: e2e },
});

describe('required CI', () => {
	test.each(['failure', 'cancelled', 'skipped', ''])('an artifact build with result %s cannot pass', result => {
		expect(required({ ...needs('false', 'skipped'), build: { result } })).toBe(false);
	});
	test('a successful artifact build is accepted', () => {
		expect(required({ ...needs(), build: { result: 'success' } })).toBe(true);
	});
	test('successful selected run passes', () => expect(required(needs(), false)).toBe(true));
	test('unexpected skip fails', () => expect(required(needs('true', 'skipped'), false)).toBe(false));
	test('label cannot permit a selected skip', () => expect(required(needs('true', 'skipped'), true)).toBe(false));
	test('docs permit skip', () => expect(required(needs('false', 'skipped'), false)).toBe(true));
	for (const job of ['classify', 'ci-work', 'e2e', 'prerelease-guard'] as const) {
		test.each(['failure', 'cancelled'])(`${job} %s fails even with label`, result => {
			const input = needs('false');
			input[job].result = result;
			expect(required(input, true)).toBe(false);
		});
	}
	test.each(['classify', 'ci-work', 'prerelease-guard'] as const)('%s must succeed', job => {
		const input = needs();
		input[job].result = 'skipped';
		expect(required(input, true)).toBe(false);
	});
	test.each(['failure', 'cancelled'])('unknown need %s fails', result => {
		expect(required({ ...needs('false', 'skipped'), extra: { result } }, true)).toBe(false);
	});
	test('missing inputs fail', () => {
		expect(required({}, true)).toBe(false);
		const { ['prerelease-guard']: guard, ...withoutGuard } = needs();
		expect(required(withoutGuard, true)).toBe(false);
		expect(required(needs('', 'skipped'), true)).toBe(false);
	});
});
