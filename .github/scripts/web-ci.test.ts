import { describe, expect, test } from 'bun:test';
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
	});
	test('errors and git failures select e2e', () => {
		expect(selectE2e('pull_request', () => { throw new Error('diff failed'); })).toBe(true);
		expect(selectE2e('pull_request', () => changedFiles('a'.repeat(40), 'b'.repeat(40)))).toBe(true);
		expect(selectE2e('pull_request', () => changedFiles('', ''))).toBe(true);
	});
	test.each(['workflow_dispatch', 'push', ''])('%s always selects e2e', event => {
		expect(selectE2e(event, () => ['README.md'])).toBe(true);
	});
});

const needs = (selected = 'true', e2e = 'success') => ({
	classify: { result: 'success', outputs: { e2e: selected } },
	'ci-work': { result: 'success' },
	'prerelease-guard': { result: 'success' },
	e2e: { result: e2e },
});

describe('required CI', () => {
	test('successful selected run passes', () => expect(required(needs(), false)).toBe(true));
	test('unexpected skip fails', () => expect(required(needs('true', 'skipped'), false)).toBe(false));
	test('label permits skip', () => expect(required(needs('true', 'skipped'), true)).toBe(true));
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
	test('missing inputs fail', () => {
		expect(required({}, true)).toBe(false);
		const { ['prerelease-guard']: guard, ...withoutGuard } = needs();
		expect(required(withoutGuard, true)).toBe(false);
		expect(required(needs('', 'skipped'), true)).toBe(false);
	});
});
