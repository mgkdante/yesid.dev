import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { guard } from './prerelease-guard';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(files: Record<string, unknown>): string {
	const root = mkdtempSync(join(tmpdir(), 'prerelease-guard-'));
	roots.push(root);
	for (const [file, manifest] of Object.entries(files)) {
		const path = join(root, file);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, typeof manifest === 'string' ? manifest : JSON.stringify(manifest));
	}
	return root;
}
const url = (tag: string, version = tag) => `https://github.com/mgkdante/yesid.design/releases/download/v${tag}/yesid-ui-${version}.tgz`;

test('stable URLs and manifests without design dependencies pass', () => {
	expect(guard(fixture({
		'package.json': { devDependencies: { '@yesid/config': url('0.38.1') } },
		'apps/web/package.json': { dependencies: { '@yesid/ui': url('0.38.1') } },
		'packages/other/package.json': { dependencies: { other: '1.0.0-rc.1' } },
	}))).toEqual([]);
});
for (const file of ['package.json', 'apps/web/package.json', 'packages/new/package.json']) {
	test(`${file} candidate names file and package`, () => {
		const candidate = url('0.39.0-rc.1');
		const errors = guard(fixture({ [file]: { dependencies: { '@yesid/ui': candidate } } }));
		expect(errors).toHaveLength(1);
		for (const detail of [file, '@yesid/ui', candidate, 'stable release']) expect(errors[0]).toContain(detail);
	});
}
test.each([url('0.38.1', '0.39.0-beta.2'), url('0.39.0-preview', '0.38.1'), '^0.39.0-alpha.1', '0.39.0-rc.1+build'])('%s fails', candidate => {
	expect(guard(fixture({ 'package.json': { peerDependencies: { '@yesid/ui': candidate } } }))).toHaveLength(1);
});
test('unparsable JSON fails closed', () => {
	expect(guard(fixture({ 'package.json': '{' }))[0]).toContain('package.json');
});
test('unreadable manifest fails closed', () => {
	const root = fixture({});
	mkdirSync(join(root, 'package.json'));
	expect(guard(root)[0]).toContain('package.json');
});
