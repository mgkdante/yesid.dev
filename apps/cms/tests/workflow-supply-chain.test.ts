import { expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = join(import.meta.dir, '..', '..', '..');

const expectedPinnedActionLines = new Map([
	[
		'actions/cache',
		'uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0',
	],
	[
		'actions/checkout',
		'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
	],
	[
		'actions/download-artifact',
		'uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1',
	],
	[
		'actions/upload-artifact',
		'uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
	],
	[
		'oven-sh/setup-bun',
		'uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2',
	],
	[
		'mgkdante/yesid.dev-design/.github/actions/classify-paths',
		'uses: mgkdante/yesid.dev-design/.github/actions/classify-paths@bea5c51d1c8d0f123db45c018a646642a43f0f14',
	],
	[
		'mgkdante/yesid.dev-design/.github/actions/required-context',
		'uses: mgkdante/yesid.dev-design/.github/actions/required-context@bea5c51d1c8d0f123db45c018a646642a43f0f14',
	],
	[
		'mgkdante/yesid.dev-design/.github/actions/shared-tooling-drift',
		'uses: mgkdante/yesid.dev-design/.github/actions/shared-tooling-drift@bea5c51d1c8d0f123db45c018a646642a43f0f14',
	],
]);

function actionFiles(): string[] {
	const workflows = readdirSync(join(repoRoot, '.github', 'workflows'))
		.filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
		.map((name) => join(repoRoot, '.github', 'workflows', name));
	const actionsRoot = join(repoRoot, '.github', 'actions');
	const actions: string[] = [];
	const visit = (directory: string): void => {
		for (const name of readdirSync(directory)) {
			const path = join(directory, name);
			if (statSync(path).isDirectory()) visit(path);
			else if (name === 'action.yml' || name === 'action.yaml') actions.push(path);
		}
	};
	visit(actionsRoot);
	return [...workflows, ...actions].sort();
}

test('external action refs use verified commit pins with major-version comments', () => {
	const observed = new Set<string>();

	for (const path of actionFiles()) {
		for (const line of readFileSync(path, 'utf8').split('\n')) {
			const stripped = line.trim().replace(/^-\s*/, '');
			if (!stripped.startsWith('uses: ')) continue;
			const sourceRef = stripped.slice('uses: '.length).split(' # ', 1)[0]!;
			if (sourceRef.startsWith('./')) continue;
			const action = sourceRef.slice(0, sourceRef.lastIndexOf('@'));
			const expected = action === 'actions/cache' && path === join(repoRoot, '.github', 'actions', 'setup', 'action.yml')
				? 'uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4'
				: expectedPinnedActionLines.get(action);
			expect(expected, `${relative(repoRoot, path)} has unmapped external action ${sourceRef}`).toBeDefined();
			expect(stripped, relative(repoRoot, path)).toBe(expected!);
			observed.add(action);
		}
	}

	expect([...observed].sort()).toEqual([...expectedPinnedActionLines.keys()].sort());
});

test('secret scan verifies the gitleaks archive before extraction', () => {
	const workflow = readFileSync(
		join(repoRoot, '.github', 'workflows', 'secret-scan.yml'),
		'utf8',
	);
	const installStart = workflow.indexOf('      - name: Install gitleaks\n');
	const installEnd = workflow.indexOf('\n      - name: Scan ', installStart);
	const install = workflow.slice(installStart, installEnd);
	const download = 'curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" -o /tmp/gitleaks.tar.gz';
	const checksum = 'echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  /tmp/gitleaks.tar.gz" | sha256sum -c -';
	const extract = 'tar -xzf /tmp/gitleaks.tar.gz -C /tmp gitleaks';

	expect(installStart).toBeGreaterThan(-1);
	expect(installEnd).toBeGreaterThan(installStart);
	expect(install).toContain(download);
	expect(install).toContain(checksum);
	expect(install).toContain(extract);
	expect(install.indexOf(download)).toBeLessThan(install.indexOf(checksum));
	expect(install.indexOf(checksum)).toBeLessThan(install.indexOf(extract));
});
