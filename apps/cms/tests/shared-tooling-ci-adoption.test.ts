import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '..', '..', '..');
const workflowsRoot = join(repoRoot, '.github', 'workflows');
const webPath = join(workflowsRoot, 'web.yml');
const cmsPath = join(workflowsRoot, 'cms.yml');
const secretScanPath = join(workflowsRoot, 'secret-scan.yml');
const manifestPath = join(repoRoot, '.github', 'shared-tooling.json');

const sourceRepository = 'mgkdante/yesid.dev-design';
const sourceSha = 'a4e9d0e3b42da8121b5e9f98de2e315ad48e8f25';
const sharedActions = {
	classify: '.github/actions/classify-paths',
	required: '.github/actions/required-context',
	drift: '.github/actions/shared-tooling-drift',
} as const;

const web = readFileSync(webPath, 'utf8');
const cms = readFileSync(cmsPath, 'utf8');

type MatchRules = { paths: string[]; prefixes: string[] };
type ClassifierRules = {
	schema: 1;
	always: MatchRules;
	jobs: Record<string, MatchRules>;
	ignore: { 'docs-only': MatchRules; irrelevant: MatchRules };
};

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function workflowFiles(): string[] {
	return readdirSync(workflowsRoot)
		.filter((name) => /\.ya?ml$/u.test(name))
		.map((name) => join(workflowsRoot, name))
		.sort();
}

function jobBlock(workflow: string, name: string): string | null {
	const jobsOffset = workflow.indexOf('\njobs:\n');
	const start = workflow.indexOf(`\n  ${name}:\n`, jobsOffset);
	if (jobsOffset < 0 || start < 0) return null;
	const bodyStart = start + 1;
	const next = /\n  [A-Za-z0-9_-]+:\n/gu.exec(workflow.slice(bodyStart));
	const end = next ? bodyStart + next.index : workflow.length;
	return workflow.slice(bodyStart, end).trimEnd();
}

function namedStepBlock(job: string, name: string): string | null {
	const marker = `      - name: ${name}\n`;
	const start = job.indexOf(marker);
	if (start < 0) return null;
	const next = job.indexOf('\n      - ', start + marker.length);
	return job.slice(start, next < 0 ? job.length : next).trimEnd();
}

function fromRunsOn(job: string): string | null {
	const offset = job.indexOf('    runs-on:');
	return offset < 0 ? null : `${job.slice(offset).trimEnd()}\n`;
}

function ordered(job: string, fragments: string[]): boolean {
	let cursor = 0;
	for (const fragment of fragments) {
		const offset = job.indexOf(fragment, cursor);
		if (offset < 0) return false;
		cursor = offset + fragment.length;
	}
	return true;
}

function pullRequestBlock(workflow: string): string | null {
	const match = workflow.match(
		/^  pull_request:\s*\n([\s\S]*?)(?=^  [A-Za-z0-9_-]+:\s*$|^[A-Za-z0-9_-]+:)/mu,
	);
	return match?.[0] ?? null;
}

function parseRules(workflow: string): ClassifierRules | null {
	const classify = jobBlock(workflow, 'classify');
	if (!classify) return null;
	const marker = '          rules-json: >-\n';
	const start = classify.indexOf(marker);
	if (start < 0) return null;
	const lines = classify.slice(start + marker.length).split('\n');
	const jsonLines: string[] = [];
	for (const line of lines) {
		if (line.length === 0) {
			jsonLines.push('');
			continue;
		}
		if (!line.startsWith('            ')) break;
		jsonLines.push(line.slice(12));
	}
	if (jsonLines.length === 0) return null;
	try {
		return JSON.parse(jsonLines.join('\n')) as ClassifierRules;
	} catch {
		return null;
	}
}

function matches(path: string, rules: MatchRules): boolean {
	return rules.paths.includes(path) || rules.prefixes.some((prefix) => path.startsWith(prefix));
}

function classify(
	rules: ClassifierRules,
	job: string,
	event: string,
	paths: string[],
): { relevant: boolean; reason: string } {
	if (event !== 'pull_request') return { relevant: true, reason: 'force-full' };
	if (paths.length === 0) return { relevant: false, reason: 'empty' };
	if (paths.some((path) => matches(path, rules.always))) {
		return { relevant: true, reason: 'control' };
	}
	const relevant = paths.some((path) => matches(path, rules.jobs[job]!));
	const known = paths.every(
		(path) =>
			Object.values(rules.jobs).some((candidate) => matches(path, candidate)) ||
			matches(path, rules.ignore['docs-only']) ||
			matches(path, rules.ignore.irrelevant),
	);
	if (!known) return { relevant: true, reason: 'safe-full' };
	if (relevant) return { relevant: true, reason: 'matched' };
	if (paths.every((path) => matches(path, rules.ignore['docs-only']))) {
		return { relevant: false, reason: 'docs-only' };
	}
	return { relevant: false, reason: 'irrelevant' };
}

