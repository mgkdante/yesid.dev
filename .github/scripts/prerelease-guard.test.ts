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
		'package.json': { devDependencies: { '@yesid/config': url('0.38.1').replace('yesid-ui-', 'yesid-config-') } },
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

test.each([
	['overrides', { '@yesid/ui': '0.39.0-rc.1' }, '@yesid/ui'],
	['overrides', { parent: { '@yesid/ui@x': '0.39.0-rc.1' } }, '@yesid/ui@x'],
	['overrides', { '@yesid/ui': { '.': '0.39.0-rc.1' } }, '.'],
	['resolutions', { 'parent>@yesid/ui': '0.39.0-rc.1' }, 'parent>@yesid/ui'],
	['dependencies', { design: 'npm:@yesid/ui@0.39.0-rc.1' }, 'design'],
	['dependencies', { design: url('0.38.1') }, 'design'],
] as const)('%s bypass fails with provenance', (field, values, key) => {
	const errors = guard(fixture({ 'package.json': { [field]: values } }));
	expect(errors).toHaveLength(1);
	for (const detail of ['package.json', field, key, 'value', 'stable release']) expect(errors[0]).toContain(detail);
});
test.each([
	'catalog:', 'workspace:*', 'file:../ui', 'link:../ui', '^0.38.1',
	'git+https://github.com/mgkdante/yesid.design.git',
	url('0.38.1+build.1.2.3-deadbeef'), url('0.38.1') + '?text=1.2.3-rc.1',
	url('0.38.1') + '#fragment', url('0.38.1', '0.38.2'),
	url('0.38.1').replace('github.com', 'example.com'),
	url('0.38.1').replace('yesid-ui-', 'yesid-config-'),
])('%s is not an exact package release URL', value => {
	expect(guard(fixture({ 'package.json': { optionalDependencies: { '@yesid/ui': value } } }))).toHaveLength(1);
});
test('stable nested overrides and resolutions pass', () => {
	expect(guard(fixture({ 'package.json': {
		overrides: { parent: { '@yesid/ui@x': url('0.38.1') }, '@yesid/ui': { '.': url('0.38.1') } },
		resolutions: { 'parent>@yesid/ui': url('0.38.1') },
	} }))).toEqual([]);
});
test('versions must agree across manifests', () => {
	const errors = guard(fixture({
		'package.json': { dependencies: { '@yesid/ui': url('0.38.1') } },
		'apps/new/package.json': { dependencies: { '@yesid/ui': url('0.38.2') } },
	}));
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('lockstep');
});
test('walk errors fail closed', () => {
	const root = fixture({});
	expect(guard(join(root, 'missing'))).toHaveLength(1);
});

test('object dependency and empty design override fail closed', () => {
	for (const field of ['dependencies', 'overrides', 'resolutions']) {
		expect(guard(fixture({ 'package.json': { [field]: { '@yesid/ui': {} } } }))).toHaveLength(1);
	}
});
test('selector uses the final target package', () => {
	expect(guard(fixture({ 'package.json': { resolutions: { '@yesid/config>@yesid/ui': url('0.38.1') } } }))).toEqual([]);
});
test('trailing newline is not an exact URL', () => {
	expect(guard(fixture({ 'package.json': { dependencies: { '@yesid/ui': url('0.38.1') + '\n' } } }))).toHaveLength(1);
});
