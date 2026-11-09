import { appendFileSync } from 'node:fs';

// Exact root documentation paths only. Re-audit consumers before expanding.
export const documentationPaths = new Set(['README.md', 'AGENTS.md', 'GLOSSARY.md']);

export function selectE2e(event: string, changed: () => string[]): boolean {
	if (event !== 'pull_request') return true;
	try {
		const files = changed();
		return files.length === 0 || files.some(file => !documentationPaths.has(file));
	} catch {
		return true;
	}
}

export function changedFiles(base: string, head: string): string[] {
	if (!/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head)) throw new Error('Invalid PR commit');
	// Both sides of a rename must be classified.
	const diff = Bun.spawnSync(['git', 'diff', '--no-renames', '--name-only', '-z', `${base}...${head}`, '--']);
	if (diff.exitCode !== 0) throw new Error('Cannot read PR diff');
	const output = diff.stdout.toString();
	if (output && !output.endsWith('\0')) throw new Error('Incomplete PR diff');
	return output ? output.slice(0, -1).split('\0') : [];
}

type Needs = Record<string, { result?: string; outputs?: Record<string, string> }>;

// Keep the legacy second argument accepted during the trusted-base rollout.
export function required(needs: Needs, _labelSkip = false): boolean {
	if (Object.values(needs).some(job => job.result === 'failure' || job.result === 'cancelled')) return false;
	if (needs['prerelease-guard']?.result !== 'success') return false;
	if (needs.classify?.result !== 'success' || needs['ci-work']?.result !== 'success') return false;
	const selected = needs.classify.outputs?.e2e;
	if (selected !== 'true' && selected !== 'false') return false;
	return needs.e2e?.result === 'success'
		|| (needs.e2e?.result === 'skipped' && selected === 'false');
}

if (import.meta.main) {
	if (process.argv[2] === 'classify') {
		const selected = selectE2e(process.env.EVENT_NAME ?? '', () => changedFiles(process.env.BASE_SHA ?? '', process.env.HEAD_SHA ?? ''));
		const output = `e2e=${selected}\n`;
		if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
		process.stdout.write(output);
	} else if (process.argv[2] === 'required') {
		try {
			const pass = required(JSON.parse(process.env.NEEDS ?? ''), false);
			process.stdout.write(pass ? 'Required CI passed\n' : 'Required CI failed\n');
			process.exitCode = pass ? 0 : 1;
		} catch {
			process.stderr.write('Invalid required CI inputs\n');
			process.exitCode = 1;
		}
	} else throw new Error('Expected classify or required');
}