function expectStrictRules(rules: ClassifierRules, job: string): void {
	expect(Object.keys(rules).sort()).toEqual(['always', 'ignore', 'jobs', 'schema']);
	expect(rules.schema).toBe(1);
	expect(Object.keys(rules.jobs)).toEqual([job]);
	expect(Object.keys(rules.ignore).sort()).toEqual(['docs-only', 'irrelevant']);
	for (const entry of [rules.always, rules.jobs[job], ...Object.values(rules.ignore)]) {
		expect(entry).toBeDefined();
		expect(Object.keys(entry!).sort()).toEqual(['paths', 'prefixes']);
		expect(Array.isArray(entry!.paths)).toBe(true);
		expect(Array.isArray(entry!.prefixes)).toBe(true);
	}
}

test('pins exactly five shared-tooling callers to the frozen ST3 commit', () => {
	const references: string[] = [];
	for (const path of workflowFiles()) {
		for (const line of readFileSync(path, 'utf8').split('\n')) {
			const match = line.match(/^\s*-\s+uses:\s+(mgkdante\/yesid\.dev-design\/[^\s#]+)\s*$/u);
			if (match) references.push(match[1]!);
		}
	}

	expect(references.sort()).toEqual(
		[
			`${sourceRepository}/${sharedActions.classify}@${sourceSha}`,
			`${sourceRepository}/${sharedActions.classify}@${sourceSha}`,
			`${sourceRepository}/${sharedActions.required}@${sourceSha}`,
			`${sourceRepository}/${sharedActions.required}@${sourceSha}`,
			`${sourceRepository}/${sharedActions.drift}@${sourceSha}`,
		].sort(),
	);
});

test('binds the schema-1 manifest to the same five workflow callers', () => {
	expect(existsSync(manifestPath), '.github/shared-tooling.json must exist').toBe(true);
	if (!existsSync(manifestPath)) return;
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
		schema: number;
		source: { repository: string; sha: string; gate: string };
		configurations: unknown[];
		callers: Array<{ workflow: string; action: string }>;
	};
	expect(manifest.schema).toBe(1);
	expect(manifest.source).toEqual({
		repository: sourceRepository,
		sha: sourceSha,
		gate: sharedActions.drift,
	});
	expect(manifest.configurations.length).toBeGreaterThan(0);
	expect(
		manifest.callers
			.map(({ workflow, action }) => `${workflow} -> ${action}`)
			.sort(),
	).toEqual(
		[
			`.github/workflows/cms.yml -> ${sharedActions.classify}`,
			`.github/workflows/cms.yml -> ${sharedActions.required}`,
			`.github/workflows/web.yml -> ${sharedActions.classify}`,
			`.github/workflows/web.yml -> ${sharedActions.required}`,
			`.github/workflows/web.yml -> ${sharedActions.drift}`,
		].sort(),
	);
});

test('web reports required ci after classified work without weakening E2E', () => {
	const classifier = jobBlock(web, 'classify');
	const work = jobBlock(web, 'ci-work');
	const reporter = jobBlock(web, 'ci');
	const e2e = jobBlock(web, 'e2e');
	expect(classifier, 'web classify job').not.toBeNull();
	expect(work, 'web ci-work job').not.toBeNull();
	expect(reporter, 'web ci reporter job').not.toBeNull();
	expect(e2e, 'web e2e job').not.toBeNull();
	if (!classifier || !work || !reporter || !e2e) return;

	expect(classifier).toContain('classification: ${{ steps.classify.outputs.classification }}');
	expect(classifier).toContain(
		`uses: ${sourceRepository}/${sharedActions.classify}@${sourceSha}`,
	);
	expect(work).toContain('needs: [classify]');
	expect(work).toContain(
		"if: ${{ fromJSON(needs.classify.outputs.classification).relevant['ci-work'] }}",
	);
	expect(work).toContain(`uses: ${sourceRepository}/${sharedActions.drift}@${sourceSha}`);
	expect(ordered(work, [
		'name: Type check (svelte-kit sync + svelte-check)',
		'name: Unit tests',
		'name: Content-manifest integrity (ci:content)',
		'name: Vendored design integrity (schema 2)',
		'name: Product token drift (ci:tokens)',
		'name: Product shared-package tests',
		'name: Build',
	])).toBe(true);

	expect(reporter).toContain('name: ci');
	expect(reporter).toContain('needs: [classify, ci-work]');
	expect(reporter).toContain('if: ${{ always() }}');
	expect(reporter).toContain(
		`uses: ${sourceRepository}/${sharedActions.required}@${sourceSha}`,
	);
	expect(reporter).toContain('needs-json: ${{ toJSON(needs) }}');

	expect(e2e).toContain('needs: [classify, ci]');
	expect(e2e).toContain("github.event_name == 'pull_request'");
	expect(e2e).toContain(
		"fromJSON(needs.classify.outputs.classification).relevant['ci-work']",
	);
	expect(e2e).toContain("!contains(github.event.pull_request.labels.*.name, 'skip-e2e')");
	const strategyOffset = e2e.indexOf('    strategy:\n');
	expect(strategyOffset).toBeGreaterThan(-1);
	if (strategyOffset >= 0) {
		expect(sha256(`${e2e.slice(strategyOffset).trimEnd()}\n`)).toBe(
			'6e715bb868a9510518035ad9a1f514c2719cda4eac500b5d073ab5da342d2f22',
		);
	}
});

test('web exposes the Turbo remote-cache credential only to turbo-running steps', () => {
	const jobsOffset = web.indexOf('\njobs:\n');
	expect(jobsOffset).toBeGreaterThan(-1);
	if (jobsOffset < 0) return;
	expect(web.slice(0, jobsOffset)).not.toMatch(/^env:\s*$/mu);
	expect(web.match(/^\s+TURBO_TOKEN:/gmu)?.length ?? 0).toBe(4);
	expect(web.match(/^\s+TURBO_TEAM:/gmu)?.length ?? 0).toBe(4);

	const expected = [
		['ci-work', 'Type check (svelte-kit sync + svelte-check)'],
		['ci-work', 'Unit tests'],
		['ci-work', 'Build'],
		['e2e', 'Build (turbo, cache-eligible)'],
	] as const;
	for (const [jobName, stepName] of expected) {
		const job = jobBlock(web, jobName);
		expect(job, `${jobName} job`).not.toBeNull();
		if (!job) continue;
		const step = namedStepBlock(job, stepName);
		expect(step, `${jobName}/${stepName}`).not.toBeNull();
		if (!step) continue;
		expect(step).toContain('TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}');
		expect(step).toContain('TURBO_TEAM: ${{ vars.TURBO_TEAM }}');
		expect(step).toContain('run: bun x turbo run');
	}
});

test('CMS reports required test while every downstream job still needs test', () => {
	const classifier = jobBlock(cms, 'classify');
	const work = jobBlock(cms, 'test-work');
	const reporter = jobBlock(cms, 'test');
	expect(classifier, 'CMS classify job').not.toBeNull();
	expect(work, 'CMS test-work job').not.toBeNull();
	expect(reporter, 'CMS test reporter job').not.toBeNull();
	if (!classifier || !work || !reporter) return;

	expect(classifier).toContain('classification: ${{ steps.classify.outputs.classification }}');
	expect(classifier).toContain(
		`uses: ${sourceRepository}/${sharedActions.classify}@${sourceSha}`,
	);
	expect(work).toContain('needs: [classify]');
	expect(work).toContain(
		"if: ${{ fromJSON(needs.classify.outputs.classification).relevant['test-work'] }}",
	);
	const preservedWork = fromRunsOn(work);
	expect(preservedWork).not.toBeNull();
	if (preservedWork) {
		expect(sha256(preservedWork)).toBe(
			'188df159185725ac9b40cbb53f3c2bf7b1320cf932fc31820f5e0c40b588c17a',
		);
	}

	expect(reporter).toContain('name: test');
	expect(reporter).toContain('needs: [classify, test-work]');
	expect(reporter).toContain('if: ${{ always() }}');
	expect(reporter).toContain(
		`uses: ${sourceRepository}/${sharedActions.required}@${sourceSha}`,
	);
	expect(reporter).toContain('needs-json: ${{ toJSON(needs) }}');

	for (const name of [
		'diff',
		'live-diff',
		'push',
		'legal-service-area',
		'permission-control-audit',
		'permission-policy-candidate-diagnostic',
		'permission-policy-quarantine-rename',
		'public-blog-translation-key-repair',
		'analytics-controls',
	]) {
		const downstream = jobBlock(cms, name);
		expect(downstream, `CMS ${name} job`).not.toBeNull();
		if (downstream) expect(downstream, name).toMatch(/^  [A-Za-z0-9_-]+:[\s\S]*\n    needs: test$/mu);
	}
});

test('web classifier is strict and covers the frozen fixture matrix', () => {
	const rules = parseRules(web);
	expect(rules, 'web classifier rules-json').not.toBeNull();
	if (!rules) return;
	expectStrictRules(rules, 'ci-work');

	const fixtures = [
		{ label: 'docs', event: 'pull_request', paths: ['docs/ci.md'], relevant: false, reason: 'docs-only' },
		{ label: 'web', event: 'pull_request', paths: ['apps/web/src/routes/+page.svelte'], relevant: true, reason: 'matched' },
		{ label: 'CMS', event: 'pull_request', paths: ['apps/cms/scripts/export-fallbacks.ts'], relevant: true, reason: 'matched' },
		{ label: 'shared', event: 'pull_request', paths: ['packages/shared/src/index.ts'], relevant: true, reason: 'matched' },
		{ label: 'control', event: 'pull_request', paths: ['.github/workflows/secret-scan.yml'], relevant: true, reason: 'control' },
		{ label: 'unknown', event: 'pull_request', paths: ['unclassified/new-surface.txt'], relevant: true, reason: 'safe-full' },
		{ label: 'non-PR', event: 'push', paths: ['docs/ci.md'], relevant: true, reason: 'force-full' },
	] as const;
	for (const fixture of fixtures) {
		expect(classify(rules, 'ci-work', fixture.event, [...fixture.paths]), fixture.label).toEqual({
			relevant: fixture.relevant,
			reason: fixture.reason,
		});
	}
});

test('CMS classifier is strict and covers the frozen fixture matrix', () => {
	const rules = parseRules(cms);
	expect(rules, 'CMS classifier rules-json').not.toBeNull();
	if (!rules) return;
	expectStrictRules(rules, 'test-work');

	const fixtures = [
		{ label: 'docs', event: 'pull_request', paths: ['docs/ci.md'], relevant: false, reason: 'docs-only' },
		{ label: 'web asset consumer', event: 'pull_request', paths: ['apps/web/src/routes/+page.svelte'], relevant: true, reason: 'matched' },
		{ label: 'publication asset', event: 'pull_request', paths: ['gbp-assets/en/mark-dot.dark.png'], relevant: true, reason: 'matched' },
		{ label: 'generated-content git guard', event: 'pull_request', paths: ['.githooks/pre-commit'], relevant: true, reason: 'matched' },
		{ label: 'generated-content Claude guard', event: 'pull_request', paths: ['.claude/hooks/pretool-block-generated-ts.sh'], relevant: true, reason: 'matched' },
		{ label: 'unrelated Claude config', event: 'pull_request', paths: ['.claude/settings.local.json'], relevant: false, reason: 'irrelevant' },
		{ label: 'CMS', event: 'pull_request', paths: ['apps/cms/scripts/export-fallbacks.ts'], relevant: true, reason: 'matched' },
		{ label: 'shared', event: 'pull_request', paths: ['packages/shared/src/index.ts'], relevant: true, reason: 'matched' },
		{ label: 'control', event: 'pull_request', paths: ['.github/workflows/secret-scan.yml'], relevant: true, reason: 'control' },
		{ label: 'unknown', event: 'pull_request', paths: ['unclassified/new-surface.txt'], relevant: true, reason: 'safe-full' },
		{ label: 'non-PR', event: 'push', paths: ['docs/ci.md'], relevant: true, reason: 'force-full' },
	] as const;
	for (const fixture of fixtures) {
		expect(classify(rules, 'test-work', fixture.event, [...fixture.paths]), fixture.label).toEqual({
			relevant: fixture.relevant,
			reason: fixture.reason,
		});
	}
});

test('required PR workflows remain unfiltered so reporters always appear', () => {
	for (const [name, workflow] of [
		['web', web],
		['cms', cms],
		['secret-scan', readFileSync(secretScanPath, 'utf8')],
	] as const) {
		const pullRequest = pullRequestBlock(workflow);
		expect(pullRequest, `${name} pull_request trigger`).not.toBeNull();
		if (!pullRequest) continue;
		expect(pullRequest, name).not.toMatch(/^\s+paths(?:-ignore)?:/mu);
	}
});

test('secret-scan stays byte-for-byte unchanged', () => {
	expect(sha256(readFileSync(secretScanPath, 'utf8'))).toBe(
		'27e744160de98b0ecb996ea585349f98e65a188bac7093051ca6a2c4517f00ff',
	);
});
