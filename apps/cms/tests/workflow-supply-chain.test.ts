import { expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = join(import.meta.dir, '..', '..', '..');

const expectedPinnedActionLines = new Map([
	[
		'actions/cache',
		'uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4',
	],
	[
		'actions/checkout',
		'uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5',
	],
	[
		'actions/download-artifact',
		'uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4',
	],
	[
		'actions/upload-artifact',
		'uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4',
	],
	[
		'oven-sh/setup-bun',
		'uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2',
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
			const expected = expectedPinnedActionLines.get(action);
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
